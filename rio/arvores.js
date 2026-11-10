// Árvores amazônicas nascidas de regras: tronco com sapopemas, galhos que se abrem, tufos nas pontas, cipós pendurados.
// Cada espécie é um conjunto de números. A malha é leve; o que dá a riqueza é a silhueta e a luz folha por folha.
import * as THREE from 'three';
import {rng,sst,mix,clamp} from './util.js';
import {CEL,uvCel} from './folhas.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);const v1=V(),v2=V(),v3=V(),v4=V();
const rr=(R,a)=>a[0]+(a[1]-a[0])*R();

// paleta: claro, escuro (sRGB)
export const PALETAS=[
  ['#5f9a34','#0e2a12'],['#4f8e2e','#0c2614'],['#6ea63a','#123214'],['#468430','#0a2416'],['#7aab3e','#163a14'], // verdes
  ['#a7c063','#3a5a2a'], // embaúba, verde-prateado
  ['#d8789c','#7c2850'], // ipê-roxo
  ['#e0bc3c','#8a6010'], // ipê-amarelo
  ['#8a9a6a','#333c28'], // barba-de-velho
  ['#6f9a3c','#1e3e18'], // palma
  ['#9eb65a','#3a5220'], // capim e aninga
];
export const ESPECIES={
  sumauma:{tipo:'arvore',H:[34,44],R:[1.3,1.8],sap:1,fins:[6,9],hSap:6.5,cascaT:.0,lean:.015,niveis:3,seg:[5,4,3,2],afina:[.42,.32,.3,.3],torce:[.015,.14,.22,.3],sobe:[.0,.02,.08,.12],filhos:[[6,8],[3,4],[2,3]],tIni:[.74,.36,.4],ang:[[70,90],[30,62],[24,54]],razao:[.4,.55,.56],razaoR:[.42,.55,.6],tufoR:[2,3.4],K:6,pal:[1,3],cel:[CEL.denso,CEL.ramo],cipos:7,barba:.45},
  alta:{tipo:'arvore',H:[23,36],R:[.72,1.2],sap:.62,fins:[4,7],hSap:3.5,lean:.03,niveis:3,seg:[5,3.6,2.8,2],afina:[.5,.34,.32,.3],torce:[.09,.24,.32,.36],sobe:[.01,.03,.09,.1],filhos:[[5,7],[3,4],[2,4]],tIni:[.5,.3,.34],ang:[[50,78],[30,62],[24,56]],razao:[.46,.56,.56],razaoR:[.52,.56,.6],tufoR:[1.5,2.7],K:6,pal:[0,1,2,3,4],cel:[CEL.denso,CEL.denso,CEL.ramo],cipos:5,barba:.5},
  media:{tipo:'arvore',H:[12,22],R:[.34,.62],sap:.25,fins:[3,5],hSap:1.5,lean:.09,niveis:3,seg:[3.6,2.6,2.2,1.6],afina:[.55,.4,.34,.3],torce:[.14,.28,.34,.36],sobe:[.03,.06,.1,.1],filhos:[[4,6],[3,4],[2,4]],tIni:[.34,.3,.3],ang:[[38,70],[28,58],[24,50]],razao:[.5,.6,.6],razaoR:[.56,.6,.62],tufoR:[1.3,2.3],K:5,pal:[0,1,2,3,4],cel:[CEL.denso,CEL.ramo,CEL.composta],cipos:3,barba:.35},
  embauba:{tipo:'arvore',H:[12,19],R:[.14,.24],sap:0,fins:[0,0],hSap:1,lean:.08,cascaP:1,niveis:2,seg:[3,2.2,1.6],afina:[.55,.4,.3],torce:[.04,.16,.2],sobe:[.02,.45,.5],filhos:[[4,6],[2,3]],tIni:[.62,.55],ang:[[42,70],[22,46]],razao:[.34,.5],razaoR:[.6,.6],tufoR:[1.9,2.9],K:5,pal:[5],cel:[CEL.palmata],cipos:0,barba:0},
  ipe:{tipo:'arvore',H:[15,24],R:[.28,.46],sap:.2,fins:[3,5],hSap:1.5,lean:.05,niveis:3,seg:[3.6,2.6,2.2,1.6],afina:[.55,.4,.34,.3],torce:[.05,.24,.3,.36],sobe:[.03,.12,.16,.16],filhos:[[4,6],[3,4],[2,3]],tIni:[.46,.3,.3],ang:[[36,60],[28,50],[24,46]],razao:[.42,.62,.64],razaoR:[.56,.6,.62],tufoR:[1.8,2.8],K:6,pal:[6,7],cel:[CEL.flor],flor:true,cipos:0,barba:0},
  seca:{tipo:'arvore',H:[18,30],R:[.36,.6],sap:.45,fins:[4,6],hSap:2.5,lean:.04,cascaP:.8,niveis:3,seg:[4,3,2.4,2],afina:[.38,.3,.28,.25],torce:[.02,.2,.3,.34],sobe:[.0,.1,.16,.2],filhos:[[3,5],[2,3],[2,3]],tIni:[.5,.4,.4],ang:[[40,66],[28,52],[24,48]],razao:[.34,.56,.6],razaoR:[.5,.56,.6],tufoR:[1.6,2.4],K:2,pal:[0],cel:[CEL.seco],cipos:0,barba:0},
  acai:{tipo:'palma',H:[13,21],R:[.08,.12],troncos:[3,6],frondes:[11,14],compF:[3.2,4.4],largF:[.9,1.3],pal:[9],cel:CEL.palma,queda:1.45},
  buriti:{tipo:'palma',H:[16,26],R:[.26,.36],troncos:[1,1],frondes:[14,18],compF:[3,3.8],largF:[3.2,4.2],pal:[9],cel:CEL.leque,leque:true},
  moita:{tipo:'moita',A:[1.8,4.2],L:[2.4,5.2],pal:[0,1,2,3,4],cel:[CEL.arbusto,CEL.arbusto,CEL.denso],K:15},
  sororoca:{tipo:'cruz',A:[2.6,4.6],pal:[9],cel:CEL.larga,K:3},
  samambaia:{tipo:'cruz',A:[1,1.8],pal:[2],cel:CEL.samambaia,K:3},
  aninga:{tipo:'cruz',A:[1.8,3],pal:[10],cel:CEL.aninga,K:3},
  capim:{tipo:'cruz',A:[.7,1.3],pal:[10],cel:CEL.capim,K:3},
};

// ---------- esqueleto ----------
function perpendicular(d,o){o.set(d.y,-d.x,0);if(o.lengthSq()<.01)o.set(0,d.z,-d.y);return o.normalize()}
function esqueleto(S,R){
  const sk={ramos:[],tufos:[],H:rr(R,S.H),R0:rr(R,S.R)};let idx=0;
  const cresce=(p,d,comp,r0,n)=>{const seg=Math.max(3,Math.round(comp/S.seg[n])),pts=[p.clone()],rad=[r0],dirs=[d.clone()];const q=p.clone(),dir=d.clone(),r1=r0*S.afina[n];
    for(let i=1;i<=seg;i++){const t=i/seg;dir.x+=(R()-.5)*S.torce[n];dir.z+=(R()-.5)*S.torce[n];dir.y+=S.sobe[n]*(1.1-t)*1.4/seg*(n?3:1)+(n?(R()-.5)*S.torce[n]*.5:0);dir.normalize();q.addScaledVector(dir,comp/seg);pts.push(q.clone());rad.push(Math.max(mix(r0,r1,Math.pow(t,.9)),.035));dirs.push(dir.clone())}
    sk.ramos.push({pts,rad,n,dirs});
    if(n<S.niveis){const nf=Math.round(rr(R,S.filhos[n]));for(let k=0;k<nf;k++){const t=mix(S.tIni[n],.98,(k+R()*.7)/nf),qi=t*seg,i=Math.floor(qi);const base=pts[i],dp=dirs[i],ax=perpendicular(dp,V());idx++;ax.applyAxisAngle(dp,idx*2.39996+R()*.6);const an=rr(R,S.ang[n])*Math.PI/180;const dc=dp.clone().applyAxisAngle(ax,an);if(n===0)dc.y=Math.max(dc.y,.05);dc.normalize();const c=comp*S.razao[n]*(.7+R()*.55);cresce(base,dc,c,Math.max(rad[i]*S.razaoR[n],.06),n+1)}
      // o líder continua até o alto, para a copa não ficar oca
      if(n===0)sk.tufos.push({c:q.clone(),r:rr(R,S.tufoR)*.9,d:dir.clone()})}
    else{sk.tufos.push({c:q.clone(),r:rr(R,S.tufoR),d:dir.clone()});if(seg>3&&R()<.65){const i=Math.floor(seg*.55);sk.tufos.push({c:pts[i].clone(),r:rr(R,S.tufoR)*.7,d:dirs[i].clone()})}}};
  const l=V((R()-.5)*S.lean*5,1,(R()-.5)*S.lean*5).normalize();cresce(V(0,-.3,0),l,sk.H,sk.R0,0);
  sk.fins=[];const nf=Math.round(rr(R,S.fins||[0,0]));for(let k=0;k<nf;k++)sk.fins.push({a:(k+R()*.6)/nf*Math.PI*2,am:(.9+R()*1.5)*(S.sap||0)*2.1,w:.2+R()*.14});
  return sk;
}

// ---------- montador de malhas ----------
class Montador{
  constructor(){this.c={p:[],n:[],uv:[],a:[],i:[]};this.f={p:[],n:[],t:[],uv:[],a:[],i:[]}}
  // superfície em grade fechada em u (tronco e galhos). pos(i,j) devolve o ponto no vetor o
  tubo(pts,rad,lados,fmod,aoF,uvV0=0){const C=this.c,base=C.p.length/3,nr=pts.length,nl=lados+1;const T=V(),N=V(),B=V(),P=V();N.copy(perpendicular(v1.copy(pts[1]).sub(pts[0]).normalize(),V()));
    const out=new Float32Array(nr*nl*3);let v=uvV0;
    for(let i=0;i<nr;i++){T.copy(pts[Math.min(i+1,nr-1)]).sub(pts[Math.max(i-1,0)]).normalize();N.addScaledVector(T,-N.dot(T)).normalize();B.crossVectors(T,N);if(i>0)v+=pts[i].distanceTo(pts[i-1])/1.6;
      const circ=Math.max(1,Math.round(rad[0]*6.28/1.6));
      for(let j=0;j<nl;j++){const th=j/lados*Math.PI*2,r=rad[i]*(fmod?fmod(th,i,pts[i]):1);P.copy(pts[i]).addScaledVector(N,Math.cos(th)*r).addScaledVector(B,Math.sin(th)*r);const k=(i*nl+j)*3;out[k]=P.x;out[k+1]=P.y;out[k+2]=P.z;C.uv.push(j/lados*circ,v);C.a.push(aoF(i,th,pts[i]))}}
    for(let k=0;k<out.length;k++)C.p.push(out[k]);
    // normais pela grade
    const get=(i,j,o)=>{const k=(i*nl+((j+lados)%lados))*3;o.set(out[k],out[k+1],out[k+2]);return o};
    for(let i=0;i<nr;i++)for(let j=0;j<nl;j++){get(i,j+1,v1).sub(get(i,j-1,v2));get(Math.min(i+1,nr-1),j,v3).sub(get(Math.max(i-1,0),j,v4));v2.crossVectors(v3,v1).normalize();C.n.push(v2.x,v2.y,v2.z)}
    for(let i=0;i<nr-1;i++)for(let j=0;j<lados;j++){const a=base+i*nl+j,b=a+1,c=a+nl,d=c+1;C.i.push(a,c,b,b,c,d)}}
  // cartão de folhagem, com leve vinco no meio. dados: cen, n (normal do cartão), t, escala u e v
  cartao(cen,n,t,su,sv,cel,info,vinco=.2,flip=false){const F=this.f,b=v1.crossVectors(t,n).normalize(),base=F.p.length/3;const [u0,v0,du,dv]=uvCel(cel);const U0=flip?u0+du:u0,DU=flip?-du:du;const cols=vinco>0?3:2;
    for(let j=0;j<2;j++)for(let i=0;i<cols;i++){const x=(i/(cols-1)-.5)*2,y=j*2-1,alto=vinco>0?(1-Math.abs(x))*vinco*su:0;F.p.push(cen.x+t.x*x*su+b.x*y*sv+n.x*alto,cen.y+t.y*x*su+b.y*y*sv+n.y*alto,cen.z+t.z*x*su+b.z*y*sv+n.z*alto);F.uv.push(U0+DU*(i/(cols-1)),v0+dv*j);F.t.push(t.x*(flip?-1:1),t.y*(flip?-1:1),t.z*(flip?-1:1));F.n.push(n.x,n.y,n.z);F.a.push(info[0],info[1],info[2],info[3])}
    for(let i=0;i<cols-1;i++){const a=base+i,c=a+cols;F.i.push(a,a+1,c,a+1,c+1,c)}return base}
  gera(){const fz=(o,attrs,tam)=>{const g=new THREE.BufferGeometry();for(const [nome,arr,n] of attrs)g.setAttribute(nome,new THREE.BufferAttribute(new Float32Array(arr),n));g.setIndex(arr32(o.i));return g};const arr32=i=>{let m=0;for(const x of i)if(x>m)m=x;return new THREE.BufferAttribute(m<65535?new Uint16Array(i):new Uint32Array(i),1)};
    const out={};if(this.c.i.length)out.casca=fz(this.c,[['position',this.c.p,3],['normal',this.c.n,3],['uv',this.c.uv,2],['aA',this.c.a,1]]);if(this.f.i.length)out.copa=fz(this.f,[['position',this.f.p,3],['normal',this.f.n,3],['aTan',this.f.t,3],['uv',this.f.uv,2],['aI',this.f.a,4]]);return out}
}

// Normal "inchada" do tufo e da copa: é o que transforma cartões em massas de folhagem
function encurva(F,ini,cen,raio,copaC,copaR,topo,fim){const n=V(),a=V(),b=V();for(let i=ini;i<fim;i++){const k=i*3;a.set(F.p[k],F.p[k+1],F.p[k+2]);n.set(F.n[k],F.n[k+1],F.n[k+2]);b.copy(a).sub(cen).divideScalar(raio);v1.copy(a).sub(copaC);v1.y*=1.5;v1.divideScalar(copaR);n.multiplyScalar(.3).addScaledVector(b,.86).addScaledVector(v1,.34).normalize();F.n[k]=n.x;F.n[k+1]=n.y;F.n[k+2]=n.z;
    // oclusão: por baixo e por dentro do tufo e da copa
    const q=i*4,yT=clamp(b.y*.5+.5),yC=clamp((a.y-topo[0])/(topo[1]-topo[0])),rC=clamp(Math.hypot(v1.x,v1.z));F.a[q]=Math.max(.14,(.28+.72*Math.pow(yT,1.2))*(.56+.44*sst(.0,.7,yC))*(.66+.34*sst(.15,.85,rC)))}}

function geraArvore(S,R,lod){
  const sk=esqueleto(S,R),M=new Montador();
  // tronco e galhos
  for(const r of sk.ramos){if(r.n===0){
      const nr=lod?9:14,ts=lod?[-.03,0,.02,.06,.12,.25,.45,.7,1]:[-.03,0,.008,.02,.04,.07,.11,.17,.26,.38,.52,.68,.84,1];const pts=[],rad=[];const seg=r.pts.length-1;for(const t of ts){const q=clamp(t)*seg,i=Math.min(seg-1,Math.floor(q)),k=q-i;const p=r.pts[i].clone().lerp(r.pts[i+1],k);if(t<0)p.y-=1.2;pts.push(p);rad.push(mix(r.rad[i],r.rad[i+1],k)*(1+Math.exp(-p.y/1.6)*.34*(S.sap?1:.3)))}
      const fins=sk.fins,hS=S.hSap||1,flu=S.sap?.05:.02,kf=Math.max(5,fins.length+2);const lados=lod?Math.max(6,Math.round(S.sap?11:6)):Math.round(S.sap>.5?22:S.sap>0?12:8);
      const fm=(th,i,p)=>{let f=1+flu*Math.cos(kf*th+1.7)*(1-.5*sst(0,14,p.y));const dec=Math.exp(-Math.max(p.y,0)/hS);for(const q of fins){let d=th-q.a;d=Math.atan2(Math.sin(d),Math.cos(d));f+=q.am*Math.exp(-(d*d)/(q.w*q.w))*dec*dec}return f};
      M.tubo(pts,rad,lados,fm,(i,th,p)=>{const f=fm(th,i,p);return (.5+.5*sst(0,7,p.y))*(.62+.38*clamp((f-1)*1.1+.45))},0);
    }else{if(r.rad[0]<.012)continue;const lad=r.rad[0]>.34?(lod?6:9):r.rad[0]>.12?(lod?4:6):3;let pts=r.pts,rad=r.rad;if(lod&&pts.length>4){const ii=[];for(let i=0;i<pts.length;i+=2)ii.push(i);if(ii[ii.length-1]!==pts.length-1)ii.push(pts.length-1);pts=ii.map(i=>r.pts[i]);rad=ii.map(i=>r.rad[i])}M.tubo(pts,rad,lad,null,(i,th,p)=>.82,R()*9)}}
  // copa
  if(!sk.tufos.length)return {g:M.gera(),raio:6,H:sk.H};
  const C=V();for(const t of sk.tufos)C.add(t.c);C.divideScalar(sk.tufos.length);let cr=1,ymin=1e9,ymax=-1e9;for(const t of sk.tufos){cr=Math.max(cr,Math.hypot(t.c.x-C.x,t.c.z-C.z)+t.r);ymin=Math.min(ymin,t.c.y-t.r);ymax=Math.max(ymax,t.c.y+t.r)}
  const F=M.f;const nC=V(),tC=V(),cen=V();const K=lod===0?S.K:lod===1?Math.max(3,Math.round(S.K*.55)):3;const esc=lod===0?1:lod===1?1.26:1.5;
  for(const t of sk.tufos){const ini=F.p.length/3,raio=t.r*esc;for(let k=0;k<K;k++){
      // os primeiros cartões são o "teto" achatado do tufo; os outros, a saia que dá recorte de lado
      let s;const teto=k<Math.ceil(K*.45);if(teto){nC.set((R()-.5)*.7,1,(R()-.5)*.7).normalize();const a=R()*6.283,r=raio*(.1+R()*.56);cen.set(t.c.x+Math.cos(a)*r,t.c.y+raio*(.06+R()*.16),t.c.z+Math.sin(a)*r);s=raio*(.62+R()*.34)}else{const a=(k/K)*6.283+R()*1.2,h=-.25+R()*.75;nC.set(Math.cos(a),h,Math.sin(a)).normalize();cen.set(t.c.x+nC.x*raio*(.42+R()*.4),t.c.y+nC.y*raio*.42,t.c.z+nC.z*raio*(.42+R()*.4));s=raio*(.46+R()*.3)}
      tC.set(R()-.5,(R()-.5)*.3,R()-.5);tC.addScaledVector(nC,-tC.dot(nC)).normalize();const cel=S.cel[Math.floor(R()*S.cel.length)];
      M.cartao(cen,nC,tC,s,s,cel,[1,R()*2-1,(S.flor?2:0)+R()*.98,.2],lod===0?.22:0,R()<.5)}
    encurva(F,ini,t.c,raio*1.1,C,cr,[ymin,ymax],F.p.length/3)}
  // flor mistura um pouco de folha
  // cipós e barba-de-velho pendendo dos galhos fortes
  const ni=lod===0?(S.cipos||0):lod===1?Math.round((S.cipos||0)*.5):0;const fortes=sk.ramos.filter(r=>r.n===1||r.n===2);
  for(let q=0;q<ni&&fortes.length;q++){const r=fortes[Math.floor(R()*fortes.length)],i=Math.floor(R()*r.pts.length),p=r.pts[i],comp=3+R()*Math.min(11,p.y*.45),larg=.32+R()*.42,cel=R()<(S.barba||0)*.7?CEL.barba:CEL.cipo;const a=R()*6.283;nC.set(Math.cos(a),0,Math.sin(a));tC.set(-nC.z,0,nC.x);cen.set(p.x,p.y-comp/2,p.z);const base=M.cartao(cen,nC,tC,larg,comp/2,cel,[.8,R()*2-1,1+R()*.98,1],0,R()<.5);
    // no topo do cipó o balanço é zero: o vértice de cima (j=1) fica preso
    for(let w=0;w<2;w++)F.a[(base+2+w)*4+3]=0;for(let w=0;w<2;w++)F.a[(base+w)*4+3]=1;}
  return {g:M.gera(),raio:cr,H:ymax,cx:C.x,cz:C.z};
}

function geraPalma(S,R,lod){
  const M=new Montador(),F=M.f;const nt=Math.round(rr(R,S.troncos));const H0=rr(R,S.H);let raio=1;const nC=V(),tC=V(),cen=V();
  for(let t=0;t<nt;t++){const a=R()*6.28,d=nt>1?(.25+R()*.7):0,inc=nt>1?.06+R()*.08:.02;const H=H0*(nt>1?.65+R()*.45:1);const p0=V(Math.cos(a)*d,-.4,Math.sin(a)*d);const pts=[],rad=[];const nn=lod?4:7,r0=rr(R,S.R);for(let i=0;i<=nn;i++){const q=i/nn;pts.push(V(p0.x+Math.cos(a)*inc*q*q*H,p0.y+q*H,p0.z+Math.sin(a)*inc*q*q*H));rad.push(r0*(1-.25*q)*(1+Math.exp(-q*H/.9)*(nt>1?.2:.6)))}
    M.tubo(pts,rad,lod?4:7,null,(i,th,p)=>.6+.4*sst(0,6,p.y),R()*5);const topo=pts[nn];
    if(!S.leque){cen.copy(topo);M.tubo([topo.clone().setY(topo.y-1.7),topo],[r0*1.2,r0*.85],lod?3:5,null,()=>.75,0)}
    const nfr=Math.round(rr(R,S.frondes)*(nt>1?.8:1)*(lod?.75:1)),segs=lod?3:6;
    for(let f=0;f<nfr;f++){const an=f*2.39996+R()*.4,elev=S.leque?(-.4+R()*1.8):(-.2+R()*1.2),comp=rr(R,S.compF),larg=rr(R,S.largF);
      if(S.leque){// leque na ponta de um pecíolo
        const dir=V(Math.cos(an)*Math.cos(elev),Math.sin(elev)*.7+.35,Math.sin(an)*Math.cos(elev)).normalize();const pc=topo.clone().addScaledVector(dir,comp*.9);if(!lod)M.tubo([topo,pc],[.05,.03],3,null,()=>.7,0);nC.copy(dir).add(V(0,.25,0)).normalize();tC.set(-dir.z,0,dir.x).normalize();cen.copy(pc).addScaledVector(dir,larg*.42);const ini=F.p.length/3;M.cartao(cen,nC,tC,larg*.52,larg*.52,S.cel,[1,R()*2-1,R()*.98,.35],lod?0:.16,R()<.5);encurva(F,ini,topo,comp+larg,topo,comp+larg,[topo.y-comp-larg,topo.y+comp+larg],F.p.length/3);raio=Math.max(raio,comp+larg)}
      else{// fronde curva: uma fita em arco com folíolos pendentes
        const ini=F.p.length/3,dx=Math.cos(an),dz=Math.sin(an),tt=V(-dz,0,dx);const [u0,v0,du,dv]=uvCel(S.cel);for(let i=0;i<=segs;i++){const q=i/segs,e=elev+.75-q*q*(S.queda||1.4)*1.5,r=comp*q,px=topo.x+dx*r*Math.cos(e*.55),py=topo.y+r*Math.sin(e*.72)+.2,pz=topo.z+dz*r*Math.cos(e*.55),w=larg*(.42+.58*Math.sin(Math.min(1,q*1.1+.05)*Math.PI));for(const sd of[-1,1]){F.p.push(px+tt.x*sd*w,py-Math.abs(sd)*.12*w,pz+tt.z*sd*w);F.n.push(.2*dx*q,1,.2*dz*q);F.t.push(tt.x,0,tt.z);F.uv.push(u0+du*(sd*.5+.5),v0+dv*q);F.a.push(mix(.55,1,q),R()*.4-.2,R()*.98,mix(.08,.7,q))}}
          for(let i=0;i<segs;i++){const a=ini+i*2;F.i.push(a,a+1,a+2,a+1,a+3,a+2)}raio=Math.max(raio,comp)}}}
  return {g:M.gera(),raio,H:H0+raio*.3};
}
function geraMoita(S,R,lod){const M=new Montador(),F=M.f,A=rr(R,S.A),L=rr(R,S.L)*.5;const nC=V(),tC=V(),cen=V(),C=V(0,A*.28,0);const K=lod===0?S.K:lod===1?Math.round(S.K*.55):5;const esc=lod===0?1:lod===1?1.25:1.5;
  for(let k=0;k<K;k++){const a=k*2.39996+R()*.5,h=Math.pow(k/K,.6)*1.3-.1;nC.set(Math.cos(a)*(1.1-h*.55),h,Math.sin(a)*(1.1-h*.55)).normalize();cen.set(nC.x*L*.82,A*.3+nC.y*A*.72,nC.z*L*.82);tC.set(R()-.5,(R()-.5)*.3,R()-.5);tC.addScaledVector(nC,-tC.dot(nC)).normalize();const s=mix(L,A,.3)*(.62+R()*.3)*esc,cel=S.cel[Math.floor(R()*S.cel.length)];const ini=F.p.length/3;M.cartao(cen,nC,tC,s,s,cel,[1,R()*2-1,R()*.98,.28],lod===0?.2:0,R()<.5);encurva(F,ini,cen.clone().multiplyScalar(.5),Math.max(L,A),C,Math.max(L,A)*1.1,[-.2,A*1.25],F.p.length/3)}
  return {g:M.gera(),raio:L*1.1,H:A*1.2};}
function geraCruz(S,R,lod){const M=new Montador(),F=M.f,A=rr(R,S.A);const nC=V(),tC=V(),cen=V();const K=lod?2:S.K;for(let k=0;k<K;k++){const a=k/K*Math.PI+R()*.4;nC.set(Math.cos(a),.14,Math.sin(a)).normalize();tC.set(-Math.sin(a),0,Math.cos(a));cen.set(0,A*.48,0);const ini=F.p.length/3;const sc=A*.56;M.cartao(cen,nC,tC,sc,sc,S.cel,[1,R()*2-1,R()*.98,.4],0,R()<.5);for(let i=ini;i<F.p.length/3;i++){const y=F.p[i*3+1];F.n[i*3]=F.p[i*3]*.5/A;F.n[i*3+1]=1;F.n[i*3+2]=F.p[i*3+2]*.5/A;F.a[i*4]=mix(.42,1,clamp(y/(A*.9)))}
    // a base fica presa ao chão
    for(let w=0;w<2;w++)F.a[(ini+w)*4+3]=0}
  return {g:M.gera(),raio:A*.56,H:A};}

export function criaVariante(nome,semente,lod){const S=ESPECIES[nome],R=rng(semente);const q=S.tipo==='arvore'?geraArvore(S,R,lod):S.tipo==='palma'?geraPalma(S,R,lod):S.tipo==='moita'?geraMoita(S,R,lod):geraCruz(S,R,lod);q.S=S;q.nome=nome;return q}
