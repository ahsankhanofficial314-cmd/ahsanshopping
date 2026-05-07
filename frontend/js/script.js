/**
 * AhsanShopping - Professional Full Stack Script
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Navbar Scroll Effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- 2. Hero Slider ---
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.querySelector('.slider-dots');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    let slideInterval;

    if (slides.length > 0) {
        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });

        const dots = document.querySelectorAll('.dot');

        function updateSlider() {
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSlider();
        }

        function prevSlideFunc() {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateSlider();
        }

        function goToSlide(index) {
            currentSlide = index;
            updateSlider();
            resetInterval();
        }

        function startInterval() {
            slideInterval = setInterval(nextSlide, 4000);
        }

        function resetInterval() {
            clearInterval(slideInterval);
            startInterval();
        }

        nextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });
        prevBtn.addEventListener('click', () => { prevSlideFunc(); resetInterval(); });
        startInterval();
    }

    // --- 3. Dynamic Products, Filtering & Search ---
    const filterGrid = document.getElementById('filterGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('searchInput');
    let allProducts = [];

    async function loadProducts() {
        try {
        const res = await fetch(`${API_BASE}/api/products`);
            allProducts = await res.json();
            renderProducts(allProducts);
        } catch (error) {
            filterGrid.innerHTML = '<p class="text-center w-100" style="grid-column: 1/-1;">Failed to load products. Make sure the backend server is running.</p>';
            alert("Error loading products: " + error.message);
        }
    }

    function renderProducts(products) {
        if (products.length === 0) {
            filterGrid.innerHTML = '<p class="text-center w-100" style="grid-column: 1/-1;">No products found.</p>';
            return;
        }

        filterGrid.innerHTML = products.map(product => {
            const isFav = wishlist.some(p => p.id === product.id);
            return `
                <div class="product-item" data-category="${product.category}">
                    <div class="img-wrapper">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-details">
                        <h4>${product.name}</h4>
                        <p class="price">$${product.price.toFixed(2)}</p>
                        <button class="btn outline-btn view-details-btn mt-1 w-100" data-id="${product.id}">Details</button>
                        <button class="add-to-cart" data-id="${product.id}"><i class="fa-solid fa-plus"></i></button>
                        <button class="wishlist-toggle ${isFav ? 'active' : ''}" data-id="${product.id}">
                            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach event listeners
        document.querySelectorAll('.add-to-cart').forEach(btn => btn.addEventListener('click', addToCart));
        document.querySelectorAll('.view-details-btn').forEach(btn => btn.addEventListener('click', viewProductDetails));
        document.querySelectorAll('.wishlist-toggle').forEach(btn => btn.addEventListener('click', toggleWishlist));
    }

    // Search Logic
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allProducts.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.category.toLowerCase().includes(query)
        );
        renderProducts(filtered);

        // Scroll to results if something is typed
        if (query.length > 0) {
            const productSection = document.getElementById('products-filter-section');
            if (productSection) {
                productSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    // Category Filtering
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-filter');
            applyFilter(category);
        });
    });

    function applyFilter(category) {
        if (category === 'all') {
            renderProducts(allProducts);
        } else {
            const filtered = allProducts.filter(p => p.category === category);
            renderProducts(filtered);
        }
    }

    // Navbar Navigation Filtering
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#') && href.length > 1) {
                const category = href.substring(1);
                const validCategories = ['men', 'women', 'kids', 'beauty'];
                if (validCategories.includes(category)) {
                    e.preventDefault();
                    document.getElementById('new-arrivals').scrollIntoView({ behavior: 'smooth' });
                    // Update filter buttons UI
                    filterBtns.forEach(btn => {
                        if (btn.getAttribute('data-filter') === category) {
                            btn.click();
                        }
                    });
                }
            }
        });
    });

    loadProducts().then(() => {
        // After dynamic products load, also check for static ones in the HTML
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.removeEventListener('click', viewProductDetails); // avoid double
            btn.addEventListener('click', viewProductDetails);
        });
    });

    // --- 4. Cart Drawer Logic ---
    let cart = [];
    const cartBtn = document.querySelector('.cart-btn');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartDrawer = document.getElementById('cartDrawer');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    const cartCountElement = document.querySelector('.cart-count');

    function toggleCart() {
        cartOverlay.classList.toggle('active');
        cartDrawer.classList.toggle('active');
        renderCart();
    }

    cartBtn.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    function addToCart(e) {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        const product = allProducts.find(p => p.id === id);
        if (product) {
            cart.push(product);
            updateCartUI();
            toggleCart();
        }
    }

    function updateCartUI() {
        cartCountElement.textContent = cart.length;
        cartCountElement.style.transform = 'scale(1.5)';
        setTimeout(() => cartCountElement.style.transform = 'scale(1)', 200);
    }

    window.removeFromCart = function(index) {
        cart.splice(index, 1);
        updateCartUI();
        renderCart();
    }

    function renderCart() {
        if (cart.length === 0) {
            cartItemsList.innerHTML = '<p class="empty-cart-msg">Your cart is empty.</p>';
            cartTotalPrice.textContent = '$0.00';
            return;
        }

        let total = 0;
        cartItemsList.innerHTML = cart.map((item, index) => {
            total += item.price;
            return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <button class="cart-item-remove" onclick="removeFromCart(${index})">Remove</button>
                    </div>
                </div>
            `;
        }).join('');

        cartTotalPrice.textContent = `$${total.toFixed(2)}`;
    }

    // --- 5. Wishlist Logic ---
    let wishlist = JSON.parse(localStorage.getItem('ahsanWishlist')) || [];
    const wishlistBtn = document.getElementById('wishlistBtn');
    const wishlistModal = document.getElementById('wishlistModalOverlay');
    const closeWishlistBtn = document.getElementById('closeWishlistBtn');
    const wishlistItemsList = document.getElementById('wishlistItemsList');
    const wishCountElement = document.querySelector('.wish-count');

    function updateWishlistUI() {
        wishCountElement.textContent = wishlist.length;
        localStorage.setItem('ahsanWishlist', JSON.stringify(wishlist));
    }

    function toggleWishlist(e) {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        const index = wishlist.findIndex(p => p.id === id);
        
        if (index === -1) {
            const product = allProducts.find(p => p.id === id);
            if (product) wishlist.push(product);
        } else {
            wishlist.splice(index, 1);
        }
        
        updateWishlistUI();
        renderProducts(allProducts); // Refresh to update icons
    }

    wishlistBtn.addEventListener('click', () => {
        renderWishlist();
        wishlistModal.classList.add('active');
    });

    closeWishlistBtn.addEventListener('click', () => wishlistModal.classList.remove('active'));

    function renderWishlist() {
        if (wishlist.length === 0) {
            wishlistItemsList.innerHTML = '<p class="empty-msg text-center mt-3">Your wishlist is empty.</p>';
            return;
        }

        wishlistItemsList.innerHTML = `
            <div class="product-grid">
                ${wishlist.map(product => `
                    <div class="product-item">
                        <div class="img-wrapper">
                            <img src="${product.image}" alt="${product.name}">
                        </div>
                        <div class="product-details">
                            <h4>${product.name}</h4>
                            <p class="price">$${product.price.toFixed(2)}</p>
                            <button class="btn outline-btn w-100 mt-1 remove-wish" data-id="${product.id}">Remove</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        document.querySelectorAll('.remove-wish').forEach(btn => {
            btn.addEventListener('click', (e) => {
                toggleWishlist(e);
                renderWishlist();
            });
        });
    }

    updateWishlistUI();

    // --- 6. Product Details Modal ---
    const detailsModal = document.getElementById('detailsModalOverlay');
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');
    const detailsContent = document.getElementById('detailsContent');

    function viewProductDetails(e) {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        const product = allProducts.find(p => p.id === id);
        
        if (product) {
            detailsContent.innerHTML = `
                <div class="details-img">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="details-info">
                    <h2>${product.name}</h2>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <p class="mb-3">${product.description || 'A premium quality fashion item from AhsanShopping. Designed with elegance and comfort in mind.'}</p>
                    <p class="mb-3"><strong>Category:</strong> <span style="text-transform:capitalize;">${product.category}</span></p>
                    <button class="btn primary-btn w-100" id="detailsAddToCart" data-id="${product.id}">Add to Cart</button>
                </div>
            `;
            detailsModal.classList.add('active');

            document.getElementById('detailsAddToCart').addEventListener('click', (e) => {
                addToCart(e);
                detailsModal.classList.remove('active');
            });
        }
    }

    closeDetailsBtn.addEventListener('click', () => detailsModal.classList.remove('active'));

    // --- 7. Checkout Flow ---
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutModal = document.getElementById('checkoutModalOverlay');
    const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
    const checkoutFormWrapper = document.getElementById('checkoutFormWrapper');
    const checkoutLoading = document.getElementById('checkoutLoading');
    const checkoutSuccess = document.getElementById('checkoutSuccess');
    const checkoutForm = document.getElementById('checkoutForm');
    const successOrderId = document.getElementById('successOrderId');
    let selectedMethod = 'Credit Card';

    document.querySelectorAll('.open-checkout').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedMethod = e.currentTarget.getAttribute('data-method');
            openCheckout();
        });
    });

    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }
        cartDrawer.classList.remove('active');
        cartOverlay.classList.remove('active');
        openCheckout();
    });

    function openCheckout() {
        checkoutFormWrapper.style.display = 'block';
        checkoutLoading.style.display = 'none';
        checkoutSuccess.style.display = 'none';
        document.getElementById('checkoutTitle').textContent = `Checkout`;
        checkoutModal.classList.add('active');
    }

    closeCheckoutBtn.addEventListener('click', () => checkoutModal.classList.remove('active'));
    document.getElementById('closeSuccessBtn').addEventListener('click', () => checkoutModal.classList.remove('active'));

    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const methodSelect = document.getElementById('paymentMethod');
        const finalMethod = methodSelect ? methodSelect.value : 'Credit Card';
        
        checkoutFormWrapper.style.display = 'none';
        checkoutLoading.style.display = 'block';

        try {
            const res = await fetch(`${API_BASE}/api/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart, method: finalMethod })
            });
            const data = await res.json();
            
            if (data.success) {
                checkoutLoading.style.display = 'none';
                checkoutSuccess.style.display = 'block';
                successOrderId.textContent = data.orderId;
                cart = [];
                updateCartUI();
                renderCart();
            }
        } catch (err) {
            alert("Payment failed. Please try again.");
            openCheckout();
        }
    });

    // View All Products Button
    document.querySelectorAll('.view-all-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('products-filter-section').scrollIntoView({ behavior: 'smooth' });
            const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
            if (allBtn) allBtn.click();
        });
    });

    // View Category Specific Buttons
    document.querySelectorAll('.view-cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cat = btn.getAttribute('data-cat');
            document.getElementById('products-filter-section').scrollIntoView({ behavior: 'smooth' });
            const filterBtn = document.querySelector(`.filter-btn[data-filter="${cat}"]`);
            if (filterBtn) filterBtn.click();
        });
    });

    // --- 8. Real Auth System ---
    const authModal = document.getElementById('authModal');
    const profileBtn = document.getElementById('profileBtn');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loggedInState = document.getElementById('loggedInState');
    
    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');
    
    const formLogin = document.getElementById('formLogin');
    const formSignup = document.getElementById('formSignup');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const userNameDisplay = document.getElementById('userNameDisplay');

    const topLoginBtn = document.getElementById('topLoginBtn');
    const topSignupBtn = document.getElementById('topSignupBtn');
    const topLogoutBtn = document.getElementById('topLogoutBtn');
    const topAdminBtn = document.getElementById('topAdminBtn');
    const topDivider1 = document.getElementById('topDivider1');
    const topDivider2 = document.getElementById('topDivider2');

    function checkLoginState() {
        const user = localStorage.getItem('ahsanRealUser');
        if (user) {
            const userData = JSON.parse(user);
            profileBtn.innerHTML = `<i class="fa-solid fa-user-check"></i>`;
            profileBtn.style.color = 'var(--color-primary-light)';
            userNameDisplay.textContent = userData.name;
            loginForm.classList.remove('active');
            signupForm.classList.remove('active');
            loggedInState.classList.add('active');
            
            if(topLoginBtn) topLoginBtn.style.display = 'none';
            if(topSignupBtn) topSignupBtn.style.display = 'none';
            if(topDivider1) topDivider1.style.display = 'none';
            if(topLogoutBtn) topLogoutBtn.style.display = 'flex';
            if(topAdminBtn) topAdminBtn.style.display = 'flex';
            if(topDivider2) topDivider2.style.display = 'inline';
        } else {
            profileBtn.innerHTML = `<i class="fa-regular fa-user"></i>`;
            profileBtn.style.color = '';
            loggedInState.classList.remove('active');
            signupForm.classList.remove('active');
            loginForm.classList.add('active');
            
            if(topLoginBtn) topLoginBtn.style.display = 'flex';
            if(topSignupBtn) topSignupBtn.style.display = 'flex';
            if(topDivider1) topDivider1.style.display = 'inline';
            if(topLogoutBtn) topLogoutBtn.style.display = 'none';
            if(topAdminBtn) topAdminBtn.style.display = 'none';
            if(topDivider2) topDivider2.style.display = 'none';
        }
    }

    checkLoginState();

    profileBtn.addEventListener('click', () => {
        checkLoginState();
        authModal.classList.add('active');
    });

    if(topLoginBtn) {
        topLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginLink.click();
            authModal.classList.add('active');
        });
    }

    if(topSignupBtn) {
        topSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showSignupLink.click();
            authModal.classList.add('active');
        });
    }

    if(topLogoutBtn) {
        topLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutBtn.click();
        });
    }

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if(btn.closest('.modal-overlay') === authModal) authModal.classList.remove('active');
        });
    });

    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.remove('active');
        loginForm.classList.add('active');
    });

    formSignup.addEventListener('submit', async (e) => {
        e.preventDefault();
        const signupBtn = formSignup.querySelector('button[type="submit"]');
        const originalText = signupBtn.innerHTML;
        
        const name = document.getElementById('signupName').value;
        const email = formSignup.querySelector('input[type="email"]').value;
        const password = formSignup.querySelector('input[type="password"]').value;
        
        signupBtn.disabled = true;
        signupBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...`;
        
        try {
            const res = await fetch(`${API_BASE}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('ahsanRealUser', JSON.stringify(data.user));
                checkLoginState();
                authModal.classList.remove('active');
            } else {
                alert("Signup failed: " + (data.error || "Unknown error"));
            }
        } catch(err) { 
            alert("Network error during signup. Please try again.");
        } finally {
            signupBtn.disabled = false;
            signupBtn.innerHTML = originalText;
        }
    });

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = formLogin.querySelector('input[type="email"]').value;
        const password = formLogin.querySelector('input[type="password"]').value;
        
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('ahsanRealUser', JSON.stringify(data.user));
                checkLoginState();
                authModal.classList.remove('active');
            } else {
                alert("Login failed: " + (data.error || "Invalid credentials"));
            }
        } catch(err) { 
            alert("Network error during login. Please try again.");
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('ahsanRealUser');
        checkLoginState();
        authModal.classList.remove('active');
    });

    const myOrdersBtn = document.getElementById('myOrdersBtn');
    if (myOrdersBtn) {
        myOrdersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            alert("No past orders found. Start shopping to see your orders here!");
            authModal.classList.remove('active');
        });
    }

    const mySettingsBtn = document.getElementById('mySettingsBtn');
    if (mySettingsBtn) {
        mySettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            alert("Profile settings feature is currently under construction.");
            authModal.classList.remove('active');
        });
    }

    // --- 9. Info Modal & Policies ---
    const infoModal = document.getElementById('infoModalOverlay');
    const infoTitle = document.getElementById('infoModalTitle');
    const infoBody = document.getElementById('infoModalBody');
    const closeInfoBtn = document.getElementById('closeInfoBtn');
    const infoCloseBtn = document.getElementById('infoModalCloseBtn');

    const policyContent = {
        return: {
            title: "Return Policy",
            content: "At AhsanShopping, we want you to be completely satisfied with your purchase. You can return any item within 30 days of delivery for a full refund or exchange. Items must be in their original condition, unworn, and with all tags attached."
        },
        shipping: {
            title: "Shipping Info",
            content: "We offer fast and reliable shipping across the country. Standard delivery takes 3-5 business days. Free shipping is available on all orders over $50. Once your order is shipped, you will receive a tracking number via email."
        },
        privacy: {
            title: "Privacy Policy",
            content: "Your privacy is important to us. We collect only the necessary information to process your orders and improve your shopping experience. We never share your personal data with third parties without your explicit consent."
        },
        terms: {
            title: "Terms of Service",
            content: "By using AhsanShopping, you agree to our terms and conditions. All content on this site is the property of AhsanShopping. We reserve the right to update our terms at any time to better serve our community."
        },
        guarantee: {
            title: "30-Day Money Back Guarantee",
            content: "We stand behind the quality of our products. If for any reason you are not satisfied with your purchase, you can return it within 30 days for a 100% money-back guarantee. No questions asked!"
        }
    };

    function openInfoModal(type) {
        const data = policyContent[type];
        if (data && infoModal) {
            infoTitle.textContent = data.title;
            infoBody.innerHTML = `<p style="line-height: 1.6; color: #555;">${data.content}</p>`;
            infoModal.classList.add('active');
        }
    }

    const linkReturnPolicy = document.getElementById('linkReturnPolicy');
    const linkShippingInfo = document.getElementById('linkShippingInfo');
    const linkPrivacyPolicy = document.getElementById('linkPrivacyPolicy');
    const linkTermsOfService = document.getElementById('linkTermsOfService');
    const linkGuarantee = document.getElementById('linkGuarantee');

    if(linkReturnPolicy) linkReturnPolicy.addEventListener('click', (e) => { e.preventDefault(); openInfoModal('return'); });
    if(linkShippingInfo) linkShippingInfo.addEventListener('click', (e) => { e.preventDefault(); openInfoModal('shipping'); });
    if(linkPrivacyPolicy) linkPrivacyPolicy.addEventListener('click', (e) => { e.preventDefault(); openInfoModal('privacy'); });
    if(linkTermsOfService) linkTermsOfService.addEventListener('click', (e) => { e.preventDefault(); openInfoModal('terms'); });
    if(linkGuarantee) linkGuarantee.addEventListener('click', (e) => { e.preventDefault(); openInfoModal('guarantee'); });

    if(closeInfoBtn && infoCloseBtn) {
        [closeInfoBtn, infoCloseBtn].forEach(btn => {
            btn.addEventListener('click', () => infoModal.classList.remove('active'));
        });
    }

    // --- 10. Footer Category Filtering ---
    const footerCats = document.querySelectorAll('.footer-cat');
    footerCats.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = link.getAttribute('data-cat');
            const filterBtn = document.querySelector(`.filter-btn[data-filter="${cat}"]`);
            if (filterBtn) {
                filterBtn.click();
                const productsSection = document.getElementById('products-filter-section');
                if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // --- 11. Payment Method Links ---
    document.querySelectorAll('.payment-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const productSection = document.getElementById('products-filter-section');
            if (productSection) {
                productSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- 12. Navbar Links (Categories & Sections) ---
    const navCatLinks = document.querySelectorAll('.nav-cat-link');
    navCatLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const filter = link.getAttribute('data-filter');
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }

            const filterBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
            if (filterBtn) filterBtn.click();
        });
    });

    const navScrollLinks = document.querySelectorAll('.nav-scroll-link');
    navScrollLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

});
