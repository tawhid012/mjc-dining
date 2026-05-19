// Core Application Logic
document.addEventListener('DOMContentLoaded', async () => {
    // Scroll handling for header glassmorphism
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = 'var(--shadow-sm)';
            header.style.background = 'rgba(255, 255, 255, 0.95)';
        } else {
            header.style.boxShadow = 'none';
            header.style.background = 'var(--glass-bg)';
        }
    });

    // Lazy load images
    const images = document.querySelectorAll('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // Dynamic Homepage Elements
    const reelsContainer = document.getElementById('dynamic-reels-container');
    if (reelsContainer && typeof fetchReels === 'function') {
        const reels = await fetchReels();
        renderReels(reels, reelsContainer);
    }

    const offersContainer = document.getElementById('dynamic-offers-container');
    if (offersContainer && typeof fetchOffers === 'function') {
        const offers = await fetchOffers();
        renderOffers(offers, offersContainer);
    }

    const testContainer = document.getElementById('dynamic-testimonials-container');
    if (testContainer && typeof fetchTestimonials === 'function') {
        const testimonials = await fetchTestimonials();
        renderTestimonials(testimonials, testContainer);
    }

    const faqContainer = document.getElementById('dynamic-faq-container');
    if (faqContainer && typeof fetchFAQs === 'function') {
        const faqs = await fetchFAQs();
        renderFAQs(faqs, faqContainer);
    }

    const heroContainer = document.getElementById('dynamic-hero-container');
    if (heroContainer && typeof fetchHomepageContent === 'function') {
        const content = await fetchHomepageContent();
        const heroData = content.find(c => c.section_key === 'hero');
        if (heroData) renderHero(heroData, heroContainer);
    }

    const bestsellersContainer = document.getElementById('dynamic-bestsellers-container');
    if (bestsellersContainer && typeof fetchMenuItems === 'function') {
        const items = await fetchMenuItems();
        const bestsellers = items.filter(i => i.badge && (i.badge.toLowerCase() === 'bestseller' || i.badge.toLowerCase() === 'must try')).slice(0, 3);
        renderBestsellers(bestsellers, bestsellersContainer);
    }

    // Promo Banner
    const promoOverlay = document.getElementById('promo-overlay');
    const promoImage = document.getElementById('promo-image');
    if (promoOverlay && promoImage && typeof fetchBanner === 'function') {
        const bannerUrl = await fetchBanner();
        if (bannerUrl) {
            promoImage.src = bannerUrl;
            // Show after 2.5s
            setTimeout(() => {
                promoOverlay.classList.add('show');
            }, 2500);
        }
    }
});

// Loading Animation Logic
window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.style.display = 'none', 500);
    }
});

function renderReels(reels, container) {
    if (!reels || reels.length === 0) return;
    let html = '';
    reels.forEach(reel => {
        html += `
            <div class="reel-card">
                <img src="${reel.url || reel.image_url}" alt="${reel.title}" loading="lazy">
                <div class="reel-overlay">
                    <i class="${reel.icon || 'fa-solid fa-play'} reel-icon"></i>
                    <span class="reel-title">${reel.title}</span>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderOffers(offers, container) {
    if (!offers || offers.length === 0) return;
    let html = '';
    offers.forEach(offer => {
        const bg = offer.bg_color || '#A68A64';
        html += `
            <div class="offer-card" style="background: ${bg}; padding: 1.5rem; border-radius: 16px; color: white; min-width: 280px; flex: 0 0 auto; box-shadow: var(--shadow-sm);">
                <h3 style="margin-bottom: 0.5rem;">${offer.title}</h3>
                <p style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 1rem;">${offer.description}</p>
                ${offer.code ? `<div style="background: rgba(0,0,0,0.2); display: inline-block; padding: 4px 10px; border-radius: 8px; font-family: monospace;">${offer.code}</div>` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

// Cart UI Toggle
function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.querySelector('.cart-overlay');
    
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    } else {
        drawer.classList.add('open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        renderCart(); // defined in cart.js
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const drawer = document.getElementById('mobile-nav-drawer');
    const overlay = document.querySelector('.cart-overlay'); // reuse overlay
    if (!drawer) return;
    
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    } else {
        drawer.classList.add('open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Promo Banner Close
function closePromo() {
    const overlay = document.getElementById('promo-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

function renderTestimonials(testimonials, container) {
    if (!testimonials || testimonials.length === 0) return;
    let html = '';
    testimonials.forEach(t => {
        const stars = Array(t.rating).fill('<i class="fa-solid fa-star"></i>').join('');
        const emptyStars = Array(5 - (t.rating || 5)).fill('<i class="fa-regular fa-star"></i>').join('');
        html += `
            <div class="testimonial-card">
                <div class="testimonial-rating">${stars}${emptyStars}</div>
                <p class="testimonial-text">"${t.text}"</p>
                <div class="testimonial-user">
                    <div class="testimonial-avatar" style="background-image: url('${t.avatar_url}'); background-size: cover;"></div>
                    <span class="testimonial-name">${t.customer_name}</span>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderFAQs(faqs, container) {
    if (!faqs || faqs.length === 0) return;
    let html = '';
    faqs.forEach(f => {
        html += `
            <div class="faq-item">
                <button class="faq-question">${f.question} <i class="fa-solid fa-chevron-down faq-icon"></i></button>
                <div class="faq-answer"><p>${f.answer}</p></div>
            </div>
        `;
    });
    container.innerHTML = html;
    
    // Reattach FAQ toggle listeners
    const faqItems = container.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        questionBtn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(faq => faq.classList.remove('active'));
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

function renderHero(heroData, container) {
    if (!heroData) return;
    const { badge, primary_btn, secondary_btn } = heroData.content || {};
    let html = '';
    if (badge) {
        html += `<span style="display:inline-block; background:rgba(166,138,100,0.2); color:var(--primary-color); padding:0.4rem 1rem; border-radius:30px; font-weight:600; font-size:0.85rem; letter-spacing:1px; margin-bottom:1rem; text-transform:uppercase; border:1px solid rgba(166,138,100,0.3);">${badge}</span>`;
    }
    html += `<h1 style="font-size: 2.8rem; font-weight: 700;">${heroData.title}</h1>`;
    html += `<p style="font-size: 1.1rem;">${heroData.subtitle}</p>`;
    html += `<div class="hero-cta">
        <a href="menu.html" class="btn btn-primary"><i class="fa-solid fa-utensils mr-2"></i> ${primary_btn || 'Order Now'}</a>
        <a href="booking.html" class="btn btn-outline"><i class="fa-regular fa-calendar mr-2"></i> ${secondary_btn || 'Book Dining'}</a>
    </div>`;
    
    container.innerHTML = html;
}

function renderBestsellers(items, container) {
    if (!items || items.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); text-align: center; width: 100%;">No items available.</p>';
        return;
    }
    let html = '';
    items.forEach(item => {
        const badgeHtml = item.badge ? `<span class="food-badge" ${item.badge.toLowerCase() === 'trending' ? 'style="color: #FF5722;"' : ''}>${item.badge}</span>` : '';
        html += `
            <div class="food-card hover-lift">
                <div class="food-img-container">
                    ${badgeHtml}
                    <img src="${item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'}" alt="${item.name}" loading="lazy">
                </div>
                <div class="food-info">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <h3 class="food-title" style="margin:0;">${item.name}</h3>
                        <span style="font-size:0.8rem; color:#FFD700;"><i class="fa-solid fa-star"></i> 4.8</span>
                    </div>
                    <p class="food-desc">${item.description || ''}</p>
                    <div class="food-footer">
                        <span class="food-price">₹${item.price}</span>
                        <button class="add-btn" aria-label="Add to cart" onclick="addToCart(${item.id}, '${item.name.replace(/'/g, "\\'")}', ${item.price})"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}
