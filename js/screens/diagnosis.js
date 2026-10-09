// 入口の診断（看守チェック）: 第1段階の単元から各3問。2問以上正解で「突破」
import { h, btn } from '../core/ui.js';
import { S, unitState, saveNow } from '../core/store.js';
import { UNIT, unitsOf, makeProblem } from '../units/registry.js';
import { answerLine } from '../ui/answer.js';
import { askBtn } from '../ui/asklater.js';
import { diagnosisProblems } from '../game/waves.js';
import { go } from '../core/router.js';

const DIAG_UNITS = (subject) => unitsOf(subject).filter((u) => u.stage === 1 && !u.comingSoon).map((u) => u.id);
// 1単元あたりの問題数（英語は単元が多いので2問）
const PER = { math: 3, english: 2 };

export function render(el, { phase = 'intro', results = {}, subject = 'math', misses = [] } = {}) {
  const en = subject === 'english';
  const units = DIAG_UNITS(subject);
  const per = PER[subject];
  if (phase === 'intro') {
    el.append(
      h('div', { class: 'center-col' },
        h('div', { class: 'big-em' }, '🔦🗿'),
        h('h2', {}, '看守チェック'),
        h('p', { rich: `${en ? '英語棟の看守が、きみの英語力をのぞきに来た。' : '看守が、きみの実力をのぞきに来た。'}\n全 ${units.length * per} 問。まちがえてもペナルティなし。\n苦手な区画を見つけて、そこだけ「訓練」に回すよ。` }),
        h('p', { class: 'note' }, 'タワーは建てられないモード。サクサク答えよう。'),
        btn('チェック開始！', () => go('battle', { mode: 'diagnosis', subject, problems: diagnosisProblems(units, per) }), 'primary big'),
        (S().onboarded || en) && btn('もどる', () => go('home'), 'ghost')),
    );
    return;
  }
  // 結果
  const s = S();
  const rows = units.map((id) => {
    const r = results[id] || { ok: 0, n: 0 };
    const pass = r.n > 0 && r.ok >= Math.ceil(r.n * 2 / 3);
    if (pass) unitState(id).diagPassed = true;
    return { id, r, pass };
  });
  if (en) s.diagnosisEn = { done: true, at: new Date().toISOString(), results };
  else {
    s.diagnosis = { done: true, at: new Date().toISOString(), results };
    s.onboarded = true;
  }
  saveNow();
  const fails = rows.filter((r) => !r.pass);
  el.append(
    h('div', { class: 'center-col' },
      h('h2', {}, '看守チェック 結果'),
      h('div', { class: 'diag-list' }, rows.map(({ id, r, pass }) => h('div', { class: `diag-row ${pass ? 'pass' : 'fail'}` },
        h('span', { class: 'dr-em' }, UNIT[id].emoji),
        h('span', { class: 'dr-name' }, UNIT[id].title),
        h('span', { class: 'dr-score' }, `${r.ok}/${r.n}`),
        h('span', { class: 'dr-tag' }, pass ? '突破！' : 'ここから')))),
      // 前向きに: 全部ミスでも落ちこませない。診断のミスはリベンジにも回していない
      h('p', { rich: fails.length ? `${fails.length === rows.length ? '最初はみんなこんなもん！\n' : ''}「ここから」の区画は、短い訓練でコツをつかめば一気に伸びるところ。\nここでのミスはリベンジにも回らないから、気にしなくてOK。${fails.length < rows.length ? '\n突破した区画はもうクリア扱い！' : ''}` : (en ? '全部突破！ 中1の範囲はバッチリ。' : '全部突破！ いきなり本棟（第2段階）へ進めるぞ。') }),
      // まちがえた問題の答え（タップで開く）
      misses.length > 0 && h('div', { class: 'wrong-list' },
        h('h3', { class: 'sec' }, `📝 まちがえた問題の答え（${misses.length}問）`),
        misses.map((w) => makeProblem(w.generatorId, w.seed)).filter(Boolean).map((p) => h('details', { class: 'wl-item' }, h('summary', { rich: p.stem }), answerLine(p), askBtn(p, '看守チェック')))),
      btn('マップへ', () => go('map', { subject }), 'primary big')),
  );
}
