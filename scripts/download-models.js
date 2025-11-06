const { pipeline, env } = require('@xenova/transformers');

console.log('==========================================');
console.log('  Trans22 模型预下载工具');
console.log('==========================================\n');

console.log('正在下载翻译模型...');
console.log('模型: Xenova/nllb-200-distilled-600M');
console.log('大小: 约 600MB');
console.log('首次下载可能需要较长时间，请耐心等待...\n');

async function downloadModel() {
    try {
        env.localModelPath = 'D:/test/music1/local_models';
        env.allowRemoteModels = false;
        const translator = await pipeline('translation', 'Xenova/nllb-200-distilled-600M');
        
        console.log('\n✅ 模型下载成功！');
        console.log('模型已缓存到本地，后续使用无需重新下载。');
        
        console.log('\n进行快速测试...');
        const testResult = await translator('Hello, world!', {
            src_lang: 'eng_Latn',
            tgt_lang: 'zho_Hans'
        });
        
        console.log(`测试翻译: "Hello, world!" → "${testResult[0].translation_text}"`);
        console.log('\n✅ 所有准备工作完成！现在可以运行 npm start 启动服务器。');
        
    } catch (error) {
        console.error('\n❌ 模型下载失败:', error.message);
        console.error('\n可能的原因:');
        console.error('1. 网络连接问题');
        console.error('2. 磁盘空间不足');
        console.error('3. 防火墙或代理设置');
        console.error('\n注意: 即使下载失败，前端翻译功能仍可能在首次使用时自动下载。');
        process.exit(1);
    }
}

downloadModel();
