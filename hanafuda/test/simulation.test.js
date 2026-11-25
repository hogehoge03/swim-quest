const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../js/engine.js');
const AI = require('../js/ai.js');

/** AI同士で1ゲーム最後まで遊ぶ。各ステップで不変条件をチェック */
function playGame(seed, levels, rounds = 12) {
  const s = E.createGame({ seed, rounds, dealer: seed % 2 });
  E.startRound(s);
  let steps = 0;
  const check = () => {
    assert.equal(E.totalCards(s), 48, `seed ${seed}: 札の総数`);
    const all = [...s.stock, ...s.field, ...s.hands[0], ...s.hands[1], ...s.captured[0], ...s.captured[1], ...(s.drawn ? [s.drawn] : [])];
    assert.equal(new Set(all).size, 48, `seed ${seed}: 重複なし`);
    assert.ok(s.captured[0].length % 2 === 0 && s.captured[1].length % 2 === 0, '取り札は常に偶数枚');
  };
  while (s.phase !== 'gameOver') {
    if (++steps > 10000) throw new Error('終わらない');
    const p = s.turn;
    switch (s.phase) {
      case 'play': {
        const mv = AI.chooseHandPlay(s, p, levels[p]);
        const r = E.playFromHand(s, p, mv.cardId, mv.targetId);
        assert.ok(r.ok, `seed ${seed}: play失敗 ${JSON.stringify(r)}`);
        break;
      }
      case 'draw': assert.ok(E.revealDraw(s).ok); break;
      case 'drawn': {
        const opts = E.drawOptions(s);
        const t = opts.length === 2 ? AI.chooseDrawTarget(s, p, levels[p]) : undefined;
        assert.ok(E.resolveDraw(s, t).ok);
        break;
      }
      case 'koikoi': assert.ok(E.declare(s, p, AI.decideKoikoi(s, p, levels[p])).ok); break;
      case 'roundOver': {
        const r = s.result;
        if (r.winner != null) {
          assert.ok(r.base > 0, 'あがりは1点以上');
          assert.equal(r.points, r.base * (r.base >= 7 ? 2 : 1));
        } else {
          assert.equal(s.hands[0].length + s.hands[1].length, 0, '流局は手札0');
        }
        E.nextRound(s);
        break;
      }
      default: throw new Error('unknown phase ' + s.phase);
    }
    if (s.phase !== 'gameOver' && s.phase !== 'roundOver') check();
  }
  assert.equal(s.history.length, rounds);
  const sum0 = s.history.filter((h) => h.winner === 0).reduce((a, h) => a + h.points, 0);
  assert.equal(sum0, s.scores[0]);
  return s;
}

test('AI同士 300ゲーム（12か月）が不変条件を守って完走する', () => {
  let draws = 0; let rounds = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const s = playGame(seed, ['normal', 'normal']);
    rounds += s.history.length;
    draws += s.history.filter((h) => h.winner == null).length;
  }
  // 流局は少数のはず
  assert.ok(draws / rounds < 0.3, `流局率 ${(draws / rounds).toFixed(2)}`);
});

test('「ふつう」CPUは「やさしい」CPUに勝ち越す', () => {
  let normalPts = 0; let easyPts = 0; let wins = 0; const N = 200;
  for (let seed = 1000; seed < 1000 + N; seed++) {
    const normalSeat = seed % 2;
    const levels = normalSeat === 0 ? ['normal', 'easy'] : ['easy', 'normal'];
    const s = playGame(seed, levels, 6);
    normalPts += s.scores[normalSeat];
    easyPts += s.scores[1 - normalSeat];
    if (s.scores[normalSeat] > s.scores[1 - normalSeat]) wins++;
  }
  console.log(`  normal ${normalPts}点 vs easy ${easyPts}点, 勝率 ${(wins / N * 100).toFixed(0)}%`);
  assert.ok(normalPts > easyPts * 1.2, 'ふつうの方が明確に強い');
});
