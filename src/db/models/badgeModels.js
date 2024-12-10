import prisma from "@/db/prisma";

export const getAllBadges = async () => {
    return await prisma.badge.findMany({
        include: {
            course: true,
            userBadges: {
                include: {
                    user: true
                }
            }
        }
    });
};

export const getBadgeById = async (id) => {
    return await prisma.badge.findUnique({
        where: { id },
        include: {
            course: true,
            userBadges: {
                include: {
                    user: true
                }
            }
        }
    });
};

export const getBadgeByCourseId = async (courseId) => {
    return await prisma.badge.findUnique({
        where: { courseId },
        include: {
            course: true,
            userBadges: {
                include: {
                    user: true
                }
            }
        }
    });
};

export const createBadge = async (data) => {
    return await prisma.badge.create({
        data: {
            name: data.name,
            noteId: data.noteId,
            course: {
                connect: { id: data.courseId }
            }
        },
        include: {
            course: true
        }
    });
};

export const updateBadge = async (id, data) => {
    return await prisma.badge.update({
        where: { id },
        data: {
            name: data.name,
            noteId: data.noteId
        },
        include: {
            course: true,
            userBadges: true
        }
    });
};

export const deleteBadge = async (id) => {
    return await prisma.badge.delete({
        where: { id }
    });
};
