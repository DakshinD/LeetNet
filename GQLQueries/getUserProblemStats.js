const getUserProblemStats = async (username) => {
    const query = `
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            submitStats {
                acSubmissionNum {
                    difficulty
                    count
                    submissions
                }
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

    data.data.matchedUser.submitStats.username = username;
    // add profile pic here?


    return data.data.matchedUser.submitStats;
};

export default getUserProblemStats;
