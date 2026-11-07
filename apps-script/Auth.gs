/**
 * CONTROLE DE ACESSO POR CHAVES
 *
 * - ADMIN_KEY: somente o proprietario da planilha. Permite editar dados.
 * - READ_KEY : compartilhada com os recrutadores. Somente leitura.
 *
 * As chaves ficam em Propriedades do Script (nunca no repositorio do GitHub).
 */

var PROP_ADMIN_KEY = 'ADMIN_KEY';
var PROP_READ_KEY = 'READ_KEY';

function autenticar(chave) {
  if (!chave) return null;
  var props = PropertiesService.getScriptProperties();
  var admin = props.getProperty(PROP_ADMIN_KEY);
  var leitura = props.getProperty(PROP_READ_KEY);

  if (admin && compararSeguro(chave, admin)) return 'admin';
  if (leitura && compararSeguro(chave, leitura)) return 'leitura';
  return null;
}

function exigirAdmin(papel) {
  if (papel !== 'admin') {
    var err = new Error('Apenas o proprietario da planilha pode alterar dados.');
    err.codigo = 'SEM_PERMISSAO';
    throw err;
  }
}

function compararSeguro(a, b) {
  a = String(a);
  b = String(b);
  if (a.length !== b.length) return false;
  var r = 0;
  for (var i = 0; i < a.length; i++) {
    r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return r === 0;
}

function gerarChave() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
}

/**
 * Gera (ou regenera) as chaves de acesso. Executar pelo menu da planilha.
 * Regenerar invalida as chaves anteriores.
 */
function configurarChaves() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();

  if (props.getProperty(PROP_ADMIN_KEY)) {
    var resp = ui.alert(
      'Regenerar chaves',
      'Ja existem chaves configuradas. Gerar novas chaves invalida as atuais. Continuar?',
      ui.ButtonSet.YES_NO
    );
    if (resp !== ui.Button.YES) return;
  }

  props.setProperty(PROP_ADMIN_KEY, gerarChave());
  props.setProperty(PROP_READ_KEY, gerarChave());
  mostrarChaves();
}

function mostrarChaves() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  var admin = props.getProperty(PROP_ADMIN_KEY);
  var leitura = props.getProperty(PROP_READ_KEY);

  if (!admin || !leitura) {
    ui.alert('Chaves nao configuradas', 'Use o menu "Configurar chaves de acesso" primeiro.', ui.ButtonSet.OK);
    return;
  }

  ui.alert(
    'Chaves de acesso do site',
    'CHAVE DO PROPRIETARIO (nao compartilhe):\n' + admin +
    '\n\nCHAVE DE LEITURA (para os recrutadores):\n' + leitura,
    ui.ButtonSet.OK
  );
}
