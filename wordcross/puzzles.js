/*
 * 워드크로스 문제 파일 (이 파일만 고치면 문제가 바뀝니다)
 * ------------------------------------------------------------
 * 퍼즐 하나 = { id, lang, title, words: [...] }
 *   lang   : "ko"(한 칸 = 한 글자/음절) 또는 "en"(한 칸 = 알파벳 한 글자)
 *   words  : { answer, clue, emoji }
 *     answer : 정답. 한글은 완성형 글자만, 영어는 알파벳만 (대소문자 무관)
 *     clue   : 아이에게 보여 줄 힌트 문장
 *     emoji  : (선택) 그림 힌트
 *
 * 칸 배치는 엔진이 자동으로 계산합니다(항상 같은 결과).
 * 단어끼리 같은 글자를 공유해야 서로 엮일 수 있어요.
 * 직접 위치를 정하고 싶으면 모든 단어에 row, col, dir("across"|"down")를 넣으세요.
 * 고친 뒤에는  node tools/check.js  로 모든 퍼즐이 잘 짜이는지 확인하세요.
 */
(function (root) {
  var PUZZLES = [
    // ============================== 한글 ==============================
    { id: "ko-01", lang: "ko", title: "맛있는 것들", words: [
      { answer: "사과", clue: "빨갛고 동그란 과일이에요.", emoji: "🍎" },
      { answer: "사탕", clue: "입에서 살살 녹는 달콤한 것이에요.", emoji: "🍬" },
      { answer: "수박", clue: "초록 줄무늬, 속은 빨간 여름 과일이에요.", emoji: "🍉" },
      { answer: "박하사탕", clue: "입이 화하고 시원해지는 하얀 사탕이에요.", emoji: "🍬" },
      { answer: "사과주스", clue: "사과를 갈아서 만든 마실 것이에요.", emoji: "🧃" },
      { answer: "주먹밥", clue: "손으로 꼭꼭 뭉친 동그란 밥이에요.", emoji: "🍙" } ] },

    { id: "ko-02", lang: "ko", title: "숲속 친구들", words: [
      { answer: "고양이", clue: "야옹 하고 우는 동물이에요.", emoji: "🐱" },
      { answer: "도토리", clue: "다람쥐가 좋아하는 열매예요.", emoji: "🌰" },
      { answer: "리본", clue: "선물 상자를 묶는 예쁜 끈이에요.", emoji: "🎀" },
      { answer: "고슴도치", clue: "몸에 뾰족한 가시가 가득해요.", emoji: "🦔" },
      { answer: "부엉이", clue: "밤에 부엉부엉 우는 새예요.", emoji: "🦉" },
      { answer: "사슴", clue: "머리에 멋진 뿔이 있는 동물이에요.", emoji: "🦌" } ] },

    { id: "ko-03", lang: "ko", title: "부릉부릉 칙칙폭폭", words: [
      { answer: "자동차", clue: "바퀴 네 개로 길을 달리는 탈것이에요.", emoji: "🚗" },
      { answer: "기차", clue: "칙칙폭폭 철길 위를 달려요.", emoji: "🚂" },
      { answer: "자전거", clue: "두 바퀴, 페달을 밟아서 타요.", emoji: "🚲" },
      { answer: "기린", clue: "목이 아주 아주 긴 동물이에요.", emoji: "🦒" },
      { answer: "거미", clue: "다리가 여덟 개, 줄을 쳐서 집을 지어요.", emoji: "🕷️" } ] },

    { id: "ko-04", lang: "ko", title: "나비와 나무", words: [
      { answer: "바나나", clue: "길고 노란 과일, 원숭이가 좋아해요.", emoji: "🍌" },
      { answer: "나비", clue: "꽃 사이를 팔랑팔랑 날아다녀요.", emoji: "🦋" },
      { answer: "비누", clue: "손 씻을 때 쓰면 거품이 나요.", emoji: "🧼" },
      { answer: "누나", clue: "남자아이가 손위 여자 형제를 부르는 말이에요.", emoji: "👧" },
      { answer: "나무", clue: "잎과 가지가 있고 숲에 많아요.", emoji: "🌳" },
      { answer: "바다", clue: "짠물이 아주 넓게 펼쳐진 곳이에요.", emoji: "🏖️" } ] },

    { id: "ko-05", lang: "ko", title: "비 오는 날", words: [
      { answer: "우유", clue: "젖소에게서 얻는 하얀 마실 것이에요.", emoji: "🥛" },
      { answer: "우비", clue: "비 올 때 입는 옷이에요.", emoji: "🧥" },
      { answer: "달팽이", clue: "등에 집을 지고 다니는 느림보예요.", emoji: "🐌" },
      { answer: "달님", clue: "밤하늘에 뜨는 달을 다정하게 부르는 말이에요.", emoji: "🌙" },
      { answer: "이슬비", clue: "아주 가늘게 보슬보슬 내리는 비예요.", emoji: "🌦️" } ] },

    { id: "ko-06", lang: "ko", title: "오늘의 기분", words: [
      { answer: "생일", clue: "내가 태어난 날, 케이크를 먹어요.", emoji: "🎂" },
      { answer: "일기", clue: "오늘 있었던 일을 쓰는 글이에요.", emoji: "📔" },
      { answer: "기분", clue: "기쁘거나 슬픈 마음 상태예요.", emoji: "😊" },
      { answer: "분홍", clue: "벚꽃 같은 연한 빨간색이에요.", emoji: "🌸" },
      { answer: "일요일", clue: "학교에 가지 않는 주말, 토요일 다음 날이에요.", emoji: "📅" } ] },

    { id: "ko-07", lang: "ko", title: "우리 학교", words: [
      { answer: "학교", clue: "친구들과 공부하러 가는 곳이에요.", emoji: "🏫" },
      { answer: "교실", clue: "학교에서 수업을 듣는 방이에요.", emoji: "🚪" },
      { answer: "실내화", clue: "학교 건물 안에서 신는 신발이에요.", emoji: "👟" },
      { answer: "화분", clue: "꽃이나 식물을 심는 그릇이에요.", emoji: "🪴" },
      { answer: "분수", clue: "물이 위로 솟아올랐다 떨어져요.", emoji: "⛲" },
      { answer: "수학", clue: "더하기 빼기를 배우는 과목이에요.", emoji: "➕" } ] },

    { id: "ko-08", lang: "ko", title: "신나는 여름", words: [
      { answer: "수박", clue: "초록 줄무늬, 속은 빨간 여름 과일이에요.", emoji: "🍉" },
      { answer: "박수", clue: "손뼉을 짝짝 치는 거예요.", emoji: "👏" },
      { answer: "수영", clue: "물에서 팔다리로 헤엄치는 운동이에요.", emoji: "🏊" },
      { answer: "영화", clue: "극장의 큰 화면으로 봐요.", emoji: "🎬" },
      { answer: "화장실", clue: "손 씻고 볼일 보는 곳이에요.", emoji: "🚽" } ] },

    { id: "ko-09", lang: "ko", title: "노래하는 악어", words: [
      { answer: "마음", clue: "기쁨과 슬픔을 느끼는 곳이에요.", emoji: "💗" },
      { answer: "음악", clue: "노래나 악기 소리를 모두 이렇게 불러요.", emoji: "🎵" },
      { answer: "악기", clue: "피아노, 북처럼 소리를 내는 도구예요.", emoji: "🥁" },
      { answer: "기타", clue: "줄을 튕겨서 연주하는 악기예요.", emoji: "🎸" },
      { answer: "이마", clue: "눈썹 위, 얼굴의 윗부분이에요.", emoji: "🙂" },
      { answer: "타조", clue: "날지 못하는 아주 큰 새예요.", emoji: "🪶" } ] },

    { id: "ko-10", lang: "ko", title: "느릿느릿 거북이", words: [
      { answer: "거북이", clue: "등에 단단한 등딱지가 있고 느릿느릿 걸어요.", emoji: "🐢" },
      { answer: "거울", clue: "내 얼굴을 비춰 보는 물건이에요.", emoji: "🪞" },
      { answer: "이빨", clue: "음식을 씹는 데 써요. 양치로 닦아요.", emoji: "🦷" },
      { answer: "바다거북", clue: "바다에 사는 커다란 거북이에요.", emoji: "🐢" },
      { answer: "빨래", clue: "옷을 깨끗하게 빠는 일이에요.", emoji: "🧺" },
      { answer: "바다", clue: "짠물이 아주 넓게 펼쳐진 곳이에요.", emoji: "🏖️" } ] },

    { id: "ko-11", lang: "ko", title: "비 온 뒤 하늘", words: [
      { answer: "무지개", clue: "비 온 뒤 하늘에 뜨는 일곱 빛깔 다리예요.", emoji: "🌈" },
      { answer: "개미", clue: "줄을 지어 다니는 작은 곤충이에요.", emoji: "🐜" },
      { answer: "미끄럼틀", clue: "놀이터에서 쭉 미끄러져 내려와요.", emoji: "🛝" },
      { answer: "지구", clue: "우리가 사는 둥근 별이에요.", emoji: "🌍" },
      { answer: "지우개", clue: "틀린 글씨를 쓱쓱 지워요.", emoji: "🧽" },
      { answer: "기지개", clue: "아침에 일어나 팔을 쭉 펴는 거예요.", emoji: "🙆" } ] },

    { id: "ko-12", lang: "ko", title: "피아노 연주회", words: [
      { answer: "피자", clue: "둥글고 치즈가 쭉 늘어나는 음식이에요.", emoji: "🍕" },
      { answer: "자전거", clue: "두 바퀴, 페달을 밟아서 타요.", emoji: "🚲" },
      { answer: "거미", clue: "다리가 여덟 개, 줄을 쳐서 집을 지어요.", emoji: "🕷️" },
      { answer: "미소", clue: "살짝 웃는 얼굴이에요.", emoji: "🙂" },
      { answer: "소리", clue: "귀로 듣는 것이에요.", emoji: "👂" } ] },

    { id: "ko-13", lang: "ko", title: "소풍 가는 날", words: [
      { answer: "소풍", clue: "도시락 싸서 놀러 가는 날이에요.", emoji: "🧺" },
      { answer: "풍선", clue: "바람을 불어 넣으면 커져요.", emoji: "🎈" },
      { answer: "선물", clue: "생일에 받으면 기분이 좋아요.", emoji: "🎁" },
      { answer: "물감", clue: "붓에 묻혀서 그림을 그리는 색깔이에요.", emoji: "🎨" },
      { answer: "감자", clue: "땅속에서 자라는 동글동글한 채소예요.", emoji: "🥔" },
      { answer: "시소", clue: "놀이터에서 둘이 오르락내리락 타요.", emoji: "⚖️" } ] },

    { id: "ko-14", lang: "ko", title: "할머니 댁", words: [
      { answer: "할머니", clue: "엄마나 아빠의 엄마예요.", emoji: "👵" },
      { answer: "할아버지", clue: "엄마나 아빠의 아빠예요.", emoji: "👴" },
      { answer: "버스", clue: "많은 사람이 함께 타는 큰 차예요.", emoji: "🚌" },
      { answer: "니트", clue: "털실로 짠 따뜻한 옷이에요.", emoji: "🧶" },
      { answer: "강아지", clue: "멍멍 짖는 귀여운 아기 개예요.", emoji: "🐶" },
      { answer: "아버지", clue: "아빠를 높여 부르는 말이에요.", emoji: "👨" } ] },

    { id: "ko-15", lang: "ko", title: "바닷가 친구들", words: [
      { answer: "바지", clue: "두 다리에 입는 옷이에요.", emoji: "👖" },
      { answer: "지우개", clue: "틀린 글씨를 쓱쓱 지워요.", emoji: "🧽" },
      { answer: "개구리", clue: "개굴개굴 울고 폴짝 뛰어요.", emoji: "🐸" },
      { answer: "불가사리", clue: "별 모양으로 생긴 바다 동물이에요.", emoji: "⭐" },
      { answer: "가방", clue: "책과 필통을 넣어 메고 다녀요.", emoji: "🎒" } ] },

    { id: "ko-16", lang: "ko", title: "연못가에서", words: [
      { answer: "연필", clue: "글씨를 쓰는 도구, 깎아서 써요.", emoji: "✏️" },
      { answer: "필통", clue: "연필과 지우개를 넣어 다녀요.", emoji: "🖊️" },
      { answer: "통나무", clue: "나무를 통째로 자른 것이에요.", emoji: "🪵" },
      { answer: "잠자리", clue: "날개가 넷, 가을 하늘을 날아요.", emoji: "🪰" },
      { answer: "개구리", clue: "개굴개굴 울고 폴짝 뛰어요.", emoji: "🐸" },
      { answer: "무지개", clue: "비 온 뒤 하늘에 뜨는 일곱 빛깔 다리예요.", emoji: "🌈" } ] },

    { id: "ko-17", lang: "ko", title: "잘 자요", words: [
      { answer: "사자", clue: "갈기가 멋진 동물의 왕이에요.", emoji: "🦁" },
      { answer: "자장가", clue: "아기를 재울 때 불러 주는 노래예요.", emoji: "🌙" },
      { answer: "가방", clue: "책과 필통을 넣어 메고 다녀요.", emoji: "🎒" },
      { answer: "방망이", clue: "야구에서 공을 딱! 치는 막대예요.", emoji: "⚾" },
      { answer: "이불", clue: "잘 때 덮는 포근한 것이에요.", emoji: "🛏️" } ] },

    { id: "ko-18", lang: "ko", title: "겨울 놀이", words: [
      { answer: "눈사람", clue: "겨울에 눈을 굴려서 만들어요.", emoji: "⛄" },
      { answer: "사탕", clue: "입에서 살살 녹는 달콤한 것이에요.", emoji: "🍬" },
      { answer: "눈썰매", clue: "눈 위에서 미끄러지며 타요.", emoji: "🛷" },
      { answer: "사람", clue: "나, 엄마, 친구는 모두 ○○이에요.", emoji: "🧑" },
      { answer: "매미", clue: "여름에 맴맴 우는 곤충이에요.", emoji: "🪲" } ] },

    { id: "ko-19", lang: "ko", title: "추석 이야기", words: [
      { answer: "시계", clue: "몇 시인지 알려 줘요. 째깍째깍.", emoji: "⏰" },
      { answer: "계단", clue: "한 칸씩 오르고 내리는 길이에요.", emoji: "🪜" },
      { answer: "단추", clue: "옷을 여밀 때 구멍에 끼우는 동그란 것이에요.", emoji: "🔘" },
      { answer: "추석", clue: "송편을 빚어 먹는 가을 명절이에요.", emoji: "🌕" },
      { answer: "석류", clue: "빨간 알갱이가 가득한 새콤한 과일이에요.", emoji: "🔴" } ] },

    { id: "ko-20", lang: "ko", title: "우리 집", words: [
      { answer: "아빠", clue: "엄마와 함께 나를 돌봐 주시는 분이에요.", emoji: "👨" },
      { answer: "냉장고", clue: "음식을 차갑게 보관해요.", emoji: "🧊" },
      { answer: "고양이", clue: "야옹 하고 우는 동물이에요.", emoji: "🐱" },
      { answer: "이불", clue: "잘 때 덮는 포근한 것이에요.", emoji: "🛏️" },
      { answer: "불고기", clue: "달콤한 양념에 구운 고기 요리예요.", emoji: "🍖" },
      { answer: "아기", clue: "갓 태어난 아주 어린 사람이에요.", emoji: "👶" } ] },

    // ============================== 영어 ==============================
    { id: "en-01", lang: "en", title: "Farm Animals", words: [
      { answer: "CAT", clue: "고양이", emoji: "🐱" },
      { answer: "COW", clue: "소", emoji: "🐮" },
      { answer: "HEN", clue: "암탉", emoji: "🐔" },
      { answer: "GOAT", clue: "염소", emoji: "🐐" },
      { answer: "HORSE", clue: "말", emoji: "🐴" },
      { answer: "SHEEP", clue: "양", emoji: "🐑" } ] },

    { id: "en-02", lang: "en", title: "Colors", words: [
      { answer: "RED", clue: "빨간색", emoji: "🟥" },
      { answer: "BLUE", clue: "파란색", emoji: "🟦" },
      { answer: "PINK", clue: "분홍색", emoji: "🌸" },
      { answer: "GREEN", clue: "초록색", emoji: "🟩" },
      { answer: "BLACK", clue: "검은색", emoji: "⬛" },
      { answer: "WHITE", clue: "하얀색", emoji: "⬜" } ] },

    { id: "en-03", lang: "en", title: "My Body", words: [
      { answer: "EYE", clue: "눈", emoji: "👁️" },
      { answer: "EAR", clue: "귀", emoji: "👂" },
      { answer: "LEG", clue: "다리", emoji: "🦵" },
      { answer: "NOSE", clue: "코", emoji: "👃" },
      { answer: "HEAD", clue: "머리", emoji: "🙂" },
      { answer: "MOUTH", clue: "입", emoji: "👄" } ] },

    { id: "en-04", lang: "en", title: "Fruits", words: [
      { answer: "APPLE", clue: "사과", emoji: "🍎" },
      { answer: "PEAR", clue: "배", emoji: "🍐" },
      { answer: "GRAPE", clue: "포도", emoji: "🍇" },
      { answer: "LEMON", clue: "레몬", emoji: "🍋" },
      { answer: "PEACH", clue: "복숭아", emoji: "🍑" },
      { answer: "LIME", clue: "라임", emoji: "🍋‍🟩" } ] },

    { id: "en-05", lang: "en", title: "Numbers", words: [
      { answer: "ONE", clue: "1, 하나", emoji: "1️⃣" },
      { answer: "TWO", clue: "2, 둘", emoji: "2️⃣" },
      { answer: "SIX", clue: "6, 여섯", emoji: "6️⃣" },
      { answer: "TEN", clue: "10, 열", emoji: "🔟" },
      { answer: "FIVE", clue: "5, 다섯", emoji: "5️⃣" },
      { answer: "NINE", clue: "9, 아홉", emoji: "9️⃣" } ] },

    { id: "en-06", lang: "en", title: "Family", words: [
      { answer: "MOM", clue: "엄마", emoji: "👩" },
      { answer: "DAD", clue: "아빠", emoji: "👨" },
      { answer: "BABY", clue: "아기", emoji: "👶" },
      { answer: "BROTHER", clue: "형, 오빠, 남동생", emoji: "👦" },
      { answer: "AUNT", clue: "이모, 고모", emoji: "👩" },
      { answer: "UNCLE", clue: "삼촌", emoji: "👨" } ] },

    { id: "en-07", lang: "en", title: "School Bag", words: [
      { answer: "PEN", clue: "펜", emoji: "🖊️" },
      { answer: "BAG", clue: "가방", emoji: "🎒" },
      { answer: "DESK", clue: "책상", emoji: "🪑" },
      { answer: "RULER", clue: "자 (길이를 재는 것)", emoji: "📏" },
      { answer: "PENCIL", clue: "연필", emoji: "✏️" },
      { answer: "ERASER", clue: "지우개", emoji: "🧽" } ] },

    { id: "en-08", lang: "en", title: "In the Sky", words: [
      { answer: "SUN", clue: "해", emoji: "☀️" },
      { answer: "MOON", clue: "달", emoji: "🌙" },
      { answer: "STAR", clue: "별", emoji: "⭐" },
      { answer: "RAIN", clue: "비", emoji: "🌧️" },
      { answer: "SNOW", clue: "눈 (하늘에서 내리는)", emoji: "❄️" },
      { answer: "WIND", clue: "바람", emoji: "🌬️" } ] },

    { id: "en-09", lang: "en", title: "Breakfast", words: [
      { answer: "EGG", clue: "달걀", emoji: "🥚" },
      { answer: "MILK", clue: "우유", emoji: "🥛" },
      { answer: "CAKE", clue: "케이크", emoji: "🍰" },
      { answer: "RICE", clue: "밥, 쌀", emoji: "🍚" },
      { answer: "BREAD", clue: "빵", emoji: "🍞" },
      { answer: "BACON", clue: "베이컨", emoji: "🥓" } ] },

    { id: "en-10", lang: "en", title: "My Room", words: [
      { answer: "BED", clue: "침대", emoji: "🛏️" },
      { answer: "CUP", clue: "컵", emoji: "🥤" },
      { answer: "DOOR", clue: "문", emoji: "🚪" },
      { answer: "LAMP", clue: "전등, 스탠드", emoji: "💡" },
      { answer: "TOY", clue: "장난감", emoji: "🧸" },
      { answer: "TABLE", clue: "탁자", emoji: "🪵" } ] },

    { id: "en-11", lang: "en", title: "Let's Move", words: [
      { answer: "RUN", clue: "달리다", emoji: "🏃" },
      { answer: "SIT", clue: "앉다", emoji: "🪑" },
      { answer: "EAT", clue: "먹다", emoji: "😋" },
      { answer: "JUMP", clue: "뛰어오르다", emoji: "🦘" },
      { answer: "SWIM", clue: "수영하다", emoji: "🏊" },
      { answer: "DANCE", clue: "춤추다", emoji: "💃" } ] },

    { id: "en-12", lang: "en", title: "How Is It?", words: [
      { answer: "BIG", clue: "큰", emoji: "🐘" },
      { answer: "HOT", clue: "뜨거운", emoji: "🔥" },
      { answer: "COLD", clue: "차가운", emoji: "🧊" },
      { answer: "SAD", clue: "슬픈", emoji: "😢" },
      { answer: "SMALL", clue: "작은", emoji: "🐭" },
      { answer: "LONG", clue: "긴", emoji: "📏" } ] },

    { id: "en-13", lang: "en", title: "Let's Go", words: [
      { answer: "BUS", clue: "버스", emoji: "🚌" },
      { answer: "CAR", clue: "자동차", emoji: "🚗" },
      { answer: "BOAT", clue: "보트, 배", emoji: "⛵" },
      { answer: "BIKE", clue: "자전거", emoji: "🚲" },
      { answer: "TRAIN", clue: "기차", emoji: "🚆" },
      { answer: "SUBWAY", clue: "지하철", emoji: "🚇" } ] },

    { id: "en-14", lang: "en", title: "Clothes", words: [
      { answer: "HAT", clue: "모자 (챙이 둥근)", emoji: "👒" },
      { answer: "CAP", clue: "모자 (야구 모자)", emoji: "🧢" },
      { answer: "SOCK", clue: "양말 (한 짝)", emoji: "🧦" },
      { answer: "SHOE", clue: "신발 (한 짝)", emoji: "👟" },
      { answer: "DRESS", clue: "원피스, 드레스", emoji: "👗" },
      { answer: "COAT", clue: "코트, 외투", emoji: "🧥" } ] },

    { id: "en-15", lang: "en", title: "Under the Sea", words: [
      { answer: "FISH", clue: "물고기", emoji: "🐟" },
      { answer: "CRAB", clue: "게", emoji: "🦀" },
      { answer: "SHIP", clue: "큰 배", emoji: "🚢" },
      { answer: "SEA", clue: "바다", emoji: "🌊" },
      { answer: "WAVE", clue: "파도", emoji: "🌊" },
      { answer: "SHARK", clue: "상어", emoji: "🦈" } ] },

    { id: "en-16", lang: "en", title: "Little Friends", words: [
      { answer: "ANT", clue: "개미", emoji: "🐜" },
      { answer: "BEE", clue: "벌", emoji: "🐝" },
      { answer: "BUG", clue: "벌레", emoji: "🐛" },
      { answer: "WORM", clue: "지렁이", emoji: "🪱" },
      { answer: "MOUSE", clue: "생쥐", emoji: "🐭" },
      { answer: "BAT", clue: "박쥐", emoji: "🦇" } ] },

    { id: "en-17", lang: "en", title: "In the Garden", words: [
      { answer: "TREE", clue: "나무", emoji: "🌳" },
      { answer: "LEAF", clue: "나뭇잎", emoji: "🍃" },
      { answer: "ROSE", clue: "장미", emoji: "🌹" },
      { answer: "SEED", clue: "씨앗", emoji: "🌱" },
      { answer: "FLOWER", clue: "꽃", emoji: "🌼" },
      { answer: "TULIP", clue: "튤립", emoji: "🌷" } ] },

    { id: "en-18", lang: "en", title: "At the Zoo", words: [
      { answer: "LION", clue: "사자", emoji: "🦁" },
      { answer: "BEAR", clue: "곰", emoji: "🐻" },
      { answer: "ZEBRA", clue: "얼룩말", emoji: "🦓" },
      { answer: "TIGER", clue: "호랑이", emoji: "🐯" },
      { answer: "MONKEY", clue: "원숭이", emoji: "🐒" },
      { answer: "PANDA", clue: "판다", emoji: "🐼" } ] },

    { id: "en-19", lang: "en", title: "Play Time", words: [
      { answer: "BALL", clue: "공", emoji: "⚽" },
      { answer: "KITE", clue: "연", emoji: "🪁" },
      { answer: "DOLL", clue: "인형", emoji: "🪆" },
      { answer: "GAME", clue: "게임, 놀이", emoji: "🎲" },
      { answer: "SWING", clue: "그네", emoji: "🛝" },
      { answer: "SLIDE", clue: "미끄럼틀", emoji: "🛝" } ] },

    { id: "en-20", lang: "en", title: "Kitchen", words: [
      { answer: "SPOON", clue: "숟가락", emoji: "🥄" },
      { answer: "FORK", clue: "포크", emoji: "🍴" },
      { answer: "DISH", clue: "접시", emoji: "🍽️" },
      { answer: "POT", clue: "냄비", emoji: "🍲" },
      { answer: "PAN", clue: "프라이팬", emoji: "🍳" },
      { answer: "KNIFE", clue: "칼", emoji: "🔪" } ] }
  ];

  if (typeof module !== "undefined" && module.exports) module.exports = PUZZLES;
  else root.WORDCROSS_PUZZLES = PUZZLES;
})(this);
