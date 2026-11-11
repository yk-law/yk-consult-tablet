/* 검토본 동작: 화면 전환, 선택, 캐러셀, 목차. 마크업은 index.html, 데이터는 data.js 에 있다. */
(function () {
  const DATA = window.BINDER3_DATA;
  const COMMON = '공통';
  const PREP_MS = 2200;
  const AUTO_MS = 5000;
  const PAUSE_MS = 8000;
  const SWIPE_PX = 36;
  const CAREER_PREVIEW = 10;
  const PARTY_ASK = {
    피의자: '수사를 받고 있거나 연락을 받았어요',
    피고인: '재판을 받고 있어요',
    피해자: '피해를 입었어요',
    원고: '상대방에게 청구하려고 해요',
    피고: '소장이나 청구를 받았어요',
  };
  const MENU = [['firm', '법무법인 YK 소개'], ['report', '사건 요약'], ['counsel', '상담 변호사'], ['seniors', '전문 인력']];
  const app = document.getElementById('app');

  const S = { caseId: null, step: 'picker', wrong: false, reportView: 'check', answers: {}, party: null, seniorOpen: null };
  let cleanups = [];

  /* ---------- 템플릿 ---------- */
  const lookup = (ctx, path) => path.split('.').reduce((v, key) => (v == null ? v : v[key]), ctx);
  const truthy = (v) => (Array.isArray(v) ? v.length > 0 : Boolean(v));
  const fill = (text, ctx) => text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const v = lookup(ctx, path);
    return v == null ? '' : String(v);
  });
  function bind(node, ctx) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.nodeValue.includes('{{')) child.nodeValue = fill(child.nodeValue, ctx);
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const each = child.getAttribute('data-each');
      if (each) {
        const [name, , path] = each.trim().split(/\s+/);
        child.removeAttribute('data-each');
        (lookup(ctx, path) || []).forEach((item) => {
          const copy = child.cloneNode(true);
          child.before(copy);
          const holder = document.createElement('div');
          bindOne(copy, { ...ctx, [name]: item }, holder);
        });
        child.remove();
        return;
      }
      bindOne(child, ctx);
    });
  }
  function bindOne(el, ctx) {
    const onlyIf = el.getAttribute('data-if');
    if (onlyIf && !truthy(lookup(ctx, onlyIf))) return el.remove();
    const unless = el.getAttribute('data-unless');
    if (unless && truthy(lookup(ctx, unless))) return el.remove();
    el.removeAttribute('data-if');
    el.removeAttribute('data-unless');
    const disabled = el.getAttribute('data-disabled');
    if (disabled) {
      el.disabled = truthy(lookup(ctx, disabled));
      el.removeAttribute('data-disabled');
    }
    const hidden = el.getAttribute('data-hidden');
    if (hidden) {
      el.hidden = truthy(lookup(ctx, hidden));
      el.removeAttribute('data-hidden');
    }
    [...el.attributes].forEach((attr) => {
      if (attr.value.includes('{{')) {
        const value = fill(attr.value, ctx).trim();
        if (value) el.setAttribute(attr.name, value);
        else el.removeAttribute(attr.name);
      }
    });
    bind(el, ctx);
    return undefined;
  }
  function render(id, ctx) {
    const fragment = document.getElementById(id).content.cloneNode(true);
    bind(fragment, ctx);
    return fragment;
  }

  /* ---------- 데이터 도우미 ---------- */
  const current = () => DATA.cases.find((c) => c.id === S.caseId);
  const imageUrl = (raw) => (!raw ? '' : /^https?:\/\//.test(raw) ? raw : `https://www.yklawfirm.co.kr/${raw.replace(/^\//, '')}`);
  const withPhoto = (p) => ({ ...p, photoUrl: imageUrl(p.photo), initial: (p.name || '').slice(0, 1) });
  const squash = (t) => t.replace(/\s+/g, ' ').trim();
  const briefCareer = (t) => squash(t.replace(/\s*\[[^\]]*\]/g, '').replace(/\s*\([^)]*\)/g, ''));
  const fieldsOf = (names, caseField) =>
    names.map((name) => ({ name, className: caseField && name.trim() === caseField ? 'case-related' : '' }));
  const fieldLabel = (middle, small) => {
    if (!small || small === middle || (middle && small === '기타')) return middle;
    return middle ? `${middle} > ${small}` : small;
  };
  const answered = (c) => c.questions.every((q) => S.answers[q]);
  const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  function applyParty(topic, party) {
    if (party === topic.base_role || !topic.roles || !hasOwn(topic.roles, party)) return topic;
    return { ...topic, ...topic.roles[party], cases: party === COMMON ? topic.cases : [] };
  }
  const partyChoices = (topic) =>
    !topic.base_role ? [] : [topic.base_role, ...Object.keys(topic.roles || {})].filter((p) => p !== COMMON);
  const initialParty = (topic) => (topic.roles && hasOwn(topic.roles, COMMON) ? COMMON : topic.base_role || '');
  function rewritten(c, role, step) {
    if (role !== c.rewriteRole) return null;
    const found = c.rewrites.find((item) => item.step === step);
    if (!found) return null;
    return found.questions.every((i) => S.answers[c.questions[i]] === 'yes') ? found.text : null;
  }

  /* ---------- 화면 ---------- */
  function draw() {
    cleanups.forEach((fn) => fn());
    cleanups = [];
    app.textContent = '';
    if (S.step === 'picker') {
      const cases = DATA.cases.map((c) => ({
        ...c,
        fieldLabel: fieldLabel(c.middle, c.small),
        counselName: DATA.people[c.counsel].name,
        partyLabel: c.party ? `지위 자동 선택: ${PARTY_ASK[c.party] || c.party}` : '지위 자동 선택 없음(고객이 고름)',
      }));
      app.append(render('tpl-picker', { cases, generatedAt: DATA.generatedAt }));
      return;
    }
    const c = current();
    const film = S.step === 'film';
    const journey = MENU.some(([id]) => id === S.step);
    const welcome = S.step === 'confirm' || S.step === 'prep';
    app.append(render('tpl-shell', {
      case: c,
      film,
      welcome,
      filmClass: film ? 'film-on' : '',
      headerClass: journey ? 'journey-header' : '',
      contentClass: journey ? 'has-journey' : '',
    }));
    const content = document.getElementById('b3-content');
    if (journey) {
      const view = document.createElement('div');
      view.className = 'b3-view';
      content.append(view);
      ({ firm: drawFirm, report: drawReport, counsel: drawCounsel, seniors: drawSeniors })[S.step](view, c);
      const ok = answered(c);
      const menu = MENU.map(([id, label]) => ({
        id,
        label,
        className: id === S.step ? 'on' : '',
        disabled: !ok && (id === 'counsel' || id === 'seniors'),
      }));
      content.append(render('tpl-journey', { case: c, menu }));
    } else if (S.step === 'confirm') {
      content.append(render('tpl-confirm', { case: c, wrong: S.wrong }));
    } else if (S.step === 'prep') {
      content.append(render('tpl-prep', {}));
      const timer = setTimeout(() => go('film'), PREP_MS);
      cleanups.push(() => clearTimeout(timer));
    } else if (film) {
      content.append(render('tpl-film', {}));
      const video = content.querySelector('video');
      video.addEventListener('ended', () => go('firm'));
    }
    const home = document.createElement('button');
    home.className = 'review-home';
    home.textContent = '사건 목록';
    home.setAttribute('data-action', 'home');
    app.append(home);
  }

  function drawFirm(view) {
    const firm = DATA.firm;
    const m = /^(\d{4})-(\d{2})$/.exec(firm.stats.asOf || '');
    const stats = [
      { label: '구성원 변호사·고문·위원', value: firm.stats.members.toLocaleString('ko-KR'), unit: '명' },
      { label: '전국 사무소', value: firm.stats.offices.toLocaleString('ko-KR'), unit: '곳' },
      { label: '분야별 전문 센터', value: firm.stats.centers.toLocaleString('ko-KR'), unit: '개' },
    ];
    const hasAdvisorsOrPolice = firm.advisors.length > 0 || firm.police.length > 0;
    view.append(render('tpl-firm', { firm, stats, hasAdvisorsOrPolice, asOf: m ? `(${m[1]}년 ${Number(m[2])}월 기준)` : '' }));
    [['firm-bench', '법원 경력 변호사', firm.bench], ['firm-prosecution', '검찰 경력 변호사', firm.prosecution]].forEach(([id, title, rows]) => {
      const host = document.getElementById(id);
      if (rows.length) host.replaceWith(render('tpl-firm-people', { title, rows: rows.map(withPhoto) }));
      else host.remove();
    });
  }

  function drawReport(view, c) {
    if (S.reportView === 'check' && c.questions.length) {
      const questions = c.questions.map((text, index) => {
        const a = S.answers[text];
        return {
          text,
          index,
          n: index + 1,
          yesClass: a === 'yes' ? 'on-yes' : '',
          noClass: a === 'no' ? 'on-no' : '',
          yesPressed: String(a === 'yes'),
          noPressed: String(a === 'no'),
        };
      });
      view.append(render('tpl-check', { questions, notAnswered: !answered(c) }));
      return;
    }
    const base = DATA.topics[c.topic];
    const choices = partyChoices(base);
    const saved = S.party && (S.party === COMMON || choices.includes(S.party)) ? S.party : null;
    const chosen = saved || (choices.includes(c.party) ? c.party : null);
    const role = chosen || initialParty(base);
    const topic = applyParty(base, role);
    const pad = (n) => String(n).padStart(2, '0');
    const different = c.questions.filter((q) => S.answers[q] === 'no').length;
    const ask = different ? [`앞에서 다르다고 하신 부분(${different}건)`, ...topic.ask] : topic.ask;
    const option = (party, label, skip) => ({
      party,
      label,
      pressed: String(chosen === party),
      className: [skip ? 'skip' : '', chosen === party ? 'on' : ''].filter(Boolean).join(' '),
    });
    const options = choices.length >= 2
      ? [...choices.map((p) => option(p, PARTY_ASK[p] || p, false)), option(COMMON, '잘 모르겠어요', true)]
      : [];
    const cases = topic.cases || [];
    const pairCount = (ask.length ? 1 : 0) + (topic.bring.length ? 1 : 0);
    view.append(render('tpl-report', {
      fieldLabel: fieldLabel(c.middle, c.small),
      options,
      steps: topic.steps.map(([title, text], i) => ({ n: pad(i + 1), title, text: rewritten(c, role, i) || text })),
      flow: topic.flow.map(([title, text], i) => ({ n: i + 1, title, text })),
      ask,
      bring: topic.bring,
      cases,
      casesClass: cases.length === 1 ? 'one' : '',
      pairClass: pairCount === 1 ? 'one' : '',
      previousLabel: c.questions.length ? '말씀하신 내용으로' : '법무법인 YK 소개로',
    }));
  }

  function mountProfile(host, person, c, specialist) {
    const p = withPhoto(person);
    const titles = (p.titles || []).map(squash).filter(Boolean);
    const careerClean = (p.career || []).map(squash).filter(Boolean);
    const quote = squash(p.greeting || '');
    const creds = new Set([...titles, ...careerClean]);
    const hero = specialist
      ? { greeting: quote && !creds.has(quote) ? quote : '', titles: [...creds].slice(0, 2) }
      : { greeting: p.greeting, titles: p.titles };
    const career = (p.career || []).map((text, i) => ({ text, extra: i >= CAREER_PREVIEW }));
    host.append(render('tpl-profile', {
      p,
      specialist,
      hero,
      ariaLabel: specialist ? '전문 인력 프로필' : '상담 변호사',
      introTitle: specialist ? '다양한 경험을 갖춘 전문 인력을 소개합니다.' : '고객님과 함께할 변호사를 소개합니다.',
      introName: specialist ? `${p.name} ${p.position}` : `${p.name} 변호사`,
      edu: [...(p.education || []), p.qualification].filter(Boolean).join(' · '),
      fields: fieldsOf(p.fields || [], c.field),
      career,
      moreCareer: Math.max(0, career.length - CAREER_PREVIEW),
      hasWork: truthy(p.fields) || truthy(p.performance) || truthy(p.works),
      hasHistory: truthy(p.career) || truthy(p.awards) || truthy(p.papers),
    }));
    const pane = host.querySelector('.b3-counsel');
    const card = pane.querySelector('.b3-counsel-card');
    const index = pane.querySelector('.b3-counsel-index');
    const heroEl = pane.querySelector('.b3-counsel-hero');
    const video = heroEl.querySelector('.b3-counsel-backdrop video');
    if (video) {
      const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const syncVideo = () => {
        if (motion.matches) video.pause();
        else video.play().catch(() => {});
      };
      syncVideo();
      motion.addEventListener('change', syncVideo);
      cleanups.push(() => motion.removeEventListener('change', syncVideo));
    }
    const observer = new IntersectionObserver(([entry]) => {
      const hidden = !entry.isIntersecting && entry.boundingClientRect.bottom <= (entry.rootBounds ? entry.rootBounds.top : 0);
      card.classList.toggle('is-visible', hidden);
      card.setAttribute('aria-hidden', String(!hidden));
    }, { root: pane, threshold: 0 });
    observer.observe(heroEl);
    const items = [...pane.querySelectorAll('.b3-detail-group > h3, .b3-detail-sub > h4')].map((el) => ({ el, group: el.tagName === 'H3' }));
    const buttons = new Map();
    items.forEach(({ el, group }) => {
      if (group) {
        const title = document.createElement('p');
        title.className = 'b3-index-group';
        title.textContent = el.textContent;
        index.append(title);
        return;
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'b3-index-section';
      button.textContent = el.textContent;
      button.addEventListener('click', () => {
        const top = pane.scrollTop + el.getBoundingClientRect().top - pane.getBoundingClientRect().top - 24;
        pane.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      });
      index.append(button);
      buttons.set(el, button);
    });
    const update = () => {
      const top = pane.getBoundingClientRect().top + 48;
      const subs = items.filter((i) => !i.group);
      let active = subs[0] && subs[0].el;
      items.forEach((item, i) => {
        if (item.el.getBoundingClientRect().top <= top) {
          const next = item.group ? items.slice(i + 1).find((n) => !n.group) : item;
          if (next) active = next.el;
        }
      });
      if (pane.scrollHeight > pane.clientHeight && pane.scrollTop >= pane.scrollHeight - pane.clientHeight - 2 && subs.length) {
        active = subs[subs.length - 1].el;
      }
      buttons.forEach((button, el) => {
        if (el === active) button.setAttribute('aria-current', 'location');
        else button.removeAttribute('aria-current');
      });
      pane.style.setProperty('--b3-counsel-scroll-height', `${pane.clientHeight}px`);
    };
    update();
    pane.addEventListener('scroll', update, { passive: true });
    cleanups.push(() => observer.disconnect());
  }

  function drawCounsel(view, c) {
    mountProfile(view, DATA.people[c.counsel], c, false);
  }

  const mod = (v, n) => (n ? ((v % n) + n) % n : 0);
  const reach = (count) => {
    const after = count > 1 ? 1 : 0;
    return { before: Math.max(0, Math.min(3, count - 1 - after)), after };
  };

  let senior = null;
  function drawSeniors(view, c) {
    const people = c.seniors.map((key) => withPhoto(DATA.people[key]));
    view.append(render('tpl-seniors', { count: people.length }));
    const list = view.querySelector('.b3-seniors');
    const track = list.querySelector('.b3-senior-track');
    const slot = list.querySelector('.b3-senior-focused-slot');
    const state = { people, position: 0, paused: false, restUntil: 0, swiped: false, cards: new Map(), start: null, list };
    senior = state;
    const count = people.length;
    const isCarousel = () => getComputedStyle(track).display === 'flex';
    const cardCtx = (p) => ({
      p,
      headline: (p.titles || [])[0],
      career: (p.career || []).map(briefCareer).filter(Boolean).slice(0, 2),
      fields: fieldsOf((p.fields || []).slice(0, 3), c.field),
    });
    const makeCard = (slotNo, person) => {
      const holder = document.createElement('div');
      holder.append(render('tpl-senior-card', cardCtx(person)));
      const card = holder.firstElementChild;
      card.addEventListener('click', () => {
        if (state.swiped) { state.swiped = false; return; }
        if (isCarousel() && slotNo !== state.position) {
          state.restUntil = Date.now() + PAUSE_MS;
          state.position = slotNo;
          update();
          return;
        }
        openSenior(mod(slotNo, count));
      });
      return card;
    };
    const update = () => {
      const carousel = isCarousel();
      if (!carousel) {
        if (state.cards.size !== count || !state.grid) {
          track.textContent = '';
          state.cards.clear();
          people.forEach((p, i) => {
            const card = makeCard(i, p);
            state.cards.set(i, card);
            track.append(card);
          });
          state.grid = true;
        }
      } else {
        if (state.grid) {
          track.textContent = '';
          state.cards.clear();
          state.grid = false;
        }
        const { before, after } = reach(count);
        const wanted = new Set();
        for (let i = 0; i < before + after + 3; i += 1) wanted.add(state.position - before - 1 + i);
        state.cards.forEach((card, s) => {
          if (!wanted.has(s)) { card.remove(); state.cards.delete(s); }
        });
        [...wanted].sort((a, b) => a - b).forEach((s) => {
          let card = state.cards.get(s);
          if (!card) {
            card = makeCard(s, people[mod(s, count)]);
            state.cards.set(s, card);
            track.append(card);
          }
          const d = s - state.position;
          const off = d < -before || d > after;
          const near = Math.max(0, 1 - Math.abs(d));
          const weight = near * near * (3 - 2 * near);
          card.style.setProperty('--b3-d', String(d));
          card.style.setProperty('--b3-scale', String(0.62 + 0.38 * weight));
          card.style.setProperty('--b3-opacity', off ? '0' : String(0.5 + 0.5 * weight));
          card.classList.toggle('is-focused', d === 0);
          if (off) { card.setAttribute('aria-hidden', 'true'); card.tabIndex = -1; }
          else { card.removeAttribute('aria-hidden'); card.removeAttribute('tabindex'); }
        });
      }
      const focused = people[mod(state.position, count)];
      slot.textContent = '';
      slot.append(render('tpl-senior-focused', { p: focused, headline: (focused.titles || [])[0] }));
    };
    state.update = update;
    state.move = (step) => { state.position += step; update(); };
    update();
    const resize = new ResizeObserver(update);
    resize.observe(track);
    const timer = setInterval(() => {
      if (state.paused || list.hidden || document.hidden || Date.now() < state.restUntil || !isCarousel()) return;
      state.move(1);
    }, AUTO_MS);
    track.addEventListener('pointerdown', (e) => {
      state.swiped = false;
      if (!isCarousel()) return;
      state.start = { x: e.clientX, y: e.clientY };
      state.restUntil = Date.now() + PAUSE_MS;
    });
    track.addEventListener('pointerup', (e) => {
      const start = state.start;
      state.start = null;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
        state.swiped = true;
        state.restUntil = Date.now() + PAUSE_MS;
        state.move(dx < 0 ? 1 : -1);
      }
    });
    cleanups.push(() => { clearInterval(timer); resize.disconnect(); senior = null; });
  }
  function openSenior(index) {
    const c = current();
    senior.list.hidden = true;
    const holder = document.createElement('div');
    holder.style.display = 'contents';
    holder.className = 'review-senior-detail';
    senior.list.after(holder);
    mountProfile(holder, senior.people[index], c, true);
  }

  /* ---------- 동작 ---------- */
  function go(step) {
    if (step === 'report') S.reportView = 'check';
    S.step = step;
    draw();
  }
  function keepScroll(selector, fn) {
    const before = app.querySelector(selector);
    const top = before ? before.scrollTop : 0;
    fn();
    const after = app.querySelector(selector);
    if (after) after.scrollTop = top;
  }
  const actions = {
    pick(id) {
      Object.assign(S, { caseId: id, step: 'confirm', wrong: false, reportView: 'check', answers: {}, party: null });
      draw();
    },
    home() { S.step = 'picker'; draw(); },
    go,
    'confirm-yes': () => go('prep'),
    'confirm-wrong': () => { S.wrong = true; draw(); },
    'confirm-back': () => { S.wrong = false; draw(); },
    'film-done': () => go('firm'),
    answer(arg) {
      const [index, value] = arg.split(':');
      S.answers[current().questions[Number(index)]] = value;
      keepScroll('.b3-case-check', draw);
    },
    'to-topics': () => { S.reportView = 'topics'; draw(); },
    'to-topics-direct': () => { S.reportView = 'topics'; S.step = 'report'; draw(); },
    'report-previous': () => {
      if (current().questions.length) { S.reportView = 'check'; draw(); } else go('firm');
    },
    party(party) { S.party = party; keepScroll('.b3-report', draw); },
    'career-toggle': (_arg, button) => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      const items = button.parentElement.querySelectorAll('.b3-clist li');
      items.forEach((li, i) => { li.hidden = !open && i >= CAREER_PREVIEW; });
      button.querySelector('span').textContent = open ? '경력 접기' : `경력 더 보기 (${items.length - CAREER_PREVIEW}개)`;
      button.querySelector('svg').style.transform = open ? 'rotate(180deg)' : '';
    },
    'open-case': (id) => {
      const body = DATA.caseBodies[id];
      if (!body) return;
      const root = app.querySelector('.yk-binder3');
      root.append(render('tpl-case-modal', { title: body.title || '업무 사례' }));
      root.querySelector('.b3-case-modal iframe').setAttribute('srcdoc', `<!doctype html><meta charset="utf-8">${body.html}`);
    },
    'close-case': () => { const m = app.querySelector('.b3-case-modal'); if (m) m.remove(); },
    'senior-move': (step) => { senior.restUntil = Date.now() + PAUSE_MS; senior.move(Number(step)); },
    'senior-pause': (_arg, button) => {
      senior.paused = !senior.paused;
      button.textContent = senior.paused ? '재생' : '일시정지';
      button.setAttribute('aria-label', senior.paused ? '자동 넘김 재생' : '자동 넘김 일시정지');
    },
    'senior-open-focused': () => openSenior(mod(senior.position, senior.people.length)),
    'senior-back': () => {
      const detail = app.querySelector('.review-senior-detail');
      if (detail) detail.remove();
      senior.list.hidden = false;
    },
  };
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target || target.disabled) return;
    const name = target.getAttribute('data-action');
    if (name === 'stop') return;
    actions[name](target.getAttribute('data-arg'), target);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') actions['close-case']();
  });

  draw();
})();
