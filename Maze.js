/**
 * @typedef {Object} Level
 * @property {number} id -Jedinečný identifikátor úrovne.
 * @property {string} name - Názov Level.
 * @property {string} description - Popis úrovne.
 * @property {Size} size - Veľkosť úrovne (šírka a výška).
 * @property {Array < string >} maze - Dvojrozmerná reprezentácia bludiska ako pole reťazcov.
 * @property {number} timeLimit - Časový limit na dokončenie úrovne v sekundách.
 */

/**
 * @typedef {Object} Size
 * @property {number} width - Šírka úrovne.
 * @property {number} height - Výška úrovne...
 */
    // Game configuration
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');


    // Player and game state
    let player = {
    x: 50,
    y: 50,
    size: 20,
    speed: 5,
    color: 'red'
};

    let gameState = {
    currentLevel: 0,
    keys: [],
    traps: [],
    movingTraps: [],
    switches: [],
    walls: [],
    exit: null,
    levelComplete: false,
    collectedKeys: 0,
    completedLevels: []
};
let deviceOrientationHandler = null;
let LEVELS = [];
const wallTimer = {
    x: 0,
    y: 0,
    width: 0,
    maxWidth: 0,
    height: 50,
    color: '#4CAF50',

};
let currentScreenOrientation = 0;
let handlersAdded = false;
let timeRemaining = 0;
let timerInterval = null;
let targetPosition = null;
let gameLoopInterval = null;
class MovingTrap {
    constructor(x, y, size, speed = 5) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.direction = {x: 1, y: 0}; // Initial direction of movement (right)
    }
    move(walls) {
        const nextX = this.x + this.direction.x * this.speed;
        const nextY = this.y + this.direction.y * this.speed;

        // Check collision with walls
        const willCollide = walls.some(wall =>
            nextX < wall.x + wall.size &&
            nextX + this.size > wall.x &&
            nextY < wall.y + wall.size &&
            nextY + this.size > wall.y
        );

        if (willCollide ) {
            // Change direction
            this.direction.x *= -1;
            this.direction.y *= -1;
        } else {
            this.x = nextX;
            this.y = nextY;
        }
    }
}
let availableLevels = [];
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};
   // Game Initialization Functions
async function initGame() {
    LEVELS = await loadLevels();
    if (LEVELS.length > 0) {
        initializeRandomLevels();
    } else {
        console.error('Úrovne nie sú načítané. Hru nie je možné inicializovať.');
    }
    if (isMobileDevice()) {
        resizeCanvas();}
}
function startGame() {
    if (availableLevels.length === 0) {
        initializeRandomLevels();
    }
    const level = LEVELS[gameState.currentLevel];

    const parsedLevel = parseMaze(level.maze);

    // Set canvas size
    canvas.width = level.size.width;
    canvas.height = level.size.height;

    initialize(level, parsedLevel);

    document.getElementById('back-to-main-menu').style.display = 'block';
    document.getElementById('info').style.display = 'block';
    updateTaskInfo();
}
function initializeGameState() {
    clearGameIntervals();
    removeEventListeners();

    addMouseEventListeners();
    document.addEventListener('keydown', handleKeyMovement);

    gameLoopInterval = setInterval(gameLoop, 1000 / 60);
}
function initializeRandomLevels() {
    // Create a copy of all levels in random order
    const completedLevels = JSON.parse(localStorage.getItem('completedLevels') || '[]');
    availableLevels = LEVELS.map((_, index) => index)
        .filter(levelIndex => !completedLevels.includes(levelIndex))
        .sort(() => Math.random() - 0.5);

    localStorage.setItem('availableLevels', JSON.stringify(availableLevels));
}
function initWallTimer() {
    wallTimer.x = 0;
    wallTimer.y = canvas.height - wallTimer.height;
    wallTimer.width = canvas.width;
    wallTimer.maxWidth = canvas.width;
}
//Game State Management
function saveProgress() {
    localStorage.setItem('currentLevel', gameState.currentLevel);
    localStorage.setItem('completedLevels', JSON.stringify(gameState.completedLevels));
    localStorage.setItem('availableLevels', JSON.stringify(availableLevels));
}

function loadProgress() {
    const savedLevel = localStorage.getItem('currentLevel');
    const savedCompletedLevels = localStorage.getItem('completedLevels');
    const savedAvailableLevels = localStorage.getItem('availableLevels');

    if (savedLevel !== null) {
        gameState.currentLevel = parseInt(savedLevel, 10);
    } else {
        gameState.currentLevel = 0;
    }

    if (savedCompletedLevels !== null) {
        gameState.completedLevels = JSON.parse(savedCompletedLevels);
    } else {
        gameState.completedLevels = [];
    }

    if (savedAvailableLevels !== null) {
        availableLevels = JSON.parse(savedAvailableLevels);
    } else {
        initializeRandomLevels();
    }
}
function resetLevel() {

    const level = LEVELS[gameState.currentLevel];
    const parsedLevel = parseMaze(level.maze);

    initialize(level, parsedLevel);

    canvas.width = level.size.width;
    canvas.height = level.size.height;

}
function advanceToNextLevel() {
    resizeCanvas();
    // Add current level to completed levels if not already included
    if (!gameState.completedLevels.includes(gameState.currentLevel)) {
        gameState.completedLevels.push(gameState.currentLevel);
    }

    // Remove current level from available levels
    availableLevels = availableLevels.filter(level => level !== gameState.currentLevel);

    // Save progress after updating lists
    saveProgress();

    // Check if all levels are completed
    if (availableLevels.length === 0) {
        clearInterval(gameLoopInterval);
        clearInterval(timerInterval);
        showVictoryScreen();
        return;
    }



    const randomIndex = Math.floor(Math.random() * availableLevels.length);
    gameState.currentLevel = availableLevels[randomIndex];


    saveProgress();
    const nextLevel = LEVELS[gameState.currentLevel];
    const parsedLevel = parseMaze(nextLevel.maze);


    initialize(nextLevel,parsedLevel);
}
function initialize(level, parsedLevel) {
    player.x = parsedLevel.playerStart.x;
    player.y = parsedLevel.playerStart.y;
    gameState.keys = parsedLevel.keys;
    gameState.traps = parsedLevel.traps;
    gameState.movingTraps = parsedLevel.movingTraps;
    gameState.switches = parsedLevel.switches;
    gameState.walls = parsedLevel.walls;
    gameState.exit = parsedLevel.exit;
    gameState.collectedKeys = 0;

    targetPosition = null;
    updateTaskInfo();
    canvas.width = level.size.width;
    canvas.height = level.size.height;
    resizeCanvas();

    if (level.timeLimit !== undefined) {
        timeRemaining = level.timeLimit;
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
    } else {
        clearInterval(timerInterval);
        document.getElementById('timer').style.display = 'none';
    }
}
function updateTaskInfo() {
    const tasksDiv = document.getElementById('tasks');
    const level = LEVELS[gameState.currentLevel];
    document.getElementById('tasks').style.display = 'block';

    tasksDiv.innerHTML = `
                <h2>
                    <p >${level.name}</p>
                    <button class="info-button" onclick="toggleLevelInfo()">?</button>
                </h2>
                <div id="level-details" style="display: none;">
                 <div id="game-description">
                    <p class="p1">${level.description}</p>

                    <h1>Úniková hra - Útek z bludiska</h1>
    <p>Vitajte v dobrodružstve plnom výziev, kde vaším cieľom je úspešne prejsť bludiskom a dostať sa von!</p>

    <h2>Herný koncept</h2>
    <p>Ste hráč, ktorý sa musí dostať z komplexného bludiska. Vaším hlavným cieľom je:</p>
    <ul>
      <li>Pozbierať všetky kľúče rozmiestené v bludisku</li>
      <li>Aktivovať všetky prepínače</li>
      <li>Dostať sa k východu pred vypršaním časového limitu</li>
      <li>Vyhýbať sa pasciam, ktoré vás môžu okamžite poslať späť na začiatok</li>
    </ul>
  </div>

  <div id="game-instructions">
    <h2>Ako hrať</h2>

    <h3>Ovládanie</h3>
    <div id="desktop-controls">
      <h4>Počítač (Desktop)</h4>
      <ul>
        <li>Klávesy W, A, S, D: Pohyb hráča</li>
        <li>Myš: Automatické nasledovanie kurzoru</li>
        <li>Ak chcete hrať na klávesnici, je lepšie odstrániť kurzor myši z herného poľa.</li>
      </ul>
    </div>

    <div id="mobile-controls">
      <h4>Mobilné zariadenia</h4>
      <ul>
        <li>Držte telefón vo vodorovnej polohe, aby sa vám pohodlne hralo.</li>
        <li>Naklápanie telefónu: Ovládanie postavy</li>
      </ul>
    </div>

    <h3>Herné pravidlá</h3>
    <ul>
      <li>Každá úroveň má jedinečné rozloženie a výzvy</li>
      <li>Zozbierajte všetky kľúče</li>
      <li>Aktivujte všetky prepínače</li>
      <li>Dostanete sa k východu pred vypršaním času</li>
      <li>Vyhýbajte sa pasciam aj pohyblivé pasce</li>
    </ul>

    <h3>Tips</h3>
    <ul>
      <li>Plánujte si svoju trasu dopredu</li>
      <li>Sledujte zostávajúci čas</li>
      <li>Buďte opatrní pri pascách</li>
    </ul>
  </div>
                </div>
            `;
}
function toggleLevelInfo() {
    const levelDetails = document.getElementById('level-details');
    if (levelDetails.style.display === 'none') {
        levelDetails.style.display = 'block';
    } else {
        levelDetails.style.display = 'none';
    }
}
//Display and Canvas Management
function setupGameDisplay(showCanvas = true) {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('level-menu').style.display = 'none';
    canvas.style.display = showCanvas ? 'block' : 'none';
    document.getElementById('back-to-main-menu').style.display = showCanvas ? 'block' : 'none';
    document.getElementById('info').style.display = showCanvas ? 'block' : 'none';
    document.getElementById('tasks').style.display = showCanvas ? 'block' : 'none';
    document.getElementById('timer').style.display = 'none';
}
function resizeCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Store original canvas dimensions
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;

    // Calculate new dimensions while preserving aspect ratio
    let newWidth, newHeight;
    const aspectRatio = originalWidth / originalHeight;


    if (windowWidth > windowHeight) {
        // Phone in horizontal position
        newHeight = windowHeight * 0.7;
        newWidth = newHeight * aspectRatio;
    } else {
        // Phone in vertical position
        newWidth = windowWidth * 0.7;
        newHeight = newWidth / aspectRatio;
    }

    // Update canvas display size
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;

    // Keep the original canvas dimensions for game logic
    canvas.width = originalWidth;
    canvas.height = originalHeight;

    // Calculate scale factors
    const scaleX = canvas.width / newWidth;
    const scaleY = canvas.height / newHeight;

    // Update game object positions proportionally
    if (!isNaN(scaleX) && !isNaN(scaleY) && scaleX > 0 && scaleY > 0) {
        // Scale player position
        player.x = (player.x * scaleX) / scaleX;
        player.y = (player.y * scaleY) / scaleY;

        // Scale walls
        gameState.walls.forEach(wall => {
            wall.x = (wall.x * scaleX) / scaleX;
            wall.y = (wall.y * scaleY) / scaleY;
        });

        // Scale keys
        gameState.keys.forEach(key => {
            key.x = (key.x * scaleX) / scaleX;
            key.y = (key.y * scaleY) / scaleY;
        });

        // Scale traps
        gameState.traps.forEach(trap => {
            trap.x = (trap.x * scaleX) / scaleX;
            trap.y = (trap.y * scaleY) / scaleY;
        });

        // Scale switches
        gameState.switches.forEach(sw => {
            sw.x = (sw.x * scaleX) / scaleX;
            sw.y = (sw.y * scaleY) / scaleY;
        });

        // Scale exit
        if (gameState.exit) {
            gameState.exit.x = (gameState.exit.x * scaleX) / scaleX;
            gameState.exit.y = (gameState.exit.y * scaleY) / scaleY;
        }
    }
}

window.addEventListener('resize', resizeCanvas);

window.addEventListener('DOMContentLoaded', initGame);
function createLevelButtons() {
    const levelButtonsDiv = document.getElementById('level-buttons');
    levelButtonsDiv.innerHTML = ''; // Clear previous buttons

    LEVELS.forEach((level, index) => {
        const button = document.createElement('button');
        button.className = 'level-buttons';
        button.textContent = `Úroveň ${level.id}`;
        button.addEventListener('click', () => {

            if (gameLoopInterval) {
                clearInterval(gameLoopInterval);
            }
            if (timerInterval) {
                clearInterval(timerInterval);
            }


            document.removeEventListener('keydown', handleKeyMovement);
            canvas.removeEventListener('mousemove', () => {});
            window.removeEventListener('deviceorientation', () => {});


            handlersAdded = false;

            gameState.currentLevel = index;
            saveProgress();
            document.getElementById('level-menu').style.display = 'none';
            canvas.style.display = 'block';

            startGame();
            resizeCanvas();
            addMouseEventListeners();
            document.addEventListener('keydown', handleKeyMovement);


            gameLoopInterval = setInterval(gameLoop, 1000 / 60);
        });
        levelButtonsDiv.appendChild(button);
    });
}
function clearGameIntervals() {
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
    }
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}
function removeEventListeners() {
    document.removeEventListener('keydown', handleKeyMovement);
    canvas.removeEventListener('mousemove', () => {});
    // Remove existing device orientation handler if it exists
    if (deviceOrientationHandler) {
        window.removeEventListener('deviceorientation', deviceOrientationHandler);
        deviceOrientationHandler = null;

    }

    handlersAdded = false;
}



//Game Loop and Core Mechanics
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState.movingTraps && gameState.movingTraps.length > 0) {
        gameState.movingTraps.forEach(trap => {
            trap.move(gameState.walls);
        });
    }

    drawWalls();
    drawKeys();
    drawTraps();
    drawSwitches();
    drawExit();
    drawPlayer();
    drawWallTimer();

    movePlayer();
    checkKeyCollision();
    checkTrapCollision();
    checkSwitchActivation();
    checkLevelCompletion();
}
let previousWindowWidth = window.innerWidth;
let previousWindowHeight = window.innerHeight;
function movePlayer() {

    const currentWindowWidth = window.innerWidth;
    const currentWindowHeight = window.innerHeight;

    // Get current screen orientation
    let newScreenOrientation = 0;
    if (screen.orientation) {
        newScreenOrientation = screen.orientation.angle || 0;
    }
    const scrollPos = {
        x: window.scrollX,
        y: window.scrollY
    };
    if (document.getElementById('failure-overlay') || document.getElementById('victory-overlay')) {
        return;
    }

    // Check for window size or orientation changes
    if (currentWindowWidth !== previousWindowWidth ||
        currentWindowHeight !== previousWindowHeight ||
        newScreenOrientation !== currentScreenOrientation) {

        previousWindowWidth = currentWindowWidth;
        previousWindowHeight = currentWindowHeight;
        currentScreenOrientation = newScreenOrientation;

        // Store current game state
        const currentGameState = {
            playerPos: {x: player.x, y: player.y},
            keys: gameState.keys.slice(),
            traps: gameState.traps.slice(),
            movingTraps: gameState.movingTraps.slice(),
            switches: gameState.switches.slice(),
            walls: gameState.walls.slice(),
            exit: {...gameState.exit},
            timeRemaining: timeRemaining > 0 ? timeRemaining : null,
            levelDetailsVisible: document.getElementById('level-details').style.display === 'block'
        };


        handlersAdded = false;
        removeEventListeners();
        addMouseEventListeners();

        // Reset and restore game state
        resetLevel();

        // Restore game state with proper scaling
        player.x = currentGameState.playerPos.x;
        player.y = currentGameState.playerPos.y;
        gameState.keys = currentGameState.keys;
        gameState.traps = currentGameState.traps;
        gameState.movingTraps = currentGameState.movingTraps;
        gameState.switches = currentGameState.switches;
        gameState.walls = currentGameState.walls;
        gameState.exit = currentGameState.exit;

        if (currentGameState.timeRemaining !== null) {
            timeRemaining = currentGameState.timeRemaining;
        }

        // Apply proper scaling
        resizeCanvas();
        document.getElementById('level-details').style.display = currentGameState.levelDetailsVisible ? 'block' : 'none';
        setTimeout(() => {
            window.scrollTo(scrollPos.x, scrollPos.y);
        }, 0);
    }

    // Handle keyboard movement
    if (!targetPosition || keys.w || keys.a || keys.s || keys.d) {
        let newX = player.x;
        let newY = player.y;

        if (keys.w) newY = Math.max(0, player.y - player.speed);
        if (keys.s) newY = Math.min(canvas.height - player.size, player.y + player.speed);
        if (keys.a) newX = Math.max(0, player.x - player.speed);
        if (keys.d) newX = Math.min(canvas.width - player.size, player.x + player.speed);

        if (!checkWallCollision(newX, newY)) {
            player.x = newX;
            player.y = newY;
        }
    }

    // Handle mouse/touch target movement
    if (targetPosition) {
        const dx = targetPosition.x - (player.x + player.size / 2);
        const dy = targetPosition.y - (player.y + player.size / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > player.speed) {
            const moveX = (dx / distance) * player.speed;
            const moveY = (dy / distance) * player.speed;

            const newX = player.x + moveX;
            const newY = player.y + moveY;

            if (!checkWallCollision(newX, player.y)) {
                player.x = newX;
            }
            if (!checkWallCollision(player.x, newY)) {
                player.y = newY;
            }
        } else {
            targetPosition = null;
        }
    }

    // Check for key collection
    if (gameState.keys.length > 0 &&
        gameState.keys.some(key =>
            player.x < key.x + key.size &&
            player.x + player.size > key.x &&
            player.y < key.y + key.size &&
            player.y + player.size > key.y
        )) {
        checkKeyCollision();
    }
}
function handleKeyMovement(event) {
    let newX = player.x;
    let newY = player.y;

    switch (event.key) {
        case 'w': newY = Math.max(0, player.y - player.speed); break;
        case 's': newY = Math.min(canvas.height - player.size, player.y + player.speed); break;
        case 'a': newX = Math.max(0, player.x - player.speed); break;
        case 'd': newX = Math.min(canvas.width - player.size, player.x + player.speed); break;
    }

    // Check for wall collision before moving
    if (!checkWallCollision(newX, newY)) {
        player.x = newX;
        player.y = newY;
    }
}
function addMouseEventListeners() {
    if (document.getElementById('failure-overlay') || document.getElementById('victory-overlay')) {
        return;
    }

    if (!handlersAdded) {
        if (isMobileDevice()) {
            initializeDeviceOrientation();

        }else {
            canvas.addEventListener('mousemove', (event) => {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;

                // Calculate mouse position with scaling
                const mouseX = (event.clientX - rect.left) * scaleX;
                const mouseY = (event.clientY - rect.top) * scaleY;

                // Check if mouse is within canvas bounds
                if (mouseX >= 0 && mouseX <= canvas.width && mouseY >= 0 && mouseY <= canvas.height) {
                    targetPosition = {
                        x: mouseX,
                        y: mouseY
                    };
                } else {
                    targetPosition = null;
                }
            });

            // Add mouse leave handler
            canvas.addEventListener('mouseout', () => {
                targetPosition = null;
            });
        }
        handlersAdded = true;
    }
}
function isMobileDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
function updateTimer() {
    const level = LEVELS[gameState.currentLevel];
    if (level.timeLimit != null) {
        if (timeRemaining > 0) {
            timeRemaining--;
            document.getElementById('timer').innerText = `Time: ${timeRemaining} sec`;

            wallTimer.width = (timeRemaining / level.timeLimit) * wallTimer.maxWidth;
        } else {
            document.removeEventListener('keydown', handleKeyMovement);
            canvas.removeEventListener('mousemove', () => {});
            window.removeEventListener('deviceorientation', () => {});

            clearInterval(timerInterval);
            clearInterval(gameLoopInterval);
            showFailureScreen('time');

        }
    }
}


//Collision Detection
// Game logic functions
function checkKeyCollision() {
    gameState.keys = gameState.keys.filter(key => {
        const collision =
            player.x < key.x + key.size &&
            player.x + player.size > key.x &&
            player.y < key.y + key.size &&
            player.y + player.size > key.y;

        if (collision) {
            key.collected = true;
            gameState.collectedKeys++;
        }

        return !key.collected;
    });
}

function checkWallCollision(newX, newY) {
    return gameState.walls.some(wall =>
        newX < wall.x + wall.size &&
        newX + player.size > wall.x &&
        newY < wall.y + wall.size &&
        newY + player.size > wall.y
    );
}

function checkTrapCollision() {
    gameState.traps.forEach(trap => {
        if (
            player.x < trap.x + trap.size &&
            player.x + player.size > trap.x &&
            player.y < trap.y + trap.size &&
            player.y + player.size > trap.y
        ) {

            document.removeEventListener('keydown', handleKeyMovement);
            canvas.removeEventListener('mousemove', () => {
            });
            window.removeEventListener('deviceorientation', () => {
            });

            clearInterval(timerInterval);
            clearInterval(gameLoopInterval);
            resetLevel();
            clearInterval(timerInterval);
            showFailureScreen('trap');
        }
    });
    gameState.movingTraps.forEach(trap => {
        if (
            player.x < trap.x + trap.size &&
            player.x + player.size > trap.x &&
            player.y < trap.y + trap.size &&
            player.y + player.size > trap.y
        ) {
            document.removeEventListener('keydown', handleKeyMovement);
            canvas.removeEventListener('mousemove', () => {});
            window.removeEventListener('deviceorientation', () => {});
            clearInterval(timerInterval);
            clearInterval(gameLoopInterval);
            resetLevel();
            clearInterval(timerInterval);
            showFailureScreen('trap');
        }
    });
}

function checkSwitchActivation() {
    gameState.switches.forEach(sw => {
        if (
            player.x < sw.x + sw.size &&
            player.x + player.size > sw.x &&
            player.y < sw.y + sw.size &&
            player.y + player.size > sw.y
        ) {
            sw.activated = true;
        }
    });
}

function checkLevelCompletion() {
    const allKeysCollected = gameState.keys.length === 0;
    const switchesActivated = gameState.switches.every(sw => sw.activated);
    const exitCollision = player.x < gameState.exit.x + gameState.exit.size &&
        player.x + player.size > gameState.exit.x &&
        player.y < gameState.exit.y + gameState.exit.size &&
        player.y + player.size > gameState.exit.y;


    const levelSpecificCondition = switchesActivated;

    if (allKeysCollected && levelSpecificCondition) {
        currentExitImage = exitActiveImage;
    } else {
        currentExitImage = exitImage;
    }

    if (allKeysCollected && exitCollision && levelSpecificCondition) {
        advanceToNextLevel();
    }
}
//Drawing Functions
// Rendering functions
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
}

function drawWalls() {
    ctx.fillStyle = 'gray';
    gameState.walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.size, wall.size);
    });
}

const keyImage = new Image();
keyImage.src = 'photos/key.png';
function drawKeys() {
    gameState.keys.forEach(key => {
        if (!key.collected) {
            ctx.drawImage(keyImage, key.x, key.y, key.size, key.size);
        }
    });
}

const trapImage = new Image();
trapImage.src = 'photos/trap.png';
function drawTraps() {
    gameState.traps.forEach(trap => {
        ctx.drawImage(trapImage, trap.x, trap.y, trap.size, trap.size);
    });
    gameState.movingTraps.forEach(trap => {
        ctx.drawImage(trapImage, trap.x, trap.y, trap.size, trap.size);
    });
}

const switchImage = new Image();
switchImage.src = 'photos/switchOff.png';

const activatedSwitchImage = new Image();
activatedSwitchImage.src = 'photos/switchOn.png';
function drawSwitches() {
    gameState.switches.forEach(sw => {
        const image = sw.activated ? activatedSwitchImage : switchImage;
        ctx.drawImage(image, sw.x, sw.y, sw.size, sw.size);
    });
}
const exitImage = new Image();
exitImage.src = 'photos/lock.png';

const exitActiveImage = new Image();
exitActiveImage.src = 'photos/exit.png';
let currentExitImage = exitImage;
function drawExit() {
    ctx.drawImage(currentExitImage, gameState.exit.x, gameState.exit.y, gameState.exit.size, gameState.exit.size);
}
function drawWallTimer() {
    initWallTimer();
    if (timeRemaining > 0) {
        const timeRatio = timeRemaining / LEVELS[gameState.currentLevel].timeLimit;
        wallTimer.width = wallTimer.maxWidth * timeRatio;


        if (timeRatio > 0.6) {
            wallTimer.color = '#4CAF50';
        } else if (timeRatio > 0.3) {
            wallTimer.color = '#FFA500';
        } else {
            wallTimer.color = '#FF0000';
        }

        ctx.fillStyle = wallTimer.color;
        ctx.fillRect(wallTimer.x, wallTimer.y, wallTimer.width, wallTimer.height);
    }
}


//Game Screen Management
function showVictoryScreen() {

    const victoryOverlay = document.createElement('div');
    victoryOverlay.id = 'victory-overlay';
    victoryOverlay.style.position = 'fixed';
    victoryOverlay.style.top = '0';
    victoryOverlay.style.left = '0';
    victoryOverlay.style.width = '100%';
    victoryOverlay.style.height = '100%';
    victoryOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
    victoryOverlay.style.display = 'flex';
    victoryOverlay.style.flexDirection = 'column';
    victoryOverlay.style.justifyContent = 'center';
    victoryOverlay.style.alignItems = 'center';
    victoryOverlay.style.color = 'white';
    victoryOverlay.style.zIndex = '1000';


    victoryOverlay.innerHTML = `
        <h1>Gratulujem!</h1>
        <p>Dokončili ste všetky úrovne!</p>
        <div style="display: flex; gap: 20px; margin-top: 20px;">
        <button id="victory-return-btn" style="
            padding: 10px 20px;
            margin-top: 20px;
            background-color: #4CAF50;
            color: black;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        ">Späť do hlavného menu</button>
         <button id="victory-restart-btn" style="
            padding: 10px 20px;
            margin-top: 20px;
            background-color: #4CAF50;
            color: black;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        ">Reštart</button></div>
`;


    document.body.appendChild(victoryOverlay);
    // Reset function to reuse in both buttons
    const resetGame = () => {
        // Reset completed levels array
        gameState.completedLevels = [];
        localStorage.removeItem('completedLevels');

        // Reset availableLevels to include all levels
        availableLevels = LEVELS.map((_, index) => index);

        // Reset current level to 0
        gameState.currentLevel = 0;
        localStorage.setItem('currentLevel', '0');

        // Reset collected keys
        gameState.collectedKeys = 0;

        // Save the reset progress
        saveProgress();
    };


    document.getElementById('victory-return-btn').addEventListener('click', () => {

        document.body.removeChild(victoryOverlay);

        resetGame();
        initializeRandomLevels();

        gameState.currentLevel = availableLevels[0];

        gameState.collectedKeys = 0;

        saveProgress();

        canvas.style.display = 'none';
        document.getElementById('menu').style.display = 'block';
        document.getElementById('back-to-main-menu').style.display = 'none';
        document.getElementById('info').style.display = 'none';
        document.getElementById('tasks').style.display = 'none';
        document.getElementById('timer').style.display = 'none';
    });
    document.getElementById('victory-restart-btn').addEventListener('click', () => {
        document.body.removeChild(victoryOverlay);
        resetGame();



        initializeRandomLevels();

        gameState.currentLevel = availableLevels[0];

        gameState.collectedKeys = 0;

        saveProgress();

        resetLevel();
        resizeCanvas();
        addMouseEventListeners();
        document.addEventListener('keydown', handleKeyMovement);

        gameLoopInterval = setInterval(gameLoop, 1000 / 60);
    });
}
function showFailureScreen(reason) {
    const failureOverlay = document.createElement('div');
    failureOverlay.id = 'failure-overlay';
    failureOverlay.style.position = 'fixed';
    failureOverlay.style.top = '0';
    failureOverlay.style.left = '0';
    failureOverlay.style.width = '100%';
    failureOverlay.style.height = '100%';
    failureOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
    failureOverlay.style.display = 'flex';
    failureOverlay.style.flexDirection = 'column';
    failureOverlay.style.justifyContent = 'center';
    failureOverlay.style.alignItems = 'center';
    failureOverlay.style.color = 'red';
    failureOverlay.style.zIndex = '1000';
    failureOverlay.style.textAlign = 'center';
    failureOverlay.style.fontSize = '2rem';

    let message;
    switch(reason) {
        case 'time':
            message = 'Čas vypršal!';
            break;
        case 'trap':
            message = 'Ste v pasci!';
            break;
        default:
            message = 'Prehrali ste!';
    }

    failureOverlay.innerHTML = `
    <h1>Koniec hry.</h1>
    <p>${message}</p>
    <div style="display: flex; gap: 20px; margin-top: 20px;">
      <button id="failure-restart-btn" style="
        padding: 10px 20px;
        background-color: #4CAF50;
        color: black;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      ">Reštart</button>
      <button id="failure-menu-btn" style="
        padding: 10px 20px;
        background-color: #f44336;
        color: black;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      ">Hlavné menu</button>
    </div>
  `;

    document.body.appendChild(failureOverlay);

    document.getElementById('failure-restart-btn').addEventListener('click', () => {
        document.body.removeChild(failureOverlay);
        resetLevel();


        addMouseEventListeners();
        document.addEventListener('keydown', handleKeyMovement);


        gameLoopInterval = setInterval(gameLoop, 1000 / 60);
    });
    document.body.appendChild(failureOverlay);

    // Úplné vymazanie všetkých obslužných programov
    document.removeEventListener('keydown', handleKeyMovement);
    canvas.removeEventListener('mousemove', () => {});
    window.removeEventListener('deviceorientation', () => {});

    document.getElementById('failure-restart-btn').addEventListener('click', () => {
        document.body.removeChild(failureOverlay);


        keys.w = false;
        keys.a = false;
        keys.s = false;
        keys.d = false;
        targetPosition = null;


        resetLevel();
        resizeCanvas();


        document.addEventListener('keydown', handleKeyMovement);


        addMouseEventListeners();


        gameLoopInterval = setInterval(gameLoop, 1000 / 60);
    });
    document.getElementById('failure-menu-btn').addEventListener('click', () => {
        document.body.removeChild(failureOverlay);
        canvas.style.display = 'none';
        document.getElementById('menu').style.display = 'block';
        document.getElementById('back-to-main-menu').style.display = 'none';
        document.getElementById('info').style.display = 'none';
        document.getElementById('tasks').style.display = 'none';
        document.getElementById('timer').style.display = 'none';


        clearInterval(gameLoopInterval);
        clearInterval(timerInterval);
    });
}

//Level Management

// Level data
async function loadLevels() {
    try {
        const response = await fetch('levels.json');
        if (!response.ok) {
            console.error(`Chyba pri načítavaní úrovní: ${response.status}`);
            return [];
        }
        const data = await response.json();
        console.log('Úrovne boli úspešne nahrané:', data);
        return data;
    } catch (error) {
        console.error('Chyba pri načítavaní úrovní:', error.message);
        return [];
    }
}
// Function to parse maze layout
function parseMaze(mazeLayout) {
    if (Array.isArray(mazeLayout[0])) {
        mazeLayout = mazeLayout[Math.floor(Math.random() * mazeLayout.length)];
    }
    const walls = [];
    const keys = [];
    const traps = [];
    const movingTraps = [];
    const switches = [];
    let playerStart = {x: 50, y: 50};
    let exit = {x: 550, y: 350, size: 30};
    const cellSize = 50; // Size of each cell

    mazeLayout.forEach((row, y) => {
        row.split('').forEach((cell, x) => {
            const cellX = x * cellSize;
            const cellY = y * cellSize;

            switch (cell) {
                case '#': // Wall
                    walls.push({x: cellX, y: cellY, size: cellSize});
                    break;
                case 'P': // Player start
                    playerStart = {x: cellX, y: cellY};
                    break;
                case 'K': // Key
                    keys.push({x: cellX, y: cellY, size: cellSize, collected: false});
                    break;
                case 'T': // Trap
                    traps.push({x: cellX, y: cellY, size: cellSize});
                    break;
                case 'M': // Moving trap
                    console.log('Creating moving trap at:', cellX, cellY);
                    movingTraps.push(new MovingTrap(cellX, cellY, cellSize));
                    break;
                case 'S': // Switch
                    switches.push({x: cellX, y: cellY, size: cellSize, activated: false});
                    break;
                case 'E': // Exit
                    exit = {x: cellX, y: cellY, size: cellSize};
                    break;
            }
        });
    });

    return {walls, keys, traps, movingTraps, switches, playerStart, exit};
}
//
document.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w': keys.w = true; break;
        case 'a': keys.a = true; break;
        case 's': keys.s = true; break;
        case 'd': keys.d = true; break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w': keys.w = false; break;
        case 'a': keys.a = false; break;
        case 's': keys.s = false; break;
        case 'd': keys.d = false; break;
    }
});
const SPEED = 30;
const SMOOTHING_FACTOR = 0.2;
const MAX_SPEED = 10; // Add a maximum speed limit

let smoothedGamma = 0;
let smoothedBeta = 0;

function initializeDeviceOrientation() {
    if (deviceOrientationHandler) {
        window.removeEventListener('deviceorientation', deviceOrientationHandler);
        deviceOrientationHandler = null;
    }

    if (window.DeviceOrientationEvent) {
        deviceOrientationHandler = function(event) {
            if (document.getElementById('failure-overlay') || document.getElementById('victory-overlay')) {
                return;
            }

            const gamma = event.gamma;
            const beta = event.beta;

            smoothedGamma += (gamma - smoothedGamma ) * SMOOTHING_FACTOR;
            smoothedBeta += (beta - smoothedBeta ) * SMOOTHING_FACTOR;

            const deadzone = 15;

            let moveX = 0;
            let moveY = 0;

            const normalizeWithDeadzone = (value) => {
                if (Math.abs(value) < deadzone) return 0;
                return Math.sign(value) * Math.pow(Math.abs(value) / 90, 2) * SPEED;
            };

            const orientation = screen.orientation?.angle || window.orientation || 0;

            switch (orientation) {
                case 90:  // Landscape left
                    moveX = normalizeWithDeadzone(smoothedBeta);
                    if (smoothedGamma > 60) {
                        moveY = normalizeWithDeadzone(smoothedGamma); // Move up if tilted too far down
                    } else {
                        moveY = -normalizeWithDeadzone(smoothedGamma); // Move down normally
                    }
                    break;
                case -90: // Landscape right
                case 270: // Some browsers use 270 instead of -90
                    moveX = -normalizeWithDeadzone(smoothedBeta);
                    if (smoothedGamma < -60) {
                        moveY = -normalizeWithDeadzone(smoothedGamma); // Move down if tilted too far up
                    } else {
                        moveY = normalizeWithDeadzone(smoothedGamma); // Move up normally
                    }
                    break;
                case 0:   // Portrait
                    moveX = normalizeWithDeadzone(smoothedGamma );
                    moveY = normalizeWithDeadzone(smoothedBeta);
                    break;
                case 180: // Upside down
                    moveX = -normalizeWithDeadzone(smoothedGamma );
                    moveY = -normalizeWithDeadzone(smoothedBeta );
                    break;
            }

            // Apply maximum speed limit
            moveX = Math.min(Math.max(moveX, -MAX_SPEED), MAX_SPEED);
            moveY = Math.min(Math.max(moveY, -MAX_SPEED), MAX_SPEED);

            let newX = Math.min(Math.max(player.x + moveX, 0), canvas.width - player.size);
            let newY = Math.min(Math.max(player.y + moveY, 0), canvas.height - player.size);

            // Check for wall collisions before moving
            if (!checkWallCollision(newX, player.y)) {
                player.x = newX;
            }
            if (!checkWallCollision(player.x, newY)) {
                player.y = newY;
            }
        };

        window.addEventListener('deviceorientation', deviceOrientationHandler);

        const handleOrientationChange = () => {
            if (deviceOrientationHandler) {
                window.removeEventListener('deviceorientation', deviceOrientationHandler);
            }

            setTimeout(() => {
                window.addEventListener('deviceorientation', deviceOrientationHandler);
            }, 500);
        };

        window.removeEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('orientationchange', handleOrientationChange);

        // Ensure initialization on page load
        handleOrientationChange();
    }
}

// Initialize on page load
window.addEventListener('load', () => {
    initializeDeviceOrientation();

    // Set initial smoothed values based on current orientation
    const orientation = screen.orientation?.angle || window.orientation || 0;
    if (orientation === 90 || orientation === -90 || orientation === 270) {
        smoothedGamma = 0;
        smoothedBeta = 0;
    }
});
// Initialize on page load
window.addEventListener('load', initializeDeviceOrientation);
document.getElementById('back-to-main-menu').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'block';
    document.getElementById('level-menu').style.display = 'none';
    canvas.style.display = 'none';
    document.getElementById('timer').style.display = 'none';
    clearInterval(gameLoopInterval);
    clearInterval(timerInterval);
    document.getElementById('back-to-main-menu').style.display = 'none';
    document.getElementById('info').style.display = 'none';
    document.getElementById('tasks').style.display = 'none';
    targetPosition=null;
});



document.getElementById('continue-game').addEventListener('click', () => {
    loadProgress();
    setupGameDisplay();
    startGame();
    initializeGameState();
    timerInterval = setInterval(updateTimer, 1000);
    resizeCanvas();
});

document.getElementById('new-game').addEventListener('click', () => {
    localStorage.removeItem('completedLevels');
    gameState.completedLevels = [];

    initializeRandomLevels();
    gameState.currentLevel = availableLevels[0];
    saveProgress();
    setupGameDisplay();
    startGame();
    initializeGameState();
    timerInterval = setInterval(updateTimer, 1000);
    resizeCanvas();
});

document.getElementById('level-select').addEventListener('click', () => {
    clearGameIntervals();
    removeEventListeners();
    setupGameDisplay(false);
    document.getElementById('level-menu').style.display = 'block';
    createLevelButtons();

});

document.getElementById('back-to-menu').addEventListener('click', () => {
    clearGameIntervals();
    removeEventListeners();
    setupGameDisplay(false);
    document.getElementById('menu').style.display = 'block';
});

document.getElementById('menu').style.display = 'block';
canvas.style.display = 'none';