/**
 * OPERACOES DE LEITURA E ESCRITA DE CANDIDATOS
 * (as permissoes sao verificadas em Api.gs antes de chegar aqui)
 */

function getCandidates() {
  var sheet = getOuCriarAbaRecrutamento();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  var candidates = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[1]) continue;

    candidates.push({
      id: String(row[0] || ('rec-' + (i + 1))),
      nome: String(row[1] || ''),
      email: String(row[2] || ''),
      celular: String(row[3] || ''),
      idade: Number(row[4]) || null,
      celula: String(row[5] || 'UJC'),
      recrutador: String(row[6] || RECRUTADOR_VAZIO),
      status: normalizarStatus(row[7]),
      trabalho: String(row[8] || ''),
      motivoInscricao: String(row[9] || ''),
      dataInscricao: formatarData(row[10]),
      avisos: lerHistorico(row[11]),
      ultimaAtualizacao: row[12] ? formatarData(row[12]) : ''
    });
  }
  return candidates;
}

function updateCandidateStatus(candidateId, newStatus) {
  return comLock(function () {
    var sheet = getOuCriarAbaRecrutamento();
    var rowNum = encontrarLinhaPorId(sheet, candidateId);
    if (rowNum === -1) return { ok: false, erro: 'Candidato nao encontrado.' };

    var statusNormalizado = normalizarStatus(newStatus);
    sheet.getRange(rowNum, COL.STATUS).setValue(statusNormalizado);
    sheet.getRange(rowNum, COL.ULTIMA_ATUALIZACAO).setValue(new Date().toISOString());
    var aviso = adicionarAvisoInterno(sheet, rowNum, 'Status alterado para: ' + statusNormalizado, 'status_change');
    return { ok: true, status: statusNormalizado, aviso: aviso };
  });
}

function assignCandidateRecruiter(candidateId, newRecruiter) {
  return comLock(function () {
    var recrutador = String(newRecruiter || '').trim() || RECRUTADOR_VAZIO;
    var sheet = getOuCriarAbaRecrutamento();
    var rowNum = encontrarLinhaPorId(sheet, candidateId);
    if (rowNum === -1) return { ok: false, erro: 'Candidato nao encontrado.' };

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
 * Evita que duas edicoes simultaneas sobrescrevam o historico uma da outra.
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
