document.addEventListener('DOMContentLoaded', () => {
    // =======================================================
    // DEFINISI ELEMEN (BAGIAN UTAMA & MODAL PRODUK) - VERSI FINAL
    // =======================================================
    const tableBody = document.getElementById('productTableBody');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const addProductBtn = document.querySelector('.product-management #addProductBtn');
    const manageFormsBtn = document.querySelector('.product-management #manageFormsBtn');
    const productModal = document.getElementById('productModal');
    const productForm = document.getElementById('productForm');
    const closeModalBtn = productModal.querySelector('.modal__close-btn');
    const modalTitle = document.getElementById('modalTitle');
    const cardSuggestionsDataList = document.getElementById('cardSuggestions');
    const cardCodeDisplay = document.getElementById('card_code_display');
    const cardCodeHidden = document.getElementById('card_code');
    const imageInput = document.getElementById('image');
    const thumbnailPreview = document.getElementById('thumbnailPreview');
    const currentProductImage = document.getElementById('currentProductImage');
    const filterValueInput = document.getElementById('filterValue');


    // =======================================================
    // DEFINISI ELEMEN (MODAL ATUR FORM) - VERSI FINAL
    // =======================================================
    const userInputModal = document.getElementById('userInputModal');
    const closeUserInputModal = userInputModal.querySelector('.modal__close-btn');
    const searchCardInput = document.getElementById('searchCardInput');
    const cardSearchSuggestionsDataList = document.getElementById('cardSearchSuggestions');
    const searchCardBtn = document.getElementById('searchCardBtn');
    const gameContextDisplay = document.getElementById('game-context-display');
    const contextGameImage = document.getElementById('context-game-image');
    const contextGameName = document.getElementById('context-game-name');
    const currentConfigDisplay = document.getElementById('currentConfigDisplay');
    const currentConfigText = document.getElementById('currentConfigText');
    const presetButtons = document.getElementById('presetButtons');
    const customConfigWrapper = document.getElementById('customConfigWrapper');
    const customConfigTextarea = document.getElementById('customConfigTextarea');
    const saveUserInputConfigBtn = document.getElementById('saveUserInputConfig');
    const editConfigBtn = document.getElementById('editConfigBtn');
    const cancelSearchBtn = document.getElementById('cancelSearchBtn');
    let jsonEditor; // Variabel untuk CodeMirror

    // --- STATE ---
    let allProducts = [];
    let allCards = [];
    let currentPage = 1;
    let limit = 25;

    // --- FUNGSI HELPER ---
    const formatRupiah = (number) => {
        if (number === null || number === undefined || number === '') return '-';
        return `Rp ${Number(number).toLocaleString('id-ID')}`;
    };

    function updateAllPricePreviews() {
        productForm.querySelectorAll('input[type="number"]').forEach(input => {
            const previewEl = document.getElementById(`${input.id}-preview`);
            if (previewEl) {
                previewEl.textContent = input.value ? `(${formatRupiah(input.value)})` : '';
            }
        });
    }

    // --- FUNGSI LOAD & RENDER ---
    // FUNGSI BARU UNTUK MEMUAT KARTU (hanya sekali)
    async function loadCards() {
        try {
            const cardsRes = await fetch('/api/cards');
            const cardsResult = await cardsRes.json();
            if (cardsResult.success) {
                allCards = cardsResult.data;
                // Mengisi datalist
                cardSuggestionsDataList.innerHTML = '';
                cardSearchSuggestionsDataList.innerHTML = '';
                allCards.forEach(card => {
                    const opt = document.createElement('option');
                    opt.value = `${card.name} (${card.code})`;
                    cardSuggestionsDataList.appendChild(opt);
                    cardSearchSuggestionsDataList.appendChild(opt.cloneNode(true));
                });
            }
        } catch (error) { console.error("Gagal memuat data cards:", error); }
    }

    // FUNGSI LOAD PRODUK YANG SUDAH DIPERBARUI
    async function loadProducts() {
        try {
            const response = await fetch(`/api/products?page=${currentPage}&limit=${limit}`);
            const result = await response.json();
            if (result.success) {
                allProducts = result.data;
                renderTable(allProducts);
                renderPagination(result.pagination);
            }
        } catch (error) { console.error("Gagal memuat data produk:", error); }
    }

    function renderTable(products) {
        tableBody.innerHTML = '';
        products.forEach(p => {
            const row = document.createElement('tr');
            row.dataset.id = p.id;
            row.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" value="${p.id}"></td>
                <td>${p.kategori || '-'}</td>
                <td>${p.card_code || '-'}</td>
                <td>${p.group_name || '-'}</td>
                <td>${p.product_code || '-'}</td>
                <td>${p.product_name || '-'}</td>
                <td>${p.description || '-'}</td>
                <td>${p.image ? `<img src="/images/product/${p.image}" alt="${p.product_name}" class="table-img">` : '-'}</td>
                <td>${formatRupiah(p.price)}</td>
                <td>${formatRupiah(p.price_sell)}</td>
                <td>${formatRupiah(p.harga_coret)}</td>
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
    }

    // FUNGSI BARU UNTUK MEMBUAT TOMBOL HALAMAN
    function renderPagination({ currentPage, totalPages }) {
        if (!paginationControls) return;
        paginationControls.innerHTML = '';
        if (totalPages <= 1) return; // Jangan tampilkan jika hanya 1 halaman

        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-secondary';
        prevBtn.textContent = '<';
        if (currentPage === 1) prevBtn.disabled = true;
        prevBtn.addEventListener('click', () => {
            currentPage--;
            loadProducts();
        });
        paginationControls.appendChild(prevBtn);

        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
        pageInfo.style.alignSelf = 'center';
        pageInfo.style.padding = '0 0.5rem';
        paginationControls.appendChild(pageInfo);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-secondary';
        nextBtn.textContent = '>';
        if (currentPage >= totalPages) nextBtn.disabled = true;
        nextBtn.addEventListener('click', () => {
            currentPage++;
            loadProducts();
        });
        paginationControls.appendChild(nextBtn);
    }

    // --- EVENT LISTENERS (PRODUK & FILTER) ---

    addProductBtn.addEventListener('click', () => {
        productForm.reset();
        modalTitle.textContent = 'Tambah Nominal Baru';
        productForm.formMode.value = 'add';
        thumbnailPreview.style.display = 'none';
        currentProductImage.textContent = '-';
        updateAllPricePreviews();
        productModal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', () => productModal.style.display = 'none');

    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                thumbnailPreview.src = e.target.result;
                thumbnailPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    cardCodeDisplay.addEventListener('input', () => {
        const selectedValue = cardCodeDisplay.value;
        const card = allCards.find(c => `${c.name} (${c.code})` === selectedValue);
        cardCodeHidden.value = card ? card.code : '';
    });

    productForm.addEventListener('input', (e) => {
        if (e.target.type === 'number') updateAllPricePreviews();
    });

    productForm.addEventListener('submit', async e => {
        e.preventDefault();
        const submitBtn = productForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';

        const formData = new FormData(productForm);
        const mode = formData.get('formMode');
        let url = '/api/products', method = 'POST';

        if (mode === 'edit') {
            url = `/api/products/${formData.get('productId')}`;
            method = 'PUT';
        }

        try {
            const response = await fetch(url, { method, body: formData });
            const result = await response.json();
            alert(result.message);
            if (result.success) {
                productModal.style.display = 'none';
                loadInitialData();
            }
        } catch (error) {
            alert('Gagal mengirim data.');
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Simpan Nominal';
        }
    });

    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit');
        const deleteBtn = e.target.closest('.btn-delete');

        if (editBtn) {
            const productId = editBtn.closest('tr').dataset.id;
            const productData = allProducts.find(p => p.id === Number(productId));
            if (productData) {
                productForm.reset();
                modalTitle.textContent = 'Edit Nominal Produk';
                productForm.formMode.value = 'edit';
                productForm.productId.value = productData.id;
                productForm.kategori.value = productData.kategori || '';
                productForm.group_name.value = productData.group_name || '';
                productForm.product_code.value = productData.product_code || '';
                productForm.product_name.value = productData.product_name || '';
                productForm.description.value = productData.description || '';
                productForm.price.value = productData.price || '';
                productForm.price_sell.value = productData.price_sell || '';
                productForm.harga_coret.value = productData.harga_coret || '';
                productForm.oldImage.value = productData.image || '';

                const card = allCards.find(c => c.code === productData.card_code);
                if (card) {
                    cardCodeDisplay.value = `${card.name} (${card.code})`;
                    cardCodeHidden.value = card.code;
                }

                currentProductImage.textContent = productData.image || '-';
                if (productData.image) {
                    thumbnailPreview.src = `/images/product/${productData.image}`;
                    thumbnailPreview.style.display = 'block';
                } else {
                    thumbnailPreview.style.display = 'none';
                }
                updateAllPricePreviews();
                productModal.style.display = 'block';
            }
        }

        if (deleteBtn) {
            const productId = deleteBtn.closest('tr').dataset.id;
            if (confirm('Yakin ingin menghapus produk ini?')) {
                fetch(`/api/products/${productId}`, { method: 'DELETE' })
                    .then(res => res.json())
                    .then(result => {
                        alert(result.message);
                        if (result.success) loadInitialData();
                    })
                    .catch(err => alert('Gagal menghapus produk.'));
            }
        }
    });

    filterValueInput.addEventListener('input', () => {
        const value = filterValueInput.value.trim().toLowerCase();
        if (!value) return renderTable(allProducts);

        const filtered = allProducts.filter(p => {
            const card = allCards.find(c => c.code === p.card_code);
            const cardName = card ? card.name.toLowerCase() : '';
            return Object.values(p).some(val => String(val).toLowerCase().includes(value)) || cardName.includes(value);
        });
        renderTable(filtered);
    });

    // --- LOGIKA MODAL "ATUR FORM INPUT" ---

    const presetTemplates = {
        userid_only: [
            { "id": "user_id", "label": "ID Karakter", "type": "text", "placeholder": "Masukkan UserID Anda" }
        ],
        userid_zone: [
            { "id": "user_id", "label": "User ID", "type": "text", "placeholder": "Masukkan User ID" },
            { "id": "zone_id", "label": "Zone ID", "type": "text", "placeholder": "(1234)" }
        ],
        userid_server: [
            { "id": "user_id", "label": "UID", "type": "text", "placeholder": "Masukkan UID Anda" },
            {
                "id": "server", "label": "Pilih Server", "type": "select", "options": [
                    { "value": "asia", "text": "Asia" }, { "value": "america", "text": "America" },
                    { "value": "europe", "text": "Europe" }, { "value": "twhkmo", "text": "TW, HK, MO" }
                ]
            }
        ],
    };

    // Template default untuk tombol 'Custom'
    const customDefaultTemplate = [
        {
            "id": "user_id",
            "label": "User ID",
            "type": "number",
            "placeholder": "12345678"
        }
    ];

    function resetUserInputModal() {
        searchCardInput.value = '';
        searchCardInput.disabled = false;
        searchCardBtn.disabled = false;
        gameContextDisplay.style.display = 'none';
        currentConfigDisplay.style.display = 'none';
        presetButtons.style.display = 'none';
        editConfigBtn.style.display = 'none';
        cancelSearchBtn.style.display = 'none';
        saveUserInputConfigBtn.style.display = 'none';
        customConfigWrapper.style.display = 'none';
        customConfigTextarea.value = '';
        presetButtons.querySelectorAll('button').forEach(btn => {
            btn.disabled = true;
            btn.classList.remove('btn-primary');
        });
        searchCardInput.focus();
    }

    manageFormsBtn.addEventListener('click', () => {
        resetUserInputModal();
        userInputModal.style.display = 'block';
    });

    closeUserInputModal.addEventListener('click', () => {
        userInputModal.style.display = 'none';
    });

    cancelSearchBtn.addEventListener('click', resetUserInputModal);

    searchCardBtn.addEventListener('click', () => {
        const selectedValue = searchCardInput.value;
        const card = allCards.find(c => `${c.name} (${c.code})` === selectedValue);

        if (!card) return alert('Game tidak ditemukan. Pilih dari daftar.');

        // 1. Tetap siapkan data dan kunci form pencarian
        searchCardInput.disabled = true;
        searchCardBtn.disabled = true;
        gameContextDisplay.style.display = 'flex';
        contextGameImage.src = card.image ? `/images/card/${card.image}` : '';
        contextGameName.textContent = card.name;
        searchCardInput.dataset.selectedCode = card.code;

        // 2. Langsung tampilkan tombol-tombol preset
        presetButtons.style.display = 'block';

        // 3. Logika untuk mencocokkan dan memberi style 'primary'
        const configStr = card.input_fields || '[]';
        const config = JSON.parse(configStr);
        const configIds = config.map(f => f.id).sort();

        const matchedKey = Object.keys(presetTemplates).find(key => {
            const templateIds = presetTemplates[key].map(f => f.id).sort();
            return configIds.length === templateIds.length && configIds.every((id, i) => id === templateIds[i]);
        });

        // Reset dulu semua tombol
        presetButtons.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.disabled = false; // Aktifkan semua tombol preset
        });

        // Beri style 'primary' ke tombol yang cocok
        if (matchedKey) {
            const targetBtn = presetButtons.querySelector(`button[data-config="${matchedKey}"]`);
            if (targetBtn) targetBtn.classList.add('btn-primary');
        } else if (config.length > 0) {
            // Jika tidak cocok preset manapun tapi ada isinya, anggap 'custom'
            presetButtons.querySelector('button[data-config="custom"]').classList.add('btn-primary');
        }

        // 4. Sembunyikan/tampilkan elemen lain yang relevan
        currentConfigDisplay.style.display = 'none'; // Sembunyikan blok teks JSON
        editConfigBtn.style.display = 'inline-flex'; // Tombol edit tidak perlu di alur ini
        cancelSearchBtn.style.display = 'inline-flex'; // Tampilkan tombol Batal
        saveUserInputConfigBtn.style.display = 'none'; // Tampilkan tombol Simpan
        presetButtons.querySelectorAll('button').forEach(btn => btn.disabled = true);
    });

    editConfigBtn.addEventListener('click', () => {
        editConfigBtn.style.display = 'none';
        currentConfigDisplay.style.display = 'none';
        cancelSearchBtn.style.display = 'none';
        presetButtons.style.display = 'block';
        saveUserInputConfigBtn.style.display = 'inline-flex';
        presetButtons.querySelectorAll('button').forEach(btn => btn.disabled = false);

        if (presetButtons.querySelector('button[data-config="custom"].btn-primary')) {
            customConfigWrapper.style.display = 'block';
            customConfigTextarea.value = currentConfigText.textContent;
        }
    });

    // Inisialisasi CodeMirror pada textarea
    jsonEditor = CodeMirror.fromTextArea(customConfigTextarea, {
        lineNumbers: true,
        mode: { name: "javascript", json: true },
        theme: "material-darker",
        lineWrapping: true,
        autoCloseBrackets: true
    });

    presetButtons.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-config]');
        if (!btn || btn.disabled) return;

        const configKey = btn.dataset.config;
        presetButtons.querySelectorAll('button').forEach(b => b.classList.remove('btn-primary'));
        btn.classList.add('btn-primary');

        // ===============================================
        // == PERBAIKAN LOGIKA ADA DI SINI ==
        // ===============================================

        // 1. Tampilkan atau sembunyikan textarea HANYA untuk mode custom
        customConfigWrapper.style.display = (configKey === 'custom') ? 'block' : 'none';

        if (presetTemplates[configKey]) {
            // 2. Jika preset (User ID, Zone, Server) diklik, isi textarea dengan template-nya
            //    (Textarea tetap terisi meskipun disembunyikan)
            jsonEditor.setValue(JSON.stringify(presetTemplates[configKey], null, 2));
        } else if (configKey === 'custom') {
            // 3. Jika 'custom' diklik, isi textarea dengan template default untuk diedit
            jsonEditor.setValue(JSON.stringify(customDefaultTemplate, null, 2));
            jsonEditor.refresh(); // PENTING: Refresh editor saat ditampilkan
        }
    });

    saveUserInputConfigBtn.addEventListener('click', async () => {
        const gameCode = searchCardInput.dataset.selectedCode;
        let configValue = jsonEditor.getValue();

        try {
            JSON.parse(configValue); // Validasi JSON
        } catch (error) {
            return alert('Format JSON di textarea tidak valid!');
        }

        saveUserInputConfigBtn.disabled = true;
        saveUserInputConfigBtn.textContent = 'Menyimpan...';

        try {
            const response = await fetch(`/api/cards/${gameCode}/config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: configValue })
            });
            const result = await response.json();
            alert(result.message);
            if (result.success) {
                resetUserInputModal();
                userInputModal.style.display = 'none';
                loadInitialData();
            }
        } catch (error) {
            alert('Gagal menyimpan konfigurasi.');
        } finally {
            saveUserInputConfigBtn.disabled = false;
            saveUserInputConfigBtn.textContent = 'Simpan Perubahan';
        }
    });

    // EVENT LISTENER BARU UNTUK DROPDOWN LIMIT
    if (limitSelect) {
        limitSelect.addEventListener('change', (e) => {
            limit = parseInt(e.target.value);
            currentPage = 1; // Selalu kembali ke halaman 1 jika limit diubah
            loadProducts();
        });
    }

    // --- LOGIKA BARU UNTUK CHECKBOX & AKSI MASSAL ---
    function updateBulkActionUI() {
        const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
        bulkDeleteBtn.style.display = checkedCheckboxes.length > 0 ? 'inline-flex' : 'none';
        
        const allRowCheckboxes = document.querySelectorAll('.row-checkbox');
        selectAllCheckbox.checked = allRowCheckboxes.length > 0 && checkedCheckboxes.length === allRowCheckboxes.length;
    }

    selectAllCheckbox.addEventListener('change', () => {
        document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = selectAllCheckbox.checked);
        updateBulkActionUI();
    });

    tableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-checkbox')) {
            updateBulkActionUI();
        }
    });

    bulkDeleteBtn.addEventListener('click', async () => {
        const idsToDelete = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.value);
        if (idsToDelete.length === 0) return alert('Pilih minimal satu item untuk dihapus.');

        if (confirm(`Yakin ingin menghapus ${idsToDelete.length} produk yang dipilih?`)) {
            try {
                const response = await fetch('/api/products/bulk-delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: idsToDelete })
                });
                const result = await response.json();
                alert(result.message);
                if (result.success) {
                    loadProducts(); // Asumsi nama fungsi pemuat datamu adalah loadProducts
                }
            } catch (error) {
                alert('Terjadi kesalahan saat menghapus data.');
            }
        }
    });

    // --- INISIALISASI HALAMAN ---
    loadCards(); // Muat data kartu sekali saja
    loadProducts(); // Muat data produk untuk halaman pertama
});