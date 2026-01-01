import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { Card, Form, Input, Button, message, Typography } from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 1. Create User
      const { user } = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      // 2. Update Auth Profile (Name Only)
      await updateProfile(user, {
        displayName: values.fullname,
      });

      // 3. Save to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: values.fullname,
        email: values.email,
        phone: values.phone || "",
        age: values.age || "",
        createdAt: new Date(),
      });

      message.success("Registration Successful!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration Failed:", err);
      // Handle Firebase specific error edge cases (e.g., email already in use)
      if (err.code === "auth/email-already-in-use") {
        message.error("This email is already registered.");
      } else {
        message.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <Card style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: 25 }}>
          <Title level={2} style={{ color: "#1677FF", margin: 0 }}>
            Create Account
          </Title>
          <Text type="secondary">Join us today!</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          {/* Full Name validation: required, letters only, min 2 chars */}
          <Form.Item
            name="fullname"
            rules={[
              { required: true, message: "Full name is required" },
              { whitespace: true, message: "Name cannot be only spaces" },
              { min: 2, message: "Name must be at least 2 characters" },
              { max: 50, message: "Name cannot exceed 50 characters" },
              {
                pattern: /^[a-zA-Z\s]*$/,
                message: "Name can only contain letters and spaces",
              },
              {
                validator: (_, value) => {
                  if (value && value.trim().length === 0) {
                    return Promise.reject(new Error("Name cannot be empty"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              size="large"
              placeholder="Full Name"
              prefix={<UserOutlined />}
              allowClear
            />
          </Form.Item>

          {/* Email validation: required, valid format, not empty spaces */}
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Please enter a valid email address" },
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
              size="large"
              placeholder="Email"
              prefix={<MailOutlined />}
              allowClear
            />
          </Form.Item>

          {/* Password validation: required, min 6 chars, max 20 chars */}
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Password is required" },
              { min: 6, message: "Password must be at least 6 characters" },
              { max: 20, message: "Password cannot exceed 20 characters" },
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
              size="large"
              placeholder="Password (6-20 characters)"
              prefix={<LockOutlined />}
            />
          </Form.Item>

          <div style={{ display: "flex", gap: "10px" }}>
            {/* Phone validation: required, exactly 10 digits */}
            <Form.Item
              name="phone"
              style={{ flex: 2 }}
              rules={[
                { required: true, message: "Phone is required" },
                {
                  pattern: /^\d{10}$/,
                  message: "Phone must be exactly 10 digits",
                },
                {
                  validator: (_, value) => {
                    if (value && value.toString().trim().length === 0) {
                      return Promise.reject(new Error("Phone cannot be empty"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                size="large"
                placeholder="Phone Number (10 digits)"
                prefix={<PhoneOutlined />}
                maxLength={10}
                allowClear
              />
            </Form.Item>

            {/* Age validation: required, between 1-120 */}
            <Form.Item
              name="age"
              style={{ flex: 1 }}
              rules={[
                { required: true, message: "Age is required" },
                {
                  validator: (_, value) => {
                    if (!value) {
                      return Promise.reject(new Error("Age required"));
                    }
                    const ageNum = parseInt(value);
                    if (ageNum > 0 && ageNum <= 120) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Age must be 1-120"));
                  },
                },
              ]}
            >
              <Input
                size="large"
                placeholder="Age (1-120)"
                type="number"
                min="1"
                max="120"
              />
            </Form.Item>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
          >
            Register
          </Button>
        </Form>

        <p style={{ textAlign: "center", marginTop: 20 }}>
          Already have an account?{" "}
          <a
            onClick={() => navigate("/login")}
            style={{ color: "#1677FF", cursor: "pointer" }}
          >
            Login
          </a>
        </p>
      </Card>
    </div>
  );
};

const styles = {
  wrapper: {
    height: "100vh",
    background: "linear-gradient(135deg, #1677FF 0%, #72C2FF 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  card: {
    width: 420,
    borderRadius: 15,
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  },
};

export default Register;
