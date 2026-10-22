export const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const remaining = (timer, now = Date.now()) => timer.endsAt ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : timer.remaining;
export const formatTime = seconds => `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
export function freshTimer(mode = 'focus', minutes = 25) {
  const duration = (mode === 'short' ? 5 : mode === 'long' ? 15 : minutes) * 60;
  return { mode, duration, remaining: duration, endsAt: null, label: '' };
}
export function restore(value) {
  const blank = { tasks: [], history: [], focusMinutes: 25, selectedTask: null, theme: 'light', timer: freshTimer() };
  if (!value || typeof value !== 'object') return blank;
  blank.focusMinutes = Number.isInteger(value.focusMinutes) && value.focusMinutes >= 1 && value.focusMinutes <= 120 ? value.focusMinutes : 25;
  blank.theme = value.theme === 'dark' ? 'dark' : 'light';
  blank.tasks = Array.isArray(value.tasks) ? value.tasks.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string').map(t => ({id:t.id,title:t.title.slice(0,140),done:!!t.done})).slice(0,100) : [];
  blank.selectedTask = blank.tasks.some(t => t.id === value.selectedTask && !t.done) ? value.selectedTask : null;
  blank.history = Array.isArray(value.history) ? value.history.filter(h => h && typeof h.id === 'string' && typeof h.title === 'string' && Number.isFinite(h.minutes) && h.minutes > 0 && Number.isFinite(h.completedAt) && !Number.isNaN(new Date(h.completedAt).getTime())).slice(-1000) : [];
  const t = value.timer;
  if(t && ['focus','short','long'].includes(t.mode) && Number.isInteger(t.duration) && t.duration >=60 && t.duration <=7200 && Number.isInteger(t.remaining) && t.remaining >=0 && t.remaining <= t.duration && (t.endsAt === null || (Number.isFinite(t.endsAt) && t.endsAt > 0 && t.endsAt <= Date.now() + t.duration*1000 + 1000))) {
    blank.timer = {...t,label:typeof t.label === 'string' ? t.label.slice(0,140) : ''};
  } else blank.timer = freshTimer('focus',blank.focusMinutes);
  return blank;
}
