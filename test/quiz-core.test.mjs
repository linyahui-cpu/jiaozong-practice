import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeAnswer, normalizeQuestion, normalizeQuestions } from '../src/quiz-core.mjs';

test('grades single choice exactly', () => {
  assert.equal(gradeAnswer({ type: 'single', answer: ['B'] }, ['B']).correct, true);
  assert.equal(gradeAnswer({ type: 'single', answer: ['B'] }, ['A']).correct, false);
});

test('grades multiple choice as an exact set', () => {
  assert.equal(gradeAnswer({ type: 'multiple', answer: ['A', 'C'] }, ['C', 'A']).correct, true);
  assert.equal(gradeAnswer({ type: 'multiple', answer: ['A', 'C'] }, ['A']).correct, false);
});

test('normalizes Shenzhen question fields', () => {
  const q = normalizeQuestion({ exam: '2025年-小学', number: 3, text: '题干', options: ['A.甲', 'B.乙'], answer: 'B', explanation: '解析' });
  assert.deepEqual(q.answer, ['B']);
  assert.equal(q.source.exam, '2025年-小学');
  assert.equal(q.options[1].text, '乙');
});

test('normalizes wrapped question arrays and preserves missing answers', () => {
  const questions = normalizeQuestions({ questions: [{ text: '待核对题', options: { A: '甲' } }] }, { province: '广东' });
  assert.equal(questions.length, 1);
  assert.deepEqual(questions[0].answer, []);
  assert.equal(questions[0].province, '广东');
});
