document.addEventListener('DOMContentLoaded', () => {
    checkAuth('admin');
    setActiveNav();
    loadSettings();
  });
  
  function loadSettings() {
    const settings = getSettings();
    document.getElementById('tax-rate').value = settings.taxRate;
    document.getElementById('language').value = settings.language;
  }
  
  function saveSettings() {
    const taxRate = parseInt(document.getElementById('tax-rate').value);
    const language = document.getElementById('language').value;
  
    if (isNaN(taxRate) || taxRate < 0 || !language) {
      showToast('Masukkan nilai yang valid!', 'error');
      return;
    }
  
    if (!confirm('Apakah Anda yakin ingin menyimpan pengaturan ini?')) return;
  
    saveSettings({ taxRate, language });
    addActivityLog({ activity: `Pengaturan disimpan: Pajak ${taxRate}%, Bahasa ${language}` });
    showToast('Pengaturan disimpan!');
  }
  
  function exportData() {
    if (!confirm('Apakah Anda yakin ingin mengekspor semua data?')) return;
    const data = {
      products: getProducts(),
      users: getUsers(),
      transactions: getTransactions(),
      stockHistory: getStockHistory(),
      activityLog: getActivityLog(),
      settings: getSettings(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'backup-data.json');
    a.click();
    addActivityLog({ activity: 'Data diekspor ke JSON' });
    showToast('Data berhasil diekspor!');
  }