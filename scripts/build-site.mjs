import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT_DIR = resolve(ROOT, 'dist');
const IGNORED_FILES = new Set(['AGENTS.md', 'CLAUDE.md']);

function copyRequiredFile(sourcePath, targetPath) {
  if (!existsSync(sourcePath)) {
    throw new Error(`找不到文件: ${sourcePath}`);
  }
  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}

function copyTree(sourcePath, targetPath) {
  if (!existsSync(sourcePath)) {
    throw new Error(`找不到路径: ${sourcePath}`);
  }

  const stats = statSync(sourcePath);
  if (stats.isDirectory()) {
    mkdirSync(targetPath, { recursive: true });
    for (const entry of readdirSync(sourcePath, { withFileTypes: true })) {
      if (IGNORED_FILES.has(entry.name)) continue;
      copyTree(join(sourcePath, entry.name), join(targetPath, entry.name));
    }
    return;
  }

  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}

function main() {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  ['index.html', 'app.js', 'styles.css'].forEach(fileName => {
    copyRequiredFile(resolve(ROOT, fileName), resolve(OUTPUT_DIR, fileName));
  });

  ['myresume'].forEach(dirName => {
    copyTree(resolve(ROOT, dirName), resolve(OUTPUT_DIR, dirName));
  });

  mkdirSync(resolve(OUTPUT_DIR, 'assets'), { recursive: true });
  copyRequiredFile(resolve(ROOT, 'assets', 'resume.json'), resolve(OUTPUT_DIR, 'assets', 'resume.json'));

  writeFileSync(resolve(OUTPUT_DIR, '.nojekyll'), '', 'utf8');
  console.log(`✅ 站点已生成到 ${OUTPUT_DIR}`);
}

main();
