const SPREADSHEET_ID =
  '1Ur2A0wAGxjpfjShdWOuN_-qw7o1qB-AT3JaymrFANGY';

const SHEETS = {
  CONFIG: 'CONFIGURACOES',
  PARTICIPANTES: 'PARTICIPANTES',
  OPERADORES: 'OPERADORES',
  HISTORICO: 'HISTORICO'
};

const SESSION_TTL = 21600; // 6 horas
const MAX_LOGIN_FAILS = 5;
const LOGIN_BLOCK_SECONDS = 900; // 15 minutos


/* ============================================================
   GET
   ============================================================ */

function doGet(e) {

  try {

    const action = String(
      (e && e.parameter && e.parameter.action) || 'status'
    ).trim();


    if (action === 'status') {

      return jsonResponse_({

        ok: true,

        sistema:
          'Sistema de Torneio de Tênis de Mesa – Etec',

        torneio:
          getConfig_('NOME_TORNEIO'),

        statusInscricoes:
          getConfig_('STATUS_INSCRICOES'),

        tipoInscricao:
          getConfig_('TIPO_INSCRICAO'),

        valorInscricao:
          Number(
            getConfig_('VALOR_INSCRICAO') || 0
          ),

        categorias: [
          getConfig_('CATEGORIA_1'),
          getConfig_('CATEGORIA_2')
        ].filter(Boolean)

      });

    }


    if (action === 'participantesPublicos') {

      return jsonResponse_({

        ok: true,

        participantes:
          listarParticipantesPublicos_()

      });

    }


    if (action === 'adminSessao') {

      return jsonResponse_(
        adminSessao_(e.parameter.token)
      );

    }


    if (action === 'participantesAdmin') {

      const sessao =
        exigirSessao_(
          e.parameter.token
        );

      return jsonResponse_({

        ok: true,

        usuario:
          sessao.usuario,

        participantes:
          listarParticipantesAdmin_()

      });

    }


    if (action === 'adminOperadores') {

      const sessao =
        exigirSessao_(
          e.parameter.token,
          'ADMINISTRADOR'
        );

      return jsonResponse_({

        ok: true,

        usuario:
          sessao.usuario,

        operadores:
          listarOperadores_()

      });

    }


    return jsonResponse_({
      ok: false,
      erro: 'ACAO_INVALIDA'
    });


  } catch (err) {

    return erroJson_(err);

  }

}


/* ============================================================
   POST
   ============================================================ */

function doPost(e) {

  const lock =
    LockService.getScriptLock();

  try {

    lock.waitLock(10000);

    const payload =
      parsePayload_(e);

    const action = String(
      payload.action || 'inscricao'
    ).trim();


    if (action === 'inscricao') {

      return jsonResponse_(
        registrarInscricao_(payload)
      );

    }


    if (action === 'adminLogin') {

      return jsonResponse_(
        adminLogin_(payload)
      );

    }


    if (action === 'adminLogout') {

      return jsonResponse_(
        adminLogout_(payload.token)
      );

    }


    if (
      action ===
      'adminAtualizarParticipante'
    ) {

      const sessao =
        exigirSessao_(
          payload.token
        );

      return jsonResponse_(
        adminAtualizarParticipante_(
          payload,
          sessao.usuario
        )
      );

    }


    if (
      action ===
      'adminSalvarOperador'
    ) {

      const sessao =
        exigirSessao_(
          payload.token,
          'ADMINISTRADOR'
        );

      return jsonResponse_(
        adminSalvarOperador_(
          payload,
          sessao.usuario
        )
      );

    }


    if (
      action ===
      'adminStatusOperador'
    ) {

      const sessao =
        exigirSessao_(
          payload.token,
          'ADMINISTRADOR'
        );

      return jsonResponse_(
        adminStatusOperador_(
          payload,
          sessao.usuario
        )
      );

    }


    return jsonResponse_({
      ok: false,
      erro: 'ACAO_INVALIDA'
    });


  } catch (err) {

    return erroJson_(err);


  } finally {

    try {
      lock.releaseLock();
    } catch (_) {}

  }

}


/* ============================================================
   LOGIN ADMINISTRATIVO
   ============================================================ */

function adminLogin_(dados) {

  const email =
    normalizarEmail_(
      dados.email
    );

  const pin =
    String(
      dados.pin || ''
    ).trim();


  if (!email || !pin) {

    return {

      ok: false,

      erro:
        'CREDENCIAIS_OBRIGATORIAS',

      mensagem:
        'Informe e-mail e PIN.'

    };

  }


  const cache =
    CacheService.getScriptCache();

  const chaveFalhas =
    loginFailKey_(email);

  const falhas =
    Number(
      cache.get(chaveFalhas) || 0
    );


  if (
    falhas >= MAX_LOGIN_FAILS
  ) {

    return {

      ok: false,

      erro:
        'LOGIN_BLOQUEADO',

      mensagem:
        'Muitas tentativas incorretas. Aguarde 15 minutos.'

    };

  }


  const operador =
    buscarOperadorPorEmail_(email);


  if (
    !operador ||
    operador.status !== 'ATIVO' ||
    hashPin_(
      operador.pinSalt,
      pin
    ) !== operador.pinHash
  ) {

    cache.put(
      chaveFalhas,
      String(falhas + 1),
      LOGIN_BLOCK_SECONDS
    );


    return {

      ok: false,

      erro:
        'CREDENCIAIS_INVALIDAS',

      mensagem:
        'E-mail ou PIN incorretos.'

    };

  }


  cache.remove(chaveFalhas);


  const token =
    gerarToken_();


  const usuario = {

    id:
      operador.id,

    nome:
      operador.nome,

    email:
      operador.email,

    nivel:
      operador.nivel

  };


  cache.put(

    sessionKey_(token),

    JSON.stringify({
      usuario: usuario
    }),

    SESSION_TTL

  );


  atualizarUltimoLogin_(
    operador.linha
  );


  registrarHistorico_({

    usuario:
      operador.email,

    perfil:
      operador.nivel,

    acao:
      'LOGIN_ADMIN',

    entidade:
      'OPERADORES',

    idRegistro:
      operador.id,

    valorAnterior:
      '',

    valorNovo:
      'LOGIN',

    observacoes:
      'Login no painel administrativo.'

  });


  return {

    ok: true,

    token:
      token,

    usuario:
      usuario,

    expiraEmSegundos:
      SESSION_TTL

  };

}


/* ============================================================
   VALIDAR SESSÃO
   ============================================================ */

function adminSessao_(token) {

  try {

    const sessao =
      exigirSessao_(token);


    return {

      ok: true,

      usuario:
        sessao.usuario,

      expiraEmSegundos:
        SESSION_TTL

    };


  } catch (err) {

    return {

      ok: false,

      erro:
        'NAO_AUTORIZADO',

      mensagem:
        'Sessão inválida ou expirada.'

    };

  }

}


/* ============================================================
   LOGOUT
   ============================================================ */

function adminLogout_(token) {

  if (token) {

    CacheService
      .getScriptCache()
      .remove(
        sessionKey_(token)
      );

  }


  return {

    ok: true,

    mensagem:
      'Sessão encerrada.'

  };

}


/* ============================================================
   EXIGIR SESSÃO
   ============================================================ */

function exigirSessao_(
  token,
  nivelObrigatorio
) {

  token =
    String(token || '').trim();


  if (!token) {

    throw authError_();

  }


  const cache =
    CacheService.getScriptCache();


  const raw =
    cache.get(
      sessionKey_(token)
    );


  if (!raw) {

    throw authError_();

  }


  const sessao =
    JSON.parse(raw);


  const operador =
    buscarOperadorPorEmail_(
      sessao.usuario.email
    );


  if (
    !operador ||
    operador.status !== 'ATIVO'
  ) {

    throw authError_();

  }


  if (
    nivelObrigatorio &&
    operador.nivel !== nivelObrigatorio
  ) {

    throw new Error(
      'ACESSO_NEGADO|Você não possui permissão para esta função.'
    );

  }


  sessao.usuario = {

    id:
      operador.id,

    nome:
      operador.nome,

    email:
      operador.email,

    nivel:
      operador.nivel

  };


  cache.put(

    sessionKey_(token),

    JSON.stringify(sessao),

    SESSION_TTL

  );


  return sessao;

}


/* ============================================================
   INSCRIÇÃO
   ============================================================ */

function registrarInscricao_(dados) {

  const statusInscricoes =
    String(
      getConfig_(
        'STATUS_INSCRICOES'
      ) || ''
    ).toUpperCase();


  if (
    statusInscricoes !== 'ABERTAS'
  ) {

    return {

      ok: false,

      erro:
        'INSCRICOES_ENCERRADAS',

      mensagem:
        'As inscrições não estão abertas neste momento.'

    };

  }


  const nome =
    limparTexto_(
      dados.nomeCompleto ||
      dados.nome
    );

  const turma =
    limparTexto_(
      dados.turma
    );

  const modulo =
    limparTexto_(
      dados.modulo
    );

  const email =
    normalizarEmail_(
      dados.email
    );

  const categoria =
    limparTexto_(
      dados.categoria
    );


  if (
    !nome ||
    !turma ||
    !email ||
    !categoria
  ) {

    return {

      ok: false,

      erro:
        'CAMPOS_OBRIGATORIOS',

      mensagem:
        'Preencha nome, turma, e-mail e categoria.'

    };

  }


  if (!emailValido_(email)) {

    return {

      ok: false,

      erro:
        'EMAIL_INVALIDO',

      mensagem:
        'Informe um e-mail válido.'

    };

  }


  const categorias = [

    String(
      getConfig_('CATEGORIA_1') || ''
    ).trim(),

    String(
      getConfig_('CATEGORIA_2') || ''
    ).trim()

  ].filter(Boolean);


  if (
    !categorias.includes(
      categoria
    )
  ) {

    return {

      ok: false,

      erro:
        'CATEGORIA_INVALIDA',

      mensagem:
        'Selecione uma categoria válida.'

    };

  }


  if (
    emailJaInscrito_(email)
  ) {

    return {

      ok: false,

      erro:
        'EMAIL_JA_INSCRITO',

      mensagem:
        'Já existe uma inscrição vinculada a este e-mail.'

    };

  }


  const tipoInscricao =
    String(
      getConfig_(
        'TIPO_INSCRICAO'
      ) || 'GRATUITA'
    ).toUpperCase();


  const valorInscricao =
    Number(
      getConfig_(
        'VALOR_INSCRICAO'
      ) || 0
    );


  const id =
    gerarId_('P');


  const registro = {

    ID_PARTICIPANTE:
      id,

    DATA_INSCRICAO:
      new Date(),

    NOME_COMPLETO:
      nome,

    TURMA:
      turma,

    MODULO:
      modulo,

    EMAIL:
      email,

    CATEGORIA_ESCOLHIDA:
      categoria,

    CATEGORIA_VALIDADA:
      '',

    STATUS_REVISAO_CATEGORIA:
      'PENDENTE',

    STATUS_INSCRICAO:
      'PENDENTE_REVISAO',

    CABECA_DE_CHAVE:
      false,

    ORDEM_CABECA_CHAVE:
      '',

    RANKING_ANTES_TORNEIO:
      '',

    TIPO_INSCRICAO:
      tipoInscricao,

    VALOR_INSCRICAO:
      valorInscricao,

    STATUS_PAGAMENTO:
      tipoInscricao === 'GRATUITA'
        ? 'ISENTO'
        : 'PENDENTE',

    COMPROVANTE_URL:
      '',

    OBSERVACOES:
      limparTexto_(
        dados.observacoes
      ),

    ATIVO:
      true

  };


  gravarObjetoPrimeiraLinhaLivre_(

    SHEETS.PARTICIPANTES,

    'ID_PARTICIPANTE',

    registro

  );


  registrarHistorico_({

    usuario:
      email,

    perfil:
      'PARTICIPANTE',

    acao:
      'INSCRICAO_REALIZADA',

    entidade:
      'PARTICIPANTES',

    idRegistro:
      id,

    valorAnterior:
      '',

    valorNovo:
      JSON.stringify({

        nome:
          nome,

        turma:
          turma,

        categoriaEscolhida:
          categoria

      }),

    observacoes:
      'Inscrição realizada pelo formulário público.'

  });


  return {

    ok: true,

    idParticipante:
      id,

    status:
      'PENDENTE_REVISAO',

    categoriaEscolhida:
      categoria,

    mensagem:
      'Inscrição recebida com sucesso. A categoria será revisada pela organização.'

  };

}


/* ============================================================
   ADMIN - PARTICIPANTE
   ============================================================ */

function adminAtualizarParticipante_(
  dados,
  usuario
) {

  const id =
    limparTexto_(
      dados.idParticipante
    );

  const categoria =
    limparTexto_(
      dados.categoriaValidada
    );

  const status =
    limparTexto_(
      dados.statusInscricao
    ).toUpperCase();


  if (!id) {

    return {

      ok: false,

      erro:
        'ID_OBRIGATORIO',

      mensagem:
        'Participante não informado.'

    };

  }


  const categorias = [

    String(
      getConfig_('CATEGORIA_1') ||
      'Mesatenistas'
    ).trim(),

    String(
      getConfig_('CATEGORIA_2') ||
      'Recreativo'
    ).trim()

  ];


  if (
    !categorias.includes(
      categoria
    )
  ) {

    return {

      ok: false,

      erro:
        'CATEGORIA_INVALIDA',

      mensagem:
        'Categoria inválida.'

    };

  }


  if (
    ![
      'APROVADO',
      'PENDENTE_REVISAO',
      'CANCELADO'
    ].includes(status)
  ) {

    return {

      ok: false,

      erro:
        'STATUS_INVALIDO',

      mensagem:
        'Status inválido.'

    };

  }


  const sh =
    getSheet_(
      SHEETS.PARTICIPANTES
    );


  const headers =
    getHeaders_(sh);


  const idx =
    indexHeaders_(headers);


  const linha =
    localizarLinhaPorValor_(

      sh,

      idx.ID_PARTICIPANTE + 1,

      id

    );


  if (linha === -1) {

    return {

      ok: false,

      erro:
        'PARTICIPANTE_NAO_ENCONTRADO',

      mensagem:
        'Participante não encontrado.'

    };

  }


  const anterior = {

    categoria:

      sh.getRange(
        linha,
        idx.CATEGORIA_VALIDADA + 1
      ).getValue(),

    status:

      sh.getRange(
        linha,
        idx.STATUS_INSCRICAO + 1
      ).getValue()

  };


  sh.getRange(
    linha,
    idx.CATEGORIA_VALIDADA + 1
  ).setValue(
    categoria
  );


  sh.getRange(
    linha,
    idx.STATUS_INSCRICAO + 1
  ).setValue(
    status
  );


  sh.getRange(
    linha,
    idx.STATUS_REVISAO_CATEGORIA + 1
  ).setValue(

    status ===
    'PENDENTE_REVISAO'

      ? 'PENDENTE'
      : 'REVISADO'

  );


  registrarHistorico_({

    usuario:
      usuario.email,

    perfil:
      usuario.nivel,

    acao:
      'PARTICIPANTE_ATUALIZADO',

    entidade:
      'PARTICIPANTES',

    idRegistro:
      id,

    valorAnterior:
      JSON.stringify(
        anterior
      ),

    valorNovo:
      JSON.stringify({

        categoria:
          categoria,

        status:
          status

      }),

    observacoes:
      'Atualização realizada pelo painel administrativo.'

  });


  return {

    ok: true,

    idParticipante:
      id,

    categoriaValidada:
      categoria,

    statusInscricao:
      status,

    mensagem:
      'Participante atualizado com sucesso.'

  };

}


/* ============================================================
   LISTAR PARTICIPANTES
   ============================================================ */

function listarParticipantesPublicos_() {

  return obterParticipantesValidos_()

    .filter(
      p =>
        p.ativo &&
        p.statusInscricao ===
        'APROVADO'
    )

    .map(
      p => ({

        id:
          p.id,

        nome:
          p.nome,

        turma:
          p.turma,

        categoria:
          p.categoriaValidada ||
          p.categoriaEscolhida,

        status:
          p.statusInscricao

      })
    );

}


function listarParticipantesAdmin_() {

  return obterParticipantesValidos_()

    .filter(
      p => p.ativo
    )

    .map(
      p => ({

        id:
          p.id,

        dataInscricao:
          p.dataInscricao,

        nome:
          p.nome,

        turma:
          p.turma,

        modulo:
          p.modulo,

        email:
          p.email,

        categoriaEscolhida:
          p.categoriaEscolhida,

        categoriaValidada:
          p.categoriaValidada,

        statusRevisao:
          p.statusRevisao,

        statusInscricao:
          p.statusInscricao,

        cabecaDeChave:
          p.cabecaDeChave,

        ordemCabecaChave:
          p.ordemCabecaChave,

        ranking:
          p.ranking,

        observacoes:
          p.observacoes

      })
    );

}


/* ============================================================
   OBTER PARTICIPANTES
   ============================================================ */

function obterParticipantesValidos_() {

  const sh =
    getSheet_(
      SHEETS.PARTICIPANTES
    );


  const valores =
    sh.getRange(

      1,
      1,
      sh.getMaxRows(),
      sh.getLastColumn()

    ).getValues();


  const idx =
    indexHeaders_(
      valores[0].map(String)
    );


  return valores

    .slice(1)

    .filter(
      row =>
        String(
          row[
            idx.ID_PARTICIPANTE
          ] || ''
        ).trim()
    )

    .map(
      row => ({

        id:
          row[idx.ID_PARTICIPANTE],

        dataInscricao:
          row[idx.DATA_INSCRICAO],

        nome:
          row[idx.NOME_COMPLETO],

        turma:
          row[idx.TURMA],

        modulo:
          row[idx.MODULO],

        email:
          row[idx.EMAIL],

        categoriaEscolhida:
          row[
            idx.CATEGORIA_ESCOLHIDA
          ],

        categoriaValidada:
          row[
            idx.CATEGORIA_VALIDADA
          ],

        statusRevisao:
          row[
            idx.STATUS_REVISAO_CATEGORIA
          ],

        statusInscricao:
          String(
            row[
              idx.STATUS_INSCRICAO
            ] || ''
          ).toUpperCase(),

        cabecaDeChave:
          row[
            idx.CABECA_DE_CHAVE
          ],

        ordemCabecaChave:
          row[
            idx.ORDEM_CABECA_CHAVE
          ],

        ranking:
          row[
            idx.RANKING_ANTES_TORNEIO
          ],

        observacoes:
          row[
            idx.OBSERVACOES
          ],

        ativo:

          row[idx.ATIVO] === true ||

          String(
            row[idx.ATIVO]
          ).toUpperCase()
          === 'TRUE'

      })
    );

}


/* ============================================================
   OPERADORES
   ============================================================ */

function listarOperadores_() {

  const sh =
    getSheet_(
      SHEETS.OPERADORES
    );


  const lastRow =
    Math.max(
      sh.getLastRow(),
      1
    );


  const valores =
    sh.getRange(

      1,
      1,
      lastRow,
      sh.getLastColumn()

    ).getValues();


  const idx =
    indexHeaders_(
      valores[0].map(String)
    );


  return valores

    .slice(1)

    .filter(
      row =>
        String(
          row[idx.ID_OPERADOR] || ''
        ).trim()
    )

    .map(
      row => ({

        id:
          row[idx.ID_OPERADOR],

        nome:
          row[idx.NOME],

        email:
          row[idx.EMAIL],

        nivel:
          row[idx.NIVEL_ACESSO],

        status:
          row[idx.STATUS],

        dataCadastro:
          row[idx.DATA_CADASTRO],

        ultimoLogin:
          row[idx.ULTIMO_LOGIN]

      })
    );

}


/* ============================================================
   BUSCAR OPERADOR POR E-MAIL
   ============================================================ */

function buscarOperadorPorEmail_(email) {

  const sh =
    getSheet_(
      SHEETS.OPERADORES
    );


  const headers =
    getHeaders_(sh);


  const idx =
    indexHeaders_(headers);


  const maxRows =
    sh.getMaxRows();


  if (maxRows < 2) {

    return null;

  }


  const valores =
    sh.getRange(

      2,
      1,
      maxRows - 1,
      headers.length

    ).getValues();


  for (
    let i = 0;
    i < valores.length;
    i++
  ) {

    const row =
      valores[i];


    if (

      normalizarEmail_(
        row[idx.EMAIL]
      ) === email

      &&

      String(
        row[idx.ID_OPERADOR] || ''
      ).trim()

    ) {

      return {

        linha:
          i + 2,

        id:
          row[idx.ID_OPERADOR],

        nome:
          row[idx.NOME],

        email:
          normalizarEmail_(
            row[idx.EMAIL]
          ),

        nivel:
          String(
            row[idx.NIVEL_ACESSO] || ''
          ).toUpperCase(),

        status:
          String(
            row[idx.STATUS] || ''
          ).toUpperCase(),

        pinSalt:
          String(
            row[idx.PIN_SALT] || ''
          ),

        pinHash:
          String(
            row[idx.PIN_HASH] || ''
          )

      };

    }

  }


  return null;

}


/* ============================================================
   BUSCAR OPERADOR POR ID
   ============================================================ */

function buscarOperadorPorId_(id) {

  const sh =
    getSheet_(
      SHEETS.OPERADORES
    );


  const headers =
    getHeaders_(sh);


  const idx =
    indexHeaders_(headers);


  const linha =
    localizarLinhaPorValor_(

      sh,

      idx.ID_OPERADOR + 1,

      id

    );


  if (linha === -1) {

    return null;

  }


  const row =
    sh.getRange(
      linha,
      1,
      1,
      headers.length
    ).getValues()[0];


  return {

    linha:
      linha,

    id:
      row[idx.ID_OPERADOR],

    nome:
      row[idx.NOME],

    email:
      normalizarEmail_(
        row[idx.EMAIL]
      ),

    nivel:
      String(
        row[idx.NIVEL_ACESSO] || ''
      ).toUpperCase(),

    status:
      String(
        row[idx.STATUS] || ''
      ).toUpperCase()

  };

}


/* ============================================================
   CADASTRAR OPERADOR
   ============================================================ */

function adminSalvarOperador_(
  dados,
  usuario
) {

  const nome =
    limparTexto_(
      dados.nome
    );

  const email =
    normalizarEmail_(
      dados.email
    );

  const pin =
    String(
      dados.pin || ''
    ).trim();

  const nivel =
    String(
      dados.nivel || 'OPERADOR'
    ).toUpperCase();


  if (
    !nome ||
    !email ||
    !pin
  ) {

    return {

      ok: false,

      erro:
        'CAMPOS_OBRIGATORIOS',

      mensagem:
        'Informe nome, e-mail e PIN.'

    };

  }


  if (!emailValido_(email)) {

    return {

      ok: false,

      erro:
        'EMAIL_INVALIDO',

      mensagem:
        'Informe um e-mail válido.'

    };

  }


  if (pin.length < 6) {

    return {

      ok: false,

      erro:
        'PIN_FRACO',

      mensagem:
        'O PIN deve ter pelo menos 6 caracteres.'

    };

  }


  if (
    ![
      'OPERADOR',
      'ADMINISTRADOR'
    ].includes(nivel)
  ) {

    return {

      ok: false,

      erro:
        'NIVEL_INVALIDO',

      mensagem:
        'Nível de acesso inválido.'

    };

  }


  if (
    buscarOperadorPorEmail_(email)
  ) {

    return {

      ok: false,

      erro:
        'OPERADOR_EXISTENTE',

      mensagem:
        'Já existe um operador com este e-mail.'

    };

  }


  const salt =
    gerarSalt_();


  const id =
    gerarId_('OP');


  const registro = {

    ID_OPERADOR:
      id,

    NOME:
      nome,

    EMAIL:
      email,

    NIVEL_ACESSO:
      nivel,

    STATUS:
      'ATIVO',

    DATA_CADASTRO:
      new Date(),

    OBSERVACOES:
      'Operador cadastrado pelo painel administrativo.',

    PIN_SALT:
      salt,

    PIN_HASH:
      hashPin_(
        salt,
        pin
      ),

    ULTIMO_LOGIN:
      ''

  };


  gravarObjetoPrimeiraLinhaLivre_(

    SHEETS.OPERADORES,

    'ID_OPERADOR',

    registro

  );


  registrarHistorico_({

    usuario:
      usuario.email,

    perfil:
      usuario.nivel,

    acao:
      'OPERADOR_CADASTRADO',

    entidade:
      'OPERADORES',

    idRegistro:
      id,

    valorAnterior:
      '',

    valorNovo:
      JSON.stringify({

        nome:
          nome,

        email:
          email,

        nivel:
          nivel

      }),

    observacoes:
      'Novo operador cadastrado.'

  });


  return {

    ok: true,

    idOperador:
      id,

    mensagem:
      'Operador cadastrado com sucesso.'

  };

}


/* ============================================================
   ATIVAR / DESATIVAR OPERADOR
   ============================================================ */

function adminStatusOperador_(
  dados,
  usuario
) {

  const id =
    limparTexto_(
      dados.idOperador
    );

  const status =
    String(
      dados.status || ''
    ).toUpperCase();


  if (
    ![
      'ATIVO',
      'INATIVO'
    ].includes(status)
  ) {

    return {

      ok: false,

      erro:
        'STATUS_INVALIDO',

      mensagem:
        'Status do operador inválido.'

    };

  }


  const operador =
    buscarOperadorPorId_(id);


  if (!operador) {

    return {

      ok: false,

      erro:
        'OPERADOR_NAO_ENCONTRADO',

      mensagem:
        'Operador não encontrado.'

    };

  }


  if (
    operador.email ===
    usuario.email &&
    status === 'INATIVO'
  ) {

    return {

      ok: false,

      erro:
        'AUTO_DESATIVACAO',

      mensagem:
        'Você não pode desativar o próprio usuário.'

    };

  }


  const sh =
    getSheet_(
      SHEETS.OPERADORES
    );


  const headers =
    getHeaders_(sh);


  const idx =
    indexHeaders_(headers);


  const anterior =
    sh.getRange(
      operador.linha,
      idx.STATUS + 1
    ).getValue();


  sh.getRange(
    operador.linha,
    idx.STATUS + 1
  ).setValue(
    status
  );


  registrarHistorico_({

    usuario:
      usuario.email,

    perfil:
      usuario.nivel,

    acao:
      'STATUS_OPERADOR_ALTERADO',

    entidade:
      'OPERADORES',

    idRegistro:
      id,

    valorAnterior:
      anterior,

    valorNovo:
      status,

    observacoes:
      'Status de operador alterado.'

  });


  return {

    ok: true,

    mensagem:
      'Status do operador atualizado com sucesso.'

  };

}


/* ============================================================
   ATUALIZAR ÚLTIMO LOGIN
   ============================================================ */

function atualizarUltimoLogin_(linha) {

  const sh =
    getSheet_(
      SHEETS.OPERADORES
    );


  const idx =
    indexHeaders_(
      getHeaders_(sh)
    );


  sh.getRange(

    linha,

    idx.ULTIMO_LOGIN + 1

  ).setValue(
    new Date()
  );

}


/* ============================================================
   E-MAIL JÁ INSCRITO
   ============================================================ */

function emailJaInscrito_(email) {

  return obterParticipantesValidos_()
    .some(
      p =>
        p.ativo &&
        normalizarEmail_(
          p.email
        ) === email
    );

}


/* ============================================================
   HISTÓRICO
   ============================================================ */

function registrarHistorico_(dados) {

  const registro = {

    ID_EVENTO:
      gerarId_('H'),

    DATA_HORA:
      new Date(),

    USUARIO:
      dados.usuario || '',

    PERFIL:
      dados.perfil || '',

    ACAO:
      dados.acao || '',

    ENTIDADE:
      dados.entidade || '',

    ID_REGISTRO:
      dados.idRegistro || '',

    VALOR_ANTERIOR:
      dados.valorAnterior || '',

    VALOR_NOVO:
      dados.valorNovo || '',

    OBSERVACOES:
      dados.observacoes || ''

  };


  gravarObjetoPrimeiraLinhaLivre_(

    SHEETS.HISTORICO,

    'ID_EVENTO',

    registro

  );

}


/* ============================================================
   GRAVAR NA PRIMEIRA LINHA LIVRE
   ============================================================ */

function gravarObjetoPrimeiraLinhaLivre_(
  nomeAba,
  colunaId,
  objeto
) {

  const sh =
    getSheet_(nomeAba);


  const headers =
    getHeaders_(sh);


  const idIndex =
    headers.indexOf(
      colunaId
    );


  if (idIndex === -1) {

    throw new Error(
      'Coluna não encontrada: ' +
      colunaId
    );

  }


  const linha =
    primeiraLinhaLivrePorColuna_(

      sh,

      idIndex + 1,

      2

    );


  const row =
    headers.map(
      header =>

        Object.prototype
          .hasOwnProperty
          .call(
            objeto,
            header
          )

          ? objeto[header]
          : ''

    );


  sh.getRange(

    linha,

    1,

    1,

    row.length

  ).setValues([
    row
  ]);

}


/* ============================================================
   PRIMEIRA LINHA LIVRE
   ============================================================ */

function primeiraLinhaLivrePorColuna_(
  sh,
  coluna,
  inicio
) {

  inicio =
    inicio || 2;


  const maxRows =
    sh.getMaxRows();


  const valores =
    sh.getRange(

      inicio,

      coluna,

      maxRows -
      inicio +
      1,

      1

    )
    .getDisplayValues()
    .flat();


  for (
    let i = 0;
    i < valores.length;
    i++
  ) {

    if (
      String(
        valores[i]
      ).trim() === ''
    ) {

      return inicio + i;

    }

  }


  sh.insertRowAfter(
    sh.getMaxRows()
  );


  return sh.getMaxRows();

}


/* ============================================================
   LOCALIZAR LINHA
   ============================================================ */

function localizarLinhaPorValor_(
  sh,
  coluna,
  valor
) {

  const maxRows =
    sh.getMaxRows();


  if (maxRows < 2) {

    return -1;

  }


  const valores =
    sh.getRange(

      2,

      coluna,

      maxRows - 1,

      1

    )
    .getDisplayValues()
    .flat();


  for (
    let i = 0;
    i < valores.length;
    i++
  ) {

    if (
      String(
        valores[i]
      ).trim() ===
      String(valor).trim()
    ) {

      return i + 2;

    }

  }


  return -1;

}


/* ============================================================
   CONFIGURAÇÕES
   ============================================================ */

function getConfig_(campo) {

  const sh =
    getSheet_(
      SHEETS.CONFIG
    );


  const lastRow =
    sh.getLastRow();


  if (lastRow < 2) {

    return '';

  }


  const valores =
    sh.getRange(

      2,

      1,

      lastRow - 1,

      2

    ).getValues();


  for (
    let i = 0;
    i < valores.length;
    i++
  ) {

    if (
      String(
        valores[i][0]
      ).trim() === campo
    ) {

      return valores[i][1];

    }

  }


  return '';

}


/* ============================================================
   HELPERS DE PLANILHA
   ============================================================ */

function getSheet_(nome) {

  const ss =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );


  const sh =
    ss.getSheetByName(nome);


  if (!sh) {

    throw new Error(
      'Aba não encontrada: ' +
      nome
    );

  }


  return sh;

}


function getHeaders_(sh) {

  return sh
    .getRange(
      1,
      1,
      1,
      sh.getLastColumn()
    )
    .getValues()[0]
    .map(String);

}


function indexHeaders_(headers) {

  const idx = {};


  headers.forEach(
    (header, i) => {

      idx[
        String(header).trim()
      ] = i;

    }
  );


  return idx;

}


/* ============================================================
   PIN / HASH
   ============================================================ */

function gerarSalt_() {

  return Utilities
    .getUuid()
    .replace(/-/g, '');

}


function hashPin_(
  salt,
  pin
) {

  return hashTexto_(
    String(salt) +
    String(pin)
  );

}


function hashTexto_(texto) {

  const digest =
    Utilities.computeDigest(

      Utilities.DigestAlgorithm.SHA_256,

      String(texto),

      Utilities.Charset.UTF_8

    );


  return digest
    .map(
      byte => {

        const value =
          byte < 0
            ? byte + 256
            : byte;

        return (
          '0' +
          value.toString(16)
        ).slice(-2);

      }
    )
    .join('');

}


/* ============================================================
   TOKEN / CACHE
   ============================================================ */

function gerarToken_() {

  return (

    Utilities
      .getUuid()
      .replace(/-/g, '')

    +

    Utilities
      .getUuid()
      .replace(/-/g, '')

  );

}


function sessionKey_(token) {

  return (
    'tm_session_' +
    token
  );

}


function loginFailKey_(email) {

  return (
    'tm_fail_' +
    hashTexto_(email)
      .slice(0, 32)
  );

}


/* ============================================================
   ERROS
   ============================================================ */

function authError_() {

  return new Error(
    'NAO_AUTORIZADO|Sessão inválida ou expirada.'
  );

}


function erroJson_(err) {

  const mensagem =
    String(
      err &&
      err.message
        ? err.message
        : err
    );


  const partes =
    mensagem.split('|');


  if (
    partes.length > 1
  ) {

    return jsonResponse_({

      ok: false,

      erro:
        partes.shift(),

      mensagem:
        partes.join('|')

    });

  }


  return jsonResponse_({

    ok: false,

    erro:
      'ERRO_INTERNO',

    mensagem:
      mensagem

  });

}


/* ============================================================
   PAYLOAD
   ============================================================ */

function parsePayload_(e) {

  if (!e) {

    return {};

  }


  if (
    e.postData &&
    e.postData.contents
  ) {

    const type =
      String(
        e.postData.type || ''
      ).toLowerCase();


    if (
      type.includes(
        'application/json'
      )
    ) {

      return JSON.parse(
        e.postData.contents
      );

    }

  }


  return e.parameter || {};

}


/* ============================================================
   TEXTO / EMAIL
   ============================================================ */

function limparTexto_(valor) {

  return String(
    valor || ''
  )
    .trim()
    .replace(
      /\s+/g,
      ' '
    );

}


function normalizarEmail_(valor) {

  return String(
    valor || ''
  )
    .trim()
    .toLowerCase();

}


function emailValido_(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}


/* ============================================================
   ID
   ============================================================ */

function gerarId_(prefixo) {

  const data =

    Utilities.formatDate(

      new Date(),

      Session
        .getScriptTimeZone() ||
        'America/Sao_Paulo',

      'yyyyMMddHHmmss'

    );


  const aleatorio =

    Math.floor(
      1000 +
      Math.random() * 9000
    );


  return (
    prefixo +
    '-' +
    data +
    '-' +
    aleatorio
  );

}


/* ============================================================
   JSON
   ============================================================ */

function jsonResponse_(objeto) {

  return ContentService

    .createTextOutput(
      JSON.stringify(objeto)
    )

    .setMimeType(
      ContentService.MimeType.JSON
    );

}
