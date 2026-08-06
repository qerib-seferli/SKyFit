// ============================================================
// SKy Fit Professional — Favorites Module
// Sevimli məhsullar, axtarış, silmə və Supabase Realtime
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
  layout,
  toast,
  setBusy,
  getErrorMessage,
  reportError,
  getFavoriteIds,
  saveFavoriteIds,
  toggleFavorite,
  isFavorite,
  subscribeToTable,
  removeRealtimeChannel,
  openModal,
  closeModal,
  hideLoader,
} from './core.js';

// ============================================================
// SABİTLƏR
// ============================================================

const FALLBACK_IMAGE =
  'assets/img/logo.png';

const business =
  cfg.BUSINESS ?? {};

const state = {
  favoriteIds: [],
  products: [],
  search: '',
  realtimeChannel: null,
  reloadTimer: null,
};

// ============================================================
// DOM ELEMENTLƏRİ
// ============================================================

const elements = {
  favorites:
    byId('favorites'),

  favoritesCount:
    byId('favoritesCount'),

  search:
    byId('favoritesSearch'),

  clearButton:
    byId('clearFavoritesButton'),

  empty:
    byId('favoritesEmpty'),

  searchEmpty:
    byId('favoritesSearchEmpty'),

  clearModal:
    byId('clearFavoritesModal'),

  cancelClearButton:
    byId('cancelClearFavoritesButton'),

  confirmClearButton:
    byId('confirmClearFavoritesButton'),
};

// ============================================================
// KÖMƏKÇİ FUNKSİYALAR
// ============================================================

function safeImageUrl(value) {
  const url =
    String(value ?? '').trim();

  return url || FALLBACK_IMAGE;
}

function bindImageFallbacks(
  root = document,
) {
  $$(
    'img[data-image-fallback]',
    root,
  ).forEach((image) => {
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
        image.src = FALLBACK_IMAGE;
      },
    );
  });
}

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

function getProductPrice(product) {
  if (
    product.sale_mode ===
    'portion'
  ) {
    return Number(
      product.portion_price ?? 0,
    );
  }

  return Number(
    product.retail_price ?? 0,
  );
}

function getProductPriceLabel(
  product,
) {
  const price =
    money(
      getProductPrice(product),
    );

  if (
    product.sale_mode ===
    'portion'
  ) {
    return `${price} / porsiya`;
  }

  return price;
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

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return {
      key: 'out',
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
      key: 'low',
      label: 'Az qalıb',
      className: 'badge warn',
      available: true,
    };
  }

  return {
    key: 'available',
    label: 'Stokda var',
    className: 'badge ok',
    available: true,
  };
}

function getProductCategory(
  product,
) {
  const category =
    String(
      product.category ?? '',
    ).trim();

  return category || 'Digər';
}

function getProductUnitText(
  product,
) {
  if (
    product.sale_mode ===
    'portion'
  ) {
    return `${number(
      product.portion_size ?? 0,
      3,
    )} ${
      product.stock_unit ||
      'qram'
    } porsiya`;
  }

  return (
    product.stock_unit ||
    'ədəd'
  );
}

function getStockText(product) {
  const quantity =
    Number(
      product.stock_quantity ?? 0,
    );

  const safeQuantity =
    Number.isFinite(quantity)
      ? quantity
      : 0;

  return `${number(
    safeQuantity,
    3,
  )} ${
    product.stock_unit ||
    'ədəd'
  }`;
}

function getAvailablePortions(
  product,
) {
  if (
    product.sale_mode !==
    'portion'
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
    !Number.isFinite(stock) ||
    !Number.isFinite(portion) ||
    stock <= 0 ||
    portion <= 0
  ) {
    return 0;
  }

  return Math.floor(
    stock / portion,
  );
}

function getWhatsAppUrl(product) {
  const whatsapp =
    String(
      business.whatsapp ??
      business.phone ??
      '994555240160',
    ).replace(/\D/g, '');

  const priceLabel =
    getProductPriceLabel(product);

  let message =
    `Salam, SKy Fit-də satılan "${product.name}" məhsulunu sifariş etmək istəyirəm. Qiymət: ${priceLabel}.`;

  if (
    product.sale_mode ===
    'portion'
  ) {
    message +=
      ` Porsiya ölçüsü: ${getProductUnitText(product)}.`;
  }

  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    message,
  )}`;
}

function migrateLegacyFavorites() {
  const oldKey =
    'skyfit_favs';

  const newKey =
    'skyfit_favorite_products';

  if (
    localStorage.getItem(newKey)
  ) {
    return;
  }

  try {
    const legacyIds =
      JSON.parse(
        localStorage.getItem(
          oldKey,
        ) ?? '[]',
      );

    if (
      Array.isArray(legacyIds)
    ) {
      saveFavoriteIds(
        legacyIds
          .filter(Boolean)
          .map(String),
      );
    }
  } catch (error) {
    reportError(
      error,
      'favorites-legacy-migration',
    );
  }
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

  const category =
    getProductCategory(product);

  const priceLabel =
    getProductPriceLabel(
      product,
    );

  const availablePortions =
    getAvailablePortions(
      product,
    );

  const description =
    String(
      product.description ?? '',
    ).trim();

  return `
    <article
      class="card product-card neon"
      data-favorite-product="${esc(
        product.id,
      )}"
    >
      <button
        class="favorite-button active"
        type="button"
        data-remove-favorite="${esc(
          product.id,
        )}"
        aria-label="${esc(
          product.name,
        )} məhsulunu sevimlilərdən sil"
        aria-pressed="true"
        title="Sevimlilərdən sil"
      >
        <span aria-hidden="true">
          ♥
        </span>
      </button>

      <div class="product-card__media">
        <img
          src="${esc(
            safeImageUrl(
              product.image_url,
            ),
          )}"
          alt="${esc(
            product.name,
          )}"
          loading="lazy"
          decoding="async"
          data-image-fallback
        >

        <span
          class="${stock.className} product-stock-badge"
        >
          ${esc(stock.label)}
        </span>

        ${
          product.sale_mode ===
          'portion'
            ? `
              <span
                class="badge info product-mode-badge"
              >
                Açıq satış
              </span>
            `
            : ''
        }
      </div>

      <div class="product-body">
        <span class="section-kicker">
          ${esc(category)}
        </span>

        <div class="product-meta">
          <div>
            <h3>
              ${esc(
                product.name,
              )}
            </h3>

            <p class="muted product-description">
              ${esc(
                description ||
                getProductUnitText(
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
              ${esc(
                getStockText(
                  product,
                ),
              )}
            </strong>
          </span>

          ${
            availablePortions !==
            null
              ? `
                <span>
                  Təxminən:
                  <strong>
                    ${availablePortions}
                    porsiya
                  </strong>
                </span>
              `
              : ''
          }
        </div>

        <div class="product-card__actions">
          <button
            class="btn btn-danger btn-small"
            type="button"
            data-remove-favorite="${esc(
              product.id,
            )}"
          >
            <span aria-hidden="true">
              ×
            </span>

            Sil
          </button>

          <a
            class="btn btn-primary btn-small"
            href="${esc(
              getWhatsAppUrl(
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

// ============================================================
// FİLTRLƏMƏ
// ============================================================

function getFilteredProducts() {
  const search =
    normalizeText(
      state.search,
    );

  if (!search) {
    return state.products;
  }

  return state.products.filter(
    (product) => {
      const searchText =
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

      return searchText.includes(
        search,
      );
    },
  );
}

// ============================================================
// SAYĞAC VƏ DÜYMƏLƏR
// ============================================================

function updateSummary() {
  const count =
    state.favoriteIds.length;

  if (
    elements.favoritesCount
  ) {
    elements.favoritesCount.textContent =
      String(count);
  }

  if (
    elements.clearButton
  ) {
    elements.clearButton.disabled =
      count === 0;
  }

  $$(
    '[data-favorites-count]',
  ).forEach((element) => {
    element.textContent =
      String(count);

    element.hidden =
      count === 0;
  });
}

// ============================================================
// RENDER
// ============================================================

function renderFavorites() {
  const root =
    elements.favorites;

  if (!root) return;

  const products =
    getFilteredProducts();

  root.setAttribute(
    'aria-busy',
    'false',
  );

  updateSummary();

  if (
    state.favoriteIds.length ===
    0
  ) {
    root.innerHTML = '';

    if (elements.empty) {
      elements.empty.hidden =
        false;
    }

    if (
      elements.searchEmpty
    ) {
      elements.searchEmpty.hidden =
        true;
    }

    return;
  }

  if (elements.empty) {
    elements.empty.hidden = true;
  }

  if (!products.length) {
    root.innerHTML = '';

    if (
      elements.searchEmpty
    ) {
      elements.searchEmpty.hidden =
        false;
    }

    return;
  }

  if (
    elements.searchEmpty
  ) {
    elements.searchEmpty.hidden =
      true;
  }

  root.innerHTML =
    products
      .map(
        productCardTemplate,
      )
      .join('');

  bindImageFallbacks(root);
}

// ============================================================
// SUPABASE-DƏN MƏHSULLARIN ALINMASI
// ============================================================

async function loadFavorites({
  silent = false,
} = {}) {
  const root =
    elements.favorites;

  if (!root) return;

  state.favoriteIds =
    getFavoriteIds()
      .map(String);

  updateSummary();

  if (
    state.favoriteIds.length ===
    0
  ) {
    state.products = [];

    renderFavorites();

    return;
  }

  if (
    !isConfigured ||
    !sb
  ) {
    root.setAttribute(
      'aria-busy',
      'false',
    );

    root.innerHTML = `
      <div class="empty-state">
        <h3>Məlumatlar yüklənə bilmir</h3>
        <p>Bir qədər sonra səhifəni yenidən yoxlayın.</p>
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
      .in(
        'id',
        state.favoriteIds,
      )
      .eq(
        'is_active',
        true,
      )
      .eq(
        'show_public',
        true,
      );

    if (error) {
      throw error;
    }

    const productsById =
      new Map(
        (data ?? []).map(
          (product) => [
            String(product.id),
            product,
          ],
        ),
      );

    // Sevimlilərin istifadəçinin seçdiyi sırada qalması.
    state.products =
      state.favoriteIds
        .map(
          (id) =>
            productsById.get(id),
        )
        .filter(Boolean);

    // Bazadan silinmiş və ya deaktiv edilmiş məhsul ID-lərini təmizlə.
    const validIds =
      state.products.map(
        (product) =>
          String(product.id),
      );

    if (
      validIds.length !==
      state.favoriteIds.length
    ) {
      state.favoriteIds =
        saveFavoriteIds(
          validIds,
        );
    }

    renderFavorites();
  } catch (error) {
    reportError(
      error,
      'load-favorites',
    );

    root.setAttribute(
      'aria-busy',
      'false',
    );

    root.innerHTML = `
      <div class="empty-state">
        <h3>
          Sevimlilər yüklənmədi
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
          data-retry-favorites
        >
          Yenidən yoxla
        </button>
      </div>
    `;
  }
}

// ============================================================
// TƏK MƏHSULUN SİLİNMƏSİ
// ============================================================

function removeFavorite(
  productId,
) {
  const id =
    String(productId);

  if (!isFavorite(id)) {
    return;
  }

  toggleFavorite(id);

  state.favoriteIds =
    getFavoriteIds()
      .map(String);

  state.products =
    state.products.filter(
      (product) =>
        String(product.id) !== id,
    );

  renderFavorites();

  toast(
    'Məhsul sevimlilərdən silindi.',
    'info',
    2500,
  );
}

// ============================================================
// BÜTÜN SEVİMLİLƏRİN SİLİNMƏSİ
// ============================================================

function openClearFavoritesModal() {
  if (
    state.favoriteIds.length ===
    0
  ) {
    return;
  }

  if (
    elements.clearModal
  ) {
    openModal(
      elements.clearModal,
    );

    return;
  }

  const confirmed =
    window.confirm(
      'Bütün sevimli məhsulları silmək istəyirsiniz?',
    );

  if (confirmed) {
    clearAllFavorites();
  }
}

function clearAllFavorites() {
  state.favoriteIds =
    saveFavoriteIds([]);

  state.products = [];
  state.search = '';

  if (elements.search) {
    elements.search.value = '';
  }

  renderFavorites();

  if (
    elements.clearModal
  ) {
    closeModal(
      elements.clearModal,
    );
  }

  toast(
    'Bütün sevimlilər silindi.',
    'success',
    2500,
  );
}

async function handleClearAll() {
  const button =
    elements.confirmClearButton;

  setBusy(
    button,
    true,
    'Silinir...',
  );

  try {
    clearAllFavorites();
  } finally {
    setBusy(
      button,
      false,
    );
  }
}

// ============================================================
// EVENT-LƏR
// ============================================================

function bindEvents() {
  elements.search
    ?.addEventListener(
      'input',
      debounce((event) => {
        state.search =
          event.target.value;

        renderFavorites();
      }),
    );

  elements.clearButton
    ?.addEventListener(
      'click',
      openClearFavoritesModal,
    );

  elements.cancelClearButton
    ?.addEventListener(
      'click',
      () => {
        if (
          elements.clearModal
        ) {
          closeModal(
            elements.clearModal,
          );
        }
      },
    );

  elements.confirmClearButton
    ?.addEventListener(
      'click',
      handleClearAll,
    );

  document.addEventListener(
    'click',
    (event) => {
      const removeButton =
        event.target.closest(
          '[data-remove-favorite]',
        );

      if (removeButton) {
        event.preventDefault();

        const productId =
          removeButton.dataset
            .removeFavorite;

        if (productId) {
          removeFavorite(
            productId,
          );
        }

        return;
      }

      const retryButton =
        event.target.closest(
          '[data-retry-favorites]',
        );

      if (retryButton) {
        void loadFavorites();
      }
    },
  );

  window.addEventListener(
    'skyfit:favorites-change',
    () => {
      state.favoriteIds =
        getFavoriteIds()
          .map(String);

      void loadFavorites({
        silent: true,
      });
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
        void loadFavorites({
          silent: true,
        });
      }
    },
  );
}

// ============================================================
// REALTIME
// ============================================================

function scheduleRealtimeReload() {
  window.clearTimeout(
    state.reloadTimer,
  );

  state.reloadTimer =
    window.setTimeout(
      () => {
        void loadFavorites({
          silent: true,
        });
      },
      250,
    );
}

function initializeRealtime() {
  if (!sb) return;

  state.realtimeChannel =
    subscribeToTable({
      table: 'products',

      channelName:
        'skyfit-favorites-products',

      callback:
        scheduleRealtimeReload,

      onStatus(status) {
        document.body.dataset
          .favoritesRealtime =
          status;
      },
    });
}

async function destroyRealtime() {
  window.clearTimeout(
    state.reloadTimer,
  );

  if (
    state.realtimeChannel
  ) {
    await removeRealtimeChannel(
      state.realtimeChannel,
    );

    state.realtimeChannel =
      null;
  }
}

// ============================================================
// İNİT
// ============================================================

async function initializeFavoritesPage() {
  layout('favorites');

  migrateLegacyFavorites();
  bindEvents();

  try {
    await loadFavorites();
    initializeRealtime();
  } catch (error) {
    reportError(
      error,
      'favorites-initialize',
    );

    toast(
      getErrorMessage(error),
      'error',
    );
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
      void initializeFavoritesPage();
    },
    {
      once: true,
    },
  );
} else {
  void initializeFavoritesPage();
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
