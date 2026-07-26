// Navbar Component
console.log('Navbar carregado!');

document.addEventListener('DOMContentLoaded', function () {
    console.log('Inicializando Navbar...');

    // Data atual
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('pt-BR', options);
        console.log('Data atualizada:', dateElement.textContent);
    } else {
        console.warn('Elemento currentDate não encontrado');
    }

    // Nome do usuário
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Dados do usuário:', userData);

    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const userAvatar = document.getElementById('userAvatar');

    if (userName && userData.full_name) {
        userName.textContent = userData.full_name;
        console.log('Nome atualizado:', userData.full_name);
    }

    if (userRole && userData.role) {
        const roleMap = {
            'ADMIN': 'Administrador',
            'SUPERVISOR': 'Supervisor',
            'OPERADOR': 'Operador',
            'MOTORISTA': 'Motorista',
            'TECNICO': 'Técnico',
            'VISITANTE': 'Visitante'
        };
        userRole.textContent = roleMap[userData.role] || userData.role;
        console.log('Role atualizada:', userRole.textContent);
    }

    if (userAvatar && userData.full_name) {
        userAvatar.textContent = userData.full_name.charAt(0).toUpperCase();
        console.log('Avatar atualizado:', userAvatar.textContent);
    }

    // Dropdown do usuário
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
            console.log('Dropdown toggled');
        });

        document.addEventListener('click', function () {
            userDropdown.classList.remove('show');
        });
    } else {
        console.warn('Elementos do dropdown não encontrados');
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '../index.html';
        });
        console.log('Logout configurado');
    }
});