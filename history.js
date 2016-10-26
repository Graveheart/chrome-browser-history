const dummyDataset = {
  '1': {
    url: 'facebook.com',
    since: moment().subtract(1, 'hour'),
    until: moment().subtract(35, 'minutes'),
  },
  '2': {
    url: 'youtube.com',
    since: moment().subtract(20, 'minutes'),
    until: moment().subtract(15, 'minutes'),
  },
  '3': {
    url: 'reddit.com',
    since: moment().subtract(10, 'minutes'),
    until: moment(),
    parent: '2',
  },
  '4': {
    url: 'twitter.com',
    since: moment().subtract(8, 'minutes'),
    until: moment().subtract(2, 'minutes'),
    parent: '3',
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

  const g = history
    .selectAll('.visit')
    .data(Object.values(dataset))
    .enter()
    .append('g')
    .attr('class', 'visit')
    .attr('transform', visit => `translate(${xScale(visit.since.valueOf())}, ${yScale(level(visit))})`);

  g
    .append('rect')
    .attr('width', visit => widthScale(visit.until.diff(visit.since)))
    .attr('height', 40)
    .style('fill', 'red');

  g
    .append('text')
    .style('fill', 'black')
    .text(visit => visit.url);
};

renderDataset(dummyDataset);
