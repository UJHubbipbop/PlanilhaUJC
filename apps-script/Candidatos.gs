/**
 * OPERACOES DE LEITURA E ESCRITA DE CANDIDATOS
 */

function getCandidates() {
  var sheet = getOuCriarAbaRecrutamento();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  var candidates = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    // Se linha inteira estiver vazia (sem ID e sem Nome)
    if (!row[0] && !row[1] && !row[9]) continue;

    var nome = escolherNome(row[COL.NOME - 1], row[COL.NOME_FORM - 1]);
    var telefone = escolherTelefone(row[COL.TELEFONE - 1], row[COL.TEL_FORM - 1]);
    var email = escolherEmail(row[COL.EMAIL - 1], row[COL.EMAIL_FORM - 1]);

    var valorColCelula = row[COL.CELULA - 1];
    var valorColRecrutador = row[COL.RECRUTADOR - 1];

    var siglaRec = normalizarSiglaRecrutador(valorColRecrutador) || normalizarSiglaRecrutador(valorColCelula);
    var celulaLimpa = normalizarCelula(valorColCelula);

    candidates.push({
      id: String(row[COL.ID - 1] || ('rec-' + (i + 1))),
      nome: nome,
      celular: telefone,
      email: email,
      celula: celulaLimpa,
      status: normalizarStatus(row[COL.SITUACAO - 1]),
      recrutador: siglaRec || RECRUTADOR_VAZIO,
      prioridade: String(row[COL.PRIORIDADE - 1] || '').trim(),
      redesSociais: String(row[COL.REDES_SOCIAIS - 1] || '').trim(),
      municipio: String(row[COL.MUNICIPIO - 1] || '').trim(),
      regiaoMunicipal: String(row[COL.REGIAO_MUNICIPAL - 1] || '').trim(),
      trabalho: String(row[COL.ATUACAO_PROFISSIONAL - 1] || '').trim(),
      setorEstrategico: String(row[COL.SETOR_ESTRATEGICO - 1] || '').trim(),
      regimeContratual: String(row[COL.REGIME_CONTRATUAL - 1] || '').trim(),
      nivelEnsino: String(row[COL.NIVEL_ENSINO - 1] || '').trim(),
      entidadeAtua: String(row[COL.ENTIDADE_ATUA - 1] || '').trim(),
      motivoInscricao: String(row[COL.MOTIVO_ORGANIZAR - 1] || '').trim(),
      idade: Number(row[COL.IDADE - 1]) || null,
      genero: String(row[COL.GENERO - 1] || '').trim(),
      pronomes: String(row[COL.PRONOMES - 1] || '').trim(),
      comoAcompanhava: String(row[COL.COMO_ACOMPANHAVA - 1] || '').trim(),
      dataInscricao: formatarData(row[COL.DATA_INSCRICAO - 1]),
      avisos: lerHistorico(row[COL.HISTORICO - 1]),
      ultimaAtualizacao: row[COL.ULTIMA_ATUALIZACAO - 1] ? formatarData(row[COL.ULTIMA_ATUALIZACAO - 1]) : ''
    });
  }
  return candidates;
}

function ehNomeValido(valor) {
  if (!valor || valor instanceof Date) return false;
  var s = String(valor).trim();
  if (!s || s.indexOf('@') !== -1) return false;
  if (/^\d+$/.test(s)) return false;
  if (/gmt|hor[aá]rio/i.test(s)) return false;
  return /[a-zA-ZÀ-ÿ]{2,}/.test(s);
}

function escolherNome(colPrincipal, colFormulario) {
  if (ehNomeValido(colFormulario)) return String(colFormulario).trim();
  if (ehNomeValido(colPrincipal)) return String(colPrincipal).trim();
  return String(colFormulario || colPrincipal || 'Sem nome').trim();
}

function escolherTelefone(colPrincipal, colFormulario) {
  var dForm = String(colFormulario || '').replace(/\D/g, '');
  if (dForm.length >= 8) return String(colFormulario).trim();
  var dPrin = String(colPrincipal || '').replace(/\D/g, '');
  if (dPrin.length >= 8) return String(colPrincipal).trim();
  return String(colFormulario || colPrincipal || '').trim();
}

function escolherEmail(colPrincipal, colFormulario) {
  var eForm = String(colFormulario || '').trim();
  if (eForm.indexOf('@') !== -1) return eForm;
  var ePrin = String(colPrincipal || '').trim();
  if (ePrin.indexOf('@') !== -1) return ePrin;
  return eForm || ePrin || '';
}

function normalizarSiglaRecrutador(valor) {
  if (!valor) return '';
  var bruto = String(valor).trim();
  if (!bruto) return '';
  if (/nao atribu|não atribu|^ujc$|^trabalhadores|^geral$/i.test(bruto)) return '';
  if (/\d/.test(bruto) || /gmt|hor[aá]rio|email/i.test(bruto)) return '';

  var limpo = bruto
    .replace(/^cmrd\b/i, '')
    .replace(/[.*,\s\-_/()]/g, '')
    .toUpperCase();

  if (!/^[A-Z]{2,5}$/.test(limpo)) return '';
  if (limpo === 'UJC' || limpo === 'GERAL') return '';
  return limpo;
}

function normalizarCelula(valor) {
  var s = String(valor || '').toLowerCase().trim();
  if (s.includes('trabalhador')) return 'Trabalhadores Genericos';
  return 'UJC';
}

function updateCandidateStatus(candidateId, newStatus) {
  return comLock(function () {
    var sheet = getOuCriarAbaRecrutamento();
    var rowNum = encontrarLinhaPorId(sheet, candidateId);
    if (rowNum === -1) return { ok: false, erro: 'Candidato nao encontrado.' };

    var statusNormalizado = normalizarStatus(newStatus);
    sheet.getRange(rowNum, COL.SITUACAO).setValue(statusNormalizado);
    sheet.getRange(rowNum, COL.ULTIMA_ATUALIZACAO).setValue(new Date().toISOString());
    var aviso = adicionarAvisoInterno(sheet, rowNum, 'Status alterado para: ' + statusNormalizado, 'status_change');
    return { ok: true, status: statusNormalizado, aviso: aviso };
  });
}

function assignCandidateRecruiter(candidateId, newRecruiter) {
  return comLock(function () {
    var sigla = normalizarSiglaRecrutador(newRecruiter);
    var recrutador = sigla || RECRUTADOR_VAZIO;
    var sheet = getOuCriarAbaRecrutamento();
    var rowNum = encontrarLinhaPorId(sheet, candidateId);
    if (rowNum === -1) return { ok: false, erro: 'Candidato nao encontrado.' };

    var celAtual = sheet.getRange(rowNum, COL.CELULA).getValue();
    sheet.getRange(rowNum, COL.CELULA).setValue(normalizarCelula(celAtual));

    sheet.getRange(rowNum, COL.RECRUTADOR).setValue(recrutador);
    sheet.getRange(rowNum, COL.ULTIMA_ATUALIZACAO).setValue(new Date().toISOString());
    var aviso = adicionarAvisoInterno(sheet, rowNum, 'Recrutador atribuido: ' + recrutador, 'aviso');
    return { ok: true, recrutador: recrutador, aviso: aviso };
  });
}

function addCandidateAviso(candidateId, texto) {
  var txt = String(texto || '').trim();
  if (!txt) return { ok: false, erro: 'O texto da anotacao esta vazio.' };
  if (txt.length > 2000) return { ok: false, erro: 'Anotacao muito longa (maximo 2000 caracteres).' };

  return comLock(function () {
    var sheet = getOuCriarAbaRecrutamento();
    var rowNum = encontrarLinhaPorId(sheet, candidateId);
    if (rowNum === -1) return { ok: false, erro: 'Candidato nao encontrado.' };

    var aviso = adicionarAvisoInterno(sheet, rowNum, txt, 'anotacao');
    sheet.getRange(rowNum, COL.ULTIMA_ATUALIZACAO).setValue(new Date().toISOString());
    return { ok: true, aviso: aviso };
  });
}

function adicionarAvisoInterno(sheet, rowNum, texto, tipo) {
  var range = sheet.getRange(rowNum, COL.HISTORICO);
  var lista = lerHistorico(range.getValue());
  var aviso = {
    id: 'av-' + Date.now(),
    data: new Date().toISOString(),
    autor: 'Proprietario',
    texto: texto,
    tipo: tipo || 'aviso'
  };
  lista.unshift(aviso);
  range.setValue(JSON.stringify(lista));
  return aviso;
}

function lerHistorico(valor) {
  if (!valor) return [];
  try {
    var lista = JSON.parse(valor);
    return Array.isArray(lista) ? lista : [];
  } catch (e) {
    return [{ id: 'av-legado', data: '', autor: 'Sistema', texto: String(valor) }];
  }
}

/**
 * Evita que duas edicoes simultaneas sobrescrevam dados
 */
function comLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}
