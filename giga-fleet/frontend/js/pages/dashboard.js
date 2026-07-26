// Dashboard - Versão Funcional

async function loadDashboardData() {
    try {
        // Usar o novo endpoint de status
        const stats = await api.get('/integration/status/dashboard');

        document.getElementById('vehiclesInUse').textContent = stats.vehicles_in_use || 0;
        document.getElementById('techniciansAvailable').textContent = stats.technicians_available || 0;
        document.getElementById('operationsToday').textContent = stats.operations_today || 0;
        document.getElementById('maintenancePending').textContent = stats.maintenance_pending || 0;

        // ... resto do código
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showNotification('Erro ao carregar dados do dashboard', 'error');
    }
}

function renderOperationsTable(operations) {
    const tbody = document.getElementById('operationsTableBody');
    if (!tbody) return;

    if (!operations || operations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: rgba(255,255,255,0.3); padding: 20px;">
                    Nenhuma operação para hoje
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = operations.map(op => `
        <tr>
            <td>${op.setup_time || 'N/A'}</td>
            <td><strong>${op.event_name}</strong></td>
            <td>${op.client}</td>
            <td>${op.technician || 'N/A'}</td>
            <td>${op.vehicle || 'N/A'}</td>
            <td><span class="status-badge ${op.status.toLowerCase()}">${formatStatus(op.status)}</span></td>
        </tr>
    `).join('');
}

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

async function loadChartData() {
    try {
        // Buscar dados para gráficos
        const vehicles = await api.get('/vehicles?limit=100');
        const technicians = await api.get('/technicians?limit=100');

        // Gráfico de Utilização da Frota
        const ctx1 = document.getElementById('fleetChart');
        if (ctx1) {
            const statusCount = {
                'DISPONIVEL': 0,
                'EM_USO': 0,
                'MANUTENCAO': 0,
                'RESERVADO': 0
            };
            vehicles.forEach(v => {
                if (statusCount[v.status] !== undefined) {
                    statusCount[v.status]++;
                }
            });

            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Disponível', 'Em Uso', 'Manutenção', 'Reservado'],
                    datasets: [{
                        data: [statusCount.DISPONIVEL, statusCount.EM_USO, statusCount.MANUTENCAO, statusCount.RESERVADO],
                        backgroundColor: ['#34d399', '#FFD700', '#ef4444', '#3b82f6'],
                        borderColor: '#0a0a0f',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: 'rgba(255, 255, 255, 0.6)',
                                padding: 12,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        }
                    }
                }
            });
        }

        // Gráfico de Técnicos
        const ctx2 = document.getElementById('techniciansChart');
        if (ctx2) {
            const available = technicians.filter(t => t.is_available).length;
            const occupied = technicians.length - available;

            new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Disponíveis', 'Ocupados'],
                    datasets: [{
                        data: [available, occupied],
                        backgroundColor: ['#34d399', '#ef4444'],
                        borderColor: '#0a0a0f',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: 'rgba(255, 255, 255, 0.6)',
                                padding: 12,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar gráficos:', error);
    }
}

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

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Verificar token
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    // Atualizar token no API client
    api.token = token;

    loadDashboardData();
});