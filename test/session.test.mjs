import test from 'node:test';
import assert from 'node:assert/strict';
import { startSession, submitCurrent, finishSession } from '../src/session.mjs';
import { createState } from '../src/storage.mjs';
const question={id:'q1',type:'single',question:'示例',options:[{key:'A',text:'甲'},{key:'B',text:'乙'}],answer:['B']};
test('practice records only once per submitted question',()=>{
 let state=createState();
 state.session=startSession([{bankId:'b',question}],{mode:'practice'});
 state.session.answers[0]=['A'];
 state=submitCurrent(state);
 state=submitCurrent(state);
 assert.equal(state.records['b/q1'].attempts,1);
 assert.equal(state.session.results[0].correct,false);
});
test('exam hides results until hand-in and counts unanswered as wrong',()=>{
 let state=createState();
 state.session=startSession([{bankId:'b',question}],{mode:'exam',minutes:1,now:1000});
 assert.equal(state.session.deadline,61000);
 assert.deepEqual(state.session.results,{});
 state=finishSession(state);
 assert.equal(state.session.summary.correct,0);
 assert.equal(state.session.summary.answerable,1);
 assert.equal(state.records['b/q1'].wrongCount,1);
 state=finishSession(state);
 assert.equal(state.records['b/q1'].attempts,1);
});
test('practice unanswered navigation is not counted on finishing',()=>{
 let state=createState();
 state.session=startSession([{bankId:'b',question}],{mode:'practice'});
 state=finishSession(state);
 assert.equal(state.session.summary.answerable,0);
 assert.equal(Object.keys(state.records).length,0);
});
