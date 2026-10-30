import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

async function startNative(runtime,token){
 const [command,...args]=runtime.command;
 const child=spawn(command,args,{env:{...process.env,DATA_DIR:runtime.dataDir,PORT:String(new URL(runtime.url).port),BIND:'127.0.0.1',RUNTIME_TOKEN:token},stdio:['ignore','pipe','pipe']});
 let failure=null,output='',listening=false;child.on('error',e=>failure=e);child.stderr.resume();
 child.stdout.on('data',b=>{output=(output+b.toString()).slice(-4096);listening=output.includes(`myelin-nightshift-v${runtime.version} ready on `);});
 const alive=()=>!failure&&child.exitCode===null&&child.signalCode===null;
 async function stop(){
  if(!alive())return;
  const exited=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGTERM');
  const timer=setTimeout(()=>child.kill('SIGKILL'),3000);timer.unref();
  try{await exited;}finally{clearTimeout(timer);}
 }
 const deadline=Date.now()+10000;
 try{
  while(Date.now()<deadline){
   if(!alive())throw failure||Error('Native executor exited during startup');
   if(listening)return {stop,alive};await delay(20);
  }
  throw Error('Native executor startup timed out');
 }catch(error){await stop();throw error;}
}

// Native rule generations keep their executables and databases. Only a bounded
// number of their process/session caches are resident at once. Never evict an
// in-flight native operation, including one whose browser has disconnected.
export function createRuntimePool({runtimes,token,maxWorkers=2,idleMs=120000,fetchImpl=fetch,startRuntime=r=>startNative(r,token)}){
 if(!Number.isInteger(maxWorkers)||maxWorkers<1||maxWorkers>7)throw Error('Invalid native worker limit');
 const states=runtimes.map(r=>({...r,worker:null,busy:false,used:0,starts:0,evictions:0}));
 const byOrigin=new Map(states.map(s=>[new URL(s.url).origin,s]));
 if(byOrigin.size!==states.length)throw Error('Native executor endpoints must be distinct');
 const queue=[],controller=new AbortController();let closed=false,running=0,exclusive=false,lifecycle=Promise.resolve();
 const locked=fn=>{const task=lifecycle.then(fn);lifecycle=task.catch(()=>{});return task;};
 async function evict(s){if(s.worker){const worker=s.worker;s.worker=null;s.evictions++;await worker.stop();}}
 async function ready(s,alone){
  return locked(async()=>{
   if(closed)throw Error('Native worker pool closed');
   if(s.worker&&!s.worker.alive())s.worker=null;
   if(alone)for(const other of states)if(other!==s&&!other.busy)await evict(other);
   if(s.external)return;
   if(!s.worker){
    while(states.filter(r=>r.worker).length>=maxWorkers){const victim=states.filter(r=>r.worker&&!r.busy).sort((a,b)=>a.used-b.used)[0];if(!victim)throw Error('No idle native cache available');await evict(victim);}
    s.worker=await startRuntime(s);s.starts++;
   }
  });
 }
 async function execute(job){
  const s=job.runtime;
  try{
   await ready(s,job.alone);
   // A browser timeout must not make a still-committing native executor eligible
   // for eviction. Finish draining the private response before releasing it.
   const response=await fetchImpl(job.url,{...job.options,signal:AbortSignal.any([controller.signal,AbortSignal.timeout(60000)])});
   const body=await response.arrayBuffer();job.resolve(new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers}));
  }catch(error){job.reject(error);}
  finally{s.busy=false;s.used=Date.now();running--;if(job.alone)exclusive=false;pump();}
 }
 function pump(){
  if(closed||exclusive)return;
  while(running<maxWorkers){
   const solo=queue.find(j=>j.alone);if(solo&&running)return;
   const index=solo?queue.indexOf(solo):queue.findIndex(j=>!j.runtime.busy);if(index<0)return;
   const [job]=queue.splice(index,1);job.options.signal?.removeEventListener('abort',job.abort);
   if(job.options.signal?.aborted){job.reject(job.options.signal.reason);continue;}
   job.runtime.busy=true;running++;if(job.alone)exclusive=true;void execute(job);if(job.alone)return;
  }
 }
 const sweep=setInterval(()=>{void locked(async()=>{for(const s of states)if(s.worker&&!s.busy&&Date.now()-s.used>idleMs)await evict(s);});},Math.min(30000,idleMs));sweep.unref();
 return {
  fetch(url,options={}){
   if(closed)return Promise.reject(Error('Native worker pool closed'));
   const parsed=new URL(url),runtime=byOrigin.get(parsed.origin);if(!runtime)return Promise.reject(Error('Unknown native executor'));
   return new Promise((resolve,reject)=>{
    const job={url,options,runtime,resolve,reject,alone:/\/api\/(migrate-(?:legacy|v8)|replay)$/.test(parsed.pathname)};
    job.abort=()=>{const index=queue.indexOf(job);if(index>=0){queue.splice(index,1);reject(options.signal.reason);pump();}};
    if(options.signal?.aborted)return reject(options.signal.reason);
    options.signal?.addEventListener('abort',job.abort,{once:true});queue.push(job);pump();
   });
  },
  snapshot(){return {maxWorkers,running,queued:queue.length,runtimes:states.map(s=>({version:s.version,running:!!s.worker,busy:s.busy,starts:s.starts,evictions:s.evictions}))};},
  async close(){closed=true;clearInterval(sweep);controller.abort();for(const j of queue.splice(0)){j.options.signal?.removeEventListener('abort',j.abort);j.reject(Error('Native worker pool closed'));}await locked(async()=>{for(const s of states)await evict(s);});}
 };
}
