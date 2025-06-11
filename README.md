# Minecraft模组语言文件智能翻译工具

**作者：饩雨**

[![GitHub](https://img.shields.io/badge/GitHub-onlyxiyu/minecraft--mod--translator-blue?logo=github)](https://github.com/onlyxiyu/minecraft-mod-translator)
[![Pages](https://img.shields.io/badge/GitHub%20Pages-在线访问-brightgreen?logo=github)](https://onlyxiyu.github.io/minecraft-mod-translator)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🌐 在线访问

🚀 **立即使用**: [https://onlyxiyu.github.io/minecraft-mod-translator](https://onlyxiyu.github.io/minecraft-mod-translator)

## 🎮 项目简介

这是一个纯前端的Minecraft模组语言文件智能翻译工具，无需服务器部署，所有操作都在浏览器中完成，确保数据安全和隐私保护。

### ✨ 主要特性

- **🔒 纯前端架构**：无后端服务器，数据完全本地化处理
- **🚀 智能翻译**：支持多种AI翻译接口（DeepSeek、OpenAI GPT、Google Translate等）
- **📁 JAR文件处理**：自动解压、解析和重新打包Minecraft模组文件
- **📁 智能文件处理**：支持多种Minecraft模组架构，自动识别和适配
- **🔄 灵活策略**：支持覆盖和增量合并两种翻译策略
- **🔧 硬编码检测**：检测和翻译Component.literal()等硬编码文本
- **📚 术语管理**：内置500+Minecraft术语库+自定义术语表支持
- **🎨 现代界面**：响应式设计，支持桌面和移动设备
- **📋 历史记录**：本地保存翻译历史，方便回顾
- **🔧 诊断功能**：一键系统诊断，快速定位问题
- **💝 赞助支持**：集成赞助提示，支持开发者

## 🚀 快速开始

### 1. 环境要求

- 现代浏览器（Chrome、Firefox、Safari、Edge等）
- 稳定的网络连接（用于调用AI API）

### 2. 使用步骤

#### 标准翻译流程（有语言文件的模组）
1. **打开工具**：在浏览器中打开 `index.html` 文件
2. **上传模组**：拖放或点击上传 `.jar` 格式的Minecraft模组文件（≤30MB）
3. **配置API**：选择AI翻译服务商并输入对应的API密钥
4. **开始翻译**：点击"开始翻译"按钮，等待处理完成
5. **预览编辑**：查看翻译结果，可手动编辑调整
6. **下载结果**：点击"下载汉化包"获取汉化后的模组文件

#### 硬编码检测流程（纯硬编码模组）
1. **上传模组**：上传没有语言文件的模组JAR文件
2. **自动识别**：工具自动检测到无语言文件，按钮变为"开始硬编码检测"
3. **配置检测**：设置检测范围（Component.literal、字符串字面量等）
4. **执行扫描**：扫描模组字节码，提取硬编码英文文本
5. **AI翻译**：自动翻译检测到的文本
6. **导出报告**：生成详细的检测和翻译报告
7. **可选修改**：尝试字节码修改（实验性功能）

> 📖 **详细指南**：查看 [HARDCODE_ONLY_MODS.md](HARDCODE_ONLY_MODS.md) 了解纯硬编码模组处理方法

### 3. API密钥获取

#### OpenAI GPT
1. 访问 [OpenAI官网](https://platform.openai.com/)
2. 注册账号并进入API管理页面
3. 创建新的API密钥（格式：`sk-xxxxxx`）

#### DeepSeek
1. 访问 [DeepSeek官网](https://platform.deepseek.com/)
2. 注册账号并获取API密钥

#### Google Translate
1. 进入 [Google Cloud Console](https://console.cloud.google.com/)
2. 启用 Translate API 服务
3. 创建凭据并获取API密钥

## 📖 功能详解

### 文件处理机制

- **智能识别**：支持9种不同的模组架构，自动扫描多种路径结构：
  - 标准结构：`assets/*/lang/` 和 `data/*/lang/`
  - 根目录：`lang/`（老版本模组）
  - 特殊结构：`META-INF/*/lang/`、`resources/lang/`
  - 嵌套结构：`*/assets/*/lang/`、`src/main/resources/assets/*/lang/`
  - 通用模式：任何包含 `lang/` 目录的结构
- **格式支持**：兼容 JSON (`.json`) 和 LANG (`.lang`) 两种格式
- **智能检测**：自动发现英文原文和现有中文翻译文件
- **路径保持**：下载时保持原有的文件结构和路径

### 翻译策略

#### 覆盖模式
- 完全替换现有中文文件
- 适用于重新翻译或首次汉化

#### 增量合并模式
- 保留已有的中文翻译
- 仅更新新增或修改的英文条目
- 适用于模组更新后的增量汉化

### 术语管理

#### 内置术语库
包含500+常用Minecraft术语，如：
- `Creeper` → `苦力怕`
- `Redstone` → `红石`
- `Diamond` → `钻石`

#### 自定义术语表
- 支持JSON格式的自定义术语对照表
- 优先级高于AI翻译结果
- 支持文件导入和在线编辑

### 硬编码检测

#### 检测范围
- **Component.literal()调用**：检测Minecraft组件硬编码文本
- **字符串字面量**：识别代码中的英文字符串常量
- **悬浮提示文本**：Tooltip等界面文本
- **GUI文本**：按钮、菜单等界面元素文本

#### 处理方式
- **仅生成报告**：列出所有硬编码文本和建议翻译
- **字节码修改**：实验性功能，尝试直接修改JAR文件中的字符串

#### 智能过滤
- 自动排除技术标识符（包名、常量名等）
- 过滤纯数字和单字符文本
- 识别用户界面相关的文本内容
- 支持自定义过滤条件设置

#### 使用步骤
1. 上传JAR文件后点击"硬编码检测"按钮
2. 配置检测设置（检测范围、过滤条件）
3. 开始扫描，系统会分析所有class文件
4. 查看检测结果，选择需要翻译的文本
5. 导出报告或应用修改

#### ⚡ 性能优化特性
- **智能扫描** - 优先处理可能包含UI文本的类文件
- **并行处理** - 批量并行扫描，大幅提升速度
- **高级解析** - 直接解析Java常量池，提高准确性
- **内存优化** - 分批处理避免内存溢出
- **速度目标** - 1分钟内完成大型模组扫描

#### 🔧 字节码修改功能
- **实验性功能** - 支持直接修改JAR文件中的硬编码字符串
- **安全替换** - 智能处理不同长度的翻译文本
- **结构保护** - 确保修改后的字节码结构完整
- **备份生成** - 生成新的汉化版本，保留原始文件

### 安全保障

- **零数据存储**：所有处理都在浏览器内存中进行
- **API密钥保护**：密钥仅存储在内存中，关闭页面后自动清除
- **本地历史**：翻译记录仅保存在浏览器本地存储

## 🎨 界面预览

### 主界面
- 现代化的渐变背景设计
- 直观的拖放文件上传区域
- 清晰的配置选项布局

### 进度显示
- 实时进度条显示翻译状态
- 详细的操作日志输出
- 彩色状态指示（信息/成功/警告/错误）

### 结果预览
- 左右分栏对比显示原文和译文
- 支持在线编辑翻译结果
- 一键下载汉化包文件

## 🔧 技术架构

### 前端技术栈
- **HTML5**：语义化标记和现代Web API
- **CSS3**：Flexbox/Grid布局 + CSS动画
- **JavaScript ES6+**：模块化编程 + 异步处理
- **JSZip**：ZIP文件处理库

### 核心模块
1. **文件解析引擎**：基于JSZip的JAR文件处理
2. **AI翻译网关**：统一的API调用接口
3. **交互决策系统**：用户策略选择和预览编辑
4. **文件生成器**：结果打包和下载

## 🚀 部署指南

### 🌟 GitHub Pages部署（推荐）

**完全免费，无需服务器，全球CDN加速**

**一键部署（Windows）**
```cmd
# 双击运行批处理文件
deploy\github-pages-setup.bat
```

**手动部署步骤**
1. 创建GitHub仓库：`minecraft-mod-translator`
2. 上传项目文件到仓库
3. 在仓库设置中启用GitHub Pages（Source选择GitHub Actions）
4. 访问：`https://onlyxiyu.github.io/minecraft-mod-translator`

📖 **详细说明**：`deploy/GITHUB_PAGES.md`

---

## 📝 开发说明

### 项目结构
```
minecraft-mod-translator/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # 核心逻辑
├── README.md           # 项目说明
├── LICENSE             # 开源协议
├── example_en_us.json  # 示例语言文件
├── TESTING.md          # 测试文档
├── 404.html            # GitHub Pages 404页面
├── .nojekyll           # 禁用Jekyll处理
├── .github/            # GitHub相关配置
│   └── workflows/
│       └── deploy-pages.yml  # GitHub Pages自动部署
└── deploy/             # 部署相关文件
    ├── README.md               # 部署总览
    ├── GITHUB_PAGES.md         # GitHub Pages详细指南
    ├── GITHUB_PAGES_QUICK.md   # GitHub Pages快速指南
    ├── github-pages-setup.bat  # GitHub Pages一键设置
    ├── deploy.sh               # 一键部署脚本
    ├── upload.ps1              # Windows上传脚本
    ├── setup-ssl.sh            # HTTPS配置脚本
    ├── nginx.conf              # Nginx配置文件
    ├── Dockerfile              # Docker构建文件
    ├── docker-compose.yml      # Docker编排文件
    ├── DEPLOYMENT.md           # 详细部署说明
    ├── CLOUD_DEPLOYMENT.md     # 云服务器部署指南
    ├── QUICKSTART.md           # 快速启动指南
    ├── CHECKLIST.md            # 部署检查清单
    └── verify.sh               # 部署验证脚本
```

### 核心类：MinecraftModTranslator
- `extractJarFile()`: JAR文件解压和多架构语言文件识别
- `isValidLanguageFile()`: 语言文件格式验证和检测
- `processLanguageFiles()`: 语言文件内容处理和路径保存
- `translateTexts()`: 批量AI翻译处理
- `generateFinalResult()`: 翻译结果合并和生成
- `downloadResult()`: 智能路径识别的文件重新打包和下载
- `runDiagnostics()`: 系统诊断和问题检测

### 扩展开发
- 添加新的AI翻译服务商
- 扩充内置术语库
- 优化界面交互体验
- 增加更多文件格式支持

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 💝 支持作者

如果这个工具对您有帮助，欢迎支持开发者：

![赞助二维码](https://gitee.com/god_xiyu/capeimage/blob/master/qq_pic_merged_1740912737852.jpg)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🔗 相关链接

- [Minecraft官网](https://www.minecraft.net/)
- [Minecraft Forge](https://files.minecraftforge.net/)
- [Fabric](https://fabricmc.net/)

---
## 免责声明
  欢迎使用本网站服务！在使用本网站提供的 Minecraft 模组语言文件翻译服务前，请您务必仔细阅读并理解以下免责声明。您一旦使用本服务，即视为已充分知悉并自愿接受本免责声明全部内容。如您不同意本声明条款，请立即停止使用本服务。

### 一、服务性质说明
  1. 本网站仅提供技术工具，通过用户自主上传 Minecraft 模组文件（.jar 格式），基于用户提供的 AI 接口密钥（如 DeepSeek、OpenAI 等）对模组内语言文件进行翻译转换，全程不涉及服务器数据存储或内容审查。
  2. 本服务仅为用户提供翻译辅助，不涉及对 Minecraft 模组本身功能、版权、使用合规性的判断，也不提供任何形式的内容审核、法律建议或授权确认服务。

### 二、版权与使用风险
  1. **模组版权责任**：您需确保上传的 Minecraft 模组文件为合法获取，且您有权对其语言文件进行修改。若模组作者明确禁止未经授权的内容修改、翻译或分发，或模组文件涉及侵权、盗版、恶意代码等非法情形，由此产生的法律纠纷（包括但不限于著作权侵权、违约、损害赔偿等）均由您自行承担，本网站及运营方不承担任何法律责任。
  2. **翻译内容风险**：翻译结果由第三方 AI 接口（如 DeepSeek、OpenAI 等）生成，本网站无法保证翻译内容的准确性、完整性或合规性。因翻译错误、歧义或敏感内容引发的任何争议、损失或法律责任，均由用户自行承担。

### 三、服务免责条款
  1. **数据安全与损失**：本网站采用纯前端技术实现，无服务器端数据存储，但仍可能因用户设备故障、网络中断、浏览器兼容性问题或 AI 接口异常导致文件处理失败、数据丢失或翻译中断。对此类情况，本网站不承担任何赔偿责任。
  2. **第三方服务风险**：本服务依赖用户提供的第三方 AI 接口（如 DeepSeek、OpenAI 等），因 AI 接口服务中断、条款变更、费率调整、封号等问题导致服务无法正常使用，或因 AI 接口生成内容违反法律法规，均与本网站无关，用户需自行与第三方协商解决。
  3. **服务可用性**：本网站不承诺服务持续可用，可能因技术维护、政策调整、不可抗力（如自然灾害、网络攻击、政府禁令等）临时中断或终止服务，无需提前通知用户，亦不承担任何赔偿责任。

### 四、其他条款
  1. 若本免责声明部分条款被认定无效或不可执行，不影响其他条款的法律效力。
  2. 本网站有权根据法律法规变化或运营需要修订本声明，修订内容将通过网站公告或站内通知等方式发布。若您继续使用服务，即视为接受修订后的声明。

  如您对本免责声明存在任何疑问，可通过 邮箱:mai_xiyu@vip.qq.com 与我们沟通。请再次确认，使用本服务即代表您已充分理解并自愿接受上述全部条款。

  本网站及运营方对因使用本服务所产生的任何直接、间接、附带或衍生损失（包括但不限于经济损失、数据丢失、商誉损害等），均不承担任何责任。 

  本人不希望别人拿着这个项目去盈利，我觉得赞助就行了，不必去圈钱，当然我也管不了

**作者：饩雨** | **最后更新：2025年6月**
