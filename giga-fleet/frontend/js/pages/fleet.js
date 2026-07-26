// Fleet - CRUD Completo com API

let vehicles = [];
let editingId = null;

// DOM Elements
const vehiclesGrid = document.getElementById('vehiclesGrid');
const searchInput = document.getElementById('searchVehicle');
const filterStatus = document.getElementById('filterStatus');
const btnNewVehicle = document.getElementById('btnNewVehicle');
const modal = document.getElementById('vehicleModal');
const modalTitle = document.getElementById('modalTitle');
const vehicleForm = document.getElementById('vehicleForm');
const btnCancel = document.getElementById('btnCancel');
const btnClose = document.getElementById('modalClose');

// Mapeamento de status
const statusMap = {
    'DISPONIVEL': 'Disponível',
    'EM_USO': 'Em Uso',
    'MANUTENCAO': 'Manutenção',
    'RESERVADO': 'Reservado'
};

const statusClassMap = {
    'DISPONIVEL': 'disponivel',
    'EM_USO': 'em_uso',
    'MANUTENCAO': 'manutencao',
    'RESERVADO': 'reservado'
};

// Carregar veículos da API
async function loadVehicles() {
    try {
        showLoading(true);
        const data = await api.get('/vehicles?limit=100');
        vehicles = data || [];
        renderVehicles();
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar veículos:', error);
        showNotification('Erro ao carregar veículos', 'error');
        showLoading(false);
    }
}

// Renderizar veículos
function renderVehicles() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilter = filterStatus.value;

    const filtered = vehicles.filter(v => {
        const matchSearch =
            v.plate.toLowerCase().includes(searchTerm) ||
            v.model.toLowerCase().includes(searchTerm) ||
            v.brand.toLowerCase().includes(searchTerm);
        const matchStatus = !statusFilter || v.status === statusFilter;
        return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
        vehiclesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.3);">
                <i class="fas fa-truck" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                <p style="font-size: 16px;">Nenhum veículo encontrado</p>
                <p style="font-size: 14px; margin-top: 4px;">Tente ajustar os filtros ou adicione um novo veículo</p>
            </div>
        `;
        return;
    }

    vehiclesGrid.innerHTML = filtered.map(v => `
        <div class="vehicle-card" data-id="${v.id}">
            <div class="status-indicator ${statusClassMap[v.status]}">
                <span class="dot"></span>
                ${statusMap[v.status]}
            </div>
            
            <div class="vehicle-icon">
                <i class="fas fa-${v.model === 'Caminhão' ? 'truck' : 'van-shuttle'}"></i>
            </div>
            
            <div class="vehicle-plate">${v.plate}</div>
            <div class="vehicle-model">${v.brand} ${v.model} ${v.capacity ? '| ' + v.capacity : ''}</div>
            
            <div class="vehicle-details">
                <div class="detail-item">
                    <i class="fas fa-tachometer-alt"></i>
                    ${v.mileage ? v.mileage.toLocaleString() : '0'} km
                </div>
                <div class="detail-item">
                    <i class="fas fa-user"></i>
                    ${v.driver_name || 'Sem motorista'}
                </div>
                <div class="detail-item">
                    <i class="fas fa-calendar-alt"></i>
                    ${v.documentation_date ? formatDate(v.documentation_date) : 'N/A'}
                </div>
                <div class="detail-item">
                    <i class="fas fa-wrench"></i>
                    ${v.next_maintenance ? formatDate(v.next_maintenance) : 'N/A'}
                </div>
            </div>
            
            <div class="vehicle-actions">
                <button class="btn-edit" onclick="editVehicle(${v.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-delete" onclick="deleteVehicle(${v.id})">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn-status" onclick="toggleStatus(${v.id})">
                    <i class="fas fa-sync-alt"></i>
                </button>
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

// Abrir modal para novo veículo
function openNewVehicleModal() {
    editingId = null;
    modalTitle.textContent = 'Novo Veículo';
    vehicleForm.reset();
    document.getElementById('vehicleId').value = '';
    document.getElementById('status').value = 'DISPONIVEL';
    modal.classList.add('active');
}

// Abrir modal para editar veículo
function editVehicle(id) {
    const vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) return;

    editingId = id;
    modalTitle.textContent = 'Editar Veículo';

    document.getElementById('vehicleId').value = vehicle.id;
    document.getElementById('plate').value = vehicle.plate;
    document.getElementById('model').value = vehicle.model;
    document.getElementById('brand').value = vehicle.brand;
    document.getElementById('capacity').value = vehicle.capacity || '';
    document.getElementById('status').value = vehicle.status;
    document.getElementById('driver').value = vehicle.driver_name || '';
    document.getElementById('mileage').value = vehicle.mileage || '';
    document.getElementById('docDate').value = vehicle.documentation_date || '';
    document.getElementById('nextMaintenance').value = vehicle.next_maintenance || '';
    document.getElementById('observations').value = vehicle.observations || '';

    modal.classList.add('active');
}

// Fechar modal
function closeModal() {
    modal.classList.remove('active');
    vehicleForm.reset();
    editingId = null;
}

// Salvar veículo
async function saveVehicle(event) {
    event.preventDefault();

    const formData = {
        plate: document.getElementById('plate').value.toUpperCase(),
        model: document.getElementById('model').value,
        brand: document.getElementById('brand').value,
        capacity: document.getElementById('capacity').value || null,
        status: document.getElementById('status').value,
        driver_name: document.getElementById('driver').value || null,
        mileage: parseFloat(document.getElementById('mileage').value) || 0,
        documentation_date: document.getElementById('docDate').value || null,
        next_maintenance: document.getElementById('nextMaintenance').value || null,
        observations: document.getElementById('observations').value || null
    };

    // Validar
    if (!formData.plate || !formData.model || !formData.brand) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    const btnSave = document.getElementById('btnSave');
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    try {
        if (editingId) {
            // Editar
            const response = await api.put(`/vehicles/${editingId}`, formData);
            const index = vehicles.findIndex(v => v.id === editingId);
            if (index !== -1) {
                vehicles[index] = response;
            }
            showNotification('Veículo atualizado com sucesso!', 'success');
        } else {
            // Novo
            const response = await api.post('/vehicles', formData);
            vehicles.push(response);
            showNotification('Veículo cadastrado com sucesso!', 'success');
        }

        renderVehicles();
        closeModal();

    } catch (error) {
        console.error('Erro ao salvar veículo:', error);
        showNotification('Erro ao salvar veículo', 'error');
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = '<i class="fas fa-save"></i> Salvar';
    }
}

// Deletar veículo
async function deleteVehicle(id) {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return;

    try {
        await api.delete(`/vehicles/${id}`);
        vehicles = vehicles.filter(v => v.id !== id);
        renderVehicles();
        showNotification('Veículo excluído com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir veículo:', error);
        showNotification('Erro ao excluir veículo', 'error');
    }
}

// Alternar status
async function toggleStatus(id) {
    const vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) return;

    const statusOrder = ['DISPONIVEL', 'EM_USO', 'MANUTENCAO', 'RESERVADO'];
    const currentIndex = statusOrder.indexOf(vehicle.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex];

    try {
        await api.put(`/vehicles/${id}`, { status: newStatus });
        vehicle.status = newStatus;
        renderVehicles();
        showNotification(`Status alterado para ${statusMap[newStatus]}`, 'success');
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        showNotification('Erro ao alterar status', 'error');
    }
}

// Loading
function showLoading(show) {
    const grid = document.getElementById('vehiclesGrid');
    if (show) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div class="spinner" style="margin: 0 auto;"></div>
                <p style="color: rgba(255,255,255,0.3); margin-top: 16px;">Carregando veículos...</p>
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
if (btnNewVehicle) btnNewVehicle.addEventListener('click', openNewVehicleModal);
if (btnCancel) btnCancel.addEventListener('click', closeModal);
if (btnClose) btnClose.addEventListener('click', closeModal);
if (vehicleForm) vehicleForm.addEventListener('submit', saveVehicle);

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

if (searchInput) searchInput.addEventListener('input', renderVehicles);
if (filterStatus) filterStatus.addEventListener('change', renderVehicles);

// Exportar funções para uso inline
window.editVehicle = editVehicle;
window.deleteVehicle = deleteVehicle;
window.toggleStatus = toggleStatus;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    api.token = token;
    loadVehicles();
});