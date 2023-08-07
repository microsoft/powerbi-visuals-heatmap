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
import { areColorsEqual } from "./helpers";

import {
    pixelConverter as PixelConverter
} from "powerbi-visuals-utils-typeutils";
import {
    textMeasurementService as tms
} from "powerbi-visuals-utils-formattingutils";

import { TextProperties } from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";
import capabilities from '../capabilities.json';
import { TableHeatMap } from "../src/visual";
import powerbiVisualsApi from "powerbi-visuals-api";
import VisualObjectInstance = powerbiVisualsApi.VisualObjectInstance;
import { d3Click } from "powerbi-visuals-utils-testutils";
const DefaultTimeout: number = 300;

describe("Aria-Selected_Attributes_and_such", () =>{
    let visualBuilder: TableHeatMapBuilder;
    let dataView: DataView;
    let defaultDataViewBuilder: TableHeatMapData;
    
    beforeEach(() => {
        visualBuilder = new TableHeatMapBuilder(1000, 1000);
        defaultDataViewBuilder = new TableHeatMapData();
        dataView = defaultDataViewBuilder.getDataView();
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });
    
    it("should have aria-selected, tabindex attributes correctly set", (done) => {
        visualBuilder.updateRenderTimeout(dataView, () => {
            if(visualBuilder.rects){
            visualBuilder.rects.forEach((el: Element) => {
                expect(el.getAttribute("aria-selected")).toBe("false");
                expect(el.getAttribute("tabindex")).toBe("0");
            });
        }
            done();
        }, DefaultTimeout);
    });
    it("should have role=listbox attribute correctly set", (done) => {
        visualBuilder.updateRenderTimeout(dataView, () => {
          let svgElement = visualBuilder.mainElement?.querySelector("svg");
      
          expect(svgElement).toBeTruthy(); // Check if SVG element exists.
          expect(svgElement?.getAttribute("role")).toBe("listbox"); // Check the "role" attribute.
      
          done();
        }, DefaultTimeout);
      });

    it("aria attributs work when clicked", (done: DoneFn) => {
        visualBuilder.updateRenderTimeout(dataView, async () => {
        if(visualBuilder.rects){
            d3Click(visualBuilder.rects[0], 5, 5);
            await timeout(DefaultTimeout)
            expect(visualBuilder.rects[0].getAttribute("aria-selected")).toBe("true");
            for (const rect of visualBuilder.rects) {
                if (rect !== visualBuilder.rects[0]) {
                    expect(rect.getAttribute("aria-selected")).toBe("false");
                }
            }
        }
        done();
        });
    });
    it("enter toggles the correct rects", (done: DoneFn) => {
        const enterEvent = new KeyboardEvent("keypress", { code: "Enter", bubbles: true });
        visualBuilder.updateRenderTimeout(
            dataView,
                async () => {
                    if(visualBuilder.rects){
                    visualBuilder.rects[0].dispatchEvent(enterEvent);
                    await timeout(DefaultTimeout);
                    expect(visualBuilder.rects[0].getAttribute("aria-selected")).toBe("true");
                    for (const rects of visualBuilder.rects) {
                        if (rects !== visualBuilder.rects[0]) {
                            expect(rects.getAttribute("aria-selected")).toBe("false");
                        }
                    }

                    visualBuilder.rects[0].dispatchEvent(enterEvent);
                    await timeout(DefaultTimeout);
                    for (const rects of visualBuilder.rects) {
                        expect(rects.getAttribute("aria-selected")).toBe("false");
                    }

                    done();
                }
                },
            2,
            );
    });
    it("space toggles the correct rects", (done: DoneFn) => {
        const spaceEvent = new KeyboardEvent("keypress", { code: "Space", bubbles: true });
        visualBuilder.updateRenderTimeout(
            dataView,
                async () => {
                    if(visualBuilder.rects){
                    visualBuilder.rects[0].dispatchEvent(spaceEvent);
                    await timeout(DefaultTimeout);
                    expect(visualBuilder.rects[0].getAttribute("aria-selected")).toBe("true");
                    for (const rects of visualBuilder.rects) {
                        if (rects !== visualBuilder.rects[0]) {
                            expect(rects.getAttribute("aria-selected")).toBe("false");
                        }
                    }

                    visualBuilder.rects[0].dispatchEvent(spaceEvent);
                    await timeout(DefaultTimeout);
                    for (const rects of visualBuilder.rects) {
                        expect(rects.getAttribute("aria-selected")).toBe("false");
                    }

                    done();
                }
                },
            2,
            );
    });
    it("tab between rects works", (done: DoneFn) => {
        const tabEvent = new KeyboardEvent("keypress", { code: "Tab", bubbles: true });
        const enterEvent = new KeyboardEvent("keypress", { code: "Enter", bubbles: true });
        visualBuilder.updateRenderTimeout(
            dataView,
            async () => {
                if(visualBuilder.rects){
                visualBuilder.rects[0].dispatchEvent(enterEvent);
                await timeout(DefaultTimeout);
                expect(visualBuilder.rects[0].getAttribute("aria-selected")).toBe("true");
                for (const rects of visualBuilder.rects) {
                    if (rects !== visualBuilder.rects[0]) {
                        expect(rects.getAttribute("aria-selected")).toBe("false");
                    }
                }

                visualBuilder.element.dispatchEvent(tabEvent);
                await timeout(DefaultTimeout);

                visualBuilder.rects[1].dispatchEvent(enterEvent);
                await timeout(DefaultTimeout);
                expect(visualBuilder.rects[1].getAttribute("aria-selected")).toBe("true");
                for (const rects of visualBuilder.rects) {
                    if (rects !== visualBuilder.rects[1]) {
                        expect(rects.getAttribute("aria-selected")).toBe("false");
                    }
                }

                done();
            }
            },
            2,
            );
    });
});

function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
describe("TableHeatmap", () => {
    let visualBuilder: TableHeatMapBuilder;
    let dataView: DataView;
    let defaultDataViewBuilder: TableHeatMapData;

    beforeEach(() => {
        visualBuilder = new TableHeatMapBuilder(1000, 1000);
        defaultDataViewBuilder = new TableHeatMapData();
        dataView = defaultDataViewBuilder.getDataView();
    });

    afterEach(() => {
        document.body.innerHTML = "";
    })

    it("main DOM created", (done) => {
        visualBuilder.updateRenderTimeout(dataView, () => {
            expect(visualBuilder.mainElement!).toBeTruthy();
            done();
        }, DefaultTimeout);
    });

    describe("short size", () => {
        beforeEach(() => {
            visualBuilder = new TableHeatMapBuilder(100, 100);
        });

        it("main DOM created", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.mainElement!).toBeTruthy();
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
                expect(visualBuilder.mainElement!).toBeTruthy();
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
            expect(document.querySelectorAll(".heatMapDataLabels")).toBeTruthy();
            done();
        }, DefaultTimeout);
    });

    it("data labels were not created", (done) => {
        dataView.metadata.objects = {
            labels: {
                show: false
            }
        };

        visualBuilder.updateRenderTimeout(dataView, () => {
            expect(document.querySelectorAll(".heatMapDataLabels").length).toBe(0);
            done();
        }, DefaultTimeout);
    });

    describe("x axis label font", () => {
        it("must resize", (done) => {
            dataView.metadata.objects = {
                xAxisLabels: {
                    show: true,
                    fontSize: 20
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = document.querySelectorAll(".categoryXLabel");
                const items = Array.from(labelDOMItems);
                
                const filteredItem = items.find(i => getComputedStyle(i)["font-size"] === "20px");
                
                expect(labelDOMItems).toBeTruthy();
                expect(filteredItem).toBeTruthy();

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
                let labelDOMItems = document.querySelectorAll(".categoryXLabel");
                const items = Array.from(labelDOMItems);
                
                const filteredItem = items.find(i => getComputedStyle(i)["font-size"] === "40px");
                
                expect(labelDOMItems).toBeTruthy();
                expect(filteredItem).toBeTruthy();

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
                let labelDOMItems = document.querySelectorAll(".categoryXLabel");
                const items = Array.from(labelDOMItems);
                
                const filteredItem = items.find(i => getComputedStyle(i)["font-family"] === "Arial");
                
                expect(labelDOMItems).toBeTruthy();
                expect(filteredItem).toBeTruthy();

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
                let labelDOMItems = document.querySelectorAll(".categoryYLabel");
                const items = Array.from(labelDOMItems);

                const filteredItems = items.find(i => getComputedStyle(i)["font-size"] === "12px");
                
                expect(labelDOMItems).toBeTruthy();
                expect(filteredItems).toBeTruthy();

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
                let labelDOMItems = document.querySelectorAll(".categoryYLabel");
                const items = Array.from(labelDOMItems);

                const filteredItems = items.find(i => getComputedStyle(i)["font-size"] === "40px");
                
                expect(labelDOMItems).toBeTruthy();
                expect(filteredItems).toBeTruthy();

                done();
            }, DefaultTimeout);
        });

        it("family must change", (done) => {
            dataView.metadata.objects = {
                yAxisLabels: {
                    show: true,
                    fontFamily: "Verdana"
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = document.querySelectorAll(".categoryYLabel");
                const items = Array.from(labelDOMItems);

                const filteredItems = items.find(i => getComputedStyle(i)["font-family"] === "Verdana");
                
                expect(labelDOMItems).toBeTruthy();
                expect(filteredItems).toBeTruthy();

                done();
            }, DefaultTimeout);
        });
    });

    describe("data label font", () => {
        it("must resize", (done) => {
            dataView.metadata.objects = {
                labels: {
                    show: true,
                    fontSize: 24,
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = document.querySelectorAll(".heatMapDataLabels");
                const items = Array.from(labelDOMItems);
                
                const filteredItem = items.find(i => getComputedStyle(i)["font-size"] === "24px");

                expect(labelDOMItems).toBeTruthy();
                expect(filteredItem).toBeTruthy();

                done();
            }, DefaultTimeout);
        });

        it("must resize", (done) => {
            dataView.metadata.objects = {
                labels: {
                    show: true,
                    fontSize: 40,
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = document.querySelectorAll(".heatMapDataLabels");
                const items = Array.from(labelDOMItems);

                const filteredItem = items.find(i => getComputedStyle(i)["font-size"] === "40px");

                expect(labelDOMItems).toBeTruthy();
                expect(filteredItem).toBeTruthy();

                done();
            }, DefaultTimeout);
        });

        it("family must change", (done) => {
            dataView.metadata.objects = {
                labels: {
                    show: true,
                    fontFamily: "Verdana"
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelDOMItems = document.querySelectorAll(".heatMapDataLabels");
                const items = Array.from(labelDOMItems);

                const filteredItem = items.find(i => getComputedStyle(i)["font-family"] === "Verdana");

                expect(labelDOMItems).toBeTruthy();
                expect(filteredItem).toBeTruthy();

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

            const valueColIndex: number = 2;
            const transparentElementsCount: number = 2;
            dataView.categorical!.values![0].values![valueColIndex] = "";
            dataView.categorical!.values![1].values![valueColIndex] = "";
            visualBuilder.updateRenderTimeout(dataView, () => {
                let transparentElements: number = 0;
                let rects = document.querySelectorAll("rect.categoryX");
                rects.forEach((el: Element) => {
                    if (+(getComputedStyle(el)["opacity"] || 1) === 0) {
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
                let rects = document.querySelectorAll("rect.categoryX");
                rects.forEach((el: Element) => {
                    if (+(getComputedStyle(el)["opacity"] || 1) === 0) {
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
                let texts = document.querySelectorAll("text.categoryXLabel");
                let text: Element = texts[0];
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
                let textRect: SVGRect = tms.measureSvgTextRect(textProperties);
                expect(+document.querySelector(".categoryX")!.getAttribute("width")!).toBeGreaterThan(textRect.width);
                done();
            }, DefaultTimeout);
        });

        it("height must be limited", (done) => {
            dataView = defaultDataViewBuilder.getDataViewWithOneCategory();
            visualBuilder.updateRenderTimeout(dataView, () => {
                const cellMaxHeightLimit: number = TableHeatMap.CellMaxHeightLimit;
                expect(+document.querySelector(".categoryX")!.getAttribute("height")!).toBeLessThanOrEqual(cellMaxHeightLimit);
                done();
            }, DefaultTimeout);
        });
    });

    describe("Capabilities tests", () => {
        it("all items having displayName should have displayNameKey property", () => {
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

            objectsChecker(capabilities.objects);
        });

        describe("Accessibility", () => {
            describe("High contrast mode", () => {
                const backgroundColor: string = "#000000";
                const foregroundColor: string = "#ffff00";

                beforeEach(() => {
                    visualBuilder.visualHost.colorPalette.isHighContrast = true;

                    visualBuilder.visualHost.colorPalette.background = { value: backgroundColor };
                    visualBuilder.visualHost.colorPalette.foreground = { value: foregroundColor };
                });

                it("should use background theme color as fill", (done) => {
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        const rects = Array.from(visualBuilder.rects!);

                        expect(isColorAppliedToElements(rects, backgroundColor, "fill"));

                        done();
                    });
                });

                it("should use foreground theme color as stroke", (done) => {
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        const rects = Array.from(visualBuilder.rects!);

                        expect(isColorAppliedToElements(rects, foregroundColor, "stroke"));

                        done();
                    });
                });

                function isColorAppliedToElements(
                    elements: Element[],
                    color?: string,
                    colorStyleName: string = "fill"
                ): boolean {
                    return elements.some((element: Element) => {
                        const currentColor: string = getComputedStyle(element)[colorStyleName];

                        if (!currentColor || !color) {
                            return currentColor === color;
                        }

                        return areColorsEqual(currentColor, color);
                    });
                }
            });
        });
    });
});
