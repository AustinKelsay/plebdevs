import prisma from "@/db/prisma";

export const getUserCourses = async (userId) => {
  return await prisma.userCourse.findMany({
    where: { userId },
    include: { course: true },
  });
};

export const getUserCourse = async (userId, courseId) => {
  return await prisma.userCourse.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    include: { course: true },
  });
};

export const createOrUpdateUserCourse = async (userId, courseId, data) => {
  const existing = await prisma.userCourse.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  const updateData = existing?.completed ? {
    ...data,
    updatedAt: new Date(),
    completedAt: existing.completedAt,
  } : {
    ...data,
    updatedAt: new Date(),
  };

  return await prisma.userCourse.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    update: updateData,
    create: {
      userId,
      courseId,
      ...data,
    },
  });
};

export const deleteUserCourse = async (userId, courseId) => {
  return await prisma.userCourse.delete({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });
};

export const checkCourseCompletion = async (userId, courseId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: {
        include: {
          userLessons: {
            where: { userId: userId }
          }
        }
      }
    }
  });

  if (!course) {
    throw new Error("Course not found");
  }

  const allLessonsCompleted = course.lessons.every(lesson => 
    lesson.userLessons.length > 0 && lesson.userLessons[0].completed
  );

  const existingUserCourse = await prisma.userCourse.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      }
    }
  });

  if (allLessonsCompleted) {
    await createOrUpdateUserCourse(userId, courseId, {
      completed: true,
      ...(existingUserCourse?.completed ? {} : { completedAt: new Date() })
    });
    return true;
  }

  return false;
};