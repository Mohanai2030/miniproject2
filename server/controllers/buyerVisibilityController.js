import { prisma } from "../lib/prisma.ts";

export const getBuyerVisibilityList = async (req, res) => {
  const student_id = req.user.student_id;
  try {
    const list = await prisma.buyer_visibility_list.findMany({
      where: { student_id },
    });

    const buyerIds = list.map(item => item.buyer_id);

    const buyers = await prisma.student.findMany({
      where: { student_id: { in: buyerIds } },
      select: {
        student_id: true,
        name: true,
        email: true,
        year: true,
        gender: true,
        hostel: true,
      }
    });

    res.json(buyers);
  } catch (error) {
    console.error("Error getting buyer visibility list:", error);
    res.status(500).json({ error: "Failed to fetch list" });
  }
};

export const searchStudents = async (req, res) => {
  const student_id = req.user.student_id;
  const { search, year, gender, hostel } = req.query;

  try {
    const currentUser = await prisma.student.findUnique({
      where: { student_id },
      select: { college_id: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "Student not found" });
    }

    const whereClause = {
      college_id: currentUser.college_id,
      student_id: { not: student_id },
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (year) {
      whereClause.year = year;
    }
    
    if (gender) {
      whereClause.gender = gender;
    }
    
    if (hostel) {
      whereClause.hostel = hostel;
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        student_id: true,
        name: true,
        email: true,
        year: true,
        gender: true,
        hostel: true,
      }
    });

    res.json(students);
  } catch (error) {
    console.error("Error searching students:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

export const updateBuyerVisibilityList = async (req, res) => {
  const student_id = req.user.student_id;
  const { buyerIds } = req.body; // Expecting an array of student_ids

  if (!Array.isArray(buyerIds)) {
    return res.status(400).json({ error: "buyerIds must be an array" });
  }

  try {
    const currentUser = await prisma.student.findUnique({
      where: { student_id },
      select: { college_id: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Verify all buyers belong to the same college and exist
    if (buyerIds.length > 0) {
      const validBuyers = await prisma.student.findMany({
        where: {
          student_id: { in: buyerIds },
          college_id: currentUser.college_id,
        },
      });

      if (validBuyers.length !== buyerIds.length) {
        return res.status(400).json({ error: "Some buyers are invalid or belong to a different college" });
      }
    }

    // Replace existing list using a transaction
    await prisma.$transaction(async (prismaClient) => {
      await prismaClient.buyer_visibility_list.deleteMany({
        where: { student_id },
      });

      if (buyerIds.length > 0) {
        const data = buyerIds.map(buyer_id => ({
          student_id,
          buyer_id,
        }));
        await prismaClient.buyer_visibility_list.createMany({
          data,
        });
      }
    });

    res.json({ message: "Buyer visibility list updated successfully" });
  } catch (error) {
    console.error("Error updating buyer visibility list:", error);
    res.status(500).json({ error: "Update failed" });
  }
};
