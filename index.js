let coins = 0;
let tg = window.Telegram.WebApp;
tg.expand();

const telegramUser = tg.initDataUnsafe?.user;
const telegramId = telegramUser?.id || null;
const backendURL = "https://dicemint-backend.onrender.com";

const coinDisplay = document.getElementById("coin-count");
const balanceDisplay = document.getElementById("balance");
const message = document.getElementById("message");

// 👉 REFERRAL HANDLING
const urlParams = new URLSearchParams(window.location.search);
const referrerId = urlParams.get("start");

if (referrerId && telegramId && telegramId != referrerId) {
  fetch(`${backendURL}/api/referral`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      new_user_id: telegramId,
      referrer_id: referrerId
    })
  })
    .then(res => res.json())
    .then(data => console.log("Referral result:", data))
    .catch(err => console.error("Referral error:", err));
}

// Get balance from backend
function fetchBalance() {
  if (!telegramId) return;
  fetch(`${backendURL}/get_balance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegram_id: telegramId })
  })
    .then(res => res.json())
    .then(data => {
      coins = data.balance || 0;
      updateDisplay();
    });
}

// Update balance on backend
function syncBalance() {
  if (!telegramId) return;
  fetch(`${backendURL}/update_balance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegram_id: telegramId, balance: coins })
  });
}

// Update coin and dollar displays
function updateDisplay() {
  coinDisplay.textContent = `Coins: ${coins}`;
  balanceDisplay.textContent = (coins * 0.01).toFixed(2);
  syncBalance();
}

// Tap to earn
document.getElementById("tap-button").addEventListener("mousedown", () => {
  coins++;
  updateDisplay();
});
document.getElementById("tap-button").addEventListener("touchstart", () => {
  coins++;
  updateDisplay();
});

// Withdraw
function withdraw() {
  const balance = coins * 0.01;
  if (balance >= 250) {
    message.textContent = `✅ Withdrawal of $${balance.toFixed(2)} sent to admin!`;
    coins = 0;
    updateDisplay();
  } else {
    message.textContent = "❌ You need at least $250 to withdraw.";
  }
}

// Dice bet logic
const dice = document.getElementById("dice");
const betResult = document.getElementById("bet-result");

function drawDots(number) {
  const positions = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]]
  };
  dice.innerHTML = "";
  positions[number].forEach(([cx, cy]) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", cx);
    dot.setAttribute("cy", cy);
    dot.setAttribute("r", 8);
    dot.setAttribute("class", "dot");
    dice.appendChild(dot);
  });
}
drawDots(1);

function playBet() {
  const bet = parseFloat(document.getElementById("betAmount").value);
  const guess = parseInt(document.getElementById("guessNumber").value);
  const balance = coins * 0.01;

  if (balance <= 0) {
    alert("You don't have enough to bet. Please tap to earn first!");
    showPage("settings");
    return;
  }
  if (isNaN(bet) || bet <= 0 || bet > balance) {
    betResult.textContent = "❌ Invalid bet amount.";
    return;
  }
  if (isNaN(guess) || guess < 1 || guess > 6) {
    betResult.textContent = "❌ Please guess a number between 1 and 6.";
    return;
  }

  dice.style.transform = "rotate(720deg)";
  betResult.textContent = "Rolling...";

  setTimeout(() => {
    const rolled = Math.floor(Math.random() * 6) + 1;
    drawDots(rolled);
    dice.style.transform = "rotate(0deg)";
    if (guess === rolled) {
      coins += Math.floor(bet * 100);
      betResult.textContent = `✅ You WON! Dice: ${rolled}`;
    } else {
      coins -= Math.floor(bet * 100);
      betResult.textContent = `❌ You lost! Dice: ${rolled}`;
    }
    updateDisplay();
  }, 800);
}

// Show page navigation
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// Bonus claiming logic
let groupClicked = false;
let channelClicked = false;

function checkLinks() {
  if (groupClicked && channelClicked) {
    const btn = document.getElementById("claim-btn");
    btn.disabled = false;
    btn.style.background = "#00ff99";
    btn.style.color = "#000";
    btn.onclick = claimBonus;
  }
}

function claimBonus() {
  if (localStorage.getItem("bonus_claimed")) {
    document.getElementById("bonus-message").textContent = "❌ You already claimed this bonus.";
    return;
  }
  coins += 1000;
  updateDisplay();
  localStorage.setItem("bonus_claimed", true);
  document.getElementById("bonus-message").textContent = "✅ $10 bonus added to your wallet!";
}

// Show Telegram user info
if (telegramUser) {
  const userInfo = document.createElement("div");
  userInfo.style = "text-align:center;padding:10px;background:#222;margin:10px;font-size:14px;";
  userInfo.innerHTML = `👤 Welcome <strong>${telegramUser.first_name}</strong><br>🆔 ID: ${telegramUser.id}<br>📛 Username: @${telegramUser.username || "none"}`;
  document.body.insertBefore(userInfo, document.body.firstChild);

  // Referral link
  const referralLink = `https://t.me/dicemintmonibot/dicemintgameapp?start=${telegramUser.id}`;
  const refInput = document.getElementById("refLink");
  if (refInput) refInput.value = referralLink;
}

function copyRefLink() {
  const linkInput = document.getElementById("refLink");
  linkInput.select();
  linkInput.setSelectionRange(0, 99999);
  document.execCommand("copy");
  document.getElementById("copyMsg").textContent = "✅ Link copied!";
}

// Start
fetchBalance(); b