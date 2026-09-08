function obterEstadoInscricoesCronograma_(){
  const statusBase=String(getConfig_('STATUS_INSCRICOES')||'ENCERRADAS').toUpperCase();
  const automatico=String(getConfig_('ENCERRAMENTO_INSCRICOES_AUTOMATICO')||'TRUE').toUpperCase()!=='FALSE';
  const limiteRaw=String(getConfig_('DATA_HORA_ENCERRAMENTO_INSCRICOES')||'').trim();
  const limite=parseDataHoraLocal_(limiteRaw);
  const agora=new Date();
  const expirou=!!(automatico&&limite&&agora.getTime()>=limite.getTime());
  const statusEfetivo=expirou?'ENCERRADAS':statusBase;
  return {
    ok:true,
    statusInscricoes:statusEfetivo,
    statusConfigurado:statusBase,
    automatico,
    dataHoraEncerramento:limiteRaw,
    encerramentoExpirado:expirou,
    agora:agora.toISOString(),
    torneio:String(getConfig_('NOME_TORNEIO')||''),
    tipoInscricao:String(getConfig_('TIPO_INSCRICAO')||'GRATUITA').toUpperCase(),
    valorInscricao:Number(getConfig_('VALOR_INSCRICAO')||0),
    pixChave:String(getConfig_('PIX_CHAVE')||'1599745-1709'),
    categorias:categoriasPermitidas_(),
    dataSorteioGrupos:String(getConfig_('DATA_SORTEIO_GRUPOS')||''),
    dataInicio:String(getConfig_('DATA_INICIO')||''),
    dataFinalPrevista:String(getConfig_('DATA_FINAL_PREVISTA')||''),
    ordemFinais:String(getConfig_('ORDEM_FINAIS')||'Recreativo|Mesatenistas'),
    fasesFinaisNoitesSeparadas:String(getConfig_('FASES_FINAIS_NOITES_SEPARADAS')||'SEMIFINAIS|TERCEIRO_LUGAR|FINAL_RECREATIVO|FINAL_MESATENISTAS')
  };
}

function validarInscricoesAbertas_(){
  const e=obterEstadoInscricoesCronograma_();
  if(e.statusInscricoes!=='ABERTAS')return {ok:false,erro:'INSCRICOES_ENCERRADAS',mensagem:e.encerramentoExpirado?'O prazo de inscrição foi encerrado automaticamente.':'As inscrições não estão abertas neste momento.'};
  return {ok:true,estado:e};
}

function salvarPlanejamentoInscricoes_(p,usuario){
  const limite=limparTexto_(p.dataHoraEncerramento),sorteio=limparTexto_(p.dataSorteioGrupos),inicio=limparTexto_(p.dataInicio),finalPrev=limparTexto_(p.dataFinalPrevista),ordem=limparTexto_(p.ordemFinais)||'Recreativo|Mesatenistas';
  const tipo=String(p.tipoInscricao||getConfig_('TIPO_INSCRICAO')||'GRATUITA').trim().toUpperCase();
  const valor=Number(String(p.valorInscricao??getConfig_('VALOR_INSCRICAO')??0).replace(',','.'));
  if(limite&&!parseDataHoraLocal_(limite))return {ok:false,erro:'DATA_HORA_INVALIDA',mensagem:'Informe uma data/hora de encerramento válida.'};
  if(!['Recreativo|Mesatenistas','Mesatenistas|Recreativo'].includes(ordem))return {ok:false,erro:'ORDEM_FINAIS_INVALIDA',mensagem:'Ordem das finais inválida.'};
  if(!['GRATUITA','PAGA'].includes(tipo))return {ok:false,erro:'TIPO_INSCRICAO_INVALIDO',mensagem:'Tipo de inscrição inválido.'};
  if(!Number.isFinite(valor)||valor<0)return {ok:false,erro:'VALOR_INSCRICAO_INVALIDO',mensagem:'Informe um valor de inscrição válido.'};
  if(tipo==='PAGA'&&valor<=0)return {ok:false,erro:'VALOR_INSCRICAO_OBRIGATORIO',mensagem:'Para inscrição paga, informe um valor maior que zero.'};
  setConfig_('DATA_HORA_ENCERRAMENTO_INSCRICOES',limite,'Data e hora limite no formato AAAA-MM-DDTHH:MM; definida pelo administrador');
  setConfig_('DATA_SORTEIO_GRUPOS',sorteio,'Data pública prevista para o sorteio dos grupos');
  if(inicio)setConfig_('DATA_INICIO',inicio,'Data de início do torneio');
  if(finalPrev)setConfig_('DATA_FINAL_PREVISTA',finalPrev,'Data final prevista');
  setConfig_('ORDEM_FINAIS',ordem,'Ordem das noites exclusivas de final; uma categoria por noite');
  setConfig_('ENCERRAMENTO_INSCRICOES_AUTOMATICO',String(p.automatico||'TRUE').toUpperCase()==='FALSE'?'FALSE':'TRUE','Encerra novas inscrições automaticamente ao atingir a data/hora limite');
  setConfig_('TIPO_INSCRICAO',tipo,'GRATUITA ou PAGA');
  setConfig_('VALOR_INSCRICAO',tipo==='GRATUITA'?0:valor,'Valor da inscrição em reais');
  setConfig_('PIX_CHAVE',String(getConfig_('PIX_CHAVE')||'1599745-1709'),'Chave PIX para pagamento da inscrição');
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'PLANEJAMENTO_INSCRICOES_ATUALIZADO',entidade:'CONFIGURACOES',idRegistro:'PLANEJAMENTO',valorAnterior:'',valorNovo:JSON.stringify({limite,sorteio,inicio,finalPrev,ordem,tipoInscricao:tipo,valorInscricao:tipo==='GRATUITA'?0:valor}),observacoes:'Datas-chave, cobrança e regras de encerramento das inscrições atualizadas.'});
  return {ok:true,mensagem:'Planejamento salvo com sucesso.',estado:obterEstadoInscricoesCronograma_()};
}

function encerrarInscricoesAgora_(p,usuario){
  const motivo=limparTexto_(p.motivo)||'Encerramento manual pelo administrador.';
  setConfig_('STATUS_INSCRICOES','ENCERRADAS','ABERTAS ou ENCERRADAS');
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'INSCRICOES_ENCERRADAS_MANUALMENTE',entidade:'TORNEIO',idRegistro:'INSCRICOES',valorAnterior:'ABERTAS',valorNovo:'ENCERRADAS',observacoes:motivo});
  return {ok:true,mensagem:'Inscrições encerradas imediatamente.',estado:obterEstadoInscricoesCronograma_()};
}

function reabrirInscricoes_(p,usuario){
  const motivo=limparTexto_(p.motivo);if(!motivo)return {ok:false,erro:'MOTIVO_OBRIGATORIO',mensagem:'Informe o motivo da reabertura.'};
  const novoLimite=limparTexto_(p.dataHoraEncerramento),limite=parseDataHoraLocal_(novoLimite),agora=new Date();
  if(!limite||limite.getTime()<=agora.getTime())return {ok:false,erro:'NOVO_PRAZO_OBRIGATORIO',mensagem:'Para reabrir, defina uma nova data/hora de encerramento futura.'};
  setConfig_('DATA_HORA_ENCERRAMENTO_INSCRICOES',novoLimite,'Data e hora limite no formato AAAA-MM-DDTHH:MM; definida pelo administrador');
  setConfig_('STATUS_INSCRICOES','ABERTAS','ABERTAS ou ENCERRADAS');
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'INSCRICOES_REABERTAS',entidade:'TORNEIO',idRegistro:'INSCRICOES',valorAnterior:'ENCERRADAS',valorNovo:'ABERTAS',observacoes:motivo+' | Novo prazo: '+novoLimite});
  return {ok:true,mensagem:'Inscrições reabertas com novo prazo.',estado:obterEstadoInscricoesCronograma_()};
}

function parseDataHoraLocal_(s){
  s=String(s||'').trim();if(!s)return null;
  const m=s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);if(!m)return null;
  const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]),Number(m[5]),0,0);
  return isNaN(d.getTime())?null:d;
}
