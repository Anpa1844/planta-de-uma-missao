import {MARCOS} from './marcos5.js';
// A mixagem da viagem. Os sons nascem em som_sintese.js; aqui eles ganham lugar no espaço, reverberação de mata,
// e o equilíbrio muda sozinho: a voz sempre em primeiro plano, a floresta conforme a hora, o motor conforme a câmera.
const AVES_DIA=['piha','bemtevi','sabia','japim','martim','gaviao','tucano','maracana','arara'];const VAR={arara:3,caninde:2,tucano:2,garca:2,piha:2,bemtevi:2,sabia:3,japim:3,inhambu:2,urutau:1,coruja:1,martim:2,gaviao:1,maracana:2,guariba:1,onca:1,jacare:1,boto:2,capivara:2,plop:3,peixe:2,mergulho:2,pirarucu:1,trovao:3,raio:2,toque:1,fosforo:1,batente:1};
const LISTA_INICIAL=['ir','bed:rio','bed:noite','motor','bed:casco','fosforo#0','toque#0','bed:manha','plop#0','plop#1','plop#2','peixe#0','batente#0','bed:vento','tri:a','bed:dia','boto#0','boto#1','mergulho#0','garca#0','garca#1','arara#0','arara#1','arara#2','caninde#0','piha#0','piha#1','bemtevi#0','bemtevi#1','sabia#0','sabia#1','japim#0','japim#1','martim#0','gaviao#0','tucano#0','tucano#1','maracana#0','jacare#0','capivara#0','guariba#0','bed:chuva','trovao#0','trovao#1','raio#0','tri:c','pirarucu#0','onca#0','inhambu#0','inhambu#1','urutau#0','coruja#0','tri:b','sabia#2','japim#2'];

// ids das falas e os nomes antigos correspondentes (reserva enquanto os narr_<id>.mp3 não chegam)
const ANTIGO={abertura:'intro',final:'fim'},APELIDO={intro:'abertura',fim:'final'};MARCOS.forEach((m,i)=>{const id='b'+String(i+1).padStart(2,'0');ANTIGO[id]=m.audio||null;if(m.audio)APELIDO[m.audio]=id});
const ANTIGOS_PADRAO=['intro','fim',...MARCOS.map(m=>m.audio).filter(Boolean)].map(n=>n+'.m4a');
export const idVoz=n=>!n?null:(APELIDO[n]||n);

export class Som{
  constructor(){this.c=null;this.buf={};this.cur=null;this.t0=0;this.dur=0;this.ok=false;this.vol={voz:1,amb:1,bar:1,mus:1};this.b={};this.tAmb=3;this.tTro=0;this.camadas={};this.motorS=null;this.dentro=0;this.voices=0;this.pronto={};this.fontes={};this.pronta={};this.fala=null;this._ficha=0;this.tema=null;this.fin=0}
  inicia(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const c=this.c=new AC({latencyHint:'playback'});c.resume&&c.resume();
    const lim=c.createDynamicsCompressor();lim.threshold.value=-6;lim.knee.value=4;lim.ratio.value=12;lim.attack.value=.003;lim.release.value=.18;lim.connect(c.destination);const mest=this.mest=c.createGain();mest.connect(lim);
    const G=(v=1,d=mest)=>{const g=c.createGain();g.gain.value=v;g.connect(d);return g};this.gVoz=G(1);
    // o que vem de fora passa por um filtro: dentro da cabine, o mundo fica abafado
    this.fFora=c.createBiquadFilter();this.fFora.type='lowpass';this.fFora.frequency.value=19000;this.fFora.Q.value=.5;this.fFora.connect(mest);
    this.gAmb=G(1,this.fFora);this.gFauna=G(1,this.fFora);this.gMus=G(.5);this.gBar=G(1);this.gUi=G(1);this.rev=c.createConvolver();this.gRev=G(.6,this.fFora);this.rev.connect(this.gRev);
    c.listener.setPosition&&c.listener.setPosition(0,0,0);
    // o sintetizador trabalha em segundo plano e entrega som por som
    try{this.w=new Worker('som_sintese.js');this.w.onmessage=e=>{const d=e.data;if(d.fim)return;const b=c.createBuffer(d.canais.length,d.canais[0].length,d.sr);d.canais.forEach((a,i)=>b.copyToChannel(a,i));this.chega(d.id,b)};this.w.postMessage(LISTA_INICIAL)}catch(err){console.warn('sem worker',err)}
    if(location.search.includes('medir')){this.med={};for(const [n,g] of [['voz',this.gVoz],['amb',this.gAmb],['fauna',this.gFauna],['mus',this.gMus],['barco',this.gBar],['total',this.mest]]){const a=c.createAnalyser();a.fftSize=2048;g.connect(a);this.med[n]=a}}
    this.ok=true}
  // nível em dBFS de cada grupo, para conferir o equilíbrio sem ouvir
  medidor(){if(!this.med)return null;const o={},b=new Float32Array(2048);for(const n in this.med){this.med[n].getFloatTimeDomainData(b);let s=0,p=0;for(const v of b){s+=v*v;p=Math.max(p,Math.abs(v))}o[n]=[+(10*Math.log10(s/b.length+1e-12)).toFixed(1),+(20*Math.log10(p+1e-9)).toFixed(1)]}return o}
  chega(id,b){this.buf[id]=b;if(id==='ir'){const c=this.c,r=c.sampleRate/b.sampleRate,o=c.createBuffer(2,Math.floor(b.length*r),c.sampleRate);for(let k=0;k<2;k++){const a=b.getChannelData(k),q=o.getChannelData(k);for(let i=0;i<q.length;i++){const x=i/r,j=Math.floor(x),f=x-j;q[i]=(a[j]||0)*(1-f)+(a[j+1]||0)*f}}this.rev.buffer=o;return}if(id.startsWith('bed:'))this.criaCamada(id.slice(4),b);if(id==='motor')this.criaMotor(b);if(id.startsWith('tri:'))this.criaTrilha(id.slice(4),b)}
  // ---------- camadas contínuas ----------
  criaCamada(n,b){const c=this.c,s=c.createBufferSource(),g=c.createGain();g.gain.value=0;s.buffer=b;s.loop=true;s.connect(g);g.connect(n==='casco'?this.gBar:this.gAmb);s.start(0,Math.random()*b.duration);this.camadas[n]={s,g}}
  criaTrilha(n,b){const c=this.c,s=c.createBufferSource(),g=c.createGain();g.gain.value=0;s.buffer=b;s.loop=true;s.connect(g);g.connect(this.gMus);s.start();(this.tri=this.tri||{})[n]={s,g};if(this.tema&&this.tema.tri===n)s.playbackRate.value=this.tema.taxa}
  criaMotor(b){const c=this.c,s=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=1200;s.buffer=b;s.loop=true;s.connect(f);f.connect(g);g.connect(this.gBar);g.gain.value=0;s.start();this.motorS={s,g,f}}
  rampa(n,v,t=1.2){const o=this.camadas[n];if(o)o.g.gain.setTargetAtTime(v,this.c.currentTime,t)}
  // ---------- voz ----------
  // De onde vem cada fala, por ordem: 1) audio/narr_<id>.mp3 (com audio/narr_<id>.json de marcas de tempo, se houver);
  // 2) o .m4a antigo em ../audio/ (legenda = texto antigo); 3) só texto, em ritmo de leitura.
  // Nada é pedido às cegas: audio/indice.json diz o que existe, e assim um arquivo ausente não vira erro 404 no console.
  indice(){return this._ind||(this._ind=fetch('audio/indice.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null).then(j=>({novos:new Set((j&&j.arquivos)||[]),antigos:new Set((j&&j.antigos)||ANTIGOS_PADRAO)})))}
  fonte(nome){const id=idVoz(nome);if(!id)return Promise.resolve(null);if(this.fontes[id])return this.fontes[id];if(!this.c)return Promise.resolve({id,modo:'texto',buf:null,marcas:null});
    const dec=u=>fetch(u).then(r=>r.ok?r.arrayBuffer():Promise.reject(new Error('sem '+u))).then(a=>new Promise((ok,no)=>this.c.decodeAudioData(a,ok,no)));
    return this.fontes[id]=(async()=>{const o={id,modo:'texto',buf:null,marcas:null},ind=await this.indice();
      if(ind.novos.has('narr_'+id+'.mp3')){try{o.buf=await dec('audio/narr_'+id+'.mp3');o.modo='novo'}catch(e){o.buf=null}
        if(o.buf&&ind.novos.has('narr_'+id+'.json')){try{const j=await fetch('audio/narr_'+id+'.json',{cache:'no-store'}).then(r=>r.ok?r.json():null);const m=Array.isArray(j)?j.filter(q=>q&&isFinite(+q.t)&&typeof q.texto==='string').map(q=>({t:+q.t,texto:q.texto})).sort((x,y)=>x.t-y.t):[];if(m.length)o.marcas=m}catch(e){}}}
      if(!o.buf&&ANTIGO[id]&&ind.antigos.has(ANTIGO[id]+'.m4a')){try{o.buf=await dec('../audio/'+ANTIGO[id]+'.m4a');o.modo='antigo'}catch(e){o.buf=null}}
      this.pronta[id]=o;return o})()}
  // aceita os ids novos (abertura, b01…b14, final) e os nomes antigos (intro, fim, m01…m13)
  pre(nome){return this.fonte(nome).then(o=>o?o.buf:null)}
  infoVoz(nome){return this.pronta[idVoz(nome)]||null}
  duracao(nome){const o=this.infoVoz(nome);return o&&o.buf?o.buf.duration:0}
  // durTexto: segundos da fala quando não há som (número ou função do id); sem ele, usa this.durTexto(id), que o filme define
  async voz(nome,fim,durTexto){this.paraVoz();const ficha=++this._ficha,id=idVoz(nome)||'_texto';const o=nome?await this.fonte(nome):null;if(ficha!==this._ficha)return;
    const c=this.c,tem=!!(o&&o.buf&&c);if(tem&&c.state!=='running'&&!this._pausaGeral){try{await Promise.race([c.resume(),new Promise(r=>setTimeout(r,350))])}catch(e){}if(ficha!==this._ficha)return}
    const mudo=!tem||(c.state!=='running'&&!this._pausaGeral);let dT=typeof durTexto==='function'?durTexto(id):durTexto;if(!dT&&this.durTexto)dT=this.durTexto(id);
    this.dur=tem?o.buf.duration:(dT||24);this.fala={id,modo:tem?o.modo:'texto',marcas:tem?o.marcas:null,dur:this.dur,mudo,fim};
    if(mudo){this.semAudio=true;this.tx={ac:0,u:performance.now()};clearInterval(this._to);this._to=setInterval(()=>{const ag=performance.now(),d=(ag-this.tx.u)/1000;this.tx.u=ag;if(!this.semAudio)return clearInterval(this._to);if(!this.falaPausada&&!this._pausaGeral)this.tx.ac+=Math.min(d,1.2);if(this.tx.ac>=this.dur)this._acaba()},100);return}
    this._toca(o.buf,0)}
  _toca(buf,offs){const c=this.c,s=c.createBufferSource();s.buffer=buf;s.connect(this.gVoz);s.onended=()=>{if(this.cur===s)this._acaba()};this.cur=s;this.t0=c.currentTime+.05-offs;s.start(c.currentTime+.05,offs)}
  _acaba(){const f=this.fala;clearInterval(this._to);this.cur=null;this.semAudio=false;this.falaPausada=null;this.fala=null;f&&f.fim&&f.fim()}
  // segundos já ditos da fala atual: é o relógio das legendas (para junto com a pausa)
  tempoVoz(){if(!this.fala)return 0;if(this.falaPausada)return this.falaPausada.offs;if(this.semAudio)return Math.min(this.dur,this.tx.ac);if(!this.cur||!this.c)return 0;return Math.max(0,Math.min(this.dur,this.c.currentTime-this.t0))}
  // pausa só a voz, para ler com calma; o restante do mundo segue baixinho
  pausaVoz(v){if(v===false)return this.retomaVoz();if(!this.fala||this.falaPausada)return;if(this.semAudio){this.falaPausada={texto:true,offs:this.tx.ac};return}if(!this.cur||!this.c)return;const q=this.cur,offs=Math.max(0,Math.min(this.dur-.02,this.c.currentTime-this.t0));q.onended=null;this.cur=null;try{q.stop()}catch(e){}this.falaPausada={offs,buf:q.buffer}}
  retomaVoz(){const p=this.falaPausada;if(!p)return;this.falaPausada=null;if(p.texto||!this.c)return;this._toca(p.buf,p.offs)}
  paraVoz(){this._ficha++;clearInterval(this._to);this.falaPausada=null;this.semAudio=false;this.fala=null;if(this.cur){const s=this.cur;this.cur=null;s.onended=null;try{s.stop()}catch(e){}}}
  progresso(){if(!this.fala||!this.dur)return 0;return Math.max(0,Math.min(.999,this.tempoVoz()/this.dur))}
  falando(){return !!this.fala}
  pausa(v){this._pausaGeral=!!v;if(!this.c)return;v?this.c.suspend():this.c.resume()}
  // ---------- música por época ----------
  // 1927–1940 pioneiros: só cordas (a) · 1953–1996 consolidação: cordas, piano e flauta (b) · 2001–2026 hoje: a mesma, um tom acima
  temaPorAno(ano,toque=true){const a=parseInt(ano)||0,T=a<=1940?{nome:'pioneiros',tri:'a',taxa:1}:a<=1996?{nome:'consolidacao',tri:'b',taxa:1}:{nome:'hoje',tri:'b',taxa:1.1225};const ant=this.tema;this.tema=T;if(toque)this.um('toque',.3);
    if(this.c&&ant&&ant.tri===T.tri&&ant.taxa!==T.taxa){this.triMudo=this.c.currentTime+2.4;clearTimeout(this._tt);this._tt=setTimeout(()=>this._taxaTrilha(),1900)}else this._taxaTrilha();return T.nome}
  _taxaTrilha(){const T=this.tema,o=T&&this.tri&&this.tri[T.tri];if(o)o.s.playbackRate.value=T.taxa}
  // ---------- bichos: cada som nasce num ponto do espaço ----------
  toca(id,x,y,z,g=1,cfg={}){if(!this.ok||this.voices>14)return;const n=VAR[id]||1,chave=id+'#'+Math.floor(Math.random()*n);const b=this.buf[chave]||this.buf[id+'#0'];if(!b)return;const c=this.c,s=c.createBufferSource(),ga=c.createGain();s.buffer=b;s.playbackRate.value=(cfg.taxa||1)*(.97+Math.random()*.06);ga.gain.value=g;const p=c.createPanner();p.panningModel='equalpower';p.distanceModel='inverse';p.refDistance=cfg.ref||14;p.rolloffFactor=1;p.maxDistance=900;if(p.positionX){p.positionX.value=x;p.positionY.value=y;p.positionZ.value=z}else p.setPosition(x,y,z);const dist=this._cam?Math.hypot(x-this._cam.x,y-this._cam.y,z-this._cam.z):40;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.max(1400,18000/(1+dist*.022));s.connect(ga);ga.connect(lp);lp.connect(p);p.connect(this.gFauna);const rv=c.createGain();rv.gain.value=Math.min(.9,.1+dist*.006)*g;ga.connect(rv);rv.connect(this.rev);this.voices++;s.onended=()=>{this.voices--;s.disconnect();ga.disconnect();lp.disconnect();p.disconnect();rv.disconnect()};s.start()}
  bicho(t,x,y,z){const G={garca:.55,boto:.8,jacare:1,capivara:.5,guariba:1,tucano:.5,plop:.34,peixe:.3,mergulho:.7,pirarucu:.8,onca:1,arara:.75};const REF={guariba:90,onca:34,jacare:30,arara:40,boto:16,plop:10,peixe:10,mergulho:12};this.toca(t,x,y,z,G[t]||.6,{ref:REF[t]||16})}
  bando(t,x,y,z){for(let i=0;i<6;i++)setTimeout(()=>this.toca(i%3===2?'caninde':'arara',x+(Math.random()-.5)*14,y,z+(Math.random()-.5)*14,.62,{ref:42,taxa:.95+Math.random()*.12}),i*(620+Math.random()*700))}
  um(n,g=.6){if(!this.ok)return;const b=this.buf[n+'#0'];if(!b)return;const s=this.c.createBufferSource(),ga=this.c.createGain();ga.gain.value=g;s.buffer=b;s.connect(ga);ga.connect(this.gUi);s.start()}
  relampago(perto){if(!this.ok)return;const d=perto?.4+Math.random()*.5:1.6+Math.random()*2.6;if(perto)setTimeout(()=>this.um('raio',.5),d*1000);setTimeout(()=>{const n=Math.floor(Math.random()*2);const b=this.buf['trovao#'+n];if(!b)return;const s=this.c.createBufferSource(),g=this.c.createGain();g.gain.value=perto?.95:.62;s.buffer=b;s.playbackRate.value=.9+Math.random()*.25;s.connect(g);g.connect(this.fFora);const rv=this.c.createGain();rv.gain.value=.5;g.connect(rv);rv.connect(this.rev);s.start()},d*1000+80)}
  // ---------- o mix a cada instante ----------
  // final: 0..1, o desfecho — a música sobe, motor e mata recuam aos poucos
  // m: humor; v: velocidade; rpm; dentro: 0..1 (cabine); dist: câmera até o barco; altura da câmera; pos da câmera; dir frente
  atualiza(dt,{f,v,rpm,dentro,dist,alto,cam,frente,cima,margem,final}){if(!this.ok||!this.c)return;this._cam=cam;const c=this.c,L=c.listener,t=c.currentTime;this.quad=(this.quad||0)+1;
    if(L.positionX){L.positionX.value=cam.x;L.positionY.value=cam.y;L.positionZ.value=cam.z;L.forwardX.value=frente.x;L.forwardY.value=frente.y;L.forwardZ.value=frente.z;L.upX.value=cima.x;L.upY.value=cima.y;L.upZ.value=cima.z}else if(L.setPosition){L.setPosition(cam.x,cam.y,cam.z);L.setOrientation(frente.x,frente.y,frente.z,cima.x,cima.y,cima.z)}
    if(this.quad%8)return;
    const fin=this.fin=Math.max(0,Math.min(1,final||0));const voz=this.falando()&&!this.falaPausada?1:0;this.vozK=(this.vozK||0)+(voz-(this.vozK||0))*.25;const duck=1-.5*this.vozK;const A=this.vol.amb*(1-.62*fin),B=this.vol.bar*(1-.8*fin),M=this.vol.mus;this.gFauna.gain.setTargetAtTime(.62*(1-.62*this.vozK)*A,t,.25);this.gVoz.gain.setTargetAtTime(this.vol.voz*.95,t,.05);
    const k=.42*duck*A,al=Math.min(1,Math.max(0,(alto-12)/60));const perto=1-al*.7;
    this.rampa('noite',(f.grilos*.42+f.sapos*.42)*k*perto);this.rampa('dia',f.cigarra*.5*k*perto);this.rampa('manha',f.aves*.52*k*perto);this.rampa('rio',(.28+.2*(margem||0))*k*(1-al*.5));this.rampa('chuva',f.chuva*.36*(.6+.4*(1-dentro))*A*(1-.35*this.vozK),.8);
    this.rampa('vento',(.05+al*.5+f.chuva*.34)*k*1.5,1.6);
    this.fFora.frequency.setTargetAtTime(dentro>.5?1500:19000,t,.5);
    // motor e casco acompanham a câmera: perto ronca, no alto some
    const dG=1/(1+Math.pow(dist/26,1.5));const mg=(rpm>.01?(.1+rpm*.2):0)*(dentro>.5?1.5:(.34+dG*1.1))*B*(1-.25*this.vozK);if(this.motorS){const q=this.motorS;q.g.gain.setTargetAtTime(mg,t,.35);q.s.playbackRate.setTargetAtTime(.62+rpm*1.25,t,.4);q.f.frequency.setTargetAtTime(dentro>.5?620:(600+rpm*1100),t,.4)}
    this.rampa('casco',Math.min(1,v/12)*.34*(dentro>.5?.5:(.3+dG))*B*duck,.6);
    // trilha: segue a época da parada (ou a hora, antes da primeira), abre espaço para a voz e cresce no desfecho
    if(this.tri){const ta=f.chuva>.5&&fin<.05?'c':this.tema?this.tema.tri:(f.noite>.7?'b':f.aves>.7?'b':'a');const sm=(this.triVol===undefined?.26:this.triVol)*(1+2.3*fin),mudo=this.triMudo&&t<this.triMudo;for(const n of['a','b','c']){const o=this.tri[n];if(o)o.g.gain.setTargetAtTime((n===ta&&!mudo?sm:0)*M*(1-.46*this.vozK*(1-.35*fin)),t,mudo?.45:3)}}
    // chamadas soltas pelo mato, conforme a hora
    this.tAmb-=dt*8;if(this.tAmb<=0){this.tAmb=1.8+Math.random()*(f.aves>.4?4:9);const a=Math.random()*6.28,r=30+Math.random()*130,x=cam.x+Math.cos(a)*r,z=cam.z+Math.sin(a)*r,y=6+Math.random()*16;if(f.chuva<.4&&!(this.vozK>.5&&Math.random()<.7)){if(f.noite>.65){const w=Math.random();if(w<.3)this.toca('urutau',x,y,z,.42,{ref:70});else if(w<.5)this.toca('coruja',x,y,z,.36,{ref:50})}else if(f.noite>.25||(f.aves>.4&&f.cigarra<.3&&Math.random()<.25))this.toca('inhambu',x,y,z,.42,{ref:60});else if(f.aves>.2){const q=AVES_DIA[Math.floor(Math.random()*AVES_DIA.length)];this.toca(q,x,y,z,q==='piha'?.6:.4,{ref:q==='piha'?70:30})}}}}
}
