
var DOBBSHTTP = new Array();


DOBBSHTTP.Main = function(model) {
  this.model = model;
};

DOBBSHTTP.Main.prototype = {
 
  doAjaxPostRequest : function(serverUrl, postData, isAsynchronousRequest, successCallback, errorCallback) {
    dump("doAjaxPostRequest\n");
    $.ajax({
      url: serverUrl, type: "post", data: postData, dataType: "xml", 
      async: isAsynchronousRequest, timout: DOBBS_HTTP_REQUEST_TIMEOUT_IN_MILLISECONDS,
      success: function(response, status, request){ if (successCallback != null) { successCallback(response, status, request); } },
      error: function(request, status, error){ if (errorCallback != null) { errorCallback(request, status, error); } }
    });
  },
  
  
  logSessionEvent : function (doAsyncRequest, userID, windowID, sessionID, event, matchId, time, tzOffset) {
    args = {user_id: userID, window_id : windowID, session_id : sessionID, event : event, match_id : matchId, time : time, tz_offset : tzOffset, version : DOBBS_VERSION};
    if (doAsyncRequest)
      this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__LOG_SESSION_EVENT, args, true,
			     DOBBSHTTP.Utility.bind(this, this.onLogResultReceived),
			     DOBBSHTTP.Utility.bind(this, this.onError)
			    );
    else 
      this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__LOG_SESSION_EVENT, args, false, null,
			     DOBBSHTTP.Utility.bind(this, this.onError));
  },
  
  
  
  logWindowEvent : function (doAsyncRequest, userID, windowID, sessionID, event, matchId, tabId, tabCount, windowState, time, tzOffset) {
    args = {user_id: userID, window_id : windowID, session_id : sessionID, event : event, match_id : matchId, tab_id : tabId, tab_count: tabCount, state: windowState, time : time, tz_offset : tzOffset, version : DOBBS_VERSION};
    if (doAsyncRequest)
      this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__LOG_WINDOW_EVENT, args, true,
			     DOBBSHTTP.Utility.bind(this, this.onLogResultReceived),
			     DOBBSHTTP.Utility.bind(this, this.onError)
			    );
    else 
      this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__LOG_WINDOW_EVENT, args, false, null,
			     DOBBSHTTP.Utility.bind(this, this.onError));
  },
  
  logBrowseEvent : function (doAsyncRequest, userID, windowID, sessionID, tabID, loadID, focusID, fullUrl, domainPath, subdomain, domain, event, source, time, tzOffset) {
    args = {user_id: userID, window_id : windowID, session_id : sessionID, tab_id : tabID, load_id : loadID, focus_id : focusID, full_url: fullUrl, domain_path : domainPath, subdomain : subdomain, domain : domain, event : event, source: source, time : time, tz_offset : tzOffset, version : DOBBS_VERSION};
    if (doAsyncRequest)
      this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__LOG_BROWSER_EVENT, args, true,
			     DOBBSHTTP.Utility.bind(this, this.onLogResultReceived),
			     DOBBSHTTP.Utility.bind(this, this.onError));
    else 
      this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__LOG_BROWSER_EVENT, args, false, null,
			     DOBBSHTTP.Utility.bind(this, this.onError));
  },
  

  onLogResultReceived : function(response, status, request) {
    var code = $(response).find("resultcode").text();
    dump("onLogResultReceived: " + code + "\n");
    if (code != 0) { this.model.controller.onHttpError(); }
  },
  
  getUniqueId : function(typeOfId) {
    var args = {id_type : typeOfId};
    this.doAjaxPostRequest(DOBBS_HTTP_SERVER_URL__GET_UNIQUE_ID, args, true,
			   DOBBSHTTP.Utility.bind(this, this.onUniqueIdReceived),
			   DOBBSHTTP.Utility.bind(this, this.onError)
			  );
  },
  
  onUniqueIdReceived : function(response, status, request) {
    this.model.controller.onUniqueIdReceived(response);
  },
  
  onError : function(request, status, error) { this.model.controller.onHttpError(); },

  
};



DOBBSHTTP.Utility = {
  bind : function(context, method, arguments) {
    if (!arguments) { arguments = new Array(); }
    return function() { return method.apply(context, arguments); };
  },


};
