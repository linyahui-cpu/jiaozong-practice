import { gradeAnswer, summarizeResults } from './quiz-core.mjs';
import { recordAttempt } from './storage.mjs';

export function startSession(items, {mode='practice',minutes=30,now=Date.now()}={}) {
  const snapshots=items.map(({bankId,bankName,question})=>({bankId,bankName:bankName||'',question:structuredClone(question)}));
  return { id:`session-${now}-${Math.random().toString(36).slice(2,8)}`, mode, items:snapshots, index:0, answers:{}, results:{}, finished:false, startedAt:now, deadline:mode==='exam'?now+minutes*60000:null, summary:null };
}

export function submitCurrent(state) {
  const next=structuredClone(state), session=next.session;
  if (!session || session.finished || session.mode==='exam' || session.results[session.index]) return next;
  const index=session.index, {bankId,question}=session.items[index];
  const result=gradeAnswer(question,session.answers[index]??[]);
  session.results[index]=result;
  return recordAttempt(next,bankId,question.id,result,`${session.id}/${index}`);
}

export function finishSession(state) {
  let next=structuredClone(state);
  if (!next.session || next.session.finished) return next;
  if (next.session.mode==='exam') {
    for (let index=0; index<next.session.items.length; index++) {
      const {bankId,question}=next.session.items[index];
      const result=gradeAnswer(question,next.session.answers[index]??[]);
      next.session.results[index]=result;
      next=recordAttempt(next,bankId,question.id,result,`${next.session.id}/${index}`);
    }
  }
  next.session.finished=true;
  next.session.summary=summarizeResults(Object.values(next.session.results));
  next.session.completedAt=Date.now();
  next.histories=[{id:next.session.id,mode:next.session.mode,at:next.session.completedAt,...next.session.summary},...(next.histories??[])].slice(0,50);
  return next;
}
