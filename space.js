//board
let tileSize = 32;
let rows = 16;
let columns = 16;

let board;
let boardWidth = tileSize * columns; // 32 * 16
let boardHeight = tileSize * rows; // 32 * 16
let context;

//ship
let shipWidth = tileSize*2;
let shipHeight = tileSize;
let shipX = tileSize * columns/2 - tileSize;
let shipY = tileSize * rows - tileSize*2;


let ship = {
    x : shipX,
    y : shipY,
    width : shipWidth,
    height : shipHeight
}


let pauseImg;
let shipImg;
let shipVelocityX = tileSize; //ship moving speed


//aliens
let alienArray = [];
let alienWidth = tileSize*2;
let alienHeight = tileSize;
let alienX = tileSize;
let alienY = tileSize;
let alienImg;

let alienRows = 2;
let alienColumns = 3;
let alienCount = 0; //number of aliens to defeat
let alienVelocityX = 1; //alien moving speed

//bullets
let bulletArray = [];
let bulletVelocityY = -10; //bullet moving speed

let score = 0;
let highScore = 0;
let gameOver = false;

let continueAnimation = true; // Flag to control animation

window.onload = function() {
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d"); //used for drawing on the board

    //draw initial ship
    // context.fillStyle="green";
    // context.fillRect(ship.x, ship.y, ship.width, ship.height);

    //load images

    //create pause button
    pauseImg = new Image();
    pauseImg.src = "./pausebutton.png";
    pauseImg.onload = function() {
       drawPauseButton();
    }
    //board click event listener
    board.addEventListener('click', function(event){
        const rect = board.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (x >= boardWidth-tileSize && x <= boardWidth-tileSize + pauseImg.width && y >= tileSize *.25 && y <= tileSize *.25 + pauseImg.height){
            // Click is inside the image
            togglePause();
            console.log('Image clicked!');
    }else{
        console.log("Image Not clicked")
    }
});


    //create ship
    shipImg = new Image();
    shipImg.src = "./ship.png";
    shipImg.onload = function() {
        context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);
    }

    alienImg = new Image();
    alienImg.src = "./alien.png";
    createAliens();

    requestAnimationFrame(update);
    document.addEventListener("keydown", moveShip);
    document.addEventListener("keyup", shoot);  
}

function drawPauseButton(){
    context.drawImage(pauseImg, boardWidth - tileSize, tileSize *.25, tileSize *0.8, tileSize*0.8);
}
function togglePause() {
    continueAnimation = !continueAnimation; // Toggle the pause state
    pauseImg.src = "./playbutton.png"
    drawPauseButton();
    if (continueAnimation) {
        requestAnimationFrame(update); // Resume the game if unpaused
        pauseImg.src = "./pausebutton.png";
        drawPauseButton();
    }
}

function update() {
    if (continueAnimation) {
        requestAnimationFrame(update);
    }

    if (gameOver) {
        gameOverScreen();
        return;
    }

    context.clearRect(0, 0, board.width, board.height);

    //ship
    context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);
    drawPauseButton();

    //alien
    let hitBorder = false;
    for (let i = 0; i < alienArray.length; i++) {
        let alien = alienArray[i];
        if (alien.alive) {
            alien.x += alienVelocityX;

            // Check if any alien hits the borders
            if (alien.x + alien.width >= board.width || alien.x <= 0) {
                hitBorder = true;
            }
        }
    }

    // If any alien hits the borders, reverse direction and move all aliens down
    if (hitBorder) {
        alienVelocityX *= -1;
        for (let i = 0; i < alienArray.length; i++) {
            let alien = alienArray[i];
            alien.x += alienVelocityX; // Correct the position after reversing direction
            alien.y += alienHeight;
        }
    }

    // Draw aliens
    for (let i = 0; i < alienArray.length; i++) {
        let alien = alienArray[i];
        if (alien.alive) {
            context.drawImage(alienImg, alien.x, alien.y, alien.width, alien.height);

            if (alien.y >= ship.y) {
                gameOver = true;
            }
        }
    }

    //bullets
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        bullet.y += bulletVelocityY;
        context.fillStyle="white";
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        //bullet collision with aliens
        for (let j = 0; j < alienArray.length; j++) {
            let alien = alienArray[j];
            if (!bullet.used && alien.alive && detectCollision(bullet, alien)) {
                bullet.used = true;
                alien.alive = false;
                alienCount--;
                score += 100;
            }
        }
    }

    //clear bullets
    while (bulletArray.length > 0 && (bulletArray[0].used || bulletArray[0].y < 0)) {
        bulletArray.shift(); //removes the first element of the array
    }

    //next level
    if (alienCount == 0) {
        //increase the number of aliens in columns and rows by 1
        score += alienColumns * alienRows * 100; //bonus points :)
        alienColumns = Math.min(alienColumns + 1, columns/2 -2); //cap at 16/2 -2 = 6
        alienRows = Math.min(alienRows + 1, rows-4);  //cap at 16-4 = 12
        if (alienVelocityX > 0) {
            alienVelocityX += 0.2; //increase the alien movement speed towards the right
        }
        else {
            alienVelocityX -= 0.2; //increase the alien movement speed towards the left
        }
        alienArray = [];
        bulletArray = [];
        createAliens();
    }

    //score
    context.fillStyle="white";
    context.font="16px courier";
    context.fillText(score, 5, 20);
}

function moveShip(e) {
    if (gameOver) {
        return;
    }

    if (e.code == "ArrowLeft" && ship.x - shipVelocityX >= 0) {
        ship.x -= shipVelocityX; //move left one tile
    }
    else if (e.code == "ArrowRight" && ship.x + shipVelocityX + ship.width <= board.width) {
        ship.x += shipVelocityX; //move right one tile
    }
}

function createAliens() {
    for (let c = 0; c < alienColumns; c++) {
        for (let r = 0; r < alienRows; r++) {
            let alien = {
                img : alienImg,
                x : alienX + c*alienWidth,
                y : alienY + r*alienHeight,
                width : alienWidth,
                height : alienHeight,
                alive : true
            }
            alienArray.push(alien);
        }
    }
    alienCount = alienArray.length;
}

function shoot(e) {
    if (gameOver) {
        return;
    }

    if (e.code == "Space") {
        //shoot
        let bullet = {
            x : ship.x + shipWidth*15/32,
            y : ship.y,
            width : tileSize/8,
            height : tileSize/2,
            used : false
        }
        bulletArray.push(bullet);
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}

function gameOverScreen() {
    // Lighten the screen
    context.fillStyle = "rgba(182, 182, 182, 0.5)";
    context.fillRect(0, 0, board.width, board.height);  

    // Display the score background
    context.fillStyle = "white";
    context.fillRect(board.width / 4, board.height / 4, board.width / 2, board.height / 2);

    // Center the text
    context.fillStyle = "black";
    context.font = "24px Courier";

    if (score > highScore) {
        highScore = score;
    }

    let gameOverText = "Game Over";
    let highScoreText = "High Score: " + highScore;
    let scoreText = " Score: " + score;

    let gameOverTextWidth = context.measureText(gameOverText).width;    
    let highScoreTextWidth = context.measureText(highScoreText).width;
    let scoreTextWidth = context.measureText(scoreText).width;

    context.fillText(gameOverText, (board.width - gameOverTextWidth) / 2, board.height / 2 - 60);
    context.fillText(highScoreText, (board.width - highScoreTextWidth) / 2, board.height / 2 - 20);
    context.fillText(scoreText, (board.width - scoreTextWidth) / 2, board.height / 2 + 20);

    let restartButton = document.getElementById("restartButton");
    if (!restartButton) {
        // Create and display the restart button
        let restartButton = document.createElement("button");
        restartButton.id = "restartButton";
        restartButton.innerHTML = "Restart";
        document.body.appendChild(restartButton);

        // Position the button
        restartButton.style.display = "block";

        // Add event listener to restart the game
        restartButton.addEventListener("click", restartGame);
    }
    else {
        restartButton.style.display = "block";
    }

    // Pause the animation
    continueAnimation = false;
}

function restartGame() {
    console.log("Reset Game");
    // Reset game variables
    score = 0;
    gameOver = false;

    alienArray = [];
    alienRows = 2;
    alienColumns = 3;
    alienVelocityX = 1;
    alienCount = 0;

    bulletArray = [];
    bulletVelocityY = -10;

    createAliens();

    // Hide the restart button
    let restartButton = document.getElementById("restartButton");
    restartButton.style.display = "none";

    // Start the game loop again
    continueAnimation = true;
    requestAnimationFrame(update);
}