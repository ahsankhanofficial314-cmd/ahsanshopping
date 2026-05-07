const API_BASE = import.meta.env.VITE_API_URL || '';

document.addEventListener('DOMContentLoaded', () => {
    // Allow access without password prompt
    localStorage.setItem('ahsanAdmin', 'true');

    // Set time
    const timeDisplay = document.getElementById('currentTime');
    function updateTime() {
        const now = new Date();
        timeDisplay.textContent = now.toLocaleString();
    }
    updateTime();
    setInterval(updateTime, 1000);

    document.getElementById('logoutAdmin').addEventListener('click', () => {
        localStorage.removeItem('ahsanAdmin');
        window.location.href = 'index.html';
    });

    // Tab toggling logic
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a[data-target]');
    const sections = {
        dashboardSection: [document.querySelector('.stats-grid'), document.getElementById('addProductCard')],
        productsSection: [document.getElementById('productsSection'), document.getElementById('productCardsSection')],
        settingsSection: [document.getElementById('settingsSection')],
        signalsSection: [document.getElementById('signalsSection')],
        customersSection: [document.getElementById('customersSection')],
        analyticsSection: [document.getElementById('analyticsSection')]
    };

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            Object.values(sections).forEach(sectionArray => {
                sectionArray.forEach(el => { if(el) el.style.display = 'none'; });
            });

            const target = link.getAttribute('data-target');
            if (sections[target]) {
                sections[target].forEach(el => {
                    if (el) el.style.display = (target === 'dashboardSection' && el.classList.contains('stats-grid')) ? 'grid' : 'block';
                });
            }
        });
    });

    const form = document.getElementById('addProductForm');
    const msg = document.getElementById('addMsg');
    const productTableBody = document.getElementById('adminProductTableBody');
    const totalProductsCount = document.getElementById('statTotalProducts');

    async function loadAdminProducts() {
        try {
            const res = await fetch(`${API_BASE}/api/products`);
            const products = await res.json();
            renderAdminProducts(products);
            totalProductsCount.textContent = products.length;
        } catch (err) { console.error(err); }
    }

    function renderAdminProducts(products) {
        productTableBody.innerHTML = products.map(product => `
            <tr>
                <td><img src="${product.image}" alt=""></td>
                <td>${product.name}</td>
                <td style="text-transform: capitalize;">${product.category}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-delete" onclick="deleteProduct(${product.id})">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        const cardsGrid = document.getElementById('adminProductCardsGrid');
        if (cardsGrid) {
            cardsGrid.innerHTML = products.map(product => `
                <div style="background: white; border: 1px solid #eee; border-radius: 8px; overflow: hidden; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <img src="${product.image}" alt="" style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                    <h4 style="margin-bottom: 5px; font-size: 1rem;">${product.name}</h4>
                    <p style="color: #666; font-size: 0.9rem; margin-bottom: 10px; text-transform: capitalize;">${product.category}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold; color: var(--color-primary-light);">$${product.price.toFixed(2)}</span>
                        <button class="btn-delete" onclick="deleteProduct(${product.id})" style="background: #ffebee; color: #d32f2f; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    window.deleteProduct = async function(id) {
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    loadAdminProducts();
                } else {
                    alert("Failed to delete product");
                }
            } catch (err) { console.error(err); }
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('pName').value;
        const price = document.getElementById('pPrice').value;
        const category = document.getElementById('pCategory').value;
        const description = document.getElementById('pDesc').value;
        let image = document.getElementById('pImage').value;

        if (!image) {
            image = `images/product_${category === 'beauty' ? 'women' : category}.png`;
        }

        try {
            const res = await fetch(`${API_BASE}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, price, category, description, image })
            });

            if (res.ok) {
                msg.textContent = 'Product successfully added!';
                msg.style.display = 'block';
                form.reset();
                setTimeout(() => msg.style.display = 'none', 3000);
                loadAdminProducts();
            }
        } catch (err) { console.error(err); }
    });

    async function loadAdminUsers() {
        try {
            const res = await fetch(`${API_BASE}/api/users`);
            const users = await res.json();
            renderAdminUsers(users);
            const userCountDisplay = document.getElementById('analyticsUsersCount');
            if (userCountDisplay) userCountDisplay.textContent = users.length;
        } catch (err) { console.error(err); }
    }

    function renderAdminUsers(users) {
        const tableBody = document.getElementById('adminCustomersTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>
                    <button class="btn-delete" style="background:none; border:none; color:var(--color-danger); cursor:pointer;">
                        <i class="fa-solid fa-user-slash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async function loadAdminSignals() {
        try {
            const res = await fetch(`${API_BASE}/api/signals`);
            const signals = await res.json();
            const signalsList = document.getElementById('adminSignalsList');
            if (!signalsList) return;

            // Keep the fake one at the bottom, and prepend new ones
            const liveSignalsHtml = signals.map(sig => `
                <li style="padding: 15px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; animation: fadeIn 0.5s ease-out;">
                    <span><i class="fa-solid fa-bolt" style="margin-right: 10px; color: #f1c40f;"></i> ${sig.message}</span>
                    <span style="color: #888; font-size: 0.85rem;">${new Date(sig.time).toLocaleTimeString()}</span>
                </li>
            `).join('');

            const fakeSignalHtml = `
                <li style="padding: 15px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                    <span><i class="fa-solid fa-circle-info text-primary" style="margin-right: 10px; color: #3498db;"></i> Fake Old Signal: System update completed.</span>
                    <span style="color: #888; font-size: 0.85rem;">2 days ago</span>
                </li>
            `;

            signalsList.innerHTML = liveSignalsHtml + fakeSignalHtml;
        } catch (err) { console.error(err); }
    }

    function updateAnalytics() {
        // Sync product count to analytics
        const productCount = totalProductsCount.textContent;
        const analyticsProdCount = document.getElementById('analyticsProductsCount');
        if (analyticsProdCount) analyticsProdCount.textContent = productCount;
    }

    // Initial load
    loadAdminProducts().then(() => updateAnalytics());
    loadAdminUsers();
    loadAdminSignals();

    // Refresh signals every 30 seconds
    setInterval(loadAdminSignals, 30000);
});
