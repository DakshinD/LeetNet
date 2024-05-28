import getACSubmissions from '../GQLQueries/recentACSubmissions.js';
import getUserProblemStats from '../GQLQueries/getUserProblemStats.js';
import getUserProfilePic from '../GQLQueries/getUserProfilePic.js';
import { displayFriendsList, displayLeaderboard, displayACSubmissions } from './display.js';


/**
 * Listener for username submission
 * 
 * Triggered when user clicks "Submit" button to enter their username at 
 * beginning of extension. 
 * 
 * Checks if valid and fetch AC and leaderboard data. 
 */
document.getElementById('submit-username').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  // check if the username is valid by calling getUserProfilePic
  const userData = await getUserProfilePic(username);

  if (username) {
    if (userData === null) {
      alert('The username you entered is invalid. Please try again.');
    } else {
      chrome.storage.local.set({ username: username }, async function() {
        console.log('Username is set to ' + username);
        const data = await getACSubmissions(username, 5);
        displayACSubmissions(data, username);
        showPage('activity');

        // display leaderboard for first time, repeat code since DOM update already happened
        // Load in daily leaderboard data
        const dailyData = await loadDailyLeaderboardData([], username);
        let leaderboardData = [await getUserProblemStats(username)];
        console.log(leaderboardData)


        // Fetch all profile pics
        leaderboardData = leaderboardData.map(async (stat) => {
          const userData = await getUserProfilePic(stat.username);
          const avatar = userData.userAvatar;
          return { ...stat, avatar };
        });

        const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
        Promise.all(leaderboardData).then((friendData) => {
          leaderboardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
              // once tab is clicked, change active and display new leaderboard data
              leaderboardTabs.forEach(t => t.classList.remove('active'));
              tab.classList.add('active');
              let difficulty = tab.getAttribute('data-difficulty');
              const diffMap = {"All": 0, "Easy": 1, "Medium": 2, "Hard": 3, "Daily": 4};
              displayLeaderboard(friendData, dailyData, username, diffMap[difficulty]);
            });
          });
          // load default tab as All for leaderboard
          const defaultTab = document.querySelector('.leaderboard-tab[data-difficulty="All"]');
          defaultTab.classList.add('active');
          displayLeaderboard(friendData, null, username, 0);
        })

      });
    }
  } else {
    alert('Empty username. Please enter a username');
  }
});     


/**
 * Listener for DOM Content Load (beginning of extension open)
 * 
 * Validate current username, fetch AC submissions of self and friendss,
 * fetch friend list, and fetch leaderboard data
 */
document.addEventListener('DOMContentLoaded', function() {
    // DISABLED COLOR SCHEME TOGGLE - light mode looks bad
    // document.getElementById('mode-toggle').addEventListener('change', function() {
    //     if (this.checked) {
    //         document.documentElement.setAttribute('data-theme', 'light');
    //     } else {
    //         document.documentElement.setAttribute('data-theme', 'dark');
    //     }
    // });

    // check if username is already stored, else prompt
    chrome.storage.local.get('username', async function(result) {
        if (!result.username) {
            showPage('username-input');
        } else {
            console.log('Welcome back, ' + result.username);
            // load in user AC data
            let allSubmissions = [];
            const data = await getACSubmissions(result.username, 5);
            allSubmissions = allSubmissions.concat(data);
            const currUsername = result.username;

            // load in friend data
            chrome.storage.local.get({ friends: [] }, async (result) => {
              displayFriendsList(result.friends);

              // Load in AC data for activity page - CHANGE LIMIT BASED ON FRIENDS LIST
              // need to do this so promises resolve before updating in forEach
              Promise.all(result.friends.map(friend => getACSubmissions(friend, 5))).then((friendData) => {
                friendData.forEach((submissions) => {
                  allSubmissions = allSubmissions.concat(submissions);
                })
                displayACSubmissions(allSubmissions, currUsername);
              });
              // default to activity page
              showPage('activity');

              // Load in daily leaderboard data
              const dailyData = await loadDailyLeaderboardData(result.friends, currUsername);
              console.log(dailyData);
              // Load in friend leaderboard data
              let leaderboardData = await getUserProblemStats(currUsername);
              Promise.all(result.friends.map(friend => getUserProblemStats(friend))).then((friendData) => {
                // fetch profile pics for each user
                
                // for each tab listen for click
                const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
                friendData.push(leaderboardData);

                // Fetch all profile pics
                friendData = friendData.map(async (stat) => {
                  const userData = await getUserProfilePic(stat.username);
                  const avatar = userData.userAvatar;
                  return { ...stat, avatar };
                });

                Promise.all(friendData).then((friendData) => {
                  leaderboardTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                      // once tab is clicked, change active and display new leaderboard data
                      leaderboardTabs.forEach(t => t.classList.remove('active'));
                      tab.classList.add('active');
                      let difficulty = tab.getAttribute('data-difficulty');
                      const diffMap = {"All": 0, "Easy": 1, "Medium": 2, "Hard": 3, "Daily": 4};
                      displayLeaderboard(friendData, dailyData, currUsername, diffMap[difficulty]);
                    });
                  });
                  // load default tab as All for leaderboard
                  const defaultTab = document.querySelector('.leaderboard-tab[data-difficulty="All"]');
                  defaultTab.classList.add('active');
                  displayLeaderboard(friendData, null, currUsername, 0);
                })
                
              });

            });
        }
    });
});


/**
 * Loads daily leaderboard data for the current user and their friends.
 * Retrieves recent submissions for the current user and their friends,
 * filters them to include only today's submissions, and sorts the users
 * based on the count of their submissions.
 * @param {string[]} friends - An array of usernames representing the friends of the current user.
 * @param {string} username - The username of the current user.
 * @returns {object[]} -An array of user objects containing daily leaderboard data.
 */
async function loadDailyLeaderboardData(friends, username) {
  let allSubmissions = [];
  
  // Get personal data
  const personalData = await getACSubmissions(username, 20);
  allSubmissions.push({
    username: username,
    submissions: personalData
  });

  // Fetch past 20 submissions for each friend
  const friendDataPromises = friends.map(async friend => {
    const submissions = await getACSubmissions(friend, 20);
    const currFriend = submissions.length > 0 ? submissions[0].username : "No Name";
    return {
      username: currFriend,
      submissions: submissions
    };
  });

  // Wait for all friend data promises to resolve
  const friendData = await Promise.all(friendDataPromises);
  allSubmissions = allSubmissions.concat(friendData);

  // Fetch profile pics for all users
  const allSubmissionsWithAvatarPromises = allSubmissions.map(async (stat) => {
    const userData = await getUserProfilePic(stat.username);
    const avatar = userData.userAvatar;
    return { ...stat, avatar };
  });

  // Wait for all profile pic promises to resolve
  const allSubmissionsWithAvatar = await Promise.all(allSubmissionsWithAvatarPromises);

  // Now filter all submissions for each user
  allSubmissionsWithAvatar.forEach((user) => {
    user.submissions = user.submissions.filter(submission => isToday(submission.timestamp));
    user.count = user.submissions.length;
  });

  // Sort the submissions
  allSubmissionsWithAvatar.sort((x, y) => y.count - x.count);

  return allSubmissionsWithAvatar;
}


/**
 *  Helper function to filter submissions from today
 */ 
function isToday(timestamp) {
    const today = new Date();
    const date = new Date(timestamp * 1000);
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}


/**
 * Listener for add friend button 
 * 
 * Check if the entered username is valid, if so add, else throw error
 */
document.getElementById('add-friend-btn').addEventListener('click', async () => {
  const friendUsername = document.getElementById('friend-username').value.trim();

  // check if the username is valid by calling getUserProfilePic
  const userData = await getUserProfilePic(friendUsername);

  if (friendUsername) {

    if (userData === null) {
      alert('The username you entered is invalid. Please try again.');
    } else {
      chrome.storage.local.get({ friends: [] }, (result) => {
      const friends = result.friends;
        if (!friends.includes(friendUsername)) {
          friends.push(friendUsername);
          chrome.storage.local.set({ friends }, () => {
            console.log(`Friend ${friendUsername} added.`);
            displayFriendsList(friends);
          });
        } else {
          console.log(`Friend ${friendUsername} is already in the list.`);
        }
      });
    }
  } else {
    alert('Empty username. Please enter a username');
  }
});



/**
 * Listener for tab changes
 */
document.getElementById('activity-tab').addEventListener('click', () => showPage('activity'));
document.getElementById('friends-tab').addEventListener('click', () => showPage('friends'));
document.getElementById('leaderboard-tab').addEventListener('click', () => showPage('leaderboard'));

/**
 * Changes which page is shown as content based off tab bar.
 * @param {String} pageId - The id of the page chosen.
 */
function showPage(pageId) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    document.getElementById(pageId).classList.add('active');
    const activeTabId = (pageId === 'username-input') ? null : `${pageId.concat('-tab')}`;
    if (activeTabId) {
        document.getElementById(activeTabId).classList.add('active');
    } 
}

