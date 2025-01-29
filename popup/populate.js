import { showSpinner, hideSpinner } from './display.js';
import { displayFriendsList } from './pages/friends.js';
import { displayACSubmissions } from './pages/activity.js';
import { displayLeaderboard } from './pages/leaderboard.js';
import { displaySubmissionChart } from './pages/chart.js';

import getACSubmissions from '../GQLQueries/recentACSubmissions.js';
import getUserProblemStats from '../GQLQueries/getUserProblemStats.js';
import getUserProfilePic from '../GQLQueries/getUserProfilePic.js';
import getDailySlug from '../GQLQueries/getDaily.js';
import { isToday } from './helper.js';

export async function loadData(username) {
    // Profile screen username
    document.getElementById('profile-username').value = username; 

    // load in friend data
    chrome.storage.local.get({ friends: [] }, async (result) => {
        hideSpinner("friends");
        displayFriendsList(result.friends);

        
        // default to activity page
        loadACData(username, result.friends);

        // Load in daily leaderboard data
        const dailyData = await loadDailyLeaderboardData(result.friends, username);
        console.log(dailyData);

        // Create dictionary of user to avatar
        var userToAvatar = {};
        dailyData.forEach(user => {
            userToAvatar[user.username] = user.avatar;
        });

        console.log("HERE");
        loadDiffLeaderboard(username, result.friends, userToAvatar, dailyData);

      });
}



async function loadACData (username, friends) {
    // load in user AC data
    let allSubmissions = [];
    const data = await getACSubmissions(username, 5);
    allSubmissions = allSubmissions.concat(data);

    // Load in AC data for activity page - CHANGE LIMIT BASED ON FRIENDS LIST
    // need to do this so promises resolve before updating in forEach
    Promise.all(friends.map(friend => getACSubmissions(friend, 5))).then((friendData) => {
        friendData.forEach((submissions) => {
        allSubmissions = allSubmissions.concat(submissions);
        })
        displayACSubmissions(allSubmissions, username);
        hideSpinner("activity")
    });
}
  
async function loadDiffLeaderboard(username, friends, userToAvatar, dailyData) {
    // Load in friend leaderboard data
    let leaderboardData = await getUserProblemStats(username);
    Promise.all(friends.map(friend => getUserProblemStats(friend))).then((friendData) => {
      // fetch profile pics for each user
      
      // for each tab listen for click
      const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
      friendData.push(leaderboardData);
  
      // Fetch all profile pics
      friendData = friendData.map((stat) => {
        return { ...stat, avatar: userToAvatar[stat.username] };
      });
  
      // Display the correct data when a button is clicked for a different difficulty
      Promise.all(friendData).then((friendData) => {
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
        hideSpinner("leaderboard");
      })
      
    });
  }


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
  
    // Here we can update the daily problem
    const dailyTitleSlug = getDailySlug();
    friendData.forEach(info => {
      info.submissions.forEach(problemInfo => {
        if (problemInfo.titleSlug == dailyTitleSlug) {
          // here, add a icon to the front of the X button on the friends list
          addDailyImageToFriend (problemInfo.username);
        }
      })
    })
  
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
  
    // TODO: If one user has solved 20 problems today, should we request more?
  
    // Sort the submissions
    allSubmissionsWithAvatar.sort((x, y) => y.count - x.count);
  
    return allSubmissionsWithAvatar;
  }
  
  /* Helper to add daily symbol to friends list */
  function addDailyImageToFriend(username) {
    const friendItems = document.querySelectorAll('.friend-item');
  
    friendItems.forEach(item => {
        const friendName = item.querySelector('span');
        
        if (friendName.textContent === username) {
            const rightDiv = item.querySelector('div');
            const removeBtn = item.querySelector('button');
  
            // Create a container for the SVG
            const svgContainer = document.createElement('span');
            svgContainer.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="2em" height="2em" fill="rgb(10 132 255)" class="h-6 w-6">
                    <path fill-rule="evenodd" d="M20 12.005v-.828a1 1 0 112 0v.829a10 10 0 11-5.93-9.14 1 1 0 01-.814 1.826A8 8 0 1020 12.005zM8.593 10.852a1 1 0 011.414 0L12 12.844l8.293-8.3a1 1 0 011.415 1.413l-9 9.009a1 1 0 01-1.415 0l-2.7-2.7a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            `;
  
            // Create the tooltip
            const tooltip = document.createElement('div');
            tooltip.textContent = 'Solved daily problem';
            tooltip.classList.add('tooltip');
            
            // Append the tooltip to rightDiv (so it's positioned properly)
            rightDiv.appendChild(tooltip);
  
            // Show tooltip on hover
            svgContainer.addEventListener('mouseenter', () => {
                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';
            });
  
            svgContainer.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            });
  
            // Add some spacing
            svgContainer.style.marginRight = '1px';
  
            // Insert SVG before the remove button
            rightDiv.insertBefore(svgContainer, removeBtn);
        }
    });
  }

