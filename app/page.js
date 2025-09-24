'use client';
import React, { useState, useEffect, useMemo } from 'react';

// ============================================================================
// API LAYER - Handles all communication with your Next.js backend routes
// ============================================================================
const api = {
    fetchAll: async () => {
        const endpoints = [
            { key: 'sales_orders', url: '/api/sales_orders' },
            { key: 'purchase_orders', url: '/api/purchase_orders' },
            { key: 'production_data', url: '/api/production_data' },
            { key: 'factories', url: '/api/factories' },
        ];
        const responses = await Promise.all(endpoints.map(e => fetch(e.url)));
        const data = {};
        for (let i = 0; i < endpoints.length; i++) {
            if (responses[i].ok) {
                data[endpoints[i].key] = await responses[i].json();
            } else {
                console.error(`Failed to fetch ${endpoints[i].key}`);
                data[endpoints[i].key] = []; // Return empty array on failure
            }
        }
        return data;
    },
    post: async (endpoint, payload) => {
        const response = await fetch(`/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to create ${endpoint}`);
        }
        return response.json();
    },
};

// ============================================================================
// HELPER FUNCTIONS & SHARED COMPONENTS
// ============================================================================

const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
};

const Card = ({ children, className = '' }) => <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>{children}</div>;
const Input = (props) => <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />;
const Button = ({ children, ...props }) => <button {...props} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{children}</button>;
const Select = ({ children, ...props }) => <select {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">{children}</select>;
const Table = ({ children }) => <div className="overflow-x-auto"><table className="w-full text-left">{children}</table></div>;
const Th = ({ children }) => <th className="px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-600 uppercase">{children}</th>;
const Td = ({ children, className='' }) => <td className={`px-4 py-3 border-t border-gray-200 ${className}`}>{children}</td>;

// ============================================================================
// PAGE COMPONENTS
// ============================================================================

function DashboardPage({ appData }) {
    const metrics = useMemo(() => {
        const sales = appData.sales_orders || [];
        const purchases = appData.purchase_orders || [];
        const production = appData.production_data || [];
        const factories = appData.factories || [];

        return {
            totalSales: sales.reduce((sum, s) => sum + (Number(s.qty) || 0), 0),
            totalPurchases: purchases.reduce((sum, p) => sum + (Number(p.qty) || 0), 0),
            productionForecast: production.reduce((sum, p) => sum + (Number(p.qty) || 0), 0),
            factoryCount: factories.length,
        };
    }, [appData]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <h3 className="text-gray-500">Total Sales Units</h3>
                    <p className="text-3xl font-bold">{metrics.totalSales.toLocaleString()}</p>
                </Card>
                <Card>
                    <h3 className="text-gray-500">Total Purchase Units</h3>
                    <p className="text-3xl font-bold">{metrics.totalPurchases.toLocaleString()}</p>
                </Card>
                <Card>
                    <h3 className="text-gray-500">Total Production Forecast</h3>
                    <p className="text-3xl font-bold">{metrics.productionForecast.toLocaleString()}</p>
                </Card>
                <Card>
                    <h3 className="text-gray-500">Active Factories</h3>
                    <p className="text-3xl font-bold">{metrics.factoryCount}</p>
                </Card>
            </div>
            {/* You can add charts or more detailed insight cards here later */}
        </div>
    );
}

function SalesOrdersPage({ initialData, onUpdate }) {
    const [orders, setOrders] = useState(initialData);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);
    
    useEffect(() => setOrders(initialData), [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('sales_orders', { ...formData, qty: Number(formData.qty) });
            setShowForm(false);
            setFormData({});
            onUpdate(); // Refresh all data
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
        setSubmitting(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Sales Orders</h1>
                <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Sales Order'}</Button>
            </div>

            {showForm && (
                <Card>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input placeholder="Client" onChange={e => setFormData({...formData, client: e.target.value})} required />
                        <Input placeholder="Sales Order #" onChange={e => setFormData({...formData, sales_order_number: e.target.value})} required />
                        <Input placeholder="Client PO #" onChange={e => setFormData({...formData, client_po_number: e.target.value})} />
                        <Input placeholder="Product" onChange={e => setFormData({...formData, product: e.target.value})} required />
                        <Input type="number" placeholder="Quantity (Kgs)" onChange={e => setFormData({...formData, qty: e.target.value})} required />
                        <Input type="date" title="Order Date" onChange={e => setFormData({...formData, order_date: e.target.value})} />
                        <Input type="date" title="Expected Dispatch" onChange={e => setFormData({...formData, expected_dispatch_date: e.target.value})} />
                        <Input type="date" title="Actual Dispatch" onChange={e => setFormData({...formData, actual_dispatch_date: e.target.value})} />
                        <Input placeholder="Status" onChange={e => setFormData({...formData, status: e.target.value})} />
                        <div className="md:col-span-3 text-right">
                            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Order'}</Button>
                        </div>
                    </form>
                </Card>
            )}

            <Card>
                <Table>
                    <thead><tr><Th>SO #</Th><Th>Client</Th><Th>Product</Th><Th>Qty</Th><Th>Status</Th><Th>Expected Dispatch</Th></tr></thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id}>
                                <Td>{o.sales_order_number}</Td><Td>{o.client}</Td><Td>{o.product}</Td><Td>{o.qty}</Td><Td>{o.status}</Td><Td>{formatDateForInput(o.expected_dispatch_date)}</Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
}

function PurchaseOrdersPage({ initialData, onUpdate }) {
    const [orders, setOrders] = useState(initialData);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => setOrders(initialData), [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('purchase_orders', { ...formData, qty: Number(formData.qty) });
            setShowForm(false);
            setFormData({});
            onUpdate();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
        setSubmitting(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Purchase Orders</h1>
                <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Purchase Order'}</Button>
            </div>

            {showForm && (
                <Card>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input placeholder="Supplier" onChange={e => setFormData({...formData, supplier: e.target.value})} required />
                        <Input placeholder="PO #" onChange={e => setFormData({...formData, po_number: e.target.value})} required />
                        <Input placeholder="Product" onChange={e => setFormData({...formData, product: e.target.value})} required />
                        <Input type="number" placeholder="Quantity (Kgs)" onChange={e => setFormData({...formData, qty: e.target.value})} required />
                        <Input type="date" title="Order Date" onChange={e => setFormData({...formData, order_date: e.target.value})} />
                        <Input type="date" title="Expected Delivery" onChange={e => setFormData({...formData, expected_delivery_date: e.target.value})} />
                        <Input type="date" title="Actual Delivery" onChange={e => setFormData({...formData, actual_delivery_date: e.target.value})} />
                        <Input placeholder="Status" onChange={e => setFormData({...formData, status: e.target.value})} />
                        <div className="md:col-span-3 text-right">
                            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Order'}</Button>
                        </div>
                    </form>
                </Card>
            )}

            <Card>
                <Table>
                    <thead><tr><Th>PO #</Th><Th>Supplier</Th><Th>Product</Th><Th>Qty</Th><Th>Status</Th><Th>Expected Delivery</Th></tr></thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id}>
                                <Td>{o.po_number}</Td><Td>{o.supplier}</Td><Td>{o.product}</Td><Td>{o.qty}</Td><Td>{o.status}</Td><Td>{formatDateForInput(o.expected_delivery_date)}</Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
}

function ProductionDataPage({ initialData, factories, onUpdate }) {
    const [data, setData] = useState(initialData);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => setData(initialData), [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                week: Number(formData.week),
                year: Number(formData.year),
                qty: Number(formData.qty),
                recovery_rate: Number(formData.recovery_rate),
                active_days: Number(formData.active_days),
                actual_qty: formData.actual_qty ? Number(formData.actual_qty) : null,
                actual_recovery_rate: formData.actual_recovery_rate ? Number(formData.actual_recovery_rate) : null,
            };
            await api.post('production_data', payload);
            setShowForm(false);
            setFormData({});
            onUpdate();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
        setSubmitting(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Production Data</h1>
                <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Production Record'}</Button>
            </div>
            
            {showForm && (
                <Card>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select onChange={e => setFormData({...formData, factory_id: e.target.value})} required>
                            <option value="">Select Factory</option>
                            {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </Select>
                        <Input placeholder="Product" onChange={e => setFormData({...formData, product: e.target.value})} required />
                        <Input type="number" placeholder="Week" onChange={e => setFormData({...formData, week: e.target.value})} />
                        <Input type="number" placeholder="Year" onChange={e => setFormData({...formData, year: e.target.value})} />
                        <Input type="date" title="Start Date" onChange={e => setFormData({...formData, start_date: e.target.value})} />
                        <Input type="number" placeholder="Forecast Qty (Kgs)" onChange={e => setFormData({...formData, qty: e.target.value})} required />
                        <Input type="number" step="0.01" placeholder="Forecast Recovery Rate" onChange={e => setFormData({...formData, recovery_rate: e.target.value})} required />
                        <Input type="number" placeholder="Active Days" onChange={e => setFormData({...formData, active_days: e.target.value})} />
                        <Input type="number" placeholder="Actual Qty (Kgs)" onChange={e => setFormData({...formData, actual_qty: e.target.value})} />
                        <Input type="number" step="0.01" placeholder="Actual Recovery Rate" onChange={e => setFormData({...formData, actual_recovery_rate: e.target.value})} />
                        <div className="md:col-span-4 text-right">
                            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Record'}</Button>
                        </div>
                    </form>
                </Card>
            )}

            <Card>
                <Table>
                    <thead><tr><Th>Factory</Th><Th>Product</Th><Th>Week</Th><Th>Forecast Qty</Th><Th>Actual Qty</Th></tr></thead>
                    <tbody>
                        {data.map(d => (
                            <tr key={d.id}>
                                <Td>{factories.find(f => f.id === d.factory_id)?.name || d.factory_id}</Td>
                                <Td>{d.product}</Td><Td>{d.week}</Td><Td>{d.qty}</Td><Td>{d.actual_qty || 'N/A'}</Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
}

function FactoriesPage({ initialData, onUpdate }) {
    const [factories, setFactories] = useState(initialData);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => setFactories(initialData), [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('factories', { ...formData, daily_capacity: Number(formData.daily_capacity) });
            setShowForm(false);
            setFormData({});
            onUpdate();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
        setSubmitting(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Factories</h1>
                <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Factory'}</Button>
            </div>
            
            {showForm && (
                <Card>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input placeholder="Factory Name" onChange={e => setFormData({...formData, name: e.target.value})} required />
                        <Input placeholder="Location" onChange={e => setFormData({...formData, location: e.target.value})} />
                        <Input type="number" placeholder="Daily Capacity (Kgs)" onChange={e => setFormData({...formData, daily_capacity: e.target.value})} required />
                        <Input placeholder="Status (e.g., Active)" onChange={e => setFormData({...formData, status: e.target.value})} />
                        <div className="md:col-span-2 text-right">
                            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Factory'}</Button>
                        </div>
                    </form>
                </Card>
            )}
            
            <Card>
                <Table>
                    <thead><tr><Th>Name</Th><Th>Location</Th><Th>Daily Capacity</Th><Th>Status</Th></tr></thead>
                    <tbody>
                        {factories.map(f => (
                            <tr key={f.id}>
                                <Td>{f.name}</Td><Td>{f.location}</Td><Td>{f.daily_capacity}</Td><Td>{f.status}</Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
}


// ============================================================================
// MAIN APP COMPONENT - Ties everything together
// ============================================================================
export default function App() {
    const [page, setPage] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [appData, setAppData] = useState({});

    const fetchData = async () => {
        setLoading(true);
        const data = await api.fetchAll();
        setAppData(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const NavButton = ({ id, label }) => (
        <button
            onClick={() => setPage(id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${page === id ? "bg-emerald-600 text-white" : "hover:bg-gray-200"}`}
        >
            {label}
        </button>
    );
    
    const renderPage = () => {
        if (loading) return <div>Loading data from BigQuery...</div>;

        switch (page) {
            case 'sales-orders': return <SalesOrdersPage initialData={appData.sales_orders} onUpdate={fetchData} />;
            case 'purchase-orders': return <PurchaseOrdersPage initialData={appData.purchase_orders} onUpdate={fetchData} />;
            case 'production-data': return <ProductionDataPage initialData={appData.production_data} factories={appData.factories} onUpdate={fetchData} />;
            case 'factories': return <FactoriesPage initialData={appData.factories} onUpdate={fetchData} />;
            case 'dashboard':
            default:
                return <DashboardPage appData={appData} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-full text-white font-bold flex items-center justify-center">KF</div>
                        <h1 className="text-xl font-bold text-gray-800">Kutoka Fairoils BI</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <NavButton id="dashboard" label="Dashboard" />
                        <NavButton id="sales-orders" label="Sales Orders" />
                        <NavButton id="purchase-orders" label="Purchase Orders" />
                        <NavButton id="production-data" label="Production" />
                        <NavButton id="factories" label="Factories" />
                    </div>
                </nav>
            </header>
            <main className="container mx-auto p-6">
                {renderPage()}
            </main>
        </div>
    );
}

