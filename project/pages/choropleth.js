let svg;
const margin = { top: 20, right: 20, bottom: 50, left: 50 };
const width = 1100 - margin.left - margin.right;
const height = 700 - margin.top - margin.bottom;


document.addEventListener('DOMContentLoaded', function () {

   const stateCountDict = {};

    var lowColor = '#F9ECD6'
    var highColor = '#C39E65'

    var projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale([1000]);

    var path = d3.geoPath()
    .projection(projection);


    svg = d3.select('#myDataVis').append('svg')
   .attr('width', width + margin.left + margin.right)
   .attr('height', height + margin.top + margin.bottom)
   .append('g')
   .attr('transform', `translate(${margin.left},${margin.top})`);

    d3.csv("../data/ipGeolocation.csv", function(data) {
        data.forEach(d => {
            if (stateCountDict.hasOwnProperty(d.state)) {
                stateCountDict[d.state] += +d.count;
            } else {
                stateCountDict[d.state] = +d.count;
            }
        });
        console.log("statecount:",stateCountDict);

        var dataArray = [];
        for (const state in stateCountDict) {
            if (stateCountDict.hasOwnProperty(state)) {
                dataArray.push(stateCountDict[state]);
            }
        }
        var minVal = d3.min(dataArray)
        var maxVal = d3.max(dataArray)
        var ramp = d3.scaleThreshold().domain([0,3,25,50,100,250,500,1000]).range(["#ffffe5","#fff7c2","#fed777","#feac3b","#f07c1a","#dc5f0c","#ac3e03","#662506"])
        console.log(minVal);

        d3.json("../data/us-states.json", function(json) {

            for (const state in stateCountDict) {
        
              var dataState = state;
              var dataValue = stateCountDict[state];
              for (var j = 0; j < json.features.length; j++) {
                var jsonState = json.features[j].properties.name;
        
                if (dataState == jsonState) {
                  json.features[j].properties.value = dataValue;
                  break;
                }
                
              }
            }
            var div = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            svg.selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("d", path)
                .style("stroke", "white")
                .style("stroke-width", "2")
                .style("fill", function(d) { return ramp(d.properties.value ? d.properties.value : 0); })
                .attr("class", "state")
                .on("mouseover", function(d) {
                    d3.select(this)
                    .style("opacity", 1)
                    .style("stroke", "black");
                    tooltip.style("opacity", 1)
                    .text(d.properties.name + ": " + (d.properties.value ? d.properties.value : 0))
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px")
                })
                .on("mousemove", function() {
                    tooltip.style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 25) + "px");
                })
                .on("mouseleave", function() {
                    d3.select(this)
                    .style("opacity", 1)
                    .style("stroke", "white");
                    tooltip.style("opacity", 0);
                });

                var tooltip = d3.select("#myDataVis")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

                let legend = svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(325,400)");

                function Legend(colorScale) {
                    let legendd = [0, 3, 25, 50, 100, 250, 500, 1000];
                    let legend = svg.append("g")
                        .attr("class", "legend")
                        .attr("transform", "translate(0,650)");
            
                    let legendRectSize = 17.5;
                    let legendSpacing = 15;
            
                    let legendEntries = legend.selectAll('.legend-entry')
                        .data(legendd)
                        .enter()
                        .append('g')
                        .attr('class', 'legend-entry')
                        .attr('transform', function(d, i) {
                            let height = legendRectSize + legendSpacing;
                            let horz = i * (legendRectSize + legendSpacing) + 315;
                            let vert = 0;
                            return 'translate(' + horz + ',' + vert + ')';
                        });
            
                    legendEntries.append('rect')
                        .attr('width', legendRectSize)
                        .attr('height', legendRectSize)
                        .attr('y', -25)
                        .attr('x', 25)
                        .style('fill', function(d) {
                            return colorScale(d);
                        })
                        .style('stroke', function(d) {
                            return colorScale(d);
                        });
            
                    legendEntries.append('text')
                        .attr('x', function(d) {
                            if(d===0 || d===3){
                                return legendRectSize+13;   
                            }
                            if(d===25 || d===50){
                                return legendRectSize+8;   
                            }
                            return legendRectSize+3;
                        })
                        .attr('y', legendRectSize-5)
                        .text(function(d) {
                            if(d===1000){
                                return "1000+";
                            }
                            return d;
                        });
                  }

                  Legend(ramp);


        });

    });

});



