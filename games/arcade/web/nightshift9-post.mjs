import * as T from 'three';
const vertex='varying vec2 tex;void main(){tex=uv;gl_Position=vec4(position.xy,0.,1.);}';
const blur=`uniform sampler2D source;uniform vec2 stepUv;uniform float extract;varying vec2 tex;
 vec3 sampleLight(vec2 uv){vec3 c=texture2D(source,uv).rgb;float l=max(c.r,max(c.g,c.b));return mix(c,c*smoothstep(1.15,2.4,l),extract);}
 void main(){vec3 c=sampleLight(tex)*.227027;c+=(sampleLight(tex+stepUv*1.384615)+sampleLight(tex-stepUv*1.384615))*.316216;c+=(sampleLight(tex+stepUv*3.230769)+sampleLight(tex-stepUv*3.230769))*.070270;gl_FragColor=vec4(c,1.);}`;

// Linear HDR scene -> quarter-size highlight blur -> display transform once.
// DOM controls never enter this pass. No history, camera blur or flashing grain.
export class CircuitPost{
 constructor(renderer){
  this.renderer=renderer;this.supported=renderer.extensions.has('EXT_color_buffer_float');this.active=false;this.width=0;this.height=0;
  this.scene=new T.Scene();this.camera=new T.Camera();this.quad=new T.Mesh(new T.PlaneGeometry(2,2));this.quad.frustumCulled=false;this.scene.add(this.quad);
  this.blur=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{source:{value:null},stepUv:{value:new T.Vector2()},extract:{value:1}},vertexShader:vertex,fragmentShader:blur});
  this.finish=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{source:{value:null},bloom:{value:null},amount:{value:0},pixel:{value:new T.Vector2()}},vertexShader:vertex,fragmentShader:`uniform sampler2D source;uniform sampler2D bloom;uniform float amount;uniform vec2 pixel;varying vec2 tex;
   void main(){vec3 c=texture2D(source,tex).rgb;
    vec3 a=texture2D(source,tex+vec2(pixel.x,0.)).rgb,b=texture2D(source,tex-vec2(pixel.x,0.)).rgb,d=texture2D(source,tex+vec2(0.,pixel.y)).rgb,e=texture2D(source,tex-vec2(0.,pixel.y)).rgb;
    vec3 avg=(a+b+d+e)*.25;float contrast=length(clamp(avg,0.,1.)-clamp(c,0.,1.));c=mix(c,avg,smoothstep(.12,.5,contrast)*.25);
    c+=texture2D(bloom,tex).rgb*amount;
    gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
 }
 resize(w,h){
  if(this.width===w&&this.height===h)return;this.width=w;this.height=h;
  if(!this.target){const options={type:T.HalfFloatType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:false};this.target=new T.WebGLRenderTarget(w,h,{...options,depthBuffer:true,samples:Math.min(2,this.renderer.capabilities.maxSamples)});this.bloomA=new T.WebGLRenderTarget(1,1,options);this.bloomB=new T.WebGLRenderTarget(1,1,options);}
  this.target.setSize(w,h);this.bloomA.setSize(Math.max(1,Math.ceil(w/4)),Math.max(1,Math.ceil(h/4)));this.bloomB.setSize(this.bloomA.width,this.bloomA.height);this.finish.uniforms.pixel.value.set(1/w,1/h);
 }
 async prepare(scene,camera){
  const r=this.renderer,previousTarget=r.getRenderTarget(),shadows=r.shadowMap.enabled;
  const times={},compile=async(name,root,view)=>{const start=performance.now();await r.compileAsync(root,view);times[name]=performance.now()-start;};
  try{
   if(this.supported){this.size??=new T.Vector2();r.getDrawingBufferSize(this.size);this.resize(this.size.x,this.size.y);}
   // WebGL program keys include output color space and tone mapping. Compile
   // the same HDR target used by High/Medium, rather than an unused screen path.
   r.shadowMap.enabled=true;r.setRenderTarget(this.supported?this.target:null);await compile('scene',scene,camera);
   if(this.supported){
    this.quad.material=this.blur;r.setRenderTarget(this.bloomA);await compile('blur',this.scene,this.camera);
    this.quad.material=this.finish;r.setRenderTarget(null);await compile('display',this.scene,this.camera);
   }
   r.shadowMap.enabled=false;r.setRenderTarget(null);await compile('fallback',scene,camera);
   return times;
  }finally{r.shadowMap.enabled=shadows;r.setRenderTarget(previousTarget);}
 }
 render(scene,camera,{low,tier=0,bloom=.16}){
  const r=this.renderer;this.active=this.supported&&!low;this.bloomActive=this.active&&tier===0&&bloom>0;
  if(!this.active){r.setRenderTarget(null);r.render(scene,camera);return;}
  this.size??=new T.Vector2();r.getDrawingBufferSize(this.size);this.resize(this.size.x,this.size.y);
  r.setRenderTarget(this.target);r.render(scene,camera);
  if(this.bloomActive){
   this.quad.material=this.blur;this.blur.uniforms.source.value=this.target.texture;this.blur.uniforms.extract.value=1;this.blur.uniforms.stepUv.value.set(1/this.bloomA.width,0);r.setRenderTarget(this.bloomA);r.render(this.scene,this.camera);
   this.blur.uniforms.source.value=this.bloomA.texture;this.blur.uniforms.extract.value=0;this.blur.uniforms.stepUv.value.set(0,1/this.bloomA.height);r.setRenderTarget(this.bloomB);r.render(this.scene,this.camera);
  }
  this.quad.material=this.finish;this.finish.uniforms.source.value=this.target.texture;this.finish.uniforms.bloom.value=this.bloomB.texture;this.finish.uniforms.amount.value=this.bloomActive?bloom:0;r.setRenderTarget(null);r.render(this.scene,this.camera);
 }
 snapshot(){return{active:this.active,bloomActive:!!this.bloomActive,supported:this.supported,scenePixels:this.active?this.width*this.height:0,bloomPixels:this.bloomActive?this.bloomA.width*this.bloomA.height:0,historyFrames:0};}
 dispose(){this.target?.dispose();this.bloomA?.dispose();this.bloomB?.dispose();this.quad.geometry.dispose();this.blur.dispose();this.finish.dispose();}
}
