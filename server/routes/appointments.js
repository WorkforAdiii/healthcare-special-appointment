import express from "express";
import admin from "firebase-admin";
import { db } from "../server.js";
import dayjs from "dayjs";

const router = express.Router();
const allowedDays = [2, 3, 5];

const isAllowedDay = (date) => allowedDays.includes(dayjs(date).day());

const isSlotAvailable = async (timestamp, timeSlot) => {
  const snap = await db
    .collection("appointments")
    .where("timestamp", "==", timestamp)
    .where("timeSlot", "==", timeSlot)
    .get();
  return snap.empty;
};
router.post("/book-appointment", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const decoded = await admin.auth().verifyIdToken(token);
    const userId = decoded.uid;

    const { selectedDate, timeSlot } = req.body;

    if (!selectedDate) return res.status(400).json({ error: "Date missing!" });

    if (!isAllowedDay(selectedDate))
      return res.status(400).json({
        error: "Selected date must be Tue, Wed, or Fri",
      });

    const existingAppointments = await db
      .collection("appointments")
      .where("patientId", "==", userId)
      .get();

    if (!existingAppointments.empty) {
      return res.status(409).json({
        error: "You already have an appointment. Please cancel your existing appointment first.",
      });
    }

    const sessions = [];

    for (let i = 0; i < 3; i++) {
      const sessionDate = dayjs(selectedDate).add(i * 14, "day");
      const timestamp = sessionDate.toISOString();

      const available = await isSlotAvailable(timestamp, timeSlot);
      if (!available) {
        return res.status(409).json({
          error: `Slot unavailable: ${sessionDate.format("DD MMM")}`,
        });
      }

      const docRef = await db.collection("appointments").add({
        patientId: userId,
        sessionNumber: i + 1,
        timestamp,
        timeSlot,
      });

      sessions.push(docRef.id);
    }

    res.json({
      success: true,
      message: "3 sessions booked successfully! 🎉",
      sessions,
    });
  } catch (error) {
    console.error("Booking Error:", error);
    console.error("Error details:", error.message, error.code);
    
    // Provide more specific error messages
    if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    
    res.status(500).json({ error: "Server error while booking" });
  }
});
router.get("/my-appointments", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const decoded = await admin.auth().verifyIdToken(token);

    const snap = await db
      .collection("appointments")
      .where("patientId", "==", decoded.uid)
      .get();

    const data = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));

    res.json(data);
  } catch (error) {
    console.error("Fetch Error:", error);
    console.error("Error details:", error.message, error.code);
    
    if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    
    res.status(500).json({ error: "Cannot fetch appointments" });
  }
});
router.delete("/cancel-appointments", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const snap = await db
      .collection("appointments")
      .where("patientId", "==", decoded.uid)
      .get();

    const batch = db.batch();
    snap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    res.json({ message: "All appointments cancelled!" });
  } catch (error) {
    console.error("Cancel Error:", error);
    res.status(500).json({ error: "Failed to cancel sessions" });
  }
});
router.delete("/cancel-appointment/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const decoded = await admin.auth().verifyIdToken(token);
    const appointmentId = req.params.id;

    const docRef = db.collection("appointments").doc(appointmentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const appointmentData = docSnap.data();
    if (appointmentData.patientId !== decoded.uid) {
      return res.status(403).json({ error: "Unauthorized to cancel this appointment" });
    }

    await docRef.delete();

    res.json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Cancel Single Error:", error);
    res.status(500).json({ error: "Failed to cancel appointment" });
  }
});
router.post("/reschedule", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const decoded = await admin.auth().verifyIdToken(token);
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: "Invalid updates format" });
    }

    const batch = db.batch();

    for (const update of updates) {
      if (!update.id) {
        return res.status(400).json({ error: "Missing appointment id in updates" });
      }

      const docRef = db.collection("appointments").doc(update.id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).json({ error: `Appointment ${update.id} not found` });
      }

      const existingData = docSnap.data();
      if (existingData.patientId !== decoded.uid) {
        return res.status(403).json({ error: "Unauthorized to modify this appointment" });
      }

      const timestamp = update.date || existingData.timestamp;

      batch.update(docRef, {
        timestamp,
        timeSlot: update.timeSlot || existingData.timeSlot,
      });
    }

    await batch.commit();

    res.json({ message: "Appointments rescheduled successfully!" });
  } catch (error) {
    console.error("Reschedule Error:", error);
    res.status(500).json({ error: "Failed to reschedule appointments" });
  }
});

export default router;
