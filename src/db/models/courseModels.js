import prisma from "../prisma";

export const getAllCourses = async () => {
    return await prisma.course.findMany({
        include: {
            lessons: {
                include: {
                    resource: true,
                    draft: true
                },
                orderBy: {
                    index: 'asc'
                }
            },
            purchases: true,
            badge: true
        },
    });
};

export const getCourseById = async (id) => {
    return await prisma.course.findUnique({
        where: { id },
        include: {
            lessons: {
                include: {
                    resource: true,
                    draft: true
                },
                orderBy: {
                    index: 'asc'
                }
            },
            purchases: true,
            badge: true
        },
    });
};

export const createCourse = async (data) => {
    const { badge, ...courseData } = data;
    return await prisma.course.create({
        data: {
            id: courseData.id,
            noteId: courseData.noteId,
            price: courseData.price,
            user: { connect: { id: courseData.user.connect.id } },
            lessons: {
                connect: courseData.lessons.connect
            },
            ...(badge && {
                badge: {
                    create: {
                        name: badge.name,
                        noteId: badge.noteId
                    }
                }
            })
        },
        include: {
            lessons: true,
            user: true,
            badge: true
        }
    });
};

export const updateCourse = async (id, data) => {
    const { lessons, badge, ...otherData } = data;
    return await prisma.course.update({
        where: { id },
        data: {
            ...otherData,
            lessons: {
                deleteMany: {},
                create: lessons.map((lesson, index) => ({
                    resourceId: lesson.resourceId || lesson.d,
                    draftId: lesson.draftId || null,
                    index: index
                }))
            },
            ...(badge && {
                badge: {
                    upsert: {
                        create: {
                            name: badge.name,
                            noteId: badge.noteId
                        },
                        update: {
                            name: badge.name,
                            noteId: badge.noteId
                        }
                    }
                }
            })
        },
        include: {
            lessons: {
                include: {
                    resource: true,
                    draft: true
                },
                orderBy: {
                    index: 'asc'
                }
            },
            badge: true
        }
    });
};

export const deleteCourse = async (id) => {
    await prisma.badge.deleteMany({
        where: { courseId: id }
    });
    
    return await prisma.course.delete({
        where: { id },
    });
};