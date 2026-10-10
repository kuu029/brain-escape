// 記述問題（理由を短く書く）の組み立て。答えは「キーワードが入っているか」で採点する
//   keys: [[同じ意味の言葉…], …] … 各グループから1つ以上入っていれば正解
//   ng: 入っていたら不正解にする言葉（逆のことを書いたとき）
//   bad: テスト用の「まちがった答えの例」（不正解になることを確かめる）
export function writeQ(rng, bank, kind) {
  const w = rng.pick(bank);
  return {
    stem: `✏️ ${w.q}\n（短い文で書こう。キーワードが入っていれば正解）`,
    input: { kind: 'text', accept: [w.model], keys: w.keys, ng: w.ng || [], ph: '文で入力（漢字・ひらがなどちらでもOK）' },
    answer: w.model,
    answerText: w.model,
    hint: `入れたい言葉: ${w.keys.map((g) => `「${g[0]}」`).join('・')}`,
    steps: [`答えの例: ${w.model}`, `キーワード: ${w.keys.map((g) => g[0]).join('・')}`, w.why].filter(Boolean),
    check: { kind: 'kw', bad: w.bad, what: kind },
  };
}
