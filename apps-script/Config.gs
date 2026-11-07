/**
 * CONFIGURACOES GLOBAIS E CONSTANTES DO PROJETO
 */

const SHEET_NAME = 'recrutamento';

// Estrutura exata com todas as colunas da planilha original + colunas de controle do sistema
const HEADERS = [
  'ID',
  'Nome',
  'Telefone',
  'Email',
  'Celula',
  'Situacao',
  'Recrutador',
  'Prioridade',
  'Email (Formulario)',
  'Nome (Formulario)',
  'Telefone (Formulario)',
  'Redes Sociais',
  'Municipio',
  'Regiao Municipal',
  'Atuacao Profissional',
  'Setor Estrategico',
  'Regime Contratual',
  'Nivel de Ensino',
  'Entidade que Atua',
  'Porque decidiu se organizar',
  'Idade',
  'Genero',
  'Pronomes',
  'Como acompanhava o Partido',
  'Data de Inscricao',
  'Historico e Avisos',
  'Ultima Atualizacao'
];

// Indices das colunas na aba (base 1, para uso com getRange)
const COL = {
  ID: 1,
  NOME: 2,
  TELEFONE: 3,
  EMAIL: 4,
  CELULA: 5,
  SITUACAO: 6,
  RECRUTADOR: 7,
  PRIORIDADE: 8,
  EMAIL_FORM: 9,
  NOME_FORM: 10,
  TEL_FORM: 11,
  REDES_SOCIAIS: 12,
  MUNICIPIO: 13,
  REGIAO_MUNICIPAL: 14,
  ATUACAO_PROFISSIONAL: 15,
  SETOR_ESTRATEGICO: 16,
  REGIME_CONTRATUAL: 17,
  NIVEL_ENSINO: 18,
  ENTIDADE_ATUA: 19,
  MOTIVO_ORGANIZAR: 20,
  IDADE: 21,
  GENERO: 22,
  PRONOMES: 23,
  COMO_ACOMPANHAVA: 24,
  DATA_INSCRICAO: 25,
  HISTORICO: 26,
  ULTIMA_ATUALIZACAO: 27
};

const STATUS_OPCOES = ['pendente', 'em recrutamento', 'contato', 'desistencia'];

// Celulas padronizadas
const CELULAS_PADRAO = [
  'UJC',
  'Trabalhadores Genericos'
];

// Iniciais dos camaradas recrutadores (preservando a configuracao do projeto)
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
  'CMRD A.R.'
];

const RECRUTADOR_VAZIO = 'Nao atribuido';
