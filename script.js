'use strict';

(() => {
  const P = window.PRINCESA;
  const A = window.Amor;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const make = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== '') element.textContent = text;
    return element;
  };
  const page = document.body.dataset.page;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const storagePrefix = 'princesa-universo:';
  const store = {
    get(key, fallback) { try { const raw = localStorage.getItem(storagePrefix + key); return raw === null ? fallback : JSON.parse(raw); } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(storagePrefix + key, JSON.stringify(value)); return true; } catch { return false; } }
  };
  let toastTimer;
  function toast(message) {
    const target = $('#toast');
    clearTimeout(toastTimer);
    target.textContent = message;
    target.hidden = false;
    toastTimer = setTimeout(() => { target.hidden = true; }, 4200);
  }
  function setText(element, text) { if (element && element.textContent !== String(text)) element.textContent = String(text); }
  const dateFormat = new Intl.DateTimeFormat('pt-BR', {day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo'});
  const shortDateFormat = new Intl.DateTimeFormat('pt-BR', {day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo'});
  const formatDate = (timestamp) => dateFormat.format(new Date(timestamp));
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = make('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  /* NAVEGAÇÃO: todos os links são relativos para funcionar no GitHub Pages. */
  document.documentElement.classList.add('js');
  const menuButton = $('#menu-toggle');
  const nav = $('#site-nav');
  const compact = window.matchMedia('(max-width: 900px)');
  function closeMenu() { nav.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); }
  function updateMenu() { menuButton.hidden = !compact.matches; closeMenu(); }
  updateMenu();
  if (compact.addEventListener) compact.addEventListener('change', updateMenu);
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) closeMenu();
    const settings = $('#site-settings');
    if (settings.open && !event.target.closest('#site-settings')) settings.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (nav.classList.contains('is-open')) { closeMenu(); menuButton.focus(); }
      $('#site-settings').open = false;
    }
  });
  let progressQueued = false;
  function updateReadingProgress() {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const progress = available > 0 ? Math.max(0, Math.min(100, window.scrollY / available * 100)) : 0;
    $('#reading-progress').style.width = `${progress}%`;
    progressQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!progressQueued) { progressQueued = true; requestAnimationFrame(updateReadingProgress); }
  }, {passive: true});
  window.addEventListener('resize', updateReadingProgress);
  updateReadingProgress();

  /* EFEITOS: preferência salva no próprio aparelho, respeitando movimento reduzido. */
  const effectSelect = $('#effect-select');
  let effect = store.get('effect', 'petals');
  if (!['petals', 'stars', 'off'].includes(effect)) effect = 'petals';
  function renderAmbient() {
    const layer = $('#ambient-layer');
    layer.replaceChildren();
    effectSelect.value = reduced.matches ? 'off' : effect;
    effectSelect.disabled = reduced.matches;
    let explanation = $('#motion-explanation');
    if (reduced.matches && !explanation) { explanation = make('p', '', 'O aparelho está configurado para reduzir movimentos. Os efeitos ficam pausados.'); explanation.id = 'motion-explanation'; effectSelect.after(explanation); }
    if (explanation) explanation.hidden = !reduced.matches;
    if (reduced.matches || effect === 'off') return;
    const fragment = document.createDocumentFragment();
    const count = effect === 'stars' ? 30 : 17;
    for (let index = 0; index < count; index += 1) {
      const particle = make('span', effect === 'stars' ? 'ambient-star' : 'ambient-petal');
      particle.style.setProperty('--left', `${Math.random() * 100}%`);
      particle.style.setProperty('--top', `${Math.random() * 100}%`);
      particle.style.setProperty('--duration', `${effect === 'stars' ? 3 + Math.random() * 5 : 23 + Math.random() * 17}s`);
      particle.style.setProperty('--delay', `${-Math.random() * 40}s`);
      particle.style.setProperty('--drift', `${Math.random() * 160 - 80}px`);
      particle.style.setProperty('--turn', `${180 + Math.random() * 480}deg`);
      const size = 0.65 + Math.random() * 0.55;
      particle.style.setProperty('--width', `${11 * size}px`);
      particle.style.setProperty('--height', `${19 * size}px`);
      fragment.append(particle);
    }
    layer.append(fragment);
  }
  effectSelect.addEventListener('change', () => { effect = effectSelect.value; store.set('effect', effect); renderAmbient(); });
  if (reduced.addEventListener) reduced.addEventListener('change', renderAmbient);
  renderAmbient();

  /* TRILHA ORIGINAL: notas sintetizadas, opcionais e sem nenhum arquivo externo. */
  let audioContext = null;
  let audioTimer = null;
  let notePosition = 0;
  let audioStarting = false;
  const soundButton = $('#sound-toggle');
  function stopSound(message = 'Som desligado. Você pode ligar de novo quando quiser.') {
    clearInterval(audioTimer);
    audioTimer = null;
    if (audioContext) { audioContext.close().catch(() => {}); audioContext = null; }
    soundButton.setAttribute('aria-pressed', 'false');
    soundButton.textContent = '☾ Ligar som suave';
    setText($('#audio-status'), message);
  }
  function playNote() {
    if (!audioContext || audioContext.state !== 'running') return;
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 392.00];
    const tone = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    tone.type = 'sine';
    tone.frequency.value = notes[notePosition++ % notes.length];
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.025, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.7);
    tone.connect(gain);
    gain.connect(audioContext.destination);
    tone.start(now);
    tone.stop(now + 3.9);
    tone.onended = () => { tone.disconnect(); gain.disconnect(); };
  }
  soundButton.addEventListener('click', async () => {
    if (audioStarting) return;
    if (audioContext) { stopSound(); return; }
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) { setText($('#audio-status'), 'Este navegador não oferece som sintetizado. Todos os outros carinhos continuam aqui.'); return; }
    audioStarting = true;
    soundButton.disabled = true;
    try {
      audioContext = new Audio();
      await audioContext.resume();
      if (document.hidden || !audioContext || audioContext.state !== 'running') { stopSound(); return; }
      soundButton.textContent = 'Ⅱ Desligar som suave';
      soundButton.setAttribute('aria-pressed', 'true');
      setText($('#audio-status'), 'Uma sequência suave de notas para acompanhar a leitura. Ela pausa ao sair desta página.');
      playNote();
      audioTimer = setInterval(playNote, 2800);
    } catch { stopSound('Não foi possível iniciar o som neste navegador. Tente novamente se quiser.'); }
    finally { audioStarting = false; soundButton.disabled = false; }
  });

  /* RELÓGIOS: o horário exato conhecido é o da conversa. Encontro usa só a data. */
  const clocks = $$('[data-clock]').map((clock) => Object.fromEntries($$('[data-unit]', clock).map((element) => [element.dataset.unit, element])));
  const monthly = () => A.nextMonthly(P.inicio);
  const yearly = A.addMonths(P.inicio, 12);
  const milestoneRecords = [
    {title:'2 meses de conversa',target:A.addMonths(P.inicio,2),tag:'Um próximo capítulo'},
    {title:'3 meses de conversa',target:A.addMonths(P.inicio,3),tag:'Mais um pedacinho'},
    {title:'100 dias do começo',target:new Date(P.inicio).getTime()+100*86400000,tag:'Um montão de dias'},
    {title:'6 meses de conversa',target:A.addMonths(P.inicio,6),tag:'Meio ano de história'},
    {title:'O dia da princesa',birthday:true,tag:'28 de julho'},
    {title:'1 ano de conversa',target:yearly,tag:'A nossa cápsula do tempo'}
  ];
  if ($('#milestone-grid')) {
    const fragment = document.createDocumentFragment();
    milestoneRecords.forEach((milestone) => {
      const card = make('article', 'milestone-card');
      card.append(make('span', '', milestone.tag), make('h3', '', milestone.title));
      const time = make('time');
      const countdown = make('strong');
      card.append(time, countdown);
      milestone.element = card; milestone.timeElement = time; milestone.counterElement = countdown;
      fragment.append(card);
    });
    $('#milestone-grid').replaceChildren(fragment);
  }
  function shortCountdown(target, now, complete = 'Um capítulo que a gente já alcançou. ♡') {
    const remaining = A.countdown(target, now);
    if (remaining.passed) return complete;
    return `${remaining.days}d ${A.pad(remaining.hours)}h ${A.pad(remaining.minutes)}min ${A.pad(remaining.seconds)}s`;
  }
  function updateTime() {
    const now = Date.now();
    const elapsed = A.elapsed(P.inicio, now);
    clocks.forEach((clock) => Object.entries(clock).forEach(([unit, element]) => {
      setText(element, A.pad(elapsed[unit]));
      element.dataset.long = String(String(elapsed[unit]).length > 2);
    }));
    $$('[data-stat="months"]').forEach((node) => setText(node, A.completeMonths(P.inicio, now)));
    $$('[data-stat="weeks"]').forEach((node) => setText(node, elapsed.weeks));
    $$('[data-stat="meeting-days"]').forEach((node) => setText(node, A.daysSinceDate(P.primeiroEncontro, now)));
    const next = A.nextMonthly(P.inicio, now);
    $$('[data-next-month-title]').forEach((node) => setText(node, `${next.number} ${next.number === 1 ? 'mês' : 'meses'} de conversa.`));
    $$('[data-next-month-date]').forEach((node) => setText(node, formatDate(next.timestamp)));
    const birthday = A.nextBirthday(P.aniversario.mes, P.aniversario.dia, now);
    const today = A.brazilParts(now);
    const birthdayToday = today.month + 1 === P.aniversario.mes && today.day === P.aniversario.dia;
    $$('[data-countdown]').forEach((node) => {
      const kind = node.dataset.countdown;
      const target = kind === 'monthly' ? next.timestamp : kind === 'birthday' ? birthday : yearly;
      setText(node, kind === 'birthday' && birthdayToday ? 'Hoje é o seu dia, minha princesa! ♡' : shortCountdown(target, now));
    });
    milestoneRecords.forEach((milestone) => {
      if (!milestone.element) return;
      const target = milestone.birthday ? birthday : milestone.target;
      setText(milestone.timeElement, shortDateFormat.format(new Date(target)));
      milestone.timeElement.dateTime = new Date(target).toISOString();
      const passed = target <= now && !milestone.birthday;
      milestone.element.classList.toggle('passed', passed);
      setText(milestone.counterElement, milestone.birthday && birthdayToday ? 'Hoje é o seu dia! ♡' : shortCountdown(target, now, 'Já é parte da nossa história. ♡'));
    });
  }
  updateTime();
  if (clocks.length || $$('[data-countdown], [data-stat]').length || $('#milestone-grid')) setInterval(() => { if (!document.hidden) updateTime(); }, 1000);

  /* ÁLBUM E VISUALIZADOR: a foto abre inteira, sem alterar o arquivo original. */
  const savedFavorites = store.get('favorites', []);
  const favoriteIds = new Set((Array.isArray(savedFavorites) ? savedFavorites : []).filter((id) => P.fotos.some((photo) => photo.id === id)));
  let albumFilter = 'all';
  function filteredPhotos() {
    if (page !== 'album') return P.fotos;
    return P.fotos.filter((photo) => albumFilter === 'all' || (albumFilter === 'favorites' ? favoriteIds.has(photo.id) : photo.categoria === albumFilter));
  }
  function photoFigure(photo, index, allowFavorite) {
    const figure = make('figure', 'memory'); figure.dataset.photoId = photo.id;
    const imageWrap = make('div', 'memory-image');
    const button = make('button', 'photo-open'); button.type = 'button'; button.dataset.photoOpen = photo.id; button.setAttribute('aria-label', `Ampliar: ${photo.legenda}`);
    const image = make('img'); image.src = photo.src; image.alt = photo.alt; image.width = photo.w; image.height = photo.h; image.loading = 'lazy'; image.decoding = 'async';
    const zoom = make('span', 'zoom-mark', '↗'); zoom.setAttribute('aria-hidden', 'true');
    button.append(image, zoom); imageWrap.append(button);
    if (allowFavorite) {
      const favorite = make('button', 'favorite-button', favoriteIds.has(photo.id) ? '♥' : '♡'); favorite.type = 'button'; favorite.dataset.favorite = photo.id;
      favorite.setAttribute('aria-pressed', String(favoriteIds.has(photo.id)));
      favorite.setAttribute('aria-label', `${favoriteIds.has(photo.id) ? 'Retirar' : 'Guardar'} ${photo.legenda} ${favoriteIds.has(photo.id) ? 'dos' : 'nos'} favoritos`);
      imageWrap.append(favorite);
    }
    const caption = make('figcaption'); caption.append(make('span', '', A.pad(index + 1)), document.createTextNode(photo.legenda));
    figure.append(imageWrap, caption);
    return figure;
  }
  function renderAlbum() {
    const target = $('#album-grid'); if (!target) return;
    const photos = filteredPhotos();
    target.replaceChildren(...photos.map((photo) => photoFigure(photo, P.fotos.indexOf(photo), true)));
    $('#album-empty').hidden = photos.length !== 0;
    setText($('#album-status'), `${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'} ${albumFilter === 'favorites' ? 'guardadas nos favoritos deste aparelho.' : 'da gente.'}`);
    $('#start-slideshow').disabled = photos.length === 0;
  }
  if (page === 'album') {
    renderAlbum();
    $('#album-filters').addEventListener('click', (event) => {
      const filter = event.target.closest('[data-album-filter]'); if (!filter) return;
      albumFilter = filter.dataset.albumFilter;
      $$('[data-album-filter]').forEach((button) => { const active = button === filter; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
      renderAlbum();
    });
  }
  const viewer = $('#photo-dialog');
  let viewerPhotos = P.fotos;
  let viewerIndex = 0;
  let viewerOpener = null;
  let slideshowTimer = null;
  function pauseSlideshow() {
    clearInterval(slideshowTimer); slideshowTimer = null;
    $('#viewer-play').setAttribute('aria-pressed', 'false');
    setText($('#viewer-play'), 'Iniciar apresentação');
  }
  function displayPhoto(index) {
    if (!viewerPhotos.length) return;
    viewerIndex = (index + viewerPhotos.length) % viewerPhotos.length;
    const photo = viewerPhotos[viewerIndex];
    $('#viewer-image').src = photo.src; $('#viewer-image').alt = photo.alt;
    setText($('#viewer-count'), `${viewerIndex + 1} / ${viewerPhotos.length}`);
    setText($('#viewer-caption'), photo.legenda);
  }
  function playSlideshow() {
    pauseSlideshow();
    if (viewerPhotos.length < 2) return;
    $('#viewer-play').setAttribute('aria-pressed', 'true');
    setText($('#viewer-play'), 'Pausar apresentação');
    slideshowTimer = setInterval(() => displayPhoto(viewerIndex + 1), 4500);
  }
  function openPhoto(id, opener, presentation = false) {
    viewerPhotos = filteredPhotos();
    const index = viewerPhotos.findIndex((photo) => photo.id === id);
    if (index < 0) return;
    if (typeof viewer.showModal !== 'function') { window.open(viewerPhotos[index].src, '_blank', 'noopener'); return; }
    viewerOpener = opener;
    pauseSlideshow(); displayPhoto(index);
    if (!viewer.open) viewer.showModal();
    document.body.classList.add('modal-open');
    $('#viewer-close').focus();
    if (presentation) playSlideshow();
  }
  document.addEventListener('click', (event) => {
    const favorite = event.target.closest('[data-favorite]');
    if (favorite) {
      const id = favorite.dataset.favorite;
      if (favoriteIds.has(id)) favoriteIds.delete(id); else favoriteIds.add(id);
      const saved = store.set('favorites', [...favoriteIds]);
      const wasActive = favoriteIds.has(id);
      if (albumFilter === 'favorites') { renderAlbum(); $('#album-filters [data-album-filter="favorites"]').focus(); }
      else {
        favorite.textContent = wasActive ? '♥' : '♡'; favorite.setAttribute('aria-pressed', String(wasActive));
        const photo = P.fotos.find((item) => item.id === id);
        favorite.setAttribute('aria-label', `${wasActive ? 'Retirar' : 'Guardar'} ${photo.legenda} ${wasActive ? 'dos' : 'nos'} favoritos`);
      }
      toast(saved ? wasActive ? 'Uma lembrança guardada nos favoritos. ♡' : 'A foto saiu dos favoritos.' : 'Marcada nesta aba. O navegador não permitiu salvar a preferência.');
      return;
    }
    const photo = event.target.closest('[data-photo-open]');
    if (photo) openPhoto(photo.dataset.photoOpen, photo);
  });
  if ($('#start-slideshow')) $('#start-slideshow').addEventListener('click', (event) => { const photos = filteredPhotos(); if (photos.length) openPhoto(photos[0].id, event.currentTarget, true); });
  $('#viewer-close').addEventListener('click', () => viewer.close());
  $('#viewer-prev').addEventListener('click', () => displayPhoto(viewerIndex - 1));
  $('#viewer-next').addEventListener('click', () => displayPhoto(viewerIndex + 1));
  $('#viewer-play').addEventListener('click', () => { if (slideshowTimer) pauseSlideshow(); else playSlideshow(); });
  viewer.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); displayPhoto(viewerIndex + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  viewer.addEventListener('click', (event) => {
    const bounds = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) viewer.close();
  });
  viewer.addEventListener('close', () => { pauseSlideshow(); document.body.classList.remove('modal-open'); if (viewerOpener && viewerOpener.isConnected) viewerOpener.focus(); });
  let touchStart = null;
  $('#viewer-image').addEventListener('pointerdown', (event) => { touchStart = {x:event.clientX,y:event.clientY}; });
  $('#viewer-image').addEventListener('pointerup', (event) => {
    if (!touchStart) return;
    const difference = event.clientX - touchStart.x;
    if (Math.abs(difference) > 55 && Math.abs(event.clientY - touchStart.y) < 75) displayPhoto(viewerIndex + (difference < 0 ? 1 : -1));
    touchStart = null;
  });
  $('#viewer-image').addEventListener('pointercancel', () => { touchStart = null; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pauseSlideshow(); if (audioContext) stopSound('O som pausou enquanto você saiu da página. Toque para ligar de novo.'); }
    else updateTime();
  });

  /* INÍCIO: os bilhetes mudam só quando você escolhe. */
  if (page === 'index') {
    let quoteIndex = 0;
    $('#home-quote').setAttribute('aria-live', 'polite');
    function changeQuote(direction) {
      quoteIndex = (quoteIndex + direction + P.frases.length) % P.frases.length;
      setText($('#home-quote'), P.frases[quoteIndex]);
      setText($('#quote-count'), `${A.pad(quoteIndex + 1)} / ${P.frases.length}`);
    }
    $('#quote-prev').addEventListener('click', () => changeQuote(-1));
    $('#quote-next').addEventListener('click', () => changeQuote(1));
    const envelope = $('#home-envelope');
    $('summary', envelope).addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) envelope.open = true;
    });
    envelope.addEventListener('toggle', updateReadingProgress);
  }

  /* HISTÓRIA: calendário interativo de setembro e outubro de 2026. */
  if (page === 'historia') {
    const timeline = $('#full-timeline');
    timeline.replaceChildren(...P.marcos.map((event) => {
      const item = make('li'); item.id = event.id;
      const dateWrap = make('div', 'timeline-date');
      const date = make('time', '', event.dia); date.dateTime = event.data; date.append(make('small', '', `${event.mes} · 2026`)); dateWrap.append(date);
      const article = make('article'); article.append(make('p', 'eyebrow', event.categoria), make('h3', '', event.titulo), make('p', '', event.texto), make('span', 'handwritten', event.detalhe));
      item.append(dateWrap, article); return item;
    }));
    let calendarMonth = 8;
    let selectedDate = P.marcos[0].data;
    const monthFormat = new Intl.DateTimeFormat('pt-BR', {month:'long',year:'numeric',timeZone:'America/Sao_Paulo'});
    function selectMemory(iso) {
      selectedDate = iso;
      const events = P.marcos.filter((event) => event.data === iso);
      const content = [];
      events.forEach((event) => content.push(make('span', 'eyebrow', formatDate(A.brazilTime(...iso.split('-').map((value, index) => Number(value) - (index === 1 ? 1 : 0))))), make('h3', '', event.titulo), make('p', '', event.texto)));
      $('#calendar-memory').replaceChildren(...content);
      $$('#calendar-grid [data-date]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.date === iso)));
    }
    function renderCalendar() {
      const title = monthFormat.format(new Date(A.brazilTime(2026, calendarMonth, 1)));
      setText($('#calendar-month'), title.charAt(0).toUpperCase() + title.slice(1));
      $('#calendar-prev').disabled = calendarMonth === 8;
      $('#calendar-next').disabled = calendarMonth === 9;
      const fragment = document.createDocumentFragment();
      ['D','S','T','Q','Q','S','S'].forEach((day, index) => {
        const heading = make('span', 'weekday', day); heading.title = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'][index]; fragment.append(heading);
      });
      A.calendar(2026,calendarMonth).forEach((cell) => {
        if (!cell) { const blank = make('span', 'calendar-blank'); blank.setAttribute('aria-hidden','true'); fragment.append(blank); return; }
        const events = P.marcos.filter((event) => event.data === cell.iso);
        const day = make(events.length ? 'button' : 'span', 'calendar-day', cell.day);
        if (events.length) {
          day.type = 'button'; day.dataset.date = cell.iso;
          day.setAttribute('aria-pressed', String(cell.iso === selectedDate));
          day.setAttribute('aria-label', `${cell.day} de ${title}: ${events.map((event) => event.titulo).join(' ')}`);
        }
        fragment.append(day);
      });
      $('#calendar-grid').replaceChildren(fragment);
      const first = P.marcos.find((event) => Number(event.data.slice(5,7)) === calendarMonth + 1);
      if (!selectedDate.startsWith(`2026-${A.pad(calendarMonth+1)}`)) selectedDate = first.data;
      selectMemory(selectedDate);
    }
    $('#calendar-prev').addEventListener('click', () => { calendarMonth = 8; renderCalendar(); });
    $('#calendar-next').addEventListener('click', () => { calendarMonth = 9; renderCalendar(); });
    $('#calendar-grid').addEventListener('click', (event) => { const button = event.target.closest('[data-date]'); if (button) selectMemory(button.dataset.date); });
    renderCalendar();
  }

  /* CARTAS: conteúdo centralizado em conteudo.js, texto ajustável e acesso por link. */
  if (page === 'cartas') {
    $('#letters-list').replaceChildren(...P.cartas.map((letter) => {
      const details = make('details','full-letter'); details.id = `carta-${letter.id}`; details.dataset.letter = '';
      const summary = make('summary'); summary.append(make('span','letter-number',letter.numero));
      const title = make('span'); title.append(make('small','',letter.etiqueta),make('strong','',letter.titulo),make('em','',letter.subtitulo));
      const plus = make('span','summary-plus','+'); plus.setAttribute('aria-hidden','true'); summary.append(title,plus);
      const paper = make('article','letter-paper');
      const top = make('div','paper-heading'); top.append(make('span','','♡'),make('span','','PARA A MINHA PRINCESA'),make('span','','✦'));
      paper.append(top,make('h3','','Minha princesa,'),...letter.paragrafos.map((paragraph)=>make('p','',paragraph)));
      const signature = make('p','letter-signature'); signature.append(document.createTextNode('Com amor,'),make('br'),make('em','',letter.assinatura)); paper.append(signature);
      details.append(summary,paper); details.addEventListener('toggle',updateReadingProgress); return details;
    }));
    let letterSize = Number(store.get('letterSize',18));
    if (!Number.isFinite(letterSize)) letterSize = 18;
    function updateLetterSize() {
      letterSize = Math.max(16,Math.min(24,letterSize));
      document.documentElement.style.setProperty('--letter-size',`${letterSize}px`);
      $('#font-smaller').disabled = letterSize <= 16; $('#font-larger').disabled = letterSize >= 24;
      store.set('letterSize',letterSize);
    }
    $('#font-smaller').addEventListener('click',()=>{letterSize-=1;updateLetterSize();});
    $('#font-larger').addEventListener('click',()=>{letterSize+=1;updateLetterSize();});
    updateLetterSize();
    function openLetter(id, focus = false) {
      const target = document.getElementById(id); if (!target || !target.matches('[data-letter]')) return;
      target.open = true;
      requestAnimationFrame(()=>{
        target.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});
        if (focus) $('summary',target).focus({preventScroll:true});
      });
    }
    $('#random-letter').addEventListener('click',()=>openLetter(`carta-${P.cartas[Math.floor(Math.random()*P.cartas.length)].id}`,true));
    const openHash = ()=>{ if(location.hash) openLetter(location.hash.slice(1)); };
    openHash(); window.addEventListener('hashchange',openHash);
  }

  /* MOTIVOS: busca, categorias e leitura em grupos de 12. */
  if (page === 'motivos') {
    let reasonFilter = 'all'; let visibleReasons = 12;
    const normalize = (text)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    function renderReasons() {
      const query = normalize($('#reason-search').value.trim());
      const matches = P.motivos.map((reason,index)=>({category:reason[0],text:reason[1],index})).filter((reason)=>(reasonFilter==='all'||reason.category===reasonFilter)&&normalize(reason.text).includes(query));
      const cards = matches.slice(0,visibleReasons).map((reason)=>{
        const card = make('article','reason-card'); card.append(make('small','',A.pad(reason.index+1)),make('p','',reason.text)); return card;
      });
      if (!matches.length) cards.push(make('p','empty-state','Não encontrei essa palavra. Tenta “sorriso”, “nós” ou “carinho”.'));
      $('#reasons-grid').replaceChildren(...cards);
      const visible = Math.min(visibleReasons,matches.length);
      setText($('#reason-status'),`${visible} de ${matches.length} bilhetinhos para você.`);
      $('#more-reasons').hidden = visibleReasons >= matches.length;
      updateReadingProgress();
    }
    $('#reason-search').addEventListener('input',()=>{visibleReasons=12;renderReasons();});
    $('#reason-filters').addEventListener('click',(event)=>{
      const filter=event.target.closest('[data-reason-filter]'); if(!filter)return;
      reasonFilter=filter.dataset.reasonFilter; visibleReasons=12;
      $$('[data-reason-filter]').forEach((button)=>{const active=button===filter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}); renderReasons();
    });
    $('#more-reasons').addEventListener('click',()=>{visibleReasons+=12;renderReasons();});
    let previousNote=-1;
    $('#draw-note').addEventListener('click',()=>{
      let index=Math.floor(Math.random()*P.motivos.length);
      if(index===previousNote)index=(index+1)%P.motivos.length;
      previousNote=index; setText($('#drawn-note'),P.motivos[index][1]);
    });
    renderReasons();
  }

  /* JOGOS: rodadas locais, sem login e sem dados enviados. */
  if (page === 'jogos') {
    let deck=[]; let selectedCards=[]; let matchedPairs=new Set(); let moves=0; let locked=false; let mismatchTimer=null;
    function resetMemory() {
      clearTimeout(mismatchTimer); mismatchTimer=null;
      deck=A.memoryDeck(P.fotos,6); selectedCards=[]; matchedPairs=new Set(); moves=0; locked=false;
      setText($('#memory-moves'),0); setText($('#memory-pairs'),0); setText($('#memory-status'),'Escolhe a primeira cartinha.');
      $('#memory-board').replaceChildren(...deck.map((card,index)=>{
        const button=make('button','memory-card'); button.type='button'; button.dataset.memoryIndex=index; button.setAttribute('aria-label',`Carta ${index+1}, fechada`);
        const image=make('img');image.src=card.photo.src;image.alt='';image.draggable=false;
        const cover=make('span','card-cover');cover.setAttribute('aria-hidden','true');cover.append(make('span','','♡'),make('small','','nós.'));
        button.append(image,cover);return button;
      }));
    }
    function updateMemoryCards() {
      $$('#memory-board [data-memory-index]').forEach((button,index)=>{
        const matched=matchedPairs.has(deck[index].pair); const open=matched||selectedCards.includes(index);
        button.classList.toggle('is-open',open);button.classList.toggle('is-matched',matched);button.disabled=matched;
        button.setAttribute('aria-label',`Carta ${index+1}, ${matched?'par encontrado':open?deck[index].photo.legenda:'fechada'}`);
      });
      setText($('#memory-moves'),moves);setText($('#memory-pairs'),matchedPairs.size);
    }
    $('#memory-board').addEventListener('click',(event)=>{
      const button=event.target.closest('[data-memory-index]');if(!button||locked)return;
      const index=Number(button.dataset.memoryIndex);
      if(selectedCards.includes(index)||matchedPairs.has(deck[index].pair))return;
      selectedCards.push(index);updateMemoryCards();
      if(selectedCards.length===1){setText($('#memory-status'),'Agora procura o par dessa foto.');return;}
      moves+=1;
      const [first,second]=selectedCards;
      if(deck[first].pair===deck[second].pair){
        matchedPairs.add(deck[first].pair);selectedCards=[];updateMemoryCards();
        setText($('#memory-status'),matchedPairs.size===6?`Todos os nossos pares encontrados em ${moves} tentativas. ♡`:'Mais um pedacinho da gente encontrado. ♡');
      }else{
        locked=true;updateMemoryCards();setText($('#memory-status'),'Essas duas são diferentes. Vamos tentar mais uma vez.');
        mismatchTimer=setTimeout(()=>{selectedCards=[];locked=false;mismatchTimer=null;updateMemoryCards();setText($('#memory-status'),'Escolhe a próxima cartinha.');},1100);
      }
    });
    $('#memory-reset').addEventListener('click',resetMemory);resetMemory();

    let quizIndex=0;let quizScore=0;let answered=false;
    const quizPanel=$('#quiz-panel');
    const quizTemplate=[...quizPanel.children];
    function renderQuiz() {
      answered=false;
      const question=P.quiz[quizIndex];
      setText($('#quiz-position'),`Pergunta ${quizIndex+1} de ${P.quiz.length}`);
      $('#quiz-progress-bar').style.width=`${quizIndex/P.quiz.length*100}%`;
      setText($('#quiz-question'),question.pergunta);setText($('#quiz-feedback'),'');$('#quiz-next').hidden=true;
      $('#quiz-options').replaceChildren(...question.opcoes.map((option,index)=>{
        const button=make('button','quiz-choice');button.type='button';button.dataset.answer=index;button.append(make('span','',String.fromCharCode(65+index)),document.createTextNode(option));return button;
      }));
    }
    function quizResult() {
      const result=make('div','quiz-result');result.append(make('p','eyebrow','CADA RESPOSTA É UM PEDACINHO DE NÓS'),make('strong','',`${quizScore} / ${P.quiz.length}`),make('h3','','A nossa história ficou guardada.'),make('p','','Você pode voltar para a linha do tempo e reviver cada detalhe. O carinho vale em todas as respostas.'));
      const restart=make('button','button button-light','Brincar de novo ↻');restart.type='button';restart.addEventListener('click',()=>{quizIndex=0;quizScore=0;quizPanel.replaceChildren(...quizTemplate);renderQuiz();$('#quiz-question').tabIndex=-1;$('#quiz-question').focus();});
      const historyLink=make('a','text-link','Rever a nossa história ↗');historyLink.href='historia.html';
      const actions=make('div','button-row justify-center');actions.append(restart,historyLink);result.append(actions);quizPanel.replaceChildren(result);
      result.tabIndex=-1;result.focus();
    }
    quizPanel.addEventListener('click',(event)=>{
      const choice=event.target.closest('[data-answer]');if(!choice||answered)return;
      answered=true;const question=P.quiz[quizIndex];const chosen=Number(choice.dataset.answer);const correct=chosen===question.resposta;if(correct)quizScore+=1;
      $$('.quiz-choice',quizPanel).forEach((button)=>{button.disabled=true;if(Number(button.dataset.answer)===question.resposta)button.classList.add('is-correct');else if(button===choice)button.classList.add('is-wrong');});
      setText($('#quiz-feedback'),`${correct?'Acertou, princesa! ♡ ':'Esse detalhe era assim: '}${question.carinho}`);
      $('#quiz-next').hidden=false;setText($('#quiz-next'),quizIndex===P.quiz.length-1?'Ver o nosso resultado ♡':'Próxima pergunta →');
      $('#quiz-progress-bar').style.width=`${(quizIndex+1)/P.quiz.length*100}%`;
    });
    $('#quiz-next').addEventListener('click',()=>{if(!answered)return;if(quizIndex===P.quiz.length-1)quizResult();else{quizIndex+=1;renderQuiz();$('#quiz-question').tabIndex=-1;$('#quiz-question').focus();}});renderQuiz();

    let order=[];
    function renderOrder(focusIndex=null,direction=null){
      $('#order-list').replaceChildren(...order.map((id,index)=>{
        const item=make('li');const event=P.marcos.find((entry)=>entry.id===id);item.append(make('span','order-rank',A.pad(index+1)),make('span','order-label',event.titulo));
        const controls=make('div','order-controls');
        [-1,1].forEach((move)=>{const button=make('button','icon-button',move<0?'↑':'↓');button.type='button';button.dataset.orderIndex=index;button.dataset.move=move;button.disabled=move<0?index===0:index===order.length-1;button.setAttribute('aria-label',`${move<0?'Subir':'Descer'}: ${event.titulo}`);controls.append(button);});item.append(controls);return item;
      }));
      if(focusIndex!==null){let target=$(`#order-list [data-order-index="${focusIndex}"][data-move="${direction}"]`);if(target&&target.disabled)target=$(`#order-list [data-order-index="${focusIndex}"][data-move="${-direction}"]`);if(target)target.focus();}
    }
    function resetOrder(){order=A.shuffle(P.marcos.map((event)=>event.id));if(A.correctOrder(order,P.marcos))order.reverse();renderOrder();setText($('#order-feedback'),'Cada data tem o seu capítulo. Encontre a sequência.');}
    $('#order-list').addEventListener('click',(event)=>{
      const button=event.target.closest('[data-order-index]');if(!button)return;const from=Number(button.dataset.orderIndex),move=Number(button.dataset.move),to=from+move;if(to<0||to>=order.length)return;
      [order[from],order[to]]=[order[to],order[from]];renderOrder(to,move);setText($('#order-feedback'),'Lembrança movida. Quando quiser, confira a sequência.');
    });
    $('#check-order').addEventListener('click',()=>setText($('#order-feedback'),A.correctOrder(order,P.marcos)?'Tudo no seu lugar. Uma conversa, dois “te amo”, um pedido, um encontro e um beijo. ♡':'Ainda tem uma lembrança fora de ordem. Dica: a conversa veio primeiro; o beijo veio depois do encontro.'));
    $('#reset-order').addEventListener('click',resetOrder);resetOrder();

    const secret='eu quero namorar com voce pra sempre amor';
    $('#binary-message').textContent=A.encodeBits(secret);
    $('#decode-message').addEventListener('click',()=>{
      setText($('#decoded-message'),A.decodeBits($('#binary-message').textContent));
      $('#decode-message').textContent='O recado era esse. ♡';$('#decode-message').disabled=true;
    });
  }

  /* FUTURO: checklist e rascunho salvos somente neste navegador. */
  if (page === 'futuro') {
    const stored=store.get('wishes',{});
    const saved=stored&&typeof stored==='object'&&!Array.isArray(stored)?stored:{};
    let custom=(Array.isArray(saved.custom)?saved.custom:[]).filter((item)=>item&&typeof item.id==='string'&&item.id.startsWith('custom-')&&typeof item.text==='string'&&item.text.trim()).slice(0,60).map((item)=>({id:item.id,text:item.text.slice(0,120)}));
    const completed=new Set((Array.isArray(saved.done)?saved.done:[]).filter((id)=>typeof id==='string'));
    const allPlans=()=>[...P.planos.map((text,index)=>({id:`base-${index}`,text})),...custom];
    function savePlans(){
      const saved=store.set('wishes',{done:[...completed],custom});
      if(!saved)toast('A lista funciona nesta aba, mas o navegador não permitiu salvar no aparelho.');
    }
    function updatePlanProgress(){
      const plans=allPlans();const done=plans.filter((plan)=>completed.has(plan.id)).length;
      setText($('#wishlist-progress-label'),`${done} de ${plans.length} planos vividos`);
      $('#wishlist-progress-bar').style.width=`${plans.length?done/plans.length*100:0}%`;
    }
    function renderPlans(){
      $('#wishlist').replaceChildren(...allPlans().map((plan)=>{
        const row=make('div','wish-item');row.classList.toggle('is-done',completed.has(plan.id));
        const label=make('label');const checkbox=make('input');checkbox.type='checkbox';checkbox.dataset.wishId=plan.id;checkbox.checked=completed.has(plan.id);
        label.append(checkbox,make('span','',plan.text));row.append(label);
        if(plan.id.startsWith('custom-')){const remove=make('button','wish-delete','×');remove.type='button';remove.dataset.removeWish=plan.id;remove.setAttribute('aria-label',`Excluir plano: ${plan.text}`);row.append(remove);}
        return row;
      }));updatePlanProgress();updateReadingProgress();
    }
    $('#wishlist').addEventListener('change',(event)=>{
      const checkbox=event.target.closest('[data-wish-id]');if(!checkbox)return;
      if(checkbox.checked)completed.add(checkbox.dataset.wishId);else completed.delete(checkbox.dataset.wishId);
      checkbox.closest('.wish-item').classList.toggle('is-done',checkbox.checked);savePlans();updatePlanProgress();
    });
    $('#wishlist').addEventListener('click',(event)=>{
      const remove=event.target.closest('[data-remove-wish]');if(!remove)return;
      custom=custom.filter((plan)=>plan.id!==remove.dataset.removeWish);completed.delete(remove.dataset.removeWish);savePlans();renderPlans();$('#plan-input').focus();
    });
    $('#plan-form').addEventListener('submit',(event)=>{
      event.preventDefault();const input=$('#plan-input');const text=input.value.trim().slice(0,120);if(!text)return;
      if(custom.length>=60){toast('Você já guardou 60 ideias extras. Pode excluir uma para abrir espaço para outra.');return;}
      custom.push({id:`custom-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,text});renderPlans();input.value='';input.focus();toast('Mais um plano guardado para o nosso depois. ♡');savePlans();
    });
    renderPlans();
    const futureNote=$('#future-note');const savedNote=store.get('futureNote','');futureNote.value=typeof savedNote==='string'?savedNote.slice(0,4000):'';
    if(futureNote.value)setText($('#note-status'),'O seu rascunho salvo está aqui.');
    futureNote.addEventListener('input',()=>{
      const saved=store.set('futureNote',futureNote.value.slice(0,4000));
      setText($('#note-status'),saved?'Rascunho guardado neste aparelho.':'O texto fica nesta aba. Baixe para guardar uma cópia.');
    });
    $('#future-note-form').addEventListener('submit',(event)=>event.preventDefault());
    $('#download-note').addEventListener('click',()=>{
      const text=futureNote.value.trim();if(!text){toast('Escreva um recadinho antes de baixar.');futureNote.focus();return;}
      download(new Blob([`PARA NÓS, DAQUI A UM TEMPO…\nGuardado em ${formatDate(Date.now())}\n\n${text}\n\nDo nosso universo. 💙\n`],{type:'text/plain;charset=utf-8'}),'recadinho-para-o-nosso-futuro.txt');
      toast('O seu recadinho está pronto para guardar. ♡');
    });
  }

  /* SURPRESAS: estrelas, uma flor, envelopes e um cartão desenhado pelo site. */
  if (page === 'surpresas') {
    $$('[data-star]').forEach((button,index)=>{const message=P.estrelas[index];if(message){$('small',button).textContent=message[0];button.setAttribute('aria-label',`Abrir estrela: ${message[0]}`);}});
    $('#constellation').addEventListener('click',(event)=>{
      const star=event.target.closest('[data-star]');if(!star)return;
      const index=Number(star.dataset.star);const message=P.estrelas[index];if(!message)return;
      $$('[data-star]').forEach((button)=>button.setAttribute('aria-pressed',String(button===star)));
      $('#star-note').replaceChildren(make('p','eyebrow',message[0]),make('p','',message[1]));
    });
    let petalsOpen=0;
    const flowerWords=['O seu sorriso.','Os seus olhinhos.','O seu cabelo.','O seu jeitinho.','As nossas bobeiras.','Os nossos abraços.','O nosso começo.','Você, por inteira. Minha princesa. ♡'];
    $('#grow-flower').addEventListener('click',()=>{
      if(petalsOpen===8){$$('.flower-petal').forEach((petal)=>petal.classList.remove('is-open'));petalsOpen=0;}
      $$('.flower-petal')[petalsOpen].classList.add('is-open');
      setText($('#flower-message'),flowerWords[petalsOpen]);petalsOpen+=1;
      setText($('#grow-flower'),petalsOpen===8?'Ver florescer de novo ❀':`Mais uma pétala (${petalsOpen}/8) ❀`);
    });
    $('#open-when-grid').replaceChildren(...P.envelopes.map((envelope)=>{
      const details=make('details','open-when');details.dataset.envelope=envelope.id;
      const summary=make('summary');const symbol=make('span','envelope-icon',envelope.icone);symbol.setAttribute('aria-hidden','true');
      summary.append(symbol,make('small','','ABRA QUANDO…'),make('strong','',envelope.titulo),make('em','',envelope.subtitulo),make('span','envelope-open-label','Abrir meu recado ↗'));
      const body=make('div');body.append(...envelope.texto.map((paragraph)=>make('p','',paragraph)));details.append(summary,body);return details;
    }));
    const savedEnvelopes=store.get('openedEnvelopes',[]);
    const opened=new Set((Array.isArray(savedEnvelopes)?savedEnvelopes:[]).filter((id)=>P.envelopes.some((envelope)=>envelope.id===id)));
    function updateEnvelopeStatus(){
      setText($('#envelope-status'),`${opened.size} de ${P.envelopes.length} envelopes já abertos neste navegador. Pode reler quantas vezes quiser.`);
    }
    $$('[data-envelope]').forEach((details)=>{
      if(opened.has(details.dataset.envelope))details.classList.add('was-read');
      details.addEventListener('toggle',()=>{
        if(details.open){opened.add(details.dataset.envelope);details.classList.add('was-read');store.set('openedEnvelopes',[...opened]);updateEnvelopeStatus();}
        updateReadingProgress();
      });
    });updateEnvelopeStatus();
    const cardMessages=['O seu sorriso é o meu lugar favorito.','Se for com você, eu fico.','Minha princesa, eu te amo muito.','Desde 14.09.2026, às 20:49.'];
    const cardInput=$('#card-message');const preset=$('#card-preset');
    const cardText=()=>cardInput.value.trim().slice(0,140)||'Um carinho para a minha princesa.';
    function updateCard(){setText($('#card-preview'),cardText());}
    preset.addEventListener('change',()=>{if(preset.value!=='custom')cardInput.value=cardMessages[Number(preset.value)];else cardInput.focus();updateCard();});
    cardInput.addEventListener('input',()=>{preset.value='custom';updateCard();});
    function wrapCanvasText(context,text,maxWidth){
      const lines=[];let line='';
      text.split(/\s+/).forEach((word)=>{
        if(context.measureText(word).width>maxWidth){
          if(line){lines.push(line);line='';}
          let part='';for(const char of word){if(context.measureText(part+char).width>maxWidth){lines.push(part);part=char;}else part+=char;}line=part;return;
        }
        const candidate=line?`${line} ${word}`:word;
        if(context.measureText(candidate).width>maxWidth&&line){lines.push(line);line=word;}else line=candidate;
      });if(line)lines.push(line);return lines;
    }
    $('#download-card').addEventListener('click',()=>{
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;
      const context=canvas.getContext('2d');if(!context){toast('Este navegador não conseguiu desenhar o bilhetinho. A prévia continua aqui para você.');return;}
      const gradient=context.createLinearGradient(0,0,1080,1350);gradient.addColorStop(0,'#2a517f');gradient.addColorStop(.5,'#132d50');gradient.addColorStop(1,'#081326');context.fillStyle=gradient;context.fillRect(0,0,1080,1350);
      context.strokeStyle='#8dadd277';context.lineWidth=2;context.strokeRect(46,46,988,1258);context.strokeStyle='#8dadd22a';context.strokeRect(62,62,956,1226);
      context.fillStyle='#9bbfea';[[160,180],[875,210],[940,850],[145,1040],[805,1110],[240,350]].forEach(([x,y],index)=>{context.beginPath();context.arc(x,y,index%2?3:4,0,Math.PI*2);context.fill();});
      context.textAlign='center';context.textBaseline='middle';context.fillStyle='#bdd8ff';context.font='92px Georgia';context.fillText('✦',540,240);
      context.font='22px Arial';context.fillStyle='#b5ccef';context.fillText('PARA A MINHA PRINCESA',540,365);
      let size=76;let lines=[];
      do{context.font=`italic ${size}px Georgia`;lines=wrapCanvasText(context,cardText(),790);if(lines.length<=7)break;size-=4;}while(size>=48);
      context.fillStyle='#f5f0e9';const lineHeight=size*1.38;const firstY=710-(lines.length-1)*lineHeight/2;
      lines.forEach((line,index)=>context.fillText(line,540,firstY+index*lineHeight));
      context.fillStyle='#aac6ed';context.font='25px Arial';context.fillText('14.09.2026 · 20:49',540,1150);context.font='48px Georgia';context.fillText('♡',540,1220);
      canvas.toBlob((blob)=>{if(blob){download(blob,'bilhetinho-para-minha-princesa.png');toast('Um pedacinho do nosso universo para levar com você. ♡');}else toast('Não consegui gerar a imagem agora. Tente novamente.');},'image/png');
    });
    let secretCount=0;
    const secrets=['Eu fiz oito capítulos. Mas, se pudesse, encontrava mais oito jeitos de dizer que eu gosto de você.','O detalhe mais bonito deste universo continua sendo a pessoa para quem ele foi feito.','Minha princesa, eu te amo muito. E sim: é você de novo. Sempre que eu penso no seu sorriso. ♡'];
    $('#secret-crown').addEventListener('click',()=>{setText($('#secret-message'),secrets[secretCount%secrets.length]);secretCount+=1;});
  }

  window.addEventListener('pagehide',()=>{pauseSlideshow();if(audioContext)stopSound();});
  window.addEventListener('load',updateReadingProgress,{once:true});
})();
