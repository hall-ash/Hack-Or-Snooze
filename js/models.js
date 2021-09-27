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
   
    // send POST request with given args to create story 
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "POST",
      data: { 
        token: user.loginToken,
        story: { author, title, url } 
      },
    })

    // from JSON data, create Story obj
    const newStory = new Story(response.data.story);

    // update storyList.stories & user's stories
    this.stories.set(newStory.storyId, newStory);
    user.ownStories.set(newStory.storyId, newStory);

    return newStory;
    
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

    // send DELETE request to remove given story 
    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: {
        token: user.loginToken,
      }
    })
  
    // remove story from all story lists
    this.stories.delete(storyId);
    user.ownStories.delete(storyId);
    user.favorites.delete(storyId);
     
  }

  /**
   * Update a story with new data.
   */
  async updateStory(user, storyId, updatedData) {

    // send PATCH request to update the story with the given data
    const response = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "PATCH",
      data: {
        token: user.loginToken,
        story: updatedData,
      }
    })

    // from JSON data, create Story instance
    const updatedStory = new Story(response.data.story);
    
    // update storyList.stories & user's stories 
    this.stories.set(storyId, updatedStory);
    user.ownStories.set(storyId, updatedStory);

    // if story is favorited, update user favorites 
    if (user.favorites.has(storyId)) {
      user.favorites.set(storyId, updatedStory);
    }

    return updatedStory;

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

    // create an account with the given data
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    // get the user json object and return a User instance
    const { user } = response.data

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

    // login the user
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });
    
    // get the user json object and return the user instance
    const { user } = response.data;

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
      // login the user
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      // get the user json object and return the user instance
      const { user } = response.data;

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
  async _postOrDeleteFavorite(requestMethod, storyId) {
   
    if (requestMethod === 'POST' || requestMethod === 'DELETE') {
      const { username, loginToken: token } = this;
  
      // post or delete the given story to user favorites 
      await axios({
        url: `${BASE_URL}/users/${username}/favorites/${storyId}`,
        method: requestMethod,
        data: { token },
      });
  
    }
    else {
      throw new Error('Invalid request method.');
    }
    
  }

  /** Add a story to user favorites.
   * 
   */
  async addToFavorites(story) {
   
    // post story to favorites
    await this._postOrDeleteFavorite('POST', story.storyId);
    
    // add to User instance's favorites Map
    this.favorites.set(story.storyId, story);

  }

  /** Remove a story from user favorites.
   * 
   */
  async removeFromFavorites(story) {
   
    // delete story from favorites
    await this._postOrDeleteFavorite('DELETE', story.storyId);
    
    // remove from User instance's favorites Map
    this.favorites.delete(story.storyId);
      
  } 
  
  /**
   * Change the user's name.
   */
  async changeName(newName) {
    await this._updateUserInfo({ name: newName });
  }

  /**
   * Change the user's password.
   */
  async changePassword(newPassword) {
    await this._updateUserInfo({ password: newPassword });
  }

  /**
   * Send a patch request to update the user's info.
   */
  async _updateUserInfo(newUserInfo) {
  
    await axios({
      url: `${BASE_URL}/users/${this.username}`,
      method: "PATCH",
      data: { 
        token: this.loginToken,
        user: newUserInfo,
      },
    });
  }

}
