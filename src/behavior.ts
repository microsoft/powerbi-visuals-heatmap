import { BaseType, Selection } from "d3-selection";
import { interactivitySelectionService, interactivityBaseService } from "powerbi-visuals-utils-interactivityutils";
import { SelectableDataPoint } from "powerbi-visuals-utils-interactivityutils/lib/interactivitySelectionService";
import { IInteractiveBehavior, IBehaviorOptions, ISelectionHandler } from "powerbi-visuals-utils-interactivityutils/lib/interactivityBaseService";
import IInteractivityService = interactivityBaseService.IInteractivityService;
import {HierarchyRectangularNode} from "d3-hierarchy";
import { TableHeatMapDataPoint } from "./dataInterfaces";
const DimmedOpacity: number = 0.2;
const DefaultOpacity: number = 1.0;
const EnterCode = "Enter";
const SpaceCode = "Space";

function getFillOpacity(
    selected: boolean,
    highlight: boolean,
    hasSelection: boolean,
    hasPartialHighlights: boolean
): number {
    if ((hasPartialHighlights && !highlight) || (hasSelection && !selected)) {
        return DimmedOpacity;
    }

    return DefaultOpacity;
}

export interface HeatmapBehaviorOptions extends IBehaviorOptions<SelectableDataPoint> {
    dataPoints: SelectableDataPoint[];
    interactivityService: IInteractivityService<any>;
    behavior: IInteractiveBehavior;
    selection: Selection<BaseType, HierarchyRectangularNode<TableHeatMapDataPoint>, BaseType, TableHeatMapDataPoint>;
    clearCatcher: Selection<BaseType, any, BaseType, any>;
}

export class HeatMapBehavior implements IInteractiveBehavior {
    private options: HeatmapBehaviorOptions;

    private select(d:HierarchyRectangularNode<TableHeatMapDataPoint>, selectionHandler: ISelectionHandler, event: MouseEvent | KeyboardEvent) {
        
        d.selected = !d.selected;
        this.renderSelection(true)
        selectionHandler.handleSelection(d.data, event.ctrlKey);
        
        event.stopPropagation();
    }

    private clear(selectionHandler: ISelectionHandler) {
        selectionHandler.handleClearSelection();
        
        
    }

    public bindEvents(
        options: HeatmapBehaviorOptions,
        selectionHandler: ISelectionHandler
    ): void {
        this.options = options;

        const {
            selection,
            clearCatcher
            
        } = options;
        
        selection.on("click", (event:MouseEvent, d:HierarchyRectangularNode<TableHeatMapDataPoint>) => {
            this.select(d, selectionHandler, event);
        });
        /*selection.on("keydown", (event:KeyboardEvent, d: HierarchyRectangularNode<TableHeatMapDataPoint>) => {
            if (event.code !== EnterCode && event.code !== SpaceCode) {
                return;
            }
            this.select(d, selectionHandler, onSelect, event);
        });
        */
        clearCatcher.on("click", () => this.clear(selectionHandler));
        /*clearCatcher.on("keydown", (e:KeyboardEvent) => {
            if (e.code !== EnterCode && e.code !== SpaceCode) {
                return;
            }
            this.clear(selectionHandler, onSelect);
        });
        */
    }

    public renderSelection(hasSelection: boolean): void {
        const {
            selection,
            interactivityService,
        } = this.options;

        const hasHighlights: boolean = interactivityService.hasSelection();

        selection.style("opacity", (dataPoint: HierarchyRectangularNode<TableHeatMapDataPoint>) => {
            
            return getFillOpacity(
                dataPoint.selected,
                hasHighlights,
                !hasHighlights && hasSelection,
                !dataPoint.selected && hasHighlights
            );
        });
        
        selection.attr("aria-selected", (dataPoint: HierarchyRectangularNode<TableHeatMapDataPoint>) => {
            
            return dataPoint.selected;
        });
    }
}