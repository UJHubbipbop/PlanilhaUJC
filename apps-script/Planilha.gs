/**
 * GESTAO E INICIALIZACAO DA PLANILHA
 */

function getOuCriarAbaRecrutamento() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setBackground('#7f1d1d')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function inicializarAba() {
  getOuCriarAbaRecrutamento();
  SpreadsheetApp.getActiveSpreadsheet().toast('Aba "recrutamento" verificada com sucesso.', 'Status');
}

/**
 * Retorna o numero da linha (base 1) do candidato com o ID informado, ou -1.
 */
function encontrarLinhaPorId(sheet, candidateId) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  var ids = sheet.getRange(2, COL.ID, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(candidateId)) return i + 2;
  }
  return -1;
}
