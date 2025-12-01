import { member } from "../model/model.js";

export const createMember = async (req, res, next) => {
  try {
    // Get photo path if uploaded, otherwise use default
    let photoPath = req.file
      ? `/uploads/${req.file.filename}`
      : "/uploads/default-avatar.png";

    // Create new member with form data + photo path
    let result = await member.create({
      ...req.body,
      photo: photoPath,
    });

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const readAllMembers = async (req, res, next) => {
  try {
    const today = new Date();
    const deleteBefore = new Date();
    deleteBefore.setDate(today.getDate() - 3);

    await member.deleteMany({ endDate: { $lt: deleteBefore } });

    let result = await member.find({});
    res.status(200).json({
      success: true,
      message: "All Members",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      messsag: error.message,
    });
  }
};

export const getNewMembers = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const newMembers = await member.find({
      startDate: { $gte: startOfMonth, $lte: endOfMonth },
    });

    res.status(200).json({
      success: true,
      count: newMembers.length,
      data: newMembers,
    });
  } catch (error) {
    console.error("Error fetching new members:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching new members",
    });
  }
};

export const getExpiringMembers = async (req, res) => {
  try {
    const today = new Date();
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1); // add 1 month

    console.log("Today:", today);
    console.log("One month later:", oneMonthLater);

    // Find members whose membership ends within the next 1 month
    const expiringMembers = await member
      .find({
        endDate: {
          $gte: today, // endDate is today or later
          $lte: oneMonthLater, // and within 1 month
        },
      })
      .sort({ endDate: 1 }); // sort by soonest expiring first

    res.status(200).json({
      success: true,
      count: expiringMembers.length,
      data: expiringMembers,
    });
  } catch (error) {
    console.error("Error fetching expiring members:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getExpiredMembers = async (req, res) => {
  try {
    const today = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(today.getDate() - 3); // expired within last 3 days

    const expiredMembers = await member
      .find({
        endDate: { $lt: today, $gte: threeDaysAgo },
      })
      .sort({ endDate: -1 });

    res.status(200).json({ success: true, data: expiredMembers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const renewMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { months } = req.body;

    const today = new Date();
    const newEndDate = new Date(today);
    newEndDate.setMonth(today.getMonth() + months);

    const updatedMember = await member.findByIdAndUpdate(
      id,
      { startDate: today, endDate: newEndDate },
      { new: true }
    );

    if (!updatedMember)
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });

    res.status(200).json({
      success: true,
      message: "Membership renewed",
      member: updatedMember,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const revenue = async (req, res) => {
  try {
    const members = await member.find({});
    const totalRevenue = members.reduce((sum, mem) => sum + mem.amountPaid, 0);

    res.status(200).json({
      success: true,
      message: "Total Revenue",
      data: totalRevenue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 📊 Revenue Chart (Monthly)
export const revenueChart = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year}-12-31`);

    const members = await member.find({
      createdAt: { $gte: start, $lte: end },
    });

    // Initialize 12 months with 0 revenue
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const revenueData = months.map((month) => ({ month, revenue: 0 }));

    // Sum revenue per month
    members.forEach((mem) => {
      const monthIndex = mem.createdAt.getMonth();
      revenueData[monthIndex].revenue += mem.amountPaid;
    });

    res.status(200).json({ success: true, data: revenueData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMembersByClass = async (req, res) => {
  try {
    const classType = req.params.classType; // Gym, Cardio, Zumba
    const members = await member.find({ classType }); // use correct field name
    res.status(200).json(members); // <-- send array directly
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMemberGrowth = async (req, res) => {
  try {
    // Get year from query ?year=2025
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startDate = new Date(year, 0, 1); // Jan 1
    const endDate = new Date(year, 11, 31, 23, 59, 59); // Dec 31

    const data = await member.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Initialize 12 months with 0
    const result = months.map((m) => ({
      month: m,
      members: 0,
    }));

    // Fill actual data
    data.forEach((item) => {
      const index = item._id - 1;
      result[index].members = item.count;
    });

    res.json({
      success: true,
      year,
      data: result,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
