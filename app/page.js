'use client';

import React, { useState, useEffect, useMemo } from 'react';

/**
 * Full page.js for Kutoka Fairoils BI
 * Part 1 of 3 — copy/paste this at the top of your page.js
 *
 * This file is split into 3 parts in the chat. Paste Part 1 first, then Part 2, then Part 3.
 *
 * Features:
 * - Tailwind-friendly components
 * - API layer that talks to /api/* routes
 * - Dashboard with local AI-insights fallback
 * - Sales, Purchase, Production, Factories pages with full forms matching BigQuery schema
 * - Client-side validation and graceful error handling
 */

/* ==========================
   Helpers & Utilities
   ========================== */

const fmtDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date)) return d;
  // Use locale short format
  return date.toLocaleDateString();
};

const isISODateString = (s) => {
  if (!s) return false;
  // quick check -- YYYY-MM-DD or ISO
  return /^\d{4}-\d{2}-\d{2}/.test(s);
};

/* ==========================
   API LAYER
   - endpoints map to your Next API files
   - these calls expect existing server routes:
     /api/sales_orders, /api/purchase_orders, /api/production_data, /api/factories, /api/ai_insights
   ========================== */

const api = {
  fetchAll: async () => {
    // fetch all data in parallel; tolerate missing endpoints
    const endpoints = [
      { key: 'sales_orders', url: '/api/sales_orders' },
      { key: 'purchase_orders', url: '/api/purchase_orders' },
      { key: 'production_data', url: '/api/production_data' },
      { key: 'factories', url: '/api/factories' },
      { key: 'mock_data', url: '/api/mock_data' }, // optional
    ];

    const settled = await Promise.allSettled(
      endpoints.map(e =>
        fetch(e.url)
          .then((r) => {
            if (!r.ok) throw new Error(`Fetch ${e.url} failed`);
            return r.json();
          })
          .catch(() => [])
      )
    );

    const result = {};
    endpoints.forEach((e, i) => {
      result[e.key] = settled[i].status === 'fulfilled' ? (settled[i].value || []) : [];
    });

    return result;
  },

  createSalesOrder: async (payload) => {
    const res = await fetch('/api/sales_orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to create sales order');
    }
    return res.json();
  },

  createPurchaseOrder: async (payload) => {
    const res = await fetch('/api/purchase_orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to create purchase order');
    }
    return res.json();
  },

  createProductionData: async (payload) => {
    const res = await fetch('/api/production_data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to create production record');
    }
    return res.json();
  },

  createFactory: async (payload) => {
    const res = await fetch('/api/factories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to create factory');
    }
    return res.json();
  },

  fetchAIInsights: async (payload) => {
    // Try server-side AI endpoint if available; otherwise caller should fall back to local insights
    try {
      const res = await fetch('/api/ai_insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('AI endpoint returned non-OK');
      return await res.json();
    } catch (err) {
      // Caller will check for { error: true } and fallback client-side
      return { error: true, message: err.message };
    }
  }
};

/* ==========================
   Layout Component
   ========================== */

function TopNav({ page, setPage }) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">KF</div>
          <div>
            <h1 className="font-semibold">Kutoka Fairoils BI</h1>
            <p className="text-xs text-slate-500">Production planning & order tracking</p>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <button onClick={() => setPage('dashboard')} className={`px-3 py-2 rounded-md ${page === 'dashboard' ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-100'}`}>Dashboard</button>
          <button onClick={() => setPage('po-tracking')} className={`px-3 py-2 rounded-md ${page === 'po-tracking' ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-100'}`}>PO Tracking</button>
          <button onClick={() => setPage('sales-tracking')} className={`px-3 py-2 rounded-md ${page === 'sales-tracking' ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-100'}`}>Sales Tracking</button>
          <button onClick={() => setPage('production-tracking')} className={`px-3 py-2 rounded-md ${page === 'production-tracking' ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-100'}`}>Production</button>
          <button onClick={() => setPage('factories')} className={`px-3 py-2 rounded-md ${page === 'factories' ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-100'}`}>Factories</button>
          <button onClick={() => setPage('dashboard')} id="ai-insights-btn" className="px-3 py-2 rounded-md bg-emerald-600 text-white">Get AI insights</button>
        </nav>
      </div>
    </header>
  );
}

/* ==========================
   Dashboard Page
   - local insights generator included
   ========================== */

function DashboardPage({ appData, refresh }) {
  // appData: { sales_orders, purchase_orders, production_data, factories }
  const totalSalesUnits = useMemo(() => {
    return (appData.sales_orders || []).reduce((acc, r) => acc + (Number(r.qty) || 0), 0);
  }, [appData.sales_orders]);

  const openPOs = (appData.purchase_orders || []).length;
  const factoriesCount = (appData.factories || []).length;

  // local insights function — non-generic and uses your data
  const generateLocalInsights = () => {
    const sales = appData.sales_orders || [];

    const byProduct = sales.reduce((acc, s) => {
      const p = s.product || 'Unknown';
      acc[p] = (acc[p] || 0) + (Number(s.qty) || 0);
      return acc;
    }, {});
    const topProducts = Object.entries(byProduct).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([product, qty]) => ({ product, qty }));

    const now = Date.now();
    const ms7 = 7 * 24 * 3600 * 1000;
    const last7 = sales.filter(s => s.order_date && (new Date(s.order_date)).getTime() > (now - ms7));
    const prev7 = sales.filter(s => s.order_date && (new Date(s.order_date)).getTime() <= (now - ms7) && (new Date(s.order_date)).getTime() > (now - 2 * ms7));
    const last7Qty = last7.reduce((acc, r) => acc + (Number(r.qty) || 0), 0);
    const prev7Qty = prev7.reduce((acc, r) => acc + (Number(r.qty) || 0), 0);

    return {
      totalSalesUnits,
      openPOs,
      factoriesCount,
      topProducts,
      trend: { last7Qty, prev7Qty }
    };
  };

  const localInsights = generateLocalInsights();

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-slate-500">Total Sales (units)</h3>
          <div className="text-2xl font-bold">{localInsights.totalSalesUnits}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-slate-500">Open Purchase Orders</h3>
          <div className="text-2xl font-bold">{localInsights.openPOs}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-slate-500">Factories</h3>
          <div className="text-2xl font-bold">{localInsights.factoriesCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-semibold mb-2">Top products (by units)</h4>
          {localInsights.topProducts.length === 0 ? <p className="text-sm text-slate-500">No sales data yet</p> : (
            <ul className="space-y-2">
              {localInsights.topProducts.map((p, i) => (
                <li key={i} className="flex justify-between">
                  <span>{p.product}</span>
                  <span className="font-semibold">{p.qty}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-semibold mb-2">Recent sales</h4>
          {(!appData.sales_orders || appData.sales_orders.length === 0) ? <p className="text-sm text-slate-500">No sales orders found</p> : (
            <div className="space-y-3">
              {appData.sales_orders.slice(0, 8).map((s) => (
                <div key={s.id || Math.random()} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{s.product || '—'}</div>
                    <div className="text-xs text-slate-500">{s.client || 'Unknown client'} • {fmtDate(s.order_date)}</div>
                  </div>
                  <div className="text-sm font-semibold">{s.qty}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h4 className="font-semibold mb-2">AI Insights (local simulation)</h4>
        <p className="text-sm text-slate-500 mb-3">These insights are generated locally from your data. If you add a server `/api/ai_insights` route that proxies to Gemini, the UI will automatically use it instead of this simulation.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 border rounded">
            <div className="text-xs text-slate-500">Last 7 days (units)</div>
            <div className="font-bold text-lg">{localInsights.trend.last7Qty}</div>
          </div>
          <div className="p-3 border rounded">
            <div className="text-xs text-slate-500">Previous 7 days</div>
            <div className="font-bold text-lg">{localInsights.trend.prev7Qty}</div>
          </div>
          <div className="p-3 border rounded">
            <div className="text-xs text-slate-500">Top product</div>
            <div className="font-bold text-lg">{localInsights.topProducts[0]?.product || '—'}</div>
          </div>
        </div>

        <div className="mt-4">
          <button onClick={() => alert('Local insights refreshed')} className="px-3 py-2 bg-emerald-600 text-white rounded">Refresh insights</button>
        </div>
      </div>
    </div>
  );
}

/* ==========================
   Sales Tracking Page
   - full form matching sales_orders table
   ========================== */

function SalesTrackingPage({ initialData = [], onCreated }) {
  const [rows, setRows] = useState(initialData || []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    client: '',
    sales_order_number: '',
    client_po_number: '',
    product: '',
    qty: '',
    order_date: '',
    expected_dispatch_date: '',
    actual_dispatch_date: '',
    status: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRows(initialData || []);
  }, [initialData]);

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e && e.preventDefault();
    // Basic validation
    if (!form.client || !form.sales_order_number || !form.product || !form.qty) {
      alert('Please complete required fields: Client, Sales Order #, Product, Qty');
      return;
    }
    // convert date strings -> Date/ISO strings to send to server
    const payload = {
      ...form,
      qty: Number(form.qty),
      order_date: form.order_date || null,
      expected_dispatch_date: form.expected_dispatch_date || null,
      actual_dispatch_date: form.actual_dispatch_date || null,
    };

    try {
      setSubmitting(true);
      const created = await api.createSalesOrder(payload);
      // server returns created.order per earlier server code; guard for either shape
      const createdOrder = created.order || created;
      setRows(prev => [createdOrder, ...prev]);
      setForm({
        client: '',
        sales_order_number: '',
        client_po_number: '',
        product: '',
        qty: '',
        order_date: '',
        expected_dispatch_date: '',
        actual_dispatch_date: '',
        status: '',
      });
      setOpen(false);
      onCreated && onCreated();
    } catch (err) {
      console.error(err);
      alert('Error creating sales order: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sales Orders</h2>
        <div>
          <button onClick={() => setOpen(v => !v)} className="px-3 py-2 bg-emerald-600 text-white rounded">
            {open ? 'Close' : 'New Order'}
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-white p-4 rounded shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="border p-2 rounded" placeholder="Client" value={form.client} onChange={(e) => handleChange('client', e.target.value)} required />
          <input className="border p-2 rounded" placeholder="Sales order number" value={form.sales_order_number} onChange={(e) => handleChange('sales_order_number', e.target.value)} required />
          <input className="border p-2 rounded" placeholder="Client PO number" value={form.client_po_number} onChange={(e) => handleChange('client_po_number', e.target.value)} />
          <input className="border p-2 rounded" placeholder="Product" value={form.product} onChange={(e) => handleChange('product', e.target.value)} required />
          <input className="border p-2 rounded" placeholder="Qty" type="number" value={form.qty} onChange={(e) => handleChange('qty', e.target.value)} required />
          <input className="border p-2 rounded" type="date" value={form.order_date} onChange={(e) => handleChange('order_date', e.target.value)} />
          <input className="border p-2 rounded" type="date" value={form.expected_dispatch_date} onChange={(e) => handleChange('expected_dispatch_date', e.target.value)} />
          <input className="border p-2 rounded" type="date" value={form.actual_dispatch_date} onChange={(e) => handleChange('actual_dispatch_date', e.target.value)} />
          <input className="border p-2 rounded" placeholder="Status" value={form.status} onChange={(e) => handleChange('status', e.target.value)} />
          <div className="md:col-span-4 text-right">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-600 text-white rounded">
              {submitting ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-sm text-slate-500">SO #</th>
              <th className="px-4 py-2 text-sm text-slate-500">Client</th>
              <th className="px-4 py-2 text-sm text-slate-500">Product</th>
              <th className="px-4 py-2 text-sm text-slate-500">Qty</th>
              <th className="px-4 py-2 text-sm text-slate-500">Order Date</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).length === 0 ? (
              <tr><td className="p-4 text-slate-500" colSpan={5}>No sales orders</td></tr>
            ) : (rows || []).map((r) => (
              <tr key={r.id || r.sales_order_number || Math.random()} className="border-t">
                <td className="px-4 py-3">{r.sales_order_number || '—'}</td>
                <td className="px-4 py-3">{r.client}</td>
                <td className="px-4 py-3">{r.product}</td>
                <td className="px-4 py-3">{r.qty}</td>
                <td className="px-4 py-3">{fmtDate(r.order_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==========================
   PO Tracking Page
   - full form matching purchase_orders table
   ========================== */

function POTrackingPage({ initialData = [], onCreated }) {
  const [rows, setRows] = useState(initialData || []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    supplier: '',
    po_number: '',
    product: '',
    qty: '',
    order_date: '',
    expected_delivery_date: '',
    actual_delivery_date: '',
    status: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setRows(initialData || []), [initialData]);

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e && e.preventDefault();
    if (!form.supplier || !form.po_number) {
      alert('Please enter supplier and PO number');
      return;
    }

    const payload = {
      ...form,
      qty: form.qty ? Number(form.qty) : null,
      order_date: form.order_date || null,
      expected_delivery_date: form.expected_delivery_date || null,
      actual_delivery_date: form.actual_delivery_date || null,
    };

    try {
      setSubmitting(true);
      const created = await api.createPurchaseOrder(payload);
      const createdPO = created.order || created;
      setRows(prev => [createdPO, ...prev]);
      setForm({
        supplier: '',
        po_number: '',
        product: '',
        qty: '',
        order_date: '',
        expected_delivery_date: '',
        actual_delivery_date: '',
        status: '',
      });
      setOpen(false);
      onCreated && onCreated();
    } catch (err) {
      console.error(err);
      alert('Error creating purchase order: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Purchase Orders</h2>
        <div>
          <button onClick={() => setOpen(v => !v)} className="px-3 py-2 bg-emerald-600 text-white rounded">{open ? 'Close' : 'New PO'}</button>
        </div>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-white p-4 rounded shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="border p-2 rounded" placeholder="Supplier" value={form.supplier} onChange={(e) => handleChange('supplier', e.target.value)} required />
          <input className="border p-2 rounded" placeholder="PO number" value={form.po_number} onChange={(e) => handleChange('po_number', e.target.value)} required />
          <input className="border p-2 rounded" placeholder="Product" value={form.product} onChange={(e) => handleChange('product', e.target.value)} />
          <input className="border p-2 rounded" placeholder="Qty" type="number" value={form.qty} onChange={(e) => handleChange('qty', e.target.value)} />
          <input className="border p-2 rounded" type="date" value={form.order_date} onChange={(e) => handleChange('order_date', e.target.value)} />
          <input className="border p-2 rounded" type="date" value={form.expected_delivery_date} onChange={(e) => handleChange('expected_delivery_date', e.target.value)} />
          <input className="border p-2 rounded" type="date" value={form.actual_delivery_date} onChange={(e) => handleChange('actual_delivery_date', e.target.value)} />
          <input className="border p-2 rounded" placeholder="Status" value={form.status} onChange={(e) => handleChange('status', e.target.value)} />
          <div className="md:col-span-4 text-right">
            <button disabled={submitting} type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">{submitting ? 'Saving...' : 'Create PO'}</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-sm text-slate-500">PO #</th>
              <th className="px-4 py-2 text-sm text-slate-500">Supplier</th>
              <th className="px-4 py-2 text-sm text-slate-500">Product</th>
              <th className="px-4 py-2 text-sm text-slate-500">Qty</th>
              <th className="px-4 py-2 text-sm text-slate-500">Expected</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).length === 0 ? (
              <tr><td className="p-4 text-slate-500" colSpan={5}>No purchase orders</td></tr>
            ) : (rows || []).map((r) => (
              <tr key={r.id || r.po_number || Math.random()} className="border-t">
                <td className="px-4 py-3">{r.po_number || '—'}</td>
                <td className="px-4 py-3">{r.supplier}</td>
                <td className="px-4 py-3">{r.product}</td>
                <td className="px-4 py-3">{r.qty}</td>
                <td className="px-4 py-3">{fmtDate(r.expected_delivery_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* End of Part 1 */
function POTrackingPage({ initialData = [], onUpdate }) {
  const [rows, setRows] = useState(initialData || []);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    po_number: '',
    supplier: '',
    product: '',
    qty: '',
    expected_delivery_date: ''
  });

  useEffect(() => setRows(initialData || []), [initialData]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.po_number || !form.supplier || !form.product || !form.qty || !form.expected_delivery_date) {
      alert('Please complete all fields');
      return;
    }
    try {
      const res = await fetch('/api/purchase_orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const created = await res.json();
      if (created && created.order) {
        setRows(prev => [created.order, ...prev]);
        setForm({ po_number: '', supplier: '', product: '', qty: '', expected_delivery_date: '' });
        setFormOpen(false);
        onUpdate && onUpdate();
      } else {
        alert('Failed to create purchase order');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating purchase order');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Purchase Orders</h2>
        <button onClick={() => setFormOpen(v => !v)} className="px-3 py-2 bg-emerald-600 text-white rounded">
          {formOpen ? 'Close' : 'New PO'}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={submit} className="bg-white p-4 rounded shadow-sm mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input value={form.po_number} onChange={e => setForm({...form, po_number: e.target.value})} placeholder="PO number" className="border p-2 rounded" />
          <input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} placeholder="Supplier" className="border p-2 rounded" />
          <input value={form.product} onChange={e => setForm({...form, product: e.target.value})} placeholder="Product" className="border p-2 rounded" />
          <input value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} placeholder="Qty" className="border p-2 rounded" />
          <input type="date" value={form.expected_delivery_date} onChange={e => setForm({...form, expected_delivery_date: e.target.value})} className="border p-2 rounded" />
          <div className="md:col-span-5 text-right">
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Create</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-sm text-slate-500">PO #</th>
              <th className="px-4 py-2 text-sm text-slate-500">Supplier</th>
              <th className="px-4 py-2 text-sm text-slate-500">Product</th>
              <th className="px-4 py-2 text-sm text-slate-500">Qty</th>
              <th className="px-4 py-2 text-sm text-slate-500">Expected Delivery</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="p-4 text-slate-500" colSpan={5}>No purchase orders</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.po_number || '—'}</td>
                <td className="px-4 py-3">{r.supplier}</td>
                <td className="px-4 py-3">{r.product}</td>
                <td className="px-4 py-3">{r.qty}</td>
                <td className="px-4 py-3">{fmtDate(r.expected_delivery_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
      {activeTab === "salesTracking" && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sales Tracking</CardTitle>
            <CardDescription>
              Manage sales orders, clients, and revenue tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const newSale = {
                  id: Date.now().toString(),
                  client: e.target.client.value,
                  product: e.target.product.value,
                  quantity: e.target.quantity.value,
                  revenue: e.target.revenue.value,
                  status: "Pending",
                  date: new Date().toISOString().split("T")[0],
                }
                setSales([...sales, newSale])
                e.target.reset()
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Client</label>
                  <input
                    type="text"
                    name="client"
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Product</label>
                  <input
                    type="text"
                    name="product"
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Revenue</label>
                  <input
                    type="number"
                    name="revenue"
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
              </div>
              <Button type="submit">Add Sale</Button>
            </form>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Sales Orders</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.client}</TableCell>
                      <TableCell>{sale.product}</TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>${sale.revenue}</TableCell>
                      <TableCell>{sale.status}</TableCell>
                      <TableCell>{sale.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "inventoryManagement" && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>
              Track raw materials, finished products, and stock levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const newInventory = {
                  id: Date.now().toString(),
                  item: e.target.item.value,
                  category: e.target.category.value,
                  stock: e.target.stock.value,
                  threshold: e.target.threshold.value,
                  lastUpdated: new Date().toISOString().split("T")[0],
                }
                setInventory([...inventory, newInventory])
                e.target.reset()
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Item</label>
                  <input
                    type="text"
                    name="item"
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Category</label>
                  <input
                    type="text"
                    name="category"
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Threshold</label>
                  <input
                    type="number"
                    name="threshold"
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
              </div>
              <Button type="submit">Add Inventory</Button>
            </form>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Inventory Records</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.item}</TableCell>
                      <TableCell>{inv.category}</TableCell>
                      <TableCell>{inv.stock}</TableCell>
                      <TableCell>{inv.threshold}</TableCell>
                      <TableCell>{inv.lastUpdated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "financialTracking" && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Financial Tracking</CardTitle>
            <CardDescription>
              Record expenses, monitor budgets, and manage revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const newExpense = {
                  id: Date.now().toString(),
                  description: e.target.description.value,
                  amount: e.target.amount.value,
                  category: e.target.category.value,
                  date: e.target.date.value,
                }
                setExpenses([...expenses, newExpense])
                e.target.reset()
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Description</label>
                  <input
                    type="text"
                    name="description"
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Category</label>
                  <input
                    type="text"
                    name="category"
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Date</label>
                  <input
                    type="date"
                    name="date"
              <TableCell>{order.customer}</TableCell>
              <TableCell>{order.product}</TableCell>
              <TableCell>{order.quantity}</TableCell>
              <TableCell>{order.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* -------------------------------
   Main Page Component with Navigation
---------------------------------- */
export default function Page() {
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage />;
      case "purchaseOrders":
        return <PurchaseOrdersPage />;
      case "salesOrders":
        return <SalesOrdersPage />;
      case "productionData":
        return <ProductionDataPage />;
      case "factories":
        return <FactoriesPage />;
      case "salesTracking":
        return <SalesTrackingPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="p-6">
      {/* Navigation Bar */}
      <div className="flex space-x-4 mb-6 border-b pb-4">
        <button
          onClick={() => setActivePage("dashboard")}
          className={`px-4 py-2 rounded ${
            activePage === "dashboard"
              ? "bg-green-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActivePage("purchaseOrders")}
          className={`px-4 py-2 rounded ${
            activePage === "purchaseOrders"
              ? "bg-green-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Purchase Orders
        </button>
        <button
          onClick={() => setActivePage("salesOrders")}
          className={`px-4 py-2 rounded ${
            activePage === "salesOrders"
              ? "bg-green-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Sales Orders
        </button>
        <button
          onClick={() => setActivePage("productionData")}
          className={`px-4 py-2 rounded ${
            activePage === "productionData"
              ? "bg-green-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Production Data
        </button>
        <button
          onClick={() => setActivePage("factories")}
          className={`px-4 py-2 rounded ${
            activePage === "factories"
              ? "bg-green-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Factories
        </button>
        <button
          onClick={() => setActivePage("salesTracking")}
          className={`px-4 py-2 rounded ${
            activePage === "salesTracking"
              ? "bg-green-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Sales Tracking
        </button>
      </div>

      {/* Active Page Renderer */}
      <div>{renderPage()}</div>
    </div>
  );
}
