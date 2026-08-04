// ============================================================
// SKy Fit Professional — Public Home Page
// Məhsullar, məşqçilər, filtrlər, sevimlilər və Realtime
// ============================================================

import {
  $,
  $$,
  byId,
  sb,
  cfg,
  isConfigured,
  esc,
  money,
  number,
  normalizeText,
  toast,
  layout,
  hideLoader,
  getFavoriteIds,
  toggleFavorite,
  isFavorite,
  subscribeToTable,
  removeRealtimeChannel,
  reportError,
  getErrorMessage,
} from './core.js';

// ============================================================
// SƏHİFƏ VƏ BİZNES MƏLUMATLARI
// ============================================================

const business = cfg.BUSINESS ?? {};

const FALLBACK_IMAGE =
  'assets/img/logo.png';

const state = {
  products: [],
  trainers: [],
  categories: [],
  selectedCategory: 'all',
  search: '',
  productChannel: null,
  trainerChannel: null,
  productReloadTimer: null,
  trainerReloadTimer: null,
};

// ============================================================
// DOM ELEMENTLƏRİ
// ============================================================

const elements = {
  products:
    byId('products'),

  productsEmpty:
    byId('productsEmpty'),

  productsError:
    byId('productsError'),

  productSearch:
    byId('productSearch') ??
    byId('productsSearch'),

  categoryFilters:
    byId('productCategoryFilters') ??
    byId('categoryFilters'),

  productCount:
    byId('publicProductCount') ??
    byId('productCount'),

  trainers:
    byId('trainers'),

  trainersEmpty:
    byId('trainersEmpty'),

  trainerCount:
    byId('publicTrainerCount') ??
    byId('trainerCount'),

  favoritesCount:
    byId('headerFavoritesCount') ??
    byId('favoritesCount'),

  activeMemberCount:
    byId('activeMemberCount'),

  totalProductCount:
    byId('totalProductCount'),

  totalTrainerCount:
    byId('totalTrainerCount'),

  monthlyPlanPrice:
    byId('monthlyPlanPrice'),

  dailyPlanPrice:
    byId('dailyPlanPrice'),
};

// ============================================================
// ÜMUMİ KÖMƏKÇİLƏR
// ============================================================

function debounce(
  callback,
  delay = 180,
) {
  let timer = null;

  return (...args) => {
    window.clearTimeout(timer);

    timer = window.setTimeout(
      () => callback(...args),
      delay,
    );
  };
}

function safeImageUrl(url) {
  const value =
    String(url ?? '').trim();

  return value ||
    FALLBACK_IMAGE;
}

function replaceBrokenImage(
  image,
) {
  if (!image) return;

  image.onerror = null;
  image.src = FALLBACK_IMAGE;
}

function setImageFallbacks(
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
          replaceBrokenImage(image);
        },
      );
    });
}

function formatStockQuantity(product) {
  const quantity =
    Number(
      product.stock_quantity ?? 0,
    );

  if (
    !Number.isFinite(quantity)
  ) {
    return '0';
  }

  return number(quantity, 3);
}

function getProductStockState(
  product,
) {
  const quantity =
    Number(
      product.stock_quantity ?? 0,
    );

  const threshold =
    Number(
      product.low_stock_threshold ?? 0,
    );

  if (quantity <= 0) {
    return {
      key: 'out',
      label: 'Stok bitib',
      className: 'badge danger',
    };
  }

  if (
    threshold > 0 &&
    quantity <= threshold
  ) {
    return {
      key: 'low',
      label: 'Az qalıb',
      className: 'badge warn',
    };
  }

  return {
    key: 'available',
    label: 'Stokda var',
    className: 'badge ok',
  };
}

function getProductPrice(product) {
  if (
    product.sale_mode === 'portion'
  ) {
    return Number(
      product.portion_price ?? 0,
    );
  }

  return Number(
    product.retail_price ?? 0,
  );
}

function getPriceLabel(product) {
  const price =
    getProductPrice(product);

  if (
    product.sale_mode === 'portion'
  ) {
    return `${money(price)} / porsiya`;
  }

  return money(price);
}

function getSaleModeLabel(product) {
  if (
    product.sale_mode !== 'portion'
  ) {
    return (
      product.stock_unit ||
      'ədəd'
    );
  }

  const portionSize =
    Number(
      product.portion_size ?? 0,
    );

  const stockUnit =
    product.stock_unit ||
    'qram';

  return `${number(
    portionSize,
    3,
  )} ${stockUnit} porsiya`;
}

function getAvailablePortions(product) {
  if (
    product.sale_mode !== 'portion'
  ) {
    return null;
  }

  const stock =
    Number(
      product.stock_quantity ?? 0,
    );

  const portion =
    Number(
      product.portion_size ?? 0,
    );

  if (
    stock <= 0 ||
    portion <= 0
  ) {
    return 0;
  }

  return Math.floor(
    stock / portion,
  );
}

function getProductCategory(product) {
  const category =
    String(
      product.category ?? '',
    ).trim();

  return category ||
    'Digər';
}

function buildWhatsAppUrl({
  name,
  price,
  product,
} = {}) {
  const whatsapp =
    String(
      business.whatsapp ??
      business.phone ??
      '994555240160',
    ).replace(/\D/g, '');

  let text =
    `Salam, SKy Fit-də satılan "${name}" məhsulu haqqında məlumat almaq istəyirəm.`;

  if (price) {
    text += ` Qiymət: ${price}.`;
  }

  if (
    product?.sale_mode ===
    'portion'
  ) {
    text += ` Porsiya: ${getSaleModeLabel(
      product,
    )}.`;
  }

  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    text,
  )}`;
}

function updateFavoritesCounter() {
  const count =
    getFavoriteIds().length;

  if (elements.favoritesCount) {
    elements.favoritesCount.textContent =
      String(count);

    elements.favoritesCount.hidden =
      count === 0;
  }

  $$('[data-favorites-count]')
    .forEach((element) => {
      element.textContent =
        String(count);

      element.hidden =
        count === 0;
    });
}

// ============================================================
// MƏHSUL KARTI
// ============================================================

function productCardTemplate(
  product,
) {
  const stock =
    getProductStockState(
      product,
    );

  const favorite =
    isFavorite(product.id);

  const category =
    getProductCategory(product);

  const priceLabel =
    getPriceLabel(product);

  const availablePortions =
    getAvailablePortions(
      product,
    );

  const description =
    String(
      product.description ?? '',
    ).trim();

  const quantityText =
    product.sale_mode === 'portion'
      ? `${formatStockQuantity(
          product,
        )} ${
          product.stock_unit ||
          'qram'
        } qalıb`
      : `${formatStockQuantity(
          product,
        )} ${
          product.stock_unit ||
          'ədəd'
        }`;

  return `
    <article
      class="card product-card neon"
      data-product-card
      data-product-id="${esc(product.id)}"
      data-category="${esc(category)}"
    >
      <button
        class="favorite-button ${
          favorite
            ? 'active'
            : ''
        }"
        type="button"
        data-toggle-favorite="${esc(product.id)}"
        aria-label="${
          favorite
            ? 'Sevimlilərdən sil'
            : 'Sevimlilərə əlavə et'
        }"
        aria-pressed="${String(favorite)}"
        title="${
          favorite
            ? 'Sevimlilərdən sil'
            : 'Sevimlilərə əlavə et'
        }"
      >
        <span aria-hidden="true">
          ${favorite ? '♥' : '♡'}
        </span>
      </button>

      <div class="product-card__media">
        <img
          src="${esc(
            safeImageUrl(
              product.image_url,
            ),
          )}"
          alt="${esc(product.name)}"
          loading="lazy"
          decoding="async"
          data-image-fallback
        >

        <span class="${stock.className} product-stock-badge">
          ${esc(stock.label)}
        </span>

        ${
          product.sale_mode ===
          'portion'
            ? `
              <span class="badge info product-mode-badge">
                Açıq satış
              </span>
            `
            : ''
        }
      </div>

      <div class="product-body">
        <div class="product-category">
          ${esc(category)}
        </div>

        <div class="product-meta">
          <div>
            <h3>
              ${esc(product.name)}
            </h3>

            <p class="muted product-description">
              ${esc(
                description ||
                getSaleModeLabel(
                  product,
                ),
              )}
            </p>
          </div>

          <div class="price">
            ${esc(priceLabel)}
          </div>
        </div>

        <div class="product-stock-details">
          <span>
            Qalıq:
            <strong>
              ${esc(quantityText)}
            </strong>
          </span>

          ${
            availablePortions !==
            null
              ? `
                <span>
                  Təxminən:
                  <strong>
                    ${availablePortions} porsiya
                  </strong>
                </span>
              `
              : ''
          }
        </div>

        <div class="product-card__actions">
          <button
            class="btn btn-outline btn-small"
            type="button"
            data-toggle-favorite="${esc(product.id)}"
          >
            <span aria-hidden="true">
              ${favorite ? '♥' : '♡'}
            </span>

            ${
              favorite
                ? 'Seçilib'
                : 'Sevimli'
            }
          </button>

          <a
            class="btn btn-primary btn-small"
            href="${esc(
              buildWhatsAppUrl({
                name:
                  product.name,
                price:
                  priceLabel,
                product,
              }),
            )}"
            target="_blank"
            rel="noopener noreferrer"
            ${
              stock.key === 'out'
                ? 'aria-disabled="true" tabindex="-1"'
                : ''
            }
          >
            ${
              stock.key === 'out'
                ? 'Stok yoxdur'
                : 'Sifariş et'
            }
          </a>
        </div>
      </div>
    </article>
  `;
}

// ============================================================
// MƏHSULLARIN RENDERİ
// ============================================================

function getFilteredProducts() {
  const search =
    normalizeText(
      state.search,
    );

  return state.products.filter(
    (product) => {
      const category =
        getProductCategory(
          product,
        );

      const categoryMatches =
        state.selectedCategory ===
          'all' ||
        category ===
          state.selectedCategory;

      if (!categoryMatches) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack =
        normalizeText(
          [
            product.name,
            product.description,
            product.category,
            product.sku,
            product.stock_unit,
          ]
            .filter(Boolean)
            .join(' '),
        );

      return haystack.includes(
        search,
      );
    },
  );
}

function renderProducts() {
  const root =
    elements.products;

  if (!root) return;

  const products =
    getFilteredProducts();

  root.setAttribute(
    'aria-busy',
    'false',
  );

  if (elements.productCount) {
    elements.productCount.textContent =
      String(products.length);
  }

  if (
    elements.totalProductCount
  ) {
    elements.totalProductCount.textContent =
      String(
        state.products.length,
      );
  }

  if (!products.length) {
    root.innerHTML = '';

    if (elements.productsEmpty) {
      elements.productsEmpty.hidden =
        false;
    } else {
      root.innerHTML = `
        <div class="empty-state">
          <h3>
            Məhsul tapılmadı
          </h3>

          <p>
            Axtarışı və ya kateqoriya filtrini dəyişin.
          </p>
        </div>
      `;
    }

    return;
  }

  if (elements.productsEmpty) {
    elements.productsEmpty.hidden =
      true;
  }

  root.innerHTML =
    products
      .map(productCardTemplate)
      .join('');

  setImageFallbacks(root);
}

function renderCategoryFilters() {
  const root =
    elements.categoryFilters;

  if (!root) return;

  const categories = [
    'all',
    ...state.categories,
  ];

  root.innerHTML =
    categories
      .map((category) => {
        const label =
          category === 'all'
            ? 'Hamısı'
            : category;

        const active =
          state.selectedCategory ===
          category;

        return `
          <button
            class="filter-chip ${
              active
                ? 'active'
                : ''
            }"
            type="button"
            data-product-category="${esc(category)}"
            aria-pressed="${String(active)}"
          >
            ${esc(label)}
          </button>
        `;
      })
      .join('');
}

function rebuildCategories() {
  state.categories = [
    ...new Set(
      state.products
        .map(
          getProductCategory,
        )
        .filter(Boolean),
    ),
  ].sort((a, b) =>
    a.localeCompare(
      b,
      'az',
      {
        sensitivity: 'base',
      },
    ),
  );

  if (
    state.selectedCategory !==
      'all' &&
    !state.categories.includes(
      state.selectedCategory,
    )
  ) {
    state.selectedCategory =
      'all';
  }

  renderCategoryFilters();
}

// ============================================================
// MƏHSULLARIN SUPABASE-DƏN YÜKLƏNMƏSİ
// ============================================================

async function loadProducts({
  silent = false,
} = {}) {
  const root =
    elements.products;

  if (!root) return;

  if (!isConfigured || !sb) {
    root.setAttribute(
      'aria-busy',
      'false',
    );

    root.innerHTML = `
      <div class="empty-state">
        <h3>
          Supabase bağlantısı qurulmayıb
        </h3>

        <p>
          js/config.js faylında Supabase URL və anon key məlumatlarını yoxlayın.
        </p>

        <a
          class="btn btn-primary"
          href="setup.html"
        >
          Quraşdırmaya bax
        </a>
      </div>
    `;

    return;
  }

  if (!silent) {
    root.setAttribute(
      'aria-busy',
      'true',
    );
  }

  try {
    const {
      data,
      error,
    } = await sb
      .from('products')
      .select(`
        id,
        name,
        description,
        sku,
        image_url,
        category,
        sale_mode,
        stock_unit,
        stock_quantity,
        portion_size,
        retail_price,
        portion_price,
        low_stock_threshold,
        show_public,
        is_active,
        updated_at
      `)
      .eq('is_active', true)
      .eq('show_public', true)
      .order('name', {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    state.products =
      Array.isArray(data)
        ? data
        : [];

    rebuildCategories();
    renderProducts();

    window.dispatchEvent(
      new CustomEvent(
        'skyfit:products-loaded',
        {
          detail: {
            products:
              state.products,
          },
        },
      ),
    );
  } catch (error) {
    reportError(
      error,
      'loadProducts',
    );

    root.setAttribute(
      'aria-busy',
      'false',
    );

    root.innerHTML = `
      <div class="empty-state">
        <h3>
          Məhsullar yüklənmədi
        </h3>

        <p>
          ${esc(
            getErrorMessage(
              error,
            ),
          )}
        </p>

        <button
          class="btn btn-outline"
          type="button"
          data-retry-products
        >
          Yenidən yoxla
        </button>
      </div>
    `;
  }
}

// ============================================================
// MƏŞQÇİ KARTI
// ============================================================

function trainerCardTemplate(
  trainer,
) {
  const instagram =
    String(
      trainer.instagram_url ??
      '',
    ).trim();

  const phone =
    String(
      trainer.phone ??
      business.phone ??
      '',
    ).trim();

  return `
    <article
      class="card trainer-card neon"
      data-trainer-id="${esc(trainer.id)}"
    >
      <div class="trainer-card__media">
        <img
          src="${esc(
            safeImageUrl(
              trainer.image_url,
            ),
          )}"
          alt="${esc(trainer.full_name)}"
          loading="lazy"
          decoding="async"
          data-image-fallback
        >

        <div class="trainer-card__overlay">
          <span class="badge warn">
            Peşəkar məşqçi
          </span>
        </div>
      </div>

      <div class="trainer-card__body">
        <span class="section-kicker">
          ${esc(
            trainer.specialty ||
            'Fitnes məşqçisi',
          )}
        </span>

        <h3>
          ${esc(trainer.full_name)}
        </h3>

        ${
          trainer.bio
            ? `
              <p>
                ${esc(trainer.bio)}
              </p>
            `
            : `
              <p>
                Məqsədinizə uyğun məşq proqramı və peşəkar nəzarət.
              </p>
            `
        }

        <div class="trainer-card__actions">
          ${
            phone
              ? `
                <a
                  class="btn btn-outline btn-small"
                  href="tel:${esc(
                    phone.replace(
                      /\s/g,
                      '',
                    ),
                  )}"
                >
                  Əlaqə
                </a>
              `
              : ''
          }

          ${
            instagram
              ? `
                <a
                  class="btn btn-primary btn-small"
                  href="${esc(instagram)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              `
              : `
                <a
                  class="btn btn-primary btn-small"
                  href="${esc(
                    buildWhatsAppUrl({
                      name:
                        trainer.full_name,
                    }),
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Yazıl
                </a>
              `
          }
        </div>
      </div>
    </article>
  `;
}

// ============================================================
// MƏŞQÇİ RENDERİ VƏ YÜKLƏNMƏSİ
// ============================================================

function renderTrainers() {
  const root =
    elements.trainers;

  if (!root) return;

  root.setAttribute(
    'aria-busy',
    'false',
  );

  if (
    elements.trainerCount
  ) {
    elements.trainerCount.textContent =
      String(
        state.trainers.length,
      );
  }

  if (
    elements.totalTrainerCount
  ) {
    elements.totalTrainerCount.textContent =
      String(
        state.trainers.length,
      );
  }

  if (!state.trainers.length) {
    root.innerHTML = '';

    if (elements.trainersEmpty) {
      elements.trainersEmpty.hidden =
        false;
    } else {
      root.innerHTML = `
        <div class="empty-state">
          <h3>
            Məşqçi əlavə edilməyib
          </h3>

          <p>
            Məşqçi məlumatları admin paneldən əlavə olunduqda burada görünəcək.
          </p>
        </div>
      `;
    }

    return;
  }

  if (elements.trainersEmpty) {
    elements.trainersEmpty.hidden =
      true;
  }

  root.innerHTML =
    state.trainers
      .map(
        trainerCardTemplate,
      )
      .join('');

  setImageFallbacks(root);
}

async function loadTrainers({
  silent = false,
} = {}) {
  const root =
    elements.trainers;

  if (!root || !sb) {
    if (root) {
      root.innerHTML = `
        <div class="empty-state">
          <h3>
            Məşqçi məlumatı yoxdur
          </h3>
        </div>
      `;
    }

    return;
  }

  if (!silent) {
    root.setAttribute(
      'aria-busy',
      'true',
    );
  }

  try {
    const {
      data,
      error,
    } = await sb
      .from('trainers')
      .select(`
        id,
        full_name,
        specialty,
        bio,
        image_url,
        phone,
        instagram_url,
        sort_order,
        is_active
      `)
      .eq('is_active', true)
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
      Array.isArray(data)
        ? data
        : [];

    renderTrainers();
  } catch (error) {
    reportError(
      error,
      'loadTrainers',
    );

    root.setAttribute(
      'aria-busy',
      'false',
    );

    root.innerHTML = `
      <div class="empty-state">
        <h3>
          Məşqçilər yüklənmədi
        </h3>

        <p>
          ${esc(
            getErrorMessage(error),
          )}
        </p>
      </div>
    `;
  }
}

// ============================================================
// ÜZVLÜK QİYMƏTLƏRİ
// ============================================================

async function loadMembershipPlans() {
  if (!sb) return;

  try {
    const {
      data,
      error,
    } = await sb
      .from('membership_plans')
      .select(`
        id,
        name,
        price,
        duration_days,
        is_daily,
        is_active
      `)
      .eq('is_active', true)
      .order('duration_days', {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    const plans =
      Array.isArray(data)
        ? data
        : [];

    const dailyPlan =
      plans.find(
        (plan) =>
          plan.is_daily ||
          Number(
            plan.duration_days,
          ) === 1,
      );

    const monthlyPlan =
      plans.find(
        (plan) =>
          !plan.is_daily &&
          Number(
            plan.duration_days,
          ) >= 28,
      );

    if (
      elements.dailyPlanPrice &&
      dailyPlan
    ) {
      elements.dailyPlanPrice.textContent =
        money(dailyPlan.price);
    }

    if (
      elements.monthlyPlanPrice &&
      monthlyPlan
    ) {
      elements.monthlyPlanPrice.textContent =
        money(
          monthlyPlan.price,
        );
    }

    $$('[data-plan="daily"]')
      .forEach((element) => {
        if (dailyPlan) {
          element.textContent =
            money(
              dailyPlan.price,
            );
        }
      });

    $$('[data-plan="monthly"]')
      .forEach((element) => {
        if (monthlyPlan) {
          element.textContent =
            money(
              monthlyPlan.price,
            );
        }
      });
  } catch (error) {
    reportError(
      error,
      'loadMembershipPlans',
    );
  }
}

// ============================================================
// İCTİMAİ STATİSTİKA
// ============================================================

async function loadPublicStatistics() {
  if (!sb) return;

  try {
    const promises = [];

    if (
      elements.activeMemberCount
    ) {
      promises.push(
        sb
          .from('memberships')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('status', 'active')
          .gte(
            'end_date',
            new Date()
              .toISOString()
              .slice(0, 10),
          ),
      );
    }

    const results =
      await Promise.allSettled(
        promises,
      );

    if (
      elements.activeMemberCount &&
      results[0]?.status ===
        'fulfilled'
    ) {
      const count =
        results[0].value.count ??
        0;

      elements.activeMemberCount.textContent =
        String(count);
    }
  } catch (error) {
    // İctimai statistika RLS tərəfindən bağlı ola bilər.
    // Bu əsas səhifənin işini dayandırmır.
    reportError(
      error,
      'loadPublicStatistics',
    );
  }
}

// ============================================================
// EVENT-LƏR
// ============================================================

function handleFavoriteToggle(
  productId,
) {
  const added =
    toggleFavorite(productId);

  updateFavoritesCounter();
  renderProducts();

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

function bindProductEvents() {
  elements.productSearch
    ?.addEventListener(
      'input',
      debounce((event) => {
        state.search =
          event.target.value;

        renderProducts();
      }),
    );

  document.addEventListener(
    'click',
    (event) => {
      const favoriteButton =
        event.target.closest(
          '[data-toggle-favorite]',
        );

      if (favoriteButton) {
        event.preventDefault();

        const productId =
          favoriteButton.dataset
            .toggleFavorite;

        if (productId) {
          handleFavoriteToggle(
            productId,
          );
        }

        return;
      }

      const categoryButton =
        event.target.closest(
          '[data-product-category]',
        );

      if (categoryButton) {
        state.selectedCategory =
          categoryButton.dataset
            .productCategory ||
          'all';

        renderCategoryFilters();
        renderProducts();

        return;
      }

      const retryButton =
        event.target.closest(
          '[data-retry-products]',
        );

      if (retryButton) {
        void loadProducts();
      }
    },
  );

  window.addEventListener(
    'skyfit:favorites-change',
    () => {
      updateFavoritesCounter();
      renderProducts();
    },
  );

  window.addEventListener(
    'storage',
    (event) => {
      if (
        event.key ===
          'skyfit_favorite_products' ||
        event.key ===
          'skyfit_favs'
      ) {
        updateFavoritesCounter();
        renderProducts();
      }
    },
  );
}

// ============================================================
// REALTIME
// ============================================================

function scheduleProductReload() {
  window.clearTimeout(
    state.productReloadTimer,
  );

  state.productReloadTimer =
    window.setTimeout(
      () => {
        void loadProducts({
          silent: true,
        });
      },
      220,
    );
}

function scheduleTrainerReload() {
  window.clearTimeout(
    state.trainerReloadTimer,
  );

  state.trainerReloadTimer =
    window.setTimeout(
      () => {
        void loadTrainers({
          silent: true,
        });
      },
      220,
    );
}

function initializeRealtime() {
  if (!sb) return;

  state.productChannel =
    subscribeToTable({
      table: 'products',

      channelName:
        'skyfit-public-products',

      callback:
        scheduleProductReload,

      onStatus(status) {
        document.body.dataset
          .productsRealtime =
          status;
      },
    });

  state.trainerChannel =
    subscribeToTable({
      table: 'trainers',

      channelName:
        'skyfit-public-trainers',

      callback:
        scheduleTrainerReload,

      onStatus(status) {
        document.body.dataset
          .trainersRealtime =
          status;
      },
    });
}

async function destroyRealtime() {
  window.clearTimeout(
    state.productReloadTimer,
  );

  window.clearTimeout(
    state.trainerReloadTimer,
  );

  await Promise.allSettled([
    removeRealtimeChannel(
      state.productChannel,
    ),

    removeRealtimeChannel(
      state.trainerChannel,
    ),
  ]);
}

// ============================================================
// KÖHNƏ LOCALSTORAGE AÇARININ MİQRASİYASI
// ============================================================

function migrateLegacyFavorites() {
  const legacyKey =
    'skyfit_favs';

  const newKey =
    'skyfit_favorite_products';

  if (
    localStorage.getItem(
      newKey,
    )
  ) {
    return;
  }

  try {
    const legacy =
      JSON.parse(
        localStorage.getItem(
          legacyKey,
        ) ?? '[]',
      );

    if (Array.isArray(legacy)) {
      localStorage.setItem(
        newKey,
        JSON.stringify(
          [
            ...new Set(
              legacy
                .filter(Boolean)
                .map(String),
            ),
          ],
        ),
      );
    }
  } catch {
    // Köhnə məlumat pozulubsa nəzərə alınmır.
  }
}

// ============================================================
// ANA SƏHİFƏNİN İNİTİ
// ============================================================

async function initializeHomePage() {
  layout('home');

  migrateLegacyFavorites();
  updateFavoritesCounter();
  bindProductEvents();

  const tasks = [
    loadProducts(),
    loadTrainers(),
    loadMembershipPlans(),
    loadPublicStatistics(),
  ];

  await Promise.allSettled(
    tasks,
  );

  initializeRealtime();
  setImageFallbacks();

  hideLoader(true);
}

if (
  document.readyState ===
  'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      void initializeHomePage();
    },
    {
      once: true,
    },
  );
} else {
  void initializeHomePage();
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
