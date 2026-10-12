# ZH简历

这是一个用于个人展示、简历投递和 GitHub Pages 发布的静态站点仓库。

## 目录说明

- `index.html`：公开入口，跳转到 `myresume/`
- `myresume/`：个人网站首页、车险／合规／GrooveLog 详情页及共用样式、交互
- `v2-pm/`：简历页面版本，用于打印和投递
- `assets/resume.json`：简历事实源
- `PDF/`：导出的简历 PDF
- `scripts/build-resume.mjs`：根据 `assets/resume.json` 生成 `v2-pm/`
- `scripts/export-pdf.mjs`：导出 PDF
- `scripts/build-site.mjs`：从统一数据源生成静态首页、详情页及简历页，将指定发布文件整理到 `dist/`

## 本地预览

建议先生成发布目录，再用静态服务打开：

```bash
node scripts/build-site.mjs
python -m http.server 8000 --directory dist
```

打开 `http://localhost:8000/myresume/`。无需安装新的前端依赖。

## 内容维护方式

### 1. 更新简历事实
优先修改：
- `assets/resume.json`

其中 `facts` 是职业经历与技能，`personalProjects` 单列 GrooveLog；首页与详情共用项目的 `layers`、职责及成果。`display.website` 管理标题、简介和项目顺序。职业事实与父目录最新简历一致，待确认的旧网站数字不进入主展示。

### 2. 生成简历页面

```bash
node scripts/build-resume.mjs v2-pm
```

### 3. 导出 PDF

```bash
node scripts/export-pdf.mjs v2-pm
```

### 4. 生成可发布网站

```bash
node scripts/build-site.mjs
```

这一步会同时重建 `myresume/index.html`、三个案例页和 `v2-pm/index.html`，再复制到 `dist/`。首页在同一个线团上用正常滚动呈现四种产品工作方法，最终连向两个职业项目和 GrooveLog。导航“看项目”可直接跳到终点。减少动态效果或关闭 JavaScript 时，方法和项目改为静态顺序展示；脚本还处理返回进度、详情客服分流示意和邮箱复制。

不要手动维护生成 HTML 中的职业事实。改数据后重新构建，避免首页与详情失步。发布目录不复制项目规范、开发文档、源码脚本或预览图，也不删除已有 `dist/` 内容；当前构建按明确的文件清单覆盖对应发布文件。

`PDF/resume-v2-pm.pdf` 使用父项目最新原版风格简历 PDF；PDF 是独立资源，不由站点构建重新导出。修改简历事实后先核对并更新这一文件，再发布网站。

## GitHub Pages 发布

仓库已准备好 GitHub Pages 的静态部署流程：

- 工作流文件：`.github/workflows/deploy.yml`
- 发布目标：`dist/`
- 触发方式：推送到 `main` 分支或手动执行 workflow

发布后，以下路径应可直接访问：

- 网站首页：`/`
- 个人网站：`/myresume/`
- 车险客服：`/myresume/cases/car-insurance-service.html`
- 合规审查：`/myresume/cases/compliance-agent.html`
- GrooveLog：`/myresume/cases/groovelog.html`
- 简历版本：`/v2-pm/`
- PDF 简历：`/PDF/resume-v2-pm.pdf`

## 维护原则

- 简历事实以 `assets/resume.json` 为准
- 首页以连续解线叙事展示业务问题、AI／人工边界、流程和评测迭代；同一根线在终点连接完整案例，经历与技能由简历入口查看
- 网站、PDF、版本页尽量保持同一份事实口径
- 外链和相对路径以 GitHub Pages 环境可直接打开为准
- 修改与本地验证不包含提交、推送或远端发布；这些操作仅按用户明确要求执行
