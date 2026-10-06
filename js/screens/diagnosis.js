// 入口の診断（看守チェック）: 第1段階の単元から各3問。2問以上正解で「突破」
import { h, btn } from '../core/ui.js';
import { S, unitState, saveNow } from '../core/store.js';
import { UNITS, UNIT } from '../units/registry.js';
import { diagnosisProblems } from '../game/waves.js';
import { go } from '../core/router.js';

const DIAG_UNITS = () => UNITS.filter((u) => u.stage === 1 && !u.comingSoon).map((u) => u.id);

export function render(el, { phase = 'intro', results = {} } = {}) {
  if (phase === 'intro') {
    el.append(
      h('div', { class: 'center-col' },
        h('div', { class: 'big-em' }, '🔦🗿'),
        h('h2', {}, '看守チェック'),
        h('p', { rich: `看守が、きみの実力をのぞきに来た。\n全 ${DIAG_UNITS().length * 3} 問。まちがえてもペナルティなし。\n苦手な区画を見つけて、そこだけ「訓練」に回すよ。` }),
        h('p', { class: 'note' }, 'タワーは建てられないモード。サクサク答えよう。'),
        btn('チェック開始！', () => go('battle', { mode: 'diagnosis', problems: diagnosisProblems(DIAG_UNITS()) }), 'primary big'),
        S().onboarded && btn('もどる', () => go('home'), 'ghost')),
    );
    return;
  }
  // 結果
  const s = S();
  const rows = DIAG_UNITS().map((id) => {
    const r = results[id] || { ok: 0, n: 0 };
    const pass = r.n > 0 && r.ok >= Math.ceil(r.n * 2 / 3);
    if (pass) unitState(id).diagPassed = true;
    return { id, r, pass };
  });
  s.diagnosis = { done: true, at: new Date().toISOString(), results };
  s.onboarded = true;
  saveNow();
  const fails = rows.filter((r) => !r.pass);
  el.append(
    h('div', { class: 'center-col' },
      h('h2', {}, '看守チェック 結果'),
      h('div', { class: 'diag-list' }, rows.map(({ id, r, pass }) => h('div', { class: `diag-row ${pass ? 'pass' : 'fail'}` },
        h('span', { class: 'dr-em' }, UNIT[id].emoji),
        h('span', { class: 'dr-name' }, UNIT[id].title),
        h('span', { class: 'dr-score' }, `${r.ok}/${r.n}`),
        h('span', { class: 'dr-tag' }, pass ? '突破！' : '要訓練')))),
      h('p', { rich: fails.length ? `「要訓練」の区画は、マップで訓練からスタートしよう。\n突破した区画はもうクリア扱い。次のエリアへ進める！` : '全部突破！ いきなり本棟（第2段階）へ進めるぞ。' }),
      btn('マップへ', () => go('map'), 'primary big')),
  );
}
