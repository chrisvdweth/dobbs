
var DOBBSView = new Array();


DOBBSView.Main = function(controller) {
  this.controller = controller;
  this.console = new DOBBSView.Console(this);
};

DOBBSView.Main.prototype = {
 
  initialize : function() {
    this.console.initialize();
  },
  
  unload : function(hasError) {
    this.console.unload(hasError);
  },
  
  closeConsole : function() {
    this.console.close();
  },
  
  addBrowseEvent : function(logger, tab, event, source) { this.console.addBrowseEvent(logger, tab, event, source); },
  
  addWindowEvent : function(logger, event, tabId, tabCount, windowState) { this.console.addWindowEvent(logger, event, tabId, tabCount, windowState); },
  
  onConsoleClosed : function() {
    this.controller.onConsoleClosed();
  },
};


DOBBSView.Console = function(main) {
  this.main = main;
  this.win = null;
  this.browseEvents = new Array();
  this.browseEventSources = new Array();
  this.windowEvents = new Array();
  this.userEvents = new Array();
  this.nr = 1;
  this.winClosedHandler;

  this.windowEvents[LOGGING_ACTION_WINDOW_OPENED.toString()] = "WINDOW OPENED";
  this.windowEvents[LOGGING_ACTION_WINDOW_CLOSED.toString()] = "WINDOW CLOSED";
  this.windowEvents[LOGGING_ACTION_TAB_ADDED.toString()] = "TAB ADDED";
  this.windowEvents[LOGGING_ACTION_TAB_CLOSED.toString()] = "TAB CLOSED";    
  this.windowEvents[LOGGING_ACTION_SUSPENDED_MANUAL_STOP.toString()] = "SUSPENDED MANUAL STOP"; 
  this.windowEvents[LOGGING_ACTION_RESUMED_MANUAL_START.toString()] = "RESUMED MANUAL START"; 
  this.windowEvents[LOGGING_ACTION_RESUMED_MANUAL_START_WINDOW_CLOSED.toString()] = "RESUMED MANUAL START (WINDOW CLOSED)"; 
  this.windowEvents[LOGGING_ACTION_SUSPENDED_FOR_PRIVATE_BROWSING.toString()] = "SUSPENDED PRIVATE BROWSING"; 
  this.windowEvents[LOGGING_ACTION_RESUMED_AFTER_PRIVATE_BROWSING.toString()] = "RESUMED PRIVATE BROWSING"; 
  this.windowEvents[LOGGING_ACTION_RESUMED_AFTER_PRIVATE_BROWSING_WINDOW_CLOSED.toString()] = "RESUMED PRIVATE BROWSING (WINDOW CLOSED)"; 
  this.windowEvents[LOGGING_ACTION_NEW_WINDOW_STATE.toString()] = "WINDOW STATE CHANGED"; 
  this.windowEvents[LOGGING_ACTION_WINDOW_BLURRED.toString()] = "WINDOW BLURRED"; 
  this.windowEvents[LOGGING_ACTION_WINDOW_FOCUSED.toString()] = "WINDOW_FOCUSED"; 
  this.windowEvents[LOGGING_ACTION_WINDOW_FOCUSED_WINDOW_CLOSED.toString()] = "WINDOW_FOCUSED (WINDOW CLOSED)"; 
  this.windowEvents[LOGGING_ACTION_USER_INACTIVE.toString()] = "USER INACTIVE";
  this.windowEvents[LOGGING_ACTION_USER_ACTIVE.toString()] = "USER ACTIVE";
  this.windowEvents[LOGGING_ACTION_USER_ACTIVE_WINDOW_CLOSED.toString()] = "USER ACTIVE (WINDOW CLOSED)";
  
  this.userEvents[LOGGING_ACTION_USER_INACTIVE.toString()] = "USER INACTIVE";
  this.userEvents[LOGGING_ACTION_USER_ACTIVE.toString()] = "USER ACTIVE"; 
  
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


DOBBSView.Console.prototype = {
 
  initialize : function() {
    //this.win = window.openDialog("chrome://dobbs/content/log_console.xul", "bmarks", "chrome, centerscreen", this);
    this.win = null;
  },
  
  onload : function(win) {
    var htmlPane = win.document.getElementById("htmlLogConsole");  
    if (htmlPane == null) 
      return; 
  
    var cssString = "border-collapse:collapse;width:100%";
    var logTable = content.document.createElement("table");
	logTable.id = "logTableID";
	logTable.style.cssText = cssString;
	logTable.setAttribute("style", cssString);    
    var logTableBody = content.document.createElement("tbody");
        logTableBody.id = "logTableBodyID";

    logTable.appendChild(logTableBody);
    htmlPane.appendChild(logTable);
    
    var temp = this;
    this.winClosedHandler = function(event) { temp.onConsoleClosed.call(temp); };
    this.win.addEventListener("unload", this.winClosedHandler, false);
    
    this.win.document.title = this.win.document.title + "  (UserID: " + this.main.controller.userID +  ", WindowID: " + this.main.controller.windowID + ", SessionID: "  + this.main.controller.sessionID + ")";
  },
  
  onConsoleClosed : function() {
    this.main.onConsoleClosed(); 
  },
  
  unload : function(hasError) { 
    if (this.win != null) {
      //this.win.close(); 
    }
  },
  
  close : function() {
    if (this.win != null) {
      this.win.close(); 
    }
  },
  
  addBrowseEvent : function(logger, tab, event, source) {
    //dump(action + "\n");
    e = event + ""; s = source + "";
    
    //dump(this.browseEvents[e] + " [" + this.browseEventSources[s] + "]: " + tab.componentURL.fullURL + "\n");
    
    //return;
    if (this.win == null) { return; }
    if (this.win.document == null) { return; }
    
    var tableBody = this.win.document.getElementById("logTableBodyID");
    var table=this.win.document.getElementById("logTableID");  
    if (table != null) {
      var sourceString = source + "";
      var eventString = event + "";

      var row = table.insertRow(table.rows.length); row.style.verticalAlign = "top";
      var cell1 = row.insertCell(0);
      var cell2 = row.insertCell(1);
      var cell3 = row.insertCell(2);
      var cell4 = row.insertCell(3);
      var cell5 = row.insertCell(4);
      var cell6 = row.insertCell(5);
      var cell7 = row.insertCell(6);
      var cell8 = row.insertCell(7);
      var cell9 = row.insertCell(8);

      if (this.nr % 2 == 0) row.style.background = "#EFEFEF";
      
      cell1.innerHTML = this.nr + "";
      cell2.innerHTML = "<b>" + this.browseEvents[eventString] + "</b>";
      cell3.innerHTML = "<b>" + this.browseEventSources[sourceString] + "</b>";
      cell4.innerHTML = "|"  + Sha1.hash(tab.componentURL.domain);
      cell5.innerHTML = "|"  + Sha1.hash(tab.componentURL.domainPath);
      cell6.innerHTML = "|" + Sha1.hash(tab.componentURL.fullURL);
      cell7.innerHTML = "|" + tab.tabid;
      cell8.innerHTML = "|" + tab.pageLoadID;
      cell9.innerHTML = "|" + tab.focusID;
    

      tableBody.lastChild.scrollIntoView();
      this.nr++;
    }
  },
  
  
  addWindowEvent : function(logger, event, matchId, tabId, tabCount, windowState) {
    s = event + "";
    //dump(this.windowEvents[s] + " ["  + this.main.controller.windowID + ", " + this.main.controller.sessionID + "]\n");
    
    if (this.win == null) { return; }
    if (this.win.document == null) { return; }
    
    
    var tableBody = this.win.document.getElementById("logTableBodyID");
    var table=this.win.document.getElementById("logTableID");  
    
    if (table != null) {
      var eventString = event + "";
    
      var row = table.insertRow(table.rows.length); row.style.verticalAlign = "top";
      var cell1 = row.insertCell(0);
      var cell2 = row.insertCell(1);
      var cell3 = row.insertCell(2);
      var cell4 = row.insertCell(3);
      var cell5 = row.insertCell(4);
      
      if (this.nr % 2 == 0) row.style.background = "#EFEFEF";
      
      cell1.innerHTML = this.nr + "";
      cell2.innerHTML = "<b>" + this.windowEvents[eventString] + "</b>";
      cell3.innerHTML = tabId.toString() + "";
      cell4.innerHTML = "|" + windowState.toString();
      cell5.innerHTML = "|" + tabCount.toString();
    
      tableBody.lastChild.scrollIntoView();
      this.nr++;
    }
  },
  

};