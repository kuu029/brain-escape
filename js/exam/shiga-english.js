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

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ul = (s) => esc(s).replace(/\[\[(.+?)\]\]/g, '<u>$1</u>');
const plain = (s) => String(s).replace(/\[\[(.+?)\]\]/g, '$1');
const cap = (s) => s[0].toUpperCase() + s.slice(1);
// 分 → "2:30"（12時間制。放送でも「two thirty」と読まれる）
const tm = (min) => `${Math.floor(min / 60) % 12 || 12}:${String(min % 60).padStart(2, '0')}`;
const W = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PEOPLE = [['Ken', 'he'], ['Tom', 'he'], ['Yumi', 'she'], ['Emma', 'she']];
const his = (pr) => (pr === 'he' ? 'his' : 'her');

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
// 3つ以上ちがう値から、正解とちがうものを3つ
function others(rng, correct, pool) {
  return rng.shuffle([...new Set(pool)].filter((x) => x !== correct)).slice(0, 3);
}

// ---------- 大問1 その1: 短い対話（毎回、数字・人・曜日が変わる） ----------
const SHORT = [
  // 待ち合わせの時刻（映画の時刻とまちがえやすい）
  (rng) => {
    const start = rng.pick([13 * 60 + 30, 14 * 60, 14 * 60 + 30, 15 * 60, 15 * 60 + 30, 16 * 60]);
    const meet = start - rng.pick([20, 30, 40]);
    const lines = [
      { who: 'A', text: `The movie starts at ${tm(start)}. Shall we meet at the station?` },
      { who: 'B', text: 'Sure. What time?' },
      { who: 'A', text: `How about ${tm(meet)}?` },
      { who: 'B', text: 'OK. See you then.' },
    ];
    return { lines, ask: 'What time will they meet at the station?', correct: tm(meet), wrongs: others(rng, tm(meet), [tm(start), tm(start + 30), tm(meet - 30), tm(meet + 10)]), evidence: [`How about ${tm(meet)}?`], why: `待ち合わせは ${tm(meet)}。${tm(start)} は映画が始まる時刻。` };
  },
  // ねだん（割引）
  (rng) => {
    const p = rng.pick([800, 1000, 1200, 1500, 2000]);
    const d = rng.pick([100, 200, 300]);
    const item = rng.pick(['T-shirt', 'cap', 'bag']);
    const lines = [
      { who: 'A', text: `Excuse me. How much is this ${item}?` },
      { who: 'B', text: `It's ${p} yen. But today, everything in this shop is ${d} yen cheaper.` },
      { who: 'A', text: 'Great. I\'ll take it.' },
    ];
    return { lines, ask: `How much is the ${item} today?`, correct: `${p - d} yen.`, wrongs: [`${p} yen.`, `${p + d} yen.`, `${d} yen.`], evidence: [`It's ${p} yen`, `${d} yen cheaper`], why: `${p}円 から ${d}円 安くなるので ${p - d}円。` };
  },
  // 曜日（最初に言った日はだめになる）
  (rng) => {
    const [d1, d2, d3, d4] = rng.shuffle([...DAYS]);
    const sport = rng.pick(['tennis', 'badminton', 'basketball']);
    const lines = [
      { who: 'A', text: `Let's play ${sport} on ${d1}.` },
      { who: 'B', text: `Sorry, I have to help my mother on ${d1}. How about ${d2}?` },
      { who: 'A', text: `OK. ${d2} is fine.` },
    ];
    return { lines, ask: `When will they play ${sport}?`, correct: `On ${d2}.`, wrongs: [`On ${d1}.`, `On ${d3}.`, `On ${d4}.`], evidence: [`How about ${d2}?`], why: `${d1} は用事があるので、${d2} になった。` };
  },
  // さがし物の場所
  (rng) => {
    const item = rng.pick(['racket', 'cap', 'dictionary', 'notebook']);
    const PL = ['under the bed', 'in the car', 'by the door', 'in the kitchen'];
    const place = rng.pick(PL);
    const lines = [
      { who: 'A', text: `Mom, have you seen my ${item}?` },
      { who: 'B', text: 'I saw it on the table this morning.' },
      { who: 'A', text: 'It\'s not there.' },
      { who: 'B', text: `Then how about ${place}?` },
      { who: 'A', text: 'Oh, here it is. Thank you.' },
    ];
    return { lines, ask: `Where was the ${item}?`, correct: `${cap(place)}.`, wrongs: ['On the table.', ...PL.filter((x) => x !== place).slice(0, 2).map((x) => `${cap(x)}.`)], evidence: [`how about ${place}?`, 'here it is'], why: `「${place}」を見て、「Oh, here it is.（あった）」と言っている。テーブルの上にはなかった。` };
  },
  // 人数（たし算）
  (rng) => {
    const n1 = rng.int(2, 4), n2 = rng.int(2, 4);
    const lines = [
      { who: 'A', text: 'How many people are coming to your birthday party?' },
      { who: 'B', text: `${cap(W[n1])} of my classmates and ${W[n2]} of my friends from the tennis club.` },
      { who: 'A', text: 'That\'s a lot! I\'ll make a big cake.' },
    ];
    const pool = [n1, n2, n1 + n2 + 1, n1 + n2 - 1, n1 + n2 + 2].map((n) => `${cap(W[n])} people.`);
    const correct = `${cap(W[n1 + n2])} people.`;
    return { lines, ask: 'How many people are coming to the party?', correct, wrongs: others(rng, correct, pool), evidence: [`of my classmates and ${W[n2]} of my friends`], why: `クラスメート ${n1}人 ＋ テニス部の友だち ${n2}人 = ${n1 + n2}人。` };
  },
  // 週末の予定（雨で変更）
  (rng) => {
    const [name, pr] = rng.pick(PEOPLE);
    const OUT = ['go fishing with {p} father', 'play soccer in the park', 'go to the beach'];
    const IN = ['visit {p} grandmother', 'study at the library', 'see a movie with {p} sister', 'clean {p} room'];
    const a1 = rng.pick(OUT);
    const [a2, ...rest] = rng.shuffle([...IN]);
    const me = (a) => a.replace('{p}', 'my');
    const they = (a) => `${cap(pr)} is going to ${a.replace('{p}', his(pr))}.`;
    const lines = [
      { who: 'A', text: `What are you going to do this weekend, ${name}?` },
      { who: 'B', text: `I wanted to ${me(a1)}, but it's going to rain. So I'm going to ${me(a2)}.` },
      { who: 'A', text: 'I see. Have a nice weekend.' },
    ];
    return { lines, ask: `What is ${name} going to do this weekend?`, correct: they(a2), wrongs: [they(a1), they(rest[0]), they(rest[1])], evidence: [`So I'm going to ${me(a2)}`], why: `雨なので、${me(a1)} はやめて ${me(a2)} にする。` };
  },
  // 好きな教科
  (rng) => {
    const [name] = rng.pick(PEOPLE);
    const [s1, s2, ...rest] = rng.shuffle(['math', 'science', 'music', 'history', 'art']);
    const lines = [
      { who: 'A', text: `Which subject do you like the best, ${name}?` },
      { who: 'B', text: `I like ${s1} the best. ${cap(s2)} is difficult for me, but our ${s2} teacher is very kind.` },
    ];
    return { lines, ask: `Which subject does ${name} like the best?`, correct: `${cap(s1)}.`, wrongs: [`${cap(s2)}.`, `${cap(rest[0])}.`, `${cap(rest[1])}.`], evidence: [`I like ${s1} the best`], why: `いちばん好きなのは ${s1}。${s2} は「むずかしい」と言っている。` };
  },
];

// ---------- 大問1 その2: まとまった英語（3問） ----------
const LONG = [
  // 先生の連絡（遠足）
  (rng) => {
    const PLACES = ['Hikone Castle', 'Nara Park', 'the science museum', 'the zoo'];
    const place = rng.pick(PLACES);
    const day = rng.pick(DAYS.slice(0, 5));
    const meet = rng.pick([8 * 60, 8 * 60 + 15, 8 * 60 + 30]);
    const leave = meet + rng.pick([15, 20]);
    const back = rng.pick([15 * 60, 15 * 60 + 30, 16 * 60]);
    const text = `Good morning, everyone. Next ${day}, we are going to visit ${place}. Please come to school by ${tm(meet)}. Our bus will leave at ${tm(leave)}. Please bring your lunch and something to drink. It may be cold, so please bring a jacket, too. We will come back to school at about ${tm(back)}.`;
    return {
      lines: [{ who: 'A', text }],
      qs: [
        { ask: 'What time will the bus leave?', correct: tm(leave), wrongs: others(rng, tm(leave), [tm(meet), tm(back), tm(leave + 15), tm(meet - 15)]), evidence: [`Our bus will leave at ${tm(leave)}`], why: `学校に来るのは ${tm(meet)}、バスが出るのは ${tm(leave)}。` },
        { ask: 'What do the students need to bring?', correct: 'Lunch, something to drink, and a jacket.', wrongs: ['Money, a camera, and a jacket.', 'Lunch and a camera.', 'Something to drink and a textbook.'], evidence: ['bring your lunch and something to drink', 'bring a jacket'], why: 'お弁当・飲み物・上着（寒いかもしれないので）。' },
        { ask: 'Where are the students going to visit?', correct: `${cap(place)}.`, wrongs: PLACES.filter((x) => x !== place).map((x) => `${cap(x)}.`), evidence: [`we are going to visit ${place}`], why: `we are going to visit ${place}` },
      ],
    };
  },
  // お店の放送
  (rng) => {
    const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
    const f = rng.int(2, 5);
    const event = rng.pick(['a magic show', 'a piano concert', 'a cooking class']);
    const t = rng.pick([11 * 60, 13 * 60, 14 * 60 + 30, 15 * 60]);
    const close = rng.pick([8, 9]);
    const text = `Thank you for shopping at Green Mall. Today is our tenth birthday. To say thank you, we will have ${event} on the ${ORD[f]} floor at ${tm(t)}. It's free. Also, all the bags on the first floor are twenty percent off today. Green Mall will close at ${close} p.m. today. Have a nice day.`;
    return {
      lines: [{ who: 'A', text }],
      qs: [
        { ask: `Where will they have ${event}?`, correct: `On the ${ORD[f]} floor.`, wrongs: others(rng, `On the ${ORD[f]} floor.`, ORD.slice(1).map((o) => `On the ${o} floor.`)), evidence: [`on the ${ORD[f]} floor`], why: `${event} は ${ORD[f]} floor（${f}階）。1階はかばんの売り場。` },
        { ask: `What time will ${event} start?`, correct: tm(t), wrongs: others(rng, tm(t), [tm(t + 30), tm(t - 60), `${close}:00`, tm(t + 120)]), evidence: [`at ${tm(t)}`], why: `at ${tm(t)}。${close}:00 は閉店の時刻。` },
        { ask: 'Which is true about Green Mall today?', correct: 'Bags on the first floor are cheaper.', wrongs: ['It is the mall\'s fifth birthday.', `People have to pay for ${event}.`, `The mall will close at ${close === 8 ? 9 : 8} p.m.`], evidence: ['bags on the first floor are twenty percent off'], why: '1階のかばんが 20% 引き。' },
      ],
    };
  },
  // ボランティアのスピーチ
  (rng) => {
    const [name, pr] = rng.pick(PEOPLE);
    const n = rng.int(3, 6);
    const place = rng.pick(['the beach', 'the park', 'the river']);
    const text = `Hello, I'm ${name}. Last summer, I joined a volunteer activity. We cleaned ${place} near our town ${W[n]} times. On the first day, we found a lot of plastic bottles. I was sad because some birds were eating plastic. Now I always carry my own bottle. Please join us next summer!`;
    const times = (k) => `${cap(W[k])} times.`;
    return {
      lines: [{ who: 'B', text }],
      qs: [
        { ask: `How many times did they clean ${place}?`, correct: times(n), wrongs: others(rng, times(n), [times(n - 1), times(n + 1), times(n + 2), times(2)]), evidence: [`${W[n]} times`], why: `${W[n]} times（${n}回）。` },
        { ask: `Why was ${name} sad?`, correct: 'Because some birds were eating plastic.', wrongs: ['Because it was very hot.', 'Because nobody joined the activity.', 'Because the bottles were too heavy.'], evidence: ['I was sad because some birds were eating plastic'], why: 'because のあとが理由。' },
        { ask: `What does ${name} always carry now?`, correct: `${cap(his(pr))} own bottle.`, wrongs: ['A plastic bag.', 'A camera.', 'Some pictures of birds.'], evidence: ['I always carry my own bottle'], why: 'Now I always carry my own bottle.' },
      ],
    };
  },
];

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
