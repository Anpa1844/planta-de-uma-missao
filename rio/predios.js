// Os prédios da história em tamanho real, construídos com código a partir das fotos de cada marco (site/fotos
// e acervo da versão estendida). Medidas, fontes e o que é dedução: predios/FIDELIDADE.md.
// Cada função monta o prédio com a frente em +Z, a base em y = 0 e o eixo no centro da fachada. Unidade: metro.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- Materiais ----------
function tela(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);return c}
function textura(c,rep=true,srgb=true){const t=new THREE.CanvasTexture(c);if(rep)t.wrapS=t.wrapT=THREE.RepeatWrapping;if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
function ambienteCeu(renderer){
  const s=new THREE.Scene();s.add(new THREE.Mesh(new THREE.SphereGeometry(10,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:`varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 p;void main(){float h=p.y;vec3 ceu=mix(vec3(.82,.88,.95),vec3(.28,.46,.78),smoothstep(0.,.6,h));vec3 mata=mix(vec3(.05,.09,.04),vec3(.12,.2,.08),smoothstep(-.1,.14,h));vec3 c=h>.14?ceu:mata;gl_FragColor=vec4(c,1.);}`})));
  const g=new THREE.PMREMGenerator(renderer),t=g.fromScene(s,.01).texture;g.dispose();return t;
}
export function criaKit(renderer){
  const env=ambienteCeu(renderer),cache={},comEnv=[];
  const reg=(m,i=.5)=>{m.envMap=env;m.envMapIntensity=i;m.userData.env=i;comEnv.push(m);return m};
  const reboco=textura(tela(512,512,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);for(let i=0;i<2600;i++){x.fillStyle=`rgba(40,36,30,${Math.random()*.035})`;const s=1+Math.random()*(Math.random()<.04?70:7);x.fillRect(Math.random()*w,Math.random()*h,s,s*(.4+Math.random()))}for(let i=0;i<34;i++){const px=Math.random()*w,l=30+Math.random()*180,g=x.createLinearGradient(0,0,0,l);g.addColorStop(0,'rgba(50,46,38,.12)');g.addColorStop(1,'rgba(50,46,38,0)');x.save();x.translate(px,Math.random()*h);x.fillStyle=g;x.fillRect(0,0,2+Math.random()*9,l);x.restore()}}));
  const K={env,comEnv,luz:{uT:{value:0},uN:{value:0}},
    reb:(c,r=.82)=>cache['r'+c]||(cache['r'+c]=reg(new THREE.MeshStandardMaterial({color:c,map:reboco,roughness:r}),.42)),
    plano:(c,r=.7,m=0)=>cache['p'+c+r+m]||(cache['p'+c+r+m]=reg(new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m}),.5)),
    vidro:(c=0x8fb0c9)=>cache['v'+c]||(cache['v'+c]=reg(new THREE.MeshStandardMaterial({color:c,roughness:.06,metalness:1}),1.15)),
    escuro:reg(new THREE.MeshStandardMaterial({color:0x0e1114,roughness:.55}),.3),
    telha:reg(new THREE.MeshStandardMaterial({map:textura(tela(512,512,(x,w,h)=>{const L=16,C=20;for(let j=0;j<L;j++)for(let i=0;i<C;i++){const v=Math.random(),r=150+v*50,g=78+v*30,b=52+v*22;x.fillStyle=`rgb(${r},${g},${b})`;x.fillRect(i*w/C,j*h/L,w/C-1,h/L-1);const gr=x.createLinearGradient(i*w/C,0,(i+1)*w/C,0);gr.addColorStop(0,'rgba(0,0,0,.34)');gr.addColorStop(.5,'rgba(255,240,220,.1)');gr.addColorStop(1,'rgba(0,0,0,.34)');x.fillStyle=gr;x.fillRect(i*w/C,j*h/L,w/C-1,h/L-1)}})),roughness:.85,side:THREE.DoubleSide}),.3),
    veneziana:(c='#14171a',l='rgba(150,150,140,.55)')=>cache['z'+c]||(cache['z'+c]=reg(new THREE.MeshStandardMaterial({map:textura(tela(128,128,(x,w,h)=>{x.fillStyle=c;x.fillRect(0,0,w,h);for(let i=0;i<8;i++){x.fillStyle=l;x.fillRect(0,i*16+2,w,5)}})),roughness:.75}),.25)),
    mosaico:(c,g='#d4d4cf')=>cache['m'+c]||(cache['m'+c]=reg(new THREE.MeshStandardMaterial({map:textura(tela(256,256,(x,w,h)=>{x.fillStyle=g;x.fillRect(0,0,w,h);for(let j=0;j<8;j++)for(let i=0;i<8;i++){const q=new THREE.Color(c).multiplyScalar(.82+Math.random()*.36);x.fillStyle='#'+q.getHexString();x.fillRect(i*32+1,j*32+1,30,30)}})),roughness:.42}),.8)),
    tabua:(c,n=10)=>cache['t'+c]||(cache['t'+c]=reg(new THREE.MeshStandardMaterial({map:textura(tela(256,256,(x,w,h)=>{x.fillStyle=c;x.fillRect(0,0,w,h);for(let i=0;i<n;i++){x.fillStyle='rgba(0,0,0,.42)';x.fillRect(0,i*h/n,w,2);for(let k=0;k<14;k++){x.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,230,190'},${Math.random()*.1})`;x.fillRect(Math.random()*w,i*h/n+Math.random()*h/n,40+Math.random()*120,1+Math.random()*2)}}})),roughness:.82}),.25)),
    pedra:reg(new THREE.MeshStandardMaterial({map:textura(tela(512,512,(x,w,h)=>{x.fillStyle='#8d877a';x.fillRect(0,0,w,h);for(let i=0;i<340;i++){const v=110+Math.random()*80;x.fillStyle=`rgb(${v},${v*.96},${v*.88})`;const a=14+Math.random()*44,b=10+Math.random()*26,px=Math.random()*w,py=Math.random()*h;x.beginPath();x.ellipse(px,py,a,b,Math.random()*3,0,6.28);x.fill();x.strokeStyle='rgba(30,28,24,.5)';x.lineWidth=2;x.stroke()}})),roughness:.92}),.25),
    atualiza(h){const k=.18+.82*h;for(const m of comEnv)m.envMapIntensity=m.userData.env*k*(m.userData.semLuz?1:1.9)} /* V5: o céu ilumina mais as fachadas, para a que fica na contraluz não sair cinza */,
    // ao entardecer as fachadas ganham luz própria, como prédios iluminados à noite
    noite(q){this.luz.uN.value=q;if(Math.abs(q-(this._q||0))<.01)return;this._q=q;for(const m of comEnv){if(m.userData.semLuz)continue;if(!m.userData.em0){m.userData.em0=true;m.emissive=m.color?m.color.clone():new THREE.Color(1,1,1)}m.emissiveIntensity=q*.16}}};
  return K;
}

// ---------- Construção ----------
const UVE=.25;
export class Obra{
  // k: fator de redução da malha, para os prédios desenhados em unidades da V2 e trazidos ao tamanho real
  constructor(K,k=1){this.K=K;this.lista=new Map();this.soltos=[];this.m=new THREE.Matrix4().makeScale(k,k,k)}
  face(ry,x=0,y=0,z=0){const f=Object.create(this);f.m=new THREE.Matrix4().multiplyMatrices(this.m,new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),ry),new THREE.Vector3(1,1,1)));return f}
  add(mat,g){const q=g.index?g.toNonIndexed():g;if(!q.attributes.normal)q.computeVertexNormals();if(!q.attributes.uv)q.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(q.attributes.position.count*2),2));for(const k of Object.keys(q.attributes))if(!['position','normal','uv'].includes(k))q.deleteAttribute(k);q.applyMatrix4(this.m);if(!this.lista.has(mat))this.lista.set(mat,[]);this.lista.get(mat).push(q);return this}
  caixa(mat,x0,x1,y0,y1,z0,z1,e=UVE){const w=x1-x0,h=y1-y0,d=z1-z0,g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv;
    for(let f=0;f<6;f++){const su=f<2?d:w,sv=f===2||f===3?d:h;for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,uv.getX(k)*su*e+x0*e,uv.getY(k)*sv*e+y0*e)}}
    g.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);return this.add(mat,g)}
  // Polígono (x,y) extrudado em z, com furos opcionais
  chapa(mat,pts,z0,z1,furos=[]){const s=new THREE.Shape(pts.map(p=>new THREE.Vector2(p[0],p[1])));for(const f of furos)s.holes.push(new THREE.Path(f.map(p=>new THREE.Vector2(p[0],p[1]))));const g=new THREE.ExtrudeGeometry(s,{depth:z1-z0,bevelEnabled:false,curveSegments:10});g.translate(0,0,z0);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*UVE,uv.getY(i)*UVE);return this.add(mat,g)}
  // Quadrilátero livre, para telhados: pontos em ordem anti-horária vistos de fora
  quad(mat,a,b,c,d,e=UVE*1.6){const g=new THREE.BufferGeometry(),A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),D=new THREE.Vector3(...d),L=A.distanceTo(B),H=A.distanceTo(D);g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c,...a,...c,...d],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,L*e,0,L*e,H*e,0,0,L*e,H*e,0,H*e],2));g.computeVertexNormals();return this.add(mat,g)}
  tri(mat,a,b,c,e=UVE*1.6){const g=new THREE.BufferGeometry(),L=new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b));g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,L*e,0,L*e/2,L*e*.7],2));g.computeVertexNormals();return this.add(mat,g)}
  // Janela na fachada: vidro, aro e caixilhos, levemente à frente do plano z
  janela(x0,x1,y0,y1,{col=1,lin=1,z=0,aro=.08,cor=null,vidro=null,fundo=null}={}){const K=this.K,c=cor||K.plano('#f1f0ea',.5),v=vidro||K.escuro,bar=aro*.62;
    if(fundo)this.caixa(fundo,x0-aro*1.8,x1+aro*1.8,y0-aro*1.8,y1+aro*1.8,z,z+.02);
    this.caixa(v,x0,x1,y0,y1,z+.015,z+.035);
    for(const [a,b,e,d] of[[x0-aro,x1+aro,y0-aro,y0],[x0-aro,x1+aro,y1,y1+aro],[x0-aro,x0,y0,y1],[x1,x1+aro,y0,y1]])this.caixa(c,a,b,e,d,z,z+.09);
    for(let i=1;i<col;i++){const q=x0+(x1-x0)*i/col;this.caixa(c,q-bar/2,q+bar/2,y0,y1,z,z+.07)}
    for(let j=1;j<lin;j++){const q=y0+(y1-y0)*j/lin;this.caixa(c,x0,x1,q-bar/2,q+bar/2,z,z+.07)}return this}
  // Letreiro ou logotipo desenhado em canvas
  placa(x0,x1,y0,y1,z,desenha,{px=48,fundo=false,met=0}={}){const w=Math.round((x1-x0)*px),h=Math.round((y1-y0)*px),c=tela(Math.min(4096,w),Math.min(2048,h),(q,W,H)=>{q.save();q.scale(W/(x1-x0),H/(y1-y0));desenha(q,x1-x0,y1-y0);q.restore()}),t=textura(c,false);t.generateMipmaps=true;
    const mat=new THREE.MeshStandardMaterial({map:t,transparent:!fundo,alphaTest:fundo?0:.08,depthWrite:!!fundo,roughness:.7,metalness:met,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    const g=new THREE.PlaneGeometry(x1-x0,y1-y0);g.translate((x0+x1)/2,(y0+y1)/2,z);g.applyMatrix4(this.m);const m=new THREE.Mesh(g,mat);m.renderOrder=1;this.soltos.push(m);return this}
  // Faixa de arco: anel entre dois arcos, com a parte reta até o chão
  arcoFaixa(mat,x0,x1,yBase,yTopo,esp,z0,z1){const o=arcoPts(x0,x1,yBase,yTopo),i=arcoPts(x0+esp,x1-esp,yBase,yTopo-esp);return this.chapa(mat,[...o,...i.reverse()],z0,z1)}
  janelaArco(x0,x1,yBase,yTopo,{z=0,col=4,lin=6,cor=null,vidro=null,aro=.07}={}){const K=this.K,c=cor||K.plano('#eeeee8',.5),v=vidro||K.vidro(0x5c7d92);this.chapa(v,arcoPts(x0,x1,yBase,yTopo),z+.01,z+.03);
    const r=(x1-x0)/2,cx=(x0+x1)/2,ys=yTopo-r;const yEm=x=>{const d=(x-cx)/r;return ys+r*Math.sqrt(Math.max(0,1-d*d))};
    for(let i=1;i<col;i++){const q=x0+(x1-x0)*i/col;this.caixa(c,q-aro/2,q+aro/2,yBase,yEm(q)-.02,z,z+.07)}
    for(let j=1;j<lin;j++){const q=yBase+(yTopo-yBase)*j/lin,xe=q<=ys?r:r*Math.sqrt(Math.max(0,1-Math.pow((q-ys)/r,2)));if(xe>.05)this.caixa(c,cx-xe,cx+xe,q-aro/2,q+aro/2,z,z+.07)}
    this.arcoFaixa(c,x0-aro,x1+aro,yBase,yTopo+aro,aro,z,z+.09);return this}
  fim(sombra=true){const g=new THREE.Group();for(const [mat,l] of this.lista){const m=new THREE.Mesh(mergeGeometries(l,false),mat);m.castShadow=sombra;m.receiveShadow=sombra;g.add(m)}for(const s of this.soltos)g.add(s);return g}
}
function arcoPts(x0,x1,yBase,yTopo,n=20){const r=(x1-x0)/2,cx=(x0+x1)/2,ys=yTopo-r,p=[[x0,yBase]];for(let i=0;i<=n;i++){const a=Math.PI*(1-i/n);p.push([cx+Math.cos(a)*r,ys+Math.sin(a)*r])}p.push([x1,yBase]);return p}
// Muro baixo com aberturas quadradas e pilares, como nas fotos dos templos antigos
function mureta(o,x0,x1,z,{h=1.25,cor,cap,esp=.32,furos=true,passo=5.2}={}){const K=o.K,c=cor||K.reb('#e0dbcd');o.caixa(c,x0,x1,0,h,z-esp/2,z+esp/2);o.caixa(cap||c,x0,x1,h,h+.1,z-esp*.7,z+esp*.7);
  if(furos)for(let x=x0+.5;x<x1-.3;x+=.82)o.caixa(K.escuro,x,x+.34,h*.46,h*.8,z+esp/2,z+esp/2+.01);
  for(let x=x0;x<=x1+.01;x+=passo){const a=Math.min(x,x1);o.caixa(c,a-.34,a+.34,0,h+.5,z-esp*.9,z+esp*.9);o.caixa(cap||c,a-.42,a+.42,h+.5,h+.64,z-esp*1.1,z+esp*1.1)}return o}
function telhadoDuasAguas(o,mat,x0,xc,x1,yE0,yC,yE1,z0,z1,beiral=.0){o.quad(mat,[x0,yE0,z1],[xc,yC,z1],[xc,yC,z0],[x0,yE0,z0]);o.quad(mat,[xc,yC,z1],[x1,yE1,z1],[x1,yE1,z0],[xc,yC,z0]);return o}
// Logotipo adventista simplificado: chama de três linhas sobre a Bíblia aberta
function logoIASD(q,cx,cy,t,cor='#fff'){q.save();q.translate(cx,cy);q.scale(t,t);q.fillStyle=cor;q.strokeStyle=cor;q.lineCap='round';q.lineWidth=.075;
  for(const [a,b,c] of[[-.2,-.9,.05],[.0,-.72,.13],[.2,-.5,.2]]){q.beginPath();q.moveTo(a-.1,.22);q.bezierCurveTo(a-.5,b*.4,a+.45,b*.55,a+c,b);q.bezierCurveTo(a+.32,b*.5,a-.2,b*.15,a+.1,.22);q.closePath();q.fill()}
  q.beginPath();q.moveTo(0,.42);q.quadraticCurveTo(-.34,.22,-.82,.3);q.lineTo(-.82,.42);q.quadraticCurveTo(-.34,.34,0,.56);q.quadraticCurveTo(.34,.34,.82,.42);q.lineTo(.82,.3);q.quadraticCurveTo(.34,.22,0,.42);q.fill();q.restore()}
function logoNT(q,cx,cy,t){q.save();q.translate(cx,cy);q.scale(t,t);q.fillStyle='#1d4ea8';q.fillRect(-.5,-.5,1,.86);q.fillStyle='#f2c81d';q.beginPath();q.arc(0,-.2,.14,0,6.283);q.fill();q.lineWidth=.13;q.strokeStyle='#f2c81d';q.lineCap='round';q.beginPath();q.moveTo(-.34,-.28);q.quadraticCurveTo(-.16,.14,0,.14);q.quadraticCurveTo(.16,.14,.34,-.28);q.stroke();q.restore()}
const FONTE='Georgia,"Times New Roman",serif',SANS='"Arial Black",Arial,sans-serif';
function txt(q,s,x,y,t,cor,{f=FONTE,peso=700,al='center',esp=0}={}){q.fillStyle=cor;q.font=`${peso} ${t}px ${f}`;q.textAlign=al;q.textBaseline='middle';if(q.letterSpacing!==undefined)q.letterSpacing=esp+'px';q.fillText(s,x,y)}

// Telhado de quatro águas sobre o retângulo a..c (x) por t..f (z): beiral em yE, cumeeira em yC, no sentido do lado maior
function quatroAguas(o,mat,a,c,t,f,yE,yC){const dx=c-a,dz=f-t;
  if(dx>=dz){const r=dz/2,zm=(t+f)/2;o.quad(mat,[a,yE,f],[c,yE,f],[c-r,yC,zm],[a+r,yC,zm]);o.quad(mat,[c,yE,t],[a,yE,t],[a+r,yC,zm],[c-r,yC,zm]);o.tri(mat,[a,yE,t],[a,yE,f],[a+r,yC,zm]);o.tri(mat,[c,yE,f],[c,yE,t],[c-r,yC,zm])}
  else{const r=dx/2,xm=(a+c)/2;o.quad(mat,[a,yE,t],[a,yE,f],[xm,yC,f-r],[xm,yC,t+r]);o.quad(mat,[c,yE,f],[c,yE,t],[xm,yC,t+r],[xm,yC,f-r]);o.tri(mat,[a,yE,f],[c,yE,f],[xm,yC,f-r]);o.tri(mat,[c,yE,t],[a,yE,t],[xm,yC,t+r])}return o}
// Sorteio com semente, para a geometria sair sempre igual
function sorteio(s){return()=>{s=(s*16807)%2147483647;return s/2147483647}}

// As medidas de cada prédio, com a foto usada e o raciocínio, estão em predios/FIDELIDADE.md.
// ---------- 1937: Templo Adventista de Fortaleza, Missão Costa Norte (fotos m05_1 e m05_2) ----------
// Desenhado na malha da V2 e reduzido por k = 0,64 para o tamanho medido nas fotos:
// fachada 10,2 m, comprimento 24,3 m, torres 9,9 a 10,4 m, parede lateral 7,4 m, alpendre 4,3 m.
export function templo1937(K){
  const o=new Obra(K,.64),CL=K.reb('#ded8c9'),CD=K.reb('#9b9182'),PL=K.reb('#a89f90'),W=16,L=38,HW=11.5;
  o.caixa(CD,-W/2,W/2,0,HW,-L,-1.4);
  // Empena da frente: três torres altas e dois coroamentos baixos, com frisos verticais
  o.caixa(CL,-W/2,W/2,0,12.6,-1.4,0);
  for(const [a,b,h] of[[-8,-5.6,15.4],[-2,2,16.2],[5.6,8,15.4]]){o.caixa(CL,a,b,6,h,-1.4,.22);const n=a===-2?4:3;for(let i=0;i<=n;i++){const x=a+(b-a)*(.1+.8*i/n);o.caixa(CL,x-.07,x+.07,6.4,h-.15,.22,.36)}}
  for(const [a,b] of[[-5,-2.6],[2.6,5]]){o.caixa(CL,a,b,12.6,13.3,-1.2,.06);o.caixa(CL,a-.16,b+.16,13.3,13.56,-1.34,.2)}
  // Alpendre com o letreiro
  const PW=6.6,PD=5;o.caixa(CL,-PW,PW,5.4,6.7,0,PD);o.caixa(K.plano('#2b2a27',.9),-PW+.3,PW-.3,5.36,5.4,.2,PD-.3);
  for(let x=-PW+.2;x<PW;x+=.52)o.caixa(CL,x,x+.26,6.7,7.08,PD-.3,PD);
  o.placa(-PW+.3,PW-.3,5.5,6.6,PD+.02,(q,w,h)=>{txt(q,'TEMPLO ADVENTISTA',w/2,h*.54,.72,'#3c372d',{f:SANS,peso:800,esp:.06})},{px:110});
  for(const x of[-PW+.45,PW-.45]){o.caixa(CL,x-.46,x+.46,0,5.4,PD-.92,PD);o.caixa(CL,x-.72,x+.72,0,1.9,PD-1.14,PD+.2)}
  o.caixa(K.escuro,-PW+.9,PW-.9,0,5.36,.03,.07);for(const x of[-3.6,3.6])o.caixa(CL,x-.9,x+.9,0,3.2,.07,.22);
  o.caixa(K.plano('#b9b4a7',.9),-PW-.2,PW+.2,0,.3,0,PD+.5);
  // Lateral longa: torres, reentrâncias, frisos e janelas de veneziana, na ordem da foto m05_1
  const lateral=(f)=>{const V=K.veneziana();f.caixa(PL,0,L,0,2.4,-.04,.05);
    const pil=(a,b,h)=>{f.caixa(CL,a,b,2.4,h,-.02,.34);f.caixa(CL,a-.1,b+.1,2.4,3.3,-.02,.46);for(const k of[.3,.7])f.caixa(CL,a+(b-a)*k-.05,a+(b-a)*k+.05,3.6,h-.18,.34,.42)};
    const baia=(a,b,cap=11.9)=>{f.caixa(CL,a+.5,b-.5,HW-.1,cap,-.02,.18);f.caixa(CL,a+.34,b-.34,cap,cap+.2,-.04,.28);const c=(a+b)/2;f.caixa(CL,c-.24,c+.24,8.9,HW-.2,.02,.14);const w=Math.min(1.5,(b-a)*.42);f.janela(c-w,c+w,6.6,8.3,{z:.02,aro:.1,cor:CL,vidro:V});f.janela(c-w,c+w,2.9,6,{z:.02,aro:.1,cor:CL,vidro:V})};
    pil(0,2.5,14.2);baia(2.5,7);pil(7,8.6,13.4);
    f.caixa(CL,8.6,15.2,0,12.6,-.02,.2);for(const a of[8.6,14])f.caixa(CL,a,a+1.2,12.6,14,-.02,.2);f.caixa(CL,10.3,13.5,12.6,13.2,-.02,.14);f.janela(10,13.8,6.6,8.4,{z:.2,aro:.1,cor:CL,vidro:V});f.janela(10,13.8,2.9,6,{z:.2,aro:.1,cor:CL,vidro:V});
    let u=15.2,i=0;while(u<L-1.5){pil(u,u+1.2,13-.08*i);const fim=Math.min(u+5,L-1.2);if(fim-u>2)baia(u+1.2,fim);u=fim;i++}pil(L-1.2,L,12.4)};
  lateral(o.face(Math.PI/2,W/2,0,0));lateral(o.face(-Math.PI/2,-W/2,0,-L));
  // Muro baixo vazado na frente e ao longo da lateral (1,2 m de altura real)
  const mu={h:1.9};mureta(o,-W/2-5,-2,9.2,mu);mureta(o,2,W/2+6,9.2,mu);mureta(o.face(Math.PI/2,W/2+6,0,9.2),0,L+8,0,mu);
  return o.fim();
}
// ---------- 1940: Templo Adventista de Manaus, Missão Central Amazonas (foto m06_1) ----------
// Fachada de 12 m: torres de canto, duas asas com janelas altas, dois contrafortes com frisos e o painel do letreiro.
export function templo1940(K){
  const o=new Obra(K),F=K.reb('#b3a187'),F2=K.reb('#a5937a'),S=K.reb('#e8e2d4'),CB=K.plano('#f1f0ea',.5),L=25,HN=7;
  o.caixa(S,-5.9,5.9,0,HN,-L,-.5);
  o.caixa(F,-5,-2.6,0,7.5,-.5,0);o.caixa(F,2.6,5,0,7.5,-.5,0);o.caixa(F,-1.6,1.6,0,8,-.5,0);
  for(const s of[-1,1]){
    // torre de canto, com o topo em degraus e o bloco claro em cima
    const a=s<0?-6:5,b=a+1;o.caixa(F2,a,b,0,7.7,-.8,.25);o.caixa(F2,a+.12,b-.12,7.7,8,-.7,.2);o.caixa(S,a+.26,b-.26,8,8.3,-.6,.14);
    for(const k of[.3,.7])o.caixa(F,a+k-.04,a+k+.04,.9,7.6,.25,.31);
    // contraforte saliente ao lado do painel central
    const c=s<0?-2.6:1.6,d=c+1;o.caixa(F2,c,d,0,8.3,-.8,.7);o.caixa(F2,c+.14,d-.14,8.3,8.65,-.7,.6);o.caixa(F2,c+.3,d-.3,8.65,8.9,-.6,.5);
    for(const k of[.25,.5,.75])o.caixa(F,c+k-.04,c+k+.04,3.9,8.2,.7,.76);
    for(const cx of[s*3.3,s*4.3]){o.janela(cx-.26,cx+.26,3.7,6.1,{lin:7,aro:.07,cor:CB});o.janela(cx-.26,cx+.26,1.25,2.75,{lin:4,aro:.07,cor:CB})}}
  for(const cx of[-.78,0,.78])o.janela(cx-.26,cx+.26,3.75,6.2,{lin:7,aro:.07,cor:CB});
  o.placa(-1.55,1.55,6.45,7.8,.02,(q,w,h)=>{txt(q,'TEMPLO',w/2,h*.26,.31,'#2b2620',{f:'Arial,sans-serif',peso:400,esp:.05});txt(q,'ADVENTISTA',w/2,h*.74,.31,'#2b2620',{f:'Arial,sans-serif',peso:400,esp:.03})},{px:140});
  // Marquise de cantos arredondados e porta de duas folhas
  const MQ=K.plano('#d8d2c2',.8);o.caixa(MQ,-1.95,1.95,3.3,3.55,0,1.6);o.caixa(MQ,-1.45,1.45,3.3,3.55,1.6,2.1);
  for(const s of[-1,1]){const c=new THREE.CylinderGeometry(.5,.5,.25,14,1,false,s>0?0:Math.PI*1.5,Math.PI/2);c.translate(s*1.45,3.425,1.6);o.add(MQ,c)}
  o.caixa(K.escuro,-1.3,1.3,0,3.3,.02,.04);for(const x of[-.62,.62])o.janela(x-.52,x+.52,.15,2.7,{col:2,lin:4,z:.04,aro:.06,cor:K.plano('#4b3a2a',.7),vidro:K.plano('#2a2017',.7)});
  // Telhado de quatro águas atrás da platibanda
  quatroAguas(o,K.telha,-6.1,6.1,-L-.2,-.6,HN,10.4);
  // Flancos claros com pilastras, janelas altas e janelinhas em cima
  const CJ=K.plano('#dcd6c7',.6);
  for(const fa of[o.face(Math.PI/2,5.9,0,-.8),o.face(-Math.PI/2,-5.9,0,-L)]){const C=L-.8;
    for(let u=1.2;u<C;u+=3){fa.caixa(S,u-.25,u+.25,0,HN+.35,0,.25);if(u+3<C+.5){fa.janela(u+1,u+2,1.2,3.9,{col:2,lin:4,aro:.07,cor:CJ});fa.janela(u+1.1,u+1.9,5,5.8,{col:2,lin:2,aro:.07,cor:CJ})}}
    fa.caixa(S,0,C,HN-.3,HN+.1,0,.1)}
  // Muro da frente com pilares, degraus e calçada
  const M=K.reb('#b3a993'),mu={h:1.3,cor:M,furos:false,passo:3.7,esp:.4};mureta(o,-9,-1.6,7,mu);mureta(o,1.6,9,7,mu);
  o.caixa(M,-2.2,2.2,0,.18,2.1,3.2);o.caixa(K.plano('#b9b4a7',.9),-6.4,6.4,0,.06,0,6.8);
  return o.fim();
}
// ---------- 1953: Hospital Belém (fotos do acervo: primeiro-hospital-belem-rua e -fachada) ----------
// Dois pavimentos caiados, 30 m de frente, telhado de quatro águas, platibanda recortada com o letreiro,
// marquise com sacada sobre quatro colunas e, na ponta esquerda, a varanda coberta com terraço.
export function hab1953(K){
  const o=new Obra(K),BR=K.reb('#efece2'),vd=K.vidro(0x33414b),cx=K.plano('#e9e6dc',.6),ci=K.plano('#b9b4a8',.9);
  const L=15,H=6.6,P=-11,B=.74,jan=(x,w,y0,y1,c=2,l=3,z=0)=>o.janela(x-w/2,x+w/2,y0,y1,{col:c,lin:l,z,aro:.07,cor:cx,vidro:vd});
  o.caixa(BR,-L,L,0,H,P,0);o.caixa(BR,-3.6,3.6,0,6.45,0,B);o.caixa(ci,-L-.12,L+.12,0,.45,P-.12,.12);
  // telhado de quatro águas com beiral e forro
  quatroAguas(o,K.telha,-L-.7,L+.7,P-.7,.7,H,9.5);o.caixa(cx,-L-.7,L+.7,H-.14,H-.01,P-.7,.7);
  // janelas: no andar, altas; no térreo, sob a laje fina corrida, com bandeira em cima
  for(const s of[-1,1]){
    for(const [x,w] of[[2.7,.9],[5.5,.9],[7.3,.9],[10.25,.9],[12.65,2]]){const c=w>1?4:2,z=x<3.6?B:0;jan(s*x,w,4.35,6.05,c,3,z);jan(s*x,w,1.2,2.5,c,2,z);jan(s*x,w,2.84,3.1,c,1,z)}
    o.caixa(BR,s>0?4.1:-14.6,s>0?14.6:-4.1,2.6,2.7,0,.55)}
  jan(0,1.6,4.2,6.05,3,3,B);o.caixa(BR,-3.6,3.6,2.6,2.7,B,B+.2);
  // entrada: marquise sobre quatro colunas, sacada de três frisos e porta
  o.caixa(BR,-2.7,2.7,3,3.18,B,3.2);
  for(let i=0;i<3;i++){const hw=2.7-.15*i,zf=3.2-.15*i,y0=3.18+.26*i,y1=y0+.26;o.caixa(BR,-hw,hw,y0,y1,zf-.15,zf);for(const s of[-1,1])o.caixa(BR,s>0?hw-.15:-hw,s>0?hw:-hw+.15,y0,y1,B,zf-.15)}
  for(const x of[-2.45,-1.25,1.25,2.45])o.caixa(BR,x-.14,x+.14,.3,3,2.8,3.08);
  o.caixa(ci,-2.9,2.9,0,.3,B,3.5);o.caixa(ci,-2.2,2.2,0,.15,3.5,3.9);jan(0,1.5,.3,2.5,2,3,B);
  // platibanda recortada e letreiro (na foto, sem acento)
  o.chapa(BR,[[-4.15,6.45],[4.15,6.45],[4.15,7.45],[3.4,7.45],[3.4,7.8],[1.5,8.6],[-1.5,8.6],[-3.4,7.8],[-3.4,7.45],[-4.15,7.45]],-.2,B);
  o.placa(-2.5,2.5,6.9,7.5,B+.02,(q,w,h)=>{txt(q,'HOSPITAL  BELEM',w/2,h*.52,.3,'#2b2a27',{f:'Arial,sans-serif',peso:700,esp:.09})},{px:120});
  // empenas laterais: três janelas no andar
  for(const f of[o.face(Math.PI/2,L,0,0),o.face(-Math.PI/2,-L,0,P)])for(const u of[2.2,5.5,8.8])f.janela(u-.6,u+.6,4.35,6.05,{col:2,lin:3,aro:.07,cor:cx,vidro:vd});
  for(const u of[2.2,5.5,8.8])o.face(Math.PI/2,L,0,0).janela(u-.6,u+.6,1.2,2.5,{col:2,lin:2,aro:.07,cor:cx,vidro:vd});
  // ponta esquerda: varanda sobre pilares com terraço de mureta cheia
  const X0=-L-4,Z0=P+1.5,Z1=-1.5;o.caixa(BR,X0,-L,2.7,3,Z0,Z1);
  for(const [x,z] of[[X0+.25,Z1-.25],[X0+.25,Z0+.25],[X0+.25,(Z0+Z1)/2],[-L-2,Z1-.25],[-L-2,Z0+.25]])o.caixa(BR,x-.2,x+.2,.3,2.7,z-.2,z+.2);
  o.caixa(BR,X0,-L,3,4.3,Z1-.15,Z1);o.caixa(BR,X0,-L,3,4.3,Z0,Z0+.15);o.caixa(BR,X0,X0+.15,3,4.3,Z0+.15,Z1-.15);o.caixa(ci,X0-.3,-L,0,.3,Z0-.3,Z1+.3);
  o.caixa(ci,-L-5,L+1,0,.06,.12,4.5);
  return o.fim();
}
// Torre treliçada vermelha e branca (m07_3 é um desenho; não há foto da torre real: ILUSTRATIVA).
// op.estais: mastro estaiado de seção constante (rádio AM, 30 a 40 m), com dois níveis de estais em quatro direções.
// Sem estais: torre autoportante que afina para cima (TV). As duas levam luz vermelha de balizamento: a do topo pisca (~1 Hz), a do meio é fixa.
export function torre(K,H=56,op={}){
  const E=!!op.estais,o=new Obra(K),V=K.plano('#b3261e',.6),B=K.plano('#e9e7e0',.6),G=E?(()=>1.5):((y)=>1.9+(H-y)/H*4.2);
  const lados=[[-1,-1],[1,-1],[1,1],[-1,1]];let y=0,i=0;const P=E?3:5.2,rm=E?.075:.13,rt=E?.04:.07,rd=E?.032:.055,MAS=E?3:6;
  while(y<H-.01){const y1=Math.min(H,y+P),g0=G(y)/2,g1=G(y1)/2,m=Math.floor(y/(H/7))%2?B:V;
    for(let k=0;k<4;k++){const [a,b]=lados[k],[c,d]=lados[(k+1)%4];o.add(m,cilEntre([a*g0,y,b*g0],[a*g1,y1,b*g1],rm,5));o.add(m,cilEntre([a*g1,y1,b*g1],[c*g1,y1,d*g1],rt,4));o.add(m,cilEntre([a*g0,y,b*g0],[c*g1,y1,d*g1],rd,4));if(!E)o.add(m,cilEntre([c*g0,y,d*g0],[a*g1,y1,b*g1],rd,4))}y=y1;i++}
  o.add(V,cilEntre([0,H,0],[0,H+MAS,0],E?.06:.1,6));
  if(E){const cabo=K.plano('#9a9c9e',.45,.7),bloco=K.reb('#b9b5aa'),Rr=H*.55;for(const [a,b] of[[1,0],[-1,0],[0,1],[0,-1]]){const x=a*Rr,z=b*Rr;for(const q of[.52,.97])o.add(cabo,cilEntre([a*.75,H*q,b*.75],[x,.5,z],.028,3));o.caixa(bloco,x-.6,x+.6,0,.6,z-.6,z+.6)}
    o.caixa(K.reb('#c9c5ba'),-1.1,1.1,0,.35,-1.1,1.1);o.caixa(K.reb('#c9c5ba'),2.2,5,0,2.5,-1.4,1.4);o.caixa(K.plano('#6b6a66',.8),2,5.2,2.5,2.7,-1.6,1.6)}
  else{o.caixa(K.reb('#c9c5ba'),-3.4,-.6,0,2.7,4.6,8);o.caixa(K.plano('#6b6a66',.8),-3.6,-.4,2.7,2.92,4.4,8.2)}
  const grp=o.fim(false);
  // luzes de balizamento: dois quadrados virados para a câmera, somados à cena; fracas de dia, fortes à noite
  {const g=new THREE.BufferGeometry(),yt=H+MAS+.2,ym=H*.5;g.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0,-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));g.setAttribute('aC',new THREE.Float32BufferAttribute([0,yt,0,1,0,yt,0,1,0,yt,0,1,0,yt,0,1,.9,ym,.9,0,.9,ym,.9,0,.9,ym,.9,0,.9,ym,.9,0],4));g.setIndex([0,1,2,0,2,3,4,5,6,4,6,7]);
    const m=new THREE.ShaderMaterial({uniforms:{uT:K.luz.uT,uN:K.luz.uN},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`attribute vec4 aC;uniform float uT,uN;varying vec2 vU;varying float vA;void main(){vec4 mv=viewMatrix*modelMatrix*vec4(aC.xyz,1.);float d=-mv.z;float r=max(.7,d*.005)*mix(.55,1.,uN);mv.xy+=position.xy*r;vU=position.xy;
        float pisca=pow(max(sin(uT*5.6),0.),2.5);vA=mix(.22,1.,uN)*mix(.55,pisca,aC.w);gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`varying vec2 vU;varying float vA;void main(){float d=length(vU);gl_FragColor=vec4(vec3(1.,.07,.03)*(exp(-d*d*9.)*5.+exp(-d*2.6)*.5)*vA*smoothstep(1.,.7,d),1.);}`});
    const q=new THREE.Mesh(g,m);q.frustumCulled=false;q.renderOrder=26;q.name='balizamento';q.userData.semSombra=true;grp.add(q)}
  return grp;
}
function cilEntre(a,b,r,seg=7){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),g=new THREE.CylinderGeometry(r,r,d.length(),seg,1,false);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));g.translate(...A.clone().add(B).multiplyScalar(.5).toArray());return g}
// ---------- 1995: Rádio Novo Tempo 1080 AM, Belém (fotos m07_1 e m07_2) ----------
// Sobrado de 9 m de frente (m07_1): térreo com o painel pintado e a porta de grade, andar com a varanda gradeada recuada,
// painel-letreiro saliente no topo, duas parabólicas e o mastro. Ao lado, o estúdio térreo de 6 m da foto m07_2
// (letreiro pintado, parede de vidro e toldo listrado). A posição relativa dos dois é dedução.
export function radio1995(K){
  const o=new Obra(K),BR=K.reb('#f0ebe4'),MR=K.plano('#9a6654',.8),GR=K.plano('#2e2523',.7,.3),cz=K.plano('#a4a29a',.9),D=11,TE='#2c7f85',AZ='#2d3a8c',VM='#c04a48';
  o.caixa(BR,-4.5,4.5,0,2.55,-D,0);o.caixa(BR,-4.62,4.62,2.55,2.98,-D,.12);
  // andar: peitoril com floreira, varanda recuada 1,4 m e grade de ferro
  o.caixa(BR,-4.5,4.5,2.98,3.65,-.25,0);o.caixa(MR,-.6,2.6,3.18,3.5,0,.03);
  o.caixa(BR,-4.5,4.5,2.98,5.9,-D,-1.4);for(const s of[-1,1])o.caixa(BR,s>0?4.25:-4.5,s>0?4.5:-4.25,2.98,5.9,-1.4,-.25);
  o.janela(-3.6,3.6,3.85,5.45,{col:4,z:-1.4,aro:.08,cor:K.plano('#3a2f2c',.7),vidro:K.escuro});
  for(let x=-4.2;x<4.22;x+=.14)o.caixa(GR,x-.01,x+.01,3.65,5.62,-.07,-.05);for(const y of[3.68,4.62,5.6])o.caixa(GR,-4.25,4.25,y,y+.03,-.08,-.04);
  // laje de cobertura em balanço com forro marrom e o painel do letreiro na borda
  o.caixa(BR,-4.5,4.5,5.9,6.3,-D,1);o.caixa(MR,-4.48,4.48,5.87,5.9,-1.38,.98);o.caixa(BR,-4.5,4.5,6.3,7.3,.85,1);
  for(const s of[-1,1])o.caixa(BR,s>0?4.35:-4.5,s>0?4.5:-4.35,6.3,6.7,-D,.85);
  o.placa(-4.4,4.4,6.08,7.26,1.02,(q,w,h)=>{
    q.fillStyle='#f2a41f';q.beginPath();q.arc(w*.115,h*.4,h*.34,0,6.283);q.fill();q.strokeStyle='#f7c95a';q.lineWidth=.035;for(const r of[.14,.22,.3]){q.beginPath();q.arc(w*.15,h*.3,h*r+.12,1.4,3.4);q.stroke()}
    q.fillStyle='#f2c81d';q.fillRect(w*.03,h*.6,w*.17,h*.26);txt(q,'NOVO TEMPO',w*.115,h*.74,.15,AZ,{f:SANS,peso:900});
    txt(q,'NOVO TEMPO',w*.53,h*.56,.66,AZ,{f:SANS,peso:900});txt(q,'RÁDIO',w*.775,h*.17,.21,AZ,{peso:700});txt(q,'1080',w*.93,h*.4,.27,VM,{f:SANS,peso:900});txt(q,'AM',w*.93,h*.68,.25,VM,{f:SANS,peso:900})},{px:110});
  // térreo: painel pintado com o sol, porta de grade e caixa de luz
  o.placa(-4.2,-1.45,.12,2.42,.02,(q,w,h)=>{q.fillStyle='#f2c230';q.fillRect(0,0,w,h);q.strokeStyle='#e8742c';q.lineWidth=.16;for(const r of[.5,.85,1.2,1.55]){q.beginPath();q.arc(w*.38,h*.36,r,0,6.283);q.stroke()}
    q.fillStyle='#f2c230';q.fillRect(0,h*.6,w,h*.4);txt(q,'RÁDIO',w*.72,h*.6,.2,'#3b2a28',{peso:700});txt(q,'NOVO TEMPO',w*.5,h*.74,.38,'#1d1b33',{f:SANS,peso:900});txt(q,'1080 AM',w*.5,h*.9,.2,VM,{f:SANS,peso:900})},{px:90,fundo:true});
  o.caixa(K.escuro,-1.25,-.35,0,2.3,.02,.04);for(let x=-1.2;x<-.36;x+=.105)o.caixa(GR,x-.012,x+.012,0,2.3,.04,.065);for(const y of[.05,1.1,2.24])o.caixa(GR,-1.25,-.35,y,y+.04,.04,.07);
  o.caixa(K.plano('#c9c5ba',.8),-1.1,-.5,2.05,2.3,.07,.2);
  // parabólicas e mastro no telhado
  for(const [x,z,R,inc,gy,cor] of[[1.3,-3.2,1.7,.95,.25,'#e6e5e0'],[-2.9,-2.6,1.15,.8,-.5,'#39507a']]){const pr=[];for(let i=0;i<=8;i++){const r=i/8*R;pr.push(new THREE.Vector2(r,r*r*.22/R))}
    const M=new THREE.MeshStandardMaterial({color:cor,roughness:.6,side:THREE.DoubleSide}),d=new THREE.LatheGeometry(pr,22);d.rotateX(inc);d.rotateY(gy);d.translate(x,6.3+R*.75+.5,z);o.add(M,d);o.add(K.plano('#6b6f76',.5,.3),cilEntre([x,6.3,z],[x,6.3+R*.75+.5,z],.06))}
  o.add(K.plano('#d9d9d6',.5,.4),cilEntre([-2,6.3,-1.8],[-2,10.9,-1.8],.045));o.add(K.plano('#d9d9d6',.5,.4),cilEntre([-2.45,10.5,-1.8],[-1.55,10.7,-1.8],.02));
  // estúdio térreo ao lado (m07_2)
  const a=o.face(0,-7.7,0,-1),cor=K.plano('#f3f2ec',.5);
  a.caixa(BR,-3,3,0,5.05,-9,0);a.caixa(K.plano('#8f8e8a',.8),-3.08,3.08,5.05,5.2,-9.08,.1);a.caixa(cz,-3.2,3.2,0,.36,0,1.3);a.caixa(cz,-3.2,3.2,0,.18,1.3,1.7);
  a.placa(-2.85,2.85,3.25,4.92,.02,(q,w,h)=>{
    txt(q,'RÁDIO',w*.2,h*.27,.5,TE,{f:SANS,peso:900});txt(q,'1080 AM.',w*.2,h*.62,.34,'#2d62a3',{f:SANS,peso:900});txt(q,'ESTÚDIO & ESCRITÓRIO',w*.21,h*.9,.135,VM,{f:'Arial,sans-serif',peso:700});
    txt(q,'NOVO',w*.82,h*.5,.44,TE,{f:SANS,peso:900});txt(q,'TEMPO',w*.83,h*.82,.46,TE,{f:SANS,peso:900});
    // emblema NT em degradê, azul em cima e rosa embaixo
    q.save();q.translate(w*.53,h*.5);q.scale(.36,.36);const G=q.createLinearGradient(0,-1.9,0,1.9);G.addColorStop(0,'#c9d6df');G.addColorStop(.35,'#7f9fbe');G.addColorStop(.62,'#f1c6a5');G.addColorStop(.8,'#e88a78');G.addColorStop(1,'#d9625c');q.fillStyle=G;
    q.beginPath();q.moveTo(-.5,-1.9);q.lineTo(2.3,-1.9);q.lineTo(1.6,-.95);q.lineTo(.75,-.95);q.lineTo(-.25,.75);q.lineTo(-1.5,.75);q.closePath();q.fill();
    q.beginPath();q.moveTo(-2.3,-.75);q.lineTo(-1,-.75);q.lineTo(.25,.9);q.lineTo(1.05,-.1);q.lineTo(1.6,-.1);q.lineTo(1.1,1.0);q.arc(0,.95,1.1,0,3.14);q.closePath();q.fill();q.restore()},{px:120});
  a.janela(-2.9,.4,2.76,3.08,{col:4,aro:.07,cor,vidro:K.plano('#2f5589',.4)});a.janela(-2.9,.4,.45,2.62,{col:4,lin:3,aro:.07,cor,vidro:K.vidro(0xa8c0cf)});
  a.janela(.7,2.85,.45,3,{col:3,lin:2,aro:.07,cor,vidro:K.vidro(0x54666f)});
  const tx=new THREE.MeshStandardMaterial({map:textura(tela(256,64,(q,w,h)=>{for(let i=0;i<16;i++){q.fillStyle=i%2?'#efe6dc':'#b45a55';q.fillRect(i*16,0,16,h)}})),roughness:.8,side:THREE.DoubleSide});
  const A0=.5,A1=3.02,yA=3.22,yB=2.4,zB=1.15;a.quad(tx,[A0,yB,zB],[A1,yB,zB],[A1,yA,.04],[A0,yA,.04],.8);a.quad(tx,[A0,yB-.24,zB],[A1,yB-.24,zB],[A1,yB,zB],[A0,yB,zB],.8);a.tri(tx,[A0,yB,zB],[A0,yA,.04],[A0,yB,.04],.8);
  o.caixa(cz,-11,4.9,0,.06,0,3);
  return o.fim();
}
// ---------- 1996: Sede da Associação em Marituba, BR-316 (foto m08_1) ----------
// Desenhado na malha da V2 e reduzido por k = 0,70: corpo dos arcos com 14,3 m de frente e cumeeira a 10,3 m,
// arcos de 3,6 a 6,9 m de altura, alas com beiral a 3,7 m.
export function sede1996(K){
  const o=new Obra(K,.7),BR=K.reb('#ece9e0'),ARCO=K.reb('#ad6a5a'),IN=K.reb('#9ca69a'),D=20,TOP=[4.4,14.2];
  // Arcos: da esquerda para a direita, crescendo até o quarto, como na foto
  const AR=[[-10,-5.2,5.2],[-5.3,-1,7],[-1,2.1,8.3],[2.1,6.7,9.9],[6.7,10,8.5]];
  const contorno=[[-10.3,0],[10.2,0],[10.2,10],TOP,[-10.3,5.7]],furos=AR.map(([a,b,h])=>arcoPts(a+.28,b-.28,0,h-.28).reverse());
  o.chapa(BR,contorno,-.6,0,furos);
  for(const [a,b,h] of AR){o.arcoFaixa(ARCO,a,b,0,h,.3,0,.14);
    // reveal do arco e fachada de vidro recuada
    o.arcoFaixa(IN,a+.28,b-.28,0,h-.28,.16,-3,-.3);const wa=a+.55,wb=b-.55,hw=h-.75;o.janelaArco(wa,wb,0,hw,{z:-3,col:Math.max(3,Math.round((wb-wa)/.72)),lin:Math.round(hw/.9),vidro:K.vidro(0x6c8a9c)})}
  // Fundo dos arcos e corpo do pavilhão
  o.chapa(BR,[[-10.3,0],[10.2,0],[10.2,10],TOP,[-10.3,5.7]],-D,-3.02);
  // Telhado principal assimétrico, com beiral largo e caibros à vista
  const E0=[-11.6,5.05],E1=[11.3,9.4],Tm=K.telha;const fr=1.1;
  o.quad(Tm,[E0[0],E0[1],fr],[TOP[0],TOP[1]+.55,fr],[TOP[0],TOP[1]+.55,-D],[E0[0],E0[1],-D]);o.quad(Tm,[TOP[0],TOP[1]+.55,fr],[E1[0],E1[1],fr],[E1[0],E1[1],-D],[TOP[0],TOP[1]+.55,-D]);
  const MAD=K.plano('#4b3423',.8);o.quad(MAD,[E0[0],E0[1]-.06,fr],[E0[0],E0[1]-.06,-D],[TOP[0],TOP[1]+.42,-D],[TOP[0],TOP[1]+.42,fr]);o.quad(MAD,[E1[0],E1[1]-.06,fr],[TOP[0],TOP[1]+.42,fr],[TOP[0],TOP[1]+.42,-D],[E1[0],E1[1]-.06,-D]);
  for(let t=0;t<=1.001;t+=.125){const xa=E0[0]+(TOP[0]-E0[0])*t,ya=E0[1]+(TOP[1]+.5-E0[1])*t;o.caixa(MAD,xa-.06,xa+.06,ya-.2,ya,0,fr)}for(let t=.2;t<1;t+=.26){const xa=E1[0]+(TOP[0]-E1[0])*t,ya=E1[1]+(TOP[1]+.5-E1[1])*t;o.caixa(MAD,xa-.06,xa+.06,ya-.2,ya,0,fr)}
  o.add(K.plano('#6d3f2c',.8),cilEntre([E0[0],E0[1]+.03,fr],[TOP[0],TOP[1]+.58,fr],.09,5));o.add(K.plano('#6d3f2c',.8),cilEntre([TOP[0],TOP[1]+.58,fr],[E1[0],E1[1]+.03,fr],.09,5));
  // Alas baixas à direita (16,7 m) e à esquerda (8,2 m), com janelas em arco de peitoril vermelho
  for(const [x0,x1,s] of[[10.2,34,1],[-22,-10.3,-1]]){o.caixa(BR,x0,x1,0,5.4,-11,-3);const yR=8.2;o.quad(Tm,[x0,5.3,-1.9],[x1+.8,5.3,-1.9],[x1+.8,yR,-7.2],[x0,yR,-7.2]);o.quad(Tm,[x1+.8,5.3,-12.4],[x0,5.3,-12.4],[x0,yR,-7.2],[x1+.8,yR,-7.2]);o.caixa(K.plano('#3e3026',.8),x0,x1+.8,5.14,5.34,-3,-1.9);
    if(s>0)o.tri(Tm,[x1+.8,5.3,-1.9],[x1+.8,5.3,-12.4],[x1+.8,yR,-7.2]);else o.tri(Tm,[x0,5.3,-12.4],[x0,5.3,-1.9],[x0,yR,-7.2]);
    for(let x=x0+(s>0?2.4:1.8);x<x1-1.5;x+=4.5){const f=o.face(0,0,0,-3);f.arcoFaixa(ARCO,x-1.15,x+1.15,0,4.5,.18,0,.1);f.janelaArco(x-.92,x+.92,1.6,4.25,{z:.02,col:3,lin:3,vidro:K.vidro(0x33454f)});f.caixa(K.plano('#7c4a3b',.85),x-.92,x+.92,0,1.6,.02,.06)}}
  o.caixa(K.plano('#9a938b',.95),-12,12,0,.08,0,6);
  return o.fim();
}
// ---------- 2001: Sede da Missão Sul do Pará, Marabá (foto do jornal em m09_1) ----------
// 22 m de frente em dois pavimentos: bloco esquerdo de telhado baixo, corpo central com o telhado alto,
// torre lisa de 10,7 m, bloco direito com lanternim e anexo térreo na ponta.
export function sede2001(K){
  const o=new Obra(K),BR=K.reb('#edeae2'),CT=K.reb('#dcd9cf'),Tm=K.telha,vd=K.vidro(0x31404c),ES=K.plano('#f1f0ea',.6),FO=K.plano('#4b3423',.8);
  const jan=(x0,x1,y0,y1,c=2,l=2)=>o.janela(x0,x1,y0,y1,{col:c,lin:l,aro:.07,cor:ES,vidro:vd});
  // barra dos fundos com o telhado alto, de cumeeira paralela à fachada
  o.caixa(BR,-9.5,3.6,0,6.9,-12,-5);quatroAguas(o,Tm,-10.3,4.4,-12.8,-4.2,6.9,9.1);o.caixa(FO,-10.3,4.4,6.78,6.89,-12.8,-4.2);
  // corpo central à frente, com a água de frente em triângulo
  o.caixa(BR,-3,3.6,0,6.9,-5,0);quatroAguas(o,Tm,-3.8,4.4,-8.4,.8,6.9,9.1);o.caixa(FO,-3.8,4.4,6.78,6.89,-4.2,.8);
  // bloco esquerdo, mais baixo
  o.caixa(BR,-11,-3,0,6.2,-5,0);quatroAguas(o,Tm,-11.8,-2.7,-5.8,.8,6.2,8);o.caixa(FO,-11.8,-3,6.08,6.19,-5.8,.8);
  // torre lisa
  o.caixa(CT,3.6,5.8,0,10.7,-2.6,.4);o.caixa(CT,3.52,5.88,10.7,10.86,-2.68,.48);
  // bloco direito: duas águas, com o lanternim atrás
  o.caixa(BR,5.8,10.3,0,6,-9,0);o.quad(Tm,[5,6,.8],[11.1,6,.8],[11.1,8.1,-3],[5,8.1,-3]);o.quad(Tm,[11.1,6,-6.8],[5,6,-6.8],[5,8.1,-3],[11.1,8.1,-3]);o.tri(BR,[10.3,6,0],[10.3,6,-6],[10.3,8,-3]);o.caixa(FO,5.8,11.1,5.88,5.99,-6.8,.8);
  o.caixa(BR,6.2,8.6,6,8.7,-6.4,-3.6);o.quad(Tm,[5.8,8.6,-3.2],[9,8.6,-3.2],[9,9.3,-6.8],[5.8,9.3,-6.8]);
  // anexo térreo na ponta
  o.caixa(BR,10.3,11.6,0,3.1,-6,-.5);o.quad(Tm,[10.3,4.3,.1],[12,3.1,.1],[12,3.1,-6.6],[10.3,4.3,-6.6]);
  // aberturas nas posições da foto
  jan(-7.7,-6.6,1.6,2.85);jan(-7.7,-6.3,4.55,5.8,3);jan(-3.95,-3.4,4.7,5.8,1);o.janela(-4.5,-3.5,0,2.6,{col:1,lin:2,aro:.07,cor:ES,vidro:K.escuro});
  jan(-2,-.2,1.5,2.85,3);jan(-2,-.2,4.55,5.9,3);jan(1.05,1.6,5.3,5.8,1,1);o.janela(1.05,2.05,0,2.7,{col:1,lin:2,aro:.07,cor:ES,vidro:K.escuro});
  o.janela(5.95,6.75,0,2.5,{col:1,lin:2,aro:.07,cor:ES,vidro:K.escuro});jan(7.05,7.6,1.6,2.6,1);jan(8.1,8.65,1.6,2.6,1);jan(7.05,8.4,4.55,5.8,3);
  o.caixa(K.plano('#b5b0a5',.9),-12.2,12.2,0,.08,0,4.5);
  return o.fim();
}
// ---------- 2009: Sede da Missão Oeste do Pará, Santarém (fotos m10_1 e m10_2) ----------
// 32,7 m de frente. A entrada fica numa plataforma 1,4 m acima da calçada (escada e rampa); o bloco bege da esquerda
// desce até a rua e mostra três níveis. Moldura azul de 15,8 m, topo a 9,3 m da plataforma.
export function sede2009(K){
  const o=new Obra(K),BG=K.reb('#cdb8a4'),CR=K.reb('#e6dfcf'),AZ=K.plano('#2b3f94',.55),PR=K.plano('#dcdcd8',.45,.1),VN=K.reb('#6e2433',.65),pm=K.plano('#111316',.6,.2),cz=K.plano('#b7b4ab',.9),PJ=K.plano('#1c1e22',.7),TP=K.plano('#e2ded4',.7),FA=K.plano('#efeadd',.7),D=14,P=1.4;
  // bloco bege à esquerda, com frisos e três faixas de janelas estreitas
  o.caixa(BG,-13.1,-7.9,0,P+6.85,-D,0);o.caixa(TP,-13.16,-7.9,P+6.85,P+7.75,-D,.06);
  for(let y=.8;y<P+6.8;y+=.62)o.caixa(K.plano('#ab9b89',.9),-13.1,-7.9,y,y+.04,0,.02);
  for(const x of[-11.7,-10.5,-9.3]){o.caixa(FA,x-.42,x+.42,.3,P+6.7,0,.08);for(const [a,b] of[[P+3.9,P+6.3],[P+.7,P+3.1],[.5,P+.05]])o.janela(x-.15,x+.15,a,b,{z:.08,aro:.04,cor:FA,vidro:vd(K)})}
  // moldura azul: perna esquerda até o chão, viga do letreiro e perna direita apoiada na marquise
  o.caixa(AZ,-7.9,-6.1,0,P+6.55,-.5,.5);o.caixa(AZ,-7.9,7.9,P+6.55,P+9.3,-.5,.5);o.caixa(AZ,6.5,7.9,P+4.15,P+6.55,-.5,.5);
  o.placa(-7.7,7.7,P+6.7,P+9.2,.52,(q,w,h)=>{logoIASD(q,w*.1,h*.5,1.05);txt(q,'SEDE ADMINISTRATIVA DA',w*.5,h*.19,.3,'#fff',{esp:.02});txt(q,'IGREJA ADVENTISTA DO SÉTIMO DIA',w*.5,h*.47,.52,'#fff');txt(q,'MISSÃO OESTE DO PARÁ',w*.5,h*.78,.5,'#fff');logoNT(q,w*.92,h*.42,.95);txt(q,'NOVO TEMPO',w*.92,h*.8,.2,'#fff',{f:'Arial,sans-serif'})},{px:80});
  // parede creme do andar, recuada na moldura: três janelas pretas e o óculo
  o.caixa(CR,-6.1,7.9,P+2.65,P+6.55,-D,-.3);for(let y=P+4.6;y<P+6.5;y+=.5)o.caixa(K.plano('#cfc8b8',.9),-6.1,6.5,y,y+.03,-.3,-.28);
  for(const x of[-4.1,-.7,2.6])o.janela(x-.8,x+.8,P+4.45,P+5.55,{col:2,z:-.3,aro:.06,cor:PJ,vidro:vd(K)});
  {const c=new THREE.CylinderGeometry(.28,.28,.06,18);c.rotateX(Math.PI/2);c.translate(5,P+5.2,-.27);o.add(K.plano('#23262b',.5),c)}
  // marquise de chapas que atravessa a fachada
  o.caixa(PR,-6.1,19.6,P+2.65,P+4.15,-.3,2.3);for(let x=-6.1+1.15;x<19.6;x+=1.15)o.caixa(K.plano('#b5b4af',.6),x-.015,x+.015,P+2.65,P+4.15,2.3,2.32);
  // térreo recuado sobre a plataforma, com as portas de vidro
  o.caixa(cz,-6.1,7.9,0,P,-D,2.3);o.caixa(CR,-6.1,7.9,P,P+2.65,-D,-2.6);
  for(const x of[-.5,3.3])o.janela(x-1.1,x+1.1,P,P+2.3,{col:2,z:-2.6,aro:.08,cor:PJ,vidro:K.escuro});
  for(let i=0;i<6;i++)o.caixa(K.plano('#d8d6cf',.8),-1.9,2.6,0,P-.2*(i+1),2.3+.3*i,2.6+.3*i);
  // ala direita: parede vinho no térreo e volume creme recuado em cima
  o.caixa(VN,7.9,19.6,0,P+2.65,-D,-.2);for(let x=7.9+1.15;x<19.6;x+=1.15)o.caixa(K.plano('#541b27',.8),x-.015,x+.015,0,P+2.65,-.2,-.18);
  o.caixa(CR,7.9,17,P+2.65,P+6.5,-D,-2.6);o.caixa(TP,7.9,17.06,P+6.5,P+7.3,-D,-2.54);for(const x of[10.3,13.7])o.janela(x-.8,x+.8,P+4.5,P+5.5,{z:-2.6,aro:.06,cor:PJ,vidro:vd(K)});
  // patamar e rampa à esquerda, gradil preto e calçada
  o.caixa(cz,-6.1,-1.9,0,P,2.3,4.7);o.chapa(cz,[[-13.1,0],[-6.1,0],[-6.1,P]],3.2,4.7);
  const G=(x0,x1,z)=>{o.caixa(pm,x0,x1,0,.14,z-.04,z+.04);o.caixa(pm,x0,x1,1.84,1.9,z-.03,z+.03);for(let x=x0;x<=x1;x+=.2)o.caixa(pm,x,x+.03,.1,1.9,z-.015,z+.015);for(let x=x0;x<=x1+.01;x+=3)o.caixa(pm,x-.05,x+.05,0,2,z-.05,z+.05)};
  G(-13.4,-2.6,6.2);G(3.4,19.9,6.2);o.caixa(K.plano('#a8a59c',.9),-14.5,20.5,0,.08,4.7,9);
  return o.fim();
}
const vd=K=>K.vidro(0x202c36);
// ---------- 2014: TV Novo Tempo, canal 54 ----------
// Não há foto de prédio para esta baliza (m11 mostra o palco e o salão do evento). Volume térreo simples de 16 m,
// com o letreiro do canal: é dedução do começo ao fim (malha da V2 reduzida por k = 0,62).
export function tv2014(K){
  const o=new Obra(K,.62),BR=K.reb('#ecebe6');o.caixa(BR,-13,13,0,8,-14,0);o.caixa(K.plano('#1d4ea8',.55),-13.1,13.1,8,9.4,-14.1,.12);
  o.placa(-12.8,12.8,8.05,9.35,.15,(q,w,h)=>{txt(q,'TV NOVO TEMPO',w*.3,h*.52,.86,'#fff',{f:SANS});txt(q,'CANAL 54',w*.76,h*.52,.86,'#f2c81d',{f:SANS})},{px:50});
  o.janela(-11,-1.5,1,6.6,{col:6,lin:3,z:0,aro:.08,cor:K.plano('#cfd1d4',.4,.4),vidro:K.vidro(0x6d8fa8)});o.caixa(K.plano('#1d4ea8',.55),1.4,11.6,1,6.6,0,.1);
  o.placa(1.8,11.2,1.2,6.4,.13,(q,w,h)=>{logoNT(q,w*.22,h*.42,2.6);txt(q,'54',w*.68,h*.45,3,'#f2c81d',{f:SANS});txt(q,'UM NOVO TEMPO PARA VOCÊ',w*.5,h*.9,.42,'#fff',{f:'Arial,sans-serif'})},{px:60});
  o.caixa(K.plano('#b5b2a9',.9),-14,14,0,.2,0,5);
  return o.fim();
}
// ---------- 2014: Sede administrativa em Marituba, hoje Associação Norte do Pará (foto m12_1) ----------
// Pórtico de 14,3 m de largura por 16 m de altura; ala de vidro de 11,9 m e 10,9 m de altura; bloco salmão de 4,3 m na ponta.
export function sede2014(K){
  const o=new Obra(K),VE=K.mosaico('#2f5048'),SA=K.mosaico('#d8a68e','#d9c5b8'),VM=K.mosaico('#b5473a','#c76a5e'),PR=K.plano('#d6d7d8',.32,.55),JT=K.plano('#8f9193',.4,.5),BR=K.reb('#f0eee7'),AZ=K.vidro(0x7fb4d8),AM=K.plano('#cf9a3b',.3,.5),CX=K.plano('#2a3a3e',.4,.5),SL=K.reb('#d9a688');
  // Pórtico: dois pilares de pastilha verde e a capa branca de painéis
  for(const s of[-1,1])o.caixa(VE,s>0?5.6:-7.15,s>0?7.15:-5.6,0,14.3,-1.6,.6,1);
  o.caixa(PR,-7.15,7.15,14.3,16,-1.8,.75);for(let x=-7.15+1.43;x<7.1;x+=1.43)o.caixa(JT,x-.015,x+.015,14.3,16,.75,.77);
  // caixas salmão em balanço nos dois pavimentos de cima, com forro branco; vão livre de 7,4 m embaixo
  for(const s of[-1,1]){const a=s>0?3.5:-5.6,b=s>0?5.6:-3.5;o.caixa(SA,a,b,7.4,14.3,-6,.2,1);o.caixa(BR,a+.02,b-.02,7.36,7.4,-4.98,.18)}
  // moldura verde interna, vidros (azul em cima, âmbar no térreo) e o painel vermelho do letreiro
  for(const s of[-1,1])o.caixa(VE,s>0?3.05:-3.5,s>0?3.5:-3.05,0,14.3,-1.2,.34,1);o.caixa(VE,-3.05,3.05,13.5,14.3,-1.2,.34,1);
  for(const s of[-1,1]){const a=s>0?1.75:-3.05,b=s>0?3.05:-1.75;o.janela(a,b,3.75,13.45,{lin:9,z:-.5,aro:.05,cor:CX,vidro:AZ});o.janela(a,b,.4,3.65,{lin:3,z:-.5,aro:.05,cor:CX,vidro:AM})}
  o.caixa(VM,-1.75,1.75,.2,13.5,-.8,-.1,1);
  o.placa(-1.7,1.7,6.3,11.7,-.08,(q,w,h)=>{logoIASD(q,w/2,h*.16,1);txt(q,'IGREJA',w/2,h*.3,.2,'#fff');txt(q,'ADVENTISTA',w/2,h*.385,.43,'#fff');txt(q,'DO SÉTIMO DIA',w/2,h*.47,.3,'#fff');txt(q,'SEDE ADMINISTRATIVA',w/2,h*.545,.18,'#fff',{f:'Arial,sans-serif',peso:800,esp:.02});logoNT(q,w/2,h*.68,.72);txt(q,'Novo Tempo',w/2,h*.85,.24,'#1d4ea8',{f:'Arial,sans-serif',peso:800})},{px:110});
  o.caixa(BR,-3.05,3.05,0,.2,-1.2,.3);
  // corpo atrás do pórtico e parede do fundo do vão
  o.caixa(SL,-3.5,3.5,0,14.3,-10,-1.2);o.caixa(SL,-5.6,5.6,0,7.4,-10,-5);o.janela(-5.2,-4,4.1,5.8,{z:-5,aro:.06,cor:K.plano('#2b2f31',.4,.4),vidro:K.escuro});
  // Ala esquerda recuada: base de pastilha verde, faixas de painéis prateados e cortina de vidro azul
  const ZA=-3;o.caixa(BR,-19,-7.15,0,10.9,-13,ZA-.3);o.caixa(VE,-19,-10.5,0,3.3,ZA-.3,ZA,1);
  o.janela(-9.7,-7.9,.1,2.6,{col:2,z:ZA-.3,aro:.07,cor:K.plano('#2b2f31',.4,.4),vidro:K.escuro});
  for(const [y0,y1] of[[3.3,4.6],[9.2,10.9]]){o.caixa(PR,-19,-7.15,y0,y1,ZA-.3,ZA+.1);for(let x=-19+1.48;x<-7.2;x+=1.48)o.caixa(JT,x-.015,x+.015,y0,y1,ZA+.1,ZA+.12)}
  o.janela(-19,-7.15,4.65,9.15,{col:10,lin:2,z:ZA-.28,aro:.05,cor:K.plano('#3a464c',.4,.5),vidro:AZ});
  // Bloco salmão de três pavimentos na ponta esquerda, com a capa verde
  o.caixa(SL,-23.3,-19,0,9.3,-12,-1.5);o.caixa(VE,-23.3,-19,9.3,10.5,-12,-1.5,1);for(const y of[1.2,4.3,7.4])o.janela(-22.3,-20.6,y,y+1.1,{col:2,z:-1.5,aro:.06,cor:K.plano('#ece9e0',.6),vidro:K.vidro(0x7fb0c6)});
  // Canteiros brancos com sebe e flores, e o piso em frente
  const CN=K.plano('#e5e2d9',.85),FL=K.plano('#b13d78',.9),GV=K.plano('#356628',1),ac=sorteio(11);
  o.caixa(CN,-5.5,5.5,0,.45,.9,2.1);o.caixa(GV,-5.35,5.35,.45,.6,1.05,1.95);for(const s of[-1,1])o.caixa(CN,s>0?7.3:-9.6,s>0?9.6:-7.3,0,.5,1.4,2.8);
  for(let i=0;i<40;i++){const s=i%2?-1:1,x=s*(7.5+ac()*1.9),z=1.6+ac(),r=.14+ac()*.18,b=new THREE.IcosahedronGeometry(r,0);b.translate(x,.6+ac()*.3,z);o.add(i%3?FL:GV,b)}
  for(let i=0;i<14;i++){const x=-1.5+ac()*3,z=1.2+ac()*.6,b=new THREE.ConeGeometry(.12+ac()*.08,1.6+ac()*1.6,5);b.translate(x,1.3+ac()*.5,z);o.add(GV,b)}
  o.caixa(K.plano('#b0ada3',.9),-24,9,0,.08,3.2,5.4);
  return o.fim();
}
// ---------- 2026: Centro de Memória Adventista do Norte do Brasil (maquete eletrônica do painel, fotos m13) ----------
// Desenhado na malha da V2 e reduzido por k = 0,44: casa de 8,8 m de frente, platibanda a 3,3 m com painéis até 4,1 m,
// pináculos a 4,4 m, porta de 1,76 x 2,4 m; deque, espelho d'água com ponte e o marco dos 100 anos, como no painel.
export function memoria2026(K){
  const o=new Obra(K,.44),BR=K.reb('#f1efe8'),Tm=K.telha,MR=K.plano('#6b4a31',.75),W=20,H=7.2,D=18;
  o.caixa(BR,-W/2,W/2,0,H,-D,0);
  // Platibanda com cinco painéis, pináculos e o símbolo no centro
  const pan=[[-10,-6.6],[-6.4,-2.2],[-1.9,1.9],[2.2,6.4],[6.6,10]];o.caixa(BR,-W/2,W/2,H,H+.25,-.5,.14);
  for(const [a,b] of pan){const c=(a+b)/2,alt=c===0?1.95:1.3;o.chapa(BR,[[a,H+.25],[b,H+.25],[b,H+.25+alt*.74],[c,H+.25+alt],[a,H+.25+alt*.74]],-.4,.05);o.caixa(K.plano('#d4d0c5',.8),a+.14,b-.14,H+.33,H+.25+alt*.6,.05,.1)}
  for(const x of[-10,-6.5,-2.05,2.05,6.5,10]){const c=new THREE.ConeGeometry(.17,1.15,4);c.rotateY(.78);c.translate(x,H+2.25,-.1);o.add(BR,c);o.caixa(BR,x-.24,x+.24,H+.2,H+1.7,-.42,.2)}
  o.placa(-1.2,1.2,H+.7,H+1.9,.13,(q,w,h)=>{logoIASD(q,w/2,h*.56,.55,'#1f3a42')},{px:260});
  o.placa(-9.6,9.6,H-1.08,H-.08,.04,(q,w,h)=>{txt(q,'IGREJA ADVENTISTA DO SÉTIMO DIA',w/2,h*.54,.74,'#1f3a42',{f:'"Courier New",Courier,monospace',peso:700})},{px:140});
  // Cunhais de blocos nos cantos
  for(const s of[-1,1])for(let y=.1;y<H-1.1;y+=.9)o.caixa(BR,s>0?W/2-.92:-W/2+.02,s>0?W/2-.02:-W/2+.92,y,y+.72,0,.14);
  // Janelas e porta de madeira em veneziana
  const VN=K.veneziana('#5d412a','rgba(36,22,12,.55)');const cor=K.plano('#3d2a1b',.7);
  o.janela(-7.3,-3,1.2,5,{col:2,z:0,aro:.14,cor,vidro:VN});o.janela(3,7.3,1.2,5,{col:2,z:0,aro:.14,cor,vidro:VN});o.janela(-2,2,0,5.4,{col:2,z:0,aro:.14,cor,vidro:VN});
  // Telhado de telhas em duas águas, visível por trás da platibanda
  o.quad(Tm,[-W/2-.3,H,-.5],[W/2+.3,H,-.5],[W/2+.3,H+4.1,-D/2],[-W/2-.3,H+4.1,-D/2]);o.quad(Tm,[-W/2-.3,H+4.1,-D/2],[W/2+.3,H+4.1,-D/2],[W/2+.3,H,-D-.3],[-W/2-.3,H,-D-.3]);o.tri(BR,[-W/2,H,-D],[-W/2,H,-.5],[-W/2,H+4,-D/2]);o.tri(BR,[W/2,H,-.5],[W/2,H,-D],[W/2,H+4,-D/2]);
  // Deque de madeira, ponte sobre o espelho d'água azul e pedras
  const DQ=K.tabua('#7a5a3c',12);o.caixa(DQ,-22,22,.2,.42,.6,7);
  const AG=new THREE.MeshStandardMaterial({color:0x1c9a9c,roughness:.08,metalness:.25,envMap:K.env,envMapIntensity:.9});K.comEnv.push(AG);AG.userData.env=.9;
  o.caixa(AG,-23,23,.05,.14,7,19);o.caixa(K.plano('#d6d0bf',.9),-24,24,0,.2,19,20.4);o.caixa(K.plano('#d6d0bf',.9),-24,-23,0,.2,7,19);o.caixa(K.plano('#d6d0bf',.9),23,24,0,.2,7,19);
  o.caixa(DQ,-2,2,.44,.7,7,19.4);for(const s of[-1,1])for(let z=7.4;z<19.4;z+=2)o.caixa(MR,s*2-.07,s*2+.07,.7,1.7,z,z+.14);for(const s of[-1,1])o.caixa(MR,s*2-.05,s*2+.05,1.7,1.8,7,19.4);
  const ac=sorteio(5);
  for(let i=0;i<70;i++){const s=ac()<.5?-1:1,x=s*(2.6+ac()*19),z=ac()<.55?7.2+ac()*1.3:17.6+ac()*1.6,r=.22+ac()*.46,b=new THREE.IcosahedronGeometry(r,1);b.scale(1,.68,1);b.translate(x,.2+r*.28,z);o.add(K.plano('#8c8880',.95),b)}
  // Monumento dos 100 anos, à esquerda da ponte
  o.caixa(K.plano('#8d8a82',.85),-20,-8.4,.42,1.1,3,6.2);
  o.placa(-19.6,-8.8,1.1,4.8,5.2,(q,w,h)=>{q.font=`900 ${h*.92}px ${SANS}`;q.textBaseline='middle';q.textAlign='left';q.fillStyle='#21403d';q.fillText('1',w*.02,h*.52);q.fillStyle='#c79a3b';q.beginPath();q.arc(w*.38,h*.54,h*.4,0,6.283);q.fill();q.beginPath();q.arc(w*.68,h*.54,h*.4,0,6.283);q.fill();q.fillStyle='#21403d';q.beginPath();q.arc(w*.38,h*.54,h*.2,0,6.283);q.fill();q.beginPath();q.arc(w*.68,h*.54,h*.2,0,6.283);q.fill();txt(q,'ANOS',w*.995,h*.42,h*.15,'#21403d',{f:SANS,al:'right'})},{px:110});
  return o.fim();
}
// V6: escala conferida de novo pelas fotos (ESCALA_PREDIOS.md). Dois prédios mudaram: hab1953 ×1,18 e sede2014 ×0,80.
// Registro dos prédios. Em tamanho real (es = 1, salvo os dois acima). larg e prof: frente e fundo ocupados, em metros, para abrir a clareira;
// recuo: distância da margem até o plano da fachada (o que fica à frente da fachada, como muros e calçadas, cabe dentro dele).
export const OBRAS={
  // Rodada 3 (pedido do usuário: 'os prédios parecem pequenos'): cada 'es' foi ao LADO MAIOR da faixa plausível medida nas fotos (ESCALA_PREDIOS.md),
  // e o recuo da fachada até a margem caiu para 6 a 9 m (era 8 a 17), para o prédio não ficar perdido no fundo
  // rodada 4: es no topo da faixa plausível (fotos com pessoas + tipologia/capacidade; a web não deu medida escrita: ver ESCALA_PREDIOS.md, Rodada 4)
  templo1937:{f:templo1937,rot:-.5,es:1.25,prof:27,larg:34,recuo:7},
  templo1940:{f:templo1940,rot:0,es:1.2,prof:27,larg:20,recuo:7},
  hab1953:{f:hab1953,rot:.06,es:1.3,prof:14,larg:40,recuo:6},
  radio1995:{f:radio1995,rot:.12,es:1.15,prof:13,larg:18,recuo:6},
  sede1996:{f:sede1996,rot:-.08,es:1.1,prof:16,larg:44,recuo:6},
  sede2001:{f:sede2001,rot:.1,es:1.2,prof:15,larg:26,recuo:9},
  sede2009:{f:sede2009,rot:-.1,es:1.05,prof:16,larg:38,recuo:8},
  tv2014:{f:tv2014,rot:.1,es:1.1,prof:10,larg:18,recuo:6},
  sede2014:{f:sede2014,rot:.14,es:.85,prof:15,larg:50,recuo:7},
  memoria2026:{f:memoria2026,rot:0,es:1,prof:9,larg:22,recuo:6}};
