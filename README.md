# ZH简历

这是一个用于个人展示、简历投递和 GitHub Pages 发布的静态站点仓库。

## 目录说明

- `index.html` / `app.js` / `styles.css`：网站首页，作为公开入口
- `myresume/`：个人网站版本，读取 `../assets/resume.json`
- `v2-pm/`：简历页面版本，用于打印和投递
- `assets/resume.json`：简历事实源
- `PDF/`：导出的简历 PDF
- `scripts/build-resume.mjs`：根据 `assets/resume.json` 生成 `v2-pm/`
- `scripts/export-pdf.mjs`：导出 PDF
- `scripts/build-site.mjs`：将公开文件整理到 `dist/`，用于 GitHub Pages 发布

## 本地预览

建议先生成发布目录，再用静态服务打开：

```bash
node scripts/build-site.mjs
npx serve dist
```

然后访问静态服务地址即可。

如果你习惯 Python，也可以：

```bash
node scripts/build-site.mjs
python -m http.server 8000 --directory dist
```

## 内容维护方式

### 1. 更新简历事实
优先修改：
- `assets/resume.json`

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

## GitHub Pages 发布

仓库已准备好 GitHub Pages 的静态部署流程：

- 工作流文件：`.github/workflows/deploy.yml`
- 发布目标：`dist/`
- 触发方式：推送到 `main` 分支或手动执行 workflow

发布后，以下路径应可直接访问：

- 网站首页：`/`
- 个人网站：`/myresume/`
- 简历版本：`/v2-pm/`
- PDF 简历：`/PDF/resume-v2-pm.pdf`

## 维护原则

- 简历事实以 `assets/resume.json` 为准
- 网站文本保持当前的展示思路，不做全量配置化改造
- 网站、PDF、版本页尽量保持同一份事实口径
- 外链和相对路径以 GitHub Pages 环境可直接打开为准
