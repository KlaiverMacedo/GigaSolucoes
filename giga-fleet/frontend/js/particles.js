// Sistema de Partículas para Tela de Login
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particlesCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.lines = [];
        this.mouse = { x: null, y: null };
        this.isActive = true;

        this.init();
        this.bindEvents();
        this.animate();
    }

    init() {
        // Ajustar tamanho do canvas
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Criar partículas
        const particleCount = Math.min(80, Math.floor(window.innerWidth / 10));
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                baseRadius: Math.random() * 2 + 1,
                pulse: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.02,
                opacity: 0.2 + Math.random() * 0.3
            });
        }
    }

    bindEvents() {
        // Mouse move
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            // Criar rastro de partículas
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: e.clientX + (Math.random() - 0.5) * 20,
                    y: e.clientY + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    radius: Math.random() * 1.5 + 0.5,
                    baseRadius: 1,
                    pulse: 0,
                    speed: 0.01,
                    opacity: 0.3,
                    life: 60,
                    maxLife: 60
                });
            }
        });

        // Redimensionar
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Atualizar e desenhar partículas
        const particlesToRemove = [];

        this.particles.forEach((particle, index) => {
            // Atualizar posição
            if (this.mouse.x !== null) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 200) {
                    const force = 0.02;
                    particle.vx += (dx / dist) * force;
                    particle.vy += (dy / dist) * force;
                }
            }

            particle.x += particle.vx;
            particle.y += particle.vy;

            // Limitar velocidade
            const maxSpeed = 1;
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            if (speed > maxSpeed) {
                particle.vx = (particle.vx / speed) * maxSpeed;
                particle.vy = (particle.vy / speed) * maxSpeed;
            }

            // Resistência
            particle.vx *= 0.99;
            particle.vy *= 0.99;

            // Pulse
            particle.pulse += particle.speed;
            const pulseFactor = 1 + Math.sin(particle.pulse) * 0.3;
            const currentRadius = particle.radius * pulseFactor;

            // Life (para partículas de rastro)
            if (particle.life !== undefined) {
                particle.life--;
                if (particle.life <= 0) {
                    particlesToRemove.push(index);
                    return;
                }
                particle.opacity = particle.life / particle.maxLife;
            }

            // Bordas
            if (particle.x < -10) particle.x = this.canvas.width + 10;
            if (particle.x > this.canvas.width + 10) particle.x = -10;
            if (particle.y < -10) particle.y = this.canvas.height + 10;
            if (particle.y > this.canvas.height + 10) particle.y = -10;

            // Desenhar partícula
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, currentRadius * 2
            );
            gradient.addColorStop(0, `rgba(255, 215, 0, ${particle.opacity})`);
            gradient.addColorStop(1, `rgba(255, 215, 0, 0)`);

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, currentRadius * 2, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, currentRadius * 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * 0.5})`;
            this.ctx.fill();
        });

        // Remover partículas mortas
        for (let i = particlesToRemove.length - 1; i >= 0; i--) {
            this.particles.splice(particlesToRemove[i], 1);
        }

        // Desenhar linhas de conexão
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                const maxDist = 150;
                if (dist < maxDist) {
                    const opacity = (1 - dist / maxDist) * 0.15;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        }

        // Limitar número de partículas
        if (this.particles.length > 300) {
            this.particles.splice(0, this.particles.length - 300);
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Iniciar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const particleSystem = new ParticleSystem();
});