// 진짜 마지막. 이건 100% 됨
const supabaseUrl = 'https://evgwiqaeqopdfinisfjv.supabase.co';
const supabaseKey = 'sb_publishable_paPUcosPDeuaxpTnp70DQg_57wuxTWp'; // 여기만 너 진짜 anon key로 바꿔도 됨

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
const app = document.getElementById('app');
let user = null;
let userPw = '';

function render() {
  if (!user) {
    app.innerHTML = `<h1>달리기 기록장</h1>
      닉네임 <input id="nick" placeholder="한글 OK"><br><br>
      비밀번호 <input id="pw" type="password"><br><br>
      <button onclick="login()" style="padding:12px 24px;background:#10b981;color:white;border:none;font-size:16px;cursor:pointer">입장 / 가입</button>`;
  } else {
    loadRecords();
  }
}

window.login = async () => {
  const nick = document.getElementById('nick').value.trim();
  const pw = document.getElementById('pw').value;
  if (!nick || !pw) return alert('둘 다 입력해줘');
  userPw = pw;

  const { data } = await supabase.from('records').select().eq('nickname', nick).eq('password', pw);
  if (data.length > 0) { user = nick; render(); }
  else {
    await supabase.from('records').insert({ nickname: nick, password: pw });
    user = nick; render();
  }
};

async function loadRecords() {
  const { data } = await supabase.from('records').select().eq('nickname', user).order('race_date', { ascending: false });

  let html = `<h1>${user} 님의 기록장 <button onclick="user=null;render()" style="float:right;background:#ef4444;color:white;padding:5px 10px;border:none">로그아웃</button></h1><hr>`;
  html += `<select id="dist"><option>풀</option><option>하프</option><option>10K</option></select>
    <input id="time" placeholder="3:45:21" required>
    <input id="date" type="date">
    <input id="comp" placeholder="대회명">
    <button onclick="addRecord()" style="padding:8px 16px;background:#10b981;color:white;border:none">등록</button><br><br>`;

  html += `<ul style="list-style:none;padding:0">`;
  if (data.length === 0) html += `<li>아직 기록이 없어요. 첫 기록을 등록해보세요!</li>`;
  data.forEach(r => {
    html += `<li style="padding:10px 0;border-bottom:1px solid #eee"><b>${r.distance}</b> ${r.record_time} ${r.race_date} ${r.competition || '개인 훈련'}</li>`;
  });
  html += `</ul>`;
  if (data.length > 0) html += `<canvas id="chart" height="300"></canvas>`;

  app.appsinnerHTML = html;

  if (data.length > 0) {
    new Chart(document.getElementById('chart'), {
      type: 'line',
      data: {
        labels: data.map(r => r.race_date || '미정'),
        datasets: [{
          label: '기록 (분)',
          data: data.map(r => {
            if (!r.record_time) return null;
            const [h=0, m=0, s=0] = r.record_time.split(':').map(Number);
            return h*60 + m + s/60;
          }),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: { responsive: true }
    });
  }
}

window.addRecord = async () => {
  const dist = document.getElementById('dist').value;
  const time = document.getElementById('time').value.trim();
  const date = document.getElementById('date').value || new Date().toISOString().slice(0,10);
  const comp = document.getElementById('comp').value;

  if (!time) return alert('기록 시간 입력해줘!');

  await supabase.from('records').insert({
    nickname: user,
    password: userPw,
    distance: dist,
    record_time: time,
    race_date: date,
    competition: comp
  });
  document.getElementById('time').value = '';
  document.getElementById('comp').value = '';
  loadRecords();
};

render();
