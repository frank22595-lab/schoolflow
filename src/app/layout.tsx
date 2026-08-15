import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'School Management Platform',
  description: 'Professional school management for Nigerian K-12 schools',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}