// A lanterna-símbolo do evento. O metal vem de modelos/lanterna_*.glb, feito por preparo/lanterna_modela.py e lanterna_pinta.py
// a partir de REVISTA/CAPA/Elementos/LANTERNA.jpg. Aqui ficam o que muda em tempo real: vidro, chama, clarão e reflexos.
import * as THREE from 'three';

const E=.48/659; // metros por pixel da referência
// Ambiente refletido: cabine escura, janelas ao amanhecer e o clarão da chama em cima.
function criaAmbiente(renderer){
  const s=new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(10,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:`varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 p;void main(){float h=p.y*.5+.5;vec3 c=mix(vec3(.3,.26,.22),vec3(.13,.115,.1),smoothstep(.15,.7,h));gl_FragColor=vec4(c,1.);}`})));
  const luz=(c,i,sx,sy,x,y,z)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(sx,sy),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i),side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);s.add(m)};
  luz(0xfff7ee,3.6,3.2,2.6,-5,1.2,4.4);luz(0xf0f4ff,2.8,2.4,2.6,5.2,1,3.4);luz(0xfff2e4,2,1.6,3,0,.8,-6);luz(0xffd6a8,2.2,1.4,1.4,0,4,0);
  const g=new THREE.PMREMGenerator(renderer),t=g.fromScene(s,.02).texture;g.dispose();return t;
}
// Limita e neutraliza a luz da chama a poucos centímetros do metal, para o cobre manter a cor da referência.
function luzContida(m,lim){m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <lights_fragment_begin>',THREE.ShaderChunk.lights_fragment_begin.replace('getPointLightInfo( pointLight, geometryPosition, directLight );',`getPointLightInfo( pointLight, geometryPosition, directLight );{float mx=max(directLight.color.r,max(directLight.color.g,directLight.color.b));directLight.color*=min(1.,${lim.toFixed(2)}/max(mx,1e-3));directLight.color=mix(directLight.color,vec3(dot(directLight.color,vec3(.33))),.45);}`))};m.needsUpdate=true;return m}

export function criaLanterna(renderer,T=2,carrega){
  const G=new THREE.Group(),env=criaAmbiente(renderer);let metais=[];
  if(carrega)carrega('lanterna_'+['c','b','a'][T]).then(s=>{if(!s)return;const q=s.clone(true);q.traverse(o=>{if(o.isMesh){const m=o.material;m.envMap=env;m.envMapIntensity=1.1;luzContida(m,1.1);metais.push(m);o.castShadow=false;o.receiveShadow=T>=2}});G.add(q)});
  // Só o tanque e o queimador projetam sombra: a dos tubos cortaria o mapa em cunhas duras
  {const p=[[.01,0],[159,20],[137,60],[137,118],[61,160],[48,197],[89,205],[60,213]].map(([r,h])=>new THREE.Vector2(r*E,h*E));const s=new THREE.Mesh(new THREE.LatheGeometry(p,16),new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false}));s.castShadow=true;s.renderOrder=-5;G.add(s)}
  // Vidro: fresnel e os reflexos das janelas, em retângulos largos como na referência
  const unV={uBrilho:{value:0}};
  const vidroMat=lado=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:lado,uniforms:unV,
    vertexShader:`varying vec3 vN,vP;varying float vY;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;vN=mat3(modelMatrix)*normal;vY=position.y;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float uBrilho;varying vec3 vN,vP;varying float vY;
      float janela(vec3 r,vec3 d,float w,float h){vec3 x=normalize(cross(d,vec3(0.,1.,0.))),y=cross(x,d);float a=dot(r,x)/max(dot(r,d),.001),b=dot(r,y)/max(dot(r,d),.001);return step(0.,dot(r,d))*smoothstep(w,w*.62,abs(a))*smoothstep(h,h*.62,abs(b));}
      void main(){vec3 n=normalize(vN),v=normalize(cameraPosition-vP);if(!gl_FrontFacing)n=-n;float f=pow(1.-abs(dot(n,v)),2.6);vec3 r=reflect(-v,n);
        float j=janela(r,normalize(vec3(-.6,.28,.75)),.62,.72)+janela(r,normalize(vec3(.72,.34,.6)),.42,.8)*.7;float d=exp(-pow((vY-.225)/.06,2.));
        vec3 c=vec3(.92,.86,.74)*f*.5+vec3(1.,.97,.9)*j*.24+vec3(1.,.56,.22)*d*uBrilho*.2;
        float a=clamp(.012+f*.42+j*.16+d*uBrilho*.05,0.,.7);gl_FragColor=vec4(c,a);}`});
  const pV=[[83,214],[87,219],[92.5,227],[96.5,235],[100,243],[103.5,259],[106.5,275],[108.5,283],[110,299],[112,315],[113,331],[111.5,339],[110.5,347],[108.5,363],[106,379],[102,395],[98,411],[93,423],[88,431],[85,435]].map(([r,h])=>new THREE.Vector2(r*E,h*E));
  const vg=new THREE.LatheGeometry(pV,T>=1?64:32),vB=new THREE.Mesh(vg,vidroMat(THREE.BackSide)),vF=new THREE.Mesh(vg,vidroMat(THREE.FrontSide));vB.renderOrder=3;vF.renderOrder=6;G.add(vB,vF);
  // Chama e clarão calculados no shader, sem textura de gradiente (no Safari ela gerava pontos coloridos)
  const VS=`varying vec2 vU;void main(){vU=uv;vec4 c=modelViewMatrix*vec4(0.,0.,0.,1.);vec3 e=vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),1.);c.xy+=position.xy*e.xy;gl_Position=projectionMatrix*c;}`;
  const unC={uT:{value:0},uA:{value:0}};
  const chamaM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:unC,vertexShader:VS,
    fragmentShader:`uniform float uT,uA;varying vec2 vU;float n(float x){return sin(x)*.5+sin(x*2.31+1.7)*.3+sin(x*4.7+.4)*.2;}
      void main(){vec2 p=vU*2.-1.;float y=vU.y;p.x+=n(uT*6.+y*4.)*.07*y*y*2.;float w=mix(.78,.0,pow(y,1.3))*smoothstep(0.,.1,y);float d=abs(p.x)/max(w,.002);
        float corpo=smoothstep(1.,.3,d)*smoothstep(1.,.84,y),nucleo=smoothstep(.66,.08,d)*smoothstep(.06,.24,y)*smoothstep(.74,.3,y),azul=smoothstep(.2,.02,y)*smoothstep(1.,.2,d);
        vec3 c=mix(vec3(1.,.3,.04)*1.8,vec3(1.,.58,.18)*2.7,corpo*corpo);c=mix(c,vec3(1.,.84,.56)*3.8,nucleo);gl_FragColor=vec4((c*corpo+vec3(.1,.28,1.)*azul*.8)*uA,1.);}`});
  const chama=new THREE.Mesh(new THREE.PlaneGeometry(1,1),chamaM);chama.scale.set(.034,.066,1);chama.position.set(0,.228,0);chama.renderOrder=4;chama.frustumCulled=false;G.add(chama);
  const unH={uA:{value:0}};
  const haloM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,uniforms:unH,vertexShader:VS,
    fragmentShader:`uniform float uA;varying vec2 vU;void main(){float k=max(0.,1.-length(vU*2.-1.));k=k*k*(1.+k*2.);gl_FragColor=vec4(vec3(1.,.5,.17)*k*${T>=1?'.1':'.2'}*uA,1.);}`});
  const halo=new THREE.Mesh(new THREE.PlaneGeometry(1,1),haloM);halo.scale.set(.56,.56,1);halo.position.set(0,.228,0);halo.renderOrder=7;halo.frustumCulled=false;G.add(halo);
  // Sombra de contato sob a base, para todas as qualidades
  const somb=new THREE.Mesh(new THREE.PlaneGeometry(.6,.6),new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:`varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vU;void main(){float r=length(vU-.5)*.6;float a=smoothstep(.2,.104,r)*.74;gl_FragColor=vec4(.018,.01,.005,a);}`}));
  somb.rotation.x=-Math.PI/2;somb.position.y=.0015;somb.renderOrder=1;G.add(somb);
  // acesa: 0 a 1. fl: tremor da chama. A chama nasce baixa e cresce.
  G.userData.atualiza=(t,acesa,fl)=>{unC.uT.value=t;unC.uA.value=acesa;unH.uA.value=acesa*fl;unV.uBrilho.value=acesa*fl;const c=.45+.55*acesa;chama.scale.set(.034*c*(.94+fl*.06),.066*c*(.9+fl*.12),1);chama.position.y=.196+.033*c;const e=.72+.28*acesa*fl;for(const m of metais)m.envMapIntensity=1.1*e};
  G.userData.chamaY=.228;
  return G;
}
