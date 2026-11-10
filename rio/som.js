// A mixagem da viagem. Os sons nascem em som_sintese.js; aqui eles ganham lugar no espaço, reverberação de mata,
// e o equilíbrio muda sozinho: a voz sempre em primeiro plano, a floresta conforme a hora, o motor conforme a câmera.
const AVES_DIA=['piha','bemtevi','sabia','japim','martim','gaviao','tucano','maracana','arara'];const VAR={arara:3,caninde:2,tucano:2,garca:2,piha:2,bemtevi:2,sabia:3,japim:3,inhambu:2,urutau:1,coruja:1,martim:2,gaviao:1,maracana:2,guariba:1,onca:1,jacare:1,boto:2,capivara:2,plop:3,peixe:2,mergulho:2,pirarucu:1,trovao:3,raio:2,toque:1,fosforo:1,batente:1};
const LISTA_INICIAL=['ir','bed:rio','bed:noite','motor','bed:casco','fosforo#0','toque#0','bed:manha','plop#0','plop#1','plop#2','peixe#0','batente#0','bed:vento','tri:a','bed:dia','boto#0','boto#1','mergulho#0','garca#0','garca#1','arara#0','arara#1','arara#2','caninde#0','piha#0','piha#1','bemtevi#0','bemtevi#1','sabia#0','sabia#1','japim#0','japim#1','martim#0','gaviao#0','tucano#0','tucano#1','maracana#0','jacare#0','capivara#0','guariba#0','bed:chuva','trovao#0','trovao#1','raio#0','tri:c','pirarucu#0','onca#0','inhambu#0','inhambu#1','urutau#0','coruja#0','tri:b','sabia#2','japim#2'];

export class Som{
  constructor(){this.c=null;this.buf={};this.cur=null;this.t0=0;this.dur=0;this.ok=false;this.vol={voz:1,amb:1,bar:1,mus:1};this.b={};this.tAmb=3;this.tTro=0;this.camadas={};this.motorS=null;this.dentro=0;this.voices=0;this.pronto={}}
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
  criaTrilha(n,b){const c=this.c,s=c.createBufferSource(),g=c.createGain();g.gain.value=0;s.buffer=b;s.loop=true;s.connect(g);g.connect(this.gMus);s.start();(this.tri=this.tri||{})[n]={s,g}}
  criaMotor(b){const c=this.c,s=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=1200;s.buffer=b;s.loop=true;s.connect(f);f.connect(g);g.connect(this.gBar);g.gain.value=0;s.start();this.motorS={s,g,f}}
  rampa(n,v,t=1.2){const o=this.camadas[n];if(o)o.g.gain.setTargetAtTime(v,this.c.currentTime,t)}
  // ---------- voz ----------
  async pre(nome){if(this.buf[nome]||!this.c)return this.buf[nome];if(!this.buf['_'+nome])this.buf['_'+nome]=fetch('../audio/'+nome+'.m4a').then(r=>r.arrayBuffer()).then(a=>new Promise((ok,no)=>this.c.decodeAudioData(a,ok,no))).then(b=>{this.buf[nome]=b;return b}).catch(()=>null);return this.buf['_'+nome]}
  duracao(n){return this.buf[n]?this.buf[n].duration:0}
  async voz(nome,fim){this.paraVoz();this.esperando=nome;let b=this.buf[nome];if(!b)b=await this.pre(nome);if(this.esperando!==nome)return;if(!b||!this.c){this.dur=24;this.t0=performance.now()/1000;this.semAudio=true;clearTimeout(this._to);this._to=setTimeout(()=>{this.semAudio=false;fim&&fim()},this.dur*1000);return}
    this._fim=fim;const s=this.c.createBufferSource();s.buffer=b;s.connect(this.gVoz);s.onended=()=>{if(this.cur===s){this.cur=null;fim&&fim()}};this.cur=s;this.t0=this.c.currentTime+.05;this.dur=b.duration;s.start(this.t0)}
  // pausa só a voz, para ler com calma; o restante do mundo segue baixinho
  pausaVoz(v){if(!this.cur||!this.c)return;if(v){if(this._pv)return;this._pv={nome:null,offs:this.c.currentTime-this.t0,buf:this.cur.buffer,fim:this.cur.onended};const q=this.cur;q.onended=null;this.cur=null;this.semPausa=true;try{q.stop()}catch(e){}this.falaPausada=this._pv;return}}
  retomaVoz(){const p=this.falaPausada;if(!p||!this.c)return;this.falaPausada=null;this._pv=null;const s=this.c.createBufferSource();s.buffer=p.buf;s.connect(this.gVoz);s.onended=()=>{if(this.cur===s){this.cur=null;p.fim2&&p.fim2()}};this.cur=s;this.t0=this.c.currentTime+.05-p.offs;this.dur=p.buf.duration;p.fim2=this._fim;s.start(this.c.currentTime+.05,p.offs)}
  paraVoz(){this.esperando=null;this.falaPausada=null;this._pv=null;clearTimeout(this._to);this.semAudio=false;if(this.cur){const s=this.cur;this.cur=null;try{s.stop()}catch(e){}}}
  progresso(){if(this.semAudio)return Math.min(.999,(performance.now()/1000-this.t0)/this.dur);if(this.falaPausada)return Math.max(0,Math.min(.999,this.falaPausada.offs/this.dur));if(!this.cur||!this.c)return 0;return Math.max(0,Math.min(.999,(this.c.currentTime-this.t0)/this.dur))}
  falando(){return !!this.cur||!!this.semAudio}
  pausa(v){if(!this.c)return;v?this.c.suspend():this.c.resume()}
  // ---------- bichos: cada som nasce num ponto do espaço ----------
  toca(id,x,y,z,g=1,cfg={}){if(!this.ok||this.voices>14)return;const n=VAR[id]||1,chave=id+'#'+Math.floor(Math.random()*n);const b=this.buf[chave]||this.buf[id+'#0'];if(!b)return;const c=this.c,s=c.createBufferSource(),ga=c.createGain();s.buffer=b;s.playbackRate.value=(cfg.taxa||1)*(.97+Math.random()*.06);ga.gain.value=g;const p=c.createPanner();p.panningModel='equalpower';p.distanceModel='inverse';p.refDistance=cfg.ref||14;p.rolloffFactor=1;p.maxDistance=900;if(p.positionX){p.positionX.value=x;p.positionY.value=y;p.positionZ.value=z}else p.setPosition(x,y,z);const dist=this._cam?Math.hypot(x-this._cam.x,y-this._cam.y,z-this._cam.z):40;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.max(1400,18000/(1+dist*.022));s.connect(ga);ga.connect(lp);lp.connect(p);p.connect(this.gFauna);const rv=c.createGain();rv.gain.value=Math.min(.9,.1+dist*.006)*g;ga.connect(rv);rv.connect(this.rev);this.voices++;s.onended=()=>{this.voices--;s.disconnect();ga.disconnect();lp.disconnect();p.disconnect();rv.disconnect()};s.start()}
  bicho(t,x,y,z){const G={garca:.55,boto:.8,jacare:1,capivara:.5,guariba:1,tucano:.5,plop:.34,peixe:.3,mergulho:.7,pirarucu:.8,onca:1,arara:.75};const REF={guariba:90,onca:34,jacare:30,arara:40,boto:16,plop:10,peixe:10,mergulho:12};this.toca(t,x,y,z,G[t]||.6,{ref:REF[t]||16})}
  bando(t,x,y,z){for(let i=0;i<6;i++)setTimeout(()=>this.toca(i%3===2?'caninde':'arara',x+(Math.random()-.5)*14,y,z+(Math.random()-.5)*14,.62,{ref:42,taxa:.95+Math.random()*.12}),i*(620+Math.random()*700))}
  um(n,g=.6){if(!this.ok)return;const b=this.buf[n+'#0'];if(!b)return;const s=this.c.createBufferSource(),ga=this.c.createGain();ga.gain.value=g;s.buffer=b;s.connect(ga);ga.connect(this.gUi);s.start()}
  relampago(perto){if(!this.ok)return;const d=perto?.4+Math.random()*.5:1.6+Math.random()*2.6;if(perto)setTimeout(()=>this.um('raio',.5),d*1000);setTimeout(()=>{const n=Math.floor(Math.random()*2);const b=this.buf['trovao#'+n];if(!b)return;const s=this.c.createBufferSource(),g=this.c.createGain();g.gain.value=perto?.95:.62;s.buffer=b;s.playbackRate.value=.9+Math.random()*.25;s.connect(g);g.connect(this.fFora);const rv=this.c.createGain();rv.gain.value=.5;g.connect(rv);rv.connect(this.rev);s.start()},d*1000+80)}
  // ---------- o mix a cada instante ----------
  // m: humor; v: velocidade; rpm; dentro: 0..1 (cabine); dist: câmera até o barco; altura da câmera; pos da câmera; dir frente
  atualiza(dt,{f,v,rpm,dentro,dist,alto,cam,frente,cima,margem}){if(!this.ok||!this.c)return;this._cam=cam;const c=this.c,L=c.listener,t=c.currentTime;this.quad=(this.quad||0)+1;
    if(L.positionX){L.positionX.value=cam.x;L.positionY.value=cam.y;L.positionZ.value=cam.z;L.forwardX.value=frente.x;L.forwardY.value=frente.y;L.forwardZ.value=frente.z;L.upX.value=cima.x;L.upY.value=cima.y;L.upZ.value=cima.z}else if(L.setPosition){L.setPosition(cam.x,cam.y,cam.z);L.setOrientation(frente.x,frente.y,frente.z,cima.x,cima.y,cima.z)}
    if(this.quad%8)return;
    const voz=this.falando()?1:0;this.vozK=(this.vozK||0)+(voz-(this.vozK||0))*.25;const duck=1-.5*this.vozK;this.gFauna.gain.setTargetAtTime(.62*(1-.62*this.vozK)*this.vol.amb,t,.25);const A=this.vol.amb,B=this.vol.bar,M=this.vol.mus;this.gVoz.gain.setTargetAtTime(this.vol.voz*.95,t,.05);
    const k=.42*duck*A,al=Math.min(1,Math.max(0,(alto-12)/60));const perto=1-al*.7;
    this.rampa('noite',(f.grilos*.42+f.sapos*.42)*k*perto);this.rampa('dia',f.cigarra*.5*k*perto);this.rampa('manha',f.aves*.52*k*perto);this.rampa('rio',(.28+.2*(margem||0))*k*(1-al*.5));this.rampa('chuva',f.chuva*.36*(.6+.4*(1-dentro))*A*(1-.35*this.vozK),.8);
    this.rampa('vento',(.05+al*.5+f.chuva*.34)*k*1.5,1.6);
    this.fFora.frequency.setTargetAtTime(dentro>.5?1500:19000,t,.5);
    // motor e casco acompanham a câmera: perto ronca, no alto some
    const dG=1/(1+Math.pow(dist/26,1.5));const mg=(rpm>.01?(.1+rpm*.2):0)*(dentro>.5?1.5:(.34+dG*1.1))*B*(1-.25*this.vozK);if(this.motorS){const q=this.motorS;q.g.gain.setTargetAtTime(mg,t,.35);q.s.playbackRate.setTargetAtTime(.62+rpm*1.25,t,.4);q.f.frequency.setTargetAtTime(dentro>.5?620:(600+rpm*1100),t,.4)}
    this.rampa('casco',Math.min(1,v/12)*.34*(dentro>.5?.5:(.3+dG))*B*duck,.6);
    // trilha: muda com a hora e abre espaço para a voz
    if(this.tri){const e=this.triEst||(this.triEst={});const ta=f.chuva>.5?'c':f.noite>.7?'b':f.aves>.7?'b':'a';const sm=this.triVol===undefined?.26:this.triVol;for(const n of['a','b','c']){const o=this.tri[n];if(o)o.g.gain.setTargetAtTime((n===ta?sm:0)*M*(1-.46*this.vozK),t,3)}}
    // chamadas soltas pelo mato, conforme a hora
    this.tAmb-=dt*8;if(this.tAmb<=0){this.tAmb=1.8+Math.random()*(f.aves>.4?4:9);const a=Math.random()*6.28,r=30+Math.random()*130,x=cam.x+Math.cos(a)*r,z=cam.z+Math.sin(a)*r,y=6+Math.random()*16;if(f.chuva<.4&&!(this.vozK>.5&&Math.random()<.7)){if(f.noite>.65){const w=Math.random();if(w<.3)this.toca('urutau',x,y,z,.42,{ref:70});else if(w<.5)this.toca('coruja',x,y,z,.36,{ref:50})}else if(f.noite>.25||(f.aves>.4&&f.cigarra<.3&&Math.random()<.25))this.toca('inhambu',x,y,z,.42,{ref:60});else if(f.aves>.2){const q=AVES_DIA[Math.floor(Math.random()*AVES_DIA.length)];this.toca(q,x,y,z,q==='piha'?.6:.4,{ref:q==='piha'?70:30})}}}}
}
