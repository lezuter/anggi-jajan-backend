// File: public/js/transactions.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DEKLARASI ELEMEN ---
    const tableBody = document.getElementById('transactionsTableBody');
    const refreshBtn = document.getElementById('refreshBtn');
    const limitSelect = document.getElementById('limitSelect');
    const paginationControls = document.getElementById('paginationControls');
    const filterControls = document.getElementById('filterControls');

    // --- STATE ---
    let currentPage = 1;
    let limit = 25;
    let currentFilter = 'all';

    function formatRupiah(number) {
        return `Rp ${Number(number).toLocaleString('id-ID')}`;
    }

    function renderStatus(status) {
        let className = '';
        switch (status) {
            case 'SUCCESS': className = 'status-badge active'; break;
            case 'PENDING': className = 'status-badge pending'; break;
            case 'FAILED': className = 'status-badge inactive'; break;
            default: className = 'status-badge';
        }
        return `<span class="${className}">${status}</span>`;
    }

    // Fungsi loadTransactions yang sudah diperbarui
    async function loadTransactions() {
        try {
            const response = await fetch(`/api/transactions?page=${currentPage}&limit=${limit}&filter=${currentFilter}`);
            const result = await response.json();
            if (result.success) {
                tableBody.innerHTML = '';
                result.data.forEach(tx => {
                    const row = document.createElement('tr');
                    row.dataset.ref = tx.merchant_ref;
                    const createdByCell = tx.created_by
                        ? `<span class="created-by-admin">${tx.created_by}</span>`
                        : 'Pelanggan';
                    row.innerHTML = `
                    <td>${tx.merchant_ref}</td>
                    <td>${tx.product_name || tx.product_code}</td>
                    <td>${tx.user_id}</td>
                    <td>${formatRupiah(tx.total_amount)}</td>
                    <td>${renderStatus(tx.status)}</td>
                    <td>${createdByCell}</td>
                    <td>${new Date(tx.created_at).toLocaleString('id-ID')}</td>
                    <td class="sn-cell">${tx.sn || '-'}</td>
                    <td class="message-cell">${tx.message || '-'}</td>
                `;
                    tableBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error("Gagal memuat transaksi:", error);
        }
    }

    // Fungsi untuk membuat tombol halaman
    function renderPagination({ currentPage, totalPages }) {
        if (!paginationControls) return;
        paginationControls.innerHTML = '';
        if (totalPages <= 1) return;

        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-secondary';
        prevBtn.textContent = '<';
        if (currentPage === 1) prevBtn.disabled = true;
        prevBtn.addEventListener('click', () => {
            currentPage--;
            loadTransactions();
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
            loadTransactions();
        });
        paginationControls.appendChild(nextBtn);
    }

    // --- EVENT LISTENERS ---
    refreshBtn.addEventListener('click', loadTransactions);

    if (limitSelect) {
        limitSelect.addEventListener('change', (e) => {
            limit = parseInt(e.target.value);
            currentPage = 1;
            loadTransactions();
        });
    }

    // EVENT LISTENER BARU UNTUK TOMBOL FILTER
    if (filterControls) {
        filterControls.addEventListener('click', (e) => {
            const filterBtn = e.target.closest('button');
            if (!filterBtn) return;

            // Hapus kelas 'active' dari semua tombol
            filterControls.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            // Tambahkan kelas 'active' ke tombol yang diklik
            filterBtn.classList.add('active');

            // Update state dan muat ulang data
            currentFilter = filterBtn.dataset.filter;
            currentPage = 1;
            loadTransactions();
        });
    }

    // --- LOGIKA REAL-TIME SOCKET.IO ---
    const socket = io();
    socket.on('admin_notification', (data) => {
        loadTransactions();
    });

    // --- INISIALISASI ---
    loadTransactions();
});