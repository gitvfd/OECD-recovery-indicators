/*
 * Creates tooltip with provided id that
 * floats on top of visualization.
 * Most styling is expected to come from CSS
 * so check out bubble_chart.css for more details.
 */
function floatingTooltip(tooltipId, widthtt) {
  // Local variable to hold tooltip div for
  // manipulation in other functions.
  var tt = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .attr('id', "tooltipId")
    .style('pointer-events', 'none');

  // Set a width if it is provided.
  if (widthtt) {
    tt.style('width', widthtt);
  }

  // Initially it is hidden.
  hideTooltip();

  /*
   * Display tooltip with provided content.
   *
   * content is expected to be HTML string.
   *
   * event is d3.event for positioning.
   */
  function showTooltip(content, refIndic,event) {
    tt.style('opacity', 1.0)
      .html(content);

    updatelineChart(refIndic)
    updatePosition(event);
  }

  /*
   * Hide the tooltip div.
   */
  function hideTooltip() {
    tt.style('opacity', 0.0);
  }

  /*
   * Figure out where to place the tooltip
   * based on d3 mouse event.
   */
  function updatePosition(event) {
    var xOffset = 20;
    var yOffset = 10;

    var ttw = tt.style('width');
    var tth = tt.style('height');

    var wscrY = window.scrollY;
    var wscrX = window.scrollX;

    var curX = (document.all) ? event.clientX + wscrX : event.pageX;
    var curY = (document.all) ? event.clientY + wscrY : event.pageY;
    var ttleft = ((curX - wscrX + xOffset * 2 + ttw) > window.innerWidth) ?
                 curX - ttw - xOffset * 2 : curX + xOffset;

    if (ttleft < wscrX + xOffset) {
      ttleft = wscrX + xOffset;
    }

    var tttop = ((curY - wscrY + yOffset * 2 + tth) > window.innerHeight) ?
                curY - tth - yOffset * 2 : curY + yOffset;

    if (tttop < wscrY + yOffset) {
      tttop = curY + yOffset;
    }

    //previous tooltip positionnig
    /*tt
      .style('top', tttop + 'px')
      .style('left', ttleft + 'px');*/

    if (curX > document.getElementById("container").clientWidth/2){

      if (document.getElementById("container").clientWidth>720)
        if (document.getElementById("container").clientWidth / 3 - widthtt>0)
          tt
            .style('top', widthtt / 3 + 'px')
            .style('left', (document.getElementById("container").clientWidth / 3 - widthtt) + 'px');         
        else
          tt
            .style('top', widthtt / 3 + 'px')
            .style('left', (5) + 'px');
      else

        tt
          .style('top', widthtt / 3 + 'px')
          .style('left', (5) + 'px');
    }
    else{
      if (document.getElementById("container").clientWidth > 720)
        tt
          .style('top', widthtt / 3 + 'px')
          .style('left', (document.getElementById("container").clientWidth / 2 ) + 'px');
      else
        tt
          .style('top', widthtt / 3 + 'px')
          .style('left', (document.getElementById("container").clientWidth - widthtt) + 'px');
    }
      
  }

  return {
    showTooltip: showTooltip,
    hideTooltip: hideTooltip,
    updatePosition: updatePosition
  };
}

function updatelineChart(refIndic){

  //lineSVG.selectAll("*").remove()

  var margin = {"top":5,"bottom":20,"left":30,"right":20};
  var widthLine = document.getElementById("tooltipId").offsetWidth - margin.left-margin.right;

  var heightLine=150;

  var lineSVG = d3.select("#lineChart").append("svg")
    .attr("width", widthLine +margin.left + margin.right)
    .attr("height", heightLine + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleLinear()
    .range([margin.left, widthLine-margin.right]);

  function dateParser(d) {

    return d3.timeParse('%Y')(d);
  }


  var bisectDate = d3.bisector(function (d) { return dateParser(d.TIME); }).left;
  //Add Y axis
 
  var y = d3.scaleLinear()
    .range([heightLine,0]);
  var data = timeserieData.filter(function (d) { return d.refIndic == refIndic && d.value != "" ; })


  x.domain(d3.extent(data, function (d) { return dateParser(d.year); }))
 
  var min, max;
  min =  d3.min(data, function (d) { return parseFloat(d.value); })

  max = 1.1 * d3.max(data, function (d) { return parseFloat(d.value); })
  if(min<0){
    if (max > 0)
      y.domain([1.1 * min, 1.1 *max])
    else
      y.domain([1.1 *min, 0.9 * max])
  } else {
    if (max > 0)
      y.domain([0.9 * min, 1.1 *max])
    else
      y.domain([0.9* min, 0.9*max])
  }

  lineSVG
    .append("g")
    .attr("class", "axisContext")
    .attr("transform", "translate(0," + heightLine + ")")
    .call(d3.axisBottom(x).ticks(4)
      .tickFormat(function (x) {
        // get the milliseconds since Epoch for the date
        var milli = (x + 7884000000);

        // calculate new date 10 seconds earlier. Could be one second, 
        // but I like a little buffer for my neuroses
        var vanilli = new Date(milli);

        // calculate the year
        var yr = vanilli.getFullYear();

        return yr;

      }));
    if (refIndic == "1" || refIndic == "2" || refIndic == "6" || refIndic == "7" || refIndic == "9" || refIndic == "10" || refIndic == "12")
      lineSVG.append("g")
        .attr("class", "axisContext y")
        .call(d3.axisLeft(y).ticks(5).tickFormat(function (d) {
          return y.tickFormat(10, d3.format(".0f"))(d) + "%"
        }).tickSize(-(widthLine)));
 
    if (refIndic == "3" || refIndic == "4" || refIndic == "5" || refIndic == "8" || refIndic == "11")
      lineSVG.append("g")
        .attr("class", "axisContext y")
        .call(d3.axisLeft(y).ticks(5).tickFormat(function (d) {
          return y.tickFormat(10, d3.format(".0f"))(d)
        }).tickSize(-(widthLine)));

  var color = ["#037BC1", "#ED4E70", "#0BB89C"];
  //line average
  lineSVG
    .append("path")
    .attr("fill", "none"/*"#8DCD79"*/)
    .attr("stroke", function (d) { return color[0] })
    .attr("stroke-width", function () {  return 5; })
    .attr("opacity", function () { return 1 })
    .attr("class", "classContext")
    .attr("id", function (d) { return "averageline"; })
    .attr("d", function (d) {
      return d3.line()//area
        .x(function (d) { return x(dateParser(d.year)); })
        // .y0(y(0))
        .y(function (d) { return y(parseFloat(d.value)); })
        (data.filter(function (d) { return d.variable == "avg"; }))
    })

  //line median
  lineSVG
    .append("path")
    .attr("fill", "none"/*"#8DCD79"*/)
    .attr("stroke", function (d) { return color[1] })
    .attr("stroke-width", function () { return 1.5; })
    .attr("opacity", function () { return 0.85 })
    .style("stroke-dasharray", ("6,1"))
    .attr("class", "classContext")
    .attr("id", function (d) { return "medianline"; })
    .attr("d", function (d) {
      return d3.line()//area
        .x(function (d) { return x(dateParser(d.year)); })
        // .y0(y(0))
        .y(function (d) { return y(parseFloat(d.value)); })
        (data.filter(function (d) { return d.variable == "median"; }))
    })

  //line S90
  lineSVG
    .append("path")
    .attr("fill", "none"/*"#8DCD79"*/)
    .attr("stroke", function (d) { return color[2] })
    .attr("stroke-width", function () { return 1; })
    .style("stroke-dasharray", ("4,4"))
    .attr("opacity", function () { return 0.85 })
    .attr("class", "classContext")
    .attr("id", function (d) { return "perc90line"; })
    .attr("d", function (d) {
      return d3.line()//area
        .x(function (d) { return x(dateParser(d.year)); })
        // .y0(y(0))
        .y(function (d) { return y(parseFloat(d.value)); })
        (data.filter(function (d) { return d.variable == "perc90"; }))
    })

  //line S10
  lineSVG
    .append("path")
    .attr("fill", "none"/*"#8DCD79"*/)
    .attr("stroke", function (d) { return color[2] })
    .attr("stroke-width", function () { return 1; })
    .style("stroke-dasharray", ("4,4"))
    .attr("opacity", function () { return 0.85 })
    .attr("class", "classContext")
    .attr("id", function (d) { return "perc10line"; })
    .attr("d", function (d) {
      return d3.line()//area
        .x(function (d) { return x(dateParser(d.year)); })
        // .y0(y(0))
        .y(function (d) { return y(parseFloat(d.value)); })
        (data.filter(function (d) { return d.variable == "perc10"; }))
    })
}