const regex = /https:\/\/\w{1,3}.linkedin.com\/in/;
let counter = 0;
let profileId;

const start = () => {
  if (regex.test(window.location.href)) {
    const intervalId = setInterval(() => {
      const profileIdElement =
        document.getElementById("navigation-index-see-all-experiences") ??
        document.getElementById("navigation-index-see-all-recommendations") ??
        document.getElementById("navigation-index-see-all-companies") ??
        document.getElementById("navigation-index-see-all-groups") ??
        document.querySelectorAll('[id^=navigation-index-Show-all]')[0]

      profileId = profileIdElement?.href?.match(/fsd_profile%3A([^"|&|?|%]*)/)[1];
      counter++;

      const mainDiv = document.getElementsByClassName("pvs-profile-actions")[0]

      if (counter > 30) clearInterval(intervalId);

      if (profileId && mainDiv) {
        clearInterval(intervalId);
        try {
          run(profileId);
        } catch (e) {
          console.error(`LinkedIn Auto Un-Follow: ${e}, ${e.stack}`);
        }
      }
    }, 100);
  }
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "clicked") {
    console.log(request.url); // new url is now in content scripts!
    start();
  }
});

start();

const run = (profileId) => {
  counter = 0;
  const connRequest = document.getElementsByClassName(
    "artdeco-button artdeco-button--2 artdeco-button--primary ember-view pvs-profile-actions__action"
  )[0];

  let following = false;
  console.log("pid", profileId);
  const sessionId = document.cookie.match(/JSESSIONID="([^"]*)/)[1];

  document
    .querySelectorAll(".pvs-profile-actions .display-flex.t-normal.flex-1")
    .forEach((e) => {
      if (e.textContent == "Following") following = true;
    });


  if (following && !document.getElementById("linkedin-unfollow")) {
    document
      .getElementsByClassName("pvs-profile-actions")[0]
      .insertAdjacentHTML(
        "beforeend",
        '<button id="linkedin-unfollow" class="artdeco-button artdeco-button--2 artdeco-button--secondary ember-view pvs-profile-actions__action"><span class="artdeco-button__text">UF</span></button>'
      );

    document
      .getElementById("linkedin-unfollow")
      .addEventListener("click", () => {
        sendRequest(profileId, sessionId);
        document.getElementById("linkedin-unfollow").disabled = true;
      });
  } else if (!following && !document.getElementById("linkedin-follow")) {
    document
      .getElementsByClassName("pvs-profile-actions")[0]
      .insertAdjacentHTML(
        "beforeend",
        '<button id="linkedin-follow" class="artdeco-button artdeco-button--2 artdeco-button--secondary ember-view pvs-profile-actions__action"><span class="artdeco-button__text">F</span></button>'
      );

    document.getElementById("linkedin-follow").addEventListener("click", () => {
      sendRequest(profileId, sessionId, "true");
      document.getElementById("linkedin-follow").disabled = true;
    });
  }

  if (connRequest?.innerText == "Accept") {
    connRequest.addEventListener("click", () => {
      sendRequest(profileId, sessionId);
    });
  }
};
const sendRequest = (profileId, sessionId, follow = "false") => {
  fetch(
    `https://${window.location.host}/voyager/api/feed/dash/followingStates/urn:li:fsd_followingState:urn:li:fsd_profile:${profileId}`,
    {
      headers: {
        "csrf-token": sessionId,
      },
      body: `{"patch":{"$set":{"following":${follow}}}}`,
      method: "POST",
    }
  );
};
