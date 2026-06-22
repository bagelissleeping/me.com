const DATA_URL = '../assets/resume.json';

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
  'sales-empowerment-agent': {
    title: '销售赋能智能体',
    hook: '把 AI 能力从合规审查迁移到销售支持和代理人培养场景。',
    tags: ['销售赋能', '智能问答', '内容创作', '智能陪练'],
    steps: [
      ['业务问题', '培训、知识、内容和客户沟通分散在不同系统与动作里。'],
      ['产品拆解', '将 AI 定位为销售过程中的连续辅助能力，而不是单一问答入口。'],
      ['验证推进', '围绕营销内容创作、行业化智能问答、智能陪练等核心场景进行方案验证。'],
      ['结果沉淀', '形成面向寿险代理人培养与展业的销售赋能方案，并推动与传统业务系统衔接。']
    ]
  }
};

const skillGroups = [
  {
    title: '产品定义',
    items: data => splitSkills(data.facts.skills?.product)
  },
  {
    title: 'AI 工作流',
    items: data => splitSkills(data.facts.skills?.agentWorkflow)
  },
  {
    title: '验证推进',
    items: data => [
      ...splitSkills(data.facts.skills?.aiValidation),
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

let resumeData = null;
let activeExperience = 0;
let activeProject = 0;
let interactionsBound = false;

function $(selector) {
  return document.querySelector(selector);
}

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

function hideLoadState() {
  const node = $('#load-state');
  if (node) node.classList.add('is-hidden');
}

function setLoadState(message, isError = false) {
  const node = $('#load-state');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('is-error', isError);
}

async function loadResume() {
  const response = await fetch(DATA_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`数据读取失败: ${response.status}`);
  return response.json();
}

function renderEducation(data) {
  const items = data.facts.education || [];
  $('#education-stage').innerHTML = items.map((item, index) => `
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
  const experiences = data.facts.experiences || [];
  $('#experience-tabs').innerHTML = experiences.map((item, index) => {
    const narrative = experienceNarrative[item.id] || {};
    return `
      <button class="experience-tab ${index === activeExperience ? 'is-active' : ''}" type="button" data-experience-index="${index}" aria-pressed="${index === activeExperience}">
        <span>${escapeHtml(item.period?.display || '')}</span>
        <strong>${escapeHtml(item.company)}</strong>
        <em>${escapeHtml(narrative.thesis || item.summary)}</em>
      </button>
    `;
  }).join('');
}

function renderExperiencePanel(data) {
  const experiences = data.facts.experiences || [];
  const item = experiences[activeExperience];
  if (!item) return;

  const narrative = experienceNarrative[item.id] || {};
  const points = (item.highlights || []).map(splitHighlight);

  $('#experience-panel').innerHTML = `
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

function renderExperience(data) {
  renderExperienceTabs(data);
  renderExperiencePanel(data);
}

function orderProjects(data) {
  const projects = data.facts.projects || [];
  const byId = new Map(projects.map(project => [project.id, project]));
  const order = data.display?.website?.projectOrder || projects.map(project => project.id);
  return order.map(id => byId.get(id)).filter(Boolean);
}

function renderProjectSelector(data) {
  const projects = orderProjects(data);
  $('#case-selector').innerHTML = projects.map((project, index) => {
    const narrative = projectNarrative[project.id] || {};
    return `
      <button class="case-button ${index === activeProject ? 'is-active' : ''}" type="button" data-project-index="${index}" aria-pressed="${index === activeProject}">
        <span>${escapeHtml(project.period?.display || '场景验证')}</span>
        <strong>${escapeHtml(narrative.title || project.name)}</strong>
      </button>
    `;
  }).join('');
}

function renderProjectPanel(data) {
  const projects = orderProjects(data);
  const project = projects[activeProject];
  if (!project) return;

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

  $('#case-panel').innerHTML = `
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

function renderProjects(data) {
  renderProjectSelector(data);
  renderProjectPanel(data);
}

function renderCapabilities(data) {
  $('#capability-canvas').innerHTML = skillGroups.map((group, index) => {
    const items = group.items(data).filter(Boolean).slice(0, 7);
    return `
      <article class="capability-tile reveal-item" data-order="${String(index + 1).padStart(2, '0')}">
        <h3>${escapeHtml(group.title)}</h3>
        <div class="tag-row">${renderTags(items)}</div>
      </article>
    `;
  }).join('');
}

function bindInteractions() {
  if (interactionsBound) return;
  interactionsBound = true;

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-experience-index]');
    if (!button || !resumeData) return;
    activeExperience = Number(button.dataset.experienceIndex);
    renderExperience(resumeData);
  });

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-project-index]');
    if (!button || !resumeData) return;
    activeProject = Number(button.dataset.projectIndex);
    renderProjects(resumeData);
  });
}

function bindReveal() {
  const items = document.querySelectorAll('.reveal-item');
  if (!('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  items.forEach(item => observer.observe(item));
}

function render(data) {
  resumeData = data;
  renderEducation(data);
  renderExperience(data);
  renderProjects(data);
  renderCapabilities(data);
  bindInteractions();
  bindReveal();
}

loadResume()
  .then(data => {
    render(data);
    hideLoadState();
  })
  .catch(error => {
    console.error(error);
    setLoadState('简历数据加载失败，请用本地静态服务打开页面。', true);
    bindReveal();
  });
