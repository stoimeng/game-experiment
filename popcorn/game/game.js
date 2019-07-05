/// <reference path="../node_modules/excalibur/dist/excalibur.d.ts" />

var game = new ex.Engine({
    width: 800,
    height: 600
});
game.backgroundColor = ex.Color.Cyan;

// create an asset loader
var loader = new ex.Loader();
var resources = {};
// queue resources for loading
for (var r in resources) {
    loader.addsource(resources[r]);
}

var level = 0;
var lifes = 3;
var gameOn = false;
var label;
var paddle;
var ball;
var bricks;

function initBricks() {
    var padding = 20 // px
    var columns = 5 + level
    var rows = 3

    var brickColor = [ex.Color.Blue, ex.Color.Azure, ex.Color.Chartreuse];

    var brickWidth = (game.drawWidth - padding) / columns - padding
    var brickHeight = 30

    if (bricks && bricks.length > 0) {
        bricks.forEach(function (brick) {
            brick.kill();
        });
    }

    bricks = []
    for (var j = 0; j < rows; j++) {
        for (var i = 0; i < columns; i++) {
            bricks.push(
                new ex.Actor(
                    padding + brickWidth / 2 + i * (padding + brickWidth),
                    padding + j * (padding + brickHeight),
                    brickWidth,
                    brickHeight,
                    brickColor[j % brickColor.length]
                )
            )
        }
    }

    bricks.forEach(function (brick) {
        brick.collisionType = ex.CollisionType.Active
        game.add(brick)
    });
}

function initPaddle() {
    paddle = new ex.Actor(150, game.drawHeight - 40, 200, 20);
    paddle.color = ex.Color.Azure;
    paddle.collisionType = ex.CollisionType.Fixed;
    game.add(paddle);
}

function initBall() {
    ball = new ex.Actor(paddle.pos.x, paddle.pos.y - 20, 20, 20);
    ball.color = ex.Color.White;
    ball.vel.setTo(0, 0);
    ball.collisionType = ex.CollisionType.Passive;

    ball.draw = function (ctx, delta) {
        ctx.fillStyle = this.color.toString();
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 10, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    };

    ball.on('postupdate', function () {
        if (this.pos.x < this.getWidth() / 2) {
            this.vel.x *= -1;
        }

        if (this.pos.x + this.getWidth() / 2 > game.drawWidth) {
            this.vel.x *= -1;
        }

        if (this.pos.y < this.getHeight() / 2) {
            this.vel.y *= -1;
        }
    });

    ball.on('precollision', function (ev) {
        var brickIndex = bricks.indexOf(ev.other);
        if (brickIndex > -1) {
            ev.other.kill();
            bricks.splice(brickIndex, 1);
        }

        if (bricks.length == 0) {
            level++;
            resetGame();
            initBricks();
        } else {
            var intersection = ev.intersection.normalize();
            if (Math.abs(intersection.x) > Math.abs(intersection.y)) {
                ball.vel.x *= -1;
            } else {
                ball.vel.y *= -1;
            }
        }
    });

    ball.on('exitviewport', function () {
        if (gameOn) {
            lifes--;
            resetGame();
        }
    });

    game.add(ball);
}

function resetGame() {
    gameOn = false;
    ball.vel.setTo(0, 0);
    ball.pos.x = paddle.pos.x;
    ball.pos.y = paddle.pos.y - 20;

    if (level == 3 || lifes == -1) {
        if (level == 3) {
            alert('You win!');
        } else {
            alert('You lose!');
        }
        level = 0;
        lifes = 3;
        initBricks();
    }

    if (label) {
        label.kill();
    }
    label = new ex.Label(`Level: ${level + 1}, lifes: ${lifes}`, game.drawWidth - 75, game.drawHeight - 10, '10px Arial');
    game.add(label);
}

function startGame() {
    gameOn = true;
    var velocity = 0 - 400 - level * 100;
    ball.vel.setTo(velocity, velocity);
}

initBricks();
initPaddle();
initBall();
resetGame();

game.input.keyboard.on('press', (evt) => {
    if (!gameOn && evt.key === 32) {
        startGame();
    }
});

game.input.pointers.primary.on('move', function (evt) {
    var x = evt.worldPos.x;
    if (!gameOn) {
        ball.pos.x = x;
    }
    paddle.pos.x = x;
});

game.start();
