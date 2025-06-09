# 🚀 Minecraft模组翻译工具 - GitHub Pages部署指南

> **作者：饩雨**  
> **项目：Minecraft模组语言文件智能翻译工具**

## 📋 部署方案概览

使用GitHub Pages免费部署您的Minecraft模组翻译工具！

### 🎯 GitHub Pages部署优势

- ✅ **完全免费** - GitHub Pages提供免费托管
- ✅ **自动部署** - 推送代码即自动更新网站
- ✅ **HTTPS支持** - 自动配置SSL证书
- ✅ **CDN加速** - 全球访问速度快
- ✅ **稳定可靠** - GitHub基础设施保障

---

## 🌟 GitHub Pages快速部署

**适合：** 想要免费、稳定的在线部署方案

### 方案选择

我们提供了两种详细的部署指南：

1. **[GITHUB_PAGES_QUICK.md](./GITHUB_PAGES_QUICK.md)** - 5分钟快速部署
2. **[GITHUB_PAGES.md](./GITHUB_PAGES.md)** - 详细步骤说明

### 🚀 超快速开始

如果您使用Windows系统，可以运行一键脚本：

```batch
# 在项目根目录下运行
deploy\github-pages-setup.bat
```

这个脚本会自动帮您：
- 初始化Git仓库
- 创建GitHub仓库
- 配置GitHub Pages
- 推送代码并自动部署

---

## ☁️ 方案二：云服务器部署

### 🎯 部署流程

### 步骤1：准备GitHub仓库
1. 在GitHub创建新仓库
2. 将项目代码推送到仓库
3. 确保代码在main分支

### 步骤2：配置GitHub Pages
1. 进入GitHub仓库Settings页面
2. 找到Pages设置选项
3. 选择GitHub Actions作为部署源
4. 系统会自动检测工作流程

### 步骤3：自动部署
- 推送代码后自动触发部署
- 几分钟后访问 `https://用户名.github.io/仓库名`
- 支持自定义域名配置

---

## 📋 文件说明

- `github-pages-setup.bat` - Windows一键设置脚本
- `GITHUB_PAGES_QUICK.md` - 5分钟快速部署指南  
- `GITHUB_PAGES.md` - 详细部署步骤说明

---

## 🔧 故障排除

### 常见问题

**Q: 部署后无法访问？**
A: 检查GitHub Pages设置中的源分支是否正确

**Q: 自定义域名无法访问？**  
A: 确保DNS设置正确，并在仓库中添加CNAME文件

**Q: 更新代码后网站没变化？**
A: GitHub Pages有缓存，等待5-10分钟或强制刷新

---

## 📞 技术支持

- 详细文档：[GITHUB_PAGES.md](./GITHUB_PAGES.md)
- 快速指南：[GITHUB_PAGES_QUICK.md](./GITHUB_PAGES_QUICK.md)
- 一键脚本：运行 `github-pages-setup.bat`

---

**项目作者：饩雨**  
**GitHub Pages部署 - 免费、稳定、易用**
volumes:
  - ./ssl:/etc/nginx/ssl:ro
```

---

## 🔧 方案四：手动部署

**适合：** 需要完全自定义配置

详细步骤请参考：`deploy/DEPLOYMENT.md`

---

## 🌐 域名和端口配置

### 域名解析配置
```
记录类型: A
主机记录: @ (根域名) 或 www  
记录值: 你的服务器IP地址
TTL: 600
```

### 常用端口配置
- **80**: HTTP (默认)
- **443**: HTTPS  
- **8080**: 自定义HTTP端口
- **其他**: 根据需要修改nginx配置

### 防火墙设置
```bash
# Ubuntu (ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS (firewalld)  
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

---

## 🔒 HTTPS配置（强烈推荐）

### 使用Let's Encrypt免费证书
```bash
# 自动配置（推荐）
./deploy/setup-ssl.sh 你的域名.com 你的邮箱@example.com

# 手动配置
sudo certbot --nginx -d 你的域名.com
```

### 证书自动续期
```bash
# 检查自动续期状态
sudo systemctl status certbot.timer

# 手动续期测试
sudo certbot renew --dry-run
```

---

## 📊 部署后验证

### 1. 基本功能测试
- [ ] 网站可以正常访问
- [ ] 文件上传功能正常
- [ ] API密钥验证正常
- [ ] 页面样式加载正确

### 2. 性能测试
```bash
# 检查响应时间
curl -w "%{time_total}" -o /dev/null -s http://你的域名.com

# 检查gzip压缩
curl -H "Accept-Encoding: gzip" -I http://你的域名.com
```

### 3. 安全性检查
```bash
# 检查SSL证书
curl -I https://你的域名.com

# 检查安全头部
curl -I http://你的域名.com | grep -E "(X-Frame-Options|X-Content-Type-Options)"
```

---

## 🛠️ 维护和监控

### 日志查看
```bash
# nginx访问日志
tail -f /var/log/nginx/minecraft-translator-access.log

# nginx错误日志  
tail -f /var/log/nginx/minecraft-translator-error.log

# 系统日志
journalctl -u nginx -f
```

### 服务管理
```bash
# 重启nginx
sudo systemctl restart nginx

# 检查状态
sudo systemctl status nginx

# 重新加载配置
sudo nginx -s reload
```

### 备份建议
```bash
# 备份网站文件
tar -czf minecraft-translator-backup-$(date +%Y%m%d).tar.gz /var/www/minecraft-mod-translator

# 备份nginx配置
cp /etc/nginx/sites-available/minecraft-mod-translator /root/nginx-backup/
```

---

## ⚠️ 注意事项

### 安全建议
1. **定期更新**: 保持系统和软件包最新
2. **强密码**: 使用复杂密码和SSH密钥认证
3. **防火墙**: 只开放必要端口
4. **HTTPS**: 始终使用HTTPS加密连接
5. **备份**: 定期备份重要数据

### 性能优化
1. **CDN**: 建议配置CDN加速
2. **缓存**: 已配置静态文件缓存
3. **压缩**: 已启用gzip压缩
4. **监控**: 建议配置服务监控

---

## 🆘 故障排除

### 常见问题
1. **无法访问网站**: 检查防火墙、nginx状态、域名解析
2. **SSL证书错误**: 检查证书有效期、域名匹配
3. **文件上传失败**: 检查nginx文件大小限制配置
4. **样式不显示**: 检查静态文件权限和路径

### 获取帮助
- 查看日志文件找到具体错误信息
- 检查nginx配置语法: `nginx -t`
- 验证防火墙规则: `iptables -L` 或 `ufw status`

---

## 📞 技术支持

如遇到部署问题：
1. 首先查看对应的详细文档
2. 检查服务器日志文件
3. 确认网络和防火墙配置
4. 验证域名解析是否正确

**部署成功后，你的Minecraft模组翻译工具就可以为用户提供服务了！**

---

*本部署指南由饩雨制作，如有问题请参考具体文档或联系支持。*
