import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());

// Create transporter using Gmail SMTP and the provided App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mailsuhas.madhu@gmail.com", // Assuming this is also the sender
    pass: "gyqf oahv mfrx rqor",
  },
});

app.post("/api/sos-email", async (req, res) => {
  const { message, location } = req.body;

  const mailOptions = {
    from: "mailsuhas.madhu@gmail.com",
    to: "mailsuhas.madhu@gmail.com", // Default recipient
    subject: "URGENT: SOS Alert Triggered from Guardian Companion!",
    text: `🚨 URGENT SOS ALERT 🚨\n\n${
      message || "The emergency SOS button was pressed by the user."
    }\nLocation: ${location || "Unknown location"}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("SOS email sent successfully.");
    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SOS Email backend running on http://localhost:${PORT}`);
});
