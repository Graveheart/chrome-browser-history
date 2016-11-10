(function () {
  d3.timeline = function() {
    var width = null,
    tickFormat = {
      format: function(d) { return d3.time.format("%H:%M")(d) },
      tickTime: d3.time.minutes,
      tickInterval: 30,
      tickSize: 15
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

      // g.each(function (d, i) {
      //   d.forEach(function (datum, index) {
      //     var startTime = datum.since.valueOf();
      //     var endTime = datum.until.valueOf();
      //     if(index === 0){
      //       originTime = startTime;               //Store the timestamp that will serve as origin
      //       datum.since = 0;                        //Set the origin
      //       datum.until = moment(endTime - originTime);     //Store the relative time (millis)
      //     }else{
      //       datum.since = moment(startTime - originTime);
      //       datum.until = moment(endTime - originTime);
      //     }
      //   });
      // });

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
      
      if (width > 700) {
        tickFormat.tickTime = 10;
      }
      else {
        tickFormat.tickTime = 5;
      }

      xAxis.ticks(tickFormat.tickTime, tickFormat.tickInterval);

      // var belowLastItem = (margin.top + (itemHeight + itemMargin) * maxStack);
      var aboveFirstItem = margin.top;
      var timeAxisYPosition = aboveFirstItem;
      appendTimeAxis(g, xAxis, timeAxisYPosition);
    }

    return timeline;
  };
})();
