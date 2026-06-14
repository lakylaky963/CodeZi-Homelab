import Icon from '../components/Icon.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

const skillsList = [
  'JavaScript',
  'Java',
  'React',
  'Node.js',
  'Express',
  'HTML',
  'CSS',
  'MongoDB',
  'Full-stack Dev',
  'Security Logic',
]

const content = {
  en: {
    name: 'Avraham Arazi',
    title: 'Software Practical Engineer',
    location: 'Rishon LeZion',
    summaryHeader: 'Professional Summary',
    summary: 'Full-stack developer specializing in building complex websites from frontend to backend and database management. Experienced in crafting production-grade web solutions with a focus on clean logic and security architecture.',
    educationHeader: 'Education',
    educationTitle: 'Software Practical Engineer | Ort Rehovot',
    educationDesc: 'Final stages of the engineering degree. Holder of a Software Technician certificate from MAHAT.',
    experienceHeader: 'Experience',
    experience: [
      {
        role: 'Teaching Support',
        company: 'Rehovot Municipality',
        years: '3 Years Experience',
        bullets: [
          'Worked as part of the teaching staff, providing individual and classroom-wide tutoring to students.',
          'Assisted teachers in delivering study material in a clear and practical manner.',
        ],
      },
      {
        role: 'Independent Full-Stack Developer',
        company: 'Portfolio Projects',
        years: 'Present',
        bullets: [
          'Built end-to-end full-stack solutions including UI/UX planning (Frontend), server logic (Backend), and database management.',
          'Developed fully functional websites with cloud deployment and production-ready architecture.',
        ],
      },
    ],
  },
  he: {
    name: 'אברהם ארזי',
    title: 'הנדסאי תוכנה',
    location: 'ראשון לציון',
    summaryHeader: 'סיכום מקצועי',
    summary: 'מפתח פול-סטאק המתמחה בבניית אתרים מורכבים משלב הפרונט-אנד, דרך הבק-אנד ועד למסדי נתונים. בעל ניסיון ביצירת פתרונות אינטרנט ברמה גבוהה עם דגש על לוגיקה נקייה וארכיטקטורת אבטחה.',
    educationHeader: 'השכלה',
    educationTitle: 'הנדסאי תוכנה | אורט רחובות',
    educationDesc: 'סטודנט בשלב הסיום של לימודי הנדסאות תוכנה. בעל תעודת טכנאי תוכנה מטעם מה"ט.',
    experienceHeader: 'ניסיון מקצועי',
    experience: [
      {
        role: 'תומך הוראה',
        company: 'עיריית רחובות',
        years: '3 שנות ניסיון',
        bullets: [
          'עבודה שוטפת כחלק מסגל ההוראה, מתן תגבורים והדרכה אישית וכיתתית לתלמידים.',
          'סיוע למורים בהעברת חומר הלימוד בצורה ברורה ופרקטית.',
        ],
      },
      {
        role: 'מפתח פול-סטאק עצמאי',
        company: 'פרויקטי פורטפוליו',
        years: 'היום',
        bullets: [
          'בניית פתרונות פול-סטאק מקצה לקצה כולל תכנון ממשק משתמש, לוגיקת שרת וניהול בסיסי נתונים.',
          'פיתוח אתרים בעלי פונקציונליות מלאה המאוחסנים בענן.',
        ],
      },
    ],
  }
}

export default function Resume() {
  const { language, toggleLanguage } = useLanguage();
  const t = content[language];

  return (
    <section 
      dir={language === 'he' ? 'rtl' : 'ltr'}
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-4 gap-12 animate-in fade-in duration-700 ${language === 'he' ? 'text-right' : 'text-left'}`}
    >
      <aside className="lg:col-span-1 space-y-10">
        <div className="flex">
          <button
            type="button"
            onClick={toggleLanguage}
            className="grid h-10 px-4 place-items-center rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Toggle Language"
          >
            {language === "en" ? "עבור לעברית" : "Switch to English"}
          </button>
        </div>
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/40">AA</div>
          <h1 className="text-3xl font-bold text-slate-100 leading-tight">{t.name}</h1>
          <div className="space-y-1">
            <p className="text-indigo-400 text-sm font-bold">{t.title}</p>
            <p className="text-slate-400 text-xs">{t.location} | 053-6217719</p>
            <p className="text-slate-400 text-xs">liquidbrain27@gmail.com</p>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{t.educationDesc}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {skillsList.map(s => <span key={s} className="px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-[10px] font-bold text-slate-300 uppercase tracking-widest">{s}</span>)}
        </div>
      </aside>
      <div className="lg:col-span-3 space-y-12">
        <section className="space-y-6">
          <h2 className={`text-xs font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2 ${language === 'he' ? 'flex-row-reverse' : ''}`}>
            <Icon name="spark" size={14} /> {t.summaryHeader}
          </h2>
          <p className="text-xl text-slate-200 leading-relaxed font-medium">{t.summary}</p>
        </section>
        <section className="space-y-4">
          <h2 className={`text-xs font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2 ${language === 'he' ? 'flex-row-reverse' : ''}`}>
            <Icon name="database" size={14} /> {t.educationHeader}
          </h2>
          <h3 className="text-lg font-bold text-slate-100">{t.educationTitle}</h3>
          <p className="text-sm text-slate-400">{t.educationDesc}</p>
        </section>
        <section className="space-y-8">
          <h2 className={`text-xs font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2 ${language === 'he' ? 'flex-row-reverse' : ''}`}>
            <Icon name="code" size={14} /> {t.experienceHeader}
          </h2>
          <div className="space-y-10">
            {t.experience.map((exp) => (
              <div key={exp.role} className={`relative ${language === 'he' ? 'pr-8 border-r' : 'pl-8 border-l'} border-slate-700/50`}>
                <div className={`absolute w-3 h-3 rounded-full bg-indigo-500 top-1.5 ring-4 ring-slate-950 ${language === 'he' ? '-right-[6.5px]' : '-left-[6.5px]'}`} />
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-100">{exp.role}</h3>
                  <span className="text-xs font-mono text-slate-500">{exp.years}</span>
                </div>
                <div className="text-indigo-400 text-sm font-bold mb-4">{exp.company}</div>
                <ul className="space-y-2">
                  {exp.bullets.map(b => (
                    <li key={b} className={`text-sm text-slate-400 flex items-start gap-2 italic ${language === 'he' ? 'flex-row-reverse' : ''}`}>
                      <span>—</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
