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
import DataView = powerbi.DataView;
import { TableHeatMapBuilder } from "./visualBuilder";
import { TableHeatMapData } from "./visualData";

import {
    pixelConverter as PixelConverter
} from "powerbi-visuals-utils-typeutils";
import {
    textMeasurementService as tms
} from "powerbi-visuals-utils-formattingutils";

import TextMeasurementService = tms.textMeasurementService;
import TextProperties = tms.TextProperties;
const DefaultTimeout: number = 300;

describe("TableHeatmap", () => {
    let visualBuilder: TableHeatMapBuilder;
    let dataView: DataView;
    let defaultDataViewBuilder: TableHeatMapData;

    beforeEach(() => {
        visualBuilder = new TableHeatMapBuilder(1000, 1000);
        defaultDataViewBuilder = new TableHeatMapData();
        dataView = defaultDataViewBuilder.getDataView();
    });

    it("main DOM created", (done) => {
        visualBuilder.updateRenderTimeout(dataView, () => {
            expect($(visualBuilder.mainElement)).toBeInDOM();
            done();
        }, DefaultTimeout);
    });

    describe("short size", () => {
        beforeEach(() => {
            visualBuilder = new TableHeatMapBuilder(100, 100);
        });

        it("main DOM created", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect($(visualBuilder.mainElement)).toBeInDOM();
                done();
            }, DefaultTimeout);
        });
    });

    describe("with objects", () => {
        beforeEach(() => {
            dataView.metadata.objects = {
                general: {
                    colorbrewer: "YlGn",
                    buckets: 5,
                }
            };
        });

        it("main DOM created", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect($(visualBuilder.mainElement)).toBeInDOM();
                done();
            }, DefaultTimeout);
        });
    });

    it("data labels created", (done) => {
        dataView.metadata.objects = {
            labels: {
                show: true
            }
        };

        visualBuilder.updateRenderTimeout(dataView, () => {
            expect($(".heatMapDataLabels")).toBeInDOM();
            done();
        }, DefaultTimeout);
    });

    it("data labels didin't created", (done) => {
        dataView.metadata.objects = {
            labels: {
                show: false
            }
        };

        visualBuilder.updateRenderTimeout(dataView, () => {
            expect($(".heatMapDataLabels")).not.toBeInDOM();
            done();
        }, DefaultTimeout);
    });

    describe("x axis label font", () => {
        it("must resize", (done) => {
            dataView.metadata.objects = {
                xAxisLabels: {
                    show: true,
                    fontSize: 12
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = $(".categoryXLabel");
                expect($(labelDOMItems)).toBeInDOM();
                expect(labelDOMItems.css("font-size")).toBe("12px");
                done();
            }, DefaultTimeout);
        });

        it("must resize", (done) => {
            dataView.metadata.objects = {
                xAxisLabels: {
                    show: true,
                    fontSize: 40
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = $(".categoryXLabel");
                expect($(labelDOMItems)).toBeInDOM();
                expect(labelDOMItems.css("font-size")).toBe("40px");
                done();
            }, DefaultTimeout);
        });

        it("family must change", (done) => {
            dataView.metadata.objects = {
                xAxisLabels: {
                    show: true,
                    fontFamily: "Arial"
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = $(".categoryXLabel");
                expect($(labelDOMItems)).toBeInDOM();
                expect(labelDOMItems.css("font-family")).toBe("Arial");
                done();
            }, DefaultTimeout);
        });
    });

    describe("y axis label font", () => {
        it("must resize", (done) => {
            dataView.metadata.objects = {
                yAxisLabels: {
                    show: true,
                    fontSize: 12
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = $(".categoryYLabel");
                expect($(labelDOMItems)).toBeInDOM();
                expect(labelDOMItems.css("font-size")).toBe("12px");
                done();
            }, DefaultTimeout);
        });

        it("must resize", (done) => {
            dataView.metadata.objects = {
                yAxisLabels: {
                    show: true,
                    fontSize: 40
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = $(".categoryYLabel");
                expect($(labelDOMItems)).toBeInDOM();
                expect(labelDOMItems.css("font-size")).toBe("40px");
                done();
            }, DefaultTimeout);
        });

        it("family must change", (done) => {
            dataView.metadata.objects = {
                yAxisLabels: {
                    show: true,
                    fontFamily: "Arial"
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = $(".categoryYLabel");
                expect($(labelDOMItems)).toBeInDOM();
                expect(labelDOMItems.css("font-family")).toBe("Arial");
                done();
            }, DefaultTimeout);
        });
    });

    describe("data label font", () => {
        it("must resize", (done) => {
            dataView.metadata.objects = {
                labels: {
                    show: true,
                    fontSize: 12
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = $(".heatMapDataLabels");
                expect($(labelDOMItems)).toBeInDOM();
                expect(labelDOMItems.css("font-size")).toBe("12px");
                done();
            }, DefaultTimeout);
        });

        it("must resize", (done) => {
            dataView.metadata.objects = {
                labels: {
                    show: true,
                    fontSize: 40
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = $(".heatMapDataLabels");
                expect($(labelDOMItems)).toBeInDOM();
                expect(labelDOMItems.css("font-size")).toBe("40px");
                done();
            }, DefaultTimeout);
        });

        it("family must change", (done) => {
            dataView.metadata.objects = {
                labels: {
                    show: true,
                    fontFamily: "Arial"
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = $(".heatMapDataLabels");
                expect($(labelDOMItems)).toBeInDOM();
                expect(labelDOMItems.css("font-family")).toBe("Arial");
                done();
            }, DefaultTimeout);
        });
    });

    describe("data with null", () => {
        it("must be transparent", (done) => {
            dataView.metadata.objects = {
                general: {
                    fillNullValuesCells: false
                },
                labels: {
                    show: true,
                    fontSize: 12
                }
            };

            // set some values of Y as null;
            const yRoleIndex: number = 1;
            const valueColIndex: number = 2;
            const transparentElementsCount: number = 2;
            dataView.categorical.values[0].values[valueColIndex] = null;
            dataView.categorical.values[1].values[valueColIndex] = null;
            visualBuilder.updateRenderTimeout(dataView, () => {
                let transparentElements: number = 0;
                let rects: JQuery = $("rect.categoryX");
                rects.each((index: number, el: HTMLElement) => {
                    if (+(el.style.opacity || 1) === 0) {
                        transparentElements++;
                    }
                });

                expect(transparentElements).toBe(transparentElementsCount);
                done();
            }, DefaultTimeout);
        });

        it("must be colored", (done) => {
            dataView.metadata.objects = {
                general: {
                    fillNullValuesCells: true
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let transparentElements: number = 0;
                const transparentElementsCount: number = 0;
                let rects: JQuery = $("rect.categoryX");
                rects.each((index: number, el: HTMLElement) => {
                    if (+(el.style.opacity || 1) === 0) {
                        transparentElements++;
                    }
                });

                expect(transparentElements).toBe(transparentElementsCount);
                done();
            }, DefaultTimeout);
        });
    });

    describe("data with zero", () => {
        it("must be 0 (not null)", (done) => {
            dataView = defaultDataViewBuilder.getDataViewWithNullAndZero();
            dataView.metadata.objects = {
                general: {
                    fillNullValuesCells: false
                },
                labels: {
                    show: true
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let texts: JQuery = $("text.categoryXLabel");
                let text: HTMLElement = texts[0];
                expect(text.textContent).toBe("0");
                done();
            }, DefaultTimeout);
        });
    });

    describe("cell size", () => {
        it("must resize with big font size of cell data labels", (done) => {
            const fontSize: number = 40;
            const fontFamily: string = "Arial";
            dataView.metadata.objects = {
                labels: {
                    show: true,
                    fontFamily: fontFamily,
                    fontSize: fontSize
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let textProperties: TextProperties = {
                    fontSize: PixelConverter.toString(fontSize),
                    fontFamily: fontFamily,
                    text: "00"
                };
                let textRect: SVGRect = TextMeasurementService.measureSvgTextRect(textProperties);
                expect(+$(".categoryX").attr("width")).toBeGreaterThan(textRect.width);
                done();
            }, DefaultTimeout);
        });

        it("height must be limited by 60px", (done) => {
            dataView = defaultDataViewBuilder.getDataViewWithOneCategory();
            visualBuilder.updateRenderTimeout(dataView, () => {
                const CellMaxHeightLimit: number = 61;
                expect(+$(".categoryX").attr("height")).toBeLessThan(CellMaxHeightLimit);
                done();
            }, DefaultTimeout);
        });
    });

    describe("Capabilities tests", () => {
        it("all items having displayName should have displayNameKey property", () => {
            jasmine.getJSONFixtures().fixturesPath = "base";

            let jsonData = getJSONFixture("capabilities.json");

            let objectsChecker: Function = (obj) => {
                for (let property in obj) {
                    let value: any = obj[property];

                    if (property === "enumeration") {
                        continue;
                    }

                    if (value.displayName) {
                        expect(value.displayNameKey).toBeDefined();
                    }

                    if (typeof value === "object") {
                        objectsChecker(value);
                    }
                }
            };

            objectsChecker(jsonData);
        });
    });
});
