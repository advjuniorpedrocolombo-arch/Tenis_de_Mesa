const SHEET_CALENDARIO_='CALENDARIO';

function listarCalendario_(){
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_CALENDARIO_);if(!sh||sh.getLastRow()<2)return [];
  const h=getHeaders_(sh),idx=indexHeaders_(h);
  return sh.getRange(2,1,sh.getLastRow()-1,h.length).getDisplayValues().filter(r=>String(r[idx.ID_DATA]||'').trim()).map(r=>({
    id:String(r[idx.ID_DATA]||''),data:String(r[idx.DATA]||''),status:String(r[idx.STATUS]||''),tipoBloqueio:String(r[idx.TIPO_BLOQUEIO]||''),descricao:String(r[idx.DESCRICAO]||''),
    horarioInicio:String(r[idx.HORARIO_INICIO]||''),horarioFim:String(r[idx.HORARIO_FIM]||''),ativo:String(r[idx.ATIVO]||'TRUE').toUpperCase()!=='FALSE',criadoPor:String(r[idx.CRIADO_POR]||''),dataCadastro:String(r[idx.DATA_CADASTRO]||''),ultimaAtualizacao:String(r[idx.ULTIMA_ATUALIZACAO]||''),observacoes:String(r[idx.OBSERVACOES]||'')
  })).sort((a,b)=>normalizarDataChave_(a.data).localeCompare(normalizarDataChave_(b.data)));
}

function salvarDataCalendario_(p,usuario){
  const data=normalizarDataChave_(p.data),status=String(p.status||'BLOQUEADO').toUpperCase(),tipo=String(p.tipoBloqueio||'').toUpperCase(),descricao=limparTexto_(p.descricao),hi=limparTexto_(p.horarioInicio),hf=limparTexto_(p.horarioFim),obs=limparTexto_(p.observacoes);
  if(!data)return {ok:false,erro:'DATA_OBRIGATORIA',mensagem:'Informe uma data válida.'};
  if(!['DISPONIVEL','BLOQUEADO'].includes(status))return {ok:false,erro:'STATUS_DATA_INVALIDO',mensagem:'Status da data inválido.'};
  const tipos=['FERIADO_NACIONAL','FERIADO_ESTADUAL','FERIADO_MUNICIPAL','EVENTO_ETEC','PATIO_INDISPONIVEL','OUTRO'];
  if(status==='BLOQUEADO'&&!tipos.includes(tipo))return {ok:false,erro:'TIPO_BLOQUEIO_OBRIGATORIO',mensagem:'Informe o motivo do bloqueio.'};
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(SHEET_CALENDARIO_);if(!sh)throw new Error('ABA_CALENDARIO_AUSENTE|A aba CALENDARIO não existe.');
  const h=getHeaders_(sh),idx=indexHeaders_(h),id=limparTexto_(p.idData)||gerarId_('DATA'),agora=new Date();
  let linha=localizarLinhaPorValor_(sh,idx.ID_DATA+1,id),novo=linha===-1;if(novo)linha=Math.max(2,sh.getLastRow()+1);
  const dados={ID_DATA:id,DATA:data,STATUS:status,TIPO_BLOQUEIO:status==='BLOQUEADO'?tipo:'',DESCRICAO:descricao,HORARIO_INICIO:hi,HORARIO_FIM:hf,ATIVO:'TRUE',CRIADO_POR:novo?usuario.email:sh.getRange(linha,idx.CRIADO_POR+1).getValue(),DATA_CADASTRO:novo?agora:sh.getRange(linha,idx.DATA_CADASTRO+1).getValue(),ULTIMA_ATUALIZACAO:agora,OBSERVACOES:obs};
  h.forEach((cab,i)=>{if(Object.prototype.hasOwnProperty.call(dados,cab))sh.getRange(linha,i+1).setValue(dados[cab]);});
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:novo?'DATA_CALENDARIO_CADASTRADA':'DATA_CALENDARIO_ATUALIZADA',entidade:'CALENDARIO',idRegistro:id,valorAnterior:'',valorNovo:JSON.stringify({data,status,tipo,descricao,hi,hf}),observacoes:'Calendário oficial do torneio.'});
  return {ok:true,idData:id,mensagem:status==='DISPONIVEL'?'Data liberada para programação de partidas.':'Data bloqueada para jogos.'};
}

function bloquearDatasCalendario_(p,usuario){
  let datas=[];
  try{datas=Array.isArray(p.datas)?p.datas:JSON.parse(String(p.datas||'[]'));}catch(_){datas=String(p.datas||'').split(',');}
  datas=[...new Set((datas||[]).map(normalizarDataChave_).filter(Boolean))];
  if(!datas.length)return {ok:false,erro:'DATAS_OBRIGATORIAS',mensagem:'Selecione pelo menos uma data para bloquear.'};
  const tipo=String(p.tipoBloqueio||'').toUpperCase(),descricao=limparTexto_(p.descricao),obs=limparTexto_(p.observacoes);
  const tipos=['FERIADO_NACIONAL','FERIADO_ESTADUAL','FERIADO_MUNICIPAL','EVENTO_ETEC','PATIO_INDISPONIVEL','OUTRO'];
  if(!tipos.includes(tipo))return {ok:false,erro:'TIPO_BLOQUEIO_OBRIGATORIO',mensagem:'Informe o motivo do bloqueio.'};
  const atuais=listarCalendario_().filter(x=>x.ativo&&x.status==='BLOQUEADO');
  let gravadas=0,atualizadas=0;
  datas.forEach(data=>{
    const existente=atuais.filter(x=>normalizarDataChave_(x.data)===data).slice(-1)[0];
    const r=salvarDataCalendario_({idData:existente?existente.id:'',data,status:'BLOQUEADO',tipoBloqueio:tipo,descricao,observacoes:obs},usuario);
    if(r.ok){existente?atualizadas++:gravadas++;}
  });
  return {ok:true,quantidade:datas.length,gravadas,atualizadas,mensagem:datas.length===1?'1 data foi marcada como indisponível.':datas.length+' datas foram marcadas como indisponíveis.'};
}

function excluirDataCalendario_(p,usuario){
  const id=limparTexto_(p.idData),sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_CALENDARIO_);if(!sh)return {ok:false,erro:'ABA_CALENDARIO_AUSENTE',mensagem:'A aba CALENDARIO não existe.'};
  const h=getHeaders_(sh),idx=indexHeaders_(h),linha=localizarLinhaPorValor_(sh,idx.ID_DATA+1,id);if(linha===-1)return {ok:false,erro:'DATA_NAO_ENCONTRADA',mensagem:'Registro não encontrado.'};
  const r=sh.getRange(linha,1,1,h.length).getDisplayValues()[0],anterior={id,data:r[idx.DATA]||'',status:r[idx.STATUS]||'',tipo:r[idx.TIPO_BLOQUEIO]||'',descricao:r[idx.DESCRICAO]||''};
  sh.getRange(linha,1,1,h.length).clearContent();
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'DATA_CALENDARIO_EXCLUIDA',entidade:'CALENDARIO',idRegistro:id,valorAnterior:JSON.stringify(anterior),valorNovo:'EXCLUIDO',observacoes:'Bloqueio removido do calendário por correção administrativa.'});
  return {ok:true,mensagem:'Dia bloqueado removido. A data voltou a ficar disponível para jogos.'};
}

function desativarDataCalendario_(p,usuario){
  const id=limparTexto_(p.idData),sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_CALENDARIO_);if(!sh)return {ok:false,erro:'ABA_CALENDARIO_AUSENTE'};
  const idx=indexHeaders_(getHeaders_(sh)),linha=localizarLinhaPorValor_(sh,idx.ID_DATA+1,id);if(linha===-1)return {ok:false,erro:'DATA_NAO_ENCONTRADA',mensagem:'Registro não encontrado.'};
  sh.getRange(linha,idx.ATIVO+1).setValue('FALSE');sh.getRange(linha,idx.ULTIMA_ATUALIZACAO+1).setValue(new Date());
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'DATA_CALENDARIO_DESATIVADA',entidade:'CALENDARIO',idRegistro:id,valorAnterior:'ATIVO',valorNovo:'INATIVO',observacoes:'Registro de calendário desativado.'});
  return {ok:true,mensagem:'Registro desativado.'};
}

function obterRegraData_(data){
  const chave=normalizarDataChave_(data);if(!chave)return null;
  return listarCalendario_().filter(x=>x.ativo&&normalizarDataChave_(x.data)===chave).slice(-1)[0]||null;
}

function validarDataDisponivel_(data,horario){
  const chave=normalizarDataChave_(data);if(!chave)return {ok:false,erro:'DATA_INVALIDA',mensagem:'Informe uma data válida.'};
  const regra=obterRegraData_(chave);
  if(regra&&regra.status==='BLOQUEADO')return {ok:false,erro:'DATA_BLOQUEADA',mensagem:'Não é permitido agendar nesta data: '+(regra.descricao||regra.tipoBloqueio||'data bloqueada')+'.'};
  if(regra&&horario&&regra.horarioInicio&&String(horario)<String(regra.horarioInicio))return {ok:false,erro:'HORARIO_FORA_JANELA',mensagem:'O horário informado é anterior ao período liberado nesta data.'};
  if(regra&&horario&&regra.horarioFim&&String(horario)>String(regra.horarioFim))return {ok:false,erro:'HORARIO_FORA_JANELA',mensagem:'O horário informado é posterior ao período liberado nesta data.'};
  return {ok:true,regra};
}

function salvarAgendaJogoSeguro_(p,usuario){
  const id=limparTexto_(p.idJogo),data=normalizarDataChave_(p.data),horario=limparTexto_(p.horario),mesa=limparTexto_(p.mesa);
  if(!id||!data)return {ok:false,erro:'DADOS_AGENDA_OBRIGATORIOS',mensagem:'Informe a partida e a data.'};
  const vd=validarDataDisponivel_(data,horario);if(!vd.ok)return vd;
  const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),linha=localizarLinhaPorValor_(sh,idx.ID_JOGO+1,id);if(linha===-1)return {ok:false,erro:'JOGO_NAO_ENCONTRADO',mensagem:'Partida não encontrada.'};
  const st=String(sh.getRange(linha,idx.STATUS+1).getValue()||'');if(st==='FINALIZADO')return {ok:false,erro:'JOGO_FINALIZADO',mensagem:'Partida finalizada não pode ser reagendada.'};
  sh.getRange(linha,idx.DATA+1).setValue(data);sh.getRange(linha,idx.HORARIO_PREVISTO+1).setValue(horario);sh.getRange(linha,idx.MESA+1).setValue(mesa);
  if(idx.STATUS_AGENDA!==undefined)sh.getRange(linha,idx.STATUS_AGENDA+1).setValue(st==='REMARCADA'?'REMARCADA':'AGENDADA');
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'JOGO_AGENDADO',entidade:'JOGOS',idRegistro:id,valorAnterior:'',valorNovo:JSON.stringify({data,horario,mesa}),observacoes:'Agenda validada contra o calendário oficial.'});
  return {ok:true,mensagem:'Agenda salva em data liberada.'};
}

function cancelarPartidaForcaMaior_(p,usuario){
  const id=limparTexto_(p.idJogo),motivo=limparTexto_(p.motivo);if(!id||!motivo)return {ok:false,erro:'MOTIVO_OBRIGATORIO',mensagem:'Informe a partida e o motivo do cancelamento.'};
  const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),linha=localizarLinhaPorValor_(sh,idx.ID_JOGO+1,id);if(linha===-1)return {ok:false,erro:'JOGO_NAO_ENCONTRADO',mensagem:'Partida não encontrada.'};
  const r=sh.getRange(linha,1,1,h.length).getValues()[0],status=String(r[idx.STATUS]||'');if(status==='FINALIZADO')return {ok:false,erro:'JOGO_FINALIZADO',mensagem:'Partida finalizada não pode ser cancelada para remarcação.'};
  if(status==='CANCELADA_PARA_REMARCACAO')return {ok:false,erro:'JA_CANCELADA',mensagem:'Esta partida já aguarda remarcação.'};
  const dataAnt=r[idx.DATA]||'',horaAnt=r[idx.HORARIO_PREVISTO]||'',mesaAnt=r[idx.MESA]||'';
  const campos={STATUS:'CANCELADA_PARA_REMARCACAO',STATUS_AGENDA:'CANCELADA_PARA_REMARCACAO',MOTIVO_CANCELAMENTO:motivo,DATA_HORA_CANCELAMENTO:new Date(),OPERADOR_CANCELAMENTO:usuario.email,DATA_ANTERIOR:dataAnt,HORARIO_ANTERIOR:horaAnt,MESA_ANTERIOR:mesaAnt};
  Object.keys(campos).forEach(k=>{if(idx[k]!==undefined)sh.getRange(linha,idx[k]+1).setValue(campos[k])});
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'PARTIDA_CANCELADA_FORCA_MAIOR',entidade:'JOGOS',idRegistro:id,valorAnterior:JSON.stringify({data:dataAnt,horario:horaAnt,mesa:mesaAnt,status}),valorNovo:JSON.stringify(campos),observacoes:motivo});
  return {ok:true,mensagem:'Partida cancelada por força maior. Nenhum W.O. foi aplicado; a partida deve ser remarcada.'};
}

function remarcarPartida_(p,usuario){
  const id=limparTexto_(p.idJogo),data=normalizarDataChave_(p.data),horario=limparTexto_(p.horario),mesa=limparTexto_(p.mesa),obs=limparTexto_(p.observacao);
  if(!id||!data)return {ok:false,erro:'DADOS_REMARCACAO_OBRIGATORIOS',mensagem:'Informe a partida e a nova data.'};
  const vd=validarDataDisponivel_(data,horario);if(!vd.ok)return vd;
  const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),linha=localizarLinhaPorValor_(sh,idx.ID_JOGO+1,id);if(linha===-1)return {ok:false,erro:'JOGO_NAO_ENCONTRADO',mensagem:'Partida não encontrada.'};
  const r=sh.getRange(linha,1,1,h.length).getValues()[0],status=String(r[idx.STATUS]||'');if(status!=='CANCELADA_PARA_REMARCACAO')return {ok:false,erro:'JOGO_NAO_AGUARDA_REMARCACAO',mensagem:'Somente partidas canceladas por força maior podem usar esta remarcação.'};
  const qtd=Number(idx.QTDE_REMARCACOES!==undefined?r[idx.QTDE_REMARCACOES]:0)||0,idRem=gerarId_('REM');
  const campos={DATA:data,HORARIO_PREVISTO:horario,MESA:mesa,STATUS:'REMARCADA',STATUS_AGENDA:'REMARCADA',QTDE_REMARCACOES:qtd+1,ID_REMARCACAO:idRem,OBSERVACAO_REMARCACAO:obs,ID_ARBITRO_REAL:'',ARBITRO_REAL:'',STATUS_ARBITRAGEM:'PENDENTE_REESCALA'};
  if(String(getConfig_('REESCALAR_ARBITRO_AO_REMARCAR')||'TRUE').toUpperCase()!=='FALSE'){campos.ID_ARBITRO_ESCALADO='';campos.ARBITRO_ESCALADO='';}
  Object.keys(campos).forEach(k=>{if(idx[k]!==undefined)sh.getRange(linha,idx[k]+1).setValue(campos[k])});
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'PARTIDA_REMARCADA',entidade:'JOGOS',idRegistro:id,valorAnterior:JSON.stringify({data:r[idx.DATA],horario:r[idx.HORARIO_PREVISTO],mesa:r[idx.MESA],motivo:idx.MOTIVO_CANCELAMENTO!==undefined?r[idx.MOTIVO_CANCELAMENTO]:''}),valorNovo:JSON.stringify({data,horario,mesa,idRem}),observacoes:obs||'Remarcação após cancelamento por força maior.'});
  return {ok:true,idRemarcacao:idRem,mensagem:'Partida remarcada. A arbitragem precisa ser validada/sorteada novamente para a nova data.'};
}

function validarJogoPodeReceberResultado_(idJogo){
  const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),linha=localizarLinhaPorValor_(sh,idx.ID_JOGO+1,idJogo);if(linha===-1)return {ok:false,erro:'JOGO_NAO_ENCONTRADO',mensagem:'Partida não encontrada.'};
  const st=String(sh.getRange(linha,idx.STATUS+1).getValue()||'');
  if(st==='CANCELADA_PARA_REMARCACAO')return {ok:false,erro:'JOGO_CANCELADO',mensagem:'Esta partida foi cancelada por força maior e ainda precisa ser remarcada.'};
  return {ok:true};
}

function listarAgendaPublicaV2_(){
  const jogos=lerJogosArbitragem_(),sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow(),extra={};
  if(last>=2)sh.getRange(2,1,last-1,h.length).getDisplayValues().filter(r=>String(r[idx.ID_JOGO]||'').trim()).forEach(r=>extra[r[idx.ID_JOGO]]={statusAgenda:idx.STATUS_AGENDA!==undefined?r[idx.STATUS_AGENDA]:'',motivoCancelamento:idx.MOTIVO_CANCELAMENTO!==undefined?r[idx.MOTIVO_CANCELAMENTO]:'',dataAnterior:idx.DATA_ANTERIOR!==undefined?r[idx.DATA_ANTERIOR]:'',horarioAnterior:idx.HORARIO_ANTERIOR!==undefined?r[idx.HORARIO_ANTERIOR]:'',mesaAnterior:idx.MESA_ANTERIOR!==undefined?r[idx.MESA_ANTERIOR]:'',qtdRemarcacoes:idx.QTDE_REMARCACOES!==undefined?r[idx.QTDE_REMARCACOES]:'0'});
  return jogos.map(j=>Object.assign({id:j.id,categoria:j.categoria,fase:j.fase,grupo:j.grupo,rodada:j.rodada,data:j.data,horario:j.horario,mesa:j.mesa,jogadorA:j.jogadorA,jogadorB:j.jogadorB,status:j.status,arbitro:j.arbitroReal||j.arbitroEscalado||'',statusArbitragem:j.statusArbitragem},extra[j.id]||{}));
}

function normalizarDataChave_(v){
  const s=String(v||'').trim();if(!s)return'';if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(m)return m[3]+'-'+m[2]+'-'+m[1];
  const d=new Date(v);if(!isNaN(d.getTime()))return Utilities.formatDate(d,Session.getScriptTimeZone()||'America/Sao_Paulo','yyyy-MM-dd');return'';
}
