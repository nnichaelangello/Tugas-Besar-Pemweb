function checkAuth(roleRequired) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== roleRequired) {
      window.location.href = '../index.html';
    }
    return user;
  }
  
  function logout() {
    addActivityLog({ activity: `Logout: ${JSON.parse(localStorage.getItem('currentUser')).username}` });
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
  }
  
  function setActiveNav() {
    const currentPath = window.location.pathname.split('/').pop();
    document.querySelectorAll('#navbar-menu a').forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('navbar-active');
      } else {
        link.classList.remove('navbar-active');
      }
    });
  }
  
  function translate(text, lang) {
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
      },
    };
    return translations[lang][text] || text;
  }
  
  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.style.display = 'none';
        toast.style.opacity = '1';
      }, 300);
    }, 2000);
  }
  
  function formatPriceInput(input) {
    input.addEventListener('input', () => {
      let value = input.value.replace(/\D/g, '');
      if (value) {
        value = parseInt(value).toLocaleString('id-ID');
        input.value = value;
      }
    });
  }