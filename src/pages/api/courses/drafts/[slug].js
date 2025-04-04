import {
  getAllCourseDraftsByUserId,
  getCourseDraftById,
  updateCourseDraft,
  deleteCourseDraft,
} from '@/db/models/courseDraftModels';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req, res) {
  const { slug } = req.query;
  const userId = req.body?.userId || req.query?.userId;

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    if (slug && !userId) {
      try {
        const courseDraft = await getCourseDraftById(slug);

        res.status(200).json(courseDraft);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    } else if (userId) {
      try {
        const courseDrafts = await getAllCourseDraftsByUserId(userId);
        res.status(200).json(courseDrafts);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    } else {
      res.status(400).json({ error: 'User ID is required' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { slug } = req.query;
      const { title, summary, image, price, topics, draftLessons } = req.body;

      const updatedCourseDraft = await updateCourseDraft(slug, {
        title,
        summary,
        image,
        price,
        topics,
        draftLessons,
      });

      res.status(200).json(updatedCourseDraft);
    } catch (error) {
      console.error('Error updating course draft:', error);
      res.status(500).json({ error: 'Failed to update course draft' });
    }
  } else if (req.method === 'DELETE') {
    if (!slug) {
      return res.status(400).json({ error: 'Id is required to delete a course draft' });
    }
    try {
      await deleteCourseDraft(slug);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
