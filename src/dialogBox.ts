/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
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
            .text(`Add "Series" data if you want to make the heatmap interactive.`);

        document.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.code === "Enter") {
                event.preventDefault();
                this.host.close(DialogAction.Close);
            }
        });
    }
}

globalThis.dialogRegistry = globalThis.dialogRegistry || {};
globalThis.dialogRegistry[InfoDialogBox.Id] = InfoDialogBox;