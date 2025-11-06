const { pipeline, env } = require('@xenova/transformers');

const DEFAULT_MODEL_ID = 'Xenova/nllb-200-distilled-600M';
const MODEL_ID = (process.env.TRANS22_MODEL_ID || DEFAULT_MODEL_ID).trim();

const DEFAULT_REMOTE_HOSTS = [
  { name: 'Hugging Face Hub', host: 'https://huggingface.co/' },
  { name: 'HF Mirror (hf-mirror.com)', host: 'https://hf-mirror.com/' },
];

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function normalizeHost(value) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const hasProtocol = /^https?:\/\//i.test(trimmed);
  const normalized = hasProtocol ? trimmed : `https://${trimmed}`;
  return ensureTrailingSlash(normalized);
}

function parseCustomMirrors(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => normalizeHost(item))
    .filter(Boolean)
    .map((host, index) => ({
      name: `自定义镜像 #${index + 1}`,
      host,
    }));
}

function getRemoteHosts() {
  const candidates = [];
  const seen = new Set();

  function addHost(host, name) {
    const normalized = normalizeHost(host);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    candidates.push({ name, host: normalized });
  }

  const primaryCustomHost =
    process.env.TRANS22_MODEL_HOST ||
    process.env.HF_ENDPOINT ||
    process.env.HUGGINGFACE_ENDPOINT;

  if (primaryCustomHost) {
    addHost(primaryCustomHost, '自定义主镜像');
  }

  const customMirrors = parseCustomMirrors(process.env.TRANS22_MODEL_MIRRORS);
  customMirrors.forEach(({ host, name }) => addHost(host, name));

  DEFAULT_REMOTE_HOSTS.forEach(({ host, name }) => addHost(host, name));

  return candidates;
}

async function loadTranslationModel({
  task = 'translation',
  model = MODEL_ID,
  pipelineOptions,
  onHostAttempt,
  onHostSuccess,
  onHostFailure,
} = {}) {
  const remoteHosts = getRemoteHosts();

  if (!remoteHosts.length) {
    throw new Error('未找到可用的模型镜像地址。');
  }

  const errors = [];

  for (const entry of remoteHosts) {
    const displayName = entry.name || entry.host;

    try {
      env.remoteHost = entry.host;
      onHostAttempt?.({ host: entry.host, name: displayName });

      const translator = await pipeline(task, model, pipelineOptions);

      onHostSuccess?.({ host: entry.host, name: displayName });
      return {
        translator,
        host: entry.host,
        name: displayName,
        modelId: model,
      };
    } catch (error) {
      errors.push({ entry, error });
      onHostFailure?.({ host: entry.host, name: displayName, error });
    }
  }

  const lastError = errors.length ? errors[errors.length - 1].error : null;
  const aggregatedMessage = `无法从任何镜像下载模型 (${model})。最后一次错误: ${
    lastError?.message || '未知错误'
  }`;

  const aggregatedError = new Error(aggregatedMessage);
  aggregatedError.failures = errors.map(({ entry, error }) => ({
    host: entry.host,
    name: entry.name,
    message: error.message,
  }));

  // 保持默认远程地址，避免影响后续逻辑
  const fallbackHost = remoteHosts[0]?.host;
  if (fallbackHost) {
    env.remoteHost = fallbackHost;
  }

  throw aggregatedError;
}

module.exports = {
  DEFAULT_MODEL_ID,
  MODEL_ID,
  DEFAULT_REMOTE_HOSTS,
  getRemoteHosts,
  loadTranslationModel,
};
