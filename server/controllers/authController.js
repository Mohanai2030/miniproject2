import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.ts";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (student_id) => {
  const accessToken = jwt.sign(
    { student_id },
    process.env.JWT_SECRET || "access_secret",
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { student_id },
    process.env.JWT_REFRESH_SECRET || "refresh_secret",
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

export const signup = async (req, res) => {
  const { idToken, college_id, phone, gender, year, hostel, fcm_token, fcmToken } = req.body;
  console.log("varatta maame dur")
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    const college = await prisma.college.findUnique({
      where: { college_id: parseInt(college_id) },
    });

    if (!college) {
      return res.status(400).json({ error: "College not found" });
    }

    if (college.name.toLowerCase() !== "testing" && !email.endsWith(college.domain_name)) {
      return res.status(400).json({ error: "Email domain does not match college domain" });
    }

    const existingStudent = await prisma.student.findUnique({
      where: { email },
    });

    if (existingStudent) {
      return res.status(400).json({ error: "Student already exists" });
    }

    const student = await prisma.student.create({
      data: {
        email,
        name,
        gender: gender || "MALE", // Simplified
        year: year || "1",
        hostel: hostel || "None",
        phone: phone || "",
        fcm_token: fcm_token || fcmToken || null,
        college_id: college.college_id,
      },
    });

    const { accessToken, refreshToken } = generateTokens(student.student_id);

    await prisma.studentRefreshToken.create({
      data: {
        student_id: student.student_id,
        refresh_token: refreshToken,
      },
    });

    res.json({ accessToken, refreshToken, user: student });
  } catch (error) {
    console.log("error", error)
    console.error("Signup error:", error);
    res.status(500).json({ error: "Signup failed" });
  }
};

export const login = async (req, res) => {
  const { idToken, fcm_token, fcmToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    let student = await prisma.student.findUnique({
      where: { email },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found. Please signup." });
    }

    const tokenToSave = fcm_token || fcmToken;
    if (tokenToSave && typeof tokenToSave === "string") {
      student = await prisma.student.update({
        where: { student_id: student.student_id },
        data: { fcm_token: tokenToSave },
      });
    }

    const { accessToken, refreshToken } = generateTokens(student.student_id);

    // Upsert or update refresh token
    const existingToken = await prisma.studentRefreshToken.findUnique({
      where: { student_id: student.student_id },
    });

    if (existingToken) {
      await prisma.studentRefreshToken.update({
        where: { student_id: student.student_id },
        data: { refresh_token: refreshToken },
      });
    } else {
      await prisma.studentRefreshToken.create({
        data: {
          student_id: student.student_id,
          refresh_token: refreshToken,
        },
      });
    }

    res.json({ accessToken, refreshToken, user: student });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

export const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "refresh_secret");

    const tokenRecord = await prisma.studentRefreshToken.findUnique({
      where: { refresh_token: refreshToken },
    });

    if (!tokenRecord) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(decoded.student_id);

    await prisma.studentRefreshToken.update({
      where: { id: tokenRecord.id },
      data: { refresh_token: newRefreshToken },
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

export const logout = async (req, res) => {
  const student_id = req.user.student_id;
  try {
    await prisma.studentRefreshToken.deleteMany({
      where: { student_id },
    });
    res.json({ message: "Logged out" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

export const updateFcmToken = async (req, res) => {
  const student_id = req.user?.student_id || req.body?.student_id;
  const fcm_token = req.body?.fcm_token || req.body?.fcmToken || req.body?.token;

  if (!student_id) {
    return res.status(401).json({ error: "Unauthorized: student_id missing" });
  }

  if (!fcm_token || typeof fcm_token !== "string") {
    return res.status(400).json({ error: "fcm_token is required and must be a string" });
  }

  try {
    const updatedStudent = await prisma.student.update({
      where: { student_id: parseInt(student_id) },
      data: { fcm_token },
      select: {
        student_id: true,
        email: true,
        name: true,
        fcm_token: true,
      },
    });

    res.status(200).json({
      message: "FCM token updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    res.status(500).json({ error: "Failed to update FCM token" });
  }
};

