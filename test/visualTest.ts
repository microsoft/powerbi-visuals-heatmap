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
import { ClickEventType, createColorPalette, d3Click, parseColorString, renderTimeout } from "powerbi-visuals-utils-testutils";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import { TableHeatMapChartData } from "../src/dataInterfaces";
import { colorbrewer, GeneralSettings, SettingsModel } from "../src/settings";
import {
    getOpacity, DIMMED_OPACITY, DEFAULT_OPACITY, DIMMED_COLOR,
    isDataViewValid, textLimit,
    calculateGridSizeHeight, calculateGridSizeWidth,
    ConstGridMinHeight, CellMaxHeightLimit, ConstGridMinWidth, CellMaxWidthFactorLimit,
    getYAxisWidth, getXAxisHeight, getYAxisHeight,
    parseSettings,
    getAdaptiveLabelColor
} from "../src/heatmapUtils";

const DefaultTimeout: number = 300;
const AnimationTimeout: number = 1200;

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

const getCellFills = (): string[] =>
    Array.from(document.querySelectorAll("rect.categoryX"))
        .map((el: Element) => getComputedStyle(el)["fill"]);

const colorKey = (color: string): string => {
    const { R, G, B } = parseColorString(color);
    return `${R},${G},${B}`;
};

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

        it("renders under short viewport", (done) => {
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

        it("renders with colorbrewer objects", (done) => {
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
            expect(document.querySelectorAll(".heatMapDataLabels").length).toBeGreaterThan(0);
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
        it("must resize to 20px", (done) => {
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
                
                expect(labelDOMItems.length).toBeGreaterThan(0);
                expect(filteredItem).toBeTruthy();

                done();
            }, DefaultTimeout);
        });

        it("must resize to 40px", (done) => {
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
                
                expect(labelDOMItems.length).toBeGreaterThan(0);
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
                
                expect(labelDOMItems.length).toBeGreaterThan(0);
                expect(filteredItem).toBeTruthy();

                done();
            }, DefaultTimeout);
        });
    });

    describe("y axis label font", () => {
        it("must resize to 12px", (done) => {
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
                
                expect(labelDOMItems.length).toBeGreaterThan(0);
                expect(filteredItems).toBeTruthy();

                done();
            }, DefaultTimeout);
        });

        it("must resize to 40px", (done) => {
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
                
                expect(labelDOMItems.length).toBeGreaterThan(0);
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
                
                expect(labelDOMItems.length).toBeGreaterThan(0);
                expect(filteredItems).toBeTruthy();

                done();
            }, DefaultTimeout);
        });
    });

    describe("data label font", () => {
        it("must resize to 24px", (done) => {
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

                expect(labelDOMItems.length).toBeGreaterThan(0);
                expect(filteredItem).toBeTruthy();

                done();
            }, DefaultTimeout);
        });

        it("must resize to 40px", (done) => {
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

                expect(labelDOMItems.length).toBeGreaterThan(0);
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

                expect(labelDOMItems.length).toBeGreaterThan(0);
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
                        expect(isColorAppliedToElements(rects, backgroundColor, "fill")).toBeTrue();
                        done();
                    }, DefaultTimeout);
                });

                it("should use foreground theme color as stroke", (done) => {
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        const rects = Array.from(visualBuilder.rects!);
                        expect(isColorAppliedToElements(rects, foregroundColor, "stroke")).toBeTrue();
                        done();
                    }, DefaultTimeout);
                });

                it("recomputes bucket constraints for the post-parse mode (parseSettings runs before initBuckets)", (done) => {
                    // In high-contrast mode parseSettings forces enableColorbrewer and activateGradientMiddle off.
                    // Because parseSettings runs before initBuckets, the bucket constraints must reflect that final
                    // custom-gradient mode (min 1, max 18) rather than being stuck at the pre-parse colorbrewer limits.
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const general = (visualBuilder as any).visual.settingsModel.general;
                        expect(general.enableColorbrewer.value).toBeFalse();
                        expect(general.buckets.options.minValue.value).toBe(GeneralSettings.BucketCountMinLimit);
                        expect(general.buckets.options.maxValue.value).toBe(GeneralSettings.BucketCountMaxLimit);
                        done();
                    }, DefaultTimeout);
                });

            });
        });
    });
    describe("Selection tests", () => {
        beforeEach(() => {
            dataView = defaultDataViewBuilder.getDataViewWithSeries();
        });

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
        beforeEach(() => {
            dataView = defaultDataViewBuilder.getDataViewWithSeries();
        });

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

    // Asserts that `invertedFills` is the result of palette inversion applied
    // to the same data: i.e. cells are re-colored in a consistent permutation,
    // and the permutation is non-trivial.
    // We do NOT require the set of colors to be equal, because data may not
    // hit every palette bucket — and the buckets used in normal vs inverted
    // are mirrored positions, which can be different subsets of the palette.
    const expectPaletteReversed = (normalFills: string[], invertedFills: string[]): void => {
        expect(invertedFills.length).toBe(normalFills.length);

        // Consistent permutation: cells that share the same color before inversion
        // must also share the same color after inversion. This is the defining
        // property of "the same value mapped through a re-ordered palette".
        const mapping = new Map<string, string>();
        normalFills.forEach((n, i) => {
            const nKey = colorKey(n);
            const iKey = colorKey(invertedFills[i]);
            const existing = mapping.get(nKey);
            if (existing === undefined) {
                mapping.set(nKey, iKey);
            } else {
                expect(iKey).toBe(existing);
            }
        });

        // Non-trivial: at least one cell must actually change color.
        const changedCount = normalFills.filter((fill, i) => !areColorsEqual(fill, invertedFills[i])).length;
        expect(changedCount).toBeGreaterThan(0);
    };

    describe("invertColorScale", () => {
        // The visual animates cell fills via a d3 transition of 1000ms
        // (see TableHeatMap.animationDuration). Tests must wait longer than that
        // to read final fills; flushAllD3Transitions does not help because the
        // visual and test-utils carry separate d3-timer instances.

        beforeEach(() => {
            dataView = defaultDataViewBuilder.getDataViewWithSeries();
        });

        // Renders the visual twice (invert off, then invert on) and runs the
        // assertion against the resulting fill arrays. Waits long enough for the
        // d3 fill animation to finish so reads pick up final colors.
        const renderAndCompare = (
            baseGeneral: Record<string, unknown>,
            assertion: (normal: string[], inverted: string[]) => void,
            done: DoneFn
        ): void => {
            dataView.metadata.objects = { general: { ...baseGeneral, invertColorScale: false } };
            visualBuilder.updateRenderTimeout(dataView, () => {
                const normalFills = getCellFills();

                dataView.metadata.objects = { general: { ...baseGeneral, invertColorScale: true } };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    assertion(normalFills, getCellFills());
                    done();
                }, AnimationTimeout);
            }, AnimationTimeout);
        };

        it("should reverse the colorbrewer palette as an involution", (done) => {
            renderAndCompare(
                { enableColorbrewer: true, colorbrewer: "Reds", buckets: 5 },
                expectPaletteReversed,
                done
            );
        });

        it("should reverse the custom gradient palette as an involution", (done) => {
            renderAndCompare(
                {
                    enableColorbrewer: false,
                    gradientStart: { solid: { color: "#0000FF" } },
                    gradientEnd: { solid: { color: "#FF0000" } }
                },
                expectPaletteReversed,
                done
            );
        });

        // Helper to read gradient pickers as they currently exist in the visual's settings
        // model (i.e. what the user would see in the formatting pane).
        const readGradientPickers = (): { start: string; end: string } => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const general = (visualBuilder as any).visual.settingsModel.general;
            return {
                start: general.gradientStart.value.value,
                end: general.gradientEnd.value.value
            };
        };

        it("should NOT mutate user gradient pickers when invert is toggled in custom gradient mode", (done) => {
            const userStart = "#0000FF";
            const userEnd = "#FF0000";
            const base = {
                enableColorbrewer: false,
                gradientStart: { solid: { color: userStart } },
                gradientEnd: { solid: { color: userEnd } }
            };

            dataView.metadata.objects = { general: { ...base, invertColorScale: false } };
            visualBuilder.updateRenderTimeout(dataView, () => {
                const initial = readGradientPickers();
                expect(areColorsEqual(initial.start, userStart)).toBeTrue();
                expect(areColorsEqual(initial.end, userEnd)).toBeTrue();

                dataView.metadata.objects = { general: { ...base, invertColorScale: true } };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    // Pickers must reflect the user's original choices, NOT the swapped colors.
                    const afterInvert = readGradientPickers();
                    expect(areColorsEqual(afterInvert.start, userStart)).toBeTrue();
                    expect(areColorsEqual(afterInvert.end, userEnd)).toBeTrue();
                    done();
                }, AnimationTimeout);
            }, AnimationTimeout);
        });
    });

    describe("activateGradientMiddle", () => {
        beforeEach(() => {
            dataView = defaultDataViewBuilder.getDataViewWithSeries();
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const readMiddlePicker = (): string => (visualBuilder as any).visual.settingsModel.general.gradientMiddle.value.value;

        it("middle picker retains a valid color when activateGradientMiddle is first enabled in custom gradient mode", (done) => {
            dataView.metadata.objects = {
                general: {
                    activateGradientMiddle: true,
                    enableColorbrewer: false,
                    gradientStart: { solid: { color: "#FF0000" } },
                    gradientEnd: { solid: { color: "#0000FF" } }
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(readMiddlePicker()).toBeTruthy();
                done();
            }, AnimationTimeout);
        });

        it("middle picker retains a valid color when activateGradientMiddle is first enabled in colorbrewer mode", (done) => {
            dataView.metadata.objects = {
                general: {
                    activateGradientMiddle: true,
                    enableColorbrewer: true,
                    colorbrewer: "Reds",
                    buckets: 5
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(readMiddlePicker()).toBeTruthy();
                done();
            }, AnimationTimeout);
        });

        it("3-point palette inverts consistently when invertColorScale is on", (done) => {
            const base = {
                activateGradientMiddle: true,
                enableColorbrewer: false,
                gradientStart: { solid: { color: "#FF0000" } },
                gradientMiddle: { solid: { color: "#00FF00" } },
                gradientEnd: { solid: { color: "#0000FF" } },
            };

            dataView.metadata.objects = { general: { ...base, invertColorScale: false } };
            visualBuilder.updateRenderTimeout(dataView, () => {
                const normalFills = getCellFills();

                dataView.metadata.objects = { general: { ...base, invertColorScale: true } };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expectPaletteReversed(normalFills, getCellFills());
                    done();
                }, AnimationTimeout);
            }, AnimationTimeout);
        });

        it("deactivating gradient middle changes cell fills", (done) => {
            const base = {
                enableColorbrewer: false,
                gradientStart: { solid: { color: "#FF0000" } },
                gradientMiddle: { solid: { color: "#00FF00" } },
                gradientEnd: { solid: { color: "#0000FF" } },
            };

            dataView.metadata.objects = { general: { ...base, activateGradientMiddle: true } };
            visualBuilder.updateRenderTimeout(dataView, () => {
                const withMiddleFills = getCellFills();

                dataView.metadata.objects = { general: { ...base, activateGradientMiddle: false } };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const withoutMiddleFills = getCellFills();
                    const changedCount = withMiddleFills.filter((fill, i) => !areColorsEqual(fill, withoutMiddleFills[i])).length;
                    expect(changedCount).toBeGreaterThan(0);
                    done();
                }, AnimationTimeout);
            }, AnimationTimeout);
        });

        it("middle picker does NOT mutate when invertColorScale is toggled", (done) => {
            const base = {
                activateGradientMiddle: true,
                enableColorbrewer: false,
                gradientStart: { solid: { color: "#FF0000" } },
                gradientMiddle: { solid: { color: "#00FF00" } },
                gradientEnd: { solid: { color: "#0000FF" } },
            };

            dataView.metadata.objects = { general: { ...base, invertColorScale: false } };
            visualBuilder.updateRenderTimeout(dataView, () => {
                const beforeInvert = readMiddlePicker();

                dataView.metadata.objects = { general: { ...base, invertColorScale: true } };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(areColorsEqual(readMiddlePicker(), beforeInvert)).toBeTrue();
                    done();
                }, AnimationTimeout);
            }, AnimationTimeout);
        });

    });

    describe("colorbrewer vs custom gradient", () => {
        beforeEach(() => {
            dataView = defaultDataViewBuilder.getDataViewWithSeries();
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getCellFills = (): string[] =>
            Array.from(visualBuilder.rects!).map((r) => getComputedStyle(r).fill);

        it("does not call persistProperties (no persist-based syncing)", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const spy = spyOn((visualBuilder as any).visualHost, "persistProperties");
            dataView.metadata.objects = { general: { enableColorbrewer: true, colorbrewer: "Reds", buckets: 5 } };
            visualBuilder.update(dataView);
            dataView.metadata.objects = { general: { enableColorbrewer: true, colorbrewer: "Blues", buckets: 5 } };
            visualBuilder.update(dataView);
            expect(spy).not.toHaveBeenCalled();
        });

        it("disables the custom gradient group when colorbrewer is enabled", (done) => {
            dataView.metadata.objects = { general: { enableColorbrewer: true, colorbrewer: "Reds", buckets: 5 } };
            visualBuilder.updateRenderTimeout(dataView, () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const model = (visualBuilder as any).visual.getFormattingModel();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const general = model.cards.find((c: any) => c.uid === "general-card");
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const gradientGroup = general.groups.find((g: any) => g.uid === "gradientGroup-group");
                expect(gradientGroup.disabled).toBeTrue();
                done();
            }, AnimationTimeout);
        });

        it("enables the custom gradient group when colorbrewer is disabled", (done) => {
            dataView.metadata.objects = { general: { enableColorbrewer: false } };
            visualBuilder.updateRenderTimeout(dataView, () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const model = (visualBuilder as any).visual.getFormattingModel();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const general = model.cards.find((c: any) => c.uid === "general-card");
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const gradientGroup = general.groups.find((g: any) => g.uid === "gradientGroup-group");
                expect(gradientGroup.disabled).toBeFalse();
                done();
            }, AnimationTimeout);
        });

        it("ignores the gradient middle and uses the colorbrewer palette when colorbrewer is enabled", (done) => {
            // Colorbrewer palette render.
            dataView.metadata.objects = { general: { enableColorbrewer: true, colorbrewer: "Reds", buckets: 5 } };
            visualBuilder.updateRenderTimeout(dataView, () => {
                const paletteFills = getCellFills();

                // Same palette, but with the (custom) gradient middle turned on and a contrasting
                // middle color: it must have NO effect because colorbrewer takes precedence.
                dataView.metadata.objects = {
                    general: {
                        enableColorbrewer: true,
                        colorbrewer: "Reds",
                        buckets: 5,
                        activateGradientMiddle: true,
                        gradientMiddle: { solid: { color: "#00FF00" } },
                    },
                };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const withMiddleFills = getCellFills();
                    withMiddleFills.forEach((fill, i) => {
                        expect(areColorsEqual(fill, paletteFills[i])).toBeTrue();
                    });
                    done();
                }, AnimationTimeout);
            }, AnimationTimeout);
        });

        it("uses the custom three-stop gradient when colorbrewer is disabled and middle is active", (done) => {
            const base = {
                enableColorbrewer: false,
                gradientStart: { solid: { color: "#FF0000" } },
                gradientMiddle: { solid: { color: "#00FF00" } },
                gradientEnd: { solid: { color: "#0000FF" } },
            };

            // Two-stop render (middle off).
            dataView.metadata.objects = { general: { ...base, activateGradientMiddle: false } };
            visualBuilder.updateRenderTimeout(dataView, () => {
                const twoStopFills = getCellFills();

                // Three-stop render (middle on) must differ — the middle color reshapes the scale.
                dataView.metadata.objects = { general: { ...base, activateGradientMiddle: true } };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const threeStopFills = getCellFills();
                    const changed = threeStopFills.filter((fill, i) => !areColorsEqual(fill, twoStopFills[i])).length;
                    expect(changed).toBeGreaterThan(0);
                    done();
                }, AnimationTimeout);
            }, AnimationTimeout);
        });
    });

    describe("utils:getOpacity", () => {
        it("returns DefaultOpacity when no selection or highlights are active", () => {
            expect(getOpacity(false, false, false, false)).toBe(DEFAULT_OPACITY);
        });

        it("returns DefaultOpacity for a selected element when selection is active", () => {
            expect(getOpacity(true, false, true, false)).toBe(DEFAULT_OPACITY);
        });

        it("returns DimmedOpacity for an unselected element when selection is active", () => {
            expect(getOpacity(false, false, true, false)).toBe(DIMMED_OPACITY);
        });

        it("returns DefaultOpacity for a highlighted element when partial highlights are active", () => {
            expect(getOpacity(false, true, false, true)).toBe(DEFAULT_OPACITY);
        });

        it("returns DimmedOpacity for a non-highlighted element when partial highlights are active", () => {
            expect(getOpacity(false, false, false, true)).toBe(DIMMED_OPACITY);
        });
    });

    describe("utils:heatmapUtils", () => {
        describe("isDataViewValid", () => {
            it("returns true when dataView has categorical categories and values", () => {
                expect(isDataViewValid(defaultDataViewBuilder.getDataView())).toBeTrue();
            });

            it("returns false when categorical is absent", () => {
                expect(isDataViewValid({} as powerbi.DataView)).toBeFalse();
            });

            it("returns false when categorical.categories is missing", () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(isDataViewValid({ categorical: { values: [] } } as any)).toBeFalse();
            });

            it("returns false when categorical.values is missing", () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(isDataViewValid({ categorical: { categories: [] } } as any)).toBeFalse();
            });
        });

        describe("textLimit", () => {
            it("returns the original text when within the limit", () => {
                expect(textLimit("hello", 10)).toBe("hello");
            });

            it("truncates and appends ellipsis when over the limit", () => {
                const result = textLimit("hello world", 5);
                expect(result.endsWith("\u2026")).toBeTrue();
                expect(result.length).toBe(6);
            });

            it("returns empty string unchanged", () => {
                expect(textLimit("", 5)).toBe("");
            });
        });

        describe("calculateGridSizeHeight", () => {
            it("clamps to ConstGridMinHeight when computed value is too small", () => {
                expect(calculateGridSizeHeight(1, 500, 10, 10, 10)).toBe(ConstGridMinHeight);
            });

            it("clamps to CellMaxHeightLimit when computed value is very large", () => {
                expect(calculateGridSizeHeight(100000, 0, 1, 0, 0)).toBe(CellMaxHeightLimit);
            });

            it("returns computed floor value for normal inputs", () => {
                // floor((400 - 10 - 30 - 10 - 5) / (8 + 2)) = floor(34.5) = 34
                expect(calculateGridSizeHeight(400, 30, 8, 10, 10)).toBe(34);
            });
        });

        describe("calculateGridSizeWidth", () => {
            it("clamps to ConstGridMinWidth when computed value is too small", () => {
                expect(calculateGridSizeWidth(1, 1000, 10, 10)).toBe(ConstGridMinWidth);
            });

            it("clamps to gridSizeHeight x CellMaxWidthFactorLimit when too wide", () => {
                expect(calculateGridSizeWidth(100000, 0, 1, 10)).toBe(10 * CellMaxWidthFactorLimit);
            });

            it("returns computed floor value for normal inputs", () => {
                // floor((500 - 50) / 10) = 45; clamp(1, 45, 30*15) = 45
                expect(calculateGridSizeWidth(500, 50, 10, 30)).toBe(45);
            });
        });

        describe("getYAxisWidth", () => {
            it("returns 0 when yAxisLabels show is false", () => {
                const settings = new SettingsModel();
                settings.yAxisLabels.show.value = false;
                const chartData = { categoryY: ["label"], categoryX: [] } as unknown as TableHeatMapChartData;
                expect(getYAxisWidth(chartData, settings.yAxisLabels)).toBe(0);
            });

            it("returns a positive number when yAxisLabels show is true", () => {
                const settings = new SettingsModel();
                const chartData = { categoryY: ["LongLabel"], categoryX: [] } as unknown as TableHeatMapChartData;
                expect(getYAxisWidth(chartData, settings.yAxisLabels)).toBeGreaterThan(0);
            });
        });

        describe("getXAxisHeight", () => {
            it("returns 0 when xAxisLabels show is false", () => {
                const settings = new SettingsModel();
                settings.xAxisLabels.show.value = false;
                const chartData = { categoryX: ["label"], categoryY: [] } as unknown as TableHeatMapChartData;
                expect(getXAxisHeight(chartData, settings.xAxisLabels)).toBe(0);
            });

            it("returns measured height when xAxisLabels show is true", () => {
                const settings = new SettingsModel();
                const chartData = { categoryX: ["LongLabel"], categoryY: [] } as unknown as TableHeatMapChartData;
                spyOn(tms, "measureSvgTextHeight").and.returnValue(42);
                expect(getXAxisHeight(chartData, settings.xAxisLabels)).toBe(42);
            });
        });

        describe("getYAxisHeight", () => {
            it("returns measured height for non-empty categoryY", () => {
                const settings = new SettingsModel();
                const chartData = { categoryY: ["LongLabel"], categoryX: [] } as unknown as TableHeatMapChartData;
                spyOn(tms, "measureSvgTextHeight").and.returnValue(24);
                expect(getYAxisHeight(chartData, settings.yAxisLabels)).toBe(24);
            });
        });

        describe("parseSettings", () => {
            it("applies high contrast colors and disables colorbrewer", () => {
                const palette = createColorPalette();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (palette as any).isHighContrast = true;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (palette as any).background = { value: "#000000" };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (palette as any).foreground = { value: "#ffff00" };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const colorHelper = new ColorHelper(palette as any);
                const model = new SettingsModel();
                parseSettings(colorHelper, model);

                expect(model.general.enableColorbrewer.value).toBeFalse();
                expect(areColorsEqual(model.general.gradientStart.value.value, "#000000")).toBeTrue();
                expect(areColorsEqual(model.general.gradientEnd.value.value, "#000000")).toBeTrue();
                expect(areColorsEqual(model.labels.fill.value.value, "#ffff00")).toBeTrue();
            });

            it("leaves settings unchanged when not in high contrast mode", () => {
                const palette = createColorPalette();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (palette as any).isHighContrast = false;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const colorHelper = new ColorHelper(palette as any);
                const model = new SettingsModel();
                const defaultStart = model.general.gradientStart.value.value;
                parseSettings(colorHelper, model);

                expect(model.general.gradientStart.value.value).toBe(defaultStart);
            });
        });

        describe("DimmedColor", () => {
            it("is 'black'", () => {
                expect(DIMMED_COLOR).toBe("black");
            });
        });
    });

    describe("Data labels auto-contrast", () => {
        describe("utils:getAdaptiveLabelColor", () => {
            it("returns a darker color for a light background", () => {
                const result = getAdaptiveLabelColor("#ff0000", "#ffffff");
                const { R, G, B } = parseColorString(result);
                // Lab lightness of #ffffff ≈ 100 > 60 → clamp HSL l to 0.2 → dark label
                expect(R + G + B).toBeLessThan(3 * 128);
            });

            it("returns a lighter color for a dark background", () => {
                const result = getAdaptiveLabelColor("#ff0000", "#000000");
                const { R, G, B } = parseColorString(result);
                // Lab lightness of #000000 ≈ 0 ≤ 60 → clamp HSL l to 0.85 → light label
                expect(R + G + B).toBeGreaterThan(3 * 128);
            });

            it("preserves the red hue of the user-picked color on a light background", () => {
                const { R, G, B } = parseColorString(getAdaptiveLabelColor("#ff0000", "#ffffff"));
                expect(R).toBeGreaterThan(G);
                expect(R).toBeGreaterThan(B);
            });

            it("preserves the red hue of the user-picked color on a dark background", () => {
                const { R, G, B } = parseColorString(getAdaptiveLabelColor("#ff0000", "#000000"));
                expect(R).toBeGreaterThan(G);
                expect(R).toBeGreaterThan(B);
            });

            it("returns the userColor unchanged when backgroundColor is invalid", () => {
                expect(getAdaptiveLabelColor("#ff0000", "not-a-color")).toBe("#ff0000");
            });

            it("returns the userColor unchanged when userColor is invalid", () => {
                expect(getAdaptiveLabelColor("not-a-color", "#ffffff")).toBe("not-a-color");
            });

            it("preserves user-specified alpha/opacity in the output color", () => {
                // Semi-transparent red on a light background — lightness is clamped but alpha must survive.
                const result = getAdaptiveLabelColor("rgba(136, 0, 0, 0.5)", "#ffffff");
                // formatRgb() emits rgba(r, g, b, a) when opacity < 1
                expect(result).toMatch(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\.5\s*\)/);
            });
        });

        describe("toggle: autoContrast OFF", () => {
            it("all labels use the exact user-picked fill color", (done) => {
                const userColor = "#ff6600";
                dataView.metadata.objects = {
                    labels: {
                        show: true,
                        fill: { solid: { color: userColor } },
                        autoContrast: false
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const labels = Array.from(document.querySelectorAll(".heatMapDataLabels"));
                    expect(labels.length).toBeGreaterThan(0);
                    const allMatch = labels.every(el =>
                        areColorsEqual(getComputedStyle(el)["fill"], userColor)
                    );
                    expect(allMatch).toBeTrue();
                    done();
                }, DefaultTimeout);
            });
        });

        describe("toggle: autoContrast OFF → ON", () => {
            it("at least one label fill differs from the static user-picked color", (done) => {
                const userColor = "#888888";
                dataView.metadata.objects = {
                    labels: { show: true, fill: { solid: { color: userColor } }, autoContrast: false }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const staticFills = Array.from(document.querySelectorAll(".heatMapDataLabels"))
                        .map(el => getComputedStyle(el)["fill"]);

                    dataView.metadata.objects = {
                        labels: { show: true, fill: { solid: { color: userColor } }, autoContrast: true }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        const adaptedFills = Array.from(document.querySelectorAll(".heatMapDataLabels"))
                            .map(el => getComputedStyle(el)["fill"]);
                        const staticSet = new Set(staticFills.map(colorKey));
                        const newColors = adaptedFills.map(colorKey).filter(k => !staticSet.has(k));
                        expect(newColors.length).toBeGreaterThan(0);
                        done();
                    }, DefaultTimeout);
                }, DefaultTimeout);
            });

            it("no label has an empty or transparent fill", (done) => {
                dataView.metadata.objects = {
                    labels: { show: true, autoContrast: true }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const labels = Array.from(document.querySelectorAll(".heatMapDataLabels"));
                    expect(labels.length).toBeGreaterThan(0);
                    const hasEmptyFill = labels.some(el => {
                        const fill = getComputedStyle(el)["fill"];
                        if (!fill || fill === "none" || fill === "transparent") return true;
                        return /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/.test(fill);
                    });
                    expect(hasEmptyFill).toBeFalse();
                    done();
                }, DefaultTimeout);
            });

            it("toggling back OFF restores the user-picked fill color on all labels", (done) => {
                const userColor = "#3399ff";
                dataView.metadata.objects = {
                    labels: { show: true, fill: { solid: { color: userColor } }, autoContrast: true }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    dataView.metadata.objects = {
                        labels: { show: true, fill: { solid: { color: userColor } }, autoContrast: false }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        const labels = Array.from(document.querySelectorAll(".heatMapDataLabels"));
                        expect(labels.length).toBeGreaterThan(0);
                        const allMatch = labels.every(el =>
                            areColorsEqual(getComputedStyle(el)["fill"], userColor)
                        );
                        expect(allMatch).toBeTrue();
                        done();
                    }, DefaultTimeout);
                }, DefaultTimeout);
            });

            it("null-value cell label falls back to user color without an empty fill", (done) => {
                const userColor = "#ff0000";
                dataView.metadata.objects = {
                    general: { fillNullValuesCells: true },
                    labels: { show: true, fill: { solid: { color: userColor } }, autoContrast: true }
                };
                dataView.categorical!.values![0].values![0] = null;

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const labels = Array.from(document.querySelectorAll(".heatMapDataLabels"));
                    expect(labels.length).toBeGreaterThan(0);
                    const hasEmptyFill = labels.some(el => {
                        const fill = getComputedStyle(el)["fill"];
                        if (!fill || fill === "none" || fill === "transparent") return true;
                        return /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/.test(fill);
                    });
                    expect(hasEmptyFill).toBeFalse();
                    done();
                }, DefaultTimeout);
            });
        });
    });
});

