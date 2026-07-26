// Technicians - CRUD Completo com API

let technicians = [];
let editingId = null;

// DOM Elements
const techniciansGrid = document.getElementById('techniciansGrid');
const searchInput = document.getElementById('searchTechnician');
const filterTeam = document.getElementById('filterTeam');
const filterAvailability = document.getElementById('filterAvailability');
const btnNewTechnician = document.getElementById('btnNewTechnician');
const modal = document.getElementById('technicianModal');
const modalTitle = document.getElementById('modalTitle');
const technicianForm = document.getElementById('technicianForm');
const btnCancel = document.getElementById('btnCancel');
const btnClose = document.getElementById('modalClose');
const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');

// Mapeamento de status
const statusMap = {
    true: 'Disponível',
    false: 'Ocupado'
};

const statusClassMap = {
    true: 'disponivel',
    false: 'ocupado'
};

// Carregar técnicos da API
async function loadTechnicians() {
    try {
        showLoading(true);
        const data = await api.get('/technicians?limit=100');
        technicians = data || [];
        renderTechnicians();
        updateStats();
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar técnicos:', error);
        showNotification('Erro ao carregar técnicos', 'error');
        showLoading(false);
    }
}

// Atualizar estatísticas
function updateStats() {
    const total = technicians.length;
    const available = technicians.filter(t => t.is_available).length;
    const occupied = total - available;

    // Atualizar cards no dashboard se existirem
    const availableEl = document.getElementById('techniciansAvailable');
    if (availableEl) availableEl.textContent = available;
}

// Renderizar técnicos
function renderTechnicians() {
    const searchTerm = searchInput.value.toLowerCase();
    const teamFilter = filterTeam.value;
    const availabilityFilter = filterAvailability.value;

    const filtered = technicians.filter(t => {
        const matchSearch =
            t.name.toLowerCase().includes(searchTerm) ||
            t.function.toLowerCase().includes(searchTerm) ||
            (t.team && t.team.toLowerCase().includes(searchTerm));
        const matchTeam = !teamFilter || t.team === teamFilter;
        const matchAvailability = !availabilityFilter || String(t.is_available) === availabilityFilter;
        return matchSearch && matchTeam && matchAvailability;
    });

    if (filtered.length === 0) {
        techniciansGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.3);">
                <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                <p style="font-size: 16px;">Nenhum técnico encontrado</p>
                <p style="font-size: 14px; margin-top: 4px;">Tente ajustar os filtros ou adicione um novo técnico</p>
            </div>
        `;
        return;
    }

    techniciansGrid.innerHTML = filtered.map(t => `
        <div class="technician-card" data-id="${t.id}">
            <div class="status-indicator ${statusClassMap[t.is_available]}">
                <span class="dot"></span>
                ${statusMap[t.is_available]}
            </div>
            
            <div class="avatar">
                ${t.photo_url ? `<img src="${t.photo_url}" alt="${t.name}">` : t.name.charAt(0)}
                ${t.is_available ? '<span class="online-dot"></span>' : ''}
            </div>
            
            <div class="technician-name">${t.name}</div>
            <div class="technician-function">${t.function} ${t.team ? '| ' + t.team : ''}</div>
            
            <div class="technician-details">
                <div class="detail-item">
                    <i class="fas fa-phone"></i>
                    ${t.phone || 'N/A'}
                </div>
                <div class="detail-item">
                    <i class="fas fa-users"></i>
                    ${t.team || 'Sem equipe'}
                </div>
            </div>
            
            <div class="technician-actions">
                <button class="btn-edit" onclick="editTechnician(${t.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-delete" onclick="deleteTechnician(${t.id})">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn-status" onclick="toggleAvailability(${t.id})">
                    <i class="fas fa-${t.is_available ? 'pause' : 'play'}"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Abrir modal para novo técnico
function openNewTechnicianModal() {
    editingId = null;
    modalTitle.textContent = 'Novo Técnico';
    technicianForm.reset();
    document.getElementById('technicianId').value = '';
    document.getElementById('availability').value = 'true';
    document.getElementById('photoUrl').value = '';
    photoPreview.innerHTML = '<i class="fas fa-user"></i>';
    modal.classList.add('active');
}

// Abrir modal para editar técnico
function editTechnician(id) {
    const technician = technicians.find(t => t.id === id);
    if (!technician) return;

    editingId = id;
    modalTitle.textContent = 'Editar Técnico';

    document.getElementById('technicianId').value = technician.id;
    document.getElementById('name').value = technician.name;
    document.getElementById('phone').value = technician.phone || '';
    document.getElementById('function').value = technician.function;
    document.getElementById('team').value = technician.team || '';
    document.getElementById('availability').value = String(technician.is_available);
    document.getElementById('observationsTech').value = technician.observations || '';
    document.getElementById('photoUrl').value = technician.photo_url || '';

    if (technician.photo_url) {
        photoPreview.innerHTML = `<img src="${technician.photo_url}" alt="${technician.name}">`;
    } else {
        photoPreview.innerHTML = '<i class="fas fa-user"></i>';
    }

    modal.classList.add('active');
}

// Fechar modal
function closeModal() {
    modal.classList.remove('active');
    technicianForm.reset();
    editingId = null;
}

// Salvar técnico
async function saveTechnician(event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim() || null,
        function: document.getElementById('function').value,
        team: document.getElementById('team').value || null,
        is_available: document.getElementById('availability').value === 'true',
        observations: document.getElementById('observationsTech').value.trim() || null,
        photo_url: document.getElementById('photoUrl').value || null
    };

    // Validar
    if (!formData.name || !formData.function) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    const btnSave = document.getElementById('btnSave');
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    try {
        if (editingId) {
            // Editar
            const response = await api.put(`/technicians/${editingId}`, formData);
            const index = technicians.findIndex(t => t.id === editingId);
            if (index !== -1) {
                technicians[index] = response;
            }
            showNotification('Técnico atualizado com sucesso!', 'success');
        } else {
            // Novo
            const response = await api.post('/technicians', formData);
            technicians.push(response);
            showNotification('Técnico cadastrado com sucesso!', 'success');
        }

        renderTechnicians();
        updateStats();
        closeModal();

    } catch (error) {
        console.error('Erro ao salvar técnico:', error);
        showNotification('Erro ao salvar técnico', 'error');
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = '<i class="fas fa-save"></i> Salvar';
    }
}

// Deletar técnico
async function deleteTechnician(id) {
    if (!confirm('Tem certeza que deseja excluir este técnico?')) return;

    try {
        await api.delete(`/technicians/${id}`);
        technicians = technicians.filter(t => t.id !== id);
        renderTechnicians();
        updateStats();
        showNotification('Técnico excluído com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir técnico:', error);
        showNotification('Erro ao excluir técnico', 'error');
    }
}

// Alternar disponibilidade
async function toggleAvailability(id) {
    const technician = technicians.find(t => t.id === id);
    if (!technician) return;

    const newAvailability = !technician.is_available;

    try {
        await api.put(`/technicians/${id}`, { is_available: newAvailability });
        technician.is_available = newAvailability;
        renderTechnicians();
        updateStats();
        showNotification(
            `Técnico ${newAvailability ? 'disponível' : 'ocupado'}`,
            'success'
        );
    } catch (error) {
        console.error('Erro ao alterar disponibilidade:', error);
        showNotification('Erro ao alterar disponibilidade', 'error');
    }
}

// Upload de foto
if (uploadPhotoBtn) {
    uploadPhotoBtn.addEventListener('click', () => {
        photoInput.click();
    });
}

if (photoInput) {
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            document.getElementById('photoUrl').value = dataUrl;
            photoPreview.innerHTML = `<img src="${dataUrl}" alt="Foto">`;
        };
        reader.readAsDataURL(file);
    });
}

// Loading
function showLoading(show) {
    const grid = document.getElementById('techniciansGrid');
    if (show) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div class="spinner" style="margin: 0 auto;"></div>
                <p style="color: rgba(255,255,255,0.3); margin-top: 16px;">Carregando técnicos...</p>
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
if (btnNewTechnician) btnNewTechnician.addEventListener('click', openNewTechnicianModal);
if (btnCancel) btnCancel.addEventListener('click', closeModal);
if (btnClose) btnClose.addEventListener('click', closeModal);
if (technicianForm) technicianForm.addEventListener('submit', saveTechnician);

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

if (searchInput) searchInput.addEventListener('input', renderTechnicians);
if (filterTeam) filterTeam.addEventListener('change', renderTechnicians);
if (filterAvailability) filterAvailability.addEventListener('change', renderTechnicians);

// Exportar funções para uso inline
window.editTechnician = editTechnician;
window.deleteTechnician = deleteTechnician;
window.toggleAvailability = toggleAvailability;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    api.token = token;
    loadTechnicians();
});