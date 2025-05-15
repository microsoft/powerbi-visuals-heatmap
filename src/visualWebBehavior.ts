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

// d3
import {
    select as d3Select,
    Selection as ID3Selection 
} from "d3-selection";
type Selection<T> = ID3Selection<any, T, any, any>;

import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import ISelectableDataPoint = legendInterfaces.ISelectableDataPoint;

import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;

import {TableHeatMapDataPoint} from "./dataInterfaces";
import { getOpacity, getStroke } from "./heatmapUtils";

export interface VisualBehaviorOptions {
    selection: Selection<TableHeatMapDataPoint>;
    clearCatcher: Selection<any>;
}

export class VisualWebBehavior {
    private selection: Selection<TableHeatMapDataPoint>;
    private dataPoints: TableHeatMapDataPoint[];
    private clearCatcher: Selection<any>;
    private selectionManager: ISelectionManager;

    constructor(selectionManager: ISelectionManager) {
        this.selectionManager = selectionManager;
    }

    public bindEvents(options: VisualBehaviorOptions): void {
        this.selection = options.selection;
        this.clearCatcher = options.clearCatcher;
        this.dataPoints = options.selection.data();
        
        this.addEventListeners();

        this.applySelectionStateToData();
    }

    public addEventListeners(): void {
        this.bindClickEvent(this.selection);
        this.bindClickEvent(this.clearCatcher);

        this.bindContextMenuEvent(this.selection);
        this.bindContextMenuEvent(this.clearCatcher);

        this.bindKeyboardEvent(this.selection);
    }

    public renderSelection(): void {
        const dataPointHasSelection: boolean = this.dataPoints.some((dataPoint: TableHeatMapDataPoint) => dataPoint.selected);

        // eslint-disable-next-line
        const self: this = this;
        
        self.selection.each(function (barDataPoint: TableHeatMapDataPoint) {
            const isSelected: boolean = barDataPoint.selected;

            d3Select(this)
                .attr("aria-selected", isSelected && dataPointHasSelection)
                .style("fill-opacity", getOpacity(isSelected, false, dataPointHasSelection, false))
                .style("stroke-opacity", getOpacity(isSelected, false, dataPointHasSelection, false))
                .style("stroke", getStroke(isSelected, dataPointHasSelection));
        });
    }

    private onSelectCallback(selectionIds?: ISelectionId[]){
        this.applySelectionStateToData(selectionIds);
        this.renderSelection();
    }

    private applySelectionStateToData(selectionIds?: ISelectionId[]): void{
        const selectedIds: ISelectionId[] = <ISelectionId[]>this.selectionManager.getSelectionIds();
        this.setSelectedToDataPoints(this.dataPoints, selectionIds || selectedIds);
    }

    private setSelectedToDataPoints(dataPoints: ISelectableDataPoint[], ids: ISelectionId[]): void{
        dataPoints.forEach((dataPoint: ISelectableDataPoint) => {
            dataPoint.selected = false;
            ids.forEach((selectedId: ISelectionId) => {
                if (selectedId.equals(<ISelectionId>dataPoint.identity)) {
                    dataPoint.selected = true;
                }
            });
        });
    }

    private bindContextMenuEvent(elements: Selection<any>): void {
        elements.on("contextmenu", (event: PointerEvent, dataPoint: ISelectableDataPoint | undefined) => {
            this.selectionManager.showContextMenu(dataPoint ? dataPoint.identity : {},
                {
                    x: event.clientX,
                    y: event.clientY
                }
            );
            event.preventDefault();
            event.stopPropagation();
        });
    }

    private bindClickEvent(elements: Selection<any>): void {
        elements.on("click", (event: PointerEvent, dataPoint: ISelectableDataPoint | undefined) => {
            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;
            if (dataPoint){
                this.selectionManager.select(dataPoint.identity, isMultiSelection);
                event.stopPropagation();
            }
            else {
                this.selectionManager.clear();
            }
            this.onSelectCallback();
        })
    }

    private bindKeyboardEvent(elements: Selection<any>): void {
        elements.on("keydown", (event : KeyboardEvent, dataPoint: ISelectableDataPoint) => {
            if (event.code !== "Enter" && event.code !== "Space") {
                return;
            }

            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;
            this.selectionManager.select(dataPoint.identity, isMultiSelection);

            event.stopPropagation();
            this.onSelectCallback();
        });
    }
}