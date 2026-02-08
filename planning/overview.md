Project Overview (LLM Agent Context)
1) What this product is

This application is a multi-tenant SaaS for surveying companies to manage their day-to-day operations in a structured, trackable way instead of relying on spreadsheets/WhatsApp.

It is designed for a company owner (or admin) to:

set up their company once,

manage resources (people + equipment),

manage customers,

plan/record daily surveying work,

and keep everything organized under their company account.

2) Who uses it

Primary user persona:

Company Owner / Admin of a surveying company.

They register/login using:

email + password

phone
During onboarding, they must also provide:

company name (creates a Company record)

3) Multi-tenant model (core rule)

This is a B2B multi-tenant system.

Each user belongs to one company (at least initially).

Every major entity is scoped by company.

CompanyId is the top-level foreign key that must exist on all business entities (directly or indirectly).

Users must never access or see data belonging to another company.

4) Core entities (current scope)

These are the main domain objects:

Company

Created at registration (from company name).

Parent scope for everything else.

Workers

Employees/crew members used to execute daily jobs (surveyors, assistants, drivers, etc.)

Assigned to daily work.

Equipment

Surveying devices and tools owned/used by the company (e.g., total station, GPS, levels).

Assigned to daily work.

Customers

Clients who request work.

Can have contact info and related work history.

Daily Work (Main Workflow Entity)

The core operational record of what the company will do / did on a specific day.

Typically links:

customer(s)

worker(s)

equipment

date/time

location/notes/status

This is the primary object for tracking execution and productivity.

5) Product goals

Make daily operations easy to plan, assign, and track

Keep company data centralized and searchable

Reduce admin overhead for the owner

Provide a foundation for future features like reporting, invoicing, approvals, attachments, offline mobile, etc.

6) Non-goals (for now)

Unless explicitly stated in a task, assume we are not building:

complex accounting/invoicing

payroll

full CRM pipelines

advanced GIS processing

7) Key assumptions for tasks

When implementing or designing any feature:

Always include company scoping (companyId filtering, authorization checks).

The “owner” is the primary actor, and has permission to CRUD most entities.

Daily Work is the hub that connects workers/equipment/customers.