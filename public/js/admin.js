// File: public/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DEKLARASI ELEMEN ---
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn'); // Asumsi ID tombol collapse
    const logoutBtn = document.getElementById('logoutBtn');
    const saldoElement = document.getElementById('digiflazzSaldo');

    // --- FUNGSI UNTUK MENGAMBIL & MENAMPILKAN SALDO ---
    async function fetchAndDisplayBalance() {
        if (!saldoElement) return;
        try {
            const response = await fetch('/api/admin/balance');
            const result = await response.json();
            if (result.success) {
                const formattedBalance = `Rp ${Number(result.balance).toLocaleString('id-ID')}`;
                saldoElement.textContent = formattedBalance;
                saldoElement.style.color = 'var(--primary-green)';
            } else {
                saldoElement.textContent = 'Gagal';
                saldoElement.style.color = 'var(--danger-red)';
            }
        } catch (error) {
            console.error('Gagal fetch saldo:', error);
            saldoElement.textContent = 'Error';
            saldoElement.style.color = 'var(--danger-red)';
        }
    }

    // --- LOGIKA UNTUK COLLAPSE/EXPAND SIDEBAR ---
    if (toggleBtn && sidebar) {
        // Cek apakah ada status tersimpan di localStorage
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }

        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            // Simpan status ke localStorage
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }

    // --- Logika untuk menandai link sidebar yang aktif ---
    // --- Logika untuk menandai link sidebar yang aktif (Versi Otomatis) ---
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    let bestMatch = null;

    // 1. Loop semua link untuk mencari yang paling cocok
    sidebarLinks.forEach(link => {
        const linkHref = link.getAttribute('href');

        // 2. Cek apakah URL saat ini DIMULAI dengan href dari link
        if (currentPath.startsWith(linkHref)) {

            // 3. Simpan link yang paling panjang/spesifik
            if (!bestMatch || linkHref.length > bestMatch.getAttribute('href').length) {
                bestMatch = link;
            }
        }
    });

    // 4. Hapus 'active' dari SEMUA link terlebih dahulu untuk bersih-bersih
    sidebarLinks.forEach(link => link.classList.remove('active'));

    // 5. Aktifkan HANYA link terbaik yang kita temukan
    if (bestMatch) {
        bestMatch.classList.add('active');
    }

    // --- LOGIKA UNTUK TOMBOL LOGOUT ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
            } catch (err) {
                console.error('Logout gagal:', err);
                alert('Gagal untuk logout.');
            }
        });
    }

    // =================================
    // LOGIKA ANIMASI INDIKATOR SIDEBAR
    // =================================

    function moveSidebarIndicator() {
        const indicator = document.getElementById('sidebar-active-indicator');
        // PENTING: Cari <li> pembungkus dari link yang aktif
        const activeListItem = document.querySelector('.sidebar-link.active')?.closest('li');

        if (indicator && activeListItem) {
            // Ambil posisi dan ukuran <li> yang aktif
            const topPos = activeListItem.offsetTop;
            const height = activeListItem.offsetHeight;

            // Pindahkan dan sesuaikan ukuran indikator
            indicator.style.top = `${topPos}px`;
            indicator.style.height = `${height}px`;
            indicator.style.opacity = '1';
        } else if (indicator) {
            indicator.style.opacity = '0';
        }
    }

    // Panggil fungsi saat halaman pertama kali dimuat
    // Kita beri sedikit jeda agar semua elemen siap
    setTimeout(moveSidebarIndicator, 100);

    // Panggil fungsi setiap kali HTMX selesai menukar konten
    document.body.addEventListener('htmx:afterSwap', function () {
        // Logika untuk menandai link aktif (dari kodemu yang lama)
        const currentPath = window.location.pathname;
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        let bestMatch = null;

        sidebarLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (currentPath.startsWith(linkHref)) {
                if (!bestMatch || linkHref.length > bestMatch.getAttribute('href').length) {
                    bestMatch = link;
                }
            }
        });

        sidebarLinks.forEach(link => link.classList.remove('active'));
        if (bestMatch) {
            bestMatch.classList.add('active');
        }

        // Setelah class 'active' di-update, baru kita gerakkan indikatornya
        moveSidebarIndicator();
    });

    // Panggil fungsi untuk memuat saldo saat halaman dimuat
    fetchAndDisplayBalance();

});

