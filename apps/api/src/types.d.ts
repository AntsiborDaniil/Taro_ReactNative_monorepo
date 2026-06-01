export type TDefaultInputParameters = {
  language: string;
};

export type TDefaultTarotCardParameters = {
  card: string;
  direction: string;
};

// расклады
export type TarotPosition = {
  label: string;
  description?: string;
} & TDefaultTarotCardParameters;

export type TarotSpreadInput = {
  spread_type: string;
  question: string;
  positions: TarotPosition[];
} & TDefaultInputParameters;

export type TarotInterpretationOutput = {
  interpretation: string;
};

// мотивация

export type TMoodAndEnergyInput = {
  params: { mood: number; energy: number; stress: number };
  card: TDefaultTarotCardParameters;
} & TDefaultInputParameters;

export type THabitsInput = {
  params?: { badHabits: string[]; goodHabits: string[] };
  card: TDefaultTarotCardParameters;
} & TDefaultInputParameters;

export type TMoodAndEnergyOutput = {
  interpretation: string;
};
