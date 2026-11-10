// Mixagem da viagem com WebAudio: ambiente em laço, trilha, efeitos e um motor diesel sintetizado que responde à aceleração.
const FAIXAS={grilos:'grilos.m4a',aves:'aves.m4a',agua:'agua.m4a',motor:'motor.m4a',trilha:'trilha.m4a'};
const UM={fosforo:'fosforo.m4a',chama:'chama.m4a',toque:'toque.m4a'};
export class Som{
  constructor(){this.c=null;this.silencio=false;this.buf={};this.g={};this.ok=false;this.duck=1;this.ler=1;this.tri=true;this.amb=true;this.dentro=false;this.rpm=0;this.diesel=null}
  async carrega(prog){
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.c=window.__somCtx||new AC();this.c.resume&&this.c.resume();this.mest=this.c.createGain();this.mest.connect(this.c.destination);
    const nomes=[...Object.entries(FAIXAS),...Object.entries(UM)];let k=0;
    await Promise.all(nomes.map(async([n,f])=>{try{const r=await fetch('viagem/som/'+f);if(r.ok){const a=await r.arrayBuffer();this.buf[n]=await this.c.decodeAudioData(a)}}catch(e){}prog&&prog(++k/nomes.length)}));
  }
  inicia(){if(!this.c)return;this.c.resume&&this.c.resume();for(const n of Object.keys(FAIXAS)){if(!this.buf[n])continue;const s=this.c.createBufferSource(),g=this.c.createGain();s.buffer=this.buf[n];s.loop=true;s.loopStart=.06;s.loopEnd=this.buf[n].duration-.06;g.gain.value=0;s.connect(g);g.connect(this.mest);s.start();this.g[n]={g,s}}this.criaDiesel();this.ok=true}
  // Três camadas: o bater dos cilindros, o corpo grave e o chiado do escapamento
  criaDiesel(){const c=this.c,saida=c.createGain();saida.gain.value=0;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=320;lp.Q.value=.7;lp.connect(saida);saida.connect(this.mest);
    const o1=c.createOscillator(),o2=c.createOscillator(),g1=c.createGain(),g2=c.createGain();o1.type='sawtooth';o2.type='square';g1.gain.value=.5;g2.gain.value=.24;o1.connect(g1);o2.connect(g2);g1.connect(lp);g2.connect(lp);
    const pulso=c.createOscillator(),amp=c.createGain(),prof=c.createGain();pulso.type='sawtooth';prof.gain.value=.5;amp.gain.value=.55;pulso.connect(prof);prof.connect(amp.gain);lp.disconnect();lp.connect(amp);amp.connect(saida);
    const n=c.createBufferSource(),b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;n.buffer=b;n.loop=true;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=900;bp.Q.value=.6;const gn=c.createGain();gn.gain.value=0;n.connect(bp);bp.connect(gn);gn.connect(saida);
    o1.start();o2.start();pulso.start();n.start();this.diesel={saida,lp,o1,o2,pulso,gn,bp}}
  rampa(n,v,t=1.5){const o=this.g[n];if(o)o.g.gain.setTargetAtTime(v,this.c.currentTime,t/3)}
  fase(){}
  liga(q,v){if(q==='trilha')this.tri=v;else this.amb=v}
  leitura(v){this.ler=v?.45:1}
  mudo(v){this.silencio=v;if(this.mest)this.mest.gain.setTargetAtTime(v?0:1,this.c.currentTime,.1)}
  um(n,vol=.9){if(!this.c||!this.buf[n])return;const s=this.c.createBufferSource(),g=this.c.createGain();s.buffer=this.buf[n];g.gain.value=vol;s.connect(g);g.connect(this.mest);s.start()}
  // Estalo curto do leme chegando ao batente
  batente(){if(!this.c)return;const c=this.c,o=c.createOscillator(),g=c.createGain();o.type='square';o.frequency.value=110;o.frequency.setTargetAtTime(55,c.currentTime,.02);g.gain.value=.11;g.gain.setTargetAtTime(0,c.currentTime,.03);o.connect(g);g.connect(this.mest);o.start();o.stop(c.currentTime+.16)}
  // rpm: 0 desligado, 1 máximo
  atualiza({v,hora,falando,rpm=0,dentro=false}){if(!this.ok)return;const f=(this._q=(this._q||0)+1);if(f%6)return;const k=this.ler*(falando?.5:1)*(this.amb?1:0),t=this.c.currentTime,fora=dentro?.5:1;
    // ambiente sempre bem abaixo da voz; dentro da cabine ele fica mais abafado
    this.rampa('grilos',(1-Math.min(1,hora*2.6))*.17*k*fora,1);this.rampa('aves',Math.min(1,hora*2.2)*.15*k*fora,1);this.rampa('agua',(.08+Math.min(1,v/16)*.14)*k*fora,1);this.rampa('trilha',.13*(falando?.6:1)*this.ler*(this.tri?1:0),1);
    this.rampa('motor',(rpm>.01?(.018+rpm*.05):0)*k*(dentro?1.5:1),.8);if(this.g.motor&&this.g.motor.s.playbackRate)this.g.motor.s.playbackRate.setTargetAtTime(.7+rpm*.8,t,.5);
    if(this.diesel){const d=this.diesel,hz=32+rpm*58;d.o1.frequency.setTargetAtTime(hz,t,.3);d.o2.frequency.setTargetAtTime(hz*.5,t,.3);d.pulso.frequency.setTargetAtTime(hz/2,t,.3);d.lp.frequency.setTargetAtTime(240+rpm*900,t,.3);d.gn.gain.setTargetAtTime(rpm*.022,t,.3);d.bp.frequency.setTargetAtTime(600+rpm*1400,t,.3);
      d.saida.gain.setTargetAtTime(rpm>.01?(.03+rpm*.085)*k*(dentro?1.55:.8):0,t,rpm>.01?.35:.5)}}
}
