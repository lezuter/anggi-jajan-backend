// File: /public/js/payment.js (VERSI FINAL & LENGKAP)

document.addEventListener('DOMContentLoaded', () => {
    // --- DEKLARASI ELEMEN ---
    const tableBody = document.getElementById('paymentTableBody');
    const addMethodBtn = document.querySelector('.payment-management #addMethodBtn');
    const reorderGroupBtn = document.querySelector('.payment-management #reorderGroupBtn');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const limitSelect = document.getElementById('limitSelect');
    const paginationControls = document.getElementById('paginationControls');
    const paymentModal = document.getElementById('paymentModal');
    const paymentForm = document.getElementById('paymentForm');
    const modalTitle = document.getElementById('paymentModalTitle');
    const closeModalBtn = paymentModal.querySelector('.modal__close-btn');
    const codeInput = document.getElementById('code');
    const feeInput = document.getElementById('fee');

    // Variabel yang hilang, sekarang sudah ada
    const isActiveCheckbox = document.getElementById('is_active');
    const toggleStatusText = document.getElementById('toggle-status-text');
    const reorderModal = document.getElementById('reorderGroupModal');
    const closeReorderModalBtn = reorderModal.querySelector('.modal__close-btn');
    const saveOrderBtn = document.getElementById('saveOrderBtn');
    const sortableList = document.getElementById('sortable-group-list');

    // --- STATE ---
    let allMethods = [];
    let currentPage = 1;
    let limit = 25;

    // Cek elemen penting
    if (!tableBody || !addMethodBtn || !paymentModal || !reorderModal) {
        console.error("Elemen penting di halaman Payment tidak ditemukan!");
        return;
    }

    // --- FUNGSI-FUNGSI ---
    async function loadPaymentMethods() {
        try {
            // PERBAIKAN #1: Tambahkan parameter page & limit
            const response = await fetch(`/api/payment-methods?page=${currentPage}&limit=${limit}`);
            const result = await response.json();
            if (result.success) {
                allMethods = result.data;
                renderTable(allMethods);
                renderPagination(result.pagination);
                updateBulkActionUI();
            }
        } catch (error) { console.error('Error memuat metode pembayaran:', error); }
    }

    const renderTable = (methods) => {
        tableBody.innerHTML = '';
        methods.forEach(method => {
            const row = document.createElement('tr');
            row.dataset.id = method.id;
            const statusBadge = method.is_active ? `<span class="status-badge active">Aktif</span>` : `<span class="status-badge inactive">Nonaktif</span>`;
            row.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" value="${method.id}"></td>
                <td>${statusBadge}</td>
                <td><img src="${method.icon_url}" alt="${method.name}" class="table-img"></td>
                <td>${method.name}</td>
                <td>${method.code}</td>
                <td>${method.group_name}</td>
                <td>${method.fee}</td>
                <td>${method.display_order}</td>
                <td class="actions">
            <div class="action-buttons-container">
                <button class="btn btn-secondary btn-icon btn-edit" title="Edit">
                    <svg fill="currentColor" data-name="Livello 1" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path d="M64,39A25,25,0,1,0,89,64,25,25,0,0,0,64,39Zm0,44A19,19,0,1,1,83,64,19,19,0,0,1,64,83Z"/><path d="M121,48h-8.93a1,1,0,0,1-.94-.68,49.9,49.9,0,0,0-2-4.85,1,1,0,0,1,.18-1.15L115.62,35a7,7,0,0,0,0-9.9L102.89,12.38a7,7,0,0,0-9.9,0l-6.31,6.31a1,1,0,0,1-1.15-.18,49.76,49.76,0,0,0-4.85-2,1,1,0,0,1-.68-.94V7a7,7,0,0,0-7-7H55a7,7,0,0,0-7,7v8.93a1,1,0,0,1-.68.94,49.9,49.9,0,0,0-4.85,2,1,1,0,0,1-1.15-.18L35,12.38a7,7,0,0,0-9.9,0L12.38,25.11a7,7,0,0,0,0,9.9l6.31,6.31a1,1,0,0,1,.18,1.15,49.76,49.76,0,0,0-2,4.85,1,1,0,0,1-.94.68H7a7,7,0,0,0-7,7V73a7,7,0,0,0,7,7h8.93a1,1,0,0,1,.94.68,49.9,49.9,0,0,0,2,4.85,1,1,0,0,1-.18,1.15L12.38,93a7,7,0,0,0,0,9.9l12.73,12.73a7,7,0,0,0,9.9,0l6.31-6.31a1,1,0,0,1,1.15-.18,49.76,49.76,0,0,0,4.85,2,1,1,0,0,1,.68.94V121a7,7,0,0,0,7,7H73a7,7,0,0,0,7-7v-8.93a1,1,0,0,1,.68-.94,49.9,49.9,0,0,0,4.85-2,1,1,0,0,1,1.15.18L93,115.62a7,7,0,0,0,9.9,0l12.73-12.73a7,7,0,0,0,0-9.9l-6.31-6.31a1,1,0,0,1-.18-1.15,49.76,49.76,0,0,0,2-4.85,1,1,0,0,1,.94.68H121a7,7,0,0,0,7-7V55A7,7,0,0,0,121,48Zm1,25a1,1,0,0,1-1,1h-8.93a7,7,0,0,0-6.6,4.69,43.9,43.9,0,0,1-1.76,4.26,7,7,0,0,0,1.35,8l6.31,6.31a1,1,0,0,1,0,1.41L98.65,111.38a1,1,0,0,1-1.41,0l-6.31-6.31a7,7,0,0,0-8-1.35,43.88,43.88,0,0,1-4.27,1.76,7,7,0,0,0-4.68,6.6V121a1,1,0,0,1-1,1H55a1,1,0,0,1-1-1v-8.93a7,7,0,0,0-4.69-6.6,43.9,43.9,0,0,1-4.26-1.76,7,7,0,0,0-8,1.35l-6.31,6.31a1,1,0,0,1-1.41,0L16.62,98.65a1,1,0,0,1,0-1.41l6.31-6.31a7,7,0,0,0,1.35-8,43.88,43.88,0,0,1-1.76-4.27A7,7,0,0,0,15.93,74H7a1,1,0,0,1-1-1V55a1,1,0,0,1,1-1h8.93a7,7,0,0,0,6.6-4.69,43.9,43.9,0,0,1,1.76,4.26,7,7,0,0,0-1.35-8l-6.31-6.31a1,1,0,0,1,0-1.41L29.35,16.62a1,1,0,0,1,1.41,0l6.31,6.31a7,7,0,0,0,8,1.35,43.88,43.88,0,0,1,4.27-1.76A7,7,0,0,0,54,15.93V7a1,1,0,0,1,1-1H73a1,1,0,0,1,1,1v8.93a7,7,0,0,0,4.69,6.6,43.9,43.9,0,0,1,4.26,1.76,7,7,0,0,0,8-1.35l6.31-6.31a1,1,0,0,1,1.41,0l12.73,12.73a1,1,0,0,1,0,1.41l-6.31,6.31a7,7,0,0,0-1.35,8,43.88,43.88,0,0,1,1.76,4.27,7,7,0,0,0,6.6,4.68H121a1,1,0,0,1,1,1Z"/></svg>
                </button>
                <button class="btn btn-danger btn-icon btn-delete" title="Hapus">
                    <svg fill="currentColor" enable-background="new 0 0 40 40" viewBox="0 0 40 40" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><g><path d="M28,40H11.8c-3.3,0-5.9-2.7-5.9-5.9V16c0-0.6,0.4-1,1-1s1,0.4,1,1v18.1c0,2.2,1.8,3.9,3.9,3.9H28c2.2,0,3.9-1.8,3.9-3.9V16   c0-0.6,0.4-1,1-1s1,0.4,1,1v18.1C33.9,37.3,31.2,40,28,40z"/></g><g><path d="M33.3,4.9h-7.6C25.2,2.1,22.8,0,19.9,0s-5.3,2.1-5.8,4.9H6.5c-2.3,0-4.1,1.8-4.1,4.1S4.2,13,6.5,13h26.9   c2.3,0,4.1-1.8,4.1-4.1S35.6,4.9,33.3,4.9z M19.9,2c1.8,0,3.3,1.2,3.7,2.9h-7.5C16.6,3.2,18.1,2,19.9,2z M33.3,11H6.5   c-1.1,0-2.1-0.9-2.1-2.1c0-1.1,0.9-2.1,2.1-2.1h26.9c1.1,0,2.1,0.9,2.1,2.1C35.4,10.1,34.5,11,33.3,11z"/></g><g><path d="M12.9,35.1c-0.6,0-1-0.4-1-1V17.4c0-0.6,0.4-1,1-1s1,0.4,1,1v16.7C13.9,34.6,13.4,35.1,12.9,35.1z"/></g><g><path d="M26.9,35.1c-0.6,0-1-0.4-1-1V17.4c0-0.6,0.4-1,1-1s1,0.4,1,1v16.7C27.9,34.6,27.4,35.1,26.9,35.1z"/></g><g><path d="M19.9,35.1c-0.6,0-1-0.4-1-1V17.4c0-0.6,0.4-1,1-1s1,0.4,1,1v16.7C20.9,34.6,20.4,35.1,19.9,35.1z"/></g></svg>
                </button>
                </div>
            </td>
        `;
            tableBody.appendChild(row);
        });
    };

    function renderPagination(pagination) {
        paginationControls.innerHTML = '';

        if (!pagination || pagination.totalPages <= 1) return;

        for (let page = 1; page <= pagination.totalPages; page++) {
            const btn = document.createElement('button');
            btn.textContent = page;
            btn.classList.add('btn', 'btn-page');
            if (page === pagination.currentPage) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                currentPage = page;
                loadPaymentMethods();
            });

            paginationControls.appendChild(btn);
        }
    }

    // PERBAIKAN #2: Tambahkan fungsi yang hilang ini
    function updateBulkActionUI() {
        const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.style.display = checkedCheckboxes.length > 0 ? 'inline-flex' : 'none';
        }

        const allRowCheckboxes = document.querySelectorAll('.row-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = allRowCheckboxes.length > 0 && checkedCheckboxes.length === allRowCheckboxes.length;
        }
    }

    // --- EVENT LISTENERS ---
    if (limitSelect) {
        limitSelect.addEventListener('change', (e) => {
            limit = parseInt(e.target.value);
            currentPage = 1;
            loadPaymentMethods();
        });
    }
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = selectAllCheckbox.checked);
            updateBulkActionUI();
        });
    }
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', async () => {
            const idsToDelete = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.value);
            if (idsToDelete.length === 0) return alert('Pilih minimal satu item.');
            if (confirm(`Yakin ingin menghapus ${idsToDelete.length} item?`)) {
                try {
                    const response = await fetch('/api/payment-methods/bulk-delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: idsToDelete })
                    });
                    const result = await response.json();
                    alert(result.message);
                    if (result.success) loadPaymentMethods();
                } catch (error) { alert('Terjadi kesalahan.'); }
            }
        });
    }

    tableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-checkbox')) {
            updateBulkActionUI();
        }
    });

    const openModalForEdit = (id) => {
        const method = allMethods.find(m => m.id == id);
        if (!method) return;

        modalTitle.textContent = 'Edit Metode Pembayaran';
        paymentForm.formMode.value = 'edit';
        paymentForm.paymentId.value = method.id;
        paymentForm.name.value = method.name;
        paymentForm.code.value = method.code;
        paymentForm.fee.value = method.fee;
        paymentForm.group_name.value = method.group_name;
        paymentForm.icon_url.value = method.icon_url;
        paymentForm.is_active.checked = method.is_active;
        updateToggleStatusText();
        paymentModal.style.display = 'block';
    };

    // --- EVENT LISTENERS ---
    addMethodBtn.addEventListener('click', () => {
        paymentForm.reset();
        modalTitle.textContent = 'Tambah Metode Baru';
        paymentForm.formMode.value = 'add';
        paymentForm.is_active.checked = true;
        updateToggleStatusText();
        paymentModal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', () => {
        paymentModal.style.display = 'none';
    });

    tableBody.addEventListener('click', (e) => {
        const editButton = e.target.closest('.btn-edit');
        if (editButton) {
            const id = e.target.closest('tr').dataset.id;
            openModalForEdit(id);
        }
        // Logika untuk delete bisa ditambahkan di sini
    });

    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(paymentForm);
        const data = Object.fromEntries(formData.entries());
        data.is_active = paymentForm.is_active.checked; // Handle checkbox

        const mode = data.formMode;
        let url = '/api/payment-methods';
        let method = 'POST';

        if (mode === 'edit') {
            url = `/api/payment-methods/${data.paymentId}`;
            method = 'PUT';
        }

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            alert(result.message);
            if (result.success) {
                paymentModal.style.display = 'none';
                loadPaymentMethods();
            }
        } catch (error) {
            alert('Terjadi kesalahan.');
        }
    });

    // Event listener untuk auto-uppercase
    codeInput.addEventListener('input', () => {
        codeInput.value = codeInput.value.toUpperCase().replace(/\s+/g, '');
    });

    // Tambahkan 'penjaga' untuk event 'input'
    feeInput.addEventListener('input', (e) => {
        const value = e.target.value;

        // Cek jika nilainya dimulai dengan '0' dan ada angka lain setelahnya
        if (value.startsWith('0') && value.length > 1) {
            // Ubah nilainya menjadi angka (yang akan otomatis menghilangkan '0' di depan),
            // lalu ubah kembali menjadi string.
            e.target.value = parseInt(value, 10);
        }
    });

    tableBody.addEventListener('click', async (e) => {
        // Cari tombol edit atau hapus yang diklik
        const editButton = e.target.closest('.btn-edit');
        const deleteButton = e.target.closest('.btn-delete');

        // ==========================================================
        // ==  INI LOGIKA BARU UNTUK TOMBOL EDIT (TOGGLE STATUS)   ==
        // ==========================================================
        if (editButton) {
            const id = editButton.closest('tr').dataset.id;

            try {
                const response = await fetch(`/api/payment-methods/${id}/toggle-status`, {
                    method: 'PATCH' // Gunakan metode PATCH
                });
                const result = await response.json();

                if (result.success) {
                    // Jika berhasil, muat ulang tabel untuk menampilkan status baru
                    loadPaymentMethods();
                } else {
                    alert(result.message); // Tampilkan pesan error jika gagal
                }
            } catch (error) {
                alert('Terjadi kesalahan koneksi saat mengubah status.');
            }
        }

        // ==========================================================
        // ==  INI LOGIKA BARU UNTUK TOMBOL HAPUS                  ==
        // ==========================================================
        if (deleteButton) {
            const id = e.target.closest('tr').dataset.id;
            const methodName = e.target.closest('tr').cells[2].textContent; // Ambil nama dari sel ke-3

            if (confirm(`Yakin ingin menghapus metode pembayaran "${methodName}"?`)) {
                try {
                    const response = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' });
                    const result = await response.json();
                    alert(result.message);
                    if (result.success) {
                        loadPaymentMethods(); // Muat ulang tabel
                    }
                } catch (error) {
                    alert('Terjadi kesalahan saat mencoba menghapus.');
                }
            }
        }
    });

    // Fungsi untuk mengupdate teks & warna status
    function updateToggleStatusText() {
        if (isActiveCheckbox.checked) {
            toggleStatusText.textContent = 'Aktif';
            toggleStatusText.classList.add('active');
            toggleStatusText.classList.remove('inactive');
        } else {
            toggleStatusText.textContent = 'Nonaktif';
            toggleStatusText.classList.add('inactive');
            toggleStatusText.classList.remove('active');
        }
    }

    // Update teks setiap kali toggle di-klik
    isActiveCheckbox.addEventListener('change', updateToggleStatusText);

    reorderGroupBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/payment-methods/group-order');
            const result = await response.json();
            if (result.success) {
                sortableList.innerHTML = '';
                result.data.forEach(groupName => {
                    const li = document.createElement('li');
                    li.dataset.group = groupName;
                    li.innerHTML = `
                    <div class="drag-handle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </div>
                     <span>${groupName}</span>
                `;
                    sortableList.appendChild(li);
                });
                Sortable.create(sortableList, { animation: 150 });
                reorderModal.style.display = 'block';
            }
        } catch (error) {
            alert('Gagal memuat urutan grup.');
        }
    });

    closeReorderModalBtn.addEventListener('click', () => {
        reorderModal.style.display = 'none';
    });

    saveOrderBtn.addEventListener('click', async () => {
        const listItems = Array.from(sortableList.querySelectorAll('li'));
        const newOrder = listItems.map(li => li.dataset.group);

        try {
            const response = await fetch('/api/payment-methods/group-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order: newOrder })
            });
            const result = await response.json();
            alert(result.message);
            if (result.success) {
                reorderModal.style.display = 'none';
                loadPaymentMethods(); // Refresh tabel utama
            }
        } catch (error) {
            alert('Gagal menyimpan urutan.');
        }
    }); 

    // --- INISIALISASI ---
    loadPaymentMethods();
});