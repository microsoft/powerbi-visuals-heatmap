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
import { ClickEventType, d3Click, renderTimeout } from "powerbi-visuals-utils-testutils";

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
    describe("Selection tests", () => {
        it("element can be selected", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const firstRect = visualBuilder.rects![0];
                d3Click(firstRect, 0, 0, ClickEventType.Default);

                renderTimeout(() => {
                    expect(visualBuilder.selectedRects?.length).toBe(1);
                    done();
                });
            });
        });

        it("element can be deselected", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const firstRect = visualBuilder.rects![0];
                d3Click(firstRect, 0, 0, ClickEventType.Default);

                renderTimeout(() => {
                    expect(visualBuilder.selectedRects?.length).toBe(1);
                    d3Click(firstRect, 0, 0, ClickEventType.CtrlKey);

                    renderTimeout(() => {
                        expect(visualBuilder.selectedRects?.length).toBe(0);
                        done();
                    });
                });
            });
        });

        it("multi-selection should work with ctrlKey", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                checkMultiselection(ClickEventType.CtrlKey, done);
            });
        });

        it("multi-selection should work with metaKey", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                checkMultiselection(ClickEventType.MetaKey, done);
            });
        });

        it("multi-selection should work with shiftKey", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                checkMultiselection(ClickEventType.ShiftKey, done);
            });
        });

        function checkMultiselection(eventType: number, done: DoneFn): void {
            const firstColumn = visualBuilder.rects![0];
            const secondColumn = visualBuilder.rects![1];
            d3Click(firstColumn, 0, 0, ClickEventType.Default);
            renderTimeout(() => {
                expect(visualBuilder.selectedRects?.length).toBe(1);

                d3Click(secondColumn, 0, 0, eventType);

                renderTimeout(() => {
                    expect(visualBuilder.selectedRects?.length).toBe(2);
                    done();
                });
            });
        }
    });

    describe("Keyboard navigation and related aria-attributes tests:", () => {
        it("should have role=grid and aria-multiselectable attributes correctly set", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const grid = visualBuilder.grid;

                expect(grid!.getAttribute("role")).toBe("grid");
                expect(grid!.getAttribute("aria-multiselectable")).toBe("true");

                done();
            });
        });

        it("should have role=presentation correctly set on text labels", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {

                const labels = Array.from(visualBuilder.labels!);
                for (const label of labels) { 
                    expect(label.getAttribute("role")).toBe("presentation");
                }

                done();
            });
        });

        it("enter toggles the correct column", (done) => {
            const enterEvent = new KeyboardEvent("keydown", { key: "enter", code: "Enter", bubbles: true });
            checkKeyboardSingleSelection(enterEvent, done);
        });

        it("space toggles the correct column", (done) => {
            const spaceEvent = new KeyboardEvent("keydown", { code: "Space", bubbles: true });
            checkKeyboardSingleSelection(spaceEvent, done);
        });

        it("multiselection should work with ctrlKey", (done) => {
            const enterEventCtrlKey = new KeyboardEvent("keydown", { code: "Enter", bubbles: true, ctrlKey: true });
            checkKeyboardMultiSelection(enterEventCtrlKey, done);
        });

        it("multiselection should work with metaKey", (done) => {
            const enterEventMetaKey = new KeyboardEvent("keydown", { code: "Enter", bubbles: true, metaKey: true });
            checkKeyboardMultiSelection(enterEventMetaKey, done);
        });

        it("multiselection should work with shiftKey", (done) => {
            const enterEventShiftKey = new KeyboardEvent("keydown", { code: "Enter", bubbles: true, shiftKey: true });
            checkKeyboardMultiSelection(enterEventShiftKey, done);
        });

        it("element can be focused", () => {
            visualBuilder.updateFlushAllD3Transitions(dataView);

            const rects = Array.from(visualBuilder.rects!);
            const firstRect = rects[0];

            rects.forEach((rect) => {
                expect(rect.matches(":focus-visible")).toBeFalse();
            });

            firstRect.focus();
            expect(firstRect.matches(':focus-visible')).toBeTrue();

            const otherRects = rects.slice(1);
            otherRects.forEach((rect) => {
                expect(rect.matches(":focus-visible")).toBeFalse();
            });

        });

        function checkKeyboardSingleSelection(keyboardSingleSelectionEvent: KeyboardEvent, done: DoneFn): void {
            visualBuilder.updateFlushAllD3Transitions(dataView);
            let rects = Array.from(visualBuilder.rects!);
            const firstRect = rects[0];
            const secondRect = rects[1];

            firstRect.dispatchEvent(keyboardSingleSelectionEvent);
            renderTimeout(() => {
                expect(firstRect.getAttribute("aria-selected")).toBe("true");
                const otherRects = rects.slice(1);
                otherRects.forEach((rect) => {
                    expect(rect.getAttribute("aria-selected")).toBe("false");
                });

                secondRect.dispatchEvent(keyboardSingleSelectionEvent);
                renderTimeout(() => {
                    expect(secondRect.getAttribute("aria-selected")).toBe("true");
                    
                    rects.splice(1, 1);
                    rects.forEach((rect) => {
                        expect(rect.getAttribute("aria-selected")).toBe("false");
                    });
                    done();
                });
            });
        }

        function checkKeyboardMultiSelection(keyboardMultiselectionEvent: KeyboardEvent, done: DoneFn): void {
            visualBuilder.updateFlushAllD3Transitions(dataView);
            const enterEvent = new KeyboardEvent("keydown", { code: "Enter", bubbles: true });
            const rects = Array.from(visualBuilder.rects!);
            const firstRect = rects[0];
            const secondRect = rects[1];

            // select first column
            firstRect.dispatchEvent(enterEvent);
            // multiselect second column
            secondRect.dispatchEvent(keyboardMultiselectionEvent);
            renderTimeout(() => {
                expect(firstRect.getAttribute("aria-selected")).toBe("true");
                expect(secondRect.getAttribute("aria-selected")).toBe("true");
                expect(visualBuilder.selectedRects?.length).toBe(2);
                done();
            });
        }
    });
});
