// ============================================================
// SKy Fit Professional — Member Profile Module
// Profil, abunəlik, borc, alış, giriş tarixçəsi və məhsullar
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
  daysLeft,
  membershipState,
  statusBadge,
  paymentStatusBadge,
  paymentMethodLabel,
  requireAuth,
  layout,
  toast,
  setBusy,
  setFormMessage,
  getErrorMessage,
  reportError,
  uploadAvatar,
  deleteStorageFile,
  clearProfileCache,
  hasStaffRole,
  getFavoriteIds,
  isFavorite,
  toggleFavorite,
  subscribeToTable,
  removeRealtimeChannel,
  confirmAction,
  hideLoader,
} from './core.js';

// ============================================================
// SABİTLƏR
// ============================================================

const FALLBACK_AVATAR =
  'assets/img/logo.png';

const FALLBACK_PRODUCT_IMAGE =
  'assets/img/logo.png';

const business =
  cfg.BUSINESS ?? {};

const state = {
  profile: null,
  membership: null,
  memberships: [],
  debtAccount: null,
  debtTransactions: [],
  sales: [],
  attendance: [],
  products: [],
  realtimeChannels: [],
  reloadTimer: null,
  selectedAvatarFile: null,
};

// ============================================================
// DOM ELEMENTLƏRİ
// ============================================================

const elements = {
  profileName:
    byId('profileName'),

  profileEmail:
    byId('profileEmail'),

  profilePhone:
    byId('profilePhone'),

  profileRole:
    byId('profileRole'),

  profileMemberSince:
    byId('profileMemberSince'),

  avatar:
    byId('avatar'),

  avatarPreview:
    byId('profileAvatarPreview'),

  avatarFileName:
    byId('profileAvatarFileName'),

  profileForm:
    byId('profileForm'),

  profileMessage:
    byId('profileMessage'),

  saveProfileButton:
    byId('saveProfileButton'),

  logoutButton:
    byId('logoutButton'),

  adminPanelLink:
    byId('adminPanelLink'),

  membership:
    byId('membership'),

  membershipContent:
    byId('membershipContent'),

  membershipAlert:
    byId('profileAlert'),

  membershipAlertTitle:
    byId('profileAlertTitle'),

  membershipAlertText:
    byId('profileAlertText'),

  membershipPlanName:
    byId('membershipPlanName'),

  membershipDates:
    byId('membershipDateRange'),

  membershipDays:
    byId('membershipDaysLeft'),

  membershipProgress:
    byId('membershipProgress') ??
    byId('membershipProgressBar'),

  membershipStatus:
    byId('membershipStatusBadge'),

  debt:
    byId('debt'),

  debtContent:
    byId('debtContent'),

  debtAmount:
    byId('currentDebtAmount'),

  debtStatus:
    byId('debtStatusBadge'),

  salesCount:
    byId('totalPurchaseCount'),

  attendanceCount:
    byId('attendanceHistoryCount') ??
    byId('profileAttendanceCount'),

  membershipCount:
    byId('membershipHistoryCount') ??
    byId('profileMembershipCount'),

  history:
    byId('history'),

  salesTable:
    byId('history'),

  salesEmpty:
    byId('purchaseHistoryEmpty'),

  debtTable:
    byId('debtHistoryBody'),

  debtEmpty:
    byId('debtHistoryEmpty'),

  attendanceTable:
    byId('attendanceHistoryBody'),

  attendanceEmpty:
    byId('attendanceHistoryEmpty'),

  membershipHistory:
    byId('membershipHistoryBody'),

  membershipHistoryEmpty:
    byId('membershipHistoryEmpty'),

  profileProducts:
    byId('profileProducts'),

  profileProductsEmpty:
    byId('profileProductsEmpty'),

  favoritesCount:
    byId('headerFavoritesCount'),
};

// ============================================================
// KÖMƏKÇİLƏR
// ============================================================

function safeText(value, fallback = '—') {
  const text =
    String(value ?? '').trim();

  return text || fallback;
}

function safeImageUrl(
  value,
  fallback = FALLBACK_AVATAR,
) {
  const url =
    String(value ?? '').trim();

  return url || fallback;
}

function bindImageFallbacks(
  root = document,
) {
  $$('img[data-image-fallback]', root)
    .forEach((image) => {
      if (
        image.dataset.fallbackBound ===
        'true'
      ) {
        return;
      }

      image.dataset.fallbackBound =
        'true';

      image.addEventListener(
        'error',
        () => {
          image.onerror = null;

          image.src =
            image.dataset.fallback ||
            FALLBACK_AVATAR;
        },
      );
    });
}

function getProfileFormField(name) {
  return (
    elements.profileForm
      ?.elements
      ?.namedItem(name) ?? null
  );
}

function normalizePhone(value) {
  const raw =
    String(value ?? '').trim();

  if (!raw) return '';

  const digits =
    raw.replace(/\D/g, '');

  if (
    digits.startsWith('994') &&
    digits.length === 12
  ) {
    return `+${digits}`;
  }

  if (
    digits.startsWith('0') &&
    digits.length === 10
  ) {
    return `+994${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `+994${digits}`;
  }

  return raw;
}

function isValidPhone(value) {
  if (!value) return true;

  return /^\+994\d{9}$/.test(
    normalizePhone(value),
  );
}

function getRoleLabel(role) {
  const labels = {
    admin: 'Admin',
    staff: 'İşçi',
    member: 'Üzv',
  };

  return labels[role] ??
    'Üzv';
}

function getMembershipPlan(
  membership,
) {
  return (
    membership?.membership_plans ??
    membership?.plan ??
    null
  );
}

function getDebtBalance() {
  const balance =
    Number(
      state.debtAccount?.balance ??
      0,
    );

  return Number.isFinite(balance)
    ? balance
    : 0;
}

function getActiveMembership(
  memberships,
) {
  if (
    !Array.isArray(
      memberships,
    )
  ) {
    return null;
  }

  const today =
    new Date();

  today.setHours(
    12,
    0,
    0,
    0,
  );

  const validMemberships =
    memberships
      .filter((membership) => {
        const endDate =
          new Date(
            `${membership.end_date}T12:00:00`,
          );

        return (
          membership.status ===
            'active' &&
          !Number.isNaN(
            endDate.getTime(),
          ) &&
          endDate >= today
        );
      })
      .sort((a, b) => {
        const planA =
          getMembershipPlan(a);

        const planB =
          getMembershipPlan(b);

        if (
          planA?.is_daily !==
          planB?.is_daily
        ) {
          return planA?.is_daily
            ? 1
            : -1;
        }

        return (
          new Date(
            b.end_date,
          ).getTime() -
          new Date(
            a.end_date,
          ).getTime()
        );
      });

  return (
    validMemberships[0] ??
    null
  );
}

function calculateMembershipProgress(
  membership,
) {
  if (
    !membership?.start_date ||
    !membership?.end_date
  ) {
    return 0;
  }

  const start =
    new Date(
      `${membership.start_date}T12:00:00`,
    );

  const end =
    new Date(
      `${membership.end_date}T12:00:00`,
    );

  const today =
    new Date();

  today.setHours(12, 0, 0, 0);

  const total =
    end.getTime() -
    start.getTime();

  const elapsed =
    today.getTime() -
    start.getTime();

  if (
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (elapsed / total) * 100,
      ),
    ),
  );
}

function getAttendanceTypeLabel(type) {
  const labels = {
    membership: 'Abunəlik',
    daily: 'Günlük giriş',
    guest: 'Qonaq',
  };

  return labels[type] ??
    type ??
    'Giriş';
}

function getDebtTypeLabel(type) {
  const labels = {
    debt: 'Borc yazılıb',
    payment: 'Borc ödənilib',
    adjustment: 'Düzəliş',
  };

  return labels[type] ??
    type ??
    'Əməliyyat';
}

function getDebtTypeBadge(type) {
  if (type === 'payment') {
    return 'badge ok';
  }

  if (type === 'debt') {
    return 'badge danger';
  }

  return 'badge warn';
}

function getStockState(product) {
  const quantity =
    Number(
      product.stock_quantity ??
      0,
    );

  const threshold =
    Number(
      product.low_stock_threshold ??
      0,
    );

  if (quantity <= 0) {
    return {
      label: 'Stok bitib',
      className: 'badge danger',
      available: false,
    };
  }

  if (
    threshold > 0 &&
    quantity <= threshold
  ) {
    return {
      label: 'Az qalıb',
      className: 'badge warn',
      available: true,
    };
  }

  return {
    label: 'Stokda var',
    className: 'badge ok',
    available: true,
  };
}

function getProductPrice(product) {
  if (
    product.sale_mode ===
    'portion'
  ) {
    return Number(
      product.portion_price ??
      0,
    );
  }

  return Number(
    product.retail_price ??
    0,
  );
}

function getProductPriceLabel(
  product,
) {
  const price =
    money(
      getProductPrice(product),
    );

  return product.sale_mode ===
    'portion'
    ? `${price} / porsiya`
    : price;
}

function getWhatsAppProductUrl(
  product,
) {
  const whatsapp =
    String(
      business.whatsapp ??
      '994555240160',
    ).replace(/\D/g, '');

  const message =
    `Salam, SKy Fit-də satılan "${product.name}" məhsulu haqqında məlumat almaq istəyirəm. Qiymət: ${getProductPriceLabel(product)}.`;

  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    message,
  )}`;
}

function updateFavoritesCount() {
  const count =
    getFavoriteIds().length;

  if (elements.favoritesCount) {
    elements.favoritesCount.textContent =
      String(count);

    elements.favoritesCount.hidden =
      count === 0;
  }
}

// ============================================================
// PROFİL BAŞLIĞI
// ============================================================

function renderProfileIdentity() {
  const profile =
    state.profile;

  if (!profile) return;

  if (elements.profileName) {
    elements.profileName.textContent =
      safeText(
        profile.full_name,
        'SKy Fit üzvü',
      );
  }

  if (elements.profileEmail) {
    elements.profileEmail.textContent =
      safeText(
        profile.email,
        'Email yoxdur',
      );
  }

  if (elements.profilePhone) {
    elements.profilePhone.textContent =
      safeText(
        profile.phone,
        'Telefon əlavə edilməyib',
      );
  }

  if (elements.profileRole) {
    elements.profileRole.textContent =
      getRoleLabel(profile.role);
  }

  if (
    elements.profileMemberSince
  ) {
    elements.profileMemberSince.textContent =
      fmtDate(profile.created_at);
  }

  const avatarUrl =
    safeImageUrl(
      profile.avatar_url,
    );

  if (elements.avatar) {
    elements.avatar.src =
      avatarUrl;

    elements.avatar.dataset.fallback =
      FALLBACK_AVATAR;
  }

  if (elements.avatarPreview) {
    elements.avatarPreview.src =
      avatarUrl;

    elements.avatarPreview.dataset.fallback =
      FALLBACK_AVATAR;
  }

  if (elements.adminPanelLink) {
    elements.adminPanelLink.hidden =
      !hasStaffRole(profile);
  }

  bindImageFallbacks();
}

// ============================================================
// PROFİL FORMU
// ============================================================

function fillProfileForm() {
  const profile =
    state.profile;

  const form =
    elements.profileForm;

  if (
    !form ||
    !profile
  ) {
    return;
  }

  const fullName =
    getProfileFormField(
      'full_name',
    );

  const phone =
    getProfileFormField(
      'phone',
    );

  const email =
    getProfileFormField(
      'email',
    );

  const birthDate =
    getProfileFormField(
      'birth_date',
    );

  const address =
    getProfileFormField(
      'address',
    );

  if (fullName) {
    fullName.value =
      profile.full_name ?? '';
  }

  if (phone) {
    phone.value =
      profile.phone ?? '';
  }

  if (email) {
    email.value =
      profile.email ?? '';

    email.readOnly = true;
  }

  if (birthDate) {
    birthDate.value =
      profile.birth_date ?? '';
  }

  if (address) {
    address.value =
      profile.address ?? '';
  }
}

// ============================================================
// ABUNƏLİK
// ============================================================

function renderMembership() {
  const membership =
    state.membership;

  const oldRoot =
    elements.membership;

  const plan =
    getMembershipPlan(
      membership,
    );

  if (!membership) {
    if (oldRoot) {
      oldRoot.innerHTML = `
        <div class="notice danger">
          <div>
            <strong>
              Aktiv abunəlik yoxdur
            </strong>

            <p>
              Aylıq və ya günlük üzvlük üçün administrasiya ilə əlaqə saxlayın.
            </p>
          </div>
        </div>
      `;
    }

    if (elements.membershipContent) {
      elements.membershipContent.innerHTML = `
        <div class="empty-state empty-state--compact">
          <h3>
            Aktiv abunəlik yoxdur
          </h3>

          <p>
            Aylıq və ya günlük üzvlük üçün zal administrasiyasına müraciət edin.
          </p>

          <a
            class="btn btn-primary"
            href="https://wa.me/${esc(
              business.whatsapp ??
              '994555240160',
            )}?text=${encodeURIComponent(
              'Salam, SKy Fit üzvlüyü haqqında məlumat almaq istəyirəm.',
            )}"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </div>
      `;
    }

    if (elements.membershipPlanName) {
      elements.membershipPlanName.textContent =
        'Abunəlik yoxdur';
    }

    if (elements.membershipDates) {
      elements.membershipDates.textContent =
        '—';
    }

    if (elements.membershipDays) {
      elements.membershipDays.textContent =
        '0 gün';
    }

    if (elements.membershipProgress) {
      elements.membershipProgress.style.width =
        '0%';
    }

    if (elements.membershipStatus) {
      elements.membershipStatus.innerHTML = `
        <span class="badge danger">
          Aktiv deyil
        </span>
      `;
    }

    renderMembershipAlert(null);

    return;
  }

  const stateInfo =
    membershipState(
      membership.end_date,
    );

  const progress =
    calculateMembershipProgress(
      membership,
    );

  const planName =
    plan?.name ??
    'Üzvlük planı';

  const datesText =
    `${fmtDate(
      membership.start_date,
    )} — ${fmtDate(
      membership.end_date,
    )}`;

  if (oldRoot) {
    oldRoot.innerHTML = `
      <div class="card neon">
        <div class="split">
          <div>
            <span class="muted">
              Cari abunəlik
            </span>

            <h2>
              ${esc(planName)}
            </h2>
          </div>

          ${statusBadge(
            membership.end_date,
          )}
        </div>

        <p>
          ${esc(datesText)}
        </p>

        <div class="membership-progress">
          <span
            style="width:${progress}%"
          ></span>
        </div>
      </div>
    `;
  }

  if (elements.membershipPlanName) {
    elements.membershipPlanName.textContent =
      planName;
  }

  if (elements.membershipDates) {
    elements.membershipDates.textContent =
      datesText;
  }

  if (elements.membershipDays) {
    elements.membershipDays.textContent =
      stateInfo.days === null
        ? '—'
        : stateInfo.days < 0
          ? `${Math.abs(
              stateInfo.days,
            )} gün əvvəl bitib`
          : `${stateInfo.days} gün`;
  }

  if (elements.membershipProgress) {
    elements.membershipProgress.style.width =
      `${progress}%`;

    elements.membershipProgress.classList.toggle(
      'danger',
      stateInfo.key ===
        'critical' ||
      stateInfo.key ===
        'expired',
    );
  }

  if (elements.membershipStatus) {
    elements.membershipStatus.innerHTML =
      statusBadge(
        membership.end_date,
      );
  }

  if (elements.membershipContent) {
    elements.membershipContent.innerHTML = `
      <div class="membership-profile-details">
        <div>
          <span class="muted">
            Plan
          </span>

          <strong>
            ${esc(planName)}
          </strong>
        </div>

        <div>
          <span class="muted">
            Başlama
          </span>

          <strong>
            ${esc(
              fmtDate(
                membership.start_date,
              ),
            )}
          </strong>
        </div>

        <div>
          <span class="muted">
            Bitmə
          </span>

          <strong>
            ${esc(
              fmtDate(
                membership.end_date,
              ),
            )}
          </strong>
        </div>

        <div>
          <span class="muted">
            Ödəniş
          </span>

          <strong>
            ${esc(
              money(
                membership.price ??
                plan?.price ??
                0,
              ),
            )}
          </strong>
        </div>
      </div>

      <div class="membership-progress">
        <span
          style="width:${progress}%"
        ></span>
      </div>

      <div class="split">
        <small class="muted">
          Müddətin ${progress}% hissəsi istifadə olunub
        </small>

        ${statusBadge(
          membership.end_date,
        )}
      </div>
    `;
  }

  renderMembershipAlert(
    membership,
  );
}

function renderMembershipAlert(
  membership,
) {
  const alert =
    elements.membershipAlert;

  if (!alert) return;

  if (!membership) {
    alert.hidden = false;

    if (
      elements.membershipAlertTitle
    ) {
      elements.membershipAlertTitle.textContent =
        'Aktiv abunəlik yoxdur';
    }

    if (
      elements.membershipAlertText
    ) {
      elements.membershipAlertText.textContent =
        'Zala davam etmək üçün yeni abunəlik əldə edin.';
    }

    return;
  }

  const remaining =
    daysLeft(
      membership.end_date,
    );

  if (
    remaining === null ||
    remaining > 3
  ) {
    alert.hidden = true;

    return;
  }

  alert.hidden = false;

  if (remaining < 0) {
    if (
      elements.membershipAlertTitle
    ) {
      elements.membershipAlertTitle.textContent =
        'Abunəliyin vaxtı bitib';
    }

    if (
      elements.membershipAlertText
    ) {
      elements.membershipAlertText.textContent =
        `Abunəliyiniz ${Math.abs(
          remaining,
        )} gün əvvəl bitib.`;
    }

    return;
  }

  if (remaining === 0) {
    if (
      elements.membershipAlertTitle
    ) {
      elements.membershipAlertTitle.textContent =
        'Abunəlik bu gün bitir';
    }

    if (
      elements.membershipAlertText
    ) {
      elements.membershipAlertText.textContent =
        'Məşqlərə fasiləsiz davam etmək üçün abunəliyinizi yeniləyin.';
    }

    return;
  }

  if (
    elements.membershipAlertTitle
  ) {
    elements.membershipAlertTitle.textContent =
      `Abunəliyin bitməsinə ${remaining} gün qalıb`;
  }

  if (
    elements.membershipAlertText
  ) {
    elements.membershipAlertText.textContent =
      'Abunəliyinizi vaxtında yeniləmək üçün administrasiya ilə əlaqə saxlayın.';
  }
}

// ============================================================
// BORC
// ============================================================

function renderDebt() {
  const balance =
    getDebtBalance();

  const oldRoot =
    elements.debt;

  if (oldRoot) {
    oldRoot.innerHTML = `
      <div class="card ${
        balance > 0
          ? 'neon'
          : ''
      }">
        <span class="muted">
          Cari borc
        </span>

        <div
          class="stat-value"
          style="color:${
            balance > 0
              ? 'var(--danger)'
              : 'var(--success)'
          }"
        >
          ${esc(money(balance))}
        </div>

        <p class="muted">
          ${
            balance > 0
              ? 'Borc ödənişi üçün administrasiya ilə əlaqə saxlayın.'
              : 'Hazırda borcunuz yoxdur.'
          }
        </p>
      </div>
    `;
  }

  if (elements.debtAmount) {
    elements.debtAmount.textContent =
      money(balance);

    elements.debtAmount.classList.toggle(
      'stat-value--danger',
      balance > 0,
    );

    elements.debtAmount.classList.toggle(
      'stat-value--success',
      balance <= 0,
    );
  }

  if (elements.debtStatus) {
    elements.debtStatus.innerHTML =
      balance > 0
        ? `
          <span class="badge danger">
            Ödənilməlidir
          </span>
        `
        : `
          <span class="badge ok">
            Borc yoxdur
          </span>
        `;
  }

  if (elements.debtContent) {
    elements.debtContent.innerHTML =
      balance > 0
        ? `
          <div class="debt-total-box">
            <div>
              <span class="muted">
                Cari borc balansı
              </span>

              <strong>
                ${esc(money(balance))}
              </strong>
            </div>

            <span class="badge danger">
              Borcludur
            </span>
          </div>

          <p class="muted">
            Ödəniş etdikdən sonra borc balansı administrator tərəfindən sistemdə yenilənəcək.
          </p>

          <a
            class="btn btn-whatsapp"
            href="https://wa.me/${esc(
              business.whatsapp ??
              '994555240160',
            )}?text=${encodeURIComponent(
              `Salam, SKy Fit hesabımdakı ${money(
                balance,
              )} borc haqqında məlumat almaq istəyirəm.`,
            )}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Borc haqqında yaz
          </a>
        `
        : `
          <div class="empty-state empty-state--compact">
            <span class="badge ok">
              Balans təmizdir
            </span>

            <h3>
              Borcunuz yoxdur
            </h3>

            <p>
              Hazırda hesabınızda ödənilməmiş borc görünmür.
            </p>
          </div>
        `;
  }
}

// ============================================================
// STATİSTİKALAR
// ============================================================

function renderStatistics() {
  const salesCount =
    state.sales.length;

  const attendanceCount =
    state.attendance.length;

  const membershipCount =
    state.memberships.length;

  if (elements.salesCount) {
    elements.salesCount.textContent =
      String(salesCount);
  }

  if (elements.attendanceCount) {
    elements.attendanceCount.textContent =
      String(attendanceCount);
  }

  if (elements.membershipCount) {
    elements.membershipCount.textContent =
      String(membershipCount);
  }
}

// ============================================================
// SATIŞ TARİXÇƏSİ
// ============================================================

function renderSalesHistory() {
  const rows =
    state.sales;

  const oldTable =
    elements.history;

  const table =
    elements.salesTable ??
    oldTable;

  if (!table) return;

  if (!rows.length) {
    table.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state empty-state--compact">
            <p>
              Alış tarixçəsi yoxdur.
            </p>
          </div>
        </td>
      </tr>
    `;

    if (elements.salesEmpty) {
      elements.salesEmpty.hidden =
        false;
    }

    return;
  }

  if (elements.salesEmpty) {
    elements.salesEmpty.hidden =
      true;
  }

  table.innerHTML =
    rows
      .map((sale) => {
        const itemNames =
          Array.isArray(
            sale.sale_items,
          )
            ? sale.sale_items
                .map(
                  (item) =>
                    item.product_name,
                )
                .filter(Boolean)
                .join(', ')
            : '';

        return `
          <tr>
            <td>
              ${esc(
                fmtDateTime(
                  sale.created_at,
                ),
              )}
            </td>

            ${
              table === oldTable &&
              !elements.salesTable
                ? ''
                : `
                  <td>
                    ${esc(
                      itemNames ||
                      'Məhsul satışı',
                    )}
                  </td>
                `
            }

            <td>
              <strong>
                ${esc(
                  money(
                    sale.total_amount,
                  ),
                )}
              </strong>
            </td>

            ${
              table === oldTable &&
              !elements.salesTable
                ? ''
                : `
                  <td>
                    ${esc(
                      paymentMethodLabel(
                        sale.payment_method,
                      ),
                    )}
                  </td>
                `
            }

            <td>
              ${paymentStatusBadge(
                sale.payment_status,
              )}
            </td>
          </tr>
        `;
      })
      .join('');
}

// ============================================================
// BORC TARİXÇƏSİ
// ============================================================

function renderDebtHistory() {
  const table =
    elements.debtTable;

  if (!table) return;

  if (
    !state.debtTransactions.length
  ) {
    table.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state empty-state--compact">
            <p>
              Borc əməliyyatı yoxdur.
            </p>
          </div>
        </td>
      </tr>
    `;

    if (elements.debtEmpty) {
      elements.debtEmpty.hidden =
        false;
    }

    return;
  }

  if (elements.debtEmpty) {
    elements.debtEmpty.hidden =
      true;
  }

  table.innerHTML =
    state.debtTransactions
      .map((transaction) => `
        <tr>
          <td>
            ${esc(
              fmtDateTime(
                transaction.created_at,
              ),
            )}
          </td>

          <td>
            <span class="${getDebtTypeBadge(
              transaction.transaction_type,
            )}">
              ${esc(
                getDebtTypeLabel(
                  transaction.transaction_type,
                ),
              )}
            </span>
          </td>

          <td>
            <strong>
              ${
                transaction.transaction_type ===
                'payment'
                  ? '-'
                  : '+'
              }${esc(
                money(
                  transaction.amount,
                ),
              )}
            </strong>
          </td>

          <td>
            ${esc(
              paymentMethodLabel(
                transaction.payment_method,
              ),
            )}
          </td>

          <td>
            ${esc(
              transaction.note ??
              '—',
            )}
          </td>
        </tr>
      `)
      .join('');
}

// ============================================================
// GİRİŞ TARİXÇƏSİ
// ============================================================

function renderAttendanceHistory() {
  const table =
    elements.attendanceTable;

  if (!table) return;

  if (!state.attendance.length) {
    table.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state empty-state--compact">
            <p>
              Zala giriş tarixçəsi yoxdur.
            </p>
          </div>
        </td>
      </tr>
    `;

    if (elements.attendanceEmpty) {
      elements.attendanceEmpty.hidden =
        false;
    }

    return;
  }

  if (elements.attendanceEmpty) {
    elements.attendanceEmpty.hidden =
      true;
  }

  table.innerHTML =
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
            <span class="badge ${
              entry.attendance_type ===
                'daily'
                ? 'warn'
                : 'ok'
            }">
              ${esc(
                getAttendanceTypeLabel(
                  entry.attendance_type,
                ),
              )}
            </span>
          </td>

          <td>
            ${esc(
              money(
                entry.amount ??
                0,
              ),
            )}
          </td>

          <td>
            ${
              entry.membership_id
                ? `
                  <span class="badge ok">
                    Abunəlik
                  </span>
                `
                : `
                  <span class="badge">
                    Birbaşa giriş
                  </span>
                `
            }
          </td>
        </tr>
      `)
      .join('');
}

// ============================================================
// ABUNƏLİK TARİXÇƏSİ
// ============================================================

function renderMembershipHistory() {
  const table =
    elements.membershipHistory;

  if (!table) return;

  if (!state.memberships.length) {
    table.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state empty-state--compact">
            <p>
              Abunəlik tarixçəsi yoxdur.
            </p>
          </div>
        </td>
      </tr>
    `;

    if (
      elements.membershipHistoryEmpty
    ) {
      elements.membershipHistoryEmpty.hidden =
        false;
    }

    return;
  }

  if (
    elements.membershipHistoryEmpty
  ) {
    elements.membershipHistoryEmpty.hidden =
      true;
  }

  table.innerHTML =
    state.memberships
      .map((membership) => {
        const plan =
          getMembershipPlan(
            membership,
          );

        return `
          <tr>
            <td>
              ${esc(
                plan?.name ??
                'Üzvlük planı',
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
              ${esc(
                money(
                  membership.price ??
                  plan?.price ??
                  0,
                ),
              )}
            </td>

            <td>
              ${paymentStatusBadge(
                membership.payment_status,
              )}
            </td>

            <td>
              ${statusBadge(
                membership.end_date,
              )}
            </td>
          </tr>
        `;
      })
      .join('');
}

// ============================================================
// PROFİL MƏHSULLARI
// ============================================================

function productCardTemplate(
  product,
) {
  const stock =
    getStockState(product);

  const favorite =
    isFavorite(product.id);

  return `
    <article
      class="card product-card neon"
      data-profile-product="${esc(
        product.id,
      )}"
    >
      <button
        class="favorite-button ${
          favorite
            ? 'active'
            : ''
        }"
        type="button"
        data-profile-favorite="${esc(
          product.id,
        )}"
        aria-pressed="${String(
          favorite,
        )}"
        aria-label="${
          favorite
            ? 'Sevimlilərdən sil'
            : 'Sevimlilərə əlavə et'
        }"
      >
        ${favorite ? '♥' : '♡'}
      </button>

      <img
        src="${esc(
          safeImageUrl(
            product.image_url,
            FALLBACK_PRODUCT_IMAGE,
          ),
        )}"
        alt="${esc(product.name)}"
        loading="lazy"
        data-image-fallback
        data-fallback="${FALLBACK_PRODUCT_IMAGE}"
      >

      <div class="product-body">
        <div class="product-meta">
          <div>
            <span class="section-kicker">
              ${esc(
                product.category ??
                'Məhsul',
              )}
            </span>

            <h3>
              ${esc(product.name)}
            </h3>

            <p class="muted">
              ${esc(
                product.description ??
                (
                  product.sale_mode ===
                  'portion'
                    ? `${number(
                        product.portion_size,
                      )} ${
                        product.stock_unit ??
                        'qram'
                      } porsiya`
                    : product.stock_unit ??
                      'ədəd'
                ),
              )}
            </p>
          </div>

          <div class="price">
            ${esc(
              getProductPriceLabel(
                product,
              ),
            )}
          </div>
        </div>

        <div class="split">
          <span class="${stock.className}">
            ${esc(stock.label)}
          </span>

          <a
            class="btn btn-primary btn-small"
            href="${esc(
              getWhatsAppProductUrl(
                product,
              ),
            )}"
            target="_blank"
            rel="noopener noreferrer"
            ${
              stock.available
                ? ''
                : 'aria-disabled="true" tabindex="-1"'
            }
          >
            ${
              stock.available
                ? 'Sifariş et'
                : 'Stok yoxdur'
            }
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderProfileProducts() {
  const root =
    elements.profileProducts;

  if (!root) return;

  root.setAttribute(
    'aria-busy',
    'false',
  );

  if (!state.products.length) {
    root.innerHTML = '';

    if (
      elements.profileProductsEmpty
    ) {
      elements.profileProductsEmpty.hidden =
        false;
    }

    return;
  }

  if (
    elements.profileProductsEmpty
  ) {
    elements.profileProductsEmpty.hidden =
      true;
  }

  root.innerHTML =
    state.products
      .slice(0, 8)
      .map(
        productCardTemplate,
      )
      .join('');

  bindImageFallbacks(root);
}

// ============================================================
// SUPABASE SORĞULARI
// ============================================================

async function loadProfileData() {
  state.profile =
    await requireAuth();

  if (!state.profile) {
    return false;
  }

  const memberId =
    state.profile.id;

  const results =
    await Promise.allSettled([
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
          membership_plans (
            id,
            name,
            price,
            duration_days,
            is_daily
          )
        `)
        .eq(
          'member_id',
          memberId,
        )
        .order(
          'end_date',
          {
            ascending: false,
          },
        ),

      sb
        .from('debt_accounts')
        .select(`
          member_id,
          balance,
          updated_at
        `)
        .eq(
          'member_id',
          memberId,
        )
        .maybeSingle(),

      sb
        .from('debt_transactions')
        .select(`
          id,
          transaction_type,
          amount,
          reference_id,
          note,
          payment_method,
          created_at
        `)
        .eq(
          'member_id',
          memberId,
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        )
        .limit(50),

      sb
        .from('sales')
        .select(`
          id,
          receipt_no,
          subtotal,
          discount_amount,
          total_amount,
          payment_method,
          payment_status,
          notes,
          created_at,
          sale_items (
            id,
            product_name,
            quantity,
            unit_price,
            line_total
          )
        `)
        .eq(
          'member_id',
          memberId,
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        )
        .limit(50),

      sb
        .from('attendance')
        .select(`
          id,
          membership_id,
          attendance_type,
          amount,
          checked_in_at
        `)
        .eq(
          'member_id',
          memberId,
        )
        .order(
          'checked_in_at',
          {
            ascending: false,
          },
        )
        .limit(100),

      sb
        .from('products')
        .select(`
          id,
          name,
          description,
          image_url,
          category,
          sale_mode,
          stock_unit,
          stock_quantity,
          portion_size,
          retail_price,
          portion_price,
          low_stock_threshold,
          is_active,
          show_public
        `)
        .eq('is_active', true)
        .eq('show_public', true)
        .order(
          'name',
          {
            ascending: true,
          },
        ),
    ]);

  const [
    membershipsResult,
    debtAccountResult,
    debtTransactionsResult,
    salesResult,
    attendanceResult,
    productsResult,
  ] = results;

  if (
    membershipsResult.status ===
    'fulfilled' &&
    !membershipsResult.value.error
  ) {
    state.memberships =
      membershipsResult.value.data ??
      [];
  } else {
    reportError(
      membershipsResult.status ===
        'fulfilled'
        ? membershipsResult.value.error
        : membershipsResult.reason,
      'profile-memberships',
    );

    state.memberships = [];
  }

  state.membership =
    getActiveMembership(
      state.memberships,
    );

  if (
    debtAccountResult.status ===
    'fulfilled' &&
    !debtAccountResult.value.error
  ) {
    state.debtAccount =
      debtAccountResult.value.data ??
      null;
  } else {
    reportError(
      debtAccountResult.status ===
        'fulfilled'
        ? debtAccountResult.value.error
        : debtAccountResult.reason,
      'profile-debt-account',
    );

    state.debtAccount = null;
  }

  if (
    debtTransactionsResult.status ===
    'fulfilled' &&
    !debtTransactionsResult.value.error
  ) {
    state.debtTransactions =
      debtTransactionsResult.value.data ??
      [];
  } else {
    reportError(
      debtTransactionsResult.status ===
        'fulfilled'
        ? debtTransactionsResult.value.error
        : debtTransactionsResult.reason,
      'profile-debt-transactions',
    );

    state.debtTransactions = [];
  }

  if (
    salesResult.status ===
    'fulfilled' &&
    !salesResult.value.error
  ) {
    state.sales =
      salesResult.value.data ??
      [];
  } else {
    reportError(
      salesResult.status ===
        'fulfilled'
        ? salesResult.value.error
        : salesResult.reason,
      'profile-sales',
    );

    state.sales = [];
  }

  if (
    attendanceResult.status ===
    'fulfilled' &&
    !attendanceResult.value.error
  ) {
    state.attendance =
      attendanceResult.value.data ??
      [];
  } else {
    reportError(
      attendanceResult.status ===
        'fulfilled'
        ? attendanceResult.value.error
        : attendanceResult.reason,
      'profile-attendance',
    );

    state.attendance = [];
  }

  if (
    productsResult.status ===
    'fulfilled' &&
    !productsResult.value.error
  ) {
    state.products =
      productsResult.value.data ??
      [];
  } else {
    reportError(
      productsResult.status ===
        'fulfilled'
        ? productsResult.value.error
        : productsResult.reason,
      'profile-products',
    );

    state.products = [];
  }

  return true;
}

// ============================================================
// BÜTÜN PROFİLİN RENDERİ
// ============================================================

function renderAll() {
  renderProfileIdentity();
  fillProfileForm();

  renderMembership();
  renderDebt();
  renderStatistics();

  renderSalesHistory();
  renderDebtHistory();
  renderAttendanceHistory();
  renderMembershipHistory();
  renderProfileProducts();

  updateFavoritesCount();
  bindImageFallbacks();
}

// ============================================================
// PROFİLİN YENİLƏNMƏSİ
// ============================================================

async function handleProfileSubmit(
  event,
) {
  event.preventDefault();

  const form =
    event.currentTarget;

  const submitButton =
    elements.saveProfileButton ??
    $('button[type="submit"]', form);

  const formData =
    new FormData(form);

  const fullName =
    String(
      formData.get(
        'full_name',
      ) ?? '',
    ).trim();

  const phone =
    normalizePhone(
      formData.get('phone'),
    );

  const birthDate =
    String(
      formData.get(
        'birth_date',
      ) ?? '',
    ).trim() || null;

  const address =
    String(
      formData.get(
        'address',
      ) ?? '',
    ).trim() || null;

  if (fullName.length < 3) {
    setFormMessage(
      elements.profileMessage,
      'Ad və soyad ən azı 3 simvol olmalıdır.',
      'error',
    );

    return;
  }

  if (
    phone &&
    !isValidPhone(phone)
  ) {
    setFormMessage(
      elements.profileMessage,
      'Telefon nömrəsini +994 formatında daxil edin.',
      'error',
    );

    return;
  }

  setFormMessage(
    elements.profileMessage,
    '',
  );

  setBusy(
    submitButton,
    true,
    'Yadda saxlanılır...',
  );

  let newAvatarUpload = null;

  try {
    let avatarUrl =
      state.profile.avatar_url ??
      null;

    let oldAvatarPath =
      state.profile.avatar_path ??
      null;

    if (state.selectedAvatarFile) {
      newAvatarUpload =
        await uploadAvatar(
          state.selectedAvatarFile,
        );

      avatarUrl =
        newAvatarUpload.publicUrl;
    }

    const updateValues = {
      full_name: fullName,
      phone: phone || null,
      birth_date: birthDate,
      address,
      avatar_url: avatarUrl,
    };

    const {
      data,
      error,
    } = await sb
      .from('profiles')
      .update(updateValues)
      .eq(
        'id',
        state.profile.id,
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (
      newAvatarUpload &&
      oldAvatarPath
    ) {
      try {
        await deleteStorageFile(
          cfg.STORAGE?.avatarsBucket ??
          'avatars',
          oldAvatarPath,
        );
      } catch (deleteError) {
        reportError(
          deleteError,
          'old-avatar-delete',
        );
      }
    }

    state.profile = data;
    state.selectedAvatarFile = null;

    clearProfileCache();

    const avatarInput =
      getProfileFormField(
        'avatar',
      );

    if (avatarInput) {
      avatarInput.value = '';
    }

    if (
      elements.avatarFileName
    ) {
      elements.avatarFileName.textContent =
        'Fayl seçilməyib';
    }

    renderProfileIdentity();
    fillProfileForm();

    setFormMessage(
      elements.profileMessage,
      'Profil məlumatları uğurla yeniləndi.',
      'success',
    );

    toast(
      'Profil yeniləndi.',
      'success',
    );
  } catch (error) {
    reportError(
      error,
      'profile-update',
    );

    if (newAvatarUpload?.path) {
      try {
        await deleteStorageFile(
          cfg.STORAGE?.avatarsBucket ??
          'avatars',
          newAvatarUpload.path,
        );
      } catch {
        // Təmizləmə xətası əsas xətanı əvəz etmir.
      }
    }

    const message =
      getErrorMessage(error);

    setFormMessage(
      elements.profileMessage,
      message,
      'error',
    );

    toast(
      message,
      'error',
    );
  } finally {
    setBusy(
      submitButton,
      false,
    );
  }
}

// ============================================================
// AVATAR SEÇİMİ
// ============================================================

function bindAvatarInput() {
  const input =
    getProfileFormField(
      'avatar',
    );

  if (!input) return;

  input.addEventListener(
    'change',
    () => {
      const file =
        input.files?.[0];

      if (!file) {
        state.selectedAvatarFile =
          null;

        return;
      }

      if (
        ![
          'image/jpeg',
          'image/png',
          'image/webp',
        ].includes(file.type)
      ) {
        input.value = '';

        toast(
          'Yalnız JPG, PNG və WEBP şəkilləri qəbul edilir.',
          'error',
        );

        return;
      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        input.value = '';

        toast(
          'Profil şəkli maksimum 5 MB ola bilər.',
          'error',
        );

        return;
      }

      state.selectedAvatarFile =
        file;

      if (
        elements.avatarFileName
      ) {
        elements.avatarFileName.textContent =
          file.name;
      }

      const previewUrl =
        URL.createObjectURL(file);

      if (elements.avatarPreview) {
        elements.avatarPreview.src =
          previewUrl;

        elements.avatarPreview.onload =
          () => {
            URL.revokeObjectURL(
              previewUrl,
            );
          };
      } else if (elements.avatar) {
        elements.avatar.src =
          previewUrl;

        elements.avatar.onload =
          () => {
            URL.revokeObjectURL(
              previewUrl,
            );
          };
      }
    },
  );
}

// ============================================================
// PROFİL TABLARI
// ============================================================

function activateProfileTab(
  tabName,
) {
  $$('[data-profile-tab]')
    .forEach((button) => {
      const active =
        button.dataset.profileTab ===
        tabName;

      button.classList.toggle(
        'active',
        active,
      );

      button.setAttribute(
        'aria-selected',
        String(active),
      );
    });

  $$('[data-profile-panel]')
    .forEach((panel) => {
      const active =
        panel.dataset.profilePanel ===
        tabName;

      panel.hidden = !active;
      panel.classList.toggle(
        'active',
        active,
      );
    });
}

function bindProfileTabs() {
  $$('[data-profile-tab]')
    .forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          activateProfileTab(
            button.dataset.profileTab,
          );
        },
      );
    });
}

// ============================================================
// SEVİMLİLƏR
// ============================================================

function handleFavorite(
  productId,
) {
  const added =
    toggleFavorite(
      productId,
    );

  renderProfileProducts();
  updateFavoritesCount();

  toast(
    added
      ? 'Məhsul sevimlilərə əlavə edildi.'
      : 'Məhsul sevimlilərdən silindi.',
    added
      ? 'success'
      : 'info',
    2400,
  );
}

// ============================================================
// REALTIME
// ============================================================

function scheduleReload() {
  window.clearTimeout(
    state.reloadTimer,
  );

  state.reloadTimer =
    window.setTimeout(
      async () => {
        try {
          const loaded =
            await loadProfileData();

          if (loaded) {
            renderAll();
          }
        } catch (error) {
          reportError(
            error,
            'profile-realtime-reload',
          );
        }
      },
      300,
    );
}

function initializeRealtime() {
  if (
    !sb ||
    !state.profile
  ) {
    return;
  }

  const memberId =
    state.profile.id;

  const subscriptions = [
    {
      table: 'memberships',
      filter:
        `member_id=eq.${memberId}`,
    },

    {
      table: 'debt_accounts',
      filter:
        `member_id=eq.${memberId}`,
    },

    {
      table: 'debt_transactions',
      filter:
        `member_id=eq.${memberId}`,
    },

    {
      table: 'sales',
      filter:
        `member_id=eq.${memberId}`,
    },

    {
      table: 'attendance',
      filter:
        `member_id=eq.${memberId}`,
    },

    {
      table: 'products',
    },
  ];

  state.realtimeChannels =
    subscriptions
      .map(
        ({
          table,
          filter,
        }) =>
          subscribeToTable({
            table,
            filter,

            channelName:
              `skyfit-profile-${table}-${memberId}`,

            callback:
              scheduleReload,
          }),
      )
      .filter(Boolean);
}

async function destroyRealtime() {
  window.clearTimeout(
    state.reloadTimer,
  );

  await Promise.allSettled(
    state.realtimeChannels.map(
      removeRealtimeChannel,
    ),
  );

  state.realtimeChannels = [];
}

// ============================================================
// EVENT-LƏR
// ============================================================

function bindEvents() {
  elements.profileForm
    ?.addEventListener(
      'submit',
      handleProfileSubmit,
    );

  bindAvatarInput();
  bindProfileTabs();

  document.addEventListener(
    'click',
    async (event) => {
      const favoriteButton =
        event.target.closest(
          '[data-profile-favorite]',
        );

      if (favoriteButton) {
        event.preventDefault();

        handleFavorite(
          favoriteButton.dataset
            .profileFavorite,
        );

        return;
      }

      const resetAvatarButton =
        event.target.closest(
          '[data-reset-profile-avatar]',
        );

      if (resetAvatarButton) {
        const confirmed =
          await confirmAction({
            title:
              'Profil şəklini sil',
            message:
              'Profil şəklini silmək istədiyinizə əminsiniz?',
            confirmLabel:
              'Şəkli sil',
            danger: true,
          });

        if (!confirmed) return;

        try {
          setBusy(
            resetAvatarButton,
            true,
            'Silinir...',
          );

          const {
            data,
            error,
          } = await sb
            .from('profiles')
            .update({
              avatar_url: null,
            })
            .eq(
              'id',
              state.profile.id,
            )
            .select()
            .single();

          if (error) {
            throw error;
          }

          state.profile = data;

          clearProfileCache();
          renderProfileIdentity();

          toast(
            'Profil şəkli silindi.',
            'success',
          );
        } catch (error) {
          toast(
            getErrorMessage(error),
            'error',
          );
        } finally {
          setBusy(
            resetAvatarButton,
            false,
          );
        }
      }
    },
  );

  window.addEventListener(
    'skyfit:favorites-change',
    () => {
      updateFavoritesCount();
      renderProfileProducts();
    },
  );
}

// ============================================================
// PROFİLİN İNİTİ
// ============================================================

async function initializeProfile() {
  layout('profile');
  bindEvents();

  try {
    const loaded =
      await loadProfileData();

    if (!loaded) {
      return;
    }

    renderAll();
    initializeRealtime();
  } catch (error) {
    reportError(
      error,
      'profile-initialize',
    );

    const message =
      getErrorMessage(error);

    toast(
      message,
      'error',
    );

    const main =
      $('.profile-dashboard-section') ??
      $('main');

    if (main) {
      main.innerHTML = `
        <div class="shell section">
          <div class="card">
            <div class="empty-state">
              <h2>
                Profil yüklənmədi
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
        </div>
      `;
    }
  } finally {
    hideLoader(true);
  }
}

if (
  document.readyState ===
  'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      void initializeProfile();
    },
    {
      once: true,
    },
  );
} else {
  void initializeProfile();
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
