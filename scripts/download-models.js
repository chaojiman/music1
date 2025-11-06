const { getRemoteHosts, loadTranslationModel, MODEL_ID } = require('../utils/model-loader');

console.log('==========================================');
console.log('  Trans22 模型预下载工具');
console.log('==========================================\n');

console.log('正在下载翻译模型...');
console.log(`模型: ${MODEL_ID}`);
console.log('大小: 约 600MB');
console.log('首次下载可能需要较长时间，请耐心等待...\n');

async function downloadModel() {
  const mirrors = getRemoteHosts();

  if (mirrors.length) {
    console.log('可用镜像列表:');
    mirrors.forEach((entry, index) => {
      const label = entry.name || `镜像 #${index + 1}`;
      console.log(` ${index + 1}. ${label} → ${entry.host}`);
    });
  }

  try {
    const { translator, name, host } = await loadTranslationModel({
      onHostAttempt: ({ name, host }) => {
        console.log(`\n👉 尝试从 ${name} (${host}) 下载模型...`);
      },
      onHostFailure: ({ name, error }) => {
        console.error(`❌ 从 ${name} 下载失败: ${error.message}`);
      },
      onHostSuccess: ({ name, host }) => {
        console.log(`\n✅ 已成功从 ${name} (${host}) 下载模型。`);
      },
    });

    console.log(`当前使用镜像: ${name} (${host})`);
    console.log('模型已缓存到本地，后续使用无需重新下载。');

    console.log('\n进行快速测试...');
    const testResult = await translator('Hello, world!', {
      src_lang: 'eng_Latn',
      tgt_lang: 'zho_Hans',
    });

    console.log(`测试翻译: "Hello, world!" → "${testResult[0].translation_text}"`);
    console.log('\n✅ 所有准备工作完成！现在可以运行 npm start 启动服务器。');
  } catch (error) {
    console.error('\n❌ 模型下载失败:', error.message);

    if (error.failures?.length) {
      console.error('\n尝试过的镜像来源:');
      error.failures.forEach((failure, index) => {
        const label = failure.name || `镜像 #${index + 1}`;
        console.error(` ${index + 1}. ${label} (${failure.host || '未知地址'}): ${failure.message}`);
      });
    }

    console.error('\n可能的原因:');
    console.error('1. 网络连接问题或被防火墙/代理阻断');
    console.error('2. 磁盘空间不足');
    console.error('3. 镜像服务不可用');

    console.error('\n提示:');
    console.error('• 可通过设置环境变量 TRANS22_MODEL_HOST 或 TRANS22_MODEL_MIRRORS 指定自定义镜像');
    console.error('  示例: TRANS22_MODEL_HOST=https://hf-mirror.com npm run download');
    console.error('• 或直接启动服务，首次请求时模型会自动尝试加载');

    console.error('\n注意: 即使下载失败，前端翻译功能仍可能在首次使用时自动下载。');
    process.exit(1);
  }
}

downloadModel();
