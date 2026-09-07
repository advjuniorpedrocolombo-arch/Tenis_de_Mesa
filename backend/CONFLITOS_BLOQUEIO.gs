function listarConflitosAgenda_(){
  const jogos=lerJogosArbitragem_().filter(j=>j.data&&j.status!=='FINALIZADO'&&j.status!=='CANCELADA_PARA_REMARCACAO');
  const conflitos=[];
  const add=(tipo,severidade,jogosIds,mensagem,detalhes)=>conflitos.push({tipo,severidade,jogos:JogosUnicos_(jogosIds),mensagem,detalhes:detalhes||''});
  const porSlot={};
  jogos.forEach(j=>{
    const data=normalizarDataChave_(j.data),hor=String(j.horario||''),mesa=String(j.mesa||'').trim();
    const regra=validarDataDisponivel_(data,hor);
    if(!regra.ok)add('DATA_INVALIDA_OU_BLOQUEADA','ERRO',[j.id],regra.mensagem,{data,horario:hor,mesa});
    if(!hor)add('HORARIO_A_DEFINIR','AVISO',[j.id],'Partida sem horário definido.',{data,mesa});
    if(!mesa)add('MESA_A_DEFINIR','AVISO',[j.id],'Partida sem mesa definida.',{data,horario:hor});
    if(data&&hor&&mesa){
      const k=data+'|'+hor+'|'+mesa;(porSlot[k]||(porSlot[k]=[])).push(j);
    }
  });
  Object.keys(porSlot).forEach(k=>{const arr=porSlot[k];if(arr.length>1)add('MESA_DUPLICADA','ERRO',arr.map(x=>x.id),'Mais de uma partida foi marcada para a mesma mesa, data e horário.',{slot:k});});

  const participacoes={};
  jogos.forEach(j=>{
    const data=normalizarDataChave_(j.data),hor=String(j.horario||'');if(!data||!hor)return;
    [[j.idA,j.jogadorA],[j.idB,j.jogadorB]].forEach(([id,nome])=>{if(!id)return;const k=data+'|'+hor+'|'+id;(participacoes[k]||(participacoes[k]=[])).push({idJogo:j.id,nome});});
  });
  Object.keys(participacoes).forEach(k=>{const arr=participacoes[k];if(arr.length>1)add('ATLETA_DUPLA_ESCALA','ERRO',arr.map(x=>x.idJogo),'Atleta possui mais de uma partida no mesmo horário.',{slot:k,atleta:arr[0].nome});});

  const arbitragem={};
  jogos.forEach(j=>{
    const data=normalizarDataChave_(j.data),hor=String(j.horario||''),idArb=j.idArbitroReal||j.idArbitroEscalado,nome=j.arbitroReal||j.arbitroEscalado;if(!data||!hor||!idArb)return;
    const k=data+'|'+hor+'|'+idArb;(arbitragem[k]||(arbitragem[k]=[])).push({idJogo:j.id,nome});
  });
  Object.keys(arbitragem).forEach(k=>{const arr=arbitragem[k];if(arr.length>1)add('ARBITRO_DUPLA_ESCALA','ERRO',arr.map(x=>x.idJogo),'Árbitro escalado para mais de uma partida no mesmo horário.',{slot:k,arbitro:arr[0].nome});});

  const arbitros=listarArbitros_().filter(a=>a.status==='ATIVO'&&a.idParticipante);
  arbitros.forEach(a=>{
    const datasJogador=new Set(jogos.filter(j=>j.idA===a.idParticipante||j.idB===a.idParticipante).map(j=>normalizarDataChave_(j.data)));
    jogos.filter(j=>(j.idArbitroReal||j.idArbitroEscalado)===a.id&&datasJogador.has(normalizarDataChave_(j.data))).forEach(j=>add('ARBITRO_JOGA_NO_DIA','ERRO',[j.id],'Árbitro também possui partida como atleta nesta data.',{arbitro:a.nome,data:normalizarDataChave_(j.data)}));
  });

  return {ok:true,total:conflitos.length,erros:conflitos.filter(x=>x.severidade==='ERRO').length,avisos:conflitos.filter(x=>x.severidade==='AVISO').length,conflitos};
}

function JogosUnicos_(arr){return [...new Set((arr||[]).filter(Boolean))];}

function validarConflitoProposto_(idJogo,data,horario,mesa){
  const d=normalizarDataChave_(data),h=String(horario||''),m=String(mesa||'').trim();
  const jogos=lerJogosArbitragem_().filter(j=>j.id!==idJogo&&j.status!=='FINALIZADO'&&j.status!=='CANCELADA_PARA_REMARCACAO'&&normalizarDataChave_(j.data)===d);
  const atual=lerJogosArbitragem_().find(j=>j.id===idJogo);if(!atual)return {ok:false,erro:'JOGO_NAO_ENCONTRADO',mensagem:'Partida não encontrada.'};
  if(h&&m&&jogos.some(j=>String(j.horario||'')===h&&String(j.mesa||'').trim()===m))return {ok:false,erro:'CONFLITO_MESA',mensagem:'Já existe outra partida nesta mesa, data e horário.'};
  if(h){
    const ids=[atual.idA,atual.idB].filter(Boolean);
    const c=jogos.find(j=>String(j.horario||'')===h&&ids.some(id=>j.idA===id||j.idB===id));
    if(c)return {ok:false,erro:'CONFLITO_ATLETA',mensagem:'Um dos atletas já possui outra partida marcada neste horário.'};
  }
  return {ok:true};
}

function salvarAgendaJogoComConflitos_(p,usuario){
  const data=normalizarDataChave_(p.data),horario=limparTexto_(p.horario),mesa=limparTexto_(p.mesa),id=limparTexto_(p.idJogo);
  const vd=validarDataDisponivel_(data,horario);if(!vd.ok)return vd;
  const vc=validarConflitoProposto_(id,data,horario,mesa);if(!vc.ok)return vc;
  return salvarAgendaJogoSeguro_(p,usuario);
}

function bloquearDataEmMassa_(p,usuario){
  const data=normalizarDataChave_(p.data),tipo=String(p.tipoBloqueio||'OUTRO').toUpperCase(),descricao=limparTexto_(p.descricao),obs=limparTexto_(p.observacoes);
  if(!data)return {ok:false,erro:'DATA_OBRIGATORIA',mensagem:'Informe a data que será bloqueada.'};
  const jogos=lerJogosArbitragem_().filter(j=>normalizarDataChave_(j.data)===data&&j.status!=='FINALIZADO'&&j.status!=='CANCELADA_PARA_REMARCACAO');
  const motivo=descricao||tipo.replace(/_/g,' ');
  const rCal=salvarDataCalendario_({data,status:'BLOQUEADO',tipoBloqueio:tipo,descricao:motivo,observacoes:obs},usuario);if(!rCal.ok)return rCal;
  const cancelados=[],falhas=[];
  jogos.forEach(j=>{const r=cancelarPartidaForcaMaior_({idJogo:j.id,motivo:'Bloqueio da data '+data+': '+motivo},usuario);if(r.ok)cancelados.push(j.id);else falhas.push({id:j.id,erro:r.mensagem||r.erro});});
  registrarHistorico_({usuario:usuario.email,perfil:usuario.nivel,acao:'DATA_BLOQUEADA_EM_MASSA',entidade:'CALENDARIO',idRegistro:data,valorAnterior:'',valorNovo:JSON.stringify({tipo,motivo,cancelados}),observacoes:'Bloqueio de data com cancelamento em lote das partidas pendentes.'});
  return {ok:true,data,cancelados,falhas,mensagem:'Data bloqueada. '+cancelados.length+' partida(s) foram canceladas para remarcação'+(falhas.length?'; '+falhas.length+' não puderam ser alteradas.':'.')};
}
