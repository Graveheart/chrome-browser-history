
function button() {

  var width = 960,
    height = 500,
    radius = 10,
    padding = 10,
    count = 0,
    container = null,
    text = null;

  var defs = null,
    gradient = null,
    shadow = null,
    cb = null,
    rect = null;

  function my() {

    // set defaults
    g = container || d3.select('svg').append('g')
        .attr('class', 'button')
        .attr('transform', 'translate(' + [width / 2, height / 2] + ")");
    text = text || g.append('text').text('Hello, world!');

    defs = g.append('defs');

    var bbox = text.node().getBBox();
    rect = g.append('rect')
      .attr("x", bbox.x - padding)
      .attr("y", bbox.y - padding)
      .attr("width", bbox.width + 2 * padding)
      .attr("height", bbox.height + 2 * padding)
      .attr('rx', radius)
      .attr('ry', radius)

    addGradient(count);
    addShadow(count);

    rect.attr('fill', function () { return gradient ? 'url(#gradient' + count + ')' : 'steelblue'; })
      .attr('filter', function() { return shadow ? 'url(#dropShadow' + count + ')' : null; })
      .on('mouseover', brighten)
      .on('mouseout', darken)
      .on('mousedown', press)
      .on('mouseup', letGo)

    // put text on top
    g.append(function() { return text.remove().node(); })

    // TESTING -- SVG "use" element for testing dimensions of drop-shadow filter
//    g.append('use').attr('xlink:href', '#shadowrect' + count)

    return my;
  }

  function addGradient(k) {
    gradient = defs.append('linearGradient')
      .attr('id', 'gradient' + k)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('id', 'gradient-start')
      .attr('offset', '0%')

    gradient.append('stop')
      .attr('id', 'gradient-stop')
      .attr('offset', '100%')
  }

  function addShadow(k) {
    shadow = defs.append('filter')
      .attr('id', 'dropShadow' + k)
      .attr('x', rect.attr('x'))
      .attr('y', rect.attr('y'))
      .attr('width', rect.attr('width'))
      .attr('height', rect.attr('height'))

    // TESTING size of drop-shadow filter
    defs.append('rect')
      .attr('id', 'shadowrect' + k)
      .attr('x', rect.attr('x'))
      .attr('y', rect.attr('y'))
      .attr('width', rect.attr('width'))
      .attr('height', rect.attr('height'))

    shadow.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', '3')

    shadow.append('feOffset')
      .attr('dx', '2')
      .attr('dy', '4')

    var merge = shadow.append('feMerge')

    merge.append('feMergeNode')
    merge.append('feMergeNode').attr('in', 'SourceGraphic');
  }

  function brighten() {
    gradient.select('#gradient-start').classed('active', true)
    gradient.select('#gradient-stop').classed('active', true)
  }

  function darken() {
    gradient.select('#gradient-start').classed('active', false);
    gradient.select('#gradient-stop').classed('active', false);
  }

  function press() {
    if (typeof cb === 'function') cb();
    if (shadow) shadow.select('feOffset')
      .attr('dx', '0.5')
      .attr('dy', '1')
  }

  function letGo() {
    if (shadow) shadow.select('feOffset')
      .attr('dx', '2')
      .attr('dy', '4')
  }

  my.container = function(_) {
    if (!arguments.length) return container;
    container = _;
    return my;
  };

  my.text = function(_) {
    if (!arguments.length) return text;
    text = _;
    return my;
  };

  my.count = function(_) {
    if (!arguments.length) return count;
    count = _;
    return my;
  };

  my.cb = function(_) {
    if (!arguments.length) return cb;
    cb = _;
    return my;
  };

  return my;
}


const dummyDataset = {
  '1': {
    id: '1',
    url: 'facebook.com',
    since: moment().subtract(1, 'hour'),
    until: moment().subtract(35, 'minutes'),
  },
  '2': {
    id: '2',
    url: 'youtube.com',
    since: moment().subtract(20, 'minutes'),
    until: moment().subtract(5, 'minutes'),
  },
  '3': {
    id: '3',
    url: 'reddit.com',
    since: moment().subtract(10, 'minutes'),
    until: moment(),
    parent: '2',
  },
  '4': {
    id: '4',
    url: 'twitter.com',
    since: moment().subtract(8, 'minutes'),
    until: moment().subtract(2, 'minutes'),
    parent: '3',
  },
  '5': {
    id: '5',
    url: 'cnn.com',
    since: moment().subtract(45, 'minutes'),
    until: moment().subtract(40, 'minutes'),
    parent: '1',
  },
  '6': {
    id: '6',
    url: 'ikea.dk',
    since: moment().subtract(58, 'minutes'),
    until: moment().subtract(55, 'minutes'),
    parent: '1',
  },
  '7': {
    id: '7',
    url: 'imgur.com',
    since: moment().subtract(6, 'minutes'),
    until: moment().subtract(2, 'minutes'),
    parent: '4',
  },
  '8': {
    id: '8',
    url: 'ku.dk',
    since: moment().add(5, 'minutes'),
    until: moment().add(15, 'minutes'),
  }

};

const renderDataset = dataset => {
  // Compute on which level (0...n) is this visit
  const level = visit => visit.parent ? level(dataset[visit.parent]) + 1 : 0;

  // Create the svg
  const history = d3
    .select('body')
    .append('svg')
    .attr('width', '1000px')
    .attr('height', '1000px');

  const xScale = d3.scale.linear()
    .domain([dummyDataset['1'].since.valueOf(), dummyDataset['3'].until.valueOf()])
    .range([0, 400])

  const durations = Object.values(dataset)
      .map(visit => visit.until.diff(visit.since))
.sort((x, y) => x - y);

  const widthScale = d3.scale.linear()
    .domain([0, durations[durations.length - 1]])
    .range([0, 200])

  const yScale = d3.scale.linear()
    .domain([0, 3])
    .range([50, 400])

  const handleMouseOver = (d,i) => switchLine(d.id, true);

  const handleMouseOut = (d,i) => switchLine(d.id, false);



  const g = history
      .selectAll('.visit')
      .data(Object.values(dataset))
      .enter()
      .append('g')
      .attr('class', 'visit')
      .attr('parent',visit => visit.parent)
.attr('transform', visit => `translate(${xScale(visit.since.valueOf())}, ${yScale(level(visit))})`);

  g
    .append('line')
    .attr('x1',0)
    .attr('y1',10)
    .attr('x2', visit => widthScale(visit.until.diff(visit.since)))
.attr('y2',10)
    .attr("stroke",visit => assignColor(visit.id))
.attr("stroke-width", 10)
    .attr('visit_id',visit => visit.id)
.on('mouseover',handleMouseOver)
    .on('mouseout',handleMouseOut);
  // var g_button = g.append('g')
  //   .attr('class', 'button')
  //   .attr('transform', 'translate(' + [480 / 2, 240 / 2] +')')
  // var text = g_button.append('text')
  //   .text('Click me');
  // button()
  //   .container(g_button)
  //   .text(text)
  //   .count(0)
  //   .cb(function() { console.log("I've been clicked!") })();
  g
    .append('text')
    .style('fill', 'black')
    .style('font-family','Verdana')
    .text(visit => visit.url);

  g
    .append('polyline')
    .attr('points',"-5,-100 -5,10 -1,10")
    .attr('class','arrow')
    .attr('visit_id',visit => visit.id)
.attr('display','none');


};

const assignColor = (visitID) => {
  // get categorical colors
  var c20 = d3.scale.category20(),
    c20b = d3.scale.category20b(),
    c20c = d3.scale.category20c(),
    col = d3.range(60).map(function(c){
      if (c < 20) {
        return c20(c);
      }
      else if (c < 40) {
        return c20b(c);
      }
      else {
        return c20c(c);
      }
      return c20(c), c20b(c), c20c(c)
    });
  // every sixtieth url has the same color
  var remainder = visitID % 60;
  return col[remainder];
}

const switchLine = (visitID,display,isParent) => {
  displayAttr = display ? 'true' : 'none'

  visitParentID = dummyDataset[visitID].parent

  // only show line if parent exists
  if(visitParentID != undefined){
    d3.select(`polyline[visit_id='${visitID}']`).attr('display',displayAttr);
    switchLine(visitParentID,display, true); // switch parent's line as well
  }
  if (!isParent) {
    var lineHovered = d3.select(`line[visit_id='${visitID}']`);
    var attributes = {};
    if (display) {
      attributes = {
        "stroke-width": 50,
        "y1": 30,
        "y2": 30
      };
    }
    else {
      attributes = {
        "stroke-width": 10,
        "y1": 10,
        "y2": 10
      };
    }
    lineHovered.transition()
      .duration(1000).attr(attributes);
  }
}

renderDataset(dummyDataset);