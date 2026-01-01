import { auth } from "../server.js";

export const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = header.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    req.user = decodedToken; // user.uid is now accessible
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
