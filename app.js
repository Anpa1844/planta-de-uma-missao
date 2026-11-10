import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {MARCOS,INTRO} from './conteudo.js';
window.THREE=THREE;
const $=i=>document.getElementById(i);
const Q=new URLSearchParams(location.search);
const canvas=$('c');
// Cena em milímetros. Origem na lombada; +x direita, +y alto da página, +z saindo do papel.
const EST=[18,52.9,87.8,122.7,157.6,175,192.5,227.4,262.3,297.2,332.1,367,401.9];   // balizas da prancha, em mm
const X=i=>EST[i]-210, Y0=148.5-186;
const POS=i=>Math.max(-168,Math.min(168,X(i)));   // o barco nunca sai da página
const VERDE=0x21403d, OURO=0xb98a3e, PAPEL=0xf4f0e7;
const estado={sel:-1,tour:false,som:true,alvoX:POS(0),rumo:1,visivel:false};
const raiz=new THREE.Group();raiz.visible=false;
const conteudo=new THREE.Group();raiz.add(conteudo);
const toque=[],arg=[];
let barco=null,rastro=[];

function agua(){
  const g=new THREE.PlaneGeometry(420,20,160,6);
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{t:{value:0}},
    vertexShader:`varying vec2 u;uniform float t;void main(){u=uv;vec3 p=position;p.z+=.7*sin(p.x*.05+t*1.4)*sin(p.y*.09+t);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`varying vec2 u;uniform float t;void main(){float b=smoothstep(0.,.3,u.y)*smoothstep(1.,.7,u.y)*smoothstep(0.,.03,u.x)*smoothstep(1.,.97,u.x);
      float o=sin(u.x*90.+t*1.6+sin(u.y*16.+t)*2.5)*sin(u.y*38.-t*1.1);float h=smoothstep(.55,.95,o);
      gl_FragColor=vec4(mix(vec3(.13,.25,.24),vec3(.95,.86,.62),h*.8),b*(.2+h*.5));}`});
  const a=new THREE.Mesh(g,m);a.position.set(0,Y0,1.2);a.userData.m=m;return a;
}
function numero(n,on){
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  x.beginPath();x.arc(64,64,58,0,7);x.fillStyle=on?'#21403d':'#f4f0e7';x.fill();x.lineWidth=7;x.strokeStyle=on?'#f4f0e7':'#21403d';x.stroke();
  x.fillStyle=on?'#fff':'#21403d';x.font='800 62px -apple-system,Roboto,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(n,64,68);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function balizas(){
  MARCOS.forEach((m,i)=>{
    const g=new THREE.Group();g.position.set(X(i),Y0,0);
    const h=30+(i%2)*9;
    const haste=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,h,6),new THREE.MeshBasicMaterial({color:VERDE}));haste.rotation.x=Math.PI/2;haste.position.z=h/2;
    const off=numero(m.n,false),on=numero(m.n,true);
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:off,depthTest:false,transparent:true}));s.scale.set(10,10,1);s.position.z=h+5;s.renderOrder=5;
    const alvo=new THREE.Mesh(new THREE.SphereGeometry(13,10,8),new THREE.MeshBasicMaterial({visible:false}));alvo.position.z=h+5;alvo.userData.i=i;
    g.add(haste,s,alvo);conteudo.add(g);toque.push(alvo);arg.push({g,s,off,on,sobe:0});
  });
}
const tex=new THREE.TextureLoader();
function quadro(i){
  // foto original em pé atrás da baliza
  const m=MARCOS[i],gr=new THREE.Group();gr.position.set(X(i),Y0+34,0);gr.rotation.x=Math.PI/2-.2;gr.scale.setScalar(.001);
  const f=m.fotos[0];const mat=new THREE.MeshBasicMaterial({color:0xffffff});
  const base=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:PAPEL,side:THREE.DoubleSide}));
  const foto=new THREE.Mesh(new THREE.PlaneGeometry(1,1),mat);foto.position.z=.25;gr.add(base,foto);
  const ajusta=(w,h)=>{const L=78;const a=w/h,W=a>=1?L:L*a,H=a>=1?L/a:L;foto.scale.set(W,H,1);base.scale.set(W+4,H+4,1);foto.position.y=base.position.y=H/2+6};
  if(f){tex.load('fotos/'+f,t=>{t.colorSpace=THREE.SRGBColorSpace;mat.map=t;mat.needsUpdate=true;ajusta(t.image.width,t.image.height)});ajusta(4,3)}
  else{const c=document.createElement('canvas');c.width=512;c.height=384;const x=c.getContext('2d');x.fillStyle='#efe9db';x.fillRect(0,0,512,384);x.setLineDash([14,10]);x.lineWidth=5;x.strokeStyle='#21403d';x.strokeRect(24,24,464,336);x.fillStyle='#21403d';x.font='700 30px Arial';x.textAlign='center';x.fillText('Imagem em breve',256,200);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;mat.map=t;ajusta(4,3)}
  conteudo.add(gr);return gr;
}
let quadroAtual=null;const quadros={};
function mostraQuadro(i){
  if(!MARCOS[i].fotos.length&&!MARCOS[i].reservas.length)return;
  if(quadroAtual!=null&&quadros[quadroAtual])quadros[quadroAtual].userData.alvo=.001;
  quadros[i]=quadros[i]||quadro(i);quadros[i].userData.alvo=1;quadroAtual=i;
}
async function carregaBarco(){
  const g=await new GLTFLoader().loadAsync('modelos/luzeiro.glb');
  const b=new THREE.Group(),m=g.scene;m.traverse(o=>{if(o.material)o.material.side=THREE.DoubleSide});m.scale.setScalar(74);m.rotation.x=Math.PI/2;b.add(m);b.position.set(POS(0),Y0,0);conteudo.add(b);barco=b;
  const ani=new THREE.TorusGeometry(1,.05,6,32);
  for(let k=0;k<3;k++){const r=new THREE.Mesh(ani,new THREE.MeshBasicMaterial({color:0xfff2d6,transparent:true,opacity:0,depthWrite:false}));r.position.set(0,Y0,1.6);conteudo.add(r);rastro.push({r,f:k/3})}
}
function luzes(){
  conteudo.add(new THREE.HemisphereLight(0xffffff,0x8a8f86,3.4));
  const d=new THREE.DirectionalLight(0xfff0d6,3.2);d.position.set(-120,-160,260);conteudo.add(d);
  const a=new THREE.DirectionalLight(0xbcd2d0,.8);a.position.set(150,120,120);conteudo.add(a);
}
luzes();conteudo.add(agua());balizas();
const relogio=new THREE.Clock();
function anima(){
  const dt=Math.min(relogio.getDelta(),.05),t=relogio.elapsedTime;
  conteudo.children.forEach(c=>{if(c.userData.m)c.userData.m.uniforms.t.value=t});
  if(barco){
    const dx=estado.alvoX-barco.position.x;barco.position.x+=dx*(1-Math.exp(-dt*1.4));
    if(Math.abs(dx)>1.5)estado.rumo=Math.sign(dx);
    barco.rotation.z+=((estado.rumo>0?0:Math.PI)-barco.rotation.z)*(1-Math.exp(-dt*3));
    barco.position.z=.8+Math.sin(t*1.3)*.6;barco.rotation.x=Math.sin(t*.9)*.025;barco.rotation.y=Math.cos(t*.7)*.018;
    const vel=Math.min(1,Math.abs(dx)/40);
    rastro.forEach(o=>{o.f=(o.f+dt*.4)%1;const s=6+o.f*40;o.r.scale.set(s*1.5,s*.6,1);o.r.position.x=barco.position.x-estado.rumo*(34+o.f*24);o.r.material.opacity=(1-o.f)*.5*vel});
  }
  arg.forEach((a,i)=>{const alvo=i===estado.sel?1.35:1;const k=a.s.scale.x+(10*alvo-a.s.scale.x)*.15;a.s.scale.set(k,k,1);a.s.material.map=i===estado.sel?a.on:a.off});
  Object.values(quadros).forEach(q=>{const k=q.scale.x+((q.userData.alvo||.001)-q.scale.x)*(1-Math.exp(-dt*6));q.scale.setScalar(k);q.visible=k>.02});
}
// ---------- interface ----------
const painel=$('painel');const audio=new Audio();audio.preload='auto';estado.audio=audio;
function fala(arq,fim){audio.onended=fim||null;audio.src='audio/'+arq+'.m4a';audio.muted=!estado.som;audio.play().catch(()=>{})}
function para(){audio.pause();audio.onended=null;$('btOuvir').textContent='▶ Ouvir'}
function pontos(){$('pontos').replaceChildren(...MARCOS.map((m,i)=>{const b=document.createElement('button');b.textContent=m.n;b.className=i===estado.sel?'on':'';b.onclick=()=>{if(estado.aoPonto){estado.aoPonto(i);return}paraTour();abre(i)};return b}))}
function abre(i,falar){
  estado.sel=i;estado.alvoX=POS(i);const m=MARCOS[i];pontos();if(!estado.rio)mostraQuadro(i);
  $('pAno').textContent=m.ano;$('pN').textContent=`marco ${m.n} de ${MARCOS.length}`;$('pTit').textContent=m.titulo;$('pEv').textContent=m.evento;$('pTxt').textContent=m.texto;
  const f=$('pFotos');f.replaceChildren();
  m.fotos.forEach(n=>{const b=document.createElement('button'),im=new Image();im.src='fotos/'+n;im.alt=m.titulo;b.append(im);b.onclick=()=>zoom('fotos/'+n);f.append(b)});
  m.reservas.forEach(r=>{const d=document.createElement('div');d.className='res';d.textContent=r;f.append(d)});
  if(!m.fotos.length&&!m.reservas.length)f.hidden=true;else f.hidden=false;
  painel.hidden=false;painel.scrollTop=0;estado.aoPainel&&estado.aoPainel(i);
  if(falar){$('btOuvir').textContent='❚❚ Pausar';fala(`m${String(m.n).padStart(2,'0')}`,()=>{$('btOuvir').textContent='▶ Ouvir';if(estado.tour){i<MARCOS.length-1?abre(i+1,true):paraTour()}})}else para();
}
function paraTour(){estado.tour=false;$('btTour').textContent='▶ Ouvir a história'}
$('fecha').onclick=()=>{paraTour();para();painel.hidden=true;estado.sel=-1;pontos();estado.aoPainel&&estado.aoPainel(-1);if(quadroAtual!=null&&quadros[quadroAtual])quadros[quadroAtual].userData.alvo=.001};
$('btAnt').onclick=()=>{paraTour();abre((estado.sel+MARCOS.length-1)%MARCOS.length)};$('btProx').onclick=()=>{paraTour();abre((estado.sel+1)%MARCOS.length)};
$('btOuvir').onclick=()=>{if(audio.paused||!audio.src){abre(estado.sel,true)}else{paraTour();para()}};
$('btTour').onclick=()=>{if(estado.aoTour){estado.aoTour();return}if(estado.tour){paraTour();para();return}estado.tour=true;$('btTour').textContent='❚❚ Parar';painel.hidden=true;fala('intro',()=>{if(estado.tour)abre(0,true)})};
$('btSom').onclick=()=>{estado.som=!estado.som;audio.muted=!estado.som;$('btSom').classList.toggle('mudo',!estado.som)};
// zoom de foto: pinça e arrasto
function zoom(src){const z=$('zoom'),im=$('zImg');im.src=src;z.hidden=false;let s=1,x=0,y=0;const p=new Map();let d0=0,s0=1;
  const ap=()=>im.style.transform=`translate(${x}px,${y}px) scale(${s})`;ap();
  z.onpointerdown=e=>{z.setPointerCapture(e.pointerId);p.set(e.pointerId,[e.clientX,e.clientY]);if(p.size===2){const[a,b]=[...p.values()];d0=Math.hypot(a[0]-b[0],a[1]-b[1]);s0=s}};
  z.onpointermove=e=>{if(!p.has(e.pointerId))return;const o=p.get(e.pointerId);p.set(e.pointerId,[e.clientX,e.clientY]);if(p.size===2){const[a,b]=[...p.values()];s=Math.min(6,Math.max(1,s0*Math.hypot(a[0]-b[0],a[1]-b[1])/d0))}else{x+=e.clientX-o[0];y+=e.clientY-o[1]}ap()};
  z.onpointerup=z.onpointercancel=e=>{p.delete(e.pointerId);if(s<=1){x=y=0;ap()}};
  z.ondblclick=()=>{s=s>1?1:2.5;if(s===1)x=y=0;ap()};
}
$('zFecha').onclick=()=>{$('zoom').hidden=true};
// toque nas balizas 3D
const ray=new THREE.Raycaster();let camAtual=null;
canvas.addEventListener('pointerup',e=>{if(!camAtual||!raiz.visible)return;if(e.pointerType==='mouse'&&Math.hypot(e.clientX-px,e.clientY-py)>6)return;
  const r=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camAtual);
  const h=ray.intersectObjects(toque,false)[0];if(h){paraTour();abre(h.object.userData.i)}});
let px=0,py=0;canvas.addEventListener('pointerdown',e=>{px=e.clientX;py=e.clientY});
function aviso(t,ms){const m=$('msg');m.textContent=t;m.hidden=false;clearTimeout(aviso.t);if(ms)aviso.t=setTimeout(()=>m.hidden=true,ms)}
function pronto(){$('barra').hidden=false;pontos()}
// ---------- modo sem câmera ----------
function modo3D(){
  $('inicio').hidden=true;$('mira').hidden=true;
  const r=new THREE.WebGLRenderer({canvas,antialias:true});r.setPixelRatio(Math.min(devicePixelRatio,2));
  const cena=new THREE.Scene();cena.background=new THREE.Color(0x2a2520);
  const cam=new THREE.PerspectiveCamera(38,1,1,4000);cam.position.set(0,-430,330);cam.up.set(0,0,1);
  const c=new OrbitControls(cam,canvas);c.target.set(0,-10,20);c.enableDamping=true;c.minDistance=120;c.maxDistance=1400;c.maxPolarAngle=Math.PI*.49;c.update();
  const t=tex.load('spread.jpg');t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;
  const folha=new THREE.Mesh(new THREE.PlaneGeometry(420,297),new THREE.MeshBasicMaterial({map:t}));cena.add(folha);
  raiz.visible=true;cena.add(raiz);camAtual=cam;
  // enquadramento: com o painel aberto, a cena desliza para a área livre e aproxima do marco
  const T0=new THREE.Vector3(0,-10,20);let base=520;
  const foco={t:T0.clone(),d:520,ox:0,oy:0,x:0,y:0,tempo:0};
  estado.aoPainel=i=>requestAnimationFrame(()=>{
    const w=innerWidth,h=innerHeight,deitado=w>h;
    if(i<0||painel.hidden){foco.t.copy(T0);foco.d=base;foco.ox=foco.oy=0}
    else{const p=painel.getBoundingClientRect();foco.t.set(POS(i),Y0+14,26);foco.d=deitado?300:560;foco.ox=deitado?p.width/2:0;foco.oy=deitado?0:p.height/2}
    foco.tempo=1.6});
  const ajusta=()=>{const w=innerWidth,h=innerHeight;r.setSize(w,h,false);cam.aspect=w/h;base=w<h?1040:520;if(estado.sel<0){cam.position.setLength(base);foco.d=base}cam.setViewOffset(w,h,foco.x,foco.y,w,h);cam.updateProjectionMatrix();estado.aoPainel(estado.sel)};addEventListener('resize',ajusta);ajusta();
  let ult=performance.now();const dir=new THREE.Vector3();
  r.setAnimationLoop(()=>{const ag=performance.now(),dt=Math.min((ag-ult)/1000,.1);ult=ag;anima();
    if(foco.tempo>0){foco.tempo-=dt;const k=1-Math.exp(-dt*4.5);dir.copy(cam.position).sub(c.target);const L=dir.length();c.target.lerp(foco.t,k);cam.position.copy(c.target).addScaledVector(dir.normalize(),L+(foco.d-L)*k);
      foco.x+=(foco.ox-foco.x)*k;foco.y+=(foco.oy-foco.y)*k;cam.setViewOffset(innerWidth,innerHeight,foco.x,foco.y,innerWidth,innerHeight)}
    c.update();r.render(cena,cam)});pronto();aviso('Arraste para girar. Toque nos números.',4000);
  window.__cena={abre,raiz,estado,cam,c};
}
// ---------- modo AR ----------
function carregaMotor(){return new Promise((ok,no)=>{const s=document.createElement('script');s.src='vendor/xr.js';s.setAttribute('data-preload-chunks','slam');s.onerror=no;addEventListener('xrloaded',ok,{once:true});document.head.append(s)})}
const pose={p:new THREE.Vector3(),q:new THREE.Quaternion(),s:1,tem:false};
async function modoAR(){
  const semSlam=Q.has('semslam');
  $('inicio').hidden=true;aviso('Preparando a câmera…');
  const dim=()=>{const r=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*r);canvas.height=Math.round(innerHeight*r)};addEventListener('resize',dim);dim();
  try{await carregaMotor()}catch(e){falhou();return}
  const [a,b]=await Promise.all(['esq','dir'].map(k=>fetch(`alvos/${k}.json`).then(r=>r.json())));
  const colocar=({detail:d})=>{
    const sinal=d.name==='pagina_esq'?1:-1,mm=d.scale*d.scaledWidth/210;
    pose.q.set(d.rotation.x,d.rotation.y,d.rotation.z,d.rotation.w);
    const eixo=new THREE.Vector3(1,0,0).applyQuaternion(pose.q);
    pose.p.set(d.position.x,d.position.y,d.position.z).addScaledVector(eixo,sinal*105*mm);pose.s=mm;
    if(!pose.tem){pose.tem=true;raiz.position.copy(pose.p);raiz.quaternion.copy(pose.q);raiz.scale.setScalar(mm);raiz.visible=true;$('mira').hidden=true;$('msg').hidden=true;pronto();fala('intro')}
  };
  XR8.XrController.configure({imageTargetData:[a,b],disableWorldTracking:semSlam});
  XR8.addCameraPipelineModules([XR8.GlTextureRenderer.pipelineModule(),XR8.Threejs.pipelineModule(),XR8.XrController.pipelineModule(),{
    name:'luzeiro',
    onStart(){const {scene,camera}=XR8.Threejs.xrScene();scene.add(raiz);camAtual=camera;camera.position.set(0,2,0);XR8.XrController.updateCameraProjectionMatrix({origin:camera.position,facing:camera.quaternion});$('msg').hidden=true;$('mira').hidden=false},
    onUpdate(){if(pose.tem){const agora=performance.now(),k=1-Math.exp(-(agora-(pose.t||agora-33))/1000*16);pose.t=agora;raiz.position.lerp(pose.p,k);raiz.quaternion.slerp(pose.q,k);raiz.scale.setScalar(raiz.scale.x+(pose.s-raiz.scale.x)*k)}anima()},
    onCameraStatusChange({status}){if(status==='failed')falhou()},
    listeners:[{event:'reality.imagefound',process:colocar},{event:'reality.imageupdated',process:colocar},
      {event:'reality.imagelost',process:()=>{if(semSlam&&pose.tem)aviso('Aponte de novo para a revista',2500)}}]}]);
  XR8.run({canvas,allowedDevices:XR8.XrConfig.device().ANY});
  window.__cena={abre,raiz,estado};
}
function falhou(){aviso('Não foi possível usar a câmera. Abrindo a versão 3D.',3500);setTimeout(()=>{location.search='?modo=rio'},1600)}
function permissoes(){for(const E of [window.DeviceMotionEvent,window.DeviceOrientationEvent])if(E&&E.requestPermission)E.requestPermission().catch(()=>{})}
function destrava(){audio.src='audio/intro.m4a';audio.muted=true;audio.play().then(()=>{audio.pause();audio.currentTime=0;audio.muted=false}).catch(()=>{audio.muted=false})}
carregaBarco().catch(e=>{console.error(e)});
const celular=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Mac/.test(navigator.platform));
if(!celular&&!Q.has('semslam'))$('btAR').hidden=true;
$('btAR').onclick=()=>{permissoes();destrava();modoAR()};
async function modoRio(){if(Q.get('v')!=='1'){location.href='rio/';return}estado.rio=true;$('inicio').hidden=true;$('mira').hidden=true;document.body.classList.add('rio');pronto();
  const {iniciarViagem}=await import('./viagem/viagem.js');await iniciarViagem({MARCOS,canvas,abre,fala,para,estado,painel,$,mostraFoto:zoom});}
$('bt3D').onclick=()=>{destrava();const AC=window.AudioContext||window.webkitAudioContext;if(AC){window.__somCtx=new AC();window.__somCtx.resume&&window.__somCtx.resume()}modoRio()};
if(Q.get('modo')==='pagina')modo3D();else if(Q.get('modo')==='3d'||Q.get('modo')==='rio')modoRio();
