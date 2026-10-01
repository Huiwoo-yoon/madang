// ===== 전통놀이 마당 (통합 시작 화면) =====
// 놀이를 새로 추가할 때: 폴더를 만들고 여기에 한 줄 추가한다. id는 폴더 이름이자 DB의 game 값.
const GAMES = [
  { id: 'ttakji', emoji: '🟨', name: '딱지치기 왕', desc: '초록 구간에서 딱! 쳐서 상대 딱지를 뒤집어요.' },
  { id: 'tuho', emoji: '🏺', name: '투호 왕', desc: '화살을 던져 항아리에 쏙 넣어요.' },
];
// 캐릭터 그림 (능력과 이름은 각 놀이의 game.js에 있다)
const CHAR_EMOJI = { kid: '🧒', grandpa: '👴', ninja: '🥷', boss: '🧑‍💼', wizard: '🧙', hero: '🦸', robot: '🤖', dragon: '🐲' };

const $ = (id) => document.getElementById(id);
const charEmoji = (id) => CHAR_EMOJI[id] || CHAR_EMOJI.kid;
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

async function showHub(p) {
  $('login').classList.add('hidden');
  $('hChar').textContent = charEmoji(p.character);
  $('hName').textContent = p.nickname;
  $('hPoints').textContent = p.points;
  renderGames([]);
  $('rankHead').innerHTML = `<tr><th>순위</th><th>캐릭터</th><th>닉네임</th><th>🏆 합계</th>${GAMES.map((g) => `<th>${g.emoji} ${g.name}</th>`).join('')}</tr>`;
  const cols = 4 + GAMES.length;
  $('rankBody').innerHTML = `<tr><td colspan="${cols}">불러오는 중…</td></tr>`;
  try {
    const rows = await API.leaderboard();
    renderGames(rows.filter((r) => r.id === API.myId()));
    renderRank(rows, cols);
  } catch (e) {
    $('rankBody').innerHTML = `<tr><td colspan="${cols}">순위를 불러오지 못했어요: ${escapeHtml(e.message)}</td></tr>`;
  }
}

// mine: 내 순위표 줄들 (아직 안 해 본 놀이는 줄이 없다)
function renderGames(mine) {
  $('games').innerHTML = GAMES.map((g) => {
    const s = mine.find((r) => r.game === g.id);
    return `<a class="card game" href="${g.id}/index.html">
      <div class="emoji">${g.emoji}</div><b>${g.name}</b><p>${g.desc}</p>
      <div class="mine">${s ? `🏆 ${s.trophies} · Lv ${s.level}` : '아직 안 해 봤어요'}</div></a>`;
  }).join('');
}

function renderRank(rows, cols) {
  const users = {};
  rows.forEach((r) => {
    const u = (users[r.id] ||= { ...r, total: 0, levels: 0, by: {} });
    u.total += r.trophies;
    u.levels += r.level;
    u.by[r.game] = r;
  });
  const list = Object.values(users).sort((a, b) => b.total - a.total || b.levels - a.levels);
  $('rankBody').innerHTML = list.map((u, i) =>
    `<tr class="${u.id === API.myId() ? 'me' : ''}"><td>${['🥇', '🥈', '🥉'][i] || i + 1}</td>
     <td>${charEmoji(u.character)}</td><td>${escapeHtml(u.nickname)}</td><td>${u.total}</td>
     ${GAMES.map((g) => `<td>${u.by[g.id] ? `🏆 ${u.by[g.id].trophies} · Lv ${u.by[g.id].level}` : '-'}</td>`).join('')}</tr>`).join('')
    || `<tr><td colspan="${cols}">아직 아무도 없어요.</td></tr>`;
}

// ===== 로그인 / 가입 =====
let authMode = 'login';

function setAuthMode(mode) {
  authMode = mode;
  $('authLoginTab').classList.toggle('sel', mode === 'login');
  $('authSignupTab').classList.toggle('sel', mode === 'signup');
  $('nickInput').classList.toggle('hidden', mode !== 'signup');
  $('authBtn').textContent = mode === 'login' ? '로그인' : '가입하고 시작!';
  $('pwInput').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('authErr').textContent = '';
}

function showLogin() {
  $('login').classList.remove('hidden');
  $('pwInput').value = '';
  $('authMode').textContent = API.online
    ? '🌐 온라인 모드: 어디서든 같은 아이디로 이어서 할 수 있어요.'
    : '💻 이 컴퓨터 전용 모드 (config.js가 비어 있음)';
  setAuthMode(authMode);
  $('idInput').focus();
}

async function submitAuth() {
  const id = $('idInput').value.trim().toLowerCase();
  const pw = $('pwInput').value;
  const nick = $('nickInput').value.trim();
  $('authErr').textContent = '';
  $('authBtn').disabled = true;
  try {
    showHub(authMode === 'login' ? await API.signIn(id, pw) : await API.signUp(id, pw, nick));
  } catch (e) {
    $('authErr').textContent = e.message;
  } finally {
    $('authBtn').disabled = false;
  }
}

$('authLoginTab').onclick = () => setAuthMode('login');
$('authSignupTab').onclick = () => setAuthMode('signup');
$('authBtn').onclick = submitAuth;
['idInput', 'pwInput', 'nickInput'].forEach((id) =>
  $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') submitAuth(); }));
$('logoutBtn').onclick = async () => {
  await API.signOut();
  showLogin();
};

API.restore()
  .then((p) => (p ? showHub(p) : showLogin()))
  .catch(() => showLogin());

// 놀이에서 '뒤로 가기'로 돌아오면 포인트가 예전 값일 수 있어서 새로 불러온다
window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
