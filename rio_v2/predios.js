// Os prédios da história em tamanho real, construídos com código a partir das fotos de cada marco (site/fotos).
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
  const K={env,comEnv,
    reb:(c,r=.82)=>cache['r'+c]||(cache['r'+c]=reg(new THREE.MeshStandardMaterial({color:c,map:reboco,roughness:r}),.42)),
    plano:(c,r=.7,m=0)=>cache['p'+c+r+m]||(cache['p'+c+r+m]=reg(new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m}),.5)),
    vidro:(c=0x8fb0c9)=>cache['v'+c]||(cache['v'+c]=reg(new THREE.MeshStandardMaterial({color:c,roughness:.06,metalness:1}),1.15)),
    escuro:reg(new THREE.MeshStandardMaterial({color:0x0e1114,roughness:.55}),.3),
    telha:reg(new THREE.MeshStandardMaterial({map:textura(tela(512,512,(x,w,h)=>{const L=16,C=20;for(let j=0;j<L;j++)for(let i=0;i<C;i++){const v=Math.random(),r=150+v*50,g=78+v*30,b=52+v*22;x.fillStyle=`rgb(${r},${g},${b})`;x.fillRect(i*w/C,j*h/L,w/C-1,h/L-1);const gr=x.createLinearGradient(i*w/C,0,(i+1)*w/C,0);gr.addColorStop(0,'rgba(0,0,0,.34)');gr.addColorStop(.5,'rgba(255,240,220,.1)');gr.addColorStop(1,'rgba(0,0,0,.34)');x.fillStyle=gr;x.fillRect(i*w/C,j*h/L,w/C-1,h/L-1)}})),roughness:.85,side:THREE.DoubleSide}),.3),
    veneziana:(c='#14171a',l='rgba(150,150,140,.55)')=>cache['z'+c]||(cache['z'+c]=reg(new THREE.MeshStandardMaterial({map:textura(tela(128,128,(x,w,h)=>{x.fillStyle=c;x.fillRect(0,0,w,h);for(let i=0;i<8;i++){x.fillStyle=l;x.fillRect(0,i*16+2,w,5)}})),roughness:.75}),.25)),
    mosaico:(c,g='#d4d4cf')=>cache['m'+c]||(cache['m'+c]=reg(new THREE.MeshStandardMaterial({map:textura(tela(256,256,(x,w,h)=>{x.fillStyle=g;x.fillRect(0,0,w,h);for(let j=0;j<8;j++)for(let i=0;i<8;i++){const q=new THREE.Color(c).multiplyScalar(.82+Math.random()*.36);x.fillStyle='#'+q.getHexString();x.fillRect(i*32+1,j*32+1,30,30)}})),roughness:.42}),.8)),
    tabua:(c,n=10)=>cache['t'+c]||(cache['t'+c]=reg(new THREE.MeshStandardMaterial({map:textura(tela(256,256,(x,w,h)=>{x.fillStyle=c;x.fillRect(0,0,w,h);for(let i=0;i<n;i++){x.fillStyle='rgba(0,0,0,.42)';x.fillRect(0,i*h/n,w,2);for(let k=0;k<14;k++){x.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,230,190'},${Math.random()*.1})`;x.fillRect(Math.random()*w,i*h/n+Math.random()*h/n,40+Math.random()*120,1+Math.random()*2)}}})),roughness:.82}),.25)),
    pedra:reg(new THREE.MeshStandardMaterial({map:textura(tela(512,512,(x,w,h)=>{x.fillStyle='#8d877a';x.fillRect(0,0,w,h);for(let i=0;i<340;i++){const v=110+Math.random()*80;x.fillStyle=`rgb(${v},${v*.96},${v*.88})`;const a=14+Math.random()*44,b=10+Math.random()*26,px=Math.random()*w,py=Math.random()*h;x.beginPath();x.ellipse(px,py,a,b,Math.random()*3,0,6.28);x.fill();x.strokeStyle='rgba(30,28,24,.5)';x.lineWidth=2;x.stroke()}})),roughness:.92}),.25),
    atualiza(h){const k=.18+.82*h;for(const m of comEnv)m.envMapIntensity=m.userData.env*k},
    // ao entardecer as fachadas ganham luz própria, como prédios iluminados à noite
    noite(q){if(Math.abs(q-(this._q||0))<.01)return;this._q=q;for(const m of comEnv){if(m.userData.semLuz)continue;if(!m.userData.em0){m.userData.em0=true;m.emissive=m.color?m.color.clone():new THREE.Color(1,1,1)}m.emissiveIntensity=q*.16}}};
  return K;
}

// ---------- Construção ----------
const UVE=.25;
export class Obra{
  constructor(K){this.K=K;this.lista=new Map();this.soltos=[];this.m=new THREE.Matrix4()}
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

// ---------- 1937: Templo Adventista de linhas art déco (fotos m05) ----------
export function templo1937(K){
  const o=new Obra(K),CL=K.reb('#ded8c9'),CD=K.reb('#9b9182'),PL=K.reb('#a89f90'),W=16,L=38,HW=11.5;
  o.caixa(CD,-W/2,W/2,0,HW,-L,0);o.caixa(K.plano('#3a3835',.9),-W/2+.4,W/2-.4,HW-.2,HW-.1,-L+.4,-.4);
  // Empena da frente: três torres altas e dois coroamentos baixos, com frisos verticais
  o.caixa(CL,-W/2,W/2,0,12.6,-1.4,0);
  for(const [a,b,h] of[[-8,-5.6,15.4],[-2,2,16.2],[5.6,8,15.4]]){o.caixa(CL,a,b,6,h,-1.4,.22);const n=a===-2?4:3;for(let i=0;i<=n;i++){const x=a+(b-a)*(.1+.8*i/n);o.caixa(CL,x-.07,x+.07,6.4,h-.15,.22,.36)}}
  for(const [a,b] of[[-5,-2.6],[2.6,5]]){o.caixa(CL,a,b,12.6,13.3,-1.2,.06);o.caixa(CL,a-.16,b+.16,13.3,13.56,-1.34,.2)}
  // Alpendre com o letreiro
  const PW=6.6,PD=5;o.caixa(CL,-PW,PW,5.4,6.7,0,PD);o.caixa(K.plano('#2b2a27',.9),-PW+.3,PW-.3,5.38,5.4,.2,PD-.3);
  for(let x=-PW+.2;x<PW;x+=.52)o.caixa(CL,x,x+.26,6.7,7.08,PD-.3,PD);
  o.placa(-PW+.3,PW-.3,5.5,6.6,PD+.012,(q,w,h)=>{txt(q,'TEMPLO ADVENTISTA',w/2,h*.54,.72,'#3c372d',{f:SANS,peso:800,esp:.06})});
  for(const x of[-PW+.45,PW-.45]){o.caixa(CL,x-.46,x+.46,0,5.4,PD-.92,PD);o.caixa(CL,x-.72,x+.72,0,1.9,PD-1.14,PD+.2)}
  o.caixa(K.escuro,-PW+.9,PW-.9,0,5.38,.02,.06);for(const x of[-3.6,3.6])o.caixa(CL,x-.9,x+.9,0,3.2,.06,.2);
  o.caixa(K.plano('#b9b4a7',.9),-PW-.2,PW+.2,0,.3,0,PD+.5);
  // Lateral longa em +X: torres, reentrâncias, frisos e janelas de veneziana
  const lateral=(f,completa)=>{const V=K.veneziana();f.caixa(PL,0,L,0,2.4,-.04,.05);
    const pil=(a,b,h)=>{f.caixa(CL,a,b,2.4,h,-.02,.34);f.caixa(CL,a-.1,b+.1,2.4,3.3,-.02,.46);for(const k of[.3,.7])f.caixa(CL,a+(b-a)*k-.05,a+(b-a)*k+.05,3.6,h-.18,.34,.42)};
    const baia=(a,b,cap=11.9)=>{f.caixa(CL,a+.5,b-.5,HW-.1,cap,-.02,.18);f.caixa(CL,a+.34,b-.34,cap,cap+.2,-.04,.28);const c=(a+b)/2;f.caixa(CL,c-.24,c+.24,8.9,HW-.2,.02,.14);const w=Math.min(1.5,(b-a)*.42);f.janela(c-w,c+w,6.6,8.3,{z:.02,aro:.1,cor:CL,vidro:V});f.janela(c-w,c+w,2.9,6,{z:.02,aro:.1,cor:CL,vidro:V})};
    pil(0,2.5,14.2);baia(2.5,7);pil(7,8.6,13.4);
    f.caixa(CL,8.6,15.2,0,12.6,-.02,.2);for(const a of[8.6,14])f.caixa(CL,a,a+1.2,12.6,14,-.02,.2);f.caixa(CL,10.3,13.5,12.6,13.2,-.02,.14);f.janela(10,13.8,6.6,8.4,{z:.2,aro:.1,cor:CL,vidro:V});f.janela(10,13.8,2.9,6,{z:.2,aro:.1,cor:CL,vidro:V});
    let u=15.2,i=0;while(u<L-1.5){pil(u,u+1.2,13-.08*i);const fim=Math.min(u+5,L-1.2);if(fim-u>2)baia(u+1.2,fim);u=fim;i++}pil(L-1.2,L,12.4)};
  lateral(o.face(Math.PI/2,W/2,0,0),true);lateral(o.face(-Math.PI/2,-W/2,0,-L));
  o.caixa(CD,-W/2,W/2,0,HW,-L-.02,-L);
  // Muro baixo perfurado na frente e ao longo da lateral
  mureta(o,-W/2-5,-2,9.2);mureta(o,2,W/2+6,9.2);o.face(Math.PI/2,W/2+6,0,9.2).caixa(CL,0,.01,0,.01,0,.01);mureta(o.face(Math.PI/2,W/2+6,0,9.2),0,L+8,0);
  return o.fim();
}
// ---------- 1940: Templo Adventista de Manaus (foto m06) ----------
export function templo1940(K){
  const o=new Obra(K),F=K.reb('#a7957b'),F2=K.reb('#9a886f'),S=K.reb('#e8e2d4'),L=34,Hw=11.6;
  o.caixa(S,-11.85,11.85,0,Hw-.4,-L,-1.2);
  // Blocos da fachada, do centro para as pontas
  o.caixa(F,-2.3,2.3,0,Hw+.1,-1.2,0);
  for(const s of[-1,1]){const a=s<0?-4.85:2.3,b=s<0?-2.3:4.85,c=s<0?-9.45:4.85,d=s<0?-4.85:9.45,e=s<0?-11.85:9.45,f=s<0?-9.45:11.85;
    o.caixa(F,c,d,0,Hw,-1.2,0);
    o.caixa(F2,a,b,0,13,-1.2,.34);o.caixa(F2,a+.4,b-.4,13,13.8,-1.2,.1);for(const k of[.26,.5,.74])o.caixa(F,a+(b-a)*k-.05,a+(b-a)*k+.05,4,12.9,.34,.42);
    o.caixa(F2,e,f,0,12.2,-1.2,.34);o.caixa(F2,e+.42,f-.42,12.2,12.9,-1.2,.1);o.caixa(F,e+.8,f-.8,12.9,13.3,-1.2,-.1);for(const k of[.34,.66])o.caixa(F,e+(f-e)*k-.05,e+(f-e)*k+.05,1,12.1,.34,.42);
    // duas colunas de janelas altas e baixas em cada asa
    for(const cx of s<0?[-8,-6.4]:[6.4,8]){o.janela(cx-.52,cx+.52,4.05,8.3,{col:2,lin:7,z:0,cor:K.plano('#f1f0ea',.5),aro:.09});o.janela(cx-.52,cx+.52,.75,2.7,{col:2,lin:3,z:0,aro:.09})}}
  for(const cx of[-1.27,0,1.27])o.janela(cx-.38,cx+.38,4.2,8.3,{lin:7,z:0,aro:.09});
  o.placa(-2.2,2.2,8.75,11.2,.012,(q,w,h)=>{txt(q,'TEMPLO',w/2,h*.28,.5,'#2b2620',{f:FONTE,esp:.05});txt(q,'ADVENTISTA',w/2,h*.72,.42,'#2b2620',{f:FONTE,esp:.03})},{px:90});
  // Marquise e entrada
  o.caixa(K.plano('#d8d2c2',.8),-3.3,3.3,3.55,3.86,0,1.9);o.caixa(K.escuro,-2.1,2.1,0,3.55,.01,.04);for(const x of[-1.05,1.05])o.janela(x-.86,x+.86,.25,3.2,{col:2,lin:3,z:.03,aro:.07,cor:K.plano('#4b3a2a',.7),vidro:K.plano('#2a2017',.7)});
  // Telhado de quatro águas atrás da platibanda
  const Tc=K.telha,yE=Hw-.4,yR=14.6;o.tri(Tc,[-9.5,yE,-1.3],[9.5,yE,-1.3],[0,yR,-8.6]);o.quad(Tc,[9.5,yE,-1.3],[9.5,yE,-L+1],[0,yR,-L+9],[0,yR,-8.6]);o.quad(Tc,[-9.5,yE,-L+1],[-9.5,yE,-1.3],[0,yR,-8.6],[0,yR,-L+9]);o.tri(Tc,[9.5,yE,-L+1],[-9.5,yE,-L+1],[0,yR,-L+9]);
  // Lateral branca com pilastras e janelas altas
  for(const [fa,sn] of[[o.face(Math.PI/2,11.85,0,-1.2),1],[o.face(-Math.PI/2,-11.85,0,-L),-1]]){const C=L-1.2;for(let u=1.6;u<C;u+=3.6){fa.caixa(S,u-.28,u+.28,0,Hw+.5,0,.3);if(u+1.8<C){fa.janela(u+1,u+2.6,5.6,9.6,{col:2,lin:5,z:.02,aro:.07,cor:K.plano('#dcd6c7',.6)});fa.janela(u+1,u+2.6,1,3.8,{col:2,lin:3,z:.02,aro:.07,cor:K.plano('#dcd6c7',.6)})}}fa.caixa(S,0,C,Hw-.4,Hw+.1,0,.12)}
  // Muro da frente, com pilares e portões
  const M=K.reb('#b3a993');mureta(o,-16,-2.6,8,{h:1.7,cor:M,furos:false,passo:4.4,esp:.42});mureta(o,2.6,16,8,{h:1.7,cor:M,furos:false,passo:4.4,esp:.42});
  o.caixa(M,-2.6,2.6,0,.28,5,8.3);o.caixa(M,-2.3,2.3,.28,.56,5.4,7.6);
  return o.fim();
}
// Torre treliçada vermelha e branca (m07_3)
export function torre(K,H=56){
  const o=new Obra(K),V=K.plano('#b3261e',.6),B=K.plano('#e9e7e0',.6),G=(y)=>1.9+(H-y)/H*4.2;
  const pt=(a,b,c,d,mat,r=.09)=>{const A=new THREE.Vector3(a,b,0),C=new THREE.Vector3(c,d,0);o.add(mat,cilEntre([a,b,0],[c,d,0],r))};
  const lados=[[-1,-1],[1,-1],[1,1],[-1,1]];let y=0,i=0;const P=5.2;
  while(y<H-.01){const y1=Math.min(H,y+P),g0=G(y)/2,g1=G(y1)/2,m=i%2?B:V;
    for(let k=0;k<4;k++){const [a,b]=lados[k],[c,d]=lados[(k+1)%4];o.add(m,cilEntre([a*g0,y,b*g0],[a*g1,y1,b*g1],.13,6));o.add(m,cilEntre([a*g1,y1,b*g1],[c*g1,y1,d*g1],.07,5));o.add(m,cilEntre([a*g0,y,b*g0],[c*g1,y1,d*g1],.055,5));o.add(m,cilEntre([c*g0,y,d*g0],[a*g1,y1,b*g1],.055,5))}y=y1;i++}
  o.add(V,cilEntre([0,H,0],[0,H+6,0],.1,6));const s=new THREE.SphereGeometry(.22,10,8);s.translate(0,H+6.2,0);o.add(K.plano('#ff4530',.4),s);
  o.caixa(K.reb('#c9c5ba'),-3.4,-.6,0,2.7,4.6,8);o.caixa(K.plano('#6b6a66',.8),-3.6,-.4,2.7,2.92,4.4,8.2);
  return o.fim(false);
}
function cilEntre(a,b,r,seg=7){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),g=new THREE.CylinderGeometry(r,r,d.length(),seg,1,false);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));g.translate(...A.clone().add(B).multiplyScalar(.5).toArray());return g}
// ---------- 1995: Rádio Novo Tempo 1080 AM (fotos m07) ----------
export function radio1995(K){
  const o=new Obra(K),BR=K.reb('#efece4'),W=22,H=10.5,D=13;
  o.caixa(BR,-W/2,W/2,0,H,-D,0);o.caixa(K.plano('#8f8e8a',.8),-W/2-.08,W/2+.08,H,H+.34,-D-.08,.1);
  o.caixa(K.plano('#a4a29a',.9),-W/2-.4,W/2+.4,0,.55,0,2);o.caixa(K.plano('#8d8b84',.9),-W/2-.4,W/2+.4,0,.28,2,3);
  // Letreiro pintado da parede, nas cores da foto
  o.placa(-W/2+.3,W/2-.3,5.7,H-.2,.02,(q,w,h)=>{const TE='#2c7f85',AZ='#2d62a3',VM='#c04a48';
    txt(q,'RÁDIO',w*.2,h*.2,1.38,TE,{f:SANS,peso:900});txt(q,'1080 AM.',w*.2,h*.56,.94,AZ,{f:SANS,peso:900});txt(q,'ESTÚDIO & ESCRITÓRIO',w*.2,h*.84,.42,VM,{f:'Arial,sans-serif',peso:700});
    txt(q,'NOVO',w*.83,h*.3,1.3,TE,{f:SANS,peso:900});txt(q,'TEMPO',w*.83,h*.68,1.4,TE,{f:SANS,peso:900});
    // emblema NT: dois paralelogramos em degradê, azul em cima e rosa embaixo, como na foto
    q.save();q.translate(w*.5,h*.5);const G=q.createLinearGradient(0,-1.9,0,1.9);G.addColorStop(0,'#c9d6df');G.addColorStop(.35,'#7f9fbe');G.addColorStop(.62,'#f1c6a5');G.addColorStop(.8,'#e88a78');G.addColorStop(1,'#d9625c');q.fillStyle=G;
    q.beginPath();q.moveTo(-.5,-1.9);q.lineTo(2.3,-1.9);q.lineTo(1.6,-.95);q.lineTo(.75,-.95);q.lineTo(-.25,.75);q.lineTo(-1.5,.75);q.closePath();q.fill();
    q.beginPath();q.moveTo(-2.3,-.75);q.lineTo(-1,-.75);q.lineTo(.25,.9);q.lineTo(1.05,-.1);q.lineTo(1.6,-.1);q.lineTo(1.1,1.0);q.arc(0,.95,1.1,0,3.14);q.closePath();q.fill();q.restore()},{px:64});
  // Parede de vidro com caixilho branco à esquerda
  const X0=-W/2+.3,X1=1.6,cor=K.plano('#f3f2ec',.5),vd=K.vidro(0xa8c0cf);o.janela(X0,X1,4.3,5.2,{col:4,z:0,aro:.1,cor,vidro:K.plano('#2f5589',.4)});o.janela(X0,X1,.8,4.2,{col:4,lin:3,z:0,aro:.1,cor,vidro:vd});
  // Toldo listrado com babado e vidro escuro atrás
  o.janela(X1+.3,W/2-.3,.8,4.4,{col:3,lin:2,z:0,aro:.09,cor,vidro:K.vidro(0x54666f)});
  const faixas=K.K;const tx=new THREE.MeshStandardMaterial({map:textura(tela(256,64,(q,w,h)=>{for(let i=0;i<16;i++){q.fillStyle=i%2?'#efe6dc':'#b45a55';q.fillRect(i*16,0,16,h)}})),roughness:.8,side:THREE.DoubleSide});const AX0=X1+.1,AX1=W/2+.1,yA=5.35,yB=3.95,zB=1.9;
  o.quad(tx,[AX0,yB,zB],[AX1,yB,zB],[AX1,yA,.05],[AX0,yA,.05],.42);o.quad(tx,[AX0,yB,zB],[AX0,yA,.05],[AX0,yB,.05],[AX0,yB,zB],.42);
  {const n=Math.round((AX1-AX0)/.56),g=[];for(let i=0;i<n;i++){const a=AX0+(AX1-AX0)*i/n,b=a+(AX1-AX0)/n;o.quad(tx,[a,yB-.3,zB],[b,yB-.3,zB],[b,yB,zB],[a,yB,zB],.42)}}
  // Duas antenas parabólicas e o mastro no telhado (m07_1)
  for(const [x,z,inc] of[[-6.5,-5,.7],[-1.5,-6,.55]]){const pr=[];for(let i=0;i<=10;i++){const r=i/10*1.9;pr.push(new THREE.Vector2(r,r*r*.2))}const d=new THREE.LatheGeometry(pr,28);d.rotateX(Math.PI/2+inc);d.translate(x,H+2.6,z);o.add(K.plano('#3b4149',.5,.3),d);o.add(K.plano('#3b4149',.5,.3),cilEntre([x,H+.34,z],[x,H+2.5,z],.07))}
  o.add(K.plano('#9a9a98',.5,.5),cilEntre([3,H+.3,-5],[3,H+7,-5],.06));
  return o.fim();
}
// ---------- 1996: Sede da Associação em Marituba (foto m08) ----------
export function sede1996(K){
  const o=new Obra(K),BR=K.reb('#ece9e0'),ARCO=K.reb('#ad6a5a'),IN=K.reb('#9ca69a'),D=20,TOP=[4.4,14.2];
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
  // Alas baixas à direita e à esquerda, com janelas em arco de peitoril vermelho
  for(const [x0,x1,s] of[[10.2,38,1],[-30,-10.3,-1]]){o.caixa(BR,x0,x1,0,5.4,-11,-3);const yR=8.2;o.quad(Tm,[x0,5.3,-1.9],[x1+.8,5.3,-1.9],[x1+.8,yR,-7.2],[x0,yR,-7.2]);o.quad(Tm,[x1+.8,5.3,-12.4],[x0,5.3,-12.4],[x0,yR,-7.2],[x1+.8,yR,-7.2]);o.caixa(K.plano('#3e3026',.8),x0,x1+.8,5.14,5.34,-3,-1.9);
    if(s>0)o.tri(Tm,[x1+.8,5.3,-1.9],[x1+.8,5.3,-12.4],[x1+.8,yR,-7.2]);else o.tri(Tm,[x0,5.3,-12.4],[x0,5.3,-1.9],[x0,yR,-7.2]);
    for(let x=x0+(s>0?2.4:1.8);x<x1-1.5;x+=4.5){const f=o.face(0,0,0,-3);f.arcoFaixa(ARCO,x-1.15,x+1.15,0,4.5,.18,0,.1);f.janelaArco(x-.92,x+.92,1.6,4.25,{z:.01,col:3,lin:3,vidro:K.vidro(0x33454f)});f.caixa(K.plano('#7c4a3b',.85),x-.92,x+.92,0,1.6,.01,.05)}}
  return o.fim();
}
// ---------- 2001: Sede da Missão Sul do Pará, Marabá (foto do jornal m09) ----------
export function sede2001(K){
  const o=new Obra(K),BR=K.reb('#edeae2'),Tm=K.telha,vd=K.vidro(0x31404c),cor=K.plano('#ece9e0',.6);
  const jan=(f,x,w,y0,y1,c=3,l=2)=>f.janela(x-w/2,x+w/2,y0,y1,{col:c,lin:l,z:0,aro:.1,cor:K.plano('#3a3229',.7),vidro:vd});
  // Ala esquerda baixa, volume central alto, torre de pedra e ala direita
  o.caixa(BR,-21,-9,0,6.4,-13,0);o.caixa(BR,-9,6,0,8,-15,.8);o.caixa(BR,8.8,21,0,6.8,-13,0);o.caixa(BR,6,8.8,0,7,-13,0);
  // telhados
  o.quad(Tm,[-22,6.3,1],[-8,6.3,1],[-13,10.4,-6],[-17,10.4,-6]);o.quad(Tm,[-22,6.3,-14],[-22,6.3,1],[-17,10.4,-6],[-17,10.4,-6.01]);o.quad(Tm,[-8,6.3,1],[-8,6.3,-14],[-13,10.4,-6],[-13,10.4,-5.99]);o.quad(Tm,[-8,6.3,-14],[-22,6.3,-14],[-17,10.4,-6],[-13,10.4,-6]);
  o.quad(Tm,[-10,7.9,1.9],[7.2,7.9,1.9],[3.6,12.6,-6],[-5.4,12.6,-6]);o.quad(Tm,[-5.4,12.6,-6],[3.6,12.6,-6],[7.2,7.9,-16],[-10,7.9,-16]);o.tri(Tm,[-10,7.9,-16],[-10,7.9,1.9],[-5.4,12.6,-6]);o.tri(Tm,[7.2,7.9,1.9],[7.2,7.9,-16],[3.6,12.6,-6]);
  o.quad(Tm,[8.2,6.7,1],[22,6.7,1],[18,10.6,-6],[12,10.6,-6]);o.quad(Tm,[12,10.6,-6],[18,10.6,-6],[22,6.7,-14],[8.2,6.7,-14]);o.tri(Tm,[8.2,6.7,-14],[8.2,6.7,1],[12,10.6,-6]);o.tri(Tm,[22,6.7,1],[22,6.7,-14],[18,10.6,-6]);
  o.caixa(K.pedra,6,8.8,0,14,-3,.9);
  // janelas dos dois pavimentos, nas posições da foto
  for(const x of[-17,-12.6])jan(o,x,2.5,1,3,3,2);jan(o,-15,1.9,4.3,6,2,2);
  for(const x of[-6.6,3.2]){jan(o.face(0,0,0,.8),x,2.9,1,3.2,3,2);jan(o.face(0,0,0,.8),x,2.6,4.6,6.9,3,2)}
  jan(o.face(0,0,0,.8),-1.6,1.5,4.6,6.9,1,2);
  o.janela(-3,-.3,0,3.5,{col:2,lin:3,z:.8,aro:.11,cor:K.plano('#3a3229',.7),vidro:vd});
  for(const x of[11.6,15.4,18.8]){jan(o,x,1.7,1,3,2,2);jan(o,x,1.7,4.2,5.9,2,2)}
  o.caixa(K.plano('#b5b0a5',.9),-23,23,0,.2,0,8);
  return o.fim();
}
// ---------- 2009: Missão Oeste do Pará, Santarém (fotos m10) ----------
export function sede2009(K){
  const o=new Obra(K),BG=K.reb('#c9b8a4'),CR=K.reb('#e6dfcf'),AZ=K.plano('#2b3f94',.55),PR=K.plano('#e5e4df',.45,.1),VN=K.reb('#6e2433',.65),D=16,pretoM=K.plano('#111316',.6,.2);
  // Bloco de três pavimentos à esquerda, com frisos horizontais e janelas verticais
  o.caixa(BG,-20,-6.1,0,10.8,-D,0);o.caixa(K.plano('#d4d2cc',.7),-20.1,-6,10.8,12.2,-D,.14);
  for(let y=.9;y<10.6;y+=.78)o.caixa(K.plano('#ab9b89',.9),-20,-6.1,y,y+.05,0,.03);
  for(const x of[-14.2,-11.6,-9]){o.caixa(K.plano('#efeadd',.7),x-.52,x+.52,.6,10.6,0,.12);o.janela(x-.26,x+.26,1,4.9,{lin:2,z:.12,aro:.04,cor:K.plano('#efeadd',.7),vidro:vd(K)});o.janela(x-.26,x+.26,5.7,10.1,{lin:2,z:.12,aro:.04,cor:K.plano('#efeadd',.7),vidro:vd(K)})}
  // Pórtico azul com o letreiro
  o.caixa(AZ,-6.2,16.2,8.5,14.2,-.4,.5);o.caixa(AZ,-6.2,-3.6,0,8.5,-.4,.5);o.caixa(AZ,13.6,16.2,4.6,8.5,-.4,.5);
  o.placa(-6,16,8.65,14.05,.515,(q,w,h)=>{logoIASD(q,w*.1,h*.5,1.7);txt(q,'SEDE ADMINISTRATIVA DA',w*.53,h*.2,.46,'#fff',{esp:.02});txt(q,'IGREJA ADVENTISTA DO SÉTIMO DIA',w*.53,h*.47,.76,'#fff');txt(q,'MISSÃO OESTE DO PARÁ',w*.53,h*.75,.72,'#fff');logoNT(q,w*.94,h*.42,1.5);txt(q,'NOVO TEMPO',w*.94,h*.76,.26,'#fff',{f:'Arial,sans-serif'})},{px:70});
  // Andar superior creme e janelas pretas
  o.caixa(CR,-3.6,13.6,5.2,8.5,-3,-.3);for(let y=5.7;y<8.4;y+=.6)o.caixa(K.plano('#cfc8b8',.9),-3.6,13.6,y,y+.03,-.3,-.27);
  for(const [x,w] of[[-1,3],[4.4,2.8],[8.8,2.5]])o.janela(x-w/2,x+w/2,5.9,7.7,{col:2,z:-.3,aro:.07,cor:K.plano('#1c1e22',.7),vidro:vd(K)});
  {const c=new THREE.CylinderGeometry(.34,.34,.06,20);c.rotateX(Math.PI/2);c.translate(11.6,6.85,-.27);o.add(K.plano('#d6d3cb',.6),c)}
  // Marquise de chapas que atravessa a fachada
  o.caixa(PR,-3.6,29,3.9,5.2,-.6,3.6);for(let x=-3.6;x<29;x+=1.15)o.caixa(K.plano('#b5b4af',.6),x,x+.04,3.9,5.2,3.6,3.62);o.caixa(K.plano('#c7c5bf',.8),-3.6,29,3.88,3.9,-.6,3.6);
  // Térreo: portas recuadas e parede vinho à direita
  o.caixa(CR,-3.6,12.4,0,3.9,-5,-3);o.janela(1.1,3.5,0,2.8,{col:2,z:-3,aro:.09,cor:K.plano('#1b1d20',.7),vidro:K.escuro});o.janela(5.2,7.6,0,2.8,{col:2,z:-3,aro:.09,cor:K.plano('#1b1d20',.7),vidro:K.escuro});
  o.caixa(K.plano('#f0efe9',.6),9.6,9.86,0,3.9,2.8,3.06);
  o.caixa(VN,12.4,29,0,3.9,-3,-.2);for(let x=12.4;x<29;x+=1.15)o.caixa(K.plano('#541b27',.8),x,x+.04,0,3.9,-.2,-.18);
  // Ala direita baixa
  o.caixa(CR,16.2,29,5.2,8.2,-5,-.4);o.caixa(K.plano('#d4d2cc',.7),16.2,29.1,8.2,9.1,-5,-.28);for(const x of[18.6,22.4])o.janela(x-1,x+1,6,7.6,{z:-.4,aro:.06,cor:K.plano('#1c1e22',.7),vidro:vd(K)});o.caixa(CR,-3.6,29,0,8.2,-D,-5);
  // Gradil preto, escadaria e calçada
  const G=(x0,x1,z)=>{o.caixa(pretoM,x0,x1,0,.16,z-.04,z+.04);o.caixa(pretoM,x0,x1,1.72,1.78,z-.03,z+.03);for(let x=x0;x<=x1;x+=.2)o.caixa(pretoM,x,x+.035,.1,1.78,z-.015,z+.015);for(let x=x0;x<=x1+.01;x+=3)o.caixa(pretoM,x-.05,x+.05,0,1.86,z-.05,z+.05)};
  G(-21,-1,7.4);G(5,16,7.4);G(19,30,7.4);o.caixa(K.plano('#a8a59c',.9),-22,31,0,.28,7.4,10.6);for(let i=0;i<3;i++)o.caixa(K.plano('#d8d6cf',.8),-.8,4.8,0,.18+i*.16,3.8+i*.9,4.8+i*.9);
  return o.fim();
}
const vd=K=>K.vidro(0x202c36);
// ---------- 2014: TV Novo Tempo, canal 54 (fotos m11, com a torre da emissora) ----------
export function tv2014(K){
  const o=new Obra(K),BR=K.reb('#ecebe6');o.caixa(BR,-13,13,0,8,-14,0);o.caixa(K.plano('#1d4ea8',.55),-13.1,13.1,8,9.4,-14.1,.12);
  o.placa(-12.8,12.8,8.05,9.35,.13,(q,w,h)=>{txt(q,'TV NOVO TEMPO',w*.3,h*.52,.86,'#fff',{f:SANS});txt(q,'CANAL 54',w*.76,h*.52,.86,'#f2c81d',{f:SANS})},{px:50});
  o.janela(-11,-1.5,1,6.6,{col:6,lin:3,z:0,aro:.08,cor:K.plano('#cfd1d4',.4,.4),vidro:K.vidro(0x6d8fa8)});o.caixa(K.plano('#1d4ea8',.55),1.4,11.6,1,6.6,0,.1);
  o.placa(1.8,11.2,1.2,6.4,.115,(q,w,h)=>{logoNT(q,w*.22,h*.42,2.6);txt(q,'54',w*.68,h*.45,3,'#f2c81d',{f:SANS});txt(q,'UM NOVO TEMPO PARA VOCÊ',w*.5,h*.9,.42,'#fff',{f:'Arial,sans-serif'})},{px:60});
  o.caixa(K.plano('#b5b2a9',.9),-14,14,0,.2,0,5);
  return o.fim();
}
// ---------- 2014: Sede administrativa da Associação Norte do Pará (foto m12) ----------
export function sede2014(K){
  const o=new Obra(K),VE=K.mosaico('#2f5048'),SA=K.mosaico('#d8a68e','#d9c5b8'),VM=K.mosaico('#b5473a','#c76a5e'),PR=K.plano('#c9cacb',.32,.55),BR=K.reb('#f0eee7'),AZ=K.vidro(0x7fb4d8),AM=K.plano('#cf9a3b',.3,.5);
  // Pórtico alto com dois pilares de pastilha verde e viga prateada de painéis
  for(const s of[-1,1]){const a=s<0?-11:8.6,b=s<0?-8.6:11;o.caixa(VE,a,b,0,19,-1.4,1,.5)}
  o.caixa(PR,-10.6,10.6,18.8,21.2,-1.6,1.1);for(let x=-10.6;x<10.6;x+=2.36)o.caixa(K.plano('#8f9193',.4,.5),x,x+.03,18.8,21.2,1.1,1.12);
  for(const s of[-1,1]){const a=s<0?-8.6:5,b=s<0?-5:8.6;o.caixa(SA,a,b,10.7,18.8,-3.4,.2,.5);o.caixa(BR,a,b,10.5,10.7,-3.4,.2);const c=s<0?-5:4.4,d=s<0?-4.4:5;o.caixa(VE,c,d,0,18.8,-1.2,.34,.5)}
  o.caixa(VE,-5,5,17.5,18.8,-1.2,.34,.5);
  // Vidros azuis, trechos âmbar embaixo e o painel vermelho central com o letreiro
  for(const s of[-1,1]){const a=s<0?-4.4:2.5,b=s<0?-2.5:4.4;o.janela(a,b,5,17.4,{lin:9,z:-.7,aro:.05,cor:K.plano('#2a3a3e',.4,.5),vidro:AZ});o.janela(a,b,.4,4.9,{lin:2,z:-.7,aro:.05,cor:K.plano('#2a3a3e',.4,.5),vidro:AM})}
  o.caixa(VM,-2.5,2.5,.2,17.5,-1,-.1,.5);
  o.placa(-2.45,2.45,5.4,17,-.085,(q,w,h)=>{logoIASD(q,w/2,h*.13,1.1);txt(q,'IGREJA',w/2,h*.255,.34,'#fff');txt(q,'ADVENTISTA',w/2,h*.33,.6,'#fff');txt(q,'DO SÉTIMO DIA',w/2,h*.405,.42,'#fff');txt(q,'SEDE ADMINISTRATIVA',w/2,h*.47,.29,'#fff',{f:'Arial,sans-serif',peso:800,esp:.03});logoNT(q,w/2,h*.595,1);txt(q,'Novo Tempo',w/2,h*.71,.34,'#1d4ea8',{f:'Arial,sans-serif',peso:800})},{px:80});
  o.caixa(BR,-5,5,0,.2,-1.4,.6);o.caixa(K.plano('#efebe0',.7),-8.6,8.6,0,4.2,-6.5,-4);
  // Ala de três pavimentos à esquerda, com fita de vidro azul e painéis prateados
  o.caixa(VE,-30,-11,0,3.4,-14,-3,.5);o.janela(-17,-14.4,.1,3.1,{col:2,z:-3,aro:.07,cor:K.plano('#2b2f31',.4,.4),vidro:K.escuro});o.caixa(BR,-14,-11,0,3.4,-3.2,-2.4);
  o.caixa(PR,-31,-11,3.4,4.9,-14,-2.4);for(let x=-31;x<-11;x+=2.3)o.caixa(K.plano('#8f9193',.4,.5),x,x+.03,3.4,4.9,-2.4,-2.38);
  o.janela(-31,-11,5,9.1,{col:9,lin:2,z:-2.7,aro:.05,cor:K.plano('#3a464c',.4,.5),vidro:AZ});o.caixa(BR,-31,-11,4.9,9.2,-14,-2.72);
  o.caixa(PR,-31,-11,9.2,11.2,-14,-2.5);for(let x=-31;x<-11;x+=2.3)o.caixa(K.plano('#8f9193',.4,.5),x,x+.03,9.2,11.2,-2.5,-2.48);
  // Torre salmão na ponta esquerda
  const SL=K.reb('#d9a688');o.caixa(SL,-38.4,-31,0,10.9,-13,-1.8);o.caixa(VE,-38.4,-34,10.9,12.3,-13,-1.8,.5);for(const y of[1.4,4.7,8])o.janela(-37,-33.8,y,y+1.7,{col:2,z:-1.8,aro:.07,cor:K.plano('#ece9e0',.6),vidro:K.vidro(0x7fb0c6)});
  // Canteiros baixos com flores, como na frente do pórtico
  const CN=K.plano('#e5e2d9',.85);o.caixa(CN,-8.6,8.6,0,.62,1.4,3.4);o.caixa(K.plano('#3d6d2c',1),-8.4,8.4,.62,.72,1.6,3.2);o.caixa(CN,-14,-8.6,0,.7,3.4,5.2);o.caixa(CN,8.6,14,0,.7,3.4,5.2);
  {const F=K.plano('#b13d78',.9),G=K.plano('#356628',1);for(let i=0;i<46;i++){const s=i%2?-1:1,x=s*(8.8+Math.random()*5),z=3.6+Math.random()*1.4,r=.16+Math.random()*.2,b=new THREE.IcosahedronGeometry(r,0);b.translate(x,.82+Math.random()*.34,z);o.add(i%3?F:G,b)}for(let i=0;i<60;i++){const x=-8+Math.random()*16,z=1.8+Math.random()*1.2,r=.14+Math.random()*.2,b=new THREE.IcosahedronGeometry(r,0);b.scale(1,1.5,1);b.translate(x,.78+Math.random()*.26,z);o.add(G,b)}}
  o.caixa(K.plano('#b0ada3',.9),-40,16,0,.12,5.4,8);
  return o.fim();
}
// ---------- 2026: Centro de Memória Adventista do Norte do Brasil (projeto em m13) ----------
export function memoria2026(K){
  const o=new Obra(K),BR=K.reb('#f1efe8'),Tm=K.telha,MR=K.plano('#6b4a31',.75),W=20,H=7.2,D=18;
  o.caixa(BR,-W/2,W/2,0,H,-D,0);
  // Platibanda com cinco painéis, pináculos e o símbolo no centro
  const pan=[[-10,-6.6],[-6.4,-2.2],[-1.9,1.9],[2.2,6.4],[6.6,10]];o.caixa(BR,-W/2,W/2,H,H+.25,-.5,.14);
  for(const [a,b] of pan){const c=(a+b)/2,alt=c===0?1.95:1.3;o.chapa(BR,[[a,H+.25],[b,H+.25],[b,H+.25+alt*.74],[c,H+.25+alt],[a,H+.25+alt*.74]],-.4,.05);o.caixa(K.plano('#d4d0c5',.8),a+.14,b-.14,H+.33,H+.25+alt*.6,.05,.08)}
  for(const x of[-10,-6.5,-2.05,2.05,6.5,10]){const c=new THREE.ConeGeometry(.17,1.15,4);c.rotateY(.78);c.translate(x,H+2.25,-.1);o.add(BR,c);o.caixa(BR,x-.24,x+.24,H+.2,H+1.7,-.42,.2)}
  o.placa(-1.2,1.2,H+.7,H+1.9,.09,(q,w,h)=>{logoIASD(q,w/2,h*.56,.55,'#1f3a42')},{px:120});
  o.placa(-9.6,9.6,H-1.08,H-.08,.02,(q,w,h)=>{txt(q,'IGREJA ADVENTISTA DO SÉTIMO DIA',w/2,h*.54,.68,'#1f3a42',{f:SANS,esp:.04})},{px:64});
  // Cunhais de blocos nos cantos
  for(const s of[-1,1])for(let y=.1;y<H-1.1;y+=.9)o.caixa(BR,s*W/2-(s>0?.92:-.02)-(s>0?0:.0),s*W/2-(s>0?.02:-.92),y,y+.72,0,.14);
  // Janelas e porta de madeira em veneziana
  const VN=K.veneziana('#5d412a','rgba(36,22,12,.55)');const cor=K.plano('#3d2a1b',.7);
  o.janela(-7.3,-3,1.2,5,{col:2,z:0,aro:.14,cor,vidro:VN});o.janela(3,7.3,1.2,5,{col:2,z:0,aro:.14,cor,vidro:VN});o.janela(-2,2,0,5.4,{col:2,z:0,aro:.14,cor,vidro:VN});
  // Telhado de telhas em duas águas, visível por trás da platibanda
  o.quad(Tm,[-W/2-.3,H,-.5],[W/2+.3,H,-.5],[W/2+.3,H+4.1,-D/2],[-W/2-.3,H+4.1,-D/2]);o.quad(Tm,[-W/2-.3,H+4.1,-D/2],[W/2+.3,H+4.1,-D/2],[W/2+.3,H,-D-.3],[-W/2-.3,H,-D-.3]);o.tri(BR,[-W/2,H,-D],[-W/2,H,-.5],[-W/2,H+4,-D/2]);o.tri(BR,[W/2,H,-.5],[W/2,H,-D],[W/2,H+4,-D/2]);
  // Deque de madeira, ponte sobre o espelho d'água azul e pedras
  const DQ=K.tabua('#7a5a3c',12);o.caixa(DQ,-22,22,.2,.42,.6,7);
  const AG=new THREE.MeshStandardMaterial({color:0x1c9a9c,roughness:.08,metalness:.25,envMap:K.env,envMapIntensity:.9});K.comEnv.push(AG);AG.userData.env=.9;
  o.caixa(AG,-23,23,.05,.14,7,19);o.caixa(K.plano('#d6d0bf',.9),-24,24,0,.2,19,20.4);o.caixa(K.plano('#d6d0bf',.9),-24,-23,0,.2,7,20.4);o.caixa(K.plano('#d6d0bf',.9),23,24,0,.2,7,20.4);
  o.caixa(DQ,-2,2,.42,.7,7,19.4);for(const s of[-1,1])for(let z=7.4;z<19.4;z+=2)o.caixa(MR,s*2-.07,s*2+.07,.7,1.7,z,z+.14);for(const s of[-1,1])o.caixa(MR,s*2-.05,s*2+.05,1.6,1.7,7,19.4);
  let sd=5;const ac=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  for(let i=0;i<70;i++){const s=ac()<.5?-1:1,x=s*(2.6+ac()*19),z=ac()<.55?7.2+ac()*1.3:17.6+ac()*1.6,r=.22+ac()*.46,b=new THREE.IcosahedronGeometry(r,1);b.scale(1,.68,1);b.translate(x,.2+r*.28,z);o.add(K.plano('#8c8880',.95),b)}
  // Monumento dos 100 anos, à esquerda da ponte
  o.caixa(K.plano('#8d8a82',.85),-20,-8.4,.42,1.1,3,6.2);
  o.placa(-19.6,-8.8,1.1,4.8,5.2,(q,w,h)=>{q.font=`900 ${h*.92}px ${SANS}`;q.textBaseline='middle';q.textAlign='left';q.fillStyle='#21403d';q.fillText('1',w*.02,h*.52);q.fillStyle='#c79a3b';q.beginPath();q.arc(w*.38,h*.54,h*.4,0,6.283);q.fill();q.beginPath();q.arc(w*.68,h*.54,h*.4,0,6.283);q.fill();q.fillStyle='#21403d';q.beginPath();q.arc(w*.38,h*.54,h*.2,0,6.283);q.fill();q.beginPath();q.arc(w*.68,h*.54,h*.2,0,6.283);q.fill();txt(q,'ANOS',w*.92,h*.42,h*.2,'#21403d',{f:SANS})},{px:50});
  return o.fim();
}
// Registro dos prédios: nome, recuo a partir da água, largura de clareira e posição do marco
export const OBRAS={templo1937:{f:templo1937,rot:-.5,es:1.15,prof:46,larg:50,recuo:18},templo1940:{f:templo1940,rot:0,es:1.28,prof:46,larg:46,recuo:18},radio1995:{f:radio1995,rot:.12,es:1.1,prof:32,larg:40,recuo:12},sede1996:{f:sede1996,rot:-.08,es:1.2,prof:32,larg:80,recuo:14},sede2001:{f:sede2001,rot:.1,es:1.15,prof:26,larg:50,recuo:13},sede2009:{f:sede2009,rot:-.1,es:1.12,prof:30,larg:62,recuo:18},tv2014:{f:tv2014,rot:.1,es:1.1,prof:26,larg:48,recuo:12},sede2014:{f:sede2014,rot:.14,es:1,prof:30,larg:76,recuo:24,ds:12},memoria2026:{f:memoria2026,rot:0,es:1.4,prof:34,larg:62,recuo:32}};
