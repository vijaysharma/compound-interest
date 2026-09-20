import type { Metadata, Viewport } from 'next';
import '@/index.scss';
import AppClientLayout from '@/components/AppClientLayout';
import { rootMetadata, rootViewport, jsonLdData } from '@/data/rootMetadata';
export const metadata: Metadata = rootMetadata;
export const viewport: Viewport = rootViewport;
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" data-theme="fantasy" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body suppressHydrationWarning>
        <AppClientLayout>{children}</AppClientLayout>
        <noscript>
          <div className="noscriptContainer">
            <h1 className="noscriptHeading">
              Free Online Financial Calculators India — SIP, EMI, FD &amp; More
            </h1>
            <p className="noscriptBody">
              India&apos;s most precise, 100% free financial calculator suite. This application requires
              JavaScript to run the interactive calculators.
            </p>
          </div>
        </noscript>
      </body>
    </html>
  );
}
