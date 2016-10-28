
var DOBBSView = new Array();


DOBBSView.Main = function(controller) {
  this.controller = controller;
  this.contextMenu = new DOBBSView.ContextMenu(this);
  
};


DOBBSView.Main.prototype = {
  
  initialize : function() {
    this.contextMenu.initialize();
  },
  
  
  setEnabled : function() {
    this.contextMenu.setMenuItemEnabled(this.contextMenu.enableMenuId, true);
    this.contextMenu.setMenuItemTitle(this.contextMenu.enableMenuId, "Disable Logging");
  },
  
  setDisabled : function() {
    this.contextMenu.setEnabled(this.contextMenu.enableMenuId, false);
    this.contextMenu.setMenuItemTitle(this.contextMenu.enableMenuId, "Enable Logging");
  },
  
  setMenuTitleToEnabled : function() {
    this.contextMenu.setMenuItemTitle(this.contextMenu.enableMenuId, "Diasable Logging");
  },
  
  setMenuTitleToEnabled : function() {
    this.contextMenu.setMenuItemTitle(this.contextMenu.enableMenuId, "Enable Logging");
  },

  
  openNewVersionWindow : function() {
    chrome.windows.create({ width : 400, height : 300, type : "popup", url : DOBBS_URL_PROJECT_WEBSITE__PAGE_NEW_VERSION}) ;
  },
  
};




DOBBSView.ContextMenu = function(view) {
  this.view = view;
  this.topMenuId = -1;
  this.enableMenuId = -1;
  this.isEnabled = false;
};


DOBBSView.ContextMenu.prototype = {
  
  initialize : function() {
    var tmp = this;
    this.topMenuId = chrome.contextMenus.create({ title : "DOBBS",  type : "normal"});
    this.enableMenuId = chrome.contextMenus.create({ title : "Enable Logging",  type : "normal", parentId : this.topMenuId, onclick : function (info, tab) { tmp.onEnableMenuItemClick() } });
    
    
  },
  
  setMenuItemEnabled : function(menuItemId, isEnabled) {
    chrome.contextMenus.update(menuItemId, { enabled : isEnabled }) ;
    this.isEnabled = isEnabled;
  },
  
  setMenuItemTitle: function(menuItemId, newTitle) {
    chrome.contextMenus.update(menuItemId, { title : newTitle }) ;
  },
  
  
  onEnableMenuItemClick : function() {
    if (this.isEnabled == true) {
      this.isEnabled = false;
      this.view.controller.disableLogging();
      this.setMenuItemTitle(this.enableMenuId, "Enable Logging");
    } else {
      this.view.controller.enableLogging();
      
    }
  },
};