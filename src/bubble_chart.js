/* bubbleChart creation function. Returns a function that will
 * instantiate a new bubble chart given a DOM element to display
 * it in and a dataset to visualize.
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */
function bubbleChart() {
  // Constants for sizing

  var margin = { top: 70, right: 50, bottom: 30, left: 55 };
  var width = document.getElementById("vis").clientWidth - margin.left - margin.right;

  var height=600;

  // tooltip for mouseover functionality
  var tooltip = floatingTooltip('gates_tooltip', 300);

  var f = d3.format(".3%")
  var maxLetterRadius;
  // Locations to move bubbles towards, depending
  // on which view mode is selected.
  var center = { x: width / 2, y: height / 2 };

  var LayerCentersGrowth = {
    "positive": { x: width / 3, y: height / 2 },
    "negative": { x: 2 * width / 3, y: height / 2 }
  };

  // X locations of the Layer titles.
  var LayersTitleGrowthX = {
    "positive trend": width / 3,
    "negative trend": 2 * width / 3,
  };


  var LayerCentersGroup = {
    "Strong economic activity": { x: width / 3, y: height / 3 },
    "Well-being today": { x: 2 * width / 3, y: height / 3 },
    "Inclusion and equality of opportunity": { x: width / 3, y:  2 * height / 3 },
    "Sustainability and systemic resilience": { x: 2 * width / 3, y: 2 * height / 3 }
  };

  // X locations of the Layer titles.
  var LayersTitleGroupX = {
    "Strong economic activity": width/15,
    "Well-being today": width - width / 15,
    "Inclusion and equality of opportunity": width / 15,
    "Sustainability and systemic resilience": width - width / 15,
  };

    var LayersTitleGroupY = {
    "Strong economic activity": 20,
    "Well-being today": 20,
    "Inclusion and equality of opportunity": height-20,
    "Sustainability and systemic resilience": height - 20,
  };

  var LayerCentersUnit = {
    "Percentage": { x: width / 3, y: height / 2 },
    "Percentage Points": { x: 2 * width / 3, y: height / 2 }
  };

  // X locations of the Layer titles.
  var LayersTitleUnitX = {
    "Percentage": 160,
    "Percentage Points": width -160,
  };



  // @v4 strength to apply to the position forces
  var forceStrength = 0.05;

  // These will be set in create_nodes and create_vis
  var svg = null;
  var bubbles = null;
  var nodes = [];

  // Charge function that is called for each node.
  // As part of the ManyBody force.
  // This is what creates the repulsion between nodes.
  //
  // Charge is proportional to the diameter of the
  // circle (which is stored in the radius attribute
  // of the circle's associated data.
  //
  // This is done to allow for accurate collision
  // detection with nodes of different sizes.
  //
  // Charge is negative because we want nodes to repel.
  // @v4 Before the charge was a stand-alone attribute
  //  of the force layout. Now we can use it as a separate force!
  function charge(d) {
    return -Math.pow(d.radius, 2.1) * forceStrength;
  }

  // Here we create a force layout and
  // @v4 We create a force simulation now and
  //  add forces to it.
  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(forceStrength).x(center.x))
    .force('y', d3.forceY().strength(forceStrength).y(center.y))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  // @v4 Force starts up automatically,
  //  which we don't want as there aren't any nodes yet.
  simulation.stop();

  // Nice looking colors - no reason to buck the trend
  // @v4 scales now have a flattened naming scheme

  /**var fillColor = d3.scaleOrdinal()
    .domain(['positive','negative','stable'])
    .range(['#27B499', '#F15C54','#9AB0BE']);**/

 /* var fillColor = d3.scaleOrdinal()
    .domain(['1', '2', '3','4','5','6','7','8','9','10','11','12'])
    .range(['#037BC1', '#A154A1', '#D70B8C', '#ED4E70', '#DA2128', '#F47920', '#FFC20E', '#8CC841', '#4DB757', '#0BB89C', '#00A8CB', '#0D809B']);
*/

  var fillColor = d3.scaleOrdinal()
    .domain(['Strong economic activity', 'Well-being today', 'Inclusion and equality of opportunity', 'Sustainability and systemic resilience', '5', '6', '7', '8', '9', '10', '11', '12'])
    .range(['#E73741', '#037BC1', '#FFC20E', '#0BB89C', '#A154A1', '#D70B8C', '#ED4E70', '#DA2128', '#F47920', '#FFC20E', '#8CC841', '#4DB757', '#0BB89C', '#00A8CB', '#0D809B']);

  /*
   * This data manipulation function takes the raw data from
   * the CSV file and converts it into an array of node objects.
   * Each node will store data and visualization values to visualize
   * a bubble.
   *
   * rawData is expected to be an array of data objects, read in from
   * one of d3's loading functions like d3.csv.
   *
   * This function returns the new node array, with a node in that
   * array for each element in the rawData input.
   */
  function createNodes(rawData) {
    // Use the max total_amount in the data as the max in the scale's domain
    // note we have to ensure the total_amount is a number.
    var maxAmount = d3.max(rawData, function (d) { return +d.Total; });

     maxLetter = d3.max(rawData, function (d) { return d.Theme.length; });

    // Sizes bubbles based on area.
    // @v4: new flattened scale names.
    var maxWidth;
    if(width>900)
      maxWidth=900
    else
      maxWidth=width
    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([1, maxWidth/15])
      .domain([0., maxLetter]);

    maxLetterRadius = radiusScale(maxLetter)

    // Use map() to convert raw data into node data.
    // Checkout http://learnjsdata.com/ for more on
    // working with data.
    var myNodes = rawData.map(function (d) {
      return {
        id: d.RefIndic,
        radius_old: radiusScale(Math.abs(+d.Total)),
        radius: radiusScale(Math.abs(d.Theme.length)),
        value: +d.Total,
        Unit:d.Unit,
        name: d.Theme,
        indicator:d.Indicator,
        label:d.Label,
        colorGroup:d.Trend,
        layerGrowth: d.Trend,
        layerGroup: d.Group,
        layerUnit: d.Unit,
        refIndic: d.RefIndic,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });

    // sort them to prevent occlusion of smaller nodes.
    myNodes.sort(function (a, b) { return b.value - a.value; });

    return myNodes;
  }

  /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG continer for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
  var chart = function chart(selector, rawData) {
    // convert raw data into nodes data
    nodes = createNodes(rawData);

    // Create a SVG element inside the provided selector
    // with desired size.
    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);





    // Bind nodes data to what will become DOM elements to represent them.
    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });


    text = svg.selectAll('.label')
      .data(nodes, function (d) { return d.id; });

    // Create new circle elements each with class `bubble`.
    // There will be one circle.bubble for each object in the nodes array.
    // Initially, their radius (r attribute) will be 0.
    // @v4 Selections are immutable, so lets capture the
    //  enter selection to apply our transtition to below.
    var bubblesE = bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return fillColor(d.layerGroup); })
      .attr('stroke', function (d) { return d3.rgb(fillColor(d.layerGroup)).darker(); })
      .attr('stroke-width', 2)
      .attr('id', function (d) { return "bubble" + d.refIndic; })
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail);

    var textE = text.enter().append('text')
      .classed('label', true)
      .attr('text-anchor', 'middle')
      .attr('id', function (d) { return "text" + d.refIndic; })
      .text(function (d) { return d.name/*.substring(0, d.radius / 3)*/ ; })
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail)

    // @v4 Merge the original empty selection and the enter selection
    bubbles = bubbles.merge(bubblesE);
    text = text.merge(textE);


    // Fancy transition to make bubbles appear, ending with the
    // correct radius
    bubbles.transition()
      .duration(2000)
      //.attr('r', function (d) { return d.radius; });
      .attr('r', maxLetterRadius);/////////////////////take line above for different radius//////

    // Set the simulation's nodes to our newly created nodes array.
    // @v4 Once we set the nodes, the simulation will start running automatically!
    simulation.nodes(nodes);


    ///////////////////////////////////////////////////////
    ////////////DEFINING DIFFERENT START VIEWS/////////////
    ///////////////////////////////////////////////////////
    // Set initial layout to single group.
    //groupBubbles(); // initial view as we want to focus on the trend we start with splitBubblesGrowth
    //splitBubblesGrowth(); // PICK THIS ONE for growth view
    splitBubblesGroup()


  };


  /*
   * Callback function that is called after every tick of the
   * force simulation.
   * Here we do the acutal repositioning of the SVG circles
   * based on the current x and y values of their bound node data.
   * These x and y values are modified by the force simulation.
   */
  function ticked() {
    bubbles
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });

    text
      .attr('x', function (d) { return d.x; })
      .attr('y', function (d) { return d.y; });
  }

  /*
   * Provides a x value for each node to be used with the split by layer
   * x force.
   */
  function nodeLayerPosGrowthX(d) {
    return LayerCentersGrowth[d.layerGrowth].x;
  }
  function nodeLayerPosGrowthY(d) {
    return LayerCentersGrowth[d.layerGrowth].y;
  }

  function nodeLayerPosGroupX(d) {
    return LayerCentersGroup[d.layerGroup].x;
  }
  function nodeLayerPosGroupY(d) {
    return LayerCentersGroup[d.layerGroup].y;
  }

  function nodeLayerPosUnitX(d) {
    return LayerCentersUnit[d.layerUnit].x;
  }
  function nodeLayerPosUnitY(d) {
    return LayerCentersUnit[d.layerUnit].y;
  }

  /*
   * Sets visualization in "single group mode".
   * The Layer labels are hidden and the force layout
   * tick function is set to move all nodes to the
   * center of the visualization.
   */
  function groupBubbles() {
    hideLayerTitles();

    // @v4 Reset the 'x' force to draw the bubbles to the center.
    simulation.force('x', d3.forceX().strength(forceStrength).x(center.x)).force('y', d3.forceY().strength(forceStrength).y(center.y));

    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(1).restart();
  }




  /*
   * Sets visualization in "split by Layer mode".
   * The Layer labels are shown and the force layout
   * tick function is set to move nodes to the
   * LayerCenter of their data's Layer.
   */
  function splitBubblesGrowth() {
    hideLayerTitles();
    showLayerTitlesGrowth();

    // @v4 Reset the 'x' force to draw the bubbles to their Layer centers
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodeLayerPosGrowthX));

    simulation.force('y', d3.forceY().strength(forceStrength).y(nodeLayerPosGrowthY));
    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(1).restart();
  }
  function splitBubblesGroup() {
    hideLayerTitles();
    showLayerTitlesGroup();

    // @v4 Reset the 'x' force to draw the bubbles to their Layer centers
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodeLayerPosGroupX));
    // @v4 Reset the 'y' force to draw the bubbles to their Layer centers
    simulation.force('y', d3.forceY().strength(forceStrength).y(nodeLayerPosGroupY));

    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(1).restart();
  }  
  function splitBubblesUnit() {
    hideLayerTitles();
    showLayerTitlesUnit();

    // @v4 Reset the 'x' force to draw the bubbles to their Layer centers
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodeLayerPosUnitX));

    simulation.force('y', d3.forceY().strength(forceStrength).y(nodeLayerPosUnitY));
    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(1).restart();
  }
  


  /*
   * Hides Layer title displays.
   */
  function hideLayerTitles() {
    svg.selectAll('.Layer').remove();
  }

  /*
   * Shows Layer title displays.
   */
  function showLayerTitlesGrowth() {
    // Another way to do this would be to create
    // the Layer texts once and then just hide them.
    var LayersData = d3.keys(LayersTitleGrowthX);
    var Layers = svg.selectAll('.Layer')
      .data(LayersData);

    Layers.enter().append('text')
      .attr('class', 'Layer')
      .attr('x', function (d) { return LayersTitleGrowthX[d]; })
      .attr('y', 80)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });
  }
  function showLayerTitlesGroup() {
    // Another way to do this would be to create
    // the Layer texts once and then just hide them.
    var LayersData = d3.keys(LayersTitleGroupX);
    var Layers = svg.selectAll('.Layer')
      .data(LayersData);

    Layers.enter().append('text')
      .attr('class', 'Layer')
      .attr('x', function (d) { return LayersTitleGroupX[d]; })
      .attr('y', function (d) { return LayersTitleGroupY[d]; })
      .attr('text-anchor', function(d){
        console.log(d)
        if (d=="Strong economic activity" || d=="Inclusion and equality of opportunity") {
          return "start"
        }
        else
          return 'end'
      })
      //'middle'// preivously middle)
      .text(function (d) { return d; });
  }
    function showLayerTitlesUnit() {
    // Another way to do this would be to create
    // the Layer texts once and then just hide them.
    var LayersData = d3.keys(LayersTitleUnitX);
    var Layers = svg.selectAll('.Layer')
      .data(LayersData);

    Layers.enter().append('text')
      .attr('class', 'Layer')
      .attr('x', function (d) { return LayersTitleUnitX[d]; })
      .attr('y', 80)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });
  }
    

  /*
   * Function called on mouseover to display the
   * details of a bubble in the tooltip.
   */
  function showDetail(d) {
    // change outline to indicate hover state.
    var selText = "#text" + d.refIndic;
    var selBubble = "#bubble" + d.refIndic;
    d3.select(selBubble).attr('stroke', 'black').attr('opacity', 0.65).attr('stroke-width', '4px');

    d3.select(selText).style('fill', "#000000").style('font-size', '18px').style('font-weight', '900');

    var content = '<b><span class="title">'+ d.name +
                  '</span><br></b><br><span class="name">' +
                  d.indicator +
                  '<br></span><span class="unit">' +
                  d.label +
                  '</span><br/>' +
                  '<br><span class="value">' +
                  d.Unit +
                  '</span><br/>' +
                  '<span id="lineChart"/>';
                  

    tooltip.showTooltip(content, d.refIndic, d3.event);
  }

  /*
   * Hides tooltip
   */
  function hideDetail(d) {
    // reset outline
    var selText = "#text" + d.refIndic;
    var selBubble = "#bubble" + d.refIndic;
    d3.select(selBubble).attr('stroke', d3.rgb(fillColor(d.layerGroup)).darker()).attr('opacity', 1).attr('stroke-width', '2px');
    d3.select(selText).style('fill', "#575757").style('font-size', '12px').style('font-weight','700')


    tooltip.hideTooltip();
  }

  /*
   * Externally accessible function (this is attached to the
   * returned chart function). Allows the visualization to toggle
   * between "single group" and "split by Layer" modes.
   *
   * displayName is expected to be a string and either 'Layer' or 'all'.
   */
  chart.toggleDisplay = function (displayName) {
    if (displayName === 'Growth') {
      splitBubblesGrowth();
    } else if (displayName === 'Group') {
      splitBubblesGroup();
    } else if (displayName === 'Unit') {
      splitBubblesUnit();
    } else {
      groupBubbles();
    }

  };


  // return the chart function from closure.
  return chart;
}

/*
 * Below is the initialization code as well as some helper functions
 * to create a new bubble chart instance, load the data, and display it.
 */

var myBubbleChart = bubbleChart();

/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}

/*
 * Sets up the layout buttons to allow for toggling between view modes.
 */
function setupButtons() {
  d3.select('#toolbar')
    .selectAll('.button')
    .on('click', function () {
      // Remove active class from all buttons
      d3.selectAll('.button').classed('active', false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed('active', true);

      // Get the id of the button
      var buttonId = button.attr('id');

      // Toggle the bubble chart based on
      // the currently clicked button.
      myBubbleChart.toggleDisplay(buttonId);
    });
}

/*
 * Helper function to convert a number into a string
 * and add commas to it to improve presentation.
 */
function addCommas(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}

// Load the data.
d3.tsv('data/summaryData.tsv', display);


//load time serie data
var timeserieData=[];
function copy(data){
  data.forEach(function(d){
    timeserieData.push(d)
  })
}
// Load the data.
d3.tsv('data/data.tsv', copy);

// setup the buttons.
setupButtons();
