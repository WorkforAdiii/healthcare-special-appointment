import React, { useState } from "react";
import { Card, Input, Button, message } from "antd";
import {
  MailOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import { FaKey } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";

  const validatePassword = (password) => {
    const strongRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  };

  const handleSendOtp = async () => {
    if (!email) return message.error("Enter your email!");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }
      message.success("OTP Sent! Check your email.");
      setStep(2);
    } catch (error) {
      console.error("OTP Send Error:", error);
      message.error(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return message.error("Enter OTP");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResetToken(data.resetToken);
      message.success("OTP verified!");
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!validatePassword(newPassword))
      return message.error(
        "Password must be Min 8 chars, include Uppercase, Number, Special Character!"
      );

    if (newPassword !== confirmPass)
      return message.error("Passwords do not match!");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/update-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword, resetToken }),
      });

      if (!res.ok) throw new Error("Update failed");
      message.success("Password updated! Login again");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1677FF 0%, #72C2FF 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background elements */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-30px",
          left: "-30px",
          width: "150px",
          height: "150px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.08)",
        }}
      />

      <Card
        style={{
          width: 480,
          padding: 40,
          borderRadius: 20,
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div
            style={{
              display: "inline-block",
              padding: 20,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1677FF 0%, #72C2FF 100%)",
              marginBottom: 15,
            }}
          >
            <FaKey style={{ fontSize: 50, color: "#fff" }} />
          </div>
          <h2 style={{ margin: 0, color: "#1677FF", fontSize: 28, fontWeight: 700 }}>
            Reset Password
          </h2>
          <p style={{ color: "#666", marginTop: 8, fontSize: 14 }}>
            {step === 1 && "Enter your email to receive a verification code"}
            {step === 2 && "Enter the 6-digit code sent to your email"}
            {step === 3 && "Create a new secure password"}
          </p>
        </div>

        {step === 1 && (
          <>
            <Input
              placeholder="Enter your email"
              prefix={<MailOutlined />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginBottom: 20, height: 40 }}
            />
            <Button
              block
              type="primary"
              loading={loading}
              onClick={handleSendOtp}
            >
              Send OTP
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div
              style={{
                background: "#E6F2FF",
                padding: 15,
                borderRadius: 10,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0, color: "#1677FF", fontSize: 14 }}>
                📧 OTP sent to <strong>{email}</strong>
              </p>
              <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: 12 }}>
                Check your inbox and spam folder
              </p>
            </div>
            <Input
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              style={{ marginBottom: 20, height: 45, fontSize: 18, textAlign: "center", letterSpacing: 8 }}
            />
            <Button
              block
              type="primary"
              loading={loading}
              onClick={handleVerifyOtp}
              style={{ height: 45, fontSize: 16, fontWeight: 600 }}
            >
              Verify OTP
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ marginBottom: 15 }}>
              <Input.Password
                placeholder="New Password"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ height: 45 }}
              />
              <p style={{ fontSize: 11, color: "#999", marginTop: 5, marginBottom: 0 }}>
                Must include: 8+ chars, Uppercase, Number, Special char
              </p>
            </div>

            <Input.Password
              placeholder="Confirm Password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              style={{ marginBottom: 20, height: 45 }}
            />

            <Button
              block
              type="primary"
              loading={loading}
              onClick={handleUpdatePassword}
              style={{ height: 45, fontSize: 16, fontWeight: 600 }}
            >
              Update Password
            </Button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 15 }}>
          <span
            style={{ cursor: "pointer", color: "#1677FF" }}
            onClick={() => navigate("/login")}
          >
            Back to Login
          </span>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
