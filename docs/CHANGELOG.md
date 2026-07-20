# Changelog

All notable changes to Numorph will be documented in this file.

## 0.2.0 - 2026-07-19

- Tuned the canonical digit motion against SwiftUI numeric text transitions.
- Added smooth interruption handling for rapid updates without layered digit buildup.
- Fixed idle-tab animation state and preserved left-to-right staggering between updates.
- Animated formatted symbols and layout movement as first-class number parts.
- Removed the preset API in favor of one polished default with direct timing overrides.
- Added browser regression tests and CI coverage for motion behavior.

## 0.1.x - Initial releases

- Initial React package API with `Numorph` default and named exports.
- Added animated digit transitions, formatted part transitions, and timing controls.
- Added vanilla controller entry at `numorph/vanilla`.
- Added docs for formatting, OTP slots, accessibility, reduced motion, and motion tuning.
