const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// All active menu items with category name
router.get('/', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.is_active = TRUE
            ORDER BY c.name, p.name
        `);
        res.json(rows);
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while fetching products' });
    }
});

// Size options for one product (Regular/Large etc, with price add-ons)
router.get('/:id/sizes', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM product_sizes WHERE product_id = ? ORDER BY price_modifier',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while fetching sizes' });
    }
});

module.exports = router;