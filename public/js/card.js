// File: /public/js/card.js (VERSI FINAL & LENGKAP)

document.addEventListener('DOMContentLoaded', () => {

    // =======================================================
    // DEFINISI ELEMEN
    // =======================================================
    const tableBody = document.getElementById('gameTableBody');
    const limitSelect = document.getElementById('limitSelect');
    const paginationControls = document.getElementById('paginationControls');
    const searchInput = document.getElementById('searchName');
    const addGameBtn = document.querySelector('.card-management #addGameBtn');
    const reorderBtn = document.querySelector('.card-management #reorderBtn');

    // --- Elemen Aksi Massal (BARU) ---
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');

    // --- Elemen Modal ---
    const gameModal = document.getElementById('gameModal');
    const gameForm = document.getElementById('gameForm');
    const modalTitle = document.getElementById('modalTitle');
    const sectionSelect = document.getElementById('sectionSelect');
    const addNewSectionBtn = document.getElementById('addNewSectionBtn');
    const newSectionContainer = document.getElementById('newSectionContainer');
    const newSectionInput = document.getElementById('newSectionInput');
    const commitSectionBtn = document.getElementById('commitSectionBtn');
    const reorderModal = document.getElementById('reorderModal');
    const sortableList = document.getElementById('sortable-list');
    const saveOrderBtn = document.getElementById('saveOrderBtn');
    const closeGameModalBtn = gameModal.querySelector('.modal__close-btn');
    const closeReorderBtn = reorderModal.querySelector('.modal__close-btn');
    let sortableInstance = null;

    // --- STATE ---
    let allGames = []; // Hanya menyimpan data per halaman
    let currentPage = 1;
    let limit = 25;
    let searchQuery = '';

    // =======================================================
    // FUNGSI-FUNGSI UTAMA
    // =======================================================

    // Fungsi untuk memuat data dari API
    async function loadAndDisplayCards() {
        try {
            let apiUrl = `/api/cards?page=${currentPage}&limit=${limit}`;
            if (searchQuery) {
                apiUrl += `&search=${encodeURIComponent(searchQuery)}`;
            }
            const response = await fetch(apiUrl);
            const result = await response.json();
            if (result.success) {
                allGames = result.data;
                renderTable(allGames);
                renderPagination(result.pagination);
                updateBulkActionUI(); // Update UI tombol hapus
            }
        } catch (error) { console.error('Error loading cards:', error); }
    }

    // Fungsi untuk mengisi dropdown section
    async function populateSectionDropdown() {
        try {
            const response = await fetch('/api/sections/names');
            const result = await response.json();
            if (result.success) {
                sectionSelect.innerHTML = '<option value="" disabled selected>-- Pilih Section --</option>';
                result.data.forEach(sectionName => {
                    const option = document.createElement('option');
                    option.value = sectionName;
                    option.textContent = sectionName;
                    sectionSelect.appendChild(option);
                });
            }
        } catch (error) { console.error('Error populating sections:', error); }
    }

    // Fungsi untuk merender tabel (dengan checkbox)
    const renderTable = (games) => {
        tableBody.innerHTML = '';
        if (games.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Tidak ada data.</td></tr>`;
            return;
        }
        games.forEach(game => {
            const row = document.createElement('tr');
            row.dataset.code = game.code;
            row.dataset.id = game.id;
            const imageUrl = game.image ? `/images/card/${game.image}` : '';
            row.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" value="${game.id}"></td>
                <td><img src="${imageUrl}" alt="${game.name}" class="table-img"></td>
                <td>${game.name}</td>
                <td>${game.code}</td>
                <td>${game.publisher || '-'}</td>
                <td>${game.section}</td>
                <td class="actions">
                            <div class="action-buttons-container">
                                <button class="btn btn-secondary btn-icon btn-edit" title="Edit Slide">
                                    <svg fill="currentColor" data-name="Livello 1" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path d="M64,39A25,25,0,1,0,89,64,25,25,0,0,0,64,39Zm0,44A19,19,0,1,1,83,64,19,19,0,0,1,64,83Z"/><path d="M121,48h-8.93a1,1,0,0,1-.94-.68,49.9,49.9,0,0,0-2-4.85,1,1,0,0,1,.18-1.15L115.62,35a7,7,0,0,0,0-9.9L102.89,12.38a7,7,0,0,0-9.9,0l-6.31,6.31a1,1,0,0,1-1.15-.18,49.76,49.76,0,0,0-4.85-2,1,1,0,0,1-.68-.94V7a7,7,0,0,0-7-7H55a7,7,0,0,0-7,7v8.93a1,1,0,0,1-.68-.94,49.9,49.9,0,0,0-4.85,2,1,1,0,0,1-1.15-.18L35,12.38a7,7,0,0,0-9.9,0L12.38,25.11a7,7,0,0,0,0,9.9l6.31,6.31a1,1,0,0,1,.18,1.15,49.76,49.76,0,0,0-2,4.85,1,1,0,0,1-.94-.68H7a7,7,0,0,0-7,7V73a7,7,0,0,0,7,7h8.93a1,1,0,0,1,.94-.68,49.9,49.9,0,0,0,2,4.85,1,1,0,0,1-.18,1.15L12.38,93a7,7,0,0,0,0,9.9l12.73,12.73a7,7,0,0,0,9.9,0l6.31-6.31a1,1,0,0,1,1.15-.18,49.76,49.76,0,0,0,4.85,2,1,1,0,0,1,.68-.94V121a7,7,0,0,0,7,7H73a7,7,0,0,0,7-7v-8.93a1,1,0,0,1,.68-.94,49.9,49.9,0,0,0,4.85-2,1,1,0,0,1,1.15.18L93,115.62a7,7,0,0,0,9.9,0l12.73-12.73a7,7,0,0,0,0-9.9l-6.31-6.31a1,1,0,0,1-.18-1.15,49.76,49.76,0,0,0,2-4.85,1,1,0,0,1,.94-.68H121a7,7,0,0,0,7-7V55A7,7,0,0,0,121,48Zm1,25a1,1,0,0,1-1,1h-8.93a7,7,0,0,0-6.6,4.69,43.9,43.9,0,0,1-1.76,4.26,7,7,0,0,0,1.35,8l6.31,6.31a1,1,0,0,1,0,1.41L98.65,111.38a1,1,0,0,1-1.41,0l-6.31-6.31a7,7,0,0,0-8-1.35,43.88,43.88,0,0,1-4.27,1.76,7,7,0,0,0-4.68,6.6V121a1,1,0,0,1-1,1H55a1,1,0,0,1-1-1v-8.93a7,7,0,0,0-4.69-6.6,43.9,43.9,0,0,1-4.26-1.76,7,7,0,0,0-8,1.35l-6.31,6.31a1,1,0,0,1-1.41,0L16.62,98.65a1,1,0,0,1,0-1.41l6.31-6.31a7,7,0,0,0,1.35-8,43.88,43.88,0,0,1-1.76-4.27A7,7,0,0,0,15.93,74H7a1,1,0,0,1-1-1V55a1,1,0,0,1,1-1h8.93a7,7,0,0,0,6.6,4.69,43.9,43.9,0,0,1,1.76-4.26,7,7,0,0,0-1.35-8l-6.31-6.31a1,1,0,0,1,0-1.41L29.35,16.62a1,1,0,0,1,1.41,0l6.31,6.31a7,7,0,0,0,8,1.35,43.88,43.88,0,0,1,4.27-1.76A7,7,0,0,0,54,15.93V7a1,1,0,0,1,1-1H73a1,1,0,0,1,1,1v8.93a7,7,0,0,0,4.69,6.6,43.9,43.9,0,0,1,4.26,1.76,7,7,0,0,0,8-1.35l6.31-6.31a1,1,0,0,1,1.41,0l12.73,12.73a1,1,0,0,1,0,1.41l-6.31,6.31a7,7,0,0,0-1.35,8,43.88,43.88,0,0,1,1.76,4.27,7,7,0,0,0,6.6,4.68H121a1,1,0,0,1,1,1Z"/></svg>
                                </button>
                                <button class="btn btn-danger btn-icon btn-delete" title="Hapus Slide">
                                    <svg fill="currentColor" enable-background="new 0 0 40 40" viewBox="0 0 40 40" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><g><path d="M28,40H11.8c-3.3,0-5.9-2.7-5.9-5.9V16c0-0.6,0.4-1,1-1s1,0.4,1,1v18.1c0,2.2,1.8,3.9,3.9,3.9H28c2.2,0,3.9-1.8,3.9-3.9V16c0-0.6,0.4-1,1-1s1,0.4,1,1v18.1C33.9,37.3,31.2,40,28,40z"/></g><g><path d="M33.3,4.9h-7.6C25.2,2.1,22.8,0,19.9,0s-5.3,2.1-5.8,4.9H6.5c-2.3,0-4.1,1.8-4.1,4.1S4.2,13,6.5,13h26.9c2.3,0,4.1-1.8,4.1-4.1S35.6,4.9,33.3,4.9z M19.9,2c1.8,0,3.3,1.2,3.7,2.9h-7.5C16.6,3.2,18.1,2,19.9,2z M33.3,11H6.5c-1.1,0-2.1-0.9-2.1-2.1c0-1.1,0.9-2.1,2.1-2.1h26.9c1.1,0,2.1,0.9,2.1,2.1C35.4,10.1,34.5,11,33.3,11z"/></g><g><path d="M12.9,35.1c-0.6,0-1-0.4-1-1V17.4c0-0.6,0.4-1,1-1s1,0.4,1,1v16.7C13.9,34.6,13.4,35.1,12.9,35.1z"/></g><g><path d="M26.9,35.1c-0.6,0-1-0.4-1-1V17.4c0-0.6,0.4-1,1-1s1,0.4,1,1v16.7C27.9,34.6,27.4,35.1,26.9,35.1z"/></g><g><path d="M19.9,35.1c-0.6,0-1-0.4-1-1V17.4c0-0.6,0.4-1,1-1s1,0.4,1,1v16.7C20.9,34.6,20.4,35.1,19.9,35.1z"/></g></svg>
                                </button>
                            </div>
                        </td>
            `;
            tableBody.appendChild(row);
        });
    };

    // Fungsi untuk membuat tombol halaman
    function renderPagination(pagination) {
        const { currentPage: curr, totalPages } = pagination;
        paginationControls.innerHTML = ''; // Bersihin dulu isinya

        // 1. Tombol Previous (<)
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '&#8592;'; // Simbol Panah Kiri
        prevBtn.className = 'btn btn-secondary'; // Pake style tombol lu yang keren
        prevBtn.disabled = curr === 1; // Matiin kalau di hal 1

        prevBtn.onclick = () => {
            if (curr > 1) {
                currentPage--;
                loadAndDisplayCards();
            }
        };

        // 2. Info Halaman (Tengah)
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
        pageInfo.style.alignSelf = 'center';
        pageInfo.style.padding = '0 0.5rem';
        paginationControls.appendChild(pageInfo);

        // 3. Tombol Next (>)
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '&#8594;'; // Simbol Panah Kanan
        nextBtn.className = 'btn btn-secondary'; // Pake style tombol lu
        nextBtn.disabled = curr === totalPages; // Matiin kalau udah mentok

        nextBtn.onclick = () => {
            if (curr < totalPages) {
                currentPage++;
                loadAndDisplayCards();
            }
        };

        // Masukin semuanya ke container
        paginationControls.appendChild(prevBtn);
        paginationControls.appendChild(pageInfo);
        paginationControls.appendChild(nextBtn);
    }

    // =======================================================
    // EVENT LISTENERS
    // =======================================================

    // --- EVENT LISTENER UNTUK PENCARIAN (SERVER-SIDE) ---
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = searchInput.value;
            currentPage = 1;
            loadAndDisplayCards();
        }, 500);
    });

    // --- EVENT LISTENER UNTUK DROPDOWN LIMIT ---
    if (limitSelect) {
        limitSelect.addEventListener('change', (e) => {
            limit = parseInt(e.target.value);
            currentPage = 1;
            loadAndDisplayCards();
        });
    }

    // --- Event Listeners untuk Modal Tambah/Edit Game ---
    addGameBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Tambah Card Baru';
        gameForm.reset();
        gameForm.formMode.value = 'add';
        document.getElementById('currentImage').textContent = 'Tidak ada';
        newSectionContainer.style.display = 'none';
        newSectionInput.value = '';
        gameModal.style.display = 'block';
    });

    closeGameModalBtn.addEventListener('click', () => {
        gameModal.style.display = 'none';
    });

    gameForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(gameForm);
        const mode = formData.get('formMode');
        let url = '/api/cards';
        let method = 'POST';

        if (mode === 'edit') {
            const originalCode = formData.get('originalCode');
            url = `/api/cards/${originalCode}`;
            method = 'PUT';
        }

        try {
            const response = await fetch(url, { method: method, body: formData });
            const result = await response.json();
            alert(result.message);
            if (result.success) {
                gameModal.style.display = 'none';
                populateSectionDropdown();
                loadAndDisplayCards();
                searchInput.value = ''
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Terjadi kesalahan saat mengirim data.');
        }
    });

    // --- Event Listeners untuk Interaksi Tabel (Edit/Hapus) ---
    // GANTI BLOK INI DI card.js
    tableBody.addEventListener('click', (event) => {
        // Cari elemen tombol atau baris terdekat dari apa pun yang diklik
        const editButton = event.target.closest('.btn-edit');
        const deleteButton = event.target.closest('.btn-delete');
        const row = event.target.closest('tr');

        if (!row) return;
        const gameCode = row.dataset.code;

        // Jika yang diklik adalah tombol edit (atau ikon di dalamnya)
        if (editButton) {
            const gameToEdit = allGames.find(g => g.code === gameCode);
            if (gameToEdit) {
                modalTitle.textContent = 'Edit Game Card';
                gameForm.reset();
                gameForm.formMode.value = 'edit';
                gameForm.originalCode.value = gameToEdit.code;
                gameForm.name.value = gameToEdit.name;
                gameForm.section.value = gameToEdit.section;
                document.getElementById('currentImage').textContent = gameToEdit.image || 'Tidak ada';
                gameForm.oldImage.value = gameToEdit.image || '';
                gameForm.publisher.value = gameToEdit.publisher || '';
                gameForm.description.value = gameToEdit.description || '';
                gameModal.style.display = 'block';
            }
        }

        // Jika yang diklik adalah tombol delete (atau ikon di dalamnya)
        if (deleteButton) {
            if (confirm(`Apakah kamu yakin ingin menghapus game "${gameCode}"?`)) {
                fetch(`/api/cards/${gameCode}`, { method: 'DELETE' })
                    .then(res => res.json())
                    .then(result => {
                        alert(result.message);
                        if (result.success) {
                            loadAndDisplayCards();
                        }
                    })
                    .catch(error => {
                        console.error('Delete error:', error);
                        alert('Terjadi kesalahan saat menghapus data.');
                    });
            }
        }
    });

    addNewSectionBtn.addEventListener('click', () => {
        newSectionContainer.style.display = 'flex';
        sectionSelect.value = '';
        newSectionInput.focus();
    });

    sectionSelect.addEventListener('change', () => {
        if (sectionSelect.value !== '') {
            newSectionContainer.style.display = 'none';
            newSectionInput.value = '';
        }
    });

    commitSectionBtn.addEventListener('click', () => {
        const newName = newSectionInput.value.trim();
        if (newName === '') {
            alert('Nama section baru tidak boleh kosong.');
            return;
        }
        const option = document.createElement('option');
        option.value = newName;
        option.textContent = newName;
        sectionSelect.appendChild(option);
        sectionSelect.value = newName;
        newSectionContainer.style.display = 'none';
        newSectionInput.value = '';
    });

    reorderBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/sections/order');
            const result = await response.json();
            if (result.success) {
                sortableList.innerHTML = ''; // Kosongkan list yang lama
                result.data.forEach(sectionName => {
                    const li = document.createElement('li');
                    li.dataset.section = sectionName;

                    // Kita tambahkan div untuk 'handle' dan span untuk teks
                    li.innerHTML = `
                    <div class="drag-handle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </div>
                    <span>${sectionName}</span>
                `;
                    sortableList.appendChild(li);
                });

                // Inisialisasi atau hancurkan dan buat ulang Sortable.js
                if (sortableInstance) sortableInstance.destroy();
                sortableInstance = Sortable.create(sortableList, {
                    handle: '.drag-handle', // Tentukan elemen mana yang jadi 'pegangan'
                    animation: 150,
                    ghostClass: 'sortable-ghost' // Class untuk item bayangan saat digeser
                });
                reorderModal.style.display = 'block';
            } else {
                alert('Gagal memuat urutan section.');
            }
        } catch (error) {
            console.error('Error fetching section order:', error);
            alert('Terjadi kesalahan koneksi saat memuat urutan.');
        }
    });

    saveOrderBtn.addEventListener('click', async () => {
        const listItems = sortableList.querySelectorAll('li');
        const newOrder = Array.from(listItems).map(li => li.dataset.section);
        try {
            const response = await fetch('/api/sections/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order: newOrder })
            });
            const result = await response.json();
            alert(result.message);
            if (result.success) reorderModal.style.display = 'none';
        } catch (error) {
            console.error('Error saving section order:', error);
            alert('Terjadi kesalahan koneksi saat menyimpan urutan.');
        }
    });

    if (closeReorderBtn) {
        closeReorderBtn.addEventListener('click', () => {
            reorderModal.style.display = 'none';
        });
    }

    // --- LOGIKA BARU UNTUK CHECKBOX & AKSI MASSAL ---
    function updateBulkActionUI() {
        const rowCheckboxes = document.querySelectorAll('.row-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');

        bulkDeleteBtn.style.display = checkedCheckboxes.length > 0 ? 'inline-flex' : 'none';

        if (rowCheckboxes.length > 0 && checkedCheckboxes.length === rowCheckboxes.length) {
            selectAllCheckbox.checked = true;
        } else {
            selectAllCheckbox.checked = false;
        }
    }

    selectAllCheckbox.addEventListener('change', () => {
        const rowCheckboxes = document.querySelectorAll('.row-checkbox');
        rowCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
        updateBulkActionUI();
    });

    tableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-checkbox')) {
            updateBulkActionUI();
        }
    });

    bulkDeleteBtn.addEventListener('click', async () => {
        const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
        const idsToDelete = Array.from(checkedCheckboxes).map(cb => cb.value);

        if (idsToDelete.length === 0) return alert('Pilih minimal satu item untuk dihapus.');
        if (confirm(`Yakin ingin menghapus ${idsToDelete.length} item yang dipilih?`)) {
            try {
                const response = await fetch('/api/cards/bulk-delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: idsToDelete })
                });
                const result = await response.json();
                alert(result.message);
                if (result.success) {
                    loadAndDisplayCards();
                }
            } catch (error) {
                alert('Terjadi kesalahan saat menghapus data.');
            }
        }
    });

    // =======================================================
    // BAGIAN 4: INISIALISASI HALAMAN
    // =======================================================
    populateSectionDropdown();
    loadAndDisplayCards();
});
