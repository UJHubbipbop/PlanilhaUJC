/**
 * MENU DA PLANILHA (ferramentas administrativas do proprietario)
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Painel de Recrutamento')
    .addItem('Sincronizar com Planilha Original (Substituir Tudo)', 'sincronizarRecrutamentoDoZero')
    .addItem('Clonar Aba Original (Copia 1:1 Completa)', 'clonarAbaOriginal')
    .addSeparator()
    .addItem('Verificar aba recrutamento', 'inicializarAba')
    .addSeparator()
    .addItem('Configurar chaves de acesso', 'configurarChaves')
    .addItem('Mostrar chaves de acesso', 'mostrarChaves')
    .addToUi();
}
