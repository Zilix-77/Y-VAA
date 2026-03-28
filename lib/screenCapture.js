import * as ScreenCapture from 'expo-screen-capture';

/**
 * Turns on FLAG_SECURE-style blocking (screenshots/recents thumbnail limited on Android).
 * Call when a student enters an active quiz; call allow when they leave.
 */
export async function preventQuizScreenshots() {
  await ScreenCapture.preventScreenCaptureAsync();
}

/**
 * Re-enables normal screen capture (e.g. teacher dashboard or home).
 */
export async function allowScreenshotsAgain() {
  await ScreenCapture.allowScreenCaptureAsync();
}
