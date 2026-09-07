function arquivarExtrasOperacionais_(ss,pasta){
  criarPdfAba_(ss,'ARBITROS',pasta,'08B_Arbitros_e_Escala.pdf');
  criarPdfAba_(ss,'CALENDARIO',pasta,'08C_Calendario_e_Bloqueios.pdf');
}

function fingerprintExtrasOperacionais_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  return ['ARBITROS','CALENDARIO'].map(nome=>{
    const sh=ss.getSheetByName(nome);if(!sh)return nome+':';
    const lr=sh.getLastRow(),lc=sh.getLastColumn();
    return nome+':'+(lr&&lc?JSON.stringify(sh.getRange(1,1,lr,lc).getDisplayValues()):'');
  }).join('\n');
}

function limparExtrasNovaEdicao_(){
  limparAbaMantendoCabecalho_('ARBITROS');
  limparAbaMantendoCabecalho_('CALENDARIO');
}
