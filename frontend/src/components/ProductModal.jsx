import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getProductSizes } from '../api/products';

function formatPrice(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'PHP' });
}

export default function ProductModal({ product, addons, onClose, onAddToCart }) {
  const productId = product.product_id ?? product.id;
  const [sizes, setSizes] = useState([]);
  const [sizesStatus, setSizesStatus] = useState('loading');
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let isMounted = true;
    getProductSizes(productId)
      .then((rows) => {
        if (!isMounted) return;
        setSizes(rows);
        setSizesStatus('success');
        if (rows.length > 0) setSelectedSizeId(rows[0].size_id);
      })
      .catch(() => {
        if (isMounted) setSizesStatus('error');
      });
    return () => {
      isMounted = false;
    };
  }, [productId]);

  function toggleAddon(addonId) {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  }

  const selectedSize = sizes.find((s) => s.size_id === selectedSizeId);
  const selectedAddons = addons.filter((a) => selectedAddonIds.includes(a.addon_id));
  const unitPrice =
    Number(product.base_price) +
    Number(selectedSize?.price_modifier || 0) +
    selectedAddons.reduce((sum, a) => sum + Number(a.price), 0);
  const lineTotal = unitPrice * quantity;

  function handleAddToCart() {
    onAddToCart({
      product,
      size: selectedSize || null,
      addons: selectedAddons,
      quantity,
      unitPrice,
    });
    onClose();
  }

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-panel modal-card"
        layoutId={`product-${productId}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="modal-image">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <div className="modal-image-placeholder">🧋</div>
          )}
        </div>

        <div className="modal-body">
          {product.category_name && <span className="modal-category">{product.category_name}</span>}
          <h2>{product.name}</h2>
          {product.description && <p className="modal-description">{product.description}</p>}

          {sizesStatus === 'loading' && <p className="modal-hint">Loading sizes…</p>}

          {sizesStatus === 'success' && sizes.length > 0 && (
            <div className="option-group">
              <span className="option-label">Size</span>
              <div className="option-choices">
                {sizes.map((size) => (
                  <button
                    key={size.size_id}
                    className={`option-chip ${selectedSizeId === size.size_id ? 'active' : ''}`}
                    onClick={() => setSelectedSizeId(size.size_id)}
                  >
                    {size.size_name}
                    {Number(size.price_modifier) > 0 && ` (+${formatPrice(size.price_modifier)})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {addons.length > 0 && (
            <div className="option-group">
              <span className="option-label">Add-ons</span>
              <div className="option-choices">
                {addons.map((addon) => (
                  <button
                    key={addon.addon_id}
                    className={`option-chip ${selectedAddonIds.includes(addon.addon_id) ? 'active' : ''}`}
                    onClick={() => toggleAddon(addon.addon_id)}
                  >
                    {addon.name} (+{formatPrice(addon.price)})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="option-group quantity-group">
            <span className="option-label">Quantity</span>
            <div className="quantity-stepper">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>
          </div>

          <p className="modal-price">{formatPrice(lineTotal)}</p>

          <button className="primary-button modal-add-to-cart" onClick={handleAddToCart}>
            Add to cart
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}