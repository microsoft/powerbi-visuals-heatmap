/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
import powerbi from "powerbi-visuals-api";

import { textMeasurementService } from "powerbi-visuals-utils-formattingutils";

import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import maxBy from "lodash.maxby";

import { color as d3Color, hsl as d3Hsl, lab as d3Lab, RGBColor } from "d3-color";

import { TableHeatMapChartData } from "./dataInterfaces";
import { BaseLabelCardSettings, GeneralSettings, SettingsModel, YAxisLabelsSettings } from "./settings";

export const DIMMED_OPACITY: number = 0.4;
export const DEFAULT_OPACITY: number = 1.0;
export const DIMMED_COLOR: string = "black";
export const LAB_LIGHT_BG_THRESHOLD: number = 60;
export const DARK_LABEL_LIGHTNESS: number = 0.2;
export const LIGHT_LABEL_LIGHTNESS: number = 0.85;

export function getOpacity(
    selected: boolean,
    highlight: boolean,
    hasSelection: boolean,
    hasPartialHighlights: boolean): number {

    if ((hasPartialHighlights && !highlight) || (hasSelection && !selected)) {
        return DIMMED_OPACITY;
    }

    return DEFAULT_OPACITY;
}

export const YAxisAdditionalMargin: number = 5;
export const GridHeightAdjustmentFactor: number = 2;
export const ConstGridMinHeight: number = 5;
export const ConstGridMinWidth: number = 1;
export const CellMaxHeightLimit: number = 300;
export const CellMaxWidthFactorLimit: number = 15;

export function isDataViewValid(dataView: powerbi.DataView): boolean {
    return !!(dataView.categorical?.categories && dataView.categorical?.values);
}

export function textLimit(text: string, limit: number): string {
    if (text.length > limit) {
        return ((text || "").substring(0, limit).trim()) + "\u2026";
    }

    return text;
}

export function getYAxisWidth(chartData: TableHeatMapChartData, settings: YAxisLabelsSettings): number {
    let maxLengthText: powerbi.PrimitiveValue = maxBy(chartData.categoryY, (d) => String(d).length) || "";

    maxLengthText = textLimit(maxLengthText.toString(), settings.maxTextSymbol.value);

    return settings.show.value ? textMeasurementService.measureSvgTextWidth({
        fontSize: PixelConverter.toString(settings.fontSize.value),
        text: maxLengthText.trim(),
        fontFamily: settings.fontFamily.value.toString()
    }) + YAxisAdditionalMargin : 0;
}

export function getXAxisHeight(chartData: TableHeatMapChartData, settings: BaseLabelCardSettings): number {
    const categoryX: string[] = chartData.categoryX.map(x => x?.toString() ?? "");
    const maxLengthText: powerbi.PrimitiveValue = maxBy(categoryX, "length") || "";

    return settings.show.value ? textMeasurementService.measureSvgTextHeight({
        fontSize: PixelConverter.toString(settings.fontSize.value),
        text: maxLengthText.toString().trim(),
        fontFamily: settings.fontFamily.value.toString()
    }) : 0;
}

export function getYAxisHeight(chartData: TableHeatMapChartData, settings: YAxisLabelsSettings): number {
    const maxLengthText: powerbi.PrimitiveValue = maxBy(chartData.categoryY, (d) => String(d).length) || "";

    return textMeasurementService.measureSvgTextHeight({
        fontSize: PixelConverter.toString(settings.fontSize.value),
        text: maxLengthText.toString().trim(),
        fontFamily: settings.fontFamily.value.toString()
    });
}

export function calculateGridSizeHeight(
    viewportHeight: number,
    xAxisHeight: number,
    categoryYLength: number,
    marginTop: number,
    marginBottom: number
): number {
    const gridSizeHeight: number = Math.floor(
        (viewportHeight - marginTop - xAxisHeight - marginBottom - YAxisAdditionalMargin) /
        (categoryYLength + GridHeightAdjustmentFactor)
    );

    return Math.max(ConstGridMinHeight, Math.min(gridSizeHeight, CellMaxHeightLimit));
}

export function calculateGridSizeWidth(
    viewportWidth: number,
    yAxisWidth: number,
    categoryXLength: number,
    gridSizeHeight: number
): number {
    if (categoryXLength <= 0) {
        return ConstGridMinWidth;
    }
    const gridSizeWidth: number = Math.floor((viewportWidth - yAxisWidth) / categoryXLength);

    return Math.max(ConstGridMinWidth, Math.min(gridSizeWidth, gridSizeHeight * CellMaxWidthFactorLimit));
}

export function parseSettings(colorHelper: ColorHelper, settingsModel: SettingsModel): SettingsModel {
    if (colorHelper.isHighContrast) {
        const foregroundColor: string = colorHelper.getThemeColor("foreground");
        const backgroundColor: string = colorHelper.getThemeColor("background");

        settingsModel.labels.show.value = true;
        settingsModel.labels.fill.value.value = foregroundColor;

        settingsModel.xAxisLabels.fill.value.value = foregroundColor;
        settingsModel.yAxisLabels.fill.value.value = foregroundColor;

        settingsModel.general.enableColorbrewer.value = false;
        settingsModel.general.activateGradientMiddle.value = false;
        settingsModel.general.gradientStart.value.value = backgroundColor;
        settingsModel.general.gradientEnd.value.value = backgroundColor;
        settingsModel.general.stroke = foregroundColor;
        settingsModel.general.textColor = foregroundColor;
    } else {
        settingsModel.general.stroke = GeneralSettings.DefaultStroke;
        settingsModel.general.textColor = GeneralSettings.DefaultTextColor;
    }

    return settingsModel;
}

// ---------------------------------------------------------------------------
// WCAG 2.x relative luminance helpers (W3C formula: https://www.w3.org/TR/WCAG20/#relativeluminancedef)
// ---------------------------------------------------------------------------

// sRGB linearization coefficients (IEC 61966-2-1)
const SRGB_CHANNEL_MAX             = 255;    // maximum 8-bit channel value
const SRGB_LINEARIZATION_THRESHOLD = 0.03928; // below this, use linear segment
const SRGB_LINEAR_DIVISOR          = 12.92;  // divisor for the linear segment
const SRGB_EXPONENT_OFFSET         = 0.055;  // offset in the power-law segment
const SRGB_EXPONENT_SCALE          = 1.055;  // scale  in the power-law segment
const SRGB_GAMMA                   = 2.4;    // gamma exponent (IEC 61966-2-1)

// WCAG 2.x relative-luminance coefficients (ITU-R BT.709 primaries)
const WCAG_RED_COEFF               = 0.2126;
const WCAG_GREEN_COEFF             = 0.7152;
const WCAG_BLUE_COEFF              = 0.0722;

// Offset added to both luminances in the WCAG contrast-ratio formula
const WCAG_LUMINANCE_OFFSET        = 0.05;

/** WCAG AA contrast ratio target for normal text. */
export const WCAG_AA_CONTRAST_RATIO: number = 4.5;

// formatRgb() rounds r/g/b to integers on output, which can lower the contrast by up to ~0.02.
// The binary search targets this slightly higher value so the rounded output still clears 4.5:1.
const WCAG_AA_BINARY_SEARCH_TARGET: number = WCAG_AA_CONTRAST_RATIO + 0.05;

/**
 * WCAG crossover luminance: the background luminance at which dark and light
 * text yield equal contrast ratios. Derived from (L+0.05)/0.05 = 1.05/(L+0.05)
 * → L ≈ 0.179.
 */
const WCAG_CROSSOVER_LUMINANCE = 0.179;

/** Iterations for the binary-search in Strong mode: 2^-20 ≈ 10^-6 lightness precision. */
const BINARY_SEARCH_ITERATIONS = 20;

/** Auto-contrast mode identifiers — must match the enumeration values in capabilities.json. */
export const AUTO_CONTRAST_MODE_OFF    = "Off" as const;
export const AUTO_CONTRAST_MODE_SOFT   = "Soft" as const;
export const AUTO_CONTRAST_MODE_STRONG = "Strong" as const;

export type AutoContrastMode =
    typeof AUTO_CONTRAST_MODE_OFF |
    typeof AUTO_CONTRAST_MODE_SOFT |
    typeof AUTO_CONTRAST_MODE_STRONG;

/** sRGB channel 0–255 → linear-light value (IEC 61966-2-1). */
function linearizeChannel(c255: number): number {
    const c = c255 / SRGB_CHANNEL_MAX;
    return c <= SRGB_LINEARIZATION_THRESHOLD
        ? c / SRGB_LINEAR_DIVISOR
        : ((c + SRGB_EXPONENT_OFFSET) / SRGB_EXPONENT_SCALE) ** SRGB_GAMMA;
}

/** WCAG 2.x relative luminance in [0, 1]. */
function relativeLuminance(rgb: RGBColor): number {
    return WCAG_RED_COEFF   * linearizeChannel(rgb.r) +
           WCAG_GREEN_COEFF * linearizeChannel(rgb.g) +
           WCAG_BLUE_COEFF  * linearizeChannel(rgb.b);
}

/** WCAG 2.x contrast ratio; inputs are relative luminances. */
function contrastRatioFromLuminances(l1: number, l2: number): number {
    const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (light + WCAG_LUMINANCE_OFFSET) / (dark + WCAG_LUMINANCE_OFFSET);
}

/**
 * Returns the WCAG 2.x contrast ratio between two CSS colour strings (treated as opaque; alpha is ignored),
 * or `null` if either is invalid/unparseable.
 */
export function wcagContrastRatio(color1: string, color2: string): number | null {
    const c1 = d3Color(color1);
    const c2 = d3Color(color2);
    if (c1 === null || c2 === null) return null;
    return contrastRatioFromLuminances(relativeLuminance(c1.rgb()), relativeLuminance(c2.rgb()));
}

// ---------------------------------------------------------------------------

/**
 * Preserves the user's hue/saturation and alpha; clamps only lightness to stay legible on `backgroundColor`.
 *
 * Note: uses a fixed Lab-lightness threshold (LAB_LIGHT_BG_THRESHOLD) rather than a full WCAG
 * luminance-contrast calculation. For highly saturated hues (e.g. yellow on white) the result
 * may not meet WCAG AA contrast requirements; the trade-off is intentional — hue and saturation
 * are preserved so the user's brand colour identity is retained.
 */
export function getAdaptiveLabelColor(userColor: string, backgroundColor: string): string {
    const bg = d3Color(backgroundColor);
    const fg = d3Hsl(userColor);
    // Invalid/unsupported inputs -> keep the user-picked color unchanged.
    if (bg === null || fg === null || isNaN(fg.l)) {
        return userColor;
    }
    // lab(...).l is perceptual lightness in [0, 100]; high = light background.
    fg.l = d3Lab(bg).l > LAB_LIGHT_BG_THRESHOLD ? DARK_LABEL_LIGHTNESS : LIGHT_LABEL_LIGHTNESS;
    // formatRgb() emits rgba(r,g,b,a) when opacity < 1, preserving any user-set transparency.
    return fg.formatRgb();
}

/**
 * Strong mode: binary-search HSL lightness until WCAG AA contrast ratio (≥ 4.5:1) is met.
 * Preserves hue, saturation, and alpha; only adjusts lightness.
 *
 * The search starts from the Soft-mode target direction (DARK_LABEL_LIGHTNESS toward 0 for
 * light backgrounds, LIGHT_LABEL_LIGHTNESS toward 1 for dark backgrounds), so it makes the
 * smallest possible lightness change that achieves the required contrast.
 */
export function getAdaptiveLabelColorStrong(userColor: string, backgroundColor: string): string {
    const bgParsed = d3Color(backgroundColor);
    const fg = d3Hsl(userColor);
    if (bgParsed === null || fg === null || isNaN(fg.l)) {
        return userColor;
    }
    const bgRgb = bgParsed.rgb();
    const bgLum = relativeLuminance(bgRgb);
    const useDark = bgLum > WCAG_CROSSOVER_LUMINANCE; // dark text on light bg

    // Binary-search range:
    //   dark text → maximise l within [0, DARK_LABEL_LIGHTNESS] (l=0 always satisfies)
    //   light text → minimise l within [LIGHT_LABEL_LIGHTNESS, 1] (l=1 always satisfies)
    let lo = useDark ? 0 : LIGHT_LABEL_LIGHTNESS;
    let hi = useDark ? DARK_LABEL_LIGHTNESS : 1;

    for (let i = 0; i < BINARY_SEARCH_ITERATIONS; i++) {
        const mid = (lo + hi) / 2;
        fg.l = mid;
        const fgRgb = fg.rgb();
        // If the user color has alpha < 1, the perceived text is the alpha-composite of fg over bg.
        // Compute luminance on the composited colour so the contrast check reflects what is rendered.
        const a = fgRgb.opacity ?? 1;
        const compR = fgRgb.r * a + bgRgb.r * (1 - a);
        const compG = fgRgb.g * a + bgRgb.g * (1 - a);
        const compB = fgRgb.b * a + bgRgb.b * (1 - a);
        const fgLum =
            WCAG_RED_COEFF   * linearizeChannel(compR) +
            WCAG_GREEN_COEFF * linearizeChannel(compG) +
            WCAG_BLUE_COEFF  * linearizeChannel(compB);
        if (contrastRatioFromLuminances(fgLum, bgLum) >= WCAG_AA_BINARY_SEARCH_TARGET) {
            // Meets the ratio — can relax toward the user's preferred direction
            if (useDark) lo = mid; else hi = mid;
        } else {
            // Fails — push toward the extreme
            if (useDark) hi = mid; else lo = mid;
        }
    }
    fg.l = useDark ? lo : hi;
    return fg.formatRgb();
}

/**
 * Dispatcher: routes to the appropriate contrast algorithm based on `mode`.
 * @param mode One of the AUTO_CONTRAST_MODE_* constants.
 */
export function applyAutoContrast(userColor: string, backgroundColor: string, mode: AutoContrastMode): string {
    if (mode === AUTO_CONTRAST_MODE_OFF)    return userColor;
    if (mode === AUTO_CONTRAST_MODE_STRONG) return getAdaptiveLabelColorStrong(userColor, backgroundColor);
    return getAdaptiveLabelColor(userColor, backgroundColor); // Soft
}

