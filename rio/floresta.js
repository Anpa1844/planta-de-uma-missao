// A floresta inteira: distribui as espécies ao longo do rio, assa impostores na hora e desenha com poucas chamadas.
// Perto: malha real com tufos. Longe: o mesmo desenho assado em 8 vistas, reacendido pela luz do momento.
import * as THREE from 'three';
import {rng,sst,mix,clamp,ruido2,fbm2,matTela,passe} from './util.js';
import {U,GLSL_LUZ,GLSL_LUZ_U} from './nucleo.js';
import {criaVariante,PALETAS} from './arvores.js';
import {criaAtlas} from './folhas.js';

const MAXD=150;
const VARS=[['alta',101],['alta',102],['alta',103],['media',201],['media',202],['media',203],['embauba',301],['embauba',302],['sumauma',401],['ipe',501],['seca',601],['acai',701],['acai',702],['buriti',801],['moita',901],['moita',902],['moita',903],['sororoca',951],['samambaia',961],['aninga',971],['capim',981]];
const IDX={};VARS.forEach((v,i)=>{(IDX[v[0]]=IDX[v[0]]||[]).push(i)});
const COPA_TOPO=new Set(['alta','media','embauba','sumauma','ipe','buriti','acai']);
const CHAO=new Set(['sororoca','samambaia','aninga','capim']);

const VS_COMUM=`attribute vec4 iP,iQ;uniform vec4 uFaixa;uniform vec3 uCam;uniform vec3 uVento;uniform float uTempo;varying vec2 vFade;
vec3 giraY(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}
vec3 balanco(vec3 p,float seed){float w=sin(uTempo*.61+seed*40.)+.5*sin(uTempo*1.37+seed*91.);p.xz+=uVento.xz*w*uVento.y*p.y*p.y*.0012;return p;}
void fadeDe(vec3 base){float d=distance(uCam,base);vFade=vec2(smoothstep(uFaixa.x,uFaixa.y,d),1.-smoothstep(uFaixa.z,uFaixa.w,d));}`;
const FS_DITHER=`varying vec2 vFade;void dither(){if(vFade.x<.995||vFade.y<.995){float e=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));if(1.-e>vFade.x||e>vFade.y)discard;}}`;

const VS_CASCA=`${VS_COMUM}attribute float aA;varying vec3 vN,vMundo;varying vec2 vUv;varying float vA;
void main(){vec3 p=position*iP.w;p=giraY(balanco(p,iQ.y),iQ.x);vN=giraY(normal,iQ.x);vUv=uv;vA=aA;vec4 w=vec4(p+iP.xyz,1.);vMundo=w.xyz;fadeDe(iP.xyz);if(vFade.x*vFade.y<=0.){gl_Position=vec4(2.,2.,2.,1.);return;}gl_Position=projectionMatrix*viewMatrix*w;}`;
const FS_CASCA=`${GLSL_LUZ}${FS_DITHER}varying vec3 vN,vMundo;varying vec2 vUv;varying float vA;uniform vec3 uCascaA,uCascaB;
void main(){dither();float h0=texture2D(tRuido,vUv*vec2(.31,.085)).b,h1=texture2D(tRuido,vUv*vec2(1.3,.42)).a,gr=texture2D(tRuido,vUv*vec2(.09,.03)).r;float hh=h0*.72+h1*.28;
  vec3 dpx=dFdx(vMundo),dpy=dFdy(vMundo);float dhx=dFdx(hh),dhy=dFdy(hh);vec3 n=normalize(vN),r1=cross(dpy,n),r2=cross(n,dpx);float det=dot(dpx,r1);vec3 g=sign(det)*(dhx*r1+dhy*r2);vec3 n0=n;n=normalize(abs(det)*n-g*.42);
  vec3 alb=mix(uCascaB,uCascaA,smoothstep(.22,.78,hh))*(.72+.56*gr);
  float mus=smoothstep(.4,.72,texture2D(tRuido,vMundo.xz*.07+vUv*.13).g+n0.y*.32)*smoothstep(26.,4.,vMundo.y);alb=mix(alb,vec3(.075,.13,.03),mus*.7);
  float mar=smoothstep(2.6,1.2,vMundo.y+(gr-.5)*.9);alb=mix(alb,alb*vec3(.5,.46,.4),mar);
  float ao=vA*(.64+.36*smoothstep(.16,.5,hh));float cs=copaEm(vMundo)*(1.-smoothstep(uTopoC.w*.62,uTopoC.w*1.02,vMundo.y));float somb=1.-cs*.92;
  vec3 V=normalize(uCam-vMundo),L=uSolDir;float nl=max(dot(n,L),0.);vec3 c=alb*(ambiente(n)*ao+uSolCor*nl*ao*somb);
  float cr=pow(1.-max(dot(n0,V),0.),4.);c+=ambiente(vec3(0.,1.,0.))*cr*.055*ao;
  gl_FragColor=vec4(comNevoa(c,vMundo),1.);}`;

const VS_COPA=`${VS_COMUM}attribute vec3 aTan;attribute vec4 aI;uniform vec3 uPal[${PALETAS.length*2}];varying vec3 vN,vT,vMundo,vCA,vCB;varying vec2 vUv;varying vec4 vI;
void main(){vec3 p=position*iP.w;float fa=fract(aI.z);float cl=floor(aI.z);float sw=aI.w;
  p+=normal*sin(uTempo*2.7+fa*6.283+p.y*.6)*.05*sw*uVento.y*iP.w;
  if(sw>=.9||(sw<.5&&sw>.35)){}p.xz+=uVento.xz*sw*sin(uTempo*1.1+fa*6.283)*.4*uVento.y*smoothstep(.3,1.,sw);
  p=giraY(balanco(p,iQ.y),iQ.x);vN=giraY(normal,iQ.x);vT=giraY(aTan,iQ.x);vUv=uv;vec4 w=vec4(p+iP.xyz,1.);vMundo=w.xyz;fadeDe(iP.xyz);
  int pi=int(iQ.z)*2;float hu=fract(iQ.z);vec3 A=uPal[pi],B=uPal[pi+1];if(cl>.5&&cl<1.5){A=uPal[16];B=uPal[17];}
  A=mix(A,A*vec3(1.2,1.04,.6),hu);B=mix(B,B*vec3(1.1,1.,.75),hu);float br=.82+.36*iQ.w+aI.y*.1;vCA=A*br;vCB=B*br;vI=aI;
  if(vFade.x*vFade.y<=0.){gl_Position=vec4(2.,2.,2.,1.);return;}gl_Position=projectionMatrix*viewMatrix*w;}`;
const FS_COPA=(a2c)=>`${GLSL_LUZ}${FS_DITHER}uniform sampler2D tFolhas;uniform float uTamA,uFolha;varying vec3 vN,vT,vMundo,vCA,vCB;varying vec2 vUv;varying vec4 vI;
void main(){dither();vec4 t=texture2D(tFolhas,vUv);vec2 dx=dFdx(vUv)*uTamA,dy=dFdy(vUv)*uTamA;float lod=.5*log2(max(dot(dx,dx),dot(dy,dy)));float a=t.a*(1.+max(lod,0.)*.22);
  ${a2c?'a=(a-.5)/max(fwidth(a),.0001)+.5;if(a<=0.)discard;':'if(a<.5)discard;'}
  vec3 q=t.rgb/max(t.a,.02);vec2 ti=q.xy*2.-1.;float br=q.z;vec3 n=normalize(vN);vec3 T=normalize(vT-n*dot(vT,n)),B=cross(T,n);vec3 nf=normalize(n+(T*ti.x+B*ti.y)*.9);
  vec3 alb=mix(vCB,vCA,br*br*(3.-2.*br));float ao=vI.x;
  vec3 V=normalize(uCam-vMundo),L=uSolDir;float nl=dot(nf,L),dif=max(nl,0.),wr=max(nl*.5+.5,0.);float cs=copaEm(vMundo)*(1.-smoothstep(uTopoC.w*.62,uTopoC.w*1.02,vMundo.y));float somb=1.-cs*.9;
  float cv=max(dot(-V,L),0.);float tr=(cv*cv*cv*.85+.16)*(1.-max(dot(n,V),0.)*.5)*smoothstep(-.7,.3,-dot(n,L)+.25);
  vec3 c=alb*(ambiente(nf)*ao*(.5+.5*ao)*1.16+uSolCor*mix(dif,wr*wr,.3)*ao*somb*.86);
  c+=alb*vec3(.98,1.2,.46)*uSolCor*tr*ao*somb*.36*uFolha;
  vec3 H=normalize(L+V);float sp=pow(max(dot(nf,H),0.),36.);float fr=pow(1.-max(dot(nf,V),0.),4.);c+=uSolCor*sp*.045*ao*somb+uAmbCeu*fr*.09*ao;
  gl_FragColor=vec4(comNevoa(c,vMundo),${a2c?'clamp(a,0.,1.)':'1.'});}`;

// Impostor: billboard cilíndrico que escolhe a vista assada mais próxima
const VS_IMP=`${VS_COMUM}uniform vec2 uGrade;uniform float uVistas;uniform vec3 uPal[${PALETAS.length*2}];attribute vec3 iV;varying vec3 vMundo,vR,vF,vCA,vCB;varying vec2 vUv;varying float vEsc;
void main(){vec3 base=iP.xyz;vec3 ao=uCam-base;vec2 tc=normalize(ao.xz+1e-4);vec3 F=vec3(tc.x,0.,tc.y);vec3 R=vec3(F.z,0.,-F.x);float az=atan(tc.x,tc.y)-iQ.x;float k=floor(fract(az/6.28318530718+.5/uVistas)*uVistas);
  vec2 cel=vec2(k,iV.x);vUv=(cel+uv)/uGrade;
  float s=iP.w;vec3 w=base+R*(position.x*s)+vec3(0.,1.,0.)*(position.y*s*2.);
  float rot=k/uVistas*6.28318530718+iQ.x;vF=vec3(sin(rot),0.,cos(rot));vR=vec3(vF.z,0.,-vF.x);
  w.xz+=uVento.xz*sin(uTempo*.61+iQ.y*40.)*uVento.y*position.y*position.y*s*s*.0048;
  vMundo=w;fadeDe(base);int pi=int(iQ.z)*2;float hu=fract(iQ.z);vec3 A=uPal[pi],B=uPal[pi+1];A=mix(A,A*vec3(1.2,1.04,.6),hu);B=mix(B,B*vec3(1.1,1.,.75),hu);float br=.82+.36*iQ.w;vCA=A*br;vCB=B*br;
  if(vFade.x*vFade.y<=0.){gl_Position=vec4(2.,2.,2.,1.);return;}gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`;
const FS_IMP=(a2c)=>`${GLSL_LUZ}${FS_DITHER}uniform sampler2D tImp;uniform vec3 uCascaA;uniform float uTamI,uFolha;varying vec3 vMundo,vR,vF,vCA,vCB;varying vec2 vUv;
void main(){dither();vec4 t=texture2D(tImp,vUv);vec2 dx=dFdx(vUv)*uTamI,dy=dFdy(vUv)*uTamI;float lod=.5*log2(max(dot(dx,dx),dot(dy,dy)));float a=t.a*(1.+max(lod,0.)*.32);
  ${a2c?'a=(a-.5)/max(fwidth(a),.0001)+.5;if(a<=0.)discard;':'if(a<.5)discard;'}
  vec3 q=t.rgb/max(t.a,.02);vec2 nx=q.xy*2.-1.;float nz=sqrt(max(1.-dot(nx,nx),0.));vec3 n=normalize(vR*nx.x+vec3(0.,1.,0.)*nx.y+vF*nz);float b=q.z;
  vec3 alb;float ao;if(b<.25){ao=b*4.;alb=uCascaA*.8;}else{float k=(b-.25)/.75;ao=clamp(k*1.25,0.,1.);alb=mix(vCB,vCA,clamp(k*1.1,0.,1.));}
  vec3 V=normalize(uCam-vMundo),L=uSolDir;float nl=dot(n,L),dif=max(nl,0.),wr=max(nl*.5+.5,0.);float cs=copaEm(vMundo)*(1.-smoothstep(uTopoC.w*.62,uTopoC.w*1.02,vMundo.y));float somb=1.-cs*.88;
  float cv=max(dot(-V,L),0.);float tr=(cv*cv*cv*.85+.14)*smoothstep(-.7,.3,-nl+.25);
  vec3 c=alb*(ambiente(n)*ao*(.42+.58*ao)+uSolCor*mix(dif,wr*wr,.42)*ao*somb);if(b>=.25)c+=alb*vec3(1.1,1.22,.5)*uSolCor*tr*ao*somb*.6*uFolha;
  gl_FragColor=vec4(comNevoa(c,vMundo),${a2c?'clamp(a,0.,1.)':'1.'});}`;

// Passes de assar: gravam normal (R,G) e a rampa (B: casca de 0 a .25; folha de .25 a 1)
const VS_ASSA_C=`attribute float aA;varying vec3 vN;varying vec2 vUv;varying float vA;void main(){vN=mat3(viewMatrix)*normal;vUv=uv;vA=aA;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}`;
const FS_ASSA_C=`uniform sampler2D tRuido;varying vec3 vN;varying vec2 vUv;varying float vA;void main(){vec3 n=normalize(vN);float h=texture2D(tRuido,vUv*vec2(.31,.085)).b;gl_FragColor=vec4(n.xy*.5+.5,clamp(vA*(.5+.5*h)*.25,0.,.245),1.);}`;
const VS_ASSA_F=`attribute vec3 aTan;attribute vec4 aI;varying vec3 vN,vT;varying vec2 vUv;varying vec4 vI;void main(){vN=mat3(viewMatrix)*normal;vT=mat3(viewMatrix)*aTan;vUv=uv;vI=aI;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}`;
const FS_ASSA_F=`uniform sampler2D tFolhas;varying vec3 vN,vT;varying vec2 vUv;varying vec4 vI;void main(){vec4 t=texture2D(tFolhas,vUv);if(t.a<.42)discard;vec3 q=t.rgb/max(t.a,.02);vec3 n=normalize(vN);vec3 T=normalize(vT-n*dot(vT,n)),B=cross(T,n);vec3 nf=normalize(n+(T*(q.x*2.-1.)+B*(q.y*2.-1.))*.9);if(nf.z<0.)nf=reflect(nf,vec3(0.,0.,1.));
  float br=q.z*q.z*(3.-2.*q.z);float b=.25+.75*clamp(br*(.3+.7*vI.x),0.,1.);gl_FragColor=vec4(nf.xy*.5+.5,b,1.);}`;

// Cores de casca por espécie
const CASCAS={padrao:['#6a5238','#231911'],palida:['#a59a84','#4e4638']};

export class Floresta{
  constructor(r,T,rio,{amostras=0}={}){this.r=r;this.T=T;this.rio=rio;this.a2c=amostras>0;this.grupo=new THREE.Group();this.grupoReflexo=new THREE.Group();
    this.R0=[0,0,70][T];this.R1=[46,86,175][T];this.Rf=[420,620,960][T];this.BAND=[6,10,14][T];this.capI=[2600,6500,16000][T];this.cap0=[0,0,44][T];this.cap1=[8,34,120][T];this.capC=[8,60,180][T];this.dt=0;this.ultimoCam=new THREE.Vector3(1e9,0,0);this.ultDir=new THREE.Vector3();this.tempoUlt=0;}
  async constroi(progresso,trechoLivre){const T=this.T,r=this.r;
    this.tFolhas=criaAtlas(T);progresso&&progresso(.1);
    const uPal=[];for(const [a,b] of PALETAS){uPal.push(new THREE.Color(a),new THREE.Color(b))}this.uPal={value:uPal};
    const uC=()=>({...GLSL_LUZ_U(),uVento:U.uVento,uFolha:{value:1},uPal:this.uPal,tFolhas:{value:this.tFolhas},uTamA:{value:this.tFolhas.tamanho},uFaixa:{value:new THREE.Vector4()},uCascaA:{value:new THREE.Color(CASCAS.padrao[0])},uCascaB:{value:new THREE.Color(CASCAS.padrao[1])}});
    this.mats=[];
    const mCasca=(fx,c)=>{const m=new THREE.ShaderMaterial({vertexShader:VS_CASCA,fragmentShader:FS_CASCA,uniforms:uC()});m.uniforms.uFaixa.value.set(...fx);if(c){m.uniforms.uCascaA.value.set(c[0]);m.uniforms.uCascaB.value.set(c[1])}this.mats.push(m);return m};
    const mCopa=fx=>{const m=new THREE.ShaderMaterial({vertexShader:VS_COPA,fragmentShader:FS_COPA(this.a2c),uniforms:uC(),side:THREE.DoubleSide,alphaToCoverage:this.a2c});m.uniforms.uFaixa.value.set(...fx);this.mats.push(m);return m};
    const R0=this.R0,R1=this.R1,B=this.BAND,Rf=this.Rf;const f0=[-2,-1,R0-B,R0],f1=R0>0?[R0-B,R0,R1-B,R1]:[-2,-1,R1-B,R1],fC=[-2,-1,R1*.55,R1*.7];
    // Geometrias: os grupos de instâncias
    this.vars=VARS.map(([nome,sem],i)=>{const chao=CHAO.has(nome);const lodBaixo=T===0?2:1;const g1=criaVariante(nome,sem,lodBaixo),g0=(!chao&&T===2)?criaVariante(nome,sem,0):null,gB=g0||criaVariante(nome,sem,T===0?1:0);return {i,nome,chao,g1,g0,gB,raio:g1.raio,H:g1.H,topo:COPA_TOPO.has(nome),S:g1.S}});progresso&&progresso(.4);
    const criaGrupo=(geos,cap,fx,palida)=>{const aP=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4),aQ=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4);aP.setUsage(THREE.DynamicDrawUsage);aQ.setUsage(THREE.DynamicDrawUsage);const ms=[];
      const mk=(g,mat)=>{const q=new THREE.InstancedBufferGeometry();q.index=g.index;for(const k in g.attributes)q.setAttribute(k,g.attributes[k]);q.setAttribute('iP',aP);q.setAttribute('iQ',aQ);q.instanceCount=0;const me=new THREE.Mesh(q,mat);me.frustumCulled=false;me.visible=false;this.grupo.add(me);ms.push(me)};
      if(geos.casca)mk(geos.casca,mCasca(fx,palida?CASCAS.palida:null));if(geos.copa)mk(geos.copa,mCopa(fx));return {aP,aQ,ms,n:0,cap}};
    this.g0=[];this.g1=[];for(const v of this.vars){const pal=v.S.cascaP;this.g1.push(criaGrupo(v.g1.g,v.chao?this.capC:this.cap1,v.chao?fC:f1,pal));this.g0.push(v.g0?criaGrupo(v.g0.g,this.cap0,f0,pal):null)}
    this.assaImpostores();progresso&&progresso(.7);
    this.distribui();progresso&&progresso(.95);
    this.topoInst();}
  // ---------- impostores ----------
  assaImpostores(){const r=this.r,T=this.T,V=8,lista=this.vars.filter(v=>!v.chao),N=lista.length,cel=[96,128,224][T];this.imV=V;this.imL=N;
    const w=V*cel,h=N*cel;const rtM=new THREE.WebGLRenderTarget(w,h,{samples:r.capabilities.maxSamples>=4?4:0,depthBuffer:true,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
    const cena=new THREE.Scene(),cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,400);const mC=new THREE.ShaderMaterial({vertexShader:VS_ASSA_C,fragmentShader:FS_ASSA_C,uniforms:{tRuido:U.tRuido}}),mF=new THREE.ShaderMaterial({vertexShader:VS_ASSA_F,fragmentShader:FS_ASSA_F,uniforms:{tFolhas:{value:this.tFolhas}},side:THREE.DoubleSide});
    const sc=r.getClearColor(new THREE.Color()),sa=r.getClearAlpha(),sac=r.autoClear;r.setClearColor(0x808000,0);r.autoClear=false;r.setRenderTarget(rtM);r.clear();
    lista.forEach((v,li)=>{const G=v.gB.g,ms=[];if(G.casca)ms.push(new THREE.Mesh(G.casca,mC));if(G.copa)ms.push(new THREE.Mesh(G.copa,mF));for(const m of ms){m.frustumCulled=false;cena.add(m)}
      const Rq=Math.max(v.gB.raio*1.04,v.gB.H*.52,1);v.Rq=Rq;v.li=li;cam.left=-Rq;cam.right=Rq;cam.top=Rq*2;cam.bottom=0;cam.near=.1;cam.far=Rq*4+10;cam.updateProjectionMatrix();
      for(let k=0;k<V;k++){const a=k/V*Math.PI*2;cam.position.set(Math.sin(a)*(Rq+5),0,Math.cos(a)*(Rq+5));cam.up.set(0,1,0);cam.lookAt(0,0,0);cam.position.y=0;cam.updateMatrixWorld();const yy=(N-1-li)*cel;rtM.viewport.set(k*cel,yy,cel,cel);rtM.scissor.set(k*cel,yy,cel,cel);rtM.scissorTest=true;r.setRenderTarget(rtM);r.render(cena,cam)}
      for(const m of ms)cena.remove(m)});
    rtM.scissorTest=false;rtM.viewport.set(0,0,w,h);rtM.scissor.set(0,0,w,h);
    const rtF=new THREE.WebGLRenderTarget(w,h,{depthBuffer:false,stencilBuffer:false,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,anisotropy:[1,2,4][T]});
    // na cópia, o fundo vazio vira preto para os mapas menores saírem pré-multiplicados
    const cp=matTela(`uniform sampler2D tC;varying vec2 vUv;void main(){vec4 c=texture2D(tC,vUv);gl_FragColor=vec4(c.rgb*c.a,c.a);}`,{tC:{value:rtM.texture}});passe(r,cp,rtF);cp.dispose();rtM.dispose();r.setRenderTarget(null);r.setClearColor(sc,sa);r.autoClear=sac;
    this.tImp=rtF.texture;if(typeof window!=='undefined')window.__impRT=rtF;
    for(const v of this.vars){v.g1.g.casca&&0}
    // Malha do impostor
    const q=new THREE.InstancedBufferGeometry();q.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-1,0,0,1,0,0,1,1,0,-1,1,0]),3));q.setAttribute('uv',new THREE.BufferAttribute(new Float32Array([0,0,1,0,1,1,0,1]),2));q.setIndex([0,1,2,0,2,3]);
    const cap=this.capI;this.iP=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4).setUsage(THREE.DynamicDrawUsage);this.iQ=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4).setUsage(THREE.DynamicDrawUsage);this.iV=new THREE.InstancedBufferAttribute(new Float32Array(cap),1).setUsage(THREE.DynamicDrawUsage);q.setAttribute('iP',this.iP);q.setAttribute('iQ',this.iQ);q.setAttribute('iV',this.iV);q.instanceCount=0;
    const Rf=this.Rf,R1=this.R1,B=this.BAND;this.fxI=new THREE.Vector4(R1-B,R1,Rf-60,Rf);
    this.mImp=new THREE.ShaderMaterial({vertexShader:VS_IMP.replace('attribute vec3 iV','attribute float iV').replace('iV.x','iV'),fragmentShader:FS_IMP(this.a2c),uniforms:{...GLSL_LUZ_U(),uVento:U.uVento,uFolha:{value:1},uPal:this.uPal,tImp:{value:this.tImp},uTamI:{value:w/V*V},uGrade:{value:new THREE.Vector2(V,N)},uVistas:{value:V},uFaixa:{value:this.fxI},uCascaA:{value:new THREE.Color(CASCAS.padrao[0])}},alphaToCoverage:this.a2c});
    this.imp=new THREE.Mesh(q,this.mImp);this.imp.frustumCulled=false;this.grupo.add(this.imp);this.geoImp=q;}
  // ---------- distribuição ----------
  distribui(){const rio=this.rio,T=this.T,R=rng(4242),L=rio.L;const ps=[9,7.4,6.2][T];const X=[],Y=[],Z=[],E=[],Ro=[],Se=[],Va=[],Pa=[],Br=[],Sc=[];
    const pick=l=>l[Math.floor(R()*l.length)];const LIVRES=rio.ROT.livres||[];const livre=(ss,lado,dj)=>{for(const [a,la,ds,dm] of LIVRES)if(la===lado&&Math.abs(ss-a)<ds&&dj<dm)return true;return false};
    const add=(nome,x,y,z,s,esc)=>{const idx=pick(IDX[nome]),v=this.vars[idx];const pl=pick(v.S.pal);X.push(x);Y.push(y);Z.push(z);E.push(esc);Ro.push(R()*6.283);Se.push(R());Va.push(idx);Pa.push(pl+(R()<.5?R()*.45:0));Br.push(R());Sc.push(s)};
    const o={};
    for(let s=3;s<L;s+=ps){for(const lado of[-1,1]){const W=rio.borda(s,lado),al=rio.alag(s),pr=rio.praia(s),pe=rio.pedra(s),Wc=rio.larg(s);
      const ini=al>.02?mix(-1,-(W-Wc*.78+8),al):-1.5;
      for(let d=ini;d<MAXD;d+=ps*(1+Math.max(d,0)*.0045)){const ss=s+(R()-.5)*ps*.9,dj=d+(R()-.5)*ps*.8,lat=lado*(W+dj);if(Math.abs(lat)<Wc*.74)continue;
        const c=rio.clareira(ss,lat);if(c.k>.05||livre(ss,lado,dj))continue;const h=rio.altura(ss,lat);rio.mundo(ss,lat,o);
        const emAgua=h<-.25;if(emAgua&&(al<.3||h<-1.6))continue;if(pr>.3&&dj<pr*30)continue;if(pe>.4&&dj<8&&R()<.8)continue;
        const nA=fbm2(ss*.012+3,lat*.012,2),nB=fbm2(ss*.031,lat*.031+8,2),u=R();let nome=null;
        if(dj<3.5&&!emAgua){nome=u<.5?'moita':u<.62?'embauba':u<.7?'media':null}
        else if(dj<20){nome=nA>.58&&u<.5?'acai':u<.3?'embauba':u<.68?'media':u<.8?'moita':u<.9?'alta':u<.92?'seca':u<.93?'ipe':null}
        else{nome=nA<.36&&u<.5?'buriti':nA>.6&&u<.4?'acai':u<.5?'alta':u<.72?'media':u<.75?'sumauma':u<.8?'embauba':u<.815?'ipe':u<.85?'seca':'moita'}
        if(emAgua){nome=u<.26?'alta':u<.72?'media':u<.84?'buriti':u<.92?'seca':'embauba';if(R()<.34)nome=null}
        if(pe>.4&&nome==='alta')nome='media';
        if(!nome||(nB<.3&&R()<.5))continue;const es=nome==='moita'?.8+R()*.7:.82+R()*.42;add(nome,o.px,h-.02,o.pz,ss,es)}
      // moitas e plantas de beira d'água
      if(T>0||s%(ps*2)<ps)for(let q=0;q<3;q++){const ss=s+(R()-.5)*ps,dj=-2+R()*16,lat=lado*(W+dj);if(pr>.5)continue;const c=rio.clareira(ss,lat);if(c.k>.05||livre(ss,lado,dj))continue;const h=rio.altura(ss,lat);if(h<-.5&&al<.3)continue;rio.mundo(ss,lat,o);const u=R();if(h<.25){if(u<.6)add('aninga',o.px,Math.max(h,-.3),o.pz,ss,.8+R()*.6);else if(u<.9)add('capim',o.px,Math.max(h,-.2),o.pz,ss,.9+R()*.7)}else{const k=u<.3?'moita':u<.55?'sororoca':u<.8?'samambaia':'capim';add(k,o.px,h-.02,o.pz,ss,.8+R()*.6)}}
    }}
    // beira das clareiras: moldura de palmeiras e moitas, sem tampar a obra
    for(const c of rio.clareiras){for(const sd of[-1,1])for(let k=0;k<6;k++){const ss=c.s+sd*(c.ds+4+R()*18),lat=c.e*(rio.larg(c.s)+6+R()*(c.l1+20));const h=rio.altura(ss,lat);if(h<.1)continue;rio.mundo(ss,lat,o);add(R()<.45?'acai':R()<.5?'buriti':'moita',o.px,h-.02,o.pz,ss,.85+R()*.3)}}
    for(const [nm,sq,la,dl,es] of (rio.ROT.especiais||[])){const lat=la*(rio.borda(sq,la)+dl),h=rio.altura(sq,lat);rio.mundo(sq,lat,o);add(nm,o.px,h-.02,o.pz,sq,es)}
    const n=this.n=X.length;this.X=Float32Array.from(X);this.Y=Float32Array.from(Y);this.Z=Float32Array.from(Z);this.E=Float32Array.from(E);this.Ro=Float32Array.from(Ro);this.Se=Float32Array.from(Se);this.Va=Uint8Array.from(Va);this.Pa=Float32Array.from(Pa);this.Br=Float32Array.from(Br);
    // blocos ao longo do rio
    const TC=this.TC=120,nc=Math.ceil(L/TC)+1,bl=this.blocos=[];for(let i=0;i<nc;i++){const e={};rio.em(Math.min(L-1,(i+.5)*TC),e);bl.push({x:e.x,z:e.z,raio:TC*.5+rio.larg((i+.5)*TC)+MAXD+50,l:[]})}
    for(let i=0;i<n;i++)bl[Math.max(0,Math.min(nc-1,Math.floor(Sc[i]/TC)))].l.push(i);for(const b of bl)b.l=Uint32Array.from(b.l);
    if(typeof window!=='undefined')window.__arvores=n;}
  topoInst(){}
  // ---------- atualização: escolhe o que entra em cada grupo, sem custo por quadro quando a câmera está parada ----------
  atualiza(cam,forca,dt){this.dt+=dt;const p=cam.position;const f=cam.getWorldDirection(this._d||(this._d=new THREE.Vector3()));
    if(!forca&&this.dt<.2)return;if(!forca&&this.ultimoCam.distanceToSquared(p)<4&&this.ultDir.dot(f)>.995)return;this.dt=0;this.ultimoCam.copy(p);this.ultDir.copy(f);
    const asp=cam.aspect,hf=Math.atan(Math.tan(cam.fov*Math.PI/360)*asp)+.42;let cosL=Math.cos(Math.min(hf,Math.PI));const fl=Math.hypot(f.x,f.z);const fx=f.x/(fl||1),fz=f.z/(fl||1);if(fl<.45)cosL=-2;
    const {X,Y,Z,E,Ro,Se,Va,Pa,Br}=this;const Rf=this.Rf,R0=this.R0,R1=this.R1,Rc=R1*.7;const iP=this.iP.array,iQ=this.iQ.array,iV=this.iV.array;let ni=0;const capI=this.capI;for(const g of this.g1)g.n=0;for(const g of this.g0)if(g)g.n=0;
    const vars=this.vars,ordem=this._ord||(this._ord=[]);ordem.length=0;for(const b of this.blocos){const d=Math.hypot(b.x-p.x,b.z-p.z);if(d-b.raio<Rf){b._d=d;ordem.push(b)}}ordem.sort((a,b)=>a._d-b._d);
    for(const b of ordem){const l=b.l;for(let q=0;q<l.length;q++){const i=l[q],dx=X[i]-p.x,dz=Z[i]-p.z,d2=dx*dx+dz*dz;if(d2>Rf*Rf)continue;const d=Math.sqrt(d2);const vv=vars[Va[i]];const rc=vv.raio*E[i];if(d>rc+6&&(dx*fx+dz*fz)/d<cosL)continue;const pa=Pa[i],bq=Br[i];
        if(vv.chao){if(d<Rc){const g=this.g1[vv.i];if(g.n<g.cap){const k=g.n*4;g.aP.array[k]=X[i];g.aP.array[k+1]=Y[i];g.aP.array[k+2]=Z[i];g.aP.array[k+3]=E[i];g.aQ.array[k]=Ro[i];g.aQ.array[k+1]=Se[i];g.aQ.array[k+2]=pa;g.aQ.array[k+3]=bq;g.n++}}continue}
        if(d<R0){const g=this.g0[vv.i];if(g&&g.n<g.cap){const k=g.n*4;g.aP.array[k]=X[i];g.aP.array[k+1]=Y[i];g.aP.array[k+2]=Z[i];g.aP.array[k+3]=E[i];g.aQ.array[k]=Ro[i];g.aQ.array[k+1]=Se[i];g.aQ.array[k+2]=pa;g.aQ.array[k+3]=bq;g.n++}}
        if(d<R1&&d>R0-this.BAND-1){const g=this.g1[vv.i];if(g.n<g.cap){const k=g.n*4;g.aP.array[k]=X[i];g.aP.array[k+1]=Y[i];g.aP.array[k+2]=Z[i];g.aP.array[k+3]=E[i];g.aQ.array[k]=Ro[i];g.aQ.array[k+1]=Se[i];g.aQ.array[k+2]=pa;g.aQ.array[k+3]=bq;g.n++}}
        if(ni<capI){const k=ni*4;iP[k]=X[i];iP[k+1]=Y[i];iP[k+2]=Z[i];iP[k+3]=E[i]*vv.Rq;iQ[k]=Ro[i];iQ[k+1]=Se[i];iQ[k+2]=pa;iQ[k+3]=bq;iV[ni]=this.imL-1-vv.li;ni++}}}
    const sobe=g=>{if(!g)return;for(const m of g.ms){m.geometry.instanceCount=g.n;m.visible=g.n>0}g.aP.needsUpdate=true;g.aQ.needsUpdate=true};for(const g of this.g1)sobe(g);for(const g of this.g0)sobe(g);
    this.geoImp.instanceCount=ni;this.iP.needsUpdate=this.iQ.needsUpdate=this.iV.needsUpdate=true;this.ni=ni;}
  // no reflexo só entram os impostores, inclusive os de perto
  modoReflexo(sim){for(const g of this.g1)for(const m of g.ms)m.userData.vis=sim?(m.userData.vis=m.visible,false):m.userData.vis;
    if(sim){this._v=[];for(const g of [...this.g1,...this.g0]){if(!g)continue;for(const m of g.ms){this._v.push(m,m.visible);m.visible=false}}this.fxI.x=-2;this.fxI.y=-1}else{for(let i=0;i<this._v.length;i+=2)this._v[i].visible=this._v[i+1];this.fxI.x=this.R1-this.BAND;this.fxI.y=this.R1}}
}
