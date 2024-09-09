async function fetchData() {
    const response = await fetch('../data/blockDetails.jsonl');
    const data = await response.text();
    const lines = data.trim().split('\n');
    const blocks = lines.map(line => JSON.parse(line));
    console.log(blocks);
    return blocks;
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    console.log(date);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

function truncateString(str) {
    const firstThree = str.substring(0, 3);
    const lastThree = str.substring(str.length - 3);
    return `${firstThree}...${lastThree}`;
}

async function createBlocks() {
    const blocks = await fetchData();
    const container = document.getElementById('imageContainer');
    const lastSixTransactions = blocks[0].n_tx < 6 ? blocks[0].n_tx : 6;

    for (let i = 0; i < lastSixTransactions; i++) {
        const block = blocks[i];
        const blockItem = document.createElement('div');
        blockItem.classList.add('blockItem');

        const truncatedHash = truncateString(block.hash);
        const truncatedPrevHash = truncateString(block.prev_block);
        const truncatedMerkleRoot = truncateString(block.mrkl_root);

        const confirmationNumber = lastSixTransactions - i;

        let timeDifference = '';
        if (i > 0) {
            const prevBlockTime = blocks[i - 1].time;
            const currentBlockTime = block.time;
            const differenceInSeconds =  prevBlockTime - currentBlockTime;
            timeDifference = `${differenceInSeconds} s`;
        }

        const transactionDetails = `
            <div class="imageContent" style="cursor: pointer;">
            
                <img src="../../images/test1.png" alt="Block Image" class="blockImage" >
                <div class="squareBoxLeft">
                    <p>Block height: ${block.height}</p>
                </div>
                <div class="squareBoxRight">
                    <p>Confirmation: ${confirmationNumber}</p>
                </div>
                <div class="textOverlay">
                    <p>Block hash: ${truncatedHash}</p>
                    <p>Prev Block hash: ${truncatedPrevHash}</p>
                    <p>Merkle root: ${truncatedMerkleRoot}</p>
                    <p>Time: ${formatTimestamp(block.time)}</p>
                </div>
                ${i > 0 ? `<div class="arrow"><span>&larr;</span> ${timeDifference}</div>` : ''}
            </div>
        `;
        blockItem.innerHTML = transactionDetails;

        blockItem.addEventListener('click', () => {
            window.location.href = `/project/pages/block_page.html?hash=${encodeURIComponent(block.hash)}`;
        });
        
        container.appendChild(blockItem);
    }
}

function search() {
    var userInput = document.getElementById('searchInput').value;
    var apiUrl = 'https://blockchain.info/raw';


    if (!isNaN(userInput)) {
       
        fetch('../data/blockDetails.jsonl')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch data from blockDetails.jsonl');
                }
                return response.text();
            })
            .then(data => {
                const lines = data.trim().split('\n');
                const blocks = lines.map(line => JSON.parse(line));

                const matchingBlock = blocks.find(block => block.height === parseInt(userInput));
                console.log(matchingBlock)
                if (matchingBlock) {
                    window.location.href = `/project/pages/block_page.html?hash=${encodeURIComponent(matchingBlock.hash)}`;
                } else {
                    window.location.href = '/project/pages/error.html';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                window.location.href = '/project/pages/error.html';
            });

        return;
    }
    fetch(apiUrl + 'block/' + userInput)
        .then(response => {
            if (response.ok) {
                window.location.href = `/project/pages/block_page.html?hash=${encodeURIComponent(userInput)}`
            } else {
                return fetch(apiUrl + 'tx/' + userInput)
                    .then(response => {
                        console.log(response)
                        if (response.ok) {
                            window.location.href = `/project/pages/transaction_page.html?hash=${encodeURIComponent(userInput)}`
                        } else {
                            return fetch(apiUrl + 'addr/' + userInput)
                                .then(response => {
                                    if (response.ok) {
                                        window.location.href = `/project/pages/address_page.html?hash=${encodeURIComponent(userInput)}`
                                    } else {
                                        window.location.href = '/error.html'; 
                                    }
                                });
                        }
                    });
            }
        })
        .catch(error => {
            window.location.href = '/error';
        });
}

createBlocks();


document.addEventListener('DOMContentLoaded', function () {
    // Fetch dataset from JSONL file
    fetch('../data/processedDailySummary.jsonl')
        .then(response => response.text())
        .then(data => {
            // Convert JSONL data to an array of JavaScript objects
            const dataset = data.trim().split('\n').map(line => JSON.parse(line));

            // Extracting data from the dataset
            const labels = dataset.map(data => data.dateInUnix);
            const blockCounts = dataset.map(data => data.blockCount);
            const transactionCounts = dataset.map(data => data.transactionCount);

            // Set up SVG dimensions
            const width = 1400;
            const height = 350;
            const margin = { top: 100, right: 80, bottom: 60, left: 150 };

            // Create SVG container
            const svg = d3.select('#DoubleBarChart')
                .append('svg')
                .attr('width', width)
                .attr('height', height);
            
            console.log("inside");

            const xScale = d3.scaleBand()
                .domain(labels)
                .range([margin.left, width - margin.right])
                .paddingInner(0.4) // Adjust padding between bars
                .paddingOuter(0.5); // Adjust padding at the ends of the scale

            const y1Scale = d3.scaleLinear()
                .domain([55, d3.max(blockCounts)])
                .range([height - margin.bottom, margin.top]);

            const y2Scale = d3.scaleLinear()
                .domain([150000, d3.max(transactionCounts)])
                .range([height - margin.bottom, margin.top]);

            // Create axes
            var xAxis = d3.axisBottom(xScale);
            const y1Axis = d3.axisLeft(y1Scale).ticks(5);
            const y2Axis = d3.axisRight(y2Scale).ticks(5);

            // Filter labels to include every 5th element
            const filteredLabels = labels.filter((label, index) => index % 5 === 0);

            // Create x-axis with filtered labels
            xAxis = d3.axisBottom(xScale)
            .tickValues(filteredLabels);

            // Append axes to SVG
            svg.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(xAxis)
            .selectAll('text') // Select all text elements
            .attr('transform', 'rotate(-45)') // Rotate the text by -45 degrees
            .attr('text-anchor', 'end') // Set text-anchor to end for proper alignment
            .attr('dx', '-0.5em') // Adjust position horizontally if needed
            .attr('dy', '0.5em'); // Adjust position vertically if needed


            svg.append('g')
                .attr('transform', `translate(${margin.left},0)`)
                .call(y1Axis)
                .append('text')
                .attr('fill', '#000')
                .attr('transform', 'rotate(-90)')
                .attr('y', -40)
                .attr('x', -height / 2)
                .attr('dy', '0.71em')
                .attr('text-anchor', 'end')
                .text('Blocks');

            svg.append('g')
                .attr('transform', `translate(${width - margin.right},0)`)
                .call(y2Axis)
                .append('text')
                .attr('fill', '#000')
                .attr('transform', 'rotate(-90)')
                .attr('y', 60)
                .attr('x', -height / 2)
                .attr('dy', '0.71em')
                .attr('text-anchor', 'end')
                .text('Transactions');

            // Draw bars for block counts
            svg.selectAll('.block-bar')
                .data(dataset)
                .enter()
                .append('rect')
                .attr('class', 'block-bar')
                .attr('x', (d, i) => xScale(labels[i]))
                .attr('y', d => y1Scale(d.blockCount))
                .attr('width', xScale.bandwidth())
                .attr('height', d => height - margin.bottom - y1Scale(d.blockCount))
                .attr('fill', 'rgba(213, 165, 108, 0.8)');

            // Draw dots for transaction counts
            svg.selectAll('.dot')
                .data(transactionCounts)
                .enter().append('circle')
                .attr('class', 'dot')
                .attr('cx', (d, i) => xScale(labels[i]) + xScale.bandwidth() / 2)
                .attr('cy', d => y2Scale(d))
                .attr('r', 3) // Adjust the radius of the dots as needed
                .style('fill', 'rgba(255, 0, 0, 1)');

            // Draw lines for transaction counts
            const line = d3.line()
                .x((d, i) => xScale(labels[i]) + xScale.bandwidth() / 2)
                .y(d => y2Scale(d));

            svg.append('path')
                .datum(transactionCounts)
                .attr('fill', 'none')
                .attr('stroke', 'rgba(255, 0, 0, 1)')
                .attr('stroke-width', 1.5)
                .attr('d', line);

            // Create color legend
            const legend = svg.append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${width - margin.right - 700}, ${margin.top - 50})`); // Adjust the translation to move the legend above the plot

            // Add legend rectangle for blocks
            legend.append('rect')
                .attr('x', -70)
                .attr('y', 2)
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', 'rgba(213, 165, 108, 0.8)');

            // Add legend text for blocks
            legend.append('text')
                .attr('x', -50)
                .attr('y', 5)
                .attr('dy', '0.8em')
                .style('font-size', '12px')
                .text('Blocks');

            // Add legend circle for transactions
            legend.append('circle')
                .attr('cx', 120)
                .attr('cy', 10)
                .attr('r', 3)
                .style('fill', 'rgba(255, 0, 0, 1)')
                //.style('stroke', 'black')
                .style('stroke-width', '2px');

            // Add legend line for transactions
            legend.append('line')
                .attr('x1', 110)
                .attr('y1', 10)
                .attr('x2', 130)
                .attr('y2', 10)
                .style('stroke', 'rgba(255, 0, 0, 1)')
                .style('stroke-width', '2px');

            // Add legend text for transactions
            legend.append('text')
                .attr('x', 135)
                .attr('y', 5)
                .attr('dy', '0.8em')
                .style('font-size', '12px')
                .text('Transactions');


        })
        .catch(error => console.error('Error fetching data:', error));
});