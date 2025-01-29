/**
 * display.js - This file contains methods that render various pages with new data.
 *              Commonly called inside eventListeners from popup.js
 */

import questionDifficulty from '../GQLQueries/questionDifficulty.js';
import { timeDifference } from './helper.js';
import getUserProfilePic from '../GQLQueries/getUserProfilePic.js';
import getUserCalendar from '../GQLQueries/getUserCalendar.js';
/**
 * Displays the friends list.
 * @param {Array} friends - The list of friends.
 */
export function displayFriendsList(friends) {
  const friendsContainer = document.getElementById('friends-list-container');
  friendsContainer.innerHTML = ''; // Clear previous friends list

  if (!friends || friends.length === 0) {
    friendsContainer.innerHTML = '<p>No friends found.</p>';
    return;
  }

  const list = document.createElement('ul');
  list.classList.add('friends-list');

  friends.forEach(friend => {
    const listItem = document.createElement('li');
    listItem.classList.add('friend-item');

    const friendName = document.createElement('span');
    friendName.textContent = friend;

    const removeButton = document.createElement('button');
    // removeButton.textContent = 'x';
    removeButton.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
`;
    removeButton.classList.add('remove-btn');
    removeButton.addEventListener('click', () => {
        // Remove friend from stored list
        chrome.storage.local.get({ friends: [] }, (result) => {
            const updatedFriends = result.friends.filter(f => f !== friend);
            chrome.storage.local.set({ friends: updatedFriends }, () => {
            displayFriendsList(updatedFriends);
            });
        });
    });

    listItem.appendChild(friendName);
    listItem.appendChild(removeButton);
    list.appendChild(listItem);
  });

  friendsContainer.appendChild(list);
}

/**
 * Displays the leaderboard.
 * @param {Array} leaderboardStats - The leaderboard statistics.
 * @param {string} username - The current username.
 * @param {number} diff - The difficulty level (0: All, 1: Easy, 2: Medium, 3: Hard, 4: Daily).
 *                         4 (Daily) is a special case, not a difficulty.
 */
export function displayLeaderboard(leaderboardStats, dailyStats, username, diff) {
  // choose between default leaderboard stats or daily stats
  if (diff === 4) leaderboardStats = dailyStats;
  // sort by problems solved
  if (diff !== 4) {
    leaderboardStats.sort(function(x, y) {
      return y.acSubmissionNum[diff].count - x.acSubmissionNum[diff].count;
    })
  }
  

  // create container
  const resultsContainer = document.getElementById('leaderboard-results');
  resultsContainer.innerHTML = ''; // Clear previous results

  if (!leaderboardStats || leaderboardStats.length === 0) {
    resultsContainer.innerHTML = '<p>No friends found.</p>';
    return;
  }

  // Fetch all profile pics
  // const newLeaderboardStats = leaderboardStats.map(async (stat) => {
  //   const userData = await getUserProfilePic(stat.username);
  //   const avatar = userData.userAvatar;
  //   return { ...stat, avatar };
  // });

  Promise.all(leaderboardStats).then((leaderboardStats) => {
    // create each list element
    const list = document.createElement('ul');
    list.classList.add('all-problems-list');

    leaderboardStats.forEach( (stat, idx) => {
      const listItem = document.createElement('li');
      listItem.classList.add('stat-row');
      
      // Medal icon based on rank
      let medalIcon = '';
      if (idx === 0) {
        medalIcon = '<img src="../assets/gold-medal.png" alt="Gold Medal" class="medal-icon">';
      } else if (idx === 1) {
        medalIcon = '<img src="../assets/silver-medal.png" alt="Silver Medal" class="medal-icon">';
      } else if (idx === 2) {
        medalIcon = '<img src="../assets/bronze-medal.png" alt="Bronze Medal" class="medal-icon">';
      }

      // Avatar
      const avatar = document.createElement('img');
      avatar.classList.add('profile-pic');
      avatar.src = `${stat.avatar}`;
      avatar.alt = `${stat.username}'s profile picture`;

      // Username
      const title = document.createElement('p');
      title.classList.add('stat-row-title');
      title.innerHTML = `${idx+1}. ${stat.username}`;

      // number of problems solved
      const problemsSolved = (diff === 4) ? stat.count : stat.acSubmissionNum[diff].count;
      const solved = document.createElement('p');
      solved.classList.add('stat-row-solved');
      solved.innerHTML = `${medalIcon} ${problemsSolved}`;

      listItem.appendChild(avatar);
      listItem.appendChild(title);
      listItem.appendChild(solved);

      list.appendChild(listItem);
    });

    resultsContainer.appendChild(list)
   
  });

}

/**
 * Displays most recent AC Submission results of friends.
 * @param {Array} submissions - The submissions data of all friends and self.
 * @param {string} username - The current username.
 */
export async function displayACSubmissions(submissions, username) {
  const resultsContainer = document.getElementById('graphql-results');
  resultsContainer.innerHTML = ''; // Clear previous results

  if (!submissions || submissions.length === 0) {
    resultsContainer.innerHTML = '<p>No submissions found.</p>';
    return;
  }
  submissions.sort(function(x, y) {
    return y.timestamp - x.timestamp;
  })
  console.log(submissions)
  

  // Fetch all difficulties
  const submissionWithDifficultyPromises = submissions.map(async (submission) => {
    const problem_data = await questionDifficulty(submission.titleSlug);
    const difficulty = problem_data.difficulty;
    return { ...submission, difficulty };
  });

  // wait for fetching difficulties and then populate activity list with submissions in 
  // order of most recent
  Promise.all(submissionWithDifficultyPromises).then((submissionsWithDiff) => {
    const list = document.createElement('ul');
    list.classList.add('submission-list');

    submissionsWithDiff.forEach( submission => {
      // display current user as You
      if (submission.username === username) {
        submission.username = "You";
      }
      const problemLink = "https://leetcode.com/problems/" + submission.titleSlug + "/description/";

      const listItem = document.createElement('li');
      listItem.classList.add('submission');

      // create "User solved problem" with link
      const title = document.createElement('p');
      title.classList.add('submission-title');
      
      const titleLink = document.createElement('a');
      titleLink.href = problemLink;
      titleLink.textContent = submission.title;
      titleLink.target = '_blank'; // open link in a new tab
      titleLink.classList.add('submission-link'); 
      
      title.innerHTML = `${submission.username} solved `;
      title.appendChild(titleLink);

      // problem difficulty
      const diff = document.createElement('p');
      diff.classList.add('submission-diff');
      diff.classList.add(`${submission.difficulty.toLowerCase()}`);
      diff.textContent = `${submission.difficulty}`;

      // timestamp
      const timestamp = document.createElement('p');
      timestamp.classList.add('submission-timestamp');
      timestamp.textContent = `${timeDifference(Date.now(), new Date(submission.timestamp * 1000))}`;

      // listItem.appendChild(user);
      listItem.appendChild(title);
      listItem.appendChild(diff);
      listItem.appendChild(timestamp);

      list.appendChild(listItem);
    });

    resultsContainer.appendChild(list) 
  });

}

const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000); // Convert to milliseconds
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // Format as YYYY-MM-DD
};

// Assuming getUserCalendar is defined and returns a promise
export async function displaySubmissionChart(username) {
  try {
    const userCalendar = await getUserCalendar(username); // Call the function to get user calendar data
    const submissionCalendarString = userCalendar.userCalendar.submissionCalendar; // Extract the submissionCalendar property
    const submissionData = JSON.parse(submissionCalendarString); // Parse the JSON string
    
    const formattedSubmissionData = {};
    for (const [timestamp, count] of Object.entries(submissionData)) {
      const formattedDate = formatDate(Number(timestamp)); // Convert key to number and format
      formattedSubmissionData[formattedDate] = count; // Assign the count to the new date key
    }
    console.log(formattedSubmissionData);
    const getLastWeekData = (submissionData) => {
      const today = new Date();
      const lastWeekData = {};
    
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i); // Get the date for the past week
    
        // Format the date as "YYYY-MM-DD"
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`; // Format as YYYY-MM-DD
    
        // Check if the formatted date exists in submissionData
        lastWeekData[formattedDate] = submissionData[formattedDate] || 0; // Default to 0 if no submissions
      }
    
      return lastWeekData;
    };
    const lastWeekSubmissions = getLastWeekData(formattedSubmissionData);
    console.log(lastWeekSubmissions);

    // Create the bar chart
    // const chartContainer = document.getElementById('chartContainer');
    // chartContainer.innerHTML = ''; // Clear previous chart

    const maxSubmissions = Math.max(...Object.values(lastWeekSubmissions)); // Get the maximum submissions for scaling

    // Assuming lastWeekSubmissions is already defined and contains the submission data
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // Array of day names

    // Get the table body element
    const submissionChartBody = document.getElementById('submissionTable');

    // Clear previous data
    submissionChartBody.innerHTML = '';

    // Populate the table with submission data
    Object.entries(lastWeekSubmissions).forEach(([formattedDate, count], index) => {
      const dayName = dayNames[new Date(formattedDate).getDay()]; // Get the day name from the date

      // Create a new row for each submission
      const row = document.createElement('tr');

      // Create label
      const labelCell = document.createElement('th');
      labelCell.setAttribute('scope', 'row'); 
      labelCell.innerHTML = `${dayNames[new Date(formattedDate).getDay()]}`; // Set the submission count
      row.appendChild(labelCell); 

      // Create the submission cell with the appropriate size
      const submissionCell = document.createElement('td');
      submissionCell.style.setProperty('--size', (count / maxSubmissions)); // Set the size based on submissions
      submissionCell.innerHTML = `${count}`; // Set the submission count
      row.appendChild(submissionCell);

      // Append the row to the table body
      submissionChartBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error fetching user calendar:', error);
  }
}
