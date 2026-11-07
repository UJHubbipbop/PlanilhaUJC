/**
 * FUNCOES UTILITARIAS DO FRONTEND
 */
const Utils = {
  escapeHtml(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
