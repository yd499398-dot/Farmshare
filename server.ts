import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { marketplaceRouter } from "./src/server/marketplaceRouter";

// Automatically load local .env file if present
try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
  }
} catch {
  // Ignore if .env does not exist
}

interface CodeRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

const activeCodes = new Map<string, CodeRecord>();

// Initialize email transporter if valid credentials exist
function isLikelyEmail(str: string): boolean {
  return typeof str === 'string' && str.includes('@') && str.includes('.');
}

function isLikelyHost(str: string): boolean {
  return typeof str === 'string' && (str.includes('.') || str === 'localhost') && isNaN(Number(str));
}

function resolveEmailCredentials() {
  const candidatesUser = [
    process.env.GMAIL_USER,
    process.env.SMTP_USER,
    process.env.EMAIL_USER,
    "yd499398@gmail.com"
  ];
  const user = (candidatesUser.find(u => u && isLikelyEmail(u.trim())) || "yd499398@gmail.com").trim();

  const candidatesPass = [
    process.env.GMAIL_APP_PASS,
    process.env.SMTP_PASS,
    process.env.GMAIL_PASS,
    process.env.EMAIL_PASS,
    "uvju ngyz uges ckvy"
  ];
  const rawPass = (candidatesPass.find(p => p && p.trim().length >= 8) || "uvju ngyz uges ckvy").trim();
  const pass = rawPass.replace(/\s+/g, ''); // 16-character standard Gmail App Password format

  return { user, pass };
}

function createTransporter() {
  const host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || "").trim();
  const { user, pass } = resolveEmailCredentials();

  // Gmail SMTP service
  if (isLikelyEmail(user) && pass && pass.length >= 4) {
    console.log(`[FarmShare Auth] Configuring Gmail transporter for: ${user}`);
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Custom SMTP relay
  if (isLikelyHost(host) && user && pass && pass.length >= 4) {
    console.log(`[FarmShare Auth] Configuring custom SMTP transporter: ${host}`);
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return null;
}

let mailTransporter = createTransporter();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount Marketplace API router
  app.use("/api/marketplace", marketplaceRouter);

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // System & Database Diagnostic Status
  app.get("/api/system/status", (req, res) => {
    const { user } = resolveEmailCredentials();
    const hasActiveTransporter = !!(mailTransporter || createTransporter());
    res.json({
      status: "operational",
      server: {
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "development"
      },
      emailService: {
        provider: "Gmail SMTP",
        configuredUser: user,
        transporterActive: hasActiveTransporter,
        deliveryMode: "live_smtp"
      },
      database: {
        provider: "Google Cloud Firestore",
        databaseId: "ai-studio-farmshare-3cb9f439-5b2d-4d64-a1b9-1a6c31d3a03e",
        projectId: "infinite-palisade-ldpgw",
        collections: ["equipment", "rentals", "reviews", "saved", "verification_codes"],
        status: "connected"
      },
      activeOtpsInFlight: activeCodes.size
    });
  });

  // Verification Code Send Endpoint
  app.post("/api/auth/send-verification-code", async (req, res) => {
    try {
      const { email, name, purpose } = req.body || {};
      if (!email || typeof email !== "string") {
        return res.status(400).json({ success: false, error: "Valid email is required." });
      }

      const cleanEmail = email.trim().toLowerCase();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      activeCodes.set(cleanEmail, {
        code,
        expiresAt,
        attempts: 0
      });

      const isReset = purpose === 'reset';
      console.log(`[FarmShare Auth] 📧 ${isReset ? 'Password Reset' : 'Registration'} OTP generated for ${cleanEmail}: ${code}`);

      // Attempt sending actual email if transporter is available
      let emailDispatched = false;
      let smtpConfigured = false;
      const activeTransporter = mailTransporter || createTransporter();

      if (activeTransporter) {
        smtpConfigured = true;
        try {
          // Send real email with 12-second timeout
          const { user: senderEmail } = resolveEmailCredentials();
          const emailSubject = isReset 
            ? `${code} is your FarmShare password reset code`
            : `${code} is your FarmShare verification code`;
          const headingTitle = isReset ? "Password Reset" : "Email Verification";
          const subtitleText = isReset 
            ? "Authorize resetting your farmer account password" 
            : "Complete your farmer account registration";
          const bodyDescription = isReset
            ? `Hello ${name || 'Farmer'},<br/><br/>We received a request to reset your password for your FarmShare account. Enter this 6-digit code on FarmShare to verify your identity and set your new password.<br/><br/>If you did not request this, you can safely ignore this email.`
            : `Hello ${name || 'Farmer'},<br/><br/>Enter this 6-digit code on FarmShare to verify your email and complete setting up your account.`;

          await Promise.race([
            activeTransporter.sendMail({
              from: `"FarmShare Network" <${senderEmail}>`,
              to: cleanEmail,
              subject: emailSubject,
              text: `Your FarmShare ${isReset ? 'password reset' : 'verification'} code is ${code}. It expires in 10 minutes.`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 16px; background-color: #ffffff;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <div style="display: inline-block; background-color: #15803d; color: #ffffff; padding: 10px 18px; border-radius: 12px; font-weight: bold; font-size: 20px;">
                      🚜 FarmShare
                    </div>
                    <h2 style="color: #1c1917; margin-top: 14px; margin-bottom: 4px;">${headingTitle}</h2>
                    <p style="color: #78716c; font-size: 13px; margin: 0;">${subtitleText}</p>
                  </div>
                  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
                    <p style="color: #166534; font-size: 13px; margin-top: 0; margin-bottom: 8px; font-weight: 600;">Your 6-Digit ${isReset ? 'Password Reset' : 'Verification'} Code:</p>
                    <div style="font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #15803d; font-family: monospace;">
                      ${code}
                    </div>
                    <p style="color: #166534; font-size: 11px; margin-bottom: 0; margin-top: 10px;">Expires in 10 minutes</p>
                  </div>
                  <p style="color: #57534e; font-size: 13px; line-height: 1.5; margin: 0;">
                    ${bodyDescription}
                  </p>
                </div>
              `
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP delivery timeout (12000ms)")), 12000))
          ]);
          emailDispatched = true;
          console.log(`[FarmShare Auth] ✅ Email successfully dispatched to ${cleanEmail}`);
        } catch (mailErr: any) {
          console.warn(`[FarmShare Auth] ⚠️ Gmail SMTP authentication error:`, mailErr?.message || mailErr);
          emailDispatched = false;
        }
      } else {
        smtpConfigured = false;
        console.log(`[FarmShare Auth] ℹ️ Transporter not configured with valid email credentials. Code saved for verification.`);
      }

      return res.json({
        success: true,
        email: cleanEmail,
        emailDispatched,
        smtpConfigured,
        message: emailDispatched 
          ? `A 6-digit ${isReset ? 'password reset' : 'confirmation'} code has been dispatched to your Gmail inbox (${cleanEmail}). Please check your inbox and spam folder.`
          : `We could not deliver the email to (${cleanEmail}). Please check your email address or try again in a few moments.`
      });
    } catch (e: any) {
      console.error("Error generating verification code:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to generate code." });
    }
  });

  // Verification Code Validation Endpoint
  app.post("/api/auth/verify-code", (req, res) => {
    try {
      const { email, code } = req.body || {};
      if (!email || !code) {
        return res.status(400).json({ verified: false, error: "Email and code are required." });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const cleanCode = String(code).trim();
      const record = activeCodes.get(cleanEmail);

      if (!record) {
        return res.status(400).json({ verified: false, error: "No pending verification code found for this email. Please request a new code." });
      }

      if (Date.now() > record.expiresAt) {
        activeCodes.delete(cleanEmail);
        return res.status(400).json({ verified: false, error: "Verification code has expired. Please request a new one." });
      }

      if (record.code !== cleanCode) {
        record.attempts += 1;
        if (record.attempts >= 5) {
          activeCodes.delete(cleanEmail);
          return res.status(400).json({ verified: false, error: "Too many incorrect attempts. Please request a new code." });
        }
        return res.status(400).json({ verified: false, error: `Invalid verification code (${5 - record.attempts} attempts remaining).` });
      }

      // Valid code
      activeCodes.delete(cleanEmail);
      return res.json({ verified: true, message: "Email verified successfully." });
    } catch (err: any) {
      return res.status(500).json({ verified: false, error: err.message || "Verification failed." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
