import { getAllDraftsByUserId } from "@/db/models/draftModels";

export default async function handler(req, res) {
const { slug } = req.query;

  if (req.method === 'GET') {
    try {
      const drafts = await getAllDraftsByUserId(slug);
        if (drafts) {
            res.status(200).json(drafts);
        } else {
            res.status(404).json({ error: 'Drafts not found' });
        }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
