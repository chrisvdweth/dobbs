
var DOBBSView = new Array();


DOBBSView.Main = function(controller) {
  this.controller = controller;
  
  this.browseEvents = new Array();
  this.browseEventSources = new Array();
  this.windowEvents = new Array();
  this.sessionEvents = new Array();

  this.windowEvents[LOGGING_ACTION_WINDOW_OPENED.toString()] = "WINDOW OPENED";
  this.windowEvents[LOGGING_ACTION_WINDOW_CLOSED.toString()] = "WINDOW CLOSED";
  this.windowEvents[LOGGING_ACTION_TAB_ADDED.toString()] = "TAB ADDED";
  this.windowEvents[LOGGING_ACTION_TAB_CLOSED.toString()] = "TAB CLOSED";    
  this.windowEvents[LOGGING_ACTION_NEW_WINDOW_STATE.toString()] = "WINDOW STATE CHANGED"; 
  this.windowEvents[LOGGING_ACTION_WINDOW_BLURRED.toString()] = "WINDOW BLURRED"; 
  this.windowEvents[LOGGING_ACTION_WINDOW_FOCUSED.toString()] = "WINDOW_FOCUSED"; 
  this.windowEvents[LOGGING_ACTION_WINDOW_FOCUSED_WINDOW_CLOSED.toString()] = "WINDOW_FOCUSED (WINDOW CLOSED)"; 

  
  this.sessionEvents[LOGGING_ACTION_SESSION_START.toString()] = "SESSION START";
  this.sessionEvents[LOGGING_ACTION_SESSION_END.toString()] = "SESSION END";
  this.sessionEvents[LOGGING_ACTION_USER_INACTIVE.toString()] = "USER INACTIVE";
  this.sessionEvents[LOGGING_ACTION_USER_ACTIVE.toString()] = "USER ACTIVE";
  this.sessionEvents[LOGGING_ACTION_USER_ACTIVE_WINDOW_CLOSED.toString()] = "USER ACTIVE (WINDOW CLOSED)";
  this.sessionEvents[LOGGING_ACTION_SUSPENDED_FOR_PRIVATE_BROWSING.toString()] = "SUSPENDED PRIVATE BROWSING"; 
  this.sessionEvents[LOGGING_ACTION_RESUMED_AFTER_PRIVATE_BROWSING.toString()] = "RESUMED PRIVATE BROWSING"; 
  this.sessionEvents[LOGGING_ACTION_RESUMED_AFTER_PRIVATE_BROWSING_WINDOW_CLOSED.toString()] = "RESUMED PRIVATE BROWSING (WINDOW CLOSED)"; 
  this.sessionEvents[LOGGING_ACTION_SUSPENDED_MANUAL_STOP.toString()] = "SUSPENDED MANUAL STOP"; 
  this.sessionEvents[LOGGING_ACTION_RESUMED_MANUAL_START.toString()] = "RESUMED MANUAL START"; 
  this.sessionEvents[LOGGING_ACTION_RESUMED_MANUAL_START_WINDOW_CLOSED.toString()] = "RESUMED MANUAL START (WINDOW CLOSED)"; 
  
  this.browseEvents[LOGGING_ACTION_PAGE_LOADED.toString()] = "PAGE LOADED";
  this.browseEvents[LOGGING_ACTION_PAGE_UNLOADED.toString()] = "PAGE UNLOADED";
  this.browseEvents[LOGGING_ACTION_PAGE_FOCUSED.toString()] = "PAGE FOCUSED";
  this.browseEvents[LOGGING_ACTION_PAGE_BLURRED.toString()] = "PAGE BLURRED"; 
  
  this.browseEventSources[PAGE_LOAD_SOURCE__LINK.toString()] = "LINK";
  this.browseEventSources[PAGE_LOAD_SOURCE__TYPED.toString()] = "TYPED"; 
  this.browseEventSources[PAGE_LOAD_SOURCE__BOOKMARK.toString()] = "BOOKMARK"; 
  this.browseEventSources[PAGE_LOAD_SOURCE__EMBED.toString()] = "EMBED"; 
  this.browseEventSources[PAGE_LOAD_SOURCE__REDIRECT_PERMANENT.toString()] = "REDIRECT PERMANENT"; 
  this.browseEventSources[PAGE_LOAD_SOURCE__REDIRECT_TEMPORARY.toString()] = "REDIRECT TEMPORARY"; 
  this.browseEventSources[PAGE_LOAD_SOURCE__DOWNLOAD.toString()] = "DOWNLOAD"; 
  this.browseEventSources[PAGE_LOAD_SOURCE__FRAMED_LINK.toString()] = "FRAMED LINK"; 
  this.browseEventSources[PAGE_LOAD_SOURCE__HISTORY.toString()] = "HISTORY"; 
  this.browseEventSources[VISIBILITY_SOURCE_PAGELOAD.toString()] = "PAGE LOAD"; 
  this.browseEventSources[VISIBILITY_SOURCE_TABSELECT.toString()] = "TAB SELECT"; 
  
  
};

DOBBSView.Main.prototype = {
   
  addWindowEvent : function(logger, event, matchId, tabId, tabCount, windowState) {
    var s = event + "";
    //dump(this.windowEvents[s] + " [" + this.controller.windowID + ", " + this.controller.sessionID + "]\n");
  },
  

  addBrowseEvent : function(logger, tab, event, source) {
    e = event + ""; s = source + "";
    //dump(this.browseEvents[e] + " [" + tab.tabid + " " + tab.pageLoadID +" " + this.browseEventSources[source] + "]: " + tab.componentURL.fullURL + "\n");
  },
  

  
  addSessionEvent : function(logger, event, matchId) {
    s = event + "";
    //dump(this.sessionEvents[s] + " [" + this.controller.windowID + ", " + this.controller.sessionID + "]\n");
  },
 
};



DOBBSView.NewVersionDialog = function(controller) {
  this.controller = controller;
  this.win = null;
};


DOBBSView.NewVersionDialog.prototype = {
  
  initialize : function(win) {
    this.win = win;
    
   
    
    var htmlPane = this.win.document.getElementById("newVersionWindow");
    this.win.innerHeight = DOBBS_NEW_VERSION_WINDOW_DEFAULT_HEIGHT;
    this.win.innerWidth = DOBBS_NEW_VERSION_WINDOW_DEFAULT_WIDTH;

    windowHeight = this.win.innerHeight;
    var cssString = "";
    
    cssString = "width:100%;overflow:auto;border:solid 1px #AAAAAA;text-align:left;background:#FFFFFF;height:" + (windowHeight - 40) + "px;";
    var divNewVersionInfo = content.document.createElement("div");
	divNewVersionInfo.id = "divNewVersionInfo";
	divNewVersionInfo.style.cssText = cssString;
	divNewVersionInfo.setAttribute("style", cssString);    

	
    cssString = "padding:5px";
    var bNodeTitle = content.document.createElement("b");
    bNodeTitle.style.cssText = cssString; bNodeTitle.setAttribute("style", cssString);   
    
    var textNodeTitle = content.document.createTextNode("New version of the DOBBS add-on available");
    
    bNodeTitle.appendChild(textNodeTitle);
    
    var divInfoText1 = content.document.createElement("div");
    divInfoText1.style.cssText = cssString; divInfoText1.setAttribute("style", cssString);   
    
    var textNodeInfo1 = content.document.createTextNode("There is a new version of the DOBBS add-on available for download at http://dobbs.deri.ie");
    divInfoText1.appendChild(textNodeInfo1);
    
    var divInfoText2 = content.document.createElement("div");
    divInfoText2.style.cssText = cssString; divInfoText2.setAttribute("style", cssString);   
    
    var textNodeInfo2 = content.document.createTextNode("Please de-install the currently running version and install the most recent one, which can be found on the DOBBS project website.");
    divInfoText2.appendChild(textNodeInfo2);

    var divInfoText3 = content.document.createElement("div");
    divInfoText3.style.cssText = cssString; divInfoText3.setAttribute("style", cssString);   
    
    var textNodeInfo3 = content.document.createTextNode("Thanks for your support!");
    divInfoText3.appendChild(textNodeInfo3);

    
    divNewVersionInfo.appendChild(bNodeTitle);
    divNewVersionInfo.appendChild(divInfoText1);
    divNewVersionInfo.appendChild(divInfoText2);
    divNewVersionInfo.appendChild(divInfoText3);
    
    htmlPane.appendChild(divNewVersionInfo);
  },
  
  onClosingNewVersionDialogButtonClick : function(win) {
    this.controller.onClosingNewVersionDialogButtonClick(win); 
  },
  
  onGoToWebsiteButtonClick : function(win) {
    this.controller.onGoToWebsiteButtonClick(win);
  },
};