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
  const career = projects.map(project => {
    const result = project.id === 'car-insurance-service'
      ? '多轮业务提示词调优与评测 · 质检准确率 65% → 95%'
      : '4轮业务提示词调优与评测 · 审查准确率 70% → 90%';
    return `<a class="project-connection" id="${e(project.id)}" href="${e(projectHref(project))}"><span class="project-stage">${e(project.status)} · ${e(project.period?.display)}</span><h3>${e(project.shortName || project.name)}</h3><span class="project-intro">${e(project.question)}</span><span class="project-result">${e(result)}</span><span class="project-open">查看项目${arrow}</span></a>`;
  }).join('');
  const personal = personalProjects.map(project => `<a class="project-connection personal-connection" id="personal" href="${e(projectHref(project))}"><span class="project-stage">个人项目 · 工作之外</span><h3>${e(project.shortName || project.name)}</h3><span class="project-intro">${e(project.question)}</span><span class="project-open">查看项目${arrow}</span></a>`).join('');
  return `${head(`${basics.name}｜AI 产品经理 · 抽丝剥茧`, website.heroSummary)}
<body class="home-page">${header()}
<main id="main"><h1 class="visually-hidden">做toB AI产品，先沉入业务场景。</h1>
  <section class="thread-story" id="opening" aria-label="从小猫解线到业务梳理与产品设计">
    <div class="story-stage page-width" data-story-stage>
      <div class="story-copy">
        <section class="method-frame is-current" data-frame="0"><h2>做toB AI产品，<br>先沉入业务场景。</h2><p>我做过保险场景的 AI 客服和合规审查，负责产品方案，也负责业务相关提示词的调优与评测。</p><span class="story-hint">向下滚动，跟着线头看。</span></section>
        <section class="method-frame" data-frame="1"><span class="method-label">业务梳理</span><h2>把场景、流程<br>与规则梳理清楚。</h2><p>从实际业务问题出发，梳理流程节点、判断依据与异常情况，明确产品需要解决的问题和边界。</p><p class="method-example">在合规审查中，先明确审查目标、风险分级与判定依据，再将规则组织为可复用的审查方案。</p></section>
        <section class="method-frame" data-frame="2"><span class="method-label">产品设计</span><h2>把业务判断<br>落进产品流程。</h2><p>定义 AI 与人工各自的任务，将规则转为意图路由、SOP 与 Workflow，设计页面、配置逻辑和人工确认节点。</p><p class="method-example">在客服项目中，串联意图识别、槽位收集与业务执行，并区分 AI 直接回复、辅助人工和转人工的处理路径。</p></section>
        <section class="method-frame" data-frame="3"><span class="method-label">调优评测</span><h2>用业务样本验证，<br>让判断逐轮准确。</h2><p>负责业务规则与判断逻辑相关的提示词调优，通过 Bad Case 归因、修改与复测，持续修正产品表现。</p><p class="method-example">合规审查：4 轮调优，准确率 70% → 90%。<br>客服质检：多轮调优，准确率 65% → 95%。</p></section>
      </div>
      <div class="thread-scene" data-thread-scene>
        <div class="story-film" data-story-film>
          <video data-story-video muted playsinline preload="none" poster="./assets/cat-yarn-start.webp" width="1174" height="660" aria-label="小猫扑向蓝色线团并将它拨开，随页面滚动播放"><source src="./assets/cat-yarn.mp4" type="video/mp4"></video>
          <img class="story-still" src="./assets/cat-yarn-end.webp" alt="小猫拨开蓝色线团，线头连接下方的产品工作过程" width="1174" height="660">
        </div>
        <svg class="process-thread" viewBox="0 0 800 620" fill="none" aria-hidden="true">
          <path data-thread-lead d="M269 155 C390 155 390 245 210 245 H110 Q70 245 70 280"/>
          <path data-thread-spine d="M70 280 V600"/>
          <circle class="thread-tip" data-thread-tip cx="70" cy="600" r="5"/>
        </svg>
        <ol class="process-steps" aria-label="产品工作过程">
          <li class="process-step" data-process-step style="--step-y:300"><span class="process-dot" aria-hidden="true"></span><h3>业务梳理</h3><p>场景与流程 · 业务规则 · 问题边界</p></li>
          <li class="process-step" data-process-step style="--step-y:430"><span class="process-dot" aria-hidden="true"></span><h3>产品设计</h3><p>任务拆解 · Workflow · 人机协作</p></li>
          <li class="process-step" data-process-step style="--step-y:560"><span class="process-dot" aria-hidden="true"></span><h3>调优评测</h3><p>业务提示词 · Bad Case 归因 · 复测</p></li>
        </ol>
      </div>
      <div class="story-controls js-only"><button type="button" class="story-next" data-story-next>展开线团${arrow}</button><div class="story-control-end"><button type="button" class="story-replay" data-story-replay>重看开场</button><span class="story-position" data-story-position>向下滚动</span></div></div>
      <p class="visually-hidden" role="status" data-story-status></p>
    </div>
  </section>
  <section class="projects-section page-width" id="projects" aria-labelledby="projects-title"><div class="projects-heading"><span>沿着这根线</span><h2 id="projects-title">我做过的项目</h2></div><div class="project-map">${career}</div><div class="personal-heading">工作之外</div><div class="project-map personal-map">${personal}</div></section>
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
  const publishFiles = ['index.html', 'assets/resume.json', 'PDF/resume-v2-pm.pdf', 'myresume/index.html', 'myresume/app.js', 'myresume/styles.css', 'myresume/assets/cat-yarn.mp4', 'myresume/assets/cat-yarn-start.webp', 'myresume/assets/cat-yarn-end.webp', 'v2-pm/index.html', 'v2-pm/styles.css', 'v2-pm/script.js', 'v2-pm/smart-print.js', ...[...projects, ...personalProjects].map(project => `myresume/cases/${project.id}.html`)];
  publishFiles.forEach(copy);
  write(resolve(OUTPUT_DIR, '.nojekyll'), '');
  console.log(`站点已生成到 ${OUTPUT_DIR}（${publishFiles.length} 个发布文件）`);
}

main();
