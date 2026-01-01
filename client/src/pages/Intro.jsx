import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import {
  FaHospitalUser,
  FaRegCalendarCheck,
  FaUserShield,
  FaClock,
  FaHeartbeat,
  FaUsers,
  FaClipboardCheck,
  FaThumbsUp,
} from "react-icons/fa";

const Intro = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";

    return () => {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
    };
  }, []);

  return (
    <div style={{ width: "100%", overflowX: "hidden", background: "#fff" }}>
      {/* Brand Header */}
      <div
        style={{
          position: "absolute",
          top: "15px",
          left: "30px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "white",
          zIndex: 99,
        }}
      >
        <FaHospitalUser style={{ fontSize: "28px" }} />
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>
            CareSync
          </h2>
          <p style={{ margin: 0, fontSize: "13px", opacity: "0.85" }}>
            Tomorrow’s Healthcare, Today
          </p>
        </div>
      </div>

      {/* Hero Section - Reduced minHeight and Padding */}
      <div
        style={{
          minHeight: "65vh",
          width: "100%",
          background: "linear-gradient(135deg, #1677FF 0%, #72C2FF 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 20px 40px 20px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(26px, 4.5vw, 38px)",
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          HealthCare Appointment <br /> Scheduling System
        </h1>

        <p
          style={{
            fontSize: "17px",
            maxWidth: "650px",
            marginBottom: "20px",
            lineHeight: "1.4",
          }}
        >
          Smart and stress-free appointment booking — designed for continuous
          patient care.
        </p>

        <div
          style={{
            display: "flex",
            gap: "15px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Button
            type="primary"
            size="large"
            style={{ width: "160px", fontWeight: 700, height: "42px" }}
            onClick={() => navigate("/register")}
          >
            Register
          </Button>
          <Button
            size="large"
            style={{ width: "160px", fontWeight: 700, height: "42px" }}
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        </div>
      </div>

      {/* About Us - Reduced Padding */}
      <section
        style={{
          background: "#ffffff",
          padding: "50px 20px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1677FF",
            marginBottom: "15px",
          }}
        >
          About Us
        </h2>
        <p
          style={{
            maxWidth: "850px",
            margin: "auto",
            fontSize: "17px",
            lineHeight: "1.6",
            color: "#444",
          }}
        >
          We simplify recurring healthcare appointments by assisting patients
          through well-structured treatment schedules. Our mission is to prevent
          delays, improve continuity of care, and help hospitals deliver better
          patient experiences.
        </p>
      </section>

      {/* Why Choose Us - Reduced Padding and Card Gaps */}
      <section
        style={{
          background: "#F8FAFF",
          padding: "50px 20px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1677FF",
            marginBottom: "30px",
          }}
        >
          Why Choose Us?
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          {[
            {
              icon: <FaRegCalendarCheck />,
              text: "Automated 3-session Scheduling",
            },
            {
              icon: <FaClock />,
              text: "Rescheduling with Adjusted Follow-ups",
            },
            {
              icon: <FaUserShield />,
              text: "Secure Login & Protected Health Data",
            },
            {
              icon: <FaHeartbeat />,
              text: "Patient-first Healthcare Technology",
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                width: "240px",
                background: "#ffffff",
                padding: "25px",
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "38px", color: "#1677FF" }}>
                {item.icon}
              </div>
              <p
                style={{
                  marginTop: "12px",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#333",
                  lineHeight: "1.3",
                }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials - Reduced Padding */}
      <section
        style={{
          background: "#1677FF",
          color: "white",
          padding: "50px 20px",
          textAlign: "center",
        }}
      >
        <h2
          style={{ fontSize: "28px", fontWeight: "700", marginBottom: "20px" }}
        >
          Patient Experience
        </h2>
        <p
          style={{
            maxWidth: "750px",
            margin: "auto",
            fontSize: "18px",
            fontStyle: "italic",
            lineHeight: "1.5",
          }}
        >
          “The automated follow-up scheduling helped me stay consistent with my
          treatment plan. Hospital staff found it easy to manage too!”
          <br />
          <br />
          <span
            style={{ fontStyle: "normal", fontWeight: 700, fontSize: "16px" }}
          >
            — Patient Review ⭐⭐⭐⭐
          </span>
        </p>
      </section>

      {/* Impact - Reduced Padding and Card Dimensions */}
      <section
        style={{
          padding: "50px 20px",
          background: "#ffffff",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1677FF",
            marginBottom: "30px",
          }}
        >
          Our Impact
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          {[
            { icon: <FaUsers />, value: "20+", label: "Patients Helped" },
            {
              icon: <FaClipboardCheck />,
              value: "50+",
              label: "Appointments Managed",
            },
            { icon: <FaThumbsUp />, value: "100%", label: "Satisfaction Rate" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                width: "250px",
                background: "#F8FAFF",
                padding: "25px",
                borderRadius: "12px",
                border: "1px solid #E6F0FF",
              }}
            >
              <div style={{ fontSize: "38px", color: "#1677FF" }}>
                {item.icon}
              </div>
              <h3
                style={{
                  fontSize: "32px",
                  fontWeight: 900,
                  margin: "8px 0",
                  color: "#1677FF",
                }}
              >
                {item.value}
              </h3>
              <p style={{ fontSize: "16px", color: "#555" }}>{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer - More compact */}
      <footer
        style={{
          background: "#fff",
          padding: "20px 0",
          textAlign: "center",
          borderTop: "1px solid #eee",
        }}
      >
        <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
          © {new Date().getFullYear()} CareSync. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default Intro;
