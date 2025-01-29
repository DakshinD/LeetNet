

const getDailySlug = async () => {
    const query = `
        query questionOfToday {
            activeDailyCodingChallengeQuestion {
                date
                userStatus
                link
                question {
                    titleSlug
                    title
                    translatedTitle
                    acRate
                    difficulty
                    freqBar
                    frontendQuestionId: questionFrontendId
                    isFavor
                    paidOnly: isPaidOnly
                    status
                    hasVideoSolution
                    hasSolution
                    topicTags {
                    name
                    id
                    slug
                    }
                }
            }
        }`;

    const variables = {
        
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

    return data.data.activeDailyCodingChallengeQuestion.question.titleSlug;
};

export default getDailySlug;
