function obterEstadoEncerramento_(){
  const ultimoId=String(getConfig_('ULTIMO_ARQUIVAMENTO_ID')||'');
  const ultimoNome=String(getConfig_('ULTIMO_ARQUIVAMENTO_NOME')||'');
  const salvo=String(getConfig_('ULTIMO_ARQUIVAMENTO_FINGERPRINT')||'');
  const atual=gerarFingerprintTorneio_();
  const exigir=String(getConfig_('EXIGIR_ARQUIVAMENTO_ANTES_RESET')||'TRUE').toUpperCase()!=='FALSE';
  const temDados=temDadosOperacionais_();
  return {
    ok:true,
    temDados,
    ultimoArquivamentoId:ultimoId,
    ultimoArquivamentoNome:ultimoNome,
    arquivadoSemAlteracoes:!!salvo&&salvo===atual,
    podeResetar:temDados&&(!exigir||(!!salvo&&salvo===atual)),
    exigeArquivamento:exigir,
    mensagem:!temDados?'Não há dados operacionais para encerrar.':(!salvo?'Este estado ainda não foi arquivado.':(salvo===atual?'Os dados atuais estão arquivados e protegidos.':'Houve alterações após o último arquivamento. Gere um novo ZIP antes de resetar.'))
  };
}

function adminArquivarTorneio_(p,usuario){
  if(!temDadosOperacionais_())return {ok:false,erro:'SEM_DADOS',mensagem:'Não há dados operacionais para arquivar.'};
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  SpreadsheetApp.flush();
  const agora=new Date(),tz=Session.getScriptTimeZone()||'America/Sao_Paulo';
  const stamp=Utilities.formatDate(agora,tz,'yyyy-MM-dd_HH-mm-ss');
  const nomeTorneio=String(getConfig_('NOME_TORNEIO')||'Torneio de Tênis de Mesa');
  const nomeArquivo='Arquivo_Torneio_'+slugArquivoLocal_(nomeTorneio)+'_'+stamp+'.zip';
  const idArquivo='ARQ-'+Utilities.formatDate(agora,tz,'yyyyMMddHHmmss')+'-'+Math.floor(1000+Math.random()*9000);
  const fingerprint=gerarFingerprintTorneio_();
  const abas=['CONFIGURACOES','PARTICIPANTES','GRUPOS','CLASSIFICACAO','JOGOS','MATA_MATA','ARBITROS','CALENDARIO','HISTORICO','RANKING'];
  const dados={};
  abas.forEach(nome=>{
    const sh=ss.getSheetByName(nome);
    if(!sh){dados[nome]=[];return;}
    const lr=sh.getLastRow(),lc=sh.getLastColumn();
    dados[nome]=(lr&&lc)?sh.getRange(1,1,lr,lc).getDisplayValues():[];
  });
  const participantes=obterParticipantesValidos_().filter(x=>x.ativo&&x.statusInscricao==='APROVADO');
  const jogos=listarJogos_();
  const resumo={
    nomeTorneio,
    geradoEm:Utilities.formatDate(agora,tz,'dd/MM/yyyy HH:mm:ss'),
    idArquivo,
    fingerprint,
    participantesAprovados:participantes.length,
    partidasRegistradas:jogos.length,
    partidasFinalizadas:jogos.filter(x=>x.status==='FINALIZADO').length,
    categorias:categoriasPermitidas_()
  };
  CacheService.getScriptCache().put('ARQ_LOCAL_'+idArquivo,JSON.stringify({fingerprint,usuario:usuario.email,nomeArquivo}),600);
  return {ok:true,mensagem:'Pacote preparado. O navegador irá gerar o arquivo ZIP.',idArquivo,nomeArquivo,fingerprint,dados,resumo};
}

function confirmarArquivamentoLocal_(p,usuario){
  const idArquivo=String(p.idArquivo||'').trim();
  if(!idArquivo)return {ok:false,erro:'ID_ARQUIVO_OBRIGATORIO',mensagem:'Identificador do arquivo ausente.'};
  const cache=CacheService.getScriptCache(),chave='ARQ_LOCAL_'+idArquivo,raw=cache.get(chave);
  if(!raw)return {ok:false,erro:'ARQUIVO_EXPIRADO',mensagem:'A confirmação do ZIP expirou. Gere o arquivo novamente.'};
  const pendente=JSON.parse(raw);
  if(String(pendente.usuario||'').toLowerCase()!==String(usuario.email||'').toLowerCase())return {ok:false,erro:'USUARIO_DIVERGENTE',mensagem:'Este pacote foi gerado por outro administrador.'};
  const atual=gerarFingerprintTorneio_();
  if(atual!==pendente.fingerprint)return {ok:false,erro:'DADOS_ALTERADOS',mensagem:'Os dados mudaram durante a geração do ZIP. Gere o arquivo novamente.'};
  setConfig_('ULTIMO_ARQUIVAMENTO_ID',idArquivo,'Identificador do último arquivamento concluído pelo sistema');
  setConfig_('ULTIMO_ARQUIVAMENTO_NOME',pendente.nomeArquivo,'Nome do último arquivo ZIP gerado localmente');
  setConfig_('ULTIMO_ARQUIVAMENTO_PASTA_URL','','Arquivamento local: não há pasta obrigatória no Drive');
  setConfig_('ULTIMO_ARQUIVAMENTO_FINGERPRINT',pendente.fingerprint,'Assinatura dos dados operacionais no momento do arquivamento');
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'TORNEIO_ARQUIVADO_LOCAL',entidade:'TORNEIO',idRegistro:idArquivo,valorAnterior:'',valorNovo:pendente.nomeArquivo,observacoes:'Pacote ZIP gerado no navegador para armazenamento local pelo administrador.'});
  cache.remove(chave);
  return {ok:true,mensagem:'ZIP registrado com sucesso. O reset seguro foi liberado.',idArquivo,nomeArquivo:pendente.nomeArquivo};
}

function adminResetarTorneio_(p,usuario){
  const confirmacao=String(p.confirmacao||'').trim().toUpperCase();
  const pin=String(p.pin||'').trim();
  if(confirmacao!=='RESETAR')return {ok:false,erro:'CONFIRMACAO_INVALIDA',mensagem:'Digite exatamente RESETAR para confirmar.'};
  if(!pin)return {ok:false,erro:'PIN_OBRIGATORIO',mensagem:'Informe seu PIN de administrador.'};
  const op=buscarOperadorPorEmail_(usuario.email);
  if(!op||op.nivel!=='ADMINISTRADOR'||op.status!=='ATIVO'||hashPin_(op.pinSalt,pin)!==op.pinHash)return {ok:false,erro:'PIN_INVALIDO',mensagem:'PIN do administrador inválido.'};
  const estado=obterEstadoEncerramento_();
  if(!estado.temDados)return {ok:false,erro:'SEM_DADOS',mensagem:'O torneio já está sem dados operacionais.'};
  if(estado.exigeArquivamento&&!estado.arquivadoSemAlteracoes)return {ok:false,erro:'ARQUIVAMENTO_OBRIGATORIO',mensagem:'Os dados atuais não estão protegidos por um ZIP correspondente. Gere o arquivo novamente antes de resetar.'};

  const arquivoAnterior=estado.ultimoArquivamentoNome||estado.ultimoArquivamentoId;
  limparAbaMantendoCabecalho_('PARTICIPANTES');
  limparAbaMantendoCabecalho_('GRUPOS');
  limparAbaMantendoCabecalho_('JOGOS');
  limparAbaMantendoCabecalho_('CLASSIFICACAO');
  limparAbaMantendoCabecalho_('MATA_MATA');
  limparAbaMantendoCabecalho_('HISTORICO');
  if(typeof limparExtrasNovaEdicao_==='function')limparExtrasNovaEdicao_();
  setConfig_('STATUS_TORNEIO','CONFIGURACAO','CONFIGURACAO, INSCRICOES, GRUPOS, EM_ANDAMENTO ou ENCERRADO');
  setConfig_('STATUS_INSCRICOES','ABERTAS','ABERTAS ou ENCERRADAS');
  setConfig_('DATA_INICIO','A DEFINIR','Data de início do torneio');
  setConfig_('DATA_FINAL_PREVISTA','A DEFINIR','Data final prevista');
  setConfig_('DATA_HORA_ENCERRAMENTO_INSCRICOES','','Data e hora limite das inscrições');
  setConfig_('DATA_SORTEIO_GRUPOS','','Data pública prevista para o sorteio dos grupos');
  setConfig_('ULTIMO_ARQUIVAMENTO_ID','','Identificador do último arquivamento concluído pelo sistema');
  setConfig_('ULTIMO_ARQUIVAMENTO_NOME','','Nome do último arquivo ZIP gerado localmente');
  setConfig_('ULTIMO_ARQUIVAMENTO_PASTA_URL','','Arquivamento local: não há pasta obrigatória no Drive');
  setConfig_('ULTIMO_ARQUIVAMENTO_FINGERPRINT','','Assinatura dos dados operacionais no momento do arquivamento');
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'TORNEIO_RESETADO',entidade:'TORNEIO',idRegistro:gerarId_('RESET'),valorAnterior:arquivoAnterior,valorNovo:'NOVO_CICLO',observacoes:'Reset mestre executado após arquivamento local validado. Usuários, operadores, configurações e ranking preservados.'});
  return {ok:true,mensagem:'Reset concluído. O sistema está pronto para uma nova edição.',arquivoAnterior};
}

function temDadosOperacionais_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  return ['PARTICIPANTES','GRUPOS','JOGOS','CLASSIFICACAO','MATA_MATA','ARBITROS','CALENDARIO'].some(nome=>{const sh=ss.getSheetByName(nome);return sh&&sh.getLastRow()>1;});
}

function gerarFingerprintTorneio_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  const partes=['PARTICIPANTES','GRUPOS','JOGOS','CLASSIFICACAO','MATA_MATA'].map(nome=>{
    const sh=ss.getSheetByName(nome);if(!sh)return nome+':';
    const lr=sh.getLastRow(),lc=sh.getLastColumn();
    return nome+':'+(lr&&lc?JSON.stringify(sh.getRange(1,1,lr,lc).getDisplayValues()):'');
  });
  const extras=typeof fingerprintExtrasOperacionais_==='function'?fingerprintExtrasOperacionais_():'';
  return hashTexto_(partes.join('\n')+'\n'+extras);
}

function limparAbaMantendoCabecalho_(nome){
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(nome);if(!sh)return;
  const max=sh.getMaxRows(),cols=sh.getLastColumn();if(max>1&&cols>0)sh.getRange(2,1,max-1,cols).clearContent();
}

function slugArquivoLocal_(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'');}
