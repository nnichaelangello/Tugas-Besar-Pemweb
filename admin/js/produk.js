let chartCategory = null;
let chartStock = null;
let editMode = false;
let editCode = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth('admin');
  setActiveNav();
  loadProducts();
  formatPriceInput(document.getElementById('product-price'));
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('filter-category').addEventListener('change', applyFilters);
  document.getElementById('filter-stock').addEventListener('change', applyFilters);
  document.getElementById('search-name').addEventListener('input', debounce(applyFilters, 300));
  document.getElementById('sort-by').addEventListener('change', applyFilters);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function loadProducts() {
  const products = getProducts();
  renderProductTable(products);
  renderCharts(products);
  document.getElementById('total-products').textContent = products.length;
}

function applyFilters() {
  const products = getProducts();
  const cat = document.getElementById('filter-category').value;
  const stockFilter = document.getElementById('filter-stock').value;
  const search = document.getElementById('search-name').value.toLowerCase();
  const sort = document.getElementById('sort-by').value;

  let filtered = products.filter(p => {
    if (cat && p.category !== cat) return false;
    if (stockFilter === 'low' && p.stock >= 10) return false;
    if (stockFilter === 'medium' && (p.stock < 10 || p.stock > 30)) return false;
    if (stockFilter === 'high' && p.stock <= 30) return false;
    if (search && !p.name.toLowerCase().includes(search)) return false;
    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sort === 'name-asc') return a.name.localeCompare(b.name);
    if (sort === 'name-desc') return b.name.localeCompare(a.name);
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'stock-asc') return a.stock - b.stock;
    if (sort === 'stock-desc') return b.stock - a.stock;
    return 0;
  });

  renderProductTable(filtered);
}

function renderProductTable(products) {
  const tbody = document.getElementById('product-table');
  tbody.innerHTML = products.length
    ? products.map(p => {
        const status = p.stock === 0 ? 'Habis' : p.stock < 10 ? 'Rendah' : p.stock < 30 ? 'Sedang' : 'Aman';
        const statusColor = p.stock === 0 ? 'text-red-700 bg-red-100' : p.stock < 10 ? 'text-orange-700 bg-orange-100' : p.stock < 30 ? 'text-yellow-700 bg-yellow-100' : 'text-green-700 bg-green-100';

        return `
          <tr class="hover:bg-gray-50 border-b">
            <td class="p-3 font-mono text-sm">${p.code}</td>
            <td class="p-3 font-medium">${p.name}</td>
            <td class="p-3">Rp ${p.price.toLocaleString('id-ID')}</td>
            <td class="p-3 text-center font-semibold">${p.stock}</td>
            <td class="p-3"><span class="px-2 py-1 text-xs rounded-full bg-gray-200">${p.category}</span></td>
            <td class="p-3 text-center"><span class="px-2 py-1 text-xs rounded-full ${statusColor}">${status}</span></td>
            <td class="p-3 text-center space-x-1">
              <button onclick="startEdit('${p.code}')" class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200">Edit</button>
              <button onclick="deleteProduct('${p.code}')" class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Hapus</button>
            </td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="7" class="p-8 text-center text-gray-500">Tidak ada produk ditemukan</td></tr>';
}

function startEdit(code) {
  const product = getProducts().find(p => p.code === code);
  if (!product) return;

  editMode = true;
  editCode = code;
  document.getElementById('form-title').textContent = 'Edit Produk';
  document.getElementById('product-code').value = product.code;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-price').value = product.price.toLocaleString('id-ID');
  document.getElementById('product-stock').value = product.stock;
  document.getElementById('product-category').value = product.category;
  document.getElementById('save-btn').textContent = 'Update';
  document.getElementById('cancel-btn').classList.remove('hidden');

  document.getElementById('product-code').setAttribute('readonly', true);
  document.getElementById('product-code').classList.add('bg-gray-100');
}

function cancelEdit() {
  editMode = false;
  editCode = null;
  resetForm();
}

function resetForm() {
  document.getElementById('form-title').textContent = 'Tambah Produk Baru';
  document.getElementById('product-code').value = '';
  document.getElementById('product-name').value = '';
  document.getElementById('product-price').value = '';
  document.getElementById('product-stock').value = '';
  document.getElementById('product-category').value = '';
  document.getElementById('save-btn').textContent = 'Simpan';
  document.getElementById('cancel-btn').classList.add('hidden');

  document.getElementById('product-code').removeAttribute('readonly');
  document.getElementById('product-code').classList.remove('bg-gray-100');
}

function saveProduct() {
  const code = document.getElementById('product-code').value.trim();
  const name = document.getElementById('product-name').value.trim();
  const price = parseInt(document.getElementById('product-price').value.replace(/\D/g, ''));
  const stock = parseInt(document.getElementById('product-stock').value);
  const category = document.getElementById('product-category').value;

  if (!code || !name || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0 || !category) {
    showToast('Isi semua kolom dengan benar!', 'error');
    return;
  }

  const products = getProducts();
  const existingIndex = products.findIndex(p => p.code === code);

  if (editMode) {
    if (existingIndex === -1) return showToast('Produk tidak ditemukan!', 'error');
    if (!confirm('Yakin ingin mengupdate produk ini?')) return;

    const oldProduct = products[existingIndex];
    products[existingIndex] = { code, name, price, stock, category };
    saveProducts(products);
    addActivityLog({ activity: `Produk diupdate: ${name} (dari ${oldProduct.name})` });
    showToast(`Berhasil mengupdate ${name}`);
  } else {
    if (existingIndex !== -1) return showToast('Kode produk sudah ada!', 'error');
    if (!confirm('Yakin ingin menambahkan produk baru?')) return;

    products.push({ code, name, price, stock, category });
    saveProducts(products);
    addActivityLog({ activity: `Produk ditambahkan: ${name}` });
    showToast(`Berhasil menambahkan ${name}`);
  }

  resetForm();
  editMode = false;
  editCode = null;
  loadProducts();
  applyFilters();
}

function deleteProduct(code) {
  if (!confirm('Yakin ingin menghapus produk ini? Semua riwayat stok & transaksi tetap tersimpan.')) return;

  const products = getProducts();
  const product = products.find(p => p.code === code);
  if (!product) return;

  saveProducts(products.filter(p => p.code !== code));
  addActivityLog({ activity: `Produk dihapus: ${product.name}` });
  showToast(`Berhasil menghapus ${product.name}`);
  loadProducts();
  applyFilters();
}

// ==================== GRAFIK ====================
function renderCharts(products) {
  const ctxCat = document.getElementById('category-chart').getContext('2d');
  const ctxStock = document.getElementById('stock-chart').getContext('2d');

  const catCount = {};
  const catStock = {};
  products.forEach(p => {
    catCount[p.category] = (catCount[p.category] || 0) + 1;
    catStock[p.category] = (catStock[p.category] || 0) + p.stock;
  });

  const labels = Object.keys(catCount);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // DATASET UNTUK CHART KATEGORI (Doughnut)
  const categoryDataset = {
    data: Object.values(catCount),
    backgroundColor: colors
  };

  // DATASET UNTUK CHART STOK (Bar)
  const stockDataset = {
    label: 'Total Stok',
    data: Object.values(catStock),
    backgroundColor: colors.map(c => c + '80')
  };

  // Chart Kategori
  if (chartCategory) chartCategory.destroy();
  chartCategory = new Chart(ctxCat, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [categoryDataset]  // HARUS ADA OBJEK DI DALAM ARRAY!
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });

  // Chart Stok
  if (chartStock) chartStock.destroy();
  chartStock = new Chart(ctxStock, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [stockDataset]  // HARUS ADA OBJEK DI DALAM ARRAY!
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: false } }
    }
  });
}

// ==================== EKSPOR ====================
function exportProductsCSV() {
  const products = getProducts();
  const csv = [
    'Kode,Nama,Harga,Stok,Kategori',
    ...products.map(p => `${p.code},${p.name},${p.price},${p.stock},${p.category}`)
  ].join('\n');
  downloadFile(csv, 'daftar-produk.csv', 'text/csv');
}

function exportProductsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(16);
  doc.text('Daftar Produk - Warung Bakso', 105, y, { align: 'center' });
  y += 15;

  const products = getProducts();
  products.forEach(p => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.text(`${p.code} | ${p.name} | Rp ${p.price.toLocaleString('id-ID')} | Stok: ${p.stock} | ${p.category}`, 10, y);
    y += 8;
  });

  doc.save('daftar-produk.pdf');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}