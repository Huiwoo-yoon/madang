/*
 * 화면 연결(app.js) — 마당용: 한글·영어마다 '오늘의 문제' 하나, 다 풀면 하루에 한 번 포인트를 받는다 (../mini.js).
 * 상태 표시는 전부 class / data-* 속성으로만 합니다. 모양은 ../mini.css 에 있습니다.
 *   td.cell                     글자 칸      td.block  빈 칸(검은 칸)
 *   td[data-number]             번호가 있는 칸
 *   .is-active                  현재 선택한 칸      .in-word  선택한 단어에 속한 칸
 *   .is-correct / .is-wrong     채점 결과           .is-revealed  힌트로 공개된 칸
 *   li.is-solved                맞힌 단어의 힌트 목록 항목
 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var PUZZLES = window.WORDCROSS_PUZZLES;
  var WC = window.WordCross;
  // 보상 포인트. 한 글자 힌트를 한 번 쓸 때마다 10%씩 줄고, 아무리 줄어도 30%는 받는다 (초성 힌트는 공짜)
  var LANGS = [
    { key: "ko", name: "한글", reward: 300 },
    { key: "en", name: "영어", reward: 500 }
  ];

  var game = null, puzzle = null, inputs = [], cur = { row: 0, col: 0, dir: "across" }, store = null, base = 0;
  function finish() { Mini.finish(Math.round(base * Math.max(0.3, 1 - 0.1 * game.hintCount)), "다 맞혔어요! (힌트 " + game.hintCount + "번)"); }

  function save() { store.set(puzzle.id, JSON.stringify(game.serialize())); }
  function load(id) { try { return JSON.parse(store.get(id)); } catch (e) { return null; } }

  // ---------- 한글·영어 고르기 (하나마다 오늘의 문제 하나) ----------
  function showMenu() {
    $("play").hidden = true; $("menu").hidden = false;
    $("doneNote").hidden = !Mini.doneToday();
    var wrap = $("langs"); wrap.innerHTML = "";
    LANGS.forEach(function (lang) {
      var list = PUZZLES.filter(function (p) { return p.lang === lang.key; });
      var p = list[Mini.dayNumber() % list.length];
      var b = document.createElement("button");
      b.type = "button"; b.className = "pick"; b.dataset.lang = lang.key; b.disabled = Mini.doneToday();
      b.innerHTML = "<b>" + lang.name + "</b><span>오늘의 문제: " + p.title + "</span><span class=\"reward\">💰 +" + lang.reward + "</span>";
      b.onclick = function () { base = lang.reward; start(p.id); };
      wrap.appendChild(b);
    });
  }

  // ---------- 판 시작 ----------
  function start(id) {
    var def = PUZZLES.filter(function (p) { return p.id === id; })[0];
    puzzle = WC.buildPuzzle(def);
    game = new WC.Game(puzzle);
    game.restore(load(id));
    game.on(function (type) {
      if (type === "change" || type === "reveal") save();
      if (type === "wordSolved") refreshClues();
      if (type === "solved") finish();
    });
    $("menu").hidden = true; $("play").hidden = false;
    $("title").textContent = puzzle.title + " · 💰 +" + base;
    $("message").textContent = ""; $("cheer").innerHTML = ""; $("retryBtn").hidden = true;
    $("cross").style.setProperty("--cols", puzzle.cols);
    $("btn-chosung").hidden = puzzle.lang !== "ko";
    renderBoard(); renderClues();
    var w = puzzle.clues.across[0] || puzzle.clues.down[0];
    select(w.row, w.col, w.dir);
    if (game.isSolved()) finish(); // 다 풀었는데 포인트 저장에 실패하고 나갔던 경우
  }

  function renderBoard() {
    var table = $("cross"); table.innerHTML = ""; inputs = [];
    for (var r = 0; r < puzzle.rows; r++) {
      var tr = document.createElement("tr"); inputs.push([]);
      for (var c = 0; c < puzzle.cols; c++) {
        var cell = puzzle.cells[r][c], td = document.createElement("td");
        td.dataset.row = r; td.dataset.col = c;
        if (!cell) { td.className = "block"; inputs[r].push(null); tr.appendChild(td); continue; }
        td.className = "cell";
        if (cell.number) { td.dataset.number = cell.number; var n = document.createElement("span"); n.className = "num"; n.textContent = cell.number; td.appendChild(n); }
        var inp = document.createElement("input");
        inp.type = "text"; inp.autocomplete = "off"; inp.spellcheck = false;
        inp.setAttribute("autocapitalize", puzzle.lang === "en" ? "characters" : "off");
        inp.setAttribute("aria-label", (r + 1) + "행 " + (c + 1) + "열");
        inp.value = game.getCell(r, c) || "";
        bindInput(inp, r, c);
        td.appendChild(inp); tr.appendChild(td); inputs[r].push(inp);
      }
      table.appendChild(tr);
    }
    paintRevealed();
  }

  function renderClues() {
    ["across", "down"].forEach(function (dir) {
      var ol = $("clues-" + dir); ol.innerHTML = "";
      puzzle.clues[dir].forEach(function (w) {
        var li = document.createElement("li");
        li.value = w.number; li.dataset.index = w.index;
        li.textContent = (w.emoji ? w.emoji + " " : "") + w.clue + " (" + w.length + "칸)";
        li.onclick = function () { select(w.row, w.col, w.dir); };
        ol.appendChild(li);
      });
    });
    refreshClues();
  }
  function refreshClues() {
    document.querySelectorAll("#play li[data-index]").forEach(function (li) {
      li.classList.toggle("is-solved", game.isWordCorrect(+li.dataset.index));
    });
  }

  // ---------- 선택/이동 ----------
  function currentWord() {
    var ws = game.wordsAt(cur.row, cur.col);
    return ws.filter(function (w) { return w.dir === cur.dir; })[0] || ws[0];
  }
  function select(r, c, dir) {
    if (!game.isCell(r, c)) return;
    var ws = game.wordsAt(r, c);
    if (!ws.some(function (w) { return w.dir === dir; })) dir = ws[0].dir;
    cur = { row: r, col: c, dir: dir };
    var w = currentWord();
    document.querySelectorAll("#cross td").forEach(function (td) { td.classList.remove("is-active", "in-word"); });
    w.cells.forEach(function (p) { inputs[p[0]][p[1]].parentNode.classList.add("in-word"); });
    inputs[r][c].parentNode.classList.add("is-active");
    $("current-clue").textContent = w.number + (w.dir === "across" ? " 가로: " : " 세로: ") + w.clue;
    if (document.activeElement !== inputs[r][c]) inputs[r][c].focus();
  }
  function move(step) {
    var n = game.nextCellInWord(currentWord().index, cur.row, cur.col, step);
    if (n) select(n.row, n.col, cur.dir);
  }

  // ---------- 입력 (한글 조합 입력 대응) ----------
  function bindInput(inp, r, c) {
    var composing = false;
    inp.addEventListener("focus", function () { if (cur.row !== r || cur.col !== c) select(r, c, cur.dir); });
    inp.addEventListener("click", function () {
      if (cur.row === r && cur.col === c && game.wordsAt(r, c).length > 1)
        select(r, c, cur.dir === "across" ? "down" : "across");
    });
    inp.addEventListener("compositionstart", function () { composing = true; });
    inp.addEventListener("compositionend", function () { composing = false; commit(); });
    inp.addEventListener("input", function () { if (!composing) commit(); });
    inp.addEventListener("keydown", function (e) {
      if (e.isComposing) return;
      var k = e.key;
      if (k === "Backspace" && !inp.value) { e.preventDefault(); move(-1); var p = inputs[cur.row][cur.col]; game.setCell(cur.row, cur.col, ""); p.value = game.getCell(cur.row, cur.col); }
      else if (k === "ArrowRight") { e.preventDefault(); select(r, c + 1, "across"); }
      else if (k === "ArrowLeft") { e.preventDefault(); select(r, c - 1, "across"); }
      else if (k === "ArrowDown") { e.preventDefault(); select(r + 1, c, "down"); }
      else if (k === "ArrowUp") { e.preventDefault(); select(r - 1, c, "down"); }
    });
    function commit() {
      var v = game.setCell(r, c, inp.value);
      inp.value = v;
      clearMarks(r, c);
      if (v) move(1);
    }
  }

  // ---------- 채점/힌트 ----------
  function clearMarks(r, c) { inputs[r][c].parentNode.classList.remove("is-correct", "is-wrong"); }
  function paintRevealed() {
    for (var r = 0; r < puzzle.rows; r++) for (var c = 0; c < puzzle.cols; c++)
      if (inputs[r][c]) {
        inputs[r][c].readOnly = !!game.revealed[r][c];
        inputs[r][c].parentNode.classList.toggle("is-revealed", !!game.revealed[r][c]);
      }
  }
  $("btn-check").onclick = function () {
    game.checkAll().forEach(function (x) {
      var td = inputs[x.row][x.col].parentNode;
      td.classList.toggle("is-correct", x.result === "correct");
      td.classList.toggle("is-wrong", x.result === "wrong");
    });
    var s = game.stats();
    $("message").textContent = s.correct + " / " + s.total + " 칸 맞았어요";
  };
  $("btn-hint").onclick = function () {
    var res = game.revealOne(currentWord().index);
    if (res) { inputs[res.row][res.col].value = res.value; paintRevealed(); }
  };
  $("btn-chosung").onclick = function () {
    $("message").textContent = "초성 힌트: " + game.chosungHint(currentWord().index);
  };
  $("btn-reset").onclick = function () {
    game.reset(); save(); renderBoard(); refreshClues();
    $("message").textContent = ""; select(cur.row, cur.col, cur.dir);
  };
  $("btn-back").onclick = showMenu;

  Mini.start("wordcross").then(function (ok) {
    if (!ok) return;
    store = Mini.dayStore();
    showMenu();
  }).catch(function (e) { $("langs").textContent = "⚠️ 저장 데이터를 불러오지 못했어요: " + e.message; });
})();
