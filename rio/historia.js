// O roteiro no espaço: onde cada marco fica no rio, como o rio é em cada trecho e a hora do dia em cada ponto.
export {MARCOS} from '../conteudo.js';

const S=[452,690,930,1190,1442,1640,2080,2300,2560,2880,3120,3330,3620];
// e: +1 margem esquerda de quem desce, -1 direita
export const ROT={
  comprimento:4400,rumo0:.25,
  // árvores postas à mão: [espécie, s, lado, distância da margem, escala]
  especiais:[['sumauma',1392,-1,9,1.18],['seca',1312,1,6,1],['sumauma',780,1,4,1.05],['sumauma',2010,-1,8,1.1],['sumauma',3480,1,6,1.1]],
  // trechos de margem sem plantas altas, para ver os bichos: [s, lado, meia-extensão, distância da margem]
  livres:[[318,1,34,14],[896,1,24,16],[1058,1,24,14],[2192,1,18,12],[3205,1,62,18],[1392,-1,16,26]],
  paradas:[
    {s:S[0],e:-1},{s:S[1],e:1},{s:S[2],e:-1},{s:S[3],e:1},{s:S[4],e:-1,obra:'templo1937'},{s:S[5],e:1,obra:'templo1940'},
    {s:S[6],e:-1,obra:'radio1995',torre:[26,-16]},{s:S[7],e:1,obra:'sede1996'},{s:S[8],e:-1,obra:'sede2001'},{s:S[9],e:1,obra:'sede2009'},
    {s:S[10],e:-1,obra:'tv2014',torre:[20,-16]},{s:S[11],e:1,obra:'sede2014'},{s:S[12],e:-1,obra:'memoria2026'}],
  largura:[[0,58],[300,62],[560,48],[640,30],[780,28],[860,50],[1040,58],[1100,36],[1190,44],[1300,88],[1370,52],[1640,60],[1800,92],[1980,70],[2080,48],[2300,52],[2560,60],[2720,120],[2880,74],[3120,56],[3330,58],[3620,52],[3900,64],[4400,84]],
  alagado:[[0,0],[540,0],[640,1],[800,1],[880,0],[1050,0],[1120,.8],[1180,.8],[1240,0],[1820,0],[1900,.7],[2000,.7],[2060,0],[3700,0],[3780,.6],[4100,.6],[4240,0]],
  praia:[[0,0],[2660,0],[2740,1],[2860,1],[2960,0],[4400,0]],
  pedra:[[0,0],[2480,0],[2560,.9],[2640,.2],[2700,0],[4400,0]],
  sinuoso:[[0,.55],[560,.6],[700,1],[820,.9],[1000,.6],[1120,.95],[1300,.5],[1800,.45],[1960,.9],[2200,.55],[2780,.3],[3120,.55],[3700,.7],[4400,.45]],
  // chave de humor ao longo do rio
  humores:[[0,'noite'],[120,'alvorada'],[300,'aurora'],[560,'aurora'],[860,'douradaManha'],[1240,'manha'],[1560,'meioDia'],[1720,'meioDia'],[1820,'tempestade'],[1980,'tempestade'],[2100,'posChuva'],[2420,'tarde'],[2880,'tarde'],[3120,'dourada'],[3420,'porDoSol'],[3740,'crepusculo'],[3880,'noite'],[4400,'noite']],
};
