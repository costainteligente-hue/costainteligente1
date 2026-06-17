/**
 * useCommunityFeed — Costa Inteligente
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityRepository } from '@/lib/repositories/community.repository';

export function useCommunityFeed() {
  return useInfiniteQuery({
    queryKey: ['community_posts'],
    queryFn: ({ pageParam = 0 }) => communityRepository.findPaginated(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.flat().length;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => communityRepository.deleteById(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
    },
  });
}
