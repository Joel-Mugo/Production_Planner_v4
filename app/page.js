'use client';
import React, { useState, useEffect, useMemo } from 'react';

// --- API LAYER ---
const api = {
    fetchAll: async () => {
        const endpoints = [ 'sales_orders', 'purchase_orders', 'production_data', 'factories' ];
        const results = await Promise.all(
            endpoints.map(e => fetch(`/api/${e}`).then(res => res.ok ? res.json() : []).catch(() => []))
        );
        return {
            sales_orders: results[0],
            purchase_orders: results[1],
            production_data: results[2],
            factories: results[3],
        };
    },
    post: async (endpoint, payload) => {
        const response = await fetch(`/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to create ${endpoint}`);
        }
        return response.json();
    },
};

// --- HELPER FUNCTIONS ---
const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-GB') : 'N/A';
const getDayDifference = (dateStr) => {
    if (!dateStr) return 'N/A';
    const diff = new Date(dateStr).getTime() - new Date().setHours(0,0,0,0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// --- REUSABLE UI COMPONENTS (From the version you loved) ---
const Card = ({ children, className = '' }) => <div className={`bg-white/80 backdrop-blur-lg border border-gray-200/50 shadow-lg rounded-xl transition-all duration-300 hover:shadow-2xl ${className}`}>{children}</div>;
const Button = ({ children, ...props }) => <button {...props} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50">{children}</button>;
const Input = (props) => <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />;
const Select = ({ children, ...props }) => <select {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">{children}</select>;
const Th = ({ children }) => <th className="px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-600 uppercase">{children}</th>;
const Td = ({ children }) => <td className="px-4 py-3 border-t border-gray-200">{children}</td>;
const Scorecard = ({ title, value }) => (
    <Card className="p-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
    </Card>
);

// --- FORM COMPONENT FACTORY ---
const GenericForm = ({ fields, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
        setSubmitting(false);
    };

    const handleChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

    return (
        <Card>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {fields.map(field => {
                    const { name, placeholder, type = 'text', required = false, options } = field;
                    if (type === 'select') {
                        return <Select key={name} onChange={e => handleChange(name, e.target.value)} required={required}>
                            <option value="">{placeholder}</option>
                            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </Select>
                    }
                    return <Input key={name} name={name} type={type} placeholder={placeholder} onChange={e => handleChange(name, e.target.value)} required={required} />;
                })}
                <div className="md:col-span-3 flex justify-end gap-2">
                    <Button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</Button>
                    <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
                </div>
            </form>
        </Card>
    );
};


// --- PAGE COMPONENTS (Combining UI + Forms) ---

function DashboardPage({ data }) {
    const metrics = useMemo(() => ({
        activeSOs: data.sales_orders?.length || 0,
        activePOs: data.purchase_orders?.length || 0,
        productionForecast: data.production_data?.reduce((sum, p) => sum + (Number(p.qty) || 0), 0) || 0,
        factoryCount: data.factories?.length || 0,
    }), [data]);
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Scorecard title="Active Sales Orders" value={metrics.activeSOs} />
                <Scorecard title="Active Purchase Orders" value={metrics.activePOs} />
                <Scorecard title="Production Forecast (Kgs)" value={metrics.productionForecast.toLocaleString()} />
                <Scorecard title="Factory Count" value={metrics.factoryCount} />
            </div>
            {/* Add recent orders tables or charts here */}
        </div>
    );
}

function createPage(config) {
    return function PageComponent({ initialData, factories, onUpdate }) {
        const [showForm, setShowForm] = useState(false);

        const handleSubmit = async (formData) => {
            await api.post(config.endpoint, formData);
            setShowForm(false);
            onUpdate();
        };

        const formFields = config.fields.map(field => 
            field.name === 'factory_id' ? { ...field, options: factories.map(f => ({ value: f.id, label: f.name })) } : field
        );

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">{config.title}</h1>
                    <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : `New ${config.singular}`}</Button>
                </div>
                {showForm && <GenericForm fields={formFields} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr>{config.columns.map(c => <Th key={c.key}>{c.label}</Th>)}</tr></thead>
                            <tbody>
                                {(initialData || []).map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        {config.columns.map(col => <Td key={col.key}>{col.render ? col.render(item) : item[col.key]}</Td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        );
    }
}

const SalesOrdersPage = createPage({
    title: 'Sales Orders', singular: 'Sales Order', endpoint: 'sales_orders',
    fields: [
        { name: 'client', placeholder: 'Client Name', required: true },
        { name: 'sales_order_number', placeholder: 'Sales Order #', required: true },
        { name: 'client_po_number', placeholder: 'Client PO #' },
        { name: 'product', placeholder: 'Product', required: true },
        { name: 'qty', placeholder: 'Quantity (Kgs)', type: 'number', required: true },
        { name: 'status', placeholder: 'Status (e.g., Planned)' },
        { name: 'order_date', type: 'date' },
        { name: 'expected_dispatch_date', type: 'date' },
    ],
    columns: [
        { key: 'sales_order_number', label: 'SO #' }, { key: 'client', label: 'Client' }, { key: 'product', label: 'Product' },
        { key: 'qty', label: 'Qty' }, { key: 'status', label: 'Status' }, 
        { key: 'expected_dispatch_date', label: 'Expected Dispatch', render: item => formatDate(item.expected_dispatch_date) }
    ]
});

const PurchaseOrdersPage = createPage({
    title: 'Purchase Orders', singular: 'Purchase Order', endpoint: 'purchase_orders',
    fields: [
        { name: 'supplier', placeholder: 'Supplier Name', required: true },
        { name: 'po_number', placeholder: 'PO #', required: true },
        { name: 'product', placeholder: 'Product', required: true },
        { name: 'qty', placeholder: 'Quantity (Kgs)', type: 'number', required: true },
        { name: 'status', placeholder: 'Status (e.g., Pending)' },
        { name: 'order_date', type: 'date' },
        { name: 'expected_delivery_date', type: 'date' },
    ],
    columns: [
        { key: 'po_number', label: 'PO #' }, { key: 'supplier', label: 'Supplier' }, { key: 'product', label: 'Product' },
        { key: 'qty', label: 'Qty' }, { key: 'status', label: 'Status' },
        { key: 'expected_delivery_date', label: 'Expected Delivery', render: item => formatDate(item.expected_delivery_date) }
    ]
});

const ProductionDataPage = createPage({
    title: 'Production Data', singular: 'Record', endpoint: 'production_data',
    fields: [
        { name: 'factory_id', placeholder: 'Select Factory', type: 'select', required: true, options: [] },
        { name: 'product', placeholder: 'Product Name', required: true },
        { name: 'qty', placeholder: 'Forecast Qty (Kgs)', type: 'number', required: true },
        { name: 'recovery_rate', placeholder: 'Recovery Rate (e.g., 0.15)', type: 'number', step: '0.01' },
        { name: 'week', placeholder: 'Week', type: 'number' }, { name: 'year', placeholder: 'Year', type: 'number' },
        { name: 'start_date', type: 'date' },
        { name: 'active_days', placeholder: 'Active Days', type: 'number' },
    ],
    columns: [
        { key: 'factory_id', label: 'Factory', render: (item, factories) => factories.find(f => f.id === item.factory_id)?.name || item.factory_id },
        { key: 'product', label: 'Product' }, { key: 'week', label: 'Week' },
        { key: 'qty', label: 'Forecast Qty' }, { key: 'actual_qty', label: 'Actual Qty', render: item => item.actual_qty || 'N/A' },
        { key: 'recovery_rate', label: 'Recovery Rate' }
    ]
});

const FactoriesPage = createPage({
    title: 'Factories', singular: 'Factory', endpoint: 'factories',
    fields: [
        { name: 'name', placeholder: 'Factory Name', required: true },
        { name: 'location', placeholder: 'Location', required: true },
        { name: 'daily_capacity', placeholder: 'Daily Capacity (Kgs)', type: 'number', required: true },
        { name: 'status', placeholder: 'Status (e.g., Active)', required: true },
    ],
    columns: [
        { key: 'name', label: 'Name' }, { key: 'location', label: 'Location' },
        { key: 'daily_capacity', label: 'Daily Capacity' }, { key: 'status', label: 'Status' }
    ]
});

// --- MAIN APP COMPONENT ---
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

    useEffect(() => { fetchData(); }, []);
    
    const NavButton = ({ id, label }) => (
        <button onClick={() => setPage(id)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${page === id ? "bg-emerald-600 text-white" : "hover:bg-gray-200"}`}>{label}</button>
    );

    const renderPage = () => {
        if (loading) return <div className="text-center p-10">Loading data from BigQuery...</div>;

        const pageProps = { onUpdate: fetchData, initialData: appData[page.replace('-', '_')], factories: appData.factories };

        switch (page) {
            case 'sales-orders': return <SalesOrdersPage {...pageProps} />;
            case 'purchase-orders': return <PurchaseOrdersPage {...pageProps} />;
            case 'production-data': return <ProductionDataPage {...pageProps} />;
            case 'factories': return <FactoriesPage {...pageProps} />;
            default: return <DashboardPage data={appData} />;
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
                        <NavButton id="sales-orders" label="Sales" />
                        <NavButton id="purchase-orders" label="Purchases" />
                        <NavButton id="production-data" label="Production" />
                        <NavButton id="factories" label="Factories" />
                    </div>
                </nav>
            </header>
            <main className="container mx-auto p-6">{renderPage()}</main>
        </div>
    );
}

