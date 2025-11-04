let salesChart = null;
const { DateTime } = luxon;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth('admin');
  setActiveNav();
  initializeDashboard();
  showLogTab('all');
  setInterval(updateClock, 1000);
});

function initializeDashboard() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  document.getElementById('user-name').textContent = user?.username || 'Admin';
  updateClock();
  loadKPI();
  loadSalesChart();
  loadTopProducts();
  loadActivityLog();
}

function updateClock() {
  const now = DateTime.now().setLocale('id');
  document.getElementById('current-time').textContent = 
    now.toFormat('cccc, d LLLL yyyy • HH:mm:ss');
}

// ==================== KPI ====================
function loadKPI() {
  const transactions = getTransactions();
  const products = getProducts();
  const settings = getSettings();
  const lowThreshold = settings.lowStockThreshold || 10;

  // Hari Ini
  const today = DateTime.now().startOf('day');
  const todayTx = transactions.filter(t => DateTime.fromISO(t.date) >= today);
  const dailySales = todayTx.reduce((s, t) => s + t.total, 0);
  document.getElementById('daily-sales').textContent = `Rp ${dailySales.toLocaleString('id-ID')}`;
  document.getElementById('daily-count').textContent = `${todayTx.length} transaksi`;

  // Minggu Ini
  const weekStart = DateTime.now().startOf('week');
  const weekTx = transactions.filter(t => DateTime.fromISO(t.date) >= weekStart);
  const weeklySales = weekTx.reduce((s, t) => s + t.total, 0);
  document.getElementById('weekly-sales').textContent = `Rp ${weeklySales.toLocaleString('id-ID')}`;

  // Bulan Ini
  const monthStart = DateTime.now().startOf('month');
  const monthTx = transactions.filter(t => DateTime.fromISO(t.date) >= monthStart);
  const monthlyItems = monthTx.reduce((s, t) => s + t.items.reduce((si, i) => si + i.quantity, 0), 0);
  document.getElementById('monthly-items').textContent = monthlyItems.toLocaleString('id-ID');
  document.getElementById('monthly-transactions').textContent = monthTx.length;

  // Stok Rendah
  const lowStock = products.filter(p => p.stock < lowThreshold).length;
  document.getElementById('low-stock-count').textContent = lowStock;
  document.getElementById('total-products').textContent = products.length;
}

// ==================== GRAFIK PENJUALAN ====================
function loadSalesChart() {
  const days = parseInt(document.getElementById('chart-period').value);
  const end = DateTime.now().endOf('day');
  const start = end.minus({ days: days - 1 });

  const labels = [];
  const data = [];
  for (let d = start; d <= end; d = d.plus({ days: 1 })) {
    labels.push(d.toFormat('dd MMM'));
    const dayTx = getTransactions().filter(t => {
      const txDate = DateTime.fromISO(t.date);
      return txDate.hasSame(d, 'day');
    });
    data.push(dayTx.reduce((s, t) => s + t.total, 0));
  }

  const ctx = document.getElementById('sales-chart').getContext('2d');
  if (salesChart) salesChart.destroy();

  salesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Pendapatan (Rp)',
        data,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Rp ${ctx.parsed.y.toLocaleString('id-ID')}`
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function updateSalesChart() {
  loadSalesChart();
}

// ==================== TOP PRODUK ====================
function loadTopProducts() {
  const monthStart = DateTime.now().startOf('month');
  const monthTx = getTransactions().filter(t => DateTime.fromISO(t.date) >= monthStart);

  const productSales = {};
  monthTx.forEach(t => {
    t.items.forEach(i => {
      productSales[i.code] = (productSales[i.code] || 0) + i.quantity;
    });
  });

  const sorted = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.getElementById('top-products');
  container.innerHTML = sorted.length
    ? sorted.map(([code, qty], i) => {
        const product = getProducts().find(p => p.code === code);
        const name = product?.name || code;
        return `
          <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                ${i + 1}
              </div>
              <div>
                <p class="font-medium text-sm">${name}</p>
                <p class="text-xs text-gray-500">${qty} terjual</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-bold text-green-600">Rp ${(product?.price * qty || 0).toLocaleString('id-ID')}</p>
            </div>
          </div>
        `;
      }).join('')
    : '<p class="text-center text-gray-500 text-sm">Belum ada penjualan bulan ini</p>';
}

// ==================== LOG AKTIVITAS ====================
const LOGS_PER_PAGE = 10;
let currentLogPage = 1;
let currentLogFilter = 'all';
let allLogs = []; // Simpan semua log

function loadActivityLog() {
  allLogs = getActivityLog().slice().reverse(); // Terbaru di atas
  currentLogPage = 1;
  updateLogDisplay();
}

function showLogTab(filter) {
  // Update tab aktif
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('bg-blue-100', 'text-blue-700');
    b.classList.add('bg-gray-100', 'text-gray-700');
  });
  document.getElementById(`tab-${filter}`).classList.remove('bg-gray-100', 'text-gray-700');
  document.getElementById(`tab-${filter}`).classList.add('bg-blue-100', 'text-blue-700');

  currentLogFilter = filter;
  currentLogPage = 1;
  updateLogDisplay();
}

function updateLogDisplay() {
  let filtered = allLogs;

  if (currentLogFilter === 'login') filtered = allLogs.filter(l => /Login|Logout/.test(l.activity));
  if (currentLogFilter === 'sales') filtered = allLogs.filter(l => /Transaksi|retur|Struk/.test(l.activity));
  if (currentLogFilter === 'stock') filtered = allLogs.filter(l => /Stok|ditambahkan|dikurangi/.test(l.activity));
  if (currentLogFilter === 'system') filtered = allLogs.filter(l => /Produk|Pengguna|Pengaturan/.test(l.activity));

  const total = filtered.length;
  const start = (currentLogPage - 1) * LOGS_PER_PAGE;
  const end = Math.min(start + LOGS_PER_PAGE, total);
  const pageLogs = filtered.slice(start, end);

  renderActivityTable(pageLogs);
  updatePagination(total, start, end);
}

function renderActivityTable(logs) {
  const tbody = document.getElementById('activity-table');
  tbody.innerHTML = logs.length
    ? logs.map(log => {
        const time = DateTime.fromISO(log.timestamp).toFormat('HH:mm');
        const user = log.activity.match(/: (.*?)$/)?.[1] || '-';
        const activity = log.activity.replace(/: .*$/, '');
        return `
          <tr class="border-b hover:bg-gray-50">
            <td class="p-3 text-xs text-gray-600">${time}</td>
            <td class="p-3 text-sm font-medium">${user}</td>
            <td class="p-3 text-sm">${activity}</td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="3" class="p-8 text-center text-gray-500">Tidak ada aktivitas</td></tr>';
}

function updatePagination(total, start, end) {
  const totalEl = document.getElementById('log-total');
  const rangeEl = document.getElementById('log-range');
  const prevBtn = document.getElementById('log-prev');
  const nextBtn = document.getElementById('log-next');

  totalEl.textContent = total;
  rangeEl.textContent = total > 0 ? `${start + 1}-${end}` : '0';

  prevBtn.disabled = currentLogPage === 1;
  nextBtn.disabled = end >= total;
}

function changeLogPage(delta) {
  const newPage = currentLogPage + delta;
  if (newPage < 1) return;
  const maxPage = Math.ceil(allLogs.filter(l => applyFilter(l, currentLogFilter)).length / LOGS_PER_PAGE);
  if (newPage > maxPage) return;

  currentLogPage = newPage;
  updateLogDisplay();
}

// Helper untuk filter (biar tidak duplikat logika)
function applyFilter(log, filter) {
  if (filter === 'all') return true;
  if (filter === 'login') return /Login|Logout/.test(log.activity);
  if (filter === 'sales') return /Transaksi|retur|Struk/.test(log.activity);
  if (filter === 'stock') return /Stok|ditambahkan|dikurangi/.test(log.activity);
  if (filter === 'system') return /Produk|Pengguna|Pengaturan/.test(log.activity);
  return true;
}

// ==================== EKSPOR PDF ====================
function exportDashboardPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 20;

  const addText = (text, size = 12, bold = false) => {
    doc.setFontSize(size);
    doc.setFont(undefined, bold ? 'bold' : 'normal');
    doc.text(text, 20, y);
    y += size / 2 + 2;
  };

  addText(`${getSettings().businessName || 'Warung Bakso'} - Laporan Dasbor`, 16, true);
  addText(`Dicetak: ${DateTime.now().toFormat('dd LLLL yyyy HH:mm')}`, 10);
  y += 5;

  // KPI
  const kpi = [
    ['Hari Ini', document.getElementById('daily-sales').textContent],
    ['Minggu Ini', document.getElementById('weekly-sales').textContent],
    ['Item Terjual', document.getElementById('monthly-items').textContent],
    ['Stok Rendah', document.getElementById('low-stock-count').textContent]
  ];
  kpi.forEach(([label, value]) => {
    addText(`${label}: ${value}`, 11, true);
  });

  doc.save('dashboard-warung-bakso.pdf');
  showToast('PDF berhasil diunduh!', 'success');
}

// ==================== REFRESH ====================
function refreshDashboard() {
  showToast('Memperbarui data...', 'info');
  setTimeout(() => {
    loadKPI();
    loadSalesChart();
    loadTopProducts();
    loadActivityLog();
    showToast('Dashboard diperbarui!', 'success');
  }, 500);
}