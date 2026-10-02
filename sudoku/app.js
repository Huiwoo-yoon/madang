/*
 * 화면 연결(app.js) — 마당용: 난이도마다 '오늘의 문제' 하나, 다 풀면 하루에 한 번 포인트를 받는다 (../mini.js).
 * 상태 표시는 전부 class / data-* 속성으로만 합니다. 모양은 ../mini.css 에 있습니다.
 *   #board[data-size="4|6|9"]
 *   td.cell[data-row][data-col]
 *   .box-right / .box-bottom        상자 경계(굵은 선 넣을 자리)
 *   .is-given                       처음부터 주어진 숫자     .is-revealed  힌트로 공개된 칸
 *   .is-selected                    선택한 칸
 *   .is-related                     선택한 칸과 같은 줄/칸/상자     .is-same  선택한 칸과 같은 숫자
 *   .is-conflict                    규칙 위반(같은 줄/상자에 같은 숫자)
 *   .is-correct / .is-wrong         채점 결과
 *   td .notes span[data-n]          메모 숫자      #numpad button.is-used-up  다 쓴 숫자
 *   #btn-notes[aria-pressed=true]   메모 모드
 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var DATA = window.SUDOKU_DATA, SD = window.Sudoku;
  // 난이도별 보상 포인트. 힌트를 한 번 쓸 때마다 10%씩 줄고, 아무리 줄어도 30%는 받는다
  var REWARD = { baby: 100, easy: 200, medium: 500, hard: 1000, extreme: 2000 };
  var board = null, game = null, tds = [], sel = null, noteMode = false, store = null;

  function save() { store.set(board.id, JSON.stringify(game.serialize())); }
  function reward() { return Math.round(REWARD[board.level] * Math.max(0.3, 1 - 0.1 * game.hintCount)); }
  function finish() { Mini.finish(reward(), "다 풀었어요! (힌트 " + game.hintCount + "번)"); }

  // ---------- 난이도 고르기 (난이도마다 오늘의 문제 하나) ----------
  function showMenu() {
    $("play").hidden = true; $("menu").hidden = false;
    $("doneNote").hidden = !Mini.doneToday();
    var wrap = $("levels"); wrap.innerHTML = "";
    DATA.levels.forEach(function (lv) {
      var list = DATA.puzzles.filter(function (p) { return p.level === lv.key; });
      var p = list[Mini.dayNumber() % list.length];
      var b = document.createElement("button");
      b.type = "button"; b.className = "pick"; b.dataset.level = lv.key; b.disabled = Mini.doneToday();
      b.innerHTML = "<b>" + lv.name + "</b><span>" + lv.desc + "</span><span class=\"reward\">💰 +" + REWARD[lv.key] + "</span>";
      b.onclick = function () { start(p.id, lv.name + " 스도쿠 · 💰 +" + REWARD[lv.key]); };
      wrap.appendChild(b);
    });
  }

  // ---------- 판 시작 ----------
  function start(id, title) {
    var def = DATA.puzzles.filter(function (p) { return p.id === id; })[0];
    board = SD.parse(def);
    game = new SD.Game(board);
    try { game.restore(JSON.parse(store.get(id))); } catch (e) {}
    game.on(function (type) {
      if (type !== "reset" && type !== "restore") save();
      if (type === "solved") finish();
    });
    $("menu").hidden = true; $("play").hidden = false;
    $("title").textContent = title;
    $("message").textContent = ""; $("cheer").innerHTML = ""; $("retryBtn").hidden = true;
    setNoteMode(false);
    buildBoard(); buildPad();
    sel = null; render();
    if (game.isSolved()) finish(); // 다 풀었는데 포인트 저장에 실패하고 나갔던 경우
  }

  function buildBoard() {
    var t = $("board"), s = board.size; t.innerHTML = ""; t.dataset.size = s; tds = [];
    for (var r = 0; r < s; r++) {
      var tr = document.createElement("tr");
      for (var c = 0; c < s; c++) {
        var td = document.createElement("td");
        td.className = "cell"; td.dataset.row = r; td.dataset.col = c; td.tabIndex = 0;
        if (board.isBoxRight(c)) td.classList.add("box-right");
        if (board.isBoxBottom(r)) td.classList.add("box-bottom");
        td.addEventListener("click", onCellClick);
        td.addEventListener("keydown", onKey);
        tr.appendChild(td); tds.push(td);
      }
      t.appendChild(tr);
    }
  }
  function buildPad() {
    var pad = $("numpad"); pad.innerHTML = "";
    for (var v = 1; v <= board.size; v++) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = v; b.dataset.n = v;
      b.onclick = (function (n) { return function () { input(n); }; })(v);
      pad.appendChild(b);
    }
  }

  // ---------- 그리기 ----------
  function render() {
    var s = board.size, bad = {}, selVal = sel ? game.get(sel.row, sel.col) : 0;
    game.conflicts().forEach(function (p) { bad[p.row * s + p.col] = true; });
    tds.forEach(function (td, i) {
      var r = Math.floor(i / s), c = i % s, v = game.get(r, c);
      td.innerHTML = "";
      if (v) td.textContent = v;
      else {
        var notes = game.getNotes(r, c);
        if (notes.length) {
          var box = document.createElement("div"); box.className = "notes";
          notes.forEach(function (n) { var sp = document.createElement("span"); sp.dataset.n = n; sp.textContent = n; box.appendChild(sp); });
          td.appendChild(box);
        }
      }
      td.classList.toggle("is-given", game.isGiven(r, c));
      td.classList.toggle("is-revealed", !!game.revealed[i]);
      td.classList.toggle("is-conflict", !!bad[i]);
      td.classList.toggle("is-selected", !!sel && sel.row === r && sel.col === c);
      td.classList.toggle("is-related", !!sel && related(sel.row, sel.col, r, c));
      td.classList.toggle("is-same", !!selVal && v === selVal);
    });
    var rem = game.remaining();
    Array.prototype.forEach.call($("numpad").children, function (b) {
      b.classList.toggle("is-used-up", rem[b.dataset.n] <= 0);
    });
  }
  function related(r1, c1, r2, c2) {
    if (r1 === r2 && c1 === c2) return false;
    return r1 === r2 || c1 === c2 ||
      (Math.floor(r1 / board.boxRows) === Math.floor(r2 / board.boxRows) &&
       Math.floor(c1 / board.boxCols) === Math.floor(c2 / board.boxCols));
  }
  function clearMarks() { tds.forEach(function (td) { td.classList.remove("is-correct", "is-wrong"); }); }

  // ---------- 입력 ----------
  function select(r, c) {
    var s = board.size;
    if (r < 0 || c < 0 || r >= s || c >= s) return;
    sel = { row: r, col: c }; tds[r * s + c].focus(); render();
  }
  function onCellClick(e) { select(+e.currentTarget.dataset.row, +e.currentTarget.dataset.col); }
  function input(v) {
    if (!sel) return;
    var ok = noteMode && v ? game.toggleNote(sel.row, sel.col, v) : game.set(sel.row, sel.col, v);
    if (ok) { clearMarks(); render(); }
  }
  function onKey(e) {
    if (!sel) return;
    var k = e.key, n = parseInt(k, 10);
    if (n >= 1 && n <= board.size) input(n);
    else if (k === "Backspace" || k === "Delete" || k === "0") input(0);
    else if (k === "ArrowUp") select(sel.row - 1, sel.col);
    else if (k === "ArrowDown") select(sel.row + 1, sel.col);
    else if (k === "ArrowLeft") select(sel.row, sel.col - 1);
    else if (k === "ArrowRight") select(sel.row, sel.col + 1);
    else if (k === "n" || k === "N") setNoteMode(!noteMode);
    else if ((k === "z" || k === "Z") && (e.ctrlKey || e.metaKey)) $("btn-undo").click();
    else return;
    e.preventDefault();
  }
  function setNoteMode(on) { noteMode = on; $("btn-notes").setAttribute("aria-pressed", String(on)); }

  // ---------- 버튼 ----------
  $("btn-erase").onclick = function () { input(0); };
  $("btn-notes").onclick = function () { setNoteMode(!noteMode); };
  $("btn-undo").onclick = function () { if (game.undo()) { clearMarks(); render(); } };
  $("btn-autonotes").onclick = function () { game.fillNotes(); render(); };
  $("btn-hint").onclick = function () {
    // 선택한 빈칸/틀린 칸이 있으면 그 칸, 아니면 지금 가장 풀기 쉬운 칸
    var res = sel && !game.isLocked(sel.row, sel.col) && game.check(sel.row, sel.col) !== "correct"
      ? game.hint(sel.row, sel.col) : game.hint();
    if (res) { sel = { row: res.row, col: res.col }; clearMarks(); render(); }
  };
  $("btn-check").onclick = function () {
    var right = 0, wrong = 0;
    game.checkAll().forEach(function (x) {
      var td = tds[x.row * board.size + x.col];
      td.classList.toggle("is-correct", x.result === "correct");
      td.classList.toggle("is-wrong", x.result === "wrong");
      if (x.result === "correct") right++; if (x.result === "wrong") wrong++;
    });
    $("message").textContent = "맞은 칸 " + right + " · 틀린 칸 " + wrong;
  };
  $("btn-reset").onclick = function () {
    game.reset(); save(); sel = null; clearMarks(); $("message").textContent = ""; render();
  };
  $("btn-back").onclick = showMenu;

  Mini.start("sudoku").then(function (ok) {
    if (!ok) return;
    store = Mini.dayStore();
    showMenu();
  }).catch(function (e) { $("levels").textContent = "⚠️ 저장 데이터를 불러오지 못했어요: " + e.message; });
})();
