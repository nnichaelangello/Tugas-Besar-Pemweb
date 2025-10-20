document.addEventListener('DOMContentLoaded', () => {
    checkAuth('admin');
    setActiveNav();
    loadUsers();
  });
  
  function loadUsers() {
    const users = getUsers();
    const userTable = document.getElementById('user-table');
    userTable.innerHTML = '';
    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.username}</td>
        <td>${user.role}</td>
        <td>
          <button onclick="editUser('${user.username}')" class="bg-yellow-500 text-white p-1 rounded">Edit</button>
          <button onclick="deleteUser('${user.username}')" class="bg-red-500 text-white p-1 rounded">Hapus</button>
        </td>
      `;
      userTable.appendChild(row);
    });
  }
  
  function addUser() {
    const username = document.getElementById('user-username').value.trim();
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
  
    if (!username || !password || !role) {
      showToast('Isi semua kolom!', 'error');
      return;
    }
  
    const users = getUsers();
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      if (!confirm('Pengguna sudah ada. Apakah Anda yakin ingin mengedit pengguna ini?')) return;
      saveUsers(users.map(u => u.username === username ? { username, password, role } : u));
      addActivityLog({ activity: `Pengguna diedit: ${username}` });
      showToast(`Berhasil mengedit ${username}`);
    } else {
      if (!confirm('Apakah Anda yakin ingin menambahkan pengguna ini?')) return;
      users.push({ username, password, role });
      saveUsers(users);
      addActivityLog({ activity: `Pengguna ditambahkan: ${username}` });
      showToast(`Berhasil menambahkan ${username}`);
    }
  
    loadUsers();
    document.getElementById('user-username').value = '';
    document.getElementById('user-password').value = '';
  }
  
  function editUser(username) {
    if (!confirm('Apakah Anda yakin ingin mengedit pengguna ini?')) return;
    const users = getUsers();
    const user = users.find(u => u.username === username);
    if (user) {
      document.getElementById('user-username').value = user.username;
      document.getElementById('user-password').value = user.password;
      document.getElementById('user-role').value = user.role;
    }
  }
  
  function deleteUser(username) {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;
    const users = getUsers();
    saveUsers(users.filter(u => u.username !== username));
    addActivityLog({ activity: `Pengguna dihapus: ${username}` });
    showToast(`Berhasil menghapus ${username}`);
    loadUsers();
  }