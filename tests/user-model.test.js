// update comments, add more tests

describe('User unit tests', () => {

  let story; // story to fav or unfav

  beforeAll( async() => {
    // login test user 
    const username = ''
    const password = ''
    currentUser = await User.login(username, password);

  }) 

  beforeEach( async() => {
    // data to create story
    const storyData = {
      title: 'TEST STORY - User model',
      author: 'TEST AUTHOR',
      url: 'https://www.google.com/',
    }

    // add story to api
    story = await storiesMap.addStory(currentUser, storyData);
  })

  describe('addToFavorites tests', () => {
    it('should add the favorited story to the favorites property in the User instance', async () => {
      await currentUser.addToFavorites(story);

      const inFavorites = currentUser.favorites.has(story.storyId);
      expect(inFavorites).toBe(true);
    })

  }) // end addToFavorites tests

  describe('removeFromFavorites tests', () => {
    it('should remove the story from the favorites propery in the User instance', async () => {
      await currentUser.removeFromFavorites(story);

      const inFavorites = currentUser.favorites.has(story.storyId);
      expect(inFavorites).toBe(false);
    })
  })

  afterEach( async() => {
    // delete story from api
    if (story) {
      await axios({
        url: `${BASE_URL}/stories/${story.storyId}`,
        method: "DELETE",
        data: {
          token: currentUser.loginToken,
        }
      });
    }
  })

}) // end User tests
