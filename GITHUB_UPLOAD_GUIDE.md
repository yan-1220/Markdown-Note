# GitHub 專案上傳流程指南

本文件說明如何將本地專案上傳到 GitHub 的完整流程。

## 前置檢查

確認已安裝必要工具：

```bash
# 檢查 git
git --version

# 檢查 GitHub CLI
gh --version
```

## 方法一：使用 GitHub CLI (推薦)

這是最簡單快速的方式，會自動創建遠端倉庫並推送。

### 步驟

```bash
# 1. 添加所有檔案到暫存區
git add .

# 2. 創建初始提交
git commit -m "Initial commit: 項目描述"

# 3. 使用 gh 創建 GitHub repo 並推送
gh repo create
```

執行 `gh repo create` 後，依照互動式提示：
- 選擇 "Push an existing local repository to GitHub"
- 輸入 repository 名稱
- 選擇 Public（公開）或 Private（私有）
- 確認推送

### 一行指令版本

```bash
# 公開倉庫
gh repo create 專案名稱 --public --source=. --push

# 私有倉庫
gh repo create 專案名稱 --private --source=. --push
```

### 參數說明

- `--public` / `--private`: 設定倉庫可見性
- `--source=.`: 指定當前目錄為來源
- `--push`: 自動推送到 GitHub
- `--description "描述文字"`: 添加專案描述（可選）

## 方法二：手動創建並推送

適合需要更多控制或在 GitHub 網站上預先創建倉庫的情況。

### 步驟

```bash
# 1. 添加所有檔案到暫存區
git add .

# 2. 創建本地提交
git commit -m "Initial commit: 項目描述"

# 3. 先到 GitHub 網站手動創建新倉庫，然後添加遠端連結
git remote add origin https://github.com/你的用戶名/倉庫名稱.git

# 4. 推送到 GitHub（首次推送使用 -u 設定追蹤）
git push -u origin master
```

### 使用 SSH 連結（推薦）

```bash
# 使用 SSH（需預先設定 SSH key）
git remote add origin git@github.com:你的用戶名/倉庫名稱.git
git push -u origin master
```

## 常用檢查指令

```bash
# 查看當前 Git 狀態
git status

# 查看遠端倉庫設定
git remote -v

# 查看提交歷史
git log --oneline

# 查看提交歷史（含圖形）
git log --oneline --graph --all
```

## 後續推送

首次推送完成後，之後的更新流程：

```bash
# 1. 添加變更的檔案
git add .

# 2. 提交變更
git commit -m "更新說明"

# 3. 推送（已設定追蹤分支後可簡化指令）
git push
```

## 重要注意事項

### .gitignore 設定

推送前確保 `.gitignore` 包含以下內容，避免上傳不必要的檔案：

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
.venv/
venv/
ENV/
env/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment variables
.env
.env.local
```

### 認證設定

**首次使用 GitHub CLI**：

```bash
gh auth login
```

選擇：
- GitHub.com
- HTTPS 或 SSH
- 使用瀏覽器登入或輸入 token

**SSH Key 設定**（如使用 SSH 連結）：

```bash
# 生成 SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# 將 public key 添加到 GitHub
# 複製 ~/.ssh/id_ed25519.pub 內容到 GitHub Settings > SSH Keys
```

### 分支說明

- `master` 或 `main`: 主要分支（GitHub 新倉庫預設為 main）
- 如果遇到分支名稱不一致，可使用：

```bash
# 重命名本地分支
git branch -M main

# 推送到 main 分支
git push -u origin main
```

## 常見問題排除

### 遠端已存在

```bash
# 錯誤：remote origin already exists
# 解決：先移除再添加
git remote remove origin
git remote add origin https://github.com/你的用戶名/倉庫名稱.git
```

### 推送被拒絕

```bash
# 錯誤：Updates were rejected
# 原因：遠端有本地沒有的提交
# 解決：先拉取再推送
git pull origin master --rebase
git push -u origin master
```

### 檔案過大

GitHub 單檔限制 100MB，建議：
- 使用 Git LFS 處理大型檔案
- 將大型檔案排除在版本控制外

```bash
# 安裝 Git LFS
git lfs install

# 追蹤大型檔案類型
git lfs track "*.psd"
git lfs track "*.zip"

# 添加 .gitattributes
git add .gitattributes
```

## 參考資源

- [GitHub 官方文件](https://docs.github.com/)
- [GitHub CLI 文件](https://cli.github.com/manual/)
- [Git 官方文件](https://git-scm.com/doc)
