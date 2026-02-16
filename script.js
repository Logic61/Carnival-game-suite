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

let deck = [];
let playerHand = [];
let dealerHand = [];
let isGameOver = true;

function resetBJUI() {
    document.getElementById('bj-start').style.display = 'inline-block';
    document.getElementById('bj-hit').style.display = 'none';
    document.getElementById('bj-double').style.display = 'none';
    document.getElementById('bj-stand').style.display = 'none';
    document.getElementById('player-cards').innerHTML = '';
    document.getElementById('dealer-cards').innerHTML = '';
    document.getElementById('player-score').textContent = '0';
    document.getElementById('dealer-score').textContent = '??';
}

function startBJ() {
    if (!gameActive) return;
    if (currentBet <= 0) {
        showMsg("请先在上方筹码中心下注！", "info");
        return;
    }

    bjGameOver = false;
    // 生成牌组 (直接生成点数，11代表A)
    bjDeck = [2,3,4,5,6,7,8,9,10,10,10,10,11]; 
    // 初始发牌
    pHand = [drawBJCard(), drawBJCard()];
    dHand = [drawBJCard(), drawBJCard()];

    updateBJDisplay(false);

    // --- 新增：Blackjack 检测逻辑 ---
    const pScore = getScore(pHand);
    const dScore = getScore(dHand);

    if (pScore === 21 || dScore === 21) {
        bjGameOver = true; // 游戏直接结束
        updateBJDisplay(true); // 翻开庄家的牌对比

        if (pScore === 21 && dScore === 21) {
            finishBJ("双方都是 Blackjack！平局庄家赢。", "lose");
        } else if (pScore === 21) {
            // 玩家 Blackjack，享受 1.5 倍奖励
            finishBJ("🔥 BLACKJACK！你赢了 1.5 倍！", "win", 1.5);
        } else {
            finishBJ("💀 庄家 Blackjack！你输了。", "lose");
        }
        return; // 结束函数，不再显示操作按钮
    }

    // 按钮切换
    document.getElementById('bj-start').style.display = 'none';
    document.getElementById('bj-hit').style.display = 'inline-block';
    document.getElementById('bj-double').style.display = 'inline-block';
    document.getElementById('bj-stand').style.display = 'inline-block';
    showMsg("游戏开始，请选择操作", "info");
}

function drawBJCard() {
    // 简单模拟无限牌组抽取
    const cards = [2,3,4,5,6,7,8,9,10,10,10,10,11]; 
    return cards[Math.floor(Math.random() * cards.length)];
}

function getScore(hand) {
    let score = hand.reduce((a, b) => a + b, 0);
    let aces = hand.filter(c => c === 11).length;
    // 处理 A 的变值 (11变为1)
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
}

function updateBJDisplay(showAllDealer) {
    const pArea = document.getElementById('player-cards');
    const dArea = document.getElementById('dealer-cards');
    
    pArea.innerHTML = pHand.map(c => `<div class="bj-card">${c === 11 ? 'A' : c}</div>`).join('');
    
    if (showAllDealer) {
        dArea.innerHTML = dHand.map(c => `<div class="bj-card">${c === 11 ? 'A' : c}</div>`).join('');
        document.getElementById('dealer-score').textContent = getScore(dHand);
    } else {
        dArea.innerHTML = `<div class="bj-card">${dHand[0] === 11 ? 'A' : dHand[0]}</div><div class="bj-card hidden">?</div>`;
        document.getElementById('dealer-score').textContent = "??";
    }
    document.getElementById('player-score').textContent = getScore(pHand);
}

function hitBJ() {
    if (bjGameOver) return;
    document.getElementById('bj-double').style.display = 'none'; // 要过牌不能翻倍
    pHand.push(drawBJCard());
    updateBJDisplay(false);

    if (getScore(pHand) > 21) {
        finishBJ("你爆牌了！庄家获胜。", "lose");
    }
}

function doubleBJ() {
    if (bjGameOver || pHand.length !== 2) return;
    if (balance < currentBet * 2) {
        showMsg("余额不足以支持翻倍！", "info");
        return;
    }
    
    // 增加下注金额
    const additionalBet = currentBet;
    currentBet += additionalBet; 
    updateUI();

    pHand.push(drawBJCard());
    updateBJDisplay(false);
    
    // 翻倍后不论结果直接停牌
    if (getScore(pHand) > 21) {
        finishBJ("翻倍后爆牌了！", "lose");
    } else {
        standBJ();
    }
}

// --- 🃏 21点 AI 版核心逻辑 ---
let bjDeck = [];
let pHand = [];
let dHand = [];
let bjGameOver = true;

// 抽取单张牌的逻辑
function drawBJCard() {
    const cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11]; 
    return cards[Math.floor(Math.random() * cards.length)];
}

// 计算点数（含 A 的动态转换）
function getScore(hand) {
    let score = hand.reduce((a, b) => a + b, 0);
    let aces = hand.filter(c => c === 11).length;
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
}

// 停牌函数：触发庄家 AI 补牌
async function standBJ() {
    if (bjGameOver) return;
    bjGameOver = true; // 立即锁定，防止重复点击

    // 1. 翻开庄家暗牌
    updateBJDisplay(true);
    showMsg("庄家回合...", "info");

    // 2. 🤖 庄家 AI 补牌逻辑：不满 17 点必须继续拿牌
    while (getScore(dHand) < 17) {
        // 增加 0.6 秒延迟，让玩家看清庄家一张张抽牌的过程
        await new Promise(resolve => setTimeout(resolve, 600)); 
        dHand.push(drawBJCard());
        updateBJDisplay(true);
    }

    // 3. 最终胜负判定
    const ps = getScore(pHand);
    const ds = getScore(dHand);

    if (ds > 21) {
        finishBJ(`庄家爆牌了(${ds})！你赢了。`, "win");
    } else if (ps > ds) {
        finishBJ(`你赢了！${ps} vs ${ds}`, "win");
    } else if (ps === ds) {
        // 经典的嘉年华“坑”点：平局庄家赢
        finishBJ(`平局(${ps})！但庄家通吃。`, "lose");
    } else {
        finishBJ(`庄家点数更大(${ds})！你输了。`, "lose");
    }
}

function finishBJ(msg, type) {
    showMsg(msg, type);
    
    if (type === "win") {
        balance += currentBet; // 赢得赌注
    } else {
        balance -= currentBet; // 失去赌注
    }
    
    currentBet = 0;
    updateUI();
    
    // 允许玩家再次点击“开始发牌”
    setTimeout(() => {
        document.getElementById('bj-start').style.display = 'inline-block';
        document.getElementById('bj-hit').style.display = 'none';
        document.getElementById('bj-double').style.display = 'none';
        document.getElementById('bj-stand').style.display = 'none';
    }, 2000);
}

function fullReset() {
    balance = 100;
    currentBet = 0;
    gameActive = true;
    document.getElementById('resetGameBtn').style.display = 'none';
    showMsg("已重置资金，祝你好运！");
    updateUI();
}