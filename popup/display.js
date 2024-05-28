/**
 * display.js - This file contains methods that render various pages with new data.
 *              Commonly called inside eventListeners from popup.js
 */

import questionDifficulty from '../GQLQueries/questionDifficulty.js';
import { timeDifference } from './helper.js';
import getUserProfilePic from '../GQLQueries/getUserProfilePic.js';

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
    removeButton.textContent = 'x';
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

      // Avatar
      const avatar = document.createElement('img');
      avatar.classList.add('profile-pic');
      avatar.src = `${stat.avatar}`;
      avatar.alt = `${stat.username}'s profile picture`;

      // Username
      const title = document.createElement('p');
      title.classList.add('stat-row-title');
      title.textContent = `${idx+1}. ${stat.username}`;

      // number of problems solved
      const problemsSolved = (diff === 4) ? stat.count : stat.acSubmissionNum[diff].count;
      const solved = document.createElement('p');
      solved.classList.add('stat-row-solved');
      solved.textContent = `${problemsSolved}`;

      listItem.appendChild(avatar);
      listItem.appendChild(title);
      listItem.appendChild(solved);

      list.appendChild(listItem);
    });

    resultsContainer.appendChild(list)
   
  });

}

/**
 * Displays most recent AC Submission results of friendss.
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