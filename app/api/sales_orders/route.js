import { BigQuery } from '@google-cloud/bigquery';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Initialize BigQuery client
// This automatically uses the credentials from environment variables
const bigquery = new BigQuery();

const datasetId = "production_planner";
const tableId = "sales_orders";

// GET handler to fetch all sales orders
export async function GET(request) {
    try {
        const query = `SELECT * FROM \`${datasetId}.${tableId}\``;
        const options = { query: query };

        const [rows] = await bigquery.query(options);
        
        // BigQuery might return dates as objects, so we format them
        const formattedRows = rows.map(row => ({
            ...row,
            order_date: row.order_date ? row.order_date.value : null,
            expected_dispatch_date: row.expected_dispatch_date ? row.expected_dispatch_date.value : null,
            actual_dispatch_date: row.actual_dispatch_date ? row.actual_dispatch_date.value : null,
        }));

        return NextResponse.json(formattedRows);
    } catch (error) {
        console.error('ERROR FETCHING SALES ORDERS:', error);
        return NextResponse.json({ message: 'Failed to fetch sales orders', error: error.message }, { status: 500 });
    }
}

// POST handler to add a new sales order
export async function POST(request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.client || !body.product || !body.qty) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }
        
        const newOrder = {
            id: uuidv4(), // Generate a unique ID
            ...body,
            status: 'Planned',
            timestamp: new Date(),
        };

        await bigquery.dataset(datasetId).table(tableId).insert(newOrder);
        
        return NextResponse.json({ message: 'Sales order created successfully', order: newOrder }, { status: 201 });
    } catch (error) {
        console.error('ERROR CREATING SALES ORDER:', error);
        return NextResponse.json({ message: 'Failed to create sales order', error: error.message }, { status: 500 });
    }
}
