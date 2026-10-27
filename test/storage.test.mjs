import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, addBank, recordAttempt, exportBackup, importBackup, validateState } from '../src/storage.mjs';

test('repeat import preserves records and does not duplicate banks', () => {
  let state = createState();
  const bank = { id: 'bank-a', name: '测试题库', questions: [{id:'q1', question:'问题', type:'single', options:[{key:'A',text:'甲'},{key:'B',text:'乙'}], answer:['A']}] };
  state = addBank(state, bank);
  state = recordAttempt(state, 'bank-a', 'q1', {correct:false, answerable:true, actual:['B']}, 'attempt-1');
  state = addBank(state, bank);
  assert.equal(state.banks.length, 1);
  assert.equal(state.records['bank-a/q1'].wrongCount, 1);
});

test('deduplicates submissions and isolates records between banks', () => {
  let state = createState();
  const grade = {correct:false, answerable:true, actual:['B']};
  state = recordAttempt(state, 'a', 'q1', grade, 'same');
  state = recordAttempt(state, 'a', 'q1', grade, 'same');
  state = recordAttempt(state, 'b', 'q1', grade, 'other');
  assert.equal(state.records['a/q1'].attempts, 1);
  assert.equal(state.records['b/q1'].wrongCount, 1);
});

test('answering correctly retains wrong history and missing answers are not counted', () => {
  let state = createState();
  state = recordAttempt(state, 'a','q1',{correct:false,answerable:true,actual:['B']},'one');
  state = recordAttempt(state, 'a','q1',{correct:true,answerable:true,actual:['A']},'two');
  state = recordAttempt(state, 'a','q2',{correct:false,answerable:false,actual:[]},'three');
  assert.equal(state.records['a/q1'].wrongCount,1);
  assert.equal(state.records['a/q1'].attempts,2);
  assert.equal(state.records['a/q2'],undefined);
});

test('backup round trip preserves banks, records, favorites and active session', () => {
  const state = createState();
  state.favorites = ['a/q1'];
  state.session = {id:'s1',index:0,items:[],mode:'practice',answers:{},results:{}};
  assert.deepEqual(importBackup(exportBackup(state)),state);
});

test('rejects invalid backup without changing existing state', () => {
  assert.throws(()=>importBackup('{"banks":[]}'),/备份/);
  assert.throws(()=>validateState({schema:1,banks:[{id:'x',questions:'bad'}]}),/备份/);
});
