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

saida = Path('backend/APPS_SCRIPT_COMPLETO.gs')
saida.write_text('\n'.join(partes).rstrip() + '\n', encoding='utf-8')
print(f'Pacote gerado: {saida}')
