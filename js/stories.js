"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  try {

    storyList = await StoryList.getStories();
    $storiesLoadingMsg.remove();
    putStoriesOnPage();

  }
  catch(err) {
    alert('Error loading stories.');
    console.error(err);
  }
}

/**
 * Create an HTML dropdown item to delete a story.
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
      await storyList.removeStory(currentUser, storyId);

      // remove from dom
      $storyToDelete.remove();
    }
    catch(err) {
      alert('Error deleting story. Try again.');
      console.error(err);
    }
    
  });
}


function getEditStoryDropdownItem() {
  return $(`
  <a class="dropdown-item" id="edit-story-dropdown" href="#">edit</a>
  `).on('click', function() {
    const storyId = $(this).parents('li').attr('id');
    const story = storyList.stories.get(storyId);

    // add storyId to form's dataset
    $newStoryForm.data('story-id', storyId);

    // update inputs in story submit form
    $('#story-author').val(story.author);
    $('#story-title').val(story.title);
    $('#story-url').val(story.url);

    // change title and button text on new story form to 'update'
    $('#story-form-title').text('Update');
    $('#story-submit-btn').text('update');

    hidePageComponents();
    $newStoryForm.show();

  });
}


/**
 * Create html star for favoriting stories that is filled when favorited and
 * empty when unfavorited.
 */
function getFavoriteStar() {
  return $(`
    <i class="favorite-story-star bi bi-star" width="10" height="10" data-toggle="tooltip" data-placement="right" title="Login or signup to favorite!"></i>
  `)
  .on('click', function() {

    // do nothing if user isn't logged in
    if (!currentUser) {
      $(this).tooltip('show');
      return;
    }

    // user is logged in:
    
    // get story from storyId
    const storyId = $(this).parents('li').attr('id');
    const story = storyList.stories.get(storyId);

    // toggle star's fill property
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

  let ownStory = currentUser && currentUser.username === story.username;

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

    // add delete and update button for user's own stories
    if (ownStory) {
      $subtext.append(getUpdateOrDeleteStoryDropdown);
    }

    // add favorite star to story subtext
    $subtext.append(getFavoriteStar());

    return $storyMarkup;
}

const updateStoryMarkup = (updatedStory) => {

  const $markupToUpdate = $allStoriesList.find(`#${updatedStory.storyId}`);

  $markupToUpdate.find('#story-markup-title').text(updatedStory.title);
  $markupToUpdate.find('#story-markup-hostname').text(`${updatedStory.getHostName()}`);
  $markupToUpdate.find('#story-markup-author').text(updatedStory.author);
}

/**
 * Fills in the 'favorite' star for all story markups in the user's favorites list.
 * Precondition: Story markup must exist for favorited stories before calling.
 */
function showFavoriteStarsForCurrentUser() {
  for (const storyId of currentUser.favorites.keys()) {
    // get story markup
    console.log(storyId);
    const $storyMarkup = $(`#${storyId}`);
    $storyMarkup.find('.favorite-story-star').toggleClass('bi-star bi-star-fill');
  }
   
}


/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (const story of storyList.stories.values()) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  console.log('stories', storyList.stories.values());

  // if user is logged in, show filled-in stars next to their favorite stories
  if (currentUser && $allStoriesList[0].childElementCount) showFavoriteStarsForCurrentUser()

  $allStoriesList.show();
}

/** Gets new story data from the new story form, adds the new story to the storyList
 *  and displays it on the page.
*/
async function updateOrSubmitNewStory(evt) {
  console.debug("updateOrSubmitNewStory", evt);

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
      const newStory = await storyList.addStory(currentUser, storyData);

      const $story = generateStoryMarkup(newStory); // generate story html
      $allStoriesList.prepend($story); // add story to top of all-stories-list
      
    }
    else if ($storySubmitBtn.text() === 'update') {

      const storyId = $newStoryForm.data('story-id');

      const updatedStory = await storyList.updateStory(currentUser, storyId, storyData);

      // update the markup
      updateStoryMarkup(updatedStory);

      // reset story id data
      $newStoryForm.data('story-id', '');
      
    }
    
    $newStoryForm.hide();
    $newStoryForm.trigger('reset');

    // show the home page with the new story
    $allStoriesList.show();

  }
  catch(err) {
    // alert('Error occurred. Try again.')
    console.error(err);
  }
}

$newStoryForm.on('click', 'button', updateOrSubmitNewStory);


/**
 * Display the current, authenticated user's list of favorite stories.
 */
function putFavoriteStoriesOnPage(evt) {
  console.debug("putFavoriteStoriesOnPage", evt);

  $favStoriesList.empty();

  console.log(currentUser.favorites);
  // loop through all user's favorited stories and generate HTML for them
  if (currentUser.favorites.size) {
    for (const fav of currentUser.favorites.values()) {
      console.log(fav);
      const $favMarkup = generateStoryMarkup(fav);
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


function putSubmittedStoriesOnPage(evt) {
  console.debug("putSubmittedStoriesOnPage", evt);

  $submittedStoriesList.empty();

  if (currentUser.ownStories.size) {
    for (const story of currentUser.ownStories.values()) {
      const $story = generateStoryMarkup(story);
      $submittedStoriesList.append($story);
    }
  }
  else {
    $submittedStoriesList.append('<h4>No submissions.</h4>')
  }

  $submittedStoriesList.show();
}

$navShowSubmissions.on('click', putSubmittedStoriesOnPage);