import { Fragment, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  getAllProducts, createProduct, updateProduct, deleteProduct,
  getProductSizesAdmin, addProductSize, deleteProductSize,
  getCategories, createCategory,
  getAddonsAdmin, createAddon, deleteAddon,
  getActivity,
  getUsers, createStaff, setStaffStatus,
} from '../api/admin';
import { useAuth } from '../context/AuthContext';
import './AdminPage.css';

const TABS = [
  { key: 'products', label: 'Products' },
  { key: 'categories', label: 'Categories' },
  { key: 'addons', label: 'Add-ons' },
  { key: 'staff', label: 'Staff' },
  { key: 'activity', label: 'Activity' },
];

function useReloadableData(fetcher, tabKey, activeTab) {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (activeTab !== tabKey) return;
    setStatus('loading');
    fetcher()
      .then((rows) => { setData(rows); setStatus('success'); })
      .catch((err) => { setErrorMessage(err.message); setStatus('error'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tabKey, reloadKey]);

  return { data, status, errorMessage, reload: () => setReloadKey((k) => k + 1) };
}

function useSearch(rows, fields) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => fields.some((f) => String(row[f] ?? '').toLowerCase().includes(q)));
  }, [rows, query, fields]);
  return { query, setQuery, filtered };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('products');
  const { user, logout } = useAuth();

  const products = useReloadableData(getAllProducts, 'products', activeTab);
  const categories = useReloadableData(getCategories, 'categories', activeTab);
  const addons = useReloadableData(getAddonsAdmin, 'addons', activeTab);
  const staff = useReloadableData(getUsers, 'staff', activeTab);
  const activity = useReloadableData(getActivity, 'activity', activeTab);

  const [allCategories, setAllCategories] = useState([]);
  useEffect(() => {
    getCategories().then(setAllCategories).catch(() => {});
  }, [categories.data]);

  return (
    <div className="app-background admin-screen">
      <header className="glass-panel admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage the menu, staff, and store activity</p>
        </div>
        <div className="admin-header-right">
          <span className="admin-user">{user?.full_name || user?.username}</span>
          <button className="logout-button" onClick={logout}>Log out</button>
        </div>
      </header>

      <nav className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <motion.main
        key={activeTab}
        className="glass-panel admin-panel"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === 'products' && <ProductsPanel state={products} categories={allCategories} />}
        {activeTab === 'categories' && <CategoriesPanel state={categories} />}
        {activeTab === 'addons' && <AddonsPanel state={addons} />}
        {activeTab === 'staff' && <StaffPanel state={staff} />}
        {activeTab === 'activity' && <ActivityPanel state={activity} />}
      </motion.main>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <input
      className="admin-search"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'Search…'}
    />
  );
}

function ProductsPanel({ state, categories }) {
  const { query, setQuery, filtered } = useSearch(state.data, ['name', 'category_name']);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sizesFor, setSizesFor] = useState(null);

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      state.reload();
    } catch (err) {
      alert(err.message);
    }
  }

  if (state.status === 'loading' || state.status === 'idle') return <p className="status-message">Loading…</p>;
  if (state.status === 'error') return <p className="status-message error">{state.errorMessage}</p>;

  return (
    <div>
      <div className="panel-toolbar">
        <SearchBar value={query} onChange={setQuery} placeholder="Search products…" />
        <button className="primary-button" onClick={() => { setEditing(null); setShowForm(true); }}>
          + Add product
        </button>
      </div>

      {showForm && (
        <ProductForm
          categories={categories}
          initial={editing}
          onCancel={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); state.reload(); }}
        />
      )}

      {filtered.length === 0 ? (
        <p className="status-message">No products found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Category</th><th>Price</th><th>Active</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <Fragment key={p.product_id}>
                <tr>
                  <td>{p.name}</td>
                  <td>{p.category_name || '—'}</td>
                  <td>{p.base_price}</td>
                  <td>{p.is_active ? 'Yes' : 'No'}</td>
                  <td className="row-actions">
                    <button onClick={() => { setEditing(p); setShowForm(true); }}>Edit</button>
                    <button onClick={() => setSizesFor(sizesFor === p.product_id ? null : p.product_id)}>
                      Sizes
                    </button>
                    <button className="danger" onClick={() => handleDelete(p.product_id)}>Delete</button>
                  </td>
                </tr>
                {sizesFor === p.product_id && (
                  <tr>
                    <td colSpan={5}>
                      <SizesManager productId={p.product_id} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SizesManager({ productId }) {
  const [sizes, setSizes] = useState([]);
  const [status, setStatus] = useState('loading');
  const [sizeName, setSizeName] = useState('');
  const [priceModifier, setPriceModifier] = useState('0');

  function load() {
    setStatus('loading');
    getProductSizesAdmin(productId)
      .then((rows) => { setSizes(rows); setStatus('success'); })
      .catch(() => setStatus('error'));
  }

  useEffect(() => { load(); }, [productId]);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await addProductSize(productId, { size_name: sizeName, price_modifier: Number(priceModifier) || 0 });
      setSizeName('');
      setPriceModifier('0');
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(sizeId) {
    try {
      await deleteProductSize(sizeId);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="sizes-manager">
      {status === 'loading' && <p className="status-message">Loading sizes…</p>}
      {status === 'error' && <p className="status-message error">Could not load sizes</p>}
      {status === 'success' && (
        <div className="sizes-list">
          {sizes.map((s) => (
            <span key={s.size_id} className="size-pill">
              {s.size_name} (+{s.price_modifier})
              <button onClick={() => handleDelete(s.size_id)}>✕</button>
            </span>
          ))}
        </div>
      )}
      <form className="admin-form inline-form sizes-add-form" onSubmit={handleAdd}>
        <input value={sizeName} onChange={(e) => setSizeName(e.target.value)} placeholder="Size name (e.g. Medium)" required />
        <input type="number" step="0.01" value={priceModifier} onChange={(e) => setPriceModifier(e.target.value)} placeholder="Price add-on" />
        <button type="submit" className="primary-button">+ Add size</button>
      </form>
    </div>
  );
}

function ProductForm({ categories, initial, onCancel, onSaved }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [basePrice, setBasePrice] = useState(initial?.base_price ?? '');
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url || '');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [addDefaultSizes, setAddDefaultSizes] = useState(!initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name,
      description,
      base_price: Number(basePrice),
      category_id: categoryId || null,
      image_url: imageUrl || null,
      is_active: isActive,
      add_default_sizes: addDefaultSizes,
    };
    try {
      if (initial) {
        await updateProduct(initial.product_id, payload);
      } else {
        await createProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-form-row">
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label>Price<input type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required /></label>
        <label>
          Category
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
      </div>
      <div className="admin-form-row">
        <label className="full-width">Description<input value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      </div>
      <div className="admin-form-row">
        <label className="full-width">Image URL<input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" /></label>
      </div>
      {!initial && (
        <label className="checkbox-label">
          <input type="checkbox" checked={addDefaultSizes} onChange={(e) => setAddDefaultSizes(e.target.checked)} />
          Add default Regular/Large sizes
        </label>
      )}
      {error && <p className="login-error">{error}</p>}
      <div className="admin-form-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add product'}
        </button>
      </div>
    </form>
  );
}

function CategoriesPanel({ state }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      await createCategory(name);
      setName('');
      state.reload();
    } catch (err) {
      setError(err.message);
    }
  }

  if (state.status === 'loading' || state.status === 'idle') return <p className="status-message">Loading…</p>;
  if (state.status === 'error') return <p className="status-message error">{state.errorMessage}</p>;

  return (
    <div>
      <form className="admin-form inline-form" onSubmit={handleAdd}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" required />
        <button type="submit" className="primary-button">+ Add category</button>
      </form>
      {error && <p className="login-error">{error}</p>}

      {state.data.length === 0 ? (
        <p className="status-message">No categories yet.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Name</th></tr></thead>
          <tbody>
            {state.data.map((c) => <tr key={c.category_id}><td>{c.name}</td></tr>)}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AddonsPanel({ state }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      await createAddon({ name, price: Number(price) });
      setName('');
      setPrice('');
      state.reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this add-on?')) return;
    try {
      await deleteAddon(id);
      state.reload();
    } catch (err) {
      alert(err.message);
    }
  }

  if (state.status === 'loading' || state.status === 'idle') return <p className="status-message">Loading…</p>;
  if (state.status === 'error') return <p className="status-message error">{state.errorMessage}</p>;

  return (
    <div>
      <form className="admin-form inline-form" onSubmit={handleAdd}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add-on name (e.g. Pearls)" required />
        <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" required />
        <button type="submit" className="primary-button">+ Add add-on</button>
      </form>
      {error && <p className="login-error">{error}</p>}

      {state.data.length === 0 ? (
        <p className="status-message">No add-ons yet.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Price</th><th></th></tr></thead>
          <tbody>
            {state.data.map((a) => (
              <tr key={a.addon_id}>
                <td>{a.name}</td>
                <td>{a.price}</td>
                <td className="row-actions">
                  <button className="danger" onClick={() => handleDelete(a.addon_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StaffPanel({ state }) {
  const { query, setQuery, filtered } = useSearch(state.data, ['username', 'full_name', 'role']);
  const [showForm, setShowForm] = useState(false);

  async function handleToggle(staffMember) {
    try {
      await setStaffStatus(staffMember.user_id, !staffMember.is_active);
      state.reload();
    } catch (err) {
      alert(err.message);
    }
  }

  if (state.status === 'loading' || state.status === 'idle') return <p className="status-message">Loading…</p>;
  if (state.status === 'error') return <p className="status-message error">{state.errorMessage}</p>;

  return (
    <div>
      <div className="panel-toolbar">
        <SearchBar value={query} onChange={setQuery} placeholder="Search staff…" />
        <button className="primary-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close' : '+ Add staff'}
        </button>
      </div>

      {showForm && <StaffForm onSaved={() => { setShowForm(false); state.reload(); }} />}

      {filtered.length === 0 ? (
        <p className="status-message">No staff accounts yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Username</th><th>Full name</th><th>Role</th><th>Active</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.user_id}>
                <td>{u.username}</td>
                <td>{u.full_name || '—'}</td>
                <td>{u.role}</td>
                <td>{u.is_active ? 'Yes' : 'No'}</td>
                <td className="row-actions">
                  <button onClick={() => handleToggle(u)}>
                    {u.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StaffForm({ onSaved }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('cashier');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createStaff({ username, password, full_name: fullName, role });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-form-row">
        <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      </div>
      {error && <p className="login-error">{error}</p>}
      <div className="admin-form-actions">
        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Creating…' : 'Create account'}
        </button>
      </div>
    </form>
  );
}

function ActivityPanel({ state }) {
  if (state.status === 'loading' || state.status === 'idle') return <p className="status-message">Loading…</p>;
  if (state.status === 'error') return <p className="status-message error">{state.errorMessage}</p>;
  if (state.data.length === 0) return <p className="status-message">No activity recorded yet.</p>;

  return (
    <table className="admin-table">
      <thead><tr><th>When</th><th>User</th><th>Role</th><th>Action</th><th>Details</th></tr></thead>
      <tbody>
        {state.data.map((row) => (
          <tr key={row.log_id}>
            <td>{new Date(row.created_at).toLocaleString()}</td>
            <td>{row.username || 'Unknown'}</td>
            <td>{row.role || '—'}</td>
            <td>{row.action}</td>
            <td>{row.details}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}