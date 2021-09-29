"use strict";

// So we don't have to keep re-finding things on page, find DOM elements once:

const $body = $("body");

const $storiesLoadingMsg = $("#stories-loading-msg");
const $allStoriesList = $("#all-stories-list");
const $favStoriesList = $("#fav-stories-list");
const $submittedStoriesList = $("#submitted-stories-list");

const $loginForm = $("#login-form");
const $signupForm = $("#signup-form");
const $createOrUpdateStoryForm = $("#create-update-story-form");
const $resetPasswordForm = $("#reset-password-form");

const $navLoginOrSignup = $("#nav-login-signup");
const $navLogOut = $("#nav-logout");
const $navUserProfile = $("#nav-user-profile");

const $navSubmitStory = $("#nav-submit-story");
const $navShowFavorites = $("#nav-show-favorites");
const $navShowSubmissions = $("#nav-show-submissions");

const $userProfile = $("#user-profile");
const $resetPasswordLink = $("#reset-password-link");

/** To make it easier for individual components to show just themselves, this
 * is a useful function that hides pretty much everything on the page. After
 * calling this, individual components can re-show just what they want.
 */

function hidePageComponents() {
  const components = [
    $allStoriesList,
    $favStoriesList,
    $submittedStoriesList,
    $loginForm,
    $signupForm,
    $createOrUpdateStoryForm,
    $userProfile,
    $resetPasswordForm,
  ];
  components.forEach(c => c.hide());
}

/** Overall function to kick off the app. */

async function start() {
  console.debug("start");

  // "Remember logged-in user" and log in, if credentials in localStorage
  await checkForRememberedUser();
  await getAndShowStoriesOnStart();

  // if we got a logged-in user
  if (currentUser) updateUIOnUserLogin();
}

// Once the DOM is entirely loaded, begin the app

console.warn("HEY STUDENT: This program sends many debug messages to" +
  " the console. If you don't see the message 'start' below this, you're not" +
  " seeing those helpful debug messages. In your browser console, click on" +
  " menu 'Default Levels' and add Verbose");
$(start);
