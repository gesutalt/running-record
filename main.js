// Supabase 클라이언트 직접 CDN으로 불러옴 (import 없이)
const { createClient } = supabase;  // 전역 supabase 객체 사용 (CDN에서 자동 로드됨)

const supabaseUrl = 'https://evgwiqaeqopdfinisfjv.supabase.co';
const supabaseKey = 'sb_publishable_paPUcosPDeuaxpTnp70DQg_57wuxTWp';  // 너 anon key (전체 키 확인해 – 짧으면 Supabase에서 다시 복사)

const supabase = createClient(supabaseUrl, supabaseKey);
const app = document.getElementById('app');
let user = null;

function render() {
  if (!user) {
    app.innerHTML = `
      <h1>🏃 달리기 기록장</h1>
      <p>닉네임 (한글 OK): <input id="nick" placeholder="예: 러너킴" style="width:200px;"></p>
      <p>비밀번호 (1자 이상): <input id="pw" type="password" placeholder="비밀" style="width:200px;"></p>
      <button onclick="login()" style="background:#10b981;color:white;padding:10px;border:none;">입장 / 가입</button>
    `;
  } else {
    loadRecords();
  }
}

async function login() {
  const nickname = document.getElementById('nick').value.trim();
  const password = document.getElementById('pw').value;
  if (!nickname || !password) return alert('닉네임과 비밀번호를 입력해줘!');
  try {
    let { data, error } = await supabase.from('records').select('*').eq('nickname', nickname).eq('password', password);
    if (error) throw error;
    if (data && data.length > 0) {
      user = nickname;
      render();
    } else {
      const { error: insertError } = await supabase.from('records').insert({ nickname, password });
      if (insertError) alert('회원가입 에러: ' + insertError.message);
      else {
        user = nickname;
        render();
      }
    }
  } catch (e) {
    alert('로그인 에러: ' + e.message + '\n(테이블 생성됐는지 Supabase 확인해봐!)');
  }
}

async function loadRecords() {
  try {
    let { data, error } = await supabase.from('records').select('*').eq('nickname', user).order('created_at', { ascending: true });
    if (error) throw error;
    let html = `<h1>${user} 님의 기록장 <button onclick="user=null;render()" style="float:right;background:red;color:white;padding:5px;border:none;">로그아웃</button></h1><hr>`;

    html += `
      <form onsubmit="add(event)">
        거리: <select id="dist" style="width:80px;">
          <option value="풀">풀</option>
          <option value="하프">하프</option>
          <option value="10K">10K</option>
        </select>
        기록: <input id="time" placeholder="3:45:21" required style="width:100px;">
        날짜: <input id="date" type="date" style="width:120px;">
        대회: <input id="comp" placeholder="서울마라톤" style="width:150px;">
        <button type="submit" style="background:#10b981;color:white;border:none;">등록</button>
      </form>
      <hr><h2>기록 목록</h2><ul>
    `;
    if (data && data.length > 0) {
      data.forEach(r => {
        html += `<li><b>${r.distance}</b> | ${r.record_time || '-'} | ${r.race_date || '-'} | ${r.competition || '개인 훈련'}</li>`;
      });
      html += `</ul><h2>추이 그래프</h2><canvas id="chart" width="800" height="400"></canvas>`;
    } else {
      html += `<li>아직 기록 없음. 첫 기록 등록해 보세요!</li></ul>`;
    }
    app.innerHTML = html;

    if (data && data.length > 0) {
      const ctx = document.getElementById('chart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(r => r.race_date || r.created_at.slice(0,10)),
          datasets: [{
            label: '기록 (분 단위)',
            data: data.map(r => {
              if (!r.record_time) return null;
              const [h = 0, m = 0, s = 0] = r.record_time.split(':').map(Number);
              return h * 60 + m + s / 60;
            }),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            tension: 0.4
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }
  } catch (e) {
    app.innerHTML += `<p style="color:red;">기록 로드 에러: ${e.message}</p>`;
  }
}

async function add(e) {
  e.preventDefault();
  const dist = document.getElementById('dist').value;
  const time = document.getElementById('time').value;
  const date = document.getElementById('date').value || new Date().toISOString().slice(0,10);
  const comp = document.getElementById('comp').value;
  const pw = document.getElementById('pw').value || '';  // 이전 로그인 비번
  try {
    const { error } = await supabase.from('records').insert({ 
      nickname: user, password: pw, distance: dist, record_time: time, race_date: date, competition: comp 
    });
    if (error) throw error;
    loadRecords();
  } catch (e) {
    alert('등록 에러: ' + e.message);
  }
}

// 초기 로드
render();
