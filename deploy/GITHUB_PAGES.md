# GitHub Pages 部署指南

## 🌐 什么是GitHub Pages

GitHub Pages是GitHub提供的免费静态网站托管服务，完美适合我们的纯前端Minecraft模组翻译工具。

### 优势
- ✅ **完全免费**：无需付费服务器
- ✅ **自动部署**：推送代码即自动更新网站
- ✅ **HTTPS支持**：自动提供SSL证书
- ✅ **自定义域名**：支持绑定自己的域名
- ✅ **全球CDN**：GitHub的全球加速网络

## 🚀 快速部署步骤

### 第一步：创建GitHub仓库

1. **登录GitHub**：访问 [github.com](https://github.com)

2. **创建新仓库**：
   - 点击右上角的 `+` → `New repository`
   - 仓库名称：`minecraft-mod-translator`（或你喜欢的名称）
   - 设置为 `Public`（GitHub Pages免费版需要公开仓库）
   - ✅ 勾选 `Add a README file`
   - 点击 `Create repository`

### 第二步：上传项目文件

**方法一：使用GitHub网页界面**

1. 在仓库页面点击 `uploading an existing file`
2. 将以下文件拖拽上传：
   ```
   minecraft-mod-translator/
   ├── index.html
   ├── styles.css
   ├── script.js
   ├── LICENSE
   ├── README.md
   ├── example_en_us.json
   └── .github/
       └── workflows/
           └── deploy-pages.yml
   ```

**方法二：使用Git命令行**

```bash
# 克隆仓库到本地
git clone https://github.com/onlyxiyu/minecraft-mod-translator.git
cd minecraft-mod-translator

# 复制项目文件到仓库目录
# （将项目文件复制到这个目录）

# 提交并推送
git add .
git commit -m "🎮 添加Minecraft模组翻译工具"
git push origin main
```

### 第三步：启用GitHub Pages

1. **进入仓库设置**：
   - 在仓库页面点击 `Settings` 标签
   - 滚动到左侧菜单找到 `Pages`

2. **配置Pages设置**：
   - **Source**：选择 `GitHub Actions`
   - 系统会自动检测到我们的工作流文件

3. **保存设置**：
   - 点击 `Save` 保存设置

### 第四步：等待部署完成

1. **查看部署状态**：
   - 进入仓库的 `Actions` 标签
   - 查看 "Deploy to GitHub Pages" 工作流状态

2. **获取网站地址**：
   - 部署成功后，在 `Settings` → `Pages` 中可以看到网站地址
   - 通常格式为：`https://onlyxiyu.github.io/minecraft-mod-translator`

## 🎯 验证部署

部署完成后，访问你的GitHub Pages网址，验证以下功能：

- [ ] 网站可以正常打开
- [ ] 页面样式显示正常
- [ ] 可以上传JAR文件
- [ ] API密钥输入功能正常
- [ ] 所有按钮和交互正常

## 🌐 自定义域名（可选）

### 购买域名

推荐的域名注册商：
- [Namecheap](https://www.namecheap.com)
- [GoDaddy](https://www.godaddy.com)
- [阿里云](https://wanwang.aliyun.com)
- [腾讯云](https://dnspod.cloud.tencent.com)

### 配置自定义域名

1. **在GitHub设置域名**：
   - 进入 `Settings` → `Pages`
   - 在 `Custom domain` 中输入你的域名
   - 点击 `Save`

2. **配置DNS解析**：
   在域名注册商管理面板添加以下记录：
   ```   类型: CNAME
   主机记录: www（或@）
   记录值: onlyxiyu.github.io
   TTL: 600
   ```

3. **等待生效**：
   - DNS解析通常需要几分钟到几小时生效
   - GitHub会自动为自定义域名申请SSL证书

## 📝 项目维护

### 更新网站

只需要更新GitHub仓库中的文件，GitHub Pages会自动重新部署：

```bash
# 修改文件后
git add .
git commit -m "🔧 更新功能"
git push origin main
```

### 查看部署日志

在仓库的 `Actions` 标签中可以查看每次部署的详细日志。

### 回滚版本

如果新版本有问题，可以通过Git回滚：

```bash
# 查看提交历史
git log --oneline

# 回滚到指定版本
git reset --hard 提交哈希值
git push --force origin main
```

## 🔧 高级配置

### 自定义404页面

项目会自动创建404页面，如需自定义：

1. 创建 `404.html` 文件
2. 推送到仓库
3. GitHub Pages会自动使用

### 网站统计

可以添加Google Analytics或其他统计服务：

```html
<!-- 在index.html中添加 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## ⚠️ 注意事项

### GitHub Pages限制

- **流量限制**：每月100GB（通常足够）
- **文件大小**：单个文件不超过100MB
- **仓库大小**：建议不超过1GB
- **构建时间**：每次构建不超过10分钟

### 安全考虑

- ⚠️ **API密钥安全**：提醒用户不要在前端存储敏感信息
- ✅ **HTTPS默认**：GitHub Pages自动提供HTTPS
- ✅ **无服务器**：没有服务器安全风险

## 🆘 常见问题

### Q: 网站显示404错误
**解决方案**：
1. 检查仓库是否为公开状态
2. 确认GitHub Pages已启用
3. 检查文件名是否正确（特别是index.html）

### Q: 部署失败
**解决方案**：
1. 查看Actions标签中的错误日志
2. 检查工作流文件语法
3. 确认所有必需文件都已上传

### Q: 自定义域名不工作
**解决方案**：
1. 检查DNS解析是否正确
2. 等待DNS传播（可能需要几小时）
3. 检查域名输入是否正确

### Q: 网站更新不显示
**解决方案**：
1. 清除浏览器缓存
2. 等待GitHub Pages更新（通常几分钟）
3. 检查最新提交是否成功

## 🎉 部署成功

恭喜！你的Minecraft模组翻译工具现在已经部署到GitHub Pages上了！

### 接下来可以做的事情：

1. **分享你的工具**：将网址分享给Minecraft社区
2. **收集反馈**：从用户那里获得改进建议
3. **持续改进**：根据使用情况优化功能
4. **开源贡献**：邀请其他开发者参与改进

### 网站信息

- **网址**：`https://onlyxiyu.github.io/minecraft-mod-translator`
- **源码**：`https://github.com/onlyxiyu/minecraft-mod-translator`
- **更新方式**：推送代码到GitHub仓库
- **费用**：完全免费

---

**现在你拥有了一个专业的、免费的、全球可访问的Minecraft模组翻译工具！**
