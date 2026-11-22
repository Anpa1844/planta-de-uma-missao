// Explorar a Luzeiro I · rodada 3: RAIO-X sincronizado com a fala e modo PROJETO DE ENGENHARIA NAVAL (prancha técnica).
// (1) Cada frase de audio/bm_*.json é lida; palavras-chave ("quilha", "cavernas", "tabuado", "motor"...) viram instantes (posição da palavra
//     dentro da frase × duração real da frase) e cada instante acende as partes do barco correspondentes: o casco fica fantasma, a parte
//     citada brilha (cor, contorno, pulso) com rótulo curto, e a câmera enquadra devagar. As outras partes do esqueleto ficam apagadas.
// (2) Projeto naval: fundo de planta azul, esqueleto em linhas (EdgesGeometry), linhas d'água, planos de balizas, cotas com setas,
//     escala gráfica, carimbo com a ressalva; a câmera alterna perspectiva ↔ perfil ↔ planta ↔ seção na baliza mestra, interpolando a
//     lente (36° → 2,5°, "quase ortográfica") com a distância, sem corte. No capítulo "Como foi construída" as linhas são desenhadas aos
//     poucos, pelos mesmos planos de corte da montagem (que agora andam no ritmo da fala).
// Tudo é ILUSTRATIVO: a estrutura é reconstituição, não plano histórico (dito na prancha e no aviso).
import * as THREE from 'three';

// ---------- partes do barco: nome curto, nós do esqueleto (SK_*) e do barco (LZ_*), vista preferida (azimute, elevação) ----------
export const PARTES={
 quilha:{r:'Quilha · pau-d\'arco',esq:/^SK_(Quilha|Sobrequilha)/,az:-1.75,el:.12},
 roda:{r:'Roda de proa',esq:/^SK_(Roda_Proa|Contra_Roda)/,az:-.75,el:.18},
 cadaste:{r:'Cadaste',esq:/^SK_Cadaste/,barco:/^LZ_Rudder/,az:-2.5,el:.18},
 cavernas:{r:'Cavernas · piquiá',esq:/^SK_Cavernas/,az:-2.3,el:.42},
 piso:{r:'Vigas do piso',esq:/^SK_Travessas_Piso/,az:-2.2,el:.62},
 vaus:{r:'Vaus do convés',esq:/^SK_Vaus_Conv/,az:-2.0,el:.6},
 sinta:{r:'Sinta (longarina)',esq:/^SK_Sinta/,az:-1.9,el:.3},
 tabuado:{r:'Tabuado · itaúba',esq:/^SK_(Tabuado|Espelho_Tabuas)/,az:-1.75,el:.2},
 conves:{r:'Convés',esq:/^SK_Conves_Tabuas/,az:-2.1,el:.7},
 cabine:{r:'Cabine',esq:/^SK_Cabine_/,az:-2.2,el:.35},
 teto:{r:'Teto da cabine',esq:/^SK_Teto_/,az:-2.2,el:.75},
 motor:{r:'Motor diesel 20 hp',esq:/^SK_Berco_Motor/,barco:/^LZ40_Engine_Buda/,az:-2.0,el:.55},
 tambores:{r:'Tambores de combustível',barco:/^LZ40_Fuel_Drums/,az:-2.1,el:.5},
 mastro:{r:'Mastro',esq:/^SK_Degrau_Mastro/,barco:/^LZ_Masts/,az:-1.8,el:.3},
 leme:{r:'Leme e hélice',esq:/^SK_Cadaste/,barco:/^LZ_(Rudder|Propeller)/,az:-2.7,el:.1},
 cedro:{r:'Acabamento de cedro',barco:/^LZ_Int_Lambri/,az:-2.2,el:.35}};
// frase → partes: expressões procuradas no texto real da fala (sem acento, minúsculas). A mais longa vence quando se sobrepõem.
const CHAVES=[
 [/roda de proa/,['roda']],[/quilha|espinha/,['quilha']],[/caverna|costela/,['cavernas']],[/vigas do piso/,['piso']],[/as do conves|vaus/,['vaus']],
 [/tabuado|tabua por tabua/,['tabuado']],[/a cabine|da cabine|cabine/,['cabine']],[/o teto|teto/,['teto']],[/conves/,['conves']],[/acabamento|cedro/,['cedro']],
 [/motor|casa de maquinas/,['motor']],[/tambor|combustivel|galoes de oleo/,['tambores']],[/dois v|o fundo/,['quilha','tabuado']],[/casco forte|casco baixo/,['tabuado']],
 [/estrutura que eu imaginei/,['quilha','cavernas']],[/seguram o piso/,['piso','vaus']],[/leme|helice|eixo/,['leme']],[/mastro/,['mastro']],[/na proa/,['roda']]];
const tira=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
// instantes [t, partes] de um capítulo, a partir das frases com tempo real (tj: [{t,texto}], fim: duração total)
export function marcas(tj,fim){const R=[];if(!tj||!tj.length)return R;
 tj.forEach((f,k)=>{const tx=tira(f.texto),d=(k<tj.length-1?tj[k+1].t:fim||f.t+4)-f.t,ach=[];
  for(const [re,ps] of CHAVES){const g=new RegExp(re.source,'g');let m;while((m=g.exec(tx)))ach.push({i:m.index,f:m.index+m[0].length,ps})}
  ach.sort((a,b)=>a.i-b.i||(b.f-b.i)-(a.f-a.i));let fimU=-1;for(const a of ach){if(a.i<fimU)continue;fimU=a.f;R.push([Math.max(0,f.t+(a.i/Math.max(1,tx.length))*d*.92-.35),a.ps,f.t+d])}});
 return R}

export function criaProjeto(X){ // X: {cena,cam,oc,r,barco,esq,grupos,voa,nm,$}
 const {cena,cam,oc,barco,esq,grupos,nm}=X,$=id=>document.getElementById(id);
 // nós por parte
 const malhas={};for(const k in PARTES){const P=PARTES[k],L=[];if(P.esq)esq.traverse(o=>{if(o.isMesh&&P.esq.test(nm(o)))L.push(o)});if(P.barco)barco.traverse(o=>{if(o.isMesh&&P.barco.test(nm(o)))L.push(o)});malhas[k]=L}
 const faltam=Object.keys(PARTES).filter(k=>!malhas[k].length);
 const caixa=ks=>{const b=new THREE.Box3();for(const k of ks)for(const o of malhas[k])b.expandByObject(o);return b};
 // medidas do modelo (para as cotas)
 const bH=new THREE.Box3();barco.traverse(o=>{if(o.isMesh&&/^HERO_Luzeiro_Hull|^LZ_Keel_Stem/.test(nm(o)))bH.expandByObject(o)});if(bH.isEmpty())bH.setFromObject(barco);
 const bD=new THREE.Box3();barco.traverse(o=>{if(o.isMesh&&/^LZ_(Deck$|Rail_Cap)/.test(nm(o)))bD.expandByObject(o)});
 const yQ=bH.min.y,yConv=bD.isEmpty()?bH.max.y:bD.max.y,CAL=.8,yDWL=yQ+CAL,xMid=(bH.min.x+bH.max.x)/2;
 const MED={L:bH.max.x-bH.min.x,B:bH.max.z-bH.min.z,D:yConv-yQ,T:CAL};
 // ---------- realce do raio-X ----------
 const corA=new THREE.Color(0xffb347);const orig=new Map();const mats=o=>Array.isArray(o.material)?o.material:[o.material];
 const esqMs=[];esq.traverse(o=>{if(o.isMesh)for(const m of mats(o))esqMs.push(m)});
 const bordas={};const gBordas=new THREE.Group();gBordas.renderOrder=20;cena.add(gBordas);
 const mBorda=new THREE.LineBasicMaterial({color:0xffe2a6,transparent:true,opacity:.9,depthTest:false});
 function bordaDe(k){if(bordas[k])return bordas[k];const g=new THREE.Group();for(const o of malhas[k]){o.updateWorldMatrix(true,false);const ls=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,32),mBorda);ls.matrixAutoUpdate=false;ls.matrix.copy(o.matrixWorld);ls.renderOrder=20;ls.userData.dono=o;g.add(ls)}gBordas.add(g);return bordas[k]=g}
 let esmaecido=false,ativos=[],ativosK='',rotEl=document.createElement('div');rotEl.className='rxRot';rotEl.hidden=true;$('eRotulos').append(rotEl);
 let usuarioMexeu=false;oc.addEventListener('start',()=>{usuarioMexeu=true});
 function realca(ks,enquadra){const key=ks.join(',');if(key===ativosK)return;ativosK=key;ativos=ks;
  for(const k in bordas)bordas[k].visible=ks.includes(k);for(const k of ks)if(malhas[k].length)bordaDe(k).visible=true;
  rotEl.textContent=ks.map(k=>PARTES[k].r).join(' · ');rotEl.hidden=!ks.length;document.body.classList.toggle('rxAtivo',ks.length>0);
  if(enquadra&&ks.length&&!usuarioMexeu){const b=caixa(ks);if(!b.isEmpty()){const c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3()),P=PARTES[ks[0]];
    const R=Math.max(s.x,s.y*1.6,s.z)*.62+.6,d=Math.min(17,Math.max(3.2,R/Math.tan(cam.fov*Math.PI/360)));
    X.voa(new THREE.Vector3(c.x+d*Math.cos(P.el)*Math.cos(P.az),c.y+d*Math.sin(P.el),c.z+d*Math.cos(P.el)*Math.sin(P.az)),c,2.6)}}}
 // aplica cores e transparência do realce (só quando o raio-X está ligado)
 const setTr=(m,t)=>{if(m.transparent!==t){m.transparent=t;m.needsUpdate=true}};
 function pintaRealce(t,on){const set=new Set();if(on)for(const k of ativos)for(const o of malhas[k])for(const m of mats(o))set.add(m);
  const pul=.55+.45*Math.sin(t*4.2);
  for(const k of Object.keys(malhas))for(const o of malhas[k])for(const m of mats(o)){if(!orig.has(m))orig.set(m,{e:m.emissive?m.emissive.clone():null,ei:m.emissiveIntensity})}
  for(const [m,o] of orig){if(!m.emissive)continue;if(set.has(m)){m.emissive.copy(corA);m.emissiveIntensity=.35+.55*pul}else{m.emissive.copy(o.e);m.emissiveIntensity=o.ei}}
  if(on&&ativos.length){esmaecido=true;for(const m of esqMs){const h=set.has(m);setTr(m,!h);m.opacity=h?1:.22;m.depthWrite=h}}
  else if(esmaecido){esmaecido=false;for(const m of esqMs){setTr(m,false);m.opacity=1;m.depthWrite=true}}
  mBorda.opacity=.45+.5*pul;
  if(!rotEl.hidden&&on){const b=caixa(ativos);const v=b.getCenter(new THREE.Vector3());v.y=b.max.y+.15;v.project(cam);const ok=v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1;rotEl.style.display=ok?'':'none';rotEl.style.left=((v.x*.5+.5)*innerWidth)+'px';rotEl.style.top=((-v.y*.5+.5)*innerHeight)+'px'}}
 function desligaRealce(){for(const k in bordas)bordas[k].visible=false;rotEl.hidden=true;document.body.classList.remove('rxAtivo');ativos=[];ativosK='';for(const [m,o] of orig)if(m.emissive){m.emissive.copy(o.e);m.emissiveIntensity=o.ei}}

 // ---------- prancha (modo projeto naval) ----------
 const prancha=new THREE.Group();prancha.visible=false;cena.add(prancha);
 const linhasEsq=[];let pranchaPronta=false;
 const mEsq=new THREE.LineBasicMaterial({color:0xf2f7ff,transparent:true,opacity:.92}),mCasco=new THREE.LineBasicMaterial({color:0x9fd0ff,transparent:true,opacity:.45}),
  mGuia=new THREE.LineBasicMaterial({color:0x7fb2e6,transparent:true,opacity:.42}),mCota=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.95}),mDWL=new THREE.LineBasicMaterial({color:0x8de0ff,transparent:true,opacity:.9});
 const slab=[new THREE.Plane(new THREE.Vector3(1,0,0),1e4),new THREE.Plane(new THREE.Vector3(-1,0,0),1e4)];
 function montaPrancha(){if(pranchaPronta)return;pranchaPronta=true;
  // esqueleto em linhas, cada uma com o plano de corte do seu grupo de montagem (desenho progressivo) e a fatia da seção
  esq.traverse(o=>{if(!o.isMesh)return;o.updateWorldMatrix(true,false);const g=grupos.find(g=>g.meshes.includes(o));const m=mEsq.clone();m.clippingPlanes=(g?[g.pl]:[]).concat(slab);
   const ls=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,28),m);ls.matrixAutoUpdate=false;ls.matrix.copy(o.matrixWorld);ls.userData.g=g;prancha.add(ls);linhasEsq.push(ls)});
  // casco, convés e cabine em linha fina azul (silhueta)
  barco.traverse(o=>{if(!o.isMesh||!/^(HERO_Luzeiro_Hull|LZ_Deck$|LZ_Cabin_Walls$|LZ_Cabin_Roof|LZ_Rudder|LZ_Propeller|LZ_Keel_Stem$)/.test(nm(o)))return;o.updateWorldMatrix(true,false);const m=mCasco.clone();m.clippingPlanes=slab;
   const ls=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,40),m);ls.matrixAutoUpdate=false;ls.matrix.copy(o.matrixWorld);prancha.add(ls)});
  const P=[],seg=(a,b)=>P.push(a.x,a.y,a.z,b.x,b.y,b.z),V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const x0=bH.min.x,x1=bH.max.x,z0=bH.min.z,z1=bH.max.z,m=.35;
  // linhas d'água (retângulos na altura de cada linha) e planos de balizas (retângulos em cada estação): no perfil e na planta viram as linhas da prancha
  for(let i=1;i<=4;i++){const y=yQ+(yConv-yQ)*i/5;seg(V(x0-m,y,z0-m),V(x1+m,y,z0-m));seg(V(x0-m,y,z1+m),V(x1+m,y,z1+m))}
  for(let i=0;i<=10;i++){const x=x0+(x1-x0)*i/10;seg(V(x,yQ-.2,z0-m),V(x,yConv+.3,z0-m));seg(V(x,yQ-.2,z1+m),V(x,yConv+.3,z1+m));seg(V(x,yConv+.3,z0-m),V(x,yConv+.3,z1+m))}
  const guia=new THREE.BufferGeometry();guia.setAttribute('position',new THREE.Float32BufferAttribute(P,3));prancha.add(new THREE.LineSegments(guia,mGuia));
  // linha d'água de projeto (calado ~0,8 m), mais forte
  const W=[];const w=(a,b)=>W.push(a.x,a.y,a.z,b.x,b.y,b.z);w(V(x0-1,yDWL,z0-m),V(x1+1,yDWL,z0-m));w(V(x0-1,yDWL,z1+m),V(x1+1,yDWL,z1+m));w(V(x0-1,yDWL,z0-m),V(x0-1,yDWL,z1+m));w(V(x1+1,yDWL,z0-m),V(x1+1,yDWL,z1+m));
  const gW=new THREE.BufferGeometry();gW.setAttribute('position',new THREE.Float32BufferAttribute(W,3));prancha.add(new THREE.LineSegments(gW,mDWL));
  // cotas com setas
  const C=[];const c=(a,b)=>C.push(a.x,a.y,a.z,b.x,b.y,b.z);
  const cota=(a,b,n,s=.18)=>{c(a,b);const d=b.clone().sub(a).normalize(),p=n.clone().normalize().multiplyScalar(s*.45);for(const [q,sg] of [[a,1],[b,-1]]){c(q,q.clone().addScaledVector(d,s*sg).add(p));c(q,q.clone().addScaledVector(d,s*sg).sub(p))}};
  const ext=(a,b)=>c(a,b);
  const yL=yQ-.75;cota(V(x0,yL,z0-m),V(x1,yL,z0-m),V(0,1,0),.3);ext(V(x0,yQ,z0-m),V(x0,yL-.15,z0-m));ext(V(x1,yQ+.6,z0-m),V(x1,yL-.15,z0-m));     // comprimento (perfil)
  const xB=x1+1.4;cota(V(xB,yConv+.3,z0),V(xB,yConv+.3,z1),V(1,0,0),.22);ext(V(x1,yConv+.3,z0),V(xB+.2,yConv+.3,z0));ext(V(x1,yConv+.3,z1),V(xB+.2,yConv+.3,z1)); // boca (planta e seção)
  const xP=x0-1.3;cota(V(xP,yQ,z0-m),V(xP,yConv,z0-m),V(1,0,0),.2);ext(V(x0+.4,yConv,z0-m),V(xP-.2,yConv,z0-m));ext(V(x0+1.2,yQ,z0-m),V(xP-.2,yQ,z0-m)); // pontal
  const xT=xP-.9;cota(V(xT,yQ,z0-m),V(xT,yDWL,z0-m),V(1,0,0),.14);                                                              // calado
  const gC=new THREE.BufferGeometry();gC.setAttribute('position',new THREE.Float32BufferAttribute(C,3));prancha.add(new THREE.LineSegments(gC,mCota));
  // rótulos das cotas (DOM), com as vistas em que fazem sentido
  const f=v=>v.toFixed(2).replace('.',',');
  COTAS.push([V((x0+x1)/2,yL,z0-m),'Comprimento ~'+f(MED.L)+' m (modelo) · fontes: 9,1 a 11 m',['persp','perfil']],
   [V(xB,yConv+.3,(z0+z1)/2),'Boca ~'+f(MED.B)+' m · fontes: 3 a 3,5 m',['planta','secao','persp']],
   [V(xP,(yQ+yConv)/2,z0-m),'Pontal ~'+f(MED.D)+' m',['perfil','persp']],
   [V(xT,yQ+CAL/2,z0-m),'Calado ~0,8 m · fontes: 0,76 a 0,85 m',['perfil']],
   [V(x1+1,yDWL,z0-m),'LA (linha d\'água de projeto)',['perfil','persp']],
   [V(xMid,yQ-.2,z0-m),'baliza mestra',['perfil','planta']]);
  for(const q of COTAS){const d=document.createElement('div');d.className='cota';d.textContent=q[1];$('eRotulos').append(d);q.push(d)}}
 const COTAS=[];
 // ---------- vistas da prancha e interpolação perspectiva ↔ "ortográfica" ----------
 const alvo0=new THREE.Vector3(xMid,(yQ+yConv)/2+.3,(bH.min.z+bH.max.z)/2),RV=Math.max(MED.L*.62,4);
 const Y=new THREE.Vector3(0,1,0);
 const VISTAS={persp:{dir:new THREE.Vector3(.55,.42,.72),up:Y,fov:36,R:RV*1.05,nome:'PERSPECTIVA'},perfil:{dir:new THREE.Vector3(0,0,1),up:Y,fov:2.5,R:RV*.92,nome:'PERFIL (vista lateral, proa à direita)'},
  planta:{dir:new THREE.Vector3(0,1,.0001),up:new THREE.Vector3(0,0,-1),fov:2.5,R:RV*.92,nome:'PLANTA (vista de cima)'},secao:{dir:new THREE.Vector3(1,0,0),up:Y,fov:2.5,R:Math.max(MED.B,MED.D)*1.25+1.4,nome:'SEÇÃO NA BALIZA MESTRA'}};
 const CICLO=['persp','perfil','planta','secao'],FICA=6.5,PASSA=2.8;let vT=0,vI=0,naProjeto=false,camAntes=null;
 const dirA=new THREE.Vector3(),q0=new THREE.Quaternion(),q1=new THREE.Quaternion(),zz=new THREE.Vector3(0,0,1);
 function poseVista(a,b,e,alvo){const A=VISTAS[a],B=VISTAS[b];const lf=Math.exp(Math.log(A.fov)*(1-e)+Math.log(B.fov)*e);
  q0.setFromUnitVectors(zz,A.dir.clone().normalize());q1.setFromUnitVectors(zz,B.dir.clone().normalize());q0.slerp(q1,e);dirA.copy(zz).applyQuaternion(q0);
  const R=A.R+(B.R-A.R)*e,dist=R/Math.tan(lf*Math.PI/360);cam.fov=lf;cam.near=Math.max(.05,dist-60);cam.far=dist+80;cam.updateProjectionMatrix();
  cam.position.copy(alvo).addScaledVector(dirA,dist);cam.up.copy(A.up).lerp(B.up,e).normalize();
  // seção: a fatia (±0,3 m em volta da baliza mestra) entra e sai junto com a vista
  const ks=(a==='secao'?1-e:0)+(b==='secao'?e:0);const lado=ks>.02?.3+(1-ks)*20:1e4;slab[0].constant=-(xMid-lado);slab[1].constant=xMid+lado;slab[0].normal.set(1,0,0);slab[1].normal.set(-1,0,0);
  cam.lookAt(alvo);return ks}
 const esc=$('eEscala'),car=$('eCarimbo');
 function escala(){const p0=alvo0.clone().project(cam),dx=new THREE.Vector3(1,0,0).applyQuaternion(cam.quaternion),p1=alvo0.clone().add(dx).project(cam);const pxm=Math.abs(p1.x-p0.x)*innerWidth/2;
  let n=1;for(const c of[.5,1,2,5])if(c*pxm<=Math.min(220,innerWidth*.32))n=c;const w=n*pxm;esc.querySelector('i').style.width=w+'px';esc.querySelector('b').textContent=(n+'').replace('.',',')+' m'}
 function liga(on){if(on===naProjeto)return;naProjeto=on;document.body.classList.toggle('projeto',on);esc.hidden=car.hidden=!on;
  if(on){montaPrancha();camAntes={fov:cam.fov,near:cam.near,far:cam.far};oc.enabled=false;oc.autoRotate=false;vT=0;vI=0}
  else{prancha.visible=false;COTAS.forEach(q=>q[3].style.display='none');if(camAntes){cam.fov=camAntes.fov;cam.near=camAntes.near;cam.far=camAntes.far;cam.up.set(0,1,0);cam.updateProjectionMatrix()}oc.enabled=true;slab[0].constant=slab[1].constant=1e4;barco.visible=true;esq.visible=true}}
 function atualizaProjeto(dt,pausa){prancha.visible=true;barco.visible=false;esq.visible=false;
  for(const ls of linhasEsq){const g=ls.userData.g;ls.visible=!g||g.vis!==false}
  if(!pausa)vT+=dt;let a=CICLO[vI%4],b=CICLO[(vI+1)%4],e=0;if(vT>FICA){e=Math.min(1,(vT-FICA)/PASSA);e=e*e*(3-2*e);if(vT>=FICA+PASSA){vI++;vT=0;a=b;e=0}}
  poseVista(a,b,e,alvo0);oc.target.copy(alvo0);const nomeV=e>.5?b:a;car.querySelector('.vista').textContent='Vista: '+VISTAS[nomeV].nome;
  for(const q of COTAS){const d=q[3],v=q[0].clone().project(cam),ok=q[2].includes(nomeV)&&v.z<1&&Math.abs(v.x)<1.05&&Math.abs(v.y)<1.05;d.style.display=ok?'':'none';if(ok){d.style.left=((v.x*.5+.5)*innerWidth)+'px';d.style.top=((-v.y*.5+.5)*innerHeight)+'px'}}
  escala()}
 return {MED,faltam,marcas,realca,pintaRealce,desligaRealce,liga,atualizaProjeto,vista:()=>CICLO[vI%4],pula:()=>{vT=FICA+PASSA*.999},soltaCamera:()=>{usuarioMexeu=false},get naProjeto(){return naProjeto}};
}
