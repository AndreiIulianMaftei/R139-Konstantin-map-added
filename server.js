const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// CSV file paths
const HEAT_CSV = 'public/heat.csv';
const BUNKERS_CSV = 'public/bunkers.csv';

// Function to read existing CSV data
function readCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(filePath)) {
            resolve(results);
            return;
        }
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

// Function to write data to CSV
function writeToCsv(filePath, data, headers) {
    const csvWriter = createCsvWriter({
        path: filePath,
        header: headers
    });
    
    return csvWriter.writeRecords(data);
}

// Function to determine which CSV file to use based on incident type
function getCsvFileForType(incidentType) {
    const heatTypes = [
        'bomb', 'explosion', 'car explosion', 'missile strike', 'air strikes', 
        'drone strike', 'shooting', 'gun fight', 'knife attack', 'street brawl',
        'forces gathering', 'soldiers spotted'
    ];
    
    const bunkerTypes = [
        'shelter', 'bunker', 'food bank', 'embassy'
    ];
    
    if (heatTypes.includes(incidentType)) {
        return HEAT_CSV;
    } else if (bunkerTypes.includes(incidentType)) {
        return BUNKERS_CSV;
    } else {
        // Default to heat.csv for unknown types
        return HEAT_CSV;
    }
}

// Function to get headers for CSV file
function getHeadersForFile(filePath) {
    if (filePath === HEAT_CSV) {
        return [
            { id: 'lat', title: 'lat' },
            { id: 'lon', title: 'lon' },
            { id: 'ins', title: 'ins' },
            { id: 'type', title: 'type' },
            { id: 'name', title: 'name' },
            { id: 'desc', title: 'desc' }
        ];
    } else {
        return [
            { id: 'lat', title: 'lat' },
            { id: 'lon', title: 'lon' },
            { id: 'type', title: 'type' },
            { id: 'name', title: 'name' },
            { id: 'desc', title: 'desc' }
        ];
    }
}

// Function to generate intensity score for heat.csv
function generateIntensityScore(incidentType) {
    const intensityMap = {
        'bomb': 0.9,
        'explosion': 0.8,
        'car explosion': 0.7,
        'missile strike': 0.9,
        'air strikes': 0.8,
        'drone strike': 0.7,
        'shooting': 0.8,
        'gun fight': 0.7,
        'knife attack': 0.6,
        'street brawl': 0.5,
        'forces gathering': 0.6,
        'soldiers spotted': 0.4
    };
    
    return intensityMap[incidentType] || 0.5;
}

// Endpoint to submit incident report
app.post('/submit-incident', async (req, res) => {
    try {
        const { type, lat, lon, name, contact } = req.body;
        
        if (!type || !lat || !lon || !name) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: type, lat, lon, name'
            });
        }
        
        // Determine which CSV file to use
        const csvFile = getCsvFileForType(type);
        const headers = getHeadersForFile(csvFile);
        
        // Read existing data
        const existingData = await readCsvFile(csvFile);
        
        // Create new record
        const newRecord = {
            lat: lat.toString(),
            lon: lon.toString(),
            type: type,
            name: name,
            desc: type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        };
        
        // Add intensity score for heat.csv
        if (csvFile === HEAT_CSV) {
            newRecord.ins = generateIntensityScore(type).toString();
        }
        
        // Add new record to existing data
        existingData.push(newRecord);
        
        // Write back to CSV file
        await writeToCsv(csvFile, existingData, headers);
        
        console.log(`✅ Incident saved to ${csvFile}:`, {
            type,
            name,
            lat,
            lon,
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: `Incident saved to ${path.basename(csvFile)}`,
            data: newRecord
        });
        
    } catch (error) {
        console.error('❌ Error saving incident:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint to get all incidents
app.get('/incidents', async (req, res) => {
    try {
        const heatData = await readCsvFile(HEAT_CSV);
        const bunkersData = await readCsvFile(BUNKERS_CSV);
        
        res.json({
            success: true,
            heat: heatData,
            bunkers: bunkersData,
            total: heatData.length + bunkersData.length
        });
        
    } catch (error) {
        console.error('❌ Error reading incidents:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint to get incidents by type
app.get('/incidents/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const csvFile = getCsvFileForType(type);
        const data = await readCsvFile(csvFile);
        
        // Filter by type if specified
        const filteredData = type === 'all' ? data : data.filter(item => item.type === type);
        
        res.json({
            success: true,
            type: type,
            data: filteredData,
            count: filteredData.length
        });
        
    } catch (error) {
        console.error('❌ Error reading incidents by type:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: [
            'POST /submit-incident',
            'GET /incidents',
            'GET /incidents/:type',
            'GET /health'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Report Server running on http://localhost:${PORT}`);
    console.log(`📊 Endpoints:`);
    console.log(`   POST /submit-incident - Submit new incident report`);
    console.log(`   GET /incidents - Get all incidents`);
    console.log(`   GET /incidents/:type - Get incidents by type`);
    console.log(`   GET /health - Health check`);
    console.log(`📁 CSV Files:`);
    console.log(`   Heat incidents: ${HEAT_CSV}`);
    console.log(`   Safe locations: ${BUNKERS_CSV}`);
}); 