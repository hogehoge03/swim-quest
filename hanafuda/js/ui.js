/* はなふだ こいこい — 画面と進行 */
(function () {
  'use strict';
  const E = window.HFEngine;
  const AI = window.HFAI;
  const Art = window.HFArt;
  const $ = (id) => document.getElementById(id);
  const CPU_NAME = 'はなちゃん';
  const ME = 0;
  const CPU = 1;

  // ---------- 設定 ----------
  const settings = { rounds: 6, level: 'normal' };
  try {
    const saved = JSON.parse(localStorage.getItem('hf-settings') || '{}');
    if ([3, 6, 12].includes(saved.rounds)) settings.rounds = saved.rounds;
    if (['easy', 'normal'].includes(saved.level)) settings.level = saved.level;
  } catch (e) { /* ストレージが使えなくても遊べる */ }
  function saveSettings() {
    try { localStorage.setItem('hf-settings', JSON.stringify(settings)); } catch (e) { /* noop */ }
  }

  // ---------- 状態 ----------
  let G = null;            // engine state
  let run = 0;             // 進行のキャンセル用
  let busy = false;        // 演出中は操作不可
  let selected = null;     // 選択中の手札
  let waitingDrawPick = false;
  const speed = { fly: 300, pause: 380, cpuThink: 650, reveal: 550 };
  if (/[?&]fast\b/.test(location.search)) Object.keys(speed).forEach((k) => { speed[k] = 10; });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const cardEl = (id, cls) => {
    const d = document.createElement('div');
    d.className = 'card ' + (cls || '');
    d.dataset.id = id;
    d.innerHTML = Art.cardSVG(E.card(id));
    return d;
  };
  const backEl = (cls) => {
    const d = document.createElement('div');
    d.className = 'card back ' + (cls || '');
    d.innerHTML = Art.backSVG();
    return d;
  };
  const sortIds = (ids) => ids.slice().sort((a, b) => E.card(a).month - E.card(b).month || E.card(a).idx - E.card(b).idx);

  function avatarSVG(eyes) {
    const t = Object.assign({}, Art.THEME[3], { hair: '#f08bb0', dress: '#ffb3c9' });
    return `<svg viewBox="-18 -20 36 36" xmlns="http://www.w3.org/2000/svg"><rect x="-18" y="-20" width="36" height="36" fill="#fff0f6"/>${Art.girl(0, 0, 1, t, { eyes: eyes || 'open', noBody: false })}</svg>`;
  }

  // ---------- 描画 ----------
  function snapshot() {
    const m = {};
    document.querySelectorAll('#game [data-id]').forEach((el) => { m[el.dataset.id] = el.getBoundingClientRect(); });
    return m;
  }
  function flipFrom(before, dur) {
    const anims = [];
    document.querySelectorAll('#game [data-id]').forEach((el) => {
      const b = before[el.dataset.id];
      if (!b) return;
      const a = el.getBoundingClientRect();
      if (!a.width) return;
      const dx = b.left - a.left;
      const dy = b.top - a.top;
      const s = b.width / a.width;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(s - 1) < 0.01) return;
      el.style.zIndex = 40;
      const an = el.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${s})`, transformOrigin: '0 0' },
        { transform: 'translate(0,0) scale(1)', transformOrigin: '0 0' },
      ], { duration: dur || speed.fly, easing: 'cubic-bezier(.2,.8,.2,1)' });
      anims.push(an.finished.catch(() => {}).then(() => { el.style.zIndex = ''; }));
    });
    return Promise.all(anims);
  }
  function fly(html, from, to, dur) {
    const el = document.createElement('div');
    el.className = 'flying';
    el.innerHTML = html;
    Object.assign(el.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' });
    document.body.appendChild(el);
    const an = el.animate([
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})` },
    ], { duration: dur || speed.fly, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    return an.finished.catch(() => {}).then(() => el.remove());
  }

  let prevField = new Set();
  let prevDrawn = null;
  // 場の広さと枚数から、いちばん大きく並べられる札の幅を求める
  function fitField(f, count) {
    const W = f.clientWidth;
    const H = f.clientHeight;
    if (!W || !H) return;
    const n = Math.max(count, 8);
    const gap = 5;
    let best = 0;
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const w = Math.min((W - gap * (cols - 1)) / cols, (H - gap * (rows - 1)) / rows / 1.6);
      if (w > best) best = w;
    }
    best = Math.floor(Math.min(best, 76));
    f.style.setProperty('--fw', best + 'px');
    f.style.gap = gap + 'px';
  }
  function render() {
    if (!G) return;
    // CPU手札
    const ch = $('cpuHand');
    ch.innerHTML = '';
    G.hands[CPU].forEach(() => ch.appendChild(backEl()));

    // 場
    const f = $('field');
    f.innerHTML = '';
    const hl = new Set(highlightTargets());
    G.field.forEach((id) => {
      const el = cardEl(id, hl.has(id) ? 'match' : '');
      if (!prevField.has(id) && prevField.size) el.classList.add('pop');
      el.addEventListener('click', () => onFieldTap(id));
      f.appendChild(el);
    });
    prevField = new Set(G.field);
    fitField(f, G.field.length);

    $('stockCount').textContent = `のこり ${G.stock.length}`;
    $('deck').style.visibility = G.stock.length ? 'visible' : 'hidden';
    const ds = $('drawSlot');
    ds.innerHTML = '';
    if (G.drawn) ds.appendChild(cardEl(G.drawn, G.drawn !== prevDrawn ? 'pop' : ''));
    prevDrawn = G.drawn;

    // 手札
    const h = $('myHand');
    h.innerHTML = '';
    const myTurn = G.turn === ME && G.phase === 'play' && !busy;
    h.classList.toggle('off', !myTurn);
    sortIds(G.hands[ME]).forEach((id) => {
      const can = E.matchesFor(G, id).length > 0;
      const el = cardEl(id, (id === selected ? 'sel ' : '') + (myTurn && can ? 'can' : ''));
      el.addEventListener('click', () => onHandTap(id));
      h.appendChild(el);
    });

    renderCaptured($('cpuCap'), CPU);
    renderCaptured($('myCap'), ME);

    // 情報
    $('cpuScore').textContent = G.scores[CPU];
    $('myScore').textContent = G.scores[ME];
    $('cpuKoi').classList.toggle('on', G.koikoi[CPU] > 0 && G.phase !== 'roundOver');
    $('myKoi').classList.toggle('on', G.koikoi[ME] > 0 && G.phase !== 'roundOver');
    $('cpuOya').classList.toggle('on', G.dealerOfRound === CPU);
    $('myOya').classList.toggle('on', G.dealerOfRound === ME);
    $('roundLabel').textContent = `${G.round}月目/${G.totalRounds}`;
    const y = E.computeYaku(G.captured[ME]).total;
    $('myYaku').textContent = y ? `役 ${y}点` : '';
  }

  function renderCaptured(box, p) {
    box.innerHTML = '';
    const groups = { hikari: [], tane: [], tan: [], kasu: [] };
    sortIds(G.captured[p]).forEach((id) => groups[E.card(id).type].push(id));
    for (const type of ['hikari', 'tane', 'tan', 'kasu']) {
      const g = document.createElement('div');
      g.className = `cap-group ${type}` + (groups[type].length ? '' : ' empty');
      const lbl = document.createElement('span');
      lbl.className = 'lbl';
      lbl.textContent = E.TYPE_LABEL[type];
      if (!groups[type].length) {
        const ph = document.createElement('div');
        ph.className = 'ph';
        ph.appendChild(lbl);
        g.appendChild(ph);
      }
      const list = type === 'kasu' && groups[type].length > 8 ? groups[type].slice(-8) : groups[type];
      list.forEach((id) => g.appendChild(cardEl(id, 'mini')));
      if (groups[type].length >= 2) {
        const c = document.createElement('span');
        c.className = 'cnt';
        c.textContent = groups[type].length;
        g.appendChild(c);
      }
      box.appendChild(g);
    }
    const y = E.computeYaku(G.captured[p]);
    if (y.total) {
      const s = document.createElement('span');
      s.className = 'cap-yaku';
      s.textContent = `${y.total}点`;
      box.appendChild(s);
    }
  }

  function highlightTargets() {
    if (G.phase === 'drawn' && waitingDrawPick) return E.drawOptions(G);
    if (G.phase === 'play' && selected) return E.matchesFor(G, selected);
    return [];
  }

  function hint(text, cpu) {
    const h = $('hint');
    h.textContent = text || '';
    h.classList.toggle('cpu', !!cpu);
  }

  async function banner(html, cls, ms) {
    const b = $('banner');
    b.className = 'banner ' + (cls || '');
    b.innerHTML = html;
    void b.offsetWidth;
    b.classList.add('show');
    await sleep(ms || 1000);
    b.classList.remove('show');
    await sleep(150);
  }

  // ---------- モーダル ----------
  function openModal(html) {
    $('modal').innerHTML = html;
    $('modalBack').classList.add('show');
    $('modal').scrollTop = 0;
  }
  function closeModal() { $('modalBack').classList.remove('show'); }
  function modalChoice(html, buttons) {
    return new Promise((resolve) => {
      openModal(html + `<div class="btns">${buttons.map((b, i) => `<button class="btn ${b.cls || 'primary'}" data-i="${i}">${b.label}</button>`).join('')}</div>`);
      $('modal').querySelectorAll('.btns button').forEach((btn) => {
        btn.addEventListener('click', () => { closeModal(); resolve(buttons[+btn.dataset.i].value); }, { once: true });
      });
    });
  }
  const miniRow = (ids) => `<div class="card-row">${sortIds(ids).map((id) => `<div class="card">${Art.cardSVG(E.card(id))}</div>`).join('')}</div>`;
  const yakuListHTML = (list) => `<ul class="yaku-list">${list.map((y) => `<li><span>${y.name}${y.detail ? ` <small>(${y.detail})</small>` : ''}</span><span class="p">${y.points}点</span></li>`).join('')}</ul>`;

  // ---------- 進行 ----------
  function startGame() {
    run++;
    G = E.createGame({ rounds: settings.rounds, dealer: Math.random() < 0.5 ? ME : CPU });
    E.startRound(G);
    G.dealerOfRound = G.dealer;
    prevField = new Set();
    prevDrawn = null;
    selected = null;
    busy = true;          // 開始バナーの間はタップさせない
    waitingDrawPick = false;
    showScreen('game');
    $('cpuAvatar').innerHTML = avatarSVG();
    render();
    loop(run, true);
  }

  async function loop(myRun, newRound) {
    const alive = () => myRun === run;
    busy = true;
    if (newRound) {
      await sleep(200);
      if (!alive()) return;
      await banner(`${G.round}月目　${G.dealer === ME ? 'あなた' : CPU_NAME}が親`, '', 1100);
    }
    while (alive()) {
      render();
      if (G.phase === 'play') {
        if (G.turn === ME) { busy = false; hint('手札をえらんでね'); render(); return; } // タップ待ち
        hint(`${CPU_NAME}の番…`, true);
        await sleep(speed.cpuThink);
        if (!alive()) return;
        const mv = AI.chooseHandPlay(G, CPU, settings.level);
        await animatePlay(CPU, mv.cardId, mv.targetId);
      } else if (G.phase === 'draw') {
        await sleep(speed.pause * 0.6);
        if (!alive()) return;
        E.revealDraw(G);
        render();
        await sleep(speed.reveal);
        if (!alive()) return;
        const opts = E.drawOptions(G);
        if (opts.length === 2) {
          if (G.turn === ME) {
            waitingDrawPick = true;
            busy = false;
            hint('取る札をえらんでね');
            render();
            return; // タップ待ち
          }
          await animateDraw(AI.chooseDrawTarget(G, CPU, settings.level));
        } else {
          await animateDraw();
        }
      } else if (G.phase === 'koikoi') {
        if (G.turn === ME) {
          const choice = await askKoikoi();
          if (!alive()) return;
          E.declare(G, ME, choice);
          if (choice === 'koikoi') await banner('こいこい！', 'koi', 900);
        } else {
          await sleep(500);
          const choice = AI.decideKoikoi(G, CPU, settings.level);
          const y = E.computeYaku(G.captured[CPU]);
          await banner(`<div class="avatar">${avatarSVG(choice === 'koikoi' ? 'wink' : 'smile')}</div>${y.list.map((v) => v.name).join('・')}！`, '', 1100);
          E.declare(G, CPU, choice);
          await banner(choice === 'koikoi' ? `<div class="avatar">${avatarSVG('wink')}</div>こいこい！` : `<div class="avatar">${avatarSVG('smile')}</div>勝負！`, choice === 'koikoi' ? 'koi' : '', 1000);
        }
      } else if (G.phase === 'roundOver') {
        render();
        await showRoundResult();
        if (!alive()) return;
        E.nextRound(G);
        if (G.phase === 'gameOver') { await showGameOver(); return; }
        G.dealerOfRound = G.dealer;
        prevField = new Set();
        render();
        await sleep(100);
        await banner(`${G.round}月目　${G.dealer === ME ? 'あなた' : CPU_NAME}が親`, '', 1100);
      } else {
        return;
      }
    }
  }

  // 手札を出す演出つき
  async function animatePlay(p, id, targetId) {
    const r0 = run;
    busy = true;
    selected = null;
    render();
    const ms = E.matchesFor(G, id);
    const target = ms.length === 2 ? targetId : ms[0];
    let from;
    if (p === ME) {
      const el = document.querySelector(`#myHand [data-id="${id}"]`);
      from = el.getBoundingClientRect();
      el.style.visibility = 'hidden';
    } else {
      const backs = document.querySelectorAll('#cpuHand .card');
      const b = backs[backs.length - 1];
      from = b.getBoundingClientRect();
      b.style.visibility = 'hidden';
    }
    let landing = null;
    if (target) {
      const tEl = document.querySelector(`#field [data-id="${target}"]`);
      const r = tEl.getBoundingClientRect();
      landing = new DOMRect(r.left + r.width * 0.25, r.top + r.height * 0.15, r.width, r.height);
      await fly(Art.cardSVG(E.card(id)), from, landing);
      if (r0 !== run) return;
      ms.forEach((m) => { if (ms.length !== 2 || m === target) document.querySelector(`#field [data-id="${m}"]`)?.classList.add('hit'); });
      await sleep(speed.pause);
      if (r0 !== run) return;
    }
    const before = snapshot();
    before[id] = landing || from;
    E.playFromHand(G, p, id, targetId);
    render();
    await flipFrom(before);
    await sleep(speed.pause * 0.4);
  }

  async function animateDraw(targetId) {
    const r0 = run;
    busy = true;
    waitingDrawPick = false;
    const id = G.drawn;
    const ms = E.drawOptions(G);
    const target = ms.length === 2 ? targetId : ms[0];
    const slot = document.querySelector(`#drawSlot [data-id="${id}"]`);
    const from = slot.getBoundingClientRect();
    let landing = null;
    if (target) {
      const r = document.querySelector(`#field [data-id="${target}"]`).getBoundingClientRect();
      landing = new DOMRect(r.left + r.width * 0.25, r.top + r.height * 0.15, r.width, r.height);
      slot.style.visibility = 'hidden';
      await fly(Art.cardSVG(E.card(id)), from, landing);
      if (r0 !== run) return;
      ms.forEach((m) => { if (ms.length !== 2 || m === target) document.querySelector(`#field [data-id="${m}"]`)?.classList.add('hit'); });
      await sleep(speed.pause);
      if (r0 !== run) return;
    }
    const before = snapshot();
    before[id] = landing || from;
    E.resolveDraw(G, targetId);
    render();
    await flipFrom(before);
    await sleep(speed.pause * 0.4);
  }

  // ---------- 入力 ----------
  async function onHandTap(id) {
    if (busy || !G || G.phase !== 'play' || G.turn !== ME) return;
    const ms = E.matchesFor(G, id);
    if (selected !== id) {
      selected = id;
      hint(ms.length === 2 ? '取る札をタップ' : ms.length ? 'もう一度タップで取る' : 'もう一度タップで出す');
      render();
      return;
    }
    if (ms.length === 2) { hint('光る札から1枚えらんでね'); return; }
    await doPlay(id, undefined);
  }

  async function onFieldTap(fid) {
    if (busy || !G) return;
    if (G.phase === 'play' && G.turn === ME && selected) {
      const ms = E.matchesFor(G, selected);
      if (!ms.includes(fid)) return;
      await doPlay(selected, fid);
    } else if (G.phase === 'drawn' && waitingDrawPick && G.turn === ME) {
      if (!E.drawOptions(G).includes(fid)) return;
      const myRun = run;
      hint('');
      await animateDraw(fid);
      loop(myRun);
    }
  }

  async function doPlay(id, targetId) {
    const myRun = run;
    hint('');
    await animatePlay(ME, id, targetId);
    if (myRun === run) loop(myRun);
  }

  // ---------- ダイアログ ----------
  function askKoikoi() {
    const y = E.computeYaku(G.captured[ME]);
    const f = E.finalScore(y.total);
    const html = `<h2>役ができた！</h2>${yakuListHTML(y.list)}` +
      `<div class="total-line">いま <span class="big">${y.total}</span>点${f.mult > 1 ? `<span class="mult">7点以上で2倍 → ${f.points}点</span>` : ''}</div>` +
      `<p class="small">「こいこい」で続けると、もっと点が増えるかも。でも ${CPU_NAME} が先に役を作ると、あなたの点は0点に…！</p>`;
    return modalChoice(html, [
      { label: 'こいこい', value: 'koikoi', cls: 'blue' },
      { label: '勝負する', value: 'stop', cls: 'primary' },
    ]);
  }

  async function showRoundResult() {
    const r = G.result;
    let html;
    if (r.winner == null) {
      html = `<h2>流局</h2><p style="text-align:center">どちらも あがれなかったよ。<br>点数は動きません。</p>`;
    } else {
      const win = r.winner === ME;
      html = `<div class="face-big">${avatarSVG(win ? 'open' : 'smile')}</div>` +
        `<h2>${win ? 'あなたの あがり！' : CPU_NAME + 'の あがり'}</h2>` +
        yakuListHTML(r.yaku) +
        `<div class="total-line">${r.base}点${r.mult > 1 ? '<span class="mult">×2</span>' : ''} → <span class="big">${r.points}</span>点</div>` +
        miniRow(G.captured[r.winner]);
    }
    html += `<div class="score-board"><div>あなた<b>${G.scores[ME]}</b></div><div>${CPU_NAME}<b>${G.scores[CPU]}</b></div></div>`;
    const last = G.round >= G.totalRounds;
    await modalChoice(html, [{ label: last ? '結果を見る' : '次の月へ', value: 1 }]);
  }

  async function showGameOver() {
    const me = G.scores[ME];
    const cpu = G.scores[CPU];
    const title = me > cpu ? 'あなたの勝ち！' : me < cpu ? `${CPU_NAME}の勝ち` : '引き分け';
    const msg = me > cpu ? 'おめでとう！ とっても強いね！' : me < cpu ? 'つぎは負けないよ〜！' : 'いい勝負だったね！';
    const rows = G.history.map((h) => `<li><span>${h.round}月目</span><span>${h.winner == null ? '流局' : (h.winner === ME ? 'あなた' : CPU_NAME) + ' +' + h.points}</span></li>`).join('');
    const html = `<div class="face-big">${avatarSVG(me >= cpu ? 'smile' : 'wink')}</div><h2>${title}</h2><p style="text-align:center">${msg}</p>` +
      `<div class="score-board"><div>あなた<b>${me}</b></div><div>${CPU_NAME}<b>${cpu}</b></div></div>` +
      `<ul class="yaku-list">${rows}</ul>`;
    const v = await modalChoice(html, [{ label: 'タイトルへ', value: 'title', cls: 'ghost' }, { label: 'もう一回', value: 'again' }]);
    if (v === 'again') startGame(); else showScreen('title');
  }

  function howtoHTML() {
    const R = (ids) => `<div class="card-row">${ids.map((id) => `<div class="card">${Art.cardSVG(E.card(id))}</div>`).join('')}</div>`;
    const rows = [
      ['五光', '光を5枚', '10点', ['m1-0', 'm3-0', 'm8-0', 'm11-0', 'm12-0']],
      ['四光', '柳（雨）以外の光4枚', '8点', ['m1-0', 'm3-0', 'm8-0', 'm12-0']],
      ['雨四光', '柳（雨）を含む光4枚', '7点', ['m11-0', 'm1-0', 'm3-0', 'm8-0']],
      ['三光', '柳（雨）以外の光3枚', '5点', ['m1-0', 'm3-0', 'm12-0']],
      ['花見で一杯', '桜に幕＋菊に盃', '5点', ['m3-0', 'm9-0']],
      ['月見で一杯', '芒に月＋菊に盃', '5点', ['m8-0', 'm9-0']],
      ['猪鹿蝶', '萩に猪・紅葉に鹿・牡丹に蝶', '5点', ['m7-0', 'm10-0', 'm6-0']],
      ['赤短', '「あかよろし」の短冊3枚', '5点', ['m1-1', 'm2-1', 'm3-1']],
      ['青短', '青い短冊3枚', '5点', ['m6-1', 'm9-1', 'm10-1']],
      ['タネ', 'タネ札5枚（1枚ふえるごと+1）', '1点〜', ['m2-0', 'm4-0', 'm5-0', 'm8-1', 'm11-1']],
      ['タン', '短冊5枚（1枚ふえるごと+1）', '1点〜', ['m4-1', 'm5-1', 'm7-1', 'm11-2', 'm1-1']],
      ['カス', 'カス札10枚（1枚ふえるごと+1）', '1点〜', ['m1-2', 'm2-2', 'm3-2', 'm4-2', 'm5-2']],
    ];
    return `<h2>あそびかた</h2>` +
      `<p>① 手札を1枚出す。場に<b>同じ月（左上の数字）</b>の札があれば、2枚とも自分のものに。なければ場に置く。</p>` +
      `<p>② 山札を1枚めくって、同じように取る。</p>` +
      `<p>③ 役ができたら「<b>こいこい</b>」（続けてもっと点をねらう）か「<b>勝負</b>」（ここであがる）を選ぶ。こいこいした後に相手が先に役を作ると、相手のあがり！</p>` +
      `<p>④ <b>7点以上は2倍</b>。決めた月数を遊んで、合計点が多い方の勝ち。</p>` +
      `<p class="small">※場に同じ月が2枚あるときは、取る札をえらべます。3枚あるときは全部取れます。役は重ねて数えます。</p>` +
      `<h3>札のしゅるい</h3>` +
      `<table class="rule-table"><tr><td>光（金のふち）</td><td>${R(['m1-0', 'm3-0', 'm8-0', 'm11-0', 'm12-0'])}</td></tr>` +
      `<tr><td>タネ（動物など）</td><td>${R(['m2-0', 'm4-0', 'm5-0', 'm6-0', 'm7-0', 'm8-1', 'm9-0', 'm10-0', 'm11-1'])}</td></tr>` +
      `<tr><td>短冊</td><td>${R(['m1-1', 'm6-1', 'm4-1'])}</td></tr>` +
      `<tr><td>カス（花の妖精）</td><td>${R(['m1-2', 'm1-3', 'm12-3'])}</td></tr></table>` +
      `<h3>役いちらん</h3><table class="rule-table">` +
      rows.map((r) => `<tr><td><b>${r[0]}</b><br><span class="small">${r[1]}</span>${R(r[3])}</td><td class="pt">${r[2]}</td></tr>`).join('') +
      `</table>`;
  }

  function showHowto() {
    return modalChoice(howtoHTML(), [{ label: 'とじる', value: 1 }]);
  }

  function showCaptured(p) {
    if (!G) return;
    const y = E.computeYaku(G.captured[p]);
    const groups = ['hikari', 'tane', 'tan', 'kasu'].map((t) => {
      const ids = G.captured[p].filter((id) => E.card(id).type === t);
      return `<h3>${E.TYPE_LABEL[t]}（${ids.length}枚）</h3>${ids.length ? miniRow(ids) : '<div class="small">まだないよ</div>'}`;
    }).join('');
    const html = `<h2>${p === ME ? 'あなた' : CPU_NAME}の取り札</h2>` +
      (y.list.length ? yakuListHTML(y.list) : '<p style="text-align:center" class="small">役はまだありません</p>') +
      `<div class="cap-detail">${groups}</div>`;
    modalChoice(html, [{ label: 'とじる', value: 1 }]);
  }

  async function showMenu() {
    if (!G) return;
    const v = await modalChoice(`<h2>メニュー</h2>`, [
      { label: 'つづける', value: 'close', cls: 'primary' },
      { label: 'あそびかた', value: 'howto', cls: 'ghost' },
      { label: 'やめる', value: 'quit', cls: 'gray' },
    ]);
    if (v === 'howto') await showHowto();
    if (v === 'quit') {
      const ok = await modalChoice('<h2>ゲームをやめる？</h2><p style="text-align:center">いまの勝負は記録されません。</p>', [
        { label: 'もどる', value: false, cls: 'ghost' }, { label: 'やめる', value: true, cls: 'gray' }]);
      if (ok) { run++; busy = false; closeModal(); showScreen('title'); }
    }
  }

  // ---------- 画面切り替え・初期化 ----------
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === name));
  }

  function initTitle() {
    $('titleArt').innerHTML = ['m3-0', 'm8-0', 'm6-0'].map((id) => `<div class="card">${Art.cardSVG(E.card(id))}</div>`).join('');
    document.querySelectorAll('.seg').forEach((seg) => {
      const key = seg.dataset.key;
      const sync = () => seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', String(settings[key]) === b.dataset.v));
      seg.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        settings[key] = key === 'rounds' ? +b.dataset.v : b.dataset.v;
        saveSettings();
        sync();
      }));
      sync();
    });
    $('deck').innerHTML = Art.backSVG();
    window.addEventListener('resize', () => { if (G) fitField($('field'), G.field.length); });
    $('startBtn').addEventListener('click', startGame);
    $('howtoBtn').addEventListener('click', showHowto);
    $('menuBtn').addEventListener('click', showMenu);
    $('cpuCap').addEventListener('click', () => showCaptured(CPU));
    $('myCap').addEventListener('click', () => showCaptured(ME));
    $('mat').addEventListener('click', (e) => {
      // 取れる札がない札を選んでいるときは、場の空きをタップしても出せる
      if (e.target.closest('.card')) return;
      if (!busy && G && G.phase === 'play' && G.turn === ME && selected && E.matchesFor(G, selected).length === 0) doPlay(selected);
    });
  }

  initTitle();
  // テスト用フック
  window.__hf = { get state() { return G; }, get busy() { return busy; }, settings };
})();
