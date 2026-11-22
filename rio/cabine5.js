// O que a V5 ainda põe na cabine por código: só o mapa aberto e a lanterna-símbolo, sobre a mesa do próprio GLB.
// Paredes, forro, piso, bancos, motor, timão e alavanca agora vêm do arquivo (barco5.js).
import * as THREE from 'three';
import {criaLanterna} from './lanterna.js';

export const PROPORCAO_MAPA=4096/2896;
export function criaMesa({T,renderer,texMapa,carrega,anc}){
  const g=new THREE.Group(),m=anc.mesa,y=m.max.y,Lx=m.max.x-m.min.x,Lz=m.max.z-m.min.z,cx=(m.min.x+m.max.x)/2;
  // o mapa fica do lado da popa; a lanterna, na ponta de proa, onde começa a linha do tempo
  const w=Math.min(Lz*.7,(Lx-.07)*PROPORCAO_MAPA),h=w/PROPORCAO_MAPA,zc=m.min.z+.04+w/2;
  const mapa=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texMapa,roughness:.82}));mapa.rotation.set(-Math.PI/2,Math.PI/2,0,'YXZ');mapa.position.set(cx,y+.004,zc);mapa.receiveShadow=T>=1;mapa.userData.alvo='mapa';g.add(mapa);
  const pl=new THREE.Vector3(cx,y+.002,Math.min(m.max.z-.16,zc+w/2+.19));
  const lant=criaLanterna(renderer,T,carrega);lant.scale.setScalar(.82);lant.position.copy(pl);lant.rotation.y=-1.05;g.add(lant);
  const luz=new THREE.PointLight(0xffb066,0,9,1.4);luz.position.set(pl.x,pl.y+.2,pl.z);g.add(luz);
  return {grupo:g,lant,luz,mapa,ponto:pl,mapaL:w,mapaH:h,mapaC:new THREE.Vector3(cx,y,zc)};
}
