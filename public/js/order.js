document.addEventListener("DOMContentLoaded", () => {
    init();
});

// --- STATE GLOBAL ---
let selectedProduct = null;
let selectedPayment = null;
let currentGameData = null;
let allProducts = [];
let allPaymentMethods = [];
let gameSlug = null;

// Ganti alamat IP ini dengan alamat server production lu nanti
const socket = io("http://31.97.222.43:3001"); 

// --- FUNGSI UTAMA ---
function init() {
    const urlParams = new URLSearchParams(window.location.search);
    gameSlug = urlParams.get('game') || window.location.pathname.split("/").pop();

    const paymentModal = document.getElementById('paymentModal');
    const closePaymentBtn = document.getElementById('closePaymentModalBtn');

    if (paymentModal && closePaymentBtn) {
        closePaymentBtn.addEventListener('click', () => {
            paymentModal.style.display = 'none';
        });
    }

    if (!gameSlug) {
        document.getElementById("game-title").textContent = "Game tidak dipilih.";
        return;
    }

    loadGameDetails(gameSlug);
    loadProducts(gameSlug);
    loadPaymentMethods();
    setupUserValidation();
    setupProductSelection();
    setupPaymentSelection();
    setupStickyFooterObserver();
    handleFormSubmit();
}

function handleFormSubmit() {
    const buyButton = document.querySelector('.btn-submit-order');
    const confirmModal = document.getElementById('confirmationModal');
    const paymentModal = document.getElementById('paymentModal');

    if (!buyButton || !confirmModal || !paymentModal) {
        console.error("❌ Elemen penting (button/modal) tidak ditemukan.");
        return;
    }

    const closeConfirmBtn = document.getElementById('closeConfirmModalBtn');
    const finalConfirmBtn = document.getElementById('finalConfirmBtn');
    const closePaymentBtn = document.getElementById('closePaymentModalBtn');

    const closeModal = (modal) => { modal.style.display = 'none'; };

    if (closeConfirmBtn) closeConfirmBtn.addEventListener('click', () => closeModal(confirmModal));
    if (closePaymentBtn) closePaymentBtn.addEventListener('click', () => closeModal(paymentModal));

    buyButton.addEventListener('click', async (event) => {
        event.preventDefault();

        if (!selectedProduct || !selectedPayment) {
            alert("❌ Pilih produk dan metode pembayaran dulu!");
            return;
        }

        const userIdInput = document.getElementById("user_id");
        if (!userIdInput || !userIdInput.value) {
            alert("❌ User ID wajib diisi!");
            return;
        }
        
        const userId = userIdInput.value;
        const zoneId = document.getElementById("zone_id")?.value || "";
        const serverElement = document.getElementById("server");

        buyButton.disabled = true;
        buyButton.textContent = 'Mengecek User ID...';

        let validatedNickname = null;

        try {
            // FIX 1: Menggunakan URL API yang benar
            const res = await fetch("/api/user-validation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, zoneId, slug: gameSlug })
            });

            const result = await res.json();
            if (!result.success) {
                alert(`❌ User ID tidak valid: ${result.message}`);
                throw new Error("Validation failed");
            }
            validatedNickname = result.nickname;

        } catch (err) {
            console.error("❌ Error validate-user:", err);
            if (err.message !== "Validation failed") {
                 alert("❌ Gagal terhubung ke server validasi. Coba lagi.");
            }
            buyButton.disabled = false;
            buyButton.textContent = 'Beli Sekarang';
            return;
        }

        buyButton.disabled = false;
        buyButton.textContent = 'Beli Sekarang';

        let formattedUserId = userId;
        if (zoneId) {
            formattedUserId = `${userId} (${zoneId})`;
        } else if (serverElement && serverElement.selectedIndex >= 0) {
            const selectedServerText = serverElement.options[serverElement.selectedIndex]?.text || "";
            formattedUserId = `${userId} (${selectedServerText})`;
        }

        const productPrice = selectedProduct.price_sell ? parseFloat(selectedProduct.price_sell) : (parseFloat(selectedProduct.price) || 0);
        const paymentFee = parseFloat(selectedPayment.fee) || 0;
        const totalPrice = productPrice + paymentFee;

        const confirmNicknameContainer = document.getElementById('confirm-nickname-container');
        if (validatedNickname) {
            document.getElementById('confirm-nickname').textContent = validatedNickname;
            confirmNicknameContainer.style.display = 'flex';
        } else {
            confirmNicknameContainer.style.display = 'none';
        }

        document.getElementById('confirm-user-id').textContent = formattedUserId;
        document.getElementById('confirm-item').textContent = selectedProduct.product_name;
        document.getElementById('confirm-payment-method').textContent = selectedPayment.name;
        document.getElementById('confirm-harga').textContent = `Rp ${formatRupiah(productPrice)}`;
        document.getElementById('confirm-fee').textContent = `Rp ${formatRupiah(paymentFee)}`;
        document.getElementById('confirm-total').textContent = `Rp ${formatRupiah(totalPrice)}`;

        confirmModal.style.display = 'flex';
    });

    if (finalConfirmBtn) {
        finalConfirmBtn.addEventListener('click', async () => {
            finalConfirmBtn.disabled = true;
            finalConfirmBtn.textContent = 'Memproses...';

            const userId = document.getElementById("user_id")?.value || "";
            const zoneId = document.getElementById("zone_id")?.value || "";
            const email = document.getElementById("email")?.value || "";

            try {
                // FIX 2: Hapus kalkulasi harga & properti yang tidak perlu dari payload
                const payload = {
                    product_code: selectedProduct.product_code,
                    user_id: userId,
                    zone_id: zoneId,
                    email: email,
                    payment_code: selectedPayment.code
                };
                
                // FIX 3: Menggunakan URL API yang benar
                const response = await fetch("/api/transactions/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();

                if (result.success) {
                    closeModal(confirmModal);
                    showPaymentModal(result.data);
                } else {
                    alert(`❌ Gagal membuat pembayaran: ${result.message || 'Error tidak diketahui'}`);
                }
            } catch (err) {
                alert("❌ Terjadi kesalahan koneksi saat membuat pembayaran.");
                console.error(err);
            } finally {
                finalConfirmBtn.disabled = false;
                finalConfirmBtn.textContent = 'Konfirmasi & Bayar';
            }
        });
    }
}

// --- PEMUATAN DATA (Async) ---
async function loadGameDetails(slug) {
    try {
        const response = await fetch(`/api/cards/${slug}`);
        const result = await response.json();
        if (!result.success) throw new Error("Game tidak ditemukan.");

        currentGameData = result.data;   // <--- SIMPAN DATA GAME
        updateGameUI(result.data);
    } catch (error) {
        console.error("Error memuat detail game:", error);
        document.getElementById("game-title").textContent = error.message;
    }
}

async function loadProducts(slug) {
    const container = document.querySelector('#pilih-nominal .step-content');
    try {
        const response = await fetch(`/api/products/${slug}`);
        const result = await response.json();
        if (!result.success) throw new Error('Gagal mengambil data produk.');
        allProducts = result.data;
        if (allProducts.length === 0) {
            container.innerHTML = '<p>Produk tidak tersedia untuk game ini.</p>';
            return;
        }
        renderGroupedProducts(container, allProducts);
    } catch (error) {
        console.error('Error memuat produk:', error);
        container.innerHTML = `<p>${error.message}</p>`;
    }
}

async function loadPaymentMethods() { 
    const container = document.querySelector('.payment-container');
    try {
        const response = await fetch('/api/payment-methods');
        const result = await response.json();
        if (result.success && result.data.length > 0) {
            allPaymentMethods = result.data.filter(m => m.is_active);
            renderGroupedPayments(container, allPaymentMethods);
        }
    } catch (error) {
        console.error('Gagal memuat metode pembayaran:', error);
    }
 }

// --- FUNGSI RENDER TAMPILAN (UI) ---
function updateGameUI(game) { 
    document.getElementById("game-title").textContent = game.name;
    document.getElementById("game-publisher").textContent = game.publisher;
    document.getElementById("game-img").src = `/images/card/${game.image}`;
    currentGameCode = game.code;
    currentGameApiCode = game.api_code;
    renderUserInputFields(game);
}

function renderGroupedProducts(container, products) { 
    const grouped = products.reduce((acc, product) => {
        const groupKey = product.group_name || 'Lainnya';
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(product);
        return acc;
    }, {});

    container.innerHTML = '';
    for (const groupName in grouped) {
        const title = document.createElement('h3');
        title.className = 'product-section-title';
        title.textContent = groupName;
        container.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'product-container';
        grouped[groupName].forEach(p => grid.appendChild(createProductCard(p)));
        container.appendChild(grid);
    }
 }

function createProductCard(product) { 
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.itemId = product.product_code;

    const finalPrice = product.price_sell ? parseFloat(product.price_sell) : (product.price ? parseFloat(product.price) : 0);
    const originalPrice = product.discount ? parseFloat(product.discount) : 0;
    
    const hasDiscount = originalPrice > finalPrice;
    const discountPercent = hasDiscount ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0;

    card.innerHTML = `
        <div class="product-details">
            <p class="product-name">${product.product_name || ''}</p>
            <p class="product-description">${product.description || ''}</p>
        </div>
        ${product.image ? `<img class="product-image" src="/images/product/${product.image}" alt="${product.product_name}">` : ''}
        <div class="price-container">
            ${hasDiscount ? `
                <div class="discount-wrapper">
                    <span class="discount-badge">${discountPercent}%</span>
                    <span class="original-price">Rp ${formatRupiah(originalPrice)}</span>
                </div>` : ''}
            <span class="final-price">Rp ${formatRupiah(finalPrice)}</span>
        </div>`;
    return card;
}

function renderGroupedPayments(container, methods) { 
    const grouped = methods.reduce((acc, method) => {
        const group = method.group_name || 'Lainnya';
        if (!acc[group]) acc[group] = [];
        acc[group].push(method);
        return acc;
    }, {});

    container.innerHTML = '';
    for (const groupName in grouped) {
        const title = document.createElement('h3');
        title.className = 'payment-group-title';
        title.textContent = groupName;
        container.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'payment-group-grid';
        grouped[groupName].forEach(m => grid.appendChild(createPaymentCard(m)));
        container.appendChild(grid);
    }
 }

function createPaymentCard(method) { 
    const card = document.createElement('div');
    card.className = 'payment-card disabled';
    card.dataset.code = method.code;
    card.dataset.fee = method.fee;
    card.innerHTML = `
        <div class="payment-details">
            <img src="${method.icon_url}" alt="${method.name}" class="payment-icon">
            <span class="payment-name">${method.name}</span>
        </div>
        <div class="payment-prices">
            <span class="payment-original-price" style="display:none;"></span>
            <span class="payment-final-price"></span>
        </div>`;
    return card;
 }

function renderUserInputFields(game) { 
    const formContainer = document.getElementById('user-input-form');
    if (!formContainer) return;
    formContainer.innerHTML = ''; // Kosongkan form lama

    try {
        const fields = JSON.parse(game.input_fields || '[]');
        if (fields.length === 0) return;

        fields.forEach(field => {
            // BUAT PEMBUNGKUSNYA DULU
            const fieldWrapper = document.createElement('div');
            fieldWrapper.className = 'form-field';

            let fieldHTML = '';

            // Buat label dan inputnya
            if (field.type === 'text' || field.type === 'number') {
                fieldHTML = `
                    <label for="${field.id}">${field.label}</label>
                    <input type="${field.type}" id="${field.id}" name="${field.id}" placeholder="${field.placeholder || ''}" required>
                `;
            } else if (field.type === 'select') {
                const optionsHTML = field.options.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('');
                fieldHTML = `
                    <label for="${field.id}">${field.label}</label>
                    <select id="${field.id}" name="${field.id}" required>${optionsHTML}</select>
                `;
            }

            // Masukkan HTML ke dalam pembungkus, lalu masukkan pembungkus ke form
            fieldWrapper.innerHTML = fieldHTML;
            formContainer.appendChild(fieldWrapper);
        });

        // Tambahkan elemen untuk hasil validasi di akhir
        formContainer.insertAdjacentHTML('beforeend', `<div id="user-check-result" class="user-check-result"></div>`);
        
    } catch (error) {
        console.error('Error parsing JSON input_fields:', error);
    }
}

// --- INTERAKSI PENGGUNA ---
function setupProductSelection() { 
    document.querySelector('#pilih-nominal').addEventListener('click', (event) => {
        const card = event.target.closest('.product-card');
        if (!card) return;

        // Cek apakah produk yang dipilih adalah produk yang baru/berbeda
        const newProductId = card.dataset.itemId;
        const isDifferentProduct = !selectedProduct || selectedProduct.product_code !== newProductId;

        // Lakukan pemilihan produk seperti biasa
        document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedProduct = allProducts.find(p => p.product_code === newProductId);

        // Buka (enable) kembali semua pilihan pembayaran, TAPI JANGAN RESET pilihan
        document.querySelectorAll('.payment-card').forEach(payCard => {
            payCard.classList.remove('disabled');
        });

        // Update harga di kartu & footer
        updatePaymentCardPrices();
        updateStickyFooter();

        // Jika user memilih produk baru, scroll ke bagian pembayaran
        if (isDifferentProduct) {
            const paymentSection = document.getElementById('pilih-pembayaran');
            if (paymentSection) {
                // Scroll ke tengah layar biar lebih enak dilihat
                paymentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
 }

function setupPaymentSelection() { 
    document.querySelector('.payment-container').addEventListener('click', (event) => {
        const card = event.target.closest('.payment-card');
        if (!card || card.classList.contains('disabled')) return;

        document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        selectedPayment = allPaymentMethods.find(p => p.code === card.dataset.code);
        updateStickyFooter();
    });
 }

function updatePaymentCardPrices() {
    if (!selectedProduct) return;

    document.querySelectorAll('.payment-card').forEach(card => {
        const fee = parseFloat(card.dataset.fee) || 0;
        const finalPriceEl = card.querySelector('.payment-final-price');
        const originalPriceEl = card.querySelector('.payment-original-price');

        // Gunakan price_sell jika ada, jika tidak, baru gunakan price
        const productPrice = selectedProduct.price_sell ? parseFloat(selectedProduct.price_sell) : (parseFloat(selectedProduct.price) || 0);
        
        const finalPrice = productPrice + fee;
        finalPriceEl.textContent = `Rp ${formatRupiah(finalPrice)}`;

        // --- PERBAIKAN DI SINI ---
        // Bandingkan harga coret dengan harga jual yang baru (productPrice)
        if (selectedProduct.discount && parseFloat(selectedProduct.discount) > productPrice) {
            const originalPrice = (parseFloat(selectedProduct.discount) || 0) + fee;
            originalPriceEl.textContent = `Rp ${formatRupiah(originalPrice)}`;
            originalPriceEl.style.display = 'inline';
        } else {
            originalPriceEl.style.display = 'none';
        }
    });
}

// --- LOGIKA STICKY FOOTER ---
function setupStickyFooterObserver() { 
    const stickyFooter = document.querySelector('.sticky-order-footer');
    const siteFooter = document.querySelector('.site-footer');
    if (!stickyFooter || !siteFooter) return;

    const checkPosition = () => {
        const siteFooterRect = siteFooter.getBoundingClientRect();
        if (siteFooterRect.top < window.innerHeight) {
            const GAP_ATAS_FOOTER = 75; // Spasi 80px
            stickyFooter.classList.add('stop-sticky');
            const topPosition = window.scrollY + siteFooterRect.top - stickyFooter.offsetHeight - GAP_ATAS_FOOTER;
            stickyFooter.style.top = `${topPosition}px`;
        } else {
            stickyFooter.classList.remove('stop-sticky');
            stickyFooter.style.top = '';
        }
    };
    window.addEventListener('scroll', checkPosition);
    window.addEventListener('resize', checkPosition);
    checkPosition();
 }

function updateStickyFooter() { 
    const footer = document.querySelector('.sticky-order-footer');
    if (!footer) return;

    const summaryEl = document.getElementById('footer-item-summary');
    const priceEl = document.getElementById('footer-total-price');
    const buyButton = footer.querySelector('.btn-submit-order');

    if (selectedProduct && selectedPayment) {
        // --- JIKA SUDAH LENGKAP ---
        const productPrice = selectedProduct.price_sell ? parseFloat(selectedProduct.price_sell) : (parseFloat(selectedProduct.price) || 0);
        const finalPrice = productPrice + (parseFloat(selectedPayment.fee) || 0);
        summaryEl.textContent = `${selectedProduct.product_name} via ${selectedPayment.name}`;
        priceEl.textContent = `Rp ${formatRupiah(finalPrice)}`;
        buyButton.disabled = false;

        // MUNCULKAN FOOTER
        footer.classList.remove('is-hidden');

    } else {
        // --- JIKA BELUM LENGKAP ---
        summaryEl.textContent = 'Pilih item dan pembayaran';
        priceEl.textContent = 'Rp -';
        buyButton.disabled = true;

        // SEMBUNYIKAN FOOTER
        footer.classList.add('is-hidden');
    }
 }

// --- LOGIKA MODAL PEMBAYARAN ---
function showPaymentModal(data) { 
    const paymentModal = document.getElementById('paymentModal');
    document.getElementById('payment-id').textContent = data.reference;
    document.getElementById('payment-item').textContent = data.order_items[0].name;
    document.getElementById('payment-total').textContent = `Rp ${formatRupiah(data.amount)}`;
    document.getElementById('payment-method').textContent = data.payment_name;

    const qrContainer = document.getElementById('qr-code-container');
    const qrImage = document.getElementById('payment-qr-code');
    const paymentButton = document.getElementById('payment-action-button');
    const instructionText = document.getElementById('instruction-text');

    if (data.qr_url) {
        instructionText.textContent = 'Scan QR Code di bawah ini.';
        qrImage.src = data.qr_url;
        qrContainer.style.display = 'block';
        paymentButton.style.display = 'none';
    } else {
        instructionText.textContent = `Klik tombol di bawah untuk membayar dengan ${data.payment_name}.`;
        paymentButton.href = data.checkout_url;
        paymentButton.style.display = 'inline-block';
        qrContainer.style.display = 'none';
    }

    paymentModal.style.display = 'flex';

    // --- BAGIAN BARU UNTUK REAL-TIME NOTIFICATION ---

    console.log(`Frontend bergabung ke room notifikasi untuk: ${data.reference}`);
    socket.emit('join_transaction_room', data.reference);

    socket.on('payment_success', (payload) => {
        console.log("✅ Pesan dari server: Pembayaran Berhasil!", payload);
        const modalBody = document.querySelector('#paymentModal .payment-modal-body');
        modalBody.innerHTML = `
            <div style="text-align: center;">
                <h2 style="color: #ccff00;">Pembayaran Berhasil!</h2>
                <p>Terima kasih, pesananmu sedang diproses.</p>
                <p>ID Transaksi: <strong>${data.reference}</strong></p>
            </div>`;
    });

    socket.on('payment_failed', (payload) => {
        console.error("❌ Pesan dari server: Pembayaran Gagal!", payload);
        const modalBody = document.querySelector('#paymentModal .payment-modal-body');
        modalBody.innerHTML = `
            <div style="text-align: center;">
                <h2 style="color: #e74c3c;">Proses Pesanan Gagal</h2>
                <p>Pembayaranmu berhasil, namun pesanan gagal diproses oleh supplier.</p>
                <p style="font-size: 0.8rem; color: #8a918a;">Pesan: ${payload.message || 'Error tidak diketahui'}</p>
            </div>`;
    });
 }

function setupUserValidation() { 
    const resultContainer = document.getElementById('user-check-result');
    if (!resultContainer) return;
    const gameDescription = document.getElementById("game-description").textContent || "Silakan masukkan User ID Anda.";
    resultContainer.innerHTML = `<p class="info-text">${gameDescription}</p>`;
    resultContainer.className = 'user-check-result info';
 }

// --- UTILITAS ---
function formatRupiah(number) { 
    if (number === null || number === undefined) return '';
    return Math.round(Number(number)).toLocaleString('id-ID');
 }

function debounce(func, delay) { let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
 }