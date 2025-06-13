/**
 * 增强版硬编码字符串翻译工具
 * 基于字节码精确解析LDC指令，实现准确的字符串提取和替换
 * 
 * 核心特性：
 * 1. 精确的LDC字符串常量提取
 * 2. 智能的用户界面（多选、批量操作）
 * 3. AI翻译集成（支持多个翻译服务）
 * 4. 安全的字节码替换（保持结构完整性）
 */

class EnhancedHardcodedStringTool {
    constructor() {
        this.uploadedJar = null;
        this.jarEntries = new Map(); // 存储原始JAR文件内容
        this.detectedStrings = []; // 检测到的字符串
        this.selectedStrings = new Set(); // 用户选择的字符串
        this.translationResults = new Map(); // 翻译结果
        this.currentStep = 1;
        this.debugMode = true;
        
        // AI翻译配置
        this.aiConfig = {
            provider: 'openai',
            apiKey: '',
            customApiUrl: '',
            model: 'gpt-3.5-turbo',
            batchSize: 10 // 批量翻译大小
        };
        
        this.initializeEventListeners();
        this.updateStepDisplay();
    }

    // 初始化事件监听器
    initializeEventListeners() {
        // 文件上传相关
        this.setupFileUpload();
        
        // 扫描相关
        this.setupScanControls();
        
        // 字符串选择相关
        this.setupStringSelection();
        
        // AI翻译配置相关
        this.setupAIConfiguration();
        
        // 翻译和下载相关
        this.setupTranslationControls();
        
        // 调试和日志相关
        this.setupDebugControls();
    }

    setupFileUpload() {
        const fileInput = document.getElementById('enhancedFileInput');
        const uploadArea = document.getElementById('enhancedUploadArea');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        
        if (uploadArea) {
            uploadArea.addEventListener('click', () => {
                if (fileInput) fileInput.click();
            });
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileUploadDirect(files[0]);
                }
            });
        }
    }

    setupScanControls() {
        const scanBtn = document.getElementById('startEnhancedScan');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => this.scanForLdcStrings());
        }
    }

    setupStringSelection() {
        const selectAllBtn = document.getElementById('enhancedSelectAll');
        const deselectAllBtn = document.getElementById('enhancedDeselectAll');
        const filterInput = document.getElementById('enhancedStringFilter');
        
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllStrings());
        }
        
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => this.deselectAllStrings());
        }
        
        if (filterInput) {
            filterInput.addEventListener('input', (e) => this.filterStrings(e.target.value));
        }
    }

    setupAIConfiguration() {
        const providerSelect = document.getElementById('enhancedAiProvider');
        const apiKeyInput = document.getElementById('enhancedApiKey');
        const customUrlInput = document.getElementById('enhancedCustomUrl');
        const modelSelect = document.getElementById('enhancedModel');
        
        if (providerSelect) {
            providerSelect.addEventListener('change', (e) => {
                this.aiConfig.provider = e.target.value;
                this.updateAIConfigUI();
            });
        }
        
        if (apiKeyInput) {
            apiKeyInput.addEventListener('input', (e) => {
                this.aiConfig.apiKey = e.target.value;
                this.validateAIConfig();
            });
        }
        
        if (customUrlInput) {
            customUrlInput.addEventListener('input', (e) => {
                this.aiConfig.customApiUrl = e.target.value;
            });
        }
        
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => {
                this.aiConfig.model = e.target.value;
            });
        }
    }

    setupTranslationControls() {
        const translateBtn = document.getElementById('startEnhancedTranslation');
        const downloadBtn = document.getElementById('downloadEnhancedResult');
        
        if (translateBtn) {
            translateBtn.addEventListener('click', () => this.startBatchTranslation());
        }
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadTranslatedJar());
        }
    }

    setupDebugControls() {
        const clearLogBtn = document.getElementById('clearEnhancedLog');
        const exportLogBtn = document.getElementById('exportEnhancedLog');
        
        if (clearLogBtn) {
            clearLogBtn.addEventListener('click', () => this.clearLog());
        }
        
        if (exportLogBtn) {
            exportLogBtn.addEventListener('click', () => this.exportLog());
        }
    }

    // 文件上传处理
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            await this.handleFileUploadDirect(file);
        }
    }

    async handleFileUploadDirect(file) {
        if (!file.name.toLowerCase().endsWith('.jar')) {
            this.showUserMessage('请选择JAR文件', 'error');
            return;
        }

        this.log(`开始上传文件: ${file.name} (${this.formatFileSize(file.size)})`);
        
        try {
            this.uploadedJar = await file.arrayBuffer();
            this.showUserMessage(`文件上传成功: ${file.name}`, 'success');
            this.currentStep = 2;
            this.updateStepDisplay();
            
            // 显示扫描按钮
            const scanSection = document.getElementById('enhancedScanSection');
            if (scanSection) {
                scanSection.style.display = 'block';
            }
            
        } catch (error) {
            this.log('文件上传失败', error);
            this.showUserMessage(`文件上传失败: ${error.message}`, 'error');
        }
    }

    // 精确扫描LDC字符串常量
    async scanForLdcStrings() {
        if (!this.uploadedJar) {
            this.showUserMessage('请先上传JAR文件', 'warning');
            return;
        }

        this.log('开始精确扫描LDC字符串常量...');
        const scanBtn = document.getElementById('startEnhancedScan');
        const originalText = scanBtn.textContent;
        scanBtn.textContent = '扫描中...';
        scanBtn.disabled = true;

        // 显示进度
        this.showScanProgress(true);
        this.updateScanProgress(0, '准备解析JAR文件...');

        try {
            // 解析JAR文件
            const zipLib = new JSZip();
            const zip = await zipLib.loadAsync(this.uploadedJar);
            
            this.log(`JAR文件解析成功，共 ${Object.keys(zip.files).length} 个文件`);
            this.updateScanProgress(10, `发现 ${Object.keys(zip.files).length} 个文件`);
            
            // 存储JAR内容用于后续重建
            this.jarEntries.clear();
            for (const [fileName, zipEntry] of Object.entries(zip.files)) {
                if (!zipEntry.dir) {
                    const content = await zipEntry.async('uint8array');
                    this.jarEntries.set(fileName, content);
                }
            }

            const allLdcStrings = new Map();
            let classFileCount = 0;
            let parsedFileCount = 0;

            // 统计class文件数量
            for (const fileName of this.jarEntries.keys()) {
                if (fileName.endsWith('.class')) {
                    classFileCount++;
                }
            }

            this.updateScanProgress(20, `找到 ${classFileCount} 个类文件，开始精确扫描...`);

            // 扫描每个class文件的LDC指令
            for (const [fileName, classData] of this.jarEntries) {
                if (fileName.endsWith('.class')) {
                    this.log(`精确分析类文件: ${fileName}`);
                    
                    try {
                        const ldcStrings = this.extractLdcStringConstants(classData, fileName);
                        
                        ldcStrings.forEach(str => {
                            const key = `${str.text}|${str.constantPoolIndex}`;
                            if (!allLdcStrings.has(key)) {
                                allLdcStrings.set(key, {
                                    ...str,
                                    files: [fileName],
                                    occurrences: 1
                                });
                            } else {
                                const existing = allLdcStrings.get(key);
                                existing.files.push(fileName);
                                existing.occurrences++;
                            }
                        });
                        
                        parsedFileCount++;
                        
                        // 更新进度 (20-80%)
                        const progress = 20 + Math.floor((parsedFileCount / classFileCount) * 60);
                        this.updateScanProgress(progress, `正在扫描 ${parsedFileCount}/${classFileCount} 个文件...`);
                        
                        this.log(`从 ${fileName} 提取到 ${ldcStrings.length} 个LDC字符串`);
                    } catch (error) {
                        this.log(`解析 ${fileName} 失败: ${error.message}`);
                    }
                }
            }

            this.updateScanProgress(85, '正在分析和过滤字符串...');
            this.log(`LDC扫描完成: 处理了 ${parsedFileCount}/${classFileCount} 个类文件`);
            
            // 转换为数组并过滤
            this.detectedStrings = Array.from(allLdcStrings.values())
                .filter(str => this.isTranslatableString(str.text))
                .sort((a, b) => b.occurrences - a.occurrences); // 按出现频率排序

            this.updateScanProgress(95, '准备显示结果...');
            this.log(`过滤后得到 ${this.detectedStrings.length} 个可翻译的LDC字符串`);
            
            this.updateScanProgress(100, '扫描完成！');
            
            // 隐藏进度，显示结果
            setTimeout(() => {
                this.showScanProgress(false);
                this.displayLdcStrings();
            }, 1000);

            if (this.detectedStrings.length === 0) {
                this.showUserMessage('未检测到可翻译的LDC字符串', 'warning');
            } else {
                this.currentStep = 3;
                this.updateStepDisplay();
                this.showUserMessage(
                    `🎉 LDC扫描完成！检测到 ${this.detectedStrings.length} 个字符串常量。`, 
                    'success'
                );
            }

        } catch (error) {
            this.log('扫描过程出错', error);
            this.showUserMessage(`扫描失败: ${error.message}`, 'error');
        } finally {
            scanBtn.textContent = originalText;
            scanBtn.disabled = false;
            this.showScanProgress(false);
        }
    }

    // 精确提取LDC字符串常量
    extractLdcStringConstants(classData, fileName) {
        const ldcStrings = [];
        
        try {
            if (!window.JavaBytecodeParser) {
                throw new Error('JavaBytecodeParser未加载');
            }

            const parser = new JavaBytecodeParser();
            const classInfo = parser.parseClassFile(classData);
            
            this.log(`解析 ${fileName}: 常量池大小 ${classInfo.constantPool.length}`);
            
            // 第一步：收集所有字符串常量
            const stringConstants = new Map(); // index -> string
            const utf8Constants = new Map(); // index -> utf8 text
            
            classInfo.constantPool.forEach((constant, index) => {
                if (!constant) return;
                
                if (constant.tag === 1) { // CONSTANT_Utf8
                    utf8Constants.set(index, constant.text);
                } else if (constant.tag === 8) { // CONSTANT_String
                    stringConstants.set(index, constant.stringIndex);
                }
            });
            
            // 第二步：解析方法字节码，查找LDC指令
            if (classInfo.methods) {
                classInfo.methods.forEach(method => {
                    const codeAttribute = this.findCodeAttribute(method.attributes, classInfo.constantPool);
                    if (codeAttribute && codeAttribute.code) {
                        const ldcIndices = this.findLdcInstructions(codeAttribute.code);
                        
                        ldcIndices.forEach(constantIndex => {
                            let stringText = null;
                            let actualIndex = constantIndex;
                            
                            // 检查是否是字符串常量引用
                            if (stringConstants.has(constantIndex)) {
                                const utf8Index = stringConstants.get(constantIndex);
                                stringText = utf8Constants.get(utf8Index);
                                actualIndex = utf8Index;
                            } else if (utf8Constants.has(constantIndex)) {
                                // 直接是UTF-8常量
                                stringText = utf8Constants.get(constantIndex);
                            }
                            
                            if (stringText && this.isUserVisibleString(stringText)) {
                                ldcStrings.push({
                                    text: stringText,
                                    constantPoolIndex: actualIndex,
                                    stringConstantIndex: constantIndex,
                                    type: this.detectStringType(stringText),
                                    file: fileName,
                                    method: this.getMethodName(method, classInfo.constantPool)
                                });
                            }
                        });
                    }
                });
            }
            
        } catch (error) {
            this.log(`LDC字节码解析失败 ${fileName}: ${error.message}`);
        }
        
        return ldcStrings;
    }    // 查找方法的Code属性
    findCodeAttribute(attributes, constantPool) {
        if (!attributes) return null;
        
        for (const attr of attributes) {
            const nameIndex = attr.nameIndex || attr.attributeNameIndex;
            if (constantPool[nameIndex] && constantPool[nameIndex].text === 'Code') {
                // 解析Code属性的结构
                try {
                    if (!window.JavaBytecodeParser) {
                        return null;
                    }
                    const parser = new JavaBytecodeParser();
                    return parser.parseCodeAttribute(attr.info, constantPool);
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    }

    // 在字节码中查找LDC指令
    findLdcInstructions(codeBytes) {
        const ldcIndices = [];
        const code = new Uint8Array(codeBytes);
        
        for (let i = 0; i < code.length; i++) {
            const opcode = code[i];
            
            if (opcode === 0x12) { // ldc
                if (i + 1 < code.length) {
                    ldcIndices.push(code[i + 1]);
                    i += 1; // 跳过操作数
                }
            } else if (opcode === 0x13) { // ldc_w
                if (i + 2 < code.length) {
                    const index = (code[i + 1] << 8) | code[i + 2];
                    ldcIndices.push(index);
                    i += 2; // 跳过操作数
                }
            } else if (opcode === 0x14) { // ldc2_w
                if (i + 2 < code.length) {
                    i += 2; // 跳过操作数，但不记录（这是long/double）
                }
            } else {
                // 跳过其他指令的操作数
                i += this.getInstructionLength(opcode) - 1;
            }
        }
        
        return ldcIndices;
    }

    // 获取指令长度（简化版本，只处理常见指令）
    getInstructionLength(opcode) {
        // 这是一个简化的指令长度表，实际应该更完整
        const lengths = {
            0x00: 1, // nop
            0x01: 1, // aconst_null
            0x02: 1, // iconst_m1
            0x03: 1, // iconst_0
            0x04: 1, // iconst_1
            0x05: 1, // iconst_2
            0x06: 1, // iconst_3
            0x07: 1, // iconst_4
            0x08: 1, // iconst_5
            0x09: 1, // lconst_0
            0x0a: 1, // lconst_1
            0x0b: 1, // fconst_0
            0x0c: 1, // fconst_1
            0x0d: 1, // fconst_2
            0x0e: 1, // dconst_0
            0x0f: 1, // dconst_1
            0x10: 2, // bipush
            0x11: 3, // sipush
            0x12: 2, // ldc
            0x13: 3, // ldc_w
            0x14: 3, // ldc2_w
            0x15: 2, // iload
            0x16: 2, // lload
            0x17: 2, // fload
            0x18: 2, // dload
            0x19: 2, // aload
            // ... 更多指令
        };
        
        return lengths[opcode] || 1; // 默认长度为1
    }

    // 获取方法名
    getMethodName(method, constantPool) {
        try {
            const nameIndex = method.nameIndex;
            return constantPool[nameIndex]?.text || '未知方法';
        } catch (e) {
            return '未知方法';
        }
    }

    // 判断是否为用户可见字符串
    isUserVisibleString(str) {
        if (!str || str.length < 2) return false;
        
        // 排除技术性标识符
        const technicalPatterns = [
            /^[a-z]+(\.[a-z]+)+$/, // 包名
            /^\([BCDFIJSZ\[L;]*\)[BCDFIJSZ\[L;]*$/, // 方法签名
            /^L[a-zA-Z0-9/$_]+;$/, // 类描述符
            /^\[[BCDFIJSZ\[L]/, // 数组描述符
            /^[A-Z_][A-Z0-9_]*$/, // 常量名
            /^(get|set|is)[A-Z]/, // getter/setter
            /^<(init|clinit)>$/, // 构造函数
            /^\d+(\.\d+)*$/, // 纯数字
            /^[a-f0-9]{8,}$/i, // 十六进制
            /^[\\/\\.\\-_]+$/, // 分隔符
            /^(true|false|null)$/i, // 字面量
        ];
        
        if (technicalPatterns.some(pattern => pattern.test(str))) {
            return false;
        }
        
        return true;
    }

    // 判断是否为可翻译字符串
    isTranslatableString(str) {
        if (!this.isUserVisibleString(str)) return false;
        
        // 包含有意义内容的字符串才可翻译
        const hasLetters = /[a-zA-Z\u4e00-\u9fff\u3040-\u309F\u30A0-\u30FF]/.test(str);
        if (!hasLetters) return false;
        
        // 排除单纯的格式字符串
        if (/^[%\{\}]+$/.test(str)) return false;
        
        return true;
    }

    // 检测字符串类型
    detectStringType(str) {
        const patterns = {
            'button': /^(button|btn|click|press|confirm|cancel|ok|yes|no)/i,
            'title': /^(title|header|heading|caption)/i,
            'message': /^(error|warning|info|success|message|alert)/i,
            'tooltip': /^(tooltip|hint|help|description)/i,
            'menu': /^(menu|option|item|choice)/i,
            'label': /^(label|name|text)/i,
            'placeholder': /^(placeholder|hint|example)/i,
        };
        
        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(str)) {
                return type;
            }
        }
        
        return 'text';
    }

    // 显示LDC字符串列表
    displayLdcStrings() {
        const container = document.getElementById('enhancedStringList');
        if (!container) return;

        container.innerHTML = '';
        
        // 创建表格
        const table = document.createElement('table');
        table.className = 'string-table enhanced-table';
        
        // 表头
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th><input type="checkbox" id="enhancedSelectAllCheckbox" title="全选/取消全选"></th>
                <th>字符串内容</th>
                <th>类型</th>
                <th>出现次数</th>
                <th>常量池索引</th>
                <th>涉及文件</th>
                <th>操作</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // 表体
        const tbody = document.createElement('tbody');
        
        this.detectedStrings.forEach((str, index) => {
            const row = document.createElement('tr');
            row.className = 'string-row';
            row.dataset.index = index;
            
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="string-checkbox" data-index="${index}">
                </td>
                <td class="string-content" title="${this.escapeHtml(str.text)}">
                    <span class="string-text">${this.escapeHtml(str.text)}</span>
                </td>
                <td>
                    <span class="string-type type-${str.type}">${str.type}</span>
                </td>
                <td class="occurrence-count">${str.occurrences}</td>
                <td class="constant-index">${str.constantPoolIndex}</td>
                <td class="file-list" title="${str.files.join(', ')}">
                    ${str.files.length} 个文件
                </td>
                <td class="actions">
                    <button class="preview-btn" onclick="hardcodedTool.previewString(${index})" title="预览">👁️</button>
                    <button class="translate-single-btn" onclick="hardcodedTool.translateSingle(${index})" title="单独翻译">🌐</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        container.appendChild(table);
        
        // 设置全选复选框事件
        const selectAllCheckbox = document.getElementById('enhancedSelectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectAllStrings();
                } else {
                    this.deselectAllStrings();
                }
            });
        }
        
        // 设置单个复选框事件
        const checkboxes = container.querySelectorAll('.string-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (e.target.checked) {
                    this.selectedStrings.add(index);
                } else {
                    this.selectedStrings.delete(index);
                }
                this.updateSelectionUI();
            });
        });
        
        // 显示字符串选择区域
        const selectionSection = document.getElementById('enhancedSelectionSection');
        if (selectionSection) {
            selectionSection.style.display = 'block';
        }
        
        // 更新统计信息
        this.updateStringStats();
    }

    // 选择所有字符串
    selectAllStrings() {
        this.selectedStrings.clear();
        this.detectedStrings.forEach((_, index) => {
            this.selectedStrings.add(index);
        });
        
        // 更新UI
        const checkboxes = document.querySelectorAll('.string-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        const selectAllCheckbox = document.getElementById('enhancedSelectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = true;
        }
        
        this.updateSelectionUI();
    }

    // 取消选择所有字符串
    deselectAllStrings() {
        this.selectedStrings.clear();
        
        // 更新UI
        const checkboxes = document.querySelectorAll('.string-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        const selectAllCheckbox = document.getElementById('enhancedSelectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
        
        this.updateSelectionUI();
    }

    // 过滤字符串
    filterStrings(filterText) {
        const rows = document.querySelectorAll('.string-row');
        const filter = filterText.toLowerCase();
        
        rows.forEach(row => {
            const text = row.querySelector('.string-text').textContent.toLowerCase();
            const type = row.querySelector('.string-type').textContent.toLowerCase();
            
            if (text.includes(filter) || type.includes(filter)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // 更新选择UI状态
    updateSelectionUI() {
        const selectedCount = this.selectedStrings.size;
        const totalCount = this.detectedStrings.length;
        
        // 更新选择计数显示
        const selectionCount = document.getElementById('enhancedSelectionCount');
        if (selectionCount) {
            selectionCount.textContent = `已选择 ${selectedCount}/${totalCount} 个字符串`;
        }
        
        // 更新翻译按钮状态
        const translateBtn = document.getElementById('startEnhancedTranslation');
        if (translateBtn) {
            translateBtn.disabled = selectedCount === 0 || !this.aiConfig.apiKey;
            translateBtn.textContent = selectedCount > 0 ? 
                `翻译选中的 ${selectedCount} 个字符串` : '选择要翻译的字符串';
        }
        
        // 更新全选复选框状态
        const selectAllCheckbox = document.getElementById('enhancedSelectAllCheckbox');
        if (selectAllCheckbox) {
            if (selectedCount === 0) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = false;
            } else if (selectedCount === totalCount) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = true;
            } else {
                selectAllCheckbox.indeterminate = true;
            }
        }
    }

    // 更新字符串统计信息
    updateStringStats() {
        const stats = document.getElementById('enhancedStringStats');
        if (!stats) return;
        
        const typeCount = {};
        this.detectedStrings.forEach(str => {
            typeCount[str.type] = (typeCount[str.type] || 0) + 1;
        });
        
        const totalOccurrences = this.detectedStrings.reduce((sum, str) => sum + str.occurrences, 0);
        
        stats.innerHTML = `
            <div class="stats-item">
                <strong>总字符串数：</strong>${this.detectedStrings.length}
            </div>
            <div class="stats-item">
                <strong>总出现次数：</strong>${totalOccurrences}
            </div>
            <div class="stats-item">
                <strong>类型分布：</strong>
                ${Object.entries(typeCount).map(([type, count]) => 
                    `<span class="type-stat">${type}: ${count}</span>`
                ).join(', ')}
            </div>
        `;
    }

    // 开始批量翻译
    async startBatchTranslation() {
        if (this.selectedStrings.size === 0) {
            this.showUserMessage('请先选择要翻译的字符串', 'warning');
            return;
        }
        
        if (!this.aiConfig.apiKey) {
            this.showUserMessage('请先配置AI翻译API密钥', 'warning');
            return;
        }
        
        this.log(`开始批量翻译 ${this.selectedStrings.size} 个字符串...`);
        
        const translateBtn = document.getElementById('startEnhancedTranslation');
        const originalText = translateBtn.textContent;
        translateBtn.textContent = '翻译中...';
        translateBtn.disabled = true;
        
        // 显示翻译进度
        this.showTranslationProgress(true);
        
        try {
            const selectedStringData = Array.from(this.selectedStrings).map(index => this.detectedStrings[index]);
            const batches = this.createTranslationBatches(selectedStringData);
            
            this.updateTranslationProgress(0, `准备翻译 ${batches.length} 批字符串...`);
            
            let completedBatches = 0;
            
            for (const batch of batches) {
                this.log(`翻译批次 ${completedBatches + 1}/${batches.length}`);
                
                try {
                    const translations = await this.translateBatch(batch);
                    
                    // 保存翻译结果
                    translations.forEach((translation, index) => {
                        const originalString = batch[index];
                        this.translationResults.set(originalString.text, translation);
                    });
                    
                    completedBatches++;
                    const progress = Math.floor((completedBatches / batches.length) * 100);
                    this.updateTranslationProgress(progress, `完成 ${completedBatches}/${batches.length} 批翻译`);
                    
                } catch (error) {
                    this.log(`批次翻译失败: ${error.message}`);
                    // 继续下一批
                }
                
                // 批次间延迟，避免API限制
                if (completedBatches < batches.length) {
                    await this.delay(1000);
                }
            }
            
            this.updateTranslationProgress(100, '翻译完成！');
            
            // 显示翻译结果
            setTimeout(() => {
                this.showTranslationProgress(false);
                this.displayTranslationResults();
            }, 1000);
            
            this.log(`批量翻译完成，成功翻译 ${this.translationResults.size} 个字符串`);
            this.showUserMessage(`🎉 翻译完成！成功翻译 ${this.translationResults.size} 个字符串。`, 'success');
            
            // 进入下一步
            this.currentStep = 4;
            this.updateStepDisplay();
            
        } catch (error) {
            this.log('批量翻译失败', error);
            this.showUserMessage(`翻译失败: ${error.message}`, 'error');
        } finally {
            translateBtn.textContent = originalText;
            translateBtn.disabled = false;
            this.showTranslationProgress(false);
        }
    }

    // 创建翻译批次
    createTranslationBatches(strings) {
        const batches = [];
        const batchSize = this.aiConfig.batchSize;
        
        for (let i = 0; i < strings.length; i += batchSize) {
            batches.push(strings.slice(i, i + batchSize));
        }
        
        return batches;
    }

    // 翻译单个批次
    async translateBatch(batch) {
        const textsToTranslate = batch.map(item => item.text);
        
        switch (this.aiConfig.provider) {
            case 'openai':
                return await this.translateWithOpenAI(textsToTranslate);
            case 'claude':
                return await this.translateWithClaude(textsToTranslate);
            case 'gemini':
                return await this.translateWithGemini(textsToTranslate);
            case 'custom':
                return await this.translateWithCustomAPI(textsToTranslate);
            default:
                throw new Error(`不支持的翻译服务: ${this.aiConfig.provider}`);
        }
    }

    // OpenAI翻译实现
    async translateWithOpenAI(texts) {
        const prompt = `请将以下英文游戏界面文本翻译成中文，保持原意和游戏术语的准确性。直接返回翻译结果，每行一个：

${texts.join('\n')}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.aiConfig.apiKey}`
            },
            body: JSON.stringify({
                model: this.aiConfig.model,
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
            throw new Error(`OpenAI API错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const translations = data.choices[0].message.content.trim().split('\n');
        
        // 确保翻译数量匹配
        if (translations.length !== texts.length) {
            throw new Error('翻译结果数量与原文不匹配');
        }
        
        return translations;
    }

    // Claude翻译实现（示例）
    async translateWithClaude(texts) {
        // 实现Claude API调用
        throw new Error('Claude翻译暂未实现');
    }

    // Gemini翻译实现（示例）
    async translateWithGemini(texts) {
        // 实现Gemini API调用
        throw new Error('Gemini翻译暂未实现');
    }

    // 自定义API翻译实现
    async translateWithCustomAPI(texts) {
        if (!this.aiConfig.customApiUrl) {
            throw new Error('请配置自定义API URL');
        }
        
        // 实现自定义API调用
        throw new Error('自定义API翻译暂未实现');
    }

    // 显示翻译结果
    displayTranslationResults() {
        const container = document.getElementById('enhancedTranslationResults');
        if (!container) return;

        container.innerHTML = '';
        
        // 创建结果表格
        const table = document.createElement('table');
        table.className = 'translation-results-table';
        
        // 表头
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>原文</th>
                <th>译文</th>
                <th>操作</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // 表体
        const tbody = document.createElement('tbody');
        
        for (const [original, translation] of this.translationResults) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="original-text">${this.escapeHtml(original)}</td>
                <td class="translated-text">
                    <input type="text" value="${this.escapeHtml(translation)}" 
                           class="translation-edit" data-original="${this.escapeHtml(original)}">
                </td>
                <td class="actions">
                    <button onclick="hardcodedTool.retranslateString('${this.escapeHtml(original)}')" title="重新翻译">🔄</button>
                    <button onclick="hardcodedTool.resetTranslation('${this.escapeHtml(original)}')" title="恢复原文">↶</button>
                </td>
            `;
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        container.appendChild(table);
        
        // 设置编辑事件
        const editInputs = container.querySelectorAll('.translation-edit');
        editInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const original = e.target.dataset.original;
                const newTranslation = e.target.value;
                this.translationResults.set(original, newTranslation);
            });
        });
        
        // 显示结果区域和下载按钮
        const resultsSection = document.getElementById('enhancedResultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
        
        const downloadBtn = document.getElementById('downloadEnhancedResult');
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.textContent = `下载翻译后的JAR (${this.translationResults.size}个翻译)`;
        }
    }

    // 下载翻译后的JAR文件
    async downloadTranslatedJar() {
        if (this.translationResults.size === 0) {
            this.showUserMessage('没有翻译结果可下载', 'warning');
            return;
        }

        this.log('开始生成翻译后的JAR文件...');
        
        const downloadBtn = document.getElementById('downloadEnhancedResult');
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = '生成中...';
        downloadBtn.disabled = true;

        try {
            // 创建新的ZIP文件
            const newZip = new JSZip();
            let modifiedCount = 0;

            // 处理每个文件
            for (const [fileName, originalContent] of this.jarEntries) {
                if (fileName.endsWith('.class')) {
                    // 尝试替换class文件中的字符串
                    try {
                        const modifiedContent = this.replaceStringsInClassFile(originalContent, fileName);
                        newZip.file(fileName, modifiedContent);
                        
                        if (modifiedContent !== originalContent) {
                            modifiedCount++;
                        }
                    } catch (error) {
                        this.log(`替换 ${fileName} 中的字符串失败: ${error.message}`);
                        // 保持原文件
                        newZip.file(fileName, originalContent);
                    }
                } else {
                    // 非class文件保持不变
                    newZip.file(fileName, originalContent);
                }
            }

            this.log(`成功修改了 ${modifiedCount} 个类文件`);

            // 生成ZIP文件
            const zipBlob = await newZip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            // 创建下载链接
            const downloadUrl = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'translated-mod.jar';
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 清理URL对象
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

            this.showUserMessage(`✅ JAR文件下载完成！修改了 ${modifiedCount} 个类文件。`, 'success');
            this.log(`翻译后的JAR文件下载完成`);

        } catch (error) {
            this.log('生成JAR文件失败', error);
            this.showUserMessage(`生成失败: ${error.message}`, 'error');
        } finally {
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
        }
    }

    // 在class文件中替换字符串
    replaceStringsInClassFile(classData, fileName) {
        try {
            if (!window.JavaBytecodeParser) {
                throw new Error('JavaBytecodeParser未加载');
            }

            const parser = new JavaBytecodeParser();
            const classInfo = parser.parseClassFile(classData);
            
            let modified = false;
            
            // 遍历常量池，替换UTF-8字符串
            classInfo.constantPool.forEach((constant, index) => {
                if (constant && constant.tag === 1) { // CONSTANT_Utf8
                    const originalText = constant.text;
                    if (this.translationResults.has(originalText)) {
                        const translation = this.translationResults.get(originalText);
                        if (translation !== originalText) {
                            // 更新UTF-8常量
                            constant.text = translation;
                            constant.bytes = parser.encodeModifiedUTF8(translation);
                            constant.length = constant.bytes.length;
                            modified = true;
                            
                            this.log(`${fileName}: "${originalText}" -> "${translation}"`);
                        }
                    }
                }
            });

            if (modified) {
                // 重新构建class文件
                return parser.rebuildClassFile(classInfo);
            } else {
                return classData;
            }

        } catch (error) {
            this.log(`处理 ${fileName} 失败: ${error.message}`);
            return classData; // 返回原文件
        }
    }

    // 工具方法
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // UI辅助方法
    showScanProgress(show) {
        const progress = document.getElementById('enhancedScanProgress');
        if (progress) {
            progress.style.display = show ? 'block' : 'none';
        }
    }

    updateScanProgress(percent, message) {
        const progressBar = document.getElementById('enhancedScanProgressBar');
        const progressText = document.getElementById('enhancedScanProgressText');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (progressText) {
            progressText.textContent = message;
        }
    }

    showTranslationProgress(show) {
        const progress = document.getElementById('enhancedTranslationProgress');
        if (progress) {
            progress.style.display = show ? 'block' : 'none';
        }
    }

    updateTranslationProgress(percent, message) {
        const progressBar = document.getElementById('enhancedTranslationProgressBar');
        const progressText = document.getElementById('enhancedTranslationProgressText');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (progressText) {
            progressText.textContent = message;
        }
    }

    updateStepDisplay() {
        // 更新步骤指示器
        for (let i = 1; i <= 4; i++) {
            const step = document.getElementById(`enhancedStep${i}`);
            if (step) {
                if (i === this.currentStep) {
                    step.classList.add('active');
                    step.classList.remove('completed');
                } else if (i < this.currentStep) {
                    step.classList.add('completed');
                    step.classList.remove('active');
                } else {
                    step.classList.remove('active', 'completed');
                }
            }
        }
    }

    updateAIConfigUI() {
        // 根据选择的AI服务商更新UI
        const customUrlGroup = document.getElementById('enhancedCustomUrlGroup');
        const modelGroup = document.getElementById('enhancedModelGroup');
        
        if (customUrlGroup) {
            customUrlGroup.style.display = this.aiConfig.provider === 'custom' ? 'block' : 'none';
        }
        
        // 更新模型选项
        if (modelGroup) {
            const modelSelect = document.getElementById('enhancedModel');
            if (modelSelect) {
                this.updateModelOptions(modelSelect);
            }
        }
    }

    updateModelOptions(select) {
        const models = {
            'openai': [
                { value: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo' },
                { value: 'gpt-4', text: 'GPT-4' },
                { value: 'gpt-4-turbo', text: 'GPT-4 Turbo' }
            ],
            'claude': [
                { value: 'claude-3-haiku', text: 'Claude 3 Haiku' },
                { value: 'claude-3-sonnet', text: 'Claude 3 Sonnet' },
                { value: 'claude-3-opus', text: 'Claude 3 Opus' }
            ],
            'gemini': [
                { value: 'gemini-pro', text: 'Gemini Pro' },
                { value: 'gemini-pro-vision', text: 'Gemini Pro Vision' }
            ]
        };

        const currentModels = models[this.aiConfig.provider] || [];
        select.innerHTML = '';
        
        currentModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.text;
            select.appendChild(option);
        });
        
        if (currentModels.length > 0) {
            this.aiConfig.model = currentModels[0].value;
        }
    }

    validateAIConfig() {
        const hasApiKey = this.aiConfig.apiKey.trim().length > 0;
        const hasCustomUrl = this.aiConfig.provider !== 'custom' || this.aiConfig.customApiUrl.trim().length > 0;
        
        const isValid = hasApiKey && hasCustomUrl;
        
        // 更新UI状态
        const configStatus = document.getElementById('enhancedAIConfigStatus');
        if (configStatus) {
            if (isValid) {
                configStatus.innerHTML = '<span class="status-success">✅ 配置有效</span>';
            } else {
                configStatus.innerHTML = '<span class="status-error">❌ 配置无效</span>';
            }
        }
        
        this.updateSelectionUI(); // 更新翻译按钮状态
    }

    showUserMessage(message, type = 'info', duration = 5000) {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `user-message user-message-${type}`;
        messageEl.innerHTML = `
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">×</button>
        `;

        // 添加到页面
        const container = document.getElementById('enhancedMessages') || document.body;
        container.appendChild(messageEl);

        // 自动移除
        if (duration > 0) {
            setTimeout(() => {
                if (messageEl.parentElement) {
                    messageEl.remove();
                }
            }, duration);
        }
    }

    log(message, data = null) {
        if (this.debugMode) {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] ${message}`, data || '');
            
            // 添加到日志面板
            const logPanel = document.getElementById('enhancedLogPanel');
            if (logPanel) {
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';
                logEntry.innerHTML = `<span class="log-time">${timestamp}</span> ${message}`;
                logPanel.appendChild(logEntry);
                
                // 滚动到底部
                logPanel.scrollTop = logPanel.scrollHeight;
                
                // 限制日志数量
                while (logPanel.children.length > 1000) {
                    logPanel.removeChild(logPanel.firstChild);
                }
            }
        }
    }

    clearLog() {
        const logPanel = document.getElementById('enhancedLogPanel');
        if (logPanel) {
            logPanel.innerHTML = '';
        }
        console.clear();
    }

    exportLog() {
        const logPanel = document.getElementById('enhancedLogPanel');
        if (!logPanel) return;
        
        const logs = Array.from(logPanel.children).map(entry => entry.textContent).join('\n');
        
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `hardcoded-tool-log-${Date.now()}.txt`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // 预览字符串
    previewString(index) {
        const str = this.detectedStrings[index];
        if (!str) return;
        
        const modal = document.createElement('div');
        modal.className = 'preview-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>字符串预览</h3>
                    <button class="modal-close" onclick="this.closest('.preview-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="preview-item">
                        <label>内容：</label>
                        <div class="preview-text">${this.escapeHtml(str.text)}</div>
                    </div>
                    <div class="preview-item">
                        <label>类型：</label>
                        <span class="string-type type-${str.type}">${str.type}</span>
                    </div>
                    <div class="preview-item">
                        <label>出现次数：</label>
                        <span>${str.occurrences}</span>
                    </div>
                    <div class="preview-item">
                        <label>常量池索引：</label>
                        <span>${str.constantPoolIndex}</span>
                    </div>
                    <div class="preview-item">
                        <label>涉及文件：</label>
                        <div class="file-list-detail">
                            ${str.files.map(file => `<div class="file-item">${file}</div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 单独翻译
    async translateSingle(index) {
        const str = this.detectedStrings[index];
        if (!str) return;
        
        if (!this.aiConfig.apiKey) {
            this.showUserMessage('请先配置AI翻译API密钥', 'warning');
            return;
        }
        
        try {
            const translations = await this.translateBatch([str]);
            const translation = translations[0];
            
            this.translationResults.set(str.text, translation);
            this.showUserMessage(`翻译完成: "${str.text}" -> "${translation}"`, 'success');
            
            // 如果翻译结果面板已显示，更新它
            if (document.getElementById('enhancedResultsSection').style.display !== 'none') {
                this.displayTranslationResults();
            }
            
        } catch (error) {
            this.showUserMessage(`翻译失败: ${error.message}`, 'error');
        }
    }

    // 重新翻译
    async retranslateString(originalText) {
        if (!this.aiConfig.apiKey) {
            this.showUserMessage('请先配置AI翻译API密钥', 'warning');
            return;
        }
        
        try {
            const translations = await this.translateBatch([{ text: originalText }]);
            const translation = translations[0];
            
            this.translationResults.set(originalText, translation);
            
            // 更新输入框
            const input = document.querySelector(`.translation-edit[data-original="${this.escapeHtml(originalText)}"]`);
            if (input) {
                input.value = translation;
            }
            
            this.showUserMessage(`重新翻译完成`, 'success');
            
        } catch (error) {
            this.showUserMessage(`重新翻译失败: ${error.message}`, 'error');
        }
    }

    // 重置翻译
    resetTranslation(originalText) {
        this.translationResults.set(originalText, originalText);
        
        // 更新输入框
        const input = document.querySelector(`.translation-edit[data-original="${this.escapeHtml(originalText)}"]`);
        if (input) {
            input.value = originalText;
        }
        
        this.showUserMessage('已恢复为原文', 'info');
    }
}

// 全局实例
let enhancedHardcodedTool = null;

// 初始化工具
document.addEventListener('DOMContentLoaded', () => {
    enhancedHardcodedTool = new EnhancedHardcodedStringTool();
    window.hardcodedTool = enhancedHardcodedTool; // 为了向后兼容
});
