// A Luzeiro I, modelada a partir das três vistas de REVISTA/CAPA/Elementos/BARCO.jpg.
// As tabelas são medidas na vista de bombordo, em pixels da imagem: x cresce da proa (54) para a popa (843) e y cresce para baixo.
// Unidade do modelo: metro. Proa em +z, bombordo em +x, boreste em -x, linha d'água em y = 0.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const M=15/789,X0=449,YW=738;
export const ZP=px=>(X0-px)*M,YP=py=>(YW-py)*M,PX=z=>X0-z/M;
const sst=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
function curva(T){return x=>{const n=T.length;if(x<=T[0][0])return T[0][1];if(x>=T[n-1][0])return T[n-1][1];let i=0;while(x>T[i+1][0])i++;const a=T[Math.max(0,i-1)],b=T[i],c=T[i+1],d=T[Math.min(n-1,i+2)],h=c[0]-b[0],t=(x-b[0])/h,d1=(c[1]-a[1])/(c[0]-a[0])*h,d2=(d[1]-b[1])/(d[0]-b[0])*h,t2=t*t,t3=t2*t;return (2*t3-3*t2+1)*b[1]+(t3-2*t2+t)*d1+(3*t2-2*t3)*c[1]+(t3-t2)*d2}}
// topo da borda escura (borda do casco)
const G=curva([[56,600],[70,604],[90,610],[125,622],[160,630],[195,636],[230,642],[265,650],[300,664],[335,666],[370,666],[440,666],[510,665],[580,664],[650,661],[720,661],[790,661],[843,660]]);
// onde o branco do casco começa, abaixo da faixa preta
const H=curva([[56,612],[70,622],[90,628],[125,638],[160,646],[195,653],[230,658],[265,668],[300,686],[335,688],[370,687],[440,686],[510,684],[580,681],[650,679],[720,679],[790,679],[843,678]]);
// onde o azul-marinho do fundo começa
const N=curva([[56,684],[90,694],[125,704],[160,713],[195,722],[230,727],[265,730],[300,732],[335,733],[370,734],[440,735],[510,735],[545,735],[580,734],[615,733],[650,733],[685,732],[720,731],[755,730],[790,729],[825,728],[843,727]]);
// quilha e perfil da roda de proa
const K=curva([[56,606],[66,640],[75,668],[82,690],[95,730],[125,747],[160,748],[195,749],[265,750],[335,752],[405,754],[475,755],[545,754],[615,752],[685,749],[755,744],[825,736],[843,733]]);
// meia-boca em metros (vista de frente: 141 px)
const B=curva([[56,.05],[70,.42],[90,.95],[120,1.45],[170,2.02],[230,2.42],[300,2.6],[400,2.68],[560,2.68],[700,2.6],[790,2.45],[843,2.26]]);
// bochecha da seção: em V na proa, cheia no meio e na popa
const FORMA=curva([[56,1.05],[100,1.18],[170,1.5],[300,2.3],[560,2.7],[843,3.2]]);
// verdugo preto em relevo
const S=curva([[215,696],[230,699.5],[265,703.5],[300,706.5],[335,708.5],[370,709.5],[440,709.5],[510,707.5],[580,705.5],[650,704.5],[720,703],[790,699.5],[825,697.5],[843,696]]);
const yTopo=x=>YP(G(x)),yQuilha=x=>YP(K(x))-.6*sst(100,135,x);
const xCasco=(x,u)=>B(x)*(1-Math.pow(u,FORMA(x)));
const yCasco=(x,u)=>{const a=yTopo(x),b=yQuilha(x);return a+(b-a)*u};
const uEmY=(x,y)=>{const a=yTopo(x),b=yQuilha(x);return (a-y)/(a-b)};

// Cabine em planta
const Y_PISO=1,Y_BEIRAL=YP(580),Y_CONVES=YP(668),XC=2.09,ZA=ZP(799),ZC=ZP(235),ZD=ZP(212),XD=.57;
export const CABINE={piso:Y_PISO,beiral:Y_BEIRAL,XC,ZA,ZC,ZD,XD,olho:new THREE.Vector3(0,2.45,2.32)};
const largCabine=z=>z<=ZC?XC:z>=ZD?0:XC+(XD-XC)*(z-ZC)/(ZD-ZC);

function ruidoCanvas(x,W,H,n,cor,a0,a1,w0,w1,h0,h1){for(let i=0;i<n;i++){x.fillStyle=`rgba(${cor},${a0+Math.random()*(a1-a0)})`;x.fillRect(Math.random()*W,Math.random()*H,w0+Math.random()*(w1-w0),h0+Math.random()*(h1-h0))}}
// Pintura do casco em coordenadas da própria foto: x de 40 a 860, y de 590 a 770.
function pinturaCasco(lado,T){
  const W=T>=1?2048:1024,HH=T>=1?512:256,c=document.createElement('canvas');c.width=W;c.height=HH;const x=c.getContext('2d');
  const PXX=q=>(q-40)/820*W,PY=q=>(q-590)/180*HH,LX=W/820,LY=HH/180;
  const g=x.createLinearGradient(0,PY(650),0,PY(740));g.addColorStop(0,'#e9e6dc');g.addColorStop(.6,'#dcd8cb');g.addColorStop(1,'#cfcbbc');x.fillStyle=g;x.fillRect(0,0,W,HH);
  // tábuas do costado e a sujeira que escorre
  x.strokeStyle='rgba(70,62,48,.16)';x.lineWidth=1.4;for(let k=0;k<7;k++){x.beginPath();for(let q=56;q<=843;q+=9){const f=k/6,py=H(q)+(N(q)-H(q))*f;q===56?x.moveTo(PXX(q),PY(py)):x.lineTo(PXX(q),PY(py))}x.stroke()}
  ruidoCanvas(x,W,HH,180,'86,74,56',.01,.05,40*LX,230*LX,1,7*LY);
  for(let i=0;i<70;i++){const q=56+Math.random()*787,t=H(q);x.fillStyle=`rgba(78,66,50,${.03+Math.random()*.08})`;x.fillRect(PXX(q),PY(t),(1+Math.random()*2.4)*LX,(8+Math.random()*24)*LY)}
  // fundo azul-marinho
  x.fillStyle='#10203e';x.beginPath();x.moveTo(PXX(40),HH);for(let q=40;q<=860;q+=6)x.lineTo(PXX(q),PY(N(q)));x.lineTo(PXX(860),HH);x.closePath();x.fill();
  ruidoCanvas(x,W,HH,90,'6,12,26',.1,.3,30*LX,120*LX,1,3*LY);
  // faixa preta da borda
  x.fillStyle='#14161a';x.beginPath();x.moveTo(PXX(40),0);for(let q=40;q<=860;q+=6)x.lineTo(PXX(q),PY(H(q)));x.lineTo(PXX(860),0);x.closePath();x.fill();
  // verdugo pintado sob o relevo
  x.strokeStyle='#14161a';x.lineWidth=4.4*LY;x.lineCap='round';x.beginPath();for(let q=216;q<=843;q+=6){const py=S(q);q===216?x.moveTo(PXX(q),PY(py)):x.lineTo(PXX(q),PY(py))}x.stroke();
  // nome e matrícula, nas posições da foto
  const COR='#5e4a2c';
  const nome=(cx,cy,an,tam,txt,esp)=>{x.save();x.translate(PXX(cx),PY(cy));if(lado<0)x.scale(-1,1);x.rotate(lado>0?an:-an);x.scale(LX,LY);x.fillStyle=COR;x.font=`700 ${tam}px Georgia,"Times New Roman",serif`;x.textAlign='center';x.textBaseline='middle';if(x.letterSpacing!==undefined)x.letterSpacing=esp+'px';x.fillText(txt,0,0);x.restore()};
  nome(130,657,.2,18.5,'LUZEIRO I',.6);
  nome(74,650,1.42,10,'N 20',.8);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;
}
function tabua(cor,linhas,vert,sujeira=.035){
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=cor;x.fillRect(0,0,512,512);
  for(let i=0;i<260;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*sujeira})`;x.fillRect(Math.random()*512,Math.random()*512,vert?3+Math.random()*30:20+Math.random()*90,vert?20+Math.random()*90:3+Math.random()*30)}
  for(let i=0;i<linhas;i++){const p=i*512/linhas;x.strokeStyle='rgba(16,16,14,.42)';x.lineWidth=2;x.beginPath();if(vert){x.moveTo(p,0);x.lineTo(p,512)}else{x.moveTo(0,p);x.lineTo(512,p)}x.stroke();x.strokeStyle='rgba(255,255,255,.1)';x.lineWidth=1.2;x.beginPath();if(vert){x.moveTo(p+2,0);x.lineTo(p+2,512)}else{x.moveTo(0,p+2);x.lineTo(512,p+2)}x.stroke()}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
function casco(lado,mat){
  const NT=128,NU=20,pos=[],uv=[],idx=[];
  for(let i=0;i<=NT;i++){const q=843-(843-56)*(i/NT),z=ZP(q);
    for(let j=0;j<=NU;j++){const u=j/NU,X=xCasco(q,u)*lado,Y=yCasco(q,u);pos.push(X,Y,z);uv.push((q-40)/820,1-(YW-Y/M-590)/180)}}
  for(let i=0;i<NT;i++)for(let j=0;j<NU;j++){const a=i*(NU+1)+j,b=a+1,c=a+NU+1,d=c+1;lado>0?idx.push(a,c,b,b,c,d):idx.push(a,b,c,b,d,c)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return new THREE.Mesh(g,mat);
}
const ponta=(a,b,r,seg=7,r2)=>{const A=new THREE.Vector3(...a),Bq=new THREE.Vector3(...b),d=Bq.clone().sub(A),g=new THREE.CylinderGeometry(r2===undefined?r:r2,r,d.length(),seg,1,false);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()));g.translate(...A.clone().add(Bq).multiplyScalar(.5).toArray());return g.toNonIndexed()};
const caixa=(w,h,d,x,y,z)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);return g.toNonIndexed()};
const tuboPts=(pts,r,seg,lados=8)=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),false,'centripetal'),seg,r,lados,false).toNonIndexed();
// Parede com vãos reais; (a,b) em planta (x,z), de y0 a y1. Vãos: [s0,s1,h0,h1] em metros ao longo da parede.
function parede(a,b,y0,y1,vaos,reforco=.06,fora=true){
  const dx=b[0]-a[0],dz=b[1]-a[1],C=Math.hypot(dx,dz),nix=dz/C,niz=-dx/C,sn=fora?-1:1,nx=nix*sn,nz=niz*sn,Gq=[],F=[];
  const p=(s,y)=>[a[0]+dx*s/C,y,a[1]+dz*s/C];
  const ret=(s0,s1,h0,h1)=>{if(s1-s0<.001||h1-h0<.001)return;const A=p(s0,h0),Bq=p(s1,h0),CC=p(s1,h1),D=p(s0,h1),v=fora?[...A,...Bq,...CC,...A,...CC,...D]:[...A,...CC,...Bq,...A,...D,...CC],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('uv',new THREE.Float32BufferAttribute((fora?[s0,h0,s1,h0,s1,h1,s0,h0,s1,h1,s0,h1]:[s0,h0,s1,h1,s1,h0,s0,h0,s0,h1,s1,h1]).map(q=>q*.3),2));const n=[];for(let i=0;i<6;i++)n.push(nx,0,nz);g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));Gq.push(g)};
  const v=[...vaos].sort((m,n)=>m[0]-n[0]);let cur=0;
  for(const [s0,s1,h0,h1] of v){ret(cur,s0,y0,y1);ret(s0,s1,y0,h0);ret(s0,s1,h1,y1);cur=s1;
    const q=(u0,v0,u1,v1)=>{const A=p(u0,v0),Bq=p(u1,v1);A[0]+=nx*reforco*.3;A[2]+=nz*reforco*.3;Bq[0]+=nx*reforco*.3;Bq[2]+=nz*reforco*.3;F.push(ponta(A,Bq,reforco,4))};
    if(reforco>.01){q(s0,h0,s1,h0);q(s0,h1,s1,h1);q(s0,h0,s0,h1);q(s1,h0,s1,h1)}}
  ret(cur,C,y0,y1);return {G:Gq,F};
}
// Prisma afilado, como os dois mastros vistos de lado: chapa estreita em x.
function mastro(zB0,zB1,yB,zT0,zT1,yT,xB,xT){
  const v=[[-xB,yB,zB0],[xB,yB,zB0],[xB,yB,zB1],[-xB,yB,zB1],[-xT,yT,zT0],[xT,yT,zT0],[xT,yT,zT1],[-xT,yT,zT1]],idx=[0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7,4,5,6,4,6,7],pos=[];
  for(const i of idx)pos.push(...v[i]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;
}

export function criaBarco(T=2){
  const g=new THREE.Group(),ext=new THREE.Group(),int=new THREE.Group(),ctn=T>=1?128:64;g.add(ext,int);
  const bor=new THREE.MeshStandardMaterial({map:pinturaCasco(1,T),roughness:.58}),bre=new THREE.MeshStandardMaterial({map:pinturaCasco(-1,T),roughness:.58});
  ext.add(casco(1,bor),casco(-1,bre));
  const preto=new THREE.MeshStandardMaterial({color:0x121417,roughness:.5}),branco=new THREE.MeshStandardMaterial({color:0xe0e2dc,roughness:.5}),mastroM=new THREE.MeshStandardMaterial({color:0xcfd7da,roughness:.55}),cabo=new THREE.MeshStandardMaterial({color:0x3d8ab3,roughness:.75}),corda=new THREE.MeshStandardMaterial({color:0x2c6fb3,roughness:.8}),ferr=new THREE.MeshStandardMaterial({color:0x5a3a24,roughness:.7,metalness:.4}),latao=new THREE.MeshStandardMaterial({color:0xa98a4a,roughness:.4,metalness:.8}),marinho=new THREE.MeshStandardMaterial({color:0x10203e,roughness:.6}),verdeBase=new THREE.MeshStandardMaterial({color:0x8ea39d,roughness:.7});
  const parE=new THREE.MeshStandardMaterial({map:tabua('#c8d1d5',24,true),roughness:.62}),parF=new THREE.MeshStandardMaterial({color:0xeeeee8,roughness:.55}),parI=new THREE.MeshStandardMaterial({map:tabua('#7b6f5e',20,true,.05),roughness:.8}),conves=new THREE.MeshStandardMaterial({map:tabua('#26282a',14,false,.07),roughness:.74}),teto=new THREE.MeshStandardMaterial({map:tabua('#59636a',7,false,.06),roughness:.82,side:THREE.DoubleSide}),piso=new THREE.MeshStandardMaterial({map:tabua('#5a4330',12,false,.06),roughness:.78}),forro=new THREE.MeshStandardMaterial({map:tabua('#8c8476',16,false,.05),roughness:.85});
  const L={preto:[],branco:[],mastroM:[],cabo:[],corda:[],ferr:[],latao:[],parE:[],parF:[],parI:[],conves:[],teto:[],piso:[],forro:[],marinho:[],verdeBase:[]},MAT={preto,branco,mastroM,cabo,corda,ferr,latao,parE,parF,parI,conves,teto,piso,forro,marinho,verdeBase};

  // ---------- Convés ----------
  // faixas do casco até a parede da cabine; adiante da cabine, até o eixo. A popa sobe como na foto.
  {const pos=[],uv=[],NT=120,NL=5;
    const yConves=(q,x)=>{const z=ZP(q),b=B(q),cam=.14*(1-Math.pow(Math.abs(x)/Math.max(b,.05),2));if(z<ZA){const t=sst(ZA,ZP(843),z);return YP(650)*(1-t)+YP(675)*t+cam*.4}return yTopo(q)-.05+(z>ZC?cam:0)};
    for(const s of[-1,1])for(let i=0;i<NT;i++){const q0=843-(843-58)*(i/NT),q1=843-(843-58)*((i+1)/NT),z0=ZP(q0),z1=ZP(q1);
      for(let j=0;j<NL;j++){const a=j/NL,b2=(j+1)/NL,xi0=largCabine(z0)*(z0>=ZA?1:0),xi1=largCabine(z1)*(z1>=ZA?1:0),b0=B(q0)*.985,b1=B(q1)*.985;
        const P=(q,z,xi,bq,k)=>{const x=xi+(bq-xi)*k;return [x*s,yConves(q,x),z]},A=P(q0,z0,xi0,b0,a),Bq=P(q0,z0,xi0,b0,b2),C=P(q1,z1,xi1,b1,a),D=P(q1,z1,xi1,b1,b2);
        s>0?pos.push(...A,...C,...Bq,...Bq,...C,...D):pos.push(...A,...Bq,...C,...Bq,...D,...C);
        for(const p of s>0?[A,C,Bq,Bq,C,D]:[A,Bq,C,Bq,D,C])uv.push(p[0]*.35,p[2]*.35)}}
    const d=new THREE.BufferGeometry();d.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));d.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));d.computeVertexNormals();L.conves.push(d)}
  // Borda: filete preto acompanhando o casco, verdugo em relevo e roda de proa branca
  for(const s of[-1,1]){const a=[],v=[];for(let q=843;q>=58;q-=8){a.push([B(q)*s,yTopo(q)+.015,ZP(q)])}L.preto.push(tuboPts(a,.075,ctn,7));
    for(let q=216;q<=843;q+=9){const y=YP(S(q));v.push([xCasco(q,uEmY(q,y))*s*1.012,y,ZP(q)])}
    const ra=tuboPts(v,.05,ctn,7);L.preto.push(ra)}
  // Espelho de popa fechado e pintado
  {const sh=new THREE.Shape(),q=843,NU=16;for(let j=0;j<=NU;j++){const u=j/NU;const X=xCasco(q,u),Y=yCasco(q,u);j?sh.lineTo(X,Y):sh.moveTo(X,Y)}for(let j=NU;j>=0;j--){const u=j/NU;sh.lineTo(-xCasco(q,u),yCasco(q,u))}
    const e=new THREE.ShapeGeometry(sh);e.translate(0,0,ZP(843));const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#dcd8cb';x.fillRect(0,0,256,256);
    const m=new THREE.Mesh(e,new THREE.MeshStandardMaterial({color:0xdcd8cb,roughness:.6,side:THREE.DoubleSide}));ext.add(m);
    const az=new THREE.Mesh(new THREE.PlaneGeometry(B(843)*2.02,1),new THREE.MeshStandardMaterial({color:0x10203e,side:THREE.DoubleSide,roughness:.7}));az.position.set(0,YP(N(843))-.5,ZP(843)-.012);ext.add(az);
    const fx=caixa(B(843)*2.06,.26,.05,0,YP(668),ZP(843)-.02);L.preto.push(fx);L.preto.push(ponta([0,YP(N(843)),ZP(843)-.04],[0,-.7,ZP(843)-.04],.04));
    L.ferr.push(caixa(.08,1,.62,0,-.3,ZP(843)-.3))}
  // Roda de proa: tábua branca da quilha até acima do convés, azul na parte de baixo
  {const pts=[];for(let q=56;q<=96;q+=2)pts.push([q,K(q)]);const pos=[],cor=[],idx=[],w=.09,fundo=.2;const branca=new THREE.Color(0xe6e4da),azul=new THREE.Color(0x10203e);
    const Pp=[[56,598],[56,606],...pts.slice(1)];for(let i=0;i<Pp.length;i++){const [q,py]=Pp[i],z=ZP(q)+.02,y=YP(py),c=py>712?azul:branca;for(const [xx,zz] of[[-w,0],[w,0],[w,-fundo],[-w,-fundo]]){pos.push(xx,y,z+zz);cor.push(c.r,c.g,c.b)}}
    for(let i=0;i<Pp.length-1;i++){const a=i*4,b=a+4;for(let k=0;k<4;k++){const k2=(k+1)%4;idx.push(a+k,b+k,a+k2,a+k2,b+k,b+k2)}}
    idx.push(0,1,2,0,2,3);const st=new THREE.BufferGeometry();st.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));st.setAttribute('color',new THREE.Float32BufferAttribute(cor,3));st.setIndex(idx);const sn=st.toNonIndexed();sn.computeVertexNormals();ext.add(new THREE.Mesh(sn,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,side:THREE.DoubleSide})))}
  // Mastro de proa: vara branca que nasce na roda, inclinada para a popa
  L.branco.push(ponta([0,YP(598),ZP(63)],[0,YP(540),ZP(80)],.042,8,.036));L.mastroM.push(ponta([0,YP(540),ZP(80)],[0,YP(472),ZP(100)],.036,8,.024));

  // ---------- Cabine ----------
  const P=[[-XC,ZA],[-XC,ZC],[-XD,ZD],[XD,ZD],[XC,ZC],[XC,ZA]],Y_VJ=YP(667),Y_VT=YP(587);
  const zs=(a,b)=>[ZP(b),ZP(a)]; // intervalo em z a partir de px
  const LF=Math.hypot(XC-XD,ZD-ZC);
  const paredes=[
    {a:P[0],b:P[1],m:L.parE,v:[[zs(265,415)[0]-ZA,zs(265,415)[1]-ZA,Y_VJ,Y_VT],[zs(636,708)[0]-ZA,zs(636,708)[1]-ZA,Y_VJ,Y_VT]]},
    {a:P[1],b:P[2],m:L.parF,v:[[(LF-.89)/2,(LF+.89)/2,1.74,2.77]]},
    {a:P[2],b:P[3],m:L.parF,v:[[.02,XD*2-.02,Y_CONVES,Y_BEIRAL-.06]]},
    {a:P[3],b:P[4],m:L.parF,v:[[(LF-.89)/2,(LF+.89)/2,1.74,2.77]]},
    {a:P[4],b:P[5],m:L.parE,v:[[ZC-ZP(271),ZC-ZP(421),Y_VJ,Y_VT],[ZC-ZP(558),ZC-ZP(596),YP(637),YP(586)],[ZC-ZP(635),ZC-ZP(706),Y_VJ,Y_VT]]},
    {a:P[5],b:P[0],m:L.parE,v:[[XC-.54,XC+.54,Y_CONVES,2.72]]}];
  for(const w of paredes){const r=parede(w.a,w.b,Y_PISO,Y_BEIRAL,w.v);w.m.push(...r.G);L.preto.push(...r.F);
    const C=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]),nx=(w.b[1]-w.a[1])/C,nz=-(w.b[0]-w.a[0])/C,E=.08,ri=parede([w.a[0]+nx*E,w.a[1]+nz*E],[w.b[0]+nx*E,w.b[1]+nz*E],Y_PISO+.01,Y_BEIRAL-.05,w.v,.001,false);L.parI.push(...ri.G);
    // espessura dos vãos: batentes pretos ligando parede externa e interna
    for(const [s0,s1,h0,h1] of w.v){const dx=(w.b[0]-w.a[0])/C,dz=(w.b[1]-w.a[1])/C,cx=s=>[w.a[0]+dx*s,w.a[1]+dz*s];for(const s of[s0,s1]){const c=cx(s);L.preto.push(ponta([c[0]+nx*E*.5,h0,c[1]+nz*E*.5],[c[0]+nx*E*.5,h1,c[1]+nz*E*.5],E*.72,4))}const c0=cx(s0),c1=cx(s1);for(const h of[h0,h1])L.preto.push(ponta([c0[0]+nx*E*.5,h,c0[1]+nz*E*.5],[c1[0]+nx*E*.5,h,c1[1]+nz*E*.5],E*.72,4))}}
  // Montantes pretos dos janelões laterais
  L.preto.push(ponta([XC+.02,Y_VJ,ZP(345)],[XC+.02,Y_VT,ZP(345)],.075,4),ponta([-XC-.02,Y_VJ,ZP(340)],[-XC-.02,Y_VT,ZP(340)],.075,4));
  // Vara cromada da janelinha de bombordo e corrimão preto de boreste, como nas vistas
  L.latao.push(ponta([XC+.03,YP(632),ZP(585)],[XC+.03,YP(592),ZP(585)],.015,6));
  L.preto.push(ponta([-XC-.06,YP(577),ZP(348)],[-XC-.06,YP(577),ZP(498)],.024,6));
  // Base esverdeada da frente, batente branco da porta e caixilho branco das janelas
  for(const [a,b] of[[P[1],P[2]],[P[3],P[4]]]){const dx=b[0]-a[0],dz=b[1]-a[1],C=Math.hypot(dx,dz),nx=-dz/C,nz=dx/C,ca=[(a[0]+b[0])/2+nx*.02,(a[1]+b[1])/2+nz*.02],bx=new THREE.BoxGeometry(C,.3,.03);bx.rotateY(-Math.atan2(dz,dx));bx.translate(ca[0],Y_CONVES+.14,ca[1]);L.verdeBase.push(bx.toNonIndexed());
    const n=(LF-.89)/2,u=[dx/C,dz/C],P2=s=>[a[0]+u[0]*s+nx*.03,a[1]+u[1]*s+nz*.03];for(const s of[n+.06,LF-n-.06]){const c=P2(s);L.branco.push(ponta([c[0],1.8,c[1]],[c[0],2.71,c[1]],.022,4))}const c0=P2(n+.06),c1=P2(LF-n-.06);for(const y of[1.8,2.71])L.branco.push(ponta([c0[0],y,c0[1]],[c1[0],y,c1[1]],.022,4))}
  for(const x of[-XD-.01,XD+.01])L.marinho.push(caixa(.07,Y_BEIRAL-Y_CONVES,.05,x,(Y_BEIRAL+Y_CONVES)/2,ZD+.02));
  L.branco.push(caixa(XD*2+.04,.1,.05,0,Y_BEIRAL-.1,ZD+.03));
  for(const x of[-XD+.05,XD-.05])L.branco.push(caixa(.05,Y_BEIRAL-Y_CONVES-.1,.05,x,(Y_BEIRAL+Y_CONVES)/2-.05,ZD+.03));
  // Soleira escura em volta da cabine
  for(const [a,b] of[[P[0],P[1]],[P[4],P[5]],[P[5],P[0]]]){const dx=b[0]-a[0],dz=b[1]-a[1],C=Math.hypot(dx,dz),bx=new THREE.BoxGeometry(C,.15,.12);bx.rotateY(-Math.atan2(dz,dx));bx.translate((a[0]+b[0])/2,YP(668)+.02,(a[1]+b[1])/2);L.preto.push(bx.toNonIndexed())}
  // Piso e forro internos
  {const fl=new THREE.Shape(P.map(p=>new THREE.Vector2(p[0],p[1])));const f=new THREE.ShapeGeometry(fl);f.rotateX(Math.PI/2);f.translate(0,Y_PISO+.02,0);const uvf=f.attributes.uv;for(let i=0;i<uvf.count;i++)uvf.setXY(i,uvf.getX(i)*.4,uvf.getY(i)*.4);L.piso.push(f.toNonIndexed());
    const fo=f.clone();fo.translate(0,Y_BEIRAL-Y_PISO-.07,0);fo.scale(1,1,1);const tr=fo.toNonIndexed(),p=tr.attributes.position;for(let i=0;i<p.count;i+=3){const ax=p.getX(i+1),ay=p.getY(i+1),az=p.getZ(i+1);p.setXYZ(i+1,p.getX(i+2),p.getY(i+2),p.getZ(i+2));p.setXYZ(i+2,ax,ay,az)}tr.computeVertexNormals();L.forro.push(tr)}
  // Teto de lona: abaulado, com beiral preto; a abóbada diminui na frente, como na vista frontal
  const O=.09,CROWN=YP(557)-Y_BEIRAL,yTeto=(x,z)=>{const w=Math.max(largCabine(Math.min(z,ZD-.02))+O,.2),k=Math.min(1,Math.abs(x)/w),f=1-.78*sst(2.6,ZD,z);return Y_BEIRAL+.01+CROWN*f*(1-k*k)};
  {const NZ=44,NX=18,pos=[],uv=[],z0=ZA-O,z1=ZD+O;for(let i=0;i<NZ;i++){const za=z0+(z1-z0)*i/NZ,zb=z0+(z1-z0)*(i+1)/NZ,wa=(za>=ZD?XD:largCabine(za))+O,wb=(zb>=ZD?XD:largCabine(zb))+O;for(let j=0;j<NX;j++){const a=-1+2*j/NX,b=-1+2*(j+1)/NX,A=[a*wa,yTeto(a*wa,za),za],Bq=[b*wa,yTeto(b*wa,za),za],C=[a*wb,yTeto(a*wb,zb),zb],D=[b*wb,yTeto(b*wb,zb),zb];pos.push(...A,...C,...Bq,...Bq,...C,...D);for(const p of[A,C,Bq,Bq,C,D])uv.push(p[0]*.3+.5,p[2]*.3)}}
    const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));r.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));r.computeVertexNormals();L.teto.push(r);
    const b0=[[-XC-O,z0],[-XC-O,ZC+.02],[-XD-O,z1],[XD+O,z1],[XC+O,ZC+.02],[XC+O,z0],[-XC-O,z0]];for(let i=0;i<b0.length-1;i++)L.preto.push(ponta([b0[i][0],Y_BEIRAL,b0[i][1]],[b0[i+1][0],Y_BEIRAL,b0[i+1][1]],.05,5))}
  // ---------- Mastros, cabos azuis e equipamentos ----------
  const yT=(x,z)=>yTeto(x,z);
  L.mastroM.push(mastro(ZP(380),ZP(352),YP(558),ZP(393),ZP(386),YP(436),.09,.045),caixa(.42,.05,.72,0,yT(0,ZP(366))+.015,ZP(366)));
  L.mastroM.push(mastro(ZP(757),ZP(740),YP(562),ZP(769),ZP(764),YP(484),.075,.04),caixa(.34,.05,.5,0,yT(0,ZP(749))+.01,ZP(749)));
  {const b=new THREE.SphereGeometry(.075,12,10);b.translate(0,YP(436)+.03,ZP(390));L.mastroM.push(b.toNonIndexed());const c=new THREE.SphereGeometry(.05,10,8);c.translate(0,YP(484)+.03,ZP(766));L.mastroM.push(c.toNonIndexed())}
  const MT=[0,YP(438),ZP(390)],M2=[0,YP(466),ZP(392)],ST=[0,YP(485),ZP(766)];
  for(const s of[-1,1]){for(const q of[335,370,407])L.cabo.push(ponta(MT,[s*(XC+.06),Y_BEIRAL+.02,ZP(q)],.019,5));L.cabo.push(ponta(ST,[s*(XC+.05),Y_BEIRAL+.02,ZP(795)],.016,5))}
  L.cabo.push(ponta(MT,ST,.018,5),ponta(M2,ST,.018,5));
  // Bandeirola no mastro de popa
  {const b=new THREE.BufferGeometry(),y0=YP(486),y1=YP(530),z=ZP(772);const c=[[.1,.1,.11],[.62,.08,.08],[.9,.88,.84]];const pos=[],cor=[];for(let i=0;i<3;i++){const ya=y0+(y1-y0)*i/3,yb=y0+(y1-y0)*(i+1)/3,l=.24;pos.push(0,ya,z,0,yb,z,0,yb,z-l,0,ya,z,0,yb,z-l,0,ya,z-l);for(let k=0;k<6;k++)cor.push(...c[i])}b.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));b.setAttribute('color',new THREE.Float32BufferAttribute(cor,3));b.computeVertexNormals();ext.add(new THREE.Mesh(b,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.8})))}
  // Holofote de bombordo, com lente voltada para a frente
  {const xs=.82,zh=ZP(255),y0=yT(xs,zh),yL=YP(539);L.preto.push(ponta([xs,y0,zh],[xs,yL-.06,zh],.032,7),caixa(.26,.03,.2,xs,y0+.01,zh));const c=new THREE.CylinderGeometry(.115,.095,.27,14);c.rotateX(Math.PI/2);c.translate(xs,yL,zh);L.preto.push(c.toNonIndexed());const lente=new THREE.CircleGeometry(.1,18);lente.translate(xs,yL,zh+.138);L.branco.push(lente.toNonIndexed())}
  // Grade branca sobre o teto, adiante do mastro
  {const z0=ZP(345),z1=ZP(272),h=YP(551);for(const s of[-1,1]){L.branco.push(ponta([s*.74,h,z0],[s*.74,h,z1],.028,6));for(const z of[z0+.1,(z0+z1)/2,z1-.08])L.branco.push(ponta([s*.74,yT(s*.74,z),z],[s*.74,h,z],.02,5))}L.branco.push(ponta([-.74,h,z1],[.74,h,z1],.028,6),caixa(.9,.05,.5,.1,h-.02,z0+.32))}
  // Dois respiros nos cantos da frente do teto
  for(const s of[-1,1]){const x=s*1.78,z=ZC-.04,y=yT(x,z);L.branco.push(caixa(.31,.25,.2,x,y+.1,z));L.preto.push(caixa(.21,.15,.03,x,y+.1,z+.1))}
  // Chaminé em L, de boreste
  {const x=-.47,z=ZP(627),y=yT(x,z);L.ferr.push(caixa(.42,.03,.2,x,y+.01,z),ponta([x,y,z],[x,YP(544),z],.052,9),ponta([x,YP(544),z],[x,YP(534),ZP(639)],.052,9))}
  // Rolo de corda azul no convés de proa e cunhos brancos
  {const q=150,z=ZP(q),y=yTopo(q)+.08;for(let i=0;i<5;i++){const r=.33-.018*i,t=new THREE.TorusGeometry(r,.038,6,22);t.rotateX(Math.PI/2);t.translate((i%2)*.03-.02,y+i*.05,z+(i%3)*.018);L.corda.push(t.toNonIndexed())}
    for(const s of[-1,1]){const q2=125,x=s*.72;L.branco.push(caixa(.3,.04,.07,x,yTopo(q2)+.09,ZP(q2)))}}
  for(const k in L){if(!L[k].length)continue;const gs=L[k].map(q=>{const n=new THREE.BufferGeometry(),bq=q.index?q.toNonIndexed():q;n.setAttribute('position',bq.attributes.position);if(!bq.attributes.normal)bq.computeVertexNormals();n.setAttribute('normal',bq.attributes.normal);n.setAttribute('uv',bq.attributes.uv||new THREE.BufferAttribute(new Float32Array(bq.attributes.position.count*2),2));return n});const m=new THREE.Mesh(mergeGeometries(gs,false),MAT[k]);if(k==='parE'||k==='parF'||k==='parI'||k==='piso'||k==='forro'||k==='conves')m.material.side=THREE.DoubleSide;(k==='parI'||k==='piso'||k==='forro'?int:ext).add(m)}
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=T>=2}});
  g.userData.interior=[parI,piso,forro];g.userData.ext=ext;g.userData.int=int;
  return g;
}
