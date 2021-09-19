"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * Create an HTML button to delete a story.
 */
function createDeleteStoryBtn() {
  return $(`
    <button id="delete-story-btn">&times;</button>`
  ).on('click', async function() {
    // get story to delete
    const $storyToDelete = $(this).parents('li');
    const storyId = $storyToDelete.attr('id');

    // remove from api and story lists
    await storyList.removeStory(currentUser, storyId);

    // remove from dom
    $storyToDelete.remove();
    
  });
}


/**
 * Create html star for favoriting stories that is filled when favorited and
 * empty when unfavorited.
 */
function createFavoriteStar() {
  return $(`
    <i class="favorite-story-star bi bi-star" width="10" height="10"></i>
  `)
  .on('click', function() {

    // do nothing if user isn't logged in
    if (!currentUser) return;

    // user is logged in:

    // get story from storyId
    const storyId = $(this).parents('li').attr('id');
    const story = storyList.stories.filter(s => s.storyId === storyId);

    // toggle star's fill property
    $(this).toggleClass('bi-star bi-star-fill');

    if ($(this).attr('class').includes('fill')) {
      currentUser.addToFavorites(story)
    }
  });
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  const $storyMarkup = $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>

        <div class="story-subtext">
          <small class="story-user">posted by ${story.username}</small>
          <span id="subtext-divider">&#124;</span>
        </div>
      </li>
    `);

    // get story subtext
    const $subtext = $storyMarkup.find('.story-subtext')

    // add favorite star to story subtext
    $subtext.append(createFavoriteStar());

    // add delete button for user's own stories
    if (currentUser && story.username === currentUser.username) {
      $subtext.append(createDeleteStoryBtn());
    }

    return $storyMarkup;
}

/**
 * Fills in the 'favorite' star for all story markups in the user's favorites list.
 * Precondition: Story markup must exist for favorited stories before calling.
 */
function showFavoriteStarsForCurrentUser() {
  currentUser.favorites.forEach(story => {
    // get story markup
    $storyMarkup = $(`#${story.storyId}`);
    $storyMarkup.find('.favorite-story-star').toggleClass('bi-star bi-star-fill');
  })
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.prepend($story);
  }

  // if user is logged in, show filled-in stars next to their favorite stories
  if (currentUser) showFavoriteStarsForCurrentUser()

  $allStoriesList.show();
}

/** Gets new story data from the new story form, adds the new story to the storyList
 *  and displays it on the page.
*/
async function putNewStoryOnPage(evt) {
  console.debug("putnewStoryOnPage", evt);

  evt.preventDefault();

  const title = $("#story-title").val();
  const url = $("#story-url").val();
  const author = currentUser.name;

  const story = await storyList.addStory(currentUser, { title, author, url })

  if (story) {
    const $story = generateStoryMarkup(story); // generate story html
    $allStoriesList.prepend($story); // add story to top of all-stories-list
  } 
  else {
    alert('Error submitting story. Try again.')
  }
}

$newStoryForm.on('submit', putNewStoryOnPage);


/**
 * Adds or removes the selected story from the current, authenticated
 * user's list of favorite stories.
 */
async function toggleFavorite(evt) {
  console.debug("toggleFavorite", evt);

  const $favLink = $(evt.target);

  // get the storyId of the parent 'li' element
  const storyId = $favLink.parents('li').attr('id');

  if ($favLink.text() === 'favorite') {
    await currentUser.addToFavorites(storyId);
    $favLink.text('un-favorite');
  }
  else if ($(evt).text() === 'un-favorite') {
    await currentUser.removeFromFavorites(storyId)
    $favLink.text('favorite');
  }
}

$allStoriesList.on('click', '.story-toggle-favorite a', toggleFavorite);


/**
 * Display the current, authenticated user's list of favorite stories.
 */
function putFavoriteStoriesOnPage(evt) {
  console.debug("putFavoriteStoriesOnPage", evt);

  $allStoriesList.empty();

  // loop through all user's favorited stories and generate HTML for them
  for (let fav of currentUser.favorites) {
    const $fav = generateStoryMarkup(fav);
    $allStoriesList.append($fav);
  }

  $allStoriesList.show();
}

$navShowFavorites.on('click', putFavoriteStoriesOnPage);