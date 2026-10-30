"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Key,
  Mail,
  Clock,
  Eye,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Sparkles,
  ExternalLink,
  Globe,
  Sun,
  Moon,
  Laptop,
  Check,
  Copy,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Switch,
  Select,
  SegmentedControl,
  useTheme,
} from "@/components/ui";

export default function LandingPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Interactive Simulator State
  const [hasPassword, setHasPassword] = useState(true);
  const [hasEmail, setHasEmail] = useState(false);
  const [expiryHours, setExpiryHours] = useState("24");
  const [maxOpens, setMaxOpens] = useState("10");
  const [role, setRole] = useState("viewer");
  const [copiedCmd, setCopiedCmd] = useState(false);

  const command = "npx small-software-cloud share";

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(command);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  // Plain-English rule summary generator
  const getRuleSummary = () => {
    const parts: string[] = [];

    if (hasEmail) {
      parts.push("Only allowed email addresses (with 6-digit verification code)");
    } else if (hasPassword) {
      parts.push("Anyone with the password");
    } else {
      parts.push("Anyone with the link");
    }

    parts.push(`can access as ${role.toUpperCase()}`);

    if (expiryHours !== "0") {
      parts.push(`for ${expiryHours === "1" ? "1 hour" : `${expiryHours} hours`}`);
    } else {
      parts.push("with no expiration");
    }

    if (maxOpens !== "0") {
      parts.push(`(capped at ${maxOpens} total opens)`);
    }

    return parts.join(" ") + ".";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col selection:bg-[var(--accent)] selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[var(--border-default)] px-6 sm:px-12 flex items-center justify-between sticky top-0 bg-[var(--bg-canvas)]/90 backdrop-blur-md z-40">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">
            Small Software Cloud
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 text-xs font-medium">
          <Link
            href="/dashboard"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/quickstart"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden sm:inline"
          >
            Quickstart
          </Link>
          <Link
            href="/dev/components"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden md:inline"
          >
            Components
          </Link>
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Build from a prompt</span>
          </Link>
          <Link
            href="/login"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden sm:inline"
          >
            Sign In
          </Link>

          {/* Theme switcher */}
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-ring cursor-pointer"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 sm:px-12 max-w-5xl mx-auto w-full text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)] text-xs font-semibold mb-6">
          <Lock className="w-3.5 h-3.5" />
          <span>Access-controlled links for any project</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] max-w-3xl mb-6">
          Put any project behind access-controlled links.
        </h1>

        <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mb-8 leading-relaxed font-normal">
          Run one command in your project folder, open a local dashboard, and create as many links as you want, each with its own rules: password, email list, expiry, usage limit, and role. Revoke any link instantly. See who opened what.
        </p>

        {/* Command Box */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mb-10">
          <div className="flex-1 w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-sm font-mono text-xs">
            <span className="text-[var(--text-muted)] select-none mr-2">$</span>
            <span className="text-[var(--text-primary)] font-medium select-all">{command}</span>
            <button
              type="button"
              onClick={handleCopyCmd}
              className="ml-3 p-1 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] focus-ring cursor-pointer"
              aria-label="Copy install command"
            >
              {copiedCmd ? <Check className="w-4 h-4 text-[var(--status-active-text)]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <Link href="/quickstart" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Get started
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--status-active-text)]" />
            Zero secrets committed
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--status-active-text)]" />
            Localhost 127.0.0.1 bound
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--status-active-text)]" />
            Tokens stored as SHA-256
          </span>
        </div>
      </section>

      {/* 3-Step Walkthrough */}
      <section className="py-16 border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="max-w-5xl mx-auto px-6 sm:px-12">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl font-bold tracking-tight">How it works in 3 steps</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              No backend redesign. Works with static sites, Vite, Next.js, or existing deployments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 flex flex-col gap-3">
                <div className="w-7 h-7 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)] flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <h3 className="font-semibold text-sm">Run one command</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Run <code className="font-mono">npm run share</code> in your project. The CLI detects your framework, build scripts, and output folder automatically.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 flex flex-col gap-3">
                <div className="w-7 h-7 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)] flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <h3 className="font-semibold text-sm">Pick access rules</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  A private dashboard opens on <code className="font-mono">localhost:4040</code>. Choose password, email verification, expiry, or view limits per link.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 flex flex-col gap-3">
                <div className="w-7 h-7 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)] flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <h3 className="font-semibold text-sm">Control & revoke</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Send different links to clients, QA, or investors. Revoke or rotate any link with 1 click. View exact open audit trails in real time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Link Simulator */}
      <section className="py-20 max-w-5xl mx-auto px-6 sm:px-12 w-full">
        <div className="text-center max-w-xl mx-auto mb-12">
          <Badge variant="accent" className="mb-3">Interactive demo</Badge>
          <h2 className="text-2xl font-bold tracking-tight">Try configuring a share link</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">
            Test how rules combine into plain-English access policies.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Link Rule Builder</CardTitle>
              <Badge variant="active" dot>Simulator</Badge>
            </div>
            <CardDescription>
              Toggle rules to see how they protect the target application.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Switch
                checked={hasPassword}
                onChange={setHasPassword}
                label="Password / PIN"
                description="Prompt for secret code"
              />
              <Switch
                checked={hasEmail}
                onChange={setHasEmail}
                label="Email Allowlist"
                description="Send 6-digit verification OTP"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[var(--border-subtle)]">
              <Select
                label="Expiration"
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                options={[
                  { value: "0", label: "Never expires" },
                  { value: "1", label: "1 hour" },
                  { value: "24", label: "24 hours" },
                  { value: "168", label: "7 days" },
                ]}
              />
              <Select
                label="View Limit"
                value={maxOpens}
                onChange={(e) => setMaxOpens(e.target.value)}
                options={[
                  { value: "0", label: "Unlimited opens" },
                  { value: "1", label: "1 open (Single-use)" },
                  { value: "5", label: "5 opens" },
                  { value: "10", label: "10 opens" },
                ]}
              />
              <Select
                label="Target Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={[
                  { value: "viewer", label: "Viewer (Read-only)" },
                  { value: "commenter", label: "Commenter" },
                  { value: "editor", label: "Editor" },
                ]}
              />
            </div>

            {/* Live Plain-English Summary */}
            <div className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] flex flex-col gap-1.5 mt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Live Policy Summary
              </span>
              <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">
                {getRuleSummary()}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              https://gateway.domain/s/7a9b2c...
            </span>
            <Button size="sm" variant="primary" onClick={() => alert("Try running `npm run share` in your terminal to create real links!")}>
              Deploy Link
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* The 6 Access Levels */}
      <section className="py-16 border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="max-w-5xl mx-auto px-6 sm:px-12">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl font-bold tracking-tight">Granular access levels</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Mix and match security controls depending on who you are sharing with.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)]">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm">Public view</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Zero friction preview. Protected by referrer stripping, no-index headers, and instant 1-click revocation.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)]">
                <Key className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm">Password & PIN</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Passphrase or 4-digit numerical code. Automatic rate limiting locks out brute-force attempts after repeated failures.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)]">
                <Mail className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm">Email allowlist</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Specify authorized emails. The gateway emails a 6-digit one-time code with cooldown protections.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)]">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm">Expiry windows</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Time-bombed links that expire after 1 hour, 24 hours, or N hours from first open. After expiry, requests return 410 Expired.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)]">
                <Eye className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm">Usage limits</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Single-use (1 open) or hard-capped view quotas. Prevents links from being forwarded or circulated around teams.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)]">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm">Role passthrough</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Injects cryptographically signed <code className="font-mono">X-Share-Role</code> and JWT headers. Incoming forged headers are stripped.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: Why not just share the Vercel URL? */}
      <section className="py-20 max-w-5xl mx-auto px-6 sm:px-12 w-full">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl font-bold tracking-tight">Why not just share the Vercel URL?</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">
            Default platform preview URLs are all-or-nothing and impossible to audit.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-subtle)]">
                <th className="p-4 font-semibold uppercase text-[var(--text-muted)]">Feature</th>
                <th className="p-4 font-semibold uppercase text-[var(--text-muted)]">Raw Vercel / Netlify URL</th>
                <th className="p-4 font-semibold uppercase text-[var(--accent)] font-bold">Small Software Cloud</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              <tr>
                <td className="p-4 font-medium">Link proliferation</td>
                <td className="p-4 text-[var(--text-muted)]">1 public URL for everyone</td>
                <td className="p-4 text-[var(--text-primary)] font-semibold">Separate links with individual rules</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Revocation</td>
                <td className="p-4 text-[var(--text-muted)]">Must redeploy or break link for all</td>
                <td className="p-4 text-[var(--text-primary)] font-semibold">1-click revoke per person or group</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Access controls</td>
                <td className="p-4 text-[var(--text-muted)]">None (unless expensive enterprise SSO)</td>
                <td className="p-4 text-[var(--text-primary)] font-semibold">Passwords, PINs, email allowlists, limits</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Audit log</td>
                <td className="p-4 text-[var(--text-muted)]">Raw server log scraping required</td>
                <td className="p-4 text-[var(--text-primary)] font-semibold">Real-time open & failed challenge feed</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Origin lock</td>
                <td className="p-4 text-[var(--text-muted)]">Public origin remains crawlable</td>
                <td className="p-4 text-[var(--text-primary)] font-semibold">Guided origin lock blocks raw bypass</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Security Promises */}
      <section className="py-16 border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="max-w-5xl mx-auto px-6 sm:px-12">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl font-bold tracking-tight">Security promises</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Built with zero-trust defaults and strict client-side data isolation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--status-active-text)] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Hashed tokens only</span>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Raw access tokens are displayed only once upon creation. Database stores only cryptographic SHA-256 hashes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--status-active-text)] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Zero project secrets</span>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Gateway keys and credentials live in <code className="font-mono">~/.config/small-software-cloud/</code>. Project repos only contain git-ignored metadata.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--status-active-text)] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">DNS-rebinding protection</span>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Local CLI dashboard binds strictly to 127.0.0.1 and checks Host headers, blocking malicious websites from querying local endpoints.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--status-active-text)] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Clean URL redirection</span>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Tokens are redeemed into HttpOnly, SameSite cookies and redirected immediately so secret tokens are never left in browser history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Multiplayer Demo Apps */}
      <section className="py-16 border-t border-[var(--border-default)] bg-[var(--bg-canvas)]">
        <div className="max-w-5xl mx-auto px-6 sm:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <Badge variant="accent" className="mb-2">Live Sandbox + SDK Demos</Badge>
              <h2 className="text-2xl font-bold tracking-tight">Ready-to-use collaborative micro-tools</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Powered by <code className="font-mono">window.cloud.store</code> inside zero-trust sandboxed iframes. Open in two tabs to test live sync.
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Open Cloud Dashboard
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="flex flex-col justify-between">
              <CardContent className="pt-5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <Badge variant="active" dot>Multiplayer</Badge>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">/a/app-expense-demo</span>
                </div>
                <h3 className="font-semibold text-sm">Flatmate Expense Splitter</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Shared roommate ledger with automatic net settlement calculation and real-time expense logging.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/studio/app-expense-demo" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  Inspect in Studio
                </Link>
                <Link href="/a/app-expense-demo">
                  <Button variant="primary" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Launch App
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="flex flex-col justify-between">
              <CardContent className="pt-5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <Badge variant="active" dot>Multiplayer</Badge>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">/a/app-poll-demo</span>
                </div>
                <h3 className="font-semibold text-sm">Live Team Architecture Poll</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Instant team voting bars with percentage breakdowns and live synchronization across viewers.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/studio/app-poll-demo" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  Inspect in Studio
                </Link>
                <Link href="/a/app-poll-demo">
                  <Button variant="primary" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Launch App
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="flex flex-col justify-between">
              <CardContent className="pt-5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <Badge variant="active" dot>Multiplayer</Badge>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">/a/app-roster-demo</span>
                </div>
                <h3 className="font-semibold text-sm">Weekly Habit & Standup Roster</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Interactive Mon–Fri check-in matrix with live completion rate tracking for teams.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/studio/app-roster-demo" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  Inspect in Studio
                </Link>
                <Link href="/a/app-roster-demo">
                  <Button variant="primary" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Launch App
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--border-default)] py-10 px-6 sm:px-12 bg-[var(--bg-canvas)] text-xs text-[var(--text-muted)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
            <Shield className="w-4 h-4 text-[var(--accent)]" />
            <span>Small Software Cloud</span>
            <span className="text-[var(--text-faint)]">•</span>
            <span className="font-normal text-[var(--text-muted)]">Open source & self-hostable</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/quickstart" className="hover:text-[var(--text-primary)] transition-colors">
              Quickstart
            </Link>
            <Link href="/dev/components" className="hover:text-[var(--text-primary)] transition-colors">
              Component Kit
            </Link>
            <Link href="/studio" className="hover:text-[var(--text-primary)] transition-colors">
              Build from prompt
            </Link>
            <a
              href="https://github.com/Ali-HF/small-software-cloud"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1"
            >
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
