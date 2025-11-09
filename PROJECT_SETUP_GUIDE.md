# 🚀 项目环境设置指引

> **用途**: 此文件为 AI CLI 工具提供标准化的项目环境设置流程。请在开始任何项目工作前，先读取此指引并按步骤执行环境设置。

---

## 📋 环境设置检查清单

在开始项目工作前，请按以下顺序检查和设置环境：

### ✅ 步骤 1: 检查必要工具是否已安装

执行以下命令检查工具是否存在：

```bash
# 检查 Python
python --version

# 检查 uv
uv --version

# 检查 gh (GitHub CLI)
gh --version

# 检查 git
git --version
```

---

## 🔧 必要工具安装指令

### 1. **uv** - Python 套件管理工具

**功能**: 极速 Python 环境和套件管理（比 pip 快 10-100 倍）

**Windows 安装方式**:

```powershell
# 方法 1: 使用 PowerShell (推荐)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# 方法 2: 使用 pip
pip install uv
```

**验证安装**:
```bash
uv --version
```

---

### 2. **gh** - GitHub CLI 工具

**功能**: 在命令行中管理 GitHub PR、Issue、仓库等

**Windows 安装方式**:

```bash
# 方法 1: 使用 winget (推荐)
winget install --id GitHub.cli

# 方法 2: 使用 Chocolatey
choco install gh

# 方法 3: 使用 scoop
scoop install gh
```

**验证安装**:
```bash
gh --version
```

**首次使用需要认证**:
```bash
gh auth login
```

---

## 🏗️ 标准项目环境设置流程

### 步骤 2: 创建 Python 虚拟环境

使用 `uv` 创建和管理虚拟环境：

```bash
# 创建虚拟环境
uv venv

# 激活虚拟环境 (Windows)
.venv\Scripts\activate

# 激活虚拟环境 (Linux/Mac)
source .venv/bin/activate
```

---

### 步骤 3: 安装项目依赖

如果项目中存在以下文件，按优先级安装依赖：

#### 选项 A: 使用 requirements.txt
```bash
# 使用 uv 安装 (极速)
uv pip install -r requirements.txt

# 或使用传统 pip
pip install -r requirements.txt
```

#### 选项 B: 使用 pyproject.toml
```bash
# 使用 uv 安装
uv pip install -e .

# 或使用传统 pip
pip install -e .
```

#### 选项 C: 使用 setup.py
```bash
uv pip install -e .
```

---

### 步骤 4: 验证环境设置

```bash
# 列出已安装的套件
uv pip list

# 或使用
pip list
```

---

## 🔄 Git 和 GitHub 设置

### 检查 Git 配置

```bash
# 检查用户信息
git config --global user.name
git config --global user.email

# 如果未设置，请配置
git config --global user.name "您的名字"
git config --global user.email "您的邮箱"
```

### 初始化 Git 仓库（如果需要）

```bash
# 初始化 git
git init

# 添加远程仓库
git remote add origin <repository-url>
```

---

## 📝 AI CLI 自动化执行指南

当 AI CLI 读取此指引时，请按以下逻辑执行：

1. **检查阶段**: 先执行所有检查命令，确认哪些工具已安装
2. **安装阶段**: 对于未安装的工具，询问用户是否需要安装
3. **环境设置阶段**:
   - 检查是否存在虚拟环境（`.venv` 目录）
   - 如不存在，创建虚拟环境
   - 激活虚拟环境
4. **依赖安装阶段**:
   - 检查是否存在 `requirements.txt`、`pyproject.toml` 或 `setup.py`
   - 询问用户是否需要安装依赖
5. **验证阶段**: 显示环境配置摘要

---

## 🎯 常用命令速查

### uv 常用命令
```bash
# 创建虚拟环境
uv venv [env_name]

# 安装单个套件
uv pip install <package>

# 安装多个套件
uv pip install <package1> <package2>

# 安装并生成锁定文件
uv pip compile requirements.in -o requirements.txt

# 同步依赖（根据锁定文件）
uv pip sync requirements.txt

# 列出已安装套件
uv pip list

# 卸载套件
uv pip uninstall <package>
```

### gh 常用命令
```bash
# 克隆仓库
gh repo clone <repository>

# 创建 PR
gh pr create

# 查看 PR 列表
gh pr list

# 查看 Issue 列表
gh issue list

# 创建 Issue
gh issue create

# 查看仓库信息
gh repo view
```

---

## ⚠️ 注意事项

1. **虚拟环境隔离**: 每个项目都应使用独立的虚拟环境
2. **依赖锁定**: 使用 `requirements.txt` 或 `uv.lock` 确保环境可重现
3. **Git 提交前**: 确保 `.venv/` 已加入 `.gitignore`
4. **认证信息**: 不要将密钥、token 等敏感信息提交到仓库

---

## 📚 相关资源

- [uv 官方文档](https://github.com/astral-sh/uv)
- [GitHub CLI 官方文档](https://cli.github.com/manual/)
- [Python 虚拟环境指南](https://docs.python.org/zh-cn/3/tutorial/venv.html)

---

**最后更新**: 2025-11-09
**适用平台**: Windows (其他平台命令可能略有不同)
