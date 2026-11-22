// A Luzeiro I da V5: o modelo do Blender, com o interior real do arquivo.
// Nada aqui depende de medida fixa: orientação, calado, mesa, timão, alavanca, portas, luminárias e o caminho da câmera
// são lidos dos nós do GLB na hora da carga. Trocar de modelo é trocar UMA constante.
import * as THREE from 'three';
import {integra,U} from './nucleo.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- A constante ----------
// '{lod}' vira a (computador), b (celular bom) ou c (celular simples). Sem '{lod}', o mesmo arquivo serve às três.
// Quando o modelador entregar a v3.1: 'barco/luzeiro_v31_{lod}.glb'
// V6: o modelo é escolhido por versão (?v=44, ?v=45…), como em barco_modo/explorar.js. Trocar de versão não pede mudança de código:
// basta pôr barco/luzeiro_v<versão>_{a,b,c}.glb na pasta e, se o plano da água mudar, uma linha em VERSOES.
export const VERSAO_PADRAO='47'; // rodada 3: v47 (Bíblia nova, cabo do gerador); se faltar, cai para 46 e 45
export const BARCO_MODELO='barco/luzeiro_v{v}_{lod}.glb';
// agua: altura (y do arquivo) do plano da água. v3.x = 0,735; v4.x = 0,575.
export const VERSOES={padrao:{agua:.575},'31':{agua:.735}};

// Parâmetros que as fontes não fecham (ver acervo: ficha da Luzeiro I). Mudam aqui, sem tocar no resto.
export const BARCO={
  calado:.85,        // m, da quilha à linha d'água (fontes: 0,85 · 0,76)
  escala:1,          // 1 = o tamanho do arquivo (11,76 m no v3.0). Para 11 m oficiais: 11/11.76
  olho:1.55,         // (V6: o forro do v4 fica a 1,84 m do piso; os olhos ficam a no máximo 30 cm dele, ou seja, ~1,54 m)         // altura dos olhos acima do piso da cabine
  recuoOlho:1.38,     // distância dos olhos até a roda do leme
  bandeira:true,     // flâmula no mastro (dedução: nenhuma foto de 1937/40 a confirma)
  ripas:true,        // desenha as juntas das tábuas nos materiais sem textura
  limpaMesa:false,   // V6: a mesa do v4 já traz a lanterna e os objetos; nada é cortado    // tira a louça e os frascos da mesa para o mapa caber (a lanterna-símbolo fica)
  luzesForro:[0,1,2] // quantas luminárias do forro viram luz de verdade em cada qualidade
};

const V=()=>new THREE.Vector3();
const NOMES={casco:/^HERO_|Hull/i,helice:/Propeller|Helice/i,leme:/LZ_Rudder|Rudder$|Leme_Pa/i,roda:/Helm_Wheel|Roda_Leme/i,alav:/Gear_Lever|Alavanca/i,mesa:/Table_Removable|Mesa/i,piso:/Cabin_Sole|Piso/i,forro:/LZ_Ceiling$|LZ_Ceiling_Beams|Forro$/i,paredes:/Cabin_Walls|Paredes/i,degrauPopa:/Aft_Step|Degrau_Popa/i,portaProa:/Front_Door|Porta_Proa/i,escada:/Ladder|Escada/i,lamp:/Ceiling_Lamps|Luminarias/i,cortina:/Curtain|Cortina/i,mastro:/Masts|Mastro/i,bandeira:/Flag|Bandeira|Pennant|Flamula/i,conves:/LZ_Deck$|Conves$/i};
const ANC=/^(ANC|ANCORA|ANCHOR|LZ_ANC|LZ_Anchor)[_ ]?(.+)$/i;

// Baixa um GLB por XHR (dá progresso de verdade e não deixa requisição pendurada) e entrega ao GLTFLoader.
export function baixaGLB(gltf,url,aoProgresso){return new Promise((ok,no)=>{const x=new XMLHttpRequest();x.open('GET',url);x.responseType='arraybuffer';x.onprogress=e=>{if(aoProgresso&&e.lengthComputable)aoProgresso(e.loaded/e.total)};x.onerror=()=>no(new Error('rede: '+url));x.onload=()=>{if(x.status>=200&&x.status<300)gltf.parse(x.response,url.slice(0,url.lastIndexOf('/')+1),ok,no);else no(new Error(x.status+' '+url))};x.send()})}
export async function carregaBarco({gltf,T,Q,env,comEnv,uLuzBarco,aoProgresso}){
  const MOVEL=matchMedia('(pointer:coarse)').matches||Math.min(innerWidth,innerHeight)<700;/* V6: celular usa sempre o LOD C */const lod=Q.get('lod')||(MOVEL?'c':['c','b','a'][T]);const ver=(Q.get('v')||VERSAO_PADRAO).replace(/[^\w.]/g,''),cfgV=VERSOES[ver]||VERSOES.padrao;const url=Q.get('barco')?'barco/'+Q.get('barco').replace('{lod}',lod)+'.glb':BARCO_MODELO.replace('{v}',ver).replace('{lod}',lod);
  let g=null;{const tent=[url];if(!Q.get('barco'))for(const v of ['46','45'])if(v!==ver)tent.push(BARCO_MODELO.replace('{v}',v).replace('{lod}',lod));for(const u of tent){try{g=await baixaGLB(gltf,u,aoProgresso);if(u!==url)console.info('barco: '+url+' indisponível; usando '+u);break}catch(e){}}if(!g)throw new Error('nenhum GLB do barco carregou')}const mod=g.scene,grupo=new THREE.Group();grupo.add(mod);grupo.name='Luzeiro_V5';
  const acha=re=>{let r=null;mod.traverse(o=>{if(!r&&re.test(o.name)&&!ANC.test(o.name))r=o});return r};
  const caixa=o=>{const b=new THREE.Box3();if(o){o.updateWorldMatrix(true,true);b.setFromObject(o,true)}return b};
  // Rodada 3 (pedido do usuário): a planta e a Bíblia giram 180° na mesa, em torno do eixo vertical no centro de cada peça, para lerem certo
  // para quem olha a mesa da cabine (câmera de 1ª pessoa / piloto). Só girada, não espelhada. ?mapaGlb volta à orientação do arquivo.
  if(!Q.has('mapaGlb'))for(const re of [/LZ40_Map_Table/i,/LZ40_Bible_Open/i]){const o=acha(re);if(!o||!o.parent)continue;o.updateMatrix();const b=new THREE.Box3(),M=new THREE.Matrix4();
    o.traverse(m=>{if(!m.isMesh)return;const ch=[];for(let n=m;n&&n!==o.parent;n=n.parent)ch.unshift(n);M.identity();for(const k of ch){k.updateMatrix();M.multiply(k.matrix)}m.geometry.computeBoundingBox();b.union(m.geometry.boundingBox.clone().applyMatrix4(M))});
    if(b.isEmpty())continue;const c=b.getCenter(new THREE.Vector3());const R=new THREE.Matrix4().makeTranslation(c.x,c.y,c.z).multiply(new THREE.Matrix4().makeRotationY(Math.PI)).multiply(new THREE.Matrix4().makeTranslation(-c.x,-c.y,-c.z)).multiply(o.matrix);
    R.decompose(o.position,o.quaternion,o.scale);o.userData.girado180=true}
  // ---------- orientação: a hélice (ou o leme) diz onde é a popa ----------
  mod.scale.setScalar(BARCO.escala);mod.updateMatrixWorld(true);
  {const bx=caixa(mod),tam=bx.getSize(V()),c=bx.getCenter(V());const ph=acha(NOMES.helice)||acha(NOMES.leme);const p=ph?caixa(ph).getCenter(V()):null;let rot=-Math.PI/2;
    if(tam.x>=tam.z)rot=(p?p.x<c.x:true)?-Math.PI/2:Math.PI/2;else rot=(p?p.z<c.z:true)?0:Math.PI;
    mod.rotation.y=rot;mod.updateMatrixWorld(true);const b2=caixa(mod);mod.position.y=Q.get('barco')?-(b2.min.y+BARCO.calado*BARCO.escala):-cfgV.agua*BARCO.escala;mod.updateMatrixWorld(true);grupo.userData.rotY=rot}
  const casco=caixa(mod);
  // ---------- âncoras ----------
  const anc={casco,explicitas:{}};mod.traverse(o=>{const m=ANC.exec(o.name);if(m){o.updateWorldMatrix(true,false);anc.explicitas[m[2].toLowerCase()]=o.getWorldPosition(V())}});
  const ex=(...n)=>{for(const k of n)if(anc.explicitas[k])return anc.explicitas[k];return null};
  const limpaMesa=BARCO.limpaMesa||!acha(/LZ40_Map_Table/i);const oPiso=acha(NOMES.piso),oForro=acha(NOMES.forro),oPar=acha(NOMES.paredes),oRoda=acha(NOMES.roda),oAlav=acha(NOMES.alav),oMesa=acha(NOMES.mesa),oHel=acha(NOMES.helice),oLeme=acha(NOMES.leme);
  const bPar=oPar?caixa(oPar):casco.clone(),bForro=oForro?caixa(oForro):bPar;
  anc.piso=oPiso?caixa(oPiso).max.y:casco.min.y+1.1;anc.teto=oForro?bForro.min.y:anc.piso+1.95;
  // caixa do interior: por dentro das paredes, do piso ao forro
  anc.cab=new THREE.Box3(new THREE.Vector3(Math.max(bPar.min.x,bForro.min.x)+.03,anc.piso-.05,bPar.min.z+.06),new THREE.Vector3(Math.min(bPar.max.x,bForro.max.x)-.03,anc.teto+.02,Math.min(bPar.max.z,oForro?bForro.max.z+.1:bPar.max.z)-.06));
  const bRoda=oRoda?caixa(oRoda):null;anc.roda=ex('timao','helm','roda')||(bRoda?bRoda.getCenter(V()):new THREE.Vector3(0,anc.piso+.9,anc.cab.max.z-.3));anc.raioRoda=bRoda?Math.max(bRoda.max.x-bRoda.min.x,bRoda.max.y-bRoda.min.y)/2:.4;
  const yOlho=Math.min(anc.piso+BARCO.olho,anc.teto-.3);anc.olho=ex('olho','eye')||new THREE.Vector3(anc.roda.x,yOlho,(bRoda?bRoda.min.z:anc.roda.z)-BARCO.recuoOlho);
  const bAlav=oAlav?caixa(oAlav):null;anc.alavBase=bAlav?new THREE.Vector3((bAlav.min.x+bAlav.max.x)/2,bAlav.min.y,(bAlav.min.z+bAlav.max.z)/2):null;anc.alavTopo=bAlav?new THREE.Vector3((bAlav.min.x+bAlav.max.x)/2,bAlav.max.y,(bAlav.min.z+bAlav.max.z)/2):null;
  // mesa: o tampo é a peça de maior área; o resto (louça, frascos, lamparina) sai para o mapa caber
  if(oMesa){ // o tampo é o nível com mais área virada para cima (serve para mesa em uma malha só ou em várias)
    const H=new Map(),a=V(),b=V(),c=V(),n=V(),pecas=[];oMesa.traverse(o=>{if(!o.isMesh)return;pecas.push(o);const P=o.geometry.attributes.position,I=o.geometry.index,nt=(I?I.count:P.count)/3;for(let t=0;t<nt;t++){a.fromBufferAttribute(P,I?I.getX(t*3):t*3).applyMatrix4(o.matrixWorld);b.fromBufferAttribute(P,I?I.getX(t*3+1):t*3+1).applyMatrix4(o.matrixWorld);c.fromBufferAttribute(P,I?I.getX(t*3+2):t*3+2).applyMatrix4(o.matrixWorld);n.copy(b).sub(a).cross(V().copy(c).sub(a));const ar=n.length()/2;if(ar<1e-7||Math.abs(n.y)/(ar*2)<.95)continue;const k=Math.round((a.y+b.y+c.y)/3*100);let e=H.get(k);if(!e)H.set(k,e={ar:0,bx:new THREE.Box3(),o:new Map()});e.ar+=ar;e.bx.expandByPoint(a).expandByPoint(b).expandByPoint(c);e.o.set(o,(e.o.get(o)||0)+ar)}});
    let top=null,yk=0;for(const [k,e] of H){if(k/100<anc.piso+.45||k/100>anc.piso+1.1)continue;if(!top||e.ar>top.ar+1e-4||(Math.abs(e.ar-top.ar)<=1e-4&&k>yk)){top=e;yk=k}}
    if(top){anc.mesa=new THREE.Box3(new THREE.Vector3(top.bx.min.x,anc.piso,top.bx.min.z),new THREE.Vector3(top.bx.max.x,Math.max(yk/100,top.bx.max.y),top.bx.max.z));let dono=null,m=0;for(const [o,ar] of top.o)if(ar>m){m=ar;dono=o}
      if(pecas.length===1&&limpaMesa){const o=pecas[0];o.material=o.material.clone();o.material.name+='_MesaLimpa';o.userData.semSombra=true} // mesa numa malha só: o que está sobre o tampo é cortado no shader
      if(pecas.length>1)for(const o of pecas){if(o===dono)continue;const bb=caixa(o);if(/Brass|Lamp|Latao/i.test(o.material.name)&&!anc.lampMesa)anc.lampMesa=bb.getCenter(V());if(limpaMesa)o.visible=false}}
    else{const bb=caixa(oMesa);anc.mesa=new THREE.Box3(new THREE.Vector3(bb.min.x,anc.piso,bb.min.z),new THREE.Vector3(bb.max.x,anc.piso+.76,bb.max.z))}}
  else anc.mesa=new THREE.Box3(new THREE.Vector3(-.38,anc.piso,-.5),new THREE.Vector3(.38,anc.piso+.76,.9));
  {const p=ex('mesa','table');if(p){const t=anc.mesa.getSize(V());anc.mesa=new THREE.Box3(new THREE.Vector3(p.x-t.x/2,anc.piso,p.z-t.z/2),new THREE.Vector3(p.x+t.x/2,p.y,p.z+t.z/2))}}
  // portas: a de popa pelo degrau, a de proa pela escada ou pelo batente
  {const d=acha(NOMES.degrauPopa),b=d?caixa(d):null;anc.portaPopa=ex('porta_popa','portapopa','aft_door')||new THREE.Vector3(b?(b.min.x+b.max.x)/2:0,yOlho,bPar.min.z);
    const f=acha(NOMES.portaProa)||acha(NOMES.escada),bf=f?caixa(f):null;anc.portaProa=ex('porta_proa','portaproa','front_door')||new THREE.Vector3(bf?(bf.min.x+bf.max.x)/2:0,yOlho,oForro?bForro.max.z:bPar.max.z)}
  {const dk=acha(NOMES.conves);anc.conves=dk?caixa(dk).max.y:anc.piso+1}
  // o nome no costado de bombordo (+X), para a câmera da abertura mirar nele
  {const b=new THREE.Box3();mod.traverse(o=>{if(/Name_PT|Nome_BB/i.test(o.name))b.union(caixa(o))});anc.nome=ex('nome','name')||(b.isEmpty()?new THREE.Vector3(casco.max.x*.6,anc.piso+.5,casco.max.z-1.4):b.getCenter(V()))}
  // mastro: o vértice mais alto do arquivo
  {const m=acha(NOMES.mastro);let top=new THREE.Vector3(0,casco.max.y,0);if(m){let y=-1e9;const v=V();m.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(v.y>y){y=v.y;top.copy(v)}}}})}anc.mastro=top}
  // ---------- materiais: névoa do mundo, ripas, interior mais escuro, vidros acesos à noite ----------
  const uBarcoInv={value:new THREE.Matrix4()},uCab0={value:anc.cab.min.clone()},uCab1={value:anc.cab.max.clone()},uCortY={value:anc.teto};
  {const c=acha(NOMES.cortina);if(c)uCortY.value=caixa(c).max.y}
  // o eixo "ao comprido" em coordenadas do arquivo, para as cortinas balançarem de lado a lado
  const rot=grupo.userData.rotY,ladoArq=Math.abs(Math.sin(rot))>.5?'z':'x';
  const mats=new Set(),lampM=[];mod.traverse(o=>{if(!o.isMesh)return;const m=o.material,vid=/Glass|Vidro/i.test(m.name);o.castShadow=T>=1&&!vid&&!o.userData.semSombra;o.receiveShadow=T>=1&&!vid;mats.add(m)});
  for(const m of mats){const n=m.name||'';const semTex=!m.map;let rip=0,larg=.09;
    if(BARCO.ripas&&semTex){if(/Planks|Cedar|Lambri|Forro/i.test(n)){rip=1;larg=.085}else if(/Dark_Deck|Deck/i.test(n)){rip=1;larg=.11}else if(/Hull_White|Navy_Bottom|Casco/i.test(n)){rip=2;larg=.15}}
    const cort=NOMES.cortina.test(n),limpa=/_MesaLimpa$/.test(n);
    // Rodada 2: a casca externa (casco, fundo, letras) nunca é 'interior'. O teste '_in' é uma caixa (a da cabine) e, a vante, a meia-boca do casco
    // abaixo da cinta é menor que a da caixa: fragmentos do costado caíam 'dentro' e recebiam a luz de interior (triângulo escuro perto do nome).
    const casca=/Hull_White|Hull_Blue|Navy_Bottom|Gold_Letters|Black_Trim|GreyGreen_Band|Casco/i.test(n);const lamp=/Lamp_Glass|Vidro_Lamp/i.test(n);
    if(semTex&&/Cedar|Cedro/i.test(n)&&m.color.r>.98&&m.color.g>.98)m.color.setRGB(.42,.24,.12); // cedro sem cor no arquivo: tom de madeira (dedução)
    if(lamp){m.emissive=new THREE.Color(1,.7,.36);m.emissiveIntensity=0;lampM.push(m)}
    if(/Window_Glass|Vidro_Janela/i.test(n)){m.transparent=true;m.depthWrite=false;m.opacity=Math.min(m.opacity,.22);m.roughness=.05}
    if(env){m.envMap=env;const k=m.metalness>.5?.85:.32;m.envMapIntensity=k;m.userData.env=k;m.userData.semLuz=true;comEnv&&comEnv.push(m)}
    integra(m,{copa:true,chave:'b5r'+rip+(cort?'c':'')+(limpa?'m':'')+(casca?'k':'')+Math.round(larg*1000),extra:sh=>{sh.uniforms.uBarcoInv=uBarcoInv;sh.uniforms.uCab0=uCab0;sh.uniforms.uCab1=uCab1;sh.uniforms.uLuzBarco=uLuzBarco;sh.uniforms.uCortY=uCortY;sh.uniforms.uMesaY={value:anc.mesa.max.y+.004};
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vL;uniform mat4 uBarcoInv;uniform float uCortY;').replace('#include <begin_vertex>','#include <begin_vertex>\n'+(cort?`{float k=clamp(uCortY-position.y,0.,1.);transformed.${ladoArq}+=sin(uTempo*1.2+position.x*4.+position.z*3.)*.022*k*k;}\n`:'')+'vL=(uBarcoInv*modelMatrix*vec4(transformed,1.)).xyz;');
      if(cort)sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTempo;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vL;uniform vec3 uCab0,uCab1;uniform float uLuzBarco,uMesaY;')
        .replace('#include <color_fragment>',`#include <color_fragment>
        ${limpa?'if(vL.y>uMesaY)discard;':''}
        float _in=${casca?'0.':'step(uCab0.x,vL.x)*step(vL.x,uCab1.x)*step(uCab0.y,vL.y)*step(vL.y,uCab1.y)*step(uCab0.z,vL.z)*step(vL.z,uCab1.z)'};
        ${rip?`{vec3 nL=normalize(cross(dFdx(vL),dFdy(vL)));float c=${rip===1?'abs(nL.y)>.7?vL.x:(abs(nL.x)>abs(nL.z)?vL.z:vL.x)':'abs(nL.y)>.82?vL.x:vL.y'};c/=${larg.toFixed(3)};float f=fract(c),w=fwidth(c);float sulco=smoothstep(0.,.05+w,f)*smoothstep(1.,.95-w,f);float tom=fract(sin(floor(c)*12.9898)*43758.5453);diffuseColor.rgb*=mix(1.,mix(.55,1.,sulco),clamp(1.-w*1.6,0.,1.))*(.94+.06*tom);}`:''}`)
        .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*vec3(1.,.74,.46)*uLuzBarco*(1.-_in);')
        .replace('#include <lights_fragment_begin>',THREE.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );directLight.color*=mix(1.,.06,_in);').replace('irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );','irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal )*mix(1.,.5,_in);'))}})}
  // ---------- peças que se mexem ----------
  grupo.updateMatrixWorld(true);
  const pivota=(o,p)=>{const pv=new THREE.Group();pv.name='pivo_'+o.name;o.parent.add(pv);pv.position.copy(o.parent.worldToLocal(p.clone()));pv.updateMatrixWorld(true);pv.attach(o);return pv};
  const eixoEm=(pv,d)=>d.clone().transformDirection(new THREE.Matrix4().copy(pv.parent.matrixWorld).invert()).normalize();
  const FR=new THREE.Vector3(0,0,1),UP=new THREE.Vector3(0,1,0),LA=new THREE.Vector3(1,0,0);const P={};
  if(oHel){const b=caixa(oHel);P.hel=pivota(oHel,b.getCenter(V()));P.helE=eixoEm(P.hel,FR)}
  if(oLeme){const b=caixa(oLeme);P.leme=pivota(oLeme,new THREE.Vector3((b.min.x+b.max.x)/2,(b.min.y+b.max.y)/2,b.max.z));P.lemeE=eixoEm(P.leme,UP)}
  if(oRoda){P.roda=pivota(oRoda,anc.roda);P.rodaE=eixoEm(P.roda,FR)}
  if(oAlav&&anc.alavBase){P.alav=pivota(oAlav,anc.alavBase);P.alavE=eixoEm(P.alav,LA)}
  // áreas de toque maiores que as peças, para o dedo não errar
  const inv=new THREE.MeshBasicMaterial({visible:false});
  const proxRoda=new THREE.Mesh(new THREE.CircleGeometry(anc.raioRoda+.14,20),inv);proxRoda.rotation.y=Math.PI;proxRoda.position.copy(anc.roda);proxRoda.position.z-=.06;proxRoda.userData.alvo='leme';grupo.add(proxRoda);
  const proxAlav=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),inv);if(anc.alavTopo)proxAlav.position.copy(anc.alavTopo);proxAlav.userData.alvo='alavanca';grupo.add(proxAlav);
  // ---------- luminárias do forro ----------
  const luzes=[];{const o=acha(NOMES.lamp),n=BARCO.luzesForro[T]||0;if(o&&n){const b=caixa(o);for(let i=0;i<n;i++){const l=new THREE.PointLight(0xffc58a,0,7,1.5);l.position.set((b.min.x+b.max.x)/2,b.min.y-.12,b.min.z+(b.max.z-b.min.z)*(i+.5)/n);grupo.add(l);luzes.push(l)}}}
  // ---------- flâmula no mastro ----------
  let flamula=null;const jaTem=acha(NOMES.bandeira);
  if(BARCO.bandeira&&!jaTem){const W=.62,H=.36,ge=new THREE.PlaneGeometry(W,H,12,4);ge.translate(-W/2,0,0);ge.rotateY(-Math.PI/2);const c=document.createElement('canvas');c.width=128;c.height=74;const x=c.getContext('2d');x.fillStyle='#1f7a3d';x.fillRect(0,0,128,74);x.fillStyle='#f2c81e';x.beginPath();x.moveTo(64,7);x.lineTo(118,37);x.lineTo(64,67);x.lineTo(10,37);x.closePath();x.fill();x.fillStyle='#1c3f8f';x.beginPath();x.arc(64,37,17,0,6.3);x.fill();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide,roughness:.9});integra(m,{copa:false,chave:'flam',extra:sh=>{sh.uniforms.uVel={value:0};m.userData.sh=sh;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTempo,uVel;').replace('#include <begin_vertex>','#include <begin_vertex>\n{float d=1.-uv.x;transformed.x+=sin(uTempo*(5.+uVel*4.)-d*7.)*.07*d;transformed.y+=(cos(uTempo*3.1-d*5.)*.03-.1*(1.-uVel))*d*d;}')}});
    flamula=new THREE.Mesh(ge,m);flamula.position.copy(anc.mastro);flamula.position.y-=H/2+.04;flamula.frustumCulled=false;grupo.add(flamula)}
  // ---------- caminho da câmera pela porta de popa até o timão ----------
  const rota=criaRotas(grupo,anc,/Curtain|Cortina|Glass|Vidro/i);const caminho=rota([anc.portaPopa.x,anc.cab.min.z-.85],[anc.olho.x,anc.olho.z]);caminho[caminho.length-1]=anc.olho.clone();
  // luzes de navegação e clarão das janelas, a partir das âncoras (bombordo = +X, encarnada; boreste = -X, verde)
  const hw=(anc.cab.max.x-anc.cab.min.x)/2+.12,zc=(anc.cab.min.z+anc.cab.max.z)/2,Lc=anc.cab.max.z-anc.cab.min.z,yj=anc.piso+1.3;
  const pontos=[[hw,anc.teto+.12,anc.cab.max.z-.5,1,.08,.05,.16],[-hw,anc.teto+.12,anc.cab.max.z-.5,.05,1,.25,.16],[anc.mastro.x,anc.mastro.y+.05,anc.mastro.z,1,.97,.85,.11]];
  for(const k of[-.32,0,.32])for(const s of[-1,1])pontos.push([s*hw,yj,zc+k*Lc,1,.64,.29,.22]);pontos.push([0,yj,anc.cab.min.z-.25,1,.66,.3,.22]);
  let ang=0;const q=new THREE.Quaternion();
  // ---------- V6: fusão por material ----------
  // O GLB tem ~64 nós e mais de 250 primitivas (uma chamada de desenho cada, vezes três passes: cena, reflexo e sombra).
  // Tudo o que não se mexe é fundido por material, em dois grupos: exterior (sempre desenhado) e interior (só de perto ou de dentro).
  // Ficam de fora as peças animadas (hélice, leme, timão, alavanca) e os nós da mesa da abertura (chama, vidro, lampião, mapa, Bíblia).
  const fusao={antes:0,depois:0,ok:false},interior=new THREE.Group();interior.name='interior_fundido';const exterior=new THREE.Group();exterior.name='exterior_fundido';
  if(!Q.has('semfusao'))try{mod.updateMatrixWorld(true);const invM=new THREE.Matrix4().copy(mod.matrixWorld).invert(),MM=new THREE.Matrix4();
    const topo=o=>{let n=o;while(n.parent&&n.parent!==mod)n=n.parent;return n.name||''},animada=o=>{for(let n=o;n&&n!==mod;n=n.parent)if(/^pivo_/.test(n.name))return true;return false};
    const MESA_RE=/LZ40_(Lamp_Flame|Lamp_Glass|Lantern_Table|Map_Table|Bible_Open)/i,INT_RE=/^(LZ40_|LZ_Int_|LZ_Door_|LZ_Helm_Mount|LZ_Gear_Lever_Base|LZ_Ladder|LZ_Ceiling|LZ_Cabin_Sole|LZ_Aft_Step|LZ_Exhaust)/i,EXT_DE_LZ40=/LZ40_Fuel_Drums_Roof/i;
    const baldes=new Map(),todas=[];mod.traverse(o=>{if(o.isMesh)todas.push(o)});fusao.antes=todas.filter(o=>o.visible).length;
    for(const o of todas){if(!o.visible||animada(o))continue;const tn=topo(o);if(MESA_RE.test(tn))continue;const dentro=INT_RE.test(tn)&&!EXT_DE_LZ40.test(tn);
      const ch=(dentro?'i':'e')+o.material.uuid+'|'+Object.keys(o.geometry.attributes).sort().join(',')+'|'+(o.castShadow?1:0);let b=baldes.get(ch);if(!b)baldes.set(ch,b={dentro,mat:o.material,geos:[],orig:[],cs:o.castShadow,rs:o.receiveShadow});b.orig.push(o)}
    for(const b of baldes.values()){if(b.orig.length<2&&!b.dentro)continue;let gs=null;try{gs=b.orig.map(o=>{let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();MM.multiplyMatrices(invM,o.matrixWorld);g.applyMatrix4(MM);return g});const mg=mergeGeometries(gs,false);if(!mg)throw new Error('atributos diferentes');
        const me=new THREE.Mesh(mg,b.mat);me.name='f_'+(b.mat.name||'');me.castShadow=b.cs&&!b.dentro;me.receiveShadow=b.rs;(b.dentro?interior:exterior).add(me);for(const o of b.orig){o.removeFromParent();o.geometry.dispose()}}catch(err){}finally{if(gs)for(const g of gs)g.dispose()}}
    mod.add(exterior,interior);mod.updateMatrixWorld(true);let n=0;mod.traverse(o=>{if(o.isMesh&&o.visible)n++});fusao.depois=n;fusao.ok=true;fusao.interior=interior.children.length;fusao.exterior=exterior.children.length}catch(err){console.warn('fusão do barco falhou; segue sem ela',err)}
  const B={fusao,interior,ver,lod,acha,caixa,grupo,mod,anc,P,proxRoda,proxAlav,luzes,lampM,flamula,caminho,rota,pontos,uBarcoInv,url,
    tris:(()=>{let n=0;mod.traverse(o=>{if(o.isMesh){const g=o.geometry;n+=(g.index?g.index.count:g.attributes.position.count)/3}});return Math.round(n)})(),
    dentro(v){const c=anc.cab;return v.x>c.min.x-.02&&v.x<c.max.x+.02&&v.z>c.min.z-.02&&v.z<c.max.z+.02&&v.y>c.min.y-.15&&v.y<c.max.y+.05},
    // leme -1..1, alavanca 0..1, rpm 0..1, noite 0..1
    anima(dt,{leme=0,alav=.5,rpm=0,noite=0,v=0,flk=1}){ang+=dt*rpm*46;if(P.hel)P.hel.quaternion.setFromAxisAngle(P.helE,ang);if(P.leme)P.leme.quaternion.setFromAxisAngle(P.lemeE,-leme*.62);if(P.roda)P.roda.quaternion.setFromAxisAngle(P.rodaE,leme*2.18);if(P.alav)P.alav.quaternion.setFromAxisAngle(P.alavE,(alav-.5)*.95);
      for(const m of lampM)m.emissiveIntensity=noite*2.4*flk;for(const l of luzes)l.intensity=noite*1.5*flk;if(flamula&&flamula.material.userData.sh)flamula.material.userData.sh.uniforms.uVel.value=Math.min(1,v/9)}};
  return B;
}

// Grade de ocupação na altura dos olhos, tirada da própria malha; busca em largura da porta ao timão; depois alisa.
function criaRotas(grupo,anc,pula){
  const cel=.08,c=anc.cab,x0=c.min.x-.3,z0=c.min.z-1.4,nx=Math.ceil((c.max.x-c.min.x+.6)/cel),nz=Math.ceil((c.max.z-z0+.9)/cel),y0=anc.olho.y-.3,y1=anc.olho.y+.1;const G=new Uint8Array(nx*nz);
  const a=V(),b=V(),d=V(),p=V();const marca=(x,z)=>{const i=Math.floor((x-x0)/cel),j=Math.floor((z-z0)/cel);if(i>=0&&j>=0&&i<nx&&j<nz)G[j*nx+i]=1};
  const nomeDe=o=>{let s='';for(let q=o;q&&q!==grupo;q=q.parent)s+=q.name+'/';return s};
  grupo.updateMatrixWorld(true);
  grupo.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.position||o.material.visible===false||!o.visible||pula.test(nomeDe(o)))return;const P=o.geometry.attributes.position,I=o.geometry.index,n=(I?I.count:P.count)/3,M=o.matrixWorld;
    for(let t=0;t<n;t++){const i0=I?I.getX(t*3):t*3,i1=I?I.getX(t*3+1):t*3+1,i2=I?I.getX(t*3+2):t*3+2;a.fromBufferAttribute(P,i0).applyMatrix4(M);b.fromBufferAttribute(P,i1).applyMatrix4(M);d.fromBufferAttribute(P,i2).applyMatrix4(M);
      if(Math.max(a.y,b.y,d.y)<y0||Math.min(a.y,b.y,d.y)>y1)continue;if(Math.max(a.x,b.x,d.x)<x0||Math.min(a.x,b.x,d.x)>x0+nx*cel||Math.max(a.z,b.z,d.z)<z0||Math.min(a.z,b.z,d.z)>z0+nz*cel)continue;
      const L=Math.max(a.distanceTo(b),a.distanceTo(d),b.distanceTo(d)),k=Math.min(400,Math.ceil(L/(cel*.55))+1);
      for(let i=0;i<=k;i++)for(let j=0;j<=k-i;j++){const u=i/k,w=j/k;p.set(a.x+(b.x-a.x)*u+(d.x-a.x)*w,a.y+(b.y-a.y)*u+(d.y-a.y)*w,a.z+(b.z-a.z)*u+(d.z-a.z)*w);if(p.y>=y0&&p.y<=y1)marca(p.x,p.z)}}});
  const cl=(x,z)=>[Math.max(0,Math.min(nx-1,Math.floor((x-x0)/cel))),Math.max(0,Math.min(nz-1,Math.floor((z-z0)/cel)))];
  const tenta=(raio,ini,fim)=>{const R=Math.round(raio/cel),F=new Uint8Array(nx*nz);for(let j=0;j<nz;j++)for(let i=0;i<nx;i++)if(G[j*nx+i])for(let dj=-R;dj<=R;dj++)for(let di=-R;di<=R;di++){if(di*di+dj*dj>R*R)continue;const a2=i+di,b2=j+dj;if(a2>=0&&b2>=0&&a2<nx&&b2<nz)F[b2*nx+a2]=1}
    const [si,sj]=cl(...ini),[fi,fj]=cl(...fim);const livre=(i,j)=>{for(let r=0;r<8;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){const a2=i+di,b2=j+dj;if(a2>=0&&b2>=0&&a2<nx&&b2<nz&&!F[b2*nx+a2])return [a2,b2]}return null};
    const s=livre(si,sj),f=livre(fi,fj);if(!s||!f)return null;const ant=new Int32Array(nx*nz).fill(-1),fila=[s[1]*nx+s[0]];ant[fila[0]]=fila[0];const alvo=f[1]*nx+f[0];
    for(let h=0;h<fila.length;h++){const q=fila[h];if(q===alvo)break;const i=q%nx,j=(q-i)/nx;for(const [di,dj] of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const a2=i+di,b2=j+dj;if(a2<0||b2<0||a2>=nx||b2>=nz)continue;const k=b2*nx+a2;if(F[k]||ant[k]>=0)continue;if(di&&dj&&(F[j*nx+a2]||F[b2*nx+i]))continue;ant[k]=q;fila.push(k)}}
    if(ant[alvo]<0)return null;const cam=[];for(let q=alvo;;q=ant[q]){cam.push([q%nx,Math.floor(q/nx)]);if(ant[q]===q)break}cam.reverse();
    // estica o fio: só ficam os cantos necessários
    const ve=(A,Bq)=>{const n=Math.ceil(Math.hypot(Bq[0]-A[0],Bq[1]-A[1])*2);for(let t=0;t<=n;t++){const i=Math.round(A[0]+(Bq[0]-A[0])*t/n),j=Math.round(A[1]+(Bq[1]-A[1])*t/n);if(F[j*nx+i])return false}return true};
    const out=[cam[0]];let i=0;while(i<cam.length-1){let j=cam.length-1;while(j>i+1&&!ve(cam[i],cam[j]))j--;out.push(cam[j]);i=j}return out.map(([i2,j2])=>new THREE.Vector3(x0+(i2+.5)*cel,anc.olho.y,z0+(j2+.5)*cel))};
  return (ini,fim)=>{const pts=tenta(.22,ini,fim)||tenta(.14,ini,fim)||tenta(.08,ini,fim);const res=pts||[new THREE.Vector3(ini[0],anc.olho.y,ini[1]),new THREE.Vector3(fim[0],anc.olho.y,fim[1])];res.achou=!!pts;return res};
}
