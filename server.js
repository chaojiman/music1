const express = require('express');
const path = require('path');
const { loadTranslationModel, MODEL_ID } = require('./utils/model-loader');

// 修复Windows控制台中文乱码问题
if (process.platform === 'win32') {
  // 设置控制台代码页为UTF-8
  try {
    const { execSync } = require('child_process');
    execSync('chcp 65001', { stdio: 'ignore' });
  } catch (e) {
    // 忽略错误
  }
  
  // 设置输出流编码
  if (process.stdout.isTTY) {
    try {
      process.stdout.setDefaultEncoding('utf8');
    } catch (e) {}
  }
  if (process.stderr.isTTY) {
    try {
      process.stderr.setDefaultEncoding('utf8');
    } catch (e) {}
  }
}

const app = express();
const PORT = 3000;

let translator = null;
let isModelLoading = false;
let modelLoadError = null;
let modelSource = null;
let modelLoadFailures = [];
const startTime = Date.now();
const requestLogs = [];

app.use(express.json());
app.use(express.static('public'));

async function loadModel() {
  if (translator) return translator;
  if (isModelLoading) {
    while (isModelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return translator;
  }

  isModelLoading = true;
  modelLoadFailures = [];

  try {
    console.log(`正在加载翻译模型 (${MODEL_ID})...`);
    const result = await loadTranslationModel({
      onHostAttempt: ({ name, host }) => {
        console.log(`尝试从 ${name} (${host}) 加载模型...`);
      },
      onHostFailure: ({ name, error }) => {
        console.warn(`从 ${name} 加载失败: ${error.message}`);
      },
    });

    translator = result.translator;
    modelSource = { name: result.name, host: result.host };
    modelLoadError = null;
    console.log(`模型加载成功！来源: ${result.name} (${result.host})`);
  } catch (error) {
    console.error('模型加载失败:', error.message);
    translator = null;
    modelSource = null;
    modelLoadError = error.message;
    modelLoadFailures = error.failures || [];

    if (modelLoadFailures.length) {
      modelLoadFailures.forEach((failure, index) => {
        const label = failure.name || failure.host || `镜像 #${index + 1}`;
        console.error(`  [${index + 1}] ${label}: ${failure.message}`);
      });
    }
  } finally {
    isModelLoading = false;
  }
  return translator;
}

const languageMap = {
  'zh-CN': { code: 'zho_Hans', name: '🇨🇳 中文简体' },
  'zh-TW': { code: 'zho_Hant', name: '🇹🇼 中文繁体' },
  'en': { code: 'eng_Latn', name: '🇺🇸 英语' },
  'ja': { code: 'jpn_Jpan', name: '🇯🇵 日语' },
  'ko': { code: 'kor_Hang', name: '🇰🇷 韩语' },
  'es': { code: 'spa_Latn', name: '🇪🇸 西班牙语' },
  'fr': { code: 'fra_Latn', name: '🇫🇷 法语' },
  'de': { code: 'deu_Latn', name: '🇩🇪 德语' },
  'it': { code: 'ita_Latn', name: '🇮🇹 意大利语' },
  'pt': { code: 'por_Latn', name: '🇵🇹 葡萄牙语' },
  'ru': { code: 'rus_Cyrl', name: '🇷🇺 俄语' },
  'ar': { code: 'arb_Arab', name: '🇸🇦 阿拉伯语' },
  'hi': { code: 'hin_Deva', name: '🇮🇳 印地语' },
  'id': { code: 'ind_Latn', name: '🇮🇩 印尼语' },
  'th': { code: 'tha_Thai', name: '🇹🇭 泰语' },
  'vi': { code: 'vie_Latn', name: '🇻🇳 越南语' },
  'tr': { code: 'tur_Latn', name: '🇹🇷 土耳其语' },
  'nl': { code: 'nld_Latn', name: '🇳🇱 荷兰语' },
  'sv': { code: 'swe_Latn', name: '🇸🇪 瑞典语' },
  'pl': { code: 'pol_Latn', name: '🇵🇱 波兰语' },
  'no': { code: 'nob_Latn', name: '🇳🇴 挪威语' },
  'fi': { code: 'fin_Latn', name: '🇫🇮 芬兰语' },
  'da': { code: 'dan_Latn', name: '🇩🇰 丹麦语' },
  'cs': { code: 'ces_Latn', name: '🇨🇿 捷克语' },
  'ro': { code: 'ron_Latn', name: '🇷🇴 罗马尼亚语' },
  'hu': { code: 'hun_Latn', name: '🇭🇺 匈牙利语' },
  'el': { code: 'ell_Grek', name: '🇬🇷 希腊语' },
  'he': { code: 'heb_Hebr', name: '🇮🇱 希伯来语' },
  'uk': { code: 'ukr_Cyrl', name: '🇺🇦 乌克兰语' }
};

app.get('/api/languages', (req, res) => {
  const languages = Object.keys(languageMap).map(key => ({
    code: key,
    name: languageMap[key].name
  }));
  res.json({ languages });
});

app.post('/api/translate', async (req, res) => {
  const { text, targetLang, sourceLang = 'en' } = req.body;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    text: text.substring(0, 50),
    targetLang,
    status: 'pending'
  };
  requestLogs.push(logEntry);
  if (requestLogs.length > 100) requestLogs.shift();

  if (!text || !targetLang) {
    logEntry.status = 'error';
    return res.status(400).json({ error: '缺少必要参数' });
  }

  if (!languageMap[targetLang]) {
    logEntry.status = 'error';
    return res.status(400).json({ error: '不支持的目标语言' });
  }

  try {
    const model = await loadModel();
    if (!model) {
      logEntry.status = 'error';
      return res.status(503).json({ 
        error: '模型未加载',
        details: modelLoadError 
      });
    }

    const sourceCode = languageMap[sourceLang]?.code || 'eng_Latn';
    const targetCode = languageMap[targetLang].code;

    const result = await model(text, {
      src_lang: sourceCode,
      tgt_lang: targetCode
    });

    logEntry.status = 'success';
    res.json({ 
      translation: result[0].translation_text,
      targetLang,
      sourceLang
    });
  } catch (error) {
    logEntry.status = 'error';
    console.error('翻译错误:', error);
    res.status(500).json({ 
      error: '翻译失败',
      details: error.message 
    });
  }
});

app.post('/api/translate-all', async (req, res) => {
  const { text, sourceLang = 'en' } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: '缺少文本参数' });
  }

  try {
    const model = await loadModel();
    if (!model) {
      return res.status(503).json({ 
        error: '模型未加载',
        details: modelLoadError 
      });
    }

    const sourceCode = languageMap[sourceLang]?.code || 'eng_Latn';
    const translations = {};

    for (const [langCode, langInfo] of Object.entries(languageMap)) {
      if (langCode === sourceLang) continue;
      
      try {
        const result = await model(text, {
          src_lang: sourceCode,
          tgt_lang: langInfo.code
        });
        translations[langCode] = {
          name: langInfo.name,
          translation: result[0].translation_text
        };
      } catch (error) {
        translations[langCode] = {
          name: langInfo.name,
          translation: `翻译失败: ${error.message}`
        };
      }
    }

    res.json({ translations });
  } catch (error) {
    console.error('批量翻译错误:', error);
    res.status(500).json({ 
      error: '批量翻译失败',
      details: error.message 
    });
  }
});

app.get('/api/status', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: 'running',
    modelLoaded: !!translator,
    modelLoading: isModelLoading,
    modelError: modelLoadError,
    modelSource,
    modelFailures: modelLoadFailures,
    modelId: MODEL_ID,
    uptime,
    totalRequests: requestLogs.length,
    recentLogs: requestLogs.slice(-10)
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║          🌍 Trans22 离线翻译工具启动成功！            ║
╠═══════════════════════════════════════════════════════╣
║  访问地址: http://localhost:${PORT}                     ║
║  状态监控: http://localhost:${PORT}/api/status          ║
╠═══════════════════════════════════════════════════════╣
║  ✨ 28种语言支持 | 🔒 100%离线 | ⚡ 快速响应          ║
╚═══════════════════════════════════════════════════════╝
  `);
  
  loadModel().catch(err => {
    console.error('后台加载模型失败，将在首次请求时重试:', err.message);
  });
});
