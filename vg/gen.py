import json,sys,os,time,torch
sys.path.insert(0,'/mnt/itts')
from indextts.infer_v2_5 import IndexTTS2
torch.set_num_threads(os.cpu_count() or 4)
W=os.environ['GITHUB_WORKSPACE']; voice=sys.argv[1]
jobs=json.load(open(f'{W}/vg/jobs.json'))[voice]
only=set(sys.argv[2].split(',')) if len(sys.argv)>2 and sys.argv[2] else None
tts=IndexTTS2(cfg_path='/mnt/itts/checkpoints/config.yaml',model_dir='/mnt/itts/checkpoints',device='cpu')
lang='ZH' if voice.startswith('zh') else 'EN'
out=f'{W}/out/{voice}'; os.makedirs(out,exist_ok=True)
for k,text,emo in jobs:
  if only and k not in only: continue
  t=time.time()
  try:
    tts.infer(spk_audio_prompt=f'{W}/vg/prompts/{voice}.wav',text=text,output_path=f'{out}/{k}.wav',lang=lang,emo_vector=emo,use_random=False)
    print('OK',k,round(time.time()-t,1),flush=True)
  except Exception as e: print('FAIL',k,repr(e),flush=True)
