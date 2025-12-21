https://pub-e11ea1a241ff4f7cb63646ea9df528e4.r2.dev

bayside-orders-kqk2h88wn-jim-jacobshomecs-projects.vercel.app

Please modify @WorkOrderForm.tsx as follows :
a. In the  Gastos section add fields entitled 'Hora de llagado' (digit clock input).  The captain can modify these fields.
Change the section title from "Pagos (Solo  Admin)" to "Admin"
b.  In Admin section add fields:  'Deposito' (number), 'Hora de Salir' (number), 'Tarifa por Hora' (number), 'Cargo Extra' (number), 'Debido al Salir' (number).  The captain cannot modify these fields.
c.  The app should calculate both the 'Costo Total', 'Cargo Extra', 'Debido al Salir' and 'Saldo Cliente a Pagar' fields.  The 'Debido al Salir' field should equal Precio Acordad less Deposito.  The 'Cargo Extra' should equal to ((Hora al Salir - Hora de llegado) * Tarifa por Hora).  The 'Costo Total' field shall equal (Precio Acordado + Cargo Extra.  And the 'Saldo Cliente a Pagar' shall equal  'Costa Total' - ('Deposito' + 'Debido al Salir').



https://baysidepv.com/contact-us/
Simply Static WordPress plugin

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
