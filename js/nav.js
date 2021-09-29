"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}
$body.on("click", "#nav-all", navAllStories);


/** Show login/signup on click on "login / signup" */

function navLoginOrSignupClick(evt) {
  console.debug("navLoginOrSignupClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}
$navLoginOrSignup.on("click", navLoginOrSignupClick);


/** 
 * When a user first logins in, update the navbar to reflect that. 
 * Displays the following nav items: favorites, submissions, submit, user profile, logout
 * Hides the login/logout nav item.
*/

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $navShowFavorites.show();
  $navShowSubmissions.show();
  $navSubmitStory.show();
  $navLoginOrSignup.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}

/** 
 * When the current user clicks 'submit' in the navbar display the form
 * to create a story. 
 */
function navSubmitStoryClick(evt) {
  console.debug("navSubmitStoryClick", evt);

  hidePageComponents();
     
  // set title and submit button text to 'submit' to indicate form is for
  // creating a story (not updating)
  $('#story-form-title').text('Submit');
  $('#story-submit-btn').text('submit');

  $createOrUpdateStoryForm.show();
}
$navSubmitStory.on("click", navSubmitStoryClick);


/**
 *  On click of 'favorites' in the navbar, display a list of favorited stories
 *  by the current user. 
 */
function showFavoritesClick(evt) {
  console.debug("navShowFavoritesClick", evt);

  hidePageComponents();

  // create a list of story markups favorited by the user and display
  putFavoriteStoriesOnPage();
}
$navShowFavorites.on('click', showFavoritesClick);


/**
 * On click of 'submissions' in the navbar, display a list of user
 * submitted stories.
 */
function showSubmissionsClick(evt) {
  console.debug("navShowSumbissionsClick", evt);

  hidePageComponents();

  // create a list of story markups submitted by the user and display
  putSubmittedStoriesOnPage();
}
$navShowSubmissions.on('click', showSubmissionsClick);


/**
 * On click of user profile nav item, display the user's profile. 
 */
function navUserProfileClick(evt) {
  console.debug('navUserProfileClick', evt);

  hidePageComponents();

  // clear message indicating if user name change was successful
  $userProfile.find('#name-change-msg').text('');

  $userProfile.show();
}
$navUserProfile.on('click', navUserProfileClick);



