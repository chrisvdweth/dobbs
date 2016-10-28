var DOBBSModel = new Array();

DOBBSModel.Main = function(controller) {
  this.controller = controller;
  this.tabHandler = new DOBBSModel.TabHandler(this);
  this.windowHandler = new DOBBSModel.WindowHandler(this);
  this.idleHandler = new DOBBSModel.IdleHandler(this);
  this.historyHandler = new DOBBSModel.HistoryHandler(this);
  this.httpHandler = new DOBBSModel.HttpHandler(this);
  
  this.openWindows = new Object();
  this.openWindowTimers = new Object();
  this.openTabs = new Object();
};


DOBBSModel.Main.prototype = {
  
  initialize : function() {
    this.tabHandler.initialize();
    this.windowHandler.initialize();
    this.idleHandler.initialize();
    this.historyHandler.initialize();

  },

  addOpenWindow : function(windowId, dobbsWindowId) { 
    this.openWindows[windowId] = new DOBBSModel.Window(windowId, dobbsWindowId); 
    this.openWindowTimers[windowId] = new DOBBSModel.WindowTimer(this, windowId, dobbsWindowId); 
    this.windowHandler.checkWindowState(windowId);
    this.windowHandler.updateLocalStorage();
  },
  
  deleteOpenWindow : function(windowId) { 
    delete this.openWindows[windowId]; 
    delete this.openWindowTimers[windowId]; 
    this.windowHandler.updateLocalStorage();
  },
  
  getOpenWindow : function(windowId) { return this.openWindows[windowId]; },
  
  setDobbsOpenWindowId : function(windowId, dobbsWindowId) { 
    this.openWindows[windowId].dobbsWindowId = dobbsWindowId; 
    this.openWindowTimers[windowId].dobbsWindowId = dobbsWindowId; 
    this.windowHandler.updateLocalStorage();
  },
};



DOBBSModel.WindowHandler = function(model) {
  this.model = model;
  this.inactiveTimer = null;
  this.inactiveSeconds = 0;
  this.currentFocusedWindowId = -1;
  this.windowStateMapping = { "maximized" : "1", "minimized" : "2", "normal" : "3", "fullscreen" : "4"};
};


DOBBSModel.WindowHandler.prototype = {
  
  initialize : function() {
    var tmpController = this.model.controller;
    var tmpModel = this.model;
    var tmp = this;
    
    chrome.windows.onCreated.addListener( function (window) {
      if ((window.type != "normal") || (window.incognito == true)) { return; }
      tmpModel.addOpenWindow(window.id, -1);
      tmpModel.httpHandler.getUniqueId(window.id, UNIQUE_ID_TYPE__WINDOW); 
    }); 

    chrome.windows.onRemoved.addListener( function (windowId) {
      if (windowId in tmpModel.openWindows) {
        tmpModel.controller.onWindowClosed(tmpModel.getOpenWindow(windowId));
        tmpModel.deleteOpenWindow(windowId);
        tmp.updateLocalStorage();
      }
    }); 

    chrome.windows.onFocusChanged.addListener( function (windowId) {

      if (windowId == chrome.windows.WINDOW_ID_NONE) {
        if (tmp.currentFocusedWindowId in tmpModel.openWindows) {
          var dobbsWindow = tmpModel.openWindows[tmp.currentFocusedWindowId];
          if (dobbsWindow.tabCount > 0) {// workaround to avoid weird onFocusChanged events when closing a window
            tmpModel.openWindowTimers[dobbsWindow.windowId].onDeactivate();
          }
          tmp.currentFocusedWindowId = -1;
        }
        tmp.startInactiveTimer();
        return;
      }
      
      tmp.stopInactiveTimer();
      if (tmpModel.idleHandler.currentActivityState == "idle") {
        tmpModel.idleHandler.currentActivityState = "active";
        tmpModel.idleHandler.onActivityStateChange(1);
      }

      if (tmp.currentFocusedWindowId != windowId) {
        if (tmp.currentFocusedWindowId in tmpModel.openWindows) {
          var dobbsWindow = tmpModel.openWindows[tmp.currentFocusedWindowId];
          if (dobbsWindow.tabCount > 0) {// workaround to avoid weird onFocusChanged events when closing a window
            tmpModel.openWindowTimers[dobbsWindow.windowId].onDeactivate();
          }
        }
        if (windowId in tmpModel.openWindows) {
          var dobbsWindow = tmpModel.openWindows[windowId];
          tmpModel.openWindowTimers[dobbsWindow.windowId].onActivate();
        }

        var d = parseInt(tmp.currentFocusedWindowId);
        tmp.currentFocusedWindowId = windowId;
        
      }
      
    });

  },

  startInactiveTimer : function() {
    if (this.inactiveTimer == null) {
      var temp = this;
      this.inactiveTimer = setInterval(function () { temp.checkInactiveState(); }, TIMER_INTERVAL);
    }
  },
  
  stopInactiveTimer : function() {
    clearInterval(this.inactiveTimer); 
    this.inactiveTimer = null;
    this.inactiveSeconds = 0
  },
  
  checkInactiveState : function() {
    this.inactiveSeconds++
    if (this.model.idleHandler.currentActivityState == "idle") { return; }
    if ((this.inactiveSeconds * 1000) > TIME_IN_MILLISECONDS_UNTIL_IDLING) {
      this.model.idleHandler.currentActivityStateId++;
      this.model.idleHandler.onActivityStateChange(0);
      this.model.idleHandler.currentActivityState = "idle";
    }
  },
  

  updateLocalStorage : function() {
    localStorage[DOBBS_LOCAL_STORAGE_KEY__OPEN_WINDOWS] = JSON.stringify(tmpModel.openWindows);
  },

  
  onResize : function(tabId, newWidth, newHeight) {
    //console.log("onResize : " + tabId + ", " + newWidth + " x " + newHeight);
    var tmp = this;
    var dobbsTab = this.model.openTabs[tabId];
    if (typeof dobbsTab === "undefined") { return; } 
    
    var dobbsWindow = this.model.openWindows[dobbsTab.windowId]
    if (typeof dobbsWindow === "undefined") { return; } 
    
    chrome.windows.get(parseInt(dobbsWindow.windowId), null, function(wnd) {
      if (dobbsWindow.state != tmp.windowStateMapping[wnd.state]) {
        dobbsWindow.state = tmp.windowStateMapping[wnd.state];
        //console.log(tmp.windowStateMapping[dobbsWindow.state]);
        tmpModel.controller.onWindowStateChange(dobbsWindow, true);
        tmp.updateLocalStorage();
      }
    });
  },
  
  checkWindowState : function(wndId) {
    var tmp = this;
    var tmpModel = this.model;
    var dobbsWindow = this.model.openWindows[wndId]
    if (typeof dobbsWindow === "undefined") { return; } 
    chrome.windows.get(parseInt(dobbsWindow.windowId), null, function(wnd) {
      if (dobbsWindow.state != tmp.windowStateMapping[wnd.state]) {
        dobbsWindow.state = tmp.windowStateMapping[wnd.state];
        //console.log(tmp.windowStateMapping[dobbsWindow.state]);
        tmpModel.controller.onWindowStateChange(dobbsWindow, true);
        tmp.updateLocalStorage();
      }
    });

  },
};





DOBBSModel.TabHandler = function(model) {
  this.model = model;
  this.prerendered = false;
  this.tabRemoved = false;
};


DOBBSModel.TabHandler.prototype = {
  
  initialize : function() {
    tmp = this;
    tmpModel = this.model;
    
    chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
      if (changeInfo.status == 'complete') {
        var openTab = tmpModel.openTabs[tabId];
        if (typeof openTab === "undefined") { return; } 
        var openWindow = tmpModel.openWindows[openTab.windowId];
        if (openTab.focusId > 0){
          if (tab.selected) {
            openTab.isBlurred = false;
            tmpModel.controller.onUrlClosedAndBlurred(openWindow, openTab);
          } else {
            openTab.isBlurred = true;
            tmpModel.controller.onUrlClosed(openWindow, openTab);
          }
        }
        openTab.pageLoadId++;
        openTab.componentURL = new DOBBSModel.ComponentURL(tab.url);
        openTab.url = tab.url;
        tmpModel.tabHandler.updateLocalStorage();
        tmpModel.historyHandler.handlePageLoad(tab, openTab);
      }
    });

    chrome.tabs.onCreated.addListener( function (tab) {
      if (tab.windowId in tmpModel.openWindows) {
        var openWindow = tmpModel.openWindows[tab.windowId];
        openWindow.currentTabIdCount++;
        var newTab = new DOBBSModel.Tab(tab.windowId, openWindow.currentTabIdCount, tab.url);
        newTab.componentURL = new DOBBSModel.ComponentURL(tab.url);
        tmpModel.openTabs[tab.id] = newTab;
        if(tab.selected) {
          newTab.isBlurred = false;
          openWindow.activeTabId = tab.id;
        }
        var dobbsWindow = tmpModel.openWindows[tab.windowId];
        dobbsWindow.tabCount++;
        if(dobbsWindow.dobbsSessionId > 0) {
          tmpModel.controller.onTabAdded(dobbsWindow, newTab, true);
        }
        tmpModel.tabHandler.updateLocalStorage();
      }
    }); 

    chrome.tabs.onRemoved.addListener( function(tabId, removeInfo) {
      
      var obsoleteTab = tmpModel.openTabs[tabId];
      if (typeof obsoleteTab === "undefined") { return; } 
      
      if (obsoleteTab.windowId in tmpModel.openWindows) { 
        var openWindow = tmpModel.openWindows[obsoleteTab.windowId];     
        if (openWindow.activeTabId == tabId) {
          tmpModel.controller.onUrlClosedAndBlurred(openWindow, obsoleteTab);
        } else {
          tmpModel.controller.onUrlClosed(openWindow, obsoleteTab);
        }
              
        var dobbsWindow = tmpModel.openWindows[obsoleteTab.windowId]; 
        dobbsWindow.tabCount--;
        tmpModel.controller.onTabClosed(dobbsWindow, obsoleteTab, false);
        tmp.tabRemoved = true;
        
        delete tmpModel.openTabs[tabId];
        tmpModel.tabHandler.updateLocalStorage();
      }
    }); 

    chrome.tabs.onActivated.addListener(function(activeInfo) {
      var activeTab = tmpModel.openTabs[activeInfo.tabId];
      
      if (typeof activeTab === "undefined") { return; } 
      
      if (activeTab.windowId in tmpModel.openWindows) {
        var openWindow = tmpModel.openWindows[activeTab.windowId];
        if (tmp.prerendered == true) {
          // if prerendered, it's not "really" a onActivated event!!!
          chrome.tabs.get(activeInfo.tabId, function (tab) {
            if (activeTab.focusId > 0){
              if (tab.selected) {
                activeTab.isBlurred = false;
                tmpModel.controller.onUrlClosedAndBlurred(openWindow, activeTab);
              } else {
                activeTab.isBlurred = true;
                tmpModel.controller.onUrlClosed(openWindow, activeTab);
              }
            }
            activeTab.pageLoadId++;
            activeTab.componentURL = new DOBBSModel.ComponentURL(tab.url);
            activeTab.url = tab.url;
            tmpModel.tabHandler.updateLocalStorage();
            tmpModel.historyHandler.handlePageLoad(tab, activeTab);
          });
        } else {
          var deactiveTab = tmpModel.openTabs[openWindow.activeTabId];
          try { deactiveTab.isBlurred = true; } catch(err) { }
          activeTab.isBlurred = false;
          if (activeInfo.tabId != openWindow.activeTabId) {
            if (tmp.tabRemoved == false) {
              tmpModel.controller.onTabSelectedUrlBlurred(openWindow, deactiveTab);
            } 
            activeTab.focusId++;
            tmpModel.controller.onTabSelectedUrlFocused(openWindow, activeTab);
            openWindow.activeTabId = activeInfo.tabId;
            tmp.tabRemoved = false;
          }
          tmpModel.tabHandler.updateLocalStorage();
        }
        tmp.prerendered = false;
      }
    }); 


    
    
    //
    // Repairs the prerendering issue
    //
    chrome.webNavigation.onTabReplaced.addListener( function (details) {
      tmpModel.openTabs[details.tabId] = tmpModel.openTabs[details.replacedTabId];
      delete tmpModel.openTabs[details.replacedTabId];
      var openTab = tmpModel.openTabs[details.tabId];
      if (typeof openTab === "undefined") { tmp.prerendered = true; return; } 
      if (openTab.windowId in tmpModel.openWindows) {
        var openWindow = tmpModel.openWindows[openTab.windowId];
        openWindow.activeTabId = details.tabId;
      }
      tmp.prerendered = true;
      tmpModel.tabHandler.updateLocalStorage();
    }); 
  },
  
  registerAllTabs : function(wndId) {
    var tmpModel = this.model;
    chrome.tabs.query({windowId : wndId}, function(tabs){
      for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        if (tab.windowId in tmpModel.openWindows) {
          var openWindow = tmpModel.openWindows[tab.windowId];
          openWindow.currentTabIdCount++;
          openWindow.tabCount++;
          var newTab = new DOBBSModel.Tab(tab.windowId, openWindow.currentTabIdCount, tab.url);
          newTab.componentURL = new DOBBSModel.ComponentURL(tab.url);
          tmpModel.openTabs[tab.id] = newTab;
          var dobbsWindow = tmpModel.openWindows[tab.windowId];
          if(dobbsWindow.dobbsSessionId > 0) {
            tmpModel.controller.onTabAdded(dobbsWindow, newTab, true);
          }
        }
      }
      tmpModel.tabHandler.updateLocalStorage();
    });
  },
    
  checkAllTabs : function(wndId) {
    var tmpModel = this.model;
    chrome.tabs.query({ windowId : wndId}, function(tabs){
      for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        if (tab.windowId in tmpModel.openWindows) {
          var openTab = tmpModel.openTabs[tab.id];
          var openWindow = tmpModel.openWindows[tab.windowId];
          openTab.pageLoadId++;
          if(tab.selected) {
            openWindow.activeTabId = tab.id;
            openTab.focusId++;
            tmpModel.controller.onUrlLoadedAndFocused(openWindow, openTab);
          } else {
            tmpModel.controller.onUrlLoaded(openWindow, openTab);
          }
        }
      }
      tmpModel.tabHandler.updateLocalStorage();
    });
  },
  
  updateLocalStorage : function() {
    localStorage[DOBBS_LOCAL_STORAGE_KEY__OPEN_TABS] = JSON.stringify(tmpModel.openTabs);
  },
  
};





DOBBSModel.IdleHandler = function(model) {
  this.model = model;
  this.currentActivityState = "active";
  this.currentActivityStateId = 0;
};


DOBBSModel.IdleHandler.prototype = {
  
  initialize : function() {
    var tmp = this;
    chrome.idle.setDetectionInterval(60) ;
    chrome.idle.onStateChanged.addListener( function (newState) {  
      
      if (tmp.currentActivityState == newState) { return; }
  
      if (newState == "idle") {
        tmp.currentActivityStateId++;
        tmp.onActivityStateChange(0);
        tmp.currentActivityState = newState;
      } else if (newState = "active") {
        chrome.windows.getCurrent(null, function(window) {
          if (window.focused == true) {
            tmp.currentActivityState = newState;
            tmp.onActivityStateChange(1);
          }else {
              //console.log("no window has the focus => stay idling");
          }
        });
      } else if (newState = "locked") {
        console.log("LOCKED");
      } else {
    
      }
    }); 
  },
  
  
  onActivityStateChange : function(state) {
    for (dobbsWindow in this.model.openWindows) {
      this.model.controller.onActivityStateChange(this.model.openWindows[dobbsWindow], state, true);
    }
  },

};





DOBBSModel.HistoryHandler = function(model) {
  this.model = model;
  this.transistionsLink = ["link"];
  this.transistionsTyped = ["typed", "generated", "start_page", "reload", "keyword", "keyword_generated"];
  this.transistionsBookmark = ["auto_bookmark"];
  this.pageLoadSource = PAGE_LOAD_SOURCE__TYPED;
};


DOBBSModel.HistoryHandler.prototype = {
  
  initialize : function() {
    var tmpController = this.model.controller;
  },
  

  handlePageLoad : function(windowTab, dobbsTab) {
    tmp = this;
    tmpModel = this.model;
    chrome.history.getVisits({url:windowTab.url}, function(visitItems){
      if(visitItems.length > 0) {
        var last = visitItems[visitItems.length-1]
        if($.inArray(last.transition, tmp.transistionsLink) > -1) { tmp.pageLoadSource = PAGE_LOAD_SOURCE__LINK; }
        else if ($.inArray(last.transition, tmp.transistionsTyped) > -1) { tmp.pageLoadSource = PAGE_LOAD_SOURCE__TYPED; }
        else if ($.inArray(last.transition, tmp.transistionsBookmark) > -1) { tmp.pageLoadSource = PAGE_LOAD_SOURCE__BOOKMARK; }
        else { tmp.pageLoadSource = PAGE_LOAD_SOURCE__UNKNOWN; }
        dobbsTab.pageLoadSource = tmp.pageLoadSource;
        var dobbsWindow = tmpModel.openWindows[dobbsTab.windowId];
        if (windowTab.selected) {
          tmpModel.controller.onUrlLoadedAndFocused(dobbsWindow, dobbsTab);
        } else {
          tmpModel.controller.onUrlLoaded(dobbsWindow, dobbsTab);
        }
      }
      tmpModel.tabHandler.updateLocalStorage();
    });
    
  },
  
};




DOBBSModel.HttpHandler = function(model) {
  this.model = model;
};

DOBBSModel.HttpHandler.prototype = {
 
  doAjaxPostRequest : function(serverUrl, postData, isAsynchronousRequest, successCallback, errorCallback) {
    $.ajax({
      url: serverUrl, type: "post", data: postData, dataType: "xml", 
      async: isAsynchronousRequest, timout: DOBBS_HTTP_REQUEST_TIMEOUT_IN_MILLISECONDS,
      success: function(response, status, request){ if (successCallback != null) { successCallback(response, status, request); } },
      error: function(request, status, error){ if (errorCallback != null) { errorCallback(request, status, error); } }
    });
  },
  
  
  logSessionEvent : function (doAsyncRequest, userID, windowID, sessionID, event, matchId, time, tzOffset) {
    args = {user_id: userID, window_id : windowID, session_id : sessionID, event : event, match_id : matchId, time : time, tz_offset : tzOffset, browser : DOBBS_BROWSER, version : DOBBS_VERSION};
    if (doAsyncRequest)
      this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__LOG_SESSION_EVENT, args, true,
           DOBBSModel.Utility.bind(this, this.onLogResultReceived),
           DOBBSModel.Utility.bind(this, this.onError)
          );
    else 
      this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__LOG_SESSION_EVENT, args, false, null,
           DOBBSModel.Utility.bind(this, this.onError));
  },
  
  
  
  logWindowEvent : function (doAsyncRequest, userID, windowID, sessionID, event, matchId, tabId, tabCount, windowState, time, tzOffset) {
    args = {user_id: userID, window_id : windowID, session_id : sessionID, event : event, match_id : matchId, tab_id : tabId, tab_count: tabCount, state: windowState, time : time, tz_offset : tzOffset, browser : DOBBS_BROWSER, version : DOBBS_VERSION};
    if (doAsyncRequest)
      this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__LOG_WINDOW_EVENT, args, true,
           DOBBSModel.Utility.bind(this, this.onLogResultReceived),
           DOBBSModel.Utility.bind(this, this.onError)
          );
    else 
      this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__LOG_WINDOW_EVENT, args, false, null,
           DOBBSModel.Utility.bind(this, this.onError));
  },
  
  logBrowseEvent : function (doAsyncRequest, userID, windowID, sessionID, tabID, loadID, focusID, fullUrl, domainPath, subdomain, domain, event, source, time, tzOffset) {
    args = {user_id: userID, window_id : windowID, session_id : sessionID, tab_id : tabID, load_id : loadID, focus_id : focusID, full_url: fullUrl, domain_path : domainPath, subdomain : subdomain, domain : domain, event : event, source: source, time : time, tz_offset : tzOffset, browser : DOBBS_BROWSER, version : DOBBS_VERSION};
    if (doAsyncRequest)
      this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__LOG_BROWSER_EVENT, args, true,
           DOBBSModel.Utility.bind(this, this.onLogResultReceived),
           DOBBSModel.Utility.bind(this, this.onError));
    else 
      this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__LOG_BROWSER_EVENT, args, false, null,
           DOBBSModel.Utility.bind(this, this.onError));
  },
  

  onLogResultReceived : function(response, status, request) {
    var code = $(response).find("resultcode").text();
    if (code != 0) { this.model.controller.onHttpError(); }
  },
  

  
  getUniqueId : function(windowId, typeOfId) {
    var args = {wnd_id: windowId, id_type : typeOfId, browser : DOBBS_BROWSER };
    this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__GET_UNIQUE_ID, args, true,
         DOBBSModel.Utility.bind(this, this.onUniqueIdReceived),
         DOBBSModel.Utility.bind(this, this.onError)
        );
  },
  
  
  onUniqueIdReceived : function(response, status, request) {
    this.model.controller.onUniqueIdReceived(response);
  },
  
  onError : function(request, status, error) {  },

  
};



// DOBBSModel.Utility = {
//   bind : function(context, method, arguments) {
//     if (!arguments) { arguments = new Array(); }
//     return function() { return method.apply(context, arguments); };
//   },
// 
// 
// };


DOBBSModel.Window = function(windowId, dobbsWindowId) {
  this.windowId = windowId;
  this.dobbsWindowId = dobbsWindowId;
  this.dobbsSessionId = -1
  this.matchIdSession = -1;
  this.activeTabId = -1;
  this.currentTabIdCount = 0;
  this.matchIdIdle = -1;
  this.isIdling = false;
  this.isBlurred = false;
  this.matchIdFocus = -1; 
  this.width = 0;
  this.height = 0;
  this.tabCount = 0;
  this.state = 0;
  this.focusTimer = null;
  this.currentFocusState = 1;
  this.inactiveSince = 0;
  this.matchIdManual = -1;
};



DOBBSModel.WindowTimer = function(model, windowId, dobbsWindowId) {
  this.model = model;
  this.windowId = windowId;
  this.dobbsWindowId = dobbsWindowId;
};

DOBBSModel.WindowTimer.prototype = {

  onActivate : function() {
    this.stopTimer();
  },
  
  onDeactivate : function() {
    if (this.windowId in this.model.openWindows) {
      this.inactiveSince = new Date().getTime();
      this.startTimer();
    }
  },
  
      
  startTimer : function() {
    if (this.focusTimer == null) {
      var temp = this;
      this.focusTimer = setInterval(function () { temp.checkFocusState(); }, TIMER_INTERVAL);
    }
  },
    
  stopTimer : function() {
    if (this.focusTimer != null) { clearInterval(this.focusTimer); this.focusTimer = null; }
    if (this.currentFocusState == 0) { 
      this.currentFocusState = 1; 
      this.model.controller.onWindowFocused(this.model.openWindows[this.windowId], true);
    }
  },
    
  checkFocusState : function() {
    if (this.currentFocusState == 0) { return; }
      
    var currentTime = new Date().getTime();
    if ((currentTime - this.inactiveSince) > TIME_IN_MILLISECONDS_UNTIL_DEACTIVATED) {
      if (this.windowId in this.model.openWindows) {
        this.model.controller.onWindowBlurred(this.model.openWindows[this.windowId], true);
      }
      this.stopTimer();
      this.currentFocusState = 0;
    }
  },
  
  
};   

DOBBSModel.Tab = function(windowId, tabId, url) {
  this.windowId = windowId;
  this.tabId = tabId;
  this.url = url
  this.pageLoadId = -1;
  this.focusId = 0;
  this.componentURL = new DOBBSModel.ComponentURL(url);
  this.isBlurred = true;
  this.pageLoadSource = PAGE_LOAD_SOURCE__UNKNOWN;
};



DOBBSModel.ComponentURL = function(url) {
 this.fullURL = DOBBSModel.Utility.stripURLPrefix(url);
 this.domainPath = DOBBSModel.Utility.getBareURL(this.fullURL);
 this.subdomain = DOBBSModel.Utility.getSubdomain(url);
 this.domain = DOBBSModel.Utility.getDomain(this.subdomain);
}



DOBBSModel.Utility = {
//   bind : function(scope, fn, args) {
//     if (!args) {
//       args = new Array();
//     }
//     return function() {
//       fn.apply(scope, args);
//     };
//   },

  bind : function(context, method, arguments) {
    if (!arguments) { arguments = new Array(); }
    return function() { return method.apply(context, arguments); };
  },
  
  trim : function(str) {
    return str.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
  },
  
  hashCode : function(str) {
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
      char = str.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  },
  
  getSize : function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
  },
  
  getEndOfURL : function(url) {
    var temp1 = url.indexOf("#");
    var temp2 = url.indexOf("?");
    
    if (temp1 == -1) {
      return temp2;
    } else if (temp2 == -1) {
      return temp1;
    } else {
      return Math.min(temp1, temp2);
    }
  },

  getBareURL : function(url) {
    url = String(url);
    var endOfURL = DOBBSModel.Utility.getEndOfURL(url);
    if (endOfURL > 0) {
      url = url.substring(0, endOfURL);
    }
    return url;
  },

  getURLParameter : function(url) {
    url = String(url);
    var endOfURL = DOBBSModel.Utility.getEndOfURL(url);
    if (endOfURL > 0) {
      return url.substring(endOfURL);
    }
    return null;
  },

  getSubdomain : function(url) {
    try {
      var domainWithPort = (url.match(/:\/\/(.[^/]+)/)[1]).replace('www.','');
      return domainWithPort.split(':')[0];
    } catch (e) {
      return ""; 
    }
  },
  
  getDomain : function(url) {
    try {
      if (url.indexOf(".") == -1) { return ""; }
      var elem = url.split('.');
      return elem[elem.length-2] + "." + elem[elem.length-1];
    } catch (e) {
      return ""; 
    }
  },


  stripURLPrefix : function(url) {
    var wwwPos = url.indexOf("www");
    if (wwwPos > -1) {
      return url.substring(wwwPos + 4); // 4 = length of "www."
    }
    var protocolPos = url.indexOf("://");
    if (protocolPos > -1) {
      return url.substring(protocolPos + 3); 
    }
    return "";
  }
  
  
};
