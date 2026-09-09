from pathlib import Path

p = Path('admin/arbitros.html')
s = p.read_text(encoding='utf-8')

s = s.replace(
    '<button class="btn azul" onclick="sortear()">🎲 Sortear árbitros dos jogos agendados</button>',
    '<button id="btnSortear" class="btn azul" onclick="sortear()">🎲 Sortear árbitros dos jogos agendados</button>'
)

s = s.replace(
    '<p class="meta">Defina data, horário e mesa. No sorteio, os atletas árbitros são avaliados automaticamente contra a programação dos próprios jogos.</p>',
    '<p class="meta">As datas vêm automaticamente da programação dos jogos. Horário padrão: <b>20h30 às 21h</b>. No sorteio, os atletas árbitros são avaliados automaticamente contra os próprios jogos para evitar conflitos.</p>'
)

old_render = '''function renderAgenda(){const l=jogos.slice().sort((a,b)=>String(a.data||'').localeCompare(String(b.data||''))||String(a.horario||'').localeCompare(String(b.horario||'')));agenda.innerHTML=l.length?l.map(j=>`<div class="agenda-row"><div><b>${esc(j.jogadorA)} × ${esc(j.jogadorB)}</b><div class="meta">${esc(j.categoria)} • ${esc(j.fase==='GRUPOS'?j.grupo:j.fase)} • ${esc(j.status)}</div></div><div><span class="meta">Árbitro</span><br><b>${esc(j.arbitroReal||j.arbitroEscalado||'Ainda não escalado')}</b></div><input id="d-${escA(j.id)}" type="date" value="${normalizaDataInput(j.data)}"><input id="h-${escA(j.id)}" type="time" value="${escA(j.horario||'')}"><input id="m-${escA(j.id)}" placeholder="Mesa" value="${escA(j.mesa||'')}"><div><button class="btn verde" onclick="salvarAgenda('${escA(j.id)}')">Salvar</button> <button class="btn amarelo" onclick="substituir('${escA(j.id)}')">Substituir</button></div></div>`).join(''):'Nenhuma partida criada.'}'''
new_render = '''function renderAgenda(){const l=jogos.slice().sort((a,b)=>normalizaDataInput(a.data).localeCompare(normalizaDataInput(b.data))||String(a.mesa||'').localeCompare(String(b.mesa||'')));agenda.innerHTML=l.length?l.map(j=>`<div class="agenda-row"><div><b>${esc(j.jogadorA)} × ${esc(j.jogadorB)}</b><div class="meta">${esc(j.categoria)} • ${esc(j.fase==='GRUPOS'?j.grupo:j.fase)} • ${esc(j.status)}</div></div><div><span class="meta">Árbitro</span><br><b>${esc(j.arbitroReal||j.arbitroEscalado||'Ainda não escalado')}</b></div><input id="d-${escA(j.id)}" type="date" value="${normalizaDataInput(j.data)}" title="Data definida automaticamente pela programação dos jogos"><div><span class="meta">Horário</span><br><b>20h30 às 21h</b><input id="h-${escA(j.id)}" type="hidden" value="20:30"></div><input id="m-${escA(j.id)}" placeholder="Mesa" value="${escA(j.mesa||'')}"><div><button class="btn verde" onclick="salvarAgenda('${escA(j.id)}')">Salvar</button> <button class="btn amarelo" onclick="substituir('${escA(j.id)}')">Substituir</button></div></div>`).join(''):'Nenhuma partida criada.'}'''
if old_render in s:
    s = s.replace(old_render, new_render)

old_sort = '''async function sortear(){if(!confirm('Sortear automaticamente um árbitro elegível para cada partida agendada? O sistema verificará conflitos com atletas árbitros e horários simultâneos.'))return;msgAgenda.className='msg processando';msgAgenda.textContent='Sorteando árbitros e verificando conflitos com os jogos dos atletas...';const d=await post({action:'adminSortearArbitros',token});msgAgenda.className='msg '+(d.ok?'sucesso':'erro');msgAgenda.textContent=d.mensagem||d.erro;if(d.ok)carregarTudo()}'''
new_sort = '''async function sortear(){if(!confirm('Sortear automaticamente um árbitro elegível para cada partida agendada? O sistema verificará conflitos com atletas árbitros e partidas simultâneas.'))return;const btn=document.getElementById('btnSortear');const texto=btn?btn.textContent:'';if(btn){btn.disabled=true;btn.textContent='⏳ Sorteando árbitros...'}msgAgenda.className='msg processando';msgAgenda.textContent='⏳ Sorteando árbitros... Aguarde enquanto o sistema verifica conflitos entre jogadores, árbitros e as duas mesas.';try{const d=await post({action:'adminSortearArbitros',token});msgAgenda.className='msg '+(d.ok?'sucesso':'erro');msgAgenda.textContent=d.ok?'✓ '+(d.mensagem||'Sorteio de árbitros concluído.'):(d.mensagem||d.erro);if(d.ok)await carregarTudo()}catch(e){msgAgenda.className='msg erro';msgAgenda.textContent='Erro no sorteio de árbitros: '+e.message}finally{if(btn){btn.disabled=false;btn.textContent=texto}}}'''
if old_sort in s:
    s = s.replace(old_sort, new_sort)

old_data = "function normalizaDataInput(v){if(!v)return'';const s=String(v);if(/^\\d{4}-\\d{2}-\\d{2}$/.test(s))return s;const m=s.match(/(\\d{2})\\/(\\d{2})\\/(\\d{4})/);return m?m[3]+'-'+m[2]+'-'+m[1]:''}"
new_data = "function normalizaDataInput(v){if(!v)return'';const s=String(v).trim();const iso=s.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);if(iso)return iso[1]+'-'+iso[2]+'-'+iso[3];const br=s.match(/(\\d{2})\\/(\\d{2})\\/(\\d{4})/);return br?br[3]+'-'+br[2]+'-'+br[1]:''}"
if old_data in s:
    s = s.replace(old_data, new_data)

p.write_text(s, encoding='utf-8')
