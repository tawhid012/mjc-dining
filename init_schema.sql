-- MJC & Dining Supabase Initial Schema

-- 1. Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Menu Items
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    badge TEXT,
    tags TEXT[] DEFAULT '{}',  -- e.g. {popular, bestseller, new, trending, special}
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    coupon_code TEXT,
    total_amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'Pending',
    items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Booking Requests
CREATE TABLE booking_requests (
    id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    guests INTEGER NOT NULL,
    booking_type TEXT NOT NULL, -- 'Dining' or 'Birthday Party'
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Offers
CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    code TEXT,
    bg_color TEXT DEFAULT '#A68A64',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Gallery / Reels
CREATE TABLE gallery (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Image' or 'Reel'
    instagram_url TEXT,  -- Instagram reel/post link; users are redirected here on click
    icon TEXT DEFAULT 'fa-solid fa-image',
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- MIGRATION (run on existing DB if tables already exist):
-- ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
-- ALTER TABLE gallery ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 7. Settings
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    banner_url TEXT,
    is_banner_active BOOLEAN DEFAULT true,
    whatsapp_number TEXT DEFAULT '919876543210',
    address TEXT DEFAULT 'Station Road, Hailakandi, Assam',
    opening_hours TEXT DEFAULT 'Mon-Sun: 10 AM - 10 PM',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Testimonials
CREATE TABLE testimonials (
    id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    text TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    avatar_url TEXT,
    is_featured BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. FAQ Items
CREATE TABLE faq_items (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. Social Links
CREATE TABLE social_links (
    id SERIAL PRIMARY KEY,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. Homepage Content (Hero Texts, Trust Badges, etc.)
CREATE TABLE homepage_content (
    id SERIAL PRIMARY KEY,
    section_key TEXT UNIQUE NOT NULL,
    title TEXT,
    subtitle TEXT,
    content JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;

-- Create policies (Public read, Authenticated write)
CREATE POLICY "Allow public read-only access" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access" ON categories FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read-only access" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access" ON menu_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public insert and authenticated full access" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON orders FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public insert and authenticated full access" ON booking_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON booking_requests FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read-only access" ON offers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access" ON offers FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read-only access" ON gallery FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access" ON gallery FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read-only access" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access" ON settings FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read-only access" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access" ON testimonials FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read-only access" ON faq_items FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access" ON faq_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read-only access" ON social_links FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access" ON social_links FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read-only access" ON homepage_content FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access" ON homepage_content FOR ALL USING (auth.role() = 'authenticated');


-- ==========================================
-- INITIAL DATA INSERTS
-- ==========================================

INSERT INTO settings (banner_url, is_banner_active, whatsapp_number, address, opening_hours)
VALUES ('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop', true, '919876543210', 'Station Road, Hailakandi, Assam', 'Mon-Sun: 10 AM - 10 PM');

INSERT INTO categories (name, slug, icon, sort_order) VALUES
('Fresh Juices', 'juice', 'fa-solid fa-glass-water', 1),
('Shakes', 'shakes', 'fa-solid fa-blender', 2),
('Coffee', 'coffee', 'fa-solid fa-mug-hot', 3),
('Fast Food', 'fastfood', 'fa-solid fa-burger', 4),
('Chinese', 'chinese', 'fa-solid fa-bowl-rice', 5),
('Party Deals', 'dining', 'fa-solid fa-cake-candles', 6);

INSERT INTO menu_items (name, description, price, category_id, image_url, is_available, badge) VALUES
('Premium Chicken Burger', 'Juicy grilled chicken patty with fresh lettuce', 149, 4, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop', true, 'Bestseller'),
('Oreo Chocolate Shake', 'Thick chocolate shake blended with crunchy Oreo', 129, 2, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=400&auto=format&fit=crop', true, 'Must Try'),
('Fresh Mixed Fruit Juice', '100% natural, cold-pressed mixed fruit juice', 99, 1, 'https://images.unsplash.com/photo-1623366302587-bcaaf850c597?q=80&w=400&auto=format&fit=crop', true, NULL),
('Classic Hakka Noodles', 'Wok-tossed noodles with fresh veggies', 110, 5, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=400&auto=format&fit=crop', true, NULL),
('Cold Coffee', 'Classic blended iced coffee', 89, 3, 'https://images.unsplash.com/photo-1461023058943-07cb1ce8f5f4?q=80&w=400&auto=format&fit=crop', true, NULL);

INSERT INTO offers (title, description, code, bg_color, is_active) VALUES
('Weekend Family Feast', 'Get 20% off on all family dining orders above ₹1000 every weekend.', 'WEEKEND20', '#A68A64', true),
('Happy Hours', 'Buy 1 Get 1 Free on all fresh juices and shakes from 3 PM to 5 PM.', 'HAPPYMJC', '#4CAF50', true);

INSERT INTO gallery (title, url, type, icon, is_featured, sort_order) VALUES
('Kitchen Secrets', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop', 'reel', 'fa-solid fa-play', true, 1),
('Cheese Pulls 🍕', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop', 'reel', 'fa-brands fa-instagram', true, 2),
('Morning Brew', 'https://images.unsplash.com/photo-1461023058943-07cb1ce8f5f4?q=80&w=400&auto=format&fit=crop', 'reel', 'fa-solid fa-play', true, 3),
('Our Ambience', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400&auto=format&fit=crop', 'image', 'fa-brands fa-instagram', true, 4);

INSERT INTO testimonials (customer_name, text, rating, avatar_url, is_featured) VALUES
('Ria Das', 'Best cafe in Hailakandi! The ambiance is absolutely premium, and the Oreo shake is to die for.', 5, 'https://ui-avatars.com/api/?name=Ria+Das&background=A68A64&color=fff', true),
('Aman Barbhuiya', 'The hygiene standard they maintain is incredible. Ordered Hakka Noodles and a fresh watermelon juice. The taste and packaging were 10/10.', 4, 'https://ui-avatars.com/api/?name=Aman+Barbhuiya&background=4CAF50&color=fff', true),
('Sneha L.', 'Very aesthetic place for clicking pictures. The staff is polite, and the service is surprisingly fast even on weekends.', 5, 'https://ui-avatars.com/api/?name=Sneha+L&background=2C2A29&color=fff', true);

INSERT INTO faq_items (question, answer, sort_order) VALUES
('How do I order online?', 'Simply browse our menu, add your favorite items to the cart, and click checkout! Your order will be instantly formatted and sent to our official WhatsApp for rapid processing.', 1),
('Do you host birthday parties?', 'Yes, absolutely! We specialize in birthday parties and family gatherings. You can use our Book Table page to request a reservation, and we also provide free customized decorations for groups of 10 or more.', 2),
('What are your opening hours?', 'We are open 7 days a week from 10:00 AM to 10:00 PM. We recommend advance booking for weekends as it tends to get crowded.', 3),
('Do you provide takeaway packaging?', 'Yes, all our food and drinks can be securely packed in premium, spill-proof containers perfect for carrying home or taking on a journey.', 4);

INSERT INTO social_links (platform, url, icon) VALUES
('Facebook', '#', 'fa-brands fa-facebook'),
('Instagram', '#', 'fa-brands fa-instagram'),
('WhatsApp', 'https://wa.me/919876543210', 'fa-brands fa-whatsapp');

INSERT INTO homepage_content (section_key, title, subtitle, content) VALUES
('hero', 'A Taste of Luxury in Hailakandi', 'Experience premium dining, artisanal coffee, and fresh cold-pressed juices crafted to perfection.', '{"badge": "Best In Town", "primary_btn": "Order Now", "secondary_btn": "Book Dining"}'),
('why_us', 'The MJC Standard', 'Why we are Hailakandi''s favorite', '[{"title": "Premium Quality", "desc": "We never compromise. From coffee beans to fresh farm produce, only the best makes it to your table.", "icon": "fa-solid fa-medal"}, {"title": "Family Friendly", "desc": "A safe, airy, and beautiful environment perfect for families, couples, and friends to connect.", "icon": "fa-solid fa-heart"}, {"title": "Affordable Luxury", "desc": "Experience 5-star cafe aesthetics and taste without the premium price tag.", "icon": "fa-solid fa-wallet"}]');
