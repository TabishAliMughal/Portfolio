// Animated Network Background
class NetworkBackground {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.connections = [];
        this.animationId = null;
        this.mouse = { x: 0, y: 0 };
        this.mouseRadius = 100;

        this.init();
    }

    init() {
        // Setup canvas
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '1';
        this.canvas.style.opacity = '1';
        this.canvas.style.pointerEvents = 'auto';

        console.log('Canvas setup complete, adding to container');
        this.container.appendChild(this.canvas);
        this.resize();
        this.createNodes();
        console.log(`Created ${this.nodes.length} nodes`);
        this.animate();

        // Mouse interaction
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        console.log(`Canvas resized to: ${this.canvas.width}x${this.canvas.height}`);
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    handleMouseLeave() {
        this.mouse.x = -999;
        this.mouse.y = -999;
    }

    createNodes() {
        const baseNodeCount = Math.min(200, Math.floor(this.canvas.width * this.canvas.height / 1000));
        const nodeCount = baseNodeCount; // Much denser network
        this.nodes = [];

        for (let i = 0; i < nodeCount; i++) {
            this.nodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1
            });
        }
    }

    updateNodes() {
        this.nodes.forEach(node => {
            // Calculate distance from mouse
            const dx = this.mouse.x - node.x;
            const dy = this.mouse.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Mouse interaction effect
            if (distance < this.mouseRadius) {
                const force = (this.mouseRadius - distance) / this.mouseRadius;
                const angle = Math.atan2(dy, dx);
                node.vx += Math.cos(angle) * force * 0.02;
                node.vy += Math.sin(angle) * force * 0.02;
            }

            // Apply velocity
            node.x += node.vx;
            node.y += node.vy;

            // Apply friction
            node.vx *= 0.98;
            node.vy *= 0.98;

            // Boundary collision
            if (node.x < 0 || node.x > this.canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > this.canvas.height) node.vy *= -1;

            node.x = Math.max(0, Math.min(this.canvas.width, node.x));
            node.y = Math.max(0, Math.min(this.canvas.height, node.y));
        });
    }

    drawConnections() {
        const maxDistance = 120;
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const dx = this.nodes[i].x - this.nodes[j].x;
                const dy = this.nodes[i].y - this.nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    // Check if connection is near mouse
                    const midX = (this.nodes[i].x + this.nodes[j].x) / 2;
                    const midY = (this.nodes[i].y + this.nodes[j].y) / 2;
                    const mouseDistance = Math.sqrt((this.mouse.x - midX) ** 2 + (this.mouse.y - midY) ** 2);
                    const mouseEffect = mouseDistance < this.mouseRadius ? 1 - (mouseDistance / this.mouseRadius) : 0;

                    const baseOpacity = (1 - distance / maxDistance) * 0.4;
                    const opacity = baseOpacity + mouseEffect * 0.4;

                    this.ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
                    this.ctx.lineWidth = 1 + mouseEffect * 1.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
                    this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    drawNodes() {
        this.nodes.forEach(node => {
            // Calculate distance from mouse for special effects
            const dx = this.mouse.x - node.x;
            const dy = this.mouse.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const isNearMouse = distance < this.mouseRadius;
            const intensity = isNearMouse ? 1 - (distance / this.mouseRadius) : 0;

            // Enhanced glow near mouse
            if (isNearMouse) {
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, node.radius + 8 + intensity * 5, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(102, 126, 234, ${0.3 * intensity})`;
                this.ctx.fill();
            }

            // Outer glow
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius + 3, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(102, 126, 234, ${0.1 + intensity * 0.2})`;
            this.ctx.fill();

            // Main node - brighter near mouse
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius + intensity * 2, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(102, 126, 234, ${0.8 + intensity * 0.2})`;
            this.ctx.fill();

            // Inner highlight
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, (node.radius + intensity * 2) * 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + intensity * 0.3})`;
            this.ctx.fill();
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.updateNodes();
        this.drawConnections();
        this.drawNodes();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize network background when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing network background...');
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        console.log('Hero section found, creating network background');
        new NetworkBackground(heroSection);
    } else {
        console.log('Hero section not found!');
    }
});

// Also try on window load as fallback
window.addEventListener('load', () => {
    const heroSection = document.querySelector('.hero');
    if (heroSection && !heroSection.querySelector('canvas')) {
        console.log('Creating network background on window load');
        new NetworkBackground(heroSection);
    }
});