// A abertura da V6: noite, a lanterna, a mesa (mapa, Bíblia), a saída pelo vão central da frente da cabine,
// a volta pelo costado, a subida e a popa, enquanto amanhece.
// Nada aqui é medida fixa do barco: a mesa, a chama, o mapa, a Bíblia, o vão, a soleira, o convés e o casco são lidos do GLB
// (nós e caixas) e conferidos numa grade de ocupação tirada dos triângulos da própria malha. A trajetória é testada contra
// essa grade (folga mínima); o resultado fica em voo.relatorio e em window.__voo.
import * as THREE from 'three';
import {sst,mix,clamp} from './util.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

// ---------- grade de ocupação (voxels) ----------
// Cada triângulo da malha é amostrado em pontos a meia célula de distância; a célula que recebe um ponto fica ocupada.
export function criaGrade(grupo,caixa,cel=.05,pula=null){
  const mg=.5,x0=caixa.min.x-mg,y0=caixa.min.y-mg,z0=caixa.min.z-mg,nx=Math.ceil((caixa.max.x-caixa.min.x+2*mg)/cel),ny=Math.ceil((caixa.max.y-caixa.min.y+2*mg)/cel),nz=Math.ceil((caixa.max.z-caixa.min.z+2*mg)/cel);
  const G=new Uint8Array(nx*ny*nz);const a=V(),b=V(),c=V();let tris=0;
  const poe=(x,y,z)=>{const i=Math.floor((x-x0)/cel),j=Math.floor((y-y0)/cel),k=Math.floor((z-z0)/cel);if(i>=0&&j>=0&&k>=0&&i<nx&&j<ny&&k<nz)G[(k*ny+j)*nx+i]=1};
  const inv=new THREE.Matrix4();grupo.updateMatrixWorld(true);inv.copy(grupo.matrixWorld).invert();const M=new THREE.Matrix4();
  grupo.traverse(o=>{if(!o.isMesh||!o.visible||!o.geometry.attributes.position||(pula&&pula(o)))return;for(let q=o.parent;q&&q!==grupo;q=q.parent)if(!q.visible)return;
    M.multiplyMatrices(inv,o.matrixWorld);const P=o.geometry.attributes.position,I=o.geometry.index,n=(I?I.count:P.count)/3;
    for(let t=0;t<n;t++){a.fromBufferAttribute(P,I?I.getX(t*3):t*3).applyMatrix4(M);b.fromBufferAttribute(P,I?I.getX(t*3+1):t*3+1).applyMatrix4(M);c.fromBufferAttribute(P,I?I.getX(t*3+2):t*3+2).applyMatrix4(M);tris++;
      const L=Math.max(a.distanceTo(b),a.distanceTo(c),b.distanceTo(c)),k=Math.min(700,Math.ceil(L/(cel*.5))+1);
      for(let i=0;i<=k;i++)for(let j=0;j<=k-i;j++){const u=i/k,w=j/k;poe(a.x+(b.x-a.x)*u+(c.x-a.x)*w,a.y+(b.y-a.y)*u+(c.y-a.y)*w,a.z+(b.z-a.z)*u+(c.z-a.z)*w)}}});
  const oc=(x,y,z)=>{const i=Math.floor((x-x0)/cel),j=Math.floor((y-y0)/cel),k=Math.floor((z-z0)/cel);return i>=0&&j>=0&&k>=0&&i<nx&&j<ny&&k<nz&&G[(k*ny+j)*nx+i]===1};
  // distância (m) do ponto ao centro da célula ocupada mais próxima, procurando até R
  const folga=(p,R=.4)=>{const r=Math.ceil(R/cel),ci=Math.floor((p.x-x0)/cel),cj=Math.floor((p.y-y0)/cel),ck=Math.floor((p.z-z0)/cel);let m=R*R;
    for(let k=Math.max(0,ck-r);k<=Math.min(nz-1,ck+r);k++)for(let j=Math.max(0,cj-r);j<=Math.min(ny-1,cj+r);j++){const base=(k*ny+j)*nx;for(let i=Math.max(0,ci-r);i<=Math.min(nx-1,ci+r);i++)if(G[base+i]){const dx=x0+(i+.5)*cel-p.x,dy=y0+(j+.5)*cel-p.y,dz=z0+(k+.5)*cel-p.z,d=dx*dx+dy*dy+dz*dz;if(d<m)m=d}}
    return Math.sqrt(m)};
  // algum voxel ocupado na caixa [a,b]?
  const temCaixa=(ax,ay,az,bx,by,bz)=>{for(let z=az;z<=bz;z+=cel)for(let y=ay;y<=by;y+=cel)for(let x=ax;x<=bx;x+=cel)if(oc(x,y,z))return true;return false};
  return {cel,nx,ny,nz,tris,oc,folga,temCaixa,ocupadas:()=>{let n=0;for(let i=0;i<G.length;i++)n+=G[i];return n}};
}

// ---------- o que há na mesa: lido dos nós do v45 (ou da mesa montada por código, no v44) ----------
export function achaMesa(B,CAB){
  const cx=o=>{const b=B.caixa(o);return {c:b.getCenter(V()),b}};const f=B.acha(/LZ40_Lamp_Flame/i),m=B.acha(/LZ40_Map_Table/i),bi=B.acha(/LZ40_Bible_Open/i),lt=B.acha(/LZ40_Lantern_Table/i);
  const r={doModelo:!!(f&&m),chama:null,mapa:null,biblia:null,nos:{chama:f,mapa:m,biblia:bi,lampiao:lt,vidro:B.acha(/LZ40_Lamp_Glass/i)}};
  if(f){r.chama=cx(f).c}else if(CAB){r.chama=CAB.ponto.clone();r.chama.y+=.2}
  if(m){const q=cx(m);r.mapa=q.c;r.mapa.y=q.b.max.y;r.mapaB=q.b}else if(CAB){r.mapa=CAB.mapaC.clone()}
  if(bi){const q=cx(bi);r.biblia=q.c;r.biblia.y=q.b.max.y}
  r.tampo=B.anc.mesa.max.y;if(!r.chama)r.chama=V(0,r.tampo+.2,B.anc.mesa.max.z-.15);if(!r.mapa)r.mapa=V(0,r.tampo,(B.anc.mesa.min.z+B.anc.mesa.max.z)/2);if(!r.biblia)r.biblia=V(r.mapa.x,r.tampo,B.anc.mesa.min.z+.18);
  return r;
}

// ---------- o vão central da frente da cabine, achado na grade ----------
export function achaVao(G,anc){
  const c=anc.cab,yM=anc.piso+1.25,cel=G.cel;
  // plano da parede da frente: primeira célula ocupada de ré para vante, na altura do peito, perto das bordas da cabine
  const zs=[];for(const fx of[-.82,-.7,.7,.82]){const x=fx*c.max.x;for(let z=c.max.z-.9;z<c.max.z+.7;z+=cel*.5)if(G.temCaixa(x-cel,yM-.1,z,x+cel,yM+.1,z)){zs.push(z);break}}
  zs.sort((p,q)=>p-q);const zW=zs.length?zs[Math.floor(zs.length/2)]:c.max.z;
  // largura livre no plano da parede, a partir do eixo
  const livre=x=>!G.temCaixa(x,yM,zW-.1,x,yM+.2,zW+.16);let xa=0,xb=0;if(!livre(0)){for(let d=cel;d<.6;d+=cel){if(livre(d)){xa=xb=d;break}if(livre(-d)){xa=xb=-d;break}}}
  while(xa>-1.3&&livre(xa-cel))xa-=cel;while(xb<1.3&&livre(xb+cel))xb+=cel;const xo=(xa+xb)/2;
  // soleira (o que há por baixo, no plano da parede) e verga (o que há por cima)
  let sol=anc.piso;for(let y=yM;y>anc.piso-.2;y-=cel*.5)if(G.temCaixa(xo-.1,y,zW-.12,xo+.1,y,zW+.18)){sol=y+cel*.5;break}
  let verga=null;for(let y=yM+.2;y<anc.teto+1.2;y+=cel*.5)if(G.temCaixa(xo-.1,y,zW-.12,xo+.1,y,zW+.18)){verga=y;break}
  // convés de proa: de cima para baixo, um metro adiante da parede
  let conves=anc.conves;for(let y=anc.teto+.4;y>anc.piso-.3;y-=cel*.5)if(G.temCaixa(xo-.15,y,zW+.9,xo+.15,y,zW+1.1)){conves=y+cel*.5;break}
  return {zW,xa,xb,xo,larg:xb-xa+cel,soleira:sol,verga,conves};
}

// ---------- a trajetória ----------
// Devolve {chaves:[{p,a,fov,et,f,int}], vao, relatorio}. et: etapa (0 escuro, 1 mesa, 2 voo); f: fração dentro da etapa.
export function calculaVoo({G,anc,mesa,ladoNome=1}){
  const vao=achaVao(G,anc),F=mesa.chama,C=mesa.mapa,Bb=mesa.biblia,yT=mesa.tampo,cz=anc.casco,zB=cz.max.z,zS=cz.min.z,hb=cz.max.x,N=anc.nome,e=ladoNome;
  const tetoLivre=anc.teto-.3,yP=clamp(vao.soleira+.47,vao.soleira+.3,(vao.verga||anc.teto+.4)-.25),xo=vao.xo,zW=vao.zW,yD=vao.conves;
  // lado da mesa de onde o mapa se lê em pé: o do banco oposto ao lampião
  // Rodada 3: a planta e a Bíblia foram giradas 180° (barco5.js) para lerem certo da cabine; o lado de leitura passou a ser o OPOSTO
  // ao antigo. lr = lado (em x) de onde se lê a planta; zL = direção (em z) que fica à ESQUERDA do quadro para quem olha dali.
  // A abertura começa desse lado, em close, com a LANTERNA À ESQUERDA do quadro e a planta à direita/ao fundo.
  const lmAntigo=F.x>C.x?-1:1,girada=!!(mesa.nos&&Object.values(mesa.nos).some(n=>n&&n.userData&&n.userData.girado180)),lr=girada?-lmAntigo:lmAntigo,zL=lr,lm=lr,sz=F.z>=C.z?1:-1;
  const K=[
    // etapa 0 e 1: close na lanterna (31°) → recuo em arco subindo → a planta ("Este é o nosso mapa") → a Bíblia → 50°. Um movimento só.
    {et:0,f:0,p:[F.x+lr*.30,F.y+.04,F.z-zL*.10],a:[F.x-lr*.06,F.y-.015,F.z-zL*.13],fov:31,int:1},
    {et:1,f:.2,p:[F.x+lr*.46,F.y+.11,F.z-zL*.12],a:[F.x-lr*.05,F.y-.05,F.z-zL*.26],fov:33,int:1},
    {et:1,f:.5,g:'mapa',p:[C.x+lr*.55,yT+.50,C.z+zL*.02],a:[C.x-lr*.04,yT,C.z-zL*.04],fov:42,int:1},
    {et:1,f:.7,g:'mapaFim',p:[C.x+lr*.58,yT+.54,C.z-zL*.10],a:[C.x-lr*.03,yT,C.z-zL*.12],fov:44,int:1},
    {et:1,f:.88,g:'biblia',p:[Bb.x+lr*.56,yT+.52,Bb.z+zL*.10],a:[Bb.x-lr*.04,yT+.01,Bb.z-zL*.02],fov:47,int:1},
    {et:1,f:1,p:[Bb.x+lr*.64,yT+.60,Bb.z-zL*.02],a:[Bb.x-lr*.05,yT+.01,Bb.z+zL*.08],fov:50,int:1},
    // etapa 2: sobe, atravessa a cabine pelo eixo do vão, sai pelo vão central, convés de proa
    {et:2,f:.09,p:[xo+lm*.12,Math.min(tetoLivre,yT+.74),C.z-.42],a:[xo,yP-.25,zW+.6],fov:52,int:1},
    {et:2,f:.14,p:[xo,Math.min(tetoLivre,yP+.1),zW-1.0],a:[xo,yD+1.05,zB+2],fov:58,int:1},
    {et:2,f:.17,p:[xo,yP,zW+.02],a:[xo+e*.3,yD+1.05,zB+4],fov:60,int:1,vao:1},
    {et:2,f:.23,p:[xo+e*.2,yD+1.5,zW+1.0],a:[e*.7,yD+1.1,zB+7],fov:60},
    // sai para o bordo do nome antes do pau de proa, dá a volta pelo costado, sobe e vai para trás da popa
    {et:2,f:.29,p:[e*1.75,yD+1.95,zB-1.5],a:[e*1.6,yD+1.2,zB+7],fov:58},
    {et:2,f:.37,g:'nome',p:[e*3.9,3.1,zB+2.6],a:[e*.8,1.9,zB-2],fov:52},
    {et:2,f:.5,p:[e*(hb+5.6),2.5,zB-.6],a:[N.x,N.y+.2,N.z-.8],fov:46},
    {et:2,f:.64,p:[e*(hb+8),2.05,.8],a:[0,1.5,.4],fov:44},
    {et:2,f:.77,p:[e*(hb+7.2),2.7,zS+.5],a:[0,1.6,-1],fov:46},
    {et:2,f:.89,p:[e*(hb+3.2),4.4,zS-6.8],a:[0,1.9,.5],fov:52},
    {et:2,f:1,p:[0,6.4,zS-11],a:[0,1.7,20],fov:60}];
  for(const k of K){k.p=V(...k.p);k.a=V(...k.a);k.f0=k.f}
  const rel=testaVoo(G,K,anc,vao,true);
  return {chaves:K,vao,relatorio:rel};
}
// Teste de colisão: a curva é amostrada a cada ~2 cm; dentro da cabine exige-se rI de folga, fora rE.
// Se corrige=true, as chaves do trecho que bate são empurradas para o lado mais livre (até 60 passadas).
export function testaVoo(G,K,anc,vao,corrige=false,rI=.12,rE=.3){
  const c=anc.cab,dentro=p=>p.z<vao.zW+.15&&p.z>c.min.z-.1&&Math.abs(p.x)<c.max.x+.1&&p.y<anc.teto+.3;
  const mede=()=>{const cp=new THREE.CatmullRomCurve3(K.map(k=>k.p),false,'centripetal'),n=(K.length-1)*120,p=V();let mI=9,mE=9,bat=[],comp=0,ant=null,pI=null,pE=null;
    for(let i=0;i<=n;i++){cp.getPoint(i/n,p);if(ant)comp+=ant.distanceTo(p);ant=p.clone();const d=dentro(p),f=G.folga(p,.45);if(d){if(f<mI){mI=f;pI=p.clone()}}else if(f<mE){mE=f;pE=p.clone()}if(f<(d?rI:rE))bat.push({u:i/n,seg:Math.min(K.length-2,Math.floor(i/n*(K.length-1))),f,p:p.clone(),d})}
    return {mI,mE,pI,pE,bat,comp,amostras:n+1}};
  let r=mede(),passadas=0;
  if(corrige)while(r.bat.length&&passadas<60){passadas++;const feito=new Set();
    for(const q of r.bat){for(const i of [q.seg,q.seg+1]){if(feito.has(i)||i===0||i>=K.length-1)continue;feito.add(i);const k=K[i].p,d=.03,g=V(G.folga(V(k.x+d,k.y,k.z))-G.folga(V(k.x-d,k.y,k.z)),G.folga(V(k.x,k.y+d,k.z))-G.folga(V(k.x,k.y-d,k.z)),G.folga(V(k.x,k.y,k.z+d))-G.folga(V(k.x,k.y,k.z-d)));
      // o ponto do meio do vão só anda na vertical; os outros andam para onde há mais espaço
      if(K[i].vao)g.x=g.z=0;if(g.lengthSq()<1e-8){g.subVectors(k,q.p);if(K[i].vao)g.x=g.z=0}if(g.lengthSq()>1e-10)k.addScaledVector(g.normalize(),.02)}}
    r=mede()}
  const ar=v=>v?[+v.x.toFixed(2),+v.y.toFixed(2),+v.z.toFixed(2)]:null;
  return {ok:r.bat.length===0,folgaMinDentro:+r.mI.toFixed(3),ondeDentro:ar(r.pI),folgaMinFora:+r.mE.toFixed(3),ondeFora:ar(r.pE),exigidoDentro:rI,exigidoFora:rE,amostras:r.amostras,comprimento:+r.comp.toFixed(1),batidas:r.bat.length,passadasDeCorrecao:passadas,primeiraBatida:r.bat[0]?{u:+r.bat[0].u.toFixed(3),f:+r.bat[0].f.toFixed(3),p:ar(r.bat[0].p)}:null};
}

// ---------- o palco: etapas, falas, o instante em que a lanterna acende ----------
// Etapas: 'escuro' (fala ab1, tela escura) → ACENDE → 'mesa' (ab2) → 'voo' (ab3 e, perto do fim, ab4) → fim.
// Cada etapa dura o que a fala dura (áudio real, ou o ritmo de leitura da legenda enquanto o áudio não existe), nunca menos que o mínimo.
export const FALAS_AB=['ab1','ab2','ab3','ab4'];
export class Palco{
  constructor({voo,som,durFala,marcas,aoAcender,aoPartir,aoFim,reduzido=false}){Object.assign(this,{voo,som,durFala,marcas,aoAcender,aoPartir,aoFim,reduzido});const K=voo.chaves;this.K=K;
    this.cp=new THREE.CatmullRomCurve3(K.map(k=>k.p),false,'centripetal');this.cl=new THREE.CatmullRomCurve3(K.map(k=>k.a),false,'centripetal');this.n=K.length-1;
    this.i1=K.findIndex(k=>k.et===2)-1; // última chave da mesa
    this.zera()}
  zera(){this.et=-1;this.t=0;this.dur=1;this.acesa=0;this.tAc=-1;this.kVoo=0;this.u=0;this.fimDito=false;this.falando=null;this.partiu=false;this.acabou=false;this.ab4=false;this.vozFim=true;this.corte=1;this.foco=0}
  inicia(){this.zera();this.entra(0)}
  fala(id){this.vozFim=false;this.falando=id;this.som.voz(id,()=>{if(this.falando===id){this.falando=null;this.vozFim=true}},this.durFala(id))}
  durDe(id){const d=this.som.duracao(id);return d>0?d:this.durFala(id)}
  // segundo (dentro da fala id) em que começa a primeira frase que casa com re; null se não houver marcas
  tFrase(id,re){const m=this.marcas?this.marcas(id):null;if(!m)return null;for(const q of m)if(re.test(q.texto))return +q.t;return null}
  // Prende as chaves às frases: a câmera chega ao mapa, à Bíblia e à vista do nome ANTES de a frase começar (antecedência em segundos).
  // Vale para qualquer gravação: os tempos vêm de audio/narr_ab<n>.json (reais) ou, sem ele, das estimativas de roteiro_abertura.json.
  prende(et){const K=this.K.filter(k=>k.et===et);for(const k of K)k.f=k.f0;const D=this.dur,g=n=>K.find(k=>k.g===n);this.ganchos=this.ganchos||{};
    if(et===1){const tM=this.tFrase('ab2',/nosso mapa/i),tB=this.tFrase('ab2',/B[ií]blia/i),kM=g('mapa'),kF=g('mapaFim'),kB=g('biblia');
      if(tM!==null&&tB!==null&&kM&&kB){const fM=clamp((this.tFala+tM+.35)/D,.12,.7),fB=clamp((this.tFala+tB-.25)/D,fM+.1,.94);kM.f=fM;kB.f=fB;if(kF)kF.f=fM+(fB-fM)*.5;for(const k of K)if(k.f0<kM.f0)k.f=k.f0*fM/kM.f0;this.ganchos.mapa=this.tFala+tM;this.ganchos.biblia=this.tFala+tB}}
    if(et===2){const tL=this.tFrase('ab3',/Luzeiro/i),kN=g('nome');
      if(tL!==null&&kN){const fN=clamp((this.tFala+tL-.4)/D,.22,.5),f0=kN.f0;for(const k of K)k.f=k.f0<=f0?k.f0*fN/f0:fN+(k.f0-f0)/(1-f0)*(1-fN);this.ganchos.nome=this.tFala+tL}}}
  entra(et){this.et=et;this.t=0;
    if(et===0){this.dur=Math.max(4,this.durDe('ab1')+1.5);this.tFala=1.2}
    if(et===1){this.dur=Math.max(13,this.durDe('ab2')+1.9);this.tFala=.75}
    if(et===2){const d3=this.durDe('ab3'),d4=this.durDe('ab4');this.tFala=2.4;this.dur=Math.max(this.reduzido?14:27,this.tFala+d3+d4+3.6);this.tAb4=Math.max(this.tFala+d3+1.2,this.dur-d4-2.2)}
    this.prende(et);
    this.falou=false}
  pula(){if(this.acabou)return;this.som.paraVoz();this.falando=null;this.vozFim=true;this.acesa=1;this.et=2;this.t=this.dur=1;this.kVoo=1;this.u=1;this.foco=0;if(!this.partiu){this.partiu=true;this.aoPartir&&this.aoPartir()}this.acabou=true;this.aoFim&&this.aoFim()}
  // posição ao longo da curva (0..1) para a fração k da etapa: linear por trechos entre as chaves, alisada
  uDe(et,k){const K=this.K,n=this.n;const lin=q=>{q=clamp(q);let i0=0;for(let i=0;i<K.length;i++)if(K[i].et<et||(K[i].et===et&&K[i].f<=q))i0=i;const i1=Math.min(n,i0+1);if(K[i1].et!==et||i1===i0)return i0/n;const f0=K[i0].et===et?K[i0].f:0,f1=K[i1].f;return (i0+clamp((q-f0)/Math.max(1e-4,f1-f0)))/n};
    /* Rodada 2: o alisamento encolhe junto às pontas da etapa, para u ser contínuo na troca de etapa (antes dava um salto de até 37° num quadro) */const d=Math.min(.035,clamp(k)/2,(1-clamp(k))/2);return (lin(k-2*d)+lin(k-d)*2+lin(k)*3+lin(k+d)*2+lin(k+2*d))/9}
  atualiza(dt){if(this.et<0||this.acabou)return;this.t+=dt;const k=clamp(this.t/this.dur);
    if(!this.falou&&this.t>=this.tFala){this.falou=true;this.fala(['ab1','ab2','ab3'][this.et])}
    // a lanterna: acende quando a fala do escuro termina (ou no fim da etapa, se a fala atrasar)
    if(this.et===0&&this.tAc<0&&this.falou&&((this.vozFim&&this.t>this.tFala+1)||this.t>this.dur+6)){this.tAc=0;this.aoAcender&&this.aoAcender()}
    if(this.tAc>=0){this.tAc+=dt;this.acesa=sst(.04,1.3,this.tAc)}
    if(this.et===0){this.u=0;this.foco=1;if(this.tAc>1.45)this.entra(1);return}
    if(this.et===1){this.foco=mix(1,.3,sst(.05,.6,k));const q=sst(0,1,k);this.u=this.reduzido?2/this.n:this.uDe(1,k);if(k>=1&&this.vozFim)this.entra(2);return}
    // voo
    this.kVoo=k;this.foco=.3*(1-sst(0,.1,k));if(this.reduzido){const a=k<.5?this.n-3:this.n;this.u=a/this.n;this.corte=Math.min(sst(0,.06,k),1-sst(.44,.5,k)+sst(.5,.56,k))}else this.u=this.uDe(2,k);
    if(!this.ab4&&this.t>=this.tAb4&&this.vozFim){this.ab4=true;this.fala('ab4')}
    if(!this.partiu&&(this.ab4||k>.8)){this.partiu=true;this.aoPartir&&this.aoPartir()}
    if(k>=1&&this.vozFim&&(this.ab4||this.t>this.dur+8)){this.acabou=true;this.aoFim&&this.aoFim()}}
  fovEm(u){const x=clamp(u)*this.n,i=Math.min(this.n-1,Math.floor(x)),f=x-i;return mix(this.K[i].fov,this.K[i+1].fov,f*f*(3-2*f))}
}

// ---------- a lanterna da mesa: chama, clarão e luz pontual com tremulação ----------
// No v45 a chama é o nó LZ40_Lamp_Flame (material emissivo próprio). No v44 vale a lanterna-símbolo de cabine5.js.
export function criaLuzLanterna({B,mesa,CAB,T,L3=null}){
  const g=new THREE.Group(),p=mesa.chama;const luz=new THREE.PointLight(0xffb066,0,9,1.5);luz.position.copy(p);luz.position.y+=.03;g.add(luz);
  // um segundo ponto de luz fraco e mais alto dá volume ao rosto dos objetos (só nas qualidades média e alta)
  const enche=T>=1?new THREE.PointLight(0xff9a4a,0,5,2):null;if(enche){enche.position.set(p.x*.3,p.y+.55,p.z-.5);g.add(enche)}
  const VS=`varying vec2 vU;void main(){vU=uv;vec4 c=modelViewMatrix*vec4(0.,0.,0.,1.);c.xy+=position.xy*vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));gl_Position=projectionMatrix*c;}`;
  const un={uA:{value:0}};const halo=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:un,vertexShader:VS,fragmentShader:`uniform float uA;varying vec2 vU;void main(){float k=max(0.,1.-length(vU*2.-1.));float n=k*k*k*k*1.3+k*k*.1;gl_FragColor=vec4(vec3(1.,.56,.2)*n*uA,1.);}`}));
  halo.scale.set(.24,.24,1);halo.position.copy(p);halo.renderOrder=8;halo.frustumCulled=false;const noModelo=mesa.doModelo;halo.visible=noModelo;g.add(halo);
  const nf=mesa.nos.chama,mats=[],chamas=[];let e0=1;if(nf){nf.traverse(o=>{if(o.isMesh){mats.push(o.material);o.castShadow=false;const ge=o.geometry;ge.computeBoundingBox();const bb=ge.boundingBox,c=bb.getCenter(V());
    // pivô na base da chama, para ela crescer e tremer sem sair do pavio (o eixo 'para cima' do arquivo é o Y do nó)
    ge.translate(-c.x,-bb.min.y,-c.z);o.position.add(V(c.x,bb.min.y,c.z).applyQuaternion(o.quaternion).multiply(o.scale));chamas.push([o,o.scale.clone()])}});e0=mats[0]?mats[0].emissiveIntensity||1:1}
  if(mesa.nos.vidro)mesa.nos.vidro.traverse(o=>{if(o.isMesh){o.castShadow=false;o.renderOrder=5}});if(mesa.nos.lampiao)mesa.nos.lampiao.traverse(o=>{if(o.isMesh)o.castShadow=false});
  let fl=1;
  // Rodada 2: a lanterna de cobre feita em código (lanterna3d.js) toma o lugar da do GLB, na mesma base e com a chama no mesmo ponto
  const usa3=!!(L3&&nf&&mesa.nos.lampiao);
  if(usa3){const by=B.caixa(mesa.nos.lampiao).min.y,s=clamp((p.y-by)/L3.chamaY,.7,1.6);L3.grupo.scale.setScalar(s);L3.grupo.position.set(p.x,by,p.z);{const F0=mesa.chama,C0=mesa.mapa,lmA=F0&&C0&&F0.x>C0.x?-1:1,gir=!!(mesa.nos&&Object.values(mesa.nos).some(n=>n&&n.userData&&n.userData.girado180)),lr=gir?-lmA:lmA;L3.grupo.rotation.y=Math.atan2(lr*.30,-lr*.10)}/* rodada 3: a frente do lampião (bocal, alavanca) para a câmera do close; a alça cai para o outro lado e não cruza o vidro */g.add(L3.grupo);halo.scale.set(.16,.16,1)}
  return {grupo:g,luz,ponto:p,noModelo,usa3,
    // esconde a lanterna do arquivo (chamado depois de a grade de ocupação ser tirada, para a câmera continuar desviando dela)
    troca(){if(usa3)for(const n of[mesa.nos.lampiao,mesa.nos.vidro,nf])if(n)n.visible=false},
    // acesa 0..1; t em segundos. A tremulação soma três senos lentos e um "soluço" raro.
    atualiza(t,acesa,dentro){fl=.86+Math.sin(t*11)*.05+Math.sin(t*23.3)*.04+Math.sin(t*5.1)*.05-Math.pow(Math.max(0,Math.sin(t*.73+1.3)),24)*.16;const a=acesa*fl;
      luz.intensity=a*(dentro?1.5:.5);if(enche)enche.intensity=a*(dentro?.34:0);un.uA.value=a;if(usa3)L3.atualiza(t,acesa,fl);else if(nf){nf.visible=acesa>.02;for(const m of mats)m.emissiveIntensity=e0*(.25+.75*a);const c=.35+.65*acesa;for(const [o,s] of chamas)o.scale.set(s.x*(.9+fl*.1),s.y*c*(.88+fl*.14),s.z*(.9+fl*.1))}
      if(CAB&&!noModelo){CAB.lant.userData.atualiza(t,acesa,fl);CAB.luz.intensity=0}return fl}};
}
