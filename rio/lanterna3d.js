// A lanterna da abertura, feita em código (V6, rodada 2): lampião de cobre envelhecido do character sheet do evento
// (_MATERIAIS/REVISTA/CAPA/Elementos/LANTERNA_v2.jpg e LANTERNA.jpg). Nenhum arquivo externo: perfis de revolução,
// barras varridas, arames em tubo e uma textura de pátina desenhada num canvas.
// Origem no centro da BASE (y=0 apoia na mesa), +Y para cima, metros. A frente (+Z) é o lado da tampa do bocal.
// As medidas abaixo estão em "px do sheet" (vista de frente, 653 px da base à tampa) e são convertidas por K.
import * as THREE from 'three';

const CHAMA_PX=312;            // centro da chama acima da base, em px do sheet
const K=.125/CHAMA_PX;         // metros por px: a chama fica a 0,125 m da base (altura do nó LZ40_Lamp_Flame sobre o tampo)
const TAU=Math.PI*2;

// ---------- geometria ----------
// Revolução com normais lisas em volta e vincadas ao longo do perfil (ponto com s=1 é alisado). P: [r,y,tom,s]
function torno(P,segs,uRep=3){
  const pos=[],nor=[],uv=[],cor=[];const n=P.length,N=[];let comp=[0];
  for(let k=0;k<n-1;k++){const dr=P[k+1][0]-P[k][0],dy=P[k+1][1]-P[k][1],L=Math.hypot(dr,dy)||1;N.push([dy/L,-dr/L]);comp.push(comp[k]+L)}
  const nEm=(k,j)=>{const a=N[k];if(!P[j][3])return a;const b=j===k?N[k-1]:N[k+1];if(!b)return a;const x=a[0]+b[0],y=a[1]+b[1],L=Math.hypot(x,y)||1;return [x/L,y/L]};
  const v=(j,k,i)=>{const a=i/segs*TAU,c=Math.cos(a),s=Math.sin(a),p=P[j],q=nEm(k,j);pos.push(p[0]*s,p[1],p[0]*c);nor.push(q[0]*s,q[1],q[0]*c);uv.push(i/segs*uRep,comp[j]/260);const t=p[2]===undefined?1:p[2];cor.push(t,t,t)};
  for(let k=0;k<n-1;k++){if(P[k][0]===0&&P[k+1][0]===0)continue;for(let i=0;i<segs;i++){
    if(P[k][0]>0){v(k,k,i);v(k+1,k,i+1);v(k+1,k,i)}       // (triângulos com ordem anti-horária vista de fora)
    if(P[k+1][0]>0||P[k][0]>0){if(P[k][0]>0){v(k,k,i);v(k,k,i+1);v(k+1,k,i+1)}else{v(k,k,i);v(k+1,k,i+1);v(k+1,k,i)}}}}
  return {pos,nor,uv,cor};
}
// Barra chata varrida ao longo de um caminho no plano XY: seção retangular chanfrada (a: meia espessura no plano, b: meia largura em Z)
// Rodada 3: seção oval lisa (8 lados, normais analíticas) em vez do octógono de faces planas: a barra lê como tubo achatado, como no sheet.
function barra(C,a,b,tom=1){
  const pos=[],nor=[],uv=[],cor=[],NS=8;const S=[];for(let j=0;j<NS;j++){const t=j/NS*TAU,c=Math.cos(t),s=Math.sin(t),nx=c/a,nz=s/b,l=Math.hypot(nx,nz);S.push([a*c,b*s,nx/l,nz/l,c])}
  const fr=C.map((p,i)=>{const q=C[Math.min(C.length-1,i+1)],o=C[Math.max(0,i-1)];const tx=q[0]-o[0],ty=q[1]-o[1],L=Math.hypot(tx,ty)||1;return [ty/L,-tx/L]});
  const P=(i,j)=>{const s=S[j%NS],n=fr[i],p=C[i];return [[p[0]+n[0]*s[0],p[1]+n[1]*s[0],s[1]],[n[0]*s[2],n[1]*s[2],s[3]],s[4]]};
  let v=0;for(let i=0;i<C.length-1;i++){const L=Math.hypot(C[i+1][0]-C[i][0],C[i+1][1]-C[i][1]);for(let j=0;j<NS;j++){const A=P(i,j),B=P(i,j+1),D=P(i+1,j),E=P(i+1,j+1);
      for(const [q,u,w] of [[A,j/NS,v],[B,(j+1)/NS,v],[E,(j+1)/NS,v+L],[A,j/NS,v],[E,(j+1)/NS,v+L],[D,j/NS,v+L]]){pos.push(...q[0]);nor.push(...q[1]);uv.push(u*.5,w/260);
        // as bordas do tubo (de lado para a vista) ficam mais escuras: é a pátina das arestas
        const t=tom*(.6+.4*Math.abs(q[2]));cor.push(t,t,t)}}v+=L}
  for(const [i,inv] of [[0,1],[C.length-1,0]]){const f=fr[i],tx=f[1],ty=-f[0],sg=inv?-1:1;for(let j=1;j<NS-1;j++){const tri=inv?[P(i,0),P(i,j),P(i,j+1)]:[P(i,0),P(i,j+1),P(i,j)];for(const q of tri){pos.push(...q[0]);nor.push(tx*sg,ty*sg,0);uv.push(.1,.1);cor.push(.6*tom,.6*tom,.6*tom)}}}
  return {pos,nor,uv,cor};
}
// qualquer BufferGeometry do three vira o mesmo formato (sem índice), com uma matriz aplicada e um tom fixo
function peca(geo,m,tom=1){const g=geo.index?geo.toNonIndexed():geo;if(m)g.applyMatrix4(m);const n=g.attributes.position.count,cor=new Array(n*3).fill(tom);const r={pos:Array.from(g.attributes.position.array),nor:Array.from(g.attributes.normal.array),uv:Array.from(g.attributes.uv.array),cor};geo.dispose();if(g!==geo)g.dispose();return r}
function junta(L){const g=new THREE.BufferGeometry();const cat=k=>new Float32Array(L.reduce((a,p)=>a+p[k].length,0));const P=cat('pos'),N=cat('nor'),U=cat('uv'),C=cat('cor');let a=0,b=0;for(const p of L){P.set(p.pos,a);N.set(p.nor,a);C.set(p.cor,a);U.set(p.uv,b);a+=p.pos.length;b+=p.uv.length}
  g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.setAttribute('uv',new THREE.BufferAttribute(U,2));g.setAttribute('color',new THREE.BufferAttribute(C,3));return g}
const M=(x=0,y=0,z=0,rx=0,ry=0,rz=0,s=1)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz,'YXZ')),new THREE.Vector3(s,s,s));
const arame=(pts,r,tub,rad,tom)=>peca(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),false,'centripetal'),tub,r,rad,false),null,tom);

// ---------- textura de pátina (cobre com manchas escuras, riscos e um pouco de azinhavre) ----------
function patina(n){
  let s=20261;const rnd=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return ((s>>>0)%100000)/100000};
  const mk=()=>{const c=document.createElement('canvas');c.width=c.height=n;return c};const cor=mk(),rug=mk(),a=cor.getContext('2d'),b=rug.getContext('2d'),e=n/512;
  a.fillStyle='#96553a';a.fillRect(0,0,n,n);b.fillStyle='#606060';b.fillRect(0,0,n,n);
  // desenha repetido nas bordas, para a textura fechar em volta da peça
  const bolha=(ctx,x,y,r,c0,c1)=>{for(const dx of[-n,0,n])for(const dy of[-n,0,n]){if(x+dx+r<0||x+dx-r>n||y+dy+r<0||y+dy-r>n)continue;const g=ctx.createRadialGradient(x+dx,y+dy,0,x+dx,y+dy,r);g.addColorStop(0,c0);g.addColorStop(1,c1);ctx.fillStyle=g;ctx.fillRect(x+dx-r,y+dy-r,2*r,2*r)}};
  // variação larga de tom: cobre mais claro e mais alaranjado
  for(let i=0;i<70;i++){const x=rnd()*n,y=rnd()*n,r=(30+rnd()*90)*e,q=rnd();bolha(a,x,y,r,q<.5?'rgba(205,128,88,.28)':'rgba(120,62,38,.38)','rgba(180,100,60,0)')}
  // manchas escuras de oxidação (grandes e esparsas, depois pequenas e muitas)
  for(let i=0;i<64;i++){const x=rnd()*n,y=rnd()*n,r=(12+rnd()*56)*e,o=.3+rnd()*.4;bolha(a,x,y,r,`rgba(38,22,14,${o})`,'rgba(38,22,14,0)');bolha(b,x,y,r,`rgba(215,215,215,${o})`,'rgba(215,215,215,0)')}
  for(let i=0;i<900;i++){const x=rnd()*n,y=rnd()*n,r=(1+rnd()*4.5)*e,o=.2+rnd()*.5;bolha(a,x,y,r,`rgba(26,15,10,${o})`,'rgba(26,15,10,0)');bolha(b,x,y,r,`rgba(230,230,230,${o})`,'rgba(230,230,230,0)')}
  // azinhavre discreto
  for(let i=0;i<26;i++){const x=rnd()*n,y=rnd()*n,r=(5+rnd()*18)*e;bolha(a,x,y,r,'rgba(70,104,84,.22)','rgba(70,104,84,0)')}
  // brilhos de desgaste e riscos finos (na horizontal: seguem a volta da peça)
  for(let i=0;i<44;i++){const x=rnd()*n,y=rnd()*n,r=(6+rnd()*22)*e;bolha(a,x,y,r,'rgba(255,176,118,.26)','rgba(255,176,118,0)');bolha(b,x,y,r,'rgba(40,40,40,.5)','rgba(40,40,40,0)')}
  for(let i=0;i<200;i++){const x=rnd()*n,y=rnd()*n,l=(20+rnd()*110)*e,cl=rnd()<.45;a.strokeStyle=cl?'rgba(232,160,118,.16)':'rgba(30,18,12,.22)';a.lineWidth=(.5+rnd())*e;a.beginPath();a.moveTo(x,y);a.lineTo(x+l,y+(rnd()-.5)*5*e);a.stroke();if(x+l>n){a.beginPath();a.moveTo(x-n,y);a.lineTo(x+l-n,y);a.stroke()}}
  const tx=c=>{const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};const tc=tx(cor);tc.colorSpace=THREE.SRGBColorSpace;return {cor:tc,rug:tx(rug)};
}

// ---------- a lanterna ----------
export function criaLanterna3D({T=2}={}){
  const SG=[12,14,16][T]||16,grupo=new THREE.Group();grupo.name='Lanterna3D';const L=[];
  // 1) tanque: pé com borda virada, parede baixa, ombro em cúpula, colarinho do queimador, prato da galeria e cúpula do queimador
  L.push(torno([[0,0,.45],[162,0,.45],[170,6,.6],[168,13,1],[150,31,.65,1],[143,54,.95],[143,110,.9],[139,121,.6,1],[116,137,.9,1],[84,149,1,1],[65,154,.7,1],[62,158,.5],[62,193,.9],[66,200,.6],[91,201,.55],[93,207,1],[88,212,.55],[42,214,.45],[38,228,.9],[32,244,.9,1],[19,255,.8,1],[0,259,.75]],SG));
  // 2) coroa: anel de cima do globo, gola furada, campânula de dois degraus, gola da fenda, tampa achatada
  L.push(torno([[84,432,.45],[92,437,.65],[92,460,1],[70,463,.45],[70,480,.8],[104,481,.5],[110,486,.8],[109,503,1],[101,511,.6],[98,566,1],[88,572,.6],[85,594,1],[56,598,.45],[55,628,.8],[87,628,.45],[92,633,.75],[90,639,1],[72,647,.95,1],[38,652,.9,1],[0,654,.85]],SG));
  // 3) barras de proteção: chatas e grossas, saem do degrau de cima da campânula, descem em arco e fecham no ombro do tanque
  const cam=[[86,548],[120,550],[140,542],[149,522],[153,480],[160,390],[170,290],[178,215],[176,180],[163,152],[140,134],[112,126]];
  const camS=new THREE.CatmullRomCurve3(cam.map(p=>new THREE.Vector3(p[0],p[1],0)),false,'centripetal').getPoints(T?14:9).map(v=>[v.x,v.y]);
  for(const e of[1,-1]){L.push(barra(camS.map(p=>[p[0]*e,p[1]]),19,25));
    // olhal no alto de cada barra (onde prende a alça)
    L.push(peca(new THREE.TorusGeometry(9,3.4,4,6),M(e*163,566,0,0,0,e*-.5),.7))}
  // 4) tampa do bocal: rosqueada (serrilhada), inclinada sobre o ombro, na frente; gola curta por baixo
  {const m=M(-8,126,112,.9,0,0);const tp=torno([[0,0,.5],[22,0,.5],[22,8,.7],[29,9,.5],[30,12,1],[30,24,.75],[27,27,.6],[0,28,.95]],8,1);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(tp.pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(tp.nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(tp.uv,2));const q=peca(g,m);
    // serrilha: escurece as faixas da parede, uma sim, uma não
    const n=tp.cor.length/3;for(let i=0;i<n;i++){const y=tp.pos[i*3+1],a=Math.atan2(tp.pos[i*3],tp.pos[i*3+2]);const ser=y>10&&y<26?(Math.floor((a/TAU+1)*12+.25)%2?.5:1):1;const t=tp.cor[i*3]*ser;q.cor[i*3]=q.cor[i*3+1]=q.cor[i*3+2]=t}L.push(q)}
  // 5) argola do bocal (na ponta de um arame que sai do colarinho, a boreste)
  L.push(arame([[60,178,18],[84,172,30],[100,164,40]],2.2,3,4,.8));L.push(peca(new THREE.TorusGeometry(10,2.4,4,T?10:6),M(108,160,46,.5,.9,0),.85));
  // 6) argola de cima, em pé sobre a tampa
  {const m=M(0,682,0,0,0,0);m.scale(new THREE.Vector3(.85,1.25,1));L.push(peca(new THREE.TorusGeometry(28,3.8,5,T?12:8),m,.85))}
  // 7) alça de arame fino, em laço, caída para trás (LANTERNA.jpg)
  {/* Rodada 3: laço liso (antes, poligonal com quinas); cai para trás e um pouco para o lado, como em LANTERNA.jpg */const B=[];for(let i=0;i<=24;i++){const u=i/24,a=Math.PI*u,sx=-Math.cos(a),dn=Math.sin(a);B.push([163*sx*(1-.12*dn),566-322*Math.pow(dn,1.25),-158*Math.pow(dn,.9)+18*sx*dn])}L.push(arame(B,2.4,T?20:12,T?4:3,.8))}
  // 8) alavanca do queimador: suporte na barra de bombordo, arame até o prato, e o botão que sai para a frente
  L.push(peca(new THREE.BoxGeometry(10,26,18),M(-160,268,4,0,0,-.03),.8));L.push(arame([[-152,256,6],[-140,222,10],[-112,208,8],[-88,207,4]],2.4,5,4,.75));L.push(arame([[-152,280,10],[-150,300,30],[-144,318,46]],3,3,4,.9));
  // arame do outro lado (apoio do globo), do prato até a barra de boreste
  L.push(arame([[88,207,4],[112,214,6],[140,232,4],[160,238,0]],2.2,4,4,.75));
  // pavio: rolo chato no topo do queimador
  const cobre=junta(L);cobre.scale(K,K,K);
  const tex=patina(T?512:256);
  const mCobre=new THREE.MeshStandardMaterial({map:tex.cor,roughnessMap:tex.rug,metalnessMap:null,color:0xffffff,metalness:.42,roughness:.92,vertexColors:true,emissive:0x5a260c,emissiveMap:tex.cor,emissiveIntensity:0});
  const corpo=new THREE.Mesh(cobre,mCobre);corpo.name='Lanterna3D_Cobre';grupo.add(corpo);
  // fendas de ventilação (4) e furos da gola (8): chapas escuras encostadas no metal
  {const E=[];for(let i=0;i<4;i++){const a=i*Math.PI/2;E.push(peca(new THREE.PlaneGeometry(54,17),M(Math.sin(a)*56.2,612,Math.cos(a)*56.2,0,a,0)))}
    const nf=T?8:4;for(let i=0;i<nf;i++){const a=(i+.5)*TAU/nf;E.push(peca(new THREE.CircleGeometry(4.6,4),M(Math.sin(a)*66.8,476,Math.cos(a)*66.8,0,a,0)))}
    // pavio (tecido claro) entra no material escuro com cor por vértice
    const g=junta(E);g.scale(K,K,K);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x0b0705}));m.name='Lanterna3D_Fendas';grupo.add(m)}
  const pavio=new THREE.Mesh(new THREE.BoxGeometry(24*K,17*K,6*K),new THREE.MeshStandardMaterial({color:0xcdb98a,roughness:1,metalness:0,emissive:0xff7a22,emissiveIntensity:0}));pavio.position.set(0,263*K,0);pavio.name='Lanterna3D_Pavio';grupo.add(pavio);
  // 9) globo de vidro oval-barril
  const gv=torno([[86,212,1],[99,232,1,1],[110,272,1,1],[115,322,1,1],[114,366,1,1],[107,404,1,1],[95,428,1,1],[86,436,1]],SG,1);const gVidro=junta([gv]);gVidro.scale(K,K,K);
  const mVidro=new THREE.MeshStandardMaterial({color:0x7b7b78,transparent:true,opacity:.11,roughness:.06,metalness:0,depthWrite:false,side:THREE.DoubleSide,emissive:0xff8a30,emissiveIntensity:0});
  // borda do vidro mais marcada (ângulo rasante), sem pós-processo
  mVidro.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <dithering_fragment>','float lzF=pow(1.-abs(dot(normalize(vNormal),normalize(vViewPosition))),2.2);gl_FragColor.a=min(1.,gl_FragColor.a*(1.+5.*lzF));\n#include <dithering_fragment>')};
  const vidro=new THREE.Mesh(gVidro,mVidro);vidro.name='Lanterna3D_Vidro';vidro.renderOrder=5;grupo.add(vidro);
  // 10) chama em gota: miolo claro e véu alaranjado, os dois aditivos; o pivô é o topo do pavio
  const y0=271*K,hC=2*(CHAMA_PX*K-y0); // a chama tem o centro em chamaY
  const gota=(r,h,sg)=>{const P=[];const n=T?6:5;for(let i=0;i<=n;i++){const q=i/n;const rr=r*Math.pow(Math.sin(Math.PI*Math.pow(q,.62)),1.15)*(1-.25*q);P.push(new THREE.Vector2(Math.max(0,rr),q*h))}return new THREE.LatheGeometry(P,sg)};
  const chama=new THREE.Group();chama.position.y=y0;chama.name='Lanterna3D_Chama';
  const mMiolo=new THREE.MeshBasicMaterial({color:new THREE.Color(1.9,1.25,.5),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  const mVeu=new THREE.MeshBasicMaterial({color:new THREE.Color(1,.42,.1),transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  const miolo=new THREE.Mesh(gota(13*K,hC*.82,6),mMiolo),veu=new THREE.Mesh(gota(21*K,hC,6),mVeu);miolo.renderOrder=6;veu.renderOrder=6;chama.add(veu,miolo);grupo.add(chama);chama.visible=false;
  const conta=g=>(g.index?g.index.count:g.attributes.position.count)/3;let tris=0;grupo.traverse(o=>{if(o.isMesh)tris+=conta(o.geometry)});
  for(const o of [corpo,pavio])o.castShadow=false;
  return {grupo,chamaY:CHAMA_PX*K,altura:710*K,alturaCorpo:654*K,raioBase:170*K,tris:Math.round(tris),luzPos:new THREE.Vector3(0,CHAMA_PX*K,0),materiais:{cobre:mCobre,vidro:mVidro},
    // acesa 0..1; fl: tremulação (≈0,7 a 1). t em segundos.
    atualiza(t,acesa=1,fl=1){const a=Math.max(0,Math.min(1,acesa)),b=a*fl;chama.visible=a>.02;
      if(chama.visible){const c=.35+.65*a,bal=Math.sin(t*9.3)*.05+Math.sin(t*17.1)*.03;chama.scale.set(.9+fl*.1,c*(.86+fl*.16),.9+fl*.1);chama.rotation.z=bal*(1.2-fl);chama.rotation.x=Math.sin(t*7.7+1)*.04*(1.2-fl);mMiolo.color.setRGB(1.9*b,1.25*b,.5*b);mVeu.opacity=.55*b}
      mVidro.emissiveIntensity=.34*b;mVidro.opacity=.11+.05*a;mCobre.emissiveIntensity=.07*b;pavio.material.emissiveIntensity=.9*b}};
}
