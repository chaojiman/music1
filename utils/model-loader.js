const { pipeline, env } = require('@xenova/transformers');

// 配置本地模型路径
env.localModelPath = 'D:/test/music1/local_models';
env.allowRemoteModels = false;

let translator = null;
let isModelLoading = false;
let modelLoadError = null;

async function loadTranslationModel() {
  if (translator) return translator;
  if (isModelLoading) {
    while (isModelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return translator;
  }

  isModelLoading = true;
  try {
    console.log('正在加载翻译模型...');
    translator = await pipeline('translation', 'Xenova/nllb-200-distilled-600M');
    console.log('模型加载成功！');
    modelLoadError = null;
  } catch (error) {
    console.error('模型加载失败:', error.message);
    modelLoadError = error.message;
    translator = null;
  } finally {
    isModelLoading = false;
  }
  return translator;
}

const MODEL_ID = 'Xenova/nllb-200-distilled-600M';

module.exports = {
  loadTranslationModel,
  MODEL_ID,
  getModel: () => translator,
  isModelLoading: () => isModelLoading,
  getModelLoadError: () => modelLoadError,
};
