"""Convert the credited source recordings to small, click-free PCM game loops.
Usage: python3 tools/build-drive-audio.py /path/to/extracted/source-directory
The original download hashes and licences are in docs/drive-audio-sources.json.
"""
from pathlib import Path
import array, subprocess, sys, wave

root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1])
target=root/'games/arcade/web/audio/nightshift'
target.mkdir(parents=True,exist_ok=True)
def convert(name,path,loop=False):
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-ac','1','-ar','32000','-f','f32le','-'])
    samples=array.array('f');samples.frombytes(raw)
    if loop:
        n=640
        joined=[samples[-n+i]*(1-i/(n-1))+samples[i]*i/(n-1) for i in range(n)]
        samples=array.array('f',list(samples[n:-n])+joined)
    peak=max(abs(x) for x in samples)
    scale=.72/max(.001,peak)
    pcm=array.array('h',(max(-32767,min(32767,round(x*scale*32767)))for x in samples))
    with wave.open(str(target/(name+'.wav')),'wb')as out:
        out.setnchannels(1);out.setsampwidth(2);out.setframerate(32000);out.writeframes(pcm.tobytes())
    print(name,len(pcm)/32000,'seconds')
convert('engine',source/'engine/engine-loop/engine-loop-1-normalized.wav',True)
convert('tyres',source/'tyres/carskid/skid-loop.wav',True)
convert('impact',source/'qubodup-crash.ogg')
