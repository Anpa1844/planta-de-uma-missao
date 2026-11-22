// O acervo expandido da V5: painel de cada parada, percurso pelos 67 marcos, rotas temáticas e a ficha da Luzeiro I.
// Os dados vêm de acervo/acervo.json (gerado por preparo/v5_acervo.py), carregados só quando alguém abre um painel.
// Fotos: só as que têm arquivo no diretório servido (public_use). As outras aparecem como legenda, crédito e ficha de origem.
const CSS=`
#aPainel{position:fixed;z-index:21;right:0;top:0;bottom:0;width:min(520px,100vw);background:rgba(9,20,18,.96);border-left:1px solid rgba(233,199,126,.34);color:var(--papel);overflow:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:26px 26px 60px;padding-top:max(26px,env(safe-area-inset-top));-webkit-user-select:text;user-select:text}
#aPainel.largo{left:0;width:auto;border:0;padding-left:max(26px,7vw);padding-right:max(26px,7vw)}
@media (max-width:700px),(orientation:portrait){#aPainel{left:0;width:auto;top:22%;border-left:0;border-top:1px solid rgba(233,199,126,.34);border-radius:14px 14px 0 0}#aPainel.largo{top:0;border-radius:0}}
#aPainel .fecha{position:fixed;right:12px;top:max(12px,env(safe-area-inset-top));font-size:30px;width:44px;height:44px;z-index:3;background:rgba(9,20,18,.8);border-radius:50%}
#aPainel .volta{font-size:14px;color:var(--ouro);padding:6px 0;margin-bottom:6px}
#aPainel .ano{font-size:50px;color:var(--ouro);line-height:1}
#aPainel h2{font-weight:400;font-size:clamp(23px,3.2vw,30px);line-height:1.2;margin:8px 0 6px}
#aPainel h3{font-weight:400;font-size:12px;letter-spacing:.2em;color:var(--ouro);margin:26px 0 10px;text-transform:uppercase}
#aPainel p{font-size:16.5px;line-height:1.55;margin:0 0 12px}
#aPainel .ev{font-style:italic;color:#d9d0b9;font-size:15px}
#aPainel .duas{display:grid;gap:10px;margin:14px 0}
#aPainel .duas div{border-left:2px solid var(--ouro);padding:2px 0 2px 12px}
#aPainel .duas small{display:block;font-size:11px;letter-spacing:.18em;color:var(--ouro);margin-bottom:3px}
#aPainel .gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin:14px 0}
#aPainel .gal button{padding:0;border-radius:3px;overflow:hidden;background:#0d1a18;cursor:zoom-in;display:block}
#aPainel .gal img{width:100%;height:auto;max-height:190px;object-fit:contain;display:block}
#aPainel .evt{border:1px solid rgba(233,199,126,.24);border-radius:7px;margin:8px 0;background:rgba(244,239,226,.03)}
#aPainel .evt>button{display:block;width:100%;text-align:left;padding:11px 40px 11px 13px;position:relative}
#aPainel .evt>button::after{content:"+";position:absolute;right:14px;top:10px;font-size:22px;color:var(--ouro)}
#aPainel .evt.ab>button::after{content:"–"}
#aPainel .evt b{display:block;font-weight:400;font-size:13px;color:var(--ouro);letter-spacing:.04em}
#aPainel .evt span{display:block;font-size:17px;line-height:1.25;margin-top:2px}
#aPainel .evt em{display:block;font-size:12.5px;color:#c9bf9f;margin-top:3px;font-style:normal}
#aPainel .evt .corpo{padding:0 13px 12px}
#aPainel .evt .corpo p{font-size:15.5px}
#aPainel .nota{font-size:13.5px!important;color:#cfc6ad;border-left:2px solid rgba(233,199,126,.4);padding-left:10px}
#aPainel .selo{display:inline-block;font-size:11px;letter-spacing:.08em;border:1px solid rgba(233,199,126,.5);border-radius:10px;padding:1px 8px;margin-left:6px;color:var(--ouro);vertical-align:middle}
#aPainel figure{margin:10px 0;padding:0}
#aPainel figure button{padding:0;display:block;cursor:zoom-in;background:#0d1a18;border-radius:3px;overflow:hidden;max-width:100%}
#aPainel figure img{display:block;max-width:100%;height:auto;max-height:300px}
#aPainel figcaption,#aPainel .semfoto{font-size:13px;line-height:1.4;color:#d4ccb6;margin-top:5px}
#aPainel .semfoto{border:1px dashed rgba(233,199,126,.3);border-radius:5px;padding:8px 10px;margin:8px 0}
#aPainel .semfoto i,#aPainel figcaption i{display:block;color:#a9a086;font-style:normal;font-size:12px;margin-top:2px}
#aPainel a{color:var(--ouro)}
#aPainel .fontes{font-size:13px;color:#c9bf9f;line-height:1.5}
#aPainel .chips{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0 4px}
#aPainel .chips button{padding:6px 12px;border:1px solid rgba(233,199,126,.4);border-radius:20px;font-size:14px}
#aPainel .chips button[aria-pressed=true]{background:var(--ouro);color:#14231f}
#aPainel .ir{display:inline-block;margin:6px 0 0;padding:8px 16px;border:1px solid var(--ouro);border-radius:22px;font-size:14.5px}
#aPainel table{border-collapse:collapse;width:100%;font-size:14.5px;margin:8px 0}
#aPainel th,#aPainel td{text-align:left;padding:7px 8px;border-bottom:1px solid rgba(244,239,226,.14);vertical-align:top}
#aPainel th{font-weight:400;color:var(--ouro);font-size:12px;letter-spacing:.08em}
#aPainel .aviso{background:rgba(233,199,126,.1);border:1px solid rgba(233,199,126,.4);border-radius:7px;padding:10px 12px;font-size:14.5px;line-height:1.45;margin:12px 0}
#aPainel .conta{font-size:13px;color:#c9bf9f;margin:8px 0}
#aPainel button:focus-visible,#rZoom button:focus-visible{outline:2px solid var(--ouro);outline-offset:2px}
#rZoom figcaption{position:absolute;left:0;right:0;bottom:0;padding:12px 16px max(14px,env(safe-area-inset-bottom));background:linear-gradient(transparent,rgba(0,0,0,.85));font-size:14px;line-height:1.4;color:#eee;text-align:center;pointer-events:none}
`;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const VERIF={documentado:'',divergencia:'fontes divergem',data_inferida:'data inferida',previsto:'previsto'};
const REL={registro_do_evento:'Registro do evento',registro_dos_participantes:'Registro dos participantes',registro_de_celebracao:'Registro de celebração',registro_de_reuniao_do_periodo:'Registro de reunião do período',contexto_de_continuidade:'Contexto: continuidade da história',contexto_biografico:'Contexto biográfico',contexto_tematico:'Contexto temático',contexto_geografico:'Contexto geográfico',representacao_editorial:'Representação editorial',documento_relacionado:'Documento relacionado'};
const num=(v,d=2)=>v==null?'—':Number(v).toLocaleString('pt-BR',{maximumFractionDigits:d});

export function montaAcervo({MARCOS,salta,abreZoom,cartao,aoAbrir,aoFechar}){
  const st=document.createElement('style');st.textContent=CSS;document.head.append(st);
  const P=document.createElement('section');P.id='aPainel';P.hidden=true;P.setAttribute('role','dialog');P.setAttribute('aria-modal','false');P.tabIndex=-1;document.body.append(P);
  let A=null,carga=null,foco=null,pilha=[];
  const dados=()=>carga||(carga=fetch('acervo/acervo.json').then(r=>r.json()).then(j=>{j.porId={};for(const e of j.eventos)j.porId[e.id]=e;A=j;return j}));
  const fecha=()=>{if(P.hidden)return;P.hidden=true;pilha=[];aoFechar&&aoFechar();if(foco&&document.contains(foco))foco.focus({preventScroll:true});foco=null};
  const abre=(html,largo,rotulo)=>{if(P.hidden){foco=document.activeElement;aoAbrir&&aoAbrir()}P.classList.toggle('largo',!!largo);P.setAttribute('aria-label',rotulo);P.innerHTML=`<button class=fecha aria-label="Fechar">×</button>`+(pilha.length?`<button class=volta data-volta=1>‹ Voltar</button>`:'')+html;P.hidden=false;P.scrollTop=0;P.focus({preventScroll:true})};
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!P.hidden&&document.getElementById('rZoom').hidden){e.stopPropagation();fecha()}});
  // ---------- peças ----------
  const midia=id=>{const m=A.midias[id];if(!m)return '';const quando=[m.data,m.nota].filter(Boolean).join(' · ');const rel=REL[m.rel]||'';const ia=m.ia?'<i>Imagem editorial com indício de geração ou tratamento por IA; procedência na ficha de origem.</i>':'';const ficha=m.url?` · <a href="${esc(m.url)}" target=_blank rel="noopener noreferrer">ficha de origem</a>`:'';
    const leg=`<b style="font-weight:400;color:var(--papel)">${esc(m.titulo)}</b><i>${esc([rel,quando].filter(Boolean).join(' · '))}</i><i>Crédito: ${esc(m.credito)}${ficha}</i>${ia}`;
    if(m.arq)return `<figure><button data-zoom="acervo/img/${esc(m.arq)}" data-leg="${esc(m.titulo+' · '+m.credito)}" aria-label="Ampliar: ${esc(m.alt)}"><img loading=lazy src="acervo/img/${esc(m.arq)}" alt="${esc(m.alt)}" width="${m.w||''}" height="${m.h||''}"></button><figcaption>${leg}</figcaption></figure>`;
    return `<div class=semfoto>${leg}<i>Fotografia do acervo indicado; aguarda autorização para ser exibida aqui. Descrição: ${esc(m.alt)}</i></div>`};
  const fontes=ids=>ids.length?`<p class=fontes>Fontes: ${ids.map(i=>{const f=A.fontes[i];return f?(f.url?`<a href="${esc(f.url)}" target=_blank rel="noopener noreferrer">${esc(f.titulo)}</a>`:esc(f.titulo)):''}).filter(Boolean).join(' · ')}</p>`:'';
  const corpo=e=>`<p>${esc(e.resumo)}</p>${e.detalhe?`<p>${esc(e.detalhe)}</p>`:''}${e.nota?`<p class=nota>Nota: ${esc(e.nota)}</p>`:''}${e.midias.map(midia).join('')}${fontes(e.fontes)}`;
  const item=(e,comIr)=>`<div class=evt data-e="${e.id}"><button aria-expanded=false><b>${esc(e.data)}${VERIF[e.verif]?`<i class=selo>${VERIF[e.verif]}</i>`:''}</b><span>${esc(e.titulo)}</span><em>${esc(e.local)} · ${esc(A.categorias[e.cat]||e.cat)}${e.midias.length?` · ${e.midias.length} ${e.midias.length>1?'imagens':'imagem'}`:''}</em></button><div class=corpo hidden data-ir="${comIr?e.baliza:''}"></div></div>`;
  // ---------- painel da parada ----------
  const parada=async i=>{const m=MARCOS[i];await dados();const c=cartao?cartao(i):null;const pr=m.eventos.map(id=>A.porId[id]).filter(Boolean),rl=m.relacionados.map(id=>A.porId[id]).filter(Boolean);
    abre(`<div class=ano>${esc(m.ano)}</div><h2>${esc(m.titulo)}</h2><p class=ev>Baliza ${m.n} de ${MARCOS.length} · ${esc(m.evento)}</p>
      ${c&&(c.oque||c.porque)?`<div class=duas>${c.oque?`<div><small>O QUE ACONTECEU</small>${esc(c.oque)}</div>`:''}${c.porque?`<div><small>POR QUE IMPORTA</small>${esc(c.porque)}</div>`:''}</div>`:''}
      ${m.fotos.length?`<div class=gal>${m.fotos.map(f=>`<button data-zoom="fotos/${f}" data-leg="${esc(m.ano+' · '+m.titulo)}" aria-label="Ampliar foto de ${esc(m.titulo)}"><img loading=lazy src="fotos/${f}" alt="${esc(m.titulo)}"></button>`).join('')}</div>`:''}
      <p>${esc(m.texto)}</p>
      <h3>Nesta baliza, em detalhe</h3>${pr.map(e=>item(e)).join('')}
      ${rl.length?`<h3>Na mesma época (${rl.length})</h3>${rl.map(e=>item(e)).join('')}`:''}
      <p style="margin-top:22px"><button class=ir data-abre=percurso>Ver os ${A.eventos.length} marcos da linha do tempo</button> ${m.ano==='1931'?'<button class=ir data-abre=luzeiro>Ficha da Luzeiro I</button>':''}</p>`,false,`${m.ano}: ${m.titulo}`)};
  // ---------- percurso pelos 67 marcos ----------
  let filtro={tipo:'todos',v:''};
  const percurso=async()=>{await dados();const lista=filtro.tipo==='cat'?A.eventos.filter(e=>e.cat===filtro.v):filtro.tipo==='rota'?A.rotas.find(r=>r.id===filtro.v).eventos.map(id=>A.porId[id]).filter(Boolean):A.eventos;const cats=Object.keys(A.categorias);
    const chip=(t,v,txt)=>`<button data-f="${t}|${v}" aria-pressed=${filtro.tipo===t&&filtro.v===v}>${esc(txt)}</button>`;
    abre(`<h2>Linha do tempo completa</h2><p class=ev>${A.eventos.length} marcos, de ${A.eventos[0].ano} a ${A.eventos[A.eventos.length-1].ano}. Uma foto ligada a um marco pode mostrar o evento, as pessoas ou só o contexto: a legenda de cada imagem diz qual é o caso.</p>
      <h3>Rotas temáticas</h3><div class=chips>${chip('todos','','Todos os marcos')}${A.rotas.map(r=>chip('rota',r.id,r.titulo)).join('')}</div>
      <h3>Por assunto</h3><div class=chips>${cats.map(c=>chip('cat',c,A.categorias[c])).join('')}</div>
      <p class=conta aria-live=polite>${lista.length} ${lista.length===1?'marco':'marcos'}${filtro.tipo==='rota'?' nesta rota, na ordem sugerida':''}</p>
      ${lista.map(e=>item(e,true)).join('')}
      <p style="margin-top:22px"><button class=ir data-abre=luzeiro>Ficha da Luzeiro I</button></p>`,true,'Linha do tempo completa')};
  // ---------- ficha da Luzeiro I: as medidas divergem e isso fica à vista ----------
  const luzeiro=async()=>{await dados();const L=A.luzeiro,ms=L.medidas_publicadas,cs=ms.map(m=>m.comprimento_m),min=Math.min(...cs),max=Math.max(...cs);
    abre(`<div class=ano>1931</div><h2>${esc(L.nome)}: a ficha do barco</h2><p class=ev>Inaugurada em ${esc(L.inauguracao.split('-').reverse().join('/'))}, ${esc(L.local)}. Projeto de ${esc(L.construcao.projeto)}, construída por ${esc(L.construcao.construtor)} (${esc(L.construcao.duracao.toLowerCase())}).</p>
      <div class=aviso><b style="font-weight:400;color:var(--ouro)">As medidas não fecham.</b> As fontes publicam comprimentos de ${num(min,1)} a ${num(max,1)} metros. Nenhuma foi conferida no casco preservado, que passou por reformas. O barco desta viagem usa ${num(L.escala_ar.referencia_editorial_m[0])} × ${num(L.escala_ar.referencia_editorial_m[1])} m como aproximação visual.</div>
      <h3>Medidas publicadas</h3><table><tr><th>Comprimento</th><th>Boca</th><th>Calado</th><th>De onde vem</th></tr>${ms.map(m=>`<tr><td>${num(m.comprimento_m)} m</td><td>${num(m.largura_m)} m</td><td>${num(m.calado_m)} m</td><td>${m.originais?esc(m.originais)+'. ':''}${esc(m.contexto)} ${m.source_ids.map(i=>A.fontes[i]&&A.fontes[i].url?`<a href="${esc(A.fontes[i].url)}" target=_blank rel="noopener noreferrer">${esc(A.fontes[i].titulo)}</a>`:esc((A.fontes[i]||{}).titulo||i)).join(' · ')}</td></tr>`).join('')}</table>
      <h3>Motor</h3><p>${num(L.motor_hp,0)} HP na origem. ${esc(L.motor_nota)}</p><p>Em 1975 recebeu um motor ${esc(L.reforma_1975.motor_marca)} de ${num(L.reforma_1975.motor_hp,0)} HP.</p>
      <h3>Reforma de 1937</h3><p>${esc(L.reforma_1937)}</p>
      <h3>Custo</h3><p>Cerca de ${num(L.financiamento_usd_historico,0)} dólares da época, levantados por Leo Halliwell nos Estados Unidos.</p>
      <h3>Hoje</h3><p>Deixou o serviço em ${L.retirada_de_servico_ano}. ${esc(L.preservacao)}</p>
      <h3>O interior que você vê</h3><p>O casco e o exterior seguem as fotos do barco preservado. O interior de 1937 a 1940 (bancos, redes, motor, farmácia, cozinha) é uma reconstituição a partir de relatos: parte é dedução e pode mudar quando novas fontes aparecerem.</p>
      ${fontes(L.source_ids)}<p style="margin-top:18px"><button class=ir data-abre=percurso data-f="cat|luzeiro">Ver os marcos das lanchas Luzeiro</button></p>`,false,'Ficha da Luzeiro I')};
  const TELAS={percurso,luzeiro};let atual=null;
  const vai=(nome,arg)=>{if(atual&&!P.hidden)pilha.push(atual);atual=[nome,arg];return nome==='parada'?parada(arg):TELAS[nome]()};
  P.addEventListener('click',e=>{const t=e.target.closest('button,a');if(!t||t.tagName==='A')return;
    if(t.classList.contains('fecha'))return fecha();
    if(t.dataset.volta){const [n,a]=pilha.pop();atual=null;const resto=pilha;pilha=[];vai(n,a).then(()=>{pilha=resto;if(pilha.length&&!P.querySelector('.volta'))P.querySelector('.fecha').insertAdjacentHTML('afterend','<button class=volta data-volta=1>‹ Voltar</button>')});return}
    if(t.dataset.zoom){abreZoom(t.dataset.zoom,t.dataset.leg,t);return}
    if(t.dataset.f&&!t.dataset.abre){const [a,b]=t.dataset.f.split('|');filtro={tipo:a,v:b};atual=null;const pl=pilha;pilha=[];percurso().then(()=>{pilha=pl;atual=['percurso']});return}
    if(t.dataset.abre){if(t.dataset.f){const [a,b]=t.dataset.f.split('|');filtro={tipo:a,v:b}}vai(t.dataset.abre);return}
    if(t.dataset.salta){const i=+t.dataset.salta;fecha();salta(i);return}
    const ev=t.parentElement.classList.contains('evt')?t.parentElement:null;if(ev){const c=ev.querySelector('.corpo'),ab=c.hidden;if(ab&&!c.dataset.ok){const d=A.porId[ev.dataset.e];c.innerHTML=corpo(d)+(c.dataset.ir?`<button class=ir data-salta="${+c.dataset.ir-1}">Navegar até a baliza ${c.dataset.ir} (${esc(MARCOS[+c.dataset.ir-1].ano)})</button>`:'');c.dataset.ok=1}c.hidden=!ab;ev.classList.toggle('ab',ab);t.setAttribute('aria-expanded',ab)}});
  return {abreParada:i=>{pilha=[];atual=null;return vai('parada',i)},abrePercurso:()=>{pilha=[];atual=null;return vai('percurso')},abreLuzeiro:()=>{pilha=[];atual=null;return vai('luzeiro')},aberto:()=>!P.hidden,fecha,dados};
}
