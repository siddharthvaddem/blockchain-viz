
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

function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}
function addSortingListeners() {
    const table = document.getElementById('transactionsTable');
    const headers = document.querySelectorAll('.sortable');
  
  
    headers.forEach(header => {
      const newHeader = header.cloneNode(true);
      header.parentNode.replaceChild(newHeader, header);
    });
  
    headers.forEach((header, index) => {
      header.addEventListener('click', () => {
        const asc = header.classList.contains('asc');
        sortTable(table, index + 1, !asc);
      });
    });
  }
  
  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
  
  function sortTable(table, column, asc = true) {
    const dirModifier = asc ? 1 : -1;
    const tBody = table.tBodies[0];
    const rows = Array.from(tBody.querySelectorAll('tr'));
  
    const sortedRows = rows.sort((a, b) => {
      const aColText = a.querySelector(`td:nth-child(${column + 1})`).textContent.trim();
      const bColText = b.querySelector(`td:nth-child(${column + 1})`).textContent.trim();
  
      const aValue = isNumeric(aColText) ? parseFloat(aColText) : aColText;
      const bValue = isNumeric(bColText) ? parseFloat(bColText) : bColText;
  
      return aValue > bValue ? (1 * dirModifier) : (-1 * dirModifier);
    });
  
    while (tBody.firstChild) {
      tBody.removeChild(tBody.firstChild);
    }
    tBody.append(...sortedRows);
  
    table.querySelectorAll('th').forEach(th => th.classList.remove('asc', 'desc'));
    table.querySelector(`th:nth-child(${column + 1})`).classList.toggle('asc', asc);
    table.querySelector(`th:nth-child(${column + 1})`).classList.toggle('desc', !asc);

    //gets rows of table
    var rowLength = table.rows.length;
    sortedtransactions = []

    //loops through rows    
    for (i = 1; i < rowLength; i++){

      //gets cells of current row  
      var oCells = table.rows.item(i).cells;
      tempdict = {}
      tempdict["fee"] = +oCells.item(4).textContent;
      tempdict["size"] = +oCells.item(3).textContent;
      tempdict["vin_sz"] = +oCells.item(1).textContent;
      tempdict["vout_sz"] = +oCells.item(2).textContent;
      tempdict["tx_hash"] = oCells.item(0).textContent;
      sortedtransactions.push(tempdict);
    }
    // console.log(sortedtransactions)
    drawCoinGlyph(sortedtransactions);
  }
  
  
  //let blockHash = '000000000000000000021e25d6226b8c40b1016c134838ee1014ef258e9c5da3'; // Replace with current hash
  function fetchBlockData(blockHash) {
    showLoading();  
    if (!blockHash) {
      alert('Please enter a block hash.');
      return;
    }
  
  
    const blockchainInfoUrl = `https://blockchain.info/rawblock/${blockHash}`;
    const blockCypherUrl = `https://api.blockcypher.com/v1/btc/main/blocks/${blockHash}`;
    const table = document.getElementById('transactionsTable');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
  
    fetch(blockchainInfoUrl)
      .then(response => response.json())
      .then(blockData => {
        const formattedTime = new Date(blockData.time * 1000).toLocaleString();
        document.getElementById('blockHash').textContent = blockData.hash;
        document.getElementById('blockTime').textContent = formattedTime;
        document.getElementById('blockHeight').textContent = blockData.height;
        document.getElementById('blockSize').textContent = blockData.size;
      })
      .catch(error => {
        console.error('Error fetching block data:', error);
      });
  
  
    fetch(blockCypherUrl)
      .then(response => response.json())
      .then(blockCypherData => {
        const relayed_by = blockCypherData.relayed_by ? blockCypherData.relayed_by.split(':')[0] : 'Unknown';
        document.getElementById('blockRelayedBy').textContent = relayed_by;
      })
      .catch(error => {
        console.error('Error fetching relayed_by data:', error);
      });
  
      fetch(blockchainInfoUrl)
      .then(response => response.json())
      .then(blockData => {
       
        const tbody = table.querySelector('tbody');
        
        console.log(blockData.tx)
  
        blockData.tx.forEach(transaction => {
          const row = tbody.insertRow();
          row.innerHTML = `
          <td><a href="/project/pages/transaction_page.html?hash=${encodeURIComponent(transaction.hash)}">${transaction.hash}</a></td>

              <td>${transaction.vin_sz}</td>
              <td>${transaction.vout_sz}</td>
              <td>${transaction.size}</td>
              <td>${transaction.fee}</td>
          `;
        });
  
        hideLoading()
        document.querySelectorAll('.sortable').forEach((header, index) => {
          header.addEventListener('click', () => {
            const isAscending = header.classList.contains('asc');
            sortTable(table, index + 1, !isAscending);
          });
        });
      })
      .catch(error => {
        console.error('Error fetching block data:', error);
      });
      addSortingListeners();
    }

    async function getBlockJSON(hash) {
      let url = `https://blockchain.info/rawblock/${hash}`;
      // let obj = null;
      try {
          return await (await fetch(url)).json();
      } catch(e) {
          console.log('error');
      }
  }

  async function getAllTransactions(hash) {
    showLoading();
    block  = await getBlockJSON(hash);
      var AllTransactions = []
      for(i in block.tx) {
          tempdict = {}
          tempdict["fee"] = block.tx[i].fee;
          tempdict["size"] = block.tx[i].size;
          tempdict["vin_sz"] = block.tx[i].vin_sz;
          tempdict["vout_sz"] = block.tx[i].vout_sz;
          tempdict["tx_hash"] = block.tx[i].hash;
          AllTransactions.push(tempdict);
      }
      hideLoading();
      return AllTransactions;
  }

  function moveToTransactionPage(tx_hash) {
    console.log(tx_hash);
    window.location.href = `/project/pages/transaction_page.html?hash=${encodeURIComponent(tx_hash)}`;
  }
  

  function drawCoinGlyph(data) {
    var svg_coin_glyph = d3.select('#coin_glyph_svg');
    svg_coin_glyph.selectAll('g').remove();
    var tooltip = d3.select(".tooltip")
            
    width = +svg_coin_glyph.style('width').replace('px','')-10;
    height = +svg_coin_glyph.style('height').replace('px','');

    padding = 0.1*width;
    radius = (width-padding)/20-10;

    // svg_coin_glyph.append().enter('rect')
    // .width(padding + radius*4)
    // .height(radius*2)
    // .x(0)
    // .y(0)
    // .attr("class", "trans-rect");
    svg_coin_glyph
    .append("rect")
      .attr("x", 0)
      .attr("y", 100-radius)
      .attr("height", radius*2)
      .attr("width", (radius*4)+(padding/3))
      .attr("fill", "pink")
      .attr("stroke", "black")
      .attr("class", "trans-rect");

      svg_coin_glyph
    .append("text")
      .attr("x", radius)
      .attr("y", 100)
      .attr("text-achor", 'middle')
      .text(`Trasactions:-`)
      .style("font-size", radius*0.5);

      svg_coin_glyph
      .append("text")
        .attr("x", radius*2)
        .attr("y", 100+(radius*1/2))
        .attr("text-achor", 'middle')
        .text(`${data.length}`)
        .style("font-size", radius*0.5);
  

    
    if(data.length > 8) {
      data = data.slice(0,8);
    }

    
    var v_in_max = d3.max(data, d=>d.vin_sz);
    var v_out_max = d3.max(data, d=>d.vout_sz);
    var fee_max = d3.max(data, d=>d.fee);
    var fee_min = d3.min(data, d=>d.fee);
    var size_max = d3.max(data, d=>d.size);
    var size_min = d3.min(data, d=>d.size);

    rect_size = d3.scaleLinear().domain([size_min, size_max]).range([0.1*radius, 0.7*radius])

    colorband = d3.scaleLinear().domain([fee_min,fee_max])
    .range(["#fce3c7", "#ffb669"])

    const glyphs = svg_coin_glyph.selectAll('g')
                .data(data)
                .enter()
                .append('g')
                .attr('transform', (d,i) => `translate(${padding + radius*4  + i*padding},100)`)
                // .attr('onclick', (d) => `moveToTransactionPage(${d.tx_hash})`)
                .on("click", function(event, d) {
                  moveToTransactionPage(d.tx_hash)})
                .on("mouseover", function(event,d) {
                    tooltip.style("opacity", 0.8);
                    tooltip.html(`Hash: ${d.tx_hash.slice(0,5)}.....${d.tx_hash.slice(-5)} </br> In Addr: ${d.vin_sz} </br> Out Addr: ${d.vout_sz} 
                    </br> TxFee (satoshi): ${d.fee} satoshi </br> TxSize (bytes): ${d.size} bytes`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 80) + "px")
                })
                .on("mouseout", function(event, d) {
                    tooltip.style("opacity", 0)
                    .style("left", "0px")
                    .style("top", "0px");
                  });

    glyphs.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', radius+(radius/5))
            .style('fill', 'white')
            .style('stroke','black')
            .attr("class", "coinGlyph border");

    var arcGen1 = d3.arc()
            .innerRadius(radius)
            .outerRadius(radius + (radius/5))
            .startAngle(d=>(3*Math.PI/2 - Math.PI/5*d.vin_sz/(v_in_max*2)))
            .endAngle(d=>(3*Math.PI/2 + Math.PI/5*d.vin_sz/(v_in_max*2)));
    
    glyphs.append("path")
    .attr("d", arcGen1)
    .attr("fill", "pink")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("class", "coinGlyph vout");

    var arcGen2 = d3.arc()
            .innerRadius(radius)
            .outerRadius(radius + (radius/5))
            .startAngle(d=>(Math.PI/2 - Math.PI/5*d.vout_sz/(v_out_max*2)))
            .endAngle(d=>(Math.PI/2 + Math.PI/5*d.vout_sz/(v_out_max*2)));
    
    glyphs.append("path")
    .attr("d", arcGen2)
    .attr("fill", "pink")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("class", "coinGlyph vin");


    glyphs.append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r',radius)
                .style('fill', d=>colorband(d.fee))
                .style('stroke','black')
                .attr("class", "coinGlyph fee");

    glyphs.append('rect')
                .attr('x', d=>-rect_size (d.size)/2)
                .attr('y', d=>-rect_size (d.size)/2)
            //     .attr('r',d=>0.01*d.size)
                .attr('width', d=>rect_size (d.size))
                .attr('height', d=>rect_size (d.size))
                .attr("class", "coinGlyph size")
                .style('fill', 'white')
                .style('stroke','black');


    
}

function drawAddressHistogram(data) {
  var svg_add_hist = d3.select("#address_hist");
  width = +svg_add_hist.style('width').replace('px','')-10;
  height = +svg_add_hist.style('height').replace('px','')-30;

  for(i in data) {
    data[i]["addresses"] = block.tx[i].vin_sz + block.tx[i].vout_sz;
  }

  // console.log(data);

  var x = d3.scaleLinear()
      .domain([0, d3.max(data, d=>d.addresses)])
      .range([0, width-40]);
  svg_add_hist.append("g")
  .attr("transform", "translate(30," + (height-10) + ")")
      .call(d3.axisBottom(x));

      var histogram = d3.histogram()
      .value(function(d) { return d.addresses; }) 
      .domain(x.domain())  
      .thresholds(x.ticks(50)); 

      var bins = histogram(data);

  // Y axis: scale and draw:
  var y = d3.scaleLinear()
      .range([height-30, 0]);
      y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
      svg_add_hist.append("g")
      .attr("transform", "translate(30, 20)")
      .call(d3.axisLeft(y));

    

      svg_add_hist.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + (x(d.x0)+30) + "," + (y(d.length)+20) + ")"; })
        .attr("width", function(d) { return x(d.x1) - x(d.x0) ; })
        .attr("height", function(d) { return height -30 - y(d.length); })
        .style("fill", "pink")
        .style("stroke", "black")

        svg_add_hist.append('text')
        .attr('class','yaxisLabel')
        .attr('y',height-210)
        .attr('x',40)
        .attr('text-anchor','middle')
        .text("Transactions");
        svg_add_hist.append('text')
        .attr('class','xaxisLabel')
        .attr('text-anchor','middle')
        .attr('x',width/2)
        .attr('y',height+20)
        .text("Addresses");


      //   const brush = d3.brushX()
      // .extent([[0,0], [width, height]])
      // .on("brush", brushed)
      // .on("end", brushended);
addBrushingToHistogram(svg_add_hist, x, data, d => d.addresses); // For address histogram

}

function drawFeeHistogram(data) {
  var svg_fee_hist = d3.select("#fee_hist");
  width = +svg_fee_hist.style('width').replace('px','')-10;
  height = +svg_fee_hist.style('height').replace('px','')-30;

  var x = d3.scaleLinear()
    .domain([0, d3.max(data, d=>d.fee)])
    .range([0, width-40]);
  svg_fee_hist.append("g")
    .attr("transform", "translate(30," + (height-10) + ")")
      .attr("class", "xaxis")
    .call(d3.axisBottom(x));

    svg_fee_hist.select(".xaxis").selectAll("text").attr("transform", `rotate(15)`).attr("text-anchor", "start")

    var histogram = d3.histogram()
      .value(function(d) { return d.fee; })  
      .domain(x.domain()) 
      .thresholds(x.ticks(50));

      var bins = histogram(data);

  // Y axis: scale and draw:
  var y = d3.scaleLinear()
      .range([height-30, 0]);
      y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
      svg_fee_hist.append("g")
      .attr("transform", "translate(30, 20)")
      .call(d3.axisLeft(y));


      svg_fee_hist.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + (x(d.x0)+30) + "," + (y(d.length)+20) + ")"; })
        .attr("width", function(d) { return x(d.x1) - x(d.x0) ; })
        .attr("height", function(d) { return height -30 - y(d.length); })
        .style("fill", "pink")
        .style("stroke", "black")

        svg_fee_hist.append('text')
        .attr('class','yaxisLabel')
        .attr('y',height-210)
        .attr('x',40)
        .attr('text-anchor','middle')
        .text("Transactions");
        svg_fee_hist.append('text')
        .attr('class','xaxisLabel')
        .attr('text-anchor','middle')
        .attr('x',width/2)
        .attr('y',height+26)
        .text("TxSize(bytes)");

addBrushingToHistogram(svg_fee_hist, x, data, d => d.fee); // For fee histogram

}

function drawSizeHistogram(data) {
  var svg_size_hist = d3.select("#size_hist");
  width = +svg_size_hist.style('width').replace('px','')-10;
  height = +svg_size_hist.style('height').replace('px','')-30;

  var x = d3.scaleLinear()
    .domain([0, d3.max(data, d=>d.size)])
    .range([0, width-40]);
  svg_size_hist.append("g")
  .attr("transform", "translate(30," + (height-10) + ")")
    .call(d3.axisBottom(x));

    var histogram = d3.histogram()
      .value(function(d) { return d.size; })
      .domain(x.domain()) 
      .thresholds(x.ticks(50)); 

      var bins = histogram(data);

  // Y axis: scale and draw:
  var y = d3.scaleLinear()
  .range([height-30, 0]);
      y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
      svg_size_hist.append("g")
      .attr("transform", "translate(30, 20)")
      .call(d3.axisLeft(y));


      svg_size_hist.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + (x(d.x0)+30) + "," + (y(d.length)+20) + ")"; })
        .attr("width", function(d) { return x(d.x1) - x(d.x0) ; })
        .attr("height", function(d) { return height -30 - y(d.length); })
        .style("fill", "pink")
        .style("stroke", "black")

        svg_size_hist.append('text')
        .attr('class','yaxisLabel')
        .attr('y',height-210)
        .attr('x',40)
        .attr('text-anchor','middle')
        .text("Transactions");
        svg_size_hist.append('text')
        .attr('class','xaxisLabel')
        .attr('text-anchor','middle')
        .attr('x',width/2)
        .attr('y',height+20)
        .text("TxFee(Satoshi)");

        addBrushingToHistogram(svg_size_hist, x, data, d => d.size); // For size histogram

}

function addBrushingToHistogram(svg, xScale, data, histogramFunction) {
  const brush = d3.brushX()
      .extent([[0, 0], [width, height]])
      .on("brush end", brushed);

  svg.append("g")
      .attr("class", "brush")
      .call(brush);

  function brushed(event) {
      if (event.selection) {
          const [x0, x1] = event.selection.map(xScale.invert);

          const filteredData = data.filter(d => {
              const value = histogramFunction(d);
              return value >= x0 && value <= x1;
          });
          setTimeout(() => {
            // Redraw the coin glyphs
            d3.select('#coin_glyph_svg').selectAll('*').remove();
            drawCoinGlyph(filteredData);

            // Redraw the address histogram
            d3.select("#address_hist").selectAll('*').remove();
            drawAddressHistogram(filteredData);

            // Redraw the fee histogram
            d3.select("#fee_hist").selectAll('*').remove();
            drawFeeHistogram(filteredData);

            // Redraw the size histogram
            d3.select("#size_hist").selectAll('*').remove();
            drawSizeHistogram(filteredData);          
          }, 1000); // Adjust the delay time

      }
  }
}
  
    document.addEventListener('DOMContentLoaded', () => {
      const urlParams = new URLSearchParams(window.location.search);
      console.log(urlParams.get('hash'));
      let blockHash=urlParams.get('hash') ||'000000000000000000021e25d6226b8c40b1016c134838ee1014ef258e9c5da3';

      let promise = new Promise(function(x,y) {
        var data = getAllTransactions(blockHash);
        x(data);
      })
      promise.then(function(value) {
              // console.log(value);
              drawCoinGlyph(value);
              drawAddressHistogram(value)
              drawFeeHistogram(value)
              drawSizeHistogram(value)
      });
      fetchBlockData(blockHash); 

      
  
    });