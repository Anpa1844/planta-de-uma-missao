// A vida no rio: cada encontro tem hora e lugar, comportamento próprio, som e uma legenda de documentário.
import * as THREE from 'three';
import {sst,mix,clamp,rng,giro} from './util.js';
import * as C from './criatura.js';
import {Aves} from './aves.js';
import {integra} from './nucleo.js';
import {FaunaGLB} from './fauna_glb.js';

const v0=new THREE.Vector3();
export const ESPECIES_INFO={
  garca:{n:'Garça-branca-grande',c:'Ardea alba',f:'Pesca parada na beira d’água e abre até 1,7 metro de asa.'},
  boto:{n:'Boto-cor-de-rosa',c:'Inia geoffrensis',f:'O maior golfinho de rio do mundo. Com a idade, fica cada vez mais rosado.'},
  jacare:{n:'Jacaré-açu',c:'Melanosuchus niger',f:'O maior predador dos rios amazônicos: pode passar de 4 metros.'},
  capivara:{n:'Capivara',c:'Hydrochoerus hydrochaeris',f:'O maior roedor do mundo. Vive em grupo e nunca se afasta da água.'},
  vitoria:{n:'Vitória-régia',c:'Victoria amazonica',f:'Folhas de mais de 2 metros de diâmetro, com a borda levantada.'},
  arara:{n:'Arara-vermelha',c:'Ara chloropterus',f:'Forma casais duradouros e costuma voar aos pares, sempre falando alto.'},
  samauma:{n:'Samaúma',c:'Ceiba pentandra',f:'A “mãe da floresta” passa de 50 metros, sobre raízes em forma de parede.'},
  preguica:{n:'Preguiça',c:'Bradypus variegatus',f:'Passa quase a vida inteira nas árvores e desce cerca de uma vez por semana.'},
  guariba:{n:'Guariba',c:'Alouatta sp.',f:'O ronco deste macaco pode ser ouvido a quilômetros de distância.'},
  tracaja:{n:'Tracajá',c:'Podocnemis unifilis',f:'Toma sol em troncos e mergulha ao menor sinal de perigo.'},
  tucano:{n:'Tucano-grande',c:'Ramphastos tucanus',f:'O bico enorme é leve e ajuda a regular a temperatura do corpo.'},
  encontro:{n:'Encontro das águas',c:'Tapajós e Amazonas',f:'Em Santarém, o verde do Tapajós corre ao lado do barro do Amazonas sem se misturar.'},
  pirarucu:{n:'Pirarucu',c:'Arapaima gigas',f:'Pode passar de 2 metros e sobe à superfície para respirar ar.'},
  onca:{n:'Onça-pintada',c:'Panthera onca',f:'O maior felino das Américas. Nada muito bem e caça à beira dos rios.'},
  martim:{n:'Martim-pescador-grande',c:'Megaceryle torquata',f:'Paira sobre a água, fecha as asas e mergulha de bico para pegar o peixe.'},
  olhos:{n:'Olhos na margem',c:'Caiman crocodilus',f:'À noite os olhos do jacaré devolvem qualquer luz: cada brilho é um deles.'},
  // rodada 4 (fauna v1.3): espécies dos eventos soltos (entram no diário quando aparecem)
  tucuxi:{n:'Tucuxi',c:'Sotalia fluviatilis',f:'Golfinho pequeno e cinzento dos rios: salta inteiro fora d’água, muitas vezes em grupo.'},
  moura:{n:'Garça-moura',c:'Ardea cocoi',f:'A maior garça da América do Sul: cinzenta, de coroa preta, pesca imóvel na margem.'},
  pato:{n:'Pato-do-mato',c:'Cairina moschata',f:'O pato selvagem que deu origem ao pato doméstico; dorme no alto das árvores.'},
  bigua:{n:'Biguá',c:'Nannopterum brasilianum',f:'Mergulha atrás de peixes e depois abre as asas ao sol para secar as penas.'},
  ariranha:{n:'Ariranha',c:'Pteronura brasiliensis',f:'A “onça-d’água”: lontra gigante que vive em família e passa de 1,5 metro.'},
  borboleta:{n:'Borboleta-azul',c:'Morpho sp.',f:'O azul metálico não vem de pigmento: é luz refletida pela estrutura das escamas.'},
  lambari:{n:'Lambari',c:'Astyanax sp.',f:'Peixinhos de cardume que saltam juntos da água quando um predador se aproxima.'},
};
// aves que existem na versão procedural (aves.js); as outras só aparecem em GLB
const AVES_PROC=new Set(['arara','caninde','garca','tucano','urubu','papagaio','martim','morcego']);

export class Fauna{
  constructor({T,cena,rio,agua,ef,som,obras}){Object.assign(this,{T,cena,rio,agua,ef,som,obras});this.aves=new Aves(cena);this.cenas=[];this.grupo=new THREE.Group();cena.add(this.grupo);this.vistos=new Set();this.pedidoAtual=null;this.tp=4;this.lista=[];const R=this.R=rng(5);this.kit={};this.pool={};
    // os moldes só são gerados uma vez
    this.molde=n=>{if(!this.kit[n]){const q=C[n]();q.mat.envMap=obras.K.env;q.mat.envMapIntensity=.5;q.mat.userData.env=.5;obras.K.comEnv.push(q.mat);this.kit[n]=q}return this.kit[n]};
    // V6 rodada 2: GLB por espécie (carrega em segundo plano; enquanto não chega, ou se não existir, vale a fauna procedural)
    this.glb=new FaunaGLB({T,env:obras.K.env,comEnv:obras.K.comEnv,aoMaterial:m=>{try{if(m.isMeshStandardMaterial)integra(m,{copa:true,chave:'fglb'})}catch(e){}}});this.glb.carrega();
    this.criaCenas();this.saltos=[];this.tUrubu=0;this.evs=[];this.criaAgenda()}
  // ---------- água: respingo (gotas), anéis e som do mesmo evento ----------
  // tipo: 'respingo' | 'mergulho' | 'boto' | 'peixe' (nomes dos eventos de som). forca na escala de ef.respingo (1 = mergulho de martim-pescador; 2 = boto caindo).
  // o: {gotas: opções de ef.respingo · anel: opções de agua.anel · anelK: fator da força do anel · som:false para calar}
  agita(tipo,x,z,forca=1,o={}){this.ef&&this.ef.respingo(x,0,z,forca,o.gotas||{});this.anel(x,z,forca*(o.anelK===undefined?1:o.anelK),o.anel);if(o.som!==false)this.somEv(typeof o.som==='string'?o.som:tipo,x,0,z,forca);this.nAgita=(this.nAgita||0)+1}
  anel(x,z,forca=.3,opts){const a=this.agua;if(!a)return;if(a.anel)a.anel(x,z,Math.max(.12,Math.min(2,forca)),opts||{});else if(a.respingo)a.respingo(x,z,.4+forca*.7,.05*forca)}
  somEv(n,x,y,z,forca=1){const s=this.som;if(!s)return;if(s.evento)s.evento(n,{x,y,z,forca});else if(s.bicho)s.bicho({respingo:'plop',peixe:'peixe',boto:'boto',mergulho:'mergulho'}[n]||n,x,y,z)}
  // ave: GLB animado se a espécie existir em fauna/ (até o limite da qualidade); senão, a ave de aves.js (instanciada, asa no shader)
  // No GLB: tamanho real (esc é ignorado), a batida de asa e o giro da cabeça vêm do clipe; pousada, o corpo já vem em pé (sem inclinar) e a origem são os pés
  // (yPousada no índice desfaz a altura que a cena soma). g: {pitch, fase} só para o GLB (ex.: mergulho do martim, em que o clipe vira a ave de bico para baixo).
  // rodada 4: sem GLB (ou com o teto cheio), a garça-moura vira garça procedural e as espécies sem versão procedural simplesmente não aparecem (antes: aves.poe com tipo inexistente quebrava)
  ave(n,x,y,z,esc,yaw,pitch,fase,dobra=0,rol=0,cab=0,clip,g){const G=this.glb,I=G.tem(n)?G.doQuadro(n,this.grupo):null;if(!I){const r=AVES_PROC.has(n)?n:n==='moura'?'garca':null;return r?this.aves.poe(r,x,y,z,esc,yaw,pitch,fase,dobra,rol,cab):null}
    const c=clip||(dobra>.5?'pousada':'voo');if(c==='pousada'){pitch=0;rol=0;y+=G.esp[n].d.yPousada||0}if(g&&g.pitch!==undefined)pitch=g.pitch;
    I.obj.position.set(x,y,z);I.obj.rotation.set(pitch,yaw,rol,'YZX');if(g&&g.fase!==undefined)I.fase(c,g.fase);else I.toca(c,g&&g.vel?{vel:g.vel}:undefined);return I}
  // bicho de água (sem versão procedural) por quadro: GLB ou nada
  bicho(n,x,y,z,yaw,clip,o={}){const G=this.glb,I=G.tem(n)?G.doQuadro(n,this.grupo):null;if(!I)return null;I.obj.position.set(x,y,z);I.obj.rotation.set(o.pitch||0,yaw,0,'YXZ');if(o.fase!==undefined)I.fase(clip,o.fase,o.dt);else I.toca(clip,{fade:o.fade||.35});return I}
  // cópia GLB que fica com a cena/evento (sem reserva procedural)
  // lateral (com sinal) a 'folga' metros da borda, recuando até a água ter pelo menos 0,4 m de fundo
  naAgua(s,lado,folga){let l=this.rio.borda(s,lado)-folga;for(let i=0;i<30&&this.rio.altura(s,lado*l)>-.4;i++)l-=1;return lado*l}
  pegaGLB(n){const I=this.glb.pega(n);if(!I)return null;this.grupo.add(I.obj);return I.obj}
  // ---------- salto de boto/tucuxi ----------
  // rodada 4 (fauna v1.3): se o GLB tem o clipe "salto" de verdade, o CORPO (altura e inclinação) vem do clipe e o código dá só o avanço,
  // o respingo/anel/som na saída e na volta, achadas na própria trilha do osso raiz. Sem o clipe real, vale o arco do código (como antes).
  saltoReal(q){const I=q&&q.userData.glb;if(!I)return null;const E=this.glb.esp[I.especie],c=E&&E.clips.salto;if(!c||c.name!=='salto')return null;
    if(!E._sj){const D=c.duration,T=c.tracks.find(t=>/raiz\.position$/.test(t.name));let sai=.3,volta=.7;
      if(T){const th=-.15,n=T.times.length;let i0=-1,i1=-1;for(let i=1;i<n;i++){const a=T.values[(i-1)*3+1],b=T.values[i*3+1];if(i0<0&&a<th&&b>=th)i0=i-1+(th-a)/(b-a);else if(i0>=0&&i1<0&&a>=th&&b<th)i1=i-1+(a-th)/(a-b)}
        const tm=k=>{const i=Math.floor(k),f=k-i;return T.times[i]+(T.times[Math.min(n-1,i+1)]-T.times[i])*f};if(i0>=0)sai=tm(i0)/D;if(i1>=0)volta=tm(i1)/D}
      E._sj={D,sai,volta,v:I.especie==='tucuxi'?4:3.2}}return E._sj}
  // e = {x,z,yaw,f(0→1),sai,volta}; forca 1 = boto. Devolve true quando o salto acaba
  pulo(e,q,dt,forca=1){const S=this.saltoReal(q),I=q.userData.glb,si=Math.sin(e.yaw),co=Math.cos(e.yaw);q.visible=true;
    if(S){e.f+=dt/S.D;const p=Math.min(e.f,1);e.x+=si*dt*S.v;e.z+=co*dt*S.v;q.position.set(e.x,0,e.z);q.rotation.set(0,e.yaw,0,'YXZ');I.fase('salto',p,dt);
      if(!e.sai&&p>=S.sai){e.sai=true;this.agita('boto',e.x,e.z,1.1*forca,{gotas:{alt:1.2,dir:[si*1.6,co*1.6]},anelK:.7})}
      if(!e.volta&&p>=S.volta){e.volta=true;this.agita('mergulho',e.x+si*.6,e.z+co*.6,2*forca,{gotas:{abre:1.25,dir:[si*1.2,co*1.2]},anelK:.8,anel:{n:2,intervalo:.5}})}
      return e.f>=1}
    if(!e.sai){e.sai=true;this.agita('boto',e.x,e.z,1.1*forca,{gotas:{alt:1.2,dir:[si*1.6,co*1.6]},anelK:.7})}
    e.f+=dt/2.1;const p=e.f,y=Math.sin(p*Math.PI)*1.15-.55,yv=Math.cos(p*Math.PI);e.x+=si*dt*4.2;e.z+=co*dt*4.2;q.position.set(e.x,y,e.z);q.rotation.set(-yv*.62,e.yaw,0,'YXZ');const O=q.userData.o;for(let k=1;k<7;k++)O['b'+k].rotation.x=Math.sin(p*6.28+k*.6)*.08-(yv*.03);I&&I.fase('salto',p,dt);
    if(p>=1){this.agita('mergulho',e.x,e.z,2*forca,{gotas:{abre:1.25,dir:[si*1.2,co*1.2]},anelK:.8,anel:{n:2,intervalo:.5}});return true}return false}
  // ---------- agenda: eventos soltos ao longo do rio, por posição (não por quadro), mais densos nas qualidades maiores ----------
  // rodada 4: ~25% mais eventos e dez tipos (fauna v1.3: tucuxi, pato-do-mato, biguá, ariranha, borboleta-azul, cardume de lambari, garça-moura no rasante)
  criaAgenda(){const R=rng(77),A=[],rio=this.rio,passo=[170,105,68][this.T],TIPOS=[['martim',.15],['rasante',.13],['boto',.11],['peixe',.09],['tucuxi',.11],['pato',.1],['bigua',.08],['ariranha',.08],['cardume',.08],['borboleta',.07]];let s=400;
    while(s<rio.L-520){let w=R(),tipo='peixe';for(const [n,p] of TIPOS){if(w<p){tipo=n;break}w-=p}const lado=R()<.5?-1:1;
      if(!this.cenas.some(c=>Math.abs(c.s-s)<60))A.push({s:Math.round(s),tipo,lado,feito:false});s+=passo*(.7+R()*.6)}this.agenda=A}
  // dispara um evento solto perto do barco. perto=true: bem ao lado (para teste e captura)
  evento(tipo,x,lado=1,perto=false){const R=this.R,W=Math.max(8,x.w-5),ds=perto?16:22+R()*16,lat=clamp(x.lat+lado*(perto?9:9+R()*9),-W,W),o=this.pos(x.s+ds,lat),P=new THREE.Vector3(o.px,0,o.pz);
    if(tipo==='peixe'){const q=this.saltaPeixe(x,ds,lat-x.lat);return q?{tipo,alvo:new THREE.Vector3(q.x,q.y,q.z)}:null}
    if(tipo==='martim'){const b=this.pos(x.s+ds+12,lado*(this.rio.borda(x.s+ds+12,lado)+2)),A=new THREE.Vector3(b.px,7,b.pz),yaw=Math.atan2(P.x-A.x,P.z-A.z),H=4.2;const e={tipo,t:0,alvo:new THREE.Vector3(P.x,2.2,P.z),f:0,fase:0};
      // chega da margem, paira, fecha as asas e mergulha de bico; some meio segundo, sai com o peixe e volta para a margem
      e.upd=dt=>{e.t+=dt;const t=e.t;e.f+=dt*(t<2.2?17:t<3.4?26:16);let X=P.x,Y=H,Z=P.z,pit=0,dob=0,yw=yaw,clip='voo',vis=true,g;
        if(t<2.2){const k=sst(0,2.2,t);X=mix(A.x,P.x,k);Z=mix(A.z,P.z,k);Y=mix(A.y,H,k)+Math.sin(t*3)*.15}
        else if(t<3.4){Y=H+Math.sin(t*9)*.06;pit=-.55*sst(2.2,2.7,t);clip='paira'}
        else if(t<3.85){const k=(t-3.4)/.45;Y=mix(H,.05,k*k);pit=mix(-.55,-1.45,sst(0,.35,k));dob=sst(.05,.4,k);clip='mergulho';g={pitch:0,fase:mix(.36,.8,sst(0,.6,k))}}
        else if(t<4.5){vis=false;if(e.fase===0){e.fase=1;this.agita('mergulho',P.x,P.z,1,{gotas:{alt:1.15},anelK:.8,anel:{n:2,intervalo:.4}});this.vistos.add('martim')}}
        else{if(e.fase===1){e.fase=2;this.agita('respingo',P.x,P.z,.45,{gotas:{alt:1.3,dir:[-Math.sin(yaw)*.8,-Math.cos(yaw)*.8]},anelK:.6})}const k=sst(4.5,7.3,t);X=mix(P.x,A.x,k);Z=mix(P.z,A.z,k);Y=mix(.1,6.5,Math.sqrt(k));yw=yaw+Math.PI;pit=.5*(1-sst(4.5,5.4,t));g={pitch:-pit}}
        if(vis)this.ave('martim',X,Y,Z,1.5,yw,pit,e.f,dob,0,0,clip,g);return t>=7.3};this.evs.push(e);return e}
    if(tipo==='rasante'){// garça em voo rasante: a ponta da asa e os pés tocam a água três vezes
      const a=this.pos(x.s+ds+52,lat),b=this.pos(x.s+ds-34,clamp(lat+lado*4,-W,W)),yaw=Math.atan2(b.px-a.px,b.pz-a.pz),D=7.5,toq=[.34,.52,.7];const e={tipo,t:0,alvo:new THREE.Vector3(P.x,.6,P.z),f:0,i:0};
      e.upd=dt=>{e.t+=dt;const k=e.t/D,X=mix(a.px,b.px,k),Z=mix(a.pz,b.pz,k);e.f+=dt*8.5;let baixo=0;for(const q of toq)baixo=Math.max(baixo,1-Math.min(1,Math.abs(k-q)/.05));const Y=.95-baixo*.5+2.4*(sst(.12,0,k)+sst(.84,1,k));
        if(e.i<toq.length&&k>=toq[e.i]){e.i++;this.anel(X,Z,.22);this.ef&&this.ef.respingo(X,0,Z,.25,{n:5,dir:[Math.sin(yaw)*1.5,Math.cos(yaw)*1.5]});this.somEv('respingo',X,0,Z,.25)}
        e.alvo.set(X,.6,Z);this.ave(e.moura?'moura':'garca',X,Y,Z,1.55,yaw,-.05,e.f,0,Math.sin(e.t*.8)*.06);return k>=1};if(this.glb.tem('moura')&&R()<.4){e.moura=true;this.vistos.add('moura')}this.evs.push(e);return e}
    if(tipo==='boto'){let q=(this.pool.boto||[]).pop();if(!q)q=this.m('boto');else this.grupo.add(q);const e={tipo,t:0,alvo:new THREE.Vector3(P.x,.6,P.z),x:P.x,z:P.z,yaw:x.h+(R()-.5)*.5,f:0,m:q};q.visible=true;
      e.fim=()=>{q.visible=false;if(q.parent)q.parent.remove(q);if(!q.userData.glb)(this.pool.boto=this.pool.boto||[]).push(q)};
      e.upd=dt=>{const fim=this.pulo(e,q,dt);e.alvo.set(e.x,.6,e.z);if(fim){this.vistos.add('boto');e.fim();return true}return false};this.evs.push(e);return e}
    // ---- rodada 4: espécies novas (só em GLB; sem o arquivo, o evento vira boto ou peixe) ----
    const G=this.glb,yawR=x.h+(R()-.5)*.6,si=Math.sin(yawR),co=Math.cos(yawR);
    if(tipo==='tucuxi'){// dois ou três tucuxis saltam juntos, defasados
      if(!G.tem('tucuxi'))return this.evento('boto',x,lado,perto);const n=R()<.4?3:2,L=[];for(let i=0;i<n;i++){const q=this.pegaGLB('tucuxi');if(!q)break;q.visible=false;L.push({q,x:P.x+co*(i-.5)*1.8-si*i*1.2,z:P.z-si*(i-.5)*1.8-co*i*1.2,yaw:yawR+(R()-.5)*.15,f:-i*.28-R()*.1})}if(!L.length)return null;
      const e={tipo,alvo:new THREE.Vector3(P.x,.6,P.z),volta:0};e.fim=()=>{for(const b of L)if(b.q.parent)b.q.parent.remove(b.q)};
      e.upd=dt=>{let vivos=0,cx=0,cz=0;for(const b of L){if(b.f<0){b.f+=dt/2.25;vivos++;continue}if(b.f>=1)continue;vivos++;if(this.pulo(b,b.q,dt,.75)){b.f=1;b.q.visible=false}cx+=b.x;cz+=b.z}if(cx)e.alvo.set(cx/Math.max(1,L.filter(b=>b.f>=0&&b.f<1).length),.6,cz/Math.max(1,L.filter(b=>b.f>=0&&b.f<1).length));
        if(!vivos){if(e.volta<1&&R()<.5){e.volta++;L.forEach((b,i)=>{b.f=-i*.3-.6;b.sai=b.volta=false})}else{this.vistos.add('tucuxi');e.fim();return true}}return false};this.evs.push(e);return e}
    if(tipo==='pato'){// bando nadando rente à margem; quando o barco chega, corre na água e levanta voo
      if(!G.tem('pato'))return this.evento('martim',x,lado,perto);const lat0=this.naAgua(x.s+ds+10,lado,3.5+R()*3),N=[2,4,5][this.T],bs=[];
      for(let i=0;i<N;i++){const o=this.pos(x.s+ds+8+i*1.6+R(),lat0+(R()-.5)*1.4);bs.push({x:o.px,z:o.pz,y:0,yaw:x.h+Math.PI+(R()-.5)*.5,t:-1,d:i*.22+R()*.2,vy:0,v:.5})}
      const e={tipo,t:0,alvo:new THREE.Vector3(bs[0].x,.4,bs[0].z)},fx=Math.sin(x.h),fz=Math.cos(x.h);
      e.upd=dt=>{e.t+=dt;const b0=this._x.bp;let cx=0,cz=0,ok=0;for(const b of bs){const d=Math.hypot(b.x-b0.x,b.z-b0.z);if(b.t<0&&b.esp===undefined&&(d<34||e.t>6))b.esp=b.d;
          if(b.t<0&&b.esp!==undefined){b.esp-=dt;if(b.esp<=0){b.t=1e-3;b.yaw=Math.atan2(fx,fz)+lado*.5+(R()-.5)*.3;if(b===bs[0])this.agita('respingo',b.x,b.z,.3,{anelK:.6})}}
          let clip='nada';if(b.t>0){b.t+=dt;b.v=Math.min(11,b.v+dt*9);const sob=sst(.5,1.4,b.t);b.y=Math.min(14,b.y+dt*(.4+sob*3.2));clip='voo';if(b.t<.9&&Math.random()<dt*9)this.anel(b.x,b.z,.12)}else{b.yaw+=Math.sin(e.t*.7+b.d*9)*dt*.3}
          b.x+=Math.sin(b.yaw)*b.v*dt;b.z+=Math.cos(b.yaw)*b.v*dt;if(b.y<14){ok++;cx+=b.x;cz+=b.z;this.ave('pato',b.x,clip==='voo'?b.y+.15:0,b.z,1,b.yaw,clip==='voo'?-.12*sst(0,.6,b.t):0,0,0,0,0,clip)}}
        if(ok)e.alvo.lerp(v0.set(cx/ok,1,cz/ok),.1);if(e.t>1&&bs.some(b=>b.t>.3))this.vistos.add('pato');return !ok||e.t>18};this.evs.push(e);return e}
    if(tipo==='bigua'){// nada baixo, mergulha, reaparece mais à frente e sai voando rente à água
      if(!G.tem('bigua'))return this.evento('peixe',x,lado,perto);const b={x:P.x,z:P.z,yaw:x.h+lado*.9};const e={tipo,t:0,alvo:new THREE.Vector3(P.x,.4,P.z),ev:0};
      e.upd=dt=>{e.t+=dt;const t=e.t;let clip='nada',y=0,vis=true,v=.5,pit=0;
        if(t>=3&&t<5.6){vis=false;v=1.6;if(e.ev===0){e.ev=1;this.agita('respingo',b.x,b.z,.3,{anelK:.8,anel:{n:2,intervalo:.35}})}}
        else if(t>=5.6&&e.ev===1){e.ev=2;this.anel(b.x,b.z,.28);this.somEv('peixe',b.x,0,b.z,.4)}
        if(t>=3&&t<3.4){vis=true;pit=.9*sst(3,3.4,t);y=-.25*sst(3,3.4,t)}
        if(t>9.5){clip='voo';v=Math.min(12,(t-9.5)*10);y=.25+sst(9.5,12,t)*2.2;if(t<10.2&&Math.random()<dt*10)this.anel(b.x,b.z,.12)}
        b.x+=Math.sin(b.yaw)*v*dt;b.z+=Math.cos(b.yaw)*v*dt;if(t<9.5)b.yaw+=Math.sin(t*.6)*dt*.2;if(vis)this.ave('bigua',b.x,y,b.z,1,b.yaw,clip==='voo'?-.1:pit,0,0,0,0,clip);e.alvo.lerp(v0.set(b.x,.4+y,b.z),.15);if(t>2)this.vistos.add('bigua');return t>14};this.evs.push(e);return e}
    if(tipo==='ariranha'){// família nadando em fila; a primeira para e "espia" (periscópio) o barco, depois todas mergulham
      if(!G.tem('ariranha'))return this.evento('peixe',x,lado,perto);const N=[1,2,3][this.T]+(this.T>0&&R()<.4?1:0),o0=this.pos(x.s+ds+6,this.naAgua(x.s+ds+6,lado,5+R()*4));const e={tipo,t:0,alvo:new THREE.Vector3(o0.px,.4,o0.pz),x:o0.px,z:o0.pz,yaw:x.h+Math.PI*(R()<.5?1:0)+lado*.15};e.trilha=Array.from({length:140},(_,k)=>[e.x-Math.sin(e.yaw)*k*.05,e.z-Math.cos(e.yaw)*k*.05,e.yaw]);
      e.upd=dt=>{e.t+=dt;const t=e.t,esp=t>3&&t<7,v=esp?0:1.2;if(!esp){e.x+=Math.sin(e.yaw)*v*dt;e.z+=Math.cos(e.yaw)*v*dt;e.yaw+=Math.sin(t*.9)*dt*.25}
        // trilha por distância (um ponto a cada 5 cm): cada ariranha segue a da frente a 1,7 m
        const u=e.trilha[0];if(!u||Math.hypot(u[0]-e.x,u[1]-e.z)>.05){e.trilha.unshift([e.x,e.z,e.yaw]);if(e.trilha.length>140)e.trilha.length=140}
        const afunda=sst(10,11.2,t)*.7;if(t>=10&&!e.mg){e.mg=true;this.agita('respingo',e.x,e.z,.35,{anelK:.9,anel:{n:2,intervalo:.3}})}
        for(let i=0;i<N;i++){const [X,Z,Y]=i===0?[e.x,e.z,e.yaw]:(e.trilha[i*34]||e.trilha[e.trilha.length-1]);
          if(t<11.3)this.bicho('ariranha',X,-afunda+Math.sin(t*4+i)*.03,Z,Y,i===0&&esp?'espia':'nada',{fade:.5})}
        if(t>1.5&&Math.random()<dt*1.5)this.anel(e.x,e.z,.1);e.alvo.lerp(v0.set(e.x,.4,e.z),.12);if(t>2)this.vistos.add('ariranha');return t>11.5};this.evs.push(e);return e}
    if(tipo==='borboleta'){// duas ou três borboletas-azuis cruzam o rio na frente do barco, em zigue-zague
      if(!G.tem('borboleta')||this.T===0)return this.evento('martim',x,lado,perto);const sA=x.s+12+Math.max(2,x.v)*5,N=this.T===2?3:2,bs=[];for(let i=0;i<N;i++)bs.push({ds:(R()-.5)*5,y:1.4+R()*1.6,f:R()*6,atraso:i*.8+R()*.5});
      const e={tipo,t:0,alvo:new THREE.Vector3()};e.upd=dt=>{e.t+=dt;let cx=0,cy=0,cz=0,n=0;for(const b of bs){const k=(e.t-b.atraso)/16;if(k<0||k>1)continue;const lat=x.lat+lado*mix(-14,14,k)+Math.sin(e.t*2.1+b.f)*1.2,s=sA+b.ds+Math.sin(e.t*1.3+b.f)*2,o=this.pos(s,lat,b.o||(b.o={})),y=b.y+Math.sin(e.t*3.7+b.f)*.35+Math.sin(e.t*1.1+b.f)*.3;
          const yaw=Math.atan2(o.nx*lado,o.nz*lado)+Math.cos(e.t*2.1+b.f)*.6;this.ave('borboleta',o.px,y,o.pz,1,yaw,0,0,0,Math.sin(e.t*3+b.f)*.2,0,'voo',{vel:1+Math.sin(e.t*2+b.f)*.25});cx+=o.px;cy+=y;cz+=o.pz;n++}
        if(n)e.alvo.set(cx/n,cy/n,cz/n);if(n&&e.t>2)this.vistos.add('borboleta');return e.t>bs[bs.length-1].atraso+16};this.evs.push(e);return e}
    if(tipo==='cardume'){// cardume de lambari: dezenas de peixinhos saltam juntos da água, fugindo de um predador
      const IN=this.lambaris();if(!IN)return this.evento('peixe',x,lado,perto);const N=[14,22,32][this.T],ps=[];for(let i=0;i<N;i++){const a=yawR+(R()-.5)*1.3,r=R()*2.2;ps.push({x:P.x+Math.sin(a+1.6)*r,z:P.z+Math.cos(a+1.6)*r,a,t0:R()*1.8+(R()<.3?R()*1.2:0),dur:.28+R()*.22,h:.12+R()*.3,L:.4+R()*.9,anel:R()<.35})}
      const e={tipo,t:0,alvo:new THREE.Vector3(P.x,.3,P.z)};this.somEv('peixe',P.x,0,P.z,.5);
      e.fim=()=>IN.n(0);e.upd=dt=>{e.t+=dt;let k=0;for(const p of ps){const q=(e.t-p.t0)/p.dur;if(q<0)continue;if(q>=1){if(!p.ok){p.ok=true;if(p.anel)this.anel(p.x+Math.sin(p.a)*p.L,p.z+Math.cos(p.a)*p.L,.1)}continue}if(!p.sai){p.sai=true;if(p.anel)this.anel(p.x,p.z,.1)}
          IN.poe(k++,p.x+Math.sin(p.a)*p.L*q,Math.sin(q*Math.PI)*p.h-.02,p.z+Math.cos(p.a)*p.L*q,p.a,1.5,-Math.cos(q*Math.PI)*.9)}IN.n(k);if(e.t>1.2&&!e.s2){e.s2=true;this.somEv('peixe',P.x,0,P.z,.4)}if(e.t>1)this.vistos.add('lambari');const fim=e.t>3.6;if(fim)IN.n(0);return fim};this.evs.push(e);return e}
    return null}
  // instâncias estáticas (pose de repouso) do lambari, criadas uma vez
  // rodada 4: tapete de vitórias-régias na cena "vitoria" (instâncias estáticas da v1.3, criadas uma vez; o reinício só reposiciona)
  vitorias(c){if(this._vr===undefined){this._vr=this.glb.tem('vitoria')?this.glb.instancias('vitoria',24,true):null;if(this._vr)this.grupo.add(this._vr.grupo)}const V=this._vr;if(!V)return;const R=rng(1180),rio=this.rio,N=[10,16,24][this.T],fs=c.fs=[];
    for(let i=0;i<N*4&&fs.length<N;i++){const s=c.s+(R()-.5)*46,lat=this.naAgua(s,c.lado,.5)-c.lado*R()*R()*10,e=.5+R()*.7,o=this.pos(s,lat);if(rio.altura(s,lat)>-.25)continue;if(fs.some(f=>Math.hypot(f.x-o.px,f.z-o.pz)<(f.e+e)*.78))continue;fs.push({x:o.px,z:o.pz,e,yaw:R()*6.28,f:R()*6})}
    fs.forEach((f,i)=>V.poe(i,f.x,.01,f.z,f.yaw,f.e));V.n(fs.length);if(fs.length){const m=fs.reduce((a,f)=>[a[0]+f.x/fs.length,a[1]+f.z/fs.length],[0,0]);c.alvo.set(m[0],.2,m[1])}}
  lambaris(){if(this._lb!==undefined)return this._lb;const I=this.glb.tem('cardume')?this.glb.instancias('cardume',40,true):null;if(I){this.grupo.add(I.grupo);I.n(0)}return this._lb=I}
  // só para teste e captura: fauna.teste('boto'|'martim'|'peixe'|'rasante'[,lado]) → {tipo, alvo:[x,y,z]} (ponto para mirar a câmera)
  teste(tipo,lado=1){const x=this._x;if(!x)return null;const e=this.evento(tipo,x,lado,true);return e?{tipo,alvo:e.alvo.toArray().map(v=>+v.toFixed(2))}:null}
  // estado para conferência: o que há em GLB, a agenda e o que está ativo
  info(){return {glb:this.glb.estado,glbTeto:this.glb.teto,glbMixers:this.glb.mixers||0,glbCopias:Object.fromEntries(Object.entries(this.glb.esp).map(([n,E])=>[n,E.inst.length+'/'+E.max])),glbRelatorio:this.glb.relatorio,agenda:this.agenda.map(a=>[a.s,a.tipo,a.lado,a.feito?1:0]),ativos:this.evs.map(e=>e.tipo),agitos:this.nAgita||0}}
  // rodada 3 (fauna v1.3): uma em cada quatro garças da margem é garça-moura, se o GLB existir
  nomeGarca(b){if(b.mo===undefined)b.mo=Math.random()<.25;return b.mo&&this.glb&&this.glb.tem('moura')?'moura':'garca'}
  m(n,reserva){const I=this.glb.pega(n);if(I){this.grupo.add(I.obj);return I.obj}
    /* Rodada 3: a cópia procedural é reaproveitada quando a sua cena acaba (antes, cada ciclo criava esqueletos novos e as texturas de ossos se acumulavam: +9 texturas e +4 geometrias por reinício) */
    const k=reserva||n,L=(this.procs||(this.procs={}))[k]||(this.procs[k]=[]);let q=L.find(o=>!o.parent);
    if(q){q.position.set(0,0,0);q.rotation.set(0,0,0);q.scale.setScalar(1);q.visible=true;for(const [b,p,r,e] of q.userData.rep)b.position.copy(p),b.quaternion.copy(r),b.scale.copy(e)}
    else{q=this.molde(k).novo();q.userData.rep=[];q.traverse(b=>{if(b.isBone)q.userData.rep.push([b,b.position.clone(),b.quaternion.clone(),b.scale.clone()])});L.push(q)}
    this.grupo.add(q);return q}
  pos(s,lat,o={}){return this.rio.mundo(s,lat,o)}
  // ---------- roteiro de encontros ----------
  criaCenas(){const rio=this.rio;const add=(id,s,lado,ini,upd,opts={})=>{this.cenas.push({id,s,lado,ini,upd,on:false,feito:false,t:0,info:ESPECIES_INFO[opts.info||id],cam:opts.cam,dur:opts.dur||9,de:opts.de||90,ate:opts.ate||60,alvo:new THREE.Vector3(),disparou:false,...opts})};
    add('garca',318,1,(c)=>{const R=this.R,W=rio.borda(c.s,c.lado);c.bs=[];for(let i=0;i<10;i++){const s=c.s+R()*44-22,lat=c.lado*(W+(R()-.5)*1.5-.4),o=this.pos(s,lat);c.bs.push({x:o.px,y:Math.max(rio.altura(s,lat),.02)+.5,z:o.pz,yaw:R()*6.28,voa:0,f:R()*6,vx:0,vy:0,vz:0,d:R()*.8,cab:R()*6})}c.alvo.set(c.bs[0].x,1,c.bs[0].z)},(c,dt,t,x)=>{let d=1e9;for(const b of c.bs){const q=Math.hypot(b.x-x.bp.x,b.z-x.bp.z);if(q<d)d=q;if(!b.voa&&q<46+b.d*16){b.voa=1e-3;this.som&&this.som.bicho('garca',b.x,b.y,b.z);if(b.y<1.2)this.anel(b.x,b.z,.22);const a=x.h+(R0(b)-.5)*1.2;b.vx=Math.sin(a)*(4+b.d*2);b.vz=Math.cos(a)*(4+b.d*2);b.vy=2.2+b.d;b.yaw=a}
        if(b.voa>16)continue;if(b.voa){b.voa+=dt;b.f+=dt*10.5;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.vy*=1-dt*.15;this.ave(this.nomeGarca(b),b.x,b.y,b.z,1.55,b.yaw,-.08,b.f,clamp(1-b.voa*2.6,0,1),0,0,b.voa<.7?'decola':'voo')}else this.ave(this.nomeGarca(b),b.x,b.y,b.z,1.55,b.yaw,-.62,0,1,0,Math.sin(t*.4+b.cab)*.8)}c.alvo.lerp(v0.set(c.bs[3].x,c.bs[3].y,c.bs[3].z),.04)},{cam:{p:'faunaPerto',dist:20,h:1.1,fov:30,ay:.3},de:62,ate:40,dur:9});
    add('boto',566,1,(c)=>{c.ms=[this.m('boto'),this.m('boto')];c.st=[{f:-1,e:1,t:1.2,ds:18,dl:9},{f:-1,e:-1,t:3.2,ds:30,dl:13}];for(const q of c.ms)q.visible=false},(c,dt,t,x)=>{c.st.forEach((e,i)=>{const q=c.ms[i];if(e.f<0){e.t-=dt;q.visible=false;if(e.t<=0&&x.dir>0){e.f=0;e.sai=e.volta=false;const o=this.pos(x.s+e.ds,x.lat+e.e*e.dl);e.x=o.px;e.z=o.pz;e.yaw=x.h+(this.R()-.5)*.5}}else{/* rodada 4: corpo pelo clipe 'salto' real (pulo) */if(this.pulo(e,q,dt)){e.f=-1;e.t=3+this.R()*3.5;q.visible=false;e.ds=10+this.R()*26;e.dl=7+this.R()*11;e.e=this.R()<.5?1:-1}c.alvo.lerp(v0.set(e.x,.6,e.z),.1)}})},{cam:{p:'faunaPerto',dist:18,h:1.2,fov:40,ay:.2},de:50,ate:70,dur:10,noSeguir:true});
    add('jacare',896,1,(c)=>{const m=c.m=this.m('jacare');const W=rio.borda(c.s,c.lado);c.lat=c.lado*(W+4.2);c.fase=0;c.tt=0;c.gira=0;m.scale.setScalar(1.5);this.colocaJacare(c)},(c,dt,t,x)=>{const m=c.m,O=m.userData.o,G=m.userData.glb;c.tt+=dt;const o=this.pos(c.s,c.lat,c.o||(c.o={}));const d=Math.hypot(o.px-x.bp.x,o.pz-x.bp.z);
        if(c.fase===0){O.maxi.rotation.x=.14+Math.sin(c.tt*.18)*.14;if(d<52){c.fase=1;this.som&&this.som.bicho('jacare',o.px,1,o.pz)}}
        if(c.fase===1){O.maxi.rotation.x*=1-dt*4;c.lat-=c.lado*dt*2.2;for(let i=0;i<7;i++)O['c'+i].rotation.y=Math.sin(c.tt*5-i*.8)*.13*(i+1)*.28;for(const [n,fs] of [['fe',0],['td',0],['fd',3.14],['te',3.14]])O[n+'1'].rotation.y=Math.sin(c.tt*5+fs)*.5;const h=rio.altura(c.s,c.lat);if(h<-.14){c.fase=2;this.agita('mergulho',o.px,o.pz,2.2,{gotas:{abre:1.4,alt:.8},anelK:.75,anel:{n:3,intervalo:.55}})}}
        if(c.fase===2){c.lat-=c.lado*dt*1.55*(G?1-sst(11,15,c.tt-(c.t2||(c.t2=c.tt))):1);for(let i=0;i<7;i++)O['c'+i].rotation.y=Math.sin(c.tt*3.2-i*.75)*.11*(i+1)*.3;if(((c.tt*2)|0)%2===0&&Math.random()<dt*6)this.agua.respingo(o.px,o.pz,.8,.02);if(c.tt>26)c.fase=3}
        const h=rio.altura(c.s,c.lat);m.position.set(o.px,c.fase>=2?(-.16-Math.max(0,c.tt-22)*.03):Math.max(h-.02,-.16),o.pz);
        // GLB: ao sol o clipe "margem" (origem no chão); para descer usa o "nadar" (origem na linha d'água: em terra sobe 0,31 m × escala para a barriga arrastar no chão);
        // na água nada uns 12 s e fica boiando ("parado": só olhos, narinas e dorso de fora)
        if(G){const boia=c.fase>=2&&c.tt-(c.t2||c.tt)>12;G.toca(c.fase===0?'sol':c.fase===1?'anda':boia?'boia':'nada',{fade:.6});m.position.y=c.fase===0?Math.max(h,0):c.fase===1?Math.max(h,0)+.31*m.scale.y*sst(-.02,.1,h):-Math.max(0,c.tt-(c.t2||c.tt)-24)*.03}m.rotation.set(0,Math.atan2(-o.nx*c.lado,-o.nz*c.lado)+(c.fase<2?.95:.4),0,'YXZ');c.alvo.set(m.position.x,m.position.y+.24,m.position.z)},{cam:{p:'faunaPerto',dist:15,h:.7,fov:30,ay:.15},de:58,ate:42,dur:11});
    add('capivara',1058,1,(c)=>{const W=rio.borda(c.s,c.lado),R=this.R;c.bs=[];for(let i=0;i<6;i++){const m=this.m('capivara'),pup=i>=4;const s=c.s+(i-2.5)*2.3+R()*1.2,dl=i===0?.2:1+R()*2.6;const lat=c.lado*(W+dl);m.scale.setScalar(pup?.56:.95+R()*.14);c.bs.push({m,s,lat,dl,pup,f:R()*6,est:i===0||i===3?'bebe':(i===1?'alerta':'come'),t:R()*8,yaw:Math.atan2(0,0)})}c.alvo.set(0,0,0)},(c,dt,t,x)=>{for(const b of c.bs){const O=b.m.userData.o;b.t+=dt;const o=this.pos(b.s,b.lat,b.o||(b.o={}));const y=Math.max(rio.altura(b.s,b.lat),-.04);b.m.position.set(o.px,y,o.pz);const y0=Math.atan2(-o.nx*c.lado,-o.nz*c.lado)+(b.est==='alerta'?1.1:b.est==='come'?(b.f-3)*.25:.12);b.m.rotation.y=y0;
          const ciclo=Math.sin(b.t*.42+b.f);let baixo=0,beb=0;if(b.est==='bebe'){baixo=sst(-.6,.1,ciclo);beb=baixo*Math.sin(b.t*5.5)*.03;if(baixo>.8&&Math.random()<dt*.9){this.anel(o.px-o.nx*c.lado*.9,o.pz-o.nz*c.lado*.9,.16)}}else if(b.est==='come'){baixo=.72*sst(-.5,.2,ciclo);beb=baixo*Math.sin(b.t*3.2)*.02}
          if(b.m.userData.glb){b.m.userData.glb.toca(b.est==='bebe'&&baixo>.5?'bebe':b.est==='come'&&baixo>.4?'come':'parada',{fade:.5});b.m.rotation.order='YXZ';b.m.rotation.x=baixo*.2}O.pesc.rotation.x=baixo*.72+beb;O.cab.rotation.x=baixo*.42+beb*.6;O.pesc.rotation.y=b.est==='alerta'?Math.sin(b.t*.3)*.28:0;O.orE.rotation.z=Math.max(0,Math.sin(b.t*1.7+b.f)-.93)*6;O.orD.rotation.z=-Math.max(0,Math.sin(b.t*1.3+b.f)-.95)*6;O.raiz.position.y=.42+Math.sin(b.t*.9+b.f)*.004;}
        const q=c.bs[0].m.position;c.alvo.set(q.x,q.y+.42,q.z)},{cam:{p:'faunaPerto',dist:11,h:.6,fov:30,ay:.05},de:56,ate:50,dur:12});
    add('vitoria',1180,1,(c)=>{const o=this.pos(c.s,c.lado*(rio.larg(c.s)*.7));c.alvo.set(o.px,.2,o.pz);this.vitorias(c)},(c,dt,t)=>{const V=this._vr;if(V&&c.fs)c.fs.forEach((f,i)=>V.poe(i,f.x,.01+Math.sin(t*.7+f.f)*.012,f.z,f.yaw+Math.sin(t*.23+f.f)*.02,f.e))},{cam:{p:'fixa',lat:30,h:6,fov:40,av:30},de:60,ate:60,dur:7,info:'vitoria'});
    add('arara',1310,1,(c)=>{const R=this.R;c.bs=[];const o=this.pos(c.s-16,c.lado*(rio.larg(c.s)+70));const fim=this.pos(c.s+10,-c.lado*(rio.larg(c.s)+90));c.p0=[o.px,o.pz];c.fim=[fim.px,fim.pz];for(let i=0;i<8;i++){const b={dx:(R()-.5)*8,dz:(R()-.5)*8,y:9+R()*4,f:R()*6,k:(i>>1)%2,par:(i>>1)*4};if(i%2){const a=c.bs[i-1];b.dx=a.dx+1.2;b.dz=a.dz-.9;b.y=a.y+.35}c.bs.push(b)}c.p=0;c.tt=0},(c,dt,t,x)=>{if(!c.inicio)return;if(!c.rota){c.rota=true;const W=rio.larg(x.s),a=this.pos(x.s+34,c.lado*W*.9),b=this.pos(x.s+46,-c.lado*W*.9);c.p0=[a.px,a.pz];c.fim=[b.px,b.pz];c.alvo.set(a.px,10.5,a.pz)}c.tt+=dt;c.p=Math.min(1.25,c.p+dt/17);const yaw=Math.atan2(c.fim[0]-c.p0[0],c.fim[1]-c.p0[1]);if(!c.fala&&c.p>.1){c.fala=true;this.som&&this.som.bando('arara',mix(c.p0[0],c.fim[0],.5),28,mix(c.p0[1],c.fim[1],.5))}let cx=0,cz=0;for(const b of c.bs){b.f+=dt*(8.2+b.k);const q=c.p-b.par*.008;const X=mix(c.p0[0],c.fim[0],q)+b.dx,Z=mix(c.p0[1],c.fim[1],q)+b.dz,Y=b.y+Math.sin(c.tt*.6+b.f*.1)*1.2;cx+=X;cz+=Z;this.ave(b.k?'arara':'caninde',X,Y,Z,1.9,yaw,0,b.f,0,Math.sin(c.tt+b.dx)*.08)}c.alvo.lerp(v0.set(cx/8,10.5,cz/8),Math.min(1,dt*2.5))},{cam:{p:'fauna',fov:30,h:2.2,ay:0},de:42,ate:40,dur:12});
    add('samauma',1392,-1,(c)=>{const W=rio.borda(c.s,c.lado),o=this.pos(c.s,c.lado*(W+9));c.alvo.set(o.px,23,o.pz)},()=>{},{cam:{p:'olhaCima',fov:68,h:1.1,ds:20},de:50,ate:36,dur:7});
    add('olhos',3792,1,(c)=>{/* rodada 4: jacaretingas boiando rente à margem (só olhos e dorso de fora); afundam quando o barco chega perto */const W=rio.borda(c.s,c.lado),R=this.R;c.bs=[];for(let i=0;i<[1,2,3][this.T];i++){const m=this.pegaGLB('jacaretinga');if(!m)break;const s=c.s+(i-1)*11+R()*4,lat=this.naAgua(s,c.lado,1)-c.lado*(1+R()*3);const o=this.pos(s,lat);m.position.set(o.px,0,o.pz);m.rotation.set(0,Math.atan2(-o.nx*c.lado,-o.nz*c.lado)+(R()-.5)*1.6,0);m.userData.glb.toca('boia');c.bs.push({m,afunda:0})}const o=this.pos(c.s,c.lado*(W-3));c.alvo.set(o.px,.2,o.pz)},(c,dt,t,x)=>{for(const b of c.bs||[]){const p=b.m.position,d=Math.hypot(p.x-x.bp.x,p.z-x.bp.z);if(!b.afunda&&d<18){b.afunda=1e-3;this.anel(p.x,p.z,.25);this.somEv('respingo',p.x,0,p.z,.3);b.m.userData.glb.toca('nada',{fade:.6})}if(b.afunda){b.afunda+=dt;p.y=-b.afunda*.25;if(b.afunda>3)b.m.visible=false}}if(c.bs&&c.bs.length)this.vistos.add('olhos')},{semPlano:true,cam:{},de:30,ate:90,dur:9});
    add('preguica',1556,-1,(c)=>{const W=rio.borda(c.s,c.lado),o=this.pos(c.s,c.lado*(W-1.5));c.m=this.m('preguica');c.m.scale.setScalar(1.3);c.y=6;c.m.position.set(o.px,c.y,o.pz);c.m.rotation.y=o.h+1.2;c.galho=this.galho(this.pos(c.s,c.lado*(W+8)),o,c.y+.86,this.pos(c.s,c.lado*(W-9)));c.alvo.set(o.px,c.y,o.pz);c.tt=0;c.tronco=true},(c,dt,t)=>{c.tt+=dt;const O=c.m.userData.o,k=Math.sin(c.tt*.34);O.pesc.rotation.y=Math.sin(c.tt*.22)*.6;O.cab.rotation.x=.25+Math.sin(c.tt*.15)*.14;O.fe1.rotation.x=Math.max(0,k)*.34;O.td1.rotation.x=Math.max(0,-k)*.3;O.raiz.position.y=Math.sin(c.tt*.4)*.02},{cam:{p:'faunaPerto',dist:9,h:2.6,fov:36,ay:.2},de:56,ate:44,dur:11});
    add('guariba',1778,1,(c)=>{const W=rio.borda(c.s,c.lado),o=this.pos(c.s,c.lado*(W+6)),R=this.R;c.y=11;c.bs=[];const A=this.pos(c.s-8,c.lado*(W+3)),B=this.pos(c.s+8,c.lado*(W+1));this.galho(A,B,c.y-.5,null,.26);for(let i=0;i<6;i++){const m=this.m('macaco'),q=i/5;m.scale.setScalar(i<2?1.7:1.15+R()*.3);m.position.set(mix(A.px,B.px,q*.8+.1),c.y+.2,mix(A.pz,B.pz,q*.8+.1));m.rotation.y=A.h+(c.lado>0?-1.57:1.57)+(R()-.5)*.8;c.bs.push({m,f:R()*6,t:R()*5})}c.alvo.set(o.px,c.y+.5,o.pz);c.falou=false},(c,dt,t,x)=>{if(!c.falou&&Math.abs(x.s-c.s)<130){c.falou=true;this.som&&this.som.bicho('guariba',c.alvo.x,c.y,c.alvo.z)}for(const b of c.bs){b.t+=dt;const O=b.m.userData.o;const gr=Math.max(0,Math.sin(b.t*.5+b.f));O.cab.rotation.x=-.3*gr;O.peito.rotation.x=-.12*gr;O.cab.rotation.y=Math.sin(b.t*.3+b.f)*.5;for(let i=0;i<5;i++)O['r'+i].rotation.x=.22+Math.sin(b.t*.6+i)*.05}},{cam:{p:'faunaPerto',dist:20,h:3,fov:24,ay:.5},de:60,ate:60,dur:10});
    add('tracaja',2192,1,(c)=>{const W=rio.borda(c.s,c.lado),o=this.pos(c.s,c.lado*(W-5));const lg=this.tronco(o.px,.04,o.pz,o.h+.4,5.4,.3);c.bs=[];for(let i=0;i<6;i++){const m=this.m('tartaruga'),q=(i/5-.5)*4.2;m.scale.setScalar(.9+this.R()*.35);const a=o.h+.4;m.position.set(o.px+Math.sin(a)*q,m.userData.glb?.33:.3,o.pz+Math.cos(a)*q);m.userData.glb&&m.userData.glb.toca('parada');m.rotation.y=a+(i%2?0:3.14)+(this.R()-.5)*.6;c.bs.push({m,sai:0,d:i*.28+this.R()*.3})}c.alvo.set(o.px,.5,o.pz)},(c,dt,t,x)=>{const d=Math.hypot(c.alvo.x-x.bp.x,c.alvo.z-x.bp.z);for(const b of c.bs){if(!b.sai&&d<36-b.d*6){b.sai=1e-3}if(b.sai){b.sai+=dt;if(b.sai>b.d&&!b.foi){b.foi=true;this.agita('respingo',b.m.position.x,b.m.position.z,.45,{anelK:.7})}if(b.foi){b.m.userData.glb&&b.m.userData.glb.toca('nada');b.m.position.y-=dt*.8;if(b.m.position.y<-.5)b.m.visible=false}}}},{cam:{p:'faunaPerto',dist:10,h:.8,fov:30,ay:.1},de:56,ate:30,dur:8});
    add('tucano',2432,-1,(c)=>{const W=rio.borda(c.s,c.lado),o=this.pos(c.s,c.lado*(W+1));c.y=9.5;const gA=this.pos(c.s,c.lado*(W+5)),gB=this.pos(c.s,c.lado*(W-3));this.galho(gA,gB,c.y-.12,null,.075);c.x=o.px;c.z=o.pz;c.tt=0;const rio0=this.pos(c.s,0),yr=Math.atan2(rio0.px-o.px,rio0.pz-o.pz);
      // os dois pousam em cima do galho (a altura do galho vem da mesma conta de galho()), virados para o rio
      c.b=[{k:.44,cab:0,yaw:yr+.5},{k:.6,cab:2,yaw:yr-.7}].map(b=>({...b,p:this.noGalho(gA,gB,c.y-.12,b.k,.075)}));c.alvo.set(c.b[0].p.x,c.b[0].p.y+.25,c.b[0].p.z);c.voa=0},(c,dt,t,x)=>{c.tt+=dt;const d=Math.hypot(c.x-x.bp.x,c.z-x.bp.z);if(!c.gr&&d<70){c.gr=true;this.som&&this.som.bicho('tucano',c.x,c.y,c.z)}for(const b of c.b){this.ave('tucano',b.p.x,b.p.y+.2,b.p.z,1.9,b.yaw,-.34,0,1,0,Math.sin(c.tt*1.1+b.cab)*.9)}},{cam:{p:'faunaPerto',dist:12,h:4,fov:22,ay:.1},de:54,ate:44,dur:8});
    add('encontro',2764,1,(c)=>{const o=this.pos(c.s,0);c.alvo.set(o.px,0,o.pz)},(c,dt,t,x)=>{},{cam:{p:'voo',h:64,fov:56,ds:-40,av:120},de:50,ate:80,dur:10});
    add('pirarucu',2650,-1,(c)=>{c.tt=-1;c.m=this.m('pirarucu','peixe');c.m.scale.setScalar(c.m.userData.glb?1:2.4);c.m.visible=false},(c,dt,t,x)=>{c.tt+=dt;if(c.tt>0&&!c.foi){c.foi=true;const o=this.pos(x.s+26,x.lat+c.lado*13);c.x=o.px;c.z=o.pz;c.a=x.h;c.alvo.set(c.x,.2,c.z);this.som&&this.som.bicho('pirarucu',c.x,0,c.z);this.agita('peixe',c.x,c.z,1.5,{som:false,anelK:.8,anel:{n:2}})}if(c.foi){const q=clamp((c.tt)/2.4,0,1);c.m.visible=q<1;c.m.position.set(c.x+Math.sin(c.a)*q*2.4,Math.sin(q*3.14)*.42-.48,c.z+Math.cos(c.a)*q*2.4);c.m.rotation.set(Math.cos(q*3.14)*.42,c.a,0,'YXZ');c.m.userData.glb&&c.m.visible&&c.m.userData.glb.toca('nada')}},{cam:{p:'fauna',fov:24,h:3,ay:.1},de:40,ate:30,dur:6});
    add('onca',3215,1,(c)=>{const W=rio.borda(c.s,c.lado);c.m=this.m('onca');c.m.scale.setScalar(1.05);c.dl=2.4;c.q=c.s-38;c.est='anda';c.tt=0;c.f=0;c.m.castShadow=true;c.alvo.set(0,0,0)},(c,dt,t,x)=>{c.tt+=dt;const m=c.m,O=m.userData.o;const W=rio.borda(c.q,c.lado),lat=c.lado*(W+c.dl),o=this.pos(c.q,lat,c.o||(c.o={}));const y=rio.altura(c.q,lat);const d=Math.hypot(o.px-x.bp.x,o.pz-x.bp.z);if(c.est==='anda'&&d<40&&!c.parou){c.parou=true;c.est='olha';c.tt=0;this.som&&this.som.bicho('onca',o.px,y,o.pz)}if(c.est==='olha'&&c.tt>6){c.est='bebe';c.tt=0}if(c.est==='bebe'&&c.tt>6){c.est='anda';c.tt=0;c.sai=true}
        const anda=c.est==='anda'?1:0;c.andaK=(c.andaK||0)+(anda-(c.andaK||0))*Math.min(1,dt*3);if(anda){c.q+=dt*1.25;if(c.sai)c.dl+=dt*1.4}c.f+=dt*5.2*c.andaK;const F=c.f,k=c.andaK;const pas=[['fe',0],['td',.5],['fd',3.14],['te',3.64]];for(const [n,ph] of pas){const a=Math.sin(F+ph);const dianteira=n[0]==='f';O[n+'1'].rotation.x=a*.42*k;O[n+'2'].rotation.x=(dianteira?Math.max(0,-a)*-.5:Math.max(0,a)*.5)*k;O[n+'3'].rotation.x=-a*.22*k}
        O.raiz.position.y=.62+Math.sin(F*2)*.012*k;O.peito.rotation.z=Math.sin(F)*.03*k;O.quadril.rotation.z=-Math.sin(F)*.03*k;for(let i=0;i<6;i++){O['rabo'+i].rotation.y=Math.sin(t*1.3-i*.6)*.13;O['rabo'+i].rotation.x=-.06+(i>3?-.16:.07)}
        const ol=c.est==='olha'?1:0;c.olK=(c.olK||0)+(ol-(c.olK||0))*Math.min(1,dt*1.8);const yawBase=o.h+(c.sai?-c.lado*.6:0);const q=giro(Math.atan2(x.bp.x-o.px,x.bp.z-o.pz)-yawBase);O.pesc.rotation.y=clamp(q*.55,-1,1)*c.olK;O.cab.rotation.y=clamp(q*.45,-.8,.8)*c.olK;const beb=c.est==='bebe'?sst(.2,1.4,c.tt)*(1-sst(5,6,c.tt)):0;O.pesc.rotation.x=beb*.86-(1-beb)*.06;O.cab.rotation.x=beb*.42;O.peito.position.y=-beb*.12+.02;if(beb>.9&&Math.random()<dt*2)this.anel(o.px-o.nx*c.lado*1.2,o.pz-o.nz*c.lado*1.2,.15);
        m.userData.glb&&m.userData.glb.toca(c.est==='anda'?'anda':c.est==='bebe'?'bebe':'parada');m.position.set(o.px,y,o.pz);m.rotation.y=yawBase+(c.est==='bebe'?-c.lado*.7:0);c.alvo.set(o.px,y+.7,o.pz)},{cam:{p:'faunaPerto',dist:15,h:1.1,fov:27,ay:.1},de:58,ate:40,dur:14});
    this.ordem=this.cenas.slice().sort((a,b)=>a.s-b.s)}
  colocaJacare(c){}
  // galho grosso de A até B, com musgo, para pousar bichos
  galho(A,B,y,C2,r=.22){const a=new THREE.Vector3(A.px,y+.9,A.pz),b=new THREE.Vector3(B.px,y,B.pz);class Cv extends THREE.Curve{getPoint(t,o=new THREE.Vector3()){return o.copy(a).lerp(b,t).add(new THREE.Vector3(0,Math.sin(t*3.14)*.5+Math.sin(t*9)*.08,Math.sin(t*7)*.1))}}const g=new THREE.TubeGeometry(new Cv(),10,r,7,false);const P=g.attributes.position,c=new THREE.Vector3();for(let i=0;i<P.count;i++){const k=i/P.count;c.fromBufferAttribute(P,i);const q=new THREE.Vector3().copy(a).lerp(b,k);c.sub(q);P.setXYZ(i,q.x+c.x*mix(1,.5,k),q.y+c.y*mix(1,.5,k)+Math.sin(k*3.14)*.5,q.z+c.z*mix(1,.5,k))}g.computeVertexNormals();const m=new THREE.Mesh(g,this.matCasca());m.castShadow=true;this.grupo.add(m);return m}
  // ponto em cima do galho feito por galho(A,B,y,_,r), na fração k do comprimento (a mesma conta da geometria)
  noGalho(A,B,y,k,r=.22){const f=mix(1,.5,k),bx=Math.sin(k*3.14)*.5+Math.sin(k*9)*.08;return new THREE.Vector3(mix(A.px,B.px,k),mix(y+.9,y,k)+bx*f+Math.sin(k*3.14)*.5+r*f,mix(A.pz,B.pz,k)+Math.sin(k*7)*.1*f)}
  tronco(x,y,z,yaw,L,r){const g=new THREE.CylinderGeometry(r*.8,r,L,9,1);g.rotateX(Math.PI/2);g.rotateY(yaw);g.translate(x,y,z);const m=new THREE.Mesh(g,this.matCasca());this.grupo.add(m);return m}
  matCasca(){if(!this._mc){const m=this._mc=new THREE.MeshStandardMaterial({color:0x8a6e50,roughness:.95,envMap:this.obras.K.env,envMapIntensity:.5});m.userData.env=.5;this.obras.K.comEnv.push(m);integra(m,{copa:false,chave:'cg',extra:sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n{float q=texture2D(tRuido,vMundo.xz*.4+vMundo.y*.31).b;float mu=smoothstep(.45,.75,texture2D(tRuido,vMundo.xz*.13).g+.2);diffuseColor.rgb=mix(diffuseColor.rgb*(.55+.8*q),vec3(.1,.2,.05),mu*.55);}')}})}return this._mc}
  especial(n){return null}
  // ---------- por quadro ----------
  atualiza(dt,tJ,x,m){this.aves.comeca();this.glb.comeca();this._x=x;const s=x.s;
    // agenda de eventos soltos (por posição no rio) e os que estão em curso
    if(x.dir>0&&dt>0)for(const a of this.agenda){if(a.feito||s<a.s)continue;a.feito=true;if(s>a.s+40)continue;const f=m.f;if(a.tipo!=='boto'&&a.tipo!=='tucuxi'&&(f.noite>.45||f.chuva>.5))continue;if(this.evs.length<[2,4,5][this.T])this.evento(a.tipo,x,a.lado)}
    for(let i=this.evs.length-1;i>=0;i--)if(this.evs[i].upd(dt))this.evs.splice(i,1);
    for(const c of this.cenas){if(!c.feito&&!c.on&&s>c.s-(c.de+70)&&s<c.s+c.ate){c.on=true;c.ini&&c.ini(c);c.t=0}if(c.on){c.t+=dt;if(c.upd&&!(s>c.s+110&&(c.id==='garca'||c.id==='tucano')))c.upd(c,dt,tJ,x); // aves pousadas que ficaram 110 m para trás não são mais desenhadas

        // cópias GLB de cenas paradas (capivaras, jacaré) somem quando o barco já passou 110 m: liberam o teto para a cena seguinte
        if(c.id==='capivara'||c.id==='jacare'||c.id==='olhos'){const v=s<c.s+110;for(const q of c.bs||[c])if(q.m&&q.m.userData.glb){q.m.visible=v;q.m.userData.glb.dorme=!v}}}}
    // peixes saltando perto do barco, de vez em quando
    this.tp-=dt;if(this.tp<=0&&x.v>.2){this.tp=5+this.R()*11;this.saltaPeixe(x)}
    for(let i=this.saltos.length-1;i>=0;i--){const p=this.saltos[i];p.t+=dt/p.dur;const q=p.t;if(q>=1){this.agita('respingo',p.x1,p.z1,.5*p.k,{gotas:{dir:[Math.sin(p.a)*.8,Math.cos(p.a)*.8]},anelK:.7});p.m.visible=false;this.saltos.splice(i,1);(this.pool.peixe=this.pool.peixe||[]).push(p.m);continue}const X=mix(p.x0,p.x1,q),Z=mix(p.z0,p.z1,q),Y=Math.sin(q*3.14)*p.h-.04;p.m.position.set(X,Y,Z);p.m.rotation.set(-Math.cos(q*3.14)*.9,p.a,0,'YXZ');const O=p.m.userData.o;for(let k=1;k<5;k++)O['p'+k].rotation.y=Math.sin(q*22+k)*.32;p.m.userData.glb&&p.m.userData.glb.toca('salto',{vel:2.2})}
    // urubus e morcegos conforme a hora
    const f=m.f;this.tUrubu+=dt;if(f.noite<.2&&f.chuva<.1&&f.aves>.4)for(let i=0;i<5;i++){const a=this.tUrubu*.1+i*1.3,r=90+i*22,X=x.bp.x+Math.cos(a)*r+60,Z=x.bp.z+Math.sin(a)*r+120;this.ave('urubu',X,120+i*16,Z,1.7,a+1.57,0,0,0,.3)}
    if(f.noite>.25&&f.noite<.85)for(let i=0;i<14;i++){const a=tJ*(1.2+i*.09)+i*2.3,b=tJ*2.1+i;const X=x.bp.x+Math.cos(a)*(24+i*2)+Math.sin(b*.7)*7,Z=x.bp.z+Math.sin(a*1.3)*(26+i*2),Y=4+Math.sin(b)*2.2+i*.2;this.ave('morcego',X,Y,Z,1.2,a+1.57+Math.sin(b)*.7,0,tJ*38+i,0,Math.sin(b*1.3)*.4)}
    this.aves.termina();this.glb.termina(dt);}
  saltaPeixe(x,d0,l0){if(x.dir<0&&d0===undefined)return;const R=this.R,a=x.h+(R()-.5)*1.4,d=d0!==undefined?d0:14+R()*38,l=l0!==undefined?l0:(R()<.5?-1:1)*(6+R()*Math.min(30,x.w*.55));const o=this.pos(x.s+d,x.lat+l);let m=(this.pool.peixe||[]).pop();if(!m)m=this.m('peixe');m.visible=true;const L=1.6+R()*1.6;const x1=o.px+Math.sin(a)*L,z1=o.pz+Math.cos(a)*L;const k=.5+R()*.6;this.saltos.push({m,t:0,dur:.55+R()*.4,h:.45+R()*.7,x0:o.px,z0:o.pz,x1,z1,a,k});m.scale.setScalar(k);this.agita('peixe',o.px,o.pz,.35*k,{gotas:{alt:1.2},anelK:.7});return {x:o.px,y:.3,z:o.pz}}
  // a cena pede a câmera? devolve o encontro da vez e marca como visto
  pedido(x){for(const c of this.ordem){if(c.feito||!c.on||!c.info)continue;const d=c.s-x.s;if(d<(c.de)&&d>-c.ate){return c}}return null}
  marca(c){c.feito=true;if(c.info)this.vistos.add(c.id)}
  limpaDepois(s){for(const c of this.cenas){if(c.on&&s>c.s+260){c.on=false;c.feito=true;for(const k of ['m','ms','bs'])if(c[k]){const l=Array.isArray(c[k])?c[k]:[c[k]];for(const q of l){const me=q.m||q;if(me.parent&&me.isObject3D){me.parent.remove(me)}}}}}}
  reinicia(s){for(const e of this.evs)e.fim&&e.fim();this.evs.length=0;for(const a of this.agenda)a.feito=a.s<s;for(const p of this.saltos){p.m.visible=false;(this.pool.peixe=this.pool.peixe||[]).push(p.m)}this.saltos.length=0;for(const c of this.cenas){const passou=s>c.s+c.ate;if(c.on){for(const k of ['m','ms','bs'])if(c[k]){const l=Array.isArray(c[k])?c[k]:[c[k]];for(const q of l){const me=q.m||q;if(me&&me.parent&&me.isObject3D)me.parent.remove(me)}}}Object.assign(c,{on:false,feito:passou,t:0,disparou:false,fala:false,inicio:false,rota:false,foi:false,falou:false,parou:false,sai:false,gr:false,fase:0,t2:0,est:undefined})}}
}
const R0=b=>b.d;
