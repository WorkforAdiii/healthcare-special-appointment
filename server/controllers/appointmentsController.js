import { db } from "../server.js";
import { Timestamp } from "firebase-admin/firestore";
import {
  toIST,
  getNextAllowedDay,
  generateFollowUps,
} from "../utils/dateUtils.js";

// Valid time slots (strict — based on your UI)
const allowedSlots = ["09:00–10:00", "10:00–11:00", "11:00–12:00"];

// Create booking + auto schedule follow-ups
export const bookAppointment = async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    const patientId = req.user.uid;

    if (!allowedSlots.includes(timeSlot)) {
      return res.status(400).json({ error: "Invalid time slot!" });
    }

    let selectedDate = new Date(date);
    selectedDate = toIST(selectedDate);
    selectedDate = getNextAllowedDay(selectedDate);

    const firstSessionTS = Timestamp.fromDate(selectedDate);
    const followUps = generateFollowUps(selectedDate, timeSlot);

    const sessionsToCheck = [
      { timestamp: firstSessionTS, timeSlot },
      ...followUps,
    ];

    // Use transaction for atomic check-and-write
    await db.runTransaction(async (transaction) => {
      // Check if any of the sessions are already booked
      for (const session of sessionsToCheck) {
        const q = await transaction.get(
          db
            .collection("appointments")
            .where("timestamp", "==", session.timestamp)
            .where("timeSlot", "==", session.timeSlot)
        );

        if (!q.empty) {
          throw new Error("Selected time slot is already booked!");
        }
      }

      // If all checks pass, write all 3 sessions atomically
      sessionsToCheck.forEach((session, index) => {
        const docRef = db.collection("appointments").doc();
        transaction.set(docRef, {
          userId: patientId,
          sessionNumber: index + 1,
          timestamp: session.timestamp,
          timeSlot: session.timeSlot,
        });
      });
    });

    return res.status(200).json({
      message: "Appointment booked successfully!",
      sessions: sessionsToCheck,
    });
  } catch (error) {
    console.error("Booking error:", error);

    // Check if it's the slot already booked error
    if (error.message && error.message.includes("already booked")) {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch patient appointments
export const getMyAppointments = async (req, res) => {
  try {
    const patientId = req.user.uid;
    console.log("Fetching appointments for user:", patientId);

    if (!patientId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const snap = await db
      .collection("appointments")
      .where("userId", "==", patientId)
      .get();

    console.log("Found", snap.docs.length, "appointments");

    const data = snap.docs
      .map((doc) => {
        try {
          const docData = doc.data();
          console.log("Processing document:", doc.id, docData);

          let timestampValue = null;
          if (docData.timestamp) {
            // Handle both Firestore Timestamp and Date objects
            if (typeof docData.timestamp.toDate === "function") {
              timestampValue = docData.timestamp.toDate().toISOString();
            } else if (docData.timestamp instanceof Date) {
              timestampValue = docData.timestamp.toISOString();
            } else {
              timestampValue = new Date(docData.timestamp).toISOString();
            }
          }

          return {
            id: doc.id,
            userId: docData.userId || null,
            sessionNumber: docData.sessionNumber || 0,
            timestamp: timestampValue,
            timeSlot: docData.timeSlot || null,
          };
        } catch (docError) {
          console.error("Error processing document", doc.id, ":", docError);
          throw docError;
        }
      })
      .sort((a, b) => a.sessionNumber - b.sessionNumber);

    console.log("Returning appointments data:", data);
    res.status(200).json(data);
  } catch (error) {
    console.error("Fetch error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
      type: error.constructor.name,
    });
  }
};

// Cancel all sessions for patient
export const cancelAppointments = async (req, res) => {
  try {
    const patientId = req.user.uid;

    const snap = await db
      .collection("appointments")
      .where("userId", "==", patientId)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: "No appointments found!" });
    }

    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();

    res.status(200).json({ message: "All appointments cancelled!" });
  } catch (error) {
    console.error("Cancel error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Reschedule appointments
export const rescheduleAppointment = async (req, res) => {
  try {
    const patientId = req.user.uid;
    const { updates } = req.body;

    console.log("Reschedule request - patientId:", patientId);
    console.log("Updates:", updates);

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: "Invalid updates format" });
    }

    const batch = db.batch();

    for (const update of updates) {
      if (!update.id) {
        return res
          .status(400)
          .json({ error: "Missing appointment id in updates" });
      }

      const docRef = db.collection("appointments").doc(update.id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res
          .status(404)
          .json({ error: `Appointment ${update.id} not found` });
      }

      const existingData = docSnap.data();
      console.log(
        "Existing data userId:",
        existingData.userId,
        "Type:",
        typeof existingData.userId
      );
      console.log("Patient id:", patientId, "Type:", typeof patientId);

      if (existingData.userId !== patientId) {
        return res.status(403).json({
          error: "Unauthorized to modify this appointment",
          details: { stored: existingData.userId, provided: patientId },
        });
      }

      // Convert date string to Timestamp
      let newTimestamp;
      if (update.date) {
        const dateObj = new Date(update.date);
        newTimestamp = Timestamp.fromDate(dateObj);
      } else {
        newTimestamp = existingData.timestamp;
      }

      // Update the document with new timestamp and timeSlot
      batch.update(docRef, {
        timestamp: newTimestamp,
        timeSlot: update.timeSlot || existingData.timeSlot,
      });
    }

    await batch.commit();

    res.status(200).json({ message: "Appointments rescheduled successfully!" });
  } catch (error) {
    console.error("Reschedule error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
