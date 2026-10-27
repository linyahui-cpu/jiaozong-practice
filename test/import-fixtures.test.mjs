import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBank, inspectQuestions, gradeAnswer } from '../src/quiz-core.mjs';

test('parses Shenzhen wrapper, judgment A/B, multiple choice and metadata', () => {
 const bank=parseBank(JSON.stringify({questions:[
  {exam:'2025年7月5日-小学',number:1,section:'三、是非题',text:'学生是发展中的人。',answer:'A'},
  {exam:'2024年6月2日-初中',number:2,section:'二、多选题',text:'选择两项',options:['A. 甲','B. 乙','C. 丙'],answer:'AC',explanation:'原解析'}
 ]}),{name:'深圳真题',province:'广东',city:'深圳'});
 assert.equal(bank.questions[0].type,'boolean');
 assert.deepEqual(bank.questions[0].answer,['正确']);
 assert.equal(bank.questions[0].year,'2025');
 assert.equal(bank.questions[1].grade,'初中');
 assert.deepEqual(bank.questions[1].answer,['A','C']);
 assert.equal(bank.questions[1].source.number,2);
 assert.equal(gradeAnswer(bank.questions[0],['正确']).correct,true);
});

test('parses standard TXT while preserving explanations and missing answer', () => {
 const bank=parseBank('一、单选题\n1. 示例题目\nA. 甲\nB. 乙\n答案：B\n解析：原文解析\n二、判断题\n2. 示例陈述\n答案：错误\n3. 待核对陈述\n答案：【待确认】',{name:'文本'});
 assert.equal(bank.questions.length,3);
 assert.deepEqual(bank.questions[0].answer,['B']);
 assert.equal(bank.questions[0].explanation,'原文解析');
 assert.deepEqual(bank.questions[1].answer,['错误']);
 assert.deepEqual(bank.questions[2].answer,[]);
});

test('flags absent answers, invalid options and rejected rows', () => {
 const bank=parseBank(JSON.stringify({questions:[{text:'待确认',options:['A.甲','B.乙']},{text:'错位',options:['A.甲','B.乙'],answer:'D'},{text:''}]}),{name:'异常'});
 const report=inspectQuestions(bank.questions);
 assert.equal(report.missing,1);
 assert.equal(report.invalid,1);
 assert.equal(bank.rejected,1);
});

test('stable import IDs survive imports while different exams stay distinct', () => {
 const data=JSON.stringify({questions:[{text:'相同题干',exam:'2024年-小学',number:1,options:['A.甲','B.乙'],answer:'A'},{text:'相同题干',exam:'2025年-小学',number:1,options:['A.甲','B.乙'],answer:'B'}]});
 const first=parseBank(data,{name:'题库',province:'广东'}),second=parseBank(data,{name:'题库',province:'广东'});
 assert.equal(first.id,second.id);
 assert.notEqual(first.questions[0].id,first.questions[1].id);
});

test('questions with invalid answer keys are never scored', () => {
 assert.equal(gradeAnswer({type:'single',options:[{key:'A',text:'甲'}],answer:['D']},['D']).answerable,false);
 assert.equal(gradeAnswer({type:'single',answer:[]},['A']).answerable,false);
});
