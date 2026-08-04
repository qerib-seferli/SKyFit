// ============================================================
// SKy Fit Professional — Authentication Module
// Login, Register, Email confirmation, Password recovery
// ============================================================

import {
  $,
  $$,
  byId,
  sb,
  cfg,
  isConfigured,
  toast,
  setBusy,
  setFormMessage,
  getErrorMessage,
  reportError,
  getSession,
  getProfile,
  clearProfileCache,
  hasStaffRole,
  getSafeNextPage,
  buildRelativeUrl,
  redirectTo,
  uploadAvatar,
  validateImageFile,
  show,
  hide,
  hideLoader,
  esc,
} from './core.js';

// ============================================================
// SABİTLƏR
// ============================================================

const MIN_PASSWORD_LENGTH = 8;
const MAX_AVATAR_SIZE_MB = 5;

let selectedRegisterAvatar = null;
let recoverySessionReady = false;
let recoveryEventReceived = false;

// ============================================================
// ÜMUMİ KÖMƏKÇİLƏR
// ============================================================

function getFormButton(form) {
  return (
    $('[type="submit"]', form) ??
    $('button', form)
  );
}

function getTrimmedFormValue(
  formData,
  key,
) {
  return String(
    formData.get(key) ?? '',
  ).trim();
}

function clearFieldErrors(form) {
  $$('.field-error', form).forEach(
    (element) => {
      element.textContent = '';
    },
  );

  $$(
    '.input[aria-invalid="true"]',
    form,
  ).forEach((element) => {
    element.removeAttribute(
      'aria-invalid',
    );
  });
}

function setFieldError(
  input,
  errorElement,
  message,
) {
  const inputElement =
    typeof input === 'string'
      ? $(input)
      : input;

  const messageElement =
    typeof errorElement === 'string'
      ? $(errorElement)
      : errorElement;

  inputElement?.setAttribute(
    'aria-invalid',
    'true',
  );

  if (messageElement) {
    messageElement.textContent =
      message;
  }

  return false;
}

function normalizeEmail(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('az-AZ');
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value ?? '').trim(),
  );
}

function normalizePhone(value) {
  const raw = String(value ?? '').trim();

  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');

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

function formatPhoneInput(value) {
  const digits = String(value ?? '')
    .replace(/\D/g, '')
    .replace(/^994/, '')
    .slice(0, 9);

  const parts = [];

  if (digits.length > 0) {
    parts.push(digits.slice(0, 2));
  }

  if (digits.length > 2) {
    parts.push(digits.slice(2, 5));
  }

  if (digits.length > 5) {
    parts.push(digits.slice(5, 7));
  }

  if (digits.length > 7) {
    parts.push(digits.slice(7, 9));
  }

  if (!digits.length) {
    return '';
  }

  return `+994 ${parts.join(' ')}`;
}

function passwordHasLetter(password) {
  return /[A-Za-zƏəĞğÇçŞşİıÖöÜü]/.test(
    password,
  );
}

function passwordHasNumber(password) {
  return /\d/.test(password);
}

function validatePassword(password) {
  if (
    String(password).length <
    MIN_PASSWORD_LENGTH
  ) {
    return `Şifrə ən azı ${MIN_PASSWORD_LENGTH} simvol olmalıdır.`;
  }

  if (!passwordHasLetter(password)) {
    return 'Şifrədə ən azı bir hərf olmalıdır.';
  }

  if (!passwordHasNumber(password)) {
    return 'Şifrədə ən azı bir rəqəm olmalıdır.';
  }

  return '';
}

function calculatePasswordStrength(
  password,
) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (passwordHasLetter(password)) {
    score += 1;
  }
  if (passwordHasNumber(password)) {
    score += 1;
  }
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  }

  if (!password.length) {
    return {
      score: 0,
      width: 0,
      label:
        'Şifrə ən azı 8 simvol, hərf və rəqəm içərsin.',
      color: 'var(--danger)',
    };
  }

  if (score <= 2) {
    return {
      score,
      width: 32,
      label: 'Zəif şifrə',
      color: 'var(--danger)',
    };
  }

  if (score <= 4) {
    return {
      score,
      width: 68,
      label: 'Orta güclü şifrə',
      color: 'var(--warning)',
    };
  }

  return {
    score,
    width: 100,
    label: 'Güclü şifrə',
    color: 'var(--success)',
  };
}

function updatePasswordStrength(
  input,
  wrapper,
) {
  if (!input || !wrapper) return;

  const bar =
    $('.password-strength__bar span', wrapper);

  const text =
    $('small', wrapper);

  const result =
    calculatePasswordStrength(
      input.value,
    );

  if (bar) {
    bar.style.width =
      `${result.width}%`;

    bar.style.background =
      result.color;
  }

  if (text) {
    text.textContent =
      result.label;
  }
}

function safeAuthRedirect(
  page,
) {
  return buildRelativeUrl(page);
}

function isRegisterPage() {
  return Boolean(
    byId('registerForm'),
  );
}

function isLoginPage() {
  return Boolean(
    byId('loginForm'),
  );
}

function isResetPage() {
  return Boolean(
    byId('resetPasswordForm'),
  );
}

function isUpdatePasswordPage() {
  return Boolean(
    byId('updatePasswordForm'),
  );
}

// ============================================================
// PROFİLİN AUTH METADATA İLƏ TAMAMLANMASI
// ============================================================

async function syncProfileFromUser(
  user,
  extraValues = {},
) {
  if (!sb || !user?.id) {
    return null;
  }

  const metadata =
    user.user_metadata ?? {};

  const profileValues = {
    auth_user_id: user.id,

    full_name:
      String(
        extraValues.full_name ??
          metadata.full_name ??
          '',
      ).trim(),

    email:
      normalizeEmail(
        user.email ??
          extraValues.email ??
          '',
      ),

    phone:
      normalizePhone(
        extraValues.phone ??
          metadata.phone ??
          '',
      ) || null,

    birth_date:
      extraValues.birth_date ??
      metadata.birth_date ??
      null,

    address:
      String(
        extraValues.address ??
          metadata.address ??
          '',
      ).trim() || null,

    avatar_url:
      extraValues.avatar_url ??
      metadata.avatar_url ??
      null,
  };

  const {
    data: existingProfile,
    error: existingError,
  } = await sb
    .from('profiles')
    .select('id,full_name,email,phone,birth_date,address,avatar_url')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingProfile) {
    const updateValues = {};

    for (const [
      key,
      value,
    ] of Object.entries(
      profileValues,
    )) {
      if (
        key === 'auth_user_id'
      ) {
        continue;
      }

      if (
        value !== null &&
        value !== ''
      ) {
        updateValues[key] = value;
      }
    }

    if (
      Object.keys(updateValues)
        .length
    ) {
      const {
        data,
        error,
      } = await sb
        .from('profiles')
        .update(updateValues)
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      clearProfileCache();

      return data;
    }

    return existingProfile;
  }

  const {
    data,
    error,
  } = await sb
    .from('profiles')
    .insert({
      auth_user_id: user.id,
      full_name:
        profileValues.full_name ||
        user.email?.split('@')[0] ||
        'Üzv',
      email: profileValues.email,
      phone: profileValues.phone,
      birth_date:
        profileValues.birth_date,
      address:
        profileValues.address,
      avatar_url:
        profileValues.avatar_url,
      role: 'member',
      is_manual: false,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  clearProfileCache();

  return data;
}

// ============================================================
// QEYDİYYAT VALIDASİYASI
// ============================================================

function validateRegisterForm(
  form,
  formData,
) {
  clearFieldErrors(form);

  const fullName =
    getTrimmedFormValue(
      formData,
      'full_name',
    );

  const email =
    normalizeEmail(
      formData.get('email'),
    );

  const phone =
    getTrimmedFormValue(
      formData,
      'phone',
    );

  const password =
    String(
      formData.get('password') ?? '',
    );

  const passwordConfirm =
    String(
      formData.get(
        'password_confirm',
      ) ?? '',
    );

  const terms =
    formData.get('terms');

  let valid = true;

  if (fullName.length < 3) {
    valid =
      setFieldError(
        '#registerFullName',
        '#registerFullNameError',
        'Ad və soyad ən azı 3 simvol olmalıdır.',
      ) && valid;
  }

  if (!isValidEmail(email)) {
    valid =
      setFieldError(
        '#registerEmail',
        '#registerEmailError',
        'Düzgün email ünvanı daxil edin.',
      ) && valid;
  }

  if (
    phone &&
    !isValidPhone(phone)
  ) {
    valid =
      setFieldError(
        '#registerPhone',
        '#registerPhoneError',
        'Telefonu +994 55 000 00 00 formatında daxil edin.',
      ) && valid;
  }

  const passwordError =
    validatePassword(password);

  if (passwordError) {
    valid =
      setFieldError(
        '#registerPassword',
        '#registerPasswordError',
        passwordError,
      ) && valid;
  }

  if (
    password !== passwordConfirm
  ) {
    valid =
      setFieldError(
        '#registerPasswordConfirm',
        '#registerPasswordConfirmError',
        'Şifrələr eyni deyil.',
      ) && valid;
  }

  if (!terms) {
    toast(
      'Məlumatların istifadəsi ilə bağlı təsdiq sahəsini işarələyin.',
      'error',
    );

    valid = false;
  }

  if (selectedRegisterAvatar) {
    try {
      validateImageFile(
        selectedRegisterAvatar,
        {
          maxSizeMB:
            MAX_AVATAR_SIZE_MB,
        },
      );
    } catch (error) {
      toast(
        getErrorMessage(error),
        'error',
      );

      valid = false;
    }
  }

  return valid;
}

// ============================================================
// QEYDİYYAT
// ============================================================

export async function register(event) {
  event.preventDefault();

  const form =
    event.currentTarget;

  const submitButton =
    getFormButton(form);

  const messageElement =
    byId('registerMessage');

  setFormMessage(
    messageElement,
    '',
  );

  if (!isConfigured || !sb) {
    setFormMessage(
      messageElement,
      'Supabase konfiqurasiyası tamamlanmayıb.',
      'error',
    );

    toast(
      'Əvvəlcə Supabase konfiqurasiyasını tamamlayın.',
      'error',
    );

    return;
  }

  const formData =
    new FormData(form);

  if (
    !validateRegisterForm(
      form,
      formData,
    )
  ) {
    return;
  }

  const fullName =
    getTrimmedFormValue(
      formData,
      'full_name',
    );

  const email =
    normalizeEmail(
      formData.get('email'),
    );

  const phone =
    normalizePhone(
      formData.get('phone'),
    );

  const password =
    String(
      formData.get('password') ?? '',
    );

  const birthDate =
    getTrimmedFormValue(
      formData,
      'birth_date',
    ) || null;

  const address =
    getTrimmedFormValue(
      formData,
      'address',
    ) || null;

  setBusy(
    submitButton,
    true,
    'Qeydiyyat yaradılır...',
  );

  try {
    const emailRedirectTo =
      safeAuthRedirect(
        'login.html?confirmed=1',
      );

    const {
      data,
      error,
    } = await sb.auth.signUp({
      email,
      password,

      options: {
        emailRedirectTo,

        data: {
          full_name: fullName,
          phone: phone || null,
          birth_date: birthDate,
          address,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error(
        'İstifadəçi hesabı yaradıla bilmədi.',
      );
    }

    let avatarUploaded = false;

    // Email təsdiqi deaktivdirsə signUp dərhal sessiya qaytarır.
    if (data.session) {
      let avatarUrl = null;

      if (selectedRegisterAvatar) {
        const uploadResult =
          await uploadAvatar(
            selectedRegisterAvatar,
          );

        avatarUrl =
          uploadResult?.publicUrl ??
          null;

        avatarUploaded =
          Boolean(avatarUrl);
      }

      await syncProfileFromUser(
        data.user,
        {
          full_name: fullName,
          email,
          phone,
          birth_date: birthDate,
          address,
          avatar_url: avatarUrl,
        },
      );

      setFormMessage(
        messageElement,
        'Qeydiyyat uğurla tamamlandı. Ana səhifəyə yönləndirilirsiniz.',
        'success',
      );

      toast(
        'SKy Fit hesabınız yaradıldı.',
        'success',
      );

      window.setTimeout(() => {
        redirectTo('index.html');
      }, 1100);

      return;
    }

    // Email təsdiqi aktivdirsə profil trigger vasitəsilə yaradılır.
    setFormMessage(
      messageElement,
      selectedRegisterAvatar &&
        !avatarUploaded
        ? 'Qeydiyyat yaradıldı. Emailinizi təsdiqlədikdən sonra profil şəklini şəxsi kabinetdən əlavə edə bilərsiniz.'
        : 'Qeydiyyat yaradıldı. Email ünvanınıza göndərilən təsdiq keçidini açın.',
      'success',
    );

    toast(
      'Email təsdiq keçidi göndərildi.',
      'success',
      5200,
    );

    form.reset();
    clearRegisterAvatar();

    window.setTimeout(() => {
      redirectTo('index.html');
    }, 2200);
  } catch (error) {
    reportError(
      error,
      'register',
    );

    const message =
      getErrorMessage(error);

    setFormMessage(
      messageElement,
      message,
      'error',
    );

    toast(message, 'error');
  } finally {
    setBusy(
      submitButton,
      false,
    );
  }
}

// ============================================================
// LOGIN VALIDASİYASI
// ============================================================

function validateLoginForm(
  form,
  formData,
) {
  clearFieldErrors(form);

  const email =
    normalizeEmail(
      formData.get('email'),
    );

  const password =
    String(
      formData.get('password') ?? '',
    );

  let valid = true;

  if (!isValidEmail(email)) {
    valid =
      setFieldError(
        '#loginEmail',
        '#loginEmailError',
        'Düzgün email ünvanı daxil edin.',
      ) && valid;
  }

  if (password.length < 6) {
    valid =
      setFieldError(
        '#loginPassword',
        '#loginPasswordError',
        'Şifrə ən azı 6 simvol olmalıdır.',
      ) && valid;
  }

  return valid;
}

// ============================================================
// LOGIN
// ============================================================

export async function login(event) {
  event.preventDefault();

  const form =
    event.currentTarget;

  const submitButton =
    getFormButton(form);

  const messageElement =
    byId('loginMessage');

  setFormMessage(
    messageElement,
    '',
  );

  if (!isConfigured || !sb) {
    setFormMessage(
      messageElement,
      'Supabase konfiqurasiyası tamamlanmayıb.',
      'error',
    );

    return;
  }

  const formData =
    new FormData(form);

  if (
    !validateLoginForm(
      form,
      formData,
    )
  ) {
    return;
  }

  const email =
    normalizeEmail(
      formData.get('email'),
    );

  const password =
    String(
      formData.get('password') ?? '',
    );

  const requestedAccountType =
    String(
      formData.get(
        'account_type',
      ) ?? 'member',
    );

  setBusy(
    submitButton,
    true,
    'Daxil olunur...',
  );

  try {
    const {
      data,
      error,
    } =
      await sb.auth
        .signInWithPassword({
          email,
          password,
        });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error(
        'İstifadəçi məlumatı alınmadı.',
      );
    }

    // Qeydiyyat metadata-sında qalan əlavə məlumatları
    // ilk uğurlu giriş zamanı profiles cədvəlinə keçirir.
    await syncProfileFromUser(
      data.user,
    );

    clearProfileCache();

    const profile =
      await getProfile({
        force: true,
      });

    if (!profile) {
      throw new Error(
        'Profil məlumatı tapılmadı.',
      );
    }

    if (!profile.is_active) {
      await sb.auth.signOut();

      throw new Error(
        'Hesabınız deaktiv edilib. Administrasiya ilə əlaqə saxlayın.',
      );
    }

    if (
      requestedAccountType ===
        'staff' &&
      !hasStaffRole(profile)
    ) {
      await sb.auth.signOut();

      throw new Error(
        'Bu hesab Admin və ya İşçi hesabı deyil.',
      );
    }

    setFormMessage(
      messageElement,
      'Giriş uğurludur. Yönləndirilirsiniz...',
      'success',
    );

    toast(
      `Xoş gəldiniz, ${
        profile.full_name ||
        'SKy Fit üzvü'
      }.`,
      'success',
    );

    const nextFromUrl =
      getSafeNextPage('');

    let destination =
      nextFromUrl;

    if (!destination) {
      destination =
        hasStaffRole(profile)
          ? 'admin.html'
          : 'profile.html';
    }

    if (
      destination ===
        'admin.html' &&
      !hasStaffRole(profile)
    ) {
      destination =
        'profile.html';
    }

    window.setTimeout(() => {
      redirectTo(destination);
    }, 550);
  } catch (error) {
    reportError(
      error,
      'login',
    );

    const message =
      getErrorMessage(error);

    setFormMessage(
      messageElement,
      message,
      'error',
    );

    toast(message, 'error');
  } finally {
    setBusy(
      submitButton,
      false,
    );
  }
}

// ============================================================
// ÇIXIŞ
// ============================================================

export async function logout() {
  if (!sb) {
    redirectTo('index.html');

    return;
  }

  try {
    const {
      error,
    } = await sb.auth.signOut();

    if (error) {
      throw error;
    }

    clearProfileCache();

    redirectTo('index.html');
  } catch (error) {
    toast(
      getErrorMessage(error),
      'error',
    );
  }
}

// ============================================================
// ŞİFRƏ BƏRPA EMAILİ
// ============================================================

export async function sendReset(
  event,
) {
  event.preventDefault();

  const form =
    event.currentTarget;

  const formData =
    new FormData(form);

  const submitButton =
    getFormButton(form);

  const messageElement =
    byId(
      'resetPasswordMessage',
    );

  clearFieldErrors(form);

  setFormMessage(
    messageElement,
    '',
  );

  if (!isConfigured || !sb) {
    setFormMessage(
      messageElement,
      'Supabase konfiqurasiyası tamamlanmayıb.',
      'error',
    );

    return;
  }

  const email =
    normalizeEmail(
      formData.get('email'),
    );

  if (!isValidEmail(email)) {
    setFieldError(
      '#resetEmail',
      '#resetEmailError',
      'Düzgün email ünvanı daxil edin.',
    );

    return;
  }

  setBusy(
    submitButton,
    true,
    'Göndərilir...',
  );

  try {
    const redirectUrl =
      safeAuthRedirect(
        'update-password.html',
      );

    const {
      error,
    } =
      await sb.auth
        .resetPasswordForEmail(
          email,
          {
            redirectTo:
              redirectUrl,
          },
        );

    if (error) {
      throw error;
    }

    setFormMessage(
      messageElement,
      'Şifrə bərpa keçidi email ünvanınıza göndərildi. Spam qovluğunu da yoxlayın.',
      'success',
    );

    toast(
      'Bərpa keçidi emailə göndərildi.',
      'success',
      5000,
    );

    form.reset();
  } catch (error) {
    reportError(
      error,
      'sendReset',
    );

    const message =
      getErrorMessage(error);

    setFormMessage(
      messageElement,
      message,
      'error',
    );

    toast(message, 'error');
  } finally {
    setBusy(
      submitButton,
      false,
    );
  }
}

// ============================================================
// RECOVERY SESSİYASININ GÖRÜNÜŞÜ
// ============================================================

function setRecoveryState(
  ready,
  {
    title,
    text,
  } = {},
) {
  recoverySessionReady =
    Boolean(ready);

  const statusElement =
    byId(
      'recoverySessionStatus',
    );

  const statusTitle =
    byId(
      'recoverySessionTitle',
    );

  const statusText =
    byId(
      'recoverySessionText',
    );

  const form =
    byId(
      'updatePasswordForm',
    );

  const invalidState =
    byId(
      'invalidRecoveryState',
    );

  const submitButton =
    byId(
      'updatePasswordSubmitButton',
    );

  if (ready) {
    if (statusElement) {
      statusElement.hidden = false;
      statusElement.classList.add(
        'success',
      );
    }

    if (statusTitle) {
      statusTitle.textContent =
        title ??
        'Bərpa keçidi təsdiqləndi';
    }

    if (statusText) {
      statusText.textContent =
        text ??
        'Yeni şifrənizi təyin edə bilərsiniz.';
    }

    if (form) {
      form.hidden = false;
    }

    if (invalidState) {
      invalidState.hidden = true;
    }

    if (submitButton) {
      submitButton.disabled = false;
    }

    return;
  }

  if (statusElement) {
    statusElement.hidden = true;
  }

  if (form) {
    form.hidden = true;
  }

  if (invalidState) {
    invalidState.hidden = false;
  }

  if (submitButton) {
    submitButton.disabled = true;
  }
}

function urlContainsRecoveryData() {
  const searchParams =
    new URLSearchParams(
      location.search,
    );

  const hashParams =
    new URLSearchParams(
      location.hash.replace(
        /^#/,
        '',
      ),
    );

  return (
    searchParams.has('code') ||
    searchParams.get('type') ===
      'recovery' ||
    hashParams.has(
      'access_token',
    ) ||
    hashParams.get('type') ===
      'recovery'
  );
}

async function initializeRecoveryPage() {
  if (
    !isUpdatePasswordPage()
  ) {
    return;
  }

  if (!sb) {
    setRecoveryState(false);

    return;
  }

  const statusTitle =
    byId(
      'recoverySessionTitle',
    );

  const statusText =
    byId(
      'recoverySessionText',
    );

  if (statusTitle) {
    statusTitle.textContent =
      'Bərpa keçidi yoxlanılır';
  }

  if (statusText) {
    statusText.textContent =
      'Təhlükəsiz sessiya təsdiqlənir...';
  }

  const hasRecoveryUrl =
    urlContainsRecoveryData();

  // detectSessionInUrl prosesi üçün qısa gözləmə.
  await new Promise(
    (resolve) =>
      window.setTimeout(
        resolve,
        700,
      ),
  );

  const session =
    await getSession();

  if (
    recoveryEventReceived ||
    (hasRecoveryUrl && session)
  ) {
    setRecoveryState(true);

    return;
  }

  // Bəzi Supabase recovery keçidlərində URL brauzer
  // tərəfindən təmizləndikdən sonra yalnız sessiya qalır.
  if (
    session &&
    session.user &&
    document.referrer.includes(
      'supabase',
    )
  ) {
    setRecoveryState(true);

    return;
  }

  setRecoveryState(false);
}

// ============================================================
// YENİ ŞİFRƏ
// ============================================================

export async function updatePassword(
  event,
) {
  event.preventDefault();

  const form =
    event.currentTarget;

  const submitButton =
    getFormButton(form);

  const messageElement =
    byId(
      'updatePasswordMessage',
    );

  clearFieldErrors(form);

  setFormMessage(
    messageElement,
    '',
  );

  if (!sb) {
    setFormMessage(
      messageElement,
      'Supabase bağlantısı yoxdur.',
      'error',
    );

    return;
  }

  if (!recoverySessionReady) {
    setFormMessage(
      messageElement,
      'Bərpa sessiyası etibarlı deyil. Yeni bərpa keçidi tələb edin.',
      'error',
    );

    return;
  }

  const formData =
    new FormData(form);

  const password =
    String(
      formData.get('password') ?? '',
    );

  const passwordConfirm =
    String(
      formData.get(
        'password_confirm',
      ) ?? '',
    );

  const passwordError =
    validatePassword(password);

  if (passwordError) {
    setFieldError(
      '#newPassword',
      '#newPasswordError',
      passwordError,
    );

    return;
  }

  if (
    password !== passwordConfirm
  ) {
    setFieldError(
      '#confirmNewPassword',
      '#confirmNewPasswordError',
      'Şifrələr eyni deyil.',
    );

    return;
  }

  setBusy(
    submitButton,
    true,
    'Şifrə yenilənir...',
  );

  try {
    const {
      error,
    } =
      await sb.auth.updateUser({
        password,
      });

    if (error) {
      throw error;
    }

    setFormMessage(
      messageElement,
      'Şifrəniz uğurla yeniləndi. Şəxsi kabinetə yönləndirilirsiniz.',
      'success',
    );

    toast(
      'Şifrə uğurla yeniləndi.',
      'success',
    );

    window.setTimeout(() => {
      redirectTo('profile.html');
    }, 1000);
  } catch (error) {
    reportError(
      error,
      'updatePassword',
    );

    const message =
      getErrorMessage(error);

    setFormMessage(
      messageElement,
      message,
      'error',
    );

    toast(message, 'error');
  } finally {
    setBusy(
      submitButton,
      false,
    );
  }
}

// ============================================================
// ŞİFRƏ GÖSTƏR / GİZLƏ
// ============================================================

function bindPasswordToggle(
  buttonId,
  inputId,
) {
  const button =
    byId(buttonId);

  const input =
    byId(inputId);

  if (
    !button ||
    !input ||
    button.dataset.passwordBound ===
      'true'
  ) {
    return;
  }

  button.dataset.passwordBound =
    'true';

  button.addEventListener(
    'click',
    () => {
      const visible =
        input.type === 'text';

      input.type =
        visible
          ? 'password'
          : 'text';

      button.setAttribute(
        'aria-pressed',
        String(!visible),
      );

      button.setAttribute(
        'aria-label',
        visible
          ? 'Şifrəni göstər'
          : 'Şifrəni gizlət',
      );

      const icon =
        $('span', button);

      if (icon) {
        icon.textContent =
          visible
            ? '◉'
            : '◎';
      }

      input.focus();
    },
  );
}

function bindAllPasswordToggles() {
  bindPasswordToggle(
    'toggleLoginPassword',
    'loginPassword',
  );

  bindPasswordToggle(
    'toggleRegisterPassword',
    'registerPassword',
  );

  bindPasswordToggle(
    'toggleRegisterPasswordConfirm',
    'registerPasswordConfirm',
  );

  bindPasswordToggle(
    'toggleNewPassword',
    'newPassword',
  );

  bindPasswordToggle(
    'toggleConfirmNewPassword',
    'confirmNewPassword',
  );
}

// ============================================================
// LOGIN HESAB TİPİ TABLARI
// ============================================================

function bindAccountTypeTabs() {
  const tabs =
    $$('.account-type-tab');

  const hiddenInput =
    byId('accountType');

  if (
    !tabs.length ||
    !hiddenInput
  ) {
    return;
  }

  tabs.forEach((tab) => {
    tab.addEventListener(
      'click',
      () => {
        tabs.forEach(
          (item) => {
            const active =
              item === tab;

            item.classList.toggle(
              'active',
              active,
            );

            item.setAttribute(
              'aria-selected',
              String(active),
            );
          },
        );

        hiddenInput.value =
          tab.dataset.accountType ??
          'member';
      },
    );
  });
}

// ============================================================
// TELEFON FORMATLAMA
// ============================================================

function bindPhoneInput(
  inputId,
) {
  const input =
    byId(inputId);

  if (!input) return;

  input.addEventListener(
    'input',
    () => {
      const cursorAtEnd =
        input.selectionStart ===
        input.value.length;

      input.value =
        formatPhoneInput(
          input.value,
        );

      if (cursorAtEnd) {
        input.setSelectionRange(
          input.value.length,
          input.value.length,
        );
      }
    },
  );
}

// ============================================================
// AVATAR ÖNİZLƏMƏSİ
// ============================================================

function clearRegisterAvatar() {
  selectedRegisterAvatar = null;

  const input =
    byId('registerAvatar');

  const wrapper =
    byId(
      'registerAvatarPreviewWrapper',
    );

  const preview =
    byId(
      'registerAvatarPreview',
    );

  const fileName =
    byId(
      'registerAvatarName',
    );

  if (input) {
    input.value = '';
  }

  if (wrapper) {
    wrapper.hidden = true;
  }

  if (preview) {
    preview.src =
      'assets/img/logo.png';
  }

  if (fileName) {
    fileName.textContent =
      'Fayl seçilməyib';
  }
}

function bindRegisterAvatar() {
  const input =
    byId('registerAvatar');

  const wrapper =
    byId(
      'registerAvatarPreviewWrapper',
    );

  const preview =
    byId(
      'registerAvatarPreview',
    );

  const fileName =
    byId(
      'registerAvatarName',
    );

  const removeButton =
    byId(
      'removeRegisterAvatar',
    );

  if (!input) return;

  input.addEventListener(
    'change',
    () => {
      const file =
        input.files?.[0];

      if (!file) {
        clearRegisterAvatar();

        return;
      }

      try {
        validateImageFile(file, {
          maxSizeMB:
            MAX_AVATAR_SIZE_MB,
        });

        selectedRegisterAvatar =
          file;

        if (fileName) {
          fileName.textContent =
            file.name;
        }

        if (preview) {
          preview.src =
            URL.createObjectURL(
              file,
            );

          preview.onload = () => {
            URL.revokeObjectURL(
              preview.src,
            );
          };
        }

        if (wrapper) {
          wrapper.hidden = false;
        }
      } catch (error) {
        clearRegisterAvatar();

        toast(
          getErrorMessage(error),
          'error',
        );
      }
    },
  );

  removeButton?.addEventListener(
    'click',
    clearRegisterAvatar,
  );
}

// ============================================================
// ŞİFRƏ GÜCÜ EVENT-LƏRİ
// ============================================================

function bindPasswordStrengths() {
  const registerPassword =
    byId('registerPassword');

  const registerStrength =
    byId('passwordStrength');

  registerPassword?.addEventListener(
    'input',
    () => {
      updatePasswordStrength(
        registerPassword,
        registerStrength,
      );
    },
  );

  const newPassword =
    byId('newPassword');

  const updateStrength =
    byId(
      'updatePasswordStrength',
    );

  newPassword?.addEventListener(
    'input',
    () => {
      updatePasswordStrength(
        newPassword,
        updateStrength,
      );
    },
  );
}

// ============================================================
// URL MESAJLARI
// ============================================================

function showLoginUrlMessages() {
  if (!isLoginPage()) return;

  const params =
    new URLSearchParams(
      location.search,
    );

  if (
    params.get('confirmed') ===
    '1'
  ) {
    setFormMessage(
      '#loginMessage',
      'Email ünvanınız təsdiqləndi. İndi hesabınıza daxil ola bilərsiniz.',
      'success',
    );

    toast(
      'Email ünvanı təsdiqləndi.',
      'success',
    );

    history.replaceState(
      null,
      '',
      'login.html',
    );
  }
}

// ============================================================
// MÖVCUD SESSİYA İLƏ YÖNLƏNDİRMƏ
// ============================================================

async function redirectAuthenticatedUser() {
  if (
    !isLoginPage() &&
    !isRegisterPage()
  ) {
    return;
  }

  const session =
    await getSession();

  if (!session) return;

  try {
    const profile =
      await getProfile({
        force: true,
      });

    if (!profile?.is_active) {
      return;
    }

    const nextPage =
      hasStaffRole(profile)
        ? 'admin.html'
        : 'profile.html';

    const messageElement =
      isLoginPage()
        ? byId('loginMessage')
        : byId(
            'registerMessage',
          );

    setFormMessage(
      messageElement,
      'Siz artıq hesaba daxil olmusunuz.',
      'success',
    );

    window.setTimeout(() => {
      redirectTo(nextPage);
    }, 650);
  } catch (error) {
    reportError(
      error,
      'redirectAuthenticatedUser',
    );
  }
}

// ============================================================
// SUPABASE AUTH EVENT-LƏRİ
// ============================================================

function bindRecoveryAuthEvent() {
  if (!sb) return;

  sb.auth.onAuthStateChange(
    (event) => {
      if (
        event ===
        'PASSWORD_RECOVERY'
      ) {
        recoveryEventReceived =
          true;

        if (
          isUpdatePasswordPage()
        ) {
          setRecoveryState(true);
        }
      }
    },
  );
}

// ============================================================
// AUTH SƏHİFƏLƏRİNİN İNİTİ
// ============================================================

async function initializeAuthPage() {
  bindAllPasswordToggles();
  bindAccountTypeTabs();

  bindPhoneInput(
    'registerPhone',
  );

  bindRegisterAvatar();
  bindPasswordStrengths();
  bindRecoveryAuthEvent();

  showLoginUrlMessages();

  if (
    isUpdatePasswordPage()
  ) {
    await initializeRecoveryPage();
  } else {
    await redirectAuthenticatedUser();
  }

  hideLoader(true);
}

if (
  document.readyState ===
  'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      void initializeAuthPage();
    },
    {
      once: true,
    },
  );
} else {
  void initializeAuthPage();
}

// ============================================================
// KÖHNƏ HTML onsubmit ÇAĞIRIŞLARI ÜÇÜN
// ============================================================

window.SkyAuth = Object.freeze({
  register,
  login,
  logout,
  sendReset,
  updatePassword,
});
