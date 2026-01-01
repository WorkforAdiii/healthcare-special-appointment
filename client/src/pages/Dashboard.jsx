import React, { useEffect, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Button, Progress, message } from "antd";
import dayjs from "dayjs";
import "../styles/animations.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) navigate("/login");
      else fetchAppointments(user);
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchAppointments = async (user) => {
    try {
      const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";
      const token = await user.getIdToken();

      const response = await fetch(`${API_BASE}/api/my-appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Invalid JSON response");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setAppointments(data);
      } else {
        console.warn("Unexpected response shape:", data);
        setAppointments([]);
      }
    } catch (error) {
      console.error("Fetch appointments error:", error);
      setAppointments([]);
    }
  };

  const convertTimestamp = (timestamp) => {
    if (typeof timestamp === "string") {
      return dayjs(timestamp);
    }
    if (timestamp?.seconds) {
      return dayjs(timestamp.seconds * 1000);
    }
    return dayjs(timestamp);
  };

  const getStatus = (timestamp) => {
    const date = convertTimestamp(timestamp).startOf("day");
    const today = dayjs().startOf("day");

    if (today.isAfter(date))
      return { label: "Completed", color: "green", locked: true };
    if (today.isSame(date))
      return { label: "Today", color: "#FFB300", locked: false };

    return { label: "Upcoming", color: "#1677FF", locked: false };
  };

  const handleCancelSession = async (appointmentId, sessionNumber) => {
    if (!window.confirm(`Cancel Session ${sessionNumber}?`)) return;

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";

      const res = await fetch(`${API_BASE}/api/cancel-appointment/${appointmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel session");
      }

      // Refresh appointments
      await fetchAppointments(user);
      message.success("Session cancelled successfully");
    } catch (err) {
      console.error("Cancel session error:", err);
      message.error(err.message || "Failed to cancel session");
    }
  };

  const handleCancelAll = async () => {
    if (!window.confirm("Cancel the entire treatment plan?")) return;

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";

      await fetch(`${API_BASE}/api/cancel-appointments`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setAppointments([]);
      message.success("All sessions cancelled successfully");
    } catch (err) {
      console.error("Cancel error:", err);
      message.error("Failed to cancel plan");
    }
  };

  const completed = appointments.filter(
    (a) => getStatus(a.timestamp).label === "Completed"
  ).length;

  const progress = Math.round((completed / 3) * 100);

  const nextIndex = appointments.findIndex(
    (a) => getStatus(a.timestamp).label !== "Completed"
  );

  return (
    <>
      <Navbar />

      <div
        style={{
          minHeight: "calc(100vh - 65px)",
          padding: "40px 20px",
          background: "#F4F9FF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Header & Progress */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#1677FF" }}>
            Your Treatment Plan
          </h2>
          <Progress
            percent={progress}
            status="active"
            format={() => `${completed}/3 Completed`}
            strokeColor="#1677FF"
            style={{ width: 300 }}
          />
        </div>

        {/* No Appointments UI */}
        {appointments.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ fontSize: "18px", color: "#666", marginBottom: 30 }}>
              You don't have any appointments yet.
            </p>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate("/book")}
            >
              Book New Appointment
            </Button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "32px" }}>
            {appointments.map((appt, index) => {
              const dateObj = convertTimestamp(appt.timestamp);
              const formattedDate = dateObj.format("DD MMM YYYY");
              const dayOfWeek = dateObj.format("dddd");
              const { label, color, locked } = getStatus(appt.timestamp);

              return (
                <div
                  key={appt.id}
                  className="fade-card"
                  style={{
                    width: 300,
                    padding: 26,
                    borderRadius: 15,
                    background: "#fff",
                    boxShadow:
                      index === nextIndex
                        ? "0 0 12px rgba(22,119,255,0.4)"
                        : "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  <h3 style={{ color: "#1677FF", fontWeight: 700 }}>
                    Session {appt.sessionNumber}
                  </h3>

                  <p style={{ fontSize: 16, fontWeight: 600 }}>
                    📅 {dayOfWeek}, {formattedDate}
                  </p>
                  <p>⏰ {appt.timeSlot}</p>

                  <span
                    style={{
                      marginTop: 10,
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: 14,
                      background: color,
                      color: "#fff",
                      display: "inline-block",
                    }}
                  >
                    {label}
                  </span>

                  {!locked && (
                    <>
                      <Button
                        style={{ width: "100%", marginTop: 15 }}
                        onClick={() =>
                          navigate(`/reschedule/${appt.sessionNumber}`)
                        }
                      >
                        Reschedule Session
                      </Button>
                      <Button
                        danger
                        style={{ width: "100%", marginTop: 10 }}
                        onClick={() => handleCancelSession(appt.id, appt.sessionNumber)}
                      >
                        Cancel Session
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {appointments.length > 0 && (
          <Button
            danger
            size="large"
            style={{ marginTop: 35 }}
            onClick={handleCancelAll}
          >
            Cancel Entire Plan
          </Button>
        )}
      </div>
    </>
  );
};

export default Dashboard;
