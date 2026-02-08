# Product Requirements Document (PRD)
# Masah - Surveying Operations Management Platform

**Document Version:** 1.0
**Last Updated:** February 6, 2026
**Document Owner:** Product Team
**Status:** Draft

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Target Users](#3-target-users)
4. [Problem Statement](#4-problem-statement)
5. [Solution Overview](#5-solution-overview)
6. [Success Metrics](#6-success-metrics)
7. [Feature Requirements](#7-feature-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Constraints and Dependencies](#9-constraints-and-dependencies)
10. [Release Plan](#10-release-plan)
11. [Open Questions](#11-open-questions)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

**Masah** is a multi-tenant SaaS platform designed specifically for surveying companies to manage their daily operations, workforce, equipment, and projects. The platform serves as a centralized hub enabling company owners to track field work, monitor expenses, manage client relationships, and gain real-time visibility into project profitability.

### Key Highlights
- **Target Market:** Small to medium surveying companies
- **Primary User:** Company Owners (Phase 1)
- **Core Value Proposition:** Replace manual tracking with a digital system that provides real-time financial clarity and resource management
- **Technology Stack:** Supabase (Backend), React + Material UI (Frontend)

---

## 2. Product Vision

### Vision Statement
> To become the essential operational backbone for surveying companies, transforming how they manage resources, track projects, and understand their financial performance.

### Strategic Objectives
| Objective | Description |
|-----------|-------------|
| **Streamline Operations** | Replace manual, paper-based tracking with an intuitive digital system for managing daily surveying tasks |
| **Resource Management** | Enable meaningful tracking of equipment (owned and rented) and workforce allocation |
| **Financial Clarity** | Provide real-time visibility into project costs vs. revenue for informed decision-making |
| **Scalability** | Build a robust multi-tenant architecture supporting multiple independent surveying companies |

### Business Goals
1. Reduce operational overhead for surveying companies by 40%
2. Provide instant project profitability insights
3. Minimize equipment downtime through proactive calibration tracking
4. Enable data-driven workforce allocation decisions

---

## 3. Target Users

### 3.1 Primary Persona: Company Owner (Phase 1)

| Attribute | Details |
|-----------|---------|
| **Role** | Owner/Founder of a surveying company |
| **Company Size** | 5-50 employees |
| **Technical Proficiency** | Moderate; comfortable with web applications |
| **Primary Goals** | Manage company operations, track profitability, oversee resources |

#### Pain Points
- Manual tracking of daily work assignments is time-consuming and error-prone
- Difficulty calculating true project profitability (hidden costs, equipment usage)
- No centralized view of equipment status, calibration dates, and availability
- Spreadsheet-based systems don't scale with business growth
- Delayed financial insights lead to poor decision-making

#### Needs
- Single dashboard for all operational data
- Automated cost calculation for each job
- Equipment inventory with maintenance reminders
- Client and project relationship management
- Easy daily work logging and assignment

### 3.2 Future Personas (Phase 2+)

#### Manager/Supervisor
- Assists owner in day-to-day operations
- Assigns workers and equipment to jobs
- Reviews work orders and approves expenses

#### Field Worker (Surveyor/Assistant)
- Logs work directly from the field
- Views daily assignments
- Reports equipment issues or needs

---

## 4. Problem Statement

### Current State
Surveying companies currently rely on:
- **Spreadsheets** for tracking equipment, workers, and projects
- **Paper logs** for daily work records
- **Manual calculations** for cost estimation and invoicing
- **Disconnected systems** that don't communicate with each other

### Problems This Creates

| Problem | Impact |
|---------|--------|
| **Data Fragmentation** | Information scattered across multiple spreadsheets and paper documents |
| **Delayed Insights** | Financial reports take days/weeks to compile manually |
| **Inaccurate Cost Tracking** | Hidden costs (equipment wear, transport) often missed |
| **Resource Conflicts** | Double-booking of equipment or workers |
| **Calibration Lapses** | Missed calibration dates leading to compliance issues |
| **Client Communication** | No centralized record of customer interactions and sites |

### The Cost of Inaction
- Lost revenue due to underpriced projects
- Compliance penalties from uncalibrated equipment
- Inefficient resource utilization
- Inability to scale operations effectively

---

## 5. Solution Overview

Masah provides an integrated platform that connects all operational aspects of a surveying business:

```
┌─────────────────────────────────────────────────────────────┐
│                    MASAH PLATFORM                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Equipment  │  │  Workforce  │  │   Clients   │         │
│  │  Inventory  │  │  Management │  │   & Sites   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                          ▼                                  │
│               ┌─────────────────────┐                       │
│               │    DAILY WORK       │                       │
│               │   (Core Workflow)   │                       │
│               └──────────┬──────────┘                       │
│                          │                                  │
│                          ▼                                  │
│               ┌─────────────────────┐                       │
│               │  Cost & Revenue     │                       │
│               │     Analysis        │                       │
│               └─────────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Core Modules

1. **Multi-Tenant Authentication** - Secure, isolated company environments
2. **Equipment Management** - Track owned/rented equipment with calibration scheduling
3. **Workforce Management** - Employee profiles with skills and compensation
4. **Client Management** - Customer database with sites and contacts
5. **Daily Work Tracking** - The central hub connecting all resources to jobs
6. **Financial Reporting** - Real-time cost vs. revenue analysis

---

## 6. Success Metrics

### Key Performance Indicators (KPIs)

#### Product Metrics
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Daily Active Users (DAU) | 70% of registered owners | Analytics |
| Daily Work Entries/Week | 5+ per active company | Database metrics |
| Feature Adoption Rate | 80% use all core features within 30 days | Feature tracking |
| Time to First Value | < 15 minutes from signup | User journey analytics |

#### Business Metrics
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| User Retention (30-day) | > 80% | Cohort analysis |
| Customer Satisfaction (NPS) | > 50 | Surveys |
| Support Tickets/User | < 2 in first month | Support system |

#### User Outcome Metrics
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Time Saved on Admin Tasks | 5+ hours/week | User surveys |
| Cost Tracking Accuracy | > 95% costs captured | User feedback |
| Calibration Compliance | 0 missed dates | System alerts |

---

## 7. Feature Requirements

### 7.1 Multi-Tenancy & Authentication

#### F1.1: Company Registration & Onboarding
| Attribute | Details |
|-----------|---------|
| **Description** | Allow new surveying companies to register and set up their tenant |
| **User Benefit** | Quick, seamless entry into the platform with isolated data |
| **Priority** | P0 (Must Have) |

**Acceptance Criteria:**
- [ ] User can register with email and password
- [ ] Company profile created automatically upon registration
- [ ] Unique tenant ID assigned for data isolation
- [ ] Welcome wizard guides through initial setup
- [ ] Email verification required before full access

#### F1.2: Role-Based Access Control
| Attribute | Details |
|-----------|---------|
| **Description** | Define and enforce user roles with specific permissions |
| **User Benefit** | Secure access control as team grows |
| **Priority** | P1 (Should Have for Phase 1, Full implementation Phase 2) |

**Acceptance Criteria:**
- [ ] Owner role has full access to all features
- [ ] Permission framework ready for future roles (Manager, Employee)
- [ ] Users can only access their tenant's data
- [ ] Audit log for sensitive actions

---

### 7.2 Equipment Management

#### F2.1: Equipment Inventory
| Attribute | Details |
|-----------|---------|
| **Description** | Manage complete inventory of surveying equipment |
| **User Benefit** | Single source of truth for all equipment assets |
| **Priority** | P0 (Must Have) |

**Acceptance Criteria:**
- [ ] Add/Edit/Delete equipment records
- [ ] Categorize by type (Total Station, GPS, Level, Laserscanner, etc.)
- [ ] Mark as Owned vs. Rented
- [ ] Track equipment status (Available, In Use, Maintenance, Retired)
- [ ] Search and filter equipment list
- [ ] View equipment details and history

#### F2.2: Ownership & Partnership Tracking
| Attribute | Details |
|-----------|---------|
| **Description** | Track equipment ownership including partner arrangements |
| **User Benefit** | Clear financial tracking for shared equipment |
| **Priority** | P1 (Should Have) |

**Acceptance Criteria:**
- [ ] Mark equipment as Company Owned or Partner Owned
- [ ] Define ownership percentage splits
- [ ] Calculate cost/revenue sharing automatically
- [ ] Track partner details

#### F2.3: Calibration Management
| Attribute | Details |
|-----------|---------|
| **Description** | Track and alert on equipment calibration schedules |
| **User Benefit** | Never miss calibration dates; maintain compliance |
| **Priority** | P0 (Must Have) |

**Acceptance Criteria:**
- [ ] Record last calibration date
- [ ] Set next calibration due date
- [ ] Dashboard alerts for upcoming/overdue calibrations
- [ ] Calibration history log
- [ ] Export calibration reports for compliance

#### F2.4: Rental Management
| Attribute | Details |
|-----------|---------|
| **Description** | Manage equipment rentals from suppliers |
| **User Benefit** | Track rental costs and supplier relationships |
| **Priority** | P0 (Must Have) |

**Acceptance Criteria:**
- [ ] Add supplier information
- [ ] Record rental rates (daily/monthly)
- [ ] Track active rentals and return dates
- [ ] Automatic cost calculation for daily work

---

### 7.3 Workforce Management

#### F3.1: Employee Profiles
| Attribute | Details |
|-----------|---------|
| **Description** | Maintain comprehensive employee records |
| **User Benefit** | Centralized workforce information |
| **Priority** | P0 (Must Have) |

**Acceptance Criteria:**
- [ ] Add/Edit/Delete employee records
- [ ] Categorize by role (Engineer, Surveyor, Assistant)
- [ ] Store contact information
- [ ] Track employment status (Active, Inactive)
- [ ] View employee work history

#### F3.2: Skills & Proficiency Tracking
| Attribute | Details |
|-----------|---------|
| **Description** | Tag employees with skills and proficiency levels |
| **User Benefit** | Match right people to right projects |
| **Priority** | P1 (Should Have) |

**Acceptance Criteria:**
- [ ] Define skill types (GPS Expert, AutoCAD, Total Station, etc.)
- [ ] Rate proficiency (1-5 scale)
- [ ] Filter employees by skill
- [ ] View skill matrix across workforce

#### F3.3: Compensation Management
| Attribute | Details |
|-----------|---------|
| **Description** | Track employee salary and payment structures |
| **User Benefit** | Accurate cost calculations for projects |
| **Priority** | P0 (Must Have) |

**Acceptance Criteria:**
- [ ] Set daily rate or monthly salary
- [ ] Support both payment types per employee
- [ ] Calculate daily cost for work assignments
- [ ] Track payment history (future enhancement)

---

### 7.4 Client & Project Management

#### F4.1: Customer Database
| Attribute | Details |
|-----------|---------|
| **Description** | Manage customer/client information |
| **User Benefit** | Organized client relationships |
| **Priority** | P0 (Must Have) |

**Acceptance Criteria:**
- [ ] Add/Edit/Delete customer records
- [ ] Store company details and contact information
- [ ] Support multiple contact persons per customer
- [ ] View customer work history
- [ ] Search and filter customers

#### F4.2: Site Management
| Attribute | Details |
|-----------|---------|
| **Description** | Track specific work locations for each customer |
| **User Benefit** | Organize work by physical location |
| **Priority** | P0 (Must Have) |

**Acceptance Criteria:**
- [ ] Add multiple sites per customer
- [ ] Store site address and coordinates
- [ ] Link daily work to specific sites
- [ ] View site work history

#### F4.3: Project Structure (Future Enhancement)
| Attribute | Details |
|-----------|---------|
| **Description** | Organize work into projects for better tracking |
| **User Benefit** | Group related work for reporting |
| **Priority** | P2 (Nice to Have for Phase 1) |

**Acceptance Criteria:**
- [ ] Create projects under customers
- [ ] Link daily work to projects
- [ ] Project-level cost and revenue reporting

---

### 7.5 Daily Work Tracking (Core Feature)

#### F5.1: Daily Work Entry
| Attribute | Details |
|-----------|---------|
| **Description** | Create and manage daily work records |
| **User Benefit** | Central record of all field activities |
| **Priority** | P0 (Must Have) |

**Acceptance Criteria:**
- [ ] Create daily work record with date and duration
- [ ] Link to customer and site
- [ ] Assign workers to the job
- [ ] Assign equipment to the job
- [ ] Add notes and work description
- [ ] Mark work status (Planned, In Progress, Completed, Cancelled)

#### F5.2: Automatic Cost Calculation
| Attribute | Details |
|-----------|---------|
| **Description** | Calculate job costs based on assigned resources |
| **User Benefit** | Instant, accurate cost tracking |
| **Priority** | P0 (Must Have) |

**Acceptance Criteria:**
- [ ] Calculate worker costs from daily rates
- [ ] Calculate equipment costs (rental rates)
- [ ] Support manual expense entries (transport, food, materials)
- [ ] Show cost breakdown per job
- [ ] Running total for each daily work entry

#### F5.3: Revenue Tracking
| Attribute | Details |
|-----------|---------|
| **Description** | Record payments and revenue for work |
| **User Benefit** | Complete financial picture per job |
| **Priority** | P0 (Must Have) |

**Acceptance Criteria:**
- [ ] Enter revenue/payment amount for job
- [ ] Support partial payments
- [ ] Track payment status (Pending, Received)
- [ ] Calculate profit/loss per job

#### F5.4: Profitability Analysis
| Attribute | Details |
|-----------|---------|
| **Description** | View cost vs. revenue analysis |
| **User Benefit** | Understand which jobs/clients are profitable |
| **Priority** | P0 (Must Have) |

**Acceptance Criteria:**
- [ ] Show profit/loss per daily work entry
- [ ] Aggregate by customer, site, time period
- [ ] Visual indicators for profitable/unprofitable work
- [ ] Export reports

---

### 7.6 Reporting & Dashboard

#### F6.1: Owner Dashboard
| Attribute | Details |
|-----------|---------|
| **Description** | Overview dashboard for company operations |
| **User Benefit** | At-a-glance operational visibility |
| **Priority** | P0 (Must Have) |

**Acceptance Criteria:**
- [ ] Summary cards (Total revenue, costs, profit this month)
- [ ] Upcoming calibration alerts
- [ ] Recent daily work entries
- [ ] Equipment utilization overview
- [ ] Quick actions (Create daily work, Add equipment, etc.)

#### F6.2: Basic Reports
| Attribute | Details |
|-----------|---------|
| **Description** | Essential reports for business operations |
| **User Benefit** | Data-driven decision making |
| **Priority** | P1 (Should Have) |

**Acceptance Criteria:**
- [ ] Revenue report by period
- [ ] Cost breakdown report
- [ ] Equipment utilization report
- [ ] Worker assignment report
- [ ] Export to CSV/PDF

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Requirement | Target |
|-------------|--------|
| Page Load Time | < 3 seconds |
| API Response Time | < 500ms for standard operations |
| Concurrent Users | Support 100+ users per tenant |
| Database Query Time | < 200ms for common queries |

### 8.2 Security

| Requirement | Implementation |
|-------------|----------------|
| Authentication | Supabase Auth with email/password |
| Authorization | Row Level Security (RLS) for tenant isolation |
| Data Encryption | TLS 1.3 in transit, AES-256 at rest |
| Session Management | JWT tokens with appropriate expiration |
| Input Validation | Server-side validation for all inputs |
| Audit Logging | Track sensitive operations |

### 8.3 Reliability

| Requirement | Target |
|-------------|--------|
| Uptime | 99.5% availability |
| Backup | Daily automated backups |
| Recovery Time | < 4 hours RTO |
| Recovery Point | < 24 hours RPO |

### 8.4 Usability

| Requirement | Implementation |
|-------------|----------------|
| Responsive Design | Support desktop, tablet, mobile browsers |
| Browser Support | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Accessibility | WCAG 2.1 Level AA compliance |
| Localization | Arabic (primary), English (secondary) - Phase 2 |

### 8.5 Scalability

| Requirement | Implementation |
|-------------|----------------|
| Multi-Tenant | Shared database with tenant isolation |
| Tenant Growth | Support up to 1000 tenants |
| Data Volume | Handle 100,000+ daily work records per tenant |

---

## 9. Constraints and Dependencies

### 9.1 Technical Constraints

| Constraint | Details |
|------------|---------|
| Backend Platform | Supabase (PostgreSQL, Auth, Storage, Functions) |
| Frontend Framework | React with Material UI (MUI) |
| Hosting | Supabase managed infrastructure |
| Budget | Limited infrastructure budget for MVP |

### 9.2 Business Constraints

| Constraint | Details |
|------------|---------|
| Timeline | Phase 1 MVP within 3 months |
| Resources | Small development team |
| Market | Initial focus on local/regional surveying companies |

### 9.3 Dependencies

| Dependency | Risk Level | Mitigation |
|------------|------------|------------|
| Supabase Platform | Low | Well-established platform with good SLAs |
| MUI Component Library | Low | Widely used, stable library |
| Internet Connectivity | Medium | Design for offline-friendly patterns (Phase 2) |

---

## 10. Release Plan

### Phase 1: Foundation (MVP) - Target: 3 months

**Milestone 1.1: Infrastructure Setup (Week 1-2)**
- [ ] Supabase project setup
- [ ] Database schema implementation
- [ ] Authentication configuration
- [ ] Development environment setup

**Milestone 1.2: Core Entity Management (Week 3-6)**
- [ ] Equipment CRUD operations
- [ ] Workforce CRUD operations
- [ ] Customer & Site CRUD operations
- [ ] Basic UI components

**Milestone 1.3: Daily Work Module (Week 7-10)**
- [ ] Daily work creation and management
- [ ] Resource assignment
- [ ] Cost calculation engine
- [ ] Revenue tracking

**Milestone 1.4: Dashboard & Reports (Week 11-12)**
- [ ] Owner dashboard
- [ ] Basic reporting
- [ ] Testing and bug fixes
- [ ] MVP launch preparation

### Phase 2: Enhanced Management - Target: 3 months post-MVP

- Advanced reporting and dashboards
- Employee/Manager roles and permissions
- Document generation (invoices, work orders)
- Notifications and alerts system

### Phase 3: Field Operations - Target: 6 months post-MVP

- Mobile application for field workers
- GPS integration for site location
- Field data collection and offline mode
- Advanced scheduling features

---

## 11. Open Questions

| # | Question | Owner | Due Date | Status |
|---|----------|-------|----------|--------|
| 1 | What is the preferred language for the initial release (Arabic/English/Both)? | Product | TBD | Open |
| 2 | Are there specific compliance requirements for surveying equipment calibration? | Product | TBD | Open |
| 3 | What payment/invoicing integrations are needed for Phase 2? | Product | TBD | Open |
| 4 | Should equipment depreciation be tracked? | Product | TBD | Open |
| 5 | What is the expected number of daily work entries per company per day? | Product | TBD | Open |
| 6 | Are there any existing data sources that need migration support? | Technical | TBD | Open |
| 7 | What level of offline functionality is required for field operations? | Product | TBD | Open |

---

## 12. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Tenant** | A single surveying company instance with isolated data |
| **Daily Work** | A record of work performed on a specific date, linking workers, equipment, and client |
| **Total Station** | An electronic surveying instrument combining a theodolite and distance meter |
| **GPS (GNSS)** | Global Navigation Satellite System equipment for positioning |
| **Level** | A surveying instrument for measuring height differences |
| **Laserscanner** | 3D scanning equipment for capturing spatial data |

### Appendix B: Equipment Types

1. **Total Station** - Electronic surveying instrument
2. **GPS/GNSS Receiver** - Satellite positioning equipment
3. **Level (Automatic/Digital)** - Height measurement instrument
4. **Laserscanner** - 3D point cloud capture device
5. **Theodolite** - Angle measurement instrument
6. **Prism** - Reflector for total station measurements
7. **Tripod** - Equipment support stand
8. **Range Pole** - Height reference pole

### Appendix C: User Roles Matrix (Future)

| Permission | Owner | Manager | Employee | Field Worker |
|------------|-------|---------|----------|--------------|
| View Dashboard | Full | Limited | Basic | No |
| Manage Equipment | Full | Add/Edit | View | View |
| Manage Workers | Full | View | View | No |
| Create Daily Work | Full | Full | Assigned | Submit |
| View Reports | Full | Limited | No | No |
| Manage Settings | Full | No | No | No |

### Appendix D: Data Model Overview

```
Tenant (Company)
├── Users
├── Equipment
│   ├── Owned Equipment
│   └── Rented Equipment
├── Workers (Employees)
│   └── Skills
├── Customers
│   ├── Contacts
│   └── Sites
└── Daily Work
    ├── Worker Assignments
    ├── Equipment Assignments
    ├── Expenses
    └── Payments
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-06 | Product Team | Initial PRD creation |

---

*This document is a living artifact and will be updated as requirements evolve and are clarified.*
