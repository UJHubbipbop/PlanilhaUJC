/**
 * MODULO DE IMPORTACAO DE DADOS EXTERNOS
 * Disponivel somente pelo menu da planilha (nao exposto na API do site).
 */

function importarViaPrompt() {
  var ui = SpreadsheetApp.getUi();
  var promptRes = ui.prompt(
    'Importar de Outra Planilha',
    'Cole o link ou ID da planilha do Google Sheets de onde deseja importar os dados:\n' +
    '(A Coluna O sera gravada como Ocupacao e a Coluna T como Porque decidiu se organizar na aba "recrutamento")',
    ui.ButtonSet.OK_CANCEL
  );

  if (promptRes.getSelectedButton() !== ui.Button.OK) return;
  var urlOuId = promptRes.getResponseText().trim();
  if (!urlOuId) return;

  var res = importarDeOutraPlanilha(urlOuId, '', 'mesclar');

  if (res.success) {
    ui.alert('Sucesso', 'Foram importados ' + res.importados + ' candidatos da planilha "' + res.planilhaNome + '" para a aba "recrutamento".\n\nColuna O: Ocupacao\nColuna T: Porque decidiu se organizar', ui.ButtonSet.OK);
  } else {
    ui.alert('Falha na Importacao', res.message, ui.ButtonSet.OK);
  }
}

function importarDeOutraPlanilha(urlOuId, nomeAbaOrigem, modoImportacao) {
  try {
    var spreadsheetId = extrairSpreadsheetId(urlOuId);
    var extSs = SpreadsheetApp.openById(spreadsheetId);
    var sourceSheet = nomeAbaOrigem ? extSs.getSheetByName(nomeAbaOrigem) : extSs.getSheets()[0];
    if (!sourceSheet) return { success: false, message: 'Aba nao encontrada na planilha de origem.' };

    var values = sourceSheet.getDataRange().getValues();
    if (values.length <= 1) return { success: false, message: 'Planilha de origem vazia.' };

    var headerRow = values[0];
    var colMap = detectarColunasOrigem(headerRow);

    if (colMap.ocupacao === -1 && headerRow.length >= 15) colMap.ocupacao = 14;
    if (colMap.motivo === -1 && headerRow.length >= 20) colMap.motivo = 19;

    var destSheet = getOuCriarAbaRecrutamento();
    if (modoImportacao === 'substituir') {
      var lastRow = destSheet.getLastRow();
      if (lastRow > 1) destSheet.getRange(2, 1, lastRow - 1, HEADERS.length).clearContent();
    }

    var novosCandidatos = [];
    var agora = new Date().toISOString();

    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var nome = colMap.nome !== -1 ? String(row[colMap.nome] || '').trim() : '';
      if (!nome) continue;

      var celular = colMap.celular !== -1 ? String(row[colMap.celular] || '') : '';
      var email = colMap.email !== -1 ? String(row[colMap.email] || '') : '';
      var idade = colMap.idade !== -1 ? Number(row[colMap.idade]) || '' : '';
      var celula = colMap.celula !== -1 ? String(row[colMap.celula] || 'UJC') : 'UJC';
      var recrutador = colMap.recrutador !== -1 ? String(row[colMap.recrutador] || RECRUTADOR_VAZIO) : RECRUTADOR_VAZIO;
      var status = colMap.status !== -1 ? normalizarStatus(row[colMap.status]) : 'pendente';
      var dataInscricao = colMap.data !== -1 ? formatarData(row[colMap.data]) : agora.slice(0, 10);
      var ocupacao = colMap.ocupacao !== -1 ? String(row[colMap.ocupacao] || '') : '';
      var motivoOrganizar = colMap.motivo !== -1 ? String(row[colMap.motivo] || '') : '';

      novosCandidatos.push([
        'rec-' + (Date.now() + r),
        nome,
        email,
        celular,
        idade,
        celula,
        recrutador,
        status,
        ocupacao,
        motivoOrganizar,
        dataInscricao,
        JSON.stringify([{ id: 'av-' + r, data: agora, autor: 'Importacao', texto: 'Importado de: ' + extSs.getName() }]),
        agora
      ]);
    }

    if (novosCandidatos.length > 0) {
      destSheet.getRange(destSheet.getLastRow() + 1, 1, novosCandidatos.length, HEADERS.length).setValues(novosCandidatos);
    }

    return { success: true, importados: novosCandidatos.length, planilhaNome: extSs.getName() };
  } catch (err) {
    return { success: false, message: 'Erro na importacao: ' + err.toString() };
  }
}

function detectarColunasOrigem(headerRow) {
  var map = { nome: -1, email: -1, celular: -1, idade: -1, celula: -1, recrutador: -1, status: -1, ocupacao: -1, motivo: -1, data: -1 };
  for (var c = 0; c < headerRow.length; c++) {
    var h = String(headerRow[c] || '').toLowerCase().trim();
    if (map.nome === -1 && (h.includes('nome') || h.includes('candidat'))) map.nome = c;
    else if (map.celular === -1 && (h.includes('tel') || h.includes('cel') || h.includes('whats') || h.includes('fone'))) map.celular = c;
    else if (map.email === -1 && (h.includes('email') || h.includes('e-mail'))) map.email = c;
    else if (map.idade === -1 && (h.includes('idade') || h.includes('nascimento'))) map.idade = c;
    else if (map.celula === -1 && (h.includes('celula') || h.includes('célula') || h.includes('grupo') || h.includes('nucleo'))) map.celula = c;
    else if (map.recrutador === -1 && (h.includes('recrutador') || h.includes('responsavel') || h.includes('cmrd'))) map.recrutador = c;
    else if (map.status === -1 && (h.includes('status') || h.includes('situacao') || h.includes('situação'))) map.status = c;
    else if (map.ocupacao === -1 && (h.includes('ocup') || h.includes('trabalho') || h.includes('profiss') || c === 14)) map.ocupacao = c;
    else if (map.motivo === -1 && (h.includes('organizar') || h.includes('motivo') || h.includes('por que') || h.includes('porque') || c === 19)) map.motivo = c;
    else if (map.data === -1 && (h.includes('data') || h.includes('timestamp') || h.includes('carimbo'))) map.data = c;
  }
  return map;
}
