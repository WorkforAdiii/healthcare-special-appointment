import { Timestamp } from "firebase-admin/firestore";

// Allowed days: Tue(2), Wed(3), Fri(5)
const allowedWeekDays = [2, 3, 5];

export const toIST = (date) => {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};

export const getNextAllowedDay = (date) => {
  let newDate = new Date(date);

  while (!allowedWeekDays.includes(newDate.getDay())) {
    newDate.setDate(newDate.getDate() + 1);
  }

  return newDate;
};

export const generateFollowUps = (firstDate, timeSlot) => {
  const followUps = [];

  let sessionDate = new Date(firstDate);

  for (let i = 0; i < 2; i++) {
    sessionDate.setDate(sessionDate.getDate() + 14); // +2 weeks
    sessionDate = getNextAllowedDay(sessionDate);

    followUps.push({
      timestamp: Timestamp.fromDate(new Date(sessionDate)),
      timeSlot,
    });
  }

  return followUps;
};
