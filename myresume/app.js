(() => {
  document.documentElement.classList.add('js');
  const story = document.querySelector('.thread-story');
  const stage = document.querySelector('[data-story-stage]');
  const scene = document.querySelector('.paper-scene');
  const paper = document.querySelector('[data-paper]');
  const frames = [...document.querySelectorAll('[data-frame]')];
  const next = document.querySelector('[data-story-next]');
  const position = document.querySelector('[data-story-position]');
  const status = document.querySelector('[data-story-status]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.min(1, Math.max(0, value));
  let current = -1;
  let raf = 0;
  const folded = [[42, 35], [52, 15], [70, 28], [83, 65], [56, 88], [31, 65]];
  const open = [[0, 0], [50, 0], [100, 0], [100, 100], [50, 100], [0, 100]];

  function enhance() {
    const active = Boolean(story && stage && scene && paper && frames.length) && !reducedMotion.matches;
    document.documentElement.classList.toggle('story-enhanced', active);
    next.hidden = !active;
    if (!active) {
      frames.forEach(frame => { frame.removeAttribute('aria-hidden'); frame.classList.add('is-current'); });
      paper.style.clipPath = '';
      scene.style.setProperty('--unfold', 1);
      scene.style.setProperty('--thread', 1);
      return;
    }
    current = -1;
    schedule();
  }

  function update() {
    raf = 0;
    if (!document.documentElement.classList.contains('story-enhanced')) return;
    const range = story.offsetHeight - stage.offsetHeight;
    const progress = clamp((Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--story-header')) - story.getBoundingClientRect().top) / Math.max(range, 1));
    const unfold = clamp(progress / .3);
    const thread = clamp(.07 + progress * 1.14);
    scene.style.setProperty('--unfold', unfold.toFixed(3));
    scene.style.setProperty('--thread', thread.toFixed(3));
    scene.style.setProperty('--play', progress.toFixed(3));
    paper.style.clipPath = `polygon(${folded.map(([x, y], i) => `${(x + (open[i][0] - x) * unfold).toFixed(1)}% ${(y + (open[i][1] - y) * unfold).toFixed(1)}%`).join(',')})`;
    const index = progress < .25 ? 0 : progress < .5 ? 1 : progress < .75 ? 2 : 3;
    if (index !== current) {
      current = index;
      frames.forEach((frame, i) => {
        frame.classList.toggle('is-current', i === index);
        frame.setAttribute('aria-hidden', String(i !== index));
      });
      const labels = ['找到线头', '看清问题', '划清边界', '评测迭代'];
      position.textContent = labels[index];
      next.firstChild.textContent = index === 3 ? '查看项目' : '继续看';
      status.textContent = frames[index].querySelector('h2').textContent;
    }
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(update);
  }

  if (story) {
    enhance();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    reducedMotion.addEventListener('change', enhance);
    next.addEventListener('click', () => {
      if (current === 3) {
        document.querySelector('#projects').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const range = story.offsetHeight - stage.offsetHeight;
      const top = scrollY + story.getBoundingClientRect().top - Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--story-header'));
      scrollTo({ top: top + range * [.3, .55, .8][Math.max(0, current)], behavior: 'smooth' });
    });
  }

  document.querySelectorAll('[data-route-demo]').forEach(demo => {
    const buttons = [...demo.querySelectorAll('[data-route-option]')];
    const output = demo.querySelector('[data-route-output]');
    buttons.forEach(button => button.addEventListener('click', () => {
      buttons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
      output.querySelector('[data-route-title]').textContent = button.dataset.routeTitle;
      output.querySelector('[data-route-description]').textContent = button.dataset.routeDescription;
    }));
  });
  document.querySelectorAll('[data-copy-email]').forEach(button => button.addEventListener('click', async () => {
    const status = document.querySelector('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(button.dataset.copyEmail);
      status.textContent = '邮箱已复制。';
    } catch {
      status.textContent = '复制未完成，可选中上方邮箱复制。';
    }
  }));
})();
