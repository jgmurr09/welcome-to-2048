(function () {
  'use strict';

  const DAY = 86400000;
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Calendar arithmetic uses whole UTC days. The departure date is taken from
  // the visitor's local calendar first, so daylight saving cannot skip a day.
  function parseDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
    if (!match) return null;
    const [, year, month, day] = match.map(Number);
    if (year < 1000 || year > 9999) return null;
    const stamp = Date.UTC(year, month - 1, day);
    const d = new Date(stamp);
    return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day ? stamp : null;
  }

  function localToday(date = new Date()) {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function dateParts(stamp) {
    const d = new Date(stamp);
    return [MONTHS[d.getUTCMonth()], String(d.getUTCDate()).padStart(2, '0'), String(d.getUTCFullYear())];
  }

  function dateLabel(stamp) { return dateParts(stamp).join(' '); }
  function spokenDate(stamp) {
    return new Date(stamp).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'});
  }

  function makeTimeline(start, destination, duration) {
    if (start >= destination) return [{at: 0, stamp: destination, interval: 0, flipMs: 0}];
    // Keep each mechanical flip readable as the trip duration changes.
    const count = Math.min(20, Math.max(10, Math.floor(duration / 300)));
    const fastestInterval = Math.min(280, duration / count * .85);
    const weights = Array.from({length: count}, (_, i) => Math.pow(1 - i / (count - 1), 2));
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const extraTime = duration - fastestInterval * count;
    const startDay = Math.round(start / DAY), endDay = Math.round(destination / DAY);
    let elapsed = 0;
    return weights.map((weight, i) => {
      const at = elapsed;
      const interval = i === count - 1 ? duration - elapsed : fastestInterval + extraTime * weight / weightSum;
      elapsed += interval;
      // The first flip moves just one day. Later flips cover months and years.
      const progress = i / (count - 1);
      const day = startDay + 1 + Math.round((endDay - startDay - 1) * Math.pow(progress, 2.15));
      return {at, stamp: (i === count - 1 ? endDay : day) * DAY, interval, flipMs: Math.min(900, interval * .9)};
    });
  }

  // Also usable in a plain Node process for calendar and timing checks.
  if (typeof document === 'undefined') {
    if (typeof module !== 'undefined') module.exports = {parseDate, localToday, dateParts, dateLabel, makeTimeline};
    return;
  }

  const config = window.FutureIntroConfig || {};
  const target = parseDate(config.targetDate) ?? parseDate('2048-01-01');
  const duration = Math.min(12000, Math.max(3000, Number(config.durationMs) || 5500));
  const departureHold = Math.min(2500, Math.max(400, Number(config.departureHoldMs) || 1000));
  const arrivalHold = Math.min(2500, Math.max(400, Number(config.arrivalHoldMs) || 900));
  const $ = id => document.getElementById(id);
  const root = $('futureIntro'), shell = document.querySelector('.app-shell');
  const idle = $('introIdle'), stage = $('timeStage');
  const enter = $('enterFuture'), heading = $('clockHeading');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Set();
  let phase = 'idle', generation = 0, departure = localToday();

  class FlipTile {
    constructor(group, value) {
      this.el = document.createElement('span');
      this.el.className = 'clock-tile';
      this.el.innerHTML = '<span class="clock-current flap-letter"></span>' +
        '<span class="flap-half flap-lower flap-old-bottom"><span class="flap-letter"></span></span>' +
        '<span class="flap-half flap-upper flap-out"><span class="flap-letter"></span></span>' +
        '<span class="flap-half flap-lower flap-in"><span class="flap-letter"></span></span>';
      group.append(this.el);
      this.letters = [...this.el.querySelectorAll('.flap-letter')];
      this.timer = 0;
      this.write(value);
    }

    write(value) {
      this.value = value;
      this.el.setAttribute('data-value', value);
      this.letters.forEach(letter => { letter.textContent = value; });
    }

    stop() {
      window.clearTimeout(this.timer);
      this.timer = 0;
      this.el.classList.remove('is-flipping');
      this.write(this.value);
    }

    set(next, ms = 0) {
      if (next === this.value) return;
      const previous = this.value;
      this.stop();
      // The full, unanimated readout is always current. Temporary flaps only
      // cover it during the effect and are removed by an independent timer.
      this.write(next);
      if (!ms || reducedMotion.matches) return;
      this.letters[1].textContent = previous;
      this.letters[2].textContent = previous;
      this.letters[3].textContent = next;
      this.el.style.setProperty('--half-ms', (ms / 2) + 'ms');
      void this.el.offsetWidth;
      this.el.classList.add('is-flipping');
      this.timer = window.setTimeout(() => {
        this.timer = 0;
        this.el.classList.remove('is-flipping');
      }, ms + 12);
    }
  }

  const tiles = [];
  ['month', 'day', 'year'].forEach((kind, i) => {
    const group = document.createElement('div');
    group.className = 'clock-group clock-group-' + kind;
    [...dateParts(departure)[i]].forEach(letter => { tiles.push(new FlipTile(group, letter)); });
    $('clockFace').append(group);
  });
  for (let i = 0; i < 32; i++) {
    const ray = document.createElement('span');
    ray.className = 'time-streak';
    ray.style.setProperty('--ray-angle', (i * 360 / 32) + 'deg');
    $('timeStreaks').append(ray);
  }

  function showDate(stamp, ms = 0) {
    [...dateParts(stamp).join('')].forEach((letter, i) => tiles[i].set(letter, ms * (.94 + (i % 3) * .025)));
    $('clockDate').textContent = spokenDate(stamp);
  }
  function setPhase(next) { phase = next; root.dataset.phase = next; }
  function announce(text) { $('introStatus').textContent = text; }
  function later(fn, delay) {
    const token = generation;
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      if (token === generation) fn();
    }, delay);
    timers.add(timer);
  }
  function cancelJourney() {
    generation++;
    timers.forEach(timer => window.clearTimeout(timer));
    timers.clear();
    tiles.forEach(tile => tile.stop());
  }

  function arrive() {
    cancelJourney();
    showDate(target);
    setPhase('arrived');
    heading.textContent = 'You have arrived in ' + dateParts(target)[2] + '.';
    announce('You have arrived. ' + spokenDate(target) + '. Entering the world.');
    heading.focus({preventScroll: true});
    later(complete, arrivalHold);
  }

  function begin() {
    if (phase !== 'idle') return;
    cancelJourney();
    departure = localToday();
    showDate(departure);
    window.FutureIdlePlayer?.hide();
    idle.setAttribute('inert', '');
    idle.setAttribute('aria-hidden', 'true');
    stage.hidden = false;
    setPhase('departing');
    heading.textContent = 'Travelling from ' + spokenDate(departure) + ' to ' + spokenDate(target) + '.';
    heading.focus({preventScroll: true});
    announce(heading.textContent);
    if (departure >= target) { arrive(); return; }

    const frames = makeTimeline(departure, target, duration);
    // Each date is scheduled directly. Neither requestAnimationFrame nor
    // animation finish events are allowed to control calendar progression.
    frames.forEach(frame => {
      later(() => {
        setPhase('travelling');
        showDate(frame.stamp, frame.flipMs);
        const progress = Math.min(1, (frame.at + frame.interval) / duration);
        root.style.setProperty('--journey-progress', progress);
        root.style.setProperty('--grid-period', Math.round(1700 - progress * 900) + 'ms');
      }, departureHold + frame.at);
    });
    later(arrive, departureHold + duration);
  }

  function revealMap() {
    root.hidden = true;
    window.FutureIdlePlayer?.hide();
    document.body.classList.remove('intro-active');
    document.querySelector('.skip').removeAttribute('tabindex');
    if (window.FutureLanding) {
      window.FutureLanding.arrive();
      return;
    }
    shell.hidden = false;
    shell.removeAttribute('inert');
    shell.removeAttribute('aria-hidden');
    window.AtlasApp?.fit();
    const n = $('inspector').getAttribute('aria-hidden') === 'false' ? $('inspector').querySelector('h2') : null;
    const focus = n || $('graphViewport');
    if (n) n.setAttribute('tabindex', '-1');
    focus.focus({preventScroll: true});
    $('announcement').textContent = 'Welcome to 2048. Choose a person or connection to explore.';
  }

  function complete() {
    if (root.hidden || phase !== 'arrived') return;
    cancelJourney();
    if (reducedMotion.matches) revealMap();
    else { setPhase('exiting'); later(revealMap, 640); }
  }

  function reset() {
    cancelJourney();
    window.FutureLanding?.hideForIntro();
    root.hidden = false;
    shell.hidden = true;
    shell.setAttribute('inert', '');
    shell.setAttribute('aria-hidden', 'true');
    document.body.classList.add('intro-active');
    document.querySelector('.skip').setAttribute('tabindex', '-1');
    setPhase('idle');
    idle.removeAttribute('inert');
    idle.removeAttribute('aria-hidden');
    stage.hidden = true;
    departure = localToday();
    showDate(departure);
    root.style.setProperty('--journey-progress', 0);
    root.style.setProperty('--grid-period', '1700ms');
    heading.textContent = 'Travelling to ' + dateParts(target)[2] + '.';
    announce('');
    window.FutureIdlePlayer?.show({restart: true});
    enter.focus({preventScroll: true});
  }

  enter.addEventListener('click', begin);
  $('replayIntro').addEventListener('click', reset);
  document.querySelector('.skip').addEventListener('click', event => {
    if (!root.hidden) event.preventDefault();
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && phase !== 'idle') { event.preventDefault(); reset(); return; }
    if (event.key !== 'Tab') return;
    const resume = $('resumeBackground');
    const actions = phase === 'idle' ? (resume.hidden ? [enter] : [resume, enter]) : [];
    if (!actions.length) { event.preventDefault(); heading.focus({preventScroll: true}); return; }
    const first = actions[0], last = actions[actions.length - 1];
    if (!actions.includes(document.activeElement)) { event.preventDefault(); first.focus(); }
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) tiles.forEach(tile => tile.stop());
  });
  reset();
})();
