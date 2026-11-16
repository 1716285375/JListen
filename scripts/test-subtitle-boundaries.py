import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('reconcile',Path(__file__).with_name('reconcile-subtitle-boundaries.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class BoundaryTests(unittest.TestCase):
 def test_complete_cues(self):
  cues=[dict(index=1,start=100,end=400,text='会議の資料を'),dict(index=2,start=450,end=900,text='確認してください。')]
  self.assertEqual(m.match('会議の資料を確認してください。',cues,m.groups(cues),0,1000), ([(0,1)],'exact'))
 def test_internal_boundary_is_not_invented(self):
  cues=[dict(index=1,start=100,end=900,text='会議の資料を確認してください。終わったら連絡してください。')]
  self.assertEqual(m.match('会議の資料を確認してください。',cues,m.groups(cues),0,1000)[1],'internal_boundary_unresolved')
 def test_repetition_stays_ambiguous(self):
  cues=[dict(index=1,start=100,end=900,text='会議の資料を確認してください。'),dict(index=2,start=1100,end=1900,text='会議の資料を確認してください。')]
  self.assertEqual(m.match(cues[0]['text'],cues,m.groups(cues),0,2000)[1],'multiple_matches')
  self.assertEqual(m.match(cues[0]['text'],cues,m.groups(cues),1000,2000)[0],[(1,1)])
 def test_short_answer_is_not_guessed(self):self.assertEqual(m.match('はい。',[],{},0,2000)[1],'short_ambiguous')
 def test_cannot_bridge_large_gap(self):
  cues=[dict(index=1,start=100,end=400,text='会議の資料を'),dict(index=2,start=3000,end=3900,text='確認してください。')]
  self.assertEqual(m.match('会議の資料を確認してください。',cues,m.groups(cues),0,5000)[0],[])
if __name__=='__main__':unittest.main()
