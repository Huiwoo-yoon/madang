// ===== 배경음악: 케이팝 느낌 신스팝 (평소: 밝은 응원가 / 보스전: 어둡고 강렬한 곡) — Web Audio로 직접 만든 원곡 =====
const Music = (() => {
  const MUTE_KEY = 'tuho.mute';
  const midi = (n) => 440 * 2 ** ((n - 69) / 12);

  // 한 칸 = 16분음표, 16칸 = 한 마디, 4마디 반복. 숫자 = 음 높이(MIDI), null = 쉼
  const _ = null;
  const SONGS = {
    // 밝고 벅차오르는 응원가 (D장조: D - A - Bm - G)
    normal: {
      bpm: 122,
      chords: [[62, 66, 69], [61, 64, 69], [62, 66, 71], [62, 67, 71]],
      bass: [38, 33, 35, 31],
      lead: [
        [74, _, _, 78, _, _, 81, _, 83, _, 81, _, 78, _, 76, _],
        [76, _, _, 78, _, _, 81, _, 85, _, _, _, 83, _, 81, _],
        [83, _, _, 81, _, _, 78, _, 81, _, 83, _, 86, _, _, _],
        [83, _, 81, _, 79, _, 78, _, 76, _, 78, _, 74, _, _, _],
      ],
      kick: [0, 4, 8, 12], clap: [4, 12], hat: 'offbeat',
    },
    // 어둡고 강렬한 보스 곡 (D단조: Dm - B♭ - Gm - A)
    boss: {
      bpm: 140,
      chords: [[62, 65, 69], [62, 65, 70], [62, 67, 70], [61, 64, 69]],
      bass: [38, 34, 31, 33],
      lead: [
        [74, _, 77, _, 76, _, 74, _, 81, _, _, _, 79, _, 77, _],
        [74, _, 77, _, 76, _, 74, _, 70, _, _, _, 72, _, 74, _],
        [79, _, 77, _, 74, _, 77, _, 79, _, 82, _, 81, _, _, _],
        [81, _, 79, _, 77, _, 76, _, 73, _, _, _, 76, _, _, _],
      ],
      kick: [0, 6, 10], clap: [8], hat: 'trap',
    },
  };

  let ctx = null, out = null, master = null, fx = null, noise = null;
  let mode = 'normal', step = 0, nextTime = 0, timer = null;
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch {}

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    out = ctx.createGain(); // 켜기/끄기는 여기서 (음악 + 효과음 같이)
    out.gain.value = muted ? 0 : 1;
    out.connect(ctx.destination);
    master = ctx.createGain(); // 배경음악 크기
    master.gain.value = 0.35;
    master.connect(out);
    fx = ctx.createGain(); // 효과음 크기
    fx.gain.value = 0.6;
    fx.connect(out);
    // 박수·하이햇·바람 소리용 잡음
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  // 두 개의 살짝 어긋난 오실레이터 → 필터 → 볼륨 (신스 기본 소리)
  function synth(freq, t, len, { type = 'sawtooth', vol = 0.1, attack = 0.01, cutoff = 3000, detune = 8, q = 1 } = {}) {
    const g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, len * 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    [-detune, detune].forEach((d) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = d;
      o.connect(f);
      o.start(t);
      o.stop(t + len + 0.05);
    });
    f.connect(g); g.connect(master);
  }

  function kick(t, vol, tail = 0.35) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + tail);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + tail);
  }

  function noiseHit(t, len, vol, type, freq) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise;
    f.type = type;
    f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + len);
  }
  const clap = (t, vol) => { noiseHit(t, 0.18, vol, 'bandpass', 1400); noiseHit(t + 0.012, 0.12, vol * 0.7, 'bandpass', 2200); };
  const hat = (t, vol, open) => noiseHit(t, open ? 0.15 : 0.04, vol, 'highpass', 7500);

  // 808 베이스: 낮고 길게 웅— (살짝 미끄러져 들어감)
  function bass808(freq, t, len, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain(), sh = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(2.5 * x); }
    sh.curve = curve;
    o.type = 'sine';
    o.frequency.setValueAtTime(freq * 1.5, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(sh); sh.connect(g); g.connect(master);
    o.start(t); o.stop(t + len);
  }

  // ===== 효과음 =====
  function tone(freq, t, len, { type = 'sine', vol = 0.4, to = null, dest = fx } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + len + 0.02);
  }
  function hiss(t, len, from, to, vol) { // 바람 소리
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise;
    s.loop = true;
    f.type = 'bandpass';
    f.Q.value = 1.5;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + len * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(f); f.connect(g); g.connect(fx);
    s.start(t); s.stop(t + len);
  }
  const notes = (list, t, gap, opt) => list.forEach((n, i) => tone(midi(n), t + i * gap, opt.len || 0.3, opt));

  const SFX = {
    throw: (t) => hiss(t, 0.45, 600, 2500, 0.5),                  // 휙
    in: (t) => {                                                   // 통! + 딩
      tone(220, t, 0.25, { vol: 0.6, to: 110 });
      tone(midi(84), t + 0.05, 0.6, { type: 'triangle', vol: 0.25 });
      tone(midi(91), t + 0.05, 0.5, { vol: 0.12 });
    },
    miss: (t) => { tone(120, t, 0.15, { vol: 0.5, to: 60 }); hiss(t, 0.12, 900, 400, 0.25); }, // 툭
    bonus: (t) => notes([84, 88, 91, 96], t, 0.06, { type: 'triangle', vol: 0.2, len: 0.25 }), // 반짝 (퍼펙트·크리티컬)
    coin: (t) => { tone(midi(83), t, 0.08, { type: 'square', vol: 0.12 }); tone(midi(88), t + 0.07, 0.3, { type: 'square', vol: 0.12 }); },
    levelup: (t) => notes([72, 76, 79, 84], t, 0.09, { type: 'triangle', vol: 0.3, len: 0.35 }),
    block: (t) => tone(midi(79), t, 0.5, { type: 'square', vol: 0.12, to: midi(91) }),
    win: (t) => notes([72, 74, 77, 79, 81, 84, 84], t, 0.12, { type: 'triangle', vol: 0.3, len: 0.5 }),
    lose: (t) => notes([69, 67, 64, 60, 57], t, 0.18, { type: 'triangle', vol: 0.3, len: 0.5 }),
  };

  function playStep(i, t) {
    const song = SONGS[mode];
    const stepLen = 60 / song.bpm / 4, barLen = stepLen * 16;
    const bar = Math.floor(i / 16) % 4, s16 = i % 16;
    const chord = song.chords[bar], root = song.bass[bar];
    const n = song.lead[bar][s16];

    if (mode === 'normal') {
      if (s16 === 0) chord.forEach((c) => synth(midi(c), t, barLen, { vol: 0.035, attack: 0.08, cutoff: 1800 })); // 코드 패드
      if (s16 % 2 === 0) synth(midi(root), t, stepLen * 1.6, { vol: 0.12, cutoff: 500 + (s16 % 4 ? 0 : 300) });    // 통통 튀는 베이스
      if (s16 % 4 === 2) chord.forEach((c) => synth(midi(c + 12), t, stepLen * 1.2, { type: 'square', vol: 0.015, cutoff: 4000 })); // 반짝이 코드
      if (n !== null) synth(midi(n), t, stepLen * 3, { type: 'square', vol: 0.05, cutoff: 3500, detune: 12 });       // 멜로디
      if (song.kick.includes(s16)) kick(t, 0.9);
      if (song.clap.includes(s16)) clap(t, 0.35);
      hat(t, s16 % 4 === 2 ? 0.12 : 0.05, s16 % 4 === 2);
    } else {
      if (s16 === 0) chord.forEach((c) => {                                                                        // 합창 같은 어두운 패드
        synth(midi(c), t, barLen, { vol: 0.04, attack: 0.4, cutoff: 1100, q: 4, detune: 14 });
        synth(midi(c - 12), t, barLen, { type: 'triangle', vol: 0.03, attack: 0.3, cutoff: 900 });
      });
      if (s16 === 0 || s16 === 6 || s16 === 10) bass808(midi(root), t, s16 === 0 ? stepLen * 6 : stepLen * 4, 0.55);
      if (n !== null) {                                                                                             // 종소리 멜로디
        synth(midi(n), t, stepLen * 4, { type: 'triangle', vol: 0.08, attack: 0.005, cutoff: 5000, detune: 3 });
        synth(midi(n + 12), t, stepLen * 2, { type: 'sine', vol: 0.03, attack: 0.005, cutoff: 8000, detune: 0 });
      }
      if (song.kick.includes(s16)) kick(t, 0.8, 0.25);
      if (song.clap.includes(s16)) clap(t, 0.45);
      hat(t, 0.06, false);
      if (bar === 3 && s16 >= 12) hat(t + stepLen / 2, 0.05, false);                                              // 하이햇 롤
    }
  }

  // 조금씩 미리 예약해서 박자가 흔들리지 않게 한다
  function schedule() {
    const stepLen = 60 / SONGS[mode].bpm / 4;
    while (nextTime < ctx.currentTime + 0.15) {
      playStep(step, nextTime);
      step = (step + 1) % 64;
      nextTime += stepLen;
    }
  }

  function start() {
    init();
    if (ctx.state === 'suspended') ctx.resume();
    if (timer) return;
    nextTime = ctx.currentTime + 0.1;
    timer = setInterval(schedule, 30);
  }

  // 첫 클릭이나 키를 누르면 시작 (브라우저가 그 전에는 소리를 막는다)
  const firstTouch = () => { start(); window.removeEventListener('pointerdown', firstTouch); window.removeEventListener('keydown', firstTouch); };
  window.addEventListener('pointerdown', firstTouch);
  window.addEventListener('keydown', firstTouch);

  return {
    setMode(m) {
      if (m === mode) return;
      mode = m;
      step = 0;
    },
    toggle() {
      muted = !muted;
      try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch {}
      if (out) out.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
      return muted;
    },
    get muted() { return muted; },
    sfx(name) {
      if (!ctx && !navigator.userActivation?.isActive) return; // 클릭 전(알바 레벨업 등)엔 조용히
      init();
      if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime + 0.01;
      if (SFX[name]) SFX[name](t);
    },
  };
})();
