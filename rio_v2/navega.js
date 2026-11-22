// O barco no rio: posição, rumo, velocidade, leme com batente, alavanca, meia-volta. Serve para qualquer câmera.
import {sst,mix,clamp,giro} from './util.js';

export class Navega{
  constructor(rio,paradas){this.rio=rio;this.paradas=paradas;this.s=170;this.lat=0;this.v=0;this.dir=1;const o=rio.em(this.s);this.yaw=o.h;this.leme=0;this.virando=false;this.giroLado=1;this.segura=null;this.pegou=null;this.lemeSeg=0;this.batente=false;this.tlPuxa=0;this.tlPega=false;this.alav=.5;this.rpm=0;this.vAuto=9;this.manual=false;this.cabine=false;this.lAlvoExt=0;this.po={};this.dy=0;this.semMotor=false;this.teclaLeme=0}
  iniciaVolta(lado,quem){if(this.dir<0||this.s<120)return false;this.dir=-1;this.virando=true;this.giroLado=lado;this.segura=quem;return true}
  soltaVolta(){this.segura=null;if(this.dir<0){this.dir=1;this.virando=true;this.giroLado=this.lat>0?-1:1}}
  // vAlvo vem do roteiro quando em modo filme; rpm é só para o som
  passo(dt,{vAlvo,rpmAlvo,aoBatente}){const rio=this.rio,o=rio.mundo(this.s,this.lat,this.po),tang=o.h,L=rio.L,MAXV=20,W=o.w;
    // leme
    if(this.teclaLeme){this.leme=clamp(this.leme+this.teclaLeme*dt*1.5,-1,1)}
    if(this.pegou==='leme'||this.teclaLeme){if(Math.abs(this.leme)>.97){if(!this.batente){this.batente=true;aoBatente&&aoBatente()}this.lemeSeg+=dt;if(this.lemeSeg>1.2&&this.dir>0)this.iniciaVolta(this.leme>0?-1:1,'leme')}else{this.batente=false;this.lemeSeg=0}}else{this.batente=false;this.lemeSeg=0;if(this.segura==='leme')this.soltaVolta()}
    // linha do tempo: puxar para trás e segurar dá a volta; soltar retoma
    if(this.tlPega&&this.tlPuxa<-.26&&this.dir>0&&!this.virando)this.iniciaVolta(this.lat>0?-1:1,'linha');if(this.segura==='linha'&&(!this.tlPega||this.tlPuxa>-.12))this.soltaVolta();
    // o leme se ajusta sozinho durante a manobra e volta ao centro quando solto
    if(this.virando)this.leme+=((this.giroLado>0?-.95:.95)-this.leme)*Math.min(1,dt*2.4);else if(this.dir<0||(!this.pegou&&!this.teclaLeme))this.leme+=(0-this.leme)*Math.min(1,dt*(this.dir<0?2.2:1.15));
    let vA=vAlvo,rA=rpmAlvo;
    if(this.dir<0){vA=MAXV;rA=.96}
    if(this.dir>0&&this.tlPuxa>.2&&this.tlPega){const q=(this.tlPuxa-.2)/.8;vA=Math.max(vA,mix(12,MAXV+6,q));rA=mix(.7,1,q)}
    if(this.dir<0&&this.s<90)vA=0;if(this.s>L-70&&this.dir>0)vA=0;
    const yawRio=this.dir>0?tang:tang+Math.PI;const rel=-this.leme*.72;let centro=Math.abs(this.leme)<.08?(this.lAlvoExt-this.lat)*(this.dir>0?.022:-.022):0;if(Math.abs(this.lat)>W*.8)centro=-Math.sign(this.lat)*(this.dir>0?.34:-.34);
    let dy=giro(yawRio+(this.virando?0:rel+centro)-this.yaw);
    if(this.virando){if(this.giroLado*dy<0&&Math.abs(dy)>.5)dy+=6.28319*this.giroLado;if(Math.abs(dy)<.3)this.virando=false}
    const taxa=(this.virando?Math.min(.62,Math.abs(dy)*.9+.14):Math.min(.46,Math.abs(dy)*.95+.012))*sst(.2,3,this.v+(this.virando?2:0));this.yaw+=Math.sign(dy)*Math.min(Math.abs(dy),taxa*dt);this.dy=dy;
    if(this.virando)vA=Math.min(vA,6.8);else{const cv=Math.abs(giro(this.yaw-yawRio));if(cv>.6)vA=Math.min(vA,7.5)}
    this.v+=(vA-this.v)*Math.min(1,dt*(vA>this.v?.32:(vA<.1?.22:.5)));this.rpm+=(rA-this.rpm)*Math.min(1,dt*1.1);
    const da=this.yaw-tang,vx=Math.sin(da)*this.v,vs=Math.cos(da)*this.v;this.s=clamp(this.s+vs*dt,30,L-50);const lim=W*.86;this.lat=clamp(this.lat+vx*dt,-lim,lim);rio.mundo(this.s,this.lat,o);return o}
}
