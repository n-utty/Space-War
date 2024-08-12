const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

// Get preloaded assets
const spaceshipImg = document.getElementById('spaceshipImg');
const backgroundImg = document.getElementById('backgroundImg');
const asteroidImg = document.getElementById('asteroidImg');
const successSound = document.getElementById('successSound');
const collisionSound = document.getElementById('collisionSound');


// Query the new audio elements
const levelUpSound = document.getElementById('levelUpSound');
const gameOverSound = document.getElementById('gameOverSound');
const backgroundMusic = document.getElementById('backgroundMusic');

const spaceship = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    width: 100,
    height: 120,
    targetX: canvas.width / 2,
    speed: 30,
    isMoving: false
};

let asteroids = [];
let bullets = [];
const commands = [
    { description: 'Save file', shortcut: 'Ctrl+S' },
    { description: 'Copy', shortcut: 'Ctrl+C' },
    { description: 'Paste', shortcut: 'Ctrl+V' },
    { description: 'Cut', shortcut: 'Ctrl+X' },
    { description: 'Undo', shortcut: 'Ctrl+Z' },
    { description: 'Redo', shortcut: 'Ctrl+Y' },
    { description: 'Find', shortcut: 'Ctrl+F' },
    { description: 'Replace', shortcut: 'Ctrl+H' },
    { description: 'Go to line', shortcut: 'Ctrl+G' },
    { description: 'Comment selection', shortcut: 'Ctrl+K+C' },
    { description: 'Uncomment selection', shortcut: 'Ctrl+K+U' },
    { description: 'Start debugging', shortcut: 'F5' },
    { description: 'Stop debugging', shortcut: 'Shift+F5' },
    { description: 'Step over', shortcut: 'F10' },
    { description: 'Step into', shortcut: 'F11' },
    { description: 'Step out', shortcut: 'Shift+F11' },
    { description: 'Toggle breakpoint', shortcut: 'F9' },
    { description: 'Build solution', shortcut: 'Ctrl+Shift+B' },
    { description: 'Navigate backward', shortcut: 'Ctrl+Minus' },
    { description: 'Navigate forward', shortcut: 'Ctrl+Shift+Minus' },
    { description: 'Rename', shortcut: 'Ctrl+R+R' },
    { description: 'Toggle fullscreen', shortcut: 'Shift+Alt+Enter' },
    { description: 'Zoom in', shortcut: 'Ctrl+Shift+Period' },
    { description: 'Zoom out', shortcut: 'Ctrl+Shift+Comma' },
    { description: 'Go to definition', shortcut: 'F12' },
    { description: 'Find all references', shortcut: 'Shift+F12' },
    { description: 'Format document', shortcut: 'Ctrl+K+D' },
    { description: 'Format selection', shortcut: 'Ctrl+K+F' },

    { description: 'Collapse all', shortcut: 'Ctrl+M+O' },
    { description: 'Expand all', shortcut: 'Ctrl+M+P' }
];

let level = 1;
let pointsToNextLevel = 5;
let availableCommands = [...commands];
let missedCommands = [];
let score = 0;
let health = 5;
let gameActive = false;
let lastAsteroidTime = 0;

function createAsteroid() {
    if (availableCommands.length === 0) {
        endGame(true);
        return;
    }
    
    const commandIndex = Math.floor(Math.random() * availableCommands.length);
    const command = availableCommands[commandIndex];
    availableCommands.splice(commandIndex, 1);

    asteroids.push({
        x: Math.random() * (canvas.width - 80),
        y: 0,
        width: 80,
        height: 80,
        command: command,
        speed: 2 + (level - 1) * 0.5,  // Increase speed based on level
        targetted: false
    });
}

function drawSpaceship() {
    if (spaceship.isMoving) {
        if (Math.abs(spaceship.x - spaceship.targetX) < spaceship.speed) {
            spaceship.x = spaceship.targetX;
            spaceship.isMoving = false;
            shootBullet();
        } else if (spaceship.x < spaceship.targetX) {
            spaceship.x += spaceship.speed;
        } else if (spaceship.x > spaceship.targetX) {
            spaceship.x -= spaceship.speed;
        }
    }
    ctx.drawImage(spaceshipImg, spaceship.x, spaceship.y, spaceship.width, spaceship.height);
}

function shootBullet() {
    bullets.push({
        x: spaceship.x + spaceship.width / 2 - 2.5,
        y: spaceship.y,
        speed: 15,
        targetAsteroidX: spaceship.targetX + spaceship.width / 2
    });
}

function drawAsteroids() {
    asteroids.forEach(asteroid => {
        ctx.drawImage(asteroidImg, asteroid.x, asteroid.y, asteroid.width, asteroid.height);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(asteroid.command.description, asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height + 15);
        ctx.fillText(asteroid.command.shortcut, asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height + 30);
    });
}

function drawBullets() {
    ctx.fillStyle = 'yellow';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, 5, 15);
    });
}

function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].y += asteroids[i].speed;
        if (asteroids[i].y > canvas.height) {
            missedCommands.push(asteroids[i].command);
            asteroids.splice(i, 1);
            health = Math.max(0, health - 1);
            if (health <= 0 ) {
                endGame(false);
            }
            if (availableCommands.length === 0) {
                endGame(true);
            }
        }
    }
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > 0;
    });
}

function checkCollisions() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        if (
            asteroid.x < spaceship.x + spaceship.width &&
            asteroid.x + asteroid.width > spaceship.x &&
            asteroid.y < spaceship.y + spaceship.height &&
            asteroid.y + asteroid.height > spaceship.y
        ) {
            health--;
            collisionSound.currentTime = 0;
            collisionSound.play();
            missedCommands.push(asteroid.command);
            asteroids.splice(i, 1);

            if (health <= 0) {
                endGame(false);
            }
            if (availableCommands.length === 0) {
                endGame(true);
            }
        }
    }
}

function checkBulletCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];
            if (
                bullet.x < asteroid.x + asteroid.width &&
                bullet.x + 5 > asteroid.x &&
                bullet.y < asteroid.y + asteroid.height &&
                bullet.y + 15 > asteroid.y &&
                Math.abs(bullet.targetAsteroidX - (asteroid.x + asteroid.width / 2)) < 60 &&
                asteroid.targetted
            ) {
                bullets.splice(i, 1);
                asteroids.splice(j, 1);
                score++;
                successSound.currentTime = 0;
                successSound.play();
                createHitEffect(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2);
                
                // Check for level up
                if (score >= pointsToNextLevel) {
                    levelUp();
                }
                
                break;
            }
        }
    }
}

function drawHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = 10;
    const y = 70;

    ctx.fillStyle = 'red';
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = 'green';
    ctx.fillRect(x, y, (health / 5) * barWidth, barHeight);

    ctx.strokeStyle = 'white';
    ctx.strokeRect(x, y, barWidth, barHeight);
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Level: ${level}`, 10, 55);
}

function gameLoop(currentTime) {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    drawSpaceship();
    drawAsteroids();
    drawBullets();
    updateAsteroids();
    updateBullets();
    checkCollisions();
    checkBulletCollisions();
    drawScore();
    drawHealthBar();

    if (currentTime - lastAsteroidTime > 3000) {
        createAsteroid();
        lastAsteroidTime = currentTime;
    }

    if (gameActive) {
        requestAnimationFrame(gameLoop);
    }
}

function endGame(allCommandsUsed = false) {
    gameActive = false;
    backgroundMusic.pause();
    gameOverSound.currentTime = 0;
    gameOverSound.play();


    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    if (allCommandsUsed) {
        ctx.fillText('Congratulations! All commands completed!', canvas.width / 2, canvas.height / 2 - 40);
    } else {
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 40);
    }
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 50);

    // Adjusted position for missed commands
    const missedCommandsX = Math.max(10, canvas.width - 400);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'red';
    ctx.font = '28px Arial';
    ctx.fillText('Missed Commands:', missedCommandsX, 50);
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    missedCommands.forEach((command, index) => {
        const yPos = 90 + index * 30;
        if (yPos < canvas.height - 30) {  // Ensure it doesn't go off-screen
            ctx.fillText(`${command.description}: ${command.shortcut}`, missedCommandsX, yPos);
        }
    });
}

function startGame() {
    score = 0;
    health = 5;
    level = 1;
    pointsToNextLevel = 5;
    asteroids.length = 0;
    bullets.length = 0;
    availableCommands = [...commands];
    missedCommands = [];
    gameActive = true;
    lastAsteroidTime = 0;
    startScreen.style.display = 'none';
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', function(e) {
    if(gameActive) {
        e.preventDefault();  // Prevent all default behaviors during the game
    }
}, true);  // Use capturing phase

function levelUp() {
    level++;
    pointsToNextLevel += 5;
    levelUpSound.currentTime = 0;
    levelUpSound.play();
    
    // Increase difficulty
    asteroids.forEach(asteroid => {
        asteroid.speed += 0.5;
    });
}
function createHitEffect(x, y) {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    setTimeout(() => {
        ctx.clearRect(x - 21, y - 21, 42, 42);
    }, 100);
}

let heldKeys = new Set();
let lastKeyPressTime = 0;
const MAX_KEY_INTERVAL = 500; // milliseconds

function normalizeKey(key) {
    switch (key) {
        case 'Control': return 'Ctrl';
        case 'Alt': return 'Alt';
        case 'Shift': return 'Shift';
        case ',': 
        case '<': return 'Comma';
        case '.': 
        case '>': return 'Period';
        case '-': 
        case '_': return 'Minus';
        default: return key.length === 1 ? key.toUpperCase() : key;
    }
}

function checkShortcut() {
    const shortcutArray = Array.from(heldKeys).map(normalizeKey);
    const shortcut = shortcutArray.sort().join('+');

    console.log('Current held keys:', shortcut); // Debugging line

    const matchingCommand = commands.find(cmd => {
        const normalizedCmdShortcut = cmd.shortcut.split('+').map(normalizeKey).sort().join('+');
        return normalizedCmdShortcut === shortcut;
    });

    if (matchingCommand) {
        console.log('Matched shortcut:', matchingCommand.shortcut); // Debugging line

        const matchingAsteroidIndex = asteroids.findIndex(a => 
            a.command.shortcut === matchingCommand.shortcut && !a.targetted
        );

        if (matchingAsteroidIndex !== -1) {
            const targetAsteroid = asteroids[matchingAsteroidIndex];
            targetAsteroid.targetted = true;
            
            spaceship.targetX = targetAsteroid.x + targetAsteroid.width / 2 - spaceship.width / 2;
            spaceship.isMoving = true;

            const commandIndex = availableCommands.findIndex(c => c.shortcut === matchingCommand.shortcut);
            if (commandIndex !== -1) {
                availableCommands.splice(commandIndex, 1);
            }

            if (availableCommands.length === 0) {
                endGame(true);
            }

            // Reset held keys after successful match
            heldKeys.clear();
        }
    }
}

document.addEventListener('keydown', (event) => {
    if (gameActive) {
        event.preventDefault(); // Prevent default browser behavior

        const currentTime = new Date().getTime();
        if (currentTime - lastKeyPressTime > MAX_KEY_INTERVAL) {
            heldKeys.clear();
        }
        lastKeyPressTime = currentTime;

        const normalizedKey = normalizeKey(event.key);
        heldKeys.add(normalizedKey);

        checkShortcut();
    } else if (event.code === 'Space') {
        startGame();
    }
});

document.addEventListener('keyup', (event) => {
    if (gameActive) {
        const normalizedKey = normalizeKey(event.key);
        heldKeys.delete(normalizedKey);

        // For multi-key shortcuts, check on key release as well
        checkShortcut();
    }
});


startButton.addEventListener('click', startGame);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    spaceship.x = canvas.width / 2 - spaceship.width / 2;
    spaceship.y = canvas.height - 150;
});