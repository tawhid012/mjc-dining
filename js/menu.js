// Menu Page Logic
let allMenuItems = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch data
    const [categories, items] = await Promise.all([
        fetchCategories(),
        fetchMenuItems()
    ]);
    
    allMenuItems = items;

    // 2. Render Categories
    renderCategories(categories);
    
    // 3. Initial Render Menu
    renderMenu(allMenuItems);
    
    // 4. Setup Category Filters
    const catChips = document.querySelectorAll('.cat-chip');
    catChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            // Update active state
            catChips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            
            // Filter
            const category = e.target.getAttribute('data-cat');
            filterMenu(category, document.getElementById('menu-search').value);
        });
    });

    // 4. Setup Search
    const searchInput = document.getElementById('menu-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const activeCat = document.querySelector('.cat-chip.active').getAttribute('data-cat');
            filterMenu(activeCat, e.target.value);
        });
    }

    // Auto-select category if passed in URL
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    if (catParam) {
        const targetChip = document.querySelector(`.cat-chip[data-cat="${catParam}"]`);
        if (targetChip) {
            targetChip.click();
        }
    }
});

function filterMenu(category, query) {
    let filtered = allMenuItems;
    
    if (category !== 'all') {
        filtered = filtered.filter(item => item.category?.slug === category);
    }
    
    if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(q) || 
            (item.description && item.description.toLowerCase().includes(q))
        );
    }
    
    renderMenu(filtered);
}

function renderCategories(categories) {
    const container = document.querySelector('.sticky-categories .container');
    if (!container) return;

    let html = '<button class="cat-chip active" data-cat="all">All</button>';
    categories.forEach(cat => {
        html += `<button class="cat-chip" data-cat="${cat.slug}">${cat.name}</button>`;
    });
    container.innerHTML = html;
}

function renderMenu(items) {
    const container = document.getElementById('menu-container');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<div class="text-center"><p style="color: var(--text-light); font-size: 1.1rem; padding: 2rem;">No items found matching your criteria.</p></div>';
        return;
    }

    // Group items by category for rendering sections
    const grouped = items.reduce((acc, item) => {
        const catName = item.category?.name || 'Other';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(item);
        return acc;
    }, {});

    let html = '';

    for (const [category, catItems] of Object.entries(grouped)) {
        html += `
            <div class="menu-category-block" style="margin-bottom: 3rem;">
                <h2 class="menu-section-title">${category}</h2>
                <div class="food-grid">
        `;

        catItems.forEach(item => {
            const unavailableClass = item.is_available ? '' : 'food-unavailable';
            const unavailableBadge = item.is_available ? '' : '<div class="unavailable-badge">Currently Unavailable</div>';
            const badgeHtml = item.badge ? `<span class="food-badge">${item.badge}</span>` : '';
            const addBtnHtml = item.is_available ? 
                `<button class="add-btn" aria-label="Add to cart" onclick="addToCart(${item.id}, '${item.name.replace(/'/g, "\\'")}', ${item.price})"><i class="fa-solid fa-plus"></i></button>` : 
                '';

            html += `
                <div class="food-card ${unavailableClass}">
                    <div class="food-img-container">
                        ${badgeHtml}
                        ${unavailableBadge}
                        <img src="${item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'}" alt="${item.name}" loading="lazy">
                    </div>
                    <div class="food-info">
                        <h3 class="food-title">${item.name}</h3>
                        <p class="food-desc">${item.description || ''}</p>
                        <div class="food-footer">
                            <span class="food-price">₹${item.price}</span>
                            ${addBtnHtml}
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;
    }

    container.innerHTML = html;
}
