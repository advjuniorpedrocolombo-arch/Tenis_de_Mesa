from pathlib import Path

arquivos = [
    'backend/Code.gs',
    'backend/RECUPERACAO_PIN.gs',
    'backend/INSCRICOES_CRONOGRAMA.gs',
    'backend/FINANCEIRO.gs',
    'backend/ARBITRAGEM_AGENDA.gs',
    'backend/CALENDARIO_REMARCACAO.gs',
    'backend/AGENDA_AUTOMATICA.gs',
    'backend/MATA_MATA_AGENDA.gs',
    'backend/MATA_MATA_BYES.gs',
    'backend/CONFLITOS_BLOQUEIO.gs',
    'backend/ENCERRAMENTO_TORNEIO.gs',
    'backend/ENCERRAMENTO_EXTENSOES.gs',
    'backend/PERFORMANCE_V1.gs',
]

partes = [
    '/**',
    ' * SISTEMA DE TORNEIO DE TÊNIS DE MESA – ETEC',
    ' * PACOTE ÚNICO PARA PUBLICAÇÃO NO GOOGLE APPS SCRIPT',
    ' * Gerado automaticamente a partir dos módulos oficiais do diretório backend.',
    ' *',
    ' * IMPORTANTE: no Apps Script, este arquivo pode substituir integralmente o Code.gs atual.',
    ' * Não copie os módulos separados se utilizar este pacote único, para evitar funções duplicadas.',
    ' * O arquivamento da edição é gerado como ZIP pelo navegador e não depende do Google Drive.',
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

# O pacote final não deve reintroduzir dependências de Drive/Documentos
# usadas pelo antigo arquivamento automático em PDF.
proibidos = ['DriveApp.', 'DocumentApp.', 'function buscarPdf_(', 'function autorizarBackend_(']
for termo in proibidos:
    if termo in conteudo:
        raise SystemExit(f'Dependência antiga de arquivamento encontrada no pacote: {termo}')

saida = Path('backend/APPS_SCRIPT_COMPLETO.gs')
saida.write_text(conteudo, encoding='utf-8')
print(f'Pacote gerado: {saida}')
