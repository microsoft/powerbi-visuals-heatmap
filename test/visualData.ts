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

import {
    getRandomNumbers,
    testDataViewBuilder
} from "powerbi-visuals-utils-testutils";
import {
    valueType
} from "powerbi-visuals-utils-typeutils";
import * as _ from "lodash-es";

import TestDataViewBuilder = testDataViewBuilder.TestDataViewBuilder;
import ValueType = valueType.ValueType;

export class TableHeatMapData extends TestDataViewBuilder {
    public static CategoryColumn: string = "Category";
    public static MeasureColumn: string = "Y";

    public dataCategory: string[];
    public dataMeasure: number[];

    public constructor() {
        super();
        this.dataCategory = _.range(0, 15).map(d => d + "");
        this.dataMeasure = _.range(0, this.dataCategory.length).map(d => _.random(0, 100));
    }

    public getDataView(columnNames?: string[]): DataView {
        return this.createCategoricalDataViewBuilder(
            [
                {
                    source: {
                        displayName: TableHeatMapData.CategoryColumn,
                        roles: {
                            Values: true,
                            Y: true
                        },
                        type: ValueType.fromDescriptor({text: true})
                    },
                    values: this.dataCategory
                }
            ],
            [
                {
                    source: {
                        displayName: TableHeatMapData.CategoryColumn,
                        roles: {
                            Values: true,
                            Y: true
                        },
                        type: ValueType.fromDescriptor({text: true})
                    },
                    values: this.dataCategory
                },
                {
                    source: {
                        displayName: TableHeatMapData.MeasureColumn,
                        isMeasure: true,
                        roles: {
                            value: true
                        },
                        type: ValueType.fromDescriptor({numeric: true})
                    },
                    values: this.dataMeasure
                }
            ], columnNames).build();
    }

    public getDataViewWithOneCategory(columnNames?: string[]): DataView {
        return this.createCategoricalDataViewBuilder(
            [
                {
                    source: {
                        displayName: TableHeatMapData.CategoryColumn,
                        roles: {
                            Values: true,
                            Y: true
                        },
                        type: ValueType.fromDescriptor({text: true})
                    },
                    values: [this.dataCategory[0]]
                }
            ],
            [
                {
                    source: {
                        displayName: TableHeatMapData.CategoryColumn,
                        roles: {
                            Values: true,
                            Y: true
                        },
                        type: ValueType.fromDescriptor({text: true})
                    },
                    values: this.dataCategory
                },
                {
                    source: {
                        displayName: TableHeatMapData.MeasureColumn,
                        isMeasure: true,
                        roles: {
                            value: true
                        },
                        type: ValueType.fromDescriptor({numeric: true})
                    },
                    values: this.dataMeasure
                }
            ], columnNames).build();
    }

    public getDataViewWithNullAndZero(columnNames?: string[]): DataView {
        return this.createCategoricalDataViewBuilder(
            [
                {
                    source: {
                        displayName: TableHeatMapData.CategoryColumn,
                        roles: {
                            Values: true,
                            Y: true
                        },
                        type: ValueType.fromDescriptor({text: true})
                    },
                    values: [this.dataCategory[0]]
                }
            ],
            [
                {
                    source: {
                        displayName: TableHeatMapData.CategoryColumn,
                        roles: {
                            Values: true,
                            Y: true
                        },
                        type: ValueType.fromDescriptor({text: true})
                    },
                    values: [this.dataCategory[0]]
                },
                {
                    source: {
                        displayName: TableHeatMapData.MeasureColumn,
                        isMeasure: true,
                        roles: {
                            value: true
                        },
                        type: ValueType.fromDescriptor({numeric: true})
                    },
                    values: [0, null, 10]
                }
            ], columnNames).build();
    }
}