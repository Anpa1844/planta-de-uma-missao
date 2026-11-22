// Rodada 3 · Fundo da tela inicial: a própria "Planta de uma Missão" sob luz de lamparina, em planos lentos (Ken Burns) com fusão longa.
// Leve de propósito: só CSS (transform/opacity) em duas camadas de cada vez, nenhum WebGL. Os planos são recortes pré-gerados
// (mapa/planos/pNN.jpg, 1280 px; pNN_m.jpg, 720 px no celular; ver mapa/planos/gera_planos.py), baixados um de cada vez, só quando vão entrar.
// Movimento reduzido: um plano parado. Aba oculta: pausa. Some quando a pessoa embarca.
const PLANOS=[ // [arquivo, movimento: de → para (x %, y %, escala, rotação em graus)]
  ['02',[2,0,1.10,.3],[-3,1,1.03,-.2]],
  ['03',[-3,-1,1.03,0],[3,1,1.11,.4]],
  ['04',[1,2,1.12,-.3],[-2,-1,1.04,.2]],
  ['05',[-2,1,1.04,.2],[2,-1,1.12,-.3]],
  ['06',[3,0,1.11,0],[-3,0,1.04,.3]],
  ['07',[0,2,1.04,-.2],[0,-2,1.12,.2]],
  ['08',[-4,0,1.06,0],[4,0,1.06,0]],
  ['01',[-2,1,1.04,-.4],[2,-1,1.12,.2]]];
const DUR=13,FUNDE=4.5; // segundos por plano; fusão entre planos

function inicia(alvo){
  const movel=matchMedia('(pointer:coarse)').matches||innerWidth<700,calmo=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const amp=movel?.5:1,suf=movel?'_m':'';
  const st=document.createElement('style');st.textContent=`
#rFundo{position:absolute;inset:0;overflow:hidden;z-index:-1;background:#000;pointer-events:none}
#rInicio{isolation:isolate}
#rFundo .pl{position:absolute;inset:-6%;background:#000 center/cover no-repeat;opacity:0;transition:opacity ${FUNDE}s ease-in-out;will-change:transform,opacity;animation:rKB ${DUR+FUNDE}s linear both;animation-play-state:paused}
#rFundo .pl.on{opacity:1;animation-play-state:running}
#rFundo .pl.sai{opacity:0;animation-play-state:running}
#rFundo.pausa .pl{animation-play-state:paused!important}
@keyframes rKB{from{transform:translate(var(--x0),var(--y0)) scale(var(--s0)) rotate(var(--r0))}to{transform:translate(var(--x1),var(--y1)) scale(var(--s1)) rotate(var(--r1))}}
/* luz de lamparina: brilho quente que deriva devagar (paralaxe contra o mapa), vinheta e escurecimento no centro para o texto */
#rFundo .luz{position:absolute;inset:-20%;background:radial-gradient(ellipse 38% 34% at 50% 40%,rgba(255,170,80,.16),rgba(255,140,60,.05) 55%,transparent 75%);mix-blend-mode:screen;animation:rLuz 23s ease-in-out infinite alternate}
@keyframes rLuz{from{transform:translate(-3%,-1%)}to{transform:translate(3%,2%)}}
#rFundo .veu{position:absolute;inset:0;background:radial-gradient(ellipse 34% 30% at 50% 50%,rgba(0,0,0,.5),rgba(0,0,0,0) 100%),radial-gradient(ellipse 62% 48% at 50% 52%,rgba(0,0,0,.66),rgba(0,0,0,.46) 60%,rgba(0,0,0,.86) 100%),linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 70%,rgba(0,0,0,.55))}
@media (prefers-reduced-motion:reduce){#rFundo .pl{animation:none!important;transform:scale(1.04)}#rFundo .luz{animation:none}}`;
  document.head.append(st);
  const F=document.createElement('div');F.id='rFundo';F.setAttribute('aria-hidden','true');
  const camadas=[0,1].map(()=>{const d=document.createElement('div');d.className='pl';F.append(d);return d});
  const luz=document.createElement('div');luz.className='luz';const veu=document.createElement('div');veu.className='veu';F.append(luz,veu);
  alvo.prepend(F);
  const url=i=>'mapa/planos/p'+PLANOS[i][0]+suf+'.jpg';
  const baixa=i=>new Promise(r=>{const im=new Image();im.decoding='async';try{im.fetchPriority='low'}catch(e){}im.onload=()=>r(true);im.onerror=()=>r(false);im.src=url(i)});
  const poe=(el,i)=>{const [,a,b]=PLANOS[i],s=el.style;s.backgroundImage=`url(${url(i)})`;
    const v=(k,p)=>s.setProperty(k,p);v('--x0',a[0]*amp+'%');v('--y0',a[1]*amp+'%');v('--s0',1+(a[2]-1)*amp);v('--r0',a[3]*amp+'deg');v('--x1',b[0]*amp+'%');v('--y1',b[1]*amp+'%');v('--s1',1+(b[2]-1)*amp);v('--r1',b[3]*amp+'deg');
    el.style.animation='none';void el.offsetWidth;el.style.animation=''};
  let i=0,vez=0,tm=null,vivo=true,resto=DUR*1000,t0=0;
  const troca=async()=>{if(!vivo)return;const n=(i+1)%PLANOS.length;await baixa(n);if(!vivo)return;const cur=camadas[vez],nx=camadas[1-vez];poe(nx,n);nx.classList.remove('sai');void nx.offsetWidth;nx.classList.add('on');cur.classList.remove('on');cur.classList.add('sai');vez=1-vez;i=n;agenda(DUR*1000)};
  const agenda=ms=>{clearTimeout(tm);resto=ms;t0=performance.now();tm=setTimeout(troca,ms)};
  const visto=()=>{if(!vivo)return;if(document.hidden){F.classList.add('pausa');clearTimeout(tm);resto=Math.max(0,resto-(performance.now()-t0))}else{F.classList.remove('pausa');if(!calmo)agenda(resto)}};
  document.addEventListener('visibilitychange',visto);
  const fim=()=>{if(!vivo)return;vivo=false;clearTimeout(tm);document.removeEventListener('visibilitychange',visto);setTimeout(()=>{F.remove();st.remove()},2200)};
  new MutationObserver((_,o)=>{if(alvo.classList.contains('sai')||!alvo.isConnected){o.disconnect();fim()}}).observe(alvo,{attributes:true,attributeFilter:['class']});
  new MutationObserver((_,o)=>{if(!alvo.isConnected){o.disconnect();fim()}}).observe(document.body,{childList:true,subtree:true});
  // o primeiro plano entra assim que chegar (não segura nada: o botão já está na tela e o barco carrega em paralelo)
  baixa(0).then(ok=>{if(!vivo||!ok)return;poe(camadas[0],0);camadas[0].classList.add('on');if(!calmo)agenda(DUR*1000)});
  window.__fundo={get plano(){return PLANOS[i][0]},proximo:()=>{clearTimeout(tm);troca()},fim};
}
// espera a interface montar o #rInicio
const acha=()=>{const el=document.getElementById('rInicio');if(el){inicia(el);return true}return false};
if(!acha()){const o=new MutationObserver(()=>{if(acha())o.disconnect()});o.observe(document.documentElement,{childList:true,subtree:true})}
