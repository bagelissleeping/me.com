(() => {
  document.documentElement.classList.add('js');
  const story = document.querySelector('.thread-story');

  if (story) {
    const stage = story.querySelector('[data-story-stage]');
    const scene = story.querySelector('[data-thread-scene]');
    const film = story.querySelector('[data-story-film]');
    const video = story.querySelector('[data-story-video]');
    const lead = story.querySelector('[data-thread-lead]');
    const spine = story.querySelector('[data-thread-spine]');
    const tip = story.querySelector('[data-thread-tip]');
    const frames = [...story.querySelectorAll('[data-frame]')];
    const steps = [...story.querySelectorAll('[data-process-step]')];
    const next = story.querySelector('[data-story-next]');
    const replay = story.querySelector('[data-story-replay]');
    const position = story.querySelector('[data-story-position]');
    const status = story.querySelector('[data-story-status]');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const clamp = value => Math.min(1, Math.max(0, value));
    const phase = (value, start, end) => clamp((value - start) / (end - start));
    const ease = value => value * value * (3 - 2 * value);
    const labels = ['向下滚动', '业务梳理', '产品设计', '调优评测'];
    const thresholds = [.463, .679, .894];
    const finalLead = 'M269 155 C390 155 390 245 210 245 H110 Q70 245 70 280';
    let raf = 0;
    let current = -1;
    let mediaReady = false;
    let mediaFailed = false;

    function setFrame(index) {
      if (current === index) return;
      current = index;
      frames.forEach((frame, i) => {
        frame.classList.toggle('is-current', i === index);
        frame.setAttribute('aria-hidden', String(i !== index));
      });
      next.firstChild.textContent = ['展开线团', '看产品设计', '看调优评测', '查看项目'][index];
      position.textContent = labels[index];
      status.textContent = frames[index].querySelector('h2').textContent;
    }

    function draw(path, amount) {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length * (1 - amount);
      path.style.opacity = amount > 0 ? 1 : 0;
    }

    function update() {
      raf = 0;
      if (reducedMotion.matches) return;
      const top = parseFloat(getComputedStyle(stage).top);
      const progress = clamp((top - story.getBoundingClientRect().top) / (story.offsetHeight - stage.offsetHeight));
      let ended = mediaFailed;
      if (mediaReady) {
        const endTime = video.duration - 1 / 24;
        const targetTime = Math.round(phase(progress, 0, .30) * endTime * 24) / 24;
        if (!video.seeking && Math.abs(video.currentTime - targetTime) > 1 / 48) video.currentTime = targetTime;
        ended = !video.seeking && Math.abs(video.currentTime - endTime) < 1 / 24;
      }
      const shrink = ended ? ease(phase(progress, .30, .43)) : 0;
      const scale = 1 - .6 * shrink;
      const y = 80 * (1 - shrink);
      film.style.transform = `translateY(${y / 800 * scene.clientWidth}px) scale(${scale})`;
      // The source video's final yarn loop sits at 84% x / 86% y.
      // This anchor shares the video's transform so the line stays attached.
      const anchorX = 800 * .84 * scale;
      const anchorY = y + 800 * 660 / 1174 * .86 * scale;
      lead.setAttribute('d', `M${anchorX} ${anchorY} C${anchorX + 121} ${anchorY} 390 245 210 245 H110 Q70 245 70 280`);
      const leadProgress = ended ? phase(progress, .32, .43) : 0;
      const spineProgress = ended ? phase(progress, .43, .96) : 0;
      draw(lead, leadProgress);
      draw(spine, spineProgress);
      tip.style.opacity = leadProgress > 0 ? 1 : 0;
      const point = spineProgress > 0
        ? spine.getPointAtLength(spine.getTotalLength() * spineProgress)
        : lead.getPointAtLength(lead.getTotalLength() * leadProgress);
      tip.setAttribute('cx', point.x);
      tip.setAttribute('cy', point.y);
      const index = ended ? thresholds.filter(value => progress >= value).length : 0;
      steps.forEach((step, i) => {
        const visible = ended && progress >= thresholds[i];
        step.classList.toggle('is-visible', visible);
        step.classList.toggle('is-current', i === index - 1);
        step.setAttribute('aria-hidden', String(!visible));
      });
      setFrame(index);
      if (index === 0) position.textContent = progress >= .30 && ended ? '拉出线头' : '向下滚动';
    }

    function schedule() {
      if (!raf) raf = requestAnimationFrame(update);
    }

    function configureMotion() {
      const animated = !reducedMotion.matches;
      document.documentElement.classList.toggle('story-enhanced', animated);
      video.pause();
      current = -1;
      if (animated) {
        if (video.preload !== 'auto') { video.preload = 'auto'; video.load(); }
        schedule();
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
        film.style.removeProperty('transform');
        lead.setAttribute('d', finalLead);
        draw(lead, 1);
        draw(spine, 1);
        tip.style.opacity = 0;
        [...frames, ...steps].forEach(item => item.removeAttribute('aria-hidden'));
      }
    }

    function goTo(progress) {
      const top = parseFloat(getComputedStyle(stage).top);
      scrollTo({ top: scrollY + story.getBoundingClientRect().top - top + progress * (story.offsetHeight - stage.offsetHeight), behavior: 'smooth' });
    }

    video.addEventListener('loadedmetadata', () => { mediaReady = true; schedule(); });
    video.addEventListener('seeked', schedule);
    video.addEventListener('error', () => {
      mediaFailed = true;
      mediaReady = false;
      film.classList.add('is-still');
      schedule();
    }, true);
    if (video.readyState >= 1) mediaReady = true;
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    reducedMotion.addEventListener('change', configureMotion);
    replay.addEventListener('click', () => goTo(0));
    next.addEventListener('click', () => {
      if (current === 3) document.querySelector('#projects').scrollIntoView({ behavior: 'smooth', block: 'start' });
      else goTo([.51, .73, .95][current]);
    });
    configureMotion();
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
