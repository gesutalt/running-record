// GitHub Pages에서 import 없이 바로 사용하도록 수정한 완전 최종 버전
const supabaseUrl = 'https://evgwiqaeqopdfinisfjv.supabase.co';
const supabaseKey = 'sb_publishable_paPUcosPDeuaxpTnp70DQg_57wuxTWp'; // 필요하면 여기 다시 긴 키 붙여넣기

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
const app = document.getElementById('app');
let user = null;
let userPw = '';

function render() {
  if (!user) {
    app.innerHTML = `<h1>달리기 기록장</h1>
      닉네임 <input id="nick" placeholder="한글 OK"><br><br>
      비밀번호 <input id="pw" type="password"><br><br>
      <button onclick="login()" style="padding:10px 20px; background:#10b981; color:white; border:none; font-size:16px">입장</button>`;
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

  let html = `<h1>${user} 기록장 <small><button onclick="user=null;render()">로그아웃</button></small></h1><hr>`;
  html += `<select id="dist"><option>풀</option><option>하프</option><option>10K</option></select>
    <input id="time" placeholder="3:45:21" required>
    <input id="date" type="date">
    <input id="comp" placeholder="대회명">
    <button onclick="addRecord()">등록</button><br><br>`;

  html += `<ul style="list-style:none;padding:0">`;
  data.forEach(r => html += `<li style="padding:8px 0;border-bottom:1px solid #eee"><b>${r.distance}</b> ${r.record_time} | ${r.race_date} | ${r.competition||'-'}</li>`);
  html += `</ul>`;
  if (data.length) html += `<canvas id="chart" height="300"></canvas>`;

  app.innerHTML = html;

  if (data.length) {
    new Chart(document.getElementById('chart'), {
      type: 'line',
      data: {
        labels: data.map(r => r.race_date || '미정'),
        datasets: [{
          label: '기록 (분)',
          data: data.map(r => {
            if (!r.record_time) return null;
            const [h,m,s] = r.record_time.split(':').map(Number);
            return h*60 + m + s/60;
          }),
          borderColor: '#10b981',
          tension: 0.3
        }]
      }
    });
  }
}

window.addRecord = async () => {
  const dist = document.getElementById('dist').498value;
  const time = document.getElementById('time').value;
  const date = document.getElementById('date').value || new Date().toISOString().slice(0,10);
  const comp = document.getElementById('comp').value;

  await supabase.from('records').insert({ nickname: user, password: userPw, distance: dist, record_time: time, race_date: date, competition: comp });
  loadRecords();
};

render();
