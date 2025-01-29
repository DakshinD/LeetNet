/**
 * display.js - File contains various methods to help render pages
 */

/**
 * Show spinner for loading states.
 * @param {string} pageId - The ID of the page to show the spinner for.
 */
export function showSpinner(pageId) {
  document.querySelector(`#${pageId} .loading-spinner`).style.display = "block";
}

/**
* Hide spinner for loading states.
* @param {string} pageId - The ID of the page to hide the spinner for.
*/
export function hideSpinner(pageId) {
  document.querySelector(`#${pageId} .loading-spinner`).style.display = "none";
}