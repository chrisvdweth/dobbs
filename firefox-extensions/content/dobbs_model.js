var DOBBSModel = new Array();

DOBBSModel.STATE_START = Components.interfaces.nsIWebProgressListener.STATE_START;
DOBBSModel.STATE_STOP = Components.interfaces.nsIWebProgressListener.STATE_STOP;



DOBBSModel.Main = function(controller) {
  this.controller = controller;
  this.userID = -1;
  this.changeListener = null;
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
  this.mainWindow = wm.getMostRecentWindow("navigator:browser");
  this.openedTabList = new DOBBSModel.TabList(this);
  this.httpConnection = new DOBBSHTTP.Main(this);
  this.container = this.mainWindow.gBrowser.tabContainer;
  this.currentDisplayedURL = "";
  this.doLogging = true;
  this.pageLoadSource = PAGE_LOAD_SOURCE__TYPED;
  this.pageVisibilitySource = VISIBILITY_SOURCE_PAGELOAD;
  this.historyService = Components.classes["@mozilla.org/browser/nav-history-service;1"].getService(Components.interfaces.nsINavHistoryService);
  this.historyObserver = new DOBBSModel.HistoryObserver(this);
  this.observer = new DOBBSModel.Observer(this);
  
  
  
};


DOBBSModel.Main.prototype = {
  
  initialize : function() {
    this.doLogging = true;
    this.historyService.addObserver(this.historyObserver, false);
    this.observer.register();
    this.openedTabList.initialize();
  },
  
  unload : function(hasError) {
    this.doLogging = false;
    this.openedTabList.unload(hasError);
    try { this.observer.unregister(); } catch (e) { dump("Exception: unable to unregister DOBBSModel.Observer\n"); }
    try { this.historyService.removeObserver(this.historyObserver); } catch (e) { dump("Exception: unable to remove HistoryObserver\n"); }
  },
  
  onVisit : function(aTransitionType) { this.pageLoadSource = aTransitionType; },

};




DOBBSModel.TabList = function(main) {
  this.main = main;
  this.tabList = new Object();
  this.nextId = 1;
  this.currentTabID = null;
  this.handlePageLoadEvent = true;
  this.refocus = false;
  
  this.tab_added_handler;
  this.tab_closed_handler;
  this.tab_selected_handler;
  
  this.historyListener = new DOBBSModel.HistoryListener(this);
  
  this.isInitialized = false;
};

DOBBSModel.TabList.prototype = {
  
  initialize : function() {
    url = gBrowser.contentDocument.location.href.toString();
    var container = gBrowser.tabContainer;
    var temp = this;
    for (var i = 0; i < container.itemCount; ++i) {
      var tab = container.getItemAtIndex(i);
      tab.setAttribute("tabid", this.nextId);
      var browser = gBrowser.getBrowserForTab(tab);
      browser.setAttribute("tabid", this.nextId);
      tabUrl = browser.contentDocument.location.href.toString();
      var newTab = new DOBBSModel.Tab(this.nextId, tabUrl);
      newTab.componentURL = new DOBBSModel.ComponentURL(tabUrl);
      this.tabList[tab.getAttribute("tabid")] = newTab;
      newTab.listener = function(event) { temp.afterPageLoadListener.call(temp, event, browser); };
      browser.addEventListener("load", newTab.listener, true);
      browser.sessionHistory.addSHistoryListener(this.historyListener);
      this.main.controller.onTabAdded(newTab, true);
      if (tabUrl == url) {
	this.main.controller.onUrlLoadedAndFocused(newTab);
	this.main.currentDisplayedURL = newTab.uri.toString();
      } else {
	this.main.controller.onUrlLoaded(newTab);
      }
      this.nextId ++;
    }
    
    var temp = this;
     
    this.tab_added_handler = function(event) { temp.onTabAdded.call(temp, event); };
    container.addEventListener("TabOpen", this.tab_added_handler, false);
    
    this.tab_closed_handler = function(event) { temp.onTabClosed.call(temp, event); };
    container.addEventListener("TabClose", this.tab_closed_handler, false);
    
    this.tab_selected_handler = function(event) { temp.onTabSelected.call(temp, event); };
    container.addEventListener("TabSelect", this.tab_selected_handler, false);
    
    this.currentTabID = container.selectedItem.getAttribute("tabid");
    
    this.isInitialized = true;
    
  },
  
  unload : function(hasError) {
    if (!this.isInitialized) { return; }
    var container = gBrowser.tabContainer;

    container.removeEventListener("TabOpen", this.tab_added_handler, false);
    container.removeEventListener("TabClose", this.tab_closed_handler, false);
    container.removeEventListener("TabSelect", this.tab_selected_handler, false);

    if (hasError == true)
      return;

    for (var i = 0; i < container.itemCount; ++i) {
      var tab = container.getItemAtIndex(i);
      var tabID = tab.getAttribute("tabid");
      var cTab = this.tabList[tabID];
      tab.addEventListener("load", cTab.listener, true);
      if (this.currentTabID == tabID) {
	this.main.controller.onUrlClosedAndBlurredAtUnload(cTab);
      } else {
	this.main.controller.onUrlClosedAtUnload(cTab);
      }
      this.main.controller.onTabClosed(cTab, false);
    }

    this.isInitialized = false;
  },
  

  
  onTabAdded : function(event) {
    var tabid = String(this.nextId ++);
    event.target.setAttribute("tabid", tabid);
    var browser = gBrowser.getBrowserForTab(event.target);
    gBrowser.getBrowserForTab(event.target).setAttribute("tabid", tabid);

    var temp = this;
    var newTab = new DOBBSModel.Tab(tabid, browser.contentDocument.location.href.toString());
    newTab.componentURL = new DOBBSModel.ComponentURL(browser.contentDocument.location.href.toString());
    newTab.listener = function(event) { temp.afterPageLoadListener.call(temp, event, browser); };
    browser.addEventListener("load", newTab.listener, true); 
    browser.sessionHistory.addSHistoryListener(this.historyListener);
    this.tabList[tabid] = newTab;
    this.main.controller.onTabAdded(newTab, true);
  },

  onTabClosed : function(event) {
    var container = gBrowser.tabContainer;
    var tabID = event.target.getAttribute("tabid");
    var tab = this.tabList[tabID];
    var url = this.tabList[tabID].uri.toString();
    if (url == gBrowser.contentDocument.location.href) {
      this.main.controller.onUrlClosedAndBlurred(tab);
      this.refocus = true;
    } else {
      this.main.controller.onUrlClosed(tab);
      this.refocus = false;
    }
    delete this.tabList[tabID];
    this.currentTabID = container.selectedItem.getAttribute("tabid");
    this.currentDisplayedURL = gBrowser.contentDocument.location.href.toString();
    this.main.controller.onTabClosed(tab, true);
  },

  onTabSelected : function(event) {
    this.pageVisibilitySource = VISIBILITY_SOURCE_TABSELECT;
    var browser = gBrowser.getBrowserForTab(event.target); 
    var url = browser.contentDocument.location;
    var tabid = browser.getAttribute("tabid");
    if ((this.currentTabID != tabid) || (this.refocus == true)){
      if (this.refocus == false) { // required to set focus on tab after another tab has been closed
	var tabX = this.tabList[this.currentTabID];
	this.main.controller.onTabSelectedUrlBlurred(tabX);
      }
      this.currentTabID = tabid;
      var currentTab = this.tabList[this.currentTabID];
      currentTab.focusID++;
      this.main.controller.onTabSelectedUrlFocused(currentTab);
      this.main.currentDisplayedURL = currentTab.uri.toString();
    }
    this.refocus = false;
    this.pageVisibilitySource = VISIBILITY_SOURCE_PAGELOAD;
  },


  afterPageLoadListener : function(event, browser) { 
    if (!this.main.doLogging)
      return;
    
    var doc = event.originalTarget; 
    var win = doc.defaultView; 

    if (doc.nodeName != "#document") return; 
    if (win != win.top) return;
    if (win.frameElement) return; 

    var currentTabID = gBrowser.tabContainer.selectedItem.getAttribute("tabid");
    var tabID = browser.getAttribute("tabid");
    var tab = this.tabList[tabID];
    
    if (tabID == currentTabID) {
      this.main.controller.onUrlClosedAndBlurred(tab);
      tab.uri = browser.contentDocument.location.href.toString();
      tab.componentURL = new DOBBSModel.ComponentURL(tab.uri);
      tab.pageLoadID++;
      this.main.controller.onUrlLoadedAndFocused(tab);
    } else {
      tab.uri = browser.contentDocument.location.href.toString();
      tab.componentURL = new DOBBSModel.ComponentURL(tab.uri);
      tab.pageLoadID++;
      this.main.controller.onUrlLoaded(tab); 
    }
    this.main.pageLoadSource = PAGE_LOAD_SOURCE__TYPED;
    this.main.currentDisplayedURL = gBrowser.contentDocument.location.href.toString();
  },
  
  onHistoryAction : function(newURL) { 
    var container = gBrowser.tabContainer;
    var currentTabID = container.selectedItem.getAttribute("tabid");
    var currentTab = this.tabList[this.currentTabID];
    this.main.controller.onHistoryUrlBlurred(currentTab);
    currentTab.uri = newURL;
    currentTab.componentURL = new DOBBSModel.ComponentURL(newURL);
    this.main.pageLoadSource = PAGE_LOAD_SOURCE__HISTORY;
    currentTab.pageLoadID++;
    this.main.controller.onHistoryUrlFocused(currentTab);
  },
};



DOBBSModel.Tab = function(tabid, uri) {
  this.tabid = tabid;
  this.listener = null;
  this.uri = uri
  this.pageLoadID = -1;
  this.focusID = -1;
  this.componentURL = new DOBBSModel.ComponentURL(uri);
};


DOBBSModel.ComponentURL = function(url) {
 this.fullURL = DOBBSModel.Utility.stripURLPrefix(url);
 this.domainPath = DOBBSModel.Utility.getBareURL(this.fullURL);
 this.subdomain = DOBBSModel.Utility.getSubdomain(url);
 this.domain = DOBBSModel.Utility.getDomain(this.subdomain);
}


DOBBSModel.HistoryListener = function(tabList) {
  this.tabList = tabList;
};

DOBBSModel.HistoryListener.prototype = {
  
  OnHistoryGoBack:function(backURI) {
    this.tabList.onHistoryAction(backURI.spec.toString());
    return true;
  },

  OnHistoryGoForward:function(forwardURI) {
    this.tabList.onHistoryAction(forwardURI.spec.toString());
    return true;
  },

  OnHistoryGotoIndex:function(index, gotoURI) {
    this.tabList.onHistoryAction(gotoURI.spec.toString());
    return true;
  },

  OnHistoryNewEntry:function(newURI) {
  },

  OnHistoryPurge:function(numEntries) {

    return true;
  },
  
  OnHistoryReload:function(reloadURI, reloadFlags) {
    
    return true;
  },

  QueryInterface:function(aIID) {
    if (aIID.equals(Components.interfaces.nsISHistoryListener) || aIID.equals(Components.interfaces.nsISupportsWeakReference) ||aIID.equals(Components.interfaces.nsISupports)){
      return this;
    }
    throw Components.Exception (Components.results.NS_ERROR_NO_INTERFACE);
  },

  GetWeakReference: function() {
    return Components.classes["@mozilla.org/appshell/appShellService;1"].createInstance(Components.interfaces.nsIWeakReference);
  },
  
  
};
  


  

DOBBSModel.HistoryObserver = function(main) {
  this.main = main;
};

DOBBSModel.HistoryObserver.prototype = {
  
  onBeginUpdateBatch: function() {},
  
  onEndUpdateBatch: function() {},
 
  onVisit: function(aURI, aVisitID, aTime, aSessionID, aReferringID, aTransitionType) {
    this.main.onVisit(aTransitionType);
  },
  
  onTitleChanged: function(aURI, aPageTitle) { },
  
  onBeforeDeleteURI: function(aURI) {  },
  
  onDeleteURI: function(aURI) {  },
  
  onClearHistory: function() {  },
  
  onPageChanged: function(aURI, aWhat, aValue) {  },
  
  onDeleteVisits: function() {  },

  //QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsINavHistoryObserver])

};
  


DOBBSModel.Observer = function(main) {
  this.main = main;
  this.timeOfLastInactive = 0;
  this.currentActiveState = 1;
  this.timer = null;
  this.inPrivateBrowsing = false;
};

DOBBSModel.Observer.prototype = {
  
    register : function() {
      var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
      observerService.addObserver(this, "user-interaction-active", false);
      observerService.addObserver(this, "user-interaction-inactive", false);
    },

    observe: function(subject, topic, data) {
        switch (topic) {
            case "sessionstore-windows-restored":
                //dump("restored\n"); 
                break;
            case "user-interaction-inactive":
                this.timeOfLastInactive = new Date().getTime();
                this.startInactiveTimer();
                break;
            case "user-interaction-active":
                this.stopInactiveTimer();
                if (this.currentActiveState != 1) {
                  
                  this.currentActiveState = 1;
                  this.main.controller.onActivityStateChange(this.currentActiveState);
                }
                break;
        }
    },

    unregister: function() {
      var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
      observerService.removeObserver(this, "user-interaction-active");
      observerService.removeObserver(this, "user-interaction-inactive");
    },
    
    
    startInactiveTimer : function() {
      if (this.timer == null) {
	var temp = this;
        this.timer = setInterval(function () { temp.checkInactiveState(); }, TIMER_INTERVAL);
      }
    },
    
    stopInactiveTimer : function() {
      clearInterval(this.timer); this.timer = null;
    },
    
    checkInactiveState : function() {
      if (this.currentActiveState == 0) { return; }
      var currentTime = new Date().getTime();
      var diff = currentTime - this.timeOfLastInactive;
      if (diff > (TIME_IN_MILLISECONDS_UNTIL_IDLING - TIME_IN_MILLISECONDS_UNTIL_IDLING_OFFSET)) {
        this.currentActiveState = 0;
        this.main.controller.onActivityStateChange(this.currentActiveState);
      }
    },
}







DOBBSModel.Utility = {
  bind : function(scope, fn, args) {
    if (!args) {
      args = new Array();
    }
    return function() {
      fn.apply(scope, args);
    };
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
