import { NextResponse } from 'next/server';

// This file provides the initial mock data for parts of the application
// that do not have their backend API routes fully implemented yet.
// It allows the frontend to be developed independently.

const MOCK_DATA = {
    factories: [
        { id: 'F001', name: 'Athi River', daily_capacity: 10000, location: 'Athi River, Kenya', status: 'Active' },
        { id: 'F002', name: 'Lunga Factory', daily_capacity: 10000, location: 'Kwale, Kenya', status: 'Active' },
        { id: 'F003', name: 'Mt Kenya Factory', daily_capacity: 10000, location: 'Nanyuki, Kenya', status: 'Under Maintenance' },
        { id: 'F004', name: 'Mara Factory', daily_capacity: 6000, location: 'Narok, Kenya', status: 'Idle' },
        { id: 'F005', name: 'La Cite Factory', daily_capacity: 8000, location: 'Antananarivo, Madagascar', status: 'Partially Active' },
        { id: 'F006', name: 'Fangato Factory', daily_capacity: 8000, location: 'Mananjary, Madagascar', status: 'Active' },
        { id: 'F007', name: 'Amani Factory', daily_capacity: 8000, location: 'Amani, Tanzania', status: 'Active' },
    ],
    production_data: [
        { id: 'PD00', factory_id: 'F001', product: 'Avocado', week: 39, year: 2025, qty: 1000000, recovery_rate: 0.07, active_days: 6, start_date: '2025-09-21', actual_qty: 900800, actual_recovery_rate: 0.065 },
        { id: 'PD01', factory_id: 'F001', product: 'Macadamia', week: 39, year: 2025, qty: 35000, recovery_rate: 0.60, active_days: 6, start_date: '2024-09-21', actual_qty: null, actual_recovery_rate: null },
        { id: 'PD02', factory_id: 'F001', product: 'Moringa', week: 39, year: 2025, qty: 75000, recovery_rate: 0.155, active_days: 6, start_date: '2024-09-21', actual_qty: null, actual_recovery_rate: null },
        { id: 'PD001', factory_id: 'F002', product: 'Eucalyptus Citriodora', week: 39, year: 2025, qty: 200000, recovery_rate: 0.0114, active_days: 6, start_date: '2025-09-21', actual_qty: 190500, actual_recovery_rate: 0.009 },
        { id: 'PD002', factory_id: 'F002', product: 'Ginger Roots', week: 39, year: 2025, qty: 48000, recovery_rate: 0.0036, active_days: 6, start_date: '2025-09-21', actual_qty: 53500, actual_recovery_rate: 0.004 },
        { id: 'PD0001', factory_id: 'F003', product: 'Rose Geranium', week: 39, year: 2025, qty: 100000, recovery_rate: 0.0012, active_days: 6, start_date: '2024-09-21', actual_qty: null, actual_recovery_rate: null },
        { id: 'PD0002', factory_id: 'F003', product: 'Rosemary FFL', week: 39, year: 2025, qty: 75000, recovery_rate: 0.0054, active_days: 6, start_date: '2024-09-21', actual_qty: null, actual_recovery_rate: null },
        { id: 'PD00001', factory_id: 'F004', product: 'Thyme', week: 39, year: 2025, qty: 100000, recovery_rate: 0.0059, active_days: 6, start_date: '2024-09-21', actual_qty: null, actual_recovery_rate: null },
        { id: 'PD00002', factory_id: 'F004', product: 'Rosemary', week: 39, year: 2025, qty: 75000, recovery_rate: 0.0054, active_days: 6, start_date: '2024-09-21', actual_qty: null, actual_recovery_rate: null },
        { id: 'PD000001', factory_id: 'F005', product: 'Cinnaomon', week: 39, year: 2025, qty: 100000, recovery_rate: 0.0060, active_days: 6, start_date: '2024-09-21', actual_qty: null, actual_recovery_rate: null },
        { id: 'PD000002', factory_id: 'F005', product: 'Blackpepper', week: 39, year: 2025, qty: 55000, recovery_rate: 0.0380, active_days: 6, start_date: '2024-09-21', actual_qty: null, actual_recovery_rate: null },
        { id: 'PD0000001', factory_id: 'F006', product: 'Clove Buds', week: 39, year: 2025, qty: 90000, recovery_rate: 0.1250, active_days: 6, start_date: '2024-09-21', actual_qty: null, actual_recovery_rate: null },
        { id: 'PD0000002', factory_id: 'F006', product: 'Vetiver', week: 39, year: 2025, qty: 75000, recovery_rate: 0.0100, active_days: 6, start_date: '2024-09-21', actual_qty: null, actual_recovery_rate: null },
        { id: 'PD00000001', factory_id: 'F007', product: 'Bitter Orange Leaves', week: 39, year: 2025, qty: 75000, recovery_rate: 0.0050, active_days: 6, start_date: '2024-09-21', actual_qty: null, actual_recovery_rate: null },
    ],
    purchase_orders: [
        { id: 'PO001', supplier: 'Uganda Aromatics Ltd.', po_number: 'PO-77543', product: 'Moringa Seeds', qty: 50000, order_date: '2025-09-01', expected_delivery_date: '2025-10-15', actual_delivery_date: null, status: 'In Transit' },
        { id: 'PO002', supplier: 'KFP.', po_number: 'PO-77544', product: 'Shea Nuts', qty: 80000, order_date: '2025-08-10', expected_delivery_date: '2025-09-20', actual_delivery_date: '2025-09-21', status: 'Delivered' },
    ],
};

export async function GET(request) {
    return NextResponse.json(MOCK_DATA);
}
