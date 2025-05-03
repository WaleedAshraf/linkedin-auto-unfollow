const profilePageRegex = /https:\/\/\w{1,3}.linkedin.com\/in/
const MAX_COUNT = 50
const FOLLOWING = 'Following'
const FOLLOW = 'Follow'
const ACCEPT = 'Accept'
let intervalId = null
let counter = 0
let acceptButton = null
let profileActionsDiv = null

// get user profileId
const getProfileId = () => {
  const profileIdElement =
    document.getElementById(
      "navigation-index-see-all-experiences"
    ) ??
    document.getElementById(
      "navigation-index-see-all-recommendations"
    ) ??
    document.getElementById("navigation-index-see-all-companies") ??
    document.getElementById("navigation-index-see-all-groups") ??
    document.querySelectorAll("[id^=navigation-index-Show-all]")[0]

  return profileIdElement?.href?.match(
    /fsd_profile%3A([^"|&|?|%]*)/
  )[1]
}

// checking for default linkedin follow button
const getFollowStatus = () => {
  let followStatus = null
  const acceptSpan = document.querySelector('button.artdeco-button--primary span.artdeco-button__text:not(.pvs-sticky-header-profile-actions *)');
  const followSpan = document.querySelector('div[aria-label^="Follow"] span.t-normal:not(.pvs-sticky-header-profile-actions *)');
  const unfollowSpan = document.querySelector('div[aria-label^="Unfollow"] span.t-normal:not(.pvs-sticky-header-profile-actions *)');
  const divsAfterLinksWithOnlyClass = Array.from(document.querySelectorAll('.ph5 a + div')).filter(div => {
    return div.attributes.length === 1 && div.hasAttribute('class');
  });

  if (followSpan) followStatus = FOLLOW
  if (unfollowSpan) followStatus = FOLLOWING
  acceptButton = acceptSpan ? acceptSpan : null
  profileActionsDiv = divsAfterLinksWithOnlyClass[0] ?? null
  return followStatus;
}

// get profile actions div
const getProfileActionsDiv = () => {
  return Array.from(document.querySelectorAll('.ph5 a + div')).filter(div => {
    return div.attributes.length === 1 && div.hasAttribute('class');
  })[0];
}

// stop the interval and reset counter to zero
const stopInterval = (intervalId) => {
  clearInterval(intervalId)
  intervalId = null
  counter = 0
}

// send request to change follow status
const sendRequest = async (setFollowValue, sessionId, profileId) => {
  await fetch(
    `https://${window.location.host}/voyager/api/feed/dash/followingStates/urn:li:fsd_followingState:urn:li:fsd_profile:${profileId}`,
    {
      headers: {
        "csrf-token": sessionId,
      },
      body: `{"patch":{"$set":{"following":${setFollowValue}}}}`,
      method: "POST",
    }
  )
}

const start = () => {
  if (profilePageRegex.test(window.location.href)) {
    if (intervalId) stopInterval(intervalId)

    // wait for the page to fully render
    intervalId = setInterval(() => {
      try {
        const defaultFollow = getFollowStatus()
        const profileActionsDiv = getProfileActionsDiv()
        const profileId = getProfileId()
        counter++

        if (counter > MAX_COUNT) stopInterval(intervalId)

        if (profileId && profileActionsDiv && defaultFollow) {
          stopInterval(intervalId)
          updateDocument(profileId, defaultFollow)
        }
      } catch (e) {
        console.error(`LinkedIn Auto Un-Follow: ${e}, ${e.stack}`)
      }
    }, 100)
  }
}

chrome.runtime.onMessage.addListener(function (req) {
  if (req.message === "clicked") start()
})

start()

// main method to update document
const updateDocument = (profileId, defaultFollow) => {
  let followButtonText, setFollowValue

  if (defaultFollow === FOLLOWING) {
    followButtonText = 'UnFollow'
    setFollowValue = false
  } else {
    followButtonText = 'Follow'
    setFollowValue = true
  }

  const sessionId = document.cookie.match(/JSESSIONID="([^"]*)/)[1]

  if (!document.getElementById("follow-button"))
    profileActionsDiv
      .insertAdjacentHTML(
        "beforeend",
        `<button id="follow-button" class="artdeco-button artdeco-button--2 artdeco-button--secondary ember-view pvs-profile-actions__action"><span class="artdeco-button__text">${followButtonText}</span></button>`
      )

  const followButton = document.getElementById("follow-button")

  const followButtonClick = async (forceUnFollow) => {
    try {
      setFollowValue = forceUnFollow ? false : setFollowValue
      followButton.disabled = true
      await sendRequest(setFollowValue, sessionId, profileId)
      setFollowValue = !setFollowValue
      followButton.disabled = false
      followButton.innerText = setFollowValue
        ? "Follow"
        : "UnFollow"
    } catch (e) {
      console.error(`LinkedIn Auto Un-Follow request error: ${e}, ${e.stack}`)
    }
  }

  followButton.addEventListener("click", () => {
    followButtonClick()
  })

  if (acceptButton) {
    acceptButton.addEventListener("click", () => {
      followButtonClick(true)
    })
  }
}
