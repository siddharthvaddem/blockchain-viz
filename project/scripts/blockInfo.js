import fetch from 'node-fetch';
import fs from 'fs';


function readBlocksFromFile(filename) {
    const rawData = fs.readFileSync(filename);
    const blocks = JSON.parse(rawData);
    return blocks.map(block => block.hash);
}

async function fetchWithRetry(url, retries = 3, retryDelay = 1000) {
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

function writeLastProcessedIndex(index) {
    fs.writeFileSync('lastProcessedIndex.txt', index.toString(), { encoding: 'utf8' });
}

async function readLastProcessedIndex() {
    try {
        const index = fs.readFileSync('lastProcessedIndex.txt', { encoding: 'utf8' });
        return parseInt(index, 10);
    } catch (error) {
        return -1;
    }
}

async function appendDataToFile(data, filename) {
    fs.appendFileSync(filename, JSON.stringify(data) + '\n');
}

async function fetchBlockDetailsAndWriteData(blockHashes, detailsFilename) {
    const lastProcessedIndex = await readLastProcessedIndex();
    for (let i = lastProcessedIndex + 1; i < blockHashes.length; i++) {
        try {
            const blockDetails = await fetchWithRetry(`https://blockchain.info/rawblock/${blockHashes[i]}?format=json`);
            const { hash, height, prev_block, mrkl_root, time, n_tx, relayed_by,size } = blockDetails;
            

            await appendDataToFile({ hash, height, prev_block,mrkl_root, time, n_tx, size}, detailsFilename);
            // https://bitcoin.stackexchange.com/questions/59979/is-there-a-blockexplorer-with-a-websocket-api-that-includes-relay-ip-address
            //seems to be a problem getting IP addr in this API (they privatized it), will write same script in another file fetching the info using BlockCypher or other relevant API
            //await appendDataToFile({ hash, relayed_by }, relayedByFilename);
            writeLastProcessedIndex(i);
            console.log(`Processed block ${i+1}/${blockHashes.length}: ${hash}`);
            await delay(500); 
        } catch (error) {
            console.error(`Error fetching details for block ${blockHashes[i]}:`, error);
            break; 
        }
    }
}

async function start() {
    const blockHashes = readBlocksFromFile('allBlocks.json');
    await fetchBlockDetailsAndWriteData(blockHashes, 'blockDetails.jsonl');
}

start().catch(console.error);
