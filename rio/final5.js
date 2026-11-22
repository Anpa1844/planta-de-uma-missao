// O final da viagem (V5). Depois da última parada a grua sobe devagar e revela o que o rio guardava para o fim:
// a foz se abrindo na baía, Belém acesa do outro lado da água, as palafitas com lamparina nas duas margens,
// a névoa baixa que a lua acende, os vaga-lumes, as luzes das comunidades se espalhando pela mata e o barco, pequeno e iluminado.
// Tudo nasce de código (instâncias e shaders), nada é criado dentro do laço, e o grupo inteiro fica invisível antes do trecho final.
// Contrato com main.js: criaFinal(ctx) devolve {atualiza(dt,e), camera(t,x,o,d,dr), pronto()}; e.k vai de 0 a 1 ao longo do final.
import * as THREE from 'three';
import {GLSL_LUZ,GLSL_LUZ_U,U,integra} from './nucleo.js';
import {rng,sst,mix,clamp,giro} from './util.js';
import {quadroBaia,criaBaia,criaCopaFinal} from './terreno.js';
import {palafita,trapiche,canoa} from './vila.js';

const QUAD=()=>{const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3));g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array([0,0,1,0,1,1,0,1]),2));g.setIndex([0,1,2,0,2,3]);return g};
const inst=(g,nome,arr,n)=>g.setAttribute(nome,new THREE.InstancedBufferAttribute(new Float32Array(arr),n));
const malha=(g,m,ord)=>{const q=new THREE.Mesh(g,m);q.frustumCulled=false;q.renderOrder=ord;return q};
const BILL=`vec3 cx=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]),cy=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);`;
// quanto da luz atravessa a névoa até a câmera (a mesma conta de comNevoa, para usar no vértice)
const NEV_V=`uniform vec4 uNevoaP;float passa(vec3 wp){vec3 v=wp-uCam;float d=length(v);v/=max(d,.001);float b=uNevoaP.y,k=b*v.y,a=uNevoaP.x*exp(-b*max(uCam.y-uNevoaP.w,0.));float f=a*(abs(k)>1e-4?(1.-exp(-k*d))/k:d);return exp(-max(f,0.));}`;
const ALT=112,REC=400,DUR=48;   // altura final da grua, recuo rio acima (a câmera fica sempre sobre a água, e o barco nunca some atrás das copas), duração

// o final em uso, para o diretor achar a coreografia mesmo quando o plano é pedido sem parâmetros
let ATUAL=null;export const finalAtual=()=>ATUAL;

export function criaFinal(ctx){
  const {T,cena,rio,ceu,clima,obras,ef,r}=ctx,K=obras.K,B=quadroBaia(rio),R=rng(2027),grupo=new THREE.Group(),o={},v3=new THREE.Vector3();cena.add(grupo);
  const un={uK:{value:0},uKF:{value:0},uLamp:{value:0},uVaga:{value:0},uNev:{value:0},uPx:{value:.0012},uBarco:{value:new THREE.Vector3()},uBK:{value:0},uTempo:U.uTempo,uCam:U.uCam,uNevoaP:U.uNevoaP,uNevoaCor:U.uNevoaCor,uNevoaSol:U.uNevoaSol,uSolDir:U.uSolDir,uSolCor:U.uSolCor,tRuido:U.tRuido};
  const pontos={A:[],C:[],D:[]},riscos={A:[],C:[],D:[]};
  // modo do ponto: 0 cidade · 1 sinal vermelho de topo · 2 lamparina · 3 luz de comunidade · 4 boia · 5 farol
  const ponto=(x,y,z,cor,f,raio,px,modo,nasc=0,sem=R())=>{pontos.A.push(x,y,z,sem);pontos.C.push(cor[0]*f,cor[1]*f,cor[2]*f);pontos.D.push(raio,px,modo,nasc)};
  // reflexo comprido na água, da base da luz em direção a quem olha
  const risco=(x,z,cor,f,comp,larg,modo,nasc=0,sem=R())=>{riscos.A.push(x,z,sem,comp);riscos.C.push(cor[0]*f,cor[1]*f,cor[2]*f);riscos.D.push(larg,modo,nasc,0)};
  const SODIO=[1,.6,.26],BRANCO=[.86,.93,1],CHAMA=[1,.56,.2],RUBRO=[1,.08,.04],VERDE=[.1,1,.45];

  // ---------- 1. a baía: copas das margens que se abrem e da outra margem ----------
  {const b=criaBaia(rio,T);if(b)grupo.add(b)}
  const dossel=criaCopaFinal(rio,T);if(dossel)grupo.add(dossel);

  // ---------- 2. Belém do outro lado da água ----------
  const cidade=new THREE.Vector3();B.P(B.D+260,-80,40,cidade);
  {const L=[];const D0=B.D;   // cada volume: x, y, z, largura, altura, fundo, semente, tipo
    // tipo: 0 casario · 1 torre · 2 galpão das Docas · 3 cais · 4 Mercado de Ferro · 5 torreão · 6 igreja e forte · 7 antena · 8 farol
    const add=(l,pf,w,h,f,tipo=0,y=2.4)=>{B.P(D0+pf,l,y,v3);L.push(v3.x,v3.y,v3.z,w,h,f,R(),tipo);return v3};
    add(0,480,B.MEIA*2+200,3.4,1010,3,-1);
    // RODADA 2 · escala real (1 unidade = 1 m; fontes e ressalvas em BELEM_SKYLINE.md).
    // Belém não tem prédio de 150 m: o mais alto listado tem 134 m e os dez mais altos ficam entre 113 e 134 m (CTBUH). A cidade é baixa
    // (casario de 2 a 4 pavimentos na Cidade Velha e na Campina) e as torres ficam agrupadas no Umarizal/Reduto, em Nazaré e em Batista Campos.
    // De quem chega pela água: Cidade Velha à direita (Forte, Sé), depois Ver-o-Peso e Docas, e as torres à esquerda e ao fundo.
    // bairro: [centro ao longo da orla, espalhamento, fundo mínimo, fundo máximo, altura máxima, peso]
    const bairros=[[-650,250,110,760,122,.42],[-170,170,170,620,92,.14],[170,250,560,960,112,.26],[720,210,640,960,104,.18]],NT=[60,104,150][T],NB=[110,200,320][T];
    const sinal=(l,pf,h)=>{B.P(D0+pf,l,2.4+h+3,v3);ponto(v3.x,v3.y,v3.z,RUBRO,2.2,.6,2.2,1)};
    for(let i=0;i<NT;i++){let q=R(),bq=bairros[0];for(const b of bairros){if(q<b[5]){bq=b;break}q-=b[5]}
      const l=clamp(bq[0]+(R()+R()+R()-1.5)*bq[1],-B.MEIA+30,B.MEIA-40),pf=bq[2]+R()*(bq[3]-bq[2]),h=34+Math.pow(R(),1.9)*(bq[4]-34),w=17+R()*11,f=15+R()*9;add(l,pf,w,h,f,1);
      if(h>60&&R()<.5)add(l,pf,w*.5,3+R()*4,f*.5,1,2.4+h);if(h>96)sinal(l,pf,h)}
    // os mais altos, com a altura publicada (posição aproximada dentro do bairro): ICONIQ 134 · Mont Tremblant 123 · Aquarius 121 ·
    // Village Sun e Village Moon 120 (gêmeas) · Manoel Pinto da Silva 108 (1958, no centro)
    for(const [l,pf,h,w] of[[-560,300,134,24],[-820,420,123,22],[-690,560,121,22],[-470,190,120,21],[-432,190,120,21],[110,700,108,30]]){add(l,pf,w,h,w*.8,1);sinal(l,pf,h)}
    // casario: 2 a 4 pavimentos, alguns prédios de 6 a 9 andares no Comércio
    for(let i=0;i<NB;i++){const l=(R()*2-1)*(B.MEIA-20),pf=24+R()*930,alto=R()<.12&&pf>120;add(l,pf,12+R()*26,alto?18+R()*12:5.5+R()*R()*9,10+R()*22,0)}
    // a orla histórica: Forte do Presépio na ponta, a Sé (duas torres), o Mercado de Ferro do Ver-o-Peso (quatro torreões), os três galpões das Docas
    add(1040,34,80,7,50,6);add(885,130,28,20,58,6);for(const a of[-1,1])add(885+a*11,102,8,36,8,6);
    add(650,40,36,9,36,4);for(const [a,b] of[[-1,-1],[1,-1],[-1,1],[1,1]])add(650+a*18,40+b*18,5,17,5,5);
    for(let k=0;k<3;k++)add(170+k*148,30,120,10.5,20,2);for(const l of[130,250,400,520])add(l,10,2.2,17,2.2,7);
    // Basílica de Nazaré ao fundo (corpo de 62 × 24 × 20 m, torres de 42 m)
    add(330,900,24,20,62,6);for(const a of[-1,1])add(330+a*9,872,7,42,7,6);
    // torre de telecomunicação (ilustrativa, 96 m) e o Farol de Belém, no Mangal das Garças (torre metálica de 47 m)
    add(-990,640,4,96,4,7);for(const y of[52,99]){B.P(D0+640,-990,y,v3);ponto(v3.x,v3.y,v3.z,RUBRO,2.2,.6,2.2,1)}
    add(1128,8,5,47,5,8);B.P(D0+8,1128,50,v3);ponto(v3.x,v3.y,v3.z,BRANCO,2.2,.8,2.6,5);risco(v3.x,v3.z,BRANCO,.4,420,7,0);
    const n=L.length/8,cubo=new THREE.BoxGeometry(1,1,1);cubo.translate(0,.5,0);const g=new THREE.InstancedBufferGeometry();g.index=cubo.index;g.setAttribute('position',cubo.attributes.position);g.setAttribute('normal',cubo.attributes.normal);
    const iP=new Float32Array(n*3),iS=new Float32Array(n*3),iR=new Float32Array(n*2);for(let i=0;i<n;i++){iP.set(L.slice(i*8,i*8+3),i*3);iS.set(L.slice(i*8+3,i*8+6),i*3);iR.set(L.slice(i*8+6,i*8+8),i*2)}
    g.setAttribute('iP',new THREE.InstancedBufferAttribute(iP,3));g.setAttribute('iS',new THREE.InstancedBufferAttribute(iS,3));g.setAttribute('iR',new THREE.InstancedBufferAttribute(iR,2));g.instanceCount=n;
    const m=new THREE.ShaderMaterial({uniforms:{...GLSL_LUZ_U(),uK:un.uK,uGiro:{value:new THREE.Vector2(Math.cos(B.rumo),Math.sin(B.rumo))}},
      vertexShader:`attribute vec3 iP,iS;attribute vec2 iR;uniform vec2 uGiro;varying vec3 vMundo,vL,vN,vS;varying vec2 vR;
        void main(){float c=uGiro.x,s=uGiro.y;vec3 q=position*iS;vL=q;vS=iS;vR=iR;vec3 w=vec3(q.x*c+q.z*s,q.y,-q.x*s+q.z*c)+iP;vN=vec3(normal.x*c+normal.z*s,normal.y,-normal.x*s+normal.z*c);vMundo=w;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
      fragmentShader:`${GLSL_LUZ}uniform float uK;varying vec3 vMundo,vL,vN,vS;varying vec2 vR;
        float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
        void main(){vec3 n=normalize(vN);float tipo=vR.y,sem=vR.x;
          vec3 alb=mix(vec3(.3,.3,.31),vec3(.62,.6,.56),fract(sem*3.7));
          if(tipo>.5&&tipo<1.5)alb=mix(vec3(.4,.46,.52),vec3(.7,.69,.66),step(.5,fract(sem*7.)));
          else if(tipo>1.5&&tipo<2.5)alb=vec3(.74,.66,.3);else if(tipo>2.5&&tipo<3.5)alb=vec3(.1,.1,.1);else if(tipo>3.5&&tipo<5.5)alb=vec3(.22,.34,.42);else if(tipo>5.5&&tipo<6.5)alb=vec3(.84,.82,.76);else if(tipo>6.5)alb=vec3(.5,.5,.5);
          float nl=max(dot(n,uSolDir),0.);vec3 c=alb*(ambiente(n)*.9+uSolCor*nl*.7);
          // janelas: uma grade por fachada; cada janela sorteia se está acesa e, de tempos em tempos, sorteia de novo (a cidade cintila devagar)
          float lado=step(abs(n.y),.5),face=step(.5,abs(n.x));float u=mix(vL.x,vL.z,face);vec2 cel=vec2(u/4.,vL.y/3.1);vec2 id=floor(cel)+floor(sem*91.)+face*17.;vec2 f=fract(cel);
          float rr=h21(id),ocup=mix(.3,.6,fract(sem*5.3));float vez=floor(uTempo*.06+rr*11.);float acesa=step(1.-ocup,fract(rr*7.13+vez*.618));
          float jan=smoothstep(.12,.2,f.x)*smoothstep(.88,.8,f.x)*smoothstep(.2,.3,f.y)*smoothstep(.86,.76,f.y);float px=max(fwidth(cel.x),fwidth(cel.y));
          vec2 cg=cel*vec2(.5,.5);vec2 ig=floor(cg)+floor(sem*91.)+face*17.;float rg=h21(ig+3.);float medio=step(1.-ocup*.7,fract(rg*7.13+floor(uTempo*.05+rg*11.)*.618))*(.25+.6*fract(rg*23.7));
          float luz=mix(mix(acesa*jan*(.5+.9*fract(rr*31.7)),acesa*(.3+.5*fract(rr*31.7)),smoothstep(.3,.8,px)),medio,smoothstep(.9,1.8,px));luz=mix(luz,ocup*.3,smoothstep(2.2,4.5,px))*lado;
          vec3 cj=mix(mix(vec3(1.,.6,.26),vec3(1.,.78,.5),fract(rr*3.3)),vec3(.8,.9,1.),step(.86,fract(rr*13.3)));cj=mix(cj,vec3(1.,.42,.14),step(.9,fract(rr*5.1)));float g=1.7;
          if(tipo<.5){luz*=.7;}
          else if(tipo<1.5){float coroa=step(.55,fract(sem*11.3))*smoothstep(vS.y-3.2,vS.y-2.2,vL.y)*lado;luz+=coroa*.9;cj=mix(cj,mix(vec3(.5,.8,1.),vec3(1.,.8,.5),step(.5,fract(sem*17.))),coroa);}
          else if(tipo<2.5){luz=lado*(.5-.3*vL.y/vS.y)+step(.5,n.y)*.08;cj=vec3(1.,.74,.3);g=1.5;}
          else if(tipo<3.5){luz=0.;}
          else if(tipo<5.5){luz=lado*(.42-.2*vL.y/vS.y);cj=vec3(.75,.9,1.);g=1.4;}
          else if(tipo<6.5){luz=lado*(.62-.36*vL.y/vS.y);cj=vec3(1.,.86,.62);g=1.5;}
          else if(tipo<7.5){luz=0.;}else{luz=lado*.3;cj=vec3(1.,.9,.75);g=1.4;}
          vec3 f0=comNevoa(vec3(0.),vMundo),f1=comNevoa(vec3(1.),vMundo);float tr=f1.r-f0.r;
          // a bruma junto ao chão da cidade pega a cor das luzes
          vec3 cor=c*tr+f0+vec3(1.,.58,.26)*uK*.05*(1.-tr)*exp(-max(vMundo.y,0.)/46.)+cj*luz*uK*g*(.3+.7*tr);
          gl_FragColor=vec4(cor,1.);}`});
    grupo.add(malha(g,m,-2));
    // ilhas baixas de várzea e mangue na baía, entre quem chega e a cidade (ilustrativas: lembram a ilha das Onças e o Combu, sem copiar a carta).
    // Copas de 12 a 24 m, escuras; uma malha só, por instâncias.
    {const A=[],S=[];const ilha=(d0,l0,comp,larg,n)=>{for(let i=0;i<n;i++){const t=R()*2-1,u=(R()+R()-1),bd=Math.sqrt(Math.max(0,1-t*t)),d=d0+u*larg*.5*bd,l=l0+t*comp*.5;if(B.terra(d,l)>-45)continue;
        const k=bd*(1-.5*Math.abs(u)),rr=(9+R()*13)*(.6+.4*k),h=(11+R()*13)*(.45+.55*k);B.P(d,l,-1.5,v3);A.push(v3.x,v3.y,v3.z,R());S.push(rr,h,rr*(.8+R()*.4))}};
      const ni=[40,70,110][T];ilha(1180,-700,560,150,ni);ilha(960,640,460,130,ni);ilha(1500,-380,260,70,ni>>1);ilha(1440,410,300,80,ni>>1);ilha(620,-520,220,60,ni>>2);
      const n=A.length/4;if(n){const ico=new THREE.IcosahedronGeometry(1,1),g=new THREE.InstancedBufferGeometry();g.setAttribute('position',ico.attributes.position);if(ico.index)g.index=ico.index;inst(g,'iA',A,4);inst(g,'iS',S,3);g.instanceCount=n;
        grupo.add(malha(g,new THREE.ShaderMaterial({uniforms:{...GLSL_LUZ_U()},
          vertexShader:`attribute vec4 iA;attribute vec3 iS;varying vec3 vMundo,vN;varying float vS;void main(){vec3 p=position;p.y=max(p.y,-.15);vec3 w=p*iS+iA.xyz;vN=normalize(position/iS);vS=iA.w;vMundo=w;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
          fragmentShader:`${GLSL_LUZ}varying vec3 vMundo,vN;varying float vS;void main(){vec3 n=normalize(vN);vec3 alb=mix(vec3(.035,.07,.03),vec3(.07,.11,.04),vS)*(.55+.45*smoothstep(-.2,.8,n.y));
            vec3 c=alb*(ambiente(n)+uSolCor*max(dot(n,uSolDir),0.)*.6);gl_FragColor=vec4(comNevoa(c,vMundo),1.);}`}),-2))}}
    // postes da orla, ruas, e o reflexo de tudo isso riscando a baía
    const pq=[34,17,12][T];for(let l=-B.MEIA;l<=B.MEIA;l+=pq){B.P(D0+2+R()*5,l,8.5+R()*2,v3);const br=R()<.14;ponto(v3.x,v3.y,v3.z,br?BRANCO:SODIO,1.5,.5,br?2.2:2.5,0)}
    const nr=[36,70,110][T];for(let i=0;i<nr;i++){const l=(i+.5+(R()-.5)*.8)/nr*2*B.MEIA-B.MEIA,q=R();B.P(D0-4,l,0,v3);risco(v3.x,v3.z,q<.7?SODIO:q<.9?BRANCO:q<.95?RUBRO:VERDE,.5+R()*.8,-(.28+R()*.34),6+R()*8,0)}
    const ns=[90,200,330][T];for(let i=0;i<ns;i++){B.P(D0+40+R()*880,(R()*2-1)*B.MEIA,6+R()*8,v3);const br=R()<.2;ponto(v3.x,v3.y,v3.z,br?BRANCO:SODIO,1.1,.5,2,0)}
    // boias do canal piscando verde e vermelho, e barcos fundeados na baía
    for(let d=160;d<1500;d+=260)for(const e of[-1,1]){B.P(d,e*(70+.12*d),1.6,v3);const sm=R();ponto(v3.x,v3.y,v3.z,e>0?RUBRO:VERDE,2.2,.4,2.6,4,0,sm);risco(v3.x,v3.z,e>0?RUBRO:VERDE,.2,60,3,3,0,sm)}
    for(let i=0,k=0;k<[5,9,14][T]&&i<200;i++){const d=260+R()*1650,l=(R()*2-1)*900;if(B.terra(d,l)>-90||Math.abs(l)<140)continue;k++;B.P(d,l,5+R()*4,v3);ponto(v3.x,v3.y,v3.z,BRANCO,1.6,.4,2.3,0);ponto(v3.x+2,2.2,v3.z+1,CHAMA,1.2,.4,2,0);risco(v3.x,v3.z,BRANCO,.3,90+R()*90,4,0)}
  }

  // ---------- 3. palafitas, trapiches e canoas nas duas margens do trecho final e na boca da baía ----------
  const lampP=[];   // posição de cada lamparina no mundo, para os vaga-lumes rondarem as casas
  {const casas=[[],[],[]],trap=[[],[]],can=[];const q4=new THREE.Quaternion(),eY=new THREE.Vector3(0,1,0),esc=new THREE.Vector3();
    const mat=(x,y,z,ry,s)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),q4.setFromAxisAngle(eY,ry).clone(),esc.set(s,s,s).clone());
    const casa=(x,y,z,ry,sem,i)=>{const v=i%3;casas[v].push({m:mat(x,y,z,ry,.95+R()*.2),sem})};
    const passo=[40,24,17][T];let i=0;
    for(const [a,b] of[[3676,3836],[3884,4046],[4092,4256],[4292,4396]])for(let s=a;s<b;s+=passo*(.75+R()*.5)){const lado=i%2?1:-1;i++;if(lado<0&&s<3704)continue;
      const lat=lado*(rio.borda(s,lado)-1.5+R()*3.5);rio.mundo(s,lat,o);const ry=Math.atan2(-o.nx*lado,-o.nz*lado),sem=R();casa(o.px,Math.max(.12,rio.altura(s,lat)*.6),o.pz,ry+(R()-.5)*.5,sem,i);
      if(i%4===1){const la=lado*(rio.borda(s+9,lado)-3);rio.mundo(s+9,la,o);trap[i%8===1?1:0].push({m:mat(o.px,0,o.pz,ry,1),sem:R()})}
      if(i%2===0||T>1){const la=lado*(rio.borda(s+5,lado)-6-R()*5);rio.mundo(s+5,la,o);can.push({m:mat(o.px,-.06,o.pz,ry+1.3+R()*.5,.9+R()*.3),sem:1})}}
    // a vila da boca da baía: casas com os pés na água, de frente para a baía
    for(const lado of[-1,1])for(let d=46;d<[240,430,560][T];d+=[60,48,40][T]*(.8+R()*.4)){let a=4,b=3000;for(let k=0;k<22;k++){const c=(a+b)/2;if(B.terra(d,lado*c)>0)b=c;else a=c}
      B.P(d,lado*(a-5-R()*3),.12,v3);const ry=Math.atan2(-lado*B.nx,-lado*B.nz);i++;casa(v3.x,.12,v3.z,ry+(R()-.5)*.6,R(),i);
      if(i%3===0){B.P(d+7,lado*(a-13),-.06,v3);can.push({m:mat(v3.x,-.06,v3.z,ry+1.4,1),sem:1})}}
    // material de madeira que recebe a luz da lamparina da própria casa; as aberturas (porta e janelas) acendem por dentro
    const uLampK=un.uLamp,cache=new Map();
    const madeira=(m0,chave,P,forca)=>{const kq=m0.uuid+chave;if(cache.has(kq))return cache.get(kq);const m=m0.clone();m.userData={};m.emissive=new THREE.Color(0,0,0);m.envMapIntensity=.04;const jan=m0===K.escuro;
      integra(m,{copa:true,chave:'pal'+(jan?'J':'M'),extra:sh=>{sh.uniforms.uLampK=uLampK;sh.uniforms.uLampP={value:P};sh.uniforms.uLampF={value:forca};
        sh.vertexShader=sh.vertexShader.replace('varying vec3 vMundo;','varying vec3 vMundo;varying vec3 vLoc;varying float vSem;attribute float iSem;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLoc=position;vSem=iSem;');
        sh.fragmentShader=sh.fragmentShader.replace('varying vec3 vMundo;','varying vec3 vMundo;varying vec3 vLoc;varying float vSem;uniform float uLampK,uLampF;uniform vec3 uLampP;').replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
          {float on=smoothstep(vSem*.7,vSem*.7+.2,uLampK)*step(.14,fract(vSem*7.31))*uLampF;float fl=.85+.1*sin(uTempo*9.+vSem*50.)+.05*sin(uTempo*23.7+vSem*90.);
          ${jan?`totalEmissiveRadiance+=vec3(1.,.58,.22)*on*fl*(1.5+.8*sin(vLoc.x*9.+vSem*30.)*sin(vLoc.y*7.));`:`vec3 dl=uLampP-vLoc;float d2=dot(dl,dl);vec3 nL=normalize(cross(dFdx(vLoc),dFdy(vLoc)));float nl=abs(dot(nL,dl))*inversesqrt(d2+1e-4)*.7+.3;
          totalEmissiveRadiance+=diffuseColor.rgb*vec3(1.,.55,.2)*(on*fl*nl*9./(1.+d2*.2));`}}`)}});cache.set(kq,m);return m};
    const semeia=(modelo,lista,chave,P,forca=1)=>{if(!lista.length)return;modelo.updateMatrixWorld(true);const sem=new Float32Array(lista.map(q=>q.sem)),tm=new THREE.Matrix4();
      modelo.traverse(a=>{if(!a.isMesh)return;const im=new THREE.InstancedMesh(a.geometry,madeira(a.material,chave,P,forca),lista.length);lista.forEach((q,k)=>im.setMatrixAt(k,tm.multiplyMatrices(q.m,a.matrixWorld)));a.geometry.setAttribute('iSem',new THREE.InstancedBufferAttribute(sem,1));im.frustumCulled=false;im.castShadow=false;im.receiveShadow=false;grupo.add(im)});
      // a chama: um ponto de luz, o reflexo na água e um endereço para os vaga-lumes
      if(forca>0)for(const q of lista){v3.copy(P).applyMatrix4(q.m);ponto(v3.x,v3.y,v3.z,CHAMA,2.2,.34,3.4,2,q.sem);risco(v3.x,v3.z,CHAMA,.55,11,1.7,2,q.sem);lampP.push(v3.x,v3.y,v3.z)}};
    for(let v=0;v<3;v++){const W=5.6+v*1.3,Dc=4.6+(v%2)*1.2;semeia(palafita(K,v),casas[v],'c'+v,new THREE.Vector3(W*.3,4.42,Dc/2+.95))}
    semeia(trapiche(K,12),trap[0],'t0',new THREE.Vector3(0,3.1,11.4));semeia(trapiche(K,15,true),trap[1],'t1',new THREE.Vector3(0,3.9,12));
    semeia(canoa(K,6.2),can,'cn',new THREE.Vector3(0,-200,0),0);
  }

  // ---------- 4. as luzes das comunidades: acendem do barco para o horizonte, pela mata e pela beira da baía ----------
  {const n=[150,300,520][T],A0=rio.em(3650,{});let k=0;
    for(let i=0;i<n*8&&k<n;i++){let x,z,y;if(R()<.5){const s=3320+R()*1075,lado=R()<.5?-1:1,lat=lado*(rio.borda(s,lado)+26+R()*R()*1500);rio.mundo(s,lat,o);x=o.px;z=o.pz;y=Math.abs(lat)<rio.larg(s)+120?7+R()*10:B.copa(x,z)+.6}
      else{const d=R()*R()*6500-200,l=(R()*2-1)*5200,t=B.terra(d,l);if(t<30||(t>520&&R()<.8))continue;if(d>B.D-60&&d<B.D+1050&&Math.abs(l)<B.MEIA+100)continue;B.P(d,l,0,v3);x=v3.x;z=v3.z;y=B.copa(x,z)*sst(0,90,t)+.6}
      k++;ponto(x,y,z,CHAMA,2,.42,2.6,3,clamp(Math.hypot(x-A0.x,z-A0.z)/4600+R()*.08))}}

  // malhas dos pontos de luz e dos reflexos
  {const g=QUAD();inst(g,'iA',pontos.A,4);inst(g,'iC',pontos.C,3);inst(g,'iD',pontos.D,4);g.instanceCount=pontos.A.length/4;
    grupo.add(malha(g,new THREE.ShaderMaterial({uniforms:un,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`attribute vec4 iA,iD;attribute vec3 iC;uniform float uK,uKF,uLamp,uTempo,uPx;uniform vec3 uCam;${NEV_V}varying vec3 vC;varying vec2 vU;
        void main(){float modo=iD.z,s=iA.w,a;
          if(modo<.5)a=uK*(.8+.2*sin(uTempo*(1.3+s*2.4)+s*40.));
          else if(modo<1.5)a=uK*smoothstep(-.1,.5,sin(uTempo*(1.5+s*.6)+s*30.));
          else if(modo<2.5)a=smoothstep(iD.w*.7,iD.w*.7+.2,uLamp)*step(.14,fract(iD.w*7.31))*(.84+.1*sin(uTempo*9.+iD.w*50.)+.06*sin(uTempo*23.7+iD.w*90.));
          else if(modo<3.5)a=smoothstep(iD.w*.82,iD.w*.82+.12,uKF)*(.72+.28*sin(uTempo*(.7+s*1.4)+s*40.));
          else if(modo<4.5)a=uK*step(.84,fract(uTempo*.3+s));
          else a=uK*(.3+3.*pow(max(sin(uTempo*.9+s),0.),24.));
          if(a<.004){gl_Position=vec4(2.,2.,2.,1.);return;}
          ${BILL}float d=distance(iA.xyz,uCam);vC=iC*a*mix(1.,passa(iA.xyz),.7);vU=uv;float rr=max(iD.x,d*uPx*iD.y);
          gl_Position=projectionMatrix*viewMatrix*vec4(iA.xyz+(cx*position.x+cy*position.y)*rr,1.);}`,
      fragmentShader:`varying vec3 vC;varying vec2 vU;void main(){float d=length(vU-.5)*2.;float a=exp(-d*d*13.)*2.6+exp(-d*3.4)*.2;gl_FragColor=vec4(vC*a*smoothstep(1.,.7,d),1.);}`}),25))}
  {const g=QUAD();inst(g,'iA',riscos.A,4);inst(g,'iC',riscos.C,3);inst(g,'iD',riscos.D,4);g.instanceCount=riscos.A.length/4;
    grupo.add(malha(g,new THREE.ShaderMaterial({uniforms:un,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
      vertexShader:`attribute vec4 iA,iD;attribute vec3 iC;uniform float uK,uLamp,uTempo;uniform vec3 uCam;${NEV_V}varying vec3 vC;varying vec3 vU;
        void main(){float modo=iD.y,a;if(modo<.5)a=uK;else if(modo<2.5)a=smoothstep(iD.z*.7,iD.z*.7+.2,uLamp)*step(.14,fract(iD.z*7.31));else a=uK*step(.84,fract(uTempo*.3+iA.z));
          if(a<.004){gl_Position=vec4(2.,2.,2.,1.);return;}
          vec2 b=iA.xy,dd=uCam.xz-b;float dist=length(dd);dd/=max(dist,.01);vec2 pe=vec2(dd.y,-dd.x);float comp=iA.w<0.?-iA.w*dist:min(iA.w,dist*.7),t=uv.y;
          // visto do alto o reflexo encurta; rente à água ele se estica
          comp*=mix(1.,.5,smoothstep(.05,.5,uCam.y/max(dist,1.)));
          vec2 q=b+dd*comp*t+pe*(uv.x-.5)*iD.x*(1.+t*1.3);vec3 w=vec3(q.x,.22,q.y);vC=iC*a*mix(1.,passa(vec3(b.x,1.,b.y)),.75);vU=vec3(uv,comp);
          gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);gl_Position.z-=1e-5*gl_Position.w;}`,
      fragmentShader:`uniform sampler2D tRuido;uniform float uTempo;varying vec3 vC;varying vec3 vU;
        void main(){float t=clamp(vU.y,0.,1.),la=max(1.-abs(vU.x-.5)*2.,0.);float a=pow(1.-t,1.7)*smoothstep(0.,.03,t)*la*la;
          float m=vU.z*t;float n=texture2D(tRuido,vec2(vU.x*.3+vC.r*3.,m*.021-uTempo*.045)).r*.55+texture2D(tRuido,vec2(vU.x*.9,m*.09-uTempo*.11)).g*.45;
          a*=.25+1.5*smoothstep(.36,.7,n);gl_FragColor=vec4(vC*a,1.);}`}),21))}

  // ---------- 5. névoa baixa: lençóis deitados sobre o rio, sobre a mata e sobre a baía, acesos pela lua ----------
  {const A=[],Bv=[];const poe=(x,z,raio,y,alfa)=>{A.push(x,z,raio,R());Bv.push(y,alfa)};
    const pr=[110,64,44][T];for(let s=3440;s<4400;s+=pr*(.7+R()*.6)){const w=rio.larg(s);rio.mundo(s,(R()-.5)*w*1.1,o);poe(o.px,o.pz,w*(1.25+R()*.9),2.2+R()*2.6,.5)}
    const nm=[8,22,40][T];for(let i=0;i<nm;i++){const s=3300+R()*1100,lado=R()<.5?-1:1;rio.mundo(s,lado*(140+R()*1400),o);poe(o.px,o.pz,150+R()*190,B.copa(o.px,o.pz)+2+R()*5,.26+R()*.14)}
    const nv=[10,30,56][T];for(let i=0;i<nv;i++){const s=3380+R()*1010,lado=R()<.5?-1:1;rio.mundo(s,lado*(rio.borda(s,lado)+14+R()*110),o);poe(o.px,o.pz,60+R()*90,27+R()*9,.2+R()*.14)}
    const nb=[8,20,34][T];for(let i=0,k=0;k<nb&&i<400;i++){const d=40+R()*2400,l=(R()*2-1)*(300+d*.9);if(B.terra(d,l)>-40)continue;k++;B.P(d,l,0,v3);poe(v3.x,v3.z,170+R()*330,2.5+R()*5,.46)}
    const g=QUAD();inst(g,'iA',A,4);inst(g,'iB',Bv,2);g.instanceCount=A.length/4;
    grupo.add(malha(g,new THREE.ShaderMaterial({uniforms:un,transparent:true,depthWrite:false,side:THREE.DoubleSide,
      vertexShader:`attribute vec4 iA;attribute vec2 iB;uniform float uTempo,uNev;varying vec2 vU;varying vec3 vW;varying float vA;
        void main(){if(uNev<.004){gl_Position=vec4(2.,2.,2.,1.);return;}float g=iA.w*6.283,c=cos(g),s=sin(g);vec2 p=vec2(position.x*c-position.y*s*.7,position.x*s+position.y*c*.7)*iA.z;
          vec3 w=vec3(iA.x+p.x+sin(uTempo*.021+g*3.)*7.,iB.x,iA.y+p.y+cos(uTempo*.017+g*5.)*7.);vU=position.xy;vW=w;vA=iB.y*uNev;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
      fragmentShader:`uniform sampler2D tRuido;uniform vec3 uCam,uNevoaCor,uNevoaSol,uSolDir,uSolCor;uniform float uTempo;varying vec2 vU;varying vec3 vW;varying float vA;
        void main(){float r=length(vU);float m=smoothstep(1.,.2,r);vec2 q=vW.xz*.0046+uTempo*vec2(.0017,.0009);float n=texture2D(tRuido,q).r*.62+texture2D(tRuido,q*3.3+.4).g*.38;
          vec3 v=vW-uCam;float d=length(v);v/=max(d,.01);
          float a=m*smoothstep(.34,.68,n)*vA*smoothstep(6.,34.,abs(uCam.y-vW.y))*smoothstep(.012,.1,abs(v.y))*smoothstep(50.,240.,d)*exp(-d*.0003);
          float s=pow(max(dot(v,uSolDir),0.),3.);vec3 cor=mix(uNevoaCor*1.5+uNevoaSol*.25,uNevoaSol*1.6+uSolCor*.22,s);gl_FragColor=vec4(cor,a);}`}),20))}

  // ---------- 6. vaga-lumes nas beiras e ao redor das casas ----------
  {const A=[],n=[200,460,820][T];for(let i=0;i<n;i++){if(lampP.length&&R()<.34){const k=Math.floor(R()*lampP.length/3)*3;A.push(lampP[k]+(R()-.5)*26,.6+R()*5,lampP[k+2]+(R()-.5)*26,R())}
      else{const s=3540+R()*855,lado=R()<.5?-1:1,lat=lado*(rio.borda(s,lado)-7+R()*20);rio.mundo(s,lat,o);A.push(o.px,.5+R()*R()*9,o.pz,R())}}
    const g=QUAD();inst(g,'iA',A,4);g.instanceCount=n;
    grupo.add(malha(g,new THREE.ShaderMaterial({uniforms:un,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`attribute vec4 iA;uniform float uTempo,uVaga,uPx;uniform vec3 uCam;varying float vA;varying vec2 vU;
        void main(){if(uVaga<.01){gl_Position=vec4(2.,2.,2.,1.);return;}${BILL}float f=iA.w*6.283;vec3 q=iA.xyz+vec3(sin(uTempo*.31+f)*2.6,sin(uTempo*.47+f*2.)*.9,cos(uTempo*.27+f*3.)*2.6);q.y=max(q.y,.3);
          float d=distance(q,uCam);float pisc=pow(max(sin(uTempo*(.8+iA.w)+f*7.),0.),4.);vA=pisc*uVaga*clamp(70./d,.3,1.)*smoothstep(1100.,600.,d);vU=uv;
          gl_Position=projectionMatrix*viewMatrix*vec4(q+(cx*position.x+cy*position.y)*max(.1,d*uPx*1.9),1.);}`,
      fragmentShader:`varying float vA;varying vec2 vU;void main(){float d=length(vU-.5)*2.;gl_FragColor=vec4((vec3(1.,.95,.35)*exp(-d*d*11.)*4.+vec3(.5,.8,.1)*exp(-d*3.)*.3)*vA*smoothstep(1.,.7,d),1.);}`}),23))}

  // ---------- 7. o barco como ponto de luz: uma poça quente na água e um brilho que não some com a distância ----------
  {const g=QUAD();inst(g,'iA',[0,1],1);g.instanceCount=2;
    grupo.add(malha(g,new THREE.ShaderMaterial({uniforms:un,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
      vertexShader:`attribute float iA;uniform vec3 uBarco,uCam;uniform float uBK,uPx;varying vec2 vU;varying float vA;
        void main(){if(uBK<.004){gl_Position=vec4(2.,2.,2.,1.);return;}vU=uv;float d=distance(uBarco,uCam);vec3 w;
          if(iA<.5){w=uBarco+vec3(position.x*18.,.2,position.y*18.);vA=uBK*mix(.045,.17,smoothstep(40.,260.,d));}
          else{${BILL}w=uBarco+vec3(0.,3.2,0.)+(cx*position.x+cy*position.y)*max(2.,d*uPx*13.);vA=uBK*.9*smoothstep(80.,300.,d);}
          gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);gl_Position.z-=1e-5*gl_Position.w;}`,
      fragmentShader:`varying vec2 vU;varying float vA;void main(){float d=length(vU-.5)*2.;gl_FragColor=vec4(vec3(1.,.62,.28)*(exp(-d*d*5.)+exp(-d*d*40.)*1.5)*vA*smoothstep(1.,.6,d),1.);}`}),24))}

  // ---------- céu do final: a lua fica num ponto escolhido do quadro, a Via Láctea sobe da direita da cidade ----------
  const fim={x:0,z:0};{const sb=3790,pb=rio.em(sb,{}),pc=rio.em(sb-REC,{});fim.x=pc.x;fim.z=pc.z;
    const yC=Math.atan2(cidade.x-fim.x,cidade.z-fim.z),yB=Math.atan2(pb.x-fim.x,pb.z-fim.z),mira=yC+giro(yB-yC)*.3,lua=mira+4.5*Math.PI/180;
    clima.defineFinal({luaAz:lua,luaEl:6.2,luzAz:lua});
    const d1=(el,az)=>new THREE.Vector3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el));ceu.final({eixo:d1(0,mira-.52).cross(d1(1.05,mira+.44))})}
  // a neblina de perto (efeitos.js) segue a névoa do humor; no final ela precisa de mais corpo rente à água
  if(ef&&ef.uN){const f0=ef.atualiza.bind(ef);ef.atualiza=m=>{f0(m);if(un.uNev.value>.01)ef.uN.uForca.value=Math.max(ef.uN.uForca.value,.2*un.uNev.value)}}

  const est0={t:0,ceu:false},cu=ceu.md.uniforms;
  return ATUAL={grupo,B,cidade,
    // e: {k, final, cam, barco, m (humor), nav, est}
    atualiza(dt,e){const s=e.nav.s,k=e.k,vis=e.final||k>0||s>2900;if(grupo.visible!==vis)grupo.visible=vis;
      if(e.final)est0.t+=dt;else est0.t=0;e.est.fimT=est0.t;e.est.fimK=clamp(est0.t/DUR);
      // a noite de Belém entra junto com o final e fica enquanto o barco estiver no trecho final
      const kB=sst(.06,.6,k)*sst(3250,3560,s);clima.kFim=kB;
      if(!vis){if(est0.ceu){est0.ceu=false;cu.uVia.value=0;cu.uEst.value=cu.uLuaG.value=1;cu.uCid.value.w=0}return}
      const noite=e.m.noite,kC=sst(.3,.85,noite);un.uK.value=kC;un.uLamp.value=sst(.12,.5,noite);un.uKF.value=k;un.uVaga.value=sst(.5,.95,noite);un.uNev.value=Math.max(kB,sst(.6,1,noite)*.6);
      const cam=e.cam;un.uPx.value=2*Math.tan(cam.fov*Math.PI/360)/Math.max(320,r.domElement.height);
      if(dossel){const hc=cam.position.y;dossel.visible=hc>26;dossel.position.y=-36*(1-sst(28,64,hc))}
      un.uBarco.value.copy(e.barco.position);un.uBK.value=sst(.25,.8,noite);
      cu.uVia.value=kB;cu.uEst.value=1+.7*kB;cu.uLuaG.value=1+1.1*kB;{const dx=cidade.x-cam.position.x,dz=cidade.z-cam.position.z,n=Math.hypot(dx,dz)||1;cu.uCid.value.set(dx/n,14,dz/n,kC*.12*sst(6,40,cam.position.y))}est0.ceu=true},
    // A grua do final. Começa baixa atrás do barco, sobe devagar recuando rio acima e termina
    // contemplando: Belém no horizonte, a lua baixa sobre a cidade, o caminho de luar descendo o rio e o barco como um ponto de luz embaixo.
    // (em tela em pé a mira fica mais na cidade, para a linha dos prédios caber inteira)
    // rodada 4: em A s (d.atraso, o instante em que a fala começa) a grua sobe de 5,5 a ~48 m e o olhar se vira para Belém, de modo que a primeira
    // frase ("Olhe lá. As luzes de Belém.") já encontra a cidade no quadro; depois continua subindo devagar até ALT durante a fala inteira.
    camera(t,x,o,d,dr){const Dn=d.dur||DUR,u=clamp(t/Dn),k=.4*u+.6*u*u*u*(u*(u*6-15)+10),ex=Math.max(0,t-Dn),A=d.atraso||3.2,H1=48,a1=sst(0,A,t),a2=sst(A,Dn,t);
      const h=5.5+(H1-5.5)*a1+(ALT-H1)*(a2*.35+a2*a2*(3-2*a2)*.65)+Math.min(ex*.1,9);dr.rp(o.p,x.s-mix(24,REC,k),x.lat*(1-k),h);
      const bx=x.bp.x+x.fw.x*14-o.p.x,bz=x.bp.z+x.fw.z*14-o.p.z,y0=Math.atan2(bx,bz),p0=Math.atan2(2.4-o.p.y,Math.hypot(bx,bz));
      const yC=Math.atan2(cidade.x-o.p.x,cidade.z-o.p.z),yB=Math.atan2(x.bp.x-o.p.x,x.bp.z-o.p.z),y1=yC+giro(yB-yC)*(x.W<x.H?.1:.3),q=Math.max(sst(.1,.86,u),.85*sst(.3,A,t)),ya=y0+giro(y1-y0)*q,pi=mix(p0,.02,q),c=Math.cos(pi);
      o.a.set(o.p.x+Math.sin(ya)*c*300,o.p.y+Math.sin(pi)*300,o.p.z+Math.cos(ya)*c*300);o.fov=mix(58,46,k);d.tremor=.0022},
    // o cartão final só entra quando a grua já chegou lá em cima
    pronto(){return est0.t>=DUR-5}};
}
