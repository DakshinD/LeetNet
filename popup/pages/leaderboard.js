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
        leaderboardStats.sort((x, y) => y.acSubmissionNum[diff].count - x.acSubmissionNum[diff].count);
    }

    const resultsContainer = document.getElementById('leaderboard-results');
    resultsContainer.innerHTML = ''; // Clear previous results

    if (!leaderboardStats || leaderboardStats.length === 0) {
        resultsContainer.innerHTML = NO_FRIENDS_MESSAGE;
        return;
    }

    createLeaderboardList(leaderboardStats, resultsContainer, diff);
}

/**
 * Creates the leaderboard list.
 * @param {Array} leaderboardStats - The leaderboard statistics.
 * @param {HTMLElement} resultsContainer - The container to display results.
 */
function createLeaderboardList(leaderboardStats, resultsContainer, diff) {
    Promise.all(leaderboardStats).then((stats) => {
        const list = document.createElement('ul');
        list.classList.add('all-problems-list');

        stats.forEach((stat, idx) => {
            const listItem = createLeaderboardListItem(stat, idx, diff);
            list.appendChild(listItem);
        });

        resultsContainer.appendChild(list);
    });
}

/**
 * Creates a list item for the leaderboard.
 * @param {Object} stat - The leaderboard stat object.
 * @param {number} idx - The index of the stat.
 * @returns {HTMLElement} - The list item element.
 */
function createLeaderboardListItem(stat, idx, diff) {
    const listItem = document.createElement('li');
    listItem.classList.add('stat-row');

    const medalIcon = getMedalIcon(idx);
    const avatar = createAvatar(stat);
    const title = createTitle(stat, idx);
    const solved = createSolvedCount(stat, medalIcon, diff);

    listItem.appendChild(avatar);
    listItem.appendChild(title);
    listItem.appendChild(solved);

    return listItem;
}

/**
 * Returns the medal icon based on rank.
 * @param {number} idx - The index of the stat.
 * @returns {string} - The medal icon HTML.
 */
function getMedalIcon(idx) {
    if (idx === 0) return '<img src="../assets/gold-medal.png" alt="Gold Medal" class="medal-icon">';
    if (idx === 1) return '<img src="../assets/silver-medal.png" alt="Silver Medal" class="medal-icon">';
    if (idx === 2) return '<img src="../assets/bronze-medal.png" alt="Bronze Medal" class="medal-icon">';
    return '';
}

/**
 * Creates an avatar element.
 * @param {Object} stat - The leaderboard stat object.
 * @returns {HTMLElement} - The avatar element.
 */
function createAvatar(stat) {
    const avatar = document.createElement('img');
    avatar.classList.add('profile-pic');
    avatar.src = `${stat.avatar}`;
    avatar.alt = `${stat.username}'s profile picture`;
    return avatar;
}

/**
 * Creates the title element for the leaderboard.
 * @param {Object} stat - The leaderboard stat object.
 * @param {number} idx - The index of the stat.
 * @returns {HTMLElement} - The title element.
 */
function createTitle(stat, idx) {
    const title = document.createElement('p');
    title.classList.add('stat-row-title');
    title.innerHTML = `${idx + 1}. ${stat.username}`;
    return title;
}

/**
 * Creates the solved count element for the leaderboard.
 * @param {Object} stat - The leaderboard stat object.
 * @param {string} medalIcon - The medal icon HTML.
 * @returns {HTMLElement} - The solved count element.
 */
function createSolvedCount(stat, medalIcon, diff) {
    const problemsSolved = (diff === 4) ? stat.count : stat.acSubmissionNum[diff].count;
    const solved = document.createElement('p');
    solved.classList.add('stat-row-solved');
    solved.innerHTML = `${medalIcon} ${problemsSolved}`;
    return solved;
}