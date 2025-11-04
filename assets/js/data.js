// data.js
function initializeData() {
  // Produk
  if (!localStorage.getItem('products')) {
    const initialProducts = [
      { code: 'B001', name: 'Bakso Biasa', price: 15000, stock: 100, category: 'Makanan' },
      { code: 'B002', name: 'Bakso Urat', price: 20000, stock: 50, category: 'Makanan' },
      { code: 'B003', name: 'Bakso Jumbo', price: 25000, stock: 30, category: 'Makanan' },
      { code: 'M001', name: 'Es Teh', price: 5000, stock: 200, category: 'Minuman' },
      { code: 'M002', name: 'Jus Jeruk', price: 8000, stock: 80, category: 'Minuman' },
      { code: 'T001', name: 'Kerupuk', price: 3000, stock: 150, category: 'Tambahan' },
      { code: 'P001', name: 'Paket Komplit', price: 35000, stock: 20, category: 'Paket' }
    ];
    localStorage.setItem('products', JSON.stringify(initialProducts));
  }

  // Pengguna
  if (!localStorage.getItem('users')) {
    const initialUsers = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'kasir1', password: 'kasir123', role: 'kasir' },
      { username: 'kasir2', password: 'kasir123', role: 'kasir' }
    ];
    localStorage.setItem('users', JSON.stringify(initialUsers));
  }

  // Transaksi
  if (!localStorage.getItem('transactions')) {
    localStorage.setItem('transactions', JSON.stringify([]));
  }

  // Pengaturan
  if (!localStorage.getItem('settings')) {
    localStorage.setItem('settings', JSON.stringify({
      taxRate: 11,
      currency: 'IDR',
      language: 'id',
      businessName: 'Warung Bakso Pak Farrel',
      lowStockThreshold: 10,
      mediumStockThreshold: 30
    }));
  }

  // Log Aktivitas
  if (!localStorage.getItem('activityLog')) {
    localStorage.setItem('activityLog', JSON.stringify([]));
  }

  // Riwayat Stok
  if (!localStorage.getItem('stockHistory')) {
    localStorage.setItem('stockHistory', JSON.stringify([]));
  }

  // Inisialisasi pengguna aktif (jika belum login)
  if (!localStorage.getItem('currentUser') && !window.location.pathname.includes('index.html')) {
    localStorage.removeItem('currentUser');
  }
}

// ==================== PRODUK ====================
function getProducts() {
  return JSON.parse(localStorage.getItem('products')) || [];
}

function saveProducts(products) {
  localStorage.setItem('products', JSON.stringify(products));
}

// ==================== PENGGUNA ====================
function getUsers() {
  return JSON.parse(localStorage.getItem('users')) || [];
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

// ==================== TRANSAKSI ====================
function getTransactions() {
  const tx = JSON.parse(localStorage.getItem('transactions')) || [];
  return tx.map(t => ({
    ...t,
    date: t.date || new Date().toISOString(),
    total: t.total || 0,
    subtotal: t.subtotal || 0,
    tax: t.tax || 0,
    items: t.items || []
  }));
}

function saveTransactions(transactions) {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// ==================== PENGATURAN ====================
function getSettings() {
  const defaults = {
    taxRate: 11,
    currency: 'IDR',
    language: 'id',
    businessName: 'Warung Bakso',
    lowStockThreshold: 10,
    mediumStockThreshold: 30
  };
  const saved = JSON.parse(localStorage.getItem('settings'));
  return { ...defaults, ...saved };
}

function saveSettings(settings) {
  localStorage.setItem('settings', JSON.stringify(settings));
}

// ==================== LOG AKTIVITAS ====================
function getActivityLog() {
  return JSON.parse(localStorage.getItem('activityLog')) || [];
}

function addActivityLog(entry) {
  const logs = getActivityLog();
  logs.push({
    ...entry,
    timestamp: new Date().toISOString(),
    timestampDisplay: new Date().toLocaleString('id-ID')
  });
  localStorage.setItem('activityLog', JSON.stringify(logs.slice(-1000))); // batasi 1000 log
}

// ==================== RIWAYAT STOK ====================
function getStockHistory() {
  return JSON.parse(localStorage.getItem('stockHistory')) || [];
}

function addStockHistory(entry) {
  const history = getStockHistory();
  history.push({
    ...entry,
    timestamp: new Date().toISOString(),
    timestampDisplay: new Date().toLocaleString('id-ID'),
    afterStock: entry.afterStock || 0
  });
  localStorage.setItem('stockHistory', JSON.stringify(history.slice(-2000))); // batasi 2000 entri
}

// ==================== UTILITAS TAMBAHAN ====================
function generateId(prefix = 'TX') {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${dateStr}${random}`;
}

function clearAllData() {
  if (confirm('Hapus SEMUA data? Tidak bisa dikembalikan!')) {
    localStorage.clear();
    initializeData();
    showToast('Semua data telah direset!');
    setTimeout(() => location.reload(), 1000);
  }
}

// Jalankan inisialisasi
initializeData();