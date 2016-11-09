function button() {

  var width = 960,
    height = 500,
    radius = 10,
    padding = 10,
    container = null,
    text = null;

  var defs = null,
    cb = null,
    rect = null;

  function my() {

    // set defaults
    g = container;

    var bbox = text.node().getBBox();
    rect = g.append('rect')
      .attr("x", bbox.x - padding)
      .attr("y", bbox.y - padding)
      .attr("width", 60)
      .attr("height", 30)
      .attr("fill", "#00799d")
      .attr('rx', radius)
      .attr('ry', radius);

    // put text on top
    g.each(function() {
      d3.select(this).append('text').text('Details');
    });

    return my;
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
    visitedUrls: ['https://www.facebook.com/?sk=nf', 'https://www.facebook.com/messages/'],
    since: moment().subtract(1, 'day'),
    until: moment().subtract(1, 'day').add(3, 'hours'),
  },
  '2': {
    id: '2',
    url: 'youtube.com',
    visitedUrls: ['https://www.youtube.com/feed/trending', 'https://www.youtube.com/feed/history', 'https://www.youtube.com/feed/subscriptions'],
    since: moment().subtract(20, 'minutes'),
    until: moment().subtract(5, 'minutes'),
  },
  '3': {
    id: '3',
    url: 'twitter.com',
    since: moment().subtract(10, 'minutes'),
    until: moment(),
    parent: '2',
  },
  '4': {
    id: '4',
    url: 'reddit.com',
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
    visitedUrls:['http://imgur.com/gallery/VsjYG','http://imgur.com/gallery/6M4JA','http://imgur.com/gallery/SxpJC'],
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

var previousLineAttributes = {};
var contextMenuShowing = false;

const renderDataset = dataset => {
  // Remove previous svg
  d3.select('#canvas').selectAll('svg').remove();

  if (Object.keys(dataset).length === 0) {
    console.warn('Skipping, no data');
    return;
  }

  // Compute on which level (0...n) is this visit
  const level = visit => visit.parent ? level(dataset[visit.parent]) + 1 : 0;

  // Create the svg
  const history = d3
    .select('#canvas')
    .append('svg')
    .attr('width', window.innerWidth)
    .attr('height', window.innerWidth);

  const sortedBySince = Object.values(dataset).slice(0).sort((x, y) => x.since.valueOf() - y.since.valueOf());
  const sortedByUntil = Object.values(dataset).slice(0).sort((x, y) => x.until.valueOf() - y.until.valueOf());
  const levels = Object.values(dataset).map(visit => level(visit));
  const maxLevel = levels.reduce((total, x) => Math.max(total, x), 0);
  console.log(levels, maxLevel);

  const xScale = d3.scale.linear()
    .domain([sortedBySince[0].since.valueOf(), sortedByUntil[sortedByUntil.length - 1].until.valueOf()])
    .range([0, window.innerWidth])

  const durations = Object.values(dataset)
    .map(visit => visit.until.diff(visit.since))
    .sort((x, y) => x - y);

  const widthScale = d3.scale.linear()
    .domain([0, durations[durations.length - 1]])
    .range([0, window.innerWidth / 3.5])

  const yScale = d3.scale.linear()
    .domain([0, maxLevel])
    .range([50, 400])

    console.log(Object.values(dataset).map(d => widthScale(d.until.diff(d.since))));
    // console.log(Object.values(dataset).map(visit => xScale(visit.since.valueOf())));

  const handleMouseOver = (d,i) => switchLine(dataset, d.id, true);

  const handleMouseOut = (d,i) => switchLine(dataset, d.id, false);

  const g = history
      .selectAll('.visit')
      .data(Object.values(dataset))
      .enter()
      .append('g')
      .attr('class', 'visit')
      .attr('parent',visit => visit.parent)
      .attr('transform', visit => `translate(${xScale(visit.since.valueOf())}, ${yScale(level(visit))})`);

  g.on('mouseover',handleMouseOver)
    .on('mouseout',handleMouseOut);

  const line = g
    .append('line')
    .attr('x1',0)
    .attr('y1',10)
    .attr('x2', visit => widthScale(visit.until.diff(visit.since)))
    .attr('y2',10)
    .attr("stroke",visit => assignColor(visit.id))
    .attr("stroke-width", 10)
    .attr('visit_id',visit => visit.id);

  d3.selection.prototype.last = function() {
    var last = this.size() - 1;
    return d3.select(this[0][last]);
  };

  var lastLine = d3.selectAll('line').last(); //get last line width
  var lineWidth = parseFloat(lastLine.attr('x2'));
  var parent = lastLine.select(function() { return this.parentNode; });
  var transform = d3.transform(parent.attr('transform'));
  var xTransform = transform.translate[0];
  var width = parseInt(lineWidth + xTransform);

  function timelineRect() {
    var chart = d3.timeline();

    var svg = d3.select("#timeline").append("svg").attr("width", width)
      .datum(Object.values(dataset)).call(chart);
  }

  timelineRect();

  const g_button = g.append('g')
    .attr('class', 'button')
    .attr('visit_id',visit => visit.id)
    .attr('visited_urls', visit => visit.visitedUrls)
    .attr('transform', visit => setButtonPosition(visit.id))
    .attr('display','none');
  const text = g_button.append('text')
    .text('Details');

  button()
    .container(g_button)
    .text(text)
    .cb(function() { console.log("I've been clicked!") })();
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

const colorsCache = { };
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
  if (!colorsCache[visitID]) {
    colorsCache[visitID] = col[Object.keys(colorsCache).length % 60];
  }
  return colorsCache[visitID];
  return col[remainder];
}

const setButtonPosition = (visitID) => {
  // get categorical colors
  const line = d3.select(`line[visit_id='${visitID}']`);
  const x2 = parseInt(line.attr('x2'));
  var translateX = x2 - 35;
  if (x2 < 60) {
    translateX += 70 - x2;
  }
  const translateY = parseInt(line.attr('x1')) + 37;
  return `translate(${translateX}, ${translateY})`;
}

const switchLine = (dataset, visitID,display,isParent) => {
  displayAttr = display ? 'true' : 'none'

  visitParentID = dataset[visitID].parent

  var tooltip = d3.select(".tooltip");
  tooltip.text(dataset[visitID].url);
  tooltip.style("visibility", "visible");

  // only show line if parent exists
  if(visitParentID != undefined){
    d3.select(`polyline[visit_id='${visitID}']`).attr('display',displayAttr);
    switchLine(dataset, visitParentID,display, true); // switch parent's line as well
  }
  if (!isParent) {
    var lineHovered = d3.select(`line[visit_id='${visitID}']`);

    var attributes = {};
    if (display) {
      var x2 = lineHovered.attr('x2');
      attributes = {
        "stroke-width": 50,
        "y1": 30,
        "y2": 30
      };
      if (x2 < 70) {
        if (!previousLineAttributes[visitID]) {
          previousLineAttributes[visitID] = x2;
        }
        attributes["x2"] = 70;
      }
    }
    else {
      attributes = {
        "stroke-width": 10,
        "y1": 10,
        "y2": 10
      };
      if (previousLineAttributes[visitID]) {
        attributes["x2"] = previousLineAttributes[visitID];
      }
    }
    lineHovered.transition()
      .duration(1000).attr(attributes);
    setTimeout(function(){
      const detailsButton = d3.select(`g.button[visit_id='${visitID}']`);
      detailsButton.attr('display',displayAttr);
    },500);
  }
}

const readHistoryDataset = () => {
  const history = JSON.parse(localStorage.getItem('sites'));

  const dataset = { };

  Object.keys(history).forEach(key => {
    Object.keys(history[key]).forEach(site => {
      const info = history[key][site];

      dataset[site] = {
        id: site,
        since: moment(info.startTime),
        until: moment(info.endTime),
        url: info.url,
        parent: site !== info.parentUrl ? info.parentUrl : null,
      };
    });
  });

  console.log(dataset);

  return dataset;
};

let since = moment().startOf('day');
let until = moment().endOf('day');

const filter = dataset => {
  const keys = Object.keys(dataset);
  const goodKeys = keys.filter(key => since.isBefore(dataset[key].since) && dataset[key].until.isBefore(until));

  const goodVisits = { };

  goodKeys.forEach(key => {
    if (dataset[key].parent && !goodKeys.includes(dataset[key].parent)) {
      return;
    }

    goodVisits[key] = dataset[key]
  });

  return goodVisits;
}

const date = document.getElementById('date');
const calendarOptions = {
  sameDay: '[Today]',
  nextWeek: 'dddd',
  lastDay: '[Yesterday]',
  lastWeek: '[Last] dddd',
  sameElse: 'DD/MM/YYYY'
};

const dataset = dummyDataset;

// const dataset = readHistoryDataset();

// Initial render
date.innerText = since.calendar(null, calendarOptions);
renderDataset(filter(dataset));

const previousDay = () => {
  since = since.subtract(1, 'day');
  until.subtract(1, 'day');

  date.innerText = since.calendar(null, calendarOptions);
  renderDataset(filter(dataset));
  nextDayDisabled();
};

const nextDay = () => {
  since.add(1, 'day');
  until.add(1, 'day');
  date.innerText = since.calendar(null, calendarOptions);
  renderDataset(filter(dataset));
  nextDayDisabled();
};

const nextDayDisabled = () => {
  if (moment().diff(since, 'days') == 0) {
    document.getElementById("nextDay").disabled = true;
  }
  else {
    document.getElementById("nextDay").disabled = false;
  }
};

document.getElementById("prevDay").addEventListener("click", previousDay);
document.getElementById("nextDay").addEventListener("click", nextDay);
document.getElementById("nextDay").disabled = true;

var hideContextMenu = () => {
  d3.select(".popup").remove();
  contextMenuShowing = false;
}

var detailButtons = d3.selectAll(".button");
detailButtons.on("click", function() {
  console.log(this);
  var targetElement = event.target || event.srcElement;
  var selectedElement = d3.select(this);

  if(contextMenuShowing) {
    hideContextMenu();
  } else {
    d3_target = selectedElement;
    var visitedUrls = d3_target.attr("visited_urls") ? d3_target.attr("visited_urls").split(',') : [];
    contextMenuShowing = true;
    // Build the popup

    canvas = d3.select("#canvas");
    mousePosition = d3.mouse(canvas.node());
    popup = canvas.append("div")
      .attr("class", "popup")
      .style("left", mousePosition[0] + "px")
      .style("top", mousePosition[1] + "px");
    popup.append("h2").text("Visited Urls");

    visitedUrls.forEach(url => {
      popup.append("p")
      .append("a")
      .attr("href", url)
      .text(url);
    });

    canvasSize = [
      canvas.node().offsetWidth,
      canvas.node().offsetHeight
    ];
    popupSize = [
      popup.node().offsetWidth,
      popup.node().offsetHeight
    ];
    if (popupSize[0] + mousePosition[0] > canvasSize[0]) {
      popup.style("left", "auto");
      popup.style("right", 0);
    }
    if (popupSize[1] + mousePosition[1] > canvasSize[1]) {
      popup.style("top", "auto");
      popup.style("bottom", 0);
    }
  }
});
