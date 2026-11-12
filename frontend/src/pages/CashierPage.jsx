import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getProducts } from '../api/products';
import { getAddons } from '../api/addons';
import { useAuth } from '../context/AuthContext';
import ProductModal from '../components/ProductModal';
import CartDrawer from '../components/CartDrawer';
import PaymentModal from '../components/PaymentModal';
import './CashierPage.css';

function formatPrice(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'PHP' });
}

function ProductCard({ product, onSelect }) {
  const id = product.product_id ?? product.id;

  return (
    <motion.button
      className="glass-panel product-card"
      layoutId={`product-${id}`}
      onClick={() => onSelect(product)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="product-image">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <div className="product-image-placeholder">🧋</div>
        )}
      </div>
      <div className="product-body">
        {product.category_name && <span className="product-category">{product.category_name}</span>}
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">from {formatPrice(product.base_price)}</p>
      </div>
    </motion.button>
  );
}

function makeCartKey(product, size, addons) {
  const productId = product.product_id ?? product.id;
  const sizeId = size?.size_id ?? 'none';
  const addonKey = addons.map((a) => a.addon_id).sort((a, b) => a - b).join(',');
  return `${productId}-${sizeId}-${addonKey}`;
}

export default function CashierPage() {
  const [products, setProducts] = useState([]);
  const [addons, setAddons] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    let isMounted = true;
    Promise.all([getProducts(), getAddons()])
      .then(([productRows, addonRows]) => {
        if (isMounted) {
          setProducts(productRows);
          setAddons(addonRows);
          setStatus('success');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(err.message);
          setStatus('error');
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  function addToCart({ product, size, addons: chosenAddons, quantity, unitPrice }) {
    const key = makeCartKey(product, size, chosenAddons);
    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { key, product, size, addons: chosenAddons, quantity, unitPrice }];
    });
    setShowCart(true);
  }

  function changeQuantity(key, quantity) {
    if (quantity <= 0) {
      removeFromCart(key);
      return;
    }
    setCart((prev) => prev.map((item) => (item.key === key ? { ...item, quantity } : item)));
  }

  function removeFromCart(key) {
    setCart((prev) => prev.filter((item) => item.key !== key));
  }

  function handleOrderComplete() {
    setCart([]);
    setShowPayment(false);
    setShowCart(false);
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-background cashier-screen">
      <header className="glass-panel cashier-header">
        <div>
          <h1>Honey's Milktea Shop</h1>
          <p>Tap a drink to customize and add to cart</p>
        </div>
        <div className="cashier-header-right">
          <span className="cashier-user">{user?.full_name || user?.username}</span>
          <button className="logout-button" onClick={logout}>Log out</button>
        </div>
      </header>

      <main className="cashier-content">
        {status === 'loading' && <p className="status-message">Loading menu…</p>}
        {status === 'error' && <div className="status-message error"><p>Couldn't load menu: {errorMessage}</p></div>}
        {status === 'success' && products.length === 0 && <p className="status-message">No products found yet.</p>}
        {status === 'success' && products.length > 0 && (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.product_id ?? product.id} product={product} onSelect={setSelected} />
            ))}
          </div>
        )}
      </main>

      <button className="cart-fab" onClick={() => setShowCart(true)}>
        🛒
        {cartCount > 0 && <span className="cart-fab-badge">{cartCount}</span>}
      </button>

      <AnimatePresence>
        {selected && (
          <ProductModal
            product={selected}
            addons={addons}
            onClose={() => setSelected(null)}
            onAddToCart={addToCart}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCart && !showPayment && (
          <CartDrawer
            cart={cart}
            onQuantityChange={changeQuantity}
            onRemove={removeFromCart}
            onClose={() => setShowCart(false)}
            onCheckout={() => setShowPayment(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayment && (
          <PaymentModal
            cart={cart}
            onClose={() => setShowPayment(false)}
            onComplete={handleOrderComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}