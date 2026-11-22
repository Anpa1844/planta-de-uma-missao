// Rodada 2 · O holofote do teto: a única luz de fora da Luzeiro. Aceso à noite, iluminando o caminho; de dia, apagado.
// Rodada 3: feixe mais estreito e mais discreto (cone 0,15 rad, 60% da densidade, luz 18).
// Três peças leves: um SpotLight sem sombra (ilumina a proa e o que for material padrão), um cone "volumétrico" falso (aditivo)
// e uma poça de luz aditiva sobre a água adiante da proa (a água tem shader próprio e não recebe luzes do three).
import * as THREE from 'three';
const sst=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
export function criaHolofote({B,T=2}){
  const anc=B.anc,g=new THREE.Group();g.name='holofote';const no=B.acha(/LZ_Searchlight/i);
  const p=new THREE.Vector3(0,anc.teto+.45,anc.cab.max.z-.5);if(no){const b=B.caixa(no);b.getCenter(p);p.z=b.max.z+.02}
  const alvo=new THREE.Vector3(p.x*.25,0,anc.casco.max.z+24),dir=alvo.clone().sub(p),L=dir.length();dir.normalize();
  const luz=new THREE.SpotLight(0xffe6bf,0,70,.24,.7,1.1);luz.position.copy(p);luz.target.position.copy(alvo);luz.castShadow=false;g.add(luz,luz.target);
  const un={uK:{value:0}},un2={uK:{value:0}};
  // cone: tronco aberto do farol até a água; some para as bordas (de lado fica mais denso no eixo) e ao longo do comprimento
  const R=Math.tan(.15)*L,ge=new THREE.CylinderGeometry(.09,R,L,T>=1?28:16,1,true);ge.translate(0,-L/2,0);
  const cone=new THREE.Mesh(ge,new THREE.ShaderMaterial({uniforms:un,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    vertexShader:`varying float vY;varying vec3 vN,vV;void main(){vY=uv.y;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uK;varying float vY;varying vec3 vN,vV;void main(){float f=abs(dot(normalize(vN),normalize(vV)));float a=pow(f,1.6)*pow(vY,1.7)*(.4+.6*vY)*.05*uK;gl_FragColor=vec4(vec3(1.,.93,.74)*a,1.);}`}));
  cone.position.copy(p);cone.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),dir);cone.renderOrder=27;cone.frustumCulled=false;g.add(cone);
  // poça de luz na água: elipse alongada no rumo
  const poca=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({uniforms:un2,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,
    vertexShader:`varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uK;varying vec2 vU;void main(){vec2 q=vU*2.-1.;float d=length(q);float a=exp(-d*d*3.4)*smoothstep(1.,.5,d)*.04*uK;gl_FragColor=vec4(vec3(1.,.92,.72)*a,1.);}`}));
  poca.rotation.x=-Math.PI/2;poca.scale.set(R*2.3,R*5.2,1);poca.position.set(alvo.x,.3,alvo.z+R*.4);poca.renderOrder=26;poca.frustumCulled=false;g.add(poca);
  // rodada 4: halo pequeno NA LENTE do holofote (acompanha o barco; de longe vira um ponto de luz no teto)
  const cv=document.createElement('canvas');cv.width=cv.height=64;{const c=cv.getContext('2d'),gr=c.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,246,225,1)');gr.addColorStop(.25,'rgba(255,230,190,.55)');gr.addColorStop(1,'rgba(255,220,170,0)');c.fillStyle=gr;c.fillRect(0,0,64,64)}
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0}));halo.position.copy(p);halo.renderOrder=28;g.add(halo);
  const pW=new THREE.Vector3(),eixo=new THREE.Vector3(),vc=new THREE.Vector3(),qW=new THREE.Quaternion();
  let k=0;g.visible=false;
  return {grupo:g,luz,pos:p,alvo,get k(){return k},
    // alvoK 0..1 (noite); dentro: câmera dentro da cabine (o cone não é desenhado por dentro)
    // rodada 4 (defeito do final noturno: "uma luz separada do barco"): o cone falso visto de cima ou ao longo do eixo virava um disco branco
    // solto na água (com o aro da base aparecendo como um arco pontilhado), e a poça a 24 m da proa somava-se a ele. Agora o cone some com a
    // distância e quando a câmera olha ao longo do feixe; a poça some de longe; fica o halo pequeno na lente.
    atualiza(dt,alvoK,dentro,cam){k+=(alvoK-k)*Math.min(1,dt*1.4);if(k<.004){if(g.visible){g.visible=false;luz.intensity=0}return}g.visible=true;luz.intensity=k*18;
      let kC=1,kP=1,d=20;if(cam){g.updateWorldMatrix(true,false);pW.copy(p).applyMatrix4(g.matrixWorld);g.getWorldQuaternion(qW);eixo.copy(dir).applyQuaternion(qW);vc.copy(pW).sub(cam.position);d=vc.length();vc.multiplyScalar(1/Math.max(d,1e-3));
        const ca=Math.abs(vc.dot(eixo));kC=(1-sst(22,55,d))*(1-sst(.55,.85,ca));kP=1-sst(30,80,d);halo.scale.setScalar(Math.max(.55,d*.012))}
      un.uK.value=k*kC;un2.uK.value=k*kP;cone.visible=!dentro&&kC>.01;poca.visible=kP>.01;halo.material.opacity=k*(dentro?0:.85);halo.visible=!dentro}};
}
