var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-45267314-2']);
_gaq.push(['_trackPageview']);

var config = new Config();
var sites = new Sites(config);

function updateClearStatsInterval() {
  var select = document.getElementById("clear_stats_interval");
  var option = select.options[select.selectedIndex];
  config.clearStatsInterval = option.value;
  // TODO(nav): Set nextTimeToClear in Config
  restoreOptions();
}

function updateTimeDisplay() {
  var select = document.getElementById("time_display");
  var option = select.options[select.selectedIndex];
  config.timeDisplayFormat = option.value;
  restoreOptions();
}

// Restores options from localStorage, if available.
function restoreOptions() {
  var clearStatsInterval = config.clearStatsInterval;
  select = document.getElementById("clear_stats_interval");
  for (var i = 0; i < select.options.length; i++) {
    var option = select.options[i];
    if (option.value == clearStatsInterval) {
      option.selected = true;
      break;
    }
  }

  var timeDisplay = config.timeDisplayFormat;
  select = document.getElementById("time_display");
  for (var i = 0; i < select.options.length; i++) {
    var option = select.options[i];
    if (option.value == timeDisplay) {
      option.selected = true;
      break;
    }
  }
}

function download() {
  var csvContent = "data:text/csv;charset=utf-8,";
  var sitesDict = sites.sites;
  var pairs = [];
  for (var site in sitesDict) {
    if (sitesDict.hasOwnProperty(site)) {
      pairs.push(site + "," + sitesDict[site].duration);
    }
  }
  csvContent += pairs.join("\n");
  window.open(encodeURI(csvContent));
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("clear_stats_interval").addEventListener(
    "change", updateClearStatsInterval);
  document.getElementById("time_display").addEventListener(
    "change", updateTimeDisplay);
  document.getElementById("download").addEventListener(
    "click", download);
  restoreOptions();
});

