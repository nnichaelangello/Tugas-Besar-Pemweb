document.addEventListener('DOMContentLoaded', () => {
    checkAuth('admin');
    setActiveNav();
    loadProducts();
    formatPriceInput(document.getElementById('product-price'));
    document.getElementById('filter-category').addEventListener('change', loadProducts);
    document.getElementById('sort-by').addEventListener('change', loadProducts);
  });
  
  function loadProducts() {
    const products = getProducts();
    const productTable = document.getElementById('product-table');
    const filterCategory = document.getElementById('filter-category').value;
    const sortBy = document.getElementById('sort-by').value;
  
    let filteredProducts = filterCategory ? products.filter(p => p.category === filterCategory) : products;
    filteredProducts.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'stock') return a.stock - b.stock;
      return 0;
    });
  
    productTable.innerHTML = '';
    filteredProducts.forEach(product => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.code}</td>
        <td>${product.name}</td>
        <td>Rp ${product.price.toLocaleString('id-ID')}</td>
        <td>${product.stock}${product.stock < 10 ? '<span class="text-red-500"> (Stok Rendah)</span>' : ''}</td>
        <td>${product.category}</td>
        <td>
          <button onclick="editProduct('${product.code}')" class="bg-yellow-500 text-white p-1 rounded">Edit</button>
          <button onclick="deleteProduct('${product.code}')" class="bg-red-500 text-white p-1 rounded">Hapus</button>
        </td>
      `;
      productTable.appendChild(row);
    });
  }
  
  function addProduct() {
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
    const existingProduct = products.find(p => p.code === code);
  
    if (existingProduct) {
      if (!confirm('Produk dengan kode ini sudah ada. Apakah Anda yakin ingin mengedit produk ini?')) return;
      // Update produk
      products.forEach(p => {
        if (p.code === code) {
          p.name = name;
          p.price = price;
          p.stock = stock;
          p.category = category;
        }
      });
      saveProducts(products);
      addActivityLog({ activity: `Produk diedit: ${name}` });
      showToast(`Berhasil mengedit ${name}`);
    } else {
      if (!confirm('Apakah Anda yakin ingin menambahkan produk ini?')) return;
      products.push({ code, name, price, stock, category });
      saveProducts(products);
      addActivityLog({ activity: `Produk ditambahkan: ${name}` });
      showToast(`Berhasil menambahkan ${name}`);
    }
  
    loadProducts();
    document.getElementById('product-code').value = '';
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-stock').value = '';
  }
  
  function editProduct(code) {
    if (!confirm('Apakah Anda yakin ingin mengedit produk ini?')) return;
    const products = getProducts();
    const product = products.find(p => p.code === code);
    if (product) {
      document.getElementById('product-code').value = product.code;
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-price').value = product.price.toLocaleString('id-ID');
      document.getElementById('product-stock').value = product.stock;
      document.getElementById('product-category').value = product.category;
    }
  }
  
  function deleteProduct(code) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    const products = getProducts();
    const product = products.find(p => p.code === code);
    saveProducts(products.filter(p => p.code !== code));
    addActivityLog({ activity: `Produk dihapus: ${product.name}` });
    showToast(`Berhasil menghapus ${product.name}`);
    loadProducts();
  }