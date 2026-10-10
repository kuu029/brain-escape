// リスニングの問題の材料（模試の大問1 と、英語棟「リスニング」単元で使う）
//   SHORT: 短い対話（数字・人・曜日が毎回変わる）→ { lines, ask, correct, wrongs, evidence, why }
//   LONG: まとまった英語と3問 → { lines, qs: [...] }
const cap = (s) => s[0].toUpperCase() + s.slice(1);
// 分 → "2:30"（12時間制。放送でも「two thirty」と読まれる）
export const tm = (min) => `${Math.floor(min / 60) % 12 || 12}:${String(min % 60).padStart(2, '0')}`;
const W = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PEOPLE = [['Ken', 'he'], ['Tom', 'he'], ['Yumi', 'she'], ['Emma', 'she']];
const his = (pr) => (pr === 'he' ? 'his' : 'her');
// 3つ以上ちがう値から、正解とちがうものを3つ
function others(rng, correct, pool) {
  return rng.shuffle([...new Set(pool)].filter((x) => x !== correct)).slice(0, 3);
}

// ---------- 大問1 その1: 短い対話（毎回、数字・人・曜日が変わる） ----------
export const SHORT = [
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
  // 行き方（いつもとちがう）
  (rng) => {
    const place = rng.pick(['museum', 'library', 'stadium', 'zoo']);
    const usual = rng.pick(['by bike', 'on foot']);
    const today = rng.pick(['by bus', 'by train']);
    const lines = [
      { who: 'A', text: `How do you usually go to the ${place}?` },
      { who: 'B', text: `I usually go there ${usual}. But it's raining today, so I'll go ${today}.` },
      { who: 'A', text: 'That\'s a good idea.' },
    ];
    const all = ['by bike', 'on foot', 'by bus', 'by train'].map((x) => `${cap(x)}.`);
    const correct = `${cap(today)}.`;
    return { lines, ask: `How will B go to the ${place} today?`, correct, wrongs: all.filter((x) => x !== correct), evidence: [`so I'll go ${today}`], why: `いつもは ${usual} だけど、今日は雨なので ${today}。` };
  },
  // 天気予報（午前と午後）
  (rng) => {
    const [w1, w2, ...rest] = rng.shuffle(['sunny', 'cloudy', 'rainy', 'snowy']);
    const pm = rng.chance(0.5);
    const lines = [
      { who: 'A', text: 'What will the weather be like tomorrow?' },
      { who: 'B', text: `It will be ${w1} in the morning, but it will be ${w2} in the afternoon.` },
      { who: 'A', text: 'OK. Thank you.' },
    ];
    const ans = pm ? w2 : w1;
    const wrong = [pm ? w1 : w2, ...rest];
    return { lines, ask: `How will the weather be tomorrow ${pm ? 'afternoon' : 'morning'}?`, correct: `It will be ${ans}.`, wrongs: wrong.map((x) => `It will be ${x}.`), evidence: [`it will be ${w2} in the afternoon`, `It will be ${w1} in the morning`], why: `午前は ${w1}、午後は ${w2}。質問は${pm ? '午後' : '午前'}。` };
  },
  // 電話の伝言
  (rng) => {
    const [[n1, p1], [n2, p2]] = rng.shuffle([...PEOPLE]).slice(0, 2);
    const t = rng.pick([16 * 60, 17 * 60, 18 * 60, 19 * 60]);
    const askTime = rng.chance(0.5);
    const me = p1 === 'he' ? 'him' : 'her';
    const lines = [
      { who: 'A', text: `Hello, this is ${n1}. May I speak to ${n2}?` },
      { who: 'B', text: `Sorry, ${p2} is out now.` },
      { who: 'A', text: `Then, could you tell ${p2 === 'he' ? 'him' : 'her'} to call me back after ${tm(t)}?` },
      { who: 'B', text: 'Sure.' },
    ];
    if (askTime) return { lines, ask: `When should ${n2} call ${n1}?`, correct: `After ${tm(t)}.`, wrongs: others(rng, `After ${tm(t)}.`, [tm(t - 60), tm(t + 60), tm(t + 120), tm(t - 120)].map((x) => `After ${x}.`)), evidence: [`call me back after ${tm(t)}`], why: `call me back after ${tm(t)}（${tm(t)} すぎに電話してほしい）。` };
    return { lines, ask: `What does ${n1} want ${n2} to do?`, correct: `To call ${me} back.`, wrongs: [`To come to ${his(p1)} house.`, `To send ${me} an e-mail.`, `To wait at the station.`], evidence: ['call me back'], why: 'tell 人 to 〜 で「〜するように伝える」。call me back = 折り返し電話する。' };
  },
  // 道案内（となりの建物）
  (rng) => {
    const BLD = ['bank', 'hospital', 'station', 'park', 'library'];
    const [goal, next, ...rest] = rng.shuffle([...BLD]);
    const side = rng.pick(['left', 'right']);
    const corner = rng.pick(['first', 'second']);
    const lines = [
      { who: 'A', text: 'Excuse me. Where is the post office?' },
      { who: 'B', text: `Go straight and turn ${side} at the ${corner} corner. It's next to the ${next}.` },
      { who: 'A', text: 'Thank you very much.' },
    ];
    void goal;
    const correct = `Next to the ${next}.`;
    return { lines, ask: 'Where is the post office?', correct, wrongs: rest.slice(0, 3).map((x) => `Next to the ${x}.`), evidence: [`It's next to the ${next}`], why: `turn ${side} at the ${corner} corner のあと、It's next to the ${next}（${next} のとなり）。` };
  },
  // 買い物のたのまれごと
  (rng) => {
    const [x, y, z, w] = rng.shuffle(['eggs', 'milk', 'bread', 'apples', 'bananas', 'rice']);
    const lines = [
      { who: 'A', text: 'Mom, I\'m going to the supermarket. Do you need anything?' },
      { who: 'B', text: `Yes. Please buy some ${x} and ${y}. We still have some ${z}.` },
      { who: 'A', text: 'OK.' },
    ];
    return { lines, ask: 'What will the child buy at the supermarket?', correct: `${cap(x)} and ${y}.`, wrongs: [`${cap(x)} and ${z}.`, `${cap(z)} and ${y}.`, `${cap(w)} and ${z}.`], evidence: [`Please buy some ${x} and ${y}`], why: `買うのは ${x} と ${y}。${z} はまだ家にある。` };
  },
  // 練習の時間（平日と日曜）
  (rng) => {
    const thing = rng.pick(['the piano', 'the guitar', 'soccer', 'tennis']);
    const mins = rng.pick([20, 30, 40]);
    const hrs = rng.int(3, 5);
    const sun = rng.chance(0.5);
    const lines = [
      { who: 'A', text: `How long do you practice ${thing} every day?` },
      { who: 'B', text: `About ${mins} minutes on weekdays. On Sundays, I practice for ${W[hrs]} hours.` },
    ];
    const H = (k) => `For ${W[k]} hours.`;
    const M = (k) => `For ${k} minutes.`;
    const correct = sun ? H(hrs) : M(mins);
    const pool = [H(hrs), H(hrs - 1), H(hrs + 1), M(mins), M(mins + 10), M(mins + 30)];
    return { lines, ask: `How long does B practice ${thing} on ${sun ? 'Sundays' : 'weekdays'}?`, correct, wrongs: others(rng, correct, pool), evidence: [`About ${mins} minutes on weekdays`, `I practice for ${W[hrs]} hours`], why: `平日は ${mins}分、日曜は ${hrs}時間。質問は${sun ? '日曜' : '平日'}。` };
  },
];

// ---------- 大問1 その2: まとまった英語（3問） ----------
export const LONG = [
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
  // 図書館の案内
  (rng) => {
    const day = rng.pick(DAYS.slice(0, 5));
    const n = rng.int(3, 6);
    const close = rng.pick([6, 7]);
    const text = `Welcome to Midori City Library. We are open from nine a.m. to ${W[close]} p.m. every day except ${day}. You can borrow ${W[n]} books for two weeks. You cannot eat or drink in the library, but you can have something to drink in the garden. Please talk quietly. Thank you.`;
    const bk = (k) => `${cap(W[k])} books.`;
    return {
      lines: [{ who: 'A', text }],
      qs: [
        { ask: 'How many books can people borrow?', correct: bk(n), wrongs: others(rng, bk(n), [bk(n - 1), bk(n + 1), bk(n + 2), bk(2)]), evidence: [`borrow ${W[n]} books`], why: `${W[n]} books（${n}冊）を2週間。` },
        { ask: 'When is the library closed?', correct: `On ${day}.`, wrongs: DAYS.filter((d) => d !== day).slice(0, 3).map((d) => `On ${d}.`), evidence: [`every day except ${day}`], why: `every day except ${day}（${day} 以外は毎日あいている）。` },
        { ask: 'Where can people have something to drink?', correct: 'In the garden.', wrongs: ['In the library.', 'At the front desk.', 'In the reading room.'], evidence: ['you can have something to drink in the garden'], why: '館内は飲食できないが、garden（庭）なら飲み物を飲める。' },
      ],
    };
  },
];
