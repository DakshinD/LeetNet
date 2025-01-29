import getUserCalendar from '../../GQLQueries/getUserCalendar.js';
import { formatDate } from '../helper.js';

/**
 * Displays the submission calendar for the past week for the user inside the profile view.
 * @param {string} username - The current username.
 */
export async function displaySubmissionChart(username) {
    try {
        const userCalendar = await getUserCalendar(username); // Call the function to get user calendar data
        const submissionCalendarString = userCalendar.userCalendar.submissionCalendar; // Extract the submissionCalendar property
        const submissionData = JSON.parse(submissionCalendarString); // Parse the JSON string

        const formattedSubmissionData = formatSubmissionData(submissionData);
        const lastWeekSubmissions = getLastWeekData(formattedSubmissionData);
        createSubmissionChart(lastWeekSubmissions);
    } catch (error) {
        console.error('Error fetching user calendar:', error);
    }
}

/**
 * Formats the submission data for the last week.
 * @param {Object} submissionData - The submission data.
 * @returns {Object} - The formatted submission data.
 */
function formatSubmissionData(submissionData) {
    const formattedData = {};
    for (const [timestamp, count] of Object.entries(submissionData)) {
        const formattedDate = formatDate(Number(timestamp)); // Convert key to number and format
        formattedData[formattedDate] = count; // Assign the count to the new date key
    }
    return formattedData;
}

/**
 * Gets the last week's submission data.
 * @param {Object} submissionData - The formatted submission data.
 * @returns {Object} - The last week's submission data.
 */
function getLastWeekData(submissionData) {
    const today = new Date();
    const lastWeekData = {};

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const formattedDate = formatDate(date.getTime() / 1000); // Convert to seconds

        lastWeekData[formattedDate] = submissionData[formattedDate] || 0; // Default to 0 if no submissions
    }

    return lastWeekData;
}

/**
 * Creates the submission chart in the table.
 * @param {Object} lastWeekSubmissions - The last week's submission data.
 */
function createSubmissionChart(lastWeekSubmissions) {
    const submissionChartBody = document.getElementById('submissionTable');
    submissionChartBody.innerHTML = ''; // Clear previous data

    const maxSubmissions = Math.max(...Object.values(lastWeekSubmissions));

    Object.entries(lastWeekSubmissions).forEach(([formattedDate, count]) => {
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(formattedDate).getDay()];

        const row = document.createElement('tr');
        const labelCell = document.createElement('th');
        labelCell.setAttribute('scope', 'row');
        labelCell.innerHTML = dayName;
        row.appendChild(labelCell);

        if (count > 0) {
            const submissionCell = document.createElement('td');
            submissionCell.style.setProperty('--size', (count / maxSubmissions));
            submissionCell.innerHTML = count;
            row.appendChild(submissionCell);
        }

        submissionChartBody.appendChild(row);
    });
}