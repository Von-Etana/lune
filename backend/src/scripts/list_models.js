const https = require('https');

const apiKey = process.env.GEMINI_API_KEY; // Ensure this is set when running
if (!apiKey) {
    console.error('GEMINI_API_KEY not set');
    process.exit(1);
}

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models?key=${apiKey}`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsedData = JSON.parse(data);
            if (parsedData.models) {
                console.log('Available Models:');
                parsedData.models.forEach(model => {
                    console.log(`- ${model.name}`);
                });
            } else {
                console.error('Failed to parse models. Response:', data);
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.error('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
});

req.end();
