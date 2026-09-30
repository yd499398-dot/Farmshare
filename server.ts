import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { MongoClient, Db, Collection } from "mongodb";

const app = express();
const PORT = Number(process.env.PORT || 10000);
const JWT_SECRET = process.env.JWT_SECRET || "farmshare_production_secret_key_2026_secure";

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "farmshare";
if (!mongoUri) {
  console.error("[FarmShare] FATAL: MONGODB_URI is required.");
  throw new Error("MONGODB_URI is required.");
}

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

let db: Db;
let client: MongoClient;
const collections = {} as Record<string, Collection<any>>;

const now = () => new Date();
const iso = () => new Date().toISOString();
const makeId = (prefix: string) => prefix + "_" + Date.now() + "_" + crypto.randomBytes(3).toString("hex");
const normalizeEmail = (email: string) => String(email || "").trim().toLowerCase();
const hashCode = (code: string) => crypto.createHash("sha256").update(code + ":" + JWT_SECRET).digest("hex");

const INITIAL_SETTINGS = {
  _id: "platform",
  defaultCommissionRate: 2.5,
  feeModel: "add_to_customer",
  gstRatePercent: 18,
  minPayoutAmountINR: 500,
  categoryRates: {
    Tractors: 2.5,
    "Farm Vehicles": 2.5,
    "Harvesting Equipment": 3,
    "Agricultural Machinery": 2.5,
    "Tools & Equipment": 2,
    Land: 2.5,
    Storage: 2.5,
    "Irrigation Equipment": 2,
    "Farming Services": 3,
    Other: 2.5
  },
  createdAt: iso(),
  updatedAt: iso()
};

const SEED_EQUIPMENT = [
  { id: 1, name: "John Deere 5050D Tractor", category: "Tractors", price: 4200, location: "Springfield Farm, 5 miles away", address: "Plot 14, Springfield Agro Yard, Near GT Canal Road, District 4", owner: "Robert K.", ownerId: "seed_robert", ownerPhone: "+91 98251 44102", ownerEmail: "robert.k@springfieldfarm.com", rating: 4.8, image: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80", description: "Reliable 50 HP tractor suitable for heavy tillage and haulage. Well maintained and regularly serviced." },
  { id: 2, name: "Heavy Duty Disc Harrow", category: "Tillage", price: 1700, location: "Miller's Ranch, 12 miles away", address: "Miller's Agricultural Yard, North Canal Bypass, Sector 9", owner: "Sarah M.", ownerId: "seed_sarah", ownerPhone: "+91 98762 11093", ownerEmail: "sarah.m@farms.in", rating: 4.5, image: "https://images.unsplash.com/photo-1589923188651-268a9765e432?auto=format&fit=crop&w=800&q=80", description: "Perfect for breaking up virgin land and chopping up crop residue." },
  { id: 3, name: "Combine Harvester S700", category: "Harvesters", price: 16500, location: "Oakhaven Fields, 8 miles away", address: "Oakhaven Fields, Agro Complex 3, Highway 27 Junction", owner: "Jim B.", ownerId: "seed_jim", ownerPhone: "+91 94280 55431", ownerEmail: "jim.b@harvesters.in", rating: 4.9, image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80", description: "High-capacity automated combine harvester. Excellent for large-scale wheat and corn harvesting." },
  { id: 4, name: "Precision Seed Drill", category: "Seeding", price: 2900, location: "Pine Valley, 3 miles away", address: "Pine Valley Agro Depot, Village Rampur Post", owner: "Elena W.", ownerId: "seed_elena", ownerPhone: "+91 99042 77819", ownerEmail: "elena.w@agri.in", rating: 4.7, image: "https://images.unsplash.com/photo-1594771804886-a933bb2d609b?auto=format&fit=crop&w=800&q=80", description: "Ensures uniform seed placement at precise depths. Greatly improves germination rates." },
  { id: 5, name: "Portable Irrigation Pump", category: "Irrigation", price: 1250, location: "Riverdale Farms, 6 miles away", address: "Riverdale Pump House, Canal Gate 4, East Bank", owner: "Tom H.", ownerId: "seed_tom", ownerPhone: "+91 97123 88904", ownerEmail: "tom.h@irrigation.in", rating: 4.2, image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=800&q=80", description: "Gas-powered portable water pump. Moves up to 500 gallons per minute." },
  { id: 6, name: "Compact Utility Tractor", category: "Tractors", price: 3300, location: "Green Acres, 2 miles away", address: "Green Acres Farmstead, Ring Road East, Near Agro Mandi", owner: "Lisa T.", ownerId: "seed_lisa", ownerPhone: "+91 98980 23456", ownerEmail: "lisa.t@farmland.in", rating: 4.6, image: "https://images.unsplash.com/photo-1534073133331-c4b62a557083?auto=format&fit=crop&w=800&q=80", description: "Versatile compact tractor ideal for small farms, landscaping, and loader work." }
];

interface AuthRequest extends Request { 
  user?: { uid: string; email: string; role: string; displayName?: string } 
}

const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Authentication required." });
  try {
    req.user = jwt.verify(token, JWT_SECRET) as any;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please sign in again." });
  }
};

const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin access required." });
  next();
};

function tokenFor(user: any) {
  return jwt.sign({ uid: user.uid, email: user.email, role: user.role, displayName: user.displayName }, JWT_SECRET, { expiresIn: "7d" });
}

function publicUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const user = normalizeEmail(process.env.GMAIL_USER || "");
  const pass = String(process.env.GMAIL_APP_PASS || "").replace(/\s+/g, "");
  
  if (!user || !pass) {
    console.error("[FarmShare Email] Missing GMAIL_USER or GMAIL_APP_PASS");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: user,
      pass: pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || ("FarmShare <" + user + ">"),
    to: to,
    subject: subject,
    text: text,
    html: html
  });
  return true;
}
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || ("FarmShare <" + user + ">"),
    to: to,
    subject: subject,
    text: text,
    html: html
  });
  return true;
}

function calculatePrice(pricePerDay: number, days: number, deliveryFee = 0, securityDeposit = 0, category = "Other") {
  const settings = (globalThis as any).__farmshareSettings || INITIAL_SETTINGS;
  const rentalDays = Math.max(1, Number(days) || 1);
  const base = Math.round(pricePerDay * 100) * rentalDays;
  const delivery = Math.round(deliveryFee * 100);
  const deposit = Math.round(securityDeposit * 100);
  const rate = Number(settings.categoryRates?.[category] || settings.defaultCommissionRate || 2.5);
  const commission = Math.round(base * rate / 100);
  const tax = Math.round(commission * Number(settings.gstRatePercent || 18) / 100);
  const total = base + delivery + deposit + commission + tax;
  return {
    rentalDays,
    baseAmount: base / 100,
    deliveryFee: delivery / 100,
    securityDeposit: deposit / 100,
    commissionRate: rate,
    commissionAmount: commission / 100,
    taxAmount: tax / 100,
    totalCustomerPayable: total / 100,
    ownerGrossAmount: (base + delivery) / 100,
    ownerCommissionDeducted: 0,
    ownerNetAmount: (base + delivery) / 100,
    feeModel: "add_to_customer"
  };
}

async function startDatabase() {
  try {
    client = new MongoClient(mongoUri!);
    await client.connect();
    db = client.db(dbName);

    for (const name of ["users", "equipment", "rentals", "reviews", "saved", "verification_codes", "settings", "audit_logs"]) {
      collections[name] = db.collection(name);
    }

    await collections.users.createIndex({ email: 1 }, { unique: true });
    await collections.users.createIndex({ phone: 1 }, { sparse: true });
    await collections.verification_codes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await collections.saved.createIndex({ userId: 1, equipmentId: 1 }, { unique: true });
    await collections.settings.updateOne({ _id: "platform" }, { $setOnInsert: INITIAL_SETTINGS }, { upsert: true });

    const settings = await collections.settings.findOne({ _id: "platform" });
    (globalThis as any).__farmshareSettings = settings || INITIAL_SETTINGS;

    if ((await collections.equipment.countDocuments()) === 0) {
      await collections.equipment.insertMany(SEED_EQUIPMENT.map(x => ({ ...x, createdAt: iso(), updatedAt: iso() })));
    }
    console.log("[FarmShare] MongoDB connected successfully: " + dbName);
  } catch (error: any) {
    console.error("[FarmShare] MongoDB connection note:", error?.message || error);
  }
}

app.get("/api/health", (_req, res) => res.json({ status: "ok", database: "mongodb", timestamp: iso() }));

app.get("/api/system/status", async (_req, res) => {
  let dbStatus = "disconnected";
  try {
    await db.command({ ping: 1 });
    dbStatus = "connected";
  } catch {}
  res.json({
    status: "operational",
    database: { provider: "MongoDB Atlas", databaseName: dbName, status: dbStatus },
    emailService: { provider: "Gmail SMTP", configured: Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) }
  });
});

app.get("/api/auth/check-user", async (req, res) => {
  const email = normalizeEmail(String(req.query.email || ""));
  if (!email) return res.status(400).json({ exists: false, error: "Email is required." });
  res.json({ exists: Boolean(await collections.users.findOne({ email })) });
});

app.post("/api/auth/send-verification-code", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const name = String(req.body?.name || "Farmer").trim();
  const purpose = req.body?.purpose === "reset" ? "reset" : "signup";

  if (!email || !email.includes("@")) return res.status(400).json({ success: false, error: "Valid email is required." });
  if (purpose === "reset" && !(await collections.users.findOne({ email }))) return res.status(404).json({ success: false, error: "No account found with this email." });
  if (purpose === "signup" && (await collections.users.findOne({ email }))) return res.status(409).json({ success: false, error: "An account already exists with this email." });

  const code = String(crypto.randomInt(100000, 1000000));
  await collections.verification_codes.deleteMany({ email, purpose });
  await collections.verification_codes.insertOne({
    email,
    purpose,
    codeHash: hashCode(code),
    attempts: 0,
    createdAt: now(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });

  const subject = purpose === "reset" ? (code + " is your FarmShare password reset code") : (code + " is your FarmShare verification code");
  const html = "<div style=\"font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e7e5e4;border-radius:16px\"><h2 style=\"color:#166534\">FarmShare Verification</h2><p>Hello " + name.replace(/[<>]/g, "") + ",</p><p>Your code is:</p><div style=\"font-size:34px;font-weight:800;letter-spacing:8px;color:#15803d;text-align:center;padding:18px;background:#f0fdf4;border-radius:12px\">" + code + "</div><p>Expires in 10 minutes.</p></div>";

  try {
    const sent = await sendEmail(email, subject, html, "Your FarmShare code is " + code + ". It expires in 10 minutes.");
    if (!sent) return res.status(503).json({ success: false, smtpConfigured: false, error: "Email service is not configured on the server." });
    return res.json({ success: true, emailDispatched: true, smtpConfigured: true, message: "Verification code sent to " + email + "." });
  } catch (error: any) {
    console.error("[FarmShare Email]", error?.message || error);
    return res.status(502).json({ success: false, smtpConfigured: true, error: "Could not send the email." });
  }
});

app.post("/api/auth/verify-code", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code || "").trim();
  const record = await collections.verification_codes.findOne({ email }, { sort: { createdAt: -1 } });

  if (!record) return res.status(400).json({ verified: false, error: "No pending verification code found." });
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    await collections.verification_codes.deleteOne({ _id: record._id });
    return res.status(400).json({ verified: false, error: "Verification code has expired." });
  }
  if (record.attempts >= 5) return res.status(400).json({ verified: false, error: "Too many incorrect attempts. Request a new code." });
  if (record.codeHash !== hashCode(code)) {
    await collections.verification_codes.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    return res.status(400).json({ verified: false, error: "Invalid verification code." });
  }

  await collections.verification_codes.deleteOne({ _id: record._id });
  res.json({ verified: true, message: "Email verified successfully." });
});

app.post("/api/auth/register", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const name = String(req.body?.name || "Farmer").trim();

  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  if (await collections.users.findOne({ email })) return res.status(409).json({ error: "An account is already registered with this email." });

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(normalizeEmail).filter(Boolean);
  const ownerEmails = (process.env.OWNER_EMAILS || "").split(",").map(normalizeEmail).filter(Boolean);
  const role = adminEmails.includes(email) ? "admin" : ownerEmails.includes(email) ? "owner" : "customer";

  const user = {
    uid: makeId("user"),
    displayName: name || "Farmer",
    email,
    phone: req.body?.phone || "",
    address: "",
    photoURL: "https://api.dicebear.com/9.x/initials/svg?seed=" + encodeURIComponent(name),
    role,
    isVerified: true,
    createdAt: iso(),
    updatedAt: iso(),
    passwordHash: await bcrypt.hash(password, 12)
  };

  await collections.users.insertOne(user);
  res.status(201).json({ user: publicUser(user), token: tokenFor(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const user = await collections.users.findOne({ email });

  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  res.json({ user: publicUser(user), token: tokenFor(user) });
});

app.post("/api/auth/reset-password", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.newPassword || "");
  const user = await collections.users.findOne({ email });
  if (!user) return res.status(404).json({ error: "Account not found." });

  await collections.users.updateOne(
    { _id: user._id },
    { $set: { passwordHash: await bcrypt.hash(password, 12), updatedAt: iso(), isVerified: true } }
  );

  const updated = await collections.users.findOne({ _id: user._id });
  res.json({ user: publicUser(updated), token: tokenFor(updated) });
});

app.post("/api/auth/google-profile", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email) return res.status(400).json({ error: "Google email is required." });

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(normalizeEmail).filter(Boolean);
  const existing = await collections.users.findOne({ email });

  const user = existing || {
    uid: makeId("google"),
    email,
    displayName: String(req.body?.displayName || email.split("@")[0]),
    phone: "",
    address: "",
    photoURL: req.body?.photoURL || "",
    role: adminEmails.includes(email) ? "admin" : "customer",
    isVerified: true,
    createdAt: iso()
  };

  await collections.users.updateOne(
    { email },
    { $set: { ...user, displayName: (req.body?.displayName || user.displayName), photoURL: (req.body?.photoURL || user.photoURL), updatedAt: iso() }, $setOnInsert: { email } },
    { upsert: true }
  );

  const saved = await collections.users.findOne({ email });
  res.json({ user: publicUser(saved), token: tokenFor(saved) });
});

app.patch("/api/auth/profile", auth, async (req: AuthRequest, res) => {
  const updates = {
    displayName: String(req.body?.displayName || "").trim(),
    phone: String(req.body?.phone || "").trim(),
    address: String(req.body?.address || "").trim(),
    updatedAt: iso()
  };
  const result = await collections.users.findOneAndUpdate(
    { uid: req.user!.uid },
    { $set: updates },
    { returnDocument: "after" }
  );
  if (!result) return res.status(404).json({ error: "User not found." });
  res.json({ user: publicUser(result) });
});

app.patch("/api/auth/password", auth, async (req: AuthRequest, res) => {
  const password = String(req.body?.newPassword || "");
  await collections.users.updateOne(
    { uid: req.user!.uid },
    { $set: { passwordHash: await bcrypt.hash(password, 12), updatedAt: iso() } }
  );
  res.json({ success: true });
});

app.get("/api/app/equipment", async (_req, res) => {
  res.json({ success: true, data: await collections.equipment.find({}).sort({ createdAt: -1 }).toArray() });
});

app.post("/api/app/equipment", auth, async (req: AuthRequest, res) => {
  const body = req.body || {};
  const item = {
    ...body,
    id: Number(body.id) || Date.now(),
    ownerId: req.user!.uid,
    owner: req.user!.displayName || body.owner || "Farmer",
    ownerEmail: req.user!.email,
    createdAt: iso(),
    updatedAt: iso()
  };
  await collections.equipment.insertOne(item);
  res.status(201).json({ success: true, data: item });
});

app.get("/api/app/rentals", async (req, res) => {
  const query: any = {};
  if (req.query.userId) query.userId = String(req.query.userId);
  res.json({ success: true, data: await collections.rentals.find(query).sort({ createdAt: -1 }).toArray() });
});

app.post("/api/app/rentals", async (req, res) => {
  const body = req.body || {};
  const equipment = body.equipment;
  if (!equipment?.id || !body.startDate || !body.endDate) {
    return res.status(400).json({ error: "Equipment and rental dates are required." });
  }
  const rental = {
    ...body,
    id: body.id || makeId("rental"),
    status: body.status || "pending",
    hasReviewed: false,
    createdAt: body.createdAt || iso(),
    updatedAt: iso()
  };
  await collections.rentals.insertOne(rental);
  res.status(201).json({ success: true, data: rental });
});

app.patch("/api/app/rentals/:id", async (req, res) => {
  const result = await collections.rentals.findOneAndUpdate(
    { id: req.params.id },
    { $set: { ...req.body, updatedAt: iso() } },
    { returnDocument: "after" }
  );
  if (!result) return res.status(404).json({ error: "Rental not found." });
  res.json({ success: true, data: result });
});

app.get("/api/app/reviews", async (_req, res) => {
  res.json({ success: true, data: await collections.reviews.find({}).sort({ createdAt: -1 }).toArray() });
});

app.post("/api/app/reviews", async (req, res) => {
  const review = { ...req.body, id: req.body.id || makeId("review"), createdAt: req.body.createdAt || iso() };
  await collections.reviews.insertOne(review);
  if (review.bookingId) {
    await collections.rentals.updateOne({ id: review.bookingId }, { $set: { hasReviewed: true, updatedAt: iso() } });
  }
  res.status(201).json({ success: true, data: review });
});

app.get("/api/app/saved", async (req, res) => {
  const userId = String(req.query.userId || "");
  if (!userId) return res.json({ success: true, data: [] });
  res.json({ success: true, data: await collections.saved.find({ userId }).toArray() });
});

app.put("/api/app/saved/:userId/:equipmentId", async (req, res) => {
  const item = { userId: req.params.userId, equipmentId: String(req.params.equipmentId), createdAt: iso() };
  await collections.saved.updateOne({ userId: item.userId, equipmentId: item.equipmentId }, { $setOnInsert: item }, { upsert: true });
  res.json({ success: true });
});

app.delete("/api/app/saved/:userId/:equipmentId", async (req, res) => {
  await collections.saved.deleteOne({ userId: req.params.userId, equipmentId: String(req.params.equipmentId) });
  res.json({ success: true });
});

app.post("/api/system/clear-database", auth, adminOnly, async (_req, res) => {
  for (const name of ["users", "rentals", "reviews", "saved", "verification_codes"]) {
    await collections[name].deleteMany({});
  }
  await collections.equipment.deleteMany({});
  await collections.equipment.insertMany(SEED_EQUIPMENT.map(x => ({ ...x, createdAt: iso(), updatedAt: iso() })));
  res.json({ success: true, message: "MongoDB application data cleared and seed equipment restored." });
});

app.post("/api/marketplace/calculate-price", async (req, res) => {
  const { pricePerDay, days, deliveryFee, securityDeposit, category } = req.body || {};
  res.json({
    success: true,
    data: calculatePrice(Number(pricePerDay), Number(days), Number(deliveryFee || 0), Number(securityDeposit || 0), category || "Other")
  });
});

app.get("/api/marketplace/commission", async (_req, res) => res.json({ success: true, data: (globalThis as any).__farmshareSettings }));

app.post("/api/marketplace/commission", auth, adminOnly, async (req: AuthRequest, res) => {
  const current = await collections.settings.findOne({ _id: "platform" }) || INITIAL_SETTINGS;
  const newRate = Math.max(2.5, Number(req.body?.defaultRate || current.defaultCommissionRate));
  const next = { ...current, defaultCommissionRate: newRate, feeModel: req.body?.feeModel || current.feeModel, updatedAt: iso() };
  await collections.settings.replaceOne({ _id: "platform" }, next, { upsert: true });
  (globalThis as any).__farmshareSettings = next;
  await collections.audit_logs.insertOne({
    id: makeId("audit"),
    adminEmail: req.user!.email,
    oldRate: current.defaultCommissionRate,
    newRate,
    changedAt: iso(),
    reason: req.body?.reason || "Commission settings updated"
  });
  res.json({ success: true, data: next });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[FarmShare Express Error]", err);
  res.status(500).json({ error: "Internal server error." });
});

// Bind HTTP port immediately so Render detects it without waiting for DB handshake
app.listen(PORT, "0.0.0.0", () => {
  console.log("[FarmShare] API listening on port " + PORT);
  startDatabase();
});
