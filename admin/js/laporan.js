document.addEventListener('DOMContentLoaded', () => {
    checkAuth('admin');
    setActiveNav();
    generateReport();
    document.getElementById('report-type').addEventListener('change', generateReport);
  });
  
  function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const transactions = getTransactions();
    const now = new Date();
    let filtered = transactions;
  
    if (reportType === 'daily') {
      filtered = transactions.filter(t => new Date(t.date).toDateString() === now.toDateString());
    } else if (reportType === 'weekly') {
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
      filtered = transactions.filter(t => new Date(t.date) >= oneWeekAgo);
    } else if (reportType === 'monthly') {
      const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filtered = transactions.filter(t => new Date(t.date) >= oneMonthAgo);
    } else if (reportType === 'yearly') {
      const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      filtered = transactions.filter(t => new Date(t.date) >= oneYearAgo);
    }
  
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = `
      <h3>Laporan ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}</h3>
      <table>
        <thead>
          <tr class="bg-gray-200">
            <th>ID</th>
            <th>Tanggal</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(t => `
            <tr>
              <td>${t.id}</td>
              <td>${t.date}</td>
              <td>Rp ${t.total.toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  
    // Generate simple bar chart
    const ctx = document.getElementById('sales-chart').getContext('2d');
    const totalsByDate = {};
    filtered.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('id-ID');
      totalsByDate[date] = (totalsByDate[date] || 0) + t.total;
    });
  
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(totalsByDate),
        datasets: [{
          label: 'Penjualan (Rp)',
          data: Object.values(totalsByDate),
          backgroundColor: '#2563eb',
          borderColor: '#1e40af',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
  
  function exportReport() {
    const transactions = getTransactions();
    const csv = [
      'ID,Tanggal,Total',
      ...transactions.map(t => `${t.id},${t.date},${t.total}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'laporan-penjualan.csv');
    a.click();
  }