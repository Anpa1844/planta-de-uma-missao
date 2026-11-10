// Animais da Amazônia: araras em voo, garças, boto saltando, jacaré, capivaras e borboletas-azuis.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {LARG,alturaMargem,acaso} from './mundo.js';
const cor=(g,c)=>{const n=g.attributes.position.count,a=new Float32Array(n*3),k=new THREE.Color(c);for(let i=0;i<n;i++){a[i*3]=k.r;a[i*3+1]=k.g;a[i*3+2]=k.b}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g.index?g.toNonIndexed():g};
export function araras(tr,cena,uni,n){
  // corpo e cauda com asas animadas no shader; asa = x fora do corpo
  const asa=(s)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.22,s*.5,0,.2,s*.95,0,-.12,0,0,.22,s*.95,0,-.12,0,0,-.2],3));g.computeVertexNormals();return g};
  const c1=new THREE.ConeGeometry(.13,.8,5);c1.rotateX(Math.PI/2);const c2=new THREE.ConeGeometry(.06,.8,4);c2.rotateX(-Math.PI/2);c2.translate(0,0,-.62);const G=[cor(c1,0xc8202a),cor(c2,0x1d4fb0),cor(asa(1),0xd42a2a),cor(asa(-1),0xd42a2a)];
  const m=[asa(1),asa(-1)];const g0=mergeGeometries(G.map(g=>{const q=new THREE.BufferGeometry();q.setAttribute('position',g.attributes.position);q.setAttribute('color',g.attributes.color);return q}),false);
  // faixas azul e amarela nas pontas
  const ca=g0.attributes.color,pa=g0.attributes.position;for(let i=0;i<pa.count;i++){const x=Math.abs(pa.getX(i));if(x>.75)ca.setXYZ(i,.1,.28,.72);else if(x>.42)ca.setXYZ(i,.95,.75,.15)}
  const ig=new THREE.InstancedBufferGeometry();ig.index=null;ig.setAttribute('position',g0.attributes.position);ig.setAttribute('color',g0.attributes.color);ig.instanceCount=n;
  const p=new Float32Array(n*4),o={};for(let i=0;i<n;i++){const b=Math.floor(i/6),s=(b*163.7+60)%tr.L;tr.em(s,o);p[i*4]=o.x+(acaso()-.5)*10;p[i*4+1]=20+b%5*3+acaso()*4;p[i*4+2]=o.z+(acaso()-.5)*10;p[i*4+3]=b+acaso()*.06}
  ig.setAttribute('aP',new THREE.InstancedBufferAttribute(p,4));
  const mt=new THREE.ShaderMaterial({side:THREE.DoubleSide,vertexColors:true,uniforms:{uT:uni.uT,uHora:uni.uHora},vertexShader:`attribute vec4 aP;uniform float uT;varying vec3 vC;void main(){vC=color;float f=fract(aP.w)*30.;float t=uT+f;float ab=abs(position.x);vec3 q=position*1.25;q.y+=ab*sin(t*9.)*.55;float d=t*.16+aP.w*1.7;float R=95.+mod(aP.w,5.)*14.;vec3 c=aP.xyz+vec3(cos(d)*R,sin(t*.5)*2.,sin(d)*R);float a=-d;mat2 r=mat2(cos(a),-sin(a),sin(a),cos(a));q.xz=r*q.xz;gl_Position=projectionMatrix*viewMatrix*vec4(c+q,1.);}`,fragmentShader:`uniform float uHora;varying vec3 vC;void main(){gl_FragColor=vec4(pow(vC,vec3(2.2))*(.25+uHora*1.1),1.);}`});
  const e=new THREE.Mesh(ig,mt);e.frustumCulled=false;cena.add(e);return e;
}
export function borboletas(tr,cena,uni,n){
  const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.2,-.32,0,.14,-.26,0,-.2,0,0,.2,-.26,0,-.2,0,0,-.2,0,0,.2,.26,0,-.2,.32,0,.14,0,0,.2,0,0,-.2,.26,0,-.2],3));g.instanceCount=n;
  const p=new Float32Array(n*4),o={};for(let i=0;i<n;i++){const s=acaso()*tr.L,e=acaso()<.5?-1:1;tr.em(s,o);const l=e*(LARG-1+acaso()*7);p[i*4]=o.x+o.nx*l;p[i*4+1]=1.2+acaso()*2.5;p[i*4+2]=o.z+o.nz*l;p[i*4+3]=acaso()*30}
  g.setAttribute('aP',new THREE.InstancedBufferAttribute(p,4));
  const m=new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{uT:uni.uT,uHora:uni.uHora},vertexShader:`attribute vec4 aP;uniform float uT;varying float vX;void main(){float t=uT+aP.w;vec3 q=position*1.1;q.y=abs(position.x)*sin(t*13.)*1.1;vec3 c=aP.xyz+vec3(sin(t*.6)*2.4,sin(t*1.4)*.7,cos(t*.47)*2.4);gl_Position=projectionMatrix*viewMatrix*vec4(c+q,1.);}`,fragmentShader:`uniform float uHora;void main(){gl_FragColor=vec4(vec3(.05,.3,1.)*(.35+uHora*1.6),1.);}`});
  const e=new THREE.Mesh(g,m);e.frustumCulled=false;cena.add(e);return e;
}
// Animais em modelo: cada um ganha um comportamento simples
export async function animais(tr,cena,carrega,paradas,uni){
  const lista=[],o={};
  const poe=async(nome,s,lat,y,es,rot)=>{const b=await carrega(nome);if(!b)return null;const q=b.clone(true);tr.em(s,o);q.position.set(o.x+o.nx*lat,y,o.z+o.nz*lat);q.rotation.y=Math.atan2(o.tx,o.tz)+rot;q.scale.setScalar(es);q.userData={s,lat,y};cena.add(q);return q};
  const margem=(s,e,d)=>{const l=e*(LARG+d);return [l,Math.max(.1,alturaMargem(l,s))]};
  for(let i=0;i<9;i++){const s=120+i*165+acaso()*50,e=i%2?1:-1;{const [l,y]=margem(s,e,2.5);const q=await poe('capivara',s,l,y,1,acaso()*6);if(q)lista.push({t:'cap',q,y})}
    if(i%2){const [l,y]=margem(s+22,e,3);const q=await poe('capivara',s+22,l,y,.8,acaso()*6);if(q)lista.push({t:'cap',q,y})}}
  for(let i=0;i<8;i++){const s=170+i*190+acaso()*40,e=i%2?-1:1;const [l,y]=margem(s,e,.5+acaso()*2);const q=await poe('garca',s,l,y,1,acaso()*6);if(q)lista.push({t:'gar',q,y,voo:0,h:q.position.clone()})}
  for(let i=0;i<6;i++){const s=220+i*240+acaso()*40,e=i%2?1:-1,l=e*(LARG-5-acaso()*4);const q=await poe('jacare',s,l,.02,1,1.2);if(q)lista.push({t:'jac',q,s,lat:l,ph:acaso()*6})}
  for(let i=0;i<7;i++){const s=150+i*215+acaso()*40,e=i%2?-1:1;const [l,y]=margem(s,e,-.4);const q=await poe('tartaruga',s,l,Math.max(.05,y),1,acaso()*6);if(q)lista.push({t:'tar',q})}
  const boto=await carrega('boto');const botos=[];if(boto)for(let i=0;i<3;i++){const q=boto.clone(true);q.visible=false;cena.add(q);botos.push({q,t:-acaso()*14-4,dur:1.5,dir:0,p:new THREE.Vector3()})}
  const v=new THREE.Vector3();
  return (dt,tJ,barco,yaw,toca)=>{
    for(const a of lista){if(a.t==='cap'){a.q.position.y=a.y+Math.abs(Math.sin(tJ*.9+a.y*9))*.03}
      else if(a.t==='jac'){const k=Math.sin(tJ*.05+a.ph)*14;tr.em(a.s+k,o);const l=a.lat+Math.sin(tJ*.03+a.ph)*2;a.q.position.set(o.x+o.nx*l,.02+Math.sin(tJ*.7+a.ph)*.02,o.z+o.nz*l)}
      else if(a.t==='gar'){const d=a.q.position.distanceTo(barco.position);if(a.voo===0&&d<20)a.voo=.001;if(a.voo>0){a.voo+=dt*.42;const f=Math.min(1,a.voo/3.4);a.q.position.set(a.h.x+(a.h.x-barco.position.x)*.1*f*4,a.h.y+Math.sin(f*1.57)*24,a.h.z+(a.h.z-barco.position.z)*.1*f*4);if(f>=1){a.q.visible=false;a.voo=-1}}}}
    for(const b of botos){b.t+=dt;if(b.t>0&&!b.q.visible){const f=14+Math.random()*26,s=(Math.random()-.5)*16;b.p.set(barco.position.x+Math.sin(yaw)*f+Math.cos(yaw)*s,0,barco.position.z+Math.cos(yaw)*f-Math.sin(yaw)*s);b.dir=yaw+(Math.random()<.5?.6:-.6);b.q.visible=true;b.a=0;toca&&toca(b.p)}
      if(b.q.visible){b.a+=dt/b.dur;const k=b.a,al=Math.sin(k*3.14)*1.9-.7;b.q.position.set(b.p.x+Math.sin(b.dir)*(k-.5)*6,al,b.p.z+Math.cos(b.dir)*(k-.5)*6);b.q.rotation.set((k-.5)*1.5,b.dir,0,'YXZ');if(k>=1){b.q.visible=false;b.t=-9-Math.random()*16;toca&&toca(v.set(b.p.x+Math.sin(b.dir)*3,0,b.p.z+Math.cos(b.dir)*3))}}}
  };
}
