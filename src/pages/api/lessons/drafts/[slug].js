import { getDraftLessonById, updateDraftLesson, deleteDraftLesson } from "@/db/models/draftLessonModels";

export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method === 'GET') {
    try {
      const draftLesson = await getDraftLessonById(slug);
      if (draftLesson) {
        res.status(200).json(draftLesson);
      } else {
        res.status(404).json({ error: 'Draft lesson not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const draftLesson = await updateDraftLesson(slug, req.body);
      res.status(200).json(draftLesson);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      await deleteDraftLesson(slug);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}