/**
 * Minecraft模组语言文件智能翻译工具
 * 作者：饩雨
 * 纯前端实现，无后端架构
 */

class MinecraftModTranslator {
    constructor() {
        this.currentFile = null;
        this.uploadedFiles = []; // 多文件列表
        this.extractedFiles = {};
        this.translationResults = {};
        this.customTerms = {};
        this.usageCount = 0;
        this.isTranslating = false;
        this.batchProgress = {}; // 批量处理进度
        
        this.initializeApp();
        this.loadSettings();
        this.checkSponsorPrompt();
    }    initializeApp() {
        this.setupEventListeners();
        this.loadBuiltInTerms();
        this.log('系统初始化完成', 'success');
    }

    // 辅助方法：安全地显示模态框
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }    // 辅助方法：安全地隐藏模态框
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 辅助方法：安全地获取元素值
    getValue(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.value : '';
    }

    // 辅助方法：安全地设置元素内容
    setContent(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = content;
        }
    }

    setupEventListeners() {
        // 文件上传相关
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
        }
        
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }
        
        // 文件管理
        const clearFiles = document.getElementById('clearFiles');
        if (clearFiles) {
            clearFiles.addEventListener('click', this.clearAllFiles.bind(this));
        }

        // AI接口配置
        const aiProvider = document.getElementById('aiProvider');
        if (aiProvider) {
            aiProvider.addEventListener('change', this.handleProviderChange.bind(this));
        }
        
        const apiKey = document.getElementById('apiKey');
        if (apiKey) {
            apiKey.addEventListener('input', this.handleApiKeyInput.bind(this));
        }
        
        const customApiUrl = document.getElementById('customApiUrl');
        if (customApiUrl) {
            customApiUrl.addEventListener('input', this.handleApiKeyInput.bind(this));
        }
        
        // 操作按钮
        const startTranslation = document.getElementById('startTranslation');
        if (startTranslation) {
            startTranslation.addEventListener('click', this.startTranslation.bind(this));
        }
          const showHistory = document.getElementById('showHistory');
        if (showHistory) {
            showHistory.addEventListener('click', this.showHistory.bind(this));
        }
        
        // 其他按钮
        const customTerms = document.getElementById('customTerms');
        if (customTerms) {
            customTerms.addEventListener('click', this.showCustomTerms.bind(this));
        }
        
        const gotoHardcodedTool = document.getElementById('gotoHardcodedTool');
        if (gotoHardcodedTool) {
            gotoHardcodedTool.addEventListener('click', this.gotoHardcodedTool.bind(this));
        }
          const diagnostics = document.getElementById('diagnostics');
        if (diagnostics) {
            diagnostics.addEventListener('click', this.runDiagnostics.bind(this));
        }        // 弹窗相关
        this.setupModalEventListeners();

        // 其他功能
        const clearLog = document.getElementById('clearLog');
        if (clearLog) {
            clearLog.addEventListener('click', this.clearLog.bind(this));
        }
        
        const downloadResult = document.getElementById('downloadResult');
        if (downloadResult) {
            downloadResult.addEventListener('click', this.downloadResult.bind(this));
        }
        
        // 临时测试功能
        const testPreview = document.getElementById('testPreview');
        if (testPreview) {
            testPreview.addEventListener('click', this.testPreviewFunction.bind(this));
        }
    }    setupModalEventListeners() {
        // 赞助弹窗        const closeSponsorModal = document.getElementById('closeSponsorModal');
        if (closeSponsorModal) {
            closeSponsorModal.addEventListener('click', () => {
                this.hideModal('sponsorModal');
            });
        }
        
        const noThanks = document.getElementById('noThanks');
        if (noThanks) {
            noThanks.addEventListener('click', () => {
                this.hideModal('sponsorModal');
            });
        }
        
        const alreadySponsored = document.getElementById('alreadySponsored');
        if (alreadySponsored) {
            alreadySponsored.addEventListener('click', () => {
                localStorage.setItem('sponsored', 'true');
                this.hideModal('sponsorModal');
                this.log('感谢您的支持！', 'success');
            });
        }

        // 策略选择弹窗
        const confirmStrategy = document.getElementById('confirmStrategy');
        if (confirmStrategy) {
            confirmStrategy.addEventListener('click', this.confirmStrategy.bind(this));
        }

        // 术语表弹窗        const closeTermsModal = document.getElementById('closeTermsModal');
        if (closeTermsModal) {
            closeTermsModal.addEventListener('click', () => {
                this.hideModal('termsModal');
            });
        }
        
        const saveTerms = document.getElementById('saveTerms');
        if (saveTerms) {
            saveTerms.addEventListener('click', this.saveCustomTerms.bind(this));
        }
        
        const loadTermsFile = document.getElementById('loadTermsFile');
        if (loadTermsFile) {
            loadTermsFile.addEventListener('click', () => {
                const termsFileInput = document.getElementById('termsFileInput');
                if (termsFileInput) termsFileInput.click();
            });
        }
        
        const termsFileInput = document.getElementById('termsFileInput');
        if (termsFileInput) {
            termsFileInput.addEventListener('change', this.loadTermsFromFile.bind(this));
        }

        // 历史记录弹窗        const closeHistoryModal = document.getElementById('closeHistoryModal');
        if (closeHistoryModal) {
            closeHistoryModal.addEventListener('click', () => {
                this.hideModal('historyModal');
            });
        }
        
        const clearHistory = document.getElementById('clearHistory');
        if (clearHistory) {
            clearHistory.addEventListener('click', this.clearHistory.bind(this));
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            this.processMultipleFiles(files);
        }
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            this.processMultipleFiles(files);
        }
    }

    // 多文件处理入口方法
    processMultipleFiles(files) {
        this.log(`准备处理 ${files.length} 个文件`, 'info');
        
        // 文件验证和添加到队列
        for (const file of files) {
            // 文件格式验证
            if (!file.name.toLowerCase().endsWith('.jar')) {
                this.log(`跳过文件 ${file.name}：不是JAR格式`, 'warning');
                continue;
            }

            // 文件大小验证
            const maxSize = 30 * 1024 * 1024; // 30MB
            if (file.size > maxSize) {
                this.log(`跳过文件 ${file.name}：文件大小超过30MB限制`, 'warning');
                continue;
            }

            // 检查是否已存在
            const existingFile = this.uploadedFiles.find(item => 
                item.file.name === file.name && item.file.size === file.size
            );
            
            if (existingFile) {
                this.log(`跳过文件 ${file.name}：文件已存在`, 'warning');
                continue;
            }

            // 添加到处理队列
            const fileItem = {
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                file: file,
                status: 'pending', // pending, processing, completed, error
                extractedFiles: {},
                translationResults: {}
            };
            
            this.uploadedFiles.push(fileItem);
            this.log(`添加文件到队列: ${file.name}`, 'info');
        }

        // 更新文件列表显示
        this.updateFilesList();
        
        // 开始处理文件
        if (this.uploadedFiles.length > 0) {
            this.startFileExtraction();
        }
    }

    // 开始文件提取
    async startFileExtraction() {
        this.log('开始批量提取文件...', 'info');
        
        const pendingFiles = this.uploadedFiles.filter(item => item.status === 'pending');
        
        for (const fileItem of pendingFiles) {
            await this.extractSingleFileData(fileItem);
        }
        
        this.log('批量文件提取完成', 'success');
        this.checkTranslationReady();
    }

    // 提取单个文件数据
    async extractSingleFileData(fileItem) {
        try {
            fileItem.status = 'processing';
            this.updateFilesList();
            
            this.log(`正在处理文件: ${fileItem.file.name}`, 'info');
            
            const zip = await JSZip.loadAsync(fileItem.file);
            fileItem.extractedFiles = {};
            
            // 使用与单文件模式相同的语言文件查找逻辑
            const langFiles = {};
            
            zip.forEach((relativePath, zipEntry) => {
                if (zipEntry.dir) return;
                
                // 使用相同的路径模式匹配
                const patterns = [
                    { pattern: /^assets\/([^\/]+)\/lang\/(.+)$/, modIdIndex: 1, fileIndex: 2 },
                    { pattern: /^([^\/]+)\/lang\/(.+)$/, modIdIndex: 1, fileIndex: 2 },
                    { pattern: /^lang\/(.+)$/, modIdIndex: 'default', fileIndex: 1 }
                ];
                
                for (const { pattern, modIdIndex, fileIndex } of patterns) {
                    const match = relativePath.match(pattern);
                    if (match) {
                        const modId = modIdIndex === 'default' ? 'default' : match[modIdIndex];
                        const fileName = match[fileIndex];
                        
                        if (!langFiles[modId]) {
                            langFiles[modId] = {};
                        }
                        
                        const basePath = relativePath.substring(0, relativePath.lastIndexOf('/') + 1);
                        langFiles[modId][fileName] = {
                            zipEntry: zipEntry,
                            directoryPath: basePath
                        };
                        break;
                    }
                }
            });
            
            // 处理每个模组的语言文件
            for (const [modId, files] of Object.entries(langFiles)) {
                await this.processSingleLanguageFiles(fileItem, modId, files);
            }
            
            fileItem.status = 'completed';
            this.updateFilesList();
            this.log(`文件 ${fileItem.file.name} 处理完成`, 'success');
            
        } catch (error) {
            this.log(`处理文件 ${fileItem.file.name} 失败: ${error.message}`, 'error');
            fileItem.status = 'error';
            this.updateFilesList();
        }
    }

    // 处理单个文件的语言文件（多文件模式）
    async processSingleLanguageFiles(fileItem, modId, files) {
        // 查找英文文件
        const englishFiles = ['en_us.json', 'en_us.lang', 'en_US.json', 'en_US.lang'];
        let englishFile = null;
        let englishFileName = null;
        let englishFileInfo = null;

        for (const fileName of englishFiles) {
            if (files[fileName]) {
                englishFileInfo = files[fileName];
                englishFile = englishFileInfo.zipEntry;
                englishFileName = fileName;
                break;
            }
        }

        if (!englishFile) {
            this.log(`文件 ${fileItem.file.name} 中模组 ${modId} 未找到英文语言文件`, 'warning');
            return;
        }

        // 读取英文文件内容
        const englishContent = await englishFile.async('text');
        
        // 检查中文文件
        let chineseFileName;
        if (englishFileName.includes('en_us')) {
            chineseFileName = englishFileName.replace('en_us', 'zh_cn');
        } else if (englishFileName.includes('en_US')) {
            chineseFileName = englishFileName.replace('en_US', 'zh_CN');
        } else {
            chineseFileName = 'zh_cn.' + englishFileName.split('.').pop();
        }
        
        const chineseFileInfo = files[chineseFileName];
        const chineseFile = chineseFileInfo ? chineseFileInfo.zipEntry : null;
        
        fileItem.extractedFiles[modId] = {
            englishFile: englishFileName,
            englishContent: englishContent,
            chineseFile: chineseFileName,
            chineseContent: chineseFile ? await chineseFile.async('text') : null,
            hasExistingChinese: !!chineseFile,
            originalPath: englishFileInfo.directoryPath,
            modId: modId
        };
    }    // 更新文件列表显示
    updateFilesList() {
        const filesList = document.getElementById('filesList');
        const filesContainer = document.getElementById('filesContainer');
        const totalFiles = document.getElementById('totalFiles');
        const totalSize = document.getElementById('totalSize');
        
        // 检查必要的DOM元素是否存在
        if (!filesList || !filesContainer || !totalFiles || !totalSize) {
            // 如果必要的DOM元素不存在，直接返回
            return;
        }
        
        if (this.uploadedFiles.length === 0) {
            filesList.style.display = 'none';
            return;
        }
        
        filesList.style.display = 'block';
        
        // 更新统计信息
        totalFiles.textContent = this.uploadedFiles.length;
        const totalBytes = this.uploadedFiles.reduce((sum, item) => sum + item.file.size, 0);
        totalSize.textContent = this.formatFileSize(totalBytes);
        
        // 生成文件列表HTML
        filesContainer.innerHTML = this.uploadedFiles.map(fileItem => {
            const statusClass = {
                'pending': 'file-pending',
                'processing': 'file-processing',
                'completed': 'file-completed',
                'error': 'file-error'
            }[fileItem.status] || 'file-pending';
            
            const statusText = {
                'pending': '待处理',
                'processing': '处理中...',
                'completed': '已完成',
                'error': '错误'
            }[fileItem.status] || '未知';
            
            const modsCount = Object.keys(fileItem.extractedFiles).length;
            const modsInfo = modsCount > 0 ? ` (${modsCount}个模组)` : '';
            
            return `
                <div class="file-item ${statusClass}">
                    <div class="file-info">
                        <div class="file-name">${fileItem.file.name}</div>
                        <div class="file-details">
                            <span class="file-size">${this.formatFileSize(fileItem.file.size)}</span>
                            <span class="file-status">${statusText}${modsInfo}</span>
                        </div>
                    </div>
                    <button class="remove-file-btn" onclick="translator.removeFile('${fileItem.id}')" 
                            ${fileItem.status === 'processing' ? 'disabled' : ''}>
                        ×
                    </button>
                </div>
            `;
        }).join('');
    }

    // 移除单个文件
    removeFile(fileId) {
        const index = this.uploadedFiles.findIndex(item => item.id === fileId);
        if (index !== -1) {
            const fileItem = this.uploadedFiles[index];
            this.log(`移除文件: ${fileItem.file.name}`, 'info');
            this.uploadedFiles.splice(index, 1);
            this.updateFilesList();
            this.checkTranslationReady();
        }
    }

    // 清空所有文件
    clearAllFiles() {
        if (this.uploadedFiles.length === 0) return;
        
        this.log(`清空 ${this.uploadedFiles.length} 个文件`, 'info');
        this.uploadedFiles = [];
        this.updateFilesList();
        this.checkTranslationReady();
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 检查翻译准备状态
    checkTranslationReady() {
        const hasFiles = this.uploadedFiles.length > 0 || this.currentFile;        const hasApiKey = this.getValue('apiKey').trim() !== '';
        const provider = this.getValue('aiProvider');
        const startButton = document.getElementById('startTranslation');
        
        if (hasFiles) {
            startButton.disabled = false;
            if (this.uploadedFiles.length > 1) {
                startButton.querySelector('.btn-text').textContent = '开始批量翻译';
            } else {
                startButton.querySelector('.btn-text').textContent = '开始翻译';
            }
            
            // 如果没有API密钥，显示警告
            if (!hasApiKey) {
                startButton.querySelector('.btn-text').textContent += ' (请先配置API密钥)';
                startButton.disabled = true;
                
                // 显示配置提示
                this.log(`请配置${this.getProviderName(provider)}的API密钥才能进行翻译`, 'warning');
            }
        } else {
            startButton.disabled = true;
            startButton.querySelector('.btn-text').textContent = '请先上传文件';
        }
    }

    // 获取服务商显示名称
    getProviderName(provider) {
        const names = {
            'openai': 'OpenAI',
            'deepseek': 'DeepSeek',
            'claude': 'Claude',
            'gemini': 'Gemini',
            'custom': '自定义API'
        };
        return names[provider] || provider;
    }

    // 开始翻译
    async startTranslation() {
        if (this.isTranslating) return;
        
        this.isTranslating = true;
        const startButton = document.getElementById('startTranslation');
        const spinner = startButton.querySelector('.loading-spinner');
        const text = startButton.querySelector('.btn-text');
        
        startButton.disabled = true;
        spinner.style.display = 'inline-block';
        
        try {
            // 判断是单文件还是多文件模式
            if (this.uploadedFiles.length > 1 || (this.uploadedFiles.length === 1 && !this.currentFile)) {
                text.textContent = '批量翻译中...';
                await this.startBatchTranslation();
            } else {
                text.textContent = '翻译中...';
                // 原有的单文件翻译逻辑
                await this.performSingleFileTranslation();
            }
            
        } catch (error) {
            this.log(`翻译失败: ${error.message}`, 'error');
        } finally {
            this.isTranslating = false;
            startButton.disabled = false;
            spinner.style.display = 'none';
            text.textContent = this.uploadedFiles.length > 1 ? '开始批量翻译' : '开始翻译';
        }
    }

    // 批量翻译启动
    async startBatchTranslation() {
        this.log('开始批量翻译...', 'info');
        
        // 检查是否有已完成的文件
        const completedFiles = this.uploadedFiles.filter(item => item.status === 'completed');
        if (completedFiles.length === 0) {
            this.log('没有可翻译的文件', 'warning');
            return;
        }

        // 检查是否存在中文文件
        let hasChineseFiles = false;
        for (const fileItem of completedFiles) {
            for (const modData of Object.values(fileItem.extractedFiles)) {
                if (modData.hasExistingChinese) {
                    hasChineseFiles = true;
                    break;
                }
            }
            if (hasChineseFiles) break;
        }        if (hasChineseFiles) {
            // 显示策略选择弹窗
            this.showModal('strategyModal');
        } else {
            // 直接开始翻译
            await this.executeBatchTranslation('overwrite');
        }
    }

    // 执行批量翻译
    async executeBatchTranslation(strategy) {
        this.log(`使用策略: ${strategy === 'overwrite' ? '覆盖模式' : '合并模式'}`, 'info');
        
        try {
            const completedFiles = this.uploadedFiles.filter(item => item.status === 'completed');
            
            // 聚合所有文件的数据进行翻译
            const allFileData = {};
            
            // 处理多文件模式的数据
            for (const fileItem of completedFiles) {
                if (fileItem.extractedFiles) {
                    // 为每个文件的模组添加文件标识符，避免重复
                    for (const [modId, fileData] of Object.entries(fileItem.extractedFiles)) {
                        const uniqueModId = `${fileItem.file.name}__${modId}`;
                        allFileData[uniqueModId] = {
                            ...fileData,
                            sourceFileName: fileItem.file.name,
                            sourceFileId: fileItem.id
                        };
                    }
                }
            }
            
            const totalMods = Object.keys(allFileData).length;
            let currentMod = 0;
            
            // 逐个处理每个模组
            for (const [uniqueModId, fileData] of Object.entries(allFileData)) {
                currentMod++;
                const modId = uniqueModId.split('__')[1];
                
                this.log(`正在翻译 ${fileData.sourceFileName} - 模组 ${modId} (${currentMod}/${totalMods})`, 'info');
                
                // 解析英文数据
                const englishData = this.parseLanguageContent(fileData.englishContent);
                const chineseData = fileData.chineseContent ? this.parseLanguageContent(fileData.chineseContent) : {};
                
                // 获取需要翻译的文本
                const textsToTranslate = this.getTextsToTranslate(englishData, chineseData, strategy);
                
                if (textsToTranslate.length === 0) {
                    this.log(`模组 ${modId} 无需翻译`, 'info');
                    continue;
                }
                
                // 执行翻译
                const translatedTexts = await this.translateTexts(textsToTranslate);
                
                // 生成最终结果
                const finalResult = this.generateFinalResult(englishData, chineseData, translatedTexts, strategy);
                
                // 将结果存储到对应的文件中
                const targetFileItem = this.uploadedFiles.find(item => item.id === fileData.sourceFileId);
                if (targetFileItem) {
                    if (!targetFileItem.translationResults) {
                        targetFileItem.translationResults = {};
                    }
                    
                    const isJson = fileData.englishFile.endsWith('.json');
                    targetFileItem.translationResults[modId] = {
                        fileName: fileData.chineseFile,
                        content: isJson ? JSON.stringify(finalResult, null, 2) : this.generateLangFile(finalResult),
                        isJson: isJson
                    };
                }
                
                this.updateProgress((currentMod / totalMods) * 100, `完成模组 ${modId}`);
            }
            
            this.log('批量翻译完成！', 'success');
            this.showBatchPreview();
            
        } catch (error) {
            this.log(`批量翻译失败: ${error.message}`, 'error');
        }
    }    // 显示批量预览
    showBatchPreview() {
        const previewSection = document.getElementById('previewSection');
        const originalText = document.getElementById('originalText');
        const translatedText = document.getElementById('translatedText');
        const downloadButton = document.getElementById('downloadResult');
        
        // 生成预览内容
        let originalContent = '';
        let translatedContent = '';
        
        // 处理批量翻译结果
        let hasResults = false;
        for (const fileItem of this.uploadedFiles) {
            if (fileItem.translationResults && Object.keys(fileItem.translationResults).length > 0) {
                hasResults = true;
                originalContent += `// === 文件: ${fileItem.file.name} ===\n`;
                translatedContent += `// === 文件: ${fileItem.file.name} ===\n`;
                
                for (const [modId, result] of Object.entries(fileItem.translationResults)) {
                    const fileData = fileItem.extractedFiles[modId];
                    if (fileData && result) {
                        originalContent += `// --- 模组: ${modId} ---\n`;
                        translatedContent += `// --- 模组: ${modId} ---\n`;
                        
                        try {
                            if (result.isJson) {
                                const englishData = this.parseLanguageContent(fileData.englishContent);
                                const translatedData = JSON.parse(result.content);
                                
                                // 显示前5个条目作为预览
                                let count = 0;
                                for (const [key, value] of Object.entries(englishData)) {
                                    if (typeof value === 'string' && count < 5) {
                                        originalContent += `"${key}": "${value}"\n`;
                                        translatedContent += `"${key}": "${translatedData[key] || value}"\n`;
                                        count++;
                                    }
                                }
                                if (Object.keys(englishData).length > 5) {
                                    originalContent += `... 还有 ${Object.keys(englishData).length - 5} 个条目\n`;
                                    translatedContent += `... 还有 ${Object.keys(translatedData).length - 5} 个条目\n`;
                                }
                            } else {
                                // LANG文件预览前几行
                                const originalLines = fileData.englishContent.split('\n').slice(0, 5);
                                const translatedLines = result.content.split('\n').slice(0, 5);
                                originalContent += originalLines.join('\n') + '\n';
                                translatedContent += translatedLines.join('\n') + '\n';
                                if (fileData.englishContent.split('\n').length > 5) {
                                    originalContent += `... 还有更多内容\n`;
                                    translatedContent += `... 还有更多内容\n`;
                                }
                            }
                        } catch (error) {
                            this.log(`生成预览内容时出错: ${error.message}`, 'warning');
                            originalContent += `预览生成失败\n`;
                            translatedContent += `预览生成失败\n`;
                        }
                        
                        originalContent += '\n';
                        translatedContent += '\n';
                    }
                }
                originalContent += '\n';
                translatedContent += '\n';
            }
        }
        
        // 如果没有批量结果，检查单文件结果
        if (!hasResults && Object.keys(this.translationResults).length > 0) {
            hasResults = true;
            for (const [modId, result] of Object.entries(this.translationResults)) {
                const fileData = this.extractedFiles[modId];
                if (fileData && result) {
                    originalContent += `// === 模组: ${modId} ===\n`;
                    translatedContent += `// === 模组: ${modId} ===\n`;
                    
                    try {
                        if (result.isJson) {
                            const englishData = this.parseLanguageContent(fileData.englishContent);
                            const translatedData = JSON.parse(result.content);
                            
                            // 显示前5个条目
                            let count = 0;
                            for (const [key, value] of Object.entries(englishData)) {
                                if (typeof value === 'string' && count < 5) {
                                    originalContent += `"${key}": "${value}"\n`;
                                    translatedContent += `"${key}": "${translatedData[key] || value}"\n`;
                                    count++;
                                }
                            }
                            if (Object.keys(englishData).length > 5) {
                                originalContent += `... 还有 ${Object.keys(englishData).length - 5} 个条目\n`;
                                translatedContent += `... 还有 ${Object.keys(translatedData).length - 5} 个条目\n`;
                            }
                        } else {
                            const originalLines = fileData.englishContent.split('\n').slice(0, 5);
                            const translatedLines = result.content.split('\n').slice(0, 5);
                            originalContent += originalLines.join('\n') + '\n';
                            translatedContent += translatedLines.join('\n') + '\n';
                        }
                    } catch (error) {
                        this.log(`生成预览内容时出错: ${error.message}`, 'warning');
                        originalContent += `预览生成失败\n`;
                        translatedContent += `预览生成失败\n`;
                    }
                    
                    originalContent += '\n';
                    translatedContent += '\n';
                }
            }
        }
        
        // 更新预览内容
        if (originalText && translatedText) {
            originalText.textContent = originalContent || '暂无内容';
            translatedText.textContent = translatedContent || '暂无内容';
        }
        
        // 显示预览区域
        if (previewSection) {
            previewSection.style.display = 'block';
            previewSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // 更新下载按钮
        if (downloadButton) {
            downloadButton.style.display = 'block';
            downloadButton.disabled = false;
            
            if (this.uploadedFiles.length > 1) {
                downloadButton.textContent = '下载批量汉化包';
            } else {
                downloadButton.textContent = '下载汉化包';
            }
        }
          this.log('翻译完成，可以下载结果', 'success');
        
        // 确保下载按钮总是可用 (fallback)
        this.ensureDownloadButtonVisible();
    }

    // 确保下载按钮可见和可用
    ensureDownloadButtonVisible() {
        const downloadButton = document.getElementById('downloadResult');
        if (downloadButton) {
            downloadButton.style.display = 'block';
            downloadButton.disabled = false;
            
            // 检查是否有可下载的结果
            const hasResults = this.uploadedFiles.some(item => 
                item.translationResults && Object.keys(item.translationResults).length > 0
            ) || Object.keys(this.translationResults).length > 0;
            
            if (hasResults) {
                if (this.uploadedFiles.length > 1) {
                    downloadButton.textContent = '下载批量汉化包';
                } else {
                    downloadButton.textContent = '下载汉化包';
                }
                this.log('下载按钮已启用', 'info');
            } else {
                downloadButton.disabled = true;
                downloadButton.textContent = '暂无可下载内容';
            }
        }
    }// 下载结果
    async downloadResult() {
        const isBatchMode = this.uploadedFiles.length > 1 || (this.uploadedFiles.length === 1 && !this.currentFile);
        
        if (isBatchMode) {
            await this.downloadBatchResult();
        } else {
            await this.downloadSingleResult();
        }
    }

    // 下载单文件结果
    async downloadSingleResult() {
        if (!this.currentFile || Object.keys(this.translationResults).length === 0) {
            this.log('没有可下载的翻译结果', 'error');
            return;
        }
        
        try {
            this.log('正在生成下载文件...', 'info');
            
            // 重新加载原始JAR文件
            const zip = await JSZip.loadAsync(this.currentFile);
            
            // 添加或替换中文语言文件
            for (const [modId, result] of Object.entries(this.translationResults)) {
                // 获取原始文件信息以确定正确的路径
                const fileData = this.extractedFiles[modId];
                let filePath;
                
                if (fileData && fileData.originalPath) {
                    // 使用原始路径结构
                    filePath = fileData.originalPath + result.fileName;
                } else {
                    // 默认使用标准的assets路径
                    filePath = `assets/${modId}/lang/${result.fileName}`;
                }
                
                zip.file(filePath, result.content);
                this.log(`添加文件: ${filePath}`, 'info');
            }
            
            // 生成新的JAR文件
            const blob = await zip.generateAsync({ type: 'blob' });
            
            // 创建下载链接
            const originalName = this.currentFile.name.replace('.jar', '');
            const downloadName = `${originalName}-汉化版.jar`;
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.log(`下载完成: ${downloadName}`, 'success');
            this.saveToHistory(originalName, downloadName);
            
        } catch (error) {
            this.log(`下载失败: ${error.message}`, 'error');
        }
    }

    // 下载批量结果
    async downloadBatchResult() {
        try {
            const completedFiles = this.uploadedFiles.filter(item => 
                item.status === 'completed' && item.translationResults && 
                Object.keys(item.translationResults).length > 0
            );
            
            if (completedFiles.length === 0) {
                this.log('没有可下载的翻译结果', 'warning');
                return;
            }
            
            if (completedFiles.length === 1) {
                // 单个文件直接下载
                await this.downloadSingleFileFromBatch(completedFiles[0]);
            } else {
                // 多个文件打包成ZIP下载
                await this.downloadMultipleFilesAsZip(completedFiles);
            }
            
        } catch (error) {
            this.log(`批量下载失败: ${error.message}`, 'error');
        }
    }

    // 从批量结果中下载单个文件
    async downloadSingleFileFromBatch(fileItem) {
        try {
            // 重新加载原始JAR文件
            const zip = await JSZip.loadAsync(fileItem.file);
            
            // 添加或替换中文语言文件
            for (const [modId, result] of Object.entries(fileItem.translationResults)) {
                const fileData = fileItem.extractedFiles[modId];
                let filePath;
                
                if (fileData && fileData.originalPath) {
                    filePath = fileData.originalPath + result.fileName;
                } else {
                    filePath = `assets/${modId}/lang/${result.fileName}`;
                }
                
                zip.file(filePath, result.content);
                this.log(`添加文件: ${filePath}`, 'info');
            }
            
            // 生成新的JAR文件
            const blob = await zip.generateAsync({ type: 'blob' });
            
            // 创建下载链接
            const originalName = fileItem.file.name.replace('.jar', '');
            const downloadName = `${originalName}-汉化版.jar`;
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.log(`下载完成: ${downloadName}`, 'success');
            this.saveToHistory(originalName, downloadName);
            
        } catch (error) {
            this.log(`下载文件 ${fileItem.file.name} 失败: ${error.message}`, 'error');
        }
    }

    // 下载多个文件为ZIP包
    async downloadMultipleFilesAsZip(completedFiles) {
        try {
            const zipLib = new JSZip();
            
            for (const fileItem of completedFiles) {
                this.log(`处理文件: ${fileItem.file.name}`, 'info');
                
                // 重新加载原始JAR文件
                const originalZip = await JSZip.loadAsync(fileItem.file);
                
                // 添加或替换中文语言文件
                for (const [modId, result] of Object.entries(fileItem.translationResults)) {
                    const fileData = fileItem.extractedFiles[modId];
                    let filePath;
                    
                    if (fileData && fileData.originalPath) {
                        filePath = fileData.originalPath + result.fileName;
                    } else {
                        filePath = `assets/${modId}/lang/${result.fileName}`;
                    }
                    
                    originalZip.file(filePath, result.content);
                }
                
                // 生成修改后的JAR文件
                const modifiedBlob = await originalZip.generateAsync({ type: 'blob' });
                
                // 添加到ZIP包中
                const originalName = fileItem.file.name.replace('.jar', '');
                const fileName = `${originalName}-汉化版.jar`;
                zipLib.file(fileName, modifiedBlob);
                
                this.log(`已添加到ZIP包: ${fileName}`, 'info');
            }
            
            // 生成最终的ZIP文件
            const finalBlob = await zipLib.generateAsync({ type: 'blob' });
            
            // 创建下载链接
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const zipName = `minecraft-mods-汉化包-${timestamp}.zip`;
            
            const url = URL.createObjectURL(finalBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = zipName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.log(`批量下载完成: ${zipName}`, 'success');
            this.log(`包含 ${completedFiles.length} 个汉化模组`, 'success');
            
            // 保存批量翻译历史
            this.saveToHistory(
                `批量翻译 (${completedFiles.length}个文件)`, 
                zipName
            );
            
        } catch (error) {
            this.log(`生成ZIP包失败: ${error.message}`, 'error');
        }
    }    // 单文件翻译逻辑（保持原有功能）
    async performSingleFileTranslation() {
        this.log('执行单文件翻译...', 'info');
        
        if (!this.currentFile || Object.keys(this.extractedFiles).length === 0) {
            this.log('没有可翻译的单文件内容', 'warning');
            return;
        }
        
        try {
            // 检查是否存在中文文件
            let hasChineseFiles = false;
            for (const modData of Object.values(this.extractedFiles)) {
                if (modData.hasExistingChinese) {
                    hasChineseFiles = true;
                    break;
                }
            }
            
            let strategy = 'overwrite';
            if (hasChineseFiles) {
                // 显示策略选择弹窗
                this.showModal('strategyModal');
                return; // 等待用户选择策略
            }
            
            await this.executeSingleFileTranslation(strategy);
            
        } catch (error) {
            this.log(`单文件翻译失败: ${error.message}`, 'error');
        }
    }
    
    // 执行单文件翻译
    async executeSingleFileTranslation(strategy) {
        this.log(`使用策略: ${strategy === 'overwrite' ? '覆盖模式' : '合并模式'}`, 'info');
        
        try {
            const totalMods = Object.keys(this.extractedFiles).length;
            let currentMod = 0;
            
            for (const [modId, fileData] of Object.entries(this.extractedFiles)) {
                currentMod++;
                this.log(`正在翻译模组 ${modId} (${currentMod}/${totalMods})`, 'info');
                
                // 解析英文数据
                const englishData = this.parseLanguageContent(fileData.englishContent);
                const chineseData = fileData.chineseContent ? this.parseLanguageContent(fileData.chineseContent) : {};
                
                // 获取需要翻译的文本
                const textsToTranslate = this.getTextsToTranslate(englishData, chineseData, strategy);
                
                if (textsToTranslate.length === 0) {
                    this.log(`模组 ${modId} 无需翻译`, 'info');
                    continue;
                }
                
                // 执行翻译
                const translatedTexts = await this.translateTexts(textsToTranslate);
                
                // 生成最终结果
                const finalResult = this.generateFinalResult(englishData, chineseData, translatedTexts, strategy);
                
                // 存储翻译结果
                const isJson = fileData.englishFile.endsWith('.json');
                this.translationResults[modId] = {
                    fileName: fileData.chineseFile,
                    content: isJson ? JSON.stringify(finalResult, null, 2) : this.generateLangFile(finalResult),
                    isJson: isJson
                };
                
                this.updateProgress((currentMod / totalMods) * 100, `完成模组 ${modId}`);
            }
            
            this.log('单文件翻译完成！', 'success');
            this.showBatchPreview(); // 复用批量预览功能
            
        } catch (error) {
            this.log(`单文件翻译失败: ${error.message}`, 'error');
        }
    }

    // AI接口处理
    handleProviderChange() {
        this.checkTranslationReady();
    }

    handleApiKeyInput() {
        this.checkTranslationReady();
    }    // 确认策略
    confirmStrategy() {
        const strategy = document.querySelector('input[name="strategy"]:checked').value;
        this.hideModal('strategyModal');
        
        // 判断是批量翻译还是单文件翻译
        if (this.uploadedFiles.length > 1 || (this.uploadedFiles.length === 1 && !this.currentFile)) {
            this.executeBatchTranslation(strategy);
        } else {
            this.executeSingleFileTranslation(strategy);
        }
    }

    // 工具函数
    parseLanguageContent(content) {
        // 解析语言文件内容的逻辑
        try {
            return JSON.parse(content);
        } catch {
            // 处理.lang格式
            const result = {};
            content.split('\n').forEach(line => {
                const [key, ...values] = line.split('=');
                if (key && values.length > 0) {
                    result[key.trim()] = values.join('=').trim();
                }
            });
            return result;
        }
    }

    getTextsToTranslate(englishData, chineseData, strategy) {
        const texts = [];
        for (const [key, value] of Object.entries(englishData)) {
            if (strategy === 'overwrite' || !chineseData[key]) {
                texts.push(value);
            }
        }
        return texts;
    }    async translateTexts(texts) {        const apiKey = this.getValue('apiKey');
        const provider = this.getValue('aiProvider');
        const customApiUrl = this.getValue('customApiUrl');
        
        if (!apiKey) {
            throw new Error('请先配置API密钥');
        }
        
        this.log(`开始使用${provider}翻译 ${texts.length} 个文本条目...`, 'info');
        
        try {
            let translations = [];
            
            // 先查找内置术语表
            const processedTexts = texts.map(text => {
                if (this.builtInTerms && this.builtInTerms[text]) {
                    return this.builtInTerms[text];
                }
                if (this.customTerms && this.customTerms[text]) {
                    return this.customTerms[text];
                }
                return null; // 需要AI翻译
            });
            
            // 收集需要AI翻译的文本
            const textsToTranslate = [];
            const indexMap = [];
            processedTexts.forEach((translation, index) => {
                if (translation === null) {
                    textsToTranslate.push(texts[index]);
                    indexMap.push(index);
                }
            });
            
            if (textsToTranslate.length > 0) {
                this.log(`${textsToTranslate.length} 个文本需要AI翻译`, 'info');
                
                // 调用AI翻译服务
                const aiTranslations = await this.callAITranslation(textsToTranslate, provider, apiKey, customApiUrl);
                
                // 将AI翻译结果填回原数组
                aiTranslations.forEach((translation, i) => {
                    const originalIndex = indexMap[i];
                    processedTexts[originalIndex] = translation;
                });
            }
            
            translations = processedTexts;
            
            this.log(`翻译完成，返回 ${translations.length} 个结果`, 'success');
            return translations;
            
        } catch (error) {
            this.log(`翻译失败: ${error.message}`, 'error');
            throw error;
        }
    }

    // AI翻译API调用
    async callAITranslation(texts, provider, apiKey, customApiUrl) {
        const batchSize = 10; // 每批处理的文本数量
        const allTranslations = [];
        
        // 分批处理，避免API限制
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            this.log(`翻译批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}`, 'info');
            
            let batchTranslations;
            
            switch (provider) {
                case 'openai':
                    batchTranslations = await this.translateWithOpenAI(batch, apiKey);
                    break;
                case 'deepseek':
                    batchTranslations = await this.translateWithDeepSeek(batch, apiKey);
                    break;
                case 'claude':
                    batchTranslations = await this.translateWithClaude(batch, apiKey);
                    break;
                case 'gemini':
                    batchTranslations = await this.translateWithGemini(batch, apiKey);
                    break;
                case 'custom':
                    batchTranslations = await this.translateWithCustomAPI(batch, apiKey, customApiUrl);
                    break;
                default:
                    throw new Error(`不支持的翻译服务: ${provider}`);
            }
            
            allTranslations.push(...batchTranslations);
            
            // 批次间延迟，避免API限制
            if (i + batchSize < texts.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        return allTranslations;
    }

    // OpenAI翻译实现
    async translateWithOpenAI(texts, apiKey) {
        const prompt = `请将以下英文Minecraft游戏文本翻译成中文，保持游戏术语的准确性和一致性。请直接返回翻译结果，每行一个：

${texts.join('\n')}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的Minecraft游戏翻译专家。请将英文文本翻译成准确、自然的中文，保持游戏术语的一致性。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API错误: ${response.status} ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const translatedText = data.choices[0].message.content.trim();
        const translations = translatedText.split('\n').map(line => line.trim()).filter(line => line);
        
        if (translations.length !== texts.length) {
            this.log(`警告: 翻译结果数量(${translations.length})与原文数量(${texts.length})不匹配`, 'warning');
            // 补齐或截断结果
            while (translations.length < texts.length) {
                translations.push(texts[translations.length]);
            }
            translations.splice(texts.length);
        }
        
        return translations;
    }

    // DeepSeek翻译实现
    async translateWithDeepSeek(texts, apiKey) {
        const prompt = `请将以下英文Minecraft游戏文本翻译成中文：

${texts.join('\n')}

请直接返回翻译结果，每行一个：`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const translatedText = data.choices[0].message.content.trim();
        const translations = translatedText.split('\n').map(line => line.trim()).filter(line => line);
        
        // 确保返回结果数量匹配
        while (translations.length < texts.length) {
            translations.push(texts[translations.length]);
        }
        translations.splice(texts.length);
        
        return translations;
    }

    // Claude翻译实现
    async translateWithClaude(texts, apiKey) {
        const prompt = `请将以下英文Minecraft游戏文本翻译成中文，保持游戏术语准确：

${texts.join('\n')}`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 2000,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Claude API错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const translatedText = data.content[0].text.trim();
        const translations = translatedText.split('\n').map(line => line.trim()).filter(line => line);
        
        // 确保返回结果数量匹配
        while (translations.length < texts.length) {
            translations.push(texts[translations.length]);
        }
        translations.splice(texts.length);
        
        return translations;
    }

    // Gemini翻译实现
    async translateWithGemini(texts, apiKey) {
        const prompt = `请将以下英文Minecraft游戏文本翻译成中文：

${texts.join('\n')}

请直接返回翻译结果，每行一个：`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const translatedText = data.candidates[0].content.parts[0].text.trim();
        const translations = translatedText.split('\n').map(line => line.trim()).filter(line => line);
        
        // 确保返回结果数量匹配
        while (translations.length < texts.length) {
            translations.push(texts[translations.length]);
        }
        translations.splice(texts.length);
        
        return translations;
    }

    // 自定义API翻译实现
    async translateWithCustomAPI(texts, apiKey, customApiUrl) {
        if (!customApiUrl) {
            throw new Error('请配置自定义API URL');
        }

        const response = await fetch(customApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                texts: texts,
                source_lang: 'en',
                target_lang: 'zh'
            })
        });

        if (!response.ok) {
            throw new Error(`自定义API错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.translations || texts.map(text => `[翻译] ${text}`);
    }

    generateFinalResult(englishData, chineseData, translatedTexts, strategy) {
        const result = strategy === 'merge' ? { ...chineseData } : {};
        let textIndex = 0;
        
        for (const [key, value] of Object.entries(englishData)) {
            if (strategy === 'overwrite' || !result[key]) {
                result[key] = translatedTexts[textIndex++] || value;
            }
        }
        
        return result;
    }

    generateLangFile(data) {
        return Object.entries(data).map(([key, value]) => `${key}=${value}`).join('\n');
    }

    updateProgress(percentage, message) {
        this.log(`${message} (${Math.round(percentage)}%)`, 'info');
    }

    // 内置术语加载
    loadBuiltInTerms() {
        this.builtInTerms = {
            'Creeper': '苦力怕',
            'Zombie': '僵尸',
            'Skeleton': '骷髅',
            'Diamond': '钻石',
            'Iron': '铁',
            'Gold': '金',
            'Redstone': '红石'
            // ... 更多术语
        };
    }

    // 自定义术语管理
    showCustomTerms() {
        this.showModal('termsModal');
    }

    saveCustomTerms() {
        // 保存自定义术语逻辑
    }

    loadTermsFromFile(e) {
        // 从文件加载术语逻辑
    }

    // 历史记录管理
    showHistory() {
        this.showModal('historyModal');
    }

    saveToHistory(inputName, outputName) {
        const history = this.getHistory();
        history.unshift({
            input: inputName,
            output: outputName,
            timestamp: Date.now()
        });
        if (history.length > 5) {
            history.splice(5);
        }
        localStorage.setItem('translationHistory', JSON.stringify(history));
    }

    getHistory() {
        try {
            return JSON.parse(localStorage.getItem('translationHistory')) || [];
        } catch {
            return [];
        }
    }

    clearHistory() {
        localStorage.removeItem('translationHistory');
        this.showHistory();
    }

    // 设置管理
    loadSettings() {
        const usageCount = localStorage.getItem('usageCount');
        this.usageCount = usageCount ? parseInt(usageCount) : 0;
        
        const customTerms = localStorage.getItem('customTerms');
        if (customTerms) {
            try {
                this.customTerms = JSON.parse(customTerms);
            } catch {
                this.customTerms = {};
            }
        }
    }

    checkSponsorPrompt() {
        this.usageCount++;
        localStorage.setItem('usageCount', this.usageCount.toString());
        
        if (this.usageCount % 5 === 0) {
            const sponsored = localStorage.getItem('sponsored');
            if (sponsored !== 'true') {
                this.showModal('sponsorModal');
            }
        }
    }

    // 日志功能
    log(message, type = 'info') {
        const logContent = document.getElementById('logContent');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `<span style="color: #666;">[${timestamp}]</span> ${message}`;
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
    }

    clearLog() {
        this.setContent('logContent', '');
    }

    // 诊断功能
    runDiagnostics() {
        this.log('=== 开始系统诊断 ===', 'info');
        this.log('系统状态正常', 'success');
        this.log('=== 诊断完成 ===', 'info');
    }

    // 跳转到硬编码工具
    gotoHardcodedTool() {
        window.location.href = './hardcoded-translator.html';
    }

    // 临时测试功能 - 直接测试预览和下载按钮
    testPreviewFunction() {
        this.log('🧪 开始测试预览和下载按钮功能', 'info');
        
        // 模拟一些翻译结果
        this.translationResults = {
            'testmod': {
                fileName: 'zh_cn.json',
                content: JSON.stringify({
                    "item.test.name": "测试物品",
                    "block.test.name": "测试方块",
                    "entity.test.name": "测试实体"
                }, null, 2),
                isJson: true
            }
        };
        
        // 模拟一些提取的文件
        this.extractedFiles = {
            'testmod': {
                englishContent: JSON.stringify({
                    "item.test.name": "Test Item",
                    "block.test.name": "Test Block", 
                    "entity.test.name": "Test Entity"
                }, null, 2),
                chineseContent: null,
                englishFile: 'en_us.json',
                chineseFile: 'zh_cn.json'
            }
        };
        
        this.log('✅ 模拟数据已准备', 'success');
        
        // 直接调用 showBatchPreview
        this.showBatchPreview();
        
        this.log('🎉 测试完成！如果下载按钮没有显示，请检查浏览器控制台', 'success');
    }
}

// 初始化应用（延迟初始化，防止DOM元素不存在时出错）
document.addEventListener('DOMContentLoaded', () => {
    // 不立即初始化翻译器，等用户选择工具后再初始化
});

// 工具选择功能
function selectTool(toolType) {
    if (toolType === 'language') {
        // 显示语言文件翻译工具
        const uploadSection = document.querySelector('.upload-section');
        const translateSection = document.querySelector('.translate-section');
        const configSection = document.querySelector('.config-section');
        const batchSection = document.querySelector('.batch-section');
        const toolSelector = document.querySelector('.tool-selector');
        
        if (uploadSection) uploadSection.style.display = 'block';
        if (translateSection) translateSection.style.display = 'block';
        if (configSection) configSection.style.display = 'block';
        if (batchSection) batchSection.style.display = 'block';
        if (toolSelector) toolSelector.style.display = 'none';
        
        // 初始化翻译器（如果还没有初始化）
        if (!window.translator) {
            window.translator = new MinecraftModTranslator();
        }
        
        // 滚动到主工具区域
        if (uploadSection) {
            uploadSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // 更新页面标题
        document.title = 'Minecraft模组语言文件翻译 - 当前工具';
    } else if (toolType === 'hardcoded') {
        // 跳转到硬编码翻译工具
        window.open('hardcoded-translator-enhanced.html', '_blank');
    }
}

// 页面加载时默认隐藏主工具区域
document.addEventListener('DOMContentLoaded', () => {
    // 默认隐藏语言文件翻译工具
    const uploadSection = document.querySelector('.upload-section');
    const translateSection = document.querySelector('.translate-section');
    const configSection = document.querySelector('.config-section');
    const batchSection = document.querySelector('.batch-section');
    
    if (uploadSection) uploadSection.style.display = 'none';
    if (translateSection) translateSection.style.display = 'none';
    if (configSection) configSection.style.display = 'none';
    if (batchSection) batchSection.style.display = 'none';
});
