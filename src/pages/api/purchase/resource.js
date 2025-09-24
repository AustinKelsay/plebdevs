import { addResourcePurchaseToUser } from '@/db/models/userModels';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { userId, resourceId, amountPaid } = req.body;

      if (!userId || !resourceId || amountPaid === undefined || amountPaid === null) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const parsedAmount = parseInt(amountPaid, 10);

      if (Number.isNaN(parsedAmount)) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const updatedUser = await addResourcePurchaseToUser(userId, {
        resourceId,
        amountPaid: parsedAmount,
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error in resource purchase:', error);
      res.status(500).json({ error: 'An error occurred while processing the purchase' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
