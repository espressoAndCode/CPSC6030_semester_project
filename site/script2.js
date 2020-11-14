(async function () {
    const allStockData = await d3.csv("best5_stocks.csv");
    const allStoryData = await d3.csv("best5_stories.csv");
    const linkData = await d3.csv("links.csv");


    const nodeMap = {
        'AAPL':     {node:0, name:'AAPL'},
        'MSFT':     {node:1, name:'MSFT'},
        'BAC':      {node:2, name:'BAC'},
        'AMZN':     {node:3, name:'AMZN'},
        'TSLA':     {node:4, name:'TSLA'},
        'news':     {node:5, name:'News'},
        'opinion':  {node:6, name:'Opinion'}
    }

    // const data = allStockData.filter(d => d.symbol === "TSLA");
    const data = allStockData;
    // console.log("allStockData: ", allStockData);

    const allKeys = allStockData.map(item => item.symbol).filter((val, idx, self) => self.indexOf(val) === idx);
    // const allStoryKeys = allStoryData.map(item => item.category).filter((val, idx, self) => self.indexOf(val) === idx);

    console.log("allStockData: ", allStockData);
    console.log("allStoryData: ", allStoryData[1]);
    console.log("allKeys: ", allKeys);

    filteredData = {};
    filteredArray = [];
    selectedKeys = ["AAPL"];
    // selectedKeys = allKeys;

    var colorScheme = d3.scaleOrdinal()
                .domain(filteredArray)
                .range(d3.schemeSet1);

    for (item in data) {
        console.log("item.symbol: ", data[item].symbol);
        if ( selectedKeys.includes(data[item].symbol) ) {
            if (data[item].symbol in filteredData){
                filteredData[data[item].symbol].push({date: data[item].date, volume: data[item].volume});
            } else {
                filteredData[data[item].symbol] = [{date: data[item].date, volume: data[item].volume}];
            }
        }
    }

    for (item in filteredData) {
        filteredArray.push({id:item, values: filteredData[item]})
    }

    // console.log("allStoryKeys: ", allStoryKeys);
    // var combinedKeys = selectedKeys.concat(['news','opinion']);
    // var nodeMap = {};
    var nodes = [];
    var links = [];
    // for (key in combinedKeys) {
    //     if (!(combinedKeys[key] in nodeMap)){
    //         nodeMap[combinedKeys[key]] = {
    //             "node": parseInt(key),
    //             "name": combinedKeys[key]
    //         }
    //     }
    // }

    for (key in nodeMap){
        if ( selectedKeys.indexOf(key) != -1 ){
            nodes.push(nodeMap[key]);
        }
    }

    console.log("selectedKeys: ", selectedKeys);

    // for (story in allStoryData) {
    //     console.log("allStoryData[story].ticker: ", allStoryData[story].ticker);
    //     if(selectedKeys.indexOf(allStoryData[story].ticker) != -1){
    //         // links.push(allStoryData[story].id);
    //         links.push({"source":parseInt(nodeMap[allStoryData[story].category].node),
    //                     "target":parseInt(nodeMap[allStoryData[story].ticker].node),
    //                     "value":allStoryData[story].id})
    //     }
    // }

    for (link in linkData) {
        // console.log("link: ", linkData[link]);
        if(selectedKeys.indexOf(linkData[link].target) != -1){
            // linkData.push(linkData[link].id);
            var item = {"source":parseInt(nodeMap[linkData[link].source].node),
                        "target":parseInt(nodeMap[linkData[link].target].node),
                        "value":linkData[link].value};
            links.push(item);
        }
    }















    
    
    
    console.log("nodeMap: ", nodeMap);
    console.log("nodes: ", nodes);
    console.log("links: ", links);

// console.log("filteredData: ", filteredData);
console.log("filteredArray: ", filteredArray);



    // var colorScheme = d3.scaleOrdinal(d3.schemeCategory10);

    const windowInnerWidth  = document.documentElement.clientWidth * 0.9;
    const windowInnerHeight = document.documentElement.clientHeight * 0.5;
    const margin = { top: 50, right: 20, bottom: windowInnerHeight * 0.15, left: 100 };
    const margin2 = { top: windowInnerHeight * 0.9, right: 20, bottom: 30, left: 100 };
    const width = windowInnerWidth - margin.left - margin.right;
    const height = windowInnerHeight - margin.top - margin.bottom;
    const height2 = windowInnerHeight - margin2.top - margin2.bottom;


    var svg = d3.select("#graph")
                .append("svg")
                .attr("width", windowInnerWidth)
                .attr("height", windowInnerHeight);

  

    var parseDate = d3.timeParse("%Y-%m-%d");

    var x = d3.scaleTime().range([0, width]),
        x2 = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        y2 = d3.scaleLinear().range([height2, 0]);

    var xAxis = d3.axisBottom(x),
        xAxis2 = d3.axisBottom(x2),
        yAxis = d3.axisLeft(y);

    var brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on("brush end", brushed);

    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);
        
    var line = d3.line()
        // .curve(d3.curveCardinal.tension(0.5))
        .x(function (d) { return x(parseDate(d.date)); })
        .y(function (d) { return y(parseInt(d.volume)); });

    var line2 = d3.line()
        // .curve(d3.curveCardinal.tension(0.5))
        .x(function (d) { return x2(parseDate(d.date)); })
        .y(function (d) { return y2(parseInt(d.volume)); });

    // var clip = svg.append("defs").append("svg:clipPath")
    //     .attr("id", "clip")
    //     .append("svg:rect")
    //     .attr("width", width)
    //     .attr("height", height)
    //     .attr("x", 0)
    //     .attr("y", 0);


    var Line_chart = svg.selectAll("lines")
        .data(filteredArray)
        .enter()
        .append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        // .attr("clip-path", "url(#clip)");


    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.selectAll("lines")
        .data(filteredArray)
        .enter()
        .append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");



    //   if (error) throw error;

    console.log("data: ", data);

    x.domain(d3.extent(data, function (d) { return parseDate(d.date); }));
    y.domain([0, d3.max(data, function (d) { return parseInt(d.volume); })]);
    x2.domain(x.domain());
    y2.domain(y.domain());


    focus.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    focus.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);


    Line_chart.append("path")
        
        .attr("class", "line")
        .style("stroke", d => colorScheme(d.id))
        .attr("d", function(d) { return line(d.values); });


    context.append("path")
  
        .attr("class", "line")
        .attr("d", function(d) { return line2(d.values); });




    context.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    context.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, x.range());

    svg.append("rect")
        .attr("class", "zoom")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom);


      console.log(data);


    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || x2.range();
        x.domain(s.map(x2.invert, x2));
        Line_chart.select(".line")
                // .attr("d", line);
                .attr("d", function(d) { return line(d.values); });
        focus.select(".axis--x").call(xAxis);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));
    }

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        x.domain(t.rescaleX(x2).domain());
        Line_chart.select(".line")
                    // .attr("d", line);
                    .attr("d", function(d) { return line(d.values); });
        focus.select(".axis--x").call(xAxis);
        context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
    }

    async function renderSwatches(el) {
        // Get the value of the "swatches" notebook cell, which is the function we want, which returns a DOM element
        const module = new Runtime().module(d3_colorLegend);
        const swatches = await module.value("swatches");
        
        // Finally, call `swatches` with our options and append it to the container
        const element = swatches({color, marginLeft: margin.left, columns: "180px"});
        el.appendChild(element);
      }

// SANKEY

var units = "Widgets";

// set the dimensions and margins of the graph
// var margin = {top:  windowInnerHeight + 10, right: 10, bottom: 10, left: 10},
//     width = windowInnerWidth,
//     height = windowInnerHeight;

// format variables
var formatNumber = d3.format(",.0f"),    // zero decimal places
    format = function(d) { return formatNumber(d) + " " + units; },
    color = d3.scaleOrdinal(d3.schemeCategory10);

// append the svg object to the body of the page
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

// Set the sankey diagram properties
var sankey = d3.sankey()
    .nodeWidth(36)
    .nodePadding(40)
    .size([width, height]);

var path = sankey.link();


///////////////////

  sankey
      .nodes(nodes)
      .links(links)
      .layout(32);

// add in the links
  var link = svg.append("g").selectAll(".link")
      .data(links)
    .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .sort(function(a, b) { return b.dy - a.dy; });

// add the link titles
  link.append("title")
        .text(function(d) {
    		return d.source.name + " → " + 
                d.target.name + "\n" + format(d.value); });

// add in the nodes
  var node = svg.append("g").selectAll(".node")
      .data(nodes)
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { 
		  return "translate(" + d.x + "," + d.y + ")"; })
      .call(d3.drag()
        .subject(function(d) {
          return d;
        })
        .on("start", function() {
          this.parentNode.appendChild(this);
        })
        .on("drag", dragmove));

// add the rectangles for the nodes
  node.append("rect")
      .attr("height", function(d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      .style("fill", function(d) { 
		  return d.color = color(d.name.replace(/ .*/, "")); })
      .style("stroke", function(d) { 
		  return d3.rgb(d.color).darker(2); })
    .append("title")
      .text(function(d) { 
		  return d.name + "\n" + format(d.value); });

// add in the title for the nodes
  node.append("text")
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) { return d.name; })
    .filter(function(d) { return d.x < width / 2; })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");

// the function for moving the nodes
  function dragmove(d) {
    d3.select(this)
      .attr("transform", 
            "translate(" 
               + d.x + "," 
               + (d.y = Math.max(
                  0, Math.min(height - d.dy, d3.event.y))
                 ) + ")");
    sankey.relayout();
    link.attr("d", path);
  }









})();