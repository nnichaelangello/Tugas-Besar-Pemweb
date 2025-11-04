let chartInstance = null;
let allHistory = [];
let filteredHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  checkAuth('admin');
  setActiveNav();
  loadProducts();
  loadCurrentStock();
  loadStockHistory();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('stock-reason').addEventListener('change', () => {
    const reason = document.getElementById('stock-reason').value;
    document.getElementById('custom-reason').classList.toggle('hidden', reason !== 'Lainnya');
  });
}

function loadProducts() {
  const products = getProducts();
  const select = document.getElementById('stock-product');
  select.innerHTML = '<option value="">Pilih Produk</option>';
  products.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.code;
    opt.textContent = `${p.name} (${p.code}) - Stok: ${p.stock}`;
    select.appendChild(opt);
  });
}

function loadCurrentStock() {
  const products = getProducts();
  const tbody = document.getElementById('current-stock');
  tbody.innerHTML = '';

  products.forEach(p => {
    const status = p.stock < 10 ? 'Rendah' : p.stock < 30 ? 'Sedang' : 'Aman';
    const statusColor = p.stock < 10 ? 'text-red-600' : p.stock < 30 ? 'text-yellow-600' : 'text-green-600';

    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    row.innerHTML = `
      <td class="p-3">${p.code}</td>
      <td class="p-3 font-medium">${p.name}</td>
      <td class="p-3 text-gray-600">${p.category || '-'}</td>
      <td class="p-3 text-center font-semibold">${p.stock}</td>
      <td class="p-3 text-center"><span class="${statusColor} text-sm font-medium">${status}</span></td>
      <td class="p-3 text-center">
        <button onclick="quickAdjust('${p.code}', 1)" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">+</button>
        <button onclick="quickAdjust('${p.code}', -1)" class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded ml-1">-</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function quickAdjust(code, change) {
  const product = getProducts().find(p => p.code === code);
  const quantity = change;
  const reason = change > 0 ? 'Restock Cepat' : 'Koreksi Cepat';
  adjustStockInternal(code, quantity, reason, product.name);
}

function adjustStock() {
  const code = document.getElementById('stock-product').value;
  const qty = parseInt(document.getElementById('stock-quantity').value);
  let reason = document.getElementById('stock-reason').value;

  if (!code || isNaN(qty) || qty === 0 || !reason) {
    showToast('Isi semua kolom dengan benar!', 'error');
    return;
  }

  if (reason === 'Lainnya') {
    reason = document.getElementById('custom-reason-input').value.trim();
    if (!reason) return showToast('Tulis alasan lainnya!', 'error');
  }

  const product = getProducts().find(p => p.code === code);
  if (product.stock + qty < 0) {
    showToast('Stok tidak cukup untuk pengurangan!', 'error');
    return;
  }

  if (!confirm(`Yakin menyesuaikan stok ${product.name} sebesar ${qty > 0 ? '+' : ''}${qty}?`)) return;

  adjustStockInternal(code, qty, reason, product.name);
}

function adjustStockInternal(code, quantity, reason, name) {
  const products = getProducts();
  const product = products.find(p => p.code === code);
  const oldStock = product.stock;
  product.stock += quantity;
  saveProducts(products);

  addStockHistory({ code, name, quantity, reason, afterStock: product.stock });
  addActivityLog({ activity: `Stok: ${name} ${quantity > 0 ? '+' : ''}${quantity} → ${product.stock} (${reason})` });

  showToast(`Stok ${name} berhasil disesuaikan!`);
  resetAdjustmentForm();
  loadCurrentStock();
  loadStockHistory();
}

function resetAdjustmentForm() {
  document.getElementById('stock-product').value = '';
  document.getElementById('stock-quantity').value = '';
  document.getElementById('stock-reason').value = '';
  document.getElementById('custom-reason').classList.add('hidden');
  document.getElementById('custom-reason-input').value = '';
}

function loadStockHistory() {
  allHistory = getStockHistory().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  filteredHistory = [...allHistory];
  renderStockHistory();
  renderStockChart();
}

function filterStockHistory() {
  const start = document.getElementById('history-start').value;
  const end = document.getElementById('history-end').value;

  filteredHistory = allHistory.filter(h => {
    const d = new Date(h.timestamp);
    if (start && d < new Date(start)) return false;
    if (end) { const e = new Date(end); e.setHours(23,59,59); return d <= e; }
    return true;
  });

  renderStockHistory();
  renderStockChart();
}

function renderStockHistory() {
  const tbody = document.getElementById('stock-history');
  tbody.innerHTML = filteredHistory.length
    ? filteredHistory.map(h => `
        <tr class="hover:bg-gray-50">
          <td class="p-3 text-sm">${new Date(h.timestamp).toLocaleString('id-ID')}</td>
          <td class="p-3">${h.name} (${h.code})</td>
          <td class="p-3 text-center font-medium ${h.quantity > 0 ? 'text-green-600' : 'text-red-600'}">
            ${h.quantity > 0 ? '+' : ''}${h.quantity}
          </td>
          <td class="p-3 text-sm">${h.reason}</td>
          <td class="p-3 text-center font-semibold">${h.afterStock || '-'}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" class="p-3 text-center text-gray-500">Tidak ada riwayat</td></tr>';
}

function renderStockChart() {
  const ctx = document.getElementById('stock-chart').getContext('2d');
  const dataByProduct = {};

  filteredHistory.forEach(h => {
    if (!dataByProduct[h.code]) dataByProduct[h.code] = { name: h.name, history: [] };
    const last = dataByProduct[h.code].history.length ? dataByProduct[h.code].history.slice(-1)[0].stock : 0;
    dataByProduct[h.code].history.push({ date: h.timestamp, stock: last + h.quantity });
  });

  const datasets = Object.values(dataByProduct).map((p, i) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return {
      label: p.name,
      data: p.history.map(h => h.stock),
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + '20',
      fill: false,
      tension: 0.3
    };
  });

  const labels = [...new Set(filteredHistory.map(h => new Date(h.timestamp).toLocaleDateString('id-ID')))].sort();

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// ==================== EKSPOR ====================
function exportStockCSV() {
  const products = getProducts();
  const csv = [
    'Kode,Nama,Kategori,Stok,Status',
    ...products.map(p => `${p.code},${p.name},${p.category || ''},${p.stock},${p.stock < 10 ? 'Rendah' : p.stock < 30 ? 'Sedang' : 'Aman'}`)
  ].join('\n');
  downloadFile(csv, 'stok-saat-ini.csv', 'text/csv');
}

function exportStockHistoryCSV() {
  const csv = [
    'Waktu,Produk,Kode,Perubahan,Alasan,Stok Setelah',
    ...filteredHistory.map(h => `${h.timestamp},${h.name},${h.code},${h.quantity},${h.reason},${h.afterStock || ''}`)
  ].join('\n');
  downloadFile(csv, 'riwayat-stok.csv', 'text/csv');
}

function exportStockHistoryPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(16);
  doc.text('Riwayat Stok - Warung Bakso', 105, y, { align: 'center' });
  y += 15;

  filteredHistory.forEach(h => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.text(`${new Date(h.timestamp).toLocaleString('id-ID')} | ${h.name} (${h.code})`, 10, y);
    y += 6;
    doc.setFontSize(9);
    doc.text(`  ${h.quantity > 0 ? '+' : ''}${h.quantity} → ${h.afterStock} | ${h.reason}`, 15, y);
    y += 8;
  });

  doc.save('riwayat-stok.pdf');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}