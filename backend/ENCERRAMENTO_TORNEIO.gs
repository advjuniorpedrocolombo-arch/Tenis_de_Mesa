const ARQUIVO_PDF_OPCOES_='export?format=pdf&size=A4&portrait=true&fitw=true&sheetnames=false&printtitle=false&pagenumbers=true&gridlines=false&fzr=true';

function obterEstadoEncerramento_(){
  const ultimoId=String(getConfig_('ULTIMO_ARQUIVAMENTO_ID')||'');
  const pastaUrl=String(getConfig_('ULTIMO_ARQUIVAMENTO_PASTA_URL')||'');
  const salvo=String(getConfig_('ULTIMO_ARQUIVAMENTO_FINGERPRINT')||'');
  const atual=gerarFingerprintTorneio_();
  const exigir=String(getConfig_('EXIGIR_ARQUIVAMENTO_ANTES_RESET')||'TRUE').toUpperCase()!=='FALSE';
  const temDados=temDadosOperacionais_();
  return {
    ok:true,
    temDados,
    ultimoArquivamentoId:ultimoId,
    ultimoArquivamentoPastaUrl:pastaUrl,
    arquivadoSemAlteracoes:!!salvo&&salvo===atual,
    podeResetar:temDados&&(!exigir||(!!salvo&&salvo===atual)),
    exigeArquivamento:exigir,
    mensagem:!temDados?'Não há dados operacionais para encerrar.':(!salvo?'Este estado ainda não foi arquivado.':(salvo===atual?'Os dados atuais estão arquivados e protegidos.':'Houve alterações após o último arquivamento. Arquive novamente antes de resetar.'))
  };
}

function adminArquivarTorneio_(p,usuario){
  if(!temDadosOperacionais_())return {ok:false,erro:'SEM_DADOS',mensagem:'Não há dados operacionais para arquivar.'};
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  SpreadsheetApp.flush();
  const parentId=String(getConfig_('PASTA_TORNEIOS_ARQUIVADOS_ID')||'').trim();
  if(!parentId)throw new Error('PASTA_ARQUIVO_NAO_CONFIGURADA|Configure PASTA_TORNEIOS_ARQUIVADOS_ID antes de arquivar.');
  const parent=DriveApp.getFolderById(parentId);
  const agora=new Date();
  const tz=Session.getScriptTimeZone()||'America/Sao_Paulo';
  const stamp=Utilities.formatDate(agora,tz,'yyyy-MM-dd_HH-mm-ss');
  const ano=Utilities.formatDate(agora,tz,'yyyy');
  const nomeTorneio=String(getConfig_('NOME_TORNEIO')||'Torneio de Tênis de Mesa');
  const nomePasta=ano+' – '+nomeTorneio+' – Encerramento – '+stamp;
  const pasta=parent.createFolder(nomePasta);
  const idArquivo='ARQ-'+Utilities.formatDate(agora,tz,'yyyyMMddHHmmss')+'-'+Math.floor(1000+Math.random()*9000);

  DriveApp.getFileById(SPREADSHEET_ID).makeCopy('Banco de Dados – '+nomeTorneio+' – '+stamp,pasta);
  criarPdfPlanilhaCompleta_(ss,pasta,'09_Banco_Completo.pdf');
  criarPdfAba_(ss,'GRUPOS',pasta,'04_Fase_de_Grupos.pdf');
  criarPdfAba_(ss,'CLASSIFICACAO',pasta,'04B_Classificacao_Fase_de_Grupos.pdf');
  criarPdfAba_(ss,'MATA_MATA',pasta,'05_Mata_Mata.pdf');
  criarPdfAba_(ss,'PARTICIPANTES',pasta,'06_Participantes.pdf');
  criarPdfAba_(ss,'JOGOS',pasta,'07_Partidas.pdf');
  criarPdfAba_(ss,'HISTORICO',pasta,'08_Historico.pdf');
  criarRelatorioGeralPdf_(pasta,nomeTorneio,agora);
  categoriasPermitidas_().forEach((cat,i)=>criarResultadoCategoriaPdf_(pasta,cat,(i===0?'02':'03')+'_Resultado_'+slugArquivo_(cat)+'.pdf'));

  const fingerprint=gerarFingerprintTorneio_();
  setConfig_('ULTIMO_ARQUIVAMENTO_ID',idArquivo,'Identificador do último arquivamento concluído pelo sistema');
  setConfig_('ULTIMO_ARQUIVAMENTO_PASTA_URL',pasta.getUrl(),'Link da última pasta de arquivamento criada automaticamente');
  setConfig_('ULTIMO_ARQUIVAMENTO_FINGERPRINT',fingerprint,'Assinatura dos dados operacionais no momento do arquivamento');
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'TORNEIO_ARQUIVADO',entidade:'TORNEIO',idRegistro:idArquivo,valorAnterior:'',valorNovo:pasta.getUrl(),observacoes:'Pacote completo de encerramento criado antes do reset.'});
  return {ok:true,mensagem:'Torneio arquivado com sucesso. O reset seguro foi liberado.',idArquivo,pastaUrl:pasta.getUrl(),pastaNome:nomePasta};
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
  if(estado.exigeArquivamento&&!estado.arquivadoSemAlteracoes)return {ok:false,erro:'ARQUIVAMENTO_OBRIGATORIO',mensagem:'Os dados atuais não estão protegidos por um arquivamento idêntico. Arquive novamente antes de resetar.'};

  const pastaUrl=estado.ultimoArquivamentoPastaUrl;
  limparAbaMantendoCabecalho_('PARTICIPANTES');
  limparAbaMantendoCabecalho_('GRUPOS');
  limparAbaMantendoCabecalho_('JOGOS');
  limparAbaMantendoCabecalho_('CLASSIFICACAO');
  limparAbaMantendoCabecalho_('MATA_MATA');
  limparAbaMantendoCabecalho_('HISTORICO');
  setConfig_('STATUS_TORNEIO','CONFIGURACAO','CONFIGURACAO, INSCRICOES, GRUPOS, EM_ANDAMENTO ou ENCERRADO');
  setConfig_('STATUS_INSCRICOES','ABERTAS','ABERTAS ou ENCERRADAS');
  setConfig_('DATA_INICIO','A DEFINIR','Data de início do torneio');
  setConfig_('DATA_FINAL_PREVISTA','A DEFINIR','Data final prevista');
  setConfig_('ULTIMO_ARQUIVAMENTO_ID','','Identificador do último arquivamento concluído pelo sistema');
  setConfig_('ULTIMO_ARQUIVAMENTO_PASTA_URL','','Link da última pasta de arquivamento criada automaticamente');
  setConfig_('ULTIMO_ARQUIVAMENTO_FINGERPRINT','','Assinatura dos dados operacionais no momento do arquivamento');
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'TORNEIO_RESETADO',entidade:'TORNEIO',idRegistro:gerarId_('RESET'),valorAnterior:pastaUrl,valorNovo:'NOVO_CICLO',observacoes:'Reset mestre executado após arquivamento validado. Usuários, operadores, configurações e ranking preservados.'});
  CacheService.getScriptCache().removeAll([]);
  return {ok:true,mensagem:'Reset concluído. O sistema está pronto para uma nova edição.',arquivoAnteriorUrl:pastaUrl};
}

function temDadosOperacionais_(){
  return ['PARTICIPANTES','GRUPOS','JOGOS','CLASSIFICACAO','MATA_MATA'].some(nome=>{const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(nome);return sh&&sh.getLastRow()>1;});
}

function gerarFingerprintTorneio_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  const partes=['PARTICIPANTES','GRUPOS','JOGOS','CLASSIFICACAO','MATA_MATA'].map(nome=>{
    const sh=ss.getSheetByName(nome);if(!sh)return nome+':';
    const lr=sh.getLastRow(),lc=sh.getLastColumn();
    return nome+':'+(lr&&lc?JSON.stringify(sh.getRange(1,1,lr,lc).getDisplayValues()):'');
  });
  return hashTexto_(partes.join('\n'));
}

function limparAbaMantendoCabecalho_(nome){
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(nome);if(!sh)return;
  const max=sh.getMaxRows(),cols=sh.getLastColumn();if(max>1&&cols>0)sh.getRange(2,1,max-1,cols).clearContent();
}

function criarPdfPlanilhaCompleta_(ss,pasta,nome){
  const url='https://docs.google.com/spreadsheets/d/'+ss.getId()+'/'+ARQUIVO_PDF_OPCOES_;
  const blob=buscarPdf_(url).setName(nome);pasta.createFile(blob);
}
function criarPdfAba_(ss,nomeAba,pasta,nomeArquivo){
  const sh=ss.getSheetByName(nomeAba);if(!sh)return;
  const url='https://docs.google.com/spreadsheets/d/'+ss.getId()+'/'+ARQUIVO_PDF_OPCOES_+'&gid='+sh.getSheetId();
  pasta.createFile(buscarPdf_(url).setName(nomeArquivo));
}
function buscarPdf_(url){
  const r=UrlFetchApp.fetch(url,{headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true});
  if(r.getResponseCode()!==200)throw new Error('ERRO_PDF|Não foi possível gerar um dos PDFs do encerramento. Código '+r.getResponseCode());
  return r.getBlob().setContentType('application/pdf');
}

function criarRelatorioGeralPdf_(pasta,nomeTorneio,data){
  const doc=DocumentApp.create('TEMP Relatório Geral');
  const body=doc.getBody(),tz=Session.getScriptTimeZone()||'America/Sao_Paulo';
  body.appendParagraph('RELATÓRIO GERAL DO TORNEIO').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(nomeTorneio);
  body.appendParagraph('Encerramento: '+Utilities.formatDate(data,tz,'dd/MM/yyyy HH:mm:ss'));
  const participantes=obterParticipantesValidos_().filter(x=>x.ativo&&x.statusInscricao==='APROVADO');
  const jogos=listarJogos_();
  body.appendParagraph('Participantes aprovados: '+participantes.length);
  body.appendParagraph('Partidas registradas: '+jogos.length);
  body.appendParagraph('Partidas finalizadas: '+jogos.filter(x=>x.status==='FINALIZADO').length);
  categoriasPermitidas_().forEach(cat=>{
    body.appendParagraph(cat).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph('Participantes: '+participantes.filter(x=>(x.categoriaValidada||x.categoriaEscolhida)===cat).length);
    const final=listarMataMata_().find(x=>x.categoria===cat&&x.fase==='FINAL'&&x.status==='FINALIZADO');
    if(final)body.appendParagraph('Campeão: '+(final.vencedor||'—'));
  });
  doc.saveAndClose();
  const f=DriveApp.getFileById(doc.getId());pasta.createFile(f.getAs(MimeType.PDF).setName('01_Relatorio_Geral.pdf'));f.setTrashed(true);
}

function criarResultadoCategoriaPdf_(pasta,categoria,nomeArquivo){
  const ranking=classificacaoFinalCategoria_(categoria);
  const doc=DocumentApp.create('TEMP Resultado '+categoria),body=doc.getBody();
  body.appendParagraph('RESULTADO FINAL – '+String(categoria).toUpperCase()).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  if(!ranking.length)body.appendParagraph('Não há classificação final disponível.');
  else{
    body.appendParagraph('PÓDIO / DESTAQUES').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    ranking.slice(0,4).forEach(x=>body.appendParagraph(x.posicao+'º lugar — '+x.nome));
    body.appendParagraph('CLASSIFICAÇÃO GERAL').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    const dados=[['Posição','Participante','Grupo','Fase / critério']].concat(ranking.map(x=>[String(x.posicao),x.nome,x.grupo||'—',x.fase||'Fase de grupos']));
    body.appendTable(dados);
  }
  doc.saveAndClose();const f=DriveApp.getFileById(doc.getId());pasta.createFile(f.getAs(MimeType.PDF).setName(nomeArquivo));f.setTrashed(true);
}

function classificacaoFinalCategoria_(categoria){
  const classif=listarClassificacao_().filter(x=>x.categoria===categoria),mm=listarMataMata_().filter(x=>x.categoria===categoria),map={};
  classif.forEach(x=>map[x.id]={id:x.id,nome:x.nome,grupo:x.grupo,posGrupo:x.posicao,vitorias:x.vitorias,saldoSets:x.saldoSets,saldoPontos:x.saldoPontos,setsPro:x.setsPro,pontosPro:x.pontosPro,nivel:0,fase:'Fase de grupos'});
  mm.forEach(x=>{[x.idA,x.idB].forEach((id,k)=>{if(id&&!map[id])map[id]={id,nome:k===0?x.jogadorA:x.jogadorB,grupo:'',posGrupo:999,vitorias:0,saldoSets:0,saldoPontos:0,setsPro:0,pontosPro:0,nivel:0,fase:'Mata-mata'};});});
  const final=mm.find(x=>x.fase==='FINAL'&&x.status==='FINALIZADO'),terc=mm.find(x=>x.fase==='TERCEIRO_LUGAR'&&x.status==='FINALIZADO');
  if(final){if(final.idVencedor&&map[final.idVencedor]){map[final.idVencedor].nivel=100;map[final.idVencedor].fase='Campeão';}if(final.idPerdedor&&map[final.idPerdedor]){map[final.idPerdedor].nivel=90;map[final.idPerdedor].fase='Vice-campeão';}}
  if(terc){if(terc.idVencedor&&map[terc.idVencedor]){map[terc.idVencedor].nivel=80;map[terc.idVencedor].fase='3º lugar';}if(terc.idPerdedor&&map[terc.idPerdedor]){map[terc.idPerdedor].nivel=70;map[terc.idPerdedor].fase='4º lugar';}}
  mm.forEach(x=>{const n=ordemFase_(x.fase)*10;if(x.idPerdedor&&map[x.idPerdedor]&&map[x.idPerdedor].nivel===0){map[x.idPerdedor].nivel=n;map[x.idPerdedor].fase='Eliminado em '+nomeFaseRelatorio_(x.fase);}});
  const arr=Object.values(map).sort((a,b)=>b.nivel-a.nivel||a.posGrupo-b.posGrupo||b.vitorias-a.vitorias||b.saldoSets-a.saldoSets||b.saldoPontos-a.saldoPontos||b.setsPro-a.setsPro||b.pontosPro-a.pontosPro||String(a.nome).localeCompare(String(b.nome),'pt-BR'));
  return arr.map((x,i)=>Object.assign(x,{posicao:i+1}));
}
function nomeFaseRelatorio_(f){return String(f||'').replace(/_/g,' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());}
function slugArquivo_(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'');}
