import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { DeleteInvoice, UpdateInvoice } from '@/app/ui/invoices/buttons';
import Form from '@/app/ui/invoices/edit-form';
import { fetchCustomers, fetchInvoiceById } from '@/app/lib/data';
import React from 'react'
import { notFound } from 'next/navigation';

const Page = async ({ params }: { params: { id: string } }) => {
    const id = params.id

    const [invoice, customers] = await Promise.all([
        fetchInvoiceById(id),
        fetchCustomers()
    ])
    if (!invoice) {
        notFound()
    }
    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Invoices', href: '/dashboard/invoices' },
                    {
                        label: 'edit invoice',
                        href: `/dashboard/invoices/${id}/edit`,
                        active: true
                    }
                ]}
            />
            <Form invoice={invoice} customers={customers} />
        </main>
    )
}

export default Page 