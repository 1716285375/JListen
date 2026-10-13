import { paperSchema, type Paper } from './schemas';
export function validatePaper(input: unknown, release = false) {
  const parsed = paperSchema.safeParse(input);
  if (!parsed.success) return {paper:null, errors:parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`),warnings:[] as string[]};
  const paper = parsed.data;const errors:string[] = [];const warnings:string[] = [];
  const ids = new Set<string>();const tokenIds = new Set<string>();
  const checkId = (id:string) => {if (ids.has(id)) errors.push(`重复 ID: ${id}`);ids.add(id);};
  checkId(paper.id);
  if (new Set(paper.sections.map(s=>s.id)).size !== 5) errors.push('题型编号不唯一');
  for (const section of paper.sections) for (const q of section.questions) {
    checkId(q.id);
    if (q.section !== section.id) errors.push(`${q.id}: 题型不一致`);
    if(q.playStartMs!==null&&q.playEndMs!==null&&q.playStartMs>=q.playEndMs)errors.push(`${q.id}: 题目时间倒置`);
    if (paper.audio.durationMs && q.playEndMs!==null&&q.playEndMs > paper.audio.durationMs) errors.push(`${q.id}: 超过音频时长`);
    let previous = 0;
    for (const s of q.sentences) {
      checkId(s.id);
      if(s.startMs!==null&&s.endMs!==null){
        if(s.startMs<previous){if(paper.schemaVersion==='3.0.0'||release)errors.push(`${s.id}: 时间乱序或交叠`);else warnings.push(`${s.id}: 候选时间乱序或交叠，需复核`);}
        previous=s.endMs;
        if(q.playStartMs!==null&&q.playEndMs!==null&&(s.startMs<q.playStartMs||s.endMs>q.playEndMs))errors.push(`${s.id}: 超出题目范围`);
        if(s.endMs-s.startMs>30000)warnings.push(`${s.id}: 长句时间需复核`);
      }else if(release)errors.push(`${s.id}: 时间未确定`);
      if (s.confidence < .4) warnings.push(`${s.id}: 低文本匹配置信度 ${s.confidence}`);
      if (s.tokens.length || s.tokensStatus === 'reviewed') {
        if (s.tokens.map(t=>t.surface).join('') !== s.text) errors.push(`${s.id}: tokens 拼接不符`);
        for (const t of s.tokens) {
          if (tokenIds.has(t.id)) errors.push(`${t.id}: 词 ID 重复`);tokenIds.add(t.id);
          if (!t.isPunctuation && (!t.meaning?.trim() || !t.pos?.trim() || (/[\u3400-\u9fff]/.test(t.surface) && !t.reading?.trim()))) errors.push(`${t.id}: 缺少词义、词性或读音`);
          if (t.isPunctuation && !/^[\p{P}\p{Z}\s]+$/u.test(t.surface)) errors.push(`${t.id}: 非标点被当作标点`);
        }
      }
      if (release && s.tokensStatus !== 'reviewed') errors.push(`${s.id}: 词级注释未复核`);
      if (release && s.annotationReview?.includes('pending')) errors.push(`${s.id}: 注释尚待独立人工复核`);
    }
  }
  if (paper.id === 'jlpt-n1-2010-07'||paper.id==='2010-07') {
    const counts = paper.sections.map(s=>s.questions.length);
    if (counts.join(',') !== '6,7,6,14,3') errors.push('2010-07 题型题数不符');
    if (paper.sections.flatMap(s=>s.questions).flatMap(q=>q.sentences).length !== 428) errors.push('2010-07 必须保留 428 句');
    if (paper.sections[4].questions[2].subQuestions?.length !== 2) errors.push('問題5 第3题必须保留两组子问题');
  }
  if (release) {
    if (!paper.audio.available) errors.push('音频不可用');
    if (!paper.audio.durationMs) errors.push('缺少音频实测时长');
    if (!paper.audio.redistributionAuthorized) errors.push('未确认素材公开分发授权');
    if (!paper.timing.audioVerified || paper.timing.precision !== 'verified') errors.push('所有句级时间尚未经音频校准');
  }
  return {paper,errors,warnings};
}
export function allSentences(paper:Paper) {return paper.sections.flatMap(s=>s.questions).flatMap(q=>q.sentences);}
