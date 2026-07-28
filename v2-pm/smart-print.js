// 智能打印优化 v6 - 精确控页
class SmartPrintOptimizer {
    constructor() {
        this.PAGE_H = 1123;
        this.isOptimized = false;
    }

    init() {
        window.addEventListener('beforeprint', () => this.optimizeForPrint());
        window.addEventListener('afterprint', () => this.restoreStyles());
    }

    optimizeForPrint() {
        if (this.isOptimized) return;
        this._saved = document.querySelector('.container').innerHTML;
        this._bodySaved = document.body.style.cssText;
        this._compact();
        this._fitPages();
        this.isOptimized = true;
    }

    restoreStyles() {
        if (!this.isOptimized) return;
        document.querySelector('.container').innerHTML = this._saved;
        document.body.style.cssText = this._bodySaved || '';
        this.isOptimized = false;
    }

    _compact() {
        document.querySelectorAll('.no-print').forEach(el => el.remove());
        const c = document.querySelector('.container');
        if (c) c.style.cssText = 'max-width:none;box-shadow:none;margin:0;padding:0;background:white;min-height:auto;';
        document.body.style.cssText = 'font-size:13px;line-height:1.45;margin:0;padding:0;background:white;';
        document.querySelectorAll('.header').forEach(el => el.style.padding = '10px 14px');
        document.querySelectorAll('section').forEach(el => el.style.padding = '8px 14px');
        document.querySelectorAll('section h2').forEach(el => { el.style.marginBottom = '5px'; el.style.paddingBottom = '2px'; });
        document.querySelectorAll('section h3').forEach(el => el.style.margin = '7px 0 3px');
        document.querySelectorAll('section p').forEach(el => el.style.marginBottom = '3px');
        document.querySelectorAll('.job li, .project li, .awards li').forEach(el => el.style.marginBottom = '2px');
        document.querySelectorAll('.skill-category').forEach(el => el.style.marginBottom = '5px');
        document.querySelectorAll('.job, .project, .education-item, .internship-item').forEach(el => {
            el.style.marginBottom = '7px'; el.style.paddingBottom = '3px';
        });
        document.querySelectorAll('.job ul, .project ol').forEach(el => { el.style.marginTop = '2px'; el.style.paddingLeft = '14px'; });
    }

    _fitPages() {
        const container = document.querySelector('.container');
        if (!container) return;
        void container.offsetHeight;

        const totalH = container.scrollHeight;
        const numPages = Math.ceil(totalH / this.PAGE_H);
        const lastPageContent = totalH - (numPages - 1) * this.PAGE_H;
        const fillRatio = lastPageContent / this.PAGE_H;

        // Decision: shrink to fewer pages, or expand to fill last page
        let targetPages;

        if (fillRatio < 0.55) {
            // Last page is less than half full -> shrink to (numPages-1) pages
            targetPages = numPages - 1;
        } else {
            // Keep current page count, expand to fill last page
            targetPages = numPages;
        }

        if (targetPages < 1) targetPages = 1;

        const targetH = targetPages * this.PAGE_H;
        // Leave 3% margin at bottom to avoid edge clipping
        const adjustedTarget = targetH * 0.97;
        const scale = adjustedTarget / totalH;

        // Apply: scale font-size and line-height
        const baseFontSize = 13;
        const baseLineHeight = 1.45;

        if (scale < 1) {
            // Shrinking: don't go below 10.5px
            const newFS = Math.max(baseFontSize * scale, 10.5);
            const actualScale = newFS / baseFontSize;
            document.body.style.fontSize = `${newFS}px`;
            document.body.style.lineHeight = `${baseLineHeight * actualScale}`;
        } else {
            // Expanding: cap at 15px to avoid oversized text
            const newFS = Math.min(baseFontSize * scale, 15);
            const actualScale = newFS / baseFontSize;
            document.body.style.fontSize = `${newFS}px`;
            document.body.style.lineHeight = `${baseLineHeight * actualScale}`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.printOptimizer = new SmartPrintOptimizer();
    window.printOptimizer.init();
});
