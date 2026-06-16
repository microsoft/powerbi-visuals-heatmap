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

import { color as d3Color, hsl as d3Hsl, lab as d3Lab } from "d3-color";

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

// Preserve the user's hue/saturation; clamp lightness to stay legible on `backgroundColor`.
export function getAdaptiveLabelColor(userColor: string, backgroundColor: string): string {
    const bg = d3Color(backgroundColor);
    const fg = d3Hsl(userColor);
    // Invalid/unsupported inputs -> keep the user-picked color unchanged.
    if (bg === null || fg === null || isNaN(fg.l)) {
        return userColor;
    }
    // lab(...).l is perceptual lightness in [0, 100]; high = light background.
    fg.l = d3Lab(bg).l > LAB_LIGHT_BG_THRESHOLD ? DARK_LABEL_LIGHTNESS : LIGHT_LABEL_LIGHTNESS;
    return fg.formatHex();
}

