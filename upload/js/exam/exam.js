// 入試本番モード（模試）の共通部分: 組み立て・採点・答えの表示（DOMなし。テストからも使う）
import { checkAnswer } from '../core/check.js';
import { buildShigaMath } from './shiga-math.js';
import { buildShigaEnglish } from './shiga-english.js';
import { buildTermExam } from './term-exam.js';
import { buildJaExam } from './ja-exam.js';

export const EXAM_KINDS = {
  mini: { name: 'ミニ模試', minutes: 15, desc: '小問集合5問＋大問1つ。すき間時間に。' },
  full: { name: 'フル模試', minutes: 50, desc: '本番と同じ 大問4つ・100点。' },
};
// 教科ごとの説明
export const EXAM_DESC = {
  math: { mini: '小問集合5問＋大問1つ。すき間時間に。', full: '本番と同じ 大問4つ・100点。', about: '数学は 50分・100点・大問4つ（①小問集合 ②平面図形 ③関数と図形 ④空間図形）。' },
  english: { mini: 'リスニング4問＋読解1題。すき間時間に。', full: '本番に近い 大問4つ・100点（英作文つき）。', about: '英語は 50分・100点・大問4つ（①リスニング ②対話と資料 ③スピーチ ④英作文）。英語で書く問題は紙に書いて、あとで採点。' },
  ja: { mini: '漢字・言葉・文法10問＋読解1題。すき間時間に。', full: '説明文・物語・漢字・言葉と文法・古文漢文・作文の 大問6つ・100点。', about: '国語は 読解（説明的文章・文学的文章）、漢字の読み書き、言葉と文法、古文・漢文、作文。作文は紙に書いて、あとで採点。読解の文章は、このアプリのオリジナル。' },
  soc: { mini: '用語8問＋流れ4問。すき間時間に。', full: '用語20問＋流れ10問・100点。', about: '社会は、暗号室の用語と「流れでつなげる」から出る模試（全部選ぶ・ならべる問題なので自動で採点）。本番の資料問題・記述はまだ入っていない。' },
  sci: { mini: '用語8問＋流れ4問。すき間時間に。', full: '用語20問＋流れ10問・100点。', about: '理科は、暗号室の用語と「流れでつなげる」から出る模試（全部選ぶ・ならべる問題なので自動で採点）。本番の実験・計算問題はまだ入っていない。' },
};
export const SUBJECT_JA = { math: '数学', english: '英語', ja: '国語', soc: '社会', sci: '理科' };

export function buildExam(subject, kind, seed) {
  if (subject === 'math') return buildShigaMath(kind, seed);
  if (subject === 'english') return buildShigaEnglish(kind, seed);
  if (subject === 'ja') return buildJaExam(kind, seed);
  if (subject === 'soc' || subject === 'sci') return buildTermExam(subject, kind, seed);
  throw new Error(`未対応の教科: ${subject}`);
}
// 紙に書いて採点する問題か（数学の証明・作図は「紙モード」のときだけ。英作文はいつも）
export const isPaper = (q, paperMode) => !!q.paper && (paperMode || !!q.paperAlways);
export const allQs = (ex) => ex.sections.flatMap((sec) => sec.qs.map((q) => ({ ...q, sec })));

// 1問の採点。paperMode で紙に書く問題は marks（観点ごとの ✔）で点を出す
export function gradeQ(q, input, { paperMode = false, marks = null } = {}) {
  if (isPaper(q, paperMode)) {
    const got = q.paper.rubric.reduce((a, r, i) => a + (marks?.[i] ? r.pts : 0), 0);
    return { got, max: q.pts, ok: got === q.pts, paper: true, graded: !!marks };
  }
  if (input == null) return { got: 0, max: q.pts, ok: false, blank: true };
  const r = checkAnswer(q.p, input);
  if (q.p.input.kind === 'blanks') {
    const got = Math.round(q.pts * (r.part || 0));
    return { got, max: q.pts, ok: r.ok, part: r.part };
  }
  return { got: r.ok ? q.pts : 0, max: q.pts, ok: r.ok, note: r.nearly ? '値は合っているが、約分（簡単な形）になっていない' : null };
}

// 模試全体の採点
export function gradeExam(ex, rec) {
  const secs = ex.sections.map((sec) => ({ no: sec.no, title: sec.title, got: 0, max: 0 }));
  const items = [];
  for (const q of allQs(ex)) {
    const g = gradeQ(q, rec.answers[q.id], { paperMode: rec.paperMode, marks: rec.marks?.[q.id] });
    const s = secs[q.sec.no - 1];
    s.got += g.got;
    s.max += g.max;
    items.push({ q, g });
  }
  const got = secs.reduce((a, s) => a + s.got, 0);
  const max = secs.reduce((a, s) => a + s.max, 0);
  return { got, max, score100: Math.round((got / max) * 100), secs, items };
}

// 単元ごとの失点（多い順）→ 「ここを復習」
export function weakUnits(items, n = 4) {
  const lost = {};
  for (const { q, g } of items) if (q.p.unit && g.got < g.max) lost[q.p.unit] = (lost[q.p.unit] || 0) + (g.max - g.got);
  return Object.entries(lost).sort((a, b) => b[1] - a[1]).slice(0, n).map(([unit, pts]) => ({ unit, pts }));
}

// 入力した答えを、表示用の文字列（$…$ つき）にする
export function inputText(p, input) {
  if (input == null) return '（無答）';
  const k = p.input.kind;
  if (k === 'choice') return p.input.text ? p.input.choices[input] : `$${p.input.choices[input]}$`;
  if (k === 'order') return input.map((i) => p.input.tiles[i]).join(' → ');
  if (k === 'blanks') return p.input.blanks.map((b) => `${b.key}: ${b.options[input[b.key]] ?? '？'}`).join('、');
  if (k === 'num') {
    return p.input.fields.map((f) => {
      const v = String(input[f.key] ?? '');
      const neg = v.startsWith('-');
      const body = neg ? v.slice(1) : v;
      const t = body.includes('/') ? `\\frac{${body.split('/')[0]}}{${body.split('/')[1]}}` : body;
      const head = f.text !== undefined ? (f.text ? `${f.text} ` : '') : `$${f.label}=$`;
      return `${head}$${neg ? '-' : ''}${t}$${f.suffix || ''}`;
    }).join('、');
  }
  return String(input);
}
