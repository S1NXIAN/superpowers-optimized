---
name: zeus-vision
description: High-performance visual preview for UI/UX brainstorming. Launches a local server to render HTML/CSS/JS artifacts.
---

# Zeus Vision

See the Code. Confirm the UI.

## Operational Gate
Invoke this skill ONLY for UI/UX, Frontend, or Design-heavy tasks.

## The Process
1.  **Start Server**: Run `scripts/vision.sh start`.
2.  **Generate Artifact**: Write HTML/CSS/JS files to `docs/zeus/previews/`.
    -   Primary entry point: `index.html`.
3.  **Visual Audit**: Provide the user with the URL: `http://localhost:3000`.
4.  **Specialist Siege**: Dispatch the **DESIGNER** to review the rendered output.
5.  **Shutdown**: Run `scripts/vision.sh stop` immediately after design approval.

## Iron Laws
-   **Zero Orphans**: The server MUST be killed on session exit or task completion.
-   **No Slop**: Don't use generic templates. Every preview must match the "Elite Style Signature."
