"use server"
import { sql } from "@vercel/postgres"
import { AuthError } from "next-auth"
import { signIn } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer'
    }),
    amount: z.coerce.number().gt(0, { message: 'Please enter Amount Greater than 0$' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status'
    }),
    date: z.string()
})
export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[]
    };
    message?: string | null
}
const CreateInvoice = FormSchema.omit({ id: true, date: true })
const UpdateInvoice = FormSchema.omit({ id: true, date: true })

export async function createInvoie(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Field. Field to create invoices'
        }
    }
    const { customerId, amount, status } = validatedFields.data
    const amountInCents = amount * 100
    const date = new Date().toISOString().split('T')[0]
    try {
        await sql`
        INSERT INTO invoices (customer_id, amount,status,date)
        VALUES (${customerId},${amountInCents},${status},${date})
    `
    } catch (error) {
        return {
            message: 'DataBase Error:Failed To Create Invoice'
        }
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    })

    const amountInCents = amount * 100;
    try {
        await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

    } catch (error) {
        return {
            message: 'Database Error: Failed To Update Invoice'
        }
    }

    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}
export async function deleteInvoice(id: string) {
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`
    } catch (error) {
        return { message: 'Database error:Failed To Delete Invoice' }
    }

    revalidatePath('/dashboard/invoices')
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
    try {
        await signIn('credentials',formData)
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type)
            {
                case 'CredentialsSignin':
                    return 'Invalid credential';
                default:
                    return 'something went wrong'
            }
        }
        throw error
    }

}