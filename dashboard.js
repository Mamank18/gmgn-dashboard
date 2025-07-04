
// ✅ Token metadata cache
let tokenMap = JSON.parse(localStorage.getItem("tokenMap") || "{}");

// ✅ Constants
const walletAddress = "DMsDZSayCJ1uwLUxGzJmniDGcfNtmZgzg83Mi9An8pi3";
let isBalanceVisible = false;
let currentCA = "";

// ✅ Utility functions
function shortenAddress(addr) {
  return addr.length > 10 ? addr.slice(0, 6) + "..." + addr.slice(-4) : addr;
}

async function getSolBalance(address) {
  const response = await fetch("https://mamankv1.aminsubhan.workers.dev/get-balance", {
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
    document.getElementById("balanceDisplay").innerText = isBalanceVisible ? `${sol.toFixed(4)} ($${totalUSD})` : "";
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
  document.getElementById("clockDisplay").innerText = now.toLocaleString("id-ID", {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour12: false
})
// Contoh: Kam, 27 Jun 2025 14.32.45
;
}

function toggleCalendar() {
  const calendar = document.getElementById("calendarWidget");
  calendar.style.display = calendar.style.display === "none" ? "block" : "none";
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

document.addEventListener("DOMContentLoaded", function () {
  updateTime(); // Tambahkan ini di sini juga
  setInterval(updateTime, 1000); // Tetap aktifkan loop update tiap detik

  const balanceEl = document.getElementById("walletBalanceInfo");
  if (balanceEl) {
    let isBalanceShown = false;

    balanceEl.innerText = "SOL";
    balanceEl.style.cursor = "pointer";
    balanceEl.style.textDecoration = "underline";

    balanceEl.addEventListener("click", async function () {
      if (!isBalanceShown) {
        try {
          const sol = await getSolBalance(walletAddress);
          const usd = await getSolPriceUSD();
          const totalUSD = (sol * usd).toFixed(2);
          balanceEl.innerText = `${sol.toFixed(4)} SOL ($${totalUSD})`;
          isBalanceShown = true;
        } catch (err) {
          balanceEl.innerText = "Gagal ambil saldo";
        }
      } else {
        balanceEl.innerText = "SOL";
        isBalanceShown = false;
      }
    });    
  }
});


function loadCharts(ca, chain, theme) {
  const timeframes = ['1', '5', '15', '60'];
  const container = document.getElementById('chartContainer');
  container.innerHTML = '';

  timeframes.forEach(tf => {
    const url = `https://www.gmgn.cc/kline/${chain}/${ca}?interval=${tf}&theme=${theme}`;
    const div = document.createElement('div');
    div.innerHTML = `<iframe src="${url}" title="Chart ${tf}min" style="width:100%;height:300px;border:none;border-radius:8px;"></iframe>`;
    container.appendChild(div);
  });

  document.getElementById("checklistPanel").style.display = "block";
}
async function getTokenNameSolana(ca) {
  try {
    const response = await fetch(`https://mamankv1.aminsubhan.workers.dev/token-metadata?mint=${ca}`);

    const result = await response.json();
    console.log("Token Metadata Response:", result); // Debug output

    const token = result[0];

    const name =
      token?.onChainMetadata?.metadata?.data?.name ||  // struktur valid
      token?.onChainMetadata?.metadata?.name ||         // alternatif
      token?.onChainMetadata?.name ||                   // alternatif
      token?.name ||                                    // fallback
      "Unknown Token";

    return name;

  } catch (error) {
    console.error("Error fetching token name:", error);
    return "Unknown Token";
  }
}

async function loadDashboard() {
  const ca = document.getElementById('contractInput').value.trim();
  const chain = document.getElementById('chainSelect').value;
  const theme = document.getElementById('themeSelect').value;
  if (!ca) return alert('Please enter a contract address.');

  document.getElementById("checklistPanel").style.display = "block";
  loadCharts(ca, chain, theme);

  currentCA = ca;
  document.getElementById("sidebar").classList.remove("open");
  setTimeout(() => {
    document.getElementById("chartContainer").scrollIntoView({ behavior: "smooth" });
  }, 100);

  let name;
  try {
    name = await getTokenNameSolana(currentCA);
    if (name) {
      tokenMap[currentCA] = name;
      localStorage.setItem("tokenMap", JSON.stringify(tokenMap));
      console.log("📦 Token cached:", currentCA, "→", name);
    } else {
      name = tokenMap[currentCA] || shortenAddress(currentCA);
    }
  } catch {
    name = tokenMap[currentCA] || shortenAddress(currentCA);
  }

  const caText = document.getElementById("caText");
  if (caText) {
    caText.innerHTML = `${name}<br><small style="opacity: 0.7;">${shortenAddress(currentCA)}</small>`;
    document.getElementById("caBox").style.display = "block";
  }

  // ✅ Update info ke dalam checklist panel (penting!)
  const tokenNameEl = document.getElementById("tokenName");
  const shortCAEl = document.getElementById("shortCA");

  if (tokenNameEl && shortCAEl) {
    tokenNameEl.innerText = name;
    shortCAEl.innerText = shortenAddress(currentCA);
  } else {
    console.warn("Elemen #tokenName atau #shortCA tidak ditemukan di halaman.");
  }

  toggleClearButton();
}

function clearContract() {
  document.getElementById('contractInput').value = '';
  document.getElementById('chartContainer').innerHTML = '';
  document.getElementById("checklistPanel").style.display = "none";
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
  const btnTop = document.getElementById("backToTop");
  const btnBottom = document.getElementById("scrollBottomBtn");

  // Tampilkan tombol atas jika scroll > 200px
  btnTop.style.display = window.scrollY > 200 ? "block" : "none";

  // Sembunyikan tombol bawah jika sudah mendekati akhir halaman
  const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 50);
  btnBottom.style.display = nearBottom ? "none" : "block";
};


// (Opsional) Clear token cache
function clearTokenCache() {
  localStorage.removeItem("tokenMap");
  tokenMap = {};
  alert("✅ Token cache dibersihkan.");
}

// Init
updateTime();
setInterval(updateTime, 1000);
document.addEventListener("DOMContentLoaded", function () {
  const balanceEl = document.getElementById("walletBalanceInfo");
  if (balanceEl) {
    let isBalanceShown = false;

    balanceEl.innerText = "SOL";
    balanceEl.style.cursor = "pointer";
    balanceEl.style.textDecoration = "underline";

    balanceEl.addEventListener("click", async function () {
      if (!isBalanceShown) {
        try {
          const sol = await getSolBalance(walletAddress);
          const usd = await getSolPriceUSD();
          const totalUSD = (sol * usd).toFixed(2);
          balanceEl.innerText = `${sol.toFixed(4)} SOL ($${totalUSD})`;
          isBalanceShown = true;
        } catch (err) {
          balanceEl.innerText = "Gagal ambil saldo";
        }
      } else {
        balanceEl.innerText = "SOL";
        isBalanceShown = false;
      }
    });    
  }
});
