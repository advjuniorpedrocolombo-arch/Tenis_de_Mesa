function processarAgendaArbitragemMataMata_(usuario){
  const agenda=agendarMataMataAutomaticamente_(usuario);
  const arbitragem=sortearArbitrosMataMataNovos_(usuario);
  return {agenda,arbitragem};
}

function agendarMataMataAutomaticamente_(usuario){
  const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();
  if(last<2)return {ok:true,agendados:0,mensagem:'Nenhuma partida de mata-mata para agendar.'};
  const vals=sh.getRange(2,1,last-1,h.length).getDisplayValues();
  const bloqueadas=new Set(listarCalendario_().filter(x=>x.ativo&&String(x.status).toUpperCase()==='BLOQUEADO').map(x=>normalizarDataChave_(x.data)).filter(Boolean));
  const todos=[];
  vals.forEach((r,i)=>{
    const id=String(r[idx.ID_JOGO]||'').trim();if(!id)return;
    todos.push({linha:i+2,id,categoria:String(r[idx.CATEGORIA]||''),fase:String(r[idx.FASE]||'').toUpperCase(),status:String(r[idx.STATUS]||'').toUpperCase(),data:normalizarDataChave_(r[idx.DATA]||''),mesa:String(r[idx.MESA]||'')});
  });
  const pendentes=todos.filter(j=>j.fase!=='GRUPOS'&&j.status!=='FINALIZADO'&&j.status!=='CANCELADA_PARA_REMARCACAO'&&!j.data);
  if(!pendentes.length)return {ok:true,agendados:0,mensagem:'As partidas atuais do mata-mata já possuem data.'};

  const datasGrupo=todos.filter(j=>j.fase==='GRUPOS'&&j.data).map(j=>j.data).sort();
  let inicio=datasGrupo.length?diaSeguinteMataMata_(datasGrupo[datasGrupo.length-1]):normalizarDataChave_(getConfig_('DATA_INICIO'));
  if(!inicio)return {ok:false,erro:'DATA_BASE_AUSENTE',mensagem:'Não foi possível determinar a data inicial do mata-mata.'};

  const ocupacao={};
  todos.filter(j=>j.data&&j.status!=='CANCELADA_PARA_REMARCACAO').forEach(j=>{
    if(!ocupacao[j.data])ocupacao[j.data]=[];
    ocupacao[j.data].push({id:j.id,categoria:j.categoria,fase:j.fase});
  });
  const ordemCategoria=c=>c==='Recreativo'?1:c==='Mesatenistas'?2:9;
  pendentes.sort((a,b)=>ordemFase_(a.fase)-ordemFase_(b.fase)||ordemCategoria(a.categoria)-ordemCategoria(b.categoria)||a.id.localeCompare(b.id));

  let agendados=0;
  pendentes.forEach(j=>{
    let base=inicio;
    const anteriores=todos.filter(x=>x.categoria===j.categoria&&x.fase!=='GRUPOS'&&ordemFase_(x.fase)<ordemFase_(j.fase)&&x.data).map(x=>x.data).sort();
    if(anteriores.length){const prox=diaSeguinteMataMata_(anteriores[anteriores.length-1]);if(prox>base)base=prox;}
    let d=parseDataAgendaAutomatica_(base),seg=0,achou='';
    while(seg<1000&&!achou){seg++;
      if(ehDiaUtilAgenda_(d)){
        const chave=formatarDataAgenda_(d),ocup=ocupacao[chave]||[],temFinal=ocup.some(x=>x.fase==='FINAL');
        if(!bloqueadas.has(chave)){
          if(j.fase==='FINAL'){
            if(ocup.length===0)achou=chave;
          }else if(!temFinal&&ocup.length<2&&!ocup.some(x=>x.categoria===j.categoria))achou=chave;
        }
      }
      if(!achou)d.setDate(d.getDate()+1);
    }
    if(!achou)throw new Error('AGENDA_MATA_MATA_SEM_DATAS|Não foi possível encontrar data disponível para '+j.categoria+' - '+j.fase+'.');
    const mesa=j.categoria==='Recreativo'?'Mesa 1':'Mesa 2';
    gravarAgendaAutomaticaLinha_(sh,idx,j.linha,achou,mesa);
    j.data=achou;j.mesa=mesa;
    if(!ocupacao[achou])ocupacao[achou]=[];
    ocupacao[achou].push({id:j.id,categoria:j.categoria,fase:j.fase});
    agendados++;
  });
  SpreadsheetApp.flush();
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'AGENDA_MATA_MATA_GERADA',entidade:'JOGOS',idRegistro:'LOTE',valorAnterior:'',valorNovo:JSON.stringify({agendados,horario:'20:30'}),observacoes:'Mata-mata agendado em dias úteis e datas liberadas; até 2 partidas por noite, no máximo 1 por categoria. Somente finais usam noite exclusiva.'});
  return {ok:true,agendados,mensagem:agendados+' partida(s) do mata-mata receberam data, mesa e horário 20h30–21h.'};
}

function diaSeguinteMataMata_(chave){
  const d=parseDataAgendaAutomatica_(chave);d.setDate(d.getDate()+1);return formatarDataAgenda_(d);
}

function sortearArbitrosMataMataNovos_(usuario){
  const todos=lerJogosArbitragem_(),jogos=todos.filter(j=>String(j.fase||'').toUpperCase()!=='GRUPOS'&&j.status!=='FINALIZADO'&&j.status!=='CANCELADA_PARA_REMARCACAO'&&j.data&&j.mesa&&!j.idArbitroReal&&!j.idArbitroEscalado),arbitros=listarArbitros_().filter(a=>a.status==='ATIVO');
  if(!jogos.length)return {ok:true,escalados:0,mensagem:'Nenhuma nova partida do mata-mata aguardava árbitro.'};
  if(!arbitros.length)return {ok:false,erro:'SEM_ARBITROS',mensagem:'As partidas foram agendadas, mas não há árbitros ativos para o sorteio.'};
  const porData={};jogos.forEach(j=>(porData[j.data]||(porData[j.data]=[])).push(j));
  let escalados=0,semArbitro=[];
  Object.keys(porData).sort().forEach(data=>{
    const usoDia={},ocupacao=new Set();
    todos.filter(x=>x.data===data&&(x.idArbitroReal||x.idArbitroEscalado)).forEach(x=>ocupacao.add(String(x.horario||'NOITE')+'|'+String(x.idArbitroReal||x.idArbitroEscalado)));
    porData[data].sort((a,b)=>String(a.mesa).localeCompare(String(b.mesa))||String(a.id).localeCompare(String(b.id))).forEach(j=>{
      const slot=String(j.horario||'NOITE'),elegiveis=arbitros.filter(a=>!arbitroJogadorConflita_(a,j,todos)&&!ocupacao.has(slot+'|'+String(a.id))&&!arbitroJaEscaladoMesmoHorario_(a.id,j,todos));
      if(!elegiveis.length){definirArbitroJogo_(j.id,'','','','','SEM_ARBITRO');semArbitro.push(j.id);return;}
      const min=Math.min(...elegiveis.map(a=>usoDia[a.id]||0)),pool=elegiveis.filter(a=>(usoDia[a.id]||0)===min),arb=pool[Math.floor(Math.random()*pool.length)];
      usoDia[arb.id]=(usoDia[arb.id]||0)+1;ocupacao.add(slot+'|'+String(arb.id));
      j.idArbitroEscalado=arb.id;j.idArbitroReal=arb.id;j.arbitroEscalado=arb.nome;j.arbitroReal=arb.nome;
      definirArbitroJogo_(j.id,arb.id,arb.nome,arb.id,arb.nome,'ESCALADO');escalados++;
    });
  });
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'ARBITROS_MATA_MATA_SORTEADOS',entidade:'JOGOS',idRegistro:'LOTE',valorAnterior:'',valorNovo:JSON.stringify({escalados,semArbitro}),observacoes:'Sorteio automático realizado apenas para novas partidas do mata-mata sem árbitro previamente escalado.'});
  return {ok:true,escalados,semArbitro,mensagem:'Árbitros sorteados para '+escalados+' nova(s) partida(s) do mata-mata'+(semArbitro.length?'; '+semArbitro.length+' ficou(aram) sem árbitro elegível.':'.')};
}

function encerrarFaseGrupos_(d,usuario){
  const categoria=limparTexto_(d.categoria);if(!categoriasPermitidas_().includes(categoria))return {ok:false,erro:'CATEGORIA_INVALIDA',mensagem:'Categoria inválida.'};const estado=obterEstadoFaseGrupos_(categoria);if(estado.encerrada)return {ok:false,erro:'FASE_JA_ENCERRADA',mensagem:'A fase de grupos desta categoria já foi encerrada.'};if(!estado.totalJogos)return {ok:false,erro:'SEM_JOGOS',mensagem:'Ainda não existem partidas de grupos nesta categoria.'};if(estado.jogosPendentes>0)return {ok:false,erro:'JOGOS_PENDENTES',mensagem:'Ainda faltam '+estado.jogosPendentes+' partida(s) desta categoria.'};
  recalcularClassificacaoCategoria_(categoria);const classificados=listarClassificacao_().filter(x=>x.categoria===categoria&&x.classificado);if(classificados.length<2)return {ok:false,erro:'CLASSIFICADOS_INSUFICIENTES',mensagem:'É necessário ter pelo menos dois classificados para gerar o mata-mata.'};
  gerarPrimeiraFaseMataMata_(categoria,classificados,usuario);
  const operacional=processarAgendaArbitragemMataMata_(usuario);
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'FASE_GRUPOS_ENCERRADA',entidade:'MATA_MATA',idRegistro:categoria,valorAnterior:'EM_ANDAMENTO',valorNovo:'ENCERRADA',observacoes:'Classificação congelada; mata-mata, agenda e arbitragem gerados automaticamente.'});
  const aviso=operacional.arbitragem&&operacional.arbitragem.ok===false?' '+operacional.arbitragem.mensagem:'';
  return {ok:true,mensagem:'Fase de grupos de '+categoria+' encerrada. Mata-mata gerado com datas, horário e sorteio automático de árbitros.'+aviso,estado:obterEstadoFaseGrupos_(categoria),mataMata:listarMataMata_().filter(x=>x.categoria===categoria),agenda:operacional.agenda,arbitragem:operacional.arbitragem};
}

function avancarMataMataSePronto_(categoria,fase,usuario){
  if(String(getConfig_('GERACAO_PROXIMA_FASE_AUTOMATICA')||'TRUE').toUpperCase()==='FALSE')return;fase=String(fase||'').toUpperCase();if(fase==='FINAL'||fase==='TERCEIRO_LUGAR')return;const atual=listarMataMata_().filter(x=>x.categoria===categoria&&x.fase===fase);if(!atual.length||atual.some(x=>!['FINALIZADO','BYE'].includes(x.status)))return;const winners=atual.sort((a,b)=>a.ordem-b.ordem).filter(x=>x.idVencedor).map(x=>({id:x.idVencedor,nome:x.vencedor,origem:'Vencedor '+nomeFaseCurto_(fase)+' '+x.ordem,from:x.id}));if(!winners.length)return;
  if(fase==='SEMIFINAL'){
    if(winners.length===1){if(!listarMataMata_().some(x=>x.categoria===categoria&&x.fase==='FINAL'))criarConfronto_(categoria,'FINAL',1,winners[0],null,winners[0].origem,'BYE','Final decidida por avanço automático após ausência dupla no outro confronto.');processarAgendaArbitragemMataMata_(usuario);return;}
    if(!listarMataMata_().some(x=>x.categoria===categoria&&x.fase==='FINAL')){const idFinal=criarConfronto_(categoria,'FINAL',1,winners[0],winners[1],winners[0].origem,winners[1].origem,'Final gerada automaticamente após as semifinais.');atual.forEach(x=>atualizarProximoConfronto_(x.id,idFinal));}
    const disputa=String(getConfig_('DISPUTA_TERCEIRO_LUGAR')||'TRUE').toUpperCase()!=='FALSE',losers=atual.filter(x=>x.idPerdedor).sort((a,b)=>a.ordem-b.ordem).map(x=>({id:x.idPerdedor,nome:x.perdedor,origem:'Perdedor Semifinal '+x.ordem,from:x.id}));if(disputa&&losers.length===2&&!listarMataMata_().some(x=>x.categoria===categoria&&x.fase==='TERCEIRO_LUGAR'))criarConfronto_(categoria,'TERCEIRO_LUGAR',1,losers[0],losers[1],losers[0].origem,losers[1].origem,'Disputa de terceiro lugar gerada automaticamente.');
    processarAgendaArbitragemMataMata_(usuario);return;
  }
  const prox=fasePorQuantidade_(winners.length);if(listarMataMata_().some(x=>x.categoria===categoria&&x.fase===prox))return;for(let i=0;i<winners.length;i+=2){const a=winners[i],b=winners[i+1]||null,id=criarConfronto_(categoria,prox,(i/2)+1,a,b,a.origem,b?b.origem:'BYE','Fase seguinte gerada automaticamente.');atualizarProximoConfronto_(a.from,id);if(b)atualizarProximoConfronto_(b.from,id);}if(winners.length===1||winners.length%2===1)avancarMataMataSePronto_(categoria,prox,usuario);processarAgendaArbitragemMataMata_(usuario);
}
