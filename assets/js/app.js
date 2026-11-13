/**
 * LOGICA PRINCIPAL DA INTERFACE
 */

const Estado = {
  candidatos: [],
  papel: null, // 'admin' | 'leitura'
  celulas: ['UJC', 'Trabalhadores Genericos'],
  recrutadores: ['VT', 'GG', 'GS', 'TL', 'JG', 'LA', 'GP', 'CM', 'PC', 'AR'],
  statusOpcoes: ['pendente', 'em recrutamento', 'contato', 'desistencia'],
  filtroStatus: 'todos',
  candidatoAbertoId: null
};

const $ = (id) => document.getElementById(id);
const ehAdmin = () => Estado.papel === 'admin';

/* ===================== INICIALIZACAO ===================== */

document.addEventListener('DOMContentLoaded', () => {
  registrarEventos();
  const chaveSalva = Sessao.getChave();
  if (chaveSalva) {
    entrar(chaveSalva, null);
  }
});

function registrarEventos() {
  $('form-login').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const chave = $('input-chave').value.trim();
    if (chave) entrar(chave, $('check-lembrar').checked);
  });

  $('btn-sair').addEventListener('click', sair);
  $('btn-atualizar').addEventListener('click', () => carregarDados());

  $('tabs-status').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-status]');
    if (!btn) return;
    Estado.filtroStatus = btn.dataset.status;
    aplicarFiltros();
  });

  $('filtro-busca').addEventListener('input', aplicarFiltros);
  ['filtro-recrutador', 'filtro-celula', 'filtro-data'].forEach(id => $(id).addEventListener('change', aplicarFiltros));

  // Delegacao de eventos da tabela
  const tbody = $('tabela-body');
  tbody.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-abrir]');
    if (btn) abrirDrawer(btn.dataset.abrir);
  });
  tbody.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.dataset.acao === 'status') alterarStatus(el.dataset.id, el.value, el);
    if (el.dataset.acao === 'recrutador') atribuirRecrutador(el.dataset.id, el.value, el);
  });

  document.querySelectorAll('[data-fechar-drawer]').forEach(el => el.addEventListener('click', fecharDrawer));
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') fecharDrawer(); });
  $('btn-salvar-aviso').addEventListener('click', salvarNovoAviso);
}

/* ===================== AUTENTICACAO ===================== */

async function entrar(chave, lembrar) {
  const btn = $('btn-login');
  btn.disabled = true;
  btn.textContent = 'Verificando...';
  $('login-erro').classList.add('hidden');

  try {
    const res = await Api.carregarDados(chave);
    if (lembrar !== null) Sessao.salvar(chave, lembrar);
    receberDados(res);
    $('tela-login').classList.add('hidden');
    $('tela-app').classList.remove('hidden');
    $('input-chave').value = '';
  } catch (err) {
    if (err.codigo === 'NAO_AUTORIZADO') Sessao.limpar();
    mostrarErroLogin(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
}

function sair() {
  Sessao.limpar();
  Estado.candidatos = [];
  Estado.papel = null;
  fecharDrawer();
  $('tela-app').classList.add('hidden');
  $('tela-login').classList.remove('hidden');
}

function mostrarErroLogin(msg) {
  const el = $('login-erro');
  el.textContent = msg;
  el.classList.remove('hidden');
}

/* ===================== DADOS ===================== */

async function carregarDados() {
  const btn = $('btn-atualizar');
  btn.disabled = true;
  btn.textContent = 'Carregando...';
  try {
    const res = await Api.carregarDados();
    receberDados(res);
    mostrarToast(Estado.candidatos.length + ' candidatos carregados.');
  } catch (err) {
    tratarErro(err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Atualizar';
  }
}

function receberDados(res) {
  Estado.candidatos = (res.candidatos || []).map(Utils.normalizarCandidato);
  Estado.papel = res.papel;
  Estado.celulas = [...Utils.CELULAS_VALIDAS];

  if (Array.isArray(res.recrutadores) && res.recrutadores.length > 0) {
    Estado.recrutadores = res.recrutadores
      .map(Utils.normalizarSiglaRecrutador)
      .filter(Boolean);
  }

  if (Array.isArray(res.statusOpcoes)) Estado.statusOpcoes = res.statusOpcoes;

  atualizarIndicadorPerfil();
  atualizarOpcoesFiltros();
  aplicarFiltros();

  if (Estado.candidatoAbertoId) abrirDrawer(Estado.candidatoAbertoId);
}

function tratarErro(err) {
  if (err.codigo === 'NAO_AUTORIZADO') {
    sair();
    mostrarErroLogin('Sua chave de acesso expirou ou foi alterada. Entre novamente.');
    return;
  }
  mostrarToast(err.message, true);
}

function atualizarIndicadorPerfil() {
  const el = $('label-perfil');
  if (ehAdmin()) {
    el.textContent = 'Proprietario (Acesso Total)';
    el.className = 'px-3 py-1 rounded-lg text-xs font-semibold border bg-red-950 text-red-200 border-red-700';
  } else {
    el.textContent = 'Modo Consulta (Somente Leitura)';
    el.className = 'px-3 py-1 rounded-lg text-xs font-semibold border bg-zinc-800 text-zinc-300 border-zinc-700';
  }
}

function listaRecrutadores() {
  const set = new Set();
  Estado.recrutadores.forEach(r => {
    const s = Utils.normalizarSiglaRecrutador(r);
    if (s) set.add(s);
  });
  Estado.candidatos.forEach(c => {
    const s = Utils.normalizarSiglaRecrutador(c.recrutador);
    if (s) set.add(s);
  });
  return Array.from(set);
}

function listaCelulas() {
  return [...Utils.CELULAS_VALIDAS];
}

function preencherSelect(select, opcoes, rotuloTodos) {
  const atual = select.value;
  select.innerHTML = '<option value="todos">' + Utils.escapeHtml(rotuloTodos) + '</option>' +
    opcoes.map(o => '<option value="' + Utils.escapeHtml(o) + '">' + Utils.escapeHtml(o) + '</option>').join('');
  if (atual && (atual === 'todos' || opcoes.includes(atual))) select.value = atual;
}

function atualizarOpcoesFiltros() {
  preencherSelect($('filtro-recrutador'), listaRecrutadores(), 'Todos os recrutadores');
  preencherSelect($('filtro-celula'), listaCelulas(), 'Todas as celulas');
}

/* ===================== FILTROS ===================== */

function aplicarFiltros() {
  const busca = $('filtro-busca').value.toLowerCase().trim();
  const rec = $('filtro-recrutador').value || 'todos';
  const cel = $('filtro-celula').value || 'todos';
  const periodo = $('filtro-data').value || 'todos';
  const agora = new Date();
  const DIA = 24 * 60 * 60 * 1000;

  const base = Estado.candidatos.filter(c => {
    if (rec !== 'todos' && c.recrutador !== rec) return false;
    if (cel !== 'todos' && c.celula !== cel) return false;

    if (periodo !== 'todos') {
      const d = Utils.parseData(c.dataInscricao);
      if (!d) return false;
      if (periodo === '7d' && (agora - d) > 7 * DIA) return false;
      if (periodo === '30d' && (agora - d) > 30 * DIA) return false;
      if (periodo === 'mes' && (d.getMonth() !== agora.getMonth() || d.getFullYear() !== agora.getFullYear())) return false;
      if (periodo === 'ano' && d.getFullYear() !== agora.getFullYear()) return false;
    }

    if (busca) {
      const txt = [
        c.nome, c.email, c.celular, c.trabalho, c.motivoInscricao,
        c.recrutador, c.celula, c.municipio, c.regiaoMunicipal,
        c.setorEstrategico, c.entidadeAtua, c.genero
      ].join(' ').toLowerCase();
      if (!txt.includes(busca)) return false;
    }
    return true;
  });

  const filtrados = Estado.filtroStatus === 'todos' ? base : base.filter(c => c.status === Estado.filtroStatus);

  atualizarTabsStatus(base);
  renderizarTabela(filtrados);
  renderizarGraficos(filtrados);
}

function atualizarTabsStatus(lista) {
  const counts = { todos: lista.length };
  Estado.statusOpcoes.forEach(s => { counts[s] = 0; });
  lista.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  document.querySelectorAll('[data-count]').forEach(el => { el.textContent = counts[el.dataset.count] || 0; });
  document.querySelectorAll('#tabs-status [data-status]').forEach(btn => {
    btn.classList.toggle('ativo', btn.dataset.status === Estado.filtroStatus);
  });
}

/* ===================== TABELA ===================== */

function renderizarTabela(lista) {
  const tbody = $('tabela-body');
  const esc = Utils.escapeHtml;
  $('badge-contagem').textContent = lista.length + ' exibidos';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-zinc-400">Nenhum candidato encontrado para os filtros aplicados.</td></tr>';
    return;
  }

  const recrutadores = ['Nao atribuido', ...listaRecrutadores()];

  tbody.innerHTML = lista.map(c => {
    const id = esc(c.id);
    let colRecrutador;
    let colStatus;

    if (ehAdmin()) {
      const opcoesRec = recrutadores.includes(c.recrutador) ? recrutadores : [...recrutadores, c.recrutador];
      colRecrutador = '<select data-acao="recrutador" data-id="' + id + '" class="select-tabela">' +
        opcoesRec.map(r => '<option value="' + esc(r) + '"' + (r === c.recrutador ? ' selected' : '') + '>' + esc(r) + '</option>').join('') +
        '</select>';

      colStatus = '<select data-acao="status" data-id="' + id + '" class="select-tabela font-semibold ' + Utils.classeStatus(c.status) + '">' +
        Estado.statusOpcoes.map(s => '<option value="' + esc(s) + '"' + (s === c.status ? ' selected' : '') + '>' + esc(Utils.labelStatus(s)) + '</option>').join('') +
        '</select>';
    } else {
      colRecrutador = '<span class="font-medium">' + esc(c.recrutador || 'Nao atribuido') + '</span>';
      colStatus = '<span class="badge-status ' + Utils.classeStatus(c.status) + '">' + esc(Utils.labelStatus(c.status)) + '</span>';
    }

    const whats = Utils.gerarLinkWhatsApp(c.celular, c.nome);
    const colWhats = whats === '#'
      ? '<span class="text-zinc-400">Sem celular</span>'
      : '<a href="' + esc(whats) + '" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 rounded font-semibold transition-colors">WhatsApp</a>';

    const subInfo = [c.trabalho, c.municipio].filter(Boolean).join(' • ');

    return '<tr class="hover:bg-zinc-50 transition-colors">' +
      '<td class="py-3 px-4 font-bold text-zinc-900">' +
        '<button data-abrir="' + id + '" class="text-left hover:text-red-700 transition-colors">' +
          '<div>' + esc(c.nome) + '</div>' +
          '<div class="text-[10px] text-zinc-400 font-normal">' + esc(subInfo) + '</div>' +
        '</button>' +
      '</td>' +
      '<td class="py-3 px-4 font-medium">' + esc(c.celula || 'UJC') + '</td>' +
      '<td class="py-3 px-4">' + colRecrutador + '</td>' +
      '<td class="py-3 px-4">' + colStatus + '</td>' +
      '<td class="py-3 px-4">' + colWhats + '</td>' +
      '<td class="py-3 px-4 text-center">' +
        '<button data-abrir="' + id + '" class="px-2.5 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 font-bold text-[11px] text-zinc-700">' +
          'Avisos: ' + ((c.avisos && c.avisos.length) || 0) +
        '</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

/* ===================== GAVETA DO CANDIDATO ===================== */

function buscarCandidato(id) {
  return Estado.candidatos.find(c => String(c.id) === String(id));
}

function abrirDrawer(id) {
  const c = buscarCandidato(id);
  if (!c) return;
  Estado.candidatoAbertoId = c.id;

  $('drawer-nome').textContent = c.nome;
  $('drawer-subtitulo').textContent = (c.celula || 'UJC') + ' • Recrutador: ' + (c.recrutador || 'Nao atribuido');
  $('drawer-email').textContent = c.email || '-';
  $('drawer-celular').textContent = c.celular || '-';
  $('drawer-idade').textContent = c.idade ? c.idade + ' anos' : '-';
  $('drawer-data').textContent = Utils.formatarDataBR(c.dataInscricao);
  $('drawer-municipio').textContent = c.municipio || '-';
  $('drawer-regiao').textContent = c.regiaoMunicipal || '-';
  $('drawer-genero').textContent = [c.genero, c.pronomes].filter(Boolean).join(' • ') || '-';
  $('drawer-redes').textContent = c.redesSociais || '-';

  $('drawer-setor').textContent = c.setorEstrategico || '-';
  $('drawer-regime').textContent = c.regimeContratual || '-';
  $('drawer-ensino').textContent = c.nivelEnsino || '-';
  $('drawer-entidade').textContent = c.entidadeAtua || '-';
  $('drawer-como-acompanhava').textContent = c.comoAcompanhava || '-';

  $('drawer-ocupacao').textContent = c.trabalho || 'Nenhuma atuacao profissional informada.';
  $('drawer-motivo').textContent = c.motivoInscricao || 'Nenhum motivo informado.';

  const whats = Utils.gerarLinkWhatsApp(c.celular, c.nome);
  const btnWhats = $('drawer-whatsapp');
  btnWhats.href = whats;
  btnWhats.classList.toggle('hidden', whats === '#');

  $('drawer-box-aviso').classList.toggle('hidden', !ehAdmin());
  $('drawer-box-leitura').classList.toggle('hidden', ehAdmin());

  renderizarAvisos(c);
  $('drawer').classList.remove('hidden');
}

function renderizarAvisos(c) {
  const esc = Utils.escapeHtml;
  const avisos = c.avisos || [];
  $('drawer-avisos').innerHTML = avisos.length === 0
    ? '<p class="text-zinc-400 italic">Nenhum registro anterior.</p>'
    : avisos.map(a =>
      '<div class="bg-white border border-zinc-200 p-2.5 rounded-lg">' +
        '<div class="flex justify-between text-[10px] text-zinc-500 font-bold">' +
          '<span>' + esc(a.autor || 'Sistema') + '</span>' +
          '<span>' + esc(a.data ? Utils.formatarDataBR(a.data) : '') + '</span>' +
        '</div>' +
        '<p class="text-zinc-700 text-xs mt-1 whitespace-pre-line">' + esc(a.texto) + '</p>' +
      '</div>'
    ).join('');
}

function fecharDrawer() {
  Estado.candidatoAbertoId = null;
  $('drawer').classList.add('hidden');
}

/* ===================== ACOES DO PROPRIETARIO ===================== */

async function alterarStatus(id, novoStatus, select) {
  const c = buscarCandidato(id);
  if (!c || !ehAdmin()) return;
  const anterior = c.status;

  select.disabled = true;
  try {
    const res = await Api.alterarStatus(id, novoStatus);
    c.status = res.status;
    if (res.aviso) (c.avisos = c.avisos || []).unshift(res.aviso);
    mostrarToast('Status alterado para: ' + Utils.labelStatus(res.status));
  } catch (err) {
    c.status = anterior;
    tratarErro(err);
  } finally {
    aplicarFiltros();
  }
}

async function atribuirRecrutador(id, recrutador, select) {
  const c = buscarCandidato(id);
  if (!c || !ehAdmin()) return;
  const anterior = c.recrutador;

  select.disabled = true;
  try {
    const res = await Api.atribuirRecrutador(id, recrutador);
    c.recrutador = Utils.normalizarSiglaRecrutador(res.recrutador) || 'Nao atribuido';
    if (res.aviso) (c.avisos = c.avisos || []).unshift(res.aviso);
    mostrarToast('Recrutador atualizado: ' + c.recrutador);
  } catch (err) {
    c.recrutador = anterior;
    tratarErro(err);
  } finally {
    aplicarFiltros();
  }
}

async function salvarNovoAviso() {
  const c = buscarCandidato(Estado.candidatoAbertoId);
  const campo = $('novo-aviso-texto');
  const texto = campo.value.trim();
  if (!c || !texto || !ehAdmin()) return;

  const btn = $('btn-salvar-aviso');
  btn.disabled = true;
  btn.textContent = 'Salvando...';
  try {
    const res = await Api.adicionarAviso(c.id, texto);
    (c.avisos = c.avisos || []).unshift(res.aviso);
    campo.value = '';
    renderizarAvisos(c);
    aplicarFiltros();
    mostrarToast('Anotacao salva no historico.');
  } catch (err) {
    tratarErro(err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar no Historico';
  }
}

/* ===================== GRAFICOS ===================== */

function renderizarGraficos(lista) {
  const esc = Utils.escapeHtml;
  const anoAtual = new Date().getFullYear();
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const porMes = Array(12).fill(0);
  const porAno = {};

  lista.forEach(c => {
    const d = Utils.parseData(c.dataInscricao);
    if (!d) return;
    porAno[d.getFullYear()] = (porAno[d.getFullYear()] || 0) + 1;
    if (d.getFullYear() === anoAtual) porMes[d.getMonth()]++;
  });

  const maxMes = Math.max(...porMes, 1);
  $('grafico-mensal').innerHTML = meses.map((mes, i) =>
    '<div class="flex-1 flex flex-col items-center h-full justify-end">' +
      '<span class="text-[9px] font-bold text-zinc-500">' + porMes[i] + '</span>' +
      '<div class="w-full max-w-[24px] bg-red-700 hover:bg-red-600 rounded-t transition-all" style="height:' + Math.round((porMes[i] / maxMes) * 100) + '%"></div>' +
      '<span class="text-[10px] text-zinc-500 mt-1">' + mes + '</span>' +
    '</div>'
  ).join('');

  const anos = Object.keys(porAno).sort((a, b) => b - a);
  const maxAno = Math.max(...Object.values(porAno), 1);
  $('grafico-anual').innerHTML = anos.length === 0
    ? '<p class="text-zinc-400 text-xs">Sem dados.</p>'
    : anos.map(ano => linhaBarra(ano, porAno[ano], maxAno, 'bg-red-800')).join('');

  $('total-cadastrados').textContent = lista.length;

  const porRec = contarPor(lista, c => Utils.normalizarSiglaRecrutador(c.recrutador) || 'Nao atribuido');
  const total = lista.length || 1;

  $('lista-recrutadores').innerHTML = porRec.length === 0
    ? '<p class="text-zinc-400 text-xs">Sem dados.</p>'
    : porRec.map(([nome, qtd]) => linhaBarra(esc(nome), qtd, total, 'bg-red-800')).join('');

  // Distribuicao por Celula: exibe apenas as celulas validas ("UJC" e "Trabalhadores Genericos")
  const mapaCel = {};
  Utils.CELULAS_VALIDAS.forEach(nomeCel => { mapaCel[nomeCel] = 0; });
  lista.forEach(c => {
    const cl = Utils.normalizarCelula(c.celula);
    mapaCel[cl] = (mapaCel[cl] || 0) + 1;
  });
  const porCel = Object.entries(mapaCel).sort((a, b) => b[1] - a[1]);

  $('lista-celulas').innerHTML = porCel.map(([nome, qtd]) =>
    linhaBarra(esc(nome), qtd, total, 'bg-rose-900')
  ).join('');
}

function contarPor(lista, chaveFn) {
  const mapa = {};
  lista.forEach(c => { const k = chaveFn(c); mapa[k] = (mapa[k] || 0) + 1; });
  return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
}

function linhaBarra(rotulo, qtd, max, cor) {
  const pct = Math.min(100, Math.round((qtd / (max || 1)) * 100));
  return '<div class="flex items-center justify-between text-xs">' +
    '<span class="text-zinc-700 font-medium truncate max-w-[180px]">' + rotulo + '</span>' +
    '<div class="flex items-center gap-2">' +
      '<div class="barra-fundo"><div class="barra-preenchida ' + cor + '" style="width:' + pct + '%"></div></div>' +
      '<span class="font-bold text-zinc-800 w-6 text-right">' + qtd + '</span>' +
    '</div>' +
  '</div>';
}

/* ===================== TOAST ===================== */

let toastTimer = null;
function mostrarToast(texto, erro) {
  $('toast-text').textContent = texto;
  $('toast-dot').className = 'w-2 h-2 rounded-full ' + (erro ? 'bg-amber-400' : 'bg-red-500');
  $('toast').classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.add('hidden'), erro ? 6000 : 3500);
}
