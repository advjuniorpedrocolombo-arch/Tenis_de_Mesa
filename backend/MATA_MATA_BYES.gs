// Regras de chave eliminatória para quantidades que não são potência de 2.
// Ex.: 6 classificados -> chave de 8, com 2 BYEs para os dois melhores campeões de grupo.

function compararCampanhaMataMata_(a,b){
  return Number(b.vitorias||0)-Number(a.vitorias||0)
    ||Number(b.saldoSets||0)-Number(a.saldoSets||0)
    ||Number(b.saldoPontos||0)-Number(a.saldoPontos||0)
    ||Number(b.setsPro||0)-Number(a.setsPro||0)
    ||Number(b.pontosPro||0)-Number(a.pontosPro||0)
    ||String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR');
}

function compararSeedMataMata_(a,b){
  return Number(a.posicao||999)-Number(b.posicao||999)||compararCampanhaMataMata_(a,b);
}

function selecionarByesMataMata_(classificados,quantidade){
  if(quantidade<=0)return [];
  const ordenados=classificados.slice().sort(compararSeedMataMata_);
  const campeoes=ordenados.filter(x=>Number(x.posicao)===1).sort(compararCampanhaMataMata_);
  const escolhidos=[];
  const ids=new Set();
  campeoes.forEach(x=>{if(escolhidos.length<quantidade&&!ids.has(String(x.id))){escolhidos.push(x);ids.add(String(x.id));}});
  ordenados.forEach(x=>{if(escolhidos.length<quantidade&&!ids.has(String(x.id))){escolhidos.push(x);ids.add(String(x.id));}});
  return escolhidos;
}

function gerarPrimeiraFaseMataMata_(categoria,classificados,usuario){
  limparJogosMataMataCategoria_(categoria);
  limparLinhasPorCategoria_(SHEETS.MATA_MATA,categoria,'CATEGORIA');

  const ordenados=classificados.slice().sort(compararSeedMataMata_);
  const qtd=ordenados.length;
  const tamanho=proximaPotencia2_(qtd);
  const quantidadeByes=tamanho-qtd;
  const fase=fasePorQuantidade_(tamanho);
  const recebedoresBye=selecionarByesMataMata_(ordenados,quantidadeByes);
  const idsBye=new Set(recebedoresBye.map(x=>String(x.id)));
  const restantes=ordenados.filter(x=>!idsBye.has(String(x.id)));
  const confrontos=[];

  recebedoresBye.forEach(p=>{
    confrontos.push({
      a:p,
      b:null,
      origemA:p.posicao+'º '+p.grupo,
      origemB:'BYE',
      obs:Number(p.posicao)===1?'BYE concedido a campeão de grupo pela melhor campanha.':'BYE concedido pela classificação geral da fase de grupos.'
    });
  });

  while(restantes.length){
    const a=restantes.shift();
    let indice=-1;
    for(let i=restantes.length-1;i>=0;i--){
      if(String(restantes[i].grupo)!==String(a.grupo)){indice=i;break;}
    }
    if(indice<0)indice=restantes.length-1;
    const b=indice>=0?restantes.splice(indice,1)[0]:null;
    confrontos.push({a,b,origemA:a.posicao+'º '+a.grupo,origemB:b?b.posicao+'º '+b.grupo:'BYE',obs:'Confronto eliminatório com prioridade para adversários de grupos diferentes.'});
  }

  confrontos.forEach((c,i)=>criarConfronto_(categoria,fase,i+1,c.a,c.b,c.origemA,c.origemB,c.obs));

  registrarHistorico_({
    usuario:usuario.email,
    perfil:usuario.nivel,
    acao:'CHAVE_MATA_MATA_GERADA',
    entidade:'MATA_MATA',
    idRegistro:categoria,
    valorAnterior:'',
    valorNovo:JSON.stringify({classificados:qtd,tamanhoChave:tamanho,byes:quantidadeByes,recebedoresBye:recebedoresBye.map(x=>({id:x.id,nome:x.nome,grupo:x.grupo,posicao:x.posicao}))}),
    observacoes:'Quando o total de classificados não completa uma potência de 2, os BYEs são destinados prioritariamente aos melhores campeões de grupo, usando vitórias, saldo de sets, saldo de pontos, sets vencidos e pontos marcados. Sempre que possível, confrontos evitam atletas do mesmo grupo.'
  });

  // Os BYEs permanecem explicitamente registrados na chave e entram normalmente
  // na geração da fase seguinte junto aos vencedores dos jogos disputados.
  if(confrontos.every(c=>!c.b))avancarMataMataSePronto_(categoria,fase,usuario);
}
