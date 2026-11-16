import json
import sys
from pathlib import Path

def merge(sentence, row):
    if sentence['id'] != row['id'] or sentence['text'] != row['original']:
        raise ValueError('Sentence ID or original text differs: ' + row['id'])
    if not sentence.get('translation') and isinstance(row.get('translation'), str) and row['translation'].strip():
        sentence['translation'] = row['translation'].strip()
        sentence['translationSource'] = 'provided_model_translation'
    sentence['languageAnalysis'] = {
        'wordGloss': [{'surface': w['surface'], 'meaning': w['meaning']} for w in row.get('wordGloss', []) if isinstance(w.get('surface'), str) and w['surface'] and isinstance(w.get('meaning'), str) and w['meaning'].strip()],
        'grammar': [{'structure': g['structure'], 'explanation': g['explanation'], **({'skill':g['skill']} if isinstance(g.get('skill'),str) else {})} for g in row.get('grammar', []) if isinstance(g.get('structure'),str) and isinstance(g.get('explanation'),str)],
        **({'examFocus':row['examFocus']} if isinstance(row.get('examFocus'),str) and row['examFocus'].strip() else {})
    }

if __name__ == '__main__':
    source=Path(sys.argv[1]); root=Path(__file__).resolve().parents[1]; plans=[]; stats=[]
    for file in sorted(source.glob('*.json')):
        target=root/'public/data/unified'/(file.name[:7]+'.json'); raw=target.read_bytes(); paper=json.loads(raw)
        sentences={s['id']:s for sec in paper['sections'] for q in sec['questions'] for s in q['sentences']}; seen=set(); added=0
        for row in json.loads(file.read_text(encoding='utf-8-sig')):
            if row['id'] in seen: raise ValueError('Duplicate ID: '+row['id'])
            seen.add(row['id']); sentence=sentences[row['id']]; before=bool(sentence.get('translation'));merge(sentence,row);added+=not before and bool(sentence.get('translation'))
        newline='\r\n' if b'\r\n' in raw else '\n'
        plans.append((target,(json.dumps(paper,ensure_ascii=False,indent=2)+'\n').replace('\n',newline).encode()))
        stats.append({'exam':file.name[:7],'matched':len(seen),'addedTranslations':added,'missingRecords':sorted(set(sentences)-seen),'untranslated':[s['id'] for s in sentences.values() if not s.get('translation')]})
    if len(plans)!=32:raise ValueError('Expected 32 exam files')
    for target,data in plans:target.write_bytes(data)
    report=root/'docs/audit/language-pack-import.json';report.write_text(json.dumps(stats,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(stats,ensure_ascii=False))
