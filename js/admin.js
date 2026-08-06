// ============================================================
// SKy Fit Professional — Admin Module
// Dashboard, POS, members, debt, stock, ledger and reports
// ============================================================

import {
  $,
  $$,
  byId,
  sb,
  cfg,
  esc,
  money,
  number,
  fmtDate,
  fmtDateTime,
  toISODate,
  startOfMonthISO,
  daysLeft,
  membershipState,
  paymentStatusBadge,
  paymentMethodLabel,
  requireAuth,
  layout,
  toast,
  setBusy,
  setFormMessage,
  getErrorMessage,
  reportError,
  modal,
  openModal,
  closeModal,
  confirmAction,
  uploadPublic,
  deleteStorageFile,
  subscribeToTable,
  removeRealtimeChannel,
  downloadCSV,
  hideLoader,
  logout,
} from './core.js';

// ============================================================
// SABİTLƏR
// ============================================================

const FALLBACK_IMAGE = 'assets/img/logo.png';

const panelTitles = {
  dashboard: 'İdarəetmə paneli',
  pos: 'Tez satış / POS',
  attendance: 'Giriş qeydiyyatı',
  members: 'Üzvlər',
  memberships: 'Abunəliklər',
  debts: 'Borc və nisyə',
  products: 'Məhsullar',
  stock: 'Stok hərəkətləri',
  ledger: 'Mədaxil / Məxaric',
  reports: 'Hesabatlar',
  trainers: 'Məşqçilər',
  settings: 'Tənzimləmələr',
};

const panelDescriptions = {
  dashboard:
    'Zalın gündəlik vəziyyətini bir baxışda izləyin.',

  pos:
    'Məhsul və xidmət satışlarını kassaya əlavə edin.',

  attendance:
    'Üzvlərin zala girişlərini qeydə alın.',

  members:
    'Üzv məlumatlarını əlavə edin və idarə edin.',

  memberships:
    'Aktiv, bitmək üzrə və vaxtı bitmiş abunəlikləri izləyin.',

  debts:
    'Üzvlərin borc və ödəniş balanslarını idarə edin.',

  products:
    'Məhsulların qiymət, satış forması və stok məlumatlarını idarə edin.',

  stock:
    'Məhsullar üzrə bütün stok giriş və çıxışlarını izləyin.',

  ledger:
    'Gündəlik mədaxil və məxaric qeydlərini idarə edin.',

  reports:
    'Seçilmiş dövr üzrə maliyyə nəticələrini hesablayın.',

  trainers:
    'Məşqçi kartlarını və əlaqə məlumatlarını idarə edin.',

  settings:
    'Üzvlük planlarını və sistem məlumatlarını idarə edin.',
};

const expenseCategories = [
  'İcarə',
  'Elektrik',
  'Su',
  'Qaz',
  'İnternet',
  'Vergi',
  'Kondisioner',
  'Təmizlik',
  'Zibil',
  'Benzin',
  'Təmir',
  'Maaş',
  'Məhsul alışı',
  'Digər xərc',
];

const incomeCategories = [
  'Abunəlik',
  'Günlük giriş',
  'Məhsul satışı',
  'Borc ödənişi',
  'Şəxsi məşq',
  'Digər gəlir',
];

const stockUnits = [
  'ədəd',
  'qram',
  'kq',
  'ml',
  'litr',
  'tablet',
  'kapsul',
  'paket',
  'porsiya',
];

const state = {
  profile: null,

  activePanel: 'dashboard',

  products: [],
  members: [],
  memberships: [],
  attendance: [],
  stockMovements: [],
  plans: [],
  debts: [],
  ledger: [],
  trainers: [],

  cart: [],

  selectedPosMemberId: null,

  dashboard: {
    dailyEntries: [],
    monthlyEntries: [],
    memberships: [],
    debts: [],
    products: [],
  },

  reportRows: [],

  realtimeChannels: [],
  realtimeTimer: null,

  currentProductImagePath: null,
};

// ============================================================
// DOM ELEMENTLƏRİ
// ============================================================

const elements = {
  pageTitle: byId('pageTitle'),
  adminName: byId('adminName'),
  adminAvatar: byId('adminAvatar'),

  sidebar: $('.sidebar'),
  sidebarToggle: byId('adminSidebarToggle'),

  stats: byId('stats'),

  posSearch: byId('posSearch'),
  posMember: byId('posMember'),
  posProducts: byId('posProducts'),
  cartLines: byId('cartLines'),
  cartTotal: byId('cartTotal'),
  cartSubtotal: byId('cartSubtotal'),
  cartDiscount: byId('cartDiscount'),
  cartDiscountInput: byId('cartDiscountInput'),
  paymentMethod: byId('paymentMethod'),
  paymentStatus: byId('paymentStatus'),
  completeSaleButton: byId('completeSaleButton'),

  membersTable: byId('membersTable'),
  memberSearch: byId('memberSearch'),

  debtsTable:
    byId('debtsTable'),

  debtSearch:
    byId('debtSearch'),

  debtSort:
    byId('debtSort'),

  refreshDebtsButton:
    byId('refreshDebtsButton'),

  totalDebtAmount:
    byId('totalDebtAmount'),

  totalDebtorCount:
    byId('totalDebtorCount'),

  monthlyDebtPayment:
    byId('monthlyDebtPayment'),

  membersStatusFilter:
    byId('membersStatusFilter'),

  refreshMembersButton:
    byId('refreshMembersButton'),

  posCreateMemberButton:
    byId('posCreateMemberButton'),

  clearCartButton:
    byId('clearCartButton'),

  productsTable: byId('productsTable'),
  productAdminSearch: byId('productAdminSearch'),

  ledgerFrom: byId('ledgerFrom'),
  ledgerTo: byId('ledgerTo'),
  ledgerTable: byId('ledgerTable'),

  reportFrom: byId('reportFrom'),
  reportTo: byId('reportTo'),
  reportStats: byId('reportStats'),
  reportChart: byId('reportChart'),

  notificationsPanel: byId('adminNotificationsPanel'),
  notificationsList: byId('adminNotificationsList'),

  dashboardExpiring: byId('dashboardExpiringMemberships'),
  dashboardLowStock: byId('dashboardLowStock'),
  dashboardRecentLedger: byId('dashboardRecentLedger'),

  trainersTable: byId('trainersTable'),

  pageDescription:
    byId('pageDescription'),

  adminCurrentDate:
    byId('adminCurrentDate'),

  adminRefreshButton:
    byId('adminRefreshButton'),

  adminAccountButton:
    byId('adminAccountButton'),

  adminAccountMenu:
    byId('adminAccountMenu'),

  adminRole:
    byId('adminRole'),

  adminNotificationsButton:
    byId('adminNotificationsButton'),

  closeAdminNotifications:
    byId('closeAdminNotifications'),

  notificationCount:
    byId('adminNotificationCount'),

  membershipWarningCount:
    byId('membershipWarningCount'),

  debtWarningCount:
    byId('debtWarningCount'),

  stockWarningCount:
    byId('stockWarningCount'),

  attendanceForm:
    byId('attendanceForm'),

  attendanceMemberSearch:
    byId('attendanceMemberSearch'),

  attendanceMemberResults:
    byId('attendanceMemberResults'),

  attendanceMemberId:
    byId('attendanceMemberId'),

  attendanceSelectedMember:
    byId('attendanceSelectedMember'),

  attendanceSelectedAvatar:
    byId('attendanceSelectedAvatar'),

  attendanceSelectedName:
    byId('attendanceSelectedName'),

  attendanceSelectedDetails:
    byId('attendanceSelectedDetails'),

  clearAttendanceMember:
    byId('clearAttendanceMember'),

  attendancePaymentMethod:
    byId('attendancePaymentMethod'),

  attendanceSubmitButton:
    byId('attendanceSubmitButton'),

  attendanceMessage:
    byId('attendanceMessage'),

  todayAttendanceTable:
    byId('todayAttendanceTable'),

  todayAttendanceCount:
    byId('todayAttendanceCount'),

  openNewMemberButton:
    byId('openNewMemberButton'),

  openMembershipButton:
    byId('openMembershipButton'),

  membershipSearch:
    byId('membershipSearch'),

  membershipStatusFilter:
    byId('membershipStatusFilter'),

  membershipPlanFilter:
    byId('membershipPlanFilter'),

  refreshMembershipsButton:
    byId('refreshMembershipsButton'),

  membershipsTable:
    byId('membershipsTable'),

  membershipsEmpty:
    byId('membershipsEmpty'),

  openProductButton:
    byId('openProductButton'),

  addStockButton:
    byId('addStockButton'),

  productsAdminGrid:
    byId('productsAdminGrid'),

  productsAdminEmpty:
    byId('productsAdminEmpty'),

  stockProductFilter:
    byId('stockProductFilter'),

  stockMovementFilter:
    byId('stockMovementFilter'),

  stockDateFrom:
    byId('stockDateFrom'),

  stockDateTo:
    byId('stockDateTo'),

  loadStockMovementsButton:
    byId('loadStockMovementsButton'),

  stockMovementsTable:
    byId('stockMovementsTable'),

  stockMovementsEmpty:
    byId('stockMovementsEmpty'),

  openLedgerButton:
    byId('openLedgerButton'),

  loadLedgerButton:
    byId('loadLedgerButton'),

  exportLedgerButton:
    byId('exportLedgerButton'),

  ledgerTypeFilter:
    byId('ledgerTypeFilter'),

  ledgerIncomeTotal:
    byId('ledgerIncomeTotal'),

  ledgerExpenseTotal:
    byId('ledgerExpenseTotal'),

  ledgerProfitTotal:
    byId('ledgerProfitTotal'),

  loadReportsButton:
    byId('loadReportsButton'),

  printReportButton:
    byId('printReportButton'),

  reportPeriodPreset:
    byId('reportPeriodPreset'),

  openTrainerButton:
    byId('openTrainerButton'),

  trainersAdminGrid:
    byId('trainersAdminGrid'),

  trainersAdminEmpty:
    byId('trainersAdminEmpty'),

  membershipPlansList:
    byId('membershipPlansList'),

  dashboardFinanceChart:
    byId('dashboardFinanceChart'),

  topSellingProducts:
    byId('topSellingProducts'),

  expenseCategorySummary:
    byId('expenseCategorySummary'),

  membershipIncomeSummary:
    byId('membershipIncomeSummary'),

  reportIncome:
    byId('reportIncome'),

  reportExpense:
    byId('reportExpense'),

  reportProfit:
    byId('reportProfit'),

  reportSalesCount:
    byId('reportSalesCount'),

  staffList:
    byId('staffList'),

  openStaffButton:
    byId('openStaffButton'),

  pwaSupportStatus:
    byId('pwaSupportStatus'),

  realtimeStatus:
    byId('realtimeStatus'),

  exportProductsButton:
    byId('exportProductsButton'),

  exportMembersButton:
    byId('exportMembersButton'),

  exportDebtsButton:
    byId('exportDebtsButton'),

  adminGlobalSearch:
    byId('adminGlobalSearch'),

  adminGlobalSearchResults:
    byId('adminGlobalSearchResults'),

  trainerSearch:
    byId('trainerSearch'),
};

// ============================================================
// ÜMUMİ KÖMƏKÇİLƏR
// ============================================================

function debounce(callback, delay = 180) {
  let timer = null;

  return (...args) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeNumber(value) {
  const result = Number(value ?? 0);

  return Number.isFinite(result)
    ? result
    : 0;
}

function safeImageUrl(value) {
  return String(value ?? '').trim() || FALLBACK_IMAGE;
}

function bindImageFallbacks(root = document) {
  $$('img[data-image-fallback]', root).forEach((image) => {
    if (image.dataset.fallbackBound === 'true') {
      return;
    }

    image.dataset.fallbackBound = 'true';

    image.addEventListener('error', () => {
      image.onerror = null;
      image.src = FALLBACK_IMAGE;
    });
  });
}

function todayISO() {
  return toISODate(new Date());
}

function getDefaultFromDate() {
  return startOfMonthISO(new Date());
}

function getProfileName(profile) {
  return (
    String(profile?.full_name ?? '').trim() ||
    String(profile?.email ?? '').trim() ||
    'Üzv'
  );
}

function getSalePrice(product) {
  if (product.sale_mode === 'portion') {
    return safeNumber(product.portion_price);
  }

  return safeNumber(product.retail_price);
}

function getSalePriceLabel(product) {
  const price = money(getSalePrice(product));

  return product.sale_mode === 'portion'
    ? `${price} / porsiya`
    : price;
}

function getProductStockDeduction(product, quantity = 1) {
  const safeQuantity = Math.max(0, safeNumber(quantity));

  if (product.sale_mode === 'portion') {
    return safeQuantity * Math.max(0, safeNumber(product.portion_size));
  }

  return safeQuantity;
}

function getProductAvailableSaleCount(product) {
  const stock = safeNumber(product.stock_quantity);

  if (product.sale_mode !== 'portion') {
    return Math.floor(stock);
  }

  const portionSize = safeNumber(product.portion_size);

  if (portionSize <= 0) {
    return 0;
  }

  return Math.floor(stock / portionSize);
}

function getStockState(product) {
  const stock = safeNumber(product.stock_quantity);
  const threshold = safeNumber(product.low_stock_threshold);

  if (stock <= 0) {
    return {
      key: 'out',
      label: 'Stok bitib',
      className: 'badge danger',
    };
  }

  if (threshold > 0 && stock <= threshold) {
    return {
      key: 'low',
      label: 'Az stok',
      className: 'badge warn',
    };
  }

  return {
    key: 'normal',
    label: 'Normal',
    className: 'badge ok',
  };
}

function getProductSaleModeLabel(product) {
  return product.sale_mode === 'portion'
    ? 'Açıq / porsiya'
    : 'Bağlı / ədəd';
}

function getMembershipStatusLabel(membership) {
  const status = membershipState(membership?.end_date);

  return `
    <span class="${status.badge}">
      ${esc(status.label)}
    </span>
  `;
}

function getLedgerTypeLabel(type) {
  return type === 'income'
    ? 'Mədaxil'
    : 'Məxaric';
}

function getLedgerTypeClass(type) {
  return type === 'income'
    ? 'badge ok'
    : 'badge danger';
}

function calculateLedgerTotals(entries) {
  return safeArray(entries).reduce(
    (total, entry) => {
      const amount = safeNumber(entry.amount);

      if (entry.entry_type === 'income') {
        total.income += amount;
      } else if (entry.entry_type === 'expense') {
        total.expense += amount;
      }

      total.profit = total.income - total.expense;

      return total;
    },
    {
      income: 0,
      expense: 0,
      profit: 0,
    },
  );
}

function getCurrentPanelElement() {
  return byId(`panel-${state.activePanel}`);
}

function closeAdminSidebar() {
  elements.sidebar?.classList.remove('open');
}

function closeCurrentModal() {
  const openedModal = $('.modal:not([hidden]), .modal.open');

  if (openedModal) {
    closeModal(openedModal);
  }
}

function renderTableError(columnCount, message) {
  return `
    <tr>
      <td colspan="${columnCount}">
        <div class="empty-state empty-state--compact">
          <p>${esc(message)}</p>
        </div>
      </td>
    </tr>
  `;
}

function renderTableEmpty(columnCount, message) {
  return `
    <tr>
      <td colspan="${columnCount}">
        <div class="empty-state empty-state--compact">
          <p>${esc(message)}</p>
        </div>
      </td>
    </tr>
  `;
}

// ============================================================
// PANEL NAVİQASİYASI
// ============================================================

async function showPanel(panelId) {
  const id =
    Object.prototype.hasOwnProperty.call(
      panelTitles,
      panelId,
    )
      ? panelId
      : 'dashboard';

  state.activePanel = id;

  $$('.panel').forEach((panel) => {
    const active =
      panel.id === `panel-${id}`;

    panel.classList.toggle(
      'active',
      active,
    );

    panel.hidden = !active;
  });

  $$('[data-panel]').forEach((button) => {
    const active =
      button.dataset.panel === id;

    button.classList.toggle(
      'active',
      active,
    );

    button.setAttribute(
      'aria-selected',
      String(active),
    );
  });

  if (elements.pageTitle) {
    elements.pageTitle.textContent =
      panelTitles[id];
  }

  if (elements.pageDescription) {
    elements.pageDescription.textContent =
      panelDescriptions[id] ?? '';
  }

  history.replaceState(
    null,
    '',
    `#${id}`,
  );

  closeAdminSidebar();

  try {
    switch (id) {
      case 'dashboard':
        await loadDashboard();
        break;

      case 'pos':
        await loadPOS();
        break;

      case 'attendance':
        await loadAttendance();
        break;

      case 'members':
        await loadMembers();
        break;

      case 'memberships':
        await loadMemberships();
        break;

      case 'debts':
        await loadDebts();
        break;

      case 'products':
        await loadProducts();
        break;

      case 'stock':
        await loadStockMovements();
        break;

      case 'ledger':
        await loadLedger();
        break;

      case 'reports':
        await loadReports();
        break;

      case 'trainers':
        await loadTrainers();
        break;

      case 'settings':
        await loadSettings();
        break;

      default:
        await loadDashboard();
        break;
    }
  } catch (error) {
    reportError(
      error,
      `panel:${id}`,
    );

    toast(
      getErrorMessage(
        error,
        'Məlumatlar yüklənmədi. Yenidən yoxlayın.',
      ),
      'error',
    );
  }
}

function bindPanelNavigation() {
  $$('[data-panel]').forEach((button) => {
    if (button.dataset.panelBound === 'true') {
      return;
    }

    button.dataset.panelBound = 'true';

    button.addEventListener('click', () => {
      void showPanel(button.dataset.panel);
    });
  });

  elements.sidebarToggle?.addEventListener('click', () => {
    elements.sidebar?.classList.toggle('open');
  });
}

// ============================================================
// ADMIN MƏLUMATLARI
// ============================================================

function renderAdminIdentity() {
  if (!state.profile) {
    return;
  }

  if (elements.adminName) {
    elements.adminName.textContent =
      getProfileName(state.profile);
  }

  if (elements.adminAvatar) {
    elements.adminAvatar.src =
      safeImageUrl(state.profile.avatar_url);

    elements.adminAvatar.dataset.fallback =
      FALLBACK_IMAGE;
  }

  $$('[data-admin-name]').forEach((element) => {
    element.textContent =
      getProfileName(state.profile);
  });

    if (elements.adminRole) {
    elements.adminRole.textContent =
      state.profile.role === 'admin'
        ? 'Baş idarəçi'
        : 'İdarəçi';
  }

  if (elements.adminCurrentDate) {
    elements.adminCurrentDate.textContent =
      new Intl.DateTimeFormat(
        'az-AZ',
        {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        },
      ).format(new Date());
  }
  
  bindImageFallbacks();
}

// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {
  if (!sb) return;

  const today = todayISO();
  const monthStart = getDefaultFromDate();

  try {
    const results = await Promise.allSettled([
      sb
        .from('ledger_entries')
        .select(`
          id,
          entry_type,
          category,
          description,
          amount,
          entry_date,
          created_at
        `)
        .gte('entry_date', today)
        .lte('entry_date', today)
        .order('created_at', {
          ascending: false,
        }),

      sb
        .from('ledger_entries')
        .select(`
          id,
          entry_type,
          category,
          description,
          amount,
          entry_date,
          created_at
        `)
        .gte('entry_date', monthStart)
        .lte('entry_date', today)
        .order('entry_date', {
          ascending: false,
        })
        .order('created_at', {
          ascending: false,
        }),

      sb
        .from('memberships')
        .select(`
          id,
          member_id,
          start_date,
          end_date,
          status,
          payment_status,
          member_profile:profiles!memberships_member_id_fkey (
            id,
            full_name,
            email,
            phone,
            avatar_url,
            is_active
          ),
          plan:membership_plans!memberships_plan_id_fkey (
            id,
            name,
            price,
            duration_days,
            is_daily
          )
        `)
        .eq('status', 'active')
        .order('end_date', {
          ascending: true,
        }),

      sb
        .from('debt_accounts')
        .select(`
          member_id,
          balance,
          updated_at,
          member_profile:profiles!debt_accounts_member_id_fkey (
            id,
            full_name,
            email,
            phone,
            avatar_url,
            is_active
          )
        `)
        .gt('balance', 0)
        .order('balance', {
          ascending: false,
        }),

      sb
        .from('products')
        .select(`
          id,
          name,
          stock_quantity,
          stock_unit,
          low_stock_threshold,
          sale_mode,
          portion_size,
          is_active
        `)
        .eq('is_active', true)
        .order('stock_quantity', {
          ascending: true,
        }),

      sb
        .from('sales')
        .select('id,total_amount,payment_status,created_at')
        .gte(
          'created_at',
          `${today}T00:00:00`,
        )
        .lte(
          'created_at',
          `${today}T23:59:59.999`,
        ),
    ]);

    const [
      dailyResult,
      monthlyResult,
      membershipsResult,
      debtsResult,
      productsResult,
      salesResult,
    ] = results;

    state.dashboard.dailyEntries =
      dailyResult.status === 'fulfilled' &&
      !dailyResult.value.error
        ? safeArray(dailyResult.value.data)
        : [];

    state.dashboard.monthlyEntries =
      monthlyResult.status === 'fulfilled' &&
      !monthlyResult.value.error
        ? safeArray(monthlyResult.value.data)
        : [];

    state.dashboard.memberships =
      membershipsResult.status === 'fulfilled' &&
      !membershipsResult.value.error
        ? safeArray(membershipsResult.value.data)
        : [];

    state.dashboard.debts =
      debtsResult.status === 'fulfilled' &&
      !debtsResult.value.error
        ? safeArray(debtsResult.value.data)
        : [];

    state.dashboard.products =
      productsResult.status === 'fulfilled' &&
      !productsResult.value.error
        ? safeArray(productsResult.value.data)
        : [];

    const todaySales =
      salesResult.status === 'fulfilled' &&
      !salesResult.value.error
        ? safeArray(salesResult.value.data)
        : [];

    const dailyTotals =
      calculateLedgerTotals(
        state.dashboard.dailyEntries,
      );

    const monthlyTotals =
      calculateLedgerTotals(
        state.dashboard.monthlyEntries,
      );

    const activeMemberships =
      state.dashboard.memberships.filter(
        (membership) =>
          daysLeft(membership.end_date) >= 0,
      );

    const expiringMemberships =
      state.dashboard.memberships.filter(
        (membership) => {
          const remaining =
            daysLeft(membership.end_date);

          return (
            remaining !== null &&
            remaining <= 3
          );
        },
      );

    const overdueMemberships =
      state.dashboard.memberships.filter(
        (membership) =>
          daysLeft(membership.end_date) < 0,
      );

    const lowStockProducts =
      state.dashboard.products.filter(
        (product) => {
          const stock =
            safeNumber(product.stock_quantity);

          const threshold =
            safeNumber(
              product.low_stock_threshold,
            );

          return stock <= threshold;
        },
      );

    const totalDebt =
      state.dashboard.debts.reduce(
        (total, debt) =>
          total +
          safeNumber(debt.balance),
        0,
      );

    const paidSalesToday =
      todaySales.filter(
        (sale) =>
          sale.payment_status === 'paid',
      ).length;

    renderDashboardStats({
      dailyTotals,
      monthlyTotals,
      activeMemberships,
      expiringMemberships,
      overdueMemberships,
      lowStockProducts,
      totalDebt,
      paidSalesToday,
    });

    renderDashboardLists({
      expiringMemberships,
      lowStockProducts,
      recentLedger:
        state.dashboard.monthlyEntries.slice(
          0,
          8,
        ),
    });

    renderDashboardNotifications({
      expiringMemberships,
      overdueMemberships,
      lowStockProducts,
      debts: state.dashboard.debts,
    });
  } catch (error) {
    reportError(error, 'loadDashboard');

    if (elements.stats) {
      elements.stats.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <p>
              ${esc(getErrorMessage(error))}
            </p>
          </div>
        </div>
      `;
    }

    throw error;
  }
}

function renderDashboardStats({
  dailyTotals,
  monthlyTotals,
  activeMemberships,
  expiringMemberships,
  overdueMemberships,
  lowStockProducts,
  totalDebt,
  paidSalesToday,
}) {
  if (!elements.stats) return;

  const cards = [
    {
      label: 'Bugünkü mədaxil',
      value: money(dailyTotals.income),
      className: 'stat-value--success',
      foot: `${paidSalesToday} ödənişli satış`,
    },

    {
      label: 'Bugünkü məxaric',
      value: money(dailyTotals.expense),
      className: 'stat-value--danger',
      foot: 'Gündəlik xərclər',
    },

    {
      label: 'Bu ay təmiz qazanc',
      value: money(monthlyTotals.profit),
      className:
        monthlyTotals.profit >= 0
          ? 'stat-value--success'
          : 'stat-value--danger',
      foot:
        `${money(monthlyTotals.income)} mədaxil`,
    },

    {
      label: 'Aktiv üzvlər',
      value: String(activeMemberships.length),
      className: '',
      foot:
        `${expiringMemberships.length} nəfərin müddəti yaxınlaşır`,
    },

    {
      label: '3 gün və daha az',
      value: String(expiringMemberships.length),
      className:
        expiringMemberships.length
          ? 'stat-value--danger'
          : '',
      foot:
        `${overdueMemberships.length} vaxtı bitmiş`,
    },

    {
      label: 'Borclu üzvlər',
      value: String(
        state.dashboard.debts.length,
      ),
      className:
        state.dashboard.debts.length
          ? 'stat-value--danger'
          : '',
      foot: `Cəmi ${money(totalDebt)}`,
    },

    {
      label: 'Azalan stok',
      value: String(lowStockProducts.length),
      className:
        lowStockProducts.length
          ? 'stat-value--danger'
          : '',
      foot: 'Stok həddinə çatmış məhsullar',
    },

    {
      label: 'Bu ay dövriyyə',
      value: money(monthlyTotals.income),
      className: 'stat-value--success',
      foot: 'Ümumi mədaxil',
    },
  ];

  elements.stats.innerHTML =
    cards
      .map(
        (card) => `
          <article class="card stat">
            <span class="stat-label">
              ${esc(card.label)}
            </span>

            <strong class="stat-value ${card.className}">
              ${esc(card.value)}
            </strong>

            <span class="stat-foot">
              ${esc(card.foot)}
            </span>
          </article>
        `,
      )
      .join('');
}

function renderDashboardLists({
  expiringMemberships,
  lowStockProducts,
  recentLedger,
}) {
  if (elements.dashboardExpiring) {
    elements.dashboardExpiring.innerHTML =
      expiringMemberships.length
        ? expiringMemberships
            .slice(0, 8)
            .map((membership) => {
              const profile =
                membership.member_profile;

              const remaining =
                daysLeft(membership.end_date);

              return `
                <button
                  class="dashboard-list-item"
                  type="button"
                  data-open-member-membership="${esc(
                    membership.member_id,
                  )}"
                >
                  <span>
                    <strong>
                      ${esc(
                        getProfileName(profile),
                      )}
                    </strong>

                    <small>
                      ${esc(
                        membership.plan
                          ?.name ??
                        'Abunəlik',
                      )}
                    </small>
                  </span>

                  <span class="badge danger">
                    ${
                      remaining < 0
                        ? 'Bitib'
                        : remaining === 0
                          ? 'Bu gün'
                          : `${remaining} gün`
                    }
                  </span>
                </button>
              `;
            })
            .join('')
        : `
          <div class="empty-state empty-state--compact">
            <p>
              Yaxın müddətdə bitən abunəlik yoxdur.
            </p>
          </div>
        `;
  }

  if (elements.dashboardLowStock) {
    elements.dashboardLowStock.innerHTML =
      lowStockProducts.length
        ? lowStockProducts
            .slice(0, 8)
            .map((product) => `
              <button
                class="dashboard-list-item"
                type="button"
                data-edit-product="${esc(product.id)}"
              >
                <span>
                  <strong>
                    ${esc(product.name)}
                  </strong>

                  <small>
                    ${esc(
                      number(
                        product.stock_quantity,
                        3,
                      ),
                    )}
                    ${esc(
                      product.stock_unit ??
                      '',
                    )}
                  </small>
                </span>

                <span class="badge danger">
                  Az stok
                </span>
              </button>
            `)
            .join('')
        : `
          <div class="empty-state empty-state--compact">
            <p>
              Bütün məhsulların stoku normaldır.
            </p>
          </div>
        `;
  }

  if (elements.dashboardRecentLedger) {
    elements.dashboardRecentLedger.innerHTML =
      recentLedger.length
        ? recentLedger
            .map((entry) => `
              <div class="dashboard-list-item">
                <span>
                  <strong>
                    ${esc(entry.category)}
                  </strong>

                  <small>
                    ${esc(
                      fmtDate(entry.entry_date),
                    )}
                    ·
                    ${esc(
                      entry.description || '',
                    )}
                  </small>
                </span>

                <strong class="${
                  entry.entry_type === 'income'
                    ? 'status-success'
                    : 'stat-value--danger'
                }">
                  ${
                    entry.entry_type === 'income'
                      ? '+'
                      : '-'
                  }${esc(money(entry.amount))}
                </strong>
              </div>
            `)
            .join('')
        : `
          <div class="empty-state empty-state--compact">
            <p>
              Dəftər qeydi yoxdur.
            </p>
          </div>
        `;
  }
}

function renderDashboardNotifications({
  expiringMemberships,
  overdueMemberships,
  lowStockProducts,
  debts,
}) {
  const notificationItems = [];

  overdueMemberships
    .slice(0, 6)
    .forEach((membership) => {
      notificationItems.push({
        type: 'danger',
        title:
          `${getProfileName(
            membership.member_profile,
          )} — abunəlik bitib`,
        text:
          `${fmtDate(
            membership.end_date,
          )} tarixində başa çatıb.`,
        action:
          `data-open-member-membership="${esc(
            membership.member_id,
          )}"`,
      });
    });

  expiringMemberships
    .filter(
      (membership) =>
        daysLeft(membership.end_date) >= 0,
    )
    .slice(0, 6)
    .forEach((membership) => {
      notificationItems.push({
        type: 'warning',
        title:
          `${getProfileName(
            membership.member_profile,
          )} — müddət yaxınlaşır`,
        text:
          `${daysLeft(
            membership.end_date,
          )} gün qalıb.`,
        action:
          `data-open-member-membership="${esc(
            membership.member_id,
          )}"`,
      });
    });

  lowStockProducts
    .slice(0, 6)
    .forEach((product) => {
      notificationItems.push({
        type: 'warning',
        title:
          `${product.name} — az stok`,
        text:
          `${number(
            product.stock_quantity,
            3,
          )} ${product.stock_unit ?? ''} qalıb.`,
        action:
          `data-edit-product="${esc(
            product.id,
          )}"`,
      });
    });

  debts
    .slice(0, 4)
    .forEach((debt) => {
      notificationItems.push({
        type: 'danger',
        title:
          `${getProfileName(
            debt.member_profile,
          )} — borc`,
        text: money(debt.balance),
        action:
          `data-pay-debt="${esc(
            debt.member_id,
          )}"`,
      });
    });

  if (elements.notificationCount) {
    elements.notificationCount.textContent =
      String(notificationItems.length);

    elements.notificationCount.hidden =
      notificationItems.length === 0;
  }

  if (!elements.notificationsList) {
    return;
  }

  elements.notificationsList.innerHTML =
    notificationItems.length
      ? notificationItems
          .map((item) => `
            <button
              class="dashboard-list-item"
              type="button"
              ${item.action}
            >
              <span>
                <strong>
                  ${esc(item.title)}
                </strong>

                <small>
                  ${esc(item.text)}
                </small>
              </span>

              <span class="badge ${
                item.type === 'danger'
                  ? 'danger'
                  : 'warn'
              }">
                !
              </span>
            </button>
          `)
          .join('')
      : `
        <div class="empty-state empty-state--compact">
          <p>
            Yeni xəbərdarlıq yoxdur.
          </p>
        </div>
      `;
}

// ============================================================
// MƏHSUL VƏ ÜZV SORĞULARI
// ============================================================

async function fetchProducts({
  includeInactive = false,
} = {}) {
  let query = sb
    .from('products')
    .select('*')
    .order('name', {
      ascending: true,
    });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw error;
  }

  state.products = safeArray(data);

  return state.products;
}

async function fetchMembers() {
  const {
    data,
    error,
  } = await sb
    .from('profiles')
    .select(`
      id,
      auth_user_id,
      role,
      full_name,
      email,
      phone,
      birth_date,
      address,
      avatar_url,
      is_manual,
      is_active,
      created_at
    `)
    .eq('role', 'member')
    .order('full_name', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  state.members = safeArray(data);

  return state.members;
}

async function fetchMembershipPlans() {
  const {
    data,
    error,
  } = await sb
    .from('membership_plans')
    .select('*')
    .eq('is_active', true)
    .order('duration_days', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  state.plans = safeArray(data);

  return state.plans;
}

// ============================================================
// POS
// ============================================================

async function loadPOS() {
  await Promise.all([
    fetchProducts(),
    fetchMembers(),
  ]);

  renderPOSProducts();
  renderPOSMembers();
  renderCart();
}

function getFilteredPOSProducts() {
  const search =
    String(
      elements.posSearch?.value ?? '',
    )
      .trim()
      .toLocaleLowerCase('az-AZ');

  if (!search) {
    return state.products;
  }

  return state.products.filter((product) => {
    const text = [
      product.name,
      product.category,
      product.sku,
      product.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('az-AZ');

    return text.includes(search);
  });
}

function renderPOSProducts() {
  if (!elements.posProducts) return;

  const products =
    getFilteredPOSProducts();

  if (!products.length) {
    elements.posProducts.innerHTML = `
      <div class="empty-state">
        <p>
          Məhsul tapılmadı.
        </p>
      </div>
    `;

    return;
  }

  elements.posProducts.innerHTML =
    products
      .map((product) => {
        const stockState =
          getStockState(product);

        const availableCount =
          getProductAvailableSaleCount(
            product,
          );

        return `
          <button
            class="card pos-item"
            type="button"
            data-add-cart="${esc(product.id)}"
            ${
              availableCount <= 0
                ? 'disabled'
                : ''
            }
          >
            <div class="split">
              <span class="badge ${
                product.sale_mode === 'portion'
                  ? 'info'
                  : ''
              }">
                ${
                  product.sale_mode === 'portion'
                    ? 'Porsiya'
                    : 'Ədəd'
                }
              </span>

              <span class="${stockState.className}">
                ${esc(stockState.label)}
              </span>
            </div>

            <div>
              <strong>
                ${esc(product.name)}
              </strong>

              <div class="price">
                ${esc(
                  getSalePriceLabel(product),
                )}
              </div>
            </div>

            <small class="muted">
              ${
                product.sale_mode === 'portion'
                  ? `${number(
                      product.portion_size,
                      3,
                    )} ${
                      product.stock_unit ??
                      ''
                    } / porsiya · ${availableCount} satış`
                  : `Stok: ${number(
                      product.stock_quantity,
                      3,
                    )} ${
                      product.stock_unit ??
                      ''
                    }`
              }
            </small>
          </button>
        `;
      })
      .join('');
}

function renderPOSMembers() {
  if (!elements.posMember) return;

  const currentValue =
    state.selectedPosMemberId ??
    elements.posMember.value ??
    '';

  elements.posMember.innerHTML = `
    <option value="">
      Anonim müştəri
    </option>

    ${state.members
      .filter((member) => member.is_active)
      .map((member) => `
        <option
          value="${esc(member.id)}"
          ${
            currentValue === member.id
              ? 'selected'
              : ''
          }
        >
          ${esc(getProfileName(member))}
          ${
            member.phone
              ? ` — ${esc(member.phone)}`
              : ''
          }
        </option>
      `)
      .join('')}
  `;

  elements.posMember.value =
    currentValue;

  state.selectedPosMemberId =
    currentValue || null;
}

function addCart(productId) {
  const product =
    state.products.find(
      (item) =>
        String(item.id) ===
        String(productId),
    );

  if (!product) {
    toast(
      'Məhsul tapılmadı.',
      'error',
    );

    return;
  }

  const availableCount =
    getProductAvailableSaleCount(
      product,
    );

  if (availableCount <= 0) {
    toast(
      `${product.name} üçün stok yoxdur.`,
      'error',
    );

    return;
  }

  const existing =
    state.cart.find(
      (item) =>
        String(item.product_id) ===
        String(product.id),
    );

  if (existing) {
    if (
      existing.quantity + 1 >
      availableCount
    ) {
      toast(
        `${product.name} üçün kifayət qədər stok yoxdur.`,
        'error',
      );

      return;
    }

    existing.quantity += 1;
  } else {
    state.cart.push({
      product_id: product.id,
      name: product.name,
      quantity: 1,
      unit_price:
        getSalePrice(product),
      sale_mode:
        product.sale_mode,
      portion_size:
        safeNumber(
          product.portion_size || 1,
        ),
      stock_unit:
        product.stock_unit,
      max_quantity:
        availableCount,
    });
  }

  renderCart();
}

function changeCartQuantity(
  productId,
  change,
) {
  const item =
    state.cart.find(
      (cartItem) =>
        String(cartItem.product_id) ===
        String(productId),
    );

  if (!item) return;

  const nextQuantity =
    item.quantity +
    safeNumber(change);

  if (nextQuantity <= 0) {
    state.cart =
      state.cart.filter(
        (cartItem) =>
          String(
            cartItem.product_id,
          ) !== String(productId),
      );

    renderCart();

    return;
  }

  if (
    nextQuantity >
    item.max_quantity
  ) {
    toast(
      `${item.name} üçün stok kifayət deyil.`,
      'error',
    );

    return;
  }

  item.quantity =
    nextQuantity;

  renderCart();
}

function removeCartItem(productId) {
  state.cart =
    state.cart.filter(
      (item) =>
        String(item.product_id) !==
        String(productId),
    );

  renderCart();
}

function clearCart() {
  state.cart = [];
  renderCart();
}

function getCartSubtotal() {
  return state.cart.reduce(
    (total, item) =>
      total +
      item.quantity *
        item.unit_price,
    0,
  );
}

function getCartDiscount() {
  const value =
    safeNumber(
      elements.cartDiscountInput
        ?.value ??
      0,
    );

  return Math.max(
    0,
    Math.min(
      value,
      getCartSubtotal(),
    ),
  );
}

function getCartTotal() {
  return Math.max(
    0,
    getCartSubtotal() -
      getCartDiscount(),
  );
}

function renderCart() {
  if (!elements.cartLines) return;

  if (!state.cart.length) {
    elements.cartLines.innerHTML = `
      <div class="empty-state empty-state--compact">
        <p>
          Səbət boşdur.
        </p>
      </div>
    `;
  } else {
    elements.cartLines.innerHTML =
      state.cart
        .map((item) => `
          <div class="cart-line">
            <div>
              <strong>
                ${esc(item.name)}
              </strong>

              <small class="muted">
                ${esc(money(item.unit_price))}
                ${
                  item.sale_mode === 'portion'
                    ? ` · ${number(
                        item.portion_size,
                        3,
                      )} ${
                        item.stock_unit ??
                        ''
                      }`
                    : ''
                }
              </small>
            </div>

            <div class="cart-quantity">
              <button
                class="btn btn-small"
                type="button"
                data-cart-quantity="${esc(item.product_id)}"
                data-change="-1"
                aria-label="Azalt"
              >
                −
              </button>

              <strong>
                ${number(item.quantity, 2)}
              </strong>

              <button
                class="btn btn-small"
                type="button"
                data-cart-quantity="${esc(item.product_id)}"
                data-change="1"
                aria-label="Artır"
              >
                +
              </button>
            </div>

            <div>
              <strong>
                ${esc(
                  money(
                    item.quantity *
                    item.unit_price,
                  ),
                )}
              </strong>

              <button
                class="icon-btn"
                type="button"
                data-remove-cart="${esc(item.product_id)}"
                aria-label="Məhsulu səbətdən sil"
              >
                ×
              </button>
            </div>
          </div>
        `)
        .join('');
  }

  const subtotal =
    getCartSubtotal();

  const discount =
    getCartDiscount();

  const total =
    getCartTotal();

  if (elements.cartSubtotal) {
    elements.cartSubtotal.textContent =
      money(subtotal);
  }

  if (elements.cartDiscount) {
    elements.cartDiscount.textContent =
      money(discount);
  }

  if (elements.cartTotal) {
    elements.cartTotal.textContent =
      money(total);
  }
}

async function completeSale() {
  if (!state.cart.length) {
    toast(
      'Səbət boşdur.',
      'error',
    );

    return;
  }

  const paymentStatus =
    elements.paymentStatus
      ?.value ??
    'paid';

  const memberId =
    elements.posMember
      ?.value ||
    null;

  if (
    paymentStatus === 'debt' &&
    !memberId
  ) {
    toast(
      'Borca satış üçün üzv seçilməlidir.',
      'error',
    );

    elements.posMember?.focus();

    return;
  }

  const discount =
    getCartDiscount();

  if (discount > 0) {
    toast(
      'Mövcud SQL process_sale funksiyası endirimi ayrıca qəbul etmir. Endirim tətbiq etmək üçün məhsul qiymətlərini səbətdə dəyişmək lazımdır.',
      'info',
      5500,
    );
  }

  const confirmed =
    await confirmAction({
      title: 'Satışı tamamla',
      message:
        `${money(
          getCartTotal(),
        )} məbləğində satışı təsdiqləyirsiniz?`,
      confirmLabel:
        'Satışı tamamla',
      danger: false,
    });

  if (!confirmed) return;

  const button =
    elements.completeSaleButton ??
    $('[onclick="completeSale()"]');

  setBusy(
    button,
    true,
    'Satış tamamlanır...',
  );

  try {
    const payload = {
      p_member_id: memberId,

      p_payment_method:
        elements.paymentMethod
          ?.value ??
        'cash',

      p_payment_status:
        paymentStatus,

      p_items:
        state.cart.map((item) => ({
          product_id:
            item.product_id,

          quantity:
            item.quantity,

          unit_price:
            item.unit_price,
        })),
    };

    const {
      data,
      error,
    } = await sb.rpc(
      'process_sale',
      payload,
    );

    if (error) {
      throw error;
    }

    toast(
      `Satış uğurla tamamlandı. Qəbz ID: ${data}`,
      'success',
      5000,
    );

    state.cart = [];

    if (
      elements.cartDiscountInput
    ) {
      elements.cartDiscountInput.value =
        '0';
    }

    await Promise.all([
      loadPOS(),
      loadDashboard(),
    ]);
  } catch (error) {
    reportError(
      error,
      'completeSale',
    );

    toast(
      getErrorMessage(error),
      'error',
    );
  } finally {
    setBusy(button, false);
  }
}

// ============================================================
// ÜZVLƏR VƏ ABUNƏLİKLƏR
// ============================================================

async function loadMembers() {
  await Promise.all([
    fetchMembers(),
    fetchMembershipPlans(),
  ]);

  const [
    membershipsResult,
    debtsResult,
  ] = await Promise.all([
    sb
      .from('memberships')
      .select(`
        id,
        member_id,
        plan_id,
        start_date,
        end_date,
        price,
        status,
        payment_status,
        created_at,

        member_profile:profiles!memberships_member_id_fkey (
          id,
          full_name,
          email,
          phone,
          avatar_url,
          is_active
        ),

        plan:membership_plans!memberships_plan_id_fkey (
          id,
          name,
          price,
          duration_days,
          is_daily
        )
      `)
      .order('end_date', {
        ascending: false,
      }),

    sb
      .from('debt_accounts')
      .select(`
        member_id,
        balance,
        updated_at
      `),
  ]);

  if (membershipsResult.error) {
    throw membershipsResult.error;
  }

  if (debtsResult.error) {
    throw debtsResult.error;
  }

  state.memberships =
    safeArray(
      membershipsResult.data,
    );

  state.debts =
    safeArray(
      debtsResult.data,
    );

  renderMembersTable();
}

function getFilteredMembers() {
  const search =
    String(
      elements.memberSearch
        ?.value ??
      '',
    )
      .trim()
      .toLocaleLowerCase('az-AZ');

  if (!search) {
    return state.members;
  }

  return state.members.filter((member) => {
    const text = [
      member.full_name,
      member.email,
      member.phone,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('az-AZ');

    return text.includes(search);
  });
}

function findLatestMembership(memberId) {
  return state.memberships.find(
    (membership) =>
      String(membership.member_id) ===
      String(memberId),
  );
}

function renderMembersTable() {
  if (!elements.membersTable) {
    return;
  }

  const members =
    getFilteredMembers();

  if (!members.length) {
    elements.membersTable.innerHTML =
      renderTableEmpty(
        8,
        'Üzv tapılmadı.',
      );

    return;
  }

  elements.membersTable.innerHTML =
    members
      .map((member) => {
        const membership =
          findLatestMembership(
            member.id,
          );

        const plan =
          membership?.plan ??
          null;

        const debt =
          state.debts.find(
            (item) =>
              String(item.member_id) ===
              String(member.id),
          );

        const debtBalance =
          safeNumber(
            debt?.balance,
          );

        const registrationLabel =
          member.is_manual
            ? 'Əllə əlavə edilib'
            : 'Email hesabı';

        return `
          <tr>
            <td>
              <div class="table-person">
                <img
                  src="${esc(
                    safeImageUrl(
                      member.avatar_url,
                    ),
                  )}"
                  alt=""
                  data-image-fallback
                >

                <span>
                  <strong>
                    ${esc(
                      getProfileName(
                        member,
                      ),
                    )}
                  </strong>
                </span>
              </div>
            </td>

            <td>
              ${esc(
                member.phone ??
                '—',
              )}
            </td>

            <td>
              ${esc(
                member.email ??
                '—',
              )}
            </td>

            <td>
              ${
                membership
                  ? `
                    <strong>
                      ${esc(
                        plan?.name ??
                        'Üzvlük',
                      )}
                    </strong>

                    <small class="table-secondary-text">
                      ${esc(
                        fmtDate(
                          membership.end_date,
                        ),
                      )}-dək
                    </small>
                  `
                  : `
                    <span class="badge danger">
                      Abunəlik yoxdur
                    </span>
                  `
              }
            </td>

            <td>
              <strong class="${
                debtBalance > 0
                  ? 'stat-value--danger'
                  : 'status-success'
              }">
                ${esc(
                  money(
                    debtBalance,
                  ),
                )}
              </strong>
            </td>

            <td>
              ${
                member.is_active
                  ? `
                    <span class="badge ok">
                      Aktiv
                    </span>
                  `
                  : `
                    <span class="badge danger">
                      Deaktiv
                    </span>
                  `
              }
            </td>

            <td>
              <span class="badge">
                ${esc(
                  registrationLabel,
                )}
              </span>
            </td>

            <td>
              <div class="table-actions">
                <button
                  class="btn btn-small"
                  type="button"
                  data-open-member-membership="${esc(
                    member.id,
                  )}"
                >
                  Abunəlik
                </button>

                <button
                  class="btn btn-outline btn-small"
                  type="button"
                  data-edit-member="${esc(
                    member.id,
                  )}"
                >
                  Düzəlt
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

  bindImageFallbacks(
    elements.membersTable,
  );
}

async function openMembership(memberId = '') {
  await Promise.all([
    state.members.length
      ? Promise.resolve()
      : fetchMembers(),

    state.plans.length
      ? Promise.resolve()
      : fetchMembershipPlans(),
  ]);

  if (!state.members.length) {
    toast(
      'Əvvəlcə üzv əlavə edin.',
      'error',
    );

    return;
  }

  if (!state.plans.length) {
    toast(
      'Aktiv üzvlük planı tapılmadı.',
      'error',
    );

    return;
  }

  const content = `
    <form
      id="membershipForm"
      class="form-grid"
    >
      <label class="field">
        <span>Üzv</span>

        <select
          class="input"
          name="member_id"
          required
        >
          ${state.members
            .filter(
              (member) =>
                member.is_active,
            )
            .map((member) => `
              <option
                value="${esc(member.id)}"
                ${
                  String(member.id) ===
                  String(memberId)
                    ? 'selected'
                    : ''
                }
              >
                ${esc(
                  getProfileName(member),
                )}
                ${
                  member.phone
                    ? ` — ${esc(member.phone)}`
                    : ''
                }
              </option>
            `)
            .join('')}
        </select>
      </label>

      <label class="field">
        <span>Abunəlik planı</span>

        <select
          class="input"
          name="plan_id"
          required
        >
          ${state.plans
            .filter((plan) => !plan.is_daily)
            .map((plan) => `
              <option value="${esc(plan.id)}">
                ${esc(plan.name)}
                —
                ${esc(money(plan.price))}
                /
                ${plan.duration_days} gün
              </option>
            `)
            .join('')}
        </select>
      </label>

      <label class="field">
        <span>Başlama tarixi</span>

        <input
          class="input"
          type="date"
          name="start_date"
          value="${todayISO()}"
          required
        >
      </label>

      <label class="field">
        <span>Ödəniş vəziyyəti</span>

        <select
          class="input"
          name="payment_status"
          required
        >
          <option value="paid">
            Ödənilib
          </option>

          <option value="debt">
            Borca yaz
          </option>
        </select>
      </label>

      <div
        id="membershipFormMessage"
        class="form-message"
        hidden
      ></div>

      <button
        class="btn btn-primary"
        type="submit"
      >
        <span class="button-label">
          Abunəliyi yarat
        </span>

        <span
          class="button-loader"
          hidden
        ></span>
      </button>
    </form>
  `;

  modal(content, {
    kicker: 'Üzvlük',
    title: 'Abunəlik əlavə et',
  });

  byId('membershipForm')
    ?.addEventListener(
      'submit',
      handleMembershipSubmit,
      {
        once: true,
      },
    );
}

async function handleMembershipSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const button =
    $('button[type="submit"]', form);

  setBusy(
    button,
    true,
    'Yaradılır...',
  );

  setFormMessage(
    '#membershipFormMessage',
    '',
  );

  try {
    const {
      error,
    } = await sb.rpc(
      'create_membership',
      {
        p_member_id:
          formData.get('member_id'),

        p_plan_id:
          formData.get('plan_id'),

        p_start_date:
          formData.get('start_date'),

        p_payment_status:
          formData.get(
            'payment_status',
          ),
      },
    );

    if (error) {
      throw error;
    }

    toast(
      'Abunəlik uğurla yaradıldı.',
      'success',
    );

    closeCurrentModal();

    await Promise.all([
      loadMembers(),
      loadDashboard(),
    ]);
  } catch (error) {
    reportError(
      error,
      'createMembership',
    );

    setFormMessage(
      '#membershipFormMessage',
      getErrorMessage(error),
      'error',
    );
  } finally {
    setBusy(button, false);
  }
}

function openNewMember() {
  openMemberEditor();
}

function openMemberEditor(memberId = '') {
  const member =
    state.members.find(
      (item) =>
        String(item.id) ===
        String(memberId),
    ) ?? {};

  const editing = Boolean(member.id);

  const content = `
    <form
      id="memberForm"
      class="form-grid"
    >
      <input
        type="hidden"
        name="id"
        value="${esc(member.id ?? '')}"
      >

      <div class="notice">
        ${
          editing
            ? 'Üzv profilinin əsas məlumatlarını yeniləyin.'
            : 'Bu hissədən email hesabı olmayan manual zal üzvü əlavə edilir. İstifadəçi özü qeydiyyatdan keçəcəksə register.html istifadə etməlidir.'
        }
      </div>

      <label class="field">
        <span>Ad və soyad *</span>

        <input
          class="input"
          name="full_name"
          value="${esc(member.full_name ?? '')}"
          placeholder="Ad Soyad"
          required
        >
      </label>

      <div class="grid grid-2">
        <label class="field">
          <span>Telefon</span>

          <input
            class="input"
            name="phone"
            value="${esc(member.phone ?? '')}"
            placeholder="+994..."
          >
        </label>

        <label class="field">
          <span>Email</span>

          <input
            class="input"
            name="email"
            type="email"
            value="${esc(member.email ?? '')}"
            placeholder="Email"
          >
        </label>
      </div>

      <div class="grid grid-2">
        <label class="field">
          <span>Doğum tarixi</span>

          <input
            class="input"
            name="birth_date"
            type="date"
            value="${esc(member.birth_date ?? '')}"
          >
        </label>

        <label class="field">
          <span>Status</span>

          <select
            class="input"
            name="is_active"
          >
            <option
              value="true"
              ${
                member.is_active !== false
                  ? 'selected'
                  : ''
              }
            >
              Aktiv
            </option>

            <option
              value="false"
              ${
                member.is_active === false
                  ? 'selected'
                  : ''
              }
            >
              Deaktiv
            </option>
          </select>
        </label>
      </div>

      <label class="field">
        <span>Ünvan</span>

        <textarea
          class="input"
          name="address"
          placeholder="Ünvan"
        >${esc(member.address ?? '')}</textarea>
      </label>

      <div
        id="memberFormMessage"
        class="form-message"
        hidden
      ></div>

      <button
        class="btn btn-primary"
        type="submit"
      >
        <span class="button-label">
          ${
            editing
              ? 'Dəyişiklikləri saxla'
              : 'Üzvü əlavə et'
          }
        </span>

        <span
          class="button-loader"
          hidden
        ></span>
      </button>
    </form>
  `;

  modal(content, {
    kicker: 'Üzvlər',
    title:
      editing
        ? 'Üzvü düzəlt'
        : 'Yeni üzv',
  });

  byId('memberForm')
    ?.addEventListener(
      'submit',
      handleMemberSubmit,
      {
        once: true,
      },
    );
}

async function handleMemberSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const button =
    $('button[type="submit"]', form);

  const id =
    String(
      formData.get('id') ?? '',
    ).trim();

  const fullName =
    String(
      formData.get('full_name') ??
      '',
    ).trim();

  if (fullName.length < 3) {
    setFormMessage(
      '#memberFormMessage',
      'Ad və soyad ən azı 3 simvol olmalıdır.',
      'error',
    );

    return;
  }

  const row = {
    full_name: fullName,

    phone:
      String(
        formData.get('phone') ??
        '',
      ).trim() || null,

    email:
      String(
        formData.get('email') ??
        '',
      )
        .trim()
        .toLocaleLowerCase('az-AZ') ||
      null,

    birth_date:
      formData.get('birth_date') ||
      null,

    address:
      String(
        formData.get('address') ??
        '',
      ).trim() || null,

    is_active:
      formData.get('is_active') !==
      'false',

    role: 'member',
  };

  setBusy(
    button,
    true,
    'Yadda saxlanılır...',
  );

  try {
    let query;

    if (id) {
      query = sb
        .from('profiles')
        .update(row)
        .eq('id', id);
    } else {
      query = sb
        .from('profiles')
        .insert({
          ...row,
          is_manual: true,
        });
    }

    const {
      error,
    } = await query;

    if (error) {
      throw error;
    }

    toast(
      id
        ? 'Üzv məlumatları yeniləndi.'
        : 'Yeni üzv əlavə edildi.',
      'success',
    );

    closeCurrentModal();

    await loadMembers();
  } catch (error) {
    reportError(
      error,
      'saveMember',
    );

    setFormMessage(
      '#memberFormMessage',
      getErrorMessage(error),
      'error',
    );
  } finally {
    setBusy(button, false);
  }
}

async function loadAttendance() {
  await fetchMembers();

  const today = todayISO();

  const {
    data,
    error,
  } = await sb
    .from('attendance')
    .select(`
      id,
      member_id,
      membership_id,
      attendance_type,
      amount,
      checked_in_at,
      member_profile:profiles!attendance_member_id_fkey (
        id,
        full_name,
        email,
        phone,
        avatar_url
      )
    `)
    .gte(
      'checked_in_at',
      `${today}T00:00:00`,
    )
    .lte(
      'checked_in_at',
      `${today}T23:59:59.999`,
    )
    .order(
      'checked_in_at',
      {
        ascending: false,
      },
    );

  if (error) {
    throw error;
  }

  state.attendance =
    safeArray(data);

  renderTodayAttendance();
}

function renderTodayAttendance() {
  if (elements.todayAttendanceCount) {
    elements.todayAttendanceCount.textContent =
      String(
        state.attendance.length,
      );
  }

  if (!elements.todayAttendanceTable) {
    return;
  }

  if (!state.attendance.length) {
    elements.todayAttendanceTable.innerHTML =
      renderTableEmpty(
        4,
        'Bu gün giriş qeydə alınmayıb.',
      );

    return;
  }

  elements.todayAttendanceTable.innerHTML =
    state.attendance
      .map((entry) => `
        <tr>
          <td>
            ${esc(
              fmtDateTime(
                entry.checked_in_at,
              ),
            )}
          </td>

          <td>
            ${esc(
              getProfileName(
                entry.member_profile,
              ),
            )}
          </td>

          <td>
            <span class="badge ${
              entry.attendance_type ===
              'membership'
                ? 'ok'
                : 'warn'
            }">
              ${
                entry.attendance_type ===
                'membership'
                  ? 'Abunəlik'
                  : 'Günlük giriş'
              }
            </span>
          </td>

          <td>
            ${esc(
              money(entry.amount),
            )}
          </td>
        </tr>
      `)
      .join('');
}

function renderAttendanceMemberResults(
  searchValue,
) {
  if (
    !elements.attendanceMemberResults
  ) {
    return;
  }

  const search =
    String(searchValue ?? '')
      .trim()
      .toLocaleLowerCase('az-AZ');

  if (search.length < 2) {
    elements.attendanceMemberResults.innerHTML =
      '';

    return;
  }

  const filtered =
    state.members
      .filter((member) => {
        const text = [
          member.full_name,
          member.phone,
          member.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase(
            'az-AZ',
          );

        return text.includes(search);
      })
      .slice(0, 8);

  elements.attendanceMemberResults.innerHTML =
    filtered.length
      ? filtered
          .map((member) => `
            <button
              type="button"
              class="member-search-result"
              data-select-attendance-member="${esc(
                member.id,
              )}"
            >
              <img
                src="${esc(
                  safeImageUrl(
                    member.avatar_url,
                  ),
                )}"
                alt=""
              >

              <span>
                <strong>
                  ${esc(
                    getProfileName(
                      member,
                    ),
                  )}
                </strong>

                <small>
                  ${esc(
                    member.phone ||
                    member.email ||
                    'Əlaqə yoxdur',
                  )}
                </small>
              </span>
            </button>
          `)
          .join('')
      : `
        <div class="empty-state empty-state--compact">
          Üzv tapılmadı.
        </div>
      `;
}

function selectAttendanceMember(
  memberId,
) {
  const member =
    state.members.find(
      (item) =>
        String(item.id) ===
        String(memberId),
    );

  if (!member) return;

  elements.attendanceMemberId.value =
    member.id;

  elements.attendanceSelectedName.textContent =
    getProfileName(member);

  elements.attendanceSelectedDetails.textContent =
    member.phone ||
    member.email ||
    'Əlaqə yoxdur';

  elements.attendanceSelectedAvatar.src =
    safeImageUrl(
      member.avatar_url,
    );

  elements.attendanceSelectedMember.hidden =
    false;

  elements.attendanceMemberResults.innerHTML =
    '';

  elements.attendanceMemberSearch.value =
    '';
}

function clearAttendanceMember() {
  if (elements.attendanceMemberId) {
    elements.attendanceMemberId.value =
      '';
  }

  if (
    elements.attendanceSelectedMember
  ) {
    elements.attendanceSelectedMember.hidden =
      true;
  }

  if (
    elements.attendanceMemberResults
  ) {
    elements.attendanceMemberResults.innerHTML =
      '';
  }
}

async function handleAttendanceSubmit(
  event,
) {
  event.preventDefault();

  const memberId =
    elements.attendanceMemberId
      ?.value;

  if (!memberId) {
    setFormMessage(
      elements.attendanceMessage,
      'Əvvəlcə üzv seçin.',
      'error',
    );

    return;
  }

  setBusy(
    elements.attendanceSubmitButton,
    true,
    'Giriş qeydə alınır...',
  );

  try {
    const {
      error,
    } = await sb.rpc(
      'record_attendance',
      {
        p_member_id: memberId,

        p_payment_method:
          elements
            .attendancePaymentMethod
            ?.value ??
          'cash',
      },
    );

    if (error) {
      throw error;
    }

    toast(
      'Zala giriş uğurla qeydə alındı.',
      'success',
    );

    clearAttendanceMember();

    await Promise.all([
      loadAttendance(),
      loadDashboard(),
    ]);
  } catch (error) {
    setFormMessage(
      elements.attendanceMessage,
      getErrorMessage(error),
      'error',
    );
  } finally {
    setBusy(
      elements.attendanceSubmitButton,
      false,
    );
  }
}


async function loadMemberships() {
  await Promise.all([
    fetchMembers(),
    fetchMembershipPlans(),
  ]);

  const {
    data,
    error,
  } = await sb
    .from('memberships')
    .select(`
      id,
      member_id,
      plan_id,
      start_date,
      end_date,
      price,
      status,
      payment_status,
      created_at,

      member_profile:profiles!memberships_member_id_fkey (
        id,
        full_name,
        email,
        phone,
        avatar_url,
        is_active
      ),

      plan:membership_plans!memberships_plan_id_fkey (
        id,
        name,
        price,
        duration_days,
        is_daily
      )
    `)
    .order(
      'end_date',
      {
        ascending: false,
      },
    );

  if (error) {
    throw error;
  }

  state.memberships =
    safeArray(data);

  renderMembershipFilters();
  renderMembershipsTable();
}

function renderMembershipFilters() {
  if (
    !elements.membershipPlanFilter
  ) {
    return;
  }

  const current =
    elements.membershipPlanFilter
      .value ||
    'all';

  elements.membershipPlanFilter.innerHTML = `
    <option value="all">
      Bütün planlar
    </option>

    ${state.plans
      .map((plan) => `
        <option
          value="${esc(plan.id)}"
        >
          ${esc(plan.name)}
        </option>
      `)
      .join('')}
  `;

  elements.membershipPlanFilter.value =
    current;
}

function getFilteredMemberships() {
  const search =
    String(
      elements.membershipSearch
        ?.value ??
      '',
    )
      .trim()
      .toLocaleLowerCase('az-AZ');

  const statusFilter =
    elements.membershipStatusFilter
      ?.value ??
    'all';

  const planFilter =
    elements.membershipPlanFilter
      ?.value ??
    'all';

  return state.memberships.filter(
    (membership) => {
      const profile =
        membership.member_profile ??
        {};

      const searchText = [
        profile.full_name,
        profile.phone,
        profile.email,
        membership.plan?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase(
          'az-AZ',
        );

      if (
        search &&
        !searchText.includes(search)
      ) {
        return false;
      }

      if (
        planFilter !== 'all' &&
        String(
          membership.plan_id,
        ) !== planFilter
      ) {
        return false;
      }

      if (
        statusFilter !== 'all'
      ) {
        const membershipStatus =
          membershipState(
            membership.end_date,
          ).key;

        if (
          membershipStatus !==
          statusFilter
        ) {
          return false;
        }
      }

      return true;
    },
  );
}

function renderMembershipsTable() {
  if (!elements.membershipsTable) {
    return;
  }

  const memberships =
    getFilteredMemberships();

  if (!memberships.length) {
    elements.membershipsTable.innerHTML =
      renderTableEmpty(
        8,
        'Abunəlik tapılmadı.',
      );

    if (elements.membershipsEmpty) {
      elements.membershipsEmpty.hidden =
        false;
    }

    return;
  }

  if (elements.membershipsEmpty) {
    elements.membershipsEmpty.hidden =
      true;
  }

  elements.membershipsTable.innerHTML =
    memberships
      .map((membership) => {
        const remaining =
          daysLeft(
            membership.end_date,
          );

        return `
          <tr>
            <td>
              ${esc(
                getProfileName(
                  membership.member_profile,
                ),
              )}
            </td>

            <td>
              ${esc(
                membership.plan?.name ??
                'Plan',
              )}
            </td>

            <td>
              ${esc(
                fmtDate(
                  membership.start_date,
                ),
              )}
            </td>

            <td>
              ${esc(
                fmtDate(
                  membership.end_date,
                ),
              )}
            </td>

            <td>
              ${
                remaining === null
                  ? '—'
                  : remaining < 0
                    ? `${Math.abs(
                        remaining,
                      )} gün keçib`
                    : `${remaining} gün`
              }
            </td>

            <td>
              ${paymentStatusBadge(
                membership.payment_status,
              )}
            </td>

            <td>
              ${getMembershipStatusLabel(
                membership,
              )}
            </td>

            <td>
              <button
                class="btn btn-small"
                type="button"
                data-open-member-membership="${esc(
                  membership.member_id,
                )}"
              >
                Yenilə
              </button>
            </td>
          </tr>
        `;
      })
      .join('');
}


async function loadStockMovements() {
  if (!state.products.length) {
    await fetchProducts({
      includeInactive: true,
    });
  }

  const from =
    elements.stockDateFrom?.value ||
    getDefaultFromDate();

  const to =
    elements.stockDateTo?.value ||
    todayISO();

  if (elements.stockDateFrom) {
    elements.stockDateFrom.value =
      from;
  }

  if (elements.stockDateTo) {
    elements.stockDateTo.value =
      to;
  }

  let query = sb
    .from('stock_movements')
    .select(`
      id,
      product_id,
      movement_type,
      quantity,
      balance_after,
      unit_cost,
      note,
      created_at,

      product:products!stock_movements_product_id_fkey (
        id,
        name,
        stock_unit
      )
    `)
    .gte(
      'created_at',
      `${from}T00:00:00`,
    )
    .lte(
      'created_at',
      `${to}T23:59:59.999`,
    )
    .order(
      'created_at',
      {
        ascending: false,
      },
    );

  const productFilter =
    elements.stockProductFilter
      ?.value ??
    'all';

  const movementFilter =
    elements.stockMovementFilter
      ?.value ??
    'all';

  if (productFilter !== 'all') {
    query = query.eq(
      'product_id',
      productFilter,
    );
  }

  if (movementFilter !== 'all') {
    query = query.eq(
      'movement_type',
      movementFilter,
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw error;
  }

  state.stockMovements =
    safeArray(data);

  renderStockProductFilter();
  renderStockMovementsTable();
}

function renderStockProductFilter() {
  if (!elements.stockProductFilter) {
    return;
  }

  const current =
    elements.stockProductFilter
      .value ||
    'all';

  elements.stockProductFilter.innerHTML = `
    <option value="all">
      Bütün məhsullar
    </option>

    ${state.products
      .map((product) => `
        <option
          value="${esc(product.id)}"
        >
          ${esc(product.name)}
        </option>
      `)
      .join('')}
  `;

  elements.stockProductFilter.value =
    current;
}

function getMovementLabel(type) {
  const labels = {
    purchase: 'Alış',
    sale: 'Satış',
    adjustment: 'Düzəliş',
    waste: 'İtki',
    return: 'Qaytarma',
  };

  return labels[type] ??
    type ??
    'Əməliyyat';
}

function renderStockMovementsTable() {
  if (!elements.stockMovementsTable) {
    return;
  }

  if (!state.stockMovements.length) {
    elements.stockMovementsTable.innerHTML =
      renderTableEmpty(
        7,
        'Stok hərəkəti yoxdur.',
      );

    if (
      elements.stockMovementsEmpty
    ) {
      elements.stockMovementsEmpty.hidden =
        false;
    }

    return;
  }

  if (
    elements.stockMovementsEmpty
  ) {
    elements.stockMovementsEmpty.hidden =
      true;
  }

  elements.stockMovementsTable.innerHTML =
    state.stockMovements
      .map((movement) => `
        <tr>
          <td>
            ${esc(
              fmtDateTime(
                movement.created_at,
              ),
            )}
          </td>

          <td>
            ${esc(
              movement.product?.name ??
              'Məhsul',
            )}
          </td>

          <td>
            <span class="badge ${
              movement.quantity < 0
                ? 'danger'
                : 'ok'
            }">
              ${esc(
                getMovementLabel(
                  movement.movement_type,
                ),
              )}
            </span>
          </td>

          <td>
            <strong class="${
              movement.quantity < 0
                ? 'stat-value--danger'
                : 'status-success'
            }">
              ${
                movement.quantity > 0
                  ? '+'
                  : ''
              }${esc(
                number(
                  movement.quantity,
                  3,
                ),
              )}
            </strong>
          </td>

          <td>
            ${esc(
              number(
                movement.balance_after,
                3,
              ),
            )}
            ${esc(
              movement.product
                ?.stock_unit ??
              '',
            )}
          </td>

          <td>
            ${esc(
              money(
                movement.unit_cost,
              ),
            )}
          </td>

          <td>
            ${esc(
              movement.note ??
              '—',
            )}
          </td>
        </tr>
      `)
      .join('');
}

async function loadSettings() {
  const [plansResult, staffResult] = await Promise.all([
    sb
      .from('membership_plans')
      .select('*')
      .order('duration_days', { ascending: true }),

    sb
      .from('profiles')
      .select(`
        id,
        auth_user_id,
        full_name,
        email,
        phone,
        role,
        is_active,
        created_at
      `)
      .in('role', ['admin', 'staff'])
      .order('role', { ascending: true })
      .order('full_name', { ascending: true }),
  ]);

  if (plansResult.error) throw plansResult.error;
  if (staffResult.error) throw staffResult.error;

  state.plans = safeArray(plansResult.data);

  if (elements.membershipPlansList) {
    elements.membershipPlansList.innerHTML = state.plans.length
      ? state.plans
          .map((plan) => `
            <div class="settings-list-item">
              <div>
                <strong>${esc(plan.name)}</strong>
                <small>
                  ${plan.is_daily ? 'Günlük giriş' : `${plan.duration_days} gün`}
                  · ${plan.is_active ? 'Aktiv' : 'Deaktiv'}
                </small>
              </div>
              <strong>${esc(money(plan.price))}</strong>
            </div>
          `)
          .join('')
      : '<div class="empty-state empty-state--compact"><p>Üzvlük planı yoxdur.</p></div>';
  }

  const staff = safeArray(staffResult.data);

  if (elements.staffList) {
    elements.staffList.innerHTML = staff.length
      ? staff
          .map((person) => `
            <div class="settings-list-item">
              <div>
                <strong>${esc(getProfileName(person))}</strong>
                <small>
                  ${esc(person.email || person.phone || 'Əlaqə yoxdur')}
                  · ${person.role === 'admin' ? 'Baş idarəçi' : 'İşçi'}
                </small>
              </div>
              <span class="badge ${person.is_active ? 'ok' : 'danger'}">
                ${person.is_active ? 'Aktiv' : 'Deaktiv'}
              </span>
            </div>
          `)
          .join('')
      : '<div class="empty-state empty-state--compact"><p>Admin və işçi hesabı tapılmadı.</p></div>';
  }

  if (elements.pwaSupportStatus) {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    elements.pwaSupportStatus.textContent = standalone
      ? 'Quraşdırılıb'
      : 'Quraşdırıla bilər';
    elements.pwaSupportStatus.className = 'status-success';
  }

  if (elements.realtimeStatus) {
    elements.realtimeStatus.textContent = sb ? 'Aktiv' : 'Bağlantı yoxdur';
    elements.realtimeStatus.className = sb ? 'status-success' : 'stat-value--danger';
  }
}


// ============================================================
// BORCLAR
// ============================================================

async function loadDebts() {
  const monthStart =
    startOfMonthISO(
      new Date(),
    );

  const [
    debtsResult,
    paymentsResult,
  ] = await Promise.all([
    sb
      .from('debt_accounts')
      .select(`
        member_id,
        balance,
        updated_at,

        member_profile:profiles!debt_accounts_member_id_fkey (
          id,
          full_name,
          email,
          phone,
          avatar_url,
          is_active
        )
      `)
      .gt('balance', 0),

    sb
      .from('debt_transactions')
      .select(`
        amount,
        created_at
      `)
      .eq(
        'transaction_type',
        'payment',
      )
      .gte(
        'created_at',
        `${monthStart}T00:00:00`,
      ),
  ]);

  if (debtsResult.error) {
    throw debtsResult.error;
  }

  if (paymentsResult.error) {
    throw paymentsResult.error;
  }

  state.debts =
    safeArray(
      debtsResult.data,
    );

  const totalDebt =
    state.debts.reduce(
      (sum, debt) =>
        sum +
        safeNumber(
          debt.balance,
        ),
      0,
    );

  const monthlyPayments =
    safeArray(
      paymentsResult.data,
    ).reduce(
      (sum, payment) =>
        sum +
        safeNumber(
          payment.amount,
        ),
      0,
    );

  if (elements.totalDebtAmount) {
    elements.totalDebtAmount.textContent =
      money(totalDebt);
  }

  if (elements.totalDebtorCount) {
    elements.totalDebtorCount.textContent =
      String(
        state.debts.length,
      );
  }

  if (elements.monthlyDebtPayment) {
    elements.monthlyDebtPayment.textContent =
      money(monthlyPayments);
  }

  renderDebtsTable();
}

function getFilteredDebts() {
  const search =
    String(
      elements.debtSearch
        ?.value ??
      '',
    )
      .trim()
      .toLocaleLowerCase(
        'az-AZ',
      );

  let debts =
    [...state.debts];

  if (search) {
    debts =
      debts.filter((debt) => {
        const profile =
          debt.member_profile ??
          {};

        const text = [
          profile.full_name,
          profile.phone,
          profile.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase(
            'az-AZ',
          );

        return text.includes(
          search,
        );
      });
  }

  const sort =
    elements.debtSort
      ?.value ??
    'highest';

  debts.sort((a, b) => {
    if (sort === 'lowest') {
      return (
        safeNumber(a.balance) -
        safeNumber(b.balance)
      );
    }

    if (sort === 'recent') {
      return (
        new Date(
          b.updated_at,
        ).getTime() -
        new Date(
          a.updated_at,
        ).getTime()
      );
    }

    return (
      safeNumber(b.balance) -
      safeNumber(a.balance)
    );
  });

  return debts;
}

function renderDebtsTable() {
  if (!elements.debtsTable) {
    return;
  }

  const debts =
    getFilteredDebts();

  if (!debts.length) {
    elements.debtsTable.innerHTML =
      renderTableEmpty(
        6,
        'Hazırda borclu üzv yoxdur.',
      );

    return;
  }

  elements.debtsTable.innerHTML =
    debts
      .map((debt) => {
        const profile =
          debt.member_profile ??
          {};

        return `
          <tr>
            <td>
              <div class="table-person">
                <img
                  src="${esc(
                    safeImageUrl(
                      profile.avatar_url,
                    ),
                  )}"
                  alt=""
                  data-image-fallback
                >

                <span>
                  <strong>
                    ${esc(
                      getProfileName(
                        profile,
                      ),
                    )}
                  </strong>
                </span>
              </div>
            </td>

            <td>
              ${esc(
                profile.phone ??
                '—',
              )}
            </td>

            <td>
              ${esc(
                profile.email ??
                '—',
              )}
            </td>

            <td>
              <strong class="stat-value--danger">
                ${esc(
                  money(
                    debt.balance,
                  ),
                )}
              </strong>
            </td>

            <td>
              ${esc(
                fmtDateTime(
                  debt.updated_at,
                ),
              )}
            </td>

            <td>
              <button
                class="btn btn-primary btn-small"
                type="button"
                data-pay-debt="${esc(
                  debt.member_id,
                )}"
              >
                Ödəniş qəbul et
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

  bindImageFallbacks(
    elements.debtsTable,
  );
}

function payDebt(memberId, providedBalance = null) {
  const debt =
    state.debts.find(
      (item) =>
        String(item.member_id) ===
        String(memberId),
    );

  const balance =
    providedBalance !== null
      ? safeNumber(providedBalance)
      : safeNumber(debt?.balance);

  const memberName =
    getProfileName(
      debt?.member_profile,
    );

  const content = `
    <form
      id="debtPaymentForm"
      class="form-grid"
    >
      <input
        type="hidden"
        name="member_id"
        value="${esc(memberId)}"
      >

      <div class="debt-total-box">
        <div>
          <span class="muted">
            ${esc(memberName)}
          </span>

          <strong>
            ${esc(money(balance))}
          </strong>
        </div>

        <span class="badge danger">
          Cari borc
        </span>
      </div>

      <label class="field">
        <span>Ödəniş məbləği *</span>

        <input
          class="input"
          type="number"
          name="amount"
          min="0.01"
          max="${balance}"
          step="0.01"
          value="${balance}"
          required
        >
      </label>

      <label class="field">
        <span>Ödəniş üsulu</span>

        <select
          class="input"
          name="method"
        >
          <option value="cash">
            Nağd
          </option>

          <option value="card">
            Kart
          </option>

          <option value="transfer">
            Köçürmə
          </option>
        </select>
      </label>

      <div
        id="debtPaymentMessage"
        class="form-message"
        hidden
      ></div>

      <button
        class="btn btn-primary"
        type="submit"
      >
        <span class="button-label">
          Ödənişi qəbul et
        </span>

        <span
          class="button-loader"
          hidden
        ></span>
      </button>
    </form>
  `;

  modal(content, {
    kicker: 'Borc',
    title: 'Borc ödənişi',
  });

  byId('debtPaymentForm')
    ?.addEventListener(
      'submit',
      handleDebtPaymentSubmit,
      {
        once: true,
      },
    );
}

async function handleDebtPaymentSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const button =
    $('button[type="submit"]', form);

  const amount =
    safeNumber(
      formData.get('amount'),
    );

  if (amount <= 0) {
    setFormMessage(
      '#debtPaymentMessage',
      'Ödəniş məbləği sıfırdan böyük olmalıdır.',
      'error',
    );

    return;
  }

  setBusy(
    button,
    true,
    'Ödəniş qeydə alınır...',
  );

  try {
    const {
      error,
    } = await sb.rpc(
      'pay_debt',
      {
        p_member_id:
          formData.get('member_id'),

        p_amount: amount,

        p_method:
          formData.get('method'),
      },
    );

    if (error) {
      throw error;
    }

    toast(
      'Borc ödənişi qeydə alındı.',
      'success',
    );

    closeCurrentModal();

    await Promise.all([
      loadDebts(),
      loadDashboard(),
    ]);
  } catch (error) {
    reportError(
      error,
      'payDebt',
    );

    setFormMessage(
      '#debtPaymentMessage',
      getErrorMessage(error),
      'error',
    );
  } finally {
    setBusy(button, false);
  }
}

// ============================================================
// MƏHSULLAR
// ============================================================

async function loadProducts() {
  await fetchProducts({
    includeInactive: true,
  });

  renderProductsTable();
}

function getFilteredAdminProducts() {
  const search =
    String(
      elements.productAdminSearch
        ?.value ??
      '',
    )
      .trim()
      .toLocaleLowerCase('az-AZ');

  if (!search) {
    return state.products;
  }

  return state.products.filter((product) => {
    const text = [
      product.name,
      product.category,
      product.sku,
      product.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('az-AZ');

    return text.includes(search);
  });
}

function renderProductsTable() {
  if (!elements.productsTable) return;

  const products =
    getFilteredAdminProducts();

  if (!products.length) {
    elements.productsTable.innerHTML =
      renderTableEmpty(
        7,
        'Məhsul tapılmadı.',
      );

    return;
  }

  elements.productsTable.innerHTML =
    products
      .map((product) => {
        const stock =
          getStockState(product);

        return `
          <tr>
            <td>
              <div class="table-product">
                <img
                  src="${esc(
                    safeImageUrl(
                      product.image_url,
                    ),
                  )}"
                  alt=""
                  data-image-fallback
                >

                <span>
                  <strong>
                    ${esc(product.name)}
                  </strong>

                  <small>
                    ${esc(
                      product.category ||
                      product.sku ||
                      '',
                    )}
                  </small>
                </span>
              </div>
            </td>

            <td>
              ${esc(
                getProductSaleModeLabel(
                  product,
                ),
              )}
            </td>

            <td>
              <strong>
                ${esc(
                  number(
                    product.stock_quantity,
                    3,
                  ),
                )}
              </strong>

              ${esc(product.stock_unit)}
            </td>

            <td>
              ${
                product.sale_mode ===
                'portion'
                  ? `${esc(
                      number(
                        product.portion_size,
                        3,
                      ),
                    )} ${esc(
                      product.stock_unit,
                    )}`
                  : '—'
              }
            </td>

            <td>
              ${esc(
                getSalePriceLabel(
                  product,
                ),
              )}
            </td>

            <td>
              <span class="${stock.className}">
                ${esc(stock.label)}
              </span>

              ${
                product.is_active
                  ? ''
                  : `
                    <span class="badge danger">
                      Deaktiv
                    </span>
                  `
              }
            </td>

            <td>
              <div class="table-actions">
                <button
                  class="btn btn-small"
                  type="button"
                  data-edit-product="${esc(product.id)}"
                >
                  Düzəlt
                </button>

                <button
                  class="btn btn-outline btn-small"
                  type="button"
                  data-add-stock-product="${esc(product.id)}"
                >
                  Stok
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

  bindImageFallbacks(
    elements.productsTable,
  );
}

function editProduct(productId = '') {
  const product =
    state.products.find(
      (item) =>
        String(item.id) ===
        String(productId),
    ) ?? {};

  const editing =
    Boolean(product.id);

  const content = `
    <form
      id="productForm"
      class="form-grid"
    >
      <input
        type="hidden"
        name="id"
        value="${esc(product.id ?? '')}"
      >

      <label class="field">
        <span>Məhsul adı *</span>

        <input
          class="input"
          name="name"
          value="${esc(product.name ?? '')}"
          placeholder="Məhsul adı"
          required
        >
      </label>

      <div class="grid grid-2">
        <label class="field">
          <span>SKU / kod</span>

          <input
            class="input"
            name="sku"
            value="${esc(product.sku ?? '')}"
            placeholder="Məsələn: PRO-001"
          >
        </label>

        <label class="field">
          <span>Kateqoriya</span>

          <input
            class="input"
            name="category"
            value="${esc(product.category ?? '')}"
            placeholder="Protein, Kreatin..."
          >
        </label>
      </div>

      <label class="field">
        <span>Açıqlama</span>

        <textarea
          class="input"
          name="description"
          placeholder="Məhsul haqqında məlumat"
        >${esc(product.description ?? '')}</textarea>
      </label>

      <div class="grid grid-2">
        <label class="field">
          <span>Satış üsulu</span>

          <select
            class="input"
            name="sale_mode"
            id="productSaleMode"
          >
            <option
              value="unit"
              ${
                product.sale_mode !== 'portion'
                  ? 'selected'
                  : ''
              }
            >
              Bağlı / ədəd ilə satış
            </option>

            <option
              value="portion"
              ${
                product.sale_mode === 'portion'
                  ? 'selected'
                  : ''
              }
            >
              Açıq / porsiya ilə satış
            </option>
          </select>
        </label>

        <label class="field">
          <span>Stok vahidi</span>

          <select
            class="input"
            name="stock_unit"
          >
            ${stockUnits
              .map((unit) => `
                <option
                  value="${esc(unit)}"
                  ${
                    product.stock_unit === unit
                      ? 'selected'
                      : ''
                  }
                >
                  ${esc(unit)}
                </option>
              `)
              .join('')}
          </select>
        </label>
      </div>

      <div class="grid grid-2">
        <label class="field">
          <span>Hazırkı stok</span>

          <input
            class="input"
            type="number"
            name="stock_quantity"
            min="0"
            step="0.001"
            value="${safeNumber(
              product.stock_quantity,
            )}"
          >
        </label>

        <label class="field">
          <span>Az stok həddi</span>

          <input
            class="input"
            type="number"
            name="low_stock_threshold"
            min="0"
            step="0.001"
            value="${safeNumber(
              product.low_stock_threshold,
            )}"
          >
        </label>
      </div>

      <div class="grid grid-2">
        <label class="field">
          <span>Bağlı satış qiyməti</span>

          <input
            class="input"
            type="number"
            name="retail_price"
            min="0"
            step="0.01"
            value="${safeNumber(
              product.retail_price,
            )}"
          >
        </label>

        <label class="field">
          <span>Maya dəyəri</span>

          <input
            class="input"
            type="number"
            name="cost_price"
            min="0"
            step="0.01"
            value="${safeNumber(
              product.cost_price,
            )}"
          >
        </label>
      </div>

      <div
        id="portionFields"
        class="grid grid-2"
      >
        <label class="field">
          <span>1 porsiyanın miqdarı</span>

          <input
            class="input"
            type="number"
            name="portion_size"
            min="0.001"
            step="0.001"
            value="${Math.max(
              0.001,
              safeNumber(
                product.portion_size ||
                1,
              ),
            )}"
          >

          <small class="field-hint">
            Məsələn: 5 qram, 10 qram və ya 6 tablet.
          </small>
        </label>

        <label class="field">
          <span>1 porsiyanın qiyməti</span>

          <input
            class="input"
            type="number"
            name="portion_price"
            min="0"
            step="0.01"
            value="${safeNumber(
              product.portion_price,
            )}"
          >
        </label>
      </div>

      <label class="field">
        <span>Məhsul şəkli</span>

        <div class="file-control">
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
          >

          <span class="file-control__button">
            Şəkil seç
          </span>

          <span class="file-control__name">
            ${
              product.image_url
                ? 'Hazırkı şəkil saxlanacaq'
                : 'Fayl seçilməyib'
            }
          </span>
        </div>
      </label>

      ${
        product.image_url
          ? `
            <img
              class="product-form-preview"
              src="${esc(product.image_url)}"
              alt=""
              data-image-fallback
            >
          `
          : ''
      }

      <div class="grid grid-2">
        <label class="checkbox-control">
          <input
            type="checkbox"
            name="show_public"
            ${
              product.show_public !== false
                ? 'checked'
                : ''
            }
          >

          <span class="checkbox-control__box"></span>

          <span>Saytda göstər</span>
        </label>

        <label class="checkbox-control">
          <input
            type="checkbox"
            name="is_active"
            ${
              product.is_active !== false
                ? 'checked'
                : ''
            }
          >

          <span class="checkbox-control__box"></span>

          <span>Aktiv məhsul</span>
        </label>
      </div>

      <div
        id="productFormMessage"
        class="form-message"
        hidden
      ></div>

      <button
        class="btn btn-primary"
        type="submit"
      >
        <span class="button-label">
          ${
            editing
              ? 'Dəyişiklikləri saxla'
              : 'Məhsulu əlavə et'
          }
        </span>

        <span
          class="button-loader"
          hidden
        ></span>
      </button>
    </form>
  `;

  modal(content, {
    kicker: 'Məhsullar',
    title:
      editing
        ? 'Məhsulu düzəlt'
        : 'Yeni məhsul',
  });

  const form =
    byId('productForm');

  form?.addEventListener(
    'submit',
    saveProduct,
    {
      once: true,
    },
  );

  const saleMode =
    byId('productSaleMode');

  saleMode?.addEventListener(
    'change',
    updateProductFormMode,
  );

  updateProductFormMode();

  bindImageFallbacks();
}

function updateProductFormMode() {
  const saleMode =
    byId('productSaleMode');

  const portionFields =
    byId('portionFields');

  if (!saleMode || !portionFields) {
    return;
  }

  const isPortion =
    saleMode.value === 'portion';

  portionFields.style.opacity =
    isPortion ? '1' : '0.55';

  $$('input', portionFields).forEach(
    (input) => {
      input.disabled = false;
    },
  );
}

async function saveProduct(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const button =
    $('button[type="submit"]', form);

  const id =
    String(
      formData.get('id') ?? '',
    ).trim();

  const existing =
    state.products.find(
      (item) =>
        String(item.id) ===
        String(id),
    );

  const name =
    String(
      formData.get('name') ?? '',
    ).trim();

  if (name.length < 2) {
    setFormMessage(
      '#productFormMessage',
      'Məhsul adı ən azı 2 simvol olmalıdır.',
      'error',
    );

    return;
  }

  const saleMode =
    formData.get('sale_mode');

  const portionSize =
    safeNumber(
      formData.get('portion_size'),
    );

  if (
    saleMode === 'portion' &&
    portionSize <= 0
  ) {
    setFormMessage(
      '#productFormMessage',
      'Porsiya miqdarı sıfırdan böyük olmalıdır.',
      'error',
    );

    return;
  }

  const imageFile =
    formData.get('image');

  let uploadedImage = null;

  setBusy(
    button,
    true,
    'Yadda saxlanılır...',
  );

  try {
    let imageUrl =
      existing?.image_url ??
      null;

    if (
      imageFile instanceof File &&
      imageFile.size > 0
    ) {
      uploadedImage =
        await uploadPublic(
          cfg.STORAGE?.productImagesBucket ??
          'product-images',
          imageFile,
          'products',
          {
            compress: true,
          },
        );

      imageUrl =
        uploadedImage.publicUrl;
    }

    const row = {
      name,

      description:
        String(
          formData.get('description') ??
          '',
        ).trim() || null,

      sku:
        String(
          formData.get('sku') ?? '',
        ).trim() || null,

      category:
        String(
          formData.get('category') ??
          '',
        ).trim() || null,

      sale_mode: saleMode,

      stock_unit:
        formData.get('stock_unit'),

      stock_quantity:
        Math.max(
          0,
          safeNumber(
            formData.get(
              'stock_quantity',
            ),
          ),
        ),

      low_stock_threshold:
        Math.max(
          0,
          safeNumber(
            formData.get(
              'low_stock_threshold',
            ),
          ),
        ),

      retail_price:
        Math.max(
          0,
          safeNumber(
            formData.get(
              'retail_price',
            ),
          ),
        ),

      cost_price:
        Math.max(
          0,
          safeNumber(
            formData.get(
              'cost_price',
            ),
          ),
        ),

      portion_size:
        saleMode === 'portion'
          ? portionSize
          : 1,

      portion_price:
        saleMode === 'portion'
          ? Math.max(
              0,
              safeNumber(
                formData.get(
                  'portion_price',
                ),
              ),
            )
          : 0,

      show_public:
        formData.get('show_public') ===
        'on',

      is_active:
        formData.get('is_active') ===
        'on',

      image_url: imageUrl,
    };

    let query;

    if (id) {
      query = sb
        .from('products')
        .update(row)
        .eq('id', id);
    } else {
      query = sb
        .from('products')
        .insert(row);
    }

    const {
      error,
    } = await query;

    if (error) {
      throw error;
    }

    toast(
      id
        ? 'Məhsul yeniləndi.'
        : 'Məhsul əlavə edildi.',
      'success',
    );

    closeCurrentModal();

    await Promise.all([
      loadProducts(),
      loadDashboard(),
    ]);
  } catch (error) {
    reportError(
      error,
      'saveProduct',
    );

    if (uploadedImage?.path) {
      try {
        await deleteStorageFile(
          cfg.STORAGE?.productImagesBucket ??
          'product-images',
          uploadedImage.path,
        );
      } catch {
        // Əsas xətanı dəyişmir.
      }
    }

    setFormMessage(
      '#productFormMessage',
      getErrorMessage(error),
      'error',
    );
  } finally {
    setBusy(button, false);
  }
}

async function addStock(selectedProductId = '') {
  if (!state.products.length) {
    await fetchProducts({
      includeInactive: false,
    });
  }

  const activeProducts =
    state.products.filter(
      (product) =>
        product.is_active !== false,
    );

  if (!activeProducts.length) {
    toast(
      'Stok əlavə etmək üçün aktiv məhsul yoxdur.',
      'error',
    );

    return;
  }

  const content = `
    <form
      id="stockForm"
      class="form-grid"
    >
      <label class="field">
        <span>Məhsul</span>

        <select
          class="input"
          name="product_id"
          required
        >
          ${activeProducts
            .map((product) => `
              <option
                value="${esc(product.id)}"
                ${
                  String(product.id) ===
                  String(selectedProductId)
                    ? 'selected'
                    : ''
                }
              >
                ${esc(product.name)}
                —
                ${esc(
                  number(
                    product.stock_quantity,
                    3,
                  ),
                )}
                ${esc(product.stock_unit)}
              </option>
            `)
            .join('')}
        </select>
      </label>

      <div class="grid grid-2">
        <label class="field">
          <span>Əlavə olunan miqdar *</span>

          <input
            class="input"
            type="number"
            name="quantity"
            min="0.001"
            step="0.001"
            placeholder="Miqdar"
            required
          >
        </label>

        <label class="field">
          <span>Ümumi alış məbləği</span>

          <input
            class="input"
            type="number"
            name="cost"
            min="0"
            step="0.01"
            value="0"
          >
        </label>
      </div>

      <label class="field">
        <span>Qeyd</span>

        <textarea
          class="input"
          name="note"
          placeholder="Təchizatçı, tarix və digər məlumatlar"
        ></textarea>
      </label>

      <div class="notice">
        Alış məbləği daxil edilərsə sistem avtomatik olaraq “Məhsul alışı” məxarici yaradacaq.
      </div>

      <div
        id="stockFormMessage"
        class="form-message"
        hidden
      ></div>

      <button
        class="btn btn-primary"
        type="submit"
      >
        <span class="button-label">
          Stoka əlavə et
        </span>

        <span
          class="button-loader"
          hidden
        ></span>
      </button>
    </form>
  `;

  modal(content, {
    kicker: 'Stok',
    title: 'Stok daxil et',
  });

  byId('stockForm')
    ?.addEventListener(
      'submit',
      handleStockSubmit,
      {
        once: true,
      },
    );
}

async function handleStockSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const button =
    $('button[type="submit"]', form);

  const quantity =
    safeNumber(
      formData.get('quantity'),
    );

  const cost =
    safeNumber(
      formData.get('cost'),
    );

  if (quantity <= 0) {
    setFormMessage(
      '#stockFormMessage',
      'Miqdar sıfırdan böyük olmalıdır.',
      'error',
    );

    return;
  }

  setBusy(
    button,
    true,
    'Stok artırılır...',
  );

  try {
    const {
      error,
    } = await sb.rpc(
      'add_stock',
      {
        p_product_id:
          formData.get('product_id'),

        p_quantity: quantity,

        p_total_cost:
          Math.max(0, cost),

        p_note:
          String(
            formData.get('note') ??
            '',
          ).trim() || null,
      },
    );

    if (error) {
      throw error;
    }

    toast(
      'Stok uğurla artırıldı.',
      'success',
    );

    closeCurrentModal();

    await Promise.all([
      loadProducts(),
      loadDashboard(),
    ]);
  } catch (error) {
    reportError(
      error,
      'addStock',
    );

    setFormMessage(
      '#stockFormMessage',
      getErrorMessage(error),
      'error',
    );
  } finally {
    setBusy(button, false);
  }
}

// ============================================================
// MƏDAXİL / MƏXARİC
// ============================================================

async function loadLedger() {
  const from =
    elements.ledgerFrom?.value ||
    getDefaultFromDate();

  const to =
    elements.ledgerTo?.value ||
    todayISO();

  if (elements.ledgerFrom) {
    elements.ledgerFrom.value =
      from;
  }

  if (elements.ledgerTo) {
    elements.ledgerTo.value =
      to;
  }

  const {
    data,
    error,
  } = await sb
    .from('ledger_entries')
    .select('*')
    .gte('entry_date', from)
    .lte('entry_date', to)
    .order('entry_date', {
      ascending: false,
    })
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  state.ledger = safeArray(data);

  renderLedgerTable();
}

function renderLedgerTable() {
  if (!elements.ledgerTable) return;

  if (!state.ledger.length) {
    elements.ledgerTable.innerHTML =
      renderTableEmpty(
        5,
        'Seçilmiş tarixlər üzrə qeyd yoxdur.',
      );

    return;
  }

  elements.ledgerTable.innerHTML =
    state.ledger
      .map((entry) => `
        <tr>
          <td>
            ${esc(
              fmtDate(entry.entry_date),
            )}
          </td>

          <td>
            <span class="${getLedgerTypeClass(
              entry.entry_type,
            )}">
              ${esc(
                getLedgerTypeLabel(
                  entry.entry_type,
                ),
              )}
            </span>
          </td>

          <td>
            ${esc(entry.category)}
          </td>

          <td>
            ${esc(
              entry.description ||
              '—',
            )}
          </td>

          <td>
            <strong class="${
              entry.entry_type === 'income'
                ? 'status-success'
                : 'stat-value--danger'
            }">
              ${
                entry.entry_type === 'income'
                  ? '+'
                  : '-'
              }${esc(money(entry.amount))}
            </strong>
          </td>
        </tr>
      `)
      .join('');
}

function openLedger() {
  const content = `
    <form
      id="ledgerForm"
      class="form-grid"
    >
      <label class="field">
        <span>Əməliyyat tipi</span>

        <select
          class="input"
          name="entry_type"
          id="ledgerEntryType"
        >
          <option value="income">
            Mədaxil
          </option>

          <option value="expense">
            Məxaric
          </option>
        </select>
      </label>

      <label class="field">
        <span>Kateqoriya</span>

        <select
          class="input"
          name="category"
          id="ledgerCategory"
          required
        ></select>
      </label>

      <label class="field">
        <span>Açıqlama</span>

        <textarea
          class="input"
          name="description"
          placeholder="Əlavə məlumat"
        ></textarea>
      </label>

      <div class="grid grid-2">
        <label class="field">
          <span>Məbləğ *</span>

          <input
            class="input"
            type="number"
            name="amount"
            min="0.01"
            step="0.01"
            required
          >
        </label>

        <label class="field">
          <span>Tarix</span>

          <input
            class="input"
            type="date"
            name="entry_date"
            value="${todayISO()}"
            required
          >
        </label>
      </div>

      <div
        id="ledgerFormMessage"
        class="form-message"
        hidden
      ></div>

      <button
        class="btn btn-primary"
        type="submit"
      >
        <span class="button-label">
          Qeydi əlavə et
        </span>

        <span
          class="button-loader"
          hidden
        ></span>
      </button>
    </form>
  `;

  modal(content, {
    kicker: 'Gündəlik dəftər',
    title: 'Yeni qeyd',
  });

  const typeSelect =
    byId('ledgerEntryType');

  typeSelect?.addEventListener(
    'change',
    renderLedgerCategories,
  );

  renderLedgerCategories();

  byId('ledgerForm')
    ?.addEventListener(
      'submit',
      handleLedgerSubmit,
      {
        once: true,
      },
    );
}

function renderLedgerCategories() {
  const type =
    byId('ledgerEntryType')
      ?.value ??
    'income';

  const select =
    byId('ledgerCategory');

  if (!select) return;

  const categories =
    type === 'income'
      ? incomeCategories
      : expenseCategories;

  select.innerHTML =
    categories
      .map((category) => `
        <option value="${esc(category)}">
          ${esc(category)}
        </option>
      `)
      .join('');
}

async function handleLedgerSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const button =
    $('button[type="submit"]', form);

  const amount =
    safeNumber(
      formData.get('amount'),
    );

  if (amount <= 0) {
    setFormMessage(
      '#ledgerFormMessage',
      'Məbləğ sıfırdan böyük olmalıdır.',
      'error',
    );

    return;
  }

  setBusy(
    button,
    true,
    'Qeyd əlavə olunur...',
  );

  try {
    const {
      error,
    } = await sb
      .from('ledger_entries')
      .insert({
        entry_type:
          formData.get('entry_type'),

        category:
          formData.get('category'),

        description:
          String(
            formData.get(
              'description',
            ) ?? '',
          ).trim() || null,

        amount,

        entry_date:
          formData.get('entry_date'),

        reference_type: 'manual',

        created_by:
          state.profile.id,
      });

    if (error) {
      throw error;
    }

    toast(
      'Dəftər qeydi əlavə edildi.',
      'success',
    );

    closeCurrentModal();

    await Promise.all([
      loadLedger(),
      loadDashboard(),
    ]);
  } catch (error) {
    reportError(
      error,
      'addLedgerEntry',
    );

    setFormMessage(
      '#ledgerFormMessage',
      getErrorMessage(error),
      'error',
    );
  } finally {
    setBusy(button, false);
  }
}

// ============================================================
// HESABATLAR
// ============================================================

async function loadReports() {
  const from = elements.reportFrom?.value || getDefaultFromDate();
  const to = elements.reportTo?.value || todayISO();

  if (elements.reportFrom) elements.reportFrom.value = from;
  if (elements.reportTo) elements.reportTo.value = to;

  const [ledgerResult, salesResult, itemsResult, membershipsResult] =
    await Promise.all([
      sb
        .from('ledger_entries')
        .select(`id,entry_date,entry_type,category,description,amount,created_at`)
        .gte('entry_date', from)
        .lte('entry_date', to)
        .order('entry_date', { ascending: true }),

      sb
        .from('sales')
        .select('id,total_amount,payment_status,created_at')
        .gte('created_at', `${from}T00:00:00`)
        .lte('created_at', `${to}T23:59:59.999`),

      sb
        .from('sale_items')
        .select(`
          product_id,
          product_name,
          quantity,
          line_total,
          sale:sales!sale_items_sale_id_fkey (
            id,
            created_at,
            payment_status
          )
        `),

      sb
        .from('memberships')
        .select(`
          id,
          price,
          payment_status,
          created_at,
          plan:membership_plans!memberships_plan_id_fkey (
            id,
            name,
            is_daily
          )
        `)
        .gte('created_at', `${from}T00:00:00`)
        .lte('created_at', `${to}T23:59:59.999`),
    ]);

  for (const result of [ledgerResult, salesResult, itemsResult, membershipsResult]) {
    if (result.error) throw result.error;
  }

  const entries = safeArray(ledgerResult.data);
  const sales = safeArray(salesResult.data);
  const saleItems = safeArray(itemsResult.data).filter((item) => {
    const createdAt = item.sale?.created_at;
    return createdAt && createdAt >= `${from}T00:00:00` && createdAt <= `${to}T23:59:59.999`;
  });
  const memberships = safeArray(membershipsResult.data);

  const grouped = new Map();
  entries.forEach((entry) => {
    if (!grouped.has(entry.entry_date)) {
      grouped.set(entry.entry_date, { income: 0, expense: 0 });
    }
    const day = grouped.get(entry.entry_date);
    if (entry.entry_type === 'income') day.income += safeNumber(entry.amount);
    else day.expense += safeNumber(entry.amount);
  });

  state.reportRows = [...grouped.entries()].map(([date, values]) => ({
    date,
    income: values.income,
    expense: values.expense,
    profit: values.income - values.expense,
  }));

  const totals = calculateLedgerTotals(entries);
  renderReportStats(totals, sales.length);
  drawReportChart(state.reportRows);
  renderTopSellingProducts(saleItems);
  renderExpenseCategorySummary(entries);
  renderMembershipIncomeSummary(memberships);
}

function renderReportStats(totals, salesCount = 0) {
  if (!elements.reportStats) return;

  const cards = [
    {
      label: 'Ümumi mədaxil',
      value: money(totals.income),
      className: 'stat-value--success',
    },

    {
      label: 'Ümumi məxaric',
      value: money(totals.expense),
      className: 'stat-value--danger',
    },

    {
      label: 'Təmiz qazanc',
      value: money(totals.profit),
      className:
        totals.profit >= 0
          ? 'stat-value--success'
          : 'stat-value--danger',
    },

    {
      label: 'Satış sayı',
      value: String(salesCount),
      className: '',
    },
  ];

  elements.reportStats.innerHTML =
    cards
      .map((card) => `
        <article class="card stat">
          <span class="stat-label">
            ${esc(card.label)}
          </span>

          <strong class="stat-value ${card.className}">
            ${esc(card.value)}
          </strong>
        </article>
      `)
      .join('');
}

function renderTopSellingProducts(items) {
  if (!elements.topSellingProducts) return;

  const totals = new Map();
  safeArray(items).forEach((item) => {
    const key = item.product_id || item.product_name;
    const current = totals.get(key) || {
      name: item.product_name || 'Məhsul',
      quantity: 0,
      amount: 0,
    };
    current.quantity += safeNumber(item.quantity);
    current.amount += safeNumber(item.line_total);
    totals.set(key, current);
  });

  const rows = [...totals.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  elements.topSellingProducts.innerHTML = rows.length
    ? rows
        .map((row) => `
          <div class="dashboard-list-item">
            <span><strong>${esc(row.name)}</strong><small>${number(row.quantity, 2)} satış vahidi</small></span>
            <strong class="status-success">${esc(money(row.amount))}</strong>
          </div>
        `)
        .join('')
    : '<div class="empty-state empty-state--compact"><p>Seçilmiş dövrdə məhsul satışı yoxdur.</p></div>';
}

function renderExpenseCategorySummary(entries) {
  if (!elements.expenseCategorySummary) return;

  const totals = new Map();
  safeArray(entries)
    .filter((entry) => entry.entry_type === 'expense')
    .forEach((entry) => {
      totals.set(entry.category, (totals.get(entry.category) || 0) + safeNumber(entry.amount));
    });

  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  elements.expenseCategorySummary.innerHTML = rows.length
    ? rows
        .map(([category, amount]) => `
          <div class="dashboard-list-item">
            <span><strong>${esc(category)}</strong></span>
            <strong class="stat-value--danger">${esc(money(amount))}</strong>
          </div>
        `)
        .join('')
    : '<div class="empty-state empty-state--compact"><p>Seçilmiş dövrdə xərc yoxdur.</p></div>';
}

function renderMembershipIncomeSummary(memberships) {
  if (!elements.membershipIncomeSummary) return;

  const totals = new Map();
  safeArray(memberships).forEach((membership) => {
    const name = membership.plan?.name || 'Üzvlük';
    const current = totals.get(name) || { count: 0, paid: 0, debt: 0 };
    current.count += 1;
    if (membership.payment_status === 'paid') current.paid += safeNumber(membership.price);
    if (membership.payment_status === 'debt') current.debt += safeNumber(membership.price);
    totals.set(name, current);
  });

  const rows = [...totals.entries()];
  elements.membershipIncomeSummary.innerHTML = rows.length
    ? rows
        .map(([name, values]) => `
          <div class="dashboard-list-item">
            <span><strong>${esc(name)}</strong><small>${values.count} qeyd · Borc ${money(values.debt)}</small></span>
            <strong class="status-success">${esc(money(values.paid))}</strong>
          </div>
        `)
        .join('')
    : '<div class="empty-state empty-state--compact"><p>Seçilmiş dövrdə üzvlük əməliyyatı yoxdur.</p></div>';
}

function drawReportChart(rows) {
  const canvas =
    elements.reportChart;

  if (!canvas) return;

  const context =
    canvas.getContext('2d');

  if (!context) return;

  const width =
    Math.max(
      320,
      canvas.clientWidth || 800,
    );

  const height = 280;

  const dpr =
    Math.max(
      1,
      window.devicePixelRatio || 1,
    );

  canvas.width =
    Math.floor(width * dpr);

  canvas.height =
    Math.floor(height * dpr);

  context.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0,
  );

  context.clearRect(
    0,
    0,
    width,
    height,
  );

  const styles =
    getComputedStyle(
      document.documentElement,
    );

  const muted =
    styles
      .getPropertyValue('--muted')
      .trim() ||
    '#94a3b8';

  const line =
    styles
      .getPropertyValue('--line')
      .trim() ||
    'rgba(148,163,184,.18)';

  const success =
    styles
      .getPropertyValue('--success')
      .trim() ||
    '#42e695';

  const danger =
    styles
      .getPropertyValue('--danger')
      .trim() ||
    '#ff3d64';

  if (!rows.length) {
    context.fillStyle = muted;
    context.font =
      '12px Inter, sans-serif';

    context.textAlign = 'center';

    context.fillText(
      'Seçilmiş tarix aralığında məlumat yoxdur.',
      width / 2,
      height / 2,
    );

    return;
  }

  const padding = {
    top: 24,
    right: 18,
    bottom: 42,
    left: 50,
  };

  const chartWidth =
    width -
    padding.left -
    padding.right;

  const chartHeight =
    height -
    padding.top -
    padding.bottom;

  const maximum =
    Math.max(
      1,
      ...rows.flatMap((row) => [
        row.income,
        row.expense,
      ]),
    );

  context.strokeStyle = line;
  context.lineWidth = 1;

  context.fillStyle = muted;
  context.font =
    '10px Inter, sans-serif';

  context.textAlign = 'right';

  for (let index = 0; index <= 4; index += 1) {
    const y =
      padding.top +
      (chartHeight / 4) * index;

    const value =
      maximum *
      (1 - index / 4);

    context.beginPath();

    context.moveTo(
      padding.left,
      y,
    );

    context.lineTo(
      width - padding.right,
      y,
    );

    context.stroke();

    context.fillText(
      number(value, 0),
      padding.left - 7,
      y + 3,
    );
  }

  const slotWidth =
    chartWidth /
    rows.length;

  const barWidth =
    Math.max(
      4,
      Math.min(
        22,
        slotWidth * 0.28,
      ),
    );

  rows.forEach((row, index) => {
    const centerX =
      padding.left +
      slotWidth * index +
      slotWidth / 2;

    const incomeHeight =
      (row.income / maximum) *
      chartHeight;

    const expenseHeight =
      (row.expense / maximum) *
      chartHeight;

    context.fillStyle = success;

    context.fillRect(
      centerX - barWidth - 2,
      padding.top +
        chartHeight -
        incomeHeight,
      barWidth,
      incomeHeight,
    );

    context.fillStyle = danger;

    context.fillRect(
      centerX + 2,
      padding.top +
        chartHeight -
        expenseHeight,
      barWidth,
      expenseHeight,
    );

    const showLabel =
      rows.length <= 15 ||
      index % Math.ceil(
        rows.length / 12,
      ) === 0;

    if (showLabel) {
      context.fillStyle = muted;
      context.textAlign = 'center';

      context.fillText(
        row.date.slice(5),
        centerX,
        height - 15,
      );
    }
  });
}

function exportReportsCSV() {
  if (!state.reportRows.length) {
    toast(
      'İxrac ediləcək hesabat yoxdur.',
      'info',
    );

    return;
  }

  downloadCSV(
    `sky-fit-hesabat-${todayISO()}.csv`,
    state.reportRows.map((row) => ({
      Tarix: row.date,
      Mədaxil: row.income,
      Məxaric: row.expense,
      Qazanc: row.profit,
    })),
  );
}

// ============================================================
// MƏŞQÇİLƏR
// ============================================================

async function loadTrainers() {
  if (!elements.trainersTable) {
    return;
  }

  const {
    data,
    error,
  } = await sb
    .from('trainers')
    .select('*')
    .order('sort_order', {
      ascending: true,
    })
    .order('full_name', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  state.trainers =
    safeArray(data);

  renderTrainersTable();
}

function renderTrainersTable() {
  if (!elements.trainersTable) return;

  if (!state.trainers.length) {
    elements.trainersTable.innerHTML =
      renderTableEmpty(
        5,
        'Məşqçi əlavə edilməyib.',
      );

    return;
  }

  elements.trainersTable.innerHTML =
    state.trainers
      .map((trainer) => `
        <tr>
          <td>
            <div class="table-person">
              <img
                src="${esc(
                  safeImageUrl(
                    trainer.image_url,
                  ),
                )}"
                alt=""
                data-image-fallback
              >

              <span>
                <strong>
                  ${esc(trainer.full_name)}
                </strong>

                <small>
                  ${esc(
                    trainer.specialty ||
                    'Fitnes məşqçisi',
                  )}
                </small>
              </span>
            </div>
          </td>

          <td>
            ${esc(trainer.phone || '—')}
          </td>

          <td>
            ${trainer.sort_order ?? 0}
          </td>

          <td>
            ${
              trainer.is_active
                ? `
                  <span class="badge ok">
                    Aktiv
                  </span>
                `
                : `
                  <span class="badge danger">
                    Deaktiv
                  </span>
                `
            }
          </td>

          <td>
            <button
              class="btn btn-small"
              type="button"
              data-edit-trainer="${esc(trainer.id)}"
            >
              Düzəlt
            </button>
          </td>
        </tr>
      `)
      .join('');

  bindImageFallbacks(
    elements.trainersTable,
  );
}

function editTrainer(trainerId = '') {
  const trainer =
    state.trainers.find(
      (item) =>
        String(item.id) ===
        String(trainerId),
    ) ?? {};

  const content = `
    <form
      id="trainerForm"
      class="form-grid"
    >
      <input
        type="hidden"
        name="id"
        value="${esc(trainer.id ?? '')}"
      >

      <label class="field">
        <span>Ad və soyad *</span>

        <input
          class="input"
          name="full_name"
          value="${esc(trainer.full_name ?? '')}"
          required
        >
      </label>

      <label class="field">
        <span>İxtisas</span>

        <input
          class="input"
          name="specialty"
          value="${esc(trainer.specialty ?? '')}"
          placeholder="Fitness, bodybuilding..."
        >
      </label>

      <label class="field">
        <span>Bio</span>

        <textarea
          class="input"
          name="bio"
        >${esc(trainer.bio ?? '')}</textarea>
      </label>

      <div class="grid grid-2">
        <label class="field">
          <span>Telefon</span>

          <input
            class="input"
            name="phone"
            value="${esc(trainer.phone ?? '')}"
          >
        </label>

        <label class="field">
          <span>Sıralama</span>

          <input
            class="input"
            name="sort_order"
            type="number"
            step="1"
            value="${safeNumber(trainer.sort_order)}"
          >
        </label>
      </div>

      <label class="field">
        <span>Instagram URL</span>

        <input
          class="input"
          name="instagram_url"
          type="url"
          value="${esc(trainer.instagram_url ?? '')}"
        >
      </label>

      <label class="field">
        <span>Şəkil</span>

        <input
          class="input"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
        >
      </label>

      <label class="checkbox-control">
        <input
          type="checkbox"
          name="is_active"
          ${
            trainer.is_active !== false
              ? 'checked'
              : ''
          }
        >

        <span class="checkbox-control__box"></span>

        <span>Saytda göstər</span>
      </label>

      <div
        id="trainerFormMessage"
        class="form-message"
        hidden
      ></div>

      <button
        class="btn btn-primary"
        type="submit"
      >
        <span class="button-label">
          Yadda saxla
        </span>

        <span
          class="button-loader"
          hidden
        ></span>
      </button>
    </form>
  `;

  modal(content, {
    kicker: 'Məşqçilər',
    title:
      trainer.id
        ? 'Məşqçini düzəlt'
        : 'Yeni məşqçi',
  });

  byId('trainerForm')
    ?.addEventListener(
      'submit',
      handleTrainerSubmit,
      {
        once: true,
      },
    );
}

async function handleTrainerSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const button =
    $('button[type="submit"]', form);

  const id =
    String(
      formData.get('id') ?? '',
    ).trim();

  const existing =
    state.trainers.find(
      (item) =>
        String(item.id) ===
        String(id),
    );

  const fullName =
    String(
      formData.get('full_name') ??
      '',
    ).trim();

  if (fullName.length < 3) {
    setFormMessage(
      '#trainerFormMessage',
      'Ad və soyad ən azı 3 simvol olmalıdır.',
      'error',
    );

    return;
  }

  let uploadedImage = null;

  setBusy(
    button,
    true,
    'Yadda saxlanılır...',
  );

  try {
    let imageUrl =
      existing?.image_url ??
      null;

    const imageFile =
      formData.get('image');

    if (
      imageFile instanceof File &&
      imageFile.size > 0
    ) {
      uploadedImage =
        await uploadPublic(
          cfg.STORAGE?.trainerImagesBucket ??
          'trainer-images',
          imageFile,
          'trainers',
          {
            compress: true,
          },
        );

      imageUrl =
        uploadedImage.publicUrl;
    }

    const row = {
      full_name: fullName,

      specialty:
        String(
          formData.get('specialty') ??
          '',
        ).trim() || null,

      bio:
        String(
          formData.get('bio') ??
          '',
        ).trim() || null,

      phone:
        String(
          formData.get('phone') ??
          '',
        ).trim() || null,

      instagram_url:
        String(
          formData.get(
            'instagram_url',
          ) ?? '',
        ).trim() || null,

      sort_order:
        Math.trunc(
          safeNumber(
            formData.get(
              'sort_order',
            ),
          ),
        ),

      image_url: imageUrl,

      is_active:
        formData.get('is_active') ===
        'on',
    };

    let query;

    if (id) {
      query = sb
        .from('trainers')
        .update(row)
        .eq('id', id);
    } else {
      query = sb
        .from('trainers')
        .insert(row);
    }

    const {
      error,
    } = await query;

    if (error) {
      throw error;
    }

    toast(
      'Məşqçi məlumatları yadda saxlandı.',
      'success',
    );

    closeCurrentModal();

    await loadTrainers();
  } catch (error) {
    reportError(
      error,
      'saveTrainer',
    );

    if (uploadedImage?.path) {
      try {
        await deleteStorageFile(
          cfg.STORAGE?.trainerImagesBucket ??
          'trainer-images',
          uploadedImage.path,
        );
      } catch {
        // Əsas xətaya mane olmur.
      }
    }

    setFormMessage(
      '#trainerFormMessage',
      getErrorMessage(error),
      'error',
    );
  } finally {
    setBusy(button, false);
  }
}

// ============================================================
// REALTIME
// ============================================================

function scheduleRealtimeReload() {
  clearTimeout(
    state.realtimeTimer,
  );

  state.realtimeTimer =
    setTimeout(async () => {
      try {
        switch (state.activePanel) {
          case 'dashboard':
            await loadDashboard();
            break;

          case 'pos':
            await loadPOS();
            break;

          case 'members':
            await loadMembers();
            break;

          case 'debts':
            await loadDebts();
            break;

          case 'products':
            await loadProducts();
            break;

          case 'ledger':
            await loadLedger();
            break;

          case 'reports':
            await loadReports();
            break;

          case 'trainers':
            await loadTrainers();
            break;

          default:
            break;
        }
      } catch (error) {
        reportError(
          error,
          'admin-realtime-reload',
        );
      }
    }, 280);
}

function initializeRealtime() {
  if (!sb) return;

  const tables = [
    'products',
    'memberships',
    'debt_accounts',
    'debt_transactions',
    'ledger_entries',
    'sales',
    'profiles',
    'trainers',
  ];

  state.realtimeChannels =
    tables
      .map((table) =>
        subscribeToTable({
          table,

          channelName:
            `skyfit-admin-${table}`,

          callback:
            scheduleRealtimeReload,
        }),
      )
      .filter(Boolean);
}

async function destroyRealtime() {
  clearTimeout(
    state.realtimeTimer,
  );

  await Promise.allSettled(
    state.realtimeChannels.map(
      removeRealtimeChannel,
    ),
  );

  state.realtimeChannels = [];
}

// ============================================================
function applyReportPreset() {
  const preset = elements.reportPeriodPreset?.value || 'custom';
  if (preset === 'custom') return;

  const today = new Date();
  let from = new Date(today);

  if (preset === 'week') from.setDate(today.getDate() - 6);
  if (preset === 'month') from = new Date(today.getFullYear(), today.getMonth(), 1);
  if (preset === 'year') from = new Date(today.getFullYear(), 0, 1);

  if (elements.reportFrom) elements.reportFrom.value = toISODate(from);
  if (elements.reportTo) elements.reportTo.value = toISODate(today);
  void loadReports();
}

// EVENT-LƏR
// ============================================================

function bindEvents() {
  bindPanelNavigation();

    elements.completeSaleButton
    ?.addEventListener(
      'click',
      () => {
        void completeSale();
      },
    );

  elements.posCreateMemberButton
    ?.addEventListener(
      'click',
      openNewMember,
    );

  elements.clearCartButton
    ?.addEventListener(
      'click',
      clearCart,
    );

  elements.debtSort
    ?.addEventListener(
      'change',
      renderDebtsTable,
    );

  elements.refreshDebtsButton
    ?.addEventListener(
      'click',
      () => {
        void loadDebts();
      },
    );

  elements.membersStatusFilter
    ?.addEventListener(
      'change',
      renderMembersTable,
    );

  elements.refreshMembersButton
    ?.addEventListener(
      'click',
      () => {
        void loadMembers();
      },
    );
  
  elements.posSearch
    ?.addEventListener(
      'input',
      debounce(
        renderPOSProducts,
      ),
    );

  elements.posMember
    ?.addEventListener(
      'change',
      () => {
        state.selectedPosMemberId =
          elements.posMember.value ||
          null;
      },
    );

  elements.cartDiscountInput
    ?.addEventListener(
      'input',
      renderCart,
    );

  elements.memberSearch
    ?.addEventListener(
      'input',
      debounce(
        renderMembersTable,
      ),
    );

  elements.debtSearch
    ?.addEventListener(
      'input',
      debounce(
        renderDebtsTable,
      ),
    );

  elements.productAdminSearch
    ?.addEventListener(
      'input',
      debounce(
        renderProductsTable,
      ),
    );

  window.addEventListener(
    'skyfit:theme-change',
    () => {
      if (
        state.activePanel ===
        'reports'
      ) {
        drawReportChart(
          state.reportRows,
        );
      }
    },
  );

  window.addEventListener(
    'resize',
    debounce(() => {
      if (
        state.activePanel ===
        'reports'
      ) {
        drawReportChart(
          state.reportRows,
        );
      }
    }, 250),
  );

    elements.adminRefreshButton
    ?.addEventListener(
      'click',
      () => {
        void showPanel(
          state.activePanel,
        );
      },
    );

  elements.openNewMemberButton
    ?.addEventListener(
      'click',
      openNewMember,
    );

  elements.openMembershipButton
    ?.addEventListener(
      'click',
      () => {
        void openMembership();
      },
    );

  elements.openProductButton
    ?.addEventListener(
      'click',
      () => {
        editProduct();
      },
    );

  elements.addStockButton
    ?.addEventListener(
      'click',
      () => {
        void addStock();
      },
    );

  elements.openLedgerButton
    ?.addEventListener(
      'click',
      openLedger,
    );

  elements.loadLedgerButton
    ?.addEventListener(
      'click',
      () => {
        void loadLedger();
      },
    );

  elements.loadStockMovementsButton
    ?.addEventListener(
      'click',
      () => {
        void loadStockMovements();
      },
    );

  elements.refreshMembershipsButton
    ?.addEventListener(
      'click',
      () => {
        void loadMemberships();
      },
    );

  elements.loadReportsButton
    ?.addEventListener(
      'click',
      () => {
        void loadReports();
      },
    );

  elements.printReportButton
    ?.addEventListener(
      'click',
      () => {
        window.print();
      },
    );

  elements.reportPeriodPreset
    ?.addEventListener(
      'change',
      applyReportPreset,
    );

  elements.trainerSearch
    ?.addEventListener(
      'input',
      debounce(renderTrainersTable),
    );

  elements.exportProductsButton
    ?.addEventListener('click', () => {
      downloadCSV('skyfit-products.csv', state.products);
    });

  elements.exportMembersButton
    ?.addEventListener('click', () => {
      downloadCSV('skyfit-members.csv', state.members);
    });

  elements.exportDebtsButton
    ?.addEventListener('click', () => {
      downloadCSV('skyfit-debts.csv', state.debts.map((debt) => ({
        member: getProfileName(debt.member_profile),
        email: debt.member_profile?.email || '',
        phone: debt.member_profile?.phone || '',
        balance: debt.balance,
        updated_at: debt.updated_at,
      })));
    });

  elements.openTrainerButton
    ?.addEventListener(
      'click',
      () => {
        editTrainer();
      },
    );

  elements.attendanceForm
    ?.addEventListener(
      'submit',
      handleAttendanceSubmit,
    );

  elements.attendanceMemberSearch
    ?.addEventListener(
      'input',
      debounce((event) => {
        renderAttendanceMemberResults(
          event.target.value,
        );
      }),
    );

  elements.clearAttendanceMember
    ?.addEventListener(
      'click',
      clearAttendanceMember,
    );

  elements.membershipSearch
    ?.addEventListener(
      'input',
      debounce(
        renderMembershipsTable,
      ),
    );

  elements.membershipStatusFilter
    ?.addEventListener(
      'change',
      renderMembershipsTable,
    );

  elements.membershipPlanFilter
    ?.addEventListener(
      'change',
      renderMembershipsTable,
    );

  elements.adminAccountButton
    ?.addEventListener(
      'click',
      () => {
        const open =
          elements.adminAccountMenu
            .hidden;

        elements.adminAccountMenu.hidden =
          !open;

        elements.adminAccountButton.setAttribute(
          'aria-expanded',
          String(open),
        );
      },
    );

  elements.adminNotificationsButton
    ?.addEventListener(
      'click',
      () => {
        const open =
          elements.notificationsPanel
            .hidden;

        elements.notificationsPanel.hidden =
          !open;

        elements.adminNotificationsButton.setAttribute(
          'aria-expanded',
          String(open),
        );
      },
    );

  elements.closeAdminNotifications
    ?.addEventListener(
      'click',
      () => {
        elements.notificationsPanel.hidden =
          true;

        elements.adminNotificationsButton
          ?.setAttribute(
            'aria-expanded',
            'false',
          );
      },
    );
  
    document.addEventListener(
    'click',
    async (event) => {
      const attendanceMemberButton =
        event.target.closest(
          '[data-select-attendance-member]',
        );

      if (attendanceMemberButton) {
        selectAttendanceMember(
          attendanceMemberButton.dataset
            .selectAttendanceMember,
        );

        return;
      }

      const openPanelButton =
        event.target.closest(
          '[data-open-panel]',
        );

      if (openPanelButton) {
        const panel =
          openPanelButton.dataset
            .openPanel;

        await showPanel(panel);

        if (panel === 'members') {
          openNewMember();
        }

        return;
      }

      const addCartButton =
        event.target.closest(
          '[data-add-cart]',
        );

      if (addCartButton) {
        addCart(
          addCartButton.dataset.addCart,
        );

        return;
      }

      const quantityButton =
        event.target.closest(
          '[data-cart-quantity]',
        );

      if (quantityButton) {
        changeCartQuantity(
          quantityButton.dataset
            .cartQuantity,
          quantityButton.dataset
            .change,
        );

        return;
      }

      const removeCartButton =
        event.target.closest(
          '[data-remove-cart]',
        );

      if (removeCartButton) {
        removeCartItem(
          removeCartButton.dataset
            .removeCart,
        );

        return;
      }

      const membershipButton =
        event.target.closest(
          '[data-open-member-membership]',
        );

      if (membershipButton) {
        await openMembership(
          membershipButton.dataset
            .openMemberMembership,
        );

        return;
      }

      const editMemberButton =
        event.target.closest(
          '[data-edit-member]',
        );

      if (editMemberButton) {
        openMemberEditor(
          editMemberButton.dataset
            .editMember,
        );

        return;
      }

      const debtButton =
        event.target.closest(
          '[data-pay-debt]',
        );

      if (debtButton) {
        if (!state.debts.length) {
          await loadDebts();
        }

        payDebt(
          debtButton.dataset.payDebt,
        );

        return;
      }

      const editProductButton =
        event.target.closest(
          '[data-edit-product]',
        );

      if (editProductButton) {
        if (!state.products.length) {
          await fetchProducts({
            includeInactive: true,
          });
        }

        editProduct(
          editProductButton.dataset
            .editProduct,
        );

        return;
      }

      const stockProductButton =
        event.target.closest(
          '[data-add-stock-product]',
        );

      if (stockProductButton) {
        await addStock(
          stockProductButton.dataset
            .addStockProduct,
        );

        return;
      }

      const editTrainerButton =
        event.target.closest(
          '[data-edit-trainer]',
        );

      if (editTrainerButton) {
        editTrainer(
          editTrainerButton.dataset
            .editTrainer,
        );

        return;
      }

      const logoutButton =
        event.target.closest(
          '#adminLogoutButton',
        );

      if (logoutButton) {
        const confirmed =
          await confirmAction({
            title: 'Hesabdan çıxış',
            message:
              'Admin hesabından çıxmaq istəyirsiniz?',
            confirmLabel: 'Çıxış et',
            danger: true,
          });

        if (confirmed) {
          await logout();
        }
      }
    },
  );
}

// ============================================================
// KÖHNƏ HTML ONCLICK UYĞUNLUĞU
// ============================================================

window.showPanel = showPanel;

window.addCart = addCart;

window.cartQty = (
  productId,
  change,
) =>
  changeCartQuantity(
    productId,
    change,
  );

window.removeCartItem =
  removeCartItem;

window.clearCart = clearCart;

window.completeSale =
  completeSale;

window.openMembership =
  openMembership;

window.openNewMember =
  openNewMember;

window.payDebt = payDebt;

window.editProduct =
  editProduct;

window.addStock = addStock;

window.openLedger =
  openLedger;

window.loadLedger =
  loadLedger;

window.loadReports =
  loadReports;

window.exportReportsCSV =
  exportReportsCSV;

window.editTrainer =
  editTrainer;

// ============================================================
// İNİT
// ============================================================

async function initializeAdmin() {
  layout();

  bindEvents();

  try {
    state.profile =
      await requireAuth('staff');

    if (!state.profile) {
      return;
    }

    renderAdminIdentity();

    const hashPanel =
      location.hash
        .replace('#', '')
        .trim();

    const firstPanel =
      panelTitles[hashPanel]
        ? hashPanel
        : 'dashboard';

    await showPanel(firstPanel);

    initializeRealtime();
  } catch (error) {
    reportError(
      error,
      'admin-initialize',
    );

    const message =
      getErrorMessage(error);

    toast(message, 'error');

    const main =
      $('.admin-main') ??
      $('.main');

    if (main) {
      main.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <h2>
              Admin paneli yüklənmədi
            </h2>

            <p>
              ${esc(message)}
            </p>

            <button
              class="btn btn-primary"
              type="button"
              onclick="location.reload()"
            >
              Yenidən yoxla
            </button>
          </div>
        </div>
      `;
    }
  } finally {
    hideLoader(true);
  }
}

if (
  document.readyState === 'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      void initializeAdmin();
    },
    {
      once: true,
    },
  );
} else {
  void initializeAdmin();
}

window.addEventListener(
  'pagehide',
  () => {
    void destroyRealtime();
  },
  {
    once: true,
  },
);
