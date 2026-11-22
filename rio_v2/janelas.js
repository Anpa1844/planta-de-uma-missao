// Janelas flutuantes de história. A regra de ouro: nunca cobrir o monumento.
// A cada quadro o prédio é projetado na tela; o cartão procura a maior área livre e desliza até lá, ligado ao prédio por um fio fino.
import * as THREE from 'three';
import {clamp} from './util.js';
const v=new THREE.Vector3();
export class Janelas{
  constructor(MARCOS,caminhoFotos,aoAbrir){this.M=MARCOS;this.caminho=caminhoFotos;this.aoAbrir=aoAbrir;this.ativa=-1;this.x=0;this.y=0;this.op=0;this.alvoOp=0;this.lado=1;this.escala=1;this.pr=-1;this.fIdx=-1;
    const el=this.el=document.getElementById('rJan');this.img=[el.querySelector('#rJanA'),el.querySelector('#rJanB')];this.qual=0;this.ano=el.querySelector('#rJanAno');this.tit=el.querySelector('#rJanTit');this.foto=el.querySelector('.foto');this.ponto=el.querySelector('#rJanPonto');this.fio=document.getElementById('rFioL');this.fioS=document.getElementById('rFio');this.alvo=document.getElementById('rFioP');el.addEventListener('click',()=>{if(this.ativa>=0&&this.op>.3)this.aoAbrir(this.ativa)})}
  mostra(i){if(i===this.ativa||this.bloqueada)return;this.ativa=i;const m=this.M[i];this.ano.textContent=m.ano;this.tit.textContent=m.titulo;this.fIdx=-1;this.fotos=m.fotos;this.foto.style.display=m.fotos.length?'':'none';this.el.classList.toggle('semfoto',!m.fotos.length);this.ponto.innerHTML=m.fotos.length>1?m.fotos.map(()=>'<i></i>').join(''):'';this.alvoOp=1;this.primeira=true;for(const q of this.img){q.classList.remove('on')}this.trocaFoto(0)}
  esconde(){this.alvoOp=0;this.ativa=-1}
  trocaFoto(k){if(!this.fotos||!this.fotos.length||k===this.fIdx)return;this.fIdx=k;const seg=this.img[this.qual=1-this.qual],ant=this.img[1-this.qual];const n=this.fotos[k];seg.onload=()=>{seg.classList.remove('kb0','kb1','kb2');void seg.offsetWidth;seg.classList.add('on','kb'+(k%3));ant.classList.remove('on')};seg.src=this.caminho+n;[...this.ponto.children].forEach((e,j)=>e.classList.toggle('on',j===k));const pre=new Image();if(this.fotos[k+1])pre.src=this.caminho+this.fotos[k+1]}
  // caixa: Box3 do monumento em coordenadas do mundo; progresso: 0..1 da narração
  atualiza(dt,{cam,W,H,caixa,progresso,barcoPos,topoSeg,baixoSeg}){this.op+=(this.alvoOp-this.op)*Math.min(1,dt*3.2);const el=this.el;if(this.op<.004){if(el.style.display!=='none'){el.style.display='none';this.fioS.style.display='none'}return}if(el.style.display==='none'){el.style.display='';this.fioS.style.display=''}
    if(this.fotos&&this.fotos.length>1&&progresso>=0){const k=Math.min(this.fotos.length-1,Math.floor(progresso*this.fotos.length));this.trocaFoto(k)}
    // projeção do monumento na tela
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,vis=0;if(caixa){const a=caixa.min,b=caixa.max;for(let i=0;i<8;i++){v.set(i&1?a.x:b.x,i&2?a.y:b.y,i&4?a.z:b.z);v.project(cam);if(v.z<1&&v.z>-1){vis++;const sx=(v.x*.5+.5)*W,sy=(-v.y*.5+.5)*H;x0=Math.min(x0,sx);x1=Math.max(x1,sx);y0=Math.min(y0,sy);y1=Math.max(y1,sy)}}}
    const retrato=W<H,cw=el.offsetWidth||300,ch=el.offsetHeight||220;const ms=W<480?10:18,topo=topoSeg||58,baixo=baixoSeg||86;const mon=vis>=3?{x0,y0,x1,y1}:null;
    // candidatos: quatro cantos e os meios dos lados
    const cand=retrato?[[(W-cw)/2,topo],[(W-cw)/2,H-ch-baixo-58],[(W-cw)/2,topo+ch*.8]]:[[W-cw-ms,topo],[W-cw-ms,H-ch-baixo],[ms,topo],[ms,H-ch-baixo],[W-cw-ms,(H-ch)/2],[ms,(H-ch)/2],[(W-cw)/2,topo],[(W-cw)/2,H-ch-baixo]];let melhor=null,mp=1e18;
    const area=(ax,ay)=>{if(!mon)return 0;const ox=Math.max(0,Math.min(ax+cw,mon.x1+14)-Math.max(ax,mon.x0-14)),oy=Math.max(0,Math.min(ay+ch,mon.y1+14)-Math.max(ay,mon.y0-14));return ox*oy};
    if(this.primeira){this.x=W-cw-ms;this.y=topo}
    for(const c of cand){const a=area(c[0],c[1]);const dist=Math.hypot(c[0]-this.x,c[1]-this.y);const p=a*a*.01+a*40+dist*.6+(retrato?0:(c[1]===(H-ch)/2?-30:0));if(p<mp){mp=p;melhor=c}}
    // sem espaço livre, o cartão encolhe em vez de cobrir
    const sobra=area(melhor[0],melhor[1])/(cw*ch);const alvoE=retrato?1:(sobra>.02?.62:1);this.escala+=(alvoE-this.escala)*Math.min(1,dt*2.4);
    const kp=this.primeira?1:Math.min(1,dt*2.2);this.x+=(melhor[0]-this.x)*kp;this.y+=(melhor[1]-this.y)*kp;this.primeira=false;
    el.style.transform=`translate3d(${this.x.toFixed(1)}px,${this.y.toFixed(1)}px,0) scale(${this.escala.toFixed(3)})`;el.style.opacity=this.op.toFixed(3);
    // fio até o topo do monumento
    if(mon){const mx=(mon.x0+mon.x1)/2,my=mon.y0+(mon.y1-mon.y0)*.2,qx=clamp(mx,0,W),qy=clamp(my,0,H);const cx=this.x+(this.x+cw/2<qx?cw*this.escala:0),cy=this.y+ch*.3*this.escala;this.fio.setAttribute('x1',cx);this.fio.setAttribute('y1',cy);this.fio.setAttribute('x2',qx);this.fio.setAttribute('y2',qy);this.alvo.setAttribute('cx',qx);this.alvo.setAttribute('cy',qy);this.fioS.style.opacity=(this.op*.8).toFixed(2)}else this.fioS.style.opacity=0;}
}
