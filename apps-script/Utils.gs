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

/**
 * Extrai apenas a sigla limpa do camarada (ex: "CMRD V.T." -> "VT", "GS***" -> "GS").
 * Retorna "" se for data, celula, "Nao atribuido" ou invalido.
 */
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

/**
 * Garante que a celula seja apenas "UJC" ou "Trabalhadores Genericos".
 */
function normalizarCelula(valor) {
  var s = String(valor || '').toLowerCase().trim();
  if (s.includes('trabalhador')) return 'Trabalhadores Genericos';
  return 'UJC';
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
