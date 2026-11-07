/**
 * COMUNICACAO COM A API (Google Apps Script Web App)
 */

const Sessao = {
  CHAVE_STORAGE: 'painel-recrutamento-chave',

  getChave() {
    return sessionStorage.getItem(this.CHAVE_STORAGE) || localStorage.getItem(this.CHAVE_STORAGE) || '';
  },

  salvar(chave, lembrar) {
    this.limpar();
    (lembrar ? localStorage : sessionStorage).setItem(this.CHAVE_STORAGE, chave);
  },

  limpar() {
    sessionStorage.removeItem(this.CHAVE_STORAGE);
    localStorage.removeItem(this.CHAVE_STORAGE);
  }
};

const Api = {
  /**
   * Envia POST com JSON como text/plain (requisicao "simples", sem preflight CORS,
   * que o Apps Script nao suporta).
   */
  async chamar(acao, parametros = {}, chave = Sessao.getChave()) {
    const url = window.CONFIG.API_URL;
    if (!url || url.indexOf('COLE_AQUI') !== -1) {
      throw new Error('A URL da API nao foi configurada em assets/js/config.js.');
    }

    let resp;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ acao: acao, chave: chave }, parametros)),
        redirect: 'follow'
      });
    } catch (e) {
      throw new Error('Nao foi possivel conectar ao servidor. Verifique sua conexao.');
    }

    if (!resp.ok) throw new Error('Falha de comunicacao com o servidor (' + resp.status + ').');

    let json;
    try {
      json = await resp.json();
    } catch (e) {
      throw new Error('Resposta invalida do servidor. Confira se o Web App esta implantado com acesso "Qualquer pessoa".');
    }

    if (!json.ok) {
      const erro = new Error(json.erro || 'Erro desconhecido.');
      erro.codigo = json.codigo;
      throw erro;
    }
    return json;
  },

  carregarDados(chave) {
    return this.chamar('dados', {}, chave);
  },

  alterarStatus(id, status) {
    return this.chamar('alterarStatus', { id: id, status: status });
  },

  atribuirRecrutador(id, recrutador) {
    return this.chamar('atribuirRecrutador', { id: id, recrutador: recrutador });
  },

  adicionarAviso(id, texto) {
    return this.chamar('adicionarAviso', { id: id, texto: texto });
  }
};
