from pathlib import Path

p=Path('admin/partidas.html')
text=p.read_text(encoding='utf-8')

# Título da área
text=text.replace('<section class="card sec"><h2>Fila de partidas</h2><div id="fila" class="fila"></div></section>', '<section class="card sec"><h2>Partidas por fase</h2><div id="fila" class="fila"></div></section>', 1)

# CSS das divisões por fase e cartões de classificação direta
alvo_css='.class-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}'
novo_css='.fase-bloco{margin-top:18px}.fase-bloco:first-child{margin-top:0}.fase-titulo{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;padding:10px 12px;border-radius:11px;background:#111827;color:#fff;font-size:17px}.fase-titulo small{font-size:11px;color:#cbd5e1}.fase-vazio{padding:14px;border:1px dashed #cbd5e1;border-radius:12px;color:#64748b;background:#f8fafc}.bye-card{display:grid;grid-template-columns:170px 1fr 110px 150px;gap:12px;align-items:center;border:2px solid #86efac;border-radius:13px;padding:13px;background:#f0fdf4}.bye-tag{display:inline-block;border-radius:999px;padding:5px 8px;font-size:11px;font-weight:900;background:#dcfce7;color:#166534}.class-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}'
if alvo_css not in text: raise SystemExit('CSS base não encontrado')
text=text.replace(alvo_css,novo_css,1)
text=text.replace('@media(max-width:800px){.resumo{grid-template-columns:1fr 1fr}.jogo{grid-template-columns:1fr}', '@media(max-width:800px){.resumo{grid-template-columns:1fr 1fr}.jogo,.bye-card{grid-template-columns:1fr}',1)

# Estado local inclui a chave mata-mata
old="const API_URL='https://script.google.com/macros/s/AKfycbwYApgJFoSzBfLPuq40TjpVygwgzn6cEa7mEFioWG8SLN7owv2l_uSkvBLvNe2-16yzOg/exec';let token=sessionStorage.getItem('tm_admin_token')||'',usuario=null,jogos=[],classif=[],fases=[],atual=null,salvando=false,toastTimer=null;"
new="const API_URL='https://script.google.com/macros/s/AKfycbwYApgJFoSzBfLPuq40TjpVygwgzn6cEa7mEFioWG8SLN7owv2l_uSkvBLvNe2-16yzOg/exec';let token=sessionStorage.getItem('tm_admin_token')||'',usuario=null,jogos=[],classif=[],fases=[],mata=[],atual=null,salvando=false,toastTimer=null;"
if old not in text: raise SystemExit('Estado JS não encontrado')
text=text.replace(old,new,1)

old_load="jogos=d.jogos||[];classif=d.classificacao||[];fases=d.fasesGrupos||[];render();"
new_load="jogos=d.jogos||[];classif=d.classificacao||[];fases=d.fasesGrupos||[];mata=d.mataMata||[];render();"
if old_load not in text: raise SystemExit('Carregamento JS não encontrado')
text=text.replace(old_load,new_load,1)

old_render="function render(){const cat=fCat.value,st=fStatus.value,l=ordenarFila(jogos.filter(j=>(!cat||j.categoria===cat)&&(!st||j.status===st)));nTotal.textContent=l.length;nPend.textContent=l.filter(j=>j.status!=='FINALIZADO').length;nFim.textContent=l.filter(j=>j.status==='FINALIZADO').length;nGrupos.textContent=new Set(l.filter(j=>j.fase==='GRUPOS').map(j=>j.categoria+'|'+j.grupo)).size;fila.innerHTML=l.length?l.map(cardJogo).join(''):'<div class=\"card\">Nenhuma partida encontrada.</div>';renderClassificacao(cat)}"
new_render="""function render(){
  const cat=fCat.value,st=fStatus.value,l=ordenarFila(jogos.filter(j=>(!cat||j.categoria===cat)&&(!st||j.status===st)));
  nTotal.textContent=l.length;nPend.textContent=l.filter(j=>j.status!=='FINALIZADO').length;nFim.textContent=l.filter(j=>j.status==='FINALIZADO').length;nGrupos.textContent=new Set(l.filter(j=>j.fase==='GRUPOS').map(j=>j.categoria+'|'+j.grupo)).size;
  fila.innerHTML=renderPartidasPorFase(l,cat,st);renderClassificacao(cat)
}
function faseSecao(f){const x=String(f||'').toUpperCase();if(x==='GRUPOS')return 'GRUPOS';if(x==='DEZESSEIS_AVOS')return 'DEZESSEIS_AVOS';if(x==='OITAVAS_DE_FINAL')return 'OITAVAS_DE_FINAL';if(x==='QUARTAS_DE_FINAL')return 'QUARTAS_DE_FINAL';if(x==='SEMIFINAL')return 'SEMIFINAL';if(x==='TERCEIRO_LUGAR')return 'TERCEIRO_LUGAR';if(x==='FINAL')return 'FINAL';return x}
function tituloSecao(f){return {GRUPOS:'Fase de grupos',DEZESSEIS_AVOS:'16 avos de final',OITAVAS_DE_FINAL:'Oitavas de final',QUARTAS_DE_FINAL:'Quartas de final',SEMIFINAL:'Semifinal',TERCEIRO_LUGAR:'Disputa de 3º lugar',FINAL:'Final'}[f]||nomeFase(f)}
function ordemSecoes(){return ['GRUPOS','DEZESSEIS_AVOS','OITAVAS_DE_FINAL','QUARTAS_DE_FINAL','SEMIFINAL','TERCEIRO_LUGAR','FINAL']}
function renderPartidasPorFase(lista,cat,st){
  const por={};lista.forEach(j=>{const f=faseSecao(j.fase);(por[f]||(por[f]=[])).push(j)});
  const partes=[];
  ordemSecoes().forEach(f=>{
    const js=ordenarFila((por[f]||[]).slice());
    let extra='';
    if(f==='SEMIFINAL'&&!st)extra=renderByesNaSemifinal(cat);
    if(!js.length&&!extra)return;
    const qtd=js.length+(extra?((extra.match(/bye-card/g)||[]).length):0);
    partes.push(`<div class=\"fase-bloco\"><h3 class=\"fase-titulo\"><span>${tituloSecao(f)}</span><small>${qtd} ${qtd===1?'item':'itens'}</small></h3><div class=\"fila\">${extra}${js.map(cardJogo).join('')}</div></div>`);
  });
  return partes.length?partes.join(''):'<div class=\"fase-vazio\">Nenhuma partida encontrada com os filtros atuais.</div>'
}
function renderByesNaSemifinal(cat){
  const byes=mata.filter(m=>(!cat||m.categoria===cat)&&String(m.status||'').toUpperCase()==='BYE'&&ordemFase(m.fase)<4&&m.idVencedor);
  if(!byes.length)return '';
  const jaNaSemi=new Set(jogos.filter(j=>String(j.fase||'').toUpperCase()==='SEMIFINAL').flatMap(j=>[String(j.idA||''),String(j.idB||'')]));
  return byes.filter(m=>!jaNaSemi.has(String(m.idVencedor))).map(m=>`<div class=\"bye-card\"><div><b>${esc(m.categoria)}</b><div class=\"meta\">Classificação direta à semifinal</div><div class=\"agenda-meta\">⭐ Melhor campanha na fase de grupos</div></div><div class=\"duelo\">${esc(m.vencedor)} <span>×</span> <span style=\"color:#64748b\">Aguardando adversário</span></div><div class=\"placar\">BYE</div><div><span class=\"bye-tag\">NA SEMIFINAL</span></div></div>`).join('')
}"""
if old_render not in text: raise SystemExit('Função render base não encontrada')
text=text.replace(old_render,new_render,1)

p.write_text(text,encoding='utf-8')
print('Visualização por fases aplicada com sucesso.')
