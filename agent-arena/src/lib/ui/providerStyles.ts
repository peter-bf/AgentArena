import { ModelType } from '@/types';

export const PROVIDER_LABELS: Record<ModelType, string> = {
  gpt: 'OpenAI',
  deepseek: 'DeepSeek',
  gemini: 'Gemini',
};

export const PROVIDER_STYLES: Record<ModelType, {
  text: string;
  border: string;
  bg: string;
  badge: string;
  chip: string;
}> = {
  gpt: {
    text: 'text-green-400',
    border: 'border-green-500',
    bg: 'bg-green-500/10',
    badge: 'bg-green-500/20 text-green-300',
    chip: 'bg-green-500',
  },
  deepseek: {
    text: 'text-blue-400',
    border: 'border-blue-500',
    bg: 'bg-blue-500/10',
    badge: 'bg-blue-500/20 text-blue-300',
    chip: 'bg-blue-500',
  },
  gemini: {
    text: 'text-yellow-400',
    border: 'border-yellow-500',
    bg: 'bg-yellow-500/10',
    badge: 'bg-yellow-500/20 text-yellow-300',
    chip: 'bg-yellow-400',
  },
};
