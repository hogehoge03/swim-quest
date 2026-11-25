/* はなふだ こいこい — ゲームエンジン（DOM非依存） */
(function (root) {
  'use strict';

  // ---------- 札データ ----------
  const MONTHS = [
    null,
    { m: 1, flower: '松', label: '1月' },
    { m: 2, flower: '梅', label: '2月' },
    { m: 3, flower: '桜', label: '3月' },
    { m: 4, flower: '藤', label: '4月' },
    { m: 5, flower: '菖蒲', label: '5月' },
    { m: 6, flower: '牡丹', label: '6月' },
    { m: 7, flower: '萩', label: '7月' },
    { m: 8, flower: '芒', label: '8月' },
    { m: 9, flower: '菊', label: '9月' },
    { m: 10, flower: '紅葉', label: '10月' },
    { m: 11, flower: '柳', label: '11月' },
    { m: 12, flower: '桐', label: '12月' },
  ];

  // [type, name, tag]
  const DEFS = {
    1: [['hikari', '松に鶴', 'tsuru'], ['tan', '松に赤短', 'akatan'], ['kasu', '松のカス'], ['kasu', '松のカス']],
    2: [['tane', '梅に鶯', 'uguisu'], ['tan', '梅に赤短', 'akatan'], ['kasu', '梅のカス'], ['kasu', '梅のカス']],
    3: [['hikari', '桜に幕', 'maku'], ['tan', '桜に赤短', 'akatan'], ['kasu', '桜のカス'], ['kasu', '桜のカス']],
    4: [['tane', '藤に不如帰', 'hototogisu'], ['tan', '藤に短冊', 'tan'], ['kasu', '藤のカス'], ['kasu', '藤のカス']],
    5: [['tane', '菖蒲に八橋', 'yatsuhashi'], ['tan', '菖蒲に短冊', 'tan'], ['kasu', '菖蒲のカス'], ['kasu', '菖蒲のカス']],
    6: [['tane', '牡丹に蝶', 'cho'], ['tan', '牡丹に青短', 'aotan'], ['kasu', '牡丹のカス'], ['kasu', '牡丹のカス']],
    7: [['tane', '萩に猪', 'inoshishi'], ['tan', '萩に短冊', 'tan'], ['kasu', '萩のカス'], ['kasu', '萩のカス']],
    8: [['hikari', '芒に月', 'tsuki'], ['tane', '芒に雁', 'kari'], ['kasu', '芒のカス'], ['kasu', '芒のカス']],
    9: [['tane', '菊に盃', 'sakazuki'], ['tan', '菊に青短', 'aotan'], ['kasu', '菊のカス'], ['kasu', '菊のカス']],
    10: [['tane', '紅葉に鹿', 'shika'], ['tan', '紅葉に青短', 'aotan'], ['kasu', '紅葉のカス'], ['kasu', '紅葉のカス']],
    11: [['hikari', '柳に小野道風', 'ame'], ['tane', '柳に燕', 'tsubame'], ['tan', '柳に短冊', 'tan'], ['kasu', '柳のカス']],
    12: [['hikari', '桐に鳳凰', 'hoo'], ['kasu', '桐のカス'], ['kasu', '桐のカス'], ['kasu', '桐のカス']],
  };

  const TYPE_LABEL = { hikari: '光', tane: 'タネ', tan: '短冊', kasu: 'カス' };

  function buildDeck() {
    const deck = [];
    for (let m = 1; m <= 12; m++) {
      DEFS[m].forEach((d, i) => {
        deck.push({ id: `m${m}-${i}`, month: m, idx: i, type: d[0], name: d[1], tag: d[2] || null });
      });
    }
    return deck;
  }
  const DECK = buildDeck();
  const CARD = {};
  DECK.forEach((c) => { CARD[c.id] = c; });
  const card = (id) => CARD[id];

  // ---------- 乱数 ----------
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- 役判定 ----------
  const YAKU_ORDER = ['goko', 'shiko', 'ameshiko', 'sanko', 'hanami', 'tsukimi', 'inoshikacho', 'akatan', 'aotan', 'tane', 'tanzaku', 'kasu'];
  const YAKU_NAME = {
    goko: '五光', shiko: '四光', ameshiko: '雨四光', sanko: '三光',
    hanami: '花見で一杯', tsukimi: '月見で一杯', inoshikacho: '猪鹿蝶',
    akatan: '赤短', aotan: '青短', tane: 'タネ', tanzaku: 'タン', kasu: 'カス',
  };

  /** 取り札（idの配列）から成立している役の一覧と合計点を返す */
  function computeYaku(ids) {
    const cs = ids.map(card);
    const has = (tag) => cs.some((c) => c.tag === tag);
    const count = (type) => cs.filter((c) => c.type === type).length;
    const list = [];
    const add = (key, points, detail) => list.push({ key, name: YAKU_NAME[key], points, detail: detail || '' });

    const lights = count('hikari');
    const rain = has('ame');
    if (lights === 5) add('goko', 10);
    else if (lights === 4 && !rain) add('shiko', 8);
    else if (lights === 4 && rain) add('ameshiko', 7);
    else if (lights === 3 && !rain) add('sanko', 5);

    if (has('maku') && has('sakazuki')) add('hanami', 5);
    if (has('tsuki') && has('sakazuki')) add('tsukimi', 5);
    if (has('inoshishi') && has('shika') && has('cho')) add('inoshikacho', 5);
    if (cs.filter((c) => c.tag === 'akatan').length === 3) add('akatan', 5);
    if (cs.filter((c) => c.tag === 'aotan').length === 3) add('aotan', 5);

    const tane = count('tane');
    if (tane >= 5) add('tane', tane - 4, `${tane}枚`);
    const tan = count('tan');
    if (tan >= 5) add('tanzaku', tan - 4, `${tan}枚`);
    const kasu = count('kasu');
    if (kasu >= 10) add('kasu', kasu - 9, `${kasu}枚`);

    const total = list.reduce((s, y) => s + y.points, 0);
    return { list, total };
  }

  /** あがり点（7点以上は2倍） */
  function finalScore(base) {
    const mult = base >= 7 ? 2 : 1;
    return { base, mult, points: base * mult };
  }

  // ---------- ゲーム状態 ----------
  function createGame(opts) {
    opts = opts || {};
    const seed = opts.seed != null ? opts.seed : (Date.now() ^ Math.floor(Math.random() * 1e9));
    const state = {
      seed,
      rng: mulberry32(seed),
      totalRounds: opts.rounds || 12,
      round: 1,
      scores: [0, 0],
      dealer: opts.dealer != null ? opts.dealer : 0,
      history: [],
      // round state
      stock: [], field: [], hands: [[], []], captured: [[], []],
      turn: 0, phase: 'idle', drawn: null,
      koikoi: [0, 0], lastPoints: [0, 0],
      result: null,
      events: [],
    };
    return state;
  }

  function hasFourOnField(field) {
    const cnt = {};
    for (const id of field) {
      const m = card(id).month;
      cnt[m] = (cnt[m] || 0) + 1;
      if (cnt[m] === 4) return true;
    }
    return false;
  }

  function startRound(state, presetDeck) {
    let deck;
    let tries = 0;
    do {
      deck = presetDeck ? presetDeck.slice() : shuffle(DECK.map((c) => c.id), state.rng);
      tries++;
      if (presetDeck) break;
    } while (hasFourOnField(deck.slice(16, 24)) && tries < 100);
    const p = state.dealer;
    const o = 1 - p;
    state.hands = [[], []];
    state.hands[p] = deck.slice(0, 8);
    state.hands[o] = deck.slice(8, 16);
    state.field = deck.slice(16, 24);
    state.stock = deck.slice(24);
    state.captured = [[], []];
    state.turn = p;
    state.phase = 'play';
    state.drawn = null;
    state.koikoi = [0, 0];
    state.lastPoints = [0, 0];
    state.result = null;
    state.events = [{ type: 'deal', dealer: p }];
    return state;
  }

  function matchesFor(state, id) {
    const m = card(id).month;
    return state.field.filter((f) => card(f).month === m);
  }

  function removeFrom(arr, id) {
    const i = arr.indexOf(id);
    if (i < 0) throw new Error('card not found: ' + id);
    arr.splice(i, 1);
  }

  // 共通：札 id を場に当てる（hand/draw共通）
  function applyCard(state, player, id, targetId, source) {
    const ms = matchesFor(state, id);
    let taken = [];
    if (ms.length === 0) {
      state.field.push(id);
    } else if (ms.length === 1) {
      taken = [ms[0]];
    } else if (ms.length === 2) {
      if (!ms.includes(targetId)) return { ok: false, need: 'target', options: ms };
      taken = [targetId];
    } else {
      taken = ms.slice(); // 3枚
    }
    if (taken.length) {
      taken.forEach((t) => removeFrom(state.field, t));
      state.captured[player].push(id, ...taken);
    }
    const ev = { type: source, player, card: id, taken };
    state.events.push(ev);
    return { ok: true, event: ev };
  }

  function playFromHand(state, player, id, targetId) {
    if (state.phase !== 'play') return { ok: false, error: 'phase' };
    if (player !== state.turn) return { ok: false, error: 'turn' };
    if (!state.hands[player].includes(id)) return { ok: false, error: 'notInHand' };
    const ms = matchesFor(state, id);
    if (ms.length === 2 && !ms.includes(targetId)) return { ok: false, need: 'target', options: ms };
    removeFrom(state.hands[player], id);
    const r = applyCard(state, player, id, targetId, 'play');
    state.phase = 'draw';
    return r;
  }

  function revealDraw(state) {
    if (state.phase !== 'draw') return { ok: false, error: 'phase' };
    state.drawn = state.stock.shift();
    state.phase = 'drawn';
    return { ok: true, card: state.drawn, options: matchesFor(state, state.drawn) };
  }

  function drawOptions(state) {
    return state.drawn ? matchesFor(state, state.drawn) : [];
  }

  function resolveDraw(state, targetId) {
    if (state.phase !== 'drawn') return { ok: false, error: 'phase' };
    const p = state.turn;
    const r = applyCard(state, p, state.drawn, targetId, 'draw');
    if (!r.ok) return r;
    state.drawn = null;
    afterTurn(state);
    return r;
  }

  function afterTurn(state) {
    const p = state.turn;
    const y = computeYaku(state.captured[p]);
    if (y.total > state.lastPoints[p]) {
      state.lastPoints[p] = y.total;
      if (state.hands[p].length === 0) {
        state.events.push({ type: 'autoStop', player: p });
        finishRound(state, p);
      } else {
        state.phase = 'koikoi';
      }
      return;
    }
    nextTurn(state);
  }

  function nextTurn(state) {
    if (state.hands[0].length === 0 && state.hands[1].length === 0) {
      finishRound(state, null);
      return;
    }
    state.turn = 1 - state.turn;
    state.phase = 'play';
  }

  function declare(state, player, choice) {
    if (state.phase !== 'koikoi' || player !== state.turn) return { ok: false, error: 'phase' };
    if (choice === 'stop') {
      state.events.push({ type: 'stop', player });
      finishRound(state, player);
    } else {
      state.koikoi[player]++;
      state.events.push({ type: 'koikoi', player });
      nextTurn(state);
    }
    return { ok: true };
  }

  function finishRound(state, winner) {
    let res;
    if (winner == null) {
      res = { winner: null, yaku: [], base: 0, mult: 1, points: 0 };
    } else {
      const y = computeYaku(state.captured[winner]);
      const f = finalScore(y.total);
      res = { winner, yaku: y.list, base: f.base, mult: f.mult, points: f.points };
      state.scores[winner] += f.points;
      state.dealer = winner;
    }
    res.round = state.round;
    state.result = res;
    state.history.push(res);
    state.phase = 'roundOver';
  }

  function nextRound(state) {
    if (state.phase !== 'roundOver') return { ok: false, error: 'phase' };
    if (state.round >= state.totalRounds) {
      state.phase = 'gameOver';
      return { ok: true, gameOver: true };
    }
    state.round++;
    startRound(state);
    return { ok: true };
  }

  function totalCards(state) {
    return state.stock.length + state.field.length + state.hands[0].length + state.hands[1].length +
      state.captured[0].length + state.captured[1].length + (state.drawn ? 1 : 0);
  }

  const Engine = {
    MONTHS, DECK, TYPE_LABEL, YAKU_NAME, YAKU_ORDER,
    card, buildDeck, mulberry32, shuffle,
    computeYaku, finalScore,
    createGame, startRound, matchesFor, playFromHand, revealDraw, drawOptions, resolveDraw,
    declare, nextRound, totalCards, hasFourOnField,
  };

  if (typeof module === 'object' && module.exports) module.exports = Engine;
  else root.HFEngine = Engine;
})(typeof globalThis !== 'undefined' ? globalThis : this);
