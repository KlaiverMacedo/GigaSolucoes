// Operations - CRUD Completo com API

let operations = [];
let editingId = null;

// DOM Elements
const operationsList = document.getElementById('operationsList');
const searchInput = document.getElementById('searchOperation');
const filterStatus = document.getElementById('filterStatusOp');
const filterDate = document.getElementById('filterDate');
const btnNewOperation = document.getElementById('btnNewOperation');
const modal = document.getElementById('operationModal');
const modalTitle = document.getElementById('modalTitle');
const operationForm = document.getElementById('operationForm');
const btnCancel = document.getElementById('btnCancel');
const btnClose = document.getElementById('modalClose');

// Mapeamento de status
const statusMap = {
    'AGENDADO': 'Agendado',
    'EM_MONTAGEM': 'Em Montagem',
    'EM_OPERACAO': 'Em Operação',
    'EM_DESMONTAGEM': 'Em Desmontagem',
    'FINALIZADO': 'Finalizado',
    'CANCELADO': 'Cancelado'
};

const statusClassMap = {
    'AGENDADO': 'agendado',
    'EM_MONTAGEM': 'em_montagem',
    'EM_OPERACAO': 'em_operacao',
    'EM_DESMONTAGEM': 'em_desmontagem',
    'FINALIZADO': 'finalizado',
    'CANCELADO': 'cancelado'
};

// Carregar operações da API
async function loadOperations() {
    try {
        showLoading(true);
        const data = await api.get('/operations?limit=100');
        operations = data || [];
        renderOperations();
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar operações:', error);
        showNotification('Erro ao carregar operações', 'error');
        showLoading(false);
    }
}

// Renderizar operações
function renderOperations() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilter = filterStatus.value;
    const dateFilter = filterDate.value;

    const filtered = operations.filter(op => {
        const matchSearch =
            op.event_name.toLowerCase().includes(searchTerm) ||
            op.client_name.toLowerCase().includes(searchTerm);
        const matchStatus = !statusFilter || op.status === statusFilter;
        const matchDate = !dateFilter || op.event_date === dateFilter;
        return matchSearch && matchStatus && matchDate;
    });

    if (filtered.length === 0) {
        operationsList.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.3);">
                <i class="fas fa-calendar-check" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                <p style="font-size: 16px;">Nenhuma operação encontrada</p>
                <p style="font-size: 14px; margin-top: 4px;">Tente ajustar os filtros ou crie uma nova operação</p>
            </div>
        `;
        return;
    }

    operationsList.innerHTML = filtered.map(op => `
        <div class="operation-card" data-id="${op.id}">
            <div class="card-top">
                <div class="event-info">
                    <h3>${op.event_name}</h3>
                    <div class="client"><i class="fas fa-building"></i> ${op.client_name}</div>
                </div>
                <span class="status-badge ${statusClassMap[op.status]}">
                    <span class="dot"></span>
                    ${statusMap[op.status]}
                </span>
            </div>
            
            <div class="card-details">
                <div class="detail-item">
                    <i class="fas fa-calendar-day"></i>
                    <strong>Data:</strong> ${formatDate(op.event_date)}
                </div>
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <strong>Local:</strong> ${op.address || 'N/A'}
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <strong>Montagem:</strong> ${op.setup_time || 'N/A'}
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <strong>Desmontagem:</strong> ${op.breakdown_time || 'N/A'}
                </div>
            </div>
            
            <div class="card-bottom">
                <div class="team-tags">
                    <span class="tag"><i class="fas fa-truck"></i> ${op.vehicle || 'Sem veículo'}</span>
                    <span class="tag"><i class="fas fa-users"></i> ${op.technician || 'Sem técnicos'}</span>
                    ${op.driver ? `<span class="tag"><i class="fas fa-user"></i> Motorista: ${op.driver}</span>` : ''}
                </div>
                <div class="card-actions">
                    <button class="btn-edit" onclick="editOperation(${op.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteOperation(${op.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Formatar data
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Abrir modal para nova operação
async function openNewOperationModal() {
    editingId = null;
    modalTitle.textContent = 'Nova Operação';
    operationForm.reset();
    document.getElementById('operationId').value = '';
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('statusOp').value = 'AGENDADO';

    // Carregar veículos e técnicos para os selects
    await loadSelectOptions();

    modal.classList.add('active');
}

// Carregar opções para os selects
async function loadSelectOptions() {
    try {
        // Carregar veículos disponíveis
        const vehicles = await api.get('/vehicles?status=DISPONIVEL');
        const vehicleSelect = document.getElementById('allocVehicle');
        if (vehicleSelect) {
            vehicleSelect.innerHTML = '<option value="">Selecione um veículo</option>';
            vehicles.forEach(v => {
                vehicleSelect.innerHTML += `<option value="${v.plate}">${v.plate} - ${v.model}</option>`;
            });
        }

        // Carregar técnicos disponíveis
        const technicians = await api.get('/technicians?is_available=true');
        const techSelect = document.getElementById('allocTechnician');
        if (techSelect) {
            techSelect.innerHTML = '<option value="">Selecione um técnico</option>';
            technicians.forEach(t => {
                techSelect.innerHTML += `<option value="${t.name}">${t.name} - ${t.function}</option>`;
            });
        }

        // Carregar motoristas (técnicos disponíveis)
        const drivers = await api.get('/technicians?is_available=true');
        const driverSelect = document.getElementById('allocDriver');
        if (driverSelect) {
            driverSelect.innerHTML = '<option value="">Selecione um motorista</option>';
            drivers.forEach(t => {
                driverSelect.innerHTML += `<option value="${t.name}">${t.name}</option>`;
            });
        }

        // Carregar clientes
        const clients = await api.get('/clients?limit=100');
        const clientSelect = document.getElementById('clientName');
        if (clientSelect) {
            clientSelect.innerHTML = '<option value="">Selecione um cliente</option>';
            clients.forEach(c => {
                clientSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar opções:', error);
        showNotification('Erro ao carregar opções', 'error');
    }
}

// Abrir modal para editar operação
function editOperation(id) {
    const op = operations.find(o => o.id === id);
    if (!op) return;

    editingId = id;
    modalTitle.textContent = 'Editar Operação';

    document.getElementById('operationId').value = op.id;
    document.getElementById('eventName').value = op.event_name;
    document.getElementById('clientName').value = op.client_id;
    document.getElementById('eventDate').value = op.event_date;
    document.getElementById('address').value = op.address || '';
    document.getElementById('setupTime').value = op.setup_time || '';
    document.getElementById('breakdownTime').value = op.breakdown_time || '';
    document.getElementById('statusOp').value = op.status;
    document.getElementById('observationsOp').value = op.observations || '';
    document.getElementById('allocVehicle').value = op.vehicle || '';
    document.getElementById('allocTechnician').value = op.technician || '';
    document.getElementById('allocDriver').value = op.driver || '';

    modal.classList.add('active');
}

// Fechar modal
function closeModal() {
    modal.classList.remove('active');
    operationForm.reset();
    editingId = null;
}

// Salvar operação
async function saveOperation(event) {
    event.preventDefault();

    const formData = {
        client_id: parseInt(document.getElementById('clientName').value),
        event_name: document.getElementById('eventName').value.trim(),
        event_date: document.getElementById('eventDate').value,
        address: document.getElementById('address').value.trim() || null,
        setup_time: document.getElementById('setupTime').value || null,
        breakdown_time: document.getElementById('breakdownTime').value || null,
        status: document.getElementById('statusOp').value,
        vehicle: document.getElementById('allocVehicle').value || null,
        technician: document.getElementById('allocTechnician').value || null,
        driver: document.getElementById('allocDriver').value || null,
        period: getPeriod(document.getElementById('setupTime').value),
        observations: document.getElementById('observationsOp').value.trim() || null
    };

    // Validar
    if (!formData.client_id || !formData.event_name || !formData.event_date) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    const btnSave = document.getElementById('btnSave');
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    try {
        if (editingId) {
            // Editar
            const response = await api.put(`/operations/${editingId}`, formData);
            const index = operations.findIndex(o => o.id === editingId);
            if (index !== -1) {
                operations[index] = response;
            }
            showNotification('Operação atualizada com sucesso!', 'success');
        } else {
            // Nova
            const response = await api.post('/operations', formData);
            operations.push(response);
            showNotification('Operação criada com sucesso!', 'success');
        }

        renderOperations();
        closeModal();

    } catch (error) {
        console.error('Erro ao salvar operação:', error);
        showNotification('Erro ao salvar operação', 'error');
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = '<i class="fas fa-save"></i> Salvar';
    }
}

// Determinar período baseado no horário
function getPeriod(time) {
    if (!time) return 'morning';
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
}

// Deletar operação
async function deleteOperation(id) {
    if (!confirm('Tem certeza que deseja excluir esta operação?')) return;

    try {
        await api.delete(`/operations/${id}`);
        operations = operations.filter(o => o.id !== id);
        renderOperations();
        showNotification('Operação excluída com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir operação:', error);
        showNotification('Erro ao excluir operação', 'error');
    }
}

// Loading
function showLoading(show) {
    const list = document.getElementById('operationsList');
    if (show) {
        list.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div class="spinner" style="margin: 0 auto;"></div>
                <p style="color: rgba(255,255,255,0.3); margin-top: 16px;">Carregando operações...</p>
            </div>
        `;
    }
}

// Notificações
function showNotification(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const container = document.querySelector('.toast-container') || (() => {
        const c = document.createElement('div');
        c.className = 'toast-container';
        document.body.appendChild(c);
        return c;
    })();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    });

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Event Listeners
if (btnNewOperation) btnNewOperation.addEventListener('click', openNewOperationModal);
if (btnCancel) btnCancel.addEventListener('click', closeModal);
if (btnClose) btnClose.addEventListener('click', closeModal);
if (operationForm) operationForm.addEventListener('submit', saveOperation);

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

if (searchInput) searchInput.addEventListener('input', renderOperations);
if (filterStatus) filterStatus.addEventListener('change', renderOperations);
if (filterDate) filterDate.addEventListener('change', renderOperations);

// Exportar funções
window.editOperation = editOperation;
window.deleteOperation = deleteOperation;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    api.token = token;
    loadOperations();
});
// Botão flutuante
const fabButton = document.getElementById('fabNewOperation');
if (fabButton) {
    fabButton.addEventListener('click', openNewOperationModal);
}

// Função para atualizar
window.refreshOperations = function () {
    loadOperations();
    showNotification('Operações atualizadas!', 'success');
};