/*
 * スマホ画面での通し確認（Playwright）
 *   node hanafuda/test/e2e.js [出力ディレクトリ]
 * - iPhone SE / iPhone 13 / Pixel 7 サイズで、タイトル→対戦→最後の結果まで実際にタップして遊ぶ
 * - コンソールエラー、横はみ出し、手札が画面外に出ていないかをチェック
 * - スクリーンショットを保存
 */
const path = require('path');
const fs = require('fs');
const { chromium, devices } = require('playwright');

const OUT = process.argv[2] || path.join(__dirname, '..', 'screenshots');
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
fs.mkdirSync(OUT, { recursive: true });

function assert(cond, msg) { if (!cond) throw new Error('ASSERT: ' + msg); }

async function checkLayout(page, label) {
  const r = await page.evaluate(() => {
    const vw = window.innerWidth; const vh = window.innerHeight;
    const out = [];
    const check = (sel) => document.querySelectorAll(sel).forEach((el) => {
      const b = el.getBoundingClientRect();
      if (!b.width) return;
      if (b.left < -1 || b.right > vw + 1 || b.bottom > vh + 1 || b.top < -1) out.push(`${sel} ${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.right)},${Math.round(b.bottom)}`);
    });
    check('#myHand .card'); check('#field .card'); check('.topbar'); check('#myCap'); check('#cpuCap'); check('.mybar');
    return { out, sw: document.documentElement.scrollWidth, vw, vh };
  });
  assert(r.sw <= r.vw, `${label}: 横スクロールが出ている ${r.sw} > ${r.vw}`);
  assert(r.out.length === 0, `${label}: 画面外の要素 ${r.out.join(' / ')}`);
}

async function playThrough(name, device, opts) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...device });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.stack));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(URL + (opts.fast ? '?fast' : ''));
  await page.screenshot({ path: path.join(OUT, `${name}-1-title.png`) });
  // 3か月・ふつう
  await page.tap('.seg[data-key="rounds"] button[data-v="3"]');
  await page.tap('.seg[data-key="level"] button[data-v="normal"]');
  await page.tap('#startBtn');
  await page.waitForSelector('#game.active');
  // 回帰テスト：開始バナー中の連打で進行が二重にならないこと
  for (let k = 0; k < 3; k++) await page.locator('#myHand .card').first().tap({ force: true, timeout: 2000 }).catch(() => {});
  const early = await page.evaluate(() => window.__hf.state.phase);
  assert(early === 'play', `${name}: 開始バナー中のタップで進行してしまった (${early})`);

  let shots = 0; let plays = 0; let koikoiSeen = 0; let drawPicks = 0; let twoPicks = 0;
  const t0 = Date.now();
  for (let iter = 0; iter < 4000; iter++) {
    assert(Date.now() - t0 < 240000, `${name}: 時間切れ`);
    const st = await page.evaluate(() => {
      const s = window.__hf.state;
      const modal = document.getElementById('modalBack').classList.contains('show');
      return {
        phase: s.phase, turn: s.turn, busy: window.__hf.busy, modal,
        modalTitle: modal ? document.querySelector('#modal h2')?.textContent : '',
        hand: s.hands[0].slice(), total: s.stock.length + s.field.length + s.hands[0].length + s.hands[1].length + s.captured[0].length + s.captured[1].length + (s.drawn ? 1 : 0),
        matchCount: document.querySelectorAll('#field .card.match').length,
      };
    });
    assert(st.total === 48, `${name}: 札の合計が48でない (${st.total})`);
    if (st.modal) {
      const title = st.modalTitle || '';
      if (title.includes('役ができた')) {
        koikoiSeen++;
        await page.waitForTimeout(350);
        await page.screenshot({ path: path.join(OUT, `${name}-4-koikoi.png`) });
        // 1回目はこいこい、以降は勝負
        const btn = koikoiSeen === 1 ? 'こいこい' : '勝負する';
        await page.getByRole('button', { name: btn }).tap();
      } else if (title.includes('勝ち') || title.includes('引き分け')) {
        await page.waitForTimeout(350);
        await page.screenshot({ path: path.join(OUT, `${name}-6-gameover.png`) });
        break;
      } else {
        if (shots < 1) { await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `${name}-5-result.png`) }); shots++; }
        await page.locator('#modal .btns button').last().tap();
      }
      await page.waitForTimeout(50);
      continue;
    }
    if (!st.busy && st.turn === 0 && st.phase === 'play') {
      await checkLayout(page, name);
      if (plays === 1) await page.screenshot({ path: path.join(OUT, `${name}-2-play.png`) });
      // 取れる札を優先して出す
      const info = await page.evaluate(() => {
        const s = window.__hf.state; const E = window.HFEngine;
        const ids = s.hands[0];
        const cap = ids.find((id) => E.matchesFor(s, id).length > 0);
        const id = cap || ids[0];
        return { id, ms: E.matchesFor(s, id) };
      });
      await page.tap(`#myHand [data-id="${info.id}"]`);
      if (plays === 2) await page.screenshot({ path: path.join(OUT, `${name}-3-selected.png`) });
      if (info.ms.length === 2) {
        twoPicks++;
        await page.tap(`#field [data-id="${info.ms[1]}"]`, { force: true });
      } else if (info.ms.length === 1) {
        await page.tap(`#field [data-id="${info.ms[0]}"]`, { force: true }); // 光る札をタップ
      } else {
        await page.tap(`#myHand [data-id="${info.id}"]`);   // もう一度タップ
      }
      plays++;
      continue;
    }
    if (!st.busy && st.turn === 0 && st.phase === 'drawn' && st.matchCount === 2) {
      drawPicks++;
      if (drawPicks === 1) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, `${name}-3b-drawpick.png`) }); }
      await page.locator("#field .card.match").first().tap({ force: true });
      continue;
    }
    await page.waitForTimeout(opts.fast ? 15 : 120);
  }
  const final = await page.evaluate(() => ({ phase: window.__hf.state.phase, scores: window.__hf.state.scores, hist: window.__hf.state.history.length }));
  assert(final.phase === 'gameOver', `${name}: ゲームが最後まで終わっていない (${final.phase})`);
  assert(final.hist === 3, `${name}: 3か月分の結果がない`);

  // あそびかた画面
  await page.getByRole('button', { name: 'タイトルへ' }).tap();
  await page.tap('#howtoBtn');
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, `${name}-7-howto.png`) });

  assert(errors.length === 0, `${name}: エラー ${errors.join('\n')}`);
  console.log(`✔ ${name}: 3か月完走 あなた${final.scores[0]} - CPU${final.scores[1]}  手札操作${plays}回 2枚選択${twoPicks} めくり選択${drawPicks} こいこい画面${koikoiSeen}`);
  await browser.close();
}

(async () => {
  const targets = [
    ['iphone-se', devices['iPhone SE'], { fast: false }],
    ['iphone-13', devices['iPhone 13'], { fast: true }],
    ['pixel-7', devices['Pixel 7'], { fast: true }],
  ];
  const only = process.env.E2E_ONLY; // 例: E2E_ONLY=iphone-se
  for (const [name, dev, opts] of targets) if (!only || name.startsWith(only)) await playThrough(name, dev, opts);
  // 複数回の通しプレイ（速度優先）で稀なケースも踏む
  const n = only ? 0 : 4;
  for (let i = 0; i < n; i++) await playThrough(`stress-${i}`, devices['iPhone 13'], { fast: true });
  console.log('E2E OK. screenshots:', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
