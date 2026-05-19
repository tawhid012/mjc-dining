// Cart System using LocalStorage

let cart = JSON.parse(localStorage.getItem('mjc_cart')) || [];

function saveCart() {
    localStorage.setItem('mjc_cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(id, name, price, quantity = 1) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ id, name, price, quantity });
    }
    saveCart();
    showToast(`${name} added to cart!`);
    const drawer = document.getElementById('cart-drawer');
    if (drawer && drawer.classList.contains('open')) {
        renderCart();
    }
}

function updateQuantity(id, delta) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCart();
        renderCart();
    }
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('#cart-count-nav').forEach(el => el.textContent = count);
    const desktopCartBtn = document.querySelector('.desktop-nav .btn-primary');
    if (desktopCartBtn) {
        desktopCartBtn.innerHTML = `<i class="fa-solid fa-bag-shopping"></i> Cart (${count})`;
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalEl   = document.getElementById('cart-total-price');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-light);margin-top:2rem;">Your cart is empty.</p>';
        if (totalEl) totalEl.innerText = '₹0';
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;padding-bottom:1rem;border-bottom:1px solid var(--border-color);">
                <div style="flex:1;">
                    <h4 style="font-size:0.95rem;margin-bottom:0.2rem;">${item.name}</h4>
                    <span style="color:var(--primary-color);font-weight:600;">₹${item.price}</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;background:var(--bg-color);border-radius:20px;padding:4px 8px;">
                    <button onclick="updateQuantity(${item.id}, -1)" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:var(--text-main);">-</button>
                    <span style="font-weight:500;font-size:0.9rem;min-width:16px;text-align:center;">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:var(--text-main);">+</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    if (totalEl) totalEl.innerText = `₹${total}`;
}

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position:fixed;bottom:80px;left:50%;
            transform:translateX(-50%) translateY(100px);
            background:var(--text-main);color:white;
            padding:10px 20px;border-radius:50px;font-size:0.9rem;
            z-index:9999;opacity:0;transition:all 0.3s ease;
            box-shadow:var(--shadow-md);
        `;
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        toast.style.opacity = '0';
    }, 2500);
}

async function checkoutViaWhatsApp() {
    if (cart.length === 0) {
        showToast('Your cart is empty!');
        return;
    }

    const nameInput    = document.getElementById('cart-name');
    const phoneInput   = document.getElementById('cart-phone');
    const addressInput = document.getElementById('cart-address');
    const couponInput  = document.getElementById('cart-coupon');

    const name    = nameInput    ? nameInput.value.trim()    : '';
    const phone   = phoneInput   ? phoneInput.value.trim()   : '';
    const address = addressInput ? addressInput.value.trim() : '';
    const coupon  = couponInput  ? couponInput.value.trim()  : '';

    if (nameInput && (!name || !phone || !address)) {
        showToast('Please fill in Name, Phone, and Address!');
        return;
    }

    // Build item lines
    let total = 0;
    let itemLines = '';
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        itemLines += item.quantity + 'x ' + item.name + ' - Rs.' + itemTotal + '\n';
    });

    // Build the full message as a plain string.
    // Do NOT manually insert %0A — use encodeURIComponent on the whole thing.
    let msg = 'New Order - Mariam Juice Cafe & Dining\n';
    msg += '-----------------------------\n\n';
    msg += 'ORDER DETAILS:\n';
    msg += itemLines;
    msg += '\nTOTAL: Rs.' + total + '\n';
    if (coupon) {
        msg += 'Coupon Code: ' + coupon + '\n';
    }
    msg += '\nCUSTOMER INFO:\n';
    msg += 'Name: ' + name + '\n';
    msg += 'Phone: ' + phone + '\n';
    msg += 'Address: ' + address + '\n';
    msg += '\n[Sent via MJC Online Ordering]';

    // Save order to database
    if (typeof saveOrderToDB === 'function') {
        await saveOrderToDB({
            customer_name:    name,
            customer_phone:   phone,
            customer_address: address,
            coupon_code:      coupon || null,
            total_amount:     total,
            items:            cart
        });
    }

    // Get WhatsApp number from settings
    let whatsappNumber = '919876543210';
    if (typeof fetchSettings === 'function') {
        try {
            const settings = await fetchSettings();
            if (settings && settings.whatsapp_number) {
                whatsappNumber = settings.whatsapp_number;
            }
        } catch (_) {}
    }

    // encodeURIComponent handles ALL special chars: & # Rs emojis etc.
    const url = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(msg);

    // Clear cart
    cart = [];
    saveCart();
    renderCart();

    window.open(url, '_blank');
}

// Initialize count on page load
document.addEventListener('DOMContentLoaded', updateCartCount);
