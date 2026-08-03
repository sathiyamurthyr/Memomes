/**
 * Web Audio API Chime Synthesizer & Multi-Sensory Audio Utility
 * 
 * Bridges into FeedbackEngine to deliver soft, low-volume golden chimes
 * with native haptic vibration integration.
 */

import { FeedbackEngine } from './feedbackEngine';

export function playSuccessChime(isMuted = false) {
  if (isMuted) return;
  FeedbackEngine.trigger('level3_major');
}

export function playSubtleClick() {
  FeedbackEngine.trigger('level1_subtle');
}

export function playNormalSuccess() {
  FeedbackEngine.trigger('level2_success');
}

export function playWarningTone() {
  FeedbackEngine.trigger('level4_warning');
}

export function playErrorTone() {
  FeedbackEngine.trigger('level5_critical');
}
