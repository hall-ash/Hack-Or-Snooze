// update comments, add more tests

// StoryList class unit tests

describe('StoryList unit tests', () => {
  // data to create story
  const storyData = {
    title: 'TEST STORY - StoriesMap model',
    author: 'TEST AUTHOR',
    url: 'https://www.google.com/',
  }

   // Story obj for CRUD actions
  let story;
  
  beforeAll( async() => {
    // login test user 
    const username = ''
    const password = ''
    currentUser = await User.login(username, password);
  })

  describe('addStory tests', () => {
    it('should increment the number of stories in StoryList.stories and currentUser.ownStories', async () => {
  
      // length StoryList.stories and currentUser.ownStories before adding a story
      const storiesLengthBefore = storiesMap.stories.size;
      const ownStoriesLengthBefore = currentUser.ownStories.size;
  
      story = await storiesMap.addStory(currentUser, storyData);
  
      // length StoryList.stories and currentUser.ownStories after adding a story
      const storiesLengthAfter = storiesMap.stories.size;
      const ownStoriesLengthAfter = currentUser.ownStories.size;
  
      expect(storiesLengthBefore + 1).toEqual(storiesLengthAfter);
      expect(ownStoriesLengthBefore + 1).toEqual(ownStoriesLengthAfter);
    })

    it('should return a Story object with properties given in the storyData arg', async () => {
      story = await storiesMap.addStory(currentUser, storyData);

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
      story = await storiesMap.addStory(currentUser, storyData);
      storyId = story.storyId
    })

    it(`should remove the given story from StoryList.stories, currentUser.ownStories, and 
        currentUser.favorites`, async () => {
      // add story to user favorites
      currentUser.favorites.set(storyId, story);
      
      await storiesMap.removeStory(currentUser, storyId);

      expect(storiesMap.stories.has(storyId)).toBe(false)
      expect(currentUser.ownStories.has(storyId)).toBe(false)
      expect(currentUser.favorites.has(storyId)).toBe(false)
     
    })
  })
}) // end StoryList tests





