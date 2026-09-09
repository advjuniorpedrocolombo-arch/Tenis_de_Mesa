function finalizarSorteio_(d,usuario){
  const categoria=limparTexto_(d.categoria),estado=obterEstadoSorteio_(categoria);
  if(estado.status!=='EM_SORTEIO')return {ok:false,erro:'SORTEIO_NAO_ABERTO',mensagem:'O sorteio desta categoria não está aberto.'};
  if(estado.naoSorteados.length)return {ok:false,erro:'PARTICIPANTES_PENDENTES',mensagem:'Ainda existem '+estado.naoSorteados.length+' participante(s) não sorteado(s).'};
  const sh=getSheet_(SHEETS.GRUPOS),idx=indexHeaders_(getHeaders_(sh)),max=sh.getMaxRows(),vals=sh.getRange(2,1,max-1,sh.getLastColumn()).getValues();
  for(let i=0;i<vals.length;i++){
    if(String(vals[i][idx.CATEGORIA])===categoria&&String(vals[i][idx.ID_PARTICIPANTE]||'').trim())sh.getRange(i+2,idx.STATUS+1).setValue('FINALIZADO');
  }
  gerarJogosDosGrupos_(categoria,usuario);
  recalcularClassificacaoCategoria_(categoria);
  const agenda=agendarJogosGruposAutomaticamente_(usuario);
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'SORTEIO_FINALIZADO',entidade:'GRUPOS',idRegistro:categoria,valorAnterior:'EM_SORTEIO',valorNovo:'FINALIZADO',observacoes:'Grupos bloqueados, confrontos gerados e agenda automática aplicada conforme calendário oficial.'});
  return {ok:true,agenda,mensagem:'Sorteio finalizado. Os confrontos foram gerados e as datas foram distribuídas automaticamente conforme o calendário oficial.'};
}

function agendarJogosGruposAutomaticamente_(usuario){
  const inicio=normalizarDataChave_(getConfig_('DATA_INICIO'));
  if(!inicio)return {ok:false,erro:'DATA_INICIO_AUSENTE',mensagem:'Defina a data de início do torneio no Planejamento antes de gerar a agenda.'};
  const sh=getSheet_(SHEETS.JOGOS),h=getHeaders_(sh),idx=indexHeaders_(h),last=sh.getLastRow();
  if(last<2)return {ok:true,agendados:0,mensagem:'Nenhuma partida de grupos para agendar.'};
  const vals=sh.getRange(2,1,last-1,h.length).getDisplayValues();
  const jogos=[];
  vals.forEach((r,i)=>{
    if(String(r[idx.ID_JOGO]||'').trim()&&String(r[idx.FASE]||'').toUpperCase()==='GRUPOS'&&String(r[idx.STATUS]||'').toUpperCase()!=='FINALIZADO'){
      jogos.push({linha:i+2,id:r[idx.ID_JOGO],categoria:String(r[idx.CATEGORIA]||''),grupo:String(r[idx.GRUPO]||''),rodada:Number(r[idx.RODADA]||0)});
    }
  });
  const ordenar=(a,b)=>a.rodada-b.rodada||a.grupo.localeCompare(b.grupo,'pt-BR')||a.id.localeCompare(b.id);
  const rec=jogos.filter(j=>j.categoria==='Recreativo').sort(ordenar);
  const mes=jogos.filter(j=>j.categoria==='Mesatenistas').sort(ordenar);
  const bloqueadas=new Set(listarCalendario_().filter(x=>x.ativo&&String(x.status).toUpperCase()==='BLOQUEADO').map(x=>normalizarDataChave_(x.data)).filter(Boolean));
  let data=parseDataAgendaAutomatica_(inicio),ir=0,im=0,noites=0,agendados=0,seguranca=0;
  while((ir<rec.length||im<mes.length)&&seguranca<1000){
    seguranca++;
    if(ehDiaUtilAgenda_(data)){
      const chave=formatarDataAgenda_(data);
      if(!bloqueadas.has(chave)){
        let usados=0;
        if(ir<rec.length){gravarAgendaAutomaticaLinha_(sh,idx,rec[ir++].linha,chave,'Mesa 1');usados++;agendados++;}
        if(im<mes.length){gravarAgendaAutomaticaLinha_(sh,idx,mes[im++].linha,chave,'Mesa 2');usados++;agendados++;}
        if(usados)noites++;
      }
    }
    data.setDate(data.getDate()+1);
  }
  if(seguranca>=1000&& (ir<rec.length||im<mes.length))throw new Error('AGENDA_SEM_DATAS|Não foi possível encontrar datas úteis suficientes no calendário.');
  SpreadsheetApp.flush();
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'AGENDA_GRUPOS_GERADA',entidade:'JOGOS',idRegistro:'LOTE',valorAnterior:'',valorNovo:JSON.stringify({agendados,noites,recreativo:rec.length,mesatenistas:mes.length,horario:'20:30'}),observacoes:'Agenda automática: segunda a sexta, até 2 partidas por noite, uma Recreativo na Mesa 1 e uma Mesatenistas na Mesa 2; datas bloqueadas ignoradas; horário padrão 20h30–21h.'});
  return {ok:true,agendados,noites,mensagem:agendados+' partida(s) distribuída(s) em '+noites+' noite(s), respeitando dias úteis, bloqueios e horário padrão de 20h30 às 21h.'};
}

function gravarAgendaAutomaticaLinha_(sh,idx,linha,data,mesa){
  if(idx.DATA!==undefined)sh.getRange(linha,idx.DATA+1).setValue(data);
  if(idx.HORARIO_PREVISTO!==undefined)sh.getRange(linha,idx.HORARIO_PREVISTO+1).setValue('20:30');
  if(idx.MESA!==undefined)sh.getRange(linha,idx.MESA+1).setValue(mesa);
  if(idx.STATUS_AGENDA!==undefined)sh.getRange(linha,idx.STATUS_AGENDA+1).setValue('AGENDADA');
}

function parseDataAgendaAutomatica_(s){
  const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)return new Date(NaN);
  return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0);
}
function formatarDataAgenda_(d){return Utilities.formatDate(d,Session.getScriptTimeZone()||'America/Sao_Paulo','yyyy-MM-dd');}
function ehDiaUtilAgenda_(d){const dia=d.getDay();return dia>=1&&dia<=5;}
