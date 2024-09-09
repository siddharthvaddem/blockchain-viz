function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
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

function drawSankey(transactionData) {

  console.log(transactionData)
  const nodes = [], links = [];
  let nodeMap = new Map();
  let index = 0;

  function ensureNode(name, type, idx) {
    let uniqueName = `${name}_${type}_${idx}`;
    if (!nodeMap.has(uniqueName)) {
      nodes.push({ name: name, id: index, type: type, value: 0 }); 
      nodeMap.set(uniqueName, index++);
    }
    return nodeMap.get(uniqueName);
  }

  const sortedInputs = transactionData.inputs.sort((a, b) => b.prev_out.value - a.prev_out.value);
  const topInputs = sortedInputs.slice(0, 6);
  const remainingInputs = sortedInputs.slice(6);
  const transactionIndex = ensureNode('Transaction', 'central', 0);

  topInputs.forEach((input, idx) => {
    const sourceIndex = ensureNode(input.prev_out.addr, 'input', idx);
    links.push({
      source: sourceIndex,
      target: transactionIndex,
      value: input.prev_out.value / 100000000
    });
  });

  if (remainingInputs.length > 0) {
    const totalValue = remainingInputs.reduce((acc, curr) => acc + curr.prev_out.value, 0) / 100000000;
    const collectiveInputIndex = ensureNode('Aggregated Inputs', 'input', 999);
    nodes.find(node => node.id === collectiveInputIndex).name = `${remainingInputs.length} inputs, total value ${totalValue.toFixed(6)} BTC`;
    links.push({
      source: collectiveInputIndex,
      target: transactionIndex,
      value: totalValue
    });
  }

  const sortedOutputs = transactionData.out.sort((a, b) => b.value - a.value);
  const topOutputs = sortedOutputs.slice(0, 6);
  const remainingOutputs = sortedOutputs.slice(6);

  topOutputs.forEach((output, idx) => {
    const targetIndex = ensureNode(output.addr, 'output', idx);
    links.push({
      source: transactionIndex,
      target: targetIndex,
      value: output.value / 100000000
    });
  });

  if (remainingOutputs.length > 0) {
    const totalValue = remainingOutputs.reduce((acc, curr) => acc + curr.value, 0) / 100000000;
    const collectiveOutputIndex = ensureNode('Aggregated Outputs', 'output', 999);
    nodes.find(node => node.id === collectiveOutputIndex).name = `${remainingOutputs.length} outputs, total value ${totalValue.toFixed(6)} BTC`;
    links.push({
      source: transactionIndex,
      target: collectiveOutputIndex,
      value: totalValue
    });
  }
  const sankeySvg = d3.select("#sankey_svg").attr("width", "960").attr("height", "500")
    .style("display", "block")
    .style("margin", "auto");
  sankeySvg.selectAll("*").remove();

  const margin = { top: 10, right: 80, bottom: 10, left: 80 };
  const width = +sankeySvg.attr("width");
  const height = +sankeySvg.attr("height");

  const sankeyLayout = d3.sankey()
    .nodePadding(50)
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

  const sankeyData = { nodes, links };
  sankeyLayout(sankeyData);

  const maxTransactionValue = d3.max(nodes, d => d.value);

  const nodeRadiusScale = d3.scaleSqrt()
    .domain([0, maxTransactionValue])
    .range([5, 50]);

  nodes.forEach(node => {
    node.value = node.type === 'central' ?
      d3.sum(links, d => (d.source === node || d.target === node) ? d.value : 0) :
      d3.sum(links, d => (d.source === node) ? d.value : (d.target === node) ? d.value : 0);
    node.radius = nodeRadiusScale(node.value);

    const yPos = (node.y0 + node.y1) / 2;
    node.y0 = yPos - node.radius;
    node.y1 = yPos + node.radius;
  });

  

  const link = sankeySvg.append("g")
    .selectAll(".link")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "sankey-link")
    .attr("d", d => {
      const sx = d.source.x1;
      const sy = (d.source.y0 + d.source.y1) / 2;
      const tx = d.target.x0;
      const ty = (d.target.y0 + d.target.y1) / 2;
      const controlX1 = (sx + tx) / 2;
      const controlY1 = sy;
      const controlX2 = (sx + tx) / 2;
      const controlY2 = ty;
      return `M${sx},${sy} C${controlX1},${controlY1} ${controlX2},${controlY2} ${tx},${ty}`;
    })
    .style("stroke-width", function(d) {
      let width;
      if (d.source.type === 'central') {
        width = d.target.radius; 
      } else if (d.target.type === 'central') {
        width = d.source.radius;
      } else {
        width = Math.min(d.source.radius, d.target.radius); 
      }
      return width;
    })
    .style("fill", "none")
    .style("stroke", "#8ecae6");

  const node = sankeySvg.append("g")
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "sankey-node")
    .attr("transform", d => `translate(${(d.x0 + d.x1) / 2}, ${(d.y0 + d.y1) / 2})`);

  node.filter(d => d.type === 'central')
    .append("circle")
    .attr("r", d => d.radius)
    .style("fill", "#fee08b")
    .style("stroke", "#000");


  node.filter(d => d.type === 'central')
  .append("g")
  .attr("class", "coin-glyph")
  .each(function(d) {
      const radius = d.radius;
      const size = transactionData.size;
      const vout_sz = transactionData.vin_sz;// dont change this; mistake on purpose
        const vin_sz = transactionData.vout_sz;// same
      const centerX = 0;
      const centerY = 0;
      const rectWidth = size>800?800 * 0.04: size*0.04;
      const rectHeight = rectWidth * 0.5;
    
      const arcRadius = radius * 1.2; 


      d3.select(this).append('circle')
            .attr('cx', centerX)
            .attr('cy', centerY)
            .attr('r', radius + (radius / 5))
            .style('fill', 'white')
            .style('stroke', 'black')
            .attr('class', 'coinGlyph border');

     const leftArc = d3.arc()
     .innerRadius(radius)
     .outerRadius(arcRadius)
     .startAngle(Math.PI / 2 - Math.PI / 5 * vin_sz / (2 * Math.max(vin_sz, vout_sz)))
     .endAngle(Math.PI / 2 + Math.PI / 5 * vin_sz / (2 * Math.max(vin_sz, vout_sz)));
 d3.select(this).append("path")
     .attr("d", leftArc)
     .attr("fill", "pink")
     .attr("stroke", "black")
     .attr("stroke-width", 1);

 const rightArc = d3.arc()
     .innerRadius(radius)
     .outerRadius(arcRadius)
     .startAngle(-Math.PI / 2 - Math.PI / 5 * vout_sz / (2 * Math.max(vin_sz, vout_sz)))
     .endAngle(-Math.PI / 2 + Math.PI / 5 * vout_sz / (2 * Math.max(vin_sz, vout_sz)));
 d3.select(this).append("path")
     .attr("d", rightArc)
     .attr("fill", "pink")
     .attr("stroke", "black")
     .attr("stroke-width", 1);

     d3.select(this).append('circle')
            .attr('cx', centerX)
            .attr('cy', centerY)
            .attr('r', radius)
            .style('fill', '#fee08b')
            .style('stroke', 'black')
            .attr('class', 'coinGlyph fee')

      d3.select(this).append("rect")
          .attr("x", -rectWidth / 2)
          .attr("y", -rectHeight / 2)
          .attr("width", rectWidth)
          .attr("height", rectHeight)
          .attr("fill", "white")
          .attr("stroke", "black")
          .raise();
  });

  node.append("circle")
  .attr("r", d => d.radius)
  .style("fill", d => {
    if (d.id === nodeMap.get('Aggregated Inputs_input_999') || d.id === nodeMap.get('Aggregated Outputs_output_999') ) {
      return "#ff6347";
    } 
 else if (d.type === 'central') {
      return "transparent";
    } else {
      return d.sourceLinks.some(link => link.target.type === 'central') ? "#fee08b" : "#fdae61";
    }
  })
  .style("stroke", "#000");

    node.filter(d => d.type !== 'central')
    .append("text")
    .attr("dy", ".35em")
    .attr("text-anchor", d => {
      return d.sourceLinks.some(link => link.target.type === 'central') ? "start" : "end";
    })
    .attr("x", d => {
      return d.sourceLinks.some(link => link.target.type === 'central') ? d.radius + 6 : -d.radius - 6;
    })
    .text(d => {
      if (d.id === nodeMap.get('Aggregated Inputs_input_999')) {
        return `${d.value.toFixed(6)} Total BTC`;
      } 
      else if (d.id === nodeMap.get('Aggregated Outputs_output_999')) {
        return `${d.value.toFixed(6)} Total BTC`;

      }
      return `${d.value.toFixed(6)} BTC`;
    });

}





function formatTime(unixTimestamp){
  var date = new Date(unixTimestamp * 1000);

  var year = date.getFullYear();
  var month = ("0" + (date.getMonth() + 1)).slice(-2);
  var day = ("0" + date.getDate()).slice(-2);
  var hours = ("0" + date.getHours()).slice(-2);
  var minutes = ("0" + date.getMinutes()).slice(-2);
  var seconds = ("0" + date.getSeconds()).slice(-2);

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// async function getHash(height){
//   const response = await fetch('../data/blockDetails.jsonl')
//   const lines = (await response.text()).split('\n');
// console.log(lines)
// for (const line of lines) {
//   if (line.trim() !== '') {
//       const data = JSON.parse(line);
//       if (data.height === height) {

//         //console.log(data.hash)
//           return data.hash;
//       }
//   }
//   return null;
// }


// }

function updateAddressTables(transactionData) {
  const inputTableBody = document.getElementById('inputAddresses').querySelector('tbody');
  const outputTableBody = document.getElementById('outputAddresses').querySelector('tbody');
  
  inputTableBody.innerHTML = '';
  outputTableBody.innerHTML = '';

  transactionData.inputs.forEach(input => {
    //console.log(input.prev_out.addr)
    const row = document.createElement('tr');
      const addressCell = document.createElement('td');
      const valueCell = document.createElement('td');
      let textContent;
    if (input.prev_out && input.prev_out.addr) {

      
      const addressLink = document.createElement('a');
      addressLink.href = `/project/pages/address_page.html?hash=${encodeURIComponent(input.prev_out.addr)}`;

      addressLink.textContent = input.prev_out.addr;
      addressCell.appendChild(addressLink);
      
    }
    else{
      textContent = document.createTextNode('Unknown');
      addressCell.appendChild(textContent);
    }
    valueCell.textContent = (input.prev_out.value / 100000000).toFixed(6) + ' BTC';
    //console.log(valueCell.textContent)
      row.appendChild(addressCell);
      row.appendChild(valueCell);
      inputTableBody.appendChild(row);
  });

  transactionData.out.forEach(output => {
   // console.log(output.addr)
   const row = document.createElement('tr');
   const addressCell = document.createElement('td');
   const valueCell = document.createElement('td');
   let textContent;
    if (output.addr) {
     
      const addressLink = document.createElement('a');
      addressLink.href = `/project/pages/address_page.html?hash=${encodeURIComponent(output.addr)}`;
      addressLink.textContent =output.addr ;
      addressCell.appendChild(addressLink);
      
    }else{
      textContent = document.createTextNode('Unknown');
      addressCell.appendChild(textContent);
    }
    valueCell.textContent = (output.value / 100000000).toFixed(6) + ' BTC';
    //console.log(valueCell.textContent)
      row.appendChild(addressCell);
      row.appendChild(valueCell);
      outputTableBody.appendChild(row);
  });
}

//let transactionHash = '9d02ada431efd9fa94b96e419a1a5a3bf03ad0206bc06b7bcff4256d0ce11e0d'; // Replace with current hash
async function fetchTransactionData() {
  //let transactionHash = document.getElementById('searchInput').value.trim() || 'b05929ca3e1b216f683d6d57e70c14694a913dbc49360874ec4ba307e9dc8458';
  const urlParams = new URLSearchParams(window.location.search);
    console.log(urlParams.get('hash'));


    let transactionHash=urlParams.get('hash') ||'b05929ca3e1b216f683d6d57e70c14694a913dbc49360874ec4ba307e9dc8458'
  if (!transactionHash) {
    alert('Please enter a Transaction hash.');
    return;
  }

  showLoading();


  const blockchainInfoUrl = `https://blockchain.info/rawtx/${transactionHash}`;
    const table = document.getElementById('transactionsInfoTable');
    
  const tbody = table.querySelector('tbody');
  //console.log("Transaction Hash Element:", document.getElementById('tbody'));



  
  
try{
  const response = await fetch(blockchainInfoUrl);
        const transactionData = await response.json();
      //const blockHash = await getHash(transactionData.block_height);
  
   
      const formattedTime= formatTime(transactionData.time);

      // console.log(transactionData.hash)
      // console.log(formattedTime)
      // console.log(transactionData.size)
      // console.log(blockHash)
      // console.log(transactionData.fee)

      const satoshisPerBitcoin = 100000000;
      const feeInBTC = transactionData.fee / satoshisPerBitcoin;
      
      document.getElementById('transactionHash').textContent = transactionData.hash;
      document.getElementById('transactionTime').textContent = formattedTime;
      document.getElementById('transactionSize').textContent = `${transactionData.size} bytes`;
      document.getElementById('blockHeight').textContent = transactionData.block_height;
      document.getElementById('transactionFee').textContent = `${feeInBTC} BTC`

      drawSankey(transactionData)
      updateAddressTables(transactionData);
      hideLoading();
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      alert('Failed to fetch transaction data. Please check the console for more details.');
  }

  
}


window.onload = function() {
  fetchTransactionData(); 
};

