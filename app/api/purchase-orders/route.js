import { BigQuery } from '@google-cloud/bigquery';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Initialize BigQuery client
// This automatically uses the credentials from environment variables
const bigquery = new BigQuery();

const datasetId = "production_planner";
const tableId = "purchase_orders";

// GET handler to fetch all purchase orders
export async function GET(request) {
    try {
        const query = `SELECT * FROM \`${datasetId}.${tableId}\``;
        const options = { query: query };

        const [rows] = await bigquery.query(options);
        
        // Format dates that BigQuery might return as objects
        const formattedRows = rows.map(row => ({
            ...row,
            order_date: row.order_date ? row.order_date.value : null,
            expected_delivery_date: row.expected_delivery_date ? row.expected_delivery_date.value : null,
            actual_delivery_date: row.actual_delivery_date ? row.actual_delivery_date.value : null,
        }));

        return NextResponse.json(formattedRows);
    } catch (error)
        console.error('ERROR FETCHING PURCHASE ORDERS:', error);
        return NextResponse.json({ message: 'Failed to fetch purchase orders', error: error.message }, { status: 500 });
    }
}

// POST handler to add a new purchase order
export async function POST(request) {
    try {
        const body = await request.json();

        // Basic validation for purchase order fields
        if (!body.supplier || !body.product || !body.qty || !body.po_number) {
            return NextResponse.json({ message: 'Missing required fields for purchase order' }, { status: 400 });
        }
        
        const newOrder = {
            id: uuidv4(), // Generate a unique ID
            ...body,
            status: 'Pending', // Default status for a new PO
            timestamp: new Date(),
        };

        await bigquery.dataset(datasetId).table(tableId).insert(newOrder);
        
        return NextResponse.json({ message: 'Purchase order created successfully', order: newOrder }, { status: 201 });
    } catch (error) {
        console.error('ERROR CREATING PURCHASE ORDER:', error);
        return NextResponse.json({ message: 'Failed to create purchase order', error: error.message }, { status: 500 });
    }
}
