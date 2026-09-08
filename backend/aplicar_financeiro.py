from pathlib import Path

repo = Path('.')
code_path = repo / 'backend/Code.gs'
admin_path = repo / 'admin/index.html'

text = code_path.read_text(encoding='utf-8')

# Rotas financeiras.
get_anchor = "    if(a==='adminPlanejamento'){const s=exigirSessao_(e.parameter.token,'ADMINISTRADOR');return jsonResponse_(obterEstadoInscricoesCronograma_());}\n"
get_route = "    if(a==='financeiroEstado'){const s=exigirSessaoFinanceiro_(e.parameter.token);return jsonResponse_({...listarFinanceiro_(),usuario:s.usuario});}\n"
if get_route not in text:
    if get_anchor not in text:
        raise SystemExit('Âncora GET do planejamento não encontrada.')
    text = text.replace(get_anchor, get_anchor + get_route, 1)

post_anchor = "    if(a==='adminReabrirInscricoes'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(reabrirInscricoes_(p,s.usuario));}\n"
post_routes = (
    "    if(a==='financeiroConfirmarPagamento'){const s=exigirSessaoFinanceiro_(p.token);return jsonResponse_(confirmarPagamentoFinanceiro_(p,s.usuario));}\n"
    "    if(a==='financeiroLancamentoCaixa'){const s=exigirSessaoFinanceiro_(p.token);return jsonResponse_(registrarLancamentoCaixa_(p,s.usuario));}\n"
    "    if(a==='financeiroEstornarPagamento'){const s=exigirSessaoFinanceiro_(p.token);return jsonResponse_(estornarPagamentoFinanceiro_(p,s.usuario));}\n"
)
if "financeiroConfirmarPagamento" not in text:
    if post_anchor not in text:
        raise SystemExit('Âncora POST do planejamento não encontrada.')
    text = text.replace(post_anchor, post_anchor + post_routes, 1)

# Forma de pagamento escolhida pelo aluno passa a acompanhar a inscrição.
old_reg = "STATUS_PAGAMENTO:tipo==='GRATUITA'?'ISENTO':'PENDENTE',COMPROVANTE_URL:''"
new_reg = "STATUS_PAGAMENTO:tipo==='GRATUITA'?'ISENTO':'PENDENTE',FORMA_PAGAMENTO:tipo==='GRATUITA'?'NAO_APLICAVEL':String(d.formaPagamento||'').toUpperCase(),COMPROVANTE_URL:''"
if old_reg in text:
    text = text.replace(old_reg, new_reg, 1)

# Operador financeiro próprio.
old_nivel = "if(!['OPERADOR','ADMINISTRADOR'].includes(nivel))"
new_nivel = "if(!['OPERADOR','FINANCEIRO','ADMINISTRADOR'].includes(nivel))"
if old_nivel in text:
    text = text.replace(old_nivel, new_nivel, 1)

# Participantes: status financeiro visível no planejamento e aptidão calculada.
old_public = "function listarParticipantesPublicos_(){return obterParticipantesValidos_().filter(p=>p.ativo&&p.statusInscricao==='APROVADO').map(p=>({id:p.id,nome:p.nome,turma:p.turma,categoria:p.categoriaValidada||p.categoriaEscolhida,status:p.statusInscricao}))}"
new_public = "function listarParticipantesPublicos_(){return obterParticipantesValidos_().filter(p=>participanteAptoSorteio_(p)).map(p=>({id:p.id,nome:p.nome,turma:p.turma,categoria:p.categoriaValidada||p.categoriaEscolhida,status:p.statusInscricao}))}"
if old_public in text:
    text = text.replace(old_public, new_public, 1)

old_admin = "function listarParticipantesAdmin_(){return obterParticipantesValidos_().filter(p=>p.ativo).map(p=>({id:p.id,dataInscricao:p.dataInscricao,nome:p.nome,turma:p.turma,modulo:p.modulo,email:p.email,categoriaEscolhida:p.categoriaEscolhida,categoriaValidada:p.categoriaValidada,statusRevisao:p.statusRevisao,statusInscricao:p.statusInscricao,cabecaDeChave:p.cabecaDeChave,ordemCabecaChave:p.ordemCabecaChave,ranking:p.ranking,observacoes:p.observacoes}))}"
new_admin = "function listarParticipantesAdmin_(){return obterParticipantesValidos_().filter(p=>p.ativo).map(p=>({id:p.id,dataInscricao:p.dataInscricao,nome:p.nome,turma:p.turma,modulo:p.modulo,email:p.email,categoriaEscolhida:p.categoriaEscolhida,categoriaValidada:p.categoriaValidada,statusRevisao:p.statusRevisao,statusInscricao:p.statusInscricao,cabecaDeChave:p.cabecaDeChave,ordemCabecaChave:p.ordemCabecaChave,ranking:p.ranking,tipoInscricao:p.tipoInscricao,valorInscricao:p.valorInscricao,statusPagamento:p.statusPagamento,formaPagamento:p.formaPagamento,dataConfirmacaoPagamento:p.dataConfirmacaoPagamento,operadorFinanceiro:p.operadorFinanceiro,aptoSorteio:participanteAptoSorteio_(p),observacoes:p.observacoes}))}"
if old_admin in text:
    text = text.replace(old_admin, new_admin, 1)

old_obter = "function obterParticipantesValidos_(){const sh=getSheet_(SHEETS.PARTICIPANTES),vals=sh.getRange(1,1,sh.getMaxRows(),sh.getLastColumn()).getValues(),idx=indexHeaders_(vals[0].map(String));return vals.slice(1).filter(r=>String(r[idx.ID_PARTICIPANTE]||'').trim()).map(r=>({id:r[idx.ID_PARTICIPANTE],dataInscricao:r[idx.DATA_INSCRICAO],nome:r[idx.NOME_COMPLETO],turma:r[idx.TURMA],modulo:r[idx.MODULO],email:r[idx.EMAIL],categoriaEscolhida:r[idx.CATEGORIA_ESCOLHIDA],categoriaValidada:r[idx.CATEGORIA_VALIDADA],statusRevisao:r[idx.STATUS_REVISAO_CATEGORIA],statusInscricao:String(r[idx.STATUS_INSCRICAO]||'').toUpperCase(),cabecaDeChave:r[idx.CABECA_DE_CHAVE]===true||String(r[idx.CABECA_DE_CHAVE]).toUpperCase()==='TRUE',ordemCabecaChave:r[idx.ORDEM_CABECA_CHAVE],ranking:r[idx.RANKING_ANTES_TORNEIO],observacoes:r[idx.OBSERVACOES],ativo:r[idx.ATIVO]===true||String(r[idx.ATIVO]).toUpperCase()==='TRUE'}))}"
new_obter = "function obterParticipantesValidos_(){const sh=getSheet_(SHEETS.PARTICIPANTES),vals=sh.getRange(1,1,sh.getMaxRows(),sh.getLastColumn()).getValues(),idx=indexHeaders_(vals[0].map(String)),v=(r,k)=>idx[k]===undefined?'':r[idx[k]];return vals.slice(1).filter(r=>String(v(r,'ID_PARTICIPANTE')||'').trim()).map(r=>({id:v(r,'ID_PARTICIPANTE'),dataInscricao:v(r,'DATA_INSCRICAO'),nome:v(r,'NOME_COMPLETO'),turma:v(r,'TURMA'),modulo:v(r,'MODULO'),email:v(r,'EMAIL'),categoriaEscolhida:v(r,'CATEGORIA_ESCOLHIDA'),categoriaValidada:v(r,'CATEGORIA_VALIDADA'),statusRevisao:v(r,'STATUS_REVISAO_CATEGORIA'),statusInscricao:String(v(r,'STATUS_INSCRICAO')||'').toUpperCase(),cabecaDeChave:v(r,'CABECA_DE_CHAVE')===true||String(v(r,'CABECA_DE_CHAVE')).toUpperCase()==='TRUE',ordemCabecaChave:v(r,'ORDEM_CABECA_CHAVE'),ranking:v(r,'RANKING_ANTES_TORNEIO'),tipoInscricao:String(v(r,'TIPO_INSCRICAO')||'GRATUITA').toUpperCase(),valorInscricao:Number(v(r,'VALOR_INSCRICAO')||0),statusPagamento:String(v(r,'STATUS_PAGAMENTO')||'').toUpperCase(),formaPagamento:String(v(r,'FORMA_PAGAMENTO')||''),dataConfirmacaoPagamento:v(r,'DATA_CONFIRMACAO_PAGAMENTO'),operadorFinanceiro:String(v(r,'OPERADOR_FINANCEIRO')||''),observacoes:v(r,'OBSERVACOES'),ativo:v(r,'ATIVO')===true||String(v(r,'ATIVO')).toUpperCase()==='TRUE'}))}"
if old_obter in text:
    text = text.replace(old_obter, new_obter, 1)

# O sorteio deve considerar somente participante financeiramente regular quando a edição for paga.
text = text.replace("if(!p||!p.ativo||p.statusInscricao!=='APROVADO')return {ok:false,erro:'PARTICIPANTE_INVALIDO',mensagem:'O cabeça de chave deve ser um participante ativo e aprovado.'};", "if(!p||!participanteAptoSorteio_(p))return {ok:false,erro:'PARTICIPANTE_INVALIDO',mensagem:'O cabeça de chave deve ser participante ativo, aprovado e financeiramente regular.'};", 1)
text = text.replace("x.id!==id&&x.ativo&&x.statusInscricao==='APROVADO'&&(x.categoriaValidada||x.categoriaEscolhida)===cat", "x.id!==id&&participanteAptoSorteio_(x)&&(x.categoriaValidada||x.categoriaEscolhida)===cat", 1)
text = text.replace("const participantes=obterParticipantesValidos_().filter(p=>p.ativo&&p.statusInscricao==='APROVADO'&&(p.categoriaValidada||p.categoriaEscolhida)===categoria)", "const participantes=obterParticipantesValidos_().filter(p=>participanteAptoSorteio_(p)&&(p.categoriaValidada||p.categoriaEscolhida)===categoria)", 1)
text = text.replace("const ps=obterParticipantesValidos_().filter(p=>p.ativo&&p.statusInscricao==='APROVADO'&&(p.categoriaValidada||p.categoriaEscolhida)===categoria)", "const ps=obterParticipantesValidos_().filter(p=>participanteAptoSorteio_(p)&&(p.categoriaValidada||p.categoriaEscolhida)===categoria)", 1)

code_path.write_text(text, encoding='utf-8')

# Integração visual no painel administrativo.
admin = admin_path.read_text(encoding='utf-8')
if 'id="linkFinanceiro"' not in admin:
    admin = admin.replace('<a id="linkPlanejamento" class="link oculto" href="./planejamento.html">📆 Planejamento</a>', '<a id="linkPlanejamento" class="link oculto" href="./planejamento.html">📆 Planejamento</a><a id="linkFinanceiro" class="link oculto" href="./financeiro.html">💰 Financeiro</a>', 1)
admin = admin.replace("linkPlanejamento.classList.add('oculto');linkCalendario", "linkPlanejamento.classList.add('oculto');linkFinanceiro.classList.add('oculto');linkCalendario", 1)
old_open = "function abrirPainel(){loginView.classList.add('oculto');appView.classList.remove('oculto');btnSair.classList.remove('oculto');linkSorteio.classList.remove('oculto');linkPartidas.classList.remove('oculto');linkFases.classList.remove('oculto');usuarioTopo.textContent=(usuario?.nome||'')+' • '+(usuario?.nivel||'');const admin=usuario?.nivel==='ADMINISTRADOR';linkEncerramento.classList.toggle('oculto',!admin);linkPlanejamento.classList.toggle('oculto',!admin);linkCalendario.classList.toggle('oculto',!admin);linkArbitros.classList.toggle('oculto',!admin);secaoOperadores.classList.toggle('oculto',!admin);carregarParticipantes();if(admin)carregarOperadores()}"
new_open = "function abrirPainel(){if(usuario?.nivel==='FINANCEIRO'){location.href='./financeiro.html';return}loginView.classList.add('oculto');appView.classList.remove('oculto');btnSair.classList.remove('oculto');linkSorteio.classList.remove('oculto');linkPartidas.classList.remove('oculto');linkFases.classList.remove('oculto');usuarioTopo.textContent=(usuario?.nome||'')+' • '+(usuario?.nivel||'');const admin=usuario?.nivel==='ADMINISTRADOR';linkEncerramento.classList.toggle('oculto',!admin);linkPlanejamento.classList.toggle('oculto',!admin);linkFinanceiro.classList.toggle('oculto',!admin);linkCalendario.classList.toggle('oculto',!admin);linkArbitros.classList.toggle('oculto',!admin);secaoOperadores.classList.toggle('oculto',!admin);carregarParticipantes();if(admin)carregarOperadores()}"
if old_open in admin:
    admin = admin.replace(old_open, new_open, 1)
admin = admin.replace('<option value="OPERADOR">OPERADOR</option><option value="ADMINISTRADOR">ADMINISTRADOR</option>', '<option value="OPERADOR">OPERADOR</option><option value="FINANCEIRO">FINANCEIRO</option><option value="ADMINISTRADOR">ADMINISTRADOR</option>', 1)
admin = admin.replace('<th>Status</th><th>Ações</th>', '<th>Status</th><th>Pagamento</th><th>Apto sorteio</th><th>Ações</th>', 1)
admin = admin.replace("<td><span class=\"pill\">${esc(p.statusInscricao)}</span></td><td><div class=\"acao\">", "<td><span class=\"pill\">${esc(p.statusInscricao)}</span></td><td><span class=\"pill\">${esc(p.statusPagamento|| (p.tipoInscricao==='GRATUITA'?'ISENTO':'PENDENTE'))}</span>${p.valorInscricao?'<br><small>'+Number(p.valorInscricao).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+'</small>':''}</td><td><span class=\"pill\">${p.aptoSorteio?'SIM':'NÃO'}</span></td><td><div class=\"acao\">", 1)
admin = admin.replace("'<tr><td colspan=\"6\">Nenhum participante encontrado.</td></tr>'", "'<tr><td colspan=\"8\">Nenhum participante encontrado.</td></tr>'", 1)
admin = admin.replace('Versão do painel: 4.4 – planejamento, arbitragem, calendário e encerramento mestre', 'Versão do painel: 4.5 – planejamento, financeiro, arbitragem, calendário e encerramento mestre', 1)
admin_path.write_text(admin, encoding='utf-8')

print('Integração financeira aplicada com sucesso.')
