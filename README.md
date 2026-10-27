# TOU Dashboard — GitHub Pages example

## Download edited .tou

The .tou download exports each selected meter in the selected month as a complete
binary file, with its original filename. It ignores the date/display filters to
preserve record positions. Original header, file size, spare rows and unchanged
bytes are preserved; only edited float64 Demand/Energy fields are patched.
Header update timestamps are retained, not replaced with a new timestamp.
The original uploaded file is not overwritten. Multiple selected meters trigger
multiple downloads (the browser may ask to allow them). Test with
`node test-tou-export.mjs`.

## Edit raw readings

Demand and Energy are editable in the raw table; meter, day and time are read-only.
Enter or blur commits a finite nonnegative number. Invalid input is rejected.
Edited cells are highlighted, and original values remain in memory for restoring
the selected date range. A commit recalculates raw deltas and status, TOU reports,
charts and Excel export. Changes persist across filters and pagination within this
page, but are lost on reload or replacement of the same imported file. Source .tou
files are never overwritten. Download Excel to retain corrected readings.
Test with `node test-edit.mjs`.

## Daily TOU report

The daily table follows the supplied report: Energy OffPeak / OnPeak / Holiday /
Total, then Maximum Demand OffPeak / OnPeak / Holiday. Demand comes directly from
the raw Demand column; it is never derived from Energy. TOTAL sums Energy and takes
the maximum Demand per meter, rather than adding daily maxima or different meters.

Energy uses cumulative register differences at 00:00, 09:00, 22:00 and the next
midnight. Internal zero readings do not lose energy when segment boundaries exist.
Zero boundary readings or counter resets produce an unknown value (—). Totals sum
known cells and flag incomplete/gapped days; they are not estimates of missing data.

The verified calculation policy uses first-day 00:15 and shared Demand boundaries.
The final available day ends at its last actual reading.

OnPeak is weekdays 09:00–22:00; full-day Off-Peak dates are displayed separately
as Holiday. The 2026 calendar comes from PEA:
https://www.pea.co.th/sites/default/files/users/user36/Off-Peak_Calendar_2569_0.jpg
Substitute holiday Jan 2 is not included. September uses weekends only. Other years
display a warning and require additional official calendar dates entered manually.
Run `node test-tou.mjs` from this directory for boundary tests.

Static HTML/JavaScript. No installation, backend, or API key required.

## File month and year

Filename suffix is authoritative: `DeviceSep26.tou` → September 2026,
`DeviceOct26.tou` → October 2026. All Jan–Dec abbreviations are supported,
case-insensitively, and YY means 2000–2099. The header date is retained only as
update metadata. Names without this suffix are rejected rather than silently
assigned to a different month. Device naming is otherwise left unchanged.

The month selector lists periods from imported files. Import switches to the
last imported file's month; selecting a meter restricts the period choices to
that meter's file. Each period sets date limits to its actual month length.
Charts, TOU reports and Excel export use only the selected period and date range.
The published 2026 holiday calendar is matched against the derived full date;
other years are explicitly marked as requiring their own holiday calendar.
Test with `node test-period.mjs`.

## Preview

Run `python -m http.server 8765` from this directory,
then open http://localhost:8765. JavaScript modules require an HTTP server.

Select multiple `.tou` files or drag them onto the upload area. The filename is the
meter identifier; selecting the same filename replaces it. Files are parsed locally
and are not uploaded. The dashboard starts empty; choose your TOU files after opening or reloading.

Filter by meter and date. Charts show Demand and daily energy from adjacent readings.
The raw table preserves raw zero values and displays Day only at each day's first row
(and the start of each page). Export includes all filtered rows, not only the current page.

## GitHub Pages

Upload this directory's files to the root of a GitHub repository. In Settings → Pages,
choose Deploy from a branch, select the branch and /(root), then Save.
Keep `.nojekyll` and `parser.mjs` alongside `index.html`.

No demo data is bundled. Uploaded meter files stay in the browser.

## Interpretation

64-byte TOUReg header, then little-endian float64 pairs. The header date supplies
only update metadata; the filename supplies month/year. Timestamps assume day 1 at midnight and 15-minute intervals, as in
the provided screenshot. Units and whole-month time mapping need confirmation.
Rows outside the filename month are excluded. Both-zero rows are ambiguous; the chart
breaks at them and energy deltas across them are omitted. Counter decreases are
flagged and excluded. Raw interval delta is assigned to its ending timestamp. The daily TOU report uses boundary differences as described above.
No interpolation, tariff calculation, or missing-data estimate is applied.
Combining parent and child meters can double-count energy.

## Four-column Excel export

The top download button produces a real .xlsx workbook with exactly Day, Time,
Demand, Energy. Each selected meter has its own sheet, with a frozen header,
text day labels (01, 02...), blank repeated days, hh:mm time cells, and numeric
Demand/Energy cells. All filtered raw rows are exported, including zeros;
page size does not restrict export. The daily TOU report has its separate CSV button.
The browser exporter uses OOXML/ZIP directly and makes no network requests.

## One day per raw-table page

The raw-table date dropdown jumps directly to any date in the selected period and
date range. Previous/next buttons move one calendar day. With multiple meters,
all selected meters for the same date appear together (96 rows per meter for a
complete day). Editing and restoration remain available. Excel export still
includes the whole selected date range, not only the raw-table display date.

## Verified source report / last available reading

Directly checked C:/Sep-26/D01Sep26.tou against its CO September HTML report:
30 daily rows plus TOTAL, 217 values, exact energy and maximum Demand discrepancy
0.0001 kW. Day 1 uses 00:15, later days use 00:00. Day 30 ends at the last
nonzero register reading, 23:45, because next midnight is not present. The final
available day is now clamped to the last register timestamp; a partial OnPeak
uses its available endpoint, and periods not yet started contribute zero.
Missing interior boundaries still produce unknown values. Last-day partial status
is displayed. The supplied pair proves 09:00 is included in OffPeak Demand but
cannot independently distinguish inclusion at 22:00 or next midnight (none set
the maximum); report-mode shared boundaries match all provided values.

## Production calculation policy

The dashboard always uses verified report mode: first-day 00:15 baseline and
shared Demand boundaries. Alternative baseline/boundary controls have been removed
to prevent inconsistent reports. Both supplied CO and NSTDA-COOP HTML files
are checked with verify-source-report.mjs (217 values each).

## HTML reports

Open html-report.html from the main menu to import one or more Data Smart View TOU Daily Summary .html/.htm reports. The page displays daily values and the original TOTAL directly, without recomputing from TOU readings. File contents are parsed as inert HTML and only text/numbers are rendered; uploaded scripts are never executed. Reports remain in browser memory until reload. CSV export retains all seven numeric columns.

## Missing TOU switching register

If the 09:00 or 22:00 Energy register is zero, use the last nonzero reading before that boundary within the same day for both adjacent segments, matching the original report. The status names the substituted time. Never interpolate or substitute missing midnight boundaries; counter resets still invalidate a segment. Demand continues to use its actual time slots. Regression: node test-missing-boundary.mjs.
