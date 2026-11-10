// O diretor de fotografia: escolhe o plano, compõe o quadro e decide entre corte seco e movimento lento.
// Cada plano é uma função do tempo que devolve câmera, alvo, lente e inclinação, sempre usando coordenadas do rio para nunca entrar na mata.
import * as THREE from 'three';
import {sst,mix,clamp,giro,ruido2} from './util.js';

const V=()=>new THREE.Vector3();const a=V(),b=V(),q1=new THREE.Quaternion(),q2=new THREE.Quaternion(),m4=new THREE.Matrix4(),UP=new THREE.Vector3(0,1,0);
const ease=x=>x<0?0:x>1?1:x*x*x*(x*(x*6-15)+10);

export class Diretor{
  constructor(rio,cam){this.rio=rio;this.cam=cam;this.atual=null;this.ant=null;this.t=0;this.tb=0;this.durB=0;this.ctx={};this.pa={p:V(),a:V(),fov:50,rol:0};this.pb={p:V(),a:V(),fov:50,rol:0};this.i=0;this.tr=0;this.hist=[];this.olhar={y:0,p:0,z:1};this.tremor=0;this.cortes=0;this.o={};this.o2={};this.lp=V();}
  // sobre o rio: s, lat, altura para um vetor
  rp(v,s,lat,h){const o=this.rio.mundo(s,lat,this.o);v.set(o.px,h,o.pz);return v}
  // Limita a câmera: acima do chão e, nos planos baixos, sobre a água
  pede(nome,dados={},blend=0){const f=PLANOS[nome];if(!f)return;if(blend>0&&this.atual){this.ant={f:this.atual.f,t:this.t,d:this.atual.d};this.tb=0;this.durB=blend}else{this.ant=null;this.cortes++}this.atual={f,d:dados,nome};this.t=0;this.hist.push(nome);if(this.hist.length>5)this.hist.shift()}
  atualiza(dt,ctx){this.ctx=ctx;const c=this.cam;if(!this.atual)return;this.t+=dt;const A=this.pb;this.atual.f.call(this,this.t,ctx,A,this.atual.d);a.copy(A.p);b.copy(A.a);let fov=A.fov,rol=A.rol||0;
    if(this.ant){this.ant.t+=dt;this.tb+=dt;const B=this.pa;this.ant.f.call(this,this.ant.t,ctx,B,this.ant.d);const k=ease(this.tb/this.durB);a.lerpVectors(B.p,A.p,k);b.lerpVectors(B.a,A.a,k);
      // a direção de vista gira em vez de atravessar o alvo em linha reta
      const d0=B.a.clone().sub(B.p).normalize(),d1=A.a.clone().sub(A.p).normalize();m4.lookAt(UP.clone().multiplyScalar(0),d0,UP);q1.setFromRotationMatrix(m4);m4.lookAt(UP.clone().multiplyScalar(0),d1,UP);q2.setFromRotationMatrix(m4);q1.slerp(q2,k);const d=new THREE.Vector3(0,0,1).applyQuaternion(q1);b.copy(a).addScaledVector(d,-30);
      fov=mix(B.fov,A.fov,k);rol=mix(B.rol||0,rol,k);if(this.tb>=this.durB)this.ant=null}
    // o barco nunca tampa o assunto: a câmera fica a uma distância mínima dele e sobe se ele estiver na linha de visão
    const nm=this.atual.nome;if(ctx.bp&&!['proa','lemeCam','curva','chaves','piloto','livre'].includes(nm)){const B=ctx.bp;let dx=a.x-B.x,dz=a.z-B.z,dh=Math.hypot(dx,dz);const minD=12.5;if(dh<minD){const k=(minD-dh)/Math.max(dh,.5);a.x+=dx*k;a.z+=dz*k;a.y=Math.max(a.y,4.2)}
      if(nm.startsWith('obra')||nm.startsWith('fauna')||nm==='olhaCima'){const lx=b.x-a.x,ly=b.y-a.y,lz=b.z-a.z,L2=lx*lx+ly*ly+lz*lz;const u=Math.max(0,Math.min(1,((B.x-a.x)*lx+(B.y+2.6-a.y)*ly+(B.z-a.z)*lz)/L2));const qx=a.x+lx*u-B.x,qy=a.y+ly*u-(B.y+2.6),qz=a.z+lz*u-B.z;const d=Math.hypot(qx,qy,qz);if(d<7.5&&u>.02&&u<.98){const sobe=(7.5-d)*1.25;this.sobeK=(this.sobeK||0)+(sobe-(this.sobeK||0))*.08}else this.sobeK=(this.sobeK||0)*.96;a.y+=this.sobeK||0}}
    // tremor de mão e o olhar da pessoa
    const tt=ctx.tJ||0,tr=(this.atual.d.tremor!==undefined?this.atual.d.tremor:.012);const nx=(ruido2(tt*.5,1.3)-.5)*tr*a.distanceTo(b),ny=(ruido2(tt*.43,7.7)-.5)*tr*a.distanceTo(b);b.x+=nx;b.y+=ny;
    if(a.y<.22)a.y=.22;c.position.copy(a);c.up.set(0,1,0);c.lookAt(b);if(rol)c.rotateZ(rol);const ol=this.olhar;if(ol.y||ol.p){c.rotateY(ol.y);c.rotateX(ol.p)}
    const asp=ctx.W/ctx.H;let fv=fov;if(asp<1){fv=2*Math.atan(Math.tan(fov*Math.PI/360)*Math.min(1.75,.82/asp+.25))*180/Math.PI;fv=Math.min(fv,86)}else if(asp>2)fv*=.94;fv*=ol.z;if(Math.abs(c.fov-fv)>.01){c.fov=fv;c.updateProjectionMatrix()}c.updateMatrixWorld();}
}

// ---------- os planos ----------
// t: segundos desde o começo do plano; x: contexto com o barco; o: saída; d: parâmetros do plano
const PLANOS={
  // perseguição baixa, como no vídeo de referência
  popa(t,x,o,d){const e=d.e||1,dist=d.dist||21,h=(d.h||5.2)+Math.sin(t*.13)*.6,lat=x.lat-Math.sin(x.yaw-x.h)*dist+e*(5+Math.sin(t*.09)*5);if(x.dir<0||x.virando){o.p.copy(x.bp).addScaledVector(x.fw,-dist);o.p.y=h+1}else this.rp(o.p,x.s-dist,lat,h);o.a.copy(x.bp).addScaledVector(x.fw,16);o.a.y=3.2;o.fov=d.fov||64;o.rol=Math.sin(t*.2)*.004},
  // lado baixo acompanhando o costado, com o nome à vista
  lado(t,x,o,d){const e=d.e||1,W=x.w,lat=x.lat+e*Math.min(W*.75,d.dl||19),ds=(d.ds||-5)+t*(d.vd||.55);this.rp(o.p,x.s+ds,lat,d.h||2.1);o.a.copy(x.bp);o.a.y=2.6;o.a.addScaledVector(x.fw,d.af||1);o.fov=d.fov||44},
  // à frente, recuando enquanto o barco avança
  frente(t,x,o,d){const dist=(d.dist||30)-t*(d.vd||.5);this.rp(o.p,x.s+dist,x.lat+(d.e||1)*(d.dl||5),d.h||2.6);o.a.copy(x.bp);o.a.y=3;o.fov=d.fov||46},
  // grua: sobe atrás do barco e revela o rio
  drone(t,x,o,d){const kk=ease(t/(d.dur||10));const h=mix(d.h0||7,d.h1||72,kk),ds=mix(-20,d.ds1||-60,kk);this.rp(o.p,x.s+ds,x.lat*.5,h);this.rp(o.a,x.s+mix(14,d.av||160,kk),0,mix(3,0,kk));o.fov=d.fov||56},
  // voo alto e lento sobre o rio
  voo(t,x,o,d){const h=d.h||92;this.rp(o.p,x.s+(d.ds||-70)+t*(d.vd||2.2),(d.e||1)*(x.w*.2),h+Math.sin(t*.1)*3);this.rp(o.a,x.s+(d.av||150),0,0);o.fov=d.fov||52;o.rol=(d.e||1)*.03},
  // na proa, olhando adiante
  proa(t,x,o,d){o.p.set(0,3.4,8.2).applyMatrix4(x.bm);o.a.copy(o.p).addScaledVector(x.fw,20);o.a.y=o.p.y-1;o.fov=d.fov||68;o.rol=x.rz*.5},
  // rente à água: o barco passa ao lado
  agua(t,x,o,d){const e=d.e||1;const s0=d.s0!==undefined?d.s0:(d.s0=x.s+(d.av||24));this.rp(o.p,s0,x.lat+e*(d.dl||8),d.h||.42);o.a.copy(x.bp);o.a.y=2.4;o.fov=d.fov||66},
  // fixa no rio: o barco entra e sai do quadro, a câmera só acompanha com a cabeça
  fixa(t,x,o,d){const s0=d.s0!==undefined?d.s0:(d.s0=x.s+(d.av||40));this.rp(o.p,s0,(d.lat!==undefined?d.lat:x.w*.5*(d.e||1)),d.h||3.2);o.a.copy(x.bp);o.a.y=d.ay||3;o.fov=d.fov||38},
  // ---------- na parada ----------
  // barco em primeiro plano, obra ao fundo; câmera do lado oposto do rio, deslizando
  obraLarga(t,x,o,d){const P=x.obra;if(!P)return PLANOS.popa.call(this,t,x,o,d);const e=P.e,W=x.w,lat=-e*Math.min(W*.72,d.dl||26),ds=(d.ds||-16)+t*(d.vd||.5);this.rp(o.p,x.s+ds,lat,d.h||3.4);o.a.copy(P.centro).lerp(x.bp,d.mis!==undefined?d.mis:.36);o.a.y=P.centro.y*.56+.8+(x.W<x.H?P.tam.y*.32:0);const dist=o.p.distanceTo(P.centro),tam=Math.max(P.tam.x,P.tam.z)*.86;o.fov=clamp(2*Math.atan((tam*.5+6)/dist)*57.3,34,68)*(d.fz||1)},
  // grande angular rente à água, com o reflexo da obra
  obraReflexo(t,x,o,d){const P=x.obra;if(!P)return PLANOS.popa.call(this,t,x,o,d);const e=P.e,W=x.w,lat=e*(W*.22)+(-e)*(t*.08),s0=d.s0!==undefined?d.s0:(d.s0=P.si+(d.ds||-34));this.rp(o.p,s0+t*.5,lat,d.h||.7);o.a.copy(P.centro);o.a.y=P.centro.y*.5;o.fov=d.fov||58},
  // grua na obra: sobe mostrando prédio, clareira, barco e rio
  obraGrua(t,x,o,d){const P=x.obra;if(!P)return PLANOS.drone.call(this,t,x,o,d);const e=P.e,kk=ease(t/(d.dur||12)),s0=d.s0!==undefined?d.s0:(d.s0=P.si-20),lat=e*mix(-x.w*.3,x.w*.1,kk);this.rp(o.p,s0+t*.8,lat,mix(3,d.h1||38,kk));o.a.copy(P.centro);o.a.y=P.centro.y*.5;o.fov=d.fov||54},
  // lente longa na fachada, panorâmica lenta
  obraTele(t,x,o,d){const P=x.obra;if(!P)return PLANOS.lado.call(this,t,x,o,d);const e=P.e;this.rp(o.p,x.s+(d.ds||-14),-e*(x.w*.42),d.h||4.2);o.a.copy(P.centro);const dd=Math.max(P.tam.x,P.tam.z)*.32;const tg=a.copy(o.p).sub(P.centro).normalize();o.a.x+=tg.z*dd*Math.sin(t*.09+(d.fase||0));o.a.z-=tg.x*dd*Math.sin(t*.09+(d.fase||0));o.a.y=P.centro.y*(d.alt||.62);o.fov=d.fov||20;},
  // fauna: lente longa a partir do barco, procurando o bicho
  fauna(t,x,o,d){const P=d.alvo;o.p.copy(x.bp);o.p.y=d.h||3.4;const lado=P.clone().sub(x.bp);lado.y=0;lado.normalize();o.p.addScaledVector(lado,d.av||5);o.p.addScaledVector(x.fw,d.lat||0);o.a.copy(P);o.a.y=P.y+(d.ay||.3);o.fov=d.fov||15},
  // fauna bem de perto, com a câmera na água
  faunaPerto(t,x,o,d){const P=d.alvo;const q=this.rio.em(d.sRio||x.s,this.o2);const nx=q.nx*(d.lado||1),nz=q.nz*(d.lado||1);o.p.copy(P);o.p.x-=nx*(d.dist||14);o.p.z-=nz*(d.dist||14);o.p.x+=q.tx*(d.ds||-4);o.p.z+=q.tz*(d.ds||-4);o.p.y=d.h||.9;o.p.x+=q.tx*t*.12;o.p.z+=q.tz*t*.12;o.a.copy(P);o.a.y=P.y+(d.ay||.3);o.fov=d.fov||24},
  // pontos fixos em coordenadas do barco, usados na abertura, na cabine e nos finais
  chaves(t,x,o,d){const K=d.K,D=K[K.length-1][0];const tq=clamp(t,0,D);let i=0;while(i<K.length-2&&tq>K[i+1][0])i++;const A=K[i],B=K[i+1],k=(tq-A[0])/(B[0]-A[0]);const u=k*k*(3-2*k);a.set(...A[1]).lerp(b.set(...B[1]),u);o.p.copy(a);a.set(...A[2]).lerp(b.set(...B[2]),u);o.a.copy(a);o.fov=mix(A[3]||50,B[3]||50,u);if(d.mundo!==true){o.p.applyMatrix4(x.bm);o.a.applyMatrix4(x.bm)}},
  livre(t,x,o,d){o.p.copy(d.p);o.a.copy(d.a);o.fov=d.fov||50},
  // curva suave em coordenadas do barco: abertura e passagem pela porta dos fundos. d.t(t) dá 0..1 ao longo da curva
  curva(t,x,o,d){const e=d.par(t);d.cp.getPoint(e,o.p);if(d.cl)d.cl.getPoint(e,o.a);else{o.a.set(o.p.x,o.p.y-.05,o.p.z+12)}o.p.applyMatrix4(x.bm);o.a.applyMatrix4(x.bm);o.fov=d.fovF?d.fovF(e):(d.fov||50)},
  // pilotando por fora: a câmera fica atrás do barco e obedece ao dedo
  piloto(t,x,o,d){const ret=x.W<x.H,dist=(ret?30:24)*(1-.1*Math.abs(x.pan||0))*(x.cz||1),alto=(ret?11.5:8.5)*(x.cz||1)+(x.cp||0)*dist,yw=x.yaw+(x.pan||0)+(x.cy||0);const px=x.bp.x-Math.sin(yw)*dist,pz=x.bp.z-Math.cos(yw)*dist,py=Math.max(1.5,alto+Math.sin((x.tJ||0)*.4)*.15);if(!d.ini){d.ini=true;this.lp.set(px,py,pz)}const k=Math.min(1,(x.dtReal||.016)*(x.cIdle<1?5:1.6));this.lp.x+=(px-this.lp.x)*k;this.lp.y+=(py-this.lp.y)*k;this.lp.z+=(pz-this.lp.z)*k;o.p.copy(this.lp);o.a.set(x.bp.x+Math.sin(yw)*20,ret?1.2:2.2,x.bp.z+Math.cos(yw)*20);o.fov=ret?62:50},
  // no leme: olhos da pessoa, com o dedo guiando o olhar
  lemeCam(t,x,o,d){o.p.set(0,2.45,2.32);const fy=x.fy||0,fp=x.fp||0;o.a.set(Math.sin(fy)*Math.cos(fp),2.45+Math.sin(fp),2.32+Math.cos(fy)*Math.cos(fp));o.p.applyMatrix4(x.bm);o.a.applyMatrix4(x.bm);o.fov=x.W<x.H?74:60;d.tremor=0},
  // olhando para o alto, ao pé de uma árvore
  olhaCima(t,x,o,d){const s0=d.s0!==undefined?d.s0:(d.s0=d.sRio-(d.ds||18));this.rp(o.p,s0+t*.9,d.lado*(x.w*.5),d.h||1.2);o.a.copy(d.alvo);o.fov=d.fov||66;d.tremor=.006},
  // final: a grua sobe devagar até o barco virar um ponto de luz no rio
  final(t,x,o,d){const k=ease(t/(d.dur||34));const h=mix(5,128,k*k*(3-2*k)),ds=mix(-22,-110,k),lat=x.lat*(1-k);this.rp(o.p,x.s+ds,lat,h);this.rp(o.a,x.s+mix(10,560,k),0,mix(2.4,36,k));o.fov=mix(56,66,k);d.tremor=.004},
};
export {PLANOS};
