import { useQuery } from '@tanstack/react-query';
import { getAllCommits } from '@/lib/github';

export function useFetchGithubCommits(username, onCommitReceived) {
  return useQuery({
    queryKey: ['githubCommits', username],
    queryFn: async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const commits = [];
      const contributionData = {};
      let totalCommits = 0;

      for await (const commit of getAllCommits(username, oneYearAgo)) {
        commits.push(commit);
        const date = commit.commit.author.date.split('T')[0];
        contributionData[date] = (contributionData[date] || 0) + 1;
        totalCommits++;
        
        // Call the callback with the running totals
        onCommitReceived?.({
          contributionData,
          totalCommits
        });
      }

      return {
        commits,
        contributionData,
        totalCommits
      };
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
  });
}