// 英語の語形変化（3単現・ing・過去形・過去分詞・名詞の複数形）。
// 規則で作り、例外は表で持つ。tests/verify-en.mjs が手書きの正解表と照合する。

// 不規則動詞: 原形 → [過去形, 過去分詞]
export const IRREG = {
  be: ['was', 'been'], have: ['had', 'had'], do: ['did', 'done'], go: ['went', 'gone'], come: ['came', 'come'],
  see: ['saw', 'seen'], eat: ['ate', 'eaten'], make: ['made', 'made'], take: ['took', 'taken'], get: ['got', 'gotten'],
  give: ['gave', 'given'], know: ['knew', 'known'], write: ['wrote', 'written'], read: ['read', 'read'],
  speak: ['spoke', 'spoken'], run: ['ran', 'run'], swim: ['swam', 'swum'], sing: ['sang', 'sung'],
  buy: ['bought', 'bought'], bring: ['brought', 'brought'], think: ['thought', 'thought'], teach: ['taught', 'taught'],
  catch: ['caught', 'caught'], find: ['found', 'found'], leave: ['left', 'left'], meet: ['met', 'met'],
  sit: ['sat', 'sat'], stand: ['stood', 'stood'], tell: ['told', 'told'], say: ['said', 'said'],
  sleep: ['slept', 'slept'], feel: ['felt', 'felt'], lose: ['lost', 'lost'], win: ['won', 'won'],
  begin: ['began', 'begun'], break: ['broke', 'broken'], choose: ['chose', 'chosen'], drink: ['drank', 'drunk'],
  drive: ['drove', 'driven'], fly: ['flew', 'flown'], forget: ['forgot', 'forgotten'], hear: ['heard', 'heard'],
  hold: ['held', 'held'], keep: ['kept', 'kept'], lend: ['lent', 'lent'], ride: ['rode', 'ridden'],
  sell: ['sold', 'sold'], send: ['sent', 'sent'], spend: ['spent', 'spent'], understand: ['understood', 'understood'],
  wear: ['wore', 'worn'], put: ['put', 'put'], cut: ['cut', 'cut'], hit: ['hit', 'hit'], let: ['let', 'let'],
  become: ['became', 'become'], draw: ['drew', 'drawn'], fall: ['fell', 'fallen'], grow: ['grew', 'grown'],
  show: ['showed', 'shown'], throw: ['threw', 'thrown'], build: ['built', 'built'], pay: ['paid', 'paid'],
  wake: ['woke', 'woken'],
};

// 子音字＋母音字＋子音字で終わり、最後の文字を重ねる動詞（アクセントで決まるので表で持つ）
export const DOUBLE = new Set(['run', 'swim', 'sit', 'get', 'put', 'cut', 'stop', 'begin', 'plan', 'shop', 'hit', 'jog', 'win', 'drop', 'forget', 'let', 'set', 'chat', 'hug', 'clap', 'nod', 'rob', 'beg', 'skip', 'step', 'ship']);

const VOWEL = /[aeiou]/;
const consY = (w) => /[^aeiou]y$/.test(w);

export function third(v) {
  if (v === 'be') return 'is';
  if (v === 'have') return 'has';
  if (v === 'do' || v === 'go') return `${v}es`;
  if (/(s|x|z|ch|sh|o)$/.test(v)) return `${v}es`;
  if (consY(v)) return `${v.slice(0, -1)}ies`;
  return `${v}s`;
}

export function ing(v) {
  if (v === 'be') return 'being';
  if (/ie$/.test(v)) return `${v.slice(0, -2)}ying`;
  if (/[^aeiouy]e$/.test(v) || v.endsWith('ue')) return `${v.slice(0, -1)}ing`;
  if (DOUBLE.has(v)) return `${v}${v.at(-1)}ing`;
  return `${v}ing`;
}

function regPast(v) {
  if (v.endsWith('e')) return `${v}d`;
  if (consY(v)) return `${v.slice(0, -1)}ied`;
  if (DOUBLE.has(v)) return `${v}${v.at(-1)}ed`;
  return `${v}ed`;
}
export const past = (v) => (IRREG[v] ? IRREG[v][0] : regPast(v));
export const pp = (v) => (IRREG[v] ? IRREG[v][1] : regPast(v));
export const isIrregular = (v) => !!IRREG[v];
// be 動詞の過去（主語で変わる）
export const bePast = (subj) => (subj.num === 'pl' || subj.person === 2 ? 'were' : 'was');
export const bePresent = (subj) => (subj.person === 1 && subj.num === 'sg' ? 'am' : subj.num === 'pl' || subj.person === 2 ? 'are' : 'is');

// 名詞の複数形
export const PLURAL_IRREG = {
  child: 'children', man: 'men', woman: 'women', foot: 'feet', tooth: 'teeth', mouse: 'mice', person: 'people',
  fish: 'fish', sheep: 'sheep', knife: 'knives', leaf: 'leaves', life: 'lives', wife: 'wives', wolf: 'wolves',
  shelf: 'shelves', half: 'halves', potato: 'potatoes', tomato: 'tomatoes', hero: 'heroes',
};
export function plural(n) {
  if (PLURAL_IRREG[n]) return PLURAL_IRREG[n];
  if (/(s|x|z|ch|sh)$/.test(n)) return `${n}es`;
  if (consY(n)) return `${n.slice(0, -1)}ies`;
  return `${n}s`;
}
export const aOrAn = (w) => (VOWEL.test(w[0]) && !/^(uni|use|one|eu)/.test(w) ? 'an' : 'a');
