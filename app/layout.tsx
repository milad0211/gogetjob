import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from 'nextjs-toploader';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.resumeai.app'),
  title: {
    default: 'ResumeAI - ATS Resume Optimizer',
    template: '%s | ResumeAI',
  },
  description:
    'Role-specific resume optimization with ATS scoring, keyword gap analysis, quality checks, and cover letter generation.',
  applicationName: 'ResumeAI',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'ResumeAI',
    title: 'ResumeAI - ATS Resume Optimizer',
    description:
      'Upload your resume, align it with any job description, and export an ATS-focused version with measurable score improvements.',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumeAI - ATS Resume Optimizer',
    description:
      'Optimize every resume for every role with evidence-aware AI rewriting and quality-gated output.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader color="#2563eb" showSpinner={false} />
        {children}
      </body>
    </html>
  );
}
