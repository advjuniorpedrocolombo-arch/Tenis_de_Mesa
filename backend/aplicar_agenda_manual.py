from pathlib import Path

# Aplica de forma idempotente a rota administrativa e o botão para
# (re)gerar a agenda automática dos jogos já existentes.

code_path = Path('backend/Code.gs')
partidas_path = Path('admin/partidas.html')

code = code_path.read_text(encoding='utf-8')
route = "    if(a==='adminGerarAgendaAutomatica'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(agendarJogosGruposAutomaticamente_(s.usuario));}\n"
anchor = "    if(a==='adminBloquearDataEmMassa'){const s=exigirSessao_(p.token,'ADMINISTRADOR');return jsonResponse_(bloquearDataEmMassa_(p,s.usuario));}\n"
if "a==='adminGerarAgendaAutomatica'" not in code:
    if anchor not in code:
        raise SystemExit('Âncora da rota de agenda não encontrada em Code.gs')
    code = code.replace(anchor, anchor + route)
    code_path.write_text(code, encoding='utf-8')

html = partidas_path.read_text(encoding='utf-8')
old_toolbar = "<button class=\"btn escuro\" onclick=\"carregar()\">Atualizar</button></div>"
new_toolbar = "<button class=\"btn escuro\" onclick=\"carregar()\">Atualizar</button><button id=\"btnGerarAgenda\" class=\"btn verde\" onclick=\"gerarAgendaAutomatica()\">📅 Gerar / atualizar agenda automaticamente</button></div>"
if 'id="btnGerarAgenda"' not in html:
    if old_toolbar not in html:
        raise SystemExit('Âncora do botão não encontrada em partidas.html')
    html = html.replace(old_toolbar, new_toolbar, 1)

func_anchor = "async function carregar(silencioso=false){"
func = """async function gerarAgendaAutomatica(){
  if(usuario?.nivel!=='ADMINISTRADOR')return mostrarToast('Apenas o administrador pode recalcular a agenda.','erro',4500);
  if(!jogos.some(j=>j.fase==='GRUPOS'&&j.status!=='FINALIZADO'))return mostrarToast('Não há partidas de grupos pendentes para agendar.','info',4200);
  if(!confirm('Gerar/atualizar a agenda das partidas de grupos? O sistema redistribuirá os jogos pendentes a partir da data de início, de segunda a sexta, ignorando datas bloqueadas e mantendo no máximo 1 Recreativo + 1 Mesatenistas por noite.'))return;
  btnGerarAgenda.disabled=true;
  const texto=btnGerarAgenda.textContent;
  btnGerarAgenda.textContent='Gerando agenda...';
  msg.className='msg';msg.textContent='Gerando agenda automática e conferindo o calendário oficial...';
  mostrarToast('⏳ Gerando agenda automática...<small>Conferindo dias úteis, bloqueios e as duas categorias.</small>','info',15000);
  try{
    const d=await post({action:'adminGerarAgendaAutomatica',token});
    if(!d.ok)throw new Error(d.mensagem||d.erro);
    mostrarToast('✓ '+esc(d.mensagem||'Agenda atualizada com sucesso.'),'sucesso',5000);
    msg.className='msg sucesso';msg.textContent=d.mensagem||'Agenda atualizada com sucesso.';
    await carregar(true);
  }catch(e){
    msg.className='msg erro';msg.textContent=e.message;
    mostrarToast('✕ '+esc(e.message),'erro',6000);
  }finally{
    btnGerarAgenda.disabled=false;
    btnGerarAgenda.textContent=texto;
  }
}
"""
if 'async function gerarAgendaAutomatica()' not in html:
    if func_anchor not in html:
        raise SystemExit('Âncora da função não encontrada em partidas.html')
    html = html.replace(func_anchor, func + func_anchor, 1)

# O botão só fica disponível para o administrador.
render_anchor = "usuarioTopo.textContent=usuario.nome+' • '+usuario.nivel;carregar()"
render_repl = "usuarioTopo.textContent=usuario.nome+' • '+usuario.nivel;if(document.getElementById('btnGerarAgenda'))btnGerarAgenda.style.display=usuario.nivel==='ADMINISTRADOR'?'inline-block':'none';carregar()"
if render_repl not in html:
    if render_anchor not in html:
        raise SystemExit('Âncora de perfil não encontrada em partidas.html')
    html = html.replace(render_anchor, render_repl, 1)

partidas_path.write_text(html, encoding='utf-8')
print('Agenda manual aplicada em Code.gs e admin/partidas.html')
