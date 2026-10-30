// V12 tapes are disjoint from all V8–V11 encodings. Percent pedals are explicit.
export const DRIVE_FLAG=1<<30;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function validInput(n){return Number.isInteger(n)&&n>=DRIVE_FLAG&&n<2**31&&(n&(1<<22))===0&&((n>>>7)&255)<=200&&((n>>>15)&127)<=100&&((n>>>23)&127)<=100;}
export function packInput(flags,steering,brake=0,throttle=0){return DRIVE_FLAG|(flags&127)|((clamp(Math.round(steering),-100,100)+100)<<7)|(clamp(Math.round(brake),0,100)<<15)|(clamp(Math.round(throttle),0,100)<<23);}
export function readInput(n){return{flags:n&127,steering:((n>>>7)&255)-100,brake:(n>>>15)&127,throttle:(n>>>23)&127};}
