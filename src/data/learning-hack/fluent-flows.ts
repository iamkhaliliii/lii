import type { HackCategory } from "@/types/learning-hack";

/** FluentFlows-style variable templates — v1.0 + v1.1 merged */
export const FLUENT_FLOW_CATEGORIES: HackCategory[] = [
  {
    id: "small_talk",
    title_en: "Small talk & icebreakers",
    title_fa: "گپ و گفت اولیه و یخ‌شکن",
    source: "FluentFlows 1.0",
    templates: [
      {
        id: "ST-01",
        pattern_en: "How's the weather over there in [city] today?",
        pattern_fa: "امروز هوای [city] چطوره؟",
        variables: {
          city: ["Toronto", "Vancouver", "Montreal", "Calgary"],
        },
        metadata: { tone: "casual", meeting_type: ["standup", "1on1"] },
      },
      {
        id: "ST-02",
        pattern_en: "Did you guys do anything exciting over the [timeframe]?",
        pattern_fa: "آیا تو [timeframe] کار هیجان‌انگیزی کردید؟",
        variables: {
          timeframe: ["weekend", "holidays", "break", "long weekend"],
        },
        metadata: { tone: "casual" },
      },
    ],
  },
  {
    id: "setting_context",
    title_en: "Setting the context",
    title_fa: "ارائهٔ پیش‌زمینه و هدف جلسه",
    source: "FluentFlows 1.0",
    templates: [
      {
        id: "CTX-01",
        pattern_en:
          "Today, I want to walk you through the new [deliverable] for the [feature].",
        pattern_fa: "امروز می‌خوام [deliverable] جدید برای [feature] رو باهاتون مرور کنم.",
        variables: {
          deliverable: [
            "user flow",
            "wireframes",
            "hi-fi prototype",
            "design system updates",
          ],
          feature: [
            "onboarding process",
            "checkout page",
            "dashboard",
            "user profile",
          ],
        },
        metadata: {
          tone: "formal",
          meeting_type: ["design_review"],
          use_case: "opening",
        },
      },
      {
        id: "CTX-02",
        pattern_en:
          "The main goal of this iteration is to improve [metric] by reducing [friction_point].",
        pattern_fa: "هدف اصلی این نسخه، بهبود [metric] از طریق کاهش [friction_point] است.",
        variables: {
          metric: [
            "user retention",
            "conversion rate",
            "accessibility",
            "task completion time",
          ],
          friction_point: [
            "cognitive load",
            "number of clicks",
            "visual clutter",
            "load time",
          ],
        },
        metadata: { tone: "strategic" },
      },
    ],
  },
  {
    id: "defending_design",
    title_en: "Defending design logic",
    title_fa: "دفاع از منطق دیزاین",
    source: "FluentFlows 1.0",
    templates: [
      {
        id: "DEF-01",
        pattern_en:
          "I chose this [ui_element] because it creates a better [ux_principle] for the user.",
        pattern_fa: "من این [ui_element] رو انتخاب کردم چون [ux_principle] بهتری برای کاربر ایجاد می‌کنه.",
        variables: {
          ui_element: [
            "layout structure",
            "color palette",
            "navigation pattern",
            "typography scale",
          ],
          ux_principle: [
            "visual hierarchy",
            "sense of orientation",
            "readability",
            "consistency",
          ],
        },
        metadata: { tone: "assertive", use_case: "rationale" },
      },
      {
        id: "DEF-02",
        pattern_en:
          "Based on our [data_source], this approach perfectly addresses the [user_pain_point].",
        pattern_fa: "بر اساس [data_source] ما، این رویکرد دقیقاً [user_pain_point] رو حل می‌کنه.",
        variables: {
          data_source: [
            "user interviews",
            "heatmap data",
            "A/B test results",
            "analytics",
          ],
          user_pain_point: [
            "drop-off rate",
            "confusion on this screen",
            "navigation issues",
            "lack of trust",
          ],
        },
        metadata: { tone: "strategic", use_case: "data" },
      },
    ],
  },
  {
    id: "handling_pushback_ff",
    title_en: "Handling pushback (templates)",
    title_fa: "مدیریت مخالفت‌ها و فیدبک",
    source: "FluentFlows 1.0",
    templates: [
      {
        id: "PUSH-01",
        pattern_en:
          "I understand your concern about the [concern_topic]. How about we [action_proposal] to be sure?",
        pattern_fa: "نگرانی شما در مورد [concern_topic] رو درک می‌کنم. چطوره برای اطمینان [action_proposal]؟",
        variables: {
          concern_topic: [
            "development time",
            "visual complexity",
            "brand alignment",
            "edge cases",
          ],
          action_proposal: [
            "run a quick usability test",
            "create a quick prototype",
            "discuss it with the devs",
            "review the data again",
          ],
        },
        metadata: { tone: "collaborative", use_case: "de_escalate" },
      },
    ],
  },
  {
    id: "tech_handoff",
    title_en: "Engineering & E2E handoff",
    title_fa: "هماهنگی با تیم فنی و تست",
    source: "FluentFlows 1.0",
    templates: [
      {
        id: "TECH-01",
        pattern_en:
          "Does the current API support pulling this [data_type] dynamically without affecting [tech_metric]?",
        pattern_fa:
          "آیا API فعلی پشتیبانی می‌کنه که این [data_type] رو بدون تأثیر روی [tech_metric] به صورت داینامیک فراخوانی کنیم؟",
        variables: {
          data_type: [
            "user metadata",
            "transaction history",
            "notification status",
            "product images",
          ],
          tech_metric: [
            "page load speed",
            "database performance",
            "state management",
            "server limits",
          ],
        },
        metadata: { tone: "collaborative", meeting_type: ["sprint_planning"] },
      },
      {
        id: "TECH-02",
        pattern_en:
          "Before handoff, I want to make sure our E2E testing covers this specific [scenario].",
        pattern_fa: "قبل از تحویل کار، می‌خوام مطمئن بشم که تست E2E ما این [scenario] خاص رو کاور می‌کنه.",
        variables: {
          scenario: ["empty state", "error handling", "offline mode", "success flow"],
        },
        metadata: { tone: "formal", use_case: "qa" },
      },
    ],
  },
  {
    id: "next_steps",
    title_en: "Wrapping up",
    title_fa: "جمع‌بندی و قدم‌های بعدی",
    source: "FluentFlows 1.0",
    templates: [
      {
        id: "WRAP-01",
        pattern_en:
          "I will update the [file_type] and share the link in [platform] by [deadline].",
        pattern_fa: "من [file_type] رو آپدیت می‌کنم و لینکش رو تا [deadline] تو [platform] می‌فرستم.",
        variables: {
          file_type: ["Figma file", "Jira ticket", "PRD document", "prototype link"],
          platform: ["Slack", "the Jira comments", "Teams", "our group chat"],
          deadline: ["end of day today", "tomorrow morning", "our next sync", "Friday"],
        },
        metadata: { tone: "formal", use_case: "follow_up" },
      },
    ],
  },
  // —— v1.1 ——
  {
    id: "manager_sync_opening",
    title_en: "1-on-1 opening & rapport",
    title_fa: "شروع جلسهٔ دو نفره و یخ‌شکن",
    source: "FluentFlows 1.1",
    templates: [
      {
        id: "1ON1-01",
        pattern_en: "Hey [manager_name], how's your [timeframe] shaping up so far?",
        pattern_fa: "سلام [manager_name]، [timeframe] تو تا الان چطور پیش رفته؟",
        variables: {
          manager_name: ["John", "Sarah", "Alex"],
          timeframe: ["week", "Monday", "morning", "Thursday"],
        },
        metadata: { tone: "casual", meeting_type: ["1on1"] },
      },
      {
        id: "1ON1-02",
        pattern_en:
          "It's pretty [weather_state] here today. How are things on your end in [location]?",
        pattern_fa: "امروز اینجا هوا خیلی [weather_state]. اوضاع اونجا تو [location] چطوره؟",
        variables: {
          weather_state: ["hot", "sunny", "humid", "nice"],
          location: ["Canada", "Toronto", "Vancouver", "your area"],
        },
        metadata: { tone: "casual" },
      },
      {
        id: "1ON1-03",
        pattern_en:
          "I've got a few things on my agenda, but is there anything specific you want to cover [time_context]?",
        pattern_fa: "من چند تا مورد تو لیستم دارم، اما چیز خاصی هست که بخوای [time_context] بررسی کنیم؟",
        variables: {
          time_context: ["first", "today", "in this sync", "before we start"],
        },
        metadata: { tone: "collaborative" },
      },
    ],
  },
  {
    id: "status_updates",
    title_en: "Sprint status & updates",
    title_fa: "آپدیت دادن از وضعیت کارها",
    source: "FluentFlows 1.1",
    templates: [
      {
        id: "STAT-01",
        pattern_en:
          "Since our last sync, I've completely wrapped up the [task_type] for the [feature_name].",
        pattern_fa: "از جلسهٔ قبلی‌مون تا الان، من [task_type] رو برای [feature_name] کاملاً تموم کردم.",
        variables: {
          task_type: [
            "high-fidelity UI",
            "wireframes",
            "prototyping",
            "E2E design review",
          ],
          feature_name: [
            "dashboard",
            "checkout flow",
            "accounting module",
            "user profile",
          ],
        },
        metadata: { tone: "formal", meeting_type: ["standup"] },
      },
      {
        id: "STAT-02",
        pattern_en:
          "I'm currently prioritizing the [primary_task] over the [secondary_task] to meet the sprint goal.",
        pattern_fa: "من در حال حاضر [primary_task] رو به [secondary_task] اولویت دادم تا به هدف اسپرینت برسیم.",
        variables: {
          primary_task: [
            "core user flow",
            "main navigation",
            "design system updates",
          ],
          secondary_task: [
            "edge cases",
            "empty states",
            "micro-interactions",
          ],
        },
        metadata: { tone: "strategic" },
      },
      {
        id: "STAT-03",
        pattern_en:
          "Everything is on track, but I'm slightly blocked on the [blocker_type]. Could you help me unblock this?",
        pattern_fa: "همه‌چیز طبق برنامه‌است، اما سر [blocker_type] کمی گیر کردم. می‌تونی کمک کنی اینو باز کنیم؟",
        variables: {
          blocker_type: [
            "copywriting",
            "API documentation",
            "feedback from the dev team",
            "product requirements",
          ],
        },
        metadata: { tone: "collaborative", use_case: "blocker" },
      },
    ],
  },
  {
    id: "presenting_to_manager",
    title_en: "Showing work & screen sharing",
    title_fa: "ارائهٔ کار به مدیر و اسکرین‌شیر",
    source: "FluentFlows 1.1",
    templates: [
      {
        id: "SHOW-01",
        pattern_en:
          "Let me share my screen. I want to get your thoughts on the [design_element] I've been working on.",
        pattern_fa: "بذار اسکرین‌شیر کنم. می‌خوام نظرت رو دربارهٔ [design_element] که روش کار می‌کردم بدونم.",
        variables: {
          design_element: [
            "new layout",
            "interaction model",
            "user journey",
            "component behavior",
          ],
        },
        metadata: { tone: "collaborative", use_case: "demo" },
      },
      {
        id: "SHOW-02",
        pattern_en:
          "I took your feedback from last time and updated the [ui_section]. It feels much more [adjective] now.",
        pattern_fa: "من فیدبک دفعهٔ پیشت رو اِعمال کردم و [ui_section] رو آپدیت کردم. الان خیلی [adjective] به نظر می‌رسه.",
        variables: {
          ui_section: [
            "header navigation",
            "CTA buttons",
            "spacing and typography",
            "color hierarchy",
          ],
          adjective: ["intuitive", "cleaner", "consistent", "accessible"],
        },
        metadata: { tone: "collaborative" },
      },
      {
        id: "SHOW-03",
        pattern_en:
          "The main challenge here was [design_challenge], but I think this approach solves it elegantly.",
        pattern_fa: "چالش اصلی اینجا [design_challenge] بود، اما فکر می‌کنم این رویکرد به زیبایی حلش می‌کنه.",
        variables: {
          design_challenge: [
            "reducing the cognitive load",
            "fitting all this data",
            "maintaining visual balance",
            "simplifying the steps",
          ],
        },
        metadata: { tone: "assertive" },
      },
    ],
  },
  {
    id: "collaborative_feedback",
    title_en: "Receiving feedback & iterating",
    title_fa: "دریافت فیدبک و هم‌فکری",
    source: "FluentFlows 1.1",
    templates: [
      {
        id: "FDBK-01",
        pattern_en:
          "That's a great catch. I'll definitely tweak the [design_property] right after this call.",
        pattern_fa: "نکتهٔ خیلی خوبی بود. من حتماً بلافاصله بعد از این تماس [design_property] رو اصلاح می‌کنم.",
        variables: {
          design_property: ["margins", "visual weight", "alignment", "component states"],
        },
        metadata: { tone: "collaborative" },
      },
      {
        id: "FDBK-02",
        pattern_en:
          "Are you suggesting we [alternative_action] instead of what we currently have?",
        pattern_fa: "آیا پیشنهادت اینه که به جای چیزی که الان داریم، [alternative_action]؟",
        variables: {
          alternative_action: [
            "use a modal",
            "hide this section",
            "make it a dropdown",
            "simplify the copy",
          ],
        },
        metadata: { tone: "collaborative", use_case: "clarify" },
      },
      {
        id: "FDBK-03",
        pattern_en:
          "I completely agree. Let me iterate on this and drop a quick [asset_type] in Slack for you later today.",
        pattern_fa: "کاملاً موافقم. اجازه بده روی این کار کنم و امروز یه [asset_type] سریع تو اسلک برات بفرستم.",
        variables: {
          asset_type: [
            "Loom video",
            "Figma link",
            "updated screenshot",
            "prototype link",
          ],
        },
        metadata: { tone: "collaborative", use_case: "follow_up" },
      },
    ],
  },
  {
    id: "career_and_support",
    title_en: "Mentorship & career growth",
    title_fa: "منتورشیپ و توسعهٔ فردی",
    source: "FluentFlows 1.1",
    templates: [
      {
        id: "GROW-01",
        pattern_en:
          "I feel really confident about the [hard_skill], but I'd love your mentorship on improving my [soft_skill].",
        pattern_fa: "من روی [hard_skill] خیلی اعتمادبه‌نفس دارم، اما خیلی دوست دارم برای بهبود [soft_skill] ازت منتورشیپ بگیرم.",
        variables: {
          hard_skill: [
            "prototyping",
            "UX architecture",
            "design systems",
            "E2E logic",
          ],
          soft_skill: [
            "presentation skills",
            "stakeholder management",
            "communication clarity",
            "product strategy",
          ],
        },
        metadata: { tone: "collaborative", meeting_type: ["1on1"] },
      },
      {
        id: "GROW-02",
        pattern_en:
          "Thanks for supporting me with [support_topic]. Knowing you have my back really helps me focus.",
        pattern_fa: "ممنون که تو [support_topic] ازم حمایت می‌کنی. اینکه می‌دونم پشتمی واقعاً کمکم می‌کنه تمرکز کنم.",
        variables: {
          support_topic: [
            "the language barrier",
            "this complex project",
            "my transition",
            "aligning with the devs",
          ],
        },
        metadata: { tone: "collaborative" },
      },
    ],
  },
  {
    id: "verbal_async_hacks",
    title_en: "Verbal & async hacks",
    title_fa: "هک‌های زبانی و غیرهمزمان",
    source: "FluentFlows / Learning Hack spec",
    templates: [
      {
        id: "VH-01",
        pattern_en: "Let's put a pin in [topic] for now and revisit it [when].",
        pattern_fa: "بیا موضوع [topic] رو فعلاً پین کنیم و [when] دوباره برگردیم بهش.",
        variables: {
          topic: [
            "that API change",
            "the animation scope",
            "dark mode",
            "localization",
          ],
          when: [
            "after the MVP ships",
            "in next week's sync",
            "once we have metrics",
            "when design signs off",
          ],
        },
        metadata: { tone: "collaborative", use_case: "parking_topic" },
      },
      {
        id: "VH-02",
        pattern_en:
          "I'll drop a quick [asset] in [channel] so you're unblocked before your day starts.",
        pattern_fa: "یه [asset] سریع تو [channel] می‌ذارم که قبل از شروع روزتون بلاک نمونید.",
        variables: {
          asset: ["Loom", "Figma link", "annotated screenshot", "written summary"],
          channel: ["Slack", "the thread", "Notion", "email"],
        },
        metadata: { tone: "collaborative", use_case: "async_handoff" },
      },
      {
        id: "VH-03",
        pattern_en:
          "Thanks for making time. Today I'd like to walk you through [deliverable] and get your feedback on [focus_area].",
        pattern_fa: "ممنون که وقت گذاشتید. امروز می‌خوام [deliverable] رو باهاتون مرور کنم و فیدبکتون رو روی [focus_area] بگیرم.",
        variables: {
          deliverable: [
            "the revised flows",
            "the design system updates",
            "the research synthesis",
          ],
          focus_area: [
            "information hierarchy",
            "mobile behavior",
            "accessibility",
            "copy tone",
          ],
        },
        metadata: { tone: "formal", use_case: "meeting_open" },
      },
      {
        id: "VH-04",
        pattern_en:
          "Could we stick to [scope] for this sprint and track [stretch] as a follow-up?",
        pattern_fa: "می‌شه برای این اسپرینت به [scope] بچسبیم و [stretch] رو به‌عنوان فالوآپ ترک کنیم؟",
        variables: {
          scope: ["the agreed MVP", "the core journey", "P0 bugs only"],
          stretch: ["nice-to-haves", "polish", "edge cases", "experiments"],
        },
        metadata: { tone: "collaborative", use_case: "scope_guard" },
      },
    ],
  },
];
