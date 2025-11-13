'use client'
import { getNewRatings, getRatingsForContainer } from "@/action/rateAction";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

interface RatingData {
    _id: string;
    userId: {
        _id: string;
        username: string;
        role: string;
    },
    score: number;
    rate: string;
    likes: {
        count: number;
        userIds: string[];
    }
    createdAt?: string;
}


const NewestRatings = ({ novelId }: { novelId: string }) => {
    const { data, fetchNextPage, hasNextPage, isFetching, } = useInfiniteQuery({
        queryKey: ["ratings", novelId],
        queryFn: ({ pageParam }) =>
            getRatingsForContainer({ pageParam, novelId }),
        getNextPageParam: (lastPage, pages) =>
            lastPage.hasMore ? pages.length + 1 : undefined,
        initialPageParam: 1,
    });

};

export default NewestRatings;