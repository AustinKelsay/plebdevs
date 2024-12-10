import prisma from "@/db/prisma";

export const getUserBadges = async (userId) => {
    return await prisma.userBadge.findMany({
        where: { userId },
        include: {
            badge: true,
            user: true
        }
    });
};

export const getUserBadge = async (userId, badgeId) => {
    return await prisma.userBadge.findUnique({
        where: {
            userId_badgeId: {
                userId,
                badgeId
            }
        },
        include: {
            badge: true,
            user: true
        }
    });
};

export const awardBadgeToUser = async (userId, badgeId) => {
    return await prisma.userBadge.create({
        data: {
            user: {
                connect: { id: userId }
            },
            badge: {
                connect: { id: badgeId }
            }
        },
        include: {
            badge: true,
            user: true
        }
    });
};

export const removeUserBadge = async (userId, badgeId) => {
    return await prisma.userBadge.delete({
        where: {
            userId_badgeId: {
                userId,
                badgeId
            }
        }
    });
};

export const getUsersWithBadge = async (badgeId) => {
    return await prisma.userBadge.findMany({
        where: { badgeId },
        include: {
            user: true,
            badge: true
        }
    });
};
