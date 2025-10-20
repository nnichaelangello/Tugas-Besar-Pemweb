document.addEventListener('DOMContentLoaded', () => {
    checkAuth('admin');
    setActiveNav();
    loadStockProducts();
    loadStockHistory();
  });
  
  function loadStockProducts() {
    const products = getProducts();
    const stockProduct = document.getElementById('stock-product');
    stockProduct.innerHTML = '<option value="">Pilih Produk</option>';
    products.forEach(product => {
      const option = document.createElement('option');
      option.value = product.code;
      option.textContent = `${product.name} (${product.code})`;
      stockProduct.appendChild(option);
    });
  }
  
  function loadStockHistory() {
    const history = getStockHistory();
    const stockHistory = document.getElementById('stock-history');
    stockHistory.innerHTML = '';
    history.forEach(entry => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${entry.timestamp}</td>
        <td>${entry.name} (${entry.code})</td>
        <td>${entry.quantity > 0 ? '+' : ''}${entry.quantity}</td>
        <td>${entry.reason}</td>
      `;
      stockHistory.appendChild(row);
    });
  }
  
  function adjustStock() {
    const code = document.getElementById('stock-product').value;
    const quantity = parseInt(document.getElementById('stock-quantity').value);
    const reason = document.getElementById('stock-reason').value.trim();
  
    if (!code || isNaN(quantity) || !reason) {
      showToast('Isi semua kolom dengan benar!', 'error');
      return;
    }
  
    if (!confirm(`Apakah Anda yakin ingin menyesuaikan stok sebanyak ${quantity} untuk produk ini?`)) return;
  
    const products = getProducts();
    const product = products.find(p => p.code === code);
    if (product && (product.stock + quantity >= 0)) {
      product.stock += quantity;
      saveProducts(products);
      addStockHistory({ code, name: product.name, quantity, reason });
      addActivityLog({ activity: `Stok disesuaikan: ${product.name}, ${quantity}, ${reason}` });
      showToast(`Berhasil menyesuaikan stok ${product.name}`);
      loadStockHistory();
      document.getElementById('stock-product').value = '';
      document.getElementById('stock-quantity').value = '';
      document.getElementById('stock-reason').value = '';
    } else {
      showToast('Stok tidak cukup atau input tidak valid!', 'error');
    }
  }
  
  function exportStockHistory() {
    const history = getStockHistory();
    const csv = [
      'Waktu,Produk,Jumlah,Alasan',
      ...history.map(h => `${h.timestamp},${h.name} (${h.code}),${h.quantity},${h.reason}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'riwayat-stok.csv');
    a.click();
  }