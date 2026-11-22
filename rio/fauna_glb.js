// V6 rodada 2 · Fauna em GLB, por espécie. Carregamento tolerante: sem fauna/indice.json, sem a espécie no índice ou com
// falha no arquivo, a espécie continua sendo a procedural (criatura.js / aves.js). Nada é pedido às cegas: só o que o índice lista.
//
// fauna/indice.json (gerado por atualiza_fauna.py a partir de AR_Final/modelo/fauna_v1/):
// {"versao":1,"especies":{"boto":{"arquivos":{"a":"boto_a.glb","b":"boto_b.glb","c":"boto_c.glb"},   // a=alta, b=média, c=leve; pode haver só um
//                                  "escala":1, "giro":0, "y":0,        // opcionais: fator de escala, giro em Y (rad) e deslocamento vertical (m)
//                                  "clips":{"salto":"Boto_Jump"},      // opcional: nome lógico → nome do clip no arquivo
//                                  "tris":{"a":3000,"b":1500,"c":600}}}} // informativo
// Convenções pedidas ao modelo: metros, +Y para cima, frente em +Z, origem na linha d'água (bichos de água) ou nos pés/poleiro;
// clips "no lugar" (sem deslocar a raiz): a trajetória é do código (fauna.js).
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Por espécie: clips lógicos (com sinônimos aceitos), máximo de cópias animadas por qualidade [leve, média, alta],
// e orçamento de triângulos por cópia [leve, média, alta] (só para o aviso no console e para o FAUNA_INTEGRACAO.md).
export const ESPECIES_GLB={
  // fauna_v1 (22/11/2026): os nomes reais dos clipes são nadar/respiro/voo/pousado(a)/mergulho/parado/margem/parada/andar/sol.
  // Onde o arquivo não tem o clipe pedido pela cena (salto do boto, decolagem da garça...), o índice aponta o mais próximo e a trajetória é do código.
  boto:{clips:{salto:['salto','jump','nadar'],nada:['nadar','nada','swim'],respiro:['respiro']},max:[1,2,2],tris:[500,1200,2500]},
  martim:{clips:{voo:['voo','fly','voa'],paira:['paira','hover','voo'],mergulho:['mergulho','dive'],pousada:['pousada','pousado','idle','perch']},max:[1,1,1],tris:[400,500,900]},
  garca:{clips:{pousada:['pousada','parada','idle'],decola:['decola','takeoff','voo'],voo:['voo','fly','voa']},max:[3,6,10],tris:[300,600,1200]},
  moura:{clips:{pousada:['pousada'],decola:['voo'],voo:['voo']},max:[1,2,3],tris:[300,600,1200]},
  arara:{clips:{voo:['voo','fly','voa'],pousada:['pousada']},max:[2,3,4],tris:[300,600,1100]},
  caninde:{clips:{voo:['voo','fly','voa'],pousada:['pousada']},max:[1,3,4],tris:[300,600,1100]},
  tucano:{clips:{pousada:['pousada','pousado','idle'],voo:['voo','fly']},max:[2,2,2],tris:[300,600,1100]},
  jacare:{clips:{sol:['margem','sol'],boia:['parado','boia','float','idle'],anda:['anda','walk','nadar'],nada:['nadar','nada','swim']},max:[1,1,1],tris:[600,1500,3000]},
  capivara:{clips:{parada:['parada','idle'],anda:['andar','anda','walk'],bebe:['bebe','drink','parada'],come:['come','eat','graze','parada'],nada:['nadar']},max:[3,5,6],tris:[400,900,1800]},
  peixe:{clips:{salto:['salto','jump','nadar'],nada:['nadar']},max:[1,2,2],tris:[200,250,400]},
  pirarucu:{clips:{nada:['nadar','nada']},max:[1,1,1],tris:[200,300,500]},
  onca:{clips:{anda:['anda','walk'],parada:['parada','idle','olha'],bebe:['bebe','drink']},max:[1,1,1],tris:[800,1800,3500]},
  preguica:{clips:{parada:['parada','idle','pendurada']},max:[1,1,1],tris:[400,900,1800]},
  macaco:{clips:{parada:['parada','idle','ronca']},max:[3,6,6],tris:[300,700,1400]},
  tartaruga:{clips:{parada:['sol','parada','idle'],nada:['nadar','nada']},max:[3,6,6],tris:[300,300,350]},
  // rodada 4 (fauna_v1_3): espécies que ganharam cena. max = cópias com esqueleto por qualidade [leve, média, alta] (o teto global 3/6/10 vale por cima)
  pato:{clips:{nada:['nadar'],voo:['voo'],pousada:['pousado']},max:[1,3,4],tris:[300,450,600]},
  bigua:{clips:{nada:['nadar'],voo:['voo'],secar:['secar'],pousada:['pousado']},max:[1,2,2],tris:[300,450,600]},
  ariranha:{clips:{nada:['nadar'],espia:['espiar']},max:[1,2,3],tris:[200,300,400]},
  borboleta:{clips:{voo:['voo'],pousada:['pousada']},max:[0,2,3],tris:[40,60,80]},
  tucuxi:{clips:{salto:['salto'],nada:['nadar'],respiro:['respiro']},max:[1,2,2],tris:[300,350,500]},
  jacaretinga:{clips:{boia:['parado'],nada:['nadar'],sol:['margem']},max:[1,2,3],tris:[600,800,1000]},
  vitoria:{clips:{flutua:['flutuar']},max:[0,0,0],tris:[200,300,400]},   // só instanciada (estática), nunca com esqueleto
  cardume:{clips:{nada:['nadar']},max:[0,0,0],tris:[80,120,150]},       // só instanciado, ondulação no shader
};
// teto de cópias com esqueleto visíveis ao mesmo tempo (= mixers ativos), somando todas as espécies [leve, média, alta]. ?faunamax=N muda para teste.
export const TETO_GLB=[3,6,10];

// cópia de uma hierarquia com SkinnedMesh (o mesmo que SkeletonUtils.clone, que não está em site/vendor)
function clona(src){const a=[],b=[];const c=src.clone(true);src.traverse(o=>a.push(o));c.traverse(o=>b.push(o));const par=new Map();a.forEach((o,i)=>par.set(o,b[i]));
  a.forEach((o,i)=>{if(o.isSkinnedMesh){const n=b[i];n.skeleton=o.skeleton.clone();n.skeleton.bones=o.skeleton.bones.map(x=>par.get(x)||x);n.bindMatrix.copy(o.bindMatrix);n.bind(n.skeleton,n.bindMatrix)}});return c}
// ossos de mentira: o código procedural mexe em userData.o.<osso>; num GLB isso não existe e é ignorado sem erro
const ossosFalsos=()=>new Proxy({},{get:(t,k)=>t[k]||(t[k]=new THREE.Object3D())});

export class FaunaGLB{
  constructor({T=1,env=null,comEnv=null,base=null,aoMaterial=null}={}){const Q=new URLSearchParams(location.search);this.T=T;this.env=env;this.comEnv=comEnv;this.aoMaterial=aoMaterial;
    this.base=base||Q.get('fauna')||'fauna/';if(!this.base.endsWith('/'))this.base+='/';this.desligado=Q.get('fauna')==='0';this.esp={};this.estado='esperando';this.relatorio={pedidos:0,carregados:[],falhas:[]};this.q={};this.teto=+Q.get('faunamax')||TETO_GLB[T]||6;this.at=0}
  // lê o índice e baixa só os arquivos da qualidade atual; nunca rejeita
  carrega(){if(this._p)return this._p;if(this.desligado){this.estado='desligado';return this._p=Promise.resolve(this)}
    return this._p=fetch(this.base+'indice.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null).then(async j=>{const E=j&&j.especies&&typeof j.especies==='object'?j.especies:{};const nomes=Object.keys(E);if(!nomes.length){this.estado='vazio';return this}
      const L=new GLTFLoader(),niv=['c','b','a'][this.T],Q0=new URLSearchParams(location.search);
      await Promise.all(nomes.map(async n=>{const d=E[n]||{},arq=d.arquivos||{},f=arq[niv]||arq.b||arq.a||arq.c||d.arquivo;if(!f)return;this.relatorio.pedidos++;
        try{const g=await L.loadAsync(this.base+f);this._registra(n,d,g,f)}catch(e){this.relatorio.falhas.push(n+': '+f);console.warn('fauna GLB: não carregou',f,'(vale a versão procedural)')}}));
      if(j.teto&&j.teto[this.T]&&!Q0.get('faunamax'))this.teto=j.teto[this.T];this.estado=this.relatorio.carregados.length?'pronto':'vazio';return this})}
  _registra(n,d,g,f){const cfg=ESPECIES_GLB[n]||{clips:{},max:[1,2,3],tris:[500,1200,2500]};let tris=0,pele=false;g.scene.traverse(o=>{if(o.isMesh){o.castShadow=false;o.frustumCulled=!o.isSkinnedMesh;if(o.isSkinnedMesh){pele=true;o.frustumCulled=false}const G=o.geometry;tris+=(G.index?G.index.count:G.attributes.position.count)/3;
      for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m||m.userData._fauna)continue;m.userData._fauna=true;if(this.env&&'envMap' in m){m.envMap=this.env;m.envMapIntensity=.5;m.userData.env=.5;this.comEnv&&this.comEnv.push(m)}this.aoMaterial&&this.aoMaterial(m,n)}}});
    // nome lógico → clip: o índice manda; senão, sinônimos; por último, o primeiro clip do arquivo serve de reserva
    const clips={},porNome=s=>g.animations.find(c=>c.name.toLowerCase()===String(s).toLowerCase())||g.animations.find(c=>c.name.toLowerCase().includes(String(s).toLowerCase()));
    for(const k of new Set([...Object.keys(cfg.clips||{}),...Object.keys(d.clips||{})])){let c=d.clips&&d.clips[k]?porNome(d.clips[k]):null;if(!c)for(const s of (cfg.clips&&cfg.clips[k])||[k]){c=porNome(s);if(c)break}if(c)clips[k]=c}
    const lim=cfg.tris[this.T];if(tris>lim*1.5)console.warn(`fauna GLB: ${f} tem ${Math.round(tris)} triângulos (orçamento ${lim} nesta qualidade)`);
    this.esp[n]={n,cfg,d,cena:g.scene,anim:g.animations,clips,pele,tris:Math.round(tris),max:(d.max&&d.max[this.T])||cfg.max[this.T],inst:[],arquivo:f};this.relatorio.carregados.push({n,arquivo:f,tris:Math.round(tris),clips:Object.keys(clips),todos:g.animations.map(c=>c.name),pele})}
  tem(n){return !!this.esp[n]}
  _nova(E){const pivo=new THREE.Group(),c=clona(E.cena),d=E.d,es=d.escala||1;c.scale.multiplyScalar(es);c.rotation.y+=d.giro||0;c.position.y+=d.y||0;pivo.add(c);pivo.name='glb_'+E.n;const y0=c.position.y,yC=d.yClip||{},def=d.defasa===undefined?.37:d.defasa,k=E.inst.length;
    const mixer=E.anim.length?new THREE.AnimationMixer(c):null,acts={};let atual=null;
    const ato=nome=>{const clip=E.clips[nome]||E.anim[0];if(!clip||!mixer)return null;return acts[clip.name]||(acts[clip.name]=mixer.clipAction(clip))};
    // yClip (índice): deslocamento vertical por clipe lógico, em metros do modelo (ex.: o "nadar" do boto afunda o corpo 0,54 m; no salto isso é desfeito)
    const sobe=nome=>{c.position.y=y0+(yC[nome]||0)*es};
    const I={obj:pivo,mixer,especie:E.n,usado:false,manual:false,
      // toca em laço (ou uma vez), com transição curta; chamar todo quadro com o mesmo nome não reinicia. Cada cópia começa o laço num ponto diferente (bando não bate asa junto)
      toca(nome,{laco=true,fade=.25,vel=1}={}){const a=ato(nome);if(!a)return false;I.manual=false;if(I._sai){I._sai.a.stop();I._sai=null}a.setEffectiveWeight(1);a.timeScale=vel;a.paused=false;if(atual===a&&a.isRunning())return true;sobe(nome);a.reset();a.setLoop(laco?THREE.LoopRepeat:THREE.LoopOnce,laco?Infinity:1);a.clampWhenFinished=!laco;if(laco)a.time=((k*def)%1)*a.getClip().duration;a.play();if(atual&&atual!==a)atual.crossFadeTo(a,fade,false);atual=a;return true},
      // posiciona o clip pela fase 0..1 (salto em arco, mergulho): o código dá o tempo, não o relógio
      // rodada 4: a troca para um clipe dirigido por fase mistura com o anterior em ~0,25 s (o anterior continua andando no próprio relógio enquanto some)
      fase(nome,p,dt=1/60,fade=.25){const a=ato(nome);if(!a)return false;I.manual=true;if(atual!==a||!a.isRunning()){if(atual&&atual!==a&&atual.isRunning()&&fade>0){if(I._sai&&I._sai.a!==atual)I._sai.a.stop();I._sai={a:atual,w:1,f:fade};atual.paused=true}else if(atual&&atual!==a)atual.stop();sobe(nome);a.reset();a.play();atual=a}
        a.paused=true;a.time=Math.max(0,Math.min(.9999,p))*a.getClip().duration;const S=I._sai;if(S){S.w-=dt/S.f;if(S.w<=0){S.a.stop();I._sai=null;a.setEffectiveWeight(1)}else{S.a.time=(S.a.time+dt*S.a.timeScale)%S.a.getClip().duration;S.a.setEffectiveWeight(S.w);a.setEffectiveWeight(1-S.w)}}else a.setEffectiveWeight(1);mixer.update(0);return true},
      solta(){if(pivo.parent)pivo.parent.remove(pivo);I.usado=false}};
    pivo.userData.o=ossosFalsos();pivo.userData.glb=I;E.inst.push(I);if(mixer){const a=ato('_');if(a){a.play();atual=a;mixer.update(0)}}return I}
  // uma cópia para uma cena (fica com quem pediu até sair da árvore). null se a espécie não existe em GLB ou o limite da qualidade estourou
  pega(n){const E=this.esp[n];if(!E)return null;let I=E.inst.find(i=>!i.obj.parent&&!i.quadro);if(!I){if(E.inst.filter(i=>!i.quadro).length>=E.max||this.at>=this.teto)return null;I=this._nova(E)}else if(this.at>=this.teto)return null;this.at++;I.usado=true;I.dorme=false;I.obj.visible=true;I.obj.position.set(0,0,0);I.obj.rotation.set(0,0,0);I.obj.scale.setScalar(1);return I}
  // cópias "por quadro" (aves em bando): pede-se a cada quadro; as que não forem pedidas somem. pai: onde pendurar
  // this.at = cópias visíveis (contadas no começo do quadro); uma cópia que já estava visível não gasta teto de novo
  comeca(){for(const n in this.q)this.q[n].n=0;let a=0;for(const n in this.esp)for(const I of this.esp[n].inst)if(I.obj.parent&&(I.obj.visible||(!I.quadro&&!I.dorme)))a++;this.at=a} // rodada 4: cópia reservada por cena (pega), mesmo escondida, conta no teto
  doQuadro(n,pai){const E=this.esp[n];if(!E)return null;const Q=this.q[n]||(this.q[n]={n:0,l:[]});if(Q.n>=E.max)return null;let I=Q.l[Q.n];if(!I||!I.obj.visible){if(this.at>=this.teto)return null;this.at++}if(!I){I=this._nova(E);I.quadro=true;Q.l.push(I);pai.add(I.obj)}Q.n++;I.obj.visible=true;return I}
  termina(dt){for(const n in this.q){const Q=this.q[n];for(let i=Q.n;i<Q.l.length;i++)Q.l[i].obj.visible=false}let m=0;
    for(const n in this.esp)for(const I of this.esp[n].inst)if(I.mixer&&I.obj.visible&&I.obj.parent){m++;if(!I.manual)I.mixer.update(dt)}this.mixers=m}
  // estáticos em massa (sem esqueleto): uma InstancedMesh por malha do arquivo. Devolve {grupo, poe(i,x,y,z,yaw,esc), n(k)} ou null
  // rodada 4: estatica=true aceita malha com esqueleto, desenhada na pose de repouso (vitória-régia; cardume com ondulação no shader de quem chama)
  instancias(n,cap=16,estatica=false,mat=null){const E=this.esp[n];if(!E||(E.pele&&!estatica))return null;const g=new THREE.Group(),ms=[],M=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),s=new THREE.Vector3(),loc=[];E.cena.updateMatrixWorld(true);
    E.cena.traverse(o=>{if(o.isMesh){const im=new THREE.InstancedMesh(o.geometry,mat||o.material,cap);im.count=0;im.frustumCulled=false;ms.push(im);loc.push(o.matrixWorld.clone());g.add(im)}});const d=E.d,es=d.escala||1;
    return {grupo:g,ms,poe(i,x,y,z,yaw=0,esc=1,pitch=0){if(i>=cap)return;e.set(pitch,yaw+(d.giro||0),0,'YXZ');q.setFromEuler(e);p.set(x,y+(d.y||0),z);s.setScalar(esc*es);M.compose(p,q,s);ms.forEach((im,k)=>{im.setMatrixAt(i,M.clone().multiply(loc[k]));im.instanceMatrix.needsUpdate=true})},n(k){for(const im of ms)im.count=Math.min(cap,k)}}}
}
