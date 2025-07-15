const tg = window.Telegram.WebApp;
tg.expand();

const telegramId = tg.initDataUnsafe?.user?.id || null;
const backendURL = "https://dicemint.onrender.com";

let coins = 0;

// DOM Elements
const balanceEl = document.getElementById("balance");
const coinCount = document.getElementById("coin-count");
const messageEl = document.getElementById("message");
const refLink = document.getElementById("refLink");
const copyMsg = document.getElementById("copyMsg");
const claimBtn = document.getElementById("claim-btn");
const bonusMsg = document.getElementById("bonus-message");

let groupClicked = false;
let channelClicked = false;

// Load balance from backend
function fetchBalance() {
  if (!telegramId) return;
  fetch(`${backendURL}/get_balance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegram_id: telegramId }),
  })
    .then((res) => res.json())
    .then((data) => {
      coins = data.balance || 0;
      updateUI();
    });
}

function updateUI() {
  if (balanceEl) balanceEl.textContent = (coins * 0.01).toFixed(2);
  if (coinCount) coinCount.textContent = "Coins: " + coins;
}

function syncBalance() {
  fetch(`${backendURL}/update_balance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegram_id: telegramId, balance: coins }),
  });
}

// Dice Betting
function playBet() {
  const amount = parseFloat(document.getElementById("betAmount").value);
  const guess = parseInt(document.getElementById("guessNumber").value);
  const dollarBalance = coins * 0.01;

  const resultEl = document.getElementById("bet-result");

  if (!amount || amount < 0.01 || amount > dollarBalance) {
    resultEl.innerHTML = "❌ Invalid amount or insufficient balance.";
    return;
  }

  if (!guess || guess < 1 || guess > 6) {
    resultEl.innerHTML = "❌ Pick a number between 1 and 6.";
    return;
  }

  const roll = Math.floor(Math.random() * 6) + 1;
  drawDice(roll);

  if (guess === roll) {
    const reward = Math.floor(amount * 200);
    coins += reward;
    resultEl.innerHTML = `🎉 You guessed ${roll} correctly! You won $${(reward * 0.01).toFixed(2)}!`;
  } else {
    const loss = Math.floor(amount * 100);
    coins -= loss;
    resultEl.innerHTML = `😢 Wrong! Dice rolled ${roll}. You lost $${(loss * 0.01).toFixed(2)}.`;
  }

  updateUI();
  syncBalance();
}

// DICE RENDER FUNCTION WITH ANIMATION
function drawDice(num) {
  const dice = document.getElementById("dice");
  dice.innerHTML = "";

  const positions = {
    tl: [25, 25], tc: [50, 25], tr: [75, 25],
    ml: [25, 50], mc: [50, 50], mr: [75, 50],
    bl: [25, 75], bc: [50, 75], br: [75, 75]
  };

  const faces = {
    1: ["mc"],
    2: ["tl", "br"],
    3: ["tl", "mc", "br"],
    4: ["tl", "tr", "bl", "br"],
    5: ["tl", "tr", "mc", "bl", "br"],
    6: ["tl", "ml", "bl", "tr", "mr", "br"]
  };

  faces[num].forEach(pos => {
    const [cx, cy] = positions[pos];
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", "8");
    circle.setAttribute("class", "dot");
    dice.appendChild(circle);
  });

  dice.style.animation = "roll 0.6s ease";
  setTimeout(() => {
    dice.style.animation = "";
  }, 600);
}

// Tap to Earn
if (document.getElementById("tap-button")) {
  document.getElementById("tap-button").addEventListener("click", () => {
    coins += 1;
    updateUI();
    syncBalance();
    if (messageEl) messageEl.textContent = "+1 coin earned!";
    setTimeout(() => {
      if (messageEl) messageEl.textContent = "";
    }, 1000);
  });
}

// Referral Link
if (refLink && telegramId) {
  refLink.value = `https://t.me/dicemintmonibot/dicemintgameapp?start=${telegramId}`;
}

// Copy to Clipboard
function copyRefLink() {
  navigator.clipboard.writeText(refLink.value).then(() => {
    copyMsg.textContent = "✅ Copied!";
    setTimeout(() => {
      copyMsg.textContent = "";
    }, 2000);
  });
}
window.copyRefLink = copyRefLink;

// Claim Bonus
function checkLinks() {
  if (groupClicked && channelClicked) {
    claimBtn.disabled = false;
    claimBtn.style.background = "#00ff99";
  }
}

if (claimBtn) {
  claimBtn.addEventListener("click", () => {
    if (coins >= 1000) {
      bonusMsg.textContent = "❌ Bonus already claimed.";
      return;
    }
    coins += 1000;
    updateUI();
    syncBalance();
    bonusMsg.textContent = "✅ $10 Bonus added!";
  });
}

// Page Navigation
function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });
  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");
}
window.showPage = showPage;

// Check Referral
const urlParams = new URLSearchParams(window.location.search);
const ref = urlParams.get("start");

if (ref && telegramId && ref !== telegramId.toString()) {
  fetch(`${backendURL}/api/referral`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      referrer_id: ref,
      new_user_id: telegramId,
    }),
  });
}

// Init
fetchBalance();
drawDice(1); // Show a default dice face when page loads1