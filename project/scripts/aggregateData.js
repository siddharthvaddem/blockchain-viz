import fetch from 'node-fetch';
import fs from 'fs';


async function readLastProcessedDate() {
    try {
        const lastDate = fs.readFileSync('lastProcessedDate.txt', { encoding: 'utf8' });
        return lastDate;
    } catch (error) {
        if (error.code === 'ENOENT') {
           return '';
        } else {
            throw error;
        }
    }
}

function writeLastProcessedDate(date) {
    fs.writeFileSync('lastProcessedDate.txt', date.toString(), { encoding: 'utf8' });
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

/*due to  JS date object operating in local time zone of the environment of system 
the time is set to midnight at the start of the day based on the local time zone.*/
// we will be considering dec 31st -march 30th 
function generateDateRange(startDate, endDate) {
    let start = new Date(startDate);
    let end = new Date(endDate);
    const dates = [];
    while (start <= end) {
        dates.push(new Date(start.setHours(0, 0, 0, 0)).getTime());
        start = new Date(start.setDate(start.getDate() + 1));
    }
    //console.log(dates)
    return dates;
}

async function appendDataToFile(data, filename) {
    fs.appendFileSync(filename, JSON.stringify(data) + '\n');
}

async function fetchData(startDate, endDate) {
    const dates = generateDateRange(startDate, endDate);
    
    const lastProcessedDate = await readLastProcessedDate();
    
    let startIndex = lastProcessedDate ? dates.indexOf(Number(lastProcessedDate)) + 1 : 0;
    const datesToProcess = dates.slice(startIndex);

    for (const date of datesToProcess) {
        const url = `https://blockchain.info/blocks/${date}?format=json`;
        let dailyTransactionCount = 0;
        let numBlocks = 0;

        try {
            await delay(500);
            const blocks = await fetchWithRetry(url);
            
            numBlocks = blocks.length;
            console.log("Day: "+date+", "+numBlocks+" blocks")
            //let test=1;
            for (const block of blocks) {
                const blockDetails = await fetchWithRetry(`https://blockchain.info/rawblock/${block.hash}`);
                dailyTransactionCount += blockDetails.n_tx || 0;
                //console.log(test+" done")
               // test+=1;
                await delay(500);
                
            }

            const summary = { dateInUnix:date, blockCount:numBlocks, transactionCount: dailyTransactionCount };
            console.log(`Date: ${date}, Blocks: ${numBlocks}, Total Transactions: ${dailyTransactionCount}`);
            writeLastProcessedDate(date);
            appendDataToFile(summary, 'dailySummary.jsonl');
        } catch (error) {
            console.error(`Error on ${date}:`, error);
        }
    }
}

const startDate = '2023-01-01';
const endDate = '2023-03-31';
fetchData(startDate, endDate).catch(console.error);
