"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  Select,
  Switch,
  SegmentedControl,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Drawer,
  Modal,
  ToastProvider,
  useToast,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  CopyField,
  EmptyState,
  Skeleton,
  TableSkeleton,
  InlineAlert,
  CodeBlock,
  Stepper,
  useTheme,
} from "@/components/ui";
import {
  Shield,
  Key,
  Globe,
  Lock,
  Sun,
  Moon,
  Laptop,
  Terminal,
  FileCode,
  Folder,
  CheckCircle2,
  Trash2,
} from "lucide-react";

function ComponentsShowcaseContent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const toast = useToast();

  const [switchState, setSwitchState] = useState(true);
  const [segmentedValue, setSegmentedValue] = useState("static");
  const [tabValue, setTabValue] = useState("buttons");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [stepperIndex, setStepperIndex] = useState(1);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] p-6 sm:p-10 max-w-6xl mx-auto flex flex-col gap-10">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-md bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Component Kit</h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Design tokens & primitives preview • Calm, precise, trusted security aesthetics
          </p>
        </div>

        {/* Theme Controller */}
        <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-default)] p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setTheme("light")}
            data-testid="theme-light-btn"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
              theme === "light"
                ? "bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            data-testid="theme-dark-btn"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
              theme === "dark"
                ? "bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("system")}
            data-testid="theme-system-btn"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
              theme === "system"
                ? "bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>System ({resolvedTheme})</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <Tabs value={tabValue} onValueChange={setTabValue}>
        <TabsList>
          <TabsTrigger value="buttons">Buttons & Badges</TabsTrigger>
          <TabsTrigger value="forms">Form Controls</TabsTrigger>
          <TabsTrigger value="feedback">Feedback & Alerts</TabsTrigger>
          <TabsTrigger value="overlays">Overlays & Drawers</TabsTrigger>
          <TabsTrigger value="layout">Cards & Tables</TabsTrigger>
        </TabsList>

        {/* 1. BUTTONS & BADGES */}
        <TabsContent value="buttons" className="flex flex-col gap-8 pt-4">
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Buttons: Variants
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary Action</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>
                Revoke Link
              </Button>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Buttons: Sizes & States
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small (28px)</Button>
              <Button size="md">Medium (36px)</Button>
              <Button size="lg">Large (44px)</Button>
              <Button isLoading>Saving...</Button>
              <Button disabled>Disabled State</Button>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Badges: Status Pills
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="active" dot>
                Active
              </Badge>
              <Badge variant="restricted" dot>
                Restricted (Password)
              </Badge>
              <Badge variant="expired" dot>
                Expired
              </Badge>
              <Badge variant="revoked" dot>
                Revoked
              </Badge>
              <Badge variant="accent">Viewer Role</Badge>
              <Badge variant="default">12 Opens</Badge>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Stepper (Onboarding / Guided Flow)
            </h2>
            <Card>
              <CardContent className="flex flex-col gap-6">
                <Stepper
                  currentStep={stepperIndex}
                  steps={[
                    { id: "detect", label: "Detect Project", description: "Vite + React" },
                    { id: "target", label: "Choose Target", description: "Static Folder" },
                    { id: "rules", label: "Access Rules", description: "PIN Protection" },
                    { id: "done", label: "Live Link", description: "Ready to share" },
                  ]}
                />
                <div className="flex justify-between items-center pt-2">
                  <Button
                    size="sm"
                    disabled={stepperIndex === 0}
                    onClick={() => setStepperIndex((p) => Math.max(0, p - 1))}
                  >
                    Previous Step
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={stepperIndex === 3}
                    onClick={() => setStepperIndex((p) => Math.min(3, p + 1))}
                  >
                    Next Step
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* 2. FORMS & INPUTS */}
        <TabsContent value="forms" className="flex flex-col gap-8 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Text Inputs</CardTitle>
                <CardDescription>Single-line text inputs with labels, hints, and error states</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Input label="Link Name" placeholder="e.g. Client Demo - Acme Corp" hint="Give this link a memorable name" />
                <Input
                  label="Allowed Email"
                  placeholder="alice@company.com"
                  leftIcon={<Globe className="w-4 h-4" />}
                />
                <Input
                  label="Password Protected"
                  type="password"
                  error="Password must be at least 8 characters"
                  defaultValue="short"
                />
                <Input label="Disabled Field" disabled defaultValue="C:\Users\HP\projects\my-app" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Controls & Selects</CardTitle>
                <CardDescription>Select dropdowns, switches, and segmented selectors</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <Select
                  label="Expiry Rule"
                  options={[
                    { value: "0", label: "Never expires" },
                    { value: "1", label: "1 hour" },
                    { value: "24", label: "24 hours" },
                    { value: "168", label: "7 days" },
                  ]}
                />

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Protection Target</label>
                  <SegmentedControl
                    value={segmentedValue}
                    onChange={setSegmentedValue}
                    options={[
                      { value: "static", label: "Static folder", icon: <Folder className="w-3.5 h-3.5" /> },
                      { value: "url", label: "Existing URL", icon: <Globe className="w-3.5 h-3.5" /> },
                      { value: "port", label: "Local port", icon: <Terminal className="w-3.5 h-3.5" /> },
                    ]}
                  />
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <Switch
                    checked={switchState}
                    onChange={setSwitchState}
                    label="Require PIN code"
                    description="Visitors must supply a 4-digit numeric code before opening"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Copy-to-Clipboard Fields
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CopyField
                label="Generated Share Link"
                value="http://localhost:3001/s/C2iAapfVdHU2F2mX4hxUnRREiR-VbkYi"
              />
              <CopyField
                label="Origin Lock Secret Header (Masked)"
                isSecret
                value="X-SSC-Origin-Secret: 8f49a21b3e70d44c9b"
              />
            </div>
          </section>
        </TabsContent>

        {/* 3. FEEDBACK & ALERTS */}
        <TabsContent value="feedback" className="flex flex-col gap-6 pt-4">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Inline Alerts
            </h2>
            <InlineAlert variant="info" title="Origin Lock Recommended">
              Your existing URL is currently public. Add our verification header to prevent visitors from bypassing the gateway.
            </InlineAlert>
            <InlineAlert variant="warning" title="Link Expiring Soon">
              This link has 2 hours remaining before automatic revocation.
            </InlineAlert>
            <InlineAlert variant="error" title="Access Denied">
              Visitor entered an incorrect password 3 times in 60 seconds.
            </InlineAlert>
            <InlineAlert variant="success" title="Bundle Uploaded">
              Successfully synced 4 files (2.8 KB) to the gateway storage.
            </InlineAlert>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Interactive Toasts
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={() => toast.success("Share link created successfully")}>
                Trigger Success Toast
              </Button>
              <Button size="sm" onClick={() => toast.warning("Link is close to 10 view limit")}>
                Trigger Warning Toast
              </Button>
              <Button size="sm" onClick={() => toast.error("Could not reach gateway at localhost:3001")}>
                Trigger Error Toast
              </Button>
              <Button size="sm" onClick={() => toast.info("New visitor session recorded")}>
                Trigger Info Toast
              </Button>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Code Blocks
            </h2>
            <CodeBlock
              language="bash"
              title="Terminal Command"
              code="npx small-software-cloud share --dir ./my-project"
            />
          </section>
        </TabsContent>

        {/* 4. OVERLAYS & DRAWERS */}
        <TabsContent value="overlays" className="flex flex-col gap-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Dialogs & Slide-overs</CardTitle>
              <CardDescription>Keyboard accessible (Escape to close, background blur, focus trap)</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Open Centered Modal
              </Button>
              <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
                Open Slide-Over Drawer
              </Button>
            </CardContent>
          </Card>

          {/* Modal Demo */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Revoke Share Link?"
            description="Anyone attempting to open this link will immediately see a 403 Revoked notice."
            footer={
              <>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setIsModalOpen(false);
                    toast.success("Link has been permanently revoked");
                  }}
                >
                  Confirm Revoke
                </Button>
              </>
            }
          >
            <div className="text-xs text-[var(--text-secondary)] space-y-2">
              <p>Link: <code className="font-mono">QA Preview - Release 2.4</code></p>
              <p>Active sessions: <strong>3 current viewers</strong> will be disconnected.</p>
            </div>
          </Modal>

          {/* Drawer Demo */}
          <Drawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="Create Access Link"
            description="Configure custom security rules for this share link"
            footer={
              <>
                <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    toast.success("Link generated!");
                  }}
                >
                  Generate Link
                </Button>
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <Input label="Link Name" placeholder="e.g. Investor Pitch" />
              <Select
                label="Role"
                options={[
                  { value: "viewer", label: "Viewer (Read only)" },
                  { value: "commenter", label: "Commenter" },
                  { value: "editor", label: "Editor" },
                ]}
              />
              <Switch
                checked={true}
                onChange={() => {}}
                label="Expiry after 24 hours"
                description="Automatically revokes link 24h after first view"
              />
            </div>
          </Drawer>
        </TabsContent>

        {/* 5. CARDS & TABLES */}
        <TabsContent value="layout" className="flex flex-col gap-8 pt-4">
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Data Table
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link Name</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opens</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Client Preview</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">PIN: 8899</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="active" dot>Active</Badge>
                  </TableCell>
                  <TableCell>4 / 10</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">Copy</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Public Showcase</TableCell>
                  <TableCell>Public View</TableCell>
                  <TableCell>
                    <Badge variant="active" dot>Active</Badge>
                  </TableCell>
                  <TableCell>142</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">Copy</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Confidential Financials</TableCell>
                  <TableCell>Password Protected</TableCell>
                  <TableCell>
                    <Badge variant="revoked" dot>Revoked</Badge>
                  </TableCell>
                  <TableCell>1</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" disabled>Revoked</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Empty State Component
            </h2>
            <EmptyState
              icon={<Key className="w-5 h-5 text-[var(--text-muted)]" />}
              title="No Share Links Created Yet"
              description="Protect your build output or existing deployment with access-controlled links."
              action={<Button variant="primary">+ Create Your First Link</Button>}
            />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Loading Skeletons
            </h2>
            <TableSkeleton rows={3} />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ComponentsShowcasePage() {
  return (
    <ToastProvider>
      <ComponentsShowcaseContent />
    </ToastProvider>
  );
}
