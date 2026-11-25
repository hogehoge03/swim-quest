/* はなふだ こいこい — 札の絵柄（SVG生成）。各月に「かわいい子」がいます */
(function (root) {
  'use strict';

  // 月ごとのテーマ（背景・アクセント・女の子の髪/服・花の色）
  const THEME = {
    1: { bg: '#fff4dc', sky: '#ffb3a7', accent: '#3f9a5a', hair: '#4a3b2a', dress: '#4fae6a', flower: '#2f7d4a', style: 'bun' },
    2: { bg: '#fff0f5', sky: '#ffd6e4', accent: '#e05a86', hair: '#6b3a4a', dress: '#f28cb0', flower: '#e0456f', style: 'twin' },
    3: { bg: '#fff3f8', sky: '#ffdbe9', accent: '#ef7fa8', hair: '#f0a0be', dress: '#ffc2d8', flower: '#ff9fc2', style: 'bob' },
    4: { bg: '#f6f0ff', sky: '#e5d8ff', accent: '#8f6ae0', hair: '#5b4a8a', dress: '#b49bf2', flower: '#9a7ae8', style: 'pony' },
    5: { bg: '#eef3ff', sky: '#d6e0ff', accent: '#5a62c9', hair: '#2f3a6b', dress: '#7f8ae6', flower: '#6c5fd0', style: 'twin' },
    6: { bg: '#fff0f1', sky: '#ffd1d6', accent: '#e44b67', hair: '#8a2d3c', dress: '#f6798f', flower: '#ef5f7c', style: 'bun' },
    7: { bg: '#fdf0f7', sky: '#f8d2e6', accent: '#c93d86', hair: '#6a3a2a', dress: '#e47ab1', flower: '#d6448f', style: 'bob' },
    8: { bg: '#fff7df', sky: '#2c3566', accent: '#c99a2e', hair: '#3a3350', dress: '#f0c35a', flower: '#d8b04a', style: 'pony' },
    9: { bg: '#fffbe6', sky: '#fff0b0', accent: '#e3a51c', hair: '#7a4a1a', dress: '#f7cf4a', flower: '#f2b51f', style: 'twin' },
    10: { bg: '#fff2ea', sky: '#ffd8c2', accent: '#e0582c', hair: '#a8401f', dress: '#f38a4f', flower: '#e8502a', style: 'bob' },
    11: { bg: '#eafaf4', sky: '#c9e8f2', accent: '#2f9c84', hair: '#25584f', dress: '#5cc2a4', flower: '#3fa98b', style: 'pony' },
    12: { bg: '#f4efff', sky: '#e3d6ff', accent: '#8460c8', hair: '#3b2f5c', dress: '#a98ae6', flower: '#9a6fe0', style: 'bun' },
  };

  const SKIN = '#ffe6d6';
  const INK = '#3a2540';
  const f1 = (n) => Math.round(n * 10) / 10;

  // ---------- 小物 ----------
  function flower5(x, y, r, fill, center) {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * Math.PI / 180;
      s += `<circle cx="${f1(x + Math.cos(a) * r * 0.62)}" cy="${f1(y + Math.sin(a) * r * 0.62)}" r="${f1(r * 0.5)}" fill="${fill}"/>`;
    }
    return s + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.3)}" fill="${center || '#ffe066'}"/>`;
  }
  function sakura(x, y, r, fill) {
    let s = '';
    for (let i = 0; i < 5; i++) {
      s += `<ellipse cx="${x}" cy="${f1(y - r * 0.55)}" rx="${f1(r * 0.38)}" ry="${f1(r * 0.55)}" fill="${fill}" transform="rotate(${i * 72} ${x} ${y})"/>`;
    }
    return s + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.22)}" fill="#fff3a8"/>`;
  }
  function chrys(x, y, r, fill, core) {
    let s = '';
    for (let i = 0; i < 14; i++) {
      s += `<ellipse cx="${x}" cy="${f1(y - r * 0.6)}" rx="${f1(r * 0.17)}" ry="${f1(r * 0.42)}" fill="${fill}" transform="rotate(${f1(i * 360 / 14)} ${x} ${y})"/>`;
    }
    return s + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.32)}" fill="${core || '#e08a1a'}"/>`;
  }
  function maple(x, y, r, fill, rot) {
    const pts = [];
    const n = 5;
    for (let i = 0; i < n * 2; i++) {
      const a = (i * 180 / n - 90) * Math.PI / 180;
      const rr = i % 2 === 0 ? r : r * 0.42;
      pts.push(`${f1(x + Math.cos(a) * rr)},${f1(y + Math.sin(a) * rr)}`);
    }
    return `<g transform="rotate(${rot || 0} ${x} ${y})"><polygon points="${pts.join(' ')}" fill="${fill}" stroke-linejoin="round"/><line x1="${x}" y1="${y}" x2="${x}" y2="${f1(y + r * 1.1)}" stroke="${fill}" stroke-width="1.4"/></g>`;
  }
  function peony(x, y, r, c1, c2) {
    let s = '';
    for (let i = 0; i < 8; i++) {
      s += `<ellipse cx="${x}" cy="${f1(y - r * 0.5)}" rx="${f1(r * 0.42)}" ry="${f1(r * 0.55)}" fill="${c1}" transform="rotate(${i * 45} ${x} ${y})"/>`;
    }
    for (let i = 0; i < 6; i++) {
      s += `<ellipse cx="${x}" cy="${f1(y - r * 0.28)}" rx="${f1(r * 0.28)}" ry="${f1(r * 0.36)}" fill="${c2}" transform="rotate(${i * 60 + 30} ${x} ${y})"/>`;
    }
    return s + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.18)}" fill="#ffe066"/>`;
  }
  function sparkle(x, y, r, fill) {
    return `<path d="M${x},${y - r} Q${x + r * 0.18},${y - r * 0.18} ${x + r},${y} Q${x + r * 0.18},${y + r * 0.18} ${x},${y + r} Q${x - r * 0.18},${y + r * 0.18} ${x - r},${y} Q${x - r * 0.18},${y - r * 0.18} ${x},${y - r}Z" fill="${fill}"/>`;
  }
  function heart(x, y, r, fill) {
    return `<path d="M${x},${f1(y + r * 0.9)} C${f1(x - r * 1.4)},${f1(y - r * 0.1)} ${f1(x - r * 0.6)},${f1(y - r * 1.1)} ${x},${f1(y - r * 0.35)} C${f1(x + r * 0.6)},${f1(y - r * 1.1)} ${f1(x + r * 1.4)},${f1(y - r * 0.1)} ${x},${f1(y + r * 0.9)}Z" fill="${fill}"/>`;
  }
  // かわいい顔（動物・妖精用）
  function face(x, y, s, opt) {
    opt = opt || {};
    const e = opt.eye || INK;
    let out = '';
    if (opt.smile) {
      out += `<path d="M${f1(x - 4 * s)},${f1(y)} q${f1(1.6 * s)},${f1(-2 * s)} ${f1(3.2 * s)},0 M${f1(x + 0.8 * s)},${f1(y)} q${f1(1.6 * s)},${f1(-2 * s)} ${f1(3.2 * s)},0" stroke="${e}" stroke-width="${f1(1.1 * s)}" fill="none" stroke-linecap="round"/>`;
    } else {
      out += `<ellipse cx="${f1(x - 2.6 * s)}" cy="${y}" rx="${f1(1.3 * s)}" ry="${f1(1.7 * s)}" fill="${e}"/><ellipse cx="${f1(x + 2.6 * s)}" cy="${y}" rx="${f1(1.3 * s)}" ry="${f1(1.7 * s)}" fill="${e}"/>`;
      out += `<circle cx="${f1(x - 2.2 * s)}" cy="${f1(y - 0.7 * s)}" r="${f1(0.5 * s)}" fill="#fff"/><circle cx="${f1(x + 3 * s)}" cy="${f1(y - 0.7 * s)}" r="${f1(0.5 * s)}" fill="#fff"/>`;
    }
    out += `<ellipse cx="${f1(x - 5 * s)}" cy="${f1(y + 2.2 * s)}" rx="${f1(1.6 * s)}" ry="${f1(0.9 * s)}" fill="#ff8fab" opacity=".6"/><ellipse cx="${f1(x + 5 * s)}" cy="${f1(y + 2.2 * s)}" rx="${f1(1.6 * s)}" ry="${f1(0.9 * s)}" fill="#ff8fab" opacity=".6"/>`;
    if (!opt.noMouth) out += `<path d="M${f1(x - 1 * s)},${f1(y + 2.2 * s)} q${f1(1 * s)},${f1(1 * s)} ${f1(2 * s)},0" stroke="#c0506a" stroke-width="${f1(0.8 * s)}" fill="none" stroke-linecap="round"/>`;
    return out;
  }

  // ---------- 女の子 ----------
  function girl(cx, cy, s, t, opt) {
    opt = opt || {};
    const hair = opt.hair || t.hair;
    const dress = opt.dress || t.dress;
    const style = opt.style || t.style;
    let back = '';
    if (style === 'twin') back += `<ellipse cx="-16" cy="5" rx="5" ry="10" fill="${hair}"/><ellipse cx="16" cy="5" rx="5" ry="10" fill="${hair}"/>`;
    if (style === 'bun') back += `<circle cx="-10" cy="-13" r="5.5" fill="${hair}"/><circle cx="10" cy="-13" r="5.5" fill="${hair}"/>`;
    if (style === 'pony') back += `<ellipse cx="15" cy="-4" rx="5" ry="11" fill="${hair}" transform="rotate(25 15 -4)"/>`;
    back += `<path d="M-15,2 Q-16,-16 0,-16 Q16,-16 15,2 L15,9 Q12,12 9,9 L-9,9 Q-12,12 -15,9Z" fill="${hair}"/>`;
    let body = '';
    if (!opt.noBody) {
      body = `<path d="M-8,10 L8,10 L13,29 Q0,32 -13,29Z" fill="${dress}"/>` +
        `<path d="M-6,10 L0,16 L6,10Z" fill="#fff" opacity=".85"/>` +
        `<circle cx="-11" cy="21" r="3" fill="${SKIN}"/><circle cx="11" cy="21" r="3" fill="${SKIN}"/>` +
        `<path d="M-13,29 Q0,32 13,29" stroke="#fff" stroke-width="1.4" fill="none" opacity=".7"/>`;
    }
    let eyes;
    if (opt.eyes === 'smile') {
      eyes = `<path d="M-7.5,3.5 Q-5,0.5 -2.5,3.5 M2.5,3.5 Q5,0.5 7.5,3.5" stroke="${INK}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    } else if (opt.eyes === 'wink') {
      eyes = `<ellipse cx="-5" cy="3" rx="2.3" ry="3" fill="${INK}"/><circle cx="-4.2" cy="1.8" r=".9" fill="#fff"/>` +
        `<path d="M2.5,3.2 Q5,1 7.5,3.2" stroke="${INK}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    } else {
      eyes = `<ellipse cx="-5" cy="3" rx="2.3" ry="3" fill="${INK}"/><ellipse cx="5" cy="3" rx="2.3" ry="3" fill="${INK}"/>` +
        `<circle cx="-4.2" cy="1.8" r=".9" fill="#fff"/><circle cx="5.8" cy="1.8" r=".9" fill="#fff"/>`;
    }
    const mouth = opt.open
      ? '<path d="M-2.2,7.6 Q0,11 2.2,7.6Z" fill="#e0607e"/>'
      : '<path d="M-2,8 Q0,10 2,8" stroke="#c0506a" stroke-width="1" fill="none" stroke-linecap="round"/>';
    const headFace = `<ellipse cx="0" cy="2" rx="12" ry="11" fill="${SKIN}"/>` +
      `<path d="M-13,0 Q-12,-13 0,-13 Q12,-13 13,0 Q9,-6 6,-3 Q3,-8 0,-4 Q-3,-8 -6,-3 Q-9,-6 -13,0Z" fill="${hair}"/>` +
      eyes +
      `<ellipse cx="-8" cy="7" rx="2.5" ry="1.4" fill="#ff8fab" opacity=".55"/><ellipse cx="8" cy="7" rx="2.5" ry="1.4" fill="#ff8fab" opacity=".55"/>` +
      mouth +
      `<g>${flower5(10, -11, 5.5, opt.pin || t.flower, '#fff6a0')}</g>`;
    return `<g transform="translate(${cx} ${cy}) scale(${s})">${back}${body}${headFace}${opt.extra || ''}</g>`;
  }

  // 花の妖精（カス札）
  function sprite(x, y, s, t, month, variant) {
    const petal = t.flower;
    let petals = '';
    for (let i = 0; i < 6; i++) {
      petals += `<ellipse cx="0" cy="-10" rx="5" ry="7" fill="${petal}" transform="rotate(${i * 60})"/>`;
    }
    const mood = variant % 2 === 0 ? { smile: true } : {};
    return `<g transform="translate(${x} ${y}) scale(${s})">${petals}<circle r="9" fill="${SKIN}"/>${face(0, -0.5, 1, mood)}` +
      `<ellipse cx="-4" cy="11" rx="2.4" ry="1.6" fill="${t.accent}"/><ellipse cx="4" cy="11" rx="2.4" ry="1.6" fill="${t.accent}"/></g>`;
  }

  // ---------- 月の背景モチーフ ----------
  function motif(m, t, opt) {
    opt = opt || {};
    const night = opt.night;
    switch (m) {
      case 1: return `<circle cx="50" cy="44" r="24" fill="${t.sky}" opacity=".75"/>` +
        `<path d="M50,160 L50,112 Q44,100 30,96" stroke="#8a5a34" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        [[22, 124, 20], [62, 118, 24], [42, 140, 22], [80, 140, 18], [18, 146, 15]].map(([x, y, r]) =>
          `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.55}" fill="#3f9a5a"/><ellipse cx="${x}" cy="${y - 3}" rx="${r * 0.7}" ry="${r * 0.3}" fill="#62bd78"/>`).join('');
      case 2: return `<path d="M-5,135 Q30,120 50,128 T105,110" stroke="#7a4a32" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<path d="M45,127 Q60,140 70,152" stroke="#7a4a32" stroke-width="3" fill="none" stroke-linecap="round"/>` +
        [[14, 124, 9], [40, 126, 8], [68, 120, 9], [92, 112, 7], [64, 146, 7], [26, 140, 6]].map(([x, y, r]) => flower5(x, y, r, '#e0456f', '#ffe066')).join('');
      case 3: return `<path d="M0,150 Q50,120 100,150 L100,160 L0,160Z" fill="#ffd3e3"/>` +
        [[16, 118, 9], [40, 130, 11], [66, 122, 10], [88, 134, 9], [28, 146, 8], [76, 150, 8], [52, 148, 7]].map(([x, y, r]) => sakura(x, y, r, '#ff9fc2')).join('') +
        [[20, 30], [82, 40], [12, 70]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="3.3" fill="#ffb7cf" transform="rotate(30 ${x} ${y})"/>`).join('');
      case 4: return [10, 32, 70, 92].map((x, i) => {
        let s = `<path d="M${x},0 Q${x + 4},10 ${x},18" stroke="#6a9a4a" stroke-width="2" fill="none"/>`;
        const len = i % 2 ? 7 : 9;
        for (let k = 0; k < len; k++) s += `<circle cx="${x + (k % 2 ? 2 : -2)}" cy="${16 + k * 6}" r="${4.4 - k * 0.38}" fill="${k % 2 ? '#b49bf2' : '#9a7ae8'}"/>`;
        return s;
      }).join('');
      case 5: return [12, 26, 76, 90].map((x, i) => `<path d="M${x},160 Q${x + (i % 2 ? 4 : -4)},120 ${x + (i < 2 ? 6 : -6)},84" stroke="#3f9a5a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`).join('') +
        [[18, 86], [84, 90]].map(([x, y]) => `<ellipse cx="${x - 5}" cy="${y}" rx="4" ry="7" fill="#6c5fd0" transform="rotate(-30 ${x - 5} ${y})"/><ellipse cx="${x + 5}" cy="${y}" rx="4" ry="7" fill="#6c5fd0" transform="rotate(30 ${x + 5} ${y})"/><ellipse cx="${x}" cy="${y - 5}" rx="3.5" ry="7" fill="#8f86ee"/><circle cx="${x}" cy="${y}" r="2" fill="#ffe066"/>`).join('');
      case 6: return `<ellipse cx="20" cy="146" rx="18" ry="9" fill="#3f9a5a"/><ellipse cx="82" cy="148" rx="18" ry="9" fill="#3f9a5a"/>` +
        peony(26, 132, 15, '#ef5f7c', '#ff9fb2') + peony(78, 136, 13, '#ff8fb0', '#ffd0dc');
      case 7: return [[-5, 150, 50, 110, 100, 120], [0, 120, 40, 96, 90, 92]].map(([a, b, c, d, e, f]) =>
        `<path d="M${a},${b} Q${c},${d} ${e},${f}" stroke="#8a4a2a" stroke-width="2" fill="none"/>`).join('') +
        [[10, 140], [24, 132], [38, 128], [54, 126], [70, 126], [86, 122], [14, 112], [30, 104], [48, 98], [66, 94], [82, 92]].map(([x, y], i) =>
          `<circle cx="${x}" cy="${y}" r="3" fill="${i % 3 ? '#d6448f' : '#f07ab8'}"/><ellipse cx="${x + 3}" cy="${y + 5}" rx="2.5" ry="1.4" fill="#5aa05a"/>`).join('');
      case 8: return `<path d="M-10,160 Q50,96 110,160Z" fill="${night ? '#1f2547' : '#d8b04a'}"/>` +
        [8, 18, 30, 44, 58, 72, 84, 94].map((x, i) => `<path d="M${x},160 Q${x + 4},${130 - (i % 3) * 8} ${x + 10},${116 - (i % 2) * 10}" stroke="${night ? '#f3e7b8' : '#fff4c6'}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`).join('');
      case 9: return `<path d="M50,160 L50,140" stroke="#3f9a5a" stroke-width="3"/>` +
        chrys(26, 132, 15, '#f7cf4a') + chrys(74, 128, 17, '#f2b51f') + chrys(50, 150, 11, '#ffe08a', '#f2b51f');
      case 10: return [[16, 128, 12, -10, '#e8502a'], [40, 146, 10, 20, '#f38a4f'], [66, 126, 13, 15, '#d93a1f'], [88, 148, 11, -25, '#f6a23b'], [26, 104, 8, 30, '#f38a4f'], [82, 102, 8, -15, '#e8502a']]
        .map(([x, y, r, rot, c]) => maple(x, y, r, c, rot)).join('');
      case 11: {
        let s = [8, 26, 74, 92].map((x) => `<path d="M${x},0 Q${x - 6},40 ${x + 2},76" stroke="#3fa98b" stroke-width="2.4" fill="none"/>` +
          [16, 34, 52].map((y) => `<ellipse cx="${x - 3}" cy="${y + 6}" rx="2" ry="4.5" fill="#5cc2a4"/>`).join('')).join('');
        if (opt.rain) s += Array.from({ length: 14 }, (_, i) => `<line x1="${(i * 23) % 100}" y1="${(i * 37) % 120 + 10}" x2="${(i * 23) % 100 - 4}" y2="${(i * 37) % 120 + 20}" stroke="#7fb5d6" stroke-width="1.5" stroke-linecap="round"/>`).join('');
        return s;
      }
      case 12: return `<ellipse cx="22" cy="146" rx="22" ry="14" fill="#3f9a5a"/><ellipse cx="78" cy="148" rx="22" ry="13" fill="#4fae6a"/>` +
        `<path d="M22,146 L22,134 M78,148 L78,136" stroke="#2f7d4a" stroke-width="1.5"/>` +
        [30, 50, 70].map((x, i) => {
          let s = `<line x1="${x}" y1="138" x2="${x}" y2="${98 - i % 2 * 8}" stroke="#6a9a4a" stroke-width="2"/>`;
          for (let k = 0; k < 5; k++) s += `<circle cx="${x + (k % 2 ? 3 : -3)}" cy="${104 - i % 2 * 8 + k * 7}" r="3.4" fill="${k % 2 ? '#b49bf2' : '#9a6fe0'}"/>`;
          return s;
        }).join('');
      default: return '';
    }
  }

  // ---------- 動物・小物 ----------
  function bird(x, y, s, body, belly, opt) {
    opt = opt || {};
    const tail = opt.fork
      ? `<path d="M-10,2 L-24,-4 L-16,4 L-24,10Z" fill="${body}"/>`
      : `<path d="M-10,0 L-20,-6 L-18,6Z" fill="${body}"/>`;
    const wings = opt.fly
      ? `<path d="M-2,-4 Q-10,-22 -22,-20 Q-12,-10 -6,2Z" fill="${opt.wing || body}"/><path d="M4,-4 Q12,-24 24,-22 Q16,-10 8,2Z" fill="${opt.wing || body}"/>`
      : `<ellipse cx="-2" cy="2" rx="7" ry="5" fill="${opt.wing || body}" opacity=".9" transform="rotate(-15 -2 2)"/>`;
    return `<g transform="translate(${x} ${y}) scale(${s})">${tail}<ellipse cx="0" cy="0" rx="13" ry="11" fill="${body}"/>` +
      `<ellipse cx="2" cy="4" rx="8" ry="6" fill="${belly}"/>${opt.throat ? `<ellipse cx="7" cy="1" rx="3.5" ry="3" fill="${opt.throat}"/>` : ''}${wings}` +
      `<path d="M12,-2 L18,0 L12,2Z" fill="#f2a33a"/>${face(5.5, -3.5, 0.75)}${opt.crest || ''}</g>`;
  }

  function item(tag, t) {
    switch (tag) {
      case 'tsuru': return `<g transform="translate(50 72) scale(1.5)">` +
        `<path d="M-14,14 L-10,22 M-4,14 L-2,22" stroke="#555" stroke-width="1.4"/>` +
        `<ellipse cx="-6" cy="6" rx="14" ry="10" fill="#fff" stroke="#e5d9d0" stroke-width=".8"/>` +
        `<path d="M-20,4 Q-26,-2 -22,10 Q-18,12 -14,8Z" fill="${INK}"/>` +
        `<path d="M2,2 Q8,-6 6,-16" stroke="#fff" stroke-width="5.5" fill="none" stroke-linecap="round"/>` +
        `<circle cx="7" cy="-18" r="5.5" fill="#fff" stroke="#e5d9d0" stroke-width=".8"/><circle cx="7" cy="-22.5" r="2.4" fill="#e8384f"/>` +
        `<path d="M12,-18 L18,-16.5 L12,-15.5Z" fill="#f2a33a"/>${face(6.5, -18.5, 0.6, { noMouth: true })}</g>`;
      case 'uguisu': return bird(50, 72, 1.6, '#9bb34a', '#e3ecaa', { wing: '#7f9a38' });
      case 'hototogisu': return `<circle cx="74" cy="30" r="14" fill="#ffe9a8" opacity=".9"/>` + bird(48, 70, 1.5, '#6f7fa8', '#e8ecf6', { fly: true, wing: '#56658e' });
      case 'yatsuhashi': return `<g transform="translate(50 76)">` +
        [[-34, -10], [-12, 4], [10, -10], [32, 4]].map(([x, y]) => `<rect x="${x - 12}" y="${y - 5}" width="24" height="10" rx="2" fill="#a8743c" stroke="#7a4f24" stroke-width="1.2" transform="rotate(${y < 0 ? -18 : 18} ${x} ${y})"/>`).join('') +
        `<path d="M-46,18 Q0,30 46,18" stroke="#9fd0f0" stroke-width="5" fill="none" opacity=".8"/></g>` +
        sprite(50, 52, 0.8, t, 5, 0);
      case 'cho': return [[34, 60, 1.25, -10], [70, 84, 1.0, 15]].map(([x, y, s, r]) =>
        `<g transform="translate(${x} ${y}) scale(${s}) rotate(${r})">` +
        `<ellipse cx="-9" cy="-6" rx="9" ry="7" fill="#7fc8f0"/><ellipse cx="9" cy="-6" rx="9" ry="7" fill="#7fc8f0"/>` +
        `<ellipse cx="-7" cy="6" rx="6" ry="5" fill="#b49bf2"/><ellipse cx="7" cy="6" rx="6" ry="5" fill="#b49bf2"/>` +
        `<circle cx="-9" cy="-6" r="3" fill="#fff" opacity=".7"/><circle cx="9" cy="-6" r="3" fill="#fff" opacity=".7"/>` +
        `<ellipse cx="0" cy="0" rx="3" ry="9" fill="${INK}"/><path d="M-1,-8 Q-4,-15 -7,-16 M1,-8 Q4,-15 7,-16" stroke="${INK}" stroke-width="1" fill="none"/>` +
        `<circle cx="0" cy="-8" r="4" fill="${SKIN}"/>${face(0, -8.3, 0.45, { noMouth: true })}</g>`).join('');
      case 'inoshishi': return `<g transform="translate(50 82) scale(1.55)">` +
        `<rect x="-12" y="6" width="4" height="8" rx="2" fill="#6b4224"/><rect x="6" y="6" width="4" height="8" rx="2" fill="#6b4224"/>` +
        `<ellipse cx="-2" cy="0" rx="17" ry="12" fill="#9a6338"/>` +
        `<path d="M-14,-6 Q-6,-10 2,-8 M-12,0 Q-4,-4 4,-2" stroke="#c48a5a" stroke-width="2" fill="none" stroke-linecap="round"/>` +
        `<path d="M6,-10 L9,-17 L12,-9Z" fill="#7a4a28"/><ellipse cx="12" cy="0" rx="8" ry="7.5" fill="#a8703f"/>` +
        `<ellipse cx="17" cy="3" rx="4" ry="3.2" fill="#f4a6a6"/><circle cx="16" cy="3" r=".8" fill="${INK}"/><circle cx="18.2" cy="3" r=".8" fill="${INK}"/>` +
        `${face(10.5, -2, 0.55, { noMouth: true })}</g>`;
      case 'kari': return `<circle cx="70" cy="34" r="13" fill="#fff4c6" opacity=".9"/>` +
        [[30, 46, 1], [52, 60, 0.85], [72, 74, 0.7]].map(([x, y, s]) =>
          `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-14,2 Q-4,-14 0,0 Q6,-14 16,2 Q4,-2 0,6 Q-4,-2 -14,2Z" fill="#5a4a3a"/>` +
          `<circle cx="0" cy="1" r="4" fill="#7a6a5a"/>${face(0, 0.5, 0.4, { noMouth: true, eye: '#fff' })}</g>`).join('');
      case 'sakazuki': return `<g transform="translate(50 76) scale(1.35)">` +
        `<path d="M-8,14 L8,14 L6,8 L-6,8Z" fill="#c22a3a"/>` +
        `<path d="M-22,-6 Q0,26 22,-6Z" fill="#e8384f" stroke="#f2c14e" stroke-width="2"/><ellipse cx="0" cy="-6" rx="22" ry="5" fill="#f9d06a" stroke="#f2c14e" stroke-width="1.2"/>` +
        `<text x="0" y="8" text-anchor="middle" font-size="11" font-weight="bold" fill="#f9d06a" font-family="sans-serif">寿</text>` +
        `${face(0, -6.5, 0.55, { smile: true })}</g>`;
      case 'shika': return `<g transform="translate(46 84) scale(1.45)">` +
        `<rect x="-12" y="6" width="3.5" height="10" rx="1.7" fill="#9a6338"/><rect x="5" y="6" width="3.5" height="10" rx="1.7" fill="#9a6338"/>` +
        `<ellipse cx="-3" cy="0" rx="15" ry="10" fill="#d49a5c"/>` +
        [[-10, -3], [-4, 2], [2, -4], [-8, 4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#fff6e6"/>`).join('') +
        `<path d="M9,-12 L11,-20 M11,-17 L15,-20 M15,-12 L17,-20 M17,-16 L21,-18" stroke="#8a5a34" stroke-width="1.8" stroke-linecap="round"/>` +
        `<ellipse cx="6" cy="-8" rx="3" ry="2" fill="#c48a5a" transform="rotate(-30 6 -8)"/><ellipse cx="20" cy="-8" rx="3" ry="2" fill="#c48a5a" transform="rotate(30 20 -8)"/>` +
        `<circle cx="13" cy="-5" r="7.5" fill="#dfa868"/><ellipse cx="13" cy="-1" rx="4" ry="3" fill="#fff1dc"/>${face(13, -6, 0.6)}</g>`;
      case 'tsubame': return bird(50, 60, 1.4, '#2f3a6b', '#fff', { fork: true, fly: true, throat: '#e8384f', wing: '#24305a' });
      case 'maku': return `<g><path d="M8,22 L92,22 L92,74 Q71,64 50,74 Q29,64 8,74Z" fill="#fff"/>` +
        [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${8 + i * 14}" y="22" width="7" height="${i % 2 ? 46 : 50}" fill="#e8384f"/>`).join('') +
        `<line x1="4" y1="22" x2="96" y2="22" stroke="#8a5a34" stroke-width="3" stroke-linecap="round"/>` +
        `<circle cx="50" cy="44" r="10" fill="#fff"/>${sakura(50, 44, 8, '#ff9fc2')}</g>`;
      case 'hoo': return `<g transform="translate(52 66) scale(1.3)">` +
        `<path d="M-6,4 Q-30,18 -34,40 Q-22,26 -12,20Z" fill="#7fc8f0"/><path d="M-4,6 Q-22,28 -18,48 Q-12,30 -4,18Z" fill="#b49bf2"/><path d="M-8,2 Q-36,6 -40,24 Q-26,14 -14,12Z" fill="#5cc2a4"/>` +
        `<ellipse cx="0" cy="0" rx="12" ry="10" fill="#f38a4f"/><ellipse cx="2" cy="3" rx="7" ry="5" fill="#ffd88a"/>` +
        `<path d="M-4,-4 Q-16,-22 -26,-20 Q-16,-10 -8,2Z" fill="#e8384f"/><path d="M4,-4 Q14,-24 26,-24 Q18,-10 8,2Z" fill="#f2b51f"/>` +
        `<path d="M6,-9 Q4,-17 8,-18 M8,-9 Q9,-17 13,-16" stroke="#e8384f" stroke-width="2" fill="none" stroke-linecap="round"/>` +
        `<path d="M11,-3 L17,-1 L11,1Z" fill="#f2a33a"/>${face(5, -3.5, 0.65)}</g>`;
      default: return '';
    }
  }

  // ---------- 札を組み立てる ----------
  const cache = {};
  function E_kasuIndex(c) {
    // カスは各月の後ろの方に並ぶ。idx からその月の最初のカスの idx を引く
    const firstKasu = { 11: 3, 12: 1 }[c.month] || 2;
    return c.idx - firstKasu;
  }
  function frame(t, inner, opt) {
    opt = opt || {};
    const bg = opt.bg || t.bg;
    const gold = opt.gold;
    return `<svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" class="card-svg">` +
      `<rect x="0" y="0" width="100" height="160" rx="10" fill="${gold ? '#e8b923' : '#2b2233'}"/>` +
      `<rect x="4" y="4" width="92" height="152" rx="7" fill="${bg}"/>` +
      `<svg x="4" y="4" width="92" height="152" viewBox="4 4 92 152" overflow="hidden"><g>${inner}</g></svg>` +
      (gold ? `<rect x="5.5" y="5.5" width="89" height="149" rx="6" fill="none" stroke="#fff3b0" stroke-width="1.5"/>` : '') +
      `</svg>`;
  }

  function badge(c, t) {
    const n = c.month;
    return `<circle cx="18" cy="18" r="13" fill="${t.accent}" stroke="#fff" stroke-width="2.2"/>` +
      `<text x="18" y="${n >= 10 ? 22.5 : 23.5}" text-anchor="middle" font-size="${n >= 10 ? 13 : 15.5}" font-weight="bold" fill="#fff" font-family="sans-serif">${n}</text>`;
  }

  function cardSVG(c) {
    if (cache[c.id]) return cache[c.id];
    const t = THEME[c.month];
    let inner = '';
    let opt = {};
    if (c.type === 'hikari') {
      opt.gold = true;
      if (c.tag === 'tsuki') {
        opt.bg = t.sky;
        inner += `<circle cx="50" cy="56" r="30" fill="#fff4c6"/><circle cx="50" cy="56" r="34" fill="#fff4c6" opacity=".25"/>` +
          [[16, 24], [84, 20], [80, 96], [14, 86]].map(([x, y]) => sparkle(x, y, 3, '#fff4c6')).join('') +
          motif(8, t, { night: true }) + girl(50, 102, 1.25, t, { eyes: 'smile', open: true });
      } else if (c.tag === 'ame') {
        inner += motif(11, t, { rain: true }) +
          girl(48, 96, 1.3, t, { eyes: 'open', open: true }) +
          `<path d="M14,70 Q48,30 82,70 Q70,64 64,70 Q56,62 48,70 Q40,62 32,70 Q24,64 14,70Z" fill="#e8384f"/><line x1="48" y1="44" x2="48" y2="104" stroke="#8a5a34" stroke-width="2"/>` +
          `<g transform="translate(80 140)"><ellipse rx="10" ry="7" fill="#7cc46a"/><circle cx="-5" cy="-6" r="3.4" fill="#7cc46a"/><circle cx="5" cy="-6" r="3.4" fill="#7cc46a"/>` +
          `<circle cx="-5" cy="-6.4" r="1.5" fill="${INK}"/><circle cx="5" cy="-6.4" r="1.5" fill="${INK}"/><path d="M-3,0 Q0,2 3,0" stroke="${INK}" stroke-width=".8" fill="none"/></g>`;
      } else if (c.tag === 'maku') {
        inner += motif(3, t) + item('maku', t) + girl(50, 104, 1.2, t, { eyes: 'smile', open: true });
      } else if (c.tag === 'tsuru') {
        inner += motif(1, t) + item('tsuru', t) + girl(26, 120, 0.85, t, { eyes: 'wink' });
      } else if (c.tag === 'hoo') {
        inner += motif(12, t) + item('hoo', t) + girl(24, 118, 0.8, t, { eyes: 'smile' });
      }
      inner += sparkle(84, 16, 7, '#fff') + sparkle(84, 16, 4.5, '#f2c14e');
    } else if (c.type === 'tane') {
      inner += motif(c.month, t) + item(c.tag, t);
      if (c.tag === 'sakazuki') inner += sparkle(20, 50, 4, '#f2c14e') + sparkle(82, 42, 3, '#f2c14e');
    } else if (c.type === 'tan') {
      const color = c.tag === 'akatan' ? '#e8384f' : c.tag === 'aotan' ? '#3d6fd6' : '#e8565c';
      const text = c.tag === 'akatan' ? 'あかよろし' : c.tag === 'aotan' ? 'みよしの' : '';
      inner += motif(c.month, t) +
        `<g transform="rotate(-12 54 58)"><rect x="42" y="14" width="24" height="88" rx="3" fill="${color}" stroke="#fff" stroke-width="2"/>` +
        (c.tag === 'aotan' ? '' : '') +
        (text ? `<text x="54" y="28" font-size="11" fill="#fff" font-weight="bold" font-family="sans-serif" writing-mode="tb" glyph-orientation-vertical="0" letter-spacing="1">${text}</text>` : `<path d="M48,30 L60,30 M48,50 L60,50" stroke="#fff" stroke-width="1.5" opacity=".6"/>`) +
        `</g>` +
        (c.tag === 'aotan' || c.tag === 'akatan' ? heart(30, 34, 5, c.tag === 'aotan' ? '#7fa8f0' : '#ff8fab') : '') +
        girl(32, 92, 0.95, t, { eyes: c.month % 2 ? 'smile' : 'open' });
    } else {
      // 同じ月のカスの何枚目か（0,1,2）で絵を変える
      const k = E_kasuIndex(c);
      inner += motif(c.month, t);
      if (k === 1) {
        // ふたごの妖精
        inner += sprite(32, 62, 0.95, t, c.month, 0) + sprite(68, 78, 0.95, t, c.month, 1) + heart(52, 46, 4, '#ff8fab');
      } else if (k === 2) {
        inner += sprite(50, 64, 1.2, t, c.month, 1) + sparkle(22, 44, 3.5, t.accent) + sparkle(80, 40, 3.5, t.accent) + sparkle(76, 92, 2.5, t.accent);
      } else {
        inner += sprite(50, 68, 1.35, t, c.month, 0);
      }
    }
    inner += badge(c, t);
    const svg = frame(t, inner, opt);
    cache[c.id] = svg;
    return svg;
  }

  function backSVG() {
    if (cache.back) return cache.back;
    let dots = '';
    for (let y = 18; y < 150; y += 16) for (let x = 16; x < 96; x += 16) dots += `<circle cx="${x + (y % 32 ? 8 : 0)}" cy="${y}" r="1.6" fill="#ffb3c6" opacity=".55"/>`;
    cache.back = `<svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" class="card-svg">` +
      `<rect width="100" height="160" rx="10" fill="#2b2233"/><rect x="4" y="4" width="92" height="152" rx="7" fill="#c8384f"/>${dots}` +
      `<rect x="12" y="12" width="76" height="136" rx="6" fill="none" stroke="#ffd1dc" stroke-width="1.5" opacity=".8"/>` +
      `<circle cx="50" cy="80" r="20" fill="#ffd1dc" opacity=".35"/>${sakura(50, 80, 16, '#fff')}</svg>`;
    return cache.back;
  }

  const Art = { cardSVG, backSVG, THEME, girl, sprite };
  if (typeof module === 'object' && module.exports) module.exports = Art;
  else root.HFArt = Art;
})(typeof globalThis !== 'undefined' ? globalThis : this);
