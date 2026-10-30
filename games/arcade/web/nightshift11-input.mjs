// Versioned integer tape: seven action flags, signed percent steering, percent brake.
export const ANALOG_FLAG=1<<22;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function validInput(n){return Number.isInteger(n)&&n>=0&&(n<=127||n<1<<23&&(n&ANALOG_FLAG)!==0&&((n>>7)&255)<=200&&((n>>15)&127)<=100);}
export function packInput(flags,steering,brake=0){return ANALOG_FLAG|(flags&127)|((clamp(Math.round(steering),-100,100)+100)<<7)|(clamp(Math.round(brake),0,100)<<15);}
export function readInput(n){const analog=(n&ANALOG_FLAG)!==0;return{flags:n&127,steering:analog?((n>>7)&255)-100:(n&1)&&!(n&2)?-100:(n&2)&&!(n&1)?100:0,brake:analog?(n>>15)&127:n&8?100:0};}
