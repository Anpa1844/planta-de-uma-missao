// Pós-processamento próprio: bloom, raios de sol, tom cinematográfico, sépia, vinheta e grão.
import * as THREE from 'three';
const VS=`varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export class Pos{
  constructor(r,tier){
    this.r=r;this.tier=tier;this.rt=null;this.cena=new THREE.Scene();this.cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    this.q=new THREE.Mesh(new THREE.PlaneGeometry(2,2));this.q.frustumCulled=false;this.cena.add(this.q);
    this.uF={tC:{value:null},tB:{value:null},tR:{value:null},uT:{value:0},uAntigo:{value:0},uVin:{value:1},uFade:{value:0},uBloom:{value:.42},uRaio:{value:0},uTemp:{value:0},uTarja:{value:0},uAsp:{value:1}};
    this.mFim=new THREE.ShaderMaterial({uniforms:this.uF,vertexShader:VS,depthTest:false,depthWrite:false,fragmentShader:`
      uniform sampler2D tC,tB,tR;uniform float uT,uAntigo,uVin,uFade,uBloom,uRaio,uTemp,uTarja,uAsp;varying vec2 vU;
      vec3 aces(vec3 x){x*=.92;return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
      float rnd(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      void main(){vec3 c=texture2D(tC,vU).rgb;c+=texture2D(tB,vU).rgb*uBloom;c+=texture2D(tR,vU).rgb*uRaio;
        c=aces(c);c=pow(c,vec3(1./2.2));
        float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,1.12);c=mix(c,c*c*(3.-2.*c),.26);
        c*=vec3(1.+uTemp*.05,1.,1.-uTemp*.07);
        vec3 sep=vec3(l*1.06+.03,l*.93+.015,l*.72);c=mix(c,sep,uAntigo);
        vec2 q=vU-.5;float v=1.-dot(q,q)*1.15*uVin;c*=mix(1.,v,.9);
        c+=(rnd(vU*vec2(913.,711.)+fract(uT)*91.)-.5)*(.022+uAntigo*.03);
        float t=step(abs(vU.y-.5),.5-uTarja);c*=t;c*=uFade;gl_FragColor=vec4(c,1.);}`});
    this.mClaro=new THREE.ShaderMaterial({uniforms:{t:{value:null}},vertexShader:VS,depthTest:false,depthWrite:false,fragmentShader:`uniform sampler2D t;varying vec2 vU;void main(){vec3 c=min(texture2D(t,vU).rgb,vec3(6.));float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(.95,1.9,l),1.);}`});
    this.mBlur=new THREE.ShaderMaterial({uniforms:{t:{value:null},d:{value:new THREE.Vector2()}},vertexShader:VS,depthTest:false,depthWrite:false,fragmentShader:`uniform sampler2D t;uniform vec2 d;varying vec2 vU;void main(){vec3 c=texture2D(t,vU).rgb*.227;c+=(texture2D(t,vU+d*1.385).rgb+texture2D(t,vU-d*1.385).rgb)*.316;c+=(texture2D(t,vU+d*3.231).rgb+texture2D(t,vU-d*3.231).rgb)*.07;gl_FragColor=vec4(c,1.);}`});
    this.mRaio=new THREE.ShaderMaterial({uniforms:{t:{value:null},uS:{value:new THREE.Vector2(.5,.5)}},vertexShader:VS,depthTest:false,depthWrite:false,fragmentShader:`uniform sampler2D t;uniform vec2 uS;varying vec2 vU;void main(){vec2 d=(uS-vU)/22.;vec2 p=vU;vec3 c=vec3(0.);float w=1.;for(int i=0;i<22;i++){c+=min(texture2D(t,p).rgb,vec3(4.))*w;w*=.935;p+=d;}gl_FragColor=vec4(c/22.,1.);}`});
    this.mCopia=new THREE.ShaderMaterial({uniforms:{t:{value:null}},vertexShader:VS,depthTest:false,depthWrite:false,fragmentShader:`uniform sampler2D t;varying vec2 vU;void main(){gl_FragColor=texture2D(t,vU);}`});
  }
  tam(w,h){
    const flt=this.r.extensions.has('EXT_color_buffer_float')||this.r.extensions.has('EXT_color_buffer_half_float');const tp=flt?THREE.HalfFloatType:THREE.UnsignedByteType,op={type:tp,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false};
    [this.rt,this.a,this.b,this.c,this.d,this.raio].forEach(x=>x&&x.dispose());
    this.rt=new THREE.WebGLRenderTarget(w,h,{...op,depthBuffer:true,samples:this.tier>=2?2:0});this.rt.depthTexture=new THREE.DepthTexture(w,h,THREE.UnsignedIntType);
    const W=Math.max(2,w>>2),H=Math.max(2,h>>2);this.a=new THREE.WebGLRenderTarget(W,H,op);this.b=new THREE.WebGLRenderTarget(W,H,op);this.c=new THREE.WebGLRenderTarget(W>>2,H>>2,op);this.d=new THREE.WebGLRenderTarget(W>>2,H>>2,op);this.raio=new THREE.WebGLRenderTarget(W,H,op);
    this.uF.uAsp.value=w/h;
  }
  passa(m,alvo){this.q.material=m;this.r.setRenderTarget(alvo);this.r.render(this.cena,this.cam)}
  blur(de,para,w,h,dx,dy){this.mBlur.uniforms.t.value=de.texture;this.mBlur.uniforms.d.value.set(dx/w,dy/h);this.passa(this.mBlur,para)}
  render(cena,cam,solTela){
    const r=this.r;r.setRenderTarget(this.rt);r.clear();r.render(cena,cam);
    if(this.tier===0){this.uF.tC.value=this.rt.texture;this.uF.tB.value=this.a.texture;this.uF.tR.value=this.raio.texture;this.uF.uBloom.value=0;this.uF.uRaio.value=0;this.passa(this.mFim,null);return}
    this.mClaro.uniforms.t.value=this.rt.texture;this.passa(this.mClaro,this.a);
    const w=this.a.width,h=this.a.height;this.blur(this.a,this.b,w,h,1,0);this.blur(this.b,this.a,w,h,0,1);
    this.mCopia.uniforms.t.value=this.a.texture;this.passa(this.mCopia,this.c);const W=this.c.width,H=this.c.height;this.blur(this.c,this.d,W,H,1,0);this.blur(this.d,this.c,W,H,0,1);this.blur(this.c,this.d,W,H,2,0);this.blur(this.d,this.c,W,H,0,2);
    if(solTela&&this.tier>=2&&this.uF.uRaio.value>.01){this.mRaio.uniforms.t.value=this.a.texture;this.mRaio.uniforms.uS.value.copy(solTela);this.passa(this.mRaio,this.raio)}
    this.uF.tC.value=this.rt.texture;this.uF.tB.value=this.c.texture;this.uF.tR.value=this.raio.texture;this.passa(this.mFim,null);
  }
}
