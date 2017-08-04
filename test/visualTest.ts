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

/// <reference path="_references.ts"/>

module powerbi.extensibility.visual.test {

    import TableHeatMapBuilder = powerbi.extensibility.visual.test.TableHeatMapBuilder;
    import TableHeatMap = powerbi.extensibility.visual.TableHeatMap1443716069308;
    import TableHeatMapData = powerbi.extensibility.visual.test.TableHeatMapData;
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

        it("main DOM created", () => {
            visualBuilder.updateRenderTimeout(dataView, (done) => {
                expect($(visualBuilder.mainElement)).toBeInDOM();
                done();
            }, DefaultTimeout);
        });

        describe("short size", () => {
            beforeEach(() => {
                visualBuilder = new TableHeatMapBuilder(100, 100);
            });

            it("main DOM created", () => {
                visualBuilder.updateRenderTimeout(dataView, (done) => {
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

            it("main DOM created", () => {
                visualBuilder.updateRenderTimeout(dataView, (done) => {
                    expect($(visualBuilder.mainElement)).toBeInDOM();
                    done();
                }, DefaultTimeout);
            });
        });

        it("data labels created", () => {
            dataView.metadata.objects = {
                labels: {
                    show: true
                }
            };

            visualBuilder.updateRenderTimeout(dataView, (done) => {
                expect($(visualBuilder.mainElement.children(".heatMapDataLabels"))).toBeInDOM();
                done();
            }, DefaultTimeout);

            dataView.metadata.objects = {
                labels: {
                    show: false
                }
            };

            visualBuilder.updateRenderTimeout(dataView, (done) => {
                expect($(visualBuilder.mainElement.children(".heatMapDataLabels"))).not.toBeInDOM();
                done();
            }, DefaultTimeout);
        });
    });
}