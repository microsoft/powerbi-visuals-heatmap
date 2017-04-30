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
    import translate = powerbi.extensibility.utils.svg.translate;
    import Quantile = d3.scale.Quantile;
    import Update = d3.selection.Update;

    type D3Element =
        d3.selection.Update<any> |
            d3.Selection<any> |
            d3.Transition<any>;

    export interface TableHeatMapDataPoint {
        categoryX: string;
        categoryY: string;
        value: number;
        valueStr: string;
    }

    export interface TableHeatMapChartData {
        dataPoints: TableHeatMapDataPoint[];
        categoryX: string[];
        categoryY: string[];
        categoryValueFormatter: IValueFormatter;
        valueFormatter: IValueFormatter;
    }

    interface IMargin {
        left?: number;
        right?: number;
        bottom?: number;
        top?: number;
    }

    interface TextProperties {
        text?: string;
        fontFamily: string;
        fontSize: string;
        fontWeight?: string;
        fontStyle?: string;
        fontVariant?: string;
        whiteSpace?: string;
    }

    interface IColorArray {
        3: string[];
        4: string[];
        5: string[];
        6: string[];
        7: string[];
        8: string[];
        9?: string[];
        10?: string[];
        11?: string[];
        12?: string[];
        13?: string[];
        14?: string[];
    }

    interface IColorBrewer {
        YlGn: IColorArray;
        YlGnBu: IColorArray;
        GnBu: IColorArray;
        BuGn: IColorArray;
        PuBuGn: IColorArray;
        PuBu: IColorArray;
        BuPu: IColorArray;
        RdPu: IColorArray;
        PuRd: IColorArray;
        OrRd: IColorArray;
        YlOrRd: IColorArray;
        YlOrBr: IColorArray;
        Purples: IColorArray;
        Blues: IColorArray;
        Greens: IColorArray;
        Oranges: IColorArray;
        Reds: IColorArray;
        Greys: IColorArray;
        PuOr: IColorArray;
        BrBG: IColorArray;
        PRGn: IColorArray;
        PiYG: IColorArray;
        RdBu: IColorArray;
        RdGy: IColorArray;
        RdYlBu: IColorArray;
        Spectral: IColorArray;
        RdYlGn: IColorArray;
        Accent: IColorArray;
        Dark2: IColorArray;
        Paired: IColorArray;
        Pastel1: IColorArray;
        Pastel2: IColorArray;
        Set1: IColorArray;
        Set2: IColorArray;
        Set3: IColorArray;
    }

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
        private colorbrewer: IColorBrewer = {
            YlGn: {
                3: ["#f7fcb9", "#addd8e", "#31a354"],
                4: ["#ffffcc", "#c2e699", "#78c679", "#238443"],
                5: ["#ffffcc", "#c2e699", "#78c679", "#31a354", "#006837"],
                6: ["#ffffcc", "#d9f0a3", "#addd8e", "#78c679", "#31a354", "#006837"],
                7: ["#ffffcc", "#d9f0a3", "#addd8e", "#78c679", "#41ab5d", "#238443", "#005a32"],
                8: ["#ffffe5", "#f7fcb9", "#d9f0a3", "#addd8e", "#78c679", "#41ab5d", "#238443", "#005a32"],
                9: ["#ffffe5", "#f7fcb9", "#d9f0a3", "#addd8e", "#78c679", "#41ab5d", "#238443", "#006837", "#004529"]
            },
            YlGnBu: {
                3: ["#edf8b1", "#7fcdbb", "#2c7fb8"],
                4: ["#ffffcc", "#a1dab4", "#41b6c4", "#225ea8"],
                5: ["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"],
                6: ["#ffffcc", "#c7e9b4", "#7fcdbb", "#41b6c4", "#2c7fb8", "#253494"],
                7: ["#ffffcc", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#0c2c84"],
                8: ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#0c2c84"],
                9: ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"]
            },
            GnBu: {
                3: ["#e0f3db", "#a8ddb5", "#43a2ca"],
                4: ["#f0f9e8", "#bae4bc", "#7bccc4", "#2b8cbe"],
                5: ["#f0f9e8", "#bae4bc", "#7bccc4", "#43a2ca", "#0868ac"],
                6: ["#f0f9e8", "#ccebc5", "#a8ddb5", "#7bccc4", "#43a2ca", "#0868ac"],
                7: ["#f0f9e8", "#ccebc5", "#a8ddb5", "#7bccc4", "#4eb3d3", "#2b8cbe", "#08589e"],
                8: ["#f7fcf0", "#e0f3db", "#ccebc5", "#a8ddb5", "#7bccc4", "#4eb3d3", "#2b8cbe", "#08589e"],
                9: ["#f7fcf0", "#e0f3db", "#ccebc5", "#a8ddb5", "#7bccc4", "#4eb3d3", "#2b8cbe", "#0868ac", "#084081"]
            },
            BuGn: {
                3: ["#e5f5f9", "#99d8c9", "#2ca25f"],
                4: ["#edf8fb", "#b2e2e2", "#66c2a4", "#238b45"],
                5: ["#edf8fb", "#b2e2e2", "#66c2a4", "#2ca25f", "#006d2c"],
                6: ["#edf8fb", "#ccece6", "#99d8c9", "#66c2a4", "#2ca25f", "#006d2c"],
                7: ["#edf8fb", "#ccece6", "#99d8c9", "#66c2a4", "#41ae76", "#238b45", "#005824"],
                8: ["#f7fcfd", "#e5f5f9", "#ccece6", "#99d8c9", "#66c2a4", "#41ae76", "#238b45", "#005824"],
                9: ["#f7fcfd", "#e5f5f9", "#ccece6", "#99d8c9", "#66c2a4", "#41ae76", "#238b45", "#006d2c", "#00441b"]
            },
            PuBuGn: {
                3: ["#ece2f0", "#a6bddb", "#1c9099"],
                4: ["#f6eff7", "#bdc9e1", "#67a9cf", "#02818a"],
                5: ["#f6eff7", "#bdc9e1", "#67a9cf", "#1c9099", "#016c59"],
                6: ["#f6eff7", "#d0d1e6", "#a6bddb", "#67a9cf", "#1c9099", "#016c59"],
                7: ["#f6eff7", "#d0d1e6", "#a6bddb", "#67a9cf", "#3690c0", "#02818a", "#016450"],
                8: ["#fff7fb", "#ece2f0", "#d0d1e6", "#a6bddb", "#67a9cf", "#3690c0", "#02818a", "#016450"],
                9: ["#fff7fb", "#ece2f0", "#d0d1e6", "#a6bddb", "#67a9cf", "#3690c0", "#02818a", "#016c59", "#014636"]
            },
            PuBu: {
                3: ["#ece7f2", "#a6bddb", "#2b8cbe"],
                4: ["#f1eef6", "#bdc9e1", "#74a9cf", "#0570b0"],
                5: ["#f1eef6", "#bdc9e1", "#74a9cf", "#2b8cbe", "#045a8d"],
                6: ["#f1eef6", "#d0d1e6", "#a6bddb", "#74a9cf", "#2b8cbe", "#045a8d"],
                7: ["#f1eef6", "#d0d1e6", "#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#034e7b"],
                8: ["#fff7fb", "#ece7f2", "#d0d1e6", "#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#034e7b"],
                9: ["#fff7fb", "#ece7f2", "#d0d1e6", "#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#045a8d", "#023858"]
            },
            BuPu: {
                3: ["#e0ecf4", "#9ebcda", "#8856a7"],
                4: ["#edf8fb", "#b3cde3", "#8c96c6", "#88419d"],
                5: ["#edf8fb", "#b3cde3", "#8c96c6", "#8856a7", "#810f7c"],
                6: ["#edf8fb", "#bfd3e6", "#9ebcda", "#8c96c6", "#8856a7", "#810f7c"],
                7: ["#edf8fb", "#bfd3e6", "#9ebcda", "#8c96c6", "#8c6bb1", "#88419d", "#6e016b"],
                8: ["#f7fcfd", "#e0ecf4", "#bfd3e6", "#9ebcda", "#8c96c6", "#8c6bb1", "#88419d", "#6e016b"],
                9: ["#f7fcfd", "#e0ecf4", "#bfd3e6", "#9ebcda", "#8c96c6", "#8c6bb1", "#88419d", "#810f7c", "#4d004b"]
            },
            RdPu: {
                3: ["#fde0dd", "#fa9fb5", "#c51b8a"],
                4: ["#feebe2", "#fbb4b9", "#f768a1", "#ae017e"],
                5: ["#feebe2", "#fbb4b9", "#f768a1", "#c51b8a", "#7a0177"],
                6: ["#feebe2", "#fcc5c0", "#fa9fb5", "#f768a1", "#c51b8a", "#7a0177"],
                7: ["#feebe2", "#fcc5c0", "#fa9fb5", "#f768a1", "#dd3497", "#ae017e", "#7a0177"],
                8: ["#fff7f3", "#fde0dd", "#fcc5c0", "#fa9fb5", "#f768a1", "#dd3497", "#ae017e", "#7a0177"],
                9: ["#fff7f3", "#fde0dd", "#fcc5c0", "#fa9fb5", "#f768a1", "#dd3497", "#ae017e", "#7a0177", "#49006a"]
            },
            PuRd: {
                3: ["#e7e1ef", "#c994c7", "#dd1c77"],
                4: ["#f1eef6", "#d7b5d8", "#df65b0", "#ce1256"],
                5: ["#f1eef6", "#d7b5d8", "#df65b0", "#dd1c77", "#980043"],
                6: ["#f1eef6", "#d4b9da", "#c994c7", "#df65b0", "#dd1c77", "#980043"],
                7: ["#f1eef6", "#d4b9da", "#c994c7", "#df65b0", "#e7298a", "#ce1256", "#91003f"],
                8: ["#f7f4f9", "#e7e1ef", "#d4b9da", "#c994c7", "#df65b0", "#e7298a", "#ce1256", "#91003f"],
                9: ["#f7f4f9", "#e7e1ef", "#d4b9da", "#c994c7", "#df65b0", "#e7298a", "#ce1256", "#980043", "#67001f"]
            },
            OrRd: {
                3: ["#fee8c8", "#fdbb84", "#e34a33"],
                4: ["#fef0d9", "#fdcc8a", "#fc8d59", "#d7301f"],
                5: ["#fef0d9", "#fdcc8a", "#fc8d59", "#e34a33", "#b30000"],
                6: ["#fef0d9", "#fdd49e", "#fdbb84", "#fc8d59", "#e34a33", "#b30000"],
                7: ["#fef0d9", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#990000"],
                8: ["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#990000"],
                9: ["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#b30000", "#7f0000"]
            },
            YlOrRd: {
                3: ["#ffeda0", "#feb24c", "#f03b20"],
                4: ["#ffffb2", "#fecc5c", "#fd8d3c", "#e31a1c"],
                5: ["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"],
                6: ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#f03b20", "#bd0026"],
                7: ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"],
                8: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"],
                9: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"]
            },
            YlOrBr: {
                3: ["#fff7bc", "#fec44f", "#d95f0e"],
                4: ["#ffffd4", "#fed98e", "#fe9929", "#cc4c02"],
                5: ["#ffffd4", "#fed98e", "#fe9929", "#d95f0e", "#993404"],
                6: ["#ffffd4", "#fee391", "#fec44f", "#fe9929", "#d95f0e", "#993404"],
                7: ["#ffffd4", "#fee391", "#fec44f", "#fe9929", "#ec7014", "#cc4c02", "#8c2d04"],
                8: ["#ffffe5", "#fff7bc", "#fee391", "#fec44f", "#fe9929", "#ec7014", "#cc4c02", "#8c2d04"],
                9: ["#ffffe5", "#fff7bc", "#fee391", "#fec44f", "#fe9929", "#ec7014", "#cc4c02", "#993404", "#662506"]
            },
            Purples: {
                3: ["#efedf5", "#bcbddc", "#756bb1"],
                4: ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#6a51a3"],
                5: ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#756bb1", "#54278f"],
                6: ["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"],
                7: ["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#4a1486"],
                8: ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#4a1486"],
                9: ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"]
            },
            Blues: {
                3: ["#deebf7", "#9ecae1", "#3182bd"],
                4: ["#eff3ff", "#bdd7e7", "#6baed6", "#2171b5"],
                5: ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"],
                6: ["#eff3ff", "#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"],
                7: ["#eff3ff", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#084594"],
                8: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#084594"],
                9: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"]
            },
            Greens: {
                3: ["#e5f5e0", "#a1d99b", "#31a354"],
                4: ["#edf8e9", "#bae4b3", "#74c476", "#238b45"],
                5: ["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"],
                6: ["#edf8e9", "#c7e9c0", "#a1d99b", "#74c476", "#31a354", "#006d2c"],
                7: ["#edf8e9", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#005a32"],
                8: ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#005a32"],
                9: ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c", "#00441b"]
            },
            Oranges: {
                3: ["#fee6ce", "#fdae6b", "#e6550d"],
                4: ["#feedde", "#fdbe85", "#fd8d3c", "#d94701"],
                5: ["#feedde", "#fdbe85", "#fd8d3c", "#e6550d", "#a63603"],
                6: ["#feedde", "#fdd0a2", "#fdae6b", "#fd8d3c", "#e6550d", "#a63603"],
                7: ["#feedde", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#8c2d04"],
                8: ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#8c2d04"],
                9: ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#a63603", "#7f2704"]
            },
            Reds: {
                3: ["#fee0d2", "#fc9272", "#de2d26"],
                4: ["#fee5d9", "#fcae91", "#fb6a4a", "#cb181d"],
                5: ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"],
                6: ["#fee5d9", "#fcbba1", "#fc9272", "#fb6a4a", "#de2d26", "#a50f15"],
                7: ["#fee5d9", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#99000d"],
                8: ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#99000d"],
                9: ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"]
            },
            Greys: {
                3: ["#f0f0f0", "#bdbdbd", "#636363"],
                4: ["#f7f7f7", "#cccccc", "#969696", "#525252"],
                5: ["#f7f7f7", "#cccccc", "#969696", "#636363", "#252525"],
                6: ["#f7f7f7", "#d9d9d9", "#bdbdbd", "#969696", "#636363", "#252525"],
                7: ["#f7f7f7", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525"],
                8: ["#ffffff", "#f0f0f0", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525"],
                9: ["#ffffff", "#f0f0f0", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525", "#000000"]
            },
            PuOr: {
                3: ["#f1a340", "#f7f7f7", "#998ec3"],
                4: ["#e66101", "#fdb863", "#b2abd2", "#5e3c99"],
                5: ["#e66101", "#fdb863", "#f7f7f7", "#b2abd2", "#5e3c99"],
                6: ["#b35806", "#f1a340", "#fee0b6", "#d8daeb", "#998ec3", "#542788"],
                7: ["#b35806", "#f1a340", "#fee0b6", "#f7f7f7", "#d8daeb", "#998ec3", "#542788"],
                8: ["#b35806", "#e08214", "#fdb863", "#fee0b6", "#d8daeb", "#b2abd2", "#8073ac", "#542788"],
                9: ["#b35806", "#e08214", "#fdb863", "#fee0b6", "#f7f7f7", "#d8daeb", "#b2abd2", "#8073ac", "#542788"],
                10: ["#7f3b08", "#b35806", "#e08214", "#fdb863", "#fee0b6", "#d8daeb", "#b2abd2", "#8073ac", "#542788", "#2d004b"],
                11: ["#7f3b08", "#b35806", "#e08214", "#fdb863", "#fee0b6", "#f7f7f7", "#d8daeb", "#b2abd2", "#8073ac", "#542788", "#2d004b"]
            },
            BrBG: {
                3: ["#d8b365", "#f5f5f5", "#5ab4ac"],
                4: ["#a6611a", "#dfc27d", "#80cdc1", "#018571"],
                5: ["#a6611a", "#dfc27d", "#f5f5f5", "#80cdc1", "#018571"],
                6: ["#8c510a", "#d8b365", "#f6e8c3", "#c7eae5", "#5ab4ac", "#01665e"],
                7: ["#8c510a", "#d8b365", "#f6e8c3", "#f5f5f5", "#c7eae5", "#5ab4ac", "#01665e"],
                8: ["#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#c7eae5", "#80cdc1", "#35978f", "#01665e"],
                9: ["#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e"],
                10: ["#543005", "#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#c7eae5", "#80cdc1", "#35978f", "#01665e", "#003c30"],
                11: ["#543005", "#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e", "#003c30"]
            },
            PRGn: {
                3: ["#af8dc3", "#f7f7f7", "#7fbf7b"],
                4: ["#7b3294", "#c2a5cf", "#a6dba0", "#008837"],
                5: ["#7b3294", "#c2a5cf", "#f7f7f7", "#a6dba0", "#008837"],
                6: ["#762a83", "#af8dc3", "#e7d4e8", "#d9f0d3", "#7fbf7b", "#1b7837"],
                7: ["#762a83", "#af8dc3", "#e7d4e8", "#f7f7f7", "#d9f0d3", "#7fbf7b", "#1b7837"],
                8: ["#762a83", "#9970ab", "#c2a5cf", "#e7d4e8", "#d9f0d3", "#a6dba0", "#5aae61", "#1b7837"],
                9: ["#762a83", "#9970ab", "#c2a5cf", "#e7d4e8", "#f7f7f7", "#d9f0d3", "#a6dba0", "#5aae61", "#1b7837"],
                10: ["#40004b", "#762a83", "#9970ab", "#c2a5cf", "#e7d4e8", "#d9f0d3", "#a6dba0", "#5aae61", "#1b7837", "#00441b"],
                11: ["#40004b", "#762a83", "#9970ab", "#c2a5cf", "#e7d4e8", "#f7f7f7", "#d9f0d3", "#a6dba0", "#5aae61", "#1b7837", "#00441b"]
            },
            PiYG: {
                3: ["#e9a3c9", "#f7f7f7", "#a1d76a"],
                4: ["#d01c8b", "#f1b6da", "#b8e186", "#4dac26"],
                5: ["#d01c8b", "#f1b6da", "#f7f7f7", "#b8e186", "#4dac26"],
                6: ["#c51b7d", "#e9a3c9", "#fde0ef", "#e6f5d0", "#a1d76a", "#4d9221"],
                7: ["#c51b7d", "#e9a3c9", "#fde0ef", "#f7f7f7", "#e6f5d0", "#a1d76a", "#4d9221"],
                8: ["#c51b7d", "#de77ae", "#f1b6da", "#fde0ef", "#e6f5d0", "#b8e186", "#7fbc41", "#4d9221"],
                9: ["#c51b7d", "#de77ae", "#f1b6da", "#fde0ef", "#f7f7f7", "#e6f5d0", "#b8e186", "#7fbc41", "#4d9221"],
                10: ["#8e0152", "#c51b7d", "#de77ae", "#f1b6da", "#fde0ef", "#e6f5d0", "#b8e186", "#7fbc41", "#4d9221", "#276419"],
                11: ["#8e0152", "#c51b7d", "#de77ae", "#f1b6da", "#fde0ef", "#f7f7f7", "#e6f5d0", "#b8e186", "#7fbc41", "#4d9221", "#276419"]
            },
            RdBu: {
                3: ["#ef8a62", "#f7f7f7", "#67a9cf"],
                4: ["#ca0020", "#f4a582", "#92c5de", "#0571b0"],
                5: ["#ca0020", "#f4a582", "#f7f7f7", "#92c5de", "#0571b0"],
                6: ["#b2182b", "#ef8a62", "#fddbc7", "#d1e5f0", "#67a9cf", "#2166ac"],
                7: ["#b2182b", "#ef8a62", "#fddbc7", "#f7f7f7", "#d1e5f0", "#67a9cf", "#2166ac"],
                8: ["#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac"],
                9: ["#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac"],
                10: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"],
                11: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"]
            },
            RdGy: {
                3: ["#ef8a62", "#ffffff", "#999999"],
                4: ["#ca0020", "#f4a582", "#bababa", "#404040"],
                5: ["#ca0020", "#f4a582", "#ffffff", "#bababa", "#404040"],
                6: ["#b2182b", "#ef8a62", "#fddbc7", "#e0e0e0", "#999999", "#4d4d4d"],
                7: ["#b2182b", "#ef8a62", "#fddbc7", "#ffffff", "#e0e0e0", "#999999", "#4d4d4d"],
                8: ["#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#e0e0e0", "#bababa", "#878787", "#4d4d4d"],
                9: ["#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#ffffff", "#e0e0e0", "#bababa", "#878787", "#4d4d4d"],
                10: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#e0e0e0", "#bababa", "#878787", "#4d4d4d", "#1a1a1a"],
                11: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#ffffff", "#e0e0e0", "#bababa", "#878787", "#4d4d4d", "#1a1a1a"]
            },
            RdYlBu: {
                3: ["#fc8d59", "#ffffbf", "#91bfdb"],
                4: ["#d7191c", "#fdae61", "#abd9e9", "#2c7bb6"],
                5: ["#d7191c", "#fdae61", "#ffffbf", "#abd9e9", "#2c7bb6"],
                6: ["#d73027", "#fc8d59", "#fee090", "#e0f3f8", "#91bfdb", "#4575b4"],
                7: ["#d73027", "#fc8d59", "#fee090", "#ffffbf", "#e0f3f8", "#91bfdb", "#4575b4"],
                8: ["#d73027", "#f46d43", "#fdae61", "#fee090", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4"],
                9: ["#d73027", "#f46d43", "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4"],
                10: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"],
                11: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"]
            },
            Spectral: {
                3: ["#fc8d59", "#ffffbf", "#99d594"],
                4: ["#d7191c", "#fdae61", "#abdda4", "#2b83ba"],
                5: ["#d7191c", "#fdae61", "#ffffbf", "#abdda4", "#2b83ba"],
                6: ["#d53e4f", "#fc8d59", "#fee08b", "#e6f598", "#99d594", "#3288bd"],
                7: ["#d53e4f", "#fc8d59", "#fee08b", "#ffffbf", "#e6f598", "#99d594", "#3288bd"],
                8: ["#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#e6f598", "#abdda4", "#66c2a5", "#3288bd"],
                9: ["#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd"],
                10: ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"],
                11: ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"]
            },
            RdYlGn: {
                3: ["#fc8d59", "#ffffbf", "#91cf60"],
                4: ["#d7191c", "#fdae61", "#a6d96a", "#1a9641"],
                5: ["#d7191c", "#fdae61", "#ffffbf", "#a6d96a", "#1a9641"],
                6: ["#d73027", "#fc8d59", "#fee08b", "#d9ef8b", "#91cf60", "#1a9850"],
                7: ["#d73027", "#fc8d59", "#fee08b", "#ffffbf", "#d9ef8b", "#91cf60", "#1a9850"],
                8: ["#d73027", "#f46d43", "#fdae61", "#fee08b", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850"],
                9: ["#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850"],
                10: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"],
                11: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"]
            },
            Accent: {
                3: ["#7fc97f", "#beaed4", "#fdc086"],
                4: ["#7fc97f", "#beaed4", "#fdc086", "#ffff99"],
                5: ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0"],
                6: ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f"],
                7: ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17"],
                8: ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17", "#666666"]
            },
            Dark2: {
                3: ["#1b9e77", "#d95f02", "#7570b3"],
                4: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a"],
                5: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e"],
                6: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02"],
                7: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d"],
                8: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"]
            },
            Paired: {
                3: ["#a6cee3", "#1f78b4", "#b2df8a"],
                4: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c"],
                5: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99"],
                6: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c"],
                7: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f"],
                8: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00"],
                9: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6"],
                10: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a"],
                11: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99"],
                12: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"]
            },
            Pastel1: {
                3: ["#fbb4ae", "#b3cde3", "#ccebc5"],
                4: ["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4"],
                5: ["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6"],
                6: ["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc"],
                7: ["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd"],
                8: ["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd", "#fddaec"],
                9: ["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd", "#fddaec", "#f2f2f2"]
            },
            Pastel2: {
                3: ["#b3e2cd", "#fdcdac", "#cbd5e8"],
                4: ["#b3e2cd", "#fdcdac", "#cbd5e8", "#f4cae4"],
                5: ["#b3e2cd", "#fdcdac", "#cbd5e8", "#f4cae4", "#e6f5c9"],
                6: ["#b3e2cd", "#fdcdac", "#cbd5e8", "#f4cae4", "#e6f5c9", "#fff2ae"],
                7: ["#b3e2cd", "#fdcdac", "#cbd5e8", "#f4cae4", "#e6f5c9", "#fff2ae", "#f1e2cc"],
                8: ["#b3e2cd", "#fdcdac", "#cbd5e8", "#f4cae4", "#e6f5c9", "#fff2ae", "#f1e2cc", "#cccccc"]
            },
            Set1: {
                3: ["#e41a1c", "#377eb8", "#4daf4a"],
                4: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3"],
                5: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"],
                6: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33"],
                7: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628"],
                8: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf"],
                9: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"]
            },
            Set2: {
                3: ["#66c2a5", "#fc8d62", "#8da0cb"],
                4: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3"],
                5: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854"],
                6: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f"],
                7: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494"],
                8: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3"]
            },
            Set3: {
                3: ["#8dd3c7", "#ffffb3", "#bebada"],
                4: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072"],
                5: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3"],
                6: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462"],
                7: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69"],
                8: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5"],
                9: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9"],
                10: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd"],
                11: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5"],
                12: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f"]
            }
        };
        private viewport: IViewport;
        private margin: IMargin = {left: 10, right: 10, bottom: 15, top: 15};
        private animationDuration: number = 1000;

        private static ClsAll: string = "*";
        private static ClsCategoryX: string = "categoryX";
        private static ClsMono: string = "mono";
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

        private static ConstColorbrewer: string = "colorbrewer";
        private static ConstGeneral: string = "general";
        private static ConstBuckets: string = "buckets";
        private static ConstEnd: string = "end";
        private static ConstMiddle: string = "middle";
        private static Const0em: string = "0em";
        private static Const071em: string = ".71em";
        private static ConstReds: string = "Reds";

        private static ConstDefaultBucketNumber: number = 5;
        private static ConstDefaultBucketNumberArray: number[] = [3, 4, 5, 6, 7, 8, 9];
        private static ConstGridSizeWidthLimit: number = 80;
        private static ConstShiftLabelFromGrid: number = -6;
        private static ConstGridHeightWidthRaito: number = 0.5;
        private static ConstGridLegendWidthRaito: number = 0.666;
        private static ConstLegendOffsetFromChartByY: number = 0.5;

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

                let numBuckets: number = TableHeatMap.getNumBuckets(dataView);
                let colorbrewerScale: string = this.getColorbrewerScale(dataView);
                let colors: Array<string>;
                if (colorbrewerScale) {
                    let colorbrewer: IColorArray = this.colorbrewer[colorbrewerScale];
                    colors = (colorbrewer ? colorbrewer[numBuckets] : this.colorbrewer.Reds[numBuckets]);
                }
                else {
                    colors = this.colorbrewer.Reds[numBuckets];	// default color scheme
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
                    .enter().append(TableHeatMap.HtmlObjRect)
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

        private getColorbrewerScale(dataView: DataView): string {
            let defaultValues = Object.keys(this.colorbrewer);

            if (dataView) {
                let objects = dataView.metadata.objects;
                if (objects) {
                    let general = objects[TableHeatMap.ConstGeneral];
                    if (general) {
                        let idx = defaultValues.indexOf(<string>general[TableHeatMap.ConstColorbrewer]);
                        if (idx > 0) {
                            return defaultValues[idx];
                        }
                        else {
                            return <string>general[TableHeatMap.ConstColorbrewer];
                        }
                    }
                }
            }
            return TableHeatMap.ConstReds;
        }

        static getNumBuckets(dataView: DataView): number {
            let defaultValues = TableHeatMap.ConstDefaultBucketNumberArray;
            if (dataView) {
                let objects = dataView.metadata.objects;
                if (objects) {
                    let general = objects[TableHeatMap.ConstGeneral];
                    if (general) {
                        if (defaultValues.indexOf(<number>general[TableHeatMap.ConstBuckets]) > 0)
                            return <number>general[TableHeatMap.ConstBuckets];
                    }
                }
            }
            return TableHeatMap.ConstDefaultBucketNumber;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            let instances: VisualObjectInstance[] = [];
            let dataView = this.dataView;
            switch (options.objectName) {
                case TableHeatMap.ConstGeneral:
                    let general: VisualObjectInstance = {
                        objectName: TableHeatMap.ConstGeneral,
                        displayName: "General",
                        selector: null,
                        properties: {
                            colorbrewer: this.getColorbrewerScale(dataView),
                            buckets: TableHeatMap.getNumBuckets(dataView)
                        }
                    };
                    instances.push(general);
                    break;
            }
            return instances;
        }
    }
}


