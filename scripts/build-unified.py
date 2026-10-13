"""Merge supplied MinerU full.md and timestamped ASR Markdown; no ASR inference."""
from pathlib import Path
from difflib import SequenceMatcher
import json,re,unicodedata,hashlib,copy
import pykakasi

ROOT=Path(__file__).resolve().parent.parent
ASR=Path(r'F:\tmp-files\docs\2026-10\日语')
MINER=Path(r'C:\Users\Jie\MinerU')
OUT=ROOT/'public/data/unified';OUT.mkdir(parents=True,exist_ok=True)
manifest=json.loads((ROOT/'public/data/n1/manifest.json').read_text(encoding='utf8'))
catalog=json.loads((ROOT/'public/data/audio-index.json').read_text(encoding='utf8'))['exams']
annotations=json.loads((ROOT/'public/data/annotations-2010-07.json').read_text(encoding='utf8'))
kakasi=pykakasi.kakasi();reading_cache={}
NAMES={1:'課題理解',2:'ポイント理解',3:'概要理解',4:'即時応答',5:'統合理解'}
PRIMARY={
'2010-07':'2010年7月N1听力原文.pdf-fb012644-6c26-4e6d-9e16-7e72b214db93',
'2010-12':'2010年12月N1听力原文.pdf-93a0464d-a298-4be5-8f33-c1d5aa50b6c7',
'2011-07':'2011年07月N1听力原文.pdf-9b7c9b21-9f0e-432a-864d-0fba34aace32',
'2011-12':'2011年12月N1听力原文.pdf-77427136-3940-451f-8640-237ec10f008c',
'2012-07':'2012年07月N1听力原文.pdf-e8f33633-c1bc-4465-a0d3-12210f452145',
'2012-12':'2012年12月N1听力原文.pdf-3b149a75-68c9-4e89-bbc9-10a0297f3687',
'2013-07':'2013年07月N1听力原文.pdf-b63f14e2-6060-4a5d-984c-df1fae4f603e',
'2013-12':'2013年12月N1听力原文.pdf-2270512a-e04f-445d-80a5-5ab0d4383866',
'2014-07':'2014年07月N1听力原文.pdf-d2eba90a-2d76-4084-a481-5a210f1a86e5',
'2014-12':'2014年12月N1听力原文.pdf-ec9cc362-b375-4a3e-a32e-5395d7c55600',
'2015-07':'2015年07月N1听力原文.pdf-1f9c3730-7072-432c-810d-70d49e787116',
'2015-12':'2015年12月N1听力原文.pdf-98d2e2e7-6cf0-46bd-95d6-55ef53e92f14',
'2016-07':'2016年07月N1听力原文.pdf-bc93ed48-8a88-4f41-8b88-1032b44bbb6c',
'2016-12':'2016年12月N1听力原文.pdf-8ae6ec54-f3d1-449f-b507-7e57ea279f57',
'2017-07':'2017年07月N1听力原文.pdf-dfbbdc14-bc10-4703-98a3-2a8eac389f7b',
'2017-12':'2017年12月N1听力原文.pdf-a84f5156-360a-4cdf-bfe6-d188261764d3',
'2018-07':'2018年07月N1听力原文.pdf-fb572214-fb72-459b-8b36-b2ed44552739',
'2018-12':'2018年12月N1听力原文.pdf-94a3a535-cba5-4dfe-af62-d3790b41b8b1',
'2019-07':'2019年07月N1听力原文.pdf-d960a433-05ca-407e-993e-44332719f407',
'2019-12':'2019年12月N1听力原文.pdf-6eca2e84-0c19-47c0-bf90-c51eb548246b',
'2020-12':'2020年12月N1听力原文.pdf-a6bbd820-f397-4c54-877f-ae7bd0558c47',
'2021-07':'2021年07月日语N1听力原文.pdf-fb7cf5fb-f555-43c5-84e2-607de6463a25',
'2021-12':'2021年12月日语N1听力原文.pdf-47f949fb-975b-440b-ba45-7581994a1ef4',
'2022-07':'2022年07月日语N1听力原文.pdf-3a5c1c18-61c5-4484-a3fa-e45679431ddf',
'2022-12':'2022年12月N1听力原文.pdf-ab9ebd97-6f98-4341-902a-2afda11e7c59',
'2023-07':'2023年07月N1听力原文.pdf-8f36c43e-2500-4f17-85e0-8db1e6f93da2',
'2023-12':'2023年12月N1听力原文.pdf-7b751eb5-793b-4e96-a127-6787b10be14a',
'2024-07':'2024年07月日语N1听力原文.pdf-af227762-0a1d-4557-871e-97f022f7fe2e',
'2024-12':'2024年12月N1听力原文.pdf-acb4eee5-27e0-44ed-82fa-aa774c5c7608',
'2025-07':'2025年07月N1听力原文.pdf-3fb8a25c-0fa1-4140-8d2d-ff09cc2e0df1',
'2025-12':'2025年12月N1听力原文.pdf-c58126ad-dac6-4006-9516-0fd9458b1860',
'2026-07':'2026年7月N1真题答案+解析+听力原文.pdf-d2290107-0300-4500-a0f2-8ad91d93507f'}
SUPPLEMENTS=['2024年07月N1答案解析+听力原文+译文.pdf-d9f19c0a-b142-4d38-827a-c835b058417f','2024年07月N1答案解析+听力原文+译文.pdf-73d47f1a-aa01-4510-8bed-3bd73921b54a','2026年7月N1真题答案+解析+听力原文.pdf-e28197f9-998a-4a06-9bbb-b1ff8e20613b']
sources=[];audit=[];rows_summary=[]
def source_text(path):
 data=path.read_bytes();sources.append({'path':str(path),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 return data.decode('utf-8-sig')
def norm(text):
 chars=[];positions=[]
 for i,c in enumerate(text):
  for n in unicodedata.normalize('NFKC',c):
   if n.isalnum() or '\u3040'<=n<='\u30ff':chars.append(n);positions.append(i)
 return ''.join(chars),positions
def number(s):
 s=unicodedata.normalize('NFKC',s);digit={'一':'1','二':'2','三':'3','四':'4','五':'5','六':'6','七':'7','八':'8','九':'9','零':'0'}
 if '十' in s:
  a,b=s.split('十',1);return int(''.join(digit.get(x,x) for x in a) or '1')*10+int(''.join(digit.get(x,x) for x in b) or '0')
 try:return int(''.join(digit.get(x,x) for x in s))
 except ValueError:return None
def parse_asr(text):
 result=[];pattern=re.compile(r'^\[(\d+):(\d+):(\d+)\.(\d+)\s*→\s*(\d+):(\d+):(\d+)\.(\d+)\]\s*(.*)$')
 for line_num,line in enumerate(text.splitlines(),1):
  m=pattern.match(line.strip())
  if not m:continue
  v=list(map(int,m.groups()[:8]));a=((v[0]*60+v[1])*60+v[2])*1000+v[3];b=((v[4]*60+v[5])*60+v[6])*1000+v[7]
  if b<=a:raise ValueError(f'无效 ASR 时间，第 {line_num} 行')
  result.append({'index':len(result)+1,'line':line_num,'startMs':a,'endMs':b,'text':m[9]})
 if not result:raise ValueError('没有识别出原文时间戳')
 return result
def parse_pdf(text,exam):
 lines=text.splitlines();start=0
 if exam=='2026-07':start=next(i for i,l in enumerate(lines) if re.match(r'^#+\s*聴解\s*$',l))
 section=1;question=None;items={};prior={}
 for line_num,line in enumerate(lines[start:],start+1):
  text=re.sub(r'^#+\s*','',line).strip();text=re.sub(r'<[^>]+>','',text)
  text=re.sub(r'\$[^$]*\$','',text)
  if not text or text.startswith('!['):continue
  normalized=unicodedata.normalize('NFKC',text)
  sm=re.match(r'^問題\s*([1-5一二三四五])(?:\s|$|[。:：])',normalized)
  if sm and len(normalized)<45:section=number(sm[1]);question=None;continue
  dot=re.match(r'^([1-5])\s*[.．]\s*(\d{1,2})(?:[.．]?\s|$)',normalized)
  ban=re.match(r'^(\d{1,2})\s*番(?:\s|$|[。:：])',normalized)
  if dot:section=int(dot[1]);question=int(dot[2]);items.setdefault((section,question),[]);prior[section]=question;continue
  if ban:
   n=int(ban[1]);
   if n==1 and prior.get(section,0)>1 and section<5:section+=1
   question=n;prior[section]=n;items.setdefault((section,question),[]);continue
  if question is None:continue
  if not re.search('[\u3040-\u30ff]',text):continue
  if re.match(r'^\d\s*[^番]',normalized) and section<=2:continue
  for part in re.split(r'(?=(?:男(?:の人|の学生)?|女(?:の人|の学生)?|質問|問)\s*[:：])',text):
   if not part.strip():continue
   role=re.match(r'^(男(?:の人|の学生)?|女(?:の人|の学生)?|質問|問)\s*[:：]\s*',part)
   speaker=role[1] if role else None;part=part[role.end():] if role else part
   items[(section,question)].append({'text':part.strip(),'line':line_num,'speaker':speaker})
 return items
def readings(text):
 if text in reading_cache:return copy.deepcopy(reading_cache[text])
 converted=kakasi.convert(text);output=[];cursor=0
 if sum(len(w['orig']) for w in converted)!=len(text):converted=[{'orig':c,'hira':''.join(w['hira'] for w in kakasi.convert(c))} for c in text]
 for word in converted:
  surface=text[cursor:cursor+len(word['orig'])];cursor+=len(word['orig']);reading=word['hira']
  if re.search('[\u3400-\u9fff]',surface) and re.search('[\u3400-\u9fff]',reading):
   reading=''.join(p['hira'] for c in surface for p in kakasi.convert(c))
  output.append({'surface':surface,'reading':reading})
 assert ''.join(t['surface'] for t in output)==text, f'注音拼接错误: {text}'
 reading_cache[text]=output;return copy.deepcopy(output)
def merge_rows(cues,pdf_parts,qid,exam):
 full='';origins=[]
 for part in pdf_parts:
  full+=part['text'];origins.extend([part]*len(part['text']))
 a,apos=norm(full);b='';bpos=[];ranges=[]
 for cue in cues:
  normalized,offsets=norm(cue['text']);left=len(b);b+=normalized;bpos.extend((cue['index'],x) for x in offsets);ranges.append((left,len(b)))
 mapping={}
 if a and b:
  for block in SequenceMatcher(None,a,b,autojunk=False).get_matching_blocks():
   for k in range(block.size):mapping[block.b+k]=block.a+k
 result=[]
 for cue,(left,right) in zip(cues,ranges):
  if not norm(cue['text'])[0] or re.search(r'德富.*编辑',cue['text']):continue
  selected=[mapping[i] for i in range(left,right) if i in mapping];coverage=len(selected)/max(1,right-left)
  text=cue['text'];reference=[];speaker=None
  if selected and coverage>=.78 and len(selected)>=7:
   first,last=min(selected),max(selected)
   if last-first<=max(20,(right-left)*1.65):
    begin,end=apos[first],apos[last]+1;candidate=full[begin:end]
    # Include source punctuation but never extend to a different spoken clause.
    while end<len(full) and full[end] in '。、！？?!':candidate+=full[end];end+=1
    unmatched_prefix=cue['text'][:bpos[left+next(i for i in range(right-left) if left+i in mapping)][1]]
    unmatched_suffix=cue['text'][bpos[left+max(i for i in range(right-left) if left+i in mapping)][1]+1:]
    text=unmatched_prefix+candidate+unmatched_suffix
    reference=sorted(set(x['line'] for x in origins[begin:end]));speaker=origins[begin]['speaker']
  if any(re.search('[\u3400-\u9fff]',t['surface']) and not t['reading'] for t in readings(text)):
   text=cue['text'];reference=[];speaker=None
  text=re.sub(r'([。！？?!])\1+',r'\1',text)
  # No generated replacements: every output fragment comes from one of the two supplied documents.
  sid=f'{qid}-u{cue["index"]:04d}';ann=next((v for v in annotations.values() if v['text']==text),None)
  if text!=cue['text']:audit.append({'exam':exam,'id':sid,'asrLine':cue['line'],'pdfLines':reference,'originalText':cue['text'],'text':text,'matchCoverage':round(coverage,3)})
  item={'id':sid,'unitIndex':len(result),'text':text,'speaker':speaker,'role':'dialogue' if speaker in ['男','女','男の人','女の人'] else 'narration','optionNumber':None,'sourcePdfPage':None,'sourceAsrLines':[cue['line']],'sourceSrtIndices':[cue['index']],'startMs':cue['startMs'],'endMs':cue['endMs'],'confidence':round(coverage,3),'alignment':'asr_text_estimated','timingStatus':'provided_asr','textSource':'integrated','needsAudioReview':True,'tokens':ann['tokens'] if ann else [],'tokensStatus':ann['tokensStatus'] if ann else 'pending_agent_annotation','highlightRole':ann.get('highlightRole','neutral') if ann else 'neutral','furiganaTokens':readings(text),'loopAllowed':True,'sourcePdfLines':reference}
  if ann:
   for key in ['translation','grammarNotes','annotationReview']:
    if key in ann:item[key]=ann[key]
  result.append(item)
 return result
def qmark(cue):
 text=unicodedata.normalize('NFKC',cue['text']).replace(' ','');m=re.match(r'^([0-9一二三四五六七八九十]+)番(?!の)',text)
 return number(m[1]) if m else None
def anchor(cues,parts,after=0):
 if not parts:return None
 needle=norm(parts[0]['text'])[0][:180]
 if len(needle)<12:return None
 scored=[]
 for i in range(after,len(cues)):
  window=''
  for c in cues[i:i+5]:
   window+=norm(c['text'])[0]
   if len(window)>=len(needle)+8:break
  if not window:continue
  match=SequenceMatcher(None,needle,window,autojunk=False)
  size=sum(x.size for x in match.get_matching_blocks())
  score=size/len(needle)*size/max(1,min(len(window),len(needle)+20))
  scored.append((score,i))
 if not scored:return None
 best=max(x[0] for x in scored)
 if best<.55:return None
 i=next(i for score,i in scored if score>=max(.80,best-.02)) if best>=.80 else max(scored)[1]
 preceding=[j for j in range(max(after,i-3),i+1) if qmark(cues[j])==1 and cues[i]['startMs']-cues[j]['startMs']<16000]
 return preceding[0] if preceding else i
def make_question(exam,sec,num,cues,parts,old=None,kind='question'):
 qid=f'{exam}-p{sec}-'+('example' if kind=='example' else f'q{num:02d}')
 s=merge_rows(cues,parts,qid,exam)
 if not s:return None
 return {'id':qid,'number':num,'section':sec,'sectionName':NAMES[sec],'kind':kind,'title':('题型说明' if sec==5 else '题型说明与例题') if kind=='example' else None,'startMs':s[0]['startMs'],'endMs':s[-1]['endMs'],'playStartMs':s[0]['startMs'],'playEndMs':s[-1]['endMs'],'rawWindowStartMs':s[0]['startMs'],'rawWindowEndMs':s[-1]['endMs'],'answer':(old or {}).get('answer'),'answerDescription':(old or {}).get('answerDescription'),'answerExtra':(old or {}).get('answerExtra',[]),'subQuestions':(old or {}).get('subQuestions') or None,'sentences':s}
if __name__=='__main__':
 # Preserve the document-by-document corrections instead of silently overwriting them.
 if any(json.loads(p.read_text(encoding='utf8')).get('documentReview',{}).get('status')=='text_reviewed' for p in OUT.glob('*.json')):
  raise SystemExit('题库已有逐份校对结果，已停止自动覆盖。')
 for supplement in SUPPLEMENTS:source_text(MINER/supplement/'full.md')
 for entry in manifest['exams']:
  exam=entry['id'];raw=json.loads((ROOT/f'public/data/n1/{exam}.json').read_text(encoding='utf8'))
  pdf_path=MINER/PRIMARY[exam]/'full.md';pdf=source_text(pdf_path);parts=parse_pdf(pdf,exam)
  asr_path=ASR/(Path(entry['primarySrt']).stem+'.md');cues=parse_asr(source_text(asr_path))
  for alternate in entry['alternativeSrt']:source_text(ASR/(Path(alternate).stem+'.md'))
  starts=[];official=[]
  explicit={}
  for i,c in enumerate(cues):
   t=unicodedata.normalize('NFKC',c['text']);m=re.match(r'^問題\s*([1-5一二三四五])(?:[。？?]|では|$)',t)
   if m:explicit.setdefault(number(m[1]),i)
  for j,sec in enumerate(raw['sections']):
   n=sec['number'];estimate=sec.get('startMs') or next((q['startMs'] for q in sec['questions'] if q['startMs'] is not None),0)
   candidates=[i for i,c in enumerate(cues) if qmark(c)==1 and abs(c['startMs']-estimate)<60000]
   lower=explicit.get(n,next((i for i,c in enumerate(cues) if c['startMs']>=max(0,estimate-120000)),0))
   upper=explicit.get(n+1,len(cues))
   if n not in explicit and j+1<len(raw['sections']):
    next_estimate=raw['sections'][j+1].get('startMs')
    if next_estimate is not None:upper=next((i for i,c in enumerate(cues) if c['startMs']>=next_estimate+60000),len(cues))
   begin=next((i+1 for i in range(lower,min(upper,len(cues))) if 'では' in cues[i]['text'] and '始めます' in cues[i]['text'] and cues[i]['startMs']-cues[lower]['startMs']<260000),None) if n in explicit else None
   lower=max(lower,begin or 0,official[-1]+1 if official else 0)
   local_anchor=anchor(cues[lower:upper],parts.get((n,1),[]),0)
   derived=lower+local_anchor if local_anchor is not None else None
   at=derived if derived is not None else min(candidates,key=lambda i:abs(cues[i]['startMs']-estimate)) if candidates else min(range(len(cues)),key=lambda i:abs(cues[i]['startMs']-estimate))
   official.append(at)
   # Only use announcements actually present in this recording.
   headings=[i for i,c in enumerate(cues[:at]) if re.match(r'^問題\s*[1-5一二三四五語](?:[。？?]|では|$)',unicodedata.normalize('NFKC',c['text'])) and cues[at]['startMs']-c['startMs']<260000]
   own=[i for i in headings if re.match(rf'^問題\s*(?:{n}|{"一二三四五"[n-1]}{"|語" if n==5 else ""})',unicodedata.normalize('NFKC',cues[i]['text']))]
   prep=min(own) if own else at
   if n==1:prep=0
   starts.append(prep)
  if any(official[i]>=official[i+1] for i in range(len(official)-1)):raise ValueError(f'{exam}: 题型边界乱序，需要核对来源 {official}')
  sections=[];missing_examples=[]
  for j,sec in enumerate(raw['sections']):
   n=sec['number'];lo=official[j];hi=starts[j+1] if j+1<len(starts) else len(cues);qs=[]
   intro=make_question(exam,n,0,cues[starts[j]:lo],[],kind='example')
   if intro:qs.append(intro)
   else:missing_examples.append(n)
   markers=[(lo,1)];last=1
   for i in range(lo+1,hi):
    num=qmark(cues[i])
    if num is not None and last<num<=20:markers.append((i,num));last=num
   for expected in sorted(qn for sn,qn in parts if sn==n):
    if any(num==expected for _,num in markers):continue
    left=max((i+1 for i,num in markers if num<expected),default=lo)
    right=min((i for i,num in markers if num>expected),default=hi)
    found=anchor(cues[left:right],parts[(n,expected)],0)
    if found is not None:markers.append((left+found,expected));markers.sort()
   old_by_number={q['number']:q for q in sec['questions']}
   for k,(a,num) in enumerate(markers):
    b=markers[k+1][0] if k+1<len(markers) else hi
    q=make_question(exam,n,num,cues[a:b],parts.get((n,num),[]),old_by_number.get(num))
    if q:qs.append(q)
   sections.append({'id':n,'name':NAMES[n],'questions':qs})
  asset=catalog[exam]['primary']
  paper={'schemaVersion':'5.0.0','id':exam,'level':'N1','year':entry['year'],'month':entry['month'],'displayName':entry['title'],'audio':{'src':asset['src'],'available':True,'durationMs':asset['durationMs'],'peaksPath':asset['peaksPath'],'redistributionAuthorized':False,'note':'开发者提供的整卷录音'},'timing':{'source':'User supplied timestamped ASR Markdown','precision':'estimated','audioVerified':False,'warning':'时间来自提供的 ASR 文档，尚非逐句人工试听复核。'},'textAuthority':'User supplied MinerU full.md + ASR Markdown','sections':sections,'sources':{'pdf':str(pdf_path),'asr':str(asr_path)},'missingExampleSections':missing_examples}
  all_lines=[s for section in sections for q in section['questions'] for s in q['sentences']]
  covered={i for s in all_lines for i in s['sourceSrtIndices']};expected={c['index'] for c in cues if norm(c['text'])[0] and not re.search(r'德富.*编辑',c['text'])}
  assert covered==expected,(exam,'ASR片段遗漏',sorted(expected-covered)[:10])
  # Recordings without an example reuse the actual supplied 2010 sample, never invented audio/text.
  if missing_examples and exam!='2010-07':
   common=json.loads((OUT/'2010-07.json').read_text(encoding='utf8'))
   for section in sections:
    if section['id'] not in missing_examples:continue
    sample=copy.deepcopy(next(q for sec in common['sections'] if sec['id']==section['id'] for q in sec['questions'] if q['kind']=='example'))
    old_id=sample['id'];sample['id']=f'{exam}-p{section["id"]}-example';sample['title']='通用例题' if section['id']<5 else '题型说明';sample['audioOverride']=common['audio'];sample['exampleSource']='2010 年 7 月'
    for s in sample['sentences']:s['id']=s['id'].replace(old_id,sample['id']);s['sourceExamId']='2010-07'
    section['questions'].insert(0,sample)
   all_lines=[s for section in sections for q in section['questions'] for s in q['sentences']]
  unknown=[(s['id'],t['surface'],t['reading']) for s in all_lines for t in s['furiganaTokens'] if re.search('[\u3400-\u9fff]',t['surface']) and (not t['reading'] or re.search('[\u3400-\u9fff]',t['reading']))]
  rows_summary.append({'exam':exam,'formalQuestions':sum(q['kind']=='question' for sec in sections for q in sec['questions']),'introGroups':sum(q['kind']=='example' for sec in sections for q in sec['questions']),'sentences':len(all_lines),'asrSegments':len(cues),'coveredSegments':len(covered),'missingExamples':missing_examples,'unresolvedReadings':unknown})
  (OUT/f'{exam}.json').write_text(json.dumps(paper,ensure_ascii=False,separators=(',',':')),encoding='utf8')
  print(exam,rows_summary[-1],flush=True)
 (ROOT/'reports/unified-build.json').write_text(json.dumps({'sources':sources,'rows':rows_summary,'corrections':audit,'method':'supplied full.md + supplied ASR.md; no recognition model; ASR timestamps preserved'},ensure_ascii=False,indent=2),encoding='utf8')
 print('DONE',len(rows_summary),'场',sum(r['sentences'] for r in rows_summary),'句',len(audit),'条来源合并',flush=True)
