// 入試本番モード: 滋賀県 公立高校入試（英語）の形に近づけた模試
//   50分・100点・大問4つ
//   ① リスニング（短い対話4つ ＋ まとまった英語1つ ＋ 質問に英語1文で答える）
//   ② 対話と資料（ポスター・時刻表・メニュー ＋ 文法の小問）
//   ③ スピーチの読解（＋ 自分の考えを英語で書く）
//   ④ 英作文（20語以上）
// 英語で書く問題は、紙に書いて本人か家族が採点する（q.paperAlways）
import { makeProblem, GEN } from '../units/registry.js';
import { makeRng } from '../core/rng.js';
import { textChoice } from '../units/english/kit-en.js';
import { DIALOGS, SPEECHES, WRITING, WRITING_RUBRIC, LISTEN_OWN } from './en-exam-data.js';
import { SHORT, LONG } from '../units/english/listen-bank.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ul = (s) => esc(s).replace(/\[\[(.+?)\]\]/g, '<u>$1</u>');
const plain = (s) => String(s).replace(/\[\[(.+?)\]\]/g, '$1');

// 選択式の問題。src: 答えをさがす本文（テストで evidence が本文にあるか確かめる）
function readQ(rng, { stem, correct, wrongs, evidence = [], src, why, kind = 'en-read' }) {
  return {
    stem,
    ...textChoice(rng, correct, wrongs.map((t) => ({ t }))),
    hint: kind === 'en-listen' ? '質問を先に読んでから聞くと、答えの部分を聞きのがしにくい。' : '設問の答えになる部分を、本文の中でさがそう。',
    steps: [why, ...evidence.slice(0, 1).map((e) => `本文: “${e}”`)].filter(Boolean),
    lang: 'english',
    check: { kind, evidence, src },
  };
}
const scriptText = (lines) => lines.map((l) => l.text).join('\n');

const GRAMMAR = ['rl-choose', 'ps-form', 'pt-form', 'sj-if', 'cj-choose', 'pf-form', 'id-choose', 'cp-which', 'sj-wish'].filter((g) => GEN[g]);

function paperQ(pts, ask, model, rubric, listen = null) {
  return {
    pts,
    paperAlways: true,
    listen,
    p: { stem: ask, input: { kind: 'paper' }, lang: 'english', check: { kind: 'paper' }, steps: [] },
    paper: { ask, model, rubric },
  };
}

function sec1(rng, mini) {
  const qs = rng.shuffle([...SHORT]).slice(0, 4).map((T, k) => {
    const t = T(rng);
    const lines = [...t.lines, { who: 'N', text: `Question: ${t.ask}` }];
    return {
      pts: 4,
      listen: { key: `a${k}`, lines },
      p: readQ(rng, { stem: `放送される対話を聞いて、質問の答えとして最も適切なものを選びなさい。\nQuestion: ${t.ask}`, correct: t.correct, wrongs: t.wrongs, evidence: t.evidence, src: scriptText(lines), why: t.why, kind: 'en-listen' }),
    };
  });
  if (!mini) {
    const L = rng.pick(LONG)(rng);
    const lines = [...L.lines, ...L.qs.map((q, k) => ({ who: 'N', text: `Question ${k + 1}: ${q.ask}` }))];
    const listen = { key: 'b', lines };
    for (const q of L.qs) {
      qs.push({ pts: 4, listen, p: readQ(rng, { stem: `放送される英語を聞いて、質問の答えとして最も適切なものを選びなさい（(5)〜(7) は同じ放送）。\nQuestion: ${q.ask}`, correct: q.correct, wrongs: q.wrongs, evidence: q.evidence, src: scriptText(lines), why: q.why, kind: 'en-listen' }) });
    }
    const own = rng.pick(LISTEN_OWN);
    qs.push(paperQ(4, '放送される質問に対して、あなたの答えを英語1文で書きなさい。', [`質問: ${own.q}`, `答えの例: ${own.model}`], [{ text: '質問に合った答えになっている', pts: 2 }, { text: '主語と動詞のある英語1文で書けている', pts: 2 }], { key: 'c', lines: [{ who: 'N', text: `Question: ${own.q}` }] }));
  }
  return { title: 'リスニング', intro: '放送を聞いて答える問題です。🔊 のボタンで放送が流れます（本番と同じく、それぞれ2回まで）。', listening: true, qs };
}

function sec2(rng, seed) {
  const D = rng.pick(DIALOGS);
  const T = D.table;
  const table = `<table class="ex-table"><caption>${esc(T.caption)}</caption>${T.head.some(Boolean) ? `<tr>${T.head.map((x) => `<th>${esc(x)}</th>`).join('')}</tr>` : ''}${T.rows.map((r) => `<tr>${r.map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</table>`;
  const passage = `${table}${D.lines.map(([who, text]) => `<p><b>${esc(who)}:</b> ${ul(text)}</p>`).join('')}`;
  const src = [T.caption, ...T.head, ...T.rows.flat(), ...D.lines.map(([, t]) => plain(t))].join('\n');
  const qs = D.qs.map((q) => ({ pts: 4, p: readQ(rng, { stem: q.ask, correct: q.correct, wrongs: q.wrongs, evidence: q.evidence, src, why: q.why }) }));
  // 文法の小問（練習ウェーブと同じ問題。まちがえると単元の「復習」に出る）
  for (const g of rng.shuffle([...GRAMMAR]).slice(0, 2)) qs.push({ pts: 4, p: makeProblem(g, (seed + qs.length * 7919) >>> 0) });
  return { title: '対話と資料', intro: D.intro, passage, qs };
}

function sec3(rng, mini) {
  const Sp = rng.pick(SPEECHES);
  const passage = `${Sp.paras.map((x) => `<p>${ul(x)}</p>`).join('')}<p class="ex-notes">（注）${Sp.notes.map((n) => `${esc(n)}`).join('　')}</p>`;
  const src = Sp.paras.map(plain).join('\n');
  const qs = Sp.qs.map((q) => ({ pts: 4, p: readQ(rng, { stem: q.ask, correct: q.correct, wrongs: q.wrongs, evidence: q.evidence, src, why: q.why }) }));
  if (!mini) qs.push(paperQ(8, Sp.write.ask, Sp.write.model.map((x) => `例: ${x}`), [{ text: '2文以上書けている', pts: 2 }, { text: 'テーマに合った内容になっている', pts: 2 }, { text: '理由や具体的なことが書けている', pts: 2 }, { text: '意味が伝わらなくなるような文法・つづりのまちがいがない', pts: 2 }]));
  return { title: 'スピーチ', intro: Sp.intro, passage, qs };
}

function sec4(rng) {
  const w = rng.pick(WRITING);
  return {
    title: '英作文',
    intro: w.ask,
    passage: `<p class="ex-q-en">${esc(w.q)}</p>`,
    qs: [paperQ(16, `${w.ask}\n${w.q}`, [`例: ${w.model}`, `（${w.model.split(/\s+/).length}語）`], WRITING_RUBRIC)],
  };
}

// kind: 'full'（50分・大問4つ）| 'mini'（15分・リスニング4問＋読解1題）
export function buildShigaEnglish(kind, seed) {
  const rng = makeRng(seed);
  const secs = kind === 'mini'
    ? [sec1(rng, true), rng.chance(0.5) ? sec2(rng, seed) : sec3(rng, true)]
    : [sec1(rng, false), sec2(rng, seed), sec3(rng, false), sec4(rng)];
  secs.forEach((sec, i) => {
    sec.no = i + 1;
    sec.qs.forEach((q, j) => {
      q.id = `${i + 1}-${j + 1}`;
      q.label = `(${j + 1})`;
      if (!q.p.generatorId) Object.assign(q.p, { id: `exam-en-${seed}-${q.id}`, generatorId: null, seed, difficulty: 3, source: 'original' });
    });
  });
  return { subject: 'english', kind, seed, title: kind === 'mini' ? '英語 ミニ模試' : '英語 フル模試', minutes: kind === 'mini' ? 15 : 50, style: '滋賀県型', sections: secs };
}
