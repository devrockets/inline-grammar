export type PresetId = 'clear' | 'formal' | 'friendly' | 'concise';

export type Preset = {
  id: PresetId;
  label: string;
  description: string;
  instruction: string;
};

export const presets = [
  {
    id: 'clear',
    label: 'Clear',
    description: 'Fix grammar while preserving the original tone.',
    instruction: 'Correct grammar and spelling with minimal tone changes.',
  },
  {
    id: 'formal',
    label: 'Formal',
    description: 'Make writing polished and professional.',
    instruction: 'Correct the text and make it suitable for professional communication.',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Make writing warm, natural, and approachable.',
    instruction: 'Correct the text and make it sound warm and natural.',
  },
  {
    id: 'concise',
    label: 'Concise',
    description: 'Make writing shorter and more direct.',
    instruction: 'Correct the text and make it concise without losing meaning.',
  },
] as const satisfies Preset[];

export const defaultPresetId: PresetId = 'clear';

export function isPresetId(value: unknown): value is PresetId {
  return typeof value === 'string' && presets.some((preset) => preset.id === value);
}

export function getPreset(id: PresetId): Preset {
  return presets.find((preset) => preset.id === id) ?? presets[0];
}
