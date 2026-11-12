import { motion, AnimatePresence } from 'framer-motion';

function formatPrice(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'PHP' });
}

export default function CartDrawer({ cart, onQuantityChange, onRemove, onClose, onCheckout }) {
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <motion.div
      className="cart-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-panel cart-drawer"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cart-header">
          <h2>Current order</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {cart.length === 0 ? (
          <p className="status-message">Cart is empty. Tap a drink to add it.</p>
        ) : (
          <div className="cart-items">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div
                  key={item.key}
                  className="cart-item"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="cart-item-info">
                    <span className="cart-item-name">
                      {item.product.name}
                      {item.size ? ` (${item.size.size_name})` : ''}
                    </span>
                    {item.addons.length > 0 && (
                      <span className="cart-item-addons">
                        + {item.addons.map((a) => a.name).join(', ')}
                      </span>
                    )}
                    <span className="cart-item-price">{formatPrice(item.unitPrice)} each</span>
                  </div>
                  <div className="cart-item-controls">
                    <button onClick={() => onQuantityChange(item.key, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => onQuantityChange(item.key, item.quantity + 1)}>+</button>
                    <button className="cart-remove" onClick={() => onRemove(item.key)}>Remove</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="cart-footer">
          <div className="cart-subtotal">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <button
            className="primary-button cart-checkout"
            disabled={cart.length === 0}
            onClick={onCheckout}
          >
            Proceed to payment
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}