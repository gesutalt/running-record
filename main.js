import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://evgwiqaeqopdfinisfjv.supabase.co'
const supabaseKey = 'sb_publishable_paPUcosPDeuaxpTnp70DQg_57wuxTWp'  // 너가 준 키 넣음

const supabase = createClient(supabaseUrl, supabaseKey)
const app = document.getElementById('app')
let user = null

function render() {
  if (!user) {
    app.innerHTML = `<h1>달리기 기록장</h1>
      닉네임 <input id="nick"><br><br>
      비번 <input id="pw" type="password"><br><br>
      <button onclick="login()">입장</button>`
  } else loadRecords()
}

window.login = async () => {
  const nick = document.getElementById('nick').value.trim()
  const pw = document.getElementById('pw').value
  if (!nick || !pw) return alert('입력해줘')
  const { data } = await supabase.from('records').select().eq('nickname', nick).eq('password', pw)
  if (data.length > 0) { user = nick; render() }
  else { await supabase.from('records').insert({nickname:nick, password:pw}); user = nick; render() }
}

async function loadRecords() {
  const { data } = await supabase.from('records').select().eq('nickname', user).order('race_date')
  let html = `<h1>${user} 기록장 <button onclick="user=null;render()">로그아웃</button></h1><hr>`
  html += `<select id="d"><option>풀</option><option>하프</option><option>10K</option></select>
    <input id="t" placeholder="3:45:21">
    <input id="date" type="date">
    <input id="c" placeholder="대회명">
    <button onclick="add()">등록</button><br><br><ul>`
  data.forEach(r => html += `<li><b>${r.distance}</b> ${r.record_time} ${r.race_date} ${r.competition||''}</li>`)
  html += `</ul>`
  if (data.length) html += `<canvas id="chart"></canvas>`
  app.innerHTML = html

  if (data.length) new Chart(document.getElementById('chart'), {type:'line', data:{labels:data.map(r=>r.race_date||''), datasets:[{label:'기록(분)', data:data.map(r=>(r.record_time?.split(':').reduce((a,b,i)=>a*60+ +i,0)||0), borderColor:'#10b981'}]}}))
}

window.add = async () => {
  await supabase.from('records').insert({nickname:user, password:document.getElementById('pw').value, distance:document.getElementById('d').value, record_time:document.getElementById('t').value, race_date:document.getElementById('date').value, competition:document.getElementById('c').value})
  loadRecords()
}

render()