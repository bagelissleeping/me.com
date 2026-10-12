import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = resolve(ROOT, 'dist');
const data = JSON.parse(readFileSync(resolve(ROOT, 'assets/resume.json'), 'utf8'));
const basics = data.facts.basics;
const website = data.display.website;
const projectsById = new Map(data.facts.projects.map(project => [project.id, project]));
const projects = website.projectOrder.map(id => projectsById.get(id)).filter(Boolean);
const personalProjectsById = new Map(data.personalProjects.map(project => [project.id, project]));
const personalProjects = website.personalProjectOrder.map(id => personalProjectsById.get(id)).filter(Boolean);
const e = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const text = value => Array.isArray(value) ? value.join(' ') : String(value ?? '');
const arrow = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const plus = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M12 5v14"/></svg>';
const layerPrefix = project => project.id === 'car-insurance-service' ? 'service' : project.id === 'compliance-agent' ? 'compliance' : project.id;
const projectHref = project => project.href || `./cases/${project.id}.html`;

function head(title, description, depth = 0) {
  const prefix = depth ? '../' : './';
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${e(title)}</title>
  <meta name="description" content="${e(description)}">
  <meta name="theme-color" content="#F4F3EF">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='9' fill='%23F4F3EF'/%3E%3Cpath d='M8 29C8 7 29 32 29 12S13 15 32 29' fill='none' stroke='%23325BD6' stroke-width='3'/%3E%3C/svg%3E">
  <link rel="stylesheet" href="${prefix}styles.css">
  <script src="${prefix}app.js" defer></script>
</head>`;
}

function header(depth = 0) {
  const home = depth ? '../' : './';
  const anchor = depth ? '../' : '';
  const pdf = depth ? '../../PDF/resume-v2-pm.pdf' : '../PDF/resume-v2-pm.pdf';
  return `<a class="skip-link" href="#main">跳到正文</a>
<header class="site-header"><div class="page-width">
  <a class="brand-name" href="${home}" aria-label="张慧，回到首页">${e(basics.name)}<span class="brand-role">AI 产品经理</span></a>
  <nav class="site-nav" aria-label="主导航"><a href="${anchor}#projects">看项目</a><a href="${anchor}#contact">联系</a></nav>
  <div class="header-actions"><a class="text-link" href="${pdf}" download="张慧_AI产品经理_简历.pdf">下载简历${arrow}</a></div>
</div></header>`;
}

function footer(depth = 0) {
  const home = depth ? '../' : './';
  return `<footer class="site-footer page-width"><p>${e(basics.name)} · 抽丝剥茧，理清问题。</p><a href="${home}#projects">${depth ? '回到案例总览' : '回到项目'}${arrow}</a><span>更新于 ${e(data.meta.updatedAt)}</span></footer>`;
}

function metrics(project, compact = false) {
  return (project.metrics || []).map(metric => `<div class="metric"><span class="metric-value">${e(metric.value)}</span><span class="metric-label">${e(metric.label)}</span>${metric.note && !compact ? `<small class="metric-note">${e(metric.note)}</small>` : ''}</div>`).join('');
}

function routeDemo(detailed = false) {
  const heading = detailed ? 'h3' : 'h5';
  const routes = [
    ['direct', '知识库已有答案', 'AI 直接回复', '知识库已有的常见问题，由 AI 直接回复。'],
    ['assist', '存在相似问题', 'AI 推荐，人工确认', '存在相似问题时，由 AI 推荐答案，经人工审核后回复。'],
    ['human', '复杂问题', '人工处理', '复杂问题转由人工处理，保留人工判断与服务能力。']
  ];
  return `<div class="route-demo" data-route-demo><p class="flow-note">服务分层流程示意</p><div class="route-options js-only" role="group" aria-label="选择问题类型">${routes.map(([id, label, title, description], index) => `<button type="button" data-route-option data-route="${id}" data-route-title="${e(title)}" data-route-description="${e(description)}" aria-pressed="${index === 0}">${e(label)}</button>`).join('')}</div><div class="route-outcome" data-route-output aria-live="polite"><${heading} data-route-title>${routes[0][2]}</${heading}><p data-route-description>${routes[0][3]}</p></div><noscript><p>相似问题：AI 推荐、人工确认；复杂问题：人工处理。</p></noscript></div>`;
}

function layers(project, showRoute = false, detailed = false, selected = null) {
  const prefix = layerPrefix(project);
  const heading = detailed ? 'h2' : 'h4';
  return (project.layers || []).filter(layer => !selected || selected.includes(layer.id)).map(layer => `<section class="layer" id="${prefix}-${e(layer.id)}"><${heading}>${e(layer.title)}</${heading}><p>${e(text(layer.text))}</p>${showRoute && layer.id === 'solution' ? routeDemo(detailed) : ''}</section>`).join('');
}

function projectEntry(project) {
  const responsibility = project.responsibility.split(/[，；]/)[0].replace(/[。.]$/, '');
  return `<article class="project-teaser" id="${e(project.id)}">
  <div class="teaser-copy"><p class="status-note">${e(project.status)}<span class="teaser-period">${e(project.period?.display)}</span></p><h3>${e(project.shortName || project.name)}</h3><p class="project-question">${e(project.question)}</p><p class="teaser-role">${e(responsibility)}。</p><a class="detail-link" href="${e(projectHref(project))}">看看我是怎么做的${arrow}</a></div><div class="teaser-metrics">${metrics(project, true)}</div>
</article>`;
}

function personalEntry(project) {
  return `<article class="personal-project" id="${e(project.id)}"><div class="personal-copy"><h3>${e(project.name)}</h3><p class="project-question">${e(project.question)}</p><p>${e(project.background)}</p><a class="detail-link" href="${e(projectHref(project))}">看看这个小尝试${arrow}</a></div><figure class="personal-diagram" aria-label="GrooveLog 产品结构示意"><div class="personal-flow"><span>记下一节课</span><span>自动匹配课卡</span><span>进入个人舞蹈档案</span></div><figcaption>产品结构示意</figcaption></figure></article>`;
}

function homePage() {
  const methods = [
    ['看清问题', '先看问题发生在哪一步。', '把业务场景、流程与规则梳理清楚。'],
    ['划清边界', '分清 AI 做什么，哪些判断留给人。', '服务分层，关键判断保留人工确认。'],
    ['形成流程', '把判断变成能执行的流程。', '把规则落到意图路由、SOP 与 Workflow。'],
    ['评测迭代', '用 Bad Case 和复测修正方案。', '业务归因、Prompt 调试，再看评测结果。']
  ];
  const connections = [...projects, ...personalProjects].map((project, index) => `<a class="project-connection${index === 2 ? ' personal-connection' : ''}" id="${index === 2 ? 'personal' : e(project.id)}" href="${e(projectHref(project))}" data-project-link><span class="project-stage">${e(project.status)}${index === 2 ? ' · 工作之外' : ''}</span><h3>${e(project.shortName || project.name)}</h3><span class="project-intro">${e(project.question)}</span><span class="project-open">查看项目${arrow}</span></a>`).join('');
  return `${head(`${basics.name}｜AI 产品经理 · 抽丝剥茧`, website.heroSummary)}
<body class="home-page">${header()}
<main id="main"><h1 class="visually-hidden">${e(basics.name)}的产品工作方法：抽丝剥茧</h1>
  <section class="thread-story" id="opening" aria-label="随线团逐渐理清产品工作方法">
    <div class="story-stage page-width" data-story-stage>
      <div class="story-copy">
        <section class="method-frame is-current" data-frame="0"><h2>先找到线头。</h2><p>往下滑，看看我怎样把业务问题<br class="desktop-break">理成产品方案。</p></section>
        ${methods.map((method, index) => `<section class="method-frame" data-frame="${index + 1}"><h2>${e(method[1])}</h2><p>${e(method[2])}</p></section>`).join('')}
        <section class="method-frame" data-frame="5"><h2 id="projects-title">这套方法，<br>用在这些项目里。</h2><p>沿着理开的线，继续看。</p></section>
      </div>
      <div class="thread-scene"><canvas id="story-thread" aria-hidden="true"></canvas><div class="method-trail" aria-hidden="true">${methods.map((method, index) => `<span class="method-marker" data-marker="${index}">${e(method[0])}</span>`).join('')}</div></div>
      <div class="project-map" id="projects" aria-labelledby="projects-title">${connections}</div>
      <div class="story-controls js-only"><button type="button" class="story-next" data-story-next>拉开这根线${arrow}</button><span class="story-position" data-story-position>从这里开始</span></div>
      <p class="visually-hidden" role="status" data-story-status></p>
    </div>
  </section>
  <section id="contact" class="contact-section page-width" aria-labelledby="contact-title"><h2 id="contact-title">聊聊你的业务问题。</h2><a class="contact-email" href="mailto:${e(basics.email)}">${e(basics.email)}${arrow}</a><div class="contact-actions"><button type="button" class="secondary-link js-only" data-copy-email="${e(basics.email)}">复制邮箱</button><a class="primary-link" href="../PDF/resume-v2-pm.pdf" download="张慧_AI产品经理_简历.pdf">下载简历${arrow}</a><span data-copy-status role="status"></span></div></section>
</main>${footer()}
</body>
</html>`;
}

function casePage(project, personal = false) {
  const titleParts = project.id === 'groovelog'
    ? project.name.match(/^(\S+ )(.*)$/).slice(1)
    : project.name.split(/(?<=｜)/);
  const caseTitle = titleParts.map(part => `<span class="case-title-part">${e(part)}</span>`).join('');
  return `${head(`${project.name}｜${basics.name}`, project.background, 1)}
<body class="case-page">${header(1)}
<main class="page-width" id="main">
  <div class="case-breadcrumb"><a href="../#${personal ? 'personal' : 'projects'}">${personal ? '其他尝试' : '职业项目'}</a><span>/ ${e(project.shortName || project.name)}</span></div>
  <header class="case-header"><h1>${caseTitle}</h1><p class="case-question">${e(project.question)}</p><p class="case-meta">${e(project.period?.display)}${project.period?.display ? ' · ' : ''}${e(project.role)} · ${e(project.status)}${personal ? ` · ${e(project.stage)}` : ''}</p><p class="case-intro">${e(project.responsibility)}</p></header>
  ${project.metrics?.length ? `<section class="case-facts" aria-label="项目成果">${metrics(project)}</section>` : ''}
  <div class="case-content"><section class="layer"><h2>${personal ? '起因' : '项目背景'}</h2><p>${e(project.background)}</p></section>${layers(project, project.id === 'car-insurance-service', true, personal ? ['decision', 'solution', 'evaluation'] : ['decision', 'solution'])}<details class="case-detail-expand"><summary>展开实施细节</summary><ul>${(project.highlights || []).map(item => `<li>${e(item)}</li>`).join('')}</ul></details>${personal && project.externalHref ? `<a class="detail-link" href="${e(project.externalHref)}" target="_blank" rel="noopener noreferrer">打开 GrooveLog 互动介绍站${arrow}</a>` : ''}</div>
  <div class="case-back case-actions"><a class="primary-link" href="../#${personal ? 'personal' : 'projects'}">回到${personal ? '其他尝试' : '案例总览'}${arrow}</a><a class="text-link" href="../#contact">联系我${arrow}</a></div>
</main>${footer(1)}
</body>
</html>`;
}

function write(path, contents) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${contents.replace(/[\t ]+$/gm, '')}\n`, 'utf8');
}

function copy(relativePath) {
  const source = resolve(ROOT, relativePath);
  if (!existsSync(source)) throw new Error(`找不到发布文件: ${relativePath}`);
  const target = resolve(OUTPUT_DIR, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
}

function main() {
  write(resolve(ROOT, 'myresume/index.html'), homePage());
  [...projects, ...personalProjects].forEach(project => write(resolve(ROOT, 'myresume/cases', `${project.id}.html`), casePage(project, personalProjectsById.has(project.id))));
  execFileSync(process.execPath, [resolve(ROOT, 'scripts/build-resume.mjs'), 'v2-pm'], { stdio: 'inherit' });
  const publishFiles = ['index.html', 'assets/resume.json', 'PDF/resume-v2-pm.pdf', 'myresume/index.html', 'myresume/app.js', 'myresume/styles.css', 'v2-pm/index.html', 'v2-pm/styles.css', 'v2-pm/script.js', 'v2-pm/smart-print.js', ...[...projects, ...personalProjects].map(project => `myresume/cases/${project.id}.html`)];
  publishFiles.forEach(copy);
  write(resolve(OUTPUT_DIR, '.nojekyll'), '');
  console.log(`站点已生成到 ${OUTPUT_DIR}（${publishFiles.length} 个发布文件）`);
}

main();
