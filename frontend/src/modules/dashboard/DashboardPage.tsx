import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStats } from '@/hooks/useDashboard'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

const translations = {
// ... [truncated for ease of matching, we will select a smaller target content range below]
  en: {
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    loadingOverview: 'Loading hospital overview...',
    failedLoadStats: 'Failed to load statistics',
    networkErrorDesc: 'Please check your network connection or verify that the backend services are running.',
    retry: 'Retry',
    main: 'Main',
    dashboard: 'Dashboard',
    subheading: "Here's what's happening at Shakuntala Hospital today.",
    report: 'Report',
    newPatient: 'New Patient',
    totalPatients: 'Total Patients',
    highRiskCases: 'High Risk Cases',
    high: 'High',
    expDeliveries: 'Exp. Deliveries (Mo)',
    nicuOccupancy: 'NICU Occupancy',
    emergenciesToday: 'Emergencies Today',
    revenueMonth: 'Revenue (Mo)',
    patientGrowth: 'Patient Growth & Appointments',
    monthlyOverview: 'Monthly overview for current year',
    week: 'Week',
    month: 'Month',
    pendingPayments: 'Pending Payments',
    fromPatients: 'From 12 patients',
    insuranceClaims: 'Insurance Claims',
    claimsProcessing: '8 claims processing',
    quickActions: 'Quick Actions',
    registerPatient: 'Register Patient',
    bookAppt: 'Book Appt',
    createAdmission: 'Create Admission',
    generateBill: 'Generate Bill',
    addLabReport: 'Add Lab Report',
    createDelivery: 'Create Delivery',
    recentActivity: 'Recent Activity',
    viewAll: 'View All',
    emergencyAlert: 'Emergency Delivery Alert',
    emergencyAlertDesc: 'Patient: Sunita Rao, Ward B2. Dr. Sharma requested immediately.',
    justNow: 'Just now',
    newPatientReg: 'New Patient Registered',
    newPatientRegDesc: 'Priya Patel (OPD) registered by Front Desk.',
    minsAgo: '10 mins ago',
    labReportAvailable: 'Lab Report Available',
    labReportAvailableDesc: 'CBC results for Meera Devi are ready for review.',
    labReportTime: '45 mins ago',
    admissionCreated: 'Admission Created',
    admissionCreatedDesc: 'Neha Sharma admitted to Maternity Ward A.',
    hoursAgo: '2 hours ago',
  },
  mr: {
    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दुपार',
    goodEvening: 'शुभ संध्याकाळ',
    loadingOverview: 'हॉस्पिटलचा आढावा लोड होत आहे...',
    failedLoadStats: 'आकडेवारी लोड करण्यात अपयशी',
    networkErrorDesc: 'कृपया तुमचे नेटवर्क कनेक्शन तपासा किंवा बॅकएंड सेवा चालू असल्याची खात्री करा.',
    retry: 'पुन्हा प्रयत्न करा',
    main: 'मुख्य',
    dashboard: 'डॅशबोर्ड',
    subheading: 'आज शकुंतला हॉस्पिटलमध्ये काय घडत आहे ते पहा.',
    report: 'अहवाल',
    newPatient: 'नवीन रुग्ण',
    totalPatients: 'एकूण रुग्ण',
    highRiskCases: 'उच्च जोखीम केसेस',
    high: 'उच्च',
    expDeliveries: 'अपेक्षित प्रसूती (महिना)',
    nicuOccupancy: 'एनआयसीयू (NICU) उपलब्धता',
    emergenciesToday: 'आजची आपत्कालीन परिस्थिती',
    revenueMonth: 'महसूल (महिना)',
    patientGrowth: 'रुग्ण वाढ आणि अपॉइंटमेंट',
    monthlyOverview: 'चालू वर्षाचा मासिक आढावा',
    week: 'आठवडा',
    month: 'महिना',
    pendingPayments: 'प्रलंबित पेमेंट',
    fromPatients: '१२ रुग्णांचे',
    insuranceClaims: 'विमा दावे',
    claimsProcessing: '८ दावे प्रक्रियेत',
    quickActions: 'त्वरित कृती',
    registerPatient: 'रुग्ण नोंदणी',
    bookAppt: 'अपॉइंटमेंट बुक करा',
    createAdmission: 'प्रवेश तयार करा',
    generateBill: 'बिल जनरेट करा',
    addLabReport: 'लॅब रिपोर्ट जोडा',
    createDelivery: 'प्रसूती नोंद करा',
    recentActivity: 'अलीकडील क्रियाकलाप',
    viewAll: 'सर्व पहा',
    emergencyAlert: 'आपत्कालीन प्रसूती चेतावणी',
    emergencyAlertDesc: 'रुग्ण: सुनिता राव, वॉर्ड बी२. डॉ. शर्मा यांची त्वरित आवश्यकता आहे.',
    justNow: 'आत्ताच',
    newPatientReg: 'नवीन रुग्ण नोंदणीकृत',
    newPatientRegDesc: 'प्रिया पटेल (OPD) यांची फ्रंट डेस्कद्वारे नोंदणी झाली.',
    minsAgo: '१० मिनिटांपूर्वी',
    labReportAvailable: 'लॅब रिपोर्ट उपलब्ध',
    labReportAvailableDesc: 'मीरा देवी यांचे सीबीसी (CBC) निकाल पुनरावलोकनासाठी तयार आहेत.',
    labReportTime: '४५ मिनिटांपूर्वी',
    admissionCreated: 'रुग्ण दाखल केला',
    admissionCreatedDesc: 'नेहा शर्मा यांना प्रसूती वॉर्ड ए मध्ये दाखल केले.',
    hoursAgo: '२ तासांपूर्वी',
  },
  hi: {
    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दोपहर',
    goodEvening: 'शुभ संध्या',
    loadingOverview: 'अस्पताल का विवरण लोड हो रहा है...',
    failedLoadStats: 'सांख्यिकी लोड करने में विफल',
    networkErrorDesc: 'कृपया अपना नेटवर्क कनेक्शन जांचें या सत्यापित करें कि बैकएंड सेवाएं चल रही हैं।',
    retry: 'पुनः प्रयास करें',
    main: 'मुख्य',
    dashboard: 'डैशबोर्ड',
    subheading: 'आज शकुंतला अस्पताल में क्या हो रहा है, यहां देखें।',
    report: 'रिपोर्ट',
    newPatient: 'नया मरीज',
    totalPatients: 'कुल मरीज',
    highRiskCases: 'उच्च जोखिम वाले मामले',
    high: 'उच्च',
    expDeliveries: 'अपेक्षित प्रसव (माह)',
    nicuOccupancy: 'एनआईसीयू (NICU) उपलब्धता',
    emergenciesToday: 'आज की आपातकालीन स्थितियां',
    revenueMonth: 'राजस्व (माह)',
    patientGrowth: 'मरीजों की वृद्धि और नियुक्तियां',
    monthlyOverview: 'चालू वर्ष का मासिक विवरण',
    week: 'सप्ताह',
    month: 'महीना',
    pendingPayments: 'लंबित भुगतान',
    fromPatients: '१२ मरीजों से',
    insuranceClaims: 'बीमा दावे',
    claimsProcessing: '८ दावों की प्रक्रिया जारी',
    quickActions: 'त्वरित कार्रवाई',
    registerPatient: 'मरीज पंजीकरण',
    bookAppt: 'अपॉइंटमेंट बुक करें',
    createAdmission: 'प्रवेश बनाएं',
    generateBill: 'बिल जनरेट करें',
    addLabReport: 'लैब रिपोर्ट जोड़ें',
    createDelivery: 'प्रसव दर्ज करें',
    recentActivity: 'हाल की गतिविधि',
    viewAll: 'सभी देखें',
    emergencyAlert: 'आपातकालीन प्रसव चेतावनी',
    emergencyAlertDesc: 'मरीज: सुनीता राव, वार्ड बी२। डॉ. शर्मा की तुरंत आवश्यकता है।',
    justNow: 'अभी-अभी',
    newPatientReg: 'नया मरीज पंजीकृत',
    newPatientRegDesc: 'प्रिया पटेल (OPD) फ्रंट डेस्क द्वारा पंजीकृत की गईं।',
    minsAgo: '१० मिनट पहले',
    labReportAvailable: 'लैब रिपोर्ट उपलब्ध',
    labReportAvailableDesc: 'मीरा देवी के सीबीसी (CBC) परिणाम समीक्षा के लिए तैयार हैं।',
    labReportTime: '४५ मिनट पहले',
    admissionCreated: 'प्रवेश बनाया गया',
    admissionCreatedDesc: 'नेहा शर्मा को मातृत्व वार्ड ए में भर्ती किया गया।',
    hoursAgo: '२ घंटे पहले',
  },
} as const

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (user?.roles.includes('Patient') && user.patient_profile_id) {
      navigate(`/patients/${user.patient_profile_id}`, { replace: true })
    }
  }, [user, navigate])

  const { data: stats, isLoading, error } = useDashboardStats()
  const { language } = useUIStore()

  const t = translations[language]

  // Derive greeting based on current hour
  const hour = new Date().getHours()
  const greetingKey = hour < 12 ? 'goodMorning' : hour < 17 ? 'goodAfternoon' : 'goodEvening'
  const greeting = t[greetingKey]

  const drPrefix = language === 'en' ? 'Dr.' : 'डॉ.'
  const username = user?.username || (language === 'en' ? 'Sharma' : 'शर्मा')
  const displayName = `${drPrefix} ${username}`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary font-medium">{t.loadingOverview}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-error-container/20 border border-error-container text-error p-md rounded-xl max-w-lg mx-auto my-lg text-center">
        <span className="material-symbols-outlined text-[48px] text-error mb-2">warning</span>
        <h3 className="font-title-lg text-title-lg font-bold">{t.failedLoadStats}</h3>
        <p className="font-body-md mt-xs">{t.networkErrorDesc}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-md px-md py-sm bg-primary text-on-primary rounded-lg font-label-lg"
        >
          {t.retry}
        </button>
      </div>
    )
  }

  return (
    <div className="p-margin-desktop space-y-gutter">
      {/* Breadcrumbs */}
      <nav className="flex text-label-md text-secondary dark:text-outline-variant gap-xs items-center mb-sm">
        <a className="hover:text-primary dark:hover:text-primary-fixed-dim" href="#">{t.main}</a>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-on-surface dark:text-inverse-on-surface font-bold">{t.dashboard}</span>
      </nav>

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background dark:text-inverse-on-surface">{greeting}, {displayName}</h2>
          <p className="font-body-md text-body-md text-secondary dark:text-outline-variant mt-xs">{t.subheading}</p>
        </div>
        <div className="flex gap-sm">
          <button 
            id="downloadReport"
            className="px-md py-sm bg-white dark:bg-secondary-container/20 text-primary dark:text-primary-fixed-dim font-label-lg text-label-lg rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors flex items-center gap-xs soft-shadow"
          >
            <span className="material-symbols-outlined text-[18px]">download</span> {t.report}
          </button>
          <button 
            id="addNewPatient"
            onClick={() => navigate('/patients/register')}
            className="px-md py-sm bg-primary dark:bg-primary-container text-on-primary dark:text-on-primary-container font-label-lg text-label-lg rounded-lg hover:bg-surface-tint transition-colors flex items-center gap-xs soft-shadow"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> {t.newPatient}
          </button>
        </div>
      </div>

      {/* Maternity KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-sm md:gap-md">
        {/* Stat Card 1: Total Patients */}
        <div className="bg-surface-container-lowest dark:bg-on-surface/5 p-sm rounded-xl border border-outline-variant dark:border-outline/30 soft-shadow flex flex-col">
          <div className="flex justify-between items-start mb-sm">
            <div className="p-2 bg-surface-container-low dark:bg-on-surface/10 rounded-lg text-primary dark:text-primary-fixed-dim">
              <span className="material-symbols-outlined">person</span>
            </div>
            <span className="font-label-md text-label-md text-primary-container bg-on-primary-container px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="font-label-md text-label-md text-secondary dark:text-outline-variant uppercase tracking-wider">{t.totalPatients}</p>
          <p className="font-headline-md text-headline-md text-on-surface dark:text-inverse-on-surface mt-xs">{(stats?.totalPatients ?? 0).toLocaleString() || '–'}</p>
        </div>

        {/* Stat Card 2: High Risk Pregnancies */}
        <div className="bg-surface-container-lowest dark:bg-on-surface/5 p-sm rounded-xl border border-outline-variant dark:border-outline/30 soft-shadow flex flex-col">
          <div className="flex justify-between items-start mb-sm">
            <div className="p-2 bg-error-container/30 rounded-lg text-error">
               <span className="material-symbols-outlined">pregnant_woman</span>
            </div>
            <span className="font-label-md text-label-md text-error bg-error-container px-2 py-1 rounded-full">{t.high}</span>
          </div>
          <p className="font-label-md text-label-md text-secondary dark:text-outline-variant uppercase tracking-wider">{t.highRiskCases}</p>
          <p className="font-headline-md text-headline-md text-on-surface dark:text-inverse-on-surface mt-xs">{stats?.activePregnancies ?? '–'}</p>
        </div>

        {/* Stat Card 3: Expected Deliveries */}
        <div className="bg-surface-container-lowest dark:bg-on-surface/5 p-sm rounded-xl border border-outline-variant dark:border-outline/30 soft-shadow flex flex-col">
          <div className="flex justify-between items-start mb-sm">
            <div className="p-2 bg-surface-container-low dark:bg-on-surface/10 rounded-lg text-primary dark:text-primary-fixed-dim">
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
          </div>
          <p className="font-label-md text-label-md text-secondary dark:text-outline-variant uppercase tracking-wider">{t.expDeliveries}</p>
          <p className="font-headline-md text-headline-md text-on-surface dark:text-inverse-on-surface mt-xs">{stats?.todayAppointments ?? '–'}</p>
        </div>

        {/* Stat Card 4: NICU / Bed Occupancy */}
        <div className="bg-surface-container-lowest dark:bg-on-surface/5 p-sm rounded-xl border border-outline-variant dark:border-outline/30 soft-shadow flex flex-col">
          <div className="flex justify-between items-start mb-sm">
            <div className="p-2 bg-tertiary-fixed-dim/30 rounded-lg text-tertiary dark:text-tertiary-fixed-dim">
              <span className="material-symbols-outlined">child_care</span>
            </div>
            <span className="font-label-md text-label-md text-on-tertiary-fixed-variant bg-tertiary-fixed px-2 py-1 rounded-full">{stats ? `${stats.occupancyRate}%` : '–'}</span>
          </div>
          <p className="font-label-md text-label-md text-secondary dark:text-outline-variant uppercase tracking-wider">{t.nicuOccupancy}</p>
          <p className="font-headline-md text-headline-md text-on-surface dark:text-inverse-on-surface mt-xs">{stats ? `${String(stats.occupiedBeds).padStart(2,'0')}/${String(stats.totalBeds).padStart(2,'0')}` : '–/–'}</p>
        </div>

        {/* Stat Card 5: Deliveries (Month) */}
        <div className="bg-primary-container/20 dark:bg-primary-container/10 p-sm rounded-xl border border-primary-container/30 soft-shadow flex flex-col">
          <div className="flex justify-between items-start mb-sm">
            <div className="p-2 bg-primary text-on-primary rounded-lg">
              <span className="material-symbols-outlined">emergency</span>
            </div>
          </div>
          <p className="font-label-md text-label-md text-primary uppercase tracking-wider">{t.emergenciesToday}</p>
          <p className="font-headline-md text-headline-md text-on-surface dark:text-inverse-on-surface mt-xs">03</p>
        </div>

        {/* Stat Card 6: Revenue */}
        <div className="bg-surface-container-lowest dark:bg-on-surface/5 p-sm rounded-xl border border-outline-variant dark:border-outline/30 soft-shadow flex flex-col">
          <div className="flex justify-between items-start mb-sm">
            <div className="p-2 bg-surface-container-low dark:bg-on-surface/10 rounded-lg text-primary dark:text-primary-fixed-dim">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="font-label-md text-label-md text-primary-container bg-on-primary-container px-2 py-1 rounded-full">+8%</span>
          </div>
          <p className="font-label-md text-label-md text-secondary dark:text-outline-variant uppercase tracking-wider">{t.revenueMonth}</p>
          <p className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface mt-1">₹ 4.2L</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Left Column (Larger) */}
        <div className="lg:col-span-2 space-y-gutter">
          {/* Chart Area: Trends */}
          <div className="bg-surface-container-lowest dark:bg-on-surface/5 rounded-xl border border-outline-variant dark:border-outline/30 soft-shadow p-md lg:p-lg h-[350px] flex flex-col transition-colors">
            <div className="flex justify-between items-center mb-md">
              <div>
                <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">{t.patientGrowth}</h3>
                <p className="font-body-md text-body-md text-secondary dark:text-outline-variant text-sm">{t.monthlyOverview}</p>
              </div>
              <div className="flex gap-xs">
                <button className="px-3 py-1 bg-surface-container dark:bg-on-surface/10 text-on-surface-variant dark:text-inverse-on-surface font-label-md rounded-md hover:bg-surface-container-high transition">{t.week}</button>
                <button className="px-3 py-1 bg-primary dark:bg-primary-container text-on-primary dark:text-on-primary-container font-label-md rounded-md soft-shadow">{t.month}</button>
              </div>
            </div>
            <div className="flex-1 w-full relative bg-surface-bright dark:bg-on-surface/5 rounded-lg border border-surface-container dark:border-outline/20 overflow-hidden flex items-end px-4 gap-2 pb-4">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-4 py-4">
                <div className="w-full h-px bg-surface-container dark:bg-outline/10"></div>
                <div className="w-full h-px bg-surface-container dark:bg-outline/10"></div>
                <div className="w-full h-px bg-surface-container dark:bg-outline/10"></div>
                <div className="w-full h-px bg-surface-container dark:bg-outline/10"></div>
                <div className="w-full h-px bg-surface-container-high dark:bg-outline/20"></div>
              </div>
              <div className="relative z-10 w-full flex justify-between items-end h-[80%]">
                <div className="w-[8%] h-[30%] bg-primary/20 dark:bg-outline/20 rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Jan: 120</div>
                </div>
                <div className="w-[8%] h-[45%] bg-primary/20 dark:bg-outline/20 rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Feb: 145</div>
                </div>
                <div className="w-[8%] h-[40%] bg-primary/20 dark:bg-outline/20 rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Mar: 135</div>
                </div>
                <div className="w-[8%] h-[60%] bg-primary/20 dark:bg-outline/20 rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Apr: 190</div>
                </div>
                <div className="w-[8%] h-[55%] bg-primary/20 dark:bg-outline/20 rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">May: 175</div>
                </div>
                <div className="w-[8%] h-[80%] bg-primary dark:bg-primary-container rounded-t-sm hover:bg-primary-container transition-colors cursor-pointer group relative shadow-md">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Jun: 240</div>
                </div>
              </div>
            </div>
            <div className="flex justify-between px-4 mt-2 font-label-md text-secondary dark:text-outline-variant">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="bg-surface-container-lowest dark:bg-on-surface/5 rounded-xl border border-outline-variant dark:border-outline/30 soft-shadow p-md flex items-center justify-between">
              <div>
                <p className="font-label-md text-label-md text-secondary dark:text-outline-variant mb-1 uppercase tracking-wide">{t.pendingPayments}</p>
                <h4 className="font-title-lg text-title-lg text-error">₹ 45,000</h4>
                <p className="font-body-md text-xs text-on-surface-variant dark:text-outline-variant mt-1">{t.fromPatients}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-error-container/30 flex items-center justify-center text-error">
                <span className="material-symbols-outlined">pending_actions</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest dark:bg-on-surface/5 rounded-xl border border-outline-variant dark:border-outline/30 soft-shadow p-md flex items-center justify-between">
              <div>
                <p className="font-label-md text-label-md text-secondary dark:text-outline-variant mb-1 uppercase tracking-wide">{t.insuranceClaims}</p>
                <h4 className="font-title-lg text-title-lg text-primary dark:text-primary-fixed-dim">₹ 1.2L</h4>
                <p className="font-body-md text-xs text-on-surface-variant dark:text-outline-variant mt-1">{t.claimsProcessing}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-surface-container-low dark:bg-on-surface/10 flex items-center justify-center text-primary dark:text-primary-fixed-dim">
                <span className="material-symbols-outlined">health_and_safety</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-gutter flex flex-col h-full">
          {/* Improved Quick Actions */}
          <div className="bg-surface-container-lowest dark:bg-on-surface/5 rounded-xl border border-outline-variant dark:border-outline/30 soft-shadow p-md">
            <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface mb-md">{t.quickActions}</h3>
            <div className="grid grid-cols-2 gap-sm">
              <button 
                onClick={() => navigate('/patients/register')}
                className="flex flex-col items-center justify-center p-sm bg-white dark:bg-on-surface/10 border border-outline-variant dark:border-outline/20 rounded-lg hover:border-primary hover:bg-surface-container-low dark:hover:bg-on-surface/20 transition-colors group"
              >
                <span className="material-symbols-outlined text-secondary dark:text-outline-variant group-hover:text-primary dark:group-hover:text-primary-fixed-dim mb-1">person_add</span>
                <span className="font-label-md text-xs text-on-surface dark:text-inverse-on-surface text-center">{t.registerPatient}</span>
              </button>
              <button 
                onClick={() => navigate('/patients')}
                className="flex flex-col items-center justify-center p-sm bg-white dark:bg-on-surface/10 border border-outline-variant dark:border-outline/20 rounded-lg hover:border-primary hover:bg-surface-container-low dark:hover:bg-on-surface/20 transition-colors group"
              >
                <span className="material-symbols-outlined text-secondary dark:text-outline-variant group-hover:text-primary dark:group-hover:text-primary-fixed-dim mb-1">event_available</span>
                <span className="font-label-md text-xs text-on-surface dark:text-inverse-on-surface text-center">{t.bookAppt}</span>
              </button>
              <button 
                onClick={() => navigate('/admissions')}
                className="flex flex-col items-center justify-center p-sm bg-white dark:bg-on-surface/10 border border-outline-variant dark:border-outline/20 rounded-lg hover:border-primary hover:bg-surface-container-low dark:hover:bg-on-surface/20 transition-colors group"
              >
                <span className="material-symbols-outlined text-secondary dark:text-outline-variant group-hover:text-primary dark:group-hover:text-primary-fixed-dim mb-1">hotel</span>
                <span className="font-label-md text-xs text-on-surface dark:text-inverse-on-surface text-center">{t.createAdmission}</span>
              </button>
              <button 
                onClick={() => navigate('/billing')}
                className="flex flex-col items-center justify-center p-sm bg-white dark:bg-on-surface/10 border border-outline-variant dark:border-outline/20 rounded-lg hover:border-primary hover:bg-surface-container-low dark:hover:bg-on-surface/20 transition-colors group"
              >
                <span className="material-symbols-outlined text-secondary dark:text-outline-variant group-hover:text-primary dark:group-hover:text-primary-fixed-dim mb-1">receipt</span>
                <span className="font-label-md text-xs text-on-surface dark:text-inverse-on-surface text-center">{t.generateBill}</span>
              </button>
              <button 
                onClick={() => navigate('/laboratory')}
                className="flex flex-col items-center justify-center p-sm bg-white dark:bg-on-surface/10 border border-outline-variant dark:border-outline/20 rounded-lg hover:border-primary hover:bg-surface-container-low dark:hover:bg-on-surface/20 transition-colors group"
              >
                <span className="material-symbols-outlined text-secondary dark:text-outline-variant group-hover:text-primary dark:group-hover:text-primary-fixed-dim mb-1">science</span>
                <span className="font-label-md text-xs text-on-surface dark:text-inverse-on-surface text-center">{t.addLabReport}</span>
              </button>
              <button 
                onClick={() => navigate('/delivery')}
                className="flex flex-col items-center justify-center p-sm bg-white dark:bg-on-surface/10 border border-outline-variant dark:border-outline/20 rounded-lg hover:border-primary hover:bg-surface-container-low dark:hover:bg-on-surface/20 transition-colors group"
              >
                <span className="material-symbols-outlined text-secondary dark:text-outline-variant group-hover:text-primary dark:group-hover:text-primary-fixed-dim mb-1">note_add</span>
                <span className="font-label-md text-xs text-on-surface dark:text-inverse-on-surface text-center">{t.createDelivery}</span>
              </button>
            </div>
          </div>

          {/* Recent Activities Feed */}
          <div className="bg-surface-container-lowest dark:bg-on-surface/5 rounded-xl border border-outline-variant dark:border-outline/30 soft-shadow p-md flex-1 flex flex-col transition-colors">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">{t.recentActivity}</h3>
              <button className="text-primary dark:text-primary-fixed-dim text-xs font-label-md hover:underline">{t.viewAll}</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div className="bg-error-container/30 dark:bg-error-container/10 border border-error-container dark:border-error/30 rounded-lg p-sm flex gap-sm items-start relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
                <div className="bg-error text-on-error rounded-full p-1 mt-1 shrink-0"><span className="material-symbols-outlined text-[16px]">warning</span></div>
                <div>
                  <p className="font-label-md text-label-md text-on-error-container dark:text-error">{t.emergencyAlert}</p>
                  <p className="font-body-md text-xs text-on-surface-variant dark:text-outline-variant mt-1">{t.emergencyAlertDesc}</p>
                  <p className="text-[10px] text-error mt-1 font-label-md">{t.justNow}</p>
                </div>
              </div>
              <div className="flex gap-sm items-start relative pb-4 border-b border-surface-container-highest dark:border-outline/20 last:border-0 last:pb-0">
                <div className="bg-surface-container-high dark:bg-on-surface/10 text-primary dark:text-primary-fixed-dim rounded-full p-1 shrink-0 z-10"><span className="material-symbols-outlined text-[16px]">person_add</span></div>
                <div className="absolute left-[14px] top-6 bottom-[-16px] w-px bg-surface-container-high dark:bg-outline/20 z-0"></div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface dark:text-inverse-on-surface">{t.newPatientReg}</p>
                  <p className="font-body-md text-xs text-on-surface-variant dark:text-outline-variant mt-1">{t.newPatientRegDesc}</p>
                  <p className="text-[10px] text-secondary dark:text-outline-variant mt-1 font-label-md">{t.minsAgo}</p>
                </div>
              </div>
              <div className="flex gap-sm items-start relative pb-4 border-b border-surface-container-highest dark:border-outline/20 last:border-0 last:pb-0">
                <div className="bg-tertiary-fixed dark:bg-tertiary-container text-tertiary dark:text-on-tertiary-container rounded-full p-1 shrink-0 z-10"><span className="material-symbols-outlined text-[16px]">biotech</span></div>
                <div className="absolute left-[14px] top-6 bottom-[-16px] w-px bg-surface-container-high dark:bg-outline/20 z-0"></div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface dark:text-inverse-on-surface">{t.labReportAvailable}</p>
                  <p className="font-body-md text-xs text-on-surface-variant dark:text-outline-variant mt-1">{t.labReportAvailableDesc}</p>
                  <p className="text-[10px] text-secondary dark:text-outline-variant mt-1 font-label-md">{t.labReportTime}</p>
                </div>
              </div>
              <div className="flex gap-sm items-start relative pb-4 border-b border-surface-container-highest dark:border-outline/20 last:border-0 last:pb-0">
                <div className="bg-surface-container-high dark:bg-on-surface/10 text-primary dark:text-primary-fixed-dim rounded-full p-1 shrink-0 z-10"><span className="material-symbols-outlined text-[16px]">hotel</span></div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface dark:text-inverse-on-surface">{t.admissionCreated}</p>
                  <p className="font-body-md text-xs text-on-surface-variant dark:text-outline-variant mt-1">{t.admissionCreatedDesc}</p>
                  <p className="text-[10px] text-secondary dark:text-outline-variant mt-1 font-label-md">{t.hoursAgo}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
