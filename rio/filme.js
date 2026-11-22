// O roteiro em ação: decide a velocidade do barco, quando cada narração começa, que plano vem depois de qual.
import {sst,mix,clamp} from './util.js';
import {MARCOS} from './historia.js';

const TRAVESSIA=[['popa',{e:1},9],['lado',{e:1},9],['frente',{},8],['drone',{dur:11},11],['lado',{e:-1,ds:7,vd:-.45},9],['agua',{e:1},7],['popa',{e:-1,h:3.2,dist:17},9],['proa',{},8],['fixa',{e:-1,av:58},9],['voo',{e:1},9],['frente',{e:-1,dist:26,h:1.6,fov:54},8],['agua',{e:-1,av:30,dl:6},7]];
const ALAG=['proa','popa','agua','lado','frente'];
export const FIXO={intro:'Deixa eu acender a lanterna... Pronto. Agora sim. Chegue mais perto. Está vendo este mapa? Cada marca nele é um pedaço da nossa história. Logo vai clarear. Venha comigo. Vamos descer o rio.',fim:'Olhe lá. As luzes de Belém. Foi ali que tudo começou, em 1927. Seis pessoas, e um rio sem fim. Eu acendi uma lanterna pequena. Outros acenderam depois de mim. E a luz não se apagou. Em 2027, a missão completa cem anos. A nossa viagem termina aqui. A missão continua. Agora, a lanterna está na sua mão. Leve esta luz adiante. E vá com Deus.'};
// ---------- o roteiro novo (roteiro.json): carregado no início, sem travar se faltar ----------
// ROTEIRO = {personagem, aviso, itens:[{id, baliza, ano, titulo, oque, porque, fala, legenda[], fontes[], incertezas}], porId:{}} ou null
export let ROTEIRO=null;
export const roteiroPronto=Promise.all([fetch('roteiro.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),fetch('roteiro_abertura.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)]).then(([j,ab])=>{if(!(j&&Array.isArray(j.itens)))j={itens:[]};j.porId={};for(const it of j.itens)j.porId[it.id]=it;
  // V6: as quatro falas da abertura (ab1…ab4) vêm de roteiro_abertura.json; não entram em j.itens para não aparecerem como balizas
  if(ab&&Array.isArray(ab.falas))for(const f of ab.falas)j.porId[f.id]={id:f.id,fala:f.fala,legenda:f.legenda.map(q=>typeof q==='string'?q:q.texto)};j.abertura=ab;ROTEIRO=j;return ROTEIRO}).catch(()=>null);
export const idDe=i=>'b'+String(i+1).padStart(2,'0');
const itemR=id=>(ROTEIRO&&ROTEIRO.porId[id])||null;
const frasesDe=t=>(t.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g)||[t]).map(f=>f.trim()).filter(Boolean);
// o texto que os .m4a antigos dizem (ano e título vêm antes do texto: daí o desconto inicial, em caracteres)
const textoAntigo=id=>{if(id==='abertura')return [FIXO.intro,0];if(id==='final')return [FIXO.fim,0];const m=MARCOS[+id.slice(1)-1];if(!m)return ['',0];return [m.ano==='1937'?m.evento+'.':m.texto,m.ano.length+m.titulo.length+4]};
// ritmo de leitura, para quando não há som: ~15 caracteres por segundo, no mínimo 2,5 s por frase
const LER=15,MIN_FRASE=2.5,PESO_PAUSA=12;
const ritmo=fr=>{let t=0;return fr.map(f=>{const m={t,texto:f};t+=Math.max(MIN_FRASE,f.length/LER);return m})};
const frasesTexto=id=>{const it=itemR(id);return it&&it.legenda&&it.legenda.length?it.legenda:frasesDe(textoAntigo(id)[0])};
export const durTextoDe=id=>frasesTexto(id).reduce((a,f)=>a+Math.max(MIN_FRASE,f.length/LER),0)||10;
// cada [pausa] da fala vira um pouco mais de tempo para a frase que vem antes dela
const pesosDe=it=>{const w=it.legenda.map(f=>f.length);let pos=0;const fala=it.fala||'';for(let k=0;k<it.legenda.length;k++){const j=fala.indexOf(it.legenda[k],pos);if(j<0)return it.legenda.map(f=>f.length);if(k>0&&fala.slice(pos,j).includes('[pausa]'))w[k-1]+=PESO_PAUSA;pos=j+it.legenda[k].length}return w};
const proporcional=(fr,w,dur,ini)=>{const tot=w.reduce((a,b)=>a+b,0)+ini;let ac=ini;return fr.map((f,k)=>{const m={t:k?dur*ac/tot:0,texto:f};ac+=w[k];return m})};
// marcas de legenda [{t,texto}] de uma fala. modo: 'novo' (narr_<id>.mp3), 'antigo' (.m4a de antes) ou 'texto' (sem som)
export function marcasDe(id,modo,dur,doArquivo){if(modo==='novo'&&doArquivo&&doArquivo.length)return doArquivo;const it=itemR(id);
  if(modo==='antigo'){const [txt,ini]=textoAntigo(id),fr=frasesDe(txt);return proporcional(fr,fr.map(f=>f.length),dur,ini)}
  if(modo==='novo'&&it&&it.legenda&&it.legenda.length)return proporcional(it.legenda,pesosDe(it),dur,0);
  const r=ritmo(frasesTexto(id));if(modo==='novo'){const d=durTextoDe(id);for(const m of r)m.t*=dur/d}return r}

// rodada 4: a fala final só começa quando a grua já está subindo e a cidade entra no quadro (a grua começa a subir no instante do plano 'final')
export const ATRASO_FIM=9;
export class Filme{
  constructor({nav,dir,paradas,som,J,ui,obras,rio,fauna}){Object.assign(this,{nav,dir,paradas,som,J,ui,obras,rio,fauna});this.cenaFauna=null;this.tCena=0;this.legF=false;this.falando=-1;this.narrou=new Set();this.frases=[];this.fTot=0;this.fIni=0;this.progresso=-1;this.iTr=0;this.tPlano=0;this.durPlano=9;this.fila=[];this.modoCam='filme';this.atual=-1;this.anoMostrado=-1;this.texto='';this.ativo=false;this.fimDito=false;this.cruz=11;this.interesse=null;this.pausaFala=false;this._seq=-1;this._mc=null;this._marcas=[];som.durTexto=durTextoDe}
  perto(){const s=this.nav.s;let i=0,dm=1e9;this.paradas.forEach((p,k)=>{const d=Math.abs(s-p.s);if(d<dm){dm=d;i=k}});return [i,dm]}
  vAlvo(){const n=this.nav,[i,dm]=this.perto(),p=this.paradas[i];if(!this.ativo)return 0;let v=this.cruz;{let prox=1e9;for(let k=0;k<this.paradas.length;k++)if(!this.narrou.has(k)&&this.paradas[k].s-62>n.s){prox=this.paradas[k].s-62-n.s;break}if(prox>170&&prox<1e8)v*=1.3} /* trechos longos entre falas: cruzeiro mais rápido */if(this.modoCam==='leme')return n.manualVel||0;
    if(this.falando===i){const f=this.som.fala;if(f&&f.dur>0){const resta=Math.max(3,f.dur-this.som.tempoVoz());v=clamp((p.s+12-n.s)/resta,.3,2.6)}else v=n.s<p.s+24?1.7:.3}else if(n.s<p.s&&!this.narrou.has(i))v=mix(3,this.cruz,sst(58,120,p.s-n.s));if(this.cenaFauna)v=Math.min(v,5.5);
    if(n.s>this.paradas[this.paradas.length-1].s+220)v=Math.min(v,4);
    if(this.fimDito&&!this.livre)v=Math.min(v,3.2);return v}
  narra(i){if(i===this.paradas.length-1){this.som.pre('final');this.som.trilhaPre&&this.som.trilhaPre()}const id=idDe(i),[txt,ini]=textoAntigo(id);this.falando=i;this.narrou.add(i);if(this._esc===i)this._esc=-1;this.defTexto(txt,ini);this._seq=i;this.som.voz(id,()=>{if(this.falando===i){this.falando=-1;this._seq=-1;this.frases=[];this.progresso=-1;this.aoFimNarracao(i)}},durTextoDe(id));}
  // o cartão da parada para a interface: o que aconteceu e por que importa
  cartao(i){const m=MARCOS[i];if(!m)return null;const it=itemR(idDe(i));return {ano:m.ano,titulo:m.titulo,oque:it?it.oque:m.evento,porque:it?it.porque:''}}
  defTexto(txt,ini){this.frases=txt.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g)||[txt];this.fTot=this.frases.reduce((a,f)=>a+f.length,0);this.fIni=ini}
  aoFimNarracao(i){this.J.esconde&&0;if(this.modoCam==='filme'){this.fila=[];this.dir.pede('popa',{e:i%2?1:-1},3.2);this.tPlano=0;this.durPlano=7}if(i===this.paradas.length-1&&!this.fimDito&&!this.livre){this.fimDito=true;this.final=true;this.fila=[];this.J.bloqueada=true;this.ui.fimComeca&&this.ui.fimComeca();setTimeout(()=>{this.defTexto(FIXO.fim,0);this.falaFim=true;/* Rodada 2: o auge da trilha final cai 1 s depois da última palavra *//* rodada 4: o auge cai ~1 s depois da ÚLTIMA PALAVRA medida no áudio (fimFala), qualquer que seja a duração da fala */this.som.trilhaFinal&&this.som.pre('final').then(()=>{const d=(this.som.fimFala&&this.som.fimFala('final'))||this.som.duracao('final')||durTextoDe('final');this.som.trilhaFinal((d+1.0)/(this.vel||1))});this.som.voz('final',()=>{this.frases=[];this.falaFim=false;this.ui.aoFim&&this.ui.aoFim()},durTextoDe('final'))},ATRASO_FIM*1000)}}
  // sequência de planos para uma parada: um plano novo a cada ~9 s, cobrindo a duração real da narração (30–70 s)
  sequencia(i,D){if(D<14){this.fila=[['obraLarga',{dl:28,ds:-14,h:3.2},D]];return this.proximo(0)}
    const B=[['obraLarga',{dl:30,ds:-24,h:3,vd:.42},1.15],['obraReflexo',{ds:-30},.85],['obraTele',{fase:0},.8],['obraGrua',{},1.25],['obraLarga',{dl:24,ds:4,h:5,vd:.3,fz:.92},1.05],['obraTele',{fase:1.6,alt:.7},.8],['obraLarga',{dl:32,ds:-14,h:2.2,vd:.5},1.1],['obraReflexo',{ds:-14},.8]];
    const n=clamp(Math.round(D/9),3,B.length),i0=[0,3,6][i%3],t=[];for(let k=0;k<n;k++)t.push(B[(i0+k)%B.length]);/* rodada 4: o plano de escala saiu da abertura da parada; entra quando o barco chega perto do prédio (atualiza) */const tot=t.reduce((a,q)=>a+q[2],0);
    this.fila=t.map(([nome,d,q])=>{const dur=D*q/tot;return [nome,nome==='obraGrua'?{...d,dur}:{...d},dur]});this.proximo(0)}
  proximo(blend){const f=this.fila.shift();if(!f)return false;this.dir.pede(f[0],{...f[1]},blend||0);this.tPlano=0;this.durPlano=f[2];return true}
  // escolhe o próximo plano de travessia, respeitando o trecho
  travessia(){const al=this.rio.alag(this.nav.s)>.4,W=this.rio.larg(this.nav.s);let tent=0,it;do{it=TRAVESSIA[this.iTr%TRAVESSIA.length];this.iTr++;tent++}while(tent<20&&((al&&!ALAG.includes(it[0]))||(this.dir.hist.includes(it[0])&&this.dir.hist[this.dir.hist.length-1]===it[0])||(W<34&&(it[0]==='fixa'||it[0]==='voo'))));
    const suave=it[0]==='popa'||it[0]==='lado'&&this.dir.atual&&this.dir.atual.nome==='popa';this.dir.pede(it[0],{...it[1]},suave?3:0);this.tPlano=0;this.durPlano=it[2]}
  // encontro com um bicho: lente longa, lettering de documentário e, se o barco estiver livre, um pouco mais devagar
  encontros(dt,x){const F=this.fauna;if(!F||this.final)return;if(this.semFauna>0&&!this.cenaFauna){this.semFauna-=dt;return}if(this.cenaFauna){const c=this.cenaFauna;this.tCena+=dt;if(this.tCena>=c.dur){F.marca(c);this.cenaFauna=null;this.ui.legFauna(null);if(this.modoCam==='filme'&&this.falando<0){this.dir.pede('popa',{e:1},2.8);this.tPlano=0;this.durPlano=6}}return}
    if(this.falando>=0||x.dir<0)return;const c=F.pedido(x);if(!c)return;const [i,dm]=this.perto();if(this.nav.s>this.paradas[i].s-74&&this.nav.s<this.paradas[i].s&&!this.narrou.has(i))return;this.cenaFauna=c;this.tCena=0;c.inicio=true;this.ui.legFauna(c.info);if(this.modoCam==='filme'&&c.cam&&!c.semPlano){const d={...c.cam};const pl=d.p;delete d.p;if(pl==='fauna'||pl==='faunaPerto'||pl==='olhaCima'){d.alvo=c.alvo;d.sRio=c.s;d.lado=c.lado}this.dir.pede(pl,d,0);this.tPlano=0;this.durPlano=c.dur;this.fila=[]}}
  atualiza(dt,x){if(!this.ativo)return;const n=this.nav,[i,dm]=this.perto(),p=this.paradas[i];this.tPlano+=dt;this.encontros(dt,x);
    // títulos e janelas
    const naArea=n.dir>0&&n.s>p.s-112&&n.s<p.s+70;if(naArea&&i!==this.atual){this.atual=i;this.ui.anoNovo(i)}if(!naArea&&this.atual>=0&&this.falando!==this.atual){this.atual=-1}
    if(n.dir>0&&n.s>p.s-200&&n.s<p.s&&!this.narrou.has(i)&&this._pre!==i){this._pre=i;this.som.pre(idDe(i))}
    // começa a falar ao chegar
    if(n.dir>0&&n.s>p.s-62&&n.s<p.s+40&&!this.narrou.has(i)&&this.falando<0&&!this.falaFim&&!this.ui.lendo()&&!this.livre){this.narra(i);this.J.mostra(i);this.ui.titulo(i);this.som.temaPorAno&&this.som.temaPorAno(MARCOS[i].ano)}
    // os planos da parada são montados quando a voz começa de fato, com a duração real dela
    if(this._seq>=0){if(this.falando!==this._seq)this._seq=-1;else{const f=this.som.fala;if(f&&f.id===idDe(this._seq)){const k=this._seq;this._seq=-1;if(this.modoCam==='filme')this.sequencia(k,f.dur)}}}
    if(this.falando<0&&this.J.ativa>=0&&(n.s>this.paradas[this.J.ativa].s+70||n.s<this.paradas[this.J.ativa].s-90||this.modoCam==='x'))this.J.esconde();
    if(n.dir<0)for(const k of [...this.narrou])if(this.paradas[k].s>n.s+90)this.narrou.delete(k);
    // rodada 4 · plano de escala: quando o barco chega a ~34 m do prédio durante a fala, prédio e barco juntos, em perspectiva real, por ~9 s
    if(this.modoCam==='filme'&&!this.cenaFauna&&!this.final&&this.falando===i&&p.obra&&this._esc!==i&&n.s>p.s-34&&n.s<p.s+30){this._esc=i;this.dir.pede('obraEscala',{},0);/* corte seco: a câmera muda de lugar ~70 m, uma mistura viraria um voo */this.tPlano=0;this.durPlano=9}
    // planos
    if(this.modoCam==='filme'&&!this.cenaFauna&&!this.final&&this.tPlano>=this.durPlano){if(!this.proximo(0)){if(this.falando>=0){this.dir.pede('obraLarga',{dl:30,ds:-8,h:3.4,vd:.2},2.5);this.durPlano=8;this.tPlano=0}else this.travessia()}}
    this.progresso=this.falando>=0?this.som.progresso():-1;}
  // legenda da frase atual: segue o relógio da voz (som.tempoVoz), que para e retoma junto com ela
  legenda(){if(!this.frases.length||(this.falando<0&&!this.falaFim))return '';const f=this.som.fala;if(!f)return '';
    if(this._mc!==f){this._mc=f;this._marcas=f.id==='_texto'?ritmo(this.frases.map(q=>q.trim())):marcasDe(f.id,f.modo,f.dur,f.marcas)}
    const t=this.som.tempoVoz();let txt='';for(const m of this._marcas){if(m.t<=t+.02)txt=m.texto;else break}return txt.trim()}
}
