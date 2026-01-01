// File: public/js/jajan.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DEKLARASI ELEMEN ---
    const gameSearchInput = document.getElementById('gameSearchInput');
    const gameHiddenInput = document.getElementById('gameSelect'); // Ini input hidden
    const suggestionsBox = document.getElementById('gameSuggestions');
    const productSelect = document.getElementById('productSelect');
    const userInputContainer = document.getElementById('userInputFields');
    const manualOrderForm = document.getElementById('manualOrderForm');
    const priceDisplayContainer = document.getElementById('priceDisplayContainer');
    const priceDisplay = document.getElementById('productPriceDisplay');
    const priceInput = document.getElementById('productPriceInput');
    const editPriceBtn = document.getElementById('editPriceBtn');
    const basePriceDisplay = document.getElementById('basePriceDisplay');
    const confirmationContainer = document.getElementById('confirmationContainer');
    const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
    const finalConfirmBtn = document.getElementById('finalConfirmBtn');
    const confirmUserId = document.getElementById('confirm-user-id');
    const confirmItem = document.getElementById('confirm-item');
    const confirmTotal = document.getElementById('confirm-total');

    // --- STATE ---
    let allGames = [];
    let allProducts = [];
    let selectedProduct = null;
    let isEditingPrice = false;
    let editIconSVG, checkIconSVG;
    let temporaryOrderData = {};
    let debounceTimer;

    // --- FUNGSI-FUNGSI ---
    function formatRupiah(number) {
        if (number === null || number === undefined || number === '') return 'Rp 0';
        return 'Rp ' + Math.round(Number(number)).toLocaleString('id-ID');
    }

    // --- LOGIC SEARCH SUGGESTION (PENGGANTI LOADGAMES) ---
    gameSearchInput.addEventListener('input', function (e) {
        const keyword = e.target.value.trim();

        // 1. Reset data pilihan (TANPA menghapus teks yang lagi diketik)
        gameHiddenInput.value = '';
        productSelect.innerHTML = '<option>-- Pilih Game Dulu --</option>';
        productSelect.disabled = true;

        // 2. Bersihin area User ID & Harga secara manual
        userInputContainer.innerHTML = '';
        priceDisplayContainer.style.display = 'none';
        confirmationContainer.style.display = 'none';

        // Kalau kosong, sembunyiin suggestion
        if (keyword.length < 1) {
            suggestionsBox.style.display = 'none';
            return;
        }

        // Debounce (Nunggu user diem 300ms baru search)
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchGames(keyword);
        }, 300);
    });

    async function searchGames(keyword) {
        try {
            // Request ke API pake query ?search=...
            const response = await fetch(`/api/cards?search=${keyword}&limit=10`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                renderSuggestions(result.data);
            } else {
                suggestionsBox.style.display = 'block';
                suggestionsBox.innerHTML = '<div style="padding:10px; color:#888; text-align:center;">Game tidak ditemukan</div>';
            }
        } catch (error) {
            console.error("Error searching:", error);
        }
    }

    function renderSuggestions(games) {
        suggestionsBox.innerHTML = '';
        suggestionsBox.style.display = 'block';

        // Paksa style Container Suggestion biar ngambang bener
        suggestionsBox.style.background = '#1a1a1a'; // Warna gelap (bg-dark-2)
        suggestionsBox.style.border = '1px solid #333';
        suggestionsBox.style.maxHeight = '300px';
        suggestionsBox.style.overflowY = 'auto';

        games.forEach(game => {
            const div = document.createElement('div');

            // 1. PAKSA LAYOUT HORIZONTAL (FLEXBOX) LANGSUNG DI SINI
            div.style.cssText = `
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                gap: 15px !important;
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 1px solid #333;
                background: transparent;
            `;

            // 2. STYLE GAMBAR (50x50 FIX)
            const imgStyle = `
                width: 50px !important;
                height: 50px !important;
                min-width: 50px !important;
                flex-shrink: 0 !important;
                object-fit: cover;
                border-radius: 6px;
                background: #000;
                display: block;
            `;

            // 3. STYLE TEKS
            const textStyle = `
                display: flex;
                flex-direction: column;
                justify-content: center;
                overflow: hidden;
            `;

            div.innerHTML = `
                <img src="/images/card/${game.image}" 
                     style="${imgStyle}" 
                     onerror="this.src='/images/no-image.png'">
                
                <div style="${textStyle}">
                    <span style="font-weight: bold; color: #eee; font-size: 0.95rem; margin-bottom: 4px; line-height: 1.2;">
                        ${game.name}
                    </span>
                    <span style="font-size: 0.75rem; color: #ccff00; background: rgba(204, 255, 0, 0.15); padding: 2px 8px; border-radius: 4px; width: fit-content; font-weight: 600;">
                        ${game.code}
                    </span>
                </div>
            `;

            // Event Hover (Manual dikit biar UX enak)
            div.onmouseover = () => { div.style.backgroundColor = '#2a2a2a'; };
            div.onmouseout = () => { div.style.backgroundColor = 'transparent'; };

            div.addEventListener('click', () => {
                selectGame(game);
            });

            suggestionsBox.appendChild(div);
        });
    }

    function selectGame(game) {
        // 1. Isi input text dengan nama game
        gameSearchInput.value = game.name;

        // 2. Isi input hidden dengan KODE (ini yg dipake sistem)
        gameHiddenInput.value = game.code;

        // 3. Sembunyiin suggestion
        suggestionsBox.style.display = 'none';

        // 4. Load Produk (Logic lama lu dipanggil disini)
        loadProducts(game.code);

        // 5. Load Form Input User (Logic lama lu)
        loadUserInputForm(game.code);
    }

    // Klik di luar suggestion buat nutup
    document.addEventListener('click', (e) => {
        if (!gameSearchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = 'none';
        }
    });

    // --- FUNGSI BARU UNTUK MEMUAT IKON ---
    async function loadIcons() {
        try {
            const editResponse = await fetch('/images/icon/svg/edit-pencil.svg');
            editIconSVG = await editResponse.text();
            const checkResponse = await fetch('/images/icon/svg/checkmark.svg');
            checkIconSVG = await checkResponse.text();
            if (editPriceBtn) editPriceBtn.innerHTML = editIconSVG;
        } catch (error) {
            console.error('Gagal memuat ikon SVG:', error);
            if (editPriceBtn) editPriceBtn.textContent = 'Edit';
        }
    }
    // Fungsi untuk memuat game ke dropdown
    async function loadGames() {
        try {
            const response = await fetch('/api/cards');
            const result = await response.json();
            if (result.success) {
                allGames = result.data;
                gameSelect.innerHTML = '<option value="" disabled selected>-- Pilih Game --</option>';
                allGames.forEach(game => {
                    const option = document.createElement('option');
                    option.value = game.code;
                    option.textContent = `${game.name} (${game.publisher || 'N/A'})`;
                    gameSelect.appendChild(option);
                });
            }
        } catch (error) { console.error('Error memuat game:', error); }
    }

    // Fungsi untuk memuat produk berdasarkan kode game
    async function loadProducts(gameCode) {
        productSelect.innerHTML = '<option>Memuat produk...</option>';
        productSelect.disabled = true;
        try {
            const response = await fetch(`/api/products/by-code/${gameCode}`);
            const result = await response.json();
            if (result.success && result.data.length > 0) {
                allProducts = result.data;
                productSelect.innerHTML = '<option value="" disabled selected>-- Pilih Nominal --</option>';
                allProducts.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.product_code;
                    const displayPrice = product.price_sell || product.price;
                    option.textContent = `${product.product_name} - (${formatRupiah(displayPrice)})`;
                    productSelect.appendChild(option);
                });
                productSelect.disabled = false;
            } else {
                productSelect.innerHTML = '<option>Tidak ada produk</option>';
            }
        } catch (error) { console.error('Error memuat produk:', error); }
    }

    // Fungsi untuk merender form input (User ID, dll.)
    function renderUserInputFields(game) {
        userInputContainer.innerHTML = '';
        try {
            const fields = JSON.parse(game.input_fields || '[]');
            if (fields.length === 0) {
                userInputContainer.innerHTML = '<div class="form-field"><label for="user_id">User ID</label><input type="text" id="user_id" name="user_id" required></div>';
                return;
            }
            fields.forEach(field => {
                let fieldHTML = '';
                if (field.type === 'text' || field.type === 'number') {
                    fieldHTML = `<div class="jajan-management__form-group"><label for="${field.id}">${field.label}></label><input type="${field.type}" id="${field.id}" name="${field.id}" placeholder="${field.placeholder || ''}" required></div>`;
                } else if (field.type === 'select') {
                    const optionsHTML = field.options.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('');
                    fieldHTML = `<div class="form-field"><label for="${field.id}">${field.label}</label><select id="${field.id}" name="${field.id}" required>${optionsHTML}</select></div>`;
                }
                userInputContainer.innerHTML += fieldHTML;
            });
        } catch (error) { console.error('Error parsing input fields:', error); }
    }

    // Event listener untuk dropdown game
    gameSelect.addEventListener('change', () => {
        const selectedGameCode = gameSelect.value;
        if (!selectedGameCode) return;
        const selectedGame = allGames.find(g => g.code === selectedGameCode);
        if (selectedGame) {
            loadProducts(selectedGameCode);
            renderUserInputFields(selectedGame);
            priceDisplayContainer.style.display = 'none';
            confirmationContainer.style.display = 'none';
        }
    });

    // Event listener untuk dropdown produk
    productSelect.addEventListener('change', () => {
        const selectedProductCode = productSelect.value;
        selectedProduct = allProducts.find(p => p.product_code === selectedProductCode);

        if (selectedProduct) {
            const displayPrice = selectedProduct.price_sell || selectedProduct.price;
            priceDisplay.textContent = formatRupiah(displayPrice);
            priceInput.value = Math.round(displayPrice);

            const basePriceSpan = basePriceDisplay.querySelector('span');
            basePriceSpan.textContent = formatRupiah(selectedProduct.price);
            priceDisplayContainer.style.display = 'flex';

            priceDisplay.style.display = 'inline';
            priceInput.style.display = 'none';
            isEditingPrice = false;
            if (editPriceBtn && editIconSVG) editPriceBtn.innerHTML = editIconSVG;
        } else {
            priceDisplayContainer.style.display = 'none';
        }
        confirmationContainer.style.display = 'none';
    });

    // Event listener untuk tombol edit harga
    editPriceBtn.addEventListener('click', () => {
        if (!selectedProduct) return;

        // Ambil semua elemen yang mau kita nonaktifkan
        const submitBtn = manualOrderForm.querySelector('button[type="submit"]');
        const userInputElements = userInputContainer.querySelectorAll('input, select');

        if (isEditingPrice) {
            // --- SAAT MENYIMPAN (IKON CENTANG DIKLIK) ---
            const newPrice = parseFloat(priceInput.value);
            const basePrice = parseFloat(selectedProduct.price);

            if (newPrice < basePrice) {
                alert(`Harga jual tidak boleh lebih rendah dari harga modal (${formatRupiah(basePrice)})`);
                priceInput.focus();
                return;
            }

            priceDisplay.textContent = formatRupiah(newPrice);
            priceInput.style.display = 'none';
            priceDisplay.style.display = 'inline';
            if (editIconSVG) editPriceBtn.innerHTML = editIconSVG;
            isEditingPrice = false;

            // AKTIFKAN KEMBALI SEMUA ELEMEN
            gameSelect.disabled = false;
            productSelect.disabled = false;
            submitBtn.disabled = false;
            userInputElements.forEach(el => el.disabled = false);

        } else {
            // --- SAAT MULAI MENGEDIT (IKON PENSIL DIKLIK) ---
            priceInput.style.display = 'block';
            priceDisplay.style.display = 'none';
            if (checkIconSVG) editPriceBtn.innerHTML = checkIconSVG;
            isEditingPrice = true;
            priceInput.focus();
            priceInput.select();

            // NONAKTIFKAN SEMUA ELEMEN LAIN
            gameSelect.disabled = true;
            productSelect.disabled = true;
            submitBtn.disabled = true;
            userInputElements.forEach(el => el.disabled = true);
        }
    });

    // Event listener untuk tombol Batal di container konfirmasi
    cancelConfirmBtn.addEventListener('click', () => {
        confirmationContainer.style.display = 'none';
        manualOrderForm.closest('.jajan-management').classList.remove('is-disabled');
    });

    // Event listener saat form utama di-submit (untuk menampilkan modal)
    manualOrderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!selectedProduct) return alert('Pilih game dan produk terlebih dahulu!');

        const userInputElements = userInputContainer.querySelectorAll('input, select');
        let userIdText = '';
        const userInputFields = {};
        let isFormComplete = true;

        for (const el of userInputElements) {
            if (!el.value) {
                alert(`Field "${el.previousElementSibling.textContent}" wajib diisi!`);
                isFormComplete = false;
                break;
            }
            userInputFields[el.name] = el.value;
            if (el.name === 'user_id') userIdText = el.value;
            if (el.name === 'zone_id') userIdText += ` (${el.value})`;
        }

        if (!isFormComplete) return;

        temporaryOrderData = {
            game_code: gameSelect.value,
            product_code: productSelect.value,
            userInputFields: userInputFields,
            manual_price: priceInput.value
        };

        confirmUserId.textContent = userIdText || 'Tidak ada';
        confirmItem.textContent = selectedProduct.product_name;
        confirmTotal.textContent = formatRupiah(priceInput.value);

        manualOrderForm.closest('.jajan-management').classList.add('is-disabled');
        confirmationContainer.style.display = 'block';
        confirmationContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Event listener saat tombol konfirmasi final di dalam modal diklik
    finalConfirmBtn.addEventListener('click', async () => {
        finalConfirmBtn.disabled = true;
        finalConfirmBtn.textContent = 'Memproses...';

        try {
            const response = await fetch('/api/admin/manual-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(temporaryOrderData)
            });
            const result = await response.json();
            alert(result.message);

            if (result.success) {
                resetOrderForm();
            }

        } catch (error) {
            console.error("Error saat konfirmasi pesanan:", error);
            alert('Terjadi kesalahan koneksi.');
        } finally {
            finalConfirmBtn.disabled = false;
            finalConfirmBtn.textContent = 'Konfirmasi & Proses';
            manualOrderForm.closest('.jajan-management').classList.remove('is-disabled');
        }
    });

    function resetOrderForm() {
        manualOrderForm.reset();
        productSelect.innerHTML = '<option>-- Pilih Game Dulu --</option>';
        productSelect.disabled = true;
        userInputContainer.innerHTML = '';
        priceDisplayContainer.style.display = 'none';
        confirmationContainer.style.display = 'none';
        manualOrderForm.closest('.jajan-managementd').classList.remove('is-disabled');
    }

    // Panggil fungsi untuk memuat game saat halaman pertama kali dibuka
    loadGames();
    loadIcons();
});