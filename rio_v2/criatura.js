// Bichos feitos de anéis e ossos: cada espécie é uma lista de seções do corpo. Sem nenhum arquivo, com pele pintada no próprio shader.
import * as THREE from 'three';
import {integra} from './nucleo.js';
import {clamp,mix,sst} from './util.js';

const c3=h=>{const q=new THREE.Color(h);return [q.r,q.g,q.b]};
export class Corpo{
  constructor(nome){this.nome=nome;this.ossos=[];this.mapa={};this.P=[];this.C=[];this.A=[];this.SI=[];this.SW=[];this.I=[]}
  osso(nome,pai,x,y,z){const i=this.ossos.length;this.ossos.push({nome,pai:pai!=null?this.mapa[pai]:-1,x,y,z});this.mapa[nome]=i;return this}
  // lista de anéis: [x,y,z,rx,ry,osso(s),cor(opcional)] ; cor pode ser função do ângulo
  tubo(an,lados,corF,{tampa=true,along=0,fator=1}={}){const n=an.length,base=this.P.length/3;
    for(let i=0;i<n;i++){const [x,y,z,rx,ry,os,dir]=an[i];
      // direção do anel: pela diferença entre vizinhos
      const a=an[Math.max(i-1,0)],b=an[Math.min(i+1,n-1)];let dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];const dl=Math.hypot(dx,dy,dz)||1;dx/=dl;dy/=dl;dz/=dl;
      // base do anel: u lateral (x do bicho), v para cima
      let ux=1,uy=0,uz=0;if(Math.abs(dx)>.9){ux=0;uy=0;uz=1}const d0=ux*dx+uy*dy+uz*dz;ux-=d0*dx;uy-=d0*dy;uz-=d0*dz;const lu=Math.hypot(ux,uy,uz);ux/=lu;uy/=lu;uz/=lu;const vx=dy*uz-dz*uy,vy=dz*ux-dx*uz,vz=dx*uy-dy*ux;const sg=vy<0?-1:1;
      for(let j=0;j<=lados;j++){const th=j/lados*Math.PI*2,cs=Math.cos(th),sn=Math.sin(th);const px=x+ux*cs*rx+vx*sg*sn*ry,py=y+uy*cs*rx+vy*sg*sn*ry,pz=z+uz*cs*rx+vz*sg*sn*ry;this.P.push(px,py,pz);const cor=typeof corF==='function'?corF(i/(n-1),sn,cs,x,y,z):corF;this.C.push(cor[0],cor[1],cor[2]);this.A.push(along+i/(n-1)*fator,j/lados);
        const os2=Array.isArray(os)?os:[[os,1]];const si=[0,0,0,0],sw=[0,0,0,0];os2.forEach((o,k)=>{si[k]=this.mapa[o[0]];sw[k]=o[1]});this.SI.push(...si);this.SW.push(...sw)}}
    for(let i=0;i<n-1;i++)for(let j=0;j<lados;j++){const a=base+i*(lados+1)+j,b=a+1,c=a+lados+1,d=c+1;this.I.push(a,c,b,b,c,d)}
    return this}
  esfera(x,y,z,r,os,cor,ry){const an=[];const N=5;for(let i=0;i<=N;i++){const a=i/N*Math.PI;an.push([x,y,z+Math.cos(a)*-r,Math.max(.0005,Math.sin(a)*r),Math.max(.0005,Math.sin(a)*(ry||r)),os])}return this.tubo(an,7,cor)}
  monta(material){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.C,3));g.setAttribute('aPad',new THREE.Float32BufferAttribute(this.A,2));g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(this.SI,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(this.SW,4));g.setIndex(this.I);g.computeVertexNormals();this.geo=g;this.mat=material;return this}
  // nova cópia viva do bicho
  novo(){const bones=this.ossos.map(o=>{const b=new THREE.Bone();b.name=o.nome;return b});this.ossos.forEach((o,i)=>{const p=o.pai;if(p>=0){const q=this.ossos[p];bones[i].position.set(o.x-q.x,o.y-q.y,o.z-q.z);bones[p].add(bones[i])}else bones[i].position.set(o.x,o.y,o.z)});
    const m=new THREE.SkinnedMesh(this.geo,this.mat);m.frustumCulled=false;m.add(bones[0]);m.updateMatrixWorld(true);m.bind(new THREE.Skeleton(bones));m.castShadow=true;m.receiveShadow=false;const q={};bones.forEach(b=>q[b.name]=b);m.userData.o=q;return m}
}
// pele: padrão calculado no fragmento, nada de textura
export function pele(tipo,{rug=.82,met=0}={}){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:rug,metalness:met});integra(m,{copa:true,chave:tipo,extra:(sh)=>{
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 aPad;varying vec2 vPad;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPad=aPad;');
    const pad={onca:`vec2 q=vec2(vPad.x*30.,vPad.y*12.);vec2 i=floor(q),f=fract(q);float d=9.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y);vec2 ha=fract(sin(vec2(dot(mod(i+g,vec2(99.,12.)),vec2(127.1,311.7)),dot(mod(i+g,vec2(99.,12.)),vec2(269.5,183.3))))*43758.5453);vec2 r=g+ha-f;d=min(d,dot(r,r));}d=sqrt(d);float an=atan(f.y-.5,f.x-.5);float ros=smoothstep(.46,.41,d)*smoothstep(.18,.26,d+sin(an*5.)*.05);float cl=smoothstep(.22,.42,vColor.g);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.018,.012,.008),ros*cl*.94);`,
      jacare:`vec2 q=vec2(vPad.x*60.,vPad.y*18.);vec2 f=abs(fract(q)-.5);float ln=smoothstep(.42,.5,max(f.x,f.y));diffuseColor.rgb*=1.-ln*.5;diffuseColor.rgb*=.86+.28*fract(sin(dot(floor(q),vec2(12.9,78.2)))*43758.5);`,
      pelo:`float n=fract(sin(dot(floor(vPad*vec2(220.,90.)),vec2(12.9,78.2)))*43758.5);diffuseColor.rgb*=.84+.32*n;`,
      liso:``}[tipo]||'';
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vPad;').replace('#include <color_fragment>','#include <color_fragment>\n'+pad)}});return m}

// ---------- espécies ----------
const fur=(topo,barriga)=>{const A=c3(topo),B=c3(barriga);return (t,sn)=>{const k=sst(-.1,-.75,sn);return [A[0]+(B[0]-A[0])*k,A[1]+(B[1]-A[1])*k,A[2]+(B[2]-A[2])*k]}};

export function capivara(){const b=new Corpo('capivara');b.osso('raiz',null,0,.42,0).osso('quadril','raiz',0,.42,-.38).osso('peito','raiz',0,.46,.3).osso('pesc','peito',0,.5,.46).osso('cab','pesc',0,.54,.6).osso('orE','cab',.09,.68,.62).osso('orD','cab',-.09,.68,.62);
  for(const [n,s,x,z] of [['fe',1,.15,.3],['fd',-1,.15,.3],['te',1,.17,-.42],['td',-1,.17,-.42]]){const pa=z>0?'peito':'quadril';b.osso(n+'1',pa,s*x,.34,z).osso(n+'2',n+'1',s*x,.18,z+.02).osso(n+'3',n+'2',s*x,.03,z+.05)}
  const C=fur('#a56e38','#c79560');const q='quadril',t='raiz',p='peito',e='pesc',h='cab';
  const mis=(a,b,k)=>[[a,1-k],[b,k]];
  b.tubo([[0,.44,-.64,.02,.02,q],[0,.44,-.6,.13,.15,q],[0,.44,-.52,.24,.26,q],[0,.43,-.36,.3,.31,q],[0,.43,-.15,.335,.34,mis(q,t,.7)],[0,.44,.05,.325,.335,t],[0,.45,.22,.28,.31,mis(t,p,.7)],[0,.47,.36,.215,.25,p],[0,.49,.46,.19,.215,mis(p,e,.6)],[0,.52,.55,.16,.185,e],[0,.55,.62,.145,.17,h],[0,.54,.72,.135,.155,h],[0,.52,.82,.125,.13,h],[0,.5,.9,.115,.105,h],[0,.485,.965,.1,.08,h],[0,.48,1,.07,.05,h],[0,.48,1.015,.03,.02,h]],12,C);
  for(const [n,s,x,z] of [['fe',1,.15,.3],['fd',-1,.15,.3],['te',1,.17,-.42],['td',-1,.17,-.42]]){const pa=z>0?'peito':'quadril';b.tubo([[s*x,.42,z,.1,.12,pa],[s*x,.3,z,.09,.09,n+'1'],[s*x,.18,z+.02,.066,.066,n+'2'],[s*x,.06,z+.04,.052,.05,n+'3'],[s*x,.015,z+.07,.06,.022,n+'3'],[s*x,.01,z+.12,.024,.01,n+'3']],6,c3('#7d5228'))}
  for(const s of[1,-1]){const n=s>0?'orE':'orD';b.tubo([[s*.09,.655,.62,.04,.022,n],[s*.095,.69,.62,.034,.018,n],[s*.1,.715,.62,.012,.008,n]],5,c3('#55361d'));b.esfera(s*.095,.6,.74,.018,h,c3('#0a0705'))}
  b.esfera(0,.49,.97,.028,h,c3('#1d120b'),.018);return b.monta(pele('pelo',{rug:.92}));}

export function onca(){const b=new Corpo('onca');const Y=.62;b.osso('raiz',null,0,Y,0).osso('quadril','raiz',0,Y,-.5).osso('peito','raiz',0,Y+.02,.42).osso('pesc','peito',0,Y+.08,.68).osso('cab','pesc',0,Y+.12,.86);
  for(let i=0;i<6;i++)b.osso('rabo'+i,i?'rabo'+(i-1):'quadril',0,Y+.03-i*.05,-.76-i*.17);
  for(const [n,s,x,z] of [['fe',1,.14,.46],['fd',-1,.14,.46],['te',1,.15,-.56],['td',-1,.15,-.56]]){const pa=z>0?'peito':'quadril';b.osso(n+'1',pa,s*x,Y-.14,z).osso(n+'2',n+'1',s*x,Y-.34,z+(z>0?-.03:-.1)).osso(n+'3',n+'2',s*x,.06,z+(z>0?.0:-.04))}
  const C=(t,sn)=>{const k=sst(-.25,-.8,sn);const a=c3('#c8923f'),bb=c3('#efe2c6');return [a[0]+(bb[0]-a[0])*k,a[1]+(bb[1]-a[1])*k,a[2]+(bb[2]-a[2])*k]};
  const q='quadril',t='raiz',p='peito',e='pesc',h='cab',mis=(a,c,k)=>[[a,1-k],[c,k]];
  b.tubo([[0,Y+.02,-.8,.03,.04,q],[0,Y+.03,-.74,.14,.17,q],[0,Y+.03,-.6,.2,.235,q],[0,Y+.01,-.4,.2,.23,mis(q,t,.6)],[0,Y,-.15,.175,.205,t],[0,Y,.1,.18,.215,t],[0,Y+.03,.32,.2,.25,mis(t,p,.7)],[0,Y+.05,.48,.185,.25,p],[0,Y+.1,.64,.13,.17,mis(p,e,.6)],[0,Y+.13,.76,.115,.13,e],[0,Y+.14,.84,.125,.125,h],[0,Y+.15,.93,.13,.125,h],[0,Y+.13,1,.11,.1,h],[0,Y+.1,1.07,.085,.07,h],[0,Y+.08,1.12,.06,.05,h],[0,Y+.07,1.145,.03,.025,h]],14,C,{fator:1});
  const an=[];for(let i=0;i<6;i++)an.push([0,Y+.03-i*.05,-.76-i*.17,.05-i*.004,.05-i*.004,'rabo'+i]);an.push([0,Y-.28,-1.8,.03,.03,'rabo5']);b.tubo(an,6,(t,sn)=>t>.78?c3('#18110b'):C(t,sn),{along:.2,fator:.5});
  for(const [n,s,x,z] of [['fe',1,.14,.46],['fd',-1,.14,.46],['te',1,.15,-.56],['td',-1,.15,-.56]]){const pa=z>0?'peito':'quadril',zk=z>0?-.03:-.1;b.tubo([[s*x,Y-.02,z,.095,.13,pa],[s*x,Y-.16,z,.082,.1,n+'1'],[s*x,Y-.34,z+zk,.054,.058,n+'2'],[s*x,.12,z+zk*.6,.048,.05,n+'3'],[s*x,.035,z+.03,.068,.035,n+'3'],[s*x,.012,z+.1,.05,.012,n+'3']],7,C,{along:.3,fator:.25})}
  for(const s of[1,-1]){b.tubo([[s*.09,Y+.25,.86,.04,.02,h],[s*.1,Y+.3,.86,.03,.014,h],[s*.105,Y+.32,.86,.008,.004,h]],5,c3('#8d6a30'));b.esfera(s*.07,Y+.17,1.01,.02,h,c3('#b7a040'));b.esfera(s*.07,Y+.17,1.022,.01,h,c3('#050403'))}
  b.esfera(0,Y+.08,1.14,.022,h,c3('#3a2018'),.014);return b.monta(pele('onca',{rug:.9}));}

export function jacare(){const b=new Corpo('jacare');const Y=.3;b.osso('raiz',null,0,Y,0).osso('cab','raiz',0,Y+.02,.72).osso('maxi','cab',0,Y-.02,.8);for(let i=0;i<7;i++)b.osso('c'+i,i?'c'+(i-1):'raiz',0,Y,-.2-i*.34);
  for(const [n,s,z] of [['fe',1,.38],['fd',-1,.38],['te',1,-.32],['td',-1,-.32]])b.osso(n+'1','raiz',s*.22,Y-.04,z).osso(n+'2',n+'1',s*.44,.08,z+.04);
  const C=(t,sn)=>{const k=sst(-.05,-.6,sn);const a=c3('#4a4c2a'),bb=c3('#c0b68a');return [a[0]+(bb[0]-a[0])*k,a[1]+(bb[1]-a[1])*k,a[2]+(bb[2]-a[2])*k]};const r='raiz',h='cab';
  const corpo=[[0,Y,.62,.2,.1,h],[0,Y,.48,.26,.14,[[h,.5],[r,.5]]],[0,Y,.25,.34,.21,r],[0,Y,-.05,.37,.23,r],[0,Y,-.2,.33,.22,[[r,.6],['c0',.4]]]];for(let i=0;i<7;i++)corpo.push([0,Y,-.54-i*.34,.25*(1-i/7.4),.19*(1-i/9),'c'+i]);corpo.push([0,Y-.02,-2.9,.02,.05,'c6']);b.tubo(corpo.reverse(),12,C,{fator:1});
  // focinho superior e mandíbula
  b.tubo([[0,Y+.05,.6,.2,.11,h],[0,Y+.05,.8,.17,.075,h],[0,Y+.04,1.05,.125,.052,h],[0,Y+.035,1.3,.085,.04,h],[0,Y+.035,1.43,.06,.026,h],[0,Y+.03,1.47,.02,.012,h]],10,C,{along:.1,fator:.4});
  b.tubo([[0,Y-.06,.72,.17,.05,'maxi'],[0,Y-.07,1,.115,.035,'maxi'],[0,Y-.07,1.3,.075,.024,'maxi'],[0,Y-.07,1.44,.03,.012,'maxi']],8,(t,sn)=>sn>0?c3('#a85a50'):c3('#a8a078'),{along:.5,fator:.3});
  for(const s of[1,-1]){b.esfera(s*.1,Y+.15,.72,.04,h,c3('#3d3f22'));b.esfera(s*.115,Y+.165,.74,.015,h,c3('#c8a838'))}b.esfera(0,Y+.06,1.42,.028,h,c3('#2a2c18'));
  for(const [n,s,z] of [['fe',1,.38],['fd',-1,.38],['te',1,-.32],['td',-1,-.32]])b.tubo([[s*.2,Y-.04,z,.09,.08,'raiz'],[s*.34,Y-.1,z+.02,.06,.055,n+'1'],[s*.46,.05,z+.06,.05,.04,n+'2'],[s*.52,.015,z+.14,.08,.012,n+'2']],6,c3('#34361e'));
  return b.monta(pele('jacare',{rug:.62}));}

export function boto(){const b=new Corpo('boto');for(let i=0;i<7;i++)b.osso('b'+i,i?'b'+(i-1):null,0,0,.9-i*.34);
  const C=(t,sn)=>{const k=sst(.5,-.7,sn);const a=c3('#b98f94'),bb=c3('#f0a5ae');return [a[0]+(bb[0]-a[0])*k,a[1]+(bb[1]-a[1])*k,a[2]+(bb[2]-a[2])*k]};
  b.tubo([[0,-.02,1.5,.012,.012,'b0'],[0,-.015,1.46,.026,.024,'b0'],[0,-.005,1.28,.033,.032,'b0'],[0,.005,1.1,.05,.05,'b0'],[0,.04,.98,.15,.15,'b0'],[0,.04,.8,.22,.23,[['b0',.5],['b1',.5]]],[0,.03,.5,.29,.3,'b1'],[0,.01,.2,.31,.32,'b2'],[0,0,-.1,.28,.29,'b3'],[0,0,-.42,.21,.22,'b4'],[0,0,-.76,.13,.15,'b5'],[0,0,-1.04,.06,.09,'b6'],[0,0,-1.2,.025,.04,'b6']],14,C);
  for(const s of[1,-1]){b.tubo([[s*.2,-.12,.55,.14,.03,'b1'],[s*.42,-.24,.46,.11,.02,'b1'],[s*.56,-.32,.38,.04,.01,'b1']],6,c3('#d79ca4'));b.tubo([[s*.02,0,-1.16,.1,.014,'b6'],[s*.2,0,-1.26,.1,.012,'b6'],[s*.38,0,-1.34,.03,.006,'b6']],6,c3('#b98f94'));b.esfera(s*.12,.06,.96,.012,'b0',c3('#120a0a'))}
  b.tubo([[0,.28,.1,.02,.01,'b2'],[0,.34,-.04,.02,.04,'b3'],[0,.3,-.3,.014,.05,'b3'],[0,.22,-.46,.008,.01,'b4']],5,c3('#a5828a'));return b.monta(pele('liso',{rug:.36}));}

export function preguica(){const b=new Corpo('preguica');b.osso('raiz',null,0,0,0).osso('pesc','raiz',0,-.05,.34).osso('cab','pesc',0,-.04,.46);for(const [n,s,z] of [['fe',1,.26],['fd',-1,.26],['te',1,-.24],['td',-1,-.24]])b.osso(n+'1','raiz',s*.14,.05,z).osso(n+'2',n+'1',s*.16,.36,z+(z>0?.08:-.06)).osso(n+'3',n+'2',s*.13,.68,z+(z>0?.08:-.06));
  const C=(t,sn)=>{const k=sn*.5+.5;return [.3+k*.1,.26+k*.08,.17+k*.06]};b.tubo([[0,-.04,-.4,.04,.04,'raiz'],[0,-.1,-.34,.17,.18,'raiz'],[0,-.14,-.12,.24,.25,'raiz'],[0,-.14,.12,.23,.24,'raiz'],[0,-.1,.3,.15,.16,'pesc'],[0,-.06,.42,.13,.13,'pesc'],[0,-.03,.5,.125,.12,'cab'],[0,-.03,.58,.11,.105,'cab'],[0,-.04,.65,.07,.065,'cab'],[0,-.05,.68,.03,.03,'cab']],11,C);
  for(const s of[1,-1]){b.esfera(s*.055,-.0,.62,.018,'cab',c3('#0e0a07'));b.esfera(s*.06,-.005,.6,.03,'cab',c3('#3a2c1e'),.012)}b.esfera(0,-.06,.67,.018,'cab',c3('#1a120d'));
  for(const [n,s,z] of [['fe',1,.26],['fd',-1,.26],['te',1,-.24],['td',-1,-.24]])b.tubo([[s*.13,-.03,z,.075,.075,'raiz'],[s*.16,.2,z+(z>0?.05:-.03),.05,.05,n+'1'],[s*.16,.4,z+(z>0?.08:-.06),.04,.04,n+'2'],[s*.14,.62,z+(z>0?.08:-.06),.035,.035,n+'2'],[s*.12,.73,z+(z>0?.08:-.06),.018,.022,n+'3']],6,C);return b.monta(pele('pelo',{rug:.96}));}

export function macaco(){const b=new Corpo('macaco');b.osso('raiz',null,0,.28,0).osso('peito','raiz',0,.5,.04).osso('cab','peito',0,.68,.08);for(let i=0;i<5;i++)b.osso('r'+i,i?'r'+(i-1):'raiz',0,.2-i*.13,-.12-i*.02);
  for(const s of[1,-1]){const n=s>0?'e':'d';b.osso('b'+n,'peito',s*.14,.56,.04).osso('a'+n,'b'+n,s*.2,.34,.16)}
  const C=(t,sn)=>{const k=.5+sn*.5;return [.2+k*.26,.1+k*.11,.05+k*.03]};b.tubo([[0,.1,0,.02,.02,'raiz'],[0,.16,0,.13,.12,'raiz'],[0,.3,.01,.15,.135,'raiz'],[0,.46,.03,.14,.12,'peito'],[0,.58,.05,.1,.09,'peito'],[0,.63,.07,.1,.095,'cab'],[0,.72,.1,.095,.09,'cab'],[0,.78,.11,.06,.06,'cab'],[0,.8,.11,.02,.02,'cab']],9,C);
  b.tubo([[0,.67,.16,.05,.05,'cab'],[0,.645,.2,.04,.035,'cab'],[0,.63,.215,.016,.014,'cab']],6,c3('#20130c'));for(const s of[1,-1])b.esfera(s*.04,.72,.175,.011,'cab',c3('#060403'));
  const ra=[];for(let i=0;i<5;i++)ra.push([0,.2-i*.13,-.12-i*.02,.035-i*.004,.035-i*.004,'r'+i]);ra.push([0,-.42,-.24,.012,.012,'r4']);b.tubo(ra,5,C);
  for(const s of[1,-1]){const n=s>0?'e':'d';b.tubo([[s*.14,.56,.04,.05,.05,'b'+n],[s*.2,.34,.16,.036,.036,'b'+n],[s*.14,.16,.2,.026,.026,'a'+n]],5,C);b.tubo([[s*.1,.14,.03,.07,.07,'raiz'],[s*.17,.13,.2,.05,.05,'raiz'],[s*.12,-.02,.2,.03,.03,'raiz']],5,C)}return b.monta(pele('pelo',{rug:.96}));}

export function peixe(cA='#6a7a5a',cB='#d9d3a8',L=.9){const b=new Corpo('peixe');for(let i=0;i<5;i++)b.osso('p'+i,i?'p'+(i-1):null,0,0,L*(.42-i*.24));const C=(t,sn)=>{const k=sst(.2,-.5,sn);const a=c3(cA),bb=c3(cB);return [a[0]+(bb[0]-a[0])*k,a[1]+(bb[1]-a[1])*k,a[2]+(bb[2]-a[2])*k]};
  b.tubo([[0,0,L*.5,.01,.01,'p0'],[0,0,L*.42,L*.06,L*.07,'p0'],[0,0,L*.22,L*.095,L*.14,'p1'],[0,0,0,L*.09,L*.14,'p2'],[0,0,-L*.22,L*.06,L*.1,'p3'],[0,0,-L*.4,L*.024,L*.05,'p4'],[0,0,-L*.47,L*.012,L*.14,'p4'],[0,0,-L*.54,L*.006,L*.2,'p4']],9,C);b.tubo([[0,L*.12,L*.1,L*.008,L*.03,'p1'],[0,L*.2,-L*.05,L*.008,L*.06,'p2'],[0,L*.12,-L*.2,L*.006,L*.02,'p3']],4,c3(cA));for(const s of[1,-1])b.esfera(s*L*.05,L*.03,L*.4,L*.016,'p0',c3('#0a0a08'));return b.monta(pele('liso',{rug:.3,met:.25}));}
export function tartaruga(){const b=new Corpo('tartaruga');b.osso('raiz',null,0,.08,0).osso('cab','raiz',0,.09,.2);const cor=(t,sn)=>sn>0?c3('#2c3322'):c3('#b8ad78');b.tubo([[0,.09,-.26,.02,.01,'raiz'],[0,.09,-.2,.16,.08,'raiz'],[0,.1,-.04,.23,.13,'raiz'],[0,.1,.1,.21,.12,'raiz'],[0,.09,.2,.13,.07,'raiz'],[0,.09,.25,.02,.01,'raiz']],10,cor);b.tubo([[0,.09,.2,.05,.04,'cab'],[0,.11,.3,.045,.04,'cab'],[0,.11,.37,.035,.032,'cab'],[0,.105,.4,.01,.01,'cab']],7,c3('#3d4426'));for(const [s,z] of [[1,.14],[-1,.14],[1,-.14],[-1,-.14]])b.tubo([[s*.18,.06,z,.05,.02,'raiz'],[s*.28,.03,z+.03,.05,.012,'raiz'],[s*.33,.02,z+.06,.014,.005,'raiz']],5,c3('#3a4024'));return b.monta(pele('liso',{rug:.45}));}
