import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { Card, DatePicker, Select, Button, message, Typography } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const allowedDays = [2, 3, 5];
const timeSlots = ["09:00-10:00", "10:00-11:00", "11:00-12:00"];

const Reschedule = () => {
  const { number } = useParams();
  const sessionNumber = parseInt(number);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [newDate, setNewDate] = useState(null);
  const [newTime, setNewTime] = useState("09:00-10:00");
  const [allBookedDates, setAllBookedDates] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);

  useEffect(() => {
    fetchAppointments();
    fetchAllAppointments();
  }, []);

  useEffect(() => {
    if (newTime) {
      fetchAllBookedDatesForTimeSlot(newTime);
    }
  }, [newTime]);

  const fetchAllAppointments = async () => {
    try {
      const snap = await getDocs(collection(db, "appointments"));
      const appointments = [];
      snap.forEach((doc) => {
        const data = doc.data();
        let dateStr = null;
        if (data.timestamp) {
          let dateObj;
          if (typeof data.timestamp.toDate === "function") {
            dateObj = data.timestamp.toDate();
          } else {
            dateObj = new Date(data.timestamp);
          }
          dateStr = dateObj.toDateString();
        } else if (data.date) {
          dateStr = new Date(data.date).toDateString();
        }
        if (dateStr) {
          appointments.push({
            date: dateStr,
            timeSlot: data.timeSlot,
          });
        }
      });
      setAllAppointments(appointments);
    } catch (error) {
      console.error("Error fetching all appointments:", error);
    }
  };

  const fetchAllBookedDatesForTimeSlot = async (timeSlot) => {
    try {
      const q = query(
        collection(db, "appointments"),
        where("timeSlot", "==", timeSlot)
      );
      const snap = await getDocs(q);

      const dates = [];
      snap.forEach((d) => {
        const docData = d.data();
        if (docData.timestamp) {
          // Handle both Firestore Timestamp and ISO strings
          let dateObj;
          if (typeof docData.timestamp.toDate === "function") {
            dateObj = docData.timestamp.toDate();
          } else {
            dateObj = new Date(docData.timestamp);
          }
          dates.push(dateObj.toDateString());
        } else if (docData.date) {
          dates.push(new Date(docData.date).toDateString());
        }
      });

      setAllBookedDates(dates);
    } catch (error) {
      console.error("Error fetching booked dates:", error);
    }
  };

  const fetchAppointments = async () => {
    if (!auth.currentUser) return navigate("/login");

    const q = query(
      collection(db, "appointments"),
      where("patientId", "==", auth.currentUser.uid)
    );
    const snap = await getDocs(q);

    const docs = [];
    snap.forEach((d) => {
      const data = d.data();
      // Convert timestamp to date format for compatibility
      let dateValue = null;
      if (data.timestamp) {
        if (typeof data.timestamp.toDate === "function") {
          dateValue = data.timestamp.toDate().toISOString();
        } else {
          dateValue = new Date(data.timestamp).toISOString();
        }
      }
      docs.push({ 
        id: d.id, 
        ...data,
        date: dateValue || data.date
      });
    });
    docs.sort((a, b) => a.sessionNumber - b.sessionNumber);

    setAppointments(docs);

    const currentSession = docs[sessionNumber - 1];
    setNewTime(currentSession?.timeSlot || "09:00-10:00");
    // Set the DatePicker initial value to the current session date (as a Date)
    if (currentSession?.timestamp) {
      let dateObj;
      if (typeof currentSession.timestamp.toDate === "function") {
        dateObj = currentSession.timestamp.toDate();
      } else {
        dateObj = new Date(currentSession.timestamp);
      }
      setNewDate(dateObj);
    } else if (currentSession?.date) {
      setNewDate(new Date(currentSession.date));
    }
  };

  // Normalize booked dates to a consistent format for easy comparison
  const bookedDates = useMemo(
    () => appointments.map((a) => {
      if (a.timestamp) {
        let dateObj;
        if (typeof a.timestamp.toDate === "function") {
          dateObj = a.timestamp.toDate();
        } else {
          dateObj = new Date(a.timestamp);
        }
        return dateObj.toDateString();
      }
      return new Date(a.date).toDateString();
    }),
    [appointments]
  );

  // The date currently assigned to the session being rescheduled
  const currentSessionDate = useMemo(() => {
    const session = appointments[sessionNumber - 1];
    if (!session) return null;
    
    if (session.timestamp) {
      let dateObj;
      if (typeof session.timestamp.toDate === "function") {
        dateObj = session.timestamp.toDate();
      } else {
        dateObj = new Date(session.timestamp);
      }
      return dateObj.toDateString();
    }
    return new Date(session.date).toDateString();
  }, [appointments, sessionNumber]);

  // Dates booked by other sessions (these should be disabled)
  const bookedDatesExcludingCurrent = useMemo(
    () => bookedDates.filter((d) => d !== currentSessionDate),
    [bookedDates, currentSessionDate]
  );

  const getNextAllowedDate = (dateObj) => {
    const d = new Date(dateObj);
    while (!allowedDays.includes(d.getDay())) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  };

  // Calculate dates that have all 3 slots booked
  const fullyBookedDates = useMemo(() => {
    const dateSlotMap = {};
    
    // Group appointments by date
    allAppointments.forEach((apt) => {
      if (!dateSlotMap[apt.date]) {
        dateSlotMap[apt.date] = new Set();
      }
      dateSlotMap[apt.date].add(apt.timeSlot);
    });

    // Find dates with all 3 slots booked
    const fullyBooked = [];
    Object.keys(dateSlotMap).forEach((dateStr) => {
      if (dateSlotMap[dateStr].size === 3) {
        fullyBooked.push(dateStr);
      }
    });

    return fullyBooked;
  }, [allAppointments]);

  // Calculate cascading dates (14 and 28 days later) for fully booked dates
  const fullyBookedDatesWithCascading = useMemo(() => {
    const allDates = new Set(fullyBookedDates);
    
    fullyBookedDates.forEach((dateStr) => {
      const baseDate = new Date(dateStr);
      
      // Add 14 days later
      const date14 = new Date(baseDate);
      date14.setDate(date14.getDate() + 14);
      // Find next allowed day
      while (!allowedDays.includes(date14.getDay())) {
        date14.setDate(date14.getDate() + 1);
      }
      allDates.add(date14.toDateString());
      
      // Add 28 days later
      const date28 = new Date(baseDate);
      date28.setDate(date28.getDate() + 28);
      // Find next allowed day
      while (!allowedDays.includes(date28.getDay())) {
        date28.setDate(date28.getDate() + 1);
      }
      allDates.add(date28.toDateString());
    });

    return Array.from(allDates);
  }, [fullyBookedDates]);

  const previewFutureDates = useMemo(() => {
    if (!newDate || appointments.length !== 3) return [];

    const dates = [];
    const d = new Date(newDate);

    if (sessionNumber <= 2) {
      const dt2 = new Date(d);
      dt2.setDate(dt2.getDate() + 14);
      dates.push(getNextAllowedDate(dt2).toDateString());
    }

    if (sessionNumber === 1) {
      const dt3 = new Date(d);
      dt3.setDate(dt3.getDate() + 28);
      dates.push(getNextAllowedDate(dt3).toDateString());
    }

    return dates;
  }, [newDate, appointments, sessionNumber]);

  const handleReschedule = async () => {
    if (!newDate) return message.warning("Please choose a date");

    const updated = [...appointments];
    const idx = sessionNumber - 1;

    // Defensive checks to avoid "Cannot read" when appointments are missing
    if (!updated[idx]) {
      message.error("Session not found. Returning to dashboard.");
      return navigate("/dashboard");
    }

    const baseDate = dayjs(newDate).startOf("day");

    // 1. Update the target session
    updated[idx].date = baseDate.toISOString();
    updated[idx].dateKey = baseDate.toDate().toDateString(); // Ensure dateKey exists
    updated[idx].timeSlot = newTime;

    // 2. Cascade logic for follow-up sessions
    if (sessionNumber <= 2) {
      if (!updated[idx + 1]) {
        message.error("Cannot compute follow-up session: data missing.");
        return;
      }
      const d2 = getNextAllowedDate(baseDate.add(14, "day").toDate());
      updated[idx + 1].date = d2.toISOString();
      updated[idx + 1].dateKey = d2.toDateString();
      updated[idx + 1].timeSlot = newTime;
    }

    if (sessionNumber === 1) {
      if (!updated[2]) {
        message.error("Cannot compute third session: data missing.");
        return;
      }
      const d3 = getNextAllowedDate(baseDate.add(28, "day").toDate());
      updated[2].date = d3.toISOString();
      updated[2].dateKey = d3.toDateString();
      updated[2].timeSlot = newTime;
    }

    try {
      // 3. Global Conflict Check (Frontend)
      const targetDateKeys = updated.map((u) =>
        new Date(u.date).toDateString()
      );
      const q = query(
        collection(db, "appointments"),
        where("timeSlot", "==", newTime)
      );
      const snap = await getDocs(q);

      let conflict = null;
      snap.forEach((d) => {
        const data = d.data();
        if (data.patientId === auth.currentUser.uid) return;
        let existingKey;
        if (data.timestamp) {
          let dateObj;
          if (typeof data.timestamp.toDate === "function") {
            dateObj = data.timestamp.toDate();
          } else {
            dateObj = new Date(data.timestamp);
          }
          existingKey = dateObj.toDateString();
        } else {
          existingKey = data.dateKey || new Date(data.date).toDateString();
        }
        if (targetDateKeys.includes(existingKey)) {
          conflict = { date: existingKey };
        }
      });

      if (conflict) {
        return message.error(
          `Conflict: ${conflict.date} at ${newTime} is taken.`
        );
      }

      // 4. Server Request (more robust error handling)
      const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";
      const token = await auth.currentUser.getIdToken();
      const payload = {
        updates: updated.map((u) => ({
          id: u.id,
          date: u.date,
          timeSlot: u.timeSlot,
          sessionNumber: u.sessionNumber,
        })),
      };

      const resp = await fetch(`${API_BASE}/api/reschedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let result;
      const contentType = resp.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        result = await resp.json();
      } else {
        result = { error: await resp.text() };
      }

      if (!resp.ok) throw new Error(result.error || "Reschedule failed");

      message.success("Session rescheduled!");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      message.error(error.message || "Error occurred, try again!");
    }
  };

  return (
    <>
      <Navbar />

      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1677FF 0%, #004AAD 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingTop: "30px",
        }}
      >
        <Card
          style={{
            width: 460,
            borderRadius: 22,
            background: "#fff",
            boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
          }}
          bodyStyle={{ padding: "38px" }}
        >
          <Title
            level={3}
            style={{ textAlign: "center", color: "#1677FF", fontWeight: 800 }}
          >
            Reschedule Session {sessionNumber}
          </Title>
          <p style={{ textAlign: "center", color: "#555", marginBottom: 20 }}>
            Select a new date and time
          </p>

          <DatePicker
            suffixIcon={<CalendarOutlined style={{ color: "#1677FF" }} />}
            style={{
              width: "100%",
              height: 42,
              borderRadius: 10,
              marginBottom: 18,
            }}
            allowClear={false}
            format="DD MMM YYYY"
            getPopupContainer={(trigger) => trigger.parentNode}
            // UPDATED LOGIC: Disable past dates OR dates that are not Tue(2), Wed(3), or Fri(5)
            disabledDate={(current) => {
              if (!current) return false;
              const isPast = current < dayjs().startOf("day");
              const isAllowedDay = allowedDays.includes(current.day());
              const formatted = current.toDate().toDateString();

              // Prevent selecting dates that are booked by other sessions
              if (bookedDatesExcludingCurrent.includes(formatted)) return true;

              // Prevent selecting dates where all 3 slots are booked
              if (fullyBookedDatesWithCascading.includes(formatted)) return true;

              return isPast || !isAllowedDay;
            }}
            value={newDate ? dayjs(newDate) : null}
            onChange={(d) => setNewDate(d ? d.toDate() : null)}
            cellRender={(current) => {
              const formatted = current.toDate().toDateString();
              const isAllowed = allowedDays.includes(current.day());
              const isBooked =
                bookedDates.includes(formatted) ||
                allBookedDates.includes(formatted);
              const isBookedOther =
                bookedDatesExcludingCurrent.includes(formatted) ||
                (allBookedDates.includes(formatted) &&
                  formatted !== currentSessionDate);
              const isCurrentSession = formatted === currentSessionDate;
              const isPreview = previewFutureDates.includes(formatted);
              const isFullyBooked = fullyBookedDatesWithCascading.includes(formatted);

              let bg = "transparent",
                color = "#444",
                weight = 500,
                border = "none",
                opacity = 1;

              // Fully booked dates (all 3 slots) - darkest red
              if (isFullyBooked && !isCurrentSession) {
                bg = "#cf1322";
                color = "#fff";
                weight = 700;
                border = "2px solid #a4161a";
              }
              // Preview dates for cascading sessions (blue)
              else if (isPreview) {
                bg = "#e6f2ff";
                color = "#1677FF";
                weight = 700;
              }
              // Booked dates (any of the three) should be highlighted in red
              else if (isBooked) {
                bg = "#ff4d4f";
                color = "#fff";
                weight = 700;
                // Give all booked dates a darker red border
                border = isCurrentSession
                  ? "3px solid #a4161a"
                  : "2px solid #cf1322";
              } else if (isAllowed && !isPreview) {
                // Normal allowed day styling
                bg = "#e6f2ff";
                color = "#1677FF";
                weight = 600;
              }

              // Slightly dim other booked dates to indicate they're unavailable for selection
              if (isBookedOther && !isCurrentSession && !isFullyBooked) opacity = 0.9;

              return (
                <div
                  title={
                    isFullyBooked
                      ? "All slots booked on this date"
                      : isBooked
                      ? isCurrentSession
                        ? "Current session"
                        : "Already booked"
                      : isPreview
                      ? "New cascading dates"
                      : ""
                  }
                  style={{
                    width: 25,
                    height: 25,
                    borderRadius: "50%",
                    margin: "auto",
                    lineHeight: "25px",
                    fontWeight: weight,
                    background: bg,
                    color,
                    border,
                    opacity,
                  }}
                >
                  {current.date()}
                </div>
              );
            }}
          />

          <Select
            suffixIcon={<ClockCircleOutlined />}
            style={{
              width: "100%",
              height: 42,
              borderRadius: 10,
              marginBottom: 24,
            }}
            value={newTime}
            onChange={(v) => setNewTime(v)}
          >
            {timeSlots.map((slot) => (
              <Select.Option key={slot} value={slot}>
                {slot}
              </Select.Option>
            ))}
          </Select>

          <Button
            type="primary"
            block
            onClick={handleReschedule}
            disabled={!appointments[sessionNumber - 1]}
            style={{ height: 48, fontWeight: 700, borderRadius: 10 }}
          >
            Confirm Reschedule
          </Button>

          <Button
            block
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/dashboard")}
            style={{ marginTop: 10, fontWeight: 600, borderRadius: 10 }}
          >
            Back to Dashboard
          </Button>
        </Card>
      </div>
    </>
  );
};

export default Reschedule;
