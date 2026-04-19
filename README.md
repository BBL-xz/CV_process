# CV_Progress_Dashboard

一个可交互的前端 Demo，用于演示：

- 投递状态看板（全部进展 / 测评待完成 / 将面试 / 等结果 / close / 加急）
- 邮箱连接（QQ / 网易）后的投递同步交互
- 流程侧边弹窗（JD、面经准备、面试复盘）
- Demo 级别的流程时间线和状态更新

## 1. 本地启动

### 方式 A：Python（推荐，零依赖）

```bash
python -m http.server 5173
```

打开：`http://127.0.0.1:5173`

### 方式 B：Node

```bash
npx serve . -l 5173
```

## 2. 项目结构

```text
.
├─ index.html
├─ styles.css
├─ app.js
└─ README.md
```

## 3. 部署到 Vercel

这是纯静态项目，不需要构建命令。

1. 把项目推到 GitHub（见下方完整命令）
2. 登录 Vercel，`Add New -> Project`
3. 选择该 GitHub 仓库
4. Framework Preset 选 `Other`
5. Build Command 留空
6. Output Directory 留空（默认根目录）
7. 点 `Deploy`

部署成功后会得到一个公开访问链接。

## 4. GitHub 初始化与推送（完整命令）

> 把下面的 `<your-github-username>` 替换成你的实际值，仓库名使用 `CV_Progress_Dashboard`。

```bash
# 进入项目目录
cd d:\work\简历管理

# 初始化仓库
git init

# 切到 main 分支
git branch -M main

# 添加文件
git add .

# 首次提交
git commit -m "init: job board demo for vercel deployment"

# 关联远程仓库（先在 GitHub 网页创建空仓库 CV_Progress_Dashboard）
git remote add origin https://github.com/<your-github-username>/CV_Progress_Dashboard.git

# 推送
git push -u origin main
```

如果你用 SSH，也可以：

```bash
git remote add origin git@github.com:<your-github-username>/CV_Progress_Dashboard.git
git push -u origin main
```

## 5. 推荐仓库公开内容

建议上传：

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

默认不上传：

- `.omx/`
- `.env*`
- `node_modules/`
- `.vercel/`
- `PRD-email-first-job-board.md`
- `IA-wireframes-email-first-board.md`
