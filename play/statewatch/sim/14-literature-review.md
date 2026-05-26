# Literature review — everything we've consulted

Compiled from the sources we've referenced across the conversation. Organized by category, with the actual links and short summaries of what each contributes.

---

## 1. Foundational theory

### David Harel — "Statecharts: A Visual Formalism for Complex Systems" (1987)
- [Science of Computer Programming, Vol 8](https://www.sciencedirect.com/science/article/pii/0167642387900359)
- [PDF mirror](https://dubroy.com/refs/Statecharts_a_visual_formalism_for_complex_systems.pdf)
- The foundational paper. Extends plain finite state machines with three things: **hierarchy**, **orthogonal regions** (parallel states), and **communication** between regions.
- Canonical example: Harel reverse-engineers his digital wristwatch.
- Everything else in this list traces back here.

### Ian Horrocks — "Constructing the User Interface with Statecharts" (1999)
- [Book on Amazon](https://www.amazon.com/Constructing-User-Interface-Statecharts-Horrocks/dp/0201342782)
- Pre-XState, pre-React. Argued statecharts beat OOP for UI work. Examples in the book: CD player, FR tool, student database.
- Chapter 14 explicitly covers **regression testing without full re-tests** — change the chart, re-run the auto-generated test suite. Your "insert and verify" intuition is his thesis from 26 years ago.

---

## 2. Contemporary web UI advocacy

### Erik Mogensen — statecharts.dev
- [Home](https://statecharts.dev/)
- [Statecharts in User Interfaces](https://statecharts.dev/use-case-statecharts-in-user-interfaces.html)
- [What is a statechart?](https://statecharts.dev/what-is-a-statechart.html)
- Contemporary teaching resource. Argues: *"you're already coding state machines, except they're hidden in the code."*
- Framing: statecharts are *executable specifications*. The machine IS the spec; the diagram is a byproduct.

### David Khourshid — XState / Stately
- Creator of XState library and Stately Studio. Most cited modern voice in this space.
- [XState website](https://xstate.js.org/)
- [Stately Studio](https://stately.ai/)
- [@xstate/test docs](https://stately.ai/docs/xstate-test) — the model-based-testing library
- [Talk: Write Fewer Tests! Model-Based Testing in React (React Rally 2019)](https://www.youtube.com/watch?v=pA3DXExjKqI)
- [The State of XState (talk)](https://www.youtube.com/watch?v=Q05jcu9N98g)
- Two patterns he advocates:
  - **Pattern A** (XState as runtime) — what XState ships for by default. Machine drives UI.
  - **Pattern B** (machine as separate test spec) — what xstate-test is designed for. Machine documents intent; app implementation is separate.
- The CSS-Tricks article below specifically describes Pattern B.

### CSS-Tricks — "Model-Based Testing in React with State Machines"
- [Article](https://css-tricks.com/model-based-testing-in-react-with-state-machines/)
- The piece you quoted. Explicit principle: *"this finite state machine is used only for testing, and not in our actual application — it represents how the user expects the app to behave, and not its actual implementation details."*
- This is Pattern B framing. App built however; machine maintained as spec; tests bridge them.

### Practitioner essays
- [Tackling UI complexity with State Machines — Carlos Galarza](https://medium.com/@carloslfu/tackling-ui-complexity-with-state-machines-b3f1eb6d1a97)
- [Building Complex UI with State Machines — Erik Rasmussen](https://erikras.com/blog/ui-with-state-machines)
- [Robust React User Interfaces with Finite State Machines — CSS-Tricks](https://css-tricks.com/robust-react-user-interfaces-with-finite-state-machines/)
- [The (Switch)-Case for State Machines in User Interfaces — 24ways (Khourshid, 2018)](https://24ways.org/2018/state-machines-in-user-interfaces/)
- Each frames the same argument differently: state machines surface complexity that ad-hoc code hides.

---

## 3. Formal verification — the rare angle

### Hillel Wayne — "Formally Specifying UIs"
- [Article](https://www.hillelwayne.com/formally-specifying-uis/)
- Closest precedent for what we did. Wayne took the Edmodo Snapshot app and formally specified its UI using **Harel statecharts + Alloy**. Found dead-ends, unreachable views, circular paths the team didn't know about.
- The interrogative principle: don't eyeball the diagram, *ask the verifier questions*.
- Almost nobody else has published this kind of work on a real shipped UI.

### Alloy
- [Alloy Tools](https://alloytools.org/) (the actual tool we ran)
- Formal verification language. You declare relations and constraints; the SAT solver finds violations or proves none exist.
- Industry usage: AWS used TLA+ (sibling tool) for DynamoDB; Alloy is more lightweight.

---

## 4. Existing tools that overlap with the workflow

### Stately Studio
- [Home](https://stately.ai/)
- [Pricing](https://stately.ai/pricing) — Community (free), Pro ($39/mo), Team ($199/mo)
- [Embed Figma blog post](https://stately.ai/blog/2024-01-24-embed-figma) — the feature where you attach Figma frames to states
- [Embed Figma docs](https://stately.ai/docs/figma)
- [Generate React app docs](https://stately.ai/docs/generate-react) — Stately's code-gen feature
- The Figma embed is Pro-only. Frames link as live SVG; changes in Figma reflect in Stately on reload.
- Stately has an "Enhance UI" AI feature, called experimental.

### sketch.systems — Ryan Lucas
- [Home](https://sketch.systems/)
- [Designer's site](https://ryanlucas.org/work/sketch-systems/)
- The closest existing product to your workflow. Markdown-syntax statecharts, auto-rendered diagrams, attach Figma frames or HTML/CSS/JS prototypes per state.
- What it doesn't do: AI generation, formal verification, transition guards/actions/variables. Deliberately stays a "thinking tool."
- Active product since ~2017.

### Figma plugins for state machines
- [State Machines plugin](https://www.figma.com/community/plugin/1482607818024168493/state-machines)
- [StateMaker plugin](https://www.figma.com/community/plugin/1534469374255331582/statemaker)
- [StateBuilder plugin](https://www.figma.com/community/plugin/1576299538313439140/statebuilder-component-state-generator-specs)
- [States Generator plugin](https://www.figma.com/community/plugin/1584878188901464723/states-generator)
- Various community plugins. Mostly newer (2024+), none widely adopted.

---

## 5. AI UI generators (mentioned for context, not workflow-aligned)

These all generate UI from prompts or Figma, NOT from state machines. Worth knowing about to position the gap.

- [v0 (Vercel)](https://v0.dev) — text-to-React via shadcn/ui
- [Galileo AI](https://www.usegalileo.ai/) — text-to-Figma
- [Magic Patterns](https://magicpatterns.com/) — text-to-UI with design tokens
- [Banani](https://www.banani.co/) — text to multi-screen prototypes
- [Locofy.ai](https://www.locofy.com/) — Figma to code
- [Anima](https://www.animaapp.com/) — Figma to code

None of these take a state machine as input.

---

## 6. Adjacent fields (where state machines also live)

Mentioned earlier in the conversation to show the formalism is everywhere.

- **Game AI**: [State chapter in Game Programming Patterns (Bob Nystrom)](https://gameprogrammingpatterns.com/state.html), [Behavior Trees vs FSMs survey](https://arxiv.org/pdf/2405.16137). Games dropped flat FSMs for **behavior trees** when complexity grew.
- **Game animation**: blend trees in Unity/Unreal animation state machines.
- **Distributed systems**: [Erlang OTP gen_statem](https://www.erlang-solutions.com/blog/gen-statem-unveiled/) — powers WhatsApp, RabbitMQ. Combines FSM + actor model.
- **Network protocols**: TCP, HTTP, WebSocket all specified as state machines.

The pattern is decades old and industrial. UI is one of the few layers where it stayed obscure.

---

## 7. Where the workflow we built sits

Lineage, in honest order:

1. **Harel (1987)**: invented statecharts.
2. **Horrocks (1999)**: applied them to UI, advocated maintained spec + auto-regenerated tests.
3. **Khourshid (2015+)**: shipped XState, made statecharts accessible to web devs. Both runtime and test-spec patterns supported.
4. **Wayne (2018)**: showed Alloy could find real UI bugs in a shipped app's statechart.
5. **Mogensen, Rasmussen, Galarza (2018+)**: argued the case to wider web audience.
6. **Stately Studio (2020+), sketch.systems (2017+)**: built tools that let designers attach frames to states.
7. **2024**: Stately + Figma embed feature lands. Frames live-update from Figma.
8. **Now**: AI tools (v0, Galileo, etc.) generate UI from prompts but not from state machines.

**The play piece sits in step 7–8.** The pattern is established. The verification angle (step 4) is rare. AI generating frames from a verified machine is unbuilt as a product. You're not inventing anything — you're trying the existing pattern with AI doing one of the manual steps.

---

## 8. The picture, in one paragraph

State machines and statecharts have been the right formalism for UI behavior since 1987. Stately and sketch.systems offer the "state machine with frames attached" pattern as products. Wayne demonstrated that formal verification (Alloy) finds real bugs in shipped UIs. Khourshid built xstate-test for the maintained-spec pattern. The piece you're putting together does the workflow once on a checkout flow: AI drafts the spec, Alloy verifies, designer reviews, frames get generated and pinned in Stately. Nobody has published this end-to-end on a designer's portfolio. The novelty isn't in any single step — it's in walking the whole chain on a real example.

---

## What we have NOT looked at (gaps in the review)

- **TLA+ in UI specifically** — searched but found nothing substantive; mostly used for distributed systems.
- **DASH** — Nancy Day's variant of Alloy with first-class hierarchical state machine semantics. Mentioned briefly in our search. Academic, not widely adopted.
- **Yakindu / itemis CREATE** — commercial statechart tools, more enterprise/embedded focused.
- **Property-based testing complementing MBT** — fast-check / Hypothesis style. Adjacent but separate technique.
- **Stately's "Generate React app" feature** in detail — could be relevant if you decide to demo any code generation.
- **The actual Edmodo Snapshot Alloy model** Wayne wrote — would be a useful reference for technique-on-technique comparison.

These are next-rabbit-hole if you ever wanted to extend. Not needed for the play piece.
