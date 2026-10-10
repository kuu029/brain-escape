// おうちの人ページ: 勉強時間・教科ごとの正答率・苦手な単元・今週の計画・模試・ごほうびの記録を1画面で
//   設定から入る（合言葉を設定していれば、合言葉を入れたときだけ）
import { h, btn, toast, modal } from '../core/ui.js';
import { S, today, streakAlive } from '../core/store.js';
import { UNIT } from '../units/registry.js';
import { go } from '../core/router.js';
import { topBar, daysUntil } from './home.js';
import { histRow } from './exam.js';
import { weekPlan, SUBJ_JA, PLAN_GOAL, PLAN_SUBJ } from '../game/plan.js';
import { REWARD, rewardState } from '../game/reward.js';

const dayMs = 86400000;
const pastDays = (n) => Array.from({ length: n }, (_, i) => today(new Date(Date.now() - (n - 1 - i) * dayMs)));
const pct = (c, a) => (a ? Math.round((c / a) * 100) : null);
const WD = ['日', '月', '火', '水', '木', '金', '土'];

// 直近 n 日の単元ごとの {asked, correct}
function byUnit(days) {
  const s = S();
  const out = {};
  for (const d of days) for (const [id, v] of Object.entries(s.log[d]?.byUnit || {})) {
    const o = (out[id] ||= { asked: 0, correct: 0 });
    o.asked += v.asked;
    o.correct += v.correct;
  }
  return out;
}

function weekBars() {
  const s = S();
  const days = pastDays(7);
  const mins = days.map((d) => Math.round((s.log[d]?.seconds || 0) / 60));
  const max = Math.max(30, ...mins);
  const total = mins.reduce((a, b) => a + b, 0);
  return h('div', { class: 'pa-card' },
    h('h3', { class: 'pa-h' }, '⏱ この7日の勉強時間', h('small', {}, `合計 ${total}分・1日平均 ${Math.round(total / 7)}分`)),
    h('div', { class: 'pa-bars' }, days.map((d, i) => {
      const dt = new Date(`${d}T12:00:00`);
      return h('div', { class: `pa-bar${d === today() ? ' now' : ''}` },
        h('small', {}, mins[i] ? `${mins[i]}` : ''),
        h('span', { class: 'pa-col' }, h('i', { style: { height: `${(mins[i] / max) * 100}%` } })),
        h('small', {}, `${dt.getMonth() + 1}/${dt.getDate()}(${WD[dt.getDay()]})`));
    })));
}

function subjectTable(bu) {
  const rows = PLAN_SUBJ.map((sj) => {
    let a = 0, c = 0;
    for (const [id, v] of Object.entries(bu)) if (UNIT[id]?.subject === sj) { a += v.asked; c += v.correct; }
    return [sj, a, c];
  });
  return h('div', { class: 'pa-card' },
    h('h3', { class: 'pa-h' }, '📊 教科ごとの正答率', h('small', {}, '直近14日・1回目の答え')),
    rows.map(([sj, a, c]) => {
      const p = pct(c, a);
      return h('div', { class: 'pa-row' },
        h('span', { class: `pl-subj s-${sj}` }, SUBJ_JA[sj]),
        h('span', { class: 'pa-meter' }, h('i', { class: p === null ? '' : p < 60 ? 'low' : p < 80 ? 'mid' : 'high', style: { width: `${p || 0}%` } })),
        h('b', { class: 'pa-num' }, p === null ? '—' : `${p}%`),
        h('small', { class: 'pa-sub' }, `${a}問`));
    }));
}

function weakList(bu) {
  const list = Object.entries(bu).filter(([id, v]) => UNIT[id] && v.asked >= 5).map(([id, v]) => [id, v, v.correct / v.asked]).sort((a, b) => a[2] - b[2]).slice(0, 5);
  return h('div', { class: 'pa-card' },
    h('h3', { class: 'pa-h' }, '🧩 苦手な単元（トップ5）', h('small', {}, '直近14日・5問以上')),
    list.length ? list.map(([id, v, r]) => h('div', { class: 'pa-row' },
      h('span', { class: `pl-subj s-${UNIT[id].subject}` }, SUBJ_JA[UNIT[id].subject]),
      h('span', { class: 'pa-name', html: UNIT[id].title }),
      h('b', { class: `pa-num ${r < 0.6 ? 'low' : r < 0.8 ? 'mid' : 'high'}` }, `${Math.round(r * 100)}%`),
      h('small', { class: 'pa-sub' }, `${v.correct}/${v.asked}`)))
      : h('p', { class: 'note' }, 'まだデータが少ないです（1つの単元で5問以上答えると出ます）'));
}

function planBox() {
  const p = weekPlan();
  return h('div', { class: 'pa-card' },
    h('h3', { class: 'pa-h' }, '📅 今週の計画', h('small', {}, `${p.phaseInfo.name}・${p.doneCount}/${p.items.length} 達成`)),
    h('p', { class: 'note' }, `${p.phaseInfo.desc}。入試の日は設定で変えられます。`),
    p.items.map((x) => h('div', { class: 'pa-row' },
      h('span', { class: `pl-subj s-${x.subject}` }, SUBJ_JA[x.subject]),
      h('span', { class: 'pa-name' }, h('span', { html: UNIT[x.unit].title }), h('small', {}, `　${x.why}`)),
      h('b', { class: `pa-num ${x.done ? 'high' : ''}` }, x.done ? '✔' : `${x.n}/${PLAN_GOAL}`))));
}

function examBox() {
  const ex = (S().exams || []).slice(-5).reverse();
  return h('div', { class: 'pa-card' },
    h('h3', { class: 'pa-h' }, '📝 模試の結果（最近5回）'),
    ex.length ? h('div', { class: 'ex-hist' }, ex.map(histRow)) : h('p', { class: 'note' }, 'まだ模試を受けていません'));
}

// 💎の入り方（この7日）: どこで・何回・何💎。同じ単元を1日6回以上くり返した日は ⚠️
const MEM_JA = { en: '英単語', soc: '社会', sci: '理科', ja: '国語' };
function gemLabel(key) {
  const [k, v] = key.split(':');
  const u = (id) => UNIT[id]?.title || id;
  return { w: () => `ウェーブ｜${u(v)}`, m: () => `暗号ラッシュ｜${MEM_JA[v] || v}`, md: () => `暗号ディフェンス｜${MEM_JA[v] || v}`, ta: () => `タイムアタック｜${u(v)}` }[k]?.()
    || { review: 'リベンジウェーブ', weak: '苦手ミックス', diagnosis: '看守チェック', mission: '今日の指令', achieve: '実績', bonus: '2時間ボーナス・はじめての模試', plan: '今週の計画', exam: '模試', chal: '並べ替えチャレンジ（差し引き）', flow: '流れでつなげる', ending: 'エンディング' }[key] || key;
}
function gemBox() {
  const s = S();
  const days = pastDays(7);
  const sum = {};
  const daily = days.map((d) => {
    const g = s.log[d]?.gems || {};
    let t = 0;
    for (const [k, e] of Object.entries(g)) {
      t += e.gems;
      const o = (sum[k] ||= { n: 0, gems: 0, maxDay: 0 });
      o.n += e.n;
      o.gems += e.gems;
      o.maxDay = Math.max(o.maxDay, e.n);
    }
    return [d, t];
  });
  const total = daily.reduce((a, [, t]) => a + t, 0);
  const top = Object.entries(sum).sort((a, b) => b[1].gems - a[1].gems).slice(0, 8);
  return h('div', { class: 'pa-card' },
    h('h3', { class: 'pa-h' }, '💎 この7日の💎の入り方', h('small', {}, `合計 💎${total}`)),
    h('div', { class: 'pa-tix' }, daily.map(([d, t]) => { const dt = new Date(`${d}T12:00:00`); return h('span', {}, `${dt.getMonth() + 1}/${dt.getDate()} 💎${t}`); })),
    top.length ? top.map(([k, e]) => h('div', { class: 'pa-row' },
      h('span', { class: 'pa-name', html: `${e.maxDay >= 6 && /^(w|m|md|ta):/.test(k) ? '⚠️ ' : ''}${gemLabel(k)}` }),
      h('small', { class: 'pa-sub' }, `${e.n}回`),
      h('b', { class: 'pa-num' }, `💎${e.gems}`)))
      : h('p', { class: 'note' }, 'まだ記録がありません（この機能を入れた日から記録します）'),
    top.some(([k, e]) => e.maxDay >= 6 && /^(w|m|md|ta):/.test(k)) && h('p', { class: 'note' }, '⚠️ = 同じものを1日に6回以上くり返した日がある（4回目から💎は減るしくみ）'));
}

function rewardBox() {
  const R = rewardState();
  const wk = Date.now() - 7 * dayMs;
  const used = R.log.filter((x) => x.at >= wk).reduce((a, x) => a + x.min, 0);
  const fmt = (t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
  return h('div', { class: 'pa-card' },
    h('h3', { class: 'pa-h' }, '🌈 ごほうび（カラー解除）', h('small', {}, `この7日で ${used}分 使用`)),
    h('div', { class: 'pa-tix' },
      ...Object.entries(REWARD).map(([id, r]) => h('span', {}, `${r.name} ×${R.tix[id] || 0}`)),
      h('span', {}, `🎫 ごほうびガチャ券 ×${R.gtix || 0}`),
      h('span', {}, `💎 ${S().gems}`)),
    R.log.length ? h('div', { class: 'rw-log' }, R.log.slice(0, 10).map((x) => h('div', {}, `${fmt(x.at)}　${x.min}分${x.code ? `　${x.code}` : ''}`))) : h('p', { class: 'note' }, 'まだ使っていません'));
}

// 家族に送る: 1週間のまとめを文字にして、共有シート（LINE など）へ。共有できない端末ではコピー
const plain = (s) => String(s).replace(/<[^>]+>/g, '');
export function summaryText() {
  const s = S();
  const days = pastDays(7);
  const md = (d) => { const t = new Date(`${d}T12:00:00`); return `${t.getMonth() + 1}/${t.getDate()}`; };
  const mins = days.map((d) => Math.round((s.log[d]?.seconds || 0) / 60));
  const total = mins.reduce((a, b) => a + b, 0);
  const n = daysUntil(s.settings.examDate);
  const bu = byUnit(pastDays(14));
  const lines = [`【ブレイン脱獄 まとめ】${md(days[0])}〜${md(days[6])}`, `${s.nickname}｜連続 ${streakAlive()}日${n !== null && n >= 0 ? `｜入試まで ${n}日` : ''}`, ''];
  lines.push(`⏱ 勉強時間 合計 ${total}分（1日平均 ${Math.round(total / 7)}分）`);
  lines.push(`　${days.map((d, i) => `${md(d)} ${mins[i]}分`).join(' / ')}`);
  const p = weekPlan();
  lines.push('', `📅 今週の計画 ${p.doneCount}/${p.items.length}（${p.phaseInfo.name}）`);
  for (const x of p.items) lines.push(`　${x.done ? '✔' : '・'} ${SUBJ_JA[x.subject]} ${plain(UNIT[x.unit].title)} ${x.done ? '' : `${x.n}/${PLAN_GOAL}`}`.trimEnd());
  lines.push('', '📊 正答率（直近14日）');
  for (const sj of PLAN_SUBJ) {
    let a = 0, c = 0;
    for (const [id, v] of Object.entries(bu)) if (UNIT[id]?.subject === sj) { a += v.asked; c += v.correct; }
    lines.push(`　${SUBJ_JA[sj]} ${a ? `${pct(c, a)}%（${a}問）` : '—'}`);
  }
  const weak = Object.entries(bu).filter(([id, v]) => UNIT[id] && v.asked >= 5).sort((x, y) => x[1].correct / x[1].asked - y[1].correct / y[1].asked).slice(0, 3);
  if (weak.length) lines.push('', `🧩 苦手: ${weak.map(([id, v]) => `${plain(UNIT[id].title)} ${pct(v.correct, v.asked)}%`).join('、')}`);
  const ex = (s.exams || []).filter((r) => r.date >= days[0]);
  if (ex.length) lines.push('', `📝 模試: ${ex.map((r) => `${md(r.date)} ${r.got}/${r.max}`).join('、')}`);
  let gems = 0;
  for (const d of days) for (const e of Object.values(s.log[d]?.gems || {})) gems += e.gems;
  const R = rewardState();
  const used = R.log.filter((x) => x.at >= Date.now() - 7 * dayMs).reduce((a, x) => a + x.min, 0);
  lines.push('', `💎 この7日で 💎${gems}｜🌈 カラー解除 ${used}分 使用`);
  return lines.join('\n');
}
async function shareSummary() {
  const text = summaryText();
  if (navigator.share) {
    try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast('まとめをコピーした。LINE に貼りつけて送ってね', 2600);
  } catch {
    const ta = h('textarea', { class: 'backup-text', readonly: true });
    ta.value = text;
    await modal({ title: 'この文字をコピーして送る', body: h('div', {}, ta) });
  }
}

export function render(el) {
  const s = S();
  const bu = byUnit(pastDays(14));
  const n = daysUntil(s.settings.examDate);
  el.append(
    topBar(),
    h('div', { class: 'parent' },
      h('h2', { class: 'pa-title' }, '👪 おうちの人ページ'),
      h('p', { class: 'note' }, `${s.nickname} さん｜連続 ${streakAlive()}日${n !== null && n >= 0 ? `｜入試まで ${n}日` : ''}｜リベンジ待ち ${s.reviewQueue.length}問`),
      btn('📤 家族に送る（LINE など）', shareSummary, 'primary'),
      h('small', { class: 'note' }, 'この7日のまとめを文字にして送れます（共有で LINE をえらぶ）。'),
      weekBars(),
      planBox(),
      subjectTable(bu),
      weakList(bu),
      examBox(),
      gemBox(),
      rewardBox(),
      btn('◀ 設定にもどる', () => go('settings'), 'ghost')),
  );
}
