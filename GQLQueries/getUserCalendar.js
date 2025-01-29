
const userProfileCalendar = async (username) => {
    const query = `
    query userProfileCalendar($username: String = "DakDak05", $year: Int) {
        matchedUser(username: $username) {
            userCalendar(year: $year) {
                activeYears
                streak
                totalActiveDays
                dccBadges {
                timestamp
                badge {
                    name
                    icon
                }
                }
                submissionCalendar
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
    console.log(data.data.matchedUser.userCalendar.submissionCalendar);
    return data.data.matchedUser;
};

export default userProfileCalendar;




  
  