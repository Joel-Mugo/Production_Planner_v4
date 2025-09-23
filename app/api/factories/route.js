import { BigQuery } from '@google-cloud/bigquery';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Initialize BigQuery client
const bigquery = new BigQuery();

const datasetId = "production_planner";
const tableId = "factories";

// GET handler to fetch all factories
export async function GET(request) {
    try {
        const query = `SELECT * FROM \`${datasetId}.${tableId}\``;
        const [rows] = await bigquery.query({ query });
        return NextResponse.json(rows);
    } catch (error) {
        console.error('ERROR FETCHING FACTORIES:', error);
        return NextResponse.json({ message: 'Failed to fetch factories', error: error.message }, { status: 500 });
    }
}

// POST handler to add a new factory
export async function POST(request) {
    try {
        const body = await request.json();

        if (!body.name || !body.daily_capacity || !body.location) {
            return NextResponse.json({ message: 'Missing required fields for factory' }, { status: 400 });
        }
        
        const newFactory = {
            id: uuidv4(),
            ...body,
            status: body.status || 'Active',
        };

        await bigquery.dataset(datasetId).table(tableId).insert(newFactory);
        
        return NextResponse.json({ message: 'Factory created successfully', factory: newFactory }, { status: 201 });
    } catch (error) {
        console.error('ERROR CREATING FACTORY:', error);
        return NextResponse.json({ message: 'Failed to create factory', error: error.message }, { status: 500 });
    }
}
