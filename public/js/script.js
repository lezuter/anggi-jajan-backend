// =================================================================
// ## SCRIPT UTAMA DENGAN CAROUSEL & KONTEN DINAMIS ##
// =================================================================

// Fungsi global untuk Sidebar
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
    }
}

// FUNGSI BARU: Untuk memuat gambar carousel dari API
async function loadAndDisplayCarousel() {
    const carouselTrack = document.querySelector(".carousel-track");
    const carouselDots = document.querySelector(".carousel-dots");
    if (!carouselTrack || !carouselDots) return;

    try {
        const response = await fetch('/api/carousel/public');
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            // Hapus isi carousel yang lama (hardcoded)
            carouselTrack.innerHTML = '';
            carouselDots.innerHTML = '';

            // Buat elemen gambar dan dot baru dari data API
            result.data.forEach(slide => {
                const img = document.createElement('img');
                img.src = `/images/carousel/${slide.image_filename}`;
                img.className = 'carousel-image';
                carouselTrack.appendChild(img);

                const dot = document.createElement('span');
                dot.className = 'dot';
                carouselDots.appendChild(dot);
            });

            // Setelah gambar dimuat, jalankan logika slider
            initializeCarousel();
        }
    } catch (error) {
        console.error('Error loading carousel:', error);
    }
}


// FUNGSI BARU: Untuk menginisialisasi logika slider
function initializeCarousel() {
    const carouselTrack = document.querySelector(".carousel-track");
    if (!carouselTrack) return; // Keluar jika elemen tidak ditemukan

    const slides = document.querySelectorAll(".carousel-image");
    const dots = document.querySelectorAll(".dot");
    const prevBtn = document.querySelector(".carousel-btn.prev");
    const nextBtn = document.querySelector(".carousel-btn.next");

    if (slides.length === 0) return; // Jangan jalankan jika tidak ada slide

    let current = 0;
    let interval;

    function updateCarousel() {
        if (carouselTrack) {
            carouselTrack.style.transform = `translateX(-${current * 100}%)`;
        }
        dots.forEach((dot, i) => dot.classList.toggle("active", i === current));
    }

    function nextSlide() {
        current = (current + 1) % slides.length;
        updateCarousel();
    }

    function startAutoSlide() {
        stopAutoSlide(); // Hentikan interval lama sebelum memulai yang baru
        interval = setInterval(nextSlide, 4000);
    }

    function stopAutoSlide() {
        clearInterval(interval);
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            stopAutoSlide();
            nextSlide();
            startAutoSlide();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            stopAutoSlide();
            current = (current - 1 + slides.length) % slides.length;
            updateCarousel();
            startAutoSlide();
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            stopAutoSlide();
            current = index;
            updateCarousel();
            startAutoSlide();
        });
    });

    // Inisialisasi tampilan pertama
    if (dots.length > 0) {
        dots[0].classList.add('active');
    }
    updateCarousel();
    startAutoSlide();
}


// Fungsi untuk menampilkan semua konten dinamis (Game Cards)
async function displayContent() {
    const mainContentArea = document.querySelector('main');
    if (!mainContentArea) return;

    // Simpan elemen banner yang ada agar tidak terhapus
    const banner = mainContentArea.querySelector('.banner');

    const cardWidth = 206;
    const gap = 16;
    const sectionWidth = 1350;
    const cardsPerRow = Math.floor((sectionWidth + gap) / (cardWidth + gap));
    const initialLimit = cardsPerRow * 2;
    const increment = cardsPerRow * 2;

    try {
        const response = await fetch('/api/sections');
        const result = await response.json();

        if (result.success) {
            // Hapus semua konten kecuali banner
            mainContentArea.innerHTML = '';
            if (banner) mainContentArea.appendChild(banner);

            result.data.forEach(section => {
                if (section.games.length === 0) return;

                const sectionElement = document.createElement('div');
                sectionElement.className = 'game-section';

                const titleElement = document.createElement('h2');
                titleElement.textContent = section.sectionName;
                sectionElement.appendChild(titleElement);

                const gridElement = document.createElement('div');
                gridElement.className = 'game-grid';

                section.games.forEach((game, index) => {
                    const card = document.createElement('a'); 
card.className = 'game-card';
card.href = `/order/${game.slug}`; // <-- pakai slug dari API

if (index >= initialLimit) {
    card.style.display = 'none';
    card.classList.add('hidden-card');
}

const imageUrl = game.image ? `/images/card/${game.image}` : '';

card.innerHTML = `
    <img src="${imageUrl}" alt="${game.name}" class="card-image" />
    <div class="card-overlay">
        <h3 class="card-title">${game.name}</h3>
    </div>
`;

                    gridElement.appendChild(card);
                });

                sectionElement.appendChild(gridElement);

                if (section.games.length > initialLimit) {
                    const showMoreBtn = document.createElement('button');
                    showMoreBtn.textContent = 'Tampilkan Lainnya';
                    showMoreBtn.className = 'btn-show-more';

                    showMoreBtn.addEventListener('click', () => {
                        const hiddenCards = gridElement.querySelectorAll('.hidden-card');
                        let shownCount = 0;
                        for (let i = 0; i < hiddenCards.length; i++) {
                            if (shownCount < increment) {
                                hiddenCards[i].style.display = 'block';
                                hiddenCards[i].classList.remove('hidden-card');
                                shownCount++;
                            }
                        }
                        if (gridElement.querySelectorAll('.hidden-card').length === 0) {
                            showMoreBtn.style.display = 'none';
                        }
                    });
                    sectionElement.appendChild(showMoreBtn);
                }
                mainContentArea.appendChild(sectionElement);
            });
        } else {
            mainContentArea.innerHTML += '<p style="color: white;">Gagal memuat data game.</p>';
        }
    } catch (error) {
        console.error('Error fetching content:', error);
        mainContentArea.innerHTML += '<p style="color: white;">Terjadi kesalahan saat menyambung ke server.</p>';
    }
}

// Event listener utama
document.addEventListener('DOMContentLoaded', function () {
    
    // --- SEMUA KODE DI BAWAH INI HARUS BERADA DI DALAM LISTENER INI ---

    if (document.querySelector('.carousel-track')) {
        displayContent(); 
        loadAndDisplayCarousel();
    }

    // --- Deklarasi Variabel Elemen ---
    const loading = document.getElementById('loading');
    const cookiePopup = document.getElementById('cookiePopup');
    const acceptBtn = document.getElementById('acceptCookie');
    const overlay = document.getElementById('sidebar-overlay');
    const searchIcon = document.getElementById('searchIcon');
    const searchInput = document.getElementById('searchInput');
    const hamburgerBtn = document.querySelector('.hamburger');
    const sidebar = document.getElementById('sidebar'); // Pertama, kita temukan sidebar-nya
const closeBtn = sidebar ? sidebar.querySelector('.close-btn') : null; // Lalu, kita cari tombol close DI DALAM sidebar itu
    const profileContainer = document.querySelector('.right-nav .profile');
    
    const userLoginModal = document.getElementById('userLoginModal');
    const userLoginForm = document.getElementById('userLoginForm');
    const userLoginMessage = document.getElementById('userLoginMessage');
    const closeModalBtn = userLoginModal ? userLoginModal.querySelector('.close-btn') : null;

    const token = localStorage.getItem('authToken');
    const userName = localStorage.getItem('userName');
    
    // --- Logika Modal Login User ---
    if (userLoginModal) {
        // Logika untuk menutup modal
        if(closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                userLoginModal.style.display = 'none';
            });
        }

        // Logika untuk mengirim form login
        if(userLoginForm) {
            userLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if(userLoginMessage) userLoginMessage.textContent = '';
                
                const formData = new FormData(userLoginForm);
                const data = Object.fromEntries(formData.entries());

                try {
                    const response = await fetch('/api/auth/login/user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();

                    if (result.success) {
                        localStorage.setItem('authToken', result.token);
                        localStorage.setItem('userName', result.userName);
                        window.location.reload();
                    } else {
                        if(userLoginMessage) userLoginMessage.textContent = result.message;
                    }
                } catch (err) {
                    if(userLoginMessage) userLoginMessage.textContent = 'Terjadi kesalahan koneksi.';
                }
            });
        }
    }

    // --- Logika Status Login di Navbar ---
    if (token && userName && profileContainer) {
        // JIKA SUDAH LOGIN: Tampilkan nama & tombol logout
        profileContainer.innerHTML = `
        <div class="profile-info">
            <span>Hi, ${userName}!</span>
            <button id="logout-btn" style="background:none; border:none; color:#ccff00; cursor:pointer;">Logout</button>
        </div>
        `;
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('userRole');
            window.location.href = '/id';
        });
    } else if (profileContainer) {
        // JIKA BELUM LOGIN: Jadikan ikon profil tombol untuk buka modal
        profileContainer.addEventListener('click', (e) => {
            e.preventDefault();
            if (userLoginModal) {
                userLoginModal.style.display = 'flex';
            } else {
                // Fallback jika modal tidak ada, arahkan ke halaman login admin
                window.location.href = '/login';
            }
        });
    }

    // --- Event Listeners Lainnya (Sidebar, Cookie, Search) ---
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleMenu);
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', toggleMenu);
    }
    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }

    if (loading) {
        loading.style.display = 'flex';
        setTimeout(function () {
            loading.style.display = 'none';
            if (cookiePopup && !localStorage.getItem('cookieAccepted')) {
                cookiePopup.classList.add('show');
            }
        }, 1000); // Durasi loading bisa disesuaikan
    }
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function () {
            localStorage.setItem('cookieAccepted', 'true');
            cookiePopup.classList.remove('show');
        });
    }
    
    if (searchIcon) {
        searchIcon.addEventListener('click', () => {
            searchInput.classList.toggle('show');
            if (searchInput.classList.contains('show')) {
                searchInput.focus();
            }
        });
    }
    document.addEventListener('click', function (e) {
        if (searchInput && searchIcon && !searchInput.contains(e.target) && !searchIcon.contains(e.target)) {
            searchInput.classList.remove('show');
        }
    });
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const keyword = searchInput.value.toLowerCase();
            const allGameCards = document.querySelectorAll('.game-card');
            allGameCards.forEach(card => {
                const title = card.querySelector('img')?.alt.toLowerCase() || '';
                if (title.includes(keyword)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

});