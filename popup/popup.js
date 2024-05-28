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
  const userData = await getUserProfilePic(friendUsername);

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
        let leaderboardData = await getUserProblemStats(username);
        console.log(leaderboardData)
        const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
        leaderboardTabs.forEach(tab => {
          tab.addEventListener('click', () => {
            leaderboardTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            let difficulty = tab.getAttribute('data-difficulty');
            const diffMap = {"All": 0, "Easy": 1, "Medium": 2, "Hard": 3};
            displayLeaderboard([leaderboardData], username, diffMap[difficulty]);
          });
        });
        const defaultTab = document.querySelector('.leaderboard-tab[data-difficulty="All"]');
        defaultTab.classList.add('active');
        displayLeaderboard([leaderboardData], username, 0);
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

              // Load in friend leaderboard data
              let leaderboardData = await getUserProblemStats(currUsername);
              Promise.all(result.friends.map(friend => getUserProblemStats(friend))).then((friendData) => {
                const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
                friendData.push(leaderboardData);
                leaderboardTabs.forEach(tab => {
                  tab.addEventListener('click', () => {
                    leaderboardTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    let difficulty = tab.getAttribute('data-difficulty');
                    const diffMap = {"All": 0, "Easy": 1, "Medium": 2, "Hard": 3};
                    displayLeaderboard(friendData, currUsername, diffMap[difficulty]);
                  });
                });
                // load default tab as All for leaderboard
                const defaultTab = document.querySelector('.leaderboard-tab[data-difficulty="All"]');
                defaultTab.classList.add('active');
                displayLeaderboard(friendData, currUsername, 0);
              
              });
            });
        }
    });
});


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

