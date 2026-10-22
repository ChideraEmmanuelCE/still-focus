import {test} from 'node:test';
import assert from 'node:assert/strict';
import {remaining,formatTime,freshTimer,restore,dayKey} from '../core.mjs';
test('timer uses a deadline rather than interval counts, including background tabs',()=>{const t={...freshTimer(),endsAt:100000};assert.equal(remaining(t,60001),40);assert.equal(remaining(t,110000),0);});
test('paused timers preserve remaining seconds',()=>assert.equal(remaining({...freshTimer(),remaining:127},99999),127));
test('all durations and formatting',()=>{assert.equal(freshTimer('focus',45).duration,2700);assert.equal(freshTimer('short').duration,300);assert.equal(freshTimer('long').duration,900);assert.equal(formatTime(65),'01:05');assert.equal(formatTime(7200),'120:00');});
test('restore validates broken saved data and retains safe text',()=>{const s=restore({focusMinutes:-50,tasks:[null,{id:'a',title:'<b>Task</b>'}],history:[null,{id:'bad',title:'bad',minutes:-1}],timer:{mode:'invalid'}});assert.equal(s.focusMinutes,25);assert.equal(s.tasks[0].title,'<b>Task</b>');assert.equal(s.history.length,0);assert.equal(s.timer.duration,1500);});
test('restores active overdue session to allow completing once after reload',()=>{const timer={...freshTimer(),endsAt:Date.now()-10000};assert.equal(restore({timer}).timer.endsAt,timer.endsAt);});
test('daily totals use local calendar dates',()=>assert.equal(dayKey(new Date(2026,0,2,23,59)),'2026-01-02'));
