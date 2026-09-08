const FIN_SHEET_CAIXA='CAIXA';
const FIN_CAIXA_HEADERS=['ID_LANCAMENTO','DATA_HORA','TIPO','CATEGORIA','DESCRICAO','ID_PARTICIPANTE','NOME_PARTICIPANTE','VALOR','FORMA_PAGAMENTO','ORIGEM','ID_ORIGEM','STATUS','OPERADOR','OBSERVACOES'];
const FIN_PARTICIPANTE_HEADERS=['FORMA_PAGAMENTO','DATA_CONFIRMACAO_PAGAMENTO','OPERADOR_FINANCEIRO'];

function assegurarEstruturaFinanceira_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  const p=ss.getSheetByName(SHEETS.PARTICIPANTES);
  if(!p)throw new Error('ABA_PARTICIPANTES_AUSENTE|A aba PARTICIPANTES não foi encontrada.');
  garantirColunasFinanceiras_(p,FIN_PARTICIPANTE_HEADERS);
  let caixa=ss.getSheetByName(FIN_SHEET_CAIXA);
  if(!caixa){
    caixa=ss.insertSheet(FIN_SHEET_CAIXA);
    caixa.getRange(1,1,1,FIN_CAIXA_HEADERS.length).setValues([FIN_CAIXA_HEADERS]);
    caixa.setFrozenRows(1);
  }else{
    garantirColunasFinanceiras_(caixa,FIN_CAIXA_HEADERS);
  }
  return {participantes:p,caixa};
}

function garantirColunasFinanceiras_(sh,headers){
  const last=Math.max(sh.getLastColumn(),1),atuais=sh.getRange(1,1,1,last).getValues()[0].map(String);
  const faltantes=headers.filter(h=>!atuais.includes(h));
  if(!faltantes.length)return;
  const inicio=atuais.filter(Boolean).length+1;
  sh.getRange(1,inicio,1,faltantes.length).setValues([faltantes]);
}

function exigirSessaoFinanceiro_(token){
  const s=exigirSessao_(token,'FINANCEIRO_OU_ADMIN');
  if(!['ADMINISTRADOR','FINANCEIRO'].includes(String(s.usuario.nivel||'').toUpperCase()))throw new Error('ACESSO_NEGADO|Acesso restrito ao financeiro ou administrador.');
  return s;
}

function participanteAptoSorteio_(p){
  if(!p||!p.ativo||p.statusInscricao!=='APROVADO')return false;
  const tipo=String(p.tipoInscricao||'GRATUITA').toUpperCase();
  const pag=String(p.statusPagamento||'').toUpperCase();
  return tipo==='GRATUITA'||pag==='ISENTO'||pag==='CONFIRMADO';
}

function listarFinanceiro_(){
  assegurarEstruturaFinanceira_();
  const participantes=obterParticipantesValidos_().filter(p=>String(p.tipoInscricao||'').toUpperCase()==='PAGA').map(p=>({
    id:p.id,nome:p.nome,turma:p.turma,email:p.email,categoria:p.categoriaValidada||p.categoriaEscolhida,
    valor:Number(p.valorInscricao||0),formaPagamento:String(p.formaPagamento||''),statusPagamento:String(p.statusPagamento||'PENDENTE').toUpperCase(),
    statusInscricao:p.statusInscricao,ativo:p.ativo,dataInscricao:p.dataInscricao,dataConfirmacaoPagamento:p.dataConfirmacaoPagamento||'',operadorFinanceiro:p.operadorFinanceiro||''
  }));
  const caixa=listarLancamentosCaixa_();
  const entradas=caixa.filter(x=>x.status==='ATIVO'&&x.tipo==='ENTRADA').reduce((s,x)=>s+x.valor,0);
  const saidas=caixa.filter(x=>x.status==='ATIVO'&&x.tipo==='SAIDA').reduce((s,x)=>s+x.valor,0);
  const recebidos=participantes.filter(x=>x.statusPagamento==='CONFIRMADO');
  return {ok:true,participantes,caixa,resumo:{pendentes:participantes.filter(x=>x.ativo&&x.statusPagamento==='PENDENTE').length,confirmados:recebidos.length,totalInscricoesRecebidas:recebidos.reduce((s,x)=>s+x.valor,0),entradas,saidas,saldo:entradas-saidas}};
}

function listarLancamentosCaixa_(){
  const sh=assegurarEstruturaFinanceira_().caixa,h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();
  if(last<2)return [];
  return sh.getRange(2,1,last-1,h.length).getValues().filter(r=>String(r[idx.ID_LANCAMENTO]||'').trim()).map(r=>({
    id:String(r[idx.ID_LANCAMENTO]||''),dataHora:r[idx.DATA_HORA],tipo:String(r[idx.TIPO]||'').toUpperCase(),categoria:String(r[idx.CATEGORIA]||''),descricao:String(r[idx.DESCRICAO]||''),
    idParticipante:String(r[idx.ID_PARTICIPANTE]||''),nomeParticipante:String(r[idx.NOME_PARTICIPANTE]||''),valor:Number(r[idx.VALOR]||0),formaPagamento:String(r[idx.FORMA_PAGAMENTO]||''),
    origem:String(r[idx.ORIGEM]||''),idOrigem:String(r[idx.ID_ORIGEM]||''),status:String(r[idx.STATUS]||'ATIVO').toUpperCase(),operador:String(r[idx.OPERADOR]||''),observacoes:String(r[idx.OBSERVACOES]||'')
  })).sort((a,b)=>new Date(b.dataHora).getTime()-new Date(a.dataHora).getTime());
}

function localizarLancamentoInscricaoAtivo_(idParticipante){
  return listarLancamentosCaixa_().find(x=>x.status==='ATIVO'&&x.origem==='INSCRICAO'&&x.idOrigem===idParticipante&&x.tipo==='ENTRADA')||null;
}

function confirmarPagamentoFinanceiro_(p,usuario){
  if(p&&p.pagamentos){
    let itens=[];
    try{itens=typeof p.pagamentos==='string'?JSON.parse(p.pagamentos):p.pagamentos}catch(_){return {ok:false,erro:'LOTE_INVALIDO',mensagem:'A seleção de pagamentos é inválida.'}}
    if(!Array.isArray(itens)||!itens.length)return {ok:false,erro:'LOTE_VAZIO',mensagem:'Selecione pelo menos uma inscrição pendente.'};
    if(itens.length>100)return {ok:false,erro:'LOTE_MUITO_GRANDE',mensagem:'Confirme no máximo 100 inscrições por vez.'};
    const resultados=[];
    itens.forEach(item=>{
      try{
        const r=confirmarPagamentoFinanceiro_({idParticipante:item.idParticipante||item.id,formaPagamento:item.formaPagamento},usuario);
        resultados.push({idParticipante:item.idParticipante||item.id,ok:!!r.ok,mensagem:r.mensagem||r.erro||''});
      }catch(err){resultados.push({idParticipante:item.idParticipante||item.id,ok:false,mensagem:String(err&&err.message||err)})}
    });
    const confirmados=resultados.filter(x=>x.ok).length,falhas=resultados.length-confirmados;
    return {ok:confirmados>0,confirmados,falhas,resultados,mensagem:falhas?confirmados+' pagamento(s) confirmado(s) e '+falhas+' não processado(s).':confirmados+' pagamento(s) confirmado(s) com sucesso e lançado(s) no caixa.',estado:listarFinanceiro_()};
  }
  assegurarEstruturaFinanceira_();
  const id=limparTexto_(p.idParticipante),forma=String(p.formaPagamento||'').trim().toUpperCase();
  if(!id)return {ok:false,erro:'ID_OBRIGATORIO',mensagem:'Participante não informado.'};
  if(!['PIX','DINHEIRO'].includes(forma))return {ok:false,erro:'FORMA_PAGAMENTO_INVALIDA',mensagem:'Selecione PIX ou Dinheiro.'};
  const participante=obterParticipantesValidos_().find(x=>x.id===id);
  if(!participante)return {ok:false,erro:'PARTICIPANTE_NAO_ENCONTRADO',mensagem:'Participante não encontrado.'};
  if(String(participante.tipoInscricao||'').toUpperCase()!=='PAGA')return {ok:false,erro:'INSCRICAO_NAO_PAGA',mensagem:'Esta inscrição está configurada como gratuita.'};
  if(!participante.ativo||participante.statusInscricao==='CANCELADO')return {ok:false,erro:'PARTICIPANTE_INATIVO',mensagem:'Não é possível confirmar pagamento de participante cancelado/inativo.'};
  const valor=Number(participante.valorInscricao||0);
  if(!(valor>0))return {ok:false,erro:'VALOR_INVALIDO',mensagem:'O valor da inscrição não está definido corretamente.'};
  const existente=localizarLancamentoInscricaoAtivo_(id);
  const sh=getSheet_(SHEETS.PARTICIPANTES),h=getHeaders_(sh),idx=indexHeaders_(h),linha=localizarLinhaPorValor_(sh,idx.ID_PARTICIPANTE+1,id);
  if(linha===-1)return {ok:false,erro:'PARTICIPANTE_NAO_ENCONTRADO',mensagem:'Participante não encontrado.'};
  if(idx.STATUS_PAGAMENTO===undefined)throw new Error('COLUNA_AUSENTE|Coluna STATUS_PAGAMENTO não encontrada.');
  sh.getRange(linha,idx.STATUS_PAGAMENTO+1).setValue('CONFIRMADO');
  if(idx.FORMA_PAGAMENTO!==undefined)sh.getRange(linha,idx.FORMA_PAGAMENTO+1).setValue(forma);
  if(idx.DATA_CONFIRMACAO_PAGAMENTO!==undefined)sh.getRange(linha,idx.DATA_CONFIRMACAO_PAGAMENTO+1).setValue(new Date());
  if(idx.OPERADOR_FINANCEIRO!==undefined)sh.getRange(linha,idx.OPERADOR_FINANCEIRO+1).setValue(usuario.email);
  let lancamentoId=existente?existente.id:'';
  if(!existente){
    lancamentoId=gerarId_('CX');
    gravarObjetoPrimeiraLinhaLivre_(FIN_SHEET_CAIXA,'ID_LANCAMENTO',{ID_LANCAMENTO:lancamentoId,DATA_HORA:new Date(),TIPO:'ENTRADA',CATEGORIA:'INSCRICAO_TORNEIO',DESCRICAO:'Inscrição - '+participante.nome,ID_PARTICIPANTE:id,NOME_PARTICIPANTE:participante.nome,VALOR:valor,FORMA_PAGAMENTO:forma,ORIGEM:'INSCRICAO',ID_ORIGEM:id,STATUS:'ATIVO',OPERADOR:usuario.email,OBSERVACOES:'Entrada gerada automaticamente após confirmação do pagamento.'});
  }
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'PAGAMENTO_INSCRICAO_CONFIRMADO',entidade:'PARTICIPANTES',idRegistro:id,valorAnterior:String(participante.statusPagamento||''),valorNovo:'CONFIRMADO',observacoes:'Pagamento confirmado via '+forma+'. Lançamento de caixa: '+lancamentoId});
  return {ok:true,mensagem:existente?'Pagamento já estava confirmado; cadastro sincronizado sem duplicar o caixa.':'Pagamento confirmado e entrada lançada automaticamente no caixa.',idLancamento:lancamentoId,estado:listarFinanceiro_()};
}

function registrarLancamentoCaixa_(p,usuario){
  assegurarEstruturaFinanceira_();
  const tipo=String(p.tipo||'').toUpperCase(),categoria=limparTexto_(p.categoria)||'OUTROS',descricao=limparTexto_(p.descricao),forma=String(p.formaPagamento||'OUTRO').toUpperCase();
  const valor=Number(String(p.valor||'0').replace(',','.'));
  if(!['ENTRADA','SAIDA'].includes(tipo))return {ok:false,erro:'TIPO_INVALIDO',mensagem:'Escolha Entrada ou Saída.'};
  if(!descricao)return {ok:false,erro:'DESCRICAO_OBRIGATORIA',mensagem:'Informe a descrição do lançamento.'};
  if(!(valor>0))return {ok:false,erro:'VALOR_INVALIDO',mensagem:'Informe um valor maior que zero.'};
  if(!['PIX','DINHEIRO','OUTRO'].includes(forma))return {ok:false,erro:'FORMA_INVALIDA',mensagem:'Forma de pagamento inválida.'};
  const id=gerarId_('CX');
  gravarObjetoPrimeiraLinhaLivre_(FIN_SHEET_CAIXA,'ID_LANCAMENTO',{ID_LANCAMENTO:id,DATA_HORA:new Date(),TIPO:tipo,CATEGORIA:categoria,DESCRICAO:descricao,ID_PARTICIPANTE:'',NOME_PARTICIPANTE:'',VALOR:valor,FORMA_PAGAMENTO:forma,ORIGEM:'MANUAL',ID_ORIGEM:id,STATUS:'ATIVO',OPERADOR:usuario.email,OBSERVACOES:limparTexto_(p.observacoes)});
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'LANCAMENTO_CAIXA_CRIADO',entidade:'CAIXA',idRegistro:id,valorAnterior:'',valorNovo:JSON.stringify({tipo,categoria,descricao,valor,forma}),observacoes:'Lançamento manual no caixa financeiro.'});
  return {ok:true,mensagem:'Lançamento registrado no caixa.',estado:listarFinanceiro_()};
}

function estornarPagamentoFinanceiro_(p,usuario){
  assegurarEstruturaFinanceira_();
  const id=limparTexto_(p.idParticipante),motivo=limparTexto_(p.motivo)||'Estorno administrativo.';
  const participante=obterParticipantesValidos_().find(x=>x.id===id);if(!participante)return {ok:false,erro:'PARTICIPANTE_NAO_ENCONTRADO',mensagem:'Participante não encontrado.'};
  const lanc=localizarLancamentoInscricaoAtivo_(id);if(!lanc)return {ok:false,erro:'LANCAMENTO_NAO_ENCONTRADO',mensagem:'Não existe entrada ativa de inscrição para estornar.'};
  const shCx=getSheet_(FIN_SHEET_CAIXA),hCx=getHeaders_(shCx),idxCx=indexHeaders_(hCx),linhaCx=localizarLinhaPorValor_(shCx,idxCx.ID_LANCAMENTO+1,lanc.id);
  if(linhaCx!==-1)shCx.getRange(linhaCx,idxCx.STATUS+1).setValue('ESTORNADO');
  const idEstorno=gerarId_('CX');
  gravarObjetoPrimeiraLinhaLivre_(FIN_SHEET_CAIXA,'ID_LANCAMENTO',{ID_LANCAMENTO:idEstorno,DATA_HORA:new Date(),TIPO:'SAIDA',CATEGORIA:'ESTORNO_INSCRICAO',DESCRICAO:'Estorno da inscrição - '+participante.nome,ID_PARTICIPANTE:id,NOME_PARTICIPANTE:participante.nome,VALOR:Number(participante.valorInscricao||0),FORMA_PAGAMENTO:participante.formaPagamento||'',ORIGEM:'ESTORNO_INSCRICAO',ID_ORIGEM:lanc.id,STATUS:'ATIVO',OPERADOR:usuario.email,OBSERVACOES:motivo});
  const sh=getSheet_(SHEETS.PARTICIPANTES),h=getHeaders_(sh),idx=indexHeaders_(h),linha=localizarLinhaPorValor_(sh,idx.ID_PARTICIPANTE+1,id);
  if(linha!==-1){sh.getRange(linha,idx.STATUS_PAGAMENTO+1).setValue('PENDENTE');if(idx.DATA_CONFIRMACAO_PAGAMENTO!==undefined)sh.getRange(linha,idx.DATA_CONFIRMACAO_PAGAMENTO+1).clearContent();}
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'PAGAMENTO_INSCRICAO_ESTORNADO',entidade:'PARTICIPANTES',idRegistro:id,valorAnterior:'CONFIRMADO',valorNovo:'PENDENTE',observacoes:motivo+' | Estorno: '+idEstorno});
  return {ok:true,mensagem:'Pagamento estornado e participante retornado para pagamento pendente.',estado:listarFinanceiro_()};
}
