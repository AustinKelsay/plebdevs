import React from 'react';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import PurchasedListItem from "@/components/content/lists/PurchasedListItem";
import { formatDateTime } from "@/utils/time";

const UserPurchaseTable = ({ session, windowWidth }) => {
    const purchasesHeader = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-gray-200 font-bold">Purchases</span>
        </div>
    );

    const costTemplate = (rowData) => (
        <div className="flex items-center gap-2">
            <i className="pi pi-wallet text-yellow-500 text-lg"></i>
            <span>{rowData.amountPaid} sats</span>
        </div>
    );

    const nameTemplate = (rowData) => (
        <div className="flex items-center">
            <PurchasedListItem 
                eventId={rowData?.resource?.noteId || rowData?.course?.noteId} 
                category={rowData?.course ? "courses" : "resources"} 
            />
        </div>
    );

    const categoryTemplate = (rowData) => (
        <div className="flex items-center gap-2">
            <i className={`pi ${rowData?.course ? 'pi-book' : 'pi-file'} text-lg`}></i>
            <span className="capitalize">{rowData?.course ? 'course' : 'resource'}</span>
        </div>
    );

    const dateTemplate = (rowData) => (
        <div className="flex items-center gap-2">
            <i className="pi pi-calendar text-gray-400"></i>
            <span>{formatDateTime(rowData?.createdAt)}</span>
        </div>
    );

    return (
        session && session?.user && (
            <DataTable
                emptyMessage="No purchases"
                value={session.user?.purchased}
                header={purchasesHeader}
                style={{ maxWidth: windowWidth < 768 ? "100%" : "90%", margin: "0 auto", marginTop: "2rem" }}
                pt={{
                    wrapper: {
                        className: "rounded-b-lg shadow-md"
                    },
                    header: {
                        className: "rounded-t-lg border-b border-gray-700"
                    },
                    th: {
                        className: "text-gray-300 font-semibold"
                    },
                    bodyRow: {
                        className: "border-b border-gray-700"
                    },
                    bodyCell: {
                        className: "text-gray-200 p-4"
                    }
                }}
                stripedRows
            >
                <Column 
                    field="amountPaid" 
                    header="Cost" 
                    body={costTemplate}
                ></Column>
                <Column
                    field="name"
                    header="Name"
                    body={nameTemplate}
                ></Column>
                <Column 
                    field="category" 
                    header="Category"
                    body={categoryTemplate}
                ></Column>
                <Column 
                    field="createdAt" 
                    header="Date"
                    body={dateTemplate}
                ></Column>
            </DataTable>
        )
    );
};

export default UserPurchaseTable;
