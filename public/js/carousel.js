// File: public/js/carousel.js

document.addEventListener('DOMContentLoaded', () => {
    // =======================================================
    // DEFINISI ELEMEN (SUDAH DISESUAIKAN)
    // =======================================================
    const tableBody = document.getElementById('carouselTableBody');
    const addCarouselBtn = document.querySelector('.carousel-management #addCarouselBtn');
    const carouselModal = document.getElementById('carouselModal');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const carouselForm = document.getElementById('carouselForm');
    const modalTitle = document.getElementById('carouselModalTitle');
    const closeModalBtn = carouselModal.querySelector('.modal__close-btn');
    let allSlides = [];
    let sortable;

    async function loadAndDisplayCarousel() {
        try {
            const response = await fetch('/api/carousel');
            if (!response.ok) throw new Error('Gagal mengambil data dari server.');
            const result = await response.json();

            if (result.success) {
                allSlides = result.data;
                tableBody.innerHTML = '';
                allSlides.forEach(item => {
                    const row = document.createElement('tr');
                    row.dataset.id = item.id;
                    row.innerHTML = `
                        <td><input type="checkbox" class="row-checkbox" value="${item.id}"></td>
                        <td>${item.display_order}</td>
                        <td><img src="/images/carousel/${item.image_filename}" alt="${item.image_filename}" class="table-img-preview"></td>
                        <td>${item.image_filename}</td>
                        <td>${item.link_url || '-'}</td>
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
        } catch (error) {
            console.error('Gagal memuat carousel:', error);
            tableBody.innerHTML = '<tr><td colspan="5">Terjadi kesalahan koneksi.</td></tr>';
        }
    }

    // --- EVENT LISTENERS ---

    addCarouselBtn.addEventListener('click', () => {
        carouselForm.reset();
        modalTitle.textContent = 'Tambah Gambar Carousel';
        carouselForm.formMode.value = 'add';
        carouselForm.imageFile.required = true;
        carouselModal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', () => {
        carouselModal.style.display = 'none';
    });

    carouselForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = carouselForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';

        const formData = new FormData(carouselForm);
        const mode = formData.get('formMode');
        let url = '/api/carousel';
        let method = 'POST';

        if (mode === 'edit') {
            const slideId = formData.get('slideId');
            url = `/api/carousel/${slideId}`;
            method = 'PUT';
        }

        try {
            const response = await fetch(url, { method: method, body: formData });
            const result = await response.json();
            alert(result.message);
            if (result.success) {
                carouselModal.style.display = 'none';
                loadAndDisplayCarousel();
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Terjadi kesalahan saat mengirim data.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Simpan';
        }
    });

    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit');
        const deleteBtn = e.target.closest('.btn-delete');

        if (editBtn) {
            // PERBAIKAN: Ambil ID dari baris (tr) terdekat
            const slideId = editBtn.closest('tr').dataset.id;
            const slideData = allSlides.find(s => s.id === Number(slideId));

            if (slideData) {
                carouselForm.reset();
                modalTitle.textContent = 'Edit Gambar Carousel';
                carouselForm.formMode.value = 'edit';
                carouselForm.slideId.value = slideData.id;
                carouselForm.link_url.value = slideData.link_url || '';
                carouselForm.oldImage.value = slideData.image_filename;
                carouselForm.imageFile.required = false;
                carouselModal.style.display = 'block';
            }
        }

        if (deleteBtn) {
            // PERBAIKAN: Ambil ID dari baris (tr) terdekat
            const slideId = deleteBtn.closest('tr').dataset.id;
            if (confirm(`Yakin ingin menghapus slide ini?`)) {
                fetch(`/api/carousel/${slideId}`, { method: 'DELETE' })
                    .then(response => {
                        if (!response.ok) throw new Error('Respons server tidak baik.');
                        return response.json();
                    })
                    .then(result => {
                        alert(result.message);
                        // PERBAIKAN: Pastikan nama fungsi benar
                        if (result.success) loadAndDisplayCarousel();
                    })
                    .catch(err => {
                        console.error("Delete error:", err);
                        alert('Gagal menghapus data.');
                        loadAndDisplayCarousel();
                    });
            }
        }
    });

    // --- INISIALISASI FITUR DRAG & DROP ---
    Sortable.create(tableBody, {
        animation: 150,
        handle: 'tr',
        onEnd: async (evt) => {
            const rows = Array.from(tableBody.querySelectorAll('tr'));
            const newOrder = rows.map(row => row.dataset.id);

            try {
                const response = await fetch('/api/carousel/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order: newOrder })
                });
                const result = await response.json();
                if (result.success) {
                    // Refresh tabel untuk menampilkan display_order yang baru dari server
                    loadAndDisplayCarousel();
                } else {
                    alert('Gagal menyimpan urutan baru.');
                    loadAndDisplayCarousel();
                }
            } catch (error) {
                alert('Terjadi kesalahan saat menyimpan urutan.');
                loadAndDisplayCarousel();
            }
        }
    });

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

        if (confirm(`Yakin ingin menghapus ${idsToDelete.length} item yang dipilih?`)) {
            try {
                const response = await fetch('/api/carousel/bulk-delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: idsToDelete })
                });
                const result = await response.json();
                alert(result.message);
                if (result.success) {
                    loadCarousels(); // Pastikan nama fungsi pemuat datamu adalah loadCarousels
                }
            } catch (error) {
                alert('Terjadi kesalahan saat menghapus data.');
            }
        }
    });

    // --- PEMANGGILAN FUNGSI AWAL ---
    loadAndDisplayCarousel();
});