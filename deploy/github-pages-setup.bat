@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ===============================================
echo  GitHub Pages 部署助手
echo  Minecraft模组翻译工具
echo  作者：饩雨
echo ===============================================
echo.

:: 检查当前目录
if not exist "index.html" (
    echo [错误] 请在项目根目录运行此脚本
    echo 当前目录应包含 index.html 文件
    pause
    exit /b 1
)

:: 检查Git是否安装
git --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到Git，请先安装Git
    echo 下载地址: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [信息] Git已安装，版本信息：
git --version
echo.

:: 获取用户输入
set /p GITHUB_USERNAME="请输入GitHub用户名: "
if "!GITHUB_USERNAME!"=="" (
    echo [错误] GitHub用户名不能为空
    pause
    exit /b 1
)

set /p REPO_NAME="请输入仓库名（默认: minecraft-mod-translator）: "
if "!REPO_NAME!"=="" set REPO_NAME=minecraft-mod-translator

set /p CUSTOM_DOMAIN="请输入自定义域名（可选，直接回车跳过）: "

echo.
echo ===============================================
echo  配置确认
echo ===============================================
echo GitHub用户名: !GITHUB_USERNAME!
echo 仓库名: !REPO_NAME!
echo 自定义域名: !CUSTOM_DOMAIN!
echo 项目地址: https://!GITHUB_USERNAME!.github.io/!REPO_NAME!
echo.
set /p CONFIRM="确认以上信息正确吗？(y/n): "
if /i "!CONFIRM!" neq "y" (
    echo 已取消设置
    pause
    exit /b 0
)

echo.
echo ===============================================
echo  开始GitHub Pages设置
echo ===============================================

:: 检查是否已是Git仓库
if exist ".git" (
    echo [信息] 检测到现有Git仓库
    set /p REINIT="是否重新初始化Git仓库？(y/n): "
    if /i "!REINIT!"=="y" (
        rmdir /s /q .git
        git init
        echo [完成] Git仓库已重新初始化
    )
) else (
    echo [步骤 1/6] 初始化Git仓库...
    git init
    echo [完成] Git仓库已初始化
)

echo.
echo [步骤 2/6] 配置Git用户信息...
set /p GIT_EMAIL="请输入Git邮箱地址: "
git config user.name "!GITHUB_USERNAME!"
git config user.email "!GIT_EMAIL!"
echo [完成] Git配置已设置

echo.
echo [步骤 3/6] 创建CNAME文件（如果设置了自定义域名）...
if "!CUSTOM_DOMAIN!" neq "" (
    echo !CUSTOM_DOMAIN! > CNAME
    echo [完成] CNAME文件已创建
) else (
    echo [跳过] 未设置自定义域名
)

echo.
echo [步骤 4/6] 添加文件到Git...
git add .
git commit -m "🎮 初始提交：Minecraft模组翻译工具"
echo [完成] 文件已提交到本地仓库

echo.
echo [步骤 5/6] 设置远程仓库...
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/!GITHUB_USERNAME!/!REPO_NAME!.git
echo [完成] 远程仓库已设置

echo.
echo [步骤 6/6] 推送到GitHub...
echo [提示] 请在弹出的浏览器中登录GitHub或输入访问令牌
git push -u origin main

if %ERRORLEVEL% neq 0 (
    echo [警告] 推送失败，可能需要手动操作
    echo.
    echo 请按以下步骤操作：
    echo 1. 访问 https://github.com/!GITHUB_USERNAME!/!REPO_NAME!
    echo 2. 如果仓库不存在，请先在GitHub创建仓库
    echo 3. 然后再次运行：git push -u origin main
    echo.
) else (
    echo [完成] 代码已推送到GitHub
)

echo.
echo ===============================================
echo  GitHub Pages 设置说明
echo ===============================================
echo.
echo 请按以下步骤启用GitHub Pages：
echo.
echo 1. 访问仓库设置页面：
echo    https://github.com/!GITHUB_USERNAME!/!REPO_NAME!/settings/pages
echo.
echo 2. 在 "Source" 部分选择：
echo    ☑ GitHub Actions
echo.
echo 3. 保存设置并等待部署完成
echo.
echo 4. 网站将在以下地址可用：
if "!CUSTOM_DOMAIN!" neq "" (
    echo    https://!CUSTOM_DOMAIN!
    echo    （可能需要几分钟到几小时生效）
)
echo    https://!GITHUB_USERNAME!.github.io/!REPO_NAME!
echo.

echo [信息] 正在打开相关页面...
timeout /t 2 /nobreak >nul

:: 打开GitHub仓库页面
start "" "https://github.com/!GITHUB_USERNAME!/!REPO_NAME!"
timeout /t 2 /nobreak >nul

:: 打开GitHub Pages设置页面
start "" "https://github.com/!GITHUB_USERNAME!/!REPO_NAME!/settings/pages"
timeout /t 2 /nobreak >nul

:: 打开Actions页面查看部署状态
start "" "https://github.com/!GITHUB_USERNAME!/!REPO_NAME!/actions"

echo.
echo ===============================================
echo  后续操作
echo ===============================================
echo.
echo ✅ 文件更新方法：
echo    修改文件后运行：
echo    git add .
echo    git commit -m "更新说明"
echo    git push
echo.
echo ✅ 查看部署状态：
echo    访问Actions页面查看部署进度
echo.
echo ✅ 自定义域名DNS配置：
if "!CUSTOM_DOMAIN!" neq "" (
    echo    类型: CNAME
    echo    主机记录: www （或@）
    echo    记录值: !GITHUB_USERNAME!.github.io
)
echo.
echo 🎉 设置完成！等待GitHub Pages部署完成即可访问你的网站。
echo.

pause
