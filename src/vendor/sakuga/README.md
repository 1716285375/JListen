# Sakuga VFX integration

Source: https://github.com/finktheartist/sakuga-vfx
Commit: c3dabb173928a3ad2372183103caf2e6f50953d0
Copyright (c) 2026 Justin Finkelman. MIT license included in LICENSE.

All eleven component modules are used (the gallery has twelve entries because primary and secondary buttons share a module). Duplicated embedded cores are removed; modules import the shared core. Local fixes make springs settle immediately for reduced motion and disconnect the tabs ResizeObserver.

SakugaControl.tsx bridges custom-element properties and events into React. The header uses tooltip; readings use toggle; the study journal uses tabs, input, rating, checkbox, radio, slider, progress, both button variants and toast. Progress counts saved practice marks; done() runs only after localStorage succeeds. Existing native playback controls retain their semantics and use the shared effects adapter.

Detached controls release their back-canvas layers; reconnecting restores them. All controls load on demand.

The journal has been removed. Components now power existing search, transcript modes, readings, volume, playback progress, speed selection and dictation controls. Rating is intentionally unused because this application has no scoring or saved learning records.
