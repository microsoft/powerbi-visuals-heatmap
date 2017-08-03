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

module powerbi.extensibility.visual {
    import ValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import IVisual = powerbi.extensibility.visual.IVisual;
    import IColorPalette = powerbi.extensibility.IColorPalette;
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    import LabelLayoutStrategy = powerbi.extensibility.utils.chart.axis.LabelLayoutStrategy;
    import TextMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    import translate = powerbi.extensibility.utils.svg.translate;
    import Quantile = d3.scale.Quantile;
    import Update = d3.selection.Update;

    type D3Element =
        d3.selection.Update<any> |
            d3.Selection<any> |
            d3.Transition<any>;


    export class TableHeatMap implements IVisual {
        private static Properties: any = {
            dataPoint: {
                fill: <DataViewObjectPropertyIdentifier> {
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

        private svg: d3.Selection<any>;
        private mainGraphics: d3.Selection<any>;
        private colors: IColorPalette;
        private dataView: DataView;
        private viewport: IViewport;
        private margin: IMargin = {left: 10, right: 10, bottom: 15, top: 15};
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

        private static AttrTransform: string = "transform";
        private static AttrX: string = "x";
        private static AttrY: string = "y";
        private static AttrDX: string = "dx";
        private static AttrDY: string = "dy";
        private static AttrHeight: string = "height";
        private static AttrWidth: string = "width";

        private static HtmlObjTitle: string = "title";
        private static HtmlObjSvg: string = "svg";
        private static HtmlObjG: string = "g";
        private static HtmlObjText: string = "text";
        private static HtmlObjRect: string = "rect";
        private static HtmlObjTspan: string = "tspan";

        private static StFill: string = "fill";
        private static StTextAnchor: string = "text-anchor";

        private static ConstEnd: string = "end";
        private static ConstMiddle: string = "middle";
        private static Const0em: string = "0em";
        private static Const071em: string = ".71em";

        private static ConstGridSizeWidthLimit: number = 80;
        private static ConstShiftLabelFromGrid: number = -6;
        private static ConstGridHeightWidthRaito: number = 0.5;
        private static ConstGridLegendWidthRaito: number = 0.666;
        private static ConstLegendOffsetFromChartByY: number = 0.5;

        private settings: TableHeatmapSettings;

        public converter(dataView: DataView, colors: IColorPalette): TableHeatMapChartData {
            // no category - nothing to display
            if (!dataView || !dataView.categorical || !dataView.categorical.categories || !dataView.categorical.categories[0] || !dataView.categorical.categories[0].values || !dataView.categorical.categories[0].values.length) {
                return <TableHeatMapChartData>{
                    dataPoints: null
                };
            }
            // no values - nothing to display
            if (!dataView.categorical.values || !dataView.categorical.values[0] || !dataView.categorical.values[0].values || !dataView.categorical.values[0].values.length) {
                return <TableHeatMapChartData>{
                    dataPoints: null
                };
            }

            let categoryValueFormatter: IValueFormatter;
            let valueFormatter: IValueFormatter;
            let dataPoints: TableHeatMapDataPoint[] = [];
            let catMetaData: DataViewMetadata = dataView.metadata;
            let catTable: DataViewTable = dataView.table;
            let catX: string[] = [];
            let catY: string[] = [];

            let categoryX: string, categoryY: string;

            categoryValueFormatter = ValueFormatter.create({
                format: ValueFormatter.getFormatStringByColumn(dataView.categorical.categories[0].source),
                value: dataView.categorical.categories[0].values[0]
            });

            valueFormatter = ValueFormatter.create({
                format: ValueFormatter.getFormatStringByColumn(dataView.categorical.values[0].source),
                value: dataView.categorical.values[0].values[0]
            });

            for (let i in dataView.table.rows) {
                let values: TableHeatMapDataPoint[] = [];
                let k: number = 0;

                for (let j in dataView.table.columns) {
                    let columnValFormatter: IValueFormatter;
                    if (catMetaData.columns[j].format) {
                        columnValFormatter = ValueFormatter.create({
                            format: catMetaData.columns[j].format
                        });
                    }

                    if (!catMetaData.columns[j].isMeasure) {
                        categoryX = catX[i] = <string>catTable.rows[i][j];
                    }
                    if (catMetaData.columns[j].isMeasure) {
                        let value: any = catTable.rows[i][j];
                        let valueStr: string;
                        if (value) {
                            categoryY = catY[j] = catMetaData.columns[j].displayName;
                            if (catMetaData.columns[j].groupName) {
                                categoryY += ": " + catMetaData.columns[j].groupName;
                                catY[j] += ": " + catMetaData.columns[j].groupName;
                            }

                            if (value !== parseInt(<string>value, 10))
                                value = (<number>value).toFixed(2);
                            if (catMetaData.columns[j].format) {
                                valueStr = columnValFormatter.format(value);
                            }
                        }
                        values[k] = <TableHeatMapDataPoint>{
                            value: value,
                            valueStr: valueStr,
                            categoryY: categoryY
                        };
                        k++;
                    }
                }

                values.forEach((element) => {
                    dataPoints.push({
                        categoryX: categoryX,
                        categoryY: element.categoryY,
                        value: element.value,
                        valueStr: element.valueStr
                    });
                });
            }
            return <TableHeatMapChartData>{
                dataPoints: dataPoints,
                categoryX: catX.filter((n) => {
                    return n !== undefined;
                }),
                categoryY: catY.filter((n) => {
                    return n !== undefined;
                }),
                categoryValueFormatter: categoryValueFormatter,
                valueFormatter: valueFormatter
            };
        }

        constructor(options: VisualConstructorOptions) {
            this.host = options.host;

            this.svg = d3.select(options.element)
                .append(TableHeatMap.HtmlObjSvg)
                .classed(TableHeatMap.ClsNameSvgTableHeatMap, true);
        }

        public update(options: VisualUpdateOptions): void {
            if (!options.dataViews || !options.dataViews[0]) {
                return;
            }

            this.settings = TableHeatMap.parseSettings(options.dataViews[0]);

            this.svg.selectAll(TableHeatMap.ClsAll).remove();

            let width: number = options.viewport.width;
            let height: number = options.viewport.height;

            this.svg.attr({
                width: width,
                height: height
            });

            this.mainGraphics = this.svg.append(TableHeatMap.HtmlObjG);

            this.setSize(options.viewport);

            this.updateInternal(options);
        }

        private static parseSettings(dataView: DataView): TableHeatmapSettings {
            return TableHeatmapSettings.parse<TableHeatmapSettings>(dataView);
        }

        private updateInternal(options: VisualUpdateOptions): void {
            let dataView: DataView = this.dataView = options.dataViews[0];
            let chartData: TableHeatMapChartData = this.converter(dataView, this.colors);
            let suppressAnimations: boolean = false;
            if (chartData.dataPoints) {
                let minDataValue: number = d3.min(chartData.dataPoints, function (d: TableHeatMapDataPoint) {
                    return d.value;
                });
                let maxDataValue: number = d3.max(chartData.dataPoints, function (d: TableHeatMapDataPoint) {
                    return d.value;
                });

                let numBuckets: number = this.settings.general.buckets;
                let colorbrewerScale: string = this.settings.general.colorbrewer;
                let colors: Array<string>;
                if (colorbrewerScale) {
                    let currentColorbrewer: IColorArray = colorbrewer[colorbrewerScale];
                    colors = (currentColorbrewer ? currentColorbrewer[numBuckets] : colorbrewer.Reds[numBuckets]);
                }
                else {
                    colors = colorbrewer.Reds[numBuckets];	// default color scheme
                }

                let colorScale: Quantile<string> = d3.scale.quantile<string>()
                    .domain([minDataValue, maxDataValue])
                    .range(colors);

                let gridSizeWidth: number = Math.floor(this.viewport.width / (chartData.categoryX.length + 1));
                gridSizeWidth = gridSizeWidth > TableHeatMap.ConstGridSizeWidthLimit ? TableHeatMap.ConstGridSizeWidthLimit : gridSizeWidth;
                let gridSizeHeight: number = gridSizeWidth * TableHeatMap.ConstGridHeightWidthRaito;

                let legendElementWidth: number = gridSizeWidth * TableHeatMap.ConstGridLegendWidthRaito;
                let legendElementHeight: number = gridSizeHeight * TableHeatMap.ConstGridHeightWidthRaito;

                let xOffset: number = gridSizeWidth + this.margin.left;
                let yOffset: number = this.margin.top;

                this.mainGraphics.selectAll("." + TableHeatMap.ClsCategoryYLabel)
                    .data(chartData.categoryY)
                    .enter().append(TableHeatMap.HtmlObjText)
                    .text((d: string) => {
                        return d;
                    })
                    .attr(TableHeatMap.AttrDY, TableHeatMap.Const071em)
                    .attr(TableHeatMap.AttrX, xOffset)
                    .attr(TableHeatMap.AttrY, function (d, i) {
                        return i * gridSizeHeight;
                    })
                    .style(TableHeatMap.StTextAnchor, TableHeatMap.ConstEnd)
                    .attr(TableHeatMap.AttrTransform, translate(TableHeatMap.ConstShiftLabelFromGrid, gridSizeHeight))
                    .classed(TableHeatMap.ClsCategoryYLabel + " " + TableHeatMap.ClsMono + " " + TableHeatMap.ClsAxis, true);

                this.mainGraphics.selectAll("." + TableHeatMap.ClsCategoryYLabel)
                    .call(this.wrap, gridSizeWidth);

                this.mainGraphics.selectAll("." + TableHeatMap.ClsCategoryXLabel)
                    .data(chartData.categoryX)
                    .enter().append(TableHeatMap.HtmlObjText)
                    .text(function (d: string) {
                        return chartData.categoryValueFormatter.format(d);
                    })
                    .attr(TableHeatMap.AttrX, function (d: string, i: number) {
                        return i * gridSizeWidth + xOffset;
                    })
                    .attr(TableHeatMap.AttrY, this.margin.top)
                    .attr(TableHeatMap.AttrDY, TableHeatMap.Const0em)
                    .style(TableHeatMap.StTextAnchor, TableHeatMap.ConstMiddle)
                    .classed(TableHeatMap.ClsCategoryXLabel + " " + TableHeatMap.ClsMono + " " + TableHeatMap.ClsAxis, true)
                    .attr(TableHeatMap.AttrTransform, translate(gridSizeHeight, TableHeatMap.ConstShiftLabelFromGrid));

                this.truncateTextIfNeeded(this.mainGraphics.selectAll("." + TableHeatMap.ClsCategoryXLabel), gridSizeWidth);
                this.truncateTextIfNeeded(this.mainGraphics.selectAll("." + TableHeatMap.ClsCategoryYLabel), gridSizeWidth);

                let heatMap: d3.Selection<TableHeatMapDataPoint> = this.mainGraphics.selectAll("." + TableHeatMap.ClsCategoryX)
                    .data(chartData.dataPoints)
                    .enter()
                    .append(TableHeatMap.HtmlObjRect)
                    .attr(TableHeatMap.AttrX, function (d: TableHeatMapDataPoint) {
                        return chartData.categoryX.indexOf(d.categoryX) * gridSizeWidth + xOffset;
                    })
                    .attr(TableHeatMap.AttrY, function (d: TableHeatMapDataPoint) {
                        return chartData.categoryY.indexOf(d.categoryY) * gridSizeHeight + yOffset;
                    })
                    .classed(TableHeatMap.ClsCategoryX + " " + TableHeatMap.ClsBordered, true)
                    .attr(TableHeatMap.AttrWidth, gridSizeWidth)
                    .attr(TableHeatMap.AttrHeight, gridSizeHeight)
                    .style(TableHeatMap.StFill, colors[0]);

                // add data labels
                let textProperties: TextProperties = {
                    fontSize: this.settings.labels.fontSize + "px",
                    fontFamily: this.mainGraphics.style("font-family"),
                    text: "123"
                };
                let textHeight: number = TextMeasurementService.estimateSvgTextHeight(textProperties);
                let heatMapDataLables: d3.Selection<TableHeatMapDataPoint> = this.mainGraphics.selectAll("." + TableHeatMap.CLsHeatMapDataLabels);

                let heatMapDataLablesData: d3.selection.Update<TableHeatMapDataPoint> = heatMapDataLables.data(this.settings.labels.show && textHeight < gridSizeHeight && chartData.dataPoints);

                heatMapDataLablesData
                    .enter()
                    .append("text")
                    .classed("." + TableHeatMap.CLsHeatMapDataLabels, true)
                    .attr(TableHeatMap.AttrX, function (d: TableHeatMapDataPoint) {
                        return chartData.categoryX.indexOf(d.categoryX) * gridSizeWidth + xOffset + gridSizeWidth / 2;
                    })
                    .attr(TableHeatMap.AttrY, function (d: TableHeatMapDataPoint) {
                        return chartData.categoryY.indexOf(d.categoryY) * gridSizeHeight + yOffset + gridSizeHeight / 2 + textHeight / 2.6;
                    })
                    .style({
                        "text-anchor": TableHeatMap.ConstMiddle,
                        "font-size": this.settings.labels.fontSize,
                        "fill": this.settings.labels.fill
                    })
                    .text( (dataPoint: TableHeatMapDataPoint) => {
                        let textValue: string = dataPoint.value.toString();
                        textProperties.text = textValue;
                        textValue = TextMeasurementService.getTailoredTextOrDefault(textProperties, gridSizeHeight);
                        return textValue;
                    });

                heatMapDataLablesData.exit().remove();

                let elementAnimation: d3.Selection<D3Element> = <d3.Selection<D3Element>> this.getAnimationMode(heatMap, suppressAnimations);
                elementAnimation.style(TableHeatMap.StFill, function (d: any) {
                    return <string>colorScale(d.value);
                });

                heatMap.append(TableHeatMap.HtmlObjTitle).text((d: TableHeatMapDataPoint) => {
                    if (d.valueStr !== undefined) {
                        return d.categoryX + ": " + d.valueStr;
                    }
                    else {
                        return d.categoryX + ": " + d.value;
                    }
                });

                // legend
                let legend: Update<any> = this.mainGraphics.selectAll("." + TableHeatMap.ClsLegend)
                    .data([0].concat(colorScale.quantiles()), function (d: any) {
                        return d;
                    });

                legend.enter().append(TableHeatMap.HtmlObjG)
                    .classed(TableHeatMap.ClsLegend, true);

                let legendOffsetX: number = xOffset;
                let legendOffsetCellsY: number = this.margin.top + gridSizeHeight * (chartData.categoryY.length + TableHeatMap.ConstLegendOffsetFromChartByY);
                let legendOffsetTextY: number = this.margin.top + gridSizeHeight * (chartData.categoryY.length + TableHeatMap.ConstLegendOffsetFromChartByY) + legendElementHeight * 2;

                legend.append(TableHeatMap.HtmlObjRect)
                    .attr(TableHeatMap.AttrX, function (d, i) {
                        return legendElementWidth * i + legendOffsetX;
                    })
                    .attr(TableHeatMap.AttrY, legendOffsetCellsY)
                    .attr(TableHeatMap.AttrWidth, legendElementWidth)
                    .attr(TableHeatMap.AttrHeight, legendElementHeight)
                    .style(TableHeatMap.StFill, function (d, i) {
                        return colors[i];
                    })
                    .classed(TableHeatMap.ClsBordered, true);

                legend.append(TableHeatMap.HtmlObjText)
                    .classed(TableHeatMap.ClsMono, true)
                    .attr(TableHeatMap.AttrX, function (d, i) {
                        return legendElementWidth * i + legendOffsetX - legendElementWidth / 4;
                    })
                    .attr(TableHeatMap.AttrY, legendOffsetTextY)
                    .text(function (d) {
                        return chartData.valueFormatter.format(d);
                    });

                this.mainGraphics.select("." + TableHeatMap.ClsLegend)
                    .data([0].concat(maxDataValue))
                    .append(TableHeatMap.HtmlObjText)
                    .text(chartData.valueFormatter.format(maxDataValue))
                    .attr(TableHeatMap.AttrX, legendElementWidth * colors.length + legendOffsetX - legendElementWidth / 4)
                    .attr(TableHeatMap.AttrY, legendOffsetTextY)
                    .classed(TableHeatMap.ClsLegend, true)
                    .classed(TableHeatMap.ClsMono, true);

                legend.exit().remove();
            }
        }

        private setSize(viewport: IViewport): void {
            let height: number,
                width: number;

            this.svg
                .attr(TableHeatMap.AttrHeight, Math.max(viewport.height, 0))
                .attr(TableHeatMap.AttrWidth, Math.max(viewport.width, 0));

            height =
                viewport.height -
                this.margin.top -
                this.margin.bottom;

            width =
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

        private truncateTextIfNeeded(text: d3.Selection<any>, width: number): void {
            text.call(LabelLayoutStrategy.clip,
                width,
                TextMeasurementService.svgEllipsis);
        }

        private wrap(text, width): void {
            text.each(function () {
                let text: d3.Selection<D3Element> = d3.select(this);
                let words: string[] = text.text().split(/\s+/).reverse();
                let word: string;
                let line: string[] = [];
                let lineNumber: number = 0;
                let lineHeight: number = 1.1; // ems
                let x: string = text.attr(TableHeatMap.AttrX);
                let y: string = text.attr(TableHeatMap.AttrY);
                let dy: number = parseFloat(text.attr(TableHeatMap.AttrDY));
                let tspan: d3.Selection<any> = text.text(null).append(TableHeatMap.HtmlObjTspan).attr(TableHeatMap.AttrX, x).attr(TableHeatMap.AttrY, y).attr(TableHeatMap.AttrDY, dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    let tspannode: any = tspan.node();  // Fixing Typescript error: Property 'getComputedTextLength' does not exist on type 'Element'.
                    if (tspannode.getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append(TableHeatMap.HtmlObjTspan).attr(TableHeatMap.AttrX, x).attr(TableHeatMap.AttrY, y).attr(TableHeatMap.AttrDY, ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
        }

        private getAnimationMode(element: D3Element, suppressAnimations: boolean): D3Element {
            if (suppressAnimations) {
                return element;
            }

            return (<d3.Selection<D3Element>> element)
                .transition().duration(this.animationDuration);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            const settings: TableHeatmapSettings = this.dataView && this.settings
                || TableHeatmapSettings.getDefault() as TableHeatmapSettings;

            const instanceEnumeration: VisualObjectInstanceEnumeration =
                TableHeatmapSettings.enumerateObjectInstances(settings, options);

            return instanceEnumeration || [];
        }
    }
}


