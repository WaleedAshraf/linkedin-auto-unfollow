const profilePageRegex = /https:\/\/\w{1,3}.linkedin.com\/in/

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (profilePageRegex.test(changeInfo.url)) {
    chrome.tabs.sendMessage(tabId, {
      message: "clicked",
      url: changeInfo.url,
    });
  }
});
