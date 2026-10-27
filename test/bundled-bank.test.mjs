import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,addBank,recordAttempt} from '../src/storage.mjs';
import {installBundledBank} from '../src/bundled-bank.mjs';
import {inspectQuestions} from '../src/quiz-core.mjs';
const bank=()=>JSON.parse(readFileSync(new URL('../data/shenzhen-bank.json',import.meta.url),'utf8'));
test('ships all 3727 Shenzhen questions with source and no demo label',()=>{
 const b=bank();assert.equal(b.questions.length,3727);assert.equal(b.province,'广东');
 assert.equal(b.city,'深圳');assert.ok(b.source.includes('github.com/dsplk/teacher-quiz-app'));
 assert.ok(b.questions.every(q=>!q.demo));assert.equal(inspectQuestions(b.questions).invalid,845);
});
test('adds real question bank to an existing installation without losing study records',()=>{
 let state=addBank(createState(),{id:'demo',name:'示例',questions:[{id:'q1',question:'示例',options:{A:'甲',B:'乙'},answer:'A'}]});
 state=recordAttempt(state,'demo','q1',{correct:false,answerable:true,actual:['B']},'one');
 state.favorites=['demo/q1'];
 const installed=installBundledBank(state,bank(),'v1');
 assert.equal(installed.banks.find(b=>b.city==='深圳').questions.length,3727);
 assert.deepEqual(installed.records,state.records);assert.deepEqual(installed.favorites,state.favorites);
 const twice=installBundledBank(installed,bank(),'v1');assert.deepEqual(twice,installed);
});
test('does not re-add a bundled bank after the user explicitly deletes it',()=>{
 const state=installBundledBank(createState(),bank(),'v1');state.banks=[];
 assert.equal(installBundledBank(state,bank(),'v1').banks.length,0);
});
