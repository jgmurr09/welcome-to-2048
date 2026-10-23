(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const config = window.FutureLandingConfig || {};
  const {nodes, edges} = window.AtlasData;
  const byId = new Map(nodes.map(n => [n.id, n]));
  const people = nodes.filter(n => n.type === 'person');
  const screen = $('landingScreen'), chrome = $('hubHeader'), world = document.querySelector('.app-shell');
  const characters = $('characterScreen');
  const technology = $('technologyScreen');
  const dialog = $('hubDialog');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const arrivalCharacter = /^#\/people\/([^/]+)$/.exec(location.hash)?.[1];
  const arrivalTechnology = location.hash === '#/technology';
  const arrivalTheme = /^#\/themes\/([^/]+)(?:\/([^/]+))?$/.exec(location.hash);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  let arrived = false;
  let landingScroll = 0;
  let returnFocus = null;
  let lastCharacter = 'sophia';
  let technologyScroll = 0;
  let themeReturn = null;

  function returnAction() {
    $('hubReturn').textContent = themeReturn ? '← Back to themes' : '← Back to landing';
  }
  function returnToTheme() {
    const context = themeReturn;
    showLanding({focus: false});
    if (context) window.FutureThemes.open(context.themeId, context.groupId);
    else showLanding({push: true, restore: true});
  }

  // No network or storage is required, including when index.html is opened as a file.
  function imagePath(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    return /^(?:javascript|vbscript):/i.test(value) ? null : value;
  }
  function localImage(src, alt, position) {
    const path = imagePath(src);
    return path ? '<img src="' + esc(path) + '" alt="' + esc(alt) + '" loading="lazy"' + (position ? ' style="object-position:' + esc(position) + '"' : '') + '>' : '';
  }
  function recoverImages(root) {
    root.querySelectorAll('img').forEach(img => img.addEventListener('error', () => img.remove(), {once: true}));
  }
  function surface(el, visible) {
    el.hidden = !visible;
    el.toggleAttribute('inert', !visible);
    el.setAttribute('aria-hidden', String(!visible));
  }
  function hideTechnology() {
    if (!technology.hidden) technologyScroll = technology.scrollTop;
    surface(technology, false);
  }
  function navState(name) {
    chrome.querySelectorAll('[data-hub-nav]').forEach(button => {
      if (button.dataset.hubNav === name) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }
  function closeDialogs() {
    document.querySelectorAll('dialog[open]').forEach(el => el.close());
  }
  function showLanding(options = {}) {
    if (!arrived) return;
    themeReturn = null;
    returnAction();
    closeDialogs();
    hideTechnology();
    window.FutureCharacters?.pause();
    surface(characters, false);
    surface(world, false);
    surface(chrome, true);
    surface(screen, true);
    $('hubReturn').hidden = true;
    $('hubYear').hidden = false;
    document.querySelector('.skip').href = '#landingTitle';
    navState(options.section === 'peopleSection' ? 'people' : 'world');
    if (options.push) history.pushState({futureScreen: 'landing'}, '', location.pathname + location.search);
    if (options.section) {
      const section = $(options.section);
      screen.scrollTo({top: section.offsetTop - 35, behavior: reduced.matches ? 'auto' : 'smooth'});
      const heading = section.querySelector('h1,h2');
      heading?.focus({preventScroll: true});
    } else {
      screen.scrollTop = options.restore ? landingScroll : 0;
      if (options.focus !== false) (options.restore && returnFocus?.isConnected ? returnFocus : $('landingTitle')).focus({preventScroll: true});
    }
    $('announcement').textContent = 'Welcome to 2048. Explore the world, meet the people, or choose a theme.';
  }
  function openWorld(id = null, options = {}) {
    if (!arrived || (id && !byId.has(id))) return;
    if (byId.get(id)?.type === 'person') { openCharacter(id, options); return; }
    if (options.themeContext) themeReturn = options.themeContext;
    else if (!screen.hidden && !options.fromHistory) themeReturn = null;
    returnAction();
    if (!screen.hidden) {
      landingScroll = screen.scrollTop;
      returnFocus = document.activeElement;
    }
    closeDialogs();
    hideTechnology();
    window.FutureCharacters?.pause();
    surface(characters, false);
    surface(screen, false);
    surface(chrome, true);
    surface(world, true);
    $('hubReturn').hidden = false;
    $('hubYear').hidden = true;
    document.querySelector('.skip').href = '#graphViewport';
    navState('world');
    if (options.navigate !== false) {
      if (id) window.AtlasApp.navigate(id);
      else {
        const filter = options.filter || 'all';
        const button = document.querySelector('.filters button[data-filter="' + filter + '"]');
        if (button) button.click();
        else window.AtlasApp.navigate(null);
      }
    }
    window.AtlasApp.fit();
    if (themeReturn && options.navigate !== false) history.replaceState({...history.state, themeContext: themeReturn}, '', location.href);
    if (!id) $('graphViewport').focus({preventScroll: true});
  }
  function openCharacter(id, options = {}) {
    if (!arrived || byId.get(id)?.type !== 'person') return;
    if (options.themeContext) themeReturn = options.themeContext;
    else if (!screen.hidden && !options.fromHistory) themeReturn = null;
    returnAction();
    if (!screen.hidden) { landingScroll = screen.scrollTop; returnFocus = document.activeElement; }
    closeDialogs();
    hideTechnology();
    lastCharacter = id;
    surface(screen, false);
    surface(world, false);
    surface(chrome, true);
    surface(characters, true);
    $('hubReturn').hidden = false;
    $('hubYear').hidden = true;
    document.querySelector('.skip').href = '#characterTitle';
    navState('people');
    if (!options.fromHistory) history.pushState({futureScreen:'character',characterId:id,facetKey:options.facetKey || 'work',themeContext:themeReturn}, '', '#/people/' + encodeURIComponent(id));
    window.FutureCharacters.render(id, options);
  }
  function openTechnology(options = {}) {
    if (!arrived) return;
    themeReturn = null;
    returnAction();
    const alreadyOpen = !technology.hidden;
    if (!screen.hidden) { landingScroll = screen.scrollTop; returnFocus = document.activeElement; }
    closeDialogs();
    window.FutureCharacters?.pause();
    surface(screen, false);
    surface(world, false);
    surface(characters, false);
    surface(chrome, true);
    surface(technology, true);
    $('hubReturn').hidden = false;
    $('hubYear').hidden = true;
    document.querySelector('.skip').href = '#technologyTitle';
    navState('technology');
    if (!options.fromHistory && !alreadyOpen) history.pushState({futureScreen:'technology'}, '', '#/technology');
    technology.scrollTop = options.restore ? technologyScroll : 0;
    $('technologyTitle').focus({preventScroll:true});
    $('announcement').textContent = 'Explore the Technology. Five technologies from this world, followed by space for other teams.';
  }
  function showDialog(title, content) {
    $('hubDialogTitle').textContent = title;
    $('hubDialogContent').innerHTML = content;
    dialog.showModal();
  }
  function about() {
    showDialog('About the Event',
      '<p>Welcome to 2048 is an invitation to explore everyday life in a possible future.</p><p>Developed through the TANG Future World Sprint, this world connects people with the technologies, places, and systems shaping their lives. Start with a person. Follow a connection. See the same world from another perspective.</p>');
  }

  $('peopleGallery').innerHTML = people.map((person, index) =>
    '<button type="button" class="person-card" data-open-person="' + esc(person.id) + '" style="--card-accent:' + esc(person.color) + '" aria-label="Explore ' + esc(person.name) + '\'s connections">' +
    '<span class="portrait-slot">' +
    '<span class="portrait-placeholder" aria-hidden="true"><span class="placeholder-cross"></span></span>' +
    localImage(person.portrait, person.name, person.portraitPosition) + '</span>' +
    '<span class="person-info"><strong>' + esc(person.name) + '</strong><span class="person-arrow" aria-hidden="true">↗</span></span></button>'
  ).join('');
  recoverImages($('peopleGallery'));

  // A non-interactive preview of the real graph. The entire frame is one entry action.
  const previewNodes = nodes.filter(n => n.type !== 'facet');
  const positions = new Map(previewNodes.map(n => [n.id, {x: 65 + (n.x - 65) * 1.1, y: 50 + (n.y - 85) * .43}]));
  const stroke = n => n.color || ({system:'#b993e4', shared:'#da8ac0', tech:'#74b5d9'}[n.type]) || '#91b7ef';
  const lines = edges.filter(e => e.source === 'board' && positions.has(e.a) && positions.has(e.b)).map(e => {
    const a = positions.get(e.a), b = positions.get(e.b);
    return '<path d="M' + a.x + ',' + a.y + 'L' + b.x + ',' + b.y + '" stroke="' + (byId.get(e.a).type === 'shared' ? '#b26096' : '#6388ab') + '" stroke-opacity=".42" stroke-width="1"/>';
  }).join('');
  const cards = previewNodes.map(n => {
    const p = positions.get(n.id), label = esc(n.label || n.name), c = esc(stroke(n));
    if (n.type === 'person') return '<g transform="translate(' + p.x + ',' + p.y + ')"><circle r="21" fill="#232137" stroke="' + c + '" stroke-opacity=".8"/><text text-anchor="middle" y="5" fill="' + c + '" font-size="14">' + esc(n.initial) + '</text><text text-anchor="middle" y="39" fill="#c0b6d0" font-size="10">' + label + '</text></g>';
    return '<g transform="translate(' + p.x + ',' + p.y + ')"><rect x="-65" y="-15" width="130" height="30" rx="4" fill="#211c36" stroke="' + c + '" stroke-opacity=".4"/><text text-anchor="middle" y="3.5" fill="' + c + '" font-size="8">' + label + '</text></g>';
  }).join('');
  $('portalMap').innerHTML = '<svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,30)" font-family="Roboto, Arial, sans-serif">' + lines + cards + '</g></svg>';

  function setBackground(name) {
    const choice = name === 'research' ? 'research' : 'future';
    screen.dataset.background = choice;
    const path = imagePath(config.researchImage);
    if (path) screen.style.setProperty('--research-image', 'url("' + path.replace(/["\\\n\r]/g, '') + '")');
    document.querySelectorAll('[data-background-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.backgroundChoice === choice)));
  }
  setBackground(config.background);

  $('worldPortal').addEventListener('click', () => openWorld());
  $('hubBrand').addEventListener('click', () => showLanding({push: true}));
  $('hubReturn').addEventListener('click', () => themeReturn ? returnToTheme() : showLanding({push: true, restore: true}));
  chrome.addEventListener('click', event => {
    const button = event.target.closest('[data-hub-nav]');
    if (!button) return;
    const action = button.dataset.hubNav;
    themeReturn = null;
    if (action === 'world') openWorld();
    if (action === 'people') openCharacter(lastCharacter);
    if (action === 'technology') openTechnology();
    if (action === 'about') about();
  });
  screen.addEventListener('click', event => {
    const person = event.target.closest('[data-open-person]');
    if (person) openCharacter(person.dataset.openPerson);
    const scene = event.target.closest('[data-background-choice]');
    if (scene) setBackground(scene.dataset.backgroundChoice);
  });
  dialog.addEventListener('click', event => {
    const link = event.target.closest('[data-dialog-node]');
    if (link) openWorld(link.dataset.dialogNode);
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    }
  });
  $('hubDialogClose').addEventListener('click', () => dialog.close());
  $('hubReplay').addEventListener('click', () => $('replayIntro').click());
  window.addEventListener('popstate', event => {
    if (!arrived) return;
    const match = /^#\/people\/([^/]+)$/.exec(location.hash);
    const themeMatch = /^#\/themes\/([^/]+)(?:\/([^/]+))?$/.exec(location.hash);
    themeReturn = event.state?.themeContext || null;
    if (themeMatch) {
      showLanding({focus:false});
      window.FutureThemes.open(themeMatch[1], themeMatch[2], {history:false});
    }
    else if (event.state?.futureScreen === 'technology' || location.hash === '#/technology') openTechnology({fromHistory:true,restore:true});
    else if (event.state?.futureScreen === 'character' || match) openCharacter(event.state?.characterId || match?.[1], {fromHistory:true,facetKey:event.state?.facetKey});
    else if (event.state?.futureScreen === 'world' || /^#\//.test(location.hash)) openWorld(null, {navigate: false,fromHistory:true});
    else {
      window.FutureThemes.close({history:false,focus:false,scroll:false});
      showLanding({restore: true});
    }
  });
  let scrollTick = false;
  screen.addEventListener('scroll', () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      scrollTick = false;
      if (screen.hidden) return;
      navState(screen.scrollTop > $('themesSection').offsetTop - 150 ? null : screen.scrollTop > $('peopleSection').offsetTop - 150 ? 'people' : 'world');
    });
  }, {passive: true});

  window.FutureLanding = {
    arrive() {
      arrived = true;
      history.replaceState({futureScreen: 'landing'}, '', location.pathname + location.search);
      if (arrivalTechnology) openTechnology();
      else if (byId.get(arrivalCharacter)?.type === 'person') openCharacter(arrivalCharacter);
      else if (arrivalTheme) {
        showLanding({focus:false});
        window.FutureThemes.open(arrivalTheme[1], arrivalTheme[2], {history:false});
      }
      else showLanding();
    },
    hideForIntro() {
      arrived = false;
      closeDialogs();
      surface(screen, false);
      surface(chrome, false);
      surface(world, false);
      window.FutureCharacters?.pause();
      surface(characters, false);
      hideTechnology();
    },
    show: showLanding,
    openWorld,
    openCharacter,
    openTechnology,
    returnToTheme,
    themeContext: () => themeReturn,
    isReady: () => arrived
  };
})();
