/**
 * FUNCOES UTILITARIAS DO FRONTEND
 */
const Utils = {
  CELULAS_VALIDAS: ['UJC', 'Trabalhadores Genericos'],

  escapeHtml(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Extrai apenas a sigla limpa do camarada (ex: "CMRD V.T." -> "VT", "GS***" -> "GS").
   * Retorna "" se for data, celula, "Nao atribuido" ou texto invalido.
   */
  normalizarSiglaRecrutador(valor) {
    if (!valor) return '';
    const bruto = String(valor).trim();
    if (!bruto) return '';
    if (/nao atribu|não atribu|^ujc$|^trabalhadores|^geral$/i.test(bruto)) return '';
    if (/\d/.test(bruto) || /gmt|hor[aá]rio|email/i.test(bruto)) return '';

    const limpo = bruto
      .replace(/^cmrd\b/i, '')
      .replace(/[.*,\s\-_/()]/g, '')
      .toUpperCase();

    if (!/^[A-Z]{2,5}$/.test(limpo)) return '';
    if (limpo === 'UJC' || limpo === 'GERAL') return '';
    return limpo;
  },

  /**
   * Garante que a celula seja sempre uma das celulas validas ("UJC" ou "Trabalhadores Genericos").
   */
  normalizarCelula(valor) {
    const s = String(valor || '').toLowerCase().trim();
    if (s.includes('trabalhador')) return 'Trabalhadores Genericos';
    return 'UJC';
  },

  /**
   * Normaliza os campos celula e recrutador de um candidato, corrigindo casos
   * em que a sigla do recrutador veio na coluna de celula ou uma data veio na coluna de recrutador.
   */
  normalizarCandidato(c) {
    const siglaRec = Utils.normalizarSiglaRecrutador(c.recrutador);
    const siglaNaCelula = Utils.normalizarSiglaRecrutador(c.celula);

    return Object.assign({}, c, {
      recrutador: siglaRec || siglaNaCelula || 'Nao atribuido',
      celula: Utils.normalizarCelula(c.celula)
    });
  },

  /** Aceita "yyyy-MM-dd", ISO completo ou "dd/MM/yyyy". Retorna Date local ou null. */
  parseData(valor) {
    if (!valor) return null;
    const s = String(valor).trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  },

  formatarDataBR(valor) {
    const d = Utils.parseData(valor);
    if (!d) return valor || '-';
    return String(d.getDate()).padStart(2, '0') + '/' +
      String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  },

  labelStatus(status) {
    return {
      'pendente': 'Pendente',
      'em recrutamento': 'Em Recrutamento',
      'contato': 'Contato',
      'desistencia': 'Desistencia'
    }[status] || status;
  },

  classeStatus(status) {
    return 'status-' + String(status || 'pendente').replace(/\s+/g, '-');
  },

  gerarLinkWhatsApp(tel, nome) {
    if (!tel) return '#';
    let limpo = String(tel).replace(/\D/g, '');
    if (!limpo) return '#';
    if (limpo.length === 10 || limpo.length === 11) limpo = '55' + limpo;
    const primeiroNome = String(nome || '').trim().split(/\s+/)[0] || '';
    const msg = (window.CONFIG.MENSAGEM_WHATSAPP || '').replace('{nome}', primeiroNome);
    return 'https://wa.me/' + limpo + '?text=' + encodeURIComponent(msg);
  }
};
