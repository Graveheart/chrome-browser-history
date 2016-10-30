(function () {
  d3.timeline = function() {
    var width = null,
      tickFormat = { format: d3.time.format("%I %p"),
        tickTime: d3.time.hours,
        tickInterval: 0.5,
        tickSize: 1,
        tickValues: null
      },
      beginning = 0,
      ending = 0,
      margin = {left: 5, right:0, top: 30, bottom:30};

    var appendTimeAxis = function(g, xAxis, yPosition) {
      var axis = g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + 0 + "," + yPosition + ")")
        .call(xAxis);
    };

    function timeline (gParent) {
      var g = gParent.append("g");

      var gParentItem = d3.select(gParent[0][0]);

      var minTime = 0,
        maxTime = 0;

      try {
        width = gParentItem.attr("width");
      } catch (err) {
        console.log( err );
      }

      // check how many stacks we're gonna need
      if (ending === 0 || beginning === 0) {
        g.each(function (d, i) {
          d.forEach(function (datum, index) {
            // figure out beginning and ending times if they are unspecified
            var startTime = datum.since.valueOf();
            var endTime = datum.until.valueOf();
            if(beginning === 0)
              if (startTime < minTime || (minTime === 0))
                minTime = startTime;
            if(ending === 0)
              if (endTime > maxTime)
                maxTime = endTime;
          });
        });

        ending = maxTime;
        beginning = minTime;
      }

      // draw the axis
      var xScale = d3.time.scale()
        .domain([beginning, ending])
        .range([margin.left, width - margin.right]);

      var xAxis = d3.svg.axis()
        .scale(xScale);

      xAxis.ticks(tickFormat.tickTime, tickFormat.tickInterval);

      // var belowLastItem = (margin.top + (itemHeight + itemMargin) * maxStack);
      var aboveFirstItem = margin.top;
      var timeAxisYPosition = aboveFirstItem;
      appendTimeAxis(g, xAxis, timeAxisYPosition);
    }

    return timeline;
  };
})();
