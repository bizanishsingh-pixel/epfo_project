const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const session = require("express-session");

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

app.use(session({
  secret: "epfo_secret",
  resave: false,
  saveUninitialized: true
}));

/* ---------- DATABASE ---------- */
const db = mysql.createConnection({
  host: "localhost",
  user: "anshcom",
  password: "ansh123",
  database: "epfo_management",
  port: 3306
});

db.connect(err => {
  if (err) {
    console.error("DB error:", err);
  } else {
    console.log("DB connected");
  }
});

/* ---------- HEALTH CHECK ---------- */
app.get("/health", (req, res) => {
  res.send("OK");
});

/* ---------- AUTH ---------- */
function isLoggedIn(req, res, next) {
  if (req.session.user) next();
  else res.redirect("/login.html");
}

app.post("/login", (req, res) => {
  SELECT * FROM users;
  const { username, password } = req.body;

db.query(
  "SELECT * FROM users WHERE username=? AND password=?",
  [username, password],
  (err, rows) => {
    if (err) {
      console.log(err);
      return res.send("DB error");
    }

    if (rows.length === 0) {
      return res.send("Invalid login");
    }

    req.session.user = rows[0].username;
    res.redirect("/");
  }
);


app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login.html"));
});

/* ---------- HOME ---------- */
app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "home.html"));
});

/* ---------- ADD EMPLOYEE ---------- */
app.post("/save-employee", isLoggedIn, (req, res) => {
  const d = req.body;

  db.query(
    `INSERT INTO employees
     (uan_no, handled_by, name, dob, mobile_no, uan_password,
      aadhaar_no, pan_no, bank_name, account_no, ifsc_code, address)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      d.uan_no, d.handled_by, d.name, d.dob, d.mobile_no, d.uan_password,
      d.aadhaar_no, d.pan_no, d.bank_name, d.account_no, d.ifsc_code, d.address
    ],
    err => {
      if (err) return res.send("DB error");
      res.redirect("/search.html");
    }
  );
});

/* ---------- SEARCH ---------- */
app.get("/search-employee", isLoggedIn, (req, res) => {
  const q = req.query.q;

  db.query(
    "SELECT uan_no FROM employees WHERE mobile_no=? OR uan_no=?",
    [q, q],
    (err, rows) => {
      if (!rows || rows.length === 0) {
        return res.send("No record found");
      }
      res.redirect(`/profile.html?uan=${rows[0].uan_no}`);
    }
  );
});

/* ---------- PROFILE ---------- */
app.get("/employee/:uan", isLoggedIn, (req, res) => {
  db.query(
    "SELECT * FROM employees WHERE uan_no=?",
    [req.params.uan],
    (e, emp) => {
      db.query(
        "SELECT * FROM pf_records WHERE uan_no=?",
        [req.params.uan],
        (e2, pf) => res.json({ emp: emp[0], pf })
      );
    }
  );
});

/* ---------- ADD PF ---------- */
app.post("/add-pf", isLoggedIn, (req, res) => {
  const p = req.body;

  db.query(
    `INSERT INTO pf_records
     (uan_no, apply_date, form_type, status,
      paid_amount, pending_amount, payment_date, remark)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      p.uan_no, p.apply_date, p.form_type, p.status,
      p.paid_amount, p.pending_amount, p.payment_date, p.remark
    ],
    () => res.redirect(`/profile.html?uan=${p.uan_no}`)
  );
});

/* ---------- PORT (MOST IMPORTANT) ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});





