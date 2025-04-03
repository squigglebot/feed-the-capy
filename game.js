// Game constants
const WINDOW_WIDTH = 800;
const WINDOW_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const CAPYBARA_SIZE = 100;
const BULLET_SIZE = 10;
const TOKENS_TO_WIN = 50;

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameStarted = false;
let gameOver = false;
let tokensCollected = 0;

// Player class
class Player {
    constructor() {
        this.x = 100;
        this.y = WINDOW_HEIGHT / 2;
        this.width = 50;
        this.height = 50;
        this.angle = 0;
        this.bullets = [];
    }

    move(direction) {
        if (direction === 'up') {
            this.angle = Math.max(-45, this.angle - 3);
        } else if (direction === 'down') {
            this.angle = Math.min(45, this.angle + 3);
        }
    }

    shoot() {
        const angleRad = this.angle * Math.PI / 180;
        const bullet = {
            x: this.x + 50,
            y: this.y + 25,
            width: BULLET_SIZE,
            height: BULLET_SIZE,
            speedX: BULLET_SPEED * Math.cos(angleRad),
            speedY: BULLET_SPEED * Math.sin(angleRad)
        };
        this.bullets.push(bullet);
    }

    draw() {
        // Draw bazooka
        ctx.save();
        ctx.translate(this.x + 25, this.y + 25);
        ctx.rotate(this.angle * Math.PI / 180);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -5, 50, 10);
        ctx.restore();

        // Draw player head
        ctx.fillStyle = '#FFA07A';
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 25, 25, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Capybara class
class Capybara {
    constructor() {
        this.x = WINDOW_WIDTH - 150;
        this.y = WINDOW_HEIGHT / 2;
        this.width = CAPYBARA_SIZE;
        this.height = CAPYBARA_SIZE;
        this.mouthOpen = false;
        this.mouthTimer = 0;
        this.glitchTimer = 0;
        this.glitchInterval = Math.random() * 60 + 30;
    }

    update() {
        // Mouth animation
        this.mouthTimer++;
        if (this.mouthTimer >= 120) {
            this.mouthOpen = !this.mouthOpen;
            this.mouthTimer = 0;
        }

        // Glitch movement
        this.glitchTimer++;
        if (this.glitchTimer >= this.glitchInterval) {
            this.y += Math.random() * 40 - 20;
            this.glitchTimer = 0;
            this.glitchInterval = Math.random() * 60 + 30;
        }

        // Keep within bounds
        this.y = Math.max(100, Math.min(WINDOW_HEIGHT - 200, this.y));
    }

    draw() {
        // Draw body
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 50, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw head
        ctx.beginPath();
        ctx.ellipse(this.x - 45, this.y, 25, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 55, this.y - 5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 55, this.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw mouth
        ctx.fillStyle = 'white';
        if (this.mouthOpen) {
            ctx.beginPath();
            ctx.ellipse(this.x - 45, this.y + 15, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(this.x - 45, this.y + 15, 15, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Bird class
class Bird {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = -50;
        this.y = Math.random() * 100 + 50;
        this.size = 20;
        this.speed = 2;
        this.wingAngle = 0;
        this.active = true;
    }

    update() {
        if (this.active) {
            this.x += this.speed;
            this.wingAngle += 0.2;
            if (this.x > WINDOW_WIDTH + 50) {
                this.reset();
            }
        }
    }

    draw() {
        if (this.active) {
            ctx.fillStyle = 'black';
            // Body
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.size, this.size/2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Wing
            const wingOffset = Math.sin(this.wingAngle) * 5;
            ctx.beginPath();
            ctx.ellipse(this.x + this.size/2, this.y + wingOffset, 
                       this.size/2, this.size/3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Tail
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.size/4);
            ctx.lineTo(this.x - 10, this.y);
            ctx.lineTo(this.x - 10, this.y + this.size/2);
            ctx.closePath();
            ctx.fill();
        }
    }
}

// Grass class
class Grass {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.height = Math.random() * 20 + 10;
    }

    draw() {
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.quadraticCurveTo(
            this.x + 10, this.y - this.height,
            this.x + 20, this.y
        );
        ctx.stroke();
    }
}

// Create game objects
const player = new Player();
const capybara = new Capybara();
const bird = new Bird();

// Create grass tufts
const grassTufts = [];
for (let i = 0; i < 40; i++) {
    const x = Math.random() * WINDOW_WIDTH;
    const y = Math.random() * (WINDOW_HEIGHT - 300) + (WINDOW_HEIGHT - 300);
    grassTufts.push(new Grass(x, y));
}

// Event listeners
document.addEventListener('keydown', (event) => {
    if (!gameStarted) {
        gameStarted = true;
        document.getElementById('startScreen').style.display = 'none';
        return;
    }

    if (gameOver) {
        if (event.key.toLowerCase() === 'r') {
            resetGame();
        }
        return;
    }

    if (event.key === ' ') {
        player.shoot();
    }
});

document.addEventListener('keydown', (event) => {
    if (!gameOver) {
        if (event.key === 'ArrowUp') {
            player.move('up');
        } else if (event.key === 'ArrowDown') {
            player.move('down');
        }
    }
});

// Game functions
function resetGame() {
    gameOver = false;
    tokensCollected = 0;
    player.bullets = [];
    player.y = WINDOW_HEIGHT / 2;
    player.angle = 0;
    capybara.y = WINDOW_HEIGHT / 2;
    document.getElementById('gameOverScreen').style.display = 'none';
}

function checkCollisions() {
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        
        // Check collision with capybara's mouth
        if (capybara.mouthOpen) {
            if (bullet.x < capybara.x - 45 + 45 &&
                bullet.x + bullet.width > capybara.x - 45 &&
                bullet.y < capybara.y + 35 + 25 &&
                bullet.y + bullet.height > capybara.y + 35) {
                player.bullets.splice(i, 1);
                tokensCollected++;
                
                // Move capybara and player randomly
                capybara.y += Math.random() * 100 - 50;
                player.y += Math.random() * 100 - 50;
                
                if (tokensCollected >= TOKENS_TO_WIN) {
                    gameOver = true;
                    document.getElementById('gameOverScreen').style.display = 'block';
                }
            }
        }
        
        // Remove bullets that go off screen
        if (bullet.x > WINDOW_WIDTH) {
            player.bullets.splice(i, 1);
        }
    }
}

function update() {
    if (!gameStarted || gameOver) return;

    // Update game objects
    capybara.update();
    bird.update();
    
    // Update bullets
    for (const bullet of player.bullets) {
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
    }
    
    checkCollisions();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
    
    // Draw grass tufts
    for (const grass of grassTufts) {
        grass.draw();
    }
    
    // Draw game objects
    bird.draw();
    capybara.draw();
    player.draw();
    
    // Draw bullets
    ctx.fillStyle = 'black';
    for (const bullet of player.bullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
    
    // Draw score
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${tokensCollected}/${TOKENS_TO_WIN}`, 10, 30);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop(); 