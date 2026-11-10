// Uniformes globais e a luz compartilhada: céu, floresta, água, barco e bichos respondem à mesma hora do dia.
import * as THREE from 'three';

export const U={
  uTempo:{value:0},uCam:{value:new THREE.Vector3()},
  uSolDir:{value:new THREE.Vector3(0,.4,-1).normalize()},uSolCor:{value:new THREE.Color(3,2.8,2.5)},
  uAmbCeu:{value:new THREE.Color(.7,.8,1)},uAmbHor:{value:new THREE.Color(.6,.6,.6)},uAmbChao:{value:new THREE.Color(.1,.1,.08)},
  uNevoaCor:{value:new THREE.Color(.5,.55,.6)},uNevoaSol:{value:new THREE.Color(1,.8,.6)},uNevoaP:{value:new THREE.Vector4(.002,.04,8,0)},
  tRuido:{value:null},tTopo:{value:null},uTopoC:{value:new THREE.Vector4(0,0,1/640,24)},
  uVento:{value:new THREE.Vector3(1,0,.3)},uMolhado:{value:0},uFolhaBrilho:{value:1},
  uSombraMapa:{value:null},uSombraMat:{value:new THREE.Matrix4()},uSombraLiga:{value:0},
  uNoite:{value:0},uRelampago:{value:0},
};

export const GLSL_LUZ=`
uniform vec3 uCam,uSolDir,uSolCor,uAmbCeu,uAmbHor,uAmbChao,uNevoaCor,uNevoaSol;uniform vec4 uNevoaP,uTopoC;uniform float uTempo,uMolhado,uNoite;
uniform sampler2D tRuido,tTopo;
vec3 ambiente(vec3 n){float h=n.y*.5+.5;return mix(uAmbChao,mix(uAmbHor,uAmbCeu,smoothstep(.5,1.,h)),smoothstep(.04,.56,h));}
vec3 comNevoa(vec3 c,vec3 wp){vec3 v=wp-uCam;float d=length(v);v/=max(d,.001);float b=uNevoaP.y,k=b*v.y,a=uNevoaP.x*exp(-b*max(uCam.y-uNevoaP.w,0.));
  float f=a*(abs(k)>1e-4?(1.-exp(-k*d))/k:d);float t=1.-exp(-max(f,0.));float s=pow(max(dot(v,uSolDir),0.),uNevoaP.z);return mix(c,mix(uNevoaCor,uNevoaSol,s),t);}
float copaEm(vec3 wp){vec2 o=uSolDir.xz/max(uSolDir.y,.14);vec2 uv=(wp.xz+o*max(uTopoC.w-wp.y,0.)-uTopoC.xy)*uTopoC.z+.5;
  float m=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);float g=texture2D(tTopo,uv).g*m;float n=texture2D(tRuido,wp.xz*.019).g;float e=texture2D(tRuido,wp.xz*.061).r;return smoothstep(.34,.72,g+(n-.5)*.62+(e-.5)*.3);}
`;
export const GLSL_SOMBRA=`
uniform sampler2D uSombraMapa;uniform mat4 uSombraMat;uniform float uSombraLiga;
float desempacota(vec4 v){return dot(v,vec4(1./(256.*256.*256.),1./(256.*256.),1./256.,1.)*(255./256.)*vec4(1.));}
`;
export const GLSL_LUZ_U=()=>({uCam:U.uCam,uSolDir:U.uSolDir,uSolCor:U.uSolCor,uAmbCeu:U.uAmbCeu,uAmbHor:U.uAmbHor,uAmbChao:U.uAmbChao,uNevoaCor:U.uNevoaCor,uNevoaSol:U.uNevoaSol,uNevoaP:U.uNevoaP,uTopoC:U.uTopoC,uTempo:U.uTempo,uMolhado:U.uMolhado,uNoite:U.uNoite,tRuido:U.tRuido,tTopo:U.tTopo});

// Faz um material padrão do Three obedecer à névoa e à sombra das copas deste mundo
export function integra(m,{copa=true,extra=null,chave=''}={}){
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,GLSL_LUZ_U());
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMundo;').replace('#include <project_vertex>',`#include <project_vertex>
      {vec4 _w=vec4(transformed,1.);
      #ifdef USE_INSTANCING
      _w=instanceMatrix*_w;
      #endif
      vMundo=(modelMatrix*_w).xyz;}`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vMundo;\n'+GLSL_LUZ).replace('#include <fog_fragment>','gl_FragColor.rgb=comNevoa(gl_FragColor.rgb,vMundo);');
    if(copa)sh.fragmentShader=sh.fragmentShader.replace('#include <lights_fragment_begin>',`#include <lights_fragment_begin>
      `).replace('#include <aomap_fragment>',`#include <aomap_fragment>
      {float _c=1.-copaEm(vMundo)*.86;reflectedLight.directDiffuse*=_c;reflectedLight.directSpecular*=_c;}`);if(extra)extra(sh)};
  m.customProgramCacheKey=()=>'rio'+(copa?1:0)+chave;m.fog=false;m.needsUpdate=true;return m;
}
