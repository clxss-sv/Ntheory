(function(){
  "use strict";

  var YEAR_DAYS = 365.25;
  var LADELES = 0.055;

  var ANIMAL = { fish: 0.00225, chickenMeat: 0.0505, chickenEgg: 0.125 };

  var VEG = [
    { key:"banana", th:"กล้วย", yield:1.75, water:5.00, days:32 },
    { key:"sesban", th:"แคบ้าน", yield:1.20, water:3.50, days:30 },
    { key:"climbing_wattle", th:"ชะอม", yield:1.80, water:4.00, days:30 },
    { key:"lime", th:"มะนาว", yield:2.00, water:4.50, days:40 },
    { key:"mini_chill", th:"พริกขี้หนูสวน", yield:2.40, water:3.13, days:40 },
    { key:"eggplant", th:"มะเขือเปราะ", yield:3.50, water:3.75, days:22 },
    { key:"lemon_grass", th:"ตะไคร้", yield:1.80, water:4.50, days:30 },
    { key:"galangal", th:"ข่า", yield:2.20, water:3.50, days:30 },
    { key:"sweet_basil", th:"กะเพรา", yield:3.60, water:4.80, days:30 },
    { key:"basil", th:"โหระพา", yield:4.20, water:5.20, days:30 },
    { key:"water_spinach", th:"ผักบุ้งจีน", yield:2.00, water:5.00, days:60 },
    { key:"cabbage", th:"กะหล่ำปลี", yield:5.40, water:3.50, days:35 },
    { key:"lettuce", th:"ผักกาดขาว", yield:4.40, water:6.25, days:35 }
  ];

  var VEG_DEFAULTS = {
    banana:0.200, sesban:0.050, climbing_wattle:0.060, lime:0.030, mini_chill:0.040,
    eggplant:0.030, lemon_grass:0.040, galangal:0.040, sweet_basil:0.060, basil:0.060,
    water_spinach:0.080, cabbage:0.075, lettuce:0.075
  };

  function computeRice(inp){
    var R_yield = inp.riceYield * 0.60;
    var minBase = YEAR_DAYS * inp.people * (LADELES*4);
    var maxBase = YEAR_DAYS * inp.people * (LADELES*6);

    var fishTerm = YEAR_DAYS * inp.fish * ANIMAL.fish;
    var meatTerm = YEAR_DAYS * inp.chickenMeat * ANIMAL.chickenMeat;
    var eggTerm  = YEAR_DAYS * inp.chickenEgg * ANIMAL.chickenEgg;
    var animalSum = fishTerm + meatTerm + eggTerm;

    var growth = 1 + inp.k/100;
    var valid = R_yield > 0;

    var xMin = valid ? growth * (minBase + animalSum*0) / R_yield : NaN;
    var xMax = valid ? growth * (maxBase + animalSum*0) / R_yield : NaN;

    return { xMin: xMin, xMax: xMax, valid: valid };
  }

  function computeVegetable(inp){
    var sumEq = 0;
    VEG.forEach(function(v){ sumEq += (inp.perPerson[v.key] || 0) / v.yield; });
    var fishMin = 0.0005, fishMax = 0.004;
    var yMin = (inp.people * (YEAR_DAYS * sumEq)) + (inp.fish * fishMin) * 0;
    var yMax = (inp.people * (YEAR_DAYS * sumEq)) + (inp.fish * fishMax) * 0;
    var yAvg = (yMin + yMax) / 2;
    return { yMin: yMin, yMax: yMax, yAvg: yAvg };
  }

  function computeWater(inp){
    var sumVegWater = 0;
    VEG.forEach(function(v){ sumVegWater += (v.water/1000) * v.days; });
    var W_need = YEAR_DAYS * sumVegWater;
    var factor = 1 + inp.k/100;
    var water = (((2/3) * W_need) * factor) / 1.70;
    return { water: water, W_need: W_need };
  }

  function computeSell(inp){
    var M_egg=27.5, M_meat=21.5, M_fish=25;
    var priceLime=85, priceChill=150, priceWattle=135;
    var areaLime=0.48, areaChill=0.75, areaWattle=0.75;
    var vEgg=0.120, vMeat=0.090, vFish=0.090;

    var fEgg = inp.egg * vEgg;
    var fMeat = inp.meat * vMeat;
    var fFish = inp.fish * vFish;

    var sumPrice = priceLime + priceChill + priceWattle;
    var sumArea = areaLime + areaChill + areaWattle;

    var areaNeed = ((fEgg*M_egg) + (fMeat*M_meat) + (fFish*M_fish)) * YEAR_DAYS * sumArea / sumPrice;
    return { areaNeed: areaNeed };
  }

  function fmt(n, digits){
    if (digits === undefined) digits = 2;
    if (!isFinite(n)) return "—";
    return n.toLocaleString("th-TH", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function readNum(id, fallback){
    if (fallback === undefined) fallback = 0;
    var el = document.getElementById(id);
    if (!el) return fallback;
    var v = parseFloat(el.value);
    return isNaN(v) ? fallback : v;
  }

  function buildVegFields(){
    var container = document.getElementById("veg-fields");
    var html = "";
    VEG.forEach(function(v){
      html += '<div class="field">' +
        '<label for="veg-' + v.key + '">' + v.th + ' <span class="unit">(กก./คน/วัน)</span></label>' +
        '<input type="number" id="veg-' + v.key + '" min="0" step="0.001">' +
        '</div>';
    });
    container.innerHTML = html;
  }

  function render(){
    // Rice
    var riceRes = computeRice({
      riceYield: readNum("rice-yield"),
      people: readNum("rice-people"),
      fish: readNum("rice-fish"),
      chickenMeat: readNum("rice-meat"),
      chickenEgg: readNum("rice-egg"),
      k: readNum("rice-k")
    });
    var riceOutEl = document.getElementById("rice-out");
    var riceNoteEl = document.getElementById("rice-out-note");
    if (riceRes.valid){
      riceOutEl.textContent = fmt((riceRes.xMin + riceRes.xMax) / 2);
      riceNoteEl.hidden = true;
    } else {
      riceOutEl.textContent = "—";
      riceNoteEl.hidden = false;
    }
    var riceAvg = riceRes.valid ? (riceRes.xMin + riceRes.xMax) / 2 : 0;

    // Vegetable
    var perPerson = {};
    VEG.forEach(function(v){ perPerson[v.key] = readNum("veg-" + v.key, 0); });
    var vegRes = computeVegetable({
      people: readNum("veg-people"),
      fish: readNum("veg-fish"),
      perPerson: perPerson
    });
    document.getElementById("veg-out-avg").textContent = fmt(vegRes.yAvg);

    // Water
    var waterRes = computeWater({ k: readNum("water-k") });
    document.getElementById("water-out").textContent = fmt(waterRes.water);
    document.getElementById("water-out-need").textContent = fmt(waterRes.W_need);

    // Sell
    var sellRes = computeSell({
      egg: readNum("sell-egg"),
      meat: readNum("sell-meat"),
      fish: readNum("sell-fish")
    });
    document.getElementById("sell-out").textContent = fmt(sellRes.areaNeed);

    // Summary - รวมพื้นที่ 4 ส่วน โดย 100% มาจากอัตราส่วนของ 4 ส่วนนี้เท่านั้น
    var vegCombo = vegRes.yAvg + sellRes.areaNeed;
    var houseArea = readNum("house-area", 150);
    document.getElementById("house-out").textContent = fmt(houseArea);

    var zones = [
      { label:"บ่อน้ำ", value: waterRes.water, color:"var(--water)" },
      { label:"นาข้าว", value: riceAvg, color:"var(--rice)" },
      { label:"พื้นแปลงผัก บริโภค + ขาย", value: vegCombo, color:"var(--crop)" },
      { label:"ที่อยู่อาศัย", value: houseArea, color:"var(--soil)" }
    ];

    var total = zones.reduce(function(s, z){ return s + z.value; }, 0);

    document.getElementById("sum-total").textContent = fmt(total) + " ตร.ม.";

    // Render Pie Chart - 4 ส่วนรวมกันเป็น 100% เสมอ
    var pieEl = document.getElementById("pie-chart");
    var legEl = document.getElementById("chart-legend");
    var gradientStops = [];
    var cumulativePercent = 0;

    legEl.innerHTML = "";

    zones.forEach(function(z){
      var pct = total > 0 ? (z.value / total) * 100 : 0;

      if (pct > 0) {
        gradientStops.push(z.color + " " + cumulativePercent + "% " + (cumulativePercent + pct) + "%");
        cumulativePercent += pct;
      }
      legEl.innerHTML += '<div style="display:flex; align-items:center;"><span class="dot" style="background:' + z.color + '"></span>' + z.label + ' (' + fmt(pct, 0) + '%)</div>';
    });

    if (gradientStops.length > 0) {
      pieEl.style.background = "conic-gradient(" + gradientStops.join(", ") + ")";
    } else {
      pieEl.style.background = "#ccc";
    }

    // Render Table
    var tbody = document.getElementById("sum-table-body");
    tbody.innerHTML = "";
    zones.forEach(function(z){
      var pct = total > 0 ? (z.value / total) * 100 : 0;
      var tr = document.createElement("tr");
      tr.innerHTML = '<td><span class="dot" style="background:' + z.color + '"></span>' + z.label + '</td>' +
        '<td>' + fmt(z.value) + ' ตร.ม.</td><td>' + fmt(pct, 0) + '%</td>';
      tbody.appendChild(tr);
    });
  }

  function resetDefaults(){
    var defaults = {
      "rice-yield": 0.35, "rice-people": 1, "rice-fish": 0, "rice-meat": 0, "rice-egg": 0, "rice-k": 0,
      "veg-people": 1, "veg-fish": 0,
      "water-k": 30,
      "sell-egg": 4, "sell-meat": 16, "sell-fish": 27,
      "house-area": 150
    };
    VEG.forEach(function(v){ defaults["veg-" + v.key] = VEG_DEFAULTS[v.key]; });
    Object.keys(defaults).forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.value = defaults[id];
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", function(){
    buildVegFields();
    document.getElementById("app").addEventListener("input", render);
    document.getElementById("reset-btn").addEventListener("click", resetDefaults);
    resetDefaults();
  });
})();
