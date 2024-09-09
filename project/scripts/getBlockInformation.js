import fetch from 'node-fetch';
import { readFile, writeFile, appendFile } from 'fs/promises'; 

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//incase of rate limit session end
async function fetchWithRetry(url, retries = 3, retryDelay = 1000) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        if (retries > 0) {
            console.log(`Fetch error: ${error.message}. Retrying in ${retryDelay}ms...`);
            await delay(retryDelay);
            return fetchWithRetry(url, retries - 1, retryDelay);
        } else {
            throw error;
        }
    }
}
async function fetchBlockDetails(blockHash) {
    const url = `https://blockchain.info/rawblock/${blockHash}`;
    
    return await fetchWithRetry(url);
}

async function appendBlockToFile(blockDetail) {
    try {
        const blockString = JSON.stringify(blockDetail) + '\n';
        await appendFile('./blockInformation.jsonl', blockString); 
    } catch (error) {
        console.error('Failed to append block to file:', error);
    }
}

async function saveLastProcessedBlock(blockHash) {
    await writeFile('./lastProcessedBlock.txt', blockHash, { encoding: 'utf8' }); 
}

async function getLastProcessedBlock() {
    try {
        const hash = await readFile('./lastProcessedBlock.txt', { encoding: 'utf8' });
        return hash;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return '';
        } else {
            throw error;
        }
    }
}

async function makeDetailedBlocksData() {
    try {
        const blocks = JSON.parse(await readFile('./allBlocks.json', { encoding: 'utf8' })); 
        const lastProcessedBlock = await getLastProcessedBlock();
        let startIndex = blocks.findIndex(block => block.hash === lastProcessedBlock) + 1;

        for (let i = startIndex; i < blocks.length; i++) {
            const block = blocks[i];
            console.log(`Block: ${i + 1} -> ${block.hash}`);
            const details = await fetchBlockDetails(block.hash);
            await appendBlockToFile(details);
            await saveLastProcessedBlock(block.hash);
            await delay(1000);
        }

        console.log('All block details fetched and saved.');
    } catch (error) {
        console.error('Error:', error);
    }
}

makeDetailedBlocksData();