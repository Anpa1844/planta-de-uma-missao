// Pequenas ferramentas usadas por todos os módulos.
import * as THREE from 'three';

export const sst=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
export const mix=(a,b,k)=>a+(b-a)*k;
export const clamp=(x,a=0,b=1)=>x<a?a:x>b?b:x;
export const giro=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const dorme=m=>new Promise(r=>setTimeout(r,m));
export const proximoQuadro=()=>new Promise(r=>requestAnimationFrame(r));
export const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};

// Ruído de valor em 1D e 2D, determinístico, para o relevo e a distribuição das árvores
const hash2=(x,y)=>{let h=Math.imul(x,374761393)+Math.imul(y,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
export function ruido2(x,y){const i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j,u=a*a*(3-2*a),v=b*b*(3-2*b);
  const p=hash2(i,j),q=hash2(i+1,j),r=hash2(i,j+1),s=hash2(i+1,j+1);return p+(q-p)*u+(r-p)*v+(p-q-r+s)*u*v}
export const fbm2=(x,y,o=3)=>{let a=.5,t=0,n=0;for(let i=0;i<o;i++){t+=a*ruido2(x,y);n+=a;a*=.5;x=x*2.03+17.1;y=y*2.03+9.7}return t/n};

// Cor sRGB em hexadecimal para linear
const cTmp=new THREE.Color();
export const lin=h=>{cTmp.set(h);return [cTmp.r,cTmp.g,cTmp.b]};

// Passe de tela cheia: um triângulo só, sem câmera de verdade
const triGeo=new THREE.BufferGeometry();triGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));triGeo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array([0,0,2,0,0,2]),2));
const camTela=new THREE.OrthographicCamera(-1,1,1,-1,0,1);const cenaTela=new THREE.Scene();const meshTela=new THREE.Mesh(triGeo,null);meshTela.frustumCulled=false;cenaTela.add(meshTela);
export function passe(r,mat,alvo){meshTela.material=mat;r.setRenderTarget(alvo);r.render(cenaTela,camTela)}
export const VS_TELA=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export function matTela(fs,uniforms={},extra={}){return new THREE.ShaderMaterial({vertexShader:VS_TELA,fragmentShader:fs,uniforms,depthTest:false,depthWrite:false,...extra})}

// Assa uma textura por shader: tudo o que seria imagem aqui nasce de código, na hora, na placa de vídeo
export function assa(r,fs,w,h,{uniforms={},repete=true,mips=true,tipo=THREE.UnsignedByteType,srgb=false,aniso=1}={}){
  const rt=new THREE.WebGLRenderTarget(w,h,{type:tipo,depthBuffer:false,stencilBuffer:false,generateMipmaps:mips,minFilter:mips?THREE.LinearMipmapLinearFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,wrapS:repete?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping,wrapT:repete?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping,anisotropy:aniso});
  if(srgb)rt.texture.colorSpace=THREE.SRGBColorSpace;
  const m=matTela(fs,uniforms);passe(r,m,rt);m.dispose();r.setRenderTarget(null);return rt.texture;
}
// Ruídos periódicos em GLSL, para texturas que repetem sem emenda
export const GLSL_RUIDO=`
float h1(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float h1(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
vec2 h2(vec2 p){vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));q+=dot(q,q.yzx+33.33);return fract((q.xx+q.yz)*q.zy);}
vec3 h3(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.xxy+p.yxx)*p.zyx);}
float vn(vec2 p,float per){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  float a=h1(mod(i,per)),b=h1(mod(i+vec2(1,0),per)),c=h1(mod(i+vec2(0,1),per)),d=h1(mod(i+vec2(1,1),per));return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
float fbmP(vec2 p,float per,int oct){float a=.5,t=0.,n=0.;for(int i=0;i<oct;i++){t+=a*vn(p,per);n+=a;a*=.5;p*=2.;per*=2.;}return t/n;}
float vor(vec2 p,float per){vec2 i=floor(p),f=fract(p);float d=9.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y),o=h2(mod(i+g,per));vec2 r=g+o-f;d=min(d,dot(r,r));}return sqrt(d);}
vec3 vorC(vec2 p,float per){vec2 i=floor(p),f=fract(p);float d=9.,id=0.;vec2 m=vec2(0.);for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y),o=h2(mod(i+g,per));vec2 r=g+o-f;float e=dot(r,r);if(e<d){d=e;id=h1(mod(i+g,per)+7.);m=r;}}return vec3(sqrt(d),id,m.x);}
float vor3(vec3 p,float per){vec3 i=floor(p),f=fract(p);float d=9.;for(int z=-1;z<=1;z++)for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec3 g=vec3(x,y,z),o=h3(mod(i+g,per));vec3 r=g+o-f;d=min(d,dot(r,r));}return sqrt(d);}
float gr3(vec3 p,float per){vec3 i=floor(p),f=fract(p),u=f*f*f*(f*(f*6.-15.)+10.);
  #define G(a) dot(h3(mod(i+a,per))*2.-1.,f-a)
  return mix(mix(mix(G(vec3(0,0,0)),G(vec3(1,0,0)),u.x),mix(G(vec3(0,1,0)),G(vec3(1,1,0)),u.x),u.y),mix(mix(G(vec3(0,0,1)),G(vec3(1,0,1)),u.x),mix(G(vec3(0,1,1)),G(vec3(1,1,1)),u.x),u.y),u.z);}
`;
