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
        const listItem = createFriendListItem(friend);
        list.appendChild(listItem);
    });
  
    friendsContainer.appendChild(list);
  }

  /**
 * Creates a list item for a friend.
 * @param {string} friend - The friend's username.
 * @returns {HTMLElement} - The list item element.
 */
function createFriendListItem(friend) {
    const listItem = document.createElement('li');
    listItem.classList.add('friend-item');

    const friendName = document.createElement('span');
    friendName.textContent = friend;

    const rightDiv = createRightDiv(friend);
    listItem.appendChild(friendName);
    listItem.appendChild(rightDiv);

    return listItem;
}

/**
 * Creates the right div containing the remove button.
 * @param {string} friend - The friend's username.
 * @returns {HTMLElement} - The right div element.
 */
function createRightDiv(friend) {
    const rightDiv = document.createElement('div');
    rightDiv.style.display = 'flex';
    rightDiv.style.alignItems = 'center';
    rightDiv.style.gap = '4px';
    rightDiv.style.position = 'relative'; // Needed for tooltip positioning

    const removeButton = document.createElement('button');
    removeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `;
    removeButton.classList.add('remove-btn');
    removeButton.addEventListener('click', () => removeFriend(friend));

    rightDiv.appendChild(removeButton);
    return rightDiv;
}

/**
 * Removes a friend from the stored list.
 * @param {string} friend - The friend's username.
 */
function removeFriend(friend) {
    chrome.storage.local.get({ friends: [] }, (result) => {
        const updatedFriends = result.friends.filter(f => f !== friend);
        chrome.storage.local.set({ friends: updatedFriends }, () => {
            displayFriendsList(updatedFriends);
        });
    });
}