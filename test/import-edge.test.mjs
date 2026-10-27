import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBank,gradeAnswer,inspectQuestions} from '../src/quiz-core.mjs';

test('empty form year and grade do not hide exam metadata',()=>{
 const bank=parseBank(JSON.stringify({questions:[{text:'题干',exam:'2025年7月5日-小学',options:['A.甲','B.乙'],answer:'B'}]}),{name:'深圳',province:'广东',city:'深圳',year:'',grade:''});
 assert.equal(bank.questions[0].year,'2025');
 assert.equal(bank.questions[0].grade,'小学');
});
test('supports Shiroha judgment aliases and preserves original paragraphs',()=>{
 const bank=parseBank({questions:[{type:'judge',question:'判断题',answer:['正确'],analysis:'第一段\n第二段'}]},{name:'高级工具'});
 assert.equal(bank.questions[0].type,'boolean');
 assert.equal(bank.questions[0].explanation,'第一段\n第二段');
});
test('does not silently interpret malformed JSON as question text',()=>{
 assert.throws(()=>parseBank('{"questions":['),/JSON/);
});
test('subjective and invalid judgment answers are not auto scored',()=>{
 assert.equal(gradeAnswer({type:'short',answer:['教育']},['教育']).answerable,false);
 assert.equal(gradeAnswer({type:'boolean',answer:['未知答案']},['未知答案']).answerable,false);
});
test('single choice with multiple reference answers is flagged',()=>{
 const bank=parseBank({questions:[{question:'题干',type:'single',options:{A:'甲',B:'乙'},answer:'AB'}]});
 assert.equal(inspectQuestions(bank.questions).invalid,1);
 assert.equal(gradeAnswer(bank.questions[0],['A','B']).answerable,false);
});
