from pathlib import Path

p = Path('admin/partidas.html')
text = p.read_text(encoding='utf-8')

# V1: recolhimento das fases e feedback básico.
if 'PARTIDAS_UX_RECOLHER_FASES_V1' not in text:
    raise SystemExit('A versão V1 da UX das partidas ainda não está aplicada.')

# V2: overlay real de atualização + data/hora em formato brasileiro.
if 'PARTIDAS_UX_DATA_CARREGAMENTO_V2' in text:
    print('A melhoria V2 de carregamento e datas já está aplicada.')
    raise SystemExit(0)

# 1) CSS do overlay de atualização.
css_old = ".toast small{display:block;margin-top:4px;font-weight:500;opacity:.9}@keyframes toastIn"
css_new = ".toast small{display:block;margin-top:4px;font-weight:500;opacity:.9}.atualizando-overlay{position:fixed;inset:0;z-index:9998;background:rgba(15,23,42,.62);display:flex;align-items:center;justify-content:center;padding:18px}.atualizando-box{background:#fff;border-radius:16px;padding:22px 26px;box-shadow:0 18px 50px rgba(0,0,0,.28);text-align:center;min-width:min(360px,90vw);font-weight:900;color:#172033}.atualizando-box small{display:block;margin-top:7px;color:#64748b;font-weight:600}.spinner{width:34px;height:34px;border:4px solid #dbeafe;border-top-color:#2563eb;border-radius:50%;margin:0 auto 12px;animation:girar .8s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}@keyframes toastIn"
if css_old not in text:
    raise SystemExit('Ponto de inserção do CSS do carregamento não encontrado.')
text = text.replace(css_old, css_new, 1)

# 2) Overlay no HTML.
html_old = '<div id="toast" class="toast oculto"></div>'
html_new = '<div id="toast" class="toast oculto"></div><div id="overlayAtualizacao" class="atualizando-overlay oculto"><div class="atualizando-box"><div class="spinner"></div><div id="overlayAtualizacaoTitulo">Atualizando a tela...</div><small id="overlayAtualizacaoDetalhe">Aguarde a confirmação dos dados mais recentes.</small></div></div>'
if html_old not in text:
    raise SystemExit('Toast base não encontrado para inserir overlay.')
text = text.replace(html_old, html_new, 1)

# 3) Marcador V2 e helpers do overlay.
marker_old = "const API_URL='https://script.google.com/macros/s/AKfycbwYApgJFoSzBfLPuq40TjpVygwgzn6cEa7mEFioWG8SLN7owv2l_uSkvBLvNe2-16yzOg/exec';let token=sessionStorage.getItem('tm_admin_token')||'',usuario=null,jogos=[],classif=[],fases=[],mata=[],atual=null,salvando=false,toastTimer=null;const PARTIDAS_UX_RECOLHER_FASES_V1=true;let fasesRecolhidas=new Set(JSON.parse(sessionStorage.getItem('tm_fases_recolhidas')||'[]'));"
marker_new = marker_old + "const PARTIDAS_UX_DATA_CARREGAMENTO_V2=true;"
if marker_old not in text:
    raise SystemExit('Marcador V1 não encontrado.')
text = text.replace(marker_old, marker_new, 1)

helper_old = "function mostrarToast(texto,tipo='sucesso',tempo=3600){clearTimeout(toastTimer);toast.className='toast '+(tipo==='erro'?'erro-toast':tipo==='info'?'info-toast':'sucesso-toast');toast.innerHTML=texto;toast.classList.remove('oculto');toastTimer=setTimeout(()=>toast.classList.add('oculto'),tempo)}"
helper_new = helper_old + "\nfunction mostrarAtualizacaoTela(titulo='Atualizando a tela...',detalhe='Buscando os dados mais recentes do torneio.'){const o=document.getElementById('overlayAtualizacao');if(!o)return;document.getElementById('overlayAtualizacaoTitulo').textContent=titulo;document.getElementById('overlayAtualizacaoDetalhe').textContent=detalhe;o.classList.remove('oculto')}\nfunction ocultarAtualizacaoTela(){document.getElementById('overlayAtualizacao')?.classList.add('oculto')}"
if helper_old not in text:
    raise SystemExit('Função mostrarToast não encontrada.')
text = text.replace(helper_old, helper_new, 1)

# 4) Carregamento: mensagem clara e remoção garantida após retorno real da API.
carregar_old = "async function carregar(silencioso=false){if(!silencioso){msg.className='msg';msg.textContent='Carregando...'}try{const r=await fetch(API_URL+'?action=jogosAdmin&token='+encodeURIComponent(token)+'&_='+Date.now(),{cache:'no-store'}),d=await r.json();if(!d.ok)throw new Error(d.mensagem||d.erro);jogos=d.jogos||[];classif=d.classificacao||[];fases=d.fasesGrupos||[];mata=d.mataMata||[];render();if(!silencioso)msg.textContent=''}catch(e){msg.className='msg erro';msg.textContent=e.message;if(silencioso)mostrarToast('✕ '+esc(e.message),'erro',5000)}}"
carregar_new = "async function carregar(silencioso=false){if(!silencioso){msg.className='msg';msg.textContent='⏳ Atualizando partidas...'}try{const r=await fetch(API_URL+'?action=jogosAdmin&token='+encodeURIComponent(token)+'&_='+Date.now(),{cache:'no-store'}),d=await r.json();if(!d.ok)throw new Error(d.mensagem||d.erro);jogos=d.jogos||[];classif=d.classificacao||[];fases=d.fasesGrupos||[];mata=d.mataMata||[];render();if(!silencioso){msg.className='msg';msg.textContent=''}}catch(e){msg.className='msg erro';msg.textContent=e.message;if(silencioso)mostrarToast('✕ '+esc(e.message),'erro',5000);throw e}}"
if carregar_old not in text:
    raise SystemExit('Função carregar atual não encontrada.')
text = text.replace(carregar_old, carregar_new, 1)

# 5) Data/hora: sempre DD/MM/AAAA e horário amigável 20h30 às 21h.
fmt_old = "function fmtData(v){const s=String(v||'').trim();const m=s.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);return m?m[3]+'/'+m[2]+'/'+m[1]:esc(s)}"
fmt_new = "function fmtData(v){const s=String(v||'').trim();if(!s)return '';let m=s.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);if(m)return m[3]+'/'+m[2]+'/'+m[1];m=s.match(/^(\\d{2})\\/(\\d{2})\\/(\\d{4})/);if(m)return m[1]+'/'+m[2]+'/'+m[3];const d=new Date(s);if(!Number.isNaN(d.getTime()))return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric'}).format(d);return esc(s)}\nfunction fmtHorario(v){const s=String(v||'').trim();if(!s)return '';const m=s.match(/^(\\d{1,2}):(\\d{2})/);if(!m)return esc(s);const h=Number(m[1]),min=Number(m[2]),inicio=(min?String(h).padStart(2,'0')+'h'+String(min).padStart(2,'0'):String(h).padStart(2,'0')+'h');const total=h*60+min+30,fimH=Math.floor(total/60)%24,fimM=total%60,fim=(fimM?String(fimH).padStart(2,'0')+'h'+String(fimM).padStart(2,'0'):String(fimH).padStart(2,'0')+'h');return inicio+' às '+fim}"
if fmt_old not in text:
    raise SystemExit('Função fmtData atual não encontrada.')
text = text.replace(fmt_old, fmt_new, 1)

hora_old = "${j.horario?' • '+esc(j.horario):''}"
hora_new = "${j.horario?' • '+fmtHorario(j.horario):''}"
if hora_old not in text:
    raise SystemExit('Exibição atual do horário não encontrada.')
text = text.replace(hora_old, hora_new, 1)

# 6) Ao finalizar: overlay permanece até a tela realmente terminar de buscar e renderizar.
enviar_old = "async function enviar(p){bloquearModal(true);mMsg.className='msg';mMsg.textContent='Salvando resultado... aguarde.';mostrarToast('⏳ Salvando resultado...<small>O sistema está gravando o placar e recalculando a classificação.</small>','info',12000);try{const d=await post(p);if(!d.ok)throw new Error(d.mensagem||d.erro);const texto=d.mensagem||'Resultado gravado com sucesso.';fechar(true);mostrarToast('✓ '+esc(texto)+'<small>⏳ Atualizando placares, classificação e próxima fase...</small>','info',20000);msg.className='msg';msg.textContent='⏳ Resultado salvo. Atualizando a tela com os dados mais recentes...';await carregar(true);msg.className='msg sucesso';msg.textContent='✓ Tela atualizada.';mostrarToast('✓ Tela atualizada com o novo resultado.','sucesso',3200);setTimeout(()=>{if(msg.textContent==='✓ Tela atualizada.')msg.textContent=''},3200)}catch(e){mMsg.className='msg erro';mMsg.textContent=e.message;msg.className='msg erro';msg.textContent=e.message;mostrarToast('✕ '+esc(e.message),'erro',5000)}finally{bloquearModal(false)}}"
enviar_new = "async function enviar(p){bloquearModal(true);mMsg.className='msg';mMsg.textContent='Salvando resultado... aguarde.';mostrarToast('⏳ Salvando resultado...<small>O sistema está gravando o placar e recalculando a classificação.</small>','info',12000);try{const d=await post(p);if(!d.ok)throw new Error(d.mensagem||d.erro);fechar(true);mostrarAtualizacaoTela('Resultado salvo. Atualizando a tela...','Atualizando placares, classificação e eventual próxima fase.');await carregar(true);ocultarAtualizacaoTela();msg.className='msg sucesso';msg.textContent='✓ Tela atualizada.';mostrarToast('✓ Tela atualizada com o novo resultado.','sucesso',3200);setTimeout(()=>{if(msg.textContent==='✓ Tela atualizada.')msg.textContent=''},3200)}catch(e){ocultarAtualizacaoTela();mMsg.className='msg erro';mMsg.textContent=e.message;msg.className='msg erro';msg.textContent=e.message;mostrarToast('✕ '+esc(e.message),'erro',5000)}finally{bloquearModal(false)}}"
if enviar_old not in text:
    raise SystemExit('Função enviar V1 não encontrada.')
text = text.replace(enviar_old, enviar_new, 1)

p.write_text(text, encoding='utf-8')
print('Melhoria V2 de carregamento e formato de data aplicada com sucesso.')
