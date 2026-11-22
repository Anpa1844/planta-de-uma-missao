// A água: espelho que recebe sombra, reflexo plano, ondas de várias escalas, brilho do sol e um tanque de ondas em tempo real ao redor do barco.
import * as THREE from 'three';
import {passe,matTela,sst} from './util.js';
import {U,GLSL_LUZ,GLSL_LUZ_U} from './nucleo.js';

const VS=`varying vec3 vMundo;varying vec4 vR;uniform mat4 uRefMat;void main(){vec4 w=modelMatrix*vec4(position,1.);vMundo=w.xyz;vR=uRefMat*w;gl_Position=projectionMatrix*viewMatrix*w;}`;
const NAQ=[8,16,20];
const FS=(q)=>`#define NA ${NAQ[q]}
${GLSL_LUZ}uniform sampler2D tNormal,tReflexo,tSim;uniform vec4 uSimC;uniform vec3 uCorpo,uCorpoRaso;uniform float uF0,uOnda,uEsp,uSimOn,uChuva,uSimG,uVel;uniform vec3 uBarco;uniform vec2 uRumo;uniform vec4 uEncontro;uniform vec3 uCor2;uniform vec4 uCasco;uniform vec4 uAnel[NA];uniform int uAnelN;
varying vec3 vMundo;varying vec4 vR;
${q>=1?`uniform sampler2D uSombraMapa;uniform mat4 uSombraMat;uniform float uSombraLiga;
float sombra(vec3 wp){if(uSombraLiga<.5)return 1.;vec4 c=uSombraMat*vec4(wp,1.);vec3 s=c.xyz/c.w;if(s.x<0.||s.x>1.||s.y<0.||s.y>1.||s.z>1.)return 1.;float t=0.;float e=${q>=2?'.0016':'.0026'};
  vec2 o[5];o[0]=vec2(0.);o[1]=vec2(e,e*.4);o[2]=vec2(-e*.4,e);o[3]=vec2(-e,-e*.4);o[4]=vec2(e*.4,-e);for(int i=0;i<5;i++){vec4 v=texture2D(uSombraMapa,s.xy+o[i]);float d=dot(v,vec4(1./16777216.,1./65536.,1./256.,1.)*(255./256.));t+=step(s.z-.0012,d);}return t*.2;}`:'float sombra(vec3 wp){return 1.;}'}
float anel(vec2 p,float t0){vec2 i=floor(p),f=fract(p)-.5;float ph=fract(sin(dot(i,vec2(12.9898,78.233)))*43758.5453);vec2 o=(vec2(fract(ph*37.3),fract(ph*91.7))-.5)*.5;float t=fract(t0*1.3+ph);float r=length(f-o);float w=smoothstep(.09,.0,abs(r-t*.5))*(1.-t);return w*sin((r-t*.5)*90.);}
void main(){vec3 wp=vMundo;vec3 vv=uCam-wp;float dist=length(vv);vec3 V=vv/dist;
  vec2 q1=wp.xz*.031+uTempo*vec2(.011,.007),q2=wp.xz*.097-uTempo*vec2(.019,.014),q3=wp.xz*.33+uTempo*vec2(.035,-.03);
  vec3 a=texture2D(tNormal,q1).xyz,b=texture2D(tNormal,q2).xyz,c=texture2D(tNormal,q3).xyz;
  float lon=smoothstep(30.,520.,dist);vec2 g=((a.xy-.5)*1.15+(b.xy-.5)*.8+(c.xy-.5)*.28*(1.-lon))*uOnda*mix(.5,.24,lon)*clamp(uCam.y/3.,.16,1.);
  float espuma=0.;
  ${q>=1?`if(uSimOn>.5){vec2 su=(wp.xz-uSimC.xy)*uSimC.z+.5;if(su.x>.01&&su.x<.99&&su.y>.01&&su.y<.99){float e=uSimC.w;float hL=texture2D(tSim,su-vec2(e,0.)).r,hR=texture2D(tSim,su+vec2(e,0.)).r,hD=texture2D(tSim,su-vec2(0.,e)).r,hU=texture2D(tSim,su+vec2(0.,e)).r;vec2 sg=vec2(hL-hR,hD-hU);float borda=smoothstep(.01,.12,su.x)*smoothstep(.99,.88,su.x)*smoothstep(.01,.12,su.y)*smoothstep(.99,.88,su.y);g+=sg*uSimG*borda;espuma=texture2D(tSim,su).b*borda;}}`:''}
  // V6 rodada 2 · esteira do barco (parada em relação ao casco): braços em V de Kelvin (~19,5°), ondas transversais, bigode de proa e rastro turbulento de popa.
  // espB = espuma creme (água barrenta), já recortada por ruído; tudo cresce com a velocidade (uVel = v/11) e some com o barco parado.
  float espB=0.,ondaH=0.;
  if(uVel>.02){vec2 d=wp.xz-uBarco.xz;float al=dot(d,uRumo),la=dot(d,vec2(uRumo.y,-uRumo.x)),ala=abs(la);vec2 nn=vec2(uRumo.y,-uRumo.x)*(la<0.?-1.:1.);
    float kv=smoothstep(.04,1.,uVel),kf=smoothstep(.1,.9,uVel);float tr=uCasco.x+.4-al;
    if(tr>0.&&tr<170.&&ala<tr*.5+6.){float w=ala/max(tr,1.5);float cai=exp(-tr*.016)*smoothstep(0.,4.,tr);float lam=1.3+2.4*uVel;
      float bw=(w-.3)/.075;float br=exp(-bw*bw);float cd=cos((tr*.56+ala*.83)*6.2832/lam);g+=(nn*.83-uRumo*.56)*cd*br*cai*.42*kv;ondaH+=cd*br*cai*kv;
      float den=smoothstep(.34,.18,w);float ctv=cos(tr*6.2832/(lam*2.2))*den*exp(-tr*.03)*smoothstep(8.,16.,tr)*kv;g-=uRumo*ctv*.1;ondaH+=ctv*.4;
      espB+=br*smoothstep(.5,.95,cd)*smoothstep(.3,.62,texture2D(tRuido,wp.xz*.19).a)*exp(-tr*.05)*smoothstep(1.,5.,tr)*.6*kf;}
    // bigode de proa e fio de espuma ao longo do costado
    {float hw=uCasco.z*sqrt(clamp((uCasco.x+.15-al)/5.2,0.,1.));float dl=ala-hw;float longo=smoothstep(uCasco.y-.5,uCasco.y+1.,al)*smoothstep(uCasco.x+.9,uCasco.x-.2,al);
      if(longo>0.&&dl<2.2){float fre=smoothstep(-3.,uCasco.x-1.,al);float big=smoothstep(.35+1.4*kf*fre,0.,dl)*longo*(.3+.7*fre);espB+=big*smoothstep(.22,.55,texture2D(tRuido,wp.xz*.55+uTempo*.03).g+big*.3)*kf;}}
    // rastro turbulento de popa: alarga e se desfaz em manchas até ~50 m
    {float ts=uCasco.y+.3-al;if(ts>0.&&ts<90.){float ws=1.25+ts*.065;float I=exp(-ts/20.)*smoothstep(ws,ws*.35,ala)*smoothstep(0.,1.2,ts);
      if(I>.004){float rn=texture2D(tRuido,wp.xz*.11+uTempo*.006).r*.6+texture2D(tRuido,wp.xz*.47-uTempo*.02).g*.5;float th=mix(.74,.26,I);espB+=smoothstep(th,th+.3,rn)*(.4+.6*smoothstep(.25,.7,texture2D(tRuido,wp.xz*1.3).a))*min(.62,I*2.)*kf;g*=1.-.45*I*kf;}}}}
  // anéis na água (boto, martim-pescador, peixe): fila circular em uniforms (x, z, t0, força); 2 a 3 cristas que se abrem e somem
  for(int i=0;i<NA;i++){if(i>=uAnelN)break;vec4 A=uAnel[i];vec2 dd=wp.xz-A.xy;float f=A.w,Rf=3.+3.5*f;float r=length(dd);if(r>Rf+1.)continue;float t=uTempo-A.z,vida=3.+1.5*f;if(t<=0.||t>=vida)continue;
    float lam=.45+.35*f,xx=Rf*t/vida-r;float env=smoothstep(-.15*lam,.3*lam,xx)*smoothstep(3.2*lam,1.2*lam,xx);float fade=pow(1.-t/vida,1.3)*smoothstep(0.,.12,t);float ph=xx*6.2832/lam;
    float ha=env*fade*sqrt(f)/(1.+r*.07);g+=dd/max(r,.05)*sin(ph)*ha*.8;ondaH+=cos(ph)*ha*.8;espB+=env*smoothstep(.3,1.,cos(ph))*fade*fade*smoothstep(1.2,0.,t)*.5*min(f,1.);}
  if(uChuva>.01){g+=vec2(anel(wp.xz*.55,uTempo),anel(wp.zx*.55+7.,uTempo*.93))*.16*uChuva*(1.-lon);g+=(c.xy-.5)*.2*uChuva;}
  vec3 n=normalize(vec3(g.x,1.,g.y));
  float NV=max(dot(n,V),.001);float F=uF0+(1.-uF0)*pow(1.-NV,3.6);
  // reflexo plano com deslocamento pelas ondas: longe borra menos
  vec2 ruv=vR.xy/vR.w;ruv+=g*vec2(.1,.16)*clamp(9./max(vR.w,1.)+.08,0.,.5);vec3 refl=texture2D(tReflexo,ruv).rgb;
  // profundidade e sombra
  vec2 tuv=(wp.xz-uTopoC.xy)*uTopoC.z+.5;float hT=texture2D(tTopo,tuv).r*12.-6.;float raso=smoothstep(-2.6,-.05,hT);
  float cs=copaEm(wp);float sm=sombra(wp);float luz=(1.-cs*.94)*sm;float nl=max(uSolDir.y,.05);
  vec3 cor=uCorpo;float encontroK=0.;
  if(uEncontro.w>.001){float lat=dot(wp.xz-uEncontro.xy,vec2(cos(uEncontro.z),-sin(uEncontro.z)));float ww=(texture2D(tRuido,wp.xz*.012).r-.5)*44.+(texture2D(tRuido,wp.xz*.05).g-.5)*14.+(texture2D(tRuido,wp.xz*.16+uTempo*.004).r-.5)*6.;float k2=smoothstep(-9.,9.,lat+ww)*uEncontro.w*.9;cor=mix(cor,uCor2,k2);encontroK=k2;}
  cor=mix(cor,uCorpoRaso,raso*.72);
  vec3 corpo=cor*(ambiente(vec3(0.,1.,0.))*.66+uSolCor*nl*luz*.62);
  /* rodada 3: água barrenta e turva reflete menos que um espelho: o reflexo vai a ~55% e escurece um pouco para o tom da lama */vec3 col=mix(corpo,refl*vec3(.92,.86,.76),F*.55*mix(1.,.66,encontroK));
  // sol nas ondas
  vec3 H=normalize(uSolDir+V);float ndh=max(dot(n,H),0.);float brilho=pow(ndh,190.)*2.2+pow(ndh,900.)*11.;col+=uSolCor*min(brilho,14.)*uEsp*luz*smoothstep(.0,.18,dot(V,vec3(0.,1.,0.)));
  // espuma e beira
  float beira=smoothstep(-.3,-.06,hT)*smoothstep(.06,-.04,hT);float nes=texture2D(tRuido,wp.xz*.29+uTempo*.02).a;col=mix(col,(ambiente(vec3(0.,1.,0.))+uSolCor*nl*luz)*.8,clamp(beira*smoothstep(.45,.75,nes)*.55+espuma*espuma*smoothstep(.3,.75,nes+espuma*.3)*1.1,0.,.92));
  col*=1.+clamp(ondaH,-1.,1.)*.2;
  // espuma de água barrenta: creme, iluminada pelo céu e pelo sol (de noite escurece junto)
  col=mix(col,vec3(.78,.67,.48)*(ambiente(vec3(0.,1.,0.))*.9+uSolCor*nl*luz*.7),clamp(espB,0.,.86));
  gl_FragColor=vec4(comNevoa(col,wp),1.);}`;

// Tanque de ondas: o barco empurra a água, os bichos também. r: altura, g: altura anterior, b: espuma
const FS_SIM=`uniform sampler2D tA;uniform vec2 uPx,uDesl;uniform vec4 uBarco;uniform vec2 uRumo;uniform float uForca,uAmort,uK;uniform vec4 uRespingo[6];varying vec2 vUv;
void main(){vec2 uv=vUv+uDesl;vec4 c=texture2D(tA,uv);if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.)c=vec4(0.);float h=c.r,p=c.g;
  float s=texture2D(tA,uv+vec2(uPx.x,0.)).r+texture2D(tA,uv-vec2(uPx.x,0.)).r+texture2D(tA,uv+vec2(0.,uPx.y)).r+texture2D(tA,uv-vec2(0.,uPx.y)).r;
  float nov=(2.*h-p+(s-4.*h)*uK)*uAmort;
  // casco: uma cunha alongada que afunda a água conforme a velocidade
  vec2 d=vUv-uBarco.xy;vec2 tt=uRumo;vec2 nn=vec2(tt.y,-tt.x);float dl=dot(d,tt)/uBarco.z,dw=dot(d,nn)/uBarco.w;float k=exp(-(dl*dl+dw*dw*(1.+max(dl,0.)*2.)));
  nov-=k*uForca*.012;float prop=exp(-((dl+1.15)*(dl+1.15)*3.+dw*dw*1.8));
  float esp=max(c.b*.972-.002,0.);esp+=prop*.02*uForca;
  for(int i=0;i<6;i++){vec4 r=uRespingo[i];if(r.w<=0.)continue;float q=length(vUv-r.xy)/r.z;float e=exp(-q*q);nov-=e*r.w;esp+=e*r.w*.4;}
  gl_FragColor=vec4(clamp(nov,-1.5,1.5),h,clamp(esp,0.,1.),1.);}`;

export class Agua{
  constructor(r,T,tNormal,tipoHDR){this.r=r;this.T=T;const q=T;
    const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);
    this.tamR=[[320,180],[512,288],[1024,576]][T];
    this.rtR=new THREE.WebGLRenderTarget(this.tamR[0],this.tamR[1],{type:tipoHDR,depthBuffer:true,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,samples:0});
    this.camR=new THREE.PerspectiveCamera();
    this.uni={...GLSL_LUZ_U(),tNormal:{value:tNormal},tReflexo:{value:this.rtR.texture},tSim:{value:null},uSimC:{value:new THREE.Vector4()},uRefMat:{value:new THREE.Matrix4()},uCorpo:{value:new THREE.Color()},uCorpoRaso:{value:new THREE.Color(.36,.27,.15)},uF0:{value:.3},uOnda:{value:.5},uEsp:{value:1},uSimOn:{value:0},uChuva:{value:0},uSimG:{value:T>=2?1.3:.9},uVel:{value:0},uBarco:{value:new THREE.Vector3()},uRumo:{value:new THREE.Vector2()},uEncontro:{value:new THREE.Vector4(0,0,0,0)},uCor2:{value:new THREE.Color('#2e5448')} /* rodada 3: o rio principal agora é barrento; no encontro das águas entra a água verde-escura do afluente */,uCasco:{value:new THREE.Vector4(5.97,-6.28,1.89,0)},uAnel:{value:Array.from({length:NAQ[T]},()=>new THREE.Vector4(0,0,-1e3,0))},uAnelN:{value:0},uSombraMapa:U.uSombraMapa,uSombraMat:U.uSombraMat,uSombraLiga:U.uSombraLiga};
    this.mat=new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:FS(q),uniforms:this.uni});
    this.mesh=new THREE.Mesh(g,this.mat);this.mesh.scale.set(9000,1,9000);this.mesh.frustumCulled=false;this.mesh.renderOrder=-1;
    this.taxa=[3,2,1][T];this.cont=0;this.NA=NAQ[T];this.aneis=[];this.filaAnel=[];
    this.simOn=T>=1;if(this.simOn){const N=[0,256,512][T];this.N=N;this.DOM=[0,120,150][T];const mk=()=>new THREE.WebGLRenderTarget(N,N,{type:tipoHDR,depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,wrapS:THREE.ClampToEdgeWrapping,wrapT:THREE.ClampToEdgeWrapping});this.sa=mk();this.sb=mk();const zero=new Array(6).fill(0).map(()=>new THREE.Vector4(0,0,1,0));this.mSim=matTela(FS_SIM,{tA:{value:null},uPx:{value:new THREE.Vector2(1/N,1/N)},uDesl:{value:new THREE.Vector2()},uBarco:{value:new THREE.Vector4()},uRumo:{value:new THREE.Vector2()},uForca:{value:0},uAmort:{value:.992},uK:{value:T>=2?.158:.062},uRespingo:{value:zero}});this.cx=0;this.cz=0;this.resp=[];this.uni.uSimOn.value=1}
  }
  // V6 rodada 2 · casco(proa, popa, meiaBoca): z da proa e da popa e meia-largura, em metros, nas coordenadas do barco (padrão: v45)
  casco(proa,popa,meiaBoca){this.uni.uCasco.value.set(proa,popa,meiaBoca,0)}
  // anel(x, z, forca=1, opts): anéis concêntricos na água, em metros do mundo. forca 0,15…2: raio final 3,5…10 m, vida 3,2…6 s.
  // opts: {atraso: s até nascer · n: quantos anéis seguidos (padrão 1) · intervalo: s entre eles (0,45) · cresce: fator de força de um para o outro (1,15) · tanque: true também empurra o tanque de ondas}
  anel(x,z,forca=1,opts={}){const t=U.uTempo.value,n=Math.max(1,Math.min(6,opts.n||1)),it=opts.intervalo===undefined?.45:opts.intervalo,cr=opts.cresce||1.15;let f=Math.max(.15,Math.min(2,forca));
    for(let k=0;k<n;k++){this.filaAnel.push({x,z,t:t+(opts.atraso||0)+k*it,f});f=Math.min(2,f*cr)}if(this.filaAnel.length>48)this.filaAnel.splice(0,this.filaAnel.length-48);if(opts.tanque)this.respingo(x,z,.5+forca*.6,.06*forca)}
  // exemplo para o console: __rio.agua.anelTeste() solta três anéis a boreste do barco (um pequeno, um duplo, um grande atrasado)
  anelTeste(lado=8){const b=this.uni.uBarco.value,r=this.uni.uRumo.value,x=b.x+r.y*lado,z=b.z-r.x*lado;this.anel(x+r.x*4,z+r.y*4,.4);this.anel(x,z,1,{n:2});this.anel(x-r.x*6,z-r.y*6,2,{atraso:1.2,n:3});return [x,z]}
  _aneis(cam){const t=U.uTempo.value,A=this.aneis,F=this.filaAnel;if(!A.length&&!F.length){this.uni.uAnelN.value=0;return}
    for(let i=F.length-1;i>=0;i--){const q=F[i];if(q.t<=t){F.splice(i,1);A.push({x:q.x,z:q.z,t0:q.t,f:q.f});if(A.length>this.NA)A.shift()}else if(q.t>t+120)F.splice(i,1)}
    let n=0;const u=this.uni.uAnel.value;for(let i=A.length-1;i>=0;i--){const q=A[i],id=t-q.t0;if(id>3+1.5*q.f||id<-1){A.splice(i,1);continue}if(Math.hypot(q.x-cam.position.x,q.z-cam.position.z)<[160,260,400][this.T])u[n++].set(q.x,q.z,q.t0,q.f)}this.uni.uAnelN.value=n}
  // solta um respingo no tanque: x,z em metros, raio em metros, força
  respingo(x,z,raio,f){if(this.simOn)this.resp.push([x,z,raio,f])}
  passoSim(bx,bz,tx,tz,vel,dt){if(!this.simOn)return;this.ac=(this.ac||0)+dt;const n=Math.min(2,Math.floor(this.ac*60));if(!n)return;this.ac-=n/60;for(let q=0;q<n;q++)this._passo(bx,bz,tx,tz,vel);}
  _passo(bx,bz,tx,tz,vel){const r=this.r,N=this.N,D=this.DOM,mp=D/N;
    // a grade segue o barco em passos inteiros de texel
    const nx=Math.round(bx/mp)*mp,nz=Math.round(bz/mp)*mp;const dx=nx-this.cx,dz=nz-this.cz;this.cx=nx;this.cz=nz;const u=this.mSim.uniforms;u.uDesl.value.set(dx/D,dz/D);
    u.tA.value=this.sa.texture;u.uBarco.value.set((bx-nx)/D+.5,(bz-nz)/D+.5,7.4/D,2.5/D);u.uRumo.value.set(tx,tz);u.uForca.value=Math.min(1.6,Math.abs(vel)*.16);u.uAmort.value=.9935;
    for(let i=0;i<6;i++){const v=u.uRespingo.value[i],q=this.resp[i];if(q)v.set((q[0]-nx)/D+.5,(q[1]-nz)/D+.5,q[2]/D,q[3]);else v.w=0}this.resp.length=0;
    const sc=r.autoClear;r.autoClear=false;passe(r,this.mSim,this.sb);r.autoClear=sc;const t=this.sa;this.sa=this.sb;this.sb=t;this.uni.tSim.value=this.sa.texture;this.uni.uSimC.value.set(nx,nz,1/D,1.5/N);}
  // reflexo plano: câmera espelhada na linha d'água, com plano de corte oblíquo
  reflete(cam,cena,antes,depois){this.cont=(this.cont+1)%this.taxa;if(this.cont!==0)return;const r=this.r,c=this.camR;
    c.fov=cam.fov;c.aspect=cam.aspect;c.near=cam.near;c.far=cam.far;c.position.set(cam.position.x,-cam.position.y,cam.position.z);
    const f=new THREE.Vector3(0,0,-1).applyQuaternion(cam.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(cam.quaternion);c.up.set(up.x,-up.y,up.z);c.lookAt(c.position.x+f.x,c.position.y-f.y,c.position.z+f.z);c.updateMatrixWorld();c.updateProjectionMatrix();
    // o reflexo precisa do mesmo deslocamento de vista da câmera principal (quando há)
    if(cam.view&&cam.view.enabled){c.setViewOffset(cam.view.fullWidth,cam.view.fullHeight,cam.view.offsetX,-cam.view.offsetY,cam.view.width,cam.view.height)}else c.clearViewOffset();
    const pl=this._pl||(this._pl=new THREE.Plane()),cp=this._cp||(this._cp=new THREE.Vector4()),qq=this._q||(this._q=new THREE.Vector4());
    c.matrixWorldInverse.copy(c.matrixWorld).invert();pl.setFromNormalAndCoplanarPoint(new THREE.Vector3(0,1,0),new THREE.Vector3(0,.02,0));pl.applyMatrix4(c.matrixWorldInverse);cp.set(pl.normal.x,pl.normal.y,pl.normal.z,pl.constant);
    const P=c.projectionMatrix.elements;qq.x=(Math.sign(cp.x)+P[8])/P[0];qq.y=(Math.sign(cp.y)+P[9])/P[5];qq.z=-1;qq.w=(1+P[10])/P[14];cp.multiplyScalar(2/cp.dot(qq));P[2]=cp.x;P[6]=cp.y;P[10]=cp.z+1;P[14]=cp.w;
    this.mesh.visible=false;antes&&antes();const sc=r.autoClear,sm=r.shadowMap.autoUpdate;r.autoClear=true;r.shadowMap.autoUpdate=false;r.setRenderTarget(this.rtR);r.render(cena,c);r.setRenderTarget(null);r.autoClear=sc;r.shadowMap.autoUpdate=sm;depois&&depois();this.mesh.visible=true;
    this.uni.uRefMat.value.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);}
  defineHumor(m,cam,bx,bz){const u=this.uni;u.uCorpo.value.copy(m.aguaCor);u.uF0.value=m.aF;u.uOnda.value=m.onda;u.uEsp.value=m.aEsp;u.uChuva.value=m.f.chuva;this.mesh.position.set(cam.position.x,0,cam.position.z);this._aneis(cam)}
}
