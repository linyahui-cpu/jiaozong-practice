import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBank,gradeAnswer,normalizeAnswer} from '../src/quiz-core.mjs';
import {browserAdapter} from '../src/storage.mjs';
test('generated question IDs retain same numbered prompt from different years',()=>{
 const bank=parseBank({questions:[{question:'同一道题',number:1,year:'2024',options:{A:'甲',B:'乙'},answer:'A'},{question:'同一道题',number:1,year:'2025',options:{A:'甲',B:'乙'},answer:'B'}]});
 assert.equal(bank.questions.length,2);
});
test('generated bank IDs separate same names in different years',()=>{
 const q={question:'题干',options:{A:'甲',B:'乙'},answer:'A'};
 assert.notEqual(parseBank({name:'历年教综',year:'2024',questions:[q]}).id,parseBank({name:'历年教综',year:'2025',questions:[q]}).id);
});
test('TXT preserves multiline stem, options and explanations',()=>{
 const bank=parseBank('一、单选题\n1. 第一行题干\n第二行题干\nA. 甲选项\n甲选项续行\nB. 乙选项\n答案：A\n解析：第一段解析\n第二段解析');
 assert.equal(bank.questions[0].question,'第一行题干\n第二行题干');
 assert.equal(bank.questions[0].options[0].text,'甲选项 甲选项续行');
 assert.equal(bank.questions[0].explanation,'第一段解析\n第二段解析');
});
test('malformed reference answer is not guessed from English letters',()=>{
 assert.deepEqual(normalizeAnswer('待核验 Pending','single'),[]);
 assert.equal(gradeAnswer({type:'single',options:[],answer:['A']},['A']).answerable,false);
});
test('corrupted local JSON is reported rather than overwritten as a new installation',()=>{
 globalThis.localStorage={getItem(){return 'broken json';}};
 assert.throws(()=>browserAdapter().load(),/本地数据/);
 delete globalThis.localStorage;
});
test('JSON without explicit type infers multiple choice from answer arrays',()=>{
 const bank=parseBank({questions:[{question:'多选题',options:{A:'甲',B:'乙',C:'丙'},answer:['A','C']}]});
 assert.equal(bank.questions[0].type,'multiple');
 assert.equal(gradeAnswer(bank.questions[0],['A','C']).correct,true);
});
test('normalizing exported questions retains original source numbers',()=>{
 const bank=parseBank({questions:[{id:'stable-id',question:'题干',type:'single',options:{A:'甲',B:'乙'},answer:'A',source:{number:42,exam:'2025年-小学'}}]});
 assert.equal(bank.questions[0].source.number,42);
});
