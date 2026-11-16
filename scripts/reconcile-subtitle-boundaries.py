"""Match supplied subtitle cue boundaries exactly; never infer internal boundaries."""
import json,re,unicodedata,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
SOURCE=Path(r'F:\doc\学习\日语\日语JLPT真题\N1真题\N1听力\asr-output')
def norm(s):return ''.join(c for c in unicodedata.normalize('NFKC',s) if c.isalnum())
def stamp(s):
 h,m,v=re.split('[:,.]',s)[:3];ms=re.split('[:,.]',s)[3];return ((int(h)*60+int(m))*60+int(v))*1000+int(ms)
def cues(path):
 out=[]
 for block in re.split(r'\n\s*\n',path.read_text(encoding='utf-8-sig').strip()):
  lines=block.splitlines()
  if len(lines)<3:continue
  a,b=lines[1].split(' --> ');start,end=stamp(a),stamp(b)
  if end<=start:raise ValueError(f'{path.name}: invalid cue {lines[0]}')
  out.append(dict(index=int(lines[0]),start=start,end=end,text=''.join(lines[2:])))
 return out
def groups(items):
 result={}
 for i,c in enumerate(items):
  text=''
  for j in range(i,min(i+20,len(items))):
   if j>i and (items[j]['start']<items[j-1]['end'] or items[j]['start']-items[j-1]['end']>2000):break
   if items[j]['end']-c['start']>30000:break
   text+=norm(items[j]['text'])
   if text:result.setdefault(text,[]).append((i,j))
 return result
def match(text,items,index,left,right):
 key=norm(text)
 if len(key)<8:return [],'short_ambiguous'
 hits=[(a,b) for a,b in index.get(key,[]) if items[a]['start']>=left and items[b]['end']<=right]
 if len(hits)==1:return hits,'exact'
 if hits:return hits,'multiple_matches'
 shared=any(key in norm(c['text']) and norm(c['text'])!=key and c['start']>=left and c['end']<=right for c in items)
 return [],'internal_boundary_unresolved' if shared else 'text_difference_or_missing'
def run():
 target=ROOT/'docs/audit/asr-output';target.mkdir(parents=True,exist_ok=True)
 catalog=json.loads((ROOT/'public/data/audio-index.json').read_text(encoding='utf8'))['exams'];summary=[]
 for src in sorted(SOURCE.glob('*.srt')):
  ym=re.search(r'(\d{4})年(\d{1,2})月',src.name);exam=f'{ym[1]}-{int(ym[2]):02d}';variant='ai' if 'AI' in src.name else 'primary';track=f'{exam}-{variant}'
  items=cues(src);index=groups(items);file=ROOT/f'public/data/unified/{exam}.json';paper=json.loads(file.read_text(encoding='utf8'));before=json.dumps(paper,ensure_ascii=False);rows=[];updated=exact=0
  for section in paper['sections']:
   for q in section['questions']:
    if q.get('audioOverride') and q['audioOverride']['src']!=catalog[exam][variant]['src']:
     rows.extend(dict(id=s['id'],text=s['text'],status='different_recording',old=[s['startMs'],s['endMs']]) for s in q['sentences']);continue
    left=max(0,(q.get('playStartMs') or 0)-2000) if variant=='primary' else 0
    right=min(paper['audio']['durationMs'],(q.get('playEndMs') or paper['audio']['durationMs'])+2000) if variant=='primary' else catalog[exam][variant]['durationMs']
    for s in q['sentences']:
     hits,status=match(s['text'],items,index,left,right);row=dict(id=s['id'],text=s['text'],status=status,old=[s['startMs'],s['endMs']])
     if hits and status=='exact':
      a,b=hits[0];start,end=items[a]['start'],items[b]['end'];row.update(candidate=[start,end],cues=[c['index'] for c in items[a:b+1]]);exact+=1
      # AI timestamps are audited separately; they must never replace live timing.
      if variant=='primary' and (s['startMs'] is None or s.get('timingConflict') or s.get('loopAllowed') is False):
       prior=[x['endMs'] for x in q['sentences'][:s['unitIndex']] if x['endMs'] is not None]
       following=[x['startMs'] for x in q['sentences'][s['unitIndex']+1:] if x['startMs'] is not None]
       if start<(q.get('playStartMs') or 0) or end>(q.get('playEndMs') or right) or (prior and start<prior[-1]) or (following and end>following[0]):row['status']='neighbor_or_question_conflict'
       else:
        s.update(startMs=start,endMs=end,loopAllowed=True,timingConflict=False,timingStatus='provided_sentence_subtitle',needsAudioReview=True,timingSubtitleSource=str(src),timingEvidence=dict(file=src.name,cueIndices=row['cues'],method='exact_complete_cues',audioVerified=False));updated+=1;row['status']='updated_exact'
     rows.append(row)
  if json.dumps(paper,ensure_ascii=False)!=before:
   newline='\r\n' if b'\r\n' in file.read_bytes() else '\n'
   file.write_text(json.dumps(paper,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline=newline)
  counts={};
  for row in rows:counts[row['status']]=counts.get(row['status'],0)+1
  result=dict(track=track,source=str(src),sha256=hashlib.sha256(src.read_bytes()).hexdigest(),cues=len(items),sentences=len(rows),exact=exact,updated=updated,counts=counts,rows=rows)
  (target/f'{track}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
  lines=[f'# {track}',f'\n来源：{src.name}\n\n字幕 {len(items)} 段；现有正文 {len(rows)} 句；完整边界严格匹配 {exact} 句；更新 {updated} 句。\n\n仅为字幕与正文核对，未逐句试听。AI 版不覆盖现场版时间轴。\n\n| 句子 | 处理状态 | 原时间 | 候选时间 | 正文 |\n|---|---|---|---|---|']
  lines.extend(f"| {r['id']} | {r['status']} | {r['old']} | {r.get('candidate','')} | {r['text'].replace('|','／')} |" for r in rows)
  (target/f'{track}.md').write_text('\n'.join(lines)+'\n',encoding='utf8');summary.append({k:v for k,v in result.items() if k!='rows'});print(track,counts,flush=True)
 (target/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
if __name__=='__main__':run()
