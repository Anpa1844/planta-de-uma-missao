// Direção de fotografia: cada humor define sol, céu, névoa, nuvens, água e marcação de cor. O rio percorre os humores ao longo da história.
import * as THREE from 'three';
import {sst,mix,giro} from './util.js';
import {U} from './nucleo.js';

const c=h=>new THREE.Color(h);
const k=(h,i=1)=>new THREE.Color(h).multiplyScalar(i);
// el: altura do sol real (graus); elL: altura da luz que ilumina; az: azimute relativo ao rumo do rio (graus, 0 = à frente)
const H={
  noite:{el:-24,elL:38,az:-30,solC:k('#a8bef2',.82),zen:k('#040817',.8),hor:k('#0d1630',.95),brilho:k('#000000'),nuvLuz:k('#5a6c9a',0.26),nuvSomb:k('#0a1020',.5),cob:.34,densN:.9,base:1500,topo:3800,vento:.0008,
    ambC:k('#2c3e74',.78),ambH:k('#1c2a54',.66),ambS:k('#06080e',.5),nev:k('#0e1830',.9),nevS:k('#16223e',.9),nd:.0034,nh:.03,np:8,linhaH:62,noite:1,disco:k('#000000'),
    agua:k('#06141a'),aF:.34,aEsp:.9,onda:.3,exp:1.32,bloom:.16,sat:.92,con:.26,lift:c('#000000'),gain:k('#ffffff'),sT:c('#c9d8ff'),lT:c('#fff6e6'),ant:0,raios:0.000,vin:1.25,chuva:0,luaAz:58,luaEl:36,grilos:1,cigarra:.08,aves:.05,sapos:1,folha:.5},
  alvorada:{el:-7,elL:6,az:6,solC:k('#8fa4d6',.7),zen:k('#14224a',1),hor:k('#6d7ea8',1),brilho:k('#c98a7c',.8),nuvLuz:k('#c89c9c',.26),nuvSomb:k('#1c2448',.5),cob:.5,densN:.9,base:1400,topo:3800,vento:.0009,
    ambC:k('#44588e',.62),ambH:k('#3f5078',.6),ambS:k('#0a0e14',.45),nev:k('#5c6c8e',.92),nevS:k('#c49888',1),nd:.0078,nh:.055,np:7,linhaH:42,noite:.45,disco:k('#000000'),
    agua:k('#143038'),aF:.42,aEsp:.8,onda:.28,exp:1.15,bloom:.14,sat:.95,con:.24,lift:c('#010204'),gain:k('#ffffff'),sT:c('#d4deff'),lT:c('#fff0e2'),ant:.22,raios:0.000,vin:1.1,chuva:0,luaAz:58,luaEl:36,grilos:.7,cigarra:.05,aves:.3,sapos:.6,folha:.65},
  aurora:{el:7,az:4,solC:k('#ffb48e',3.4),zen:k('#5a78aa',1.15),hor:k('#f6bfa6',1.45),brilho:k('#ffb486',1.5),nuvLuz:k('#ffc8aa',1.92),nuvSomb:k('#6e6084',.82),cob:.56,densN:1,base:1300,topo:4200,vento:.0011,
    ambC:k('#a0aed0',.86),ambH:k('#c8a8a0',.88),ambS:k('#2e281a',.62),nev:k('#d8ac9a',1.05),nevS:k('#ffd4ae',1.7),nd:.0048,nh:.05,np:6,linhaH:36,noite:0,disco:k('#ffd8b0',60),
    agua:k('#2c6a56'),aF:.34,aEsp:1,onda:.26,exp:1.02,bloom:.13,sat:1.1,con:.28,lift:c('#000000'),gain:k('#ffffff'),sT:c('#e6e8ff'),lT:c('#fff2e6'),ant:.16,raios:0.112,vin:.95,chuva:0,luaAz:58,luaEl:36,grilos:.15,cigarra:.1,aves:1,sapos:.15,folha:1},
  douradaManha:{el:18,az:-22,solC:k('#ffd2a0',3.7),zen:k('#2e62b8',1.12),hor:k('#e0d4c8',1.3),brilho:k('#ffcf9a',1.1),nuvLuz:k('#ffe2c8',1.98),nuvSomb:k('#7c7e9c',.95),cob:.52,densN:1,base:1300,topo:4400,vento:.0012,
    ambC:k('#a4c0ea',.95),ambH:k('#d0c8b8',.9),ambS:k('#2e2c18',.62),nev:k('#d8d0c0',1.05),nevS:k('#ffe0b8',1.5),nd:.0026,nh:.045,np:6,linhaH:40,noite:0,disco:k('#fff0d8',70),
    agua:k('#2c6e50'),aF:.32,aEsp:1,onda:.3,exp:1,bloom:.11,sat:1.1,con:.28,lift:c('#000000'),gain:k('#ffffff'),sT:c('#f0f0ff'),lT:c('#fff6ea'),ant:.08,raios:0.096,vin:.9,chuva:0,luaAz:58,luaEl:36,grilos:0,cigarra:.4,aves:1,sapos:.05,folha:1},
  manha:{el:34,az:40,solC:k('#fff2dc',3.8),zen:k('#1e5ac0',1.15),hor:k('#a8cdf0',1.2),brilho:k('#fff0dc',.8),nuvLuz:k('#ffffff',1.44),nuvSomb:k('#7c8cac',1),cob:.5,densN:1,base:1400,topo:4600,vento:.0013,
    ambC:k('#a8ccf6',1.02),ambH:k('#c8d4d0',.95),ambS:k('#2c3018',.62),nev:k('#a8c8e0',1),nevS:k('#ecf0e6',1.3),nd:.0013,nh:.035,np:8,linhaH:48,noite:0,disco:k('#fffaf0',80),
    agua:k('#2a6e4e'),aF:.3,aEsp:1,onda:.34,exp:.98,bloom:.1,sat:1.12,con:.3,lift:c('#000000'),gain:k('#ffffff'),sT:c('#f2f4ff'),lT:c('#fffaf0'),ant:.03,raios:0.064,vin:.85,chuva:0,luaAz:58,luaEl:36,grilos:0,cigarra:.8,aves:.9,sapos:0,folha:1},
  meioDia:{el:64,az:70,solC:k('#fff6e8',4.1),zen:k('#174fb8',1.15),hor:k('#a6ccf2',1.22),brilho:k('#ffffff',.5),nuvLuz:k('#ffffff',1.48),nuvSomb:k('#7888a8',1),cob:.62,densN:1.1,base:1500,topo:5200,vento:.0014,
    ambC:k('#a8ccf6',1.08),ambH:k('#ccd8d4',1),ambS:k('#2e3218',.66),nev:k('#aacce4',1),nevS:k('#eef2ea',1.2),nd:.0011,nh:.03,np:8,linhaH:52,noite:0,disco:k('#ffffff',90),
    agua:k('#2c7050'),aF:.28,aEsp:1,onda:.38,exp:.94,bloom:.09,sat:1.1,con:.3,lift:c('#000000'),gain:k('#ffffff'),sT:c('#f4f6ff'),lT:c('#ffffff'),ant:0,raios:0.038,vin:.8,chuva:0,luaAz:58,luaEl:36,grilos:0,cigarra:1,aves:.7,sapos:0,folha:1},
  tempestade:{el:46,az:60,solC:k('#b0bacc',.9),zen:k('#5a6470',1.05),hor:k('#8c96a0',1.15),brilho:k('#000000'),nuvLuz:k('#b4bac4',.82),nuvSomb:k('#3c4450',.74),cob:.96,densN:1.8,base:900,topo:6200,vento:.0034,
    ambC:k('#8a96a6',.78),ambH:k('#76828e',.7),ambS:k('#1c2018',.5),nev:k('#6c7884',.76),nevS:k('#7c8894',.8),nd:.0078,nh:.016,np:6,linhaH:26,noite:0,disco:k('#000000'),
    agua:k('#244a42'),aF:.34,aEsp:.25,onda:1.5,exp:1.38,bloom:.07,sat:.78,con:.3,lift:c('#010202'),gain:k('#ffffff'),sT:c('#dce6f0'),lT:c('#f0f4f8'),ant:0,raios:0.000,vin:1.2,chuva:1,luaAz:58,luaEl:36,grilos:0,cigarra:0,aves:0,sapos:.5,folha:.45},
  posChuva:{el:34,az:-20,solC:k('#ffeed4',4.3),zen:k('#1a52b4',1.15),hor:k('#b4d2ea',1.3),brilho:k('#fff0d8',1.1),nuvLuz:k('#ffffff',1.54),nuvSomb:k('#65748e',.92),cob:.62,densN:1.1,base:1100,topo:5400,vento:.002,
    ambC:k('#a4c8f0',1),ambH:k('#c4d4cc',.95),ambS:k('#2a3018',.6),nev:k('#d0e0e4',1.15),nevS:k('#fff0d4',1.8),nd:.0034,nh:.06,np:5,linhaH:40,noite:0,disco:k('#fff8e8',80),
    agua:k('#245e4c'),aF:.34,aEsp:1.2,onda:.34,exp:.98,bloom:.13,sat:1.18,con:.32,lift:c('#000000'),gain:k('#ffffff'),sT:c('#eef2ff'),lT:c('#fff8ec'),ant:0,raios:0.176,vin:.9,chuva:0,luaAz:58,luaEl:36,grilos:0,cigarra:.7,aves:1,sapos:.6,folha:1},
  tarde:{el:30,az:-46,solC:k('#ffe8c8',3.9),zen:k('#215cbc',1.14),hor:k('#c0d4e2',1.25),brilho:k('#ffe4c0',.9),nuvLuz:k('#fff6ea',1.48),nuvSomb:k('#7a84a0',1),cob:.5,densN:1,base:1400,topo:4600,vento:.0012,
    ambC:k('#a8c8f0',1),ambH:k('#d0d0c0',.92),ambS:k('#2e2e18',.62),nev:k('#b4c8d4',1),nevS:k('#ffe8c8',1.35),nd:.0015,nh:.035,np:7,linhaH:46,noite:0,disco:k('#fff4e0',80),
    agua:k('#2a6a50'),aF:.3,aEsp:1,onda:.34,exp:.98,bloom:.1,sat:1.12,con:.3,lift:c('#000000'),gain:k('#ffffff'),sT:c('#f2f2ff'),lT:c('#fff6e6'),ant:0,raios:0.070,vin:.88,chuva:0,luaAz:58,luaEl:36,grilos:0,cigarra:.75,aves:.8,sapos:0,folha:1},
  dourada:{el:11,az:-8,solC:k('#ffb46a',4.1),zen:k('#5470aa',1.15),hor:k('#ffd09c',1.75),brilho:k('#ffb066',1.9),nuvLuz:k('#ffc890',2.11),nuvSomb:k('#7c5e70',.9),cob:.5,densN:1,base:1300,topo:4400,vento:.001,
    ambC:k('#9cacd0',.8),ambH:k('#e0b890',.9),ambS:k('#30241a',.62),nev:k('#e8b888',1.15),nevS:k('#ffcc8e',2),nd:.0032,nh:.04,np:5,linhaH:34,noite:0,disco:k('#ffd090',80),
    agua:k('#2e5e44'),aF:.36,aEsp:1.1,onda:.28,exp:.98,bloom:.15,sat:1.14,con:.3,lift:c('#000000'),gain:k('#ffffff'),sT:c('#e8e4ff'),lT:c('#fff0da'),ant:0,raios:0.160,vin:1,chuva:0,luaAz:58,luaEl:36,grilos:.05,cigarra:.5,aves:1,sapos:.1,folha:1},
  porDoSol:{el:2.6,az:-4,solC:k('#ff7c40',3.6),zen:k('#39406e',1),hor:k('#ff9c5c',1.7),brilho:k('#ff7a38',2.2),nuvLuz:k('#ff9858',1.98),nuvSomb:k('#553454',.82),cob:.56,densN:1.1,base:1200,topo:4400,vento:.0009,
    ambC:k('#7a7cb0',.66),ambH:k('#d88a66',.78),ambS:k('#2a1a18',.5),nev:k('#d88858',1.05),nevS:k('#ff8a48',2.2),nd:.0031,nh:.04,np:5,linhaH:30,noite:.05,disco:k('#ff9a58',70),
    agua:k('#233c30'),aF:.46,aEsp:1.2,onda:.26,exp:.96,bloom:.18,sat:1.16,con:.3,lift:c('#000000'),gain:k('#ffffff'),sT:c('#dcd8ff'),lT:c('#fff0da'),ant:0,raios:0.176,vin:1.1,chuva:0,luaAz:58,luaEl:36,grilos:.25,cigarra:.2,aves:.8,sapos:.3,folha:.9},
  crepusculo:{el:-5,elL:5,az:-10,solC:k('#8a7ca8',.8),zen:k('#161c42',1),hor:k('#b4667c',1),brilho:k('#c05f58',1.2),nuvLuz:k('#c06a78',0.56),nuvSomb:k('#20223e',.6),cob:.5,densN:1,base:1300,topo:4200,vento:.0009,
    ambC:k('#3e4a84',.58),ambH:k('#6a5078',.55),ambS:k('#0e0c14',.42),nev:k('#5e4e70',.86),nevS:k('#c06c62',1.1),nd:.0044,nh:.04,np:5,linhaH:34,noite:.4,disco:k('#000000'),
    agua:k('#121f26'),aF:.5,aEsp:1,onda:.26,exp:1.12,bloom:.17,sat:1.02,con:.28,lift:c('#010103'),gain:k('#ffffff'),sT:c('#d4d4ff'),lT:c('#fff0e0'),ant:0,raios:0.032,vin:1.15,chuva:0,luaAz:58,luaEl:36,grilos:.8,cigarra:.1,aves:.15,sapos:.8,folha:.65},
};
const CAMPOS_COR=['solC','zen','hor','brilho','nuvLuz','nuvSomb','ambC','ambH','ambS','nev','nevS','disco','agua','lift','gain','sT','lT'];
const CAMPOS_NUM=['el','elL','az','cob','densN','base','topo','vento','nd','nh','np','linhaH','noite','aF','aEsp','onda','exp','bloom','sat','con','ant','raios','vin','chuva','luaAz','luaEl','grilos','cigarra','aves','sapos','folha'];
for(const n in H){if(H[n].elL===undefined)H[n].elL=Math.max(H[n].el,4)}

const dir=(el,az,o)=>{const e=el*Math.PI/180;o.set(Math.sin(az)*Math.cos(e),Math.sin(e),Math.cos(az)*Math.cos(e));return o.normalize()};

export class Clima{
  constructor(rio,tabela){this.rio=rio;this.tab=tabela;this.m={solDirCeu:new THREE.Vector3(),discoDir:new THREE.Vector3(),luaDir:new THREE.Vector3(),luzDir:new THREE.Vector3(),solCor:new THREE.Color(),zen:new THREE.Color(),hor:new THREE.Color(),brilho:new THREE.Color(),nuvLuz:new THREE.Color(),nuvSomb:new THREE.Color(),discoCor:new THREE.Color(),aguaCor:new THREE.Color(),lift:new THREE.Color(),gain:new THREE.Color(),sT:new THREE.Color(),lT:new THREE.Color(),amb:new THREE.Color(),relampago:0};
    this.fx={};for(const q of CAMPOS_NUM)this.fx[q]=0;for(const q of CAMPOS_COR)this.fx[q]=new THREE.Color();
    // azimute de cada chave é relativo ao rumo do rio naquele ponto; assim o sol fica onde o quadro pede
    this.aziAbs=tabela.map(([s,n])=>H[n].az*Math.PI/180+rio.rumo(s));this.luaAbs=tabela.map(([s,n])=>H[n].luaAz*Math.PI/180+rio.rumo(s));this.nome='';this.forcado=null}
  // devolve os dois humores da vez
  atualiza(s){const t=this.tab;let i=0;while(i<t.length-2&&s>t[i+1][0])i++;const a=t[i],b=t[i+1],kk=sst(a[0],b[0],s);const A=H[a[1]],B=H[b[1]],f=this.fx;
    for(const q of CAMPOS_NUM)f[q]=A[q]+(B[q]-A[q])*kk;for(const q of CAMPOS_COR)f[q].copy(A[q]).lerp(B[q],kk);
    const az=this.aziAbs[i]+giro(this.aziAbs[i+1]-this.aziAbs[i])*kk,azL=this.luaAbs[i]+giro(this.luaAbs[i+1]-this.luaAbs[i])*kk;const m=this.m;
    dir(f.el,az,m.solDirCeu);m.discoDir.copy(m.solDirCeu);dir(f.elL,az,m.luzDir);dir(f.luaEl,azL,m.luaDir);
    m.solCor.copy(f.solC);m.zen.copy(f.zen);m.hor.copy(f.hor);m.brilho.copy(f.brilho);m.nuvLuz.copy(f.nuvLuz);m.nuvSomb.copy(f.nuvSomb);m.discoCor.copy(f.disco);m.cob=f.cob;m.densN=f.densN;m.baseN=f.base;m.topoN=f.topo;m.ventoN=f.vento;m.noite=f.noite;m.linhaH=f.linhaH;
    U.uSolDir.value.copy(m.luzDir);U.uSolCor.value.copy(f.solC);U.uAmbCeu.value.copy(f.ambC);U.uAmbHor.value.copy(f.ambH);U.uAmbChao.value.copy(f.ambS);U.uNevoaCor.value.copy(f.nev);U.uNevoaSol.value.copy(f.nevS);U.uNevoaP.value.set(f.nd,f.nh,f.np,0);U.uNoite.value=f.noite;
    m.aguaCor.copy(f.agua);m.aF=f.aF;m.aEsp=f.aEsp;m.onda=f.onda;m.f=f;return m}
  aplicaPos(p){const f=this.fx,u=p.uF;u.uExp.value=f.exp;u.uBloom.value=f.bloom;u.uSat.value=f.sat;u.uCon.value=f.con;u.uLift.value.copy(f.lift);u.uGain.value.copy(f.gain);u.uSombraT.value.copy(f.sT);u.uLuzT.value.copy(f.lT);u.uAntigo.value=f.ant;u.uVin.value=f.vin}
}
export const HUMORES=H;
