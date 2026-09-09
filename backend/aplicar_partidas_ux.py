from pathlib import Path

p = Path('admin/partidas.html')
text = p.read_text(encoding='utf-8')

# Marcador para tornar a aplicação idempotente.
if 'PARTIDAS_UX_RECOLHER_FASES_V1' in text:
    print('A melhoria de UX das partidas já está aplicada.')
    raise SystemExit(0)

# 1) CSS: botão de recolher/expandir e conteúdo da fase.
css_old = ".fase-titulo{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;padding:10px 12px;border-radius:11px;background:#111827;color:#fff;font-size:17px}.fase-titulo small{font-size:11px;color:#cbd5e1}"
css_new = ".fase-titulo{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;padding:10px 12px;border-radius:11px;background:#111827;color:#fff;font-size:17px}.fase-titulo small{font-size:11px;color:#cbd5e1}.fase-acoes{display:flex;align-items:center;gap:9px}.fase-toggle{border:1px solid #64748b;background:#1f2937;color:#fff;border-radius:8px;padding:6px 9px;font-size:12px;font-weight:800;cursor:pointer}.fase-toggle:hover{background:#334155}.fase-conteudo.oculto-fase{display:none}"
if css_old not in text:
    raise SystemExit('Bloco CSS esperado da fase não foi encontrado. Nenhuma alteração foi aplicada.')
text = text.replace(css_old, css_new, 1)

# 2) Estado local das fases recolhidas.
vars_old = "const API_URL='https://script.google.com/macros/s/AKfycbwYApgJFoSzBfLPuq40TjpVygwgzn6cEa7mEFioWG8SLN7owv2l_uSkvBLvNe2-16yzOg/exec';let token=sessionStorage.getItem('tm_admin_token')||'',usuario=null,jogos=[],classif=[],fases=[],mata=[],atual=null,salvando=false,toastTimer=null;"
vars_new = "const API_URL='https://script.google.com/macros/s/AKfycbwYApgJFoSzBfLPuq40TjpVygwgzn6cEa7mEFioWG8SLN7owv2l_uSkvBLvNe2-16yzOg/exec';let token=sessionStorage.getItem('tm_admin_token')||'',usuario=null,jogos=[],classif=[],fases=[],mata=[],atual=null,salvando=false,toastTimer=null;const PARTIDAS_UX_RECOLHER_FASES_V1=true;let fasesRecolhidas=new Set(JSON.parse(sessionStorage.getItem('tm_fases_recolhidas')||'[]'));"
if vars_old not in text:
    raise SystemExit('Linha de estado JavaScript esperada não foi encontrada. Nenhuma alteração foi aplicada.')
text = text.replace(vars_old, vars_new, 1)

# 3) Render por fases com botão de recolher/expandir.
render_old = '''function renderPartidasPorFase(lista,cat,st){
  const por={};lista.forEach(j=>{const f=faseSecao(j.fase);(por[f]||(por[f]=[])).push(j)});
  const partes=[];
  ordemSecoes().forEach(f=>{
    const js=ordenarFila((por[f]||[]).slice());
    let extra='';
    if(f==='SEMIFINAL'&&!st)extra=renderByesNaSemifinal(cat);
    if(!js.length&&!extra)return;
    const qtd=js.length+(extra?((extra.match(/bye-card/g)||[]).length):0);
    partes.push(`<div class="fase-bloco"><h3 class="fase-titulo"><span>${tituloSecao(f)}</span><small>${qtd} ${qtd===1?'item':'itens'}</small></h3><div class="fila">${extra}${js.map(cardJogo).join('')}</div></div>`);
  });
  return partes.length?partes.join(''):'<div class="fase-vazio">Nenhuma partida encontrada com os filtros atuais.</div>'
}'''
render_new = '''function renderPartidasPorFase(lista,cat,st){
  const por={};lista.forEach(j=>{const f=faseSecao(j.fase);(por[f]||(por[f]=[])).push(j)});
  const partes=[];
  ordemSecoes().forEach(f=>{
    const js=ordenarFila((por[f]||[]).slice());
    let extra='';
    if(f==='SEMIFINAL'&&!st)extra=renderByesNaSemifinal(cat);
    if(!js.length&&!extra)return;
    const qtd=js.length+(extra?((extra.match(/bye-card/g)||[]).length):0),recolhida=fasesRecolhidas.has(f);
    partes.push(`<div class="fase-bloco"><h3 class="fase-titulo"><span>${tituloSecao(f)}</span><span class="fase-acoes"><small>${qtd} ${qtd===1?'item':'itens'}</small><button class="fase-toggle" type="button" onclick="alternarFase('${f}')">${recolhida?'▸ Exibir':'▾ Recolher'}</button></span></h3><div class="fase-conteudo ${recolhida?'oculto-fase':''}"><div class="fila">${extra}${js.map(cardJogo).join('')}</div></div></div>`);
  });
  return partes.length?partes.join(''):'<div class="fase-vazio">Nenhuma partida encontrada com os filtros atuais.</div>'
}
function alternarFase(f){
  if(fasesRecolhidas.has(f))fasesRecolhidas.delete(f);else fasesRecolhidas.add(f);
  sessionStorage.setItem('tm_fases_recolhidas',JSON.stringify([...fasesRecolhidas]));
  render();
}'''
if render_old not in text:
    raise SystemExit('Função renderPartidasPorFase esperada não foi encontrada. Nenhuma alteração foi aplicada.')
text = text.replace(render_old, render_new, 1)

# 4) Feedback claro entre gravação e atualização real da tela.
enviar_old = "async function enviar(p){bloquearModal(true);mMsg.className='msg';mMsg.textContent='Salvando resultado... aguarde.';mostrarToast('⏳ Salvando resultado...<small>O sistema está gravando o placar e recalculando a classificação.</small>','info',10000);try{const d=await post(p);if(!d.ok)throw new Error(d.mensagem||d.erro);const texto=d.mensagem||'Resultado gravado com sucesso.';fechar(true);mostrarToast('✓ '+esc(texto),'sucesso',4200);await carregar(true)}catch(e){mMsg.className='msg erro';mMsg.textContent=e.message;mostrarToast('✕ '+esc(e.message),'erro',5000)}finally{bloquearModal(false)}}"
enviar_new = "async function enviar(p){bloquearModal(true);mMsg.className='msg';mMsg.textContent='Salvando resultado... aguarde.';mostrarToast('⏳ Salvando resultado...<small>O sistema está gravando o placar e recalculando a classificação.</small>','info',12000);try{const d=await post(p);if(!d.ok)throw new Error(d.mensagem||d.erro);const texto=d.mensagem||'Resultado gravado com sucesso.';fechar(true);mostrarToast('✓ '+esc(texto)+'<small>⏳ Atualizando placares, classificação e próxima fase...</small>','info',20000);msg.className='msg';msg.textContent='⏳ Resultado salvo. Atualizando a tela com os dados mais recentes...';await carregar(true);msg.className='msg sucesso';msg.textContent='✓ Tela atualizada.';mostrarToast('✓ Tela atualizada com o novo resultado.','sucesso',3200);setTimeout(()=>{if(msg.textContent==='✓ Tela atualizada.')msg.textContent=''},3200)}catch(e){mMsg.className='msg erro';mMsg.textContent=e.message;msg.className='msg erro';msg.textContent=e.message;mostrarToast('✕ '+esc(e.message),'erro',5000)}finally{bloquearModal(false)}}"
if enviar_old not in text:
    raise SystemExit('Função enviar esperada não foi encontrada. Nenhuma alteração foi aplicada.')
text = text.replace(enviar_old, enviar_new, 1)

p.write_text(text, encoding='utf-8')
print('Melhorias de atualização e recolhimento das fases aplicadas com sucesso.')
