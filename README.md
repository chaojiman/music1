# 🌍 Trans22 离线翻译工具

Trans22 是一个基于本地 AI 模型的离线翻译工具，支持 28 种语言。无需网络连接，隐私保护，响应速度快。

![Trans22 Banner](https://img.shields.io/badge/Trans22-离线翻译-blue?style=for-the-badge)
![Languages](https://img.shields.io/badge/语言支持-28种-green?style=for-the-badge)
![Privacy](https://img.shields.io/badge/隐私保护-100%25-red?style=for-the-badge)

## ✨ 主要功能

### 1. 🎯 智能语言选择
- 下拉框选择目标语言
- **默认：🇨🇳 中文简体**
- 28种语言支持

### 2. 🌍 双模式翻译
- **单语言翻译**：选择特定语言快速翻译
- **全语言翻译**：同时翻译到28种语言

### 3. 📊 实时监控
- 访问服务器状态监控页面
- 查看服务器运行时间
- 查看翻译请求日志

### 4. 🔒 隐私保护
- 100% 离线翻译
- 文本不离开设备
- 无需担心数据泄露

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务器

```bash
# 直接启动
npm start

# 或开发模式（自动重启）
npm run dev
```

服务器启动后，访问 http://localhost:3000 即可使用。

## 📝 使用方法

### 前端翻译（推荐，完全可用）

1. 打开 http://localhost:3000
2. 在文本框输入英文内容
3. 选择目标语言（默认中文简体）
4. 点击 **"🎯 翻译到选中语言"**
5. 查看并复制翻译结果

### 全语言翻译

1. 输入英文文本
2. 点击 **"🌍 翻译到所有语言"**
3. 等待处理（可能需要几分钟）
4. 查看所有28种语言的翻译结果

### 预下载模型（可选）

```bash
# 预下载后端模型
npm run download
```

注意：后端模型下载可能受网络限制，但**不影响前端翻译使用**。

## 📂 项目结构

```
trans22/
├── server.js              # Express 服务器
├── package.json           # 项目配置
├── public/                # 前端文件
│   ├── index.html        # 主页面
│   ├── styles.css        # 样式文件
│   └── app.js            # 前端逻辑
└── scripts/              # 工具脚本
    └── download-models.js # 模型下载脚本
```

## 🎯 支持语言（28种）

| 区域 | 语言 |
|------|------|
| 🌏 东亚 | 中文简体、中文繁体、日语、韩语 |
| 🌍 欧洲 | 英语、西班牙语、法语、德语、意大利语、葡萄牙语、俄语、荷兰语、瑞典语、波兰语、挪威语、芬兰语、丹麦语、捷克语、罗马尼亚语、匈牙利语、希腊语、乌克兰语 |
| 🌎 中东/南亚 | 阿拉伯语、印地语、土耳其语、希伯来语 |
| 🌏 东南亚 | 印尼语、泰语、越南语 |

## 🔧 API 接口

### 翻译到单一语言

```bash
POST /api/translate
Content-Type: application/json

{
  "text": "Hello, world!",
  "targetLang": "zh-CN",
  "sourceLang": "en"
}
```

### 翻译到所有语言

```bash
POST /api/translate-all
Content-Type: application/json

{
  "text": "Hello, world!",
  "sourceLang": "en"
}
```

### 获取服务器状态

```bash
GET /api/status
```

### 获取支持的语言列表

```bash
GET /api/languages
```

## 💡 优势特点

- ✅ **100% 离线**：无需网络连接，随时随地使用
- ✅ **隐私保护**：文本不离开设备，完全本地处理
- ✅ **快速响应**：本地 AI 模型，响应速度快
- ✅ **多语言支持**：支持28种主流语言
- ✅ **易于使用**：简洁界面，一键翻译
- ✅ **开源免费**：完全开源，可自由修改和分发

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **AI 模型**: Xenova Transformers (NLLB-200)
- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **模型**: Meta NLLB-200 (No Language Left Behind)

## 📊 系统要求

- Node.js 14+ 
- 2GB+ 可用内存
- 2GB+ 磁盘空间（用于模型缓存）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- Meta AI - NLLB-200 模型
- Xenova - Transformers.js 库
- 所有贡献者和用户

---

**🔒 您的隐私，我们的承诺：所有翻译完全离线进行，数据绝不离开您的设备！**
