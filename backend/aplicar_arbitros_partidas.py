from pathlib import Path

# 1) Backend principal: expor árbitros na resposta de listarJogos_().
p = Path('backend/Code.gs')
s = p.read_text(encoding='utf-8')
old = "melhorDe:idx.MELHOR_DE!==undefined?Number(r[idx.MELHOR_DE]||melhorDePorFase_(r[idx.FASE])):melhorDePorFase_(r[idx.FASE])}))"
new = "idArbitroEscalado:idx.ID_ARBITRO_ESCALADO!==undefined?String(r[idx.ID_ARBITRO_ESCALADO]||''):'',arbitroEscalado:idx.ARBITRO_ESCALADO!==undefined?String(r[idx.ARBITRO_ESCALADO]||''):'',idArbitroReal:idx.ID_ARBITRO_REAL!==undefined?String(r[idx.ID_ARBITRO_REAL]||''):'',arbitroReal:idx.ARBITRO_REAL!==undefined?String(r[idx.ARBITRO_REAL]||''):'',statusArbitragem:idx.STATUS_ARBITRAGEM!==undefined?String(r[idx.STATUS_ARBITRAGEM]||''):'',melhorDe:idx.MELHOR_DE!==undefined?Number(r[idx.MELHOR_DE]||melhorDePorFase_(r[idx.FASE])):melhorDePorFase_(r[idx.FASE])}))"
if old in s and 'idArbitroEscalado:idx.ID_ARBITRO_ESCALADO' not in s:
    s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

# 2) Arbitragem: considerar as duas partidas da mesma noite simultâneas quando não houver horário definido.
p = Path('backend/ARBITRAGEM_AGENDA.gs')
s = p.read_text(encoding='utf-8')
s = s.replace("const pid=String(arbitro.idParticipante),mesmaData=x=>String(x.data||'')===String(jogo.data||''),mesmoHorario=x=>String(x.horario||'')===String(jogo.horario||'');", "const pid=String(arbitro.idParticipante),mesmaData=x=>String(x.data||'')===String(jogo.data||''),slotJogo=String(jogo.horario||'NOITE'),mesmoHorario=x=>String(x.horario||'NOITE')===slotJogo;")
s = s.replace("if(!jogo.data||!jogo.horario)return false;", "if(!jogo.data)return false;")
s = s.replace("if(!idArbitro||!jogo.data||!jogo.horario)return false;\n  return jogos.some(x=>x.id!==jogo.id&&String(x.data||'')===String(jogo.data||'')&&String(x.horario||'')===String(jogo.horario||'')&&(x.idArbitroReal===idArbitro||x.idArbitroEscalado===idArbitro));", "if(!idArbitro||!jogo.data)return false;\n  const slot=String(jogo.horario||'NOITE');\n  return jogos.some(x=>x.id!==jogo.id&&String(x.data||'')===String(jogo.data||'')&&String(x.horario||'NOITE')===slot&&(x.idArbitroReal===idArbitro||x.idArbitroEscalado===idArbitro));")
s = s.replace("const todosJogos=lerJogosArbitragem_(),jogos=todosJogos.filter(j=>j.status!=='FINALIZADO'&&j.status!=='CANCELADA_PARA_REMARCACAO'&&j.data&&j.horario&&j.mesa),arbitros=listarArbitros_().filter(a=>a.status==='ATIVO');", "const todosJogos=lerJogosArbitragem_(),jogos=todosJogos.filter(j=>j.status!=='FINALIZADO'&&j.status!=='CANCELADA_PARA_REMARCACAO'&&j.data&&j.mesa),arbitros=listarArbitros_().filter(a=>a.status==='ATIVO');")
s = s.replace("if(idExistente&&j.horario)ocupacao.add(String(j.horario)+'|'+String(idExistente));", "if(idExistente)ocupacao.add(String(j.horario||'NOITE')+'|'+String(idExistente));")
s = s.replace("if(ocupacao.has(String(j.horario)+'|'+String(a.id)))return false;", "if(ocupacao.has(String(j.horario||'NOITE')+'|'+String(a.id)))return false;")
s = s.replace("usoDia[arb.id]=(usoDia[arb.id]||0)+1;ocupacao.add(String(j.horario)+'|'+String(arb.id));", "usoDia[arb.id]=(usoDia[arb.id]||0)+1;ocupacao.add(String(j.horario||'NOITE')+'|'+String(arb.id));")
s = s.replace("Não existem partidas pendentes com data, horário e mesa completamente definidos.", "Não existem partidas pendentes com data e mesa definidas.")
p.write_text(s, encoding='utf-8')

# 3) Tela de partidas: mostrar o árbitro escalado em cada confronto.
p = Path('admin/partidas.html')
s = p.read_text(encoding='utf-8')
old_card = "const ag=j.data?`<div class=\"agenda-meta\">📅 ${fmtData(j.data)}${j.mesa?' • '+esc(j.mesa):''}${j.horario?' • '+esc(j.horario):''}</div>`:'<div class=\"agenda-meta\">📅 Data ainda não definida</div>';return `<div class=\"jogo\"><div><b>${esc(j.categoria)}</b><div class=\"meta\">${j.fase==='GRUPOS'?esc(j.grupo)+' • Rodada '+(j.rodada||'-'):nomeFase(j.fase)+' • Confronto '+(j.rodada||'-')} • melhor de ${j.melhorDe}</div>${ag}</div>"
new_card = "const ag=j.data?`<div class=\"agenda-meta\">📅 ${fmtData(j.data)}${j.mesa?' • '+esc(j.mesa):''}${j.horario?' • '+esc(j.horario):''}</div>`:'<div class=\"agenda-meta\">📅 Data ainda não definida</div>';const arb=j.arbitroReal||j.arbitroEscalado||'';const ar=`<div class=\"agenda-meta\">👤 Árbitro: ${arb?esc(arb):'<span style=\"color:#b45309\">Aguardando sorteio</span>'}</div>`;return `<div class=\"jogo\"><div><b>${esc(j.categoria)}</b><div class=\"meta\">${j.fase==='GRUPOS'?esc(j.grupo)+' • Rodada '+(j.rodada||'-'):nomeFase(j.fase)+' • Confronto '+(j.rodada||'-')} • melhor de ${j.melhorDe}</div>${ag}${ar}</div>"
if old_card in s:
    s = s.replace(old_card, new_card, 1)
# modal também mostra árbitro
old_meta = "mMeta.textContent=atual.categoria+' • '+(atual.grupo||nomeFase(atual.fase))+' • '+(atual.data?fmtData(atual.data)+' • '+(atual.mesa||''):'sem data')+' • melhor de '+atual.melhorDe;"
new_meta = "mMeta.textContent=atual.categoria+' • '+(atual.grupo||nomeFase(atual.fase))+' • '+(atual.data?fmtData(atual.data)+' • '+(atual.mesa||''):'sem data')+' • Árbitro: '+(atual.arbitroReal||atual.arbitroEscalado||'Aguardando sorteio')+' • melhor de '+atual.melhorDe;"
if old_meta in s:
    s = s.replace(old_meta, new_meta, 1)
p.write_text(s, encoding='utf-8')

print('Integração árbitros ↔ partidas aplicada.')
