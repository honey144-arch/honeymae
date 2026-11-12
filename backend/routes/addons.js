const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM addons ORDER BY name');
        res.json(rows);
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ error: 'Internal server error while fetching addons' });
    }
});

module.exports = router;