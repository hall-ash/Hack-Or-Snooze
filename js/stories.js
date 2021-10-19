"use strict";

// This is the global map of the stories, an instance of StoriesMap
let storiesMap;

/** Get and show stories when site first loads. */
async function getAndShowStoriesOnStart() {

  try {
    // build the map of stories
    storiesMap = await StoriesMap.getStories();

    // remove the loading message
    $storiesLoadingMsg.remove();

    // display list of story markups on page
    putStoriesOnPage();
  }
  catch(err) {
    alert('Error loading stories.');
    console.error(err);
  }
}

/**
 * Create an HTML dropdown item to delete a story. 
 * 
 * Returns the dropdown item markup. 
 */
function getDeleteStoryDropdownItem() {
  return $(`
  <a class="dropdown-item text-danger" id="delete-story-dropdown" href="#">delete</a>
  `).on('click', async function() {

    try {
      // get story to delete
      const $storyToDelete = $(this).parents('li');
      const storyId = $storyToDelete.attr('id');

      // remove from api and story lists
      await storiesMap.removeStory(currentUser, storyId);

      // remove from dom
      $storyToDelete.remove();
    }
    catch(err) {
      alert('Error deleting story. Try again.');
      console.error(err);
    }
    
  });
}

/**
 * Create an HTML dropdown item that displays the form to edit a story
 * on clicking. 
 * 
 * Returns the dropdown item markup.
 */
function getEditStoryDropdownItem() {
  return $(`
  <a class="dropdown-item" id="edit-story-dropdown" href="#">edit</a>
  `).on('click', function() {

    // get the story object from the story id
    const storyId = $(this).parents('li').attr('id');
    const story = storiesMap.stories.get(storyId);

    // add storyId to form's dataset, so the update form
    // will know which story to update
    $createOrUpdateStoryForm.data('story-id', storyId);

    // update inputs in story submit form with info from current story
    $('#story-author').val(story.author);
    $('#story-title').val(story.title);
    $('#story-url').val(story.url);

    // change title and button text on story form to 'update'
    $('#story-form-title').text('Update');
    $('#story-submit-btn').text('update');

    hidePageComponents();

    // display the form
    $createOrUpdateStoryForm.show();
  });
}


/**
 * Create an HTML star for favoriting stories that is filled with color when a
 * story is favorited and emptied when unfavorited.
 * 
 * Returns the favorite star markup. 
 */
function getFavoriteStar() {
  return $(`
    <i class="favorite-story-star bi bi-star" width="10" height="10" data-toggle="tooltip" data-placement="right" title="Login or signup to favorite!"></i>
  `)
  .on('click', function() {

    // if user isn't logged in, display tooltip 
    // indicating that user needs to login/signup to favorite
    if (!currentUser) {
      $(this).tooltip('show');
      return;
    }

    // user is logged in:
    
    // get story from storyId
    const storyId = $(this).parents('li').attr('id');
    const story = storiesMap.stories.get(storyId);

    // if star is filled, display an empty star; if empty, display filled
    $(this).toggleClass('bi-star bi-star-fill');

    // remove story from favorites if already there
    if (currentUser.favorites.has(storyId)) {
      currentUser.removeFromFavorites(story);
    }
    else { // add story if not in favorites
      currentUser.addToFavorites(story);
    }
  
  });
}

/**
 * Create a dropdown that allows a user to edit or delete a submitted story. 
 */
function getUpdateOrDeleteStoryDropdown() {
  const $dropdown = $(`
    <div class="dropdown">
      <button class="btn btn-link btn-sm p-0 mt-1" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        <i class="bi bi-three-dots"></i>
      </button>
  
      <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
      </div>
    </div>
  `);

  // add edit and delete dropdown items to dropdown menu
  const $dropdownMenu = $dropdown.find('.dropdown-menu');
  $dropdownMenu.append(getEditStoryDropdownItem());
  $dropdownMenu.append('<hr>');
  $dropdownMenu.append(getDeleteStoryDropdownItem());

  return $dropdown;
}


/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  // determine if story is user's own
  let ownStory = currentUser && currentUser.username === story.username;

  // create story markup
  // if ownStory is true, markup will display 'posted by me' instead of posted by user's username
  const $storyMarkup = $(`
      <li id="${story.storyId}">
        <div id="story-main">
          <a id="story-markup-url" href="${story.url}" target="a_blank" class="story-link">
            <span id="story-markup-title">${story.title}</span>
          </a>
          <small id="story-markup-hostname" class="story-hostname">(${story.getHostName()})</small>
          <small id="story-markup-author" class="story-author">by ${story.author}</small>
        </div>
        <div class="story-subtext d-flex align-items-center justify-content-between" style="width: 110px;">
          <small class="story-user">posted by ${ownStory? '<span class="font-weight-bold">me</span>' : story.username}</small>
        </div>
      </li>
    `);

    // get story subtext
    const $subtext = $storyMarkup.find('.story-subtext')

    // add delete and update dropdown for user's own stories and append to story subtext
    if (ownStory) {
      $subtext.append(getUpdateOrDeleteStoryDropdown);
    }

    // add favorite star to story subtext
    $subtext.append(getFavoriteStar());

    return $storyMarkup;
}

/**
 * Change the markup for a story to reflect its updated data.
 * 
 * - updatedStory: the Story instance that has been updated
 */
const updateStoryMarkup = (updatedStory) => {

  // find the markup to update with the story's id
  const $markupToUpdate = $allStoriesList.find(`#${updatedStory.storyId}`);

  // update the markup with the story's new data
  $markupToUpdate.find('#story-markup-title').text(updatedStory.title);
  $markupToUpdate.find('#story-markup-hostname').text(`${updatedStory.getHostName()}`);
  $markupToUpdate.find('#story-markup-author').text(updatedStory.author);
}

/**
 * Fills in the 'favorite' star for all story markups in the user's favorites list.
 */
function showFavoriteStarsForCurrentUser() {

  // loop through user's favorite stories and display the filled in star in their markups
  for (const storyId of currentUser.favorites.keys()) {
    
    // get story markup
    const $storyMarkup = $(`#${storyId}`);

    // adds bi-star-fill class, removes bi-star class
    $storyMarkup.find('.favorite-story-star').toggleClass('bi-star bi-star-fill');
  }
   
}


/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // sort stories with the lastest first
  const storyList = [...storiesMap.stories.values()].sort((storyA, storyB) => {
    const dateA = new Date(storyA.createdAt);
    const dateB = new Date(storyB.createdAt);
    return dateB - dateA;
  });

  // loop through all of our stories and generate markups for them
  for (const story of storyList ) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  // if user is logged in, show filled-in stars next to their favorite stories
  if (currentUser) showFavoriteStarsForCurrentUser()

  $allStoriesList.show();
}

/** Gets new story data from the new story form, adds the new story to the storyList
 *  and displays it on the page.
*/
async function updateOrSubmitNewStory(evt) {
  console.debug("updateOrSubmitNewStory", evt);

  // don't submit like normal, 
  evt.preventDefault();

  const title = $("#story-title").val();
  const url = $("#story-url").val();
  const author = $("#story-author").val();

  if (!title || !url || !author) {
    alert('Make sure all forms are filled out!');
    return;
  }

  const storyData = { title, url, author, username: currentUser.username }

  const $storySubmitBtn = $('#story-submit-btn');
  
  try {

    if ($storySubmitBtn.text() === 'submit') {
      const newStory = await storiesMap.addStory(currentUser, storyData);
      
      const $newStory = generateStoryMarkup(newStory);
      $allStoriesList.prepend($newStory);
    }
    else if ($storySubmitBtn.text() === 'update') {

      const storyId = $createOrUpdateStoryForm.data('story-id');

      const updatedStory = await storiesMap.updateStory(currentUser, storyId, storyData);

      // update the markup
      updateStoryMarkup(updatedStory);

      // reset story id data
      $createOrUpdateStoryForm.data('story-id', '');
    }
    
    $createOrUpdateStoryForm.hide();
    $createOrUpdateStoryForm.trigger('reset');

    // show the home page with the new story
    $allStoriesList.show();

  }
  catch(err) {
    // alert('Error occurred. Try again.')
    console.error(err);
  }
}

$createOrUpdateStoryForm.on('submit', updateOrSubmitNewStory);


/**
 * Display the current user's favorite stories.
 */
function putFavoriteStoriesOnPage(evt) {
  console.debug("putFavoriteStoriesOnPage", evt);

  $favStoriesList.empty();

  // loop through user's favorited stories and generate HTML for them
  if (currentUser.favorites.size) {
    for (const fav of currentUser.favorites.values()) {
      const $favMarkup = generateStoryMarkup(fav);
      
      // add bi-star-fill, remove bi-star
      $favMarkup.find('.favorite-story-star').toggleClass('bi-star bi-star-fill');
      
      $favStoriesList.append($favMarkup);
    }
  }
  else {
    $favStoriesList.append('<h4>No favorites added.</h4>')
  }

  $favStoriesList.show();

}
$navShowFavorites.on('click', putFavoriteStoriesOnPage);


/**
 * Display the current user's submitted stories.
 */
function putSubmittedStoriesOnPage(evt) {
  console.debug("putSubmittedStoriesOnPage", evt);

  $submittedStoriesList.empty();

  // loop through user's own stories and generate markup
  if (currentUser.ownStories.size) {
    for (const story of currentUser.ownStories.values()) {
      const $story = generateStoryMarkup(story);

      // if story in favorites, display filled in star
      if (currentUser.favorites.has(story.storyId)) {
        $story.find('.favorite-story-star').toggleClass('bi-star bi-star-fill');
      }

      $submittedStoriesList.append($story);
    }
  }
  else {
    $submittedStoriesList.append('<h4>No submissions.</h4>')
  }

  $submittedStoriesList.show();

}
$navShowSubmissions.on('click', putSubmittedStoriesOnPage);