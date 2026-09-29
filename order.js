const PANEL_LABELS = {
  customer: "לקוח",
  choose: "מה מזמינים",
  vehicle: "דלקן",
  driver: "נהג",
  master: "מאסטר",
  sono: "סונוקאש",
  shtifo: "שטיפומט",
  summary: "שליחה"
};
const GFORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSegKo4OEzIhcsr8Em5z8o_FMqgi4Of9LZ2TRteHulMMGGC3Kw/formResponse";
// פריסת Apps Script נפרדת (גישה: Anyone, גם אנונימי) שעונה אם השורות הגיעו
// לגיליון - ר' orderStatusJson_ ב-intake_processing_automation.gs.
// ריק = בלי בדיקת קבלה (הודעת הצלחה כמו קודם).
const STATUS_URL = "";
const PRODUCT_PANELS = ["vehicle","driver","master","sono","shtifo"];
const CATEGORY_MAP = {
  vehicle: "כרטיס רכב או דלקן",
  driver: "כרטיס נהג",
  master: "כרטיס מאסטר",
  sono: "סונוקאש",
  shtifo: "שטיפומט"
};
const AMTSEI = ["כרטיס רכב","דלקן א'","דלקן ב (רושם ק\"מ)","דלקן אוריאה","כרטיס אוריאה"];
const FUEL = ["בנזין 95","בנזין 98","גולדיזל (סולר)","אוריאה","גולדיזל + אוריאה"];
const FUEL_ALL = ["ALL - כללי","בנזין 95","בנזין 98","גולדיזל (סולר)","אוריאה"];
const VTYPES = ["פרטי","מסחרי","משאית","אוטובוס","אופנוע","אחר"];
const SHTIFO_VTYPES = ["פרטי","מסחרי","מסחרי גדול","משאית","רכב משא"];
const SHTIFO = [
  {v:"לא", t:"לא"},
  {v:"1", t:"כן - שטיפה אחת בחודש"},
  {v:"2", t:"כן - שתי שטיפות בחודש"},
  {v:"3", t:"כן - שלוש שטיפות בחודש"},
  {v:"4", t:"כן - ארבע שטיפות בחודש"},
  {v:"5", t:"כן - חמש שטיפות בחודש"}
];
const VEHICLE_ENTRIES = [
  ["476326715","91491319","1967263462","711923665","1704523471","96866865","1518311232","2138349192","114836198","1350158276","936176596","1799999744","1877045025"],
  ["1074898548","1589928531","1904065670","98433035","1360140015","732385153","675448834","1121789582","392902928","1226274254","1004204721","1388713992","1220406068"],
  ["1983267467","1266105009","405679821","798385764","50754419","462667806","1545521257","364231541","832781325","1543414079","898283022","669484655","1180484340"],
  ["1290680057","1913299607","446009575","1372478976","1763234024","1402969068","2071230099","254034158","883994543","1433839874","1048634322","1707732413","1663180698"],
  ["270209496","1358823399","38341172","784729549","1845226046","401240044","1104910811","1551976221","347023622","118204643","1426800615","1602849179","397477906"],
  ["327042445","1150019347","1857950840","1171498678","914494258","1309587637","35667608","534381443","1710746989","1751990763","1793867593","1833561946","97645437"],
  ["662238361","842866099","2094443077","1213439755","1326713374","29775204","1286355851","1179840285","1762710538","1619626658","1761138707","1467950438","723872493"],
  ["1126053195","752605876","1398723967","474509648","2026633239","1118089276","2031017914","144647695","1218423678","2031563216","1497131347","107721845","1876862224"],
  ["494263038","683045601","354201912","644583214","635088258","45667851","1648395418","991972332","1884324646","505758528","270561510","978929556","960703604"],
  ["1932529716","1625526402","1155301913","1593765537","850523715","901130699","687754495","653986194","1007410702","45002123","1734079682","104928308", null]
];
const E = {
  company: "934169292",
  hp: "1516374471",
  phone: "2138583775",
  address: "924223454",
  email: "1943028309",
  sig1_name: "1546930528",
  category: "585139270",
  drivers: [
    {name:"1238063293", id:"1540994341", fuel:"1929367822", day:"725523238", month:"646802249", more:"772680783"},
    {name:"1932132031", id:"997853694", fuel:"1235838847", day:"330880829", month:"1709451275"}
  ],
  master_qty: "61834770",
  master_fuel: "57696934",
  master_day: "583865609",
  master_month: "105977787",
  sono_fuel: "1292972257",
  sono_denoms: ["870630053","20073982","2010242330","2143055710","1862823812","394350578"]
};
let path = ["customer", "choose"];
let step = 0;
let submitted = false;
const vehicleCount = { n: 0 };
const driverCount = { n: 0 };
const shtifoCount = { n: 0 };
// טופס גוגל מחזיק 10 סלוטי רכב (עמודים 5..14). מעבר לזה ההזמנה מתפצלת
// לכמה שליחות, כל אחת עד 10 רכבים ורק מסוג אמצעי תדלוק אחד.
const FORM_VEHICLE_SLOTS = 10;
const MAX_VEHICLES = 200;
// שטיפומט נשאר טופס אחד לחתימה גם מעל 10 רכבים: 10 הראשונים בסלוטים הרגילים,
// והשאר נארזים בשדה «קוד / שם מחלקה» של סלוט 10 (לא בשימוש בשטיפומט),
// בפורמט "מספר|סוג|כמות" מופרד ב-";". Apps Script פורס אותם בחזרה
// (collectShtifomatItems ב-intake_processing_automation.gs).
const MAX_SHTIFO = 100;
const SHTIFO_EXTRA_PREFIX = "SHTIFO_EXTRA:";
function $(sel){ return document.querySelector(sel); }
function val(id){ const el = document.getElementById(id); return el ? el.value.trim() : ""; }
function radio(name){
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
}
function selectedTypes(){
  return [...document.querySelectorAll('input[name="order_type"]:checked')].map(el => el.value);
}
function wants(type){ return selectedTypes().includes(type); }
function currentPanel(){ return path[step]; }
function rebuildPath(){
  const chosen = selectedTypes().filter(t => PRODUCT_PANELS.includes(t));
  path = ["customer", "choose", ...chosen, "summary"];
  if (step >= path.length) step = path.length - 1;
}
function renderSteps(){
  $("#steps").innerHTML = path.map((key,i) => {
    const cls = i===step ? "active" : (i<step ? "done" : "");
    return `<span class="step-dot ${cls}">${i+1}. ${PANEL_LABELS[key]}</span>`;
  }).join("");
  document.querySelectorAll(".panel").forEach(p => {
    p.classList.toggle("active", p.dataset.panel === currentPanel());
  });
  $("#prevBtn").style.visibility = step===0 ? "hidden" : "visible";
  $("#nextBtn").textContent = currentPanel()==="summary" ? "שליחת הזמנה" : "המשך";
}
function sel(name, options, required){
  const req = required ? "required" : "";
  return `<select name="${name}" ${req}>` +
    `<option value="">בחירה</option>` +
    // הערכים עוברים esc: «דלקן ב (רושם ק"מ)» מכיל גרשיים, שסגרו את מאפיין value
    // באמצע. הערך נקטע ל«דלקן ב (רושם ק», לא נבחר בקליטת אקסל, ונשלח קטוע לגוגל.
    options.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join("") +
    `</select>`;
}
function shtifoSel(name, allowNo){
  const opts = allowNo === false ? SHTIFO.filter(o => o.v !== "לא") : SHTIFO;
  return `<select name="${name}" required>` +
    `<option value="">בחירה</option>` +
    opts.map(o => `<option value="${o.v}">${o.t}</option>`).join("") +
    `</select>`;
}
function setField(name, value){
  const el = document.querySelector(`[name="${name}"]`);
  if (el && value !== undefined && value !== null) el.value = value;
}
function addVehicle(preset){
  if (vehicleCount.n >= MAX_VEHICLES) return;
  const i = vehicleCount.n++;
  const wrap = document.createElement("div");
  wrap.className = "card-block";
  wrap.dataset.v = i;
  wrap.innerHTML = `
    <div class="card-head">
      <h3>רכב / דלקן ${i+1}</h3>
      <button type="button" class="btn-remove" data-remove="vehicle" data-i="${i}">הסר</button>
    </div>
    <div class="grid">
      <div>${label("סוג אמצעי תדלוק", true)}${sel("v_amtsei_"+i, AMTSEI, true)}</div>
      <div>${label("מס׳ רכב", true)}<input type="text" name="v_plate_${i}"></div>
      <div>${label("מס׳ הטלפון של הנהג")}<input type="tel" name="v_phone_${i}"></div>
      <div>${label("סוג דלק", true)}${sel("v_fuel_"+i, FUEL, true)}</div>
      <div>${label("סוג הרכב", true)}${sel("v_type_"+i, VTYPES, true)}</div>
      <div>${label("הגבלה בליטרים ליום")}<input type="text" name="v_day_${i}"></div>
      <div>${label("הגבלה בליטרים לחודש")}<input type="text" name="v_month_${i}"></div>
      <div>${label("דגם רכב")}<input type="text" name="v_model_${i}"></div>
      <div>${label("שנת יצור")}<input type="text" name="v_year_${i}"></div>
      <div>${label("שם נהג")}<input type="text" name="v_driver_${i}"></div>
      <div>${label("קוד / שם מחלקה")}<input type="text" name="v_dept_${i}"></div>
      <div class="span-2">${label("שטיפומט", true)}${shtifoSel("v_shtifo_"+i)}</div>
    </div>`;
  $("#vehiclesList").appendChild(wrap);
  if (preset) {
    setField("v_amtsei_"+i, preset.amtsei);
    setField("v_plate_"+i, preset.plate);
    setField("v_phone_"+i, preset.phone);
    setField("v_fuel_"+i, preset.fuel);
    setField("v_type_"+i, preset.type);
    setField("v_day_"+i, preset.day);
    setField("v_month_"+i, preset.month);
    setField("v_model_"+i, preset.model);
    setField("v_year_"+i, preset.year);
    setField("v_driver_"+i, preset.driver);
    setField("v_dept_"+i, preset.dept);
    setField("v_shtifo_"+i, preset.shtifo);
  }
  $("#addVehicle").style.display = vehicleCount.n >= MAX_VEHICLES ? "none" : "inline-block";
}
function label(t, req){ return `<label>${t}${req?' <span class="req">*</span>':''}</label>`; }
function addShtifoVehicle(preset){
  if (shtifoCount.n >= MAX_SHTIFO) return;
  const i = shtifoCount.n++;
  const wrap = document.createElement("div");
  wrap.className = "card-block";
  wrap.innerHTML = `
    <div class="card-head">
      <h3>רכב לשטיפומט ${i+1}</h3>
      <button type="button" class="btn-remove" data-remove="shtifo" data-i="${i}">הסר</button>
    </div>
    <div class="grid">
      <div>${label("מס׳ רכב", true)}<input type="text" name="s_plate_${i}"></div>
      <div>${label("סוג הרכב", true)}${sel("s_type_"+i, SHTIFO_VTYPES, true)}</div>
      <div class="span-2">${label("כמות שטיפות בחודש", true)}${shtifoSel("s_qty_"+i, false)}</div>
    </div>`;
  $("#shtifoList").appendChild(wrap);
  if (preset) {
    setField("s_plate_"+i, preset.plate);
    setField("s_type_"+i, preset.type);
    setField("s_qty_"+i, preset.qty);
  }
  $("#addShtifo").style.display = shtifoCount.n >= MAX_SHTIFO ? "none" : "inline-block";
}
function addDriver(preset){
  if (driverCount.n >= 2) return;
  const i = driverCount.n++;
  const wrap = document.createElement("div");
  wrap.className = "card-block";
  wrap.innerHTML = `
    <div class="card-head">
      <h3>כרטיס נהג ${i+1}</h3>
      <button type="button" class="btn-remove" data-remove="driver" data-i="${i}">הסר</button>
    </div>
    <div class="grid">
      <div>${label("שם הנהג", true)}<input type="text" name="d_name_${i}"></div>
      <div>${label("מס׳ זהות נהג", true)}<input type="text" name="d_id_${i}"></div>
      <div class="span-2">${label("סוג דלק", true)}${sel("d_fuel_"+i, FUEL_ALL, true)}</div>
      <div>${label("הגבלת צריכה יומית בליטרים")}<input type="text" name="d_day_${i}"></div>
      <div>${label("הגבלת צריכה חודשית בליטרים", true)}<input type="text" name="d_month_${i}"></div>
    </div>`;
  $("#driversList").appendChild(wrap);
  if (preset) {
    setField("d_name_"+i, preset.name);
    setField("d_id_"+i, preset.id);
    setField("d_fuel_"+i, preset.fuel);
    setField("d_day_"+i, preset.day);
    setField("d_month_"+i, preset.month);
  }
  $("#addDriver").style.display = driverCount.n >= 2 ? "none" : "inline-block";
}
function collectVehicles(){
  const items = [];
  for (let i=0;i<vehicleCount.n;i++){
    items.push({
      amtsei: field("v_amtsei_"+i), plate: field("v_plate_"+i), phone: field("v_phone_"+i),
      fuel: field("v_fuel_"+i), type: field("v_type_"+i), day: field("v_day_"+i),
      month: field("v_month_"+i), model: field("v_model_"+i), year: field("v_year_"+i),
      driver: field("v_driver_"+i), dept: field("v_dept_"+i), shtifo: field("v_shtifo_"+i)
    });
  }
  return items;
}
function collectShtifo(){
  const items = [];
  for (let i=0;i<shtifoCount.n;i++){
    items.push({ plate: field("s_plate_"+i), type: field("s_type_"+i), qty: field("s_qty_"+i) });
  }
  return items;
}
function collectDrivers(){
  const items = [];
  for (let i=0;i<driverCount.n;i++){
    items.push({
      name: field("d_name_"+i), id: field("d_id_"+i), fuel: field("d_fuel_"+i),
      day: field("d_day_"+i), month: field("d_month_"+i)
    });
  }
  return items;
}
function removeItem(kind, index){
  if (kind === "vehicle") {
    const keep = collectVehicles().filter((_, i) => i !== index);
    $("#vehiclesList").innerHTML = "";
    vehicleCount.n = 0;
    keep.forEach(item => addVehicle(item));
    $("#addVehicle").style.display = vehicleCount.n >= MAX_VEHICLES ? "none" : "inline-block";
  } else if (kind === "shtifo") {
    const keep = collectShtifo().filter((_, i) => i !== index);
    $("#shtifoList").innerHTML = "";
    shtifoCount.n = 0;
    keep.forEach(item => addShtifoVehicle(item));
    $("#addShtifo").style.display = shtifoCount.n >= MAX_SHTIFO ? "none" : "inline-block";
  } else if (kind === "driver") {
    const keep = collectDrivers().filter((_, i) => i !== index);
    $("#driversList").innerHTML = "";
    driverCount.n = 0;
    keep.forEach(item => addDriver(item));
    $("#addDriver").style.display = driverCount.n >= 2 ? "none" : "inline-block";
  }
}
function field(name){ const el = document.querySelector(`[name="${name}"]`); return el ? el.value.trim() : ""; }
function validate(){
  const err = $("#formError");
  err.style.display = "none";
  const need = (ok, msg) => {
    if(!ok){
      err.textContent = msg || "יש למלא את השדות החובה לפני ההמשך.";
      err.style.display="block";
      return false;
    }
    return true;
  };
  const panel = currentPanel();
  if (panel==="customer") {
    return need(val("company") && val("hp") && val("address") && val("email") && val("phone") && val("sig1_name"));
  }
  if (panel==="choose") {
    return need(selectedTypes().length > 0, "יש לבחור לפחות סוג הזמנה אחד.");
  }
  if (panel==="vehicle") {
    if (vehicleCount.n===0) return need(false);
    for (let i=0;i<vehicleCount.n;i++){
      if (!field("v_amtsei_"+i) || !field("v_plate_"+i) || !field("v_fuel_"+i) || !field("v_type_"+i) || !field("v_shtifo_"+i))
        return need(false);
    }
  }
  if (panel==="driver") {
    if (driverCount.n===0) return need(false);
    for (let i=0;i<driverCount.n;i++){
      if (!field("d_name_"+i) || !field("d_id_"+i) || !field("d_fuel_"+i) || !field("d_month_"+i)) return need(false);
    }
  }
  if (panel==="master") {
    return need(val("master_qty") && val("master_fuel") && val("master_month"));
  }
  if (panel==="sono") {
    return need(radio("sono_fuel"));
  }
  if (panel==="shtifo") {
    if (shtifoCount.n===0) return need(false, "יש להוסיף לפחות רכב אחד לשטיפומט.");
    for (let i=0;i<shtifoCount.n;i++){
      const qty = field("s_qty_"+i);
      if (!field("s_plate_"+i) || !field("s_type_"+i) || !qty || qty==="לא")
        return need(false, "לכל רכב חובה מספר, סוג, וכמות שטיפות (לא «לא»).");
    }
  }
  return true;
}
function categoryValue(type){
  if (type) return CATEGORY_MAP[type] || "";
  const first = PRODUCT_PANELS.find(t => wants(t));
  return first ? CATEGORY_MAP[first] : "";
}
function esc(t){
  return String(t).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function buildSummary(){
  const lines = [
    `<b>${esc(val("company"))}</b> · ${esc(val("hp"))}`,
    esc(val("address")),
    `${esc(val("phone"))} · ${esc(val("email"))}`,
    `מורשה חתימה: ${esc(val("sig1_name"))}`,
    `דלקן/רכב: ${wants("vehicle") ? vehicleCount.n+" פריטים" : "לא"}`,
    `כרטיס נהג: ${wants("driver") ? driverCount.n+" כרטיסים" : "לא"}`,
    `מאסטר: ${wants("master") ? val("master_qty")+" כרטיסים" : "לא"}`,
    `סונוקאש: ${wants("sono") ? (radio("sono_fuel") || "כן") : "לא"}`,
    `שטיפומט: ${wants("shtifo") ? shtifoCount.n+" רכבים" : "לא"}`
  ];
  if (wants("vehicle")) {
    const batches = vehicleBatches();
    if (batches.length > 1) {
      lines.push("", `<b>הזמנת הרכבים תישלח כ-${batches.length} טפסים נפרדים, כל אחד לחתימה בנפרד:</b>`);
      batches.forEach((b, k) => lines.push(`טופס ${k+1}: ${esc(b[0].amtsei)} · ${b.length} רכבים`));
    }
  }
  $("#summary").innerHTML = lines.join("<br>");
}
function addHidden(form, name, value){
  if (value===undefined || value===null || String(value)==="") return;
  const i = document.createElement("input");
  i.type = "hidden";
  i.name = name;
  i.value = value;
  form.appendChild(i);
}
function addEntry(form, entry, value){
  addHidden(form, "entry." + entry, value);
}
function pageHistoryValue(type, vehiclesInJob){
  const pages = [0, 1];
  const includeVehicle = type ? type === "vehicle" : wants("vehicle");
  const includeDriver = type ? type === "driver" : wants("driver");
  const includeMaster = type ? type === "master" : wants("master");
  const includeSono = type ? type === "sono" : wants("sono");
  if (includeVehicle) {
    for (let i = 0; i < vehiclesInJob; i++) pages.push(5 + i);
  }
  if (includeDriver) {
    pages.push(2);
    if (driverCount.n > 1) pages.push(3);
  }
  if (includeMaster) pages.push(4);
  if (includeSono) pages.push(15);
  const includeShtifo = type ? type === "shtifo" : wants("shtifo");
  if (includeShtifo) {
    for (let i = 0; i < Math.min(shtifoCount.n, FORM_VEHICLE_SLOTS); i++) pages.push(5 + i);
  }
  return pages.join(",");
}
function addCustomerFields(form){
  addEntry(form, E.company, val("company"));
  addEntry(form, E.hp, val("hp"));
  addEntry(form, E.phone, val("phone"));
  addEntry(form, E.address, val("address"));
  addEntry(form, E.email, val("email"));
  addEntry(form, E.sig1_name, val("sig1_name"));
}
// פיצול: קבוצה לכל סוג אמצעי תדלוק (לפי סדר הופעה), וכל קבוצה בנתחים של עד 10.
// ה-PDF וחבילת ה-WeSign נבנים לכל שורת תשובה, ולכן כל נתח = טופס נפרד לחתימה.
function vehicleBatches(){
  const groups = new Map();
  collectVehicles().forEach(v => {
    if (!groups.has(v.amtsei)) groups.set(v.amtsei, []);
    groups.get(v.amtsei).push(v);
  });
  const batches = [];
  groups.forEach(list => {
    for (let k = 0; k < list.length; k += FORM_VEHICLE_SLOTS) batches.push(list.slice(k, k + FORM_VEHICLE_SLOTS));
  });
  return batches;
}
function addVehicleFields(form, items){
  for (let i=0;i<items.length;i++){
    const ids = VEHICLE_ENTRIES[i];
    const v = items[i];
    addEntry(form, ids[0], v.amtsei);
    addEntry(form, ids[1], v.plate);
    addEntry(form, ids[2], v.phone);
    addEntry(form, ids[3], v.fuel);
    addEntry(form, ids[4], v.type);
    addEntry(form, ids[5], v.day);
    addEntry(form, ids[6], v.month);
    addEntry(form, ids[7], v.model);
    addEntry(form, ids[8], v.year);
    addEntry(form, ids[9], v.driver);
    addEntry(form, ids[10], v.dept);
    addEntry(form, ids[11], v.shtifo);
    if (ids[12]) {
      const more = (i < items.length-1)
        ? "כן, הוסף אמצעי תדלוק/רכב נוסף"
        : "לא, סיים את ההזמנה";
      addEntry(form, ids[12], more);
    }
  }
}
function addDriverFields(form){
  for (let i=0;i<driverCount.n;i++){
    const ids = E.drivers[i];
    addEntry(form, ids.name, field("d_name_"+i));
    addEntry(form, ids.id, field("d_id_"+i));
    addEntry(form, ids.fuel, field("d_fuel_"+i));
    addEntry(form, ids.day, field("d_day_"+i));
    addEntry(form, ids.month, field("d_month_"+i));
    if (ids.more) {
      const more = (i < driverCount.n-1)
        ? "כן, הזמן כרטיס נהג נוסף"
        : "לא, סיים את ההזמנה";
      addEntry(form, ids.more, more);
    }
  }
}
function addMasterFields(form){
  addEntry(form, E.master_qty, val("master_qty"));
  addEntry(form, E.master_fuel, val("master_fuel"));
  addEntry(form, E.master_day, val("master_day"));
  addEntry(form, E.master_month, val("master_month"));
}
function addSonoFields(form){
  addEntry(form, E.sono_fuel, radio("sono_fuel"));
  const denoms = ["sono_100","sono_150","sono_200","sono_250","sono_500","sono_1000"];
  denoms.forEach((id, idx) => addEntry(form, E.sono_denoms[idx], val(id)));
}
function mapShtifoTypeToForm(t){
  const map = {
    "פרטי": "פרטי",
    "מסחרי": "מסחרי",
    "מסחרי גדול": "מסחרי",
    "משאית": "משאית",
    "רכב משא": "משאית"
  };
  return map[t] || "אחר";
}
function addShtifoFields(form){
  const slots = Math.min(shtifoCount.n, FORM_VEHICLE_SLOTS);
  for (let i=0;i<slots;i++){
    const ids = VEHICLE_ENTRIES[i];
    const qty = field("s_qty_"+i);
    const officialType = field("s_type_"+i);
    addEntry(form, ids[0], "כרטיס רכב");
    addEntry(form, ids[1], field("s_plate_"+i));
    addEntry(form, ids[3], "גולדיזל (סולר)");
    addEntry(form, ids[4], mapShtifoTypeToForm(officialType));
    addEntry(form, ids[7], officialType);
    addEntry(form, ids[11], qty);
    if (ids[12]) {
      const more = (i < slots-1)
        ? "כן, הוסף אמצעי תדלוק/רכב נוסף"
        : "לא, סיים את ההזמנה";
      addEntry(form, ids[12], more);
    }
  }
  if (shtifoCount.n > FORM_VEHICLE_SLOTS) {
    const extra = [];
    for (let i=FORM_VEHICLE_SLOTS;i<shtifoCount.n;i++){
      const clean = t => field(t).replace(/[|;]/g, " ");
      extra.push([clean("s_plate_"+i), clean("s_type_"+i), clean("s_qty_"+i)].join("|"));
    }
    addEntry(form, VEHICLE_ENTRIES[FORM_VEHICLE_SLOTS-1][10], SHTIFO_EXTRA_PREFIX + extra.join(";"));
  }
}
function buildJobForm(job){
  const type = job.type;
  const form = document.createElement("form");
  form.action = GFORM_ACTION;
  form.method = "POST";
  form.style.display = "none";
  addHidden(form, "fvv", "1");
  addHidden(form, "pageHistory", pageHistoryValue(type, job.vehicles ? job.vehicles.length : 0));
  addHidden(form, "submissionTimestamp", "-1");
  addCustomerFields(form);
  addEntry(form, E.category, categoryValue(type));
  if (type === "vehicle") addVehicleFields(form, job.vehicles);
  if (type === "driver") addDriverFields(form);
  if (type === "master") addMasterFields(form);
  if (type === "sono") addSonoFields(form);
  if (type === "shtifo") addShtifoFields(form);
  return form;
}
// iframe נפרד לכל שליחה: הגשה חוזרת לאותו iframe לפני שהקודמת נטענה
// מבטלת את הבקשה הקודמת, ובהזמנה מפוצלת יש הרבה שליחות רצופות.
function submitJob(job, n){
  const frame = document.createElement("iframe");
  frame.name = "gform_target_" + n;
  frame.style.display = "none";
  document.body.appendChild(frame);
  const form = buildJobForm(job);
  form.target = frame.name;
  document.body.appendChild(form);
  form.submit();
}
function submitToGoogle(){
  const types = selectedTypes().filter(t => PRODUCT_PANELS.includes(t));
  if (!types.length || submitted) return;
  const jobs = [];
  types.forEach(t => {
    if (t === "vehicle") vehicleBatches().forEach(b => jobs.push({type: t, vehicles: b}));
    else jobs.push({type: t});
  });
  submitted = true;
  $("#nextBtn").disabled = true;
  $("#nextBtn").textContent = "שולח הזמנה...";
  clearDraft();
  // מצב הגיליון לפני השליחה: סופרים רק שורות חדשות, בלי להסתמך על שעון המחשב של הלקוח
  fetchStatus().then(before => {
    let i = 0;
    function sendNext(){
      $("#nextBtn").textContent = jobs.length > 1 ? `שולח הזמנה ${i+1} מתוך ${jobs.length}...` : "שולח הזמנה...";
      submitJob(jobs[i], sendCounter++);
      i += 1;
      if (i < jobs.length) {
        setTimeout(sendNext, 1200);
      } else {
        setTimeout(() => { showSuccess(jobs.length); trackReceipt(jobs, before); }, 900);
      }
    }
    sendNext();
  });
}
let sendCounter = 0;
// ---- אישור קבלה ----
function fetchStatus(){
  if (!STATUS_URL) return Promise.resolve(null);
  const url = `${STATUS_URL}?check=1&hp=${encodeURIComponent(val("hp"))}&email=${encodeURIComponent(val("email"))}&t=${Date.now()}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  return fetch(url, {signal: ctrl.signal})
    .then(r => r.json())
    .then(d => (d && d.ok ? d.rows : null))
    .catch(() => null)
    .finally(() => clearTimeout(timer));
}
function jobLabel(job){
  if (job.type === "vehicle") return `${job.vehicles[0].amtsei} · ${job.vehicles.length} רכבים`;
  return CATEGORY_MAP[job.type];
}
const RECEIPT_TEXT = {
  wait: "ממתין לאישור קבלה...",
  processing: "התקבל, בעיבוד",
  ok: "התקבל ✓",
  error: "התקבל, אבל נכשל בעיבוד. ניצור איתך קשר.",
  missing: "לא אושרה קבלה"
};
function renderReceipt(jobs, states){
  $("#receiptList").innerHTML = jobs.map((job, k) =>
    `<li class="rc-${states[k]}"><span>טופס ${k+1}: ${esc(jobLabel(job))}</span><b>${RECEIPT_TEXT[states[k]]}</b></li>`
  ).join("");
}
// משייך שורות חדשות בגיליון לטפסים שנשלחו, לפי קטגוריה ולפי סדר השליחה
function matchReceipt(jobs, before, rows){
  const seen = {};
  (before || []).forEach(r => { seen[r.category] = (seen[r.category] || 0) + 1; });
  const fresh = {};
  rows.slice().sort((a, b) => a.at - b.at).forEach(r => {
    if (seen[r.category] > 0) { seen[r.category]--; return; }
    (fresh[r.category] = fresh[r.category] || []).push(r.state);
  });
  return jobs.map(job => {
    const list = fresh[CATEGORY_MAP[job.type]];
    return list && list.length ? list.shift() : "wait";
  });
}
function trackReceipt(jobs, before){
  if (!STATUS_URL) return;
  $("#receipt").style.display = "block";
  let states = jobs.map(() => "wait");
  renderReceipt(jobs, states);
  const started = Date.now();
  const LIMIT_MS = 4 * 60000;
  function poll(){
    fetchStatus().then(rows => {
      if (rows) states = matchReceipt(jobs, before, rows);
      renderReceipt(jobs, states);
      const done = states.every(st => st === "ok" || st === "error");
      if (done) return;
      if (Date.now() - started < LIMIT_MS) { setTimeout(poll, 6000); return; }
      states = states.map(st => st === "wait" ? "missing" : st);
      renderReceipt(jobs, states);
      const missing = jobs.filter((_, k) => states[k] === "missing");
      if (missing.length) showResend(missing, before);
    });
  }
  setTimeout(poll, 5000);
}
function showResend(missing, before){
  const box = $("#receiptHelp");
  box.innerHTML = `לא קיבלנו אישור ל-${missing.length === 1 ? "טופס אחד" : missing.length + " טפסים"}. ` +
    `אפשר לשלוח שוב, או לפנות אלינו בטלפון ולציין את שם הלקוח. ` +
    `<button type="button" class="btn btn-primary" id="resendBtn">שליחה חוזרת</button>`;
  box.style.display = "block";
  $("#resendBtn").addEventListener("click", () => {
    box.style.display = "none";
    let i = 0;
    (function next(){
      submitJob(missing[i], sendCounter++);
      i += 1;
      if (i < missing.length) setTimeout(next, 1200);
      else setTimeout(() => trackReceipt(missing, before), 900);
    })();
  });
}
function showSuccess(docCount){
  const email = esc(val("email"));
  $("#successDocs").innerHTML = docCount > 1
    ? `ההזמנה פוצלה ל-<b>${docCount} טפסים נפרדים</b>, ולכן יגיעו אל <b>${email}</b> ${docCount} מסמכים נפרדים לחתימה. יש לחתום על כל אחד מהם. זו לא כפילות.`
    : `מסמך לחתימה יישלח אל <b>${email}</b>.`;
  $("#wizard").style.display = "none";
  $("#steps").style.display = "none";
  document.querySelector(".head").style.display = "none";
  $("#successMessage").style.display = "block";
}
// ---- קליטת הזמנה מקובץ אקסל ----
// הכותרות זהות ל-scripts/make_template.py. ההתאמה לפי שם הכותרת (לא לפי מיקום),
// כדי שעמודה שהלקוח הזיז או הוסיף לא תשבש את הקריאה.
const EXCEL_COLUMNS = [
  {key:"amtsei", header:"סוג אמצעי תדלוק", list:AMTSEI, required:true},
  {key:"plate",  header:"מס׳ רכב", required:true},
  {key:"phone",  header:"מס׳ טלפון נהג"},
  {key:"fuel",   header:"סוג דלק", list:FUEL, required:true},
  {key:"type",   header:"סוג הרכב", list:VTYPES, required:true},
  {key:"day",    header:"הגבלה בליטרים ליום"},
  {key:"month",  header:"הגבלה בליטרים לחודש"},
  {key:"model",  header:"דגם רכב"},
  {key:"year",   header:"שנת יצור"},
  {key:"driver", header:"שם נהג"},
  {key:"dept",   header:"קוד / שם מחלקה"},
  {key:"shtifo", header:"שטיפומט", list:SHTIFO.map(o => o.v)}
];
const XLSX_URL = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
// גרש וגרשיים עבריים ולטיניים מתחלפים בהקלדה ובהעתקה מוורד, ולכן משווים אחרי נרמול
function norm(t){
  return String(t ?? "").replace(/[׳'`’]/g, "'").replace(/[״"“”]/g, '"')
    .replace(/\*/g, "").replace(/\s+/g, " ").trim();
}
function matchList(value, list){
  const n = norm(value);
  return list.find(o => norm(o) === n) || null;
}
let xlsxLoading = null;
// הספרייה נטענת רק כשמעלים קובץ, כדי לא להאט את הטופס ללקוח שממלא ידנית
function loadXlsx(){
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!xlsxLoading) {
    xlsxLoading = new Promise((resolve, reject) => {
      const sc = document.createElement("script");
      sc.src = XLSX_URL;
      sc.onload = () => resolve(window.XLSX);
      sc.onerror = () => { xlsxLoading = null; reject(new Error("load")); };
      document.head.appendChild(sc);
    });
  }
  return xlsxLoading;
}
function findSheetRows(XLSX, wb){
  const names = wb.SheetNames.includes("הזמנה") ? ["הזמנה", ...wb.SheetNames] : wb.SheetNames;
  const plateHeader = norm("מס׳ רכב");
  for (const name of names) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], {header:1, raw:false, defval:""});
    const h = rows.findIndex(r => r.some(c => norm(c) === plateHeader));
    if (h >= 0) return {header: rows[h], data: rows.slice(h + 1), firstRow: h + 2};
  }
  return null;
}
function parseOrderRows(found){
  const colIndex = {};
  const missing = [];
  EXCEL_COLUMNS.forEach(c => {
    const idx = found.header.findIndex(h => norm(h) === norm(c.header));
    if (idx >= 0) colIndex[c.key] = idx;
    else if (c.required) missing.push(c.header);
  });
  if (missing.length) {
    return {errors: ["חסרות עמודות חובה: " + missing.join(", ") + ". יש להשתמש בתבנית שבקישור."], items: []};
  }
  const items = [];
  const errors = [];
  found.data.forEach((row, r) => {
    const rowNo = found.firstRow + r;
    const raw = {};
    EXCEL_COLUMNS.forEach(c => {
      raw[c.key] = colIndex[c.key] === undefined ? "" : String(row[colIndex[c.key]] ?? "").trim();
    });
    if (!Object.values(raw).some(Boolean)) return;
    const item = {};
    const rowErr = [];
    EXCEL_COLUMNS.forEach(c => {
      let v = raw[c.key];
      if (c.key === "shtifo" && !v) v = "לא";
      if (!v) {
        if (c.required) rowErr.push(`חסר «${c.header}»`);
        item[c.key] = "";
        return;
      }
      if (c.list) {
        const m = matchList(v, c.list);
        if (!m) { rowErr.push(`«${v}» אינו ערך תקין ב«${c.header}»`); return; }
        v = m;
      }
      item[c.key] = v;
    });
    if (rowErr.length) errors.push(`שורה ${rowNo}: ${rowErr.join("; ")}`);
    else items.push(item);
  });
  if (!items.length && !errors.length) errors.push("לא נמצאו רכבים בקובץ.");
  if (items.length > MAX_VEHICLES) {
    errors.push(`הקובץ מכיל ${items.length} רכבים. המקסימום בהזמנה אחת הוא ${MAX_VEHICLES}.`);
  }
  const seen = new Set();
  items.forEach(it => {
    const k = it.plate.replace(/\D/g, "");
    if (k && seen.has(k)) errors.push(`מס׳ רכב ${it.plate} מופיע יותר מפעם אחת.`);
    seen.add(k);
  });
  return {errors, items};
}
function showImportResult(ok, html){
  const box = $("#excelResult");
  box.className = "import-result " + (ok ? "ok" : "bad");
  box.innerHTML = html;
  box.style.display = "block";
}
async function importExcel(file){
  let XLSX;
  try { XLSX = await loadXlsx(); }
  catch (e) {
    showImportResult(false, "לא ניתן לטעון את רכיב קריאת האקסל. בדקו את החיבור לאינטרנט ונסו שוב.");
    return;
  }
  let found;
  try {
    const wb = XLSX.read(await file.arrayBuffer(), {type:"array"});
    found = findSheetRows(XLSX, wb);
  } catch (e) {
    showImportResult(false, "לא ניתן לקרוא את הקובץ. יש להעלות קובץ אקסל (xlsx) לפי התבנית.");
    return;
  }
  if (!found) {
    showImportResult(false, "לא נמצאה שורת כותרות בקובץ. יש להשתמש בתבנית שבקישור.");
    return;
  }
  const {errors, items} = parseOrderRows(found);
  if (errors.length) {
    const shown = errors.slice(0, 15).map(e => `<li>${esc(e)}</li>`).join("");
    const more = errors.length > 15 ? `<li>ועוד ${errors.length - 15} שגיאות...</li>` : "";
    showImportResult(false, `<b>הקובץ לא נקלט. יש לתקן ולהעלות שוב:</b><ul>${shown}${more}</ul>`);
    return;
  }
  // קובץ מחליף את הרכבים שכבר הוזנו, כדי שהעלאה חוזרת של קובץ מתוקן לא תכפיל רכבים
  $("#vehiclesList").innerHTML = "";
  vehicleCount.n = 0;
  items.forEach(it => addVehicle(it));
  const batches = vehicleBatches();
  const split = batches.length > 1
    ? `<br>ההזמנה תישלח כ-${batches.length} טפסים נפרדים (עד ${FORM_VEHICLE_SLOTS} רכבים בטופס, טופס נפרד לכל סוג אמצעי תדלוק).`
    : "";
  saveDraft();
  showImportResult(true, `<b>נקלטו ${items.length} רכבים מהקובץ.</b> אפשר לבדוק ולתקן אותם למטה לפני ההמשך.${split}`);
}
$("#excelFile").addEventListener("change", (ev) => {
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (file) importExcel(file);
});
document.querySelectorAll('input[name="order_type"]').forEach(el => {
  el.addEventListener("change", () => {
    if (el.value==="vehicle" && el.checked && vehicleCount.n===0) addVehicle();
    if (el.value==="driver" && el.checked && driverCount.n===0) addDriver();
    if (el.value==="shtifo" && el.checked && shtifoCount.n===0) addShtifoVehicle();
    rebuildPath();
    renderSteps();
  });
});
$("#addVehicle").addEventListener("click", () => addVehicle());
$("#addDriver").addEventListener("click", () => addDriver());
$("#addShtifo").addEventListener("click", () => addShtifoVehicle());
document.addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-remove]");
  if (!btn) return;
  ev.preventDefault();
  removeItem(btn.dataset.remove, Number(btn.dataset.i));
});
$("#prevBtn").addEventListener("click", () => { step = Math.max(0, step-1); renderSteps(); });
$("#nextBtn").addEventListener("click", () => {
  if (!validate()) return;
  if (currentPanel()==="choose") rebuildPath();
  if (currentPanel()==="summary") { submitToGoogle(); return; }
  step += 1;
  if (currentPanel()==="summary") buildSummary();
  renderSteps();
});
// ---- טיוטה ----
// נשמרת בדפדפן של הלקוח בלבד (localStorage), כדי שרענון או סגירה בטעות
// לא ימחקו הזמנה ארוכה. נמחקת ברגע השליחה. הגישה עטופה ב-try כי בגלישה
// פרטית או עם חסימת עוגיות localStorage זורק שגיאה.
const DRAFT_KEY = "keshet-order-draft-v1";
const DRAFT_FIELDS = ["company","hp","phone","address","email","sig1_name",
  "master_qty","master_fuel","master_day","master_month",
  "sono_100","sono_150","sono_200","sono_250","sono_500","sono_1000"];
let draftTimer = null;
function saveDraft(){
  if (submitted) return;
  const d = {
    saved: Date.now(), step,
    fields: Object.fromEntries(DRAFT_FIELDS.map(id => [id, val(id)])),
    types: selectedTypes(), sono_fuel: radio("sono_fuel"),
    vehicles: collectVehicles(), drivers: collectDrivers(), shtifo: collectShtifo()
  };
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch (e) {}
}
function scheduleDraft(){
  clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, 400);
}
function clearDraft(){
  clearTimeout(draftTimer);
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
}
function readDraft(){
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { return null; }
}
function restoreDraft(d){
  Object.entries(d.fields || {}).forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.value = v; });
  document.querySelectorAll('input[name="order_type"]').forEach(el => { el.checked = (d.types || []).includes(el.value); });
  if (d.sono_fuel) { const r = document.querySelector(`input[name="sono_fuel"][value="${d.sono_fuel}"]`); if (r) r.checked = true; }
  (d.vehicles || []).forEach(it => addVehicle(it));
  (d.drivers || []).forEach(it => addDriver(it));
  (d.shtifo || []).forEach(it => addShtifoVehicle(it));
  if (wants("vehicle") && vehicleCount.n === 0) addVehicle();
  if (wants("driver") && driverCount.n === 0) addDriver();
  if (wants("shtifo") && shtifoCount.n === 0) addShtifoVehicle();
  rebuildPath();
  step = Math.min(d.step || 0, path.length - 1);
  renderSteps();
}
function offerDraft(){
  const d = readDraft();
  if (!d || !d.fields) return;
  const when = new Date(d.saved).toLocaleString("he-IL", {dateStyle:"short", timeStyle:"short"});
  const who = d.fields.company ? ` של «${esc(d.fields.company)}»` : "";
  const bar = $("#draftBar");
  bar.innerHTML = `<span>נמצאה הזמנה שלא נשלחה${who} (נשמרה ${esc(when)}).</span>` +
    `<button type="button" class="btn btn-primary" id="draftResume">להמשיך ממנה</button>` +
    `<button type="button" class="btn btn-ghost" id="draftDiscard">להתחיל מחדש</button>`;
  bar.style.display = "flex";
  $("#draftResume").addEventListener("click", () => { bar.style.display = "none"; restoreDraft(d); });
  $("#draftDiscard").addEventListener("click", () => { bar.style.display = "none"; clearDraft(); });
}
$("#wizard").addEventListener("input", scheduleDraft);
$("#wizard").addEventListener("change", scheduleDraft);
$("#wizard").addEventListener("click", (ev) => { if (ev.target.closest("button")) scheduleDraft(); });
renderSteps();
offerDraft();
