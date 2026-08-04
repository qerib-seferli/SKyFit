// ============================================================
// SKy Fit Professional — Core Module
// Supabase, Auth session, Theme, PWA, Loader, Toast,
// Modal, Network, File upload və ümumi util funksiyaları
// ============================================================

const config = window.SKYFIT_CONFIG ?? {};

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const hasPlaceholder = (value) =>
  !isNonEmptyString(value) ||
  value.includes('YOUR_PROJECT') ||
  value.includes('YOUR_ANON') ||
  value.includes('YOUR_SUPABASE') ||
  value.includes('YOUR_GITHUB');

export const isConfigured =
  !hasPlaceholder(config.SUPABASE_URL) &&
  !hasPlaceholder(config.SUPABASE_ANON_KEY);

export const cfg = config;

export const sb =
  isConfigured &&
  window.supabase?.createClient
    ? window.supabase.createClient(
        config.SUPABASE_URL,
        config.SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
          },

          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },

          global: {
            headers: {
              'x-application-name': 'sky-fit-professional',
            },
          },
        },
      )
    : null;

// Digər klassik script-lər üçün də əlçatan saxlanılır.
window.sky = Object.freeze({
  cfg,
  sb,
  isConfigured,
});

// ============================================================
// DOM UTIL-LƏRİ
// ============================================================

export const $ = (selector, root = document) =>
  root?.querySelector?.(selector) ?? null;

export const $$ = (selector, root = document) =>
  root?.querySelectorAll
    ? Array.from(root.querySelectorAll(selector))
    : [];

export const byId = (id) =>
  document.getElementById(id);

export function setText(target, value = '') {
  const element =
    typeof target === 'string'
      ? $(target)
      : target;

  if (element) {
    element.textContent = String(value ?? '');
  }

  return element;
}

export function setHTML(target, html = '') {
  const element =
    typeof target === 'string'
      ? $(target)
      : target;

  if (element) {
    element.innerHTML = html;
  }

  return element;
}

export function show(target, display = '') {
  const element =
    typeof target === 'string'
      ? $(target)
      : target;

  if (!element) return null;

  element.hidden = false;

  if (display) {
    element.style.display = display;
  } else {
    element.style.removeProperty('display');
  }

  return element;
}

export function hide(target) {
  const element =
    typeof target === 'string'
      ? $(target)
      : target;

  if (!element) return null;

  element.hidden = true;

  return element;
}

export function toggleHidden(target, force) {
  const element =
    typeof target === 'string'
      ? $(target)
      : target;

  if (!element) return false;

  const shouldHide =
    typeof force === 'boolean'
      ? force
      : !element.hidden;

  element.hidden = shouldHide;

  return !shouldHide;
}

// ============================================================
// MƏTN VƏ FORMAT UTIL-LƏRİ
// ============================================================

export function esc(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character],
  );
}

export function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('az-AZ');
}

export function slugify(value) {
  return normalizeText(value)
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function uid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

export function money(value, currency = 'AZN') {
  const numericValue = Number(value ?? 0);

  const safeValue =
    Number.isFinite(numericValue)
      ? numericValue
      : 0;

  return `${new Intl.NumberFormat(
    config.APP?.locale ?? 'az-AZ',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(safeValue)} ${currency}`;
}

export function number(value, maximumFractionDigits = 3) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat(
    config.APP?.locale ?? 'az-AZ',
    {
      maximumFractionDigits,
    },
  ).format(
    Number.isFinite(numericValue)
      ? numericValue
      : 0,
  );
}

function parseDateValue(value) {
  if (!value) return null;

  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    const [year, month, day] =
      value.split('-').map(Number);

    return new Date(
      year,
      month - 1,
      day,
      12,
      0,
      0,
      0,
    );
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

export function fmtDate(value, fallback = '—') {
  const date = parseDateValue(value);

  if (!date) return fallback;

  return new Intl.DateTimeFormat(
    config.APP?.locale ?? 'az-AZ',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(date);
}

export function fmtDateLong(value, fallback = '—') {
  const date = parseDateValue(value);

  if (!date) return fallback;

  return new Intl.DateTimeFormat(
    config.APP?.locale ?? 'az-AZ',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(date);
}

export function fmtDateTime(value, fallback = '—') {
  const date = parseDateValue(value);

  if (!date) return fallback;

  return new Intl.DateTimeFormat(
    config.APP?.locale ?? 'az-AZ',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

export function fmtTime(value, fallback = '—') {
  const date = parseDateValue(value);

  if (!date) return fallback;

  return new Intl.DateTimeFormat(
    config.APP?.locale ?? 'az-AZ',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

export function toISODate(value = new Date()) {
  const date =
    value instanceof Date
      ? new Date(value)
      : parseDateValue(value);

  if (!date) return '';

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function startOfMonthISO(value = new Date()) {
  const date =
    value instanceof Date
      ? new Date(value)
      : parseDateValue(value);

  if (!date) return '';

  date.setDate(1);

  return toISODate(date);
}

export function endOfMonthISO(value = new Date()) {
  const date =
    value instanceof Date
      ? new Date(value)
      : parseDateValue(value);

  if (!date) return '';

  date.setMonth(
    date.getMonth() + 1,
    0,
  );

  return toISODate(date);
}

export function daysLeft(endDate) {
  const end = parseDateValue(endDate);

  if (!end) return null;

  const today = new Date();

  today.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);

  return Math.ceil(
    (end.getTime() - today.getTime()) /
      86_400_000,
  );
}

export function membershipState(endDate) {
  const remaining = daysLeft(endDate);

  if (remaining === null) {
    return {
      key: 'none',
      label: 'Abunə yoxdur',
      badge: 'badge',
      days: null,
    };
  }

  if (remaining < 0) {
    return {
      key: 'expired',
      label: 'Vaxtı bitib',
      badge: 'badge danger',
      days: remaining,
    };
  }

  if (remaining <= 3) {
    return {
      key: 'critical',
      label:
        remaining === 0
          ? 'Bu gün bitir'
          : `${remaining} gün qalıb`,
      badge: 'badge danger',
      days: remaining,
    };
  }

  if (remaining <= 7) {
    return {
      key: 'warning',
      label: `${remaining} gün qalıb`,
      badge: 'badge warn',
      days: remaining,
    };
  }

  return {
    key: 'active',
    label: `${remaining} gün qalıb`,
    badge: 'badge ok',
    days: remaining,
  };
}

export function statusBadge(endDate) {
  const state =
    membershipState(endDate);

  return `
    <span class="${state.badge}">
      ${esc(state.label)}
    </span>
  `;
}

export function paymentStatusLabel(status) {
  const map = {
    paid: 'Ödənilib',
    debt: 'Borc',
    cancelled: 'Ləğv edilib',
    refunded: 'Geri ödənilib',
  };

  return map[status] ?? status ?? '—';
}

export function paymentStatusBadge(status) {
  const map = {
    paid: {
      label: 'Ödənilib',
      className: 'badge ok',
    },

    debt: {
      label: 'Borc',
      className: 'badge danger',
    },

    cancelled: {
      label: 'Ləğv edilib',
      className: 'badge',
    },

    refunded: {
      label: 'Geri ödənilib',
      className: 'badge warn',
    },
  };

  const item =
    map[status] ?? {
      label: status || 'Naməlum',
      className: 'badge',
    };

  return `
    <span class="${item.className}">
      ${esc(item.label)}
    </span>
  `;
}

export function paymentMethodLabel(method) {
  const map = {
    cash: 'Nağd',
    card: 'Kart',
    transfer: 'Köçürmə',
  };

  return map[method] ?? method ?? '—';
}

// ============================================================
// XƏTA EMALI
// ============================================================

export function getErrorMessage(
  error,
  fallback = 'Əməliyyat zamanı xəta baş verdi.',
) {
  if (!error) return fallback;

  const message =
    typeof error === 'string'
      ? error
      : error.message ||
        error.error_description ||
        error.details ||
        fallback;

  const normalized =
    String(message).toLowerCase();

  if (
    normalized.includes(
      'invalid login credentials',
    )
  ) {
    return 'Email və ya şifrə yanlışdır.';
  }

  if (
    normalized.includes(
      'email not confirmed',
    )
  ) {
    return 'Email ünvanınızı təsdiqləyin.';
  }

  if (
    normalized.includes(
      'user already registered',
    )
  ) {
    return 'Bu email ilə hesab artıq mövcuddur.';
  }

  if (
    normalized.includes(
      'password should be at least',
    )
  ) {
    return 'Şifrə kifayət qədər uzun deyil.';
  }

  if (
    normalized.includes(
      'row-level security',
    )
  ) {
    return 'Bu əməliyyat üçün icazəniz yoxdur.';
  }

  if (
    normalized.includes(
      'jwt expired',
    )
  ) {
    return 'Sessiyanın vaxtı bitib. Yenidən daxil olun.';
  }

  if (
    normalized.includes(
      'failed to fetch',
    ) ||
    normalized.includes(
      'networkerror',
    )
  ) {
    return 'İnternet bağlantısını yoxlayın.';
  }

  return String(message);
}

export function reportError(
  error,
  context = '',
) {
  console.error(
    context
      ? `[SKy Fit: ${context}]`
      : '[SKy Fit]',
    error,
  );
}

// ============================================================
// TOAST
// ============================================================

export function toast(
  message,
  type = 'info',
  duration = 3800,
) {
  let wrapper =
    byId('toastContainer') ||
    $('.toast-wrap');

  if (!wrapper) {
    wrapper =
      document.createElement('div');

    wrapper.id = 'toastContainer';
    wrapper.className = 'toast-wrap';

    wrapper.setAttribute(
      'aria-live',
      'polite',
    );

    wrapper.setAttribute(
      'aria-atomic',
      'true',
    );

    document.body.append(wrapper);
  }

  const toastElement =
    document.createElement('div');

  toastElement.className =
    `toast ${type}`.trim();

  toastElement.setAttribute(
    'role',
    type === 'error'
      ? 'alert'
      : 'status',
  );

  const messageElement =
    document.createElement('span');

  messageElement.textContent =
    String(message ?? '');

  const closeButton =
    document.createElement('button');

  closeButton.type = 'button';

  closeButton.className =
    'toast__close';

  closeButton.setAttribute(
    'aria-label',
    'Bildirişi bağla',
  );

  closeButton.textContent = '×';

  toastElement.append(
    messageElement,
    closeButton,
  );

  wrapper.append(toastElement);

  let timeoutId = null;

  const removeToast = () => {
    clearTimeout(timeoutId);

    toastElement.style.opacity = '0';
    toastElement.style.transform =
      'translateY(8px)';

    window.setTimeout(
      () => toastElement.remove(),
      180,
    );
  };

  closeButton.addEventListener(
    'click',
    removeToast,
  );

  timeoutId = window.setTimeout(
    removeToast,
    duration,
  );

  return toastElement;
}

// ============================================================
// BUTTON LOADING
// ============================================================

export function setBusy(
  button,
  busy,
  busyLabel = 'Gözləyin...',
) {
  if (!button) return;

  const labelElement =
    $('.button-label', button);

  const loaderElement =
    $('.button-loader', button);

  if (busy) {
    if (
      !button.dataset.originalLabel
    ) {
      button.dataset.originalLabel =
        labelElement
          ? labelElement.textContent.trim()
          : button.textContent.trim();
    }

    button.disabled = true;
    button.setAttribute(
      'aria-busy',
      'true',
    );

    if (labelElement) {
      labelElement.textContent =
        busyLabel;
    } else {
      button.textContent =
        busyLabel;
    }

    if (loaderElement) {
      loaderElement.hidden = false;
    }

    return;
  }

  button.disabled = false;
  button.removeAttribute('aria-busy');

  const originalLabel =
    button.dataset.originalLabel;

  if (originalLabel) {
    if (labelElement) {
      labelElement.textContent =
        originalLabel;
    } else {
      button.textContent =
        originalLabel;
    }
  }

  if (loaderElement) {
    loaderElement.hidden = true;
  }
}

export function setFormMessage(
  target,
  message = '',
  type = 'info',
) {
  const element =
    typeof target === 'string'
      ? $(target)
      : target;

  if (!element) return;

  if (!message) {
    element.textContent = '';
    element.className =
      'form-message';

    element.hidden = true;

    return;
  }

  element.textContent = message;

  element.className =
    `form-message ${type}`.trim();

  element.hidden = false;
}

// ============================================================
// LOADER
// ============================================================

let loaderLockCount = 0;

export function showLoader(
  message = '',
) {
  const loader =
    byId('appLoader');

  if (!loader) return;

  loaderLockCount += 1;

  const textElement =
    $('.app-loader__text', loader);

  if (
    textElement &&
    message
  ) {
    textElement.textContent =
      message;
  }

  loader.classList.remove(
    'is-hidden',
  );

  loader.hidden = false;
}

export function hideLoader(
  force = false,
) {
  const loader =
    byId('appLoader');

  if (!loader) return;

  if (force) {
    loaderLockCount = 0;
  } else {
    loaderLockCount =
      Math.max(0, loaderLockCount - 1);
  }

  if (loaderLockCount > 0) {
    return;
  }

  loader.classList.add(
    'is-hidden',
  );

  window.setTimeout(() => {
    if (
      loader.classList.contains(
        'is-hidden',
      )
    ) {
      loader.hidden = true;
    }
  }, 320);
}

// ============================================================
// THEME
// ============================================================

const THEME_KEY =
  'skyfit_theme';

export function getPreferredTheme() {
  const savedTheme =
    localStorage.getItem(THEME_KEY);

  if (
    savedTheme === 'dark' ||
    savedTheme === 'light'
  ) {
    return savedTheme;
  }

  if (
    config.APP?.defaultTheme ===
      'light' ||
    config.APP?.defaultTheme ===
      'dark'
  ) {
    return config.APP.defaultTheme;
  }

  return window.matchMedia?.(
    '(prefers-color-scheme: light)',
  ).matches
    ? 'light'
    : 'dark';
}

export function applyTheme(theme) {
  const nextTheme =
    theme === 'light'
      ? 'light'
      : 'dark';

  document.documentElement.dataset.theme =
    nextTheme;

  localStorage.setItem(
    THEME_KEY,
    nextTheme,
  );

  const themeColorMeta =
    $('meta[name="theme-color"]');

  if (themeColorMeta) {
    themeColorMeta.content =
      nextTheme === 'light'
        ? '#eef2f7'
        : '#05070b';
  }

  $$('#themeToggle, #themeBtn').forEach(
    (button) => {
      button.setAttribute(
        'aria-label',
        nextTheme === 'dark'
          ? 'Ağ rejimə keç'
          : 'Qara rejimə keç',
      );

      button.setAttribute(
        'title',
        nextTheme === 'dark'
          ? 'Ağ rejim'
          : 'Qara rejim',
      );

      const icon =
        $('.theme-icon', button);

      if (icon) {
        icon.textContent =
          nextTheme === 'dark'
            ? '☀'
            : '☾';
      } else {
        button.textContent =
          nextTheme === 'dark'
            ? '☀'
            : '☾';
      }
    },
  );

  window.dispatchEvent(
    new CustomEvent(
      'skyfit:theme-change',
      {
        detail: {
          theme: nextTheme,
        },
      },
    ),
  );

  return nextTheme;
}

export function initTheme() {
  return applyTheme(
    getPreferredTheme(),
  );
}

export function toggleTheme() {
  const current =
    document.documentElement
      .dataset.theme;

  return applyTheme(
    current === 'light'
      ? 'dark'
      : 'light',
  );
}

function bindThemeButtons() {
  $$('#themeToggle, #themeBtn').forEach(
    (button) => {
      if (
        button.dataset.themeBound ===
        'true'
      ) {
        return;
      }

      button.dataset.themeBound =
        'true';

      button.addEventListener(
        'click',
        toggleTheme,
      );
    },
  );
}

// ============================================================
// NETWORK
// ============================================================

export function updateNetworkStatus() {
  const element =
    byId('networkStatus');

  const online =
    navigator.onLine;

  document.body.classList.toggle(
    'is-offline',
    !online,
  );

  if (element) {
    element.hidden = online;

    element.textContent = online
      ? 'İnternet bağlantısı bərpa olundu'
      : 'İnternet bağlantısı yoxdur';
  }

  if (online) {
    window.dispatchEvent(
      new CustomEvent(
        'skyfit:online',
      ),
    );
  } else {
    window.dispatchEvent(
      new CustomEvent(
        'skyfit:offline',
      ),
    );
  }

  return online;
}

function bindNetworkEvents() {
  window.addEventListener(
    'online',
    () => {
      updateNetworkStatus();

      toast(
        'İnternet bağlantısı bərpa olundu.',
        'success',
        2600,
      );
    },
  );

  window.addEventListener(
    'offline',
    () => {
      updateNetworkStatus();

      toast(
        'İnternet bağlantısı kəsildi.',
        'error',
        5000,
      );
    },
  );
}

// ============================================================
// SUPABASE SESSİYA VƏ PROFİL
// ============================================================

let profileCache = null;
let profileCacheUserId = null;

export async function getSession() {
  if (!sb) return null;

  const {
    data,
    error,
  } = await sb.auth.getSession();

  if (error) {
    reportError(
      error,
      'getSession',
    );

    return null;
  }

  return data.session ?? null;
}

export async function getUser() {
  if (!sb) return null;

  const {
    data,
    error,
  } = await sb.auth.getUser();

  if (error) {
    reportError(
      error,
      'getUser',
    );

    return null;
  }

  return data.user ?? null;
}

export async function getProfile({
  force = false,
} = {}) {
  const session =
    await getSession();

  if (!session?.user) {
    profileCache = null;
    profileCacheUserId = null;

    return null;
  }

  if (
    !force &&
    profileCache &&
    profileCacheUserId ===
      session.user.id
  ) {
    return profileCache;
  }

  const {
    data,
    error,
  } = await sb
    .from('profiles')
    .select('*')
    .eq(
      'auth_user_id',
      session.user.id,
    )
    .maybeSingle();

  if (error) {
    reportError(
      error,
      'getProfile',
    );

    return null;
  }

  profileCache = data ?? null;
  profileCacheUserId =
    session.user.id;

  return profileCache;
}

export function clearProfileCache() {
  profileCache = null;
  profileCacheUserId = null;
}

export function hasStaffRole(profile) {
  return (
    profile?.role === 'admin' ||
    profile?.role === 'staff'
  );
}

export function hasAdminRole(profile) {
  return profile?.role === 'admin';
}

export function buildRelativeUrl(
  path = 'index.html',
) {
  const normalizedPath =
    String(path)
      .replace(/^\/+/, '');

  const base =
    String(
      config.SITE_URL ??
        location.origin,
    ).replace(/\/+$/, '');

  return `${base}/${normalizedPath}`;
}

export function getCurrentPage() {
  const name =
    location.pathname
      .split('/')
      .filter(Boolean)
      .pop();

  return name || 'index.html';
}

export function getSafeNextPage(
  fallback = 'profile.html',
) {
  const params =
    new URLSearchParams(
      location.search,
    );

  const next =
    params.get('next');

  if (!next) return fallback;

  const cleaned =
    next
      .replace(/^\/+/, '')
      .split('?')[0]
      .split('#')[0];

  const allowedPages = new Set([
    'index.html',
    'profile.html',
    'admin.html',
    'sevimliler.html',
    'setup.html',
  ]);

  return allowedPages.has(cleaned)
    ? cleaned
    : fallback;
}

export function redirectTo(
  path,
  replace = false,
) {
  if (replace) {
    location.replace(path);
  } else {
    location.href = path;
  }
}

export async function requireAuth(
  requiredRole = null,
) {
if (!isConfigured) {
  console.error(
    'SKy Fit: Supabase konfiqurasiyası oxunmadı.',
  );

  toast(
    'Sistem bağlantısı qurulmadı. Səhifəni yeniləyin.',
    'error',
    6000,
  );

  return null;
}

  const session =
    await getSession();

  if (!session) {
    const currentPage =
      getCurrentPage();

    redirectTo(
      `login.html?next=${encodeURIComponent(
        currentPage,
      )}`,
      true,
    );

    return null;
  }

  const profile =
    await getProfile({
      force: true,
    });

  if (!profile) {
    toast(
      'Profil məlumatı tapılmadı.',
      'error',
    );

    return null;
  }

  if (!profile.is_active) {
    await sb.auth.signOut();

    toast(
      'Hesabınız deaktiv edilib.',
      'error',
    );

    redirectTo(
      'login.html',
      true,
    );

    return null;
  }

  if (
    requiredRole === 'admin' &&
    !hasAdminRole(profile)
  ) {
    redirectTo(
      'profile.html',
      true,
    );

    return null;
  }

  if (
    requiredRole === 'staff' &&
    !hasStaffRole(profile)
  ) {
    redirectTo(
      'profile.html',
      true,
    );

    return null;
  }

  if (
    requiredRole === 'member' &&
    profile.role !== 'member'
  ) {
    // Admin və staff profil səhifəsini görə bilər.
    return profile;
  }

  return profile;
}

export async function logout({
  redirect = true,
} = {}) {
  if (!sb) {
    if (redirect) {
      redirectTo(
        'login.html',
        true,
      );
    }

    return;
  }

  const {
    error,
  } = await sb.auth.signOut();

  if (error) {
    throw error;
  }

  clearProfileCache();

  window.dispatchEvent(
    new CustomEvent(
      'skyfit:logout',
    ),
  );

  if (redirect) {
    redirectTo(
      'login.html',
      true,
    );
  }
}

// ============================================================
// NAVBAR / FOOTER SESSİYA GÖRÜNÜŞÜ
// ============================================================

export async function updateSessionUI() {
  const session =
    await getSession();

  const profile =
    session
      ? await getProfile()
      : null;

  const profileLinks = $$(
    '#headerProfileLink',
  );

  profileLinks.forEach((link) => {
    if (!session) {
      link.href = 'login.html';
      link.textContent = 'Daxil ol';

      return;
    }

    if (hasStaffRole(profile)) {
      link.href = 'admin.html';
      link.textContent =
        profile?.full_name
          ? profile.full_name
              .split(' ')[0]
          : 'Admin';

      return;
    }

    link.href = 'profile.html';
    link.textContent =
      profile?.full_name
        ? profile.full_name
            .split(' ')[0]
        : 'Profil';
  });

  $$(
    '[data-admin-link]',
  ).forEach((element) => {
    element.hidden =
      !hasStaffRole(profile);
  });

  window.dispatchEvent(
    new CustomEvent(
      'skyfit:session-ui',
      {
        detail: {
          session,
          profile,
        },
      },
    ),
  );

  return {
    session,
    profile,
  };
}

export function layout() {
  // Yeni HTML-lər artıq tam navbar/footer saxlayır.
  // Bu funksiya geriyə uyğunluq üçün yalnız mövcud
  // elementləri aktivləşdirir, HTML-i silmir.
  bindThemeButtons();
  bindMobileMenu();
  setCurrentYear();
  void updateSessionUI();
}

// ============================================================
// MOBİL MENYU
// ============================================================

function bindMobileMenu() {
  const button =
    byId('mobileMenuButton');

  const navigation =
    byId('mobileNavigation');

  if (
    !button ||
    !navigation ||
    button.dataset.menuBound === 'true'
  ) {
    return;
  }

  button.dataset.menuBound =
    'true';

  const close = () => {
    navigation.hidden = true;

    button.setAttribute(
      'aria-expanded',
      'false',
    );
  };

  const open = () => {
    navigation.hidden = false;

    button.setAttribute(
      'aria-expanded',
      'true',
    );
  };

  button.addEventListener(
    'click',
    (event) => {
      event.stopPropagation();

      if (navigation.hidden) {
        open();
      } else {
        close();
      }
    },
  );

  navigation.addEventListener(
    'click',
    (event) => {
      if (
        event.target.closest('a')
      ) {
        close();
      }
    },
  );

  document.addEventListener(
    'click',
    (event) => {
      if (
        navigation.hidden ||
        navigation.contains(
          event.target,
        ) ||
        button.contains(
          event.target,
        )
      ) {
        return;
      }

      close();
    },
  );

  window.addEventListener(
    'resize',
    () => {
      if (
        window.innerWidth > 1180
      ) {
        close();
      }
    },
  );
}

// ============================================================
// MODAL
// ============================================================

let activeModal = null;
let lastFocusedElement = null;

export function openModal(target) {
  const modalElement =
    typeof target === 'string'
      ? $(target)
      : target;

  if (!modalElement) return null;

  if (
    activeModal &&
    activeModal !== modalElement
  ) {
    closeModal(activeModal);
  }

  lastFocusedElement =
    document.activeElement;

  modalElement.hidden = false;
  modalElement.classList.add('open');

  document.body.classList.add(
    'modal-open',
  );

  activeModal = modalElement;

  const focusable =
    $(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      modalElement,
    );

  window.setTimeout(
    () => focusable?.focus(),
    30,
  );

  return modalElement;
}

export function closeModal(target = activeModal) {
  const modalElement =
    typeof target === 'string'
      ? $(target)
      : target;

  if (!modalElement) return;

  modalElement.classList.remove(
    'open',
  );

  modalElement.hidden = true;

  if (activeModal === modalElement) {
    activeModal = null;
  }

  if (!activeModal) {
    document.body.classList.remove(
      'modal-open',
    );
  }

  if (
    lastFocusedElement instanceof
    HTMLElement
  ) {
    lastFocusedElement.focus();
  }
}

export function modal(
  html,
  {
    title = 'SKy Fit',
    kicker = 'SKy Fit',
  } = {},
) {
  let modalElement =
    byId('adminModal') ||
    byId('genericModal');

  if (!modalElement) {
    modalElement =
      document.createElement('div');

    modalElement.id =
      'genericModal';

    modalElement.className =
      'modal';

    modalElement.hidden = true;

    modalElement.setAttribute(
      'role',
      'dialog',
    );

    modalElement.setAttribute(
      'aria-modal',
      'true',
    );

    modalElement.innerHTML = `
      <div
        class="modal-backdrop"
        data-close-modal
      ></div>

      <div class="card modal-card">
        <div class="modal-header">
          <div>
            <span
              class="section-kicker"
              data-modal-kicker
            ></span>

            <h2 data-modal-title></h2>
          </div>

          <button
            class="icon-btn"
            type="button"
            aria-label="Pəncərəni bağla"
            data-close-modal
          >
            ×
          </button>
        </div>

        <div
          class="modal-content"
          data-modal-content
        ></div>
      </div>
    `;

    document.body.append(
      modalElement,
    );
  }

  const content =
    byId('adminModalContent') ||
    $('[data-modal-content]', modalElement) ||
    $('.modal-content', modalElement);

  const titleElement =
    byId('adminModalTitle') ||
    $('[data-modal-title]', modalElement);

  const kickerElement =
    byId('adminModalKicker') ||
    $('[data-modal-kicker]', modalElement);

  if (content) {
    content.innerHTML = html;
  }

  if (titleElement) {
    titleElement.textContent =
      title;
  }

  if (kickerElement) {
    kickerElement.textContent =
      kicker;
  }

  openModal(modalElement);

  return modalElement;
}

function bindModalEvents() {
  document.addEventListener(
    'click',
    (event) => {
      const closeTrigger =
        event.target.closest(
          [
            '[data-close-modal]',
            '[data-close-confirm]',
            '[data-close-favorites-modal]',
          ].join(','),
        );

      if (!closeTrigger) return;

      const modalElement =
        closeTrigger.closest(
          '.modal',
        );

      closeModal(modalElement);
    },
  );

  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key === 'Escape' &&
        activeModal
      ) {
        closeModal(activeModal);
      }
    },
  );
}

export function confirmAction({
  title = 'Əməliyyatı təsdiq edin',
  message =
    'Bu əməliyyatı davam etdirmək istəyirsiniz?',
  confirmLabel = 'Təsdiq et',
  cancelLabel = 'Ləğv et',
  danger = true,
} = {}) {
  return new Promise((resolve) => {
    const modalElement =
      byId('confirmModal');

    if (!modalElement) {
      resolve(
        window.confirm(message),
      );

      return;
    }

    setText(
      '#confirmModalTitle',
      title,
    );

    setText(
      '#confirmModalText',
      message,
    );

    const acceptButton =
      byId('acceptConfirmButton');

    const cancelButton =
      byId('cancelConfirmButton');

    if (acceptButton) {
      acceptButton.textContent =
        confirmLabel;

      acceptButton.className =
        danger
          ? 'btn btn-danger'
          : 'btn btn-primary';
    }

    if (cancelButton) {
      cancelButton.textContent =
        cancelLabel;
    }

    let resolved = false;

    const cleanup = () => {
      acceptButton?.removeEventListener(
        'click',
        accept,
      );

      cancelButton?.removeEventListener(
        'click',
        cancel,
      );

      modalElement.removeEventListener(
        'click',
        backdropCancel,
      );
    };

    const finish = (value) => {
      if (resolved) return;

      resolved = true;

      cleanup();
      closeModal(modalElement);
      resolve(value);
    };

    const accept = () =>
      finish(true);

    const cancel = () =>
      finish(false);

    const backdropCancel = (
      event,
    ) => {
      if (
        event.target.matches(
          '.modal-backdrop',
        )
      ) {
        finish(false);
      }
    };

    acceptButton?.addEventListener(
      'click',
      accept,
    );

    cancelButton?.addEventListener(
      'click',
      cancel,
    );

    modalElement.addEventListener(
      'click',
      backdropCancel,
    );

    openModal(modalElement);
  });
}

// ============================================================
// FILE VƏ STORAGE
// ============================================================

const ALLOWED_IMAGE_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

export function validateImageFile(
  file,
  {
    maxSizeMB = 5,
  } = {},
) {
  if (!file) {
    throw new Error(
      'Şəkil faylı seçilməyib.',
    );
  }

  if (
    !ALLOWED_IMAGE_TYPES.has(
      file.type,
    )
  ) {
    throw new Error(
      'Yalnız JPG, PNG və WEBP şəkilləri qəbul edilir.',
    );
  }

  const maxBytes =
    maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new Error(
      `Şəkil maksimum ${maxSizeMB} MB ola bilər.`,
    );
  }

  return true;
}

export async function compressImage(
  file,
  {
    maxWidth = 1440,
    maxHeight = 1440,
    quality = 0.84,
    outputType = 'image/webp',
  } = {},
) {
  validateImageFile(file);

  if (
    typeof createImageBitmap !==
    'function'
  ) {
    return file;
  }

  const bitmap =
    await createImageBitmap(file);

  let width = bitmap.width;
  let height = bitmap.height;

  const ratio = Math.min(
    1,
    maxWidth / width,
    maxHeight / height,
  );

  width = Math.max(
    1,
    Math.round(width * ratio),
  );

  height = Math.max(
    1,
    Math.round(height * ratio),
  );

  const canvas =
    document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const context =
    canvas.getContext('2d', {
      alpha: false,
    });

  if (!context) {
    bitmap.close();

    return file;
  }

  context.imageSmoothingEnabled =
    true;

  context.imageSmoothingQuality =
    'high';

  context.drawImage(
    bitmap,
    0,
    0,
    width,
    height,
  );

  bitmap.close();

  const blob =
    await new Promise(
      (resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(
                new Error(
                  'Şəkil sıxışdırıla bilmədi.',
                ),
              );
            }
          },
          outputType,
          quality,
        );
      },
    );

  const baseName =
    file.name
      .replace(/\.[^.]+$/, '')
      .replace(
        /[^a-zA-Z0-9-_]+/g,
        '-',
      )
      .replace(/^-+|-+$/g, '') ||
    'image';

  return new File(
    [blob],
    `${baseName}.webp`,
    {
      type: outputType,
      lastModified: Date.now(),
    },
  );
}

function sanitizeStoragePart(
  value,
) {
  return String(value ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9-_/]/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

export async function uploadPublic(
  bucket,
  file,
  folder = 'uploads',
  {
    compress = true,
    upsert = false,
    cacheControl = '31536000',
  } = {},
) {
  if (!sb) {
    throw new Error(
      'Supabase konfiqurasiyası yoxdur.',
    );
  }

  if (!file) return null;

  let uploadFile = file;

  if (
    compress &&
    ALLOWED_IMAGE_TYPES.has(
      file.type,
    )
  ) {
    uploadFile =
      await compressImage(file);
  }

  const safeFolder =
    sanitizeStoragePart(folder);

  const extension =
    uploadFile.name
      .split('.')
      .pop()
      ?.toLowerCase() ||
    'webp';

  const path = [
    safeFolder,
    `${Date.now()}-${uid()}.${extension}`,
  ]
    .filter(Boolean)
    .join('/');

  const {
    error,
  } = await sb.storage
    .from(bucket)
    .upload(
      path,
      uploadFile,
      {
        cacheControl,
        upsert,
        contentType:
          uploadFile.type ||
          undefined,
      },
    );

  if (error) {
    throw error;
  }

  const {
    data,
  } = sb.storage
    .from(bucket)
    .getPublicUrl(path);

  return {
    path,
    publicUrl:
      data.publicUrl,
  };
}

export async function uploadAvatar(
  file,
) {
  const session =
    await getSession();

  if (!session?.user?.id) {
    throw new Error(
      'Profil şəkli üçün əvvəlcə hesaba daxil olun.',
    );
  }

  return uploadPublic(
    config.STORAGE?.avatarsBucket ??
      'avatars',
    file,
    session.user.id,
    {
      compress: true,
      upsert: false,
    },
  );
}

export async function deleteStorageFile(
  bucket,
  path,
) {
  if (
    !sb ||
    !bucket ||
    !path
  ) {
    return;
  }

  const {
    error,
  } = await sb.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw error;
  }
}

// ============================================================
// FAVORITES LOCAL STORAGE
// ============================================================

const FAVORITES_KEY =
  'skyfit_favorite_products';

export function getFavoriteIds() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          FAVORITES_KEY,
        ) ?? '[]',
      );

    return Array.isArray(parsed)
      ? [
          ...new Set(
            parsed.filter(Boolean),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

export function saveFavoriteIds(ids) {
  const normalized = [
    ...new Set(
      (ids ?? []).filter(Boolean),
    ),
  ];

  localStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(normalized),
  );

  window.dispatchEvent(
    new CustomEvent(
      'skyfit:favorites-change',
      {
        detail: {
          ids: normalized,
        },
      },
    ),
  );

  return normalized;
}

export function isFavorite(
  productId,
) {
  return getFavoriteIds().includes(
    String(productId),
  );
}

export function toggleFavorite(
  productId,
) {
  const id =
    String(productId);

  const favorites =
    getFavoriteIds();

  const exists =
    favorites.includes(id);

  const next = exists
    ? favorites.filter(
        (item) => item !== id,
      )
    : [...favorites, id];

  saveFavoriteIds(next);

  return !exists;
}

// ============================================================
// PWA
// ============================================================

let deferredInstallPrompt = null;
let serviceWorkerRegistration = null;

export function isStandalone() {
  return (
    window.matchMedia?.(
      '(display-mode: standalone)',
    ).matches ||
    window.navigator.standalone === true
  );
}

function setInstallButtonsVisible(
  visible,
) {
  $$(
    '#pwaInstallButton, #setupInstallPwaButton',
  ).forEach((button) => {
    button.hidden =
      !visible ||
      isStandalone();
  });
}

export async function installPWA() {
  if (!deferredInstallPrompt) {
    if (isStandalone()) {
      toast(
        'Tətbiq artıq quraşdırılıb.',
        'info',
      );
    } else {
      toast(
        'Brauzer quraşdırma seçimini hələ təqdim etmir.',
        'info',
      );
    }

    return false;
  }

  deferredInstallPrompt.prompt();

  const choice =
    await deferredInstallPrompt
      .userChoice;

  const accepted =
    choice.outcome === 'accepted';

  deferredInstallPrompt = null;

  setInstallButtonsVisible(false);

  if (accepted) {
    toast(
      'SKy Fit tətbiqi quraşdırılır.',
      'success',
    );
  }

  return accepted;
}

function bindPwaInstallEvents() {
  window.addEventListener(
    'beforeinstallprompt',
    (event) => {
      event.preventDefault();

      deferredInstallPrompt =
        event;

      setInstallButtonsVisible(true);
    },
  );

  window.addEventListener(
    'appinstalled',
    () => {
      deferredInstallPrompt = null;

      setInstallButtonsVisible(false);

      toast(
        'SKy Fit uğurla quraşdırıldı.',
        'success',
      );
    },
  );

  $$(
    '#pwaInstallButton, #setupInstallPwaButton',
  ).forEach((button) => {
    if (
      button.dataset.pwaBound ===
      'true'
    ) {
      return;
    }

    button.dataset.pwaBound =
      'true';

    button.addEventListener(
      'click',
      installPWA,
    );
  });
}

export async function registerServiceWorker() {
  if (
    !('serviceWorker' in navigator) ||
    location.protocol === 'file:'
  ) {
    return null;
  }

  try {
    serviceWorkerRegistration =
      await navigator.serviceWorker.register(
        'service-worker.js',
        {
          scope: './',
          updateViaCache: 'none',
        },
      );

    await serviceWorkerRegistration.update();

    serviceWorkerRegistration.addEventListener(
      'updatefound',
      () => {
        const worker =
          serviceWorkerRegistration.installing;

        if (!worker) return;

        worker.addEventListener(
          'statechange',
          () => {
            if (
              worker.state ===
                'installed' &&
              navigator.serviceWorker
                .controller
            ) {
              toast(
                'Yeni versiya hazırdır. Səhifəni yeniləyin.',
                'info',
                6000,
              );
            }
          },
        );
      },
    );

    return serviceWorkerRegistration;
  } catch (error) {
    reportError(
      error,
      'serviceWorker',
    );

    return null;
  }
}

export function getServiceWorkerRegistration() {
  return serviceWorkerRegistration;
}

// ============================================================
// REALTIME KÖMƏKÇİSİ
// ============================================================

export function subscribeToTable({
  table,
  schema = 'public',
  event = '*',
  filter,
  channelName,
  callback,
  onStatus,
} = {}) {
  if (
    !sb ||
    !table
  ) {
    return null;
  }

  const name =
    channelName ??
    `skyfit-${table}-${uid()}`;

  const channel =
    sb.channel(name);

  const changeConfig = {
    event,
    schema,
    table,
  };

  if (filter) {
    changeConfig.filter = filter;
  }

  channel.on(
    'postgres_changes',
    changeConfig,
    (payload) => {
      try {
        callback?.(payload);
      } catch (error) {
        reportError(
          error,
          `realtime:${table}`,
        );
      }
    },
  );

  channel.subscribe(
    (status) => {
      onStatus?.(status);

      window.dispatchEvent(
        new CustomEvent(
          'skyfit:realtime-status',
          {
            detail: {
              table,
              status,
            },
          },
        ),
      );
    },
  );

  return channel;
}

export async function removeRealtimeChannel(
  channel,
) {
  if (
    sb &&
    channel
  ) {
    await sb.removeChannel(channel);
  }
}

// ============================================================
// CSV
// ============================================================

export function downloadCSV(
  filename,
  rows,
) {
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    toast(
      'İxrac ediləcək məlumat yoxdur.',
      'info',
    );

    return;
  }

  const headers =
    Object.keys(rows[0]);

  const quote = (value) =>
    `"${String(value ?? '')
      .replace(/"/g, '""')}"`;

  const csv = [
    headers.map(quote).join(','),
    ...rows.map((row) =>
      headers
        .map((header) =>
          quote(row[header]),
        )
        .join(','),
    ),
  ].join('\r\n');

  const blob =
    new Blob(
      [`\uFEFF${csv}`],
      {
        type:
          'text/csv;charset=utf-8',
      },
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement('a');

  link.href = url;

  link.download =
    filename.endsWith('.csv')
      ? filename
      : `${filename}.csv`;

  document.body.append(link);

  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

// ============================================================
// TARİX VƏ ÜMUMİ UI
// ============================================================

export function setCurrentYear() {
  const year =
    new Date().getFullYear();

  $$(
    '#currentYear',
  ).forEach((element) => {
    element.textContent =
      String(year);
  });
}

function bindSmoothPageLinks() {
  document.addEventListener(
    'click',
    (event) => {
      const link =
        event.target.closest(
          'a[href^="#"]',
        );

      if (!link) return;

      const href =
        link.getAttribute('href');

      if (
        !href ||
        href === '#'
      ) {
        return;
      }

      const target =
        $(href);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior:
          window.matchMedia?.(
            '(prefers-reduced-motion: reduce)',
          ).matches
            ? 'auto'
            : 'smooth',

        block: 'start',
      });

      history.replaceState(
        null,
        '',
        href,
      );
    },
  );
}

function bindLogoutButtons() {
  $$(
    '#logoutButton, #adminLogoutButton',
  ).forEach((button) => {
    if (
      button.dataset.logoutBound ===
      'true'
    ) {
      return;
    }

    button.dataset.logoutBound =
      'true';

    button.addEventListener(
      'click',
      async () => {
        const confirmed =
          await confirmAction({
            title: 'Hesabdan çıxış',
            message:
              'Hesabdan çıxmaq istəyirsiniz?',
            confirmLabel: 'Çıxış et',
            danger: true,
          });

        if (!confirmed) return;

        try {
          setBusy(
            button,
            true,
            'Çıxılır...',
          );

          await logout();
        } catch (error) {
          setBusy(
            button,
            false,
          );

          toast(
            getErrorMessage(error),
            'error',
          );
        }
      },
    );
  });
}

function bindGlobalAuthEvents() {
  if (!sb) return;

  sb.auth.onAuthStateChange(
    (event) => {
      if (
        event === 'SIGNED_OUT'
      ) {
        clearProfileCache();
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'USER_UPDATED' ||
        event === 'TOKEN_REFRESHED'
      ) {
        clearProfileCache();
      }

      window.setTimeout(
        () => {
          void updateSessionUI();
        },
        0,
      );
    },
  );
}

function checkConfiguration() {
  if (isConfigured) {
    return true;
  }

  const currentPage =
    getCurrentPage();

  if (
    currentPage !== 'setup.html'
  ) {
    console.warn(
      'SKy Fit Supabase konfiqurasiyası tamamlanmayıb.',
    );
  }

  return false;
}

// ============================================================
// CORE INIT
// ============================================================

let initialized = false;

export async function initCore() {
  if (initialized) return;

  initialized = true;

  initTheme();
  setCurrentYear();

  bindThemeButtons();
  bindNetworkEvents();
  bindMobileMenu();
  bindModalEvents();
  bindPwaInstallEvents();
  bindSmoothPageLinks();
  bindLogoutButtons();
  bindGlobalAuthEvents();

  updateNetworkStatus();
  checkConfiguration();

  await registerServiceWorker();

  try {
    await updateSessionUI();
  } catch (error) {
    reportError(
      error,
      'initial-session-ui',
    );
  }

  window.dispatchEvent(
    new CustomEvent(
      'skyfit:core-ready',
    ),
  );
}

// Tema səhifə görünməzdən əvvəl tətbiq olunur.
initTheme();

if (
  document.readyState ===
  'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      void initCore();
    },
    {
      once: true,
    },
  );
} else {
  void initCore();
}

// Səhifənin bütün şəkil və resursları yükləndikdə əsas loader bağlanır.
window.addEventListener(
  'load',
  () => {
    window.setTimeout(
      () => hideLoader(true),
      180,
    );
  },
  {
    once: true,
  },
);

// GIF və ya başqa resurs yüklənməsə belə loader səhifəni bloklamasın.
window.setTimeout(
  () => hideLoader(true),
  6500,
);

// Köhnə onclick çağırışları ilə uyğunluq.
window.SkyCore = Object.freeze({
  toast,
  setBusy,
  showLoader,
  hideLoader,
  toggleTheme,
  openModal,
  closeModal,
  confirmAction,
  logout,
  money,
  fmtDate,
  fmtDateTime,
});
