/**
 * API JSON CONSUMIDA PELO SITE (GITHUB PAGES)
 *
 * Todas as requisicoes chegam via POST com corpo JSON enviado como text/plain
 * (evita o preflight CORS). Formato:
 *   { "acao": "dados", "chave": "<chave de acesso>", ...parametros }
 */

function doGet(e) {
  return jsonResponse({ ok: true, servico: 'painel-recrutamento', versao: 2 });
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var acao = String(body.acao || '');
    var papel = autenticar(body.chave);

    if (!papel) {
      return jsonResponse({ ok: false, codigo: 'NAO_AUTORIZADO', erro: 'Chave de acesso invalida.' });
    }

    switch (acao) {
      case 'dados':
        return jsonResponse({
          ok: true,
          papel: papel,
          candidatos: getCandidates(),
          celulas: CELULAS_PADRAO,
          recrutadores: RECRUTADORES_INICIAIS,
          statusOpcoes: STATUS_OPCOES
        });

      case 'alterarStatus':
        exigirAdmin(papel);
        return jsonResponse(updateCandidateStatus(body.id, body.status));

      case 'atribuirRecrutador':
        exigirAdmin(papel);
        return jsonResponse(assignCandidateRecruiter(body.id, body.recrutador));

      case 'adicionarAviso':
        exigirAdmin(papel);
        return jsonResponse(addCandidateAviso(body.id, body.texto));

      default:
        return jsonResponse({ ok: false, codigo: 'ACAO_INVALIDA', erro: 'Acao desconhecida: ' + acao });
    }
  } catch (err) {
    return jsonResponse({
      ok: false,
      codigo: err.codigo || 'ERRO_INTERNO',
      erro: String(err && err.message ? err.message : err)
    });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
