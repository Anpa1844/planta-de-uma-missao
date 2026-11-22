// Explorar a Luzeiro I (V6) — página própria, aberta sozinha ou num iframe sobre a viagem. Parâmetros: ?v=45 (versão do modelo; só vale se estiver em modelos.json) &lod=a|b|c &cap=0..4 &p=0..1 (progresso fixo da montagem) &teste=1 &embutido=1
// Modelos: ../barco/luzeiro_v<v>_<lod>.glb (os mesmos da viagem) e glb/luzeiro_v<v>_esqueleto.glb. modelos.json (gerado por atualiza_modelos.py) diz o que existe: nada é pedido às cegas, para não haver 404.
// Coordenadas dos rótulos: as do GLB (x = proa, y = altura, z = boreste), tiradas das caixas dos nós do v45.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {criaProjeto,marcas} from './projeto.js';
const Q=new URLSearchParams(location.search),$=id=>document.getElementById(id);
const VER_PADRAO='47',MOVEL=matchMedia('(pointer:coarse)').matches||innerWidth<700,LOD=(Q.get('lod')||(MOVEL?'c':'a')).replace(/[^abc]/g,'')||'a';
const EMBUTIDO=window.parent!==window||Q.has('embutido');
const cv=$('c'),r=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:!!Q.get('teste')});
r.localClippingEnabled=true;r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.setPixelRatio(Math.min(devicePixelRatio,MOVEL?1.5:2));
const cena=new THREE.Scene(),cam=new THREE.PerspectiveCamera(36,1,0.05,300),oc=new OrbitControls(cam,cv);
oc.enableDamping=true;oc.dampingFactor=.08;oc.maxDistance=40;oc.minDistance=1.2;oc.autoRotateSpeed=.55;
cena.add(new THREE.HemisphereLight(0xfff3df,0x3a2e22,1.35));const sol=new THREE.DirectionalLight(0xffe6c4,2.4);sol.position.set(-6,11,8);cena.add(sol);
const cont=new THREE.DirectionalLight(0x9db6d8,.8);cont.position.set(8,4,-8);cena.add(cont);
{const ce=new THREE.Scene(),g=new THREE.SphereGeometry(50,32,16),cor=new Float32Array(g.attributes.position.count*3),P=g.attributes.position;
 for(let i=0;i<P.count;i++){const t=Math.max(0,Math.min(1,P.getY(i)/50*.5+.5));cor[i*3]=.3+.7*t;cor[i*3+1]=.28+.68*t;cor[i*3+2]=.26+.62*t}
 g.setAttribute('color',new THREE.BufferAttribute(cor,3));ce.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
 cena.environment=new THREE.PMREMGenerator(r).fromScene(ce,.04).texture;cena.environmentIntensity=.8}
// chão discreto (sombra falsa)
{const t=document.createElement('canvas');t.width=t.height=256;const x=t.getContext('2d'),g=x.createRadialGradient(128,128,10,128,128,128);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,256,256);
 const m=new THREE.Mesh(new THREE.PlaneGeometry(22,9),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(t),transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.02;cena.add(m)}
function tam(){const w=innerWidth,h=innerHeight;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}addEventListener('resize',tam);tam();

// ---------- grupos da montagem ----------
// v45: casca = casco, convés, paredes (e a película), teto, forro, caixilhos, vidros, cortinas, portas, escotilha, nome e número
const SKIN=/^(HERO_|LZ_Cabin_Walls|LZ_Cabin_Roof|LZ_Roof_Fascia|LZ_Deck$|LZ_Rail_Cap|LZ_Rub_Rail|LZ_Window_Frames|LZ_Cabin_Trim|LZ_Wall_Grooves|LZ_Keel_Stem|LZ_Name_|LZ_Num_|LZ_Floor_Margin|LZ_Handrail|LZ_Int_Lambri|LZ_Ceiling|LZ_Sash|LZ_Sliding_Hatch|LZ_Aft_Door|LZ40_Curtains)/;
const CORTE=/^(HERO_|LZ_Cabin_Walls|LZ_Cabin_Roof|LZ_Roof_Fascia|LZ_Deck$|LZ_Rail_Cap|LZ_Rub_Rail|LZ_Window_Frames|LZ_Cabin_Trim|LZ_Wall_Grooves|LZ_Keel_Stem|LZ_Name_|LZ_Floor_Margin|LZ_Handrail|LZ_Int_Lambri|LZ_Ceiling|LZ_Sash|LZ_Door_Aft|LZ_Aft_Door|LZ_Searchlight|LZ_Num_|LZ_Sliding_Hatch|LZ40_Curtains|LZ_Rigging|LZ_Cabin_Sole)/;
const FAS=[ // [regex, eixo, lo, hi, s0, s1, esq?]
 [/^SK_(Quilha|Sobrequilha|Roda_Proa|Contra_Roda|Cadaste)/,'x',-6.4,6.4,0,.10,1],
 [/^SK_Cavernas/,'x',-6.4,6.4,.10,.30,1],
 [/^SK_(Travessas_Piso|Vaus_Conv|Sinta|Berco_Motor|Degrau_Mastro|Ferragens)/,'x',-6.4,6.4,.30,.42,1],
 [/^SK_(Tabuado|Pregos_Casco|Espelho_Tabuas)/,'y',.1,2.4,.42,.58,1],
 [/^SK_(Conves_Tabuas|Pregos_Conves)/,'x',-6.4,6.4,.56,.64,1],
 [/^SK_(Cabine_Montantes|Cabine_Soleira|Teto_Vaus)/,'y',1,3.6,.64,.72,1],
 [/^SK_(Cabine_Tabuas|Teto_Tabuas)/,'y',1,3.6,.70,.78,1],
 [/^(HERO_|LZ_Keel_Stem|LZ_Rub_Rail|LZ_Rudder|LZ_Skeg|LZ_Propeller|LZ_Through|LZ_Name_|LZ_Hawse|LZ_Bow_Staff|LZ_Num_)/,'y',.1,2.5,.78,.86,0],
 [/^(LZ_Deck|LZ_Rail_Cap|LZ_Aft_Step|LZ_Floor_Margin)/,'y',1,2.5,.80,.86,0],
 [/^(LZ_Cabin|LZ_Window|LZ_Wall|LZ_Roof|LZ_Int_Lambri|LZ_Ceiling|LZ_Door|LZ_Sash|LZ_Aft_Door|LZ_Front|LZ_Handrail|LZ_Sliding|LZ40_Curtains)/,'y',1,3.6,.84,.92,0],
 [/./,'y',.1,6,.90,1,0]];
const grupos=FAS.map(f=>({re:f[0],ax:f[1],lo:f[2],hi:f[3],s0:f[4],s1:f[5],esq:!!f[6],pl:new THREE.Plane(f[1]==='x'?new THREE.Vector3(-1,0,0):new THREE.Vector3(0,-1,0),f[3]),ms:[],meshes:[]}));
const corte=new THREE.Plane(new THREE.Vector3(0,0,1),1e3); // corte longitudinal (meia-nau por bombordo)
let barco=null,esq=null,skinMs=[],corteMs=[],esqMs=[];
const L=new GLTFLoader(),nm=o=>(o.name||'').replace(/\.\d+$/,'');
function carrega(u,prog){return new Promise((ok,er)=>L.load(u,g=>ok(g.scene),e=>prog&&e.total&&prog(e.loaded/e.total),er))}
function prepara(root,ehEsq){root.traverse(o=>{if(!o.isMesh)return;const n=nm(o);let g=grupos.find(g=>g.re.test(n)&&g.esq===ehEsq)||grupos[grupos.length-1];
  const arr=Array.isArray(o.material),ms=(arr?o.material:[o.material]).map(m=>{const c=m.clone();c.userData.o={t:c.transparent,op:c.opacity,dw:c.depthWrite};return c});o.material=arr?ms:ms[0];
  const cc=!ehEsq&&CORTE.test(n);ms.forEach(m=>{m.clippingPlanes=cc?[g.pl,corte]:[g.pl];m.side=cc?THREE.DoubleSide:m.side;m.clipShadows=true;g.ms.push(m);if(ehEsq)esqMs.push(m);else{if(SKIN.test(n))skinMs.push(m);if(CORTE.test(n))corteMs.push(m)}});o.frustumCulled=false})}
function ghost(a){skinMs.forEach(m=>{const u=m.userData.o;m.transparent=a<1||u.t;m.opacity=u.op*a;m.depthWrite=a>.9?u.dw:false;m.needsUpdate=true})}
function esqAlpha(a){esqMs.forEach(m=>{m.transparent=a<1;m.opacity=a;m.depthWrite=a>.9;m.needsUpdate=true});if(esq)esq.visible=a>0.01}
function secao(on){corte.constant=on?0:1e3}
function progresso(p){grupos.forEach(g=>{const k=Math.max(0,Math.min(1,(p-g.s0)/(g.s1-g.s0)));g.pl.constant=g.lo+(g.hi-g.lo)*k;g.vis=k>0;g.ms.forEach(m=>{m.visible=k>0})})}
// meshes: visibilidade por material não existe no three; escondemos por mesh
function aplicaVis(){grupos.forEach(g=>{g.meshes.forEach(o=>{o.visible=g.vis!==false})})}

// ---------- capítulos, narração e legendas ----------
const CAPS=[{id:'bm_barco',t:'O barco',modo:'ext'},{id:'bm_construcao',t:'Como foi construída',modo:'montagem'},{id:'bm_raiox',t:'Raio-X da estrutura',modo:'raiox'},{id:'bm_dentro',t:'Por dentro, cômodo por cômodo',modo:'dentro'},{id:'livre',t:'Explore à vontade',modo:'livre'}];
let TJ=[],MARC=[],PJ=null,modoV='normal',modoAuto=true,rxTemp=false;let ROT=null,cap=-1,capT=0,dur=45,falas=[],pausa=false,aud=null,mudo=false,pFixo=Q.get('p')!==null?+Q.get('p'):null;
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const orb=(az,el,rad,alvo)=>[V3(alvo[0]+rad*Math.cos(el)*Math.cos(az),alvo[1]+rad*Math.sin(el),alvo[2]+rad*Math.cos(el)*Math.sin(az)),V3(...alvo)];
let voo=null,livreDentro=false;function voa(pos,tgt,d=2.4){voo={p0:cam.position.clone(),t0:oc.target.clone(),p1:pos,t1:tgt,t:0,d}}
const suav=t=>t*t*(3-2*t);
// "Por dentro": a câmera fica a bombordo, do lado cortado, e anda de cômodo em cômodo. Cada chave é [frase da narração, posição, alvo];
// o tempo de cada chave é o início real da frase em audio/bm_dentro.json (chega 0,6 s antes). Sem o json, vale a divisão por tamanho de frase.
const CAMDENTRO=[[0,[3.9,3.3,-7.4],[2.5,1.9,0]],[1,[1.9,3.2,-6.6],[1.2,1.7,.2]],[2,[1.6,3.5,-6.2],[1.3,2.3,.4]],[3,[-2.9,3.1,-6.4],[-2.9,1.5,0]],[4,[-1.5,3.2,-6.2],[-1.5,1.9,0]],[5,[-4.4,3.2,-6.2],[-4.3,1.9,0]],[6,[2.5,2.75,-2.9],[1.6,1.85,-.15]]];
let tDentro=[];
function camDentro(t){const K=CAMDENTRO,n=K.length;if(tDentro.length<n)return;let i=0;while(i<n-1&&t>=tDentro[i+1]-.6)i++;if(i===0){cam.position.set(...K[0][1]);oc.target.set(...K[0][2]);return}
 const k=suav(Math.max(0,Math.min(1,(t-(tDentro[i]-.6))/2.2)));cam.position.lerpVectors(V3(...K[i-1][1]),V3(...K[i][1]),k);oc.target.lerpVectors(V3(...K[i-1][2]),V3(...K[i][2]),k)}
function mostraLeg(t){let acc=0,txt='';for(let i=0;i<falas.length;i++){const d=falas[i].d;if(t>=acc&&t<acc+d+.6){txt=falas[i].tx;break}acc+=d}$('eLeg').textContent=txt}
async function carregaFalas(i){const c=CAPS[i];falas=[];dur=40;if(aud){aud.pause();aud=null}if(!ROT)ROT=await fetch('roteiro_barco.json').then(r=>r.json()).catch(()=>({capitulos:[]}));
 const rc=ROT.capitulos.find(x=>x.id===c.id);if(!rc)return;
 let tj=null;try{tj=await fetch('audio/'+c.id+'.json').then(r=>r.ok?r.json():null)}catch(e){}
 if(tj&&tj.length){const ends=tj.map((x,k)=>k<tj.length-1?tj[k+1].t:x.t+3);falas=tj.map((x,k)=>({tx:x.texto,d:ends[k]-x.t}))}
 else falas=rc.falas.map(tx=>({tx,d:Math.max(2.6,tx.length*.075)}));
 dur=falas.reduce((s,f)=>s+f.d,0)+1;
 /* rodada 3: tempos reais das frases → marcas de raio-X (frase → partes) e ritmo da montagem */{let a=.15;const tt=(tj&&tj.length)?tj:falas.map(f=>{const o={t:a,texto:f.tx};a+=f.d;return o});TJ=tt;MARC=marcas(tt,dur)}
 if(c.modo==='dentro'){let a=(tj&&tj.length)?tj[0].t:0;tDentro=falas.map((f,k)=>{const t=(tj&&tj[k])?tj[k].t:a;a=t+f.d;return t})}
 if(aud){aud.pause();aud=null}const a=new Audio('audio/'+c.id+'.mp3');a.onerror=()=>{aud=null};a.oncanplay=()=>{if(a.duration&&isFinite(a.duration)){aud=a;dur=Math.max(dur,a.duration)}};a.muted=mudo;a.load();aud=a;if(!pausa)a.play().catch(()=>{})}
async function iniciaCap(i){cap=i;capT=0;livreDentro=false;const c=CAPS[i];document.querySelectorAll('#eCaps [data-c]').forEach(b=>b.classList.toggle('on',+b.dataset.c===i));$('eCap').textContent=c.t;$('eLeg').textContent='';$('eAviso').hidden=!(c.modo==='montagem'||c.modo==='raiox');$('eBarraAnim').hidden=!(c.modo==='montagem'||c.modo==='dentro');esconde();
 if(PJ){PJ.liga(false);PJ.desligaRealce();PJ.soltaCamera()}rxTemp=false;if(modoAuto||modoV==='projeto'&&c.modo!=='montagem')modoV=c.modo==='raiox'?'raiox':'normal';marcaModo();if(PJ&&modoV==='projeto')PJ.liga(true);
 secao(c.modo==='dentro');esqAlpha(c.modo==='raiox'||c.modo==='montagem'||modoV==='raiox'?1:0);ghost(c.modo==='raiox'||modoV==='raiox'?.1:1);oc.autoRotate=false;
 if(c.modo==='ext'){progresso(1);const o=orb(-2.2,.22,17,[0,1.8,0]);voa(o[0],o[1],2.6);oc.autoRotate=true}
 if(c.modo==='montagem'){progresso(0);const o=orb(-2.5,.35,15,[0,1.8,0]);voa(o[0],o[1],2.2);oc.autoRotate=true;oc.autoRotateSpeed=.35}
 if(c.modo==='raiox'){progresso(1);aplicaVis();const o=orb(-2.4,.3,13,[0,1.6,0]);voa(o[0],o[1],2.6);oc.autoRotate=true;oc.autoRotateSpeed=.45}
 if(c.modo==='dentro'){progresso(1);aplicaVis();skinMs.length;voa(V3(...CAMDENTRO[0][1]),V3(...CAMDENTRO[0][2]),2)}
 if(c.modo==='livre'){progresso(1);aplicaVis();secao(true);const o=orb(-1.9,.42,15,[0,1.8,0]);voa(o[0],o[1],2.2);esqAlpha(0)}
 await carregaFalas(i);atualizaRotulos()}
// ---------- rótulos e fichas ----------
// Posições em coordenadas do GLB v45 (x proa, y altura, z boreste), conferidas pelas caixas dos nós SK_* (esqueleto) e LZ40_* (interior).
const TECNICO=[ // [nome, x,y,z, titulo, texto, tag, fonte]
 ['Quilha',0.5,.2,0,'Quilha de pau-d\'arco','A quilha é a espinha do barco. As fontes dizem pau-d\'arco; as dimensões aqui são uma reconstrução.','FONTE+RECONSTRUÇÃO','Wearner 1988; Torres Neto'],
 ['Cavernas',-1,.95,-1.5,'Cavernas de piquiá','As cavernas sobem da quilha como costelas, em piquiá. O espaçamento e a forma exatos são reconstrução.','FONTE+RECONSTRUÇÃO','Wearner 1988; Torres Neto'],
 ['Tabuado',1.5,.85,-1.75,'Tabuado de itaúba','O costado é de tábuas de itaúba, aplicadas sobre as cavernas. A itaúba é tão pesada que não flutua: foi serrada no próprio estaleiro.','FONTE','Torres Neto, O Adventismo no Brasil'],
 ['Roda de proa',5.3,1.0,0,'Roda de proa e contra-roda','Peças que fecham o casco na proa. O Mestre Afonso chegou a duvidar que uma proa assim flutuasse.','FONTE+RECONSTRUÇÃO','Torres Neto; Encyclopedia of SDA'],
 ['Cadaste',-5.55,.65,0,'Cadaste e leme','Peça vertical de popa onde se prende o leme.','RECONSTRUÇÃO','dedução pelas fotos do casco'],
 ['Vaus do convés',4.4,1.85,-.5,'Vaus do convés','Travessas que seguram o convés e travam os dois lados do casco.','RECONSTRUÇÃO','dedução'],
 ['Sinta',-1,1.31,1.5,'Sinta (longarina de borda)','Longarina que corre por dentro do costado, ligando as cavernas por cima.','RECONSTRUÇÃO','dedução'],
 ['Berço do motor',-2.85,.65,-.28,'Berço do motor','Duas longarinas sobre o fundo que seguram o motor diesel de 20 hp.','RECONSTRUÇÃO','motor: Wearner 1988; posição: dedução'],
 ['Teto',0,2.97,0,'Vaus e tábuas do teto','O teto é arqueado, de tábuas sobre vaus curvos.','RECONSTRUÇÃO','dedução pelas fotos do forro'],
 ['Paredes',1.9,2.2,-1.44,'Parede de tábuas verticais','Montantes e tábuas verticais (lambri) formam as paredes da cabine. Por dentro, o acabamento é de cedro.','FONTE+RECONSTRUÇÃO','Torres Neto (cedro); fotos']];
const HOTS=[ // [x,y,z; titulo; texto; tag; fonte]
 [3.3,1.95,-.77,'O timão','O timão ficava na sala da frente, que era também sala de estar, sala de jantar, sala de navegação e quarto. Jessie também pilotava: quando navegavam a noite inteira, ela assumia o timão das 20 h à meia-noite.','FONTE','Wearner 1988, pp. 41 e 46–47'],
 [2.0,1.74,-1.15,'Mesa e bancos','Bancos fixos nas duas paredes, com gavetas embaixo; serviam de cama para visitas. A mesa era removível, para liberar o espaço.','FONTE','Encyclopedia of SDA (Halliwell)'],
 [1.35,2.6,1.1,'Camas suspensas','As camas ficavam suspensas: à noite presas ao teto e à parede, de dia recolhidas com correntes. A forma exata aqui é reconstrução.','FONTE+RECONSTRUÇÃO','Wearner 1988'],
 [-.68,2.78,-.85,'Armário e geladeira','A geladeira de vacinas veio com a reforma de 1937. Segundo Wearner, o barco original não tinha refrigeração; a Enciclopédia já lista geladeira na descrição.','FONTE (versões divergem)','Wearner 1988; Encyclopedia of SDA'],
 [-2.9,1.9,0,'Casa de máquinas','Atrás da sala vinha a casa de máquinas: motor diesel de 20 hp, de dois cilindros, à vista. O volante não era protegido. A altura exata e a tampa são reconstrução.','FONTE+RECONSTRUÇÃO','Halliwell 1959; Wearner 1988'],
 [-2.75,1.55,-.9,'Gerador','A luz elétrica vinha de um gerador a gasolina, que também alimentava o projetor e o órgão portátil das reuniões ao ar livre.','FONTE','Encyclopedia of SDA'],
 [-1.55,2.4,-.9,'Vestiário e sanitário','Depois da casa de máquinas vinham o vestiário, o sanitário e o chuveiro.','FONTE','Encyclopedia of SDA'],
 [-4.3,2.05,-.95,'Cozinha','Na popa, a cozinha, com armário e fogão a querosene.','FONTE','Encyclopedia of SDA; Wearner 1988'],
 [-4.15,2.55,1.1,'Remédios','O barco levava remédios e mantimentos para seis meses de viagem. Onde exatamente ficavam guardados é reconstrução.','FONTE+RECONSTRUÇÃO','Encyclopedia of SDA'],
 [-2.85,2.6,.6,'Cano de escape','A fumaça do motor sobe por este cano revestido, à esquerda de quem olha para a popa, até o teto.','RECONSTRUÇÃO','foto L31 (museu)'],
 [-2.5,3.62,0,'Tambores de combustível','Cerca de 500 galões de óleo, em dez tambores, no teto. (Outra fonte fala em tanques sob o convés: as versões divergem.)','FONTE (versões divergem)','Encyclopedia of SDA; Halliwell 1959'],
 [1.695,2.12,-.195,'A lanterna a óleo','Esta lanterna ficava sobre a mesa; a luz do forro vinha do gerador.','RECONSTRUÇÃO','pedido de reconstrução do projeto'],
 [1.1,1.78,.12,'O mapa e a Bíblia','O mapa "Planta de uma Missão" e a Bíblia aberta estão sobre a mesa como na abertura da viagem. É uma cena composta para o projeto, não um registro fotográfico.','RECONSTRUÇÃO','cena composta para o projeto']];
const rot=[];function monta(lista,cls,fn){lista.forEach(it=>{const d=document.createElement('div');d.className='rot '+cls;d.textContent=it.nome;d.onclick=()=>fn(it);$('eRotulos').append(d);it.el=d;rot.push(it)})}
monta(TECNICO.map(t=>({nome:t[0],p:V3(t[1],t[2],t[3]),ficha:t,kind:'tec'})),'', it=>ficha(it.ficha[4],it.ficha[5],it.ficha[6],it.ficha[7]));
monta(HOTS.map(h=>({nome:h[3],p:V3(h[0],h[1],h[2]),ficha:[0,0,0,0,h[3],h[4],h[5],h[6]],kind:'hot'})),'pt',it=>{ficha(it.ficha[4],it.ficha[5],it.ficha[6],it.ficha[7]);livreDentro=true;oc.autoRotate=false;secao(true);voa(V3(it.p.x+.9,Math.max(2.6,it.p.y+1.0),-4.6),it.p.clone(),1.6)});
function ficha(t,p,tag,fonte){const c=$('eCard');c.hidden=false;c.querySelector('h3').textContent=t;c.querySelector('p').textContent=p;const g=c.querySelector('.tag');g.textContent=tag;g.className='tag'+(tag.includes('RECONSTR')?' rec':'');c.querySelector('.fonte').textContent='Fonte: '+fonte}

const NUMEROS="• Peso (deslocamento de projeto): 7 a 8 toneladas, conforme a fonte. [FONTE]\n• Velocidade de projeto: 9 nós, cerca de 17 km/h. [FONTE] Carregada e contra a correnteza, provavelmente bem menos. [ESTIMATIVA]\n• Medidas: de 9 a 11 m de comprimento, cerca de 3 a 3,5 m de largura, 0,76 a 0,85 m de calado; as fontes divergem. [FONTE]\n• Madeira serrada: possivelmente de 3 a 5 m³ no casco, no convés e na cabine, ou seja, de 3 a 5 toneladas, pois itaúba, piquiá e pau-d'arco são madeiras densas. [ESTIMATIVA a partir do modelo 3D]\n• Pregos e parafusos: possivelmente de 2 mil a 4 mil, só no tabuado e no convés. [ESTIMATIVA]\n• Peso carregada: possivelmente 9 a 10 toneladas, somando cerca de 500 galões de óleo (uns 1,5 a 1,9 t), mantimentos, remédios e a equipe. [ESTIMATIVA]\n\nTudo marcado como ESTIMATIVA é só possibilidade: nenhum levantamento do casco original foi encontrado.";
$('eNum').onclick=()=>ficha('A Luzeiro em números',NUMEROS,'FONTE + ESTIMATIVA','Wearner 1988; Encyclopedia of SDA; Torres Neto; cálculo sobre o modelo 3D');
function esconde(){$('eCard').hidden=true}$('eCard').querySelector('.fecha').onclick=esconde;
function atualizaRotulos(){const m=CAPS[cap]&&CAPS[cap].modo;rot.forEach(it=>{it.mostra=(it.kind==='tec'&&m==='raiox')||(it.kind==='hot'&&(m==='dentro'||m==='livre'))})}
const pv=new THREE.Vector3();function posRotulos(){const w=innerWidth,h=innerHeight;rot.forEach(it=>{if(!it.mostra){it.el.classList.add('fora');return}pv.copy(it.p).project(cam);const ok=pv.z<1&&pv.z>-1&&Math.abs(pv.x)<1.05&&Math.abs(pv.y)<1.05;it.el.classList.toggle('fora',!ok);if(ok){it.el.style.left=((pv.x*.5+.5)*w)+'px';it.el.style.top=((-pv.y*.5+.5)*h)+'px'}})}
// ---------- vídeos ilustrativos (opcional: videos/videos.json) ----------
let VID=[]; // carregado em ini(), só se modelos.json disser videos:true (os vídeos ainda não existem)
$('eVideo').onclick=()=>{const v=$('eVideo').querySelector('video'),t=$('eVideoTela');t.querySelector('video').src=v.src;t.hidden=false;t.querySelector('video').play()};
$('eVideoTela').querySelector('button').onclick=()=>{const t=$('eVideoTela');t.querySelector('video').pause();t.hidden=true};
// ---------- rodada 3: modos de vista (Normal / Raio-X / Projeto naval) e o raio-X que segue a fala ----------
// pFala: a montagem anda no ritmo das frases do capítulo 2 (quilha → cavernas → vigas e tabuado → cabine/convés/acabamento), não no relógio
function pFala(t,f){if(!TJ||TJ.length<6||CAPS[cap].id!=='bm_construcao')return f;const T=k=>TJ[Math.min(k,TJ.length-1)].t;
 const K=[[0,0],[T(2),0],[T(3),.10],[T(4),.30],[T(4)+(T(5)-T(4))*.45,.42],[T(5),.58],[T(6),1]];if(t>=K[6][0])return 1;let i=0;while(i<K.length-2&&t>=K[i+1][0])i++;
 const k=Math.max(0,Math.min(1,(t-K[i][0])/Math.max(.01,K[i+1][0]-K[i][0])));return K[i][1]+(K[i+1][1]-K[i][1])*k}
function marcaModo(){document.querySelectorAll('#eModos [data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m===modoV))}
function reaplica(){const c=CAPS[cap];if(!c)return;secao(c.modo==='dentro'||(c.modo==='livre'));const rx=modoV==='raiox'||c.modo==='raiox';esqAlpha(rx||c.modo==='montagem'?1:0);ghost(rx?.1:1)}
function trocaModo(m,pessoa){if(pessoa)modoAuto=false;if(!PJ)return;const de=modoV;modoV=m;marcaModo();rxTemp=false;
 if(m==='projeto'){PJ.liga(true);esconde()}else{PJ.liga(false);if(de==='projeto'||m!==de)reaplica();if(m==='normal')PJ.desligaRealce();else PJ.soltaCamera()}}
function ativosEm(t){let ps=[];for(const mk of MARC){if(mk[0]>t)break;ps=t<mk[2]+1.6?mk[1]:[]}return ps}
function modos(dt,c){const ps=ativosEm(capT),tNow=performance.now()/1000;
 if(modoV==='projeto'){PJ.atualizaProjeto(dt,pausa);PJ.realca(ps,false);PJ.pintaRealce(tNow,true);return}
 if(c.modo==='dentro'){PJ.desligaRealce();return}
 // em "Normal", uma fala sobre a estrutura liga um raio-X de passagem (casco fantasma) e desliga quando a frase acaba
 if(modoV==='normal'){const quer=ps.length>0&&c.modo!=='montagem';if(quer!==rxTemp){rxTemp=quer;esqAlpha(quer?1:0);ghost(quer?.1:1);if(!quer)PJ.desligaRealce()}if(!quer&&c.modo!=='montagem')return}
 PJ.realca(ps,c.modo!=='livre');PJ.pintaRealce(tNow,true)}
// ---------- laço ----------
const rel=new THREE.Clock();let pronto=false,parado=false,pausaAntes=false,rafId=0;
function laco(){rafId=requestAnimationFrame(laco);const dt=Math.min(.05,rel.getDelta());
 if(voo){voo.t+=dt/voo.d;const k=suav(Math.min(1,voo.t));cam.position.lerpVectors(voo.p0,voo.p1,k);oc.target.lerpVectors(voo.t0,voo.t1,k);if(voo.t>=1)voo=null}
 if(pronto&&cap>=0){const c=CAPS[cap];if(!pausa)capT=(aud&&aud.currentTime>0&&!aud.paused)?aud.currentTime:capT+dt;const f=Math.min(1,capT/dur);
  mostraLeg(capT);$('eBarraAnim').firstChild.style.width=(f*100)+'%';
  if(c.modo==='montagem'){const p=pFixo!==null?pFixo:pFala(capT,f);progresso(p);aplicaVis();if(modoV==='normal'){esqAlpha(p>.95?Math.max(0,1-(p-.95)/.05):1);ghost(p>.78&&p<.95?.55:1)}}
  if(PJ)modos(dt,c)
  if(c.modo==='dentro'&&!voo&&!livreDentro)camDentro(capT)}
 if(!(PJ&&PJ.naProjeto))oc.update();posRotulos();r.render(cena,cam)}
function liga(){document.querySelectorAll('#eCaps [data-c]').forEach(b=>b.onclick=()=>iniciaCap(+b.dataset.c));
 document.querySelectorAll('#eModos [data-m]').forEach(b=>b.onclick=()=>trocaModo(b.dataset.m,true));
 $('ePausa').onclick=()=>{pausa=!pausa;$('ePausa').textContent=pausa?'▶':'⏸';if(aud)pausa?aud.pause():aud.play().catch(()=>{})};
 $('eMudo').onclick=()=>{mudo=!mudo;$('eMudo').textContent=mudo?'🔇':'🔊';if(aud)aud.muted=mudo};
 oc.addEventListener('start',()=>{oc.autoRotate=false;voo=null;livreDentro=true});}
// ---------- parar e retomar (aba escondida, ou a viagem que nos abriu num iframe) ----------
function para(){if(parado)return;parado=true;cancelAnimationFrame(rafId);pausaAntes=pausa;if(aud)aud.pause();const t=$('eVideoTela');t.querySelector('video').pause()}
function retoma(){if(!parado)return;parado=false;rel.getDelta();if(aud&&!pausaAntes&&cap>=0&&capT<dur-.3)aud.play().catch(()=>{});laco()}
let paradoPai=false;document.addEventListener('visibilitychange',()=>{document.hidden?para():(paradoPai||retoma())});
addEventListener('message',e=>{const d=e.data;if(!d||typeof d!=='object')return;if(d.tipo==='luzeiro:parar'){paradoPai=true;para()}else if(d.tipo==='luzeiro:retomar'){paradoPai=false;if(!document.hidden)retoma()}});
{const v=$('eVolta');v.onclick=e=>{if(aud){aud.pause()}if(EMBUTIDO){e.preventDefault();paradoPai=true;para();window.parent.postMessage({tipo:'luzeiro:voltar'},'*')}};
 // qualquer toque aqui dentro avisa a viagem (para o reinício automático dela não disparar enquanto a pessoa explora)
 if(EMBUTIDO){let u=0;for(const ev of['pointerdown','pointermove','keydown','wheel'])addEventListener(ev,()=>{const a=performance.now();if(a-u>1500){u=a;window.parent.postMessage({tipo:'luzeiro:atividade'},'*')}},{passive:true})}}
function giraMesa(root){const acha=re=>{let r=null;root.traverse(o=>{if(!r&&re.test(o.name))r=o});return r};
 for(const re of [/LZ40_Map_Table/i,/LZ40_Bible_Open/i]){const o=acha(re);if(!o||!o.parent)continue;o.updateMatrix();const b=new THREE.Box3(),M=new THREE.Matrix4();
  o.traverse(m=>{if(!m.isMesh)return;const ch=[];for(let n=m;n&&n!==o.parent;n=n.parent)ch.unshift(n);M.identity();for(const k of ch){k.updateMatrix();M.multiply(k.matrix)}m.geometry.computeBoundingBox();b.union(m.geometry.boundingBox.clone().applyMatrix4(M))});
  if(b.isEmpty())continue;const c=b.getCenter(new THREE.Vector3());new THREE.Matrix4().makeTranslation(c.x,c.y,c.z).multiply(new THREE.Matrix4().makeRotationY(Math.PI)).multiply(new THREE.Matrix4().makeTranslation(-c.x,-c.y,-c.z)).multiply(o.matrix).decompose(o.position,o.quaternion,o.scale)}}
async function ini(){
 const bar=$('eBarra').firstChild;
 // modelos.json: {versoes:{"45":{lods:["a","b","c"],esqueleto:true}},videos:false}. Versão pedida que não existe cai na padrão, sem pedir arquivo que falta.
 const IND=await fetch('modelos.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)||{versoes:{[VER_PADRAO]:{lods:['a','b','c'],esqueleto:true}},videos:false};
 let VER=(Q.get('v')||VER_PADRAO).replace(/[^\w.]/g,'');if(!IND.versoes[VER]){console.info('modelo v'+VER+' não está em modelos.json; usando v'+VER_PADRAO);VER=VER_PADRAO}
 const iv=IND.versoes[VER],lod=iv.lods.includes(LOD)?LOD:iv.lods[0],vEsq=iv.esqueleto?VER:(IND.versoes[VER_PADRAO]&&IND.versoes[VER_PADRAO].esqueleto?VER_PADRAO:null);
 if(IND.videos)fetch('videos/videos.json').then(r=>r.ok?r.json():[]).then(v=>VID=v).catch(()=>{});
 barco=await carrega('../barco/luzeiro_v'+VER+'_'+lod+'.glb',p=>bar.style.width=(p*70)+'%');esq=vEsq?await carrega('glb/luzeiro_v'+vEsq+'_esqueleto.glb',p=>bar.style.width=(70+p*30)+'%'):new THREE.Group();
 window.__ex.modelo={ver:VER,lod,esqueleto:vEsq};
 /* rodada 3: a planta e a Bíblia giradas 180° na mesa, como na viagem (lêem certo de quem está na cabine) */giraMesa(barco);
 prepara(barco,false);prepara(esq,true);cena.add(barco);cena.add(esq);
 [barco,esq].forEach(root=>root.traverse(o=>{if(!o.isMesh)return;const n=nm(o);const g=grupos.find(g=>g.re.test(n)&&g.esq===(root===esq))||grupos[grupos.length-1];g.meshes.push(o)}));
 progresso(1);aplicaVis();esqAlpha(0);PJ=criaProjeto({cena,cam,oc,r,barco,esq,grupos,voa,nm,esqAlpha});window.__ex.projeto={medidas:PJ.MED,faltam:PJ.faltam};liga();pronto=true;
 oc.target.set(0,1.8,0);cam.position.set(-12,5,-12);
 $('eCarregaT').textContent='Pronto.';const b=$('eEntra');b.hidden=false;b.onclick=()=>{$('eCarrega').classList.add('sai');iniciaCap(Q.get('cap')!==null?+Q.get('cap'):0)};
 if(Q.get('teste')){$('eCarrega').classList.add('sai');iniciaCap(+(Q.get('cap')||0))}
 window.__pronto=true}
window.__ex={get estado(){return {cap,capT:+capT.toFixed(2),dur:+dur.toFixed(2),parado,pausa,tocando:!!(aud&&!aud.paused),leg:$('eLeg').textContent,embutido:EMBUTIDO}},rotulos:()=>rot.filter(i=>i.mostra&&!i.el.classList.contains('fora')).map(i=>i.nome),cap:iniciaCap,p:v=>{pFixo=v},info:()=>({tri:r.info.render.triangles,chamadas:r.info.render.calls}),vaiPara:t=>{/* teste: o servidor local não aceita saltar no áudio; pausa a voz e o relógio do capítulo segue sozinho a partir de t */if(aud)aud.pause();capT=t},modo:m=>trocaModo(m,true),get marcas(){return MARC},get pj(){return PJ},vista:()=>PJ&&PJ.vista(),proximaVista:()=>PJ&&PJ.pula(),cam:(p,t)=>{voo=null;oc.autoRotate=false;cam.position.set(...p);oc.target.set(...t);oc.update()},ghost,secao,esqAlpha};
laco();ini().catch(e=>{$('eCarregaT').textContent='Erro: '+e;window.__erro=String(e);window.__pronto=true});
