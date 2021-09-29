"use strict";

// global to hold the User instance of the currently-logged-in user
let currentUser;

/******************************************************************************
 * User login/signup/login
 */


/** Handle login form submission. If login ok, sets up the user instance */
async function login(evt) {
  console.debug("login", evt);

  // prevent page refresh on submit
  evt.preventDefault();

  // grab the username and password
  const username = $("#login-username").val();
  const password = $("#login-password").val();
  $('#invalid-login-cred').text(); // remove invalid input msg from login form
  
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
     // user input incorrect login or password
    if (err.message.includes('401')) {

      $('#invalid-login-cred').text('Incorrect username or password. Please try again!');
    
    }
    else {

      alert('Error logging in. Try again.');
      console.err('login failed', err);
    
    }
  }

}
$loginForm.on("submit", login);


/** Handle signup form submission. */
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
    // username has been taken
    if (err.message.includes('409')) {

      // add error msg under username input
      $('#invalid-signup-username').text(`username ${username} is taken!`);
      //put the username input into focus
      $('#signup-username').focus(); 

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


/**
 * Display the reset password form. 
 */
function showResetPasswordForm() {
  hidePageComponents();

  // clear password input
  $resetPasswordForm.trigger("reset");

  $resetPasswordForm.show();
}
$resetPasswordLink.on('click', showResetPasswordForm);


/**
 * Reset the current user's password with inputted value from the reset password form.
 */
async function resetPassword(evt) {
  console.debug("resetPassword", evt);

  // prevent page refresh on submit
  evt.preventDefault();

  // get the new password
  const newPassword = $("#new-password").val();
  
  try{

    // send server request to change password
    await currentUser.changePassword(newPassword);
  
    // reset input values
    $resetPasswordForm.trigger("reset");

    alert('Password successfully changed!');

    $resetPasswordForm.hide();

    // take user back to home page
    $allStoriesList.show();
  
  }
  catch(err) {

    alert('Could not reset password. Try again.');
    console.error('resetPassword failed', err);
  
  }

}
$resetPasswordForm.on('submit', resetPassword);


/**
 * Change the user's name to the inputted value. 
 */
async function changeName(evt) {
  console.debug('changeName', evt);

  evt.preventDefault();

  // get the new name
  const newName = $("#profile-name").val();

  try {

    // send server request to change name and change User instance's name prop
    await currentUser.changeName(newName);

    // display success message
    $('#name-change-msg').text(`Name successfully changed to ${newName}!`);
    
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

  // get token and username from local storage
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  // if token or username are null, don't attempt to log in
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

  // add user's token and username to local storage
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

  updateNavOnLogin();
  
  createUserProfile();
  
}

/**
 * Create a user profile for the current user.
 * Display the user's username in the title, the name,
 * and the date of account creation.
 */
function createUserProfile() {
  console.debug('createUserProfile');

  // sets user profile title to display 'Profile for <username>'
  $('.title-username').text(currentUser.username);

  $('#profile-name').val(currentUser.name);

  $('#profile-created-date').text(currentUser.createdAt.slice(0, 10));
}

// allow user to view their favorites and submissions from user profile
$userProfile.on('click', '#show-favorites', showFavoritesClick);
$userProfile.on('click', '#show-submissions', showSubmissionsClick);


