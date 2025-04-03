const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');

// Game constants
const WINDOW_WIDTH = 800;
const WINDOW_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const CAPYBARA_SIZE = 100;
const BULLET_SIZE = 20;
const TOKENS_TO_WIN = 50;

// Colors
const WHITE = '#FFFFFF';
const BLACK = '#000000';
const BLUE = '#0000FF';
const RED = '#FF0000';
const CAPYBARA_COLOR = '#8B4513';
const GREEN = '#228B22';
const YELLOW = '#FFFF00';

// Game state
let gameStarted = false;
let keys = {};
let deltaTime = 0;
let lastTime = 0;

// Game objects
let player = {
    x: 100,
    y: WINDOW_HEIGHT - 100,
    width: 40,
    height: 40,
    angle: 0,
    bullets: [],
    tokens_collected: 0,
    game_over: false
};

// Add small capybaras
let smallCapybaras = [
    {
        x: 0,
        y: 0,
        width: 60,
        height: 60,
        speed: 3,
        direction: 1,
        health: 10,
        active: false,
        mouth_open: false,
        mouth_timer: 0,
        mouth_interval: 1000
    },
    {
        x: 0,
        y: 0,
        width: 60,
        height: 60,
        speed: 3,
        direction: 1,
        health: 10,
        active: false,
        mouth_open: false,
        mouth_timer: 0,
        mouth_interval: 1000
    }
];

// Add a flag to track if small capybaras have been spawned
let smallCapybarasSpawned = false;

// Add a timer for small capybaras to take points
let smallCapybarasTimer = 0;
const SMALL_CAPYBARAS_INTERVAL = 2000; // 2 seconds in milliseconds

class Capybara {
    constructor() {
        this.reset();
        this.glitch_timer = 0;
        this.glitch_interval = Math.random() * 2000 + 1000;
        this.mouth_open = false;
        this.mouth_timer = 0;
        this.mouth_interval = 1000; // Open/close mouth every second
    }

    reset() {
        this.x = WINDOW_WIDTH - 200; // Fixed position from right side
        this.y = WINDOW_HEIGHT - CAPYBARA_SIZE - 100;
        this.speed = 0; // Set speed to 0 to stop movement
        this.glitch_timer = 0;
        this.glitch_interval = Math.random() * 2000 + 1000;
        this.mouth_open = false;
        this.mouth_timer = 0;
    }

    update() {
        // Remove horizontal movement
        // Keep only the glitch movement
        this.glitch_timer += deltaTime;
        if (this.glitch_timer >= this.glitch_interval) {
            this.y += Math.random() * 40 - 20;
            this.y = Math.max(100, Math.min(WINDOW_HEIGHT - 100, this.y));
            this.glitch_timer = 0;
            this.glitch_interval = Math.random() * 2000 + 1000;
        }
        
        // Update mouth animation
        this.mouth_timer += deltaTime;
        if (this.mouth_timer >= this.mouth_interval) {
            this.mouth_open = !this.mouth_open;
            this.mouth_timer = 0;
        }
    }

    draw() {
        // Draw capybara as a single brown square
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - CAPYBARA_SIZE/2, this.y - CAPYBARA_SIZE/2, CAPYBARA_SIZE, CAPYBARA_SIZE);
        
        // Draw a much bigger rectangle at the right side of the capybara's head
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + CAPYBARA_SIZE/2, this.y - CAPYBARA_SIZE/2 - 20, 150, CAPYBARA_SIZE + 40);

        // Draw capybara eye (white circle with black pupil)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y - 15, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y - 15, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw mouth (white rectangle that opens and closes) - moved to left side
        ctx.fillStyle = 'white';
        if (this.mouth_open) {
            // Open mouth
            ctx.fillRect(this.x - 50, this.y + 10, 30, 20);
        } else {
            // Closed mouth
            ctx.fillRect(this.x - 50, this.y + 15, 30, 5);
        }
    }
}

let capybara = new Capybara();

let bird = {
    x: -50,
    y: 100,
    size: 30,
    speed: 2,
    wing_angle: 0,
    active: false
};

// Grass tufts
const grass_tufts = [];
for (let i = 0; i < 40; i++) {
    grass_tufts.push({
        x: Math.random() * WINDOW_WIDTH,
        y: WINDOW_HEIGHT - Math.random() * 300 - 20,
        width: 20,
        height: 40
    });
}

// Event listeners
window.addEventListener('keydown', function(e) {
    if (!gameStarted) {
        startGame();
    }
    keys[e.key] = true;
});

window.addEventListener('keyup', function(e) {
    keys[e.key] = false;
});

// Start screen click handler
startScreen.addEventListener('click', startGame);

function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        startScreen.style.display = 'none';
        requestAnimationFrame(gameLoop);
    }
}

// Initialize game
window.onload = function() {
    canvas.width = WINDOW_WIDTH;
    canvas.height = WINDOW_HEIGHT;
    startScreen.style.display = 'flex';
    
    // Add event listener for the reset button
    document.getElementById('resetButton').addEventListener('click', restartGame);
};

function gameLoop(timestamp) {
    if (!gameStarted) return;
    
    // Calculate deltaTime
    if (lastTime === 0) lastTime = timestamp;
    deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Clear canvas
    ctx.clearRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
    
    // Draw and update game elements
    drawGrass();
    drawBird();
    capybara.draw();
    capybara.update();
    drawSmallCapybaras();
    drawPlayer();
    drawBullets();
    drawScore();
    
    updatePlayer();
    updateBullets();
    updateBird();
    updateSmallCapybaras();
    
    requestAnimationFrame(gameLoop);
}

// Game functions
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle * Math.PI / 180);
    
    // Draw bazooka
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, -5, 40, 10);
    
    // Draw player head
    ctx.fillStyle = BLACK;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawBird() {
    if (!bird.active) return;
    
    // Body
    ctx.fillStyle = BLACK;
    ctx.fillRect(bird.x, bird.y, bird.size, bird.size/2);
    
    // Wing
    const wingOffset = Math.sin(bird.wing_angle) * 5;
    ctx.fillRect(bird.x + bird.size/2, bird.y + wingOffset, bird.size/2, bird.size/3);
    
    // Tail
    ctx.beginPath();
    ctx.moveTo(bird.x, bird.y + bird.size/4);
    ctx.lineTo(bird.x - 10, bird.y);
    ctx.lineTo(bird.x - 10, bird.y + bird.size/2);
    ctx.closePath();
    ctx.fill();
}

function drawGrass() {
    ctx.fillStyle = GREEN;
    grass_tufts.forEach(grass => {
        ctx.fillRect(grass.x, grass.y, grass.width, grass.height);
    });
}

function drawBullets() {
    ctx.fillStyle = BLUE;
    player.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function drawScore() {
    ctx.fillStyle = BLACK;
    ctx.font = '36px Arial';
    ctx.fillText(`Score: ${player.tokens_collected}/${TOKENS_TO_WIN}`, 10, 40);
}

function updatePlayer() {
    if (keys['ArrowUp']) {
        player.angle = Math.max(-45, player.angle - 3);
    }
    if (keys['ArrowDown']) {
        player.angle = Math.min(45, player.angle + 3);
    }
    if (keys[' ']) {
        shoot();
    }
}

function shoot() {
    if (player.bullets.length < 3) {
        const angle = player.angle * Math.PI / 180;
        player.bullets.push({
            x: player.x + 40 * Math.cos(angle),
            y: player.y + 40 * Math.sin(angle),
            width: BULLET_SIZE,
            height: BULLET_SIZE,
            speed: BULLET_SPEED,
            angle: angle
        });
    }
}

function updateBullets() {
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        bullet.x += bullet.speed * Math.cos(bullet.angle);
        bullet.y += bullet.speed * Math.sin(bullet.angle);
        
        // Check collision with capybara's mouth - make it more forgiving
        const mouthX = capybara.x - 50;
        const mouthY = capybara.y + 10;
        const mouthWidth = 30;
        const mouthHeight = capybara.mouth_open ? 20 : 5;
        
        // Add a buffer zone around the mouth for easier hits
        const bufferZone = 10;
        
        if (bullet.x < mouthX + mouthWidth + bufferZone &&
            bullet.x + bullet.width > mouthX - bufferZone &&
            bullet.y < mouthY + mouthHeight + bufferZone &&
            bullet.y + bullet.height > mouthY - bufferZone) {
            
            console.log("Bullet hit mouth area, mouth open:", capybara.mouth_open);
            
            // Only remove bullet and award points if the mouth is open
            if (capybara.mouth_open) {
                console.log("Removing bullet and awarding point");
                player.bullets.splice(i, 1);
                player.tokens_collected++;
                
                // Move capybara and player randomly
                capybara.y += Math.random() * 100 - 50;
                capybara.y = Math.max(100, Math.min(WINDOW_HEIGHT - 200, capybara.y));
                
                player.y += Math.random() * 100 - 50;
                player.y = Math.max(100, Math.min(WINDOW_HEIGHT - 100, player.y));
                
                if (player.tokens_collected >= TOKENS_TO_WIN) {
                    player.game_over = true;
                    gameOverScreen.style.display = 'flex';
                }
            } else {
                console.log("Mouth closed, bullet continues");
            }
            // If mouth is closed, bullet continues on its path
        }
        
        // Check collision with small capybaras
        smallCapybaras.forEach(capy => {
            if (capy.active) {
                if (bullet.x < capy.x + capy.width &&
                    bullet.x + bullet.width > capy.x &&
                    bullet.y < capy.y + capy.height &&
                    bullet.y + bullet.height > capy.y) {
                    
                    // Reduce health and remove bullet
                    capy.health--;
                    player.bullets.splice(i, 1);
                    
                    // Check if small capybara is defeated
                    if (capy.health <= 0) {
                        capy.active = false;
                    }
                    
                    // Break out of the loop since we've handled this bullet
                    return;
                }
            }
        });
        
        // Remove bullets that go off screen
        if (bullet.x > WINDOW_WIDTH) {
            player.bullets.splice(i, 1);
        }
    }
}

function updateCapybara() {
    capybara.mouth_timer++;
    if (capybara.mouth_timer >= capybara.mouth_interval) {
        capybara.mouth_open = !capybara.mouth_open;
        capybara.mouth_timer = 0;
    }
}

function updateBird() {
    if (!bird.active) {
        if (Math.random() < 0.01) {
            bird.active = true;
            bird.x = -50;
            bird.y = Math.random() * 200 + 50;
        }
    } else {
        bird.x += bird.speed;
        bird.wing_angle += 0.2;
        if (bird.x > WINDOW_WIDTH) {
            bird.active = false;
        }
    }
}

function updateSmallCapybaras() {
    // Check if we should activate small capybaras
    if (player.tokens_collected >= 30 && !smallCapybarasSpawned) {
        // Activate both small capybaras
        smallCapybaras[0].active = true;
        smallCapybaras[0].x = 0;
        smallCapybaras[0].y = WINDOW_HEIGHT / 3;
        smallCapybaras[0].direction = 1;
        
        smallCapybaras[1].active = true;
        smallCapybaras[1].x = 0;
        smallCapybaras[1].y = 2 * WINDOW_HEIGHT / 3;
        smallCapybaras[1].direction = 1;
        
        // Set the flag to indicate small capybaras have been spawned
        smallCapybarasSpawned = true;
        
        // Move the player to the middle of the y-axis
        player.y = WINDOW_HEIGHT / 2;
    }
    
    // Update each small capybara
    smallCapybaras.forEach(capy => {
        if (capy.active) {
            // Move the capybara - use deltaTime for smooth movement
            capy.x += capy.speed * capy.direction * (deltaTime / 16); // Normalize for 60fps
            
            // Change direction if hitting screen edge
            if (capy.x <= 0 || capy.x + capy.width >= WINDOW_WIDTH) {
                capy.direction *= -1;
            }
            
            // Update mouth animation
            capy.mouth_timer += deltaTime;
            if (capy.mouth_timer >= capy.mouth_interval) {
                capy.mouth_open = !capy.mouth_open;
                capy.mouth_timer = 0;
            }
        }
    });
    
    // Check if both small capybaras are still alive and take points
    if (smallCapybarasSpawned && smallCapybaras[0].active && smallCapybaras[1].active) {
        smallCapybarasTimer += deltaTime;
        if (smallCapybarasTimer >= SMALL_CAPYBARAS_INTERVAL) {
            // Take 2 points from the player's score
            player.tokens_collected = Math.max(0, player.tokens_collected - 2);
            smallCapybarasTimer = 0;
            
            // Flash the screen red to indicate points being taken
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
        }
    }
}

function drawSmallCapybaras() {
    smallCapybaras.forEach(capy => {
        if (capy.active) {
            // Draw small capybara body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(capy.x, capy.y, capy.width, capy.height);
            
            // Draw small capybara eye
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(capy.x + 10, capy.y + 10, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(capy.x + 10, capy.y + 10, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw small capybara mouth
            ctx.fillStyle = 'white';
            if (capy.mouth_open) {
                ctx.fillRect(capy.x + 30, capy.y + 20, 15, 10);
            } else {
                ctx.fillRect(capy.x + 30, capy.y + 25, 15, 3);
            }
            
            // Draw health bar
            ctx.fillStyle = 'red';
            ctx.fillRect(capy.x, capy.y - 10, capy.width, 5);
            ctx.fillStyle = 'green';
            ctx.fillRect(capy.x, capy.y - 10, capy.width * (capy.health / 10), 5);
        }
    });
    
    // Draw a warning message if both small capybaras are alive
    if (smallCapybarasSpawned && smallCapybaras[0].active && smallCapybaras[1].active) {
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
    }
}

function restartGame() {
    player = {
        x: 100,
        y: WINDOW_HEIGHT - 100,
        width: 40,
        height: 40,
        angle: 0,
        bullets: [],
        tokens_collected: 0,
        game_over: false
    };
    
    capybara = new Capybara();
    
    // Reset small capybaras
    smallCapybaras.forEach(capy => {
        capy.active = false;
        capy.health = 10;
    });
    
    // Reset the small capybaras spawned flag
    smallCapybarasSpawned = false;
    
    // Reset the small capybaras timer
    smallCapybarasTimer = 0;
    
    bird = {
        x: -50,
        y: 100,
        size: 30,
        speed: 2,
        wing_angle: 0,
        active: false
    };
    
    gameOverScreen.style.display = 'none';
    gameLoop();
} 