import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const useTrackVideoLesson = ({lessonId, videoDuration, courseId, videoPlayed, paidCourse, decryptionPerformed}) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const timerRef = useRef(null);
  const { data: session, update } = useSession();
  const completedRef = useRef(false);

  useEffect(() => {
    if (session?.user?.role?.admin) {
      setIsAdmin(true);
    }
  }, [session]);

  const checkOrCreateUserLesson = useCallback(async () => {
    if (!session?.user) return false;
    try {
      const response = await axios.get(`/api/users/${session.user.id}/lessons/${lessonId}?courseId=${courseId}`);
      if (response.status === 200 && response?.data) {
        if (response?.data?.completed) {
          setIsCompleted(true);
          completedRef.current = true;
          return true;
        } else {
          return false;
        }
      } else if (response.status === 204) {
        // Only create a new UserLesson entry if it's a free course or if decryption has been performed for a paid course
        if (paidCourse === false || (paidCourse && decryptionPerformed)) {
          await axios.post(`/api/users/${session.user.id}/lessons?courseId=${courseId}`, {
            resourceId: lessonId,
            opened: true,
            openedAt: new Date().toISOString(),
          });
          // Call session update after creating a new UserLesson entry
          await update();
        }
        return false;
      } else {
        console.error('Error checking or creating UserLesson:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error checking or creating UserLesson:', error);
      return false;
    }
  }, [session, lessonId, courseId, update, paidCourse, decryptionPerformed]);

  const markLessonAsCompleted = useCallback(async () => {
    if (!session?.user || completedRef.current) return;
    completedRef.current = true;
    
    try {
      const response = await axios.put(`/api/users/${session.user.id}/lessons/${lessonId}?courseId=${courseId}`, {
        completed: true,
        completedAt: new Date().toISOString(),
      });

      if (response.status === 200) {
        setIsCompleted(true);
        setIsTracking(false);
        // Call session update after marking the lesson as completed
        await update();
      } else {
        console.error('Failed to mark lesson as completed:', response.statusText);
      }
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
    }
  }, [lessonId, courseId, session, update]);

  useEffect(() => {
    const initializeTracking = async () => {
      if (isAdmin) return;

      const alreadyCompleted = await checkOrCreateUserLesson();
      if (!alreadyCompleted && videoDuration && !completedRef.current && videoPlayed && (paidCourse === false || (paidCourse && decryptionPerformed))) {
        setIsTracking(true);
        console.log('🎥 Starting video tracking - Duration:', videoDuration);
        timerRef.current = setInterval(() => {
          setTimeSpent(prevTime => {
            const newTime = prevTime + 1;
            console.log(`⏱️ Time spent: ${newTime}s / ${videoDuration}s (${((newTime/videoDuration)*100).toFixed(1)}%)`);
            return newTime;
          });
        }, 1000);
      }
    };

    initializeTracking();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [lessonId, videoDuration, checkOrCreateUserLesson, videoPlayed, isAdmin, paidCourse, decryptionPerformed]);

  useEffect(() => {
    if (isAdmin) return;

    if (videoDuration && timeSpent >= Math.round(videoDuration * 0.9) && !completedRef.current) {
      console.log('🎯 Video reached 90% threshold - Marking as completed');
      markLessonAsCompleted();
    }
  }, [timeSpent, videoDuration, markLessonAsCompleted, isAdmin]);

  return { isCompleted, isTracking };
};

export default useTrackVideoLesson;