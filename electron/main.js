// ============================================================
// SKy Fit Professional — Electron Main Process
// ============================================================

const {
  app,
  BrowserWindow,
  shell,
  session,
} = require('electron');

const path = require('node:path');

const APP_URL =
  'https://qerib-seferli.github.io/SKyFit/index.html';

const ALLOWED_ORIGIN =
  'https://qerib-seferli.github.io';

const ALLOWED_APP_PATH =
  '/SKyFit/';

let mainWindow = null;

// ============================================================
// URL TƏHLÜKƏSİZLİYİ
// ============================================================

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isInternalAppUrl(value) {
  const parsed = parseUrl(value);

  if (!parsed) {
    return false;
  }

  return (
    parsed.origin === ALLOWED_ORIGIN &&
    parsed.pathname.startsWith(
      ALLOWED_APP_PATH,
    )
  );
}

function isAllowedExternalUrl(value) {
  const parsed = parseUrl(value);

  if (!parsed) {
    return false;
  }

  return [
    'https:',
    'http:',
    'mailto:',
    'tel:',
  ].includes(parsed.protocol);
}

async function openExternalSafely(value) {
  if (!isAllowedExternalUrl(value)) {
    return;
  }

  await shell.openExternal(value);
}

// ============================================================
// PƏNCƏRƏ
// ============================================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,

    minWidth: 940,
    minHeight: 640,

    show: false,

    title: 'SKy Fit',

    backgroundColor: '#05070b',

    autoHideMenuBar: true,

    icon: path.join(
      __dirname,
      '..',
      'assets',
      'img',
      'icon.ico',
    ),

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,

      webSecurity: true,
      allowRunningInsecureContent: false,

      spellcheck: false,

      devTools:
        !app.isPackaged,
    },
  });

  mainWindow.once(
    'ready-to-show',
    () => {
      mainWindow?.show();

      if (
        !app.isPackaged &&
        process.env.SKYFIT_DEVTOOLS ===
          'true'
      ) {
        mainWindow?.webContents
          .openDevTools({
            mode: 'detach',
          });
      }
    },
  );

  // target="_blank" olan daxili linklər proqram daxilində,
  // xarici linklər sistem brauzerində açılır.
  mainWindow.webContents.setWindowOpenHandler(
    ({ url }) => {
      if (isInternalAppUrl(url)) {
        mainWindow?.loadURL(url);

        return {
          action: 'deny',
        };
      }

      void openExternalSafely(url);

      return {
        action: 'deny',
      };
    },
  );

  // Tətbiqin GitHub Pages sahəsindən çıxmasına icazə verilmir.
  mainWindow.webContents.on(
    'will-navigate',
    (event, url) => {
      if (isInternalAppUrl(url)) {
        return;
      }

      event.preventDefault();

      void openExternalSafely(url);
    },
  );

  // Yeni pəncərə və popup qarşısı.
  mainWindow.webContents.on(
    'will-redirect',
    (event, url) => {
      const parsed = parseUrl(url);

      if (!parsed) {
        event.preventDefault();

        return;
      }

      // Supabase Auth redirect-ləri və tətbiqin öz URL-si keçə bilər.
      const allowed =
        isInternalAppUrl(url) ||
        parsed.hostname.endsWith(
          '.supabase.co',
        );

      if (!allowed) {
        event.preventDefault();

        void openExternalSafely(url);
      }
    },
  );

  mainWindow.webContents.on(
    'render-process-gone',
    (_event, details) => {
      console.error(
        '[SKy Fit] Renderer dayandı:',
        details,
      );
    },
  );

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  void mainWindow
    .loadURL(APP_URL)
    .catch((error) => {
      console.error(
        '[SKy Fit] Sayt açıla bilmədi:',
        error,
      );

      const offlineHtml = `
        <!doctype html>
        <html lang="az">
          <head>
            <meta charset="UTF-8">
            <meta
              name="viewport"
              content="width=device-width,initial-scale=1"
            >
            <title>SKy Fit</title>

            <style>
              :root {
                color-scheme: dark;
              }

              * {
                box-sizing: border-box;
              }

              body {
                min-height: 100vh;
                margin: 0;
                display: grid;
                place-items: center;
                padding: 24px;
                background:
                  radial-gradient(
                    circle at top,
                    #1c2230,
                    #05070b 65%
                  );
                color: #f8fafc;
                font-family:
                  Arial,
                  sans-serif;
                text-align: center;
              }

              .card {
                width: min(460px, 100%);
                padding: 28px;
                border:
                  1px solid
                  rgba(255, 222, 0, .35);
                border-radius: 24px;
                background:
                  rgba(13, 18, 29, .94);
                box-shadow:
                  0 0 40px
                  rgba(255, 222, 0, .12);
              }

              h1 {
                margin: 0 0 12px;
                color: #ffde00;
              }

              p {
                color: #a7b0c0;
                line-height: 1.7;
              }

              button {
                min-height: 44px;
                padding: 10px 18px;
                border: 0;
                border-radius: 12px;
                background: #ffde00;
                color: #050505;
                font-weight: 800;
                cursor: pointer;
              }
            </style>
          </head>

          <body>
            <main class="card">
              <h1>SKy Fit</h1>

              <p>
                Tətbiq internet bağlantısı olmadığı üçün
                serverə qoşula bilmədi.
              </p>

              <button onclick="location.reload()">
                Yenidən yoxla
              </button>
            </main>
          </body>
        </html>
      `;

      return mainWindow?.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(
          offlineHtml,
        )}`,
      );
    });
}

// ============================================================
// İCAZƏTLƏR
// ============================================================

function configurePermissions() {
  session.defaultSession
    .setPermissionRequestHandler(
      (webContents, permission, callback) => {
        const parsed =
          parseUrl(
            webContents.getURL(),
          );

        const trusted =
          parsed &&
          parsed.origin ===
            ALLOWED_ORIGIN;

        // Hazırda kamera, mikrofon və geolocation tələb edilmir.
        const allowedPermissions =
          new Set([
            'notifications',
          ]);

        callback(
          Boolean(
            trusted &&
            allowedPermissions.has(
              permission,
            ),
          ),
        );
      },
    );
}

// ============================================================
// APP
// ============================================================

app.whenReady().then(() => {
  app.setAppUserModelId(
    'az.skyfit.club',
  );

  configurePermissions();
  createWindow();

  app.on('activate', () => {
    if (
      BrowserWindow.getAllWindows()
        .length === 0
    ) {
      createWindow();
    }
  });
});

app.on(
  'window-all-closed',
  () => {
    if (
      process.platform !== 'darwin'
    ) {
      app.quit();
    }
  },
);
