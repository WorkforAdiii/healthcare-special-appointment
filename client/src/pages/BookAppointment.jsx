import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { Card, DatePicker, Select, Button, message, Typography, Alert } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;
const allowedDays = [2, 3, 5];
const timeSlots = ["09:00-10:00", "10:00-11:00", "11:00-12:00"];

const BookAppointment = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState("09:00-10:00");
  const [loading, setLoading] = useState(false);
  const [allAppointments, setAllAppointments] = useState([]);
  const [userAppointments, setUserAppointments] = useState([]);
  const [hasExistingAppointment, setHasExistingAppointment] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    fetchAllAppointments();
    checkUserAppointments();
  }, []);

  const checkUserAppointments = async () => {
    if (!auth.currentUser) return;

    try {
      const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";
      const token = await auth.currentUser.getIdToken();

      const response = await fetch(`${API_BASE}/api/my-appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setUserAppointments(data);
          setHasExistingAppointment(true);
        }
      }
    } catch (error) {
      console.error("Error checking user appointments:", error);
    }
  };

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
      console.error("Error fetching appointments:", error);
    }
  };

  const fullyBookedDates = useMemo(() => {
    const dateSlotMap = {};
    
    allAppointments.forEach((apt) => {
      if (!dateSlotMap[apt.date]) {
        dateSlotMap[apt.date] = new Set();
      }
      dateSlotMap[apt.date].add(apt.timeSlot);
    });

    const fullyBooked = [];
    Object.keys(dateSlotMap).forEach((dateStr) => {
      if (dateSlotMap[dateStr].size === 3) {
        fullyBooked.push(dateStr);
      }
    });

    return fullyBooked;
  }, [allAppointments]);

  const fullyBookedDatesWithCascading = useMemo(() => {
    const allDates = new Set(fullyBookedDates);
    
    fullyBookedDates.forEach((dateStr) => {
      const baseDate = new Date(dateStr);
      
      const date14 = new Date(baseDate);
      date14.setDate(date14.getDate() + 14);
      while (!allowedDays.includes(date14.getDay())) {
        date14.setDate(date14.getDate() + 1);
      }
      allDates.add(date14.toDateString());
      
      const date28 = new Date(baseDate);
      date28.setDate(date28.getDate() + 28);
      while (!allowedDays.includes(date28.getDay())) {
        date28.setDate(date28.getDate() + 1);
      }
      allDates.add(date28.toDateString());
    });

    return Array.from(allDates);
  }, [fullyBookedDates]);

  const handleBooking = async () => {
    if (!auth.currentUser) return message.error("Please login first");
    if (!date) return message.warning("Please select a starting date");

    if (hasExistingAppointment || userAppointments.length > 0) {
      message.warning("You already have an appointment! Please cancel your existing appointment first or go to your dashboard.");
      return;
    }

    setLoading(true);

    try {
      const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";
      const token = await auth.currentUser.getIdToken();

      const formattedDate = dayjs(date).format("YYYY-MM-DD");

      const response = await fetch(`${API_BASE}/api/book-appointment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selectedDate: formattedDate,
          timeSlot,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        message.success(result.message);
        navigate("/dashboard");
      } else {
        message.error(result.error || "Booking failed");
      }
    } catch (error) {
      console.error("Booking Error:", error);
      message.error("Server connection failed. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Navbar />

      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #1677FF 0%, #004AAD 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <Card
          style={{
            width: 420,
            borderRadius: 20,
            boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
          }}
          title={
            <span style={{ color: "#1677FF", fontSize: 22, fontWeight: 800 }}>
              Book Special Treatment
            </span>
          }
        >
          {hasExistingAppointment && (
            <Alert
              message="You already have an appointment"
              description="You cannot book multiple appointments. Please cancel your existing appointment first or visit your dashboard to manage your current appointment."
              type="warning"
              showIcon
              style={{ marginBottom: 20 }}
              action={
                <Button
                  size="small"
                  type="primary"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </Button>
              }
            />
          )}

          <div style={{ marginBottom: 20 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Select Starting Date
            </Text>
            <DatePicker
              style={{ width: "100%", height: 45 }}
              format="DD MMM YYYY"
              disabledDate={(current) => {
                if (!current) return false;
                const isPast = current < dayjs().startOf("day");
                const isAllowed = allowedDays.includes(current.day());
                const dateStr = current.toDate().toDateString();
                const isFullyBooked = fullyBookedDatesWithCascading.includes(dateStr);
                return isPast || !isAllowed || isFullyBooked;
              }}
              onChange={(d) => setDate(d)}
              cellRender={(current) => {
                if (!current) return null;
                const dateStr = current.toDate().toDateString();
                const isFullyBooked = fullyBookedDatesWithCascading.includes(dateStr);
                const isAllowed = allowedDays.includes(current.day());
                const isPast = current < dayjs().startOf("day");

                let bg = "transparent";
                let color = "#444";
                let weight = 500;

                if (isFullyBooked) {
                  bg = "#ff4d4f";
                  color = "#fff";
                  weight = 700;
                } else if (isAllowed && !isPast) {
                  bg = "#e6f2ff";
                  color = "#1677FF";
                  weight = 600;
                }

                return (
                  <div
                    title={isFullyBooked ? "All slots booked on this date" : ""}
                    style={{
                      width: 25,
                      height: 25,
                      borderRadius: "50%",
                      margin: "auto",
                      lineHeight: "25px",
                      fontWeight: weight,
                      background: bg,
                      color: color,
                      border: isFullyBooked ? "2px solid #cf1322" : "none",
                    }}
                  >
                    {current.date()}
                  </div>
                );
              }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              * Only Tue, Wed & Fri available. Dates in red indicate all slots are booked.
            </Text>
          </div>

          <div style={{ marginBottom: 30 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Preferred Time Slot
            </Text>
            <Select
              style={{ width: "100%", height: 45 }}
              value={timeSlot}
              onChange={setTimeSlot}
            >
              <Select.Option value="09:00-10:00">09:00–10:00</Select.Option>
              <Select.Option value="10:00-11:00">10:00–11:00</Select.Option>
              <Select.Option value="11:00-12:00">11:00–12:00</Select.Option>
            </Select>
          </div>

          <Button
            type="primary"
            block
            size="large"
            loading={loading}
            onClick={handleBooking}
            disabled={hasExistingAppointment}
            style={{ height: 50, borderRadius: 10, fontWeight: 700 }}
          >
            Confirm 3-Session Plan
          </Button>

          <Text
            type="secondary"
            style={{ display: "block", textAlign: "center", marginTop: 15 }}
          >
            All sessions are processed securely via Node.js backend.
          </Text>
        </Card>
      </div>
    </div>
  );
};

export default BookAppointment;
