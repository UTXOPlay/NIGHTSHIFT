// Asynchronous GPU timing; unavailable/disjoint measurements remain null.
export class GpuTimer{
 constructor(renderer){this.gl=renderer.getContext();this.ext=this.gl.getExtension('EXT_disjoint_timer_query_webgl2');this.pending=[];this.frame=0;this.ms=null;this.active=null;}
 begin(){if(!this.ext)return;const gl=this.gl;while(this.pending.length&&gl.getQueryParameter(this.pending[0],gl.QUERY_RESULT_AVAILABLE)){const q=this.pending.shift(),ns=gl.getQueryParameter(q,gl.QUERY_RESULT);if(!gl.getParameter(this.ext.GPU_DISJOINT_EXT))this.ms=ns/1e6;else this.ms=null;gl.deleteQuery(q);}if(this.frame++%8||this.pending.length>=4)return;this.active=gl.createQuery();gl.beginQuery(this.ext.TIME_ELAPSED_EXT,this.active);}
 end(){if(!this.active)return;this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);this.pending.push(this.active);this.active=null;}
}
