// Coloca cada prédio e cada vila no seu lugar do rio, em clareira aberta na mata e em tamanho real.
import * as THREE from 'three';
import {criaKit,OBRAS,torre} from './predios.js';
import {palafita,trapiche,canoa,capela,bandeirolas} from './vila.js';
import {integra} from './nucleo.js';

const Y_CL=2.4;
// props: [fn, ds ao longo do rio, dl distância da margem, rotação, escala]
function cenarioVila(i,K){const P=(v)=>()=>palafita(K,v),T=(c,co)=>()=>trapiche(K,c,co),C=()=>canoa(K),Cg=()=>canoa(K,8,'#6a4a2e'),Ca=()=>capela(K);
  return [
   [[P(0),-22,14,.25,1],[P(1),2,20,-.3,1.1],[P(2),26,15,.5,1],[P(1),-46,24,.1,1],[T(20),10,-3,0,1],[C,16,-9,1.4,1],[Cg,4,-13,1.8,1]],
   [[P(1),-14,12,-.3,1.05],[P(2),14,17,.3,1],[T(16),-2,-3,0,1],[C,4,-8,1.3,1]],
   [[T(26,true),-10,-3,0,1],[T(18),16,-3,0,1],[P(0),2,22,.1,1.1],[P(2),-34,20,.3,1],[C,8,-10,1.45,1],[Cg,28,-9,1.75,1]],
   [[Ca,0,16,-.05,1.1],[P(0),-30,12,.3,1],[P(2),30,14,-.3,1],[T(12),10,-3,0,1],[C,15,-7,1.5,1]]][i];}
export function criaObras(r,T,rio,paradas,cena){
  const K=criaKit(r),lista=[];const o={},v3=new THREE.Vector3();
  // clareiras primeiro: o terreno e a floresta precisam delas
  const cl=paradas.map((p,i)=>{const ob=p.obra?OBRAS[p.obra]:null;return {s:p.s,e:p.e,ds:ob?ob.larg*ob.es/2+12:[64,42,62,48][i],l1:ob?ob.recuo+ob.prof*ob.es+10:[38,30,36,40][i],y:Y_CL}});rio.defineClareiras(cl);
  const constroi=(i)=>{const p=paradas[i],e=p.e,g=new THREE.Group();const po=rio.em(p.s);const rotBase=Math.atan2(-po.nx*e,-po.nz*e);const W=rio.larg(p.s);const ob=p.obra?OBRAS[p.obra]:null;
    const box=new THREE.Box3();
    if(ob){const m=ob.f(K);m.scale.setScalar(ob.es);const lat=e*(W+ob.recuo),o3={};rio.em(p.s+(ob.ds||0),o3);m.position.set(o3.x+o3.nx*lat,Y_CL-.02,o3.z+o3.nz*lat);m.rotation.y=rotBase+ob.rot;g.add(m);m.updateMatrixWorld(true);box.setFromObject(m);
      if(p.torre){const t=torre(K,58),o2={};rio.em(p.s+p.torre[0],o2);const la=e*(W+ob.recuo+22);t.position.set(o2.x+o2.nx*la,Y_CL-.02,o2.z+o2.nz*la);t.rotation.y=rotBase;g.add(t)}}
    else{for(const [f,ds,dl,rt,es] of cenarioVila(i,K)){const q=f(),lat=e*(W+dl),o2={};rio.em(p.s+ds,o2);const y=dl<0?(rt>1?-.06:0):Math.max(.2,rio.altura(p.s+ds,lat));q.position.set(o2.x+o2.nx*lat,dl<0?(rt>1?-.1:0):y,o2.z+o2.nz*lat);q.rotation.y=rotBase+rt;q.scale.setScalar(es);g.add(q);q.updateMatrixWorld(true);if(dl>=0)box.expandByObject(q)}
      if(i===2){const o2={},o4={};rio.em(p.s-16,o2);rio.em(p.s+22,o4);const la=e*(W-1);const b=bandeirolas(K,[o2.x+o2.nx*la,8,o2.z+o2.nz*la],[o4.x+o4.nx*la,8,o4.z+o4.nz*la],22);g.add(b)}}
    g.traverse(a=>{if(a.isMesh){a.castShadow=T>=1;a.receiveShadow=T>=1;const m=a.material;if(m&&m.isMeshStandardMaterial&&!m.userData.rio){m.userData.rio=true;integra(m)}}});
    const centro=box.getCenter(new THREE.Vector3());g.userData={si:p.s,e,caixa:box,centro,tam:box.getSize(new THREE.Vector3())};g.visible=false;cena.add(g);lista[i]=g;return g};
  return {K,lista,constroi,clareiras:cl};
}
