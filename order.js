const PANEL_LABELS = {
  customer: "לקוח",
  choose: "מה מזמינים",
  vehicle: "דלקן",
  driver: "נהג",
  master: "מאסטר",
  sono: "סונוקאש",
  summary: "שליחה"
};
const PRODUCT_PANELS = ["vehicle","driver","master","sono"];
const CATEGORY_MAP = {
  vehicle: "כרטיס רכב או דלקן",
  driver: "כרטיס נהג",
  master: "כרטיס מאסטר",
  sono: "סונוקאש"
};
const AMTSEI = ["כרטיס רכב","דלקן א'","דלקן ב (רושם ק\"מ)","דלקן אוריאה","כרטיס אוריאה"];
const FUEL = ["בנזין 95","בנזין 98","גולדיזל (סולר)","אוריאה"];
const FUEL_ALL = ["ALL - כללי","בנזין 95","בנזין 98","גולדיזל (סולר)","אוריאה"];
const VTYPES = ["פרטי","מסחרי","משאית","אוטובוס","אופנוע","אחר"];
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
    options.map(o => `<option value="${o}">${o}</option>`).join("") +
    `</select>`;
}

function shtifoSel(name){
  return `<select name="${name}" required>` +
    `<option value="">בחירה</option>` +
    SHTIFO.map(o => `<option value="${o.v}">${o.t}</option>`).join("") +
    `</select>`;
}

function addVehicle(){
  if (vehicleCount.n >= 10) return;
  const i = vehicleCount.n++;
  const wrap = document.createElement("div");
  wrap.className = "card-block";
  wrap.dataset.v = i;
  wrap.innerHTML = `
    <h3>רכב / דלקן ${i+1}</h3>
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
  $("#addVehicle").style.display = vehicleCount.n >= 10 ? "none" : "inline-block";
}
function label(t, req){ return `<label>${t}${req?' <span class="req">*</span>':''}</label>`; }

function addDriver(){
  if (driverCount.n >= 2) return;
  const i = driverCount.n++;
  const wrap = document.createElement("div");
  wrap.className = "card-block";
  wrap.innerHTML = `
    <h3>כרטיס נהג ${i+1}</h3>
    <div class="grid">
      <div>${label("שם הנהג", true)}<input type="text" name="d_name_${i}"></div>
      <div>${label("מס׳ זהות נהג", true)}<input type="text" name="d_id_${i}"></div>
      <div class="span-2">${label("סוג דלק", true)}${sel("d_fuel_"+i, FUEL_ALL, true)}</div>
      <div>${label("הגבלת צריכה יומית בליטרים")}<input type="text" name="d_day_${i}"></div>
      <div>${label("הגבלת צריכה חודשית בליטרים", true)}<input type="text" name="d_month_${i}"></div>
    </div>`;
  $("#driversList").appendChild(wrap);
  $("#addDriver").style.display = driverCount.n >= 2 ? "none" : "inline-block";
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
  return true;
}

function categoryValue(){
  const first = PRODUCT_PANELS.find(t => wants(t));
  return first ? CATEGORY_MAP[first] : "";
}

function buildSummary(){
  const lines = [
    `<b>${val("company")}</b> · ${val("hp")}`,
    val("address"),
    `${val("phone")} · ${val("email")}`,
    `מורשה חתימה: ${val("sig1_name")}`,
    `דלקן/רכב: ${wants("vehicle") ? vehicleCount.n+" פריטים" : "לא"}`,
    `כרטיס נהג: ${wants("driver") ? driverCount.n+" כרטיסים" : "לא"}`,
    `מאסטר: ${wants("master") ? val("master_qty")+" כרטיסים" : "לא"}`,
    `סונוקאש: ${wants("sono") ? (radio("sono_fuel") || "כן") : "לא"}`
  ];
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

function pageHistoryValue(){
  const pages = [0, 1];
  if (wants("vehicle")) {
    for (let i = 0; i < vehicleCount.n; i++) pages.push(5 + i);
  }
  if (wants("driver")) {
    pages.push(2);
    if (driverCount.n > 1) pages.push(3);
  }
  if (wants("master")) pages.push(4);
  if (wants("sono")) pages.push(15);
  return pages.join(",");
}

function submitToGoogle(){
  const form = $("#gform");
  form.innerHTML = "";
  addHidden(form, "fvv", "1");
  addHidden(form, "pageHistory", pageHistoryValue());
  addHidden(form, "submissionTimestamp", "-1");
  addEntry(form, E.company, val("company"));
  addEntry(form, E.hp, val("hp"));
  addEntry(form, E.phone, val("phone"));
  addEntry(form, E.address, val("address"));
  addEntry(form, E.email, val("email"));
  addEntry(form, E.sig1_name, val("sig1_name"));
  addEntry(form, E.category, categoryValue());

  if (wants("vehicle")) {
    for (let i=0;i<vehicleCount.n;i++){
      const ids = VEHICLE_ENTRIES[i];
      addEntry(form, ids[0], field("v_amtsei_"+i));
      addEntry(form, ids[1], field("v_plate_"+i));
      addEntry(form, ids[2], field("v_phone_"+i));
      addEntry(form, ids[3], field("v_fuel_"+i));
      addEntry(form, ids[4], field("v_type_"+i));
      addEntry(form, ids[5], field("v_day_"+i));
      addEntry(form, ids[6], field("v_month_"+i));
      addEntry(form, ids[7], field("v_model_"+i));
      addEntry(form, ids[8], field("v_year_"+i));
      addEntry(form, ids[9], field("v_driver_"+i));
      addEntry(form, ids[10], field("v_dept_"+i));
      addEntry(form, ids[11], field("v_shtifo_"+i));
      if (ids[12]) {
        const more = (i < vehicleCount.n-1)
          ? "כן, הוסף אמצעי תדלוק/רכב נוסף"
          : "לא, סיים את ההזמנה";
        addEntry(form, ids[12], more);
      }
    }
  }

  if (wants("driver")) {
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

  if (wants("master")) {
    addEntry(form, E.master_qty, val("master_qty"));
    addEntry(form, E.master_fuel, val("master_fuel"));
    addEntry(form, E.master_day, val("master_day"));
    addEntry(form, E.master_month, val("master_month"));
  }

  if (wants("sono")) {
    addEntry(form, E.sono_fuel, radio("sono_fuel"));
    const denoms = ["sono_100","sono_150","sono_200","sono_250","sono_500","sono_1000"];
    denoms.forEach((id, idx) => addEntry(form, E.sono_denoms[idx], val(id)));
  }

  submitted = true;
  form.submit();
  setTimeout(showSuccess, 900);
}

function showSuccess(){
  $("#wizard").style.display = "none";
  $("#steps").style.display = "none";
  document.querySelector(".head").style.display = "none";
  $("#successMessage").style.display = "block";
}

document.getElementById("hidden_iframe").addEventListener("load", function(){
  if (submitted) showSuccess();
});

document.querySelectorAll('input[name="order_type"]').forEach(el => {
  el.addEventListener("change", () => {
    if (el.value==="vehicle" && el.checked && vehicleCount.n===0) addVehicle();
    if (el.value==="driver" && el.checked && driverCount.n===0) addDriver();
    rebuildPath();
    renderSteps();
  });
});

$("#addVehicle").addEventListener("click", addVehicle);
$("#addDriver").addEventListener("click", addDriver);
$("#prevBtn").addEventListener("click", () => { step = Math.max(0, step-1); renderSteps(); });
$("#nextBtn").addEventListener("click", () => {
  if (!validate()) return;
  if (currentPanel()==="choose") rebuildPath();
  if (currentPanel()==="summary") { submitToGoogle(); return; }
  step += 1;
  if (currentPanel()==="summary") buildSummary();
  renderSteps();
});

renderSteps();
