# 快速部署到GitHub Pages

## 🚀 一键部署脚本

双击运行以下批处理文件即可开始GitHub Pages部署：

```cmd
deploy\github-pages-setup.bat
```

## 📋 手动部署步骤

### 1. 创建GitHub仓库
- 访问 [github.com](https://github.com) 并登录
- 点击 `New repository`
- 仓库名：`minecraft-mod-translator`
- 设置为 `Public`
- 创建仓库

### 2. 上传文件
将以下文件上传到GitHub仓库：
- `index.html`
- `styles.css`
- `script.js`
- `LICENSE`
- `README.md`
- `example_en_us.json`
- `404.html`
- `.nojekyll`
- `.github/workflows/deploy-pages.yml`

### 3. 启用GitHub Pages
- 进入仓库 `Settings` → `Pages`
- Source选择：`GitHub Actions`
- 保存设置

### 4. 访问网站
- 地址：`https://你的用户名.github.io/minecraft-mod-translator`

## 🌐 自定义域名
- 在GitHub Pages设置中添加自定义域名
- 配置DNS CNAME记录指向 `你的用户名.github.io`

## 📱 移动端适配
网站已完全支持移动设备访问，响应式设计确保在手机和平板上都有良好体验。

---
**GitHub Pages部署完全免费，支持HTTPS，全球CDN加速！**
