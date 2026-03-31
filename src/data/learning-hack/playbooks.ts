import type { PowerVerbRow, SimplePhrase } from "@/types/learning-hack";

/** Scope creep, diplomatic no, buying time */
export const TENSION_PHRASES: SimplePhrase[] = [
  {
    id: "TEN-01",
    en: "I love this idea, but adding [new_feature] will push our sprint deadline by [timeframe]. Should we prioritize this over [current_task]?",
    fa: "ایده عالیه، اما اضافه کردن [new_feature] ددلاین اسپرینت رو به اندازهٔ [timeframe] عقب می‌ندازه. اولویت بدیم بهش به جای [current_task]؟",
    tags: ["scope"],
    metadata: { tone: "collaborative", use_case: "scope_creep" },
  },
  {
    id: "TEN-02",
    en: "From a purely UX perspective, doing [requested_change] introduces a lot of friction. Could we stick to [your_design] for the MVP?",
    fa: "از دید UX، انجام [requested_change] اصطکاک زیادی می‌سازه. می‌شه برای MVP روی [your_design] بمونیم؟",
    tags: ["pushback"],
    metadata: { tone: "assertive", use_case: "diplomatic_no" },
  },
  {
    id: "TEN-03",
    en: "That's a tricky edge case. Let me map out the flow offline and get back to you by [deadline].",
    fa: "این یه اِج‌کیسِ پیچیده‌ست. بذار آفلاین فلو رو مپ کنم و تا [deadline] برگردم.",
    tags: ["time"],
    metadata: { tone: "collaborative", use_case: "buy_time" },
  },
];

/** Transition & filler — buy time, piggyback, pivot */
export const TRANSITION_PHRASES: SimplePhrase[] = [
  {
    id: "TR-01",
    en: "That's a really interesting point — let me think about how to approach that for a second.",
    fa: "نکتهٔ خیلی جالبیه — بذارید یه لحظه فکر کنم از چه زاویه‌ای بهش نزدیک بشم.",
    metadata: { use_case: "buy_time", tone: "collaborative" },
  },
  {
    id: "TR-02",
    en: "To piggyback on what [name] just said, I think we should also consider [topic].",
    fa: "پیرو حرفی که [name] زد، فکر می‌کنم [topic] رو هم باید در نظر بگیریم.",
    metadata: { use_case: "transition", tone: "collaborative" },
  },
  {
    id: "TR-03",
    en: "Pivoting slightly to the UI side — the main thing I want to highlight here is…",
    fa: "با یه چرخش کوچیک به سمت UI — نکته‌ای که اینجا می‌خوام جلو ببرم اینه که…",
    metadata: { use_case: "topic_change", tone: "collaborative" },
  },
  {
    id: "TR-04",
    en: "Building on that, I'd add that from a user's perspective…",
    fa: "روی همون ادامه بدم، از نگاه کاربر…",
    metadata: { use_case: "transition", tone: "collaborative" },
  },
  {
    id: "TR-05",
    en: "If I could jump in here — one nuance worth calling out is…",
    fa: "اگه بشه یه حرف وسط بزنم — یه ظرافتی که ارزش داره بهش اشاره کنم…",
    metadata: { use_case: "interjection", tone: "collaborative" },
  },
  {
    id: "TR-06",
    en: "So to recap where we are — [summary]. Does that match your understanding?",
    fa: "پس یه جمع‌بندی از جایی که هستیم — [summary]. با برداشت شما هم‌خوانه؟",
    metadata: { use_case: "alignment", tone: "collaborative" },
  },
  {
    id: "TR-07",
    en: "Just to level-set for everyone — [context].",
    fa: "فقط برای هم‌سطح‌سازی همه — [context].",
    metadata: { use_case: "alignment", tone: "formal" },
  },
];

/** Emergency / communication recovery */
export const EMERGENCY_PHRASES: SimplePhrase[] = [
  {
    id: "EM-01",
    en: "I want to make sure I caught all the nuances there. Could you reiterate that last part?",
    fa: "می‌خوام مطمئن بشم همهٔ ظرافت‌ها رو گرفتم. می‌شه بخش آخر رو یک بار دیگه بگید؟",
    metadata: { use_case: "clarify", tone: "formal" },
  },
  {
    id: "EM-02",
    en: "My connection was a bit spotty for a second — did you mean [your_guess]?",
    fa: "یه لحظه اینترنتم ناپایدار بود — منظورتون [your_guess] بود؟",
    metadata: { use_case: "audio", tone: "collaborative" },
  },
  {
    id: "EM-03",
    en: "Looking at the time, should we park this and jump back to the main agenda?",
    fa: "با توجه به وقت، این رو فعلاً پارک کنیم و برگردیم سر دستور جلسه؟",
    metadata: { use_case: "facilitation", tone: "collaborative" },
  },
  {
    id: "EM-04",
    en: "Sorry, I didn't quite catch that — could you say it once more, a bit slower?",
    fa: "ببخشید کامل نگرفتم — می‌شه یک بار دیگه، کمی آرام‌تر تکرار کنید؟",
    metadata: { use_case: "clarify", tone: "casual" },
  },
  {
    id: "EM-05",
    en: "Could you run that by me one more time? I want to be sure I understood.",
    fa: "می‌شه یک بار دیگه همون رو برام تکرار کنی؟ می‌خوام مطمئن بشم درست فهمیدم.",
    metadata: { use_case: "clarify", tone: "collaborative" },
  },
];

/** Blameless accountability */
export const ACCOUNTABILITY_PHRASES: SimplePhrase[] = [
  {
    id: "AC-01",
    en: "Thanks for catching that. I take full ownership of this oversight. I'm actively working on a fix and will update you by [time].",
    fa: "ممنون که دیدید. مسئولیت این کوتاهی رو کامل می‌پذیرم. دارم روش کار می‌کنم و تا [time] آپدیت می‌دم.",
    metadata: { tone: "formal", use_case: "accountability" },
  },
  {
    id: "AC-02",
    en: "Good catch. Let's course-correct this immediately.",
    fa: "دید خوبی بود. بیا همین الان مسیر رو اصلاح کنیم.",
    metadata: { tone: "assertive", use_case: "accountability" },
  },
  {
    id: "AC-03",
    en: "You're right — I missed that in the handoff. Here's how I'll prevent it next time: [action].",
    fa: "درست می‌گید — تو هندآف جا افتاده بود. دفعهٔ بعد اینطور جلوش رو می‌گیرم: [action].",
    metadata: { tone: "formal", use_case: "accountability" },
  },
];

/** Performance review & self-advocacy */
export const SELF_ADVOCACY_PHRASES: SimplePhrase[] = [
  {
    id: "SA-01",
    en: "Over the last [timeframe], I spearheaded the [project_name], which directly contributed to a [number]% increase in [metric].",
    fa: "تو [timeframe] گذشته، من [project_name] رو پیش بردم که مستقیم به افزایش [number]٪ در [metric] کمک کرد.",
    metadata: { tone: "strategic", use_case: "performance_review" },
  },
  {
    id: "SA-02",
    en: "Looking at the scope of my current responsibilities, I'd like to outline a clear path toward the [target_role] position.",
    fa: "با توجه به دامنهٔ مسئولیت‌های فعلی‌ام، دوست دارم مسیر مشخصی به سمت نقش [target_role] ترسیم کنیم.",
    metadata: { tone: "formal", use_case: "growth" },
  },
  {
    id: "SA-03",
    en: "I've put together a business case for adopting [tool_name]. The ROI in terms of saved design hours makes it highly justifiable.",
    fa: "برای استفاده از [tool_name] یه بیزینس‌کیس آماده کردم. ROI از نظر ساعت‌های ذخیره‌شده برای دیزاین، منطقش رو قوی می‌کنه.",
    metadata: { tone: "strategic", use_case: "budget" },
  },
  {
    id: "SA-04",
    en: "I'd like to discuss compensation / leveling in the context of [context].",
    fa: "دوست دارم دربارهٔ جبران خدمت / لولینگ در بستر [context] صحبت کنیم.",
    metadata: { tone: "formal", use_case: "compensation" },
  },
];

/** Timezone diplomacy */
export const TIMEZONE_PHRASES: SimplePhrase[] = [
  {
    id: "TZ-01",
    en: "Since I'm wrapping up my day here, I've left the latest iterations in Figma. They'll be ready for your review when you log on tomorrow morning.",
    fa: "چون دارم روزم رو اینجا تموم می‌کنم، آخرین ایترِیت‌ها رو تو فیگما گذاشتم. فردا صبح که لاگین کنید برای ریویو آماده‌ان.",
    metadata: { tone: "collaborative", use_case: "async" },
  },
  {
    id: "TZ-02",
    en: "I know we have a significant timezone overlap gap. I can accommodate an early morning or late evening call on my end to make this sync happen.",
    fa: "می‌دونم همپوشانی زمانی کم داریم. از طرف خودم می‌تونم یه تماس زود صبح یا دیروقت هماهنگ کنم که جلسه انجام بشه.",
    metadata: { tone: "collaborative", use_case: "scheduling" },
  },
  {
    id: "TZ-03",
    en: "I'll async the detailed notes in Slack so you're unblocked before your day starts.",
    fa: "جزئیات رو async تو اسلک می‌ذارم که قبل از شروع روزتون بلاک نمونید.",
    metadata: { tone: "collaborative", use_case: "async" },
  },
];

export const POWER_VERB_ROWS: PowerVerbRow[] = [
  {
    id: "PV-1",
    category_en: "Creation & strategy",
    category_fa: "خلق و استراتژی",
    weak: "I made a new user flow.",
    strong: "I architected a new user flow.",
  },
  {
    id: "PV-2",
    category_en: "Creation & strategy",
    category_fa: "خلق و استراتژی",
    weak: "I designed the components.",
    strong: "I crafted the UI components.",
  },
  {
    id: "PV-3",
    category_en: "Improvement",
    category_fa: "بهبود",
    weak: "I changed the checkout page.",
    strong: "I streamlined the checkout page.",
  },
  {
    id: "PV-4",
    category_en: "Improvement",
    category_fa: "بهبود",
    weak: "I fixed the hierarchy.",
    strong: "I refined the visual hierarchy.",
  },
  {
    id: "PV-5",
    category_en: "Analysis & data",
    category_fa: "تحلیل و دیتا",
    weak: "I checked other apps.",
    strong: "I benchmarked this feature against industry standards.",
  },
  {
    id: "PV-6",
    category_en: "Analysis & data",
    category_fa: "تحلیل و دیتا",
    weak: "I looked at the design system.",
    strong: "I audited the current design system.",
  },
  {
    id: "PV-7",
    category_en: "Ownership",
    category_fa: "مالکیت",
    weak: "I started the E2E testing project.",
    strong: "I'm spearheading the E2E testing strategy.",
  },
  {
    id: "PV-8",
    category_en: "Ownership",
    category_fa: "مالکیت",
    weak: "I supported the initiative.",
    strong: "I championed this initiative.",
  },
  {
    id: "PV-9",
    category_en: "Presentation",
    category_fa: "ارائه",
    weak: "I want to show you the screens.",
    strong: "I'd like to walk you through the screens.",
  },
  {
    id: "PV-10",
    category_en: "Presentation",
    category_fa: "ارائه",
    weak: "Let's talk about the problem.",
    strong: "Let's unpack this problem.",
  },
  {
    id: "PV-11",
    category_en: "Creation & strategy",
    category_fa: "خلق و استراتژی",
    weak: "I made the prototype.",
    strong: "I conceptualized and built the prototype.",
  },
  {
    id: "PV-12",
    category_en: "Improvement",
    category_fa: "بهبود",
    weak: "I changed a lot of things.",
    strong: "I overhauled the flow end to end.",
  },
  {
    id: "PV-13",
    category_en: "Improvement",
    category_fa: "بهبود",
    weak: "I made the page faster.",
    strong: "I optimized performance on that page.",
  },
  {
    id: "PV-14",
    category_en: "Analysis & data",
    category_fa: "تحلیل و دیتا",
    weak: "I read the research notes.",
    strong: "I synthesized findings from the research.",
  },
  {
    id: "PV-15",
    category_en: "Ownership",
    category_fa: "مالکیت",
    weak: "I helped run the workshop.",
    strong: "I facilitated the workshop.",
  },
  {
    id: "PV-16",
    category_en: "Ownership",
    category_fa: "مالکیت",
    weak: "I shipped the feature.",
    strong: "I landed the feature with zero regressions.",
  },
  {
    id: "PV-17",
    category_en: "Collaboration",
    category_fa: "همکاری",
    weak: "I talked to the engineers.",
    strong: "I synced with engineering on feasibility.",
  },
  {
    id: "PV-18",
    category_en: "Collaboration",
    category_fa: "همکاری",
    weak: "I helped the team.",
    strong: "I unblocked the team on the accessibility rollout.",
  },
  {
    id: "PV-19",
    category_en: "Resolution",
    category_fa: "رفع مشکل",
    weak: "I fixed the bug.",
    strong: "I ironed out the edge cases in production.",
  },
  {
    id: "PV-20",
    category_en: "Presentation",
    category_fa: "ارائه",
    weak: "Let's align on next steps.",
    strong: "Let's align on next steps and owners.",
  },
];
