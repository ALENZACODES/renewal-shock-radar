(function () {
  const $ = (s) => document.querySelector(s),
    C = window.Calc,
    money = (v) => "$" + Math.round(v).toLocaleString("en-CA");
  const S = [
    [
      "Bank of Canada, Staff Analytical Note 2025-21, How will mortgage payments change at renewal? An updated analysis (July 2025)",
      "https://www.bankofcanada.ca/2025/07/staff-analytical-note-2025-21/",
    ],
    [
      "Bank of Canada, Staff Analytical Note 2025-1, Using new loan data to better understand mortgage holders (January 2025)",
      "https://www.bankofcanada.ca/2025/01/staff-analytical-note-2025-1/",
    ],
    [
      "CMHC, Residential Mortgage Industry Report, Fall 2025",
      "https://eppd1strscr01.blob.core.windows.net/cmhcprdcontainer/sf/project/archive/publications/residential_mortgage_industry_report/residential-mortgage-industry-report-fall-2025-en.pdf",
    ],
    [
      "CMHC, Residential Mortgage Industry Report (2026 edition)",
      "https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/housing-research/research-reports/housing-finance/residential-mortgage-industry-report",
    ],
    [
      "CMHC news release, Renewal wave peaks but still dominates mortgage market (2026)",
      "https://www.cmhc-schl.gc.ca/media-newsroom/news-releases/2026/renewal-wave-peaks-still-dominates-mortgage-market",
    ],
    [
      "Interest Act, s.6 (semi-annual compounding on blended payment mortgages)",
      "https://laws-lois.justice.gc.ca/eng/acts/i-15/page-1.html",
    ],
  ];
  $("#src").innerHTML = S.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join("");
  const H = [
    ["~60%", "of outstanding mortgages renew in 2025 or 2026", 1],
    ["+10% / +6%", "average payment change vs Dec 2024, 2025 and 2026 renewers", 1],
    ["15 to 20%", "average increase for 5-year fixed holders renewing 2025 or 2026", 1],
    ["~1/3", "of all mortgage holders face a higher payment", 1],
    ["$245,000", "median principal owing on outstanding mortgages", 2],
    ["0.24%", "national 90+ day delinquency, Q4 2025 (0.21% a year earlier)", 4],
  ];
  $("#hero").innerHTML = H.map(
    ([v, l, s]) =>
      `<div class="kpi"><div class="v">${v}</div><div class="s">${l}</div><a href="#src">Source ${s}</a></div>`,
  ).join("");
  const F = [
    ["loan", "Original loan", 245000, 50000, 1200000, 5000, money],
    ["origRate", "Rate you locked (%)", 2.0, 0.5, 7, 0.05, (v) => v.toFixed(2) + "%"],
    ["newRate", "Renewal rate (%)", 4.2, 1, 8, 0.05, (v) => v.toFixed(2) + "%"],
    ["amort", "Original amortization (yrs)", 25, 10, 30, 1, (v) => v + " yrs"],
    ["term", "Term just ended (yrs)", 5, 1, 5, 1, (v) => v + " yrs"],
    ["income", "Household income / yr", 110000, 30000, 400000, 1000, money],
  ];
  const p = new URLSearchParams(location.hash.slice(1));
  $("#sliders").innerHTML = F.map(
    ([k, l, d, mn, mx, st]) =>
      `<label for="s_${k}">${l} <span class="out" id="o_${k}"></span></label><input type="range" id="s_${k}" min="${mn}" max="${mx}" step="${st}" value="${p.has(k) ? +p.get(k) : d}">`,
  ).join("");
  function v() {
    const o = {};
    F.forEach(([k, , , , , , f]) => {
      o[k] = +$("#s_" + k).value;
      $("#o_" + k).textContent = f(o[k]);
    });
    return o;
  }
  function run() {
    const o = v(),
      r = C.shock(o),
      b = C.band(r.pct);
    history.replaceState(null, "", "#" + new URLSearchParams(o));
    $("#kpis").innerHTML = [
      ["Payment before", money(r.oldPmt), "per month"],
      ["Payment at renewal", money(r.newPmt), "same payoff date"],
      [
        "Change",
        (r.change >= 0 ? "+" : "") + money(r.change) + " (" + r.pct.toFixed(1) + "%)",
        b + " shock",
        r.pct < 5,
      ],
      [
        "Share of gross income",
        r.shareOld.toFixed(1) + "% to " + r.shareNew.toFixed(1) + "%",
        "principal and interest only",
      ],
      ["Balance at renewal", money(r.balance), "after " + o.term + " yrs of payments"],
      [
        "Amortization to keep old payment",
        r.keepPaymentYears ? r.keepPaymentYears.toFixed(1) + " yrs" : "over 40 yrs",
        "remaining, if a lender allows it",
      ],
    ]
      .map(
        ([l, x, s, ok]) =>
          `<div class="kpi"><div class="l">${l}</div><div class="v ${ok === true ? "good" : ok === false ? "bad" : ""}">${x}</div><div class="s">${s}</div></div>`,
      )
      .join("");
    $("#needle").style.left = Math.max(0, Math.min(98, (r.pct / 45) * 100)) + "%";
    const rates = [];
    for (let x = 1; x <= 8.001; x += 0.25) rates.push(+x.toFixed(2));
    Charts.line($("#curve"), {
      xLabels: rates.map((x) => x + "%"),
      series: [
        { name: "Payment change at renewal (%)", color: "#4f8cff", data: C.curve(o, rates), fill: 1 },
        {
          name: "BoC average for 5-year fixed, upper end (20%)",
          color: "#f5b041",
          dash: "5 4",
          data: rates.map(() => 20),
        },
      ],
      fmt: (x) => x.toFixed(0) + "%",
      title: "Payment change by renewal rate",
    });
    Charts.bar($("#wave"), {
      labels: ["2026", "2027"],
      values: [1150000, 940000],
      colors: ["#4f8cff", "#22c3a6"],
      fmt: (x) => (x / 1e6).toFixed(2) + "M",
      title: "Mortgages renewing",
    });
    $("#notes").innerHTML =
      `<h2>Reading this</h2><p>At ${o.newRate.toFixed(2)}%, this household's payment moves from ${money(r.oldPmt)} to ${money(r.newPmt)} a month if they keep the same payoff date. The Bank of Canada estimates five-year fixed holders renewing in 2025 or 2026 face average increases of about 15 to 20% versus December 2024 (source 1). CMHC counts about 1.15 million renewals in 2026 and 940,000 in 2027 (source 3), and notes average rates eased from about 4.8% in January 2025 to about 4.2% in January 2026 (source 4).</p><p>Options worth asking a licensed professional about: extending amortization, a shorter term, prepaying before renewal, or switching lenders. Each has costs and qualification rules.</p>`;
  }
  document.querySelectorAll("#sliders input").forEach((e) => e.addEventListener("input", run));
  run();
})();
