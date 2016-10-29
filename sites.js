/**
 * Stores the time that is spent on each site.
 *
 * The primary interface to this class is through setCurrentFocus.
 */
function Sites(config) {
  this._config = config;
  if (!localStorage.sites) {
    localStorage.sites = JSON.stringify({});
  }
  this._currentSite = null;
  this._currentTabId = null;
  this._siteRegexp = /^(\w+:\/\/[^\/]+).*$/;
  this._startTime = null;
  this._parentUrl = null;
}

/**
 * Returns the a dictionary of site -> seconds.
 */
Object.defineProperty(Sites.prototype, "sites", {
  get: function() {
    var s = JSON.parse(localStorage.sites);
    var sites = {};
    for (var tabId in s) {
      if (s.hasOwnProperty(tabId)) {
        sites[tabId] = {};
        sites[tabId] = s[tabId];
      }
    }
    return sites;
  }
});

/**
 * Returns just the site/domain from the url. Includes the protocol.
 * chrome://extensions/some/other?blah=ffdf -> chrome://extensions
 * @param {string} url The URL of the page, including the protocol.
 * @return {string} The site, including protocol, but not paths.
 */
Sites.prototype.getSiteFromUrl = function(url) {
  var match = url.match(this._siteRegexp);
  if (match) {
    return match[1];
  }
  return null;
};

Sites.prototype._updateTime = function() {
  if (!this._currentSite || !this._startTime) {
    return;
  }
  var delta = new Date() - this._startTime;
  console.log("Site: " + this._currentSite + " Delta = " + delta/1000);
  if (delta/1000/60 > 2*this._config.updateTimePeriodMinutes) {
    console.log("Delta of " + delta/1000 + " seconds too long; ignored.");
    return;
  }
  var sites = this.sites;
  if (!sites[this._currentTabId]) {
    sites[this._currentTabId] = {};
  }
  if (!sites[this._currentTabId][this._currentSite]) {
    if (this._parentUrl) {
      console.warn("parent URL!!!!!!!");
      console.warn(this._parentUrl);
    }
    sites[this._currentTabId][this._currentSite] = {duration: 0, startTime: this._startTime, url: this._currentSite, parentUrl: this._parentUrl};
  }
  sites[this._currentTabId][this._currentSite].duration += delta/1000;
  localStorage.sites = JSON.stringify(sites);
};

/**
 * This method should be called whenever there is a potential focus change.
 * Provide url=null if Chrome is out of focus.
 */
Sites.prototype.setCurrentFocus = function(tab) {
  this._updateTime();
  if (tab.url == null) {
    this._currentSite = null;
    this._startTime = null;
    this._currentTabId = null;
    this._parentUrl = null;
    chrome.browserAction.setIcon(
      {path: {19: 'images/icon_paused19.png',
        38: 'images/icon_paused38.png'}});
  } else {
    this._currentTabId = tab.id;
    this._currentSite = this.getSiteFromUrl(tab.url);
    this._startTime = new Date();
    console.warn(tab);
    this._parentUrl = tab.parentUrl ? this.getSiteFromUrl(tab.parentUrl) : null;
    chrome.browserAction.setIcon(
      {path: {19: 'images/icon19.png',
        38: 'images/icon38.png'}});
  }
};

/**
 * This method should be called whenever a tab is closed
 */
Sites.prototype.setAsClosed = function(tab) {
  var url = tab.url ? this.getSiteFromUrl(tab.url) : null;
  console.warn(url);
  if (url) {
    var sites = this.sites;
    if(sites[tab.id]) {
      console.warn(sites[tab.id][url]);
      sites[tab.id][url].endTime = new Date();
      localStorage.sites = JSON.stringify(sites);
    }
  }
};

/**
 * Clear all statistics.
 */
Sites.prototype.clear = function() {
  localStorage.sites = JSON.stringify({});
  this._config.lastClearTime = new Date().getTime();
};
