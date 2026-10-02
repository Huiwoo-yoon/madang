// ===== 설정 =====
const GAME = 'ttakji'; // DB의 game 값
const MAX_LEVEL = 20;
const XP_PER_LEVEL = 10;

// 상대 딱지: 어려울수록(구간 좁고 게이지 빠름) 포인트가 많다
const TARGETS = [
  { id: 'paper', name: '종이 딱지',   pts: 1, width: 0.30, speed: 0.9, color: '#f4d35e' },
  { id: 'thick', name: '두꺼운 딱지', pts: 2, width: 0.22, speed: 1.2, color: '#ee964b' },
  { id: 'coat',  name: '코팅 딱지',   pts: 3, width: 0.16, speed: 1.5, color: '#4ea8de' },
  { id: 'iron',  name: '무쇠 딱지',   pts: 5, width: 0.10, speed: 1.9, color: '#8d99ae' },
];
const MY_BOSS_HP = 3;
// 대마왕은 트로피를 딸 때마다 세진다 (하트·바늘 속도·공격 확률 증가, 초록 구간 감소)
function bossSpec() {
  const t = S.trophies;
  return {
    stage: t + 1,
    hp: Math.min(8, 3 + Math.floor(t / 2)),
    width: Math.max(0.05, 0.09 - 0.005 * t),
    speed: Math.min(3.2, 2.1 * (1 + 0.06 * t)),
    hitChance: Math.min(0.75, 0.55 + 0.02 * t),
  };
}

const RARITY = {
  common: { name: '일반', color: '#8d99ae' },
  rare:   { name: '희귀', color: '#3a86ff' },
  epic:   { name: '영웅', color: '#9d4edd' },
  legend: { name: '전설', color: '#f77f00' },
};

// 잠금 조건: 조건을 만족하면 null, 아니면 이유 문장
const reqLevel = (n) => () => (S.level >= n || S.trophies > 0 ? null : `레벨 ${n} 달성 필요`);
const reqTrophy = (n) => () => (S.trophies >= n ? null : `트로피 ${n}개 필요`);

// ⚒️ 강화: 여러 번 살 수 있고, 살 때마다 강해진다
const UPGRADES = [
  { id: 'power', emoji: '💪', name: '힘센 딱지', rarity: 'common', max: 10, base: 20,
    desc: '초록 구간이 넓어져요.', flavor: '두꺼운 달력 종이를 세 겹 접은 묵직한 딱지.',
    effect: (lv) => `초록 구간 +${2 * lv}%` },
  { id: 'glove', emoji: '🧤', name: '마법 장갑', rarity: 'common', max: 10, base: 25,
    desc: '바늘이 천천히 움직여요.', flavor: '끼기만 해도 세상이 느려 보이는 장갑.',
    effect: (lv) => `바늘 속도 -${6 * lv}%` },
  { id: 'charm', emoji: '🍀', name: '행운 부적', rarity: 'rare', max: 10, base: 40,
    desc: '딱지를 뒤집을 때마다 포인트를 더 받아요.', flavor: '네잎클로버를 코팅해서 만든 부적.',
    effect: (lv) => `뒤집을 때 +${lv} 포인트` },
  { id: 'shield', emoji: '🛡️', name: '무쇠 방패', rarity: 'rare', max: 10, base: 30,
    desc: '대마왕이 내 딱지를 뒤집기 어려워져요.', flavor: '대장간 할아버지가 두드려 만든 방패.',
    effect: (lv) => `보스 공격 확률 -${4 * lv}%` },
  { id: 'lucky', emoji: '🌀', name: '기적의 바람', rarity: 'rare', max: 10, base: 45,
    desc: '빗나가도 바람이 불어서 딱지가 뒤집힐 수 있어요.', flavor: '운동장 구석에서 부는 수상한 바람.',
    effect: (lv) => `빗나가도 ${4 * lv}% 확률로 뒤집힘` },
  { id: 'perfect', emoji: '🎯', name: '명사수의 눈', rarity: 'epic', max: 10, base: 50,
    desc: '초록 구간 한가운데(진한 부분)를 맞히면 퍼펙트 보너스!', flavor: '한 번 본 딱지는 절대 놓치지 않는다.',
    effect: (lv) => `퍼펙트 +${3 * lv} 포인트` },
  { id: 'crit', emoji: '🔥', name: '불꽃 손목', rarity: 'epic', max: 10, base: 60,
    desc: '가끔 크리티컬이 터져서 포인트가 3배가 돼요.', flavor: '손목에서 불꽃이 튀는 전설의 스냅.',
    effect: (lv) => `크리티컬(×3) 확률 ${5 * lv}%` },
  { id: 'heart', emoji: '❤️', name: '여분 딱지', rarity: 'epic', max: 3, base: 150,
    desc: '보스전에서 내 목숨(하트)이 늘어나요.', flavor: '주머니 속에 몰래 넣어 둔 비상용 딱지.',
    effect: (lv) => `보스전 목숨 +${lv}` },
];
const upgradeCost = (it, lv) => Math.round(it.base * 1.6 ** lv); // 단계마다 1.6배씩 비싸진다

// 💎 전설: 한 번만 살 수 있는 아주 강한 아이템
const LEGENDS = [
  { id: 'magnet', emoji: '🧲', name: '자석 딱지', rarity: 'rare', cost: 300, req: null,
    desc: '빗나가도 상대 딱지가 살짝 끌려와서 1포인트를 받아요.', flavor: '냉장고 자석을 몰래 붙였다.' },
  { id: 'clock', emoji: '⏳', name: '시간 멈춤 시계', rarity: 'epic', cost: 600, req: reqLevel(5),
    desc: '바늘이 초록 구간 안에 들어오면 속도가 절반이 돼요.', flavor: '초록색을 보면 시간이 느려진다.' },
  { id: 'dorm', emoji: '🏢', name: '알바 기숙사', rarity: 'epic', cost: 800,
    req: () => (S.alba.hired ? null : '알바 고용 필요'),
    desc: '알바가 푹 쉬어서 알바 수입이 2배가 돼요.', flavor: '푹신한 침대와 간식 냉장고 완비.' },
  { id: 'gold', emoji: '👑', name: '황금 딱지', rarity: 'legend', cost: 1000, req: reqLevel(10),
    desc: '딱지를 뒤집어서 얻는 포인트가 전부 2배!', flavor: '진짜 금박을 입힌 딱지. 번쩍번쩍.' },
  { id: 'rainbow', emoji: '🌈', name: '무지개 딱지', rarity: 'legend', cost: 1200, req: reqTrophy(1),
    desc: '딱지를 뒤집을 때 얻는 경험치가 2배라서 레벨이 2배 빨리 올라요.', flavor: '비 온 뒤 운동장에서 주운 무지개 조각.' },
  { id: 'dragon', emoji: '🐉', name: '용의 딱지', rarity: 'legend', cost: 1500, req: reqLevel(15),
    desc: '대마왕 딱지를 한 번 뒤집을 때 하트를 2개 깎아요.', flavor: '용의 비늘로 접었다는 소문이 있다.' },
  { id: 'galaxy', emoji: '🌌', name: '우주 딱지', rarity: 'legend', cost: 5000, req: reqTrophy(3),
    desc: '딱지 포인트가 3배! 황금 딱지와 합치면 6배!', flavor: '별 가루로 만든, 우주에 하나뿐인 딱지.' },
];

// 🍬 소모품: 사자마자 효과가 켜지고, 시간이 지나거나 다 쓰면 사라진다
const CONSUMABLES = [
  { id: 'candy', emoji: '🍭', name: '집중 사탕', rarity: 'common', cost: 30,
    desc: '다음 10번 치는 동안 초록 구간이 1.5배!', flavor: '먹으면 눈이 초롱초롱해진다.' },
  { id: 'juice', emoji: '🧃', name: '파워 주스', rarity: 'rare', cost: 80,
    desc: '60초 동안 딱지 포인트 3배!', flavor: '한 모금에 팔에 힘이 불끈.' },
  { id: 'coffee', emoji: '☕', name: '알바 커피', rarity: 'rare', cost: 100,
    desc: '60초 동안 알바 수입 3배!', flavor: '알바가 제일 좋아하는 달달한 커피.' },
  { id: 'amulet', emoji: '📿', name: '보스 부적', rarity: 'epic', cost: 150,
    desc: '보스전에서 대마왕 공격을 1번 막아줘요. (여러 개 모을 수 있어요)', flavor: '할머니가 주신 부적.' },
];
const BUFF_SECONDS = 60;

// 🦸 캐릭터: 하나를 골라서 쓰고, 캐릭터마다 특별한 능력이 있다
// 능력 칸: width(초록 구간), slow(바늘 느리게), flat(뒤집을 때 +포인트), crit(크리티컬 확률),
//          mult(딱지 포인트 배율), alba(알바 수입 배율), hearts(보스전 목숨), shield(보스 공격 확률 -)
const CHARACTERS = [
  { id: 'kid', emoji: '🍄', name: '마리오 도령', rarity: 'common', cost: 0, req: null,
    ability: '능력 없음 (대신 공짜!)', flavor: '빨간 저고리에 빨간 모자. "이츠 미, 마리오!" 딱지치기는 처음이야.' },
  { id: 'grandpa', emoji: '⛏️', name: '스티브 총각', rarity: 'rare', cost: 300, req: null, width: 0.05,
    ability: '초록 구간 +5%', flavor: '블록을 만 개 쌓은 네모난 손은 절대 흔들리지 않는다.' },
  { id: 'ninja', emoji: '🎤', name: '조이 낭자', rarity: 'rare', cost: 500, req: null, slow: 0.15,
    ability: '바늘 속도 -15%', flavor: '속사포 랩을 하는 조이 눈에는 바늘이 느릿느릿.' },
  { id: 'boss', emoji: '💎', name: '보부상 주민', rarity: 'rare', cost: 600, req: null, alba: 1.5,
    ability: '알바 수입 1.5배', flavor: '"흐음~" 에메랄드 대신 포인트를 받는 장사의 달인.' },
  { id: 'wizard', emoji: '🌸', name: '미라 낭자', rarity: 'epic', cost: 900, req: reqLevel(10), crit: 0.1,
    ability: '크리티컬 확률 +10%', flavor: '곡도를 한 번 휘두르면 딱지에서 불꽃이 튄다.' },
  { id: 'hero', emoji: '💜', name: '루미 낭자', rarity: 'epic', cost: 1200, req: reqTrophy(1), hearts: 2, shield: 0.1,
    ability: '보스전 목숨 +2, 보스 공격 확률 -10%', flavor: '악귀 잡는 헌터들의 리더. 대마왕도 무섭지 않다.' },
  { id: 'robot', emoji: '🧨', name: '크리퍼 도령', rarity: 'legend', cost: 2500, req: reqTrophy(2), width: 0.05, flat: 5,
    ability: '초록 구간 +5%, 뒤집을 때 +5 포인트', flavor: '쉬이익… 터지기 직전의 엄청난 집중력.' },
  { id: 'dragon', emoji: '🦖', name: '아기 용 요시', rarity: 'legend', cost: 4000, req: reqTrophy(3), mult: 2, crit: 0.05,
    ability: '딱지 포인트 2배, 크리티컬 +5%', flavor: '긴 혀를 날름! 입김 한 번에 딱지가 날아간다.' },
  // 그리스 로마 신화
  { id: 'odysseus', emoji: '🏹', name: '오디세우스 장군', rarity: 'rare', cost: 700, req: null, width: 0.03, slow: 0.08,
    ability: '초록 구간 +3%, 바늘 속도 -8%', flavor: '트로이 목마를 생각해 낸 꾀돌이. 딱지 접는 법도 열 가지나 안다.' },
  { id: 'cyclops', emoji: '👁️', name: '외눈박이 키클롭스', rarity: 'rare', cost: 800, req: null, flat: 3,
    ability: '뒤집을 때 +3 포인트', flavor: '"누가 내 딱지를 뒤집었지?" 힘 하나는 장사.' },
  { id: 'athena', emoji: '🦉', name: '아테나 낭자', rarity: 'epic', cost: 1000, req: reqLevel(8), hearts: 1, shield: 0.15,
    ability: '보스전 목숨 +1, 보스 공격 확률 -15%', flavor: '지혜의 여신. 아이기스 방패 앞에서는 대마왕도 움찔.' },
  { id: 'medusa', emoji: '🐍', name: '메두사 낭자', rarity: 'epic', cost: 1500, req: reqLevel(12), slow: 0.25,
    ability: '바늘 속도 -25%', flavor: '눈이 마주치면 바늘도 돌처럼 굳어 버린다.' },
  { id: 'poseidon', emoji: '🔱', name: '포세이돈 대감', rarity: 'legend', cost: 3000, req: reqTrophy(2), alba: 2, flat: 2,
    ability: '알바 수입 2배, 뒤집을 때 +2 포인트', flavor: '삼지창을 한 번 휘두르면 파도가 포인트를 실어 온다.' },
  { id: 'zeus', emoji: '⚡', name: '제우스 대감', rarity: 'legend', cost: 6000, req: reqTrophy(4), mult: 2, crit: 0.15,
    ability: '딱지 포인트 2배, 크리티컬 +15%', flavor: '번개 한 방에 온 동네 딱지가 다 뒤집힌다.' },
];

const ALBA_HIRE_COST = 30;
const albaUpgradeCost = (lv) => Math.round(50 * 1.5 ** (lv - 1)); // 단계마다 1.5배씩 비싸진다

// ===== 저장 =====
const newState = () => ({
  points: 0, level: 1, xp: 0, trophies: 0,
  items: {}, legend: {}, buffs: { candy: 0, juice: 0, coffee: 0, amulet: 0 },
  alba: { hired: false, level: 0, earned: 0 },
  char: 'kid', chars: { kid: true },
});
let P = null; // 로그인한 계정 { id, username, nickname, ... }
// 현재 플레이어 상태. 포인트·캐릭터는 모든 놀이 공용(프로필)이고, 나머지는 이 놀이의 저장에 들어간다
let S = null;

// 저장 데이터에 없는 칸 채우기
function fillState(s = {}) {
  const d = newState();
  return { ...d, ...s, buffs: { ...d.buffs, ...s.buffs }, alba: { ...d.alba, ...s.alba }, chars: s.chars || d.chars };
}

// 알바가 1초마다 벌기 때문에 매번 서버에 보내지 않고, 모아서 3초에 한 번 저장한다
let dirty = false, saveTimer = null, saving = false;
function save() {
  dirty = true;
  if (!saveTimer) saveTimer = setTimeout(flush, 3000);
}
async function flush() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!dirty || !S || saving) return;
  dirty = false;
  saving = true;
  try {
    const { points, char, chars, trophies, level, ...data } = S;
    const row = await API.save(GAME, { points, character: char, chars, trophies, level, data });
    if (row.trophies !== S.trophies) { // 서버가 트로피를 받아주지 않았다 (너무 빨리 땀)
      S.trophies = row.trophies;
      toast('⚠️ 트로피가 너무 빨리 늘어서 서버가 받아주지 않았어요.');
      renderHeader();
    }
    $('saveState').textContent = '';
  } catch (e) {
    dirty = true;
    $('saveState').textContent = '⚠️ 저장 실패 (다시 시도 중)';
    save();
  } finally {
    saving = false;
  }
}
window.addEventListener('beforeunload', flush);
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

// ===== 능력치 계산 =====
const lv = (id) => S.items[id] || 0;
const has = (id) => !!S.legend[id];
const now = () => Date.now();
const me = () => CHARACTERS.find((c) => c.id === S.char) || CHARACTERS[0];
const cv = (key, dflt = 0) => me()[key] ?? dflt;
const juiceOn = () => S.buffs.juice > now();
const coffeeOn = () => S.buffs.coffee > now();

const pointMult = () => cv('mult', 1) * (has('gold') ? 2 : 1) * (has('galaxy') ? 3 : 1) * (juiceOn() ? 3 : 1);
const xpMult = () => (has('rainbow') ? 2 : 1);
const albaRate = () => Math.round(S.alba.level * (has('dorm') ? 2 : 1) * (coffeeOn() ? 3 : 1) * cv('alba', 1));
const bossChance = () => Math.max(0.15, bossSpec().hitChance - 0.04 * lv('shield') - cv('shield'));
const bossMyHp = () => MY_BOSS_HP + lv('heart') + cv('hearts');

function specFor(base) {
  let width = base.width + 0.02 * lv('power') + cv('width');
  if (S.buffs.candy > 0) width *= 1.5;
  return { width: Math.min(0.6, width), speed: base.speed * (1 - 0.06 * lv('glove')) * (1 - cv('slow')) };
}

// ===== 포인트 / 레벨 =====
// n: 포인트(돈), xp: 경험치. 경험치는 직접 뒤집은 딱지의 기본 점수만 쌓인다
// (아이템 배율·알바로 번 포인트는 돈만 늘고 레벨은 안 올린다)
function earn(n, xp = 0) {
  S.points += n;
  let leveled = false;
  if (S.level < MAX_LEVEL && xp > 0) {
    S.xp += xp * xpMult();
    while (S.xp >= XP_PER_LEVEL && S.level < MAX_LEVEL) {
      S.xp -= XP_PER_LEVEL;
      S.level++;
      leveled = true;
      toast(S.level === MAX_LEVEL ? '👑 레벨 20! 최종 보스가 나타났다!' : `⬆️ 레벨 업! Lv ${S.level}`);
    }
    if (S.level === MAX_LEVEL) S.xp = 0;
  }
  save();
  renderHeader();
  if (leveled && tab === 'mart') renderMart(); // 레벨로 잠금이 풀릴 수 있음
  if (leveled && tab === 'char') renderChars();
}

// ===== 화면 공통 =====
const $ = (id) => document.getElementById(id);
let tab = 'play';

function renderHeader() {
  $('hName').textContent = P.nickname;
  $('hChar').innerHTML = Pixel.img(me().id, 2, true);
  $('meEmoji').innerHTML = Pixel.img(me().id, 4);
  $('meName').textContent = me().name;
  $('hPoints').textContent = S.points;
  $('hLevel').textContent = S.level;
  $('hTrophy').textContent = S.trophies;
  const max = S.level === MAX_LEVEL;
  $('hXp').style.width = (max ? 100 : (S.xp / XP_PER_LEVEL) * 100) + '%';
  $('hXpText').textContent = max ? 'MAX' : `${S.xp}/${XP_PER_LEVEL}`;
  $('bossBanner').classList.toggle('hidden', !max || boss !== null);
  $('bossTitle').textContent = `👑 레벨 20! 딱지 대마왕 쿠파 ${bossSpec().stage}단계가 나타났다! (하트 ${bossSpec().hp}개)`;
  if (tab === 'mart' || tab === 'char') refreshMart();
}

function renderBuffs() {
  const b = S.buffs, chips = [];
  if (b.candy > 0) chips.push(`🍭 집중 사탕 ${b.candy}번 남음`);
  if (juiceOn()) chips.push(`🧃 포인트 ×3 · ${Math.ceil((b.juice - now()) / 1000)}초`);
  if (coffeeOn()) chips.push(`☕ 알바 ×3 · ${Math.ceil((b.coffee - now()) / 1000)}초`);
  if (b.amulet > 0) chips.push(`📿 보스 부적 ${b.amulet}개`);
  $('buffs').innerHTML = chips.map((c) => `<span>${c}</span>`).join('');
}

let toastTimer;
function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2000);
}

function floatText(text, parent = $('floats'), color) {
  const f = document.createElement('div');
  f.className = 'float';
  f.textContent = text;
  if (color) f.style.color = color;
  parent.appendChild(f);
  setTimeout(() => f.remove(), 1000);
}

document.querySelectorAll('nav button').forEach((b) =>
  b.addEventListener('click', () => showTab(b.dataset.tab)));

function showTab(name) {
  tab = name;
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab').forEach((s) => s.classList.toggle('hidden', s.id !== 'tab-' + name));
  if (name === 'mart') renderMart();
  if (name === 'alba') renderAlba();
  if (name === 'char') renderChars();
  if (name === 'rank') renderRank();
}

// ===== 딱지치기 =====
let target = TARGETS[0];
let pos = 0, dir = 1, zoneCenter = 0.5, busy = false, lastT = 0;
let boss = null; // { hp, myHp, maxMy } 보스전 중일 때만

const currentSpec = () => specFor(boss ? bossSpec() : target);

function renderTargets() {
  const box = $('targets');
  box.innerHTML = '';
  TARGETS.forEach((t) => {
    const b = document.createElement('button');
    b.className = t === target ? 'sel' : '';
    b.innerHTML = `<div class="sw" style="background:${t.color}"></div><b>${t.name}</b>경험치 +${t.pts}`;
    b.onclick = () => { if (!busy) { target = t; renderTargets(); newRound(); } };
    box.appendChild(b);
  });
}

function resetEnemy() {
  const e = $('enemy');
  e.style.transition = 'none';
  e.classList.remove('flip', 'shake');
  e.classList.toggle('boss', !!boss);
  $('bossChar').classList.toggle('hidden', !boss);
  $('arena').classList.toggle('night', !!boss);
  e.querySelector('.front').style.setProperty('--c', boss ? '' : target.color);
  e.querySelector('.back').textContent = boss ? '😵' : '✨';
  void e.offsetWidth;
  e.style.transition = '';
}

function newRound() {
  const { width } = currentSpec();
  zoneCenter = width / 2 + 0.03 + Math.random() * (1 - width - 0.06);
  $('zone').style.left = (zoneCenter - width / 2) * 100 + '%';
  $('zone').style.width = width * 100 + '%';
  $('zone').classList.toggle('has-perfect', lv('perfect') > 0);
  resetEnemy();
  renderBuffs();
  busy = false;
  $('hitBtn').disabled = false;
}

function loop(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000);
  lastT = t;
  if (!busy && S) {
    const { width, speed } = currentSpec();
    const inZone = Math.abs(pos - zoneCenter) <= width / 2;
    pos += dir * speed * (has('clock') && inZone ? 0.5 : 1) * dt;
    if (pos > 1) { pos = 1; dir = -1; }
    if (pos < 0) { pos = 0; dir = 1; }
    $('needle').style.left = pos * 100 + '%';
  }
  requestAnimationFrame(loop);
}

function hit() {
  if (busy || !S || tab !== 'play') return;
  busy = true;
  $('hitBtn').disabled = true;
  const { width } = currentSpec();
  const dist = Math.abs(pos - zoneCenter);
  let success = dist <= width / 2;
  const miracle = !success && Math.random() < 0.04 * lv('lucky');
  if (miracle) success = true;
  if (S.buffs.candy > 0) S.buffs.candy--;
  const e = $('enemy');
  const m = $('player');
  m.classList.remove('throw'); void m.offsetWidth; m.classList.add('throw');

  if (boss) return bossHit(success, miracle);

  if (success) {
    e.classList.add('flip');
    const tags = [];
    let gain = target.pts + lv('charm') + cv('flat');
    if (miracle) tags.push('🌀 기적!');
    if (!miracle && lv('perfect') > 0 && dist <= width / 6) { gain += 3 * lv('perfect'); tags.push('🎯 퍼펙트!'); }
    if (Math.random() < 0.05 * lv('crit') + cv('crit')) { gain *= 3; tags.push('🔥 크리티컬!'); }
    gain *= pointMult();
    earn(gain, target.pts);
    floatText('+' + gain);
    $('msg').textContent = `${tags.join(' ')} 딱! ${target.name}를 뒤집었다! +${gain} 포인트, 경험치 +${target.pts * xpMult()}`;
  } else {
    e.classList.add('shake');
    if (has('magnet')) { earn(1); floatText('🧲 +1', $('floats'), '#8d99ae'); }
    $('msg').textContent = has('magnet') ? '아깝다! 그래도 자석 덕분에 +1 포인트' : '아깝다! 안 뒤집혔어요.';
  }
  save();
  setTimeout(newRound, success ? 900 : 500);
}

// ===== 보스전 =====
const hearts = (n, max) => '❤️'.repeat(Math.max(0, n)) + '🤍'.repeat(max - Math.max(0, n));

function startBoss() {
  boss = { hp: bossSpec().hp, maxHp: bossSpec().hp, myHp: bossMyHp(), maxMy: bossMyHp() };
  $('normalMode').classList.add('hidden');
  $('bossMode').classList.remove('hidden');
  renderBossHp();
  renderHeader();
  $('msg').textContent = `대마왕 ${bossSpec().stage}단계! 대마왕의 딱지를 ${boss.maxHp}번 뒤집으면 승리! 내 딱지가 ${boss.maxMy}번 뒤집히면 패배!`;
  newRound();
}

function renderBossHp() {
  $('myHp').textContent = hearts(boss.myHp, boss.maxMy);
  $('bossHp').textContent = hearts(boss.hp, boss.maxHp);
}

function bossHit(success, miracle) {
  const e = $('enemy');
  if (success) {
    const dmg = has('dragon') ? 2 : 1;
    boss.hp -= dmg;
    e.classList.add('flip');
    floatText(dmg === 2 ? '🐉 딱!! -2' : '딱!');
    $('msg').textContent = (miracle ? '🌀 기적의 바람! ' : '') + '대마왕의 딱지를 뒤집었다!';
  } else {
    e.classList.add('shake');
    $('msg').textContent = '빗나갔다...';
  }
  renderBossHp();
  save();
  if (boss.hp <= 0) return setTimeout(() => boss && endBoss(true), 900);

  // 보스 차례
  setTimeout(() => {
    if (!boss) return; // 도중에 플레이어를 바꾼 경우
    if (Math.random() < bossChance()) {
      if (S.buffs.amulet > 0) {
        S.buffs.amulet--;
        save();
        floatText('📿 막았다!', $('floats'), '#9d4edd');
        $('msg').textContent = '📿 보스 부적이 대마왕의 공격을 막았다! 내 차례!';
      } else {
        boss.myHp--;
        floatText('내 딱지가 뒤집혔다!', $('floats'), '#9d0208');
        $('msg').textContent = '👑 대마왕이 내 딱지를 뒤집었다!';
      }
    } else {
      $('msg').textContent = '👑 대마왕의 공격을 버텼다! 내 차례!';
    }
    renderBossHp();
    if (boss.myHp <= 0) return setTimeout(() => boss && endBoss(false), 900);
    newRound();
  }, 1100);
}

function endBoss(win) {
  boss = null;
  $('normalMode').classList.remove('hidden');
  $('bossMode').classList.add('hidden');
  if (win) {
    S.trophies++;
    S.level = 1;
    S.xp = 0;
    save();
    flush(); // 트로피는 바로 저장
    toast('🏆 보스를 이겼다! 트로피 +1. 다시 레벨 1부터!');
    $('msg').textContent = '🏆 승리! 트로피를 얻었어요. 다시 레벨 1부터 시작!';
  } else {
    toast('💀 졌다... 마트에서 업그레이드하고 다시 도전!');
    $('msg').textContent = '졌어요. 포인트를 모아 아이템을 사고 다시 도전하세요!';
  }
  renderHeader();
  newRound();
}

$('bossBtn').onclick = startBoss;
$('hitBtn').onclick = hit;
document.addEventListener('keydown', (ev) => {
  if (ev.code === 'Space' && document.activeElement.tagName !== 'INPUT') { ev.preventDefault(); hit(); }
});

// ===== 마트 =====
const MART_TABS = [
  ['up', '⚒️ 강화', '여러 번 살 수 있어요. 살 때마다 한 단계씩 더 강해져요.'],
  ['legend', '💎 전설', '딱 한 번만 살 수 있는 엄청 강한 아이템! 조건을 만족해야 잠금이 풀려요.'],
  ['use', '🍬 소모품', '사자마자 효과가 켜져요. 시간이 지나거나 다 쓰면 사라져요.'],
  ['alba', '🧑‍🔧 알바', '알바는 알바 공간에서 딱지를 쳐서 1초마다 포인트를 벌어와요.'],
];
let martTab = 'up';

function buy(cost, apply, message) {
  if (S.points < cost) return;
  S.points -= cost;
  apply();
  save();
  toast(message);
  renderHeader();
  renderMart();
  renderBuffs();
  if (!busy) newRound();
}

// 아이템 카드 하나 만들기
function itemCard({ emoji, name, rarity, badge, badgeId, desc, flavor, effect, cost, lock, owned, onBuy }) {
  const r = RARITY[rarity];
  const c = document.createElement('div');
  c.className = 'card item' + (lock ? ' locked' : '') + (owned ? ' owned' : '');
  c.style.setProperty('--r', r.color);
  c.innerHTML = `
    <div class="rarity">${r.name}</div>
    <div class="emoji">${emoji}</div>
    <b class="name">${name}</b>${badge || badgeId ? `<div class="badge"${badgeId ? ` id="${badgeId}"` : ''}>${badge}</div>` : ''}
    ${desc ? `<p class="desc">${desc}</p>` : ''}
    ${effect ? `<div class="effect">${effect}</div>` : ''}
    <p class="flavor">"${flavor}"</p>`;
  const b = document.createElement('button');
  b.className = 'btn primary';
  if (owned) { b.textContent = owned; b.disabled = true; }
  else if (lock) { b.textContent = '🔒 ' + lock; b.disabled = true; }
  else { b.textContent = `💰 ${cost} 사기`; b.dataset.cost = cost; b.onclick = onBuy; }
  c.appendChild(b);
  return c;
}

const pips = (n, max) => `<span class="pips">${'<i class="on"></i>'.repeat(n)}${'<i></i>'.repeat(max - n)}</span>`;

function renderMart() {
  renderStats();
  $('martTabs').innerHTML = MART_TABS.map(([id, label]) =>
    `<button data-m="${id}" class="${id === martTab ? 'sel' : ''}">${label}</button>`).join('');
  $('martTabs').querySelectorAll('button').forEach((b) => (b.onclick = () => { martTab = b.dataset.m; renderMart(); }));
  $('martIntro').textContent = MART_TABS.find(([id]) => id === martTab)[2];

  const box = $('items');
  box.innerHTML = '';
  box.classList.toggle('hidden', martTab === 'alba');
  $('albaShop').classList.toggle('hidden', martTab !== 'alba');

  if (martTab === 'up') UPGRADES.forEach((it) => {
    const l = lv(it.id), maxed = l >= it.max;
    box.appendChild(itemCard({
      ...it,
      badge: `Lv ${l}/${it.max} ${pips(l, it.max)}`,
      effect: maxed ? `지금: ${it.effect(l)} <b>(최대)</b>`
        : `지금: ${l ? it.effect(l) : '없음'}<br>다음: <b>${it.effect(l + 1)}</b>`,
      cost: upgradeCost(it, l),
      owned: maxed && '✅ 최대 레벨',
      onBuy: () => buy(upgradeCost(it, l), () => (S.items[it.id] = l + 1), `${it.emoji} ${it.name} Lv ${l + 1}! ${it.effect(l + 1)}`),
    }));
  });

  if (martTab === 'legend') LEGENDS.forEach((it) => box.appendChild(itemCard({
    ...it,
    lock: it.req && it.req(),
    owned: has(it.id) && '✅ 가지고 있음',
    onBuy: () => buy(it.cost, () => (S.legend[it.id] = true), `${it.emoji} 전설 아이템 ${it.name} 획득!`),
  })));

  if (martTab === 'use') CONSUMABLES.forEach((it) => box.appendChild(itemCard({
    ...it,
    badge: buffStatus(it.id),
    badgeId: 'buff-' + it.id,
    onBuy: () => buy(it.cost, () => useConsumable(it.id), `${it.emoji} ${it.name} 사용!`),
  })));

  if (martTab === 'alba') renderAlbaShop();
  refreshMart();
}

function buffStatus(id) {
  const b = S.buffs;
  if (id === 'candy' && b.candy > 0) return `효과 중: ${b.candy}번 남음`;
  if (id === 'juice' && juiceOn()) return `효과 중: ${Math.ceil((b.juice - now()) / 1000)}초 남음`;
  if (id === 'coffee' && coffeeOn()) return `효과 중: ${Math.ceil((b.coffee - now()) / 1000)}초 남음`;
  if (id === 'amulet' && b.amulet > 0) return `가진 개수: ${b.amulet}개`;
  return '';
}

// 같은 소모품을 또 사면 효과가 더 길어진다
function useConsumable(id) {
  const b = S.buffs;
  if (id === 'candy') b.candy += 10;
  if (id === 'amulet') b.amulet++;
  if (id === 'juice' || id === 'coffee') b[id] = Math.max(b[id], now()) + BUFF_SECONDS * 1000;
}

function renderAlbaShop() {
  const a = S.alba;
  const shop = $('albaShop');
  const cost = a.hired ? albaUpgradeCost(a.level) : ALBA_HIRE_COST;
  const bonus = [has('dorm') && '🏢 기숙사 ×2', coffeeOn() && '☕ 커피 ×3'].filter(Boolean).join(', ');
  shop.innerHTML = `<div class="emoji">${Pixel.img('tiger', 3)}</div>
    <div class="info">${a.hired
      ? `<b>딱지 알바 Lv ${a.level}</b><br>
         지금: 1초에 <b>${albaRate()}포인트</b>${bonus ? ` (${bonus})` : ''}<br>
         다음 레벨: 1초에 <b>${albaRate() / a.level * (a.level + 1)}포인트</b><br>
         <small>지금까지 벌어온 포인트: ${a.earned}</small>`
      : `<b>딱지 알바</b><br>알바 공간에서 딱지를 쳐서 1초에 1포인트씩 벌어와요.<br>
         <small>레벨을 올리면 1초에 2, 3, 4… 포인트로 늘어나요.</small>`}</div>`;
  const b = document.createElement('button');
  b.className = 'btn primary';
  b.textContent = a.hired ? `💰 ${cost} 업그레이드` : `💰 ${cost} 고용하기`;
  b.dataset.cost = cost;
  b.onclick = () => buy(cost, () => {
    if (a.hired) a.level++;
    else { a.hired = true; a.level = 1; }
  }, a.hired ? `🧑‍🔧 알바 Lv ${a.level + 1}!` : '🧑‍🔧 알바를 고용했어요!');
  shop.appendChild(b);
}

// 포인트가 바뀔 때마다 카드 전체를 다시 그리지 않고 버튼만 켜고 끈다
function refreshMart() {
  document.querySelectorAll('#tab-mart button[data-cost], #tab-char button[data-cost]').forEach((b) => (b.disabled = S.points < +b.dataset.cost));
  renderStats();
}

function renderStats() {
  const paper = specFor(TARGETS[0]);
  const paperGain = (TARGETS[0].pts + lv('charm') + cv('flat')) * pointMult();
  const rows = [
    ['🦸', '캐릭터', `${me().emoji} ${me().name}`],
    ['🟩', '초록 구간 (종이 딱지)', `${Math.round(paper.width * 100)}%`],
    ['⏱️', '바늘 속도', `${Math.round((1 - 0.06 * lv('glove')) * (1 - cv('slow')) * 100)}%${has('clock') ? ' (구간 안 ½)' : ''}`],
    ['💰', '종이 딱지 1번', `+${paperGain} 포인트`],
    ['✖️', '포인트 배율', `×${pointMult()}`],
    ['🔥', '크리티컬 (×3)', `${Math.round((0.05 * lv('crit') + cv('crit')) * 100)}%`],
    ['🎯', '퍼펙트 보너스', `+${3 * lv('perfect')}`],
    ['🌀', '기적 확률', `${4 * lv('lucky')}%`],
    ['🧲', '빗나가면', has('magnet') ? '+1 포인트' : '0'],
    ['⭐', '경험치 배율', `×${xpMult()}`],
    ['😈', '다음 대마왕', `${bossSpec().stage}단계 · 하트 ${bossSpec().hp}개`],
    ['👑', '보스 공격 확률', `${Math.round(bossChance() * 100)}%`],
    ['❤️', '보스전 내 목숨', `${bossMyHp()}개`],
    ['🐉', '보스 한 방', has('dragon') ? '하트 2개' : '하트 1개'],
    ['🧑‍🔧', '알바 수입', S.alba.hired ? `${albaRate()}/초` : '알바 없음'],
  ];
  $('stats').innerHTML = rows.map(([e, k, v]) => `<div><span>${e} ${k}</span><b>${v}</b></div>`).join('');
}

// ===== 캐릭터 =====
function renderChars() {
  const box = $('chars');
  box.innerHTML = '';
  CHARACTERS.forEach((c) => {
    const owned = S.chars[c.id], using = S.char === c.id;
    const card = itemCard({
      ...c,
      emoji: Pixel.img(c.id, 3),
      desc: '',
      effect: `✨ ${c.ability}`,
      lock: !owned && c.req && c.req(),
      owned: using ? '✅ 사용 중' : '',
      onBuy: () => buyChar(c),
    });
    card.classList.toggle('using', using);
    const b = card.querySelector('button');
    if (owned && !using) { // 이미 산 캐릭터는 공짜로 바꾸기
      b.textContent = '이 캐릭터로 바꾸기';
      delete b.dataset.cost;
      b.disabled = false;
      b.onclick = () => pickChar(c);
    } else if (!owned && !c.cost) b.textContent = '공짜';
    box.appendChild(card);
  });
  refreshMart();
}

function buyChar(c) {
  if (S.points < c.cost) return;
  S.points -= c.cost;
  S.chars[c.id] = true;
  pickChar(c);
}

function pickChar(c) {
  S.char = c.id;
  save();
  toast(`${c.emoji} ${c.name}(으)로 바꿨어요! ${c.ability}`);
  renderHeader();
  renderChars();
  if (!busy) newRound();
}

// ===== 알바 =====
function renderAlba() {
  const a = S.alba;
  $('albaRoom').innerHTML = a.hired
    ? `<div class="room">
         <div class="worker" id="worker">${Pixel.img('tiger', 4)}</div>
         <div class="ttakji" id="albaTtakji"><div class="face front"></div><div class="face back">✨</div></div>
         <div class="rate" id="albaRate">1초에 +${albaRate()} 포인트 (알바 Lv ${a.level})</div>
         <p>알바가 지금까지 벌어온 포인트: <b id="albaEarned">${a.earned}</b></p>
         <div id="albaFloats"></div>
       </div>`
    : `<div class="card">아직 알바가 없어요. 🏪 마트에서 알바를 고용하세요! (💰 ${ALBA_HIRE_COST})</div>`;
}

setInterval(() => {
  if (!S) return;
  if (tab === 'play') renderBuffs();
  if (tab === 'mart' && martTab === 'use') CONSUMABLES.forEach((it) => ($('buff-' + it.id).innerHTML = buffStatus(it.id)));
  if (!S.alba.hired) return;
  const n = albaRate();
  S.alba.earned += n;
  earn(n);
  if (tab === 'alba') {
    const w = $('worker'), t = $('albaTtakji');
    if (!w) return renderAlba();
    w.classList.remove('swing'); void w.offsetWidth; w.classList.add('swing');
    t.classList.toggle('flip');
    $('albaEarned').textContent = S.alba.earned;
    $('albaRate').textContent = `1초에 +${n} 포인트 (알바 Lv ${S.alba.level})`;
    floatText('+' + n, document.querySelector('.room'));
  }
}, 1000);

// ===== 순위 (온라인) =====
async function renderRank() {
  const body = $('rankBody');
  body.innerHTML = '<tr><td colspan="5">불러오는 중…</td></tr>';
  await flush(); // 내 최신 기록을 먼저 올린다
  try {
    const rows = await API.leaderboard(GAME);
    const myId = API.myId();
    body.innerHTML = rows.map((p, i) =>
      `<tr class="${p.id === myId ? 'me' : ''}"><td>${['🥇', '🥈', '🥉'][i] || i + 1}</td>
       <td>${Pixel.img(p.character, 2, true)}</td>
       <td>${escapeHtml(p.nickname)}</td><td>${p.trophies}</td><td>Lv ${p.level}</td></tr>`).join('')
      || '<tr><td colspan="5">아직 아무도 없어요.</td></tr>';
  } catch (e) {
    body.innerHTML = `<tr><td colspan="5">순위를 불러오지 못했어요: ${escapeHtml(e.message)}</td></tr>`;
  }
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ===== 시작 =====
// 로그인은 마당(통합 시작 화면)에서 한다. profile: 공용 프로필, row: 이 놀이의 저장
function startGame(profile, row) {
  P = profile;
  S = fillState(row.data);
  S.points = profile.points;
  S.char = profile.character;
  S.chars = profile.chars;
  S.trophies = row.trophies; // 순위에 쓰는 값은 서버 기준
  S.level = row.level;
  $('arena').style.setProperty('--bg', `url(${Pixel.scene('yard')})`);
  $('bossChar').innerHTML = Pixel.img('bowser', 5);
  renderHeader();
  renderTargets();
  newRound();
  showTab('play');
  Scary.start(() => !!boss); // 무서운 수학: 5분마다 문제 (보스전 중에는 미룸)
}

const goHome = () => (location.href = '../index.html');
$('homeBtn').onclick = async () => {
  await flush();
  goHome();
};

API.restore()
  .then(async (p) => (p ? startGame(p, await API.loadGame(GAME)) : goHome()))
  .catch((e) => ($('msg').textContent = '⚠️ 저장 데이터를 불러오지 못했어요: ' + e.message));
requestAnimationFrame(loop);
