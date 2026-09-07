const SPREADSHEET_ID='1Ur2A0wAGxjpfjShdWOuN_-qw7o1qB-AT3JaymrFANGY';
const SHEETS={CONFIG:'CONFIGURACOES',PARTICIPANTES:'PARTICIPANTES',OPERADORES:'OPERADORES',HISTORICO:'HISTORICO'};
const SESSION_TTL=21600;
const MAX_LOGIN_FAILS=5;
const LOGIN_BLOCK_SECONDS=900;

function doGet(e){
  try{
    const a=String((e&&e.parameter&&e.parameter.action)||'status').trim();
    if(a==='status')return jsonResponse_({ok:true,sistema:'Sistema de Torneio de Tênis de Mesa – Etec',torneio:getConfig_('NOME_TORNEIO'),statusInscricoes:getConfig_('STATUS_INSCRICOES'),tipoInscricao:getConfig_('TIPO_INSCRICAO'),valorInscricao:Number(getConfig_('VALOR_INSCRICAO')||0),categorias:[getConfig_('CATEGORIA_1'),getConfig_('CATEGORIA_2')].filter(Boolean)});
    if(a==='participantesPublicos')return jsonResponse_({ok:true,participantes:listarParticipantesPublicos_()});
    if(a==='adminSessao')return jsonResponse_(adminSessao_(e.parameter.token));
    if(a==='participantesAdmin'){const s=exigirSessao_(e.parameter.token);return jsonResponse_({ok:true,usuario:s.usuario,participantes:listarParticipantesAdmin_()});}
    if(a==='adminOperadores'){const s=exigirSessao_(e.parameter.token,'ADMINISTRADOR');return jsonResponse_({ok:true,usuario:s.usuario,operadores:listarOperadores_()});}
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
    if(a==='adminAtualizarParticipante'){const s=exigirSessao_(p.token);return jsonResponse_(adminAtualizarParticipante_(p,s.usuario));}
    if(a==='adminSalvarOperador'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(adminSalvarOperador_(p,s.usuario));}
    if(a==='adminStatusOperador'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(adminStatusOperador_(p,s.usuario));}
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
  cache.remove(k);
  const token=gerarToken_(),usuario={id:op.id,nome:op.nome,email:op.email,nivel:op.nivel};
  cache.put(sessionKey_(token),JSON.stringify({usuario}),SESSION_TTL);
  atualizarUltimoLogin_(op.linha);
  registrarHistorico_({usuario:op.email,perfil:op.nivel,acao:'LOGIN_ADMIN',entidade:'OPERADORES',idRegistro:op.id,valorAnterior:'',valorNovo:'LOGIN',observacoes:'Login no painel administrativo.'});
  return {ok:true,token,usuario,expiraEmSegundos:SESSION_TTL};
}

function adminSessao_(token){
  try{const s=exigirSessao_(token);return {ok:true,usuario:s.usuario,expiraEmSegundos:SESSION_TTL};}
  catch(err){return {ok:false,erro:'NAO_AUTORIZADO',mensagem:'Sessão inválida ou expirada.'};}
}

function adminLogout_(token){
  if(token)CacheService.getScriptCache().remove(sessionKey_(token));
  return {ok:true,mensagem:'Sessão encerrada.'};
}

function exigirSessao_(token,nivelObrigatorio){
  token=String(token||'').trim();
  if(!token)throw authError_();
  const cache=CacheService.getScriptCache(),raw=cache.get(sessionKey_(token));
  if(!raw)throw authError_();
  const sessao=JSON.parse(raw),op=buscarOperadorPorEmail_(sessao.usuario.email);
  if(!op||op.status!=='ATIVO')throw authError_();
  if(nivelObrigatorio&&op.nivel!==nivelObrigatorio)throw new Error('ACESSO_NEGADO|Você não possui permissão para esta função.');
  sessao.usuario={id:op.id,nome:op.nome,email:op.email,nivel:op.nivel};
  cache.put(sessionKey_(token),JSON.stringify(sessao),SESSION_TTL);
  return sessao;
}

function authError_(){return new Error('NAO_AUTORIZADO|Sessão inválida ou expirada.');}
function sessionKey_(token){return 'tm_session_'+token;}
function loginFailKey_(email){return 'tm_fail_'+hashTexto_(email).slice(0,32);}
function gerarToken_(){return Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');}

function registrarInscricao_(d){
  if(String(getConfig_('STATUS_INSCRICOES')||'').toUpperCase()!=='ABERTAS')return {ok:false,erro:'INSCRICOES_ENCERRADAS',mensagem:'As inscrições não estão abertas neste momento.'};
  const nome=limparTexto_(d.nomeCompleto||d.nome),turma=limparTexto_(d.turma),modulo=limparTexto_(d.modulo),email=normalizarEmail_(d.email),categoria=limparTexto_(d.categoria);
  if(!nome||!turma||!email||!categoria)return {ok:false,erro:'CAMPOS_OBRIGATORIOS',mensagem:'Preencha nome, turma, e-mail e categoria.'};
  if(!emailValido_(email))return {ok:false,erro:'EMAIL_INVALIDO',mensagem:'Informe um e-mail válido.'};
  const cats=[String(getConfig_('CATEGORIA_1')||'').trim(),String(getConfig_('CATEGORIA_2')||'').trim()].filter(Boolean);
  if(!cats.includes(categoria))return {ok:false,erro:'CATEGORIA_INVALIDA',mensagem:'Selecione uma categoria válida.'};
  if(emailJaInscrito_(email))return {ok:false,erro:'EMAIL_JA_INSCRITO',mensagem:'Já existe uma inscrição vinculada a este e-mail.'};
  const tipo=String(getConfig_('TIPO_INSCRICAO')||'GRATUITA').toUpperCase(),valor=Number(getConfig_('VALOR_INSCRICAO')||0),id=gerarId_('P');
  const reg={ID_PARTICIPANTE:id,DATA_INSCRICAO:new Date(),NOME_COMPLETO:nome,TURMA:turma,MODULO:modulo,EMAIL:email,CATEGORIA_ESCOLHIDA:categoria,CATEGORIA_VALIDADA:'',STATUS_REVISAO_CATEGORIA:'PENDENTE',STATUS_INSCRICAO:'PENDENTE_REVISAO',CABECA_DE_CHAVE:false,ORDEM_CABECA_CHAVE:'',RANKING_ANTES_TORNEIO:'',TIPO_INSCRICAO:tipo,VALOR_INSCRICAO:valor,STATUS_PAGAMENTO:tipo==='GRATUITA'?'ISENTO':'PENDENTE',COMPROVANTE_URL:'',OBSERVACOES:limparTexto_(d.observacoes),ATIVO:true};
  gravarObjetoPrimeiraLinhaLivre_(SHEETS.PARTICIPANTES,'ID_PARTICIPANTE',reg);
  registrarHistorico_({usuario:email,perfil:'PARTICIPANTE',acao:'INSCRICAO_REALIZADA',entidade:'PARTICIPANTES',idRegistro:id,valorAnterior:'',valorNovo:JSON.stringify({nome,turma,categoriaEscolhida:categoria}),observacoes:'Inscrição realizada pelo formulário público.'});
  return {ok:true,idParticipante:id,status:'PENDENTE_REVISAO',categoriaEscolhida:categoria,mensagem:'Inscrição recebida com sucesso. A categoria será revisada pela organização.'};
}

function adminAtualizarParticipante_(d,usuario){
  const id=limparTexto_(d.idParticipante),cat=limparTexto_(d.categoriaValidada),st=limparTexto_(d.statusInscricao).toUpperCase();
  if(!id)return {ok:false,erro:'ID_OBRIGATORIO',mensagem:'Participante não informado.'};
  const cats=[String(getConfig_('CATEGORIA_1')||'Mesatenistas').trim(),String(getConfig_('CATEGORIA_2')||'Recreativo').trim()];
  if(!cats.includes(cat))return {ok:false,erro:'CATEGORIA_INVALIDA',mensagem:'Categoria inválida.'};
  if(!['APROVADO','PENDENTE_REVISAO','CANCELADO'].includes(st))return {ok:false,erro:'STATUS_INVALIDO',mensagem:'Status inválido.'};
  const sh=getSheet_(SHEETS.PARTICIPANTES),headers=getHeaders_(sh),idx=indexHeaders_(headers),linha=localizarLinhaPorValor_(sh,idx.ID_PARTICIPANTE+1,id);
  if(linha===-1)return {ok:false,erro:'PARTICIPANTE_NAO_ENCONTRADO',mensagem:'Participante não encontrado.'};
  const anterior={categoria:sh.getRange(linha,idx.CATEGORIA_VALIDADA+1).getValue(),status:sh.getRange(linha,idx.STATUS_INSCRICAO+1).getValue()};
  sh.getRange(linha,idx.CATEGORIA_VALIDADA+1).setValue(cat);sh.getRange(linha,idx.STATUS_INSCRICAO+1).setValue(st);sh.getRange(linha,idx.STATUS_REVISAO_CATEGORIA+1).setValue(st==='PENDENTE_REVISAO'?'PENDENTE':'REVISADO');
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'PARTICIPANTE_ATUALIZADO',entidade:'PARTICIPANTES',idRegistro:id,valorAnterior:JSON.stringify(anterior),valorNovo:JSON.stringify({categoria:cat,status:st}),observacoes:'Atualização pelo painel administrativo.'});
  return {ok:true,idParticipante:id,categoriaValidada:cat,statusInscricao:st,mensagem:'Participante atualizado com sucesso.'};
}

function listarParticipantesPublicos_(){return obterParticipantesValidos_().filter(p=>p.ativo&&p.statusInscricao==='APROVADO').map(p=>({id:p.id,nome:p.nome,turma:p.turma,categoria:p.categoriaValidada||p.categoriaEscolhida,status:p.statusInscricao}));}
function listarParticipantesAdmin_(){return obterParticipantesValidos_().filter(p=>p.ativo).map(p=>({id:p.id,dataInscricao:p.dataInscricao,nome:p.nome,turma:p.turma,modulo:p.modulo,email:p.email,categoriaEscolhida:p.categoriaEscolhida,categoriaValidada:p.categoriaValidada,statusRevisao:p.statusRevisao,statusInscricao:p.statusInscricao,cabecaDeChave:p.cabecaDeChave,ordemCabecaChave:p.ordemCabecaChave,ranking:p.ranking,observacoes:p.observacoes}));}
function obterParticipantesValidos_(){
  const sh=getSheet_(SHEETS.PARTICIPANTES),vals=sh.getRange(1,1,sh.getMaxRows(),sh.getLastColumn()).getValues(),idx=indexHeaders_(vals[0].map(String));
  return vals.slice(1).filter(r=>String(r[idx.ID_PARTICIPANTE]||'').trim()).map(r=>({id:r[idx.ID_PARTICIPANTE],dataInscricao:r[idx.DATA_INSCRICAO],nome:r[idx.NOME_COMPLETO],turma:r[idx.TURMA],modulo:r[idx.MODULO],email:r[idx.EMAIL],categoriaEscolhida:r[idx.CATEGORIA_ESCOLHIDA],categoriaValidada:r[idx.CATEGORIA_VALIDADA],statusRevisao:r[idx.STATUS_REVISAO_CATEGORIA],statusInscricao:String(r[idx.STATUS_INSCRICAO]||'').toUpperCase(),cabecaDeChave:r[idx.CABECA_DE_CHAVE],ordemCabecaChave:r[idx.ORDEM_CABECA_CHAVE],ranking:r[idx.RANKING_ANTES_TORNEIO],observacoes:r[idx.OBSERVACOES],ativo:r[idx.ATIVO]===true||String(r[idx.ATIVO]).toUpperCase()==='TRUE'}));
}
function emailJaInscrito_(email){return obterParticipantesValidos_().some(p=>p.ativo&&normalizarEmail_(p.email)===email);}

function listarOperadores_(){
  const sh=getSheet_(SHEETS.OPERADORES),vals=sh.getRange(1,1,Math.max(sh.getLastRow(),1),sh.getLastColumn()).getValues(),idx=indexHeaders_(vals[0].map(String));
  return vals.slice(1).filter(r=>String(r[idx.ID_OPERADOR]||'').trim()).map(r=>({id:r[idx.ID_OPERADOR],nome:r[idx.NOME],email:r[idx.EMAIL],nivel:r[idx.NIVEL_ACESSO],status:r[idx.STATUS],dataCadastro:r[idx.DATA_CADASTRO],ultimoLogin:r[idx.ULTIMO_LOGIN]}));
}
function buscarOperadorPorEmail_(email){
  const sh=getSheet_(SHEETS.OPERADORES),headers=getHeaders_(sh),idx=indexHeaders_(headers),max=sh.getMaxRows();if(max<2)return null;
  const vals=sh.getRange(2,1,max-1,headers.length).getValues();
  for(let i=0;i<vals.length;i++){const r=vals[i];if(normalizarEmail_(r[idx.EMAIL])===email&&String(r[idx.ID_OPERADOR]||'').trim())return {linha:i+2,id:r[idx.ID_OPERADOR],nome:r[idx.NOME],email:normalizarEmail_(r[idx.EMAIL]),nivel:String(r[idx.NIVEL_ACESSO]||'').toUpperCase(),status:String(r[idx.STATUS]||'').toUpperCase(),pinSalt:String(r[idx.PIN_SALT]||''),pinHash:String(r[idx.PIN_HASH]||'')};}
  return null;
}
function buscarOperadorPorId_(id){const sh=getSheet_(SHEETS.OPERADORES),headers=getHeaders_(sh),idx=indexHeaders_(headers),linha=localizarLinhaPorValor_(sh,idx.ID_OPERADOR+1,id);if(linha===-1)return null;const r=sh.getRange(linha,1,1,headers.length).getValues()[0];return {linha,id:r[idx.ID_OPERADOR],nome:r[idx.NOME],email:normalizarEmail_(r[idx.EMAIL]),nivel:String(r[idx.NIVEL_ACESSO]||'').toUpperCase(),status:String(r[idx.STATUS]||'').toUpperCase()};}

function adminSalvarOperador_(d,usuario){
  const nome=limparTexto_(d.nome),email=normalizarEmail_(d.email),pin=String(d.pin||'').trim(),nivel=String(d.nivel||'OPERADOR').toUpperCase();
  if(!nome||!email||!pin)return {ok:false,erro:'CAMPOS_OBRIGATORIOS',mensagem:'Informe nome, e-mail e PIN.'};
  if(!emailValido_(email))return {ok:false,erro:'EMAIL_INVALIDO',mensagem:'Informe um e-mail válido.'};
  if(pin.length<6)return {ok:false,erro:'PIN_FRACO',mensagem:'O PIN deve ter pelo menos 6 caracteres.'};
  if(!['OPERADOR','ADMINISTRADOR'].includes(nivel))return {ok:false,erro:'NIVEL_INVALIDO',mensagem:'Nível de acesso inválido.'};
  if(buscarOperadorPorEmail_(email))return {ok:false,erro:'OPERADOR_EXISTENTE',mensagem:'Já existe um operador com este e-mail.'};
  const salt=Utilities.getUuid().replace(/-/g,''),id=gerarId_('OP');
  gravarObjetoPrimeiraLinhaLivre_(SHEETS.OPERADORES,'ID_OPERADOR',{ID_OPERADOR:id,NOME:nome,EMAIL:email,NIVEL_ACESSO:nivel,STATUS:'ATIVO',DATA_CADASTRO:new Date(),OBSERVACOES:'Cadastrado pelo painel administrativo',PIN_SALT:salt,PIN_HASH:hashPin_(salt,pin),ULTIMO_LOGIN:''});
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'OPERADOR_CADASTRADO',entidade:'OPERADORES',idRegistro:id,valorAnterior:'',valorNovo:JSON.stringify({nome,email,nivel,status:'ATIVO'}),observacoes:'Novo operador cadastrado.'});
  return {ok:true,idOperador:id,mensagem:'Operador cadastrado com sucesso.'};
}
function adminStatusOperador_(d,usuario){
  const id=limparTexto_(d.idOperador),status=String(d.status||'').toUpperCase();if(!['ATIVO','INATIVO'].includes(status))return {ok:false,erro:'STATUS_INVALIDO',mensagem:'Status inválido.'};
  const op=buscarOperadorPorId_(id);if(!op)return {ok:false,erro:'OPERADOR_NAO_ENCONTRADO',mensagem:'Operador não encontrado.'};
  if(op.email===usuario.email&&status==='INATIVO')return {ok:false,erro:'AUTO_DESATIVACAO',mensagem:'Você não pode desativar seu próprio acesso.'};
  const sh=getSheet_(SHEETS.OPERADORES),idx=indexHeaders_(getHeaders_(sh));sh.getRange(op.linha,idx.STATUS+1).setValue(status);
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'STATUS_OPERADOR_ALTERADO',entidade:'OPERADORES',idRegistro:id,valorAnterior:op.status,valorNovo:status,observacoes:'Status de operador alterado.'});
  return {ok:true,mensagem:'Status do operador atualizado.'};
}
function atualizarUltimoLogin_(linha){const sh=getSheet_(SHEETS.OPERADORES),idx=indexHeaders_(getHeaders_(sh));if(idx.ULTIMO_LOGIN!==undefined)sh.getRange(linha,idx.ULTIMO_LOGIN+1).setValue(new Date());}

function hashPin_(salt,pin){return hashTexto_(String(salt||'')+String(pin||''));}
function hashTexto_(txt){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(txt),Utilities.Charset.UTF_8).map(b=>('0'+((b<0?b+256:b).toString(16))).slice(-2)).join('');}

function registrarHistorico_(d){gravarObjetoPrimeiraLinhaLivre_(SHEETS.HISTORICO,'ID_EVENTO',{ID_EVENTO:gerarId_('H'),DATA_HORA:new Date(),USUARIO:d.usuario||'',PERFIL:d.perfil||'',ACAO:d.acao||'',ENTIDADE:d.entidade||'',ID_REGISTRO:d.idRegistro||'',VALOR_ANTERIOR:d.valorAnterior||'',VALOR_NOVO:d.valorNovo||'',OBSERVACOES:d.observacoes||''});}
function gravarObjetoPrimeiraLinhaLivre_(nomeAba,campoId,obj){const sh=getSheet_(nomeAba),headers=getHeaders_(sh),col=headers.indexOf(campoId)+1;if(!col)throw new Error('Coluna não encontrada: '+campoId);const linha=primeiraLinhaLivrePorColuna_(sh,col,2),row=headers.map(h=>Object.prototype.hasOwnProperty.call(obj,h)?obj[h]:'');sh.getRange(linha,1,1,row.length).setValues([row]);}
function primeiraLinhaLivrePorColuna_(sh,col,inicio){const qtd=sh.getMaxRows()-inicio+1,vals=sh.getRange(inicio,col,qtd,1).getDisplayValues().flat();for(let i=0;i<vals.length;i++)if(String(vals[i]).trim()==='')return inicio+i;sh.insertRowAfter(sh.getMaxRows());return sh.getMaxRows();}
function localizarLinhaPorValor_(sh,col,valor){const max=sh.getMaxRows();if(max<2)return -1;const vals=sh.getRange(2,col,max-1,1).getDisplayValues().flat();for(let i=0;i<vals.length;i++)if(String(vals[i]).trim()===String(valor).trim())return i+2;return -1;}
function getHeaders_(sh){return sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);}
function indexHeaders_(headers){const o={};headers.forEach((h,i)=>o[h]=i);return o;}
function getConfig_(campo){const sh=getSheet_(SHEETS.CONFIG),last=sh.getLastRow();if(last<2)return '';const vals=sh.getRange(2,1,last-1,2).getValues();for(const r of vals)if(String(r[0]).trim()===campo)return r[1];return '';}
function getSheet_(nome){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(nome);if(!sh)throw new Error('Aba não encontrada: '+nome);return sh;}
function parsePayload_(e){if(!e)return {};if(e.postData&&e.postData.contents&&String(e.postData.type||'').toLowerCase().includes('application/json'))return JSON.parse(e.postData.contents);return e.parameter||{};}
function gerarId_(prefixo){const stamp=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'America/Sao_Paulo','yyyyMMddHHmmss'),rnd=Math.floor(1000+Math.random()*9000);return prefixo+'-'+stamp+'-'+rnd;}
function normalizarEmail_(v){return String(v||'').trim().toLowerCase();}
function emailValido_(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}
function limparTexto_(v){return String(v||'').trim().replace(/\s+/g,' ');}
function jsonResponse_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function erroJson_(err){const s=String(err&&err.message||err),p=s.split('|');if(p[0]==='NAO_AUTORIZADO')return jsonResponse_({ok:false,erro:'NAO_AUTORIZADO',mensagem:p.slice(1).join('|')||'Sessão inválida ou expirada.'});if(p[0]==='ACESSO_NEGADO')return jsonResponse_({ok:false,erro:'ACESSO_NEGADO',mensagem:p.slice(1).join('|')||'Acesso negado.'});return jsonResponse_({ok:false,erro:'ERRO_INTERNO',mensagem:s});}

function configurarProjeto(){SpreadsheetApp.openById(SPREADSHEET_ID).setSpreadsheetTimeZone('America/Sao_Paulo');Logger.log('Projeto configurado.');}
