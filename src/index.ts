/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import {
  Message, postMessage, sendMessage
} from 'phosphor-messaging';

import {
  Property
} from 'phosphor-properties';

import {
  ChildMessage, MSG_AFTER_ATTACH, MSG_BEFORE_DETACH, MSG_LAYOUT_REQUEST,
  ResizeMessage, Widget
} from 'phosphor-widget';

import './index.css';


/**
 * The class name added to DashboardPanel widgets.
 */
var DASHBOARD_PANEL_CLASS = 'phosphor-DashboardPanel';

/**
 *
 */
var SIZER_CLASS = 'phosphor-DashboardPanel-sizer';


/**
 * A Phosphor layout widget for building interactive dashboards.
 */
export
class DashboardPanel extends Widget {
  /**
   *
   */
  static createNode(): HTMLElement {
    var node = document.createElement('div');
    var sizer = document.createElement('div');
    sizer.className = SIZER_CLASS;
    node.appendChild(sizer);
    return node;
  }

  /**
   * The property descriptor for the dashboard panel aspect ratio.
   *
   * This controls the row height relative to the column width.
   *
   * #### Notes
   * This value is clamped to a lower bound of `0`.
   *
   * The default value is `1`.
   *
   * **See also:** [[aspectRatio]]
   */
  static aspectRatioProperty = new Property<DashboardPanel, number>({
    value: 1,
    coerce: (owner, value) => Math.max(0, value),
    changed: owner => owner.update(),
  });

  /**
   * The property descriptor for the dashboard panel column count.
   *
   * This controls the number of columns in the dashboard panel. The
   * number of rows in the dashboard panel is effectively infinite.
   *
   * #### Notes
   * This value is clamped to an integer with a lower bound of `1`.
   *
   * The default value is `12`.
   *
   * **See also:** [[columnCount]]
   */
  static columnCountProperty = new Property<DashboardPanel, number>({
    value: 12,
    coerce: (owner, value) => Math.max(1, value | 0),
    changed: owner => postMessage(owner, MSG_LAYOUT_REQUEST),
  });

  /**
   * The property descriptor for the minimum row size.
   *
   * A row will never be resized less than this size.
   *
   * #### Notes
   * This value is clamped to a lower bound of `0`.
   *
   * This takes precedence over `maxRowSize` when in conflict.
   *
   * The default value is `50`.
   *
   * **See also:** [[minRowSize]]
   */
  static minRowSizeProperty = new Property<DashboardPanel, number>({
    value: 50,
    coerce: (owner, value) => Math.max(0, value),
    changed: owner => owner.update(),
  });

  /**
   * The property descriptor for the minimum column size.
   *
   * A column will never be resized less than this size.
   *
   * #### Notes
   * This value is clamped to a lower bound of `0`.
   *
   * This takes precedence over `maxColumnSize` when in conflict.
   *
   * The default value is `50`.
   *
   * **See also:** [[minColumnSize]]
   */
  static minColumnSizeProperty = new Property<DashboardPanel, number>({
    value: 50,
    coerce: (owner, value) => Math.max(0, value),
    changed: owner => postMessage(owner, MSG_LAYOUT_REQUEST),
  });

  /**
   * The property descriptor for the maximum row size.
   *
   * A row will never be resized more than this size.
   *
   * #### Notes
   * This value is clamped to a lower bound of `0`.
   *
   * The `minRowSize` takes precedent when in conflict.
   *
   * The default value is `Infinity`.
   *
   * **See also:** [[maxRowSize]]
   */
  static maxRowSizeProperty = new Property<DashboardPanel, number>({
    value: Infinity,
    coerce: (owner, value) => Math.max(0, value),
    changed: owner => owner.update(),
  });

  /**
   * The property descriptor for the maximum column size.
   *
   * A column will never be resized more than this size.
   *
   * #### Notes
   * This value is clamped to a lower bound of `0`.
   *
   * The `minColumnSize` takes precedent when in conflict.
   *
   * The default value is `Infinity`.
   *
   * **See also:** [[maxColumnSize]]
   */
  static maxColumnSizeProperty = new Property<DashboardPanel, number>({
    value: Infinity,
    coerce: (owner, value) => Math.max(0, value),
    changed: owner => postMessage(owner, MSG_LAYOUT_REQUEST),
  });

  /**
   * The property descriptor for the dashboard panel row spacing.
   *
   * The controls the fixed row spacing between the child widgets.
   *
   * #### Notes
   * This value is clamped to an integer with a lower bound of `0`.
   *
   * The default value is `8`.
   *
   * **See also:** [[rowSpacing]]
   */
  static rowSpacingProperty = new Property<DashboardPanel, number>({
    value: 8,
    coerce: (owner, value) => Math.max(0, value | 0),
    changed: owner => owner.update(),
  });

  /**
   * The property descriptor for the dashboard panel column spacing.
   *
   * The controls the fixed column spacing between the child widgets.
   *
   * #### Notes
   * This value is clamped to an integer with a lower bound of `0`.
   *
   * The default value is `8`.
   *
   * **See also:** [[columnSpacing]]
   */
  static columnSpacingProperty = new Property<DashboardPanel, number>({
    value: 8,
    coerce: (owner, value) => Math.max(0, value | 0),
    changed: owner => postMessage(owner, MSG_LAYOUT_REQUEST),
  });

  /**
   * The property descriptor for a widget's origin row.
   *
   * This controls the row index of the widget's origin when layed
   * out in a dashboard panel.
   *
   * #### Notes
   * This value is an integer clamped to a lower bound of `0`.
   *
   * The default value is `0`.
   *
   * **See also:** [[getRow]], [[setRow]]
   */
  static rowProperty = new Property<Widget, number>({
    value: 0,
    coerce: (owner, value) => Math.max(0, value | 0),
    changed: onWidgetChanged,
  });

  /**
   * The property descriptor for a widget's origin column.
   *
   * This controls the column index of the widget's origin when
   * layed out in a dashboard panel.
   *
   * #### Notes
   * This value is an integer clamped to a lower bound of `0`.
   *
   * The default value is `0`.
   *
   * **See also:** [[getColumn]], [[setColumn]]
   */
  static columnProperty = new Property<Widget, number>({
    value: 0,
    coerce: (owner, value) => Math.max(0, value | 0),
    changed: onWidgetChanged,
  });

  /**
   * The property descriptor for a widget's row span.
   *
   * This controls the number of rows spanned by the widget when
   * layed out in a dashboard panel.
   *
   * #### Notes
   * This value is an integer clamped to a lower bound of `1`.
   *
   * The default value is `1`.
   *
   * **See also:** [[getRowSpan]], [[setRowSpan]]
   */
  static rowSpanProperty = new Property<Widget, number>({
    value: 1,
    coerce: (owner, value) => Math.max(1, value | 0),
    changed: onWidgetChanged,
  });

  /**
   * The property descriptor for a widget's column span.
   *
   * This controls the number of columns spanned by the widget
   * when layed out in a dashboard panel.
   *
   * #### Notes
   * This value is an integer clamped to a lower bound of `1`.
   *
   * The default value is `1`.
   *
   * **See also:** [[getColumnSpan]], [[setColumnSpan]]
   */
  static columnSpanProperty = new Property<Widget, number>({
    value: 1,
    coerce: (owner, value) => Math.max(1, value | 0),
    changed: onWidgetChanged,
  });

  /**
   * Get the origin row index for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The row index of the widget origin.
   *
   * #### Notes
   * This is a pure delegate to the [[rowProperty]].
   */
  static getRow(widget: Widget): number {
    return DashboardPanel.rowProperty.get(widget);
  }

  /**
   * Set the origin row index for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the origin row index.
   *
   * #### Notes
   * This is a pure delegate to the [[rowProperty]].
   */
  static setRow(widget: Widget, value: number): void {
    DashboardPanel.rowProperty.set(widget, value);
  }

  /**
   * Get the origin column index for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The column index of the widget origin.
   *
   * #### Notes
   * This is a pure delegate to the [[columnProperty]].
   */
  static getColumn(widget: Widget): number {
    return DashboardPanel.columnProperty.get(widget);
  }

  /**
   * Set the origin column index for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the origin column index.
   *
   * #### Notes
   * This is a pure delegate to the [[columnProperty]].
   */
  static setColumn(widget: Widget, value: number): void {
    DashboardPanel.columnProperty.set(widget, value);
  }

  /**
   * Get the row span for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The row span of the widget.
   *
   * #### Notes
   * This is a pure delegate to the [[rowSpanProperty]].
   */
  static getRowSpan(widget: Widget): number {
    return DashboardPanel.rowSpanProperty.get(widget);
  }

  /**
   * Set the row span for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The row span for the widget.
   *
   * #### Notes
   * This is a pure delegate to the [[rowSpanProperty]].
   */
  static setRowSpan(widget: Widget, value: number): void {
    DashboardPanel.rowSpanProperty.set(widget, value);
  }

  /**
   * Get the column span for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The column span of the widget.
   *
   * #### Notes
   * This is a pure delegate to the [[columnSpanProperty]].
   */
  static getColumnSpan(widget: Widget): number {
    return DashboardPanel.columnSpanProperty.get(widget);
  }

  /**
   * Set the column span for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The column span for the widget.
   *
   * #### Notes
   * This is a pure delegate to the [[columnSpanProperty]].
   */
  static setColumnSpan(widget: Widget, value: number): void {
    DashboardPanel.columnSpanProperty.set(widget, value);
  }

  /**
   * Construct a new dashboard panel.
   */
  constructor() {
    super();
    this.addClass(DASHBOARD_PANEL_CLASS);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    super.dispose();
  }

  /**
   * Get the aspect ratio for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[aspectRatioProperty]].
   */
  get aspectRatio(): number {
    return DashboardPanel.aspectRatioProperty.get(this);
  }

  /**
   * Set the aspect ratio for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[aspectRatioProperty]].
   */
  set aspectRatio(value: number) {
    DashboardPanel.aspectRatioProperty.set(this, value);
  }

  /**
   * Get the column count for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[columnCountProperty]].
   */
  get columnCount(): number {
    return DashboardPanel.columnCountProperty.get(this);
  }

  /**
   * Set the column count for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[columnCountProperty]].
   */
  set columnCount(value: number) {
    DashboardPanel.columnCountProperty.set(this, value);
  }

  /**
   * Get the minimum row size for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[minRowSizeProperty]].
   */
  get minRowSize(): number {
    return DashboardPanel.minRowSizeProperty.get(this);
  }

  /**
   * Set the minimum row size for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[minRowSizeProperty]].
   */
  set minRowSize(value: number) {
    DashboardPanel.minRowSizeProperty.set(this, value);
  }

  /**
   * Get the minimum column size for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[minColumnSizeProperty]].
   */
  get minColumnSize(): number {
    return DashboardPanel.minColumnSizeProperty.get(this);
  }

  /**
   * Set the minimum column size for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[minColumnSizeProperty]].
   */
  set minColumnSize(value: number) {
    DashboardPanel.minColumnSizeProperty.set(this, value);
  }

  /**
   * Get the maximum row size for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[maxRowSizeProperty]].
   */
  get maxRowSize(): number {
    return DashboardPanel.maxRowSizeProperty.get(this);
  }

  /**
   * Set the maximum row size for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[maxRowSizeProperty]].
   */
  set maxRowSize(value: number) {
    DashboardPanel.maxRowSizeProperty.set(this, value);
  }

  /**
   * Get the maximum column size for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[maxColumnSizeProperty]].
   */
  get maxColumnSize(): number {
    return DashboardPanel.maxColumnSizeProperty.get(this);
  }

  /**
   * Set the maximum column size for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[maxColumnSizeProperty]].
   */
  set maxColumnSize(value: number) {
    DashboardPanel.maxColumnSizeProperty.set(this, value);
  }

  /**
   * Get the row spacing for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[rowSpacingProperty]].
   */
  get rowSpacing(): number {
    return DashboardPanel.rowSpacingProperty.get(this);
  }

  /**
   * Set the row spacing for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[rowSpacingProperty]].
   */
  set rowSpacing(value: number) {
    DashboardPanel.rowSpacingProperty.set(this, value);
  }

  /**
   * Get the column spacing for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[columnSpacingProperty]].
   */
  get columnSpacing(): number {
    return DashboardPanel.columnSpacingProperty.get(this);
  }

  /**
   * Set the column spacing for the dashboard panel.
   *
   * #### Notes
   * This is a pure delegate to the [[columnSpacingProperty]].
   */
  set columnSpacing(value: number) {
    DashboardPanel.columnSpacingProperty.set(this, value);
  }

  /**
   * A message handler invoked on a `'child-added'` message.
   */
  protected onChildAdded(msg: ChildMessage): void {
    this.node.appendChild(msg.child.node);
    if (this.isAttached) sendMessage(msg.child, MSG_AFTER_ATTACH);
    this.update();
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   */
  protected onChildRemoved(msg: ChildMessage): void {
    if (this.isAttached) sendMessage(msg.child, MSG_BEFORE_DETACH);
    this.node.removeChild(msg.child.node);
    msg.child.clearOffsetGeometry();
  }

  /**
   * A message handler invoked on a `'child-moved'` message.
   */
  protected onChildMoved(msg: ChildMessage): void { /* no-op */ }

  /**
   * A message handler invoked on an `'after-show'` message.
   */
  protected onAfterShow(msg: Message): void {
    this.update(true);
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    postMessage(this, MSG_LAYOUT_REQUEST);
  }

  /**
   * A message handler invoked on a `'child-shown'` message.
   */
  protected onChildShown(msg: ChildMessage): void {
    this.update();
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: ResizeMessage): void {
    if (this.isVisible) {
      if (msg.width < 0 || msg.height < 0) {
        var rect = this.offsetRect;
        this._layoutChildren(rect.width, rect.height);
      } else {
        this._layoutChildren(msg.width, msg.height);
      }
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    if (this.isVisible) {
      var rect = this.offsetRect;
      this._layoutChildren(rect.width, rect.height);
    }
  }

  /**
   * A message handler invoked on a `'layout-request'` message.
   */
  protected onLayoutRequest(msg: Message): void {
    if (this.isAttached) {
      this._setupGeometry();
    }
  }

  /**
   * Setup the size limits and internal dashboard panel state.
   */
  private _setupGeometry(): void {
    // // Initialize the size constraints.
    var minW = this.minColumnSize;
    var minH = this.minRowSize;

    // TODO - probably want to allow the user to specify the max size.
    var maxW = Infinity;
    var maxH = Infinity;

    // Add the box sizing to the size constraints.
    var box = this.boxSizing;
    minW += box.horizontalSum;
    minH += box.verticalSum;
    maxW += box.horizontalSum;
    maxH += box.verticalSum;

    // Update the panel's size constraints.
    this.setSizeLimits(minW, minH, maxW, maxH);

    // Notify the parent that it should relayout.
    if (this.parent) sendMessage(this.parent, MSG_LAYOUT_REQUEST);

    // Update the layout for the child widgets.
    this.update(true);
  }

  /**
   * Compute the layout data for an inner layout width.
   *
   * The inner width is the offset width minus border and padding.
   */
  private _layoutData(innerWidth: number): ILayoutData {
    // Compute the ideal column size.
    var colCount = this.columnCount;
    var fixedColSpace = this.columnSpacing * (colCount - 1);
    var idealColSize = (innerWidth - fixedColSpace) / colCount;

    // Compute the layout mode and effective sizes.
    var colSize: number;
    var rowSize: number;
    var singleCol: boolean;
    var minColSize = this.minColumnSize;
    var maxColSize = this.maxColumnSize;
    if (idealColSize < minColSize) {
      colSize = Math.max(minColSize, Math.min(innerWidth, maxColSize));
      rowSize = this.minRowSize;
      singleCol = true;
    } else {
      colSize = Math.max(minColSize, Math.min(idealColSize, maxColSize));
      var minRowSize = this.minRowSize;
      var maxRowSize = this.maxRowSize;
      var idealRowSize = colSize * this.aspectRatio;
      rowSize = Math.max(minRowSize, Math.min(idealRowSize, maxRowSize));
      singleCol = false;
    }

    // Compute the effective row size.
    // var minRowSize = this.minRowSize;
    // var maxRowSize = this.maxRowSize;
    // var idealRowSize = colSize * this.aspectRatio;
    // var rowSize = Math.max(minRowSize, Math.min(idealRowSize, maxRowSize));

    // Return the computed layout data.
    return { singleCol, colSize, rowSize };
  }

  /**
   * Layout the children using the given offset width and height.
   */
  private _layoutChildren(offsetWidth: number, offsetHeight: number): void {
    // XXX this function is really hacky - bad example!

    // Bail early if their are no children to arrange.
    if (this.childCount === 0) {
      return;
    }

    // Compute the actual layout bounds adjusted for border and padding.
    var box = this.boxSizing;
    var top = box.paddingTop;
    var left = box.paddingLeft;
    var width = offsetWidth - box.horizontalSum;

    var { singleCol, colSize, rowSize } = this._layoutData(width);

    if (singleCol) {
      var y = top;
      var rowSpacing = this.rowSpacing;
      var children = this.children.sort(widgetCmp);
      for (var i = 0, n = children.length; i < n; ++i) {
        var widget = children[i];

        var span = DashboardPanel.getRowSpan(widget);
        var size = span * rowSize + (span - 1) * rowSpacing;

        // Clamp to the limits and update the offset geometry.
        var limits = widget.sizeLimits;
        var w = Math.max(limits.minWidth, Math.min(colSize, limits.maxWidth));
        var h = Math.max(limits.minHeight, Math.min(size, limits.maxHeight));
        widget.setOffsetGeometry(left, y, w, h);

        y += size + rowSpacing;
      }
      var sizer = this.node.firstChild as HTMLElement;
      sizer.style.height = y + 'px';
      return;
    }

    // Finally, layout the children.
    var maxRow = 0;
    var maxCol = this.columnCount - 1;
    var rowSpacing = this.rowSpacing;
    var colSpacing = this.columnSpacing;
    for (var i = 0, n = this.childCount; i < n; ++i) {
      // Fetch the child widget.
      var widget = this.childAt(i);

      // Compute the widget top and height.
      var row = DashboardPanel.getRow(widget);
      var rowSpan = DashboardPanel.getRowSpan(widget);
      var y = row * (rowSize + rowSpacing);
      var h = rowSpan * rowSize + (rowSpan - 1) * rowSpacing;

      var maxRow = Math.max(maxRow, row + rowSpan - 1);

      // Compute the widget left and width.
      var col = DashboardPanel.getColumn(widget);
      var colSpan = DashboardPanel.getColumnSpan(widget);
      var adjCol = Math.min(col, maxCol);
      var adjColSpan = Math.min(colSpan, maxCol - adjCol + 1);
      var x = adjCol * (colSize + colSpacing);
      var w = adjColSpan * colSize + (colSpan - 1) * colSpacing;

      // Clamp to the limits and update the offset geometry.
      var limits = widget.sizeLimits;
      w = Math.max(limits.minWidth, Math.min(w, limits.maxWidth));
      h = Math.max(limits.minHeight, Math.min(h, limits.maxHeight));
      widget.setOffsetGeometry(left + x, top + y, w, h);
    }
    var sizer = this.node.firstChild as HTMLElement;
    var th = (maxRow + 1) * rowSize + maxRow * rowSpacing;
    sizer.style.height = th + box.verticalSum + 'px';
  }
}


/**
 *
 */
interface ILayoutData {
  singleCol: boolean;
  colSize: number;
  rowSize: number;
}


/**
 * The changed handler for the attached widget properties.
 */
function onWidgetChanged(owner: Widget): void {
  if (owner.parent instanceof DashboardPanel) {
    owner.parent.update();
  }
}


/**
 *
 */
function widgetCmp(a: Widget, b: Widget): number {
  var r1 = DashboardPanel.getRow(a);
  var r2 = DashboardPanel.getRow(b);
  if (r1 !== r2) {
    return r1 - r2;
  }
  var c1 = DashboardPanel.getColumn(a);
  var c2 = DashboardPanel.getColumn(b);
  return c1 - c2;
}
