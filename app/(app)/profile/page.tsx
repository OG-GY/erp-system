import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { requireEmployee } from "@/lib/auth";
import { employmentStatusLabel } from "@/lib/format";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

export default async function ProfilePage() {
  const employee = await requireEmployee();

  return (
    <>
      <PageHeader
        title="My profile"
        description="Personal details are editable below. Employment details are managed by HR/admin."
      />
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <section className="max-w-2xl rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground-muted">
            Photo
          </h2>
          <AvatarUploader
            fullName={employee.fullName}
            currentUrl={employee.profilePictureUrl}
          />
        </section>

        <section className="max-w-2xl rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground-muted">
            Employment details (admin-managed)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Full name" value={employee.fullName} />
            <ReadOnlyField label="Employee number" value={employee.employeeNumber} />
            <ReadOnlyField label="Official email" value={employee.officialEmail} />
            <ReadOnlyField label="Designation" value={employee.designation ?? "—"} />
            <ReadOnlyField
              label="Status"
              value={employmentStatusLabel(employee.employmentStatus)}
            />
            <ReadOnlyField
              label="Joining date"
              value={new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
              }).format(employee.joiningDate)}
            />
          </div>
        </section>

        <section className="max-w-2xl rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground-muted">
            Personal details
          </h2>
          <ProfileForm
            personalEmail={employee.personalEmail}
            phone={employee.phone}
            dateOfBirth={employee.dateOfBirth}
            gender={employee.gender}
            residentialAddress={employee.residentialAddress}
            emergencyContactName={employee.emergencyContactName}
            emergencyContactPhone={employee.emergencyContactPhone}
          />
        </section>

        <section className="max-w-2xl rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground-muted">
            Password
          </h2>
          <ChangePasswordForm />
        </section>
      </div>
    </>
  );
}
