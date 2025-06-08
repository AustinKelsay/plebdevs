import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const GenericDataTable = ({
  value,
  columns,
  header,
  emptyMessage = "No records found.",
  className,
  style,
  pt,
  stripedRows = false,
  dataKey,
  // Pagination props
  paginator = false,
  rows,
  rowsPerPageOptions,
  paginatorTemplate = "FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown",
  currentPageReportTemplate = "Showing {first} to {last} of {totalRecords} entries",
  // Sorting props
  sortMode,
  sortField,
  sortOrder,
  onSort,
  // Filtering props
  filters,
  onFilter,
  globalFilter,
  globalFilterFields,
  filterDisplay = "menu",
  // Selection props
  selection,
  onSelectionChange,
  selectionMode,
  // Row expansion
  rowExpansionTemplate,
  expandedRows,
  onRowToggle,
  // Context Menu
  onContextMenu,
  contextMenuSelection,
  onContextMenuSelectionChange,
  // Other common props
  loading = false,
  ...rest // Allows passing any other DataTable props
}) => {
  return (
    <DataTable
      value={value}
      header={header}
      emptyMessage={emptyMessage}
      className={className}
      style={style}
      pt={pt}
      stripedRows={stripedRows}
      dataKey={dataKey}
      // Pagination
      paginator={paginator}
      rows={rows}
      rowsPerPageOptions={rowsPerPageOptions}
      paginatorTemplate={paginatorTemplate}
      currentPageReportTemplate={currentPageReportTemplate}
      // Sorting
      sortMode={sortMode}
      sortField={sortField}
      sortOrder={sortOrder}
      onSort={onSort}
      // Filtering
      filters={filters}
      onFilter={onFilter}
      globalFilter={globalFilter}
      globalFilterFields={globalFilterFields}
      filterDisplay={filterDisplay}
      // Selection
      selection={selection}
      onSelectionChange={onSelectionChange}
      selectionMode={selectionMode}
      // Row Expansion
      rowExpansionTemplate={rowExpansionTemplate}
      expandedRows={expandedRows}
      onRowToggle={onRowToggle}
      // Context Menu
      onContextMenu={onContextMenu}
      contextMenuSelection={contextMenuSelection}
      onContextMenuSelectionChange={onContextMenuSelectionChange}
      // Loading state
      loading={loading}
      {...rest}
    >
      {columns && columns.map((col, i) => (
        <Column
          key={col.field || i}
          field={col.field}
          header={col.header}
          body={col.body}
          sortable={col.sortable}
          filter={col.filter}
          filterPlaceholder={col.filterPlaceholder}
          filterElement={col.filterElement}
          selectionMode={col.selectionMode}
          headerStyle={col.headerStyle}
          bodyStyle={col.bodyStyle}
          style={col.style}
          expander={col.expander}
          // Add other column props as needed
          {...col.columnProps} // Allows passing any other Column props
        />
      ))}
    </DataTable>
  );
};

export default GenericDataTable;
