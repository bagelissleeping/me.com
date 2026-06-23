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
    title: '保险合规审查多 Agent 协同系统',
    hook: '把合规审查从人工经验整理成可复用的 AI 审查链路。',
    tags: ['合规审查', 'Multi-Agent', 'Workflow / RAG', 'Prompt 迭代'],
    steps: [
      ['业务问题', '保险条款、营销文案等材料审查依赖人工经验，效率低，标准难统一。'],
      ['产品拆解', '把审查目标、风险判断依据、修改建议和报告输出拆成分阶段流程。'],
      ['验证推进', '基于客户条款样本和同类材料，完成 4 版核心提示词迭代与测试优化。'],
      ['结果沉淀', '单份材料审查时间缩短到 30 分钟内，在 3 家以上客户试点中获得认可。']
    ]
  },
  'insurance-prospecting-agent-system': {
    title: 'AI赋能保险智能展业系统',
    hook: '把智能体、知识库和业务数据接入保险代理人的完整展业流程。',
    tags: ['智能展业', 'Agent 搭建', '知识库建设', '评测优化'],
    steps: [
      ['业务问题', '保险代理人的内容获客、客户识别、需求洞察、方案转化和持续跟进分散在多个动作中，需要 AI 形成连续辅助能力。'],
      ['产品拆解', '围绕展业全流程设计问答、文本创作、图像创作和智能陪练智能体，并完成系统页面原型设计。'],
      ['验证推进', '建设保险业务知识库和评测体系，用典型问答对、Golden Case 和千帆智能评测验证召回准确性与答案专业度。'],
      ['结果沉淀', '形成覆盖内容获客、客户经营、销售陪练和能力提升的 AI 智能展业闭环，并沉淀可持续优化的方法。']
    ]
  }
};

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
  const projects = data.facts.projects || [];
  const byId = new Map(projects.map(project => [project.id, project]));
  const order = data.display?.website?.projectOrder || projects.map(project => project.id);
  return order.map(id => byId.get(id)).filter(Boolean);
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

  writeFileSync(outPath, html, 'utf8');
  console.log(`单文件版已生成: ${outPath}`);
}

main();
