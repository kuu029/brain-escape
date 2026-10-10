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
  {
    id: 'festival',
    intro: '中学生のソウタと ALT のブラウン先生が、文化祭のプログラムを見ながら話しています。プログラムと対話を読んで、あとの問いに答えなさい。',
    table: {
      caption: 'School Festival Program',
      head: ['Time', 'Event', 'Place'],
      rows: [
        ['9:00 - 9:30', 'Opening Ceremony', 'Gym'],
        ['9:40 - 11:30', 'Class Exhibitions', 'Classrooms'],
        ['11:30 - 12:30', 'Lunch Time', '-'],
        ['12:30 - 13:30', 'Brass Band Concert', 'Gym'],
        ['13:40 - 14:40', 'Drama by Class 3-2', 'Gym'],
      ],
    },
    lines: [
      ['Mr. Brown', 'Sota, I\'m looking forward to the school festival tomorrow. What are you going to do?'],
      ['Sota', 'My class is going to show a drama in the afternoon. I\'m going to play the main character.'],
      ['Mr. Brown', 'Wow, that\'s great! I\'ll watch it. Are you nervous?'],
      ['Sota', 'A little. We have practiced it every day for a month.'],
      ['Mr. Brown', 'I\'m sure it will be great. I also want to listen to the brass band. My friend Kana plays the trumpet in it.'],
      ['Sota', 'Then you can listen to the concert first and come to our drama after that.'],
      ['Mr. Brown', 'Perfect. I\'ll be there.'],
    ],
    qs: [
      { ask: 'What is Sota going to do at the festival?', correct: 'He is going to play the main character in a drama.', wrongs: ['He is going to play the trumpet.', 'He is going to sing in the gym.', 'He is going to show pictures in his classroom.'], evidence: ['I\'m going to play the main character'], why: 'I\'m going to play the main character.（劇の主役）' },
      { ask: 'プログラムによると、ソウタのクラスの劇は何時に始まりますか。', correct: '午後1時40分', wrongs: ['午後12時30分', '午前9時', '午後2時40分'], evidence: ['Drama by Class 3-2', '13:40 - 14:40'], why: 'Drama by Class 3-2 は 13:40 から。' },
      { ask: 'How long has Sota\'s class practiced the drama?', correct: 'For a month.', wrongs: ['For a week.', 'For a year.', 'For three days.'], evidence: ['every day for a month'], why: 'We have practiced it every day for a month.' },
      { ask: '対話とプログラムの内容に合うものはどれですか。', correct: 'ブラウン先生の友だちのカナは、ブラスバンドでトランペットをふく。', wrongs: ['ブラウン先生は劇を見ないつもりだ。', 'ソウタは劇のことを全く緊張していない。', 'ブラスバンドの演奏会は教室で行われる。'], evidence: ['My friend Kana plays the trumpet'], why: 'My friend Kana plays the trumpet in it.' },
    ],
  },
  {
    id: 'picnic',
    intro: 'リサとダイキが、週末のピクニックについて天気予報を見ながら話しています。天気予報と対話を読んで、あとの問いに答えなさい。',
    table: {
      caption: 'Weather This Week',
      head: ['Day', 'Weather', 'Temperature'],
      rows: [
        ['Friday', 'sunny', '24°C'],
        ['Saturday', 'rainy', '18°C'],
        ['Sunday', 'cloudy', '21°C'],
        ['Monday', 'sunny', '23°C'],
      ],
    },
    lines: [
      ['Lisa', 'Daiki, let\'s go on a picnic to the park by the lake this weekend.'],
      ['Daiki', 'Sounds good! Let\'s check the weather. Oh, it will rain on Saturday.'],
      ['Lisa', 'Then how about Sunday? It won\'t rain, but it will be cloudy.'],
      ['Daiki', 'That\'s OK. I don\'t like hot days, so a cloudy day is better for me.'],
      ['Lisa', 'Great. I\'ll make sandwiches. Can you bring something to drink?'],
      ['Daiki', 'Sure. I\'ll bring some tea. Let\'s meet at the station at ten.'],
    ],
    qs: [
      { ask: 'When will they go on a picnic?', correct: 'On Sunday.', wrongs: ['On Friday.', 'On Saturday.', 'On Monday.'], evidence: ['how about Sunday?'], why: '土曜日は雨なので、日曜日にした。' },
      { ask: '天気予報によると、ピクニックの日の気温は何度ですか。', correct: '21度', wrongs: ['24度', '18度', '23度'], evidence: ['Sunday', '21°C'], why: 'ピクニックは日曜日（cloudy・21°C）。' },
      { ask: 'Why does Daiki think a cloudy day is better?', correct: 'Because he doesn\'t like hot days.', wrongs: ['Because he likes rainy days.', 'Because he wants to swim in the lake.', 'Because it is cold on Sunday.'], evidence: ['I don\'t like hot days'], why: 'I don\'t like hot days, so a cloudy day is better for me.' },
      { ask: '対話と天気予報の内容に合うものはどれですか。', correct: 'リサはサンドイッチを作る。', wrongs: ['ダイキは昼ご飯を作って持っていく。', '二人は駅で9時に会う。', '土曜日は晴れる。'], evidence: ['I\'ll make sandwiches'], why: 'I\'ll make sandwiches.（ダイキは飲み物、待ち合わせは10時）' },
    ],
  },
  {
    id: 'museum',
    intro: '中学生のメイと留学生のベンが、科学館の入り口で料金表を見ながら話しています。料金表と対話を読んで、あとの問いに答えなさい。',
    table: {
      caption: 'Biwako Science Museum - Tickets',
      head: ['Visitor', 'Price'],
      rows: [
        ['Adult', '800 yen'],
        ['Junior high school student', '400 yen'],
        ['Child (6 - 12)', '200 yen'],
        ['Under 6', 'free'],
        ['Planetarium show (11:00 / 14:00 / 16:00)', '+300 yen'],
      ],
    },
    lines: [
      ['Ben', 'Mei, how much is a ticket for us?'],
      ['Mei', 'We are junior high school students, so it\'s 400 yen each.'],
      ['Ben', 'I want to see the planetarium show, too.'],
      ['Mei', 'Me too. The next show starts at 14:00. It\'s 13:20 now, so we have time to see the fish on the first floor before the show.'],
      ['Ben', 'Great. By the way, my little brother is five years old. Does he need a ticket?'],
      ['Mei', 'No. Children under six don\'t need one.'],
    ],
    qs: [
      { ask: 'メイが払う金額（入館料とプラネタリウム）は全部でいくらですか。', correct: '700円', wrongs: ['400円', '300円', '1,100円'], evidence: ['Junior high school student', '400 yen', '+300 yen'], why: '中学生 400円 ＋ プラネタリウム 300円 = 700円。' },
      { ask: 'What will Mei and Ben do before the show?', correct: 'They will see the fish on the first floor.', wrongs: ['They will eat lunch.', 'They will buy a ticket for Ben\'s brother.', 'They will go home.'], evidence: ['see the fish on the first floor'], why: 'we have time to see the fish on the first floor before the show' },
      { ask: 'ベンの弟がチケットを買わなくてよいのはなぜですか。', correct: '6歳未満の子どもは無料だから。', wrongs: ['中学生は無料だから。', '弟はプラネタリウムを見ないから。', 'ベンが代わりに払うから。'], evidence: ['Children under six don\'t need one', 'Under 6'], why: '弟は5歳。6歳未満は free。' },
      { ask: '2人が見るプラネタリウムのショーは何時に始まりますか。', correct: '午後2時', wrongs: ['午前11時', '午後4時', '午後1時20分'], evidence: ['The next show starts at 14:00'], why: 'The next show starts at 14:00.（13:20 は今の時刻）' },
    ],
  },
  {
    id: 'camp',
    intro: '中学生のナナと ALT のホワイト先生が、英語キャンプのお知らせを見ながら話しています。お知らせと対話を読んで、あとの問いに答えなさい。',
    table: {
      caption: 'Summer English Camp',
      head: ['', ''],
      rows: [
        ['Date', 'August 5 - August 7'],
        ['Place', 'Biwako Youth Center'],
        ['For', 'junior high school students'],
        ['Fee', '3,000 yen (meals included)'],
        ['Apply by', 'July 20'],
      ],
    },
    lines: [
      ['Ms. White', 'Nana, look at this. Why don\'t you join the English camp this summer?'],
      ['Nana', 'It looks interesting. What will we do there?'],
      ['Ms. White', 'You will talk with students from other countries, cook together, and give a short speech in English.'],
      ['Nana', 'A speech? I\'m not good at speaking in front of people.'],
      ['Ms. White', 'Don\'t worry. The teachers will help you. It\'s a good chance to improve your English.'],
      ['Nana', 'OK. I\'ll ask my parents tonight. Today is July 18, so I have to hurry.'],
    ],
    qs: [
      { ask: 'How many days is the English camp?', correct: 'Three days.', wrongs: ['Two days.', 'Five days.', 'Seven days.'], evidence: ['August 5 - August 7'], why: '8月5日〜7日の3日間。' },
      { ask: 'What will Nana have to do at the camp?', correct: 'Give a short speech in English.', wrongs: ['Write a long letter in English.', 'Teach English to children.', 'Sing songs on the stage.'], evidence: ['give a short speech in English'], why: 'give a short speech in English' },
      { ask: 'ナナが「急がなければならない」と言っているのはなぜですか。', correct: '申しこみのしめきりが2日後だから。', wrongs: ['キャンプが明日から始まるから。', '両親が今夜出かけるから。', '参加費がもうすぐ高くなるから。'], evidence: ['Today is July 18', 'July 20'], why: '今日は7月18日、申しこみは7月20日まで。' },
      { ask: 'お知らせと対話の内容に合うものはどれですか。', correct: 'キャンプの参加費には食事代がふくまれている。', wrongs: ['キャンプには小学生も参加できる。', 'ナナは人前で話すのが得意だ。', 'キャンプでは料理をしない。'], evidence: ['meals included'], why: '3,000 yen (meals included)' },
    ],
  },
  {
    id: 'festival',
    intro: '中学生のケンと留学生のルーシーが、夏祭りのポスターを見ながら話しています。ポスターと対話を読んで、あとの問いに答えなさい。',
    table: {
      caption: 'Kusatsu Summer Festival - Saturday, August 2',
      head: ['Event', 'Place', 'Time'],
      rows: [
        ['Food Stands', 'Park', '15:00 - 21:00'],
        ['Taiko Drum Show', 'Main Stage', '16:00 - 16:30'],
        ['Dance Contest', 'Main Stage', '17:00 - 18:00'],
        ['Fireworks', 'Lake Side', '19:30 - 20:00'],
      ],
    },
    lines: [
      ['Ken', 'Lucy, are you going to the summer festival this Saturday?'],
      ['Lucy', 'Yes! I want to see the fireworks. I have never seen Japanese fireworks.'],
      ['Ken', 'They are beautiful. My sister is in the Dance Contest, so I will go to the main stage first.'],
      ['Lucy', 'Can I come with you? I\'d like to see her dance, too.'],
      ['Ken', 'Of course. Let\'s meet at the park at 16:30 and eat something before the contest.'],
      ['Lucy', 'OK. ( A ) should I wear? Should I wear a yukata?'],
      ['Ken', 'If you have one, that would be nice. Many people wear yukata at the festival.'],
      ['Lucy', 'My host mother has one for me. I\'m so excited!'],
    ],
    qs: [
      { ask: 'What does Lucy want to see at the festival?', correct: 'The fireworks.', wrongs: ['The Taiko Drum Show.', 'The food stands.', 'Ken\'s school.'], evidence: ['I want to see the fireworks'], why: 'ルーシーは「花火を見たい」と言っている。' },
      { ask: 'ポスターによると、ケンの妹が出るイベントはどこで行われますか。', correct: 'メインステージ', wrongs: ['湖のそば', '公園', '学校の体育館'], evidence: ['Dance Contest', 'Main Stage'], why: '妹が出るのは Dance Contest（Main Stage）。' },
      { ask: '対話の ( A ) に入る最も適切な語はどれですか。', correct: 'What', wrongs: ['Where', 'When', 'Who'], evidence: ['( A ) should I wear?'], why: 'What should I wear? で「何を着たらいい？」。すぐあとに「ゆかたを着るべき？」と続く。' },
      { ask: '対話とポスターの内容に合うものはどれですか。', correct: '2人は、ダンスコンテストの前に公園で何か食べるつもりだ。', wrongs: ['ルーシーは前に日本の花火を見たことがある。', '花火は公園で午後7時に始まる。', 'ルーシーはゆかたを持っていないので、着ていけない。'], evidence: ['eat something before the contest'], why: 'Let\'s meet at the park at 16:30 and eat something before the contest.' },
    ],
  },
  {
    id: 'survey',
    intro: '中学生のアヤが、クラスで行ったアンケートの結果について、ALT のブラウン先生と話しています。表と対話を読んで、あとの問いに答えなさい。',
    table: {
      caption: 'Class Survey: What Do You Do to Save Energy? (35 students)',
      head: ['Action', 'Students'],
      rows: [
        ['Turn off the lights', '15'],
        ['Use a fan instead of an air conditioner', '8'],
        ['Take shorter showers', '7'],
        ['Unplug the TV', '5'],
      ],
    },
    lines: [
      ['Mr. Brown', 'Aya, what did your class learn from this survey?'],
      ['Aya', 'Most students turn off the lights when they leave a room. But only five students unplug the TV.'],
      ['Mr. Brown', 'I see. Why do you think so few students do that?'],
      ['Aya', 'Maybe they don\'t know that a TV uses electricity even when it is off.'],
      ['Mr. Brown', 'That\'s true. What are you going to do next?'],
      ['Aya', 'We are going to make posters and put them on the walls of our school. We want more students to know about it.'],
      ['Mr. Brown', 'Great idea. I\'m sure your posters will help.'],
    ],
    qs: [
      { ask: 'How many students turn off the lights to save energy?', correct: 'Fifteen.', wrongs: ['Five.', 'Seven.', 'Eight.'], evidence: ['Turn off the lights', '15'], why: '表の Turn off the lights は 15人。' },
      { ask: 'Why does Aya think few students unplug the TV?', correct: 'Because they may not know a TV uses electricity even when it is off.', wrongs: ['Because they watch TV all day.', 'Because their TVs are very old.', 'Because their parents tell them not to.'], evidence: ['a TV uses electricity even when it is off'], why: 'Maybe they don\'t know that a TV uses electricity even when it is off.' },
      { ask: 'アヤのクラスがこれからしようとしていることは何ですか。', correct: 'ポスターを作って、学校のかべにはる。', wrongs: ['テレビを使わない日を作る。', 'もう一度アンケートをとる。', 'エアコンの使い方を調べる。'], evidence: ['make posters and put them on the walls of our school'], why: 'We are going to make posters and put them on the walls of our school.' },
      { ask: '表と対話の内容に合うものはどれですか。', correct: 'アンケートに答えた生徒は35人だった。', wrongs: ['扇風機を使う生徒がいちばん多かった。', 'シャワーを短くする生徒は5人だった。', 'ブラウン先生はポスター作りに反対している。'], evidence: ['35 students'], why: '表のタイトルに 35 students とある。' },
    ],
  },
  {
    id: 'museum',
    intro: '留学生のマイクと中学生のサキが、博物館の料金表を見ながら話しています。料金表と対話を読んで、あとの問いに答えなさい。',
    table: {
      caption: 'Biwako Museum - Tickets',
      head: ['', 'Adults', 'Junior High Students', 'Children (6-12)'],
      rows: [
        ['Ticket', '800 yen', '400 yen', '200 yen'],
        ['Group (10 people or more)', '700 yen', '300 yen', '150 yen'],
      ],
    },
    lines: [
      ['Mike', 'Saki, I\'m going to the Biwako Museum with my family next Sunday.'],
      ['Saki', 'That\'s nice. You can see many kinds of fish from Lake Biwa there.'],
      ['Mike', 'I know. I\'m going with my parents and my little brother. He is eight.'],
      ['Saki', 'Then you need two adult tickets, one junior high student ticket, and one child ticket.'],
      ['Mike', 'Right. So it will be ( A ) yen in total.'],
      ['Saki', 'Yes. By the way, the museum has a special event about the lake\'s turtles this month.'],
      ['Mike', 'Really? My brother loves turtles. He will be happy.'],
    ],
    qs: [
      { ask: 'Who is Mike going to the museum with?', correct: 'His parents and his little brother.', wrongs: ['His friends from school.', 'Saki and her family.', 'His grandparents.'], evidence: ['I\'m going with my parents and my little brother'], why: 'I\'m going with my parents and my little brother.' },
      { ask: '対話の ( A ) に入る数として正しいものはどれですか。', correct: '2,200', wrongs: ['1,800', '2,000', '2,400'], evidence: ['800 yen', '400 yen', '200 yen'], why: 'おとな 800円 × 2 ＋ 中学生 400円 ＋ 子ども 200円 ＝ 2,200円。' },
      { ask: 'Why will Mike\'s brother be happy?', correct: 'Because there is a special event about turtles.', wrongs: ['Because he can buy a group ticket.', 'Because he can see fish from the sea.', 'Because Saki will go with him.'], evidence: ['special event about the lake\'s turtles'], why: 'My brother loves turtles. He will be happy.' },
      { ask: '料金表と対話の内容に合うものはどれですか。', correct: '中学生のチケットは、おとなのチケットの半分の値段だ。', wrongs: ['団体のチケットは5人から買える。', 'マイクの弟は12才だ。', '博物館では海の魚だけを見ることができる。'], evidence: ['800 yen', '400 yen'], why: 'おとな 800円、中学生 400円。' },
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
  {
    id: 'sleep',
    intro: '中学生がクラスで行ったスピーチです。読んで、あとの問いに答えなさい。',
    paras: [
      'Hello, everyone. Do you sleep well? Last month, I asked 30 students in my class about their sleep. Twenty of them said, "I sleep less than seven hours." I was surprised.',
      'I also asked them, "What do you do before you go to bed?" Many students said they use their smartphones in bed. I did the same thing. I often watched videos until midnight, and I was always sleepy in class.',
      'Then I read a book about sleep. It said that the light from smartphones makes it hard to sleep. So I decided to stop using my smartphone one hour before bed. Instead, I started to read books.',
      'Now I can sleep better, and I feel good in the morning. I can also listen to my teachers better in class. Why don\'t you try it, too? Thank you.',
    ],
    notes: ['less than 〜より少ない', 'midnight 真夜中', 'instead そのかわりに'],
    qs: [
      { ask: 'How many students said they sleep less than seven hours?', correct: 'Twenty students.', wrongs: ['Thirty students.', 'Seven students.', 'Ten students.'], evidence: ['Twenty of them said'], why: '30人に聞いて、そのうち20人。' },
      { ask: '話し手が読んだ睡眠についての本には、何と書いてありましたか。', correct: 'スマートフォンの光で、眠りにくくなる。', wrongs: ['毎日8時間以上ねるべきだ。', '寝る前に動画を見ると、よく眠れる。', '朝に本を読むと、頭がよくなる。'], evidence: ['the light from smartphones makes it hard to sleep'], why: 'It said that the light from smartphones makes it hard to sleep.' },
      { ask: 'What does the speaker do before bed now?', correct: 'The speaker reads books.', wrongs: ['The speaker watches videos.', 'The speaker plays games.', 'The speaker studies math.'], evidence: ['I started to read books'], why: 'Instead, I started to read books.' },
      { ask: 'スピーチの内容に合うものはどれですか。', correct: '話し手は以前、授業中いつも眠かった。', wrongs: ['話し手は、学校の生徒全員にアンケートをした。', '話し手は今も、真夜中までスマートフォンを使っている。', '話し手のクラスには20人の生徒がいる。'], evidence: ['I was always sleepy in class'], why: 'I was always sleepy in class.（アンケートはクラスの30人）' },
      { ask: '話し手がいちばん伝えたいことはどれですか。', correct: 'Stop using smartphones before bed.', wrongs: ['Buy a new smartphone.', 'Watch videos to learn English.', 'Sleep in class when you are tired.'], evidence: ['stop using my smartphone one hour before bed'], why: '自分がやって効果があったことを「Why don\'t you try it, too?」とすすめている。' },
    ],
    write: {
      ask: 'あなたが健康のために気をつけていることを、英語2文以上で書きなさい。理由も書くこと。',
      model: ['I eat breakfast every morning. It gives me energy for the day.', 'I go to bed before eleven. I can study well when I sleep enough.'],
    },
  },
  {
    id: 'furoshiki',
    intro: '中学生が英語の授業で行ったスピーチです。読んで、あとの問いに答えなさい。',
    paras: [
      'Hello. Last month, a student from France, Lucas, stayed at my house. One day, I gave him a present wrapped in a furoshiki. He was very interested in it.',
      'He asked me, "What is this beautiful cloth?" I explained, "It\'s a furoshiki. We use it to carry many things, like boxes, bottles, and books." Then I showed him how to use it. He said, "It\'s like a bag, but you can change its shape. That\'s amazing!"',
      'He also said, "In France, many people try to use fewer plastic bags. A furoshiki can help us." [[I didn\'t think about that before.]] I thought a furoshiki was just an old thing.',
      'Before Lucas went back to France, I gave him three furoshiki. He sent me an email last week. It said, "My family uses them every day." I was very happy. I want to tell more people about good things in Japanese culture.',
    ],
    notes: ['wrapped 包まれた', 'cloth 布', 'shape 形', 'fewer より少ない'],
    qs: [
      { ask: 'Where is Lucas from?', correct: 'France.', wrongs: ['Canada.', 'Australia.', 'China.'], evidence: ['a student from France, Lucas'], why: 'a student from France, Lucas' },
      { ask: 'ルーカスが「すごい」と言ったのは、ふろしきのどんなところですか。', correct: '形を変えられるところ。', wrongs: ['とても古いところ。', 'とても安いところ。', '絵がかいてあるところ。'], evidence: ['you can change its shape. That\'s amazing!'], why: 'It\'s like a bag, but you can change its shape.' },
      { ask: '下線部 I didn\'t think about that before. の that の内容として最も適切なものはどれですか。', correct: 'ふろしきが、プラスチックの袋を減らすのに役立つこと。', wrongs: ['フランスでは、ふろしきが人気だということ。', 'ふろしきで本を運べるということ。', 'ルーカスが日本の文化をよく知っていたこと。'], evidence: ['A furoshiki can help us'], why: '下線部の直前のルーカスの言葉。' },
      { ask: 'What did Lucas\'s email say?', correct: 'His family uses the furoshiki every day.', wrongs: ['He wants to come back to Japan next year.', 'He lost the furoshiki.', 'He made a furoshiki at school.'], evidence: ['My family uses them every day'], why: 'It said, "My family uses them every day."' },
      { ask: 'このスピーチのタイトルとして最も適切なものはどれですか。', correct: 'What a Furoshiki Taught Me', wrongs: ['How to Make a Bag', 'My Trip to France', 'The History of Plastic'], evidence: ['I want to tell more people about good things in Japanese culture'], why: 'ふろしきを通して、日本の文化のよさに気づいた話。' },
    ],
    write: {
      ask: '外国の人にすすめたい日本のもの（食べ物・道具・行事など）を1つ選んで、英語2文以上で紹介しなさい。',
      model: ['I want to recommend onigiri. It is easy to carry, and you can enjoy many tastes.', 'I recommend summer festivals. You can wear a yukata and see beautiful fireworks.'],
    },
  },
  {
    id: 'elderly',
    intro: '中学生がクラスで行ったスピーチです。読んで、あとの問いに答えなさい。',
    paras: [
      'Hi, everyone. Last winter, I visited a nursing home near my school as a volunteer. At first, I didn\'t know what to talk about with the elderly people there.',
      'A woman named Mrs. Tanaka was sitting alone by the window. I said hello to her, but she didn\'t say anything. I felt nervous. Then I saw an old picture of a school on her table. I asked her, "Is this your school?" She smiled and started to talk about her school days. She told me that she walked for an hour to school every day.',
      'After that, I visited her every Saturday. She taught me how to make otedama, and I taught her how to take pictures with a smartphone. We enjoyed learning from each other.',
      'Through this experience, I learned that we can become friends with people of any age. Talking is the first step. Thank you.',
    ],
    notes: ['nursing home 老人ホーム', 'elderly お年寄りの', 'otedama お手玉', 'age 年齢'],
    qs: [
      { ask: 'When did the speaker visit the nursing home for the first time?', correct: 'Last winter.', wrongs: ['Last summer.', 'Last spring.', 'Last weekend.'], evidence: ['Last winter, I visited a nursing home'], why: 'Last winter, I visited a nursing home near my school as a volunteer.' },
      { ask: 'タナカさんが話し始めたのはなぜですか。', correct: '話し手が、古い学校の写真について質問したから。', wrongs: ['話し手が、お手玉を持ってきたから。', '話し手が、毎週土曜日に来たから。', 'ほかの人が、タナカさんに話しかけたから。'], evidence: ['Is this your school?', 'She smiled and started to talk'], why: '写真を見て「Is this your school?」と聞いたら、笑って話し始めた。' },
      { ask: 'How did Mrs. Tanaka go to school when she was a student?', correct: 'She walked for an hour.', wrongs: ['She went by bus.', 'She rode a bike.', 'Her father took her by car.'], evidence: ['she walked for an hour to school every day'], why: 'she walked for an hour to school every day' },
      { ask: 'スピーチの内容に合うものはどれですか。', correct: '話し手はタナカさんに、スマートフォンで写真をとる方法を教えた。', wrongs: ['タナカさんは、最初からたくさん話してくれた。', '話し手は、毎週日曜日にタナカさんをたずねた。', '話し手が、タナカさんにお手玉の作り方を教えた。'], evidence: ['I taught her how to take pictures with a smartphone'], why: 'お手玉はタナカさんが教えてくれた。話し手はスマートフォンの写真のとり方を教えた。' },
      { ask: '話し手がいちばん伝えたいことはどれですか。', correct: 'We can become friends with people of any age.', wrongs: ['We should not talk to elderly people.', 'Old pictures are very expensive.', 'Volunteers must work every day.'], evidence: ['we can become friends with people of any age'], why: '最後の段落に「学んだこと」がまとめてある。' },
    ],
    write: {
      ask: 'あなたがやってみたいボランティア活動を1つ、英語2文以上で書きなさい。理由も書くこと。',
      model: ['I want to clean the beach of Lake Biwa. I want to keep the lake beautiful.', 'I want to read picture books to small children. I like children and books.'],
    },
  },
  {
    id: 'tourist',
    intro: '中学生が英語の授業で行ったスピーチです。読んで、あとの問いに答えなさい。',
    paras: [
      'Hello. Last Sunday, I was at Kyoto Station with my mother. A man from Canada came to us. He had a map in his hand and looked worried. He said something in English, but my mother couldn\'t understand him.',
      'I was nervous, but I tried to talk to him. I said, "Can I help you?" He wanted to go to Kinkakuji. I showed him the right bus stop and said, "Take bus number 205." He said, "Thank you so much! Your English is very good."',
      'Before that day, I studied English only for tests. But I realized that English is a tool to help people. Now I study English harder, and I practice speaking with our ALT every week.',
      'In the future, I want to work at a hotel and help many people from other countries. Thank you.',
    ],
    notes: ['worried 心配そうな', 'realize 気づく', 'tool 道具'],
    qs: [
      { ask: 'Where was the speaker last Sunday?', correct: 'At Kyoto Station.', wrongs: ['At Kinkakuji.', 'At a hotel.', 'At school.'], evidence: ['I was at Kyoto Station with my mother'], why: 'Last Sunday, I was at Kyoto Station with my mother.' },
      { ask: 'Where did the man from Canada want to go?', correct: 'Kinkakuji.', wrongs: ['Kyoto Station.', 'A hotel.', 'Canada.'], evidence: ['He wanted to go to Kinkakuji'], why: 'He wanted to go to Kinkakuji.' },
      { ask: 'この日のあと、話し手の英語の勉強はどう変わりましたか。', correct: 'テストのためだけでなく、人を助ける道具として勉強するようになった。', wrongs: ['英語の勉強をやめてしまった。', 'テストのためだけに勉強するようになった。', '母親に英語を教えるようになった。'], evidence: ['I studied English only for tests', 'English is a tool to help people'], why: 'Before that day, I studied English only for tests. But I realized that English is a tool to help people.' },
      { ask: 'スピーチの内容に合うものはどれですか。', correct: '話し手は毎週、ALT と話す練習をしている。', wrongs: ['話し手の母親は、その男性の英語を理解できた。', '男性は、駅で地図をなくして困っていた。', '話し手は、男性を金閣寺まで連れて行った。'], evidence: ['I practice speaking with our ALT every week'], why: 'I practice speaking with our ALT every week.' },
      { ask: 'What does the speaker want to do in the future?', correct: 'To work at a hotel.', wrongs: ['To become an English teacher.', 'To live in Canada.', 'To drive a bus in Kyoto.'], evidence: ['I want to work at a hotel'], why: 'In the future, I want to work at a hotel.' },
    ],
    write: {
      ask: '英語を使ってやってみたいことを、英語2文以上で書きなさい。理由も書くこと。',
      model: ['I want to talk with people from other countries. I want to learn about their cultures.', 'I want to watch movies in English. It is a good way to learn real English.'],
    },
  },
  {
    id: 'smartphone',
    intro: '中学生が英語の授業で行ったスピーチです。読んで、あとの問いに答えなさい。',
    paras: [
      'Hello, everyone. Do you use a smartphone every day? I do. I use it to talk with my friends, listen to music, and watch videos.',
      'But last month, I had a problem. I used my smartphone until late at night, so I couldn\'t get up in the morning. I was late for school twice. My mother was angry and said, "You should make a rule for yourself."',
      'So I made two rules. First, I don\'t use my smartphone after ten at night. Second, I put it in the living room when I study. [[At first, it was hard.]] I wanted to check my messages many times.',
      'Now, I go to bed earlier, and I can study better. I also have more time to talk with my family. A smartphone is very useful, but we should use it in a good way. Thank you for listening.',
    ],
    notes: ['rule きまり', 'useful 役に立つ'],
    qs: [
      { ask: 'What does the speaker use a smartphone for?', correct: 'To talk with friends, listen to music, and watch videos.', wrongs: ['To take pictures of animals.', 'To read books and newspapers.', 'To play games with the family.'], evidence: ['talk with my friends, listen to music, and watch videos'], why: 'I use it to talk with my friends, listen to music, and watch videos.' },
      { ask: 'Why was the speaker late for school?', correct: 'Because the speaker used the smartphone until late at night.', wrongs: ['Because the speaker missed the bus.', 'Because the speaker was sick.', 'Because the speaker\'s mother was angry.'], evidence: ['I used my smartphone until late at night'], why: '夜おそくまで使っていたので、朝起きられなかった。' },
      { ask: '下線部 At first, it was hard. とありますが、何がたいへんだったのですか。', correct: 'メッセージを何度も確認したくなるのを、がまんすること。', wrongs: ['夜10時までに宿題を終わらせること。', 'リビングで家族と話すこと。', '朝早く起きて学校に行くこと。'], evidence: ['I wanted to check my messages many times'], why: '下線部のすぐあとに I wanted to check my messages many times. とある。' },
      { ask: 'スピーチの内容に合うものはどれですか。', correct: '話し手は、勉強するときスマートフォンをリビングに置いている。', wrongs: ['話し手は、夜10時以降もスマートフォンを使っている。', '話し手は、先月3回学校におくれた。', '話し手の母は、スマートフォンを買ってくれなかった。'], evidence: ['I put it in the living room when I study'], why: 'Second, I put it in the living room when I study.' },
      { ask: '話し手がいちばん伝えたいことはどれですか。', correct: 'We should use smartphones in a good way.', wrongs: ['Smartphones are bad for students.', 'We should buy a new smartphone.', 'Videos are more fun than music.'], evidence: ['we should use it in a good way'], why: '最後の段落に、伝えたいことがまとめてある。' },
    ],
    write: {
      ask: 'あなたがスマートフォンやインターネットを使うときに気をつけたいことを、英語2文以上で書きなさい。理由も書くこと。',
      model: ['I want to stop using my phone at nine. I need to sleep well for school.', 'I will not write bad things on the Internet. Many people can read them.'],
    },
  },
  {
    id: 'nursing',
    intro: '中学生がクラスで行ったスピーチです。読んで、あとの問いに答えなさい。',
    paras: [
      'Good morning. Last summer, I joined a volunteer activity at a nursing home in my town. I want to tell you about it.',
      'On the first day, I was very nervous. I didn\'t know how to talk to the old people there. I just stood in the corner of the room.',
      'Then, a woman smiled at me and said, "Can you help me with this puzzle?" We did the puzzle together, and she told me about her life. When she was young, she worked at a school as a music teacher.',
      'On the last day, she played the piano for me, and we sang a song together. [[She said, "Thank you for coming. You made my summer happy."]] I was really happy to hear that.',
      'I learned that a small action can make someone happy. I want to visit the nursing home again this winter. Thank you.',
    ],
    notes: ['nursing home 老人ホーム', 'nervous 緊張して', 'puzzle パズル'],
    qs: [
      { ask: 'Where did the speaker do volunteer work last summer?', correct: 'At a nursing home.', wrongs: ['At a school.', 'At a hospital.', 'At a music shop.'], evidence: ['a volunteer activity at a nursing home'], why: 'I joined a volunteer activity at a nursing home in my town.' },
      { ask: 'How did the speaker feel on the first day?', correct: 'Very nervous.', wrongs: ['Very happy.', 'Very sleepy.', 'Very angry.'], evidence: ['I was very nervous'], why: 'On the first day, I was very nervous.' },
      { ask: 'What did the woman do when she was young?', correct: 'She worked as a music teacher.', wrongs: ['She worked at a nursing home.', 'She made puzzles for children.', 'She was a famous singer.'], evidence: ['worked at a school as a music teacher'], why: 'When she was young, she worked at a school as a music teacher.' },
      { ask: 'スピーチの内容に合うものはどれですか。', correct: '最終日に、女性はピアノをひき、2人でいっしょに歌った。', wrongs: ['話し手は初日から、お年寄りと上手に話せた。', '女性は話し手にピアノのひき方を教えた。', '話し手はもう老人ホームに行くつもりはない。'], evidence: ['she played the piano for me, and we sang a song together'], why: 'On the last day, she played the piano for me, and we sang a song together.' },
      { ask: 'このスピーチのタイトルとして最も適切なものはどれですか。', correct: 'A Small Action Can Make Someone Happy', wrongs: ['How to Play the Piano', 'My Favorite Puzzle', 'A Trip to a Big City'], evidence: ['a small action can make someone happy'], why: '最後の段落で「学んだこと」を述べている。' },
    ],
    write: {
      ask: 'あなたが参加してみたいボランティア活動と、その理由を英語2文以上で書きなさい。',
      model: ['I want to clean the park near my house. Many children play there.', 'I want to read picture books to small children. I like reading books.'],
    },
  },
  {
    id: 'weather',
    intro: '中学生が英語の授業で行ったスピーチです。読んで、あとの問いに答えなさい。',
    paras: [
      'Hello. What do you want to be in the future? My dream is to be a weather forecaster.',
      'When I was ten, a big typhoon came to my town. The wind was very strong, and the river near my house became dangerous. Because we watched the weather news on TV, my family left our house early and went to a safe place.',
      '[[The weather news saved us.]] Since then, I have been interested in the weather. I check the sky every morning and write down the clouds and the temperature in my notebook. I have kept it for four years.',
      'To be a weather forecaster, I have to study science and math hard. It is not easy, but I want to tell people the right information and protect their lives. Thank you.',
    ],
    notes: ['weather forecaster 気象予報士', 'typhoon 台風', 'information 情報'],
    qs: [
      { ask: 'What is the speaker\'s dream?', correct: 'To be a weather forecaster.', wrongs: ['To be a science teacher.', 'To be a TV news reporter.', 'To be a doctor.'], evidence: ['My dream is to be a weather forecaster'], why: 'My dream is to be a weather forecaster.' },
      { ask: 'What happened when the speaker was ten?', correct: 'A big typhoon came to the speaker\'s town.', wrongs: ['The speaker moved to a new town.', 'The speaker started to write in a notebook.', 'The speaker\'s house was broken by a fire.'], evidence: ['a big typhoon came to my town'], why: 'When I was ten, a big typhoon came to my town.' },
      { ask: '下線部 The weather news saved us. とありますが、どういうことですか。', correct: '天気のニュースを見て、家族が早めに安全な場所へ移動できたこと。', wrongs: ['天気のニュースで、台風が来ないとわかったこと。', 'ニュースの人が、家まで助けに来てくれたこと。', 'テレビで、川の水がきれいになったと知ったこと。'], evidence: ['Because we watched the weather news on TV'], why: '下線部の直前の文に、ニュースを見て早めに避難したことが書いてある。' },
      { ask: 'スピーチの内容に合うものはどれですか。', correct: '話し手は、4年間ノートに雲や気温を書き続けている。', wrongs: ['話し手は、夜にだけ空を見ている。', '話し手は、理科と数学の勉強はしなくてよいと考えている。', '話し手の家の近くには川がない。'], evidence: ['I have kept it for four years'], why: 'I check the sky every morning ... I have kept it for four years.' },
      { ask: '話し手が気象予報士になってしたいことは何ですか。', correct: '正しい情報を伝えて、人々の命を守ること。', wrongs: ['台風を止める方法を見つけること。', 'テレビで有名になること。', '毎日ちがう町に旅行すること。'], evidence: ['tell people the right information and protect their lives'], why: 'I want to tell people the right information and protect their lives.' },
    ],
    write: {
      ask: 'あなたの将来の夢と、そのために今していること（またはこれからしたいこと）を、英語2文以上で書きなさい。',
      model: ['I want to be a nurse. I am studying science hard now.', 'My dream is to work in a foreign country. I listen to English songs every day.'],
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
  { ask: 'ALT の先生から、次の質問をされました。あなたの考えを、理由をふくめて 20語以上の英語で書きなさい。', q: 'Which is better for students, studying at home or studying at a library? Why?', model: 'I think studying at a library is better. It is quiet, and there are many books. I can study hard there because I do not have my games.' },
  { ask: '留学生に、あなたの町（または学校）のよいところを紹介します。20語以上の英語で書きなさい。', q: 'What is good about your town?', model: 'My town is near Lake Biwa. The lake is very beautiful in the evening. We can also eat fresh fish and vegetables. I love my town.' },
  { ask: 'ALT の先生から、次の質問をされました。あなたの考えを、理由をふくめて 20語以上の英語で書きなさい。', q: 'Do you think students should use smartphones at school? Why?', model: 'I do not think students should use smartphones at school. If we use them, we cannot listen to our teachers well. We should talk with friends face to face.' },
  { ask: '卒業する前に、クラスのみんなとやりたいことを ALT の先生に伝えます。理由もふくめて 20語以上の英語で書きなさい。', q: 'What do you want to do with your classmates before graduation?', model: 'I want to play soccer with all my classmates. We have played together many times since we were first-year students. It will be a good memory.' },
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
  { q: 'What time do you usually get up?', model: 'I usually get up at six thirty.' },
  { q: 'What sport do you like?', model: 'I like basketball.' },
  { q: 'How do you come to school?', model: 'I come to school by bike.' },
  { q: 'What do you want to learn in high school?', model: 'I want to learn more about science.' },
];
