// Configuração da API
const API_URL = 'http://localhost:8000/api/v1';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const togglePassword = document.getElementById('togglePassword');

// Toggle password visibility
togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.querySelector('i').classList.toggle('fa-eye');
    togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
});

// Função para mostrar erro
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.add('show');
    errorMessage.style.display = 'flex';

    // Esconder após 5 segundos
    setTimeout(() => {
        errorMessage.classList.remove('show');
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 300);
    }, 5000);
}

// Função para esconder erro
function hideError() {
    errorMessage.classList.remove('show');
    errorMessage.style.display = 'none';
}

// Função para fazer login
async function login(username, password) {
    // Mostrar loading
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    hideError();

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        // Remover loading
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao fazer login');
        }

        const data = await response.json();

        // Salvar tokens
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirecionar para dashboard
        window.location.href = 'pages/dashboard.html';

    } catch (error) {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        showError(error.message);
    }
}

// Evento de submit do formulário
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showError('Preencha todos os campos');
        return;
    }

    login(username, password);
});

// Verificar se já está logado
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (token) {
        // Verificar se token é válido (opcional)
        // window.location.href = 'pages/dashboard.html';
    }
});