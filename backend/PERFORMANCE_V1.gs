// Otimizações seguras de desempenho para o backend atual.
// Mantém Google Apps Script + Google Sheets e não altera as regras do torneio.

var PERF_SPREADSHEET_ = null;
var PERF_SHEETS_ = {};
var PERF_CONFIG_ = null;

function getSheet_(nome){
  if(PERF_SHEETS_[nome])return PERF_SHEETS_[nome];
  if(!PERF_SPREADSHEET_)PERF_SPREADSHEET_=SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh=PERF_SPREADSHEET_.getSheetByName(nome);
  if(!sh)throw new Error('Aba não encontrada: '+nome);
  PERF_SHEETS_[nome]=sh;
  return sh;
}

function getConfig_(campo){
  if(PERF_CONFIG_===null){
    PERF_CONFIG_={};
    const sh=getSheet_(SHEETS.CONFIG),last=sh.getLastRow();
    if(last>=2){
      const vals=sh.getRange(2,1,last-1,2).getValues();
      vals.forEach(r=>{const k=String(r[0]||'').trim();if(k)PERF_CONFIG_[k]=r[1]});
    }
  }
  return Object.prototype.hasOwnProperty.call(PERF_CONFIG_,campo)?PERF_CONFIG_[campo]:'';
}

function setConfig_(campo,valor,descricao){
  const sh=getSheet_(SHEETS.CONFIG),last=Math.max(sh.getLastRow(),1),vals=last>=2?sh.getRange(2,1,last-1,1).getDisplayValues().flat():[];
  for(let i=0;i<vals.length;i++){
    if(String(vals[i]).trim()===campo){
      sh.getRange(i+2,2).setValue(valor);
      if(descricao)sh.getRange(i+2,3).setValue(descricao);
      if(PERF_CONFIG_!==null)PERF_CONFIG_[campo]=valor;
      return;
    }
  }
  sh.appendRow([campo,valor,descricao||'']);
  if(PERF_CONFIG_!==null)PERF_CONFIG_[campo]=valor;
}

function localizarLinhaPorValor_(sh,coluna,valor){
  const last=sh.getLastRow();
  if(last<2)return -1;
  const vals=sh.getRange(2,coluna,last-1,1).getDisplayValues().flat();
  const alvo=String(valor).trim();
  for(let i=0;i<vals.length;i++)if(String(vals[i]).trim()===alvo)return i+2;
  return -1;
}

function primeiraLinhaLivrePorColuna_(sh,coluna,inicio){
  inicio=inicio||2;
  const last=Math.max(sh.getLastRow(),inicio-1);
  if(last>=inicio){
    const vals=sh.getRange(inicio,coluna,last-inicio+1,1).getDisplayValues().flat();
    for(let i=0;i<vals.length;i++)if(String(vals[i]).trim()==='')return inicio+i;
  }
  const linha=last+1;
  if(linha>sh.getMaxRows())sh.insertRowsAfter(sh.getMaxRows(),linha-sh.getMaxRows());
  return linha;
}

function limparLinhasPorCategoria_(aba,categoria,coluna){
  const sh=getSheet_(aba),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();
  if(last<2)return;
  const vals=sh.getRange(2,1,last-1,h.length).getValues(),ranges=[];
  for(let i=0;i<vals.length;i++)if(String(vals[i][idx[coluna]])===categoria)ranges.push('A'+(i+2)+':'+colunaLetraPerf_(h.length)+(i+2));
  if(ranges.length)sh.getRangeList(ranges).clearContent();
}

function colunaLetraPerf_(n){let s='';while(n>0){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s}

function gravarCamposLinhaPerf_(sh,linha,h,idx,campos){
  const row=sh.getRange(linha,1,1,h.length).getValues()[0];
  Object.keys(campos).forEach(k=>{if(idx[k]!==undefined)row[idx[k]]=campos[k]});
  sh.getRange(linha,1,1,h.length).setValues([row]);
}

function sincronizarConfrontoResultado_(idJogo,resultado){
  const sh=getSheet_(SHEETS.MATA_MATA),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();if(last<2)return;
  const vals=sh.getRange(2,1,last-1,h.length).getValues();
  for(let i=0;i<vals.length;i++){
    if(String(vals[i][idx.ID_JOGO])===String(idJogo)){
      const linha=i+2,row=vals[i].slice();
      row[idx.ID_VENCEDOR]=resultado.idVencedor||'';
      row[idx.VENCEDOR]=resultado.vencedor||'';
      row[idx.STATUS]='FINALIZADO';
      if(idx.ID_PERDEDOR!==undefined)row[idx.ID_PERDEDOR]=resultado.idPerdedor||'';
      if(idx.PERDEDOR!==undefined)row[idx.PERDEDOR]=resultado.perdedor||'';
      sh.getRange(linha,1,1,h.length).setValues([row]);
      break;
    }
  }
}

function salvarResultadoJogo_(d,usuario){
  const id=limparTexto_(d.idJogo),tipo=String(d.tipoResultado||'NORMAL').toUpperCase();if(!id)return {ok:false,erro:'JOGO_OBRIGATORIO',mensagem:'Partida não informada.'};if(!['NORMAL','WO_A','WO_B','WO_DUPLO'].includes(tipo))return {ok:false,erro:'TIPO_RESULTADO_INVALIDO',mensagem:'Tipo de resultado inválido.'};
  const liberacaoAgenda=validarJogoPodeReceberResultado_(id);if(!liberacaoAgenda.ok)return liberacaoAgenda;
  const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),linha=localizarLinhaPorValor_(sh,idx.ID_JOGO+1,id);if(linha===-1)return {ok:false,erro:'JOGO_NAO_ENCONTRADO',mensagem:'Partida não encontrada.'};
  const r=sh.getRange(linha,1,1,h.length).getValues()[0],fase=String(r[idx.FASE]||''),categoria=String(r[idx.CATEGORIA]||''),statusAnterior=String(r[idx.STATUS]||''),melhorDe=melhorDePorFase_(fase);
  if(fase==='FINAL'){const terceiro=listarJogos_().find(j=>j.categoria===categoria&&String(j.fase).toUpperCase()==='TERCEIRO_LUGAR');if(terceiro&&terceiro.status!=='FINALIZADO')return {ok:false,erro:'TERCEIRO_LUGAR_PENDENTE',mensagem:'A disputa de 3º lugar deve ser realizada antes da final.'};}
  if(fase==='GRUPOS'&&obterEstadoFaseGrupos_(categoria).encerrada)return {ok:false,erro:'FASE_GRUPOS_ENCERRADA',mensagem:'A fase de grupos desta categoria já foi encerrada. O administrador precisa reabri-la antes de corrigir resultados.'};
  if(statusAnterior==='FINALIZADO'&&fase!=='GRUPOS'){
    if(usuario.nivel!=='ADMINISTRADOR')return {ok:false,erro:'CORRECAO_RESTRITA',mensagem:'No mata-mata, somente o administrador pode corrigir uma partida finalizada.'};
    if(existeFasePosteriorGerada_(categoria,fase))return {ok:false,erro:'FASE_POSTERIOR_GERADA',mensagem:'A fase seguinte já foi gerada. Para preservar a chave, este resultado não pode mais ser alterado.'};
  }
  const anterior=serializarJogoLinha_(r,idx),resultado=montarResultado_(d,tipo,melhorDe,{idA:r[idx.ID_JOGADOR_A],nomeA:r[idx.JOGADOR_A],idB:r[idx.ID_JOGADOR_B],nomeB:r[idx.JOGADOR_B]});
  const campos={SET1_A:resultado.sets[0][0],SET1_B:resultado.sets[0][1],SET2_A:resultado.sets[1][0],SET2_B:resultado.sets[1][1],SET3_A:resultado.sets[2][0],SET3_B:resultado.sets[2][1],SETS_A:resultado.setsA,SETS_B:resultado.setsB,PONTOS_A:resultado.pontosA,PONTOS_B:resultado.pontosB,ID_VENCEDOR:resultado.idVencedor,VENCEDOR:resultado.vencedor,STATUS:'FINALIZADO',OPERADOR_LANCAMENTO:usuario.email,DATA_HORA_LANCAMENTO:new Date(),OBSERVACOES:limparTexto_(d.observacoes),SET4_A:resultado.sets[3][0],SET4_B:resultado.sets[3][1],SET5_A:resultado.sets[4][0],SET5_B:resultado.sets[4][1],TIPO_RESULTADO:tipo,MELHOR_DE:melhorDe};
  gravarCamposLinhaPerf_(sh,linha,h,idx,campos);
  if(fase==='GRUPOS')recalcularClassificacaoCategoria_(categoria);else{sincronizarConfrontoResultado_(id,resultado);avancarMataMataSePronto_(categoria,fase,usuario);}
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:statusAnterior==='FINALIZADO'?'RESULTADO_CORRIGIDO':'RESULTADO_LANCADO',entidade:'JOGOS',idRegistro:id,valorAnterior:JSON.stringify(anterior),valorNovo:JSON.stringify(campos),observacoes:statusAnterior==='FINALIZADO'?'Resultado corrigido.':'Resultado finalizado.'});
  return {ok:true,mensagem:statusAnterior==='FINALIZADO'?'Resultado corrigido com sucesso.':'Partida finalizada com sucesso.',classificacao:listarClassificacao_().filter(x=>x.categoria===categoria&&x.grupo===String(r[idx.GRUPO])),mataMata:listarMataMata_().filter(x=>x.categoria===categoria)};
}
