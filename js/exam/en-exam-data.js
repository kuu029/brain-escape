// 英語の模試で使う英文（読解・英作文）。手で書いた文章なので、増やすときはここに足す
// 下線は [[ ]]、注は notes。設問の evidence は「本文のどこに答えがあるか」（テストで本文にあるか確かめる）
// 設問: { ask, correct, wrongs: [..3つ], evidence: [本文の一部…], why: 解説 }

// ---------- 大問2: 対話と資料 ----------
export const DIALOGS = [
  {
    id: 'library',
    intro: '中学生のハルトと ALT のグリーン先生が、図書館のポスターを見ながら話しています。ポスターと対話を読んで、あとの問いに答えなさい。',
    table: {
      caption: 'Minami Library - Events This Weekend',
      head: ['Event', 'Day', 'Time', 'Fee'],
      rows: [
        ['Story Time (for children)', 'Saturday', '10:00 - 11:00', 'free'],
        ['Origami Class', 'Saturday', '13:00 - 14:30', '200 yen'],
        ['English Book Club', 'Sunday', '14:00 - 15:00', 'free'],
        ['Movie Day', 'Sunday', '10:00 - 12:00', 'free'],
      ],
    },
    lines: [
      ['Ms. Green', 'Haruto, look at this poster. The library has some interesting events this weekend.'],
      ['Haruto', 'Oh, the Origami Class looks fun. I want to join it, but I have soccer practice on Saturday afternoon.'],
      ['Ms. Green', 'That\'s too bad. How about the English Book Club? You like reading, right?'],
      ['Haruto', 'Yes, but my English isn\'t very good.'],
      ['Ms. Green', 'Don\'t worry. You can read easy books there. ( A ) don\'t we go together?'],
      ['Haruto', 'That\'s a good idea. Can I bring my sister? She is six years old.'],
      ['Ms. Green', 'Sure. She can enjoy Story Time on Saturday morning, too.'],
      ['Haruto', 'Great. I\'ll tell her about it tonight.'],
    ],
    qs: [
      { ask: 'Why can\'t Haruto join the Origami Class?', correct: 'Because he has soccer practice.', wrongs: ['Because it is not free.', 'Because his English is not good.', 'Because he has to take care of his sister.'], evidence: ['soccer practice on Saturday afternoon'], why: 'ハルトは「土曜日の午後にサッカーの練習がある」と言っている。' },
      { ask: 'ポスターによると、ハルトとグリーン先生がいっしょに行くイベントは何時に始まりますか。', correct: '午後2時', wrongs: ['午前10時', '午後1時', '午後3時'], evidence: ['English Book Club', '14:00 - 15:00'], why: '2人が行くのは English Book Club（日曜日 14:00 から）。' },
      { ask: '対話の ( A ) に入る最も適切な語はどれですか。', correct: 'Why', wrongs: ['What', 'How', 'When'], evidence: ['( A ) don\'t we go together?'], why: 'Why don\'t we 〜? で「〜しませんか」とさそう言い方。' },
      { ask: '対話とポスターの内容に合うものはどれですか。', correct: 'ハルトの妹は、土曜日の朝のイベントに参加できる。', wrongs: ['English Book Club に参加するには 200円かかる。', 'ハルトは英語の本を読むのがとても得意だ。', 'Movie Day は土曜日に開かれる。'], evidence: ['Story Time on Saturday morning'], why: 'Story Time（子ども向け）は土曜日の 10:00 から。' },
    ],
  },
  {
    id: 'train',
    intro: '留学生のエマとユキが、日曜日に京都の博物館へ行く相談をしています。時刻表と対話を読んで、あとの問いに答えなさい。',
    table: {
      caption: 'Train Timetable (Kusatsu to Kyoto)',
      head: ['Train', 'Leaves Kusatsu', 'Arrives at Kyoto'],
      rows: [
        ['Local', '8:05', '8:40'],
        ['Rapid', '8:20', '8:45'],
        ['Local', '8:35', '9:10'],
        ['Rapid', '8:50', '9:15'],
      ],
    },
    lines: [
      ['Emma', 'Yuki, what time should we meet at Kusatsu Station on Sunday?'],
      ['Yuki', 'The museum in Kyoto opens at 9:30. It takes about ten minutes to walk there from Kyoto Station.'],
      ['Emma', 'Then we should arrive at Kyoto by 9:15, right?'],
      ['Yuki', 'Yes. But I want to buy a drink at the station before we walk, so let\'s take a train that arrives before 9:00.'],
      ['Emma', 'OK. The rapid train is faster. Let\'s take that one.'],
      ['Yuki', 'Good idea. Then let\'s meet at the station ten minutes before it leaves.'],
      ['Emma', 'All right. See you on Sunday!'],
    ],
    qs: [
      { ask: 'Which train will they take?', correct: 'The rapid train that leaves at 8:20.', wrongs: ['The local train that leaves at 8:05.', 'The local train that leaves at 8:35.', 'The rapid train that leaves at 8:50.'], evidence: ['arrives before 9:00', 'The rapid train is faster', '8:20'], why: '9:00 より前に着く快速（Rapid）は 8:20 発（8:45 着）。' },
      { ask: '2人は草津駅で何時に待ち合わせますか。', correct: '8時10分', wrongs: ['8時20分', '8時5分', '8時40分'], evidence: ['ten minutes before it leaves'], why: '乗る電車は 8:20 発。その10分前なので 8:10。' },
      { ask: 'How long does it take to walk from Kyoto Station to the museum?', correct: 'About ten minutes.', wrongs: ['About twenty minutes.', 'About thirty minutes.', 'About forty minutes.'], evidence: ['about ten minutes to walk'], why: 'It takes about ten minutes to walk there と言っている。' },
      { ask: '対話と時刻表の内容に合うものはどれですか。', correct: '博物館は午前9時30分に開く。', wrongs: ['2人は土曜日に京都へ行く。', 'エマは各駅停車（Local）に乗りたいと言った。', 'ユキは京都駅で昼ご飯を買いたい。'], evidence: ['opens at 9:30'], why: 'The museum in Kyoto opens at 9:30.' },
    ],
  },
  {
    id: 'cafe',
    intro: '中学生のアオイと ALT のスミス先生が、カフェでメニューを見ながら話しています。メニューと対話を読んで、あとの問いに答えなさい。',
    table: {
      caption: 'Cafe Biwa - Menu',
      head: ['Food / Drink', 'Price'],
      rows: [
        ['Sandwich', '450 yen'],
        ['Curry and Rice', '700 yen'],
        ['Pancakes', '500 yen'],
        ['Orange Juice', '200 yen'],
        ['Tea', '150 yen'],
        ['Lunch Set (11:00 - 14:00): Sandwich or Pancakes + a drink', '100 yen off'],
      ],
    },
    lines: [
      ['Aoi', 'Mr. Smith, this cafe is popular among students. What will you have?'],
      ['Mr. Smith', 'I\'m very hungry. I\'ll have the curry and rice.'],
      ['Aoi', 'I\'ll have the pancakes and orange juice. It\'s 12:30 now, so I can get the lunch set.'],
      ['Mr. Smith', 'That\'s nice. Do you often come here?'],
      ['Aoi', 'Yes. I come here with my friends after school. We study together here on Fridays.'],
      ['Mr. Smith', 'That sounds fun. Next time, I want to try the pancakes, too.'],
    ],
    qs: [
      { ask: 'アオイが払う金額はいくらですか。', correct: '600円', wrongs: ['700円', '800円', '500円'], evidence: ['Pancakes', 'Orange Juice', '100 yen off'], why: 'パンケーキ 500円 ＋ オレンジジュース 200円 − ランチセット 100円 = 600円。' },
      { ask: 'What does Aoi do at the cafe on Fridays?', correct: 'She studies with her friends.', wrongs: ['She works at the cafe.', 'She eats curry with Mr. Smith.', 'She reads books alone.'], evidence: ['We study together here on Fridays'], why: 'We study together here on Fridays.' },
      { ask: 'アオイがランチセットを注文できるのはなぜですか。', correct: '今が午後12時30分だから。', wrongs: ['学生は毎日割引があるから。', 'スミス先生がカレーを注文したから。', '金曜日だから。'], evidence: ['It\'s 12:30 now', '11:00 - 14:00'], why: 'ランチセットは 11:00〜14:00。今は 12:30。' },
      { ask: '対話とメニューの内容に合うものはどれですか。', correct: 'スミス先生は、次はパンケーキを食べてみたい。', wrongs: ['アオイはカレーライスを注文した。', 'ランチセットは一日中注文できる。', 'スミス先生はこのカフェによく来る。'], evidence: ['I want to try the pancakes'], why: 'Next time, I want to try the pancakes, too.' },
    ],
  },
];

// ---------- 大問3: スピーチ ----------
export const SPEECHES = [
  {
    id: 'rice',
    intro: '中学生が英語の授業で行ったスピーチです。読んで、あとの問いに答えなさい。',
    paras: [
      'Hello, everyone. Today I want to talk about my grandfather. He lives in Takashima, near Lake Biwa, and he has been a rice farmer for fifty years.',
      'Last summer, I stayed at his house for a week. Every morning, he got up at five and went to his rice field. I went with him. The work was very hard, and I was tired after only one hour. But my grandfather didn\'t stop. He said, "Rice is like my family. I have to take care of it every day."',
      'One day, he showed me some small fish in the water of the rice field. He said, "Clean water from the mountains comes to this field. Then it goes to Lake Biwa. So we must keep the water clean." [[I was surprised.]] I didn\'t know that rice fields and the lake were connected.',
      'Now I often think about the food on my table. Many people work hard to make it. I want to learn more about farming and protect the nature of Shiga. Thank you for listening.',
    ],
    notes: ['farmer 農家', 'connected つながっている'],
    qs: [
      { ask: 'How long has the speaker\'s grandfather been a rice farmer?', correct: 'For fifty years.', wrongs: ['For five years.', 'For fifteen years.', 'For one week.'], evidence: ['rice farmer for fifty years'], why: 'he has been a rice farmer for fifty years' },
      { ask: 'What did the speaker do last summer?', correct: 'The speaker stayed at the grandfather\'s house for a week.', wrongs: ['The speaker swam in Lake Biwa every day.', 'The speaker caught many fish in a river.', 'The speaker worked at a restaurant.'], evidence: ['I stayed at his house for a week'], why: 'Last summer, I stayed at his house for a week.' },
      { ask: '下線部 I was surprised. とありますが、話し手が驚いたのはなぜですか。', correct: '田んぼと琵琶湖がつながっていると知らなかったから。', wrongs: ['祖父が毎朝5時に起きていたから。', '田んぼの仕事がとても大変だったから。', '山の水がとても冷たかったから。'], evidence: ['I didn\'t know that rice fields and the lake were connected'], why: '下線部のすぐあとに理由がある。' },
      { ask: 'スピーチの内容に合うものはどれですか。', correct: '話し手は、1時間働いただけで疲れてしまった。', wrongs: ['祖父は毎朝7時に起きていた。', '話し手は祖父に魚のとり方を教えた。', '祖父は米づくりをやめたいと思っている。'], evidence: ['I was tired after only one hour'], why: 'I was tired after only one hour.' },
      { ask: 'このスピーチのタイトルとして最も適切なものはどれですか。', correct: 'What I Learned from My Grandfather', wrongs: ['My Trip to Tokyo', 'How to Cook Rice', 'My Favorite Fish'], evidence: ['I want to learn more about farming'], why: '祖父との体験から学んだことを話している。' },
    ],
    write: {
      ask: 'あなたが自然を守るためにできることを、英語2文以上で書きなさい。理由も書くこと。',
      model: ['I can pick up trash when I go to the lake. If the lake is clean, fish and birds can live there.', 'I can use my own bag when I go shopping. We can use fewer plastic bags.'],
    },
  },
  {
    id: 'mistake',
    intro: '中学生がクラスで行ったスピーチです。読んで、あとの問いに答えなさい。',
    paras: [
      'Hi, everyone. I\'m a member of the basketball team. Today I\'d like to talk about a mistake I made last year.',
      'Last October, we had an important game. In the last minute, our team was losing by one point. My teammate passed the ball to me, and I shot it. But I missed. We lost the game, and I cried all the way home.',
      'The next day, I didn\'t want to go to practice. But our captain, Riku, came to my classroom. He said, "Everyone makes mistakes. The important thing is what you do next." [[His words gave me courage.]]',
      'After that, I practiced shooting for thirty minutes every morning before school. I also started to talk more with my teammates during games. This spring, we won the city tournament. I scored the last points in the final game.',
      'From this experience, I learned that a mistake can be a chance to grow. If you make a mistake, don\'t give up. Thank you.',
    ],
    notes: ['mistake まちがい・失敗', 'courage 勇気', 'tournament 大会'],
    qs: [
      { ask: 'When did the speaker\'s team have an important game?', correct: 'Last October.', wrongs: ['This spring.', 'Last summer.', 'Last December.'], evidence: ['Last October, we had an important game'], why: 'Last October, we had an important game.' },
      { ask: 'Who came to the speaker\'s classroom?', correct: 'Riku, the captain of the team.', wrongs: ['The speaker\'s teacher.', 'The speaker\'s mother.', 'A member of another team.'], evidence: ['our captain, Riku, came to my classroom'], why: 'our captain, Riku, came to my classroom' },
      { ask: '下線部 His words gave me courage. の His words の内容として最も適切なものはどれですか。', correct: '失敗はだれにでもあり、大切なのはその次に何をするかだということ。', wrongs: ['試合に負けたのは話し手のせいだということ。', '毎朝30分シュートの練習をするべきだということ。', 'バスケットボール部をやめてもよいということ。'], evidence: ['Everyone makes mistakes. The important thing is what you do next.'], why: '下線部の直前のリクの言葉。' },
      { ask: 'スピーチの内容に合うものはどれですか。', correct: '話し手は毎朝、学校の前にシュートの練習をした。', wrongs: ['話し手のチームは去年の10月の試合に勝った。', 'リクは試合の最後にシュートを外した。', '話し手のチームは市の大会で負けた。'], evidence: ['I practiced shooting for thirty minutes every morning before school'], why: 'I practiced shooting for thirty minutes every morning before school.' },
      { ask: '話し手がいちばん伝えたいことはどれですか。', correct: 'A mistake can be a chance to grow.', wrongs: ['Basketball is the most popular sport.', 'You should not talk during games.', 'Winning is the only important thing.'], evidence: ['a mistake can be a chance to grow'], why: '最後の段落に「学んだこと」がまとめてある。' },
    ],
    write: {
      ask: 'あなたががんばったことや、失敗から学んだことについて、自分の経験を英語2文以上で書きなさい。',
      model: ['I practiced the piano every day for the chorus contest. I learned that practice makes me better.', 'I forgot my homework last week. Now I check my bag every night.'],
    },
  },
  {
    id: 'homestay',
    intro: '中学生が英語の授業で行ったスピーチです。読んで、あとの問いに答えなさい。',
    paras: [
      'Hello. Last summer, I went to Australia and stayed with a host family for two weeks. Before I left Japan, I was worried because I couldn\'t speak English well.',
      'On the first day, my host mother asked me a lot of questions at dinner. I understood some of them, but I couldn\'t answer well. I just smiled and said, "Yes." After dinner, I felt sad.',
      'The next morning, my host sister, Mia, showed me some pictures of her favorite places. She spoke slowly and used easy words. She also used gestures to explain things. I tried to talk with her by using pictures and gestures, too. Little by little, I enjoyed talking with my host family.',
      'On the last day, Mia gave me a letter. It said, "You were a great sister. Please come back again." I was very happy.',
      'From this experience, I learned that we can communicate even if our English is not perfect. Trying to understand each other is the most important thing.',
    ],
    notes: ['host family ホストファミリー', 'gesture 身ぶり', 'communicate 気持ちを伝え合う', 'perfect 完ぺきな'],
    qs: [
      { ask: 'How long did the speaker stay in Australia?', correct: 'For two weeks.', wrongs: ['For two days.', 'For one month.', 'For one year.'], evidence: ['for two weeks'], why: 'stayed with a host family for two weeks' },
      { ask: '話し手が日本を出る前に心配していたのはなぜですか。', correct: '英語をうまく話せなかったから。', wrongs: ['家族と離れるのがさびしかったから。', '飛行機に乗るのがこわかったから。', 'ホストファミリーの写真がなかったから。'], evidence: ['because I couldn\'t speak English well'], why: 'I was worried because I couldn\'t speak English well.' },
      { ask: 'What did Mia do the next morning?', correct: 'She showed the speaker pictures of her favorite places.', wrongs: ['She wrote a letter to the speaker.', 'She asked the speaker many questions at dinner.', 'She took the speaker to the beach.'], evidence: ['showed me some pictures of her favorite places'], why: 'Mia, showed me some pictures of her favorite places.' },
      { ask: 'スピーチの内容に合うものはどれですか。', correct: 'ミアはゆっくり話し、簡単な言葉を使った。', wrongs: ['話し手は、最初の夕食の質問にすべて答えられた。', '話し手は、帰る前にミアに手紙を書いた。', 'ホストマザーは日本語を話すことができた。'], evidence: ['She spoke slowly and used easy words'], why: 'She spoke slowly and used easy words.' },
      { ask: 'このスピーチのタイトルとして最も適切なものはどれですか。', correct: 'Trying to Understand Each Other', wrongs: ['The Best Food in Australia', 'How to Write a Letter', 'My Trip to a Big Zoo'], evidence: ['Trying to understand each other is the most important thing'], why: '最後の文がいちばん伝えたいこと。' },
    ],
    write: {
      ask: '外国から来た人と話すとき、あなたが気をつけたいことを、英語2文以上で書きなさい。理由も書くこと。',
      model: ['I will speak slowly and use easy words. Then the person can understand me easily.', 'I will use gestures and pictures. They help us communicate.'],
    },
  },
];

// ---------- 大問4: 英作文（20語以上） ----------
export const WRITING = [
  { ask: 'ALT の先生から、次の質問をされました。あなたの考えを、理由をふくめて 20語以上の英語で書きなさい。', q: 'Which do you like better, summer or winter? Why?', model: 'I like summer better than winter. I can swim in Lake Biwa with my friends in summer. Also, summer vacation is long, so I can enjoy many things.' },
  { ask: '外国から来た友だちに、滋賀県のおすすめの場所を1つ紹介します。その場所とおすすめの理由を、20語以上の英語で書きなさい。', q: 'Please tell me a good place to visit in Shiga.', model: 'You should visit Hikone Castle. It is very old and beautiful. You can see Lake Biwa from the top of the castle. I am sure you will like it.' },
  { ask: 'ALT の先生から、次の質問をされました。あなたの考えを、理由をふくめて 20語以上の英語で書きなさい。', q: 'What do you want to be in the future? Why?', model: 'I want to be a nurse in the future. My mother is a nurse, and she helps many people. I want to help sick people like her.' },
  { ask: 'あなたの中学校生活でいちばんの思い出を、ALT の先生に伝えます。20語以上の英語で書きなさい。', q: 'What is your best memory of junior high school?', model: 'My best memory is the school trip to Tokyo. I visited many places with my friends. We talked a lot at night, and it was a lot of fun.' },
  { ask: 'ALT の先生から、次の質問をされました。あなたの考えを、理由をふくめて 20語以上の英語で書きなさい。', q: 'Which do you like better, reading books or watching movies? Why?', model: 'I like reading books better. When I read a book, I can imagine the story in my own way. I can also read books anywhere, for example, on the train.' },
  { ask: 'ALT の先生から、次の質問をされました。あなたの考えを、理由をふくめて 20語以上の英語で書きなさい。', q: 'What is the most important thing in your life? Why?', model: 'My friends are the most important thing in my life. When I am sad, they always talk with me. I can be happy when I am with them.' },
];
export const WRITING_RUBRIC = [
  { text: '20語以上書けている', pts: 4 },
  { text: '質問・テーマに合った内容になっている', pts: 4 },
  { text: '理由や具体的な例が書けている', pts: 4 },
  { text: '意味が伝わらなくなるような文法・つづりのまちがいがない', pts: 4 },
];

// ---------- 大問1 その3: 放送の質問に英語1文で答える ----------
export const LISTEN_OWN = [
  { q: 'What do you want to do during the summer vacation?', model: 'I want to go to the sea with my family.' },
  { q: 'What is your favorite food?', model: 'My favorite food is curry and rice.' },
  { q: 'What do you usually do on Sundays?', model: 'I usually play soccer with my friends.' },
  { q: 'Where do you want to go in the future?', model: 'I want to go to Canada.' },
  { q: 'What did you do last weekend?', model: 'I went shopping with my sister.' },
  { q: 'Who is your favorite person?', model: 'My favorite person is my grandmother because she is very kind.' },
];
