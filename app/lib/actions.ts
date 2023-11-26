'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Define a schema that matches the shape of form object using 'zod' library
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(), // Coerce from string to number
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});
const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(formData: FormData) {
    // Validate the types
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    // Store monetary values in cents to eleminate Js floating-point errors
    const amountInCents = amount * 100;
    // New date with the format "YYYY-MM-DD"
    const date = new Date().toISOString().split('T')[0];

    // Inserting the data into database
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;

    // Clear cache and trigger a new request to the server
    revalidatePath('/dashboard/invoices');
    // Redirect the user back to `/dashboard/invoices` from `/dashboard/invoices/create`
    redirect('/dashboard/invoices');
}

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;

    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}