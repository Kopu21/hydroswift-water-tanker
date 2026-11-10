/**
 * HYDROSWIFT WATER TANKER SUPPLY SERVICE - APPLICATION ENGINE
 * Features: SPA Navigation, RTL/LTR Mirroring, Dark/Light Themes,
 *           Live Tanker Booking Wizard, GPS Delivery Tracker Simulator,
 *           Real-time Rate Calculator & Certified Invoice Generator.
 */

// Application State
const savedOrders = localStorage.getItem('hs_orders');
const initialOrders = [
  { id: 'TK-99420', date: 'Nov 04, 2026', type: '3,000L Potable RO+UV', driver: 'Marcus Vance (#4028)', tds: '68 PPM', total: '$42.00', status: 'In Transit' },
  { id: 'TK-98841', date: 'Oct 28, 2026', type: '3,000L Potable RO+UV', driver: 'Devon Miller (#3012)', tds: '72 PPM', total: '$42.00', status: 'Delivered' },
  { id: 'TK-97103', date: 'Oct 15, 2026', type: '10,000L Pool Fresh Water', driver: 'Carlos Ortiz (#7841)', tds: '110 PPM', total: '$89.00', status: 'Delivered' },
  { id: 'TK-95490', date: 'Sep 30, 2026', type: '5,000L Domestic Sump Water', driver: 'Devon Miller (#3012)', tds: '140 PPM', total: '$58.00', status: 'Delivered' }
];

const appState = {
  activePage: 'home1',
  activeDashTab: 'live-track',
  currentTheme: localStorage.getItem('hs_theme') || 'light',
  currentDir: localStorage.getItem('hs_dir') || 'ltr',
  user: {
    isLoggedIn: true,
    name: 'Sarah Jenkins',
    accountType: 'Residential Premium',
    accountId: 'HS-88219',
    phone: '9876543210',
    email: 'sarah.jenkins@hydroswift.com',
    address: '742 Evergreen Terrace, Sector 4'
  },
  deliverySimulation: {
    currentStep: 3, // 1 to 5
    coords: [
      { left: '12%', top: '55%', speed: '0 km/h', status: 'At Hub 4 - Loading' },
      { left: '28%', top: '48%', speed: '35 km/h', status: 'Dispatched on East Highway' },
      { left: '48%', top: '42%', speed: '42 km/h', status: 'In Transit on Main Avenue' },
      { left: '72%', top: '41%', speed: '20 km/h', status: 'Arrived at Sector 4 Entrance' },
      { left: '86%', top: '40%', speed: '0 km/h', status: 'Dispensing & Pumping Water' }
    ]
  },
  orders: savedOrders ? JSON.parse(savedOrders) : initialOrders
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDirection();
  initRouter();
  initMobileNav();
  initHomeCalculator();
  calculateRateEstimate();
  setupEventListeners();
  initFormValidation();
  updateUserDisplay();
});

// Setup click handlers and controls
function setupEventListeners() {
  // RTL / LTR Toggle Button
  const rtlBtn = document.getElementById('rtlToggleBtn');
  if (rtlBtn) {
    rtlBtn.addEventListener('click', toggleDirection);
  }

  // Dark / Light Theme Toggle Button
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Dropdown hover/touch helper
  const homeNavItem = document.getElementById('homeNavItem');
  if (homeNavItem) {
    homeNavItem.addEventListener('mouseenter', () => homeNavItem.classList.add('open'));
    homeNavItem.addEventListener('mouseleave', () => homeNavItem.classList.remove('open'));
  }

  // Initialize default delivery datetime (2 hours from now)
  const now = new Date();
  now.setHours(now.getHours() + 2);
  const defaultDt = now.toISOString().slice(0, 16);
  const mbDt = document.getElementById('mb-datetime');
  if (mbDt && !mbDt.value) mbDt.value = defaultDt;
  const dbDt = document.getElementById('db_date');
  if (dbDt && !dbDt.value) dbDt.value = defaultDt;

  // Render initial orders table
  renderOrdersTable();
}

// ==========================================================================
// SPA ROUTER & NAVIGATION
// ==========================================================================
function initRouter() {
  // Read hash on load
  const hash = window.location.hash.replace('#', '') || 'home1';
  navigateTo(hash, false);

  window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash.replace('#', '') || 'home1';
    navigateTo(currentHash, false);
  });
}

function navigateTo(pageId, updateHash = true) {
  // Map 'home' to 'home1'
  let targetId = pageId;
  if (pageId === 'home') targetId = 'home1';

  // Allowed core page IDs
  const validPages = ['home1', 'home2', 'services', 'rates', 'dashboard', 'login', 'contact'];
  let subAnchor = null;

  // Seamless redirect for sub-topics embedded inside Services
  if (pageId === 'coverage' || pageId === 'fleet' || pageId === 'emergency') {
    targetId = 'services';
    subAnchor = `services-${pageId}`;
  } else if (!validPages.includes(targetId)) {
    targetId = 'home1';
  }

  // Update views
  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.remove('active');
  });

  const targetView = document.getElementById(`page-${targetId}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Update Nav links (strictly for the 5 center navigation links)
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  if (targetId === 'home1' || targetId === 'home2') {
    const homeLink = document.getElementById('homeLink');
    if (homeLink) homeLink.classList.add('active');
  } else {
    const activeLink = document.querySelector(`.nav-link[href="#${targetId}"]`);
    if (activeLink) activeLink.classList.add('active');
  }

  // Update state & hash
  appState.activePage = targetId;
  if (updateHash) {
    window.location.hash = pageId; // keep original requested anchor if any
  }

  // Toggle body classes for standalone pages (Login & Dashboard have no website header/footer)
  if (targetId === 'login') {
    document.body.classList.add('view-login');
    document.body.classList.remove('view-dashboard');
  } else if (targetId === 'dashboard') {
    document.body.classList.add('view-dashboard');
    document.body.classList.remove('view-login');
  } else {
    document.body.classList.remove('view-login', 'view-dashboard');
  }

  // Close mobile nav if open
  closeMobileNav();

  // Scroll to section or top
  if (subAnchor) {
    setTimeout(() => {
      const el = document.getElementById(subAnchor);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function initMobileNav() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }
}

function closeMobileNav() {
  const navMenu = document.getElementById('navMenu');
  if (navMenu) navMenu.classList.remove('open');
}

// ==========================================================================
// RTL / LTR DIRECTION TOGGLE
// ==========================================================================
function initDirection() {
  applyDirection(appState.currentDir);
}

function toggleDirection() {
  const nextDir = appState.currentDir === 'ltr' ? 'rtl' : 'ltr';
  applyDirection(nextDir);
}

function applyDirection(dir) {
  appState.currentDir = dir;
  document.documentElement.setAttribute('dir', dir);
  localStorage.setItem('hs_dir', dir);

  const isRtl = dir === 'rtl';
  const targetTitle = isRtl ? 'Switch to Left-to-Right Layout (LTR)' : 'Switch to Right-to-Left Layout (RTL)';
  const targetAria = isRtl ? 'Switch to LTR' : 'Switch to RTL';

  // Standard universally recognizable direction icons (Pilcrow text direction format):
  // When in LTR, display the standard RTL icon with arrow pointing Right-to-Left (<-)
  // When in RTL, display the standard LTR icon with arrow pointing Left-to-Right (->)
  const rtlIconSvg = `<svg class="action-icon dir-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4H8a4 4 0 0 0 0 8h2"/><path d="M14 4v11"/><path d="M18 4v11"/><path d="M20 19H4"/><polyline points="8 16 5 19 8 22"/></svg>`;
  const ltrIconSvg = `<svg class="action-icon dir-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4H8a4 4 0 0 0 0 8h2"/><path d="M14 4v11"/><path d="M18 4v11"/><path d="M4 19h16"/><polyline points="16 16 19 19 16 22"/></svg>`;
  const activeSvg = isRtl ? ltrIconSvg : rtlIconSvg;

  const rtlBtn = document.getElementById('rtlToggleBtn');
  if (rtlBtn) {
    rtlBtn.innerHTML = activeSvg;
    rtlBtn.title = targetTitle;
    rtlBtn.setAttribute('aria-label', targetAria);
  }

  const mobileRtlBtn = document.getElementById('mobileRtlBtn');
  if (mobileRtlBtn) {
    mobileRtlBtn.innerHTML = activeSvg;
    mobileRtlBtn.title = targetTitle;
    mobileRtlBtn.setAttribute('aria-label', targetAria);
  }

  const loginRtlBtn = document.getElementById('loginRtlBtn');
  if (loginRtlBtn) {
    loginRtlBtn.innerHTML = activeSvg;
    loginRtlBtn.title = targetTitle;
    loginRtlBtn.setAttribute('aria-label', targetAria);
  }

  const statusLabel = document.getElementById('rtlStatusText');
  if (statusLabel) {
    statusLabel.textContent = dir.toUpperCase();
  }
}

// ==========================================================================
// DARK / LIGHT THEME TOGGLE
// ==========================================================================
function initTheme() {
  applyTheme(appState.currentTheme);
}

function toggleTheme() {
  const nextTheme = appState.currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(nextTheme);
}

function applyTheme(theme) {
  appState.currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('hs_theme', theme);

  const loginIcon = document.getElementById('loginThemeIcon');
  if (loginIcon) {
    loginIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// ==========================================================================
// HOME 1 RESIDENTIAL TANK SIZE CALCULATOR
// ==========================================================================
function initHomeCalculator() {
  updateHomeCalculator();
}

function updateHomeCalculator() {
  const people = parseInt(document.getElementById('calc-people')?.value || 4, 10);
  const days = parseInt(document.getElementById('calc-days')?.value || 3, 10);
  const modeMultiplier = parseFloat(document.getElementById('calc-usage-mode')?.value || 1.0);

  // Update label displays
  const peopleVal = document.getElementById('calc-people-val');
  if (peopleVal) peopleVal.textContent = `${people} Persons`;

  const daysVal = document.getElementById('calc-days-val');
  if (daysVal) daysVal.textContent = `${days} Days`;

  // Standard domestic consumption: 135 L/person/day
  const rawLiters = people * days * 135 * modeMultiplier;

  let recommendedLiters = 1000;
  let cost = "$28.00";

  if (rawLiters <= 1200) {
    recommendedLiters = 1000;
    cost = "$28.00";
  } else if (rawLiters <= 3500) {
    recommendedLiters = 3000;
    cost = "$42.00";
  } else if (rawLiters <= 6500) {
    recommendedLiters = 5000;
    cost = "$58.00";
  } else if (rawLiters <= 12000) {
    recommendedLiters = 10000;
    cost = "$89.00";
  } else {
    recommendedLiters = 20000;
    cost = "$148.00";
  }

  const resultSizeEl = document.getElementById('calc-recommended-size');
  if (resultSizeEl) resultSizeEl.textContent = `${recommendedLiters.toLocaleString()} Liters`;

  const explanationEl = document.getElementById('calc-explanation');
  if (explanationEl) {
    explanationEl.textContent = `Calculated approx ${Math.round(rawLiters).toLocaleString()} Liters for ${people} persons over ${days} days. Standard delivery window.`;
  }

  const costEl = document.getElementById('calc-cost-display');
  if (costEl) costEl.textContent = cost;
}

function openBookingFromCalc() {
  const sizeText = document.getElementById('calc-recommended-size')?.textContent || '3,000 Liters';
  const capacity = parseInt(sizeText.replace(/[^0-9]/g, ''), 10) || 3000;
  openBookingModal('potable', capacity);
}

// ==========================================================================
// INTERACTIVE RATE CHART ESTIMATOR (PAGE 4)
// ==========================================================================
function calculateRateEstimate() {
  const gradeSelect = document.getElementById('est-water-grade');
  const capacitySelect = document.getElementById('est-tanker-capacity');
  const distRange = document.getElementById('est-distance-range');
  const slotSelect = document.getElementById('est-time-slot');

  if (!gradeSelect || !capacitySelect || !distRange) return;

  const basePricePerGrade = parseFloat(gradeSelect.selectedOptions[0]?.getAttribute('data-base') || 35);
  const capacityMult = parseFloat(capacitySelect.selectedOptions[0]?.getAttribute('data-mult') || 1.4);
  const distanceKm = parseInt(distRange.value, 10);
  const surcharge = parseFloat(slotSelect?.selectedOptions[0]?.getAttribute('data-surcharge') || 0);

  // Update distance label
  const distVal = document.getElementById('est-distance-val');
  if (distVal) distVal.textContent = `${distanceKm} km`;

  // Compute components
  const baseWater = Math.round(basePricePerGrade * (capacityMult / 1.4));
  const excessKm = Math.max(0, distanceKm - 5);
  const transitCost = Math.round(excessKm * 1.30);
  const total = baseWater + transitCost + surcharge;

  // Render Breakdown
  const waterEl = document.getElementById('est-cost-water');
  if (waterEl) waterEl.textContent = `$${baseWater.toFixed(2)}`;

  const distanceEl = document.getElementById('est-cost-distance');
  if (distanceEl) distanceEl.textContent = `$${transitCost.toFixed(2)}`;

  const surchargeEl = document.getElementById('est-cost-surcharge');
  if (surchargeEl) surchargeEl.textContent = `$${surcharge.toFixed(2)}`;

  const totalEl = document.getElementById('est-total-cost');
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

function bookFromEstimator() {
  const grade = document.getElementById('est-water-grade')?.value || 'potable';
  const capacity = parseInt(document.getElementById('est-tanker-capacity')?.value || '3000', 10);
  openBookingModal(grade, capacity);
}

function printRateChart() {
  window.print();
}

// ==========================================================================
// CUSTOMER DASHBOARD CONTROLLER
// ==========================================================================
function switchDashTab(tabId) {
  appState.activeDashTab = tabId;

  // Update sidebar buttons
  document.querySelectorAll('.dash-nav-link').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.querySelector(`.dash-nav-link[onclick="switchDashTab('${tabId}')"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update tab panes
  document.querySelectorAll('.dash-tab-content').forEach(pane => {
    pane.classList.remove('active');
  });

  const activePane = document.getElementById(`dash-tab-${tabId}`);
  if (activePane) activePane.classList.add('active');
}

// Live GPS Simulation
function simulateNextDeliveryStep() {
  appState.deliverySimulation.currentStep++;
  if (appState.deliverySimulation.currentStep > 5) {
    appState.deliverySimulation.currentStep = 1;
  }

  const step = appState.deliverySimulation.currentStep;
  const config = appState.deliverySimulation.coords[step - 1];

  // Update Stepper UI
  for (let i = 1; i <= 5; i++) {
    const item = document.getElementById(`step-${i}`);
    const conn = document.getElementById(`conn-${i}`);

    if (!item) continue;

    item.classList.remove('completed', 'active');
    if (conn) conn.classList.remove('active');

    if (i < step) {
      item.classList.add('completed');
      item.querySelector('.step-circle').innerHTML = '✓';
      if (conn) conn.classList.add('active');
    } else if (i === step) {
      item.classList.add('active');
      if (step < 5) {
        item.querySelector('.step-circle').innerHTML = '<span class="step-spinner"></span>';
      } else {
        item.querySelector('.step-circle').innerHTML = '✓';
      }
    } else {
      item.querySelector('.step-circle').innerHTML = i.toString();
    }
  }

  // Move GPS Tanker Marker on Map
  const pin = document.getElementById('mapTankerPin');
  if (pin) {
    pin.style.left = config.left;
    pin.style.top = config.top;
  }

  // Update HUD
  const speedEl = document.getElementById('hud-speed');
  if (speedEl) speedEl.textContent = config.speed;

  const etaEl = document.getElementById('eta-countdown');
  const step3Status = document.getElementById('step-3-status');

  if (step === 1) {
    if (etaEl) etaEl.textContent = 'Estimated: 35 Mins';
  } else if (step === 2) {
    if (etaEl) etaEl.textContent = 'Estimated: 25 Mins';
  } else if (step === 3) {
    if (etaEl) etaEl.textContent = 'Arriving in 14 Mins';
    if (step3Status) step3Status.textContent = config.status;
  } else if (step === 4) {
    if (etaEl) etaEl.textContent = 'Arrived - Dispensing Water';
  } else if (step === 5) {
    if (etaEl) etaEl.textContent = 'Delivery Completed Successfully';
  }
}

// Dashboard Dynamic Booking Calculator
function updateDashPrice() {
  const waterType = document.querySelector('input[name="db_water_type"]:checked')?.value || 'potable';
  const capacity = parseInt(document.getElementById('db_capacity')?.value || '3000', 10);
  const hose = parseInt(document.getElementById('db_hose_length')?.value || '100', 10);

  let baseRate = 42;
  if (waterType === 'domestic') baseRate = 35;
  if (waterType === 'pool') baseRate = 55;
  if (waterType === 'construction') baseRate = 48;

  let multiplier = 1;
  if (capacity === 1000) multiplier = 0.7;
  if (capacity === 3000) multiplier = 1.0;
  if (capacity === 5000) multiplier = 1.45;
  if (capacity === 10000) multiplier = 2.15;
  if (capacity === 20000) multiplier = 3.6;

  let hoseFee = (hose === 150) ? 10 : 0;
  let finalFare = Math.round(baseRate * multiplier) + hoseFee;

  const totalEl = document.getElementById('db_calculated_total');
  if (totalEl) totalEl.textContent = `$${finalFare.toFixed(2)}`;
}

function handleDashboardBooking(event) {
  event.preventDefault();

  // Validate Name
  const nameInput = document.getElementById('db_name');
  const nameRes = validateName(nameInput?.value);
  if (!nameRes.valid) {
    showFieldError(nameInput, nameRes.message);
    showToast(nameRes.message, 'warning');
    nameInput?.focus();
    return;
  } else {
    clearFieldError(nameInput);
  }

  // Validate Mobile
  const phoneInput = document.getElementById('db_phone');
  const phoneRes = validateMobile(phoneInput?.value);
  if (!phoneRes.valid) {
    showFieldError(phoneInput, phoneRes.message);
    showToast(phoneRes.message, 'warning');
    phoneInput?.focus();
    return;
  } else {
    clearFieldError(phoneInput);
  }

  // Validate Email
  const emailInput = document.getElementById('db_email');
  const emailRes = validateEmail(emailInput?.value);
  if (!emailRes.valid) {
    showFieldError(emailInput, emailRes.message);
    showToast(emailRes.message, 'warning');
    emailInput?.focus();
    return;
  } else {
    clearFieldError(emailInput);
  }

  // Validate Date & Time
  const dateInput = document.getElementById('db_date');
  if (!dateInput?.value) {
    showToast('Please select delivery date and time slot.', 'warning');
    dateInput?.focus();
    return;
  }

  // Validate Address
  const addrInput = document.getElementById('db_address');
  if (!addrInput?.value?.trim()) {
    showFieldError(addrInput, 'Delivery address is required.');
    showToast('Delivery address is required.', 'warning');
    addrInput?.focus();
    return;
  } else {
    clearFieldError(addrInput);
  }

  const waterType = document.querySelector('input[name="db_water_type"]:checked')?.value || 'potable';
  const capacity = document.getElementById('db_capacity')?.value || '3000';
  const fare = document.getElementById('db_calculated_total')?.textContent || '$42.00';
  const orderId = `TK-${Math.floor(10000 + Math.random() * 90000)}`;

  let formattedDate = 'Nov 04, 2026';
  try {
    const d = new Date(dateInput.value);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch(e) {}

  const newOrder = {
    id: orderId,
    date: formattedDate,
    type: `${parseInt(capacity).toLocaleString()}L ${waterType.toUpperCase()}`,
    driver: 'Marcus Vance (#4028)',
    tds: '65 PPM',
    total: fare,
    status: 'In Transit',
    customerName: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    email: emailInput.value.trim(),
    address: addrInput.value.trim(),
    scheduledSlot: dateInput.value
  };

  appState.orders.unshift(newOrder);
  try {
    localStorage.setItem('hs_orders', JSON.stringify(appState.orders));
  } catch(e) {}

  renderOrdersTable();

  // Show clear booking confirmation alert in live tracking tab
  const confirmCard = document.getElementById('dash-booking-confirmation');
  const confirmTitle = document.getElementById('dash-confirm-title');
  const confirmDetails = document.getElementById('dash-confirm-details');
  if (confirmCard) {
    confirmCard.style.display = 'block';
    if (confirmTitle) confirmTitle.textContent = `Tanker Booking #${newOrder.id} Confirmed & Dispatched!`;
    if (confirmDetails) confirmDetails.textContent = `Order for ${newOrder.type} scheduled for ${newOrder.address}. Driver Marcus Vance (#4028) assigned with food-grade sanitized tanker.`;
  }

  showToast(`Booking #${newOrder.id} confirmed! Tanker dispatched to ${newOrder.address}.`, 'success');

  // Reset to live tracking view
  switchDashTab('live-track');
}

function renderOrdersTable() {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  tbody.innerHTML = appState.orders.map(order => `
    <tr>
      <td><strong>#${order.id}</strong></td>
      <td>${order.date}</td>
      <td><span class="pill-badge ${order.status === 'In Transit' ? 'pill-blue' : 'pill-green'}">${order.type}</span></td>
      <td>${order.type.split(' ')[0]}</td>
      <td>${order.driver}</td>
      <td>${order.tds}</td>
      <td><strong>${order.total}</strong></td>
      <td><button class="btn btn-xs btn-outline" onclick="openInvoiceModal('${order.id}', '${order.type}', '${order.total}', '${order.date}')">View Invoice</button></td>
    </tr>
  `).join('');

  // Update active orders count badge
  const activeCount = appState.orders.filter(o => o.status === 'In Transit').length;
  document.querySelectorAll('.dash-pulse-pill').forEach(pill => {
    pill.textContent = `${activeCount} Active`;
  });
}

function exportOrderHistory() {
  const csvContent = "data:text/csv;charset=utf-8," 
    + "Order ID,Date,Water Type,Driver,TDS,Total\n"
    + appState.orders.map(e => `${e.id},${e.date},${e.type},${e.driver},${e.tds},${e.total}`).join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `hydroswift_water_orders_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Order history exported to CSV', 'success');
}

// ==========================================================================
// MODAL CONTROLLERS & BOOKING POPUP
// ==========================================================================
function openBookingModal(defaultType = 'potable', defaultCapacity = 3000) {
  const modal = document.getElementById('bookingModal');
  if (!modal) return;

  const typeSelect = document.getElementById('mb-water-type');
  if (typeSelect && defaultType) typeSelect.value = defaultType;

  const capSelect = document.getElementById('mb-capacity');
  if (capSelect && defaultCapacity) capSelect.value = defaultCapacity.toString();

  const nameInput = document.getElementById('mb-customer-name');
  if (nameInput && appState.user.name && !nameInput.value) nameInput.value = appState.user.name;

  const phoneInput = document.getElementById('mb-phone');
  if (phoneInput && appState.user.phone && !phoneInput.value) phoneInput.value = appState.user.phone;

  const emailInput = document.getElementById('mb-email');
  if (emailInput && appState.user.email && !emailInput.value) emailInput.value = appState.user.email;

  const addrInput = document.getElementById('mb-address');
  if (addrInput && appState.user.address && !addrInput.value) addrInput.value = appState.user.address;

  const dtInput = document.getElementById('mb-datetime');
  if (dtInput && !dtInput.value) {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    dtInput.value = now.toISOString().slice(0, 16);
  }

  updateModalPrice();
  modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

function closeModalOnBackdrop(event, modalId) {
  if (event.target.id === modalId) {
    closeModal(modalId);
  }
}

function updateModalPrice() {
  const type = document.getElementById('mb-water-type')?.value || 'potable';
  const cap = parseInt(document.getElementById('mb-capacity')?.value || '3000', 10);
  const urgency = document.getElementById('mb-urgency')?.value || 'standard';

  let base = 35;
  if (type === 'potable') base = 42;
  if (type === 'pool') base = 55;
  if (type === 'construction') base = 48;
  if (type === 'industrial') base = 85;

  let multiplier = 1;
  if (cap === 1000) multiplier = 0.7;
  if (cap === 3000) multiplier = 1.0;
  if (cap === 5000) multiplier = 1.45;
  if (cap === 10000) multiplier = 2.15;
  if (cap === 20000) multiplier = 3.6;

  let surcharge = (urgency === 'urgent') ? 15 : 0;
  let total = Math.round(base * multiplier) + surcharge;

  const display = document.getElementById('mb-fare-display');
  if (display) display.textContent = `$${total.toFixed(2)}`;
}

function handleModalBookingSubmit(event) {
  event.preventDefault();

  const nameInput = document.getElementById('mb-customer-name');
  const phoneInput = document.getElementById('mb-phone');
  const emailInput = document.getElementById('mb-email');
  const dateInput = document.getElementById('mb-datetime');
  const addrInput = document.getElementById('mb-address');

  // Validate Name
  const nameRes = validateName(nameInput?.value);
  if (!nameRes.valid) {
    showFieldError(nameInput, nameRes.message);
    showToast(nameRes.message, 'warning');
    nameInput?.focus();
    return;
  } else {
    clearFieldError(nameInput);
  }

  // Validate Mobile
  const phoneRes = validateMobile(phoneInput?.value);
  if (!phoneRes.valid) {
    showFieldError(phoneInput, phoneRes.message);
    showToast(phoneRes.message, 'warning');
    phoneInput?.focus();
    return;
  } else {
    clearFieldError(phoneInput);
  }

  // Validate Email
  if (emailInput && emailInput.value) {
    const emailRes = validateEmail(emailInput.value);
    if (!emailRes.valid) {
      showFieldError(emailInput, emailRes.message);
      showToast(emailRes.message, 'warning');
      emailInput.focus();
      return;
    } else {
      clearFieldError(emailInput);
    }
  }

  // Validate Address
  if (!addrInput?.value?.trim()) {
    showFieldError(addrInput, 'Delivery address is required.');
    showToast('Delivery address is required.', 'warning');
    addrInput?.focus();
    return;
  } else {
    clearFieldError(addrInput);
  }

  const type = document.getElementById('mb-water-type')?.value || 'potable';
  const cap = document.getElementById('mb-capacity')?.value || '3000';
  const fare = document.getElementById('mb-fare-display')?.textContent || '$42.00';
  const orderId = `TK-${Math.floor(10000 + Math.random() * 90000)}`;

  let formattedDate = 'Nov 04, 2026';
  if (dateInput?.value) {
    try {
      const d = new Date(dateInput.value);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch(e) {}
  }

  closeModal('bookingModal');

  // Push to history
  const newOrder = {
    id: orderId,
    date: formattedDate,
    type: `${parseInt(cap).toLocaleString()}L ${type.toUpperCase()}`,
    driver: 'Marcus Vance (#4028)',
    tds: '68 PPM',
    total: fare,
    status: 'In Transit',
    customerName: nameInput?.value?.trim(),
    phone: phoneInput?.value?.trim(),
    address: addrInput?.value?.trim(),
    scheduledSlot: dateInput?.value || ''
  };

  appState.orders.unshift(newOrder);
  try {
    localStorage.setItem('hs_orders', JSON.stringify(appState.orders));
  } catch(e) {}

  renderOrdersTable();

  // Show clear confirmation on Dashboard
  const confirmCard = document.getElementById('dash-booking-confirmation');
  const confirmTitle = document.getElementById('dash-confirm-title');
  const confirmDetails = document.getElementById('dash-confirm-details');
  if (confirmCard) {
    confirmCard.style.display = 'block';
    if (confirmTitle) confirmTitle.textContent = `Tanker Booking #${newOrder.id} Confirmed & Dispatched!`;
    if (confirmDetails) confirmDetails.textContent = `Order for ${newOrder.type} scheduled for ${newOrder.address}. Driver Marcus Vance (#4028) assigned.`;
  }

  showToast(`Booking #${orderId} Dispatched! Live tracking ready on Dashboard.`, 'success');
  navigateTo('dashboard');
  switchDashTab('live-track');
}

// Quick booking on Home 1
function handleQuickBook(event) {
  event.preventDefault();
  const waterType = document.getElementById('qb-water-type')?.value;
  const tankerSize = document.getElementById('qb-tanker-size')?.value;
  openBookingModal(waterType, parseInt(tankerSize, 10));
}

// Industrial inquiry on Home 2
function handleIndustrialInquiry(event) {
  event.preventDefault();
  const phoneInput = document.getElementById('ind-phone');
  if (phoneInput) {
    const phoneRes = validateMobile(phoneInput.value);
    if (!phoneRes.valid) {
      showFieldError(phoneInput, phoneRes.message);
      showToast(phoneRes.message, 'warning');
      phoneInput.focus();
      return;
    } else {
      clearFieldError(phoneInput);
    }
  }

  const industry = document.getElementById('ind-industry')?.value;
  const project = document.getElementById('ind-project-name')?.value;
  showToast(`Tender Quotation for ${project} (${industry}) sent to dispatch desk. Representative will call in 15 mins.`, 'success');
  event.target.reset();
}

// ==========================================================================
// OFFICIAL TAX INVOICE GENERATOR & PRINT
// ==========================================================================
function openInvoiceModal(invNum, description, total, date) {
  const modal = document.getElementById('invoiceModal');
  if (!modal) return;

  const numEl = document.getElementById('inv-num');
  if (numEl) numEl.textContent = invNum.startsWith('INV') ? invNum : `INV-2026-${invNum.replace(/\D/g, '').slice(-3)}`;

  const dateEl = document.getElementById('inv-date');
  if (dateEl) dateEl.textContent = date || 'Nov 04, 2026';

  const descEl = document.getElementById('inv-item-desc');
  if (descEl) descEl.textContent = description;

  const customerName = document.getElementById('inv-customer-name');
  if (customerName) customerName.textContent = appState.user.name;

  const totalPaid = document.getElementById('inv-total-paid');
  if (totalPaid) totalPaid.textContent = total;

  // Calculate tax breakdown (assuming 9% VAT included)
  const numVal = parseFloat(total.replace(/[^0-9.]/g, '')) || 42.00;
  const net = (numVal / 1.09).toFixed(2);
  const tax = (numVal - parseFloat(net)).toFixed(2);

  const netEl = document.getElementById('inv-net');
  if (netEl) netEl.textContent = `$${net}`;

  const subtotalEl = document.getElementById('inv-subtotal');
  if (subtotalEl) subtotalEl.textContent = `$${net}`;

  const taxEl = document.getElementById('inv-tax');
  if (taxEl) taxEl.textContent = `$${tax}`;

  modal.classList.add('open');
}

function printInvoice() {
  window.print();
}

// ==========================================================================
// AUTHENTICATION & DEMO LOGIN PORTAL (STANDALONE DUMMY MODE)
// ==========================================================================
function switchLoginMode(mode) {
  const tabSignIn = document.getElementById('tabSignIn');
  const tabCreateAcc = document.getElementById('tabCreateAcc');
  const loginForm = document.getElementById('dummyLoginForm');
  const regForm = document.getElementById('dummyRegisterForm');

  if (mode === 'signin') {
    tabSignIn?.classList.add('active');
    tabCreateAcc?.classList.remove('active');
    if (loginForm) loginForm.style.display = 'block';
    if (regForm) regForm.style.display = 'none';
  } else {
    tabCreateAcc?.classList.add('active');
    tabSignIn?.classList.remove('active');
    if (loginForm) loginForm.style.display = 'none';
    if (regForm) regForm.style.display = 'block';
  }
}

function handleDummyAction(action) {
  const banner = document.getElementById('loginDemoBanner');
  const title = document.getElementById('demoBannerTitle');
  const desc = document.getElementById('demoBannerDesc');
  if (!banner || !title || !desc) return;

  banner.style.display = 'flex';
  if (action === 'google') {
    title.textContent = 'Demo mode: Authentication is not enabled.';
    desc.textContent = 'Google sign-in is a frontend demonstration. No external redirect or popup has occurred, and you remain on this page.';
  } else if (action === 'apple') {
    title.textContent = 'Demo mode: Authentication is not enabled.';
    desc.textContent = 'Apple sign-in is a frontend demonstration. No external redirect or popup has occurred, and you remain on this page.';
  } else if (action === 'password_reset') {
    title.textContent = 'Demo mode: Password recovery simulation.';
    desc.textContent = 'Password reset demonstration recorded. No external email was sent, and you remain on this page.';
  }
}

function handleDummySubmit(event, mode) {
  event.preventDefault();
  const banner = document.getElementById('loginDemoBanner');
  const title = document.getElementById('demoBannerTitle');
  const desc = document.getElementById('demoBannerDesc');
  if (!banner || !title || !desc) return;

  banner.style.display = 'flex';
  if (mode === 'signin') {
    title.textContent = 'Demo mode: Authentication is not enabled.';
    desc.textContent = 'Sign-in is a frontend demonstration. No external redirect or authentication has occurred, and you remain on this page.';
  } else {
    title.textContent = 'Demo mode: Authentication is not enabled.';
    desc.textContent = 'Account registration is a frontend demonstration. No external database entry was created, and you remain on this page.';
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  } else {
    input.type = 'password';
    btn.innerHTML = `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}

// Backwards-compatibility aliases
function switchAuthTab(tab) {
  switchLoginMode(tab === 'register' ? 'create' : 'signin');
}
function handleSocialLogin(provider) {
  handleDummyAction(provider.toLowerCase());
}
function handleCustomerLogin(event) {
  handleDummySubmit(event, 'signin');
}
function handleCustomerRegister(event) {
  handleDummySubmit(event, 'register');
}

function updateUserDisplay() {
  // Update login button tooltip/accessibility only - NO TEXT BESIDE ICON
  const portalBtn = document.getElementById('loginPortalBtn');
  if (portalBtn) {
    const tooltip = appState.user.isLoggedIn ? `Customer Portal (${appState.user.name})` : 'Customer Login Portal';
    portalBtn.setAttribute('title', tooltip);
    portalBtn.setAttribute('aria-label', tooltip);
  }

  const dashDisplayName = document.getElementById('dash-display-name');
  if (dashDisplayName) {
    dashDisplayName.textContent = appState.user.name;
  }
}

// ==========================================================================
// CONTACT & FAQ ACCORDION
// ==========================================================================
function toggleFaq(button) {
  const item = button.closest('.faq-item');
  if (!item) return;

  const isActive = item.classList.contains('active');
  document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));

  if (!isActive) {
    item.classList.add('active');
  }
}

function handleContactSubmit(event) {
  event.preventDefault();
  const nameInput = document.getElementById('c-name');
  const phoneInput = document.getElementById('c-phone');
  const emailInput = document.getElementById('c-email');

  // Name validation
  const nameRes = validateName(nameInput?.value);
  if (!nameRes.valid) {
    showFieldError(nameInput, nameRes.message);
    showToast(nameRes.message, 'warning');
    nameInput?.focus();
    return;
  } else {
    clearFieldError(nameInput);
  }

  // Mobile validation
  const phoneRes = validateMobile(phoneInput?.value);
  if (!phoneRes.valid) {
    showFieldError(phoneInput, phoneRes.message);
    showToast(phoneRes.message, 'warning');
    phoneInput?.focus();
    return;
  } else {
    clearFieldError(phoneInput);
  }

  // Email validation
  const emailRes = validateEmail(emailInput?.value);
  if (!emailRes.valid) {
    showFieldError(emailInput, emailRes.message);
    showToast(emailRes.message, 'warning');
    emailInput?.focus();
    return;
  } else {
    clearFieldError(emailInput);
  }

  const name = nameInput.value.trim();
  showToast(`Thank you, ${name}! Your callback request has reached Hub Dispatch. Expected callback in 8 minutes.`, 'success');
  event.target.reset();
}

function triggerEmergencyCall() {
  window.location.href = "tel:+18004937694";
}

// ==========================================================================
// FORM VALIDATION ENGINE (NAME, MOBILE, EMAIL)
// ==========================================================================
function validateName(value) {
  if (!value || !value.trim()) {
    return { valid: false, message: 'Name is required.' };
  }
  const trimmed = value.trim();
  // Allow only English alphabets (A-Z, a-z) and spaces between words
  if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(trimmed)) {
    return {
      valid: false,
      message: 'Name must contain only English alphabets (A–Z, a–z). Numbers and special characters are not allowed.'
    };
  }
  return { valid: true };
}

function validateMobile(value) {
  if (!value || !value.trim()) {
    return { valid: false, message: 'Mobile number is required.' };
  }
  const trimmed = value.trim();
  // Only numeric digits (0-9)
  if (!/^\d+$/.test(trimmed)) {
    return {
      valid: false,
      message: 'Mobile number must contain only numeric digits (0–9). Alphabets and special characters are not allowed.'
    };
  }
  // Exactly 10 digits
  if (trimmed.length !== 10) {
    return {
      valid: false,
      message: 'Mobile number must be exactly 10 digits.'
    };
  }
  return { valid: true };
}

function validateEmail(value) {
  if (!value || !value.trim()) {
    return { valid: false, message: 'Email address is required.' };
  }
  const trimmed = value.trim();
  // Disallow uppercase letters completely
  if (/[A-Z]/.test(trimmed)) {
    return {
      valid: false,
      message: 'Email must contain only lowercase English letters. Uppercase letters (A–Z) are not accepted.'
    };
  }
  // Standard lowercase email pattern
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return {
      valid: false,
      message: 'Please enter a valid lowercase email address (e.g. name@example.com).'
    };
  }
  return { valid: true };
}

function showFieldError(input, message) {
  if (!input) return;
  input.classList.add('is-invalid');
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
}

function clearFieldError(input) {
  if (!input) return;
  input.classList.remove('is-invalid');
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
}

function initFormValidation() {
  // Real-time input handling for name fields: strip numbers & symbols on typing
  document.querySelectorAll('input[data-validate="name"]').forEach(input => {
    input.addEventListener('input', (e) => {
      const filtered = e.target.value.replace(/[^A-Za-z ]/g, '');
      if (filtered !== e.target.value) {
        e.target.value = filtered;
        showFieldError(e.target, 'Numbers and special characters are not allowed.');
      } else if (e.target.value.trim().length > 0) {
        clearFieldError(e.target);
      }
    });
    input.addEventListener('blur', (e) => {
      if (e.target.value) {
        const res = validateName(e.target.value);
        if (!res.valid) showFieldError(e.target, res.message);
        else clearFieldError(e.target);
      }
    });
  });

  // Real-time input handling for phone fields: digits only, max 10
  document.querySelectorAll('input[data-validate="phone"]').forEach(input => {
    input.setAttribute('maxlength', '10');
    input.setAttribute('inputmode', 'numeric');
    input.addEventListener('input', (e) => {
      const filtered = e.target.value.replace(/\D/g, '').slice(0, 10);
      if (filtered !== e.target.value) {
        e.target.value = filtered;
        showFieldError(e.target, 'Only numeric digits (0–9) are allowed.');
      } else if (filtered.length === 10) {
        clearFieldError(e.target);
      } else if (filtered.length > 0) {
        showFieldError(e.target, `Enter exactly 10 digits (${filtered.length}/10 entered)`);
      }
    });
    input.addEventListener('blur', (e) => {
      if (e.target.value) {
        const res = validateMobile(e.target.value);
        if (!res.valid) showFieldError(e.target, res.message);
        else clearFieldError(e.target);
      }
    });
  });

  // Real-time input handling for email fields: lowercase warning on typing
  document.querySelectorAll('input[data-validate="email"]').forEach(input => {
    input.addEventListener('input', (e) => {
      if (/[A-Z]/.test(e.target.value)) {
        showFieldError(e.target, 'Uppercase letters (A–Z) are not accepted. Only lowercase allowed.');
      } else if (e.target.value) {
        clearFieldError(e.target);
      }
    });
    input.addEventListener('blur', (e) => {
      if (e.target.value) {
        const res = validateEmail(e.target.value);
        if (!res.valid) showFieldError(e.target, res.message);
        else clearFieldError(e.target);
      }
    });
  });
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.2rem;">${type === 'success' ? '💧' : '⚠️'}</span>
    <div>${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

// ==========================================================================
// FAQ ACCORDION HANDLER
// ==========================================================================
function toggleFaqAccordion(btn) {
  const item = btn.closest('.faq-item');
  if (!item) return;
  const wasActive = item.classList.contains('active');
  
  // Optional: close siblings if desired, or toggle individually
  const allItems = item.parentElement.querySelectorAll('.faq-item');
  allItems.forEach(i => {
    if (i !== item) {
      i.classList.remove('active');
      const b = i.querySelector('.faq-question-btn');
      if (b) b.setAttribute('aria-expanded', 'false');
    }
  });

  if (wasActive) {
    item.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
  } else {
    item.classList.add('active');
    btn.setAttribute('aria-expanded', 'true');
  }
}
window.toggleFaqAccordion = toggleFaqAccordion;

