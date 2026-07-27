import axios from 'axios';

// Cria a instância de conexão apontando para a nossa API Flask
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

export default api;