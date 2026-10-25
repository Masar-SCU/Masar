import * as React from 'react';
import {
  Button,
  Input,
  Textarea,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  ConfirmationModal,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui';
import { Sparkles, Trash2, ArrowRight } from 'lucide-react';

export function DesignSystemShowcase() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-h1 text-neutral-900 font-bold">Masar Design System</h1>
        <p className="text-b1 text-neutral-600 mt-1">
          Accessible UI components, Figma tokens, and WCAG AA validated states.
        </p>
      </div>

      {/* 1. Buttons */}
      <section className="space-y-4">
        <h2 className="text-h2 font-semibold text-neutral-900 border-b pb-2">1. Buttons</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="primary" isLoading>
            Saving
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Next Step
          </Button>
          <Button variant="outline" leftIcon={<Sparkles className="h-4 w-4 text-brand-600" />}>
            AI Recommendation
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 items-center pt-2">
          <Button size="sm" variant="primary">Small (sm)</Button>
          <Button size="md" variant="primary">Medium (md)</Button>
          <Button size="lg" variant="primary">Large (lg)</Button>
        </div>
      </section>

      {/* 2. Severity Badges */}
      <section className="space-y-4">
        <h2 className="text-h2 font-semibold text-neutral-900 border-b pb-2">
          2. Gap Engine Severity Badges (Icon + Word + Color)
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Badge variant="critical">Critical Gap</Badge>
          <Badge variant="moderate">Moderate Gap</Badge>
          <Badge variant="minor">Minor Gap</Badge>
          <Badge variant="met">Met (Satisfied)</Badge>
          <Badge variant="strength">Strength</Badge>
          <Badge variant="brand">Brand Chip</Badge>
          <Badge variant="neutral">Neutral Tag</Badge>
        </div>
      </section>

      {/* 3. Form Inputs */}
      <section className="space-y-4">
        <h2 className="text-h2 font-semibold text-neutral-900 border-b pb-2">3. Form Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Full Name"
            placeholder="e.g. Ahmed Yousef"
            helperText="Enter your official university registration name."
          />
          <Input
            type="search"
            label="Search Skills or Roles"
            placeholder="Search e.g. Docker, PostgreSQL, React..."
          />
          <Input
            type="password"
            label="Password"
            placeholder="Enter secure password"
            helperText="Click the eye icon to toggle visibility."
          />
          <Input
            label="University Email"
            defaultValue="invalid-email"
            error="Please enter a valid university email ending with @suez.edu.eg"
          />
          <div className="md:col-span-2">
            <Textarea
              label="Bio & Career Aspirations"
              placeholder="Tell us about the tracks and specializations you are interested in pursuing..."
              helperText="Maximum 500 characters."
            />
          </div>
        </div>
      </section>

      {/* 4. Cards */}
      <section className="space-y-4">
        <h2 className="text-h2 font-semibold text-neutral-900 border-b pb-2">4. Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Backend Development</CardTitle>
              <CardDescription>
                Strong SQL and C#. Gaps identified in Docker and integration testing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-b2 text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <span className="font-medium">Readiness Match:</span>
                <span className="font-bold text-brand-700">80 / 100</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Badge variant="brand">.NET Track</Badge>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </CardFooter>
          </Card>

          <Card isSelected selectedLabel="Your target">
            <CardHeader>
              <CardTitle>Data Engineering</CardTitle>
              <CardDescription>
                Matches your coursework in Database Design and Algorithms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-b2 text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <span className="font-medium">Readiness Match:</span>
                <span className="font-bold text-brand-700">85 / 100</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Badge variant="brand">Python Track</Badge>
              <Button size="sm" variant="primary">
                Active Roadmap
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 5. Modals & Dialogs */}
      <section className="space-y-4">
        <h2 className="text-h2 font-semibold text-neutral-900 border-b pb-2">5. Modal Dialogs</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open Confirmation Modal
          </Button>

          <Button
            variant="destructive"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete Account Modal
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Custom Form Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Your Privacy Choices</DialogTitle>
                <DialogDescription>
                  Manage your data sharing and research participation settings.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <Input label="Display Handle" placeholder="e.g. Anonymous Student" />
                <p className="text-caption text-neutral-500">
                  Both advisor view and research participation are opt-in.
                </p>
              </div>
              <DialogFooter>
                <Button variant="primary">Save Preferences</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Interactive Modals */}
        <ConfirmationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={() => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              setModalOpen(false);
            }, 1000);
          }}
          isLoading={isLoading}
          title="Change Your Target Career?"
          description="Your Roadmap and readiness score will be recalculated for the new specialization. You can switch back at any time."
          confirmText="Change Target"
        />

        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={() => {
            setDeleteModalOpen(false);
          }}
          variant="destructive"
          title="Delete Your Account?"
          description="Your profile, skills, and roadmap will be permanently deleted within 30 days. This action cannot be undone."
          confirmText="Delete Account"
        />
      </section>
    </div>
  );
}
