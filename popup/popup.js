import getUserProfilePic from '../GQLQueries/getUserProfilePic.js';

import { displayFriendsList } from './pages/friends.js';
import { displaySubmissionChart } from './pages/chart.js';

import { showSpinner, hideSpinner } from './display.js';
import { loadData } from './populate.js';


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
        /* Start loading spinners */
        showSpinner("activity");
        showSpinner("friends");
        showSpinner("leaderboard");
        showSpinner("profile");

        loadData(username);
        showPage('activity');

        // display submission chart
        displaySubmissionChart(username);
        hideSpinner("profile");

        // Initialize the indicator position on page load
        updateTabIndicator(); 

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
    // check if username is already stored, else prompt
    chrome.storage.local.get('username', async function(result) {
        if (!result.username) {
            showPage('username-input');
        } else {
            console.log('Welcome back, ' + result.username);

            /* Start loading spinners */
            showSpinner("activity");
            showSpinner("friends");
            showSpinner("leaderboard");
            showSpinner("profile");

            

            loadData(result.username);
            showPage('activity');
            

            // display submission chart
            displaySubmissionChart(result.username);
            hideSpinner("profile");

            // Initialize the indicator position on page load
            updateTabIndicator();
        }
    });
});


// Handle the username change on button click
document.getElementById('profile-submit-btn').addEventListener('click', () => {
  const newUsername = document.getElementById('profile-username').value; // Get the new username
  console.log("here");
  // Update local storage with the new username
  chrome.storage.local.set({ username: newUsername }, () => {
      console.log('Username updated to:', newUsername);
      // Reload the extension to reflect the changes
      location.reload(); // Reload the extension
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
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const pageId = tab.id.replace('-tab', ''); // Derive the page ID from the tab ID
    showPage(pageId);
  });
});

/**
 * Changes which page is shown as content based off tab bar.
 * @param {String} pageId - The id of the page chosen.
 */
function showPage(pageId) {
  // Remove active class from all tabs and pages
  tabs.forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

  // Add active class to the selected tab and page
  const selectedTab = document.getElementById(`${pageId}-tab`);
  const selectedPage = document.getElementById(pageId);

  if (selectedTab) selectedTab.classList.add('active');
  if (selectedPage) selectedPage.classList.add('active');

  // Update the tab indicator position and size
  updateTabIndicator();
}

/**
 * Updates the position and size of the tab indicator based on the active tab.
 */
function updateTabIndicator() {
  const tabIndicator = document.querySelector('.tab-indicator');
  const activeTab = document.querySelector('.tab.active');

  if (tabIndicator && activeTab) {
    const { offsetLeft, offsetWidth } = activeTab;
    tabIndicator.style.left = `${offsetLeft}px`;
    tabIndicator.style.width = `${offsetWidth}px`;
  }
}





