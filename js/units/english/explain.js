// 英語の文法問題の「解き方」を詳しくする: 生成器ごとの ルール（形）と まちがえやすい点。
// registry.js で英語の生成器をつつみ、steps を
//   📘 ルール → （もとの説明）→ ⚠️ 注意 → ✅ 完成した文（日本語）
// の順にする。もとの生成器は書きかえない
// [ルール, 注意（なくてもよい）]
const R = {
  // be動詞と一般動詞
  'eb-be': ['be動詞は主語で決まる: I → am ／ you・複数（we, they, ケンとユミ）→ are ／ 1人・1つ（he, she, it, ケン）→ is', '「です」でも、あとが動作（play など）なら be動詞は使わない'],
  'eb-general': ['一般動詞（play, like, have など）は「主語 ＋ 動詞 ＋ 〜」。be動詞（am / is / are）といっしょに使わない', 'I am play … はまちがい。I play … が正しい'],
  'eb-negq': ['否定文: be動詞なら「be動詞 ＋ not」、一般動詞なら「do not（don\'t）＋ 動詞」\n疑問文: be動詞なら be動詞を主語の前へ、一般動詞なら Do を文の頭に', '一般動詞の文に be動詞を入れない（Are you play …? はまちがい）'],
  'eb-order': ['英語の語順は「だれが（主語）→ どうする（動詞）→ 何を → どこで → いつ」。否定は動詞の前に not、疑問は be動詞か Do を先頭へ', '場所（at school）は時（after school）より前に置くことが多い'],
  // 3単現・can
  '3s-form': ['主語が3人称単数（he, she, it, ケン, my brother など、自分と相手以外の1人・1つ）で現在の文なら、動詞に s をつける', 'I と you は3人称ではない。we / they / ケンとユミ は複数なので s はつけない'],
  '3s-spell': ['s のつけ方: ふつうは ＋s ／ s, sh, ch, x, o で終わる → ＋es（goes, watches）／ 子音＋y → y を i にかえて ＋es（studies）／ have → has', 'play のように「母音＋y」はそのまま ＋s（plays）'],
  '3s-negq': ['3単現の否定は does not（doesn\'t）＋ 原形、疑問は Does ＋ 主語 ＋ 原形 …?', 'does を使ったら、動詞の s は does にうつる（Does he plays …? はまちがい）'],
  '3s-order': ['3単現の文: 主語 ＋ 動詞s ＋ 〜。否定・疑問は does を使い、動詞は原形にもどす', 'does と動詞s を両方使わない'],
  'can-form': ['can（〜できる）のあとは、主語が何でも動詞の原形。否定は cannot（can\'t）、疑問は Can を文の頭へ', 'He can plays … はまちがい（can のあとは s をつけない）'],
  // 複数形・代名詞
  'pl-form': ['2つ以上のものは名詞を複数形に（books, boxes）。数えられない名詞（water, money など）は複数形にしない', 'a / an は1つのときだけ。two a books はまちがい'],
  'pl-spell': ['複数形のつけ方: ふつうは ＋s ／ s, sh, ch, x で終わる → ＋es ／ 子音＋y → ies ／ 不規則（man → men, child → children など）', 'f / fe で終わる語は ves になるものが多い（knife → knives）'],
  pron: ['代名詞は文の中の役目で形がかわる: 主語（I, he）／「〜の」（my, his）／「〜を・に」（me, him）／「〜のもの」（mine, his）', '動詞や前置詞のあとは「〜を・に」の形（with him, like her）'],
  // 現在進行形
  'pg-form': ['現在進行形（今〜している）は「be動詞（am / is / are）＋ 動詞ing」', 'be動詞を忘れない（I playing … はまちがい）'],
  'pg-spell': ['ing のつけ方: ふつうは ＋ing ／ e で終わる → e をとって ＋ing（make → making）／ 短母音＋子音 → 子音を重ねて ＋ing（run → running, swim → swimming）', 'see → seeing のように ee で終わる語は e をとらない'],
  'pg-vs': ['「今している最中」なら現在進行形（be ＋ ing）、「いつも・毎日」なら現在形', 'now, look! があれば進行形、every day, usually があれば現在形'],
  'pg-order': ['進行形の語順: 主語 ＋ be動詞 ＋ 動詞ing ＋ 〜。否定は be動詞のあとに not、疑問は be動詞を先頭へ', ''],
  // 疑問詞
  'wh-choose': ['疑問詞は知りたいことで選ぶ: 何 what ／ だれ who ／ どこ where ／ いつ when ／ なぜ why ／ どう・どのくらい how ／ どれ which ／ だれの whose', 'how many（数）、how much（量・値段）、how old（年れい）のように how は組み合わせで意味がかわる'],
  'wh-answer': ['疑問詞の疑問文には Yes / No で答えない。聞かれたこと（場所・時・理由など）を答える', 'Why …? には Because …. で答えることが多い'],
  'wh-order': ['疑問詞の疑問文: 疑問詞 ＋ ふつうの疑問文の形（be動詞 / do・does ＋ 主語 ＋ 〜）?', '疑問詞はいつも文の先頭'],
  // 過去形
  'pa-reg': ['過去のこと（yesterday, last 〜, 〜 ago）は動詞を過去形に。規則動詞は ＋ed（played）／ e で終わる → ＋d ／ 子音＋y → ied ／ 短母音＋子音 → 子音を重ねて ＋ed（stopped）', '過去形は主語が何でも同じ形（3単現の s はつけない）'],
  'pa-irr': ['不規則動詞は形がかわる（go → went, eat → ate, see → saw など）。1つずつ覚える', 'read の過去形はつづりは同じ read で、読み方が「レッド」'],
  'pa-did': ['過去の否定は did not（didn\'t）＋ 原形、疑問は Did ＋ 主語 ＋ 原形 …?', 'did を使ったら動詞は原形にもどす（Did you went …? はまちがい）'],
  'pa-was': ['be動詞の過去形: I・3人称単数 → was ／ you・複数 → were', 'was / were の文に did は使わない'],
  'pa-order': ['過去の文: 主語 ＋ 過去形 ＋ 〜 ＋ 時（yesterday など）。否定・疑問は did ＋ 原形', ''],
  // 未来
  'fu-will': ['未来（〜するつもり・〜するだろう）は「will ＋ 動詞の原形」。主語が何でも will の形はかわらない', 'will のあとに s や ing はつけない'],
  'fu-going': ['be going to ＋ 原形（〜するつもり・〜しそう）。be動詞は主語に合わせる（I am / he is / they are）', 'be動詞を忘れない（I going to … はまちがい）'],
  'fu-negq': ['will の否定は will not（won\'t）＋ 原形、疑問は Will を先頭へ。be going to は be動詞のあとに not、疑問は be動詞を先頭へ', ''],
  'fu-vs': ['すでに決めている予定 → be going to、その場で決めたこと・予想 → will が使われやすい', 'どちらのあとも動詞は原形'],
  'fu-order': ['未来の文: 主語 ＋ will ＋ 原形 ＋ 〜（または 主語 ＋ be going to ＋ 原形）', ''],
  // 過去進行形
  'ppg-form': ['過去進行形（そのとき〜していた）は「was / were ＋ 動詞ing」', 'I・3人称単数は was、you・複数は were'],
  'ppg-negq': ['否定は was / were のあとに not、疑問は Was / Were を先頭へ', ''],
  'ppg-order': ['過去進行形の語順: 主語 ＋ was / were ＋ 動詞ing ＋ 〜 ＋ 時（then, at that time など）', ''],
  // 助動詞
  'md-form': ['助動詞（can, must, may, should, will）のあとは、主語が何でも動詞の原形', 'must のあとも原形（He must studies … はまちがい）'],
  'md-meaning': ['must 〜しなければならない ／ must not 〜してはいけない ／ may 〜してもよい ／ should 〜すべき ／ have to 〜しなければならない（don\'t have to 〜しなくてよい）', 'must not と don\'t have to は意味がちがう'],
  'md-request': ['お願い: Can you 〜? / Will you 〜?（〜してくれる？）／ 許可: Can I 〜? / May I 〜?（〜してもいい？）／ 提案: Shall I 〜?（〜しましょうか）Shall we 〜?（〜しませんか）', ''],
  'md-order': ['助動詞の文: 主語 ＋ 助動詞 ＋ 原形 ＋ 〜。否定は助動詞のあとに not、疑問は助動詞を先頭へ', ''],
  // There is / are
  'th-form': ['「〜がある・いる」は There is ＋ 単数 ／ There are ＋ 複数。be動詞はうしろの名詞に合わせる', '過去なら There was / There were'],
  'th-q': ['疑問文は Is there 〜? / Are there 〜?、答えは Yes, there is. / No, there aren\'t. など', 'How many 〜 are there …? で「いくつありますか」'],
  'th-order': ['語順: There ＋ be動詞 ＋ もの・人 ＋ 場所（on the desk など）', ''],
  // 不定詞・動名詞
  'in-toing': ['動詞によって、あとが to ＋ 原形 か ing かが決まる: want, hope, decide → to ／ enjoy, finish, stop → ing ／ like, start → どちらもOK', 'enjoy to … はまちがい'],
  'in-purpose': ['to ＋ 原形 で「〜するために」（目的）。動詞のあとに置いて、なんのためにしたかを表す', 'to のあとは必ず原形'],
  'in-noun': ['to ＋ 原形 で「〜すること」（名詞のはたらき）。want to 〜（〜したい）、My dream is to 〜（夢は〜すること）', ''],
  'in-gersubj': ['動詞ing（動名詞）は「〜すること」。文の主語にもなる（Playing soccer is fun.）', '動名詞の主語は1つのこととして is を使う'],
  'in-order': ['不定詞・動名詞のかたまり（to ＋ 原形 ／ 動詞ing）を1つの名詞・目的として文に入れる', ''],
  // 比較
  'cp-er': ['2つを比べて「…より〜」は 形容詞・副詞の比較級（＋er）＋ than。長い語は more ＋ 原級', 'good → better、many / much → more は不規則'],
  'cp-est': ['3つ以上で「いちばん〜」は the ＋ 最上級（＋est）。長い語は the most ＋ 原級。範囲は in（場所・集団）／ of（数・all）', 'good → the best'],
  'cp-as': ['「…と同じくらい〜」は as ＋ 原級 ＋ as。否定の not as 〜 as は「…ほど〜ではない」', 'as と as の間は原級（er をつけない）'],
  'cp-which': ['「AとBではどちらが〜？」は Which is 比較級, A or B? ／「いちばん〜なのはどれ？」は Which is the 最上級 …?', ''],
  'cp-order': ['比較の語順: 主語 ＋ 動詞 ＋ 比較級 ＋ than ＋ 相手（または the 最上級 ＋ in / of 〜）', ''],
  // 接続詞
  'cj-choose': ['when（〜するとき）／ if（もし〜なら）／ because（〜なので）／ that（〜ということ）。意味で選ぶ', 'because は理由、so は結果（〜なので…）'],
  'cj-if': ['if（もし〜なら）の中は、未来のことでも現在形を使う（If it rains tomorrow, …）', 'If it will rain … はまちがい'],
  'cj-when': ['when（〜するとき）のかたまりは文の前にも後ろにも置ける。前に置くときはカンマ（,）で区切る', 'when の中も、未来のことは現在形'],
  'cj-order': ['接続詞 ＋ 主語 ＋ 動詞 … で1つのかたまり。それを主な文の前か後ろにつなぐ', ''],
  // 受動態
  'ps-form': ['受動態（〜される）は「be動詞 ＋ 過去分詞」。だれによってかは by 〜', '過去分詞: 規則動詞は過去形と同じ（-ed）、不規則動詞は覚える（write → written）'],
  'ps-be': ['be動詞は主語と時で決まる: 現在 is / are、過去 was / were', '主語が複数なら are / were'],
  'ps-negq': ['受動態の否定は be動詞のあとに not、疑問は be動詞を先頭へ（Is this room cleaned …?）', 'do / did は使わない'],
  'ps-order': ['受動態の語順: 主語 ＋ be動詞 ＋ 過去分詞 ＋（by ＋ 人）＋ 場所・時', 'by の前に be動詞と過去分詞のかたまりを作る'],
  // 現在完了
  'pf-form': ['現在完了は「have / has ＋ 過去分詞」。主語が3人称単数なら has', ''],
  'pf-have': ['have / has は主語で決まる: I, you, 複数 → have ／ he, she, it, ケン → has', ''],
  'pf-forsince': ['継続（ずっと〜している）: for ＋ 期間の長さ（for three years）／ since ＋ 始まった時（since 2020, since last year）', '「3年間」は for、「2020年から」は since'],
  'pf-exp': ['経験（〜したことがある）: ever（今までに）、never（一度も〜ない）、once / twice / 〜 times（回数）、before（前に）', 'Have you ever 〜? → Yes, I have. / No, I haven\'t.'],
  'pf-done': ['完了（もう〜した・ちょうど〜したところ）: already（もう）、just（ちょうど）、yet（疑問文で「もう」、否定文で「まだ」）', 'yet は文の最後に置く'],
  'pf-vs': ['yesterday, last 〜, 〜 ago など「過去のある時」がはっきりしていたら過去形。今につながる「ずっと・もう・したことがある」は現在完了', '現在完了に yesterday などはいっしょに使わない'],
  'pf-how': ['How long have you 〜?（どのくらいの間〜？）→ For 〜. / Since 〜. ／ How many times have you 〜?（何回〜？）', ''],
  'pf-order': ['現在完了の語順: 主語 ＋ have / has ＋（never / already / just）＋ 過去分詞 ＋ 〜 ＋（for / since / yet）', ''],
  // 分詞
  'pt-form': ['名詞をうしろから説明: 「〜している（名詞）」は 名詞 ＋ 動詞ing、「〜された（名詞）」は 名詞 ＋ 過去分詞', 'the boy running there（走っている少年）／ a car made in Japan（日本で作られた車）'],
  'pt-order': ['名詞 ＋ ing / 過去分詞 ＋ 〜 で1つの大きな名詞のかたまりにしてから、文に入れる', ''],
  // 関係代名詞
  'rl-choose': ['関係代名詞は前の名詞（先行詞）で選ぶ: 人 → who ／ もの・動物 → which ／ どちらでも → that', ''],
  'rl-verb': ['関係代名詞が主語のとき、そのあとの動詞は先行詞に合わせる（a friend who lives …、friends who live …）', '先行詞が3人称単数なら動詞に s'],
  'rl-order': ['名詞 ＋ who / which / that ＋ 説明の文 で1つの名詞のかたまりにしてから、文に入れる', ''],
  // 間接疑問
  'id-choose': ['間接疑問（〜か知っている）: 疑問詞のあとはふつうの文の語順「疑問詞 ＋ 主語 ＋ 動詞」', 'I know where he lives.（where does he live にしない）'],
  'id-order': ['I know / Do you know ＋ 疑問詞 ＋ 主語 ＋ 動詞 …。do / does / did は消えて、動詞の形で時を表す', ''],
  // 仮定法
  'sj-if': ['仮定法過去（事実とちがう「もし〜なら」）: If ＋ 主語 ＋ 過去形, 主語 ＋ would / could ＋ 原形', 'be動詞は主語が何でも were（If I were you）'],
  'sj-would': ['仮定法のもう1つの文は would（〜するのに）／ could（〜できるのに）＋ 原形', ''],
  'sj-wish': ['I wish ＋ 主語 ＋ 過去形（〜ならいいのに）。今の事実とちがう願い', 'I wish I were …（be動詞は were）'],
  'sj-order': ['If ＋ 主語 ＋ 過去形 …, 主語 ＋ would / could ＋ 原形 … の2つのかたまりを作ってつなぐ', ''],
  // リスニング
  'ls-short': ['先に Question を読んで、聞きとるもの（時刻・場所・人数など）を決めてから聞く', 'But / so / Then のあとで予定が変わることが多い。最初に出た数字や曜日にとびつかない'],
  'ls-long': ['1人が話す長めの英語は、数字・場所・持ち物をメモするつもりで聞く', '似た数字（集合時刻と出発時刻など）が2つ以上出てくる。質問に合うほうを選ぶ'],
};

// 問題文から日本語の文をとり出す（「並べかえよう」などの指示文はのぞく）
const JA = /[ぁ-んァ-ヶ一-龠]/;
const INSTR = /並べかえよう|つづろう|選ぼう|答えよう|書こう|にしよう|入れよう/;
function jaOf(stem) {
  const lines = String(stem || '').replace(/<[^>]+>/g, '').split('\n').map((s) => s.trim()).filter(Boolean);
  return lines.find((s) => JA.test(s) && !INSTR.test(s) && !/[（(]\s*[)）]/.test(s)) || null;
}
const isSentence = (s) => /[A-Za-z]/.test(s) && /\s/.test(s.trim());

export function enrichSteps(id, p) {
  const r = R[id];
  if (!r || !p) return p;
  const [rule, warn] = r;
  const ans = String(p.answerText || '').replace(/<[^>]+>/g, '').trim();
  const ja = jaOf(p.stem);
  const done = isSentence(ans) ? `✅ 完成した文: ${ans}${ja ? `（${ja}）` : ''}` : null;
  return { ...p, steps: [`📘 ルール: ${rule}`, ...(p.steps || []), warn ? `⚠️ 注意: ${warn}` : null, done].filter(Boolean) };
}
export const EN_RULE_IDS = Object.keys(R);
