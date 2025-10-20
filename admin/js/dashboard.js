document.addEventListener('DOMContentLoaded', () => {
    checkAuth('admin');
    setActiveNav();
    loadDashboard();
  });
  
  function loadDashboard() {
    const transactions = getTransactions();
    const products = getProducts();
    const logs = getActivityLog();
  
    const today = new Date().toDateString();
    const dailySales = transactions
      .filter(t => new Date(t.date).toDateString() === today)
      .reduce((sum, t) => sum + t.total, 0);
    document.getElementById('daily-sales').textContent = `Rp ${dailySales.toLocaleString('id-ID')}`;
  
    const lowStock = products.filter(p => p.stock < 10).length;
    document.getElementById('low-stock').textContent = lowStock;
  
    document.getElementById('recent-transactions').textContent = transactions.length;
  
    const activityLog = document.getElementById('activity-log');
    activityLog.innerHTML = logs.slice(-5).map(log => `
      <tr>
        <td>${log.timestamp}</td>
        <td>${log.activity}</td>
      </tr>
    `).join('');
  }