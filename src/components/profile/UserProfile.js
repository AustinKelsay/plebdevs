import React, { useState, useEffect } from "react";
import { useSession } from 'next-auth/react';
import { useNDKContext } from "@/context/NDKContext";
import UserProfileCard from "@/components/profile/UserProfileCard";
import CombinedContributionChart from "@/components/charts/CombinedContributionChart";
import ActivityContributionChart from "@/components/charts/ActivityContributionChart";
import useCheckCourseProgress from "@/hooks/tracking/useCheckCourseProgress";
import useWindowWidth from "@/hooks/useWindowWidth";
import UserProgress from "@/components/profile/progress/UserProgress";
import UserProgressTable from '@/components/profile/DataTables/UserProgressTable';
import UserPurchaseTable from '@/components/profile/DataTables/UserPurchaseTable';

const UserProfile = () => {
    const windowWidth = useWindowWidth();
    const [user, setUser] = useState(null);
    const [account, setAccount] = useState(null);
    const { data: session } = useSession();
    const { ndk, addSigner } = useNDKContext();
    useCheckCourseProgress();

    useEffect(() => {
        if (session?.user) {
            console.log("Session", session)
            setUser(session.user);

            if (session?.account) {
                setAccount(session.account);
            }
        }
    }, [session]);

    return (
        user && (
            <div className="p-4">
                {
                    windowWidth < 768 && (
                        <h1 className="text-3xl font-bold mb-6">Profile</h1>
                    )
                }
                <div className="w-full flex flex-row max-lap:flex-col">
                    <div className="w-1/4 h-full max-lap:w-full">
                        {user && <UserProfileCard user={user} />}
                    </div>

                    <div className="w-3/4 flex flex-col justify-center mx-auto max-lap:w-full">
                        {account && account?.provider === "github" ? (
                            <CombinedContributionChart session={session} />
                        ) : (
                            <ActivityContributionChart session={session} />
                        )}
                        <UserProgress />
                        <UserProgressTable
                            session={session}
                            ndk={ndk}
                            windowWidth={windowWidth}
                        />
                        <UserPurchaseTable
                            session={session}
                            windowWidth={windowWidth}
                        />
                    </div>
                </div>
            </div>
        )
    );
};

export default UserProfile;
