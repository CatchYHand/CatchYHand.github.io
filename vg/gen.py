import json,sys,os,time,torch,subprocess,urllib.request,hashlib
sys.path.insert(0,'/mnt/itts')
from indextts.infer_v2_5 import IndexTTS2
torch.set_num_threads(os.cpu_count() or 4)
W=os.environ['GITHUB_WORKSPACE']; voice=sys.argv[1]
jobs=json.load(open(f'{W}/vg/jobs.json'))[voice]
only=set(sys.argv[2].split(',')) if len(sys.argv)>2 and sys.argv[2] else None
tts=IndexTTS2(cfg_path='/mnt/itts/checkpoints/config.yaml',model_dir='/mnt/itts/checkpoints',device='cpu')
lang='ZH' if voice.startswith('zh') else 'EN'
out=f'{W}/out/{voice}'; os.makedirs(out,exist_ok=True); refd=f'{W}/out/refs'; os.makedirs(refd,exist_ok=True)
def ref(url):
  n=url.rsplit('/',1)[1].rsplit('.',1)[0]; mp=f'{refd}/{n}.mp3'; wv=f'/tmp/{n}.wav'
  if not os.path.exists(mp):
    for i in range(4):
      try: urllib.request.urlretrieve(url,mp); break
      except Exception as e: print('dl retry',url,e); time.sleep(3)
  if not os.path.exists(wv): subprocess.run(['ffmpeg','-loglevel','error','-y','-i',mp,'-ac','1','-ar','16000',wv],check=True)
  return wv
for j in jobs:
  k,text,emo=j[0],j[1],j[2]; url=j[3] if len(j)>3 else None
  if only and k not in only: continue
  t=time.time()
  try:
    kw=dict(spk_audio_prompt=f'{W}/vg/prompts/{voice}.wav',text=text,output_path=f'{out}/{k}.wav',lang=lang,use_random=False)
    if url: kw.update(emo_audio_prompt=ref(url),emo_alpha=0.85)
    else: kw.update(emo_vector=emo)
    tts.infer(**kw)
    print('OK',k,round(time.time()-t,1),flush=True)
  except Exception as e: print('FAIL',k,repr(e),flush=True)
