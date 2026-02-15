document.addEventListener('DOMContentLoaded', () => {
    // 获取 DOM 元素
    const balanceSpan = document.getElementById('balance');
    const currentBetSpan = document.getElementById('currentBet');
    const betButtons = document.querySelectorAll('.bet-btn');
    const clearBetBtn = document.querySelector('.clear-bet-btn');
    const numButtons = document.querySelectorAll('.num-btn');
    const rollDiceBtn = document.getElementById('rollDiceBtn');
    const diceElements = [
        document.getElementById('dice1'),
        document.getElementById('dice2'),
        document.getElementById('dice3')
    ];
    const messageDisplay = document.getElementById('message');
    const resetGameBtn = document.getElementById('resetGameBtn');

    // 游戏状态变量
    let balance = 100;
    let currentBet = 0;
    let chosenNumber = null;
    let gameActive = true;

    // 更新 UI 显示
    function updateUI() {
        balanceSpan.textContent = balance;
        currentBetSpan.textContent = currentBet;

        // 根据游戏状态启用/禁用摇骰子按钮
        if (currentBet > 0 && chosenNumber !== null && gameActive) {
            rollDiceBtn.disabled = false;
        } else {
            rollDiceBtn.disabled = true;
        }

        // 如果余额不足以进行任何下注，则禁用所有下注按钮
        betButtons.forEach(btn => {
            const betAmount = btn.dataset.bet === 'all' ? balance : parseInt(btn.dataset.bet);
            if (betAmount > balance && btn.dataset.bet !== 'all') { // "梭哈" 按钮总是可用直到余额为0
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        });

        // 游戏结束（破产）
        if (balance <= 0 && gameActive) {
            messageDisplay.textContent = "你破产了！游戏结束。";
            messageDisplay.className = 'game-message lose';
            rollDiceBtn.disabled = true;
            betButtons.forEach(btn => btn.disabled = true);
            clearBetBtn.disabled = true;
            numButtons.forEach(btn => btn.disabled = true);
            gameActive = false; // 停止游戏
            resetGameBtn.style.display = 'block'; // 显示重新开始按钮
        } else if (gameActive) {
             resetGameBtn.style.display = 'none'; // 游戏中隐藏
        }
    }

    // 处理下注
    betButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!gameActive) return; // 游戏结束不能下注

            let betAmount;
            if (button.dataset.bet === 'all') {
                betAmount = balance;
            } else {
                betAmount = parseInt(button.dataset.bet);
            }

            if (currentBet + betAmount > balance) {
                messageDisplay.textContent = `筹码不足！你只有 $${balance}。`;
                messageDisplay.className = 'game-message info';
                return;
            }
            
            currentBet += betAmount;
            messageDisplay.textContent = ""; // 清空消息
            updateUI();
        });
    });
    // 1. 在顶部获取新元素的引用
    const customBetInput = document.getElementById('customBetInput');
    const confirmCustomBet = document.getElementById('confirmCustomBet');

    // 2. 添加自定义下注的点击事件
    // 确保这段代码在 document.addEventListener('DOMContentLoaded', () => { ... }) 内部

    confirmCustomBet.addEventListener('click', () => {
        if (!gameActive) return;

        // --- 关键点 1：必须在点击的这一刻才去读取 .value ---
        const inputValue = document.getElementById('customBetInput').value;
        const betAmount = parseInt(inputValue);

        // --- 关键点 2：打印到控制台调试 (按 F12 就能看到) ---
        console.log("输入原始值:", inputValue);
        console.log("转换后的数字:", betAmount);

        // 检查是否转换成功
        if (isNaN(betAmount)) {
            messageDisplay.textContent = "请输入有效的数字！";
            messageDisplay.className = 'game-message info';
            return;
        }

        if (betAmount <= 0) {
            messageDisplay.textContent = "下注金额必须大于 0！";
            messageDisplay.className = 'game-message info';
            return;
        }

        if (currentBet + betAmount > balance) {
            messageDisplay.textContent = `筹码不足！你只有 $${balance}。`;
            messageDisplay.className = 'game-message info';
            return;
        }

        // --- 关键点 3：确保 currentBet 本身不是 NaN ---
        if (isNaN(currentBet)) currentBet = 0; 

        currentBet += betAmount;
        
        // 清空输入框方便下次输入
        document.getElementById('customBetInput').value = ''; 
        
        messageDisplay.textContent = ""; 
        updateUI();
    });

    // 清空下注
    clearBetBtn.addEventListener('click', () => {
        if (!gameActive) return;
        currentBet = 0;
        messageDisplay.textContent = "";
        updateUI();
    });

    // 选择数字
    numButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!gameActive) return;

            // 清除之前的选中状态
            numButtons.forEach(btn => btn.classList.remove('selected'));
            
            // 设置新的选中状态
            button.classList.add('selected');
            chosenNumber = parseInt(button.dataset.number);
            messageDisplay.textContent = ""; // 清空消息
            updateUI();
        });
    });

    // 摇骰子
    rollDiceBtn.addEventListener('click', () => {
        if (currentBet <= 0 || chosenNumber === null || !gameActive) {
            messageDisplay.textContent = "请先下注并选择一个数字！";
            messageDisplay.className = 'game-message info';
            return;
        }
        if (currentBet > balance) {
             messageDisplay.textContent = "你的下注超过了你的余额！请清空或减少下注。";
             messageDisplay.className = 'game-message info';
             return;
        }

        // 禁用操作，防止重复点击
        rollDiceBtn.disabled = true;
        betButtons.forEach(btn => btn.disabled = true);
        clearBetBtn.disabled = true;
        numButtons.forEach(btn => btn.disabled = true);
        messageDisplay.textContent = "正在摇晃骰子...";
        messageDisplay.className = 'game-message info';

        // 骰子动画
        diceElements.forEach(dice => {
            dice.classList.add('rolling');
            dice.textContent = '?'; // 动画期间显示问号
        });

        // 模拟摇晃时间
        setTimeout(() => {
            diceElements.forEach(dice => dice.classList.remove('rolling'));

            const diceResults = [];
            for (let i = 0; i < 3; i++) {
                const roll = Math.floor(Math.random() * 6) + 1;
                diceResults.push(roll);
                diceElements[i].textContent = roll;
            }

            let matches = diceResults.filter(roll => roll === chosenNumber).length;
            let winnings = 0;

            if (matches > 0) {
                winnings = currentBet * matches;
                balance += winnings;
                messageDisplay.textContent = `恭喜！中了 ${matches} 个骰子！你赢了 $${winnings}！`;
                messageDisplay.className = 'game-message win';
            } else {
                balance -= currentBet;
                messageDisplay.textContent = `真遗憾，一个都没中。你失去了 $${currentBet}。`;
                messageDisplay.className = 'game-message lose';
            }

            currentBet = 0; // 一轮结束后清空下注
            // chosenNumber = null; // 不清空选择的数字，方便下一轮继续
            numButtons.forEach(btn => btn.classList.remove('selected')); // 清除数字选择高亮
            updateUI();

            // 重新启用操作
            betButtons.forEach(btn => btn.disabled = false);
            clearBetBtn.disabled = false;
            numButtons.forEach(btn => btn.disabled = false);
            // 确保更新UI后，rollDiceBtn 根据最新状态再次判断是否禁用
            updateUI(); 

        }, 1500); // 摇晃动画持续 1.5 秒
    });

    // 重新开始游戏
    resetGameBtn.addEventListener('click', () => {
        balance = 100;
        currentBet = 0;
        chosenNumber = null;
        gameActive = true;
        messageDisplay.textContent = "";
        messageDisplay.className = 'game-message info';
        diceElements.forEach(dice => dice.textContent = '?');
        numButtons.forEach(btn => btn.classList.remove('selected'));
        updateUI();
    });

    // 首次加载页面时更新 UI
    updateUI();
});
