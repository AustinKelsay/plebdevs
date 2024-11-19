import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";

const ThrottledOctokit = Octokit.plugin(throttling);

const octokit = new ThrottledOctokit({
  auth: process.env.NEXT_PUBLIC_GITHUB_ACCESS_KEY,
  throttle: {
    onRateLimit: (retryAfter, options, octokit, retryCount) => {
      octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
      if (retryCount < 2) {
        octokit.log.info(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
    },
    onSecondaryRateLimit: (retryAfter, options, octokit) => {
      octokit.log.warn(`Secondary rate limit hit for request ${options.method} ${options.url}`);
      return true;
    },
  },
});

export async function* getAllCommits(username, since) {
    // Create time windows of 1 month each
    const endDate = new Date();
    let currentDate = new Date(since);
    
    while (currentDate < endDate) {
        let nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        
        // If next date would be in the future, use current date instead
        if (nextDate > endDate) {
            nextDate = endDate;
        }

        let page = 1;
        
        while (true) {
            try {
                const { data } = await octokit.search.commits({
                    q: `author:${username} committer-date:${currentDate.toISOString().split('T')[0]}..${nextDate.toISOString().split('T')[0]}`,
                    per_page: 100,
                    page,
                });

                if (data.items.length === 0) break;

                for (const commit of data.items) {
                    yield commit;
                }

                if (data.items.length < 100) break;
                page++;
            } catch (error) {
                console.error("Error fetching commits:", error.message);
                break;
            }
        }

        // Move to next time window
        currentDate = nextDate;
    }
}

