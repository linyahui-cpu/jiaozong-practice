import test from 'node:test';
import assert from 'node:assert/strict';
import { startSession } from '../src/session.mjs';
import { createState, addBank, validateState } from '../src/storage.mjs';
import { parseBank } from '../src/quiz-core.mjs';
test('session snapshots do not duplicate the entire source bank for every question',()=>{
 const question={id:'q1',question:'题干',options:[{key:'A',text:'甲'},{key:'B',text:'乙'}],type:'single',answer:['A']};
 const bank={id:'bank',name:'大题库',questions:Array.from({length:300},(_,i)=>({...question,id:'q'+i,explanation:'解析'.repeat(100)}))};
 const session=startSession(bank.questions.slice(0,50).map(q=>({bankId:bank.id,bankName:bank.name,bank,question:q})));
 assert.equal('bank' in session.items[0],false);
 assert.ok(JSON.stringify(session).length<100000);
});
test('partial reimport merges questions instead of deleting previous ones',()=>{
 let s=createState();
 const q=id=>({id,question:'题干'+id,options:{A:'甲',B:'乙'},answer:'A'});
 s=addBank(s,{id:'b',questions:[q('1'),q('2')]});
 s=addBank(s,{id:'b',questions:[q('1')]});
 assert.equal(s.banks[0].questions.length,2);
});
test('bank export and reimport preserve namespace and metadata',()=>{
 const bank={id:'original-id',name:'原题库',province:'广东',city:'深圳',source:'原来源',questions:[{id:'q1',question:'题干',options:{A:'甲',B:'乙'},answer:'A'}]};
 const parsed=parseBank(JSON.stringify(bank),{name:'下载文件名',province:'江西',city:''});
 assert.equal(parsed.id,'original-id');
 assert.equal(parsed.province,'广东');
 assert.equal(parsed.questions[0].province,'广东');
});
test('invalid backup question records and session are rejected before replacing data',()=>{
 const state=createState();state.banks=[{id:'b',questions:[{id:'q'}]}];
 assert.throws(()=>validateState(state),/题库/);
 const broken=createState();broken.session={items:'broken'};
 assert.throws(()=>validateState(broken),/答题/);
});
test('backup rejects nested invalid options and incomplete session results',()=>{
 const question={id:'q',question:'题干',type:'single',options:[null],answer:['A']};
 const state=createState();state.banks=[{id:'b',questions:[question]}];
 assert.throws(()=>validateState(state),/题库/);
 const valid={...question,options:[{key:'A',text:'甲'},{key:'B',text:'乙'}]};
 const broken=createState();broken.banks=[{id:'b',questions:[valid]}];
 broken.session=startSession([{bankId:'b',question:valid}]);broken.session.results={0:{}};
 assert.throws(()=>validateState(broken),/答题/);
});
