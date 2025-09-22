'use client';
import React, { useState, useEffect, useMemo } from 'react';

// --- API INTERACTION LAYER --- //
// This replaces the mock BigQuery object. It communicates with our Next.js backend API.
const api = {
    fetchAllData: async () => {
        // In a real app, you'd create an endpoint that gathers all data efficiently.
        // For now, we'll fetch them individually to demonstrate.
        const [sales_orders, purchase_orders, production_data, factories] = await Promise.all([
            fetch('/api/sales_orders').then(res => res.json()),
            // Create these API routes similarly
            // fetch('/api/purchase_orders').then(res => res.json()), 
            // fetch('/api/production_data').then(res => res.json()),
            // fetch('/api/factories').then(res => res.json()),
        ]);
        
        // Using mock data for parts not yet connected to the backend
        const mockRes = await fetch('/api/mock_data');
        const mock = await mockRes.json();

        return { sales_orders, purchase_orders: mock.purchase_orders, production_data: mock.production_data, factories: mock.factories };
    },
    addSalesOrder: async (newOrder) => {
        const response = await fetch('/api/sales_orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newOrder),
        });
        if (!response.ok) throw new Error('Failed to add sales order');
        return response.json();
    },
    // Define addPurchaseOrder, updateSalesOrder etc. similarly
};

// --- MOCK DATA FOR UNCREATED API ROUTES --- //
// This is temporary until all API routes are built.
const MOCK_DATA = {
    factories: [
        { id: 'F001', name: 'Nairobi Greens', daily_capacity: 5000, location: 'Nairobi, Kenya', status: 'Active' },
        { id: 'F002', name: 'Mombasa Oils', daily_capacity: 7500, location: 'Mombasa, Kenya', status: 'Active' },
        { id: 'F003', name: 'Kisumu Harvest', daily_capacity: 6000, location: 'Kisumu, Kenya', status: 'Under Maintenance' },
        { id: 'F004', name: 'Eldoret Fields', daily_capacity: 4500, location: 'Eldoret, Kenya', status: 'Idle' },
    ],
    production_data: [
        { id: 'PD00', factory_id: 'F001', product: 'Avocado Oil', week: 36, year: 2024, qty: 14500, recovery_rate: 0.15, active_days: 5, start_date: '2024-09-02', actual_qty: 14800, actual_recovery_rate: 0.155 },
        { id: 'PD001', factory_id: 'F002', product: 'Macadamia Oil', week: 36, year: 2024, qty: 21000, recovery_rate: 0.28, active_days: 6, start_date: '2024-09-02', actual_qty: 20500, actual_recovery_rate: 0.29 },
        { id: 'PD01', factory_id: 'F001', product: 'Avocado Oil', week: 37, year: 2024, qty: 15000, recovery_rate: 0.15, active_days: 5, start_date: '2024-09-09', actual_qty: null, actual_recovery_rate: null },
        { id: 'PD02', factory_id: 'F002', product: 'Macadamia Oil', week: 37, year: 2024, qty: 22000, recovery_rate: 0.28, active_days: 6, start_date: '2024-09-10', actual_qty: null, actual_recovery_rate: null },
    ],
    purchase_orders: [
        { id: 'PO001', supplier: 'Green Farms Ltd.', po_number: 'PO-77543', product: 'Raw Macadamia', qty: 50000, order_date: '2024-08-01', expected_delivery_date: '2024-09-15', actual_delivery_date: null, status: 'In Transit' },
        { id: 'PO002', supplier: 'AgriSource Inc.', po_number: 'PO-77544', product: 'Raw Avocados', qty: 80000, order_date: '2024-08-10', expected_delivery_date: '2024-09-05', actual_delivery_date: '2024-09-06', status: 'Delivered' },
    ],
};

const BigQuery = {
    updatePurchaseOrder: async (updatedOrder) => { /* ... mock logic ... */ },
    updateSalesOrder: async (updatedOrder) => { /* ... mock logic ... */ },
    addPurchaseOrder: async (newOrder) => { /* ... mock logic ... */ },
    addProductionData: async (newData) => { /* ... mock logic ... */ },
    updateProductionData: async (updatedData) => { /* ... mock logic ... */ },
};


// --- GEMINI API SIMULATION --- //
const GeminiAPI = {
    generateContent: async (prompt) => {
        console.log("GEMINI API CALL with prompt:", prompt);
        await new Promise(res => setTimeout(res, 1000)); // Simulate network delay

        if (prompt.includes("Generate a business summary")) {
            return `**Weekly Business Intelligence Summary:**

* **Overall Performance:** The outlook is strong. We are tracking a total projected quantity of 87,000 units, leading to an estimated 25,940 Kgs of oil. Overall factory efficiency is robust at 88.5%, indicating high utilization of our production capacity.

* **Key Highlight:** Mombasa Oils is the top performer with a utilization rate consistently above 95% for Macadamia Oil production.

* **Potential Risk Area:** Sales Order SO-10238 for Euro Oils is currently overdue. We must prioritize this to maintain client relations. Additionally, Purchase Order PO-77543 from Green Farms Ltd. is due in 3 days, which is critical for upcoming production runs.

* **Recommendation:** Expedite production for SO-10238 immediately. Prioritize follow-up on PO-77543 to ensure timely delivery of raw macadamia.`;
        }

        if (prompt.includes("Draft a professional and friendly email")) {
             const client = prompt.match(/client: (.*?)\n/)?.[1];
             const product = prompt.match(/product: (.*?)\n/)?.[1];
             const so = prompt.match(/sales order number: (.*?)\n/)?.[1];
             
             return `**Subject: Update on your Sales Order ${so} for ${product}**

Dear ${client} Team,

I hope this email finds you well.

I'm writing to provide you with a quick update on your recent order, **${so}**, for **${product}**.

I'm pleased to inform you that the order is currently in production and everything is proceeding on schedule. Our team is working diligently to ensure the highest quality standards are met.

We are on track for the expected dispatch date of [Order Dispatch Date]. We will notify you again as soon as the order has been dispatched.

Thank you for your business. We appreciate the opportunity to serve you.

Best regards,

The Fairoils Team`;
        }
        
        return "I am an AI assistant. How can I help you with your business intelligence data?";
    }
};

// --- THEME & STYLING --- //
const THEME = {
    colors: {
        primary: '#059669', // Green-600
        secondary: '#4f46e5', // Indigo-600
        accent: {
            yellowGreen: '#CAD951',
            olive: '#A6A247',
            earthyGreen: '#87A55A',
            purple: '#8b5cf6', // Violet-500
        },
        background: '#f8fafc', // Slate-50
        card: 'rgba(255, 255, 255, 0.8)',
    },
};


// --- HELPER FUNCTIONS --- //

const getDayDifference = (dateStr1, dateStr2 = new Date().toISOString()) => {
    if (!dateStr1) return null;
    const today = new Date(dateStr2);
    today.setHours(0,0,0,0);
    const targetDate = new Date(dateStr1);
    targetDate.setHours(0,0,0,0);
    const diff = targetDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getWeek = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};

// --- SVG ICONS (Lucide-react replacements) --- //

const SparkleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3L9.5 8.5L4 11L9.5 13.5L12 19L14.5 13.5L20 11L14.5 8.5L12 3Z" />
      <path d="M5 3L6 5" />
      <path d="M18 19L19 21" />
      <path d="M3 18L5 19" />
      <path d="M21 5L19 6" />
    </svg>
);

const DashboardIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
);

const ShoppingCartIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16" />
    </svg>
);

const PackageIcon = ({ className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2" /><path d="m21 10-7 4-7-4" /><path d="M3 14v2a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2" /><line x1="12" y1="22" x2="12" y2="14" />
    </svg>
);

const EditIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    </svg>
);

const PlusCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
);


// --- REUSABLE UI COMPONENTS --- //

const Card = ({ children, className = '' }) => (
    <div className={`bg-white/80 backdrop-blur-lg border border-gray-200/50 shadow-lg rounded-xl transition-all duration-300 hover:shadow-2xl hover:border-gray-300/50 ${className}`}>
        {children}
    </div>
);

const Scorecard = ({ title, value, icon, className = '' }) => (
    <Card className={`p-4 ${className}`}>
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100/70 rounded-lg">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    </Card>
);

const Button = ({ children, onClick, className = '', variant = 'primary', disabled = false }) => {
    const baseStyle = 'px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center space-x-2';
    const variants = {
        primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    };
    return (
        <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={disabled}>
            {children}
        </button>
    );
};

const Input = ({ className = '', ...props }) => (
    <input
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow ${className}`}
        {...props}
    />
);

const Select = ({ children, className = '', ...props }) => (
    <select
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow bg-white ${className}`}
        {...props}
    >
        {children}
    </select>
);

const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl transform transition-all m-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-xl font-bold text-gray-700 flex items-center space-x-2">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
};

// --- DATA VISUALIZATION COMPONENTS --- //

const FactoryEfficiencyChart = ({ productionData, factories }) => {
    const chartColors = [THEME.colors.accent.yellowGreen, THEME.colors.accent.olive, THEME.colors.accent.earthyGreen, THEME.colors.accent.purple];

    const dataByFactory = useMemo(() => {
        if(!productionData || !factories) return {};
        const factoryData = {};
        factories.forEach(f => {
            factoryData[f.id] = [];
        });

        productionData.forEach(p => {
            const factory = factories.find(f => f.id === p.factory_id);
            if(factory) {
                const utilization = (p.qty / (factory.daily_capacity * p.active_days)) * 100;
                factoryData[p.factory_id].push({ week: p.week, utilization: parseFloat(utilization.toFixed(1)) });
            }
        });

        Object.keys(factoryData).forEach(fid => {
            factoryData[fid].sort((a,b) => a.week - b.week);
        });
        
        return factoryData;
    }, [productionData, factories]);

    if (!productionData || productionData.length === 0) return <div className="text-center p-10 text-gray-500">No production data available for chart.</div>;

    const weeks = [...new Set(productionData.map(p => p.week))].sort((a,b) => a - b);
    const maxUtilization = 120; // Allow for over-utilization viewing

    return (
      <div className="p-4">
        <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mb-4">
            {factories.map((f, idx) => (
                <div key={f.id} className="flex items-center space-x-2 text-sm">
                    <div className="w-4 h-4 rounded-full" style={{backgroundColor: chartColors[idx % chartColors.length]}}></div>
                    <span>{f.name}</span>
                </div>
            ))}
        </div>
        <svg viewBox="0 0 500 300" className="w-full h-auto">
            {/* Y-Axis labels and grid lines */}
            {[0, 25, 50, 75, 100].map(y => {
                const yPos = 250 - (y / maxUtilization) * 220;
                return (
                    <g key={y}>
                        <text x="35" y={yPos + 3} textAnchor="end" className="text-xs fill-gray-500">{y}%</text>
                        <line x1="40" y1={yPos} x2="480" y2={yPos} className="stroke-gray-200" strokeWidth="1" />
                    </g>
                );
            })}

            {/* X-Axis labels */}
            {weeks.map((week, idx) => {
                const xPos = 40 + (idx / (weeks.length - 1)) * 440;
                return <text key={week} x={xPos} y="270" textAnchor="middle" className="text-xs fill-gray-500">Wk {week}</text>
            })}

            {/* Data Lines */}
            {factories.map((factory, fIdx) => {
                if (!dataByFactory[factory.id]) return null;
                const points = dataByFactory[factory.id].map(d => {
                    const weekIdx = weeks.indexOf(d.week);
                    if (weekIdx === -1) return null;
                    const x = 40 + (weekIdx / (weeks.length - 1)) * 440;
                    const y = 250 - (d.utilization / maxUtilization) * 220;
                    return `${x},${y}`;
                }).filter(Boolean).join(' ');

                return (
                    <polyline key={factory.id}
                        points={points}
                        fill="none"
                        stroke={chartColors[fIdx % chartColors.length]}
                        strokeWidth="2.5"
                        className="transition-all duration-500"
                    />
                );
            })}
        </svg>
      </div>
    );
};

const ProductionTimeline = ({ productionData, factories }) => {
    if (!productionData || !factories) return null;

    const currentWeek = getWeek(new Date());
    const weeksToShow = 6;
    const weekAxis = Array.from({length: weeksToShow}, (_, i) => currentWeek - 2 + i);

    return (
        <div className="p-4 space-y-3">
            {factories.map((factory, fIdx) => (
                <div key={factory.id}>
                    <p className="text-sm font-semibold text-gray-700 mb-1">{factory.name}</p>
                    <div className="relative h-8 bg-gray-200/70 rounded-lg">
                         {weekAxis.map((week, wIdx) => (
                            <div key={week}
                                 className={`absolute top-0 bottom-0 ${wIdx < weeksToShow - 1 ? 'border-r border-gray-300/50' : ''}`}
                                 style={{ left: `${(wIdx / weeksToShow) * 100}%`, width: `${100 / weeksToShow}%` }}>
                                <span className="absolute -top-5 text-xs text-gray-500">{`Wk ${week}`}</span>
                            </div>
                        ))}
                        {productionData
                            .filter(p => p.factory_id === factory.id && weekAxis.includes(p.week))
                            .map(p => {
                                const startWeekIndex = weekAxis.indexOf(p.week);
                                if (startWeekIndex === -1) return null;
                                const durationWeeks = Math.ceil(p.active_days / 5); // Assuming a 5-day work week
                                return (
                                    <div key={p.id}
                                         className="absolute top-1 bottom-1 bg-green-500/80 rounded flex items-center justify-center text-white text-xs font-bold overflow-hidden"
                                         style={{
                                             left: `${(startWeekIndex / weeksToShow) * 100 + 1}%`,
                                             width: `${(durationWeeks / weeksToShow) * 100 - 2}%`
                                         }}
                                         title={`${p.product} - ${p.qty.toLocaleString()} Kgs`}>
                                        {p.product}
                                    </div>
                                );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- PAGE COMPONENTS --- //

const DashboardPage = ({ data, onUpdate }) => {
    const [view, setView] = useState('grid'); // 'grid' or 'timeline'
    const [insights, setInsights] = useState('');
    const [isInsightsLoading, setIsInsightsLoading] = useState(false);
    const [showProductionForm, setShowProductionForm] = useState(false);
    const [editingProduction, setEditingProduction] = useState(null);

    const { factories, production_data, purchase_orders, sales_orders } = data;

    const productionPlan = useMemo(() => {
        if (!production_data || !factories) return [];
        return production_data.map(plan => {
            const factory = factories.find(f => f.id === plan.factory_id);
            const projected_oil = plan.qty * plan.recovery_rate;
            const utilization = factory ? (plan.qty / (factory.daily_capacity * plan.active_days)) * 100 : 0;
            return { ...plan, factory, projected_oil, utilization: utilization.toFixed(1) + '%' };
        }).sort((a,b) => a.week - b.week);
    }, [production_data, factories]);

    const dashboardMetrics = useMemo(() => {
        if (!production_data || !sales_orders || !purchase_orders) return { totalProjectedQty: 0, totalProjectedOil: '0 Kgs', activeSOs: 0, activePOs: 0 };
        const totalProjectedQty = production_data.filter(p => !p.actual_qty).reduce((sum, item) => sum + item.qty, 0);
        const totalProjectedOil = productionPlan.filter(p => !p.actual_qty).reduce((sum, item) => sum + item.projected_oil, 0);
        const activeSOs = sales_orders.filter(so => so.status !== 'Dispatched' && so.status !== 'Cancelled').length;
        const activePOs = purchase_orders.filter(po => po.status !== 'Delivered').length;
        return {
            totalProjectedQty: totalProjectedQty.toLocaleString(),
            totalProjectedOil: totalProjectedOil.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' Kgs',
            activeSOs,
            activePOs
        }
    }, [production_data, productionPlan, sales_orders, purchase_orders]);
    
    const varianceMetrics = useMemo(() => {
        if (!production_data) return { qtyVariance: 'N/A', recoveryVariance: 'N/A' };
        const completedProduction = production_data.filter(p => p.actual_qty && p.actual_recovery_rate);
        if (completedProduction.length === 0) return { qtyVariance: 'N/A', recoveryVariance: 'N/A' };
        
        const totalPlannedQty = completedProduction.reduce((sum, p) => sum + p.qty, 0);
        const totalActualQty = completedProduction.reduce((sum, p) => sum + p.actual_qty, 0);
        const qtyVariance = ((totalActualQty - totalPlannedQty) / totalPlannedQty) * 100;

        const avgPlannedRecovery = completedProduction.reduce((sum, p) => sum + p.recovery_rate, 0) / completedProduction.length;
        const avgActualRecovery = completedProduction.reduce((sum, p) => sum + p.actual_recovery_rate, 0) / completedProduction.length;
        const recoveryVariance = ((avgActualRecovery - avgPlannedRecovery) / avgPlannedRecovery) * 100;

        return {
            qtyVariance: `${qtyVariance.toFixed(1)}%`,
            recoveryVariance: `${recoveryVariance.toFixed(1)}%`,
        };
    }, [production_data]);
    
    const generateInsights = async () => {
        setIsInsightsLoading(true);
        setInsights('');
        const prompt = `Generate a business summary...`; //
        const result = await GeminiAPI.generateContent(prompt);
        setInsights(result);
        setIsInsightsLoading(false);
    };

    const FactoryStatusBadge = ({ status }) => {
      const statusStyles = {
        'Active': 'bg-green-100 text-green-800', 'Under Maintenance': 'bg-yellow-100 text-yellow-800',
        'Idle': 'bg-gray-200 text-gray-800', 'Closed': 'bg-red-100 text-red-800',
      };
      return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusStyles[status] || ''}`}>{status}</span>
    }
    
    return (
        <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                 <Button onClick={generateInsights} disabled={isInsightsLoading}>
                    {isInsightsLoading ? 'Generating...' : <> <SparkleIcon className="w-5 h-5 mr-2" /> Get AI Insights </>}
                </Button>
            </div>
            
            {insights && (
                <Card className="p-6 bg-blue-50/50 border-blue-200 animate-fade-in">
                    <h3 className="text-xl font-bold text-blue-800 mb-2 flex items-center">
                        <SparkleIcon className="w-5 h-5 mr-2" /> AI-Powered Summary
                    </h3>
                     <div className="text-sm space-y-2 text-gray-700" dangerouslySetInnerHTML={{ __html: insights.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />').replace(/\* /g, '&bull; ') }} />
                </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <Scorecard title="Projected Qty" value={dashboardMetrics.totalProjectedQty} icon={<PackageIcon className="w-6 h-6 text-green-600" />} />
                <Scorecard title="Projected Oil" value={dashboardMetrics.totalProjectedOil} icon={<div className="w-6 h-6 text-green-600 font-bold flex items-center justify-center">Kg</div>} />
                <Scorecard title="Active Sales Orders" value={dashboardMetrics.activeSOs} icon={<ShoppingCartIcon className="w-6 h-6 text-green-600" />} />
                <Scorecard title="Active Purchase Orders" value={dashboardMetrics.activePOs} icon={<PackageIcon className="w-6 h-6 text-green-600" />} />
                <Card className="p-4">
                    <p className="text-sm font-medium text-gray-500">Forecast vs Actual</p>
                    <div className="mt-2 text-sm">
                        <p>Qty Variance: <span className={`font-bold ${parseFloat(varianceMetrics.qtyVariance) > 0 ? 'text-green-600' : 'text-red-600'}`}>{varianceMetrics.qtyVariance}</span></p>
                        <p>Yield Variance: <span className={`font-bold ${parseFloat(varianceMetrics.recoveryVariance) > 0 ? 'text-green-600' : 'text-red-600'}`}>{varianceMetrics.recoveryVariance}</span></p>
                    </div>
                </Card>
            </div>

            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Production Planning</h2>
                    <div className="flex items-center space-x-4">
                        <Button onClick={() => setShowProductionForm(true)} variant="secondary"><PlusCircleIcon className="w-5 h-5 mr-2"/> Add Forecast</Button>
                        <div className="flex space-x-2 p-1 bg-gray-200/80 rounded-lg">
                            <button onClick={() => setView('grid')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'grid' ? 'bg-white shadow' : 'text-gray-600'}`}>Grid</button>
                            <button onClick={() => setView('timeline')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'timeline' ? 'bg-white shadow' : 'text-gray-600'}`}>Timeline</button>
                        </div>
                    </div>
                </div>
                
                {view === 'grid' && <ProductionGrid productionPlan={productionPlan} onEdit={(p) => {setEditingProduction(p); setShowProductionForm(true);}} />}
                {view === 'timeline' && <ProductionTimeline productionData={production_data} factories={factories} />}
            </Card>
            
            <ProductionFormModal
                show={showProductionForm}
                onClose={() => {setShowProductionForm(false); setEditingProduction(null);}}
                factories={factories}
                onSave={onUpdate}
                editingData={editingProduction}
            />

            <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Factory Efficiency Trends</h2>
                <FactoryEfficiencyChart productionData={production_data} factories={factories} />
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6"><h3 className="text-xl font-bold text-gray-800 mb-4">Sales Order Tracking</h3><div className="overflow-x-auto max-h-96"><DashboardOrderTable orders={sales_orders} type="sales" /></div></Card>
                <Card className="p-6"><h3 className="text-xl font-bold text-gray-800 mb-4">Purchase Order Tracking</h3><div className="overflow-x-auto max-h-96"><DashboardOrderTable orders={purchase_orders} type="purchase" /></div></Card>
            </div>
        </div>
    );
};

const ProductionGrid = ({ productionPlan, onEdit }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100/50">
                <tr>
                    <th className="px-6 py-3">Factory</th>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Week</th>
                    <th className="px-6 py-3">Projected Qty (Kgs)</th>
                    <th className="px-6 py-3">Actual Qty (Kgs)</th>
                    <th className="px-6 py-3">Utilization</th>
                    <th className="px-6 py-3">Start Date</th>
                    <th className="px-6 py-3"></th>
                </tr>
            </thead>
            <tbody>
                {productionPlan.map(p => (
                    <tr key={p.id} className="bg-white border-b hover:bg-green-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <div>{p.factory?.name}</div>
                          <div className="mt-1"><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${{'Active':'bg-green-100 text-green-800', 'Under Maintenance':'bg-yellow-100 text-yellow-800', 'Idle':'bg-gray-200 text-gray-800', 'Closed':'bg-red-100 text-red-800'}[p.factory?.status]}`}>{p.factory?.status}</span></div>
                        </td>
                        <td className="px-6 py-4">{p.product}</td>
                        <td className="px-6 py-4">{p.week}</td>
                        <td className="px-6 py-4">{p.qty.toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold text-blue-600">{p.actual_qty ? p.actual_qty.toLocaleString() : 'N/A'}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${parseFloat(p.utilization) > 85 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.utilization}</span></td>
                        <td className="px-6 py-4">{formatDate(p.start_date)}</td>
                        <td className="px-6 py-4"><button onClick={() => onEdit(p)} className="text-gray-400 hover:text-green-600"><EditIcon className="w-4 h-4" /></button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const ProductionFormModal = ({ show, onClose, factories, onSave, editingData }) => {
    const [formData, setFormData] = useState({ factory_id: '', product: '', qty: '', recovery_rate: '', active_days: '', start_date: '', actual_qty: '', actual_recovery_rate: ''});
    
    useEffect(() => {
        if (editingData) {
            setFormData({
                id: editingData.id || '',
                factory_id: editingData.factory_id || '',
                product: editingData.product || '',
                qty: editingData.qty || '',
                recovery_rate: (editingData.recovery_rate || 0) * 100,
                active_days: editingData.active_days || '',
                start_date: editingData.start_date || '',
                week: editingData.week || '',
                year: editingData.year || '',
                actual_qty: editingData.actual_qty || '',
                actual_recovery_rate: editingData.actual_recovery_rate ? editingData.actual_recovery_rate * 100 : ''
            });
        } else {
            setFormData({ factory_id: '', product: '', qty: '', recovery_rate: '', active_days: '', start_date: '', actual_qty: '', actual_recovery_rate: ''});
        }
    }, [editingData, show]);
    
    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            qty: parseFloat(formData.qty),
            recovery_rate: parseFloat(formData.recovery_rate) / 100,
            active_days: parseInt(formData.active_days),
            week: getWeek(new Date(formData.start_date)),
            year: new Date(formData.start_date).getFullYear(),
            actual_qty: formData.actual_qty ? parseFloat(formData.actual_qty) : null,
            actual_recovery_rate: formData.actual_recovery_rate ? parseFloat(formData.actual_recovery_rate) / 100 : null,
        };

        if (editingData) {
            await BigQuery.updateProductionData(dataToSave);
        } else {
            await BigQuery.addProductionData(dataToSave);
        }
        onSave();
        onClose();
    };
    
    return (
        <Modal show={show} onClose={onClose} title={editingData ? "Edit Production Data" : "Add Production Forecast"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg">
                    <legend className="text-lg font-semibold px-2">Forecast</legend>
                    <Select name="factory_id" value={formData.factory_id} onChange={handleChange} required><option value="">Select Factory</option>{factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</Select>
                    <Input name="product" placeholder="Product Name" value={formData.product} onChange={handleChange} required />
                    <Input name="qty" type="number" placeholder="Projected Qty (Kgs)" value={formData.qty} onChange={handleChange} required />
                    <Input name="recovery_rate" type="number" placeholder="Recovery Rate (%)" value={formData.recovery_rate} onChange={handleChange} required />
                    <Input name="active_days" type="number" placeholder="Active Days" value={formData.active_days} onChange={handleChange} required />
                    <Input name="start_date" type="date" value={formData.start_date} onChange={handleChange} required />
                </fieldset>
                 <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg">
                    <legend className="text-lg font-semibold px-2">Actuals (Optional)</legend>
                    <Input name="actual_qty" type="number" placeholder="Actual Qty (Kgs)" value={formData.actual_qty} onChange={handleChange} />
                    <Input name="actual_recovery_rate" type="number" placeholder="Actual Recovery Rate (%)" value={formData.actual_recovery_rate} onChange={handleChange} />
                </fieldset>
                <div className="flex justify-end space-x-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save Data</Button></div>
            </form>
        </Modal>
    );
};

const OrderFormModal = ({ show, onClose, onSave, type }) => {
    const isSales = type === 'sales';
    const initialState = isSales ?
        { client: '', sales_order_number: '', client_po_number: '', product: '', qty: '', order_date: '', expected_dispatch_date: ''} :
        { supplier: '', po_number: '', product: '', qty: '', order_date: '', expected_delivery_date: ''};
    
    const [formData, setFormData] = useState(initialState);
    
    const handleChange = e => setFormData({...formData, [e.target.name]: e.target.value });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSave = { ...formData, qty: parseFloat(formData.qty) };
        if(isSales) {
            await api.addSalesOrder(dataToSave);
        } else {
            // await api.addPurchaseOrder(dataToSave);
        }
        onSave();
        onClose();
    };
    
    useEffect(() => {
      if(show) setFormData(initialState);
    }, [show]);

    return (
         <Modal show={show} onClose={onClose} title={`Add New ${isSales ? 'Sales' : 'Purchase'} Order`}>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name={isSales ? "client" : "supplier"} placeholder={isSales ? "Client Name" : "Supplier Name"} value={formData[isSales ? "client" : "supplier"]} onChange={handleChange} required />
                <Input name={isSales ? "sales_order_number" : "po_number"} placeholder={isSales ? "Sales Order No." : "PO No."} value={formData[isSales ? "sales_order_number" : "po_number"]} onChange={handleChange} required />
                {isSales && <Input name="client_po_number" placeholder="Client PO No." value={formData.client_po_number} onChange={handleChange} />}
                <Input name="product" placeholder="Product Name" value={formData.product} onChange={handleChange} required />
                <Input name="qty" type="number" placeholder="Quantity (Kgs)" value={formData.qty} onChange={handleChange} required />
                <Input name="order_date" type="date" value={formData.order_date} onChange={handleChange} required />
                <Input name={isSales ? "expected_dispatch_date" : "expected_delivery_date"} type="date" value={formData[isSales ? "expected_dispatch_date" : "expected_delivery_date"]} onChange={handleChange} required />
                <div className="md:col-span-2 flex justify-end space-x-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save Order</Button></div>
            </form>
        </Modal>
    );
};


const POTrackingPage = ({ initialData, onUpdate }) => {
    const [showForm, setShowForm] = useState(false);
    
    const { activeOrders, completedOrders } = useMemo(() => {
        const active = [];
        const completed = [];
        initialData.forEach(order => {
            if(order.status === 'Delivered') completed.push(order);
            else active.push(order);
        });
        return { activeOrders: active, completedOrders: completed };
    }, [initialData]);

    return (
        <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Purchase Order Tracking</h1>
                <Button onClick={() => setShowForm(true)}><PlusCircleIcon className="w-5 h-5 mr-2" /> New PO</Button>
             </div>
             <OrderFormModal show={showForm} onClose={() => setShowForm(false)} onSave={onUpdate} type="purchase" />
             <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Active Purchase Orders</h3>
                <div className="overflow-x-auto">
                    <OrderTable orders={activeOrders} type="purchase" onUpdate={onUpdate}/>
                </div>
            </Card>
             <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Completed Purchase Orders</h3>
                <div className="overflow-x-auto">
                    <OrderTable orders={completedOrders} type="purchase" onUpdate={onUpdate} isCompletedTable={true} />
                </div>
            </Card>
        </div>
    );
};

const SalesTrackingPage = ({ initialData, onUpdate }) => {
    const [showForm, setShowForm] = useState(false);
    
    const { activeOrders, completedOrders } = useMemo(() => {
        const active = [];
        const completed = [];
        initialData.forEach(order => {
            if(order.status === 'Dispatched') completed.push(order);
            else active.push(order);
        });
        return { activeOrders: active, completedOrders: completed };
    }, [initialData]);

    return (
        <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Sales Order Tracking</h1>
                <Button onClick={() => setShowForm(true)}><PlusCircleIcon className="w-5 h-5 mr-2" /> New SO</Button>
            </div>
             <OrderFormModal show={showForm} onClose={() => setShowForm(false)} onSave={onUpdate} type="sales" />
             <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Active Sales Orders</h3>
                <div className="overflow-x-auto">
                    <OrderTable orders={activeOrders} type="sales" onUpdate={onUpdate}/>
                </div>
            </Card>
            <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Completed Sales Orders</h3>
                <div className="overflow-x-auto">
                    <OrderTable orders={completedOrders} type="sales" onUpdate={onUpdate} isCompletedTable={true} />
                </div>
            </Card>
        </div>
    );
};


const OrderTable = ({ orders, type, onUpdate, isCompletedTable = false }) => {
    const isSales = type === 'sales';
    const dateKey = isSales ? 'expected_dispatch_date' : 'expected_delivery_date';
    const actualDateKey = isSales ? 'actual_dispatch_date' : 'actual_delivery_date';
    
    const salesStatusOptions = ['Planned', 'In Production', 'Dispatched', 'Overdue', 'Cancelled'];
    const poStatusOptions = ['Pending', 'In Transit', 'Customs', 'Delivered', 'Overdue', 'Cancelled'];

    const handleStatusChange = async (orderId, newStatus) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            const updateFunc = isSales ? BigQuery.updateSalesOrder : BigQuery.updatePurchaseOrder;
            await updateFunc({ ...order, status: newStatus });
            onUpdate();
        }
    };
    
    const handleActualDateChange = async (orderId, date) => {
      const order = orders.find(o => o.id === orderId);
      if(order && date) {
        const updateFunc = isSales ? BigQuery.updateSalesOrder : BigQuery.updatePurchaseOrder;
        await updateFunc({...order, [actualDateKey]: date});
        onUpdate();
      }
    };
    
    const enhancedOrders = useMemo(() => {
        if (!orders) return [];
        return orders.map(order => ({ 
            ...order, 
            days: getDayDifference(order[dateKey]),
            variance: order[actualDateKey] ? getDayDifference(order[actualDateKey], order[dateKey]) : null
        })).sort((a,b) => (a.days ?? Infinity) - (b.days ?? -Infinity));
    }, [orders, dateKey, actualDateKey]);
    
    const headers = isSales ?
        ['Client', 'Sales Order', 'Product', 'Expected Dispatch', 'Actual Dispatch', 'Variance', 'Days Left', 'Status'] :
        ['Supplier', 'PO No', 'Product', 'Expected Delivery', 'Actual Delivery', 'Variance', 'Days Left', 'Status'];

    return (
        <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-800 uppercase bg-gray-100/80">
                <tr>{headers.map(h => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
                {enhancedOrders.map((order, idx) => {
                    const isCompleted = order.status === 'Dispatched' || order.status === 'Delivered';
                    return (
                        <tr key={order.id} className={`border-b border-gray-200/50 transition-colors ${isCompleted ? 'bg-green-50' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50')} hover:bg-green-100/50`}>
                            <td className="px-4 py-3 font-medium text-gray-800">{isSales ? order.client : order.supplier}</td>
                            <td className="px-4 py-3">{isSales ? order.sales_order_number : order.po_number}</td>
                            <td className="px-4 py-3">{order.product}</td>
                            <td className="px-4 py-3">{formatDate(order[dateKey])}</td>
                            <td className="px-4 py-3">
                               <Input type="date" defaultValue={order[actualDateKey] || ''} onBlur={(e) => handleActualDateChange(order.id, e.target.value)} className="text-xs !p-1" />
                            </td>
                            <td className={`px-4 py-3 font-bold ${order.variance > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                               {order.variance !== null ? `${order.variance > 0 ? '+' : ''}${order.variance} days` : 'N/A'}
                            </td>
                            <td className={`px-4 py-3 font-bold ${!isCompleted && order.days < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                               {isCompleted ? <span className="text-green-700 font-semibold">{order.status}</span> : order.days}
                            </td>
                            <td className="px-4 py-3">
                                <Select 
                                    value={order.status} 
                                    onChange={(e) => handleStatusChange(order.id, e.target.value)} 
                                    className={`text-xs !p-1 w-32 border-none rounded-md ${isCompleted ? 'bg-green-200 text-green-900' : 'bg-gray-200'}`}
                                >
                                    {(isSales ? salesStatusOptions : poStatusOptions).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </Select>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

// A simplified table for the dashboard view
const DashboardOrderTable = ({ orders, type }) => {
    const isSales = type === 'sales';
    const dateKey = isSales ? 'expected_dispatch_date' : 'expected_delivery_date';

    const enhancedOrders = useMemo(() => {
        if (!orders) return [];
        return orders.map(order => ({ 
            ...order, 
            days: getDayDifference(order[dateKey]),
        })).filter(o => o.status !== 'Dispatched' && o.status !== 'Delivered')
           .sort((a,b) => (a.days ?? Infinity) - (b.days ?? -Infinity));
    }, [orders, dateKey]);

    const headers = isSales ? ['Client', 'Product', 'Days Left', 'Status'] : ['Supplier', 'Product', 'Days Left', 'Status'];

    return (
        <table className="w-full text-sm text-left text-gray-600">
             <thead className="text-xs text-gray-700 uppercase bg-gray-100/50"><tr>{headers.map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
             <tbody>
                {enhancedOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-green-50/50">
                        <td className={`px-4 py-3 font-medium ${order.days < 0 ? 'text-red-600' : 'text-gray-800'}`}>{isSales ? order.client : order.supplier}</td>
                        <td className={`px-4 py-3 ${order.days < 0 ? 'text-red-600' : 'text-gray-800'}`}>{order.product}</td>
                        <td className={`px-4 py-3 font-bold ${order.days < 0 ? 'text-red-600' : 'text-gray-800'}`}>{order.days}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.days < 0 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{order.status}</span></td>
                    </tr>
                ))}
             </tbody>
        </table>
    );
};


// --- MAIN APP LAYOUT --- //

const Layout = ({ children, currentPage, onNavClick }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5 mr-2" /> },
        { id: 'po-tracking', label: 'PO Tracking', icon: <PackageIcon className="w-5 h-5 mr-2" /> },
        { id: 'sales-tracking', label: 'Sales Tracking', icon: <ShoppingCartIcon className="w-5 h-5 mr-2" /> },
    ];
    
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            <header className="sticky top-0 z-50 bg-gradient-to-r from-green-800 via-blue-900 to-purple-900 text-white shadow-lg backdrop-blur-md bg-opacity-90">
                <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="text-lg font-bold tracking-wider">KUTOKA</div>
                        <div className="text-lg font-bold tracking-wider opacity-80">FAIROILS</div>
                    </div>
                    <nav className="hidden md:flex items-center space-x-2 bg-black/10 p-1 rounded-full">
                        {navItems.map(item => (
                            <button key={item.id} onClick={() => onNavClick(item.id)} className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${currentPage === item.id ? 'bg-white/90 text-green-800 shadow-md' : 'hover:bg-white/20'}`}>
                                {item.icon} {item.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="container mx-auto p-6 lg:p-8">{children}</main>

            <footer className="bg-gray-100 border-t border-gray-200 mt-12">
                <div className="container mx-auto px-6 py-4 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Kutoka Fairoils BI Platform. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

// --- ROOT APP COMPONENT --- //
export default function App() {
    const [page, setPage] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [appData, setAppData] = useState(null);

    const fetchData = () => {
        setLoading(true);
        // Using mock data for now, will be replaced by API calls
        setAppData({
            sales_orders: MOCK_DATA.sales_orders,
            purchase_orders: MOCK_DATA.purchase_orders,
            production_data: MOCK_DATA.production_data,
            factories: MOCK_DATA.factories,
        });
        setLoading(false);
    };

    useEffect(() => {fetchData();}, []);
    
    const renderPage = () => {
        if (loading || !appData) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div></div>;
        
        switch (page) {
            case 'dashboard': return <DashboardPage data={appData} onUpdate={fetchData} />;
            case 'po-tracking': return <POTrackingPage initialData={appData.purchase_orders} onUpdate={fetchData} />;
            case 'sales-tracking': return <SalesTrackingPage initialData={appData.sales_orders} onUpdate={fetchData} />;
            default: return <div>Page not found</div>;
        }
    };
    
    return (
        <>
            <Layout currentPage={page} onNavClick={setPage}>{renderPage()}</Layout>
        </>
    );
}
