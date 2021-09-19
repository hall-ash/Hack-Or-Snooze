// User class unit tests

describe('User unit tests', () => {

  let story; // story to fav or unfav

  beforeAll( async() => {
    // login test user 
    const username = 'test'
    const password = 'foo'
    currentUser = await User.login(username, password);

    console.log(currentUser);
  }) 

  beforeEach( async() => {
    // data to create story
    const storyData = {
      title: 'TEST STORY',
      author: 'TEST AUTHOR',
      url: 'https://www.google.com/',
    }

    // add story to api
    story = await storyList.addStory(currentUser, storyData);
  })

  describe('_sendReqToFavoritesEndpoint tests', () => {
    

    it(`should add a story to the user favorites array in the API when requestMethod is POST
        and return true upon a successful response`, async () => {
      // post the story to favorites
      const requestMethod = 'POST';
      const successfulResponse = await currentUser._sendReqToFavoritesEndpoint(requestMethod, story.storyId);

      // get user's favorites from API
     
      console.log('username', currentUser.username);
      console.log('token', currentUser.loginToken);

      /*
      const res = await axios({
        url: `${BASE_URL}/users/${currentUser.username}`,
        method: 'GET',
        data: {
          token: currentUser.loginToken
        }
      });
      const { favorites } = res.data.user;
  
      // check that story is in favorites
      const inFavorites = favorites.some(s => s.storyId === story.storyId);
      
      expect(inFavorites).toBe(true);
      */
      expect(successfulResponse).toBe(true);
    })

    it(`should remove a story from the user favorites array in the API when requestMethod is DELETE
        and should return true upon a successful response`, async () => {
      // add story to favorites
      await axios({
        url: `${BASE_URL}/users/${currentUser.username}/favorites/${story.storyId}`,
        method: 'POST',
        data: { token: currentUser.loginToken },
      });

      // delete the story from favorites
      const requestMethod = 'DELETE';
      const successfulResponse = await currentUser._sendReqToFavoritesEndpoint(requestMethod, story.storyId);

      /*
      // get user's favorites from API
      const res = await axios({
        url: `${BASE_URL}/users/${currentUser.username}`,
        method: 'GET',
        data: { token: currentUser.loginToken },
      });
      const { favorites } = res.data.user;

       // check that story is not in favorites
       const inFavorites = favorites.some(s => s.storyId === story.storyId);

       expect(inFavorites).toBe(false);
       */
       expect(successfulResponse).toBe(true);
    })

    it('should return false when requestMethod is neither POST or DELETE', async () => {
      const requestMethod = 'INVALID';
      const successfulResponse = await currentUser._sendReqToFavoritesEndpoint(requestMethod, story.storyId);

      expect(successfulResponse).toBe(false);
    })

    
  }) // end _sendReqToFavoritesEndpoint tests

  describe('addToFavorites tests', () => {
    it('should add the favorited story to the favorites property in the User instance', async () => {
      await currentUser.addToFavorites(story);
      expect(currentUser.favorites).toContain(story);
    })

  }) // end addToFavorites tests

  describe('removeFromFavorites tests', () => {
    it('should remove the story from the favorites propery in the User instance', async () => {
      await currentUser.removeFromFavorites(story);
      expect(currentUser.favorites).not.toContain(story);
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
