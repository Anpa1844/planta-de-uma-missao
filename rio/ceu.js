// O céu: atmosfera e nuvens volumétricas calculadas numa panorâmica de baixa resolução, atualizada aos poucos,
// e uma cúpula que mostra a panorâmica somando sol, lua, estrelas e relâmpagos. Custa quase nada por quadro.
import * as THREE from 'three';
import {GLSL_RUIDO,matTela,passe,VS_TELA} from './util.js';
import {U} from './nucleo.js';

function ruido3D(r,N){
  const rt=new THREE.WebGL3DRenderTarget(N,N,N,{format:THREE.RGBAFormat,type:THREE.UnsignedByteType,depthBuffer:false,stencilBuffer:false});
  const t=rt.texture;t.wrapS=t.wrapT=t.wrapR=THREE.RepeatWrapping;t.minFilter=t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;t.needsUpdate=true;
  const m=matTela(`uniform float uZ;varying vec2 vUv;${GLSL_RUIDO}
    float perlinFbm(vec3 p,float per){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*gr3(p,per);a*=.5;p*=2.;per*=2.;}return s*.5+.5;}
    float worFbm(vec3 p,float per){return 1.-(vor3(p,per)*.625+vor3(p*2.,per*2.)*.25+vor3(p*4.,per*4.)*.125);}
    void main(){vec3 q=vec3(vUv,uZ);float pf=perlinFbm(q*4.,4.);float w=worFbm(q*4.,4.);float pw=clamp((pf-(1.-w)*.55)/(1.-(1.-w)*.55),0.,1.);
      gl_FragColor=vec4(pw,worFbm(q*8.,8.),worFbm(q*16.,16.),perlinFbm(q*2.,2.));}`,{uZ:{value:0}});
  for(let z=0;z<N;z++){m.uniforms.uZ.value=(z+.5)/N;r.setRenderTarget(rt,z);passe2(r,m,rt,z)}
  m.dispose();r.setRenderTarget(null);return t;
}
const camT=new THREE.OrthographicCamera(-1,1,1,-1,0,1),cenaT=new THREE.Scene(),triG=new THREE.BufferGeometry();triG.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));triG.setAttribute('uv',new THREE.BufferAttribute(new Float32Array([0,0,2,0,0,2]),2));const meshT=new THREE.Mesh(triG);meshT.frustumCulled=false;cenaT.add(meshT);
function passe2(r,m,rt,z){meshT.material=m;r.setRenderTarget(rt,z);r.render(cenaT,camT)}

const FS_PANO=(passos,luzPassos)=>`precision highp sampler3D;uniform sampler3D tN;
uniform vec3 uSol,uSolC,uZen,uHor,uBrilho,uNuvLuz,uNuvSomb,uLuaC;uniform float uCob,uDrift,uBase,uTopoN,uDensN,uNoite,uTexEsc;varying vec2 vUv;const float PI=3.14159265;
vec3 dirDe(vec2 uv){float az=uv.x*2.*PI,el=uv.y*uv.y*PI*.5;return vec3(sin(az)*cos(el),sin(el),cos(az)*cos(el));}
float cob(vec2 q){vec4 w=texture(tN,vec3(q*.21,.13));return clamp(uCob*(.5+1.15*w.a)+(w.r-.5)*.3,0.,1.);}
float dens(vec3 p,bool fino){float h=clamp((p.y-uBase)/(uTopoN-uBase),0.,1.);vec2 q=p.xz*.000105+vec2(uDrift,0.);float c=cob(q*.7);if(c<.01)return 0.;
  vec4 n=texture(tN,vec3(q.x,h*.3+uDrift*.2,q.y));float perfil=smoothstep(0.,.07,h)*(1.-smoothstep(mix(.2,.86,c),1.,h));
  float f=(n.r*.9+n.g*.34)*perfil*1.42;float lim=1.-c;float d=clamp((f-lim)/.13,0.,1.);
  if(fino&&d>0.){vec4 m=texture(tN,p*.00058+vec3(uDrift*.4,0.,0.));vec4 m2=texture(tN,p*.0023);d=clamp(d-(1.-d)*(1.-d)*(m.g*.5+m.b*.3+m2.b*.2)*1.15,0.,1.);}
  return d*uDensN*(.6+h*.9);}
vec3 ceu(vec3 d){float h=max(d.y,0.);vec3 c=mix(uHor,uZen,pow(h,.46));float s=max(dot(d,uSol),0.);
  c+=uBrilho*(pow(s,4.)*.26+pow(s,22.)*.48+pow(s,180.)*1.1);
  c+=uHor*exp(-h*26.)*.12;return c;}
void main(){vec3 d=dirDe(vUv);vec3 fundo=ceu(d);
  float t0=uBase/max(d.y,.012),t1=uTopoN/max(d.y,.012);t0=min(t0,52000.);t1=min(t1,70000.);float dt=(t1-t0)/float(${passos});
  float e=dt*fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
  float T=1.;vec3 esp=vec3(0.);float g=dot(d,uSol);float hg=(1.-.5*.5)/pow(1.+.25-2.*.5*g,1.5)*.5+.58;
  for(int i=0;i<${passos};i++){if(T<.02)break;vec3 p=d*(t0+dt*float(i)+e);float q=dens(p,true);if(q<=.001)continue;
    float op=0.;vec3 lp=p;float ls=240.;for(int k=0;k<${luzPassos};k++){lp+=uSol*ls;op+=dens(lp,k<1)*ls;ls*=1.75;}
    float h=clamp((p.y-uBase)/(uTopoN-uBase),0.,1.);float tl=exp(-op*.0034);float pw=1.-exp(-q*dt*.01);
    vec3 luz=uNuvLuz*tl*hg*mix(.75,1.3,pw)+mix(uNuvSomb,uHor*.6+uZen*.5,h*.65);
    float dA=exp(-(t0+dt*float(i))*.000034);luz=mix(uHor*1.02,luz,dA);
    float a=1.-exp(-q*dt*.011);esp+=T*a*luz;T*=1.-a;}
  float fim=smoothstep(.0,.05,d.y);T=mix(1.,T,fim);esp*=fim;
  {vec2 ci=d.xz/max(d.y+.12,.05)*.09+vec2(uDrift*2.,0.);float cc=texture(tN,vec3(ci*.5,.61)).a*.6+texture(tN,vec3(ci*vec2(1.6,.5),.27)).g*.4;float ca=smoothstep(.56,.8,cc)*smoothstep(.02,.22,d.y)*.42*(1.-uNoite*.5);vec3 cl=uNuvLuz*.44+uHor*.25;esp+=T*ca*cl;T*=1.-ca;}
  gl_FragColor=vec4(fundo*T+esp,T);}`;

const VS_DOMO=`varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*mat4(mat3(viewMatrix))*vec4(position,1.);gl_Position=p.xyww;}`;
const FS_DOMO=`precision highp float;uniform sampler2D tA,tB;uniform float uMis,uNoite,uRel,uTempo,uLinhaMata;uniform vec3 uSol,uSolD,uDiscoC,uNevoa,uNevoaSolC,uLua,uMata;uniform vec4 uNP;varying vec3 vD;const float PI=3.14159265;
float h1(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),u.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),u.x),u.y);}
vec3 estrelas(vec3 d){vec3 s=vec3(0.);float az=atan(d.x,d.z),el=asin(clamp(d.y,-1.,1.));for(int k=0;k<2;k++){float e=k==0?180.:320.;vec2 q=vec2(az*e/PI,el*e/PI);vec2 i=floor(q),f=fract(q)-.5;float r=h1(i+float(k)*17.);if(r>.93){vec2 o=(vec2(h1(i+3.),h1(i+7.))-.5)*.6;float b=smoothstep(.1,.0,length(f-o));float t=.75+.25*sin(uTempo*(1.+r*3.)+r*40.);float cr=h1(i+11.);s+=mix(vec3(.75,.85,1.),vec3(1.,.86,.72),cr)*b*t*(pow((r-.93)/.07,5.)*(k==0?7.:2.6));}}
  vec3 eixo=normalize(vec3(.42,.18,.89));float via=exp(-pow(dot(d,eixo)*4.2,2.));float nv=vn(vec2(az,el)*7.)*.6+vn(vec2(az,el)*19.)*.4;s+=vec3(.5,.56,.78)*via*smoothstep(.34,.82,nv)*.2;return s;}
void main(){vec3 d=normalize(vD);float el=asin(clamp(d.y,0.,1.));vec2 uv=vec2(atan(d.x,d.z)/(2.*PI),sqrt(el/(PI*.5)));vec2 px=vec2(.0006,.0018);vec4 c=mix(texture2D(tA,uv),texture2D(tB,uv),uMis);vec3 col=c.rgb;float T=c.a;
  if(d.y>0.){float s=dot(d,uSolD);float disco=smoothstep(.99955,.99985,s);col+=uDiscoC*disco*T;
    float l=dot(d,uLua);float dl=smoothstep(.99955,.99972,l);if(dl>0.&&uNoite>.01){vec3 x=normalize(cross(uLua,vec3(0.,1.,0.))),y=cross(x,uLua);vec2 q=vec2(dot(d,x),dot(d,y))*44.;float mar=vn(q*2.3+3.)*.55+vn(q*6.+9.)*.3+vn(q*14.)*.15;col+=vec3(1.,.97,.9)*dl*T*uNoite*mix(.8,3.8,smoothstep(.3,.62,mar));}
    float halo=pow(max(l,0.),260.)*.3+pow(max(l,0.),24.)*.024;col+=vec3(.72,.8,1.)*halo*uNoite*(.35+.65*T);
    if(uNoite>.01)col+=estrelas(d)*uNoite*T*T*smoothstep(.0,.13,d.y);}
  col*=1.+uRel*(5.5*(1.-T)+.6);
  // névoa do horizonte: a mesma cor da névoa dos objetos, para o fim da floresta sumir no ar
  float s2=pow(max(dot(d,uSol),0.),uNP.z);vec3 nev=mix(uNevoa,uNevoaSolC,s2);float hz=exp(-max(d.y,0.)*uLinhaMata);col=mix(col,nev,hz*.92);if(d.y<0.)col=nev;
  gl_FragColor=vec4(col,1.);}`;

export class Ceu{
  constructor(r,T){this.r=r;this.T=T;
    const LA=[640,1024,2048][T],AL=[170,270,512][T],PAS=[10,16,28][T],LP=[2,3,4][T];this.N=[16,16,20][T];this.fat=[6,10,18][T];this.fi=0;this.mis=1;this.pronta=false;
    const op=()=>new THREE.WebGLRenderTarget(LA,AL,{type:THREE.HalfFloatType,depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,wrapS:THREE.RepeatWrapping,wrapT:THREE.ClampToEdgeWrapping});
    this.a=op();this.b=op();this.w=op();this.mBl=matTela(`uniform sampler2D tC;uniform vec2 uP;varying vec2 vUv;void main(){vec4 s=texture2D(tC,vUv)*.25;s+=(texture2D(tC,vUv+vec2(uP.x,0.))+texture2D(tC,vUv-vec2(uP.x,0.))+texture2D(tC,vUv+vec2(0.,uP.y))+texture2D(tC,vUv-vec2(0.,uP.y)))*.125;s+=(texture2D(tC,vUv+uP)+texture2D(tC,vUv-uP)+texture2D(tC,vUv+vec2(uP.x,-uP.y))+texture2D(tC,vUv+vec2(-uP.x,uP.y)))*.0625;gl_FragColor=s;}`,{tC:{value:null},uP:{value:new THREE.Vector2(1/LA,1/AL)}});this.tn=ruido3D(r,[32,48,64][T]);this.tam=[LA,AL];
    this.mp=matTela(FS_PANO(PAS,LP),{tN:{value:this.tn},uSol:{value:new THREE.Vector3()},uSolC:{value:new THREE.Color()},uZen:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uBrilho:{value:new THREE.Color()},uNuvLuz:{value:new THREE.Color()},uNuvSomb:{value:new THREE.Color()},uLuaC:{value:new THREE.Color()},uCob:{value:.5},uDrift:{value:0},uBase:{value:1400},uTopoN:{value:4200},uDensN:{value:1},uNoite:{value:0},uTexEsc:{value:1}});
    this.geo=new THREE.IcosahedronGeometry(10,3);
    this.md=new THREE.ShaderMaterial({vertexShader:VS_DOMO,fragmentShader:FS_DOMO,side:THREE.BackSide,depthWrite:false,depthTest:true,uniforms:{tA:{value:this.a.texture},tB:{value:this.b.texture},uMis:{value:1},uNoite:{value:0},uRel:{value:0},uTempo:U.uTempo,uLinhaMata:{value:60},uSol:{value:new THREE.Vector3()},uSolD:{value:new THREE.Vector3()},uDiscoC:{value:new THREE.Color()},uNevoa:U.uNevoaCor,uNevoaSolC:U.uNevoaSol,uLua:{value:new THREE.Vector3()},uMata:{value:new THREE.Color()},uNP:U.uNevoaP}});
    this.domo=new THREE.Mesh(this.geo,this.md);this.domo.frustumCulled=false;this.domo.renderOrder=-10;
    // o domo é desenhado depois do cenário opaco para aproveitar o teste de profundidade
    this.domo.renderOrder=5;
  }
  // m: humor atual (veja clima.js)
  defineHumor(m,dt){const u=this.mp.uniforms;u.uSol.value.copy(m.solDirCeu);u.uSolC.value.copy(m.solCor);u.uZen.value.copy(m.zen);u.uHor.value.copy(m.hor);u.uBrilho.value.copy(m.brilho);u.uNuvLuz.value.copy(m.nuvLuz);u.uNuvSomb.value.copy(m.nuvSomb);u.uCob.value=m.cob;u.uDensN.value=m.densN;u.uBase.value=m.baseN;u.uTopoN.value=m.topoN;u.uNoite.value=m.noite;u.uDrift.value+=dt*m.ventoN;
    const d=this.md.uniforms;d.uSol.value.copy(m.solDirCeu);d.uSolD.value.copy(m.discoDir);d.uDiscoC.value.copy(m.discoCor);d.uLua.value.copy(m.luaDir);d.uNoite.value=m.noite;d.uRel.value=m.relampago||0;d.uLinhaMata.value=m.linhaH}
  // Refaz a panorâmica em fatias; quando termina, troca com a anterior em dissolve, então nunca se vê a emenda
  atualiza(dt,forca=false){const r=this.r,[W,H]=this.tam;const sc=r.autoClear;r.autoClear=false;const n=forca?this.fat:1;
    for(let i=0;i<n;i++){const y0=Math.floor(this.fi*H/this.fat),y1=Math.floor((this.fi+1)*H/this.fat);this.w.scissorTest=true;this.w.scissor.set(0,y0,W,y1-y0);passe(r,this.mp,this.w);this.fi++;if(this.fi>=this.fat){this.fi=0;this.w.scissorTest=false;this.mBl.uniforms.tC.value=this.w.texture;passe(r,this.mBl,this.b);const q=this.a;this.a=this.b;this.b=q;this.mis=0;const d=this.md.uniforms;d.tA.value=this.b.texture;d.tB.value=this.a.texture;this.pronta=true}}
    r.autoClear=sc;this.mis=Math.min(1,this.mis+dt*1.6);this.md.uniforms.uMis.value=forca?1:this.mis;}
  força(){for(let i=0;i<2;i++)this.atualiza(0,true);this.mis=1;this.md.uniforms.uMis.value=1}
}
