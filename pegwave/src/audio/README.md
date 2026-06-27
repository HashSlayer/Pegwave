# Audio

Two-layer design for a future VST port:

| File | Layer | Notes |
|------|-------|-------|
| `noteCore.ts` | **Pure** | Collision → `NoteEvent`. No DOM, no Web Audio. Port this to C++/JUCE unchanged. |
| `synth.ts` | **Impure** | Renders `NoteEvent` via Web Audio oscillators + planet reverb from `pegwave/planetPlinko.ts`. |

UI menu sounds live in `../sound/`, not here.
