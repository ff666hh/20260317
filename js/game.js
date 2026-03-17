/**
 * Game 類別：遊戲控制器與渲染主迴圈
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        this.ball = new Ball(this.canvas);
        this.traps = [];
        this.scrollY = 0;
        this.score = 0;
        this.depth = 0;
        this.isGameOver = false;
        this.isPlaying = false;
        this.keys = {};

        // 設定陷阱生成的參數 (調大間距，讓玩家有喘息空間)
        this.lastTrapY = 300;
        this.trapInterval = 250; // 初始間距從 180 調回 250

        // 綁定事件 (加入 preventDefault 防止空白鍵捲動網頁)
        window.addEventListener('keydown', e => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                
                // 若遊戲結束或尚未開始，按下空白鍵即可重新開始
                if (this.isGameOver || !this.isPlaying) {
                    this.start();
                    return;
                }
            }
            this.keys[e.key] = true;
            this.keys[e.code] = true; // 增加 Code 支援 (如 'Space')
        });
        window.addEventListener('keyup', e => {
            this.keys[e.key] = false;
            this.keys[e.code] = false;
        });
        window.addEventListener('resize', () => this.resize());

        document.getElementById('start-btn').addEventListener('click', (e) => {
            e.target.blur(); // 移除焦點，防止按鈕搶走空白鍵事件
            this.start();
        });
        document.getElementById('retry-btn').addEventListener('click', (e) => {
            e.target.blur();
            this.start();
        });

        this.updateHUD();
    }

    resize() {
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    start() {
        this.isGameOver = false;
        this.isPlaying = true;
        this.ball.reset();
        this.traps = [];
        this.scrollY = 0;
        this.score = 0;
        this.depth = 0;
        this.lastTrapY = 400;

        // 關閉所有視窗
        document.querySelectorAll('.overlay').forEach(el => el.classList.remove('active'));

        this.spawnInitialTraps();
        requestAnimationFrame(() => this.loop());
    }

    spawnInitialTraps() {
        for (let i = 0; i < 5; i++) {
            this.generateNextTrap();
        }
    }

    generateNextTrap() {
        const y = this.lastTrapY + this.trapInterval;
        this.lastTrapY = y;

        // 難度成長：隨深度增加，溫和縮短間距 (最小 160)
        this.trapInterval = Math.max(160, 250 - Math.floor(this.depth / 10) * 5);

        const type = Math.random();
        if (type < 0.15) {
            this.traps.push(new SpikeTrap(Math.random() * (this.canvas.width - 100), y, 100 + Math.random() * 100));
        } else if (type < 0.60) {
            this.traps.push(new GhostTrap(y, this.canvas.width));
        } else if (type < 0.80) {
            this.traps.push(new TrampolineTrap(y, this.canvas.width));
        } else if (type < 0.90) {
            this.traps.push(new MovingPlatform(y, this.canvas.width));
        } else {
            this.traps.push(new SwingAxeTrap(y, this.canvas.width));
        }
    }

    update() {
        if (!this.isPlaying || this.isGameOver) return;

        this.ball.update(this.keys);

        // 攝像頭滾動（保持球在畫面上方約 1/4 處）
        const targetScrollY = this.ball.y - 150;
        this.scrollY += (targetScrollY - this.scrollY) * 0.1;

        // 計算深度與分數
        const currentDepth = Math.floor(this.ball.y / 10);
        if (currentDepth > this.depth) {
            this.depth = currentDepth;
            this.score = this.depth; // 簡單的分數計算：深度即分數
            this.updateHUD();
        }

        // 更新並檢查陷阱碰撞
        this.traps.forEach((trap, index) => {
            if (trap.update) {
                trap.update(this.ball);
            }

            if (trap.checkCollision(this.ball)) {
                this.gameOver();
            }

            // 移除已經遠離畫面的上方陷阱
            if (trap.y < this.scrollY - 200) {
                // 不直接刪除避免迭代問題，或者在下面 filter
            }
        });

        this.traps = this.traps.filter(t => t.y > this.scrollY - 200);

        // 生成新陷阱
        if (this.lastTrapY < this.scrollY + this.canvas.height + 200) {
            this.generateNextTrap();
        }
    }

    gameOver() {
        this.isPlaying = false;
        this.isGameOver = true;

        document.getElementById('final-score').innerText = this.score;
        document.getElementById('final-depth').innerText = this.depth + 'm';
        document.getElementById('game-over').classList.add('active');
    }

    updateHUD() {
        document.getElementById('score').innerText = this.score;
        document.getElementById('depth').innerText = this.depth + 'm';
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 繪製背景裝飾 (垂直線條營造速度感)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        for (let i = 0; i < this.canvas.width; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, this.canvas.height);
            ctx.stroke();
        }

        // 繪製陷阱
        this.traps.forEach(trap => trap.draw(ctx, this.scrollY));

        // 繪製球
        this.ball.draw(ctx, this.scrollY);
    }

    loop() {
        this.update();
        this.draw();
        if (this.isPlaying) {
            requestAnimationFrame(() => this.loop());
        }
    }
}

// 啟動遊戲
window.onload = () => {
    new Game();
};
