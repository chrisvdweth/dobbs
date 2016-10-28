 
 
 
 
 
window.onresize = function() {
  chrome.runtime.sendMessage({event: "resize", newWidth : window.outerWidth, newHeight : window.outerHeight });
};
 

 
 