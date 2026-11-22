// O rio: uma linha central calculada por código, com largura, biomas e margens definidos ao longo da história.
// Tudo no mundo é colocado em coordenadas do rio: s (ao longo) e lat (para o lado; + à esquerda de quem desce).
import {sst,mix,clamp,ruido2,fbm2} from './util.js';

const DS=4;
// Interpola uma tabela [[s,valor],...] com curva suave
function chave(tab,s){if(s<=tab[0][0])return tab[0][1];for(let i=0;i<tab.length-1;i++){const a=tab[i],b=tab[i+1];if(s<b[0]){const t=(s-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t*t*(3-2*t)}}return tab[tab.length-1][1]}

export class Rio{
  // ROT: tabelas do roteiro (ver historia.js)
  constructor(ROT){this.ROT=ROT;const L=this.L=ROT.comprimento,n=this.n=Math.ceil(L/DS)+1;
    const x=this.x=new Float32Array(n),z=this.z=new Float32Array(n),h=this.hd=new Float32Array(n),c=this.curv=new Float32Array(n);
    let px=0,pz=0;for(let i=0;i<n;i++){const s=i*DS;h[i]=this.rumo(s);x[i]=px;z[i]=pz;px+=Math.sin(h[i])*DS;pz+=Math.cos(h[i])*DS}
    for(let i=1;i<n-1;i++)c[i]=(h[i+1]-h[i-1])/(2*DS);c[0]=c[1];c[n-1]=c[n-2];this.clareiras=[];
    // tabelas pré-calculadas por amostra: consultas no laço de jogo não fazem contas de ruído
    this.W=new Float32Array(n);for(let i=0;i<n;i++)this.W[i]=chave(ROT.largura,i*DS);}
  rumo(s){const R=this.ROT;let reto=1;for(const p of R.paradas)reto=Math.min(reto,sst(14,120,Math.abs(s-p.s)));const am=chave(R.sinuoso,s)*(.35+.65*reto);
    const a=Math.sin(s*2*Math.PI/870+.7)*.62+Math.sin(s*2*Math.PI/410+2.1)*.32+Math.sin(s*2*Math.PI/1730+.2)*.5;return R.rumo0+a*am}
  // Ponto e referencial no rio
  em(s,o={}){const q=clamp(s,0,this.L-.01)/DS,i=Math.floor(q),k=q-i,j=Math.min(i+1,this.n-1);const h=this.hd[i]+(this.hd[j]-this.hd[i])*k;o.x=this.x[i]+(this.x[j]-this.x[i])*k;o.z=this.z[i]+(this.z[j]-this.z[i])*k;o.tx=Math.sin(h);o.tz=Math.cos(h);o.nx=o.tz;o.nz=-o.tx;o.h=h;o.w=this.W[i]+(this.W[j]-this.W[i])*k;return o}
  mundo(s,lat,o={}){this.em(s,o);o.px=o.x+o.nx*lat;o.pz=o.z+o.nz*lat;return o}
  larg(s){return chave(this.ROT.largura,s)}
  alag(s){return chave(this.ROT.alagado,s)}
  praia(s){return chave(this.ROT.praia,s)}
  pedra(s){return chave(this.ROT.pedra,s)}
  // Margem irregular: enseadas e pontas de terra
  borda(s,lado){return this.larg(s)+(fbm2(s*.011+lado*31.7,3.3,3)-.5)*22*(.45+this.larg(s)/110)+(ruido2(s*.05,lado*9.1)-.5)*5}
  defineClareiras(l){this.clareiras=l}
  clareira(s,lat){let k=0,y=0,g=0;const lado=lat>=0?1:-1;for(const c of this.clareiras){if(c.e!==lado)continue;const ds=Math.abs(s-c.s);if(ds>c.ds+40)continue;const W=this.larg(c.s);const dl=Math.abs(lat)-W;const q=sst(c.ds+24,c.ds,ds)*sst(c.l1+26,c.l1,dl)*sst(-16,-4,dl);if(q>k){k=q;y=c.y;g=sst(c.ds+10,c.ds-2,ds)*sst(c.l1+10,c.l1-2,dl)*sst(3,9,dl)}}return {k,y,g}}
  // Altura do terreno, para o relevo e para colocar árvores e bichos
  altura(s,lat){const lado=lat>=0?1:-1,al=Math.abs(lat),W=this.borda(s,lado),d=al-W,f=this.alag(s);let h;
    if(d<0)h=Math.max(-7,d*.2);else{const ond=fbm2(s*.018,al*.018+lado*7,3);h=(1-Math.exp(-d/9))*(1.6+ond*2.4)+Math.max(0,d-14)*.012*ond*3}
    if(f>0&&d>-6){const il=fbm2(s*.024+11,al*.031+lado*3,3);const ilha=sst(.5,.66,il);const nivel=mix(-.9,1.1,ilha);h=mix(h,Math.min(h,nivel+Math.max(0,d-46)*.05),f)}
    const c=this.clareiras.length?this.clareira(s,lat):null;if(c&&c.k>0)h=mix(h,c.y,c.k);return h}
}
export {chave};
