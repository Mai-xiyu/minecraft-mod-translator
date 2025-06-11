/**
 * Minecraft模组语言文件智能翻译工具
 * 作者：饩雨
 * 纯前端实现，无后端架构
 */

class MinecraftModTranslator {
    constructor() {
        this.currentFile = null;
        this.extractedFiles = {};
        this.translationResults = {};
        this.customTerms = {};
        this.usageCount = 0;
        this.isTranslating = false;
        
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
        document.getElementById('apiKey').addEventListener('input', this.handleApiKeyInput.bind(this));
        document.getElementById('customApiUrl').addEventListener('input', this.handleApiKeyInput.bind(this));// 操作按钮
        document.getElementById('startTranslation').addEventListener('click', this.startTranslation.bind(this));        document.getElementById('showHistory').addEventListener('click', this.showHistory.bind(this));
        document.getElementById('customTerms').addEventListener('click', this.showCustomTerms.bind(this));
        document.getElementById('gotoHardcodedTool').addEventListener('click', this.gotoHardcodedTool.bind(this));
        document.getElementById('diagnostics').addEventListener('click', this.runDiagnostics.bind(this));

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
        document.getElementById('termsFileInput').addEventListener('change', this.loadTermsFromFile.bind(this));

        // 历史记录弹窗
        document.getElementById('closeHistoryModal').addEventListener('click', () => {
            document.getElementById('historyModal').style.display = 'none';
        });
        document.getElementById('clearHistory').addEventListener('click', this.clearHistory.bind(this));
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
                this.log('💡 可能的解决方案：', 'warning');
                this.log('  1. 确保这是一个包含语言文件的Minecraft模组', 'warning');
                this.log('  2. 检查是否为未汉化的英文模组（应包含en_us.json）', 'warning');
                this.log('  3. 某些模组可能使用非标准目录结构', 'warning');
                this.log('  4. 尝试其他版本或下载源的模组文件', 'warning');
                
                this.resetFileState();
                return;
            }

            // 处理找到的语言文件
            let processedCount = 0;
            for (const [modId, files] of Object.entries(langFiles)) {
                await this.processLanguageFiles(modId, files);
                processedCount++;
            }
              this.log(`文件解压完成，成功处理 ${processedCount} 个模组`, 'success');
            
            // 确保状态检查在异步操作完成后执行
            setTimeout(() => {
                this.checkTranslationReady();
            }, 100);
            
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
            /^[a-z]{2}_[A-Z]{2}\.(json|lang)$/,  // 大写格式: en_US.json, zh_CN.lang
            /^[A-Z]{2}_[a-z]{2}\.(json|lang)$/,  // 混合格式: EN_us.json
            /^[A-Z]{2}_[A-Z]{2}\.(json|lang)$/,  // 全大写格式: EN_US.json
            /^[a-z]{2}\.(json|lang)$/,           // 简短格式: en.json, zh.lang
            /^lang_[a-z]{2}_[a-z]{2}\.(json|lang)$/, // 带前缀: lang_en_us.json
            /^language_[a-z]{2}_[a-z]{2}\.(json|lang)$/, // 带前缀: language_en_us.json
            /^[a-z]{2}-[a-z]{2}\.(json|lang)$/,  // 连字符格式: en-us.json
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
        // 查找英文文件 - 支持大小写变体
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
            this.log(`警告：模组 ${modId} 未找到英文语言文件`, 'warning');
            return;
        }        // 读取英文文件内容
        const englishContent = await englishFile.async('text');
        
        // 检查中文文件 - 智能处理大小写
        let chineseFileName;
        if (englishFileName.includes('en_us')) {
            chineseFileName = englishFileName.replace('en_us', 'zh_cn');
        } else if (englishFileName.includes('en_US')) {
            chineseFileName = englishFileName.replace('en_US', 'zh_CN');
        } else {
            // 默认使用小写格式
            chineseFileName = 'zh_cn.' + englishFileName.split('.').pop();
        }
        const chineseFileInfo = files[chineseFileName];
        const chineseFile = chineseFileInfo ? chineseFileInfo.zipEntry : null;
        
        this.extractedFiles[modId] = {
            englishFile: englishFileName,
            englishContent: englishContent,
            chineseFile: chineseFileName,
            chineseContent: chineseFile ? await chineseFile.async('text') : null,
            hasExistingChinese: !!chineseFile,            originalPath: englishFileInfo.directoryPath, // 保存原始目录路径
            modId: modId
        };
        
        this.log(`检测到模组 ${modId}: ${englishFileName}`, 'info');
        if (chineseFile) {
            this.log(`发现已有中文文件: ${chineseFileName}`, 'info');
        }
        
        // 确保状态更新
        this.checkTranslationReady();
    }

    handleProviderChange() {
        const provider = document.getElementById('aiProvider').value;
        const customApiGroup = document.getElementById('customApiGroup');
        
        if (provider === 'custom') {
            customApiGroup.style.display = 'block';        } else {
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
        const hasFile = this.currentFile && Object.keys(this.extractedFiles).length > 0;
        const hasValidKey = this.validateApiKey();
        const startButton = document.getElementById('startTranslation');
        
        // 调试信息
        console.log('[DEBUG] checkTranslationReady:', {
            currentFile: !!this.currentFile,
            extractedFilesCount: Object.keys(this.extractedFiles).length,
            hasValidKey: hasValidKey,
            hasFile: hasFile
        });
        
        if (hasFile && hasValidKey) {
            startButton.disabled = false;
            startButton.innerHTML = '<span class="btn-text">开始翻译</span>';
        } else {
            startButton.disabled = true;
            if (!hasFile) {
                startButton.innerHTML = '<span class="btn-text">请先上传文件</span>';
            } else if (!hasValidKey) {
                startButton.innerHTML = '<span class="btn-text">请输入有效API密钥</span>';
            }
        }
    }

    async startTranslation() {
        if (this.isTranslating) return;
        
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
            'Sand': '沙子',
            'Gravel': '沙砾',
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
        }
        if (Object.keys(this.extractedFiles).length === 0 && this.currentFile) {
            this.log('   3. 确保JAR文件包含assets/[模组ID]/lang/目录结构', 'warning');
            this.log('   4. 确保存在en_us.json或en_us.lang文件', 'warning');        }
    }

    gotoHardcodedTool() {
        this.log('🔧 正在跳转到硬编码汉化工具...', 'info');
        window.open('hardcoded-translator.html', '_blank');
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.translator = new MinecraftModTranslator();
});