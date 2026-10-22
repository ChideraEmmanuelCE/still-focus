import {dayKey,remaining,formatTime,freshTimer,restore} from './core.mjs';
const $ = selector => document.querySelector(selector);
const key = 'still-workspace-v1';
let storageWorks = true;
let state;
try { state = restore(JSON.parse(localStorage.getItem(key))); } catch { state = restore(null); }
let soundContext = null;
let toastTimeout;
function toast(message) { $('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('visible'),3800); }
function save() { try {localStorage.setItem(key,JSON.stringify(state));} catch {storageWorks=false;$('.saved').textContent='Changes only saved for this visit';} }
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const selected = () => state.tasks.find(t => t.id === state.selectedTask && !t.done);
function renderTimer() {
  const seconds=remaining(state.timer),running=!!state.timer.endsAt;
  $('#time').textContent=formatTime(seconds);
  $('.timer').setAttribute('aria-label',`${Math.floor(seconds/60)} minutes ${seconds%60} seconds remaining`);
  document.title=running ? `${formatTime(seconds)} · Still` : 'Still · Make room for focus';
  $('#start span').textContent=running ? 'Pause session' : seconds < state.timer.duration ? 'Keep going' : state.timer.mode==='focus' ? 'Start focusing' : 'Start your break';
  $('#start use').setAttribute('href',running?'#i-pause':'#i-play');
  $('#timer-caption').textContent=state.timer.mode==='focus' ? running?'ONE THING. YOUR FULL ATTENTION.':'TIME TO MAKE SOMETHING GOOD' : 'A LITTLE REST GOES A LONG WAY';
  $('#current-task').textContent=state.timer.mode==='focus' ? (state.timer.label || selected()?.title || 'Your next small step starts here.') : 'Unclench your jaw. Let your shoulders drop.';
  $('#progress').style.width=`${100*(1-seconds/state.timer.duration)}%`;
  document.querySelectorAll('[data-mode]').forEach(b=>{const chosen=b.dataset.mode===state.timer.mode;b.classList.toggle('selected',chosen);b.setAttribute('aria-pressed',chosen);});
}
function renderStats() {
  const today=dayKey();
  const sessions=state.history.filter(h=>dayKey(new Date(h.completedAt))===today);
  $('#minutes-today').textContent=sessions.reduce((n,h)=>n+h.minutes,0);
  $('#session-label').textContent=`SESSION ${String(sessions.length+1).padStart(2,'0')}`;
  const dots=sessions.length ? (sessions.length%4||4) : 0;
  document.querySelectorAll('#session-dots i').forEach((el,i)=>el.classList.toggle('done',i<dots));
  $('#session-dots').setAttribute('aria-label',`${sessions.length} focus sessions completed today`);
  $('#cycle-message').textContent=sessions.length ? `${sessions.length} session${sessions.length===1?'':'s'}. Look at you go.` : 'Small steps. Real progress.';
  $('#date-label').textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date()).toUpperCase();
}
function renderTasks() {
  const list=$('#task-list');list.replaceChildren();
  const done=state.tasks.filter(t=>t.done).length;
  $('#task-count').textContent=`${done}/${state.tasks.length}`;
  $('#empty-tasks').hidden=state.tasks.length>0;
  $('#clear-done').hidden=done===0;
  $('#task-footer').textContent=state.tasks.length ? 'Tap a task to make it your focus.' : 'Room for what matters.';
  for(const task of state.tasks) {
    const row=document.createElement('div');row.className=`task-row${task.done?' done':''}${task.id===state.selectedTask?' chosen':''}`;
    const check=document.createElement('button');check.className='task-check';check.setAttribute('aria-label',`${task.done?'Reopen':'Complete'} ${task.title}`);check.setAttribute('aria-pressed',task.done);check.innerHTML='<svg><use href="#i-check"/></svg>';
    check.onclick=()=>{task.done=!task.done;if(task.done&&state.selectedTask===task.id)state.selectedTask=null;save();renderTasks();renderTimer();};
    const name=document.createElement('button');name.className='task-name';name.textContent=task.title;name.setAttribute('aria-label',`Focus on ${task.title}`);name.onclick=()=>{if(task.done)return;state.selectedTask=task.id;if(state.timer.remaining===state.timer.duration&&!state.timer.endsAt)state.timer.label='';save();renderTasks();renderTimer();toast('Your next focus is set.');};
    const remove=document.createElement('button');remove.className='task-delete';remove.setAttribute('aria-label',`Delete ${task.title}`);remove.innerHTML='<svg><use href="#i-close"/></svg>';remove.onclick=()=>{state.tasks=state.tasks.filter(t=>t.id!==task.id);if(state.selectedTask===task.id)state.selectedTask=null;save();renderTasks();renderTimer();};
    row.append(check,name,remove);list.append(row);
  }
}
function finishTimer() {
  const timer=state.timer;
  if(timer.mode==='focus') {
    // Use the scheduled finish time so sessions completed overnight belong to the right day.
    state.history.push({id:uid(),title:timer.label||'A little focused time',minutes:timer.duration/60,completedAt:timer.endsAt||Date.now()});
    state.history=state.history.slice(-1000);
    const todaySessions=state.history.filter(h=>dayKey(new Date(h.completedAt))===dayKey()).length;
    state.timer=freshTimer(todaySessions%4===0?'long':'short',state.focusMinutes);
    toast('A little progress, made. Time for a break.');
  } else {state.timer=freshTimer('focus',state.focusMinutes);toast('Feeling refreshed? Your next session is ready.');}
  save();renderStats();renderTimer();
}
function tick() {if(state.timer.endsAt&&remaining(state.timer)===0)finishTimer();renderTimer();renderStats();}
function toggleTimer() {
  if(state.timer.endsAt) {state.timer.remaining=remaining(state.timer);state.timer.endsAt=null;if(!state.timer.remaining){finishTimer();return;}}
  else {if(!state.timer.label)state.timer.label=selected()?.title||'';state.timer.endsAt=Date.now()+state.timer.remaining*1000;}
  save();renderTimer();
}
$('#start').onclick=toggleTimer;
$('#reset').onclick=()=>{state.timer=freshTimer(state.timer.mode,state.focusMinutes);save();renderTimer();toast('A fresh start. Take your time.');};
document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{if(state.timer.mode===button.dataset.mode)return;state.timer=freshTimer(button.dataset.mode,state.focusMinutes);save();renderTimer();});
$('#task-form').onsubmit=event=>{event.preventDefault();const title=$('#task-input').value.trim();if(!title)return;if(state.tasks.length>=100){toast('Make a little room. Clear a few tasks first.');return;}const task={id:uid(),title,done:false};state.tasks.push(task);if(!selected())state.selectedTask=task.id;$('#task-input').value='';save();renderTasks();renderTimer();};
$('#clear-done').onclick=()=>{state.tasks=state.tasks.filter(t=>!t.done);save();renderTasks();};
function renderTheme(){document.body.classList.toggle('dark',state.theme==='dark');$('#theme').setAttribute('aria-label',`Switch to ${state.theme==='dark'?'light':'dark'} theme`);$('meta[name="theme-color"]').content=state.theme==='dark'?'#1c241e':'#f5f3ed';}
$('#theme').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';save();renderTheme();};
$('#sound').onclick=async()=>{
  if(soundContext){await soundContext.close();soundContext=null;$('#sound').setAttribute('aria-pressed','false');$('#sound span').textContent='Rain off';return;}
  try {const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio unavailable');soundContext=new Audio();await soundContext.resume();const buffer=soundContext.createBuffer(1,soundContext.sampleRate*4,soundContext.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+.02*(Math.random()*2-1))/1.02;data[i]=last*3.5;}const source=soundContext.createBufferSource();source.buffer=buffer;source.loop=true;const filter=soundContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2200;const gain=soundContext.createGain();gain.gain.value=.28;source.connect(filter).connect(gain).connect(soundContext.destination);source.start();$('#sound').setAttribute('aria-pressed','true');$('#sound span').textContent='Rain on';}
  catch {if(soundContext)await soundContext.close().catch(()=>{});soundContext=null;toast('Rain sounds aren’t available in this browser.');}
};
const reminders=['Progress is a practice,<br>not a perfect day.','One small step is<br>still a step forward.','Let your attention<br>be your superpower.','Make a little room<br>for what matters.','Rest is part<br>of the work.'];let reminder=0;
$('#reminder-next').onclick=()=>{$('.insight-card p').innerHTML=reminders[++reminder%reminders.length];};
function renderHistory(){const list=$('#history-list');list.replaceChildren();if(!state.history.length){const p=document.createElement('p');p.textContent='Your first session is a fresh beginning. Finish a focus timer to see it here.';p.className='dialog-subtitle';list.append(p);}for(const session of [...state.history].reverse()){const row=document.createElement('div');row.className='history-row';const details=document.createElement('div'),title=document.createElement('strong'),time=document.createElement('span'),minutes=document.createElement('b');title.textContent=session.title;time.textContent=new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(session.completedAt));minutes.textContent=`${session.minutes} min`;details.append(title,time);row.append(details,minutes);list.append(row);}$('#export').hidden=!state.history.length;}
$('#history-open').onclick=()=>{renderHistory();$('#history-dialog').showModal();};
$('#focus-nav').onclick=()=>{$('#start').focus();};
$('#duration-open').onclick=()=>{$('#duration').value=state.focusMinutes;$('#duration-dialog').showModal();};
$('#duration-form').onsubmit=event=>{event.preventDefault();const minutes=Number($('#duration').value);if(!Number.isInteger(minutes)||minutes<1||minutes>120)return;state.focusMinutes=minutes;state.timer=freshTimer('focus',minutes);save();renderTimer();$('#duration-dialog').close();toast(`Your rhythm: ${minutes} minutes of focus.`);};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',event=>{if(event.target===d){const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)d.close();}}));
$('#export').onclick=()=>{const file=new Blob([JSON.stringify({app:'Still',exportedAt:new Date().toISOString(),sessions:state.history},null,2)],{type:'application/json'}),url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=`still-sessions-${dayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
document.addEventListener('keydown',event=>{if(event.code!=='Space'||event.repeat||event.ctrlKey||event.altKey||event.metaKey||event.target.closest('input,textarea,select,button,a,[contenteditable]')||document.querySelector('dialog[open]'))return;event.preventDefault();toggleTimer();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
// A second tab adopts the latest saved state instead of duplicating a completed session.
window.addEventListener('storage',event=>{if(event.key===key){try{state=restore(JSON.parse(event.newValue));renderTasks();renderTheme();tick();}catch{}}});
renderTheme();renderTasks();tick();setInterval(tick,500);
if(!storageWorks)toast('This browser can’t save changes. Keep this tab open.');
