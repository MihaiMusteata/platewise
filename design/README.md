# Design references

`screens/*.html` are exported from the design canvas. They are reference markup, not runnable pages
(the canvas runtime is not included). Read them for exact layout, copy and values: every size, color,
spacing and radius is in the inline `style` attributes and maps 1:1 to `tokens.ts`.

Ignore the `<script type="text/x-dc">` blocks except as a description of interactive behavior
(e.g. stepper ranges, selected states).

Optional: put PNG exports of each screen in `png/` with the same names (`Main.png`, …) so agents can
compare their simulator screenshots visually.

Numbers shown in the screens (calories, grams, names) are sample data. The rules in docs/spec.md decide real values.
