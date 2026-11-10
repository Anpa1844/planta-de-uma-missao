// A viagem, versão 2. Tudo nasce aqui, em código, no aparelho de quem assiste: só o barco e a lanterna vêm de arquivos.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {assa,GLSL_RUIDO,sst,mix,giro,clamp,dorme,proximoQuadro} from './util.js';
import {U,integra} from './nucleo.js';
import {Rio} from './rio.js';
import {ROT,MARCOS} from './historia.js';
import {Clima} from './clima.js';
import {Ceu} from './ceu.js';
import {Pos} from './pos.js';
import {Agua} from './agua.js';
import {criaTerreno,criaMuralha} from './terreno.js';
import {Floresta} from './floresta.js';
import {Topo} from './topo.js';
import {criaObras} from './obras.js';
import {Navega} from './navega.js';
import {Diretor} from './diretor.js';
import {Filme,FIXO} from './filme.js';
import {Janelas} from './janelas.js';
import {Som} from './som.js';
import {Fauna,ESPECIES_INFO} from './fauna.js';
import {Efeitos,criaFlutuantes,criaLuzesBarco,criaLuzesFinal,criaOlhos} from './efeitos.js';
import {criaCabine,CABINE,EIXO_LEME} from './cabine.js';
import {montaInterface,$} from './interface.js';

const Q=new URLSearchParams(location.search);const TESTE=Q.has('teste');
function nivel(r){if(Q.get('q'))return +Q.get('q');const g=r.getContext(),e=g.getExtension('WEBGL_debug_renderer_info'),n=e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'',mob=/Android|iPhone|iPad/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Mac/.test(navigator.platform));
  if(/SwiftShader|llvmpipe|Software|Microsoft Basic/i.test(n))return 0;if(/Adreno \(TM\) [2-5]\d\d|Mali-(G[1-5]\d|T|4)|PowerVR|Vivante|VideoCore/i.test(n))return 0;return mob?1:2}
// A abertura em coordenadas do barco: lanterna, mapa visto do alto, porta da frente, proa, costado com o nome, popa
const TEC=[[0,[-.28,2.1,3.72],[-1.02,2.03,3.34]],[6,[-.3,2.14,3.66],[-1.02,2.04,3.32]],[11,[-.5,2.5,3.5],[-1.2,1.86,3.1]],[16,[-.98,2.8,3.3],[-1.44,1.8,3.3]],[21,[-.98,2.8,2.58],[-1.44,1.8,2.5]],[25,[-.8,2.76,2.9],[-1.42,1.8,2.9]],[28,[-.3,2.5,3.36],[0,2.4,6]],[30,[0,2.4,4.3],[0,2.5,9]],[32,[.8,2.9,6.6],[0,2.6,14]],[34,[1.4,3.2,9.5],[0,2.6,18]],[37,[2,3.8,17],[1,3,24]],[39,[3.4,3.7,18.6],[1.5,2.6,8]],[43,[5,3.6,18],[0,2.4,2]],[48,[13,3.2,12.5],[0,2.2,3]],[53,[15.5,2.8,5.8],[1.5,1.9,4.4]],[58,[17,3,-1],[0,2.4,0]],[62,[14,5,-13],[0,2.6,-1]],[66,[5,7,-21],[0,3,2]],[68,[0,8,-23],[0,2.4,20]]];
const DUR=68;
const cpA=new THREE.CatmullRomCurve3(TEC.map(k=>new THREE.Vector3(...k[1])),false,'centripetal'),clA=new THREE.CatmullRomCurve3(TEC.map(k=>new THREE.Vector3(...k[2])),false,'centripetal');
const parmA=t=>{let i=0;while(i<TEC.length-2&&t>TEC[i+1][0])i++;const k=clamp((t-TEC[i][0])/(TEC[i+1][0]-TEC[i][0]));return (i+k)/(TEC.length-1)};
const parA=t=>(parmA(t-1)+parmA(t-.5)*2+parmA(t)*2+parmA(t+.5)*2+parmA(t+1))/8;
const CAM_NOME={filme:'FILME',popa:'VOCÊ PILOTA',leme:'NO LEME'};const SEQ=['filme','popa','leme'];
const EST_MAPA=[18,52.9,87.8,122.7,157.6,175,192.5,227.4,262.3,297.2,332.1,367,401.9];

async function inicia(){
  montaInterface();const barraP=v=>{const b=$('rBarra').firstChild;if(b)b.style.width=Math.round(v*100)+'%'};
  const canvas=document.getElementById('c');
  const r=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,depth:false,stencil:false,powerPreference:'high-performance',preserveDrawingBuffer:TESTE});
  r.outputColorSpace=THREE.LinearSRGBColorSpace;r.toneMapping=THREE.NoToneMapping;r.autoClear=true;r.setPixelRatio(1);r.setClearColor(0x000000,1);
  const gl=r.getContext();const T=nivel(r);const hdrOk=!!(gl.getExtension('EXT_color_buffer_float')||gl.getExtension('EXT_color_buffer_half_float'));const tipoHDR=hdrOk?THREE.HalfFloatType:THREE.UnsignedByteType;
  let amostras=0;try{const s=gl.getInternalformatParameter(gl.RENDERBUFFER,gl.RGBA16F,gl.SAMPLES);if(hdrOk&&s&&s.length)amostras=Math.min(s[0],[0,4,4][T])}catch(e){}
  await proximoQuadro();
  U.tRuido.value=assa(r,`varying vec2 vUv;${GLSL_RUIDO}void main(){vec2 q=vUv;float a=fbmP(q*8.,8.,6);float b=fbmP(q*16.+3.,16.,6);float c=1.-abs(fbmP(q*32.+9.,32.,4)*2.-1.);c=pow(c,1.6);float d=vn(q*256.,256.)*.6+vn(q*128.,128.)*.4;gl_FragColor=vec4(a,b,c,d);}`,[256,512,512][T],[256,512,512][T],{aniso:4});
  const tNormal=assa(r,`varying vec2 vUv;${GLSL_RUIDO}
    float al(vec2 p){return fbmP(p*6.,6.,5)*.7+fbmP(p*24.+3.,24.,3)*.3;}void main(){float e=1./512.;float h=al(vUv),hx=al(vUv+vec2(e,0.)),hy=al(vUv+vec2(0.,e));vec2 g=vec2(h-hx,h-hy)*38.;gl_FragColor=vec4(g*.5+.5,h,1.);}`,512,512,{aniso:4});
  const tCopas=assa(r,`varying vec2 vUv;${GLSL_RUIDO}
    float al(vec2 p){vec3 v=vorC(p*14.,14.);float c=max(0.,1.-v.x*1.45);return sqrt(c)+fbmP(p*48.,48.,3)*.3;}void main(){float e=1./512.;float h=al(vUv),hx=al(vUv+vec2(e,0.)),hy=al(vUv+vec2(0.,e));vec2 g=vec2(h-hx,h-hy)*12.;vec3 v=vorC(vUv*14.,14.);gl_FragColor=vec4(clamp(g*.5+.5,0.,1.),clamp(1.-v.x*1.15,0.,1.),v.y);}`,512,512,{aniso:4});
  barraP(.06);await proximoQuadro();
  // ---------- mundo ----------
  const rio=new Rio(ROT);const clima=new Clima(rio,ROT.humores);const cena=new THREE.Scene();const cam=new THREE.PerspectiveCamera(60,1,.4,7000);
  const obras=criaObras(r,T,rio,ROT.paradas,cena);
  const ceu=new Ceu(r,T);cena.add(ceu.domo);
  const terreno=criaTerreno(rio,T);cena.add(terreno);const muralha=criaMuralha(rio,T,tCopas);cena.add(muralha);barraP(.14);await proximoQuadro();
  const agua=new Agua(r,T,tNormal,tipoHDR);cena.add(agua.mesh);
  const fl=new Floresta(r,T,rio,{amostras});await fl.constroi(v=>barraP(.14+v*.4));cena.add(fl.grupo);barraP(.56);await proximoQuadro();
  const topo=new Topo(r,T,terreno,fl);const pos=new Pos(r,T,amostras,tipoHDR);
  for(let i=0;i<ROT.paradas.length;i++){obras.constroi(i);barraP(.56+.3*i/ROT.paradas.length);if(i%2)await proximoQuadro()}
  const ef=new Efeitos(T,cena,rio);cena.add(criaFlutuantes(rio,T,fl.tFolhas,ROT));const luzFim=criaLuzesFinal(rio);cena.add(luzFim);const olhos=criaOlhos(rio);cena.add(olhos);
  // luz dos materiais padrão
  const hemi=new THREE.HemisphereLight(0xffffff,0x332211,1);const sol=new THREE.DirectionalLight(0xffffff,1);cena.add(hemi,sol,sol.target);
  if(T>=1){r.shadowMap.enabled=true;r.shadowMap.type=THREE.BasicShadowMap;sol.castShadow=true;sol.shadow.mapSize.set(T>=2?2048:1024,T>=2?2048:1024);const c=sol.shadow.camera;c.left=c.bottom=-52;c.right=c.top=52;c.near=1;c.far=340;c.updateProjectionMatrix();sol.shadow.bias=-.0004;sol.shadow.normalBias=.02;U.uSombraLiga.value=1}
  // ---------- barco: o arquivo do Tripo, sem nenhuma alteração na malha ou na pintura ----------
  const barco=new THREE.Group();cena.add(barco);const uDentro={value:0},uLuzBarco={value:0},uCaixaZ={value:-7.1},uBarcoInv={value:new THREE.Matrix4()};
  const gltf=new GLTFLoader();const nomeB=Q.get('barco')||['c','b','a'][T];
  const carregaBarco=gltf.loadAsync('barco/luzeiro_'+nomeB+'.glb').then(g=>{const s=g.scene;s.position.y=-.94;s.traverse(o=>{if(o.isMesh){o.castShadow=T>=1;o.receiveShadow=T>=1;const m=o.material;m.metalness=0;m.metalnessMap=null;m.roughnessMap=null;m.roughness=.68;m.envMap=obras.K.env;m.envMapIntensity=.55;m.userData.env=.55;obras.K.comEnv.push(m);integra(m,{copa:true,chave:'barco',extra:sh=>{sh.uniforms.uDentro=uDentro;sh.uniforms.uLuzBarco=uLuzBarco;sh.uniforms.uCaixaZ=uCaixaZ;sh.uniforms.uBarcoInv=uBarcoInv;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vL;uniform mat4 uBarcoInv;').replace('#include <begin_vertex>','#include <begin_vertex>\nvL=(uBarcoInv*modelMatrix*vec4(transformed,1.)).xyz;');sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vL;uniform float uDentro,uLuzBarco,uCaixaZ;').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(uDentro>.5){vec3 q=vL;if(abs(q.x)<2.45&&q.y>.72&&q.y<3.95&&q.z>uCaixaZ&&q.z<4.92)discard;}').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*vec3(1.,.74,.46)*uLuzBarco;')}})}});barco.add(s);window.__rio.barcoM=s}).catch(e=>console.warn('sem barco',e));
  const luzesB=criaLuzesBarco();barco.add(luzesB);
  // cabine, lanterna e mapa
  const texM=new THREE.TextureLoader().load('../spread.jpg');texM.colorSpace=THREE.SRGBColorSpace;texM.anisotropy=8;const cacheL={};const carrega=n=>cacheL[n]||(cacheL[n]=gltf.loadAsync('barco/'+n+'.glb').then(g=>g.scene).catch(()=>null));
  const CAB=criaCabine({T,renderer:r,texMapa:texM,carrega});barco.add(CAB.grupo);CAB.grupo.visible=false;const luzL=CAB.luz;luzL.intensity=0;
  // ---------- estado ----------
  const nav=new Navega(rio,ROT.paradas);const dir=new Diretor(rio,cam);const som=new Som();const fauna=new Fauna({T,cena,rio,agua,ef,som,obras});
  const est={fase:'titulo',modo:'filme',t:0,tA:0,pausa:false,sClima:null,camFixa:null,ceuForca:true,forcaFl:true,hud:0,comTxt:true,lendo:false,esc:1,fps:60,cy:0,cp:0,cz:1,cIdle:9,fy:0,fp:-.06,pan:0,trans:0,kFinal:0,dentro:0,fade:0,fadeA:1,qual:0,alav:.5,qTaxa:0};
  let W=1,H=1,PRmax=[1.15,1.5,2][T],pr=Math.min(devicePixelRatio,PRmax),escala=Q.get('escala')?+Q.get('escala'):1;
  const tam=()=>{W=innerWidth;H=innerHeight;const pw=Math.round(W*pr),ph=Math.round(H*pr);r.setSize(pw,ph,false);pos.tam(pw,ph,escala);cam.aspect=W/H;cam.updateProjectionMatrix();est.forcaFl=true};addEventListener('resize',tam);addEventListener('orientationchange',()=>setTimeout(tam,200));tam();
  // ---------- interface ----------
  const J=new Janelas(MARCOS,'../fotos/',i=>abreLeitura(i));
  const dica=(txt,ms=6500)=>{const d=$('rDica');d.textContent=txt;d.classList.add('on');clearTimeout(dica.t);dica.t=setTimeout(()=>d.classList.remove('on'),ms)};
  const ui={anoNovo(i){},titulo(i){const a=$('rAno');a.children[0].textContent=MARCOS[i].ano;a.children[1].textContent=MARCOS[i].titulo;a.classList.add('vis');clearTimeout(a._t);a._t=setTimeout(()=>a.classList.remove('vis'),5200)},legFauna(inf){const e=$('rFauna');if(inf){e.children[0].textContent=inf.n;e.children[1].textContent=inf.c;e.children[2].textContent=inf.f;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),9000)}else e.classList.remove('on')},lendo:()=>!$('rLer').hidden||!$('rZoom').hidden||!$('rMapa').hidden||!$('rDiario').hidden,
    fimComeca(){est.sFim0=nav.s;J.esconde();$('rAno').classList.remove('vis');if(est.modo==='filme')dir.pede('final',{dur:48},3.5)},aoFim(){setTimeout(()=>{if(!filme.final)return;J.esconde();$('rFim').classList.add('on');document.body.classList.remove('navega','hud')},4200)}};
  const filme=new Filme({nav,dir,paradas:ROT.paradas,som,J,ui,obras,rio,fauna});
  // linha do tempo
  const fita=$('rFita'),NP=MARCOS.length,paradas=ROT.paradas;const PAS=()=>Math.max(62,Math.min(108,W*.1));fita.innerHTML=MARCOS.map((m,i)=>`<span class=ano id=rM${i}>${m.ano}</span>`).join('');const colocaFita=()=>{const p=PAS();MARCOS.forEach((m,i)=>{$('rM'+i).style.left=(i*p)+'px'})};addEventListener('resize',colocaFita);colocaFita();
  const pIdx=q=>{if(q<=paradas[0].s)return (q-paradas[0].s)/240;for(let i=0;i<NP-1;i++)if(q<paradas[i+1].s)return i+(q-paradas[i].s)/(paradas[i+1].s-paradas[i].s);return NP-1+(q-paradas[NP-1].s)/240};
  const linha=$('rLinha');let tlX0=0,tlDx=0,anoAceso=-1;linha.addEventListener('pointerdown',e=>{if(est.fase!=='navega')return;linha.setPointerCapture(e.pointerId);nav.tlPega=true;tlX0=e.clientX;linha.classList.add('puxando');mostraHUD()});linha.addEventListener('pointermove',e=>{if(!nav.tlPega)return;const dx=e.clientX-tlX0;tlDx=Math.sign(dx)*Math.min(Math.abs(dx),150);nav.tlPuxa=clamp(-dx/95,-1,1)});const soltaL=()=>{if(!nav.tlPega)return;nav.tlPega=false;nav.tlPuxa=0;linha.classList.remove('puxando')};linha.addEventListener('pointerup',soltaL);linha.addEventListener('pointercancel',soltaL);
  const mostraHUD=()=>{document.body.classList.add('hud');est.hud=5};
  // leitura e fotos
  const abreLeitura=i=>{const m=MARCOS[i],e=$('rLer');e.querySelector('.ano').textContent=m.ano;e.querySelector('h2').textContent=m.titulo;e.querySelector('.ev').textContent=m.evento;e.querySelector('.tx').textContent=m.texto;const g=e.querySelector('.gal');g.replaceChildren(...m.fotos.map(n=>{const im=new Image();im.src='../fotos/'+n;im.alt=m.titulo;im.onclick=()=>abreZoom('../fotos/'+n);return im}));e.hidden=false;e.scrollTop=0;som.pausaVoz(true)};$('rLer').querySelector('.fecha').onclick=()=>{$('rLer').hidden=true;som.retomaVoz()};
  const abreZoom=src=>{const z=$('rZoom'),im=z.querySelector('img');im.src=src;z.hidden=false;let s=1,x=0,y=0,d0=0,s0=1;const p=new Map();const ap=()=>im.style.transform=`translate(${x}px,${y}px) scale(${s})`;ap();z.onpointerdown=e=>{if(e.target.tagName==='BUTTON')return;z.setPointerCapture(e.pointerId);p.set(e.pointerId,[e.clientX,e.clientY]);if(p.size===2){const[a,b]=[...p.values()];d0=Math.hypot(a[0]-b[0],a[1]-b[1]);s0=s}};z.onpointermove=e=>{if(!p.has(e.pointerId))return;const o=p.get(e.pointerId);p.set(e.pointerId,[e.clientX,e.clientY]);if(p.size===2){const[a,b]=[...p.values()];s=clamp(s0*Math.hypot(a[0]-b[0],a[1]-b[1])/d0,1,6)}else{x+=e.clientX-o[0];y+=e.clientY-o[1]}ap()};z.onpointerup=z.onpointercancel=e=>{p.delete(e.pointerId);if(s<=1){x=y=0;ap()}};z.ondblclick=()=>{s=s>1?1:2.5;if(s===1)x=y=0;ap()}};$('rZoom').querySelector('button').onclick=()=>{$('rZoom').hidden=true};
  // menu
  $('rBtMenu').onclick=()=>{const m=$('rMenu');m.hidden=!m.hidden;mostraHUD();est.hud=m.hidden?5:600};
  $('rAnos').innerHTML=MARCOS.map((m,i)=>`<button data-i=${i}>${m.ano}</button>`).join('');$('rAnos').onclick=e=>{const i=e.target.dataset.i;if(i==null)return;$('rMenu').hidden=true;salta(+i)};
  $('rQual').onclick=e=>{const q=e.target.dataset.q;if(q==null)return;const u=new URL(location.href);q===''?u.searchParams.delete('q'):u.searchParams.set('q',q);location.href=u};$('rQual').querySelector(`[data-q="${Q.get('q')||''}"]`).classList.add('on');
  $('rTxt').onchange=e=>{est.comTxt=e.target.checked};for(const [id,k] of [['rVoz','voz'],['rAmb','amb'],['rBar','bar'],['rMus','mus']])$(id).oninput=e=>{som.vol[k]=+e.target.value};$('rBtRever').onclick=$('rFimRever').onclick=()=>location.reload();
  const pausa=v=>{est.pausa=v;$('rPausa').hidden=!v;som.pausa(v)};$('rBtPausa').onclick=()=>pausa(!est.pausa);$('rContinua').onclick=()=>pausa(false);
  // salto com fade, pelo menu ou pelo mapa
  const salta=async i=>{if(est.saltando)return;est.saltando=true;est.fadeA=0;som.paraVoz();filme.falando=-1;filme.frases=[];filme.falaFim=false;J.esconde();ui.legFauna(null);filme.cenaFauna=null;await dorme(720);if(est.fase==='abertura')fimAbertura();nav.dir=1;nav.virando=false;nav.segura=null;nav.s=paradas[i].s-96;nav.lat=0;nav.leme=0;nav.v=Math.max(nav.v,7);const o=rio.em(nav.s);nav.yaw=o.h;filme.narrou.delete(i);filme.atual=-1;filme.fila=[];filme.final=false;filme.fimDito=false;J.bloqueada=false;est.kFinal=0;est.sClima=null;$('rFim').classList.remove('on');document.body.classList.add('navega');fauna.reinicia(nav.s);if(est.modo==='filme'){dir.pede('popa',{e:i%2?1:-1},0);filme.tPlano=0;filme.durPlano=8}est.ceuForca=true;est.forcaFl=true;est.saltando=false;som.pre('m'+String(MARCOS[i].n).padStart(2,'0'));est.fadeA=1};
  // mapa do capitão
  {const c=$('rMapaC');c.querySelector('img').src='../spread.jpg';$('rMapaP').innerHTML=MARCOS.map((m,i)=>`<button data-i=${i} style="left:${(EST_MAPA[i]/420*100).toFixed(2)}%;top:${(186/297*100).toFixed(2)}%" aria-label="${m.ano}">${m.n}</button>`).join('');$('rMapaP').onclick=e=>{const i=e.target.dataset.i;if(i==null)return;$('rMapa').hidden=true;salta(+i)};$('rMapa').querySelector('.fecha').onclick=()=>{$('rMapa').hidden=true};const area=$('rMapaArea');let s=1,x=0,y=0,d0=0,s0=1;const p=new Map();const ap=()=>{c.style.transform=`translate(${x}px,${y}px) scale(${s})`};area.onpointerdown=e=>{if(e.target.dataset&&e.target.dataset.i!=null)return;area.setPointerCapture(e.pointerId);p.set(e.pointerId,[e.clientX,e.clientY]);if(p.size===2){const[a,b]=[...p.values()];d0=Math.hypot(a[0]-b[0],a[1]-b[1]);s0=s}};area.onpointermove=e=>{if(!p.has(e.pointerId))return;const o=p.get(e.pointerId);p.set(e.pointerId,[e.clientX,e.clientY]);if(p.size===2){const[a,b]=[...p.values()];s=clamp(s0*Math.hypot(a[0]-b[0],a[1]-b[1])/d0,1,5)}else{x+=e.clientX-o[0];y+=e.clientY-o[1]}ap()};area.onpointerup=area.onpointercancel=e=>{p.delete(e.pointerId);if(s<=1){x=y=0;ap()}};area.onwheel=e=>{e.preventDefault();s=clamp(s*(1-Math.sign(e.deltaY)*.1),1,5);if(s<=1){x=y=0}ap()}}
  $('rBtMapa').onclick=()=>{$('rMenu').hidden=true;$('rMapa').hidden=false};
  // diário de bordo: o que a pessoa já viu e aprendeu
  const abreDiario=()=>{$('rMenu').hidden=true;$('rDH').innerHTML=MARCOS.map((m,i)=>`<button class="rItem ${filme.narrou.has(i)?'':'nao'}" data-i=${i}><b>${m.ano}</b>${m.titulo}</button>`).join('');$('rDF').innerHTML=Object.entries(ESPECIES_INFO).map(([k,v])=>{const vi=fauna.vistos.has(k);return `<div class="rItem ${vi?'':'nao'}"><b style="font-size:17px">${vi?v.n:'Ainda não avistado'}</b>${vi?`<em>${v.c}</em>${v.f}`:''}</div>`}).join('');$('rDiario').hidden=false;$('rDiario').scrollTop=0};$('rBtDiario').onclick=$('rFimDiario').onclick=abreDiario;$('rDiario').querySelector('.fecha').onclick=()=>{$('rDiario').hidden=true};$('rDH').onclick=e=>{const b=e.target.closest('button');if(b)abreLeitura(+b.dataset.i)};
  $('rFimLivre').onclick=()=>{$('rFim').classList.remove('on');document.body.classList.add('navega');filme.livre=true;filme.final=false;est.sClima=null;trocaModo('popa');dica('Navegação livre: vire o leme, segure no batente para dar a volta')};
  // ---------- leme transparente ----------
  const lemeEl=$('rLeme'),LIM=125;const raios=[...Array(8)].map((_,i)=>`<g transform="rotate(${i*45+22.5} 500 500)"><path d="M474 372 L486 262 H514 L526 372Z"/><path d="M482 200 L490 150 Q476 128 484 106 Q488 62 500 42 Q512 62 516 106 Q524 128 510 150 L518 200Z"/></g>`).join('');lemeEl.innerHTML=`<svg viewBox="0 0 1000 1000" aria-hidden="true"><g id=rRoda><g class=sil><circle cx=500 cy=500 r=272 fill=none stroke-width=78 class=aro /><circle cx=500 cy=500 r=312 fill=none stroke-width=4 /><circle cx=500 cy=500 r=232 fill=none stroke-width=4 />${raios}<circle cx=500 cy=500 r=120 /></g></g><circle class=toque cx=500 cy=500 r=500 /></svg>`;const lemeRodar=$('rRoda');
  const ptrAng=(e,cx,cy)=>Math.atan2(e.clientY-cy,e.clientX-cx)*57.296;const movLeme=a=>{let d=a-est.ang0;while(d>180)d-=360;while(d<-180)d+=360;est.ang0=a;if(nav.dir<0&&nav.segura==='leme')return;nav.leme=clamp(nav.leme+d/LIM,-1,1)};const centroEl=()=>{const b=lemeEl.getBoundingClientRect();return [b.left+b.width/2,b.top+b.height/2]};
  lemeEl.onpointerdown=e=>{if(est.fase!=='navega')return;lemeEl.setPointerCapture(e.pointerId);nav.pegou='leme';const c0=centroEl();est.ang0=ptrAng(e,c0[0],c0[1]);est.lemeC=c0;$('rDica').classList.remove('on')};lemeEl.onpointermove=e=>{if(nav.pegou==='leme'&&est.lemeC&&!est.lemeC3)movLeme(ptrAng(e,est.lemeC[0],est.lemeC[1]))};const soltaLeme=()=>{if(nav.pegou==='leme'){nav.pegou=null;est.lemeC=null;est.lemeC3=false}};lemeEl.onpointerup=soltaLeme;lemeEl.onpointercancel=soltaLeme;
  // alavanca na tela
  const alavUI=$('rAlav'),alavB=alavUI.querySelector('b'),alavT=alavUI.querySelector('small');const poeAlav=y=>{const b=alavUI.getBoundingClientRect();est.alav=clamp(1-(y-b.top-18)/(b.height-36))};alavUI.onpointerdown=e=>{alavUI.setPointerCapture(e.pointerId);est.alavUI=true;poeAlav(e.clientY)};alavUI.onpointermove=e=>{if(est.alavUI)poeAlav(e.clientY)};alavUI.onpointerup=alavUI.onpointercancel=()=>{est.alavUI=false};
  // ---------- troca de câmera ----------
  const pontosT=[new THREE.Vector3(0,8,-23),new THREE.Vector3(0,4,-13),new THREE.Vector3(0,2.55,-8.4),new THREE.Vector3(0,2.42,CABINE.ZA+.1),new THREE.Vector3(0,2.42,-3.5),new THREE.Vector3(0,2.42,-.3),CABINE.olho.clone()];
  const trocaModo=m=>{if(est.fase!=='navega'||est.trans>0)return;const de=est.modo;if(m===de)return;est.modo=m;filme.modoCam=m;document.body.classList.toggle('pilota',m==='popa');document.body.classList.toggle('cabine',m==='leme');const nm=$('rCamNome');nm.textContent=CAM_NOME[m];nm.classList.add('on');clearTimeout(nm._t);nm._t=setTimeout(()=>nm.classList.remove('on'),2600);dir.olhar.y=dir.olhar.p=0;dir.olhar.z=1;
    if(m==='leme'){const v=cam.position.clone();barco.updateMatrixWorld();barco.worldToLocal(v);pontosT[0].copy(v);const cp=new THREE.CatmullRomCurve3(pontosT.map(p=>p.clone()),false,'centripetal');const D=4.4;est.trans=D;est.transFim=()=>{dir.pede('lemeCam',{},0);dica('Vire o leme para os lados · empurre a alavanca para acelerar, puxe toda para trás para desligar · arraste para olhar em volta · toque no mapa da mesa')};dir.pede('curva',{cp,par:t=>{const q=clamp(t/D);return q*q*(3-2*q)},fovF:e=>mix(50,W<H?74:60,sst(.55,1,e)),tremor:0},0);est.fy=0;est.fp=-.06}
    else if(de==='leme'){const pts=pontosT.slice().reverse().map(p=>p.clone());pts[pts.length-1].set(4,6,-22);const cp=new THREE.CatmullRomCurve3(pts,false,'centripetal');const D=3.8;est.trans=D;est.transFim=()=>{if(m==='popa')dir.pede('piloto',{},1.6);else{dir.pede('popa',{e:1},1.6);filme.tPlano=0;filme.durPlano=6}};dir.pede('curva',{cp,par:t=>{const q=clamp(t/D);return q*q*(3-2*q)},fovF:e=>mix(W<H?74:60,50,sst(0,.5,e)),tremor:0},0)}
    else if(m==='popa'){est.cy=est.cp=0;est.cz=1;dir.pede('piloto',{},2.4);dica('Puxe o leme para os lados · segure travado para dar a volta · puxe a linha do tempo para voltar ou avançar')}
    else{filme.fila=[];dir.pede('popa',{e:1},2.4);filme.tPlano=0;filme.durPlano=6}};
  $('rBtCam').onclick=()=>{trocaModo(SEQ[(SEQ.indexOf(est.modo)+1)%3]);mostraHUD()};
  // ---------- toques na cena ----------
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();const dedos=new Map();let pin=0;const raioDe=e=>{ndc.set(e.clientX/W*2-1,-(e.clientY/H)*2+1);cam.updateMatrixWorld();ray.setFromCamera(ndc,cam)};const pecas=[CAB.proxRoda,CAB.proxAlav];
  canvas.addEventListener('pointerdown',e=>{dedos.set(e.pointerId,[e.clientX,e.clientY]);canvas.setPointerCapture(e.pointerId);if(dedos.size===2){const[a,b]=[...dedos.values()];pin=Math.hypot(a[0]-b[0],a[1]-b[1])}est.px=e.clientX;est.py=e.clientY;
    if(est.modo==='leme'&&est.trans<=0&&dedos.size===1){raioDe(e);const h=ray.intersectObjects(pecas,false)[0];if(h){const q=h.object.userData.alvo;if(q==='leme'){nav.pegou='leme';est.lemeC3=true;const v=EIXO_LEME.clone().applyMatrix4(barco.matrixWorld).project(cam);est.lemeC=[(v.x*.5+.5)*W,(-v.y*.5+.5)*H];est.ang0=ptrAng(e,est.lemeC[0],est.lemeC[1])}else{est.pegaAl=true;est.alavY=e.clientY;est.alav0=est.alav}}}});
  canvas.addEventListener('pointermove',e=>{const u=dedos.get(e.pointerId);if(!u)return;if(nav.pegou==='leme'&&est.lemeC3){movLeme(ptrAng(e,est.lemeC[0],est.lemeC[1]));return}if(est.pegaAl){est.alav=clamp(est.alav0-(e.clientY-est.alavY)/(H*.3));return}const dx=e.clientX-u[0],dy=e.clientY-u[1];dedos.set(e.pointerId,[e.clientX,e.clientY]);est.cIdle=0;
    if(est.modo==='leme'){if(dedos.size===1){est.fy=giro(est.fy+dx*.0042);est.fp=clamp(est.fp+dy*.0034,-.95,.62)}return}
    if(est.modo==='popa'){if(dedos.size===1){est.cy-=dx*.0052;est.cp=clamp(est.cp+dy*.0034,-.32,.75)}else if(dedos.size===2){const[a,b]=[...dedos.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pin)est.cz=clamp(est.cz*pin/d,.55,1.8);pin=d}return}
    if(dedos.size===1){dir.olhar.y=clamp(dir.olhar.y-dx*.0034,-2.6,2.6);dir.olhar.p=clamp(dir.olhar.p-dy*.0028,-.7,.7)}else if(dedos.size===2){const[a,b]=[...dedos.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pin)dir.olhar.z=clamp(dir.olhar.z*pin/d,.45,1.35);pin=d}});
  const tira=e=>{dedos.delete(e.pointerId);const eraL=nav.pegou==='leme'&&est.lemeC3,eraA=est.pegaAl;if(eraL)soltaLeme();est.pegaAl=false;if(eraL||eraA)return;if(Math.hypot(e.clientX-est.px,e.clientY-est.py)<9&&est.fase==='navega'){mostraHUD();if(est.modo==='leme'&&est.trans<=0){raioDe(e);const m=ray.intersectObject(CAB.mapa,false)[0];if(m&&m.distance<3.4)$('rMapa').hidden=false}}};canvas.addEventListener('pointerup',tira);canvas.addEventListener('pointercancel',e=>{dedos.delete(e.pointerId);soltaLeme();est.pegaAl=false});
  canvas.addEventListener('wheel',e=>{e.preventDefault();est.cIdle=0;if(est.modo==='popa')est.cz=clamp(est.cz*(1+Math.sign(e.deltaY)*.08),.55,1.8);else dir.olhar.z=clamp(dir.olhar.z*(1+Math.sign(e.deltaY)*.05),.45,1.35)},{passive:false});
  const teclas={};addEventListener('keydown',ev=>{teclas[ev.key]=true;if(est.fase!=='navega')return;if(ev.key===' '){ev.preventDefault();pausa(!est.pausa)}if(ev.key==='c'||ev.key==='C')$('rBtCam').click()});addEventListener('keyup',ev=>{teclas[ev.key]=false});
  // ---------- abertura ----------
  const fimAbertura=()=>{if(est.fase!=='abertura')return;est.fase='navega';est.sClima=null;filme.ativo=true;document.body.classList.add('navega');$('rPular').hidden=true;$('rTitulo').classList.remove('vis');if(!filme.frases.length||!filme.falaFim){}dir.pede('popa',{e:1},2.6);filme.tPlano=0;filme.durPlano=8;setTimeout(()=>dica('Toque na tela para ver os controles'),1200)};
  $('rPular').onclick=()=>{som.paraVoz();filme.frases=[];filme.falaFim=false;est.tA=DUR;nav.v=Math.max(nav.v,3);};
  const iniciaFilme=(pular)=>{est.fase='abertura';est.tA=pular?DUR:0;nav.s=170;nav.lat=0;nav.v=0;const o=rio.em(nav.s);nav.yaw=o.h;dir.pede('curva',{cp:cpA,cl:clA,par:()=>parA(est.tA),fov:46,tremor:.002,fovF:e=>46},0);setTimeout(()=>{if(est.fase==='abertura')$('rPular').hidden=false},4200)};
  // ---------- laço principal ----------
  const solTela=new THREE.Vector2(),v3=new THREE.Vector3(),fw=new THREE.Vector3(),vL=new THREE.Vector3();const x={bp:new THREE.Vector3(),fw,bm:barco.matrixWorld};let ult=performance.now(),tf=0,fr=0,tJ=0,tQ=0,quadros=0;
  U.uVento.value.set(.85,.5,.3);
  const passo=()=>{requestAnimationFrame(passo);const ag=performance.now(),real=Math.min(.25,(ag-ult)/1000);ult=ag;fr++;tf+=real;quadros++;if(tf>1){est.fps=fr/tf;fr=0;tf=0}
    const lendo=ui.lendo();est.esc+=((lendo?.04:1)-est.esc)*Math.min(1,real*2.6);const dt=est.pausa?0:Math.min(.05,real)*est.esc;tJ+=dt;est.t+=dt;U.uTempo.value=tJ;const ab=est.fase==='abertura';if(ab)est.tA+=dt;const tA=est.tA;
    // qualidade que se adapta sozinha: primeiro a resolução, depois o reflexo e os raios
    if(est.fase!=='titulo'&&!est.pausa){tQ+=real;if(tQ>1.6){tQ=0;const f=est.fps;if(f<27&&escala>.62){escala=Math.max(.62,escala-.09);tam()}else if(f<24&&escala<=.62&&agua.taxa<4){agua.taxa++;pos.raiosLigado=false}else if(f>54&&escala<1&&!Q.get('escala')){escala=Math.min(1,escala+.04);tam()}}}
    // teclado
    if(est.fase==='navega'&&est.modo!=='filme'){nav.teclaLeme=(teclas.ArrowRight||teclas.d?1:0)-(teclas.ArrowLeft||teclas.a?1:0);if(est.modo==='leme'){const ka=(teclas.ArrowUp||teclas.w?1:0)-(teclas.ArrowDown||teclas.s?1:0);if(ka)est.alav=clamp(est.alav+ka*real*.5)}}else nav.teclaLeme=0;
    nav.manualVel=est.alav<.04?0:(est.alav<.5?est.alav*2*9.5:9.5+(est.alav-.5)*2*10.5);
    x.dtReal=real;x.cIdle=est.cIdle;filme.atualiza(dt,x);
    let vA,rA;if(ab){vA=tA>28?3.2:0;rA=tA>26?.26:0}else{vA=filme.vAlvo();rA=est.modo==='leme'?(est.alav<.04?0:.12+est.alav*.88):(vA<.1?.04:.2+vA/20*.8)}
    const o=nav.passo(dt,{vAlvo:vA,rpmAlvo:rA,aoBatente:()=>{som.um('batente',.5);navigator.vibrate&&navigator.vibrate(18)}});
    // alvo lateral: desvia para perto da obra e serpenteia de leve
    {const [i,dm]=filme.perto(),p=paradas[i];const q=sst(90,40,dm);nav.lAlvoExt=q*p.e*o.w*.28+(1-q)*Math.sin(nav.s*.0067)*o.w*.2;if(filme.cenaFauna&&filme.cenaFauna.lado)nav.lAlvoExt=filme.cenaFauna.lado*o.w*.42;if(ab)nav.lAlvoExt=0}
    const nn=sst(0,8,nav.v),bal=Math.sin(tJ*1.05)*.012+Math.sin(tJ*.63)*.009,rz=Math.sin(tJ*.71)*.014-nav.dy*.1*nn;barco.position.set(o.px,Math.sin(tJ*.9)*.05,o.pz);barco.rotation.set(-nn*.016+bal,nav.yaw,rz,'YXZ');barco.updateMatrixWorld();uBarcoInv.value.copy(barco.matrixWorld).invert();fw.set(Math.sin(nav.yaw),0,Math.cos(nav.yaw));x.bp.copy(barco.position);x.s=nav.s;x.lat=nav.lat;x.yaw=nav.yaw;x.h=o.h;x.w=o.w;x.v=nav.v;x.dir=nav.dir;x.virando=nav.virando;x.rz=rz;x.tJ=tJ;x.W=W;x.H=H;
    const iAt=J.ativa>=0?J.ativa:filme.perto()[0];const gOb=obras.lista[iAt];x.obra=gOb?{e:gOb.userData.e,si:gOb.userData.si,centro:gOb.userData.centro,tam:gOb.userData.tam}:null;
    // hora do dia
    if(ab)est.sClima=mix(50,nav.s+6,sst(14,DUR-6,tA));
    if(filme.final&&!filme.livre){est.kFinal=Math.min(1,est.kFinal+dt/30);est.sClima=mix(est.sFim0||nav.s,3880,sst(0,.55,est.kFinal))}
    const m=clima.atualiza(est.sClima!==null?est.sClima:nav.s);clima.aplicaPos(pos);ceu.defineHumor(m,dt);
    {const lum=(U.uAmbCeu.value.r+U.uAmbCeu.value.g+U.uAmbCeu.value.b)/3;obras.K.atualiza(clamp(lum));hemi.color.copy(U.uAmbCeu.value);hemi.groundColor.copy(U.uAmbChao.value);hemi.intensity=1.25;sol.color.copy(U.uSolCor.value);sol.intensity=1;sol.position.copy(barco.position).addScaledVector(U.uSolDir.value,170);sol.target.position.copy(barco.position);sol.target.updateMatrixWorld();const nk=sst(.2,.8,m.noite);uLuzBarco.value=nk*.1;obras.K.noite&&obras.K.noite(sst(.05,.5,m.noite));luzesB.userData.un.uK.value=nk;luzFim.userData.un.uK.value=est.kFinal;olhos.userData.un.uK.value=sst(.55,.95,m.noite)}
    // câmera de cada modo
    if(est.trans>0){est.trans-=dt;if(est.trans<=0){est.trans=0;const f=est.transFim;est.transFim=null;f&&f()}}
    est.cIdle+=real;
    {const [i,dm]=filme.perto();let pan=0;if(est.fase==='navega'){const q=sst(82,24,dm);pan=q*paradas[i].e*(W/H<1?1.3:1)*(1-.25*sst(0,30,nav.s-paradas[i].s))*(nav.dir>0?1:-1)+(1-q)*Math.sin(nav.s*.0105)*.42}est.pan+=(pan-est.pan)*Math.min(1,real*.62);x.pan=est.pan}
    if(est.modo==='popa'&&est.cIdle>4.5){const k=Math.min(1,real*.33);est.cy+=giro(-est.cy)*k;est.cp*=1-k;est.cz+=(1-est.cz)*k*.8}
    if(est.modo==='leme'){if(est.cIdle>2.6&&filme.atual>=0&&obras.lista[filme.atual]){const ce=obras.lista[filme.atual].userData.centro,a=giro(Math.atan2(ce.x-barco.position.x,ce.z-barco.position.z)-nav.yaw);est.fy+=giro(a-est.fy)*Math.min(1,real*.55);est.fp+=(-.02-est.fp)*Math.min(1,real*.8)}else if(est.cIdle>5&&filme.atual<0){est.fy+=giro(-est.fy)*Math.min(1,real*.5);est.fp+=(-.06-est.fp)*Math.min(1,real*.6)}}
    x.cy=est.cy;x.cp=est.cp;x.cz=est.cz;x.fy=est.fy;x.fp=est.fp;
    if(est.camFixa&&est.camFixa.p){if(est.camFixa.local){v3.set(...est.camFixa.p).applyMatrix4(barco.matrixWorld);cam.position.copy(v3);v3.set(...est.camFixa.a).applyMatrix4(barco.matrixWorld);cam.lookAt(v3)}else{cam.position.set(...est.camFixa.p);cam.lookAt(...est.camFixa.a)}if(est.camFixa.fov&&cam.fov!==est.camFixa.fov){cam.fov=est.camFixa.fov;cam.updateProjectionMatrix()}cam.updateMatrixWorld()}else{if(!dir.atual)dir.pede('popa',{},0);dir.atualiza(real*(est.pausa?0:est.esc)||0,x)}
    if(est.modo==='filme'){if(est.cIdle>5&&(dir.olhar.y||dir.olhar.p||dir.olhar.z!==1)){const k=Math.min(1,real*.9);dir.olhar.y*=1-k;dir.olhar.p*=1-k;dir.olhar.z+=(1-dir.olhar.z)*k;if(Math.abs(dir.olhar.y)+Math.abs(dir.olhar.p)<.002){dir.olhar.y=dir.olhar.p=0}}}
    // dentro ou fora do barco? decidido pela posição real da câmera
    vL.copy(cam.position);barco.worldToLocal(vL);const dentro=Math.abs(vL.x)<CABINE.XC+.04&&vL.z>CABINE.ZA&&vL.z<CABINE.ZD+.02&&vL.y>CABINE.piso-.2&&vL.y<CABINE.beiral+.05;const dBarco=cam.position.distanceTo(barco.position);
    const porta=est.trans>0&&vL.z>-8.3&&vL.z<CABINE.ZA+.3&&Math.abs(vL.x)<6;uCaixaZ.value=porta||(est.trans>0&&dentro)?-9.5:-7.1;uDentro.value=dentro||porta?1:0;luzesB.visible=!dentro&&!porta;CAB.grupo.visible=dentro||porta||(dBarco<34&&(ab&&tA<40));est.dentro=dentro?1:0;const nearA=dentro?.05:(dBarco<16?.14:.4);if(cam.near!==nearA){cam.near=nearA;cam.updateProjectionMatrix()}
    // lanterna
    const acesa=sst(2,2.8,ab?tA:9),flk=.86+Math.sin(tJ*11)*.05+Math.sin(tJ*23.3)*.04+Math.sin(tJ*5.1)*.05;if(CAB.grupo.visible)CAB.lant.userData.atualiza(tJ,acesa,flk);luzL.intensity=(ab?acesa*1.15:dentro?.82:0)*flk;
    if(ab&&tA>=2&&!est.fosforo){est.fosforo=true;som.um('fosforo',.8);setTimeout(()=>{if(est.fase==='abertura'&&est.tA<DUR-8){filme.defTexto(FIXO.intro,0);filme.falaFim=true;som.voz('intro',()=>{filme.frases=[];filme.falaFim=false})}},1500)}
    if(ab&&tA>50&&tA<59.5&&!est.tituloV){est.tituloV=true;$('rTitulo').classList.add('vis')}if(ab&&tA>=59.5&&est.tituloV){$('rTitulo').classList.remove('vis')}
    if(ab&&tA>=DUR)fimAbertura();
    est.fade+=(est.fadeA-est.fade)*Math.min(1,real*5.5);pos.uF.uFade.value=(ab?sst(.05,1.2,tA)*(acesa*.97+.03):1)*est.fade;pos.uF.uTarja.value=(ab&&W>H)?mix(.1,0,sst(36,50,tA)):0;
    const cortou=dir.cortes!==est.cortesV;est.cortesV=dir.cortes;U.uCam.value.copy(cam.position);
    if(est.ceuForca){ceu.força();est.ceuForca=false}else ceu.atualiza(dt);
    fl.atualiza(cam,est.forcaFl||cortou,real);est.forcaFl=false;topo.atualiza(barco.position.x,barco.position.z);
    for(const g of obras.lista){if(g)g.visible=Math.abs(g.userData.si-nav.s)<[320,520,720][T]}
    fauna.atualiza(dt,tJ,x,m);ef.atualiza(m);if(Math.floor(tJ*.2)!==est.tLimpa){est.tLimpa=Math.floor(tJ*.2);fauna.limpaDepois(nav.s)}
    agua.defineHumor(m,cam);agua.uni.uBarco.value.copy(barco.position);agua.uni.uRumo.value.set(fw.x,fw.z);agua.uni.uVel.value=clamp(nav.v/11,0,1.4);{const q=sst(2700,2770,nav.s)*sst(2910,2850,nav.s);agua.uni.uEncontro.value.set(o.x,o.z,o.h,q)}agua.passoSim(barco.position.x,barco.position.z,fw.x,fw.z,nav.v,dt);
    if(sol.shadow.map){U.uSombraMapa.value=sol.shadow.map.texture;U.uSombraMat.value.copy(sol.shadow.matrix)}
    // desenho: reflexo, cena, acabamento
    if(T>=1)r.shadowMap.needsUpdate=T>=2||quadros%2===0;r.shadowMap.autoUpdate=false;
    const cabV=CAB.grupo.visible;agua.reflete(cam,cena,()=>{fl.modoReflexo(true);uDentro.value=0;CAB.grupo.visible=false},()=>{fl.modoReflexo(false);uDentro.value=dentro||porta?1:0;CAB.grupo.visible=cabV});
    r.setRenderTarget(pos.rt);r.clear();r.render(cena,cam);r.setRenderTarget(null);
    pos.uF.uT.value=ag*.001;v3.copy(m.discoDir).multiplyScalar(4000).add(cam.position).project(cam);const vis=v3.z<1&&m.discoCor.r>0&&!dentro;solTela.set(v3.x*.5+.5,v3.y*.5+.5);pos.aplica(vis?solTela:null,m.f.raios*sst(1.6,.4,Math.hypot(v3.x,v3.y)));
    // interface por quadro
    {const leg=est.comTxt&&!lendo?filme.legenda():'',el=$('rLeg');if(leg!==est.legV){est.legV=leg;el.textContent=leg;el.classList.toggle('on',!!leg)}}
    J.atualiza(real,{cam,W,H,caixa:J.ativa>=0&&obras.lista[J.ativa]?obras.lista[J.ativa].userData.caixa:null,progresso:filme.progresso});
    {const p=PAS(),qi=pIdx(nav.s);if(!nav.tlPega)tlDx*=Math.exp(-real*7);fita.style.transform=`translateX(${(-qi*p+tlDx*.72).toFixed(1)}px)`;const ak=clamp(Math.round(qi),0,NP-1);if(ak!==anoAceso){if(anoAceso>=0)$('rM'+anoAceso).classList.remove('on');$('rM'+ak).classList.add('on');anoAceso=ak}const rumo=nav.dir<0?'◀◀ VOLTANDO':(nav.tlPega&&nav.tlPuxa>.2?'AVANÇANDO ▶▶':'');if(rumo!==est.rumoV){est.rumoV=rumo;$('rRumo').textContent=rumo}}
    if(est.hud>0){est.hud-=real;if(est.hud<=0)document.body.classList.remove('hud')}
    lemeRodar.setAttribute('transform',`rotate(${(nav.leme*LIM).toFixed(2)} 500 500)`);CAB.roda.rotation.z=nav.leme*LIM*.01745;CAB.alav.rotation.x=(est.alav-.5)*1.42;if(CAB.grupo.userData.agulha)CAB.grupo.userData.agulha.rotation.y=-giro(nav.yaw)*.6;alavB.style.bottom=`calc(${(est.alav*100).toFixed(1)}% - ${(est.alav*36-18).toFixed(1)}px)`;alavT.textContent=est.alav<.04?'DESLIGADO':'MOTOR';
    // relâmpagos durante a tempestade
    if(m.f.chuva>.55&&!est.pausa){est.tRel=(est.tRel===undefined?4:est.tRel)-dt;if(est.tRel<=0){est.tRel=5+Math.random()*11;est.flash=1;som.relampago(Math.random()<.35)}}est.flash=Math.max(0,(est.flash||0)-real*(3.4+Math.sin(ag*.05)*2));m.relampago=est.flash*est.flash;
    {const cf=cam.getWorldDirection(est._f||(est._f=new THREE.Vector3())),cu=(est._u||(est._u=new THREE.Vector3())).set(0,1,0).applyQuaternion(cam.quaternion);som.atualiza(real,{f:m.f,v:nav.v,rpm:nav.rpm,dentro:est.dentro,dist:dBarco,alto:cam.position.y,cam:cam.position,frente:cf,cima:cu,margem:clamp(1-(o.w-Math.abs(nav.lat))/40)})}
  };
  r.shadowMap.autoUpdate=false;
  window.__rio={est,cam,r,rio,clima,ceu,fl,agua,topo,pos,T,U,barco,cena,nav,dir,filme,obras,J,som,fauna,ef,CAB,salta,trocaModo,iniciaFilme,fimAbertura,get fps(){return est.fps},get escala(){return escala}};
  await carregaBarco;barraP(.97);await carrega('lanterna_'+['c','b','a'][T]);
  // aquece os shaders antes de abrir a cortina, para não haver engasgo depois
  uDentro.value=0;CAB.grupo.visible=true;cam.position.set(barco.position.x,5,barco.position.z-20);r.compile(cena,cam);CAB.grupo.visible=false;
  passo();barraP(1);
  const b=$('rEmbarca');const embarca=()=>{b.disabled=true;som.inicia();som.pre('intro');som.pre('m01');$('rInicio').classList.add('sai');setTimeout(()=>$('rInicio').remove(),2000);iniciaFilme(Q.has('pular'))};
  b.disabled=false;b.textContent='Embarcar';b.onclick=embarca;$('rBarra').style.opacity=0;if(TESTE&&!Q.has('titulo'))embarca();
  window.__pronto=true;
}
inicia().catch(e=>{console.error(e);document.body.insertAdjacentHTML('beforeend',`<pre style="color:#f88;position:fixed;top:0;left:0;z-index:99;white-space:pre-wrap">${e.stack||e}</pre>`)});
