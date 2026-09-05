# Tomer Zipori — personal brand and digital garden

Implementation handoff for **GPT-5.6 Luna**. Consolidated on 5 September 2026.

This document replaces all earlier website plans in the conversation. It contains the final design, content, implementation scope, and acceptance criteria. Implement this document without relying on earlier messages.

## 1. Objective and boundaries

Build a warm, playful, professional portfolio for recruiters and interviewers hiring for **applied ML and research engineering** roles. Make the work easy to scan, explore, and present in interviews.

Brand copy:

> **Tomer Zipori**  
> **Playful questions. Rigorous answers.**  
> I build models, experiments, and tools to understand how people—and machines—make sense of the world.

Professional descriptor: **Applied ML · Model evaluation · Research tools**.

Deliver the actual rendered website as a **working local preview**, opened in Codex after desktop and mobile checks. This is not a request for a screenshot-only mockup.

### Authorized work

- Implement the design, navigation, garden, content, and checks specified here.
- Insert the complete authored notes in section 6. Adapt markup and internal links, but do not replace the prose with summaries.
- Remove the retired PCA and multilingual-embeddings pages and their references.
- Preserve the ten older long-form articles, including their code and figures.
- Repair internal navigation and missing local asset references within this scope.
- Install an official Quarto release into a task-local tools directory if no usable installation exists. Record the version used.

### Not authorized

- No commits, pushes, pull requests, deployment, or publication.
- Do not start, stop, resume, modify, or rerun the DistilHuBERT experiment.
- Do not download models or execute article inference/training code.
- Do not copy research audio, checkpoints, raw logs, or private dashboard links into the site.
- Do not invent project performance, adoption, employment, or business-impact claims.
- Do not rewrite the ten older article bodies or develop the retired ideas.

### Git and agent workflow

Follow the applicable AGENTS.md instructions. Use a git-master subagent for Git operations. Before implementation, recheck the checkout, worktrees, dirty files, and main versus origin. Preserve unrelated changes.

Create the fresh task branch **`codex/personal-brand-garden`** from the current intended site baseline. If that branch already exists from an earlier attempt, inspect it before deciding whether it is this task's branch; do not overwrite it. Do not implement on main or an unrelated branch. The plan file itself is an intentional user-requested handoff; preserve it.

GPT-5.6 Luna is the implementation agent. Complete the batches in section 7 sequentially, with checks between them. Do not create a separate Codex task unless the user asks. Use short progress updates explaining findings and next checks.

## 2. Existing site and final scope

Workspace:

`/Users/Tomer.Zipori/Library/CloudStorage/OneDrive-AppliedSystems,Inc/Documents/GitHub/tomerzipori.github.io`

The site uses Quarto, static HTML/CSS, browser JavaScript, and a small Python content builder. Keep this stack. Do not introduce React, a CMS, a database, or a graph framework.

Relevant existing entrypoints:

- `index.qmd`, `styles.css`, `_quarto.yml`: homepage, styling, rendering.
- `scripts/build_content.py`: metadata collection and public-content filtering.
- `assets/site.js`: menu and non-repeating surprise destinations.
- `assets/evidence-thresholds.js`: existing threshold demonstration.
- `tests/test_content_contract.py`: existing content checks.
- `.github/workflows/pages.yml`: checks and Quarto render, with deployment on main pushes.

During planning, all six existing tests passed. Ten older posts contained substantial source content. Quarto was not on PATH. Recheck these facts before implementation rather than assuming they remain current.

### Retire these two ideas completely

- `/notes/pca-is-intuition-not-proof/`
- `/posts/multilingual-embeddings-layers/`

Remove their source pages, archive entries, related links, garden nodes, feed entries, and obsolete migration references. Remove tests that specifically require the multilingual draft, while keeping general draft-exclusion tests. Do not recover their archive source or create replacements. Their former URLs may use the normal site 404 response. Clear old generated output before the final render so stale pages cannot survive.

### Keep these ten existing articles

`bayes101`, `bayes102`, `eggs`, `elections2024`, `fifa23`, `football_fake_news`, `micrograd`, `netflix`, `p_values_paradox`, and `ufo`.

Preserve their long-form bodies and existing public URLs and legacy aliases. Add micrograd to the Writing archive; it was missing there during planning. Surrounding navigation, typography, metadata display, and generated related-content sections may change.

UFO, eggs, and FIFA stay in the Writing archive and full garden, and may appear through related links or Surprise me. They must not be homepage centrepieces, featured homepage nodes, or selected-work projects.

## 3. Brand, layout, and navigation

### Visual system

| Element | Specification |
| --- | --- |
| Background | Warm ivory `#F7F5EF` |
| Text | Dark ink `#282826` |
| Accent | Cobalt `#3158C9` |
| Secondary surface | `#EBE8DF` |
| Dividers | `#D4D1C8` |
| Headings and name | Existing Fraunces font |
| Body and controls | System sans-serif stack |
| Code | Monospace only where needed for code |
| Body size | 18px desktop; 17px mobile |
| Article width | About 68 characters |

Use generous spacing, large real figures, open layouts, and thin dividers. Avoid card grids, excessive badges, decorative dashboards, and animated backgrounds. Keep the existing outdoor portrait in About.

Use a simple line-and-points motif in the wordmark, garden, and diagrams. Use brief entrance and hover transitions; respect reduced-motion preferences. Data diagrams may use a second distinguishable line treatment when needed for clarity. Do not rely on colour alone.

### Navigation

Primary navigation: **Work · Garden · Writing · About · CV**.

- Work: existing `/experiments/`, relabelled **Selected work**.
- Garden: new `/garden/`.
- Writing: `/writing/`, containing both Articles and Notes, with All selected initially.
- About: existing `/about/`.
- CV: existing `/assets/cv/tomer-zipori.pdf`.

Preserve `/notes/` and the four `/questions/` theme routes. Keep GitHub and LinkedIn visible in the contact area. Use the existing LinkedIn destination for Contact; do not invent an email address. Preserve both existing RSS URLs.

Use shared navigation/footer markup through Quarto includes where practical. Limit extraction to the repeated site shell; do not rewrite embedded historical article HTML.

### Homepage order and exact copy

1. **Introduction and demonstration.** Large name, brand copy from section 1, professional descriptor, and links **Explore my work**, **CV**, and **Contact**. Place the evidence-threshold demonstration alongside the introduction on desktop and below the introduction/actions on mobile. Keep the initial composition calm and the actions easy to find.
2. **Selected work.** Three substantial project presentations, specified below.
3. **Currently investigating.** DistilHuBERT study feature, specified below.
4. **Compact garden map.** Four themes and six featured nodes.
5. **Recent notes.** Padding study, local-agent evaluation, and evidence thresholds, in that order. This is an explicit editorial selection, not a promise that automated date sorting produces this order.
6. **About and contact.** Portrait, existing background, publication link, CV, GitHub, and LinkedIn.

Do not add the previously proposed UFO/FIFA-led curiosity section.

#### Evidence-threshold demo

Heading: **Same evidence. Different decision.** Caption: **Illustrative model**.

Reuse and adapt `assets/evidence-thresholds.js`. Keep the existing equal-variance distributions and default thresholds as the starting state. Provide visible labels, keyboard-operable threshold controls, probability readouts, and a Reset button. Thresholds remain ordered. Moving criteria must not change fixed discriminability. Explain that the display is a teaching model, not a measured study result.

Use the same component on the evidence-threshold note. Scope DOM queries to the component root so repeated use does not create conflicting controls or IDs. Provide a static figure and explanation when JavaScript is unavailable.

#### Selected work

| Project | Heading | Summary |
| --- | --- | --- |
| OrdinalRegressionViz | Making ordinal models understandable | Visual tools that connect model parameters to latent evidence, response thresholds, and uncertainty. |
| Local Agent Toolkit | Giving local models a bounded job | A toolkit for repository exploration, review, and candidate patches, with human verification built into the workflow. |
| Blue Movies | Measuring a cinematic hunch | A Python pipeline for testing a claim about movie colour, with the movie as the unit of analysis. |

Use the existing ordinal-model figure. For Local Agent Toolkit, draw an SVG workflow: **Bounded task → Selected context → Local model → Human verification**. For Blue Movies: **Movie → Sampled frames → Colour measurements → Movie-level analysis**. Label both **Workflow**, not measured results or interface screenshots.

Each presentation links to its existing case-study route and repository. Case studies follow:

**Question → What I built → Key design decision → Artifact → Limitations → Related notes**.

Use only existing, verified project claims. An artifact or worked example is valid evidence when there is no measured impact figure.

#### Current investigation

> **Can padding change what a model learns?**  
> I’m testing whether padding-sensitive normalization changes audio-classification metrics in a small DistilHuBERT model. The study compares ordinary and masked normalization under two padding conditions.  
> **Read the experiment note →**  
> *Ongoing study · Pilot complete*

Link to `/notes/distilhubert-padding-study/`.

Draw the same waveform twice, once with minimal padding and once with additional padding. Label valid audio and padding separately. Caption: **Experiment design**. No results chart or implied performance gain.

#### Garden introduction

> **Follow a question.**  
> These paths connect my projects, notes, and longer articles. Pick a theme, or take an unexpected turn.

#### About

Retain the existing factual background and publication link. Use this short introduction:

> My background spans psychology, experimental methods, statistics, data science, and machine learning. I turn research questions into models, visual explanations, and tools that other people can inspect.

Contact heading: **Let’s talk about models, experiments, and useful tools.**

## 4. Illustrated garden and content pipeline

### Garden structure

Create an illustrated topic map, not a force-directed knowledge graph. Positions describe editorial organisation, not measured similarity.

Four fixed regions:

- Upper left: **Evidence and belief** (`evidence-and-belief`).
- Upper right: **Models and meaning** (`models-and-meaning`).
- Lower left: **Data and strange claims** (`data-and-strange-claims`).
- Lower right: **Tools for thinking** (`tools-for-thinking`).

Use SVG for soft boundaries and paths, and normal HTML links for labels. Use stable title-sorted placement within each region, with enough vertical space for all labels. No physics, canvas, graph dependency, dragging, pan/zoom, or automatic movement.

Full garden requirements:

- Include every public article, note, and experiment exactly once.
- Place each item under its first listed theme. Draw connections to additional themes.
- Distinguish Articles, Notes, and Projects using shapes and text labels.
- Hover or focus highlights the item's theme connections. Explicit related-item connections appear only while that item is hovered or focused.
- Clicking or pressing Enter on a title opens its page directly.
- Provide title search and **All / Articles / Notes / Projects** filters. Filters and search combine; show a clear empty state and Reset action when nothing matches.
- Provide a visible **Map / List** switch. Both modes expose the same filtered destinations.
- Below 768px, default to the grouped list. Optional map mode uses four stacked regions, not a shrunken desktop diagram.
- Without JavaScript, show grouped static links. Do not leave an empty map shell.
- Explain once that connections represent shared themes and editorial links.
- Keep **Surprise me** as a small Garden-page action. Preserve its non-repeating destination behaviour and include only public existing destinations.

Homepage map: show the four themes and exactly these six featured nodes:

1. DistilHuBERT padding study
2. OrdinalRegressionViz
3. Local Agent Toolkit
4. Blue Movies
5. Criteria move the answers
6. A useful local agent earns its keep

Provide **Explore the full garden →**. Do not include UFO, eggs, FIFA, PCA, or multilingual embeddings among featured homepage nodes.

### One public inventory

Extend the existing Python builder. Keep Quarto/static rendering.

- Keep the public gate: `draft: false` and `status` equal to `finished` or `nearly-finished`.
- Preserve existing metadata and expose `related` in generated records.
- Use `paths` for theme membership. Public content must have at least one valid theme.
- Use the same filtered inventory to generate archive HTML, theme membership, map data, related links, backlinks, and both RSS outputs.
- Build the inventory before every render, including local preview. Wire the content builder into the Quarto pre-render step; it must be safe to run repeatedly.
- Include generated browser data in rendered output explicitly. Do not assume files in `_generated/` are automatically published.
- Escape metadata when generating HTML. Use text-safe DOM updates for filtering and labels.
- Produce static archive and grouped-list HTML; JavaScript only adds interaction.
- Render visible **Related** and **Linked from** sections when entries exist.
- Treat `related` as directed metadata. Backlinks are its inverse. Collapse reciprocal edges into one visual map connection.
- Fail checks on malformed public related targets. Do not leak private titles or URLs through related sections.
- Exclude draft content from rendered public pages, feeds, sitemap, and maps, not only the JSON index. Verify actual build output.
- Preserve original dates for existing material. Set updated dates when edited. New notes use their actual creation date.
- Display editorial `finished` as **Published**, replacing conflicting decorative labels such as “in bloom.”
- Preserve the actual singular kind `note`; inspect the existing collection-to-kind conversion rather than assuming generic string slicing produces it.

Metadata for the five final notes:

| Slug | Themes, in order | Related targets |
| --- | --- | --- |
| `criteria-move-answers` | evidence-and-belief; models-and-meaning | `/experiments/ordinal-regression-viz/` |
| `the-denominator-changes-the-story` | data-and-strange-claims; evidence-and-belief | `/posts/ufo/`; `/posts/eggs/` |
| `more-frames-do-not-mean-more-movies` | data-and-strange-claims; tools-for-thinking | `/experiments/blue-movies/` |
| `a-useful-local-agent-earns-its-keep` | tools-for-thinking; models-and-meaning | `/experiments/local-agent-toolkit/` |
| `distilhubert-padding-study` | models-and-meaning; tools-for-thinking | `/notes/criteria-move-answers/`; `/notes/more-frames-do-not-mean-more-movies/` |

All five are finished public notes. The padding note additionally has `study-status: ongoing` and `study-status-as-of: 2026-09-05`. Expose and display those fields separately from editorial status. An ongoing experiment does not make its finished explanatory note a draft.

## 5. Research evidence contract

Read-only evidence directory:

`/Users/Tomer.Zipori/research/hubert_padding_downstream/experiment_02_distilhubert_english/`

Relevant evidence: `manifests/data_manifest.json`, `manifests/pilot_gate.json`, `manifests/experiment_status.json`, per-run `completion.json` files, `train.py`, and `masked_positional_bn.py`.

Verified during the plan update on 5 September 2026:

- All four pilot conditions passed the predefined learning gate.
- `matrix_seed17_C-L` had a completion marker; `matrix_seed17_F-L` did not.
- The full five-seed matrix and controls were incomplete.
- The existing aggregate summary described only four completed pilot runs and was behind the per-run artifacts. Do not treat it as current full-matrix evidence.
- The experiment adds positional BatchNorm to the DistilHuBERT-based main conditions. The original checkpoint does not use that path.

Before preview delivery, check completion markers read-only. Keep the dated 5 September note as an explicit snapshot. If newer evidence changes its status, report the difference for editorial review; do not silently invent an updated scientific conclusion or start analysis/training.

Use the precise framing **padding handling around PyTorch BatchNorm in a Transformers HuBERT configuration**. Do not call it a proven general PyTorch defect or claim that all stock DistilHuBERT models are affected.

No absolute local research paths should appear in published note text. Link to the public upstream issue, not private dashboards. A schematic is enough for the initial website feature.

## 6. Complete authored notes

Insert the following bodies verbatim apart from formatting, typographic consistency, and resolving internal links. Keep citations. Use each opening summary as the metadata description where an explicit description is not given.

### 6.1 Criteria move the answers. Separation moves discriminability.

Description: A worked example showing how decision thresholds change responses without changing fixed discriminability.

Imagine two people reviewing the same evidence. One rarely chooses the highest confidence rating. The other uses it freely. Their answers differ, but that alone does not tell us who distinguishes signal from noise more accurately.

Signal detection theory separates two ideas: how much the evidence distributions overlap, and where a person places a decision criterion. Under an equal-variance Gaussian model, discriminability is:

\[
d'=\frac{\mu_{\text{signal}}-\mu_{\text{noise}}}{\sigma}.
\]

Moving the criterion changes the answers without changing this separation. See this [introduction to signal detection theory](https://www.cns.nyu.edu/~david/handouts/sdt/sdt.html).

#### A small example

Take noise with mean 0 and signal with mean 1.5. Give both distributions a standard deviation of 1. The resulting \(d'\) is 1.5.

Call an observation “signal” when it exceeds a threshold. At a threshold of 0.5, the illustrative hit rate is about 84%, and the false-alarm rate is about 31%. Move the threshold to 1.0: the rates fall to about 69% and 16%.

These are calculated probabilities from the example model, not observations from a study. The stricter rule changes both rates. It does not change \(d'\).

#### From two answers to six

A six-point response scale needs five ordered thresholds. Moving these thresholds changes how much probability falls into each category.

This is why I find the picture useful: it separates a change in the response rule from a change in the underlying distributions.

#### Try it

Move a threshold in the interactive figure. Watch the category probabilities change while the distributions stay fixed. Reset the figure to compare with the starting point.

The demonstration assumes normal distributions with equal variance. Real data may require a different model. Observed ratings alone do not establish why two groups differ.

Related: [OrdinalRegressionViz](/experiments/ordinal-regression-viz/).

**Implementation instruction, not article copy:** Embed the shared threshold component under “Try it.” The numerical example above is independent of the component's existing default settings.

### 6.2 The denominator changes the story

Description: Why counts and population rates can produce different rankings, and what neither measure can establish alone.

Suppose State A records 1,000 UFO reports and State B records 300. Which state reports more UFOs?

By total count, A does. Now suppose A has ten million residents and B has one million.

A has 10 reports per 100,000 residents. B has 30.

Nothing about the reports changed. The question changed.

#### Count and rate answer different questions

A count describes the volume of recorded events. A population rate describes that volume relative to the number of residents.

Neither measure is automatically better. A newsroom asking where most reports came from may need counts. Someone comparing reporting frequency across populations may need rates.

Both need a matching time period and a clear definition of a report.

#### A rate is still a measurement of reporting

Dividing by population does not turn UFO reports into a direct measure of unusual objects in the sky.

Tourism, reporting access, repeated submissions, and differences in observation conditions can all affect the numerator. Small counts can also make rankings unstable: one extra report matters much more when the starting count is two than when it is two thousand.

Population adjustment answers one problem. It does not remove every other explanation.

#### What I want beside the chart

Show the count, denominator, time window, and unit. If the chart ranks places, explain what that ranking measures.

The numbers above are an invented example. Their purpose is to show why a denominator belongs in the story.

Before asking which place leads, decide what “leads” means.

Related: [UFO reports](/posts/ufo/) and [Cage-free vs. caged hens in the US](/posts/eggs/).

### 6.3 More frames do not mean more movies

Description: Why repeated frame measurements do not provide the same information as independently sampled films.

Suppose I sample 100 frames from each of ten films. I now have 1,000 rows of colour measurements.

I still have ten films.

Frames from the same movie share lighting, grading, locations, and many other choices. Treating every frame as an independent example of a film can make the dataset look more informative than it is.

This is related to pseudoreplication: the analysis fails to account for the structure that connects observations. See this [discussion of the unit-of-analysis problem](https://pmc.ncbi.nlm.nih.gov/articles/PMC2817684/).

#### Start with the claim

If the question concerns differences between movies from different periods, the movie is the unit I want to compare.

One approach is to calculate a summary for each film and compare those summaries. A hierarchical model offers another approach when within-film variation matters.

Neither approach makes the choice of films representative. That is a separate sampling question.

#### More measurements can still help

Additional frames can improve the estimate for one film, especially when scenes vary. They do not provide the same information as additional independently sampled films.

A film with many sampled frames should not silently receive more influence just because its extraction produced more rows.

#### Keep the unit visible

For Blue Movies, the workflow separates frame measurements from movie-level analysis. That distinction belongs in the explanation, not only in the code.

The same question appears elsewhere: several answers from one person, many crops from one photograph, or repeated requests from one customer.

Before trusting a sample size, ask what each row represents—and which rows share a source.

Related: [Blue Movies](/experiments/blue-movies/).

### 6.4 A useful local agent earns its keep

Description: Evaluate a local agent by the useful result after preparation, review, correction, and unsuccessful attempts.

A small local model can produce an answer quickly. That does not yet tell me whether using it saved work.

I would judge a local agent by the useful result after verification.

#### Give it a job with a finish line

“Improve this repository” is difficult to assess. “Locate the configuration loader and identify the callers that depend on its defaults” has a clearer output.

A bounded task makes it easier to provide relevant context and check the answer. It also makes a failed attempt easier to discard.

#### Compare the whole workflow

For a repository question, I would compare two routes:

- Find and verify the answer with ordinary search and inspection.
- Ask the local agent, then verify its answer against the same source.

The comparison should include preparation, generation, review, corrections, and unsuccessful attempts. If setup is reused across many tasks, report it separately rather than hiding it.

A reduction in remote-model tokens can be useful. It is not the same measurement as reduced time or improved correctness.

#### Keep the useful failure cases

An agent that names a plausible but nonexistent function creates work. An agent that points to the correct file but misreads a condition still needs correction.

Those cases belong in the assessment alongside successful answers.

Local Agent Toolkit provides a bounded interface for this kind of work. Its existence does not establish a fixed saving across models or tasks.

The question I care about is practical: after checking the result, am I further ahead?

Related: [Local Agent Toolkit](/experiments/local-agent-toolkit/).

### 6.5 Can padding change audio-classification metrics?

Description: An ongoing DistilHuBERT study comparing ordinary and masked positional BatchNorm under minimal and additional padding.

Display **Ongoing study · Status checked 5 September 2026** near the title, separately from publication metadata.

Audio clips have different lengths. To process several clips together, we often extend the shorter ones with padding.

Those extra samples are bookkeeping. They should not casually become evidence about what someone said.

I’m investigating whether padding-sensitive normalization can change downstream audio-classification metrics in a small DistilHuBERT model.

#### The mechanism

The reported issue concerns HuBERT’s positional convolution when `conv_pos_batch_norm=True`. Batch normalization receives padded time steps without using their validity mask. This can affect valid-frame normalization during training, and padded positions can become nonzero before the convolution. The original report includes a reproduction of the padding sensitivity. [Transformers issue #47739](https://github.com/huggingface/transformers/issues/47739)

A difference inside a model is a reason to investigate. It does not establish how much classification performance changes.

That is the question for this experiment.

#### What I am testing

The study uses a pretrained DistilHuBERT backbone with a new classifier for 14 spoken intents. The dataset combines the Australian, British, and American English portions of MInDS-14: 1,809 examples in total.

The fixed split contains 1,266 training examples, 269 validation examples, and 274 test examples.

There is an important architectural detail: the original DistilHuBERT checkpoint does not use this positional BatchNorm path. The main experiment explicitly adds it after converting the positional convolution’s weight-normalized representation to an equivalent ordinary convolution.

The study therefore tests a controlled configuration built from DistilHuBERT. It does not assume that the original checkpoint has the same problem.

#### Four conditions

| Condition | Positional normalization | Padding |
| --- | --- | --- |
| C-L | Ordinary BatchNorm | Minimum needed for each batch |
| F-L | Masked BatchNorm | Minimum needed for each batch |
| C-H | Ordinary BatchNorm | Pad to a total of 20 seconds |
| F-H | Masked BatchNorm | Pad to a total of 20 seconds |

The cached utterances are capped at 12 seconds. The high-padding condition extends the tensor to 20 seconds; it does not add 20 seconds to every utterance.

The masked version gathers valid feature frames, applies PyTorch’s BatchNorm to those frames, and puts the results back into a tensor whose padded positions are zero.

Within each seed, the four conditions start from the same initialized state and use the same examples and batch order.

#### The comparison that matters

I am tracking macro-F1, accuracy, and loss.

For macro-F1, one useful comparison is:

\[
(F\text{-}H-C\text{-}H)-(F\text{-}L-C\text{-}L).
\]

This asks whether the difference between masked and ordinary normalization changes when padding increases.

A positive value means the masked-minus-ordinary difference is larger under high padding. It does not, by itself, prove a general improvement.

The study also separates changes accumulated during training from changes caused by padding at evaluation time.

#### Why repeat it?

A single training run can give an interesting result for the wrong reason.

The planned main comparison uses five paired seeds. It also includes a repeated run and two controls that retain the architecture without positional BatchNorm.

These checks help distinguish the targeted mechanism from other padding effects and run-to-run variation.

#### Where the study stands

As of 5 September 2026, all four pilot conditions passed the predefined learning gate. The main comparison has started, but the full matrix and controls are not complete.

Passing the pilot means the setup can learn well enough to continue. It does not answer the research question.

I will draw a conclusion only after reviewing the paired results, controls, and measurements inside the model.

For now, the question remains open: does this implementation detail produce a consistent, practically meaningful change in classification metrics?

Related: [Criteria move the answers](/notes/criteria-move-answers/) and [More frames do not mean more movies](/notes/more-frames-do-not-mean-more-movies/).

## 7. Implementation sequence and acceptance

### Batch 1 — Baseline, content, and inventory

Recheck repository instructions and baseline. Create the task branch through the Git subagent. Record article-body hashes before editing their surrounding shell. Insert the five notes, remove retired pages, and implement the shared inventory, archives, feeds, relationships, and rendering hook.

Verify: existing content checks plus new inventory behaviour tests pass; older article bodies are unchanged; generated outputs contain no retired or private content.

### Batch 2 — Brand and homepage

Apply typography, colours, spacing, shared navigation, project presentations, the current-study feature, and the threshold component. Update project shells without adding unsupported facts.

Verify: render succeeds; homepage hierarchy matches section 3; links work; threshold controls are usable and mathematically consistent.

### Batch 3 — Garden

Implement compact and full maps, static lists, filtering, search, highlighting, related links, and backlinks.

Verify: every public item occurs once in the full map; filters and list/map modes agree; keyboard and mobile navigation work.

### Batch 4 — QA and local preview

Run:

```sh
make check
python3 -m unittest discover -s tests
quarto render
```

If Quarto was installed locally, use its recorded absolute executable path. Preserve scientific article code as static/frozen content; the website render must not run research workloads.

Update the existing tests that hard-code the old headline or forbid a garden. Replace them with meaningful behaviour checks, not tests that merely assert new marketing text.

Automated checks must cover:

- Correct public inclusion in archives, theme pages, garden, and both feeds.
- Draft fixtures excluded from actual rendered output as well as generated indexes.
- Valid related targets and correct backlinks.
- No duplicate map nodes or feed entries.
- Preserved ten older article bodies and assets; micrograd present in Writing.
- No retired PCA/multilingual pages or links in final build output.
- UFO/eggs/FIFA retained in archive and full garden, absent from homepage features.
- Internal links, fragments where applicable, images, scripts, CV, and legacy aliases resolve.
- Threshold probabilities are nonnegative and sum to one; thresholds cannot cross; fixed discriminability remains fixed; reset restores defaults.
- Padding study status is distinct from editorial status; research text retains the architecture and incomplete-study qualifications.

Browser QA at **1440px, 1024px, and 390px**:

- Name, professional direction, and primary actions are easy to identify.
- No clipped headings, horizontal page overflow, colliding map labels, or broken images.
- Search, filters, reset, direct navigation, and list/map switch work, including zero matches.
- Visible keyboard focus and sensible tab order; controls have accessible labels.
- Threshold demo supports keyboard input and reset.
- Reduced-motion mode removes entrance movement.
- Without JavaScript, content and grouped garden navigation remain available.
- No browser console errors or missing local assets.
- Article text, tables, figures, and code remain readable in print.

Fix discovered layout and navigation failures before delivery. Do not call the task complete based only on passing source-level tests.

### Preview delivery

Start the actual Quarto preview bound to localhost. Open it in Codex and keep it available for the user. Show the homepage with direct links to the Garden and DistilHuBERT note. Also inspect the expanded evidence-threshold note.

Provide a concise final report with the preview URL, branch name, checks performed, and any concrete limitations. Clearly state that nothing was published, committed, or pushed. Leave the working tree and preview ready for user review.

## 8. Definition of done

- The portfolio communicates the intended brand and applied ML/research engineering focus.
- Current work receives homepage prominence; older exploratory posts remain discoverable.
- The illustrated garden works as accessible navigation and accurately reflects public content.
- All five complete notes are present; both retired ideas are removed.
- The DistilHuBERT study is presented accurately as a dated ongoing investigation.
- The ten older articles retain their bodies and working figures.
- The rendered site passes the specified checks and is open as a working local preview.
- No research process or source repository outside the website was modified, and no external publication occurred.
