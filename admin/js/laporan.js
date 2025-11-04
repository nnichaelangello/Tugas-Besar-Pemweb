let chartInstance = null;
let allTransactions = [];
let filteredTransactions = [];

document.addEventListener('DOMContentLoaded', () => {
  checkAuth('admin');
  setActiveNav();
  allTransactions = getTransactions();
  setupEventListeners();
  generateReport();
});

function setupEventListeners() {
  document.getElementById('report-type').addEventListener('change', toggleCustomRange);
  document.getElementById('sort-by').addEventListener('change', generateReport);
  document.getElementById('date-start').addEventListener('change', generateReport);
  document.getElementById('date-end').addEventListener('change', generateReport);
}

function toggleCustomRange() {
  const type = document.getElementById('report-type').value;
  const customDiv = document.getElementById('custom-range');
  if (type === 'custom') {
    customDiv.classList.remove('hidden');
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date-start').value = today;
    document.getElementById('date-end').value = today;
  } else {
    customDiv.classList.add('hidden');
  }
  generateReport();
}

function generateReport() {
  const type = document.getElementById('report-type').value;
  const sortBy = document.getElementById('sort-by').value;
  let start, end;

  if (type === 'custom') {
    start = new Date(document.getElementById('date-start').value);
    end = new Date(document.getElementById('date-end').value);
    if (isNaN(start) || isNaN(end)) return showToast('Pilih rentang tanggal!', 'error');
    end.setHours(23, 59, 59);
  } else {
    const now = new Date();
    if (type === 'daily') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (type === 'weekly') {
      start = new Date(now); start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      end = new Date(start); end.setDate(start.getDate() + 6);
    } else if (type === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (type === 'yearly') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }
  }

  filteredTransactions = allTransactions.filter(t => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  });

  // Sorting
  filteredTransactions.sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'total-desc') return b.total - a.total;
    if (sortBy === 'total-asc') return a.total - b.total;
  });

  renderSummary();
  renderChart();
  renderTable();
}

function renderSummary() {
  const totalTrans = filteredTransactions.length;
  const totalRev = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const avgTrans = totalTrans > 0 ? totalRev / totalTrans : 0;

  const productCount = {};
  filteredTransactions.forEach(t => {
    t.items.forEach(item => {
      productCount[item.name] = (productCount[item.name] || 0) + item.quantity;
    });
  });
  const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0];

  document.getElementById('summary-transactions').textContent = totalTrans;
  document.getElementById('summary-revenue').textContent = `Rp ${totalRev.toLocaleString('id-ID')}`;
  document.getElementById('summary-average').textContent = `Rp ${Math.round(avgTrans).toLocaleString('id-ID')}`;
  document.getElementById('summary-top-product').textContent = topProduct ? `${topProduct[0]} (${topProduct[1]}x)` : '-';
}

function renderChart() {
  const ctx = document.getElementById('sales-chart').getContext('2d');
  const dailyTotals = {};

  filteredTransactions.forEach(t => {
    const date = new Date(t.date).toLocaleDateString('id-ID');
    dailyTotals[date] = (dailyTotals[date] || 0) + t.total;
  });

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(dailyTotals),
      datasets: [{
        label: 'Penjualan Harian (Rp)',
        data: Object.values(dailyTotals),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { mode: 'index', intersect: false },
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => 'Rp ' + v.toLocaleString('id-ID') } }
      }
    }
  });
}

function renderTable() {
  const content = document.getElementById('report-content');
  if (filteredTransactions.length === 0) {
    content.innerHTML = '<p class="text-center text-gray-500">Tidak ada transaksi dalam periode ini.</p>';
    return;
  }

  content.innerHTML = `
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-gray-100">
          <th class="p-3 border-b">ID</th>
          <th class="p-3 border-b">Tanggal</th>
          <th class="p-3 border-b">Item</th>
          <th class="p-3 border-b text-right">Subtotal</th>
          <th class="p-3 border-b text-right">Pajak</th>
          <th class="p-3 border-b text-right">Total</th>
          <th class="p-3 border-b text-center">Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${filteredTransactions.map((t, idx) => `
          <tr class="hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
            <td class="p-3 border-b">${t.id}</td>
            <td class="p-3 border-b text-sm">${new Date(t.date).toLocaleString('id-ID')}</td>
            <td class="p-3 border-b">
              <div class="text-sm">
                ${t.items.map(item => `${item.name} x${item.quantity}`).join('<br>')}
              </div>
            </td>
            <td class="p-3 border-b text-right">Rp ${(t.subtotal || 0).toLocaleString('id-ID')}</td>
            <td class="p-3 border-b text-right">Rp ${(t.tax || 0).toLocaleString('id-ID')}</td>
            <td class="p-3 border-b text-right font-semibold">Rp ${t.total.toLocaleString('id-ID')}</td>
            <td class="p-3 border-b text-center">
              <button onclick="toggleDetail(${idx})" class="text-blue-600 text-xs hover:underline">Detail</button>
            </td>
          </tr>
          <tr id="detail-${idx}" class="hidden bg-blue-50">
            <td colspan="7" class="p-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Item Detail:</strong><br>
                  ${t.items.map(item => `• ${item.name} — Rp ${item.price.toLocaleString('id-ID')} x ${item.quantity} = Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`).join('<br>')}
                </div>
                <div>
                  <strong>Ringkasan:</strong><br>
                  Subtotal: Rp ${(t.subtotal || 0).toLocaleString('id-ID')}<br>
                  Pajak (${getSettings().taxRate}%): Rp ${(t.tax || 0).toLocaleString('id-ID')}<br>
                  <strong>Total: Rp ${t.total.toLocaleString('id-ID')}</strong>
                </div>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function toggleDetail(idx) {
  const el = document.getElementById(`detail-${idx}`);
  el.classList.toggle('hidden');
}

function toggleAllDetails() {
  const details = document.querySelectorAll('[id^="detail-"]');
  const allHidden = Array.from(details).every(d => d.classList.contains('hidden'));
  details.forEach(d => d.classList.toggle('hidden', !allHidden));
}

// ==================== EKSPOR CSV ====================
function exportCSV() {
  if (filteredTransactions.length === 0) return showToast('Tidak ada data untuk diekspor!', 'error');

  const headers = ['ID', 'Tanggal', 'Item', 'Qty', 'Harga', 'Subtotal', 'Pajak', 'Total'];
  const rows = filteredTransactions.flatMap(t => 
    t.items.map(item => [
      t.id,
      new Date(t.date).toLocaleString('id-ID'),
      item.name,
      item.quantity,
      item.price,
      item.price * item.quantity,
      t.tax || 0,
      t.total
    ])
  );

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  downloadFile(csv, 'laporan-penjualan.csv', 'text/csv');
}

// ==================== EKSPOR PDF ====================
function exportPDF() {
  if (filteredTransactions.length === 0) return showToast('Tidak ada data untuk diekspor!', 'error');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16);
  doc.text('Laporan Penjualan Warung Bakso', 105, y, { align: 'center' });
  y += 10;
  doc.setFontSize(10);
  doc.text(`Periode: ${document.getElementById('report-type').options[document.getElementById('report-type').selectedIndex].text}`, 105, y, { align: 'center' });
  y += 15;

  filteredTransactions.forEach(t => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.text(`${t.id} | ${new Date(t.date).toLocaleString('id-ID')} | Total: Rp ${t.total.toLocaleString('id-ID')}`, 10, y);
    y += 7;
    t.items.forEach(item => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.setFontSize(9);
      doc.text(`  • ${item.name} x${item.quantity} @ Rp ${item.price.toLocaleString('id-ID')}`, 15, y);
      y += 5;
    });
    y += 5;
  });

  doc.save('laporan-penjualan.pdf');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}