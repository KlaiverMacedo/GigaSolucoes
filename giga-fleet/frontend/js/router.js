// Router SPA - Navegação sem recarregar página
class Router {
    constructor() {
        this.routes = {
            '/': 'pages/dashboard.html',
            '/dashboard': 'pages/dashboard.html',
            '/fleet': 'pages/fleet.html',
            '/technicians': 'pages/technicians.html',
            '/operations': 'pages/operations.html',
            '/planning': 'pages/planning.html'
        };

        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        // Interceptar cliques em links de navegação
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-nav]');
            if (link) {
                e.preventDefault();
                const page = link.dataset.nav;
                this.navigateTo(page);
            }
        });

        // Navegar para a página atual
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'dashboard';
        this.navigateTo(page, false);
    }

    async navigateTo(page, pushState = true) {
        const pageMap = {
            'dashboard': 'pages/dashboard.html',
            'fleet': 'pages/fleet.html',
            'technicians': 'pages/technicians.html',
            'operations': 'pages/operations.html',
            'planning': 'pages/planning.html'
        };

        const url = pageMap[page] || pageMap['dashboard'];
        this.currentPage = page;

        // Atualizar URL
        if (pushState) {
            history.pushState({ page }, '', `/${page}`);
        }

        // Carregar conteúdo
        try {
            const response = await fetch(url);
            const html = await response.text();

            // Extrair apenas o conteúdo principal (entre <main>)
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const mainContent = doc.querySelector('.dashboard-main') || doc.querySelector('main');

            if (mainContent) {
                document.querySelector('.dashboard-main')?.replaceWith(mainContent);
            } else {
                // Fallback: substituir todo o body
                document.body.innerHTML = html;
            }

            // Atualizar menu ativo
            this.updateActiveMenu(page);

            // Re-inicializar scripts da página carregada
            this.initPageScripts(page);

        } catch (error) {
            console.error('Erro ao carregar página:', error);
        }
    }

    updateActiveMenu(page) {
        document.querySelectorAll('[data-nav]').forEach(item => {
            item.classList.toggle('active', item.dataset.nav === page);
        });
    }

    initPageScripts(page) {
        // Inicializar scripts específicos da página
        switch (page) {
            case 'dashboard':
                if (typeof initDashboard === 'function') initDashboard();
                break;
            case 'fleet':
                if (typeof initFleet === 'function') initFleet();
                break;
            // Adicionar mais casos conforme necessário
        }
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.router = new Router();
});

// Navegação pelo histórico do navegador
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) {
        window.router.navigateTo(e.state.page, false);
    }
});