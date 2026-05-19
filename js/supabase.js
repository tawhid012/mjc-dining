// Configuration for Supabase
// IMPORTANT: Replace the ANON_KEY with actual Supabase anon key

const SUPABASE_URL = 'https://amrsrggwbtdmstoujlbk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcnNyZ2d3YnRkbXN0b3VqbGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjE0MjEsImV4cCI6MjA5NDY5NzQyMX0.eFEgBgyZzyCoyQ4kyQd1w8GksXQeaTiYRwJFJvHWezs';

window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to fetch menu items
async function fetchMenuItems(categorySlug = null) {
    try {
        let query = db.from('menu_items').select(`*, category:categories(name, slug)`).order('category_id').order('name');
        if (categorySlug) {
            query = query.eq('category.slug', categorySlug);
        }
        const { data, error } = await query;
        if (error) throw error;
        // Supabase foreign key filtering might return null category for items not matching the slug if not done properly
        return categorySlug ? data.filter(item => item.category && item.category.slug === categorySlug) : data;
    } catch (error) {
        console.error("Error fetching menu:", error.message);
        return [];
    }
}

async function fetchCategories() {
    try {
        const { data, error } = await db.from('categories').select('*').order('sort_order');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching categories:", error.message);
        return [];
    }
}

// Fetch Offers
async function fetchOffers() {
    try {
        const { data, error } = await db.from('offers').select('*').eq('is_active', true).order('id');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching offers:", error.message);
        return [];
    }
}

// Fetch Reels/Gallery
async function fetchReels() {
    try {
        const { data, error } = await db.from('gallery').select('*').eq('is_featured', true).order('sort_order');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching reels:", error.message);
        return [];
    }
}

// Fetch Banner
async function fetchBanner() {
    try {
        const { data, error } = await db.from('settings').select('banner_url, is_banner_active').single();
        if (error) throw error;
        return (data && data.is_banner_active) ? data.banner_url : null;
    } catch (error) {
        console.error("Error fetching banner:", error.message);
        return null;
    }
}

// Fetch Testimonials
async function fetchTestimonials() {
    try {
        const { data, error } = await db.from('testimonials').select('*').eq('is_featured', true).order('id', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching testimonials:", error.message);
        return [];
    }
}

// Fetch FAQ
async function fetchFAQs() {
    try {
        const { data, error } = await db.from('faq_items').select('*').order('sort_order');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching FAQ:", error.message);
        return [];
    }
}

// Fetch Settings
async function fetchSettings() {
    try {
        const { data, error } = await db.from('settings').select('*').single();
        if (error) throw error;
        return data || {};
    } catch (error) {
        console.error("Error fetching settings:", error.message);
        return {};
    }
}

// Fetch Homepage Content
async function fetchHomepageContent() {
    try {
        const { data, error } = await db.from('homepage_content').select('*');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching homepage content:", error.message);
        return [];
    }
}

// Save Order
async function saveOrderToDB(orderData) {
    try {
        const { data, error } = await db.from('orders').insert([orderData]).select();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error saving order:", error.message);
        return null;
    }
}

// Save Booking
async function saveBookingToDB(bookingData) {
    try {
        const { data, error } = await db.from('booking_requests').insert([bookingData]).select();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error saving booking:", error.message);
        return null;
    }
}

// Fetch Banner
async function fetchBanner() {
    try {
        const { data, error } = await db.from('settings').select('banner_url, is_banner_active').single();
        if (error || !data) return null;
        if (data.is_banner_active && data.banner_url) return data.banner_url;
        return null;
    } catch (error) {
        return null;
    }
}
