// おうちの人ページ: 勉強時間・教科ごとの正答率・苦手な単元・今週の計画・模試・ごほうびの記録を1画面で
//   設定から入る（合言葉を設定していれば、合言葉を入れたときだけ）
import { h, btn, toast, modal, phrases, confirmBox } from '../core/ui.js';
import { S, today, streakAlive, saveNow } from '../core/store.js';
import { UNIT } from '../units/registry.js';
import { go } from '../core/router.js';
import { topBar, daysUntil } from './home.js';
import { histRow } from './exam.js';
import { weekPlan, SUBJ_JA, PLAN_GOAL, PLAN_SUBJ } from '../game/plan.js';
import { REWARD, rewardState } from '../game/reward.js';
import * as PT from '../game/points.js';
import { readStats } from '../game/readlog.js';
import { colorStats } from '../game/colorlog.js';
import { FB_KINDS, fbList, fbText } from '../ui/feedback.js';
import { noteList, giftText } from '../ui/notecheck.js';
import { savings, projection, yen, SAVE, streakDays } from '../game/nextstep.js';

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

// 解き方を読んでいるか（ウェーブでまちがえたあと）
function readBox() {
  const r = readStats(pastDays(7));
  return h('div', { class: 'pa-card' },
    h('h3', { class: 'pa-h' }, '📖 解き方を読んでいる？', h('small', {}, 'この7日・ウェーブでまちがえたとき')),
    r ? h('div', { class: 'pa-list' },
      h('div', { class: 'pa-row' }, h('span', {}, `1回目のまちがい ${r.m1}回 →「解き方を見る」を押した`), h('b', {}, r.rate === null ? '—' : `${r.rate}%`)),
      h('div', { class: 'pa-row' }, h('span', {}, '1回目のヒントを見ていた時間（平均）'), h('b', {}, r.avg1 === null ? '—' : `${r.avg1}秒`)),
      h('div', { class: 'pa-row' }, h('span', {}, `2回目のまちがい ${r.m2}回 → 解き方と答えを見ていた時間（平均）`), h('b', {}, r.avg2 === null ? '—' : `${r.avg2}秒`)),
      h('small', { class: 'note' }, '目安: 2回目の解き方は 10秒以上なら読んでいそう。「次へ」が押せるようになってすぐ（3〜8秒）ばかりなら、読み飛ばしているかも。'))
      : h('p', { class: 'note' }, 'まだ記録がありません（この7日、ウェーブでまちがえていない）。'));
}

// 「🎨 カラーにする」を押したあと、ちゃんと勉強したか
function colorBox() {
  const c = colorStats(Date.now() - 7 * dayMs);
  const fmt = (t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]}) ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
  return h('div', { class: 'pa-card' },
    h('h3', { class: 'pa-h' }, '🎨 勉強カラー', h('small', {}, `この7日 ${c.n}回${c.n ? `・そのあと10分以内に勉強しなかった ${c.idle}回` : ''}`)),
    c.n ? h('div', { class: 'pa-list' }, c.list.slice(-8).reverse().map((x) => h('div', { class: `pa-row${x.idle ? ' warn-text' : ''}` }, h('span', {}, fmt(x.t)), h('b', {}, x.wait ? '（10分たつまで待ち）' : x.idle ? `⚠️ 勉強${x.min}分` : `勉強${x.min}分`))))
      : h('p', { class: 'note' }, 'この7日は使っていません。'),
    h('small', { class: 'note' }, '「カラーにする」を押してから10分のうちに、勉強が2分未満だと ⚠️。カラーのまま ほかのアプリに行ったのかもしれません。'));
}

// 🎓 合格貯金: いまの額・見こみ・第1志望の名前・たまった記録
function savingsBox(el) {
  const s = S();
  const sv = savings();
  const p1 = projection(1), p2 = projection(2);
  const inp = h('input', { class: 'mr-input', type: 'text', maxlength: '20', placeholder: '第1志望の学校名', value: s.settings.firstChoice || '' });
  const days = (s.next?.hist || []).filter((x) => x.at >= Date.now() - 7 * dayMs);
  return h('div', { class: 'pa-card pa-save' },
    h('h3', { class: 'pa-h' }, '🎓 合格貯金', h('small', {}, `いま ${yen(sv.bal)}・上限 ${yen(SAVE.max)}`)),
    h('p', { class: 'note' }, ...phrases(`第1志望に合格したら、たまった額を家族から渡してください（不合格でも半分）。 たまり方: はじめ ${yen(SAVE.start)}、 「次の一手」その日の1つ目 +${yen(SAVE.first)}・2つ目 +${yen(SAVE.second)}、 7日つづけるごとに +${yen(SAVE.week)}。`)),
    h('p', { class: 'note' }, ...phrases(`見こみ: 入試の日（${p1.date}${p1.guess ? '・仮。設定で入試日を入れると正確になります' : ''}）まで毎日1つなら 約${yen(p1.yen)}、 2つなら 約${yen(p2.yen)}。`)),
    h('p', { class: 'note' }, `この7日の「次の一手」${days.length}回（${new Set(days.map((x) => x.date)).size}日）・いま ${streakDays()}日つづいている`),
    h('div', { class: 'pa-add' }, inp, btn('保存', () => { s.settings.firstChoice = inp.value.trim().slice(0, 20); saveNow(); toast('第1志望を保存した'); el.querySelector('.pa-save')?.replaceWith(savingsBox(el)); }, 'primary small')),
    h('div', { class: 'rw-log' }, sv.log.slice(-8).reverse().map((x) => h('div', {}, `${x.date.slice(5).replace('-', '/')}　+${yen(x.yen)}　${x.why}`))));
}

// 📓 ノートチェック: いつ見せたか・何をあげたか
function noteBox() {
  const list = noteList().filter((x) => x.at >= Date.now() - 14 * dayMs);
  const fmt = (t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]})`; };
  return h('div', { class: 'pa-card' },
    h('h3', { class: 'pa-h' }, '📓 ノート・ワークチェック', h('small', {}, `この14日 ${list.length}回`)),
    list.length ? h('div', { class: 'pa-list' }, list.slice(0, 10).map((x) => h('div', { class: 'pa-row' }, h('span', {}, `${fmt(x.at)}${x.comment ? `「${x.comment}」` : ''}`), h('b', {}, x.give.length ? giftText(x.give) : 'ほめた'))))
      : h('p', { class: 'note' }, 'まだありません。'),
    h('small', { class: 'note' }, '弟さんがホームの「📓 ノート・ワークを家族に見せる」を押したら、ノートやワークを見て、合言葉を入れてごほうびをえらんでください。🎓 合格貯金もふやせます（合計の上限 ¥100,000 まで）。ここであげた分は、💎の2時間の上限や、景品ポイントの週の上限には入りません。'));
}

// 📮 届いた要望: 「見た」「対応した」の印・まとめてコピー（Claude に貼りつけて直してもらう）
function feedbackBox(el) {
  const list = fbList();
  const redo = () => el.querySelector('.pa-fb')?.replaceWith(feedbackBox(el));
  const open = list.filter((f) => f.status !== 'done');
  const ST = { new: '🆕 新しい', seen: '👀 見た', done: '✅ 対応した' };
  const next = { new: 'seen', seen: 'done', done: 'new' };
  const fmt = (t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const copy = async () => {
    const text = open.map((f, i) => `${i + 1}. ${fbText(f)}`).join(String.fromCharCode(10).repeat(2));
    try { await navigator.clipboard.writeText(text); toast('コピーした。Claude に貼りつけてね', 2200); } catch { toast('コピーできなかった'); }
  };
  return h('div', { class: 'pa-card pa-fb' },
    h('h3', { class: 'pa-h' }, '📮 届いた要望', h('small', {}, `まだ対応していない ${open.length}件`)),
    list.length ? h('div', { class: 'pa-list' }, list.slice(0, 15).map((f) => h('div', { class: `pa-fbrow st-${f.status}` },
      h('div', {}, h('b', {}, FB_KINDS[f.kind] || f.kind), h('small', {}, `　${fmt(f.at)}・${f.where}`)),
      f.text && h('p', {}, f.text),
      f.err && h('small', { class: 'note' }, `エラー: ${f.err}`),
      btn(ST[f.status], () => { f.status = next[f.status]; saveNow(); redo(); }, 'ghost small'))))
      : h('p', { class: 'note' }, 'まだ届いていません。弟さんは 設定 →「📮 要望を送る」か、問題をまちがえたときの 📮 から送れます。'),
    open.length > 0 && btn('📋 対応していない要望をまとめてコピー', copy, 'primary small'));
}

// 🍬 景品ポイント: 残り・今週・景品リストの登録（ここで登録した物を、弟さんが「景品」タブからたのむ）
function pointBox(el) {
  const p = PT.pts();
  const name = h('input', { class: 'mr-input', type: 'text', maxlength: '30', placeholder: '名前（例: ポテチ）' });
  const pt = h('input', { class: 'mr-input', type: 'number', inputmode: 'numeric', min: '1', placeholder: 'pt' });
  const redo = () => el.querySelector('.pa-points')?.replaceWith(pointBox(el));
  const wait = p.reqs.filter((r) => r.status === 'wait');
  const used30 = p.log.filter((e) => (e.key === 'use' || e.key === 'adj') && e.at >= Date.now() - 30 * dayMs).reduce((a, e) => a - e.pt, 0);
  return h('div', { class: 'pa-card pa-points' },
    h('h3', { class: 'pa-h' }, '🍬 景品ポイント', h('small', {}, `のこり ${p.bal}pt（予約中 ${PT.held()}pt）・今週 ${PT.weekEarned()}/${PT.WEEK_CAP}pt${PT.weekConvPt() ? `＋解除券から${PT.weekConvPt()}pt` : ''}・この30日で使った ${used30}pt`)),
    wait.length > 0 && h('p', { class: 'note' }, `⏳ たのまれている: ${wait.map((r) => `${r.name}${r.pt ? `（${r.pt}pt）` : ''}`).join('、')}。渡したら、弟さんの「コレクション → 🍬 景品」で「渡した」を押して合言葉を入れてください。`),
    h('b', {}, '景品リスト'),
    p.catalog.length ? h('div', { class: 'pa-list' }, p.catalog.map((it) => h('div', { class: 'pa-row' }, h('span', {}, it.name), h('b', {}, `${it.pt}pt`), btn('消す', () => { PT.removeItem(it.id); redo(); }, 'ghost small')))) : h('p', { class: 'note' }, 'まだありません。下から追加してください。'),
    h('div', { class: 'pa-add' }, name, pt, btn('追加', () => { if (!PT.addItem(name.value, pt.value)) return toast('名前と pt を入れてください'); redo(); }, 'primary small')),
    h('b', {}, 'ポイントをへらす'),
    h('small', { class: 'note' }, 'アプリを通さずに景品を渡したときなどに。'),
    (() => {
      const why = h('input', { class: 'mr-input', type: 'text', maxlength: '30', placeholder: '理由（例: お菓子を買った）' });
      const n = h('input', { class: 'mr-input', type: 'number', inputmode: 'numeric', min: '1', placeholder: 'pt' });
      return h('div', { class: 'pa-add' }, why, n, btn('へらす', async () => {
        const v = Math.round(Number(n.value));
        if (!(v > 0)) return toast('pt を入れてください');
        if (!(await confirmBox(`${Math.min(v, p.bal)}pt へらす？`, `のこり ${p.bal}pt → ${Math.max(0, p.bal - v)}pt`, 'へらす', 'やめる'))) return;
        const got = PT.deductPt(v, why.value.trim());
        toast(got ? `🍬 −${got}pt` : 'へらせるポイントがない');
        redo();
      }, 'ghost small'));
    })());
}

// 勉強とカラー解除の比率（この7日）: 勉強1分あたり、カラー解除が何分か。1分以下（1対1以内）が目標
export function ratio7() {
  const s = S();
  const study = Math.round(pastDays(7).reduce((a, d) => a + (s.log[d]?.seconds || 0), 0) / 60);
  const color = rewardState().log.filter((x) => x.at >= Date.now() - 7 * dayMs).reduce((a, x) => a + x.min, 0);
  return { study, color, r: study ? color / study : null };
}
function ratioBox() {
  const { study, color, r } = ratio7();
  const ok = r === null ? color === 0 : r <= 1;
  return h('div', { class: `pa-card pa-ratio${ok ? '' : ' warn'}` },
    h('h3', { class: 'pa-h' }, '⚖️ 勉強 : カラー解除', h('small', {}, 'この7日・目標は 1対1 以内')),
    h('div', { class: 'pa-rbar' }, h('i', { class: 'st', style: { flex: `${Math.max(study, 1)}` } }, `勉強 ${study}分`), color > 0 && h('i', { class: 'co', style: { flex: `${color}` } }, `カラー ${color}分`)),
    h('p', { class: 'note' }, ...phrases(r === null ? (color ? `勉強の記録がないのに、カラー解除を ${color}分 使っています。` : 'まだ勉強もカラー解除もありません。') : `勉強1分あたり カラー解除 ${r.toFixed(2)}分（${ok ? '✅ 1対1 以内' : '⚠️ 1対1 をこえている'}）`)));
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
  const sv = savings();
  const nd = (s.next?.hist || []).filter((x) => x.date >= days[0]);
  lines.push(`🎯 次の一手 ${nd.length}回（${new Set(nd.map((x) => x.date)).size}日）｜🎓 合格貯金 ${yen(sv.bal)}`);
  const nts = noteList().filter((x) => x.at >= Date.now() - 7 * dayMs);
  if (nts.length) lines.push(`📓 ノート・ワークチェック ${nts.length}回`);
  const fbn = fbList().filter((f) => f.status === 'new').length;
  if (fbn) lines.push(`📮 新しい要望 ${fbn}件（おうちの人ページで見られます）`);
  const rt = ratio7();
  if (rt.r !== null) lines.push(`⚖️ 勉強 : カラー解除 = 1 : ${rt.r.toFixed(2)}（${rt.r <= 1 ? '1対1 以内' : '⚠️ 1対1 をこえている'}）`);
  const cs = colorStats(Date.now() - 7 * dayMs);
  if (cs.n) lines.push(`🎨 勉強カラー ${cs.n}回${cs.idle ? `（⚠️ そのあと勉強しなかった ${cs.idle}回）` : ''}`);
  const rd = readStats(days);
  if (rd) lines.push(`📖 解き方: 1回目のまちがいで開いた ${rd.rate ?? '—'}%・2回目の解き方を見ていた 平均${rd.avg2 ?? '—'}秒`);
  const P = PT.pts();
  const got = P.log.filter((e) => e.date >= days[0] && e.pt > 0).reduce((a, e) => a + e.pt, 0);
  const use = P.log.filter((e) => e.date >= days[0] && e.key === 'use');
  lines.push(`🍬 景品ポイント +${got}pt（のこり ${P.bal}pt）${use.length ? `｜交換: ${use.map((e) => e.label.replace(/^景品/, '')).join('、')}` : ''}`);
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
      savingsBox(el),
      noteBox(),
      feedbackBox(el),
      ratioBox(),
      gemBox(),
      readBox(),
      colorBox(),
      pointBox(el),
      rewardBox(),
      btn('◀ 設定にもどる', () => go('settings'), 'ghost')),
  );
}
