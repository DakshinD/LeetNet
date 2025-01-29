/**
 * Helper functions for various utilities.
 */

/**
 * Time diff for timestamps.
 * @param {number} current - Current timestamp.
 * @param {number} previous - Previous timestamp.
 * @returns {string} - Formatted time difference.
 */
export function timeDifference(current, previous) {
    const elapsed = current - previous;
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const msPerYear = msPerDay * 365;

    if (elapsed < msPerMinute) return Math.round(elapsed / 1000) + ' seconds ago';
    if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + ' mins ago';
    if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + ' hours ago';
    if (elapsed < msPerMonth) return Math.round(elapsed / msPerDay) + ' days ago';
    if (elapsed < msPerYear) return Math.round(elapsed / msPerMonth) + ' months ago';
    return Math.round(elapsed / msPerYear) + ' years ago';
}

/**
 * Format date for the calendar.
 * @param {number} timestamp - The timestamp in seconds.
 * @returns {string} - Formatted date as YYYY-MM-DD.
 */
export const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Helper function to filter submissions from today.
 * @param {number} timestamp - The timestamp in seconds.
 * @returns {boolean} - True if the submission is from today, false otherwise.
 */
export function isToday(timestamp) {
    const today = new Date();
    const date = new Date(timestamp * 1000);
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}