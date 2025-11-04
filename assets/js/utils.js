// utils.js
function checkAuth(roleRequired) {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user || !roleRequired.includes(user.role)) {
    window.location.href = '../index.html';
    return null;
  }
  return user;
}

function logout() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (user) {
    addActivityLog({ activity: `Logout: ${user.username}` });
  }
  localStorage.removeItem('currentUser');
  window.location.href = '../index.html';
}

function setActiveNav() {
  const currentPath = window.location.pathname.split('/').pop();
  document.querySelectorAll('#navbar-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (href === '#' && currentPath === '')) {
      link.classList.add('navbar-active');
    } else {
      link.classList.remove('navbar-active');
    }
  });
}

function translate(text, lang = 'id') {
  const translations = {
    id: {
      dashboard: 'Dasbor',
      transactions: 'Transaksi',
      products: 'Produk',
      users: 'Pengguna',
      stock: 'Stok',
      reports: 'Laporan',
      settings: 'Pengaturan',
      logout: 'Keluar',
      total: 'Total',
      revenue: 'Pendapatan',
      average: 'Rata-rata',
      top_product: 'Produk Terlaris'
    },
    en: {
      dashboard: 'Dashboard',
      transactions: 'Transactions',
      products: 'Products',
      users: 'Users',
      stock: 'Stock',
      reports: 'Reports',
      settings: 'Settings',
      logout: 'Logout',
      total: 'Total',
      revenue: 'Revenue',
      average: 'Average',
      top_product: 'Top Product'
    }
  };
  return translations[lang]?.[text] || text;
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.style.display = 'block';
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
  }, 2500);
}

function formatPriceInput(input) {
  if (!input) return;

  input.removeEventListener('input', input._formatHandler);

  const handler = () => {
    let value = input.value.replace(/\D/g, '');
    if (value === '') {
      input.value = '';
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      input.value = num.toLocaleString('id-ID');
    }
  };

  input._formatHandler = handler;
  input.addEventListener('input', handler);

  input.addEventListener('paste', () => setTimeout(handler, 0));
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatDate(isoString, options = {}) {
  return new Date(isoString).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  });
}

function formatCurrency(amount) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

// Tambahkan CSS toast jika belum ada
if (!document.getElementById('toast-style')) {
  const style = document.createElement('style');
  style.id = 'toast-style';
  style.textContent = `
    #toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      transition: opacity 0.3s;
      max-width: 300px;
      word-wrap: break-word;
    }
    .toast-success { background: #10b981; }
    .toast-error { background: #ef4444; }
    .toast-warning { background: #f59e0b; }
    .toast-info { background: #3b82f6; }
    .navbar-active {
      background: rgba(255,255,255,0.2) !important;
      border-radius: 8px;
    }
  `;
  document.head.appendChild(style);
}