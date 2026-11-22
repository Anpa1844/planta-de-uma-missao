// Mapa visto de cima, redesenhado só quando o barco anda: altura do chão (R) e sombra das copas (G).
// Com ele a água, o chão, o barco e os bichos recebem a sombra de milhares de árvores sem nenhum desenho extra por quadro.
import * as THREE from 'three';
import {U} from './nucleo.js';

export class Topo{
  constructor(r,T,terreno,fl){this.r=r;this.fl=fl;this.E=[520,640,720][T];this.N=[320,512,768][T];this.cx=1e9;this.cz=1e9;
    this.rt=new THREE.WebGLRenderTarget(this.N,this.N,{depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,wrapS:THREE.ClampToEdgeWrapping,wrapT:THREE.ClampToEdgeWrapping});U.tTopo.value=this.rt.texture;
    this.uC={value:new THREE.Vector3()};const cena=this.cena=new THREE.Scene();this.cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    const mT=new THREE.ShaderMaterial({uniforms:{uC:this.uC},depthTest:false,depthWrite:false,side:THREE.DoubleSide,blending:THREE.NoBlending,
      vertexShader:`uniform vec3 uC;varying float vY;void main(){vY=position.y;gl_Position=vec4((position.xz-uC.xy)*uC.z*2.,0.,1.);}`,
      fragmentShader:`varying float vY;void main(){gl_FragColor=vec4(clamp((vY+6.)/12.,0.,1.),0.,0.,1.);}`});
    const te=new THREE.Mesh(terreno.geometry,mT);te.frustumCulled=false;te.renderOrder=0;cena.add(te);
    const cap=this.cap=[1500,3000,5000][T];const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3));g.setIndex([0,1,2,0,2,3]);this.ia=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3);this.ia.setUsage(THREE.DynamicDrawUsage);g.setAttribute('iA',this.ia);g.instanceCount=0;
    const mC=new THREE.ShaderMaterial({uniforms:{uC:this.uC},depthTest:false,depthWrite:false,transparent:true,blending:THREE.CustomBlending,blendEquation:THREE.MaxEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneFactor,
      vertexShader:`uniform vec3 uC;attribute vec3 iA;varying vec2 vQ;varying float vS;void main(){vQ=position.xy;vS=iA.x*7.+iA.y;gl_Position=vec4((iA.xy+position.xy*iA.z-uC.xy)*uC.z*2.,0.,1.);}`,
      fragmentShader:`varying vec2 vQ;varying float vS;void main(){float a=atan(vQ.y,vQ.x);float r=length(vQ)*(1.+.2*sin(a*5.+vS)+.12*sin(a*11.+vS*2.));gl_FragColor=vec4(0.,smoothstep(1.,.42,r),0.,1.);}`});
    this.gc=g;const cc=new THREE.Mesh(g,mC);cc.frustumCulled=false;cc.renderOrder=1;cena.add(cc);}
  atualiza(x,z,forca){const passo=this.E/this.N;if(!forca&&Math.hypot(x-this.cx,z-this.cz)<this.E*.12)return;this.cx=Math.round(x/passo)*passo;this.cz=Math.round(z/passo)*passo;this.uC.value.set(this.cx,this.cz,1/this.E);
    const f=this.fl;let n=0;const a=this.ia.array,E=this.E*.56;const {X,Z,Va,E:Es}=f;for(const b of f.blocos){if(Math.hypot(b.x-this.cx,b.z-this.cz)>E+b.raio)continue;for(let q=0;q<b.l.length;q++){const i=b.l[q],v=f.vars[Va[i]];if(!v.topo)continue;const dx=X[i]-this.cx,dz=Z[i]-this.cz;if(Math.abs(dx)>E||Math.abs(dz)>E||n>=this.cap)continue;const k=n*3;a[k]=X[i]+v.g1.cx*Es[i]||X[i];a[k+1]=Z[i]+v.g1.cz*Es[i]||Z[i];a[k+2]=v.raio*Es[i]*.78;n++}}
    this.gc.instanceCount=n;this.ia.needsUpdate=true;
    const r=this.r,sc=r.getClearColor(this._c||(this._c=new THREE.Color())),sa=r.getClearAlpha(),ac=r.autoClear;r.setClearColor(0x000000,1);r.autoClear=true;r.setRenderTarget(this.rt);r.render(this.cena,this.cam);r.setRenderTarget(null);r.setClearColor(sc,sa);r.autoClear=ac;
    U.uTopoC.value.set(this.cx,this.cz,1/this.E,U.uTopoC.value.w);}
}
