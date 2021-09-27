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

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $navShowFavorites.show();
  $navShowSubmissions.show();
  $navSubmitStory.show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}

/** When the current, authenticated user clicks 'submit' in the navbar display the new 
 *  story form.
 */
function navSubmitStoryClick(evt) {
  console.debug("navSubmitStoryClick", evt);

  hidePageComponents();

  // if no user is logged in direct to signup/login form
  if (!currentUser) {
    $('<p id="must-login-msg">You have to be logged in to submit.</p>').prependTo('.account-forms-container');
    $loginForm.show();
    $signupForm.show();
  } 
  else { // user is logged in, show new story form
     
    //set title and submit button to 'submit'
    $('#story-form-title').text('Submit');
    $('#story-submit-btn').text('submit');
    $newStoryForm.show();
  }
  
}

$navSubmitStory.on("click", navSubmitStoryClick);


/** On click of 'favorites' in the navbar, displays a list of favorited stories
 *  by the current, authenticated user. 
 */
function showFavoritesClick(evt) {
  console.debug("navShowFavoritesClick", evt);

  hidePageComponents();

  putFavoriteStoriesOnPage();

  $favStoriesList.show();
}

$navShowFavorites.on('click', showFavoritesClick);

function showSubmissionsClick(evt) {
  console.debug("navShowSumbissionsClick", evt);

  hidePageComponents();

  putSubmittedStoriesOnPage();

  $submittedStoriesList.show();
}

$navShowSubmissions.on('click', showSubmissionsClick);

function navUserProfileClick(evt) {
  console.debug('navUserProfileClick', evt);
  hidePageComponents();

  // remove message indicating if name change was successful
  $userProfile.find('#name-change-msg').text('');
  $userProfile.show();
}

$navUserProfile.on('click', navUserProfileClick);



