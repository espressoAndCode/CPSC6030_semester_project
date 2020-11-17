(async function () {
    const allStockData = await d3.csv("best5_stocks.csv");
    const allStoryData = await d3.csv("best5_stories.csv");
    const linkData = await d3.csv("links.csv");


    //   REF  
    // "nodes":[
    //     {"node":0,"name":"node0"},
    //     {"node":1,"name":"node1"}
    // ]

    // "links":[
    //     {"source":0,"target":2,"value":2},
    //     {"source":1,"target":2,"value":2}
    // ]


    // TODOs

    // 2. Link the sankey selection to use only the selected section of the brush

    // 5. Add a legend and onscreen selector for the stocks
    // 7. Add in a visible point on the graph to correspond to the sankey hover
    // 8. fix chart runoff of the left edge

    var minDate = d3.min(allStockData, d => d.date);
    var maxDate = d3.max(allStockData, d => d.date);

    // var minDate = "2019-12-20";
    // var maxDate = "2019-12-31";

    console.log("minDate1: ", minDate);



    const nodeMap = {
        'AAPL': { 'node': 0, 'name': 'AAPL' },
        'AMZN': { 'node': 1, 'name': 'AMZN' },
        'BAC': { 'node': 2, 'name': 'BAC' },
        'MSFT': { 'node': 3, 'name': 'MSFT' },
        'TSLA': { 'node': 4, 'name': 'TSLA' },
        'news': { 'node': 5, 'name': 'News' },
        'opinion': { 'node': 6, 'name': 'Opinion' }
    }

    var nodeIdx = {};

    const data = allStockData;

    // const allKeys = allStockData.map(item => item.symbol).filter((val, idx, self) => self.indexOf(val) === idx);
    const allKeys = ['AAPL','MSFT','BAC','AMZN','TSLA'];

    // console.log("allStockData: ", allStockData);
    // console.log("allStoryData: ", allStoryData[1]);
    // console.log("allKeys: ", allKeys);
    // console.log('linkData: ', linkData);

    filteredData = {};
    filteredArray = [];
    selectedKeys = ['TSLA','MSFT'];
    // selectedKeys = allKeys;

    var colorScheme = d3.scaleOrdinal()
        .domain(['AAPL', 'AMZN', 'BAC', 'MSFT', 'TSLA', 'news', 'opinion'])
        .range(d3.schemeDark2);

    for (item in data) {
        // console.log("item.symbol: ", data[item].symbol);
        if (selectedKeys.includes(data[item].symbol)) {
            if (data[item].symbol in filteredData) {
                filteredData[data[item].symbol].push({ date: data[item].date, volume: data[item].volume });
            } else {
                filteredData[data[item].symbol] = [{ date: data[item].date, volume: data[item].volume }];
            }
        }
    }

    for (item in filteredData) {
        filteredArray.push({ id: item, values: filteredData[item] })
    }

    var nodes = [];
    var links = [];
    count = 0;
    for (key in nodeMap) {
        if (selectedKeys.indexOf(key) != -1) {
            nodeIdx[nodeMap[key].node] = count;
            nodes.push(nodeMap[key]);
            count++;
        }
    }
    nodes.push({ 'node': 5, 'name': 'News' });
    nodeIdx[5] = count;
    nodes.push({ 'node': 6, 'name': 'Opinion' });
    nodeIdx[6] = count + 1;
    console.log("selectedKeys: ", selectedKeys);

    for (link in linkData) {
        // console.log("link: ", linkData[link]);
        if (selectedKeys.indexOf(linkData[link].target) != -1) {
            var item = {
                "source": parseInt(nodeMap[linkData[link].source].node),
                "target": parseInt(nodeMap[linkData[link].target].node),
                "value": linkData[link].value,
                "date": linkData[link].date,
                "title": linkData[link].title,
                "provider": linkData[link].provider,
                "url": linkData[link].url
            };
            links.push(item);
        }
    }

    // console.log("nodeMap: ", nodeMap);
    // console.log("nodes: ", nodes);
    // console.log("links: ", links);
    // console.log("filteredData: ", filteredData);
    // console.log("filteredArray: ", filteredArray);

    const windowInnerWidth = document.documentElement.clientWidth * 0.9;
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
    var formatDate = d3.timeFormat("%Y-%m-%d");

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

    var Line_chart = svg.selectAll("lines")
        .data(filteredArray)
        .enter()
        .append("g")
        .attr("class", "focus")

        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.selectAll("lines")
        .data(filteredArray)
        .enter()
        .append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    var context2 = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    // context.append("g")
    // .attr("class", "axis axis--x")
    // .attr("transform", "translate(0," + height2 + ")")
    // .call(xAxis2);

    // // context.append("g")
    // .attr("class", "brush")
    // .call(brush)
    // .call(brush.move, x.range());

    // console.log("data: ", data);

    x.domain(d3.extent(data, function (d) { return parseDate(d.date); }));
    y.domain([0, d3.max(data, function (d) {
        if (selectedKeys.indexOf(d.symbol) != -1) {
            return parseInt(d.volume);
        }
    })]);
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
        .style("stroke", d => colorScheme(nodeMap[d.id].node))
        .attr("d", function (d) { return line(d.values); });

    context2.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    context2.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, x.range());

    context.append("path")
        .attr("class", "line")
        .attr("d", function (d) { return line2(d.values); });

    svg.append("rect")
        .attr("class", "zoom")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom);


    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || x2.range();
        x.domain(s.map(x2.invert, x2));
        minDate = formatDate(s.map(x2.invert, x2)[0]);
        maxDate = formatDate(s.map(x2.invert, x2)[1]);
        // console.log("minDate2: ", minDate);
        // console.log("maxDate2: ", maxDate);



        Line_chart.select(".line")
            // .attr("d", line);
            .attr("d", function (d) {
                return line(d.values);
            });
        focus.select(".axis--x").call(xAxis);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));
        // if (sankey) {
        //     console.log("updating sankey");
        //     updateSankey(minDate, maxDate);
        //     // sankey.relayout();
        // }

    }

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        x.domain(t.rescaleX(x2).domain());
        Line_chart.select(".line")
            // .attr("d", line);
            .attr("d", function (d) {
                // if (d.id === selectedKeys[0]){
                return line(d.values);
                // }
            });
        focus.select(".axis--x").call(xAxis);
        context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
    }


    // SANKEY

    var units = "Stories";

    // set the dimensions and margins of the graph
    // var margin = {top:  windowInnerHeight + 10, right: 10, bottom: 10, left: 10},
    //     width = windowInnerWidth,
    //     height = windowInnerHeight;

    // format variables
    var formatNumber = d3.format(",.0f"),    // zero decimal places
        format = function (d) { return formatNumber(d) + " " + units; };

    // append the svg object to the body of the page
    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Set the sankey diagram properties
    
    // updateSankey(minDate, maxDate);
    

        var sankey = d3.sankey(nodeIdx)
            .nodeWidth(36)
            .nodePadding(40)
            .size([width, height]);
    
       var path = sankey.link();

       setInterval(minDate, maxDate);
    // update();
        
       
       function setInterval(minDate, maxDate) {
           
           
           sankey
               .nodes(nodes)
               .links(links, minDate, maxDate)
               .layout(8);

            // console.log(sankey);

            updateSankey(sankey);
}







            
function updateSankey(graph){
        // add in the links
        svg.selectAll(".link").remove();

        var link = svg.append("g").selectAll(".link")
        // .data(links, d => (d.date >= minDate) && (d.date <= maxDate))
        .data(links)
        .enter()
        .append("a")
        .attr("target", "_blank")
        .attr("xlink:href", d => d.url)
        .append("path")
        .attr("class", "link")
        
        .attr("d", path)
        .style("stroke-width", function (d) { return Math.max(1, d.dy); })
        .sort(function (a, b) { return b.dy - a.dy; });
        // .exit().remove();
            
            // link.append("a")
            // .attr("xlink:href", d => d.url);
            
            // add the link titles
            link.append("title")
            .text(function (d) {
                return d.source.name + " : " + d.target.name + "\n" +
                        d.provider + ", " + d.date +"\n"
                + '"'+d.title+'"';
            });

            // link.exit().remove();








svg.selectAll(".node").remove();
        // add in the nodes
        var node = svg.append("g").selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
            
            // add the rectangles for the nodes
            node.append("rect")
            .attr("height", function (d) { return d.dy; })
            .attr("width", sankey.nodeWidth())
            //   .style("fill", function(d) { 
                //       return d.color = color(d.name.replace(/ .*/, "")); })
                .style("fill", d => colorScheme(d.node))
                //   .style("stroke", function(d) { 
                    // 	  return d3.rgb(d.color).darker(2); })
                    .append("title")
                    .text(function (d) {
                        return d.name + "\n" + format(d.value);
                    })
                    .exit().remove();

        // add in the title for the nodes
        node.append("text")
            .attr("x", -6)
            .attr("y", function (d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function (d) { return d.name; })
            .filter(function (d) { return d.x < width / 2; })
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");

        // node.exit().remove();



        }


 update =        () => {
    //  svg.remove();
    //  svg.selectAll(".link").remove();
    //  svg.selectAll(".node").remove();
    // setInterval(minDate, maxDate);
    setInterval("2019-12-20", "2019-12-31");
}

        
    })();

