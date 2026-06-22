import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const dataPath = resolve(ROOT, 'assets', 'resume.json');

const version = process.argv[2] || 'v2-pm';
const outputDir = resolve(ROOT, version);
const outputPath = resolve(outputDir, 'index.html');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeText(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean).join(' ');
  return String(value).trim();
}

function renderBasicItem(label, value) {
  if (!value) return '';
  return `<div class="basic-item"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span></div>`;
}

function renderList(items) {
  return items.map(item => `<li>${escapeHtml(item)}</li>`).join('\n');
}

function renderEducation(items) {
  return items.map(item => `
            <div class="education-item">
                <h3>${escapeHtml(item.school)}｜${escapeHtml(item.major)}｜${escapeHtml(item.degree)} <span class="date">${escapeHtml(item.period)}</span></h3>
            </div>`).join('');
}

function renderExperience(item) {
  const title = [item.company, item.department, item.role].filter(Boolean).join('｜');
  return `
            <div class="job">
                <h3>${escapeHtml(title)} <span class="date">${escapeHtml(item.period.display)}</span></h3>
                <p class="lead-text">${escapeHtml(item.summary)}</p>
                <ul>
                    ${renderList(item.highlights)}
                </ul>
            </div>`;
}

function renderProject(project) {
  const period = project.period?.display ? ` <span class="date">${escapeHtml(project.period.display)}</span>` : '';
  const background = project.background
    ? `
                <p class="lead-text"><strong>项目背景：</strong>${escapeHtml(project.background)}</p>`
    : '';
  const resultBlock = Array.isArray(project.results) && project.results.length
    ? `
                <div class="result-block">
                    <p class="result-title">项目结果</p>
                    <ul class="result-list">
                        ${renderList(project.results)}
                    </ul>
                </div>`
    : '';

  return `
            <div class="project">
                <h3>${escapeHtml(project.name)}${period}</h3>${background}
                <ul>
                    ${renderList(project.highlights)}
                </ul>${resultBlock}
            </div>`;
}

function renderSkills(skills) {
  const toBProduct = skills.product || '';
  const agentWorkflow = skills.agentWorkflow || '';
  const aiValidation = skills.aiValidation || '';
  const knowledgeRules = skills.knowledgeRules || '';
  const toolsCertificates = skills.toolsCertificates || (skills.other || []).join('；');

  return `
            <div class="skill-compact-list">
                <div class="skill-compact-item">
                    <span class="skill-label">ToB AI 产品</span>
                    <p class="skill-values">${escapeHtml(toBProduct)}</p>
                </div>
                <div class="skill-compact-item">
                    <span class="skill-label">Agent / Workflow</span>
                    <p class="skill-values">${escapeHtml(agentWorkflow)}</p>
                </div>
                <div class="skill-compact-item">
                    <span class="skill-label">AI 应用验证</span>
                    <p class="skill-values">${escapeHtml(aiValidation)}</p>
                </div>
                <div class="skill-compact-item">
                    <span class="skill-label">知识与规则抽象</span>
                    <p class="skill-values">${escapeHtml(knowledgeRules)}</p>
                </div>
                <div class="skill-compact-item">
                    <span class="skill-label">工具与证书</span>
                    <p class="skill-values">${escapeHtml(toolsCertificates)}</p>
                </div>
            </div>`;
}

function renderPage(data) {
  const basics = data.facts.basics;
  const publish = data.publish || {};
  const heroHeadline = normalizeText(data.display?.website?.heroHeadline) || basics.title;
  const summary = normalizeText(data.facts.summary?.raw);

  const basicGrid = [
    publish.showGender ? renderBasicItem('性别', basics.gender) : '',
    publish.showAge ? renderBasicItem('年龄', basics.age) : '',
    publish.showPhone ? renderBasicItem('电话', basics.phone) : '',
    publish.showEmail !== false ? renderBasicItem('邮箱', basics.email) : ''
  ].filter(Boolean).join('');

  const education = renderEducation(data.facts.education || []);
  const experiences = (data.facts.experiences || []).map(renderExperience).join('');

  const projectsById = new Map((data.facts.projects || []).map(project => [project.id, project]));
  const orderedProjects = (data.display?.website?.projectOrder || (data.facts.projects || []).map(project => project.id))
    .map(id => projectsById.get(id))
    .filter(Boolean);
  const projects = orderedProjects.map(renderProject).join('');

  const skills = renderSkills(data.facts.skills || {});

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(basics.name)}｜${escapeHtml(basics.title)}简历</title>
    <link rel="stylesheet" href="./styles.css">
</head>
<body>
    <div class="control-buttons no-print">
        <button class="print-button" onclick="window.print()">打印简历</button>
    </div>

    <div class="container">
        <header class="header">
            <div class="header-content">
                <h1>${escapeHtml(basics.name)}</h1>
                <p class="title-line">${escapeHtml(heroHeadline)}</p>
                <div class="basic-grid">
                    ${basicGrid}
                </div>
            </div>
        </header>

        <section class="summary">
            <h2>个人简介</h2>
            <p>${escapeHtml(summary)}</p>
        </section>

        <section class="education">
            <h2>教育经历</h2>
            ${education}
        </section>

        <section class="experience">
            <h2>工作经历</h2>
${experiences}
        </section>

        <section class="projects">
            <h2>项目经历</h2>
${projects}
        </section>

        <section class="skills">
            <h2>技能与证书</h2>

${skills}
        </section>
    </div>

    <script src="./script.js"></script>
    <script src="./smart-print.js"></script>
</body>
</html>
`;
}

function main() {
  if (!existsSync(dataPath)) {
    throw new Error(`找不到数据源: ${dataPath}`);
  }

  const data = JSON.parse(readFileSync(dataPath, 'utf8'));
  const html = renderPage(data);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, `${html}\n`, 'utf8');
  console.log(`✅ 已生成 ${outputPath}`);
}

main();
