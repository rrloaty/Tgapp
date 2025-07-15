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
  const dice = document.getElementById("dice");

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

function drawDice(num) {
  const dice = document.getElementById("dice");
  const dots = {
    1: [50],
    2: [20, 80],
    3: [20, 50, 80],
    4: [20, 80, 30, 70],
    5: [20, 80, 30, 70, 50],
    6: [20, 80, 30, 70, 25, 75],
  };

  dice.innerHTML = dots[num]
    .map(
      (pos, i) =>
        `<circle cx="${pos}" cy="${dots[num][i + 1] || pos}" r="8" class="dot" />`
    )
    .join("");
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