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
import "./../style/style.less";

import { valueFormatter, textMeasurementService } from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = valueFormatter.IValueFormatter;

import { TextProperties } from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";

import { axis } from "powerbi-visuals-utils-chartutils";
import LabelLayoutStrategy = axis.LabelLayoutStrategy;

import { manipulation, CssConstants } from "powerbi-visuals-utils-svgutils";
import createClassAndSelector = CssConstants.createClassAndSelector;
import translate = manipulation.translate;

import { createLinearColorScale, LinearColorScale, ColorHelper } from "powerbi-visuals-utils-colorutils";

import { select as d3Select, Selection as ID3Selection } from "d3-selection";
import { ScaleQuantile as ID3ScaleQuantile, scaleQuantile as d3ScaleQuantile } from "d3-scale";
import { min as d3Min, max as d3Max } from "d3-array";

import "d3-transition";

import maxBy from "lodash.maxby";

import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";

import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IViewport = powerbi.IViewport;
import DataView = powerbi.DataView;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import ISelectionManager = powerbi.extensibility.ISelectionManager;

import { InfoDialogBox } from "./dialogBox";
import DialogAction = powerbi.DialogAction;
import VisualDialogPositionType = powerbi.VisualDialogPositionType;
import DialogOpenOptions = powerbi.extensibility.visual.DialogOpenOptions;

import { VisualWebBehavior, VisualBehaviorOptions } from "./visualWebBehavior";

import {
    IColorArray,
    ILegendDataPoint,
    IMargin,
    IRenderOptions,
    TableHeatMapChartData,
    TableHeatMapDataPoint,
} from "./dataInterfaces";

import {
    BaseLabelCardSettings,
    GeneralSettings,
    SettingsModel,
    YAxisLabelsSettings,
    colorbrewer
} from "./settings";

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

import {
    ITooltipServiceWrapper,
    TooltipEnabledDataPoint,
    createTooltipServiceWrapper
} from "powerbi-visuals-utils-tooltiputils";
import { ClassAndSelector } from "powerbi-visuals-utils-svgutils/lib/cssConstants";

type Selection<T> = ID3Selection<any, T, any, any>;
type Quantile<T> = ID3ScaleQuantile<T>;
type D3Element = Selection<any>;

export class TableHeatMap implements IVisual {
    private host: IVisualHost;
    private colorHelper: ColorHelper;
    private localizationManager: ILocalizationManager;

    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private svg: Selection<any>;
    private div: Selection<any>;
    private mainGraphics: Selection<any>;
    private dataView: DataView;
    private viewport: IViewport;
    private behavior: VisualWebBehavior;
    private static Margin: IMargin = { left: 5, right: 10, bottom: 15, top: 10 };
    private static AdditionalSpaceForColorbrewerCells: number = 2;

    private static YAxisAdditinalMargin: number = 5;
    private animationDuration: number = 1000;

    private static ClsAll: string = "*";
    private static ClsCategoryX: ClassAndSelector = createClassAndSelector("categoryX");
    private static ClsMono: string = "mono";
    private static ClsHeatMapDataLabels: ClassAndSelector = createClassAndSelector("heatMapDataLabels");
    private static ClsCategoryYLabel: ClassAndSelector = createClassAndSelector("categoryYLabel");
    private static ClsCategoryXLabel: ClassAndSelector = createClassAndSelector("categoryXLabel");
    private static ClsAxis: string = "axis";
    private static ClsLegend: ClassAndSelector = createClassAndSelector("legend");
    private static ClsBordered: string = "bordered";
    private static ClsNameSvgTableHeatMap: string = "svgTableHeatMap";
    private static ClsNameDivTableHeatMap: string = "divTableHeatMap";
    private static LegendLabel: string = "legendLabel";

    private static AttrTransform: string = "transform";
    private static AttrX: string = "x";
    private static AttrY: string = "y";
    private static AttrDX: string = "dx";
    private static AttrDY: string = "dy";
    private static AttrHeight: string = "height";
    private static AttrWidth: string = "width";

    private static HtmlObjTitle: string = "title";
    private static HtmlObjSvg: string = "svg";
    private static HtmlObjDiv: string = "div";
    private static HtmlObjG: string = "g";
    private static HtmlObjText: string = "text";
    private static HtmlObjRect: string = "rect";
    private static HtmlObjTspan: string = "tspan";

    private static StFill: string = "fill";
    private static StOpacity: string = "opacity";
    private static StTextAnchor: string = "text-anchor";

    private static ConstEnd: string = "end";
    private static ConstBegin: string = "begin";
    private static ConstMiddle: string = "middle";
    private static Const0em: string = "0em";
    private static Const071em: string = ".71em";

    private static ConstGridSizeWidthLimit: number = 80;
    private static ConstShiftLabelFromGrid: number = -6;
    private static ConstGridHeightWidthRatio: number = 0.5;
    private static ConstGridMinHeight: number = 5;
    private static ConstGridMinWidth: number = 1;
    private static ConstGridLegendWidthRatio: number = 0.925;
    private static ConstLegendOffsetFromChartByY: number = 0.5;
    private static ConstRectWidthAdjustment: number = 1;
    private static ConstRectHeightAdjustment: number = 1;

    private static LegendTextFontSize = 12;
    private static LegendTextFontFamily = "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";

    public static CellMaxHeightLimit: number = 300;
    private static CellMaxWidthFactorLimit: number = 15;

    private selectionManager: ISelectionManager;

    private settingsModel: SettingsModel;

    private formattingSettingsService: FormattingSettingsService;
    private viewMode: powerbi.ViewMode;

    public converter(dataView: DataView): TableHeatMapChartData {
        if (!dataView
            || !dataView.categorical
            || !dataView.categorical.categories
            || !dataView.categorical.categories[0]
            || !dataView.categorical.categories[0].values
            || !dataView.categorical.categories[0].values.length
            || !dataView.categorical.values
            || !dataView.categorical.values[0]
            || !dataView.categorical.values[0].values
            || !dataView.categorical.values[0].values.length
        ) {
            return <TableHeatMapChartData>{
                dataPoints: null
            };
        }

        this.dataView = dataView;

        const values = dataView.categorical.values;
        const groupedValues = dataView.categorical.values.grouped();

        const dataPoints: TableHeatMapDataPoint[] = [];
        const formatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(dataView.categorical.values.source ?? dataView.categorical.values[0].source),
            value: dataView.categorical.values[0].values[0],
            precision: 2
        });

        const categoryValueFormatter: IValueFormatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(dataView.categorical.categories[0].source),
            value: dataView.categorical.categories[0].values[0]
        });

        dataView.categorical.categories[0].values.forEach((categoryX, indexX) => {
            groupedValues.forEach((categoryY) => {
                categoryY.values.forEach((val) => {
                    const categoryYFormatter = valueFormatter.create({
                        format: val.source?.format,
                        value: dataView.categorical.values[0].values[0]
                    });

                    const value: powerbi.PrimitiveValue = val.values[indexX];
                    const selectionId = this.host.createSelectionIdBuilder()
                        .withCategory(dataView.categorical.categories[0], indexX)
                        .withSeries(values, categoryY)
                        .createSelectionId();

                    dataPoints.push({
                        categoryX: categoryX,
                        categoryY: categoryY.name || val.source.displayName,
                        value: value,
                        valueStr: categoryYFormatter.format(value),
                        identity: selectionId,
                        selected: false,
                        tooltipInfo: [{
                            displayName: `Category`,
                            value: (categoryX || "").toString()
                        },
                        {
                            displayName: `Y`,
                            value: (categoryY.name || val.source.displayName || "").toString()
                        },
                        {
                            displayName: `Value`,
                            value: categoryYFormatter.format(value)
                        }]
                    });

                });
            });
        });

        const hasSeries: boolean = dataView.metadata.columns.some((column) => column.roles["Series"]);
        const result: TableHeatMapChartData = {
            dataPoints: dataPoints,
            categoryX: dataView.categorical.categories[0].values.filter((n) => {
                return n !== undefined;
            }),
            categoryY: hasSeries
                ? groupedValues.map(v => v.name).filter((n) => {
                    return n !== undefined;
                })
                : dataView.categorical.values.map(v => v.source.displayName).filter((n) => {
                    return n !== undefined;
                }),
            categoryValueFormatter: categoryValueFormatter,
            valueFormatter: formatter,
            isInteractivitySupported: hasSeries
        };
        return result;
    }

    constructor({
        host,
        element
    }: VisualConstructorOptions) {
        this.host = host;

        this.div = d3Select(element)
            .append(TableHeatMap.HtmlObjDiv)
            .classed(TableHeatMap.ClsNameDivTableHeatMap, true);

        this.svg = this.div
            .append(TableHeatMap.HtmlObjSvg)
            .classed(TableHeatMap.ClsNameSvgTableHeatMap, true);

        this.colorHelper = new ColorHelper(this.host.colorPalette);
        this.localizationManager = host.createLocalizationManager();

        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);

        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            this.host.tooltipService,
            element);

        this.selectionManager = this.host.createSelectionManager();

        this.behavior = new VisualWebBehavior(this.selectionManager);
    }

    public update(options: VisualUpdateOptions): void {
        if (!options.dataViews || !options.dataViews[0]) {
            return;
        }
        try {
            this.host.eventService.renderingStarted(options);
            this.processViewMode(options);

            this.settingsModel = this.formattingSettingsService.populateFormattingSettingsModel(SettingsModel, options.dataViews[0]);
            this.settingsModel.initBuckets();
            this.settingsModel = TableHeatMap.parseSettings(this.colorHelper, this.settingsModel);

            this.svg.selectAll(TableHeatMap.ClsAll).remove();
            this.div.attr("width", PixelConverter.toString(options.viewport.width + TableHeatMap.Margin.left));
            this.div.attr("height", PixelConverter.toString(options.viewport.height + TableHeatMap.Margin.left));

            this.mainGraphics = this.svg.append(TableHeatMap.HtmlObjG);

            this.setSize(options.viewport);

            this.render(this.converter(options.dataViews[0]), this.settingsModel, options.viewport);

        } catch (ex) {
            this.host.eventService.renderingFailed(options, JSON.stringify(ex));
        }
        this.host.eventService.renderingFinished(options);
    }

    private static getYAxisWidth(chartData: TableHeatMapChartData, settings: YAxisLabelsSettings): number {
        let maxLengthText: powerbi.PrimitiveValue = maxBy(chartData.categoryY, (d) => String(d).length) || "";

        maxLengthText = TableHeatMap.textLimit(maxLengthText.toString(), settings.maxTextSymbol.value);

        return settings.show.value ? textMeasurementService.measureSvgTextWidth({
            fontSize: PixelConverter.toString(settings.fontSize.value),
            text: maxLengthText.trim(),
            fontFamily: settings.fontFamily.value.toString()
        }) + TableHeatMap.YAxisAdditinalMargin : 0;
    }

    private static getXAxisHeight(chartData: TableHeatMapChartData, settings: BaseLabelCardSettings): number {
        const categoryX: string[] = chartData.categoryX.map(x => x?.toString() ?? "");
        const maxLengthText: powerbi.PrimitiveValue = maxBy(categoryX, "length") || "";

        return settings.show.value ? textMeasurementService.measureSvgTextHeight({
            fontSize: PixelConverter.toString(settings.fontSize.value),
            text: maxLengthText.toString().trim(),
            fontFamily: settings.fontFamily.value.toString()
        }) : 0;
    }

    private processViewMode(options: VisualUpdateOptions): void {
        const { viewMode, dataViews } = options;
        const hasSeries = dataViews[0].metadata.columns.some(col => col.roles["Series"]);
        const hasCategory = dataViews[0].metadata.columns.some(col => col.roles["Category"]);
        const hasValues = dataViews[0].metadata.columns.some(col => col.roles["Y"]);

        if (viewMode === powerbi.ViewMode.View || hasSeries) {
            this.viewMode = viewMode;
            return;
        }

        const isEditMode =
            viewMode === powerbi.ViewMode.Edit ||
            viewMode === powerbi.ViewMode.InFocusEdit;

        if (isEditMode && !this.viewMode && !hasSeries && hasCategory && hasValues) {
            this.viewMode = viewMode;
            const dialogOptions: DialogOpenOptions = {
                actionButtons: [DialogAction.OK],
                position: {
                    type: VisualDialogPositionType.RelativeToVisual,
                    left: 0,
                    top: 0
                },
                size: { width: 300, height: 50 },
                title: ""
            };
            this.host.openModalDialog(InfoDialogBox.Id, dialogOptions);
        }
    }

    private getYAxisHeight(chartData: TableHeatMapChartData): number {
        const maxLengthText: powerbi.PrimitiveValue = maxBy(chartData.categoryY, (d) => String(d).length) || "";

        return textMeasurementService.measureSvgTextHeight({
            fontSize: PixelConverter.toString(this.settingsModel.yAxisLabels.fontSize.value),
            text: maxLengthText.toString().trim(),
            fontFamily: this.settingsModel.yAxisLabels.fontFamily.value.toString()
        });
    }

    private static parseSettings(colorHelper: ColorHelper, settingsModel: SettingsModel): SettingsModel {
        if (colorHelper.isHighContrast) {
            const foregroundColor: string = colorHelper.getThemeColor("foreground");
            const backgroundColor: string = colorHelper.getThemeColor("background");

            settingsModel.labels.show.value = true;
            settingsModel.labels.fill.value.value = foregroundColor;

            settingsModel.xAxisLabels.fill.value.value = foregroundColor;
            settingsModel.yAxisLabels.fill.value.value = foregroundColor;

            settingsModel.general.enableColorbrewer.value = false;
            settingsModel.general.gradientStart.value.value = backgroundColor;
            settingsModel.general.gradientEnd.value.value = backgroundColor;
            GeneralSettings.stroke = foregroundColor;
            settingsModel.general.textColor = foregroundColor;
        }

        return settingsModel;
    }

    private getGridSizeHeight(xAxisHeight: number, length: number): number {
        const gridSizeHeight: number = Math.floor((this.viewport.height - TableHeatMap.Margin.top - xAxisHeight - TableHeatMap.Margin.bottom - TableHeatMap.YAxisAdditinalMargin) / (length + TableHeatMap.AdditionalSpaceForColorbrewerCells));

        return Math.max(
            TableHeatMap.ConstGridMinHeight,
            Math.min(gridSizeHeight, TableHeatMap.CellMaxHeightLimit));
    }

    private getGridSizeWidth(yAxisWidth: number, length: number, gridSizeHeight: number): number {
        const gridSizeWidth: number = Math.floor((this.viewport.width - yAxisWidth) / (length));

        return Math.max(
            TableHeatMap.ConstGridMinWidth,
            Math.min(gridSizeWidth, gridSizeHeight * TableHeatMap.CellMaxWidthFactorLimit)
        );
    }

    private render(chartData: TableHeatMapChartData, settingsModel: SettingsModel, viewport: IViewport): void {
        if (chartData.dataPoints) {
            const renderOptions: IRenderOptions = this.createRenderOptions(chartData, settingsModel);

            if (settingsModel.yAxisLabels.show.value) {
                this.renderYAxisLabels(renderOptions);
            }

            if (settingsModel.xAxisLabels.show.value) {
                this.renderXAxisLabels(renderOptions);
            }

            const heatMapSelection = this.renderGrid(renderOptions);
            this.animateGrid(heatMapSelection, renderOptions);

            if (settingsModel.labels.show.value) {
                this.renderLabels(renderOptions);
            }

            const legendSelection: Selection<ILegendDataPoint> = this.renderLegend(renderOptions, viewport);

            this.bindBehaviorToVisual(heatMapSelection, legendSelection, chartData.isInteractivitySupported);
        }
    }

    private createRenderOptions(chartData: TableHeatMapChartData, settingsModel: SettingsModel): IRenderOptions {
        const xAxisHeight: number = TableHeatMap.getXAxisHeight(chartData, settingsModel.xAxisLabels);
        const yAxisWidth: number = TableHeatMap.getYAxisWidth(chartData, settingsModel.yAxisLabels);
        const yAxisHeight: number = this.getYAxisHeight(chartData);

        const xOffset: number = TableHeatMap.Margin.left + yAxisWidth;
        const yOffset: number = TableHeatMap.Margin.top + xAxisHeight;

        const gridSizeHeight: number = this.getGridSizeHeight(xAxisHeight, chartData.categoryY.length);
        const gridSizeWidth: number = this.getGridSizeWidth(yAxisWidth, chartData.categoryX.length, gridSizeHeight);

        const minDataValue: number = d3Min(chartData.dataPoints, (d: TableHeatMapDataPoint) => d.value as number);
        const maxDataValue: number = d3Max(chartData.dataPoints, (d: TableHeatMapDataPoint) => d.value as number);

        const colors: string[] = this.initColors(settingsModel);


        const colorScale: Quantile<string> = d3ScaleQuantile<string>()
            .domain([minDataValue, maxDataValue])
            .range(colors);

        settingsModel.general.gradientStart.value.value = colors[0];
        settingsModel.general.gradientEnd.value.value = colors[colors.length - 1];

        const renderOptions: IRenderOptions = {
            chartData,
            settingsModel,
            xAxisHeight,
            yAxisWidth,
            yAxisHeight,
            xOffset,
            yOffset,
            gridSizeHeight,
            gridSizeWidth,
            colors,
            colorScale
        }

        return renderOptions;
    }

    private initColors(settingsModel: SettingsModel): string[] {
        const colorbrewerScale: string = settingsModel.general.colorbrewer.value.toString();
        const colorbrewerEnable: boolean = settingsModel.general.enableColorbrewer.value;
        const numBuckets: number = settingsModel.CurrentBucketCount;

        let colors: Array<string>;
        if (colorbrewerEnable) {
            if (colorbrewerScale) {
                const currentColorbrewer: IColorArray = colorbrewer[colorbrewerScale];
                colors = (currentColorbrewer ? currentColorbrewer[numBuckets] : colorbrewer.Reds[numBuckets]);
            }
            else {
                colors = colorbrewer.Reds[numBuckets];	// default color scheme
            }
        } else {
            const startColor: string = settingsModel.general.gradientStart.value.value;
            const endColor: string = settingsModel.general.gradientEnd.value.value;
            const colorScale: LinearColorScale = createLinearColorScale([0, numBuckets], [startColor, endColor], true);
            colors = [];

            for (let bucketIndex: number = 0; bucketIndex < numBuckets; bucketIndex++) {
                colors.push(colorScale(bucketIndex));
            }
        }

        return colors;
    }

    private renderGrid(renderOptions: IRenderOptions): Selection<TableHeatMapDataPoint> {
        const { chartData, colors, xOffset, yOffset, gridSizeHeight, gridSizeWidth } = renderOptions;

        const grid = this.mainGraphics
            .append(TableHeatMap.HtmlObjG)
            .attr("id", "gridTableHeatMap")
            .attr("role", "grid")
            .attr("aria-multiselectable", true);

        const heatMap: Selection<TableHeatMapDataPoint> = grid
            .selectAll(TableHeatMap.ClsCategoryX.selectorName)
            .data(chartData.dataPoints)
            .join(TableHeatMap.HtmlObjRect)
            .attr(TableHeatMap.AttrX, function (d: TableHeatMapDataPoint) {
                return chartData.categoryX.indexOf(d.categoryX) * gridSizeWidth + xOffset;
            })
            .attr(TableHeatMap.AttrY, function (d: TableHeatMapDataPoint) {
                return chartData.categoryY.indexOf(d.categoryY) * gridSizeHeight + yOffset;
            })
            .attr("tabindex", 0)
            .classed(TableHeatMap.ClsCategoryX.className, true)
            .classed(TableHeatMap.ClsBordered, true)
            .attr(TableHeatMap.AttrWidth, gridSizeWidth - TableHeatMap.ConstRectWidthAdjustment)
            .attr(TableHeatMap.AttrHeight, gridSizeHeight - TableHeatMap.ConstRectHeightAdjustment)
            .style(TableHeatMap.StFill, colors[0])
            .style("stroke", GeneralSettings.stroke);

        this.tooltipServiceWrapper.addTooltip(heatMap, (tooltipDataPoint: TooltipEnabledDataPoint) => {
            return tooltipDataPoint.tooltipInfo;
        });

        return this.mainGraphics.selectAll(TableHeatMap.ClsCategoryX.selectorName).data(chartData.dataPoints);
    }

    private animateGrid(heatMap: Selection<TableHeatMapDataPoint>, renderOptions: IRenderOptions): void {
        const { colorScale, settingsModel } = renderOptions;
        const suppressAnimations: boolean = false;
        const elementAnimation: Selection<D3Element> = <Selection<D3Element>>this.getAnimationMode(heatMap, suppressAnimations);
        if (!settingsModel.general.fillNullValuesCells.value) {
            heatMap.style(TableHeatMap.StOpacity, (d: TableHeatMapDataPoint) => {
                return d.value === null || d.value === "" ? 0 : 1;
            });
        }
        elementAnimation.style(TableHeatMap.StFill, function (d: any) {
            return <string>colorScale(d.value);
        });
    }

    private renderLabels(renderOptions: IRenderOptions): Selection<TableHeatMapDataPoint> {
        const { chartData, settingsModel, xOffset, yOffset, gridSizeHeight, gridSizeWidth } = renderOptions;
        const labelSettings: BaseLabelCardSettings = settingsModel.labels;

        const maxDataText = chartData.dataPoints.reduce((max: string, dp: TableHeatMapDataPoint) => {
            const val = dp.valueStr || "";
            return val.length > max.length ? val : max;
        }, "");

        const textProperties: TextProperties = {
            fontSize: PixelConverter.toString(labelSettings.fontSize.value),
            fontFamily: labelSettings.fontFamily.value.toString(),
            text: maxDataText
        };

        const textRect: SVGRect = textMeasurementService.measureSvgTextRect(textProperties);

        const heatMapDataLables: Selection<TableHeatMapDataPoint> = this.mainGraphics
            .selectAll(TableHeatMap.ClsHeatMapDataLabels.selectorName)
            .data(chartData.dataPoints)
            .join(TableHeatMap.HtmlObjText)
            .classed(TableHeatMap.ClsHeatMapDataLabels.className, true)
            .attr(TableHeatMap.AttrX, function (d: TableHeatMapDataPoint) {
                return chartData.categoryX.indexOf(d.categoryX) * gridSizeWidth + xOffset + gridSizeWidth / 2;
            })
            .attr(TableHeatMap.AttrY, function (d: TableHeatMapDataPoint) {
                return chartData.categoryY.indexOf(d.categoryY) * gridSizeHeight + yOffset + gridSizeHeight / 2 + gridSizeHeight / 5;
            })
            .style("text-anchor", TableHeatMap.ConstMiddle)
            .call(this.applyFontStylesToLabels(labelSettings))
            .style("fill", labelSettings.fill.value.value)
            .text((dataPoint: TableHeatMapDataPoint) => {
                let textValue: string = valueFormatter.format(dataPoint.value);
                textProperties.text = textValue;
                textValue = textMeasurementService.getTailoredTextOrDefault(textProperties, gridSizeWidth);

                if (textRect.height >= gridSizeHeight) return "..."

                return dataPoint.value === 0 ? 0 : textValue;
            });

        return heatMapDataLables;
    }

    private renderYAxisLabels(renderOptions: IRenderOptions): void {
        const { chartData, settingsModel, yAxisHeight, xOffset, yOffset, gridSizeHeight, gridSizeWidth } = renderOptions;

        const labelSettings: BaseLabelCardSettings = settingsModel.yAxisLabels;

        const categoryYElements: Selection<powerbi.PrimitiveValue> = this.mainGraphics
            .selectAll(TableHeatMap.ClsCategoryYLabel.selectorName)
            .data(chartData.categoryY)
            .join(TableHeatMap.HtmlObjText)
            .text((d: powerbi.PrimitiveValue) => {
                return TableHeatMap.textLimit(d.toString(), settingsModel.yAxisLabels.maxTextSymbol.value);
            })
            .attr(TableHeatMap.AttrDY, TableHeatMap.Const071em)
            .attr(TableHeatMap.AttrX, TableHeatMap.Margin.left)
            .attr(TableHeatMap.AttrY, function (d, i) {
                return i * gridSizeHeight - (gridSizeHeight / 2) + yOffset - yAxisHeight / 3;
            })
            .style(TableHeatMap.StTextAnchor, TableHeatMap.ConstBegin)
            .call(this.applyFontStylesToLabels(labelSettings))
            .style("fill", settingsModel.yAxisLabels.fill.value.value)
            .attr(TableHeatMap.AttrTransform, translate(TableHeatMap.ConstShiftLabelFromGrid, gridSizeHeight))
            .classed(TableHeatMap.ClsCategoryYLabel.className, true)
            .classed(TableHeatMap.ClsMono, true)
            .classed(TableHeatMap.ClsAxis, true);

        categoryYElements
            .call(this.wrap, gridSizeWidth + xOffset);

        this.truncateTextIfNeeded(categoryYElements, gridSizeWidth + xOffset);
    }

    private renderXAxisLabels(renderOptions: IRenderOptions): void {
        const { chartData, settingsModel, xOffset, gridSizeWidth } = renderOptions;

        const labelSettings: BaseLabelCardSettings = settingsModel.xAxisLabels;

        const categoryXElements: Selection<powerbi.PrimitiveValue> = this.mainGraphics
            .selectAll(TableHeatMap.ClsCategoryXLabel.selectorName)
            .data(chartData.categoryX)
            .join(TableHeatMap.HtmlObjText)
            .text((d: string) => {
                return chartData.categoryValueFormatter.format(d);
            })
            .attr(TableHeatMap.AttrX, function (d: string, i: number) {
                return i * gridSizeWidth + xOffset;
            })
            .attr(TableHeatMap.AttrY, TableHeatMap.Margin.top)
            .attr(TableHeatMap.AttrDY, TableHeatMap.Const071em)
            .style(TableHeatMap.StTextAnchor, TableHeatMap.ConstMiddle)
            .call(this.applyFontStylesToLabels(labelSettings))
            .style("fill", settingsModel.xAxisLabels.fill.value.value)
            .classed(TableHeatMap.ClsCategoryXLabel.className, true)
            .classed(TableHeatMap.ClsMono, true)
            .classed(TableHeatMap.ClsAxis, true)
            .attr(TableHeatMap.AttrTransform, translate(gridSizeWidth * TableHeatMap.ConstGridHeightWidthRatio, TableHeatMap.ConstShiftLabelFromGrid))
            .attr("role", "presentation");

        this.truncateTextIfNeeded(categoryXElements, gridSizeWidth);
    }

    private applyFontStylesToLabels(settings: BaseLabelCardSettings) {
        return function (selection) {
            selection
                .style("font-size", settings.fontSize.value)
                .style("font-family", settings.fontFamily.value)
                .style("font-weight", settings.fontBold.value ? "bold" : "normal")
                .style("font-style", settings.fontItalic.value ? "italic" : "normal")
                .style("text-decoration", settings.fontUnderline.value ? "underline" : "none");
        }
    }

    private renderLegend(renderOptions: IRenderOptions, viewport: IViewport): Selection<ILegendDataPoint> {
        const { chartData, settingsModel, colors, colorScale, xOffset, gridSizeHeight, xAxisHeight } = renderOptions;

        const numBuckets: number = settingsModel.CurrentBucketCount;

        const minDataValue: number = d3Min(chartData.dataPoints, (d: TableHeatMapDataPoint) => d.value as number);
        const maxDataValue: number = d3Max(chartData.dataPoints, (d: TableHeatMapDataPoint) => d.value as number);

        const availableWidth = viewport.width * TableHeatMap.ConstGridLegendWidthRatio - xOffset;
        const legendElementWidth = Math.max(1, availableWidth / numBuckets);

        const legendDataValues = [minDataValue].concat(colorScale.quantiles());
        const legendData: ILegendDataPoint[] = legendDataValues.concat(maxDataValue).map((value, index) => {
            const nextValue: number = legendDataValues[index + 1];
            const maxValue =
                nextValue && typeof nextValue === "number"
                    ? nextValue.toFixed(0)
                    : chartData.categoryValueFormatter.format(maxDataValue);

            return {
                value: value,
                index: index,
                maxValue: +maxValue,
                selected: false,
                tooltipInfo: [{
                    displayName: `Min value`,
                    value: value && typeof value === "number" ? value.toFixed(0) : chartData.categoryValueFormatter.format(value)
                },
                {
                    displayName: `Max value`,
                    value: maxValue
                }]
            };
        });

        const margin = 10;

        const legendOffsetCellsY: number = TableHeatMap.Margin.top
            + gridSizeHeight * (chartData.categoryY.length + TableHeatMap.ConstLegendOffsetFromChartByY)
            + xAxisHeight;

        const legendOffsetTextY: number = legendOffsetCellsY + gridSizeHeight + TableHeatMap.Margin.bottom;

        const legendSelection: Selection<any> = this.mainGraphics
            .append(TableHeatMap.HtmlObjG)
            .classed(TableHeatMap.ClsLegend.className, true);

        const legendItems: Selection<any> = legendSelection.selectAll(TableHeatMap.HtmlObjG)
            .data(legendData)
            .join(TableHeatMap.HtmlObjG);

        legendItems.selectAll(TableHeatMap.HtmlObjRect)
            .data(data => [data])
            .join(TableHeatMap.HtmlObjRect)
            .attr(TableHeatMap.AttrX, (d) => legendElementWidth * d.index + xOffset)
            .attr(TableHeatMap.AttrY, legendOffsetCellsY)
            .attr(TableHeatMap.AttrWidth, legendElementWidth - TableHeatMap.ConstRectWidthAdjustment)
            .attr(TableHeatMap.AttrHeight, gridSizeHeight - TableHeatMap.ConstRectHeightAdjustment)
            .style(TableHeatMap.StFill, (d) => colors[d.index])
            .style("stroke", GeneralSettings.stroke)
            .style("opacity", (d) => d.value !== maxDataValue ? 1 : 0)
            .classed(TableHeatMap.ClsBordered, true);

        legendItems.selectAll(TableHeatMap.HtmlObjText)
            .data(data => [data])
            .join(TableHeatMap.HtmlObjText)
            .classed(TableHeatMap.ClsMono, true)
            .classed(TableHeatMap.LegendLabel, true)
            .attr(TableHeatMap.AttrX, (d) => legendElementWidth * d.index + xOffset - margin)
            .attr(TableHeatMap.AttrY, legendOffsetTextY)
            .attr(TableHeatMap.AttrWidth, legendElementWidth)
            .attr(TableHeatMap.AttrHeight, gridSizeHeight)
            .text((d: ILegendDataPoint) => chartData.valueFormatter.format(d.value))
            .style("font-size", TableHeatMap.LegendTextFontSize)
            .style("font-family", TableHeatMap.LegendTextFontFamily)
            .style("fill", settingsModel.general.textColor)
            .attr("transform", (d: ILegendDataPoint) => {
                const formattedValue: string = chartData.valueFormatter.format(d.value);
                const textProperties = {
                    fontSize: PixelConverter.toString(TableHeatMap.LegendTextFontSize),
                    text: formattedValue,
                    fontFamily: TableHeatMap.LegendTextFontFamily
                };
                const textWidth = textMeasurementService.measureSvgTextWidth(textProperties);
                const needsRotation: boolean = textWidth >= legendElementWidth - margin;
                const fullRotation: boolean = textWidth >= legendElementWidth;

                if (!needsRotation){
                    return null;
                }

                const rotationAngle: number = fullRotation ? 90 : 65;
                return manipulation.translateAndRotate(0, 0, legendElementWidth * d.index + xOffset, legendOffsetTextY, rotationAngle);
            });

        if (legendOffsetTextY + gridSizeHeight > viewport.height) {
            this.svg.attr("height", legendOffsetTextY + gridSizeHeight);
        }

        this.addTooltipsToLegend(legendItems);

        return legendItems;
    }

    private addTooltipsToLegend(legend: any): void {
        this.tooltipServiceWrapper.addTooltip(
            legend,
            (tooltipDataPoint: TooltipEnabledDataPoint) => {
                return tooltipDataPoint.tooltipInfo;
            }
        );
    }

    private bindBehaviorToVisual(heatMap: Selection<TableHeatMapDataPoint>, legendItems: Selection<ILegendDataPoint>, isInteractivitySupported: boolean): void {
        const behaviorOptions: VisualBehaviorOptions = {
            selection: heatMap,
            clearCatcher: this.svg,
            legendItems: legendItems,
            isInteractivitySupported
        };

        this.behavior.bindEvents(behaviorOptions);
        this.behavior.renderSelection();
    }

    private static textLimit(text: string, limit: number) {
        if (text.length > limit) {
            return ((text || "").substring(0, limit).trim()) + "…";
        }

        return text;
    }

    private setSize(viewport: IViewport): void {
        this.svg
            .attr(TableHeatMap.AttrHeight, Math.max(viewport.height, 0))
            .attr(TableHeatMap.AttrWidth, Math.max(viewport.width, 0));

        const height: number =
            viewport.height -
            TableHeatMap.Margin.top -
            TableHeatMap.Margin.bottom;

        const width: number =
            viewport.width -
            TableHeatMap.Margin.left -
            TableHeatMap.Margin.right;

        this.viewport = {
            height: height,
            width: width
        };

        this.mainGraphics
            .attr(TableHeatMap.AttrHeight, Math.max(this.viewport.height + TableHeatMap.Margin.top, 0))
            .attr(TableHeatMap.AttrWidth, Math.max(this.viewport.width + TableHeatMap.Margin.left, 0));

        this.mainGraphics.attr(TableHeatMap.AttrTransform, translate(TableHeatMap.Margin.left, TableHeatMap.Margin.top));
    }

    private truncateTextIfNeeded(text: Selection<any>, width: number): void {
        text.call(LabelLayoutStrategy.clip,
            width,
            textMeasurementService.svgEllipsis);
    }

    private wrap(text, width): void {
        text.each(function () {
            const text: Selection<D3Element> = d3Select(this);
            const words: string[] = text.text().split(/\s+/).reverse();
            let word: string;
            let line: string[] = [];
            let lineNumber: number = 0;
            const lineHeight: number = 1.1; // ems
            const x: string = text.attr(TableHeatMap.AttrX);
            const y: string = text.attr(TableHeatMap.AttrY);
            const dy: number = parseFloat(text.attr(TableHeatMap.AttrDY));
            let tspan: Selection<any> = text.text(null).append(TableHeatMap.HtmlObjTspan).attr(TableHeatMap.AttrX, x).attr(TableHeatMap.AttrY, y).attr(TableHeatMap.AttrDY, dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                const tspannode: any = tspan.node();  // Fixing Typescript error: Property 'getComputedTextLength' does not exist on type 'Element'.
                if (tspannode.getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append(TableHeatMap.HtmlObjTspan).attr(TableHeatMap.AttrX, x).attr(TableHeatMap.AttrY, y).attr(TableHeatMap.AttrDY, ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }

    private getAnimationMode(element: D3Element, suppressAnimations: boolean) {
        if (suppressAnimations) {
            return element;
        }

        return element.transition().duration(this.animationDuration);
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        const model = this.formattingSettingsService.buildFormattingModel(this.settingsModel);
        return model;
    }
}
