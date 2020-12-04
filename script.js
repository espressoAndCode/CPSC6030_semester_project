// This script is part of a project for CPSC6030 Data Visualization
// at Clemson University, Fall 2020.

// Thanks to the following repos for some great ideas and code to get us going!

// https://bl.ocks.org/LemoNode/a9dc1a454fdc80ff2a738a9990935e9d
// https://bl.ocks.org/EfratVil/92f894ac0ba265192411e73f633a3e2f
// https://bl.ocks.org/d3noob/5ba21a90a721cb19a47ff14c9513e43a



Promise.all([
  d3.csv("best5_stocks.csv"),
  d3.csv("links.csv"),
]).then(function (files) {

  var data = files[0];
  var linkData = files[1];

  const windowInnerWidth = document.documentElement.clientWidth * 0.9;
  const windowInnerHeight = document.documentElement.clientHeight * 0.4;
  const margin = { top: 50, right: 100, bottom: windowInnerHeight * 0.15, left: 100 };
  const margin2 = { top: windowInnerHeight * 0.9, right: 100, bottom: 30, left: 100 };
  const width = windowInnerWidth - margin.left - margin.right;
  const height = windowInnerHeight - margin.top - margin.bottom;
  const height2 = windowInnerHeight - margin2.top - margin2.bottom;
  const sankeyHeight = windowInnerHeight * 1.5;


  var minDate = d3.min(data, d => d.date);
  var maxDate = d3.max(data, d => d.date);
  var nodes = [];
  var links = [];
  var filteredData = {};
  var filteredArray = [];
  var nodeIdx = {};
  updatingStockSel = 0;
  selector_x_0 = width * 0.98;
  selector_x_1 = width;


  function updateStockSelection() {
    var tickerSelections = document.querySelectorAll("input[name='ticker']:checked");
    selectedKeys = [];
    tickerSelections.forEach((checkbox) => { selectedKeys.push(checkbox.value) });
    ready();
  }

  const nodeMap = {
    'AAPL': { 'node': 0, 'name': 'AAPL' },
    'AMZN': { 'node': 1, 'name': 'AMZN' },
    'BAC': { 'node': 2, 'name': 'BAC' },
    'MSFT': { 'node': 3, 'name': 'MSFT' },
    'TSLA': { 'node': 4, 'name': 'TSLA' },
    'news': { 'node': 5, 'name': 'News' },
    'opinion': { 'node': 6, 'name': 'Opinion' }
  }
  const allKeys = ['AAPL', 'MSFT', 'BAC', 'AMZN', 'TSLA'];

  var colorScheme = d3.scaleOrdinal()
    .domain(['AAPL', 'AMZN', 'BAC', 'MSFT', 'TSLA', 'News', 'Opinion'])
    .range(["#0E79EB", "#19C7D4", "#448C30", "#39403F", "#D90B0B", "#072775", "#F2B366"]);

  var updateLinkData = async () => {
    links = [];
    for (link in linkData) {
      if (selectedKeys.indexOf(linkData[link].target) != -1 &&
        linkData[link].date >= minDate &&
        linkData[link].date <= maxDate) {
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
  };

  const ready = async () => {
    filteredData = {};
    for (item in data) {
      if (selectedKeys.includes(data[item].symbol)) {
        if (data[item].symbol in filteredData) {
          filteredData[data[item].symbol].push({ date: data[item].date, volume: data[item].volume });
        } else {
          filteredData[data[item].symbol] = [{ date: data[item].date, volume: data[item].volume }];
        }
      }
    }

    filteredArray = [];
    for (item in filteredData) {
      filteredArray.push({ id: item, values: filteredData[item] })
    }

    count = 0;
    nodes = [];
    nodeIdx = {};
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

    var updatedLinkData = updateLinkData();

    Promise.all([updatedLinkData])
      .then(() => {
        buildChart();
      })
      .then(() => {
        setInterval(minDate, maxDate);
      })
  }

  // BEGIN D3 AND SANKEY SETUP

  var buildChart = async () => {
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
      .curve(d3.curveCardinal.tension(0.5))
      .x(function (d) { return x(parseDate(d.date)); })
      .y(function (d) { return y(parseInt(d.volume)); });

    var line2 = d3.line()
      .curve(d3.curveCardinal.tension(0.5))
      .x(function (d) { return x2(parseDate(d.date)); })
      .y(function (d) { return y2(parseInt(d.volume)); });

    var clip = svg.append("defs").append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("width", width)
      .attr("height", windowInnerHeight)
      .attr("x", 0)
      .attr("y", 0);

    var Line_chart = svg.selectAll("lines")
      .data(filteredArray)
      .enter()
      .append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .attr("clip-path", "url(#clip)");

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

    x.domain(d3.extent(data, function (d) { return parseDate(d.date); }));
    y.domain([0, d3.max(data, function (d) {
      if (selectedKeys.indexOf(d.symbol) != -1) {
        return parseInt(d.volume);
      }
    })]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -5 )
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Shares Traded per Day");  

    focus.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    focus.append("g")
      .attr("class", "axis axis--y")
      .call(yAxis);

    Line_chart.append("path")
      .attr("class", "line")
      .style("stroke", function (d) {
        return colorScheme(d.id);
      })
      .attr("d", function (d) { return line(d.values); });

    context2.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

    context2.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, [selector_x_0, selector_x_1]);

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
      selector_x_0 = s[0];
      selector_x_1 = s[1];
      x.domain(s.map(x2.invert, x2));
        minDate = formatDate(s.map(x2.invert, x2)[0]);
        maxDate = formatDate(s.map(x2.invert, x2)[1]);
      Line_chart.select(".line")
        .attr("d", function (d) {
          return line(d.values);
        });

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
        .attr("d", function (d) {
          return line(d.values);
        });
      focus.select(".axis--x").call(xAxis);
      context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
    }

  }


  ///////////////////////////////////////////////////////////////////
  //// SANKEY
  var sankey = sankey(nodeIdx)
    .nodeWidth(36)
    .nodePadding(40)
    .size([width, sankeyHeight]);

  function updateSankey() {
    var units = "Stories";
    document.getElementById("sankey").innerHTML = "";


    // format variables
    var formatNumber = d3.format(",.0f"),    // zero decimal places
      format = function (d) { return formatNumber(d) + " " + units; };

    // append the svg object to the body of the page
    var svg2 = d3.select("#sankey").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", sankeyHeight + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    var link = svg2.append("g").selectAll(".link")
      .data(links)
      .enter()
      .append("a")
      .attr("target", "_blank")
      .attr("xlink:href", d => d.url)
      .append("path")
      .attr("class", "link")
      .attr("d", sankey.link(minDate, maxDate))
      .style("stroke-width", function (d) { return Math.max(1, d.dy); })
      .sort(function (a, b) { return b.dy - a.dy; });

    // add the link titles
    link.append("title")
      .text(function (d) {
        return d.source.name + " : " + d.target.name + "\n" +
          d.provider + ", " + d.date + "\n"
          + '"' + d.title + '"';
      });

    // add in the nodes
    var node = svg2.append("g").selectAll(".node")
      .data(nodes, function (d) {
        return d;
      })
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    // add the rectangles for the nodes
    node.append("rect")
      .attr("height", function (d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      // .style("fill", d => colorScheme(d.node))

      .style("fill", function (d) {
        return colorScheme(d.name);
      })
      .append("title")
      .text(function (d) {
        return d.name + "\n" + format(d.value);
      });

    svg2.selectAll("rect")
      .data(nodes)
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

    svg2.selectAll("text")
      .data(nodes)
      .exit().remove();
  }

  var setInterval = async (minDate, maxDate) => {
    document.getElementById("sankey").innerHTML = "";
    var setNodes = sankey.snodes(nodes);
    var setLinks = sankey.slinks(links, minDate, maxDate);

    Promise.all([setNodes, setLinks])
      .then(() => {
        sankey.layout(2)
      })
      .then(() => {
        updateSankey(sankey)
      })
  }


  function sankey() {
    var sankey = {},
      nodeWidth = 24,
      nodePadding = 8,
      size = [1, 1];
    snodes = [],
      slinks = [];

    sankey.nodeWidth = function (_) {
      if (!arguments.length) return nodeWidth;
      nodeWidth = +_;
      return sankey;
    };

    sankey.nodePadding = function (_) {
      if (!arguments.length) return nodePadding;
      nodePadding = +_;
      return sankey;
    };

    sankey.snodes = async (_) => {
      snodes = [];
      if (!arguments.length) return snodes;
      snodes = _;
      return sankey;
    };

    sankey.slinks = async (_, min, max) => {
      if (!arguments.length) return slinks;
      slinks = [];
      for (item in _) {
        if (_[item].date >= min && _[item].date <= max) {
          slinks.push(_[item]);
        }
      }
      return sankey;
    };

    sankey.size = function (_) {
      if (!arguments.length) return size;
      size = _;
      return sankey;
    };

    sankey.layout = async (iterations) => {
      computeNodeLinks();
      computeNodeValues();
      computeNodeBreadths();
      computeNodeDepths(iterations);
      computeLinkDepths();
      return sankey;
    };

    sankey.relayout = function () {
      computeLinkDepths();
      return sankey;
    };

    sankey.link = function (min, max) {

      var curvature = .5;


      function link(d) {
        if (d.date >= min && d.date <= max) {
          var x0 = d.source.x + d.source.dx,
            x1 = d.target.x,
            xi = d3.interpolateNumber(x0, x1),
            x2 = xi(curvature),
            x3 = xi(1 - curvature),
            y0 = d.source.y + d.sy + d.dy / 2,
            y1 = d.target.y + d.ty + d.dy / 2;
          return "M" + x0 + "," + y0
            + "C" + x2 + "," + y0
            + " " + x3 + "," + y1
            + " " + x1 + "," + y1;
        }
      }

      link.curvature = function (_) {
        if (!arguments.length) return curvature;
        curvature = +_;
        return link;
      };

      return link;
    };

    // Populate the sourceLinks and targetLinks for each node.
    // Also, if the source and target are not objects, assume they are indices.
    function computeNodeLinks() {
      snodes.forEach(function (node) {
        node.sourceLinks = [];
        node.targetLinks = [];
      });
      slinks.forEach(function (link) {
        var source = link.source,
          target = link.target;

        if (typeof source === "number") {
          link.source = snodes[nodeIdx[link.source]];
          source = link.source;
        }

        if (typeof target === "number") {
          link.target = snodes[nodeIdx[link.target]];
          target = link.target;
        }
        source.sourceLinks.push(link);
        target.targetLinks.push(link);
      });
    }

    // Compute the value (size) of each node by summing the associated links.
    function computeNodeValues() {
      snodes.forEach(function (node) {
        node.value = Math.max(
          node.sourceLinks.length,
          node.targetLinks.length
        );
      });
    }

    // Iteratively assign the breadth (x-position) for each node.
    // Nodes are assigned the maximum breadth of incoming neighbors plus one;
    // snodes with no incoming links are assigned breadth zero, while
    // snodes with no outgoing links are assigned the maximum breadth.
    function computeNodeBreadths() {
      var remainingNodes = snodes,
        nextNodes,
        x = 0;

      while (remainingNodes.length) {
        nextNodes = [];
        remainingNodes.forEach(function (node) {
          node.x = x;
          node.dx = nodeWidth;
          node.sourceLinks.forEach(function (link) {
            if (nextNodes.indexOf(link.target) < 0) {
              nextNodes.push(link.target);
            }
          });
        });
        remainingNodes = nextNodes;
        ++x;
      }

      //
      moveSinksRight(x);
      scaleNodeBreadths((size[0] - nodeWidth) / (x - 1));
    }

    function moveSourcesRight() {
      snodes.forEach(function (node) {
        if (!node.targetLinks.length) {
          node.x = d3.min(node.sourceLinks, function (d) { return d.target.x; }) - 1;
        }
      });
    }

    function moveSinksRight(x) {
      snodes.forEach(function (node) {
        if (!node.sourceLinks.length) {
          node.x = x - 1;
        }
      });
    }

    function scaleNodeBreadths(kx) {
      snodes.forEach(function (node) {
        node.x *= kx;
      });
    }

    function computeNodeDepths(iterations) {
      var nodesByBreadth = d3.nest()
        .key(function (d) { return d.x; })
        .sortKeys(d3.ascending)
        .entries(snodes)
        .map(function (d) { return d.values; });

      //
      initializeNodeDepth();
      resolveCollisions();
      for (var alpha = 1; iterations > 0; --iterations) {
        relaxRightToLeft(alpha *= .99);
        resolveCollisions();
        relaxLeftToRight(alpha);
        resolveCollisions();
      }

      function initializeNodeDepth() {
        var ky = d3.min(nodesByBreadth, function (snodes) {
          return (size[1] - (snodes.length - 1) * nodePadding) / d3.sum(snodes, value);


        });

        nodesByBreadth.forEach(function (snodes) {
          snodes.forEach(function (node, i) {
            node.y = i;
            node.dy = node.value * ky;
          });
        });

        slinks.forEach(function (link) {
          link.dy = ky;
        });
      }

      function relaxLeftToRight(alpha) {
        nodesByBreadth.forEach(function (snodes, breadth) {
          snodes.forEach(function (node) {
            if (node.targetLinks.length) {
              var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
              node.y += (y - center(node)) * alpha;
            }
          });
        });

        function weightedSource(link) {
          return center(link.source) * link.value;
        }
      }

      function relaxRightToLeft(alpha) {
        nodesByBreadth.slice().reverse().forEach(function (snodes) {
          snodes.forEach(function (node) {
            if (node.sourceLinks.length) {
              var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
              node.y += (y - center(node)) * alpha;
            }
          });
        });

        function weightedTarget(link) {
          return center(link.target) * link.value;
        }
      }

      function resolveCollisions() {
        nodesByBreadth.forEach(function (snodes) {
          var node,
            dy,
            y0 = 0,
            n = snodes.length,
            i;

          // Push any overlapping snodes down.
          snodes.sort(ascendingDepth);
          for (i = 0; i < n; ++i) {
            node = snodes[i];
            dy = y0 - node.y;
            if (dy > 0) node.y += dy;
            y0 = node.y + node.dy + nodePadding;
          }

          // If the bottommost node goes outside the bounds, push it back up.
          dy = y0 - nodePadding - size[1];
          if (dy > 0) {
            y0 = node.y -= dy;

            // Push any overlapping snodes back up.
            for (i = n - 2; i >= 0; --i) {
              node = snodes[i];
              dy = node.y + node.dy + nodePadding - y0;
              if (dy > 0) node.y -= dy;
              y0 = node.y;
            }
          }
        });
      }

      function ascendingDepth(a, b) {
        return a.y - b.y;
      }
    }

    function computeLinkDepths() {
      snodes.forEach(function (node) {
        node.sourceLinks.sort(ascendingTargetDepth);
        node.targetLinks.sort(ascendingSourceDepth);
      });
      snodes.forEach(function (node) {
        var sy = 0, ty = 0;
        node.sourceLinks.forEach(function (link) {
          link.sy = sy;
          sy += link.dy;
        });
        node.targetLinks.forEach(function (link) {
          link.ty = ty;
          ty += link.dy;
        });
      });

      function ascendingSourceDepth(a, b) {
        return a.source.y - b.source.y;
      }

      function ascendingTargetDepth(a, b) {
        return a.target.y - b.target.y;
      }
    }

    function center(node) {
      return node.y + node.dy / 2;
    }

    function value(link) {
      return link.value;
    }

    return sankey;
  };

  updateStockSelection();

  document.getElementById("updateStories").onclick = function () {
    document.getElementById("sankey").innerHTML = "";
    updateLinkData();
    setInterval(minDate, maxDate);
  }

  document.getElementById("updateStocks").onclick = function () {
    updatingStockSel = 1;
    document.getElementById("graph").innerHTML = "";
    updateStockSelection();
    updateLinkData();
    setInterval(minDate, maxDate);
    updatingStockSel = 0;
  }


}).catch((err) => {
  console.log("Error: ", err);
})




