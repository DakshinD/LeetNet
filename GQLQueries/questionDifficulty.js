const questionDifficulty = async (titleSlug) => {
    const query = `
    query questionTitle($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
                questionId
                questionFrontendId
                title
                titleSlug
                isPaidOnly
                difficulty
                likes
                dislikes
                categoryTitle
            }
        }`;

    const variables = {
        titleSlug
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
    return data.data.question;
};

export default questionDifficulty;

