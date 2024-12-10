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

export async function* getAllCommits(accessToken, since) {
    const auth = accessToken || process.env.NEXT_PUBLIC_GITHUB_ACCESS_KEY;
    
    const octokit = new ThrottledOctokit({
        auth,
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

    // First, get the authenticated user's information
    const { data: user } = await octokit.users.getAuthenticated();

    const endDate = new Date();
    let currentDate = new Date(since);
    
    while (currentDate < endDate) {
        let nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        
        if (nextDate > endDate) {
            nextDate = endDate;
        }

        let page = 1;
        
        while (true) {
            try {
                const { data } = await octokit.search.commits({
                    q: `author:${user.login} committer-date:${currentDate.toISOString().split('T')[0]}..${nextDate.toISOString().split('T')[0]}`,
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

        currentDate = nextDate;
    }
}

