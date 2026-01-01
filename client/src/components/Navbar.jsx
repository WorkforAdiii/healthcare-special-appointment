import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Dropdown, Button, Space, Typography, Avatar } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const Navbar = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Priority 1: Use the name from the Auth Profile
        if (currentUser.displayName) {
          setUserName(currentUser.displayName);
        } else {
          // Priority 2: Backup - Fetch from Firestore if Auth name isn't ready
          try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
              setUserName(userDoc.data().name);
            }
          } catch (err) {
            console.error("Error fetching name:", err);
          }
        }
      }
      setInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const menuItems = {
    items: [
      {
        key: "dash",
        label: "Dashboard",
        icon: <DashboardOutlined />,
        onClick: () => navigate("/dashboard"),
      },
      {
        key: "book",
        label: "Book Appointment",
        icon: <CalendarOutlined />,
        onClick: () => navigate("/book"),
      },
      { type: "divider" },
      {
        key: "out",
        label: "Logout",
        icon: <LogoutOutlined />,
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  if (initializing)
    return <div style={{ height: "70px", background: "#1677FF" }} />;

  return (
    <div style={styles.nav}>
      {/* Left Side: Brand */}
      <div onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
        <h2 style={styles.logo}>CareSync</h2>
        <Text style={styles.tagline}>Tomorrow’s Healthcare, Today</Text>
      </div>

      {/* Right Side: Profile Symbol and Name */}
      <Dropdown menu={menuItems} placement="bottomRight" trigger={["hover"]}>
        <Button type="text" style={styles.userBtn}>
          <Space size={10}>
            {/* The Profile Pic Symbol */}
            <Avatar
              size="small"
              icon={<UserOutlined />}
              style={{ backgroundColor: "#fff", color: "#1677FF" }}
            />
            {/* The Registered Name */}
            <Text style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>
              {userName || "User"}
            </Text>
          </Space>
        </Button>
      </Dropdown>
    </div>
  );
};

const styles = {
  nav: {
    width: "100%",
    background: "#1677FF",
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 40px",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  logo: {
    margin: 0,
    fontWeight: 900,
    fontSize: "24px",
    color: "#fff",
    lineHeight: 1,
  },
  tagline: {
    fontSize: "10px",
    color: "#E6F4FF",
    letterSpacing: "0.5px",
  },
  userBtn: {
    height: "auto",
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
  },
};

export default Navbar;
