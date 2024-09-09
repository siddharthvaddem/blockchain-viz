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
  //let transactionHash = '9d02ada431efd9fa94b96e419a1a5a3bf03ad0206bc06b7bcff4256d0ce11e0d'; // Replace with current hash
 async function fetchaAddressData() {
    
    //let addressHash = document.getElementById('searchInput').value.trim() || 'bc1q9hp0dcc3zwyqjq5yw76lhh32ku52m9854mjs07';
    const urlParams = new URLSearchParams(window.location.search);
    console.log(urlParams.get('hash'));
    let addressHash=urlParams.get('hash') ||  'bc1q9hp0dcc3zwyqjq5yw76lhh32ku52m9854mjs07';
    if (!addressHash) {
      alert('Please enter an address hash.');
      return;
    }
    showLoading();
  
    const blockchainInfoUrl = `https://blockchain.info/rawaddr/${addressHash}`;
      const table = document.getElementById('transactionsTable');
      
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
  
    
    
  try{
    const response =  await fetch(blockchainInfoUrl);
          const addressData =  await response.json();

          
        const satoshisPerBitcoin = 100000000;
        const final_balance = addressData.final_balance / satoshisPerBitcoin;
        console.log(addressData.txs)
        document.getElementById('addressHash').textContent = addressData.address;
        document.getElementById('addressBalance').textContent = `${final_balance} BTC`
        document.getElementById('totalTransactions').textContent = addressData.n_tx;

        console.log(addressData.txs);
        plotTransactionHistogram(addressData.txs);

        addressData.txs.forEach(transaction => {

            const formattedTime= formatTime(transaction.time);
            const row = tbody.insertRow();
            row.innerHTML = `
            <td><a href="/project/pages/transaction_page.html?hash=${encodeURIComponent(transaction.hash)}">${transaction.hash}</a></td>

                <td>${transaction.vin_sz}</td>
                <td>${transaction.vout_sz}</td>
                <td>${formattedTime}</td>
               
            `;
          });
          hideLoading();
  
      } catch (error) {
        console.error('Error fetching address data:', error);
        alert('Failed to fetch address data. Please check the console for more details.');
    }
  }

//   function plotTransactionHistogram(transactions) {
//     // Extract transaction times and format them
//     const transactionTimes = transactions.map(tx => formatTime(tx.time));
    
//     // Create an object to count transactions per day
//     const transactionsPerDay = {};
//     transactionTimes.forEach(time => {
//         if (time in transactionsPerDay) {
//             transactionsPerDay[time]++;
//         } else {
//             transactionsPerDay[time] = 1;
//         }
//     });

//     // Convert transactionsPerDay object into an array of objects
//     const data = Object.entries(transactionsPerDay).map(([date, count]) => ({ date, count }));

//     // Sort data by date
//     data.sort((a, b) => new Date(a.date) - new Date(b.date));

//     // Calculate the range of dates for x-axis
//     const dateRange = data.map(d => new Date(d.date));
//     const minDate = new Date(Math.min.apply(null, dateRange));
//     const maxDate = new Date(Math.max.apply(null, dateRange));

//     // Define chart dimensions
//     const margin = { top: 20, right: 30, bottom: 50, left: 60 };
//     const width = 800 - margin.left - margin.right;
//     const height = 400 - margin.top - margin.bottom;

//     // Append SVG to the designated div
//     const svg = d3.select("#address_hist")
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", height + margin.top + margin.bottom)
//         .append("g")
//         .attr("transform", `translate(${margin.left},${margin.top})`);

//     // Define scales
//     const x = d3.scaleBand()
//         .domain(data.map(d => d.date))
//         .range([0, width])
//         .padding(0.1);

//     const y = d3.scaleLinear()
//         .domain([0, d3.max(data, d => d.count)])
//         .nice()
//         .range([height, 0]);

//     // Draw x-axis
//     svg.append("g")
//         .attr("transform", `translate(0,${height})`)
//         .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")))
//         .selectAll("text")
//         .style("text-anchor", "end")
//         .attr("dx", "-0.8em")
//         .attr("dy", "-0.15em")
//         .attr("transform", "rotate(-65)");

//     // Draw y-axis
//     svg.append("g")
//         .call(d3.axisLeft(y));

//     // Draw bars
//     svg.selectAll("rect")
//         .data(data)
//         .enter().append("rect")
//         .attr("x", d => x(d.date))
//         .attr("y", d => y(d.count))
//         .attr("width", x.bandwidth())
//         .attr("height", d => height - y(d.count))
//         .attr("fill", "steelblue");
// }

function plotTransactionHistogram(transactions) {
    // Create an object to count transactions per day
    const transactionsPerDay = {};

    transactions.forEach(transaction => {
        const formattedTime = formatTime(transaction.time); // Format the transaction time
        const dateKey = formattedTime.slice(0, 10); // Extract only the year-month-day part

        if (dateKey in transactionsPerDay) {
            transactionsPerDay[dateKey]++;
        } else {
            transactionsPerDay[dateKey] = 1;
        }
    });

    // Convert transactionsPerDay object into an array of objects
    const data = Object.entries(transactionsPerDay).map(([date, count]) => ({ date, count }));

    // Sort data by date
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Define chart dimensions and margins
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Append SVG to the designated div
    const svg = d3.select("#address_hist")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.date))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .nice()
        .range([height, 0]);

    // Draw x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "xaxis")
        .call(d3.axisBottom(x));

    // Draw y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.select(".xaxis").selectAll("text").attr("transform", `rotate(30)`).attr("text-anchor", "start")

    // Draw bars
    svg.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("x", d => x(d.date))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr('fill', 'rgba(213, 165, 108, 0.8)');


        svg.append('text')
        .attr('class','yaxisLabel')
        .attr('y',height/2 -200)
        .attr('x',-150)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor','middle')
        .text("Number of Transactions");

        svg.append('text')
        .attr('class','xaxisLabel')
        .attr('text-anchor','middle')
        .attr('x',width/2)
        .attr('y',height+55)
        .text("Date");
}

  
  window.onload = function() {
    fetchaAddressData(); 
  };