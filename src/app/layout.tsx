import type { Metadata, Viewport } from 'next';
import '@/index.scss';
// Next lists the stylesheets of the error/not-found/loading boundaries in every route's
// asset manifest, but those boundaries never render on a healthy static page, so the
// browser only ever sees `<link rel="preload" as="style">` for them and logs
// "preloaded but not used" on each navigation. Importing them here promotes the
// same chunks to real `<link rel="stylesheet">` tags on the layout. That
// silences the warning and means boundaries and skeletons are fully styled the instant they
// trip, instead of fetching CSS while the app is already broken or loading.
import '@/components/error/ErrorPage.module.scss';
import './NotFound.module.scss';
import './GlobalError.module.scss';
import '@/components/skeleton/Skeleton.module.scss';
import '@/components/LoadingFallback.module.scss';
import '@/components/Spinner.module.scss';
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
