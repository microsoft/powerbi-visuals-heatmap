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

import { manipulation } from "powerbi-visuals-utils-svgutils";
import translate = manipulation.translate;

import { createLinearColorScale, LinearColorScale, ColorHelper } from "powerbi-visuals-utils-colorutils";

import { select as d3Select, Selection as ID3Selection, BaseType as ID3BaseType } from "d3-selection";
import { ScaleQuantile as ID3ScaleQuantile, scaleQuantile as d3ScaleQuantile } from "d3-scale";
import { min as d3Min, max as d3Max } from "d3-array";

import "d3-transition";

type Selection<T> = ID3Selection<any, T, any, any>;
type Quantile<T> = ID3ScaleQuantile<T>;

import maxBy from "lodash.maxby";

import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";

import IColorPalette = powerbi.extensibility.IColorPalette;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IViewport = powerbi.IViewport;
import DataView = powerbi.DataView;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import ISelectionManager = powerbi.extensibility.ISelectionManager;

import {
    IColorArray,
    IMargin,
    TableHeatMapChartData,
    TableHeatMapDataPoint,
} from "./dataInterfaces";

import {
    SettingsModel,
    colorbrewer
} from "./settings";

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

// powerbi.extensibility.utils.tooltip
import {
    ITooltipServiceWrapper,
    TooltipEnabledDataPoint,
    createTooltipServiceWrapper
} from "powerbi-visuals-utils-tooltiputils";

type D3Element =
    Selection<any>;

export class TableHeatMap implements IVisual {
    private static Properties: any = {
        dataPoint: {
            fill: <DataViewObjectPropertyIdentifier>{
                objectName: "dataPoint",
                propertyName: "fill"
            }
        },
        labels: {
            labelPrecision: <DataViewObjectPropertyIdentifier>{
                objectName: "labels",
                propertyName: "labelPrecision"
            }
        }
    };

    private host: IVisualHost;
    private colorHelper: ColorHelper;
    private localizationManager: ILocalizationManager;

    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private svg: Selection<any>;
    private div: Selection<any>;
    private mainGraphics: Selection<any>;
    private colors: IColorPalette;
    private dataView: DataView;
    private viewport: IViewport;
    private margin: IMargin = { left: 5, right: 10, bottom: 15, top: 10 };

    private static YAxisAdditinalMargin: number = 5;
    private animationDuration: number = 1000;

    private static ClsAll: string = "*";
    private static ClsCategoryX: string = "categoryX";
    private static ClsMono: string = "mono";
    public static CLsHeatMapDataLabels = "heatMapDataLabels";
    private static ClsCategoryYLabel: string = "categoryYLabel";
    private static ClsCategoryXLabel: string = "categoryXLabel";
    private static ClsAxis: string = "axis";
    private static ClsLegend: string = "legend";
    private static ClsBordered: string = "bordered";
    private static ClsNameSvgTableHeatMap: string = "svgTableHeatMap";
    private static ClsNameDivTableHeatMap: string = "divTableHeatMap";

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
    private static ConstGridHeightWidthRaito: number = 0.5;
    private static ConstGridMinHeight: number = 16;
    private static ConstGridMinWidth: number = 36;
    private static ConstGridLegendWidthRaito: number = 0.666;
    private static ConstLegendOffsetFromChartByY: number = 0.5;

    private static CellMaxHeightLimit: number = 60;
    private static CellMaxWidthFactorLimit: number = 3;

    public static BucketCountMaxLimit: number = 18;
    public static BucketCountMinLimit: number = 1;
    public static DefaultBucketCount: number = 5;
    public static ColorbrewerMaxBucketCount: number = 14;

    public static DefaultColorbrewer: string = "Reds";

    private element: HTMLElement;

    private selectionManager: ISelectionManager;

    private settingsModel: SettingsModel;

    private formattingSettingsService: FormattingSettingsService;

    public converter(dataView: DataView, colors: IColorPalette): TableHeatMapChartData {
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

        const dataPoints: TableHeatMapDataPoint[] = [];

        const categoryValueFormatter: IValueFormatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(dataView.categorical.categories[0].source),
            value: dataView.categorical.categories[0].values[0]
        });

        dataView.categorical.categories[0].values.forEach((categoryX, indexX) => {
            dataView.categorical.values.forEach((categoryY) => {
                const categoryYFormatter = valueFormatter.create({
                    format: categoryY.source.format,
                    value: dataView.categorical.values[0].values[0]
                });
                const value = categoryY.values[indexX];
                dataPoints.push({
                    categoryX: categoryX,
                    categoryY: categoryY.source.displayName,
                    value: value,
                    valueStr: categoryYFormatter.format(value),
                    tooltipInfo: [{
                        displayName: `Category`,
                        value: (categoryX || "").toString()
                    },
                    {
                        displayName: `Y`,
                        value: (categoryY.source.displayName || "").toString()
                    },
                    {
                        displayName: `Value`,
                        value: categoryYFormatter.format(value)
                    }]
                });
            });
        });
        return <TableHeatMapChartData>{
            dataPoints: dataPoints,
            categoryX: dataView.categorical.categories[0].values.filter((n) => {
                return n !== undefined;
            }),
            categoryY: dataView.categorical.values.map(v => v.source.displayName).filter((n) => {
                return n !== undefined;
            }),
            categoryValueFormatter: categoryValueFormatter,
            valueFormatter: valueFormatter
        };
    }

    constructor({
        host,
        element
    }: VisualConstructorOptions) {
        this.host = host;
        this.element = element;

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

        this.handleContextMenu();
    }

    public update(options: VisualUpdateOptions): void {
        if (!options.dataViews || !options.dataViews[0]) {
            return;
        }
        try {
            this.host.eventService.renderingStarted(options);

            this.settingsModel = this.formattingSettingsService.populateFormattingSettingsModel(SettingsModel, options.dataViews);
            this.settingsModel.initBuckets(options.dataViews[0]);
            this.settingsModel = TableHeatMap.parseSettings(this.colorHelper, this.settingsModel);

            this.svg.selectAll(TableHeatMap.ClsAll).remove();
            this.div.attr("width", PixelConverter.toString(options.viewport.width + this.margin.left));
            this.div.style("height", PixelConverter.toString(options.viewport.height + this.margin.left));

            this.svg.attr("width", options.viewport.width);
            this.svg.attr("height", options.viewport.height);

            this.mainGraphics = this.svg.append(TableHeatMap.HtmlObjG);

            this.setSize(options.viewport);

            this.updateInternal(options, this.settingsModel);
        } catch (ex) {
            this.host.eventService.renderingFailed(options, JSON.stringify(ex));
        }
        this.host.eventService.renderingFinished(options);
    }

    private getYAxisWidth(chartData: TableHeatMapChartData): number {
        let maxLengthText: powerbi.PrimitiveValue = maxBy(chartData.categoryY, "length") || "";
        maxLengthText = TableHeatMap.textLimit(maxLengthText.toString(), this.settingsModel.yAxisLabels.maxTextSymbol.value);
        return textMeasurementService.measureSvgTextWidth({
            fontSize: PixelConverter.toString(this.settingsModel.yAxisLabels.fontSize.value),
            text: maxLengthText.trim(),
            fontFamily: this.settingsModel.yAxisLabels.fontFamily.value.toString()
        }) + TableHeatMap.YAxisAdditinalMargin;
    }

    private getXAxisHeight(chartData: TableHeatMapChartData): number {
        const maxLengthText: powerbi.PrimitiveValue = maxBy(chartData.categoryY, "length") || "";
        return textMeasurementService.measureSvgTextHeight({
            fontSize: PixelConverter.toString(this.settingsModel.xAxisLabels.fontSize.value),
            text: maxLengthText.toString().trim(),
            fontFamily: this.settingsModel.xAxisLabels.fontFamily.value.toString()
        });
    }

    private getYAxisHeight(chartData: TableHeatMapChartData): number {
        const maxLengthText: powerbi.PrimitiveValue = maxBy(chartData.categoryY, "length") || "";
        return textMeasurementService.measureSvgTextHeight({
            fontSize: PixelConverter.toString(this.settingsModel.yAxisLabels.fontSize.value),
            text: maxLengthText.toString().trim(),
            fontFamily: this.settingsModel.yAxisLabels.fontFamily.value.toString()
        });
    }

    private handleContextMenu = () => {
        this.svg.on('contextmenu', (event: PointerEvent, dataPoint) => {
            this.selectionManager.showContextMenu(dataPoint ? dataPoint.identity : {}, {
                x: event.clientX,
                y: event.clientY
            });
            event.preventDefault();
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
            settingsModel.general.stroke = foregroundColor;
            settingsModel.general.textColor = foregroundColor;
        }

        return settingsModel;
    }

    // eslint-disable-next-line max-lines-per-function
    private updateInternal(options: VisualUpdateOptions, settingsModel: SettingsModel): void {
        const dataView: DataView = this.dataView = options.dataViews[0];
        const chartData: TableHeatMapChartData = this.converter(dataView, this.colors);
        const suppressAnimations: boolean = false;
        if (chartData.dataPoints) {
            const minDataValue: number = d3Min(chartData.dataPoints, function (d: TableHeatMapDataPoint) {
                return d.value as number;
            });
            const maxDataValue: number = d3Max(chartData.dataPoints, function (d: TableHeatMapDataPoint) {
                return d.value as number;
            });

            const numBuckets: number = settingsModel.CurrentBucketCount;

            const colorbrewerScale: string = settingsModel.general.colorbrewer.value.toString();
            const colorbrewerEnable: boolean = settingsModel.general.enableColorbrewer.value;
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

            const colorScale: Quantile<string> = d3ScaleQuantile<string>()
                .domain([minDataValue, maxDataValue])
                .range(colors);

            let xAxisHeight: number = this.getXAxisHeight(chartData);
            let yAxisWidth: number = this.getYAxisWidth(chartData);
            const yAxisHeight: number = this.getYAxisHeight(chartData);

            if (!settingsModel.yAxisLabels.show.value) {
                yAxisWidth = 0;
            }

            if (!settingsModel.xAxisLabels.show.value) {
                xAxisHeight = 0;
            }

            let maxDataText: string = chartData.dataPoints[0].valueStr || "";
            chartData.dataPoints.forEach((value: TableHeatMapDataPoint) => {
                if ((value.valueStr || "").length > maxDataText.length) {
                    maxDataText = value.valueStr || "";
                }
            });

            const textProperties: TextProperties = {
                fontSize: PixelConverter.toString(settingsModel.labels.fontSize.value),
                fontFamily: settingsModel.labels.fontFamily.value.toString(),
                text: maxDataText
            };
            
            const textRect: SVGRect = textMeasurementService.measureSvgTextRect(textProperties);

            let gridSizeWidth: number = Math.floor((this.viewport.width - yAxisWidth) / (chartData.categoryX.length));
            let gridSizeHeight: number = Math.floor((this.viewport.height - yAxisHeight) / (chartData.categoryY.length));

            if (gridSizeWidth < textRect.width && settingsModel.labels.show.value) {
                gridSizeWidth = textRect.width;
            }
            if (gridSizeHeight < textRect.height && settingsModel.labels.show.value) {
                gridSizeHeight = textRect.height;
            }
            if (gridSizeHeight > TableHeatMap.CellMaxHeightLimit) {
                gridSizeHeight = TableHeatMap.CellMaxHeightLimit;
            }
            if (gridSizeWidth > gridSizeHeight * TableHeatMap.CellMaxWidthFactorLimit) {
                gridSizeWidth = gridSizeHeight * TableHeatMap.CellMaxWidthFactorLimit;
            }

            if (gridSizeHeight < TableHeatMap.ConstGridMinHeight) {
                gridSizeHeight = TableHeatMap.ConstGridMinHeight;
            }
            if (gridSizeWidth < TableHeatMap.ConstGridMinWidth) {
                gridSizeWidth = TableHeatMap.ConstGridMinWidth;
            }

            const xOffset: number = this.margin.left + yAxisWidth; // add width of y labels width
            const yOffset: number = this.margin.top + xAxisHeight; // todo add height of x category labels height

            const TableHeatMapCellRaito: number = 2 / 3;
            const legendElementWidth: number = (this.viewport.width * TableHeatMapCellRaito - xOffset) / numBuckets;
            const legendElementHeight: number = gridSizeHeight;

            if (settingsModel.yAxisLabels.show.value) {
                const categoryYElements:  ID3Selection<ID3BaseType, any, any, any> = this.mainGraphics.selectAll("." + TableHeatMap.ClsCategoryYLabel);
                const categoryYElementsData = categoryYElements
                    .data(chartData.categoryY);
                    const categoryYElementsEntered = categoryYElementsData
                    .enter()
                    .append(TableHeatMap.HtmlObjText);

                categoryYElementsEntered.exit().remove();

                const categoryYElementsMerged = categoryYElementsEntered.merge(categoryYElements);

                categoryYElementsMerged
                    .text((d: string) => {
                        return TableHeatMap.textLimit(d, settingsModel.yAxisLabels.maxTextSymbol.value);
                    })
                    .attr(TableHeatMap.AttrDY, TableHeatMap.Const071em)
                    .attr(TableHeatMap.AttrX, this.margin.left)
                    .attr(TableHeatMap.AttrY, function (d, i) {
                        return i * gridSizeHeight - (gridSizeHeight / 2) + yOffset - yAxisHeight / 3;
                    })
                    .style(TableHeatMap.StTextAnchor, TableHeatMap.ConstBegin)
                    .style("font-size", settingsModel.yAxisLabels.fontSize.value)
                    .style("font-family", settingsModel.yAxisLabels.fontFamily.value)
                    .style("fill", settingsModel.yAxisLabels.fill.value.value)
                    .attr(TableHeatMap.AttrTransform, translate(TableHeatMap.ConstShiftLabelFromGrid, gridSizeHeight))
                    .classed(TableHeatMap.ClsCategoryYLabel, true)
                    .classed(TableHeatMap.ClsMono, true)
                    .classed(TableHeatMap.ClsAxis, true);

                this.mainGraphics.selectAll("." + TableHeatMap.ClsCategoryYLabel)
                    .call(this.wrap, gridSizeWidth + xOffset);

                this.truncateTextIfNeeded(this.mainGraphics.selectAll("." + TableHeatMap.ClsCategoryYLabel), gridSizeWidth + xOffset);
            }

            if (settingsModel.xAxisLabels.show.value) {
                const categoryXElements:  ID3Selection<ID3BaseType, any, any, any> =  this.mainGraphics.selectAll("." + TableHeatMap.ClsCategoryXLabel);
                const categoryXElementsData = categoryXElements
                    .data(chartData.categoryX);
                categoryXElementsData.exit().remove();
                const categoryXElementsEntered = categoryXElementsData
                    .enter().append(TableHeatMap.HtmlObjText);
                const categoryXElementsMerged = categoryXElementsEntered.merge(categoryXElements);

                categoryXElementsMerged
                    .text(function (d: string) {
                        return chartData.categoryValueFormatter.format(d);
                    })
                    .attr(TableHeatMap.AttrX, function (d: string, i: number) {
                        return i * gridSizeWidth + xOffset;
                    })
                    .attr(TableHeatMap.AttrY, xAxisHeight / 2)
                    .attr(TableHeatMap.AttrDY, TableHeatMap.Const0em)
                    .style(TableHeatMap.StTextAnchor, TableHeatMap.ConstMiddle)
                    .style("font-size", settingsModel.xAxisLabels.fontSize.value)
                    .style("font-family", settingsModel.xAxisLabels.fontFamily.value)
                    .style("fill", settingsModel.xAxisLabels.fill.value.value)
                    .classed(TableHeatMap.ClsCategoryXLabel + " " + TableHeatMap.ClsMono + " " + TableHeatMap.ClsAxis, true)
                    .attr(TableHeatMap.AttrTransform, translate(gridSizeHeight, TableHeatMap.ConstShiftLabelFromGrid));

                this.truncateTextIfNeeded(this.mainGraphics.selectAll("." + TableHeatMap.ClsCategoryXLabel), gridSizeWidth);
            }

            const heatMap: Selection<TableHeatMapDataPoint> = this.mainGraphics.selectAll("." + TableHeatMap.ClsCategoryX);
            const heatMapData = heatMap
                .data(chartData.dataPoints);
                const heatMapEntered = heatMapData
                .enter()
                .append(TableHeatMap.HtmlObjRect);
            const heatMapMerged = heatMapEntered.merge(heatMap);

            heatMapMerged
                .attr(TableHeatMap.AttrX, function (d: TableHeatMapDataPoint) {
                    return chartData.categoryX.indexOf(d.categoryX) * gridSizeWidth + xOffset;
                })
                .attr(TableHeatMap.AttrY, function (d: TableHeatMapDataPoint) {
                    return chartData.categoryY.indexOf(d.categoryY) * gridSizeHeight + yOffset;
                })
                .classed(TableHeatMap.ClsCategoryX + " " + TableHeatMap.ClsBordered, true)
                .attr(TableHeatMap.AttrWidth, gridSizeWidth)
                .attr(TableHeatMap.AttrHeight, gridSizeHeight)
                .style(TableHeatMap.StFill, colors[0])
                .style("stroke", settingsModel.general.stroke);


            if (chartData.categoryX.length * gridSizeWidth + xOffset > options.viewport.width) {
                this.svg.attr("width", chartData.categoryX.length * gridSizeWidth);
            }

            // add data labels
            const textHeight: number = textRect.height;
            const heatMapDataLables: Selection<TableHeatMapDataPoint> = this.mainGraphics.selectAll("." + TableHeatMap.CLsHeatMapDataLabels);

            if (settingsModel.labels.show.value && textHeight <= gridSizeHeight) {
                const heatMapDataLablesData: Selection<TableHeatMapDataPoint> = heatMapDataLables.data(chartData.dataPoints);
                heatMapDataLables.exit().remove();

                const heatMapDataLablesEntered = heatMapDataLablesData
                    .enter().append("text");

                heatMapDataLablesEntered
                    .classed(TableHeatMap.CLsHeatMapDataLabels, true)
                    .attr(TableHeatMap.AttrX, function (d: TableHeatMapDataPoint) {
                        return chartData.categoryX.indexOf(d.categoryX) * gridSizeWidth + xOffset + gridSizeWidth / 2;
                    })
                    .attr(TableHeatMap.AttrY, function (d: TableHeatMapDataPoint) {
                        return chartData.categoryY.indexOf(d.categoryY) * gridSizeHeight + yOffset + gridSizeHeight / 2 + textHeight / 2.6;
                    })
                    .style("text-anchor", TableHeatMap.ConstMiddle)
                    .style("font-size", settingsModel.labels.fontSize.value)
                    .style("font-family", settingsModel.labels.fontFamily.value)
                    .style("fill", settingsModel.labels.fill.value.value)
                    .text((dataPoint: TableHeatMapDataPoint) => {
                        let textValue: string = valueFormatter.format(dataPoint.value);
                        textProperties.text = textValue;
                        textValue = textMeasurementService.getTailoredTextOrDefault(textProperties, gridSizeWidth);
                        return dataPoint.value === 0 ? 0 : textValue;
                    });
            }

            const elementAnimation: Selection<D3Element> = <Selection<D3Element>>this.getAnimationMode(heatMapMerged, suppressAnimations);
            if (!this.settingsModel.general.fillNullValuesCells.value) {
                heatMapMerged.style(TableHeatMap.StOpacity, function (d: any) {
                    return d.value === null || d.value === "" ? 0 : 1;
                });
            }
            elementAnimation.style(TableHeatMap.StFill, function (d: any) {
                return <string>colorScale(d.value);
            });

            this.tooltipServiceWrapper.addTooltip(heatMapMerged, (tooltipDataPoint: TooltipEnabledDataPoint) => {
                return tooltipDataPoint.tooltipInfo;
            });

            // legend
            const legendDataValues = [minDataValue].concat(colorScale.quantiles());
            const legendData = legendDataValues.concat(maxDataValue).map((value, index) => {
                return {
                    value: value,
                    tooltipInfo: [{
                        displayName: `Min value`,
                        value: value && typeof value.toFixed === "function" ? value.toFixed(0) : chartData.categoryValueFormatter.format(value)
                    },
                    {
                        displayName: `Max value`,
                        value: legendDataValues[index + 1] && typeof legendDataValues[index + 1].toFixed === "function" ? legendDataValues[index + 1].toFixed(0) : chartData.categoryValueFormatter.format(maxDataValue)
                    }]
                };
            });

            const legendSelection: Selection<any> = this.mainGraphics.selectAll("." + TableHeatMap.ClsLegend);
            const legendSelectionData = legendSelection.data(legendData);

            const legendSelectionEntered = legendSelectionData
                .enter()
                .append(TableHeatMap.HtmlObjG);

            legendSelectionData.exit().remove();

            const legendSelectionMerged = legendSelectionData.merge(legendSelection);
            legendSelectionMerged.classed(TableHeatMap.ClsLegend, true);

            const legendOffsetCellsY: number = this.margin.top
                    + gridSizeHeight * (chartData.categoryY.length + TableHeatMap.ConstLegendOffsetFromChartByY)
                    + xAxisHeight;
                    const legendOffsetTextY: number = this.margin.top
                    - gridSizeHeight / 2
                    + gridSizeHeight * (chartData.categoryY.length + TableHeatMap.ConstLegendOffsetFromChartByY)
                    + legendElementHeight * 2
                    + xAxisHeight;

            legendSelectionEntered
                .append(TableHeatMap.HtmlObjRect)
                .attr(TableHeatMap.AttrX, function (d, i) {
                    return legendElementWidth * i + xOffset;
                })
                .attr(TableHeatMap.AttrY, legendOffsetCellsY)
                .attr(TableHeatMap.AttrWidth, legendElementWidth)
                .attr(TableHeatMap.AttrHeight, legendElementHeight)
                .style(TableHeatMap.StFill, function (d, i) {
                    return colors[i];
                })
                .style("stroke", settingsModel.general.stroke)
                .style("opacity", (d) => d.value !== maxDataValue ? 1 : 0)
                .classed(TableHeatMap.ClsBordered, true);

            const legendFormatter: IValueFormatter = valueFormatter.create({
                value: 1000
            });

            legendSelectionEntered
                .append(TableHeatMap.HtmlObjText)
                .classed(TableHeatMap.ClsMono, true)
                .attr(TableHeatMap.AttrX, function (d, i) {
                    return legendElementWidth * i + xOffset;
                })
                .attr(TableHeatMap.AttrY, legendOffsetTextY)
                .text(function (d) {
                    const formattedValue = legendFormatter.format(d.value);
                    return formattedValue;
                })
                .style("fill", settingsModel.general.textColor);

                this.tooltipServiceWrapper.addTooltip(
                    legendSelectionEntered,
                    (tooltipDataPoint: TooltipEnabledDataPoint) => {
                        return tooltipDataPoint.tooltipInfo;
                    }
                );

            if (legendOffsetTextY + gridSizeHeight > options.viewport.height) {
                this.svg.attr("height", legendOffsetTextY + gridSizeHeight);
            }
        }
    }

    private static textLimit(text: string, limit: number) {
        if (text.length > limit) {
            return ((text || "").substring(0, limit - 3).trim()) + "…";
        }

        return text;
    }

    private setSize(viewport: IViewport): void {
        this.svg
            .attr(TableHeatMap.AttrHeight, Math.max(viewport.height, 0))
            .attr(TableHeatMap.AttrWidth, Math.max(viewport.width, 0));

        const height: number =
            viewport.height -
            this.margin.top -
            this.margin.bottom;

        const width: number =
            viewport.width -
            this.margin.left -
            this.margin.right;

        this.viewport = {
            height: height,
            width: width
        };

        this.mainGraphics
            .attr(TableHeatMap.AttrHeight, Math.max(this.viewport.height + this.margin.top, 0))
            .attr(TableHeatMap.AttrWidth, Math.max(this.viewport.width + this.margin.left, 0));

        this.mainGraphics.attr(TableHeatMap.AttrTransform, translate(this.margin.left, this.margin.top));
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
            // eslint-disable-next-line no-cond-assign
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
