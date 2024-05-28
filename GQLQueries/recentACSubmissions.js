const getACSubmissions = async (username, limit) => {
    const query = `query getACSubmissions ($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
            title
            titleSlug
            timestamp
            statusDisplay
            lang
        }
    }`;

    const variables = {
        username, 
        limit
    };

    try {
        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer YOUR_API_TOKEN' // Add your authentication token if required
            },
            body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors.map(error => error.message).join(', '));
        }

        const submissions = result.data.recentAcSubmissionList.map(submission => ({
            ...submission,
            username,
        }));

        return submissions;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }

};

export default getACSubmissions;

