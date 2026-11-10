// A viagem: abertura na cabine, câmera por fora ou no leme, linha do tempo no topo e a história nas margens.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {caminho,trilho,ceu,agua,terreno,nevoa,alturaMargem,vitorias,defineLarg,defineClareiras,LARG,PASSO} from './mundo.js';
import {criaBarco,CABINE} from './barco.js';
import {criaCabine,EIXO_LEME} from './cabine.js';
import {criaFloresta,muralha} from './floresta.js';
import {criaRastro} from './efeitos.js';
import {araras,borboletas,animais} from './fauna.js';
import {criaKit,OBRAS,torre} from './predios.js';
import {criaJanelas} from './janelas.js';
import {Pos} from './pos.js';
import {Som} from './som.js';
const Q=new URLSearchParams(location.search);
const dorme=m=>new Promise(r=>setTimeout(r,m));
const sst=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const mix=(a,b,k)=>a+(b-a)*k;
const giro=a=>Math.atan2(Math.sin(a),Math.cos(a));
const Y_CLAREIRA=2.4;
// O que há em cada marco. e = +1 à esquerda de quem desce o rio, -1 à direita.
// props: [modelo, deslocamento ao longo do rio, distância da água, rotação, escala]
const PONTOS=[
 {e:-1,props:[['t_palafita',-16,17,.3,1],['t_palafita',13,24,-.5,1.1],['t_palafita',36,20,.9,.95],['t_trapiche',0,-4.5,1.57,3.2]],clar:{ds:52,l1:42},palmas:[-30,30]},
 {e:1,props:[['t_palafita',-8,16,-.4,1.05],['t_palafita',22,22,.35,1],['t_trapiche',8,-4.5,-1.57,3.2]],clar:{ds:42,l1:38},palmas:[-24,38]},
 {e:-1,props:[['t_trapiche',-8,-4.5,1.57,3.6],['t_trapiche',14,-4.5,1.57,3.2],['t_palafita',4,22,.1,1.1]],clar:{ds:40,l1:40},palmas:[-30,28]},
 {e:1,props:[['t_palafita',-14,18,.2,1.15],['t_palafita',14,20,-.3,1.05]],clar:{ds:36,l1:36},palmas:[-26,26]},
 {e:-1,obra:'templo1937'},{e:1,obra:'templo1940'},{e:-1,obra:'radio1995',torre:[26,-16]},{e:1,obra:'sede1996',palmas:[-58,62]},{e:-1,obra:'sede2001',palmas:[-34,32]},{e:1,obra:'sede2009',palmas:[30,-38]},{e:-1,obra:'tv2014',torre:[20,-16]},{e:1,obra:'sede2014',palmas:[-54,38]},
 {e:-1,obra:'memoria2026',props:[['t_pedra',-30,20,.4,1.2]],palmas:[-44,44,-26]}];
function nivel(r){
  if(Q.get('q'))return +Q.get('q');
  const g=r.getContext(),e=g.getExtension('WEBGL_debug_renderer_info'),n=e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'',mob=/Android|iPhone|iPad/i.test(navigator.userAgent);
  if(/SwiftShader|llvmpipe|Software/i.test(n))return 0;
  if(/Adreno \(TM\) [3-6]\d\d|Mali-(G[1-7]\d|T)|PowerVR|Vivante/i.test(n))return 0;
  return mob?1:2;
}
export async function iniciarViagem(api){
  const {MARCOS,canvas,abre,fala,para,estado,painel,$}=api;const NP=MARCOS.length;defineLarg(innerWidth<innerHeight?21:34);
  document.body.classList.add('viagem');
  const css=document.createElement('link');css.rel='stylesheet';css.href='viagem/viagem.css';document.head.append(css);
  const ui=document.createElement('div');ui.innerHTML=`<div id=vCarga><span>Preparando a viagem…</span><i><b id=vBarra></b></i></div>
  <div id=vLinha><div id=vFita></div><i id=vAgulha></i><span id=vRumoTxt></span></div>
  <div id=vHud><span id=vAno></span><span id=vTit></span></div><div id=vLeg></div><div id=vLeme></div><div id=vDica></div>
  <div id=vAlav><i id=vAlavTrilho></i><b id=vAlavPega></b><small id=vAlavTxt>MOTOR</small></div>
  <button id=vVista aria-label="Trocar de câmera">⛭</button><button id=vPausa aria-label="Pausar">❚❚</button><button id=vMenuBt aria-label="Abrir controles">≡</button>
  <div id=vPausado hidden><b>Viagem em pausa</b><button id=vContinua>▶ Continuar</button></div>
  <div id=vMenu hidden><h4>Controles de bordo</h4><label><input type=checkbox id=vcVoz checked>Narração</label><label><input type=checkbox id=vcTri checked>Trilha</label><label><input type=checkbox id=vcAmb checked>Sons ambiente</label><label><input type=checkbox id=vcTxt checked>Legendas</label><h4>Saltar para</h4><div id=vAnos></div><h4>Barco</h4><div id=vBarcoOp><button data-b=tripo>Tripo</button><button data-b=novo>Novo (código)</button></div><h4>Qualidade</h4><div id=vQual><button data-q="">Automática</button><button data-q=0>Leve</button><button data-q=1>Média</button><button data-q=2>Alta</button></div><button id=vRever>Rever a abertura</button></div>
  <div id=vMapa hidden><div id=vMapaArea><div id=vMapaConteudo><img id=vMapaImg alt="Mapa da viagem"><div id=vMapaPontos></div></div></div><button id=vMapaFecha aria-label="Fechar o mapa">×</button><p id=vMapaTxt>Toque em um marco para saltar até ele · pinça para ampliar</p></div>
  <button id=vPular>Pular abertura</button><button id=vLer>Ler a história</button><div id=vLenta></div>`;document.body.append(ui);
  const barra=v=>{$('vBarra').style.width=Math.round(v*100)+'%'};
  const r=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance',stencil:false});window.__viagem={};
  const T=nivel(r);const PRmax=[1.15,1.35,1.75][T];let pr=Math.min(devicePixelRatio,PRmax);r.setPixelRatio(1);r.outputColorSpace=THREE.LinearSRGBColorSpace;r.toneMapping=THREE.NoToneMapping;
  if(T>=2){r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap}
  const cena=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,1,.09,1200);cena.fog=new THREE.FogExp2(0x000000,.003);
  const tl=new THREE.TextureLoader(),tx=n=>{const t=tl.load('viagem/tx/'+n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
  const uni={uSol:{value:new THREE.Vector3(0,-.2,-1).normalize()},uHora:{value:0},uT:{value:0},tRuido:{value:tx('ruido.jpg')},tRuido2:{value:tx('solo.jpg')},tNormal:{value:tx('agua_n.jpg')},tReflexo:{value:null},uTemReflexo:{value:1},uTM:{value:new THREE.Matrix4()},uBarco:{value:new THREE.Vector3()},uRumo:{value:new THREE.Vector2(0,-1)},uVel:{value:0},uToq:{value:new THREE.Vector4(0,0,0,-99)},uNevoa:{value:new THREE.Color(0,0,0)},uDens:{value:.0035},uLarg:{value:LARG}};
  const c=caminho(NP+1),tr=trilho(c),L=tr.L;const S0=PASSO*3,paradas=MARCOS.map((m,i)=>S0+PASSO*(i+.6));
  // Clareiras: terreno plano e sem mata onde há construções
  const clareiras=PONTOS.map((p,i)=>{const o=p.obra?OBRAS[p.obra]:null,ds=o?o.larg*o.es/2+12:p.clar.ds,l1=o?o.recuo+o.prof*o.es+10:p.clar.l1;return {s:paradas[i],e:p.e,ds,l1,y:Y_CLAREIRA}});defineClareiras(clareiras);
  const lats=[];for(let v=-LARG-12;v<=LARG+12;v+=4)lats.push(v);
  const objCeu=ceu(cena,uni);const objAgua=agua(tr,uni,lats);cena.add(objAgua);cena.add(terreno(tr,uni));
  const mNevoa=nevoa(tr,cena,uni,[120,260,420][T]);
  araras(tr,cena,uni,[24,48,72][T]);borboletas(tr,cena,uni,[40,90,150][T]);vitorias(tr,cena,[140,280,420][T]);const rastro=criaRastro(cena,uni);
  barra(.1);
  const hemi=new THREE.HemisphereLight(0xffffff,0x3a3020,.5),sol=new THREE.DirectionalLight(0xffffff,0),apoio=new THREE.DirectionalLight(0xffe2c0,.8);cena.add(hemi,sol,sol.target,apoio,apoio.target);
  if(T>=2){sol.castShadow=true;sol.shadow.mapSize.set(2048,2048);const s=sol.shadow.camera;s.left=s.bottom=-58;s.right=s.top=58;s.far=340;s.updateProjectionMatrix();sol.shadow.bias=-.0006;sol.shadow.normalBias=.03}
  // ---------- Barco ----------
  const gl=new GLTFLoader(),cache={};
  const carrega=n=>cache[n]||(cache[n]=gl.loadAsync('viagem/modelos/'+n+'.glb').then(g=>g.scene).catch(()=>null));
  const barco=new THREE.Group();cena.add(barco);const casco=criaBarco(T);barco.add(casco);barra(.2);
  const extCodigo=casco.userData.ext;let barcoFora=null;const paredeInt=casco.userData.int.children.find(m=>m.material===casco.userData.interior[0]);
  // Dois barcos: o do Tripo corrigido no Blender (padrão por enquanto) e o novo, todo feito por código (?barco=novo).
  // No novo, exterior e interior são o mesmo modelo; no do Tripo, o interior continua sendo o de barco.js.
  let BARCO_NOVO=Q.get('barco')==='novo';try{if(Q.get('barco')==null&&localStorage.getItem('luzeiro_barco')==='novo')BARCO_NOVO=true}catch(e){}
  if(BARCO_NOVO){casco.visible=false;const s=await carrega('luzeiro_novo_'+['c','b','a'][T]);if(s){s.traverse(o=>{if(o.isMesh){o.castShadow=T>=2;o.receiveShadow=T>=2;o.frustumCulled=false}});barco.add(s);window.__barcoNovo=s}else{casco.visible=true;BARCO_NOVO=false}}
  else carrega(Q.get('barco')==='codigo'?'__nao__':('luzeiro_'+['c','b','a'][T])).then(s=>{if(!s)return;s.position.y=-.94;s.traverse(o=>{if(o.isMesh){o.castShadow=T>=2;o.receiveShadow=T>=2}});barco.add(s);barcoFora=s;s.visible=false});
  // ---------- Prédios, clareiras e marcos ----------
  const K=criaKit(r),cenarios=[],alvos=[],extras=[],po={};
  // o barco novo reflete o mesmo céu dos prédios, acompanhando a hora do dia
  if(BARCO_NOVO&&window.__barcoNovo){const vistos=new Set();window.__barcoNovo.traverse(o=>{if(o.isMesh&&!vistos.has(o.material)){vistos.add(o.material);const m=o.material;m.envMap=K.env;m.envMapIntensity=.6;m.userData.env=.6;K.comEnv.push(m);m.aoMapIntensity=1}})}
  const texGrama=(()=>{const q=document.createElement('canvas');q.width=q.height=512;const x=q.getContext('2d');x.fillStyle='#5f7a35';x.fillRect(0,0,512,512);for(let i=0;i<9000;i++){const g=Math.random();x.fillStyle=`rgba(${60+g*70},${90+g*70},${30+g*30},.5)`;x.fillRect(Math.random()*512,Math.random()*512,1+Math.random()*2,2+Math.random()*5)}for(let i=0;i<90;i++){x.fillStyle=`rgba(40,50,20,${Math.random()*.1})`;const s=30+Math.random()*90;x.fillRect(Math.random()*512,Math.random()*512,s,s*.6)}const t=new THREE.CanvasTexture(q);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t})();
  const criaChao=(W,D)=>{const q=document.createElement('canvas');q.width=q.height=256;const x=q.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,256,256);const g=x.createRadialGradient(128,128,70,128,128,128);g.addColorStop(0,'#fff');g.addColorStop(.72,'#fff');g.addColorStop(1,'#000');x.fillStyle=g;x.save();x.translate(128,128);x.scale(1,1);x.fillRect(-128,-128,256,256);x.restore();const a=new THREE.CanvasTexture(q);const t=texGrama.clone();t.repeat.set(W/9,D/9);t.needsUpdate=true;const m=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({map:t,alphaMap:a,transparent:true,depthWrite:false,roughness:.95,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));m.rotation.x=-Math.PI/2;m.receiveShadow=T>=2;m.renderOrder=-1;return m};
  PONTOS.forEach((p,i)=>{const si=paradas[i],e=p.e,g=new THREE.Group();g.userData={si,e};tr.em(si,po);const rotBase=Math.atan2(-po.nx*e,-po.nz*e);
    const ob=p.obra?OBRAS[p.obra]:null,cl=clareiras[i];let centro=new THREE.Vector3(po.x+po.nx*e*(LARG+18),Y_CLAREIRA+6,po.z+po.nz*e*(LARG+18));
    // gramado alinhado ao rio
    {const lc=LARG+(cl.l1+6)/2,ch=criaChao(cl.ds*2+18,cl.l1+22);ch.position.set(po.x+po.nx*e*lc,Y_CLAREIRA+.04,po.z+po.nz*e*lc);ch.rotation.z=rotBase;g.add(ch)}
    if(ob){const m=ob.f(K);m.scale.setScalar(ob.es);const lat=e*(LARG+ob.recuo),o3={};tr.em(si+(ob.ds||0),o3);m.position.set(o3.x+o3.nx*lat,Y_CLAREIRA-.02,o3.z+o3.nz*lat);m.rotation.y=rotBase+ob.rot;g.add(m);centro.set(m.position.x-Math.sin(rotBase)*10,Y_CLAREIRA+8,m.position.z-Math.cos(rotBase)*10)}
    if(p.torre){const t=torre(K,58);const o2={};tr.em(si+p.torre[0],o2);const lat=e*(LARG+(ob?ob.recuo:14)+22);t.position.set(o2.x+o2.nx*lat,Y_CLAREIRA-.02,o2.z+o2.nz*lat);t.rotation.y=rotBase;g.add(t)}
    for(const [nome,ds,dl,rt,es] of p.props||[])carrega(nome).then(s=>{if(!s)return;const q=s.clone(true),o={};tr.em(si+ds,o);const lat=e*(LARG+dl);const y=dl<0?-.1:Math.max(.3,alturaMargem(lat,si+ds))-.1;q.position.set(o.x+o.nx*lat,y,o.z+o.nz*lat);q.rotation.y=Math.atan2(-o.nx*e,-o.nz*e)+rt;q.scale.setScalar(es);q.traverse(a=>{if(a.isMesh){a.castShadow=T>=2;a.receiveShadow=T>=2;if(a.material.metalness!==undefined)a.material.metalness=0}});g.add(q)});
    for(const ds of p.palmas||[]){const o={};tr.em(si+ds,o);const lat=e*(LARG+(ob?Math.min(ob.recuo-5,12):8)+Math.abs(ds%7));extras.push({n:ds%2?'acai_a':'palma_a',x:o.x+o.nx*lat,y:Y_CLAREIRA-.2,z:o.z+o.nz*lat,es:ob?.62:.9,s:si+ds})}
    g.userData.centro=centro;cena.add(g);cenarios.push(g)});
  barra(.34);
  const {blocos,un:unFloresta}=await criaFloresta(tr,cena,uni,T,clareiras,tl,extras);const objMata=muralha(tr,cena,uni,uni.tRuido.value);barra(.62);
  // ---------- Janelas digitais ----------
  const J=criaJanelas({MARCOS,PONTOS,paradas,tr,cena,tl,LARG,alvos,uT:uni.uT});
  // ---------- Cabine ----------
  const texM=tl.load('spread.jpg');texM.colorSpace=THREE.SRGBColorSpace;texM.anisotropy=8;
  const CAB=criaCabine({T,renderer:r,texMapa:texM,interior:casco.userData.interior,carrega,barcoNovo:BARCO_NOVO});barco.add(CAB.grupo);const lant=CAB.lant,luzL=CAB.luz,intCodigo=casco.userData.int;barra(.72);
  // Roteiro da abertura em coordenadas do barco: lanterna, mapa visto do alto, porta da frente, proa, costado com o nome, popa
  const TEC=[[0,[-.28,2.1,3.72],[-1.02,2.03,3.34]],[6,[-.3,2.14,3.66],[-1.02,2.04,3.32]],[11,[-.5,2.5,3.5],[-1.2,1.86,3.1]],[16,[-.98,2.8,3.3],[-1.44,1.8,3.3]],[21,[-.98,2.8,2.58],[-1.44,1.8,2.5]],[25,[-.8,2.76,2.9],[-1.42,1.8,2.9]],[28,[-.3,2.5,3.36],[0,2.4,6]],[30,[0,2.4,4.3],[0,2.5,9]],[32,[.8,2.9,6.6],[0,2.6,14]],[34,[1.4,3.2,9.5],[0,2.6,18]],[37,[2,3.8,17],[2,3,30]],[39,[3,3.8,19],[22,3,22]],[43,[5,3.6,18],[0,2.4,2]],[48,[13,3.2,12.5],[0,2.2,3]],[53,[15.5,2.8,5.8],[1.5,1.9,4.4]],[58,[17,3,-1],[0,2.4,0]],[62,[14,5,-13],[0,2.6,-1]],[66,[5,7,-21],[0,3,2]],[68,[0,8,-23],[0,2.4,20]]];
  const cp=new THREE.CatmullRomCurve3(TEC.map(k=>new THREE.Vector3(...k[1])),false,'centripetal'),cl=new THREE.CatmullRomCurve3(TEC.map(k=>new THREE.Vector3(...k[2])),false,'centripetal'),DUR=68,T_DENTRO=34.5;
  const parm=t=>{let i=0;while(i<TEC.length-2&&t>TEC[i+1][0])i++;const k=Math.min(1,Math.max(0,(t-TEC[i][0])/(TEC[i+1][0]-TEC[i][0])));return (i+k)/(TEC.length-1)};
  const noTrajeto=t=>(parm(t-1)+parm(t-.5)*2+parm(t)*2+parm(t+.5)*2+parm(t+1))/8;
  // Passagem entre as câmeras: entra pela porta dos fundos, atravessa os compartimentos e chega ao leme
  const pontosT=[new THREE.Vector3(0,8,-23),new THREE.Vector3(0,4,-13),new THREE.Vector3(0,2.55,-8.4),new THREE.Vector3(0,2.42,CABINE.ZA+.1),new THREE.Vector3(0,2.42,-3.5),new THREE.Vector3(0,2.42,-.3),CABINE.olho.clone()];
  const curvaT=new THREE.CatmullRomCurve3(pontosT,false,'centripetal');
  // ---------- Reflexo, pós e tamanho ----------
  const rtR=new THREE.WebGLRenderTarget([256,320,640][T],[144,180,360][T],{type:THREE.UnsignedByteType,depthBuffer:true}),camR=new THREE.PerspectiveCamera();uni.tReflexo.value=rtR.texture;
  const planoAgua=[new THREE.Plane(new THREE.Vector3(0,1,0),.05)],bias=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
  const pos=new Pos(r,T);
  let W=1,H=1,fovBase=46;const tam=()=>{W=innerWidth;H=innerHeight;const pw=Math.round(W*pr),ph=Math.round(H*pr);r.setSize(pw,ph,false);canvas.style.width=W+'px';canvas.style.height=H+'px';pos.tam(pw,ph);cam.aspect=W/H;cam.updateProjectionMatrix();colocaFita()};
  // ---------- Estado ----------
  const est={fase:'abertura',t:0,s:S0-122,lat:0,yaw:0,v:0,dir:1,leme:0,pegou:null,ang0:0,lemeSeg:0,batente:false,virando:false,giroLado:1,segura:null,tlPega:false,tlX0:0,tlDx:0,tlPuxa:0,alav:.5,rpm:0,modo:'fora',trans:0,transDir:0,fy:0,fp:-.06,janAz:0,janAlvo:0,atual:-1,falando:-1,narrou:new Set(),panA:0,esc:1,lendo:false,ox:0,oy:0,oxA:0,oyA:.14,fimdito:false,cy:0,cp:0,cz:1,cIdle:9,comVoz:true,tFala:0,durMudo:8,pausa:false,comTxt:true,mudoCb:null,frases:[],fade:1,fadeAlvo:1,saltando:false,manual:null,tTitulo:0,camFixa:null};
  {const o={};tr.em(est.s,o);est.yaw=Math.atan2(o.tx,o.tz)}
  // ---------- Linha do tempo no topo ----------
  const fita=$('vFita'),PAS=()=>Math.max(66,Math.min(112,W*.1));
  fita.innerHTML=MARCOS.map((m,i)=>`<span class=ano id=vM${i}>${m.ano}</span>`).join('');
  const pIdx=q=>{if(q<=paradas[0])return (q-paradas[0])/PASSO;for(let i=0;i<NP-1;i++)if(q<paradas[i+1])return i+(q-paradas[i])/(paradas[i+1]-paradas[i]);return NP-1+(q-paradas[NP-1])/PASSO};
  function colocaFita(){const p=PAS();MARCOS.forEach((m,i)=>{$('vM'+i).style.left=(i*p)+'px'})}
  const linha=$('vLinha');let anoAceso=-1;
  linha.addEventListener('pointerdown',e=>{if(est.fase!=='navega')return;linha.setPointerCapture(e.pointerId);est.tlPega=true;est.tlX0=e.clientX;linha.classList.add('puxando')});
  linha.addEventListener('pointermove',e=>{if(!est.tlPega)return;const dx=e.clientX-est.tlX0;est.tlDx=Math.sign(dx)*Math.min(Math.abs(dx),150);est.tlPuxa=Math.max(-1,Math.min(1,-dx/95))});
  const soltaLinha=()=>{if(!est.tlPega)return;est.tlPega=false;est.tlPuxa=0;linha.classList.remove('puxando');if(est.segura==='linha')soltaVolta()};linha.addEventListener('pointerup',soltaLinha);linha.addEventListener('pointercancel',soltaLinha);
  // ---------- Volta do barco ----------
  const iniciaVolta=(lado,quem)=>{if(est.dir<0||est.s<PASSO)return;est.dir=-1;est.virando=true;est.giroLado=lado;est.segura=quem;if(est.falando>=0){para();est.falando=-1;est.frases=[];est.mudoCb=null}};
  const soltaVolta=()=>{est.segura=null;if(est.dir<0){est.dir=1;est.virando=true;est.giroLado=est.lat>0?-1:1}};
  // ---------- Leme transparente (por fora) ----------
  const lemeEl=$('vLeme'),LIM=125;const raios=[...Array(8)].map((_,i)=>`<g transform="rotate(${i*45+22.5} 500 500)"><path d="M474 372 L486 262 H514 L526 372Z"/><path d="M482 200 L490 150 Q476 128 484 106 Q488 62 500 42 Q512 62 516 106 Q524 128 510 150 L518 200Z"/></g>`).join('');
  lemeEl.innerHTML=`<svg viewBox="0 0 1000 1000" aria-hidden="true"><g id=vRoda><g class=sil><circle cx=500 cy=500 r=272 fill=none stroke-width=78 class=aro /><circle cx=500 cy=500 r=312 fill=none stroke-width=4 /><circle cx=500 cy=500 r=232 fill=none stroke-width=4 />${raios}<circle cx=500 cy=500 r=120 /></g></g><circle class=toque cx=500 cy=500 r=500 /></svg>`;const lemeRodar=document.getElementById('vRoda');
  const ptrAng=(e,cx,cy)=>Math.atan2(e.clientY-cy,e.clientX-cx)*57.296;
  const movLeme=(a)=>{let d=a-est.ang0;while(d>180)d-=360;while(d<-180)d+=360;est.ang0=a;if(est.dir<0&&est.segura==='leme')return;est.leme=Math.max(-1,Math.min(1,est.leme+d/LIM))};
  const centroEl=()=>{const b=lemeEl.getBoundingClientRect();return [b.left+b.width/2,b.top+b.height/2]};
  lemeEl.onpointerdown=e=>{if(est.fase!=='navega')return;lemeEl.setPointerCapture(e.pointerId);est.pegou='leme';const c0=centroEl();est.ang0=ptrAng(e,c0[0],c0[1]);est.lemeC=c0;$('vDica').classList.remove('on')};
  lemeEl.onpointermove=e=>{if(est.pegou==='leme'&&est.lemeC&&!est.lemeC3)movLeme(ptrAng(e,est.lemeC[0],est.lemeC[1]))};
  const soltaLeme=()=>{if(est.pegou==='leme'){est.pegou=null;est.lemeSeg=0;est.batente=false;est.lemeC=null;est.lemeC3=false;if(est.segura==='leme')soltaVolta()}};lemeEl.onpointerup=soltaLeme;lemeEl.onpointercancel=soltaLeme;
  // ---------- Alavanca em tela, para o celular em pé ----------
  const alavUI=$('vAlav');const poeAlav=y=>{const b=alavUI.getBoundingClientRect();est.alav=Math.max(0,Math.min(1,1-(y-b.top-20)/(b.height-40)))};
  alavUI.onpointerdown=e=>{alavUI.setPointerCapture(e.pointerId);est.alavUI=true;poeAlav(e.clientY)};alavUI.onpointermove=e=>{if(est.alavUI)poeAlav(e.clientY)};alavUI.onpointerup=alavUI.onpointercancel=()=>{est.alavUI=false};
  // ---------- Som e botões ----------
  const som=new Som();await som.carrega(v=>barra(.72+v*.26));barra(1);$('vMenuBt').onclick=()=>{const m=$('vMenu');m.hidden=!m.hidden};
  $('vcTri').onchange=e=>som.liga('trilha',e.target.checked);$('vcAmb').onchange=e=>som.liga('ambiente',e.target.checked);
  const FIXO={intro:'Deixa eu acender a lanterna... Pronto. Agora sim. Chegue mais perto. Está vendo este mapa? Cada marca nele é um pedaço da nossa história. Logo vai clarear. Venha comigo. Vamos descer o rio.',fim:'E assim chegamos até aqui. O rio continua, e esta história também. Agora, ela segue com você.'};
  const narra=(nome,cb)=>{est.tFala=0;const m=MARCOS.find(x=>'m'+String(x.n).padStart(2,'0')===nome);const txt=FIXO[nome]||(m.n===5?m.evento+'.':m.texto);est.frases=txt.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g)||[txt];est.fTot=est.frases.reduce((a,f)=>a+f.length,0);est.fIni=m?(m.ano.length+m.titulo.length+4):0;if(est.comVoz){est.mudoCb=null;fala(nome,()=>{est.frases=[];cb()})}else{est.durMudo=Math.max(5,txt.length/15);est.mudoCb=()=>{est.frases=[];cb()}}};
  $('vcVoz').onchange=e=>{est.comVoz=e.target.checked;if(!est.comVoz){para();est.falando=-1;est.frases=[]}};$('vcTxt').onchange=e=>{est.comTxt=e.target.checked};
  const pausa=v=>{est.pausa=v;document.body.classList.toggle('pausado',v);$('vPausado').hidden=!v;$('vPausa').textContent=v?'▶':'❚❚';const au=estado.audio;if(v){if(au&&!au.paused){au.pause();est.voltaAudio=true}som.c&&som.c.suspend&&som.c.suspend()}else{if(est.voltaAudio&&au){au.play().catch(()=>{})}est.voltaAudio=false;som.c&&som.c.resume&&som.c.resume()}};
  $('vPausa').onclick=()=>pausa(!est.pausa);$('vContinua').onclick=()=>pausa(false);
  const leitor=()=>!painel.hidden||!$('zoom').hidden||!$('vMapa').hidden;
  // Salto com fade: pelo menu ou pelo mapa da mesa
  const salta=async i=>{if(est.saltando)return;est.saltando=true;est.fadeAlvo=0;para();est.falando=-1;est.frases=[];est.mudoCb=null;await dorme(620);est.segura=null;est.dir=1;est.virando=false;est.s=paradas[i]-52;est.lat=0;est.leme=0;est.v=Math.max(est.v,4);const o={};tr.em(est.s,o);est.yaw=Math.atan2(o.tx,o.tz);est.narrou.delete(i);est.atual=-1;est.fy=0;est.saltando=false;est.fadeAlvo=1;if(est.fase==='abertura'){est.t=DUR-.01}};
  $('vAnos').innerHTML=MARCOS.map((m,i)=>`<button data-i=${i}>${m.ano}</button>`).join('');$('vAnos').onclick=e=>{const i=e.target.dataset.i;if(i==null)return;$('vMenu').hidden=true;salta(+i)};
  $('vQual').onclick=e=>{const q=e.target.dataset.q;if(q==null)return;const u=new URL(location.href);u.searchParams.set('modo','rio');q===''?u.searchParams.delete('q'):u.searchParams.set('q',q);location.href=u};$('vBarcoOp').onclick=e=>{const b=e.target.dataset.b;if(!b)return;try{localStorage.setItem('luzeiro_barco',b)}catch(_){}const u=new URL(location.href);u.searchParams.set('modo','rio');u.searchParams.set('barco',b);location.href=u};$('vBarcoOp').querySelector(`[data-b=${BARCO_NOVO?'novo':'tripo'}]`).classList.add('on');$('vRever').onclick=()=>{const u=new URL(location.href);u.searchParams.set('modo','rio');location.href=u};
  // ---------- Mapa do capitão ----------
  const EST=[18,52.9,87.8,122.7,157.6,175,192.5,227.4,262.3,297.2,332.1,367,401.9];$('vMapaImg').src='spread.jpg';
  $('vMapaPontos').innerHTML=MARCOS.map((m,i)=>`<button data-i=${i} style="left:${(EST[i]/420*100).toFixed(2)}%;top:${(186/297*100).toFixed(2)}%" aria-label="${m.ano}">${m.n}</button>`).join('');
  $('vMapaPontos').onclick=e=>{const i=e.target.dataset.i;if(i==null)return;$('vMapa').hidden=true;salta(+i)};$('vMapaFecha').onclick=()=>{$('vMapa').hidden=true};
  {const area=$('vMapaArea'),ct=$('vMapaConteudo');let s=1,x=0,y=0,d0=0,s0=1;const p=new Map();const ap=()=>{ct.style.transform=`translate(${x}px,${y}px) scale(${s})`};
    area.onpointerdown=e=>{if(e.target.dataset&&e.target.dataset.i!=null)return;area.setPointerCapture(e.pointerId);p.set(e.pointerId,[e.clientX,e.clientY]);if(p.size===2){const[a,b]=[...p.values()];d0=Math.hypot(a[0]-b[0],a[1]-b[1]);s0=s}};
    area.onpointermove=e=>{if(!p.has(e.pointerId))return;const o=p.get(e.pointerId);p.set(e.pointerId,[e.clientX,e.clientY]);if(p.size===2){const[a,b]=[...p.values()];s=Math.min(5,Math.max(1,s0*Math.hypot(a[0]-b[0],a[1]-b[1])/d0))}else{x+=e.clientX-o[0];y+=e.clientY-o[1]}ap()};
    area.onpointerup=area.onpointercancel=e=>{p.delete(e.pointerId);if(s<=1){x=y=0;ap()}};area.onwheel=e=>{e.preventDefault();s=Math.min(5,Math.max(1,s*(1-Math.sign(e.deltaY)*.1)));if(s<=1){x=y=0}ap()};}
  // ---------- Câmera por fora ou no leme ----------
  const dica=(txt,ms=6500)=>{const d=$('vDica');d.textContent=txt;d.classList.add('on');clearTimeout(dica.t);dica.t=setTimeout(()=>d.classList.remove('on'),ms)};
  const trocaVista=()=>{if(est.fase!=='navega'||est.transDir)return;est.transDir=est.modo==='fora'?1:-1;if(est.modo==='fora'){const v=new THREE.Vector3().copy(cam.position);barco.updateMatrixWorld();barco.worldToLocal(v);pontosT[0].copy(v);est.trans=0}else{est.trans=1}est.fy=0;est.fp=-.06};
  $('vVista').onclick=trocaVista;
  // ---------- Toques na cena ----------
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();let px=0,py=0;const dedos=new Map();let pin=0;canvas.style.touchAction='none';
  const raioDe=e=>{ndc.set(e.clientX/W*2-1,-(e.clientY/H)*2+1);cam.updateMatrixWorld();ray.setFromCamera(ndc,cam)};
  const pecasCabine=[CAB.proxRoda,CAB.proxAlav];
  canvas.addEventListener('pointerdown',e=>{px=e.clientX;py=e.clientY;dedos.set(e.pointerId,[e.clientX,e.clientY]);canvas.setPointerCapture(e.pointerId);if(dedos.size===2){const[a,b]=[...dedos.values()];pin=Math.hypot(a[0]-b[0],a[1]-b[1])}
    if(est.modo==='cabine'&&!est.transDir&&dedos.size===1){raioDe(e);const h=ray.intersectObjects(pecasCabine,false)[0];if(h){const q=h.object.userData.alvo;if(q==='leme'){est.pegou='leme';est.lemeC3=true;const v=EIXO_LEME.clone().applyMatrix4(barco.matrixWorld).project(cam);est.lemeC=[(v.x*.5+.5)*W,(-v.y*.5+.5)*H];est.ang0=ptrAng(e,est.lemeC[0],est.lemeC[1]);$('vDica').classList.remove('on')}else{est.pegou='alavanca';est.alavY=e.clientY;est.alav0=est.alav}}}});
  canvas.addEventListener('pointermove',e=>{const u=dedos.get(e.pointerId);if(!u||est.fase!=='navega')return;
    if(est.pegou==='leme'&&est.lemeC3){movLeme(ptrAng(e,est.lemeC[0],est.lemeC[1]));return}
    if(est.pegou==='alavanca'){est.alav=Math.max(0,Math.min(1,est.alav0-(e.clientY-est.alavY)/(H*.3)));return}
    const dx=e.clientX-u[0],dy=e.clientY-u[1];dedos.set(e.pointerId,[e.clientX,e.clientY]);
    if(est.modo==='cabine'){if(dedos.size===1){est.fy=giro(est.fy+dx*.0042);est.fp=Math.max(-.95,Math.min(.62,est.fp+dy*.0034));est.cIdle=0}return}
    if(dedos.size===1){est.cy-=dx*.0052;est.cp=Math.max(-.32,Math.min(.75,est.cp+dy*.0034));est.cIdle=0}else if(dedos.size===2){const[a,b]=[...dedos.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pin)est.cz=Math.max(.55,Math.min(1.8,est.cz*pin/d));pin=d;est.cIdle=0}});
  const tira=e=>{dedos.delete(e.pointerId)};canvas.addEventListener('pointercancel',e=>{tira(e);if(est.pegou==='alavanca')est.pegou=null;soltaLeme()});
  canvas.addEventListener('wheel',e=>{e.preventDefault();est.cz=Math.max(.55,Math.min(1.8,est.cz*(1+Math.sign(e.deltaY)*.08)));est.cIdle=0},{passive:false});
  canvas.addEventListener('pointerup',e=>{tira(e);const eraLeme=est.pegou==='leme',eraAl=est.pegou==='alavanca';if(eraAl)est.pegou=null;if(eraLeme)soltaLeme();if(eraLeme||eraAl)return;if(Math.hypot(e.clientX-px,e.clientY-py)>10||est.fase!=='navega'||leitor())return;raioDe(e);
    const vis=alvos.filter(a=>a.visible);const h=ray.intersectObjects(vis,false)[0];if(h&&h.distance<170){const u=h.object.userData;som.um('toque');abre(u.i);return}
    if(est.modo==='cabine'){const m=ray.intersectObject(CAB.mapa,false)[0];if(m&&m.distance<3.2){som.um('toque');$('vMapa').hidden=false;return}}
    const d=ray.ray.direction;if(d.y<0){const k=-cam.position.y/d.y,x=cam.position.x+d.x*k,z=cam.position.z+d.z*k;uni.uToq.value.set(x,0,z,uni.uT.value)}});
  const teclas={};addEventListener('keydown',ev=>{teclas[ev.key]=true;if(ev.key===' '&&est.fase==='navega'){ev.preventDefault();$('vPausa').click()}if((ev.key==='c'||ev.key==='C')&&est.fase==='navega')trocaVista()});addEventListener('keyup',ev=>{teclas[ev.key]=false});
  $('vLer').onclick=()=>{if(est.atual>=0)abre(est.atual)};
  estado.aoPainel=()=>{};estado.aoTour=()=>{};
  const fim=()=>{est.fase='navega';$('vHud').classList.add('on');$('vLeme').classList.add('on');$('vLinha').classList.add('on');$('vVista').classList.add('on');$('vPular').classList.remove('on');som.fase('navega');dica('Puxe o leme para os lados · segure travado para dar a volta · puxe a linha do tempo para voltar ou avançar')};
  $('vPular').onclick=()=>{para();est.frases=[];est.mudoCb=null;est.t=DUR-.01;};
  tam();addEventListener('resize',tam);addEventListener('orientationchange',()=>setTimeout(tam,200));
  await dorme(250);const cg=$('vCarga');cg.style.opacity=0;setTimeout(()=>cg.remove(),1300);
  som.inicia();setTimeout(()=>{if(est.fase==='abertura'&&est.t<DUR-8)$('vPular').classList.add('on')},4200);
  const v3=new THREE.Vector3(),v4=new THREE.Vector3(),olho=new THREE.Vector3(),alvoC=new THREE.Vector3(),solTela=new THREE.Vector2(),dirB=new THREE.Vector3(),m2=new THREE.Matrix4();
  const ponto=(s,lat,o)=>{tr.em(s,o);o.px=o.x+o.nx*lat;o.pz=o.z+o.nz*lat;return o};
  const estadoHora=(h,ant)=>{const az=.45;uni.uSol.value.set(az*Math.cos(h*1.2),h,-Math.cos(h*.9)).normalize();const hr=sst(-.18,.55,h);uni.uHora.value=hr;
    const nev=new THREE.Color().setRGB(mix(.03,mix(1.05,.74,sst(.03,.5,h)),sst(-.2,-.02,h)),mix(.035,mix(.58,.8,sst(.03,.5,h)),sst(-.2,-.02,h)),mix(.07,mix(.36,.88,sst(.03,.5,h)),sst(-.2,-.02,h)));uni.uNevoa.value.copy(nev);uni.uDens.value=mix(.0034,.0017,sst(-.1,.4,h));cena.fog.color.copy(nev);cena.fog.density=uni.uDens.value*.92;
    sol.color.setRGB(1.0,mix(.55,.92,hr),mix(.3,.82,hr));sol.intensity=sst(-.1,.08,h)*mix(2.4,3.4,hr);hemi.color.setRGB(mix(.2,.72,hr),mix(.26,.8,hr),mix(.45,.95,hr));hemi.groundColor.setRGB(mix(.05,.26,hr),mix(.05,.22,hr),mix(.08,.14,hr));hemi.intensity=mix(.8,1.3,hr);
    unFloresta.uLuzSol.value.copy(sol.color).multiplyScalar(sol.intensity*.26);unFloresta.uLuzCeu.value.copy(hemi.color).multiplyScalar(hemi.intensity*.62);unFloresta.uLuzChao.value.copy(hemi.groundColor).multiplyScalar(hemi.intensity*.55);K.atualiza(hr);
    mNevoa.uniforms.uCor.value.copy(nev).lerp(new THREE.Color(1,1,1),.25);mNevoa.uniforms.uOp.value=mix(.15,.02,sst(-.02,.3,h));
    pos.uF.uAntigo.value=ant;pos.uF.uRaio.value=mix(0,.5,sst(-.1,.05,h))*(1-sst(.32,.7,h))};
  let atualizaFauna=null;animais(tr,cena,carrega,paradas,uni).then(f=>{atualizaFauna=f});
  let solH=-.15,ultimo=performance.now(),fps=60,tf=0,frames=0,saltaR=0;const ABERT=[0,.594,1.39,2.03,-.594,-1.39,-2.03];
  const passo=()=>{requestAnimationFrame(passo);const ag=performance.now();const real=(ag-ultimo)/1000;let dt=Math.min(.05,real);ultimo=ag;
    frames++;tf+=real;if(tf>1.5){fps=frames/tf;frames=0;tf=0;if(fps<26&&pr>.75){pr=Math.max(.75,pr-.12);tam()}else if(fps<20&&pr<=.75&&!est.semReflexo){est.semReflexo=true;uni.uTemReflexo.value=0}else if(fps>52&&pr<Math.min(devicePixelRatio,PRmax)){pr=Math.min(PRmax,pr+.05);tam()}}
    if(est.pausa)dt=0;if(est.mudoCb&&est.tFala>=est.durMudo){const c0=est.mudoCb;est.mudoCb=null;c0()}
    const lendo=leitor();if(lendo!==est.lendo){est.lendo=lendo;if(lendo)est.falando=-1;document.body.classList.toggle('lendo',lendo);som.leitura(lendo)}
    est.esc+=((lendo?.035:1)-est.esc)*Math.min(1,dt*2.6);const dj=dt*est.esc;uni.uT.value+=dj;const tJ=uni.uT.value;
    const ab=est.fase==='abertura';if(ab)est.t+=dt;
    // ---------- teclado e leme ----------
    if(!est.pegou||est.pegou==='alavanca'){const kd=(teclas.ArrowRight||teclas.d?1:0)-(teclas.ArrowLeft||teclas.a?1:0);if(kd&&est.fase==='navega'){est.leme=Math.max(-1,Math.min(1,est.leme+kd*dt*1.5));est.lemeTeclado=true;if(Math.abs(est.leme)>.97){est.lemeSeg+=dt;if(est.lemeSeg>1.2&&est.dir>0)iniciaVolta(Math.sign(est.leme)<0?1:-1,'tecla')}}else if(est.lemeTeclado){est.lemeTeclado=false;est.lemeSeg=0;if(est.segura==='tecla')soltaVolta()}
      if(est.modo==='cabine'){const ka=(teclas.ArrowUp||teclas.w?1:0)-(teclas.ArrowDown||teclas.s?1:0);if(ka)est.alav=Math.max(0,Math.min(1,est.alav+ka*dt*.5))}}
    if(est.pegou==='leme'){if(Math.abs(est.leme)>.97){if(!est.batente){est.batente=true;som.batente();navigator.vibrate&&navigator.vibrate(18)}est.lemeSeg+=dt;if(est.lemeSeg>1.2&&est.dir>0)iniciaVolta(est.leme>0?-1:1,'leme')}else{est.batente=false;est.lemeSeg=0}}
    // linha do tempo: puxar para trás e segurar dá a volta; soltar retoma o percurso
    if(est.tlPega&&est.tlPuxa<-.26&&est.dir>0&&!est.virando)iniciaVolta(est.lat>0?-1:1,'linha');if(est.tlPega&&est.segura==='linha'&&est.tlPuxa>-.12)soltaVolta();
    if(!est.tlPega){est.tlDx*=Math.exp(-dt*7)}
    // o leme se ajusta sozinho: gira durante a manobra e volta ao centro enquanto a pessoa segura ou solta
    if(est.virando)est.leme+=((est.giroLado>0?-.95:.95)-est.leme)*Math.min(1,dt*2.4);else if(est.dir<0||(!est.pegou&&!est.lemeTeclado))est.leme+=(0-est.leme)*Math.min(1,dt*(est.dir<0?2.2:1.15));
    // ---------- velocidade ----------
    const prog=Math.max(0,Math.min(1,(est.s-paradas[0])/(paradas[NP-1]-paradas[0])));
    ponto(est.s,est.lat,po);const tang=Math.atan2(po.tx,po.tz);
    let perto=-1,dmin=1e9;paradas.forEach((p,i)=>{const d=Math.abs(est.s-p);if(d<dmin){dmin=d;perto=i}});
    const cabine=est.modo==='cabine'&&!est.transDir,MAXV=18;let vAlvo=0,rpmAlvo=0;
    if(ab){vAlvo=est.t>28?3.2:0;rpmAlvo=est.t>26?.26:0}
    else if(est.dir<0){vAlvo=MAXV;rpmAlvo=.96}
    else if(cabine){vAlvo=est.alav<.04?0:est.alav*2*(est.alav<.5?9.5:0)+(est.alav>=.5?9.5+(est.alav-.5)*2*(MAXV-9.5):0);rpmAlvo=est.alav<.04?0:.12+est.alav*.88}
    else{const cruz=9.5;vAlvo=cruz;if(dmin<56)vAlvo=mix(2.4,cruz,sst(10,56,dmin));if(est.falando===perto&&est.s>paradas[perto]-4&&est.s<paradas[perto]+14)vAlvo=.62;if(est.s>paradas[NP-1]+60)vAlvo=0;rpmAlvo=vAlvo<.1?.04:.2+vAlvo/MAXV*.8}
    if(!ab&&est.dir>0&&est.tlPuxa>.2){vAlvo=Math.max(vAlvo,mix(11,MAXV+4,(est.tlPuxa-.2)/.8));rpmAlvo=mix(.7,1,(est.tlPuxa-.2)/.8)}
    if(est.dir<0&&est.s<70)vAlvo=0;if(est.s>L-90&&est.dir>0)vAlvo=0;
    // ---------- rumo: ziguezague com o leme, manobra em arco e retorno ao eixo ----------
    const yawRio=est.dir>0?tang:tang+Math.PI;let lAlvo=0;if(!ab&&!cabine&&est.dir>0&&dmin<70&&!est.pegou)lAlvo=PONTOS[perto].e*LARG*.34*(1-sst(40,70,dmin));
    const rel=-est.leme*.72*(est.dir>0?1:1);let centro=Math.abs(est.leme)<.08?(lAlvo-est.lat)*(est.dir>0?.022:-.022):0;if(Math.abs(est.lat)>LARG-10)centro=-Math.sign(est.lat)*(est.dir>0?.34:-.34);
    let dy=giro(yawRio+(est.virando?0:rel+centro)-est.yaw);
    if(est.virando){if(est.giroLado*dy<0&&Math.abs(dy)>.5)dy+=6.28319*est.giroLado;if(Math.abs(dy)<.3)est.virando=false}
    const taxa=(est.virando?Math.min(.62,Math.abs(dy)*.9+.14):Math.min(.46,Math.abs(dy)*.95+.012))*sst(.2,3,est.v+(est.virando?2:0));est.yaw+=Math.sign(dy)*Math.min(Math.abs(dy),taxa*dj);
    if(est.virando)vAlvo=Math.min(vAlvo,6.8);else{const cv=Math.abs(giro(est.yaw-yawRio));if(cv>.6)vAlvo=Math.min(vAlvo,7.5)}
    est.v+=(vAlvo-est.v)*Math.min(1,dj*(vAlvo>est.v?.3:(vAlvo<.1?.22:.55)));est.rpm+=(rpmAlvo-est.rpm)*Math.min(1,dt*1.1);
    let da=est.yaw-tang;const vx=Math.sin(da)*est.v,vs=Math.cos(da)*est.v;est.s=Math.max(30,Math.min(L-60,est.s+vs*dj));est.lat=Math.max(-(LARG-7),Math.min(LARG-7,est.lat+vx*dj));
    ponto(est.s,est.lat,po);const nn=sst(0,8,est.v),balanca=Math.sin(tJ*1.05)*.012+Math.sin(tJ*.63)*.009;barco.position.set(po.px,Math.sin(tJ*.9)*.05,po.pz);barco.rotation.set(-nn*.018+balanca,est.yaw,Math.sin(tJ*.71)*.016-dy*.1*nn,'YXZ');barco.updateMatrixWorld();
    uni.uBarco.value.copy(barco.position);uni.uRumo.value.set(Math.sin(est.yaw),Math.cos(est.yaw));uni.uVel.value=sst(0,10,est.v);
    // ---------- marcos, títulos e narração ----------
    if(est.fase==='navega'){
      const area=perto>=0&&est.s>paradas[perto]-82&&est.s<paradas[perto]+64;
      if(area&&perto!==est.atual){est.atual=perto;const m=MARCOS[perto];$('vAno').textContent=m.ano;$('vTit').textContent=m.titulo;$('vHud').classList.add('vis');$('vLer').classList.add('on');som.um('toque',.35)}
      if(!area&&est.atual>=0){est.atual=-1;$('vHud').classList.remove('vis');$('vLer').classList.remove('on')}
      if(est.dir>0&&dmin<60&&!est.narrou.has(perto)&&!lendo&&!est.saltando){est.narrou.add(perto);est.falando=perto;narra('m'+String(MARCOS[perto].n).padStart(2,'0'),()=>{if(est.falando===perto)est.falando=-1;if(perto===NP-1&&!est.fimdito){est.fimdito=true;narra('fim',()=>{})}})}
      // voltando no rio, as histórias já passadas podem ser ouvidas de novo
      if(est.dir<0)for(const i of [...est.narrou])if(paradas[i]>est.s+70)est.narrou.delete(i);
    }
    // ---------- luz e tempo ----------
    if(ab)solH=mix(-.16,.05,sst(16,DUR,est.t));else solH+=(mix(.06,.72,sst(0,.92,prog))-solH)*Math.min(1,dj*.25);estadoHora(solH,mix(.3,0,sst(.0,.75,prog))*(ab?sst(30,DUR,est.t):1));
    const tt=ab?est.t:9;const acesa=sst(2.0,2.8,tt),fl=.86+Math.sin(tJ*11)*.05+Math.sin(tJ*23.3)*.04+Math.sin(tJ*5.1)*.05;lant.userData.atualiza(tJ,acesa,fl);
    if(ab&&est.t>=2&&!est.fosforo){est.fosforo=true;som.um('fosforo');setTimeout(()=>som.um('chama'),420);setTimeout(()=>{if(est.t<DUR-6)narra('intro',()=>{})},1600)}
    est.fade+=(est.fadeAlvo-est.fade)*Math.min(1,real*5.5);pos.uF.uFade.value=(ab?sst(0.05,1.2,est.t)*(acesa*.97+.03):1)*est.fade;
    // ---------- câmera ----------
    let pan=0;if(est.fase==='navega'){const q=sst(82,24,dmin);pan=q*PONTOS[perto].e*(W/H<1?1.3:1)*(1-.25*sst(0,30,est.s-paradas[perto]))*(est.dir>0?1:-1)+(1-q)*Math.sin(est.s*.0105)*.42}
    est.panA+=(pan-est.panA)*Math.min(1,dt*.62);
    est.cIdle+=dt;if(est.cIdle>4.5&&est.modo==='fora'){const k=Math.min(1,dt*.55);est.cy+=giro(-est.cy)*k*.6;est.cp*=1-k*.6;est.cz+=(1-est.cz)*k*.5}
    const dist=(W/H<1?30:24)*(1-.1*Math.abs(est.panA))*est.cz,alto=(W/H<1?11.5:8.5)*est.cz+est.cp*dist,yw=est.yaw+est.panA+est.cy;
    olho.set(barco.position.x-Math.sin(yw)*dist,Math.max(1.5,alto+Math.sin(tJ*.4)*.15),barco.position.z-Math.cos(yw)*dist);
    alvoC.set(barco.position.x+Math.sin(yw)*20,W/H<1?1.2:2.2,barco.position.z+Math.cos(yw)*20);
    fovBase=W/H<1?62:46;let fov=fovBase,perto2=.9,interno=false;
    if(ab){const e=noTrajeto(est.t);cp.getPoint(e,v3);cl.getPoint(e,v4);v3.applyMatrix4(barco.matrixWorld);v4.applyMatrix4(barco.matrixWorld);const b=sst(DUR-5,DUR,est.t);cam.position.copy(v3).lerp(olho,b);v4.lerp(alvoC,b);cam.lookAt(v4);interno=est.t<T_DENTRO;if(est.t<36)perto2=.07;if(est.t>=DUR)fim()}
    else if(est.transDir){
      // da popa ao leme, ou de volta: a câmera atravessa as portas olhando sempre para a frente
      est.trans=Math.min(1,Math.max(0,est.trans+est.transDir*dt/4.4));if(est.transDir<0){v3.copy(olho);barco.worldToLocal(v3);pontosT[0].copy(v3)}
      const e=est.trans*est.trans*(3-2*est.trans);curvaT.getPoint(e,v3);const zb=v3.z;v4.set(v3.x,v3.y-.06*e,v3.z+12);v4.applyMatrix4(barco.matrixWorld);dirB.copy(alvoC).lerp(v4,sst(0,.3,e));v3.applyMatrix4(barco.matrixWorld);cam.position.copy(v3);cam.lookAt(dirB);interno=zb>CABINE.ZA+.12;perto2=.07;fov=mix(fovBase,W/H<1?74:60,sst(.55,1,e));
      if(est.trans>=1&&est.transDir>0){est.transDir=0;est.modo='cabine';document.body.classList.add('cabine');dica('Vire o leme para os lados · empurre a alavanca para acelerar, puxe toda para trás para desligar · arraste para olhar em volta · toque no mapa da mesa')}
      if(est.trans<=0&&est.transDir<0){est.transDir=0;est.modo='fora';document.body.classList.remove('cabine')}
      if(est.transDir>0&&e>.4)document.body.classList.add('cabine');if(est.transDir<0&&e<.5)document.body.classList.remove('cabine')
    }
    else if(est.modo==='cabine'){
      // olhar em volta com o dedo; perto de um marco, a câmera procura o lugar sozinha até a pessoa tomar o controle
      if(est.cIdle>2.6&&est.atual>=0){const ce=cenarios[est.atual].userData.centro,a=giro(Math.atan2(ce.x-barco.position.x,ce.z-barco.position.z)-est.yaw);est.fy+=giro(a-est.fy)*Math.min(1,dt*.55);est.fp+=(-.02-est.fp)*Math.min(1,dt*.8)}else if(est.cIdle>5&&est.atual<0){est.fy+=giro(0-est.fy)*Math.min(1,dt*.5);est.fp+=(-.06-est.fp)*Math.min(1,dt*.6)}
      dirB.set(Math.sin(est.fy)*Math.cos(est.fp),Math.sin(est.fp),Math.cos(est.fy)*Math.cos(est.fp));v3.copy(CABINE.olho).applyMatrix4(barco.matrixWorld);v4.copy(CABINE.olho).add(dirB).applyMatrix4(barco.matrixWorld);cam.position.copy(v3);cam.lookAt(v4);interno=true;perto2=.07;fov=W/H<1?74:60
    }
    else{cam.position.lerp(olho,Math.min(1,dt*(est.cIdle<1?5:1.4)));cam.lookAt(alvoC)}
    if(est.camFixa){v3.set(...est.camFixa.p).applyMatrix4(barco.matrixWorld);v4.set(...est.camFixa.a).applyMatrix4(barco.matrixWorld);cam.position.copy(v3);cam.lookAt(v4);if(est.camFixa.fov)fov=est.camFixa.fov;if(est.camFixa.perto)perto2=est.camFixa.perto;interno=!!est.camFixa.dentro}
    if(cam.fov!==fov||cam.near!==perto2){cam.fov=fov;cam.near=perto2;cam.updateProjectionMatrix()}
    // Por fora vale o modelo do Tripo; por dentro, o barco por código, com vãos e cabine reais
    if(barcoFora){barcoFora.visible=!interno;extCodigo.visible=interno;if(paredeInt)paredeInt.visible=interno}
    luzL.intensity=(ab?acesa*(1-.75*sst(26,44,est.t))*1.15:interno?.82:.5)*fl;if(T>=2){luzL.shadow.autoUpdate=interno}
    // barco sempre embaixo; com leitura aberta, a cena sobe ou recua para a área livre
    const pv=lendo&&!painel.hidden;est.ox=pv&&W>H?-Math.min(190,W*.2):0;est.oy=(ab&&est.t<DUR-4)||interno?0:(pv&&W<=H?H*.26:(W<=H?H*.13:(H<520?H*.12:H*.05)));est.oxA+=(est.ox-est.oxA)*Math.min(1,dt*2.6);est.oyA+=(est.oy-est.oyA)*Math.min(1,dt*2.6);
    cam.setViewOffset(W,H,-est.oxA,est.oyA,W,H);cam.updateMatrixWorld();
    // legenda
    {const el=$('vLeg'),au=estado.audio;let txt='';if(est.comTxt&&est.frases.length&&!lendo){const pr1=(est.comVoz&&au&&au.duration)?au.currentTime/au.duration:Math.min(.999,est.tFala/est.durMudo);const tot=est.fTot+est.fIni;let pos2=pr1*tot-est.fIni;txt=est.frases[0];if(pos2>0){let ac=0;for(const f of est.frases){ac+=f.length;txt=f;if(pos2<=ac)break}}}if(txt!==est.txtV){est.txtV=txt;el.textContent=txt;el.classList.toggle('on',!!txt)}}
    // janelas digitais: a da cabine contorna o barco até a abertura para onde a pessoa olha
    {est.tFala+=dt;const au=estado.audio,prN=est.falando>=0?((est.comVoz&&au&&au.duration)?au.currentTime/au.duration:Math.min(.999,est.tFala/est.durMudo)):-1;
      let melhor=est.janAlvo,dm=Math.abs(giro(est.janAlvo-est.fy))-.16;for(const a of ABERT){const d=Math.abs(giro(a-est.fy));if(d<dm){dm=d;melhor=a}}est.janAlvo=melhor;est.janAz+=giro(est.janAlvo-est.janAz)*Math.min(1,dt*1.6);
      J.atualiza({s:est.s,ativa:(!lendo&&est.fase==='navega'&&est.atual>=0)?est.atual:-1,cam,W,H,dt,t:tJ,modo:interno?'cabine':'fora',pr:prN,az:est.janAz,barco,olho:CABINE.olho})}
    // leme e alavanca acompanham o estado, nas duas versões
    lemeRodar.setAttribute('transform',`rotate(${(est.leme*LIM).toFixed(2)} 500 500)`);CAB.roda.rotation.z=est.leme*LIM*.01745;CAB.alav.rotation.x=(est.alav-.5)*1.42;
    if(CAB.grupo.userData.agulha)CAB.grupo.userData.agulha.rotation.y=-giro(est.yaw)*.6;
    $('vAlavPega').style.bottom=`calc(${(est.alav*100).toFixed(1)}% - ${(est.alav*40-20).toFixed(1)}px)`;$('vAlavTxt').textContent=est.alav<.04?'DESLIGADO':'MOTOR';
    // linha do tempo: a fita corre sob a agulha e pode ser puxada, como uma corda elástica
    {const p=PAS(),qi=pIdx(est.s);fita.style.transform=`translateX(${(-qi*p+est.tlDx*.72).toFixed(1)}px)`;const ak=Math.max(0,Math.min(NP-1,Math.round(qi)));if(ak!==anoAceso){if(anoAceso>=0)$('vM'+anoAceso).classList.remove('on');$('vM'+ak).classList.add('on');anoAceso=ak}
      const rumo=est.dir<0?'◀◀ voltando':(est.tlPuxa>.2?'avançando ▶▶':'');if(rumo!==est.rumoV){est.rumoV=rumo;$('vRumoTxt').textContent=rumo}}
    objCeu.position.copy(cam.position);apoio.position.copy(cam.position);apoio.target.position.copy(barco.position);apoio.intensity=interno?.42:mix(.7,1,uni.uHora.value);
    if(T>=2){sol.position.copy(barco.position).addScaledVector(uni.uSol.value,170);sol.target.position.copy(barco.position);sol.castShadow=solH>-.02}
    for(const b of blocos){b.o.visible=Math.hypot(b.x-cam.position.x,b.z-cam.position.z)<(T?560:380)}
    cenarios.forEach((g,i)=>{g.visible=Math.abs(g.userData.si-est.s)<(T?430:300)});
    // reflexo plano da água
    if(!est.semReflexo&&(T>=2||(saltaR=(saltaR+1)%(T?2:3))===0)){if(T===0)blocos.forEach(b=>{b.o.visible=false});const cp2=cam.position;camR.copy(cam,false);camR.clearViewOffset();camR.position.set(cp2.x,-cp2.y,cp2.z);v3.set(0,0,-1).applyQuaternion(cam.quaternion).add(cp2);camR.up.set(0,-1,0);camR.lookAt(v3.x,-v3.y,v3.z);camR.updateMatrixWorld();camR.updateProjectionMatrix();
      objAgua.visible=false;objCeu.visible=false;J.grupo.visible=false;const co=r.getClearColor(new THREE.Color()),ca=r.getClearAlpha();r.setClearColor(0,0);r.clippingPlanes=planoAgua;const se=r.shadowMap.autoUpdate;r.shadowMap.autoUpdate=false;r.setRenderTarget(rtR);r.clear();r.render(cena,camR);r.setRenderTarget(null);r.shadowMap.autoUpdate=se;r.clippingPlanes=[];objAgua.visible=true;objCeu.visible=true;J.grupo.visible=true;r.setClearColor(co,ca);
      uni.uTM.value.copy(bias).multiply(camR.projectionMatrix).multiply(camR.matrixWorldInverse)}
    pos.uF.uT.value=ag*.001;pos.uF.uTarja.value=ab?mix(.1,0,sst(36,50,est.t))*(W>H?1:.5):0;v3.copy(uni.uSol.value).multiplyScalar(500).add(cam.position).project(cam);solTela.set(v3.x*.5+.5,v3.y*.5+.5);pos.render(cena,cam,v3.z<1?solTela:null);
    rastro(dj,barco.position,est.yaw,est.v);if(atualizaFauna)atualizaFauna(dj,tJ,barco,est.yaw,p=>uni.uToq.value.set(p.x,0,p.z,tJ));som.atualiza({v:est.v,hora:uni.uHora.value,falando:!!(estado.audio&&!estado.audio.paused),rpm:est.rpm,dentro:interno});
  };
  window.__viagem={est,cam,uni,paradas,fim,barco,r,alvos,som,pos,cab:CAB.grupo,lant,J,CAB,salta,trocaVista,PONTOS,cenarios,get fps(){return fps},get barcoFora(){return barcoFora},T,tr,L};
  passo();
}
