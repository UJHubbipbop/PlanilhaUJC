/**
 * MENU DA PLANILHA (ferramentas administrativas do proprietario)
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Painel de Recrutamento')
    .addItem('Importar de Outra Planilha (Col O e T)', 'importarViaPrompt')
    .addItem('Verificar aba recrutamento', 'inicializarAba')
    .addSeparator()
    .addItem('Configurar chaves de acesso', 'configurarChaves')
    .addItem('Mostrar chaves de acesso', 'mostrarChaves')
    .addToUi();
}
