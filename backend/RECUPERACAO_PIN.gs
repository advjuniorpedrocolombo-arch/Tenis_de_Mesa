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
