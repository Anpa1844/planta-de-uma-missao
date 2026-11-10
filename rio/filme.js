// O roteiro em ação: decide a velocidade do barco, quando cada narração começa, que plano vem depois de qual.
import {sst,mix,clamp} from './util.js';
import {MARCOS} from './historia.js';

const TRAVESSIA=[['popa',{e:1},9],['lado',{e:1},9],['frente',{},8],['drone',{dur:11},11],['lado',{e:-1,ds:7,vd:-.45},9],['agua',{e:1},7],['popa',{e:-1,h:3.2,dist:17},9],['proa',{},8],['fixa',{e:-1,av:58},9],['voo',{e:1},9],['frente',{e:-1,dist:26,h:1.6,fov:54},8],['agua',{e:-1,av:30,dl:6},7]];
const ALAG=['proa','popa','agua','lado','frente'];
export const FIXO={intro:'Deixa eu acender a lanterna... Pronto. Agora sim. Chegue mais perto. Está vendo este mapa? Cada marca nele é um pedaço da nossa história. Logo vai clarear. Venha comigo. Vamos descer o rio.',fim:'E assim chegamos até aqui. O rio continua, e esta história também. Agora, ela segue com você.'};
const nomeAudio=i=>'m'+String(MARCOS[i].n).padStart(2,'0');

export class Filme{
  constructor({nav,dir,paradas,som,J,ui,obras,rio,fauna}){Object.assign(this,{nav,dir,paradas,som,J,ui,obras,rio,fauna});this.cenaFauna=null;this.tCena=0;this.legF=false;this.falando=-1;this.narrou=new Set();this.frases=[];this.fTot=0;this.fIni=0;this.progresso=-1;this.iTr=0;this.tPlano=0;this.durPlano=9;this.fila=[];this.modoCam='filme';this.atual=-1;this.anoMostrado=-1;this.texto='';this.ativo=false;this.fimDito=false;this.cruz=11;this.interesse=null;this.pausaFala=false}
  perto(){const s=this.nav.s;let i=0,dm=1e9;this.paradas.forEach((p,k)=>{const d=Math.abs(s-p.s);if(d<dm){dm=d;i=k}});return [i,dm]}
  vAlvo(){const n=this.nav,[i,dm]=this.perto(),p=this.paradas[i];if(!this.ativo)return 0;let v=this.cruz;if(this.modoCam==='leme')return n.manualVel||0;
    if(this.falando===i)v=n.s<p.s+24?1.7:.3;else if(n.s<p.s&&!this.narrou.has(i))v=mix(3,this.cruz,sst(58,120,p.s-n.s));if(this.cenaFauna)v=Math.min(v,5.5);
    if(n.s>this.paradas[this.paradas.length-1].s+220)v=Math.min(v,4);
    if(this.fimDito&&!this.livre)v=Math.min(v,3.2);return v}
  narra(i){const m=MARCOS[i];this.falando=i;this.narrou.add(i);const txt=m.n===5?m.evento+'.':m.texto;this.defTexto(txt,m.ano.length+m.titulo.length+4);this.som.voz(nomeAudio(i),()=>{if(this.falando===i){this.falando=-1;this.frases=[];this.progresso=-1;this.aoFimNarracao(i)}});}
  defTexto(txt,ini){this.frases=txt.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g)||[txt];this.fTot=this.frases.reduce((a,f)=>a+f.length,0);this.fIni=ini}
  aoFimNarracao(i){this.J.esconde&&0;if(this.modoCam==='filme'){this.fila=[];this.dir.pede('popa',{e:i%2?1:-1},3.2);this.tPlano=0;this.durPlano=7}if(i===this.paradas.length-1&&!this.fimDito&&!this.livre){this.fimDito=true;this.final=true;this.fila=[];this.J.bloqueada=true;this.ui.fimComeca&&this.ui.fimComeca();setTimeout(()=>{this.defTexto(FIXO.fim,0);this.falaFim=true;this.som.voz('fim',()=>{this.frases=[];this.falaFim=false;this.ui.aoFim&&this.ui.aoFim()})},2600)}}
  // sequência de planos para uma parada, proporcional à duração da narração
  sequencia(i,D){const e=this.paradas[i].e;const curta=D<14;const T=[
      [['obraLarga',{dl:30,ds:-24,h:3,vd:.42},.36],['obraReflexo',{ds:-30},.22],['obraTele',{fase:0},.18],['obraLarga',{dl:24,ds:4,h:5,vd:.3,fz:.92},.24]],
      [['obraGrua',{dur:D*.34},.34],['obraTele',{fase:1.6,alt:.7},.2],['obraLarga',{dl:32,ds:-14,h:2.2,vd:.5},.28],['obraReflexo',{ds:-14},.18]],
      [['obraReflexo',{ds:-38},.28],['obraLarga',{dl:26,ds:-10,h:4.4,vd:.46},.34],['obraGrua',{dur:D*.38},.38]]];
    const t=curta?[['obraLarga',{dl:28,ds:-14,h:3.2},1]]:T[i%3];this.fila=t.map(([n,d,q])=>[n,d,Math.max(4,q*D)]);this.proximo(0)}
  proximo(blend){const f=this.fila.shift();if(!f)return false;this.dir.pede(f[0],{...f[1]},blend||0);this.tPlano=0;this.durPlano=f[2];return true}
  // escolhe o próximo plano de travessia, respeitando o trecho
  travessia(){const al=this.rio.alag(this.nav.s)>.4,W=this.rio.larg(this.nav.s);let tent=0,it;do{it=TRAVESSIA[this.iTr%TRAVESSIA.length];this.iTr++;tent++}while(tent<20&&((al&&!ALAG.includes(it[0]))||(this.dir.hist.includes(it[0])&&this.dir.hist[this.dir.hist.length-1]===it[0])||(W<34&&(it[0]==='fixa'||it[0]==='voo'))));
    const suave=it[0]==='popa'||it[0]==='lado'&&this.dir.atual&&this.dir.atual.nome==='popa';this.dir.pede(it[0],{...it[1]},suave?3:0);this.tPlano=0;this.durPlano=it[2]}
  // encontro com um bicho: lente longa, lettering de documentário e, se o barco estiver livre, um pouco mais devagar
  encontros(dt,x){const F=this.fauna;if(!F||this.final)return;if(this.cenaFauna){const c=this.cenaFauna;this.tCena+=dt;if(this.tCena>=c.dur){F.marca(c);this.cenaFauna=null;this.ui.legFauna(null);if(this.modoCam==='filme'&&this.falando<0){this.dir.pede('popa',{e:1},2.8);this.tPlano=0;this.durPlano=6}}return}
    if(this.falando>=0||x.dir<0)return;const c=F.pedido(x);if(!c)return;const [i,dm]=this.perto();if(this.nav.s>this.paradas[i].s-74&&this.nav.s<this.paradas[i].s&&!this.narrou.has(i))return;this.cenaFauna=c;this.tCena=0;c.inicio=true;this.ui.legFauna(c.info);if(this.modoCam==='filme'&&c.cam&&!c.semPlano){const d={...c.cam};const pl=d.p;delete d.p;if(pl==='fauna'||pl==='faunaPerto'||pl==='olhaCima'){d.alvo=c.alvo;d.sRio=c.s;d.lado=c.lado}this.dir.pede(pl,d,0);this.tPlano=0;this.durPlano=c.dur;this.fila=[]}}
  atualiza(dt,x){if(!this.ativo)return;const n=this.nav,[i,dm]=this.perto(),p=this.paradas[i];this.tPlano+=dt;this.encontros(dt,x);
    // títulos e janelas
    const naArea=n.dir>0&&n.s>p.s-112&&n.s<p.s+70;if(naArea&&i!==this.atual){this.atual=i;this.ui.anoNovo(i)}if(!naArea&&this.atual>=0&&this.falando!==this.atual){this.atual=-1}
    if(n.dir>0&&n.s>p.s-200&&n.s<p.s&&!this.narrou.has(i)&&this._pre!==i){this._pre=i;this.som.pre(nomeAudio(i))}
    // começa a falar ao chegar
    if(n.dir>0&&n.s>p.s-62&&n.s<p.s+40&&!this.narrou.has(i)&&this.falando<0&&!this.falaFim&&!this.ui.lendo()&&!this.livre){this.narra(i);this.J.mostra(i);this.ui.titulo(i);const D=this.som.duracao(nomeAudio(i))||26;if(this.modoCam==='filme')this.sequencia(i,D)}
    if(this.falando<0&&this.J.ativa>=0&&(n.s>this.paradas[this.J.ativa].s+70||n.s<this.paradas[this.J.ativa].s-90||this.modoCam==='x'))this.J.esconde();
    if(n.dir<0)for(const k of [...this.narrou])if(this.paradas[k].s>n.s+90)this.narrou.delete(k);
    // planos
    if(this.modoCam==='filme'&&!this.cenaFauna&&!this.final&&this.tPlano>=this.durPlano){if(!this.proximo(0)){if(this.falando>=0){this.dir.pede('obraLarga',{dl:30,ds:-8,h:3.4,vd:.2},2.5);this.durPlano=8;this.tPlano=0}else this.travessia()}}
    this.progresso=this.falando>=0?this.som.progresso():-1;}
  // legenda da frase atual
  legenda(){if(!this.frases.length||(this.falando<0&&!this.falaFim))return '';const pr=this.som.progresso();const tot=this.fTot+this.fIni;const ps=pr*tot-this.fIni;let txt=this.frases[0];if(ps>0){let ac=0;for(const f of this.frases){ac+=f.length;txt=f;if(ps<=ac)break}}return txt.trim()}
}
