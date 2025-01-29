
import questionDifficulty from '../../GQLQueries/questionDifficulty.js';
import { timeDifference } from '../helper.js';

/**
 * Displays the most recent AC Submission results of friends.
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

    submissions.sort((x, y) => y.timestamp - x.timestamp);

    // Fetch all difficulties
    const submissionWithDifficultyPromises = submissions.map(async (submission) => {
        const problem_data = await questionDifficulty(submission.titleSlug);
        return { ...submission, difficulty: problem_data.difficulty };
    });

    // wait for fetching difficulties and then populate activity list with submissions in 
    // order of most recent
    Promise.all(submissionWithDifficultyPromises).then((submissionsWithDiff) => {
        const list = document.createElement('ul');
        list.classList.add('submission-list');

        submissionsWithDiff.forEach(submission => {
            const listItem = createSubmissionListItem(submission, username);
            list.appendChild(listItem);
        });

        resultsContainer.appendChild(list);
    });
}

/**
 * Creates a list item for a submission.
 * @param {Object} submission - The submission data.
 * @param {string} username - The current username.
 * @returns {HTMLElement} - The list item element.
 */
function createSubmissionListItem(submission, username) {
    if (submission.username === username) {
        submission.username = "You";
    }

    const problemLink = `https://leetcode.com/problems/${submission.titleSlug}/description/`;
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
    diff.classList.add('submission-diff', submission.difficulty.toLowerCase());
    diff.textContent = submission.difficulty;

    // timestamp
    const timestamp = document.createElement('p');
    timestamp.classList.add('submission-timestamp');
    timestamp.textContent = timeDifference(Date.now(), new Date(submission.timestamp * 1000));

    listItem.appendChild(title);
    listItem.appendChild(diff);
    listItem.appendChild(timestamp);

    return listItem;
}

