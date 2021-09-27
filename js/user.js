"use strict";

// global to hold the User instance of the currently-logged-in user
let currentUser;

/******************************************************************************
 * User login/signup/login
 */


const handleInvalidFormInput = (invalidInput, errorMsg) => {

  switch (invalidInput) {

    case 'loginCredentials':
      // add msg to top of login form
      $('#invalid-login-cred').text(errorMsg);
      break;

    case 'signupUsername':
      // add msg under username input
      $('#invalid-signup-username').text(errorMsg);
      $('#signup-username').focus(); //put the username input into focus
      break;

    case 'invalidResetPassword':
      $('#invalid-reset-password').text(errorMsg);
      $('#current-password').focus();
      break;

    default:
      alert(errorMsg);
  }
    
}

/** Handle login form submission. If login ok, sets up the user instance */

async function login(evt) {
  console.debug("login", evt);

  // prevent page refresh on submit
  evt.preventDefault();

  // grab the username and password
  const username = $("#login-username").val();
  const password = $("#login-password").val();
  $('#invalid-login-cred').text(); // remove invalid input msg from login page
  
  try {
    
    // User.login retrieves user info from API and returns User instance
    // which we'll make the globally-available, logged-in user.
    currentUser = await User.login(username, password);

    saveUserCredentialsInLocalStorage();
    updateUIOnUserLogin();

    //reset input values
    $loginForm.trigger("reset"); 
  }
  catch(err) {
    if (err.message.includes('401')) {
      handleInvalidFormInput('loginCredentials', 
      'Incorrect username or password. Please try again!');
    }
    else {
      alert('Error logging in. Try again.');
      console.err('login failed', err);
    }
  }
}

$loginForm.on("submit", login);


/** Handle signup form submission. */
8
async function signup(evt) {
  console.debug("signup", evt);

  // prevent page refresh on submit
  evt.preventDefault();

  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();
  $('#invalid-signup-username').text();
  
  try{

    // User.signup retrieves user info from API and returns User instance
    // which we'll make the globally-available, logged-in user.
    currentUser = await User.signup(username, password, name);
  
    saveUserCredentialsInLocalStorage();
    updateUIOnUserLogin();
  
    // reset input values
    $signupForm.trigger("reset");
  }
  catch(err) {
    if (err.message.includes('409')) {
      handleInvalidFormInput('signupUsername', `username ${username} is taken!`);
    }
    else {
      alert('Error signing up. Try again.');
      console.error('signup failed', err);
    }
  }
  
}

$signupForm.on("submit", signup);

/** Handle click of logout button
 *
 * Remove their credentials from localStorage and refresh page
 */

function logout(evt) {
  console.debug("logout", evt);
  // clear user credentials
  localStorage.clear();

  // refresh page
  location.reload();
}

$navLogOut.on("click", logout);

function showResetPasswordForm() {
  hidePageComponents();
  $resetPasswordForm.trigger("reset");
  $resetPasswordForm.show();
}
$resetPasswordLink.on('click', showResetPasswordForm);


async function resetPassword(evt) {
  console.debug("resetPassword", evt);

  // prevent page refresh on submit
  evt.preventDefault();

  const newPassword = $("#new-password").val();
  
  try{

    await currentUser.changePassword(newPassword);
  
    // reset input values
    $resetPasswordForm.trigger("reset");

    alert('Password successfully changed!');

    $resetPasswordForm.hide();
    $allStoriesList.show();
  }
  catch(err) {
    alert('Could not reset password. Try again.');
    console.error('resetPassword failed', err);
  }
}

$resetPasswordForm.on('submit', resetPassword);

async function changeName(evt) {
  console.debug('changeName', evt);

  evt.preventDefault();

  const newName = $("#profile-name").val();

  try {
    await currentUser.changeName(newName);

    $('#name-change-msg').text(`Name successfully changed to ${newName}!`);
    currentUser.name = newName;
  }
  catch(err) {
    console.error('changeName failed', err);
  }
}

$userProfile.on('click', '#change-name-btn', changeName);

/******************************************************************************
 * Storing/recalling previously-logged-in-user with localStorage
 */

/** If there are user credentials in local storage, use those to log in
 * that user. This is meant to be called on page load, just once.
 */

async function checkForRememberedUser() {
  console.debug("checkForRememberedUser");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token || !username) return false;

  // try to log in with these credentials (will be null if login failed)
  currentUser = await User.loginViaStoredCredentials(token, username);
}

/** Sync current user information to localStorage.
 *
 * We store the username/token in localStorage so when the page is refreshed
 * (or the user revisits the site later), they will still be logged in.
 */

function saveUserCredentialsInLocalStorage() {
  console.debug("saveUserCredentialsInLocalStorage");
  if (currentUser) {
    localStorage.setItem("token", currentUser.loginToken);
    localStorage.setItem("username", currentUser.username);
  }
}

/******************************************************************************
 * General UI stuff about users
 */

/** When a user signs up or registers, we want to set up the UI for them:
 *
 * - show the stories list
 * - update nav bar options for logged-in user
 * - generate the user profile part of the page
 */

async function updateUIOnUserLogin() {
  console.debug("updateUIOnUserLogin");

  hidePageComponents();

  putStoriesOnPage();
  $allStoriesList.show();

  updateNavOnLogin();
  createUserProfile();
  
}

function createUserProfile() {
  console.debug('createUserProfile');

  // $('#profile-name').text(currentUser.name);
  $('#profile-name').val(currentUser.name);

  // sets title for reset password form and user profile
  $('.title-username').text(currentUser.username);

  $('#profile-created-date').text(currentUser.createdAt.slice(0, 10));
}

$userProfile.on('click', '#show-favorites', showFavoritesClick);
$userProfile.on('click', '#show-submissions', showSubmissionsClick);


