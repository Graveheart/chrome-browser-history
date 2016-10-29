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
    .on('mouseover',handleMouseOver)
    .on('mouseout',handleMouseOut);

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

const switchLine = (visitID,display) => {
    displayAttr = display ? 'true' : 'none'

    visitParentID = dummyDataset[visitID].parent

    // only show line if parent exists
    if(visitParentID != undefined){
        d3.select(`polyline[visit_id='${visitID}']`).attr('display',displayAttr)
        switchLine(visitParentID,display) // switch parent's line as well
    }
}

renderDataset(dummyDataset);
