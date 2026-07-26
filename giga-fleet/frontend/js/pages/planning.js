// Planning - Versão Kanban Funcional

let planningData = [];
let currentDate = new Date();
let draggedElement = null;
let draggedId = null;

// Configuração dos períodos
const periods = [
    { id: 'morning', label: 'Manhã', time: '07:00 - 12:00', icon: 'fa-sun' },
    { id: 'afternoon', label: 'Tarde', time: '13:00 - 18:00', icon: 'fa-cloud-sun' },
    { id: 'evening', label: 'Noite', time: '19:00 - 23:00', icon: 'fa-moon' }
];

// Funções auxiliares
function formatStatus(status) {
    const map = {
        'AGENDADO': 'Agendado',
        'EM_MONTAGEM': 'Em Montagem',
        'EM_OPERACAO': 'Em Operação',
        'EM_DESMONTAGEM': 'Em Desmontagem',
        'FINALIZADO': 'Finalizado',
        'CANCELADO': 'Cancelado'
    };
    return map[status] || status;
}

function getStatusClass(status) {
    const map = {
        'AGENDADO': 'agendado',
        'EM_MONTAGEM': 'em_montagem',
        'EM_OPERACAO': 'em_operacao',
        'EM_DESMONTAGEM': 'em_desmontagem',
        'FINALIZADO': 'finalizado',
        'CANCELADO': 'cancelado'
    };
    return map[status] || '';
}

// Carregar dados
async function loadPlanningData() {
    try {
        const dateStr = currentDate.toISOString().split('T')[0];

        // Buscar operações do dia
        const operations = await api.get(`/operations?event_date=${dateStr}`);
        planningData = operations || [];

        // Buscar recursos disponíveis
        const resources = await api.get('/integration/status/available');

        // Atualizar veículos disponíveis
        updateAvailableVehicles(resources.vehicles);

        // Atualizar técnicos disponíveis
        updateAvailableTechnicians(resources.technicians);

        renderPlanning();
        updateStats();
        updateDayDisplay();

    } catch (error) {
        console.error('Erro ao carregar planejamento:', error);
        showNotification('Erro ao carregar dados', 'error');
    }
}

// Atualizar veículos disponíveis
function updateAvailableVehicles(vehicles) {
    const container = document.getElementById('availableVehiclesList');
    if (!container) return;

    if (!vehicles || vehicles.length === 0) {
        container.innerHTML = '<span style="color: rgba(255,255,255,0.3); font-size: 13px;">Nenhum veículo disponível</span>';
        return;
    }

    container.innerHTML = vehicles.map(v => `
        <span class="tech-chip" style="border-color: rgba(52, 211, 153, 0.2);">
            <i class="fas fa-circle" style="font-size: 8px; color: #34d399;"></i>
            ${v.plate} - ${v.model} 
            ${v.status === 'RESERVADO' ? '<span style="color: #f59e0b; font-size: 10px;">(Reservado)</span>' : ''}
        </span>
    `).join('');
}

// Atualizar técnicos disponíveis
function updateAvailableTechnicians(technicians) {
    const container = document.getElementById('availableTechList');
    if (!container) return;

    if (!technicians || technicians.length === 0) {
        container.innerHTML = '<span style="color: rgba(255,255,255,0.3); font-size: 13px;">Nenhum técnico disponível</span>';
        return;
    }

    container.innerHTML = technicians.map(t => `
        <span class="tech-chip">
            <i class="fas fa-circle" style="font-size: 8px; color: #34d399;"></i>
            ${t.name} (${t.function || 'Técnico'})
        </span>
    `).join('');
}

// Renderizar planejamento (Kanban)
function renderPlanning() {
    periods.forEach(period => {
        const container = document.getElementById(`${period.id}Body`);
        if (!container) return;

        const operations = planningData.filter(op => op.period === period.id);

        if (operations.length === 0) {
            container.innerHTML = `
                <div class="timeline-card empty" data-period="${period.id}">
                    <i class="fas fa-plus-circle"></i> 
                    <span style="margin-left: 8px;">Arraste uma operação para cá</span>
                </div>
            `;
            return;
        }

        container.innerHTML = operations.map(op => `
            <div class="timeline-card" 
                 draggable="true" 
                 data-id="${op.id}"
                 data-period="${period.id}"
                 ondragstart="onDragStart(event)"
                 ondragend="onDragEnd(event)"
                 ondrop="onDrop(event)"
                 ondragover="onDragOver(event)"
                 ondragleave="onDragLeave(event)">
                
                <span class="card-status ${getStatusClass(op.status)}">${formatStatus(op.status)}</span>
                <div class="card-title">${op.event_name}</div>
                <div class="card-client"><i class="fas fa-building"></i> ${op.client}</div>
                
                <div class="card-details">
                    <span class="detail"><i class="fas fa-truck"></i> ${op.vehicle || 'Sem veículo'}</span>
                    <span class="detail"><i class="fas fa-user"></i> ${op.driver || 'Sem motorista'}</span>
                </div>
                
                <div class="card-team">
                    ${op.technician ? op.technician.split(',').map(t => `
                        <span class="tech-tag">${t.trim()}</span>
                    `).join('') : '<span class="tech-tag">Sem técnicos</span>'}
                </div>
            </div>
        `).join('');
    });
}

// Atualizar estatísticas
function updateStats() {
    const totalOps = planningData.length;
    const vehicles = [...new Set(planningData.map(op => op.vehicle).filter(v => v))];
    const techs = planningData.flatMap(op => op.technician ? op.technician.split(',').map(t => t.trim()) : []);
    const uniqueTechs = [...new Set(techs)];

    const totalOpsEl = document.getElementById('totalOps');
    const totalVehiclesEl = document.getElementById('totalVehicles');
    const totalTechsEl = document.getElementById('totalTechs');

    if (totalOpsEl) totalOpsEl.textContent = totalOps;
    if (totalVehiclesEl) totalVehiclesEl.textContent = vehicles.length;
    if (totalTechsEl) totalTechsEl.textContent = uniqueTechs.length;
}

// ---------- Drag and Drop ----------
function onDragStart(event) {
    const card = event.target.closest('.timeline-card');
    if (!card || card.classList.contains('empty')) return;

    draggedElement = card;
    draggedId = parseInt(card.dataset.id);
    card.classList.add('dragging');

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedId);
}

function onDragEnd(event) {
    const card = event.target.closest('.timeline-card');
    if (card) card.classList.remove('dragging');

    document.querySelectorAll('.timeline-card.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });
}

function onDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const target = event.target.closest('.timeline-card');
    if (target && target !== draggedElement && !target.classList.contains('empty')) {
        target.classList.add('drag-over');
    }
}

function onDragLeave(event) {
    const target = event.target.closest('.timeline-card');
    if (target) target.classList.remove('drag-over');
}

async function onDrop(event) {
    event.preventDefault();

    const target = event.target.closest('.timeline-card');
    if (!target || target === draggedElement || target.classList.contains('empty')) {
        document.querySelectorAll('.timeline-card.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        return;
    }

    const targetId = parseInt(target.dataset.id);
    const targetPeriod = target.dataset.period;

    // Encontrar os cards
    const draggedCard = planningData.find(op => op.id === draggedId);
    const targetCard = planningData.find(op => op.id === targetId);

    if (!draggedCard || !targetCard) {
        document.querySelectorAll('.timeline-card.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        return;
    }

    // Trocar períodos
    const draggedPeriod = draggedCard.period;
    const targetPeriodValue = targetCard.period;

    // Atualizar localmente
    draggedCard.period = targetPeriodValue;
    targetCard.period = draggedPeriod;

    // Salvar no backend
    try {
        await api.put(`/operations/${draggedId}`, { period: targetPeriodValue });
        await api.put(`/operations/${targetId}`, { period: draggedPeriod });

        renderPlanning();
        updateStats();
        showNotification('Operação movida com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao salvar movimento:', error);
        // Reverter
        draggedCard.period = draggedPeriod;
        targetCard.period = targetPeriodValue;
        renderPlanning();
        showNotification('Erro ao mover operação', 'error');
    }

    document.querySelectorAll('.timeline-card.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });
}

// ---------- Navegação ----------
function changeDay(days) {
    currentDate.setDate(currentDate.getDate() + days);
    loadPlanningData();
}

function goToday() {
    currentDate = new Date();
    loadPlanningData();
}

function updateDayDisplay() {
    const display = document.getElementById('currentDayDisplay');
    if (!display) return;

    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();

    if (isToday) {
        display.textContent = 'Hoje';
    } else {
        const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        display.textContent = currentDate.toLocaleDateString('pt-BR', options);
    }
}

// ---------- Reset ----------
function resetPlanning() {
    if (!confirm('Tem certeza que deseja resetar o planejamento?')) return;
    loadPlanningData();
    showNotification('Planejamento recarregado!', 'success');
}

// ---------- Notificações ----------
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


// Exportar funções
window.onDragStart = onDragStart;
window.onDragEnd = onDragEnd;
window.onDragOver = onDragOver;
window.onDragLeave = onDragLeave;
window.onDrop = onDrop;
window.changeDay = changeDay;
window.goToday = goToday;
window.resetPlanning = resetPlanning;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    // Atualizar token no API client
    api.token = token;

    loadPlanningData();
});
