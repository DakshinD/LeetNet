const getUserProfilePic = async (username) => {
    const query = `
    query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
            profile {
                userAvatar
            }
        }
    }`;

    const variables = {
        username
    };

    const response = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        //   'Authorization': 'Bearer YOUR_API_TOKEN' // Add your authentication token if required
        },
        body: JSON.stringify({ query, variables })
    });

    const data = await response.json();

    if (data.data.matchedUser === null) {
        return null;
    }
    return data.data.matchedUser.profile;
};

export default getUserProfilePic;