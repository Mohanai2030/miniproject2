import { prisma } from "../lib/prisma.ts";

export const createTrip = async (req, res) => {
  const student_id = req.user.student_id;
  const { 
    location, 
    date_of_travel, 
    trip_visibility, 
    expected_time_of_arrival, 
    note, 
    requester_visibility_list 
  } = req.body;

  if (!location || !date_of_travel) {
    return res.status(400).json({ error: "Missing required fields: location and date_of_travel" });
  }

  const visibility = trip_visibility === "BUYER_VISIBILITY_LIST" ? "BUYER_VISIBILITY_LIST" : "EVERYONE";

  try {
    const tripData = {
      student_id,
      location,
      date_of_travel: new Date(date_of_travel),
      trip_visibility: visibility,
      note: note || null,
    };

    if (expected_time_of_arrival) {
      tripData.expected_time_of_arrival = new Date(expected_time_of_arrival);
    }

    if (visibility === "BUYER_VISIBILITY_LIST" && Array.isArray(requester_visibility_list) && requester_visibility_list.length > 0) {
      tripData.requester_visibility_list = {
        create: requester_visibility_list.map(requester_id => ({
          requester_id: parseInt(requester_id)
        }))
      };
    }

    const trip = await prisma.trip.create({
      data: tripData,
      include: {
        requester_visibility_list: true
      }
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ error: "Failed to create trip" });
  }
};

export const getAvailableTrips = async (req, res) => {
  const student_id = req.user.student_id;

  try {
    const currentUser = await prisma.student.findUnique({
      where: { student_id },
      select: { college_id: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "Student not found" });
    }

    const sameCollegeStudents = await prisma.student.findMany({
      where: { college_id: currentUser.college_id },
      select: { student_id: true }
    });
    const sameCollegeIds = sameCollegeStudents.map(s => s.student_id);

    const rawTrips = await prisma.trip.findMany({
      where: {
        student_id: { in: sameCollegeIds },
        deleted_or_not: false,
        OR: [
          { trip_visibility: "EVERYONE" },
          { student_id }
        ]
      },
      include: {
        student: {
          select: { name: true, phone: true }
        }
      }
    });

    const tripsWithBuyerVisibility = await prisma.trip.findMany({
      where: {
        student_id: { in: sameCollegeIds },
        deleted_or_not: false,
        trip_visibility: "BUYER_VISIBILITY_LIST",
        student_id: { not: student_id },
        requester_visibility_list: {
          some: { requester_id: student_id }
        }
      },
      include: {
        student: {
          select: { name: true, phone: true }
        }
      }
    });

    const allTripsMap = new Map();
    rawTrips.forEach(t => allTripsMap.set(t.trip_id, t));
    tripsWithBuyerVisibility.forEach(t => allTripsMap.set(t.trip_id, t));

    const allTrips = Array.from(allTripsMap.values()).map(t => ({
      ...t,
      is_mine: t.student_id === student_id
    }));
    allTrips.sort((a, b) => b.creation_time - a.creation_time);

    res.json(allTrips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
};

export const editTrip = async (req, res) => {
  const student_id = req.user.student_id;
  const { id } = req.params;
  const { location, date_of_travel, expected_time_of_arrival, note } = req.body;

  try {
    const trip = await prisma.trip.findUnique({ where: { trip_id: parseInt(id) } });
    if (!trip || trip.student_id !== student_id) {
      return res.status(403).json({ error: "Not authorized or trip not found" });
    }

    const updatedData = {};
    if (location) updatedData.location = location;
    if (date_of_travel) updatedData.date_of_travel = new Date(date_of_travel);
    if (expected_time_of_arrival) updatedData.expected_time_of_arrival = new Date(expected_time_of_arrival);
    if (note !== undefined) updatedData.note = note;

    const updatedTrip = await prisma.trip.update({
      where: { trip_id: parseInt(id) },
      data: updatedData,
    });
    res.json(updatedTrip);
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(500).json({ error: "Failed to update trip" });
  }
};

export const deleteTrip = async (req, res) => {
  const student_id = req.user.student_id;
  const { id } = req.params;

  try {
    const trip = await prisma.trip.findUnique({ where: { trip_id: parseInt(id) } });
    if (!trip || trip.student_id !== student_id) {
      return res.status(403).json({ error: "Not authorized or trip not found" });
    }

    await prisma.trip.update({
      where: { trip_id: parseInt(id) },
      data: { deleted_or_not: true },
    });
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({ error: "Failed to delete trip" });
  }
};
