// A floresta usa os modelos originais do Tripo em forma de retratos de 8 ângulos (ver preparo/impostor.py):
// cada árvore é um cartão de 2 triângulos que troca de ângulo conforme a câmera anda, com a aparência do modelo completo.
import * as THREE from 'three';
import {LARG,alturaMargem,acaso} from './mundo.js';

const VS=`attribute vec4 aP;attribute vec3 aT;uniform float uS,uQ;uniform float uT;varying vec2 vA,vB;varying float vK,vH,vD;varying vec3 vC,vV;
void main(){
  vec3 base=aP.xyz;float es=aT.x,rot=aP.w,esp=aT.y;
  vec3 ate=cameraPosition-base;float az=atan(ate.x,ate.z)-rot;float f=fract(az/6.28318)*8.;float i0=floor(f);vK=f-i0;float i1=mod(i0+1.,8.);
  vec2 q=uv;if(esp<0.)q.x=1.-q.x;
  vA=(vec2(mod(i0,4.),1.-floor(i0/4.))+q)/vec2(4.,2.);vB=(vec2(mod(i1,4.),1.-floor(i1/4.))+q)/vec2(4.,2.);
  vec2 h=normalize(ate.xz+1e-4);vec3 dir=vec3(h.y,0.,-h.x);
  float y=uv.y;float vento=sin(uT*.8+base.x*.07+base.z*.05)*y*y*.012*uS*es;
  vec3 w=base+dir*((uv.x-.5)*uS*es*abs(esp)+vento)+vec3(0.,y*uS*es,0.);
  vec4 m=viewMatrix*vec4(w,1.);vD=-m.z;vH=y;vC=mix(vec3(1.),vec3(aT.z,1.,mix(1.,aT.z,.5)),1.);vV=normalize(w-cameraPosition);
  gl_Position=projectionMatrix*m;}`;
const FS=`uniform sampler2D t;uniform vec3 uSol,uNevoa,uLuzSol,uLuzCeu,uLuzChao;uniform float uDens,uHora;varying vec2 vA,vB;varying float vK,vH,vD;varying vec3 vC,vV;
void main(){if(fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))*52.9829)>smoothstep(7.,17.,vD))discard;vec4 a=texture2D(t,vA),b=texture2D(t,vB);vec4 c=mix(a,b,vK);float al=c.a;if(al<.42)discard;
  vec3 cor=c.rgb*vC;
  // luz do céu de cima para baixo, sol de lado e a contraluz dourada quando o sol está atrás da copa
  float altura=smoothstep(.05,.8,vH);vec3 luz=mix(uLuzChao,uLuzCeu,altura);
  float contra=pow(max(dot(vV,uSol),0.),4.)*smoothstep(.2,.9,vH);
  vec3 r=cor*(luz+uLuzSol*(.36+.34*altura))+cor*uLuzSol*contra*.9;
  float f=1.-exp(-pow(vD*uDens,1.6));gl_FragColor=vec4(mix(r,uNevoa,f),1.);}`;

export async function criaFloresta(tr,cena,uni,T,clareiras,tl,extras=[]){
  const meta=await (await fetch('viagem/imp/meta.json')).json();
  const sufixo=T>=2?'_a':'_b';
  // quanto de cada espécie e em que faixa da margem, em metros a partir da beira do rio
  const ESP=[
    {n:'moita',qt:[1500,2600,3600][T],d:[-1,16],es:[.9,2.2],y:-.2},
    {n:'moita',qt:[700,1200,1700][T],d:[8,70],es:[1.6,3.4],y:-.2},
    {n:'tropical',qt:[420,760,1000][T],d:[5,24],es:[.42,.72],y:-.3},
    {n:'tropical',qt:[520,950,1300][T],d:[16,70],es:[.72,1.12],y:-.3},
    {n:'tropical',qt:[420,760,1000][T],d:[50,140],es:[1.1,1.75],y:-.3},
    {n:'kapok',qt:[50,90,120][T],d:[28,130],es:[.85,1.35],y:-.5},
    {n:'acai_a',qt:[150,260,340][T],d:[1,30],es:[.6,1.1],y:-.2},
    {n:'acai_b',qt:[150,260,340][T],d:[1,36],es:[.7,1.15],y:-.2},
    {n:'palma_a',qt:[90,160,220][T],d:[4,60],es:[.8,1.3],y:-.2},
    {n:'palma_b',qt:[90,160,220][T],d:[4,60],es:[.8,1.3],y:-.2}];
  const un={uSol:uni.uSol,uNevoa:uni.uNevoa,uDens:uni.uDens,uHora:uni.uHora,uT:uni.uT,uLuzSol:{value:new THREE.Color(1,1,1)},uLuzCeu:{value:new THREE.Color(1,1,1)},uLuzChao:{value:new THREE.Color(.3,.3,.3)}};
  const tex={},mat={};
  await Promise.all([...new Set([...ESP.map(e=>e.n),...extras.map(e=>e.n)])].map(async n=>{const t=await tl.loadAsync(`viagem/imp/${n}${sufixo}.webp`);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;tex[n]=t;
    mat[n]=new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:FS,side:THREE.DoubleSide,uniforms:{...un,t:{value:t},uS:{value:meta[n].S},uQ:{value:0}}})}));
  const dentroClareira=(s,lat)=>clareiras.some(c=>Math.abs(s-c.s)<c.ds&&lat*c.e>0&&Math.abs(lat)-LARG<c.l1);
  const po={},blocos=[],L=tr.L,TB=170,NB=Math.ceil(L/TB),plano=new THREE.PlaneGeometry(1,1);plano.translate(.5,.5,0);
  const grupos=new Map();
  for(const e of ESP){const porB=Math.ceil(e.qt/NB);
    for(let b=0;b<NB;b++){const chave=e.n+'|'+b;let g=grupos.get(chave);if(!g){g={n:e.n,b,p:[],t:[]};grupos.set(chave,g)}
      let k=0;for(let j=0;j<porB*4&&k<porB;j++){const si=(b+acaso())*TB,lado=acaso()<.5?-1:1,d=e.d[0]+acaso()*acaso()*(e.d[1]-e.d[0]),lat=lado*(LARG+d);if(dentroClareira(si,lat))continue;tr.em(si,po);const es=e.es[0]+acaso()*(e.es[1]-e.es[0]);
        g.p.push(po.x+po.nx*lat,Math.max(.1,alturaMargem(lat,si))+e.y,po.z+po.nz*lat,acaso()*6.283);g.t.push(es,acaso()<.5?-1:1,.86+acaso()*.28);k++}}}
  for(const x of extras){const b=Math.min(NB-1,Math.max(0,Math.floor(x.s/TB))),chave=x.n+'|'+b;let g=grupos.get(chave);if(!g){g={n:x.n,b,p:[],t:[]};grupos.set(chave,g)}g.p.push(x.x,x.y,x.z,acaso()*6.283);g.t.push(x.es,1,1)}
  for(const g of grupos.values()){const n=g.p.length/4;if(!n)continue;const ig=new THREE.InstancedBufferGeometry();ig.index=plano.index;ig.setAttribute('position',plano.attributes.position);ig.setAttribute('uv',plano.attributes.uv);ig.setAttribute('normal',plano.attributes.normal);ig.setAttribute('aP',new THREE.InstancedBufferAttribute(new Float32Array(g.p),4));ig.setAttribute('aT',new THREE.InstancedBufferAttribute(new Float32Array(g.t),3));ig.instanceCount=n;
    let cx=0,cz=0;for(let i=0;i<n;i++){cx+=g.p[i*4];cz+=g.p[i*4+2]}cx/=n;cz/=n;let rm=0;for(let i=0;i<n;i++)rm=Math.max(rm,Math.hypot(g.p[i*4]-cx,g.p[i*4+2]-cz));ig.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx,20,cz),rm+70);
    const m=new THREE.Mesh(ig,mat[g.n]);m.frustumCulled=true;cena.add(m);tr.em((g.b+.5)*TB,po);blocos.push({o:m,x:po.x,z:po.z})}
  return {blocos,un};
}
// Muralha contínua de copas: fecha o fundo, nada de horizonte vazio entre os troncos
export function muralha(tr,cena,uni,tx){
  const passo=10,n=Math.ceil(tr.L/passo),pos=[],uv=[],idx=[],o={};let k=0;
  for(const e of[-1,1])for(const lat of[LARG+120,LARG+210]){const b=k;for(let i=0;i<=n;i++){const s=i*passo;tr.em(s,o);const al=(lat>LARG+150?56:42)+Math.sin(s*.021+e)*7+Math.sin(s*.057+lat)*4.5;const x=o.x+o.nx*e*lat,z=o.z+o.nz*e*lat;pos.push(x,-1,z,x,al,z);uv.push(s*.03,0,s*.03,1)}for(let i=0;i<n;i++){const a=b+i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}k+=(n+1)*2}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
  const m=new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{t:{value:tx},uHora:uni.uHora,uNevoa:uni.uNevoa,uDens:uni.uDens},vertexShader:`varying vec2 vU;varying float vD;void main(){vU=uv;vec4 m=modelViewMatrix*vec4(position,1.);vD=-m.z;gl_Position=projectionMatrix*m;}`,
    fragmentShader:`uniform sampler2D t;uniform float uHora;uniform vec3 uNevoa;uniform float uDens;varying vec2 vU;varying float vD;void main(){float n=texture2D(t,vU*vec2(1.,.6)).r*.6+texture2D(t,vU*vec2(3.1,1.8)).g*.4;float top=1.-smoothstep(.72+n*.3,.8+n*.3,vU.y);if(top<.5)discard;vec3 c=mix(vec3(.012,.03,.014),vec3(.07,.13,.05),n*vU.y*1.2);c*=mix(.4,1.2,uHora);float f=1.-exp(-pow(vD*uDens,1.6));gl_FragColor=vec4(mix(c,uNevoa,f),1.);}`});
  const e=new THREE.Mesh(g,m);e.frustumCulled=false;cena.add(e);return e;
}
