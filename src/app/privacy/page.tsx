"use client";

import Link from "next/link";
import Image from "next/image";

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
            <Image src="/RoundReady logo.png" alt="RoundReady" width={32} height={32} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" />
            <span className="text-[15px] sm:text-lg font-bold text-gray-900">RoundReady</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/login" className="rounded-lg px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
              Sign In
            </Link>
            <Link href="/register" className="rounded-lg bg-blue-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-blue-500 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: June 9, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. Introduction</h2>
            <p className="mt-2">
              RoundReady (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the website{" "}
              <span className="font-medium">www.roundready.in</span> and provides AI-powered mock
              interview services. This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Information We Collect</h2>
            <p className="mt-2">We collect the following types of information:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium">Account Information:</span> Name, email address, and
                authentication data when you create an account (via email/password or Google Sign-In).
              </li>
              <li>
                <span className="font-medium">Resume Data:</span> Resume text you upload for
                interview personalization. This is used solely to tailor your mock interview
                experience.
              </li>
              <li>
                <span className="font-medium">Interview Data:</span> Voice conversation transcripts,
                code submissions, and AI-generated feedback reports from your mock interview sessions.
              </li>
              <li>
                <span className="font-medium">Payment Information:</span> Payment details are
                processed securely by our third-party payment processor (Razorpay). We do not store
                your card numbers or bank details on our servers.
              </li>
              <li>
                <span className="font-medium">Usage Data:</span> Browser type, device information,
                IP address, and pages visited, collected automatically for analytics and service
                improvement.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. How We Use Your Information</h2>
            <p className="mt-2">We use the collected information to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Provide, operate, and maintain our mock interview platform</li>
              <li>Personalize your interview experience based on your resume and preferences</li>
              <li>Generate AI-powered feedback reports on your interview performance</li>
              <li>Process payments and manage your subscription</li>
              <li>Send you service-related communications (account verification, interview reports)</li>
              <li>Improve our AI models and platform features</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. Third-Party Services</h2>
            <p className="mt-2">
              We use trusted third-party service providers for authentication, payment processing,
              cloud hosting, and AI-powered features. These providers may process your data in
              accordance with their own privacy policies. We only share the minimum data necessary
              for each service to function.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Data Storage &amp; Security</h2>
            <p className="mt-2">
              Your data is stored on secure servers hosted on Amazon Web Services (AWS). We implement
              industry-standard security measures including encrypted connections (HTTPS), secure
              authentication tokens, and access controls to protect your personal information.
            </p>
            <p className="mt-2">
              While we strive to protect your data, no method of transmission over the Internet or
              electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. Data Retention</h2>
            <p className="mt-2">
              We retain your account information and interview data for as long as your account is
              active. Interview transcripts and feedback reports are kept so you can review your past
              performance. You may request deletion of your account and all associated data at any
              time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">7. Your Rights</h2>
            <p className="mt-2">You have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and personal data</li>
              <li>Withdraw consent for data processing at any time</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact us at the email address below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">8. Cookies</h2>
            <p className="mt-2">
              We use essential cookies and local storage for authentication and session management.
              We do not use third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">9. Children&apos;s Privacy</h2>
            <p className="mt-2">
              Our service is not intended for children under the age of 13. We do not knowingly
              collect personal information from children under 13. If you believe we have collected
              data from a child under 13, please contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">10. Changes to This Policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              Your continued use of the platform after changes constitutes acceptance of the updated
              policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">11. Contact Us</h2>
            <p className="mt-2">
              If you have any questions about this Privacy Policy or our data practices, please
              contact us at:
            </p>
            <p className="mt-2 font-medium">
              Email: support@roundready.in
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-3xl text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} RoundReady, Inc. All rights reserved.
        </div>
      </footer>
    </>
  );
}
