const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin'));

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// --- Products ---

router.get('/products', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            ORDER BY p.product_id DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while fetching products' });
    }
});

router.post('/products', async (req, res) => {
    const { name, description, base_price, category_id, image_url, is_active, add_default_sizes } = req.body;
    if (!name || base_price === undefined) {
        return res.status(400).json({ error: 'name and base_price are required' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO products (name, slug, description, base_price, category_id, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, slugify(name), description || null, base_price, category_id || null, image_url || null, is_active === undefined ? true : is_active]
        );

        if (add_default_sizes) {
            await db.query(
                'INSERT INTO product_sizes (product_id, size_name, price_modifier) VALUES (?, ?, 0), (?, ?, 15)',
                [result.insertId, 'Regular', result.insertId, 'Large']
            );
        }

        res.status(201).json({ product_id: result.insertId });
    } catch (err) {
        console.error('Database Error:', err.message);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'A product with a similar name already exists' });
        }
        res.status(500).json({ error: 'Internal server error while creating product' });
    }
});

router.put('/products/:id', async (req, res) => {
    const { name, description, base_price, category_id, image_url, is_active } = req.body;
    try {
        await db.query(
            'UPDATE products SET name = ?, slug = ?, description = ?, base_price = ?, category_id = ?, image_url = ?, is_active = ? WHERE product_id = ?',
            [name, slugify(name), description || null, base_price, category_id || null, image_url || null, is_active, req.params.id]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while updating product' });
    }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE product_id = ?', [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while deleting product' });
    }
});

// --- Product sizes ---

router.get('/products/:id/sizes', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM product_sizes WHERE product_id = ?', [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while fetching sizes' });
    }
});

router.post('/products/:id/sizes', async (req, res) => {
    const { size_name, price_modifier } = req.body;
    if (!size_name) return res.status(400).json({ error: 'size_name is required' });
    try {
        const [result] = await db.query(
            'INSERT INTO product_sizes (product_id, size_name, price_modifier) VALUES (?, ?, ?)',
            [req.params.id, size_name, price_modifier || 0]
        );
        res.status(201).json({ size_id: result.insertId });
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while adding size' });
    }
});

router.delete('/sizes/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM product_sizes WHERE size_id = ?', [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while deleting size' });
    }
});

// --- Categories ---

router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(rows);
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while fetching categories' });
    }
});

router.post('/categories', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    try {
        const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
        res.status(201).json({ category_id: result.insertId });
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while creating category' });
    }
});

// --- Add-ons ---

router.get('/addons', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM addons ORDER BY name');
        res.json(rows);
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while fetching addons' });
    }
});

router.post('/addons', async (req, res) => {
    const { name, price } = req.body;
    if (!name || price === undefined) return res.status(400).json({ error: 'name and price are required' });
    try {
        const [result] = await db.query('INSERT INTO addons (name, price) VALUES (?, ?)', [name, price]);
        res.status(201).json({ addon_id: result.insertId });
    } catch (err) {
        console.error('Database Error:', err.message);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'That addon already exists' });
        }
        res.status(500).json({ error: 'Internal server error while creating addon' });
    }
});

router.delete('/addons/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM addons WHERE addon_id = ?', [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while deleting addon' });
    }
});

// --- Activity log ---

router.get('/activity', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT sal.log_id, sal.action, sal.details, sal.created_at,
                   sa.username, sa.role
            FROM staff_activity_log sal
            LEFT JOIN staff_accounts sa ON sal.staff_id = sa.staff_id
            ORDER BY sal.created_at DESC
            LIMIT 100
        `);
        res.json(rows);
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while fetching activity' });
    }
});

// --- Staff accounts ---

router.get('/users', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT staff_id AS user_id, username, full_name, role, is_active, created_at
            FROM staff_accounts
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while fetching users' });
    }
});

router.post('/staff', async (req, res) => {
    const { username, password, full_name, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'username, password, and role are required' });
    }
    if (!['admin', 'cashier'].includes(role)) {
        return res.status(400).json({ error: 'role must be admin or cashier' });
    }
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO staff_accounts (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
            [username, passwordHash, full_name || null, role]
        );
        res.status(201).json({ staff_id: result.insertId });
    } catch (err) {
        console.error('Database Error:', err.message);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'That username is already taken' });
        }
        res.status(500).json({ error: 'Internal server error while creating staff account' });
    }
});

router.patch('/staff/:id/status', async (req, res) => {
    const { is_active } = req.body;
    try {
        await db.query('UPDATE staff_accounts SET is_active = ? WHERE staff_id = ?', [is_active, req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while updating staff account' });
    }
});

module.exports = router;