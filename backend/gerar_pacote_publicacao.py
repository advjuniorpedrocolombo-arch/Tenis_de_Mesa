from pathlib import Path

arquivos = [
    'backend/Code.gs',
    'backend/RECUPERACAO_PIN.gs',
    'backend/INSCRICOES_CRONOGRAMA.gs',
    'backend/ARBITRAGEM_AGENDA.gs',
    'backend/CALENDARIO_REMARCACAO.gs',
    'backend/CONFLITOS_BLOQUEIO.gs',
    'backend/ENCERRAMENTO_TORNEIO.gs',
    'backend/ENCERRAMENTO_EXTENSOES.gs',
]

partes = [
    '/**',
    ' * SISTEMA DE TORNEIO DE TÊNIS DE MESA – ETEC',
    ' * PACOTE ÚNICO PARA PUBLICAÇÃO NO GOOGLE APPS SCRIPT',
    ' * Gerado automaticamente a partir dos módulos oficiais do diretório backend.',
    ' *',
    ' * IMPORTANTE: no Apps Script, este arquivo pode substituir integralmente o Code.gs atual.',
    ' * Não copie os módulos separados se utilizar este pacote único, para evitar funções duplicadas.',
    ' * Após colar o código, execute autorizarBackend_() uma única vez no editor antes de implantar.',
    ' */',
    '',
]

for nome in arquivos:
    p = Path(nome)
    if not p.exists():
        raise SystemExit(f'Arquivo obrigatório ausente: {nome}')
    partes.append('\n// ============================================================')
    partes.append(f'// INÍCIO: {p.name}')
    partes.append('// ============================================================\n')
    partes.append(p.read_text(encoding='utf-8').rstrip())
    partes.append('\n// ============================================================')
    partes.append(f'// FIM: {p.name}')
    partes.append('// ============================================================\n')

conteudo = '\n'.join(partes).rstrip() + '\n'

# Garante que a exportação PDF use um token OAuth real e fornece diagnóstico útil.
old_pdf = """function buscarPdf_(url){
  const r=UrlFetchApp.fetch(url,{headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true});
  if(r.getResponseCode()!==200)throw new Error('ERRO_PDF|Não foi possível gerar um dos PDFs do encerramento. Código '+r.getResponseCode());
  return r.getBlob().setContentType('application/pdf');
}"""
new_pdf = """function buscarPdf_(url){
  const tokenOAuth=ScriptApp.getOAuthToken();
  if(!tokenOAuth)throw new Error('ERRO_OAUTH|Não foi possível obter o token OAuth do Apps Script. Execute autorizarBackend_() no editor e publique uma nova versão.');
  const r=UrlFetchApp.fetch(url,{
    method:'get',
    headers:{Authorization:'Bearer '+tokenOAuth},
    followRedirects:true,
    muteHttpExceptions:true
  });
  const codigo=r.getResponseCode();
  if(codigo!==200){
    const detalhe=String(r.getContentText()||'').replace(/\\s+/g,' ').slice(0,350);
    throw new Error('ERRO_PDF|Não foi possível gerar um dos PDFs do encerramento. Código '+codigo+(detalhe?' | '+detalhe:''));
  }
  return r.getBlob().setContentType('application/pdf');
}"""
if old_pdf in conteudo:
    conteudo = conteudo.replace(old_pdf, new_pdf, 1)
else:
    raise SystemExit('Função buscarPdf_ esperada não foi encontrada no pacote.')

# Função manual de autorização. Execute uma vez após colar o pacote no Apps Script.
autorizacao = r'''

// ============================================================
// AUTORIZAÇÃO INICIAL DO BACKEND
// Execute manualmente uma única vez no editor do Apps Script,
// autorize os acessos solicitados e somente depois publique a Web App.
// ============================================================
function autorizarBackend_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  ss.getName();
  DriveApp.getFileById(SPREADSHEET_ID).getName();
  const doc=DocumentApp.create('TEMP_AUTORIZACAO_TORNEIO');
  doc.getBody().appendParagraph('Autorização temporária do backend do torneio.');
  doc.saveAndClose();
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  UrlFetchApp.fetch('https://www.google.com/generate_204',{muteHttpExceptions:true});
  MailApp.getRemainingDailyQuota();
  const token=ScriptApp.getOAuthToken();
  if(!token)throw new Error('Não foi possível obter o token OAuth.');
  Logger.log('AUTORIZACAO_BACKEND_OK');
  return 'AUTORIZACAO_BACKEND_OK';
}
'''
conteudo += autorizacao

saida = Path('backend/APPS_SCRIPT_COMPLETO.gs')
saida.write_text(conteudo.rstrip() + '\n', encoding='utf-8')
print(f'Pacote gerado: {saida}')
