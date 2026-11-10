// O chão: margens de lama, raízes e serapilheira, gramados das clareiras, praias e pedrais, e a parede de copas ao fundo.
import * as THREE from 'three';
import {sst,mix,clamp,fbm2,ruido2} from './util.js';
import {GLSL_LUZ,GLSL_LUZ_U,U} from './nucleo.js';

const VS=`attribute vec3 aM;varying vec3 vN,vMundo,vM;void main(){vN=normal;vM=aM;vMundo=position;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}`;
const FS=`${GLSL_LUZ}varying vec3 vN,vMundo,vM;
void main(){vec2 q=vMundo.xz+vMundo.y*normalize(vN).xz*2.2;float a=texture2D(tRuido,q*.021).r,b=texture2D(tRuido,q*.11).g,c=texture2D(tRuido,q*.31).r,e=texture2D(tRuido,q*.9).g;
  float hh=a*.3+b*.32+c*.22+e*.16;vec3 dpx=dFdx(vMundo),dpy=dFdy(vMundo);float dhx=dFdx(hh),dhy=dFdy(hh);vec3 n=normalize(vN),n0=n,r1=cross(dpy,n),r2=cross(n,dpx);float det=dot(dpx,r1);n=normalize(abs(det)*n-sign(det)*(dhx*r1+dhy*r2)*.7);
  vec3 lama=mix(vec3(.052,.036,.024),vec3(.15,.1,.06),smoothstep(.3,.7,hh));
  float fol=smoothstep(.46,.66,b+c*.3)*smoothstep(.4,2.2,vMundo.y);vec3 lit=mix(vec3(.13,.07,.03),vec3(.27,.15,.06),e);vec3 alb=mix(lama,lit,fol*.72);
  float ver=smoothstep(.52,.66,a+e*.2)*smoothstep(.6,2.,vMundo.y);alb=mix(alb,vec3(.06,.12,.03),ver*.72);
  // gramado, areia e pedra
  vec3 grama=mix(vec3(.075,.135,.035),vec3(.16,.24,.06),smoothstep(.34,.7,b*.6+e*.4));alb=mix(alb,grama,vM.x);
  vec3 areia=mix(vec3(.62,.5,.34),vec3(.84,.74,.56),smoothstep(.3,.7,b*.5+c*.5));alb=mix(alb,areia,vM.y);
  vec3 ped=mix(vec3(.17,.14,.12),vec3(.38,.33,.28),smoothstep(.25,.75,b));alb=mix(alb,ped,vM.z);
  // faixa molhada na beira
  float mol=smoothstep(.5,.02,vMundo.y+(a-.5)*.25);alb*=mix(1.,.5,mol);
  float cs=copaEm(vMundo);float somb=1.-cs*.93;vec3 V=normalize(uCam-vMundo),L=uSolDir;float nl=max(dot(n,L),0.);
  vec3 c0=alb*(ambiente(n)*(.42+.58*(1.-cs*.72))+uSolCor*nl*somb);
  vec3 H=normalize(L+V);float brilho=pow(max(dot(normalize(n+n0),H),0.),mix(14.,34.,mol))*mix(.01,.06,mol);float fr=pow(1.-max(dot(n0,V),0.),5.)*mol;c0+=uSolCor*brilho*somb+uAmbCeu*fr*.28;
  gl_FragColor=vec4(comNevoa(c0,vMundo),1.);}`;

// Parede de copas: uma malha baixa com bolhas calculadas, para o horizonte ter profundidade sem custar nada
const VS_M=`attribute float aF;varying vec3 vN,vMundo;varying float vF;void main(){vN=normal;vF=aF;vMundo=position;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}`;
const FS_M=`${GLSL_LUZ}uniform sampler2D tCopas;varying vec3 vN,vMundo;varying float vF;
void main(){vec2 q=vMundo.xz*.0048;vec4 k=texture2D(tCopas,q);vec4 k2=texture2D(tCopas,q*3.1+.3);vec3 n=normalize(vec3((k.r*2.-1.)*1.5+(k2.r*2.-1.)*.7,.82,(k.g*2.-1.)*1.5+(k2.g*2.-1.)*.7));n=normalize(n+normalize(vN)*.35);
  float ao=clamp(k.b*.82+k2.b*.3,0.,1.);float id=k.a;vec3 alb=mix(vec3(.035,.1,.03),vec3(.1,.21,.045),id)*(.5+.75*ao);alb=mix(alb,alb*vec3(1.3,1.12,.55),smoothstep(.62,1.,fract(id*7.3))*.7);
  float nl=dot(n,uSolDir);vec3 V=normalize(uCam-vMundo);float tr=pow(max(dot(-V,uSolDir),0.),3.)*.5;
  vec3 c=alb*(ambiente(n)*ao*(.5+.5*ao)+uSolCor*max(nl*.75+.25,0.)*ao*(.42+.58*ao))+alb*vec3(1.1,1.2,.5)*uSolCor*tr*ao*.45;
  gl_FragColor=vec4(comNevoa(c,vMundo),1.);}`;

export function criaTerreno(rio,T){
  const ds=[12,8,5][T],COL=[-16,-9,-5,-2.6,-1.2,-.5,0,.45,1,1.8,3,4.6,7,11,16,24,36,52,74,100,132];
  const LAD=[-1,1],nr=Math.ceil(rio.L/ds)+1,nc=COL.length;const P=new Float32Array(nr*nc*2*3),Nn=new Float32Array(nr*nc*2*3),M=new Float32Array(nr*nc*2*3);const I=[];const o={};
  let base=0;for(const lado of LAD){for(let i=0;i<nr;i++){const s=Math.min(rio.L-.01,i*ds);const W=rio.borda(s,lado),pr=rio.praia(s),pe=rio.pedra(s);for(let j=0;j<nc;j++){const d=COL[j],lat=lado*Math.max(1,W+d);rio.mundo(s,lat,o);const h=rio.altura(s,lat);const k=(base+i*nc+j)*3;P[k]=o.px;P[k+1]=h;P[k+2]=o.pz;const cl=rio.clareiras.length?rio.clareira(s,lat):{g:0};
        const ar=pr*sst(26*pr+6,8,d)*sst(-30,-6,d),pd=pe*sst(.4,.6,fbm2(s*.05,lat*.05,2))*sst(16,3,d)*sst(-16,-5,d);M[k]=cl.g;M[k+1]=ar*(1-cl.g);M[k+2]=pd*(1-cl.g);
        if(pd>0&&h>-3)P[k+1]+=pd*2.4*fbm2(s*.09,lat*.09,2)}}
    const giraFace=lado>0;for(let i=0;i<nr-1;i++)for(let j=0;j<nc-1;j++){const a=base+i*nc+j,b=a+1,c=a+nc,e=c+1;if(giraFace)I.push(a,c,b,b,c,e);else I.push(a,b,c,b,e,c)}
    base+=nr*nc}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('aM',new THREE.BufferAttribute(M,3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(I),1));g.computeVertexNormals();
  // conferência: em cada lado a normal precisa apontar para cima
  const mt=new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:FS,uniforms:GLSL_LUZ_U(),side:THREE.DoubleSide});const m=new THREE.Mesh(g,mt);m.frustumCulled=false;m.renderOrder=-4;return m;
}
export function criaMuralha(rio,T,tCopas){
  const ds=[32,24,18][T],COL=[126,142,166,200,250,330,460,700,1100,1800,2800],nr=Math.ceil(rio.L/ds)+1,nc=COL.length;const P=new Float32Array(nr*nc*2*3),F=new Float32Array(nr*nc*2);const I=[];const o={};let base=0;
  for(const lado of[-1,1]){for(let i=0;i<nr;i++){const s=Math.min(rio.L-.01,i*ds);const W=rio.borda(s,lado);const R=1/Math.max(1e-3,Math.abs(rio.curv[Math.floor(s/4)]||0));const interno=Math.sign(rio.curv[Math.floor(s/4)]||0)===lado;
      for(let j=0;j<nc;j++){let lat=W+COL[j];if(interno)lat=Math.min(lat,R*.82+j*2);const q=lado*lat;rio.mundo(s,q,o);const n=fbm2(o.px*.012,o.pz*.012,3),n2=fbm2(o.px*.05+5,o.pz*.05,2);const y=j===0?-1:(14+n*9+n2*3)*sst(0,3,j);const k=(base+i*nc+j)*3;P[k]=o.px;P[k+1]=y;P[k+2]=o.pz;F[base+i*nc+j]=j/(nc-1)}}
    for(let i=0;i<nr-1;i++)for(let j=0;j<nc-1;j++){const a=base+i*nc+j,b=a+1,c=a+nc,e=c+1;I.push(a,c,b,b,c,e)}base+=nr*nc}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('aF',new THREE.BufferAttribute(F,1));g.setIndex(new THREE.BufferAttribute(new Uint32Array(I),1));g.computeVertexNormals();
  const nn=g.attributes.normal;for(let i=0;i<nn.count;i++)if(nn.getY(i)<0)nn.setXYZ(i,-nn.getX(i),-nn.getY(i),-nn.getZ(i));
  const m=new THREE.Mesh(g,new THREE.ShaderMaterial({vertexShader:VS_M,fragmentShader:FS_M,uniforms:{...GLSL_LUZ_U(),tCopas:{value:tCopas}},side:THREE.DoubleSide}));m.frustumCulled=false;m.renderOrder=-3;return m;
}
