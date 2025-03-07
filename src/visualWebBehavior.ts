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

import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;

import {TableHeatMapDataPoint} from "./dataInterfaces";

export interface VisualBehaviorOptions {
    selection: Selection<TableHeatMapDataPoint>;
    clearCatcher: Selection<any>;
}

export class VisualWebBehavior {
    private selection: Selection<TableHeatMapDataPoint>;
    private clearCatcher: Selection<any>;
    private selectionManager: ISelectionManager;

    constructor(selectionManager: ISelectionManager) {
        this.selectionManager = selectionManager;
    }

    public bindEvents(options: VisualBehaviorOptions): void {
        this.selection = options.selection;
        this.clearCatcher = options.clearCatcher;
        
        this.addEventListeners();

        this.renderSelection(
            this.selection,
            <ISelectionId[]>this.selectionManager.getSelectionIds()
        );
    }

    public renderSelection(selection: Selection<TableHeatMapDataPoint>,
            selectionIds: powerbi.visuals.ISelectionId[]): void {
        if (!selection || !selectionIds) {
            return;
        }
        // eslint-disable-next-line
        const self: this = this;
        
        selection.each(function (barDataPoint: TableHeatMapDataPoint) {
            let opacity: number = 1;
            let isSelected: boolean = false;
            if (selectionIds.length) {
                isSelected = self.isSelectionIdInArray(selectionIds, barDataPoint.selectionId);
                opacity = isSelected ? 1 : 0.4;
            }

            d3Select(this)
                .classed("selected", isSelected)
                .attr("aria-selected", isSelected)
                .style("fill-opacity", opacity)
                .style("stroke-opacity", opacity);
        });
    }

    private isSelectionIdInArray(selectionIds: ISelectionId[], selectionId: ISelectionId): boolean {
        if (!selectionIds || !selectionId) {
            return false;
        }

        return selectionIds.some((currentSelectionId: ISelectionId) => {
            return currentSelectionId.equals(selectionId);
        });
    }

    public addEventListeners(): void {
        this.bindClickEvent(this.selection);
        this.bindClickEvent(this.clearCatcher);

        this.bindContextMenuEvent(this.selection);
        this.bindContextMenuEvent(this.clearCatcher);

        this.bindKeyboardEvent(this.selection);
    }

    private bindContextMenuEvent(elements: Selection<any>): void {
        elements.on("contextmenu", (event: PointerEvent, dataPoint: TableHeatMapDataPoint | undefined) => {
            this.selectionManager.showContextMenu(dataPoint ? dataPoint.selectionId : {},
                {
                    x: event.clientX,
                    y: event.clientY
                }
            );
            event.preventDefault();
            event.stopPropagation();
        })
    }

    private bindClickEvent(elements: Selection<any>): void {
        elements.on("click", (event: PointerEvent, dataPoint: TableHeatMapDataPoint | undefined) => {
            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;
            if (dataPoint){
                this.selectionManager.select(dataPoint.selectionId, isMultiSelection)
                .then((ids: powerbi.visuals.ISelectionId[]) => {
                    this.renderSelection(this.selection, ids);
                });
                event.stopPropagation();
            }
            else {
                this.selectionManager.clear()
                .then(() => {
                    this.renderSelection(this.selection, []);
                });
            }
        });
    }

    private bindKeyboardEvent(elements: Selection<any>): void {
        elements.on("keydown", (event : KeyboardEvent, dataPoint: TableHeatMapDataPoint | undefined) => {
            if (event.code !== "Enter" && event.code !== "Space") {
                return;
            }

            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;
            this.selectionManager.select(dataPoint.selectionId, isMultiSelection)
            .then((ids: powerbi.visuals.ISelectionId[]) => {
                this.renderSelection(this.selection, ids);
            });

            event.stopPropagation();
        });
    }
}