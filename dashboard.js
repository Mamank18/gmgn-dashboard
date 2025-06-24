 
// ✅ Token metadata cache
let tokenMap = JSON.parse(localStorage.getItem("tokenMap") || "{}");

// ✅ Constants
const walletAddress = "DMsDZSayCJ1uwLUxGzJmniDGcfNtmZgzg83Mi9An8pi3";
const heliusApiKey = "cb0e6fdb-3ea9-41bb-9536-479b40403f97";
let isBalanceVisible = false;
let currentCA = "";

// ✅ Utility functions
function shortenAddress(addr) {
  return addr.length > 10 ? addr.slice(0, 6) + "..." + addr.slice(-4) : addr;
}

async function getSolBalance(address) {
  const response = await fetch(`https://rpc.helius.xyz/?api-key=${heliusApiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [address]
    })
  });
  const data = await response.json();
  return data?.result?.value != null ? (data.result.value / 1e9) : 0;
}

async function getSolPriceUSD() {
  const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
  const data = await res.json();
  return data.solana.usd;
}

async function updateClockAndBalance() {
  try {
    const sol = await getSolBalance(walletAddress);
    const usd = await getSolPriceUSD();
    const totalUSD = (sol * usd).toFixed(2);
    document.getElementById("balanceDisplay").innerText = isBalanceVisible ? `${sol.toFixed(4)}($${totalUSD})` : "";
  } catch (err) {
    document.getElementById("balanceDisplay").innerText = "Gagal ambil saldo";
  }
}

async function toggleBalanceVisibility() {
  isBalanceVisible = !isBalanceVisible;
  if (isBalanceVisible) {
    await updateClockAndBalance();
  } else {
    document.getElementById("balanceDisplay").innerText = "";
  }
}


function updateTime() {
  const now = new Date();
  document.getElementById("clockDisplay").innerText = now.toLocaleTimeString("id-ID", { hour12: false });
}

function toggleCalendar() {
  const calendar = document.getElementById("calendarWidget");
  calendar.style.display = calendar.style.display === "none" ? "block" : "none";
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

document.addEventListener("click", function (e) {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggleBtn");
  if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

function loadCharts(ca, chain, theme) {
  const timeframes = ['1', '5', '15', '60'];
  const container = document.getElementById('chartContainer');
  container.innerHTML = '';
  timeframes.forEach(tf => {
    const url = `https://www.gmgn.cc/kline/${chain}/${ca}?interval=${tf}&theme=${theme}`;
    const div = document.createElement('div');
    div.className = 'chart-box';
    div.innerHTML = `<iframe src="${url}" title="Chart ${tf}min"></iframe>`;
    container.appendChild(div);
  });
}

async function getTokenNameSolana(ca) {
  try {
    const response = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${heliusApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mintAccounts: [ca] })
    });
    const result = await response.json();
    const token = result[0];
    const name =
      token?.onChainMetadata?.metadata?.data?.name ||
      token?.onChainMetadata?.metadata?.name ||
      token?.onChainMetadata?.name ||
      token?.offChainMetadata?.name ||
      token?.tokenInfo?.name ||
      null;
    return name;
  } catch (e) {
    console.error("⚠️ Gagal ambil metadata:", e);
    return null;
  }
}

async function loadDashboard() {
  const ca = document.getElementById('contractInput').value.trim();
  const chain = document.getElementById('chainSelect').value;
  const theme = document.getElementById('themeSelect').value;
  if (!ca) return alert('Please enter a contract address.');
  currentCA = ca;
  loadCharts(ca, chain, theme);
  document.getElementById("sidebar").classList.remove("open");
  setTimeout(() => {
    document.getElementById("chartContainer").scrollIntoView({ behavior: "smooth" });
  }, 100);

  let name;
  if (tokenMap[currentCA]) {
    name = tokenMap[currentCA];
  } else {
    name = await getTokenNameSolana(currentCA);
    if (name) {
      tokenMap[currentCA] = name;
      localStorage.setItem("tokenMap", JSON.stringify(tokenMap));
      console.log("📦 Token cached:", currentCA, "→", name);
    } else {
      name = shortenAddress(currentCA);
    }
  }

  const caText = document.getElementById("caText");
  caText.innerHTML = `${name}<br><small style="opacity: 0.7;">${shortenAddress(currentCA)}</small>`;
  document.getElementById("caBox").style.display = "block";
}

function clearContract() {
  document.getElementById('contractInput').value = '';
  document.getElementById('chartContainer').innerHTML = '';
  toggleClearButton();
}

function toggleClearButton() {
  const input = document.getElementById('contractInput');
  const btn = document.getElementById('clearBtn');
  btn.style.display = input.value.trim() ? 'block' : 'none';
}

function applyTheme() {
  const theme = document.getElementById('themeSelect').value;
  document.body.style.background = theme === 'light' ? '#ffffff' : '#0f2027';
  document.body.style.color = theme === 'light' ? '#111' : '#f0f0f0';
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToBottom() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

window.onscroll = function () {
  const btn = document.getElementById("backToTop");
  btn.style.display = window.scrollY > 200 ? "block" : "none";
};

// Init
updateClockAndBalance();
updateTime();
setInterval(updateTime, 1000);
