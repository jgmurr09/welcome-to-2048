(function () {
  'use strict';
  const video = document.getElementById('idleVideo');
  const resume = document.getElementById('resumeBackground');
  const root = document.getElementById('futureIntro');
  if (!video || !resume || !root) return;

  let wanted = false, blocked = false, pending = null, attempt = 0;
  let watchdog = 0, retryTimer = 0, reloads = 0;
  let lastPosition = 0, lastProgress = performance.now();
  const active = () => wanted && !document.hidden && !root.hidden;

  // Configure before the first scripted play request. Never unmute a
  // background video, enter fullscreen, or expose native media controls.
  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.controls = false;
  video.disablePictureInPicture = true;
  video.setAttribute('muted', '');
  video.setAttribute('autoplay', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  // Assign the source only after the inline/muted properties are in place.
  // This also avoids relying on the HTML parser's first autoplay attempt.
  if (video.dataset.src && !video.getAttribute('src')) {
    video.src = video.dataset.src;
    video.load();
  }

  function showResume(show) { resume.hidden = !show || !active(); }

  function play(gesture = false, force = false) {
    if (!active() || (blocked && !gesture)) return;
    // Media-ready events often arrive together. Keep a single automatic
    // request in flight; a real user click can supersede a blocked request.
    if (pending && !gesture) return;
    if (!force && !video.paused && !video.ended) return;
    const token = ++attempt;
    if (gesture) blocked = false;
    const failed = error => {
      if (token !== attempt) return;
      pending = null;
      if (!active()) return;
      blocked = error?.name === 'NotAllowedError';
      if (error?.name === 'AbortError') scheduleRetry();
      else showResume(true);
    };
    try {
      const result = video.play();
      if (result && typeof result.then === 'function') {
        pending = result;
        result.then(() => {
          if (!active()) { video.pause(); return; }
          if (token !== attempt) return;
          pending = null;
          blocked = false;
          lastProgress = performance.now();
          showResume(false);
        }, failed);
      } else showResume(false);
    } catch (error) { failed(error); }
  }

  function scheduleRetry() {
    if (!active() || blocked || retryTimer) return;
    retryTimer = window.setTimeout(() => {
      retryTimer = 0;
      play();
    }, 180);
  }

  function reload() {
    // Reload at most once per visit to the landing screen. Repeated loads or
    // seeks can interrupt an otherwise healthy play request in WebKit.
    if (!active() || reloads >= 1) { showResume(true); return; }
    reloads++;
    attempt++;
    pending = null;
    lastProgress = performance.now();
    video.load();
    play();
  }

  function watch() {
    if (!wanted) return;
    if (active()) {
      const now = performance.now(), position = Number(video.currentTime) || 0;
      if (Math.abs(position - lastPosition) > .02) {
        lastPosition = position;
        lastProgress = now;
      }
      if (video.ended) {
        try { video.currentTime = 0; } catch (_) {}
        lastProgress = now;
        play(false, true);
      } else if (!blocked && now - lastProgress > 8000) {
        reload();
      } else if (video.paused && !blocked) {
        play();
      }
    }
    watchdog = window.setTimeout(watch, 750);
  }

  function show(options = {}) {
    const returning = !wanted;
    wanted = true;
    blocked = false;
    lastPosition = Number(video.currentTime) || 0;
    lastProgress = performance.now();
    if (returning) reloads = 0;
    // Do not seek an initially loading clip. Only rewind on a real return
    // from the clock/map, after metadata exists.
    if (options.restart && returning && video.readyState >= 1) {
      try { video.currentTime = 0; } catch (_) {}
    }
    showResume(false);
    play();
    window.clearTimeout(watchdog);
    watchdog = window.setTimeout(watch, 750);
  }

  function hide() {
    wanted = false;
    attempt++;
    pending = null;
    window.clearTimeout(watchdog);
    window.clearTimeout(retryTimer);
    watchdog = retryTimer = 0;
    showResume(false);
    video.pause();
  }

  function userPlay() {
    if (!active()) return;
    // The call stays directly inside the click handler so a browser that
    // requires a gesture can authorize it. No timeout or await precedes it.
    if (video.error) {
      attempt++;
      pending = null;
      video.load();
    }
    play(true, true);
  }

  resume.addEventListener('click', event => { event.stopPropagation(); userPlay(); });
  root.addEventListener('click', userPlay);
  video.addEventListener('loadeddata', () => play());
  video.addEventListener('loadedmetadata', () => play());
  video.addEventListener('canplay', () => play());
  video.addEventListener('canplaythrough', () => play());
  video.addEventListener('pause', scheduleRetry);
  video.addEventListener('ended', () => {
    if (!active()) return;
    try { video.currentTime = 0; } catch (_) {}
    play(false, true);
  });
  video.addEventListener('timeupdate', () => {
    if (active() && Math.abs(video.currentTime - lastPosition) > .02) {
      lastPosition = video.currentTime;
      lastProgress = performance.now();
    }
  });
  video.addEventListener('playing', () => {
    if (!active()) { video.pause(); return; }
    blocked = false;
    lastProgress = performance.now();
    showResume(false);
  });
  video.addEventListener('error', () => { if (active()) showResume(true); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      attempt++;
      pending = null;
      video.pause();
    } else if (wanted) {
      blocked = false;
      lastProgress = performance.now();
      play();
    }
  });
  window.addEventListener('pageshow', () => {
    if (wanted) { blocked = false; lastProgress = performance.now(); play(); }
  });
  window.FutureIdlePlayer = {show, hide};
  show();
})();
