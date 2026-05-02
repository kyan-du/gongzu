import type { Level } from './types';

const palette = [
  'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600',
  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700',
  'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700',
  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700',
  'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-200 dark:border-pink-700',
  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700',
];
const c = (i: number) => palette[i % palette.length];

export const LEVELS: Level[] = [
  { id: 'wolf', title: '1 狼羊菜', subtitle: '经典入门：别让狼吃羊、羊吃菜。', capacity: 1, items: [
    { id: 'wolf', name: '狼', emoji: '🐺', color: c(0) }, { id: 'sheep', name: '羊', emoji: '🐑', color: c(1) }, { id: 'cabbage', name: '菜', emoji: '🥬', color: c(2) }], rules: [{ kind: 'eats', predator: 'wolf', prey: 'sheep' }, { kind: 'eats', predator: 'sheep', prey: 'cabbage' }] },
  { id: 'fox', title: '2 狐狸鸡米', subtitle: '同样结构，换一个故事。', capacity: 1, items: [
    { id: 'fox', name: '狐狸', emoji: '🦊', color: c(0) }, { id: 'chicken', name: '鸡', emoji: '🐔', color: c(1) }, { id: 'rice', name: '米', emoji: '🍚', color: c(2) }], rules: [{ kind: 'eats', predator: 'fox', prey: 'chicken' }, { kind: 'eats', predator: 'chicken', prey: 'rice' }] },
  { id: 'cat', title: '3 猫鼠奶酪', subtitle: '继续练习“中间角色最关键”。', capacity: 1, items: [
    { id: 'cat', name: '猫', emoji: '🐱', color: c(0) }, { id: 'mouse', name: '鼠', emoji: '🐭', color: c(1) }, { id: 'cheese', name: '奶酪', emoji: '🧀', color: c(2) }], rules: [{ kind: 'eats', predator: 'cat', prey: 'mouse' }, { kind: 'eats', predator: 'mouse', prey: 'cheese' }] },
  { id: 'family', title: '4 爸爸妈妈孩子', subtitle: '船坐 2 人，但只有大人会划船。', capacity: 2, needsDriver: true, items: [
    { id: 'dad', name: '爸爸', emoji: '👨', canDrive: true, color: c(0) }, { id: 'mom', name: '妈妈', emoji: '👩', canDrive: true, color: c(4) }, { id: 'boy', name: '哥哥', emoji: '👦', color: c(3) }, { id: 'girl', name: '妹妹', emoji: '👧', color: c(5) }], rules: [] },
  { id: 'farmer', title: '5 农夫和动物', subtitle: '船坐 2 个，但必须有农夫掌舵。', capacity: 2, needsDriver: true, items: [
    { id: 'farmer', name: '农夫', emoji: '👨‍🌾', canDrive: true, color: c(3) }, { id: 'dog', name: '狗', emoji: '🐶', color: c(0) }, { id: 'duck', name: '鸭', emoji: '🦆', color: c(1) }, { id: 'corn', name: '玉米', emoji: '🌽', color: c(2) }], rules: [{ kind: 'eats', predator: 'dog', prey: 'duck' }, { kind: 'eats', predator: 'duck', prey: 'corn' }] },
  { id: 'weight1', title: '6 动物承重', subtitle: '船最多 6 斤，一次最多 2 个。', capacity: 2, maxWeight: 6, items: [
    { id: 'lion', name: '狮子5', emoji: '🦁', weight: 5, color: c(0) }, { id: 'monkey', name: '猴子1', emoji: '🐵', weight: 1, color: c(1) }, { id: 'panda', name: '熊猫3', emoji: '🐼', weight: 3, color: c(2) }, { id: 'rabbit', name: '兔子2', emoji: '🐰', weight: 2, color: c(4) }], rules: [] },
  { id: 'weight2', title: '7 承重升级', subtitle: '船最多 7 斤，选择组合更重要。', capacity: 2, maxWeight: 7, items: [
    { id: 'elephant', name: '象6', emoji: '🐘', weight: 6, color: c(0) }, { id: 'tiger', name: '虎4', emoji: '🐯', weight: 4, color: c(1) }, { id: 'koala', name: '考拉3', emoji: '🐨', weight: 3, color: c(2) }, { id: 'bird', name: '鸟1', emoji: '🐦', weight: 1, color: c(3) }], rules: [] },
  { id: 'police', title: '8 警察小偷一家人', subtitle: '小偷不能离开警察，单独和家人在一起。', capacity: 2, needsDriver: true, items: [
    { id: 'police', name: '警察', emoji: '👮', canDrive: true, color: c(3) }, { id: 'thief', name: '小偷', emoji: '🦹', canDrive: true, color: c(0) }, { id: 'father', name: '爸爸', emoji: '👨', canDrive: true, color: c(1) }, { id: 'mother', name: '妈妈', emoji: '👩', canDrive: true, color: c(4) }, { id: 'child', name: '孩子', emoji: '🧒', color: c(2) }], rules: [{ kind: 'thief', guard: 'police', thief: 'thief', watched: ['father', 'mother', 'child'] }] },
  { id: 'mission', title: '9 探险队过河', subtitle: '任一岸：探险员不能少于野人。', capacity: 2, items: [
    { id: 'm1', name: '探1', emoji: '🧭', group: 'safe', color: c(3) }, { id: 'm2', name: '探2', emoji: '🧭', group: 'safe', color: c(3) }, { id: 'm3', name: '探3', emoji: '🧭', group: 'safe', color: c(3) }, { id: 'c1', name: '野1', emoji: '🪓', group: 'danger', color: c(0) }, { id: 'c2', name: '野2', emoji: '🪓', group: 'danger', color: c(0) }, { id: 'c3', name: '野3', emoji: '🪓', group: 'danger', color: c(0) }], rules: [{ kind: 'outnumber', safeGroup: 'safe', dangerGroup: 'danger' }] },
  { id: 'pairs', title: '10 家长配对过河', subtitle: '孩子不能在自己家长不在时，和别的家长单独同岸。', capacity: 2, items: [
    { id: 'pa', name: '甲爸', emoji: '👨', pair: 'ca', color: c(0) }, { id: 'ca', name: '甲孩', emoji: '🧒', pair: 'pa', color: c(1) }, { id: 'pb', name: '乙妈', emoji: '👩', pair: 'cb', color: c(2) }, { id: 'cb', name: '乙孩', emoji: '👧', pair: 'pb', color: c(3) }, { id: 'pc', name: '丙爸', emoji: '👨‍🦱', pair: 'cc', color: c(4) }, { id: 'cc', name: '丙孩', emoji: '👦', pair: 'pc', color: c(5) }], rules: [{ kind: 'jealous' }] },
  { id: 'torch', title: '11 火把过桥', subtitle: '四人都要过河，船坐 2 人；数字是速度提示，先想谁来回跑。', capacity: 2, items: [
    { id: 'fast1', name: '快1', emoji: '🏃', weight: 1, color: c(3) }, { id: 'fast2', name: '快2', emoji: '🚶', weight: 2, color: c(2) }, { id: 'slow5', name: '慢5', emoji: '🧍', weight: 5, color: c(1) }, { id: 'slow10', name: '慢10', emoji: '🐢', weight: 10, color: c(0) }], rules: [] },
  { id: 'mission-hard', title: '12 探险队升级', subtitle: '4 名探险员和 4 个野人，船坐 3 人；任一岸探险员不能少于野人。', capacity: 3, items: [
    { id: 'mh1', name: '探1', emoji: '🧭', group: 'safe', color: c(3) }, { id: 'mh2', name: '探2', emoji: '🧭', group: 'safe', color: c(3) }, { id: 'mh3', name: '探3', emoji: '🧭', group: 'safe', color: c(3) }, { id: 'mh4', name: '探4', emoji: '🧭', group: 'safe', color: c(3) }, { id: 'ch1', name: '野1', emoji: '🪓', group: 'danger', color: c(0) }, { id: 'ch2', name: '野2', emoji: '🪓', group: 'danger', color: c(0) }, { id: 'ch3', name: '野3', emoji: '🪓', group: 'danger', color: c(0) }, { id: 'ch4', name: '野4', emoji: '🪓', group: 'danger', color: c(0) }], rules: [{ kind: 'outnumber', safeGroup: 'safe', dangerGroup: 'danger' }] },
  { id: 'police-family-hard', title: '13 警察家庭完整版', subtitle: '小偷必须被警察看住；孩子离开自家家长时，不能和别的家长同岸。', capacity: 2, needsDriver: true, items: [
    { id: 'pf-police', name: '警察', emoji: '👮', canDrive: true, color: c(3) }, { id: 'pf-thief', name: '小偷', emoji: '🦹', canDrive: true, color: c(0) }, { id: 'pf-pa', name: '甲爸', emoji: '👨', canDrive: true, pair: 'pf-ca', color: c(1) }, { id: 'pf-ca', name: '甲孩', emoji: '🧒', pair: 'pf-pa', color: c(2) }, { id: 'pf-pb', name: '乙妈', emoji: '👩', canDrive: true, pair: 'pf-cb', color: c(4) }, { id: 'pf-cb', name: '乙孩', emoji: '👧', pair: 'pf-pb', color: c(5) }], rules: [{ kind: 'thief', guard: 'pf-police', thief: 'pf-thief', watched: ['pf-pa', 'pf-ca', 'pf-pb', 'pf-cb'] }, { kind: 'jealous' }] },
  { id: 'zoo-hard', title: '14 动物园管理员', subtitle: '老虎会伤羊、羊会吃草；狗会追猫、猫会抓鸟，管理员必须掌舵。', capacity: 2, needsDriver: true, items: [
    { id: 'keeper', name: '管理员', emoji: '🧑‍🌾', canDrive: true, color: c(3) }, { id: 'tiger-z', name: '老虎', emoji: '🐯', color: c(0) }, { id: 'goat-z', name: '山羊', emoji: '🐐', color: c(1) }, { id: 'grass-z', name: '草', emoji: '🌿', color: c(2) }, { id: 'dog-z', name: '狗', emoji: '🐶', color: c(4) }, { id: 'cat-z', name: '猫', emoji: '🐱', color: c(5) }, { id: 'bird-z', name: '鸟', emoji: '🐦', color: c(3) }], rules: [{ kind: 'eats', predator: 'tiger-z', prey: 'goat-z' }, { kind: 'eats', predator: 'goat-z', prey: 'grass-z' }, { kind: 'eats', predator: 'dog-z', prey: 'cat-z' }, { kind: 'eats', predator: 'cat-z', prey: 'bird-z' }] },
  { id: 'pairs-hard', title: '15 四组配对挑战', subtitle: '四组家长孩子都要过河；孩子不能离开自己的家长，和别的家长同岸。', capacity: 3, items: [
    { id: 'ha', name: '甲爸', emoji: '👨', pair: 'ka', color: c(0) }, { id: 'ka', name: '甲孩', emoji: '🧒', pair: 'ha', color: c(1) }, { id: 'hb', name: '乙妈', emoji: '👩', pair: 'kb', color: c(2) }, { id: 'kb', name: '乙孩', emoji: '👧', pair: 'hb', color: c(3) }, { id: 'hc', name: '丙爸', emoji: '👨‍🦱', pair: 'kc', color: c(4) }, { id: 'kc', name: '丙孩', emoji: '👦', pair: 'hc', color: c(5) }, { id: 'hd', name: '丁妈', emoji: '👩‍🦰', pair: 'kd', color: c(0) }, { id: 'kd', name: '丁孩', emoji: '🧒', pair: 'hd', color: c(1) }], rules: [{ kind: 'jealous' }] },
];
