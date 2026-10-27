import { normalizeQuestion, normalizeQuestions, stableId } from './quiz-core.mjs';

export const SCHEMA = 1;

export function createState() {
  return { schema: SCHEMA, banks: [], records: {}, favorites: [], mastered: [], session: null };
}

function validQuestion(q){
  return Boolean(q&&typeof q.id==='string'&&q.id&&typeof q.question==='string'&&q.question.trim()&&['single','multiple','boolean','fill','short'].includes(q.type)&&Array.isArray(q.options)&&q.options.every(o=>o&&typeof o.key==='string'&&typeof o.text==='string')&&Array.isArray(q.answer)&&q.answer.every(a=>typeof a==='string'));
}

function validResult(result){return Boolean(result&&typeof result.correct==='boolean'&&typeof result.answerable==='boolean'&&Array.isArray(result.expected)&&result.expected.every(a=>typeof a==='string')&&Array.isArray(result.actual)&&result.actual.every(a=>typeof a==='string'));}

export function validateState(state) {
  if (!state || state.schema !== SCHEMA || !Array.isArray(state.banks) || !state.records || !Array.isArray(state.favorites) || !Array.isArray(state.mastered)) throw new Error('备份格式无效');
  for (const bank of state.banks) {
    if (!bank?.id || !Array.isArray(bank.questions)) throw new Error('备份中的题库格式无效');
    if(bank.questions.some(q=>!validQuestion(q)))throw new Error('备份中的题库内容无效');
  }
  if(typeof state.records!=='object'||Array.isArray(state.records)||Object.values(state.records).some(r=>!r||!Number.isFinite(r.attempts)||!Number.isFinite(r.wrongCount)||!Number.isFinite(r.correctCount)||!Array.isArray(r.submissionIds)))throw new Error('备份中的学习记录无效');
  if(state.session){
    const s=state.session;
    if(!Array.isArray(s.items)||!Number.isInteger(s.index)||!s.answers||!s.results||s.items.some(i=>!i?.bankId||!validQuestion(i.question))||s.index<0||(s.items.length>0&&s.index>=s.items.length)||Object.values(s.answers).some(a=>!Array.isArray(a)||a.some(key=>typeof key!=='string'))||Object.values(s.results).some(r=>!validResult(r))||(s.mode==='exam'&&!Number.isFinite(s.deadline))||(s.finished&&(!s.summary||!Number.isFinite(s.summary.accuracy))))throw new Error('备份中的答题进度无效');
  }
  return state;
}

export function addBank(state, bank) {
  const next = validateState(structuredClone(state));
  const normalized = { ...bank, id: String(bank.id ?? stableId(bank.name)), questions: normalizeQuestions(bank.questions ?? [], bank) };
  const index = next.banks.findIndex(item => item.id === normalized.id);
  if (index >= 0) {
    const merged=new Map(next.banks[index].questions.map(q=>[q.id,q]));
    for(const q of normalized.questions)merged.set(q.id,q);
    next.banks[index] = { ...next.banks[index], ...normalized, questions:[...merged.values()] };
  }
  else next.banks.push(normalized);
  return next;
}

export function recordAttempt(state, bankId, questionId, grade, submissionId = `${Date.now()}-${Math.random()}`) {
  const next = validateState(structuredClone(state));
  if (!grade?.answerable) return next;
  const key = `${bankId}/${questionId}`;
  const previous = next.records[key] ?? { attempts: 0, correctCount: 0, wrongCount: 0, lastAnswer: [], submissionIds: [] };
  if (previous.submissionIds.includes(submissionId)) return next;
  const record = { ...previous, attempts: previous.attempts + 1, correctCount: previous.correctCount + (grade.correct ? 1 : 0), wrongCount: previous.wrongCount + (grade.correct ? 0 : 1), lastAnswer: grade.actual ?? [], submissionIds: [...previous.submissionIds, submissionId].slice(-30), updatedAt: new Date().toISOString() };
  next.records[key] = record;
  return next;
}

export function toggleListValue(state, listName, value) {
  const next = validateState(structuredClone(state));
  const list = next[listName];
  next[listName] = list.includes(value) ? list.filter(item => item !== value) : [...list, value];
  return next;
}

export function exportBackup(state) {
  return JSON.stringify(validateState(state), null, 2);
}

export function importBackup(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('备份不是有效 JSON'); }
  return validateState(parsed);
}

export function browserAdapter(key = 'jiaozong-practice-state') {
  return {
    load() { try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { throw new Error('本地数据读取失败，请先导出原始数据，保留浏览器存储后再恢复备份。'); } },
    save(state) { localStorage.setItem(key, exportBackup(state)); },
  };
}
