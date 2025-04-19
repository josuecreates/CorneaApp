// Verificação de autenticação
if (!auth.checkAuth()) {
    window.location.href = 'index.html';
}

// Elementos globais
let currentModal = null;
let currentEditId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    updateUserInfo();
    loadEstatisticas();
    loadUltimosPacientes();
    setupNavigation();
    setupEventListeners();
    
    // Mostrar dashboard por padrão
    showSection('dashboard');
});

function updateUserInfo() {
    document.getElementById('userName').textContent = auth.currentUser.nome;
    document.getElementById('userEmail').textContent = auth.currentUser.email;
    document.getElementById('lastAccess').textContent = new Date().toLocaleString();
    
    // Mostrar/ocultar itens baseados no perfil
    if (!auth.isAdmin()) {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
}

function loadEstatisticas() {
    const estatisticas = db.getEstatisticas();
    
    document.getElementById('total-pacientes').textContent = estatisticas.totalPacientes;
    document.getElementById('pacientes-espera').textContent = estatisticas.pacientesEspera;
    document.getElementById('transplantes-mes').textContent = estatisticas.transplantesMes;
    document.getElementById('tempo-espera').textContent = estatisticas.tempoMedioEspera + ' dias';
    document.getElementById('doadores-disponiveis').textContent = estatisticas.doadoresDisponiveis;
}

function loadUltimosPacientes() {
    const pacientes = db.getPacientes().slice(-5).reverse();
    const container = document.getElementById('ultimos-pacientes');
    
    container.innerHTML = pacientes.length ? pacientes.map(paciente => `
        <div class="clinic-item">
            <div class="d-flex justify-content-between">
                <strong>${paciente.nome}</strong>
                <span class="badge ${getStatusBadgeClass(paciente.status)}">${paciente.status}</span>
            </div>
            <div>Idade: ${paciente.idade || 'N/A'} | Tipo Sanguíneo: ${paciente.tipoSanguineo || 'N/A'}</div>
            <div class="text-muted small">Cadastrado em: ${formatDate(paciente.dataCadastro)}</div>
            ${auth.isAdmin() ? `
            <div class="mt-2">
                <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${paciente.id}">Editar</button>
                <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${paciente.id}">Excluir</button>
            </div>` : ''}
        </div>
    `).join('') : '<div class="text-center py-3 text-muted">Nenhum paciente cadastrado</div>';
}

function setupNavigation() {
    // Menu lateral
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            showSection(section);
        });
    });
    
    // Menu rápido
    document.querySelectorAll('.quick-menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            document.querySelector(`.nav-item[data-section="${section}"]`).click();
        });
    });
}

function showSection(section) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.getElementById(`${section}-content`).style.display = 'block';
    
    switch(section) {
        case 'pacientes':
            loadPacientes();
            break;
        case 'transplantes':
            loadTransplantes();
            break;
        case 'doadores':
            loadDoadores();
            break;
        case 'usuarios':
            if (auth.isAdmin()) loadUsuarios();
            break;
    }
}

function loadPacientes() {
    const pacientes = db.getPacientes();
    const container = document.getElementById('pacientes-content');
    
    container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h3>Gerenciamento de Pacientes</h3>
        ${auth.isAdmin() ? `
        <button class="btn btn-primary" id="addPacienteBtn">
            <i class="fas fa-plus me-2"></i>Novo Paciente
        </button>` : ''}
    </div>
    <div class="table-responsive">
        <table class="table table-striped table-hover">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Idade</th>
                    <th>Tipo Sanguíneo</th>
                    <th>Status</th>
                    <th>Data Cadastro</th>
                    ${auth.isAdmin() ? '<th>Ações</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${pacientes.length ? pacientes.map(paciente => `
                <tr>
                    <td>PT${paciente.id.toString().padStart(3, '0')}</td>
                    <td>${paciente.nome}</td>
                    <td>${paciente.idade || 'N/A'}</td>
                    <td>${paciente.tipoSanguineo || 'N/A'}</td>
                    <td><span class="badge ${getStatusBadgeClass(paciente.status)}">${paciente.status}</span></td>
                    <td>${formatDate(paciente.dataCadastro)}</td>
                    ${auth.isAdmin() ? `
                    <td>
                        <button class="btn btn-sm btn-outline-primary btn-edit me-1" data-id="${paciente.id}">Editar</button>
                        <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${paciente.id}">Excluir</button>
                    </td>` : ''}
                </tr>
                `).join('') : `
                <tr>
                    <td colspan="${auth.isAdmin() ? '7' : '6'}" class="text-center py-4 text-muted">
                        Nenhum paciente cadastrado
                    </td>
                </tr>
                `}
            </tbody>
        </table>
    </div>
    `;
    
    if (auth.isAdmin()) {
        document.getElementById('addPacienteBtn')?.addEventListener('click', () => showPacienteModal());
    }
}

function loadTransplantes() {
    const transplantes = db.getTransplantes();
    const container = document.getElementById('transplantes-content');
    
    container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h3>Registro de Transplantes</h3>
        ${auth.isAdmin() ? `
        <button class="btn btn-primary" id="addTransplanteBtn">
            <i class="fas fa-plus me-2"></i>Novo Transplante
        </button>` : ''}
    </div>
    <div class="table-responsive">
        <table class="table table-striped table-hover">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Paciente</th>
                    <th>Data</th>
                    <th>Órgão</th>
                    <th>Médico</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${transplantes.length ? transplantes.map(t => {
                    const paciente = db.getPacienteById(t.pacienteId);
                    return `
                    <tr>
                        <td>TR${t.id.toString().padStart(3, '0')}</td>
                        <td>${paciente?.nome || 'Paciente não encontrado'}</td>
                        <td>${formatDate(t.data)}</td>
                        <td>${t.orgao || 'N/A'}</td>
                        <td>${t.medico || 'N/A'}</td>
                        <td><span class="badge bg-success">Realizado</span></td>
                    </tr>
                    `;
                }).join('') : `
                <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                        Nenhum transplante registrado
                    </td>
                </tr>
                `}
            </tbody>
        </table>
    </div>
    `;
    
    if (auth.isAdmin()) {
        document.getElementById('addTransplanteBtn')?.addEventListener('click', () => showTransplanteModal());
    }
}

function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());
    
    // Editar/Excluir pacientes
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit')) {
            const id = parseInt(e.target.dataset.id);
            showPacienteModal(id);
        }
        
        if (e.target.classList.contains('btn-delete')) {
            const id = parseInt(e.target.dataset.id);
            if (confirm('Tem certeza que deseja excluir este paciente?')) {
                if (db.deletePaciente(id)) {
                    loadPacientes();
                    loadUltimosPacientes();
                    loadEstatisticas();
                    showToast('Paciente excluído com sucesso');
                }
            }
        }
    });
}

// Funções auxiliares
function getStatusBadgeClass(status) {
    const statusMap = {
        'urgente': 'bg-danger',
        'espera': 'bg-warning text-dark',
        'transplantado': 'bg-success',
        'avaliacao': 'bg-info',
        'alta': 'bg-secondary'
    };
    return statusMap[status.toLowerCase()] || 'bg-primary';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast show align-items-center text-white bg-${type}`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '11';
    document.body.appendChild(container);
    return container;
}

// Modal Functions
function showPacienteModal(pacienteId = null) {
    currentEditId = pacienteId;
    const paciente = pacienteId ? db.getPacienteById(pacienteId) : null;
    
    const modalContent = `
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">${pacienteId ? 'Editar' : 'Novo'} Paciente</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="pacienteForm">
                    <div class="mb-3">
                        <label for="nome" class="form-label">Nome Completo</label>
                        <input type="text" class="form-control" id="nome" value="${paciente?.nome || ''}" required>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="idade" class="form-label">Idade</label>
                            <input type="number" class="form-control" id="idade" value="${paciente?.idade || ''}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="tipoSanguineo" class="form-label">Tipo Sanguíneo</label>
                            <select class="form-select" id="tipoSanguineo">
                                <option value="">Selecione</option>
                                <option ${paciente?.tipoSanguineo === 'A+' ? 'selected' : ''}>A+</option>
                                <option ${paciente?.tipoSanguineo === 'A-' ? 'selected' : ''}>A-</option>
                                <option ${paciente?.tipoSanguineo === 'B+' ? 'selected' : ''}>B+</option>
                                <option ${paciente?.tipoSanguineo === 'B-' ? 'selected' : ''}>B-</option>
                                <option ${paciente?.tipoSanguineo === 'AB+' ? 'selected' : ''}>AB+</option>
                                <option ${paciente?.tipoSanguineo === 'AB-' ? 'selected' : ''}>AB-</option>
                                <option ${paciente?.tipoSanguineo === 'O+' ? 'selected' : ''}>O+</option>
                                <option ${paciente?.tipoSanguineo === 'O-' ? 'selected' : ''}>O-</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="status" class="form-label">Status</label>
                        <select class="form-select" id="status" required>
                            <option value="">Selecione</option>
                            <option value="espera" ${paciente?.status === 'espera' ? 'selected' : ''}>Em espera</option>
                            <option value="urgente" ${paciente?.status === 'urgente' ? 'selected' : ''}>Urgente</option>
                            <option value="avaliacao" ${paciente?.status === 'avaliacao' ? 'selected' : ''}>Em avaliação</option>
                            <option value="transplantado" ${paciente?.status === 'transplantado' ? 'selected' : ''}>Transplantado</option>
                            <option value="alta" ${paciente?.status === 'alta' ? 'selected' : ''}>Alta médica</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="observacoes" class="form-label">Observações</label>
                        <textarea class="form-control" id="observacoes" rows="3">${paciente?.observacoes || ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" id="savePacienteBtn">Salvar</button>
            </div>
        </div>
    </div>
    `;
    
    showModal(modalContent, () => {
        document.getElementById('savePacienteBtn').addEventListener('click', savePaciente);
    });
}

function savePaciente() {
    const pacienteData = {
        nome: document.getElementById('nome').value,
        idade: parseInt(document.getElementById('idade').value) || null,
        tipoSanguineo: document.getElementById('tipoSanguineo').value || null,
        status: document.getElementById('status').value,
        observacoes: document.getElementById('observacoes').value
    };
    
    if (!pacienteData.nome || !pacienteData.status) {
        showToast('Preencha todos os campos obrigatórios', 'danger');
        return;
    }
    
    if (currentEditId) {
        if (db.updatePaciente(currentEditId, pacienteData)) {
            showToast('Paciente atualizado com sucesso');
        }
    } else {
        db.addPaciente(pacienteData);
        showToast('Paciente cadastrado com sucesso');
    }
    
    closeModal();
    loadPacientes();
    loadUltimosPacientes();
    loadEstatisticas();
}

function showModal(content, onShowCallback = null) {
    closeModal(); // Fechar qualquer modal aberto
    
    const modal = document.createElement('div');
    modal.className = 'modal fade show';
    modal.style.display = 'block';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.innerHTML = content;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    currentModal = modal;
    
    // Fechar ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    
    // Fechar ao pressionar ESC
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
    
    if (onShowCallback) onShowCallback();
}

function closeModal() {
    if (currentModal) {
        document.body.classList.remove('modal-open');
        currentModal.remove();
        currentModal = null;
        currentEditId = null;
    }
}