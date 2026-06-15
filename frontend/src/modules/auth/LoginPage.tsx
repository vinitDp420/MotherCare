import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/api/endpoints/auth.api'
import { useAuthStore } from '@/store/authStore'

// ── Translations ──────────────────────────────────────────────────────────────
const translations = {
  en: {
    appName: 'MotherCare',
    hospital: 'SHAKUNTALA HOSPITAL',
    welcomeBack: 'Welcome back',
    subtitle: 'Please enter your clinical credentials to access the system.',
    emailLabel: 'Email / Username',
    emailPlaceholder: 'name@hospital.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember me on this device',
    login: 'Login',
    authenticating: 'Authenticating...',
    footer: '© 2024 Shakuntala Hospital. Powered by MotherCare SaaS.',
    heroTitle: 'Compassionate Care, Advanced Technology',
    heroSubtitle:
      'Providing a secure and empathetic environment for mothers and newborns at Shakuntala Hospital through MotherCare SaaS.',
    english: 'English',
    marathi: 'मराठी',
    hindi: 'Hindi',
    lightMode: 'Light Mode',
    nightMode: 'Night Mode',

  },
  mr: {
    appName: 'मदरकेअर',
    hospital: 'शकुंतला हॉस्पिटल',
    welcomeBack: 'पुन्हा स्वागत आहे',
    subtitle: 'सिस्टममध्ये प्रवेश करण्यासाठी कृपया आपले क्लिनिकल क्रेडेन्शियल्स प्रविष्ट करा.',
    emailLabel: 'ईमेल / वापरकर्तानाव',
    emailPlaceholder: 'नाव@हॉस्पिटल.com',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'पासवर्ड विसरलात?',
    rememberMe: 'या डिव्हाइसवर मला लक्षात ठेवा',
    login: 'लॉगिन करा',
    authenticating: 'प्रमाणीकरण चालू आहे...',
    footer: '© २०२४ शकुंतला हॉस्पिटल. मदरकेअर SaaS द्वारे संचालित.',
    heroTitle: 'सहानुभूतीपूर्ण काळजी, प्रगत तंत्रज्ञान',
    heroSubtitle:
      'मदरकेअर SaaS द्वारे शकुंतला हॉस्पिटलमध्ये माता आणि नवजात बालकांसाठी सुरक्षित आणि सहानुभूतीपूर्ण वातावरण प्रदान करणे.',
    english: 'English',
    marathi: 'मराठी',
    hindi: 'हिंदी',
    lightMode: 'दिवस मोड',
    nightMode: 'रात्र मोड',

  },
  hi: {
    appName: 'मदरकेअर',
    hospital: 'शकुंतला अस्पताल',
    welcomeBack: 'पुनः स्वागत है',
    subtitle: 'सिस्टम में प्रवेश करने के लिए कृपया अपने क्लिनिकल क्रेडेंशियल्स दर्ज करें।',
    emailLabel: 'ईमेल / उपयोगकर्ता नाम',
    emailPlaceholder: 'name@hospital.com',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'पासवर्ड भूल गए?',
    rememberMe: 'इस डिवाइस पर मुझे याद रखें',
    login: 'लॉगिन करें',
    authenticating: 'प्रमाणित किया जा रहा है...',
    footer: '© २०२४ शकुंतला अस्पताल। मदरकेअर SaaS द्वारा संचालित।',
    heroTitle: 'सहानुभूतिपूर्ण देखभाल, उन्नत तकनीक',
    heroSubtitle:
      'मदरकेअर SaaS के माध्यम से शकुंतला अस्पताल में माताओं और नवजात शिशुओं के लिए एक सुरक्षित और सहानुभूतिपूर्ण वातावरण प्रदान करना।',
    english: 'English',
    marathi: 'मराठी',
    hindi: 'हिंदी',
    lightMode: 'दिन मोड',
    nightMode: 'रात मोड',

  },
} as const

type Lang = keyof typeof translations

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

import { useUIStore } from '@/store/uiStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const { language, setLanguage } = useUIStore()
  const [isDark, setIsDark] = useState(false)

  const t = translations[language]

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember_me: false },
  })

  const onSubmit = async (data: LoginForm) => {
    setServerError('')
    try {
      const response = await authApi.login(data)
      setAuth(response.token, response.user)
      navigate('/dashboard')
    } catch (err: any) {
      setServerError(err?.detail ?? 'Login failed. Please check your credentials.')
    }
  }



  const toggleDarkMode = () => {
    const html = document.documentElement
    if (isDark) {
      html.classList.remove('dark')
    } else {
      html.classList.add('dark')
    }
    setIsDark(!isDark)
  }

  return (
    <main className="login-page-root">
      {/* ── Left Panel ────────────────────────────────────────────── */}
      <section className="login-left-panel">
        {/* Full-panel image */}
        <img
          src="/mother-child.png"
          alt="Mother and Child Illustration"
          className="login-hero-image"
          onError={(e) => {
            // Fallback gradient if image fails
            const target = e.currentTarget as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        {/* Gradient overlay */}
        <div className="login-hero-overlay" />
        {/* Branding card at bottom */}
        <div className="login-hero-card">
          <h2 className="login-hero-title">{t.heroTitle}</h2>
          <p className="login-hero-subtitle">{t.heroSubtitle}</p>
        </div>
        {/* Decorative blobs */}
        <div className="login-blob login-blob-tl" />
        <div className="login-blob login-blob-br" />
      </section>

      {/* ── Right Panel ───────────────────────────────────────────── */}
      <section className="login-right-panel">
        <div className="login-form-wrapper">

          {/* Logo */}
          <div className="login-logo-row">
            <div className="login-logo-icon">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1", fontSize: '26px' }}
              >
                salinity
              </span>
            </div>
            <div>
              <h1 className="login-app-name">{t.appName}</h1>
              <p className="login-hospital-name">{t.hospital}</p>
            </div>
          </div>

          {/* Welcome */}
          <div className="login-welcome">
            <h2 className="login-welcome-title">{t.welcomeBack}</h2>
            <p className="login-welcome-sub">{t.subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>

            {/* Email / Username */}
            <div className="login-field-group">
              <label className="login-field-label" htmlFor="username">
                {t.emailLabel}
              </label>
              <div className="login-input-wrapper">
                <span className="login-input-icon material-symbols-outlined">person</span>
                <input
                  type="text"
                  id="username"
                  autoComplete="username"
                  className={`login-input${errors.username ? ' login-input-error' : ''}`}
                  placeholder={t.emailPlaceholder}
                  {...register('username')}
                />
              </div>
              {errors.username && (
                <p className="login-field-error">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="login-field-group">
              <div className="login-field-label-row">
                <label className="login-field-label" htmlFor="password">
                  {t.passwordLabel}
                </label>
                <a className="login-forgot-link" href="#">
                  {t.forgotPassword}
                </a>
              </div>
              <div className="login-input-wrapper">
                <span className="login-input-icon material-symbols-outlined">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  className={`login-input login-input-password${errors.password ? ' login-input-error' : ''}`}
                  placeholder={t.passwordPlaceholder}
                  {...register('password')}
                />
                <button
                  type="button"
                  id="toggle-password"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="login-field-error">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="login-remember-row">
              <input
                id="remember"
                type="checkbox"
                className="login-checkbox"
                {...register('remember_me')}
              />
              <label className="login-remember-label" htmlFor="remember">
                {t.rememberMe}
              </label>
            </div>

            {/* Server Error */}
            {serverError && (
              <div className="login-server-error">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              id="login-btn"
              className="login-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="login-spinner" />
                  {t.authenticating}
                </>
              ) : (
                t.login
              )}
            </button>
          </form>



          {/* Utilities */}
          <div className="login-utilities">
            {/* Language switcher */}
            <div className="login-lang-switcher">
              <span className="material-symbols-outlined login-lang-icon">language</span>
              <div className="login-lang-pills">
                <button
                  onClick={() => setLanguage('en')}
                  className={`login-lang-btn${language === 'en' ? ' login-lang-btn-active' : ''}`}
                >
                  {t.english}
                </button>
                <button
                  onClick={() => setLanguage('mr')}
                  className={`login-lang-btn${language === 'mr' ? ' login-lang-btn-active' : ''}`}
                >
                  {t.marathi}
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={`login-lang-btn${language === 'hi' ? ' login-lang-btn-active' : ''}`}
                >
                  {t.hindi}
                </button>
              </div>
            </div>

            {/* Dark mode toggle */}
            <div className="login-theme-toggle-row">
              <button
                className="login-theme-btn"
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isDark ? 'light_mode' : 'dark_mode'}
                </span>
                <span className="login-theme-label">
                  {isDark ? t.lightMode : t.nightMode}
                </span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <footer className="login-footer">
            <p>{t.footer}</p>
          </footer>
        </div>
      </section>
    </main>
  )
}
