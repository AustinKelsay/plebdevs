import { getUserById, getUserByPubkey, updateUser, deleteUser } from "@/db/models/userModels";

export default async function handler(req, res) {
  const { slug } = req.query;

  // Determine if slug is a pubkey or an ID
  const isPubkey = /^[0-9a-fA-F]{64}$/.test(slug);

  try {
    let user;
    if (isPubkey) {
        console.log('is pub', slug);
      // If slug is a pubkey
      user = await getUserByPubkey(slug);
    } else {
      // Assume slug is an ID
      const id = parseInt(slug);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid identifier" });
      }
      user = await getUserById(id);
    }

    if (!user) {
      return res.status(204).end();
    }

    switch (req.method) {
      case 'GET':
        return res.status(200).json(user);

      case 'PUT':
        if (!isPubkey) {
          // Update operation should be done with an ID, not a pubkey
          const updatedUser = await updateUser(parseInt(slug), req.body);
          return res.status(200).json(updatedUser);
        } else {
          // Handle attempt to update user with pubkey
          return res.status(400).json({ error: "Cannot update user with pubkey. Use ID instead." });
        }

      case 'DELETE':
        if (!isPubkey) {
          // Delete operation should be done with an ID, not a pubkey
          await deleteUser(parseInt(slug));
          return res.status(204).end();
        } else {
          // Handle attempt to delete user with pubkey
          return res.status(400).json({ error: "Cannot delete user with pubkey. Use ID instead." });
        }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
