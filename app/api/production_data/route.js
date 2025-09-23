import { BigQuery } from '@google-cloud/bigquery';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Initialize BigQuery client
const bigquery = new BigQuery();

const datasetId = "production_planner";
const tableId = "production_data";

// GET handler to fetch all production data
export async function GET(request) {
    try {
        const query = `SELECT * FROM \`${datasetId}.${tableId}\``;
        const [rows] = await bigquery.query({ query });

        // Format dates that BigQuery might return as objects
        const formattedRows = rows.map(row => ({
            ...row,
            start_date: row.start_date ? row.start_date.value : null,
        }));

        return NextResponse.json(formattedRows);
    } catch (error) { // <-- BRACE WAS MISSING HERE
        console.error('ERROR FETCHING PRODUCTION DATA:', error);
        return NextResponse.json({ message: 'Failed to fetch production data', error: error.message }, { status: 500 });
    }
}

// POST handler to add new production data (a forecast)
export async function POST(request) {
    try {
        const body = await request.json();

        if (!body.factory_id || !body.product || !body.qty || !body.recovery_rate) {
            return NextResponse.json({ message: 'Missing required fields for production data' }, { status: 400 });
        }
        
        const newData = {
            id: uuidv4(),
            ...body,
            actual_qty: null, // Actuals are null for a new forecast
            actual_recovery_rate: null,
            timestamp: new Date(),
        };

        await bigquery.dataset(datasetId).table(tableId).insert(newData);
        
        return NextResponse.json({ message: 'Production data created successfully', data: newData }, { status: 201 });
    } catch (error) { // <-- BRACE WAS MISSING HERE
        console.error('ERROR CREATING PRODUCTION DATA:', error);
        return NextResponse.json({ message: 'Failed to create production data', error: error.message }, { status: 500 });
    }
}

// PUT handler to update production data (e.g., adding actuals)
export async function PUT(request) {
    try {
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json({ message: 'Record ID is required for an update' }, { status: 400 });
        }

        // In a real app, you would construct a MERGE statement for BigQuery
        // For simplicity here, we'll log the intended action.
        console.log(`Intending to update production_data for id: ${body.id} with data:`, body);
        
        return NextResponse.json({ message: 'Production data update request received (simulation)', data: body }, { status: 200 });
    } catch (error) { // <-- BRACE WAS MISSING HERE
        console.error('ERROR UPDATING PRODUCTION DATA:', error);
        return NextResponse.json({ message: 'Failed to update production data', error: error.message }, { status: 500 });
    }
}

