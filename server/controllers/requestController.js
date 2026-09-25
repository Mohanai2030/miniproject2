import { prisma } from "../lib/prisma.ts";

export const createRequest = async (req, res) => {
  const student_id = req.user.student_id;
  const { item_name, brand_name, quantity, price, image_url, request_visibility } = req.body;

  if (!item_name || quantity === undefined || price === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const visibility = request_visibility === "BUYER_VISIBILITY_LIST" ? "BUYER_VISIBILITY_LIST" : "EVERYONE";

  try {
    const request = await prisma.request.create({
      data: {
        requester_id: student_id,
        item_name,
        brand_name: brand_name || "",
        quantity: parseInt(quantity),
        price: parseFloat(price),
        image_url: image_url || null,
        request_visibility: visibility,
      }
    });

    res.status(201).json(request);
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ error: "Failed to create request" });
  }
};

export const getMyRequests = async (req, res) => {
  const student_id = req.user.student_id;
  const { status } = req.query; // optional status filter

  try {
    const whereClause = {
      requester_id: student_id,
      deleted_or_not: false,
    };

    if (status && status !== 'ALL') {
      whereClause.request_status = status;
    }

    const requests = await prisma.request.findMany({
      where: whereClause,
      orderBy: { creation_time: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching my requests:", error);
    res.status(500).json({ error: "Failed to fetch your requests" });
  }
};

export const getOthersRequests = async (req, res) => {
  const student_id = req.user.student_id;

  try {
    const currentUser = await prisma.student.findUnique({
      where: { student_id },
      select: { college_id: true },
    });

    if (!currentUser) return res.status(404).json({ error: "Student not found" });

    const sameCollegeStudents = await prisma.student.findMany({
      where: { college_id: currentUser.college_id },
      select: { student_id: true }
    });

    const sameCollegeIds = sameCollegeStudents.map(s => s.student_id);

    const rawRequests = await prisma.request.findMany({
      where: {
        requester_id: { in: sameCollegeIds, not: student_id },
        request_status: "AVAILABLE",
        deleted_or_not: false,
      },
      orderBy: { creation_time: 'desc' }
    });

    const listsWhereUserIsBuyer = await prisma.buyer_visibility_list.findMany({
      where: { possiblebuyerId: student_id }
    });

    const allowedRequesters = new Set(listsWhereUserIsBuyer.map(list => list.requestId)); // Wait, requestId is used in visibility list, not studentId! Ah, let me double check schema mapping logic...

    const visibleRequests = rawRequests.filter(req => {
      if (req.request_visibility === "EVERYONE") return true;
      if (req.request_visibility === "BUYER_VISIBILITY_LIST") {
        return allowedRequesters.has(req.request_id);
      }
      return false;
    });

    const requesterIds = Array.from(new Set(visibleRequests.map(r => r.requester_id)));
    const requesters = await prisma.student.findMany({
      where: { student_id: { in: requesterIds } },
      select: { student_id: true, name: true, hostel: true }
    });

    const requesterMap = {};
    requesters.forEach(r => { requesterMap[r.student_id] = r; });

    const response = visibleRequests.map(r => ({
      ...r,
      requester_name: requesterMap[r.requester_id]?.name,
      requester_hostel: requesterMap[r.requester_id]?.hostel
    }));

    res.json(response);
  } catch (error) {
    console.error("Error fetching others requests:", error);
    res.status(500).json({ error: "Failed to fetch others requests" });
  }
};

export const updateRequest = async (req, res) => {
  const student_id = req.user.student_id;
  const request_id = parseInt(req.params.id);
  const { item_name, brand_name, quantity, price, image_url, request_visibility } = req.body;

  try {
    const existing = await prisma.request.findUnique({ where: { request_id } });
    if (!existing) return res.status(404).json({ error: "Request not found" });
    if (existing.requester_id !== student_id) return res.status(403).json({ error: "Unauthorized" });
    if (existing.request_status !== "AVAILABLE") return res.status(400).json({ error: "Cannot edit locked or completed requests" });

    const visibility = request_visibility === "BUYER_VISIBILITY_LIST" ? "BUYER_VISIBILITY_LIST" : "EVERYONE";

    const updated = await prisma.request.update({
      where: { request_id },
      data: {
        item_name: item_name || existing.item_name,
        brand_name: brand_name !== undefined ? brand_name : existing.brand_name,
        quantity: quantity !== undefined ? parseInt(quantity) : existing.quantity,
        price: price !== undefined ? parseFloat(price) : existing.price,
        image_url: image_url !== undefined ? image_url : existing.image_url,
        request_visibility: visibility,
      }
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ error: "Failed to update request" });
  }
};

export const deleteRequest = async (req, res) => {
  const student_id = req.user.student_id;
  const request_id = parseInt(req.params.id);

  try {
    const existing = await prisma.request.findUnique({ where: { request_id } });
    if (!existing) return res.status(404).json({ error: "Request not found" });
    if (existing.requester_id !== student_id) return res.status(403).json({ error: "Unauthorized" });
    if (existing.request_status !== "AVAILABLE") return res.status(400).json({ error: "Cannot delete locked or completed requests" });

    await prisma.request.update({
      where: { request_id },
      data: { deleted_or_not: true }
    });

    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({ error: "Failed to delete request" });
  }
};
