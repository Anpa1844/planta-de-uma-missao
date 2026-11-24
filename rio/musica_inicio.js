// Música-tema da tela inicial: a trilha oficial ("Rebirth", Yuriy Leontiev) em laço, só enquanto o #rInicio está na tela.
// Independente do main.js (como fundo_inicio.js): não segura o botão "Iniciar" nem o pré-carregamento do barco.
// · Arquivo: audio/trilha/menu.mp3 (53,05 s; laço sem emenda loopStart 4,55 → loopEnd 52,55; ver audio/trilha/MONTAGEM_TRILHA.md).
// · Autoplay: tenta tocar ao carregar (só se o navegador deixa: getAutoplayPolicy ou um teste com áudio mudo, sem aviso no console);
//   se não deixa, toca no PRIMEIRO gesto do visitante em qualquer ponto da tela (toque, clique, tecla), com entrada de 2 s,
//   e mostra uma pista discreta no canto. O toque em "Iniciar a viagem" funciona normalmente (nada é bloqueado).
// · "Iniciar" e "Explorar a Luzeiro I": a música sai em ~1,8 s e dá lugar à abertura; ao voltar do Explorar, volta.
// · Botão de música no canto (aria-label, aria-pressed); a escolha fica na sessão (sessionStorage).
// · Não toca: ?kiosk=1 (telão: a viagem recomeça direto), ?semmusica=1, ?teste (sem ?titulo), música desligada pelo visitante.
// · __musicaInicio.estado() devolve o estado para os testes.
const Q=new URLSearchParams(location.search);
const ARQ='audio/trilha/menu.mp3',LACO_INI=4.55,LACO_FIM=52.55,NIVEL=1,ENTRA=2,CHAVE='rio6_musica_inicio';
const DESLIGA=Q.get('kiosk')==='1'||Q.get('semmusica')==='1'||(Q.has('teste')&&!Q.has('titulo'));
const le=k=>{try{return sessionStorage.getItem(k)}catch(e){return null}};
const grava=(k,v)=>{try{sessionStorage.setItem(k,v)}catch(e){}};
const calmo=matchMedia('(prefers-reduced-motion: reduce)').matches||Q.has('calmo');

function monta(ini){
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const st=document.createElement('style');st.textContent=`
#rMusIni{position:absolute;top:max(14px,env(safe-area-inset-top));right:max(14px,env(safe-area-inset-right));z-index:2;display:flex;align-items:center;gap:10px;flex-direction:row-reverse;transition:opacity .6s}
#rMusIni button{position:relative;width:44px;height:44px;border-radius:50%;background:rgba(10,20,18,.58);border:1px solid rgba(233,199,126,.42);display:grid;place-items:center;color:var(--papel)}
#rMusIni button:focus-visible{outline:2px solid var(--ouro);outline-offset:3px}
#rMusIni svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
#rMusIni .on,#rMusIni .off{display:none}#rMusIni[data-estado=tocando] .on,#rMusIni[data-estado=bloqueado] .on,#rMusIni[data-estado=carregando] .on{display:inline}#rMusIni[data-estado=mudo] .off{display:inline}
#rMusIni[data-estado=mudo] button{opacity:.7}
#rMusIni .dica{font-size:12px;letter-spacing:.1em;color:#cfc8b6;white-space:nowrap;text-shadow:0 1px 4px #000;opacity:0;transform:translateX(6px);transition:opacity .6s,transform .6s;pointer-events:none}
#rMusIni[data-estado=bloqueado] .dica{opacity:1;transform:none}
#rMusIni[data-estado=bloqueado] button::after{content:"";position:absolute;inset:-1px;border-radius:50%;border:1px solid var(--ouro);animation:rMusPulso 2.4s ease-out infinite;pointer-events:none}
@keyframes rMusPulso{0%{transform:scale(1);opacity:.75}70%,100%{transform:scale(1.55);opacity:0}}
#rMusIni[data-estado=bloqueado] .onda{animation:rMusOnda 2.4s ease-in-out infinite}
@keyframes rMusOnda{0%,100%{opacity:.35}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){#rMusIni[data-estado=bloqueado] button::after,#rMusIni[data-estado=bloqueado] .onda{animation:none}#rMusIni[data-estado=bloqueado] button::after{opacity:.5}#rMusIni .dica{transition:none}}
body.calmo #rMusIni[data-estado=bloqueado] button::after,body.calmo #rMusIni[data-estado=bloqueado] .onda{animation:none}
@media (max-width:420px){#rMusIni .dica{font-size:11px;letter-spacing:.06em}}`;
  document.head.append(st);if(calmo)document.body.classList.add('calmo');
  const W=document.createElement('div');W.id='rMusIni';W.dataset.estado='carregando';
  W.innerHTML=`<button type=button aria-pressed=false aria-label="Ouvir a trilha do evento"><svg viewBox="0 0 24 24" aria-hidden=true><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><g class=on><path class=onda d="M15.5 9.2a4 4 0 0 1 0 5.6"/><path class=onda d="M18 6.8a7.4 7.4 0 0 1 0 10.4"/></g><g class=off><path d="M16 9.5l5 5M21 9.5l-5 5"/></g></svg></button><span class=dica aria-hidden=true>Toque para ouvir a trilha</span>`;
  ini.append(W);const bt=W.querySelector('button');
  // ---------- estado ----------
  let an=null,c=null,g=null,src=null,buf=null,bufP=null,quer=le(CHAVE)!=='off',liberado=false,pedido=false,tocando=false,saiu=false,fora=false,tIni=0;
  const viva=()=>!saiu&&ini.isConnected&&!ini.classList.contains('sai');
  const mostra=()=>{const e=saiu?'saiu':!quer?'mudo':(tocando||(fora&&pedido))?'tocando':(pedido&&liberado)?'carregando':'bloqueado';W.dataset.estado=e;
    bt.setAttribute('aria-pressed',String(e==='tocando'||e==='carregando'));
    bt.setAttribute('aria-label',e==='mudo'?'Ligar a música':e==='bloqueado'?'Ouvir a trilha do evento':'Desligar a música');bt.title=bt.getAttribute('aria-label')};
  // baixa e decodifica em segundo plano (prioridade baixa); a decodificação usa um contexto offline, sem pedir permissão de áudio
  const baixa=()=>bufP||(bufP=fetch(ARQ,{priority:'low'}).then(r=>r.ok?r.arrayBuffer():Promise.reject(new Error('sem '+ARQ))).then(a=>{
      const O=window.OfflineAudioContext||window.webkitOfflineAudioContext;const dc=c||(O?new O(2,1,44100):null);if(!dc)return Promise.reject(new Error('sem decodificador'));
      return new Promise((ok,no)=>{const p=dc.decodeAudioData(a,ok,no);if(p&&p.catch)p.catch(no)})}).then(b=>{buf=b;return b}).catch(e=>{bufP=null;return null}));
  const curva=(sobe,n=33)=>{const a=new Float32Array(n);for(let i=0;i<n;i++){const q=i/(n-1);a[i]=NIVEL*(sobe?Math.sin(q*Math.PI/2):Math.cos(q*Math.PI/2))}return a};
  const rampa=(alvo,dur)=>{if(!g)return;const t=c.currentTime,v=g.gain.value;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(v,t);
    if(alvo>v){const n=33,a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=v+(alvo-v)*Math.sin(i/(n-1)*Math.PI/2);g.gain.setValueCurveAtTime(a,t+.01,dur)}else g.gain.setTargetAtTime(alvo,t,dur/4.5)};
  const criaCtx=()=>{if(c)return c;try{c=new AC({latencyHint:'playback'})}catch(e){try{c=new AC()}catch(_){return null}}g=c.createGain();g.gain.value=0;g.connect(c.destination);if(Q.has('medir')){an=c.createAnalyser();an.fftSize=4096;g.connect(an)}
    c.onstatechange=()=>{if(!c||saiu)return;if(c.state==='running'){liberado=true;solta();if(pedido)toca();mostra()}};return c};
  const acorda=()=>{if(c&&c.state!=='running'&&c.state!=='closed'){const p=c.resume();p&&p.catch&&p.catch(()=>{})}};
  // liga a fonte (uma vez) e sobe o volume; se o arquivo ainda não chegou, espera por ele
  const toca=async()=>{if(!pedido||!quer||!viva()||fora||document.hidden||!c||c.state!=='running')return;
    if(!buf){await baixa();if(!buf||!pedido||!quer||!viva()||fora||!c||c.state!=='running')return}
    if(!src){src=c.createBufferSource();src.buffer=buf;src.loop=true;src.loopStart=LACO_INI;src.loopEnd=Math.min(LACO_FIM,buf.duration);src.connect(g);tIni=c.currentTime+.03;g.gain.setValueAtTime(0,tIni);src.start(tIni,0)}
    tocando=true;mostra();rampa(NIVEL,ENTRA)};
  const cala=(dur=.6)=>{tocando=false;mostra();if(g)rampa(0,dur)};
  // ---------- autoplay ----------
  const podeSozinho=async()=>{try{if(navigator.getAutoplayPolicy){const p=navigator.getAutoplayPolicy('audiocontext');return p==='allowed'}}catch(e){}
    // teste com um WAV mudo de 10 ms: se play() resolve, o navegador deixa tocar sem gesto (sem aviso no console)
    try{const n=80,h=new Uint8Array(44+n);const dv=new DataView(h.buffer);const w=(o,s)=>{for(let i=0;i<s.length;i++)h[o+i]=s.charCodeAt(i)};
      w(0,'RIFF');dv.setUint32(4,36+n,true);w(8,'WAVEfmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,8000,true);dv.setUint32(28,8000,true);dv.setUint16(32,1,true);dv.setUint16(34,8,true);w(36,'data');dv.setUint32(40,n,true);h.fill(128,44);
      const a=new Audio('data:audio/wav;base64,'+btoa(String.fromCharCode(...h)));a.volume=0;await a.play();a.pause();return true}catch(e){return false}};
  // ---------- primeiro gesto ----------
  const GESTOS=['pointerdown','pointerup','mousedown','touchend','click','keydown'];
  const gesto=e=>{if(!viva()){solta();return}
    const alvo=e.target&&e.target.closest?e.target:null;
    // o toque que embarca não liga a música do menu (ela sairia logo em seguida); o botão de música decide sozinho no clique
    if(alvo&&alvo.closest('#rEmbarca:not([disabled])'))return;
    if(e.type==='keydown'&&/^(Tab|Shift|Alt|Control|Meta|CapsLock|Escape)$/.test(e.key))return;
    if(!quer)return;
    const noBotao=alvo&&alvo.closest('#rMusIni'),explora=alvo&&alvo.closest('#rExpIni');
    criaCtx();if(!c)return;
    // "Explorar" só libera o áudio (a música entra quando a pessoa voltar); qualquer outro gesto pede a música
    if(!noBotao&&!explora){pedido=true;mostra()}
    acorda();if(c.state==='running'){liberado=true;solta();toca();mostra()}};
  let preso=false;const prende=()=>{if(preso)return;preso=true;for(const k of GESTOS)addEventListener(k,gesto,{capture:true,passive:true})};
  const solta=()=>{if(!preso)return;preso=false;for(const k of GESTOS)removeEventListener(k,gesto,{capture:true})};
  // ---------- botão de música ----------
  bt.addEventListener('click',e=>{if(!criaCtx())return;acorda();
    if(quer&&(tocando||(pedido&&liberado))){quer=false;pedido=false;grava(CHAVE,'off');cala(.6);return}
    quer=true;pedido=true;grava(CHAVE,'on');baixa();if(c.state==='running'){liberado=true;solta();toca()}mostra()});
  // ---------- saída: "Iniciar" (o #rInicio ganha .sai e some) e "Explorar" (body.explora) ----------
  const encerra=()=>{if(saiu)return;saiu=true;solta();tocando=false;W.style.opacity=0;mostra();
    if(c){const t=c.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.setTargetAtTime(0,t,.4);try{src&&src.stop(t+2.2)}catch(e){}setTimeout(()=>{try{c.close()}catch(e){}c=null},2600)}
    document.removeEventListener('visibilitychange',vis)};
  new MutationObserver((_,o)=>{if(ini.classList.contains('sai')||!ini.isConnected){o.disconnect();encerra()}}).observe(ini,{attributes:true,attributeFilter:['class']});
  new MutationObserver((_,o)=>{if(!ini.isConnected){o.disconnect();encerra()}}).observe(document.body,{childList:true});
  new MutationObserver(()=>{const ex=document.body.classList.contains('explora');if(ex===fora||saiu)return;fora=ex;
    if(ex){if(c&&tocando){const t=c.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.setTargetAtTime(0,t,.4)}tocando=false;mostra()}
    else if(c&&quer&&liberado){pedido=true;if(c.state!=='running')acorda();else toca();mostra()}}).observe(document.body,{attributes:true,attributeFilter:['class']});
  // aba oculta: o contexto dorme; volta quando a aba volta
  const vis=()=>{if(!c||saiu)return;if(document.hidden){c.suspend&&c.suspend().catch(()=>{})}else if(liberado){c.resume().then(()=>{if(!fora)toca()}).catch(()=>{})}};
  document.addEventListener('visibilitychange',vis);
  // ---------- começo ----------
  mostra();
  if(quer){baixa();prende();
    podeSozinho().then(sim=>{if(!sim||!viva()||c||!quer)return;if(!criaCtx())return;pedido=true;if(c.state==='running'){liberado=true;solta();toca()}else acorda();mostra()})}
  window.__musicaInicio={estado:()=>({estado:W.dataset.estado,quer,liberado,pedido,tocando,saiu,fora,ctx:c?c.state:null,ganho:g?+g.gain.value.toFixed(4):0,carregado:!!buf,pos:c&&src&&tocando?+(()=>{const d=c.currentTime-tIni;return d<LACO_FIM?d:LACO_INI+((d-LACO_INI)%(LACO_FIM-LACO_INI))})().toFixed(2):null,sessao:le(CHAVE),rmsDb:an?(()=>{const d=new Float32Array(an.fftSize);an.getFloatTimeDomainData(d);let q=0;for(const v of d)q+=v*v;return +(10*Math.log10(q/d.length+1e-12)).toFixed(1)})():null}),encerra};
}
if(!DESLIGA){const acha=()=>{const el=document.getElementById('rInicio');if(el){monta(el);return true}return false};
  if(!acha()){const o=new MutationObserver(()=>{if(acha())o.disconnect()});o.observe(document.documentElement,{childList:true,subtree:true})}}
else window.__musicaInicio={estado:()=>({estado:'desligada',motivo:Q.get('kiosk')==='1'?'kiosk':Q.get('semmusica')==='1'?'semmusica':'teste'})};
