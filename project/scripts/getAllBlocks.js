//Note to team: Delete allBlocks.json if running this file again as it will append the response data 

import fetch from 'node-fetch';
import fs from 'fs';

function writeToFile(data, filename) {
    const currentData = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename)) : [];
    const newData = [...currentData, ...data];
    fs.writeFileSync(filename, JSON.stringify(newData, null, 2));
}
/*https://stackoverflow.com/questions/25353444/outputting-human-readable-times-from-timestamps-on-blockchain-info
 Ref- JS uses microtime so need to multiply the date property in the block by 1000 when referencing the value in that property*/

function generateDateRange(startDate, endDate) {
    let start = new Date(startDate);
    let end = new Date(endDate);
    const dates = [];
    while (start <= end) {
        dates.push(new Date(start.setHours(0, 0, 0, 0)).getTime());
        start = new Date(start.setDate(start.getDate() + 1));
    }
    return dates;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchData(startDate, endDate) {
    const dates = generateDateRange(startDate, endDate);
    let allBlocks = [];

    for (const timestamp of dates) {
        const url = `https://blockchain.info/blocks/${timestamp}?format=json`;

        try {
            await delay(500);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
            const blocks = await response.json();
            if (blocks && blocks.length > 0) {
                allBlocks = [...allBlocks, ...blocks];
                console.log(`Fetched ${blocks.length} blocks for timestamp: ${timestamp}`);
                writeToFile(blocks, 'allBlocks.json');
            } else {
                console.log(`No blocks found for timestamp: ${timestamp}`);
            }
        } catch (error) {
            console.error(`Error fetching data for timestamp: ${timestamp}`, error);
        }
    }

    console.log(`Total blocks fetched: ${allBlocks.length}`);
}


const startDate = '2023-01-01';
const endDate = '2023-03-31';

fetchData(startDate, endDate).then(() => {
    console.log('Finished fetching blocks.');
}).catch(console.error);
