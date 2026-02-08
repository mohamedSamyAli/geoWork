# Masah Project Overview

Masah is a multi-tenant SaaS application designed to help surveying companies manage their daily operations, workforce, equipment, and projects efficiently. The platform acts as a central hub for company owners to track field work, monitor expenses, and manage client relationships.

## 🎯 Project Goals

- **Streamline Operations**: Replace manual tracking with a digital system for managing daily surveying tasks.
- **Resource Management**: meaningful tracking of equipment (owned and rented) and workforce allocation.
- **Financial Clarity**: Real-time visibility into project costs (worker salaries, equipment rent, expenses) vs. revenue.
- **Scalability**: A robust multi-tenant architecture allowing multiple surveying companies to use the platform independently.

## 👥 Target Audience

### Primary Users (Phase 1)
- **Company Owners**: Create the tenant, manage settings, add resources (workers/equipment), create projects, and view financial reports.

### Future Users (Phase 2+)
- **Managers/Employees**: Staff members who help manage operations.
- **Field Workers**: Surveyors and assistants who may eventually input data directly from the field.

## 🚀 Key Features

### 1. Multi-Tenancy & Authentication
- **Tenant Isolation**: Each company has its own isolated data environment.
- **Owner Onboarding**: Seamless signup process that creates a company profile.
- **Role-Based Access**: Currently focused on Owner role, prepared for future roles.

### 2. Resource Management
- **Equipment Inventory**:
  - Track owned vs. rented equipment
  - Manage equipment types (Total Station, GPS, Level, Laserscanner, etc.)
  - Track calibration dates (last & next due)
  - Ownership tracking (Company owned, Partner owned with percentage split)
  - Rental management (Suppliers, daily/monthly rates)
- **Workforce Management**:
  - Employee profiles (Engineers, Surveyors, Assistants)
  - Skill tagging (e.g., "GPS Expert", "AutoCAD") with proficiency ratings (1-5)
  - Compensation management (Daily/Monthly salaries)

### 3. Client & Project Management
- **Customer Database**: Manage client details and multiple contact persons.
- **Site Management**: Track specific work locations/sites for each customer.
- **Project Structure**: Flexible organization of work orders.

### 4. Daily Work Tracking (Core Workflow)
The heart of the application is the "Daily Work" record, which connects all entities:
- **Assignment**: Link Customers, Sites, Workers, and Equipment to a specific date/duration.
- **Cost Calculation**: Automatically calculate costs based on:
  - Worker daily rates
  - Equipment daily rental/usage rates
  - Additional expenses (transport, food, etc.)
- **Revenue Tracking**: Record payments received from customers.
- **Profitability Analysis**: immediate view of cost vs. revenue for each job.

## 🗺 Roadmap

### Phase 1: Foundation (MVP)
- [x] Database Schema Design
- [x] AI Agent Constraints & Architecture Standards
- [ ] Backend Setup with Supabase
- [ ] Admin Dashboard (React + MUI) for Owners
- [ ] Basic CROD operations for all entities
- [ ] Daily Work creation and simple cost reporting

### Phase 2: Enhanced Management
- [ ] Advanced Reporting & Dashboards
- [ ] Employee/Manager Roles
- [ ] Document Generation (invoices, work orders)

### Phase 3: Field Operations
- [ ] Mobile App for field workers
- [ ] GPS integration for site location
- [ ] Field data collection
