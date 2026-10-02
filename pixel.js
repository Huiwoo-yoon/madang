// ===== 도트 그림 (모든 놀이가 같이 쓴다) =====
// 캐릭터: 글자 한 칸 = 점 하나. 머리(12줄)는 캐릭터마다 따로 그리고, 몸(12줄)은 한복 틀 세 가지를 색만 바꿔서 쓴다.
// 배경: 200×65 점짜리 그림을 코드로 그린다 (블록 땅, 네모 해, 뭉게구름 + 한옥·궁궐·정자).
// 쓰는 법: Pixel.img('kid', 4) → <img> 글자, Pixel.scene('yard') → 배경 그림 주소, Pixel.pot('#c8553d') → 항아리 그림 주소
const Pixel = (() => {
  // 몸 틀 — K 테두리, W 동정(흰 깃), S 살, J 저고리, j 저고리 끝단, R 고름, P 바지·치마, p 주름, D 대님, B 신발, Y 흉배, T 허리띠
  const BODY = {
    // 바지저고리
    m: [
      '.....KWSSWK.....',
      '...KKJWSSWJKK...',
      '..KJJJJWWJJJJK..',
      '..KJJKJRRJKJJK..',
      '..KJJKJRJJKJJK..',
      '..KSSKJRJJKSSK..',
      '...KKKjjjjKKK...',
      '...KPPPPPPPPK...',
      '..KPPPPKKPPPPK..',
      '..KPPPPKKPPPPK..',
      '..KDDDDKKDDDDK..',
      '..KBBBBKKBBBBK..',
    ],
    // 치마저고리
    f: [
      '.....KWSSWK.....',
      '...KKJWSSWJKK...',
      '..KJJJJWWJJJJK..',
      '..KJJKJRRJKJJK..',
      '..KSSKPPRPKSSK..',
      '...KKPPPRPPKK...',
      '...KPPPPRPPPK...',
      '..KPPPPPPPPPPK..',
      '..KPpPPPPPPpPK..',
      '.KPPpPPPPPPpPPK.',
      '.KPPpPPPPPPpPPK.',
      '.KKKKBBKKBBKKKK.',
    ],
    // 도포·곤룡포 (긴 옷)
    r: [
      '.....KWSSWK.....',
      '...KKJWSSWJKK...',
      '..KJJJJWWJJJJK..',
      '..KJJKJYYJKJJK..',
      '..KJJKJYYJKJJK..',
      '..KSSKTTTTKSSK..',
      '...KKJJJJJJKK...',
      '...KJJJJJJJJK...',
      '...KJjJJJJjJK...',
      '..KJJjJJJJjJJK..',
      '..KJJjJJJJjJJK..',
      '..KKBBBKKBBBKK..',
    ],
  };
  const BASE = { K: '#2a1a1f', W: '#ffffff', S: '#ffd2a6', B: '#3a2a22', D: '#f2efe6' };

  const SPRITES = {
    // 마리오 — 빨간 저고리, 파란 바지
    kid: {
      body: 'm',
      pal: { C: '#e52521', H: '#6b3a12', N: '#f2a878', M: '#3a1f0a', J: '#e52521', j: '#b3160f', R: '#ffd23f', P: '#2f5fd0' },
      head: [
        '....KKKKKKKK....',
        '...KCCCCCCCCK...',
        '..KCCCCWWCCCCK..',
        '..KCCCWCCWCCCK..',
        '.KKCCCCWWCCCCKK.',
        'KCCCCCCCCCCCCCCK',
        '.KHHSSSSSSSSHHK.',
        '.KHSSKSSSSKSSHK.',
        '.KSSSKSNNSKSSSK.',
        '.KSMMMNNNNMMMSK.',
        '..KSMMMMMMMMSK..',
        '...KKSSSSSSKK...',
      ],
    },
    // 스티브 — 청록 저고리, 쪽빛 바지
    grandpa: {
      body: 'm',
      pal: { H: '#4a2f1b', S: '#c98f6b', E: '#4a3aa8', N: '#9a6548', M: '#5b3521', J: '#2bb5b0', j: '#1c8c88', R: '#f2efe6', P: '#3b3fa0' },
      head: [
        '..KKKKKKKKKKKK..',
        '..KHHHHHHHHHHK..',
        '..KHHHHHHHHHHK..',
        '..KHHHHHHHHHHK..',
        '..KHSSSSSSSSHK..',
        '..KSSSSSSSSSSK..',
        '..KSWESSSSEWSK..',
        '..KSSSSNNSSSSK..',
        '..KSSMSSSSMSSK..',
        '..KSSMMMMMMSSK..',
        '..KSSSSSSSSSSK..',
        '..KKKKKKKKKKKK..',
      ],
    },
    // 조이 — 양갈래 똥머리, 녹의홍상(초록 저고리 + 다홍치마)
    ninja: {
      body: 'f',
      pal: { H: '#2b2640', h: '#5a5285', C: '#ff9aa8', M: '#c0405a', J: '#4fc48f', R: '#ef5350', P: '#ef5350', p: '#c93a3a' },
      head: [
        '.KKK........KKK.',
        'KHHHKKKKKKKKHHHK',
        'KHhHHHHHHHHHHhHK',
        '.KKHHhhHHHHHHKK.',
        '.KHHHHHHHHHHHHK.',
        '.KHHHHHHHHHHHHK.',
        '.KHSSSSSSSSSSHK.',
        '.KHSSKSSSSKSSHK.',
        '.KHSSKSSSSKSSHK.',
        '.KHSCSSSSSSCSHK.',
        '..KSSSSMMSSSSK..',
        '...KKSSSSSSKK...',
      ],
    },
    // 마을 주민 — 패랭이(목화솜 달린 보부상 모자), 갈색 두루마기
    boss: {
      body: 'r',
      pal: { A: '#e0bd6a', a: '#b8903c', S: '#c8906c', U: '#3b2413', E: '#2f9a3a', N: '#a8704c', J: '#7a5230', j: '#5f3f24', Y: '#7a5230', T: '#3f7a4a' },
      head: [
        '.....KKKKKK.....',
        '....KAAaAAAK....',
        '..KKKAAAAAAKKK..',
        '.KAAAAAAAAAAAAK.',
        'KWWKKKKKKKKKKWWK',
        'KWWKUUUUUUUUKWWK',
        '.KKKSWESSEWSKKK.',
        '...KSSSNNSSSK...',
        '...KSSSNNSSSK...',
        '...KSSSNNSSSK...',
        '...KSSSSSSSSK...',
        '...KKKKKKKKKK...',
      ],
    },
    // 미라 — 긴 분홍 머리, 흰 저고리 + 남치마
    wizard: {
      body: 'f',
      pal: { H: '#ff5d8f', h: '#ffa3c0', C: '#ff9aa8', M: '#c0405a', J: '#fdf3f5', R: '#ff5d8f', P: '#27407a', p: '#1c2f5c' },
      head: [
        '....KKKKKKKK....',
        '...KHHHHHHHHK...',
        '..KHHhhHHHHHHK..',
        '.KHHhHHHHHHHHHK.',
        '.KHHHHHHHHHHHHK.',
        '.KHHHHHHHSSSHHK.',
        '.KHHHHSSSSSSSHK.',
        '.KHSSKSSSSKSSHK.',
        '.KHSSKSSSSKSSHK.',
        '.KHSCSSSSSSCSHK.',
        '.KHHSSSMMSSSHHK.',
        '.KHHKKSSSSKKHHK.',
      ],
      extra: [
        [12, 1, 'KHHH'], [12, 11, 'HHHK'], [13, 0, 'KHH'], [13, 13, 'HHK'],
        [14, 0, 'KH'], [14, 14, 'HK'], [15, 0, 'KH'], [15, 14, 'hK'], [16, 0, 'Kh'], [16, 14, 'HK'],
        [17, 0, 'KH'], [17, 14, 'HK'], [18, 0, 'KH'], [18, 14, 'HK'], [19, 0, 'KK'], [19, 14, 'KK'],
      ],
    },
    // 루미 — 보라 댕기머리(빨간 댕기), 노랑 저고리 + 보라 치마
    hero: {
      body: 'f',
      pal: { V: '#8e5bd6', v: '#b99af0', C: '#ff9aa8', M: '#c0405a', X: '#e52521', J: '#fff1b8', R: '#8e5bd6', P: '#7b4fc9', p: '#5f3ba3' },
      head: [
        '....KKKKKKKK....',
        '...KVVVVVVVVK...',
        '..KVVvvVVVVVVK..',
        '.KVVvVVVVVVVVVK.',
        '.KVVVVVVVVVVVVK.',
        '.KVVVSSVVVSSVVK.',
        '.KVVSSSSVSSSSVK.',
        '.KVSSKSSSSKSSVK.',
        '.KVSSKSSSSKSSVK.',
        '.KVSCSSSSSSCSVK.',
        '..KVSSSMMSSSVK..',
        '...KKSSSSSSKK...',
      ],
      extra: [
        [11, 12, 'KVK'], [12, 12, 'KvK'], [13, 13, 'VK'], [14, 14, 'vK'], [15, 14, 'VK'], [16, 14, 'vK'],
        [17, 13, 'KVK'], [18, 13, 'KXK'], [19, 14, 'XK'], [20, 14, 'KK'],
      ],
    },
    // 크리퍼 — 삼베 저고리, 초록 바지
    robot: {
      body: 'm',
      pal: { G: '#5fbf4a', g: '#3f9a35', X: '#1c2b18', S: '#5fbf4a', J: '#ece6cf', j: '#cfc7a8', R: '#3f9a35', P: '#3f9a35', B: '#1c2b18' },
      head: [
        '..KKKKKKKKKKKK..',
        '..KGgGGGgGGgGK..',
        '..KGGGgGGGGGGK..',
        '..KgGGGGGGGGgK..',
        '..KGGXXGGXXGGK..',
        '..KGGXXGGXXGGK..',
        '..KGGGGXXGGGGK..',
        '..KGGGXXXXGGGK..',
        '..KGGGXXXXGGGK..',
        '..KGGGXGGXGGGK..',
        '..KGgGGGGGGgGK..',
        '..KKKKKKKKKKKK..',
      ],
    },
    // 요시 — 빨간 저고리(안장 색), 흰 바지, 주황 신발
    dragon: {
      body: 'm',
      pal: { G: '#5cc83b', g: '#3da028', X: '#243a8f', C: '#e8452c', S: '#5cc83b', J: '#e8452c', j: '#b8301c', R: '#ffffff', P: '#f6f3ea', B: '#f08a24' },
      head: [
        '.....KK.KK......',
        '....KWWKWWK.....',
        '....KWXKWXK.....',
        '.KK.KWXKWXKKKK..',
        'KCCKGGGGGGGGGGK.',
        '.KKGGGGGGGGGGGGK',
        'KCCKGGGGGGGGGKGK',
        '.KKGGGGGGGGGGGGK',
        '..KGWWWWWGGGGGK.',
        '..KWWWWWWWKKKK..',
        '...KWWWWWWWK....',
        '....KKKKKKK.....',
      ],
    },
    // ----- 그리스 로마 신화 -----
    // 오디세우스 — 청동 투구(붉은 깃), 수염, 쑥색 저고리
    odysseus: {
      body: 'm',
      pal: { C: '#d1343a', Z: '#c98a3c', z: '#f0c070', H: '#5a3a22', M: '#3a1f0a', J: '#6b8f4e', j: '#4f6f38', R: '#f0c070', P: '#3d4a6b' },
      head: [
        '.....KKKKKK.....',
        '.....KCCCCK.....',
        '...KKKCCCCKKK...',
        '..KZZZZZZZZZZK..',
        '.KZZzZZZZZZZZZK.',
        '.KzzzzzzzzzzzzK.',
        '.KZSSSSSSSSSSZK.',
        '.KZSSKSSSSKSSZK.',
        '.KZSSKSSSSKSSZK.',
        '.KZHSSSSSSSSHZK.',
        '..KHHHMMMMHHHK..',
        '...KKHHHHHHKK...',
      ],
    },
    // 아테나 — 은빛 투구(푸른 깃), 긴 갈색 머리, 흰 저고리 + 올리브색 치마
    athena: {
      body: 'f',
      pal: { C: '#3a6fd8', Z: '#b9c4d6', z: '#eef3fa', H: '#7a4a2a', N: '#ff9aa8', M: '#c0405a', J: '#fdfaf0', R: '#f2c230', P: '#7d8f3a', p: '#5f6f2a' },
      head: [
        '.....KKKKKK.....',
        '.....KCCCCK.....',
        '...KKKCCCCKKK...',
        '..KZZZZZZZZZZK..',
        '.KZZzZZZZZZZZZK.',
        '.KzzzzzzzzzzzzK.',
        '.KHZZSSSSSSZZHK.',
        '.KHSSKSSSSKSSHK.',
        '.KHSSKSSSSKSSHK.',
        '.KHSNSSSSSSNSHK.',
        '.KHHSSSMMSSSHHK.',
        '.KHHKKSSSSKKHHK.',
      ],
      extra: [
        [12, 1, 'KHHH'], [12, 11, 'HHHK'], [13, 0, 'KHH'], [13, 13, 'HHK'],
        [14, 0, 'KH'], [14, 14, 'HK'], [15, 0, 'KH'], [15, 14, 'HK'], [16, 0, 'KH'], [16, 14, 'HK'],
        [17, 0, 'KK'], [17, 14, 'KK'],
      ],
    },
    // 제우스 — 흰 머리와 긴 수염, 금 월계관, 흰 도포에 번개 흉배
    zeus: {
      body: 'r',
      pal: { H: '#eef0f5', L: '#f2c230', U: '#9aa0ad', N: '#f2a878', M: '#8a3a3a', J: '#f4f1ea', j: '#cfcbbd', Y: '#ffd23f', T: '#3a6fd8' },
      head: [
        '....KKKKKKKK....',
        '...KHHHHHHHHK...',
        '..KHHHHHHHHHHK..',
        '.KLHLHLHHLHLHLK.',
        '.KHHHHHHHHHHHHK.',
        '.KHHSSSSSSSSHHK.',
        '.KHSUUSSSSUUSHK.',
        '.KHSSKSSSSKSSHK.',
        '.KHSSSSNNSSSSHK.',
        '.KHHHHHMMHHHHHK.',
        '..KHHHHHHHHHHK..',
        '...KKHHHHHHKK...',
      ],
      extra: [[12, 6, 'HHHH'], [13, 7, 'HH']],
    },
    // 포세이돈 — 금관, 바다색 머리와 수염, 삼지창, 바다색 저고리
    poseidon: {
      body: 'm',
      pal: { Q: '#f2c230', q: '#c9962a', H: '#2aa6b8', h: '#7fd8e0', U: '#1c6f80', N: '#f2a878', M: '#8a3a3a', J: '#1f7fb5', j: '#165d86', R: '#f2c230', P: '#eaf4f7' },
      head: [
        '..KQKQKQQKQKQK..',
        '..KQQQQQQQQQQK..',
        '.KHHHHHHHHHHHHK.',
        '.KHHhHHHHHHhHHK.',
        '.KHHHHHHHHHHHHK.',
        '.KHHSSSSSSSSHHK.',
        '.KHSUUSSSSUUSHK.',
        '.KHSSKSSSSKSSHK.',
        '.KHSSSSNNSSSSHK.',
        '.KHHHHHMMHHHHHK.',
        '..KHHhHHHHhHHK..',
        '...KKHHHHHHKK...',
      ],
      extra: [
        [11, 13, 'Q'], [11, 15, 'Q'], [12, 13, 'Q'], [12, 14, 'Q'], [12, 15, 'Q'], [13, 13, 'QQQ'],
        ...[14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((y) => [y, 14, 'q']),
      ],
    },
    // 메두사 — 뱀 머리카락, 붉은 눈, 진초록 저고리 + 자주 치마
    medusa: {
      body: 'f',
      pal: { G: '#4caf50', g: '#8fe08a', X: '#ffd23f', S: '#d6ecb8', E: '#e52521', N: '#b8d890', M: '#7a2e5a', J: '#2f6b3a', R: '#ffd23f', P: '#7a2e6b', p: '#5c2050' },
      head: [
        '..KK..KKKK..KK..',
        '.KGGKKGGGGKKGGK.',
        'KGXGGGGgGGGGGXGK',
        'KGGKGGGGGGGGKGGK',
        '.KKGGgGGGGgGGKK.',
        '.KGGGSSSSSSGGGK.',
        'KGKGSSSSSSSSGKGK',
        'KGKSSESSSSESSKGK',
        '.KGSSKSSSSKSSGK.',
        '.KGSNSSSSSSNSGK.',
        '..KGSSSMMSSSGK..',
        '...KKSSSSSSKK...',
      ],
    },
    // 키클롭스(폴리페모스) — 외눈박이 거인, 갈색 삼베 저고리
    cyclops: {
      body: 'm',
      pal: { H: '#4a3524', S: '#d9a878', U: '#4a3524', E: '#3a8fd8', X: '#14233a', M: '#6b2a2a', J: '#b08a5a', j: '#8a6a40', R: '#6b4226', P: '#6b5a4a' },
      head: [
        '....KKKKKKKK....',
        '...KHHHHHHHHK...',
        '..KSSHHHHHHSSK..',
        '.KSSSSSSSSSSSSK.',
        '.KSSUUUUUUUUSSK.',
        '.KSSKWWWWWWKSSK.',
        '.KSSKWWEEWWKSSK.',
        '.KSSKWWXXWWKSSK.',
        '.KSSSKKKKKKSSSK.',
        '.KSSSSSSSSSSSSK.',
        '..KSSWMMMMWSSK..',
        '...KKSSSSSSKK...',
      ],
    },
    // 쿠파 대마왕 — 임금님 곤룡포
    bowser: {
      body: 'r',
      pal: { G: '#3f9d3a', O: '#f5c16c', C: '#e8451e', E: '#c81e1e', S: '#f5c16c', J: '#c8102e', j: '#9c0c22', Y: '#ffd23f', T: '#2a1a1f' },
      head: [
        'KWK..KCCCCK..KWK',
        'KWWK.KCCCCK.KWWK',
        '.KWWKKCCCCKKWWK.',
        '..KKGGGCCGGGKK..',
        '.KGCCCGGGGCCCGK.',
        '.KGKWEKGGKEWKGK.',
        '.KGGKKOOOOKKGGK.',
        '.KGOOOKOOKOOOGK.',
        '.KOOOOOOOOOOOOK.',
        '.KOKWKWKKWKWKOK.',
        '..KOOOOOOOOOOK..',
        '...KKKKKKKKKK...',
      ],
    },
    // 저승사자 진우 — 검은 갓, 검은 도포
    saja: {
      body: 'r',
      pal: { G: '#17141f', g: '#3d3856', A: '#d9b23a', H: '#17141f', S: '#f3e6dd', E: '#ffcf33', M: '#8a3a4a', J: '#211d2e', j: '#3d3856', Y: '#211d2e', T: '#8a1f3d', K: '#0d0a12' },
      head: [
        '.....KKKKKK.....',
        '.....KGgGGK.....',
        '.....KGGGGK.....',
        '.KKKKKGGGGKKKKK.',
        'KGGgGGGGGGGGgGGK',
        '.KKKKKKKKKKKKKK.',
        '...KHHHSSHHHK...',
        '..AKHSSSSSSHKA..',
        '..AKSEESSEESKA..',
        '..AKSSSSSSSSKA..',
        '..A.KSSMMSSK.A..',
        '...A.KKKKKK.A...',
      ],
    },
    // 더피 — 민화 속 파란 호랑이 (알바), 흰 저고리
    tiger: {
      body: 'm',
      pal: { L: '#4f8fd6', l: '#1f3d73', E: '#ffd23f', N: '#ff8fa3', S: '#4f8fd6', J: '#f6f3ea', j: '#d9d3c0', R: '#e8452c', P: '#8d99ae' },
      head: [
        '.KKK........KKK.',
        'KLLLK.KKKK.KLLLK',
        'KLNLKKLLLLKKLNLK',
        '.KLLLLlLLlLLLLK.',
        '.KLLLLlLLlLLLLK.',
        '.KLEEELLLLEEELK.',
        '.KlEKELLLLEEKlK.',
        '.KLEEELNNLEEELK.',
        '.KlLWWWNNWWWLlK.',
        '.KLLWKWKKWKWLLK.',
        '..KLWWWWWWWWLK..',
        '...KKKKKKKKKK...',
      ],
    },
    // 내 집 — 작은 기와집 (투호 장소에 산 집)
    house: {
      pal: { T: '#3d4150', t: '#2b2e3a', L: '#6b7080', O: '#7a4a2a', W: '#f4ecdc', D: '#b98a5e', G: '#b9b0a0' },
      rows: [
        '......KKKKKKKK......',
        '....KKTTTTTTTTKK....',
        '..KKTtTtTtTtTtTtKK..',
        'KKTtTtTtTtTtTtTtTtKK',
        'KLLLLLLLLLLLLLLLLLLK',
        '.KKKKKKKKKKKKKKKKKK.',
        '..KOWWWOWWWWOWWWOK..',
        '..KOWWWOWDDWOWWWOK..',
        '..KOWWWODDDDOWWWOK..',
        '..KOWWWODDDDOWWWOK..',
        '..KKKKKKKKKKKKKKKK..',
        '.KGGGGGGGGGGGGGGGGK.',
        '.KKKKKKKKKKKKKKKKKK.',
      ],
    },
    // 딱지 — 대각선으로 접은 네모 (마당 화면의 놀이 그림)
    ttakji: {
      pal: { A: '#e63946', a: '#2f5fd0' },
      rows: Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) =>
        (x % 15 === 0 || y % 15 === 0 || x === y || x + y === 15 ? 'K' : (y < x) === (y < 15 - x) ? 'A' : 'a')).join('')),
    },
    // 투호 항아리 — C 몸통, c 그늘, h 반짝, m 입구
    pot: {
      pal: { m: '#2a1a1f', C: '#c8553d', c: '#963f2e', h: '#e19d8f' },
      rows: [
        '......KKKKKK......',
        '.....KmmmmmmK.....',
        '.....KcCCCCcK.....',
        '......KcCCcK......',
        '.....KCCCCCCK.....',
        '...KKCCCCCCCCKK...',
        '..KCChCCCCCCCCcK..',
        '.KCChhCCCCCCCCCcK.',
        '.KChhCCCCCCCCCCcK.',
        'KCChCCCCCCCCCCCCcK',
        'KCChCCCCCCCCCCCccK',
        'KCCCCCCCCCCCCCCccK',
        'KCCCCCCCCCCCCCCccK',
        'KCCCCCCCCCCCCCCccK',
        '.KCCCCCCCCCCCCccK.',
        '.KCCCCCCCCCCCCccK.',
        '..KCCCCCCCCCCccK..',
        '..KcCCCCCCCCcccK..',
        '...KcCCCCCCcccK...',
        '....KccccccccK....',
        '....KKKKKKKKKK....',
        '..................',
      ],
    },
  };

  // 머리 + 몸 틀 + 덧그림(extra)을 합쳐서 줄 배열로
  function rowsOf(s) {
    if (s.rows) return s.rows;
    const rows = [...s.head, ...BODY[s.body]].map((r) => r.split(''));
    (s.extra || []).forEach(([y, x, str]) => [...str].forEach((ch, i) => (rows[y][x + i] = ch)));
    return rows.map((r) => r.join(''));
  }

  const cache = {};
  // 점 하나 = 1px 인 그림 주소. pal로 색을 바꿀 수 있고, lines를 주면 위에서 그만큼만 그린다
  function url(id, pal, lines) {
    const s = SPRITES[id] || SPRITES.kid;
    const key = [id, lines, JSON.stringify(pal)].join('|');
    if (cache[key]) return cache[key];
    const rows = rowsOf(s).slice(0, lines);
    const colors = { ...BASE, ...s.pal, ...pal };
    const c = document.createElement('canvas');
    c.width = rows[0].length;
    c.height = rows.length;
    const g = c.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle = colors[ch];
      g.fillRect(x, y, 1, 1);
    }));
    return (cache[key] = c.toDataURL());
  }

  // <img> 글자. scale: 점 하나의 크기(px), face: 얼굴만 (머리글·순위표용)
  function img(id, scale = 4, face = false) {
    const s = SPRITES[id] || SPRITES.kid;
    const rows = rowsOf(s);
    const h = face ? 13 : rows.length;
    return `<img class="px" alt="" src="${url(id, undefined, face ? h : undefined)}" width="${rows[0].length * scale}" height="${h * scale}">`;
  }

  // 색 섞기: t만큼 to 쪽으로
  function mix(hex, to, t) {
    const n = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const a = n(hex), b = n(to);
    return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  const pot = (color) => url('pot', { C: color, c: mix(color, '#000000', 0.25), h: mix(color, '#ffffff', 0.45) });

  // ===== 배경 =====
  const SW = 200, SH = 65, GY = 59, Z = 4; // 그림 크기(점), 땅이 시작되는 줄, 점 하나의 크기
  const TILE = '#3d4150', TILE_D = '#2b2e3a', TILE_L = '#6b7080', WOOD = '#7a4a2a', RED = '#b5322e', STONE = '#b9b0a0';

  function scene(id) {
    if (cache['scene|' + id]) return cache['scene|' + id];
    const c = document.createElement('canvas');
    c.width = SW * Z;
    c.height = SH * Z;
    const g = c.getContext('2d');
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // 늘 같은 그림이 나오게
    const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x) * Z, Math.round(y) * Z, Math.round(w) * Z, Math.round(h) * Z); };

    const sky = (cols) => cols.forEach((col, i) => r(0, Math.floor(i * GY / cols.length), SW, Math.ceil(GY / cols.length), col));
    // 마인크래프트식 네모 해
    const sun = (x, y) => { r(x - 1, y - 1, 11, 11, '#fff7c2'); r(x, y, 9, 9, '#ffe066'); r(x + 2, y + 2, 5, 5, '#fff3a0'); };
    // 마리오식 뭉게구름
    const cloud = (x, y) => {
      r(x + 3, y, 5, 1, '#fff'); r(x + 9, y + 1, 4, 1, '#fff'); r(x + 1, y + 1, 9, 1, '#fff');
      r(x, y + 2, 15, 2, '#fff'); r(x + 1, y + 4, 13, 1, '#cfe8f7');
    };
    // 마리오식 둥근 언덕 (점무늬)
    const hill = (cx, h, w, col, dark, base = GY) => {
      for (let y = 0; y < h; y++) {
        const t = 1 - (y + 0.5) / h, half = Math.round(w / 2 * Math.sqrt(1 - t * t));
        r(cx - half, base - h + y, half * 2, 1, col);
      }
      for (let i = 0; i < w / 6; i++) r(cx + (rnd() - 0.5) * w * 0.5, base - h * (0.25 + rnd() * 0.5), 2, 1, dark);
    };
    // 뾰족한 산 (cap: 눈 색)
    const mountain = (cx, h, w, col, cap) => {
      for (let y = 0; y < h; y++) {
        const half = Math.round(w / 2 * (y + 1) / h);
        r(cx - half, GY - h + y, half * 2, 1, cap && y < h / 3 + (half % 2) ? cap : col);
      }
    };
    // 블록 땅: 윗면 2줄 + 흙, 8칸마다 블록 이음매
    const ground = (top, top2, dirt, speck) => {
      r(0, GY, SW, SH - GY, dirt); r(0, GY, SW, 1, top); r(0, GY + 1, SW, 1, top2);
      for (let x = 0; x < SW; x++) if (rnd() < 0.3) r(x, GY + 2, 1, 1, top2);
      for (let i = 0; i < 90; i++) r(rnd() * SW, GY + 2 + rnd() * 4, 1, 1, speck);
      for (let x = 7; x < SW; x += 8) r(x, GY + 2, 1, 4, '#0000001c');
    };
    // 기와지붕: 아래 줄(처마)이 가장 넓고 끝이 살짝 들린다. bottom = 처마 바로 아래 줄
    const roof = (x, bottom, w, h, snow) => {
      let inset = 0;
      for (let i = 0; i < h; i++) {
        const y = bottom - 1 - i;
        inset = i < 2 ? i : Math.round(i * 2.2);
        r(x + inset, y, w - inset * 2, 1, snow && i > h - 5 ? '#fff' : i === 0 ? TILE_L : TILE);
        if (i > 0 && !(snow && i > h - 5)) for (let xx = x + inset; xx < x + w - inset; xx += 2) r(xx, y, 1, 1, TILE_D);
      }
      r(x - 1, bottom - 2, 1, 1, TILE_L); r(x - 2, bottom - 3, 1, 1, TILE_L);
      r(x + w, bottom - 2, 1, 1, TILE_L); r(x + w + 1, bottom - 3, 1, 1, TILE_L);
      r(x + inset - 1, bottom - h - 1, w - inset * 2 + 2, 1, snow ? '#fff' : '#e8e4d8'); // 용마루
    };
    // 한옥: 기단 + 흰 벽 + 나무 기둥 + 창호문 + 기와지붕
    const hanok = (x, w, snow) => {
      const wallH = 13, wy = GY - 2 - wallH, bays = 3, bw = (w - 2) / bays;
      r(x - 3, GY - 2, w + 6, 2, STONE);
      r(x, wy, w, wallH, '#f4ecdc');
      for (let i = 0; i < bays; i++) {
        const bx = x + i * bw + 4, dw = bw - 6;
        r(bx, wy + 3, dw, wallH - 4, '#fff8e6');
        for (let k = 0; k <= dw; k += 3) r(bx + k, wy + 3, 1, wallH - 4, '#b98a5e');
        r(bx, wy + 3, dw + 1, 1, '#b98a5e'); r(bx, wy + 7, dw + 1, 1, '#b98a5e');
      }
      for (let i = 0; i <= bays; i++) r(x + i * bw, wy, 2, wallH, WOOD);
      r(x, wy, w, 1, WOOD);
      roof(x - 6, wy, w + 12, 9, snow);
    };
    // 돌담: 마인크래프트 조약돌 무늬 + 기와 얹기
    const stoneWall = (x, w) => {
      r(x, GY - 8, w, 8, '#9a958a');
      for (let i = 0; i < w * 3; i++) r(x + rnd() * (w - 1), GY - 8 + rnd() * 7, rnd() < 0.5 ? 2 : 1, 1, rnd() < 0.5 ? '#7d786e' : '#b5b0a4');
      r(x - 1, GY - 10, w + 2, 2, TILE); r(x - 1, GY - 10, w + 2, 1, TILE_L);
    };
    // 장독
    const jar = (x) => {
      r(x + 1, GY - 7, 4, 1, '#3e2417'); r(x, GY - 6, 6, 1, '#6b3f2a'); r(x - 1, GY - 5, 8, 3, '#6b3f2a');
      r(x, GY - 2, 6, 2, '#6b3f2a'); r(x, GY - 5, 1, 2, '#99623f');
    };
    // 소나무: 납작한 잎 층
    const pine = (x, h, snow) => {
      r(x, GY - h, 2, h, '#6b4226');
      [[-6, -3, 14], [-4, -6, 10], [-8, 3, 7], [3, 5, 6]].forEach(([dx, dy, w]) => {
        r(x + dx, GY - h + dy, w, 3, '#2f6b3a');
        r(x + dx + 1, GY - h + dy - 1, w - 2, 1, snow ? '#fff' : '#3f8a4a');
        if (snow) r(x + dx, GY - h + dy, w, 1, '#fff');
      });
    };
    // 벚나무: 블록 꽃잎
    const cherry = (x, h) => {
      r(x, GY - h, 3, h, '#5a3a2a');
      [8, 14, 18, 18, 14, 8].forEach((w, i) => r(x + 1 - w / 2, GY - h - 8 + i * 2, w, 2, '#ffb7d5'));
      for (let i = 0; i < 26; i++) r(x - 6 + rnd() * 14, GY - h - 7 + rnd() * 9, 2, 1, rnd() < 0.5 ? '#ff8fbf' : '#ffe3ef');
    };
    // 정자
    const pavilion = (x) => {
      const w = 28;
      r(x - 2, GY - 2, w + 4, 2, STONE);
      [0, 9, 17, 26].forEach((dx) => r(x + dx, GY - 15, 2, 13, RED));
      r(x, GY - 6, w, 1, RED); r(x, GY - 4, w, 1, WOOD);
      r(x, GY - 16, w, 1, '#2f8f6b');
      roof(x - 5, GY - 16, w + 10, 7);
    };
    // 단청 띠
    const dancheong = (x, y, w) => { for (let i = 0; i < w; i++) r(x + i, y, 1, 2, ['#2f8f6b', '#2f8f6b', '#e9c46a', '#2b5fa8', '#d1495b'][i % 5]); };
    // 궁궐: 월대 + 붉은 기둥 + 단청 + 2층 지붕 + 현판
    const palace = (x, w) => {
      const wy = GY - 4 - 14, cx = x + w / 2;
      r(x - 6, GY - 4, w + 12, 4, '#cfcac0'); r(x - 6, GY - 4, w + 12, 1, '#e8e4da');
      r(cx - 8, GY - 3, 16, 3, '#b3ada2'); r(cx - 8, GY - 2, 16, 1, '#9a948a');
      r(x, wy, w, 14, '#c9433a');
      for (let bx = x + 3; bx < x + w - 6; bx += 8) { r(bx, wy + 4, 6, 10, '#3f8f76'); r(bx + 2, wy + 4, 1, 10, '#2a6b57'); r(bx, wy + 8, 6, 1, '#2a6b57'); }
      for (let px = x; px <= x + w - 2; px += (w - 2) / 6) r(px, wy, 2, 14, '#8f1f1f');
      dancheong(x, wy, w);
      r(x + 14, wy - 12, w - 28, 5, '#c9433a'); dancheong(x + 14, wy - 12, w - 28);
      roof(x - 7, wy, w + 14, 7);
      roof(x + 8, wy - 12, w - 16, 8);
      r(cx - 5, wy - 11, 10, 4, '#1c2b4a'); r(cx - 3, wy - 10, 2, 2, '#ffd23f'); r(cx + 1, wy - 10, 2, 2, '#ffd23f');
    };
    // 마리오 블록 세 개 (벽돌, ?, 벽돌)
    const blocks = (x, y) => {
      [0, 14].forEach((dx) => {
        r(x + dx, y, 7, 7, '#c8553d'); r(x + dx, y + 3, 7, 1, '#7a2e1f'); r(x + dx + 3, y, 1, 3, '#7a2e1f'); r(x + dx + 1, y + 4, 1, 3, '#7a2e1f'); r(x + dx + 5, y + 4, 1, 3, '#7a2e1f');
      });
      r(x + 7, y, 7, 7, '#f5b301'); r(x + 7, y, 7, 1, '#ffe08a'); r(x + 7, y + 6, 7, 1, '#b97a00');
      r(x + 9, y + 1, 3, 1, '#7a4a00'); r(x + 11, y + 2, 1, 1, '#7a4a00'); r(x + 10, y + 3, 1, 1, '#7a4a00'); r(x + 10, y + 5, 1, 1, '#7a4a00');
    };

    if (id === 'palace') {
      sky(['#6ab7ee', '#8ccaf3', '#b3defa', '#dcf0fd']);
      sun(22, 6); cloud(60, 6); cloud(150, 10);
      mountain(40, 34, 110, '#93a9c9'); mountain(150, 40, 130, '#8098bd'); mountain(100, 26, 90, '#a9bbd6');
      pine(12, 20); pine(188, 22);
      palace(52, 96);
      ground('#e4e0d6', '#cfcac0', '#b3ada2', '#99938a');
    } else if (id === 'beach') {
      sky(['#5fb8ef', '#86cdf5', '#b0e0fa', '#e2f4fd']);
      sun(160, 5); cloud(20, 7); cloud(100, 12);
      hill(40, 8, 44, '#6fae7a', '#55936a', 36); hill(170, 6, 36, '#6fae7a', '#55936a', 36);
      r(0, 36, SW, 8, '#2f8fc9'); r(0, 44, SW, 8, '#46a8d8'); r(0, 52, SW, 7, '#7fcbe8');
      for (let i = 0; i < 40; i++) r(rnd() * SW, 37 + rnd() * 20, 3 + rnd() * 3, 1, '#ffffffb0');
      pavilion(80); pine(186, 22);
      ground('#fbeabb', '#f0d696', '#e3c07c', '#cfa862');
    } else if (id === 'snow') {
      sky(['#8fb0d8', '#abc6e4', '#c9dcf0', '#e6f0f9']);
      mountain(35, 40, 100, '#7f93b3', '#fff'); mountain(165, 44, 120, '#6f86a8', '#fff'); mountain(100, 30, 90, '#93a6c2', '#fff');
      pine(14, 20, true); pine(186, 22, true);
      hanok(62, 76, true);
      ground('#ffffff', '#eef4fa', '#dfe8f0', '#c1cfde');
      for (let i = 0; i < 60; i++) r(rnd() * SW, rnd() * GY, 1, 1, '#fff');
    } else if (id === 'cherry') {
      sky(['#86cbf3', '#aedcf8', '#dcf0fb', '#fde6f0']);
      sun(170, 5); cloud(40, 6); cloud(110, 11);
      hill(50, 20, 80, '#8fd16f', '#6fb957'); hill(150, 26, 90, '#7cc46a', '#5aa84f');
      cherry(22, 16); cherry(60, 12); cherry(142, 14); cherry(182, 18);
      pavilion(86);
      ground('#7ccf5a', '#5fb347', '#9b6b43', '#7d5433');
      for (let i = 0; i < 45; i++) r(rnd() * SW, rnd() * GY, 1, 1, '#ffc2dc');
    } else { // yard: 한옥 마당
      sky(['#5fb8ef', '#86cdf5', '#b0e0fa', '#dcf1fd']);
      sun(172, 5); cloud(48, 5); cloud(118, 10);
      hill(28, 24, 70, '#8fd16f', '#6fb957'); hill(172, 18, 60, '#7cc46a', '#5aa84f');
      blocks(10, 14);
      stoneWall(0, 58); stoneWall(142, 58);
      pine(190, 22);
      hanok(62, 76);
      jar(148); jar(158);
      ground('#e8c896', '#d6b07a', '#c2975f', '#a97f4b');
    }
    return (cache['scene|' + id] = c.toDataURL());
  }

  return { img, url, pot, scene };
})();
