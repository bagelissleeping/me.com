(() => {
  document.documentElement.classList.add('js');
  const story = document.querySelector('.thread-story');
  const stage = document.querySelector('[data-story-stage]');
  const scene = document.querySelector('.paper-scene');
  const paper = document.querySelector('[data-paper]');
  const frames = [...document.querySelectorAll('[data-frame]')];
  const next = document.querySelector('[data-story-next]');
  const replay = document.querySelector('[data-story-replay]');
  const position = document.querySelector('[data-story-position]');
  const status = document.querySelector('[data-story-status]');
  const catRig = document.querySelector('[data-cat-rig]');
  const catShadow = document.querySelector('[data-cat-shadow]');
  const readyCat = document.querySelector('.cat-ready');
  const pounceCat = document.querySelector('.cat-pounce');
  const ball = document.querySelector('[data-yarn-ball]');
  const ballShadow = document.querySelector('[data-ball-shadow]');
  const thread = document.querySelector('[data-yarn-thread]');
  const threadSvg = thread?.ownerSVGElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = (from, to, value) => { const t = clamp((value - from) / (to - from)); return t * t * (3 - 2 * t); };
  let current = -1;
  let raf = 0;
  let motionRaf = 0;
  let motionPhase = 0;
  let motionPlayed = false;
  const folded = [[42, 35], [52, 15], [70, 28], [83, 65], [56, 88], [31, 65]];
  const open = [[0, 0], [50, 0], [100, 0], [100, 100], [50, 100], [0, 100]];

  function renderMotion(phase) {
    if (!scene || !catRig || !ball || !thread) return;
    motionPhase = phase;
    const width = scene.clientWidth;
    const height = scene.clientHeight;
    const launch = ease(.12, .61, phase);
    const follow = ease(.61, .95, phase);
    const roll = ease(.58, .96, phase);
    const air = phase > .14 && phase < .65 ? Math.sin(Math.PI * (phase - .14) / .51) : 0;
    const catX = -width * (.05 * launch + .13 * follow);
    const catY = -height * .085 * air;
    const pose = ease(.22, .25, phase) * (1 - ease(.69, .72, phase));
    catRig.style.transform = `translate3d(${catX.toFixed(1)}px, ${catY.toFixed(1)}px, 0) rotate(${(-3 * air).toFixed(1)}deg) scale(${(1 + .035 * air).toFixed(3)}, ${(1 - .035 * air).toFixed(3)})`;
    readyCat.style.opacity = (1 - pose).toFixed(3);
    pounceCat.style.opacity = pose.toFixed(3);
    catShadow.style.transform = `translateX(${catX.toFixed(1)}px) scaleX(${(1 - .16 * air).toFixed(3)})`;
    catShadow.style.opacity = (1 - .5 * air).toFixed(3);
    const ballX = -width * .10 * roll;
    const ballScale = 1 - .18 * roll;
    const ballDrop = width * .06 * (1 - ballScale);
    ball.style.transform = `translate3d(${ballX.toFixed(1)}px, ${ballDrop.toFixed(1)}px, 0) rotate(${(-640 * roll).toFixed(1)}deg) scale(${ballScale.toFixed(3)})`;
    ballShadow.style.transform = `translateX(${ballX.toFixed(1)}px) scaleX(${ballScale.toFixed(3)})`;
    const x = width * (.24 - .10 * roll);
    const y = height * .85 - 2;
    const length = width * (.018 + .55 * roll);
    const wave = Math.min(width * .014, 9) * roll;
    threadSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    thread.setAttribute('d', `M ${x} ${y} C ${x + length * .12} ${y - wave}, ${x + length * .15} ${y + wave}, ${x + length * .30} ${y} S ${x + length * .50} ${y - wave}, ${x + length * .60} ${y} S ${x + length * .82} ${y + wave}, ${x + length} ${y}`);
  }

  function playMotion() {
    if (reducedMotion.matches) return;
    cancelAnimationFrame(motionRaf);
    motionPlayed = true;
    renderMotion(0);
    let start;
    const tick = now => {
      start ??= now;
      const phase = clamp((now - start) / 3000);
      renderMotion(phase);
      if (phase < 1) motionRaf = requestAnimationFrame(tick);
    };
    motionRaf = requestAnimationFrame(tick);
  }

  function enhance() {
    const active = Boolean(story && stage && scene && paper && frames.length) && !reducedMotion.matches;
    document.documentElement.classList.toggle('story-enhanced', active);
    next.hidden = !active;
    replay.hidden = !active;
    if (!active) {
      cancelAnimationFrame(motionRaf);
      renderMotion(1);
      frames.forEach(frame => { frame.removeAttribute('aria-hidden'); frame.classList.add('is-current'); });
      paper.style.clipPath = '';
      scene.style.setProperty('--unfold', 1);
      return;
    }
    current = -1;
    schedule();
    if (!motionPlayed) Promise.allSettled([readyCat.decode(), pounceCat.decode()]).then(playMotion);
  }

  function update() {
    raf = 0;
    if (!document.documentElement.classList.contains('story-enhanced')) return;
    const range = story.offsetHeight - stage.offsetHeight;
    const progress = clamp((Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--story-header')) - story.getBoundingClientRect().top) / Math.max(range, 1));
    const unfold = clamp(progress / .3);
    scene.style.setProperty('--unfold', unfold.toFixed(3));
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
    addEventListener('resize', () => { schedule(); renderMotion(motionPhase); }, { passive: true });
    reducedMotion.addEventListener('change', enhance);
    replay.addEventListener('click', playMotion);
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
