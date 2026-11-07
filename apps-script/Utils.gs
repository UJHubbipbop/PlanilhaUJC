/**
 * FUNCOES UTILITARIAS E HELPERS
 */

function normalizarStatus(st) {
  if (!st) return 'pendente';
  var s = String(st).toLowerCase().trim();
  if (s.includes('recrut') || s.includes('andamento')) return 'em recrutamento';
  if (s.includes('contat') || s.includes('lig') || s.includes('mensag')) return 'contato';
  if (s.includes('desist') || s.includes('cancel') || s.includes('recus')) return 'desistencia';
  return 'pendente';
}

function extrairSpreadsheetId(urlOuId) {
  if (!urlOuId) return '';
  var trimmed = String(urlOuId).trim();
  var match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  return trimmed;
}

function formatarData(dt) {
  if (!dt) return '';
  if (dt instanceof Date) return Utilities.formatDate(dt, Session.getScriptTimeZone() || 'America/Sao_Paulo', 'yyyy-MM-dd');
  var s = String(dt);
  return s.includes('T') ? s.slice(0, 10) : s;
}
