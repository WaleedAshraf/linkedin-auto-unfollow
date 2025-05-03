const profilePageRegex = /https:\/\/\w{1,3}.linkedin.com\/in/

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // Only proceed if URL has changed and page is completely loaded
  if (changeInfo.url && profilePageRegex.test(changeInfo.url)) {
    // Make sure the page is fully loaded before sending the message
    if (changeInfo.status === 'complete') {
      sendMessageToTab(tabId, changeInfo.url);
    } else {
      // Wait for the page to be completely loaded
      chrome.tabs.get(tabId, function(tabInfo) {
        if (tabInfo.status === 'complete') {
          sendMessageToTab(tabId, changeInfo.url);
        }
      });
    }
  }
});

// Helper function to send messages with error handling
function sendMessageToTab(tabId, url) {
  chrome.tabs.sendMessage(tabId, {
    message: "clicked",
    url: url,
  }).catch(error => {
    // Silently handle error - this happens when content script isn't ready yet
    console.log("LinkedIn Auto Unfollow: Could not send message. Content script may not be loaded yet.");
  });
}
