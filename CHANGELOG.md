## 4.1.0.0

### New features
* Added "Invert Color Scale" toggle to reverse the color gradient direction
* Diverging (three-stop) gradient: new "Add gradient middle" toggle and "Gradient middle" colour picker in the Format pane → General → Gradient Colors group. When enabled, the colour scale interpolates smoothly through the chosen midpoint colour (default: `#767676`). The midpoint uses this default until the user explicitly changes it in the Format pane.
* Added Auto-contrast toggle to Data labels: when enabled, each label's lightness is automatically clamped to remain legible against its cell background colour while preserving the user-picked hue and saturation.

### Bug fixes
* Fixed "Invert Color Scale" and gradient middle colour not being neutralized in high-contrast mode; both features are now automatically disabled when the Power BI high-contrast theme is active to preserve accessibility contrast requirements.
* Fixed bucket count upper bound not being restored when switching from a Colorbrewer palette back to the custom gradient mode; the maximum was previously stuck at the palette's supported range rather than resetting to 18.
* Fixed gradient middle anchor being skewed left-of-centre for even bucket counts; the three-stop domain now uses a fractional midpoint so both odd and even counts produce a symmetric diverging scale.

### Code quality
* Renamed internal constant `AdditionalSpaceForColorbrewerCells` → `GridHeightAdjustmentFactor` to reflect that the padding applies in all rendering modes.
* `GeneralSettings.stroke` converted from a `static` mutable field to an instance field on `GeneralSettings`; high-contrast and non-high-contrast paths now reset it on every render, eliminating cross-render state leakage.
* `SettingsModel.cards` type widened from `FormattingSettingsSimpleCard[]` to `FormattingSettingsCard[]` (`SimpleCard | CompositeCard`) to correctly reflect that `GeneralSettings` extends `CompositeCard`.
* Replaced tautological `expect(querySelectorAll(…)).toBeTruthy()` assertions in unit tests with `expect(…length).toBeGreaterThan(0)`.

### Other
* Upgraded powerbi-visuals-tools from ^6.1.1 to ^7.0.3
* Added unit tests for invertColorScale and getOpacity utility
* Format pane General card restructured into three named groups: **Colorbrewer**, **Gradient Colors**, and **Additional settings**.

## 4.0.0.0

### New features
* Added series data-role
* Added interactivity for datapoints and legend
* Added keyboard navigation
* Added font settings for labels
* Added sorting options
* Added dialog box
* Use API 5.11.0

### Other
* Updated dependencies
* Added new tests
* Used new eslint
* Split render method into smaller functions.

## 3.5.0
* Fixed bug when X axis labels height was calculated incorrectly if labels were numeric

## 3.4.0
* Fixed the issue when Gradient Start and End colors didn't change after changing Colorbrewer
* Fixed the bug when X-axis labels cut off at the top when increasing text size

## 3.3.0
* Made the visual resize more predictably

## 3.2.0
* Disabled scrolling in the visual
* Negative values in NumUpDown components in the formatting pane are no longer allowed
* Fixed bug when the rightmost X-axis label is cut off when the visual is resized
* Fixed bug with X-axis labels shifting to the right
* Legend labels rotate 65 degrees on resize to avoid collisions

## 3.1.2
* Removed redundant packages

## 3.1.1
* Fixed issue with rounding legend values
* Fixed issue with incorrect number of buckets displayed in the formatting pane

## 3.1.0
* Added option to resize cells vertically

## 3.0.0
* Updated packages and APIs to the current latest version
* Fixed vulnerabilities

## 1.5.0
* High contrast mode
* API 1.13.0

## 1.4.0

* Added localization for all supported languages

## 1.3.4

* Segoe UI font families were removed from properties
* Default font family changed to Arial

## 1.3.3

* Fix issue when cells overlap Y axis labels in reading view.

## 1.3.2

* Fix displaying min negative value in legend

## 1.3.1

* Fix issue when zero value displays as null

## 1.3.0

* Option to configure displaying of cells with null values

## 1.2.3

* Table cell max height limited by 60px

## 1.2.2

* Default axis label colors changed to grey
* Fixed minimal size of SVG in the visual to display legend labels

## 1.2.1

* UPD: API was updated to 1.7.0

## 1.2.0

* Add fond settings for axis labels and data labels in cells
* Cells scale depends on text size
* Add auto-scroll if chart doesn't fit into viewport

## 1.1.0

* Add gradient color selection feature as alternative for pre defined colorbewers
* Add bucket number limitation from 1 to 18 for gradient colors
* Add bucket number limitation between min and max buckets in from set for pre defined colorbewers
* X axis labels properties
* Y axis labels properties
* Add tolltips by tooltip services
* Fix bug when left upper cell draws on axis label position if first value in the category is null
* Left and top margins of grid depend from height and width values of axis labels
* Add property to limit number of symbols in Y axis labels text

## 1.0.1

* Data labels displaying in cells