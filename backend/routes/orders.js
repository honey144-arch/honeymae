const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// items: [{ product_id, size_id, quantity, price, addons: [{ addon_id, price }] }]
router.post('/', requireAuth, async (req, res) => {
    const { items, payment_method, amount_tendered, total } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [orderResult] = await connection.query(
            'INSERT INTO orders (staff_id, total_amount, payment_method, status) VALUES (?, ?, ?, ?)',
            [req.user.user_id, total, payment_method, 'completed']
        );
        const orderId = orderResult.insertId;

        for (const item of items) {
            const [itemResult] = await connection.query(
                'INSERT INTO order_items (order_id, product_id, size_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.product_id, item.size_id || null, item.quantity, item.price]
            );
            const orderItemId = itemResult.insertId;

            if (Array.isArray(item.addons)) {
                for (const addon of item.addons) {
                    await connection.query(
                        'INSERT INTO order_item_addons (order_item_id, addon_id, price) VALUES (?, ?, ?)',
                        [orderItemId, addon.addon_id, addon.price]
                    );
                }
            }
        }

        await connection.query(
            'INSERT INTO staff_activity_log (staff_id, action, details) VALUES (?, ?, ?)',
            [req.user.user_id, 'order_created', `Order #${orderId} - ${payment_method} - ${total}`]
        );

        await connection.commit();

        res.status(201).json({
            order_id: orderId,
            total,
            amount_tendered,
            change: amount_tendered !== undefined ? Number(amount_tendered) - Number(total) : undefined,
        });
    } catch (err) {
        await connection.rollback();
        console.error('Order creation error:', err.message);
        res.status(500).json({ error: `Could not save order: ${err.message}` });
    } finally {
        connection.release();
    }
});

module.exports = router;