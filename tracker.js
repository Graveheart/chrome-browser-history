/**
 * Responsible for detecting focus change from tabs and windows.
 */
function Tracker(config, sites) {
  this._sites = sites;
  this._currentParentUrl = null;
  this._parentUrls = {};
  var self = this;
  var tabUrls = {};
  chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
      // This tab has updated, but it may not be on focus.
      // It is more reliable to request the current tab URL.
      if (tabUrls[tab.id] !== tab.url) {
        if (tab.url) {
          self._sites.setAsClosed({id: tabId, url: tabUrls[tab.id]});
          self._currentParentUrl = tabUrls[tab.id];
        }
        else {
          self._currentParentUrl = null;
        }
        tabUrls[tabId] = tab.url;
      }
      self._updateTimeWithCurrentTab();
    }
  );
  chrome.tabs.onActivated.addListener(function(info) {
    chrome.tabs.get(info.tabId, function(tab) {
      tabUrls[tab.id] = tab.url;
      console.warn("Tab activated with id: " + info.tabId + " and url: " + tab.url);
      console.warn(tab.id);
      console.warn(self._parentUrls);
      if (self._parentUrls[tab.id]) {
        tab.parentUrl = self._parentUrls[tab.id];
        delete self._parentUrls[tab.id];
      }
      self._sites.setCurrentFocus(tab);
    });
  });
  chrome.tabs.onCreated.addListener(function(tab) {
    console.warn("tab created");
  });
  chrome.tabs.onRemoved.addListener(function(tabId, info) {
    self._sites.setAsClosed({id: tabId, url: tabUrls[tabId]});
  });
  chrome.windows.onFocusChanged.addListener(
    function(windowId) {
      if (windowId == chrome.windows.WINDOW_ID_NONE) {
        self._sites.setCurrentFocus({url: null});
        return;
      }
      self._updateTimeWithCurrentTab();
    }
  );
  chrome.idle.onStateChanged.addListener(function(idleState) {
    if (idleState == "active") {
      config.idle = false;
      self._updateTimeWithCurrentTab();
    } else {
      config.idle = true;
      self._sites.setCurrentFocus({url: null});
    }
  });
  chrome.alarms.create(
    "updateTime",
    {periodInMinutes: config.updateTimePeriodMinutes});
  chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name == "updateTime") {
      // These event gets fired on a periodic basis and isn't triggered
      // by a user event, like the tabs/windows events. Because of that,
      // we need to ensure the user is not idle or we'll track time for
      // the current tab forever.
      if (!config.idle) {
        self._updateTimeWithCurrentTab();
      }
      // Force a check of the idle state to ensure that we transition
      // back from idle to active as soon as possible.
      chrome.idle.queryState(60, function(idleState) {
        if (idleState == "active") {
          config.idle = false;
        } else {
          config.idle = true;
          self._sites.setCurrentFocus({url: null});
        }
      });
    }
  });
  chrome.webNavigation.onCreatedNavigationTarget.addListener(function(details) {
    console.warn(details);
    self._parentUrls[details.tabId] = tabUrls[details.sourceTabId];
    console.warn(self._parentUrls);
  });
}

Tracker.prototype._updateTimeWithCurrentTab = function() {
  var self = this;
  chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
    if (tabs.length == 1) {
      // Is the tab in the currently focused window? If not, assume Chrome
      // is out of focus. Although we ask for the lastFocusedWindow, it's
      // possible for that window to go out of focus quickly. If we don't do
      // this, we risk counting time towards a tab while the user is outside of
      // Chrome altogether.
      var tab = tabs[0];
      console.warn(tab.id);
      console.warn(self._parentUrls);
      if (self._parentUrls[tab.id]) {
        tab.parentUrl = self._parentUrls[tab.id];
        delete self._parentUrls[tab.id];
      }
      else {
        tab.parentUrl = self._currentParentUrl;
      }
      chrome.windows.get(tabs[0].windowId, function(win) {
        if (!win.focused) {
          tab = null;
        }
        self._sites.setCurrentFocus(tab);
      });
    }
  });
};
