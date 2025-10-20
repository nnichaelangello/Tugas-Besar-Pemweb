document.addEventListener('DOMContentLoaded', () => {
    checkAuth('admin');
    setActiveNav();
    loadProducts();
    loadCart();
    loadTransactions();
  });
  
  let cart = [];
  function loadProducts() {
    const products = getProducts();
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
  
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'bg-gray-100 p-4 rounded shadow';
      card.innerHTML = `
        <h3 class="font-semibold">${product.name}</h3>
        <p>Kode: ${product.code}</p>
        <p>Harga: Rp ${product.price.toLocaleString('id-ID')}</p>
        <p>Stok: ${product.stock}${product.stock < 10 ? '<span class="text-red-500"> (Stok Rendah)</span>' : ''}</p>
        <button onclick="addToCart('${product.code}')" class="bg-blue-500 text-white p-2 rounded mt-2">Tambah ke Keranjang</button>
      `;
      productList.appendChild(card);
    });
  
    document.getElementById('search-product').addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      productList.innerHTML = '';
      products
        .filter(p => p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search))
        .forEach(product => {
          const card = document.createElement('div');
          card.className = 'bg-gray-100 p-4 rounded shadow';
          card.innerHTML = `
            <h3 class="font-semibold">${product.name}</h3>
            <p>Kode: ${product.code}</p>
            <p>Harga: Rp ${product.price.toLocaleString('id-ID')}</p>
            <p>Stok: ${product.stock}${product.stock < 10 ? '<span class="text-red-500"> (Stok Rendah)</span>' : ''}</p>
            <button onclick="addToCart('${product.code}')" class="bg-blue-500 text-white p-2 rounded mt-2">Tambah ke Keranjang</button>
          `;
          productList.appendChild(card);
        });
    });
  }
  
  function addToCart(code) {
    const products = getProducts();
    const product = products.find(p => p.code === code);
    if (product && product.stock > 0) {
      const cartItem = cart.find(item => item.code === product.code);
      if (cartItem) {
        cartItem.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      updateStock(code, -1, 'Tambah ke keranjang');
      showToast(`Berhasil menambah ${product.name} ke keranjang`);
      loadCart();
    } else {
      showToast('Stok tidak cukup!', 'error');
    }
  }
  
  function loadCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    cartItems.innerHTML = '';
    let total = 0;
  
    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>Rp ${item.price.toLocaleString('id-ID')}</td>
        <td>${item.quantity}</td>
        <td>Rp ${itemTotal.toLocaleString('id-ID')}</td>
        <td><button onclick="removeFromCart('${item.code}')" class="bg-red-500 text-white p-1 rounded">Hapus</button></td>
      `;
      cartItems.appendChild(row);
    });
  
    const settings = getSettings();
    const tax = total * (settings.taxRate / 100);
    cartTotal.textContent = (total + tax).toLocaleString('id-ID');
  }
  
  function removeFromCart(code) {
    if (!confirm('Apakah Anda yakin ingin menghapus item ini dari keranjang?')) return;
    const item = cart.find(i => i.code === code);
    if (item) {
      updateStock(code, item.quantity, 'Hapus dari keranjang');
      cart = cart.filter(i => i.code !== code);
      showToast(`Berhasil menghapus ${item.name} dari keranjang`);
      loadCart();
    }
  }
  
  function checkout() {
    if (cart.length === 0) {
      showToast('Keranjang kosong!', 'error');
      return;
    }
    if (!confirm('Apakah Anda yakin ingin menyelesaikan transaksi ini?')) return;
    const transactions = getTransactions();
    const settings = getSettings();
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = total * (settings.taxRate / 100);
    const transactionId = 'TRX' + (transactions.length + 1).toString().padStart(4, '0');
    transactions.push({
      id: transactionId,
      date: new Date().toLocaleString('id-ID'),
      items: [...cart],
      total: total + tax,
    });
    saveTransactions(transactions);
    addActivityLog({ activity: `Transaksi selesai: ${transactionId}` });
    cart = [];
    loadCart();
    loadTransactions();
    showToast('Transaksi selesai!');
  }
  
  function printReceipt() {
    if (cart.length === 0) {
      showToast('Keranjang kosong!', 'error');
      return;
    }
    const settings = getSettings();
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = total * (settings.taxRate / 100);
    const receipt = `
      Warung Bakso\n
      Tanggal: ${new Date().toLocaleString('id-ID')}\n
      --------------------------\n
      ${cart.map(item => `${item.name} x${item.quantity}: Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`).join('\n')}
      --------------------------\n
      Subtotal: Rp ${total.toLocaleString('id-ID')}\n
      Pajak (${settings.taxRate}%): Rp ${tax.toLocaleString('id-ID')}\n
      Total: Rp ${(total + tax).toLocaleString('id-ID')}
    `;
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <pre style="font-family: monospace; padding: 20px;">${receipt}</pre>
      <script>window.print(); window.close();</script>
    `);
  }
  
  function updateStock(code, quantity, reason) {
    const products = getProducts();
    const product = products.find(p => p.code === code);
    if (product) {
      product.stock += quantity;
      saveProducts(products);
      addStockHistory({ code, name: product.name, quantity, reason });
      loadProducts();
    }
  }
  
  function loadTransactions() {
    const transactions = getTransactions();
    const transactionHistory = document.getElementById('transaction-history');
    transactionHistory.innerHTML = '';
    transactions.forEach(txn => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${txn.id}</td>
        <td>${txn.date}</td>
        <td>Rp ${txn.total.toLocaleString('id-ID')}</td>
        <td><button onclick="cancelTransaction('${txn.id}')" class="bg-red-500 text-white p-1 rounded">Batalkan</button></td>
      `;
      transactionHistory.appendChild(row);
    });
  }
  
  function cancelTransaction(id) {
    if (!confirm('Apakah Anda yakin ingin membatalkan transaksi ini?')) return;
    const transactions = getTransactions();
    const txn = transactions.find(t => t.id === id);
    if (txn) {
      txn.items.forEach(item => updateStock(item.code, item.quantity, 'Pembatalan transaksi'));
      saveTransactions(transactions.filter(t => t.id !== id));
      addActivityLog({ activity: `Transaksi dibatalkan: ${id}` });
      showToast(`Transaksi ${id} dibatalkan`);
      loadTransactions();
    }
  }