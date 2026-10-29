// Presentation only. Light intensities are balanced against linear HDR probes;
// the colour of the route UI is deliberately independent of its illumination.
const look=(v)=>Object.freeze({probe:1,rotation:0,sky:'#b6cee3',ground:'#454a48',hemi:.35,key:'#fff0d6',sun:2.5,fill:'#afc8e3',bounce:.12,exposure:1,fog:'#96aaba',near:105,far:440,wet:0,bloom:.12,...v});
export const CIRCUIT_LOOKS=Object.freeze([
 look({probe:0,rotation:.6,sky:'#9fb4d3',ground:'#343a40',hemi:.28,key:'#ffcf9b',sun:.85,exposure:1,fog:'#536d84',near:100,far:420,wet:.85,bloom:.16}),
 look({probe:0,rotation:-.4,sky:'#c6d6e7',ground:'#8796a2',hemi:.5,key:'#ffe6d0',sun:2.1,fog:'#b3c5d5',near:130,far:480}),
 look({rotation:1.4,sky:'#bad6d7',ground:'#465c42',key:'#ffe8b6',sun:2.8,fog:'#7f9e98',near:85,far:380}),
 look({probe:2,sky:'#809fc3',ground:'#252d36',hemi:.26,key:'#acc8f3',sun:.55,fill:'#d298b8',bounce:.08,exposure:1.12,fog:'#35465e',near:75,far:360,wet:1,bloom:.22}),
 look({rotation:.8,key:'#fff5dc',sun:2.8,fog:'#94bbcb',near:150,far:490}),
 look({rotation:-.3,sky:'#c6d4dc',ground:'#b29b7d',hemi:.42,key:'#fff0cc',sun:3.4,fog:'#c4b39d',near:130,far:460,exposure:.92}),
 look({probe:0,rotation:1.3,sky:'#c0c9d6',ground:'#8a6050',key:'#ffd3a1',sun:2.5,fog:'#b9957d',near:100,far:430}),
 look({probe:2,sky:'#9c9db4',ground:'#4b3030',hemi:.3,key:'#d8c6df',sun:1,fill:'#ff8b52',bounce:.35,fog:'#655c70',near:85,far:370,bloom:.18}),
 look({probe:0,rotation:2.2,sky:'#bddbd3',ground:'#53665b',hemi:.42,key:'#ffe4bd',sun:1.8,fog:'#90b8ae',near:100,far:420,wet:.6,bloom:.14}),
 look({probe:0,rotation:-1,sky:'#afcfdf',ground:'#6a8a9a',hemi:.42,key:'#d6ebff',sun:1.65,fog:'#87acbc',near:105,far:430}),
 look({probe:3,sky:'#bbc4c4',ground:'#3c3530',hemi:.22,key:'#d4e6ed',sun:.35,fill:'#ffb66f',bounce:.16,exposure:1.1,fog:'#515654',near:65,far:290,bloom:.2}),
 look({probe:0,rotation:-.7,sky:'#c5c2d8',ground:'#777685',hemi:.45,key:'#ffceac',sun:1.8,fog:'#b6a5b8',near:140,far:480,bloom:.14})
]);
export const GARAGE_LOOK=look({probe:0,rotation:1.5,hemi:.55,sun:2.2,exposure:1.05});

export function applyCircuitLook(owner,mode,preview){
 const p=preview?GARAGE_LOOK:CIRCUIT_LOOKS[mode]||CIRCUIT_LOOKS[0];
 owner.hemi.color.set(p.sky);owner.hemi.groundColor.set(p.ground);owner.hemi.intensity=p.hemi;
 owner.sun.color.set(p.key);owner.sun.intensity=p.sun;
 const angle=p.rotation+owner.course.origin.heading,c=Math.cos(angle),s=Math.sin(angle);
 owner.sun.position.set(-32*c-28*s,36,32*s-28*c-12);
 owner.sun.shadow.normalBias=.018;owner.sun.shadow.bias=-.00025;
 owner.amber.color.set(p.fill);owner.amber.intensity=p.bounce;
 owner.renderer.toneMappingExposure=p.exposure;
 owner.scene.fog.color.set(p.fog);owner.scene.fog.near=p.near;owner.scene.fog.far=p.far;
 owner.world.fog.copy(owner.scene.fog.color);
 owner.scene.environmentRotation.y=p.rotation+owner.course.origin.heading;
 owner.roadMat.color.set(p.wet>0?'#515b65':'#737b83');owner.roadMat.metalness=0;
 owner.roadMat.userData.wetness&&(owner.roadMat.userData.wetness.value=p.wet);
 return p;
}
