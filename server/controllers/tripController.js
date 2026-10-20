import { prisma } from "../../packages/database/lib/prisma.ts";

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

  const visibility = trip_visibility === "REQUESTER_VISIBILITY_LIST" ? "REQUESTER_VISIBILITY_LIST" : "EVERYONE";

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

    if (visibility === "REQUESTER_VISIBILITY_LIST" && Array.isArray(requester_visibility_list) && requester_visibility_list.length > 0) {
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

    // using kafka publisher, publish an event to the notifications topic 
    // value of the message must be tripId, tripVisibility, and array of studentIds who are in requester visibility list(if trip visbility type is everyone then no one will be in the array),
    let kafkaMessage = {
      "tripId": trip.trip_id,
      "tripVisibility":trip.trip_visibility
    };

    if (trip.trip_visibility === "REQUESTER_VISIBILITY_LIST") {
      kafkaMessage.requesterVisibilityList = trip.requester_visibility_list.map(requester => requester.requester_id)
    } else {
      kafkaMessage.requesterVisibilityList = []
    }

    kafkaProduceMessage("notifications", JSON.stringify(kafkaMessage));
    
    res.status(201).json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ error: "Failed to create trip" });
  }
};

export const myTrips = async (req,res) => {
  const student_id = req.user.student_id;

  try {
    const trips = await prisma.trip.findMany({
      where: { 
        student_id, 
      },
    });
    res.json(trips);
  } catch (error) {
    console.error("Error fetching my trips:", error);
    res.status(500).json({ error: "Failed to fetch my trips" });
  }
}

export const myTripRequesterVisibilityList = async (req,res) => {
  const trip_id = req.user.TripId;
  const student_id = req.user.student_id;

  try {
    const trip_visibility_students = await prisma.trip.findUnique({
      where: { trip_id, student_id },
      select: {
        requester_visibility_list: {
          select: {
            requester:{
              select:{
                name:true,
              }
            }
          }
        }
      }
    });

    const requester_names = trip_visibility_students.requester_visibility_list.map(t => t.requester.name)

    res.json(requester_names);
  } catch (error) {
    console.error("Error fetching my trip requester visibility list:", error);
    res.status(500).json({ error: "Failed to fetch my trip requester visibility list" });
  }
}

export const getAvailableTrips = async (req, res) => {
  const student_id = req.user.student_id;

  try {
    const allTripsStudentInvolvedIn = await prisma.trip.findMany({
      where:{
        AND:[
            {
                deleted_or_not:false,
                student_id:{
                    not:student_id
                },
                date_of_travel:{
                    gte: new Date()
                }
            },
            {
                OR:[
                    {
                        trip_visibility: "EVERYONE"
                    },
                    {
                        requester_visibility_list:{
                        some: {
                            requester_id: student_id
                        }
                        }
                    }
                ]
            }
        ],
        
      },
      select:{
        location:true,
        date_of_travel:true,
        expected_time_of_arrival:true,
        note:true,
        creation_time:true
      }
    })

    res.json(allTripsStudentInvolvedIn);
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

