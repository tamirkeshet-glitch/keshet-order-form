// אישור קבלה לטופס: האם השורות של הלקוח הגיעו לגיליון התשובות ועובדו.
//
// למה פונקציה ב-Vercel ולא Apps Script: הדומיין keshet-g.com לא מאפשר
// פריסת Web App פתוחה לאנונימי, לא מאפשר מפתחות Service Account, והשרת
// ב-Oracle זמין רק בטיילסקייל (ר' PROJECT_PLAN §6.1 בריפו dalkan-API).
// כאן נעשה שימוש ב-refresh token עם הרשאת קריאה בלבד לגיליונות, שנשמר
// כמשתנה סביבה סודי ב-Vercel ולא בקוד.
//
// כדי לא לחשוף הזמנות: נדרש צירוף מדויק של ח.פ + מייל, רק 200 השורות
// האחרונות ורק מהיממה האחרונה, ומוחזרים קטגוריה ומצב בלבד.

const SHEET_ID = process.env.INTAKE_SHEET_ID || "1chWfLWGSo-2Xx2m6bUGUyy5mU8maYGafS2Bm_iRL-Pc";
const SHEET_NAME = process.env.INTAKE_SHEET_NAME || "תגובות לטופס 1";
// מיקומי עמודות זהים ל-COL ב-intake_processing_automation.gs
const COL = { TIMESTAMP: 1, CUSTOMER_ID: 3, CUSTOMER_EMAIL: 6, CATEGORY: 8, STATUS: 159 };
const TAIL_ROWS = 200;

function colLetter(n){
  let s = "";
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// מקבל גם את השמות כפי שהם מופיעים בקובץ הטוקן (client_id וכו'), כי כך הוזנו ב-Vercel
// מנקה רווחים ומירכאות שנכנסים בהעתקה מקובץ ה-JSON לממשק של Vercel
function envOf(name){
  // שם המשתנה בלי תלות באותיות גדולות/קטנות ועם או בלי GOOGLE_ (הוזנו בכמה צורות ב-Vercel)
  const want = name.toLowerCase();
  const key = Object.keys(process.env).find(k => k.toLowerCase().replace(/^google_/, "") === want);
  const raw = (key && process.env[key]) || "";
  return raw.trim().replace(/^["']+|["',]+$/g, "").trim();
}

async function accessToken(){
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({
      client_id: envOf("client_id"),
      client_secret: envOf("client_secret"),
      refresh_token: envOf("refresh_token"),
      grant_type: "refresh_token"
    })
  });
  if (!r.ok) throw new Error("token " + r.status);
  return (await r.json()).access_token;
}

async function sheetGet(token, path){
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${path}`, {
    headers: {Authorization: "Bearer " + token}
  });
  if (!r.ok) throw new Error("sheets " + r.status);
  return r.json();
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const hp = String(req.query.hp || "").trim();
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!hp || !email) { res.status(400).json({ok: false, error: "missing"}); return; }
  try {
    const token = await accessToken();
    const colA = await sheetGet(token, `/values/${encodeURIComponent(`'${SHEET_NAME}'!A:A`)}?majorDimension=COLUMNS`);
    const lastRow = ((colA.values || [[]])[0] || []).length;
    if (lastRow < 2) { res.json({ok: true, rows: []}); return; }
    const first = Math.max(2, lastRow - TAIL_ROWS + 1);
    const ranges = [
      `'${SHEET_NAME}'!A${first}:${colLetter(COL.CATEGORY)}${lastRow}`,
      `'${SHEET_NAME}'!${colLetter(COL.STATUS)}${first}:${colLetter(COL.STATUS)}${lastRow}`
    ].map(r => "ranges=" + encodeURIComponent(r)).join("&");
    // תאריך כמספר סידורי (ימים מ-30/12/1899, לפי אזור הזמן של הגיליון) - משמש רק לסדר ולחלון של יממה
    const data = await sheetGet(token,
      `/values:batchGet?${ranges}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER`);
    const main = data.valueRanges[0].values || [];
    const status = data.valueRanges[1].values || [];
    const nowSerial = Date.now() / 86400000 + 25569;
    const rows = [];
    main.forEach((r, i) => {
      const ts = Number(r[COL.TIMESTAMP - 1]);
      if (!ts || nowSerial - ts > 1) return;
      if (String(r[COL.CUSTOMER_ID - 1] ?? "").trim() !== hp) return;
      if (String(r[COL.CUSTOMER_EMAIL - 1] ?? "").trim().toLowerCase() !== email) return;
      const st = String((status[i] || [])[0] || "");
      rows.push({
        category: String(r[COL.CATEGORY - 1] || ""),
        at: ts,
        state: !st ? "processing" : (st.indexOf("שגיאה") === 0 ? "error" : "ok")
      });
    });
    res.json({ok: true, rows});
  } catch (err) {
    // בלי פרטים ללקוח; הדף מתייחס לזה כ"אין תשובה" וממשיך לנסות
    console.error("receipt:", err.message);
    // זמני לאבחון: רק צורת הערכים (קיום, אורך, תבנית), לא הערכים עצמם
    const shape = {
      upper: ["CLIENT_ID","CLIENT_SECRET","REFRESH_TOKEN"].map(k => k + ":" + (process.env["GOOGLE_" + k] || "").length).join(","),
      lower: ["client_id","client_secret","refresh_token"].map(k => k + ":" + (process.env[k] || "").length).join(","),
      idLooksRight: envOf("client_id").endsWith(".apps.googleusercontent.com"),
      secretLooksRight: envOf("client_secret").startsWith("GOCSPX-"),
      tokenLooksRight: envOf("refresh_token").startsWith("1//")
    };
    res.status(502).json({ok: false, error: "upstream", shape, stage: /^(token|sheets) \d+$/.test(err.message) ? err.message : (envOf("refresh_token") ? "other" : "no-env")});
  }
};
