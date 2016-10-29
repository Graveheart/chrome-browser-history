var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-45267314-2']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

var config = new Config();
var gsites = new Sites(config);

function secondsToString(seconds) {
  if (config.timeDisplayFormat == Config.timeDisplayFormatEnum.MINUTES) {
    return (seconds/60).toFixed(2);
  }
  var years = Math.floor(seconds / 31536000);
  var days = Math.floor((seconds % 31536000) / 86400);
  var hours = Math.floor(((seconds % 31536000) % 86400) / 3600);
  var mins = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
  var secs = (((seconds % 31536000) % 86400) % 3600) % 60;
  var s = "";
  if (years) {
    s = s + " " + years + "y";
  }
  if (days) {
    s = s + " " + days + "d";
  }
  if (hours) {
    s = s + " " + hours + "h";
  }
  if (mins) {
    s = s + " " + mins + "m";
  }
  if (secs) {
    s = s + " " + secs.toFixed(0) + "s";
  }
  return s;
}

function addLocalDisplay() {
  var old_tbody = document.getElementById("stats_tbody");
  var tbody = document.createElement("tbody");
  tbody.setAttribute("id", "stats_tbody");
  old_tbody.parentNode.replaceChild(tbody, old_tbody);

  /* Sort sites by time spent */
  var sites = gsites.sites;
  var sortedSites = new Array();
  var totalTime = 0;
  for (tabId in sites) {
    for (site in sites[tabId]) {
      var siteInfo = sites[tabId][site];
      sortedSites.push([tabId, siteInfo]);
      totalTime += siteInfo.duration;
    }
  }
  sortedSites.sort(function(a, b) {
    return b[0] - a[0];
  });

  /* Show only the top 15 sites by default */
  var max = 15;
  if (document.location.href.indexOf("show=all") != -1) {
    max = sortedSites.length;
  }

  /* Add total row. */
  var row = document.createElement("tr");
  var cell = document.createElement("td");
  cell.innerHTML = "<b>Total</b>";
  row.appendChild(cell);
  cell = document.createElement("td");
  cell.appendChild(document.createTextNode(secondsToString(totalTime)));
  row.appendChild(cell);
  cell = document.createElement("td");
  row.appendChild(cell);
  cell = document.createElement("td");
  row.appendChild(cell);
  cell = document.createElement("td");
  row.appendChild(cell);
  cell = document.createElement("td");
  row.appendChild(cell);
  cell = document.createElement("td");
  cell.appendChild(document.createTextNode(("100")));
  row.appendChild(cell);
  row = setPercentageBG(row,0);
  tbody.appendChild(row);

  var maxTime = 0;
  if (sortedSites.length) {
    // get first url's duration as default one for maxTime
    var firstUrl = sites[sortedSites[0][0]][Object.keys(sites[sortedSites[0][0]])[0]].duration;
  }
  var relativePct = 0;
  for (var index = 0; ((index < sortedSites.length) && (index < max));
       index++ ){
    var tabId = sortedSites[index][0];
    var site = sortedSites[index][1].url;
    var siteInfo = sites[tabId][site];
    row = document.createElement("tr");
    cell = document.createElement("td");
    var a = document.createElement('a');
    var linkText = document.createTextNode(site);
    a.appendChild(linkText);
    a.title = "Open link in new tab";
    a.href = site;
    a.target = "_blank";
    cell.appendChild(a);
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.appendChild(document.createTextNode(secondsToString(siteInfo.duration)));
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.appendChild(document.createTextNode(tabId));
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.appendChild(document.createTextNode(siteInfo.parentUrl ? siteInfo.parentUrl : ''));
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.appendChild(document.createTextNode(formatDate(siteInfo.startTime)));
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.appendChild(document.createTextNode(formatDate(siteInfo.endTime)));
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.appendChild(document.createTextNode(
      (siteInfo.duration / totalTime * 100).toFixed(2)));
    relativePct = (siteInfo.duration/maxTime*100).toFixed(2);
    row = setPercentageBG(row,relativePct);
    row.appendChild(cell);
    tbody.appendChild(row);
  }

  /* Show the "Show All" link if there are some sites we didn't show. */
  if (max < sortedSites.length && document.getElementById("show") == null) {
    /* Add an option to show all stats */
    var showAllLink = document.createElement("a");
    showAllLink.onclick = function() {
      chrome.tabs.create({url: "popup.html?show=all"});
    }
    showAllLink.setAttribute("id", "show");
    showAllLink.setAttribute("href", "javascript:void(0)");
    showAllLink.setAttribute("class", "pure-button");
    showAllLink.appendChild(document.createTextNode("Show All"));
    document.getElementById("button_row").appendChild(showAllLink);
  } else if (document.getElementById("show") != null) {
    var showLink = document.getElementById("show");
    showLink.parentNode.removeChild(showLink);
  }
}

function setPercentageBG(row,pct) {
  var color = "#e8edff";
  row.style.backgroundImage = "-webkit-linear-gradient(left, "+color+" "+pct+"%,#ffffff "+pct+"%)";
  row.style.backgroundImage = "    -moz-linear-gradient(left, "+color+" "+pct+"%, #ffffff "+pct+"%)";
  row.style.backgroundImage = "     -ms-linear-gradient(left, "+color+" "+pct+"%,#ffffff "+pct+"%)";
  row.style.backgroundImage = "      -o-linear-gradient(left, "+color+" "+pct+"%,#ffffff "+pct+"%)";
  row.style.backgroundImage = "         linear-gradient(to right, "+color+" "+pct+"%,#ffffff "+pct+"%)";
  return row;
}

function formatDate(date) {
  return moment(date).format('MM/DD/YYYY h:mm a');
}

function clearStats() {
  chrome.extension.sendMessage({action: "clearStats"}, function(response) {
    initialize();
  });
}

function initialize() {
  addLocalDisplay();

  if (config.lastClearTime) {
    var div = document.getElementById("lastClear");
    if (div.childNodes.length == 1) {
      div.removeChild(div.childNodes[0]);
    }
    div.appendChild(
      document.createTextNode("Last Reset: " + new Date(
          config.lastClearTime).toString()));
  }

  var nextClearStats = config.nextTimeToClear;
  if (nextClearStats) {
    nextClearStats = parseInt(nextClearStats, 10);
    nextClearStats = new Date(nextClearStats);
    var nextClearDiv = document.getElementById("nextClear");
    if (nextClearDiv.childNodes.length == 1) {
      nextClearDiv.removeChild(nextClearDiv.childNodes[0]);
    }
    nextClearDiv.appendChild(
      document.createTextNode("Next Reset: " + nextClearStats.toString()));
  }
}

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("clear").addEventListener("click", clearStats);
  document.getElementById("options").addEventListener("click",
    function() { chrome.runtime.openOptionsPage(); });
  var buttons = document.querySelectorAll("button");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function(e) {
      _gaq.push(["_trackEvent", e.target.id, "clicked"]);
    });
  }
  initialize();
});
