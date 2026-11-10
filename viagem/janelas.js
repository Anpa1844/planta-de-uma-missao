// Janelas digitais flutuantes: cada marco tem um cartão de informações e suas fotos.
// Ficam pairando sobre a água; quando o barco chega perto, vêm até ele; quando ele se afasta, voltam para o lugar.
import * as THREE from 'three';

const VS=`varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const FS=`uniform sampler2D t;uniform float uAt,uT,uAsp,uF;varying vec2 vU;
float caixa(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
void main(){vec2 p=(vU-.5)*vec2(uAsp,1.),b=vec2(uAsp,1.)*.5;float d=caixa(p,b-.014,.04);float a=smoothstep(.005,-.005,d);if(a<.01)discard;
  vec2 uv=(vU-.5)*1.03+.5;vec3 c=texture2D(t,uv).rgb*1.22;
  float linha=smoothstep(.012,.003,abs(d+.016)),brilho=exp(-abs(d+.016)*30.);
  float varre=smoothstep(.07,0.,abs(fract(vU.y-uT*.11)-.5))*(.05+.05*uAt);c+=vec3(.7,.86,1.)*varre;
  vec3 ouro=vec3(1.,.76,.36);c=mix(c,ouro*(1.7+.5*sin(uT*2.3)),linha);c+=ouro*brilho*(.16+.2*uAt);
  gl_FragColor=vec4(c,a*uF);}`;

function quebra(x,txt,larg){const pal=txt.split(/\s+/),l=[];let a='';for(const p of pal){const n=a?a+' '+p:p;if(x.measureText(n).width>larg&&a){l.push(a);a=p}else a=n}if(a)l.push(a);return l}
function cartao(m){
  const c=document.createElement('canvas');c.width=1024;c.height=768;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,1024,768);g.addColorStop(0,'#143532');g.addColorStop(1,'#0c2422');x.fillStyle=g;x.fillRect(0,0,1024,768);
  x.strokeStyle='rgba(232,180,90,.14)';x.lineWidth=1;for(let i=0;i<24;i++){x.beginPath();x.moveTo(0,i*32);x.lineTo(1024,i*32);x.stroke();x.beginPath();x.moveTo(i*43,0);x.lineTo(i*43,768);x.stroke()}
  x.fillStyle='#e8b45a';x.font='400 170px Chetta,Georgia,serif';x.textBaseline='top';x.fillText(m.ano,62,42);
  x.fillStyle='#fff';x.font='700 56px Georgia,serif';let y=242;for(const l of quebra(x,m.titulo,900).slice(0,3)){x.fillText(l,62,y);y+=68}
  x.fillStyle='#e8b45a';x.fillRect(62,y+14,120,5);y+=46;
  x.fillStyle='#d9e3df';x.font='400 38px Georgia,serif';for(const l of quebra(x,m.evento,900).slice(0,5)){x.fillText(l,62,y);y+=50}
  x.fillStyle='#e8b45a';x.font='700 26px Arial,sans-serif';x.fillText('TOQUE PARA LER A HISTÓRIA  ›',62,700);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}

export function criaJanelas({MARCOS,PONTOS,paradas,tr,cena,tl,LARG,alvos,uT}){
  const grupo=new THREE.Group();cena.add(grupo);const lista=[],plano=new THREE.PlaneGeometry(1,1),o={},porMarco=[],cacheFoto={};
  const H0=3.5;
  MARCOS.forEach((m,i)=>{const e=PONTOS[i].e,si=paradas[i],itens=[{card:true},...m.fotos.slice(0,4).map(f=>({f}))],doMarco=[];
    itens.forEach((it,k)=>{
      const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:VS,fragmentShader:FS,uniforms:{t:{value:null},uAt:{value:0},uT,uAsp:{value:1.333},uF:{value:0}}});
      const q=new THREE.Mesh(plano,mat);q.userData={i,k};q.renderOrder=8;q.visible=false;grupo.add(q);alvos.push(q);
      // lugar de repouso: em arco sobre a água, antes do prédio, voltado para quem chega
      const ds=-40-k*9.6;tr.em(si+ds,o);const lat=e*(LARG-5.5-(k%2)*2.2),y=7.2+(k%2)*1.8;
      const casa={p:new THREE.Vector3(o.x+o.nx*lat,y,o.z+o.nz*lat),ry:Math.atan2(-o.tx*.82-o.nx*e*.58,-o.tz*.82-o.nz*e*.58)};
      const f={q,mat,i,k,it,asp:1.333,casa,casaQ:new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),casa.ry),k2:0,carregou:false,p:new THREE.Vector3(),q1:new THREE.Quaternion(),s1:new THREE.Vector3(1,1,1),cl:null,fase:i*1.7+k};
      lista.push(f);doMarco.push(f)});
    porMarco.push(doMarco)});
  const carrega=f=>{if(f.carregou)return;f.carregou=true;if(f.it.card){f.mat.uniforms.t.value=cartao(MARCOS[f.i]);return}
    const n=f.it.f;(cacheFoto[n]||(cacheFoto[n]=tl.loadAsync('fotos/'+n))).then(t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;f.mat.uniforms.t.value=t;f.asp=t.image.width/t.image.height;f.mat.uniforms.uAsp.value=f.asp})};
  const v=new THREE.Vector3(),v2=new THREE.Vector3(),q0=new THREE.Quaternion(),m4=new THREE.Matrix4(),up=new THREE.Vector3(0,1,0),olhoM=new THREE.Vector3();
  let tTroca=0,prin=0,prinMarco=-1;
  // ctx: s, ativa (índice do marco ou -1), cam, W, H, dt, t, modo ('fora'|'cabine'), pr (progresso da narração ou -1), az (direção da janela em relação ao barco), barco, olho (posição do olho no barco)
  const atualiza=c=>{
    const sum=porMarco[c.ativa]||[];if(c.ativa!==prinMarco){prinMarco=c.ativa;prin=0;tTroca=0}
    if(sum.length){if(c.pr>=0)prin=Math.floor(c.pr*sum.length*.999)%sum.length;else{tTroca+=c.dt;if(tTroca>7){tTroca=0;prin=(prin+1)%sum.length}}}
    if(c.manual!=null&&sum[c.manual])prin=c.manual;
    const retrato=c.W/c.H<1,D=retrato?15:18,vh=2*Math.tan(c.cam.fov*.00872665)*D,vw=vh*c.W/c.H;
    olhoM.copy(c.olho).applyMatrix4(c.barco.matrixWorld);
    for(const f of lista){const dist=Math.abs(paradas[f.i]-c.s),perto=dist<430;f.q.visible=perto;if(!perto)continue;carrega(f);
      const al=f.i===c.ativa?1:0;f.k2+=(al-f.k2)*Math.min(1,c.dt*1.55);const e=f.k2*f.k2*(3-2*f.k2),t=c.t+f.fase;
      f.mat.uniforms.uAt.value=f.k2;f.mat.uniforms.uF.value=Math.min(1,f.mat.uniforms.uF.value+c.dt*1.2)*(f.mat.uniforms.t.value?1:0);
      // repouso: flutua de leve
      f.p.copy(f.casa.p);f.p.y+=Math.sin(t*.8)*.28;f.p.x+=Math.sin(t*.33)*.2;q0.copy(f.casaQ);let sx=H0*f.asp,sy=H0;
      if(e>.002){let rel=sum.indexOf(f)-prin;if(rel<0)rel+=sum.length;const n=sum.length;let lado=0,pos=0;if(rel>0){lado=rel%2?1:-1;pos=Math.ceil(rel/2)}
        const pv=f.asp,tv=new THREE.Vector3();let tw,th;
        if(c.modo==='fora'){
          // a janela principal fica do lado oposto ao prédio, para não cobrir o que se quer ver
          const lt=PONTOS[f.i].e>0?1:-1,maxW=(retrato?.8:.36)*vw,maxH=(retrato?.2:.42)*vh;th=Math.min(maxH,maxW/pv);tw=th*pv;
          const cx=retrato?0:lt*vw*.29,ty=retrato?vh*.075:vh*.14;
          if(rel===0)v.set(cx,ty,-D);
          else{const thb=(retrato?.1:.13)*vh,twb=thb*pv;
            if(retrato)v.set((rel-(n)/2)*(vw/Math.max(1,n-1))*.86,ty-maxH/2-thb*.62,-D-.5);
            else v.set(cx+(rel-(n)/2)*Math.min(twb*1.08,maxW/Math.max(1,n-1)*1.05),ty-th/2-thb*.62,-D-.5);th=thb;tw=twb}
          if(!f.cl)f.cl=v.clone();f.cl.lerp(v,Math.min(1,c.dt*3.2));v2.copy(f.cl).applyMatrix4(c.cam.matrixWorld);q0.slerp(c.cam.quaternion,e);f.p.lerp(v2,e)
        }else{
          // na cabine, a janela contorna o barco por fora e aparece na abertura para onde a pessoa olha
          const R=9.6,azv=c.az+(rel?lado*(.4+.36*(pos-1)):0),yb=c.olho.y+(rel?-.15:.5);v.set(c.olho.x+Math.sin(azv)*R,yb,c.olho.z+Math.cos(azv)*R);th=rel?1.9:3.1;tw=th*pv;if(tw>(rel?3.2:5.2)){tw=rel?3.2:5.2;th=tw/pv}
          v2.copy(v).applyMatrix4(c.barco.matrixWorld);m4.lookAt(olhoM,v2,up);const qq=new THREE.Quaternion().setFromRotationMatrix(m4);q0.slerp(qq,e);f.p.lerp(v2,e);f.cl=null}
        sx=sx+(tw-sx)*e;sy=sy+(th-sy)*e}
      else f.cl=null;
      f.q.position.copy(f.p);f.q.quaternion.copy(q0);f.q.scale.set(sx,sy,1);
      const sobre=c.modo==='fora'&&f.k2>.45;f.mat.depthTest=!sobre;f.q.renderOrder=sobre?30+(f===sum[prin]?2:0):8;
    }};
  return {grupo,lista,porMarco,atualiza,escolhe:(i,k)=>{prinMarco=i;prin=k;tTroca=0}};
}
