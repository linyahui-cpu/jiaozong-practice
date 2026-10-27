const VALID_TYPES = new Set(['single', 'multiple', 'boolean', 'fill', 'short']);

export function stableId(value) {
  const input = String(value ?? 'question');
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `q-${(hash >>> 0).toString(16)}`;
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}
function cleanMultiline(value) { return String(value ?? '').replace(/\r/g,'').trim(); }

function normalizeType(type, options, answer) {
  const raw = String(type ?? '').toLowerCase();
  if (raw.includes('判断') || raw.includes('是非') || raw.includes('boolean') || raw==='judge' || raw.includes('true')) return 'boolean';
  if (raw.includes('多选') || raw.includes('multiple') || raw==='multi') return 'multiple';
  if (raw.includes('填空') || raw.includes('fill') || raw==='blank') return 'fill';
  if (raw.includes('简答') || raw.includes('short')) return 'short';
  if (VALID_TYPES.has(raw)) return raw;
  if (raw.includes('单选'))return 'single';
  if(normalizeAnswer(answer,'multiple').length>1)return 'multiple';
  const answerText = String(answer ?? '').trim();
  if (/^[A-Z]{2,}$/.test(answerText)) return 'multiple';
  if (!options || Object.keys(options).length < 2) return answerText ? 'boolean' : 'single';
  return 'single';
}

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    return options.map((option, index) => {
      if (typeof option === 'object' && option !== null) {
        const key = String(option.key ?? option.label ?? String.fromCharCode(65 + index)).toUpperCase();
        return { key, text: cleanText(option.text ?? option.value ?? '') };
      }
      const raw = cleanText(option);
      const match = raw.match(/^([A-E])(?:[.、)）:]\s*)(.*)$/i);
      return { key: (match?.[1] ?? String.fromCharCode(65 + index)).toUpperCase(), text: cleanText(match?.[2] ?? raw) };
    }).filter(option => option.text);
  }
  if (options && typeof options === 'object') {
    return Object.entries(options).map(([key, text]) => ({ key: String(key).toUpperCase(), text: cleanText(text) })).filter(option => option.text);
  }
  return [];
}

export function normalizeAnswer(answer, type = 'single') {
  if (answer === null || answer === undefined || answer === '') return [];
  if (Array.isArray(answer)) return answer.flatMap(item => normalizeAnswer(item, type)).filter(Boolean);
  const text = cleanText(answer);
  if (/待确认|待核对|未知|暂缺/.test(text)) return [];
  if (type === 'boolean') {
    if (/^(正确|对|是|true|√|✓|a)$/i.test(text)) return ['正确'];
    if (/^(错误|错|否|false|×|x|b)$/i.test(text)) return ['错误'];
    return [text];
  }
  if (type === 'single' || type === 'multiple') {
    const letters=text.toUpperCase().replace(/[\s,，、;；.。()（）\[\]【】]/g,'');
    return /^[A-E]+$/.test(letters)?[...new Set(letters)]:[];
  }
  return [text];
}

export function normalizeQuestion(raw = {}, defaults = {}) {
  const source = raw.source && typeof raw.source === 'object' ? raw.source : {};
  const options = normalizeOptions(raw.options ?? raw.choices ?? raw.answers);
  const type = normalizeType(raw.type ?? raw.questionType ?? raw.section, options, raw.answer ?? raw.correctAnswer);
  const question = cleanMultiline(raw.question ?? raw.text ?? raw.title ?? raw.stem);
  if (!question) throw new Error('题目缺少题干');
  const exam = cleanText(raw.exam ?? source.exam);
  const number = raw.number ?? raw.no ?? source.number ?? raw.id ?? '';
  const province=cleanText(raw.province || defaults.province),year=cleanText(raw.year || exam.match(/20\d{2}/)?.[0] || defaults.year);
  const grade=cleanText(raw.grade || raw.stage || exam.match(/(小学|初中|高中|幼儿园)/)?.[1] || defaults.grade);
  const id = String(raw.id ?? stableId(`${province}|${raw.city||defaults.city||''}|${year}|${grade}|${exam}|${number}|${question}`));
  return {
    id,
    type,
    question,
    options,
    answer: normalizeAnswer(raw.answer ?? raw.correctAnswer, type),
    explanation: cleanMultiline(raw.explanation ?? raw.analysis ?? raw['解析'] ?? ''),
    province,
    city: cleanText(raw.city ?? defaults.city),
    year,
    grade,
    module: cleanText(raw.module ?? raw.major_category ?? raw.category ?? defaults.module ?? '未分类'),
    source: { ...source, exam, number, label: cleanText(source.label ?? defaults.source ?? '导入题库') },
    demo: Boolean(raw.demo),
  };
}

export function normalizeQuestions(input, defaults = {}) {
  const items = Array.isArray(input) ? input : Array.isArray(input?.questions) ? input.questions : Array.isArray(input?.data) ? input.data : [];
  const seen = new Set();
  return items.flatMap((raw) => {
    try {
      const question = normalizeQuestion(raw, defaults);
      if (seen.has(question.id)) return [];
      seen.add(question.id);
      return [question];
    } catch {
      return [];
    }
  });
}

export function parseTextQuestions(text, defaults = {}) {
  const questions=[];let section='',current=null,part='question';
  const flush=()=>{if(current)questions.push(current);current=null;};
  for(const line of String(text??'').replace(/\r/g,'').split('\n').map(l=>l.trim())){
    if(!line)continue;
    if(/^[一二三四五六七八九十]+、/.test(line)){flush();section=line;continue;}
    const heading=line.match(/^(\d+)[.、)]\s*(.*)$/);
    if(heading){flush();current={question:heading[2],number:heading[1],options:[],answer:'',explanation:'',section};part='question';continue;}
    if(!current)continue;
    if(/^[A-E][.、)]\s*/i.test(line)){current.options.push(line);part='option';continue;}
    if(/^(正确答案|参考答案|答案)\s*[:：]/.test(line)){current.answer=line.replace(/^(正确答案|参考答案|答案)\s*[:：]/,'').trim();part='answer';continue;}
    if(/^解析\s*[:：]/.test(line)){current.explanation=line.replace(/^解析\s*[:：]/,'').trim();part='explanation';continue;}
    if(part==='option')current.options[current.options.length-1]+=' '+line;
    else if(part==='explanation')current.explanation+='\n'+line;
    else if(part==='question')current.question+='\n'+line;
  }
  flush();
  return normalizeQuestions(questions, defaults);
}

export function parseBank(input, defaults = {}) {
  let parsed = input;
  if (typeof input === 'string') {
    try { parsed = JSON.parse(input); } catch { if (/^[\s\uFEFF]*[\[{]/.test(input)) throw new Error('JSON 格式有误，请检查括号、引号和逗号。'); return { ...makeBank(defaults), questions: parseTextQuestions(input, defaults), rejected: 0 }; }
  }
  const questionsInput = Array.isArray(parsed) ? parsed : parsed?.questions ?? parsed?.data ?? [];
  const rawQuestions = Array.isArray(questionsInput) ? questionsInput : [];
  const bankMeta={...defaults};
  for(const field of ['id','name','province','city','year','grade','source','demo'])if(parsed?.[field]!==undefined&&parsed[field]!=='')bankMeta[field]=parsed[field];
  const questions = normalizeQuestions(rawQuestions, bankMeta);
  const rejected = rawQuestions.length - questions.length;
  return { ...makeBank(bankMeta), questions, rejected };
}

function makeBank(defaults = {}) {
  const name = cleanText(defaults.name ?? '未命名题库') || '未命名题库';
  const id = String(defaults.id ?? stableId(`${defaults.province ?? ''}|${defaults.city ?? ''}|${defaults.year??''}|${defaults.grade??''}|${name}`));
  return { id, name, province: cleanText(defaults.province), city: cleanText(defaults.city), year: cleanText(defaults.year), grade: cleanText(defaults.grade), source: cleanText(defaults.source ?? '本地导入'), demo: Boolean(defaults.demo) };
}

export function inspectQuestions(questions = []) {
  return {
    total: questions.length,
    missing: questions.filter(q => !q.answer.length).length,
    invalid: questions.filter(q => q.answer.length && !gradeAnswer(q,[]).answerable && !['fill','short'].includes(q.type)).length,
    types: questions.reduce((counts, q) => ({ ...counts, [q.type]: (counts[q.type] ?? 0) + 1 }), {}),
  };
}

export function gradeAnswer(question, selected = []) {
  const expected = normalizeAnswer(question.answer, question.type);
  const actual = normalizeAnswer(selected, question.type);
  const optionKeys = new Set((question.options ?? []).map(option => option.key));
  const invalidBoolean=question.type==='boolean'&&(expected.length!==1||!['正确','错误'].includes(expected[0]));
  const invalidSingle=question.type==='single'&&expected.length!==1;
  const invalidOptions=['single','multiple'].includes(question.type)&&Array.isArray(question.options)&&(optionKeys.size<2||expected.some(key=>!optionKeys.has(key)));
  if (!expected.length || ['fill','short'].includes(question.type) || invalidBoolean || invalidSingle || invalidOptions) return { correct: false, answerable: false, expected, actual };
  const same = expected.length === actual.length && expected.every((value) => actual.includes(value));
  return { correct: same, answerable: true, expected, actual };
}

export function summarizeResults(results) {
  const answerable = results.filter(result => result.answerable);
  const correct = answerable.filter(result => result.correct).length;
  return { total: results.length, answerable: answerable.length, correct, accuracy: answerable.length ? Math.round(correct / answerable.length * 100) : 0 };
}

export const DEMO_BANK_ID = 'demo-jiaozong';
