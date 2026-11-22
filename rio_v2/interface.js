// Tudo o que é interface: início, linha do tempo, legendas, títulos, botões, menu, leitura, diário de bordo e final.
export function montaInterface(){const d=document.createElement('div');d.innerHTML=`
<div id=rInicio><div class=chama><svg viewBox="0 0 44 64" aria-hidden=true><defs><radialGradient id=gC cx=".5" cy=".62" r=".6"><stop offset=0 stop-color="#fff5cf"/><stop offset=.45 stop-color="#ffb648"/><stop offset=1 stop-color="#e2571b" stop-opacity="0"/></radialGradient></defs><path d="M22 2C25 18 39 26 39 43a17 17 0 0 1-34 0C5 29 18 22 22 2Z" fill="url(#gC)"><animate attributeName=opacity values=".82;1;.88;1;.85" dur="2.6s" repeatCount=indefinite /></path></svg></div>
  <p class=kick>LINHA DO TEMPO · 1927 – 2026</p><h1>Planta de uma missão</h1><p class=sub>Uma viagem pelo rio da nossa história</p>
  <button id=rEmbarca disabled>Preparando o rio…</button><div id=rBarra><i></i></div>
  <small>Melhor com fone de ouvido e o som ligado. <a href="../index.html?modo=rio&v=1">Versão anterior</a></small></div>
<div id=rNegro></div>
<div id=rLinha><div id=rFita></div><i id=rAgulha></i><span id=rRumo></span></div>
<div id=rAno><b></b><span></span></div><div id=rLeg></div>
<div id=rFauna><b></b><em></em><span></span></div>
<svg id=rFio style="display:none"><line id=rFioL /><circle id=rFioP r=3 /></svg>
<div id=rJan style="display:none"><div class=foto><img id=rJanA alt=""><img id=rJanB alt=""></div><div class=txt><span id=rJanAno></span><span id=rJanTit></span><small><span>TOQUE PARA LER</span><span id=rJanPonto></span></small></div></div>
<div id=rLeme></div>
<div id=rAlav><i></i><b></b><small>MOTOR</small></div>
<div id=rDica></div><div id=rCamNome></div><button id=rPular hidden>Pular abertura</button><div id=rTitulo><small>LINHA DO TEMPO · 1927 – 2026</small><b>Planta de uma missão</b></div>
<div id=rBotoes><button id=rBtPausa aria-label="Pausar"><svg viewBox="0 0 24 24"><path d="M9 5v14M15 5v14"/></svg></button><button id=rBtCam aria-label="Trocar de câmera"><svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx=12 cy=13 r=3.4 /></svg></button><button id=rBtMenu aria-label="Abrir o menu"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div>
<div id=rMenu class=rPainel hidden><h4>SOM</h4><label>Narração<input type=range id=rVoz min=0 max=1 step=.01 value=1></label><label>Natureza<input type=range id=rAmb min=0 max=1 step=.01 value=1></label><label>Barco<input type=range id=rBar min=0 max=1 step=.01 value=1></label><label>Música<input type=range id=rMus min=0 max=1 step=.01 value=1></label><label>Legendas<input type=checkbox id=rTxt checked></label><h4>SALTAR PARA</h4><div class=lista id=rAnos></div><h4>QUALIDADE</h4><div class=lista id=rQual><button data-q="">Automática</button><button data-q=0>Leve</button><button data-q=1>Média</button><button data-q=2>Alta</button></div><h4>MAIS</h4><button class=grande id=rBtDiario>Diário de bordo</button><button class=grande id=rBtMapa>Mapa do capitão</button><button class=grande id=rBtRever>Rever do começo</button></div>
<article id=rLer class=rPainel hidden><button class=fecha aria-label=Fechar>×</button><div class=ano></div><h2></h2><p class=ev></p><div class=gal></div><p class=tx></p></article>
<div id=rDiario class=rPainel hidden><button class=fecha aria-label=Fechar>×</button><h2>Diário de bordo</h2><p class=sub>O que você já viu nesta viagem</p><h3>A HISTÓRIA</h3><div class=rGrade id=rDH></div><h3>A VIDA NO RIO</h3><div class=rGrade id=rDF></div></div>
<div id=rMapa hidden><button class=fecha aria-label=Fechar>×</button><div id=rMapaArea><div id=rMapaC><img alt="Mapa da viagem"><div id=rMapaP></div></div></div><p>Toque em um marco para saltar até ele · pinça para ampliar</p></div>
<div id=rZoom hidden><img alt=""><button aria-label=Fechar>×</button></div>
<div id=rPausa hidden><div>Viagem em pausa<button id=rContinua>▶ Continuar</button></div></div>
<div id=rFim><h2>À Luz da Palavra</h2><p>XIX Assembleia Ordinária · Associação Norte do Pará · 2026</p><p>Rumo ao centenário: 1927 – 2027</p><div class=bts><button id=rFimDiario>Diário de bordo</button><button id=rFimLivre>Navegar livremente</button><button id=rFimRever>Rever do começo</button></div></div>`;
  while(d.firstChild)document.body.append(d.firstChild);}
export const $=i=>document.getElementById(i);
