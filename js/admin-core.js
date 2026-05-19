// ── Toast system ──
window.showToast = function(msg, type='success') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const icons = {success:'fa-circle-check', error:'fa-circle-xmark', info:'fa-circle-info'};
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<i class="fa-solid ${icons[type]||icons.success} toast-icon"></i><span class="toast-msg">${msg}</span>`;
    c.appendChild(t);
    setTimeout(()=>{ t.classList.add('leaving'); setTimeout(()=>t.remove(), 350); }, 3500);
};

// ── Delete confirm modal ──
let _deleteCallback = null;
window.openDeleteModal = function(title, text, cb) {
    document.getElementById('delete-modal-title').innerText = title || 'Delete this item?';
    document.getElementById('delete-modal-text').innerText = text || 'This action cannot be undone.';
    _deleteCallback = cb;
    document.getElementById('delete-modal').classList.add('active');
};
window.closeDeleteModal = function() {
    document.getElementById('delete-modal').classList.remove('active');
    _deleteCallback = null;
};
document.addEventListener('DOMContentLoaded', ()=>{
    const btn = document.getElementById('delete-modal-confirm');
    if (btn) btn.addEventListener('click', async ()=>{
        if (_deleteCallback) { btn.disabled=true; await _deleteCallback(); btn.disabled=false; }
        closeDeleteModal();
    });
});

// ── Close admin modal ──
window.closeAdminModal = function() {
    document.getElementById('admin-modal')?.classList.remove('active');
};

document.addEventListener('DOMContentLoaded', ()=>{
    // Auth
    (async()=>{
        const {data:{session}} = await db.auth.getSession();
        if (!session) window.location.href = '../login.html';
    })();

    // Sidebar toggle
    const tog = document.getElementById('menu-toggle');
    const sb  = document.getElementById('sidebar');
    const ov  = document.getElementById('sidebar-overlay');
    if (tog) tog.addEventListener('click', ()=>{ sb.classList.toggle('open'); ov?.classList.toggle('active'); });
    if (ov)  ov.addEventListener('click',  ()=>{ sb.classList.remove('open'); ov.classList.remove('active'); });

    // View switching
    document.querySelectorAll('.nav-links a[data-view]').forEach(a=>{
        a.addEventListener('click', e=>{
            e.preventDefault();
            document.querySelectorAll('.nav-links a[data-view]').forEach(l=>l.classList.remove('active'));
            a.classList.add('active');
            const v = a.dataset.view;
            document.querySelectorAll('.content-area > div').forEach(d=>d.style.display='none');
            const t = document.getElementById(`view-${v}`);
            if (t) t.style.display='block';
            if (window.innerWidth<=768) { sb.classList.remove('open'); ov?.classList.remove('active'); }
        });
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', async e=>{
        e.preventDefault();
        try { await db.auth.signOut(); } catch(_){}
        window.location.href='../login.html';
    });

    // Load all
    loadDashboardData();
    loadOrders();
    loadMenu();
    loadOffers();
    loadReels();
    loadBookings();
    initSettings();
});

// ── Dashboard ──
async function loadDashboardData() {
    try {
        const {data:orders} = await db.from('orders').select('*').order('created_at',{ascending:false}).limit(5);
        const tbody = document.getElementById('recent-orders-list');
        if (tbody && orders) {
            tbody.innerHTML = orders.map(o=>{
                const sc = o.status==='Completed'?'status-completed':o.status==='Pending'?'status-pending':'status-accepted';
                return `<tr><td>#ORD-${o.id}</td><td>${o.customer_name}</td><td>₹${o.total_amount}</td>
                    <td><span class="status-badge ${sc}">${o.status}</span></td>
                    <td><button class="btn btn-primary btn-sm">View</button></td></tr>`;
            }).join('');
        }
        const today = new Date().toISOString().split('T')[0];
        const {data:tod} = await db.from('orders').select('*').gte('created_at',today);
        document.getElementById('stat-orders').innerText = tod?.length||0;
        const {data:pb} = await db.from('booking_requests').select('*').eq('status','Pending');
        document.getElementById('stat-bookings').innerText = pb?.length||0;
        const rev = (tod||[]).reduce((s,o)=>s+parseFloat(o.total_amount||0),0);
        document.getElementById('stat-revenue').innerText = `₹${rev.toFixed(0)}`;
    } catch(e){ console.error(e); }
}

// ── Orders ──
async function loadOrders() {
    const list = document.getElementById('full-orders-list');
    if (!list) return;
    try {
        const {data:orders} = await db.from('orders').select('*').order('created_at',{ascending:false});
        list.innerHTML = (orders||[]).map(o=>{
            const sc = o.status==='Completed'?'status-completed':o.status==='Pending'?'status-pending':'status-accepted';
            return `<tr><td>#ORD-${o.id}</td><td>${o.customer_name}<br><small>${o.customer_phone}</small></td>
                <td>${(o.items||[]).length} items</td><td>₹${o.total_amount}</td>
                <td><span class="status-badge ${sc}">${o.status}</span></td>
                <td><button class="btn btn-primary btn-sm">View</button></td></tr>`;
        }).join('');
    } catch(_){}
}

// ── Menu ──
let _allMenuItems = [];
window.loadMenu = async function() {
    const list = document.getElementById('admin-menu-list');
    if (!list) return;
    try {
        _allMenuItems = await fetchMenuItems();
        // populate category filter
        const cats = [...new Set(_allMenuItems.map(i=>i.category?.name).filter(Boolean))];
        const cf = document.getElementById('menu-cat-filter');
        if (cf) {
            const cur = cf.value;
            cf.innerHTML = '<option value="">All Categories</option>' + cats.map(c=>`<option value="${c}">${c}</option>`).join('');
            cf.value = cur;
        }
        renderMenuTable(_allMenuItems);
    } catch(e){ console.error(e); }
};

window.filterMenuTable = function() {
    const q = (document.getElementById('menu-search')?.value||'').toLowerCase();
    const cat = document.getElementById('menu-cat-filter')?.value||'';
    renderMenuTable(_allMenuItems.filter(i=>{
        const matchQ = !q || i.name.toLowerCase().includes(q);
        const matchC = !cat || (i.category?.name||'')=== cat;
        return matchQ && matchC;
    }));
};

function renderMenuTable(items) {
    const list = document.getElementById('admin-menu-list');
    if (!list) return;
    const TAG_LABELS = {popular:'Popular',bestseller:'Bestseller',new:'New',trending:'Trending',special:'Special'};
    const TAG_ICONS  = {popular:'🔥',bestseller:'⭐',new:'✨',trending:'📈',special:'💎'};
    list.innerHTML = items.map(item=>{
        const sc = item.is_available?'status-completed':'status-pending';
        const st = item.is_available?'Available':'Out of Stock';
        const tags = (item.tags||[]).map(t=>`<span class="tag-badge tag-${t}">${TAG_ICONS[t]||''} ${TAG_LABELS[t]||t}</span>`).join('');
        return `<tr>
            <td><img src="${item.image_url||''}" style="width:46px;height:46px;border-radius:8px;object-fit:cover;" onerror="this.src='https://via.placeholder.com/46'"></td>
            <td><strong>${item.name}</strong></td>
            <td>${item.category?.name||'—'}</td>
            <td>₹${item.price}</td>
            <td>${tags||'<span style="color:#aaa;font-size:0.8rem;">No tags</span>'}</td>
            <td><span class="status-badge ${sc}">${st}</span></td>
            <td class="action-btns">
                <button class="btn btn-primary btn-sm" onclick="openEditMenuModal(${item.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-danger btn-sm" onclick="confirmDeleteMenuItem(${item.id},'${item.name.replace(/'/g,"\\'")}')"><i class="fa-solid fa-trash"></i></button>
            </td></tr>`;
    }).join('');
}

window.confirmDeleteMenuItem = function(id, name) {
    openDeleteModal(`Delete "${name}"?`, 'This will permanently remove the menu item.', async ()=>{
        await db.from('menu_items').delete().eq('id', id);
        showToast('Menu item deleted.', 'success');
        loadMenu();
    });
};

// ── Offers ──
window.loadOffers = async function() {
    const list = document.getElementById('admin-offers-list');
    if (!list) return;
    try {
        const {data:offers} = await db.from('offers').select('*').order('id');
        list.innerHTML = (offers||[]).map(o=>{
            const sc = o.is_active?'status-completed':'status-pending';
            return `<tr>
                <td><strong>${o.title}</strong></td>
                <td style="max-width:200px;font-size:0.85rem;color:var(--admin-text-light);">${o.description||'—'}</td>
                <td>${o.code?`<code style="background:#f3f4f6;padding:2px 8px;border-radius:5px;">${o.code}</code>`:'—'}</td>
                <td><span class="status-badge ${sc}">${o.is_active?'Active':'Inactive'}</span></td>
                <td class="action-btns">
                    <button class="btn btn-primary btn-sm" onclick="openEditOfferModal(${o.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteOffer(${o.id},'${o.title.replace(/'/g,"\\'")}')"><i class="fa-solid fa-trash"></i></button>
                </td></tr>`;
        }).join('');
    } catch(e){ console.error(e); }
};

window.confirmDeleteOffer = function(id, title) {
    openDeleteModal(`Delete "${title}"?`, 'This offer will be removed permanently.', async ()=>{
        await db.from('offers').delete().eq('id', id);
        showToast('Offer deleted.', 'success');
        loadOffers();
    });
};

// ── Reels ──
window.loadReels = async function() {
    const list = document.getElementById('admin-reels-list');
    if (!list) return;
    try {
        const {data:reels} = await db.from('gallery').select('*').order('sort_order');
        list.innerHTML = (reels||[]).map(r=>{
            const sc = r.is_featured?'status-completed':'status-pending';
            const igLink = r.instagram_url
                ? `<a href="${r.instagram_url}" target="_blank" class="reel-link-badge"><i class="fa-brands fa-instagram"></i> Open</a>`
                : '<span style="color:#aaa;font-size:0.8rem;">No link</span>';
            return `<tr>
                <td>${r.url?`<img src="${r.url}" style="width:52px;height:52px;border-radius:8px;object-fit:cover;" onerror="this.src='https://via.placeholder.com/52'">`:''}</td>
                <td><strong>${r.title}</strong></td>
                <td><span class="status-badge status-accepted" style="font-size:0.75rem;">${r.type||'Image'}</span></td>
                <td>${igLink}</td>
                <td><span class="status-badge ${sc}">${r.is_featured?'Yes':'No'}</span></td>
                <td class="action-btns">
                    <button class="btn btn-primary btn-sm" onclick="openEditReelModal(${r.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteReel(${r.id},'${r.title.replace(/'/g,"\\'")}')"><i class="fa-solid fa-trash"></i></button>
                </td></tr>`;
        }).join('');
    } catch(e){ console.error(e); }
};

window.confirmDeleteReel = function(id, title) {
    openDeleteModal(`Delete "${title}"?`, 'This gallery item will be removed.', async ()=>{
        await db.from('gallery').delete().eq('id', id);
        showToast('Gallery item deleted.', 'success');
        loadReels();
    });
};

// ── Bookings ──
window.loadBookings = async function() {
    const list = document.getElementById('admin-bookings-list');
    if (!list) return;
    try {
        const {data:bookings} = await db.from('booking_requests').select('*').order('created_at',{ascending:false});
        list.innerHTML = (bookings||[]).map(b=>{
            const sc = b.status==='Confirmed'?'status-accepted':b.status==='Pending'?'status-pending':'status-completed';
            return `<tr>
                <td>${b.customer_name}<br><small style="color:var(--admin-text-light);">${b.customer_phone}</small></td>
                <td>${b.booking_date}, ${b.booking_time}</td>
                <td>${b.guests}</td>
                <td>${b.booking_type}</td>
                <td><span class="status-badge ${sc}">${b.status}</span></td>
                <td><button class="btn btn-primary btn-sm" onclick="openBookingStatusModal(${b.id},'${b.status}')"><i class="fa-solid fa-pen"></i> Update</button></td>
            </tr>`;
        }).join('');
    } catch(_){}
};

// ── Settings ──
function initSettings() {
    (async()=>{
        try {
            const s = await fetchSettings();
            if (s) {
                document.getElementById('setting-banner-url').value = s.banner_url||'';
                document.getElementById('setting-banner-status').value = s.is_banner_active?'Enabled':'Disabled';
                document.getElementById('setting-whatsapp').value = s.whatsapp_number||'';
            }
        } catch(_){}
    })();
    const btn = document.getElementById('settings-save-btn');
    if (btn && !btn.dataset.bound) {
        btn.dataset.bound = 'true';
        btn.addEventListener('click', async ()=>{
            btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            try {
                const payload = {
                    banner_url: document.getElementById('setting-banner-url').value,
                    is_banner_active: document.getElementById('setting-banner-status').value==='Enabled',
                    whatsapp_number: document.getElementById('setting-whatsapp').value,
                    updated_at: new Date().toISOString()
                };
                const {error} = await db.from('settings').update(payload).eq('id',1);
                if (error) await db.from('settings').insert({id:1,...payload});
                showToast('Settings saved successfully!','success');
            } catch(e){ showToast('Failed to save settings.','error'); }
            finally { btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Save Settings'; }
        });
    }
}
