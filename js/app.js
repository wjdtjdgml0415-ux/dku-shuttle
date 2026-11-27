const KEY = 'shuttle-demo-v5';
const SEATS_PER_BUS = 45;           // 셔틀 1대당 좌석 수 (가정)
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const pad = n => String(n).padStart(2, '0');
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toTime = m => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const $ = id => document.getElementById(id);

// ---------- 학교 공식 셔틀 시간표 ----------
// buses: [월, 화, 수, 목, 금, 토, 일] 운행 대수, 0 = 미운행 (학교 공식 시간표는 주말 미운행)
function officialSchedule() {
  const list = []; let id = 1;
  const add = (dir, route, stop, rows) => rows.forEach(([time, buses]) => list.push({ id: id++, dir, route, stop, time, buses }));
  const A = [1, 1, 1, 1, 1], W = [1, 1, 1, 1, 0], T = [2, 2, 2, 2, 1], T0 = [2, 2, 2, 2, 0], F = [0, 0, 0, 0, 1];

  add('등교', '두정역 → 학교', '서울버스 한솔사진', [
    ['08:30', A], ['08:35', W], ['08:40', A], ['08:45', T], ['08:50', A], ['08:55', T0],
    ['09:00', T], ['09:05', T0], ['09:10', T], ['09:20', W], ['09:30', W], ['10:00', A]]);
  add('등교', '천안역 → 학교', '동부광장 맞은편 (세기보청기 앞)', [
    ['08:40', A], ['08:50', A], ['08:55', W], ['09:00', A]]);
  add('등교', '천안터미널 → 학교', '천안고속터미널 (셀러디 앞)', [
    ['08:40', A], ['09:00', A]]);

  add('하교', '학교 → 두정역', '학생회관 1층 앞', [
    ['12:30', F], ['15:30', W], ['16:10', A], ['16:30', W], ['16:45', A],
    ['17:00', W], ['17:10', A], ['17:30', W], ['18:10', W]]);
  add('하교', '학교 → 천안역', '학생회관 1층 앞', [
    ['12:30', F], ['16:30', W]]);
  add('하교', '학교 → 천안터미널', '학생회관 1층 앞', [
    ['12:30', F], ['16:30', W], ['16:45', W], ['17:00', W], ['17:30', W], ['18:10', W]]);
  return list.map(r => ({ ...r, buses: [...r.buses, 0, 0] }));
}
// 지난 7일 시간대별 탑승 체크 누적 (시연용 가상 데이터)
const sampleHistory = () => ({ 8: 420, 9: 610, 10: 70, 12: 40, 15: 95, 16: 310, 17: 280, 18: 120 });

// 분실물 예시 데이터 (목데이터)
function sampleLost() {
  const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return dateKey(x); };
  const ago = h => Date.now() - h * 3600e3;
  const c = (id, author, text, h) => ({ id, author, text, at: ago(h) });
  const L = (o) => ({ status: 'open', photo: '', comments: [], ...o });
  return [
    L({ id: 1, type: '습득', title: '에어팟 프로 (흰색 케이스)', route: '두정역 → 학교', date: d(1), where: '08:45 차, 뒷좌석 바닥',
      desc: '케이스에 곰돌이 스티커가 붙어 있어요.', contact: '학생회관 1층 셔틀 사무실에 맡김', author: 'admin',
      comments: [c(1, 'lee02', '혹시 왼쪽 유닛에 이니셜 각인 있나요?', 20), c(2, 'admin', '각인은 없어요. 케이스 스티커로 확인 가능해요.', 19)] }),
    L({ id: 2, type: '분실', title: '검정 체크 우산', route: '학교 → 천안역', date: d(2), where: '16:30 차, 앞쪽 좌석',
      desc: '손잡이가 나무로 된 장우산입니다.', contact: '에브리타임 쪽지 주세요 (예시)', author: 'student',
      comments: [c(1, 'admin', '셔틀 사무실에 비슷한 우산이 들어왔어요. 학생회관 1층에서 확인해 보세요.', 30)] }),
    L({ id: 3, type: '습득', title: '전공 서적 「경제학원론」', route: '학교 → 두정역', date: d(4), where: '17:10 차',
      desc: '이름은 없고 형광펜 필기가 많아요.', contact: '학생회관 1층 셔틀 사무실에 맡김', status: 'done', author: 'admin',
      comments: [c(1, 'park03', '제 책이에요! 사무실에서 찾아갔습니다 감사합니다 🙏', 50)] }),
    L({ id: 4, type: '분실', title: '갈색 반지갑', route: '두정역 → 학교', date: d(0), where: '09:00 차 (2대 중 뒤차)',
      desc: '안에 학생증과 체크카드가 있어요. 사례하겠습니다.', contact: '010-0000-0000 (예시)', author: 'kim01',
      comments: [c(1, 'choi04', '저도 그 차 탔는데 내릴 때 바닥에 뭐가 떨어져 있었던 것 같아요', 2), c(2, 'kim01', '헉 감사해요! 사무실에 물어볼게요', 1)] }),
    L({ id: 5, type: '습득', title: '노트북 충전기 (USB-C, 65W)', route: '학교 → 천안터미널', date: d(1), where: '17:00 차, 맨 뒷줄',
      desc: '흰색 충전기, 케이블에 빨간 마스킹테이프가 감겨 있어요.', contact: '학생회관 1층 셔틀 사무실에 맡김', author: 'jung05' }),
    L({ id: 6, type: '분실', title: '하늘색 텀블러', route: '천안역 → 학교', date: d(1), where: '08:50 차',
      desc: '스타벅스 하늘색 텀블러, 뚜껑에 흠집 있음', contact: '에브리타임 쪽지 (예시)', author: 'lee02',
      comments: [c(1, 'student', '오늘 아침 차 창가 컵홀더에 비슷한 거 있었어요!', 5)] }),
    L({ id: 7, type: '습득', title: '애플펜슬 2세대', route: '두정역 → 학교', date: d(3), where: '08:40 차, 가운데 좌석 틈',
      desc: '본체만 있어요. 펜 끝에 파란 커버.', contact: '학생회관 1층 셔틀 사무실에 맡김', author: 'admin' }),
    L({ id: 8, type: '분실', title: '체육복 가방 (남색)', route: '학교 → 두정역', date: d(5), where: '18:10 차',
      desc: '안에 체육복과 운동화가 들어 있어요.', contact: '010-0000-0000 (예시)', status: 'done', author: 'park03',
      comments: [c(1, 'admin', '사무실에 보관 중이었어요. 찾아가셨습니다.', 70)] }),
  ];
}

// 학교 공지 예시 (목데이터: 축제 기간 = 오늘부터 3일)
function sampleNotices() {
  const d = n => { const x = new Date(); x.setDate(x.getDate() + n); return dateKey(x); };
  return [
    { id: 1, title: '🎉 대동제(축제) 기간 셔틀 연장 운행', tag: '축제 연장', from: d(0), to: d(2),
      body: '축제 기간 동안 하교 셔틀을 밤 늦게까지 연장 운행합니다.\n막차는 23:00 학교 → 두정역 / 천안터미널입니다.\n공연이 끝나는 시간에는 혼잡하니 대기 현황을 확인해 주세요.',
      extra: [
        { route: '학교 → 두정역', time: '20:00', buses: 2 }, { route: '학교 → 두정역', time: '21:00', buses: 2 },
        { route: '학교 → 두정역', time: '22:00', buses: 2 }, { route: '학교 → 두정역', time: '23:00', buses: 2 },
        { route: '학교 → 천안역', time: '21:00', buses: 1 }, { route: '학교 → 천안역', time: '22:30', buses: 1 },
        { route: '학교 → 천안터미널', time: '21:30', buses: 1 }, { route: '학교 → 천안터미널', time: '23:00', buses: 1 },
      ] },
    { id: 2, title: '셔틀 탑승 시 학생증을 지참해 주세요', tag: '', from: d(-3), to: d(30),
      body: '탑승 시 학생증 확인이 있을 수 있습니다. 모바일 학생증도 가능합니다.', extra: [] },
    { id: 3, title: '📚 기말고사 기간 등교 셔틀 증편', tag: '시험 증편', from: d(17), to: d(28),
      body: '기말고사 기간에는 아침 등교 셔틀을 일찍부터 추가 운행합니다.',
      extra: [
        { route: '두정역 → 학교', time: '08:00', buses: 2 }, { route: '두정역 → 학교', time: '08:15', buses: 2 },
        { route: '천안역 → 학교', time: '08:20', buses: 1 },
      ] },
    { id: 4, title: '도로 공사로 천안역 정류장 임시 이동', tag: '', from: d(-14), to: d(-2),
      body: '공사 기간 동안 천안역 정류장이 동부광장 50m 앞으로 임시 이동했습니다. (종료)', extra: [] },
  ];
}

// ---------- 계정 ----------
// ⚠️ 시연용: 계정이 브라우저에 저장되므로 실제 보안이 되지 않아요. 실제 서비스는 서버(예: Supabase Auth)로 바꿔야 해요.
function hashPw(id, pw) {   // 비밀번호를 그대로 저장하지 않기 위한 간단한 해시 (cyrb53)
  const str = id + ':' + pw; let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
// 목데이터 계정 (학생 비밀번호는 모두 1234)
const sampleUsers = () => [
  { id: 'admin', name: '셔틀 관리자', role: 'admin', pw: hashPw('admin', 'admin1234') },
  ...[['student', '데모 학생'], ['kim01', '김민준'], ['lee02', '이서연'], ['park03', '박지호'], ['choi04', '최유나'], ['jung05', '정하늘']]
    .map(([id, name]) => ({ id, name, role: 'student', pw: hashPw(id, '1234') })),
];

function fresh() { return { schedule: officialSchedule(), history: sampleHistory(), lost: sampleLost(), notices: sampleNotices(), users: sampleUsers(), session: null, day: null, log: {}, demoTime: '', demoDay: '' }; }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.schedule) {
      if (!s.notices) s.notices = sampleNotices();
      if (!s.users) { s.users = sampleUsers(); s.session = null; s.day = null; }
      s.schedule.forEach(r => { while (r.buses.length < 7) r.buses.push(0); });   // 주말 칸 추가
      if (!s.log) s.log = {};
      return s;
    }
  } catch (e) {}
  return fresh();
}
const me = () => S.users.find(u => u.id === S.session) || null;
const isAdmin = () => me()?.role === 'admin';
const userName = id => S.users.find(u => u.id === id)?.name || '알 수 없음';
const mk = id => `${S.session}:${id}`;   // 탑승·대기 체크를 계정별로 구분하는 키
// 관리자 전용 동작 감싸기
const adminOnly = fn => (...a) => isAdmin() ? fn(...a) : toast('관리자만 할 수 있어요');
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

let S = load();
let dir = '등교';
let route = '전체';
let weekDir = '등교';
let weekStation = null;   // 시간표 탭에서 고른 역 (null = 첫 번째 역)
// 노선 이름에서 역 이름 뽑기: '두정역 → 학교' / '학교 → 두정역' → '두정역'
const stationOf = rt => rt.split('→').map(t => t.trim()).find(t => t !== '학교') || rt;
let statMode = 'today';
let lostMode = '전체';
let lfType = '습득';
let editingLost = null;   // 관리자가 수정 중인 분실물 글 id
const openCmts = new Set();   // 댓글을 펼쳐 둔 분실물 글 id
const cmtDraft = {};          // 작성 중인 댓글 (화면이 다시 그려져도 유지)
let showPast = false;  // 지난 회차 펼치기
let showAllRuns = false;  // 회차 목록 전체 보기 (기본은 앞의 5개만)
let showChart = false;    // 지난 이용 그래프 펼치기
const RUN_PREVIEW = 5;
// 홈 검색 조건: mode = now(지금 이후) | hour(특정 시간대) | all(하루 전체)
let q = { text: '', mode: 'now', hour: null };
const textMatch = run => {
  const t = q.text.trim().toLowerCase().replace(/\s/g, '');
  return !t || (run.route + run.stop + (run.tag || '')).toLowerCase().replace(/\s/g, '').includes(t);
};
// 검색 시간 범위 [from, to] (분 단위)
function qWindow() {
  if (q.mode === 'hour') return [q.hour * 60, q.hour * 60 + 59];
  return [-Infinity, Infinity];
}
let nfRuns = [];   // 공지 등록 폼에서 추가 중인 연장 회차

function now() {
  const d = new Date();
  if (S.demoTime) { const [h, m] = S.demoTime.split(':').map(Number); d.setHours(h, m, 0, 0); }
  return d;
}
// 0=월 … 4=금, 5=토, 6=일
function weekday() {
  if (S.demoDay) return Number(S.demoDay) - 1;
  return (new Date().getDay() + 6) % 7;
}
// 날짜가 바뀌면 금일 운행 정보·탑승 체크 초기화
function day() {
  const k = dateKey(new Date()) + '/' + weekday();
  if (S.day && S.day.date !== k) saveLog(S.day);   // 날이 바뀌면 어제 기록을 남김
  if (!S.day || S.day.date !== k) { S.day = { date: k, status: {}, boardings: {}, mine: {}, waiting: {}, mineWait: {} }; mockDay(S.day); }
  return S.day;
}
// 하루 기록 저장: { '노선|시각': 탑승 인원 } (최근 14일만 보관)
function saveLog(d) {
  const [date] = d.date.split('/');
  S.log = S.log || {};
  const rec = {};
  allRuns().forEach(r => { const c = d.boardings[r.id] || 0; if (c) rec[r.route + '|' + r.time] = c; });
  if (Object.keys(rec).length) S.log[date] = rec;
  Object.keys(S.log).sort().slice(0, -14).forEach(k => delete S.log[k]);
}
// 그날(날짜·요일) 운행한 회차
const runsOn = (date, w) => [...S.schedule, ...extraRuns(date)].filter(r => busesOn(r, w) > 0);
// 시간대별 붐비는 정도 (0~1) — 목데이터용
function busyOf(r) {
  const t = toMin(r.time);
  if (r.dir === '등교') return t >= 520 && t <= 550 ? 0.95 : t >= 510 && t <= 560 ? 0.6 : 0.3;   // 08:40~09:10 피크
  if (t >= 1260 && t <= 1320) return 0.95;            // 축제 21~22시
  if (t >= 990 && t <= 1030) return 0.85;             // 16:30~17:10
  if (t >= 1050 && t <= 1090 || t >= 1200) return 0.55;
  return 0.3;
}
// 기록이 없는 날은 목데이터로 채움 (같은 날짜는 항상 같은 숫자)
function mockLog(date, w) {
  let seed = [...(date + '#' + w)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11);
  const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const rec = {};
  runsOn(date, w).forEach(r => {
    const seats = busesOn(r, w) * SEATS_PER_BUS;
    rec[r.route + '|' + r.time] = Math.min(seats, Math.round(seats * busyOf(r) * (0.75 + rand() * 0.5)));
  });
  return rec;
}
// 가장 최근 운행일(어제 또는 그 전)의 이용 기록
let cmpMode = 'last';   // 비교 기준: last(어제·최근 운행일) | week(지난주 같은 요일)
let _ldKey, _ld;
function lastDay() {   // 같은 조건이면 계산 결과 재사용
  const key = [cmpMode, dateKey(new Date()), weekday(), JSON.stringify(S.schedule.map(r => r.buses)), S.notices.length, Object.keys(S.log || {}).length].join('/');
  if (key !== _ldKey) { _ldKey = key; _ld = findLastDay(); }
  return _ld;
}
function findLastDay() {
  const days = cmpMode === 'week' ? [7] : [1, 2, 3, 4, 5, 6, 7];
  for (const i of days) {
    const dt = new Date(); dt.setDate(dt.getDate() - i);
    const date = dateKey(dt), w = (weekday() - i + 70) % 7;
    const runs = runsOn(date, w);
    if (!runs.length) continue;
    const rec = (S.log && S.log[date]) || mockLog(date, w);
    const short = i === 1 ? '어제' : i === 7 ? `지난주 ${DAYS[w]}요일` : `지난 ${DAYS[w]}요일`;
    const md = S.demoDay ? '' : `${dt.getMonth() + 1}/${dt.getDate()}`;   // 시연 요일이면 실제 날짜와 안 맞아서 생략
    const label = i === 1 ? `어제(${md ? md + ' ' : ''}${DAYS[w]})` : md ? `${short}(${md})` : short;
    return { date, w, runs, rec, label, short };
  }
  return null;
}
const crowdOf = r => r < 0.5 ? { txt: '여유', cls: 'b-ok' } : r < 0.8 ? { txt: '보통', cls: 'b-mid' } : r < 1 ? { txt: '혼잡', cls: 'b-busy' } : { txt: '만석', cls: 'b-busy' };

// 목데이터: 오늘 회차마다 탑승·대기 인원을 시간대에 맞게 채움 (같은 날은 항상 같은 숫자)
function mockDay(d) {
  let seed = [...d.date].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const busy = busyOf;
  todayRuns().forEach(r => {
    const seats = busesToday(r) * SEATS_PER_BUS;
    const total = Math.round(seats * busy(r) * (0.7 + rand() * 0.6));
    const boarded = Math.min(seats, Math.round(total * (0.35 + rand() * 0.3)));
    if (boarded) d.boardings[r.id] = boarded;
    if (total - boarded > 0) d.waiting[r.id] = total - boarded;
  });
  // 만석 예시: 등교 08:50 두정역, 하교 16:45 두정역
  [['두정역 → 학교', '08:50'], ['학교 → 두정역', '16:45']].forEach(([rt, t]) => {
    const r = todayRuns().find(x => x.route === rt && x.time === t);
    if (r) { d.boardings[r.id] = busesToday(r) * SEATS_PER_BUS; d.waiting[r.id] = 6; }
  });
  const late = todayRuns().find(r => r.route === '두정역 → 학교' && r.time === '08:45');
  if (late) d.status[late.id] = { state: 'delay', delay: 10, note: '교통 정체로 지연' };
  const off = todayRuns().find(r => r.route === '학교 → 천안터미널' && r.time === '17:30');
  if (off) d.status[off.id] = { state: 'cancel', delay: 0, note: '차량 점검' };
}

// ---------- 계산 ----------
// 오늘 날짜에 걸려 있는 공지
const activeNotices = (k = dateKey(new Date())) => S.notices.filter(n => (!n.from || n.from <= k) && (!n.to || k <= n.to));
// 노선 이름으로 구분·탑승 장소 찾기
const routeMeta = rt => S.schedule.find(r => r.route === rt) || { dir: '하교', stop: '학생회관 1층 앞' };
// 공지에 붙은 연장·추가 운행 회차 → 오늘 운행 목록에 합침 (요일과 무관하게 공지 기간 동안 운행)
function extraRuns(k) {
  return activeNotices(k).flatMap(n => (n.extra || []).map((e, k) => {
    const m = routeMeta(e.route);
    return { id: 10000 + n.id * 100 + k, dir: m.dir, route: e.route, stop: m.stop, time: e.time, fixed: e.buses, tag: n.tag || '추가 운행' };
  }));
}
const busesOn = (run, w) => run.fixed != null ? run.fixed : run.buses[w] || 0;
const busesToday = run => busesOn(run, weekday());
const allRuns = () => [...S.schedule, ...extraRuns()];
const todayRuns = () => allRuns().filter(r => busesToday(r) > 0);
const findRun = id => allRuns().find(r => r.id === id);

function runInfo(run) {
  const d = day();
  const st = d.status[run.id] || { state: 'normal' };
  const delay = st.state === 'delay' ? Number(st.delay) || 0 : 0;
  const actual = toMin(run.time) + delay;
  const buses = busesToday(run);
  const seats = buses * SEATS_PER_BUS;
  const count = d.boardings[run.id] || 0;
  const waiting = d.waiting[run.id] || 0;
  const left = Math.max(seats - count, 0);              // 실제 남은 좌석
  const expLeft = seats - count - waiting;               // 대기 인원까지 태웠을 때 예상 잔여
  const ratio = seats ? (count + waiting) / seats : 0;   // 혼잡도 = (탑승 + 대기) / 좌석
  let level;
  if (st.state === 'cancel') level = { txt: '운행 취소', cls: 'b-gray', color: 'var(--gray)' };
  else if (left === 0) level = { txt: '만석', cls: 'b-busy', color: 'var(--busy)' };
  else if (ratio >= 0.8) level = { txt: '혼잡', cls: 'b-busy', color: 'var(--busy)' };
  else if (ratio >= 0.5) level = { txt: '보통', cls: 'b-mid', color: 'var(--mid)' };
  else level = { txt: '여유', cls: 'b-ok', color: 'var(--ok)' };
  const n = now(); const nowMin = n.getHours() * 60 + n.getMinutes();
  const past = actual < nowMin - 5; // 출발 5분 지나면 지난 회차
  return { run, st, delay, actual, buses, seats, count, waiting, left, expLeft, ratio, level, past,
           mine: !!d.mine[mk(run.id)], mineWait: !!d.mineWait[mk(run.id)], minsLeft: actual - nowMin };
}
// 같은 노선의 다음 차
function nextSameRoute(i) {
  return nextOf(todayRuns().filter(r => r.route === i.run.route && r.id !== i.run.id).map(runInfo).filter(x => x.actual > i.actual));
}
// 대기 인원 기준 탑승 안내 문구
function waitHint(i) {
  if (i.st.state === 'cancel') return { txt: '운행이 취소됐어요', warn: true };
  if (i.left === 0) { const n = nextSameRoute(i); return { txt: `만석이에요${n ? ` · 다음 차 ${toTime(n.actual)} 추천` : ''}`, warn: true }; }
  if (i.expLeft < 0) { const n = nextSameRoute(i); return { txt: `대기 인원이 남은 좌석보다 ${-i.expLeft}명 많아요${n ? ` · 다음 차 ${toTime(n.actual)} 추천` : ''}`, warn: true }; }
  if (i.ratio >= 0.8) return { txt: `곧 자리가 찰 수 있어요 (예상 잔여 ${i.expLeft}석)`, warn: false };
  return { txt: `지금 가면 여유 있게 탈 수 있어요 (예상 잔여 ${i.expLeft}석)`, warn: false };
}
const sorted = list => [...list].sort((a, b) => toMin(a.time) - toMin(b.time) || a.route.localeCompare(b.route));
const routesOf = d => [...new Set(allRuns().filter(r => r.dir === d).map(r => r.route))];
const visibleRuns = () => sorted(todayRuns().filter(r => r.dir === dir && (route === '전체' || r.route === route)));
const nextOf = infos => infos.filter(i => !i.past && i.st.state !== 'cancel').sort((a, b) => a.actual - b.actual)[0];

// ---------- 동작 ----------
function board(id) {
  const d = day(); const run = findRun(id); if (!run) return; const info = runInfo(run);
  if (info.st.state === 'cancel' || info.left === 0 || info.mine) return;
  d.boardings[id] = (d.boardings[id] || 0) + 1; d.mine[mk(id)] = true;
  if (d.mineWait[mk(id)]) { d.waiting[id] = Math.max((d.waiting[id] || 1) - 1, 0); delete d.mineWait[mk(id)]; }
  save(); toast(`${run.time} ${run.route} 탑승 체크 완료!`); render();
}
function wait(id) {
  const d = day(); const run = findRun(id); if (!run) return; const info = runInfo(run);
  if (info.st.state === 'cancel' || info.mine || info.mineWait) return;
  d.waiting[id] = (d.waiting[id] || 0) + 1; d.mineWait[mk(id)] = true;
  save(); toast(`${run.route} 정류장 대기 등록! 버스가 오면 탑승 체크해 주세요`); render();
}
function unwait(id) {
  const d = day(); if (!d.mineWait[mk(id)]) return;
  d.waiting[id] = Math.max((d.waiting[id] || 1) - 1, 0); delete d.mineWait[mk(id)];
  save(); toast('대기를 취소했어요'); render();
}
function unboard(id) {
  const d = day(); if (!d.mine[mk(id)]) return;
  d.boardings[id] = Math.max((d.boardings[id] || 1) - 1, 0); delete d.mine[mk(id)];
  save(); toast('탑승 체크를 취소했어요'); render();
}
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- 화면 ----------
function render() {
  const u = me();
  document.body.classList.toggle('locked', !u);
  document.body.classList.toggle('admin', !!u && u.role === 'admin');
  $('userBox').innerHTML = u ? `<div class="who">${u.role === 'admin' ? '🛠' : '🎓'} ${esc(u.name)}님</div><button class="btn ghost" data-logout="1">로그아웃</button>` : '';
  const n = now(); const w = weekday();
  const dayName = DAYS[w];
  $('today').textContent = `${n.getMonth() + 1}월 ${n.getDate()}일 (${dayName}) ${pad(n.getHours())}:${pad(n.getMinutes())}`
    + (S.demoDay || S.demoTime ? ' · 시연 모드' : '');
  if (!u) return;
  renderHome(); renderWeek(); renderNotices();
  if (!$('lostList').contains(document.activeElement)) renderLost();   // 댓글 입력 중엔 다시 그리지 않음
  if (u.role === 'admin') { renderStats(); renderAdmin(); renderUsers(); }
  fixTab();
}

function statusText(i) {
  if (i.st.state === 'cancel') return '운행 취소';
  if (i.st.state === 'delay') return `${i.delay}분 지연 · 실제 ${toTime(i.actual)} 출발`;
  return '정시 운행';
}

function renderHome() {
  $('dirSeg').innerHTML = ['등교', '하교'].map(d => `<button class="${d === dir ? 'on' : ''}" data-dir="${d}">${d}</button>`).join('');
  $('routeChips').innerHTML = ['전체', ...routesOf(dir)].map(r =>
    `<button class="chip ${r === route ? 'on' : ''}" data-route="${r}">${r}</button>`).join('');

  renderBanner();
  renderLastCard();
  if (!todayRuns().length) {
    $('nextCard').innerHTML = `<div class="card"><b>${weekday() >= 5 ? '이번 주말에는 운행하는 셔틀이 없어요' : '오늘 운행하는 셔틀이 없어요'}</b><p class="muted" style="margin:6px 0 0">관리자 페이지의 시연 도구에서 요일을 골라 볼 수 있어요.</p></div>`;
    $('runList').innerHTML = '<p class="muted" style="margin:0">오늘 운행하는 회차가 없어요.</p>';
    $('waitBoard').classList.add('hidden');
    $('qSummary').textContent = ''; $('timeChips').innerHTML = ''; $('qReset').classList.add('hidden');
    return;
  }
  renderWaitBoard();

  const infos = visibleRuns().map(runInfo).filter(i => textMatch(i.run));
  const next = nextOf(infos);
  renderSearch();

  if (next) {
    const when = next.minsLeft <= 0 ? '곧 출발' : next.minsLeft < 60 ? `${next.minsLeft}분 후 출발` : `${toTime(next.actual)} 출발`;
    $('nextCard').innerHTML = `<div class="card next">
      <div class="label">다음 셔틀 · ${next.run.route}${next.run.tag ? ` · 🎉 ${esc(next.run.tag)}` : ''}</div>
      <div class="time">${toTime(next.actual)}</div>
      <div class="meta">📍 ${esc(next.run.stop)}</div>
      <div class="meta">${when} · ${statusText(next)} · ${next.buses}대 운행</div>
      <div class="meta" style="margin-top:6px">혼잡도 <b>${next.level.txt}</b> · 대기 <b>${next.waiting}</b>명 · 탑승 <b>${next.count}</b>명 · 잔여 <b>${next.left}</b>/${next.seats}석</div>
      <div class="hint">${waitHint(next).warn ? '⚠️' : '💡'} ${waitHint(next).txt}</div>
      ${ydNext(next)}
      ${next.mine
        ? `<button class="btn" data-unboard="${next.run.id}">✓ 탑승 체크됨 (취소)</button>`
        : `<div class="btns">
            ${next.mineWait
              ? `<button class="btn alt" data-unwait="${next.run.id}">⏳ 대기 중 (취소)</button>`
              : `<button class="btn alt" data-wait="${next.run.id}">정류장 대기 중</button>`}
            <button class="btn" data-board="${next.run.id}" ${next.left === 0 ? 'disabled' : ''}>${next.left === 0 ? '만석이에요' : '탑승 체크'}</button>
          </div>`}
    </div>`;
  } else {
    $('nextCard').innerHTML = `<div class="card"><b>오늘 ${dir} 셔틀 운행이 모두 끝났어요</b><p class="muted" style="margin:6px 0 0">관리자 페이지의 시연 도구에서 시각을 바꿔 볼 수 있어요.</p></div>`;
  }

  const notices = infos.filter(i => !i.past && i.st.state !== 'normal');
  const noticeHtml = notices.map(i =>
    `<div class="notice">⚠️ ${i.run.time} ${i.run.route}: ${statusText(i)}${i.st.note ? ' — ' + esc(i.st.note) : ''}</div>`).join('');

  // 시간 조건 적용: '지금 이후'는 지난 회차를 접고, 나머지는 해당 시간대만 (지난 회차도 흐리게 표시)
  let shown, pastBtn = '';
  if (q.mode === 'now') {
    const pastN = infos.filter(i => i.past).length;
    shown = showPast ? infos : infos.filter(i => !i.past);
    if (pastN) pastBtn = `<button class="btn ghost" style="width:100%;margin-bottom:12px" data-togglepast="1">${showPast ? '지난 회차 접기' : `지난 회차 ${pastN}개 보기`}</button>`;
  } else {
    const [from, to] = qWindow();
    shown = infos.filter(i => i.actual >= from && i.actual <= to);
  }

  // 검색 결과 요약
  const [, to] = qWindow();
  const whenTxt = q.mode === 'now' ? '지금 이후' : q.mode === 'hour' ? `${q.hour}시대` : '하루 전체';
  const conds = [dir, whenTxt, route !== '전체' ? route : '', q.text.trim() ? `'${esc(q.text.trim())}'` : ''].filter(Boolean);
  const visibleN = q.mode === 'now' && !showPast ? shown.filter(i => !i.past).length : shown.length;
  $('qSummary').innerHTML = `${conds.join(' · ')} → <b>${visibleN}개</b> 회차`;
  $('qReset').classList.toggle('hidden', q.mode === 'now' && !q.text && route === '전체');

  // 결과가 없을 때: 조건 다음으로 가장 가까운 운행 안내
  let emptyHtml;
  if (!infos.length) emptyHtml = `<div class="empty"><b>검색 결과가 없어요</b><span class="muted">${q.text ? '검색어나 노선을 바꿔 보세요.' : '오늘 이 노선은 운행하지 않아요.'}</span></div>`;
  else {
    const after = infos.filter(i => i.actual > to && i.st.state !== 'cancel').sort((a, b) => a.actual - b.actual)[0];
    emptyHtml = `<div class="empty"><b>이 시간대에는 운행이 없어요</b>${after
      ? `<span class="muted">다음 운행은 <b>${toTime(after.actual)}</b> ${after.run.route}예요.</span><br><button class="btn sub" style="margin-top:8px" data-qhour="${Math.floor(after.actual / 60)}">${Math.floor(after.actual / 60)}시대 보기</button>`
      : '<span class="muted">오늘 남은 운행이 없어요.</span>'}</div>`;
  }

  const more = shown.length - RUN_PREVIEW;
  const moreBtn = more > 0 ? `<button class="btn ghost" style="width:100%;margin-top:10px" data-moreruns="1">${showAllRuns ? '접기' : `회차 ${more}개 더 보기`}</button>` : '';
  if (more > 0 && !showAllRuns) shown = shown.slice(0, RUN_PREVIEW);
  $('runList').innerHTML = noticeHtml + pastBtn + (shown.length ? shown.map(i => `
    <div class="run ${i.past ? 'past' : ''}">
      <div class="row between">
        <div class="row">
          <div class="t" style="${i.st.state === 'cancel' ? 'text-decoration:line-through' : ''}">${i.run.time}</div>
          <div>
            <div class="r"><b style="color:var(--text)">${i.run.route}</b>${i.buses > 1 ? ` <span class="badge b-blue">${i.buses}대</span>` : ''}${i.run.tag ? ` <span class="badge b-fest">${esc(i.run.tag)}</span>` : ''}</div>
            <div class="r">${i.past ? '운행 완료' : statusText(i)}</div>
          </div>
        </div>
        <div class="row">
          <span class="badge ${i.level.cls}">${i.level.txt}</span>
          ${i.past || i.st.state === 'cancel' ? '' : i.mine
            ? `<button class="btn sub" data-unboard="${i.run.id}">✓ 체크됨</button>`
            : i.mineWait
              ? `<button class="btn sub" data-board="${i.run.id}" ${i.left === 0 ? 'disabled' : ''}>탑승</button>`
              : `<button class="btn ghost" data-wait="${i.run.id}">대기</button>`}
        </div>
      </div>
      ${i.st.state === 'cancel' ? '' : `<div class="bar"><i style="width:${Math.min(i.ratio * 100, 100)}%;background:${i.level.color}"></i></div>
      <div class="seats">대기 ${i.waiting}명 · 탑승 ${i.count}명 · 잔여 ${i.left}석${i.mineWait ? ' · <b style="color:var(--primary)">내가 대기 중</b>' : ''}${yd(i)}</div>`}
    </div>`).join('') + moreBtn : emptyHtml);
}

// ---------- 지난 운행일 이용 현황 (학생도 보는 화면) ----------
// 회차 줄에 붙는 '어제 이 차 N명'
function yd(i) {
  const L = lastDay(); const c = L && L.rec[i.run.route + '|' + i.run.time];
  if (c == null) return '';
  return ` · <span class="yd">${L.short} ${c}명</span>`;
}
function ydNext(i) {
  const L = lastDay(); const c = L && L.rec[i.run.route + '|' + i.run.time];
  if (c == null) return '';
  const cr = crowdOf(c / i.seats);
  return `<div class="meta" style="margin-top:6px">📊 ${L.short} 같은 차: <b>${c}</b>/${i.seats}명 (${cr.txt})</div>`;
}
// 시간대별 막대그래프 + 예상 문구
function renderLastCard() {
  const L = lastDay();
  const toggle = `<div class="seg" style="margin:8px 0 0">${[['last', '어제·최근 운행일'], ['week', '지난주 같은 요일']].map(([k, t]) =>
    `<button class="${cmpMode === k ? 'on' : ''}" data-cmp="${k}">${t}</button>`).join('')}</div>`;
  if (!L) {
    $('lastCard').classList.remove('hidden');
    $('lastCard').innerHTML = `<h2>📊 지난 이용 현황</h2><p class="muted" style="margin:0">${cmpMode === 'week' ? `지난주 ${DAYS[weekday()]}요일에는 운행이 없었어요.` : '최근 일주일 동안 운행 기록이 없어요.'}</p>${toggle}`;
    return;
  }
  const runs = L.runs.filter(r => r.dir === dir && (route === '전체' || r.route === route) && textMatch(r));
  const byHour = {}, capHour = {};
  runs.forEach(r => {
    const h = Math.floor(toMin(r.time) / 60);
    byHour[h] = (byHour[h] || 0) + (L.rec[r.route + '|' + r.time] || 0);
    capHour[h] = (capHour[h] || 0) + busesOn(r, L.w) * SEATS_PER_BUS;
  });
  const hours = Object.keys(byHour).map(Number).sort((a, b) => a - b);
  $('lastCard').classList.remove('hidden');
  if (!hours.length) {
    $('lastCard').innerHTML = `<h2>📊 ${L.label} ${dir} 이용</h2><p class="muted" style="margin:0">이 조건으로는 ${L.short} 운행 기록이 없어요.</p>${toggle}`;
    return;
  }
  const max = Math.max(1, ...hours.map(h => byHour[h]));
  const peak = hours.reduce((p, h) => byHour[h] > byHour[p] ? h : p, hours[0]);
  const n = now(); const nowH = q.mode === 'hour' ? q.hour : n.getHours();
  const total = hours.reduce((a, h) => a + byHour[h], 0);
  // 예상 문구: 지금(또는 검색한) 시간대 → 없으면 다음 운행 시간대
  const target = hours.find(h => h >= nowH);
  let say;
  if (target == null) say = `${L.short} 이 시간 이후로는 ${dir} 운행이 없었어요.`;
  else {
    const cr = crowdOf(byHour[target] / capHour[target]);
    const when = target === nowH ? (q.mode === 'hour' ? `${target}시대` : `지금 ${target}시대`) : `다음 운행 ${target}시대`;
    say = `${when}는 ${L.short} <b>${byHour[target]}명</b>이 탔어요 → <b>${cr.txt === '여유' ? '여유 있을 것 같아요' : cr.txt === '보통' ? '조금 붐빌 수 있어요' : '많이 붐빌 것 같아요'}</b>`;
    if (target !== peak) say += `<br>가장 붐볐던 시간은 <b>${peak}시대</b>(${byHour[peak]}명)예요.`;
  }
  $('lastCard').innerHTML = `
    <div class="row between"><h2>📊 ${L.label} ${dir} 이용</h2><span class="muted">총 ${total}명</span></div>
    <div class="say" style="margin-top:4px">${say}</div>
    <button class="linkbtn" data-chart="1">${showChart ? '그래프 접기 ▴' : '시간대별 그래프 보기 ▾'}</button>
    ${showChart ? `<div class="chart">${hours.map(h => `<div class="col ${h === nowH ? 'now' : h === peak ? 'peak' : ''}">
      <b>${byHour[h]}</b><i style="height:${byHour[h] / max * 100}%"></i><span>${h}시</span></div>`).join('')}</div>
    <div class="legend"><span><i style="background:var(--primary)"></i>${q.mode === 'hour' ? '검색한 시간' : '지금 시간'}</span><span><i style="background:#ee6c6e"></i>가장 붐빈 시간</span></div>
    ${toggle}` : ''}`;
}

// 시간대 버튼: 지금 보고 있는 등교/하교에 실제로 운행이 있는 시간만 (회차 수 함께 표시)
function renderSearch() {
  // 버튼은 이 방향(등교/하교) 시간표 전체의 시간대로 만들고, 숫자는 오늘 운행 회차 수
  const byHour = {};
  allRuns().filter(r => r.dir === dir && (route === '전체' || r.route === route) && textMatch(r))
    .forEach(r => { const h = Math.floor(toMin(r.time) / 60); byHour[h] = byHour[h] || 0; });
  visibleRuns().map(runInfo).filter(i => textMatch(i.run))
    .forEach(i => { const h = Math.floor(i.actual / 60); byHour[h] = (byHour[h] || 0) + 1; });
  const chip = (on, attr, label, n) => `<button class="chip ${on ? 'on' : ''} ${n === 0 ? 'zero' : ''}" ${attr}>${label}${n != null ? `<small>${n}</small>` : ''}</button>`;
  $('timeChips').innerHTML =
    chip(q.mode === 'now', 'data-qmode="now"', '지금 이후') +
    Object.keys(byHour).map(Number).sort((a, b) => a - b).map(h => chip(q.mode === 'hour' && q.hour === h, `data-qhour="${h}"`, `${h}시`, byHour[h])).join('') +
    chip(q.mode === 'all', 'data-qmode="all"', '하루 전체');
}

// ---------- 학교 공지 ----------
const fmtD = k => k ? `${Number(k.slice(5, 7))}/${Number(k.slice(8))}` : '';
const period = n => n.from && n.to ? (n.from === n.to ? fmtD(n.from) : `${fmtD(n.from)} ~ ${fmtD(n.to)}`) : '';
// 홈 상단 배너: 오늘 적용 중인 공지 (연장 운행 공지를 먼저)
function renderBanner() {
  const list = activeNotices().sort((a, b) => (b.extra || []).length - (a.extra || []).length);
  $('noticeBanner').innerHTML = list.map(n => {
    const ex = n.extra || [];
    const last = ex.length ? ex.map(e => e.time).sort().pop() : '';
    if (!ex.length) return `<button class="banner plain mini" data-gonotice="1">📢 <b>${esc(n.title)}</b><span>›</span></button>`;
    return `<button class="banner" data-gonotice="1">
      <div class="k">📢 학교 공지${n.tag ? ' · ' + esc(n.tag) : ''} · ${period(n)}</div>
      <div class="ttl">${esc(n.title)}</div>
      <div class="s">${ex.length ? `오늘 추가 운행 ${ex.length}회 · 막차 ${last} · 하교 탭에서 확인 ›` : '자세히 보기 ›'}</div>
    </button>`;
  }).join('');
}
// 시간표 탭의 공지 목록
function renderNotices() {
  const k = dateKey(new Date());
  const list = [...S.notices].sort((a, b) => (b.from || '').localeCompare(a.from || ''));
  $('noticeList').innerHTML = `<h2>학교 공지</h2>` + (list.length ? list.map(n => {
    const on = (!n.from || n.from <= k) && (!n.to || k <= n.to);
    const ended = n.to && n.to < k;
    const ex = n.extra || [];
    const byRoute = {};
    ex.forEach(e => (byRoute[e.route] = byRoute[e.route] || []).push(e));
    return `<div class="ntc ${ended ? 'old' : ''}">
      <div>${on ? '<span class="badge b-ok">오늘 적용 중</span>' : ended ? '<span class="badge b-gray">종료</span>' : '<span class="badge b-blue">예정</span>'}
        ${n.tag ? `<span class="badge b-fest">${esc(n.tag)}</span>` : ''} <span class="muted">${period(n)}</span></div>
      <div class="ttl">${esc(n.title)}</div>
      ${n.body ? `<div class="body">${esc(n.body)}</div>` : ''}
      ${ex.length ? `<div class="times">${Object.entries(byRoute).map(([rt, es]) =>
        `<div><b>${rt}</b> · ${es.sort((a, b) => a.time.localeCompare(b.time)).map(e => e.time + (e.buses > 1 ? `(${e.buses}대)` : '')).join(', ')}</div>`).join('')}</div>` : ''}
    </div>`;
  }).join('') : '<p class="muted" style="margin:0">등록된 공지가 없어요.</p>');

  // 관리 탭: 공지 등록 폼 + 목록
  const routes = [...new Set(S.schedule.map(r => r.route))];
  const cur = $('nfRoute').value;
  $('nfRoute').innerHTML = routes.map(r => `<option>${r}</option>`).join('');
  if (cur) $('nfRoute').value = cur;
  if (!$('nfFrom').value) $('nfFrom').value = k;
  if (!$('nfTo').value) $('nfTo').value = k;
  $('nfRuns').innerHTML = nfRuns.map((e, i) => `<button class="xchip" data-nfdel="${i}">${e.route} ${e.time}${e.buses > 1 ? ` ${e.buses}대` : ''} ✕</button>`).join('');
  $('noticeAdmin').innerHTML = list.map(n => `
    <div class="row between run">
      <div><b>${esc(n.title)}</b><br><span class="muted">${period(n)}${(n.extra || []).length ? ` · 추가 운행 ${n.extra.length}회` : ''}</span></div>
      <button class="btn ghost" data-ntcdel="${n.id}">삭제</button>
    </div>`).join('');
}

// 정류장별 대기 현황: 노선마다 다음 차의 대기 인원과 혼잡도
function renderWaitBoard() {
  const rows = routesOf(dir).map(rt => {
    const i = nextOf(todayRuns().filter(r => r.route === rt).map(runInfo));
    if (!i) return `<div class="wait-row"><div><b>${rt}</b><div class="hint muted">오늘 남은 차 없음</div></div></div>`;
    const h = waitHint(i);
    return `<div class="wait-row">
      <div style="min-width:0">
        <div><b>${rt}</b> <span class="badge ${i.level.cls}">${i.level.txt}</span></div>
        <div class="r muted" style="font-size:12px">📍 ${esc(i.run.stop)} · ${toTime(i.actual)} 출발</div>
        <div class="hint ${h.warn ? 'warn' : 'muted'}">${h.txt}</div>
      </div>
      <div class="wait-num"><b>${i.waiting}</b><span>명 대기</span></div>
    </div>`;
  }).join('');
  $('waitBoard').classList.remove('hidden');
  $('waitBoard').innerHTML = `<h2>정류장 대기 현황</h2>${rows}`;
}

// ---------- 분실물 ----------
function renderLost() {
  $('lostSeg').innerHTML = ['전체', '습득', '분실'].map(m =>
    `<button class="${m === lostMode ? 'on' : ''}" data-lostmode="${m}">${m === '전체' ? '전체' : m === '습득' ? '주웠어요' : '잃어버렸어요'}</button>`).join('');
  $('lfType').innerHTML = [['습득', '주웠어요'], ['분실', '잃어버렸어요']].map(([k, t]) =>
    `<button class="${k === lfType ? 'on' : ''}" data-lftype="${k}">${t}</button>`).join('');
  $('lfContactLabel').textContent = lfType === '습득' ? '보관 장소 / 연락 방법' : '연락 방법';
  const routes = [...new Set(S.schedule.map(r => r.route))];
  const cur = $('lfRoute').value;
  $('lfRoute').innerHTML = routes.map(r => `<option>${r}</option>`).join('') + '<option>모름</option>';
  if (cur) $('lfRoute').value = cur;
  if (!$('lfDate').value) $('lfDate').value = dateKey(new Date());

  const q = $('lostSearch').value.trim().toLowerCase();
  const items = [...S.lost]
    .filter(x => lostMode === '전체' || x.type === lostMode)
    .filter(x => !q || [x.title, x.route, x.desc, x.where].join(' ').toLowerCase().includes(q))
    .sort((a, b) => (a.status === 'done') - (b.status === 'done') || b.date.localeCompare(a.date) || b.id - a.id);

  $('lostList').innerHTML = items.length ? items.map(x => {
    const done = x.status === 'done';
    const tag = x.type === '습득' ? '<span class="badge b-blue">주웠어요</span>' : '<span class="badge b-mid">잃어버렸어요</span>';
    const st = done ? `<span class="badge b-ok">${x.type === '습득' ? '주인 찾음' : '찾음'}</span>` : '';
    return `<div class="lost ${done ? 'done' : ''}">
      <div class="ph">${x.photo ? `<img src="${x.photo}" alt="">` : x.type === '습득' ? '📦' : '🔎'}</div>
      <div class="body">
        <div>${tag} ${st}</div>
        <div class="ttl">${esc(x.title)}</div>
        <div class="meta">🚌 ${esc(x.route)} · ${x.date.slice(5).replace('-', '/')}${x.where ? ' · ' + esc(x.where) : ''}</div>
        ${x.desc ? `<div class="desc">${esc(x.desc)}</div>` : ''}
        ${x.contact ? `<div class="meta" style="margin-top:4px">📞 ${esc(x.contact)}</div>` : ''}
        <div class="meta">✍️ ${x.author ? esc(userName(x.author)) : '관리자'}${x.author === S.session ? ' (내 글)' : ''}</div>
        <div class="acts">
          ${canEditLost(x) ? `<button class="btn ${done ? 'ghost' : 'sub'}" data-lostdone="${x.id}">${done ? '되돌리기' : x.type === '습득' ? '주인 찾았어요' : '찾았어요'}</button>
          ${isAdmin() ? `<button class="btn ghost" data-lostedit="${x.id}">수정</button>` : ''}
          <button class="btn ghost" data-lostdel="${x.id}">삭제</button>` : ''}
          <button class="btn ${openCmts.has(x.id) ? 'sub' : 'ghost'}" data-cmttoggle="${x.id}">💬 댓글 ${(x.comments || []).length}</button>
        </div>
        ${openCmts.has(x.id) ? renderComments(x) : ''}
      </div>
    </div>`;
  }).join('') : '<p class="muted" style="margin:0">등록된 분실물이 없어요.</p>';
}
// 댓글 목록 + 입력칸
function renderComments(x) {
  const fmt = t => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const list = (x.comments || []).map(c => {
    const u = S.users.find(v => v.id === c.author);
    const badge = c.author === x.author ? ' <span class="badge b-blue">작성자</span>' : u?.role === 'admin' ? ' <span class="badge b-fest">관리자</span>' : '';
    const canDel = isAdmin() || c.author === S.session;
    return `<div class="cmt">
      <div class="who2">${esc(userName(c.author))}${badge}<span class="when">${fmt(c.at)}</span>
        ${canDel ? `<button class="x" data-cmtdel="${x.id}:${c.id}">삭제</button>` : ''}</div>
      <div class="txt">${esc(c.text)}</div>
    </div>`;
  }).join('');
  return `<div class="cmts">
    ${list || '<div class="muted" style="font-size:12px">아직 댓글이 없어요. 본 적이 있다면 알려 주세요!</div>'}
    <div class="cmt-in">
      <input data-cmtin="${x.id}" maxlength="200" placeholder="댓글을 입력하세요" value="${esc(cmtDraft[x.id] || '')}" />
      <button class="btn" data-cmtadd="${x.id}">등록</button>
    </div>
  </div>`;
}
function addComment(id) {
  const x = S.lost.find(l => l.id === id); if (!x || !me()) return;
  const text = (cmtDraft[id] || '').trim();
  if (!text) { toast('댓글 내용을 입력해 주세요'); return; }
  x.comments = x.comments || [];
  x.comments.push({ id: Math.max(0, ...x.comments.map(c => c.id)) + 1, author: S.session, text, at: Date.now() });
  delete cmtDraft[id];
  save(); renderLost(); toast('댓글을 달았어요');
  d_focus(id);
}
const d_focus = id => { const el = document.querySelector(`[data-cmtin="${id}"]`); if (el) el.focus(); };

// 분실물 글은 작성자 본인이나 관리자만 수정·삭제
const canEditLost = x => !!x && (isAdmin() || (x.author && x.author === S.session));

// 사진은 시연용으로 작게 줄여 브라우저에 저장
function readPhoto(file) {
  return new Promise(res => {
    if (!file) return res('');
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 320 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => res('');
    img.src = url;
  });
}

function renderWeek() {
  $('weekSeg').innerHTML = ['등교', '하교'].map(d => `<button class="${d === weekDir ? 'on' : ''}" data-weekdir="${d}">${d}</button>`).join('');
  $('seatPer').textContent = SEATS_PER_BUS;
  const w = weekday();
  const hasWeekend = S.schedule.some(r => r.dir === weekDir && (r.buses[5] || r.buses[6]));
  const cols = hasWeekend ? 7 : 5;   // 주말 운행이 하나라도 있으면 토·일 칸까지
  const head = `<tr><th>시간</th>${DAYS.slice(0, cols).map((d, k) => `<th class="${k === w ? 'today' : ''} ${k >= 5 ? 'wk' : ''}">${d}</th>`).join('')}</tr>`;
  // 역 버튼: 이 방향 시간표에 있는 역들 (등교/하교를 바꿔도 같은 역을 유지)
  const routes = [...new Set(S.schedule.filter(r => r.dir === weekDir).map(r => r.route))];
  const stations = [...new Set(routes.map(stationOf))];
  if (!stations.includes(weekStation)) weekStation = stations[0] || null;
  $('stationChips').innerHTML = stations.map(st => {
    const n = S.schedule.filter(r => r.dir === weekDir && stationOf(r.route) === st).length;
    return `<button class="chip ${st === weekStation ? 'on' : ''}" data-station="${esc(st)}">${esc(st)}<small>${n}</small></button>`;
  }).join('');
  const body = routes.filter(rt => stationOf(rt) === weekStation).map(rt => {
    const runs = sorted(S.schedule.filter(r => r.route === rt));
    if (!runs.length) return '';
    return `<tr class="grp"><td colspan="${cols + 1}">${rt}<br><span class="muted" style="font-weight:400">📍 ${esc(runs[0].stop)}</span></td></tr>` +
      runs.map(r => `<tr><td><b>${r.time}</b></td>${r.buses.slice(0, cols).map((b, k) =>
        `<td class="${b === 0 ? 'off' : b > 1 ? 'two' : ''} ${k === w ? 'today' : ''} ${k >= 5 ? 'wk' : ''}">${b === 0 ? (cols > 5 ? '✕' : '미운행') : b + '대'}</td>`).join('')}</tr>`).join('');
  }).join('');
  $('weekTable').innerHTML = head + body;
}

function renderStats() {
  const d = day();
  const todayByHour = {};
  allRuns().forEach(r => {
    const c = d.boardings[r.id] || 0; const h = Math.floor(toMin(r.time) / 60);
    todayByHour[h] = (todayByHour[h] || 0) + c;
  });
  const data = statMode === 'today' ? todayByHour : S.history;
  const lastH = Math.max(18, ...Object.keys(data).filter(h => data[h]).map(Number));
  const hours = []; for (let h = 8; h <= lastH; h++) hours.push(h);
  const max = Math.max(1, ...hours.map(h => data[h] || 0));
  const peak = hours.reduce((p, h) => (data[h] || 0) > (data[p] || 0) ? h : p, hours[0]);

  $('statChips').innerHTML = [['today', '오늘'], ['week', '최근 7일']].map(([k, t]) =>
    `<button class="chip ${statMode === k ? 'on' : ''}" data-stat="${k}">${t}</button>`).join('');
  $('chart').innerHTML = hours.map(h => {
    const v = data[h] || 0;
    return `<div class="col ${v && h === peak ? 'peak' : ''}"><b>${v || ''}</b><i style="height:${v / max * 100}%"></i><span>${h}</span></div>`;
  }).join('');
  $('chartNote').textContent = (data[peak] ? `가장 붐비는 시간대는 ${peak}시대예요. ` : '아직 탑승 체크가 없어요. ') +
    (statMode === 'week' ? '(시연용 가상 데이터)' : '');

  const total = Object.values(d.boardings).reduce((a, b) => a + b, 0);
  const waitingNow = todayRuns().map(runInfo).filter(i => !i.past).reduce((a, i) => a + i.waiting, 0);
  const issues = Object.values(d.status).filter(s => s.state !== 'normal').length;
  $('statSummary').innerHTML = `
    <div class="stat"><b>${total}</b><span>오늘 탑승 체크</span></div>
    <div class="stat"><b>${waitingNow}</b><span>지금 대기 중</span></div>
    <div class="stat"><b>${issues}</b><span>지연·취소</span></div>`;
}

// 관리자 페이지: 요약 + 회원 관리
function renderUsers() {
  const d = day();
  const students = S.users.filter(u => u.role === 'student').length;
  const openLost = S.lost.filter(x => x.status !== 'done').length;
  const total = Object.values(d.boardings).reduce((a, b) => a + b, 0);
  $('adminSummary').innerHTML = `
    <div class="stat"><b>${students}</b><span>가입 학생</span></div>
    <div class="stat"><b>${total}</b><span>오늘 탑승 체크</span></div>
    <div class="stat"><b>${openLost}</b><span>미해결 분실물</span></div>`;
  $('userList').innerHTML = S.users.map(u => {
    const self = u.id === S.session;
    return `<div class="row between run">
      <div><b>${esc(u.name)}</b> <span class="badge ${u.role === 'admin' ? 'b-fest' : 'b-blue'}">${u.role === 'admin' ? '관리자' : '학생'}</span>
        <br><span class="muted">${esc(u.id)}${self ? ' · 나' : ''}</span></div>
      ${self ? '' : `<div class="row">
        <button class="btn sub" data-role="${esc(u.id)}">${u.role === 'admin' ? '학생으로' : '관리자로'}</button>
        <button class="btn ghost" data-udel="${esc(u.id)}">삭제</button></div>`}
    </div>`;
  }).join('');
}

function renderAdmin() {
  const runs = sorted(todayRuns());
  const cur = $('stRun').value;
  $('stRun').innerHTML = runs.length ? runs.map(r => {
    const st = day().status[r.id];
    const tag = st && st.state === 'delay' ? ` [${st.delay}분 지연]` : st && st.state === 'cancel' ? ' [취소]' : '';
    return `<option value="${r.id}">[${r.dir}] ${r.time} ${r.route}${tag}</option>`;
  }).join('') : '<option value="">오늘 운행 회차 없음</option>';
  if (cur && runs.some(r => String(r.id) === cur)) $('stRun').value = cur;
  const changed = runs.filter(r => day().status[r.id]);
  $('stList').innerHTML = `<div class="muted" style="margin-bottom:6px">오늘 지연·취소된 회차 ${changed.length}개</div>` + changed.map(r => {
    const st = day().status[r.id];
    return `<div class="row between run"><div><b>${r.time}</b> <span class="muted">[${r.dir}] ${r.route}<br>${st.state === 'cancel' ? '운행 취소' : st.delay + '분 지연'}${st.note ? ' · ' + esc(st.note) : ''}</span></div>
      <button class="btn ghost" data-streset="${r.id}">정상으로</button></div>`;
  }).join('');

  $('routeList').innerHTML = [...new Set(S.schedule.map(r => r.route))].map(r => `<option value="${r}">`).join('');
  $('stopList').innerHTML = [...new Set(S.schedule.map(r => r.stop))].map(r => `<option value="${esc(r)}">`).join('');
  if (!$('addDays').children.length)
    $('addDays').innerHTML = DAYS.map((d, k) => `<div class="${k >= 5 ? 'wk' : ''}"><span>${d}</span><input type="number" min="0" max="9" value="${k < 5 ? 1 : 0}" data-day="${k}" /></div>`).join('');

  $('schedCount').textContent = `(${S.schedule.length}개)`;
  document.querySelectorAll('#schedSeg button').forEach(x => x.classList.toggle('on', x.dataset.sdir === schedDir));
  $('schedList').innerHTML = sorted(S.schedule.filter(r => r.dir === schedDir)).map(r => `
    <div class="row between run">
      <div><b>${r.time}</b> <span class="muted">[${r.dir}] ${r.route}<br>${r.buses.map((b, k) => b ? DAYS[k] + b : '').filter(Boolean).join(' ') || '운행 없음'}${r.buses[5] || r.buses[6] ? ' <span class="badge b-wk">주말</span>' : ''}</span></div>
      <button class="btn ghost" data-del="${r.id}">삭제</button>
    </div>`).join('');
  $('demoTime').value = S.demoTime || '';
  $('demoDay').value = S.demoDay || '';
}

// ---------- 탭 이동 ----------
// 관리자는 오늘 운행·시간표 탭 대신 분실물·통계·관리자 탭만 사용
const STUDENT_TABS = ['home', 'week', 'lost'], ADMIN_TABS = ['lost', 'stats', 'admin'];
let curTab = 'home', adminTab = 'run', schedDir = '등교';
function goTab(t) {
  curTab = t;
  document.querySelectorAll('nav button').forEach(x => x.classList.toggle('on', x.dataset.tab === t));
  ['home', 'week', 'lost', 'stats', 'admin'].forEach(k => $('tab-' + k).classList.toggle('hidden', k !== t));
  window.scrollTo(0, 0);
}
function fixTab() {   // 로그인한 사람의 역할에 맞지 않는 탭이면 기본 탭으로
  if (!me()) return;
  const ok = isAdmin() ? ADMIN_TABS : STUDENT_TABS;
  if (!ok.includes(curTab)) goTab(isAdmin() ? 'admin' : 'home');
}
function showAdminTab() {
  document.querySelectorAll('#adminSeg button').forEach(x => x.classList.toggle('on', x.dataset.atab === adminTab));
  document.querySelectorAll('[data-apane]').forEach(x => x.classList.toggle('hidden', x.dataset.apane !== adminTab));
}

// ---------- 이벤트 ----------
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.tab) {
    if ((b.dataset.tab === 'admin' || b.dataset.tab === 'stats') && !isAdmin()) return toast('관리자만 들어갈 수 있어요');
    goTab(b.dataset.tab);
  }
  if (b.dataset.sdir) { schedDir = b.dataset.sdir; renderAdmin(); }
  if (b.dataset.atab) { adminTab = b.dataset.atab; showAdminTab(); window.scrollTo(0, 0); }
  if (b.dataset.streset && isAdmin()) { delete day().status[b.dataset.streset]; save(); toast('정상 운행으로 되돌렸어요'); render(); }
  if (b.dataset.dir || b.dataset.route || b.dataset.qmode || b.dataset.qhour) showAllRuns = false;
  if (b.dataset.moreruns) { showAllRuns = !showAllRuns; renderHome(); if (!showAllRuns) $('runList').scrollIntoView({ block: 'start' }); }
  if (b.dataset.chart) { showChart = !showChart; renderHome(); }
  if (b.dataset.dir) { dir = b.dataset.dir; route = '전체'; if (q.mode === 'hour') q.mode = 'now'; renderHome(); }
  if (b.dataset.route) { route = b.dataset.route; renderHome(); }
  if (b.dataset.weekdir) { weekDir = b.dataset.weekdir; renderWeek(); }
  if (b.dataset.cmp) { cmpMode = b.dataset.cmp; renderHome(); }
  if (b.dataset.preset) {   // 시간표 등록: 요일 빠른 선택
    const on = { weekday: k => k < 5, weekend: k => k >= 5, all: () => true }[b.dataset.preset];
    document.querySelectorAll('#addDays input').forEach((x, k) => x.value = on(k) ? Math.max(1, Number(x.value) || 1) : 0);
  }
  if (b.dataset.station) { weekStation = b.dataset.station; renderWeek(); }
  if (b.dataset.board) board(Number(b.dataset.board));
  if (b.dataset.unboard) unboard(Number(b.dataset.unboard));
  if (b.dataset.wait) wait(Number(b.dataset.wait));
  if (b.dataset.unwait) unwait(Number(b.dataset.unwait));
  if (b.dataset.togglepast) { showPast = !showPast; renderHome(); }
  if (b.dataset.qmode) { q.mode = b.dataset.qmode; q.hour = null; renderHome(); }
  if (b.dataset.qhour) { q.mode = 'hour'; q.hour = Number(b.dataset.qhour); renderHome(); $('qSummary').scrollIntoView({ block: 'nearest' }); }
  if (b.dataset.gonotice) {
    const ex = activeNotices().some(n => (n.extra || []).length);
    if (ex) { dir = '하교'; route = '전체'; renderHome(); }   // 연장 운행 공지면 하교 목록으로
    ex ? $('runList').scrollIntoView() : goTab('week');
  }
  if ((b.dataset.nfdel || b.dataset.ntcdel || b.dataset.del || b.dataset.role || b.dataset.udel) && !isAdmin()) return toast('관리자만 할 수 있어요');
  if (b.dataset.role) {
    const u = S.users.find(x => x.id === b.dataset.role);
    u.role = u.role === 'admin' ? 'student' : 'admin';
    save(); toast(`${u.name}님을 ${u.role === 'admin' ? '관리자로' : '학생으로'} 바꿨어요`); render();
  }
  if (b.dataset.udel && confirm('이 회원을 삭제할까요?')) {
    S.users = S.users.filter(x => x.id !== b.dataset.udel);
    save(); toast('회원을 삭제했어요'); render();
  }
  if (b.dataset.auth) {
    document.querySelectorAll('#authSeg button').forEach(x => x.classList.toggle('on', x === b));
    $('loginForm').classList.toggle('hidden', b.dataset.auth !== 'login');
    $('signupForm').classList.toggle('hidden', b.dataset.auth !== 'signup');
  }
  if (b.dataset.fill) {
    const [id, pw] = b.dataset.fill.split('|');
    document.querySelector('#authSeg [data-auth=login]').click();
    $('liId').value = id; $('liPw').value = pw;
  }
  if (b.dataset.logout) {
    S.session = null; save();
    goTab('home');
    render(); toast('로그아웃했어요');
  }
  if (b.dataset.nfdel) { nfRuns.splice(Number(b.dataset.nfdel), 1); renderNotices(); }
  if (b.dataset.ntcdel && confirm('이 공지를 삭제할까요?')) {
    S.notices = S.notices.filter(n => n.id !== Number(b.dataset.ntcdel));
    save(); toast('공지를 삭제했어요'); render();
  }
  if (b.dataset.lostmode) { lostMode = b.dataset.lostmode; renderLost(); }
  if (b.dataset.cmttoggle) {
    const id = Number(b.dataset.cmttoggle);
    openCmts.has(id) ? openCmts.delete(id) : openCmts.add(id);
    renderLost(); if (openCmts.has(id)) d_focus(id);
  }
  if (b.dataset.cmtadd) addComment(Number(b.dataset.cmtadd));
  if (b.dataset.cmtdel) {
    const [lid, cid] = b.dataset.cmtdel.split(':').map(Number);
    const x = S.lost.find(l => l.id === lid); const c = x?.comments?.find(v => v.id === cid);
    if (!c) return;
    if (!(isAdmin() || c.author === S.session)) return toast('내 댓글만 지울 수 있어요');
    if (!confirm('댓글을 삭제할까요?')) return;
    x.comments = x.comments.filter(v => v.id !== cid);
    save(); renderLost(); toast('댓글을 삭제했어요');
  }
  if (b.dataset.lostedit) {
    if (!isAdmin()) return toast('관리자만 수정할 수 있어요');
    openLostForm(S.lost.find(l => l.id === Number(b.dataset.lostedit)));
  }
  if (b.dataset.lftype) { lfType = b.dataset.lftype; renderLost(); }
  if (b.dataset.lostdone) {
    const x = S.lost.find(l => l.id === Number(b.dataset.lostdone));
    if (!canEditLost(x)) return toast('작성자나 관리자만 바꿀 수 있어요');
    x.status = x.status === 'done' ? 'open' : 'done';
    save(); toast(x.status === 'done' ? '찾음으로 표시했어요 🎉' : '다시 찾는 중으로 바꿨어요'); renderLost();
  }
  if (b.dataset.lostdel && canEditLost(S.lost.find(l => l.id === Number(b.dataset.lostdel))) && confirm('이 분실물 글을 삭제할까요?')) {
    S.lost = S.lost.filter(l => l.id !== Number(b.dataset.lostdel));
    save(); toast('삭제했어요'); renderLost();
  }
  if (b.dataset.stat && isAdmin()) { statMode = b.dataset.stat; renderStats(); }
  if (b.dataset.del) {
    S.schedule = S.schedule.filter(r => r.id !== Number(b.dataset.del));
    save(); toast('시간표에서 삭제했어요'); render();
  }
});

$('stSave').onclick = adminOnly(() => {
  const id = Number($('stRun').value); if (!id) return;
  const state = $('stState').value;
  if (state === 'normal') delete day().status[id];
  else day().status[id] = { state, delay: Number($('stDelay').value) || 0, note: $('stNote').value.trim() };
  $('stNote').value = '';
  save(); toast('금일 운행 정보를 저장했어요'); render();
});
$('addSave').onclick = adminOnly(() => {
  const r = $('addRoute').value.trim(), stop = $('addStop').value.trim(), t = $('addTime').value;
  const buses = [...document.querySelectorAll('#addDays input')].map(x => Math.max(0, Number(x.value) || 0));
  if (!r || !stop || !t) { toast('노선·탑승 장소·시각을 입력해 주세요'); return; }
  if (!buses.some(Boolean)) { toast('운행하는 요일이 하나 이상 있어야 해요'); return; }
  const id = Math.max(0, ...S.schedule.map(x => x.id)) + 1;
  S.schedule.push({ id, dir: $('addDir').value, route: r, stop, time: t, buses });
  save(); toast(`${t} ${r} 회차를 등록했어요`); render();
});
$('demoTime').onchange = adminOnly(e => { S.demoTime = e.target.value; save(); render(); });
$('demoDay').onchange = adminOnly(e => { S.demoDay = e.target.value; save(); render(); });
$('demoClear').onclick = adminOnly(() => { S.demoTime = ''; S.demoDay = ''; save(); render(); });
// 시연: 현재 보고 있는 등교/하교·노선의 다음 셔틀 기준
const demoTarget = () => nextOf(visibleRuns().map(runInfo));
$('demoWait').onclick = adminOnly(() => {
  const next = demoTarget();
  if (!next) { toast(`남은 ${dir} 회차가 없어요`); return; }
  day().waiting[next.run.id] = next.waiting + 10;
  save(); toast(`${next.run.time} ${next.run.route} 정류장에 10명 대기`); render();
});
$('demoAdd').onclick = adminOnly(() => {
  const next = demoTarget();
  if (!next) { toast(`남은 ${dir} 회차가 없어요`); return; }
  const n = Math.min(10, next.left);
  day().boardings[next.run.id] = next.count + n;
  day().waiting[next.run.id] = Math.max(next.waiting - n, 0); // 대기하던 사람부터 탑승
  save(); toast(`${next.run.time} ${next.run.route}에 ${n}명 탑승 체크`); render();
});

// 학교 공지 등록
$('nfAddRun').onclick = adminOnly(() => {
  const time = $('nfTime').value; if (!time) return;
  nfRuns.push({ route: $('nfRoute').value, time, buses: Math.max(1, Number($('nfBuses').value) || 1) });
  renderNotices();
});
$('nfSave').onclick = adminOnly(() => {
  const title = $('nfTitle').value.trim(), from = $('nfFrom').value, to = $('nfTo').value;
  if (!title) { toast('공지 제목을 입력해 주세요'); return; }
  if (from && to && from > to) { toast('종료일이 시작일보다 빨라요'); return; }
  const id = Math.max(0, ...S.notices.map(n => n.id)) + 1;
  S.notices.push({ id, title, body: $('nfBody').value.trim(), tag: $('nfTag').value.trim(), from, to, extra: nfRuns });
  nfRuns = [];
  ['nfTitle', 'nfBody', 'nfTag'].forEach(k => $(k).value = '');
  save(); toast('공지를 등록했어요'); render();
});

// 분실물 등록
const LF_FIELDS = ['lfTitle', 'lfWhere', 'lfDesc', 'lfContact', 'lfPhoto'];
// x 가 있으면 수정 모드(관리자), 없으면 새 글 등록
function openLostForm(x) {
  editingLost = x ? x.id : null;
  lfType = x ? x.type : '습득';
  LF_FIELDS.forEach(k => $(k).value = '');
  renderLost();
  if (x) {
    $('lfTitle').value = x.title; $('lfRoute').value = x.route; $('lfDate').value = x.date;
    $('lfWhere').value = x.where || ''; $('lfDesc').value = x.desc || ''; $('lfContact').value = x.contact || '';
  }
  $('lfHead').textContent = x ? '✏️ 분실물 글 수정 (관리자)' : '분실물 등록';
  $('lfSave').textContent = x ? '수정 저장' : '등록';
  $('lostForm').classList.remove('hidden'); $('lostToggle').textContent = '닫기';
  $('lostForm').scrollIntoView({ block: 'start', behavior: 'smooth' });
}
function closeLostForm() {
  editingLost = null; LF_FIELDS.forEach(k => $(k).value = '');
  $('lostForm').classList.add('hidden'); $('lostToggle').textContent = '+ 등록하기';
}
$('lostToggle').onclick = () => $('lostForm').classList.contains('hidden') ? openLostForm(null) : closeLostForm();
$('lostSearch').oninput = () => renderLost();
$('lostList').addEventListener('input', e => { const id = e.target.dataset.cmtin; if (id) cmtDraft[id] = e.target.value; });
$('lostList').addEventListener('keydown', e => {
  const id = e.target.dataset.cmtin;
  if (id && e.key === 'Enter' && !e.isComposing) { e.preventDefault(); addComment(Number(id)); }
});
$('lfSave').onclick = async () => {
  const title = $('lfTitle').value.trim();
  if (!title) { toast('물건 이름을 입력해 주세요'); return; }
  const photo = await readPhoto($('lfPhoto').files[0]);
  if (editingLost) {   // 관리자 수정: 새 사진을 올렸을 때만 사진 교체
    if (!isAdmin()) return toast('관리자만 수정할 수 있어요');
    const x = S.lost.find(l => l.id === editingLost);
    const oldPhoto = x.photo;
    Object.assign(x, { type: lfType, title, route: $('lfRoute').value, date: $('lfDate').value || x.date,
      where: $('lfWhere').value.trim(), desc: $('lfDesc').value.trim(), contact: $('lfContact').value.trim() });
    if (photo) x.photo = photo;
    let msg = '분실물 글을 수정했어요';
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { x.photo = oldPhoto; save(); msg = '사진 용량이 커서 사진은 그대로 두고 수정했어요'; }
    closeLostForm(); renderLost(); toast(msg);
    return;
  }
  const id = Math.max(0, ...S.lost.map(x => x.id)) + 1;
  S.lost.push({ id, type: lfType, title, route: $('lfRoute').value, date: $('lfDate').value || dateKey(new Date()),
    where: $('lfWhere').value.trim(), desc: $('lfDesc').value.trim(), contact: $('lfContact').value.trim(), status: 'open', photo, author: S.session });
  let msg = '분실물을 등록했어요';
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { S.lost[S.lost.length - 1].photo = ''; save(); msg = '사진 용량이 커서 사진 없이 등록했어요'; }
  closeLostForm();
  lostMode = '전체'; renderLost(); toast(msg);
};
// ---------- 홈 검색 ----------
$('qText').oninput = e => { q.text = e.target.value; showAllRuns = false; renderHome(); };
$('qReset').onclick = () => { q = { text: '', mode: 'now', hour: null }; route = '전체'; showPast = false; showAllRuns = false; $('qText').value = ''; renderHome(); };

// ---------- 로그인 / 회원가입 ----------
function login(id) {
  S.session = id; save();
  dir = '등교'; route = '전체'; showPast = false; showAllRuns = false; showChart = false;
  openCmts.clear(); for (const k in cmtDraft) delete cmtDraft[k];
  adminTab = 'run'; showAdminTab();
  goTab(isAdmin() ? 'admin' : 'home');
  render(); toast(`${userName(id)}님, 환영해요!`);
}
$('liBtn').onclick = () => {
  const id = $('liId').value.trim(), pw = $('liPw').value;
  const u = S.users.find(x => x.id === id);
  if (!u || u.pw !== hashPw(id, pw)) { toast('아이디 또는 비밀번호가 맞지 않아요'); return; }
  $('liPw').value = ''; login(id);
};
$('liPw').onkeydown = e => { if (e.key === 'Enter') $('liBtn').click(); };
$('suBtn').onclick = () => {
  const id = $('suId').value.trim(), name = $('suName').value.trim(), pw = $('suPw').value;
  if (!/^[A-Za-z0-9_]{4,20}$/.test(id)) { toast('아이디는 영문·숫자 4~20자로 입력해 주세요'); return; }
  if (!name) { toast('이름을 입력해 주세요'); return; }
  if (pw.length < 4) { toast('비밀번호는 4자 이상이에요'); return; }
  if (pw !== $('suPw2').value) { toast('비밀번호 확인이 달라요'); return; }
  if (S.users.some(x => x.id === id)) { toast('이미 사용 중인 아이디예요'); return; }
  S.users.push({ id, name, role: 'student', pw: hashPw(id, pw) });
  ['suId', 'suName', 'suPw', 'suPw2'].forEach(k => $(k).value = '');
  login(id);
};

$('demoReset').onclick = adminOnly(() => {
  if (!confirm('시간표와 오늘 기록을 처음 상태로 되돌릴까요?')) return;
  S = { ...fresh(), users: S.users, session: S.session }; save(); render(); toast('초기화했어요 (계정은 유지)');
});

if (/\.netlify\.app$/.test(location.hostname)) document.body.classList.add('nl-badge');
showAdminTab();
render();
setInterval(render, 30000);
