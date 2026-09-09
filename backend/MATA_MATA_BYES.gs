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

// Distribui os vencedores vindos de BYE contra vencedores de partidas disputadas.
// Isso protege os melhores classificados: dois atletas que receberam BYE não se
// enfrentam entre si na fase seguinte quando há adversários vindos dos jogos.
function ordenarVencedoresComByesProtegidos_(winners){
  const byes=winners.filter(x=>x.veioDeBye);
  const jogados=winners.filter(x=>!x.veioDeBye);
  if(!byes.length||!jogados.length)return winners.slice();
  const ordem=[];
  while(byes.length||jogados.length){
    if(byes.length)ordem.push(byes.shift());
    if(jogados.length)ordem.push(jogados.shift());
  }
  return ordem;
}

// Override da progressão automática do mata-mata.
// Regra permanente para Mesatenistas e Recreativo:
// se dois melhores atletas avançarem por BYE, eles ficam em lados diferentes
// da chave e aguardam vencedores das partidas anteriores. Só podem se encontrar
// numa fase posterior (por exemplo, na final, quando os BYEs foram para a semifinal).
function avancarMataMataSePronto_(categoria,fase,usuario){
  if(String(getConfig_('GERACAO_PROXIMA_FASE_AUTOMATICA')||'TRUE').toUpperCase()==='FALSE')return;
  fase=String(fase||'').toUpperCase();
  if(fase==='FINAL'||fase==='TERCEIRO_LUGAR')return;

  const atual=listarMataMata_().filter(x=>x.categoria===categoria&&x.fase===fase);
  if(!atual.length||atual.some(x=>!['FINALIZADO','BYE'].includes(x.status)))return;

  let winners=atual.slice().sort((a,b)=>a.ordem-b.ordem).filter(x=>x.idVencedor).map(x=>({
    id:x.idVencedor,
    nome:x.vencedor,
    origem:'Vencedor '+nomeFaseCurto_(fase)+' '+x.ordem,
    from:x.id,
    veioDeBye:String(x.status||'').toUpperCase()==='BYE'
  }));
  if(!winners.length)return;

  if(fase==='SEMIFINAL'){
    if(winners.length===1){
      if(!listarMataMata_().some(x=>x.categoria===categoria&&x.fase==='FINAL'))
        criarConfronto_(categoria,'FINAL',1,winners[0],null,winners[0].origem,'BYE','Final decidida por avanço automático após ausência dupla no outro confronto.');
      return;
    }
    if(!listarMataMata_().some(x=>x.categoria===categoria&&x.fase==='FINAL')){
      const idFinal=criarConfronto_(categoria,'FINAL',1,winners[0],winners[1],winners[0].origem,winners[1].origem,'Final gerada automaticamente após as semifinais.');
      atual.forEach(x=>atualizarProximoConfronto_(x.id,idFinal));
    }
    const disputa=String(getConfig_('DISPUTA_TERCEIRO_LUGAR')||'TRUE').toUpperCase()!=='FALSE';
    const losers=atual.filter(x=>x.idPerdedor).sort((a,b)=>a.ordem-b.ordem).map(x=>({id:x.idPerdedor,nome:x.perdedor,origem:'Perdedor Semifinal '+x.ordem,from:x.id}));
    if(disputa&&losers.length===2&&!listarMataMata_().some(x=>x.categoria===categoria&&x.fase==='TERCEIRO_LUGAR'))
      criarConfronto_(categoria,'TERCEIRO_LUGAR',1,losers[0],losers[1],losers[0].origem,losers[1].origem,'Disputa de terceiro lugar gerada automaticamente.');
    return;
  }

  const prox=fasePorQuantidade_(winners.length);
  if(listarMataMata_().some(x=>x.categoria===categoria&&x.fase===prox))return;

  // Antes de montar a próxima fase, separa os beneficiados por BYE.
  // Caso clássico: 6 classificados -> 2 BYEs + 2 vencedores das quartas.
  // Resultado: Semifinal 1 = BYE 1 x vencedor QF; Semifinal 2 = BYE 2 x vencedor QF.
  winners=ordenarVencedoresComByesProtegidos_(winners);

  for(let i=0;i<winners.length;i+=2){
    const a=winners[i],b=winners[i+1]||null;
    const id=criarConfronto_(categoria,prox,(i/2)+1,a,b,a.origem,b?b.origem:'BYE','Fase seguinte gerada automaticamente com proteção dos classificados que receberam BYE.');
    atualizarProximoConfronto_(a.from,id);
    if(b)atualizarProximoConfronto_(b.from,id);
  }
  if(winners.length===1||winners.length%2===1)avancarMataMataSePronto_(categoria,prox,usuario);
}
