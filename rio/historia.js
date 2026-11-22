// O roteiro no espaço: onde cada marco fica no rio, como o rio é em cada trecho e a hora do dia em cada ponto.
export {MARCOS} from './marcos5.js';

const S=[452,690,930,1190,1442,1640,1850,2080,2300,2560,2880,3120,3330,3620];
// e: +1 margem esquerda de quem desce, -1 direita
export const ROT={
  comprimento:4400,rumo0:.25,
  // árvores postas à mão: [espécie, s, lado, distância da margem, escala]
  especiais:[['sumauma',1392,-1,9,1.18],['seca',1312,1,6,1],['sumauma',780,1,4,1.05],['sumauma',2010,-1,8,1.1],['sumauma',3480,1,6,1.1],['sumauma',620,1,7,1.12],['sumauma',1120,-1,6,1.08],['seca',1700,1,5,1],['sumauma',2390,-1,7,1.15],['seca',2620,1,6,1.05],['sumauma',2960,-1,8,1.1],['sumauma',3260,1,9,1.2]],
  // trechos de margem sem plantas altas, para ver os bichos: [s, lado, meia-extensão, distância da margem]
  livres:[[318,1,34,14],[896,1,24,16],[1058,1,24,14],[2192,1,18,12],[3205,1,62,18],[1392,-1,16,26]],
  paradas:[
    {s:S[0],e:-1},{s:S[1],e:1},{s:S[2],e:-1},{s:S[3],e:1},{s:S[4],e:-1,obra:'templo1937'},{s:S[5],e:1,obra:'templo1940'},{s:S[6],e:-1,obra:'hab1953'},
    {s:S[7],e:-1,obra:'radio1995',torre:[26,-16]},{s:S[8],e:1,obra:'sede1996'},{s:S[9],e:-1,obra:'sede2001'},{s:S[10],e:1,obra:'sede2009'},
    {s:S[11],e:-1,obra:'tv2014',torre:[20,-16]},{s:S[12],e:1,obra:'sede2014'},{s:S[13],e:-1,obra:'memoria2026'}],
  largura:[[0,58],[300,62],[560,48],[640,30],[780,28],[860,50],[1040,58],[1100,36],[1190,44],[1300,88],[1370,52],[1640,60],[1760,84],[1850,58],[1940,86],[1990,70],[2080,48],[2300,52],[2560,60],[2720,120],[2880,74],[3120,56],[3330,58],[3540,50],[3620,38],[3700,50],[3900,64],[4400,84]],
  alagado:[[0,0],[540,0],[640,1],[800,1],[880,0],[1050,0],[1120,.8],[1180,.8],[1240,0],[1820,0],[1900,.7],[2000,.7],[2060,0],[3700,0],[3780,.6],[4100,.6],[4240,0]],
  praia:[[0,0],[2660,0],[2740,1],[2860,1],[2960,0],[4400,0]],
  pedra:[[0,0],[2480,0],[2560,.9],[2640,.2],[2700,0],[4400,0]],
  sinuoso:[[0,.55],[560,.6],[700,1],[820,.9],[1000,.6],[1120,.95],[1300,.5],[1800,.45],[1960,.9],[2200,.55],[2780,.3],[3120,.55],[3700,.7],[4400,.45]],
  // comunidades ribeirinhas entre as paradas (V5): [s, margem, tipo de conjunto]
  extras:[{s:572,e:-1,t:1},{s:812,e:-1,t:0},{s:1062,e:-1,t:2,festa:true},{s:1290,e:-1,t:3,ds:22},{s:1548,e:1,t:0},{s:1742,e:-1,t:1},{s:1968,e:1,t:2},{s:2188,e:-1,t:3},{s:2432,e:1,t:1},{s:2706,e:-1,t:0},{s:3002,e:1,t:2,festa:true},{s:3226,e:-1,t:3},{s:3476,e:-1,t:1}],
  // chave de humor ao longo do rio
  humores:[[0,'noite'],[120,'alvorada'],[300,'aurora'],[560,'aurora'],[860,'douradaManha'],[1240,'manha'],[1560,'meioDia'],[1880,'meioDia'],[1965,'tempestade'],[2010,'tempestade'],[2110,'posChuva'],[2420,'tarde'],[2880,'tarde'],[3120,'dourada'],[3400,'dourada'],[3540,'dourada'],[3720,'porDoSol'],[3810,'crepusculo'],[3900,'noite'],[4400,'noite']],
};
