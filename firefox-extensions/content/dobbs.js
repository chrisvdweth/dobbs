const DOBBS_VERSION = 1.2;
const DOBBS_DO_PERSISTENT_LOGGING = false;

//const DOBBS_HTTP_SERVER_URL__LOG_SESSION_EVENT = "http://dobbs.deri.ie/dobbs/service/logSessionEvent.php";
//const DOBBS_HTTP_SERVER_URL__LOG_WINDOW_EVENT = "http://dobbs.deri.ie/dobbs/service/logWindowEvent.php";
//const DOBBS_HTTP_SERVER_URL__LOG_BROWSER_EVENT = "http://dobbs.deri.ie/dobbs/service/logBrowseEvent.php";
//const DOBBS_HTTP_SERVER_URL__GET_UNIQUE_ID = "http://dobbs.deri.ie/dobbs/service/get_unique_id.php";
const DOBBS_HTTP_SERVER_URL__LOG_SESSION_EVENT = "http://localhost/dobbs/service/logSessionEvent.php";
const DOBBS_HTTP_SERVER_URL__LOG_WINDOW_EVENT = "http://localhost/dobbs/service/logWindowEvent.php";
const DOBBS_HTTP_SERVER_URL__LOG_BROWSER_EVENT = "http://localhost/dobbs/service/logBrowseEvent.php";
const DOBBS_HTTP_SERVER_URL__GET_UNIQUE_ID = "http://localhost/dobbs/service/get_unique_id.php";



const DOBBS_HTTP_REQUEST_TIMEOUT_IN_MILLISECONDS = 5000;

//
// window events
//
// window opened / closed
const LOGGING_ACTION_WINDOW_OPENED = 100;
const LOGGING_ACTION_WINDOW_CLOSED = 101;
//
// tab added / closed
const LOGGING_ACTION_TAB_ADDED = 110;
const LOGGING_ACTION_TAB_CLOSED = 111;
//
// new window state
const LOGGING_ACTION_NEW_WINDOW_STATE = 140;

const LOGGING_ACTION_WINDOW_BLURRED = 150;
const LOGGING_ACTION_WINDOW_FOCUSED = 151;
const LOGGING_ACTION_WINDOW_FOCUSED_WINDOW_CLOSED = 155;

//
// user events
//
// inactive / active
const LOGGING_ACTION_SESSION_START = 200;
const LOGGING_ACTION_SESSION_END = 201;


const LOGGING_ACTION_USER_INACTIVE = 210;
const LOGGING_ACTION_USER_ACTIVE = 211;
const LOGGING_ACTION_USER_ACTIVE_WINDOW_CLOSED = 215;
//
// suspended / resumed (manual stop)
const LOGGING_ACTION_SUSPENDED_MANUAL_STOP = 220;
const LOGGING_ACTION_RESUMED_MANUAL_START = 221;
const LOGGING_ACTION_RESUMED_MANUAL_START_WINDOW_CLOSED = 225;
//
// suspended / resumed (private browsing)
const LOGGING_ACTION_SUSPENDED_FOR_PRIVATE_BROWSING = 230;
const LOGGING_ACTION_RESUMED_AFTER_PRIVATE_BROWSING = 231;
const LOGGING_ACTION_RESUMED_AFTER_PRIVATE_BROWSING_WINDOW_CLOSED = 235;


//
//
// browse events
//
const LOGGING_ACTION_PAGE_LOADED = 400;
const LOGGING_ACTION_PAGE_FOCUSED = 410;
const LOGGING_ACTION_PAGE_BLURRED = 420;
const LOGGING_ACTION_PAGE_UNLOADED = 430;


// combined events
const LOGGING_ACTION_PAGE_LOADED_FOCUSED = 800;
const LOGGING_ACTION_PAGE_UNLOADED_BLURRED = 801;


const UNIQUE_ID_TYPE__USER = 0;
const UNIQUE_ID_TYPE__WINDOW = 1;
const UNIQUE_ID_TYPE__SESSION = 2;


const PAGE_LOAD_SOURCE__LINK = 1;
const PAGE_LOAD_SOURCE__TYPED = 2;
const PAGE_LOAD_SOURCE__BOOKMARK = 3;
const PAGE_LOAD_SOURCE__EMBED = 4;
const PAGE_LOAD_SOURCE__REDIRECT_PERMANENT = 5;
const PAGE_LOAD_SOURCE__REDIRECT_TEMPORARY = 6;
const PAGE_LOAD_SOURCE__DOWNLOAD = 7;
const PAGE_LOAD_SOURCE__FRAMED_LINK = 8;
const PAGE_LOAD_SOURCE__HISTORY = 9;
const PAGE_LOAD_SOURCE__UNKNOWN = 0;


const VISIBILITY_SOURCE_PAGELOAD = 10;
const VISIBILITY_SOURCE_TABSELECT = 11;

const TIMER_INTERVAL = 1000;
const TIME_IN_MILLISECONDS_UNTIL_IDLING = 60000;
const TIME_IN_MILLISECONDS_UNTIL_IDLING_OFFSET = 8000;
const TIME_IN_MILLISECONDS_UNTIL_DEACTIVATED = 10000;


const LOG_DUMP_FIELD_SEPARATOR = "\t";


const DOBBS_NEW_VERSION_WINDOW_DEFAULT_HEIGHT = 200;
const DOBBS_NEW_VERSION_WINDOW_DEFAULT_WIDTH = 280;
const DOBBS_URL_PROJECT_WEBSITE = "http://dobbs.deri.ie";

//
// For the support for Firefox version < 4.0
//
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var fSlice = Array.prototype.slice,
        aArgs = fSlice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP
                                 ? this
                                 : oThis || window,
                               aArgs.concat(fSlice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
};





var DOBBS = new Array();

DOBBS.STATE_START = Components.interfaces.nsIWebProgressListener.STATE_START;
DOBBS.STATE_STOP = Components.interfaces.nsIWebProgressListener.STATE_STOP;



DOBBS.Controller = function() {
  this.doPersistentLogging;
  this.isEnabled;
  this.hasError;
  this.model;
  this.view;
  this.windowID = -1;
  this.sessionID = -1;
  this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.dobbs.");
  this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  this.pbs = Components.classes["@mozilla.org/privatebrowsing;1"].getService(Components.interfaces.nsIPrivateBrowsingService); 
  this.privateBrowsingListener = new DOBBS.PrivateBrowsingListener(this);
  this.focusObserver = new DOBBS.FocusObserver(this);
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
  this.mainWindow = wm.getMostRecentWindow("navigator:browser");
  this.currentWindowState = -1;
  this.matchIdIdle = -1;
  this.matchIdFocus = -1;
  this.matchIdSession = -1;
  
  this.matchIdPrivateBrowsing = -1;
  this.matchIdManual = -1;
  
  this.initialWindowOpen = true;
  
  this.isBlurred = false;
  this.isIdling = false;
};

DOBBS.Controller.prototype = {

  initialize : function() {
    this.doPersistentLogging = DOBBS_DO_PERSISTENT_LOGGING;
    //this.isEnabled = true;
    this.hasError = false;
    this.hasShownErrorDialog = false;
    this.hasShownNewVersionDialog = false;
    this.currentVersion = 0.0;
    this.model = new DOBBSModel.Main(this);
    this.view = new DOBBSView.Main(this);
    this.currentWindowState = -1;
    this.matchIdIdle = -1;
    this.matchIdFocus = -1;
    this.isBlurred = false;
    this.isIdling = false;
    this.isSession = true;

 
    if (this.privateBrowsingListener.inPrivateBrowsing) { return; }
    
    var item = document.getElementById("menu-dobbs");
    var val = item.getAttribute("checked");
    if (val == "false") { this.isEnabled = false; return;  }  
    
    this.checkUserID();
  },
  
  checkUserID : function() {
    if (this.prefs.getCharPref("userid") == "") {
      this.model.httpConnection.getUniqueId(UNIQUE_ID_TYPE__USER); 
    } else {
      this.userID = this.prefs.getCharPref("userid");
      if (this.windowID < 0) {
        this.model.httpConnection.getUniqueId(UNIQUE_ID_TYPE__WINDOW); 
      } else {
        this.model.httpConnection.getUniqueId(UNIQUE_ID_TYPE__SESSION); 
      }
    }
  },

  
  
  onPrivateBrowsingEntered : function() { 
    this.onPrivateBrowsingSuspendLogging(true); 
    this.unload(false, false); 
  },
  
  onPrivateBrowsingLeft : function() { 
    if (this.isEnabled)
      this.onPrivateBrowsingResumeLogging(true); 
    this.initialize(); 
  },
  

  onTrackBehaviorClick : function() {
    var item = document.getElementById("menu-dobbs");
    var val = item.getAttribute("checked");
    if (val == "false") {
      item.setAttribute("checked", true);
      //this.isEnabled = true;
      this.onManualResumeLogging(true);
      this.initialize();
    } else {
      this.openClosingDialog();
    }
  },
  

  
  openRegisterNewUserDialog : function() { window.openDialog("chrome://dobbs/content/newuser.xul", "bmarks", "chrome, centerscreen", this); },
  
  onUniqueUserIDReceived : function(id) { 
    this.userID = id; this.prefs.setCharPref("userid", id); 
    this.model.httpConnection.getUniqueId(UNIQUE_ID_TYPE__WINDOW);
  },
  
  
  onUniqueWindowIDReceived : function(id) { 
    this.windowID = id; 
    this.model.httpConnection.getUniqueId(UNIQUE_ID_TYPE__SESSION); 
  },
  
  onUniqueSessionIDReceived : function(id) { 
    this.sessionID = id; 
    this.isEnabled = true;
    this.onWindowOpened(); 
    this.model.initialize(); 
  },
  
  onUniqueIdReceived : function(response) {
    var type = $(response).find("type").text();
    var id = $(response).find("id").text();
    this.currentVersion = $(response).find("version").text();
    dump("version: " + this.currentVersion + "\n");
    
    if (this.currentVersion > DOBBS_VERSION) {
      //dump(this.hasShownNewVersionDialog + "\n");
      if (this.hasShownNewVersionDialog == false) {
	this.hasShownNewVersionDialog = true;
	this.openNewVersionDialog();
      }
    }
    
    if (type == "") { this.onHttpError(); return; }
    if (type == UNIQUE_ID_TYPE__USER) 
      this.onUniqueUserIDReceived(id);
    else if (type == UNIQUE_ID_TYPE__WINDOW)
      this.onUniqueWindowIDReceived(id);
    else if (type == UNIQUE_ID_TYPE__SESSION)
      this.onUniqueSessionIDReceived(id);
  },
  
  openClosingDialog : function() {
    var w = window.openDialog("chrome://dobbs/content/closing.xul", "bmarks", "chrome, centerscreen", this);
  },
  
  openNewVersionDialog : function() {
    var newVersionDialog = new DOBBSView.NewVersionDialog(this);
    var w = window.openDialog("chrome://dobbs/content/new-version.xul", "bmarks", "chrome, centerscreen", newVersionDialog);
  },
  
  
  onClosingDialogButtonClick : function(win, continueLogging) {
    if (continueLogging == false) {
      var item = document.getElementById("menu-dobbs");
      item.setAttribute("checked", false);
      this.onManualSuspendLogging(true);
      this.unload(false, false);
      this.isEnabled = false;
    }
    win.close();
  },
  
  onClosingNewVersionDialogButtonClick : function(win) {
    win.close();
  },
    
  onGoToWebsiteButtonClick : function(win) {
    win.close();
    content.document.location.href = DOBBS_URL_PROJECT_WEBSITE;
  },
  
  onActivityStateChange : function(state, doAsyncRequest) {
    if (state == 0) {
      this.matchIdIdle++;
      this.isIdling = true;
      this.onSessionEvent(LOGGING_ACTION_USER_INACTIVE, this.matchIdIdle, doAsyncRequest, true);
    } else {
      this.isIdling = false;
      this.onSessionEvent(LOGGING_ACTION_USER_ACTIVE, this.matchIdIdle, doAsyncRequest, true);
    }
  },
  
  onWindowOpened : function() { 
    if (this.initialWindowOpen) {
      this.onWindowEvent(null, LOGGING_ACTION_WINDOW_OPENED, 0, true); 
      this.initialWindowOpen = false;
    }
    this.onSessionStart();
    this.onWindowStateChange(true); 
  },
  
  onWindowClosed : function() { 
    if (this.privateBrowsingListener.inPrivateBrowsing) { this.onSessionEvent(LOGGING_ACTION_RESUMED_AFTER_PRIVATE_BROWSING_WINDOW_CLOSED, this.matchIdPrivateBrowsing, false, true);  }
    if (this.isEnabled == false) { this.onSessionEvent(LOGGING_ACTION_RESUMED_MANUAL_START_WINDOW_CLOSED, this.matchIdManual, false, true); }
    if (this.isBlurred == true) { this.isBlurred = false; this.onWindowEvent(null, LOGGING_ACTION_WINDOW_FOCUSED_WINDOW_CLOSED, this.matchIdFocus, false, true); }
    if (this.isIdling == true) { this.isIdling = false; this.onSessionEvent(LOGGING_ACTION_USER_ACTIVE_WINDOW_CLOSED, this.matchIdIdle, false, true); }
    if (this.isSession == true) { this.onSessionEnd(false); }
    this.onWindowEvent(null, LOGGING_ACTION_WINDOW_CLOSED, 0, false); 
    this.isEnabled = false;
  },
  
  onTabAdded : function(tab, doAsyncRequest) { this.onWindowEvent(tab, LOGGING_ACTION_TAB_ADDED, 0, doAsyncRequest, false); }, 
  onTabClosed : function(tab, doAsyncRequest) { this.onWindowEvent(tab, LOGGING_ACTION_TAB_CLOSED, 0, doAsyncRequest, false); },
  
  onSessionStart : function(doAsyncRequest) { this.matchIdSession++; this.onSessionEvent(LOGGING_ACTION_SESSION_START, this.matchIdSession, doAsyncRequest, true); this.isSession = true; },
  onSessionEnd : function(doAsyncRequest) { this.onSessionEvent(LOGGING_ACTION_SESSION_END, this.matchIdSession, doAsyncRequest, true); this.isSession = false; },
  
  onManualSuspendLogging : function(doAsyncRequest) { this.onSessionEnd(doAsyncRequest); this.matchIdManual++; this.onSessionEvent(LOGGING_ACTION_SUSPENDED_MANUAL_STOP, this.matchIdManual, doAsyncRequest, true); },
  onManualResumeLogging : function(doAsyncRequest) { this.onSessionEvent(LOGGING_ACTION_RESUMED_MANUAL_START, this.matchIdManual, doAsyncRequest, true); },
  onPrivateBrowsingSuspendLogging : function(doAsyncRequest) {  this.onSessionEnd(doAsyncRequest); this.matchIdPrivateBrowsing++, this.onSessionEvent(LOGGING_ACTION_SUSPENDED_FOR_PRIVATE_BROWSING, this.matchIdPrivateBrowsing, doAsyncRequest, true); },
  onPrivateBrowsingResumeLogging : function(doAsyncRequest) { this.onSessionEvent(LOGGING_ACTION_RESUMED_AFTER_PRIVATE_BROWSING, this.matchIdPrivateBrowsing, doAsyncRequest, true); },
  
  onWindowStateChange : function(doAsyncRequest) { if (this.windowID < 0) { return; } this.onWindowEvent(null, LOGGING_ACTION_NEW_WINDOW_STATE, 0, doAsyncRequest, false); },
  onWindowFocused : function(doAsyncRequest) { this.isBlurred = false; this.onWindowEvent(null, LOGGING_ACTION_WINDOW_FOCUSED, this.matchIdFocus, doAsyncRequest, false); },
  onWindowBlurred : function(doAsyncRequest) { this.isBlurred = true; this.matchIdFocus++; this.onWindowEvent(null, LOGGING_ACTION_WINDOW_BLURRED, this.matchIdFocus, doAsyncRequest, false); },
  
  onUrlLoaded : function(tab) { this.onBrowseEvent(tab, LOGGING_ACTION_PAGE_LOADED, this.model.pageLoadSource, true); },
  onUrlClosed : function(tab) { this.onBrowseEvent(tab, LOGGING_ACTION_PAGE_UNLOADED, this.model.pageLoadSource, true); },
  onUrlClosedAtUnload : function(tab) { this.onBrowseEvent(tab, LOGGING_ACTION_PAGE_UNLOADED, this.model.pageLoadSource, false); },
  
  onTabSelectedUrlBlurred : function(tab) { this.onBrowseEvent(tab, LOGGING_ACTION_PAGE_BLURRED, VISIBILITY_SOURCE_TABSELECT, true); },
  onTabSelectedUrlFocused : function(tab) { this.onBrowseEvent(tab, LOGGING_ACTION_PAGE_FOCUSED, VISIBILITY_SOURCE_TABSELECT, true); },
  
  onHistoryUrlBlurred : function(tab) { this.onBrowseEvent(tab, LOGGING_ACTION_PAGE_UNLOADED_BLURRED, PAGE_LOAD_SOURCE__HISTORY, true); },
  onHistoryUrlFocused : function(tab) { this.onBrowseEvent(tab, LOGGING_ACTION_PAGE_LOADED_FOCUSED, PAGE_LOAD_SOURCE__HISTORY, true); },
  
  onUrlLoadedAndFocused : function(tab) { this.onBrowseEvent(tab, LOGGING_ACTION_PAGE_LOADED_FOCUSED, this.model.pageLoadSource, true); },
  onUrlClosedAndBlurred : function(tab) { this.onBrowseEvent(tab, LOGGING_ACTION_PAGE_UNLOADED_BLURRED, this.model.pageLoadSource, true); },
  onUrlClosedAndBlurredAtUnload : function(tab) { this.onBrowseEvent(tab, LOGGING_ACTION_PAGE_UNLOADED_BLURRED, this.model.pageLoadSource, false); },

  
  
  onSessionEvent : function(event, matchId, doAsyncRequest, forced) {
        
    //dump(this.windowID + ": " + event + "\n");
    
    if (this.hasError) { return; } 

    if (forced == false)
      if ((this.privateBrowsingListener.inPrivateBrowsing)  || (!this.isEnabled)) { return ; }

    var d = new Date(); var tzOffset = d.getTimezoneOffset();
      
    if (this.doPersistentLogging) 
      this.model.httpConnection.logSessionEvent(doAsyncRequest, this.userID, this.windowID, this.sessionID, event, matchId, DOBBS.Utility.getCurrentTimeMySQL(), tzOffset);
    
    this.view.addSessionEvent(this, event, matchId);

  },
  

  
  onWindowEvent : function(tab, event, matchId, doAsyncRequest, forced) {
    //dump("onWindowEvent: " + event + "\n");
    if (this.hasError) { return; } 

    if (forced == false)
      if ((this.privateBrowsingListener.inPrivateBrowsing)  || (!this.isEnabled)) { return ; }

    var d = new Date(); var tzOffset = d.getTimezoneOffset();
      
    var tabCount = gBrowser.tabContainer.itemCount;
    if (event == LOGGING_ACTION_TAB_CLOSED) { tabCount--; } // necessary since event is fired before tab is removed from container
    
    if (tab == null) { tab = new DOBBSModel.Tab(-1, "about:blank"); }

    if (this.doPersistentLogging) 
      this.model.httpConnection.logWindowEvent(doAsyncRequest, this.userID, this.windowID, this.sessionID, event, matchId, tab.tabid, tabCount, window.windowState, DOBBS.Utility.getCurrentTimeMySQL(), tzOffset);

    this.view.addWindowEvent(this, event, matchId, tab.tabid, tabCount, window.windowState);
  },
    
  onBrowseEvent : function(tab, event, source, doAsyncRequest) {
    if ((this.hasError) || (!this.isEnabled) || (this.privateBrowsingListener.inPrivateBrowsing)) { return; } 
    
    var d = new Date(); var tzOffset = d.getTimezoneOffset();
    
    dump(tab.componentURL.fullURL + "\n" + tab.componentURL.domainPath + "\n" + tab.componentURL.subdomain + "\n" + tab.componentURL.domain);
    if ((DOBBS.Utility.isHttpUrl(tab.uri))) {
      if (this.doPersistentLogging) {
        this.model.httpConnection.logBrowseEvent(doAsyncRequest, this.userID, this.windowID, this.sessionID, tab.tabid, tab.pageLoadID, tab.focusID, Sha1.hash(tab.componentURL.fullURL), Sha1.hash(tab.componentURL.domainPath), Sha1.hash(tab.componentURL.subdomain), Sha1.hash(tab.componentURL.domain), event, source, DOBBS.Utility.getCurrentTimeMySQL(), tzOffset);
      }

      if (event == LOGGING_ACTION_PAGE_LOADED_FOCUSED) {
        this.view.addBrowseEvent(this, tab, LOGGING_ACTION_PAGE_LOADED, source);
        this.view.addBrowseEvent(this, tab, LOGGING_ACTION_PAGE_FOCUSED, source);
      } else if (event == LOGGING_ACTION_PAGE_UNLOADED_BLURRED) {
        this.view.addBrowseEvent(this, tab, LOGGING_ACTION_PAGE_BLURRED, source);
        this.view.addBrowseEvent(this, tab, LOGGING_ACTION_PAGE_UNLOADED, source);
      } else {
        this.view.addBrowseEvent(this, tab, event, source);
      }
    }
  },
  
  unload : function(hasError, isWindowClose) { 
    this.focusObserver.stopTimer();
    this.model.unload(hasError);
    if (!this.hasError) {
      if (isWindowClose) {
	this.onWindowClosed(); 
      }
    }
  },
  
  onHttpError : function() {
    //this.hasError = true; 
    //this.isEnabled = false;
    //var item = document.getElementById("menu-dobbs");
    //item.setAttribute("checked", false);
    //this.unload(this.hasError, true);
    
    //dump("ERROR!\n");
    //if (this.hasShownErrorDialog == false) {
    //  this.hasShownErrorDialog == true;
    //  alert("Connection Error!\n\nThe DOBBS add-on has been disabled for this session.\n\nIf this error message continues to appear, please visit the\nDOBBS website (http://dobbs.deri.ie) for further information.");
    //}
  },

  onResize : function(event) { if(window.windowState == STATE_FULLSCREEN) { this.checkWindowStateUpdate(STATE_FULLSCREEN); } },
  onSizeModeChange : function(event) { this.checkWindowStateUpdate(window.windowState) },
  
  checkWindowStateUpdate : function(state) {
    if (this.currentWindowState != state) {
      this.onWindowStateChange(true);
      this.currentWindowState = state
    }
  },
  
  onDeactivate : function() { this.focusObserver.onDeactivate(); },
  onActivate : function() { this.focusObserver.onActivate(); },
  
};






DOBBS.FocusObserver = function(controller) {
  this.controller = controller;
  this.timer = null;
  this.inactiveSince = 0;
  this.currentFocusState = 1;
};

DOBBS.FocusObserver.prototype = {
  
  onActivate : function() {
    this.stopTimer();
  },
  
  onDeactivate : function() {
    this.inactiveSince = new Date().getTime();
    this.startTimer();
  },
  
        
  startTimer : function() {
    if (this.timer == null) {
      var temp = this;
      this.timer = setInterval(function () { temp.checkFocusState(); }, TIMER_INTERVAL);
    }
  },
    
  stopTimer : function() {
    if (this.timer != null) { clearInterval(this.timer); this.timer = null; }
    if (this.currentFocusState == 0) { this.currentFocusState = 1; this.controller.onWindowFocused(true); }
  },
    
  checkFocusState : function() {
    if (this.currentFocusState == 0) { return; }
      
    var currentTime = new Date().getTime();
    if ((currentTime - this.inactiveSince) > TIME_IN_MILLISECONDS_UNTIL_DEACTIVATED) {
      this.controller.onWindowBlurred(true);
      this.stopTimer();
      this.currentFocusState = 0;
    }
  },
};





DOBBS.PrivateBrowsingListener = function(controller) {  
  this.controller = controller;
  this.os = null;
  this.inPrivateBrowsing = false;
  this.initialize();  
};


DOBBS.PrivateBrowsingListener.prototype = {  

  initialize : function () {  
    this._inited = true;  
    this.os = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);  
    this.os.addObserver(this, "private-browsing", false);  
    this.os.addObserver(this, "quit-application", false);  
    try {  
      var pbs = Components.classes["@mozilla.org/privatebrowsing;1"].getService(Components.interfaces.nsIPrivateBrowsingService);  
      this.inPrivateBrowsing = pbs.privateBrowsingEnabled;  
    } catch(ex) {  
      // ignore exceptions in older versions of Firefox  
    }  
  },  
       
  observe : function (aSubject, aTopic, aData) {  
    if (aTopic == "private-browsing") {  
      if (aData == "enter") {  
        this.controller.onPrivateBrowsingEntered();
	this.inPrivateBrowsing = true;   
      } else if (aData == "exit") {  
        this.inPrivateBrowsing = false;
	this.controller.onPrivateBrowsingLeft();
      }  
    } else if (aTopic == "quit-application") {  
      this.os.removeObserver(this, "quit-application");  
      this.os.removeObserver(this, "private-browsing");  
    }  
  },  
};  


DOBBS.Utility = {


  isHttpUrl : function(url) {
    if ((url.indexOf("http://") >= 0) || (url.indexOf("https://") >= 0)) {
      if (url.indexOf("localhost") >= 0) {
	return false;
      } else {
	return true;
      }
    }
    return false;
  },

  xmlToString : function(xmlData) { 

    var xmlString;
    //IE
    if (window.ActiveXObject){
        xmlString = xmlData.xml;
    }
    // code for Mozilla, Firefox, Opera, etc.
    else{
        xmlString = (new XMLSerializer()).serializeToString(xmlData);
    }
    return xmlString;
  },   
  
  //"20081223094234.572"
  //"20120815074433.178"
  //SELECT TIMEDIFF(20120815074433.178,20081223094234.572);
  getCurrentTimeMySQL : function() {
    var dateObj = new Date();
    var milliSeconds = dateObj.getMilliseconds();
    var seconds = ("0" + dateObj.getSeconds()).slice(-2);
    var minutes = ("0" + dateObj.getMinutes()).slice(-2);
    var hours = ("0" + dateObj.getHours()).slice(-2);
    var month = ("0" + (dateObj.getMonth()+1)).slice(-2);
    var day = ("0" + dateObj.getDate()).slice(-2);
    var year = dateObj.getFullYear();
    return (year + "" + month + "" + day + "" + hours + "" + minutes + "" + seconds + "." + milliSeconds);
  },
  
  
  encrypt : function(data, key) {
    var enc = Sha1.hash(data);
    enc = CryptoJS.AES.encrypt(enc, key);
    dump("XXX: " + enc + "\n");
    var enc = Sha1.hash(enc.toString());
    return enc;
  },
  
};



window.addEventListener(
  "load", 
  function(aEvent) {
      window.dobbsController = new DOBBS.Controller();
      dobbsController.initialize();
      window.addEventListener("unload", function() { dobbsController.unload(false, true); }, false);
      window.addEventListener("resize", function(event) { dobbsController.onResize(event); }, false);
      window.addEventListener("sizemodechange", function(event) { dobbsController.onSizeModeChange(event); }, true);
      window.addEventListener("activate", function(event) { dobbsController.onActivate(event); }, false);
      window.addEventListener("deactivate", function(event) { dobbsController.onDeactivate(event); }, false);
  }, 
  false
);

