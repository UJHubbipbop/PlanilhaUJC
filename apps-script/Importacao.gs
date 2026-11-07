/**
 * MODULO DE IMPORTACAO E SINCRONIZACAO COM A PLANILHA ORIGINAL
 * Disponivel pelo menu da planilha para o proprietario.
 */

/**
 * Clona 100% da aba da planilha original (todas as linhas e colunas identicas, sem perder nada)
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

    // Copia a aba inteira intacta
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
      '\n\nCertifique-se de que sua conta Google tem permissao de acesso (pelo menos leitor) a planilha original.',
      ui.ButtonSet.OK
    );
  }
}

/**
 * Puxa os dados da planilha original e substitui tudo na aba 'recrutamento' do projeto
 */
function sincronizarRecrutamentoDoZero() {
  var ui = SpreadsheetApp.getUi();
  var confirmacao = ui.alert(
    'Sincronizar Aba recrutamento (Substituir Tudo)',
    'Esta acao vai limpar os dados antigos/incompletos da aba "recrutamento" e recriar tudo a partir da planilha original.\n\nDeseja continuar?',
    ui.ButtonSet.YES_NO
  );

  if (confirmacao !== ui.Button.YES) return;

  var promptRes = ui.prompt(
    'Planilha Original',
    'Cole o link ou ID da planilha ORIGINAL de onde devemos puxar os dados completos:',
    ui.ButtonSet.OK_CANCEL
  );

  if (promptRes.getSelectedButton() !== ui.Button.OK) return;
  var urlOuId = promptRes.getResponseText().trim();
  if (!urlOuId) return;

  ui.alert('Iniciando Sincronizacao', 'Clique em OK e aguarde alguns segundos enquanto os dados sao processados...', ui.ButtonSet.OK);

  var res = importarDeOutraPlanilha(urlOuId, '', 'substituir');

  if (res.success) {
    ui.alert(
      'Sincronizacao Concluida!',
      'Foram importados ' + res.importados + ' candidatos diretamente da planilha "' + res.planilhaNome + '"!\n\n' +
      'A aba "recrutamento" foi totalmente reconstruida com IDs unicos e colunas mapeadas.\n' +
      'Basta clicar em "Atualizar" no site para ver os dados novos!',
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

    var headerRow = values[0];
    var colMap = detectarColunasOrigem(headerRow);

    // Mapeamentos de fallback pelas posicoes padrao caso o texto do cabecalho seja diferente
    if (colMap.ocupacao === -1 && headerRow.length >= 15) colMap.ocupacao = 14; // Coluna O
    if (colMap.motivo === -1 && headerRow.length >= 20) colMap.motivo = 19;     // Coluna T

    var destSheet = getOuCriarAbaRecrutamento();

    // Se o modo for 'substituir', limpa os dados antigos abaixo do cabecalho
    if (modoImportacao === 'substituir') {
      var lastRowAtual = destSheet.getLastRow();
      if (lastRowAtual > 1) {
        destSheet.getRange(2, 1, lastRowAtual - 1, HEADERS.length).clearContent();
      }
    }

    var novosCandidatos = [];
    var agora = new Date().toISOString();

    for (var r = 1; r < values.length; r++) {
      var row = values[r];

      // Busca o nome do candidato
      var nome = colMap.nome !== -1 ? String(row[colMap.nome] || '').trim() : '';
      if (!nome) continue; // Pula linhas vazias

      var celular = colMap.celular !== -1 ? String(row[colMap.celular] || '').trim() : '';
      var email = colMap.email !== -1 ? String(row[colMap.email] || '').trim() : '';
      var idade = colMap.idade !== -1 ? Number(row[colMap.idade]) || '' : '';
      var celula = colMap.celula !== -1 ? String(row[colMap.celula] || 'UJC').trim() : 'UJC';
      var recrutador = colMap.recrutador !== -1 ? String(row[colMap.recrutador] || RECRUTADOR_VAZIO).trim() : RECRUTADOR_VAZIO;
      var status = colMap.status !== -1 ? normalizarStatus(row[colMap.status]) : 'pendente';
      var dataInscricao = colMap.data !== -1 ? formatarData(row[colMap.data]) : agora.slice(0, 10);
      var ocupacao = colMap.ocupacao !== -1 ? String(row[colMap.ocupacao] || '').trim() : '';
      var motivoOrganizar = colMap.motivo !== -1 ? String(row[colMap.motivo] || '').trim() : '';

      novosCandidatos.push([
        'rec-' + (r < 10 ? '00' + r : (r < 100 ? '0' + r : r)),
        nome,
        email,
        celular,
        idade,
        celula || 'UJC',
        recrutador || RECRUTADOR_VAZIO,
        status,
        ocupacao,
        motivoOrganizar,
        dataInscricao,
        JSON.stringify([{ id: 'av-' + r, data: agora, autor: 'Importacao', texto: 'Importado da planilha: ' + extSs.getName() }]),
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

    if (map.nome === -1 && (h.includes('nome') || h.includes('candidat') || h.includes('completo'))) {
      map.nome = c;
    } else if (map.celular === -1 && (h.includes('tel') || h.includes('cel') || h.includes('whats') || h.includes('fone') || h.includes('contato'))) {
      map.celular = c;
    } else if (map.email === -1 && (h.includes('email') || h.includes('e-mail'))) {
      map.email = c;
    } else if (map.idade === -1 && (h.includes('idade') || h.includes('nasc') || h.includes('anos'))) {
      map.idade = c;
    } else if (map.celula === -1 && (h.includes('celula') || h.includes('célula') || h.includes('grupo') || h.includes('nucleo') || h.includes('núcleo'))) {
      map.celula = c;
    } else if (map.recrutador === -1 && (h.includes('recrutador') || h.includes('responsavel') || h.includes('responsável') || h.includes('cmrd'))) {
      map.recrutador = c;
    } else if (map.status === -1 && (h.includes('status') || h.includes('situacao') || h.includes('situação'))) {
      map.status = c;
    } else if (map.ocupacao === -1 && (h.includes('ocup') || h.includes('trabalho') || h.includes('profiss') || h.includes('atua') || c === 14)) {
      map.ocupacao = c;
    } else if (map.motivo === -1 && (h.includes('organizar') || h.includes('motivo') || h.includes('por que') || h.includes('porque') || c === 19)) {
      map.motivo = c;
    } else if (map.data === -1 && (h.includes('data') || h.includes('timestamp') || h.includes('carimbo') || h.includes('hora'))) {
      map.data = c;
    }
  }
  return map;
}
