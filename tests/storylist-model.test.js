// StoryList class unit tests

describe('StoryList unit tests', () => {
  // data to create story
  const storyData = {
    title: 'TEST STORY',
    author: 'TEST AUTHOR',
    url: 'https://www.google.com/',
  }

   // Story obj for CRUD actions
  let story;
  
  beforeAll( async() => {
    // login test user 
    const username = 'test'
    const password = 'foo'
    currentUser = await User.login(username, password);
  })

  describe('addStory tests', () => {
    it('should increment the number of stories in StoryList.stories and currentUser.ownStories', async () => {
  
      // length StoryList.stories and currentUser.ownStories before adding a story
      const storiesLengthBefore = storyList.stories.length;
      const ownStoriesLengthBefore = currentUser.ownStories.length;
  
      story = await storyList.addStory(currentUser, storyData);
  
      // length StoryList.stories and currentUser.ownStories after adding a story
      const storiesLengthAfter = storyList.stories.length;
      const ownStoriesLengthAfter = currentUser.ownStories.length;
  
      expect(storiesLengthBefore + 1).toEqual(storiesLengthAfter);
      expect(ownStoriesLengthBefore + 1).toEqual(ownStoriesLengthAfter);
    })

    it('should return a Story object with properties given in the storyData arg', async () => {
      story = await storyList.addStory(currentUser, storyData);

      ['title', 'author', 'url'].forEach(prop => {
        expect(story[prop]).toEqual(storyData[prop]);
      });
   
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

    
  }) // end addStory tests

  describe('removeStory tests', () => {
    let storyId; // id of story to remove

    beforeEach( async() => {
      // add a story to remove
      story = await storyList.addStory(currentUser, storyData);
      storyId = story.storyId
    })

    it(`should remove the given story from StoryList.stories, currentUser.ownStories, and 
        currentUser.favorites`, async () => {
      // add story to user favorites
      currentUser.favorites.push(story);
      
      await storyList.removeStory(currentUser, storyId);

      // get array of ids from story lists
      const idsOf = (stories) => stories.map(s => s.storyId);

      // ensure story lists don't contain removed story
      [storyList.stories, currentUser.ownStories, currentUser.favorites].forEach(stories => {
        expect(idsOf(stories)).not.toContain(storyId);
      });
     
    })
  })
}) // end StoryList tests





