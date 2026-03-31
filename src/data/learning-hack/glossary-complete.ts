/**
 * Full glossary extracted from the original Learning Hack / FluentFlows spec:
 * 50 UX+product + 50 corporate comm + 50 strategy/senior (15 packs × 10).
 */
import type { GlossaryEntry } from "@/types/learning-hack";

export const GLOSSARY_PACK_LABELS: Record<string, { en: string; fa: string }> = {
  ux_user_flow: { en: "UX & user flow", fa: "تجربه کاربر و فلو" },
  ui_visual: { en: "UI & visual system", fa: "رابط و سیستم بصری" },
  strategy_process: { en: "Strategy & process", fa: "استراتژی و فرایند" },
  engineering_e2e: { en: "Engineering & E2E", fa: "فنی و تست انتها به انتها" },
  business_metrics: { en: "Business & metrics", fa: "بیزینس و متریک" },
  comm_alignment: { en: "Communication & alignment", fa: "ارتباط و هم‌سویی" },
  time_scope: { en: "Time & scope", fa: "زمان و دامنه" },
  analysis: { en: "Analysis & strategy", fa: "تحلیل و استراتژی" },
  execution: { en: "Execution & action", fa: "اجرای کار" },
  idioms_metaphor: { en: "Corporate idioms", fa: "استعاره‌های کُرپوریت" },
  product_strategy: { en: "Product strategy", fa: "استراتژی محصول" },
  persuasion: { en: "Persuasion & negotiation", fa: "متقاعدسازی" },
  feedback_critique: { en: "Feedback & critique", fa: "فیدبک و نقد" },
  agile_collab: { en: "Agile & dev collaboration", fa: "اجایل و همکاری فنی" },
  senior_idioms: { en: "Senior leadership idioms", fa: "اصطلاحات سطح بالا" },
};

function g(
  pack: string,
  suffix: string,
  term: string,
  definition_en: string,
  definition_fa: string,
  example_en?: string
): GlossaryEntry {
  return {
    id: `${pack}_${suffix}`,
    pack_id: pack,
    term,
    definition_en,
    definition_fa,
    example_en,
  };
}

export const GLOSSARY_ENTRIES_COMPLETE: GlossaryEntry[] = [
  // —— UX & user flow (10) ——
  g("ux_user_flow", "01", "Friction", "Anything that slows users or adds effort in a flow.", "مانع یا سختی اضافه در مسیر کاربر.", "We should reduce friction at checkout."),
  g("ux_user_flow", "02", "Cognitive load", "Mental effort needed to understand or use an interface.", "بار ذهنی برای فهم رابط.", "Dense dashboards raise cognitive load."),
  g("ux_user_flow", "03", "Intuitive", "Understandable without explicit training.", "بدون آموزش قابل فهم.", "The flow feels intuitive on mobile."),
  g("ux_user_flow", "04", "Seamless", "Smooth, continuous experience across steps.", "تجربه روان بدون قطع بین مراحل.", "We want a seamless upgrade path."),
  g("ux_user_flow", "05", "Pain point", "A concrete user problem to solve.", "نقطه درد یا مشکل واقعی کاربر.", "Long forms were a key pain point."),
  g("ux_user_flow", "06", "Edge case", "Uncommon scenario the product should still handle.", "سناریوی نادر ولی باید پوشش داده شود.", "Very long names are an edge case."),
  g("ux_user_flow", "07", "Happy path", "Ideal journey with no errors.", "مسیر ایده‌آل بدون خطا.", "Happy path works; add error states."),
  g("ux_user_flow", "08", "Drop-off", "Users abandoning a funnel step.", "ریزش کاربر در یک مرحله.", "Drop-off spikes on step three."),
  g("ux_user_flow", "09", "Onboarding", "Guiding new users into the product.", "راه‌اندازی و آشنایی کاربر جدید.", "We simplified onboarding copy."),
  g("ux_user_flow", "10", "Retention", "Keeping users coming back over time.", "حفظ بازگشت کاربر در زمان.", "Retention improved after the redesign."),

  // —— UI & visual (10) ——
  g("ui_visual", "01", "Visual hierarchy", "Ordering elements so importance is clear visually.", "اولویت‌بندی بصری عناصر.", "CTA wins visual hierarchy on this screen."),
  g("ui_visual", "02", "Consistency", "Same patterns and components across the product.", "ثبات الگوها در کل محصول.", "Consistency with the design system matters."),
  g("ui_visual", "03", "Whitespace (negative space)", "Empty space that lets the layout breathe.", "فضای خالی برای تنفس بصری.", "More whitespace improved scanability."),
  g("ui_visual", "04", "Accessibility (a11y)", "Design inclusive of disabilities and assistive tech.", "دسترسی‌پذیری برای همه.", "We improved contrast for a11y."),
  g("ui_visual", "05", "Affordance", "Visual cues that suggest how to interact.", "اشاره بصری به نحوه تعامل.", "Buttons should afford clicking."),
  g("ui_visual", "06", "Micro-interaction", "Small motion or feedback in the UI.", "بازخورد ریز در رابط.", "Subtle micro-interactions on hover."),
  g("ui_visual", "07", "Component states", "Hover, active, disabled, focus, error, etc.", "حالت‌های مختلف یک کامپوننت.", "Document all component states in Figma."),
  g("ui_visual", "08", "Contrast", "Difference in color/light for readability.", "تضاد رنگ برای خوانایی.", "Contrast fails WCAG on this text."),
  g("ui_visual", "09", "Typography scale", "Consistent type sizes (H1, body, etc.).", "مقیاس یکنواخت تایپ.", "We aligned to a single typography scale."),
  g("ui_visual", "10", "Modularity", "Reusable, composable UI pieces.", "قطعات قابل استفاده مجدد.", "Modularity speeds up the build."),

  // —— Strategy & process (10) ——
  g("strategy_process", "01", "Iteration", "Repeated cycles of improve-and-ship.", "چرخه‌های پیاپی بهبود.", "This is our third iteration."),
  g("strategy_process", "02", "Alignment", "Shared goals and understanding across people.", "هم‌سو بودن اهداف.", "We need alignment with PM before build."),
  g("strategy_process", "03", "Trade-off", "Choosing one benefit over another.", "بده‌بستان بین گزینه‌ها.", "Density vs. simplicity is a trade-off."),
  g("strategy_process", "04", "Scope creep", "Requirements growing without control.", "بزرگ شدن ناگهانی دامنه کار.", "Let's guard against scope creep."),
  g("strategy_process", "05", "Benchmark", "Compare against industry or competitors.", "مقایسه با استاندارد یا رقیب.", "We benchmarked against three apps."),
  g("strategy_process", "06", "Heuristic evaluation", "Expert review against UX heuristics.", "ارزیابی بر اساس اصول UX.", "Heuristic evaluation found 6 issues."),
  g("strategy_process", "07", "Stakeholder", "Anyone with interest or influence on the outcome.", "ذی‌نفع یا ذی‌تأثیر.", "Stakeholders signed off yesterday."),
  g("strategy_process", "08", "MVP", "Minimum product to learn from real usage.", "حداقل محصول برای یادگیری.", "Ship the MVP, then iterate."),
  g("strategy_process", "09", "Deliverable", "Tangible output you hand off.", "خروجی قابل تحویل.", "Figma specs are the deliverable."),
  g("strategy_process", "10", "Agile", "Iterative delivery with short cycles.", "تحویل چابک در اسپرینت.", "We're running two-week agile sprints."),

  // —— Engineering & E2E (10) ——
  g("engineering_e2e", "01", "Feasibility", "Whether build is realistic with constraints.", "امکان‌سنجی فنی.", "We need a feasibility check on realtime sync."),
  g("engineering_e2e", "02", "Handoff", "Passing design to engineering to implement.", "تحویل دیزاین به توسعه.", "Handoff includes specs and tokens."),
  g("engineering_e2e", "03", "Tech debt", "Shortcuts that cost speed or quality later.", "بدهی فنی از میانبرها.", "We’ll pay down tech debt next quarter."),
  g("engineering_e2e", "04", "Refactoring", "Restructure code/design without changing behavior outwardly.", "بازآرایی بدون تغییر ظاهری رفتار.", "Refactoring won’t change the UI."),
  g("engineering_e2e", "05", "End-to-end (E2E)", "Test full flows like a real user.", "تست کل مسیر مثل کاربر واقعی.", "E2E covers signup to checkout."),
  g("engineering_e2e", "06", "Scalability", "System handles growth in load or data.", "مقیاس‌پذیری با رشد بار.", "We questioned scalability of polling."),
  g("engineering_e2e", "07", "Quality assurance (QA)", "Process to find defects before release.", "تضمین کیفیت و تست باگ.", "QA found a regression in search."),
  g("engineering_e2e", "08", "Regression", "Old features break after new changes.", "خراب شدن بخش قبلی بعد از تغییر جدید.", "This deploy caused a regression."),
  g("engineering_e2e", "09", "Implementation", "Building the design in code.", "پیاده‌سازی در کد.", "Implementation matches specs at 95%."),
  g("engineering_e2e", "10", "API constraints", "Backend limits that shape the UI.", "محدودیت‌های API روی رابط.", "Pagination exists because of API constraints."),

  // —— Business & metrics (10) ——
  g("business_metrics", "01", "Conversion rate", "Share of users who complete a target action.", "نسبت انجام اقدام هدف.", "We improved conversion on the form."),
  g("business_metrics", "02", "Churn rate", "Rate users stop using the product.", "نرخ ترک محصول.", "Churn dropped after onboarding fixes."),
  g("business_metrics", "03", "Value proposition", "Why users should pick you over alternatives.", "ارزش پیشنهادی نسبت به رقیب.", "Our value proposition is speed."),
  g("business_metrics", "04", "KPI", "Key numeric indicator of success.", "شاخص کلیدی عملکرد.", "Activation is our north-star KPI."),
  g("business_metrics", "05", "ROI", "Return on investment of time or money.", "بازگشت سرمایه.", "The ROI on this tool is clear."),
  g("business_metrics", "06", "Engagement", "How actively users interact.", "میزان تعامل فعال.", "Engagement rose after notifications."),
  g("business_metrics", "07", "Adoption rate", "How fast users pick up a feature.", "سرعت پذیرش یک فیچر.", "Adoption of the new tab is slow."),
  g("business_metrics", "08", "Persona", "Archetype representing a user segment.", "شخصیت نمونه از یک سگمنت.", "We designed for the “busy manager” persona."),
  g("business_metrics", "09", "Bounce rate", "Users leaving quickly without acting.", "نرخ خروج سریع از صفحه.", "High bounce on the landing variant A."),
  g("business_metrics", "10", "Conversion funnel", "Multi-step path to a goal (e.g. purchase).", "قیف چندمرحله‌ای تا هدف.", "We optimized the conversion funnel."),

  // —— Communication & alignment (10) ——
  g("comm_alignment", "01", "Touch base", "Have a quick check-in or update.", "هماهنگی یا آپدیت کوتاه.", "Let's touch base tomorrow."),
  g("comm_alignment", "02", "Sync (up)", "Align or meet briefly to coordinate.", "هماهنگ شدن در جلسه کوتاه.", "We need a sync before the review."),
  g("comm_alignment", "03", "On the same page", "Agreeing on goals or facts.", "هم‌فهم و هم‌سو بودن.", "I want us on the same page on scope."),
  g("comm_alignment", "04", "Buy-in", "Support or approval from others.", "موافقت و همراهی ذی‌نفعان.", "We need leadership buy-in."),
  g("comm_alignment", "05", "Circle back", "Return to a topic later.", "برگشت به موضوع بعداً.", "I'll circle back after legal reviews."),
  g("comm_alignment", "06", "Take offline", "Discuss details outside the current meeting.", "ادامه بحث خارج از جلسه.", "Let's take the edge cases offline."),
  g("comm_alignment", "07", "Loop in", "Include someone in email or chat thread.", "وارد کردن کسی به گفتگو.", "Loop in Sarah on the thread."),
  g("comm_alignment", "08", "Ping", "Send a quick message (Slack, etc.).", "پیام کوتاه زدن.", "Ping me when you're free."),
  g("comm_alignment", "09", "Echo", "Agree by repeating someone’s point.", "تأیید با تکرار نکته دیگری.", "To echo what Alex said, I agree."),
  g("comm_alignment", "10", "Sounding board", "Someone you test ideas on.", "کسی برای تست ایده.", "Can I use you as a sounding board?"),

  // —— Time & scope (10) ——
  g("time_scope", "01", "Bandwidth", "Capacity (time or focus) for more work.", "ظرفیت زمانی یا ذهنی.", "I don't have bandwidth this week."),
  g("time_scope", "02", "Hard stop", "Fixed time you must leave.", "پایان قطعی زمان جلسه.", "I have a hard stop at 3."),
  g("time_scope", "03", "Timebox", "Limit discussion or work to a fixed duration.", "محدود کردن زمان یک بخش.", "Let's timebox this to 5 minutes."),
  g("time_scope", "04", "Backburner", "Lower priority for now.", "اولویت پایین فعلاً.", "We'll put animations on the backburner."),
  g("time_scope", "05", "Table (a topic)", "Postpone discussion formally.", "موکول کردن بحث.", "Let's table the redesign until Q3."),
  g("time_scope", "06", "Push back", "Delay a deadline or resist a request politely.", "عقب انداختن یا مخالفت محترمانه.", "I need to push back the date by two days."),
  g("time_scope", "07", "ETA", "Estimated time of completion or arrival.", "زمان تقریبی تحویل.", "What's your ETA on the spec?"),
  g("time_scope", "08", "Heads down", "Deep focus, minimal interruptions.", "تمرکز عمیق بدون مزاحمت.", "I'm heads down on the prototype today."),
  g("time_scope", "09", "Wrap up", "Close the meeting or task.", "جمع‌بندی و پایان.", "Let's wrap up—two minutes left."),
  g("time_scope", "10", "Tentative", "Provisional, may change.", "موقت و قابل تغییر.", "Let's keep Thursday tentative."),

  // —— Analysis (10) ——
  g("analysis", "01", "Deep dive", "Thorough exploration of one topic.", "بررسی عمیق یک موضوع.", "We'll deep dive into analytics next."),
  g("analysis", "02", "High-level", "Broad summary without fine detail.", "نگاه کلی بدون جزئیات.", "Give me a high-level overview."),
  g("analysis", "03", "Granular", "Very detailed level.", "سطح بسیار جزئی.", "We don't need granular specs yet."),
  g("analysis", "04", "Big picture", "Overall goals beyond local details.", "تصویر بزرگ و هدف کلان.", "Keep the big picture in mind."),
  g("analysis", "05", "Root cause", "Underlying reason for a problem.", "علت ریشه‌ای مشکل.", "We need the root cause of the bug."),
  g("analysis", "06", "Roadblock / blocker", "Something stopping progress.", "مانع پیشرفت.", "Any blockers on your side?"),
  g("analysis", "07", "Bottleneck", "Step where work piles up.", "گلوگاه کندکننده.", "Review is the bottleneck."),
  g("analysis", "08", "Workaround", "Temporary fix until a real solution.", "راه‌حل موقت.", "We used a workaround for the API bug."),
  g("analysis", "09", "Moving parts", "Many variables or teams to coordinate.", "بخش‌های متحرک و وابسته.", "Too many moving parts this launch."),
  g("analysis", "10", "Leverage", "Use a resource or tool effectively.", "بهره‌گیری مؤثر از ابزار/نفر.", "We should leverage the design system."),

  // —— Execution (10) ——
  g("execution", "01", "Actionable", "Clear enough to act on.", "قابل اقدام عملی.", "We need actionable feedback."),
  g("execution", "02", "Game plan", "Concrete plan to execute.", "برنامه اجرایی.", "Here's our game plan for launch."),
  g("execution", "03", "Hit the ground running", "Start fast with momentum.", "شروع سریع با آمادگی.", "The new hire hit the ground running."),
  g("execution", "04", "Knock out", "Finish something quickly and well.", "تمام کردن سریع و تمیز.", "I'll knock out the icons tonight."),
  g("execution", "05", "Heavy lifting", "The hardest part of the work.", "بخش سنگین کار.", "Engineering did the heavy lifting."),
  g("execution", "06", "Point person", "Primary owner for a topic.", "مسئول اصلی موضوع.", "Jamie is the point person for billing."),
  g("execution", "07", "Wheelhouse", "Area of your strength.", "حوزه تخصص و قوت.", "E2E testing is in my wheelhouse."),
  g("execution", "08", "Traction", "Measurable forward progress or adoption.", "گرفتن شتاب و نتیجه ملموس.", "The feature is gaining traction."),
  g("execution", "09", "Streamline", "Remove friction and simplify.", "ساده و روان کردن.", "We streamlined the approval flow."),
  g("execution", "10", "Align", "Make consistent with goals.", "هم‌راستا کردن با هدف.", "Does this align with Q3 goals?"),

  // —— Idioms & metaphor (10) ——
  g("idioms_metaphor", "01", "Low-hanging fruit", "Easy wins with good payoff.", "میوه‌های دم‌دست و سودآور.", "Copy fixes are low-hanging fruit."),
  g("idioms_metaphor", "02", "Move the needle", "Create noticeable business impact.", "تأثیر ملموس روی نتیجه.", "Will this move the needle on revenue?"),
  g("idioms_metaphor", "03", "Boil the ocean", "Try to do something impossibly large.", "انجام کار غیرواقعی بزرگ.", "We can't boil the ocean in v1."),
  g("idioms_metaphor", "04", "Reinvent the wheel", "Redo solved work unnecessarily.", "دوباره کاری بی‌مورد.", "Use the library—don't reinvent the wheel."),
  g("idioms_metaphor", "05", "Push the envelope", "Go beyond usual limits; innovate.", "رفتن فراتر از مرز معمول.", "Their motion design pushes the envelope."),
  g("idioms_metaphor", "06", "Put out fires", "Handle urgent crises reactively.", "خاموش کردن آتش‌های فوری.", "I spent the day putting out fires."),
  g("idioms_metaphor", "07", "Elephant in the room", "Obvious issue people avoid naming.", "مسئله آشکار ناگفته.", "Budget is the elephant in the room."),
  g("idioms_metaphor", "08", "Get the ball rolling", "Start so momentum builds.", "شروع کار برای گرفتن غلتک.", "Let's get the ball rolling on research."),
  g("idioms_metaphor", "09", "Bite the bullet", "Do something unpleasant but necessary.", "قبول کردن کار سخت لازم.", "We'll bite the bullet and migrate."),
  g("idioms_metaphor", "10", "Brings to the table", "Skills or value someone contributes.", "چیزی که فرد به تیم اضافه می‌کند.", "She brings strong UX research to the table."),

  // —— Product strategy (10) ——
  g("product_strategy", "01", "North Star metric", "Single primary metric the org optimizes for.", "متریک قطب‌نمای سازمان.", "Activation is our North Star."),
  g("product_strategy", "02", "Proof of Concept (PoC)", "Cheap experiment to test feasibility.", "اثبات مفهوم قبل از ساخت کامل.", "We'll build a PoC for voice input."),
  g("product_strategy", "03", "Future-proof", "Designed to survive future scale or change.", "مقاوم در برابر تغییرات آینده.", "Tokens help future-proof the UI."),
  g("product_strategy", "04", "Cross-functional", "Spanning design, eng, PM, etc.", "چندرشته‌ای بین تیم‌ها.", "We need a cross-functional workshop."),
  g("product_strategy", "05", "Silo / siloed", "Teams isolated without shared context.", "ایزوله کار کردن تیم‌ها.", "Design and eng shouldn't work in silos."),
  g("product_strategy", "06", "Status quo", "Current state before change.", "وضع موجود.", "This disrupts the status quo."),
  g("product_strategy", "07", "Core differentiator", "Main thing that sets you apart.", "تمایز اصلی نسبت به رقیب.", "Speed is our core differentiator."),
  g("product_strategy", "08", "Cannibalization", "New offer hurts your existing product.", "هم‌خوری محصول جدید با قدیم.", "Could this cannibalize enterprise sales?"),
  g("product_strategy", "09", "Value-add", "Extra benefit beyond the baseline.", "ارزش افزوده غیر الزامی.", "Dark mode is a nice value-add."),
  g("product_strategy", "10", "Blind spot", "Gap the team failed to see.", "نقطه کور در دید تیم.", "We had a blind spot on older users."),

  // —— Persuasion (10) ——
  g("persuasion", "01", "Rationale", "Reasoning behind a decision.", "استدلال پشت تصمیم.", "Let me share the rationale for this layout."),
  g("persuasion", "02", "Advocate", "Publicly support a position (e.g. for users).", "حمایت فعال از یک دیدگاه.", "I have to advocate for accessibility here."),
  g("persuasion", "03", "Devil's advocate", "Argue against an idea to stress-test it.", "مخالف‌خوانی آزمایشی.", "Playing devil's advocate—what if offline?"),
  g("persuasion", "04", "Compromise", "Mutual give-and-take agreement.", "سازش دوطرفه.", "We found a compromise on animation."),
  g("persuasion", "05", "Middle ground", "Solution between two extremes.", "راه‌حل میانی بین دو افراط.", "Let's find middle ground on density."),
  g("persuasion", "06", "Non-negotiable", "Requirement you won't drop.", "خط قرمز غیرقابل چشم‌پوشی.", "WCAG AA is non-negotiable."),
  g("persuasion", "07", "Subjective", "Based on taste, not data.", "ذوقی و غیر عینی.", "Color preference can be subjective."),
  g("persuasion", "08", "Objective", "Based on facts and data.", "عینی و دیتامحور.", "Let's decide objectively with metrics."),
  g("persuasion", "09", "Consensus", "Broad agreement across the group.", "اجماع گروه.", "Did we reach consensus on scope?"),
  g("persuasion", "10", "Pushback (noun)", "Resistance or objections from others.", "مقاومت یا اعتراض محترمانه.", "I'm getting pushback on the timeline."),

  // —— Feedback & critique (10) ——
  g("feedback_critique", "01", "Constructive", "Feedback that helps improve.", "فیدبک سازنده و عملی.", "Thanks for the constructive notes."),
  g("feedback_critique", "02", "Nitpick", "Focus on tiny, arguably minor issues.", "گیر دادن به جزئیات خیلی ریز.", "Not to nitpick—this label is off."),
  g("feedback_critique", "03", "Tweak", "Small adjustment.", "تغییر ریز.", "Just a few visual tweaks."),
  g("feedback_critique", "04", "Nuance / nuanced", "Subtle distinctions that matter.", "ظرافت‌های مهم پنهان.", "There's nuance in how power users scan."),
  g("feedback_critique", "05", "Revamp", "Substantial redesign or rebuild.", "بازطراحی اساسی.", "We're revamping the settings area."),
  g("feedback_critique", "06", "Half-baked", "Incomplete or not thought through.", "نیمه‌پخته و ناقص.", "This flow still feels half-baked."),
  g("feedback_critique", "07", "Sanity check", "Quick review to catch obvious mistakes.", "چک سریع سلامت منطق.", "Can someone sanity-check the copy?"),
  g("feedback_critique", "08", "Tangible", "Concrete and measurable.", "ملموس و قابل اندازه‌گیری.", "We need tangible outcomes from the test."),
  g("feedback_critique", "09", "Gut feeling", "Intuition without hard data.", "حس شهودی بدون دیتا.", "My gut says users will skip this."),
  g("feedback_critique", "10", "Tear down", "Rigorous critique of a design/product.", "نقد عمیق و جزئی.", "Let's do a tear down of the competitor app."),

  // —— Agile & dev collaboration (10) ——
  g("agile_collab", "01", "Unblock", "Remove what stops someone’s progress.", "باز کردن گره کار.", "I'll unblock you with assets today."),
  g("agile_collab", "02", "Velocity", "Team throughput per sprint (often story points).", "سرعت تحویل تیم در اسپرینت.", "Scope might hurt sprint velocity."),
  g("agile_collab", "03", "Deprecate", "Phase out a feature or API.", "منسوخ کردن تدریجی.", "We'll deprecate the old endpoint."),
  g("agile_collab", "04", "Hardcode", "Fix values in code instead of data/config.", "ثابت نوشتن در کد به‌جای داینامیک.", "Don't hardcode error strings."),
  g("agile_collab", "05", "Corner case", "Extremely rare combination of conditions.", "حالت بسیار نادر ترکیبی.", "Treat it as a corner case for v2."),
  g("agile_collab", "06", "Band-aid solution", "Quick temporary fix.", "چسب زخم موقت.", "This modal is a band-aid until refactor."),
  g("agile_collab", "07", "Out of the loop", "Not informed about decisions.", "بی‌خبر از تصمیمات.", "I was out of the loop on the API change."),
  g("agile_collab", "08", "Cut corners", "Skip quality to go faster (risky).", "میانبر زدن با افت کیفیت.", "We can't cut corners on security."),
  g("agile_collab", "09", "Sprint backlog", "Agreed work for the current sprint.", "کارهای توافق‌شده اسپرینت.", "Is this bug in the sprint backlog?"),
  g("agile_collab", "10", "Catalyst", "Thing that accelerates positive change.", "کاتالیزور تغییر مثبت.", "The new system is a catalyst for speed."),

  // —— Senior idioms (10) ——
  g("senior_idioms", "01", "Drop the ball", "Fail to meet a responsibility.", "سوتی دادن در مسئولیت.", "I dropped the ball on that email."),
  g("senior_idioms", "02", "Get the green light", "Receive approval to proceed.", "گرفتن چراغ سبز.", "We got the green light from legal."),
  g("senior_idioms", "03", "Move the goalposts", "Change success criteria midstream.", "تغییر ناگهانی معیار موفقیت.", "The client keeps moving the goalposts."),
  g("senior_idioms", "04", "Back to the drawing board", "Start over after a failed approach.", "برگشت به نقشهٔ اولیه.", "Tests failed—back to the drawing board."),
  g("senior_idioms", "05", "Step up to the plate", "Take responsibility in a tough moment.", "پیشقدمی در شرایط سخت.", "She stepped up to plate on the outage."),
  g("senior_idioms", "06", "Up in the air", "Still undecided.", "بلاتکلیف و معلق.", "Budget is still up in the air."),
  g("senior_idioms", "07", "Read between the lines", "Infer unstated meaning.", "خواندن نانوشته‌ها.", "Reading between the lines, they're hesitant."),
  g("senior_idioms", "08", "Throw under the bus", "Blame someone to protect yourself.", "انداختن تقصیر به گردن دیگری.", "Don't throw the intern under the bus."),
  g("senior_idioms", "09", "Silver bullet", "Magic fix for a hard problem (often unrealistic).", "راه حل جادویی غیرواقعی.", "There's no silver bullet for retention."),
  g("senior_idioms", "10", "Play it by ear", "Decide as you go without a fixed plan.", "بداهه پیش رفتن.", "We'll play it by ear after the demo."),
];
