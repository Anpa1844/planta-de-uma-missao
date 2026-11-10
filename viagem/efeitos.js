// Rastro de espuma que acompanha o trajeto real do barco e borrifos na proa.
import * as THREE from 'three';
export function criaRastro(cena,uni){
  const N=110,pos=new Float32Array(N*2*2*3),a=new Float32Array(N*2*2),idx=[];
  for(let l=0;l<2;l++)for(let i=0;i<N-1;i++){const o=l*N*2+i*2;idx.push(o,o+1,o+2,o+1,o+3,o+2)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aV',new THREE.BufferAttribute(a,1));g.setIndex(idx);
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,uniforms:{uT:uni.uT,tNormal:uni.tNormal,uHora:uni.uHora},vertexShader:`attribute float aV;varying float vA;varying vec2 vP;void main(){vA=aV;vP=position.xz;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D tNormal;uniform float uT,uHora;varying float vA;varying vec2 vP;void main(){float n=texture2D(tNormal,vP*.11+uT*.015).r*.6+texture2D(tNormal,vP*.31-uT*.02).g*.5;float e=smoothstep(.42,.72,n);gl_FragColor=vec4(vec3(.95,.94,.9)*(.3+uHora*.7),vA*e*.7);}`});
  const o=new THREE.Mesh(g,m);o.frustumCulled=false;o.renderOrder=2;cena.add(o);
  const h=[];let t=0;
  const pts=new Float32Array(90*3),vel=[],sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pts,3));for(let i=0;i<90;i++)vel.push({x:0,y:-9,z:0,v:0});
  const gota=(()=>{const q=document.createElement('canvas');q.width=q.height=32;const x=q.getContext('2d'),g=x.createRadialGradient(16,16,1,16,16,16);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,32,32);return new THREE.CanvasTexture(q)})();const pm=new THREE.PointsMaterial({color:0xffffff,size:.2,map:gota,transparent:true,opacity:.32,depthWrite:false,fog:true});const sp=new THREE.Points(sg,pm);sp.frustumCulled=false;cena.add(sp);let ic=0;
  return (dt,b,yaw,v)=>{t+=dt;const sx=Math.sin(yaw),cx=Math.cos(yaw);
    if(t>.09&&v>.4){t=0;h.unshift({x:b.x-sx*7.6,z:b.z-cx*7.6,nx:cx,nz:-sx,t:0,v});if(h.length>N)h.pop()}
    h.forEach(p=>p.t+=dt);
    for(let l=0;l<2;l++){const s=l?1:-1;for(let i=0;i<N;i++){const k=l*N*2+i*2,p=h[Math.min(i,h.length-1)]||{x:b.x,z:b.z,nx:0,nz:0,t:99,v:0};const w=1.1+p.t*1.05,e=w+.9+p.t*.32,vida=Math.max(0,1-p.t/13)*Math.min(1,p.v/5);pos[k*3]=p.x+p.nx*s*w;pos[k*3+1]=.14;pos[k*3+2]=p.z+p.nz*s*w;pos[(k+1)*3]=p.x+p.nx*s*e;pos[(k+1)*3+1]=.14;pos[(k+1)*3+2]=p.z+p.nz*s*e;a[k]=vida;a[k+1]=vida*.3}}
    g.attributes.position.needsUpdate=true;g.attributes.aV.needsUpdate=true;
    const n=v>3?Math.ceil(v*.2):0;for(let i=0;i<n;i++){const q=vel[ic],s=Math.random()<.5?-1:1,bx=b.x+sx*6.2,bz=b.z+cx*6.2;q.x=bx+cx*s*.8;q.y=.15;q.z=bz-sx*s*.8;q.vx=cx*s*(1+Math.random()*2)+sx*v*.2;q.vz=-sx*s*(1+Math.random()*2)+cx*v*.2;q.v=1.3+Math.random()*1.7;ic=(ic+1)%90}
    for(let i=0;i<90;i++){const q=vel[i];if(q.y>-5){q.v-=9*dt;q.x+=(q.vx||0)*dt;q.y+=q.v*dt;q.z+=(q.vz||0)*dt}if(q.y<0)q.y=-9;pts[i*3]=q.x;pts[i*3+1]=q.y;pts[i*3+2]=q.z}sg.attributes.position.needsUpdate=true}
}
