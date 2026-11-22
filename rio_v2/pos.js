// Acabamento de cinema: bloom em cascata, raios de sol, curva de filme, marcação de cor, vinheta e grão.
// A cena é desenhada em ponto flutuante numa resolução que muda conforme o aparelho aguenta; o passe final entrega na resolução da tela.
import * as THREE from 'three';
import {matTela,passe} from './util.js';

const FS_CLARO=`uniform sampler2D tC;uniform float uLim;uniform vec2 uPx;varying vec2 vUv;
void main(){vec3 c=vec3(0.);c+=texture2D(tC,vUv+uPx*vec2(-1.,-1.)).rgb;c+=texture2D(tC,vUv+uPx*vec2(1.,-1.)).rgb;c+=texture2D(tC,vUv+uPx*vec2(-1.,1.)).rgb;c+=texture2D(tC,vUv+uPx*vec2(1.,1.)).rgb;c*=.25;c=min(c,vec3(60.));float l=max(c.r,max(c.g,c.b));float k=smoothstep(uLim,uLim*2.,l);gl_FragColor=vec4(c*k,1.);}`;
const FS_DESCE=`uniform sampler2D tC;uniform vec2 uPx;varying vec2 vUv;void main(){vec3 c=texture2D(tC,vUv).rgb*4.;c+=texture2D(tC,vUv+uPx*vec2(-1.,-1.)).rgb;c+=texture2D(tC,vUv+uPx*vec2(1.,-1.)).rgb;c+=texture2D(tC,vUv+uPx*vec2(-1.,1.)).rgb;c+=texture2D(tC,vUv+uPx*vec2(1.,1.)).rgb;gl_FragColor=vec4(c/8.,1.);}`;
const FS_SOBE=`uniform sampler2D tC,tB;uniform vec2 uPx;uniform float uPeso;varying vec2 vUv;void main(){vec3 c=vec3(0.);
  c+=texture2D(tC,vUv+uPx*vec2(-2.,0.)).rgb+texture2D(tC,vUv+uPx*vec2(2.,0.)).rgb+texture2D(tC,vUv+uPx*vec2(0.,-2.)).rgb+texture2D(tC,vUv+uPx*vec2(0.,2.)).rgb;
  c+=(texture2D(tC,vUv+uPx*vec2(-1.,1.)).rgb+texture2D(tC,vUv+uPx*vec2(1.,1.)).rgb+texture2D(tC,vUv+uPx*vec2(-1.,-1.)).rgb+texture2D(tC,vUv+uPx*vec2(1.,-1.)).rgb)*2.;
  gl_FragColor=vec4(texture2D(tB,vUv).rgb+c/12.*uPeso,1.);}`;
const FS_RAIOS=`uniform sampler2D tC;uniform vec2 uSol;uniform float uForca,uDist;varying vec2 vUv;
void main(){vec2 d=(uSol-vUv);float e=fract(dot(gl_FragCoord.xy,vec2(.06711,.00584))*52.983);vec3 s=vec3(0.);const int N=28;float p=1.,soma=0.;vec2 pas=d*uDist/float(N);vec2 q=vUv+pas*e;for(int i=0;i<N;i++){vec3 c=texture2D(tC,q).rgb;s+=min(c,vec3(5.))*p;soma+=p;p*=.955;q+=pas;}gl_FragColor=vec4(s/soma*uForca,1.);}`;
const FS_FINAL=`uniform sampler2D tC,tB,tR;uniform float uExp,uBloom,uSat,uCon,uVin,uGrao,uT,uFade,uTarja,uAntigo,uRaios,uNitidez;uniform vec3 uLift,uGain,uSombraT,uLuzT;uniform vec2 uPx;varying vec2 vUv;
vec3 aces(vec3 x){x*=.78;return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
vec3 srgb(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
float h(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){vec2 uv=vUv;vec3 c=texture2D(tC,uv).rgb;
  if(uNitidez>0.){vec3 s=texture2D(tC,uv+vec2(uPx.x,0.)).rgb+texture2D(tC,uv-vec2(uPx.x,0.)).rgb+texture2D(tC,uv+vec2(0.,uPx.y)).rgb+texture2D(tC,uv-vec2(0.,uPx.y)).rgb;vec3 lc=min(c,vec3(2.));c=max(c+(lc-min(s*.25,vec3(2.)))*uNitidez,vec3(0.));}
  c+=texture2D(tB,uv).rgb*uBloom;
  c+=texture2D(tR,uv).rgb*uRaios;
  c*=uExp;c=aces(c);
  // marcação de cor por humor: sombras e altas luzes puxam para matizes diferentes
  float l=dot(c,vec3(.2126,.7152,.0722));c=mix(c,c*uSombraT,(1.-smoothstep(.0,.55,l)));c=mix(c,c*uLuzT,smoothstep(.45,1.,l));
  c=c*uGain+uLift*(1.-c);l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,uSat);c=mix(c,smoothstep(0.,1.,c),uCon);
  if(uAntigo>0.){float s=dot(c,vec3(.3,.59,.11));vec3 sep=vec3(s)*vec3(1.09,.97,.78)+vec3(.02,.012,0.);c=mix(c,sep,uAntigo);}
  vec2 p=uv-.5;float v=1.-dot(p,p)*uVin;c*=clamp(v,0.,1.);
  c=srgb(clamp(c,0.,1.));
  float gr=h(gl_FragCoord.xy+fract(uT)*vec2(311.,173.))-.5;c+=gr*uGrao*(1.-.6*dot(c,vec3(.33)));
  c*=uFade;
  if(uTarja>0.){float t=step(uv.y,uTarja)+step(1.-uTarja,uv.y);c=mix(c,vec3(0.),t);}
  gl_FragColor=vec4(c,1.);}`;

export class Pos{
  constructor(r,T,amostras,tipoHDR){this.r=r;this.T=T;this.w=1;this.h=1;this.escala=1;this.amostras=amostras;this.tipo=tipoHDR;
    this.nb=[3,4,6][T];this.raiosLigado=T>=1;
    this.rt=null;this.bd=[];
    const px=()=>({value:new THREE.Vector2()});
    this.mClaro=matTela(FS_CLARO,{tC:{value:null},uLim:{value:1.15},uPx:px()});
    this.mDesce=matTela(FS_DESCE,{tC:{value:null},uPx:px()});
    this.mSobe=matTela(FS_SOBE,{tC:{value:null},tB:{value:null},uPx:px(),uPeso:{value:1}});
    this.mRaios=matTela(FS_RAIOS,{tC:{value:null},uSol:{value:new THREE.Vector2()},uForca:{value:0},uDist:{value:.9}});
    this.uF={tC:{value:null},tB:{value:null},tR:{value:null},uExp:{value:1},uBloom:{value:.09},uSat:{value:1.05},uCon:{value:.2},uVin:{value:.9},uGrao:{value:.022},uT:{value:0},uFade:{value:1},uTarja:{value:0},uAntigo:{value:0},uRaios:{value:0},uNitidez:{value:0},uLift:{value:new THREE.Color(0,0,0)},uGain:{value:new THREE.Color(1,1,1)},uSombraT:{value:new THREE.Color(1,1,1)},uLuzT:{value:new THREE.Color(1,1,1)},uPx:px()};
    this.mFinal=matTela(FS_FINAL,this.uF);
    const prt=()=>new THREE.WebGLRenderTarget(4,4,{type:tipoHDR,depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
    this.rPre=prt();this.rRaios=prt();
    for(let i=0;i<this.nb;i++)this.bd.push({d:prt(),u:prt()});
    const preto=new THREE.DataTexture(new Uint8Array([0,0,0,255]),1,1);preto.needsUpdate=true;this.preto=preto;
  }
  tam(pw,ph,escala){this.w=pw;this.h=ph;this.escala=escala;const w=Math.max(2,Math.round(pw*escala)),h=Math.max(2,Math.round(ph*escala));
    if(!this.rt){this.rt=new THREE.WebGLRenderTarget(w,h,{type:this.tipo,samples:this.amostras,depthBuffer:true,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter})}else this.rt.setSize(w,h);
    let a=Math.max(2,w>>1),b=Math.max(2,h>>1);this.rPre.setSize(a,b);this.rRaios.setSize(Math.max(2,w>>2),Math.max(2,h>>2));for(const n of this.bd){a=Math.max(2,a>>1);b=Math.max(2,b>>1);n.d.setSize(a,b);n.u.setSize(a,b)}
    this.uF.uPx.value.set(1/w,1/h);this.uF.uNitidez.value=escala<.82?.42:0;}
  // solTela: posição do sol em 0..1 ou null quando está atrás da câmera
  aplica(solTela,raios){const r=this.r,w=this.rt.width,h=this.rt.height;const sc=r.autoClear;r.autoClear=false;
    this.mClaro.uniforms.tC.value=this.rt.texture;this.mClaro.uniforms.uPx.value.set(1/w,1/h);passe(r,this.mClaro,this.rPre);
    let f=this.rPre;for(const n of this.bd){this.mDesce.uniforms.tC.value=f.texture;this.mDesce.uniforms.uPx.value.set(.5/f.width,.5/f.height);passe(r,this.mDesce,n.d);f=n.d}
    let b=this.bd[this.nb-1].d;for(let i=this.nb-2;i>=0;i--){const n=this.bd[i];this.mSobe.uniforms.tC.value=b.texture;this.mSobe.uniforms.tB.value=n.d.texture;this.mSobe.uniforms.uPx.value.set(.5/b.width,.5/b.height);this.mSobe.uniforms.uPeso.value=1;passe(r,this.mSobe,n.u);b=n.u}
    if(this.raiosLigado&&solTela&&raios>.001){const u=this.mRaios.uniforms;u.tC.value=this.rPre.texture;u.uSol.value.copy(solTela);u.uForca.value=1;passe(r,this.mRaios,this.rRaios);this.uF.tR.value=this.rRaios.texture;this.uF.uRaios.value=raios}else{this.uF.tR.value=this.preto;this.uF.uRaios.value=0}
    this.uF.tC.value=this.rt.texture;this.uF.tB.value=b.texture;passe(r,this.mFinal,null);r.autoClear=sc}
}
