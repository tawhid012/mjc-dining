document.addEventListener('DOMContentLoaded', () => {
    // Basic Auth Check
    const checkAuth = async () => {
        const { data: { session } } = await db.auth.getSession();
        if (!session) {
            window.location.href = '../login.html';
        }
    };
    checkAuth();

    // Sidebar Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    }

    // View Switching Logic
    const navLinks = document.querySelectorAll('.nav-links a[data-view]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active from all
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active to clicked
            e.target.closest('a').classList.add('active');

            const viewName = e.target.closest('a').getAttribute('data-view');
            
            // Hide all views
            document.querySelectorAll('.content-area > div').forEach(div => {
                div.style.display = 'none';
            });
            
            // Show target view
            const targetView = document.getElementById(`view-${viewName}`);
            if (targetView) targetView.style.display = 'block';

            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            }
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            // Try supabase signout
            try { await db.auth.signOut(); } catch(e) {}
            localStorage.removeItem('mjc_admin_token');
            window.location.href = '../login.html';
        });
    }

    // Load Data
    loadDashboardData();
    loadOrders();
    loadMenu();
    loadOffers();
    loadReels();
    loadBookings();
    loadSettingsData();
});

async function loadDashboardData() {
    const ordersList = document.getElementById('recent-orders-list');
    if (!ordersList) return;

    try {
        const { data: orders, error } = await db.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
        if (error) throw error;
        
        let html = '';
        orders.forEach(order => {
            let statusClass = order.status === 'Completed' ? 'status-completed' : (order.status === 'Pending' ? 'status-pending' : 'status-accepted');
            html += `
                <tr>
                    <td>#ORD-${order.id}</td>
                    <td>${order.customer_name}</td>
                    <td>₹${order.total_amount}</td>
                    <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                    <td><button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem;">View</button></td>
                </tr>
            `;
        });
        ordersList.innerHTML = html;

        // Stats update
        const today = new Date().toISOString().split('T')[0];
        const { data: todayOrders } = await db.from('orders').select('*').gte('created_at', today);
        document.getElementById('stat-orders').innerText = todayOrders ? todayOrders.length : 0;
        
        const { data: pendingBookings } = await db.from('booking_requests').select('*').eq('status', 'Pending');
        document.getElementById('stat-bookings').innerText = pendingBookings ? pendingBookings.length : 0;

        const rev = todayOrders ? todayOrders.reduce((sum, ord) => sum + parseFloat(ord.total_amount), 0) : 0;
        document.getElementById('stat-revenue').innerText = `₹${rev}`;

    } catch (err) {
        console.error("Error loading dashboard data:", err);
    }
}

async function loadOrders() {
    const list = document.getElementById('full-orders-list');
    if (!list) return;
    try {
        const { data: orders } = await db.from('orders').select('*').order('created_at', { ascending: false });
        let html = '';
        if(orders) {
            orders.forEach(order => {
                let statusClass = order.status === 'Completed' ? 'status-completed' : (order.status === 'Pending' ? 'status-pending' : 'status-accepted');
                const itemsCount = (order.items || []).length;
                html += `
                    <tr>
                        <td>#ORD-${order.id}</td>
                        <td>${order.customer_name}<br><small>${order.customer_phone}</small></td>
                        <td>${itemsCount} items</td>
                        <td>₹${order.total_amount}</td>
                        <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                        <td><button class="btn btn-primary" style="padding: 4px 8px;">View</button></td>
                    </tr>
                `;
            });
        }
        list.innerHTML = html;
    } catch(err) {}
}

async function loadMenu() {
    const list = document.getElementById('admin-menu-list');
    if (!list) return;
    try {
        const items = await fetchMenuItems();
        let html = '';
        items.forEach(item => {
            const statusClass = item.is_available ? 'status-completed' : 'status-pending';
            const statusText = item.is_available ? 'Available' : 'Out of Stock';
            html += `
                <tr>
                    <td><img src="${item.image_url}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;"></td>
                    <td>${item.name}</td>
                    <td>${item.category ? item.category.name : '-'}</td>
                    <td>₹${item.price}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-primary" style="padding: 4px 8px; margin-right:5px;" onclick="editMenuItem(${item.id}, '${item.name}', ${item.price})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger" style="padding: 4px 8px;" onclick="deleteMenuItem(${item.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        list.innerHTML = html;
    } catch(err) {}
}

async function loadOffers() {
    const list = document.getElementById('admin-offers-list');
    if (!list) return;
    try {
        const offers = await fetchOffers();
        let html = '';
        offers.forEach(offer => {
            const statusClass = offer.is_active ? 'status-completed' : 'status-pending';
            const statusText = offer.is_active ? 'Active' : 'Inactive';
            html += `
                <tr>
                    <td>${offer.title}</td>
                    <td>${offer.code || '-'}</td>
                    <td>-</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-primary" style="padding: 4px 8px; margin-right:5px;" onclick="editOffer(${offer.id})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger" style="padding: 4px 8px;" onclick="deleteOffer(${offer.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        list.innerHTML = html;
    } catch(err) {}
}

async function loadReels() {
    const list = document.getElementById('admin-reels-list');
    if (!list) return;
    try {
        const reels = await fetchReels();
        let html = '';
        reels.forEach(reel => {
            const statusText = reel.is_featured ? 'Yes' : 'No';
            const statusClass = reel.is_featured ? 'status-completed' : 'status-pending';
            html += `
                <tr>
                    <td><img src="${reel.url}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;"></td>
                    <td>${reel.title}</td>
                    <td>${reel.type}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td><button class="btn btn-danger" style="padding: 4px 8px;" onclick="deleteReel(${reel.id})">Remove</button></td>
                </tr>
            `;
        });
        list.innerHTML = html;
    } catch(err) {}
}

async function loadBookings() {
    const list = document.getElementById('admin-bookings-list');
    if (!list) return;
    try {
        const { data: bookings } = await db.from('booking_requests').select('*').order('created_at', { ascending: false });
        let html = '';
        if(bookings) {
            bookings.forEach(b => {
                let statusClass = b.status === 'Confirmed' ? 'status-accepted' : (b.status === 'Pending' ? 'status-pending' : 'status-completed');
                html += `
                    <tr>
                        <td>${b.customer_name}<br><small>${b.customer_phone}</small></td>
                        <td>${b.booking_date}, ${b.booking_time}</td>
                        <td>${b.guests}</td>
                        <td>${b.booking_type}</td>
                        <td><span class="status-badge ${statusClass}">${b.status}</span></td>
                        <td>
                            <button class="btn btn-primary" style="padding: 4px 8px;" onclick="editBookingStatus(${b.id})">Update Status</button>
                        </td>
                    </tr>
                `;
            });
        }
        list.innerHTML = html;
    } catch(err) {}
}

async function loadSettingsData() {
    try {
        const settings = await fetchSettings();
        if(settings) {
            const inputs = document.querySelectorAll('#view-settings input.form-control');
            if(inputs.length >= 2) {
                inputs[0].value = settings.banner_url || '';
                inputs[1].value = settings.whatsapp_number || '';
            }
            const select = document.querySelector('#view-settings select.form-control');
            if(select) {
                select.value = settings.is_banner_active ? 'Enabled' : 'Disabled';
            }
        }
        
        const saveBtn = document.querySelector('#view-settings .btn-primary');
        if(saveBtn && !saveBtn.dataset.bound) {
            saveBtn.dataset.bound = 'true';
            saveBtn.addEventListener('click', async () => {
                saveBtn.innerText = 'Saving...';
                const inputs = document.querySelectorAll('#view-settings input.form-control');
                const select = document.querySelector('#view-settings select.form-control');
                try {
                    const { error } = await db.from('settings').update({
                        banner_url: inputs[0].value,
                        is_banner_active: select.value === 'Enabled',
                        whatsapp_number: inputs[1].value,
                        updated_at: new Date().toISOString()
                    }).eq('id', 1); // Assuming ID 1
                    
                    if (error && error.code !== 'PGRST116') {
                        // if error because no row exists, let's insert
                        const { error: insertErr } = await db.from('settings').insert({
                            id: 1,
                            banner_url: inputs[0].value,
                            is_banner_active: select.value === 'Enabled',
                            whatsapp_number: inputs[1].value
                        });
                        if (insertErr) throw insertErr;
                    }
                    alert('Settings saved successfully!');
                } catch(err) {
                    console.error(err);
                    alert('Failed to save settings.');
                } finally {
                    saveBtn.innerText = 'Save Settings';
                }
            });
        }
    } catch(err) {}
}

window.deleteMenuItem = async function(id) {
    if(confirm('Are you sure you want to delete this menu item?')) {
        try {
            await db.from('menu_items').delete().eq('id', id);
            loadMenu();
        } catch(e) { alert('Error deleting item'); }
    }
};

window.deleteOffer = async function(id) {
    if(confirm('Are you sure you want to delete this offer?')) {
        try {
            await db.from('offers').delete().eq('id', id);
            loadOffers();
        } catch(e) { alert('Error deleting offer'); }
    }
};

window.deleteReel = async function(id) {
    if(confirm('Are you sure you want to delete this reel/gallery item?')) {
        try {
            await db.from('gallery').delete().eq('id', id);
            loadReels();
        } catch(e) { alert('Error deleting reel'); }
    }
};

window.closeAdminModal = function() {
    const overlay = document.getElementById('admin-modal');
    if (overlay) overlay.classList.remove('active');
};

window.showAdminModal = function(title, fields, onSubmit) {
    const overlay = document.getElementById('admin-modal');
    const titleEl = document.getElementById('admin-modal-title');
    const bodyEl = document.getElementById('admin-modal-body');
    const submitBtn = document.getElementById('admin-modal-submit');
    
    if (!overlay) return;
    
    titleEl.innerText = title;
    
    let html = '';
    fields.forEach((f, i) => {
        if (f.type === 'select') {
            html += `
                <div class="form-group">
                    <label>${f.label}</label>
                    <select id="modal-input-${i}">
                        ${f.options.map(opt => `<option value="${opt.value}" ${opt.value === f.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
            `;
        } else {
            html += `
                <div class="form-group">
                    <label>${f.label}</label>
                    <input type="${f.type || 'text'}" id="modal-input-${i}" value="${f.value || ''}" placeholder="${f.placeholder || ''}">
                </div>
            `;
        }
    });
    bodyEl.innerHTML = html;
    
    submitBtn.onclick = async () => {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Saving...';
        
        const values = fields.map((f, i) => document.getElementById(`modal-input-${i}`).value);
        await onSubmit(values);
        
        submitBtn.disabled = false;
        submitBtn.innerText = 'Save';
        closeAdminModal();
    };
    
    overlay.classList.add('active');
};

window.addMenuItem = function() {
    showAdminModal('Add Menu Item', [
        { label: 'Name', placeholder: 'e.g., Classic Chicken Burger' },
        { label: 'Price (₹)', type: 'number', placeholder: '149' },
        { label: 'Category Name', placeholder: 'e.g., Fast Food' },
        { label: 'Image URL (optional)', placeholder: 'https://...' }
    ], async (values) => {
        const [name, priceStr, categoryName, imgUrl] = values;
        if (!name || !priceStr) { alert("Name and price are required."); return; }
        
        const price = parseFloat(priceStr);
        let category_id = null;
        if(categoryName) {
            const {data: cats} = await db.from('categories').select('id').ilike('name', categoryName).single();
            if(cats) category_id = cats.id;
        }
        
        const image_url = imgUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop';
        try {
            await db.from('menu_items').insert({ name, price, category_id, image_url, is_available: true });
            loadMenu();
        } catch(e) { alert("Failed to add menu item."); }
    });
};

window.addOffer = function() {
    showAdminModal('Add New Offer', [
        { label: 'Offer Title', placeholder: 'e.g., Weekend Family Feast' },
        { label: 'Description', placeholder: 'Description...' },
        { label: 'Coupon Code', placeholder: 'e.g., WEEKEND20' }
    ], async (values) => {
        const [title, description, code] = values;
        if(!title) return;
        try {
            await db.from('offers').insert({ title, description, code, is_active: true });
            loadOffers();
        } catch(e) { alert("Failed to add offer."); }
    });
};

window.addReel = function() {
    showAdminModal('Add Reel/Image', [
        { label: 'Title', placeholder: 'e.g., Kitchen Secrets' },
        { label: 'Image/Video URL', placeholder: 'https://...' },
        { label: 'Type', type: 'select', value: 'Image', options: [{label: 'Image', value: 'Image'}, {label: 'Reel', value: 'Reel'}] }
    ], async (values) => {
        const [title, url, type] = values;
        if(!title || !url) return;
        try {
            await db.from('gallery').insert({ title, url, type, is_featured: true });
            loadReels();
        } catch(e) { alert("Failed to add gallery item."); }
    });
};

window.editMenuItem = function(id, oldName, oldPrice) {
    showAdminModal('Edit Menu Item', [
        { label: 'Name', value: oldName },
        { label: 'Price (₹)', type: 'number', value: oldPrice }
    ], async (values) => {
        const [name, priceStr] = values;
        if(!name || !priceStr) return;
        try {
            await db.from('menu_items').update({ name, price: parseFloat(priceStr) }).eq('id', id);
            loadMenu();
        } catch(e) { alert("Failed to edit menu item."); }
    });
};

window.editOffer = function(id) {
    showAdminModal('Edit Offer', [
        { label: 'New Title', placeholder: 'Offer Title...' }
    ], async (values) => {
        const [title] = values;
        if(!title) return;
        try {
            await db.from('offers').update({ title }).eq('id', id);
            loadOffers();
        } catch(e) { alert("Failed to edit offer."); }
    });
};

window.editBookingStatus = function(id) {
    showAdminModal('Update Booking Status', [
        { label: 'Status', type: 'select', value: 'Confirmed', options: [
            {label: 'Pending', value: 'Pending'},
            {label: 'Confirmed', value: 'Confirmed'},
            {label: 'Completed', value: 'Completed'}
        ]}
    ], async (values) => {
        const [status] = values;
        if(!status) return;
        try {
            await db.from('booking_requests').update({ status }).eq('id', id);
            loadBookings();
        } catch(e) { alert("Failed to update booking status."); }
    });
};
