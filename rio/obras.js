// Coloca cada prédio e cada vila no seu lugar do rio, em clareira aberta na mata e em tamanho real.
import * as THREE from 'three';
import {criaKit,OBRAS,torre} from './predios.js';
import {palafita,trapiche,canoa,capela,bandeirolas} from './vila.js';
import {integra,U} from './nucleo.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- V6: gente nas margens (ilustrativo) ----------
// Uma figura estilizada de 1,65 m (cerca de 90 triângulos), repetida por instâncias: dá vida às clareiras e serve de régua
// para o tamanho dos prédios e do barco. Não retrata ninguém. Com ?regua=1 as figuras ficam laranja-vivo.
export const ALTURA_PESSOA=1.65;
let _figG=null,_figM=null;
function figura(){if(_figG)return [_figG,_figM];const P=[],cor=(g,r,gg,b)=>{const n=g.attributes.position.count,c=new Float32Array(n*3);for(let i=0;i<n;i++){c[i*3]=r;c[i*3+1]=gg;c[i*3+2]=b}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g.index?g.toNonIndexed():g};
  const cx=(w,h,d,x,y,z,r,g,b)=>{const q=new THREE.BoxGeometry(w,h,d);q.translate(x,y,z);P.push(cor(q,r,g,b))};
  cx(.13,.8,.15,-.085,.4,0,.34,.33,.36);cx(.13,.8,.15,.085,.4,0,.34,.33,.36); // pernas
  cx(.36,.58,.2,0,1.09,0,1,1,1);                                           // tronco (recebe a cor da instância)
  cx(.09,.56,.1,-.235,1.08,0,1,1,1);cx(.09,.56,.1,.235,1.08,0,1,1,1);       // braços
  {const q=new THREE.SphereGeometry(.115,7,5);q.scale(1,1.14,1);q.translate(0,1.52,0);P.push(cor(q,.72,.52,.4))} // cabeça: topo em 1,65
  const g=mergeGeometries(P.map(q=>{for(const k of Object.keys(q.attributes))if(!['position','normal','color'].includes(k))q.deleteAttribute(k);return q}));
  _figG=g;_figM=integra(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9}),{copa:true,chave:'gente'});_figM.userData.rio=true;return [g,_figM]}
const ROUPAS=[0xe9e2d0,0xcfd8e0,0xb9a98a,0x8e9aa8,0xd9c7a8,0x7c8a74,0xf1eee6,0xa98f7a];
// lugares: [[x,y,z,rotY,escala],…] em coordenadas do mundo
export function criaGente(lugares,regua=false,semente=1){const [g,m]=figura(),im=new THREE.InstancedMesh(g,m,lugares.length),o=new THREE.Object3D(),c=new THREE.Color();
  lugares.forEach((q,i)=>{o.position.set(q[0],q[1],q[2]);o.rotation.set(0,q[3]||0,0);o.scale.setScalar(q[4]||1);o.updateMatrix();im.setMatrixAt(i,o.matrix);c.set(regua?0xff5a00:ROUPAS[(i*3+semente)%ROUPAS.length]);im.setColorAt(i,c)});
  im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;im.computeBoundingSphere();im.name='gente';return im}


const Y_CL=2.4;
// props: [fn, ds ao longo do rio, dl distância da margem, rotação, escala]
function cenarioVila(i,K){const P=(v)=>()=>palafita(K,v),T=(c,co)=>()=>trapiche(K,c,co),C=()=>canoa(K),Cg=()=>canoa(K,8,'#6a4a2e'),Ca=()=>capela(K);
  return [
   [[P(0),-22,14,.25,1],[P(1),2,20,-.3,1.1],[P(2),26,15,.5,1],[P(1),-46,24,.1,1],[T(20),10,-3,0,1],[C,16,-9,1.4,1],[Cg,4,-13,1.8,1]],
   [[P(1),-14,12,-.3,1.05],[P(2),14,17,.3,1],[T(16),-2,-3,0,1],[C,4,-8,1.3,1]],
   [[T(26,true),-10,-3,0,1],[T(18),16,-3,0,1],[P(0),2,22,.1,1.1],[P(2),-34,20,.3,1],[C,8,-10,1.45,1],[Cg,28,-9,1.75,1]],
   [[Ca,0,16,-.05,1.1],[P(0),-30,12,.3,1],[P(2),30,14,-.3,1],[T(12),10,-3,0,1],[C,15,-7,1.5,1]]][i];}
function regua15(){const g=new THREE.Group();g.name='regua15';const P=[],C=[];const box=new THREE.BoxGeometry(.32,1,.32).toNonIndexed();
  for(let k=0;k<15;k++){const b=box.clone();b.translate(0,k+.5,0);const pa=b.attributes.position.array;for(let i=0;i<pa.length;i++)P.push(pa[i]);const c=k%2?[1,1,1]:[.85,.12,.08];for(let i=0;i<pa.length/3;i++)C.push(...c)}
  const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(P,3));ge.setAttribute('color',new THREE.Float32BufferAttribute(C,3));ge.computeVertexNormals();
  g.add(new THREE.Mesh(ge,new THREE.MeshBasicMaterial({vertexColors:true,fog:false})));
  for(const m of [0,5,10,15]){const c=document.createElement('canvas');c.width=128;c.height=64;const x=c.getContext('2d');x.fillStyle='rgba(0,0,0,.6)';x.fillRect(0,0,128,64);x.fillStyle='#fff';x.font='bold 40px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(m+' m',64,34);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false,fog:false}));sp.scale.set(2.2,1.1,1);sp.position.set(1.5,m,0);sp.renderOrder=40;g.add(sp)}
  return g}
export function criaObras(r,T,rio,paradas,cena,opc={}){const REGUA=!!opc.regua,NG=[3,5,7][T];
  const hs=n=>{let h=Math.imul(n,374761393)|0;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
  const K=criaKit(r),lista=[];K.luz.uT=U.uTempo; /* o relógio das luzes de balizamento das torres */const o={},v3=new THREE.Vector3();
  // clareiras primeiro: o terreno e a floresta precisam delas
  const cl=paradas.map((p,i)=>{const ob=p.obra?OBRAS[p.obra]:null;return {s:p.s,e:p.e,ds:ob?ob.larg*ob.es/2+12+(p.obra==='radio1995'?16:0):[64,42,62,48][i],l1:ob?ob.recuo+ob.prof*ob.es+10:[38,30,36,40][i],y:Y_CL}});const EX=rio.ROT.extras||[];for(const x of EX)cl.push({s:x.s,e:x.e,ds:x.ds||32,l1:x.l1||26,y:Y_CL,extra:true});rio.defineClareiras(cl);
  const constroi=(i)=>{const p=paradas[i],e=p.e,g=new THREE.Group();const po=rio.em(p.s);const rotBase=Math.atan2(-po.nx*e,-po.nz*e);const W=rio.larg(p.s);const ob=p.obra?OBRAS[p.obra]:null;
    const box=new THREE.Box3();
    if(ob){const m=ob.f(K);m.scale.setScalar(ob.es);const lat=e*(W+ob.recuo),o3={};rio.em(p.s+(ob.ds||0),o3);m.position.set(o3.x+o3.nx*lat,Y_CL-.02,o3.z+o3.nz*lat);m.rotation.y=rotBase+ob.rot;g.add(m);m.updateMatrixWorld(true);box.setFromObject(m);
      // gente diante da fachada, entre o prédio e a margem (ilustrativo; adulto de 1,65 m ±6%, uma criança)
      {const L=[],meia=Math.min(9,ob.larg*ob.es*.24),zMax=Math.max(3.4,ob.recuo-2.5);for(let k=0;k<NG;k++){const dx=(hs(i*31+k*7)*2-1)*meia,dz=Math.min(zMax,3+hs(i*17+k*13+5)*4.2),sk=p.s+(ob.ds||0)+dx,la=e*(W+ob.recuo-dz),o5={};rio.em(sk,o5);L.push([o5.x+o5.nx*la,Math.max(.2,rio.altura(sk,la)),o5.z+o5.nz*la,rotBase+ob.rot+(hs(i*5+k)*2-1)*1.3+(k%3===0?Math.PI:0),k===NG-1&&NG>3?.7:.94+hs(i+k*3)*.12])}
        g.add(criaGente(L,REGUA,i));
        // rodada 3 · régua de metros (?regua=1): poste graduado de 0 a 15 m ao lado do prédio, faixas de 1 m vermelho/branco, rótulos a cada 5 m
        if(REGUA){const rg=regua15(),sk=p.s+(ob.ds||0)+ob.larg*ob.es*.5+7,la=e*(W+Math.max(2,ob.recuo-1)),o6={};rio.em(sk,o6);rg.position.set(o6.x+o6.nx*la,Math.max(.2,rio.altura(sk,la)),o6.z+o6.nz*la);g.add(rg)}}
      // RODADA 2 · torre ILUSTRATIVA (não há foto da torre real): na rádio de 1995, mastro estaiado de 36 m; na TV de 2014, torre autoportante de 58 m.
      if(p.torre){const est=p.obra==='radio1995',t=est?torre(K,36,{estais:true}):torre(K,58),o2={};rio.em(p.s+(est?22:p.torre[0]),o2);const la=e*(W+ob.recuo+(est?13:22));t.position.set(o2.x+o2.nx*la,Y_CL-.02,o2.z+o2.nz*la);t.rotation.y=rotBase+(est?Math.PI/4:0);g.add(t)}}
    else{for(const [f,ds,dl,rt,es] of cenarioVila(i,K)){const q=f(),lat=e*(W+dl),o2={};rio.em(p.s+ds,o2);const y=dl<0?(rt>1?-.06:0):Math.max(.2,rio.altura(p.s+ds,lat));q.position.set(o2.x+o2.nx*lat,dl<0?(rt>1?-.1:0):y,o2.z+o2.nz*lat);q.rotation.y=rotBase+rt;q.scale.setScalar(es);g.add(q);q.updateMatrixWorld(true);if(dl>=0)box.expandByObject(q)}
      if(i===2){const o2={},o4={};rio.em(p.s-16,o2);rio.em(p.s+22,o4);const la=e*(W-1);const b=bandeirolas(K,[o2.x+o2.nx*la,8,o2.z+o2.nz*la],[o4.x+o4.nx*la,8,o4.z+o4.nz*la],22);g.add(b)}}
    g.traverse(a=>{if(a.isMesh){a.castShadow=T>=1&&!a.userData.semSombra;a.receiveShadow=T>=1;const m=a.material;if(m&&m.isMeshStandardMaterial&&!m.userData.rio){m.userData.rio=true;integra(m)}}});
    const centro=box.getCenter(new THREE.Vector3());g.userData={si:p.s,e,caixa:box,centro,tam:box.getSize(new THREE.Vector3())};g.visible=false;cena.add(g);lista[i]=g;return g};
  // comunidades ribeirinhas entre as paradas: mais vida nas margens, sem narração e sem janela
  const extras=[];const conjunto=(t,K)=>{const P=v=>()=>palafita(K,v),T=(c,co)=>()=>trapiche(K,c,co),C=()=>canoa(K),Cg=()=>canoa(K,8,'#6a4a2e'),Ca=()=>capela(K);
    return [[[P(0),-12,13,.2,1],[P(2),12,17,-.3,1.05],[T(14),0,-3,0,1],[C,5,-8,1.4,1]],
      [[Ca,0,15,0,1],[P(1),-22,12,.3,1],[T(12),10,-3,0,1],[C,14,-7,1.5,1],[Cg,-6,-9,1.7,1]],
      [[T(22,true),-4,-3,0,1],[P(1),14,16,.15,1.1],[P(0),-18,18,-.2,1],[Cg,6,-10,1.5,1],[C,-12,-8,1.8,1]],
      [[P(2),-8,12,-.15,1.1],[P(0),14,15,.35,1],[T(10),2,-3,0,1],[C,7,-7,1.3,1]]][t%4]};
  const constroiExtras=()=>{EX.forEach((x,k)=>{const g=new THREE.Group(),e=x.e,po=rio.em(x.s),rotBase=Math.atan2(-po.nx*e,-po.nz*e),W=rio.larg(x.s);
      for(const [f,ds,dl,rt,es] of conjunto(x.t===undefined?k:x.t,K)){const q=f(),lat=e*(W+dl),o2={};rio.em(x.s+ds,o2);const y=dl<0?(rt>1?-.1:0):Math.max(.2,rio.altura(x.s+ds,lat));q.position.set(o2.x+o2.nx*lat,y,o2.z+o2.nz*lat);q.rotation.y=rotBase+rt;q.scale.setScalar(es);g.add(q)}
      if(x.festa){const o2={},o4={};rio.em(x.s-14,o2);rio.em(x.s+14,o4);const la=e*(W-1);g.add(bandeirolas(K,[o2.x+o2.nx*la,7,o2.z+o2.nz*la],[o4.x+o4.nx*la,7,o4.z+o4.nz*la],16))}
      g.traverse(a=>{if(a.isMesh){a.castShadow=T>=2;a.receiveShadow=T>=1;const m=a.material;if(m&&m.isMeshStandardMaterial&&!m.userData.rio){m.userData.rio=true;integra(m)}}});g.userData={si:x.s,e};g.visible=false;cena.add(g);extras.push(g)})};
  return {K,lista,constroi,clareiras:cl,extras,constroiExtras};
}
