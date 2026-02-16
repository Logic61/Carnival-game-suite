// --- 全局变量 ---
let balance = 100;
let currentBet = 0;
let chosenNumber = null;
let gameActive = true;

// --- 基础工具函数 ---
function updateUI() {
    // 终极防御：如果任何变量变成非数字，立刻强转回 0
    balance = Number(balance) || 0;
    currentBet = Number(currentBet) || 0;

    document.getElementById('balance').textContent = Math.floor(balance);
    document.getElementById('currentBet').textContent = Math.floor(currentBet);

    // 破产检测
    if (balance <= 0 && currentBet <= 0 && gameActive) {
        showMsg("你破产了！", "lose");
        gameActive = false;
        document.getElementById('resetGameBtn').style.display = 'block';
    }
}

function showMsg(txt, type="info") {
    const m = document.getElementById('message');
    m.textContent = txt;
    m.className = "game-message " + type;
}

function switchGame(id) {
    document.querySelectorAll('.game-section').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

// --- 💰 统一筹码操作 ---
function handleBet(amt) {
    if (!gameActive) return;
    let realAmt = amt === 'all' ? balance - currentBet : Number(amt);
    
    if (currentBet + realAmt > balance) {
        showMsg("余额不足以支持该下注！", "info");
        return;
    }
    currentBet += realAmt;
    updateUI();
}

function confirmCustom() {
    const inp = document.getElementById('customBetInput');
    const val = Number(inp.value);
    if (val > 0) handleBet(val);
    inp.value = "";
}

function resetBet() {
    currentBet = 0;
    updateUI();
}

// --- 🎲 游戏 1: 骰子逻辑 ---
function selectNum(n) {
    chosenNumber = n;
    document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('selected'));
    event.target.classList.add('selected');
}

function playDice() {
    if (!gameActive) return;
    if (currentBet <= 0 || !chosenNumber) {
        showMsg("请先下注并选号！", "info");
        return;
    }

    // 1. 准备阶段
    showMsg("正在摇晃骰子...", "info");
    const diceIds = ['dice1', 'dice2', 'dice3'];
    
    // 给所有骰子添加动画类
    diceIds.forEach(id => {
        const el = document.getElementById(id);
        el.classList.add('rolling');
        el.textContent = "?"; // 摇动时显示问号
    });

    // 2. 模拟摇动过程（1秒后出结果）
    setTimeout(() => {
        const results = [1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1);
        
        // 移除动画并显示数字
        diceIds.forEach((id, i) => {
            const el = document.getElementById(id);
            el.classList.remove('rolling');
            el.textContent = results[i];
        });

        // 3. 计算胜负
        const matches = results.filter(r => r === chosenNumber).length;
        
        if (matches > 0) {
            let win = currentBet * matches;
            balance += win;
            showMsg(`🎉 中了 ${matches} 个！赢取 $${win}`, "win");
        } else {
            balance -= currentBet;
            showMsg(`💀 没中，失去 $${currentBet}`, "lose");
        }

        // 4. 重置状态
        currentBet = 0;
        updateUI();
    }, 1000); // 这里的 1000 毫秒就是摇动持续的时间
}

// --- 🪙 游戏 2: 硬币逻辑 ---
function playCoin(guess) {
    if (!gameActive) return;
    if (currentBet <= 0) {
        showMsg("请先在上方下注金额！", "info");
        return;
    }

    const coinEl = document.getElementById('coinResult');
    
    // 1. 触发动画
    showMsg("硬币在空中翻转...", "info");
    coinEl.classList.remove('coin-flipping'); // 先移除旧类名（如果有）
    void coinEl.offsetWidth; // 触发重绘，确保动画可以重复播放
    coinEl.classList.add('coin-flipping');
    coinEl.textContent = "🪙"; // 旋转时显示硬币图标

    // 2. 等待动画结束（0.8秒）
    setTimeout(() => {
        const result = Math.random() > 0.5 ? '正' : '反';
        coinEl.classList.remove('coin-flipping');
        coinEl.textContent = result;

        // 3. 结算逻辑
        if (guess === result) {
            balance += currentBet;
            showMsg(`✨ 猜对了！硬币是【${result}】，赢取 $${currentBet}`, "win");
        } else {
            balance -= currentBet;
            showMsg(`💀 猜错了！硬币是【${result}】，失去 $${currentBet}`, "lose");
        }
        
        currentBet = 0; // 结算后清空下注
        updateUI();
    }, 800); 
}

//比大小
let lastCard = 7;

function playHiLo(guess) {
    if (!gameActive || currentBet <= 0) {
        showMsg("请先下注！", "info");
        return;
    }

    const cardEl = document.getElementById('currentCard');
    
    // 1. 触发翻牌动画（缩小并消失）
    cardEl.classList.add('card-flip');

    setTimeout(() => {
        const nextCard = Math.floor(Math.random() * 13) + 1;
        
        // 2. 更换数字并更新花色颜色（可选：如果是J,Q,K可以特殊处理）
        cardEl.textContent = nextCard;
        
        // 3. 计算结果
        let win = false;
        if (guess === 'high' && nextCard > lastCard) win = true;
        if (guess === 'low' && nextCard < lastCard) win = true;

        if (nextCard === lastCard) {
            showMsg(`平局(${nextCard})！退还筹码`, "info");
        } else if (win) {
            balance += currentBet;
            showMsg(`🎉 赢了！下一张是 ${nextCard}`, "win");
        } else {
            balance -= currentBet;
            showMsg(`💀 输了！下一张是 ${nextCard}`, "lose");
        }

        // 4. 移除动画类（恢复显示）
        cardEl.classList.remove('card-flip');
        
        lastCard = nextCard;
        currentBet = 0;
        updateUI();
    }, 400); // 延迟时间与 CSS transition 保持一致
}

//老虎机
// 增加符号，降低重复概率
const symbols = ['🍒', '🍋', '🔔', '💎', '7️⃣', '🍎', '🍇', '🍌'];

function finalizeSlots(slots) {
    const results = slots.map(s => s.textContent);
    const uniqueIcons = [...new Set(results)].length;

    if (uniqueIcons === 1) { 
        // 情况 A: 三个全一样 (大奖)
        const winSymbol = results[0];
        let multiplier = 5; // 默认 5 倍
        
        // 特殊符号倍率更高
        if (winSymbol === '7️⃣') multiplier = 20; 
        if (winSymbol === '💎') multiplier = 10;

        let win = currentBet * multiplier;
        balance += win;
        showMsg(`🏆 绝赞！${multiplier}倍大奖: $${win}`, "win");

    } else if (uniqueIcons === 2) {
        // 情况 B: 只有两个一样 (改为保本或微奖)
        // 比如：只有前两个一样才给奖，或者干脆只给 1 倍返还本金
        let win = Math.floor(currentBet * 1.2); 
        balance += win;
        showMsg(`✨ 小奖(1.2倍): $${win}`, "win");

    } else {
        // 情况 C: 全都不一样
        balance -= currentBet;
        showMsg("没中奖，手气差点意思！", "lose");
    }
    
    currentBet = 0;
    updateUI();
}

function playSlots() {
    if (!gameActive || currentBet <= 0) {
        showMsg("请先下注！", "info");
        return;
    }

    const slots = [document.getElementById('slot1'), document.getElementById('slot2'), document.getElementById('slot3')];
    
    // 模拟滚动
    let count = 0;
    const interval = setInterval(() => {
        slots.forEach(s => s.textContent = symbols[Math.floor(Math.random() * symbols.length)]);
        count++;
        if (count > 10) {
            clearInterval(interval);
            finalizeSlots(slots);
        }
    }, 100);
}

function fullReset() {
    balance = 100;
    currentBet = 0;
    gameActive = true;
    document.getElementById('resetGameBtn').style.display = 'none';
    showMsg("欢迎回来！");
    updateUI();
}

// 初始化
updateUI();
