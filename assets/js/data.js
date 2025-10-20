function initializeData() {
    if (!localStorage.getItem('products')) {
      const initialProducts = [
        { code: 'B001', name: 'Bakso Biasa', price: 15000, stock: 100, category: 'Makanan' },
        { code: 'B002', name: 'Bakso Urat', price: 20000, stock: 50, category: 'Makanan' },
        { code: 'M001', name: 'Es Teh', price: 5000, stock: 200, category: 'Minuman' },
      ];
      localStorage.setItem('products', JSON.stringify(initialProducts));
    }
    if (!localStorage.getItem('users')) {
      const initialUsers = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'kasir1', password: 'kasir123', role: 'kasir' },
      ];
      localStorage.setItem('users', JSON.stringify(initialUsers));
    }
    if (!localStorage.getItem('transactions')) {
      localStorage.setItem('transactions', JSON.stringify([]));
    }
    if (!localStorage.getItem('settings')) {
      localStorage.setItem('settings', JSON.stringify({ taxRate: 10, language: 'id' }));
    }
    if (!localStorage.getItem('activityLog')) {
      localStorage.setItem('activityLog', JSON.stringify([]));
    }
    if (!localStorage.getItem('stockHistory')) {
      localStorage.setItem('stockHistory', JSON.stringify([]));
    }
  }
  
  function getProducts() {
    return JSON.parse(localStorage.getItem('products')) || [];
  }
  
  function saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
  }
  
  function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
  }
  
  function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
  }
  
  function getTransactions() {
    return JSON.parse(localStorage.getItem('transactions')) || [];
  }
  
  function saveTransactions(transactions) {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }
  
  function getSettings() {
    return JSON.parse(localStorage.getItem('settings')) || { taxRate: 10, language: 'id' };
  }
  
  function saveSettings(settings) {
    localStorage.setItem('settings', JSON.stringify(settings));
  }
  
  function getActivityLog() {
    return JSON.parse(localStorage.getItem('activityLog')) || [];
  }
  
  function addActivityLog(activity) {
    const logs = getActivityLog();
    logs.push({ ...activity, timestamp: new Date().toLocaleString('id-ID') });
    localStorage.setItem('activityLog', JSON.stringify(logs));
  }
  
  function getStockHistory() {
    return JSON.parse(localStorage.getItem('stockHistory')) || [];
  }
  
  function addStockHistory(entry) {
    const history = getStockHistory();
    history.push({ ...entry, timestamp: new Date().toLocaleString('id-ID') });
    localStorage.setItem('stockHistory', JSON.stringify(history));
  }
  
  initializeData();