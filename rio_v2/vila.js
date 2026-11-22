// Palafitas, trapiches, canoas e a capelinha: o começo da missão, tudo de madeira e tudo em código.
import * as THREE from 'three';
import {Obra} from './predios.js';

function telhado(o,mat,x0,x1,z0,z1,yE,yC){const xc=(x0+x1)/2;o.quad(mat,[x0,yE,z1],[xc,yC,z1],[xc,yC,z0],[x0,yE,z0]);o.quad(mat,[xc,yC,z1],[x1,yE,z1],[x1,yE,z0],[xc,yC,z0]);o.tri(mat,[x0,yE,z1],[x1,yE,z1],[xc,yC,z1]);o.tri(mat,[x1,yE,z0],[x0,yE,z0],[xc,yC,z0]);return o}
const palha=K=>K.tabua('#6f5e35',22);
export function palafita(K,v=0){const o=new Obra(K),W=5.6+v*1.3,D=4.6+(v%2)*1.2,P=2.5,H=2.5;const pa=K.tabua(['#6d5238','#7a5c3c','#5a4630'][v%3],10),pi=K.tabua('#8a6c4a',7),es=K.escuro,te=palha(K);
  for(const x of[-W/2,-W/6,W/6,W/2])for(const z of[-D/2,0,D/2,D/2+1.5])o.caixa(pi,x-.1,x+.1,-2.2,P,z-.1,z+.1);
  o.caixa(pi,-W/2-.3,W/2+.3,P,P+.14,-D/2-.3,D/2+1.7);
  o.caixa(pa,-W/2,W/2,P+.14,P+H,-D/2,-D/2+.08);o.caixa(pa,-W/2,-W/2+.08,P+.14,P+H,-D/2,D/2);o.caixa(pa,W/2-.08,W/2,P+.14,P+H,-D/2,D/2);o.caixa(pa,-W/2,W/2,P+.14,P+H,D/2-.08,D/2);
  o.caixa(es,-.48,.48,P+.14,P+2.1,D/2,D/2+.03);o.caixa(pi,-.58,-.48,P+.14,P+2.2,D/2,D/2+.07);o.caixa(pi,.48,.58,P+.14,P+2.2,D/2,D/2+.07);o.caixa(pi,-.58,.58,P+2.1,P+2.2,D/2,D/2+.07);
  for(const x of[-W/3,W/3]){o.caixa(es,x-.42,x+.42,P+1,P+1.85,D/2,D/2+.03);o.caixa(pi,x-.5,x+.5,P+.92,P+1,D/2,D/2+.1);o.caixa(pi,x-.5,x+.5,P+1.85,P+1.93,D/2,D/2+.07)}
  telhado(o,te,-W/2-.8,W/2+.8,-D/2-.7,D/2+2,P+H-.2,P+H+1.5);
  for(const x of[-W/2,W/2])o.caixa(pi,x-.05,x+.05,P+.14,P+H-.1,D/2+1.56,D/2+1.66);o.caixa(pi,-W/2,-.7,P+.8,P+.87,D/2+1.56,D/2+1.62);o.caixa(pi,.7,W/2,P+.8,P+.87,D/2+1.56,D/2+1.62);
  for(let i=0;i<7;i++){const y=P-i*.42,z=D/2+1.75+i*.3;o.caixa(pi,-.5,.5,y-.05,y,z,z+.26)}for(const x of[-.52,.52])o.quad(pi,[x,P,D/2+1.7],[x+.05,P,D/2+1.7],[x+.05,-.1,D/2+3.9],[x,-.1,D/2+3.9]);
  return o.fim();}
export function trapiche(K,C=18,cobertura=false){const o=new Obra(K),W=2.6,pi=K.tabua('#3e3024',6),de=K.tabua('#7c6448',8);
  for(let z=0;z<=C;z+=3)for(const x of[-W/2,W/2])o.caixa(pi,x-.13,x+.13,-3,1.6,z-.13,z+.13);
  o.caixa(de,-W/2-.15,W/2+.15,1.45,1.6,-1,C+.5);for(const x of[-W/2-.05,W/2+.05]){o.caixa(pi,x-.04,x+.04,1.6,2.4,-.5,C+.3);for(let z=0;z<=C;z+=3)o.caixa(pi,x-.05,x+.05,1.6,2.45,z-.05,z+.05)}
  if(cobertura){const y=4.6;for(const x of[-W/2,W/2])for(const z of[C-6,C-3,C])o.caixa(pi,x-.08,x+.08,1.6,y,z-.08,z+.08);telhado(o,palha(K),-W/2-.7,W/2+.7,C-7,C+.8,y-.2,y+1)}
  return o.fim();}
export function canoa(K,L=6.4,cor='#4e3a26'){const o=new Obra(K),m=K.plano(cor,.8),n=9,rings=[];const g=new THREE.BufferGeometry(),P=[],I=[];for(let i=0;i<=n;i++){const t=i/n,z=(t-.5)*L,b=Math.pow(Math.sin(t*Math.PI),.6)*.46,h=.18+Math.pow(Math.abs(t-.5)*2,3)*.3;for(let j=0;j<=6;j++){const a=j/6*Math.PI;P.push(Math.cos(a)*b,h-Math.sin(a)*.36*Math.sin(t*Math.PI)**.5,z)}}for(let i=0;i<n;i++)for(let j=0;j<6;j++){const a=i*7+j,b=a+1,c=a+7,d=c+1;I.push(a,b,c,b,d,c)}g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();o.add(m,g);
  for(const z of[-L*.28,0,L*.28])o.caixa(K.tabua('#6a543a',3),-.36,.36,.08,.13,z-.1,z+.1);const q=o.fim();q.traverse(a=>{if(a.material)a.material.side=THREE.DoubleSide});return q}
export function capela(K){const o=new Obra(K),W=7,L=11,P=1.5,H=3.8,br=K.tabua('#d8d2c2',12),pi=K.tabua('#6a543a',7),te=K.tabua('#6b4a34',18),es=K.escuro;
  for(const x of[-W/2,0,W/2])for(let z=-L;z<=0;z+=L/3)o.caixa(pi,x-.14,x+.14,-2,P,z-.14,z+.14);o.caixa(pi,-W/2-.3,W/2+.3,P,P+.16,-L-.3,2.2);
  o.caixa(br,-W/2,W/2,P+.16,P+H,-L,-L+.1);o.caixa(br,-W/2,-W/2+.1,P+.16,P+H,-L,0);o.caixa(br,W/2-.1,W/2,P+.16,P+H,-L,0);o.caixa(br,-W/2,W/2,P+.16,P+H,-.1,0);
  o.tri(br,[-W/2,P+H,0],[W/2,P+H,0],[0,P+H+2.3,0]);telhado(o,te,-W/2-.5,W/2+.5,-L-.5,.5,P+H-.1,P+H+2.5);
  o.caixa(es,-.8,.8,P+.16,P+2.8,0,.03);for(const z of[-2.8,-6,-9.2]){for(const [x,f] of[[W/2,0],[-W/2-.03,0]]){o.caixa(es,x,x+.03,P+1.2,P+3,z-.55,z+.55)}}
  o.caixa(es,-.5,.5,P+H+.1,P+H+.9,0,.03);
  o.caixa(K.plano('#f4efe4',.6),-.09,.09,P+H+2.2,P+H+4,-.05,.05);o.caixa(K.plano('#f4efe4',.6),-.55,.55,P+H+3.2,P+H+3.38,-.05,.05);
  for(let i=0;i<5;i++){const y=P-i*.32,z=2.2+i*.28;o.caixa(pi,-1,1,y-.06,y,z,z+.26)}
  return o.fim();}
// Bandeirolas para o dia da inauguração
export function bandeirolas(K,A,B,n=18){const g=new THREE.Group();const cores=['#c23b2e','#e8c23a','#2f6fb0','#f2efe6','#2f8a52'];const mats=cores.map(c=>{const m=new THREE.MeshStandardMaterial({color:c,roughness:.8,side:THREE.DoubleSide});return m});for(let i=0;i<n;i++){const t=(i+.5)/n,x=A[0]+(B[0]-A[0])*t,y=A[1]+(B[1]-A[1])*t-Math.sin(t*Math.PI)*1.2,z=A[2]+(B[2]-A[2])*t;const q=new THREE.BufferGeometry();q.setAttribute('position',new THREE.Float32BufferAttribute([-.2,0,0,.2,0,0,0,-.5,0],3));q.computeVertexNormals();const m=new THREE.Mesh(q,mats[i%5]);m.position.set(x,y,z);m.rotation.y=Math.atan2(B[0]-A[0],B[2]-A[2])+1.57;g.add(m)}return g}
