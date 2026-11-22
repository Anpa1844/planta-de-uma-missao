// Atlas de folhagem pintado por código no primeiro quadro. Cada folha guarda a inclinação (R,G) e o brilho (B):
// assim a cor sai de uma paleta por espécie e a luz reage folha por folha, com uma textura só e nenhum arquivo.
import * as THREE from 'three';
import {rng} from './util.js';

export const CEL={denso:0,ramo:1,palmata:2,composta:3,palma:4,leque:5,arbusto:6,samambaia:7,cipo:8,barba:9,capim:10,aninga:11,flor:12,aguape:13,larga:14,seco:15};
const GRADE=4;
export function uvCel(i){const c=i%GRADE,l=Math.floor(i/GRADE),m=.004;return [c/GRADE+m,1-(l+1)/GRADE+m,1/GRADE-2*m,1/GRADE-2*m]}

const cl=v=>v<-1?-1:v>1?1:v;
const enc=(tx,ty,b)=>`rgb(${(128+127*cl(tx))|0},${(128+127*cl(ty))|0},${(255*Math.min(1,Math.max(0,b)))|0})`;
function folha(x,px,py,ang,c,l,b,inc=0,incA=0,vinco=.6,ponta=.14){
  const ca=Math.cos(ang),sa=Math.sin(ang),sx=-sa,sy=-ca,bx=inc*Math.cos(incA),by=inc*Math.sin(incA);
  x.save();x.translate(px,py);x.rotate(ang);
  const g=x.createLinearGradient(0,-l,0,l);
  g.addColorStop(0,enc(bx-sx*vinco,by-sy*vinco,b*.86));g.addColorStop(.46,enc(bx-sx*vinco*.15,by-sy*vinco*.15,b*1.04));g.addColorStop(.5,enc(bx,by,b*.7));g.addColorStop(.54,enc(bx+sx*vinco*.15,by+sy*vinco*.15,b*1.04));g.addColorStop(1,enc(bx+sx*vinco,by+sy*vinco,b*.86));
  x.fillStyle=g;x.beginPath();x.moveTo(0,0);x.bezierCurveTo(c*.2,-l*1.04,c*.62,-l*.9,c*(1+ponta),0);x.bezierCurveTo(c*.62,l*.9,c*.2,l*1.04,0,0);x.fill();x.restore();
}
function lamina(x,px,py,ang,c,w,b,curva=0,inc=0,incA=0){ // folha estreita e curva, para palmas e capim
  const ca=Math.cos(ang),sa=Math.sin(ang),tx=-sa,ty=-ca;
  x.fillStyle=enc(inc*Math.cos(incA)+tx*.35,inc*Math.sin(incA)+ty*.35,b);
  const qx=px+ca*c*.5-sa*curva,qy=py+sa*c*.5+ca*curva,ex=px+ca*c-sa*curva*2.2,ey=py+sa*c+ca*curva*2.2;
  x.beginPath();x.moveTo(px-sa*w,py+ca*w);x.quadraticCurveTo(qx-sa*w*.8,qy+ca*w*.8,ex,ey);x.quadraticCurveTo(qx+sa*w*.8,qy-ca*w*.8,px+sa*w,py-ca*w);x.closePath();x.fill();
}
function galho(x,pts,w,b=.16){x.strokeStyle=enc(0,0,b);x.lineCap='round';x.lineWidth=w;x.beginPath();x.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)x.lineTo(pts[i][0],pts[i][1]);x.stroke()}

export function criaAtlas(T){
  const S=[1024,1536,2048][T],C=S/GRADE,cv=document.createElement('canvas');cv.width=cv.height=S;const x=cv.getContext('2d');const R=rng(77);const P=Math.PI;
  const cel=(i,f)=>{x.save();x.translate((i%GRADE)*C,Math.floor(i/GRADE)*C);x.beginPath();x.rect(0,0,C,C);x.clip();f(C);x.restore()};
  // ramalhetes de folhas pequenas: feixes separados por vãos, para o tufo nunca parecer um disco
  const nuvem=(i,feixes,porFeixe,cf,rel,bb,red=.47)=>cel(i,C=>{const fs=[];for(let k=0;k<feixes;k++){const a=k/feixes*P*2+(R()-.5)*.5,r=(k%3===0?.2:.62+R()*.34)*C*red;fs.push([C/2+Math.cos(a)*r,C/2+Math.sin(a)*r*.94,a])}
    // sombra interna: folhas escuras no fundo, claras por cima
    for(const camada of[0,1])for(const [fx,fy,fa] of fs){const ra=C*(.17+R()*.09);galho(x,[[C/2,C/2],[fx,fy]],C*.007,.1);const n=camada?porFeixe:Math.round(porFeixe*.6);for(let q=0;q<n;q++){const a=R()*P*2,r=Math.pow(R(),.6)*ra,px=fx+Math.cos(a)*r,py=fy+Math.sin(a)*r*.9,c=C*cf*(.74+R()*.5),l=c*rel*(.8+R()*.4),ang=a*.5+fa*.5+(R()-.5)*1.9;const claro=camada?(.42+.5*R())*(.72+.28*r/ra):.12+R()*.24;folha(x,px,py,ang,c,l,bb*claro,R()*.62,R()*P*2)}}});
  nuvem(CEL.denso,T?13:11,T?38:26,.062,.34,1);
  nuvem(CEL.arbusto,T?15:12,T?30:22,.05,.5,1.05,.48);
  // ramo aberto com folhas grandes: dá recorte à silhueta
  cel(CEL.ramo,C=>{const hastes=[[.5,.97,.5,.06],[.5,.74,.2,.3],[.5,.62,.8,.22],[.5,.86,.82,.56],[.5,.8,.14,.58],[.5,.46,.3,.1],[.5,.4,.72,.08]];
    for(const h of hastes)galho(x,[[h[0]*C,h[1]*C],[(h[0]+h[2])*.5*C+C*.02,(h[1]+h[3])*.5*C],[h[2]*C,h[3]*C]],C*.008,.12);
    for(const h of hastes){const n=15;for(let k=1;k<=n;k++){const t=k/n,px=(h[0]+(h[2]-h[0])*t)*C,py=(h[1]+(h[3]-h[1])*t)*C,base=Math.atan2(h[3]-h[1],h[2]-h[0]);for(const s of[-1,1]){const c=C*(.074+R()*.034)*(1.1-t*.3);folha(x,px,py,base+s*(.75+R()*.35),c,c*.3,.42+R()*.5,R()*.5,R()*P*2)}}folha(x,h[2]*C,h[3]*C,Math.atan2(h[3]-h[1],h[2]-h[0]),C*.08,C*.024,.8,0,0)}});
  // embaúba: folhas palmadas grandes, marca das beiras de rio
  cel(CEL.palmata,C=>{const cs=[[.28,.3],[.72,.26],[.5,.56],[.2,.72],[.78,.72],[.5,.18],[.9,.48],[.08,.46]];cs.sort(()=>R()-.5);
    for(const [a,b] of cs){const cx=a*C,cy=b*C,rr=C*(.17+R()*.05),lob=8+Math.floor(R()*3),br=.45+R()*.45,ga=R()*P*2,inc=R()*.45;galho(x,[[C/2,C*.98],[cx,cy]],C*.006,.3);for(let k=0;k<lob;k++){const an=ga+k/lob*P*2+(R()-.5)*.1;folha(x,cx,cy,an,rr*(.82+R()*.3),rr*.17,br*(.86+R()*.28),inc,ga,.72,.05)}}});
  // folhas compostas: copa fina e arejada
  cel(CEL.composta,C=>{for(let k=0;k<26;k++){const a=R()*P*2,r=R()*C*.2,px=C/2+Math.cos(a)*r,py=C/2+Math.sin(a)*r,comp=C*(.2+R()*.14),an=a+(R()-.5)*.9,b=.45+R()*.45;galho(x,[[px,py],[px+Math.cos(an)*comp,py+Math.sin(an)*comp]],C*.003,.2);for(let j=2;j<15;j++){const t=j/15,qx=px+Math.cos(an)*comp*t,qy=py+Math.sin(an)*comp*t;for(const s of[-1,1])folha(x,qx,qy,an+s*1.25,C*.034*(1.15-t*.5),C*.0095,b*(.85+R()*.3),.2,R()*6,.4,.05)}}});
  // palma: raque de baixo para cima e folíolos pendentes (açaí)
  cel(CEL.palma,C=>{galho(x,[[C/2,C],[C/2,0]],C*.012,.3);for(let k=0;k<110;k++){const t=k/110,y=C*(.98-t*.96),env=Math.sin(Math.min(1,t*1.15+.06)*P)*.86+.1;const s=k%2?1:-1;const c=C*.44*env*(.86+R()*.2);lamina(x,C/2,y,P/2-s*(1.1-t*.55)+(R()-.5)*.1,c,C*.0085,.42+R()*.42,s*c*.2,.3,s>0?0:P)}});
  // leque do buriti
  cel(CEL.leque,C=>{for(let k=0;k<54;k++){const a=-P*.5+(k/53-.5)*P*1.4,c=C*(.46+R()*.05);lamina(x,C/2,C*.96,a+(R()-.5)*.03,c*.98,C*.014,.45+R()*.42,(k/53-.5)*C*.1,.25,a+P/2)}});
  // samambaia
  cel(CEL.samambaia,C=>{for(let k=0;k<9;k++){const a=-P*.5+(k/8-.5)*2.2,comp=C*(.36+R()*.12);let px=C/2,py=C*.96,an=a,b=.5+R()*.35;for(let j=0;j<22;j++){const t=j/22;px+=Math.cos(an)*comp/22;py+=Math.sin(an)*comp/22;an+=(k<4?-1:1)*.022;for(const s of[-1,1])lamina(x,px,py,an+s*1.2,C*.055*(1.05-t),C*.006,b*(.9+R()*.2))}}});
  // cipó e barba-de-velho: pendem do alto da célula
  cel(CEL.cipo,C=>{for(let f=0;f<3;f++){let px=C*(.28+f*.22),an=P/2;const b=.45+R()*.3;for(let j=0;j<46;j++){const py=j/46*C,px2=px+Math.sin(j*.3+f*2.1)*C*.008;galho(x,[[px,py],[px2,py+C/46+1]],C*.006*(1.3-j/46),.15);px=px2;if(j%2===0)for(const s of[-1,1])folha(x,px,py,P/2+s*(.7+R()*.5),C*.05*(1.1-j/70),C*.024,b*(.8+R()*.4),.35,R()*6,.5,.1)}}});
  cel(CEL.barba,C=>{x.lineCap='round';for(let k=0;k<70;k++){let px=C*(.08+R()*.84),py=R()*C*.08;const nn=16,l=C*(.45+R()*.52),b=.3+R()*.6,w=C*(.0024+R()*.0034);x.strokeStyle=enc(0,0,b);x.lineWidth=w;x.beginPath();x.moveTo(px,py);for(let j=0;j<nn;j++){px+=(R()-.5)*C*.024;py+=l/nn;x.lineTo(px,py)}x.stroke()}});
  // capim
  cel(CEL.capim,C=>{for(let k=0;k<70;k++){const px=C*(.1+R()*.8),a=-P/2+(px/C-.5)*.9+(R()-.5)*.22,c=C*(.42+R()*.52);lamina(x,px,C,a,c,C*(.005+R()*.005),.35+R()*.6,(px/C-.5)*C*.18,.2,R()*6)}});
  // aninga: folhas em seta sobre hastes
  cel(CEL.aninga,C=>{for(let k=0;k<8;k++){const a=C*(.18+R()*.64),h=C*(.16+R()*.32),inc=(R()-.5);galho(x,[[C*.5+(a-C*.5)*.4,C],[a,h+C*.14]],C*.01,.42);const c=C*.21,base=P/2+inc*.8;for(const s of[-1,1])folha(x,a,h+C*.15,base+s*2.42,c*.62,c*.3,.5+R()*.35,.3,R()*6,.5,.05);folha(x,a,h+C*.15,base,c,c*.45,.6+R()*.32,.3,R()*6,.6,.1)}});
  // flores em cachos
  cel(CEL.flor,C=>{for(let k=0;k<260;k++){const a=R()*P*2,r=Math.pow(R(),.6)*C*.46,px=C/2+Math.cos(a)*r,py=C/2+Math.sin(a)*r,rr=C*(.012+R()*.012),b=.55+R()*.45;for(let p=0;p<5;p++){const pa=p/5*P*2+a;folha(x,px,py,pa,rr*1.5,rr*.8,b,.35,pa,.3,0)}}});
  // aguapé visto de cima
  cel(CEL.aguape,C=>{const n=7;for(let i=0;i<n;i++){const cx=C*(.2+R()*.6),cy=C*(.2+R()*.6);for(let k=0;k<7;k++){const a=k/7*P*2+R(),c=C*(.1+R()*.04);folha(x,cx,cy,a,c,c*.52,.5+R()*.42,.35,a,.4,0)}}});
  // folhas largas: sororoca e bananeira-brava
  cel(CEL.larga,C=>{for(let k=0;k<11;k++){const a=-P/2+(k/10-.5)*2.5+(R()-.5)*.1,c=C*(.34+R()*.14),l=c*.2,sx=C/2,sy=C*.97;const mx=sx+Math.cos(a)*c*.35,my=sy+Math.sin(a)*c*.35;galho(x,[[sx,sy],[mx,my]],C*.009,.3);folha(x,mx,my,a+(k<5?-1:1)*.08,c,l,.42+R()*.42,.3,a,.75,.04)}});
  // galhos secos, para as árvores mortas
  cel(CEL.seco,C=>{const rec=(px,py,an,comp,w,n)=>{const ex=px+Math.cos(an)*comp,ey=py+Math.sin(an)*comp;galho(x,[[px,py],[ex,ey]],w,.14);if(n>0){rec(ex,ey,an-.4-R()*.4,comp*.72,w*.7,n-1);rec(ex,ey,an+.4+R()*.4,comp*.72,w*.7,n-1)}};rec(C/2,C,-P/2,C*.3,C*.016,5)});
  const t=new THREE.CanvasTexture(cv);t.premultiplyAlpha=true;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=[1,2,4][T];t.needsUpdate=true;t.tamanho=S;
  if(typeof window!=='undefined')window.__atlas=cv;return t;
}
