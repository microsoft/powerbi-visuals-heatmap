import powerbi from "powerbi-visuals-api";
import DialogAction = powerbi.DialogAction;
import IDialogHost = powerbi.extensibility.visual.IDialogHost;
import DialogConstructorOptions = powerbi.extensibility.visual.DialogConstructorOptions;

import { select as d3Select, Selection as d3Selection } from "d3-selection";
type Selection<T> = d3Selection<any, T, any, any>;

export class InfoDialogBox {
    public static Id = "InfoDialog";
    private host: IDialogHost;
    private text: Selection<any>;

    constructor(options: DialogConstructorOptions) {
        this.host = options.host;
        this.text = d3Select(options.element)
            .append("div")
            .classed("dialog", true)
            .text("Add series values if you want to make the heatmap interactive.");

        this.text.on("keydown", (event: KeyboardEvent) => {
            if (event.code === "Enter") {
                this.host.close(DialogAction.Close);
            }
        });
    }
}

globalThis.dialogRegistry = globalThis.dialogRegistry || {};
globalThis.dialogRegistry[InfoDialogBox.Id] = InfoDialogBox;