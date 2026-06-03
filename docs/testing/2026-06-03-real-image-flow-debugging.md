# 2026-06-03 Real Image Flow Debugging

## Scope

This note records a desktop real-AI flow test with a user-provided 4032 x 3024 JPEG workbook photo. The raw image, API key, full provider response, and temporary crop files are not committed.

## Flow Tested

- Baseline `recognizeQuestion` with `subject: "auto"` on the image.
- Baseline `recognizeQuestion` with explicit `subject: "math"` on the image.
- Real Qwen region detection prompt against the full image.
- Adapter-level detect -> crop -> recognize flow using the selected highest-confidence region.
- Focused regression tests for React subject selection, reducer region selection, Qwen region detection, and title fallback.

## Issues Found

- The upload-page subject buttons were visual only. Selecting `数学` did not change app state, so the real recognition request still used `subject: "auto"`.
- With the real image, Qwen recognition in `auto` mode failed because the provider did not return a valid `subject`; the same image succeeded when the request explicitly used `subject: "math"`.
- `detectRegions` in the Qwen adapter returned a fixed hardcoded candidate instead of calling the provider, so real automatic region detection was not actually being tested.
- Qwen returned region coordinates in a 0-1000 coordinate style even though the prompt asked for 0-1 ratios. The adapter needed to normalize both shapes.
- Provider region labels can be long problem text and should not be used directly as UI labels.
- When multiple subquestion candidates are returned, the app needs a larger whole-question candidate and should default to the highest-confidence candidate, not blindly the second array item.
- If region detection cannot parse candidates, the flow should remain recoverable through a full-image candidate and manual adjustment.
- If the provider returns an empty title, the review page should use `识别草稿` instead of showing a blank title.

## Fix Summary

- Made subject selection an actual app state transition and accessible radio group.
- Passed the selected subject into desktop real-AI recognition.
- Replaced Qwen `detectRegions` fixed boxes with a provider call and a region-detection prompt.
- Normalized provider boxes from either 0-1 ratios or Qwen-style 0-1000 coordinates.
- Standardized UI labels to `AI 候选 N`, added a synthesized `整题候选`, and kept `整张图片候选` as fallback.
- Changed default region selection to highest confidence.
- Added empty-candidate recovery messaging.
- Added nonblank title fallback for Qwen recognition drafts.

## Real Image Evidence

After the fixes, the same image produced these sanitized adapter-level results:

- `detectRegions`: ok; candidates included `整题候选`, `AI 候选 1`, `AI 候选 2`, and `整张图片候选`.
- Highest-confidence candidate: `整题候选`.
- Simulated crop for `整题候选`: approximately `x=161`, `y=683`, `width=3709`, `height=1612` on the original 4032 x 3024 image.
- `recognizeQuestion` with `subject: "math"`: ok; returned a math draft with `识别草稿` title fallback, nonempty question text, visible student-answer text, and review items requiring manual review.

Known limitation: this is still an experimental Qwen flow. The model can extract student writing into `studentAnswer`, and the app still requires human review before saving.
