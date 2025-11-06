let languages = [];
let statusCheckInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    loadLanguages();
    checkStatus();
    statusCheckInterval = setInterval(checkStatus, 3000);
    
    const inputText = document.getElementById('inputText');
    inputText.addEventListener('input', updateCharCount);
    
    document.getElementById('translateBtn').addEventListener('click', translateToSelected);
    document.getElementById('translateAllBtn').addEventListener('click', translateToAll);
});

function updateCharCount() {
    const text = document.getElementById('inputText').value;
    document.getElementById('charCount').textContent = text.length;
}

async function loadLanguages() {
    try {
        const response = await fetch('/api/languages');
        const data = await response.json();
        languages = data.languages;
        
        const select = document.getElementById('targetLang');
        select.innerHTML = '';
        
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.name;
            if (lang.code === 'zh-CN') {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        const languageList = document.getElementById('languageList');
        languageList.innerHTML = '';
        languages.forEach(lang => {
            const span = document.createElement('span');
            span.textContent = lang.name;
            languageList.appendChild(span);
        });
    } catch (error) {
        console.error('加载语言列表失败:', error);
    }
}

async function checkStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        const indicator = document.getElementById('statusIndicator');
        const modelStatus = document.getElementById('modelStatus');
        
        if (data.modelLoading) {
            indicator.className = 'status-loading';
            indicator.textContent = '⏳ 模型加载中...';
            modelStatus.textContent = '加载中...';
        } else if (data.modelLoaded) {
            indicator.className = 'status-ready';
            indicator.textContent = '✅ 模型已就绪';
            modelStatus.textContent = '✅ 已就绪';
            document.getElementById('translateBtn').disabled = false;
            document.getElementById('translateAllBtn').disabled = false;
        } else {
            indicator.className = 'status-error';
            indicator.textContent = '❌ 模型加载失败';
            modelStatus.textContent = '❌ 未加载';
        }
        
        document.getElementById('uptime').textContent = `运行时间: ${formatUptime(data.uptime)}`;
        document.getElementById('runtimeDisplay').textContent = formatUptime(data.uptime);
        document.getElementById('requestCount').textContent = data.totalRequests || 0;
    } catch (error) {
        console.error('获取状态失败:', error);
    }
}

function formatUptime(seconds) {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    return `${Math.floor(seconds / 3600)}小时 ${Math.floor((seconds % 3600) / 60)}分钟`;
}

async function translateToSelected() {
    const text = document.getElementById('inputText').value.trim();
    const targetLang = document.getElementById('targetLang').value;
    
    if (!text) {
        alert('请输入要翻译的文本');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                targetLang,
                sourceLang: 'en'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSingleResult(data.translation, targetLang);
        } else {
            alert(`翻译失败: ${data.error}`);
            hideLoading();
        }
    } catch (error) {
        console.error('翻译错误:', error);
        alert('翻译请求失败，请检查网络连接');
        hideLoading();
    }
}

async function translateToAll() {
    const text = document.getElementById('inputText').value.trim();
    
    if (!text) {
        alert('请输入要翻译的文本');
        return;
    }
    
    if (!confirm('翻译到所有28种语言可能需要几分钟时间，是否继续？')) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('/api/translate-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                sourceLang: 'en'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAllResults(data.translations);
        } else {
            alert(`批量翻译失败: ${data.error}`);
            hideLoading();
        }
    } catch (error) {
        console.error('批量翻译错误:', error);
        alert('批量翻译请求失败，请检查网络连接');
        hideLoading();
    }
}

function showLoading() {
    document.getElementById('singleResult').style.display = 'none';
    document.getElementById('allResults').style.display = 'none';
    document.getElementById('loadingIndicator').style.display = 'flex';
    document.getElementById('translateBtn').disabled = true;
    document.getElementById('translateAllBtn').disabled = true;
}

function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('translateBtn').disabled = false;
    document.getElementById('translateAllBtn').disabled = false;
}

function showSingleResult(translation, langCode) {
    hideLoading();
    
    const lang = languages.find(l => l.code === langCode);
    const langName = lang ? lang.name : langCode;
    
    document.getElementById('resultLangName').textContent = langName;
    document.getElementById('resultText').textContent = translation;
    
    document.getElementById('singleResult').style.display = 'block';
    document.getElementById('allResults').style.display = 'none';
    
    document.getElementById('singleResult').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
    });
}

function showAllResults(translations) {
    hideLoading();
    
    const container = document.getElementById('allResults');
    container.innerHTML = '';
    
    Object.entries(translations).forEach(([langCode, data]) => {
        const item = document.createElement('div');
        item.className = 'result-item';
        
        const header = document.createElement('div');
        header.className = 'result-item-header';
        header.textContent = data.name;
        
        const text = document.createElement('div');
        text.className = 'result-item-text';
        text.textContent = data.translation;
        
        item.appendChild(header);
        item.appendChild(text);
        container.appendChild(item);
    });
    
    document.getElementById('singleResult').style.display = 'none';
    document.getElementById('allResults').style.display = 'grid';
    
    container.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
    });
}

function copyResult() {
    const text = document.getElementById('resultText').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.btn-copy');
        const originalText = btn.textContent;
        btn.textContent = '✅ 已复制';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请手动选择文本复制');
    });
}

window.addEventListener('beforeunload', () => {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
});
