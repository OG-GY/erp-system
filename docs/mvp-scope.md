# MVP Scope (extracted from employee_management_system_feature_checklist.md §26-27)

Reference this file instead of the full checklist during day-to-day build work.
Only re-open the full checklist when a feature outside this list is being scoped.

## Company context
- 10 employees.
- Stack: Next.js App Router monolith (Route Handlers/Server Actions, no separate backend),
  Prisma + Supabase Postgres, Supabase Auth + Storage.
- Deploy target: Vercel (free tier) + Supabase (free tier).

## Must-Have Features (build first, in rough order)
1. Employee profiles
2. Employee accounts and logins
3. Roles and permissions
4. Departments and teams
5. Attendance
6. Check-in and check-out
7. Working-hour tracking
8. Project assignment
9. Task assignment
10. Payroll and salary slips
11. Leave management
12. Employee dashboard
13. Reports
14. Audit logs
15. Basic notifications

## Important Features (after must-haves)
1. Performance management
2. Expense management
3. Document management
4. Employee onboarding
5. Automated notifications
6. Asset management
7. Mobile access (responsive web is enough; no native app)
8. Advanced reports
9. Training and skills management
10. API access

## Explicitly out of scope for now (needs non-serverless infra later)
- Biometric device integration
- GPS/geofenced attendance
- Desktop time-tracking app / screenshot / activity monitoring
- Multi-company support

## Suggested core Prisma entities for MVP
Organization, User, Role, Employee, Department, Team, Designation,
EmploymentContract, SalaryStructure, SalaryHistory, PayrollPeriod, Payslip,
Allowance, Deduction, AttendanceRecord, Shift, WorkSchedule, Holiday,
LeaveType, LeaveBalance, LeaveRequest, Project, ProjectMember, Task,
TimeEntry, Timesheet, Announcement, Notification, ApprovalRequest, AuditLog.

## Roles (from checklist §2)
Super Admin, HR Manager, Department Manager, Project Manager, Team Lead,
Employee, Accountant, Auditor. For a 10-person company, start with a smaller
set (Super Admin, HR Manager, Manager, Employee) and extend only when needed.
