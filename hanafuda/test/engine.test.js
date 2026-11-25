const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../js/engine.js');

const ids = (...xs) => xs;
const kasu = (n, skip = []) => E.DECK.filter((c) => c.type === 'kasu' && !skip.includes(c.id)).slice(0, n).map((c) => c.id);
const ofType = (t, n) => E.DECK.filter((c) => c.type === t).slice(0, n).map((c) => c.id);
const yakuKeys = (list) => E.computeYaku(list).list.map((y) => y.key).sort();

test('札は48枚・各月4枚・光5/タネ9/短冊10/カス24', () => {
  assert.equal(E.DECK.length, 48);
  for (let m = 1; m <= 12; m++) assert.equal(E.DECK.filter((c) => c.month === m).length, 4, `month ${m}`);
  const cnt = (t) => E.DECK.filter((c) => c.type === t).length;
  assert.equal(cnt('hikari'), 5);
  assert.equal(cnt('tane'), 9);
  assert.equal(cnt('tan'), 10);
  assert.equal(cnt('kasu'), 24);
  assert.equal(new Set(E.DECK.map((c) => c.id)).size, 48);
  assert.equal(E.DECK.filter((c) => c.tag === 'akatan').length, 3);
  assert.equal(E.DECK.filter((c) => c.tag === 'aotan').length, 3);
});

test('光系の役', () => {
  const L = { tsuru: 'm1-0', maku: 'm3-0', tsuki: 'm8-0', ame: 'm11-0', hoo: 'm12-0' };
  assert.deepEqual(yakuKeys([L.tsuru, L.maku, L.tsuki]), ['sanko']);
  assert.deepEqual(yakuKeys([L.tsuru, L.maku, L.ame]), [], '雨入り3枚は役なし');
  assert.deepEqual(yakuKeys([L.tsuru, L.maku, L.tsuki, L.hoo]), ['shiko']);
  assert.deepEqual(yakuKeys([L.tsuru, L.maku, L.tsuki, L.ame]), ['ameshiko']);
  assert.deepEqual(yakuKeys(Object.values(L)), ['goko']);
  assert.equal(E.computeYaku(Object.values(L)).total, 10);
  assert.equal(E.computeYaku([L.tsuru, L.maku, L.tsuki, L.ame]).total, 7);
  assert.equal(E.computeYaku([L.tsuru, L.maku, L.tsuki, L.hoo]).total, 8);
});

test('花見・月見・猪鹿蝶・赤短・青短', () => {
  assert.deepEqual(yakuKeys(['m3-0', 'm9-0']), ['hanami']);
  assert.deepEqual(yakuKeys(['m8-0', 'm9-0']), ['tsukimi']);
  assert.equal(E.computeYaku(['m3-0', 'm8-0', 'm9-0']).total, 10);
  assert.deepEqual(yakuKeys(['m7-0', 'm10-0', 'm6-0']), ['inoshikacho']);
  assert.deepEqual(yakuKeys(['m1-1', 'm2-1', 'm3-1']), ['akatan']);
  assert.deepEqual(yakuKeys(['m6-1', 'm9-1', 'm10-1']), ['aotan']);
  // 赤短+青短 = 短冊6枚 → 5+5+2
  assert.equal(E.computeYaku(['m1-1', 'm2-1', 'm3-1', 'm6-1', 'm9-1', 'm10-1']).total, 12);
  assert.deepEqual(yakuKeys(['m1-1', 'm2-1', 'm4-1']), []);
});

test('タネ・タン・カスの枚数役', () => {
  assert.deepEqual(yakuKeys(ofType('tane', 4)), []);
  assert.equal(E.computeYaku(['m2-0', 'm4-0', 'm5-0', 'm8-1', 'm11-1']).total, 1);
  assert.equal(E.computeYaku(['m2-0', 'm4-0', 'm5-0', 'm8-1', 'm11-1', 'm9-0']).total, 2);
  assert.equal(E.computeYaku(['m4-1', 'm5-1', 'm7-1', 'm11-2', 'm1-1']).total, 1);
  assert.deepEqual(yakuKeys(kasu(9)), []);
  assert.equal(E.computeYaku(kasu(10)).total, 1);
  assert.equal(E.computeYaku(kasu(13)).total, 4);
  // 猪鹿蝶 + タネ5枚 = 6
  assert.equal(E.computeYaku(['m7-0', 'm10-0', 'm6-0', 'm2-0', 'm4-0']).total, 6);
});

test('7点以上は2倍', () => {
  assert.deepEqual(E.finalScore(6), { base: 6, mult: 1, points: 6 });
  assert.deepEqual(E.finalScore(7), { base: 7, mult: 2, points: 14 });
  assert.deepEqual(E.finalScore(10), { base: 10, mult: 2, points: 20 });
});

// 任意の配札でラウンド開始するヘルパー（dealer=0: 0-7 が親の手札, 8-15 子, 16-23 場, 24- 山）
function setup(hand0, hand1, field, stock) {
  const used = new Set([...hand0, ...hand1, ...field, ...stock]);
  const usedMonths = new Set([...used].map((x) => E.card(x).month));
  const all = E.DECK.map((c) => c.id).filter((x) => !used.has(x));
  // 指定札と同じ月の札は埋め札に使わない（意図しないマッチを防ぐ）
  const rest = [...all.filter((x) => !usedMonths.has(E.card(x).month)), ...all.filter((x) => usedMonths.has(E.card(x).month))];
  const take = (arr, n) => { while (arr.length < n) arr.push(rest.shift()); return arr; };
  // 埋め札が勝手にマッチしないよう気にしない（テストでは明示した札だけ見る）
  const deck = [...take(hand0.slice(), 8), ...take(hand1.slice(), 8), ...take(field.slice(), 8), ...stock, ...rest];
  const s = E.createGame({ seed: 1, rounds: 3, dealer: 0 });
  E.startRound(s, deck);
  return s;
}

test('手札：1枚一致で取る / 0枚で場に置く', () => {
  const s = E.createGame({ seed: 1, dealer: 0 });
  const deck = E.DECK.map((c) => c.id);
  // 手札0: m1..m2 (0-7), 手札1: m3..m4, 場: m5..m6, 山: 残り
  E.startRound(s, deck);
  assert.equal(s.phase, 'play');
  // m1-0 は場に1月がない → 置かれる
  let r = E.playFromHand(s, 0, 'm1-0');
  assert.ok(r.ok);
  assert.ok(s.field.includes('m1-0'));
  assert.equal(s.phase, 'draw');
  assert.equal(E.totalCards(s), 48);
});

test('場に2枚：選択が必要、選んだ札だけ取る', () => {
  const s = setup(['m1-0'], [], ['m1-2', 'm1-3'], []);
  const r = E.playFromHand(s, 0, 'm1-0');
  assert.equal(r.ok, false);
  assert.equal(r.need, 'target');
  assert.deepEqual(r.options.sort(), ['m1-2', 'm1-3']);
  assert.ok(s.hands[0].includes('m1-0'), '選択待ちでは手札から減らない');
  const r2 = E.playFromHand(s, 0, 'm1-0', 'm1-3');
  assert.ok(r2.ok);
  assert.deepEqual(s.captured[0].sort(), ['m1-0', 'm1-3']);
  assert.ok(s.field.includes('m1-2'));
});

test('場に3枚：まとめて4枚取る', () => {
  const s = setup(['m2-0'], [], ['m2-1', 'm2-2', 'm2-3'], []);
  E.playFromHand(s, 0, 'm2-0');
  assert.deepEqual(s.captured[0].sort(), ['m2-0', 'm2-1', 'm2-2', 'm2-3']);
  assert.equal(s.field.filter((f) => E.card(f).month === 2).length, 0);
});

test('山札めくり：2枚一致は選択、役ができたらこいこい選択へ', () => {
  // 手札で桜に幕を取り、山から菊に盃で花見
  const s = setup(['m3-0', 'm12-1'], [], ['m3-2', 'm9-2'], ['m9-0']);
  E.playFromHand(s, 0, 'm3-0');
  E.revealDraw(s);
  assert.equal(s.drawn, 'm9-0');
  assert.equal(s.phase, 'drawn');
  E.resolveDraw(s);
  assert.equal(s.phase, 'koikoi');
  assert.equal(E.computeYaku(s.captured[0]).total, 5);
  // こいこい → 相手の番へ
  E.declare(s, 0, 'koikoi');
  assert.equal(s.turn, 1);
  assert.equal(s.phase, 'play');
  assert.equal(s.koikoi[0], 1);
});

test('山札めくりで2枚一致 → target 必須', () => {
  const s = setup(['m12-1'], [], ['m4-2', 'm4-3'], ['m4-0']);
  E.playFromHand(s, 0, 'm12-1');
  E.revealDraw(s);
  const r = E.resolveDraw(s);
  assert.equal(r.need, 'target');
  assert.equal(s.phase, 'drawn');
  E.resolveDraw(s, 'm4-2');
  assert.ok(s.captured[0].includes('m4-0') && s.captured[0].includes('m4-2'));
  assert.equal(E.totalCards(s), 48);
});

test('勝負であがると点が入り、勝者が次の親', () => {
  const s = setup(['m3-0', 'm12-1'], [], ['m3-2', 'm9-2'], ['m9-0']);
  s.dealer = 0;
  E.playFromHand(s, 0, 'm3-0');
  E.revealDraw(s);
  E.resolveDraw(s);
  E.declare(s, 0, 'stop');
  assert.equal(s.phase, 'roundOver');
  assert.equal(s.result.winner, 0);
  assert.equal(s.result.points, 5);
  assert.equal(s.scores[0], 5);
  assert.equal(s.dealer, 0);
});

test('点が増えないとこいこい選択は出ない', () => {
  const s = setup(['m3-0', 'm12-1', 'm5-0'], ['m6-2'], ['m3-2', 'm9-2'], ['m9-0', 'm11-3', 'm7-3']);
  E.playFromHand(s, 0, 'm3-0'); E.revealDraw(s); E.resolveDraw(s);
  E.declare(s, 0, 'koikoi');
  // 相手番：適当に
  const p1 = s.hands[1][0];
  const ms = E.matchesFor(s, p1);
  E.playFromHand(s, 1, p1, ms[0]); E.revealDraw(s);
  if (E.drawOptions(s).length === 2) E.resolveDraw(s, E.drawOptions(s)[0]); else E.resolveDraw(s);
  if (s.phase === 'koikoi') E.declare(s, 1, 'koikoi');
  // 自分の番：点が増えなければ phase は play のまま相手へ
  assert.equal(s.turn, 0);
  const before = E.computeYaku(s.captured[0]).total;
  const h = s.hands[0].find((x) => E.matchesFor(s, x).length !== 2);
  E.playFromHand(s, 0, h); E.revealDraw(s);
  if (E.drawOptions(s).length === 2) E.resolveDraw(s, E.drawOptions(s)[0]); else E.resolveDraw(s);
  const after = E.computeYaku(s.captured[0]).total;
  if (after === before) assert.equal(s.phase, 'play');
  else assert.equal(s.phase, 'koikoi');
});

test('不正な操作は拒否される', () => {
  const s = setup(['m1-0'], ['m2-0'], [], []);
  assert.equal(E.playFromHand(s, 1, 'm2-0').error, 'turn');
  assert.equal(E.playFromHand(s, 0, 'm2-0').error, 'notInHand');
  assert.equal(E.revealDraw(s).error, 'phase');
  assert.equal(E.declare(s, 0, 'stop').error, 'phase');
});

test('配り直し：場に同じ月4枚にならない', () => {
  for (let seed = 1; seed < 300; seed++) {
    const s = E.createGame({ seed });
    E.startRound(s);
    assert.equal(E.hasFourOnField(s.field), false);
    assert.equal(s.hands[0].length, 8);
    assert.equal(s.hands[1].length, 8);
    assert.equal(s.field.length, 8);
    assert.equal(s.stock.length, 24);
  }
});
