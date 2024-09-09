import fetch from 'node-fetch';
import fs from 'fs';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3, retryDelay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.log(`Fetch error: ${error.message}. Retrying in ${retryDelay}ms...`);
            await delay(retryDelay);
        }
    }
    throw new Error('Max retries reached');
}

async function readLastProcessedIndex() {
    try {
        const index = fs.readFileSync('choropleth.txt', 'utf8');
        return parseInt(index, 10);
    } catch (error) {
        return -1;
    }
}

function writeLastProcessedIndex(index) {
    fs.writeFileSync('choropleth.txt', index.toString(), 'utf8');
}

async function processIPAddresses() {
    const rawData = fs.readFileSync('relayedBy.jsonl', 'utf8');
    const ipAddresses = rawData.trim().split('\n').map(line => JSON.parse(line).relayed_by);
    const uniqueIPs = [...new Set(ipAddresses)];
    const lastProcessedIndex = await readLastProcessedIndex();
    let requestCount = 0;

    for (let i = lastProcessedIndex + 1; i < uniqueIPs.length; i++) {
        if (requestCount >= 45) {
            console.log("Rate limit reached. Waiting 60 seconds...");
            await delay(60000); 
            requestCount = 0;
        }

        const ip = uniqueIPs[i];
        try {
            const geoInfo = await fetchWithRetry(`http://ip-api.com/json/${ip}`);
            const dataToSave = {
                ip, 
                country: geoInfo.country, 
                state: geoInfo.regionName,
                city: geoInfo.city,
                zip: geoInfo.zip
            };
            fs.appendFileSync('ipGeolocation.jsonl', JSON.stringify(dataToSave) + '\n', 'utf8');
            writeLastProcessedIndex(i);
            console.log(`Processed IP ${i + 1}/${uniqueIPs.length}: ${ip} -> Country: ${geoInfo.country}, State: ${geoInfo.regionName}, City: ${geoInfo.city}, ZIP: ${geoInfo.zip}`);
            requestCount++;
            await delay(1000);
        } catch (error) {
            console.error(`Error processing IP ${ip}:`, error);
            break;
        }
    }
}

processIPAddresses().catch(console.error);
