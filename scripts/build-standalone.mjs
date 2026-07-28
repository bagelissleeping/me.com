import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const htmlPath = resolve(ROOT, 'myresume', 'index.html');
const cssPath = resolve(ROOT, 'myresume', 'styles.css');
const dataPath = resolve(ROOT, 'assets', 'resume.json');
const outPath = resolve(ROOT, 'myresume-standalone.html');

const experienceNarrative = {
  'fsp-ai-pm': {
    thesis: '从复杂系统中识别 AI 产品机会，并推进到 Demo、试点和客户沟通。',
    focus: ['AI 产品孵化', '复杂流程抽象', 'Demo 验证', '客户试点'],
    proof: '把隐性业务需求整理成独立产品机会，主导从方案设计、技术选型到 Demo 落地的全过程。'
  },
  'picc-product-manager': {
    thesis: '在保险产品、风险和运营一线建立业务判断，理解产品落地背后的约束。',
    focus: ['产品方案', '风险管理', '线上运营', '数据监控'],
    proof: '独立策划并上线 APP 端活动，累计参与用户 1000+，带动访问量提升 60%+。'
  }
};

const projectNarrative = {
  'compliance-agent': {
    title: '审查 Agent：从可行性验证到规则自进化',
    hook: '把零散法规和人工审查经验，逐步沉淀为可评测、可追溯、可持续演进的合规智能平台。',
    tags: ['合规审查', '规则知识库', '评测驱动', '平台化治理'],
    steps: [
      ['从能审到可沉淀', 'V0 验证大模型审查可行性；V1 将规则转为经人工复核的审查方案，沉淀约 100 条轻量规则。'],
      ['用评测驱动优化', 'V2 基于 10 份标准条款和 50 条种子样本建立早期评测集，围绕召回、准确率和原文定位持续优化。'],
      ['建设平台化底座', 'V3 通过标签、检索与 LLM 适用性复核自动匹配规则，并补齐版本管理、租户隔离和过程追溯。'],
      ['让规则持续演进', 'V4 规划新旧规则对比、变更影响分析、小样本回归评测与人工生效闭环。']
    ],
    detailUrl: './myresume/cases/compliance-agent.html',
    detailLabel: '查看完整 Case Study'
  },
  'groovelog': {
    title: 'GrooveLog：独立开发的舞蹈记录小程序',
    hook: '从自己的练舞需求出发，独立完成产品定义、核心流程、云端数据隔离与互动介绍站。',
    tags: ['个人产品', '微信小程序', '独立开发', '完整产品闭环'],
    steps: [
      ['真实问题', '课程、feeling 与不同舞室的卡片分散记录，难以同时管理余次、到期日和练舞回顾。'],
      ['MVP 取舍', '用一条“记课—自动匹配卡片—进入档案”的主路径，串联课程记录、卡包和个人字典。'],
      ['产品闭环', '支持日历回看、月度与年度统计，让单次记录逐步生长为可回看的个人舞蹈档案。'],
      ['数据边界', '所有操作经过云函数，并按微信用户身份隔离卡包、字典与课程记录。']
    ],
    detailUrl: './myresume/cases/groovelog.html',
    detailLabel: '查看产品案例'
  }
};

const websiteOnlyProjects = [
  {
    id: 'groovelog',
    name: 'GrooveLog 舞蹈记录小程序',
    role: '独立产品设计与开发',
    period: {
      display: '个人项目'
    }
  }
];

const websiteProjectOrder = ['compliance-agent', 'groovelog'];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function splitHighlight(value) {
  const [label, ...rest] = String(value || '').split('：');
  return {
    label: rest.length ? label.trim() : '关键动作',
    body: rest.length ? rest.join('：').trim() : String(value || '').trim()
  };
}

function splitSkills(value) {
  return String(value || '')
    .split(/[、；;]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function renderTags(items) {
  return items.map(item => `<span class="tag">${escapeHtml(item)}</span>`).join('');
}

function renderEducation(data) {
  return (data.facts.education || []).map((item, index) => `
    <article class="education-row reveal-item">
      <span class="education-index">${String(index + 1).padStart(2, '0')}</span>
      <div>
        <h3>${escapeHtml(item.school)}</h3>
        <p>${escapeHtml(item.degree)} · ${escapeHtml(item.major)}</p>
      </div>
      <time>${escapeHtml(item.period)}</time>
    </article>
  `).join('');
}

function renderExperienceTabs(data) {
  return (data.facts.experiences || []).map((item, index) => {
    const narrative = experienceNarrative[item.id] || {};
    return `
      <button class="experience-tab ${index === 0 ? 'is-active' : ''}" type="button" data-experience-index="${index}" aria-pressed="${index === 0}">
        <span>${escapeHtml(item.period?.display || '')}</span>
        <strong>${escapeHtml(item.company)}</strong>
        <em>${escapeHtml(narrative.thesis || item.summary)}</em>
      </button>
    `;
  }).join('');
}

function renderExperiencePanel(item) {
  if (!item) return '';
  const narrative = experienceNarrative[item.id] || {};
  const points = (item.highlights || []).map(splitHighlight);

  return `
    <div class="panel-meta">
      <span>${escapeHtml(item.department || '')}</span>
      <span>${escapeHtml(item.role || '')}</span>
    </div>
    <h3>${escapeHtml(narrative.thesis || item.summary)}</h3>
    <p class="panel-proof">${escapeHtml(narrative.proof || item.summary)}</p>
    <div class="tag-row">${renderTags(narrative.focus || points.map(point => point.label).slice(0, 4))}</div>
    <div class="evidence-list">
      ${points.map(point => `
        <section class="evidence-item">
          <h4>${escapeHtml(point.label)}</h4>
          <p>${escapeHtml(point.body)}</p>
        </section>
      `).join('')}
    </div>
  `;
}

function orderProjects(data) {
  const projects = [...(data.facts.projects || []), ...websiteOnlyProjects];
  const byId = new Map(projects.map(project => [project.id, project]));
  return websiteProjectOrder.map(id => byId.get(id)).filter(Boolean);
}

function renderProjectSelector(projects) {
  return projects.map((project, index) => {
    const narrative = projectNarrative[project.id] || {};
    return `
      <button class="case-button ${index === 0 ? 'is-active' : ''}" type="button" data-project-index="${index}" aria-pressed="${index === 0}">
        <span>${escapeHtml(project.period?.display || '场景验证')}</span>
        <strong>${escapeHtml(narrative.title || project.name)}</strong>
      </button>
    `;
  }).join('');
}

function renderProjectPanel(project) {
  if (!project) return '';
  const narrative = projectNarrative[project.id] || {
    title: project.name,
    hook: project.background,
    tags: [project.role].filter(Boolean),
    steps: [
      ['背景', project.background],
      ['动作', (project.highlights || []).join(' ')],
      ['结果', (project.results || []).join(' ')]
    ]
  };

  return `
    <div class="case-panel-head">
      <div>
        <p class="case-type">${escapeHtml(project.role || '产品经理')}</p>
        <h3>${escapeHtml(narrative.title)}</h3>
      </div>
      <div class="tag-row">${renderTags(narrative.tags || [])}</div>
    </div>
    <p class="case-hook">${escapeHtml(narrative.hook)}</p>
    <div class="case-steps">
      ${narrative.steps.map(([title, body], index) => `
        <section class="case-step">
          <span>${String(index + 1).padStart(2, '0')}</span>
          <h4>${escapeHtml(title)}</h4>
          <p>${escapeHtml(body)}</p>
        </section>
      `).join('')}
    </div>
    ${narrative.detailUrl ? `
      <div class="case-actions">
        <a class="primary-link" href="${escapeHtml(narrative.detailUrl)}">${escapeHtml(narrative.detailLabel || '查看完整案例')} <span aria-hidden="true">↗</span></a>
      </div>
    ` : ''}
  `;
}

function renderCapabilities(data) {
  const skillGroups = [
    {
      title: '产品定义',
      items: resume => splitSkills(resume.facts.skills?.product)
    },
    {
      title: 'AI 工作流',
      items: resume => splitSkills(resume.facts.skills?.agentWorkflow)
    },
    {
      title: '验证推进',
      items: resume => [
        ...splitSkills(resume.facts.skills?.aiValidation),
        '深度使用 Cursor、Claude Code、Codex 等 AI 工具进行原型与 Demo 快速验证'
      ]
    },
    {
      title: '行业洞察',
      items: () => [
        '能深入行业现场形成自己的观察',
        '能将行业规则与流程抽象为 AI 可执行链路'
      ]
    },
    {
      title: '证书技能',
      items: () => [
        '北美准精算师考试通过两门（P、FM）',
        '证券从业资格证',
        '英语六级'
      ]
    }
  ];

  return skillGroups.map((group, index) => {
    const items = group.items(data).filter(Boolean).slice(0, 7);
    return `
      <article class="capability-tile reveal-item" data-order="${String(index + 1).padStart(2, '0')}">
        <h3>${escapeHtml(group.title)}</h3>
        <div class="tag-row">${renderTags(items)}</div>
      </article>
    `;
  }).join('');
}

function buildInteractionScript(experiencePanels, projectPanels) {
  return `
(() => {
  const experiencePanels = ${JSON.stringify(experiencePanels).replaceAll('</', '<\\/')};
  const projectPanels = ${JSON.stringify(projectPanels).replaceAll('</', '<\\/')};

  function activate(buttons, panel, panels, index) {
    if (!panel || !panels[index]) return;
    panel.innerHTML = panels[index];
    buttons.forEach((button, buttonIndex) => {
      const active = buttonIndex === index;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  const experiencePanel = document.querySelector('#experience-panel');
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-experience-index]');
    if (!button) return;
    const buttons = Array.from(document.querySelectorAll('[data-experience-index]'));
    activate(buttons, experiencePanel, experiencePanels, Number(button.dataset.experienceIndex));
  });

  const projectPanel = document.querySelector('#case-panel');
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-project-index]');
    if (!button) return;
    const buttons = Array.from(document.querySelectorAll('[data-project-index]'));
    activate(buttons, projectPanel, projectPanels, Number(button.dataset.projectIndex));
  });
})();
`;
}

function main() {
  const data = JSON.parse(readFileSync(dataPath, 'utf8'));
  const css = readFileSync(cssPath, 'utf8');
  let html = readFileSync(htmlPath, 'utf8');

  const experiences = data.facts.experiences || [];
  const projects = orderProjects(data);
  const experiencePanels = experiences.map(renderExperiencePanel);
  const projectPanels = projects.map(renderProjectPanel);

  html = html.replace(
    '    <link rel="stylesheet" href="./styles.css" />',
    `    <style>\n${css}\n    </style>`
  );

  html = html.replace(
    '<div class="education-stage" id="education-stage"></div>',
    `<div class="education-stage" id="education-stage">${renderEducation(data)}</div>`
  );

  html = html.replace(
    /<div class="experience-tabs" id="experience-tabs" aria-label="[^"]*"><\/div>\s*<article class="experience-panel" id="experience-panel" aria-live="polite"><\/article>/,
    `<div class="experience-tabs" id="experience-tabs" aria-label="工作经历选择">${renderExperienceTabs(data)}</div>\n          <article class="experience-panel" id="experience-panel" aria-live="polite">${experiencePanels[0] || ''}</article>`
  );

  html = html.replace(
    /<div class="case-selector" id="case-selector" aria-label="[^"]*"><\/div>\s*<article class="case-panel" id="case-panel" aria-live="polite"><\/article>/,
    `<div class="case-selector" id="case-selector" aria-label="项目选择">${renderProjectSelector(projects)}</div>\n          <article class="case-panel" id="case-panel" aria-live="polite">${projectPanels[0] || ''}</article>`
  );

  html = html.replace(
    '<div class="capability-canvas" id="capability-canvas"></div>',
    `<div class="capability-canvas" id="capability-canvas">${renderCapabilities(data)}</div>`
  );

  html = html.replace(/\s*<div class="load-state" id="load-state" role="status">[\s\S]*?<\/div>\s*/, '\n');
  html = html.replace(/\s*<noscript>[\s\S]*?<\/noscript>\s*/, '\n');
  html = html.replace(
    /\s*<script src="\.\/app\.js"><\/script>\s*/,
    `\n    <script>\n${buildInteractionScript(experiencePanels, projectPanels)}\n    </script>\n`
  );

  html = html.replace(/^[\t ]+$/gm, '');
  writeFileSync(outPath, html, 'utf8');
  console.log(`单文件版已生成: ${outPath}`);
}

main();
