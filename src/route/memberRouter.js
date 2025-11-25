// routes/memberRoute.js
import express from "express";
import multer from "multer";
import {
  createMember,
  getExpiringMembers,
  getMemberGrowth,
  getMembersByClass,
  getNewMembers,
  readAllMembers,
  revenue,
  revenueChart,
} from "../controller/memberController.js";

const memberRoute = express.Router();

// 🧩 Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // make sure 'uploads' folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // unique filename
  },
});

const upload = multer({ storage });

memberRoute.post("/add-member", upload.single("photo"), createMember);

memberRoute.get("/all-members", readAllMembers);

memberRoute.get("/new-member", getNewMembers);

memberRoute.get("/expiring-members", getExpiringMembers);

memberRoute.get("/revenue", revenue);

memberRoute.get("/revenue-chart", revenueChart);

memberRoute.get("/classes/:classType", getMembersByClass);

memberRoute.get("/member-growth", getMemberGrowth);

export default memberRoute;
