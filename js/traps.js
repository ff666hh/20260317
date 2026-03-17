/**
 * 陷阱基類與各種陷阱實作
 */

class Trap {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    // 基礎矩形碰撞檢查
    checkCollision(ball) {
        // 為了增加遊戲性，我們可以縮小一點點判定範圍 (Hitbox)
        const hitboxPadding = 5;
        const closestX = Math.max(this.x, Math.min(ball.x, this.x + this.width));
        const closestY = Math.max(this.y, Math.min(ball.y, this.y + this.height));

        const distanceX = ball.x - closestX;
        const distanceY = ball.y - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        return distanceSquared < (ball.radius - hitboxPadding) * (ball.radius - hitboxPadding);
    }

    draw(ctx, scrollY) {
        // 子類別實作繪製
    }
}

// 1. 尖刺陷阱 (Spike) - 固定型
class SpikeTrap extends Trap {
    constructor(x, y, width, spikesCount = 5) {
        super(x, y, width, 30);
        this.spikesCount = spikesCount;
    }

    draw(ctx, scrollY) {
        const drawY = this.y - scrollY;
        const spikeWidth = this.width / this.spikesCount;

        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        for (let i = 0; i < this.spikesCount; i++) {
            ctx.moveTo(this.x + i * spikeWidth, drawY + this.height);
            ctx.lineTo(this.x + (i + 0.5) * spikeWidth, drawY);
            ctx.lineTo(this.x + (i + 1) * spikeWidth, drawY + this.height);
        }
        ctx.fill();
        ctx.closePath();

        // 繪製底座
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, drawY + this.height - 5, this.width, 5);
    }
}

// 2. 追蹤幽靈 (Ghost) - 取代原本的陷阱
class GhostTrap extends Trap {
    constructor(y, canvasWidth) {
        const radius = 25;
        // 隨機從左邊或右邊出現
        super(Math.random() > 0.5 ? -50 : canvasWidth + 50, y, radius * 2, radius * 2);
        this.radius = radius;
        this.canvasWidth = canvasWidth;
        this.baseY = y;
        this.floatOffset = Math.random() * Math.PI * 2;
        // 速度比球慢一點，給玩家逃脫空間
        this.speed = 1.0 + Math.random() * 0.5; 
    }

    update(ball) {
        // 上下漂浮動畫效果
        this.y = this.baseY + Math.sin(Date.now() / 300 + this.floatOffset) * 20;

        // 緩慢朝玩家的 X 軸追蹤
        if (ball) {
            const centerX = this.x + this.radius;
            if (centerX < ball.x) {
                this.x += this.speed;
            } else if (centerX > ball.x) {
                this.x -= this.speed;
            }
        }
    }

    checkCollision(ball) {
        const dx = ball.x - (this.x + this.radius);
        const dy = ball.y - (this.y + this.radius);
        const distance = Math.sqrt(dx * dx + dy * dy);
        // 碰撞區域
        return distance < (ball.radius + this.radius - 8); 
    }

    draw(ctx, scrollY) {
        const drawY = this.y - scrollY;
        const centerX = this.x + this.radius;
        const centerY = drawY + this.radius;

        ctx.save();
        ctx.translate(centerX, centerY);

        // 讓幽靈朝向移動方向 (或玩家方向)
        // 簡單呈現：固定不翻轉或根據 x 調整，這裡維持預設

        // 畫幽靈身體外發光
        ctx.fillStyle = 'rgba(230, 230, 255, 0.9)'; 
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(100, 100, 255, 0.8)';

        ctx.beginPath();
        // 頭部為半圓
        ctx.arc(0, -5, this.radius, Math.PI, 0); 
        // 身體與下擺裙擺
        ctx.lineTo(this.radius, this.radius + 10);
        ctx.lineTo(this.radius * 0.5, this.radius + 3);
        ctx.lineTo(0, this.radius + 10);
        ctx.lineTo(-this.radius * 0.5, this.radius + 3);
        ctx.lineTo(-this.radius, this.radius + 10);
        ctx.closePath();
        ctx.fill();

        // 畫生氣發紅的眼睛
        ctx.fillStyle = '#ff3333';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        // 兩個眼睛
        ctx.arc(-8, -2, 4, 0, Math.PI * 2);
        ctx.arc(8, -2, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 嘴巴 (小圓)
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, 8, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 3. 移動平台 (Moving Platform)
class MovingPlatform extends Trap {
    constructor(y, canvasWidth) {
        const width = 120;
        super(0, y, width, 20);
        this.canvasWidth = canvasWidth;
        this.x = Math.random() * (canvasWidth - width);
        this.speed = 2 + Math.random() * 2; // 恢復正常平台移動速度
        this.direction = Math.random() > 0.5 ? 1 : -1;
    }

    update() {
        this.x += this.speed * this.direction;
        if (this.x <= 0 || this.x + this.width >= this.canvasWidth) {
            this.direction *= -1;
        }
    }

    draw(ctx, scrollY) {
        const drawY = this.y - scrollY;

        // 繪製金屬質感的平台
        const gradient = ctx.createLinearGradient(this.x, drawY, this.x, drawY + this.height);
        gradient.addColorStop(0, '#555');
        gradient.addColorStop(0.5, '#eee');
        gradient.addColorStop(1, '#333');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, drawY, this.width, this.height);

        // 加點細節：裝飾條
        ctx.strokeStyle = '#ffcc00';
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(this.x + 5, drawY + 5, this.width - 10, this.height - 10);
        ctx.setLineDash([]);
    }
}

// 4. 擺動斧頭陷阱 (Swinging Axe) - 替換原本的雷射
class SwingAxeTrap extends Trap {
    constructor(y, canvasWidth) {
        const pivotX = canvasWidth / 2;
        const pivotY = y - 50;
        super(pivotX - 10, pivotY, 20, 150);
        this.pivotX = pivotX;
        this.pivotY = pivotY;
        this.length = 150;
        this.angle = 0;
        this.maxAngle = Math.PI / 3; // 60 度擺動
        this.axeRadius = 25;
    }

    update() {
        this.angle = Math.sin(Date.now() / 500) * this.maxAngle;
    }

    checkCollision(ball) {
        // 計算斧頭頭部的當前坐標
        const axeX = this.pivotX + Math.sin(this.angle) * this.length;
        const axeY = this.pivotY + Math.cos(this.angle) * this.length;

        const dx = ball.x - axeX;
        const dy = ball.y - axeY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 斧頭頭部的圓形碰撞
        return distance < (ball.radius + this.axeRadius - 5);
    }

    draw(ctx, scrollY) {
        const drawPivotY = this.pivotY - scrollY;
        const axeX = this.pivotX + Math.sin(this.angle) * this.length;
        const axeY = drawPivotY + Math.cos(this.angle) * this.length;

        ctx.save();

        // 繪製擺動桿
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.pivotX, drawPivotY);
        ctx.lineTo(axeX, axeY);
        ctx.stroke();

        // 繪製斧頭頭部 (半月形或圓形金屬)
        ctx.fillStyle = '#999';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(axeX, axeY, this.axeRadius, 0, Math.PI * 2);
        ctx.fill();

        // 繪製斧刃高光
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(axeX, axeY, this.axeRadius, this.angle, this.angle + Math.PI);
        ctx.stroke();

        // 繪製軸心
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(this.pivotX, drawPivotY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 5. 彈跳床 (Trampoline) - 替換原本的粉碎機
// 注意：彈跳床是「功能性」物品，碰到不會死，但會彈飛
class TrampolineTrap extends Trap {
    constructor(y, canvasWidth) {
        const width = 100;
        super(Math.random() * (canvasWidth - width), y, width, 20);
        this.bouncePower = -12; // 調整回適當的力量，配合重力系統
        this.isStepped = false;
    }

    checkCollision(ball) {
        // 這不叫「碰撞失敗」，而是「觸發反彈」
        if (ball.y + ball.radius > this.y &&
            ball.y - ball.radius < this.y + this.height &&
            ball.x > this.x && ball.x < this.x + this.width) {

            // 如果球是往下的，才反彈
            ball.y = this.y - ball.radius; // 重置位置防止卡住
            ball.vy = this.bouncePower; // 修改球的垂直速度
            this.isStepped = true;
            setTimeout(() => this.isStepped = false, 100);
            return false; // 返回 false 因為這不是傷害陷阱
        }
        return false;
    }

    draw(ctx, scrollY) {
        const drawY = this.y - scrollY;

        // 繪製彈跳床架子
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.x, drawY, this.width, this.height);

        // 繪製彈性布面
        ctx.fillStyle = this.isStepped ? '#ff00ff' : '#aa00aa';
        ctx.fillRect(this.x + 5, drawY + 2, this.width - 10, this.height - 10);

        // 彈簧效果飾條
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(this.x + 10, drawY + 8);
        ctx.lineTo(this.x + this.width - 10, drawY + 8);
        ctx.stroke();
    }
}
