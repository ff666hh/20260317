/**
 * Ball 類別：處理球體的物理狀態與移動
 */
class Ball {
    constructor(canvas) {
        this.canvas = canvas;
        this.radius = 15;
        this.reset();
    }

    reset() {
        this.x = this.canvas.width / 2;
        this.y = 100;
        this.vx = 0;
        this.vy = 0; // 初始垂直速度為 0
        this.gravity = 0.25; // 重力加速度
        this.maxFallSpeed = 4.5; // 限制最大下墜速度，維持穩定節奏

        this.speed = 6; // 水平速度
        this.friction = 0.9;
        this.color = '#ffcc00';
    }

    update(keys) {
        // --- 水平移動 ---
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.vx = -this.speed;
        } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.vx = this.speed;
        } else {
            this.vx *= this.friction;
        }
        this.x += this.vx;

        // 邊界限制
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx = 0;
        } else if (this.x + this.radius > this.canvas.width) {
            this.x = this.canvas.width - this.radius;
            this.vx = 0;
        }

        // --- 垂直重力與加速邏輯 ---
        this.vy += this.gravity;

        let frameVy = this.vy;
        let currentMaxSpeed = this.maxFallSpeed;

        // 空白鍵輔助噴射 (強力下衝)
        // 支援多種 key 名稱與 e.code
        if (keys[' '] || keys['Space'] || keys['Spacebar']) {
            frameVy += 6;                // 強力噴射感
            currentMaxSpeed = 15;        // 大幅提升速度極限
            this.color = '#ff3300';      // 衝刺變紅
        } else {
            this.color = '#ffcc00';
        }

        // 限制下落速度，確保不超過當前上限
        if (frameVy > currentMaxSpeed) {
            frameVy = currentMaxSpeed;
        }

        this.y += frameVy;
    }

    draw(ctx, scrollY) {
        const drawY = this.y - scrollY; // 相對於攝像頭的位置

        ctx.save();

        // 繪製發光效果
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.arc(this.x, drawY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // 繪製球體高光
        ctx.beginPath();
        ctx.arc(this.x - 5, drawY - 5, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
        ctx.closePath();

        ctx.restore();
    }
}
