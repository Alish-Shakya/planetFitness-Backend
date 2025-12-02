import express from "express";
import connectDB from "./src/connectDB/connectDB.js";
import webUserRouter from "./src/route/webUserRouter.js";
import cors from "cors";
import memberRoute from "./src/route/memberRouter.js";

import cron from "node-cron";
import { member } from "./src/model/model.js";
import dayjs from "dayjs";

const app = express();
const port = 8000;

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(cors());

connectDB();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.use("/webUser", webUserRouter);
app.use("/member", memberRoute);

// AUTO DELETE
cron.schedule("*/1 * * * *", async () => {
  // every minute
  console.log("CRON JOB STARTED...");

  try {
    const today = dayjs();
    const all = await member.find();

    for (const m of all) {
      const expiredDays = today.diff(dayjs(m.endDate), "day");
      console.log(m.fullName, "expiredDays:", expiredDays); // debug log

      if (expiredDays > 3) {
        console.log("DELETING:", m.fullName);
        await member.findByIdAndDelete(m._id);
      }
    }

    console.log("CRON JOB FINISHED...");
  } catch (err) {
    console.error("CRON ERROR:", err);
  }
});
