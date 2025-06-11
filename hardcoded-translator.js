/**
 * Minecraft模组硬编码汉化工具
 * 作者：饩雨
 * 独立的硬编码检测和翻译功能
 */

class HardcodedTranslator {
    constructor() {
        this.currentFile = null;
        this.jarData = null;
        this.hardcodedStrings = [];
        this.isScanning = false;
        this.translationResults = {};
        
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.log('硬编码汉化工具初始化完成', 'success');
    }

    setupEventListeners() {
        // 文件上传相关
        const uploadArea = document.getElementById('hardcodedUploadArea');
        const fileInput = document.getElementById('hardcodedFileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // AI配置
        document.getElementById('hardcodedAiProvider').addEventListener('change', this.handleProviderChange.bind(this));
        document.getElementById('hardcodedApiKey').addEventListener('input', this.handleApiKeyInput.bind(this));

        // 检测配置变化
        ['detectComponentLiteral', 'detectStringLiterals', 'detectTooltips', 'minLength', 'excludeNumbers', 'excludeSingleChar'].forEach(id => {
            document.getElementById(id).addEventListener('change', this.updateStepStatus.bind(this));
        });

        // 操作按钮
        document.getElementById('startHardcodedScan').addEventListener('click', this.startScan.bind(this));
        document.getElementById('runDemo').addEventListener('click', this.runDemo.bind(this));
        document.getElementById('selectAll').addEventListener('click', this.selectAll.bind(this));
        document.getElementById('selectNone').addEventListener('click', this.selectNone.bind(this));
        document.getElementById('exportReport').addEventListener('click', this.exportReport.bind(this));
        document.getElementById('downloadModified').addEventListener('click', this.downloadModified.bind(this));

        // 日志清空
        document.getElementById('clearHardcodedLog').addEventListener('click', this.clearLog.bind(this));

        this.updateStepStatus();
    }

    // ==================== 文件处理 ====================

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('hardcodedUploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('hardcodedUploadArea').classList.remove('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        document.getElementById('hardcodedUploadArea').classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        if (!file.name.endsWith('.jar')) {
            this.log('请选择.jar格式的文件', 'error');
            return;
        }

        if (file.size > 30 * 1024 * 1024) {
            this.log('文件大小超过30MB限制', 'error');
            return;
        }

        this.currentFile = file;
        this.showFileInfo(file);
        
        try {
            // 读取JAR文件
            const arrayBuffer = await file.arrayBuffer();
            this.jarData = await JSZip.loadAsync(arrayBuffer);
            
            this.log(`JAR文件加载成功: ${file.name}`, 'success');
            this.markStepCompleted('step1');
            this.updateStepStatus();
            
        } catch (error) {
            this.log(`文件加载失败: ${error.message}`, 'error');
        }
    }

    showFileInfo(file) {
        document.getElementById('hardcodedFileName').textContent = file.name;
        document.getElementById('hardcodedFileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('hardcodedFileInfo').style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // ==================== 步骤管理 ====================

    markStepCompleted(stepId) {
        const stepElement = document.getElementById(stepId);
        const stepNumber = document.getElementById(stepId + 'Number');
        
        stepElement.classList.add('completed');
        stepNumber.classList.add('completed');
        stepNumber.textContent = '✓';
    }

    updateStepStatus() {
        // 检查步骤完成状态
        const hasFile = this.currentFile !== null;
        const hasDetectionConfig = this.getDetectionSettings().enabledTypes.length > 0;
        const hasApiConfig = this.validateApiConfig();

        // 更新按钮状态
        document.getElementById('startHardcodedScan').disabled = !(hasFile && hasDetectionConfig && hasApiConfig);

        // 标记已完成的步骤
        if (hasDetectionConfig) {
            this.markStepCompleted('step2');
        }
        if (hasApiConfig) {
            this.markStepCompleted('step3');
        }
    }

    getDetectionSettings() {
        const enabledTypes = [];
        if (document.getElementById('detectComponentLiteral').checked) enabledTypes.push('component');
        if (document.getElementById('detectStringLiterals').checked) enabledTypes.push('string');
        if (document.getElementById('detectTooltips').checked) enabledTypes.push('tooltip');

        return {
            enabledTypes,
            minLength: parseInt(document.getElementById('minLength').value) || 3,
            excludeNumbers: document.getElementById('excludeNumbers').checked,
            excludeSingleChar: document.getElementById('excludeSingleChar').checked
        };
    }

    // ==================== AI配置 ====================

    handleProviderChange() {
        this.updateStepStatus();
    }

    handleApiKeyInput() {
        this.updateStepStatus();
    }

    validateApiConfig() {
        const provider = document.getElementById('hardcodedAiProvider').value;
        const apiKey = document.getElementById('hardcodedApiKey').value.trim();
        
        const statusElement = document.getElementById('hardcodedApiKeyStatus');
        
        if (!apiKey) {
            statusElement.textContent = '';
            statusElement.className = 'api-key-status';
            return false;
        }

        let isValid = false;
        
        switch (provider) {
            case 'openai-gpt35':
            case 'openai-gpt4':
                isValid = apiKey.startsWith('sk-') && apiKey.length > 20;
                break;
            case 'deepseek':
                isValid = apiKey.length > 10;
                break;
            case 'google':
                isValid = apiKey.length > 10;
                break;
            case 'custom':
                isValid = apiKey.length > 5;
                break;
        }

        if (isValid) {
            statusElement.textContent = '✓ 有效';
            statusElement.className = 'api-key-status valid';
        } else {
            statusElement.textContent = '✗ 无效';
            statusElement.className = 'api-key-status invalid';
        }

        return isValid;
    }

    // ==================== 硬编码扫描 ====================

    async startScan() {
        if (this.isScanning) return;
        
        this.isScanning = true;
        this.hardcodedStrings = [];
        this.translationResults = {};

        const scanButton = document.getElementById('startHardcodedScan');
        const spinner = scanButton.querySelector('.loading-spinner');
        const text = scanButton.querySelector('.btn-text');
        
        scanButton.disabled = true;
        spinner.style.display = 'inline-block';
        text.textContent = '扫描中...';

        try {
            // 显示进度
            document.getElementById('scanProgress').style.display = 'block';
            document.getElementById('scanResults').style.display = 'none';

            // 扫描硬编码文本
            await this.scanHardcodedStrings();
            
            // 翻译找到的文本
            if (this.hardcodedStrings.length > 0) {
                await this.translateHardcodedStrings();
            }

            // 显示结果
            this.displayResults();
            
            this.log(`扫描完成，找到 ${this.hardcodedStrings.length} 个硬编码文本`, 'success');
            
        } catch (error) {
            this.log(`扫描失败: ${error.message}`, 'error');
        } finally {
            this.isScanning = false;
            scanButton.disabled = false;
            spinner.style.display = 'none';
            text.textContent = '开始扫描硬编码文本';
            document.getElementById('scanProgress').style.display = 'none';
        }
    }

    async scanHardcodedStrings() {
        const settings = this.getDetectionSettings();
        const classFiles = [];

        // 收集所有class文件
        this.jarData.forEach((relativePath, file) => {
            if (relativePath.endsWith('.class')) {
                classFiles.push({ path: relativePath, file });
            }
        });

        this.log(`找到 ${classFiles.length} 个class文件，开始扫描...`, 'info');
        
        let processed = 0;
        for (const { path, file } of classFiles) {
            try {
                const bytecode = await file.async('uint8array');
                const strings = this.extractStringsFromBytecode(bytecode, path, settings);
                this.hardcodedStrings.push(...strings);
                
                processed++;
                const progress = (processed / classFiles.length) * 100;
                this.updateScanProgress(progress, `扫描中... ${processed}/${classFiles.length}`);
                
                // 添加小延迟避免阻塞UI
                if (processed % 10 === 0) {
                    await this.delay(10);
                }
                
            } catch (error) {
                this.log(`扫描文件失败 ${path}: ${error.message}`, 'warning');
            }
        }

        // 去重和过滤
        this.hardcodedStrings = this.deduplicateStrings(this.hardcodedStrings);
        this.log(`去重后剩余 ${this.hardcodedStrings.length} 个硬编码文本`, 'info');
    }    extractStringsFromBytecode(bytecode, filePath, settings) {
        const strings = [];
        
        try {
            // 将字节码转换为字符串进行正则匹配
            const content = this.bytesToString(bytecode);
            
            // 使用正则表达式查找所有双引号和单引号内的字符串
            const stringPatterns = [
                /"([^"\\]|\\.)*"/g,  // 双引号字符串，支持转义
                /'([^'\\]|\\.)*'/g   // 单引号字符串，支持转义
            ];
            
            for (const pattern of stringPatterns) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const fullMatch = match[0];
                    // 提取引号内的内容
                    const stringContent = fullMatch.slice(1, -1); // 去掉首尾引号
                    
                    if (this.isValidHardcodedString(stringContent, settings)) {
                        // 在原始字节码中查找这个字符串的实际位置
                        const byteOffset = this.findStringOffsetInBytecode(bytecode, fullMatch);
                        
                        strings.push({
                            text: stringContent,
                            originalText: fullMatch,
                            location: filePath,
                            type: this.detectStringType(stringContent),
                            offset: byteOffset,
                            length: fullMatch.length
                        });
                    }
                }
            }
            
        } catch (e) {
            console.error('字节码解析错误:', e);
        }
        
        return strings;
    }

    bytesToString(bytes) {
        // 使用UTF-8解码
        try {
            return new TextDecoder('utf-8').decode(bytes);
        } catch (e) {
            // 回退到简单的ASCII解码
            let result = '';
            for (let i = 0; i < bytes.length; i++) {
                const byte = bytes[i];
                if (byte >= 32 && byte <= 126) {
                    result += String.fromCharCode(byte);
                } else {
                    result += '?';
                }
            }
            return result;
        }
    }

    isValidHardcodedString(str, settings) {
        // 长度检查
        if (str.length < settings.minLength) return false;
        
        // 单字符检查
        if (settings.excludeSingleChar && str.length === 1) return false;
        
        // 纯数字检查
        if (settings.excludeNumbers && /^\d+$/.test(str)) return false;
        
        // 必须包含英文字母
        if (!/[a-zA-Z]/.test(str)) return false;
        
        // 排除常见的技术标识符
        if (/^[a-z_]+\.[a-z_]+/.test(str)) return false; // 包名
        if (/^[A-Z_]+$/.test(str) && str.length < 4) return false; // 常量名
        if (/\.(class|java|json|png|jpg|mcmeta)$/.test(str)) return false; // 文件扩展名
        if (/^minecraft:/.test(str)) return false; // Minecraft命名空间
        
        // 至少包含一个大写字母或空格（用户界面文本的特征）
        return /[A-Z\s]/.test(str);
    }

    detectStringType(text) {
        if (text.includes('Component.literal')) return 'component';
        if (text.includes('tooltip') || text.includes('Tooltip')) return 'tooltip';
        if (text.includes(' ')) return 'gui'; // 包含空格通常是界面文本
        return 'string';
    }

    deduplicateStrings(strings) {
        const seen = new Set();
        return strings.filter(item => {
            if (seen.has(item.text)) {
                return false;
            }
            seen.add(item.text);
            return true;
        });
    }

    updateScanProgress(percentage, text) {
        document.getElementById('scanProgressFill').style.width = percentage + '%';
        document.getElementById('scanProgressText').textContent = text;
    }

    // ==================== 翻译功能 ====================

    async translateHardcodedStrings() {
        if (this.hardcodedStrings.length === 0) return;

        this.updateScanProgress(0, '正在翻译...');

        const provider = document.getElementById('hardcodedAiProvider').value;
        const apiKey = document.getElementById('hardcodedApiKey').value;

        const batchSize = 10;
        const uniqueTexts = [...new Set(this.hardcodedStrings.map(item => item.text))];
        
        for (let i = 0; i < uniqueTexts.length; i += batchSize) {
            const batch = uniqueTexts.slice(i, i + batchSize);
            
            try {
                const translations = await this.callTranslationAPI(batch, provider, apiKey);
                
                batch.forEach((text, index) => {
                    this.translationResults[text] = translations[index] || text;
                });
                
                const progress = ((i + batchSize) / uniqueTexts.length) * 100;
                this.updateScanProgress(Math.min(progress, 100), `翻译中... ${Math.min(i + batchSize, uniqueTexts.length)}/${uniqueTexts.length}`);
                
                // 添加延迟避免API限制
                if (i + batchSize < uniqueTexts.length) {
                    await this.delay(1000);
                }
                
            } catch (error) {
                this.log(`翻译批次失败: ${error.message}`, 'warning');
                // 失败时保持原文
                batch.forEach(text => {
                    this.translationResults[text] = text;
                });
            }
        }
    }

    async callTranslationAPI(texts, provider, apiKey) {
        let apiUrl, requestBody, headers;
        
        switch (provider) {
            case 'deepseek':
                apiUrl = 'https://api.deepseek.com/v1/chat/completions';
                requestBody = {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '请将以下Minecraft模组硬编码文本准确翻译为中文，保持原有格式，只返回翻译结果，用换行符分隔。'
                        },
                        {
                            role: 'user',
                            content: texts.join('\n')
                        }
                    ],
                    temperature: 0.3
                };
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                break;
                
            case 'openai-gpt35':
                apiUrl = 'https://api.openai.com/v1/chat/completions';
                requestBody = {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: '请将以下Minecraft模组硬编码文本准确翻译为中文，保持原有格式，只返回翻译结果，用换行符分隔。'
                        },
                        {
                            role: 'user',
                            content: texts.join('\n')
                        }
                    ],
                    temperature: 0.3
                };
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                break;
                
            case 'openai-gpt4':
                apiUrl = 'https://api.openai.com/v1/chat/completions';
                requestBody = {
                    model: 'gpt-4',
                    messages: [
                        {
                            role: 'system',
                            content: '请将以下Minecraft模组硬编码文本准确翻译为中文，保持原有格式，只返回翻译结果，用换行符分隔。'
                        },
                        {
                            role: 'user',
                            content: texts.join('\n')
                        }
                    ],
                    temperature: 0.3
                };
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                break;
                
            default:
                throw new Error('不支持的翻译提供商');
        }
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        let translatedText;
        
        if (provider.startsWith('openai') || provider === 'deepseek') {
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API响应格式错误');
            }
            translatedText = data.choices[0].message.content;
        } else {
            translatedText = data.translations ? data.translations[0].text : texts.join('\n');
        }
        
        const translations = translatedText.split('\n').map(t => t.trim()).filter(t => t);
        
        // 确保返回的翻译数量与输入一致
        while (translations.length < texts.length) {
            translations.push(texts[translations.length]);
        }
        
        return translations.slice(0, texts.length);
    }

    // ==================== 结果显示 ====================

    displayResults() {
        document.getElementById('scanResults').style.display = 'block';
        
        // 显示统计信息
        this.displayStats();
        
        // 显示硬编码列表
        this.displayHardcodedList();
        
        this.markStepCompleted('step4');
    }

    displayStats() {
        const statsContainer = document.getElementById('resultStats');
        const totalCount = this.hardcodedStrings.length;
        const translatedCount = Object.keys(this.translationResults).length;
        const componentCount = this.hardcodedStrings.filter(item => item.type === 'component').length;
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${totalCount}</div>
                <div class="stat-label">总计硬编码文本</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${translatedCount}</div>
                <div class="stat-label">已翻译</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${componentCount}</div>
                <div class="stat-label">Component调用</div>
            </div>
        `;
    }

    displayHardcodedList() {
        const listContainer = document.getElementById('hardcodedList');
        
        if (this.hardcodedStrings.length === 0) {
            listContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">未发现硬编码文本</div>';
            return;
        }
        
        const listHTML = this.hardcodedStrings.map((item, index) => {
            const translation = this.translationResults[item.text] || item.text;
            return `                <div class="hardcoded-item">
                    <input type="checkbox" class="string-checkbox" value="${index}" checked>
                    <div class="hardcoded-content">
                        <div class="hardcoded-original">${this.escapeHtml(item.text)}</div>
                        <div class="hardcoded-translation">${this.escapeHtml(translation)}</div>
                        <div class="hardcoded-context">${item.type} | ${item.location}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        listContainer.innerHTML = listHTML;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== 用户操作 ====================

    selectAll() {
        const checkboxes = document.querySelectorAll('.string-checkbox');
        checkboxes.forEach(checkbox => checkbox.checked = true);
    }

    selectNone() {
        const checkboxes = document.querySelectorAll('.string-checkbox');
        checkboxes.forEach(checkbox => checkbox.checked = false);
    }    exportReport() {
        const selectedItems = [];
        const checkboxes = document.querySelectorAll('.string-checkbox:checked');
        
        checkboxes.forEach(checkbox => {
            const index = parseInt(checkbox.value);
            const item = this.hardcodedStrings[index];
            selectedItems.push({
                original: item.text,
                translation: this.translationResults[item.text] || item.text,
                type: item.type,
                location: item.location
            });
        });

        const report = {
            timestamp: new Date().toISOString(),
            fileName: this.currentFile ? this.currentFile.name : 'unknown',
            totalCount: this.hardcodedStrings.length,
            selectedCount: selectedItems.length,
            items: selectedItems
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hardcoded-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.log(`导出报告成功，包含 ${selectedItems.length} 个项目`, 'success');
    }    async downloadModified() {
        if (!this.jarData || this.hardcodedStrings.length === 0) {
            this.log('没有可修改的数据', 'error');
            return;
        }

        try {
            this.log('开始生成修改后的JAR文件...', 'info');
              // 获取选中的翻译项
            const checkedItems = document.querySelectorAll('.string-checkbox:checked');
            if (checkedItems.length === 0) {
                this.log('请先选择要替换的字符串', 'warning');
                return;
            }

            // 克隆原始JAR数据
            const modifiedJar = await JSZip.loadAsync(this.jarData.clone());
            let modifiedCount = 0;            // 遍历选中的项进行替换
            for (const checkbox of checkedItems) {
                const index = parseInt(checkbox.value);
                const stringInfo = this.hardcodedStrings[index];
                const translatedText = this.translationResults[stringInfo.text];
                
                if (!translatedText || translatedText === stringInfo.text) {
                    continue; // 跳过未翻译或翻译相同的项
                }

                try {
                    // 获取文件
                    const file = modifiedJar.file(stringInfo.location);
                    if (!file) {
                        this.log(`文件不存在: ${stringInfo.location}`, 'warning');
                        continue;
                    }

                    // 读取文件内容
                    const fileContent = await file.async('uint8array');
                    
                    // 执行字节码替换
                    const modifiedContent = this.replaceStringInBytecode(
                        fileContent, 
                        stringInfo.originalText, 
                        `"${translatedText}"`
                    );

                    if (modifiedContent) {
                        // 更新文件
                        modifiedJar.file(stringInfo.location, modifiedContent);
                        modifiedCount++;
                        this.log(`替换成功: ${stringInfo.text} → ${translatedText}`, 'success');
                    } else {
                        this.log(`替换失败: ${stringInfo.text}`, 'warning');
                    }
                } catch (error) {
                    this.log(`处理文件 ${stringInfo.location} 时出错: ${error.message}`, 'error');
                }
            }

            if (modifiedCount === 0) {
                this.log('没有成功替换任何字符串', 'warning');
                return;
            }

            // 生成修改后的JAR文件
            const blob = await modifiedJar.generateAsync({ type: 'blob' });
            
            // 创建下载链接
            const originalName = this.currentFile.name.replace('.jar', '');
            const downloadName = `${originalName}-硬编码汉化版.jar`;
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.log(`下载完成: ${downloadName} (修改了 ${modifiedCount} 个字符串)`, 'success');
            
        } catch (error) {
            this.log(`生成修改文件失败: ${error.message}`, 'error');
        }
    }

    // 在字节码中替换字符串
    replaceStringInBytecode(bytecode, originalString, newString) {
        try {
            // 将字符串转换为字节数组
            const originalBytes = new TextEncoder().encode(originalString);
            const newBytes = new TextEncoder().encode(newString);
            
            // 查找原始字符串在字节码中的位置
            const offset = this.findBytesInBytecode(bytecode, originalBytes);
            if (offset === -1) {
                return null; // 未找到
            }

            // 创建新的字节数组
            const result = new Uint8Array(bytecode.length - originalBytes.length + newBytes.length);
            
            // 复制替换前的部分
            result.set(bytecode.slice(0, offset), 0);
            
            // 插入新字符串
            result.set(newBytes, offset);
            
            // 复制替换后的部分
            result.set(bytecode.slice(offset + originalBytes.length), offset + newBytes.length);
            
            return result;
        } catch (error) {
            console.error('字节码替换错误:', error);
            return null;
        }
    }

    // 在字节码中查找字节序列
    findBytesInBytecode(bytecode, searchBytes) {
        for (let i = 0; i <= bytecode.length - searchBytes.length; i++) {
            let match = true;
            for (let j = 0; j < searchBytes.length; j++) {
                if (bytecode[i + j] !== searchBytes[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return i;
            }
        }
        return -1;
    }

    // ==================== 演示功能 ====================

    async runDemo() {
        this.log('运行硬编码检测演示...', 'info');
        
        // 模拟扫描过程
        document.getElementById('scanProgress').style.display = 'block';
        
        for (let i = 0; i <= 100; i += 10) {
            this.updateScanProgress(i, `演示扫描... ${i}%`);
            await this.delay(200);
        }
        
        // 模拟找到的硬编码文本
        this.hardcodedStrings = [
            {
                text: "Magic Wand",
                location: "com/example/mod/items/MagicWand.class",
                type: "gui",
                offset: 1024
            },
            {
                text: "A powerful magical item",
                location: "com/example/mod/items/MagicWand.class",
                type: "tooltip",
                offset: 1056
            },
            {
                text: "Enchanted Sword",
                location: "com/example/mod/items/EnchantedSword.class",
                type: "component",
                offset: 512
            },
            {
                text: "Right-click to activate",
                location: "com/example/mod/items/BaseItem.class",
                type: "string",
                offset: 768
            },
            {
                text: "Configuration",
                location: "com/example/mod/gui/ConfigScreen.class",
                type: "gui",
                offset: 256
            }
        ];
        
        // 模拟翻译结果
        this.translationResults = {
            "Magic Wand": "魔法棒",
            "A powerful magical item": "一个强大的魔法物品",
            "Enchanted Sword": "附魔剑",
            "Right-click to activate": "右键点击激活",
            "Configuration": "配置"
        };
        
        document.getElementById('scanProgress').style.display = 'none';
        this.displayResults();
        
        this.log('演示完成！发现 5 个硬编码文本', 'success');
    }

    // ==================== 工具函数 ====================

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message, type = 'info') {
        const logContent = document.getElementById('hardcodedLogContent');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `<span style="color: #666;">[${timestamp}]</span> ${message}`;
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
    }

    clearLog() {
        document.getElementById('hardcodedLogContent').innerHTML = '';
    }
}

// 初始化硬编码翻译工具
document.addEventListener('DOMContentLoaded', () => {
    window.hardcodedTranslator = new HardcodedTranslator();
});
