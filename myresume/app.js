(() => {
  document.documentElement.classList.add('js');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const story = document.querySelector('.thread-story');
  const stage = document.querySelector('[data-story-stage]');
  const canvas = document.querySelector('#story-thread');
  const context = canvas?.getContext('2d');
  const frames = [...document.querySelectorAll('[data-frame]')];
  const projectLinks = [...document.querySelectorAll('[data-project-link]')];
  const markers = [...document.querySelectorAll('[data-marker]')];
  const next = document.querySelector('[data-story-next]');
  const status = document.querySelector('[data-story-status]');
  const position = document.querySelector('[data-story-position]');
  const clamp = (x, min = 0, max = 1) => Math.max(min, Math.min(max, x));
  const smooth = x => { const v = clamp(x); return v * v * (3 - 2 * v); };
  let progress = 0;
  let current = -1;
  let width = 0;
  let height = 0;
  let frame = 0;
  let endpoints = [];
  const pointer = { x: 0, y: 0, active: false };
  const control = [
    [.13,.10],[.30,.23],[.76,.16],[.88,.40],[.45,.70],[.30,.43],
    [.53,.20],[.81,.56],[.63,.79],[.35,.50],[.43,.27],[.91,.31],
    [.73,.67],[.35,.72],[.25,.43],[.69,.17],[.82,.43],[.53,.74],
    [.40,.49],[.80,.24],[.94,.51],[.52,.68],[.32,.30],[.72,.35],
    [.80,.66],[.46,.81],[.28,.57],[.61,.28],[.89,.38],[.68,.70],
    [.39,.64],[.48,.38],[.80,.53],[.67,.76]
  ];
  function sample(u) {
    const t = u * (control.length - 1);
    const i = Math.floor(t);
    const f = t - i;
    const p0 = control[Math.max(0, i - 1)];
    const p1 = control[Math.min(i, control.length - 1)];
    const p2 = control[Math.min(i + 1, control.length - 1)];
    const p3 = control[Math.min(i + 2, control.length - 1)];
    return [0, 1].map(axis => 0.5 * (2 * p1[axis] + (-p0[axis] + p2[axis]) * f +
      (2*p0[axis]-5*p1[axis]+4*p2[axis]-p3[axis])*f*f +
      (-p0[axis]+3*p1[axis]-3*p2[axis]+p3[axis])*f*f*f));
  }
  const thread = Array.from({ length: 481 }, (_, i) => sample(i / 480));
  function intersection(a, b, c, d) {
    const ax = b[0] - a[0], ay = b[1] - a[1];
    const bx = d[0] - c[0], by = d[1] - c[1];
    const denominator = ax * by - ay * bx;
    if (Math.abs(denominator) < 0.000001) return null;
    const cx = c[0] - a[0], cy = c[1] - a[1];
    const first = (cx * by - cy * bx) / denominator;
    const second = (cx * ay - cy * ax) / denominator;
    return first > 0 && first < 1 && second > 0 && second < 1
      ? [a[0] + ax * first, a[1] + ay * first] : null;
  }
  const crossingPairs = [];
  for (let i = 0; i < thread.length - 1; i++) {
    for (let j = i + 10; j < thread.length - 1; j++) {
      if (intersection(thread[i], thread[i + 1], thread[j], thread[j + 1])) crossingPairs.push([i, j]);
    }
  }
  const portrait = () => innerWidth <= 760 && innerHeight > 600;
  function ordered(u) {
    const mobile = portrait();
    const final = smooth((progress - 0.80) / 0.18);
    const base = mobile ? 0.10 + 0.04 * final : 0.13;
    const span = mobile ? 0.35 + 0.35 * final : 0.70;
    const turn = u > .72 && u < .96 ? (u - .72) / .24 : null;
    const loopX = turn === null ? 0 : .09 * (1 - Math.cos(turn * Math.PI * 2));
    const loopY = turn === null ? 0 : span * .06 * Math.sin(turn * Math.PI * 2);
    return [(mobile ? .13 : .18) + loopX, base + u * span + loopY];
  }
  function computeGeometry() {
    if (!canvas || !context) return;
    const box = canvas.getBoundingClientRect();
    width = box.width;
    height = box.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    endpoints = projectLinks.map(link => {
      const title = link.querySelector('h3').getBoundingClientRect();
      return [title.left - box.left - 14, title.top - box.top + title.height / 2];
    });
  }
  function draw(time = 0) {
    if (!context || !width || !height || motion.matches) return;
    context.clearRect(0, 0, width, height);
    const feedbackRelease = smooth((progress - .69) / .07) * .17;
    const points = thread.map((knot, i) => {
      const u = i / 480;
      const released = smooth((progress * 1.30 + feedbackRelease - u + .025) / .20);
      const target = ordered(u);
      const shrink = 1 - progress * .46;
      let knotX = .62 + (knot[0] - .62) * shrink;
      let knotY = .46 + (knot[1] - .46) * shrink + progress * .13;
      if (portrait()) knotY = .24 + (knotY - .46) * .47;
      if (i < 12) {
        const mix = smooth(i / 12);
        knotX = .13 + (knotX - .13) * mix;
        knotY = .10 + (knotY - .10) * mix;
      }
      let x = (knotX + (target[0] - knotX) * released) * width;
      let y = (knotY + (target[1] - knotY) * released) * height;
      if (progress < .035 && i < 35) y += Math.sin(time / 700) * 2.3 * (1 - i / 35);
      if (pointer.active) {
        const dx = pointer.x - x;
        const dy = pointer.y - y;
        const force = Math.max(0, 1 - Math.hypot(dx, dy) / 125) * .13 * (1 - released);
        x += dx * force;
        y += dy * force;
      }
      return [x, y];
    });
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y));
    context.strokeStyle = '#325bd6';
    context.lineWidth = 2.6;
    context.stroke();
    crossingPairs.forEach(([i, j]) => {
      const crossing = intersection(points[i], points[i + 1], points[j], points[j + 1]);
      if (!crossing) return;
      const dx = points[j + 1][0] - points[j][0];
      const dy = points[j + 1][1] - points[j][1];
      const length = Math.hypot(dx, dy) || 1;
      context.beginPath();
      context.moveTo(crossing[0] - dx / length * 5, crossing[1] - dy / length * 5);
      context.lineTo(crossing[0] + dx / length * 5, crossing[1] + dy / length * 5);
      context.strokeStyle = '#f4f3ef';
      context.lineWidth = 6;
      context.stroke();
      context.strokeStyle = '#325bd6';
      context.lineWidth = 2.6;
      context.stroke();
    });
    const start = points[0];
    context.beginPath();
    context.arc(start[0], start[1], 5.5, 0, Math.PI * 2);
    context.fillStyle = '#f4f3ef';
    context.fill();
    context.strokeStyle = '#325bd6';
    context.lineWidth = 2;
    context.stroke();
    markers.forEach((marker, i) => {
      const point = ordered(.05 + i * .235);
      marker.style.top = (point[1] * height - 10) + 'px';
      marker.classList.toggle('is-past', progress > .27 + i * .20);
      if (progress > .27 + i * .20) {
        context.beginPath();
        context.arc(point[0] * width, point[1] * height, 3.5, 0, Math.PI * 2);
        context.fillStyle = '#325bd6';
        context.fill();
      }
    });
    const connection = smooth((progress - .86) / .14);
    if (connection > 0) {
      const last = points[points.length - 1];
      endpoints.forEach(([x,y], index) => {
        context.save();
        context.globalAlpha = connection * (index === 2 ? .55 : 1);
        const controlX = Math.max(last[0] + 45, x - 50);
        context.beginPath();
        context.moveTo(last[0], last[1]);
        context.bezierCurveTo(controlX, last[1], controlX - 16, y, x, y);
        context.strokeStyle = '#325bd6';
        context.lineWidth = index === 2 ? 1.4 : 1.8;
        context.stroke();
        context.beginPath();
        context.arc(x, y, 4.5, 0, Math.PI * 2);
        context.fillStyle = '#f4f3ef';
        context.fill();
        context.stroke();
        context.restore();
      });
    }
  }
  function update(time = 0) {
    frame = 0;
    if (!story || motion.matches) return;
    const range = story.offsetHeight - stage.offsetHeight;
    const top = story.getBoundingClientRect().top;
    const header = document.querySelector('.site-header').offsetHeight;
    progress = clamp((header - top) / range);
    const index = progress < .09 ? 0 : progress < .29 ? 1 : progress < .49 ? 2 : progress < .69 ? 3 : progress < .89 ? 4 : 5;
    if (index !== current) {
      current = index;
      stage.dataset.step = String(index);
      frames.forEach((item, i) => {
        item.classList.toggle('is-current', i === index);
        item.setAttribute('aria-hidden', String(i !== index));
      });
      stage.classList.toggle('scene-projects', index === 5);
      const projectsVisible = index === 5;
      document.querySelector('.project-map').setAttribute('aria-hidden', String(!projectsVisible));
      projectLinks.forEach(link => link.tabIndex = projectsVisible ? 0 : -1);
      status.textContent = frames[index].querySelector('h2').textContent;
      position.textContent = index === 0 ? '从这里开始' : index === 5 ? '线理清了，看看项目' : ['看清问题','划清边界','形成流程','评测迭代'][index - 1];
      next.innerHTML = (index === 5 ? '再理一次' : index === 4 ? '继续看项目' : '继续拉开') + '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
      computeGeometry();
    }
    stage.dataset.progress = progress.toFixed(3);
    draw(time);
    if (progress < .035 && !document.hidden && top > -40) frame = requestAnimationFrame(update);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function goTo(value, behavior = 'smooth') {
    if (!story) return;
    if (motion.matches) {
      const target = value >= .89 ? document.querySelector('.project-map') : story;
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
      return;
    }
    const header = document.querySelector('.site-header').offsetHeight;
    const top = scrollY + story.getBoundingClientRect().top - header;
    scrollTo({ top: top + (story.offsetHeight - stage.offsetHeight) * value, behavior });
  }
  function setup() {
    document.documentElement.classList.toggle('story-enhanced', Boolean(context) && !motion.matches);
    if (!story) return;
    if (motion.matches || !context) {
      frames.forEach(item => { item.removeAttribute('aria-hidden'); item.classList.add('is-current'); });
      projectLinks.forEach(link => { link.tabIndex = 0; });
      document.querySelector('.project-map').removeAttribute('aria-hidden');
      next.hidden = true;
      return;
    }
    next.hidden = false;
    current = -1;
    computeGeometry();
    schedule();
  }
  if (story && context) {
    setup();
    addEventListener('scroll', schedule, { passive: true });
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!document.hidden) schedule();
    });
    addEventListener('resize', () => { computeGeometry(); schedule(); }, { passive: true });
    motion.addEventListener('change', setup);
    canvas.addEventListener('pointermove', event => {
      const box = canvas.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
      pointer.active = true;
      schedule();
    });
    canvas.addEventListener('pointerleave', () => { pointer.active = false; schedule(); });
    next.addEventListener('click', () => goTo(current === 5 ? 0 : [.16,.36,.56,.76,1][current], motion.matches ? 'instant' : 'smooth'));
    const restore = () => {
      if (['#projects','#personal','#car-insurance-service','#compliance-agent'].includes(location.hash)) goTo(1, 'instant');
      else if (performance.getEntriesByType('navigation')[0]?.type === 'back_forward') {
        try { const saved = JSON.parse(sessionStorage.getItem('zh-thread-progress')); if (saved) goTo(saved.progress, 'instant'); } catch {}
      }
      schedule();
    };
    addEventListener('load', () => requestAnimationFrame(() => requestAnimationFrame(restore)), { once: true });
    addEventListener('pageshow', event => { if (event.persisted) restore(); });
    projectLinks.forEach(link => link.addEventListener('click', () => {
      sessionStorage.setItem('zh-thread-progress', JSON.stringify({ progress }));
      history.replaceState(null, '', '#projects');
    }));
  }
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;
    const hash = anchor.getAttribute('href');
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    history.pushState(null, '', hash);
    if (story && ['#projects','#personal','#car-insurance-service','#compliance-agent'].includes(hash)) goTo(1);
    else {
      const header = document.querySelector('.site-header').offsetHeight;
      scrollTo({ top: scrollY + target.getBoundingClientRect().top - header - 18, behavior: motion.matches ? 'instant' : 'smooth' });
    }
  });
  addEventListener('hashchange', () => {
    if (story && ['#projects','#personal'].includes(location.hash)) goTo(1, 'instant');
  });
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
