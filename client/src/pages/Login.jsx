import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { Input, Button, Card, message, Form, Typography } from "antd";
import { FaSignInAlt } from "react-icons/fa";
import { MailOutlined, LockOutlined } from "@ant-design/icons";

const { Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // FORCE NO SCROLL: Ensures consistent UI with Dashboard and Register
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Satisfies Requirement 1: Secure system for patient login
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success("Login Successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Login Error:", error.code);
      // Edge Case: Differentiating between wrong password and missing user
      if (error.code === "auth/user-not-found") {
        message.error("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        message.error("Incorrect password. Please try again.");
      } else if (error.code === "auth/too-many-requests") {
        message.error("Too many failed attempts. Account temporarily locked.");
      } else {
        message.error("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        background: "linear-gradient(135deg, #1677FF 0%, #72C2FF 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        overflow: "hidden",
      }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: "15px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 25 }}>
          <FaSignInAlt style={{ fontSize: "40px", color: "#1677FF" }} />
          <h2 style={{ marginTop: 10, fontWeight: 800, fontSize: "24px" }}>
            Welcome Back
          </h2>
          <Text type="secondary">
            Enter your credentials to access CareSync
          </Text>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          autoComplete="off"
        >
          {/* Email validation: required, valid format, not empty spaces */}
          <Form.Item
            label={<Text strong>Email</Text>}
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Please enter a valid email format" },
              { whitespace: true, message: "Email cannot be only spaces" },
              {
                validator: (_, value) => {
                  if (value && value.trim().length === 0) {
                    return Promise.reject(new Error("Email cannot be empty"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              placeholder="example@mail.com"
              size="large"
              allowClear
            />
          </Form.Item>

          {/* Password validation: required, minimum 6 characters, not empty spaces */}
          <Form.Item
            label={<Text strong>Password</Text>}
            name="password"
            rules={[
              { required: true, message: "Password is required" },
              { min: 6, message: "Password must be at least 6 characters" },
              { whitespace: true, message: "Password cannot be only spaces" },
              {
                validator: (_, value) => {
                  if (value && value.trim().length === 0) {
                    return Promise.reject(
                      new Error("Password cannot be empty")
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              placeholder="Enter your password (min 6 characters)"
              size="large"
            />
          </Form.Item>

          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <Text
              style={{
                color: "#1677FF",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </Text>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              style={{ fontWeight: 700, borderRadius: "8px", height: "45px" }}
            >
              Login
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Text>
            Don't have an account?{" "}
            <Text
              strong
              style={{ color: "#1677FF", cursor: "pointer" }}
              onClick={() => navigate("/register")}
            >
              Register Now
            </Text>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
