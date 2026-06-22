import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const playwrightModule = pathToFileURL('C:/Users/admin/.claude/skills/resume-site-skill/node_modules/playwright/index.mjs').href;
const { chromium } = await import(playwrightModule);

const args = process.argv.slice(2);
const version = args.find(a => !a.startsWith('--'));
const lowres = args.includes('--lowres');
const outputIdx = args.indexOf('--output');
const customOutput = outputIdx >= 0 ? args[outputIdx + 1] : null;

if (!version) {
  console.error('用法: node scripts/export-pdf.mjs <版本号> [--lowres] [--output 路径]');
  process.exit(1);
}

const buildResult = spawnSync(process.execPath, [resolve(ROOT, 'scripts', 'build-resume.mjs'), version], {
  stdio: 'inherit'
});
if (buildResult.status !== 0) {
  process.exit(buildResult.status || 1);
}

const versionDir = resolve(ROOT, version);
const htmlFile = resolve(versionDir, 'index.html');
if (!existsSync(htmlFile)) {
  console.error(`错误: 找不到 ${htmlFile}`);
  process.exit(1);
}

const pdfDir = resolve(ROOT, 'PDF');
if (!existsSync(pdfDir)) mkdirSync(pdfDir, { recursive: true });

const suffix = lowres ? '-lowres' : '';
const defaultName = `resume-${version}${suffix}.pdf`;
const outputPath = customOutput ? resolve(ROOT, customOutput) : resolve(pdfDir, defaultName);

async function main() {
  console.log('[1/3] 启动浏览器...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=medium']
  });

  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  console.log(`[2/3] 加载简历: ${htmlFile}`);
  await page.goto(`file:///${htmlFile.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  if (lowres) {
    await page.evaluate(() => {
      const img = document.querySelector('.profile-image img');
      if (img) img.src = './me-optimized.png';
    });
    await page.waitForTimeout(200);
  }

  await page.evaluate(() => {
    if (window.printOptimizer) window.printOptimizer.optimizeForPrint();
  });
  await page.waitForTimeout(300);

  console.log(`[3/3] 导出 PDF: ${outputPath}`);
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
  });

  await browser.close();
  console.log(`✅ 完成! ${outputPath}`);
}

main().catch(err => {
  console.error('导出失败:', err);
  process.exit(1);
});
