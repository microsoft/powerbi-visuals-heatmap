import { BaseType, Selection } from "d3-selection";
import { interactivityBaseService, interactivitySelectionService } from "powerbi-visuals-utils-interactivityutils";
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import IBehaviorOptions = interactivityBaseService.IBehaviorOptions;
import ISelectionHandler = interactivityBaseService.ISelectionHandler;
import SelectableDataPoint = interactivitySelectionService.SelectableDataPoint;
import IInteractivityService = interactivityBaseService.IInteractivityService;
import { HierarchyRectangularNode } from "d3-hierarchy";
import { TableHeatMapDataPoint } from "./dataInterfaces";

const DimmedOpacity: number = 0.2;
const DefaultOpacity: number = 1.0;
const EnterCode = "Enter";
const SpaceCode = "Space";

export interface HeatmapBehaviorOptions extends IBehaviorOptions<SelectableDataPoint> {
    dataPoints: SelectableDataPoint[];
    interactivityService: IInteractivityService<any>;
    behavior: IInteractiveBehavior;
    selection: Selection<BaseType, HierarchyRectangularNode<TableHeatMapDataPoint>, BaseType, TableHeatMapDataPoint>;
    clearCatcher: Selection<BaseType, any, BaseType, any>;
}

export class HeatMapBehavior implements IInteractiveBehavior {
    private options: HeatmapBehaviorOptions;
    public static create(): IInteractiveBehavior {
        return new HeatMapBehavior();
    }

    private select(d: HierarchyRectangularNode<TableHeatMapDataPoint>, selectionHandler: ISelectionHandler, event: MouseEvent | KeyboardEvent) {
        selectionHandler.handleSelection(d, event.ctrlKey);
        this.renderSelection(d.selected)
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

        selection.on("click", (event: MouseEvent, d: HierarchyRectangularNode<TableHeatMapDataPoint>) => this.select(d, selectionHandler, event));

        selection.on("keypress", (event: KeyboardEvent, d: HierarchyRectangularNode<TableHeatMapDataPoint>) => {
            if (event.code === EnterCode || event.code === SpaceCode) {
                this.select(d, selectionHandler, event);
            }
        });

        clearCatcher.on("click", () => this.clear(selectionHandler));
        clearCatcher.on("keypress", (event: KeyboardEvent) => {
            if (event.code === EnterCode || event.code === SpaceCode) {
                this.clear(selectionHandler);
            }
        });
    }

    public renderSelection(hasSelection: boolean): void {
        const { selection } = this.options;

        selection.style("opacity", (dataPoint: HierarchyRectangularNode<TableHeatMapDataPoint>) => {
            switch (true) {
                case dataPoint.value === "":
                    return 0;
                case !hasSelection || dataPoint.selected:
                    return DefaultOpacity;
                default:
                    return DimmedOpacity;
            }
        });

        selection.attr("aria-selected", (dataPoint: HierarchyRectangularNode<TableHeatMapDataPoint>) => dataPoint.selected);
    }

}