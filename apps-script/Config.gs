/**
 * CONFIGURACOES GLOBAIS E CONSTANTES DO PROJETO
 */

const SHEET_NAME = 'recrutamento';

const HEADERS = [
  'ID',
  'Nome',
  'Email',
  'Celular',
  'Idade',
  'Celula',
  'Recrutador',
  'Status',
  'Ocupacao (Col O)',
  'Por que se organizar (Col T)',
  'Data Inscricao',
  'Historico e Avisos',
  'Ultima Atualizacao'
];

// Indices das colunas na aba (base 1, para uso com getRange)
const COL = {
  ID: 1,
  NOME: 2,
  EMAIL: 3,
  CELULAR: 4,
  IDADE: 5,
  CELULA: 6,
  RECRUTADOR: 7,
  STATUS: 8,
  OCUPACAO: 9,
  MOTIVO: 10,
  DATA_INSCRICAO: 11,
  HISTORICO: 12,
  ULTIMA_ATUALIZACAO: 13
};

const STATUS_OPCOES = ['pendente', 'em recrutamento', 'contato', 'desistencia'];

// Celulas padronizadas
const CELULAS_PADRAO = [
  'UJC',
  'Trabalhadores Genericos'
];

// Iniciais dos camaradas recrutadores (edite conforme necessario)
const RECRUTADORES_INICIAIS = [
  'CMRD V.T.',
  'CMRD G.G.',
  'CMRD G.S.',
  'CMRD T.L.',
  'CMRD J.G.',
  'CMRD L.A.',
  'CMRD G.P.',
  'CMRD C.M.',
  'CMRD P.C.',
  'CMRD A.R.',
];

const RECRUTADOR_VAZIO = 'Nao atribuido';
