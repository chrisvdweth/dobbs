const DOBBS_VERSION = 1.0;
const DOBBS_BROWSER = 2;
const DOBBS_DO_PERSISTENT_LOGGING = true;

const DOBBS_HTTP_SERVER_URL__LOG_SESSION_EVENT = "http://dobbs.deri.ie/dobbs/service/logSessionEvent.php";
const DOBBS_HTTP_SERVER_URL__LOG_WINDOW_EVENT = "http://dobbs.deri.ie/dobbs/service/logWindowEvent.php";
const DOBBS_HTTP_SERVER_URL__LOG_BROWSER_EVENT = "http://dobbs.deri.ie/dobbs/service/logBrowseEvent.php";
const DOBBS_HTTP_SERVER_URL__GET_UNIQUE_ID = "http://dobbs.deri.ie/dobbs/service/get_unique_id.php";
//const DOBBS_HTTP_SERVER_URL__LOG_SESSION_EVENT = "http://localhost/dobbs/service/logSessionEvent.php";
//const DOBBS_HTTP_SERVER_URL__LOG_WINDOW_EVENT = "http://localhost/dobbs/service/logWindowEvent.php";
//const DOBBS_HTTP_SERVER_URL__LOG_BROWSER_EVENT = "http://localhost/dobbs/service/logBrowseEvent.php";
//const DOBBS_HTTP_SERVER_URL__GET_UNIQUE_ID = "http://localhost/dobbs/service/get_unique_id.php";
//const DOBBS_HTTP_SERVER_URL__LOG_SESSION_EVENT = "http://vmusm02.deri.ie/dobbs/service/logSessionEvent.php";
//const DOBBS_HTTP_SERVER_URL__LOG_WINDOW_EVENT = "http://vmusm02.deri.ie/dobbs/service/logWindowEvent.php";
//const DOBBS_HTTP_SERVER_URL__LOG_BROWSER_EVENT = "http://vmusm02.deri.ie/dobbs/service/logBrowseEvent.php";
//const DOBBS_HTTP_SERVER_URL__GET_UNIQUE_ID = "http://vmusm02.deri.ie/dobbs/service/get_unique_id.php";




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

const PAGE_LOAD_SOURCE__UNKNOWN = -1;
const PAGE_LOAD_SOURCE__LINK = 1;
const PAGE_LOAD_SOURCE__TYPED = 2;
const PAGE_LOAD_SOURCE__BOOKMARK = 3;
const PAGE_LOAD_SOURCE__EMBED = 4;
const PAGE_LOAD_SOURCE__REDIRECT_PERMANENT = 5;
const PAGE_LOAD_SOURCE__REDIRECT_TEMPORARY = 6;
const PAGE_LOAD_SOURCE__DOWNLOAD = 7;
const PAGE_LOAD_SOURCE__FRAMED_LINK = 8;
const PAGE_LOAD_SOURCE__HISTORY = 9;

const VISIBILITY_SOURCE_PAGELOAD = 10;
const VISIBILITY_SOURCE_TABSELECT = 11;

const TIMER_INTERVAL = 1000;
const TIME_IN_MILLISECONDS_UNTIL_IDLING = 60000;
const TIME_IN_MILLISECONDS_UNTIL_IDLING_OFFSET = 8000;
const TIME_IN_MILLISECONDS_UNTIL_DEACTIVATED = 10000;


const LOG_DUMP_FIELD_SEPARATOR = "\t";


const DOBBS_NEW_VERSION_WINDOW_DEFAULT_HEIGHT = 200;
const DOBBS_NEW_VERSION_WINDOW_DEFAULT_WIDTH = 280;
const DOBBS_URL_PROJECT_WEBSITE = "http://dobbs.deri.ie/";
const DOBBS_URL_PROJECT_WEBSITE__PAGE_NEW_VERSION = "http://dobbs.deri.ie/new_version.php";


const DOBBS_LOCAL_STORAGE_KEY__USER_ID = "dobbsUserId";
const DOBBS_LOCAL_STORAGE_KEY__OPEN_WINDOWS = "dobbsOpenWindows";
const DOBBS_LOCAL_STORAGE_KEY__OPEN_TABS = "dobbsOpenTabs";
const DOBBS_LOCAL_STORAGE_KEY__LAST_TIME = "dobbsLastTime";
const DOBBS_LOCAL_STORAGE_KEY__LAST_ENABLED = "dobbsLastEnabled";



var DOBBS = new Array();

DOBBS.Controller = function() {
  this.messageHandler;
  this.model = new DOBBSModel.Main(this);
  this.view = new DOBBSView.Main(this);
  this.currentVersion = -1;
  this.userId = -1;
  this.isInitialized = false;
  this.hasError = false;
  this.doPersistentLogging = DOBBS_DO_PERSISTENT_LOGGING;
  this.lastTimer = null;
};

DOBBS.Controller.prototype = {

  initialize : function() {
    this.messageHandler = new DOBBS.MessageHandler(this);
    this.messageHandler.initialize();
    this.view.initialize();
    this.enableLogging();
  },
  
  setEnabled : function() {
    this.isEnabled = true;
    this.view.setEnabled();
    localStorage[DOBBS_LOCAL_STORAGE_KEY__LAST_ENABLED] = this.isEnabled;
  },
  
  setDisabled : function() {
    this.isEnabled = false;
    localStorage[DOBBS_LOCAL_STORAGE_KEY__LAST_ENABLED] = this.isEnabled;
  },
  
  
  enableLogging : function() {
    this.checkUserId();
  },
  
  disableLogging : function() {
    this.setDisabled();
  },
  
  
  checkLastState : function() {
    try {
      var lastTime = JSON.parse(localStorage[DOBBS_LOCAL_STORAGE_KEY__LAST_TIME]);
      var lastEnabled = JSON.parse(localStorage[DOBBS_LOCAL_STORAGE_KEY__LAST_ENABLED]);
      var openWindows = JSON.parse(localStorage[DOBBS_LOCAL_STORAGE_KEY__OPEN_WINDOWS]);
      var openTabs = JSON.parse(localStorage[DOBBS_LOCAL_STORAGE_KEY__OPEN_TABS]);
      
      for (windowId in openWindows) {
        var dobbsWindow = openWindows[windowId];
        var dobbsWindowId = dobbsWindow.dobbsWindowId;
        var dobbsSessionId = dobbsWindow.dobbsSessionId;

        
        if (lastEnabled == false) { 
          this.onSessionEvent(lastTime, LOGGING_ACTION_RESUMED_MANUAL_START_WINDOW_CLOSED, dobbsWindow, dobbsWindow.matchIdManual, true, true); 
        }
        
        if (dobbsWindow.isBlurred == true) {
          this.onWindowEvent(lastTime, null, LOGGING_ACTION_WINDOW_FOCUSED_WINDOW_CLOSED, dobbsWindow, dobbsWindow.matchIdFocus, true, true); 
        }
    
        if (dobbsWindow.isIdling == true) { 
          this.onSessionEvent(lastTime, LOGGING_ACTION_USER_ACTIVE_WINDOW_CLOSED, dobbsWindow, dobbsWindow.matchIdIdle, false, true); 
        }
        
        for (tabId in openTabs) {
          var dobbsTab = openTabs[tabId];
          if (dobbsWindow.windowId == dobbsTab.windowId) {
            if (dobbsTab.isBlurred == true) {
              this.onBrowseEvent(lastTime, dobbsTab, LOGGING_ACTION_PAGE_FOCUSED, dobbsWindow, VISIBILITY_SOURCE_TABSELECT, true, true);             
            } 
            this.onBrowseEvent(lastTime, dobbsTab, LOGGING_ACTION_PAGE_UNLOADED_BLURRED, dobbsWindow, dobbsTab.pageLoadSource, true, true);
            this.onWindowEvent(lastTime, dobbsTab, LOGGING_ACTION_TAB_CLOSED, dobbsWindow, 0, true, true); 
          }
        }
        
        this.onSessionEvent(lastTime, LOGGING_ACTION_SESSION_END, dobbsWindow, dobbsWindow.matchIdIdle, true, true);        
        this.onWindowEvent(lastTime, null, LOGGING_ACTION_WINDOW_CLOSED, dobbsWindow, dobbsWindow.matchIdFocus, true, true);
        
      }
    } catch (err) {
      // do nothing
    }
  },
  

  checkUserId : function() {
    tmpModel = this.model;
    this.userId = localStorage[DOBBS_LOCAL_STORAGE_KEY__USER_ID];

    if (this.userId > 0) {
      this.checkLastState();
      chrome.windows.getCurrent(null, function (window) {
        tmpModel.httpHandler.getUniqueId(window.id, UNIQUE_ID_TYPE__WINDOW);
      });
    } else {
      chrome.windows.getCurrent(null, function (window) {
        tmpModel.httpHandler.getUniqueId(window.id, UNIQUE_ID_TYPE__USER);
      }); 
    }
  },
  
  onUniqueIdReceived : function(response) {
    var type = $(response).find("type").text();
    var id = $(response).find("id").text();
    var wndId = $(response).find("wndid").text();
    this.currentVersion = $(response).find("version").text();
    if (type == UNIQUE_ID_TYPE__USER) {
      this.onUniqueUserIdReceived(wndId, id);
    } else if (type == UNIQUE_ID_TYPE__WINDOW) {
      this.onUniqueWindowIdReceived(wndId, id);
    } else if (type == UNIQUE_ID_TYPE__SESSION) {
      this.onUniqueSessionIdReceived(wndId, id);
      if (this.currentVersion > DOBBS_VERSION) {
        this.view.openNewVersionWindow();
      }
    }
  },
  
    
  onUniqueUserIdReceived : function(wndId, id) { 
    this.userId = id; localStorage[DOBBS_LOCAL_STORAGE_KEY__USER_ID] = id; 
    this.checkLastState();
    this.model.httpHandler.getUniqueId(wndId, UNIQUE_ID_TYPE__WINDOW);
  },
  
  
  onUniqueWindowIdReceived : function(wndId, id) { 
    this.model.addOpenWindow(wndId, id);
    this.model.httpHandler.getUniqueId(wndId, UNIQUE_ID_TYPE__SESSION); 
  },
  
  onUniqueSessionIdReceived : function(wndId, id) { 
    var tmp = this;
    var tmpModel = this.model;

    this.setEnabled();
    this.model.windowHandler.currentFocusedWindowId = wndId;
    
    
    
    chrome.windows.get(parseInt(wndId), null, function(window) { 
      var dobbsWindow = tmpModel.getOpenWindow(wndId);
      dobbsWindow.dobbsSessionId = id;
      tmp.onWindowOpened(dobbsWindow, false);
      tmp.onSessionStart(dobbsWindow, false);
      tmpModel.tabHandler.registerAllTabs(parseInt(wndId));
      tmpModel.tabHandler.checkAllTabs(parseInt(wndId));
      localStorage[DOBBS_LOCAL_STORAGE_KEY__OPEN_WINDOWS] = JSON.stringify(tmpModel.openWindows);
    }) ;
    
    if (this.isInitialized == false) {
      this.model.initialize();
      this.isInitialized = true;
      this.lastTimer = setInterval(function () { localStorage[DOBBS_LOCAL_STORAGE_KEY__LAST_TIME] = DOBBS.Utility.getCurrentTimeMySQL(); }, TIMER_INTERVAL);
    }
  },
  

  onActivityStateChange : function(dobbsWindow, state, doAsyncRequest) {
    if (state == 0) {
      dobbsWindow.matchIdIdle++;
      dobbsWindow.isIdling = true;
      this.onSessionEvent(DOBBS.Utility.getCurrentTimeMySQL(), LOGGING_ACTION_USER_INACTIVE, dobbsWindow, dobbsWindow.matchIdIdle, doAsyncRequest, true);
    } else {
      dobbsWindow.isIdling = false;
      this.onSessionEvent(DOBBS.Utility.getCurrentTimeMySQL(), LOGGING_ACTION_USER_ACTIVE, dobbsWindow, dobbsWindow.matchIdIdle, doAsyncRequest, true);
    }
    this.model.windowHandler.updateLocalStorage();
  },
  
  
  onManualSuspendLogging : function(dobbsWindow, doAsyncRequest) { 
    this.onSessionEnd(dobbsWindow, doAsyncRequest); 
    dobbsWindow.matchIdManual++; 
    this.onSessionEvent(DOBBS.Utility.getCurrentTimeMySQL(), LOGGING_ACTION_SUSPENDED_MANUAL_STOP, dobbsWindow, dobbsWindow.matchIdManual, doAsyncRequest, true); 
  },
  
  onManualResumeLogging : function(doAsyncRequest) { 
    this.onSessionEvent(DOBBS.Utility.getCurrentTimeMySQL(), LOGGING_ACTION_RESUMED_MANUAL_START, dobbsWindow, dobbsWindow.matchIdManual, doAsyncRequest, true); 
  },
  
  
  
  onWindowOpened : function(dobbsWindow) { 
    this.onWindowEvent(DOBBS.Utility.getCurrentTimeMySQL(), null, LOGGING_ACTION_WINDOW_OPENED, dobbsWindow, 0, true); 
  },
  
  onWindowClosed : function(dobbsWindow) { 

    if (this.isEnabled == false) { 
      this.onSessionEvent(DOBBS.Utility.getCurrentTimeMySQL(), LOGGING_ACTION_RESUMED_MANUAL_START_WINDOW_CLOSED, dobbsWindow, dobbsWindow.matchIdManual, false, true); 
    }

    if (dobbsWindow.isBlurred == true) {
      this.onWindowEvent(DOBBS.Utility.getCurrentTimeMySQL(), null, LOGGING_ACTION_WINDOW_FOCUSED_WINDOW_CLOSED, dobbsWindow, dobbsWindow.matchIdFocus, false, true); 
    }
    
    if (dobbsWindow.isIdling == true) { 
      this.onSessionEvent(DOBBS.Utility.getCurrentTimeMySQL(), LOGGING_ACTION_USER_ACTIVE_WINDOW_CLOSED, dobbsWindow, dobbsWindow.matchIdIdle, false, true); 
    }
    
    this.onSessionEnd(dobbsWindow, false); 
    
    this.onWindowEvent(DOBBS.Utility.getCurrentTimeMySQL(), null, LOGGING_ACTION_WINDOW_CLOSED, dobbsWindow, 0, false); 

    
  },
  
  onWindowFocused : function(dobbsWindow, doAsyncRequest) { 
    dobbsWindow.isBlurred = false; 
    this.model.windowHandler.updateLocalStorage();
    this.model.windowHandler.checkWindowState(dobbsWindow.windowId);
    this.onWindowEvent(DOBBS.Utility.getCurrentTimeMySQL(), null, LOGGING_ACTION_WINDOW_FOCUSED, dobbsWindow, dobbsWindow.matchIdFocus, doAsyncRequest, false); 
  },
  
  onWindowBlurred : function(dobbsWindow, doAsyncRequest) {
    dobbsWindow.isBlurred = true; 
    dobbsWindow.matchIdFocus++; 
    this.model.windowHandler.updateLocalStorage();
    this.model.windowHandler.checkWindowState(dobbsWindow.windowId);
    this.onWindowEvent(DOBBS.Utility.getCurrentTimeMySQL(), null, LOGGING_ACTION_WINDOW_BLURRED, dobbsWindow, dobbsWindow.matchIdFocus, doAsyncRequest, false); 
  },
  
  onWindowStateChange : function(dobbsWindow, doAsyncRequest) { 
    if (dobbsWindow.dobbsSessionId < 0) { return; }
    this.onWindowEvent(DOBBS.Utility.getCurrentTimeMySQL(), null, LOGGING_ACTION_NEW_WINDOW_STATE, dobbsWindow, 0, doAsyncRequest, false); 
  },
  
  
  
  
  onSessionStart : function(dobbsWindow, doAsyncRequest) { 
    dobbsWindow.matchIdSession++; 
    this.onSessionEvent(DOBBS.Utility.getCurrentTimeMySQL(), LOGGING_ACTION_SESSION_START, dobbsWindow, dobbsWindow.matchIdSession, doAsyncRequest, true);  
  },
  
  onSessionEnd : function(dobbsWindow, doAsyncRequest) { 
    this.onSessionEvent(DOBBS.Utility.getCurrentTimeMySQL(), LOGGING_ACTION_SESSION_END, dobbsWindow, dobbsWindow.matchIdSession, doAsyncRequest, true);
  },
  
  
  
  onTabAdded : function(dobbsWindow, tab, doAsyncRequest) { 
    this.onWindowEvent(DOBBS.Utility.getCurrentTimeMySQL(), tab, LOGGING_ACTION_TAB_ADDED, dobbsWindow, 0, doAsyncRequest, false); 
  },
  
  onTabClosed : function(dobbsWindow, tab, doAsyncRequest) { 
    this.onWindowEvent(DOBBS.Utility.getCurrentTimeMySQL(), tab, LOGGING_ACTION_TAB_CLOSED, dobbsWindow, 0, doAsyncRequest, false); 
  },
  
  
  
  
  onTabSelectedUrlBlurred : function(dobbsWindow, tab) { 
    this.onBrowseEvent(DOBBS.Utility.getCurrentTimeMySQL(), tab, LOGGING_ACTION_PAGE_BLURRED, dobbsWindow, VISIBILITY_SOURCE_TABSELECT, true, false);
  },
  
  onTabSelectedUrlFocused : function(dobbsWindow, tab) {
    this.onBrowseEvent(DOBBS.Utility.getCurrentTimeMySQL(), tab, LOGGING_ACTION_PAGE_FOCUSED, dobbsWindow, VISIBILITY_SOURCE_TABSELECT, true, false);
  },
  
  
  
  
  
  onUrlLoaded : function(dobbsWindow, tab) {
    this.onBrowseEvent(DOBBS.Utility.getCurrentTimeMySQL(), tab, LOGGING_ACTION_PAGE_LOADED, dobbsWindow, this.model.historyHandler.pageLoadSource, true, false); 
  },
  
  onUrlClosed : function(dobbsWindow, tab) { 
    this.onBrowseEvent(DOBBS.Utility.getCurrentTimeMySQL(), tab, LOGGING_ACTION_PAGE_UNLOADED, dobbsWindow, this.model.historyHandler.pageLoadSource, true, false);
  },
  
  onUrlClosedAtUnload : function(dobbsWindow, tab) { 
    this.onBrowseEvent(DOBBS.Utility.getCurrentTimeMySQL(), tab, LOGGING_ACTION_PAGE_UNLOADED, dobbsWindow, this.model.historyHandler.pageLoadSource, false, false); 
  },
  
  onUrlLoadedAndFocused : function(dobbsWindow, tab) { 
    this.onBrowseEvent(DOBBS.Utility.getCurrentTimeMySQL(), tab, LOGGING_ACTION_PAGE_LOADED_FOCUSED, dobbsWindow, this.model.historyHandler.pageLoadSource, true, false); 
  },
  
  onUrlClosedAndBlurred : function(dobbsWindow, tab) { 
    this.onBrowseEvent(DOBBS.Utility.getCurrentTimeMySQL(), tab, LOGGING_ACTION_PAGE_UNLOADED_BLURRED, dobbsWindow, this.model.historyHandler.pageLoadSource, true, false); 
  },
  
  onUrlClosedAndBlurredAtUnload : function(dobbsWindow, tab) { 
    this.onBrowseEvent(DOBBS.Utility.getCurrentTimeMySQL(), tab, LOGGING_ACTION_PAGE_UNLOADED_BLURRED, dobbsWindow, this.model.historyHandler.pageLoadSource, false, false); 
  },
  
  
  
  
  
  
  
  
  
    
  onSessionEvent : function(time, event, dobbsWindow, matchId, doAsyncRequest, forced) {

    if (this.hasError) { return; } 

    if (forced == false)
      if (!this.isEnabled) { return ; }

    var d = new Date(); var tzOffset = d.getTimezoneOffset();

    console.log("SESSION (" + event + "): " + doAsyncRequest + ", " + this.userId + ", " + dobbsWindow.dobbsWindowId + ", " + dobbsWindow.dobbsSessionId + ", " + event + ", " + matchId + ", " + time + ", " + tzOffset);
    
    if (this.doPersistentLogging) 
      this.model.httpHandler.logSessionEvent(doAsyncRequest, this.userId, dobbsWindow.dobbsWindowId, dobbsWindow.dobbsSessionId, event, matchId, time, tzOffset);
  },
  

  
  onWindowEvent : function(time, tab, event, dobbsWindow, matchId, doAsyncRequest, forced) {
    
    if (this.hasError) { return; } 

    if (forced == false)
      if (!this.isEnabled) { return ; }

    if (tab == null) { tab = new DOBBSModel.Tab(dobbsWindow.windowId, -1, "chrome://newtab/"); }
      
    var d = new Date(); var tzOffset = d.getTimezoneOffset();

    console.log("WINDOW (" + event + "): " + doAsyncRequest + ", " + this.userId + ", " + dobbsWindow.dobbsWindowId + ", " + dobbsWindow.dobbsSessionId + ", " + event + ", " + matchId + ", " + tab.tabId + ", " + dobbsWindow.tabCount + ", " + dobbsWindow.state + ", " + time + ", " + tzOffset);
    
    if (this.doPersistentLogging) 
      this.model.httpHandler.logWindowEvent(doAsyncRequest, this.userId, dobbsWindow.dobbsWindowId, dobbsWindow.dobbsSessionId, event, matchId, tab.tabId, dobbsWindow.tabCount, dobbsWindow.state, time, tzOffset);
  },
    
  onBrowseEvent : function(time, tab, event, dobbsWindow, source, doAsyncRequest, forced) {
    
    if (this.hasError) { return; } 

    if (forced == false)
      if (!this.isEnabled) { return ; }

    
    var d = new Date(); var tzOffset = d.getTimezoneOffset();
    
    
    if ((DOBBS.Utility.isHttpUrl(tab.url))) {
      
      console.log("BROWSE (" + event + "): " + doAsyncRequest + ", " + this.userId + ", " + dobbsWindow.dobbsWindowId + ", " + dobbsWindow.dobbsSessionId + ", " + tab.tabId + ", " + tab.pageLoadId + ", " + tab.focusId + ", " + tab.componentURL.fullURL + ", " + source + ", " + time + ", " + tzOffset);

      
      if (this.doPersistentLogging) {
        this.model.httpHandler.logBrowseEvent(doAsyncRequest, this.userId, dobbsWindow.dobbsWindowId, dobbsWindow.dobbsSessionId, tab.tabId, tab.pageLoadId, tab.focusId, Sha1.hash(tab.componentURL.fullURL), Sha1.hash(tab.componentURL.domainPath), Sha1.hash(tab.componentURL.subdomain), Sha1.hash(tab.componentURL.domain), event, source, time, tzOffset);
      }
    }
  },
  
  onHttpError : function() {
    
  },

  
  
 
};



DOBBS.MessageHandler = function(controller) {
  this.controller = controller;
};

DOBBS.MessageHandler.prototype = {

  initialize : function() {
    var tmpModel = this.controller.model;
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (message.event == "resize") {
        tmpModel.windowHandler.onResize(sender.tab.id, message.newWidth, message.newHeight);
      } 
    });
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






window.dobbsController = new DOBBS.Controller();
window.dobbsController.initialize();


