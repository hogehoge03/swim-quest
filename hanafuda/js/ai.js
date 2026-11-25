/* はなふだ こいこい — CPU思考（見えている情報だけで判断） */
(function (root) {
  'use strict';
  const E = (typeof module === 'object' && module.exports) ? require('./engine.js') : root.HFEngine;
  const card = E.card;

  const SETS = {
    akatan: ['m1-1', 'm2-1', 'm3-1'],
    aotan: ['m6-1', 'm9-1', 'm10-1'],
    inoshikacho: ['m7-0', 'm10-0', 'm6-0'],
    lights: ['m1-0', 'm3-0', 'm8-0', 'm11-0', 'm12-0'],
  };

  /** 「owner がこの札を取ったら」どれくらい嬉しいか（役への近さ込み） */
  function cardWorth(id, own, otherOwn) {
    const c = card(id);
    const ownSet = new Set(own);
    const otherSet = new Set(otherOwn);
    const cnt = (ids) => ids.filter((x) => ownSet.has(x)).length;
    const blocked = (ids) => ids.some((x) => otherSet.has(x));
    let v;
    switch (c.type) {
      case 'hikari': v = c.tag === 'ame' ? 6 : 9; break;
      case 'tane': v = 3; break;
      case 'tan': v = 2.5; break;
      default: v = 1;
    }
    // セット役への近さ
    for (const k of Object.keys(SETS)) {
      const ids = SETS[k];
      if (!ids.includes(id)) continue;
      if (k === 'lights') {
        const n = cnt(ids);
        v += n * 2.5;
      } else if (!blocked(ids)) {
        v += 1.5 + cnt(ids) * 3;
      }
    }
    // 盃と幕・月
    if (c.tag === 'sakazuki') {
      v += 3;
      if (ownSet.has('m3-0') || ownSet.has('m8-0')) v += 4;
    }
    if ((c.tag === 'maku' || c.tag === 'tsuki') && ownSet.has('m9-0')) v += 4;
    // 枚数役
    const nType = own.filter((x) => card(x).type === c.type).length;
    if (c.type === 'tane' && nType >= 3) v += 1 + (nType - 3);
    if (c.type === 'tan' && nType >= 3) v += 1 + (nType - 3);
    if (c.type === 'kasu' && nType >= 7) v += 0.6 + (nType - 7) * 0.3;
    return v;
  }

  function gainOf(state, p, ids) {
    const me = state.captured[p];
    const op = state.captured[1 - p];
    let v = 0;
    for (const id of ids) {
      v += cardWorth(id, me, op);       // 自分の得
      v += 0.6 * cardWorth(id, op, me);  // 相手に渡さない得
    }
    const before = E.computeYaku(me).total;
    const after = E.computeYaku(me.concat(ids)).total;
    v += (after - before) * 12;
    return v;
  }

  /** 見えていない札（相手の手札＋山札）のうち、その月の枚数 */
  function unseenOfMonth(state, p, month) {
    const seen = new Set([...state.hands[p], ...state.field, ...state.captured[0], ...state.captured[1]]);
    if (state.drawn) seen.add(state.drawn);
    return E.DECK.filter((c) => c.month === month && !seen.has(c.id)).length;
  }

  function discardPenalty(state, p, id) {
    const c = card(id);
    const unseen = unseenOfMonth(state, p, c.month);
    const oppHand = state.hands[1 - p].length;
    const unknown = oppHand + state.stock.length;
    const risk = unknown > 0 ? Math.min(1, unseen * (oppHand + 2) / unknown) : 0;
    let pen = risk * cardWorth(id, state.captured[1 - p], state.captured[p]) * 1.1;
    pen += cardWorth(id, state.captured[p], state.captured[1 - p]) * 0.35; // 自分が取りたい札は手元に
    // 同じ月をもう1枚持っていれば、後で回収できるので少し安心
    const pair = state.hands[p].some((h) => h !== id && card(h).month === c.month);
    if (pair) pen *= 0.6;
    return pen;
  }

  function bestTarget(state, p, id, options) {
    let best = options[0];
    let bv = -Infinity;
    for (const t of options) {
      const v = gainOf(state, p, [id, t]);
      if (v > bv) { bv = v; best = t; }
    }
    return { target: best, value: bv };
  }

  function chooseHandPlay(state, p, level) {
    const hand = state.hands[p];
    if (level === 'easy') {
      const capt = hand.filter((h) => E.matchesFor(state, h).length > 0);
      const pool = capt.length && state.rng() < 0.8 ? capt : hand;
      const id = pool[Math.floor(state.rng() * pool.length)];
      const ms = E.matchesFor(state, id);
      const target = ms.length === 2 ? ms[Math.floor(state.rng() * 2)] : undefined;
      return { cardId: id, targetId: target };
    }
    let best = null;
    for (const id of hand) {
      const ms = E.matchesFor(state, id);
      let value; let target;
      if (ms.length === 0) {
        value = -discardPenalty(state, p, id);
      } else if (ms.length === 2) {
        const b = bestTarget(state, p, id, ms);
        value = b.value; target = b.target;
        // 残った1枚を自分の手札で後で取れるなら少し加点
      } else {
        value = gainOf(state, p, [id, ...ms]);
      }
      value += state.rng() * 0.05; // 同点のときの揺らぎ
      if (!best || value > best.value) best = { cardId: id, targetId: target, value };
    }
    return { cardId: best.cardId, targetId: best.targetId };
  }

  function chooseDrawTarget(state, p, level) {
    const opts = E.drawOptions(state);
    if (level === 'easy') return opts[Math.floor(state.rng() * opts.length)];
    return bestTarget(state, p, state.drawn, opts).target;
  }

  /** 役まであと何枚か（見えている情報から、相手にもう取られた札は除外） */
  function distanceToYaku(own, other) {
    const ownSet = new Set(own);
    const otherSet = new Set(other);
    const n = (type) => own.filter((x) => card(x).type === type).length;
    let d = Infinity;
    const setDist = (ids, need) => {
      const avail = ids.filter((x) => !otherSet.has(x));
      if (avail.length < need) return Infinity;
      return Math.max(0, need - ids.filter((x) => ownSet.has(x)).length);
    };
    d = Math.min(d, setDist(SETS.akatan, 3), setDist(SETS.aotan, 3), setDist(SETS.inoshikacho, 3));
    d = Math.min(d, setDist(['m1-0', 'm3-0', 'm8-0', 'm12-0'], 3));
    if (!otherSet.has('m9-0')) {
      d = Math.min(d, setDist(['m3-0', 'm9-0'], 2), setDist(['m8-0', 'm9-0'], 2));
    }
    d = Math.min(d, Math.max(0, 5 - n('tane')), Math.max(0, 5 - n('tan')), Math.max(0, 10 - n('kasu')));
    return d;
  }

  function decideKoikoi(state, p, level) {
    const pts = E.computeYaku(state.captured[p]).total;
    const handLeft = state.hands[p].length;
    const oppHand = state.hands[1 - p].length;
    if (level === 'easy') {
      return (pts < 5 && handLeft >= 3 && state.rng() < 0.5) ? 'koikoi' : 'stop';
    }
    if (pts >= 7) return 'stop';
    if (handLeft <= 2 || oppHand <= 1) return 'stop';
    const oppDist = distanceToYaku(state.captured[1 - p], state.captured[p]);
    // 相手がすでにこいこいしている＝役持ち。少しでも増えたらあがられる
    if (state.koikoi[1 - p] > 0) return 'stop';
    if (oppDist <= 1) return 'stop';
    // 自分がもう少しで点が伸びそうか
    const myNext = distanceToNextGain(state.captured[p], state.captured[1 - p]);
    if (pts <= 4 && handLeft >= 4 && oppDist >= 3 && myNext <= 1) return 'koikoi';
    if (pts <= 2 && handLeft >= 5 && oppDist >= 2) return 'koikoi';
    return 'stop';
  }

  function distanceToNextGain(own, other) {
    const n = (type) => own.filter((x) => card(x).type === type).length;
    let d = distanceToYaku(own, other);
    if (n('tane') >= 5 || n('tan') >= 5 || n('kasu') >= 10) d = Math.min(d, 1);
    return d;
  }

  const AI = { chooseHandPlay, chooseDrawTarget, decideKoikoi, cardWorth, distanceToYaku, gainOf };
  if (typeof module === 'object' && module.exports) module.exports = AI;
  else root.HFAI = AI;
})(typeof globalThis !== 'undefined' ? globalThis : this);
