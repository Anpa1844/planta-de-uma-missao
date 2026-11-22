// Aves em bando: uma geometria por espécie, muitas cópias, asas batendo no próprio shader. Pousadas, as asas dobram.
import * as THREE from 'three';
import {GLSL_LUZ,GLSL_LUZ_U,U} from './nucleo.js';
const c3=h=>{const q=new THREE.Color(h);return [q.r,q.g,q.b]};
const mis=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];

// def: L (corpo), R (raio), env (envergadura), corda, cauda, pescoco, bico, cores
function geo(def){const P=[],C=[],W=[],I=[];const v=(x,y,z,c,w=0,h=0,d=0)=>{P.push(x,y,z);C.push(...c);W.push(w,h,d);return P.length/3-1};
  const anel=(z,y,rx,ry,c,h=0)=>{const b=P.length/3;for(let j=0;j<7;j++){const a=j/7*6.283;v(Math.cos(a)*rx,y+Math.sin(a)*ry,z,typeof c==='function'?c(Math.sin(a)):c,0,h)}return b};
  const liga=(a,b)=>{for(let j=0;j<7;j++){const k=(j+1)%7;I.push(a+j,b+j,a+k,a+k,b+j,b+k)}};
  const L=def.L,R=def.R,cb=def.corBarriga||def.cor,cc=(s)=>mis(cb,def.cor,s*.5+.5);let an=[[-L*.5,0,.2*R,.2*R],[-L*.34,.0,.72*R,.72*R],[-L*.05,.0,R,R],[L*.2,.02,.92*R,.92*R]];let prev=null;for(const [z,y,rx,ry] of an){const n=anel(z,y,rx,ry,cc,0);if(prev!==null)liga(prev,n);prev=n}
  // pescoço e cabeça: a cabeça pode virar
  const Pz=def.pescoco||0,Py=def.pescocoY||.0;const cab=def.corCab||def.cor;let n1=anel(L*.34+Pz*.5,.05*L+Py*.5,R*(def.pescoco?.34:.72),R*(def.pescoco?.34:.72),def.pescoco?def.cor:cab,.5);liga(prev,n1);let n2=anel(L*.42+Pz,.08*L+Py,R*.62,R*.62,cab,1);liga(n1,n2);let n3=anel(L*.52+Pz,.09*L+Py,R*.5,R*.46,cab,1);liga(n2,n3);
  const bL=def.bico,bC=c3(def.corBico||'#222');const bi=anel(L*.56+Pz,.08*L+Py-(def.bicoCai||0)*.2,R*.42*(def.bicoG||1),R*.46*(def.bicoG||1),bC,1);liga(n3,bi);const pb=v(0,.07*L+Py-(def.bicoCai||0),L*.56+Pz+bL,bC,0,1);for(let j=0;j<7;j++)I.push(bi+j,pb,bi+(j+1)%7);
  // cauda
  const cc2=c3(def.corCauda||'#222');const tl=def.cauda,tw=def.caudaL||R*.8;{const a=v(-tw*.5,0,-L*.4,def.cor),b=v(tw*.5,0,-L*.4,def.cor),c=v(tw*.2,-.02,-L*.4-tl,cc2),d=v(-tw*.2,-.02,-L*.4-tl,cc2);I.push(a,b,c,a,c,d)}
  // asas
  const S=def.env/2,co=def.corda,cA=def.corAsa||def.cor,cB=def.corPonta||cA,cM=def.corMeio||mis(cA,cB,.5);for(const s of[-1,1]){const N=7;let pa=null;for(let i=0;i<=N;i++){const t=i/N,x=s*(R*.5+(S-R*.5)*t),cor=t<.5?mis(cA,cM,t*2):mis(cM,cB,t*2-1),ch=co*(1-t*t*.72),fr=L*.14+ch*.36*(1-t*.4),ze=(i%2?.14:0)*ch*(1-t*.2);const a=v(x,0,fr,cor,s*t,0,0),b=v(x,0,fr-ch-ze,mis(cor,[0,0,0],.14),s*t,0,0);if(pa!==null)I.push(pa,pa+1,a,a,pa+1,b);pa=a}}
  if(def.pernas){const pc=c3(def.pernas);for(const s of[-1,1]){const a=v(s*R*.2,-R*.5,-L*.3,pc),b=v(s*R*.2+.012,-R*.5,-L*.3,pc),e=v(s*R*.2,-R*.55,-L*.45-def.pernaL,pc);I.push(a,b,e)}}
  const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('aCor',new THREE.Float32BufferAttribute(C,3));g.setAttribute('aAsa',new THREE.Float32BufferAttribute(W,3));g.setIndex(I);g.computeVertexNormals();g.userData={env:def.env,R};return g}

const DEF={
  arara:{L:.46,R:.085,env:1.1,corda:.26,cauda:.5,caudaL:.09,bico:.1,bicoCai:.05,bicoG:1.5,cor:c3('#c8201a'),corCab:c3('#d0241c'),corBico:'#e8e2d0',corCauda:'#1a3e9a',corAsa:c3('#d6271e'),corMeio:c3('#ecc41e'),corPonta:c3('#1b45b4')},
  caninde:{L:.44,R:.08,env:1.04,corda:.25,cauda:.48,caudaL:.09,bico:.09,bicoCai:.05,bicoG:1.5,cor:c3('#1d62c8'),corBarriga:c3('#f0c21a'),corCab:c3('#1c6fd0'),corBico:'#17120e',corCauda:'#163f98',corAsa:c3('#1d62c8'),corPonta:c3('#123a90')},
  garca:{L:.46,R:.075,env:1.42,corda:.28,cauda:.09,bico:.13,cor:c3('#f6f4ec'),corCab:c3('#fbfaf4'),corBico:'#e8bb2e',corCauda:'#f2f0e8',pescoco:.3,pescocoY:.2,corAsa:c3('#f8f6ee'),pernas:'#1a1a14',pernaL:.3},
  tucano:{L:.34,R:.09,env:.62,corda:.15,cauda:.16,bico:.2,bicoCai:.03,bicoG:2,cor:c3('#0e0e10'),corCab:c3('#111113'),corBarriga:c3('#f0e2a8'),corBico:'#f08a12',corCauda:'#0d0d0f',corAsa:c3('#101012')},
  urubu:{L:.48,R:.1,env:1.5,corda:.38,cauda:.2,caudaL:.2,bico:.05,cor:c3('#111014'),corBico:'#6a6a60',corCauda:'#0d0c10',corAsa:c3('#0f0e12'),corPonta:c3('#242228')},
  papagaio:{L:.26,R:.06,env:.5,corda:.13,cauda:.12,bico:.04,bicoG:1.3,cor:c3('#2c9a32'),corCab:c3('#e8cc2c'),corBico:'#222',corCauda:'#1f7a2c',corAsa:c3('#2a9430'),corPonta:c3('#1a4e9a')},
  morcego:{L:.1,R:.03,env:.38,corda:.11,cauda:.0,caudaL:.02,bico:.01,cor:c3('#141014'),corBico:'#111',corCauda:'#111',corAsa:c3('#100c10')},
};
export class Aves{
  constructor(cena,cap=30){this.cena=cena;this.tipos={};this.cap=cap;
    this.mat=new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:GLSL_LUZ_U(),vertexShader:`attribute vec3 aCor,aAsa;attribute vec4 iP,iQ;attribute vec2 iR;uniform float uEnv;varying vec3 vC,vN,vMundo;void main(){vec3 p=position;float aw=abs(aAsa.x),sg=sign(aAsa.x);float fo=iQ.w;float f=sin(iQ.z),f2=sin(iQ.z-.8);
      vec3 nn=normal;if(aw>0.){p.y+=(f*aw*uEnv*.28+f2*aw*aw*uEnv*.2)*(1.-fo);p.x=mix(p.x,sg*(.05+aw*.02),fo);p.z=mix(p.z,p.z-aw*uEnv*.42,fo);p.y=mix(p.y,p.y+.03-aw*.06,fo);}
      if(aAsa.y>0.){float c=cos(iR.y*aAsa.y),s=sin(iR.y*aAsa.y);vec3 o=vec3(0.,.04,.16);p-=o;p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);p+=o;}
      p*=iP.w;float cp=cos(iQ.y),sp=sin(iQ.y);p=vec3(p.x,cp*p.y-sp*p.z,sp*p.y+cp*p.z);nn=vec3(nn.x,cp*nn.y-sp*nn.z,sp*nn.y+cp*nn.z);float cr=cos(iR.x),sr=sin(iR.x);p=vec3(cr*p.x-sr*p.y,sr*p.x+cr*p.y,p.z);float cy=cos(iQ.x),sy=sin(iQ.x);p=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);nn=vec3(cy*nn.x+sy*nn.z,nn.y,-sy*nn.x+cy*nn.z);vec3 w=p+iP.xyz;vC=aCor;vN=nn;vMundo=w;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
      fragmentShader:`${GLSL_LUZ}varying vec3 vC,vN,vMundo;void main(){vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;vec3 V=normalize(uCam-vMundo);vec3 c=vC*(ambiente(n)+uSolCor*max(dot(n,uSolDir)*.7+.3,0.)*(1.-copaEm(vMundo)*.85*step(vMundo.y,18.)));gl_FragColor=vec4(comNevoa(c,vMundo),1.);}`});}
  // reserva cópias: devolve um objeto com arrays que a cena preenche por quadro
  tipo(n,cap){if(this.tipos[n])return this.tipos[n];const g=geo(DEF[n]);cap=cap||this.cap;const aP=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4).setUsage(THREE.DynamicDrawUsage),aQ=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4).setUsage(THREE.DynamicDrawUsage),aR=new THREE.InstancedBufferAttribute(new Float32Array(cap*2),2).setUsage(THREE.DynamicDrawUsage);g.setAttribute('iP',aP);g.setAttribute('iQ',aQ);g.setAttribute('iR',aR);g.instanceCount=0;const m=new THREE.ShaderMaterial({side:THREE.DoubleSide,vertexShader:this.mat.vertexShader,fragmentShader:this.mat.fragmentShader,uniforms:{...this.mat.uniforms,uEnv:{value:DEF[n].env}}});const me=new THREE.Mesh(g,m);me.frustumCulled=false;me.renderOrder=3;this.cena.add(me);const t={g,aP,aQ,aR,n:0,cap,me};this.tipos[n]=t;return t}
  comeca(){for(const k in this.tipos)this.tipos[k].n=0}
  // yaw, pitch, fase da asa, dobra (1 pousada), rolagem, giro da cabeça
  poe(n,x,y,z,esc,yaw,pitch,fase,dobra=0,rol=0,cab=0){const t=this.tipos[n]||this.tipo(n);if(t.n>=t.cap)return;const k=t.n++;t.aP.array.set([x,y,z,esc],k*4);t.aQ.array.set([yaw,pitch,fase,dobra],k*4);t.aR.array.set([rol,cab],k*2)}
  termina(){for(const k in this.tipos){const t=this.tipos[k];t.g.instanceCount=t.n;t.me.visible=t.n>0;if(t.n){t.aP.needsUpdate=t.aQ.needsUpdate=t.aR.needsUpdate=true}}}
}
