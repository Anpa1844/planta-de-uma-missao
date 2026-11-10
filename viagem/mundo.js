// O mundo da viagem: rio, margens, céu, névoa e floresta. Unidade: metro.
import * as THREE from 'three';
export const PASSO=120;export let LARG=34;export const defineLarg=v=>{LARG=v};
let semente=11;export const acaso=()=>(semente=(semente*16807)%2147483647)/2147483647;
const ruido=(x,y)=>Math.sin(x*.031+Math.sin(y*.017)*2)*Math.cos(y*.023+Math.sin(x*.013)*1.7);

export function caminho(n){
  const p=[];for(let i=-2;i<n+4;i++)p.push(new THREE.Vector3(Math.sin(i*.8)*44+Math.sin(i*.31)*30,0,-i*PASSO));
  const c=new THREE.CatmullRomCurve3(p,false,'catmullrom',.5);c.arcLengthDivisions=2400;return c;
}
// amostra pré-calculada: posição, tangente e normal por metro de rio
export function trilho(c){
  const L=c.getLength(),N=Math.ceil(L/2),P=new Float32Array((N+1)*2),T=new Float32Array((N+1)*2),a=new THREE.Vector3(),b=new THREE.Vector3();
  for(let i=0;i<=N;i++){const u=i/N;c.getPointAt(u,a);c.getTangentAt(u,b);P[i*2]=a.x;P[i*2+1]=a.z;T[i*2]=b.x;T[i*2+1]=b.z}
  const em=(s,o={})=>{const f=Math.max(0,Math.min(N-1e-3,s/L*N)),i=f|0,k=f-i;o.x=P[i*2]+(P[i*2+2]-P[i*2])*k;o.z=P[i*2+1]+(P[i*2+3]-P[i*2+1])*k;o.tx=T[i*2]+(T[i*2+2]-T[i*2])*k;o.tz=T[i*2+1]+(T[i*2+3]-T[i*2+1])*k;const l=Math.hypot(o.tx,o.tz);o.tx/=l;o.tz/=l;o.nx=o.tz;o.nz=-o.tx;return o};
  return {L,N,em};
}
let CLAREIRAS=[];export const defineClareiras=l=>{CLAREIRAS=l};
const sstM=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
export const alturaMargem=(lat,s)=>{ // lat em metros a partir do eixo do rio
  const d=Math.abs(lat)-LARG+ruido(s,lat)*4.5;if(d<0)return -2.2*Math.min(1,-d/9);
  const r=Math.min(1,d/22);let y=r*r*(3-2*r)*(3.4+ruido(s*.7,lat*.4+40)*1.6)+Math.max(0,d-30)*.05*(1+ruido(lat,s)*.5);
  for(const c of CLAREIRAS){const ds=Math.abs(s-c.s);if(ds>c.ds+26||lat*c.e<=0)continue;const l=Math.abs(lat)-LARG,k=(1-sstM(c.ds,c.ds+24,ds))*(1-sstM(c.l1,c.l1+28,l))*sstM(1,9,l);y=y*(1-k)+c.y*k}
  return y;
};
function faixa(tr,passo,lats,fn){
  const n=Math.ceil(tr.L/passo),m=lats.length,pos=new Float32Array((n+1)*m*3),uv=new Float32Array((n+1)*m*2),idx=[],o={};
  for(let i=0;i<=n;i++){const s=i*passo;tr.em(s,o);for(let j=0;j<m;j++){const l=lats[j],k=(i*m+j)*3;pos[k]=o.x+o.nx*l;pos[k+1]=fn?fn(l,s):0;pos[k+2]=o.z+o.nz*l;uv[(i*m+j)*2]=s;uv[(i*m+j)*2+1]=l;
    if(i<n&&j<m-1){const a=i*m+j,b=a+1,c=a+m,d=c+1;idx.push(a,c,b,b,c,d)}}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
const CEU_GLSL=`
uniform vec3 uSol;uniform float uHora;uniform float uT;uniform sampler2D tRuido;
vec3 ceuCor(vec3 d){
  float h=max(d.y,0.);float s=max(dot(d,uSol),0.);float a=smoothstep(-.32,.5,uSol.y);float dia=smoothstep(-.05,.45,uSol.y);
  vec3 alto=mix(vec3(.012,.018,.05),vec3(.19,.38,.74),a);vec3 meio=mix(vec3(.05,.07,.15),vec3(.5,.66,.86),a);
  vec3 hor=mix(vec3(.16,.13,.2),mix(vec3(1.25,.56,.24),vec3(.9,.86,.8),dia),smoothstep(-.3,.02,uSol.y));
  vec3 c=mix(hor,meio,pow(smoothstep(0.,.32,h),.7));c=mix(c,alto,smoothstep(.2,.95,h));
  c+=vec3(1.2,.5,.2)*pow(s,10.)*.55*(1.-dia*.7)*smoothstep(-.3,0.,uSol.y);c+=vec3(1.3,.95,.7)*pow(s,120.)*.8;c+=vec3(9.,6.5,4.)*smoothstep(.99965,.9998,s);
  return c;
}
vec3 nuvens(vec3 d,vec3 c){
  if(d.y<.015)return c;vec2 p=d.xz/(d.y+.08)*.09;float t=uT*.0035;
  float n=texture2D(tRuido,p+vec2(t,0.)).r*.62+texture2D(tRuido,p*2.3-vec2(t*1.4,t)).g*.28+texture2D(tRuido,p*5.1).b*.1;
  float m=smoothstep(.52,.72,n)*smoothstep(.015,.14,d.y);float s=max(dot(d,uSol),0.);float a=smoothstep(-.3,.45,uSol.y);
  vec3 sombra=mix(vec3(.05,.05,.1),mix(vec3(.5,.26,.28),vec3(.62,.66,.72),smoothstep(0.,.4,uSol.y)),a);vec3 luz=mix(vec3(.2,.16,.2),mix(vec3(1.7,.8,.42),vec3(1.2,1.16,1.1),smoothstep(.02,.45,uSol.y)),a);
  vec3 nv=mix(sombra,luz,smoothstep(.72,.5,n)*.7+pow(s,6.)*.5);return mix(c,nv,m*.92);
}`;
export function ceu(cena,uni){
  const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:uni,
    vertexShader:`varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*mat4(mat3(modelViewMatrix))*vec4(position,1.);gl_Position=p.xyww;}`,
    fragmentShader:CEU_GLSL+`varying vec3 vD;float est(vec3 d){vec3 q=floor(d*190.);float r=fract(sin(dot(q,vec3(12.9,78.2,37.7)))*43758.5);return step(.9965,r)*r;}
    void main(){vec3 d=normalize(vD);vec3 c=ceuCor(d);c+=est(d)*smoothstep(.1,-.14,uSol.y)*smoothstep(0.,.2,d.y)*.9;c=nuvens(d,c);gl_FragColor=vec4(c,1.);}`});
  const e=new THREE.Mesh(new THREE.SphereGeometry(10,32,18),m);e.frustumCulled=false;e.renderOrder=-10;cena.add(e);return e;
}
export function agua(tr,uni,lats){
  const m=new THREE.ShaderMaterial({uniforms:uni,fog:false,transparent:false,
    vertexShader:`uniform mat4 uTM;varying vec3 vP;varying vec2 vU;varying vec4 vR;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;vR=uTM*w;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:CEU_GLSL+`
    uniform sampler2D tNormal;uniform sampler2D tReflexo;uniform float uTemReflexo;uniform vec3 uBarco;uniform vec2 uRumo;uniform float uVel;uniform vec4 uToq;uniform vec3 uNevoa;uniform float uDens;uniform float uLarg;
    varying vec3 vP;varying vec2 vU;varying vec4 vR;
    void main(){
      float t=uT;vec2 fluxo=vec2(vU.x*.05+t*.05,vU.y*.05);vec2 fl2=vec2(vU.x*.012+t*.016,vU.y*.012+.3);
      vec3 n1=texture2D(tNormal,fluxo).xyz*2.-1.;vec3 n2=texture2D(tNormal,fl2).xyz*2.-1.;vec3 n3=texture2D(tNormal,fluxo*.31+vec2(.37,t*.006)).xyz*2.-1.;
      float dCam=length(cameraPosition-vP);vec2 dn=(n1.xy*.11+n2.xy*.09+n3.xy*.05)*mix(1.,.42,smoothstep(14.,170.,dCam));
      vec2 r=vP.xz-uBarco.xz;float dist=length(r);float ao=dot(r,uRumo);float la=dot(r,vec2(uRumo.y,-uRumo.x));
      float rast=smoothstep(-2.,-70.,ao)*smoothstep(1.,0.,abs(abs(la)-(-ao)*.26)/(1.4-ao*.02));
      float ondaW=sin((-ao)*1.05-abs(la)*.7-t*4.)*rast*uVel;dn+=vec2(la>0.?1.:-1.,0.)*ondaW*.34;
      float prox=smoothstep(10.,4.,dist);dn+=normalize(r+.01)*sin(dist*2.2-t*3.)*prox*.05*(.4+uVel);
      float tq=t-uToq.w;if(tq>0.&&tq<5.){float dq=distance(vP.xz,uToq.xz);dn+=normalize(vP.xz-uToq.xz+.01)*sin(dq*2.2-tq*7.)*exp(-abs(dq-tq*5.)*.6)*(1.-tq/5.)*.7;}
      vec3 N=normalize(vec3(dn.x,1.,dn.y));vec3 V=normalize(cameraPosition-vP);float nv=max(dot(N,V),0.);float F=.02+.98*pow(1.-nv,5.);F=clamp(F*1.15,0.,1.);
      vec3 R=reflect(-V,N);R.y=abs(R.y);vec3 cR=ceuCor(R);
      float borda=smoothstep(uLarg-18.,uLarg-1.,abs(vU.y));
      if(uTemReflexo>.5){vec2 uv=vR.xy/vR.w+dn*vec2(.035,.075);float es=.0045+abs(dn.y)*.06;vec4 q=texture2D(tReflexo,uv)*.32+texture2D(tReflexo,uv+vec2(0.,es))*.2+texture2D(tReflexo,uv-vec2(0.,es))*.2+texture2D(tReflexo,uv+vec2(0.,es*2.2))*.14+texture2D(tReflexo,uv-vec2(0.,es*2.2))*.14;cR=mix(cR,q.rgb/max(q.a,.001),smoothstep(.02,.5,q.a));}
      else{float mata=smoothstep(.34,.0,R.y);cR=mix(cR,vec3(.03,.06,.03)*(.25+uHora*1.1),mata*(.45+borda*.5));}
      float dia=smoothstep(-.12,.5,uSol.y);vec3 fundo=mix(vec3(.01,.01,.01),vec3(.075,.056,.032),dia);fundo=mix(fundo,fundo*1.8+vec3(.03,.024,.012),borda);
      vec3 c=mix(fundo,cR,F);
      vec3 H=normalize(uSol+V);float sp=pow(max(dot(N,H),0.),700.);c+=vec3(6.,4.2,2.8)*sp*smoothstep(-.06,.06,uSol.y);c+=vec3(1.4,.8,.45)*pow(max(dot(N,H),0.),70.)*.07*smoothstep(-.1,.1,uSol.y);
      float esp=rast*smoothstep(.1,.9,texture2D(tNormal,vU*.09).r)*uVel;float proa=smoothstep(7.,2.,dist)*uVel*smoothstep(.45,.75,texture2D(tNormal,vP.xz*.2+t*.03).g);
      float mar=smoothstep(uLarg-3.,uLarg+.8,abs(vU.y))*smoothstep(.5,.72,texture2D(tNormal,vU*.13+t*.01).r);
      c+=vec3(.75,.72,.66)*(esp*.55+proa*.42+mar*.14)*(.25+dia*.75);
      float d=length(cameraPosition-vP);float nf=1.-exp(-pow(d*uDens,1.6));c=mix(c,uNevoa,nf);
      gl_FragColor=vec4(c,1.);}`});
  const e=new THREE.Mesh(faixa(tr,5,lats),m);e.frustumCulled=false;return e;
}
export function terreno(tr,uni){
  const l=[];for(let v=LARG-16;v<=LARG+130;v+=(v<LARG+24?2.6:v<LARG+60?7:16))l.push(v);const lats=[...l.map(v=>-v).reverse(),...l];
  const g=faixa(tr,5,lats,alturaMargem);const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,metalness:0});
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{tSolo:uni.tRuido2,uLargT:{value:LARG}});
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vS;varying float vA;').replace('#include <begin_vertex>','#include <begin_vertex>\nvS=uv;vA=position.y;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vS;varying float vA;uniform sampler2D tSolo;uniform float uLargT;').replace('#include <color_fragment>',`#include <color_fragment>
      vec3 q=texture2D(tSolo,vS*.11).rgb;vec3 q2=texture2D(tSolo,vS*.021).rgb;float d=abs(vS.y)-uLargT+(q2.r-.5)*14.;
      vec3 lama=mix(vec3(.2,.14,.09),vec3(.33,.25,.16),q.r);vec3 capim=mix(vec3(.09,.15,.04),vec3(.2,.27,.07),q.g*.7+q2.g*.5);vec3 mata=mix(vec3(.03,.05,.02),vec3(.07,.09,.03),q.b);
      vec3 c=mix(lama,capim,smoothstep(.2,5.,d+vA*.8));c=mix(c,mata,smoothstep(14.,34.,d));c*=.72+q.r*.56;float mol=smoothstep(.6,-.6,vA+.2);c=mix(c,vec3(.075,.05,.03),mol);diffuseColor.rgb=c;`);};
  const e=new THREE.Mesh(g,m);e.frustumCulled=false;e.receiveShadow=true;return e;
}
// Bandos de névoa baixa: somem conforme o sol sobe
export function nevoa(tr,cena,uni,n){
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),gr=x.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'rgba(255,255,255,.52)');gr.addColorStop(.55,'rgba(255,255,255,.16)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(c),mt=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,uniforms:{t:{value:t},uCor:{value:new THREE.Color(1,1,1)},uOp:{value:.5},uT:uni.uT},
    vertexShader:`attribute vec3 aP;attribute float aS;varying vec2 vU;varying float vF;uniform float uT;void main(){vU=uv;vec4 m=viewMatrix*vec4(aP+vec3(sin(uT*.03+aP.z)*5.,0.,0.),1.);float d=-m.z;vF=smoothstep(34.,110.,d)*smoothstep(460.,300.,d);m.xy+=position.xy*aS*vec2(2.3,1.);gl_Position=projectionMatrix*m;}`,
    fragmentShader:`uniform sampler2D t;uniform vec3 uCor;uniform float uOp;varying vec2 vU;varying float vF;void main(){float a=texture2D(t,vU).a*uOp*vF;gl_FragColor=vec4(uCor,a);}`});
  const g=new THREE.InstancedBufferGeometry();g.copy(new THREE.PlaneGeometry(1,1));g.instanceCount=n;const p=new Float32Array(n*3),s=new Float32Array(n),o={};
  for(let i=0;i<n;i++){tr.em(acaso()*tr.L,o);const l=(acaso()-.5)*LARG*2.3;p[i*3]=o.x+o.nx*l;p[i*3+1]=2.4+acaso()*4;p[i*3+2]=o.z+o.nz*l;s[i]=14+acaso()*20}
  g.setAttribute('aP',new THREE.InstancedBufferAttribute(p,3));g.setAttribute('aS',new THREE.InstancedBufferAttribute(s,1));
  const e=new THREE.Mesh(g,mt);e.frustumCulled=false;e.renderOrder=5;cena.add(e);return mt;
}
// Cartazes da mata ao fundo: uma parede contínua de copas atrás das árvores 3D
export function fundoMata(tr,cena,uni,tex,n){
  const mt=new THREE.ShaderMaterial({transparent:false,alphaTest:.5,uniforms:{t:{value:tex},uSol:uni.uSol,uHora:uni.uHora,uNevoa:uni.uNevoa,uDens:uni.uDens,uT:uni.uT},
    vertexShader:`attribute vec3 aP;attribute vec2 aS;attribute float aF;varying vec2 vU;varying float vD;varying float vL;uniform float uT;
      void main(){float k=aF;vU=vec2((uv.x+mod(k,4.))/4.,uv.y);vec3 p=aP;vec3 dir=normalize(vec3(cameraPosition.x-p.x,0.,cameraPosition.z-p.z));vec3 di=vec3(dir.z,0.,-dir.x);
      float vento=sin(uT*.8+aP.x*.07+aP.z*.05)*uv.y*uv.y*.012*aS.y;vec3 w=p+di*((position.x)*aS.x+vento)+vec3(0.,(position.y+.5)*aS.y,0.);vec4 m=viewMatrix*vec4(w,1.);vD=-m.z;vL=.75+fract(aP.x*.37)*.5;gl_Position=projectionMatrix*m;}`,
    fragmentShader:`uniform sampler2D t;uniform vec3 uSol;uniform float uHora;uniform vec3 uNevoa;uniform float uDens;varying vec2 vU;varying float vD;varying float vL;
      void main(){vec4 c=texture2D(t,vU);if(c.a<.5)discard;vec3 l=mix(vec3(.16,.2,.3),vec3(1.05,.95,.8),uHora);vec3 r=c.rgb*l*vL;float nf=1.-exp(-pow(vD*uDens,1.6));gl_FragColor=vec4(mix(r,uNevoa,nf),1.);}`});
  const g=new THREE.InstancedBufferGeometry();g.copy(new THREE.PlaneGeometry(1,1));g.instanceCount=n;const p=new Float32Array(n*3),s=new Float32Array(n*2),f=new Float32Array(n),o={};
  for(let i=0;i<n;i++){const si=acaso()*tr.L;tr.em(si,o);const e=acaso()<.5?-1:1,l=e*(LARG+20+acaso()*acaso()*110);p[i*3]=o.x+o.nx*l;p[i*3+1]=Math.max(0,alturaMargem(l,si))-1;p[i*3+2]=o.z+o.nz*l;const h=20+acaso()*20;s[i*2]=h*(.75+acaso()*.35);s[i*2+1]=h;f[i]=Math.floor(acaso()*4)}
  g.setAttribute('aP',new THREE.InstancedBufferAttribute(p,3));g.setAttribute('aS',new THREE.InstancedBufferAttribute(s,2));g.setAttribute('aF',new THREE.InstancedBufferAttribute(f,1));
  const e=new THREE.Mesh(g,mt);e.frustumCulled=false;cena.add(e);return e;
}
// Vento: curva a copa dos modelos instanciados
export function comVento(m,uT){
  m.onBeforeCompile=sh=>{sh.uniforms.uT=uT;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;').replace('#include <begin_vertex>',`#include <begin_vertex>
    #ifdef USE_INSTANCING
    float ph=instanceMatrix[3][0]*.08+instanceMatrix[3][2]*.06;float k=max(position.y,0.);k=k*k*.012;transformed.x+=sin(uT*.9+ph)*k;transformed.z+=cos(uT*.7+ph)*k*.7;
    #endif`)};return m;
}
// Revoadas sobre o rio: duas asas em silhueta, batendo no shader
export function aves(tr,cena,uni,n){
  const g=new THREE.InstancedBufferGeometry();const v=new Float32Array([0,0,.28, -1,0,0, 0,0,-.28, 0,0,.28, 0,0,-.28, 1,0,0]);g.setAttribute('position',new THREE.BufferAttribute(v,3));g.instanceCount=n;
  const p=new Float32Array(n*4),o={};for(let i=0;i<n;i++){const b=Math.floor(i/9);const s=(b*137.5+40)%tr.L;tr.em(s,o);p[i*4]=o.x+(acaso()-.5)*46;p[i*4+1]=22+acaso()*26;p[i*4+2]=o.z+(acaso()-.5)*46;p[i*4+3]=acaso()*6.28}
  g.setAttribute('aP',new THREE.InstancedBufferAttribute(p,4));
  const m=new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{uT:uni.uT},vertexShader:`attribute vec4 aP;uniform float uT;void main(){float t=uT+aP.w*3.;float ba=sin(t*7.+aP.w);vec3 q=position*1.05;q.y=abs(position.x)*ba*.62;float d=t*.09+aP.w;vec3 c=aP.xyz+vec3(cos(d)*150.,sin(t*.3)*3.,sin(d)*150.);float a=d+1.57;mat2 r=mat2(cos(a),sin(a),-sin(a),cos(a));q.xz=r*q.xz;gl_Position=projectionMatrix*viewMatrix*vec4(c+q,1.);}`,fragmentShader:`void main(){gl_FragColor=vec4(.035,.03,.03,1.);}`});
  const e=new THREE.Mesh(g,m);e.frustumCulled=false;cena.add(e);return e;
}
// Folhas de vitória-régia junto às margens
export function vitorias(tr,cena,n){
  const g=new THREE.CircleGeometry(1,20);g.rotateX(-Math.PI/2);const m=new THREE.MeshStandardMaterial({color:0x4d7a35,roughness:.42,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});const im=new THREE.InstancedMesh(g,m,n),d=new THREE.Object3D(),o={};
  for(let i=0;i<n;i++){const base=Math.floor(i/7)*97.3%tr.L,s=base+acaso()*16,e=Math.floor(i/7)%2?1:-1,l=e*(LARG-3.5-acaso()*7);tr.em(s,o);d.position.set(o.x+o.nx*l,.13,o.z+o.nz*l);d.scale.setScalar(.35+acaso()*.7);d.updateMatrix();im.setMatrixAt(i,d.matrix)}
  im.frustumCulled=false;cena.add(im);return im;
}
