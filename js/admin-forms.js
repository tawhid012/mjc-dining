// ══════════════════════════════════════
// ADMIN FORMS — Professional Modals
// ══════════════════════════════════════

const TAGS_CONFIG = [
    {key:'popular',    label:'Popular',    icon:'🔥', cls:'chip-popular'},
    {key:'bestseller', label:'Bestseller', icon:'⭐', cls:'chip-bestseller'},
    {key:'new',        label:'New',        icon:'✨', cls:'chip-new'},
    {key:'trending',   label:'Trending',   icon:'📈', cls:'chip-trending'},
    {key:'special',    label:'Special',    icon:'💎', cls:'chip-special'},
];

// ── Tag selector HTML generator ──
function buildTagSelector(selected=[]) {
    return `<div class="tag-selector" id="tag-selector">
        ${TAGS_CONFIG.map(t=>`
        <label class="tag-chip ${t.cls}${selected.includes(t.key)?' selected':''}" data-tag="${t.key}">
            <input type="checkbox" value="${t.key}" ${selected.includes(t.key)?'checked':''}>
            ${t.icon} ${t.label}
        </label>`).join('')}
    </div>`;
}

function bindTagChips() {
    document.querySelectorAll('#tag-selector .tag-chip').forEach(chip=>{
        chip.addEventListener('click', ()=>{
            const cb = chip.querySelector('input[type=checkbox]');
            cb.checked = !cb.checked;
            chip.classList.toggle('selected', cb.checked);
        });
    });
}

function getSelectedTags() {
    return [...document.querySelectorAll('#tag-selector input[type=checkbox]:checked')].map(c=>c.value);
}

// ── Category dropdown builder ──
async function buildCategorySelect(selectedId=null) {
    const cats = await fetchCategories();
    const opts = cats.map(c=>`<option value="${c.id}" ${c.id===selectedId?'selected':''}>${c.name}</option>`).join('');
    return {cats, html: `<option value="">— Select Category —</option>${opts}`};
}

// ── Open/populate modal ──
function openModal(title, icon, bodyHtml, onSubmit, submitLabel='Save Changes') {
    document.getElementById('admin-modal-title').innerText = title;
    document.getElementById('admin-modal-icon').className = `fa-solid ${icon}`;
    document.getElementById('admin-modal-body').innerHTML = bodyHtml;
    const btn = document.getElementById('admin-modal-submit');
    btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${submitLabel}`;
    btn.onclick = async ()=>{
        btn.disabled=true;
        btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        try { await onSubmit(); } finally {
            btn.disabled=false;
            btn.innerHTML=`<i class="fa-solid fa-floppy-disk"></i> ${submitLabel}`;
        }
    };
    document.getElementById('admin-modal').classList.add('active');
    bindTagChips();
}

// ── Image preview live update ──
function bindImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const prev  = document.getElementById(previewId);
    if (!input||!prev) return;
    input.addEventListener('input', ()=>{
        const v = input.value.trim();
        prev.innerHTML = v ? `<img src="${v}" onerror="this.parentElement.innerHTML='<span class=\\'no-img\\'>Invalid URL</span>'">` : '<span class="no-img">Preview</span>';
    });
    if (input.value) input.dispatchEvent(new Event('input'));
}

// ══════════════════════════════
// ADD NEW CATEGORY (inline)
// ══════════════════════════════
async function addNewCategory() {
    const name = prompt('Enter new category name:');
    if (!name || !name.trim()) return null;
    const slug = name.trim().toLowerCase().replace(/\s+/g,'-');
    try {
        const {data, error} = await db.from('categories').insert({name:name.trim(), slug}).select().single();
        if (error) throw error;
        showToast(`Category "${name.trim()}" added!`, 'success');
        return data;
    } catch(e) {
        showToast('Failed to add category.', 'error');
        return null;
    }
}

// ══════════════════════════════
// MENU — ADD
// ══════════════════════════════
window.openAddMenuModal = async function() {
    const {html:catOpts} = await buildCategorySelect();
    const body = `
    <div class="form-row">
        <div class="form-group">
            <label>Item Name <span class="req">*</span></label>
            <input type="text" id="f-name" class="form-control-field" placeholder="e.g. Classic Burger">
        </div>
        <div class="form-group">
            <label>Price (₹) <span class="req">*</span></label>
            <input type="number" id="f-price" class="form-control-field" placeholder="149">
        </div>
    </div>
    <div class="form-group">
        <label>Category <span class="req">*</span></label>
        <div class="category-row">
            <select id="f-category" class="form-control-field">${catOpts}</select>
            <button type="button" class="btn-add-cat" onclick="handleAddNewCategory()"><i class="fa-solid fa-plus"></i> Add New</button>
        </div>
    </div>
    <div class="form-group">
        <label>Description</label>
        <textarea id="f-desc" class="form-control-field" placeholder="Short description..."></textarea>
    </div>
    <div class="form-group">
        <label>Image URL</label>
        <input type="text" id="f-img" class="form-control-field" placeholder="https://...">
        <div class="img-preview-wrap" id="img-prev"><span class="no-img">Preview</span></div>
    </div>
    <div class="modal-section-title">Item Tags</div>
    ${buildTagSelector()}
    <div class="form-group" style="margin-top:14px;">
        <div class="toggle-wrap">
            <label class="toggle-switch"><input type="checkbox" id="f-avail" checked><span class="toggle-slider"></span></label>
            <span style="font-size:0.9rem;">Available for ordering</span>
        </div>
    </div>`;

    openModal('Add Menu Item', 'fa-plus', body, async ()=>{
        const name  = document.getElementById('f-name').value.trim();
        const price = parseFloat(document.getElementById('f-price').value);
        const cat   = document.getElementById('f-category').value;
        const desc  = document.getElementById('f-desc').value.trim();
        const img   = document.getElementById('f-img').value.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop';
        const tags  = getSelectedTags();
        const avail = document.getElementById('f-avail').checked;
        if (!name || !price) { showToast('Name and price are required.','error'); return; }
        if (!cat) { showToast('Please select a category.','error'); return; }
        const {error} = await db.from('menu_items').insert({name, price, category_id:parseInt(cat), description:desc, image_url:img, tags, is_available:avail});
        if (error) { showToast('Failed to add item.','error'); return; }
        showToast(`"${name}" added to menu!`,'success');
        closeAdminModal();
        loadMenu();
    }, 'Add Item');

    setTimeout(()=>bindImagePreview('f-img','img-prev'), 50);
};

window.handleAddNewCategory = async function() {
    const cat = await addNewCategory();
    if (!cat) return;
    const sel = document.getElementById('f-category');
    if (sel) {
        const opt = document.createElement('option');
        opt.value = cat.id; opt.text = cat.name; opt.selected = true;
        sel.appendChild(opt);
    }
};

// ══════════════════════════════
// MENU — EDIT
// ══════════════════════════════
window.openEditMenuModal = async function(id) {
    const items = _allMenuItems || await fetchMenuItems();
    const item  = items.find(i=>i.id===id);
    if (!item) return;
    const {html:catOpts} = await buildCategorySelect(item.category_id);
    const body = `
    <div class="form-row">
        <div class="form-group">
            <label>Item Name <span class="req">*</span></label>
            <input type="text" id="f-name" class="form-control-field" value="${item.name}">
        </div>
        <div class="form-group">
            <label>Price (₹) <span class="req">*</span></label>
            <input type="number" id="f-price" class="form-control-field" value="${item.price}">
        </div>
    </div>
    <div class="form-group">
        <label>Category</label>
        <div class="category-row">
            <select id="f-category" class="form-control-field">${catOpts}</select>
            <button type="button" class="btn-add-cat" onclick="handleAddNewCategoryEdit()"><i class="fa-solid fa-plus"></i> Add New</button>
        </div>
    </div>
    <div class="form-group">
        <label>Description</label>
        <textarea id="f-desc" class="form-control-field">${item.description||''}</textarea>
    </div>
    <div class="form-group">
        <label>Image URL</label>
        <input type="text" id="f-img" class="form-control-field" value="${item.image_url||''}">
        <div class="img-preview-wrap" id="img-prev"><span class="no-img">Preview</span></div>
    </div>
    <div class="modal-section-title">Item Tags</div>
    ${buildTagSelector(item.tags||[])}
    <div class="form-group" style="margin-top:14px;">
        <div class="toggle-wrap">
            <label class="toggle-switch"><input type="checkbox" id="f-avail" ${item.is_available?'checked':''}><span class="toggle-slider"></span></label>
            <span style="font-size:0.9rem;">Available for ordering</span>
        </div>
    </div>`;

    openModal('Edit Menu Item', 'fa-pen', body, async ()=>{
        const name  = document.getElementById('f-name').value.trim();
        const price = parseFloat(document.getElementById('f-price').value);
        const cat   = document.getElementById('f-category').value;
        const desc  = document.getElementById('f-desc').value.trim();
        const img   = document.getElementById('f-img').value.trim();
        const tags  = getSelectedTags();
        const avail = document.getElementById('f-avail').checked;
        if (!name||!price) { showToast('Name and price required.','error'); return; }
        const {error} = await db.from('menu_items').update({name, price, category_id:cat?parseInt(cat):null, description:desc, image_url:img, tags, is_available:avail}).eq('id',id);
        if (error) { showToast('Failed to update item.','error'); return; }
        showToast(`"${name}" updated!`,'success');
        closeAdminModal();
        loadMenu();
    });

    setTimeout(()=>bindImagePreview('f-img','img-prev'), 50);
};

window.handleAddNewCategoryEdit = async function() {
    const cat = await addNewCategory();
    if (!cat) return;
    const sel = document.getElementById('f-category');
    if (sel) { const opt = document.createElement('option'); opt.value=cat.id; opt.text=cat.name; opt.selected=true; sel.appendChild(opt); }
};

// ══════════════════════════════
// OFFERS — ADD
// ══════════════════════════════
window.openAddOfferModal = function() {
    const body = `
    <div class="form-group">
        <label>Offer Title <span class="req">*</span></label>
        <input type="text" id="f-title" class="form-control-field" placeholder="e.g. Weekend Family Feast">
    </div>
    <div class="form-group">
        <label>Description</label>
        <textarea id="f-desc" class="form-control-field" placeholder="Describe the offer..."></textarea>
    </div>
    <div class="form-group">
        <label>Coupon Code</label>
        <input type="text" id="f-code" class="form-control-field" placeholder="e.g. SAVE20" style="text-transform:uppercase;">
        <span class="field-hint">Leave blank if no coupon code needed.</span>
    </div>
    <div class="form-group">
        <div class="toggle-wrap">
            <label class="toggle-switch"><input type="checkbox" id="f-active" checked><span class="toggle-slider"></span></label>
            <span style="font-size:0.9rem;">Offer is active</span>
        </div>
    </div>`;

    openModal('Add New Offer', 'fa-tags', body, async ()=>{
        const title = document.getElementById('f-title').value.trim();
        const desc  = document.getElementById('f-desc').value.trim();
        const code  = document.getElementById('f-code').value.trim().toUpperCase();
        const active= document.getElementById('f-active').checked;
        if (!title) { showToast('Title is required.','error'); return; }
        const {error} = await db.from('offers').insert({title, description:desc, code:code||null, is_active:active});
        if (error) { showToast('Failed to add offer.','error'); return; }
        showToast('Offer added!','success');
        closeAdminModal();
        loadOffers();
    }, 'Add Offer');
};

// ══════════════════════════════
// OFFERS — EDIT
// ══════════════════════════════
window.openEditOfferModal = async function(id) {
    const {data:offer} = await db.from('offers').select('*').eq('id',id).single();
    if (!offer) return;
    const body = `
    <div class="form-group">
        <label>Offer Title <span class="req">*</span></label>
        <input type="text" id="f-title" class="form-control-field" value="${offer.title}">
    </div>
    <div class="form-group">
        <label>Description</label>
        <textarea id="f-desc" class="form-control-field">${offer.description||''}</textarea>
    </div>
    <div class="form-group">
        <label>Coupon Code</label>
        <input type="text" id="f-code" class="form-control-field" value="${offer.code||''}" style="text-transform:uppercase;">
    </div>
    <div class="form-group">
        <div class="toggle-wrap">
            <label class="toggle-switch"><input type="checkbox" id="f-active" ${offer.is_active?'checked':''}><span class="toggle-slider"></span></label>
            <span style="font-size:0.9rem;">Offer is active</span>
        </div>
    </div>`;

    openModal('Edit Offer', 'fa-pen', body, async ()=>{
        const title = document.getElementById('f-title').value.trim();
        const desc  = document.getElementById('f-desc').value.trim();
        const code  = document.getElementById('f-code').value.trim().toUpperCase();
        const active= document.getElementById('f-active').checked;
        if (!title) { showToast('Title is required.','error'); return; }
        const {error} = await db.from('offers').update({title, description:desc, code:code||null, is_active:active}).eq('id',id);
        if (error) { showToast('Failed to update offer.','error'); return; }
        showToast('Offer updated!','success');
        closeAdminModal();
        loadOffers();
    });
};

// ══════════════════════════════
// REELS — ADD
// ══════════════════════════════
window.openAddReelModal = function() {
    const body = `
    <div class="form-group">
        <label>Title <span class="req">*</span></label>
        <input type="text" id="f-title" class="form-control-field" placeholder="e.g. Kitchen Secrets">
    </div>
    <div class="form-group">
        <label>Type</label>
        <select id="f-type" class="form-control-field">
            <option value="Image">Image</option>
            <option value="Reel">Reel</option>
        </select>
    </div>
    <div class="form-group">
        <label>Thumbnail / Image URL <span class="req">*</span></label>
        <input type="text" id="f-url" class="form-control-field" placeholder="https://...">
        <div class="img-preview-wrap" id="img-prev"><span class="no-img">Preview</span></div>
    </div>
    <div class="form-group">
        <label>Instagram Link</label>
        <input type="url" id="f-igurl" class="form-control-field" placeholder="https://www.instagram.com/reel/...">
        <span class="field-hint">When users click this reel, they'll be redirected to this link.</span>
    </div>
    <div class="form-group">
        <div class="toggle-wrap">
            <label class="toggle-switch"><input type="checkbox" id="f-featured" checked><span class="toggle-slider"></span></label>
            <span style="font-size:0.9rem;">Show on homepage</span>
        </div>
    </div>`;

    openModal('Add Reel / Image', 'fa-video', body, async ()=>{
        const title   = document.getElementById('f-title').value.trim();
        const type    = document.getElementById('f-type').value;
        const url     = document.getElementById('f-url').value.trim();
        const igurl   = document.getElementById('f-igurl').value.trim();
        const featured= document.getElementById('f-featured').checked;
        if (!title||!url) { showToast('Title and URL are required.','error'); return; }
        const {error} = await db.from('gallery').insert({title, type, url, instagram_url:igurl||null, is_featured:featured});
        if (error) { showToast('Failed to add gallery item.','error'); return; }
        showToast('Gallery item added!','success');
        closeAdminModal();
        loadReels();
    }, 'Add Item');
    setTimeout(()=>bindImagePreview('f-url','img-prev'), 50);
};

// ══════════════════════════════
// REELS — EDIT
// ══════════════════════════════
window.openEditReelModal = async function(id) {
    const {data:reel} = await db.from('gallery').select('*').eq('id',id).single();
    if (!reel) return;
    const body = `
    <div class="form-group">
        <label>Title <span class="req">*</span></label>
        <input type="text" id="f-title" class="form-control-field" value="${reel.title}">
    </div>
    <div class="form-group">
        <label>Type</label>
        <select id="f-type" class="form-control-field">
            <option value="Image" ${reel.type==='Image'?'selected':''}>Image</option>
            <option value="Reel"  ${reel.type==='Reel' ?'selected':''}>Reel</option>
        </select>
    </div>
    <div class="form-group">
        <label>Thumbnail / Image URL</label>
        <input type="text" id="f-url" class="form-control-field" value="${reel.url||''}">
        <div class="img-preview-wrap" id="img-prev"><span class="no-img">Preview</span></div>
    </div>
    <div class="form-group">
        <label>Instagram Link</label>
        <input type="url" id="f-igurl" class="form-control-field" value="${reel.instagram_url||''}" placeholder="https://www.instagram.com/reel/...">
        <span class="field-hint">Users will be redirected here when they click the reel.</span>
    </div>
    <div class="form-group">
        <div class="toggle-wrap">
            <label class="toggle-switch"><input type="checkbox" id="f-featured" ${reel.is_featured?'checked':''}><span class="toggle-slider"></span></label>
            <span style="font-size:0.9rem;">Show on homepage</span>
        </div>
    </div>`;

    openModal('Edit Reel / Image', 'fa-pen', body, async ()=>{
        const title   = document.getElementById('f-title').value.trim();
        const type    = document.getElementById('f-type').value;
        const url     = document.getElementById('f-url').value.trim();
        const igurl   = document.getElementById('f-igurl').value.trim();
        const featured= document.getElementById('f-featured').checked;
        if (!title) { showToast('Title is required.','error'); return; }
        const {error} = await db.from('gallery').update({title, type, url, instagram_url:igurl||null, is_featured:featured}).eq('id',id);
        if (error) { showToast('Failed to update.','error'); return; }
        showToast('Gallery item updated!','success');
        closeAdminModal();
        loadReels();
    });
    setTimeout(()=>bindImagePreview('f-url','img-prev'), 50);
};

// ══════════════════════════════
// BOOKINGS — STATUS
// ══════════════════════════════
window.openBookingStatusModal = function(id, currentStatus) {
    const body = `
    <div style="margin-bottom:18px; padding:14px; background:#f8f9fb; border-radius:10px; font-size:0.9rem; color:var(--admin-text-light);">
        <i class="fa-solid fa-info-circle" style="color:var(--admin-primary);margin-right:6px;"></i>
        Update the booking status to keep the customer informed.
    </div>
    <div class="form-group">
        <label>New Status <span class="req">*</span></label>
        <select id="f-status" class="form-control-field">
            <option value="Pending"   ${currentStatus==='Pending'  ?'selected':''}>⏳ Pending</option>
            <option value="Confirmed" ${currentStatus==='Confirmed'?'selected':''}>✅ Confirmed</option>
            <option value="Completed" ${currentStatus==='Completed'?'selected':''}>🎉 Completed</option>
            <option value="Cancelled" ${currentStatus==='Cancelled'?'selected':''}>❌ Cancelled</option>
        </select>
    </div>
    <div class="form-group">
        <label>Note (optional)</label>
        <textarea id="f-note" class="form-control-field" placeholder="Add a note for this status change..."></textarea>
    </div>`;

    openModal('Update Booking Status', 'fa-calendar-check', body, async ()=>{
        const status = document.getElementById('f-status').value;
        const {error} = await db.from('booking_requests').update({status}).eq('id',id);
        if (error) { showToast('Failed to update booking.','error'); return; }
        showToast('Booking status updated!','success');
        closeAdminModal();
        loadBookings();
    }, 'Update Status');
};
