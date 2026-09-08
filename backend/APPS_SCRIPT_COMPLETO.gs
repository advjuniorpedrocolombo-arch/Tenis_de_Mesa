/**
 * SISTEMA DE TORNEIO DE TÊNIS DE MESA – ETEC
 * PACOTE ÚNICO PARA PUBLICAÇÃO NO GOOGLE APPS SCRIPT
 * Gerado automaticamente a partir dos módulos oficiais do diretório backend.
 *
 * IMPORTANTE: no Apps Script, este arquivo pode substituir integralmente o Code.gs atual.
 * Não copie os módulos separados se utilizar este pacote único, para evitar funções duplicadas.
 * O arquivamento da edição é gerado como ZIP pelo navegador e não depende do Google Drive.
 */


// ============================================================
// INÍCIO: Code.gs
// ============================================================

const SPREADSHEET_ID='1Ur2A0wAGxjpfjShdWOuN_-qw7o1qB-AT3JaymrFANGY';
const SHEETS={CONFIG:'CONFIGURACOES',PARTICIPANTES:'PARTICIPANTES',OPERADORES:'OPERADORES',GRUPOS:'GRUPOS',JOGOS:'JOGOS',CLASSIFICACAO:'CLASSIFICACAO',MATA_MATA:'MATA_MATA',HISTORICO:'HISTORICO',ARBITROS:'ARBITROS',CALENDARIO:'CALENDARIO'};
const SESSION_TTL=21600;
const MAX_LOGIN_FAILS=5;
const LOGIN_BLOCK_SECONDS=900;

function doGet(e){
  try{
    const a=String((e&&e.parameter&&e.parameter.action)||'status').trim();
    if(a==='status')return jsonResponse_(obterEstadoInscricoesCronograma_());
    if(a==='participantesPublicos')return jsonResponse_({ok:true,participantes:listarParticipantesPublicos_()});
    if(a==='torneioPublico')return jsonResponse_({ok:true,jogos:listarJogos_(),classificacao:listarClassificacao_(),grupos:listarGruposPublicos_(),fasesGrupos:listarEstadosFasesGrupos_(),mataMata:listarMataMata_()});
    if(a==='agendaPublica')return jsonResponse_({ok:true,jogos:listarAgendaPublicaV2_()});
    if(a==='adminSessao')return jsonResponse_(adminSessao_(e.parameter.token));
    if(a==='participantesAdmin'){const s=exigirSessao_(e.parameter.token);return jsonResponse_({ok:true,usuario:s.usuario,participantes:listarParticipantesAdmin_()});}
    if(a==='adminOperadores'){const s=exigirSessao_(e.parameter.token,'ADMINISTRADOR');return jsonResponse_({ok:true,usuario:s.usuario,operadores:listarOperadores_()});}
    if(a==='sorteioEstado'){const s=exigirSessao_(e.parameter.token);return jsonResponse_({ok:true,usuario:s.usuario,estado:obterEstadoSorteio_(e.parameter.categoria)});}
    if(a==='jogosAdmin'){const s=exigirSessao_(e.parameter.token);return jsonResponse_({ok:true,usuario:s.usuario,jogos:listarJogos_(),classificacao:listarClassificacao_(),grupos:listarGruposPublicos_(),fasesGrupos:listarEstadosFasesGrupos_(),mataMata:listarMataMata_()});}
    if(a==='adminEncerramentoEstado'){const s=exigirSessao_(e.parameter.token,'ADMINISTRADOR');return jsonResponse_(obterEstadoEncerramento_());}
    if(a==='adminArbitros'){const s=exigirSessao_(e.parameter.token,'ADMINISTRADOR');return jsonResponse_({ok:true,usuario:s.usuario,arbitros:listarArbitros_()});}
    if(a==='adminCalendario'){const s=exigirSessao_(e.parameter.token,'ADMINISTRADOR');return jsonResponse_({ok:true,usuario:s.usuario,datas:listarCalendario_()});}
    if(a==='adminConflitosAgenda'){const s=exigirSessao_(e.parameter.token,'ADMINISTRADOR');return jsonResponse_(listarConflitosAgenda_());}
    if(a==='adminPlanejamento'){const s=exigirSessao_(e.parameter.token,'ADMINISTRADOR');return jsonResponse_(obterEstadoInscricoesCronograma_());}
    if(a==='financeiroEstado'){const s=exigirSessaoFinanceiro_(e.parameter.token);return jsonResponse_({...listarFinanceiro_(),usuario:s.usuario});}
    return jsonResponse_({ok:false,erro:'ACAO_INVALIDA'});
  }catch(err){return erroJson_(err);}
}
function doPost(e){
  const lock=LockService.getScriptLock();
  try{
    lock.waitLock(10000);
    const p=parsePayload_(e),a=String(p.action||'inscricao').trim();
    if(a==='inscricao')return jsonResponse_(registrarInscricao_(p));
    if(a==='adminLogin')return jsonResponse_(adminLogin_(p));
    if(a==='adminLogout')return jsonResponse_(adminLogout_(p.token));
    if(a==='adminSolicitarRecuperacao')return jsonResponse_(solicitarRecuperacaoPin_(p));
    if(a==='adminRedefinirPin')return jsonResponse_(redefinirPinRecuperacao_(p));
    if(a==='adminAtualizarParticipante'){const s=exigirSessao_(p.token);return jsonResponse_(adminAtualizarParticipante_(p,s.usuario));}
    if(a==='adminSalvarOperador'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(adminSalvarOperador_(p,s.usuario));}
    if(a==='adminStatusOperador'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(adminStatusOperador_(p,s.usuario));}
    if(a==='adminDefinirCabeca'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(adminDefinirCabeca_(p,s.usuario));}
    if(a==='sorteioIniciar'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(iniciarSorteio_(p,s.usuario));}
    if(a==='sorteioAdicionar'){const s=exigirSessao_(p.token);return jsonResponse_(adicionarAoGrupo_(p,s.usuario));}
    if(a==='sorteioRemover'){const s=exigirSessao_(p.token);return jsonResponse_(removerDoGrupo_(p,s.usuario));}
    if(a==='sorteioFinalizar'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(finalizarSorteio_(p,s.usuario));}
    if(a==='sorteioReiniciar'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(reiniciarSorteio_(p,s.usuario));}
    if(a==='jogoSalvarResultado'){const s=exigirSessao_(p.token);return jsonResponse_(salvarResultadoJogo_(p,s.usuario));}
    if(a==='faseGruposEncerrar'){const s=exigirSessao_(p.token);return jsonResponse_(encerrarFaseGrupos_(p,s.usuario));}
    if(a==='faseGruposReabrir'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(reabrirFaseGrupos_(p,s.usuario));}
    if(a==='salvarConfigCategoria'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(salvarConfigCategoria_(p,s.usuario));}
    if(a==='adminArquivarTorneio'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(adminArquivarTorneio_(p,s.usuario));}
    if(a==='adminResetarTorneio'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(adminResetarTorneio_(p,s.usuario));}
    if(a==='adminSalvarArbitro'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(salvarArbitro_(p,s.usuario));}
    if(a==='adminStatusArbitro'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(alterarStatusArbitro_(p,s.usuario));}
    if(a==='adminSalvarAgendaJogo'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(salvarAgendaJogoComConflitos_(p,s.usuario));}
    if(a==='adminSortearArbitros'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(sortearArbitros_(p,s.usuario));}
    if(a==='adminSubstituirArbitro'){const s=exigirSessao_(p.token);return jsonResponse_(substituirArbitro_(p,s.usuario));}
    if(a==='adminSalvarDataCalendario'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(salvarDataCalendario_(p,s.usuario));}
    if(a==='adminBloquearDatasCalendario'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(bloquearDatasCalendario_(p,s.usuario));}
    if(a==='adminExcluirDataCalendario'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(excluirDataCalendario_(p,s.usuario));}
    if(a==='adminDesativarDataCalendario'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(desativarDataCalendario_(p,s.usuario));}
    if(a==='adminCancelarPartidaForcaMaior'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(cancelarPartidaForcaMaior_(p,s.usuario));}
    if(a==='adminRemarcarPartida'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(remarcarPartida_(p,s.usuario));}
    if(a==='adminBloquearDataEmMassa'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(bloquearDataEmMassa_(p,s.usuario));}
    if(a==='adminSalvarPlanejamento'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(salvarPlanejamentoInscricoes_(p,s.usuario));}
    if(a==='adminEncerrarInscricoes'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(encerrarInscricoesAgora_(p,s.usuario));}
    if(a==='adminReabrirInscricoes'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(reabrirInscricoes_(p,s.usuario));}
    if(a==='financeiroConfirmarPagamento'){const s=exigirSessaoFinanceiro_(p.token);return jsonResponse_(confirmarPagamentoFinanceiro_(p,s.usuario));}
    if(a==='financeiroLancamentoCaixa'){const s=exigirSessaoFinanceiro_(p.token);return jsonResponse_(registrarLancamentoCaixa_(p,s.usuario));}
    if(a==='financeiroEstornarPagamento'){const s=exigirSessaoFinanceiro_(p.token);return jsonResponse_(estornarPagamentoFinanceiro_(p,s.usuario));}
    return jsonResponse_({ok:false,erro:'ACAO_INVALIDA'});
  }catch(err){return erroJson_(err);}
  finally{try{lock.releaseLock()}catch(_){}}
}
function adminLogin_(p){
  const email=normalizarEmail_(p.email),pin=String(p.pin||'').trim();
  if(!email||!pin)return {ok:false,erro:'CREDENCIAIS_OBRIGATORIAS',mensagem:'Informe e-mail e PIN.'};
  const cache=CacheService.getScriptCache(),k=loginFailKey_(email),falhas=Number(cache.get(k)||0);
  if(falhas>=MAX_LOGIN_FAILS)return {ok:false,erro:'LOGIN_BLOQUEADO',mensagem:'Muitas tentativas incorretas. Aguarde 15 minutos.'};
  const op=buscarOperadorPorEmail_(email);
  if(!op||op.status!=='ATIVO'||hashPin_(op.pinSalt,pin)!==op.pinHash){cache.put(k,String(falhas+1),LOGIN_BLOCK_SECONDS);return {ok:false,erro:'CREDENCIAIS_INVALIDAS',mensagem:'E-mail ou PIN incorretos.'};}
  cache.remove(k);const token=gerarToken_(),usuario={id:op.id,nome:op.nome,email:op.email,nivel:op.nivel};
  cache.put(sessionKey_(token),JSON.stringify({usuario}),SESSION_TTL);atualizarUltimoLogin_(op.linha);
  registrarHistorico_({usuario:op.email,perfil:op.nivel,acao:'LOGIN_ADMIN',entidade:'OPERADORES',idRegistro:op.id,valorAnterior:'',valorNovo:'LOGIN',observacoes:'Login no painel administrativo.'});
  return {ok:true,token,usuario,expiraEmSegundos:SESSION_TTL};
}
function adminSessao_(token){try{const s=exigirSessao_(token,'SESSAO_QUALQUER');return {ok:true,usuario:s.usuario,expiraEmSegundos:SESSION_TTL}}catch(_){return {ok:false,erro:'NAO_AUTORIZADO',mensagem:'Sessão inválida ou expirada.'}}}
function adminLogout_(token){if(token)CacheService.getScriptCache().remove(sessionKey_(token));return {ok:true,mensagem:'Sessão encerrada.'}}
function exigirSessao_(token,nivel){token=String(token||'').trim();if(!token)throw authError_();const cache=CacheService.getScriptCache(),raw=cache.get(sessionKey_(token));if(!raw)throw authError_();const s=JSON.parse(raw),op=buscarOperadorPorEmail_(s.usuario.email);if(!op||op.status!=='ATIVO')throw authError_();const requerido=String(nivel||'').toUpperCase();if(requerido==='SESSAO_QUALQUER'){}else if(requerido==='FINANCEIRO_OU_ADMIN'){if(!['FINANCEIRO','ADMINISTRADOR'].includes(op.nivel))throw new Error('ACESSO_NEGADO|Acesso restrito ao financeiro ou administrador.');}else if(requerido){if(op.nivel!==requerido)throw new Error('ACESSO_NEGADO|Você não possui permissão para esta função.');}else if(op.nivel==='FINANCEIRO'){throw new Error('ACESSO_NEGADO|O perfil FINANCEIRO possui acesso somente ao módulo Financeiro.');}s.usuario={id:op.id,nome:op.nome,email:op.email,nivel:op.nivel};cache.put(sessionKey_(token),JSON.stringify(s),SESSION_TTL);return s}
function authError_(){return new Error('NAO_AUTORIZADO|Sessão inválida ou expirada.')}
function sessionKey_(t){return 'tm_session_'+t}
function loginFailKey_(e){return 'tm_fail_'+hashTexto_(e).slice(0,32)}
function gerarToken_(){return Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'')}

function registrarInscricao_(d){
  const liberacao=validarInscricoesAbertas_();if(!liberacao.ok)return liberacao;
  const nome=limparTexto_(d.nomeCompleto||d.nome),turma=limparTexto_(d.turma),modulo=limparTexto_(d.modulo),email=normalizarEmail_(d.email),categoria=limparTexto_(d.categoria);
  if(!nome||!turma||!email||!categoria)return {ok:false,erro:'CAMPOS_OBRIGATORIOS',mensagem:'Preencha nome, turma, e-mail e categoria.'};
  if(!emailValido_(email))return {ok:false,erro:'EMAIL_INVALIDO',mensagem:'Informe um e-mail válido.'};
  if(!categoriasPermitidas_().includes(categoria))return {ok:false,erro:'CATEGORIA_INVALIDA',mensagem:'Selecione uma categoria válida.'};
  if(emailJaInscrito_(email))return {ok:false,erro:'EMAIL_JA_INSCRITO',mensagem:'Já existe uma inscrição vinculada a este e-mail.'};
  const tipo=String(getConfig_('TIPO_INSCRICAO')||'GRATUITA').toUpperCase(),valor=Number(getConfig_('VALOR_INSCRICAO')||0),id=gerarId_('P');
  gravarObjetoPrimeiraLinhaLivre_(SHEETS.PARTICIPANTES,'ID_PARTICIPANTE',{ID_PARTICIPANTE:id,DATA_INSCRICAO:new Date(),NOME_COMPLETO:nome,TURMA:turma,MODULO:modulo,EMAIL:email,CATEGORIA_ESCOLHIDA:categoria,CATEGORIA_VALIDADA:'',STATUS_REVISAO_CATEGORIA:'PENDENTE',STATUS_INSCRICAO:'PENDENTE_REVISAO',CABECA_DE_CHAVE:false,ORDEM_CABECA_CHAVE:'',RANKING_ANTES_TORNEIO:'',TIPO_INSCRICAO:tipo,VALOR_INSCRICAO:valor,STATUS_PAGAMENTO:tipo==='GRATUITA'?'ISENTO':'PENDENTE',FORMA_PAGAMENTO:tipo==='GRATUITA'?'NAO_APLICAVEL':String(d.formaPagamento||'').toUpperCase(),COMPROVANTE_URL:'',OBSERVACOES:limparTexto_(d.observacoes),ATIVO:true});
  registrarHistorico_({usuario:email,perfil:'PARTICIPANTE',acao:'INSCRICAO_REALIZADA',entidade:'PARTICIPANTES',idRegistro:id,valorAnterior:'',valorNovo:JSON.stringify({nome,turma,categoriaEscolhida:categoria}),observacoes:'Inscrição realizada pelo formulário público.'});
  return {ok:true,idParticipante:id,status:'PENDENTE_REVISAO',categoriaEscolhida:categoria,mensagem:'Inscrição recebida com sucesso. A categoria será revisada pela organização.'};
}

function adminAtualizarParticipante_(d,usuario){
  const id=limparTexto_(d.idParticipante),cat=limparTexto_(d.categoriaValidada),st=limparTexto_(d.statusInscricao).toUpperCase();
  if(!id)return {ok:false,erro:'ID_OBRIGATORIO',mensagem:'Participante não informado.'};
  if(!categoriasPermitidas_().includes(cat))return {ok:false,erro:'CATEGORIA_INVALIDA',mensagem:'Categoria inválida.'};
  if(!['APROVADO','PENDENTE_REVISAO','CANCELADO'].includes(st))return {ok:false,erro:'STATUS_INVALIDO',mensagem:'Status inválido.'};
  const sh=getSheet_(SHEETS.PARTICIPANTES),idx=indexHeaders_(getHeaders_(sh)),linha=localizarLinhaPorValor_(sh,idx.ID_PARTICIPANTE+1,id);if(linha===-1)return {ok:false,erro:'PARTICIPANTE_NAO_ENCONTRADO',mensagem:'Participante não encontrado.'};
  const anterior={categoria:sh.getRange(linha,idx.CATEGORIA_VALIDADA+1).getValue(),status:sh.getRange(linha,idx.STATUS_INSCRICAO+1).getValue()};
  sh.getRange(linha,idx.CATEGORIA_VALIDADA+1).setValue(cat);sh.getRange(linha,idx.STATUS_INSCRICAO+1).setValue(st);sh.getRange(linha,idx.STATUS_REVISAO_CATEGORIA+1).setValue(st==='PENDENTE_REVISAO'?'PENDENTE':'REVISADO');
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'PARTICIPANTE_ATUALIZADO',entidade:'PARTICIPANTES',idRegistro:id,valorAnterior:JSON.stringify(anterior),valorNovo:JSON.stringify({categoria:cat,status:st}),observacoes:'Atualização pelo painel administrativo.'});
  return {ok:true,mensagem:'Participante atualizado com sucesso.'};
}

function adminDefinirCabeca_(d,usuario){
  const id=limparTexto_(d.idParticipante),ativo=String(d.cabecaDeChave).toLowerCase()==='true',ordem=ativo?Number(d.ordemCabecaChave):'';
  const p=obterParticipantesValidos_().find(x=>x.id===id);if(!p||!participanteAptoSorteio_(p))return {ok:false,erro:'PARTICIPANTE_INVALIDO',mensagem:'O cabeça de chave deve ser participante ativo, aprovado e financeiramente regular.'};
  const cat=p.categoriaValidada||p.categoriaEscolhida;if(obterLinhasGrupo_(cat).length)return {ok:false,erro:'SORTEIO_JA_INICIADO',mensagem:'Não é possível alterar cabeças de chave depois de iniciar o sorteio desta categoria.'};
  if(ativo&&(!Number.isInteger(ordem)||ordem<1))return {ok:false,erro:'ORDEM_INVALIDA',mensagem:'Informe uma ordem de cabeça de chave válida.'};
  if(ativo){const conflito=obterParticipantesValidos_().some(x=>x.id!==id&&participanteAptoSorteio_(x)&&(x.categoriaValidada||x.categoriaEscolhida)===cat&&x.cabecaDeChave&&Number(x.ordemCabecaChave)===ordem);if(conflito)return {ok:false,erro:'ORDEM_DUPLICADA',mensagem:'Já existe outro cabeça de chave com essa ordem nesta categoria.'};}
  const sh=getSheet_(SHEETS.PARTICIPANTES),idx=indexHeaders_(getHeaders_(sh)),linha=localizarLinhaPorValor_(sh,idx.ID_PARTICIPANTE+1,id);sh.getRange(linha,idx.CABECA_DE_CHAVE+1).setValue(ativo);sh.getRange(linha,idx.ORDEM_CABECA_CHAVE+1).setValue(ativo?ordem:'');
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'CABECA_CHAVE_ATUALIZADO',entidade:'PARTICIPANTES',idRegistro:id,valorAnterior:'',valorNovo:JSON.stringify({cabecaDeChave:ativo,ordem:ativo?ordem:''}),observacoes:'Definição de cabeça de chave.'});
  return {ok:true,mensagem:ativo?'Cabeça de chave definido com sucesso.':'Participante removido dos cabeças de chave.'};
}

function obterEstadoSorteio_(categoria){
  categoria=limparTexto_(categoria);if(!categoriasPermitidas_().includes(categoria))throw new Error('CATEGORIA_INVALIDA|Categoria inválida.');
  const participantes=obterParticipantesValidos_().filter(p=>participanteAptoSorteio_(p)&&(p.categoriaValidada||p.categoriaEscolhida)===categoria),linhas=obterLinhasGrupo_(categoria),ids=new Set(linhas.map(x=>x.idParticipante)),grupos={};
  linhas.forEach(x=>{if(!grupos[x.nomeGrupo])grupos[x.nomeGrupo]={idGrupo:x.idGrupo,nome:x.nomeGrupo,ordem:x.ordem,status:x.status,participantes:[]};grupos[x.nomeGrupo].participantes.push(x)});
  const cabecas=participantes.filter(p=>p.cabecaDeChave).sort((a,b)=>Number(a.ordemCabecaChave||999)-Number(b.ordemCabecaChave||999));
  let status='NAO_INICIADO';if(linhas.length)status=linhas.every(x=>x.status==='FINALIZADO')?'FINALIZADO':'EM_SORTEIO';
  return {categoria,status,totalParticipantes:participantes.length,cabecas,grupos:Object.values(grupos).sort((a,b)=>a.ordem-b.ordem),naoSorteados:participantes.filter(p=>!ids.has(p.id)&&!p.cabecaDeChave),todosParticipantes:participantes};
}
function iniciarSorteio_(d,usuario){
  const categoria=limparTexto_(d.categoria);if(!categoriasPermitidas_().includes(categoria))return {ok:false,erro:'CATEGORIA_INVALIDA',mensagem:'Categoria inválida.'};if(obterLinhasGrupo_(categoria).length)return {ok:false,erro:'SORTEIO_EXISTENTE',mensagem:'O sorteio desta categoria já foi iniciado.'};
  const ps=obterParticipantesValidos_().filter(p=>participanteAptoSorteio_(p)&&(p.categoriaValidada||p.categoriaEscolhida)===categoria),cabecas=ps.filter(p=>p.cabecaDeChave).sort((a,b)=>Number(a.ordemCabecaChave)-Number(b.ordemCabecaChave));
  if(cabecas.length<2)return {ok:false,erro:'CABECAS_INSUFICIENTES',mensagem:'Defina pelo menos 2 cabeças de chave nesta categoria antes de iniciar o sorteio.'};
  const ordens=new Set(cabecas.map(p=>Number(p.ordemCabecaChave)));if(ordens.size!==cabecas.length||[...ordens].some(n=>!Number.isInteger(n)||n<1))return {ok:false,erro:'ORDEM_CABECAS_INVALIDA',mensagem:'As ordens dos cabeças de chave precisam ser únicas e válidas.'};
  cabecas.forEach((p,i)=>{const letra=letraGrupo_(i),nome='Grupo '+letra;gravarObjetoPrimeiraLinhaLivre_(SHEETS.GRUPOS,'ID_GRUPO',{ID_GRUPO:'GR-'+slugCategoria_(categoria)+'-'+letra,CATEGORIA:categoria,NOME_GRUPO:nome,ORDEM:i+1,ID_PARTICIPANTE:p.id,NOME_PARTICIPANTE:p.nome,POSICAO_SORTEIO:0,CABECA_DE_CHAVE:true,DATA_GERACAO:new Date(),STATUS:'EM_SORTEIO'})});
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'SORTEIO_INICIADO',entidade:'GRUPOS',idRegistro:categoria,valorAnterior:'',valorNovo:JSON.stringify({grupos:cabecas.length}),observacoes:'Cabeças de chave posicionados automaticamente, um por grupo.'});return {ok:true,mensagem:'Sorteio iniciado. Os cabeças de chave já foram posicionados nos grupos.'};
}
function adicionarAoGrupo_(d,usuario){
  const categoria=limparTexto_(d.categoria),id=limparTexto_(d.idParticipante),nomeGrupo=limparTexto_(d.nomeGrupo),estado=obterEstadoSorteio_(categoria);if(estado.status!=='EM_SORTEIO')return {ok:false,erro:'SORTEIO_NAO_ABERTO',mensagem:'O sorteio desta categoria não está aberto.'};const p=estado.naoSorteados.find(x=>x.id===id);if(!p)return {ok:false,erro:'PARTICIPANTE_INDISPONIVEL',mensagem:'Participante não disponível para sorteio.'};const g=estado.grupos.find(x=>x.nome===nomeGrupo);if(!g)return {ok:false,erro:'GRUPO_INVALIDO',mensagem:'Grupo inválido.'};const pos=obterLinhasGrupo_(categoria).filter(x=>!x.cabecaDeChave).length+1;
  gravarObjetoPrimeiraLinhaLivre_(SHEETS.GRUPOS,'ID_GRUPO',{ID_GRUPO:g.idGrupo,CATEGORIA:categoria,NOME_GRUPO:g.nome,ORDEM:g.ordem,ID_PARTICIPANTE:p.id,NOME_PARTICIPANTE:p.nome,POSICAO_SORTEIO:pos,CABECA_DE_CHAVE:false,DATA_GERACAO:new Date(),STATUS:'EM_SORTEIO'});registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'PARTICIPANTE_SORTEADO',entidade:'GRUPOS',idRegistro:p.id,valorAnterior:'',valorNovo:g.nome,observacoes:'Participante lançado durante sorteio ao vivo.'});return {ok:true,mensagem:p.nome+' inserido no '+g.nome+'.'};
}
function removerDoGrupo_(d,usuario){
  const categoria=limparTexto_(d.categoria),id=limparTexto_(d.idParticipante),estado=obterEstadoSorteio_(categoria);if(estado.status!=='EM_SORTEIO')return {ok:false,erro:'SORTEIO_NAO_ABERTO',mensagem:'O sorteio não está aberto.'};
  const sh=getSheet_(SHEETS.GRUPOS),idx=indexHeaders_(getHeaders_(sh)),max=sh.getMaxRows(),vals=sh.getRange(2,1,max-1,sh.getLastColumn()).getValues();let linha=-1,row=null;for(let i=0;i<vals.length;i++){if(String(vals[i][idx.CATEGORIA])===categoria&&String(vals[i][idx.ID_PARTICIPANTE])===id){linha=i+2;row=vals[i];break}}
  if(linha===-1)return {ok:false,erro:'NAO_ENCONTRADO',mensagem:'Participante não encontrado nos grupos.'};if(row[idx.CABECA_DE_CHAVE]===true||String(row[idx.CABECA_DE_CHAVE]).toUpperCase()==='TRUE')return {ok:false,erro:'CABECA_FIXO',mensagem:'Cabeças de chave não podem ser removidos durante o sorteio.'};sh.getRange(linha,1,1,sh.getLastColumn()).clearContent();registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'SORTEIO_CORRIGIDO',entidade:'GRUPOS',idRegistro:id,valorAnterior:String(row[idx.NOME_GRUPO]),valorNovo:'REMOVIDO',observacoes:'Correção durante sorteio ao vivo.'});return {ok:true,mensagem:'Participante devolvido à lista de não sorteados.'};
}
function finalizarSorteio_(d,usuario){
  const categoria=limparTexto_(d.categoria),estado=obterEstadoSorteio_(categoria);if(estado.status!=='EM_SORTEIO')return {ok:false,erro:'SORTEIO_NAO_ABERTO',mensagem:'O sorteio desta categoria não está aberto.'};if(estado.naoSorteados.length)return {ok:false,erro:'PARTICIPANTES_PENDENTES',mensagem:'Ainda existem '+estado.naoSorteados.length+' participante(s) não sorteado(s).'};
  const sh=getSheet_(SHEETS.GRUPOS),idx=indexHeaders_(getHeaders_(sh)),max=sh.getMaxRows(),vals=sh.getRange(2,1,max-1,sh.getLastColumn()).getValues();for(let i=0;i<vals.length;i++){if(String(vals[i][idx.CATEGORIA])===categoria&&String(vals[i][idx.ID_PARTICIPANTE]||'').trim())sh.getRange(i+2,idx.STATUS+1).setValue('FINALIZADO')}
  gerarJogosDosGrupos_(categoria,usuario);recalcularClassificacaoCategoria_(categoria);registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'SORTEIO_FINALIZADO',entidade:'GRUPOS',idRegistro:categoria,valorAnterior:'EM_SORTEIO',valorNovo:'FINALIZADO',observacoes:'Grupos bloqueados e confrontos gerados automaticamente.'});return {ok:true,mensagem:'Sorteio finalizado. Os grupos foram bloqueados e os confrontos foram gerados.'};
}
function reiniciarSorteio_(d,usuario){const categoria=limparTexto_(d.categoria),estado=obterEstadoSorteio_(categoria);if(estado.status==='FINALIZADO')return {ok:false,erro:'SORTEIO_FINALIZADO',mensagem:'O sorteio já foi finalizado. Não é permitido reiniciar após a geração dos confrontos.'};limparLinhasPorCategoria_(SHEETS.GRUPOS,categoria,'CATEGORIA');registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'SORTEIO_REINICIADO',entidade:'GRUPOS',idRegistro:categoria,valorAnterior:'EM_SORTEIO',valorNovo:'NAO_INICIADO',observacoes:'Sorteio apagado antes da finalização.'});return {ok:true,mensagem:'Sorteio reiniciado. Os cabeças de chave continuam definidos nos participantes.'}}

function gerarJogosDosGrupos_(categoria,usuario){
  if(obterJogosCategoria_(categoria).length)throw new Error('JOGOS_EXISTENTES|Já existem confrontos de grupos para esta categoria.');
  const estado=obterEstadoSorteio_(categoria);estado.grupos.forEach(g=>{const jogadores=g.participantes.slice().sort((a,b)=>(a.cabecaDeChave?-1:1)-(b.cabecaDeChave?-1:1)||Number(a.posicaoSorteio)-Number(b.posicaoSorteio)),rodadas=gerarRodadasRoundRobin_(jogadores);rodadas.forEach((pares,r)=>pares.forEach(par=>{if(!par[0]||!par[1])return;gravarObjetoPrimeiraLinhaLivre_(SHEETS.JOGOS,'ID_JOGO',{ID_JOGO:gerarId_('J'),CATEGORIA:categoria,FASE:'GRUPOS',GRUPO:g.nome,RODADA:r+1,DATA:'',HORARIO_PREVISTO:'',MESA:'',ID_JOGADOR_A:par[0].idParticipante,JOGADOR_A:par[0].nomeParticipante,ID_JOGADOR_B:par[1].idParticipante,JOGADOR_B:par[1].nomeParticipante,SET1_A:'',SET1_B:'',SET2_A:'',SET2_B:'',SET3_A:'',SET3_B:'',SETS_A:'',SETS_B:'',PONTOS_A:'',PONTOS_B:'',ID_VENCEDOR:'',VENCEDOR:'',STATUS:'AGENDADO',OPERADOR_LANCAMENTO:'',DATA_HORA_LANCAMENTO:'',OBSERVACOES:'',SET4_A:'',SET4_B:'',SET5_A:'',SET5_B:'',TIPO_RESULTADO:'',MELHOR_DE:3})}))});
}
function gerarRodadasRoundRobin_(jogadores){let a=jogadores.slice();if(a.length%2)a.push(null);const n=a.length,rodadas=[];for(let r=0;r<n-1;r++){const pares=[];for(let i=0;i<n/2;i++)pares.push([a[i],a[n-1-i]]);rodadas.push(pares);a=[a[0],a[n-1]].concat(a.slice(1,n-1))}return rodadas}
function obterJogosCategoria_(categoria){return listarJogos_().filter(j=>j.categoria===categoria&&j.fase==='GRUPOS')}
function melhorDePorFase_(fase){fase=String(fase||'').toUpperCase();return ['SEMIFINAL','SEMIFINAIS','FINAL','TERCEIRO_LUGAR','3_LUGAR','DECISAO_3_LUGAR'].includes(fase)?5:3}

function listarJogos_(){
  const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();if(last<2)return [];
  return sh.getRange(2,1,last-1,h.length).getValues().filter(r=>String(r[idx.ID_JOGO]||'').trim()).map(r=>({id:r[idx.ID_JOGO],categoria:r[idx.CATEGORIA],fase:String(r[idx.FASE]||''),grupo:r[idx.GRUPO],rodada:Number(r[idx.RODADA]||0),data:r[idx.DATA],horario:r[idx.HORARIO_PREVISTO],mesa:r[idx.MESA],idA:r[idx.ID_JOGADOR_A],jogadorA:r[idx.JOGADOR_A],idB:r[idx.ID_JOGADOR_B],jogadorB:r[idx.JOGADOR_B],sets:[[r[idx.SET1_A],r[idx.SET1_B]],[r[idx.SET2_A],r[idx.SET2_B]],[r[idx.SET3_A],r[idx.SET3_B]],[idx.SET4_A!==undefined?r[idx.SET4_A]:'',idx.SET4_B!==undefined?r[idx.SET4_B]:''],[idx.SET5_A!==undefined?r[idx.SET5_A]:'',idx.SET5_B!==undefined?r[idx.SET5_B]:'']],setsA:Number(r[idx.SETS_A]||0),setsB:Number(r[idx.SETS_B]||0),pontosA:Number(r[idx.PONTOS_A]||0),pontosB:Number(r[idx.PONTOS_B]||0),idVencedor:r[idx.ID_VENCEDOR],vencedor:r[idx.VENCEDOR],status:String(r[idx.STATUS]||'AGENDADO'),operador:r[idx.OPERADOR_LANCAMENTO],dataHoraLancamento:r[idx.DATA_HORA_LANCAMENTO],observacoes:r[idx.OBSERVACOES],tipoResultado:idx.TIPO_RESULTADO!==undefined?String(r[idx.TIPO_RESULTADO]||''):'',melhorDe:idx.MELHOR_DE!==undefined?Number(r[idx.MELHOR_DE]||melhorDePorFase_(r[idx.FASE])):melhorDePorFase_(r[idx.FASE])}));
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
  Object.keys(campos).forEach(k=>{if(idx[k]!==undefined)sh.getRange(linha,idx[k]+1).setValue(campos[k])});
  if(fase==='GRUPOS')recalcularClassificacaoCategoria_(categoria);else{sincronizarConfrontoResultado_(id,resultado);avancarMataMataSePronto_(categoria,fase,usuario);}
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:statusAnterior==='FINALIZADO'?'RESULTADO_CORRIGIDO':'RESULTADO_LANCADO',entidade:'JOGOS',idRegistro:id,valorAnterior:JSON.stringify(anterior),valorNovo:JSON.stringify(campos),observacoes:statusAnterior==='FINALIZADO'?'Resultado corrigido.':'Resultado finalizado.'});
  return {ok:true,mensagem:statusAnterior==='FINALIZADO'?'Resultado corrigido com sucesso.':'Partida finalizada com sucesso.',classificacao:listarClassificacao_().filter(x=>x.categoria===categoria&&x.grupo===String(r[idx.GRUPO])),mataMata:listarMataMata_().filter(x=>x.categoria===categoria)};
}
function montarResultado_(d,tipo,melhorDe,j){
  const alvo=melhorDe===5?3:2,sets=[['',''],['',''],['',''],['',''],['','']];
  if(tipo==='WO_DUPLO')return {sets,setsA:0,setsB:0,pontosA:0,pontosB:0,idVencedor:'',vencedor:'',idPerdedor:'',perdedor:''};
  if(tipo==='WO_A'||tipo==='WO_B'){const aVence=tipo==='WO_B';for(let i=0;i<alvo;i++)sets[i]=aVence?[11,0]:[0,11];return {sets,setsA:aVence?alvo:0,setsB:aVence?0:alvo,pontosA:aVence?11*alvo:0,pontosB:aVence?0:11*alvo,idVencedor:aVence?j.idA:j.idB,vencedor:aVence?j.nomeA:j.nomeB,idPerdedor:aVence?j.idB:j.idA,perdedor:aVence?j.nomeB:j.nomeA};}
  let va=0,vb=0,pa=0,pb=0,encerrou=false;
  for(let i=0;i<melhorDe;i++){
    const sa=String(d['set'+(i+1)+'A']??'').trim(),sb=String(d['set'+(i+1)+'B']??'').trim();if(sa===''&&sb==='')continue;if(encerrou)throw new Error('SETS_EXCEDENTES|Não informe sets depois que um jogador já alcançou a quantidade necessária para vencer.');if(sa===''||sb===''||isNaN(Number(sa))||isNaN(Number(sb)))throw new Error('PLACAR_INVALIDO|Informe os dois pontos de cada set disputado.');const a=Number(sa),b=Number(sb),ma=Math.max(a,b),mi=Math.min(a,b);if(a<0||b<0||a===b||ma<11||ma-mi<2)throw new Error('SET_INVALIDO|Cada set termina com no mínimo 11 pontos e diferença mínima de 2.');if(mi<=9&&ma!==11)throw new Error('SET_INVALIDO|Com o perdedor até 9 pontos, o set deve terminar em 11.');if(mi>=10&&ma!==mi+2)throw new Error('SET_INVALIDO|Depois de 10 x 10, o set termina somente com diferença exata de 2 pontos.');sets[i]=[a,b];pa+=a;pb+=b;if(a>b)va++;else vb++;if(va===alvo||vb===alvo)encerrou=true;
  }
  if(va!==alvo&&vb!==alvo)throw new Error('PARTIDA_INCOMPLETA|Informe os sets necessários até um jogador vencer a partida.');const aVence=va>vb;return {sets,setsA:va,setsB:vb,pontosA:pa,pontosB:pb,idVencedor:aVence?j.idA:j.idB,vencedor:aVence?j.nomeA:j.nomeB,idPerdedor:aVence?j.idB:j.idA,perdedor:aVence?j.nomeB:j.nomeA};
}
function serializarJogoLinha_(r,idx){return {set1:[r[idx.SET1_A],r[idx.SET1_B]],set2:[r[idx.SET2_A],r[idx.SET2_B]],set3:[r[idx.SET3_A],r[idx.SET3_B]],set4:idx.SET4_A!==undefined?[r[idx.SET4_A],r[idx.SET4_B]]:[],set5:idx.SET5_A!==undefined?[r[idx.SET5_A],r[idx.SET5_B]]:[],setsA:r[idx.SETS_A],setsB:r[idx.SETS_B],pontosA:r[idx.PONTOS_A],pontosB:r[idx.PONTOS_B],vencedor:r[idx.VENCEDOR],status:r[idx.STATUS],tipoResultado:idx.TIPO_RESULTADO!==undefined?r[idx.TIPO_RESULTADO]:''}}

function recalcularClassificacaoCategoria_(categoria){
  limparLinhasPorCategoria_(SHEETS.CLASSIFICACAO,categoria,'CATEGORIA');const membros=obterLinhasGrupo_(categoria),jogos=listarJogos_().filter(j=>j.categoria===categoria&&j.fase==='GRUPOS'&&j.status==='FINALIZADO'),porGrupo={},qtdClass=getClassificadosPorGrupo_(categoria),criterio=String(getConfig_('CRITERIOS_DESEMPATE')||'Vitórias > confronto direto > saldo de sets > saldo de pontos > sets vencidos > pontos marcados > sorteio');
  membros.forEach(m=>{if(!porGrupo[m.nomeGrupo])porGrupo[m.nomeGrupo]={};porGrupo[m.nomeGrupo][m.idParticipante]={categoria,grupo:m.nomeGrupo,id:m.idParticipante,nome:m.nomeParticipante,jogos:0,vitorias:0,derrotas:0,setsPro:0,setsContra:0,pontosPro:0,pontosContra:0}});
  jogos.forEach(j=>{const g=porGrupo[j.grupo];if(!g||!g[j.idA]||!g[j.idB])return;const a=g[j.idA],b=g[j.idB];a.jogos++;b.jogos++;if(j.tipoResultado!=='WO_DUPLO'){if(j.idVencedor===j.idA){a.vitorias++;b.derrotas++}else if(j.idVencedor===j.idB){b.vitorias++;a.derrotas++}}a.setsPro+=j.setsA;a.setsContra+=j.setsB;b.setsPro+=j.setsB;b.setsContra+=j.setsA;a.pontosPro+=j.pontosA;a.pontosContra+=j.pontosB;b.pontosPro+=j.pontosB;b.pontosContra+=j.pontosA});
  Object.keys(porGrupo).sort().forEach(grupo=>{const lista=Object.values(porGrupo[grupo]),jg=jogos.filter(j=>j.grupo===grupo);ordenarClassificacaoGrupo_(lista,jg);lista.forEach((x,i)=>{const saldoSets=x.setsPro-x.setsContra,saldoPontos=x.pontosPro-x.pontosContra,aprov=x.jogos?x.vitorias/x.jogos:0;gravarObjetoPrimeiraLinhaLivre_(SHEETS.CLASSIFICACAO,'CATEGORIA',{CATEGORIA:categoria,GRUPO:grupo,ID_PARTICIPANTE:x.id,NOME:x.nome,JOGOS:x.jogos,VITORIAS:x.vitorias,DERROTAS:x.derrotas,SETS_PRO:x.setsPro,SETS_CONTRA:x.setsContra,SALDO_SETS:saldoSets,PONTOS_PRO:x.pontosPro,PONTOS_CONTRA:x.pontosContra,SALDO_PONTOS:saldoPontos,APROVEITAMENTO:aprov,POSICAO:i+1,CLASSIFICADO:i<Math.min(qtdClass,lista.length),CRITERIO_DESEMPATE:criterio});});});
}
function ordenarClassificacaoGrupo_(lista,jogos){
  lista.sort((a,b)=>b.vitorias-a.vitorias);const saida=[];let i=0;
  while(i<lista.length){let j=i+1;while(j<lista.length&&lista[j].vitorias===lista[i].vitorias)j++;const bloco=lista.slice(i,j);if(bloco.length===2){const a=bloco[0],b=bloco[1],direto=jogos.find(x=>x.tipoResultado!=='WO_DUPLO'&&((x.idA===a.id&&x.idB===b.id)||(x.idA===b.id&&x.idB===a.id)));if(direto&&direto.idVencedor){bloco.sort((x,y)=>x.id===direto.idVencedor?-1:y.id===direto.idVencedor?1:comparadorGeral_(x,y));}else bloco.sort(comparadorGeral_);}else if(bloco.length>2){const ids=new Set(bloco.map(x=>x.id)),mini={};bloco.forEach(x=>mini[x.id]={v:0,sp:0,sc:0,pp:0,pc:0});jogos.filter(x=>ids.has(x.idA)&&ids.has(x.idB)).forEach(x=>{const a=mini[x.idA],b=mini[x.idB];if(x.tipoResultado!=='WO_DUPLO'){if(x.idVencedor===x.idA)a.v++;else if(x.idVencedor===x.idB)b.v++;}a.sp+=x.setsA;a.sc+=x.setsB;b.sp+=x.setsB;b.sc+=x.setsA;a.pp+=x.pontosA;a.pc+=x.pontosB;b.pp+=x.pontosB;b.pc+=x.pontosA});bloco.sort((a,b)=>{const ma=mini[a.id],mb=mini[b.id];return mb.v-ma.v||((mb.sp-mb.sc)-(ma.sp-ma.sc))||((mb.pp-mb.pc)-(ma.pp-ma.pc))||comparadorGeral_(a,b)});}saida.push.apply(saida,bloco);i=j;}
  lista.splice(0,lista.length,...saida);
}
function comparadorGeral_(a,b){return ((b.setsPro-b.setsContra)-(a.setsPro-a.setsContra))||((b.pontosPro-b.pontosContra)-(a.pontosPro-a.pontosContra))||b.setsPro-a.setsPro||b.pontosPro-a.pontosPro||String(a.nome).localeCompare(String(b.nome),'pt-BR')}
function listarClassificacao_(){const sh=getSheet_(SHEETS.CLASSIFICACAO),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();if(last<2)return [];return sh.getRange(2,1,last-1,h.length).getValues().filter(r=>String(r[idx.CATEGORIA]||'').trim()&&String(r[idx.ID_PARTICIPANTE]||'').trim()).map(r=>({categoria:r[idx.CATEGORIA],grupo:r[idx.GRUPO],id:r[idx.ID_PARTICIPANTE],nome:r[idx.NOME],jogos:Number(r[idx.JOGOS]||0),vitorias:Number(r[idx.VITORIAS]||0),derrotas:Number(r[idx.DERROTAS]||0),setsPro:Number(r[idx.SETS_PRO]||0),setsContra:Number(r[idx.SETS_CONTRA]||0),saldoSets:Number(r[idx.SALDO_SETS]||0),pontosPro:Number(r[idx.PONTOS_PRO]||0),pontosContra:Number(r[idx.PONTOS_CONTRA]||0),saldoPontos:Number(r[idx.SALDO_PONTOS]||0),aproveitamento:Number(r[idx.APROVEITAMENTO]||0),posicao:Number(r[idx.POSICAO]||0),classificado:r[idx.CLASSIFICADO]===true||String(r[idx.CLASSIFICADO]).toUpperCase()==='TRUE',criterio:r[idx.CRITERIO_DESEMPATE]})).sort((a,b)=>String(a.categoria).localeCompare(String(b.categoria))||String(a.grupo).localeCompare(String(b.grupo))||a.posicao-b.posicao)}

function obterEstadoFaseGrupos_(categoria){
  categoria=limparTexto_(categoria);const jogos=listarJogos_().filter(j=>j.categoria===categoria&&j.fase==='GRUPOS'),finalizados=jogos.filter(j=>j.status==='FINALIZADO').length,membros=obterLinhasGrupo_(categoria),grupos=[...new Set(membros.map(x=>x.nomeGrupo))],tamanhos=grupos.map(g=>membros.filter(x=>x.nomeGrupo===g).length),mata=listarMataMata_().filter(x=>x.categoria===categoria),encerrada=mata.length>0||listarJogos_().some(j=>j.categoria===categoria&&j.fase!=='GRUPOS');
  let status='SEM_JOGOS';if(jogos.length)status=encerrada?'ENCERRADA':finalizados===jogos.length?'PRONTA_ENCERRAR':'EM_ANDAMENTO';
  return {categoria,status,totalJogos:jogos.length,jogosFinalizados:finalizados,jogosPendentes:jogos.length-finalizados,encerrada,podeEncerrar:!encerrada&&jogos.length>0&&finalizados===jogos.length,podeReabrir:encerrada&&!listarJogos_().some(j=>j.categoria===categoria&&j.fase!=='GRUPOS'&&j.status==='FINALIZADO'),classificadosPorGrupo:getClassificadosPorGrupo_(categoria),maxClassificados:tamanhos.length?Math.min.apply(null,tamanhos):0,grupos:grupos.length};
}
function listarEstadosFasesGrupos_(){return categoriasPermitidas_().map(obterEstadoFaseGrupos_)}
function salvarConfigCategoria_(d,usuario){const categoria=limparTexto_(d.categoria),qtd=Number(d.classificadosPorGrupo);if(!categoriasPermitidas_().includes(categoria))return {ok:false,erro:'CATEGORIA_INVALIDA',mensagem:'Categoria inválida.'};const estado=obterEstadoFaseGrupos_(categoria);if(estado.encerrada)return {ok:false,erro:'FASE_ENCERRADA',mensagem:'Reabra a fase de grupos antes de alterar esta configuração.'};if(!Number.isInteger(qtd)||qtd<1)return {ok:false,erro:'VALOR_INVALIDO',mensagem:'Informe ao menos 1 classificado por grupo.'};if(estado.maxClassificados&&qtd>estado.maxClassificados)return {ok:false,erro:'VALOR_INVALIDO',mensagem:'Nesta categoria, o menor grupo possui '+estado.maxClassificados+' participante(s).'};const chave='CLASSIFICADOS_POR_GRUPO_'+configKeyCategoria_(categoria),ant=getConfig_(chave)||getConfig_('CLASSIFICADOS_POR_GRUPO');setConfig_(chave,qtd,'Quantidade que avança por grupo na categoria '+categoria+'; alterável sem mudar o código');recalcularClassificacaoCategoria_(categoria);registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'CONFIG_MATA_MATA_ALTERADA',entidade:'CONFIGURACOES',idRegistro:categoria,valorAnterior:String(ant),valorNovo:String(qtd),observacoes:'Classificados por grupo alterado.'});return {ok:true,mensagem:'Configuração atualizada. '+qtd+' participante(s) por grupo avançarão nesta categoria.'}}
function encerrarFaseGrupos_(d,usuario){
  const categoria=limparTexto_(d.categoria);if(!categoriasPermitidas_().includes(categoria))return {ok:false,erro:'CATEGORIA_INVALIDA',mensagem:'Categoria inválida.'};const estado=obterEstadoFaseGrupos_(categoria);if(estado.encerrada)return {ok:false,erro:'FASE_JA_ENCERRADA',mensagem:'A fase de grupos desta categoria já foi encerrada.'};if(!estado.totalJogos)return {ok:false,erro:'SEM_JOGOS',mensagem:'Ainda não existem partidas de grupos nesta categoria.'};if(estado.jogosPendentes>0)return {ok:false,erro:'JOGOS_PENDENTES',mensagem:'Ainda faltam '+estado.jogosPendentes+' partida(s) desta categoria.'};
  recalcularClassificacaoCategoria_(categoria);const classificados=listarClassificacao_().filter(x=>x.categoria===categoria&&x.classificado);if(classificados.length<2)return {ok:false,erro:'CLASSIFICADOS_INSUFICIENTES',mensagem:'É necessário ter pelo menos dois classificados para gerar o mata-mata.'};gerarPrimeiraFaseMataMata_(categoria,classificados,usuario);registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'FASE_GRUPOS_ENCERRADA',entidade:'MATA_MATA',idRegistro:categoria,valorAnterior:'EM_ANDAMENTO',valorNovo:'ENCERRADA',observacoes:'Classificação congelada e mata-mata gerado sem aguardar a outra categoria.'});return {ok:true,mensagem:'Fase de grupos de '+categoria+' encerrada. O mata-mata foi gerado.',estado:obterEstadoFaseGrupos_(categoria),mataMata:listarMataMata_().filter(x=>x.categoria===categoria)};
}
function reabrirFaseGrupos_(d,usuario){const categoria=limparTexto_(d.categoria);if(!categoriasPermitidas_().includes(categoria))return {ok:false,erro:'CATEGORIA_INVALIDA',mensagem:'Categoria inválida.'};const estado=obterEstadoFaseGrupos_(categoria);if(!estado.encerrada)return {ok:false,erro:'FASE_NAO_ENCERRADA',mensagem:'A fase de grupos ainda não foi encerrada.'};if(!estado.podeReabrir)return {ok:false,erro:'MATA_MATA_JA_INICIADO',mensagem:'Já existe partida do mata-mata finalizada. A fase de grupos não pode ser reaberta automaticamente.'};limparJogosMataMataCategoria_(categoria);limparLinhasPorCategoria_(SHEETS.MATA_MATA,categoria,'CATEGORIA');recalcularClassificacaoCategoria_(categoria);registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'FASE_GRUPOS_REABERTA',entidade:'MATA_MATA',idRegistro:categoria,valorAnterior:'ENCERRADA',valorNovo:'EM_ANDAMENTO',observacoes:'Mata-mata ainda não iniciado foi removido para permitir correções.'});return {ok:true,mensagem:'Fase de grupos reaberta. Os resultados de grupo podem ser corrigidos novamente.'}}

function gerarPrimeiraFaseMataMata_(categoria,classificados,usuario){
  limparJogosMataMataCategoria_(categoria);limparLinhasPorCategoria_(SHEETS.MATA_MATA,categoria,'CATEGORIA');
  const ordenados=classificados.slice().sort(comparadorSeed_),q=ordenados.length,tamanho=proximaPotencia2_(q),byes=tamanho-q,fase=fasePorQuantidade_(tamanho),restantes=ordenados.slice(),confrontos=[];
  for(let i=0;i<byes;i++){const p=restantes.shift();confrontos.push({a:p,b:null,origemA:p.posicao+'º '+p.grupo,origemB:'BYE'});}
  while(restantes.length){const a=restantes.shift();let k=-1;for(let i=restantes.length-1;i>=0;i--){if(restantes[i].grupo!==a.grupo){k=i;break}}if(k<0)k=restantes.length-1;const b=restantes.splice(k,1)[0];confrontos.push({a,b,origemA:a.posicao+'º '+a.grupo,origemB:b.posicao+'º '+b.grupo});}
  confrontos.forEach((c,i)=>criarConfronto_(categoria,fase,i+1,c.a,c.b,c.origemA,c.origemB,'Primeira fase eliminatória gerada automaticamente.'));
  if(confrontos.every(c=>!c.b))avancarMataMataSePronto_(categoria,fase,usuario);
}
function comparadorSeed_(a,b){return a.posicao-b.posicao||b.vitorias-a.vitorias||b.saldoSets-a.saldoSets||b.saldoPontos-a.saldoPontos||String(a.nome).localeCompare(String(b.nome),'pt-BR')}
function proximaPotencia2_(n){let p=1;while(p<n)p*=2;return p}
function fasePorQuantidade_(q){if(q<=2)return 'FINAL';if(q<=4)return 'SEMIFINAL';if(q<=8)return 'QUARTAS_DE_FINAL';if(q<=16)return 'OITAVAS_DE_FINAL';if(q<=32)return 'DEZESSEIS_AVOS';return 'MATA_MATA_'+q}
function criarConfronto_(categoria,fase,ordem,a,b,origemA,origemB,obs){
  const idConfronto=gerarId_('MM'),agora=new Date();let idJogo='',status='AGENDADO',idVencedor='',vencedor='';
  if(!b){status='BYE';idVencedor=a.id;vencedor=a.nome;}else{idJogo=gerarId_('J');gravarObjetoPrimeiraLinhaLivre_(SHEETS.JOGOS,'ID_JOGO',{ID_JOGO:idJogo,CATEGORIA:categoria,FASE:fase,GRUPO:'',RODADA:ordem,DATA:'',HORARIO_PREVISTO:'',MESA:'',ID_JOGADOR_A:a.id,JOGADOR_A:a.nome,ID_JOGADOR_B:b.id,JOGADOR_B:b.nome,SET1_A:'',SET1_B:'',SET2_A:'',SET2_B:'',SET3_A:'',SET3_B:'',SETS_A:'',SETS_B:'',PONTOS_A:'',PONTOS_B:'',ID_VENCEDOR:'',VENCEDOR:'',STATUS:'AGENDADO',OPERADOR_LANCAMENTO:'',DATA_HORA_LANCAMENTO:'',OBSERVACOES:'',SET4_A:'',SET4_B:'',SET5_A:'',SET5_B:'',TIPO_RESULTADO:'',MELHOR_DE:melhorDePorFase_(fase)});}
  gravarObjetoPrimeiraLinhaLivre_(SHEETS.MATA_MATA,'ID_CONFRONTO',{ID_CONFRONTO:idConfronto,CATEGORIA:categoria,FASE:fase,ORDEM:ordem,ORIGEM_JOGADOR_A:origemA||'',ID_JOGADOR_A:a.id,JOGADOR_A:a.nome,ORIGEM_JOGADOR_B:origemB||'',ID_JOGADOR_B:b?b.id:'',JOGADOR_B:b?b.nome:'BYE',ID_JOGO:idJogo,ID_VENCEDOR:idVencedor,VENCEDOR:vencedor,PROXIMO_CONFRONTO:'',STATUS:status,ID_PERDEDOR:'',PERDEDOR:'',DATA_GERACAO:agora,OBSERVACOES:obs||''});return idConfronto;
}
function listarMataMata_(){const sh=getSheet_(SHEETS.MATA_MATA),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();if(last<2)return [];return sh.getRange(2,1,last-1,h.length).getValues().filter(r=>String(r[idx.ID_CONFRONTO]||'').trim()).map(r=>({id:r[idx.ID_CONFRONTO],categoria:r[idx.CATEGORIA],fase:String(r[idx.FASE]||''),ordem:Number(r[idx.ORDEM]||0),origemA:r[idx.ORIGEM_JOGADOR_A],idA:r[idx.ID_JOGADOR_A],jogadorA:r[idx.JOGADOR_A],origemB:r[idx.ORIGEM_JOGADOR_B],idB:r[idx.ID_JOGADOR_B],jogadorB:r[idx.JOGADOR_B],idJogo:r[idx.ID_JOGO],idVencedor:r[idx.ID_VENCEDOR],vencedor:r[idx.VENCEDOR],proximo:r[idx.PROXIMO_CONFRONTO],status:String(r[idx.STATUS]||''),idPerdedor:idx.ID_PERDEDOR!==undefined?r[idx.ID_PERDEDOR]:'',perdedor:idx.PERDEDOR!==undefined?r[idx.PERDEDOR]:'',dataGeracao:idx.DATA_GERACAO!==undefined?r[idx.DATA_GERACAO]:'',observacoes:idx.OBSERVACOES!==undefined?r[idx.OBSERVACOES]:''})).sort((a,b)=>String(a.categoria).localeCompare(String(b.categoria))||ordemFase_(a.fase)-ordemFase_(b.fase)||a.ordem-b.ordem)}
function ordemFase_(fase){const f=String(fase||'').toUpperCase();if(f.startsWith('MATA_MATA_')||f==='DEZESSEIS_AVOS')return 1;if(f==='OITAVAS_DE_FINAL')return 2;if(f==='QUARTAS_DE_FINAL')return 3;if(f==='SEMIFINAL')return 4;if(f==='TERCEIRO_LUGAR')return 5;if(f==='FINAL')return 6;return 0}
function sincronizarConfrontoResultado_(idJogo,resultado){const sh=getSheet_(SHEETS.MATA_MATA),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();if(last<2)return;const vals=sh.getRange(2,1,last-1,h.length).getValues();for(let i=0;i<vals.length;i++){if(String(vals[i][idx.ID_JOGO])===String(idJogo)){const linha=i+2;sh.getRange(linha,idx.ID_VENCEDOR+1).setValue(resultado.idVencedor||'');sh.getRange(linha,idx.VENCEDOR+1).setValue(resultado.vencedor||'');sh.getRange(linha,idx.STATUS+1).setValue('FINALIZADO');if(idx.ID_PERDEDOR!==undefined)sh.getRange(linha,idx.ID_PERDEDOR+1).setValue(resultado.idPerdedor||'');if(idx.PERDEDOR!==undefined)sh.getRange(linha,idx.PERDEDOR+1).setValue(resultado.perdedor||'');break}}}
function avancarMataMataSePronto_(categoria,fase,usuario){
  if(String(getConfig_('GERACAO_PROXIMA_FASE_AUTOMATICA')||'TRUE').toUpperCase()==='FALSE')return;fase=String(fase||'').toUpperCase();if(fase==='FINAL'||fase==='TERCEIRO_LUGAR')return;const atual=listarMataMata_().filter(x=>x.categoria===categoria&&x.fase===fase);if(!atual.length||atual.some(x=>!['FINALIZADO','BYE'].includes(x.status)))return;const winners=atual.sort((a,b)=>a.ordem-b.ordem).filter(x=>x.idVencedor).map(x=>({id:x.idVencedor,nome:x.vencedor,origem:'Vencedor '+nomeFaseCurto_(fase)+' '+x.ordem,from:x.id}));if(!winners.length)return;
  if(fase==='SEMIFINAL'){
    if(winners.length===1){if(!listarMataMata_().some(x=>x.categoria===categoria&&x.fase==='FINAL'))criarConfronto_(categoria,'FINAL',1,winners[0],null,winners[0].origem,'BYE','Final decidida por avanço automático após ausência dupla no outro confronto.');return;}
    if(!listarMataMata_().some(x=>x.categoria===categoria&&x.fase==='FINAL')){const idFinal=criarConfronto_(categoria,'FINAL',1,winners[0],winners[1],winners[0].origem,winners[1].origem,'Final gerada automaticamente após as semifinais.');atual.forEach(x=>atualizarProximoConfronto_(x.id,idFinal));}
    const disputa=String(getConfig_('DISPUTA_TERCEIRO_LUGAR')||'TRUE').toUpperCase()!=='FALSE',losers=atual.filter(x=>x.idPerdedor).sort((a,b)=>a.ordem-b.ordem).map(x=>({id:x.idPerdedor,nome:x.perdedor,origem:'Perdedor Semifinal '+x.ordem,from:x.id}));if(disputa&&losers.length===2&&!listarMataMata_().some(x=>x.categoria===categoria&&x.fase==='TERCEIRO_LUGAR'))criarConfronto_(categoria,'TERCEIRO_LUGAR',1,losers[0],losers[1],losers[0].origem,losers[1].origem,'Disputa de terceiro lugar gerada automaticamente.');return;
  }
  const prox=fasePorQuantidade_(winners.length);if(listarMataMata_().some(x=>x.categoria===categoria&&x.fase===prox))return;for(let i=0;i<winners.length;i+=2){const a=winners[i],b=winners[i+1]||null,id=criarConfronto_(categoria,prox,(i/2)+1,a,b,a.origem,b?b.origem:'BYE','Fase seguinte gerada automaticamente.');atualizarProximoConfronto_(a.from,id);if(b)atualizarProximoConfronto_(b.from,id);}if(winners.length===1||winners.length%2===1)avancarMataMataSePronto_(categoria,prox,usuario);
}
function atualizarProximoConfronto_(id,proximo){const sh=getSheet_(SHEETS.MATA_MATA),h=getHeaders_(sh),idx=indexHeaders_(h),linha=localizarLinhaPorValor_(sh,idx.ID_CONFRONTO+1,id);if(linha!==-1)sh.getRange(linha,idx.PROXIMO_CONFRONTO+1).setValue(proximo||'')}
function nomeFaseCurto_(fase){return {QUARTAS_DE_FINAL:'Quartas',OITAVAS_DE_FINAL:'Oitavas',DEZESSEIS_AVOS:'16 avos',SEMIFINAL:'Semifinal'}[fase]||fase}
function existeFasePosteriorGerada_(categoria,fase){const ordem=ordemFase_(fase);return listarMataMata_().some(x=>x.categoria===categoria&&ordemFase_(x.fase)>ordem&&x.fase!=='TERCEIRO_LUGAR')}
function limparJogosMataMataCategoria_(categoria){const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();if(last<2)return;const vals=sh.getRange(2,1,last-1,h.length).getValues();for(let i=vals.length-1;i>=0;i--){if(String(vals[i][idx.CATEGORIA])===categoria&&String(vals[i][idx.FASE])!=='GRUPOS')sh.getRange(i+2,1,1,h.length).clearContent()}}

function listarGruposPublicos_(){const cats=categoriasPermitidas_(),out=[];cats.forEach(c=>{const linhas=obterLinhasGrupo_(c),gr={};linhas.forEach(x=>{if(!gr[x.nomeGrupo])gr[x.nomeGrupo]=[];gr[x.nomeGrupo].push({id:x.idParticipante,nome:x.nomeParticipante,cabecaDeChave:x.cabecaDeChave})});Object.keys(gr).sort().forEach(nome=>out.push({categoria:c,grupo:nome,participantes:gr[nome]}))});return out}
function letraGrupo_(i){let s='';i++;while(i>0){i--;s=String.fromCharCode(65+(i%26))+s;i=Math.floor(i/26)}return s}
function slugCategoria_(c){return c.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'').slice(0,6)}
function configKeyCategoria_(c){return String(c||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'')}
function getClassificadosPorGrupo_(categoria){const esp=Number(getConfig_('CLASSIFICADOS_POR_GRUPO_'+configKeyCategoria_(categoria))),geral=Number(getConfig_('CLASSIFICADOS_POR_GRUPO')||2);return Number.isInteger(esp)&&esp>0?esp:(Number.isInteger(geral)&&geral>0?geral:2)}
function obterLinhasGrupo_(categoria){const sh=getSheet_(SHEETS.GRUPOS),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();if(last<2)return [];return sh.getRange(2,1,last-1,h.length).getValues().filter(r=>String(r[idx.CATEGORIA])===categoria&&String(r[idx.ID_PARTICIPANTE]||'').trim()).map(r=>({idGrupo:r[idx.ID_GRUPO],categoria:r[idx.CATEGORIA],nomeGrupo:r[idx.NOME_GRUPO],ordem:Number(r[idx.ORDEM]),idParticipante:r[idx.ID_PARTICIPANTE],nomeParticipante:r[idx.NOME_PARTICIPANTE],posicaoSorteio:Number(r[idx.POSICAO_SORTEIO]||0),cabecaDeChave:r[idx.CABECA_DE_CHAVE]===true||String(r[idx.CABECA_DE_CHAVE]).toUpperCase()==='TRUE',status:String(r[idx.STATUS]||'')}))}
function limparLinhasPorCategoria_(aba,categoria,coluna){const sh=getSheet_(aba),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();if(last<2)return;const vals=sh.getRange(2,1,last-1,h.length).getValues();for(let i=vals.length-1;i>=0;i--)if(String(vals[i][idx[coluna]])===categoria)sh.getRange(i+2,1,1,h.length).clearContent()}

function listarParticipantesPublicos_(){return obterParticipantesValidos_().filter(p=>participanteAptoSorteio_(p)).map(p=>({id:p.id,nome:p.nome,turma:p.turma,categoria:p.categoriaValidada||p.categoriaEscolhida,status:p.statusInscricao}))}
function listarParticipantesAdmin_(){return obterParticipantesValidos_().filter(p=>p.ativo).map(p=>({id:p.id,dataInscricao:p.dataInscricao,nome:p.nome,turma:p.turma,modulo:p.modulo,email:p.email,categoriaEscolhida:p.categoriaEscolhida,categoriaValidada:p.categoriaValidada,statusRevisao:p.statusRevisao,statusInscricao:p.statusInscricao,cabecaDeChave:p.cabecaDeChave,ordemCabecaChave:p.ordemCabecaChave,ranking:p.ranking,tipoInscricao:p.tipoInscricao,valorInscricao:p.valorInscricao,statusPagamento:p.statusPagamento,formaPagamento:p.formaPagamento,dataConfirmacaoPagamento:p.dataConfirmacaoPagamento,operadorFinanceiro:p.operadorFinanceiro,aptoSorteio:participanteAptoSorteio_(p),observacoes:p.observacoes}))}
function obterParticipantesValidos_(){const sh=getSheet_(SHEETS.PARTICIPANTES),vals=sh.getRange(1,1,sh.getMaxRows(),sh.getLastColumn()).getValues(),idx=indexHeaders_(vals[0].map(String)),v=(r,k)=>idx[k]===undefined?'':r[idx[k]];return vals.slice(1).filter(r=>String(v(r,'ID_PARTICIPANTE')||'').trim()).map(r=>({id:v(r,'ID_PARTICIPANTE'),dataInscricao:v(r,'DATA_INSCRICAO'),nome:v(r,'NOME_COMPLETO'),turma:v(r,'TURMA'),modulo:v(r,'MODULO'),email:v(r,'EMAIL'),categoriaEscolhida:v(r,'CATEGORIA_ESCOLHIDA'),categoriaValidada:v(r,'CATEGORIA_VALIDADA'),statusRevisao:v(r,'STATUS_REVISAO_CATEGORIA'),statusInscricao:String(v(r,'STATUS_INSCRICAO')||'').toUpperCase(),cabecaDeChave:v(r,'CABECA_DE_CHAVE')===true||String(v(r,'CABECA_DE_CHAVE')).toUpperCase()==='TRUE',ordemCabecaChave:v(r,'ORDEM_CABECA_CHAVE'),ranking:v(r,'RANKING_ANTES_TORNEIO'),tipoInscricao:String(v(r,'TIPO_INSCRICAO')||'GRATUITA').toUpperCase(),valorInscricao:Number(v(r,'VALOR_INSCRICAO')||0),statusPagamento:String(v(r,'STATUS_PAGAMENTO')||'').toUpperCase(),formaPagamento:String(v(r,'FORMA_PAGAMENTO')||''),dataConfirmacaoPagamento:v(r,'DATA_CONFIRMACAO_PAGAMENTO'),operadorFinanceiro:String(v(r,'OPERADOR_FINANCEIRO')||''),observacoes:v(r,'OBSERVACOES'),ativo:v(r,'ATIVO')===true||String(v(r,'ATIVO')).toUpperCase()==='TRUE'}))}
function emailJaInscrito_(email){return obterParticipantesValidos_().some(p=>p.ativo&&normalizarEmail_(p.email)===email)}
function categoriasPermitidas_(){return [String(getConfig_('CATEGORIA_1')||'Mesatenistas').trim(),String(getConfig_('CATEGORIA_2')||'Recreativo').trim()].filter(Boolean)}

function listarOperadores_(){const sh=getSheet_(SHEETS.OPERADORES),vals=sh.getRange(1,1,Math.max(sh.getLastRow(),1),sh.getLastColumn()).getValues(),idx=indexHeaders_(vals[0].map(String));return vals.slice(1).filter(r=>String(r[idx.ID_OPERADOR]||'').trim()).map(r=>({id:r[idx.ID_OPERADOR],nome:r[idx.NOME],email:r[idx.EMAIL],nivel:r[idx.NIVEL_ACESSO],status:r[idx.STATUS],dataCadastro:r[idx.DATA_CADASTRO],ultimoLogin:r[idx.ULTIMO_LOGIN]}))}
function buscarOperadorPorEmail_(email){const sh=getSheet_(SHEETS.OPERADORES),h=getHeaders_(sh),idx=indexHeaders_(h),max=sh.getMaxRows();if(max<2)return null;const vals=sh.getRange(2,1,max-1,h.length).getValues();for(let i=0;i<vals.length;i++){const r=vals[i];if(normalizarEmail_(r[idx.EMAIL])===email&&String(r[idx.ID_OPERADOR]||'').trim())return {linha:i+2,id:r[idx.ID_OPERADOR],nome:r[idx.NOME],email:normalizarEmail_(r[idx.EMAIL]),nivel:String(r[idx.NIVEL_ACESSO]||'').toUpperCase(),status:String(r[idx.STATUS]||'').toUpperCase(),pinSalt:String(r[idx.PIN_SALT]||''),pinHash:String(r[idx.PIN_HASH]||'')}}return null}
function buscarOperadorPorId_(id){const sh=getSheet_(SHEETS.OPERADORES),h=getHeaders_(sh),idx=indexHeaders_(h),linha=localizarLinhaPorValor_(sh,idx.ID_OPERADOR+1,id);if(linha===-1)return null;const r=sh.getRange(linha,1,1,h.length).getValues()[0];return {linha,id:r[idx.ID_OPERADOR],nome:r[idx.NOME],email:normalizarEmail_(r[idx.EMAIL]),nivel:String(r[idx.NIVEL_ACESSO]||'').toUpperCase(),status:String(r[idx.STATUS]||'').toUpperCase()}}
function adminSalvarOperador_(d,usuario){const nome=limparTexto_(d.nome),email=normalizarEmail_(d.email),pin=String(d.pin||'').trim(),nivel=String(d.nivel||'OPERADOR').toUpperCase();if(!nome||!email||!pin)return {ok:false,erro:'CAMPOS_OBRIGATORIOS',mensagem:'Informe nome, e-mail e PIN.'};if(!emailValido_(email))return {ok:false,erro:'EMAIL_INVALIDO',mensagem:'Informe um e-mail válido.'};if(pin.length<6)return {ok:false,erro:'PIN_FRACO',mensagem:'O PIN deve ter pelo menos 6 caracteres.'};if(!['OPERADOR','FINANCEIRO','ADMINISTRADOR'].includes(nivel))return {ok:false,erro:'NIVEL_INVALIDO',mensagem:'Nível de acesso inválido.'};if(buscarOperadorPorEmail_(email))return {ok:false,erro:'OPERADOR_EXISTENTE',mensagem:'Já existe um operador com este e-mail.'};const salt=gerarSalt_(),id=gerarId_('OP');gravarObjetoPrimeiraLinhaLivre_(SHEETS.OPERADORES,'ID_OPERADOR',{ID_OPERADOR:id,NOME:nome,EMAIL:email,NIVEL_ACESSO:nivel,STATUS:'ATIVO',DATA_CADASTRO:new Date(),OBSERVACOES:'Operador cadastrado pelo painel administrativo.',PIN_SALT:salt,PIN_HASH:hashPin_(salt,pin),ULTIMO_LOGIN:''});registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'OPERADOR_CADASTRADO',entidade:'OPERADORES',idRegistro:id,valorAnterior:'',valorNovo:JSON.stringify({nome,email,nivel}),observacoes:'Novo operador cadastrado.'});return {ok:true,mensagem:'Operador cadastrado com sucesso.'}}
function adminStatusOperador_(d,usuario){const id=limparTexto_(d.idOperador),status=String(d.status||'').toUpperCase();if(!['ATIVO','INATIVO'].includes(status))return {ok:false,erro:'STATUS_INVALIDO',mensagem:'Status do operador inválido.'};const op=buscarOperadorPorId_(id);if(!op)return {ok:false,erro:'OPERADOR_NAO_ENCONTRADO',mensagem:'Operador não encontrado.'};if(op.email===usuario.email&&status==='INATIVO')return {ok:false,erro:'AUTO_DESATIVACAO',mensagem:'Você não pode desativar o próprio usuário.'};const sh=getSheet_(SHEETS.OPERADORES),idx=indexHeaders_(getHeaders_(sh)),ant=sh.getRange(op.linha,idx.STATUS+1).getValue();sh.getRange(op.linha,idx.STATUS+1).setValue(status);registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'STATUS_OPERADOR_ALTERADO',entidade:'OPERADORES',idRegistro:id,valorAnterior:ant,valorNovo:status,observacoes:'Status de operador alterado.'});return {ok:true,mensagem:'Status do operador atualizado com sucesso.'}}
function atualizarUltimoLogin_(linha){const sh=getSheet_(SHEETS.OPERADORES),idx=indexHeaders_(getHeaders_(sh));sh.getRange(linha,idx.ULTIMO_LOGIN+1).setValue(new Date())}

function registrarHistorico_(d){gravarObjetoPrimeiraLinhaLivre_(SHEETS.HISTORICO,'ID_EVENTO',{ID_EVENTO:gerarId_('H'),DATA_HORA:new Date(),USUARIO:d.usuario||'',PERFIL:d.perfil||'',ACAO:d.acao||'',ENTIDADE:d.entidade||'',ID_REGISTRO:d.idRegistro||'',VALOR_ANTERIOR:d.valorAnterior||'',VALOR_NOVO:d.valorNovo||'',OBSERVACOES:d.observacoes||''})}
function gravarObjetoPrimeiraLinhaLivre_(aba,colunaId,obj){const sh=getSheet_(aba),h=getHeaders_(sh),idIndex=h.indexOf(colunaId);if(idIndex===-1)throw new Error('Coluna não encontrada: '+colunaId);const linha=primeiraLinhaLivrePorColuna_(sh,idIndex+1,2),row=h.map(x=>Object.prototype.hasOwnProperty.call(obj,x)?obj[x]:'');sh.getRange(linha,1,1,row.length).setValues([row])}
function primeiraLinhaLivrePorColuna_(sh,coluna,inicio){inicio=inicio||2;const max=sh.getMaxRows(),vals=sh.getRange(inicio,coluna,max-inicio+1,1).getDisplayValues().flat();for(let i=0;i<vals.length;i++)if(String(vals[i]).trim()==='')return inicio+i;sh.insertRowAfter(sh.getMaxRows());return sh.getMaxRows()}
function localizarLinhaPorValor_(sh,coluna,valor){const max=sh.getMaxRows();if(max<2)return -1;const vals=sh.getRange(2,coluna,max-1,1).getDisplayValues().flat();for(let i=0;i<vals.length;i++)if(String(vals[i]).trim()===String(valor).trim())return i+2;return -1}
function getConfig_(campo){const sh=getSheet_(SHEETS.CONFIG),last=sh.getLastRow();if(last<2)return '';const vals=sh.getRange(2,1,last-1,2).getValues();for(let i=0;i<vals.length;i++)if(String(vals[i][0]).trim()===campo)return vals[i][1];return ''}
function setConfig_(campo,valor,descricao){const sh=getSheet_(SHEETS.CONFIG),last=Math.max(sh.getLastRow(),1),vals=last>=2?sh.getRange(2,1,last-1,1).getDisplayValues().flat():[];for(let i=0;i<vals.length;i++){if(String(vals[i]).trim()===campo){sh.getRange(i+2,2).setValue(valor);if(descricao)sh.getRange(i+2,3).setValue(descricao);return}}sh.appendRow([campo,valor,descricao||''])}
function getSheet_(nome){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(nome);if(!sh)throw new Error('Aba não encontrada: '+nome);return sh}
function getHeaders_(sh){return sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(x=>String(x).trim())}
function indexHeaders_(h){const idx={};h.forEach((x,i)=>idx[String(x).trim()]=i);return idx}
function gerarSalt_(){return Utilities.getUuid().replace(/-/g,'')}
function hashPin_(salt,pin){return hashTexto_(String(salt)+String(pin))}
function hashTexto_(texto){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(texto),Utilities.Charset.UTF_8).map(b=>('0'+((b<0?b+256:b).toString(16))).slice(-2)).join('')}
function parsePayload_(e){if(!e)return {};if(e.postData&&e.postData.contents&&String(e.postData.type||'').toLowerCase().includes('application/json'))return JSON.parse(e.postData.contents);return e.parameter||{}}
function limparTexto_(v){return String(v||'').trim().replace(/\s+/g,' ')}
function normalizarEmail_(v){return String(v||'').trim().toLowerCase()}
function emailValido_(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}
function gerarId_(prefixo){const d=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'America/Sao_Paulo','yyyyMMddHHmmss'),r=Math.floor(1000+Math.random()*9000);return prefixo+'-'+d+'-'+r}
function jsonResponse_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function erroJson_(err){const m=String(err&&err.message?err.message:err),p=m.split('|');if(p.length>1)return jsonResponse_({ok:false,erro:p.shift(),mensagem:p.join('|')});return jsonResponse_({ok:false,erro:'ERRO_INTERNO',mensagem:m})}

// ============================================================
// FIM: Code.gs
// ============================================================


// ============================================================
// INÍCIO: RECUPERACAO_PIN.gs
// ============================================================

const RECOVERY_TTL_SECONDS = 600;
const RECOVERY_RESEND_SECONDS = 60;
const RECOVERY_MAX_ATTEMPTS = 5;

function solicitarRecuperacaoPin_(p){
  const email=normalizarEmail_(p.email);
  const mensagemPadrao='Se o e-mail estiver cadastrado e ativo, enviaremos um código de recuperação válido por 10 minutos.';
  if(!email||!emailValido_(email))return {ok:true,mensagem:mensagemPadrao};
  const cache=CacheService.getScriptCache();
  const cooldown='tm_recovery_cooldown_'+hashTexto_(email).slice(0,32);
  if(cache.get(cooldown))return {ok:true,mensagem:mensagemPadrao};
  cache.put(cooldown,'1',RECOVERY_RESEND_SECONDS);
  const op=buscarOperadorPorEmail_(email);
  if(!op||op.status!=='ATIVO')return {ok:true,mensagem:mensagemPadrao};
  const codigo=String(Math.floor(100000+Math.random()*900000));
  const salt=gerarSalt_();
  const payload={hash:hashTexto_(salt+codigo),salt,attempts:0,id:op.id,email:op.email,nome:op.nome,expira:Date.now()+RECOVERY_TTL_SECONDS*1000};
  cache.put(recoveryKey_(email),JSON.stringify(payload),RECOVERY_TTL_SECONDS);
  MailApp.sendEmail({to:op.email,subject:'Código de recuperação – Torneio de Tênis de Mesa',htmlBody:'<div style="font-family:Arial,sans-serif"><h2>Recuperação de acesso</h2><p>Olá, '+escapeHtmlMail_(op.nome)+'.</p><p>Seu código de recuperação é:</p><div style="font-size:30px;font-weight:700;letter-spacing:6px">'+codigo+'</div><p>O código expira em 10 minutos e só pode ser usado uma vez.</p><p>Se você não solicitou esta recuperação, ignore esta mensagem.</p></div>'});
  registrarHistorico_({usuario:op.email,perfil:op.nivel,acao:'RECUPERACAO_PIN_SOLICITADA',entidade:'OPERADORES',idRegistro:op.id,valorAnterior:'',valorNovo:'CODIGO_ENVIADO',observacoes:'Código de recuperação enviado ao e-mail cadastrado.'});
  return {ok:true,mensagem:mensagemPadrao};
}

function redefinirPinRecuperacao_(p){
  const email=normalizarEmail_(p.email),codigo=String(p.codigo||'').trim(),novoPin=String(p.novoPin||'').trim();
  if(!email||!emailValido_(email)||!/^[0-9]{6}$/.test(codigo))return {ok:false,erro:'CODIGO_INVALIDO',mensagem:'Código inválido ou expirado. Solicite um novo código.'};
  if(novoPin.length<6)return {ok:false,erro:'PIN_FRACO',mensagem:'O novo PIN deve ter pelo menos 6 caracteres.'};
  const cache=CacheService.getScriptCache(),key=recoveryKey_(email),raw=cache.get(key);
  if(!raw)return {ok:false,erro:'CODIGO_EXPIRADO',mensagem:'Código inválido ou expirado. Solicite um novo código.'};
  let rec;try{rec=JSON.parse(raw)}catch(_){cache.remove(key);return {ok:false,erro:'CODIGO_EXPIRADO',mensagem:'Código inválido ou expirado. Solicite um novo código.'}}
  if(Date.now()>Number(rec.expira||0)){cache.remove(key);return {ok:false,erro:'CODIGO_EXPIRADO',mensagem:'Código expirado. Solicite um novo código.'};}
  rec.attempts=Number(rec.attempts||0)+1;
  if(rec.attempts>RECOVERY_MAX_ATTEMPTS){cache.remove(key);return {ok:false,erro:'TENTATIVAS_EXCEDIDAS',mensagem:'Muitas tentativas incorretas. Solicite um novo código.'};}
  if(hashTexto_(String(rec.salt)+codigo)!==String(rec.hash)){cache.put(key,JSON.stringify(rec),Math.max(1,Math.floor((Number(rec.expira)-Date.now())/1000)));return {ok:false,erro:'CODIGO_INVALIDO',mensagem:'Código inválido ou expirado.'};}
  const op=buscarOperadorPorEmail_(email);
  if(!op||op.status!=='ATIVO'){cache.remove(key);return {ok:false,erro:'CONTA_INDISPONIVEL',mensagem:'Não foi possível redefinir o PIN desta conta.'};}
  const sh=getSheet_(SHEETS.OPERADORES),idx=indexHeaders_(getHeaders_(sh)),salt=gerarSalt_();
  sh.getRange(op.linha,idx.PIN_SALT+1).setValue(salt);
  sh.getRange(op.linha,idx.PIN_HASH+1).setValue(hashPin_(salt,novoPin));
  cache.remove(key);cache.remove(loginFailKey_(email));
  registrarHistorico_({usuario:op.email,perfil:op.nivel,acao:'PIN_REDEFINIDO_POR_EMAIL',entidade:'OPERADORES',idRegistro:op.id,valorAnterior:'HASH_ANTERIOR',valorNovo:'HASH_ATUALIZADO',observacoes:'PIN redefinido mediante código enviado ao e-mail cadastrado.'});
  return {ok:true,mensagem:'PIN redefinido com sucesso. Você já pode entrar com o novo PIN.'};
}

function recoveryKey_(email){return 'tm_recovery_'+hashTexto_(normalizarEmail_(email)).slice(0,40)}
function escapeHtmlMail_(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

// ============================================================
// FIM: RECUPERACAO_PIN.gs
// ============================================================


// ============================================================
// INÍCIO: INSCRICOES_CRONOGRAMA.gs
// ============================================================

function obterEstadoInscricoesCronograma_(){
  const statusBase=String(getConfig_('STATUS_INSCRICOES')||'ENCERRADAS').toUpperCase();
  const automatico=String(getConfig_('ENCERRAMENTO_INSCRICOES_AUTOMATICO')||'TRUE').toUpperCase()!=='FALSE';
  const limiteRaw=normalizarDataHoraConfig_(getConfig_('DATA_HORA_ENCERRAMENTO_INSCRICOES'));
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
    dataSorteioGrupos:normalizarDataConfig_(getConfig_('DATA_SORTEIO_GRUPOS')),
    dataInicio:normalizarDataConfig_(getConfig_('DATA_INICIO')),
    dataFinalPrevista:normalizarDataConfig_(getConfig_('DATA_FINAL_PREVISTA')),
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
  SpreadsheetApp.flush();
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
  const m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s)(\d{2}):(\d{2})$/);if(!m)return null;
  const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]),Number(m[5]),0,0);
  return isNaN(d.getTime())?null:d;
}

function normalizarDataConfig_(v){
  if(v===null||v===undefined||v==='')return '';
  if(Object.prototype.toString.call(v)==='[object Date]'&&!isNaN(v.getTime()))return Utilities.formatDate(v,Session.getScriptTimeZone()||'America/Sao_Paulo','yyyy-MM-dd');
  const s=String(v).trim();if(!s||s.toUpperCase()==='A DEFINIR')return s;
  const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return m[1]+'-'+m[2]+'-'+m[3];
  const d=new Date(s);return isNaN(d.getTime())?s:Utilities.formatDate(d,Session.getScriptTimeZone()||'America/Sao_Paulo','yyyy-MM-dd');
}

function normalizarDataHoraConfig_(v){
  if(v===null||v===undefined||v==='')return '';
  if(Object.prototype.toString.call(v)==='[object Date]'&&!isNaN(v.getTime()))return Utilities.formatDate(v,Session.getScriptTimeZone()||'America/Sao_Paulo',"yyyy-MM-dd'T'HH:mm");
  const s=String(v).trim();if(!s)return '';
  const m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s)(\d{2}):(\d{2})/);if(m)return m[1]+'-'+m[2]+'-'+m[3]+'T'+m[4]+':'+m[5];
  const d=new Date(s);return isNaN(d.getTime())?s:Utilities.formatDate(d,Session.getScriptTimeZone()||'America/Sao_Paulo',"yyyy-MM-dd'T'HH:mm");
}

// ============================================================
// FIM: INSCRICOES_CRONOGRAMA.gs
// ============================================================


// ============================================================
// INÍCIO: FINANCEIRO.gs
// ============================================================

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

// ============================================================
// FIM: FINANCEIRO.gs
// ============================================================


// ============================================================
// INÍCIO: ARBITRAGEM_AGENDA.gs
// ============================================================

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

// ============================================================
// FIM: ARBITRAGEM_AGENDA.gs
// ============================================================


// ============================================================
// INÍCIO: CALENDARIO_REMARCACAO.gs
// ============================================================

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

// ============================================================
// FIM: CALENDARIO_REMARCACAO.gs
// ============================================================


// ============================================================
// INÍCIO: AGENDA_AUTOMATICA.gs
// ============================================================

function finalizarSorteio_(d,usuario){
  const categoria=limparTexto_(d.categoria),estado=obterEstadoSorteio_(categoria);
  if(estado.status!=='EM_SORTEIO')return {ok:false,erro:'SORTEIO_NAO_ABERTO',mensagem:'O sorteio desta categoria não está aberto.'};
  if(estado.naoSorteados.length)return {ok:false,erro:'PARTICIPANTES_PENDENTES',mensagem:'Ainda existem '+estado.naoSorteados.length+' participante(s) não sorteado(s).'};
  const sh=getSheet_(SHEETS.GRUPOS),idx=indexHeaders_(getHeaders_(sh)),max=sh.getMaxRows(),vals=sh.getRange(2,1,max-1,sh.getLastColumn()).getValues();
  for(let i=0;i<vals.length;i++){
    if(String(vals[i][idx.CATEGORIA])===categoria&&String(vals[i][idx.ID_PARTICIPANTE]||'').trim())sh.getRange(i+2,idx.STATUS+1).setValue('FINALIZADO');
  }
  gerarJogosDosGrupos_(categoria,usuario);
  recalcularClassificacaoCategoria_(categoria);
  const agenda=agendarJogosGruposAutomaticamente_(usuario);
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'SORTEIO_FINALIZADO',entidade:'GRUPOS',idRegistro:categoria,valorAnterior:'EM_SORTEIO',valorNovo:'FINALIZADO',observacoes:'Grupos bloqueados, confrontos gerados e agenda automática aplicada conforme calendário oficial.'});
  return {ok:true,agenda,mensagem:'Sorteio finalizado. Os confrontos foram gerados e as datas foram distribuídas automaticamente conforme o calendário oficial.'};
}

function agendarJogosGruposAutomaticamente_(usuario){
  const inicio=normalizarDataChave_(getConfig_('DATA_INICIO'));
  if(!inicio)return {ok:false,erro:'DATA_INICIO_AUSENTE',mensagem:'Defina a data de início do torneio no Planejamento antes de gerar a agenda.'};
  const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();
  if(last<2)return {ok:true,agendados:0,mensagem:'Nenhuma partida de grupos para agendar.'};
  const vals=sh.getRange(2,1,last-1,h.length).getDisplayValues();
  const jogos=[];
  vals.forEach((r,i)=>{
    if(String(r[idx.ID_JOGO]||'').trim()&&String(r[idx.FASE]||'').toUpperCase()==='GRUPOS'&&String(r[idx.STATUS]||'').toUpperCase()!=='FINALIZADO'){
      jogos.push({linha:i+2,id:r[idx.ID_JOGO],categoria:String(r[idx.CATEGORIA]||''),grupo:String(r[idx.GRUPO]||''),rodada:Number(r[idx.RODADA]||0)});
    }
  });
  const ordenar=(a,b)=>a.rodada-b.rodada||a.grupo.localeCompare(b.grupo,'pt-BR')||a.id.localeCompare(b.id);
  const rec=jogos.filter(j=>j.categoria==='Recreativo').sort(ordenar);
  const mes=jogos.filter(j=>j.categoria==='Mesatenistas').sort(ordenar);
  const bloqueadas=new Set(listarCalendario_().filter(x=>x.ativo&&String(x.status).toUpperCase()==='BLOQUEADO').map(x=>normalizarDataChave_(x.data)).filter(Boolean));
  let data=parseDataAgendaAutomatica_(inicio),ir=0,im=0,noites=0,agendados=0,seguranca=0;
  while((ir<rec.length||im<mes.length)&&seguranca<1000){
    seguranca++;
    if(ehDiaUtilAgenda_(data)){
      const chave=formatarDataAgenda_(data);
      if(!bloqueadas.has(chave)){
        let usados=0;
        if(ir<rec.length){gravarAgendaAutomaticaLinha_(sh,idx,rec[ir++].linha,chave,'Mesa 1');usados++;agendados++;}
        if(im<mes.length){gravarAgendaAutomaticaLinha_(sh,idx,mes[im++].linha,chave,'Mesa 2');usados++;agendados++;}
        if(usados)noites++;
      }
    }
    data.setDate(data.getDate()+1);
  }
  if(seguranca>=1000&& (ir<rec.length||im<mes.length))throw new Error('AGENDA_SEM_DATAS|Não foi possível encontrar datas úteis suficientes no calendário.');
  SpreadsheetApp.flush();
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'AGENDA_GRUPOS_GERADA',entidade:'JOGOS',idRegistro:'LOTE',valorAnterior:'',valorNovo:JSON.stringify({agendados,noites,recreativo:rec.length,mesatenistas:mes.length}),observacoes:'Agenda automática: segunda a sexta, até 2 partidas por noite, uma Recreativo na Mesa 1 e uma Mesatenistas na Mesa 2; datas bloqueadas ignoradas.'});
  return {ok:true,agendados,noites,mensagem:agendados+' partida(s) distribuída(s) em '+noites+' noite(s), respeitando dias úteis e bloqueios.'};
}

function gravarAgendaAutomaticaLinha_(sh,idx,linha,data,mesa){
  if(idx.DATA!==undefined)sh.getRange(linha,idx.DATA+1).setValue(data);
  if(idx.MESA!==undefined)sh.getRange(linha,idx.MESA+1).setValue(mesa);
  if(idx.STATUS_AGENDA!==undefined)sh.getRange(linha,idx.STATUS_AGENDA+1).setValue('AGENDADA');
}

function parseDataAgendaAutomatica_(s){
  const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)return new Date(NaN);
  return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0);
}
function formatarDataAgenda_(d){return Utilities.formatDate(d,Session.getScriptTimeZone()||'America/Sao_Paulo','yyyy-MM-dd');}
function ehDiaUtilAgenda_(d){const dia=d.getDay();return dia>=1&&dia<=5;}

// ============================================================
// FIM: AGENDA_AUTOMATICA.gs
// ============================================================


// ============================================================
// INÍCIO: CONFLITOS_BLOQUEIO.gs
// ============================================================

function listarConflitosAgenda_(){
  const jogos=lerJogosArbitragem_().filter(j=>j.data&&j.status!=='FINALIZADO'&&j.status!=='CANCELADA_PARA_REMARCACAO');
  const conflitos=[];
  const add=(tipo,severidade,jogosIds,mensagem,detalhes)=>conflitos.push({tipo,severidade,jogos:JogosUnicos_(jogosIds),mensagem,detalhes:detalhes||''});
  const porSlot={};
  jogos.forEach(j=>{
    const data=normalizarDataChave_(j.data),hor=String(j.horario||''),mesa=String(j.mesa||'').trim();
    const regra=validarDataDisponivel_(data,hor);
    if(!regra.ok)add('DATA_INVALIDA_OU_BLOQUEADA','ERRO',[j.id],regra.mensagem,{data,horario:hor,mesa});
    if(!hor)add('HORARIO_A_DEFINIR','AVISO',[j.id],'Partida sem horário definido.',{data,mesa});
    if(!mesa)add('MESA_A_DEFINIR','AVISO',[j.id],'Partida sem mesa definida.',{data,horario:hor});
    if(data&&hor&&mesa){
      const k=data+'|'+hor+'|'+mesa;(porSlot[k]||(porSlot[k]=[])).push(j);
    }
  });
  Object.keys(porSlot).forEach(k=>{const arr=porSlot[k];if(arr.length>1)add('MESA_DUPLICADA','ERRO',arr.map(x=>x.id),'Mais de uma partida foi marcada para a mesma mesa, data e horário.',{slot:k});});

  const participacoes={};
  jogos.forEach(j=>{
    const data=normalizarDataChave_(j.data),hor=String(j.horario||'');if(!data||!hor)return;
    [[j.idA,j.jogadorA],[j.idB,j.jogadorB]].forEach(([id,nome])=>{if(!id)return;const k=data+'|'+hor+'|'+id;(participacoes[k]||(participacoes[k]=[])).push({idJogo:j.id,nome});});
  });
  Object.keys(participacoes).forEach(k=>{const arr=participacoes[k];if(arr.length>1)add('ATLETA_DUPLA_ESCALA','ERRO',arr.map(x=>x.idJogo),'Atleta possui mais de uma partida no mesmo horário.',{slot:k,atleta:arr[0].nome});});

  const arbitragem={};
  jogos.forEach(j=>{
    const data=normalizarDataChave_(j.data),hor=String(j.horario||''),idArb=j.idArbitroReal||j.idArbitroEscalado,nome=j.arbitroReal||j.arbitroEscalado;if(!data||!hor||!idArb)return;
    const k=data+'|'+hor+'|'+idArb;(arbitragem[k]||(arbitragem[k]=[])).push({idJogo:j.id,nome});
  });
  Object.keys(arbitragem).forEach(k=>{const arr=arbitragem[k];if(arr.length>1)add('ARBITRO_DUPLA_ESCALA','ERRO',arr.map(x=>x.idJogo),'Árbitro escalado para mais de uma partida no mesmo horário.',{slot:k,arbitro:arr[0].nome});});

  const arbitros=listarArbitros_().filter(a=>a.status==='ATIVO'&&a.idParticipante);
  arbitros.forEach(a=>{
    const datasJogador=new Set(jogos.filter(j=>j.idA===a.idParticipante||j.idB===a.idParticipante).map(j=>normalizarDataChave_(j.data)));
    jogos.filter(j=>(j.idArbitroReal||j.idArbitroEscalado)===a.id&&datasJogador.has(normalizarDataChave_(j.data))).forEach(j=>add('ARBITRO_JOGA_NO_DIA','ERRO',[j.id],'Árbitro também possui partida como atleta nesta data.',{arbitro:a.nome,data:normalizarDataChave_(j.data)}));
  });

  return {ok:true,total:conflitos.length,erros:conflitos.filter(x=>x.severidade==='ERRO').length,avisos:conflitos.filter(x=>x.severidade==='AVISO').length,conflitos};
}

function JogosUnicos_(arr){return [...new Set((arr||[]).filter(Boolean))];}

function validarConflitoProposto_(idJogo,data,horario,mesa){
  const d=normalizarDataChave_(data),h=String(horario||''),m=String(mesa||'').trim();
  const jogos=lerJogosArbitragem_().filter(j=>j.id!==idJogo&&j.status!=='FINALIZADO'&&j.status!=='CANCELADA_PARA_REMARCACAO'&&normalizarDataChave_(j.data)===d);
  const atual=lerJogosArbitragem_().find(j=>j.id===idJogo);if(!atual)return {ok:false,erro:'JOGO_NAO_ENCONTRADO',mensagem:'Partida não encontrada.'};
  if(h&&m&&jogos.some(j=>String(j.horario||'')===h&&String(j.mesa||'').trim()===m))return {ok:false,erro:'CONFLITO_MESA',mensagem:'Já existe outra partida nesta mesa, data e horário.'};
  if(h){
    const ids=[atual.idA,atual.idB].filter(Boolean);
    const c=jogos.find(j=>String(j.horario||'')===h&&ids.some(id=>j.idA===id||j.idB===id));
    if(c)return {ok:false,erro:'CONFLITO_ATLETA',mensagem:'Um dos atletas já possui outra partida marcada neste horário.'};
  }
  return {ok:true};
}

function salvarAgendaJogoComConflitos_(p,usuario){
  const data=normalizarDataChave_(p.data),horario=limparTexto_(p.horario),mesa=limparTexto_(p.mesa),id=limparTexto_(p.idJogo);
  const vd=validarDataDisponivel_(data,horario);if(!vd.ok)return vd;
  const vc=validarConflitoProposto_(id,data,horario,mesa);if(!vc.ok)return vc;
  return salvarAgendaJogoSeguro_(p,usuario);
}

function bloquearDataEmMassa_(p,usuario){
  const data=normalizarDataChave_(p.data),tipo=String(p.tipoBloqueio||'OUTRO').toUpperCase(),descricao=limparTexto_(p.descricao),obs=limparTexto_(p.observacoes);
  if(!data)return {ok:false,erro:'DATA_OBRIGATORIA',mensagem:'Informe a data que será bloqueada.'};
  const jogos=lerJogosArbitragem_().filter(j=>normalizarDataChave_(j.data)===data&&j.status!=='FINALIZADO'&&j.status!=='CANCELADA_PARA_REMARCACAO');
  const motivo=descricao||tipo.replace(/_/g,' ');
  const rCal=salvarDataCalendario_({data,status:'BLOQUEADO',tipoBloqueio:tipo,descricao:motivo,observacoes:obs},usuario);if(!rCal.ok)return rCal;
  const cancelados=[],falhas=[];
  jogos.forEach(j=>{const r=cancelarPartidaForcaMaior_({idJogo:j.id,motivo:'Bloqueio da data '+data+': '+motivo},usuario);if(r.ok)cancelados.push(j.id);else falhas.push({id:j.id,erro:r.mensagem||r.erro});});
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'DATA_BLOQUEADA_EM_MASSA',entidade:'CALENDARIO',idRegistro:data,valorAnterior:'',valorNovo:JSON.stringify({tipo,motivo,cancelados}),observacoes:'Bloqueio de data com cancelamento em lote das partidas pendentes.'});
  return {ok:true,data,cancelados,falhas,mensagem:'Data bloqueada. '+cancelados.length+' partida(s) foram canceladas para remarcação'+(falhas.length?'; '+falhas.length+' não puderam ser alteradas.':'.')};
}

// ============================================================
// FIM: CONFLITOS_BLOQUEIO.gs
// ============================================================


// ============================================================
// INÍCIO: ENCERRAMENTO_TORNEIO.gs
// ============================================================

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
  const etapa=String(p.etapa||'PREPARAR').trim().toUpperCase();
  if(etapa==='CONFIRMAR')return confirmarArquivamentoLocalInterno_(p,usuario);
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

function confirmarArquivamentoLocalInterno_(p,usuario){
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
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'TORNEIO_ARQUIVADO_LOCAL',entidade:'TORNEIO',idRegistro:idArquivo,valorAnterior:'',valorNovo:pendente.nomeArquivo,observacoes:'Pacote ZIP gerado no navegador e confirmado pelo administrador.'});
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

// ============================================================
// FIM: ENCERRAMENTO_TORNEIO.gs
// ============================================================


// ============================================================
// INÍCIO: ENCERRAMENTO_EXTENSOES.gs
// ============================================================

function arquivarExtrasOperacionais_(ss,pasta){
  criarPdfAba_(ss,'ARBITROS',pasta,'08B_Arbitros_e_Escala.pdf');
  criarPdfAba_(ss,'CALENDARIO',pasta,'08C_Calendario_e_Bloqueios.pdf');
}

function fingerprintExtrasOperacionais_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  return ['ARBITROS','CALENDARIO'].map(nome=>{
    const sh=ss.getSheetByName(nome);if(!sh)return nome+':';
    const lr=sh.getLastRow(),lc=sh.getLastColumn();
    return nome+':'+(lr&&lc?JSON.stringify(sh.getRange(1,1,lr,lc).getDisplayValues()):'');
  }).join('\n');
}

function limparExtrasNovaEdicao_(){
  limparAbaMantendoCabecalho_('ARBITROS');
  limparAbaMantendoCabecalho_('CALENDARIO');
}

// ============================================================
// FIM: ENCERRAMENTO_EXTENSOES.gs
// ============================================================
