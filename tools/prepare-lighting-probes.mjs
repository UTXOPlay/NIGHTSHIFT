// Numeric radiance-map preparation. Keep downloaded 1K originals outside the
// release; box-filter linear radiance and losslessly RGBE/RLE-encode at 512x256.
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {FloatType} from 'three';
import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const source=process.argv[2],destination=process.argv[3];
if(!source||!destination)throw Error('Usage: node tools/prepare-lighting-probes.mjs ORIGINAL_DIRECTORY OUTPUT_DIRECTORY');
function channelRle(a){const out=[];for(let at=0;at<a.length;){let run=1;while(at+run<a.length&&run<127&&a[at+run]===a[at])run++;if(run>=4){out.push(128+run,a[at]);at+=run;}else{const start=at;at+=run;while(at<a.length&&at-start<128){let n=1;while(at+n<a.length&&n<4&&a[at+n]===a[at])n++;if(n>=4)break;at+=Math.min(n,128-(at-start));}out.push(at-start,...a.subarray(start,at));}}return Buffer.from(out);}
for(const name of ['sunset','daylight','night']){
 const input=readFileSync(path.join(source,name+'.hdr')),b=input.buffer.slice(input.byteOffset,input.byteOffset+input.byteLength),texture=new HDRLoader().setDataType(FloatType).parse(b),width=512,height=256;
 if(texture.width!==1024||texture.height!==512)throw Error('Expected the pinned 1K sources');
 const lines=[Buffer.from('#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y '+height+' +X '+width+'\n')];
 for(let y=0;y<height;y++){
  const channels=Array.from({length:4},()=>new Uint8Array(width));
  for(let x=0;x<width;x++){
   const rgb=[0,0,0];for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const n=((y*2+dy)*texture.width+x*2+dx)*4;for(let c=0;c<3;c++)rgb[c]+=texture.data[n+c]*.25;}
   const max=Math.max(...rgb);if(max<1e-32)continue;const exponent=Math.floor(Math.log2(max))+1,scale=256/2**exponent;
   for(let c=0;c<3;c++)channels[c][x]=Math.min(255,Math.floor(rgb[c]*scale));channels[3][x]=exponent+128;
  }
  lines.push(Buffer.from([2,2,width>>8,width&255]),...channels.map(channelRle));
 }
 const output=Buffer.concat(lines);writeFileSync(path.join(destination,name+'.hdr'),output);console.log({name,originalBytes:input.length,releaseBytes:output.length,width,height});
}
