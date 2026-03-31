/** Rich template — matches proposed FluentFlows / Learning Hack schema */

export type TemplateTone =
  | "formal"
  | "collaborative"
  | "assertive"
  | "casual"
  | "strategic";

export type TemplateMetadata = {
  tone?: TemplateTone | TemplateTone[];
  meeting_type?: string[];
  use_case?: string;
  /** Optional slug for future TTS / pronunciation hooks */
  audio_slug?: string;
};

export type VariableMap = Record<string, string[]>;

export type HackTemplate = {
  id: string;
  pattern_en: string;
  pattern_fa: string;
  variables: VariableMap;
  metadata?: TemplateMetadata;
};

export type HackCategory = {
  id: string;
  title_en: string;
  title_fa: string;
  source?: string;
  templates: HackTemplate[];
};

/** Fixed bilingual line (50 design-review openers, closers, etc.) */
export type DesignPhrase = {
  id: string;
  section_id: DesignReviewSectionId;
  en: string;
  fa: string;
  metadata?: TemplateMetadata;
};

export type DesignReviewSectionId =
  | "opening_context"
  | "presenting_design"
  | "defending_why"
  | "handling_pushback"
  | "talking_to_devs"
  | "closing_next_steps";

export type DesignReviewSection = {
  id: DesignReviewSectionId;
  title_en: string;
  title_fa: string;
};

export type GlossaryEntry = {
  id: string;
  pack_id: string;
  term: string;
  definition_en: string;
  definition_fa: string;
  example_en?: string;
};

export type PowerVerbRow = {
  id: string;
  category_en: string;
  category_fa: string;
  weak: string;
  strong: string;
  note_fa?: string;
};

export type SimplePhrase = {
  id: string;
  en: string;
  fa: string;
  tags?: string[];
  metadata?: TemplateMetadata;
};
