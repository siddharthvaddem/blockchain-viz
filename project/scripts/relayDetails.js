import fetch from 'node-fetch';
import fs from 'fs';

// Reads the list of blocks from the JSON file
function readBlocksFromFile(filename) {
    const rawData = fs.readFileSync(filename, 'utf8');
    const blocks = JSON.parse(rawData);
    return blocks; // Assuming this is an array of block hashes
}

// Appends data to a .jsonl file
function appendDataToFile(data, filename) {
    fs.appendFileSync(filename, JSON.stringify(data) + '\n', 'utf8');
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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function readLastProcessedIndex() {
    try {
        const index = fs.readFileSync('lastIPProcessedIndex.txt', 'utf8');
        return parseInt(index, 10);
    } catch (error) {
        return -1; }
}


function writeLastProcessedIndex(index) {
    fs.writeFileSync('lastIPProcessedIndex.txt', index.toString(), 'utf8');
}

async function processBlocks() {
    const blocks = readBlocksFromFile('allBlocks.json');
    const lastProcessedIndex = await readLastProcessedIndex();
    for (let i = lastProcessedIndex + 1; i < blocks.length; i++) {
        const blockHash = blocks[i].hash;
        const url = `https://api.blockcypher.com/v1/btc/main/blocks/${blockHash}`;
        try {
            const blockDetails = await fetchWithRetry(url);
            
            const relayedIP = blockDetails.relayed_by ? blockDetails.relayed_by.split(':')[0] : 'Unknown';
            const dataToSave = {
                hash: blockDetails.hash,
                relayed_by: relayedIP
            };
            appendDataToFile(dataToSave, 'relayedBy.jsonl');
            writeLastProcessedIndex(i);
            console.log(`Processed block ${i + 1}/${blocks.length}: ${blockHash}`);
            await delay(1000); 
        } catch (error) {
            console.error(`Error processing block ${blockHash}:`, error);
            break; 
        }
    }
}

processBlocks().catch(console.error);
