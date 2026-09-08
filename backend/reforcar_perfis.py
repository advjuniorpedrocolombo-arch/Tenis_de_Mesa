from pathlib import Path

repo = Path('.')
code_path = repo / 'backend/Code.gs'
fin_path = repo / 'backend/FINANCEIRO.gs'
admin_dir = repo / 'admin'

# ============================================================
# 1) FIREWALL DE PERFIS NO BACKEND
# ============================================================
code = code_path.read_text(encoding='utf-8')

old_admin_sessao = "function adminSessao_(token){try{const s=exigirSessao_(token);return {ok:true,usuario:s.usuario,expiraEmSegundos:SESSION_TTL}}catch(_){return {ok:false,erro:'NAO_AUTORIZADO',mensagem:'Sessão inválida ou expirada.'}}}"
new_admin_sessao = "function adminSessao_(token){try{const s=exigirSessao_(token,'SESSAO_QUALQUER');return {ok:true,usuario:s.usuario,expiraEmSegundos:SESSION_TTL}}catch(_){return {ok:false,erro:'NAO_AUTORIZADO',mensagem:'Sessão inválida ou expirada.'}}}"
if old_admin_sessao in code:
    code = code.replace(old_admin_sessao, new_admin_sessao, 1)

old_exigir = "function exigirSessao_(token,nivel){token=String(token||'').trim();if(!token)throw authError_();const cache=CacheService.getScriptCache(),raw=cache.get(sessionKey_(token));if(!raw)throw authError_();const s=JSON.parse(raw),op=buscarOperadorPorEmail_(s.usuario.email);if(!op||op.status!=='ATIVO')throw authError_();if(nivel&&op.nivel!==nivel)throw new Error('ACESSO_NEGADO|Você não possui permissão para esta função.');s.usuario={id:op.id,nome:op.nome,email:op.email,nivel:op.nivel};cache.put(sessionKey_(token),JSON.stringify(s),SESSION_TTL);return s}"
new_exigir = "function exigirSessao_(token,nivel){token=String(token||'').trim();if(!token)throw authError_();const cache=CacheService.getScriptCache(),raw=cache.get(sessionKey_(token));if(!raw)throw authError_();const s=JSON.parse(raw),op=buscarOperadorPorEmail_(s.usuario.email);if(!op||op.status!=='ATIVO')throw authError_();const requerido=String(nivel||'').toUpperCase();if(requerido==='SESSAO_QUALQUER'){}else if(requerido==='FINANCEIRO_OU_ADMIN'){if(!['FINANCEIRO','ADMINISTRADOR'].includes(op.nivel))throw new Error('ACESSO_NEGADO|Acesso restrito ao financeiro ou administrador.');}else if(requerido){if(op.nivel!==requerido)throw new Error('ACESSO_NEGADO|Você não possui permissão para esta função.');}else if(op.nivel==='FINANCEIRO'){throw new Error('ACESSO_NEGADO|O perfil FINANCEIRO possui acesso somente ao módulo Financeiro.');}s.usuario={id:op.id,nome:op.nome,email:op.email,nivel:op.nivel};cache.put(sessionKey_(token),JSON.stringify(s),SESSION_TTL);return s}"
if old_exigir in code:
    code = code.replace(old_exigir, new_exigir, 1)
elif "FINANCEIRO_OU_ADMIN" not in code:
    raise SystemExit('Função exigirSessao_ não encontrada para reforço de perfis.')

code_path.write_text(code, encoding='utf-8')

# O módulo financeiro usa uma exceção explícita: FINANCEIRO ou ADMINISTRADOR.
fin = fin_path.read_text(encoding='utf-8')
fin = fin.replace("const s=exigirSessao_(token);\n  if(!['ADMINISTRADOR','FINANCEIRO'].includes(String(s.usuario.nivel||'').toUpperCase()))", "const s=exigirSessao_(token,'FINANCEIRO_OU_ADMIN');\n  if(!['ADMINISTRADOR','FINANCEIRO'].includes(String(s.usuario.nivel||'').toUpperCase()))", 1)
fin_path.write_text(fin, encoding='utf-8')

# ============================================================
# 2) GUARDA VISUAL NAS TELAS ADMINISTRATIVAS
# ============================================================
API = 'https://script.google.com/macros/s/AKfycbwYApgJFoSzBfLPuq40TjpVygwgzn6cEa7mEFioWG8SLN7owv2l_uSkvBLvNe2-16yzOg/exec'
marker = '<!-- GUARDA_PERFIL_FINANCEIRO -->'
guarda = f'''{marker}\n<script>(async()=>{{const t=sessionStorage.getItem('tm_admin_token')||'';if(!t)return;try{{const r=await fetch('{API}?action=adminSessao&token='+encodeURIComponent(t)+'&_='+Date.now(),{{cache:'no-store'}}),d=await r.json();if(d.ok&&String(d.usuario?.nivel||'').toUpperCase()==='FINANCEIRO'){{location.replace('./financeiro.html');}}}}catch(_e){{}}}})();</script>'''

for path in admin_dir.glob('*.html'):
    if path.name in {'index.html','financeiro.html'}:
        continue
    html = path.read_text(encoding='utf-8')
    if marker not in html:
        if '<body>' in html:
            html = html.replace('<body>', '<body>'+guarda, 1)
        elif '<body ' in html:
            pos = html.find('>', html.find('<body '))
            if pos != -1:
                html = html[:pos+1] + guarda + html[pos+1:]
        path.write_text(html, encoding='utf-8')

# ============================================================
# 3) NO FINANCEIRO, PERFIL FINANCEIRO NÃO VÊ LINKS ADMINISTRATIVOS
# ============================================================
financeiro_path = admin_dir / 'financeiro.html'
html = financeiro_path.read_text(encoding='utf-8')
html = html.replace('<a href="./index.html">Painel</a><a href="./planejamento.html">Planejamento</a>', '<a id="linkPainelAdmin" href="./index.html">Painel</a><a id="linkPlanejamentoAdmin" href="./planejamento.html">Planejamento</a>', 1)
old = "usuario.textContent=(s.usuario?.nome||'')+' • '+s.usuario.nivel;carregar()"
new = "usuario.textContent=(s.usuario?.nome||'')+' • '+s.usuario.nivel;const somenteFinanceiro=String(s.usuario?.nivel||'').toUpperCase()==='FINANCEIRO';if(document.getElementById('linkPainelAdmin'))document.getElementById('linkPainelAdmin').style.display=somenteFinanceiro?'none':'';if(document.getElementById('linkPlanejamentoAdmin'))document.getElementById('linkPlanejamentoAdmin').style.display=somenteFinanceiro?'none':'';carregar()"
if old in html:
    html = html.replace(old, new, 1)
financeiro_path.write_text(html, encoding='utf-8')

print('Firewall de perfis aplicado: FINANCEIRO limitado exclusivamente ao módulo financeiro.')
