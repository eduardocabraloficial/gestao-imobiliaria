import type { Metadata } from "next";
import { DM_Serif_Display, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Cabral House Negócios Imobiliários", template: "%s | Cabral House" },
  description: "Imóveis selecionados para comprar, vender ou alugar em Maceió e região.",
  openGraph: { title: "Cabral House Negócios Imobiliários", description: "Compra, venda e locação com atendimento próximo e imóveis selecionados.", type: "website", images: ["/brand/cabral-house-logo.svg"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} ${dmSerif.variable}`}>{children}</body>
    </html>
  );
}
