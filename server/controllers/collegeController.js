import { prisma } from "../lib/prisma.ts";

export const getColleges = async (req, res) => {
  try {
    const colleges = await prisma.college.findMany({
      select: {
        college_id: true,
        name: true,
        domain_name: true,
      },
    });
    console.log("enna maame sollave illa")
    res.json(colleges);
  } catch (error) {
    console.error("Error fetching colleges:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
