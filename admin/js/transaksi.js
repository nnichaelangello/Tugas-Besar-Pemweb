let cart = [];
let heldTransactions = [];
let currentDetailId = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth(['admin', 'kasir']);
  setActiveNav();
  loadProducts();
  loadHeldTransactions();
  loadTodayStats();
  loadTransactionHistory();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('search-product').addEventListener('input', debounce(applyProductFilter, 300));
  document.getElementById('filter-category').addEventListener('change', applyProductFilter);
}

// ==================== PRODUK ====================
function loadProducts() {
  const products = getProducts().filter(p => p.stock > 0);
  renderProductGrid(products);
}

function applyProductFilter() {
  const search = document.getElementById('search-product').value.toLowerCase();
  const category = document.getElementById('filter-category').value;
  let products = getProducts().filter(p => p.stock > 0);

  if (search) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search)
    );
  }
  if (category) {
    products = products.filter(p => p.category === category);
  }

  renderProductGrid(products);
}

function showAllProducts() {
  document.getElementById('search-product').value = '';
  document.getElementById('filter-category').value = '';
  loadProducts();
}

function renderProductGrid(products) {
  const container = document.getElementById('product-list');
  container.innerHTML = products.length
    ? products.map(p => `
        <div class="bg-gray-50 p-3 rounded border hover:shadow-md transition-shadow cursor-pointer" onclick="addToCart('${p.code}')">
          <h4 class="font-semibold text-sm">${p.name}</h4>
          <p class="text-xs text-gray-600">Kode: ${p.code}</p>
          <p class="font-bold text-green-600">Rp ${p.price.toLocaleString('id-ID')}</p>
          <p class="text-xs ${p.stock < 10 ? 'text-red-600' : 'text-gray-600'}">Stok: ${p.stock}</p>
        </div>
      `).join('')
    : '<p class="col-span-full text-center text-gray-500">Tidak ada produk tersedia</p>';
}

function addToCart(code) {
  const product = getProducts().find(p => p.code === code);
  if (!product || product.stock <= 0) return showToast('Stok habis!', 'error');

  const existing = cart.find(i => i.code === code);
  if (existing) {
    if (existing.quantity >= product.stock) return showToast('Stok tidak cukup!', 'error');
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  updateStock(code, -1, 'Tambah ke keranjang');
  updateCartDisplay();
  showToast(`${product.name} ditambahkan`, 'success');
}

// ==================== KERANJANG ====================
function updateCartDisplay() {
  const tbody = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('subtotal');
  const taxRateEl = document.getElementById('tax-rate');
  const taxAmountEl = document.getElementById('tax-amount');
  const totalEl = document.getElementById('total-bayar');

  tbody.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="p-2 text-sm">${item.name}</td>
      <td class="p-2 text-sm">Rp ${item.price.toLocaleString('id-ID')}</td>
      <td class="p-2 text-center">
        <input type="number" value="${item.quantity}" min="1" max="${getAvailableStock(item.code)}"
               class="w-16 text-center border rounded text-sm" onchange="updateQuantity('${item.code}', this.value)">
      </td>
      <td class="p-2 text-right text-sm font-medium">Rp ${itemTotal.toLocaleString('id-ID')}</td>
      <td class="p-2 text-center">
        <button onclick="removeFromCart('${item.code}')" class="text-xs text-red-600 hover:underline">Hapus</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  const settings = getSettings();
  const tax = subtotal * (settings.taxRate / 100);
  const total = subtotal + tax;

  subtotalEl.textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
  taxRateEl.textContent = settings.taxRate;
  taxAmountEl.textContent = `Rp ${tax.toLocaleString('id-ID')}`;
  totalEl.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

function getAvailableStock(code) {
  const product = getProducts().find(p => p.code === code);
  const inCart = cart.find(i => i.code === code)?.quantity || 0;
  return product ? product.stock + inCart : 0;
}

function updateQuantity(code, newQty) {
  const qty = parseInt(newQty);
  if (isNaN(qty) || qty < 1) return showToast('Jumlah minimal 1!', 'error');

  const product = getProducts().find(p => p.code === code);
  const cartItem = cart.find(i => i.code === code);
  if (qty > getAvailableStock(code)) return showToast('Stok tidak cukup!', 'error');

  const diff = qty - cartItem.quantity;
  updateStock(code, -diff, 'Ubah jumlah');
  cartItem.quantity = qty;
  updateCartDisplay();
}

function removeFromCart(code) {
  const item = cart.find(i => i.code === code);
  if (!item) return;

  if (!confirm(`Hapus ${item.name} dari keranjang?`)) return;
  updateStock(code, item.quantity, 'Hapus dari keranjang');
  cart = cart.filter(i => i.code !== code);
  updateCartDisplay();
  showToast(`${item.name} dihapus`, 'info');
}

function clearCart() {
  if (cart.length === 0) return;
  if (!confirm('Kosongkan keranjang?')) return;

  cart.forEach(item => updateStock(item.code, item.quantity, 'Batalkan keranjang'));
  cart = [];
  updateCartDisplay();
  showToast('Keranjang dikosongkan', 'info');
}

// ==================== CHECKOUT ====================
function checkout() {
  if (cart.length === 0) return showToast('Keranjang kosong!', 'error');
  if (!confirm('Selesaikan transaksi?')) return;

  const settings = getSettings();
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * (settings.taxRate / 100);
  const total = subtotal + tax;
  const id = generateId('TRX');

  const items = cart.map(i => ({
    code: i.code,
    name: i.name,
    price: i.price,
    quantity: i.quantity
  }));

  const transaction = {
    id,
    date: new Date().toISOString(),
    items,
    subtotal,
    tax,
    total,
    cashier: JSON.parse(localStorage.getItem('currentUser')).username
  };

  const transactions = getTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);

  cart.forEach(i => updateStock(i.code, -i.quantity, 'Penjualan'));
  addActivityLog({ activity: `Transaksi: ${id} oleh ${transaction.cashier}` });

  cart = [];
  updateCartDisplay();
  loadTodayStats();
  loadTransactionHistory();
  showToast(`Transaksi ${id} selesai!`, 'success');
}

// ==================== STRUK ====================
function printReceipt() {
  if (cart.length === 0) return showToast('Keranjang kosong!', 'error');

  const settings = getSettings();
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * (settings.taxRate / 100);
  const total = subtotal + tax;

  const receipt = `
${settings.businessName || 'Warung Bakso'}
${'='.repeat(32)}
${new Date().toLocaleString('id-ID')}
Kasir: ${JSON.parse(localStorage.getItem('currentUser')).username}
${'='.repeat(32)}
${cart.map(i => 
  `${i.name.padEnd(20)}\n${i.quantity}x @Rp${i.price.toLocaleString('id-ID').padStart(8)} = Rp${(i.price*i.quantity).toLocaleString('id-ID').padStart(10)}`
).join('\n')}
${'='.repeat(32)}
Subtotal: Rp ${subtotal.toLocaleString('id-ID').padStart(18)}
Pajak (${settings.taxRate}%): Rp ${tax.toLocaleString('id-ID').padStart(14)}
${'-'.repeat(32)}
TOTAL: Rp ${total.toLocaleString('id-ID').padStart(21)}
${'='.repeat(32)}
Terima kasih!
  `.trim();

  const printWin = window.open('', '', 'width=400,height=600');
  printWin.document.write(`
    <pre style="font-family: 'Courier New', monospace; font-size: 10pt; padding: 10px;">${receipt}</pre>
    <script>window.print(); setTimeout(() => window.close(), 500);</script>
  `);
}

// ==================== CETAK STRUK DARI DETAIL ====================
function printTransactionReceipt() {
  if (!currentDetailId) return showToast('Tidak ada transaksi dipilih!', 'error');

  const txn = getTransactions().find(t => t.id === currentDetailId);
  if (!txn) return showToast('Transaksi tidak ditemukan!', 'error');

  const settings = getSettings();

  const receipt = `
${settings.businessName || 'Warung Bakso'}
${'='.repeat(32)}
${new Date(txn.date).toLocaleString('id-ID')}
ID: ${txn.id}
Kasir: ${txn.cashier || 'Unknown'}
${'='.repeat(32)}
${txn.items.map(i => 
  `${i.name.padEnd(20)}\n${i.quantity}x @Rp${i.price.toLocaleString('id-ID').padStart(8)} = Rp${(i.price*i.quantity).toLocaleString('id-ID').padStart(10)}`
).join('\n')}
${'='.repeat(32)}
Subtotal: Rp ${txn.subtotal.toLocaleString('id-ID').padStart(18)}
Pajak (${settings.taxRate}%): Rp ${txn.tax.toLocaleString('id-ID').padStart(14)}
${'-'.repeat(32)}
TOTAL: Rp ${txn.total.toLocaleString('id-ID').padStart(21)}
${'='.repeat(32)}
Terima kasih! Struk ini adalah bukti sah.
  `.trim();

  const printWin = window.open('', '', 'width=400,height=600');
  printWin.document.write(`
    <pre style="font-family: 'Courier New', monospace; font-size: 10pt; padding: 10px; line-height: 1.4;">${receipt}</pre>
    <script>
      window.print();
      setTimeout(() => window.close(), 800);
    </script>
  `);

  addActivityLog({ activity: `Struk dicetak ulang: ${txn.id}` });
  showToast('Struk sedang dicetak...', 'info');
}

// ==================== TRANSAKSI TAHAN ====================
function holdTransaction() {
  if (cart.length === 0) return showToast('Keranjang kosong!', 'error');
  if (!confirm('Tahan transaksi ini?')) return;

  const held = {
    id: generateId('HOLD'),
    cart: [...cart],
    timestamp: new Date().toISOString(),
    subtotal: cart.reduce((s, i) => s + i.price * i.quantity, 0)
  };

  heldTransactions.push(held);
  localStorage.setItem('heldTransactions', JSON.stringify(heldTransactions));

  cart = [];
  updateCartDisplay();
  loadHeldTransactions();
  showToast('Transaksi ditahan', 'info');
}

function loadHeldTransactions() {
  heldTransactions = JSON.parse(localStorage.getItem('heldTransactions') || '[]');
  const container = document.getElementById('held-list');
  container.innerHTML = heldTransactions.length
    ? heldTransactions.map(h => `
        <div class="border p-2 rounded text-xs flex justify-between items-center">
          <div>
            <div class="font-medium">${h.id}</div>
            <div class="text-gray-600">${new Date(h.timestamp).toLocaleTimeString('id-ID')}</div>
            <div>Rp ${h.subtotal.toLocaleString('id-ID')}</div>
          </div>
          <div class="flex gap-1">
            <button onclick="resumeHeld('${h.id}')" class="text-green-600 hover:underline">Lanjut</button>
            <button onclick="deleteHeld('${h.id}')" class="text-red-600 hover:underline">Hapus</button>
          </div>
        </div>
      `).join('')
    : '<p class="text-center text-gray-500 text-xs">Tidak ada transaksi ditahan</p>';
}

function resumeHeld(id) {
  const held = heldTransactions.find(h => h.id === id);
  if (!held) return;

  cart = [...held.cart];
  heldTransactions = heldTransactions.filter(h => h.id !== id);
  localStorage.setItem('heldTransactions', JSON.stringify(heldTransactions));

  updateCartDisplay();
  loadHeldTransactions();
  showToast('Transaksi dilanjutkan', 'success');
}

function deleteHeld(id) {
  if (!confirm('Hapus transaksi ditahan?')) return;
  heldTransactions = heldTransactions.filter(h => h.id !== id);
  localStorage.setItem('heldTransactions', JSON.stringify(heldTransactions));
  loadHeldTransactions();
  showToast('Transaksi dihapus', 'info');
}

function clearAllHeld() {
  if (heldTransactions.length === 0 || !confirm('Hapus semua transaksi ditahan?')) return;
  heldTransactions = [];
  localStorage.removeItem('heldTransactions');
  loadHeldTransactions();
  showToast('Semua transaksi ditahan dihapus', 'info');
}

// ==================== RIWAYAT & STATISTIK ====================
function loadTodayStats() {
  const today = new Date().toDateString();
  const transactions = getTransactions().filter(t => new Date(t.date).toDateString() === today);

  document.getElementById('today-count').textContent = transactions.length;
  document.getElementById('today-revenue').textContent = `Rp ${transactions.reduce((s, t) => s + t.total, 0).toLocaleString('id-ID')}`;
}

function loadTransactionHistory() {
  const transactions = getTransactions().slice(-10).reverse();
  const tbody = document.getElementById('transaction-history');
  tbody.innerHTML = transactions.map(t => `
    <tr>
      <td class="p-2">${t.id}</td>
      <td class="p-2 text-xs">${new Date(t.date).toLocaleTimeString('id-ID')}</td>
      <td class="p-2 text-right font-medium">Rp ${t.total.toLocaleString('id-ID')}</td>
      <td class="p-2 text-center">
        <button onclick="showDetail('${t.id}')" class="text-xs text-blue-600 hover:underline">Detail</button>
      </td>
    </tr>
  `).join('');
}

// ==================== MODAL & RETUR ====================
function showDetail(id) {
  currentDetailId = id;
  const txn = getTransactions().find(t => t.id === id);
  if (!txn) return;

  const items = txn.items.map(i => 
    `<div class="flex justify-between text-sm"><span>${i.name} x${i.quantity}</span><span>Rp ${(i.price*i.quantity).toLocaleString('id-ID')}</span></div>`
  ).join('');

  document.getElementById('detail-content').innerHTML = `
    <div class="space-y-2 text-sm">
      <div class="flex justify-between"><strong>ID:</strong> <span>${txn.id}</span></div>
      <div class="flex justify-between"><strong>Waktu:</strong> <span>${new Date(txn.date).toLocaleString('id-ID')}</span></div>
      <div class="flex justify-between"><strong>Kasir:</strong> <span>${txn.cashier || '-'}</span></div>
      <div class="border-t pt-2 mt-2"><strong>Item:</strong></div>
      ${items}
      <div class="border-t pt-2 mt-2">
        <div class="flex justify-between"><span>Subtotal</span><span>Rp ${txn.subtotal.toLocaleString('id-ID')}</span></div>
        <div class="flex justify-between"><span>Pajak</span><span>Rp ${txn.tax.toLocaleString('id-ID')}</span></div>
        <div class="flex justify-between font-bold text-green-600"><span>Total</span><span>Rp ${txn.total.toLocaleString('id-ID')}</span></div>
      </div>
    </div>
  `;

  document.getElementById('detail-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('detail-modal').classList.add('hidden');
  currentDetailId = null;
}

function returTransaction() {
  if (!currentDetailId || !confirm('Lakukan retur transaksi ini? Stok akan dikembalikan.')) return;

  const txn = getTransactions().find(t => t.id === currentDetailId);
  if (!txn) return;

  txn.items.forEach(i => updateStock(i.code, i.quantity, 'Retur'));
  saveTransactions(getTransactions().filter(t => t.id !== currentDetailId));
  addActivityLog({ activity: `Retur: ${currentDetailId}` });

  closeModal();
  loadTransactionHistory();
  loadTodayStats();
  showToast('Retur berhasil', 'success');
}

// ==================== STOK ====================
function updateStock(code, qty, reason) {
  const products = getProducts();
  const product = products.find(p => p.code === code);
  if (!product) return;

  const oldStock = product.stock;
  product.stock += qty;
  if (product.stock < 0) product.stock = 0;

  saveProducts(products);
  addStockHistory({ code, name: product.name, quantity: qty, reason, afterStock: product.stock });

  // Update tampilan produk jika sedang ditampilkan
  const productCards = document.querySelectorAll(`[onclick="addToCart('${code}')"]`);
  productCards.forEach(card => {
    const stockEl = card.querySelector('p:last-child');
    if (stockEl) stockEl.textContent = `Stok: ${product.stock}`;
    if (product.stock === 0) card.style.opacity = '0.5';
  });
}

// ==================== UTIL ====================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}