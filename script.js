/**
 * Minecraft模组语言文件智能翻译工具
 * 作者：饩雨
 * 纯前端实现，无后端架构
 */

class MinecraftModTranslator {    constructor() {
        this.currentFile = null;
        this.extractedFiles = {};
        this.translationResults = {};
        this.customTerms = {};
        this.usageCount = 0;
        this.isTranslating = false;
        this.hardcodedStrings = [];
        this.hardcodedResults = {};
        this.isScanning = false;
        
        this.initializeApp();
        this.loadSettings();
        this.checkSponsorPrompt();
    }

    initializeApp() {
        this.setupEventListeners();
        this.loadBuiltInTerms();
        this.log('系统初始化完成', 'success');
    }

    setupEventListeners() {
        // 文件上传相关
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));        // AI接口配置
        document.getElementById('aiProvider').addEventListener('change', this.handleProviderChange.bind(this));
        document.getElementById('apiKey').addEventListener('input', this.handleApiKeyInput.bind(this));        document.getElementById('customApiUrl').addEventListener('input', this.handleApiKeyInput.bind(this));
        
        // 操作按钮
        document.getElementById('startTranslation').addEventListener('click', this.startTranslation.bind(this));
        document.getElementById('showHistory').addEventListener('click', this.showHistory.bind(this));
        document.getElementById('customTerms').addEventListener('click', this.showCustomTerms.bind(this));
        document.getElementById('hardcodedDetection').addEventListener('click', this.showHardcodedDetection.bind(this));
        document.getElementById('diagnostics').addEventListener('click', this.runDiagnostics.bind(this));
        document.getElementById('gotoDeployTest').addEventListener('click', this.gotoDeployTest.bind(this));
        document.getElementById('gotoHardcodedDemo').addEventListener('click', this.gotoHardcodedDemo.bind(this));

        // 弹窗相关
        this.setupModalEventListeners();

        // 其他功能
        document.getElementById('clearLog').addEventListener('click', this.clearLog.bind(this));
        document.getElementById('downloadResult').addEventListener('click', this.downloadResult.bind(this));
    }

    setupModalEventListeners() {
        // 赞助弹窗
        document.getElementById('closeSponsorModal').addEventListener('click', () => {
            document.getElementById('sponsorModal').style.display = 'none';
        });
        document.getElementById('noThanks').addEventListener('click', () => {
            document.getElementById('sponsorModal').style.display = 'none';
        });
        document.getElementById('alreadySponsored').addEventListener('click', () => {
            localStorage.setItem('sponsored', 'true');
            document.getElementById('sponsorModal').style.display = 'none';
            this.log('感谢您的支持！', 'success');
        });

        // 策略选择弹窗
        document.getElementById('confirmStrategy').addEventListener('click', this.confirmStrategy.bind(this));

        // 术语表弹窗
        document.getElementById('closeTermsModal').addEventListener('click', () => {
            document.getElementById('termsModal').style.display = 'none';
        });
        document.getElementById('saveTerms').addEventListener('click', this.saveCustomTerms.bind(this));
        document.getElementById('loadTermsFile').addEventListener('click', () => {
            document.getElementById('termsFileInput').click();
        });
        document.getElementById('termsFileInput').addEventListener('change', this.loadTermsFromFile.bind(this));        // 历史记录弹窗
        document.getElementById('closeHistoryModal').addEventListener('click', () => {
            document.getElementById('historyModal').style.display = 'none';
        });
        document.getElementById('clearHistory').addEventListener('click', this.clearHistory.bind(this));        // 硬编码检测弹窗
        document.getElementById('closeHardcodedModal').addEventListener('click', () => {
            document.getElementById('hardcodedModal').style.display = 'none';
        });        document.getElementById('startHardcodedScan').addEventListener('click', this.startHardcodedScan.bind(this));
        document.getElementById('testHardcodedDemo').addEventListener('click', this.testHardcodedDemo.bind(this));
        document.getElementById('exportHardcodedReport').addEventListener('click', this.exportHardcodedReport.bind(this));
        document.getElementById('downloadHardcodedResult').addEventListener('click', this.downloadHardcodedResult.bind(this));
        document.getElementById('applyHardcodedChanges').addEventListener('click', this.applyHardcodedChanges.bind(this));
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
    }    processFile(file) {
        // 文件格式验证
        if (!file.name.toLowerCase().endsWith('.jar')) {
            this.log('错误：请上传有效的JAR文件', 'error');
            this.resetFileState();
            return;
        }

        // 文件大小验证
        const maxSize = 30 * 1024 * 1024; // 30MB
        if (file.size > maxSize) {
            this.log('错误：文件大小超过30MB限制', 'error');
            this.resetFileState();
            return;
        }

        this.currentFile = file;
        this.showFileInfo(file);
        this.extractJarFile(file);
    }

    resetFileState() {
        this.currentFile = null;
        this.extractedFiles = {};
        const fileInfo = document.getElementById('fileInfo');
        fileInfo.style.display = 'none';
        this.checkTranslationReady();
    }

    showFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        fileInfo.style.display = 'block';
        
        this.checkTranslationReady();
    }

    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }    async extractJarFile(file) {
        try {
            this.log(`正在解压文件: ${file.name}`, 'info');
            
            const zip = await JSZip.loadAsync(file);
            this.extractedFiles = {};
            
            // 查找语言文件 - 支持多种路径结构
            const langFiles = {};
            const allFiles = [];
            const debugInfo = {
                totalFiles: 0,
                langFileCount: 0,
                pathSamples: []
            };
            
            // 收集所有文件路径用于调试
            zip.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir) {
                    allFiles.push(relativePath);
                    debugInfo.totalFiles++;
                    
                    // 收集前20个文件路径作为样本
                    if (debugInfo.pathSamples.length < 20) {
                        debugInfo.pathSamples.push(relativePath);
                    }
                }
                
                // 扩展的路径模式匹配 - 支持更多模组架构
                const patterns = [
                    // 标准 Forge/Fabric 结构: assets/modid/lang/
                    { pattern: /^assets\/([^\/]+)\/lang\/(.+)$/, modIdIndex: 1, fileIndex: 2 },
                    
                    // 数据包结构: data/modid/lang/
                    { pattern: /^data\/([^\/]+)\/lang\/(.+)$/, modIdIndex: 1, fileIndex: 2 },
                    
                    // 根目录 lang 文件夹 (某些老版本模组)
                    { pattern: /^lang\/(.+)$/, modIdIndex: null, fileIndex: 1 },
                    
                    // META-INF 中的语言文件 (某些特殊情况)
                    { pattern: /^META-INF\/([^\/]+)\/lang\/(.+)$/, modIdIndex: 1, fileIndex: 2 },
                    
                    // 嵌套的assets结构: jar_name/assets/modid/lang/
                    { pattern: /^([^\/]+)\/assets\/([^\/]+)\/lang\/(.+)$/, modIdIndex: 2, fileIndex: 3 },
                    
                    // 某些模组的特殊结构: resources/lang/
                    { pattern: /^resources\/lang\/(.+)$/, modIdIndex: null, fileIndex: 1 },
                    
                    // 一些模组的自定义结构: src/main/resources/assets/modid/lang/
                    { pattern: /^src\/main\/resources\/assets\/([^\/]+)\/lang\/(.+)$/, modIdIndex: 1, fileIndex: 2 },
                    
                    // 某些打包方式: modid/lang/
                    { pattern: /^([^\/]+)\/lang\/(.+)$/, modIdIndex: 1, fileIndex: 2 },
                    
                    // 备用模式: 任何包含lang目录的结构
                    { pattern: /^(.+\/)?lang\/(.+)$/, modIdIndex: null, fileIndex: 2 }
                ];
                
                for (const { pattern, modIdIndex, fileIndex } of patterns) {
                    const match = relativePath.match(pattern);
                    if (match) {
                        let modId, fileName;
                        
                        if (modIdIndex === null) {
                            // 无法确定模组ID的情况，使用通用标识符
                            modId = 'unknown_mod';
                        } else {
                            modId = match[modIdIndex];
                        }
                        
                        fileName = match[fileIndex];                        // 过滤有效的语言文件
                        if (this.isValidLanguageFile(fileName)) {
                            if (!langFiles[modId]) {
                                langFiles[modId] = {};
                            }
                            langFiles[modId][fileName] = {
                                zipEntry: zipEntry,
                                fullPath: relativePath,
                                directoryPath: relativePath.replace(fileName, '')
                            };
                            debugInfo.langFileCount++;
                            this.log(`发现语言文件: ${relativePath} (模组: ${modId})`, 'info');
                        } else {
                            // 调试：记录所有可能的语言相关文件
                            if (fileName.toLowerCase().includes('en') || 
                                fileName.toLowerCase().includes('lang') || 
                                fileName.toLowerCase().includes('locale') ||
                                fileName.endsWith('.json') || 
                                fileName.endsWith('.lang')) {
                                console.log(`[调试] 跳过文件: ${relativePath} (文件名: ${fileName})`);
                            }
                        }
                        break;
                    }
                }
            });
            
            // 调试信息：显示文件结构
            this.log(`JAR文件包含 ${debugInfo.totalFiles} 个文件`, 'info');
            this.log(`找到 ${debugInfo.langFileCount} 个语言文件`, 'info');
              if (Object.keys(langFiles).length === 0) {
                this.log('错误：未找到语言文件，请确认模组结构正确', 'error');
                this.log('', 'info');
                this.log('🔍 详细分析结果：', 'warning');
                this.log(`📁 总文件数量: ${debugInfo.totalFiles}`, 'info');
                this.log(`🔤 语言文件数量: ${debugInfo.langFileCount}`, 'info');
                this.log('', 'info');
                
                // 分析文件类型
                const fileTypes = {};
                const langRelatedFiles = [];
                debugInfo.pathSamples.forEach(path => {
                    const ext = path.split('.').pop()?.toLowerCase();
                    if (ext) {
                        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
                    }
                    
                    // 查找可能的语言相关文件
                    if (path.toLowerCase().includes('lang') || 
                        path.toLowerCase().includes('locale') ||
                        path.toLowerCase().includes('i18n') ||
                        path.toLowerCase().includes('translation') ||
                        path.toLowerCase().includes('en_us') ||
                        path.toLowerCase().includes('zh_cn')) {
                        langRelatedFiles.push(path);
                    }
                });
                
                this.log('📊 文件类型统计：', 'info');
                Object.entries(fileTypes).slice(0, 8).forEach(([ext, count]) => {
                    this.log(`  .${ext}: ${count} 个`, 'info');
                });
                
                if (langRelatedFiles.length > 0) {
                    this.log('', 'info');
                    this.log('🎯 发现可能的语言相关文件：', 'warning');
                    langRelatedFiles.forEach(path => {
                        this.log(`  📄 ${path}`, 'info');
                    });
                }
                
                this.log('', 'info');
                this.log('✅ 支持的路径结构：', 'warning');
                this.log('  ✓ assets/modid/lang/', 'warning');
                this.log('  ✓ data/modid/lang/', 'warning');
                this.log('  ✓ lang/ (根目录)', 'warning');
                this.log('  ✓ META-INF/modid/lang/', 'warning');
                this.log('  ✓ resources/lang/', 'warning');
                this.log('  ✓ modid/lang/', 'warning');
                this.log('  ✓ src/main/resources/assets/modid/lang/', 'warning');
                this.log('', 'info');
                
                this.log('📂 实际文件结构样例（前20个）：', 'info');
                debugInfo.pathSamples.forEach((path, index) => {
                    if (index < 20) {
                        // 高亮可能的语言文件
                        const isLangRelated = path.toLowerCase().includes('lang') || 
                                            path.toLowerCase().includes('en_us') || 
                                            path.toLowerCase().includes('zh_cn');
                        const logType = isLangRelated ? 'warning' : 'info';
                        this.log(`  ${isLangRelated ? '🔍 ' : '📄 '}${path}`, logType);
                    }
                });
                if (debugInfo.totalFiles > 20) {
                    this.log(`  ... 还有 ${debugInfo.totalFiles - 20} 个文件`, 'info');
                }
                  this.log('', 'info');
                this.log('💡 未找到语言文件的处理方案：', 'warning');
                this.log('  1. 某些模组完全依赖硬编码文本，无语言文件', 'warning');
                this.log('  2. 可以使用"硬编码检测"功能进行汉化', 'warning');
                this.log('  3. 或者确认这是一个包含语言文件的模组', 'warning');
                this.log('  4. 检查是否为未汉化的英文模组（应包含en_us.json）', 'warning');
                
                // 不重置文件状态，允许硬编码检测
                this.log('文件已加载，可以使用硬编码检测功能', 'info');
                this.checkTranslationReady();
                return;
            }

            // 处理找到的语言文件
            let processedCount = 0;
            for (const [modId, files] of Object.entries(langFiles)) {
                await this.processLanguageFiles(modId, files);
                processedCount++;
            }
            
            this.log(`文件解压完成，成功处理 ${processedCount} 个模组`, 'success');
            this.checkTranslationReady();
            
        } catch (error) {
            this.log(`文件解压失败: ${error.message}`, 'error');
            
            // 提供更详细的错误诊断
            if (error.message.includes('invalid zip file')) {
                this.log('错误详情：文件不是有效的ZIP/JAR格式', 'error');
                this.log('解决方案：请确认文件未损坏且格式正确', 'warning');
            } else if (error.message.includes('corrupted')) {
                this.log('错误详情：文件已损坏', 'error');
                this.log('解决方案：请重新下载模组文件', 'warning');
            } else {
                this.log(`错误详情：${error.message}`, 'error');
                this.log('解决方案：请检查文件是否为有效的Minecraft模组', 'warning');
            }
            
            this.resetFileState();
        }
    }    isValidLanguageFile(fileName) {
        // 检查是否为有效的语言文件
        if (!fileName) return false;
        
        const lowerName = fileName.toLowerCase();
        
        // 支持的语言文件格式
        const validExtensions = ['.json', '.lang'];
        const hasValidExtension = validExtensions.some(ext => lowerName.endsWith(ext));
        
        if (!hasValidExtension) return false;
        
        // 支持的语言代码模式 - 更宽松的匹配
        const langPatterns = [
            /^[a-z]{2}_[a-z]{2}\.(json|lang)$/,  // 标准格式: en_us.json, zh_cn.lang
            /^[a-z]{2}\.(json|lang)$/,           // 简短格式: en.json, zh.lang
            /^lang_[a-z]{2}_[a-z]{2}\.(json|lang)$/, // 带前缀: lang_en_us.json
            /^language_[a-z]{2}_[a-z]{2}\.(json|lang)$/, // 带前缀: language_en_us.json
            /^[a-z]{2}-[a-z]{2}\.(json|lang)$/,  // 连字符格式: en-us.json
            /^[a-z]{2}_[A-Z]{2}\.(json|lang)$/,  // 大写格式: en_US.json
            /^[a-zA-Z]+\.(json|lang)$/           // 任何字母文件名 (更宽松)
        ];
        
        const isValid = langPatterns.some(pattern => pattern.test(lowerName));
        
        // 调试信息
        if (!isValid && (lowerName.includes('en') || lowerName.includes('lang') || lowerName.includes('us'))) {
            console.log(`[调试] 文件 "${fileName}" 可能是语言文件但不匹配模式`);
        }
        
        return isValid;
    }

    async processLanguageFiles(modId, files) {
        // 查找英文文件
        const englishFiles = ['en_us.json', 'en_us.lang'];
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
            this.log(`警告：模组 ${modId} 未找到英文语言文件`, 'warning');
            return;
        }

        // 读取英文文件内容
        const englishContent = await englishFile.async('text');
        
        // 检查中文文件
        const chineseFileName = englishFileName.replace('en_us', 'zh_cn');
        const chineseFileInfo = files[chineseFileName];
        const chineseFile = chineseFileInfo ? chineseFileInfo.zipEntry : null;
        
        this.extractedFiles[modId] = {
            englishFile: englishFileName,
            englishContent: englishContent,
            chineseFile: chineseFileName,
            chineseContent: chineseFile ? await chineseFile.async('text') : null,
            hasExistingChinese: !!chineseFile,
            originalPath: englishFileInfo.directoryPath, // 保存原始目录路径
            modId: modId
        };

        this.log(`检测到模组 ${modId}: ${englishFileName}`, 'info');
        if (chineseFile) {
            this.log(`发现已有中文文件: ${chineseFileName}`, 'info');
        }
    }

    handleProviderChange() {
        const provider = document.getElementById('aiProvider').value;
        const customApiGroup = document.getElementById('customApiGroup');
        
        if (provider === 'custom') {
            customApiGroup.style.display = 'block';
        } else {
            customApiGroup.style.display = 'none';
        }
          this.checkTranslationReady();
    }

    handleApiKeyInput() {
        this.validateApiKey();
        this.checkTranslationReady();
    }

    validateApiKey() {
        const apiKey = document.getElementById('apiKey').value;
        const provider = document.getElementById('aiProvider').value;
        const statusElement = document.getElementById('apiKeyStatus');
        const keyInput = document.getElementById('apiKey');
        
        let isValid = false;
        
        if (apiKey.length > 0) {
            switch (provider) {
                case 'openai-gpt35':
                case 'openai-gpt4':
                    isValid = apiKey.startsWith('sk-') && apiKey.length > 20;
                    break;
                case 'deepseek':
                    isValid = apiKey.length > 10;
                    break;
                case 'google':
                    isValid = apiKey.length > 20;
                    break;
                case 'custom':
                    const customUrl = document.getElementById('customApiUrl').value;
                    isValid = apiKey.length > 5 && customUrl && customUrl.startsWith('http');
                    break;
            }
        }
          if (isValid) {
            statusElement.textContent = '✓ 密钥格式有效';
            statusElement.className = 'api-key-status valid';
            keyInput.classList.remove('error');
        } else if (apiKey.length > 0) {
            let errorMsg = '✗ 密钥格式无效';
            if (provider === 'openai-gpt35' || provider === 'openai-gpt4') {
                errorMsg = '✗ OpenAI密钥必须以sk-开头且长度>20';
            } else if (provider === 'deepseek') {
                errorMsg = '✗ DeepSeek密钥长度必须>10';
            } else if (provider === 'google') {
                errorMsg = '✗ Google密钥长度必须>20';
            } else if (provider === 'custom') {
                const customUrl = document.getElementById('customApiUrl').value;
                if (!customUrl) {
                    errorMsg = '✗ 请先填写自定义API URL';
                } else if (!customUrl.startsWith('http')) {
                    errorMsg = '✗ API URL必须以http开头';
                } else {
                    errorMsg = '✗ 自定义密钥长度必须>5';
                }
            }
            statusElement.textContent = errorMsg;
            statusElement.className = 'api-key-status invalid';
            keyInput.classList.add('error');        } else {
            statusElement.textContent = '';
            statusElement.className = 'api-key-status';
            keyInput.classList.remove('error');
        }
        
        // 不要在这里调用 checkTranslationReady() 避免无限递归
        return isValid;
    }    checkTranslationReady() {
        const hasFile = this.currentFile; // 只需要有文件即可
        const hasLangFiles = Object.keys(this.extractedFiles).length > 0;
        const hasValidKey = this.validateApiKey();
        const startButton = document.getElementById('startTranslation');
        
        if (hasFile && hasLangFiles && hasValidKey) {
            // 有语言文件的标准翻译流程
            startButton.disabled = false;
            startButton.innerHTML = '<span class="btn-text">开始翻译</span>';
        } else if (hasFile && hasValidKey) {
            // 没有语言文件但有JAR文件，可以进行硬编码检测
            startButton.disabled = false;
            startButton.innerHTML = '<span class="btn-text">开始硬编码检测</span>';
        } else {
            startButton.disabled = true;
            if (!hasFile) {
                startButton.innerHTML = '<span class="btn-text">请先上传JAR文件</span>';
            } else if (!hasValidKey) {
                startButton.innerHTML = '<span class="btn-text">请输入有效API密钥</span>';
            }
        }
    }    async startTranslation() {
        if (this.isTranslating) return;
        
        // 检查是否有语言文件
        const hasLangFiles = Object.keys(this.extractedFiles).length > 0;
        
        if (!hasLangFiles) {
            // 没有语言文件，直接启动硬编码检测
            this.log('未找到语言文件，自动启动硬编码检测模式...', 'info');
            this.showHardcodedDetection();
            return;
        }
        
        // 检查是否有现有中文文件需要策略选择
        const hasExistingChinese = Object.values(this.extractedFiles).some(file => file.hasExistingChinese);
        
        if (hasExistingChinese) {
            this.showStrategyModal();
        } else {
            this.executeTranslation('overwrite');
        }
    }

    showStrategyModal() {
        document.getElementById('strategyModal').style.display = 'flex';
    }

    confirmStrategy() {
        const strategy = document.querySelector('input[name="strategy"]:checked').value;
        document.getElementById('strategyModal').style.display = 'none';
        this.executeTranslation(strategy);
    }

    async executeTranslation(strategy) {
        this.isTranslating = true;
        const startButton = document.getElementById('startTranslation');
        const progressSection = document.getElementById('progressSection');
        
        // 更新UI状态
        startButton.innerHTML = '<span class="btn-text">翻译中...</span><span class="loading-spinner">⟳</span>';
        startButton.disabled = true;
        progressSection.style.display = 'block';
        
        try {
            this.log('开始翻译处理...', 'info');
            this.updateProgress(0, '准备翻译数据...');
            
            const totalMods = Object.keys(this.extractedFiles).length;
            let currentMod = 0;
            
            for (const [modId, fileData] of Object.entries(this.extractedFiles)) {
                this.log(`正在处理模组: ${modId}`, 'info');
                
                // 解析英文内容
                const isJson = fileData.englishFile.endsWith('.json');
                let englishData, chineseData = {};
                
                if (isJson) {
                    try {
                        englishData = JSON.parse(fileData.englishContent);
                        if (fileData.chineseContent && strategy === 'merge') {
                            chineseData = JSON.parse(fileData.chineseContent);
                        }
                    } catch (error) {
                        this.log(`JSON解析失败: ${modId}`, 'error');
                        continue;
                    }
                } else {
                    englishData = this.parseLangFile(fileData.englishContent);
                    if (fileData.chineseContent && strategy === 'merge') {
                        chineseData = this.parseLangFile(fileData.chineseContent);
                    }
                }
                
                // 提取需要翻译的文本
                const textsToTranslate = this.extractTextsForTranslation(englishData, chineseData, strategy);
                
                if (textsToTranslate.length === 0) {
                    this.log(`模组 ${modId} 无需翻译`, 'info');
                    currentMod++;
                    this.updateProgress((currentMod / totalMods) * 100, `完成模组 ${modId}`);
                    continue;
                }
                
                // 分批翻译
                const translatedTexts = await this.translateTexts(textsToTranslate, (progress) => {
                    const overallProgress = ((currentMod + progress / 100) / totalMods) * 100;
                    this.updateProgress(overallProgress, `翻译模组 ${modId}...`);
                });
                
                // 生成最终结果
                const finalResult = this.generateFinalResult(englishData, chineseData, translatedTexts, strategy);
                
                this.translationResults[modId] = {
                    fileName: fileData.chineseFile,
                    content: isJson ? JSON.stringify(finalResult, null, 2) : this.generateLangFile(finalResult),
                    isJson: isJson
                };
                
                currentMod++;
                this.updateProgress((currentMod / totalMods) * 100, `完成模组 ${modId}`);
            }
            
            this.log('翻译完成！', 'success');
            this.showPreview();
            this.incrementUsageCount();
            
        } catch (error) {
            this.log(`翻译失败: ${error.message}`, 'error');
        } finally {
            this.isTranslating = false;
            startButton.innerHTML = '<span class="btn-text">开始翻译</span>';
            startButton.disabled = false;
        }
    }

    extractTextsForTranslation(englishData, chineseData, strategy) {
        const texts = [];
        
        for (const [key, value] of Object.entries(englishData)) {
            if (typeof value === 'string' && this.isEnglishText(value)) {
                // 检查是否需要翻译
                if (strategy === 'merge' && chineseData[key] && !this.isEnglishText(chineseData[key])) {
                    continue; // 已有中文翻译，跳过
                }
                
                // 检查自定义术语表
                if (this.customTerms[value]) {
                    continue; // 有自定义翻译，跳过
                }
                
                texts.push({ key, text: value });
            }
        }
        
        return texts;
    }

    isEnglishText(text) {
        // 简单的英文检测：包含英文字母且不包含中文字符
        return /[a-zA-Z]/.test(text) && !/[\u4e00-\u9fff]/.test(text);
    }

    async translateTexts(texts, progressCallback) {
        const batchSize = 10; // 每批处理10个文本
        const results = {};
        
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const batchTexts = batch.map(item => item.text);
            
            try {
                const translations = await this.callTranslationAPI(batchTexts);
                
                // 将翻译结果映射回原始键
                batch.forEach((item, index) => {
                    results[item.key] = translations[index] || item.text;
                });
                
                const progress = Math.min(((i + batchSize) / texts.length) * 100, 100);
                progressCallback(progress);
                
                // 添加延迟避免API限制
                if (i + batchSize < texts.length) {
                    await this.delay(1000);
                }
                
            } catch (error) {
                this.log(`翻译批次失败: ${error.message}`, 'error');
                // 失败时保持原文
                batch.forEach(item => {
                    results[item.key] = item.text;
                });
            }
        }
        
        return results;
    }

    async callTranslationAPI(texts) {
        const provider = document.getElementById('aiProvider').value;
        const apiKey = document.getElementById('apiKey').value;
        
        // 应用自定义术语表和内置术语
        const processedTexts = texts.map(text => {
            // 优先使用自定义术语
            if (this.customTerms[text]) {
                return this.customTerms[text];
            }
            // 使用内置术语
            if (this.builtInTerms[text]) {
                return this.builtInTerms[text];
            }
            return text;
        });
        
        // 过滤已翻译的文本
        const textsToTranslate = [];
        const resultMap = {};
        
        processedTexts.forEach((text, index) => {
            if (text === texts[index]) {
                textsToTranslate.push(text);
            } else {
                resultMap[index] = text;
            }
        });
        
        if (textsToTranslate.length === 0) {
            return processedTexts;
        }
        
        let apiUrl, requestBody, headers;
        
        switch (provider) {
            case 'openai-gpt35':
                apiUrl = 'https://api.openai.com/v1/chat/completions';
                requestBody = {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: '请将以下Minecraft模组术语准确翻译为中文，保持原有格式，只返回翻译结果，用换行符分隔。'
                        },
                        {
                            role: 'user',
                            content: textsToTranslate.join('\n')
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
                            content: '请将以下Minecraft模组术语准确翻译为中文，保持原有格式，只返回翻译结果，用换行符分隔。'
                        },
                        {
                            role: 'user',
                            content: textsToTranslate.join('\n')
                        }
                    ],
                    temperature: 0.3
                };
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                break;
                
            case 'deepseek':
                apiUrl = 'https://api.deepseek.com/v1/chat/completions';
                requestBody = {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '请将以下Minecraft模组术语准确翻译为中文，保持原有格式，只返回翻译结果，用换行符分隔。'
                        },
                        {
                            role: 'user',
                            content: textsToTranslate.join('\n')
                        }
                    ],
                    temperature: 0.3
                };
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                break;
                
            case 'custom':
                apiUrl = document.getElementById('customApiUrl').value;
                requestBody = {
                    text: textsToTranslate.join('\n')
                };
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                break;
                
            default:
                throw new Error('不支持的翻译提供商');
        }
        
        try {
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
                translatedText = data.choices[0].message.content;
            } else {
                translatedText = data.text || data.result;
            }
            
            const translations = translatedText.split('\n').map(t => t.trim()).filter(t => t);
            
            // 将翻译结果填回完整数组
            const finalResults = [...processedTexts];
            let translationIndex = 0;
            
            processedTexts.forEach((text, index) => {
                if (text === texts[index] && translationIndex < translations.length) {
                    finalResults[index] = translations[translationIndex++];
                }
            });
            
            return finalResults;
            
        } catch (error) {
            this.log(`API调用失败: ${error.message}`, 'error');
            throw error;
        }
    }

    generateFinalResult(englishData, chineseData, translatedTexts, strategy) {
        const result = {};
        
        if (strategy === 'merge' && Object.keys(chineseData).length > 0) {
            // 合并模式：保留已有中文翻译
            Object.assign(result, chineseData);
        }
        
        // 添加新翻译
        for (const [key, value] of Object.entries(englishData)) {
            if (translatedTexts[key]) {
                result[key] = translatedTexts[key];
            } else if (!result[key]) {
                // 检查自定义术语表
                if (this.customTerms[value]) {
                    result[key] = this.customTerms[value];
                } else if (this.builtInTerms[value]) {
                    result[key] = this.builtInTerms[value];
                } else {
                    result[key] = value; // 保持原文
                }
            }
        }
        
        return result;
    }

    parseLangFile(content) {
        const result = {};
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const equalIndex = trimmed.indexOf('=');
                if (equalIndex > 0) {
                    const key = trimmed.substring(0, equalIndex);
                    const value = trimmed.substring(equalIndex + 1);
                    result[key] = value;
                }
            }
        }
        
        return result;
    }

    generateLangFile(data) {
        const lines = [];
        for (const [key, value] of Object.entries(data)) {
            lines.push(`${key}=${value}`);
        }
        return lines.join('\n');
    }

    updateProgress(percentage, status) {
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        const progressStatus = document.getElementById('progressStatus');
        
        progressFill.style.width = `${percentage}%`;
        progressPercentage.textContent = `${Math.round(percentage)}%`;
        progressStatus.textContent = status;
    }

    showPreview() {
        const previewSection = document.getElementById('previewSection');
        const originalText = document.getElementById('originalText');
        const translatedText = document.getElementById('translatedText');
        
        // 生成预览内容
        let originalContent = '';
        let translatedContent = '';
        
        for (const [modId, fileData] of Object.entries(this.extractedFiles)) {
            const result = this.translationResults[modId];
            if (result) {
                originalContent += `// === ${modId} ===\n`;
                translatedContent += `// === ${modId} ===\n`;
                
                if (result.isJson) {
                    const englishData = JSON.parse(fileData.englishContent);
                    const translatedData = JSON.parse(result.content);
                    
                    for (const [key, value] of Object.entries(englishData)) {
                        if (typeof value === 'string') {
                            originalContent += `"${key}": "${value}"\n`;
                            translatedContent += `"${key}": "${translatedData[key] || value}"\n`;
                        }
                    }
                } else {
                    originalContent += fileData.englishContent + '\n';
                    translatedContent += result.content + '\n';
                }
                
                originalContent += '\n';
                translatedContent += '\n';
            }
        }
        
        originalText.textContent = originalContent;
        translatedText.textContent = translatedContent;
        
        previewSection.style.display = 'block';
        previewSection.scrollIntoView({ behavior: 'smooth' });
    }

    async downloadResult() {
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

    loadBuiltInTerms() {
        // 内置Minecraft术语库
        this.builtInTerms = {
            'Creeper': '苦力怕',
            'Zombie': '僵尸',
            'Skeleton': '骷髅',
            'Spider': '蜘蛛',
            'Enderman': '末影人',
            'Redstone': '红石',
            'Diamond': '钻石',
            'Iron': '铁',
            'Gold': '金',
            'Coal': '煤炭',
            'Wood': '木头',
            'Stone': '石头',
            'Dirt': '泥土',
            'Grass': '草',
            'Water': '水',
            'Lava': '岩浆',
            'Nether': '下界',
            'End': '末地',
            'Overworld': '主世界',
            'Crafting': '合成',
            'Smelting': '熔炼',
            'Brewing': '酿造',
            'Enchanting': '附魔',
            'Mining': '挖掘',
            'Building': '建造',
            'Sword': '剑',
            'Pickaxe': '镐',
            'Axe': '斧',
            'Shovel': '铲',
            'Hoe': '锄',
            'Bow': '弓',
            'Arrow': '箭',
            'Shield': '盾牌',
            'Armor': '盔甲',
            'Helmet': '头盔',
            'Chestplate': '胸甲',
            'Leggings': '护腿',
            'Boots': '靴子',
            'Block': '方块',
            'Item': '物品',
            'Recipe': '配方',
            'Inventory': '物品栏',
            'Chest': '箱子',
            'Furnace': '熔炉',
            'Workbench': '工作台',
            'Bed': '床',
            'Door': '门',
            'Window': '窗户',
            'Torch': '火把',
            'Ladder': '梯子',
            'Fence': '栅栏',
            'Gate': '门',
            'Pressure Plate': '压力板',
            'Button': '按钮',
            'Lever': '拉杆',
            'Redstone Dust': '红石粉',
            'Redstone Torch': '红石火把',
            'Repeater': '中继器',
            'Comparator': '比较器',
            'Piston': '活塞',
            'Sticky Piston': '粘性活塞',
            'Dispenser': '发射器',
            'Dropper': '投掷器',
            'Hopper': '漏斗',
            'TNT': 'TNT',
            'Obsidian': '黑曜石',
            'Bedrock': '基岩',
            'Sand': '沙子',            'Gravel': '沙砾',
            'Clay': '粘土',
            'Snow': '雪',
            'Ice': '冰',
            'Cactus': '仙人掌',
            'Sugar Cane': '甘蔗',
            'Wheat': '小麦',
            'Carrot': '胡萝卜',
            'Potato': '土豆',
            'Beetroot': '甜菜根',
            'Bread': '面包',
            'Cookie': '曲奇',
            'Cake': '蛋糕',
            'Milk': '牛奶',
            'Egg': '鸡蛋',
            'Chicken': '鸡肉',
            'Beef': '牛肉',
            'Pork': '猪肉',
            'Fish': '鱼',
            'Salmon': '鲑鱼',
            'Apple': '苹果',
            'Golden Apple': '金苹果',
            'Potion': '药水',
            'Enchanted Book': '附魔书',
            'Experience': '经验',
            'Level': '等级',
            'Health': '生命值',
            'Hunger': '饥饿值',
            'Damage': '伤害',
            'Protection': '保护',
            'Durability': '耐久度',
            'Efficiency': '效率',
            'Fortune': '时运',
            'Silk Touch': '精准采集',
            'Unbreaking': '耐久',
            'Mending': '经验修补',
            'Sharpness': '锋利',
            'Smite': '亡灵杀手',
            'Bane of Arthropods': '节肢杀手',
            'Knockback': '击退',
            'Fire Aspect': '火焰附加',
            'Looting': '抢夺',
            'Power': '力量',
            'Punch': '冲击',
            'Flame': '火矢',
            'Infinity': '无限',
            'Luck of the Sea': '海之眷顾',
            'Lure': '钓鱼高手',
            'Frost Walker': '冰霜行者',
            'Depth Strider': '深海探索者',
            'Aqua Affinity': '水下速掘',
            'Respiration': '水下呼吸',
            'Thorns': '荆棘',
            'Feather Falling': '摔落保护',
            'Blast Protection': '爆炸保护',
            'Fire Protection': '火焰保护',
            'Projectile Protection': '弹射物保护'
        };
    }

    showCustomTerms() {
        const modal = document.getElementById('termsModal');
        const textarea = document.getElementById('customTermsText');
        
        // 显示当前自定义术语
        textarea.value = JSON.stringify(this.customTerms, null, 2);
        modal.style.display = 'flex';
    }

    saveCustomTerms() {
        const textarea = document.getElementById('customTermsText');
        
        try {
            const terms = JSON.parse(textarea.value);
            this.customTerms = terms;
            localStorage.setItem('customTerms', JSON.stringify(terms));
            
            this.log(`保存了 ${Object.keys(terms).length} 个自定义术语`, 'success');
            document.getElementById('termsModal').style.display = 'none';
            
        } catch (error) {
            this.log('术语表格式错误，请检查JSON格式', 'error');
        }
    }

    loadTermsFromFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const terms = JSON.parse(event.target.result);
                document.getElementById('customTermsText').value = JSON.stringify(terms, null, 2);
                this.log('术语文件加载成功', 'success');
            } catch (error) {
                this.log('术语文件格式错误', 'error');
            }
        };
        reader.readAsText(file);
    }

    showHistory() {
        const modal = document.getElementById('historyModal');
        const historyList = document.getElementById('historyList');
        
        const history = this.getHistory();
        
        if (history.length === 0) {
            historyList.innerHTML = '<div class="history-empty">暂无翻译历史</div>';
        } else {
            historyList.innerHTML = history.map(item => `
                <div class="history-item">
                    <h5>${item.originalName}</h5>
                    <div class="history-meta">
                        翻译时间: ${new Date(item.timestamp).toLocaleString()}<br>
                        输出文件: ${item.outputName}
                    </div>
                </div>
            `).join('');
        }
        
        modal.style.display = 'flex';
    }

    getHistory() {
        const history = localStorage.getItem('translationHistory');
        return history ? JSON.parse(history) : [];
    }

    saveToHistory(originalName, outputName) {
        const history = this.getHistory();
        const newEntry = {
            originalName,
            outputName,
            timestamp: Date.now()
        };
        
        history.unshift(newEntry);
        
        // 最多保存5条记录
        if (history.length > 5) {
            history.splice(5);
        }
        
        localStorage.setItem('translationHistory', JSON.stringify(history));
    }

    clearHistory() {
        localStorage.removeItem('translationHistory');
        this.showHistory(); // 刷新显示
        this.log('历史记录已清空', 'info');
    }

    incrementUsageCount() {
        this.usageCount++;
        localStorage.setItem('usageCount', this.usageCount.toString());
    }

    checkSponsorPrompt() {
        const sponsored = localStorage.getItem('sponsored');
        if (sponsored === 'true') return;
        
        if (this.usageCount > 0 && this.usageCount % 5 === 0) {
            setTimeout(() => {
                document.getElementById('sponsorModal').style.display = 'flex';
            }, 2000);
        }
    }

    loadSettings() {
        // 加载使用次数
        const usageCount = localStorage.getItem('usageCount');
        this.usageCount = usageCount ? parseInt(usageCount) : 0;
        
        // 加载自定义术语
        const customTerms = localStorage.getItem('customTerms');
        if (customTerms) {
            try {
                this.customTerms = JSON.parse(customTerms);
            } catch (error) {
                this.customTerms = {};
            }
        }
    }

    clearLog() {
        document.getElementById('logContent').innerHTML = '';
    }

    log(message, type = 'info') {
        const logContent = document.getElementById('logContent');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
        
        console.log(`[MinecraftModTranslator] ${message}`);
    }    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    runDiagnostics() {
        this.log('=== 开始系统诊断 ===', 'info');
        
        // 检查文件状态
        this.log(`1. 文件检查:`, 'info');
        if (!this.currentFile) {
            this.log('   ❌ 未上传JAR文件', 'error');
        } else {
            this.log(`   ✅ 已上传文件: ${this.currentFile.name} (${this.formatFileSize(this.currentFile.size)})`, 'success');
            
            if (Object.keys(this.extractedFiles).length === 0) {
                this.log('   ❌ 文件解析失败或无语言文件', 'error');
            } else {
                this.log(`   ✅ 解析成功，找到 ${Object.keys(this.extractedFiles).length} 个模组的语言文件`, 'success');
                for (const [modId, fileData] of Object.entries(this.extractedFiles)) {
                    this.log(`      - ${modId}: ${fileData.englishFile}`, 'info');
                }
            }
        }
        
        // 检查API配置
        this.log(`2. API配置检查:`, 'info');
        const provider = document.getElementById('aiProvider').value;
        const apiKey = document.getElementById('apiKey').value;
        
        this.log(`   提供商: ${provider}`, 'info');
        
        if (!apiKey) {
            this.log('   ❌ 未输入API密钥', 'error');
        } else {
            const isValid = this.validateApiKey();
            if (isValid) {
                this.log('   ✅ API密钥格式有效', 'success');
            } else {
                this.log('   ❌ API密钥格式无效', 'error');
            }
        }
        
        if (provider === 'custom') {
            const customUrl = document.getElementById('customApiUrl').value;
            if (!customUrl) {
                this.log('   ❌ 自定义API URL未填写', 'error');
            } else if (!customUrl.startsWith('http')) {
                this.log('   ❌ 自定义API URL格式无效', 'error');
            } else {
                this.log('   ✅ 自定义API URL格式有效', 'success');
            }
        }
        
        // 检查按钮状态
        this.log(`3. 按钮状态检查:`, 'info');
        const startButton = document.getElementById('startTranslation');
        if (startButton.disabled) {
            this.log('   ❌ 开始翻译按钮已禁用', 'error');
            this.log(`   按钮文本: "${startButton.querySelector('.btn-text').textContent}"`, 'warning');
        } else {
            this.log('   ✅ 开始翻译按钮可用', 'success');
        }
        
        // 检查浏览器兼容性
        this.log(`4. 浏览器兼容性检查:`, 'info');
        if (typeof JSZip === 'undefined') {
            this.log('   ❌ JSZip库未加载', 'error');
        } else {
            this.log('   ✅ JSZip库已加载', 'success');
        }
        
        if (typeof fetch === 'undefined') {
            this.log('   ❌ 浏览器不支持fetch API', 'error');
        } else {
            this.log('   ✅ 浏览器支持fetch API', 'success');
        }
          this.log('=== 诊断完成 ===', 'info');
        
        // 给出建议
        this.log('💡 解决建议:', 'info');
        if (!this.currentFile) {
            this.log('   1. 请上传一个有效的Minecraft模组JAR文件', 'warning');
        }
        if (!apiKey) {
            this.log('   2. 请输入对应AI服务的API密钥', 'warning');
        }        if (Object.keys(this.extractedFiles).length === 0 && this.currentFile) {
            this.log('   3. 模组没有语言文件时，可以使用"硬编码检测"功能', 'warning');
            this.log('   4. 或确保JAR文件包含assets/[模组ID]/lang/目录结构', 'warning');
            this.log('   5. 确保存在en_us.json或en_us.lang文件', 'warning');
        }
    }

    // ==================== 页面导航功能 ====================

    gotoDeployTest() {
        this.log('🚀 正在跳转到部署测试页面...', 'info');
        window.open('deploy-test.html', '_blank');
    }

    gotoHardcodedDemo() {
        this.log('🔧 正在跳转到硬编码检测演示页面...', 'info');
        window.open('hardcoded-demo.html', '_blank');    }

    // ==================== 硬编码检测功能 ====================

    showHardcodedDetection() {
        // 允许在没有文件的情况下打开模态框进行演示
        document.getElementById('hardcodedModal').style.display = 'flex';
        document.getElementById('hardcodedResults').style.display = 'none';
        document.getElementById('exportHardcodedReport').style.display = 'none';
        document.getElementById('downloadHardcodedResult').style.display = 'none';
        document.getElementById('applyHardcodedChanges').style.display = 'none';
        
        // 根据是否有文件提供不同的提示
        if (!this.currentFile) {
            this.log('💡 硬编码检测功能说明：', 'info');
            this.log('  • 用于检测模组代码中直接硬编码的英文文本', 'info');
            this.log('  • 适用于没有语言文件或语言文件不完整的模组', 'info');
            this.log('  • 点击"模拟演示"可以体验功能效果', 'info');
        } else {
            this.log('📁 已检测到JAR文件，可以开始硬编码扫描', 'info');
            this.log('💡 硬编码检测将分析模组的字节码文件', 'info');
        }
    }

    testHardcodedDemo() {
        this.log('🎭 启动硬编码检测模拟演示...', 'info');
        
        // 模拟硬编码字符串数据
        this.hardcodedStrings = [
            {
                text: "Magic Wand",
                location: "com/example/mod/items/MagicWand.class",
                offset: 1234,
                context: "Component.literal",
                type: "component",
                translation: "魔法法杖"
            },
            {
                text: "A powerful magical item",
                location: "com/example/mod/items/MagicWand.class", 
                offset: 1456,
                context: "Component.literal Tooltip",
                type: "tooltip",
                translation: "一件强大的魔法物品"
            },
            {
                text: "Start Adventure",
                location: "com/example/mod/gui/AdventureScreen.class",
                offset: 2345,
                context: "GUI Button",
                type: "gui", 
                translation: "开始冒险"
            },
            {
                text: "Durability",
                location: "com/example/mod/items/BaseItem.class",
                offset: 3456,
                context: "String literal",
                type: "string",
                translation: "耐久度"
            },
            {
                text: "Right-click to activate",
                location: "com/example/mod/items/ActiveItem.class",
                offset: 4567,
                context: "Component.literal Tooltip", 
                type: "tooltip",
                translation: "右键点击激活"
            },
            {
                text: "Enchanted Sword",
                location: "com/example/mod/items/EnchantedSword.class",
                offset: 5678,
                context: "Component.literal",
                type: "component",
                translation: "附魔剑"
            },
            {
                text: "Deals extra damage to undead",
                location: "com/example/mod/items/EnchantedSword.class",
                offset: 5890,
                context: "Tooltip",
                type: "tooltip",
                translation: "对亡灵造成额外伤害"
            }
        ];
        
        // 显示结果
        this.displayHardcodedResults();
        
        this.log(`✅ 模拟演示完成，展示了 ${this.hardcodedStrings.length} 个硬编码文本示例`, 'success');
        this.log('💡 这些是常见的硬编码模式，实际扫描会发现更多内容', 'info');
    }

    async startHardcodedScan() {
        if (this.isScanning) {
            this.log('警告：正在扫描中，请等待完成', 'warning');
            return;
        }

        const enableDetection = document.getElementById('enableHardcodedDetection').checked;
        if (!enableDetection) {
            this.log('错误：请启用硬编码检测', 'error');
            return;
        }

        this.isScanning = true;
        this.hardcodedStrings = [];
        this.hardcodedResults = {};

        const scanButton = document.getElementById('startHardcodedScan');
        scanButton.innerHTML = '<span class="scanning-animation">🔍 扫描中...</span>';
        scanButton.disabled = true;        try {
            this.log('🔍 开始硬编码检测...', 'info');
            
            // 获取扫描设置
            const settings = this.getHardcodedSettings();
            
            // 扫描JAR文件中的class文件
            await this.scanClassFiles(settings);
            
            this.log(`✅ 硬编码检测完成，发现 ${this.hardcodedStrings.length} 个可能的硬编码文本`, 'success');
            
            // 显示结果（确保在翻译完成后）
            this.displayHardcodedResults();
            
        } catch (error) {
            this.log(`❌ 硬编码检测失败: ${error.message}`, 'error');
            console.error('硬编码检测错误:', error);
        } finally {
            this.isScanning = false;
            scanButton.innerHTML = '开始扫描';
            scanButton.disabled = false;
        }
    }    getHardcodedSettings() {
        return {
            enableComponentLiteral: document.getElementById('enableComponentLiteral').checked,
            enableStringLiterals: document.getElementById('enableStringLiterals').checked,
            enableTooltipStrings: document.getElementById('enableTooltipStrings').checked,
            strategy: document.querySelector('input[name="hardcodedStrategy"]:checked').value,
            minTextLength: parseInt(document.getElementById('minTextLength').value) || 3,
            excludeNumbers: document.getElementById('excludeNumbers').checked,
            excludeSingleChar: document.getElementById('excludeSingleChar').checked,
            useAdvancedScanning: document.getElementById('useAdvancedScanning')?.checked || false,
            enableBatchTranslation: document.getElementById('enableBatchTranslation')?.checked || false
        };
    }

    // 智能
    prioritizeClassFiles(classFiles) {
        return classFiles.sort((a, b) => {
            const pathA = a.path.toLowerCase();
            const pathB = b.path.toLowerCase();
            
            // 高优先级关键词
            const highPriorityKeywords = [
                'gui', 'screen', 'menu', 'button', 'tooltip', 'widget',
                'component', 'text', 'label', 'title', 'message',
                'dialog', 'window', 'panel', 'tab', 'item'
            ];
            
            // 中等优先级关键词
            const mediumPriorityKeywords = [
                'config', 'option', 'setting', 'property',
                'block', 'entity', 'tile', 'recipe'
            ];
            
            // 低优先级（排除）关键词
            const lowPriorityKeywords = [
                'util', 'helper', 'common', 'base', 'abstract',
                'network', 'packet', 'data', 'storage', 'cache',
                'math', 'vector', 'matrix', 'algorithm'
            ];
            
            const scoreA = this.calculateFileScore(pathA, highPriorityKeywords, mediumPriorityKeywords, lowPriorityKeywords);
            const scoreB = this.calculateFileScore(pathB, highPriorityKeywords, mediumPriorityKeywords, lowPriorityKeywords);
            
            return scoreB - scoreA; // 降序排列，高分在前
        });
    }
    
    calculateFileScore(path, highKeywords, mediumKeywords, lowKeywords) {
        let score = 0;
        
        // 高优先级关键词 +10分
        highKeywords.forEach(keyword => {
            if (path.includes(keyword)) score += 10;
        });
        
        // 中等优先级关键词 +5分
        mediumKeywords.forEach(keyword => {
            if (path.includes(keyword)) score += 5;
        });
        
        // 低优先级（排除）关键词 -5分
        lowKeywords.forEach(keyword => {
            if (path.includes(keyword)) score -= 5;
        });
        
        // 文件路径深度奖励（UI类通常在相对浅的目录）
        const depth = (path.match(/\//g) || []).length;
        if (depth <= 3) score += 3;
        else if (depth >= 6) score -= 2;
        
        return score;
    }

    async scanClassFiles(settings) {
        this.log('📂 正在扫描JAR文件中的class文件...', 'info');
        
        const startTime = Date.now();
        const zip = new JSZip();
        await zip.loadAsync(this.currentFile);
        
        // 收集并优先排序class文件
        const classFiles = [];
        zip.forEach((relativePath, file) => {
            if (relativePath.endsWith('.class')) {
                classFiles.push({ path: relativePath, file: file });
            }
        });

        if (classFiles.length === 0) {
            throw new Error('JAR文件中没有找到class文件');
        }

        // 智能过滤：优先处理可能包含UI文本的类
        const prioritizedFiles = this.prioritizeClassFiles(classFiles);
        const totalFiles = prioritizedFiles.length;
        
        this.log(`📊 发现 ${totalFiles} 个class文件，开始优化扫描...`, 'info');

        // 使用并行处理批量扫描（分批处理避免内存溢出）
        const batchSize = 20; // 每批处理20个文件
        let scannedFiles = 0;
        const allStrings = [];

        for (let i = 0; i < prioritizedFiles.length; i += batchSize) {
            const batch = prioritizedFiles.slice(i, i + batchSize);
            
            // 并行处理当前批次
            const batchPromises = batch.map(async ({ path, file }) => {
                try {
                    const content = await file.async('uint8array');
                    return this.extractStringsFromBytecode(content, path, settings);
                } catch (error) {
                    console.warn(`扫描文件 ${path} 时出错:`, error);
                    return [];
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(strings => allStrings.push(...strings));
            
            scannedFiles += batch.length;
            const progress = Math.round(scannedFiles / totalFiles * 100);
            this.log(`📈 扫描进度: ${scannedFiles}/${totalFiles} (${progress}%) - 批次 ${Math.ceil((i + 1) / batchSize)}`, 'info');
            
            // 如果已经找到足够的字符串，可以提前结束（性能优化）
            if (allStrings.length > 1000 && progress > 50) {
                this.log(`💡 已检测到大量硬编码文本 (${allStrings.length}个)，提前结束扫描以提升性能`, 'info');
                break;
            }
        }
        
        this.hardcodedStrings = allStrings;
        
        // 去重和过滤
        this.hardcodedStrings = this.deduplicateAndFilter(this.hardcodedStrings, settings);        const scanTime = (Date.now() - startTime) / 1000;
        this.log(`⚡ 扫描完成，用时 ${scanTime.toFixed(2)}秒，发现 ${this.hardcodedStrings.length} 个候选文本`, 'success');
          // 翻译硬编码字符串
        if (this.hardcodedStrings.length > 0) {
            await this.translateHardcodedStrings(settings);
            // 翻译完成后更新显示
            this.displayHardcodedResults();
        }
    }

    extractStringsFromBytecode(bytecode, filePath, settings) {
        const strings = [];
        const dataView = new DataView(bytecode.buffer);
        
        try {
            // 简化的字节码字符串提取
            // 查找UTF-8字符串常量
            for (let i = 0; i < bytecode.length - 4; i++) {
                try {
                    // 寻找可能的字符串长度指示符
                    const possibleLength = dataView.getUint16(i, false);
                    
                    if (possibleLength > 0 && possibleLength < 1000 && i + 2 + possibleLength < bytecode.length) {
                        // 尝试提取字符串
                        const stringBytes = bytecode.slice(i + 2, i + 2 + possibleLength);
                        const candidateString = this.bytesToString(stringBytes);
                        
                        if (this.isValidHardcodedString(candidateString, settings)) {
                            const context = this.analyzeStringContext(bytecode, i, filePath);
                            strings.push({
                                text: candidateString,
                                location: filePath,
                                offset: i,
                                context: context,
                                type: this.detectStringType(candidateString, context)
                            });
                        }
                    }
                } catch (e) {
                    // 忽略解析错误，继续下一个位置
                    continue;
                }
            }
        } catch (error) {
            console.warn(`解析字节码时出错 ${filePath}:`, error);
        }
        
        return strings;
    }

    bytesToString(bytes) {
        try {
            // 尝试UTF-8解码
            const decoder = new TextDecoder('utf-8', { fatal: true });
            return decoder.decode(bytes);
        } catch (e) {
            // 如果UTF-8失败，尝试Latin-1
            let result = '';
            for (let i = 0; i < bytes.length; i++) {
                const byte = bytes[i];
                if (byte < 32 || byte > 126) {
                    // 非打印字符，可能不是字符串
                    throw new Error('Non-printable character found');
                }
                result += String.fromCharCode(byte);
            }
            return result;
        }
    }

    isValidHardcodedString(str, settings) {
        // 基本验证
        if (!str || str.length < settings.minTextLength) return false;
        
        // 排除单个字符
        if (settings.excludeSingleChar && str.length === 1) return false;
        
        // 排除纯数字
        if (settings.excludeNumbers && /^\d+(\.\d+)?$/.test(str)) return false;
        
        // 排除明显的技术字符串
        if (/^[a-z_]+\.[a-z_]+/.test(str)) return false; // 包名
        if (/^[A-Z_]+$/.test(str) && str.length < 10) return false; // 常量名
        if (/^\$[A-Z0-9_]+/.test(str)) return false; // 编译器生成的符号
        
        // 必须包含至少一个字母
        if (!/[a-zA-Z]/.test(str)) return false;
        
        // 排除路径和URL
        if (/^[\/\\]/.test(str) || /^https?:\/\//.test(str)) return false;
        
        // 检查是否为可能的用户界面文本
        if (/[A-Z]/.test(str) || str.includes(' ') || str.length > 10) {
            return true;
        }
        
        return false;
    }

    analyzeStringContext(bytecode, offset, filePath) {
        // 简化的上下文分析
        const contextSize = 50;
        const start = Math.max(0, offset - contextSize);
        const end = Math.min(bytecode.length, offset + contextSize);
        const context = bytecode.slice(start, end);
        
        // 寻找可能的方法调用模式
        let contextInfo = '';
        
        // 查找Component.literal的字节码模式
        const contextStr = Array.from(context).map(b => String.fromCharCode(b)).join('');
        if (contextStr.includes('Component') || contextStr.includes('literal')) {
            contextInfo += 'Component.literal() ';
        }
        
        // 查找tooltip相关
        if (contextStr.toLowerCase().includes('tooltip')) {
            contextInfo += 'Tooltip ';
        }
        
        // 查找GUI相关
        if (contextStr.includes('Screen') || contextStr.includes('Button')) {
            contextInfo += 'GUI ';
        }
        
        return contextInfo.trim() || '未知上下文';
    }

    detectStringType(text, context) {
        if (context.includes('Component.literal')) return 'component';
        if (context.includes('Tooltip')) return 'tooltip';
        if (context.includes('GUI')) return 'gui';
        return 'string';
    }

    deduplicateAndFilter(strings, settings) {
        // 去重
        const uniqueStrings = new Map();
        
        strings.forEach(item => {
            const key = item.text;
            if (!uniqueStrings.has(key)) {
                uniqueStrings.set(key, item);
            } else {
                // 合并位置信息
                const existing = uniqueStrings.get(key);
                existing.locations = existing.locations || [existing.location];
                if (!existing.locations.includes(item.location)) {
                    existing.locations.push(item.location);
                }
            }
        });
        
        return Array.from(uniqueStrings.values());
    }

    async translateHardcodedStrings(settings) {
        this.log('🌐 正在翻译硬编码字符串...', 'info');
        
        const apiProvider = document.getElementById('aiProvider').value;
        const apiKey = document.getElementById('apiKey').value;
        
        if (!apiKey) {
            this.log('⚠️ 未配置API密钥，跳过翻译步骤', 'warning');
            return;
        }
        
        let translatedCount = 0;
        const total = this.hardcodedStrings.length;
        
        for (let i = 0; i < this.hardcodedStrings.length; i++) {
            const item = this.hardcodedStrings[i];
            
            try {
                const translation = await this.translateSingleString(item.text, apiProvider, apiKey);
                item.translation = translation;
                translatedCount++;
                
                if (translatedCount % 5 === 0) {
                    this.log(`🔄 翻译进度: ${translatedCount}/${total}`, 'info');
                }
                
                // 避免请求过于频繁
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.warn(`翻译失败: ${item.text}`, error);
                item.translation = '翻译失败';
            }
        }
        
        this.log(`✅ 完成翻译，成功翻译 ${translatedCount} 个字符串`, 'success');
    }    async translateSingleString(text, provider, apiKey) {
        // 复用现有的翻译API逻辑
        const prompt = `请将以下Minecraft模组中的英文文本翻译成中文，保持简洁准确：${text}`;
        
        // 调用现有的翻译方法，传入完整的文本数组
        const texts = { [text]: text };
        const results = await this.translateTexts(texts, () => {});
        
        // 返回翻译结果
        return results[text] || text;
    }    displayHardcodedResults() {
        document.getElementById('hardcodedResults').style.display = 'block';
        document.getElementById('exportHardcodedReport').style.display = 'inline-block';
        document.getElementById('downloadHardcodedResult').style.display = 'inline-block';
        
        const strategy = document.querySelector('input[name="hardcodedStrategy"]:checked').value;
        if (strategy === 'patch') {
            document.getElementById('applyHardcodedChanges').style.display = 'inline-block';
        }
        
        // 显示统计信息
        this.displayHardcodedStats();
        
        // 显示字符串列表
        this.displayHardcodedList();
    }

    displayHardcodedStats() {
        const statsDiv = document.getElementById('hardcodedStats');
        const total = this.hardcodedStrings.length;
        const translated = this.hardcodedStrings.filter(item => item.translation).length;
        const componentLiterals = this.hardcodedStrings.filter(item => item.type === 'component').length;
        
        statsDiv.innerHTML = `
            <h5>📊 检测统计</h5>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">${total}</span>
                    <span class="stat-label">总计</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${translated}</span>
                    <span class="stat-label">已翻译</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${componentLiterals}</span>
                    <span class="stat-label">Component调用</span>
                </div>
            </div>
        `;
    }

    displayHardcodedList() {
        const listDiv = document.getElementById('hardcodedList');
        
        if (this.hardcodedStrings.length === 0) {
            listDiv.innerHTML = '<div class="hardcoded-item">未发现硬编码字符串</div>';
            return;
        }
        
        listDiv.innerHTML = this.hardcodedStrings.map((item, index) => `
            <div class="hardcoded-item">
                <input type="checkbox" class="hardcoded-checkbox" data-index="${index}" checked>
                <div class="hardcoded-content">
                    <div class="hardcoded-original">
                        <span class="code-highlight">${this.escapeHtml(item.text)}</span>
                    </div>
                    <div class="hardcoded-translation">
                        ${item.translation || '未翻译'}
                    </div>
                    <div class="hardcoded-context">
                        类型: ${item.type} | 上下文: ${item.context}
                    </div>
                    <div class="hardcoded-location">
                        ${item.location}
                    </div>
                </div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    exportHardcodedReport() {
        const report = {
            scanTime: new Date().toISOString(),
            totalStrings: this.hardcodedStrings.length,
            settings: this.getHardcodedSettings(),
            strings: this.hardcodedStrings
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `hardcoded-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log('📄 硬编码检测报告已导出', 'success');
    }

    async downloadHardcodedResult() {
        if (!this.currentFile || !this.hardcodedStrings || this.hardcodedStrings.length === 0) {
            this.log('没有可下载的硬编码翻译结果', 'error');
            return;
        }

        try {
            this.log('正在生成硬编码汉化包...', 'info');
            
            // 重新加载原始JAR文件
            const zip = await JSZip.loadAsync(this.currentFile);
            
            // 创建中文语言文件内容
            const translations = {};
            let translatedCount = 0;
            
            this.hardcodedStrings.forEach((item, index) => {
                if (item.translation && item.translation !== '翻译失败' && item.translation !== '未翻译') {
                    // 使用文件路径和文本作为key，确保唯一性
                    const key = `hardcoded.${item.type}.${index}`;
                    translations[key] = item.translation;
                    translatedCount++;
                }
            });

            if (translatedCount === 0) {
                this.log('没有可用的翻译内容', 'warning');
                return;
            }

            // 尝试检测原有的语言文件路径结构
            let langPath = 'assets/hardcoded_translations/lang/zh_cn.json';
            
            // 检查是否已有语言文件，使用相同的路径结构
            for (const [path] of Object.entries(zip.files)) {
                if (path.includes('/lang/') && path.endsWith('.json')) {
                    const pathParts = path.split('/');
                    const langIndex = pathParts.indexOf('lang');
                    if (langIndex > 0) {
                        pathParts[langIndex + 1] = 'zh_cn.json';
                        langPath = pathParts.join('/');
                        break;
                    }
                }
            }

            // 创建语言文件内容
            const langFileContent = JSON.stringify(translations, null, 2);
            
            // 添加语言文件到JAR
            zip.file(langPath, langFileContent);
            
            // 创建说明文件
            const readmeContent = `# 硬编码翻译说明

这个JAR文件包含了硬编码文本的翻译结果。

## 翻译统计
- 检测到的硬编码文本: ${this.hardcodedStrings.length} 个
- 成功翻译的文本: ${translatedCount} 个
- 翻译完成度: ${Math.round(translatedCount / this.hardcodedStrings.length * 100)}%

## 翻译内容预览
${this.hardcodedStrings.slice(0, 5).map(item => 
    `- "${item.text}" → "${item.translation || '未翻译'}"`
).join('\n')}

## 语言文件位置
${langPath}

## 注意事项
1. 这是通过硬编码检测生成的翻译文件
2. 某些翻译可能需要在游戏中验证准确性
3. 如果模组不支持语言文件，这些翻译可能不会生效
4. 建议配合字节码修改功能一起使用

生成时间: ${new Date().toLocaleString()}
工具版本: Minecraft模组翻译工具 - 硬编码检测版
`;
            
            zip.file('hardcoded_translations_readme.txt', readmeContent);
            
            // 生成新的JAR文件
            const blob = await zip.generateAsync({ type: 'blob' });
            
            // 创建下载链接
            const originalName = this.currentFile.name.replace('.jar', '');
            const downloadName = `${originalName}-硬编码汉化包.jar`;
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.log(`✅ 硬编码汉化包下载完成: ${downloadName}`, 'success');
            this.log(`📊 包含 ${translatedCount} 个翻译条目`, 'success');
            this.log(`📂 语言文件路径: ${langPath}`, 'info');
            this.log(`📖 包含详细说明文件: hardcoded_translations_readme.txt`, 'info');
            
            // 保存到历史记录
            this.saveToHistory(originalName, downloadName);
            
        } catch (error) {
            this.log(`下载失败: ${error.message}`, 'error');
            console.error('硬编码汉化包下载错误:', error);
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.translator = new MinecraftModTranslator();
});
