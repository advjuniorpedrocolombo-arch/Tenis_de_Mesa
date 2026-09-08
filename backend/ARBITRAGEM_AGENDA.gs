const SHEET_ARBITROS_='ARBITROS';

function listarArbitros_(){
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_ARBITROS_);if(!sh||sh.getLastRow()<2)return [];
  const h=getHeaders_(sh),idx=indexHeaders_(h);
  return sh.getRange(2,1,sh.getLastRow()-1,h.length).getValues().filter(r=>String(r[idx.ID_ARBITRO]||'').trim()).map(r=>({
    id:String(r[idx.ID_ARBITRO]||''),nome:String(r[idx.NOME_COMPLETO]||''),email:String(r[idx.EMAIL]||''),telefone:String(r[idx.TELEFONE]||''),
    idParticipante:String(r[idx.ID_PARTICIPANTE]||''),eParticipante:String(r[idx.E_PARTICIPANTE]||'FALSE').toUpperCase()==='TRUE',status:String(r[idx.STATUS]||'ATIVO').toUpperCase(),
    observacoes:String(r[idx.OBSERVACOES]||''),dataCadastro:r[idx.DATA_CADASTRO],ultimaAtualizacao:r[idx.ULTIMA_ATUALIZACAO]
  }));
}

function salvarArbitro_(p,usuario){
  let nome=limparTexto_(p.nome),email=normalizarEmail_(p.email),telefone=limparTexto_(p.telefone),idParticipante=limparTexto_(p.idParticipante),obs=limparTexto_(p.observacoes);
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(SHEET_ARBITROS_);if(!sh)throw new Error('ABA_ARBITROS_AUSENTE|A aba ARBITROS não existe.');
  const h=getHeaders_(sh),idx=indexHeaders_(h),id=limparTexto_(p.idArbitro)||gerarId_('ARB'),agora=new Date();

  if(idParticipante){
    const participante=obterParticipantesValidos_().find(x=>String(x.id)===idParticipante);
    if(!participante)return {ok:false,erro:'PARTICIPANTE_NAO_ENCONTRADO',mensagem:'O participante selecionado não foi encontrado.'};
    if(!participante.ativo||participante.statusInscricao!=='APROVADO')return {ok:false,erro:'PARTICIPANTE_NAO_APTO',mensagem:'Somente participante ativo e aprovado pode ser vinculado como árbitro jogador.'};
    const existente=listarArbitros_().find(a=>a.idParticipante===idParticipante&&a.id!==id);
    if(existente)return {ok:false,erro:'PARTICIPANTE_JA_ARBITRO',mensagem:'Este participante já está cadastrado como árbitro.',idArbitroExistente:existente.id};
    nome=participante.nome;
    email=normalizarEmail_(participante.email||email);
  }

  if(!nome)return {ok:false,erro:'NOME_OBRIGATORIO',mensagem:'Informe o nome do árbitro.'};
  let linha=localizarLinhaPorValor_(sh,idx.ID_ARBITRO+1,id),novo=linha===-1;
  if(novo)linha=Math.max(2,sh.getLastRow()+1);
  const eParticipante=!!idParticipante;
  const dados={ID_ARBITRO:id,NOME_COMPLETO:nome,EMAIL:email,TELEFONE:telefone,ID_PARTICIPANTE:idParticipante,E_PARTICIPANTE:eParticipante?'TRUE':'FALSE',STATUS:'ATIVO',OBSERVACOES:obs,DATA_CADASTRO:novo?agora:sh.getRange(linha,idx.DATA_CADASTRO+1).getValue(),ULTIMA_ATUALIZACAO:agora};
  h.forEach((cab,i)=>{if(Object.prototype.hasOwnProperty.call(dados,cab))sh.getRange(linha,i+1).setValue(dados[cab]);});
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:novo?'ARBITRO_CADASTRADO':'ARBITRO_ATUALIZADO',entidade:'ARBITROS',idRegistro:id,valorAnterior:'',valorNovo:JSON.stringify({nome,email,idParticipante,eParticipante}),observacoes:eParticipante?'Árbitro cadastrado a partir da lista de atletas do torneio.':'Cadastro de árbitro externo do torneio.'});
  return {ok:true,idArbitro:id,mensagem:novo?'Árbitro cadastrado com sucesso.':'Árbitro atualizado com sucesso.'};
}

function alterarStatusArbitro_(p,usuario){
  const id=limparTexto_(p.idArbitro),status=String(p.status||'').toUpperCase();if(!['ATIVO','INATIVO'].includes(status))return {ok:false,erro:'STATUS_INVALIDO',mensagem:'Status inválido.'};
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_ARBITROS_),idx=indexHeaders_(getHeaders_(sh)),linha=localizarLinhaPorValor_(sh,idx.ID_ARBITRO+1,id);if(linha===-1)return {ok:false,erro:'ARBITRO_NAO_ENCONTRADO',mensagem:'Árbitro não encontrado.'};
  sh.getRange(linha,idx.STATUS+1).setValue(status);sh.getRange(linha,idx.ULTIMA_ATUALIZACAO+1).setValue(new Date());
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'ARBITRO_STATUS',entidade:'ARBITROS',idRegistro:id,valorAnterior:'',valorNovo:status,observacoes:'Alteração de disponibilidade do árbitro.'});
  return {ok:true,mensagem:'Status do árbitro atualizado.'};
}

function salvarAgendaJogo_(p,usuario){
  const id=limparTexto_(p.idJogo),data=limparTexto_(p.data),horario=limparTexto_(p.horario),mesa=limparTexto_(p.mesa);
  if(!id||!data)return {ok:false,erro:'DADOS_AGENDA_OBRIGATORIOS',mensagem:'Informe a partida e a data.'};
  const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),linha=localizarLinhaPorValor_(sh,idx.ID_JOGO+1,id);if(linha===-1)return {ok:false,erro:'JOGO_NAO_ENCONTRADO',mensagem:'Partida não encontrada.'};
  sh.getRange(linha,idx.DATA+1).setValue(data);sh.getRange(linha,idx.HORARIO_PREVISTO+1).setValue(horario);sh.getRange(linha,idx.MESA+1).setValue(mesa);
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'JOGO_AGENDADO',entidade:'JOGOS',idRegistro:id,valorAnterior:'',valorNovo:JSON.stringify({data,horario,mesa}),observacoes:'Data, horário e mesa definidos para a partida.'});
  return {ok:true,mensagem:'Agenda da partida salva.'};
}

function arbitroJogadorConflita_(arbitro,jogo,jogos){
  if(!arbitro||!arbitro.idParticipante)return false;
  const pid=String(arbitro.idParticipante),mesmaData=x=>String(x.data||'')===String(jogo.data||''),mesmoHorario=x=>String(x.horario||'')===String(jogo.horario||'');
  if(String(jogo.idA||'')===pid||String(jogo.idB||'')===pid)return true;
  if(!jogo.data||!jogo.horario)return false;
  return jogos.some(x=>x.id!==jogo.id&&mesmaData(x)&&mesmoHorario(x)&&(String(x.idA||'')===pid||String(x.idB||'')===pid));
}

function arbitroJaEscaladoMesmoHorario_(idArbitro,jogo,jogos){
  if(!idArbitro||!jogo.data||!jogo.horario)return false;
  return jogos.some(x=>x.id!==jogo.id&&String(x.data||'')===String(jogo.data||'')&&String(x.horario||'')===String(jogo.horario||'')&&(x.idArbitroReal===idArbitro||x.idArbitroEscalado===idArbitro));
}

function sortearArbitros_(p,usuario){
  const todosJogos=lerJogosArbitragem_(),jogos=todosJogos.filter(j=>j.status!=='FINALIZADO'&&j.status!=='CANCELADA_PARA_REMARCACAO'&&j.data&&j.horario&&j.mesa),arbitros=listarArbitros_().filter(a=>a.status==='ATIVO');
  if(!jogos.length)return {ok:false,erro:'SEM_JOGOS_AGENDADOS',mensagem:'Não existem partidas pendentes com data, horário e mesa completamente definidos.'};
  if(!arbitros.length)return {ok:false,erro:'SEM_ARBITROS',mensagem:'Cadastre ao menos um árbitro ativo.'};

  const porData={};jogos.forEach(j=>(porData[j.data]||(porData[j.data]=[])).push(j));
  let escalados=0,semArbitro=[],bloqueiosJogador=0;
  Object.keys(porData).sort().forEach(data=>{
    const jogosDia=porData[data],usoDia={},ocupacao=new Set();
    jogosDia.forEach(j=>{
      const idExistente=j.idArbitroReal||j.idArbitroEscalado;
      if(idExistente&&j.horario)ocupacao.add(String(j.horario)+'|'+String(idExistente));
    });
    jogosDia.sort((a,b)=>String(a.horario).localeCompare(String(b.horario))||String(a.mesa).localeCompare(String(b.mesa))||String(a.id).localeCompare(String(b.id))).forEach(j=>{
      const elegiveis=arbitros.filter(a=>{
        if(arbitroJogadorConflita_(a,j,todosJogos)){bloqueiosJogador++;return false;}
        if(ocupacao.has(String(j.horario)+'|'+String(a.id)))return false;
        if(arbitroJaEscaladoMesmoHorario_(a.id,j,todosJogos))return false;
        return true;
      });
      if(!elegiveis.length){definirArbitroJogo_(j.id,'','','','','SEM_ARBITRO');semArbitro.push(j.id);return;}
      const min=Math.min(...elegiveis.map(a=>usoDia[a.id]||0)),pool=elegiveis.filter(a=>(usoDia[a.id]||0)===min),arb=pool[Math.floor(Math.random()*pool.length)];
      usoDia[arb.id]=(usoDia[arb.id]||0)+1;ocupacao.add(String(j.horario)+'|'+String(arb.id));
      j.idArbitroEscalado=arb.id;j.idArbitroReal=arb.id;j.arbitroEscalado=arb.nome;j.arbitroReal=arb.nome;
      definirArbitroJogo_(j.id,arb.id,arb.nome,arb.id,arb.nome,'ESCALADO');escalados++;
    });
  });
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'ARBITROS_SORTEADOS',entidade:'JOGOS',idRegistro:'LOTE',valorAnterior:'',valorNovo:JSON.stringify({escalados,semArbitro,bloqueiosJogador}),observacoes:'Sorteio com balanceamento, bloqueio de árbitro em sua própria partida, em partida simultânea como atleta e em arbitragem simultânea.'});
  return {ok:true,escalados,semArbitro,mensagem:'Sorteio concluído: '+escalados+' partida(s) com árbitro'+(semArbitro.length?'; '+semArbitro.length+' sem árbitro elegível.':'.')};
}

function conflitaHorarioArbitro_(idArbitro,jogo,jogosDia){
  return arbitroJaEscaladoMesmoHorario_(idArbitro,jogo,jogosDia);
}

function substituirArbitro_(p,usuario){
  const idJogo=limparTexto_(p.idJogo),novoId=limparTexto_(p.idArbitro),motivo=limparTexto_(p.motivo);
  if(!idJogo||!novoId||!motivo)return {ok:false,erro:'DADOS_SUBSTITUICAO_OBRIGATORIOS',mensagem:'Informe a partida, o substituto e o motivo.'};
  const jogos=lerJogosArbitragem_(),jogo=jogos.find(x=>x.id===idJogo),arb=listarArbitros_().find(a=>a.id===novoId&&a.status==='ATIVO');
  if(!jogo||!arb)return {ok:false,erro:'DADOS_INVALIDOS',mensagem:'Partida ou árbitro substituto inválido.'};
  if(arbitroJogadorConflita_(arb,jogo,jogos))return {ok:false,erro:'ARBITRO_JOGADOR_CONFLITO',mensagem:'Este árbitro também é atleta e está jogando nesta partida ou em outra partida no mesmo horário.'};
  if(arbitroJaEscaladoMesmoHorario_(arb.id,jogo,jogos))return {ok:false,erro:'ARBITRO_OCUPADO',mensagem:'Este árbitro já está escalado em outra mesa no mesmo horário.'};
  const anterior=jogo.arbitroReal||jogo.arbitroEscalado||'';
  const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),linha=localizarLinhaPorValor_(sh,idx.ID_JOGO+1,idJogo);
  sh.getRange(linha,idx.ID_ARBITRO_REAL+1).setValue(arb.id);sh.getRange(linha,idx.ARBITRO_REAL+1).setValue(arb.nome);sh.getRange(linha,idx.STATUS_ARBITRAGEM+1).setValue('SUBSTITUIDO');sh.getRange(linha,idx.MOTIVO_SUBSTITUICAO+1).setValue(motivo);sh.getRange(linha,idx.DATA_HORA_SUBSTITUICAO+1).setValue(new Date());sh.getRange(linha,idx.OPERADOR_SUBSTITUICAO+1).setValue(usuario.email);
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'ARBITRO_SUBSTITUIDO',entidade:'JOGOS',idRegistro:idJogo,valorAnterior:anterior,valorNovo:arb.nome,observacoes:motivo});
  return {ok:true,mensagem:'Substituição registrada e preservada no histórico.'};
}

function definirArbitroJogo_(idJogo,idEsc,nomeEsc,idReal,nomeReal,status){
  const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),linha=localizarLinhaPorValor_(sh,idx.ID_JOGO+1,idJogo);if(linha===-1)return;
  [['ID_ARBITRO_ESCALADO',idEsc],['ARBITRO_ESCALADO',nomeEsc],['ID_ARBITRO_REAL',idReal],['ARBITRO_REAL',nomeReal],['STATUS_ARBITRAGEM',status],['MOTIVO_SUBSTITUICAO',''],['DATA_HORA_SUBSTITUICAO',''],['OPERADOR_SUBSTITUICAO','']].forEach(([k,v])=>{if(idx[k]!==undefined)sh.getRange(linha,idx[k]+1).setValue(v)});
}

function lerJogosArbitragem_(){
  const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();if(last<2)return [];
  return sh.getRange(2,1,last-1,h.length).getDisplayValues().filter(r=>String(r[idx.ID_JOGO]||'').trim()).map(r=>({
    id:r[idx.ID_JOGO],categoria:r[idx.CATEGORIA],fase:r[idx.FASE],grupo:r[idx.GRUPO],rodada:r[idx.RODADA],data:r[idx.DATA],horario:r[idx.HORARIO_PREVISTO],mesa:r[idx.MESA],
    idA:r[idx.ID_JOGADOR_A],jogadorA:r[idx.JOGADOR_A],idB:r[idx.ID_JOGADOR_B],jogadorB:r[idx.JOGADOR_B],status:r[idx.STATUS],
    idArbitroEscalado:idx.ID_ARBITRO_ESCALADO!==undefined?r[idx.ID_ARBITRO_ESCALADO]:'',arbitroEscalado:idx.ARBITRO_ESCALADO!==undefined?r[idx.ARBITRO_ESCALADO]:'',
    idArbitroReal:idx.ID_ARBITRO_REAL!==undefined?r[idx.ID_ARBITRO_REAL]:'',arbitroReal:idx.ARBITRO_REAL!==undefined?r[idx.ARBITRO_REAL]:'',statusArbitragem:idx.STATUS_ARBITRAGEM!==undefined?r[idx.STATUS_ARBITRAGEM]:'',
    motivoSubstituicao:idx.MOTIVO_SUBSTITUICAO!==undefined?r[idx.MOTIVO_SUBSTITUICAO]:''
  }));
}

function listarAgendaPublica_(){
  return lerJogosArbitragem_().map(j=>({id:j.id,categoria:j.categoria,fase:j.fase,grupo:j.grupo,rodada:j.rodada,data:j.data,horario:j.horario,mesa:j.mesa,jogadorA:j.jogadorA,jogadorB:j.jogadorB,status:j.status,arbitro:j.arbitroReal||j.arbitroEscalado||'',statusArbitragem:j.statusArbitragem}));
}
