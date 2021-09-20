"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    return new URL(this.url).host;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // build stories map: key = storyId, value = instance of Story class
    const stories = response.data.stories.reduce((storyMap, story) => {
      return storyMap.set(story.storyId, new Story(story))
    }, new Map())
    
    // build an instance of our own class using the new map of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - newStory object - {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, {title, author, url}) {
    try {
      // send POST request with given args to create story and
      // await response containing JSON story object in response body
      const response = await axios({
        url: `${BASE_URL}/stories`,
        method: "POST",
        data: { 
          token: user.loginToken,
          story: { author, title, url } 
        },
      })

      console.log('POST STORY', response);

      if (response.status === 201) {
        // from JSON data, create Story obj
        const newStory = new Story(response.data.story);

        // update storyList.stories & user's stories
        this.stories.set(newStory.storyId, newStory);
        user.ownStories.set(newStory.storyId, newStory);

        return newStory;
      }
      else {
        throw new Error('response status:', response.status);
      }
      

    } catch(err) {
      console.error('addStory failed', err);
    }
    
  }

  /**
   * Removes the Story object with the given storyId from storyList.stories,
   * user.ownStories, and user.favorites if favorited. Also removes the story's
   * data from the API.
   * 
   * - user - the current instance of User who will remove the story
   * - storyId - the storyId of the Story to be removed
   */
  async removeStory(user, storyId) {

    try {
      // send DELETE request to remove given story and
      // await response containing JSON story object in response body
      const response = await axios({
        url: `${BASE_URL}/stories/${storyId}`,
        method: "DELETE",
        data: {
          token: user.loginToken,
        }
      })
      console.log('DELETE', response);
      if (response.status === 200) {

        // remove story from all story lists
        this.stories.delete(storyId);
        user.ownStories.delete(storyId);
        user.favorites.delete(storyId);
      }
      else {
        throw new Error('response status:', response.status);
      }
    }
    catch(err) {
      console.error('removeStory failed', err);
    }
    

  }

} // end body StoryList class


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = [],
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.reduce((storyMap, story) => {
      return storyMap.set(story.storyId, new Story(story));
    }, new Map());

    this.ownStories = ownStories.reduce((storyMap, story) => {
      return storyMap.set(story.storyId, new Story(story));
    }, new Map());

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }


  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    
    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
    
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  /**
   * Sends an http request to the API's 'favorites' endpoint. Returns true
   * if a successful response was returned.
   * 
   * - requestMethod - the type of http request, either POST or DELETE
   * - storyId - the id of the story to remove or add to favorites
   */
  async _sendReqToFavoritesEndpoint(requestMethod, storyId) {
    try {

      if (requestMethod === 'POST' || requestMethod === 'DELETE') {
        const { username, loginToken: token } = this;
    
        const response = await axios({
          url: `${BASE_URL}/users/${username}/favorites/${storyId}`,
          method: requestMethod,
          data: { token },
        });
    
        if (response.status === 200) {
          console.log(requestMethod, 'story to/from favorites');
          return true;
        } 
      }

      return false;

    } 
    catch(err) {
      console.error('_sendRequestToFavorites failed', err)
    }
    
  }

  /** Add a story to list of user favorites.
   * 
   */
  async addToFavorites(story) {
    try{
      // send POST req to the API to add story to favorites
      const responseSuccessful = await this._sendReqToFavoritesEndpoint('POST', story.storyId);
      
      if (responseSuccessful) {
         // add story to user's favorites 
         this.favorites.set(story.storyId, story);
        console.log('added to favs successfully')
      } 
     

    } catch (err) {
      console.error("addAFavoriteStory failed", err);
    }

  }

  async removeFromFavorites(story) {
    try {

      // update the API
      const responseSuccessful = await this._sendReqToFavoritesEndpoint('DELETE', story.storyId);
      
      if (responseSuccessful) {
        // remove story from user's favorites 
        this.favorites.delete(story.storyId);
        console.log('removed from favs successfully')
      }
     
    } catch (err) {
      console.error("removeFromFavorites failed", err);
    }
  } 
  

}
