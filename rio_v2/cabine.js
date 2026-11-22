// O interior da Luzeiro: paredes com os vãos do barco real, leme de madeira com curso limitado, alavanca do motor,
// mesa com o mapa e a lanterna acesa. Sem braços nem personagem: a pessoa vê apenas a cabine.
// O casco do Tripo não é tocado: por dentro ele é apenas escondido no shader, dentro da caixa da cabine.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {criaLanterna} from './lanterna.js';

const M_=15/789,X0_=449,YW_=738;export const ZP=px=>(X0_-px)*M_,YP=py=>(YW_-py)*M_;
const Y_PISO=1,Y_BEIRAL=YP(580),Y_CONVES=YP(668),XC=2.09,ZA=ZP(799),ZC=ZP(235),ZD=ZP(212),XD=.57;
export const CABINE={piso:Y_PISO,beiral:Y_BEIRAL,conves:Y_CONVES,XC,ZA,ZC,ZD,XD,olho:new THREE.Vector3(0,2.45,2.32)};

const cil=(a,b,r,seg=10,r2)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),g=new THREE.CylinderGeometry(r2===undefined?r:r2,r,d.length(),seg,1,false);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()));g.translate(...A.clone().add(B).multiplyScalar(.5).toArray());return g};
const cx=(w,h,d,x,y,z)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);return g};
const une=l=>mergeGeometries(l.map(g=>{const q=g.index?g.toNonIndexed():g;for(const k of Object.keys(q.attributes))if(!['position','normal','uv'].includes(k))q.deleteAttribute(k);return q}),false);
function veios(cor,n=7){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=cor;x.fillRect(0,0,512,512);for(let i=0;i<n;i++){const y=i*512/n;x.fillStyle=`rgba(0,0,0,${.08+Math.random()*.2})`;x.fillRect(0,y,512,512/n);x.fillStyle='rgba(0,0,0,.5)';x.fillRect(0,y,512,2);for(let k=0;k<28;k++){x.strokeStyle=`rgba(${Math.random()<.5?'0,0,0':'255,214,160'},${.04+Math.random()*.08})`;x.lineWidth=.5+Math.random()*1.4;x.beginPath();const a=y+Math.random()*512/n;x.moveTo(0,a);x.bezierCurveTo(170,a+Math.random()*5-2,340,a+Math.random()*5-2,512,a);x.stroke()}}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=6;return t}

export const MESA={x0:-2,x1:-.86,z0:2.2,z1:3.62,y:1.8},PONTO_LANTERNA=[-1.02,MESA.y+.005,3.34],EIXO_LEME=new THREE.Vector3(0,2.02,3.22);

export function criaCabine({T,renderer,texMapa,carrega}){const barcoNovo=false;
  const g=new THREE.Group(),mog=new THREE.MeshStandardMaterial({map:veios('#6a3f22',5),roughness:.46}),mesaM=new THREE.MeshStandardMaterial({map:veios('#5c3c22',7),roughness:.55}),escura=new THREE.MeshStandardMaterial({map:veios('#2c2017',6),roughness:.7}),latao=new THREE.MeshStandardMaterial({color:0xb08d4a,roughness:.32,metalness:.9,envMapIntensity:1}),preto=new THREE.MeshStandardMaterial({color:0x15171a,roughness:.5});
  // ---------- Paredes por dentro, com os vãos das janelas e portas ----------
  const parI=new THREE.MeshStandardMaterial({map:veios('#7a6a55',16),roughness:.8,side:THREE.DoubleSide}),piso=new THREE.MeshStandardMaterial({map:veios('#4d3a28',11),roughness:.72,side:THREE.DoubleSide}),forro=new THREE.MeshStandardMaterial({map:veios('#8a7a62',14),roughness:.86,side:THREE.DoubleSide});const interior=[parI,piso,forro];
  {const Y_VJ=YP(667),Y_VT=YP(587),P=[[-XC,ZA],[-XC,ZC],[-XD,ZD],[XD,ZD],[XC,ZC],[XC,ZA]],LF=Math.hypot(XC-XD,ZD-ZC);
    const W=[{a:P[0],b:P[1],v:[[ZP(415)-ZA,ZP(265)-ZA,Y_VJ,Y_VT],[ZP(708)-ZA,ZP(636)-ZA,Y_VJ,Y_VT]]},{a:P[1],b:P[2],v:[[(LF-.89)/2,(LF+.89)/2,1.74,2.77]]},{a:P[2],b:P[3],v:[[.02,XD*2-.02,Y_CONVES,Y_BEIRAL-.06]]},{a:P[3],b:P[4],v:[[(LF-.89)/2,(LF+.89)/2,1.74,2.77]]},{a:P[4],b:P[5],v:[[ZC-ZP(271),ZC-ZP(421),Y_VJ,Y_VT],[ZC-ZP(558),ZC-ZP(596),YP(637),YP(586)],[ZC-ZP(635),ZC-ZP(706),Y_VJ,Y_VT]]},{a:P[5],b:P[0],v:[[XC-.54,XC+.54,Y_CONVES,2.72]]}];
    const lg=[],pretos=[];for(const w of W){const dx=w.b[0]-w.a[0],dz=w.b[1]-w.a[1],C=Math.hypot(dx,dz),ux=dx/C,uz=dz/C,nx=uz,nz=-ux,E=.08;const p=(q,y)=>[w.a[0]+ux*q+nx*E,y,w.a[1]+uz*q+nz*E];const ret=(s0,s1,h0,h1)=>{if(s1-s0<.001||h1-h0<.001)return;const A=p(s0,h0),B=p(s1,h0),C2=p(s1,h1),D=p(s0,h1),g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.Float32BufferAttribute([...A,...B,...C2,...A,...C2,...D],3));g2.setAttribute('uv',new THREE.Float32BufferAttribute([s0,h0,s1,h0,s1,h1,s0,h0,s1,h1,s0,h1],2));g2.computeVertexNormals();lg.push(g2)};
      const v=[...w.v].sort((m,n)=>m[0]-n[0]);let cur=0;for(const [s0,s1,h0,h1] of v){ret(cur,s0,Y_PISO,Y_BEIRAL);ret(s0,s1,Y_PISO,h0);ret(s0,s1,h1,Y_BEIRAL);cur=s1;
        // batente escuro em volta do vão
        const qm=(a0,b0,c0,d0)=>{const A=p(a0,c0),B=p(b0,d0);const L=Math.hypot(B[0]-A[0],B[1]-A[1],B[2]-A[2]);const bx=new THREE.BoxGeometry(.05,.05,L);const m4=new THREE.Matrix4().lookAt(new THREE.Vector3(...A),new THREE.Vector3(...B),new THREE.Vector3(0,1,0).applyAxisAngle(new THREE.Vector3(1,0,0),.0001));bx.applyMatrix4(m4);bx.translate((A[0]+B[0])/2,(A[1]+B[1])/2,(A[2]+B[2])/2);pretos.push(bx)};qm(s0,s1,h0,h0);qm(s0,s1,h1,h1);qm(s0,s0,h0,h1);qm(s1,s1,h0,h1)}ret(cur,C,Y_PISO,Y_BEIRAL)}
    const uneG=l=>mergeGeometries(l.map(q=>{const n=q.index?q.toNonIndexed():q;for(const k of Object.keys(n.attributes))if(!['position','normal','uv'].includes(k))n.deleteAttribute(k);if(!n.attributes.uv)n.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(n.attributes.position.count*2),2));return n}),false);
    const paredeM=new THREE.Mesh(uneG(lg),parI);g.add(paredeM);if(pretos.length)g.add(new THREE.Mesh(uneG(pretos),preto));
    const sh=new THREE.Shape(P.map(q=>new THREE.Vector2(q[0],q[1])));const pi=new THREE.ShapeGeometry(sh);pi.rotateX(Math.PI/2);pi.translate(0,Y_PISO+.02,0);{const uv=pi.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.4,uv.getY(i)*.4)}const pM=new THREE.Mesh(pi,piso);pM.receiveShadow=T>=2;g.add(pM);const fo=pi.clone();fo.translate(0,Y_BEIRAL-Y_PISO-.07,0);g.add(new THREE.Mesh(fo,forro));
    for(const t of[parI.map,piso.map,forro.map]){t.repeat.set(.42,.42)}}
  // Mesa de cartas com o mapa aberto, junto à janela de boreste
  const {x0,x1,z0,z1,y}=MESA,mc=(x0+x1)/2,mz=(z0+z1)/2;
  const tampo=new THREE.Mesh(cx(x1-x0,.07,z1-z0,mc,y-.035,mz),mesaM);tampo.receiveShadow=true;tampo.castShadow=true;g.add(tampo);
  const per=[];for(const a of[x0+.08,x1-.08])for(const b of[z0+.08,z1-.08])per.push(cx(.09,y-CABINE.piso-.06,.09,a,(y-.06+CABINE.piso)/2,b));per.push(cx(x1-x0-.1,.12,.03,mc,y-.12,z0+.02),cx(x1-x0-.1,.12,.03,mc,y-.12,z1-.02),cx(.03,.12,z1-z0-.1,x1-.02,y-.12,mz));
  const pernas=new THREE.Mesh(une(per),escura);pernas.castShadow=true;g.add(pernas);
  const mapa=new THREE.Mesh(new THREE.PlaneGeometry(1.28,.905),new THREE.MeshStandardMaterial({map:texMapa,roughness:.82}));mapa.rotation.set(-Math.PI/2,Math.PI/2+.018,0,'YXZ');mapa.position.set(mc-.02,y+.004,mz-.02);mapa.receiveShadow=true;g.add(mapa);
  // Bíblia fechada ao lado do mapa, o outro símbolo do evento
  {const b=new THREE.Group(),c=new THREE.Mesh(cx(.17,.04,.24,0,.02,0),new THREE.MeshStandardMaterial({color:0x2a1712,roughness:.6})),f=new THREE.Mesh(cx(.155,.028,.226,.006,.02,0),new THREE.MeshStandardMaterial({color:0xe9e2cf,roughness:.8}));c.castShadow=true;b.add(c,f);b.position.set(x0+.2,y,z0+.16);b.rotation.y=.35;g.add(b)}
  // Lanterna-símbolo e a luz dela
  const lant=criaLanterna(renderer,T,carrega);lant.position.set(...PONTO_LANTERNA);lant.rotation.y=-1.05;g.add(lant);
  const luz=new THREE.PointLight(0xffb066,0,14,1.35);luz.position.set(PONTO_LANTERNA[0],PONTO_LANTERNA[1]+.225,PONTO_LANTERNA[2]);
  g.add(luz);
  // ---------- Leme de madeira ----------
  const roda=new THREE.Group(),R=.36;
  {const aro=new THREE.TorusGeometry(R,.03,12,64),uv=aro.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*5,uv.getY(i));const pecas=[aro];
    const raios=[],pegas=[];for(let i=0;i<8;i++){const a=i/8*6.283,c=Math.cos(a),s=Math.sin(a);
      const pr=[];for(const [r,h] of[[.03,0],[.024,.04],[.016,.09],[.02,.15],[.014,.21],[.018,.3],[.02,R-.02]])pr.push(new THREE.Vector2(r,h));const b=new THREE.LatheGeometry(pr,10);b.rotateZ(-a+Math.PI/2);raios.push(b);
      const pg=[];for(const [r,h] of[[.014,0],[.02,.02],[.026,.06],[.02,.11],[.008,.125],[.0005,.127]])pg.push(new THREE.Vector2(r,h));const t=new THREE.LatheGeometry(pg,10);t.rotateZ(-a+Math.PI/2);t.translate(c*(R+.024),s*(R+.024),0);pegas.push(t)}
    const madeira=new THREE.Mesh(une([...pecas,...raios,...pegas]),mog);madeira.castShadow=true;roda.add(madeira);
    const cubo=new THREE.CylinderGeometry(.072,.082,.09,20);cubo.rotateX(Math.PI/2);const capa=new THREE.CylinderGeometry(.044,.054,.03,18);capa.rotateX(Math.PI/2);capa.translate(0,0,-.058);roda.add(new THREE.Mesh(une([cubo,capa]),latao));
    const marca=new THREE.Mesh(cx(.03,.09,.012,0,R-.02,-.034),latao);roda.add(marca)}
  const apoio=new THREE.Group();apoio.position.copy(EIXO_LEME);apoio.rotation.x=-.34;apoio.add(roda);g.add(apoio);
  // Coluna do leme e bitácula com a agulha
  const col=[cil([0,CABINE.piso,3.42],[0,2.0,3.36],.1,12,.058),cx(.42,.05,.42,0,CABINE.piso+.03,3.42)];const colM=new THREE.Mesh(une(col),escura);colM.castShadow=true;g.add(colM);
  g.add(new THREE.Mesh(une([cil([0,2.02,3.25],[0,2.02,3.38],.03,10)]),latao));
  {const bit=new THREE.Group();const c=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.07,0],[.09,.02],[.09,.09],[.07,.12],[0,.12]].map(p=>new THREE.Vector2(...p)),18),latao);const v=new THREE.Mesh(new THREE.CircleGeometry(.07,20),new THREE.MeshStandardMaterial({color:0xefe7cf,roughness:.3}));v.rotation.x=-Math.PI/2;v.position.y=.124;const ag=new THREE.Mesh(cx(.1,.002,.012,0,.128,0),new THREE.MeshStandardMaterial({color:0xa82620,roughness:.5}));bit.add(c,v,ag);bit.position.set(.52,1.69,3.32);g.add(bit);g.add(new THREE.Mesh(cil([.52,CABINE.piso,3.32],[.52,1.69,3.32],.05,10),escura));bit.userData.agulha=ag;g.userData.agulha=ag}
  // ---------- Alavanca do motor ----------
  const PX=-.52,PY=1.72,PZ=3.12;const base=[cx(.34,PY-CABINE.piso,.46,PX,(PY+CABINE.piso)/2,PZ)];const bm=new THREE.Mesh(une(base),escura);bm.castShadow=true;g.add(bm);
  {const qd=new THREE.Shape();qd.moveTo(0,0);for(let i=0;i<=20;i++){const a=(-.8+1.6*i/20);qd.lineTo(Math.sin(a)*.26,Math.cos(a)*.26)}qd.closePath();const e=new THREE.ExtrudeGeometry(qd,{depth:.018,bevelEnabled:false,curveSegments:8});e.rotateY(-Math.PI/2);for(const dx of[-.04,.058]){const c=e.clone();c.translate(PX+dx,PY,PZ);g.add(new THREE.Mesh(c,latao))}
    const nt=[];for(let i=0;i<=8;i++){const a=-.72+1.44*i/8;nt.push(cil([PX,PY+Math.cos(a)*.245,PZ+Math.sin(a)*.245],[PX+.012,PY+Math.cos(a)*.262,PZ+Math.sin(a)*.262],.006,5))}g.add(new THREE.Mesh(une(nt),preto))}
  const alav=new THREE.Group();alav.position.set(PX,PY,PZ);{const hs=cil([0,0,0],[0,.46,0],.015,10,.012),pv=new THREE.CylinderGeometry(.03,.03,.1,14);pv.rotateZ(Math.PI/2);alav.add(new THREE.Mesh(une([hs,pv]),latao));const km=new THREE.SphereGeometry(.042,18,14);km.scale(1,1.2,1);km.translate(0,.49,0);const kn=new THREE.Mesh(km,preto);kn.castShadow=true;alav.add(kn)}g.add(alav);
  // Anteparas com porta central: salão do leme, sala de atendimento da lancha-clínica e camarote de popa
  const tabuaI=new THREE.MeshStandardMaterial({map:veios('#6e5f4d',14),roughness:.8});
  const antepara=z=>{const y0=CABINE.piso,y1=CABINE.beiral-.06,X=2.02,d=.47,top=2.74,f=[cx(X-d,y1-y0,.07,-(X+d)/2,(y0+y1)/2,z),cx(X-d,y1-y0,.07,(X+d)/2,(y0+y1)/2,z),cx(d*2,y1-top,.07,0,(top+y1)/2,z)];const m=new THREE.Mesh(une(f),tabuaI);m.castShadow=true;g.add(m);const b=[cx(.07,top-y0,.11,-d,(top+y0)/2,z),cx(.07,top-y0,.11,d,(top+y0)/2,z),cx(d*2+.07,.07,.11,0,top,z)];g.add(new THREE.Mesh(une(b),escura))};
  if(!barcoNovo){antepara(-.3);antepara(-3.5);
  // Sala de atendimento: maca, armário e bacia
  {const mb=[cx(.74,.08,1.95,-1.52,1.72,-1.9),cx(.08,.72,.08,-1.82,1.36,-2.8),cx(.08,.72,.08,-1.22,1.36,-2.8),cx(.08,.72,.08,-1.82,1.36,-1),cx(.08,.72,.08,-1.22,1.36,-1)];g.add(new THREE.Mesh(une(mb),escura));g.add(new THREE.Mesh(cx(.68,.09,1.86,-1.52,1.8,-1.9),new THREE.MeshStandardMaterial({color:0xcfc9b6,roughness:.85})));const arm=[cx(.42,1.75,1.4,1.78,1.88,-1.2)];g.add(new THREE.Mesh(une(arm),tabuaI))}
  // Camarote de popa: dois beliches estreitos
  for(const s of[-1,1]){const b=[cx(.72,.1,2,s*1.62,1.5,-5.3),cx(.72,.1,2,s*1.62,2.28,-5.3),cx(.05,1.5,.05,s*1.27,1.75,-6.25),cx(.05,1.5,.05,s*1.27,1.75,-4.35)];g.add(new THREE.Mesh(une(b),escura));const col=[cx(.66,.09,1.9,s*1.62,1.59,-5.3),cx(.66,.09,1.9,s*1.62,2.37,-5.3)];g.add(new THREE.Mesh(une(col),new THREE.MeshStandardMaterial({color:0x7c6a4d,roughness:.9})))}
  }
  // Bancos pretos sob os janelões e uma prateleira com caixas de remédio da lancha-clínica
  if(!barcoNovo){const banco=[];for(const s of[-1,1]){banco.push(cx(.5,.44,s>0?3.3:1.9,s*1.72,CABINE.piso+.22,s>0?1.45:.86),cx(.08,.6,s>0?3.3:1.9,s*1.97,CABINE.piso+.68,s>0?1.45:.86))}const bq=new THREE.Mesh(une(banco),new THREE.MeshStandardMaterial({color:0x24282b,roughness:.8}));bq.castShadow=true;g.add(bq);}
  const prat=[cx(.34,.03,2,-1.84,2.5,-.92-.3-.1),cx(.34,.03,2,-1.84,2.2,-1.32)];g.add(new THREE.Mesh(une(prat),escura));{let s=7;const ac=()=>{s=(s*16807)%2147483647;return s/2147483647};const cxs=[];for(let i=0;i<18;i++){const w=.1+ac()*.1,h=.12+ac()*.14,z=-4.5+i*.11;cxs.push(cx(.2,h,w*.8,-1.84,(i%2?2.5:2.2)+.015+h/2,z+2.9))}const m=new THREE.Mesh(une(cxs),new THREE.MeshStandardMaterial({color:0xcbbf9f,roughness:.7}));g.add(m)}
  // Áreas de toque maiores que as peças, para o dedo não errar
  const inv=new THREE.MeshBasicMaterial({visible:false});
  const proxRoda=new THREE.Mesh(new THREE.CircleGeometry(R+.12,20),inv);proxRoda.rotation.y=Math.PI;apoio.add(proxRoda);proxRoda.position.z=-.03;proxRoda.userData.alvo='leme';
  const proxAlav=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),inv);proxAlav.position.y=.45;alav.add(proxAlav);proxAlav.userData.alvo='alavanca';
  mapa.userData.alvo='mapa';
  // Por dentro é um pouco mais escuro: o sol não atravessa o teto, e o céu só entra pelas janelas
  const fechado=m=>{if(m.userData.fechado)return;m.userData.fechado=true;m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <lights_fragment_begin>',THREE.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );directLight.color*=.07;').replace('irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );','irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal )*.58;'))};m.needsUpdate=true};
  g.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial)fechado(o.material)});
  return {grupo:g,lant,luz,roda,alav,mapa,proxRoda,proxAlav,apoio,fechado};
}
