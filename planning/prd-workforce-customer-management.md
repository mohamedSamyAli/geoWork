# Module PRD: Workforce & Customer Management
# Masah Platform - Supplementary Module Specification

**Document Version:** 1.1
**Last Updated:** February 8, 2026
**Document Owner:** Product Team
**Status:** Draft
**Parent PRD:** [prd.md](./prd.md)

---

## Table of Contents
1. [Module Overview](#1-module-overview)
2. [Worker Management](#2-worker-management)
3. [Customer Management](#3-customer-management)
4. [Cross-Module Integrations](#4-cross-module-integrations)
5. [Data Model Specifications](#5-data-model-specifications)
6. [UI/UX Specifications](#6-uiux-specifications)
7. [Open Questions](#7-open-questions)
8. [Appendices](#8-appendices)

---

## 1. Module Overview

### 1.1 Purpose
This document provides detailed specifications for two foundational modules of the Masah platform:
- **Worker Management** - Managing employees, their skills, compensation, and work assignments
- **Customer Management** - Managing clients, their contacts, sites, and project relationships

### 1.2 Scope
This module covers:
- Complete CRUD operations for Workers and Customers
- Worker skills, compensation, and availability tracking
- Customer contacts, sites, and work history
- Integration with Daily Work module
- Basic reporting and analytics

### 1.3 Relationship to Core Platform

```
┌─────────────────────────────────────────────────────────────────┐
│                     MASAH CORE PLATFORM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │    THIS      │      │   EQUIPMENT   │      │   DAILY      │  │
│  │    MODULE    │◄────►│   MANAGEMENT  │◄────►│    WORK      │  │
│  │              │      │              │      │              │  │
│  │  ┌────────┐  │      └──────────────┘      └──────────────┘  │
│  │  │Worker  │  │                                       ▲       │
│  │  │Management│ │                                       │       │
│  │  └────────┘  │                                       │       │
│  │  ┌────────┐  │                                       │       │
│  │  │Customer│  │───────────────────────────────────────┘       │
│  │  │Management│ │                                               │
│  │  └────────┘  │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Worker Management

### 2.1 Worker Profile Management

#### F2.1.1: Worker CRUD Operations
| Attribute | Details |
|-----------|---------|
| **Description** | Create, read, update, and delete worker records |
| **User Benefit** | Maintain complete workforce database |
| **Priority** | P0 (Must Have) |

**Worker Data Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| employee_id | String | Yes | Auto-generated, unique within tenant |
| first_name | String | Yes | 2-50 characters |
| last_name | String | Yes | 2-50 characters |
| display_name | String | No | Computed or custom |
| email | Email | No | Unique within tenant if provided |
| phone | String | No | International format support |
| date_of_birth | Date | No | Must be 16+ years old |
| hire_date | Date | Yes | Cannot be future date |
| termination_date | Date | No | Must be after hire_date if set |
| employee_role | Enum | Yes | Engineer, Surveyor, Assistant, Driver, Other |
| employment_status | Enum | Yes | Active, On Leave, Terminated |
| profile_image | URL | No | Stored in Supabase Storage |
| notes | Text | No | Max 1000 characters |

**Acceptance Criteria:**
- [ ] User can add new worker with required fields
- [ ] System auto-generates unique employee_id (e.g., EMP-0001)
- [ ] Validation prevents duplicate emails within tenant
- [ ] Worker cannot be deleted if assigned to active daily work
- [ ] Soft delete implemented for audit trail
- [ ] Bulk upload via CSV supported (P1)

#### F2.1.2: Worker Compensation Tracking
| Attribute | Details |
|-----------|---------|
| **Description** | Track worker payment structure and rates |
| **User Benefit** | Accurate cost calculation for daily work |
| **Priority** | P0 (Must Have) |

**Compensation Data Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| compensation_type | Enum | Yes | Daily Rate, Monthly Salary |
| daily_rate | Decimal | Conditional | Required if type = Daily Rate |
| monthly_salary | Decimal | Conditional | Required if type = Monthly Salary |
| currency | String | Yes | Default: SAR (configurable per tenant) |
| effective_date | Date | Yes | When this rate became effective |
| overtime_rate_multiplier | Decimal | No | Default: 1.5x |
| transport_allowance | Decimal | No | Daily transport allowance |
| housing_allowance | Decimal | No | Monthly housing allowance |

**Acceptance Criteria:**
- [ ] At least one compensation type must be specified
- [ ] Rate history is maintained (not overwritten)
- [ ] System calculates daily cost from monthly salary: (salary ÷ 30)
- [ ] Overtime calculation supported in daily work module
- [ ] Allowances are factored into daily cost calculations

#### F2.1.3: Skills & Proficiency Matrix
| Attribute | Details |
|-----------|---------|
| **Description** | Track worker certifications, skills, and proficiency levels |
| **User Benefit** | Match qualified workers to appropriate jobs |
| **Priority** | P1 (Should Have) |

**Predefined Skill Categories:**

| Category | Skills |
|----------|--------|
| **Equipment Operation** | Total Station, GPS/GNSS, Level, Laserscanner, Theodolite |
| **Software** | AutoCAD, Civil 3D, Revit, GIS Software |
| **Field Skills** | Topographic Survey, Boundary Survey, Construction Stakeout |
| **Certifications** | Licensed Surveyor, Safety Certified, First Aid |
| **Languages** | Arabic, English, Hindi, Urdu, Malayalam |

**Skill Proficiency Levels:**

| Level | Name | Description |
|-------|------|-------------|
| 1 | Beginner | Can work under supervision |
| 2 | Basic | Can handle routine tasks independently |
| 3 | Intermediate | Can handle most tasks, some supervision needed |
| 4 | Advanced | Fully independent, can train others |
| 5 | Expert | Can handle complex scenarios, lead projects |

**Acceptance Criteria:**
- [ ] Admin can define custom skills beyond predefined list
- [ ] Workers can have multiple skills with different proficiency levels
- [ ] Skill matrix view shows all workers and their skills
- [ ] Filter workers by skill and minimum proficiency
- [ ] Certification expiry tracking for time-limited certifications

#### F2.1.4: Worker Work History
| Attribute | Details |
|-----------|---------|
| **Description** | Track all work assignments and performance metrics |
| **User Benefit** | Understand worker utilization and performance |
| **Priority** | P1 (Should Have) |

**Work History Data Points:**

| Data Point | Description |
|------------|-------------|
| Total days worked | Aggregate count of assigned work days |
| Total revenue generated | Sum of revenue from jobs worker participated in |
| Total cost | Sum of worker compensation for all assigned work |
| Utilization rate | Days worked ÷ available working days |
| Average team size | Avg number of workers per job with this worker |
| Top customers | Most frequently worked with customers |
| Equipment proficiency | Most commonly used equipment |
| Performance rating | Optional supervisor ratings (future enhancement) |

**Acceptance Criteria:**
- [ ] Worker profile shows summarized work history
- [ ] Drill-down to individual daily work records
- [ ] Date range filtering for history reports
- [ ] Export work history to CSV/PDF

---

### 2.2 Worker Management Views

#### V2.1: Workers List View
**Purpose:** Browse, search, and manage all workers

**Layout:**
- **Filters:** Status, Role, Skill, Employment Date Range
- **Search:** Name, Email, Employee ID
- **Sort:** Name, Hire Date, Role, Status
- **Actions:** Add Worker, Bulk Import, Export

**Table Columns:**
| Column | Description |
|--------|-------------|
| Employee ID | Auto-generated identifier |
| Name | First + Last name |
| Role | Employee role |
| Status | Active/On Leave/Terminated |
| Skills | Top 3 skills displayed |
| Daily Rate/Salary | Current compensation |
| Days Worked (This Month) | Quick utilization metric |
| Actions | Edit, View, Delete |

#### V2.2: Worker Detail View
**Purpose:** Complete view of single worker profile with all related information

**Page Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Breadcrumbs: Workforce > Workers > Worker Name                │
├─────────────────────────────────────────────────────────────────┤
│  Header                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Worker Name (h4)           [Back] [Edit]                 │    │
│  │ Employee ID: EMP-0001                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  Main Grid (2 columns on desktop)                                │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ Worker Profile     │  │ Employment Status  │                │
│  │ Card               │  │ Card               │                │
│  │ - Photo            │  │ - Status Badge     │                │
│  │ - Name/Role        │  │ - Hire Date        │                │
│  │ - Contact Info     │  │ - Tenure           │                │
│  │ - Employee ID      │  │ - Actions          │                │
│  └────────────────────┘  └────────────────────┘                │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ Compensation Card  │  │ Quick Stats Card   │                │
│  │ - Type/Rate        │  │ - Days This Month  │                │
│  │ - Daily Cost Calc  │  │ - Total Revenue    │                │
│  │ - Allowances       │  │ - Utilization %    │                │
│  └────────────────────┘  └────────────────────┘                │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Skills & Certifications Card                            │     │
│  │ - Skill chips with proficiency indicators               │     │
│  │ - Certification list with expiry alerts                 │     │
│  │ - Add Skill button                                       │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Recent Work History Table                              │     │
│  │ - Date | Customer | Site | Equipment | Cost | Revenue    │     │
│  │ - View All button                                      │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**

**WorkerProfileCard:**
| Field | Display Format |
|-------|----------------|
| Profile Image | Circular avatar (default placeholder if none) |
| Name | First + Last name (h5) |
| Employee ID | Auto-generated ID (caption) |
| Role | Chip with role name |
| Email | Mailto link if available |
| Phone | Clickable phone number if available |
| Date of Birth | Age calculation (if available) |

**EmploymentStatusCard:**
| Field | Display Format |
|-------|----------------|
| Status | Color-coded badge (Active=green, On Leave=orange, Terminated=gray) |
| Hire Date | Formatted date |
| Tenure | Calculated duration (e.g., "2 years 3 months") |
| Termination Date | Shown if terminated |
| Actions | Change Status button (opens modal) |

**CompensationCard:**
| Field | Display Format |
|-------|----------------|
| Type | "Daily Rate" or "Monthly Salary" badge |
| Rate | Currency formatted (e.g., "SAR 500/day" or "SAR 15,000/month") |
| Calculated Daily Cost | For salary: (salary ÷ 30) + daily allowances |
| Transport Allowance | Daily amount if set |
| Housing Allowance | Monthly amount if set |
| Overtime Multiplier | e.g., "1.5x" |
| Effective Date | "Since [date]" |
| Actions | View History button (opens compensation history modal) |

**QuickStatsCard:**
| Metric | Description | Calculation |
|--------|-------------|-------------|
| Days This Month | Days worked in current month | COUNT(work_records WHERE month=current) |
| Total Revenue | Revenue from jobs this worker participated in | SUM(work.revenue) WHERE worker assigned |
| Utilization | Days worked ÷ available working days | (days_worked ÷ working_days) × 100% |
| Avg Team Size | Average number of workers per job | AVG(team_size) per worker's jobs |

**SkillsCard:**
- **Layout:** Grid of skill chips
- **Skill Chip Display:**
  - Skill name
  - Proficiency dots (1-5 filled circles)
  - Certification badge if certified
  - Expiry warning if certification expiring < 30 days
- **Actions:** Add Skill button (opens skill selection modal)

**RecentWorkHistoryTable:**
| Column | Description |
|--------|-------------|
| Date | Work date |
| Customer | Customer name (clickable to customer view) |
| Site | Site name (clickable to site detail) |
| Equipment | Comma-separated equipment list |
| Cost | Worker's cost for this work |
| Revenue | Revenue from this work |
| Actions | View button (to daily work detail) |

**Page Actions:**
| Button | Action | Destination |
|--------|--------|-------------|
| Back | Navigate back | `/workers` |
| Edit | Edit worker | `/workers/:id/edit` |
| Change Status | Open status modal | Modal overlay |
| Delete | Archive worker | Confirmation dialog → soft delete |

**Data Fetching Requirements:**
```
Query: useWorkerDetail(workerId)
  - Returns: Worker with relations (compensation, skills)
  - Loading state: Show skeleton cards
  - Error state: Show alert with retry

Query: useWorkerStats(workerId, period)
  - Returns: Quick stats for current month
  - Optional: Custom date range

Query: useWorkerRecentWork(workerId, limit=5)
  - Returns: Recent 5 daily work records
  - Pagination: Link to full work history
```

**State Management:**
- Local modals: Change Status, Add Skill, Compensation History
- No global state needed for view page
- Refetch worker detail after mutations

**Loading States:**
- Initial load: Skeleton cards matching actual layout
- Individual card loading: Skeleton for that card only
- Button loading: Show loading spinner during mutations

**Error States:**
- Worker not found: Alert + Back button
- Permission denied: Alert with message
- Partial failure: Show inline error in affected card

**Acceptance Criteria:**
- [ ] Page loads with all worker information
- [ ] Profile card displays photo, name, role, contact info
- [ ] Employment status shows current state with color-coded badge
- [ ] Compensation card shows current rate with calculated daily cost
- [ ] Quick stats show real-time data for current month
- [ ] Skills display as chips with proficiency indicators
- [ ] Recent work history shows last 5 jobs
- [ ] All cards handle loading and error states
- [ ] Back and Edit buttons navigate correctly
- [ ] Page is responsive (stacked on mobile, 2-column on desktop)
- [ ] Terminated workers show termination date and gray badge

---

## 3. Customer Management

### 3.1 Customer Profile Management

#### F3.1.1: Customer CRUD Operations
| Attribute | Details |
|-----------|---------|
| **Description** | Create, read, update, and delete customer records |
| **User Benefit** | Centralized client database |
| **Priority** | P0 (Must Have) |

**Customer Data Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| customer_id | String | Yes | Auto-generated, unique (e.g., CUST-0001) |
| company_name | String | Yes | 2-100 characters |
| customer_type | Enum | Yes | Government, Private, Individual |
| tax_id | String | No | VAT/Tax registration number |
| registration_number | String | No | Commercial registration |
| billing_address | Text | No | Street, city, postal code |
| billing_email | Email | No | For invoicing |
| billing_phone | String | No | For billing inquiries |
| payment_terms | Enum | No | Net 15, Net 30, Net 60, On Delivery |
| credit_limit | Decimal | No | Maximum outstanding balance |
| status | Enum | Yes | Active, Inactive, On Hold |
| assigned_account_manager | Worker ID | No | Primary contact person |
| notes | Text | No | Max 2000 characters |

**Acceptance Criteria:**
- [ ] User can add customer with required fields
- [ ] System auto-generates unique customer_id
- [ ] Company name must be unique within tenant
- [ ] Customer cannot be deleted if has active sites or daily work
- [ ] Soft delete with audit trail
- [ ] Bulk import via CSV (P1)

#### F3.1.2: Contact Persons Management
| Attribute | Details |
|-----------|---------|
| **Description** | Manage multiple contacts per customer |
| **User Benefit** | Track key stakeholders and decision makers |
| **Priority** | P0 (Must Have) |

**Contact Data Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| contact_id | String | Yes | Auto-generated |
| customer_id | String | Yes | FK to customers |
| first_name | String | Yes | 2-50 characters |
| last_name | String | Yes | 2-50 characters |
| title | String | No | Job title |
| role | Enum | No | Decision Maker, Site Supervisor, Billing Contact, Technical Contact |
| email | Email | No | |
| phone | String | No | Primary contact number |
| mobile | String | No | Secondary contact number |
| is_primary | Boolean | Yes | Only one per customer |
| is_active | Boolean | Yes | Soft delete flag |
| notes | Text | No | Max 500 characters |

**Acceptance Criteria:**
- [ ] Each customer can have multiple contacts
- [ ] One contact must be marked as primary
- [ ] Primary designation auto-transfers on deletion
- [ ] Contact history shows interactions (future enhancement)

#### F3.1.3: Site Management
| Attribute | Details |
|-----------|---------|
| **Description** | Track work locations for each customer |
| **User Benefit** | Organize work by physical location |
| **Priority** | P0 (Must Have) |

**Site Data Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| site_id | String | Yes | Auto-generated (e.g., SITE-0001) |
| customer_id | String | Yes | FK to customers |
| site_name | String | Yes | 2-100 characters |
| site_code | String | No | Short customer reference code |
| address | Text | Yes | Full address |
| city | String | Yes | |
| region | String | No | State/Province/Region |
| postal_code | String | No | |
| latitude | Decimal | No | For mapping/field navigation |
| longitude | Decimal | No | For mapping/field navigation |
| site_type | Enum | No | Construction Site, Industrial, Residential, Road, Other |
| status | Enum | Yes | Active, Completed, On Hold |
| site_contact_id | String | No | FK to contacts (site-specific contact) |
| notes | Text | No | Max 1000 characters |

**Acceptance Criteria:**
- [ ] Each customer can have multiple sites
- [ ] Site names must be unique within customer
- [ ] Geographic coordinates optional but recommended for field app
- [ ] Site can be linked to specific contact person
- [ ] Sites can be deactivated without losing historical data

### 3.2 Customer Analytics

#### F3.2.1: Customer Work History
| Attribute | Details |
|-----------|---------|
| **User Benefit** | Understand customer value and relationship health |
| **Priority** | P1 (Should Have) |

**Customer Metrics Dashboard:**

| Metric | Description | Calculation |
|--------|-------------|-------------|
| Total Revenue | All-time revenue from customer | SUM(work.revenue) |
| Total Jobs | Number of work records | COUNT(work.id) |
| Average Job Value | Mean revenue per job | Revenue ÷ Jobs |
| Profit Margin | Profitability percentage | (Revenue - Cost) ÷ Revenue |
| Last Work Date | Most recent activity | MAX(work.date) |
| Active Sites | Current active site count | COUNT(sites WHERE status=Active) |
| Outstanding Balance | Unpaid amounts | SUM(pending payments) |
| Days Since Last Contact | Relationship health | TODAY - Last communication |

**Acceptance Criteria:**
- [ ] Customer profile shows key metrics at glance
- [ ] Date range filtering for analytics
- [ ] Comparison view (period over period)
- [ ] Export customer statement

#### F3.2.2: Site Work History
| Attribute | Details |
|-----------|---------|
| **User Benefit** | Track work patterns at specific locations |
| **Priority** | P1 (Should Have) |

**Site-Specific Metrics:**

| Metric | Description |
|--------|-------------|
| Total days worked at site | COUNT of daily work records |
| Total revenue for site | SUM(work.revenue) |
| Most used equipment | Top equipment by assignment count |
| Most assigned workers | Top workers by days assigned |
| First work date | MIN(work.date) |
| Last work date | MAX(work.date) |
| Site status progression | Timeline of status changes |

---

### 3.3 Customer Management Views

#### V3.1: Customers List View
**Purpose:** Browse, search, and manage all customers

**Layout:**
- **Filters:** Status, Type, Region, Active Sites
- **Search:** Company Name, Customer ID, Tax ID
- **Sort:** Name, Revenue, Last Work Date, Status
- **Actions:** Add Customer, Bulk Import, Export

**Table Columns:**
| Column | Description |
|--------|-------------|
| Customer ID | Auto-generated identifier |
| Company Name | Customer company |
| Type | Government/Private/Individual |
| Status | Active/Inactive/On Hold |
| Active Sites | Count of active sites |
| Total Revenue | All-time revenue |
| Last Work | Most recent work date |
| Actions | Edit, View, Delete |

#### V3.2: Customer Detail View
**Purpose:** Complete view of single customer profile with all related information

**Page Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Breadcrumbs: Customers > Customer Name                         │
├─────────────────────────────────────────────────────────────────┤
│  Header                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Company Name (h4)         [Back] [Edit] [More Actions ▼] │    │
│  │ Customer ID: CUST-0001 | Type: Government | Active        │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  Key Metrics Banner                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │ Total  │ │ Total  │ │ Profit │ │Active  │ │ Last   │        │
│  │Revenue │ │  Jobs  │ │ Margin │ │ Sites  │ │ Work   │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
├─────────────────────────────────────────────────────────────────┤
│  Main Grid (2 columns on desktop)                                │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ Company Info Card  │  │ Primary Contact    │                │
│  │ - Type/Badges      │  │ Card               │                │
│  │ - Registration     │  │ - Name/Title       │                │
│  │ - Tax ID           │  │ - Email/Phone      │                │
│  │ - Account Manager  │  │ - Actions          │                │
│  └────────────────────┘  └────────────────────┘                │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ Billing Info Card  │  │ Payment Terms      │                │
│  │ - Address          │  │ Card               │                │
│  │ - Email/Phone      │  │ - Terms            │                │
│  │ - Tax ID           │  │ - Credit Limit     │                │
│  │ - Edit button      │  │ - Outstanding Bal. │                │
│  └────────────────────┘  └────────────────────┘                │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Sites Summary Card                                     │     │
│  │ - Active sites count                                   │     │
│  │ - Site list (top 5) with status                        │     │
│  │ - View All Sites button                                │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Contact Persons Card                                   │     │
│  │ - List of all contacts with roles                      │     │
│  │ - Primary contact highlighted                          │     │
│  │ - Add Contact button                                   │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Revenue Chart (Last 12 months)                         │     │
│  │ - Bar chart showing monthly revenue                    │     │
│  │ - Cost vs Revenue comparison                           │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Recent Work History Table                              │     │
│  │ - Date | Site | Description | Cost | Revenue | Profit   │     │
│  │ - View All button                                      │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**

**Header Section:**
| Element | Description |
|---------|-------------|
| Company Name | Customer company name (h4) |
| Subtitle | Customer ID | Type | Status badges |
| Back Button | Navigate to customers list |
| Edit Button | Navigate to edit page |
| More Actions | Dropdown with: Add Contact, Add Site, View Documents, Export Statement |

**Key Metrics Banner:**
| Metric | Description | Calculation |
|--------|-------------|-------------|
| Total Revenue | All-time revenue | SUM(work.revenue) |
| Total Jobs | Count of all work records | COUNT(work.id) |
| Profit Margin | Average profitability | AVG((revenue-cost)/revenue) |
| Active Sites | Currently active sites | COUNT(sites WHERE status='Active') |
| Last Work | Most recent work date | MAX(work.date) or "Never" |

**CompanyInfoCard:**
| Field | Display Format |
|-------|----------------|
| Company Name | Large text with icon |
| Customer Type | Badge (Government=blue, Private=green, Individual=gray) |
| Status | Badge (Active=green, Inactive=gray, On Hold=orange) |
| Registration # | Commercial registration number |
| Tax ID | VAT/tax registration |
| Account Manager | Worker name if assigned (clickable) |
| Created Date | "Customer since [date]" |
| Actions | Edit Company button |

**PrimaryContactCard:**
| Field | Display Format |
|-------|----------------|
| Name | Primary contact full name |
| Title | Job title |
| Role Badge | Decision Maker, Site Supervisor, etc. |
| Email | Mailto link |
| Phone | Clickable tel link |
| Mobile | Clickable tel link |
| Actions | View All Contacts, Edit Contact |

**BillingInfoCard:**
| Field | Display Format |
|-------|----------------|
| Billing Address | Full address with icon |
| Billing Email | Mailto link |
| Billing Phone | Clickable tel link |
| Tax ID | VAT number |
| Actions | Edit Billing button |

**PaymentTermsCard:**
| Field | Display Format |
|-------|----------------|
| Payment Terms | "Net 30", "On Delivery", etc. |
| Credit Limit | Currency amount |
| Outstanding Balance | Calculated pending payments (red if > credit limit) |
| Last Payment | Date and amount of most recent payment |
| Actions | View Payment History button |

**SitesSummaryCard:**
- **Active Sites Count:** Large number with label
- **Site List (top 5):**
  | Column | Description |
  |--------|-------------|
  | Site Name | Name with link to site detail |
  | City | Location city |
  | Status | Badge (Active/Completed/On Hold) |
  | Last Work | Date of most recent work |
- **Actions:** View All Sites button, Add Site button

**ContactPersonsCard:**
- **Layout:** List or table of all contacts
- **Columns:** Name, Role, Email, Phone, Primary (star icon)
- **Actions:** Add Contact button (opens modal), Edit/Delete per row

**RevenueChartCard:**
- **Chart Type:** Bar chart (revenue) + Line (cost)
- **X-Axis:** Last 12 months
- **Y-Axis:** Currency amount
- **Legend:** Revenue (blue bars), Cost (orange line), Profit (green line)
- **Tooltip:** Show exact amounts on hover
- **Empty State:** "No revenue data available yet"

**RecentWorkHistoryTable:**
| Column | Description |
|--------|-------------|
| Date | Work date |
| Site | Site name (clickable) |
| Description | Work description |
| Workers | Count or list of workers |
| Equipment | Count or list of equipment |
| Cost | Total job cost |
| Revenue | Job revenue |
| Profit | Revenue - Cost (color-coded) |
| Actions | View button |

**Page Actions:**
| Button | Action | Destination |
|--------|--------|-------------|
| Back | Navigate back | `/customers` |
| Edit | Edit customer | `/customers/:id/edit` |
| Add Contact | Open contact modal | Modal overlay |
| Add Site | Open site modal | Modal overlay |
| Export | Export statement | PDF/CSV download |
| Delete | Archive customer | Confirmation dialog |

**Data Fetching Requirements:**
```
Query: useCustomerDetail(customerId)
  - Returns: Customer with relations (contacts, sites, accountManager)
  - Loading state: Show skeleton cards
  - Error state: Show alert with retry

Query: useCustomerMetrics(customerId)
  - Returns: Total revenue, jobs, margin, active sites, last work
  - Cache: 5 minutes

Query: useCustomerRevenueChart(customerId, months=12)
  - Returns: Monthly revenue/cost data for chart
  - Cache: 15 minutes

Query: useCustomerRecentWork(customerId, limit=5)
  - Returns: Recent 5 daily work records
  - Pagination: Link to full work history

Query: useCustomerOutstandingBalance(customerId)
  - Returns: Calculated pending payments
  - Real-time: No cache
```

**Modals:**

**AddContactModal:**
| Field | Type | Required |
|-------|------|----------|
| First Name | Text | Yes |
| Last Name | Text | Yes |
| Title | Text | No |
| Role | Select | No |
| Email | Email | No |
| Phone | Text | No |
| Mobile | Text | No |
| Is Primary | Checkbox | No (auto-first if no primary) |
| Notes | Textarea | No |

**AddSiteModal:**
| Field | Type | Required |
|-------|------|----------|
| Site Name | Text | Yes |
| Site Code | Text | No |
| Address | Textarea | Yes |
| City | Text | Yes |
| Region | Text | No |
| Postal Code | Text | No |
| Latitude | Number | No |
| Longitude | Number | No |
| Site Type | Select | No |
| Site Contact | Select (from contacts) | No |
| Notes | Textarea | No |

**State Management:**
- Local modals: Add Contact, Add Site, Change Status
- No global state needed for view page
- Refetch customer detail after mutations

**Loading States:**
- Initial load: Skeleton cards matching actual layout
- Individual card loading: Skeleton for that card only
- Button loading: Show loading spinner during mutations
- Chart loading: Show skeleton chart

**Error States:**
- Customer not found: Alert + Back button
- Permission denied: Alert with message
- Partial failure: Show inline error in affected card

**Responsive Behavior:**
| Screen Size | Layout |
|-------------|--------|
| Desktop (>1200px) | 2-column grid for cards |
| Tablet (768-1200px) | Single column, some cards side-by-side |
| Mobile (<768px) | Fully stacked, metrics scrollable horizontally |

**Acceptance Criteria:**
- [ ] Page loads with all customer information
- [ ] Key metrics banner shows accurate real-time data
- [ ] Company info card displays all registration details
- [ ] Primary contact card highlights main contact person
- [ ] Billing info shows complete billing details
- [ ] Payment terms card shows terms, credit limit, outstanding balance
- [ ] Sites summary shows active count and top 5 sites
- [ ] Contact persons card lists all contacts with primary highlighted
- [ ] Revenue chart displays last 12 months of data
- [ ] Recent work history shows last 5 jobs
- [ ] All cards handle loading and error states
- [ ] Add Contact and Add Site modals open and submit correctly
- [ ] Page is responsive across all breakpoints
- [ ] Export statement generates PDF/CSV
- [ ] Outstanding balance alerts when exceeding credit limit

#### V3.3: Sites List View
**Purpose:** Browse all sites across customers

**Layout:**
- **Filters:** Customer, Status, City, Site Type
- **Search:** Site Name, Site Code, Address
- **Sort:** Name, Last Work Date, Status

**Table Columns:**
| Column | Description |
|--------|-------------|
| Site ID | Auto-generated identifier |
| Site Name | Site name |
| Customer | Linked customer |
| City | Location city |
| Status | Active/Completed/On Hold |
| Last Work | Most recent work date |
| Actions | Edit, View, Work History |

#### V3.4: Site Detail View
**Purpose:** Complete view of a single customer site

**Page Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Breadcrumbs: Customers > [Customer] > Sites > Site Name        │
├─────────────────────────────────────────────────────────────────┤
│  Header                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Site Name (h4)             [Back] [Edit] [On Map]        │    │
│  │ Site Code: SITE-001 | Customer: [Company Name]           │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  Key Metrics Banner                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│  │ Total  │ │ Total  │ │ First  │ │ Last   │                  │
│  │ Days   │ │Revenue │ │  Work  │ │  Work  │                  │
│  └────────┘ └────────┘ └────────┘ └────────┘                  │
├─────────────────────────────────────────────────────────────────┤
│  Main Grid (2 columns on desktop)                                │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ Location Info Card │  │ Site Contact Card   │                │
│  │ - Address          │  │ - Contact Name      │                │
│  │ - City/Region      │  │ - Role             │                │
│  │ - Coordinates      │  │ - Email/Phone      │                │
│  │ - Map Link         │  │ - Actions          │                │
│  └────────────────────┘  └────────────────────┘                │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ Site Status Card   │  │ Site Metrics Card  │                │
│  │ - Status Badge     │  │ - Most Used Equip. │                │
│  │ - Site Type        │  │ - Top Workers      │                │
│  │ - Customer Link    │  │ - Avg Job Value    │                │
│  └────────────────────┘  └────────────────────┘                │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Revenue Timeline (Last 12 months)                      │     │
│  │ - Bar chart showing work activity by month             │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Site Work History Table                                │     │
│  │ - Date | Description | Workers | Equipment | Cost | Rev │     │
│  │ - View All button                                      │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**

**Header Section:**
| Element | Description |
|---------|-------------|
| Site Name | Site name (h4) |
| Subtitle | Site Code \| Customer name (clickable link) |
| Back Button | Navigate to sites list or customer sites |
| Edit Button | Navigate to edit page |
| On Map Button | Open map modal with coordinates (if available) |

**Key Metrics Banner:**
| Metric | Description | Calculation |
|--------|-------------|-------------|
| Total Days | Sum of all work days at site | COUNT(work_records WHERE site=X) |
| Total Revenue | All revenue from this site | SUM(work.revenue WHERE site=X) |
| First Work | Date of first work at site | MIN(work.date WHERE site=X) |
| Last Work | Date of most recent work | MAX(work.date WHERE site=X) or "Never" |

**LocationInfoCard:**
| Field | Display Format |
|-------|----------------|
| Site Name | Large text |
| Site Code | Monospace font |
| Address | Full address with icon |
| City | City name |
| Region/State | Region if available |
| Postal Code | Postal code |
| Coordinates | "Lat: X, Long: Y" or "Not set" |
| Map Link | Opens Google Maps with coordinates |
| Actions: |
| - Open in Maps | External link to Google Maps |
| - Edit Location | Opens edit modal for coordinates |

**SiteContactCard:**
| Field | Display Format |
|-------|----------------|
| Contact Name | Full name (or "No contact assigned") |
| Title | Job title if available |
| Role Badge | Contact role |
| Email | Mailto link |
| Phone | Clickable tel link |
| Actions: |
| - Change Contact | Select from customer contacts |
| - View Contact Details | Open contact modal |

**SiteStatusCard:**
| Field | Display Format |
|-------|----------------|
| Status | Badge (Active=green, Completed=blue, On Hold=orange) |
| Site Type | Badge (Construction, Industrial, etc.) |
| Customer | Customer name with link to customer detail |
| Created Date | "Site added on [date]" |
| Notes | Site notes if available |
| Actions: |
| - Change Status | Quick status change dropdown |

**SiteMetricsCard:**
| Metric | Description |
|--------|-------------|
| Most Used Equipment | Top 3 equipment by usage count |
| Top Workers | Top 3 workers by days assigned |
| Average Job Value | Avg revenue per job |
| Total Jobs | Count of jobs |

**WorkHistoryTable:**
| Column | Description |
|--------|-------------|
| Date | Work date |
| Description | Work description |
| Workers | Count (with tooltip showing names) |
| Equipment | Count (with tooltip showing names) |
| Cost | Total job cost |
| Revenue | Job revenue |
| Profit | Color-coded (green/red) |
| Actions | View button to daily work detail |

**Page Actions:**
| Button | Action | Destination |
|--------|--------|-------------|
| Back | Navigate back | Previous page or customer sites |
| Edit | Edit site | `/sites/:id/edit` |
| On Map | Open map | Google Maps or map modal |
| Create Work | Create daily work for this site | `/work/create?site=:id` |
| View Customer | Go to customer detail | `/customers/:id` |

**Data Fetching Requirements:**
```
Query: useSiteDetail(siteId)
  - Returns: Site with relations (customer, contact)
  - Loading state: Show skeleton cards
  - Error state: Show alert with retry

Query: useSiteMetrics(siteId)
  - Returns: Total days, revenue, first/last work, equipment usage
  - Cache: 5 minutes

Query: useSiteWorkHistory(siteId, limit=10)
  - Returns: Recent work at this site
  - Pagination: Load more button
```

**Map Modal:**
- **Provider:** Google Maps Embed API or Leaflet
- **Display:** Pin at site coordinates
- **Actions:**
  - Open in Google Maps (external)
  - Copy coordinates
  - Update coordinates (admin only)

**Acceptance Criteria:**
- [ ] Page loads with all site information
- [ ] Location card shows address and coordinates
- [ ] Map link opens correct location
- [ ] Site contact shows assigned contact or empty state
- [ ] Metrics show accurate totals and dates
- [ ] Work history shows jobs at this site
- [ ] Status badge reflects current state
- [ ] Customer link navigates to customer detail
- [ ] Create Work button pre-fills site selection
- [ ] Page is responsive across all breakpoints

---

## 4. Cross-Module Integrations

### 4.1 Integration with Daily Work Module

#### I4.1: Worker Assignment
- **Direction:** Workers → Daily Work
- **Data Flow:** Worker compensation rates used for cost calculation
- **Validation:**
  - Only Active workers can be assigned
  - Worker availability checked (future: calendar integration)
  - Skills matched to job requirements (future: auto-match)

#### I4.2: Customer/Site Linking
- **Direction:** Customers/Sites → Daily Work
- **Data Flow:** Customer and site selected for each work record
- **Validation:**
  - Only Active customers can be selected
  - Site must belong to selected customer
  - Inactive sites show warning but allowed (recurring work)

#### I4.3: Cost & Revenue Attribution
- **Direction:** Daily Work → Workers/Customers
- **Data Flow:** Completed work updates metrics on both entities
- **Updates:**
  - Worker: days worked, revenue contributed, utilization
  - Customer/Site: revenue, jobs count, profit margin
  - Last work date refreshed

### 4.2 Integration with Reporting Module

#### R4.1: Worker Utilization Report
- **Data Source:** Workers + Daily Work assignments
- **Metrics:** Days worked, idle days, overtime, cost per worker
- **Grouping:** By worker, by role, by skill set

#### R4.2: Customer Profitability Report
- **Data Source:** Customers + Daily Work
- **Metrics:** Revenue, costs, profit margin by customer
- **Grouping:** By customer, by site, by time period

#### R4.3: Skills Gap Analysis
- **Data Source:** Worker skills + equipment requirements
- **Purpose:** Identify skill shortages for upcoming work

---

## 5. Data Model Specifications

### 5.1 Workers Table

```sql
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id VARCHAR(20) UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  hire_date DATE NOT NULL,
  termination_date DATE,
  employee_role VARCHAR(50) NOT NULL,
  employment_status VARCHAR(20) NOT NULL DEFAULT 'Active',
  profile_image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  CONSTRAINT chk_employment_dates CHECK (termination_date IS NULL OR termination_date > hire_date),
  CONSTRAINT uq_worker_email_tenant UNIQUE (tenant_id, email)
);
```

### 5.2 Worker Compensation Table

```sql
CREATE TABLE worker_compensation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id),
  compensation_type VARCHAR(20) NOT NULL,
  daily_rate DECIMAL(10,2),
  monthly_salary DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'SAR',
  effective_date DATE NOT NULL,
  end_date DATE,
  overtime_rate_multiplier DECIMAL(3,2) DEFAULT 1.5,
  transport_allowance_daily DECIMAL(10,2),
  housing_allowance_monthly DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_compensation_type CHECK (
    (compensation_type = 'Daily Rate' AND daily_rate IS NOT NULL) OR
    (compensation_type = 'Monthly Salary' AND monthly_salary IS NOT NULL)
  )
);
```

### 5.3 Worker Skills Table

```sql
CREATE TABLE worker_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id),
  skill_id UUID NOT NULL REFERENCES skills(id),
  proficiency_level INTEGER NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
  certified BOOLEAN DEFAULT FALSE,
  certification_number VARCHAR(100),
  certification_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_worker_skill UNIQUE (worker_id, skill_id)
);
```

### 5.4 Customers Table

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id VARCHAR(20) UNIQUE,
  company_name VARCHAR(100) NOT NULL,
  customer_type VARCHAR(20) NOT NULL,
  tax_id VARCHAR(50),
  registration_number VARCHAR(50),
  billing_address TEXT,
  billing_email VARCHAR(255),
  billing_phone VARCHAR(20),
  payment_terms VARCHAR(20),
  credit_limit DECIMAL(12,2),
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  assigned_account_manager UUID REFERENCES workers(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  CONSTRAINT uq_customer_name_tenant UNIQUE (tenant_id, company_name)
);
```

### 5.5 Customer Contacts Table

```sql
CREATE TABLE customer_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  title VARCHAR(100),
  role VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_primary_contact UNIQUE (customer_id, is_primary)
);
```

### 5.6 Customer Sites Table

```sql
CREATE TABLE customer_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  site_id VARCHAR(20) UNIQUE,
  site_name VARCHAR(100) NOT NULL,
  site_code VARCHAR(20),
  address TEXT NOT NULL,
  city VARCHAR(50) NOT NULL,
  region VARCHAR(50),
  postal_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  site_type VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  site_contact_id UUID REFERENCES customer_contacts(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  CONSTRAINT uq_site_name_customer UNIQUE (customer_id, site_name)
);
```

---

## 6. UI/UX Specifications

### 6.1 Worker Management UI

#### Worker List Page
- **Navigation:** Sidebar → Workforce → Workers
- **Layout:** Data table with expandable rows
- **Quick Actions:** Add Worker button (top right)
- **Row Actions:** Hover reveal (Edit, View, Archive)

#### Worker Form (Add/Edit)
- **Layout:** Multi-section form with tabs
- **Sections:**
  1. Basic Information
  2. Employment Details
  3. Compensation
  4. Skills (multi-select with proficiency sliders)
- **Validation:** Real-time with inline error messages
- **Save Actions:** Save & Close, Save & Add Another

#### Worker Profile View
- **Layout:** Profile card + tabbed content
- **Profile Card:** Photo, name, role, status badge, key stats
- **Tab Navigation:** Overview, Skills, Work History, Documents

### 6.2 Customer Management UI

#### Customer List Page
- **Navigation:** Sidebar → Customers
- **Layout:** Data table with customer summary
- **Quick Actions:** Add Customer button (top right)
- **Row Actions:** Hover reveal (Edit, View, Archive)

#### Customer Form (Add/Edit)
- **Layout:** Multi-section form
- **Sections:**
  1. Company Information
  2. Billing Details
  3. Payment Terms
- **Related Actions:** Add Contact, Add Site (after customer created)

#### Customer Detail View
- **Layout:** Header with metrics + tabbed content
- **Header:** Company name, type, status, key metrics (revenue, jobs, margin)
- **Tab Navigation:** Overview, Contacts, Sites, Work History, Documents

### 6.3 Responsive Design

| Screen Size | Workers List | Customer List | Detail Views |
|-------------|--------------|---------------|--------------|
| Desktop (>1200px) | Full table with all columns | Full table with all columns | 2-column layout |
| Tablet (768-1200px) | Table with horizontal scroll | Table with horizontal scroll | Single column, tabs |
| Mobile (<768px) | Card view | Card view | Stacked sections |

---

## 7. Open Questions

| # | Question | Owner | Due Date | Status |
|---|----------|-------|----------|--------|
| 1 | Should workers be able to log in to view their own assignments? | Product | TBD | Open |
| 2 | Do we need to track worker attendance separate from daily work? | Product | TBD | Open |
| 3 | Should customer portal be available for customers to view their work? | Product | TBD | Open |
| 4 | What additional customer payment tracking is needed (invoices, receipts)? | Product | TBD | Open |
| 5 | Should we support customer hierarchies (parent company, subsidiaries)? | Product | TBD | Open |
| 6 | Is GPS coordinate capture required for sites or just optional? | Technical | TBD | Open |
| 7 | What is the maximum number of workers/customers expected per tenant? | Technical | TBD | Open |
| 8 | Should worker performance ratings be included in Phase 1? | Product | TBD | Open |

---

## 8. Appendices

### Appendix A: Enum Values Reference

**Employee Role Enum:**
- Engineer
- Surveyor
- Assistant
- Driver
- Other

**Employment Status Enum:**
- Active
- On Leave
- Terminated

**Customer Type Enum:**
- Government
- Private
- Individual

**Customer Status Enum:**
- Active
- Inactive
- On Hold

**Site Status Enum:**
- Active
- Completed
- On Hold

**Site Type Enum:**
- Construction Site
- Industrial
- Residential
- Road
- Other

### Appendix B: Worker Skill Categories

**Equipment Skills:**
- Total Station Operation
- GPS/GNSS Operation
- Level Operation
- Laserscanner Operation
- Theodolite Operation

**Software Skills:**
- AutoCAD
- Civil 3D
- Revit
- GIS Software
- Survey Office Software

**Field Skills:**
- Topographic Survey
- Boundary Survey
- Construction Stakeout
- As-Built Survey
- Deformation Monitoring

### Appendix C: User Stories

**Worker Management:**

1. *As a company owner, I want to add a new worker so that I can assign them to jobs.*
2. *As a company owner, I want to set worker compensation so that job costs are calculated accurately.*
3. *As a company owner, I want to track worker skills so that I can assign the right people to the right jobs.*
4. *As a company owner, I want to see worker work history so that I can evaluate their performance.*

**Customer Management:**

1. *As a company owner, I want to add customers so that I can track work by client.*
2. *As a company owner, I want to manage customer contacts so that I know who to communicate with.*
3. *As a company owner, I want to add sites for each customer so that I can track work location.*
4. *As a company owner, I want to see customer profitability so that I can focus on valuable clients.*

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-08 | Product Team | Initial module PRD creation |
| 1.1 | 2026-02-08 | Product Team | Added detailed view page specifications for Worker, Customer, and Site detail views with component structures, layouts, data fetching requirements, and acceptance criteria |

---

*This document is a supplementary module specification to the main Masah PRD. It provides detailed requirements for the Worker and Customer Management modules.*
