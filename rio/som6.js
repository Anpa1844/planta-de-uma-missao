// V6 · rodada 2 · o som da viagem com SONS REAIS e a TRILHA OFICIAL.
// Substitui som.js (mesma interface). A voz (narração, legendas, pausa) é herdada sem mudança de som.js.
// O que muda:
//  · a síntese antiga (som_sintese.js) fica DESLIGADA: o Worker nem é criado. `?sintese=1` religa tudo como era.
//  · ambiências e pontuais vêm de audio/sfx/<nome>.(mp3|m4a|ogg). audio/sfx/indice.json diz o que existe: nada é pedido
//    às cegas (sem 404). Camada sem arquivo = silêncio. O índice é relido a cada reinício e a cada 45 s: quando um
//    arquivo aparece, a camada liga sozinha.
//  · mix hierárquico: voz acima de tudo; música e ambiências recuam quando o Seu Leo fala; limitador no mestre.
//  · trilha oficial (audio/trilha/): cama em laço muito baixa na abertura, discreta na viagem, e a peça final
//    agendada para o AUGE cair num instante exato (trilhaFinal).
// Ver audio/LEIAME_SFX.md.
import {Som as SomV5,idVoz} from './som.js';
export {idVoz};

const QS=new URLSearchParams(location.search);
// Rodada 3: a síntese antiga volta LIGADA por padrão, como reserva por camada (filtrada e mais baixa); cada arquivo real que chegar
// substitui a camada sintetizada correspondente (cruzamento de ~2 s). ?sintese=0 desliga a reserva.
const SINTESE=QS.get('sintese')!=='0';
const numQ=(k,d)=>{const v=parseFloat(QS.get(k));return isFinite(v)&&v>=0?Math.min(v,4):d};
const VOL_MUS=numQ('vol_musica',1),VOL_FX=numQ('vol_fx',1);
// camada sintetizada → arquivo real que a substitui; e quanto cada camada sintetizada entra (as de ruído, mais baixas)
const TROCA={noite:'noite_pantano',manha:'amazonia_manha',dia:'amazonia_manha',casco:'barco_ondas_marolas',rio:'ondas_casco',chuva:'chuva'};
const SINT_K={rio:.6,vento:.45,chuva:.65,casco:.8,noite:.85,dia:.7,manha:.9};
// ?sfx=pasta serve só para teste (pasta relativa à página); o padrão é audio/sfx
const pastaOk=p=>p&&/^[\w\-./]+$/.test(p)&&!p.includes('..')&&!p.startsWith('/');
const BASE_SFX=(pastaOk(QS.get('sfx'))?QS.get('sfx'):'audio/sfx').replace(/\/+$/,'')+'/';
const BASE_TRILHA='audio/trilha/';
const cl=(x,a=0,b=1)=>x<a?a:x>b?b:x;
const semAcento=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'');
const chave=n=>semAcento(String(n)).toLowerCase().replace(/\.(mp3|m4a|ogg)$/,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const PREF=['mp3','m4a','ogg'];

// ---------- o que cada arquivo faz ----------
// laços (ambiências, ~-23 LUFS no arquivo). nivel = ganho máximo da camada; seg = tamanho da fatia (s) quando o laço é feito de fatias
// Rodada 4: os 11 arquivos reais chegaram. Os níveis abaixo já compensam a sonoridade MEDIDA de cada arquivo (ebur128) para o alvo
// do projeto (-23 LUFS nas ambiências, -18 nos pontuais): motor -28,7 (+5,7 dB), manhã -26,2, noite -26,4, marolas -23,9, casco -23,2.
export const LACOS={
  // + rodada 4, mix medido (capturas/rodada4/som): ambiências estavam a -41 LUFS sob a fala; +4 dB
  noite_pantano:{grupo:'amb',nivel:.6,xf:3},
  amazonia_manha:{grupo:'amb',nivel:.55,xf:3},
  chuva:{grupo:'amb',nivel:.3,xf:2,opcional:true},
  motor_marcha_lenta:{grupo:'motor',nivel:.58,xf:1,seg:8},
  barco_ondas_marolas:{grupo:'bar',nivel:.22,xf:2,leve:false},
  ondas_casco:{grupo:'bar',nivel:.19,xf:2}};
// pontuais (~-18 LUFS no arquivo). g = ganho base; arquivo longo (> 4 s) é tocado em fatias achadas pelos ataques
export const PONTUAIS={
  // rodada 4: fósforo -21,2 LUFS (+3 dB), passos -22,1 (+4 dB), sopro -16,5 (-1,5 dB), demais perto de -18
  fosforo:{g:.72},mergulho:{g:.53},sopro_boto:{g:.42},respingos:{g:.4},passos_conves:{g:.64},madeira_range:{g:.32},trovao:{g:.7,opcional:true}};
// Rodada 4 · carga: os pontuais (pequenos) vêm logo; cada laço (1–1,5 MB) só é baixado quando a cena pede a camada pela primeira vez.
// No celular, na qualidade leve (?q=0) e com economia de dados, laços marcados leve:false nem são baixados (a síntese de reserva cobre).
const LEVE=QS.get('q')==='0'||matchMedia('(pointer:coarse)').matches||!!(navigator.connection&&navigator.connection.saveData);
// evento da cena → arquivo (e o que usar se o primeiro faltar)
const EVENTOS={
  fosforo:{de:['fosforo'],dest:'ui'},
  passos:{de:['passos_conves'],dest:'perto'},
  rangido:{de:['madeira_range'],dest:'perto'},
  batente:{de:['madeira_range'],dest:'perto',forca:.7,taxa:1.12},
  respingo:{de:['respingos','mergulho'],dest:'fora',ref:12},
  peixe:{de:['respingos'],dest:'fora',ref:10,forca:.55,taxa:1.15},
  mergulho:{de:['mergulho','respingos'],dest:'fora',ref:12},
  boto:{de:['sopro_boto'],dest:'fora',ref:16,eco:['respingos',.35,.18]},
  trovao:{de:['trovao'],dest:'fora',ref:200},
  toque:{de:[],dest:'ui'}};
// nomes antigos de som.bicho(...) → evento novo
const BICHO={boto:'boto',plop:'peixe',peixe:'peixe',mergulho:'mergulho',pirarucu:'respingo'};

// níveis da trilha (ganho linear sobre o arquivo; a cama tem -20,5 LUFS, a peça final -15,8)
// Rodada 3: a música estava inaudível (-37 LUFS na viagem). Agora, com a cama a -20,5 LUFS no arquivo: viagem ≈ -20,5 LUFS sem fala e ≈ -25 com fala
// (recuo 0,6); abertura ≈ -24; peça final (-15,8 no arquivo) ≈ -22 antes do auge e ≈ -16,7 no auge.
// rodada 4 (medido com os SFX reais, capturas/rodada4/som): viagem sem fala -17,6 LUFS → nível 1,4→1,15 (≈ -19,3); recuo na fala .66→.5 (≈ -25)
export const TRILHA_NIVEL={abertura:.9,viagem:1.15,finalAntes:.55,finalAuge:.95};
const TRILHA_PADRAO={viagem:{arquivo:'trilha_viagem.mp3',laco_ini:.5,laco_fim:88.5},final:{arquivo:'trilha_final.mp3',auge:64.5,fim_musical:112.5}};

const curva=f=>{const a=new Float32Array(33);for(let i=0;i<33;i++)a[i]=f(i/32);return a};
const SOBE=curva(q=>Math.sin(q*Math.PI/2)),DESCE=curva(q=>Math.cos(q*Math.PI/2));

export class Som extends SomV5{
  constructor(){super();this.L={};this.P={};this._quer={};this.sfxTem={};this.sfxPede={};this.ativos=new Set();this.vozesP=0;this.vozK6=0;this._tk=0;this._tInd=0;
    this.tr={fase:'abertura',k:null,cfg:TRILHA_PADRAO,cama:null,gCama:null,fim:null,tAuge:null,id:0,bufV:null,bufF:null};this.sintese=SINTESE;this.kMus=VOL_MUS;this.kFx=VOL_FX;
    addEventListener('keydown',e=>{if((e.key==='m'||e.key==='M')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName)))this.painel()})}
  // ---------- montagem ----------
  inicia(){
    if(SINTESE){super.inicia();if(!this.ok)return;this.triVol=0 /* a trilha sintetizada cala: vale a oficial */;this.gMus.gain.value=0}
    else{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;let c;try{c=this.c=new AC({latencyHint:'playback'})}catch(e){return}c.resume&&c.resume().catch(()=>{});
      const lim=c.createDynamicsCompressor();lim.threshold.value=-6;lim.knee.value=4;lim.ratio.value=12;lim.attack.value=.003;lim.release.value=.18;lim.connect(c.destination);const mest=this.mest=c.createGain();mest.connect(lim);
      this.gVoz=this._G(1);this.fFora=c.createBiquadFilter();this.fFora.type='lowpass';this.fFora.frequency.value=19000;this.fFora.Q.value=.5;this.fFora.connect(mest);
      this.gAmb=this._G(1,this.fFora);this.gFauna=this._G(1,this.fFora);this.gMus=this._G(1);this.gBar=this._G(1);this.gUi=this._G(1);this.rev=c.createConvolver();this.gRev=this._G(.6,this.fFora);this.rev.connect(this.gRev);
      c.listener.setPosition&&c.listener.setPosition(0,0,0);this.ok=true}
    const c=this.c;
    // grupos novos: pontuais do mundo (abafados na cabine), pontuais de bordo, música oficial
    this.gSfx=this._G(1,this.fFora);this.gPerto=this._G(1,this.gBar);this.gMus6=this._G(1);this.gCama=this._G(0,this.gMus6);this.gFinal=this._G(0,this.gMus6);
    this.fMotor=c.createBiquadFilter();this.fMotor.type='lowpass';this.fMotor.frequency.value=2400;this.fMotor.Q.value=.6;this.fMotor.connect(this.gBar);
    for(const n in LACOS){const d=LACOS[n];this.L[n]={n,buf:null,g:this._G(0,d.grupo==='amb'?this.gAmb:d.grupo==='motor'?this.fMotor:this.gBar),seg:d.seg||1e9,xf:d.xf||2,prox:0,alvo:0,taxa:1,fontes:new Set()}}
    for(const n in PONTUAIS)this.P[n]={n,buf:null,fatias:null,ult:-1,g:PONTUAIS[n].g};
    if(QS.has('medir')){this.med={};for(const [n,g] of [['voz',this.gVoz],['amb',this.gAmb],['fauna',this.gFauna],['sfx',this.gSfx],['barco',this.gBar],['mus',this.gMus6],['musSint',this.gMus],['total',this.mest]]){const a=c.createAnalyser();a.fftSize=2048;g.connect(a);this.med[n]=a}}
    // volumes finos (?vol_musica, ?vol_fx, painel da tecla M)
    this.kMus=VOL_MUS;this.kFx=VOL_FX;this.gMus6.gain.value=this.kMus;
    if(!this.med){this.med={};for(const [n,g] of [['voz',this.gVoz],['amb',this.gAmb],['barco',this.gBar],['mus',this.gMus6],['total',this.mest]]){const a=c.createAnalyser();a.fftSize=2048;g.connect(a);this.med[n]=a}}
    this.recarregaSfx()}
  // camadas sintetizadas passam por um filtro suave (sem chiado) antes do grupo
  _limpa(dest){const c=this.c,k=dest===this.gBar?'_lpB':'_lpA';if(!this[k]){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=dest===this.gBar?3200:5200;lp.Q.value=.5;const hs=c.createBiquadFilter();hs.type='highshelf';hs.frequency.value=3500;hs.gain.value=-5;lp.connect(hs);hs.connect(dest);this[k]=lp}return this[k]}
  criaCamada(n,b){const c=this.c,s=c.createBufferSource(),g=c.createGain();g.gain.value=0;s.buffer=b;s.loop=true;s.connect(g);g.connect(this._limpa(n==='casco'?this.gBar:this.gAmb));s.start(0,Math.random()*b.duration);this.camadas[n]={s,g}}
  criaMotor(b){super.criaMotor(b);const q=this.motorS;q.f.frequency.value=900;q.f.Q.value=.4}
  // o alvo de cada camada sintetizada: reduzido pelo SINT_K e zerado (com cruzamento) quando o arquivo real da camada existe
  rampa(n,v,t=1.2){const r=TROCA[n];if(r&&this.sfxTem&&this.sfxTem[r]){const o=this.camadas[n];if(o)o.g.gain.setTargetAtTime(0,this.c.currentTime,.7);return}super.rampa(n,v*(SINT_K[n]||1)*this.kFx,t)}
  // painel escondido de volumes (tecla M): música, efeitos/natureza e voz, com medidor de nível; mostra a URL equivalente
  painel(){let P=document.getElementById('rVolP');if(P){P.hidden=!P.hidden;return}P=document.createElement('div');P.id='rVolP';
    P.style.cssText='position:fixed;left:12px;top:12px;z-index:80;background:rgba(8,12,10,.92);color:#f4efe2;border:1px solid #e9c77e;border-radius:10px;padding:12px 14px;font:13px/1.5 system-ui,sans-serif;min-width:260px';
    const L=[['Música','kMus',0,3],['Efeitos e natureza','kFx',0,3],['Voz','voz',0,1.5]];
    P.innerHTML='<b style="letter-spacing:.08em">VOLUMES (tecla M)</b>'+L.map(([t,k,a,b])=>`<label style="display:block;margin-top:6px">${t} <span data-v=${k}></span><input type=range min=${a} max=${b} step=.05 data-k=${k} style="width:100%"></label>`).join('')+'<div data-m style="margin-top:8px;font:11px ui-monospace,monospace;white-space:pre"></div><div data-u style="margin-top:6px;font:11px ui-monospace,monospace;color:#e9c77e"></div>';
    document.body.append(P);const val=k=>k==='voz'?this.vol.voz:this[k];
    const mostra=()=>{for(const [,k] of L){P.querySelector(`[data-v=${k}]`).textContent=(+val(k)).toFixed(2);P.querySelector(`[data-k=${k}]`).value=val(k)}P.querySelector('[data-u]').textContent=`?vol_musica=${this.kMus.toFixed(2)}&vol_fx=${this.kFx.toFixed(2)}`};
    P.querySelectorAll('input').forEach(i=>i.oninput=()=>{const k=i.dataset.k,v=+i.value;if(k==='voz')this.vol.voz=v;else this[k]=v;mostra()});mostra();
    const m=P.querySelector('[data-m]');const tic=()=>{if(!P.isConnected)return;if(!P.hidden){const o=this.medidor();if(o)m.textContent=Object.entries(o).map(([k,v])=>k.padEnd(6)+String(v[0]).padStart(7)+' dB').join('\n')}setTimeout(tic,400)};tic()}
  sinteseEstado(){const o={};for(const n in this.camadas)o[n]=+this.camadas[n].g.gain.value.toFixed(4);if(this.motorS)o.motor=+this.motorS.g.gain.value.toFixed(4);return {ligada:SINTESE,camadas:o,substituidas:Object.keys(TROCA).filter(n=>this.sfxTem[TROCA[n]])}}
  _G(v=1,d){const g=this.c.createGain();g.gain.value=v;g.connect(d||this.mest);return g}
  _dec(u){return fetch(u).then(r=>r.ok?r.arrayBuffer():Promise.reject(new Error('sem '+u))).then(a=>new Promise((ok,no)=>this.c.decodeAudioData(a,ok,no)))}
  // ---------- sons reais: índice e carga ----------
  // Relê audio/sfx/indice.json e baixa o que ainda não está na memória. Pode ser chamado a qualquer momento.
  recarregaSfx(){if(!this.ok)return Promise.resolve([]);this._tInd=this.c.currentTime;
    return this._sfxP=fetch(BASE_SFX+'indice.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null).then(j=>{const arqs=(j&&Array.isArray(j.arquivos))?j.arquivos:[];const por={};
      for(const a of arqs){const m=/\.(mp3|m4a|ogg)$/i.exec(a);if(!m)continue;(por[chave(a)]=por[chave(a)]||[]).push(a)}
      const ps=[];this._disp=por;for(const k in por){if(!(k in this.L)&&!(k in this.P))continue;if(this.sfxTem[k]||this.sfxPede[k])continue;if(k in this.L&&!this._quer[k])continue;por[k].sort((x,y)=>PREF.indexOf(x.split('.').pop().toLowerCase())-PREF.indexOf(y.split('.').pop().toLowerCase()));this.sfxPede[k]=true;
        ps.push((async()=>{for(const a of por[k]){try{const b=await this._dec(BASE_SFX+encodeURIComponent(a));this._chegaSfx(k,b,a);return k}catch(e){}}this.sfxPede[k]=false;return null})())}
      return Promise.all(ps)})}
  // laço pedido pela cena: baixa agora (uma vez), se o índice tem o arquivo
  _pedeLaco(k){if(this._quer[k]||(LEVE&&LACOS[k]&&LACOS[k].leve===false))return;this._quer[k]=true;if(this._disp&&this._disp[k])this.recarregaSfx()}
  // rodada 4: instante da ÚLTIMA palavra de uma fala, lido do próprio áudio (último trecho acima de -32 dBFS), não da duração do arquivo
  fimFala(nome){const o=this.infoVoz(nome);if(!o||!o.buf)return 0;if(o._fim)return o._fim;const b=o.buf,d=b.getChannelData(0),sr=b.sampleRate,w=Math.floor(sr*.02);let i=Math.floor(d.length/w)-1;
    for(;i>0;i--){let m=0;for(let j=i*w;j<(i+1)*w;j++){const v=Math.abs(d[j]);if(v>m)m=v}if(m>.025)break}return o._fim=Math.min(b.duration,(i+1)*w/sr)}
  _chegaSfx(k,b,arq){this.sfxTem[k]=arq;if(this.L[k])this.L[k].buf=b;if(this.P[k]){this.P[k].buf=b;this.P[k].fatias=b.duration>4?this._fatias(b):null;this.P[k].longo=b.duration>4}}
  // quais camadas e pontuais têm arquivo (para conferir sem ouvir)
  sfxEstado(){const o={base:BASE_SFX,sintese:SINTESE,tem:{...this.sfxTem},faltam:[]};for(const n in LACOS)if(!this.sfxTem[n]&&!LACOS[n].opcional)o.faltam.push(n);for(const n in PONTUAIS)if(!this.sfxTem[n]&&!PONTUAIS[n].opcional)o.faltam.push(n);o.fatias={};for(const n in this.P)if(this.P[n].fatias)o.fatias[n]=this.P[n].fatias.length;return o}
  // arquivo longo com vários eventos (passos, respingos): acha cada ataque pela energia
  _fatias(b){const d=b.getChannelData(0),sr=b.sampleRate,w=Math.floor(sr*.02),n=Math.floor(d.length/w),E=new Float32Array(n);let mx=0;for(let i=0;i<n;i++){let s=0;for(let j=0;j<w;j++){const v=d[i*w+j];s+=v*v}E[i]=Math.sqrt(s/w);if(E[i]>mx)mx=E[i]}
    if(mx<1e-4)return null;const hi=mx*.22,lo=mx*.07,F=[];let i=0;while(i<n){if(E[i]>hi){let a=i;while(a>0&&E[a-1]>lo&&i-a<4)a--;let z=i,q=0;while(z<n&&q<6&&z-a<75){q=E[z]<lo?q+1:0;z++}F.push([Math.max(0,a*w/sr-.012),Math.min((z-a)*w/sr+.03,1.6)]);i=z}else i++}
    return F.length>=2?F:null}
  // ---------- laços com emenda cruzada (não dependem do preenchimento do codificador) ----------
  _agenda(l,t){const c=this.c,b=l.buf,r=l.taxa||1,len=Math.min(b.duration,l.seg),D=len/r,xf=Math.min(l.xf,D*.25),off=b.duration>len+.1?Math.random()*(b.duration-len):0;
    const s=c.createBufferSource(),e=c.createGain();s.buffer=b;s.playbackRate.value=r;e.gain.value=0;e.gain.setValueCurveAtTime(SOBE,t,xf);e.gain.setValueCurveAtTime(DESCE,t+D-xf,xf);s.connect(e);e.connect(l.g);s.start(t,off,len);s.stop(t+D+.05);
    l.fontes.add(s);s.onended=()=>{l.fontes.delete(s);try{s.disconnect();e.disconnect()}catch(_){}};l.prox=t+D-xf}
  _laco(l,alvo,t,tc=1.2){l.alvo=alvo;l.g.gain.setTargetAtTime(alvo,t,tc);if(!l.buf){if(alvo>.0008&&!this._quer[l.n])this._pedeLaco(l.n);return}const vivo=alvo>.0008||l.g.gain.value>.0015;if(!vivo)return;if(!l.fontes.size)this._agenda(l,t+.05);else if(t>l.prox-1.2&&l.prox>0&&!l._ag){l._ag=true;this._agenda(l,Math.max(t+.03,l.prox));l._ag=false}}
  // ---------- pontuais ----------
  _pontual(n,{x,y,z,forca=1,taxa=1,dest='fora',ref=14,quando=0}={}){const P=this.P[n];if(!this.ok||!P||!P.buf||this.vozesP>10)return false;const c=this.c,b=P.buf;let off=0,dur=b.duration;
    if(P.fatias){let i=Math.floor(Math.random()*P.fatias.length);if(i===P.ult)i=(i+1)%P.fatias.length;P.ult=i;[off,dur]=P.fatias[i]}else if(P.longo){dur=.5+Math.random()*.4;off=Math.random()*(b.duration-dur)}
    // variação: taxa ±5 %, ganho ±2 dB
    const r=taxa*(.95+Math.random()*.1),g=P.g*forca*Math.pow(10,(Math.random()*4-2)/20),t=c.currentTime+.02+quando,D=dur/r,s=c.createBufferSource(),e=c.createGain();s.buffer=b;s.playbackRate.value=r;
    e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(g,t+.008);e.gain.setValueAtTime(g,t+Math.max(.01,D-.07));e.gain.linearRampToValueAtTime(0,t+D);s.connect(e);const nos=[s,e];let sai=e;
    if(x!==undefined&&dest==='fora'){const p=c.createPanner();p.panningModel='equalpower';p.distanceModel='inverse';p.refDistance=ref;p.rolloffFactor=1;p.maxDistance=900;if(p.positionX){p.positionX.value=x;p.positionY.value=y||0;p.positionZ.value=z}else p.setPosition(x,y||0,z);e.connect(p);sai=p;nos.push(p)}
    sai.connect(dest==='ui'?this.gUi:dest==='perto'?this.gPerto:this.gSfx);this.vozesP++;this.ativos.add(e);s.onended=()=>{this.vozesP--;this.ativos.delete(e);for(const q of nos)try{q.disconnect()}catch(_){}};s.start(t,off,dur);s.stop(t+D+.02);return true}
  // Evento da cena. nome: fosforo, passos, rangido, respingo, mergulho, boto, peixe, batente, toque, trovao.
  // o: {x,y,z (mundo; sem posição o som não é espacializado), forca (1), n e intervalo (passos), quando (s)}. Devolve true se tocou.
  evento(nome,o={}){const E=EVENTOS[nome];if(!E||!this.ok)return false;const base={x:o.x,y:o.y,z:o.z,forca:(o.forca===undefined?1:o.forca)*(E.forca||1),taxa:E.taxa||1,dest:E.dest,ref:E.ref,quando:o.quando||0};
    for(const arq of E.de){const P=this.P[arq];if(!P||!P.buf)continue;
      if(nome==='passos'){const n=o.n||1,iv=o.intervalo||.56;let q=base.quando;for(let k=0;k<n;k++){this._pontual(arq,{...base,quando:q,forca:base.forca*(k%2?.9:1)});q+=iv*(.88+Math.random()*.24)}return true}
      const ok=this._pontual(arq,base);if(ok&&E.eco&&this.P[E.eco[0]]&&this.P[E.eco[0]].buf)this._pontual(E.eco[0],{...base,forca:base.forca*E.eco[1],quando:base.quando+E.eco[2]});return ok}
    return false}
  // Atalhos de cena para o roteiro (cada um é só uma sequência de eventos)
  cena(nome){if(nome==='acende')return this.evento('fosforo');
    if(nome==='saidaCabine'){this.evento('passos',{n:5,intervalo:.62,forca:.9});this.evento('rangido',{quando:.9,forca:.8});this.evento('rangido',{quando:3.4,forca:.6});return true}
    if(nome==='entraCabine'){this.evento('passos',{n:6,intervalo:.58});this.evento('rangido',{quando:2.2,forca:.7});return true}
    if(nome==='saiCabine'){this.evento('passos',{n:5,intervalo:.58});this.evento('rangido',{quando:.6,forca:.7});return true}
    return false}
  // ---------- interface antiga (som.js) ----------
  um(n,g=.6){if(!this.ok)return;if(EVENTOS[n]&&this.evento(n,{forca:g/.6}))return;if(SINTESE)super.um(n,g)}
  toca(...a){if(SINTESE)super.toca(...a)}
  bicho(t,x,y,z){const ev=BICHO[t];if(ev&&this.evento(ev,{x,y,z}))return;if(SINTESE)super.bicho(t,x,y,z)}
  bando(...a){if(SINTESE)super.bando(...a)}
  relampago(perto){if(!this.ok)return;if(this.P.trovao&&this.P.trovao.buf){this.evento('trovao',{forca:perto?1:.65,quando:perto?.5+Math.random()*.5:1.6+Math.random()*2.6});return}if(SINTESE)super.relampago(perto)}
  temaPorAno(ano,toque=true){if(SINTESE)return super.temaPorAno(ano,toque);const a=parseInt(ano)||0;this.tema=a<=1940?{nome:'pioneiros',tri:'a',taxa:1}:a<=1996?{nome:'consolidacao',tri:'b',taxa:1}:{nome:'hoje',tri:'b',taxa:1.1225};return this.tema.nome}
  // ---------- trilha oficial ----------
  _cfgTrilha(){return this._cfgP||(this._cfgP=fetch(BASE_TRILHA+'trilha.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null).then(j=>{if(j&&j.viagem&&j.final){const v=j.viagem,f=j.final;this.tr.cfg={viagem:{arquivo:v.arquivo||'trilha_viagem.mp3',laco_ini:+v.laco_ini||.5,laco_fim:+v.laco_fim||88.5},final:{arquivo:f.arquivo||'trilha_final.mp3',auge:+f.auge||64.5,fim_musical:+f.fim_musical||112.5}}}return this.tr.cfg}))}
  _bufCama(){return this._bcP||(this._bcP=this._cfgTrilha().then(cf=>this._dec(BASE_TRILHA+cf.viagem.arquivo)).then(b=>this.tr.bufV=b).catch(()=>{this._bcP=null;return null}))}
  _bufFinal(){return this._bfP||(this._bfP=this._cfgTrilha().then(cf=>this._dec(BASE_TRILHA+cf.final.arquivo)).then(b=>this.tr.bufF=b).catch(()=>{this._bfP=null;return null}))}
  // baixa a peça final com antecedência (chame perto do fim da viagem; trilhaFinal também baixa se preciso)
  trilhaPre(){return this.ok?this._bufFinal():Promise.resolve(null)}
  _ligaCama(){const c=this.c,T=this.tr,b=T.bufV;if(!b)return;this._paraCama(.05);const cf=T.cfg.viagem,s=c.createBufferSource();s.buffer=b;s.loop=true;s.loopStart=cf.laco_ini;s.loopEnd=Math.min(cf.laco_fim,b.duration);s.connect(this.gCama);const t=c.currentTime+.08;this.gCama.gain.cancelScheduledValues(t);this.gCama.gain.setValueAtTime(0,t);s.start(t,cf.laco_ini);T.cama={s,t0:t}}
  _paraCama(fade=.4){const T=this.tr,o=T.cama;if(!o)return;T.cama=null;const c=this.c,t=c.currentTime;const s=o.s;if(fade>.06){this.gCama.gain.cancelScheduledValues(t);this.gCama.gain.setTargetAtTime(0,t,fade/3)}try{s.stop(t+fade)}catch(e){}s.onended=()=>{try{s.disconnect()}catch(e){}}}
  // Liga a cama em laço. Começa em silêncio e sobe ao nível da fase ('abertura': baixíssima).
  trilhaInicia(fase='abertura'){if(!this.ok)return Promise.resolve(false);this.tr.fase=fase;const id=++this.tr.id;return this._bufCama().then(b=>{if(!b||id!==this.tr.id)return false;if(!this.tr.cama&&!this.tr.fim)this._ligaCama();return true})}
  // fase da viagem para o nível automático: 'abertura' | 'viagem'
  trilhaFase(f){this.tr.fase=f}
  // nível manual da cama (ganho 0..1); null devolve ao automático
  trilhaNivel(k){this.tr.k=(k===null||k===undefined)?null:cl(+k)}
  // Agenda a peça final para o AUGE (64,5 s do arquivo) cair exatamente em agora + segAteAuge.
  // segAteAuge ≥ 64,5: a peça começa do zero, mais tarde. Menor: começa já, do meio, com entrada de 4 s.
  // A cama sai (~6 s) quando a peça entra. Devolve {augeEm, fimEm} em segundos a partir de agora (relógio do áudio).
  trilhaFinal(segAteAuge=64.5){if(!this.ok)return null;const c=this.c,T=this.tr,cf=T.cfg.final,id=++T.id;this._paraFinal(.3);const tA=T.tAuge=c.currentTime+Math.max(0,+segAteAuge||0);T.tFim=tA+(cf.fim_musical-cf.auge);T.finalOn=true;
    this._bufFinal().then(b=>{if(!b||id!==T.id||!T.finalOn)return;const cf2=T.cfg.final;T.tFim=tA+(cf2.fim_musical-cf2.auge);const ag=c.currentTime+.06;let t0=tA-cf2.auge,off=0;if(t0<ag){off=ag-t0;t0=ag}if(off>=b.duration-.5)return;
      const s=c.createBufferSource(),e=c.createGain(),fade=off>0?4:2.5;s.buffer=b;e.gain.setValueAtTime(0,t0);e.gain.linearRampToValueAtTime(1,t0+fade);s.connect(e);e.connect(this.gFinal);s.start(t0,off);T.fim={s,e,t0,off};s.onended=()=>{try{s.disconnect();e.disconnect()}catch(_){}if(T.fim&&T.fim.s===s)T.fim.acabou=true}});
    return {augeEm:tA-c.currentTime,fimEm:T.tFim-c.currentTime}}
  _paraFinal(fade=.4){const T=this.tr,o=T.fim;T.fim=null;T.finalOn=false;T.tAuge=null;T.tFim=null;if(!o||!this.c)return;const t=this.c.currentTime;try{o.e.gain.cancelScheduledValues(t);o.e.gain.setTargetAtTime(0,t,fade/3);o.s.stop(t+fade)}catch(e){}}
  // segundos (relógio do áudio) que faltam para o auge e para o fim musical; null se a peça final não foi agendada
  trilhaAugeEm(){const T=this.tr;return T.tAuge==null||!this.c?null:T.tAuge-this.c.currentTime}
  trilhaFimEm(){const T=this.tr;return T.tFim==null||!this.c?null:T.tFim-this.c.currentTime}
  trilhaEstado(){const T=this.tr,c=this.c;return {fase:T.fase,nivelManual:T.k,cama:!!T.cama,camaGanho:this.gCama?+this.gCama.gain.value.toFixed(4):0,posCama:T.cama&&c?+(((c.currentTime-T.cama.t0)%(T.cfg.viagem.laco_fim-T.cfg.viagem.laco_ini))+T.cfg.viagem.laco_ini).toFixed(2):null,final:!!T.fim,finalGanho:this.gFinal?+this.gFinal.gain.value.toFixed(4):0,posFinal:T.fim&&c?+(c.currentTime-T.fim.t0+T.fim.off).toFixed(2):null,augeEm:this.trilhaAugeEm(),fimEm:this.trilhaFimEm(),agora:c?c.currentTime:0}}
  // Reinício da viagem: a peça final para, a cama volta ao começo (baixíssima), pontuais calam, o índice de sons é relido.
  reinicia(){if(!this.ok)return;const T=this.tr;T.id++;this._paraFinal(.5);T.fase='abertura';T.k=null;this.tema=null;this.vozK6=0;const t=this.c.currentTime;for(const e of this.ativos){try{e.gain.cancelScheduledValues(t);e.gain.setTargetAtTime(0,t,.05)}catch(_){}}
    if(T.bufV)this._ligaCama();else this.trilhaInicia('abertura');this.recarregaSfx()}
  // ---------- o mix a cada instante ----------
  // Igual a som.js, com dois campos opcionais a mais: fase ('abertura' | 'navega' …) e trilha (nível manual 0..1).
  atualiza(dt,o){if(!this.ok||!this.c)return;const {f,v,rpm,dentro,dist,alto,cam,frente,cima,margem,final}=o;const c=this.c;
    if(SINTESE)super.atualiza(dt,o);else{this._cam=cam;const L=c.listener;if(L.positionX){L.positionX.value=cam.x;L.positionY.value=cam.y;L.positionZ.value=cam.z;L.forwardX.value=frente.x;L.forwardY.value=frente.y;L.forwardZ.value=frente.z;L.upX.value=cima.x;L.upY.value=cima.y;L.upZ.value=cima.z}else if(L.setPosition){L.setPosition(cam.x,cam.y,cam.z);L.setOrientation(frente.x,frente.y,frente.z,cima.x,cima.y,cima.z)}}
    const t=c.currentTime,dk=t-this._tk;if(dk<.1)return;this._tk=t;
    if(SINTESE&&this.motorS){if(this.sfxTem.motor_marcha_lenta){this.motorS.g.gain.cancelScheduledValues(t);this.motorS.g.gain.setTargetAtTime(0,t,.7)}else{const g=this.motorS.g.gain;const v=g.value;g.cancelScheduledValues(t);g.setTargetAtTime(Math.min(v,.22)*this.kFx,t,.3)}}
    this.gMus6.gain.setTargetAtTime(this.kMus,t,.2);if(o.fase)this.tr.fase=o.fase==='abertura'?'abertura':'viagem';if(o.trilha!==undefined)this.trilhaNivel(o.trilha);
    if(t-this._tInd>45)this.recarregaSfx();
    const fin=this.fin=cl(final||0),voz=this.falando()&&!this.falaPausada&&!(this.fala&&this.fala.mudo)?1:0;this.vozK6+=(voz-this.vozK6)*(1-Math.exp(-Math.min(dk,1)/.3));const vk=this.vozK6,duck=1-.35*vk; /* rodada 4: recuo das ambiências na fala -6 → -3,7 dB (a voz segue ~20 dB acima) */
    const A=this.vol.amb*(1-.62*fin)*this.kFx,B=this.vol.bar*(1-.8*fin)*this.kFx,M=this.vol.mus,den=dentro>.5;
    if(!SINTESE){this.gVoz.gain.setTargetAtTime(this.vol.voz*.95,t,.05);this.gFauna.gain.setTargetAtTime(.62*(1-.62*vk)*A,t,.25);this.fFora.frequency.setTargetAtTime(den?1500:19000,t,.5)}
    this.gSfx.gain.setTargetAtTime(.9*A*(1-.4*vk)*this.kFx,t,.25);this.gPerto.gain.setTargetAtTime(.9*(1-.3*vk)*this.kFx,t,.25);
    // ambiências: a noite cruza para a manhã conforme o humor do clima
    const al=cl((alto-12)/60),perto=1-al*.7,nK=cl(Math.max((f.grilos||0)*.5+(f.sapos||0)*.5,(f.noite||0)*.8)),dK=cl(Math.max(f.aves||0,(f.cigarra||0)*.7))*(1-.6*nK),ch=1-.5*cl(f.chuva||0);
    this._laco(this.L.noite_pantano,LACOS.noite_pantano.nivel*nK*duck*A*perto*ch,t,1.6);
    this._laco(this.L.amazonia_manha,LACOS.amazonia_manha.nivel*dK*duck*A*perto*ch,t,1.6);
    this._laco(this.L.chuva,LACOS.chuva.nivel*cl(f.chuva||0)*(den?.6:1)*A*(1-.35*vk),t,.8);
    // barco: motor em marcha lenta, marolas com a velocidade, água no casco quando devagar; perto ronca, no alto some
    const dG=1/(1+Math.pow((dist||0)/26,1.5)),lm=this.L.motor_marcha_lenta;lm.taxa=.94+cl(rpm)*.14;
    this._laco(lm,(rpm>.01?(.35+cl(rpm)*.65):0)*LACOS.motor_marcha_lenta.nivel*(den?1.25:(.3+dG))*B*(1-.3*vk),t,.4);this.fMotor.frequency.setTargetAtTime(den?900:(1800+cl(rpm)*5000),t,.4);
    const vv=cl((v||0)/10);
    this._laco(this.L.barco_ondas_marolas,vv*LACOS.barco_ondas_marolas.nivel*(den?.4:(.3+dG))*B*duck,t,.7);
    this._laco(this.L.ondas_casco,(1-cl((v||0)/6)*.8)*LACOS.ondas_casco.nivel*(den?.6:(.25+dG))*B*duck,t,.9);
    // trilha oficial: cama por fase, recuando nas falas; a peça final cresce no auge e já não recua
    const T=this.tr,N=TRILHA_NIVEL,entrou=T.fim&&t>=T.fim.t0;const nv=T.k!==null?T.k:(N[T.fase]||N.viagem);
    this.gCama.gain.setTargetAtTime(entrou?0:nv*M*(1-.5*vk),t,entrou?2:.8);
    if(T.cama&&entrou&&t>T.fim.t0+9)this._paraCama(.2);
    if(T.finalOn){const perto2=T.tAuge!==null&&t>=T.tAuge-1.6;this.gFinal.gain.setTargetAtTime(perto2?N.finalAuge*M:N.finalAntes*M*(1-.4*vk),t,perto2?.55:.6)}else this.gFinal.gain.setTargetAtTime(0,t,.2)}
}
