/**
 * MODULO DE IMPORTACAO E SINCRONIZACAO COM A PLANILHA ORIGINAL
 * Estrutura com todas as 25 colunas originais + 2 de controle do sistema
 */

function clonarAbaOriginal() {
  var ui = SpreadsheetApp.getUi();
  var promptRes = ui.prompt(
    'Clonar Planilha Original (Copia 1:1)',
    'Cole o link ou ID da planilha ORIGINAL:\n' +
    '(Isso vai criar uma aba identica com 100% de todas as colunas e linhas da planilha original)',
    ui.ButtonSet.OK_CANCEL
  );

  if (promptRes.getSelectedButton() !== ui.Button.OK) return;
  var urlOuId = promptRes.getResponseText().trim();
  if (!urlOuId) return;

  try {
    var spreadsheetId = extrairSpreadsheetId(urlOuId);
    var extSs = SpreadsheetApp.openById(spreadsheetId);
    var sourceSheet = extSs.getSheets()[0];
    var destSs = SpreadsheetApp.getActiveSpreadsheet();

    var novaAba = sourceSheet.copyTo(destSs);
    var nomeBase = 'original_' + sourceSheet.getName();
    var nomeFinal = nomeBase;
    var contador = 1;

    while (destSs.getSheetByName(nomeFinal)) {
      nomeFinal = nomeBase + '_' + contador;
      contador++;
    }
    novaAba.setName(nomeFinal);

    ui.alert(
      'Aba Clonada com Sucesso!',
      'Todas as linhas e colunas da planilha "' + extSs.getName() + '" foram copiadas exatamente como estao para a nova aba:\n\n' +
      'Nome da nova aba: "' + nomeFinal + '"\n\n' +
      'Linhas copiadas: ' + novaAba.getLastRow() + '\n' +
      'Colunas copiadas: ' + novaAba.getLastColumn(),
      ui.ButtonSet.OK
    );
  } catch (err) {
    ui.alert(
      'Erro ao clonar planilha',
      'Nao foi possivel acessar a planilha original:\n' + err.message +
      '\n\nCertifique-se de que sua conta Google tem permissao de acesso a planilha original.',
      ui.ButtonSet.OK
    );
  }
}

function sincronizarRecrutamentoDoZero() {
  var ui = SpreadsheetApp.getUi();
  var confirmacao = ui.alert(
    'Sincronizar Todas as 25 Colunas da Planilha Original',
    'Esta acao vai reconstruir a aba "recrutamento" trazendo todas as 25 colunas originais:\n' +
    '(ID, Nome, Telefone, Email, Celula, Situacao, Recrutador, Prioridade, Redes, Municipio, Atuacao, Setor, Motivo, Idade, Genero, etc.)\n\n' +
    'Deseja continuar?',
    ui.ButtonSet.YES_NO
  );

  if (confirmacao !== ui.Button.YES) return;

  var promptRes = ui.prompt(
    'Planilha Original',
    'Cole o link ou ID da planilha ORIGINAL:',
    ui.ButtonSet.OK_CANCEL
  );

  if (promptRes.getSelectedButton() !== ui.Button.OK) return;
  var urlOuId = promptRes.getResponseText().trim();
  if (!urlOuId) return;

  ui.alert('Iniciando Sincronizacao', 'Clique em OK e aguarde alguns segundos enquanto os dados sao copiados...', ui.ButtonSet.OK);

  var res = importarDeOutraPlanilha(urlOuId, '', 'substituir');

  if (res.success) {
    ui.alert(
      'Sincronizacao Concluida com Sucesso!',
      'Foram importados ' + res.importados + ' candidatos da planilha "' + res.planilhaNome + '"!\n\n' +
      'Todas as 25 colunas foram importadas e normalizadas na aba "recrutamento".\n' +
      'Abra o site e clique no botao "Atualizar" para ver todas as novas informacoes!',
      ui.ButtonSet.OK
    );
  } else {
    ui.alert('Falha na Sincronizacao', res.message, ui.ButtonSet.OK);
  }
}

function importarViaPrompt() {
  sincronizarRecrutamentoDoZero();
}

function importarDeOutraPlanilha(urlOuId, nomeAbaOrigem, modoImportacao) {
  try {
    var spreadsheetId = extrairSpreadsheetId(urlOuId);
    var extSs = SpreadsheetApp.openById(spreadsheetId);
    var sourceSheet = nomeAbaOrigem ? extSs.getSheetByName(nomeAbaOrigem) : extSs.getSheets()[0];
    if (!sourceSheet) return { success: false, message: 'Aba nao encontrada na planilha de origem.' };

    var values = sourceSheet.getDataRange().getValues();
    if (values.length <= 1) return { success: false, message: 'Planilha de origem vazia.' };

    var destSheet = getOuCriarAbaRecrutamento();

    var lastRowAtual = destSheet.getLastRow();
    if (lastRowAtual > 1) {
      destSheet.getRange(2, 1, lastRowAtual - 1, destSheet.getMaxColumns()).clearContent();
    }

    var novosCandidatos = [];
    var agora = new Date().toISOString();

    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var nomeLinha = String(row[1] || row[9] || row[0] || '').trim();
      if (!nomeLinha) continue;

      var linhaNova = new Array(HEADERS.length);

      for (var colIdx = 0; colIdx < 25; colIdx++) {
        var val = (colIdx < row.length && row[colIdx] !== undefined) ? row[colIdx] : '';
        linhaNova[colIdx] = val;
      }

      // 1. Se o ID estiver vazio na coluna 1, gera um ID unico limpo
      if (!String(linhaNova[0] || '').trim()) {
        var numFormatado = r < 10 ? '00' + r : (r < 100 ? '0' + r : String(r));
        linhaNova[0] = 'rec-' + numFormatado;
      }

      // 2. Normaliza a Situacao/Status (coluna F / indice 5)
      var statusOriginal = String(linhaNova[5] || '').trim();
      linhaNova[5] = normalizarStatus(statusOriginal);

      // 3. Normaliza Recrutador (extraindo sigla limpa se estiver na coluna G ou na coluna E)
      var siglaRec = normalizarSiglaRecrutador(linhaNova[6]) || normalizarSiglaRecrutador(linhaNova[4]);
      var celulaLimpa = normalizarCelula(linhaNova[4]);

      linhaNova[4] = celulaLimpa;
      linhaNova[6] = siglaRec || RECRUTADOR_VAZIO;

      // 4. Formata a Data de Inscricao (coluna Y / indice 24) se for objeto Data
      if (linhaNova[24]) {
        linhaNova[24] = formatarData(linhaNova[24]);
      } else {
        linhaNova[24] = agora.slice(0, 10);
      }

      // 5. Coluna 26: Historico e Avisos
      linhaNova[25] = JSON.stringify([{
        id: 'av-' + r,
        data: agora,
        autor: 'Importacao',
        texto: 'Importado da planilha original: ' + extSs.getName()
      }]);

      // 6. Coluna 27: Ultima Atualizacao
      linhaNova[26] = agora;

      novosCandidatos.push(linhaNova);
    }

    if (novosCandidatos.length > 0) {
      destSheet.getRange(2, 1, novosCandidatos.length, HEADERS.length).setValues(novosCandidatos);
    }

    return { success: true, importados: novosCandidatos.length, planilhaNome: extSs.getName() };
  } catch (err) {
    return { success: false, message: 'Erro na importacao: ' + err.toString() };
  }
}
