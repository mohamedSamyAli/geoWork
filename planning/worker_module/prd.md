# Product Requirement Document: Workers Module

**Document Version:** 1.0
**Last Updated:** 2026-02-12
**Status:** Draft
**Module ID:** 002-worker-module

---

## 1. Executive Summary

The Workers Module is a core workforce management system designed to track, manage, and evaluate workers within geoWorks. The module enables organizations to maintain comprehensive worker profiles including personal information, salary details, categorized roles, and skill matrices for both equipment and software proficiency.

**Key Goals:**
- Centralized worker information management
- Skills tracking and evaluation (equipment & software)
- Cost calculation and reporting capabilities
- Flexible quick-add functionality for master data

**Target Users:**
- HR Managers
- Project Managers
- Field Supervisors
- System Administrators

---

## 2. Product Vision

To provide a comprehensive, user-friendly workforce management solution that enables geoWorks to efficiently track worker skills, manage salary data for accurate cost calculations, and maintain real-time visibility into team capabilities.

**Success Statement:** A project manager can quickly identify available engineers with Civil3D skills and specific equipment proficiency, calculate accurate project costs based on daily/monthly rates, and seamlessly expand the skill matrix as new tools are adopted.

---

## 3. Target Users & Personas

### Primary Personas

| Persona | Role | Goals | Pain Points |
|---------|------|-------|-------------|
| **HR Manager** | Manages worker records and salary information | Keep accurate worker data, update skills, maintain compliance | Manual spreadsheets, difficulty tracking skill certifications |
| **Project Manager** | Allocates workers to projects | Find workers with right skills, estimate labor costs | Time-consuming to verify worker capabilities |
| **Field Supervisor** | Evaluates worker performance on-site | Update equipment proficiency ratings, assign tasks | No system to record skill improvements |
| **Admin** | Maintains master data | Add new equipment, software, categories | Rigid systems requiring multiple screens to add simple data |

---

## 4. Problem Statement

### Current Problems
1. **Fragmented Worker Data**: Worker information, skills, and salary data are scattered across spreadsheets and legacy systems
2. **No Skill Visibility**: Difficulty in identifying workers with specific equipment or software skills
3. **Manual Cost Calculations**: Salary data exists but isn't readily accessible for project cost estimation
4. **Rigid Data Entry**: Adding new equipment types, software, or skills requires navigating complex workflows
5. **No Proficiency Tracking**: No systematic way to track and update worker equipment skill levels

### Solution Overview
The Workers Module provides:
- Unified worker profile management with all relevant data in one place
- Structured skill matrix for equipment and software with 5-star proficiency ratings
- Integrated salary tracking for calculation and reporting
- Generic quick-add component for seamless master data expansion
- Basic search and filtering capabilities

---

## 5. Feature Requirements

### 5.1 Core Priority Features (P0 - MVP)

#### 5.1.1 Worker Profile Management

| Attribute | Type | Required | Validation |
|-----------|------|----------|------------|
| Name | String (100) | Yes | Not empty |
| Phone | String (20) | Yes | Phone format |
| Category | Enum | Yes | engineer, surveyor, assistant |
| Salary Per Month | Decimal | Yes | Positive number |
| Salary Per Day | Decimal | Yes | Positive number |

**User Stories:**
- As an HR Manager, I can create a new worker profile with all required information
- As an HR Manager, I can edit existing worker profiles
- As a Project Manager, I can view worker details including salary information

**Acceptance Criteria:**
- Worker profile creation form validates all required fields
- Phone number accepts international formats
- Category is restricted to predefined enum values
- Salary fields accept decimal values with 2 precision

#### 5.1.2 Equipment Skill Matrix

**Attributes:**
- Equipment Type (string)
- Equipment Brand (string)
- Proficiency Rating (1-5 stars)

**User Stories:**
- As a Field Supervisor, I can assign equipment skills to a worker with proficiency rating
- As a Project Manager, I can view a worker's equipment proficiencies
- As a Worker, my equipment skill levels are visible in my profile

**Acceptance Criteria:**
- Equipment skill entry requires Type and Brand
- Proficiency rating is exactly 1-5 stars with visual indication
- Multiple equipment skills can be added per worker
- Equipment skills can be edited or removed

**Rating Scale Definition:**
| Stars | Label | Description |
|-------|-------|-------------|
| 1 | Beginner | Requires supervision |
| 2 | Basic | Can work with guidance |
| 3 | Competent | Can work independently |
| 4 | Advanced | Can handle complex tasks |
| 5 | Expert | Can train others |

#### 5.1.3 Software Skill Matrix

**Attributes:**
- Software Name (string)
- Proficiency Level (implied, can be added in future)

**Seeded Software:**
- AutoCAD
- Civil3D

**User Stories:**
- As an HR Manager, I can assign software skills to a worker from the software library
- As an Admin, I can add new software to the library via quick-add
- As a Project Manager, I can filter workers by software knowledge

**Acceptance Criteria:**
- Software skills are selected from existing software library
- New software can be added inline via quick-add component
- Multiple software skills can be assigned per worker

#### 5.1.4 Generic Quick-Add Component

**Component Behavior:**
- AutoComplete-style dropdown with existing options
- Typing non-existing value and pressing Enter adds new item
- No confirmation required (open addition model)
- Generic/reusable across entities (software, equipment type, equipment brand)

**User Stories:**
- As any user, I can type a new software name and press Enter to add it
- As any user, I can type a new equipment type/brand and press Enter to add it
- As a Developer, I can reuse this component for other entities

**Acceptance Criteria:**
- Component shows filtered suggestions as user types
- Non-matching input shows visual indication it will be added as new
- Enter key on non-matching value creates new record
- New items are immediately available for selection
- Component accepts props for entity type, API endpoint, and display field

#### 5.1.5 Workers List & Basic Search

**Features:**
- Paginated list of all workers
- Display: Name, Phone, Category, Daily Salary
- Search by Name or Phone number

**User Stories:**
- As a Project Manager, I can search for workers by name
- As an HR Manager, I can browse all workers in the system
- As a User, I can click a worker to view full details

**Acceptance Criteria:**
- List displays 20 workers per page (configurable)
- Search filters results in real-time
- Search matches partial names and phone numbers
- Clicking a row navigates to worker detail view

---

### 5.2 Secondary Priority Features (P1 - Post-MVP)

| Feature | Description | User Benefit |
|---------|-------------|--------------|
| **Export to Excel** | Export workers list with skills | Generate reports, share offline |
| **Worker Status** | Active/Inactive status | Track current workforce without deleting records |
| **Skill Bulk Edit** | Update multiple workers' skills at once | Efficient skill matrix updates |
| **Salary History** | Track salary changes over time | Historical reporting |
| **Equipment Library Management** | Dedicated screen to manage equipment types/brands | Centralized master data maintenance |

---

### 5.3 Future Enhancements (P2 - Backlog)

| Feature | Description |
|---------|-------------|
| Advanced Filtering | Filter by skills, salary range, proficiency level |
| Skill Certifications | Upload and track certification documents/expiry |
| Worker Project History | View past project assignments |
| Skill Gap Analysis | Identify missing skills for project requirements |
| Mobile Worker Profile | View and update worker profiles via mobile app |
| Salary Calculations | Automatic project cost calculations based on worker allocation |

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Workers list must load within 2 seconds for up to 1000 records
- Worker detail view must load within 1 second
- Quick-add component must display suggestions within 300ms of input

### 6.2 Usability
- Intuitive UI matching shadcn.com design system
- Responsive design for tablet/desktop (1024px+)
- Keyboard navigation support for quick-add component
- Clear visual feedback for all user actions

### 6.3 Data Integrity
- Salary calculations use consistent precision (2 decimal places)
- Phone numbers stored in E.164 format when possible
- Soft-delete for workers (no hard deletes)

### 6.4 Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation for all forms
- Screen reader compatible component labels

---

## 7. Data Model

### Workers Table

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, Not Null | Auto-generated |
| name | VARCHAR(100) | Not Null | |
| phone | VARCHAR(20) | Not Null, Unique | |
| category | ENUM | Not Null | engineer, surveyor, assistant |
| salary_month | DECIMAL(10,2) | Not Null, >= 0 | |
| salary_day | DECIMAL(10,2) | Not Null, >= 0 | |
| status | ENUM | Not Null | Default: active |
| created_at | TIMESTAMP | Not Null | |
| updated_at | TIMESTAMP | Not Null | |
| deleted_at | TIMESTAMP | Nullable | Soft delete |

### Worker_Equipment_Skills Table

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, Not Null | |
| worker_id | UUID | FK, Not Null | References workers(id) |
| equipment_type | VARCHAR(100) | Not Null | |
| equipment_brand | VARCHAR(100) | Not Null | |
| proficiency_rating | INTEGER | Not Null, 1-5 | 5-star system |
| created_at | TIMESTAMP | Not Null | |

### Worker_Software_Skills Table

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, Not Null | |
| worker_id | UUID | FK, Not Null | References workers(id) |
| software_id | UUID | FK, Not Null | References software(id) |
| created_at | TIMESTAMP | Not Null | |

### Software Table (Master Data)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, Not Null | |
| name | VARCHAR(100) | Not Null, Unique | |
| is_seeded | BOOLEAN | Not Null | Default: false |
| created_at | TIMESTAMP | Not Null | |

### Equipment_Types Table (Master Data)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, Not Null | |
| name | VARCHAR(100) | Not Null, Unique | |
| created_at | TIMESTAMP | Not Null | |

### Equipment_Brands Table (Master Data)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, Not Null | |
| name | VARCHAR(100) | Not Null, Unique | |
| created_at | TIMESTAMP | Not Null | |

---

## 8. Technical Requirements

### 8.1 Technology Stack
- **Backend:** TypeScript 5.9.2, Supabase JS v2
- **Frontend:** React 19, Vite 7, React Router v7
- **UI Library:** shadcn/ui components
- **Forms:** React Hook Form + Zod validation
- **State Management:** TanStack React Query v5

### 8.2 API Requirements
- RESTful API endpoints for CRUD operations
- Real-time subscriptions for worker updates (Supabase)
- Optimistic UI updates for quick-add operations

### 8.3 Integration Points
- **Authentication:** Uses existing Supabase auth
- **Navigation:** Integrated into main app router
- **Equipment Module:** Future integration with 001-equipment-module

---

## 9. Constraints & Dependencies

### Constraints
- Must follow existing geoWorks UI/UX patterns (shadcn style)
- Must use TypeScript strict mode
- Salary data must be accurate for financial calculations
- Quick-add component must be reusable for future modules

### Dependencies
- **Existing:** Authentication system, navigation structure
- **External:** Supabase for database and real-time features
- **Future:** Equipment module (001) for equipment data integration

### Assumptions
- Users have appropriate permissions to add master data
- Phone numbers may be international formats
- Monthly and daily salaries are both needed for different calculation contexts
- 5-star rating system is sufficient for proficiency tracking

---

## 10. Success Metrics & KPIs

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Worker Profile Creation Time | < 2 minutes | Average time from start to save |
| Quick-Add Adoption | > 80% | % of new software/equipment added via quick-add |
| Search Accuracy | > 95% | % of searches returning correct results |
| User Satisfaction | > 4/5 | Post-release survey |
| Data Accuracy | 100% | No invalid salary/category values in database |

---

## 11. Open Questions

| Question | Priority | Status |
|----------|----------|--------|
| Should salary changes trigger audit logging? | Medium | Open |
| Is there a limit to how many equipment/software skills per worker? | Low | Open |
| Should quick-add items require admin approval for master data? | Low | Answered (No - Open Addition) |
| Do we need equipment proficiency expiry dates? | Medium | Open |
| Should workers be able to view their own profiles? | Low | Open |

---

## 12. Release Plan

### Phase 1: MVP (Current Sprint)
**Scope:**
- Worker profile CRUD
- Equipment skill matrix (add, edit, remove)
- Software skill matrix (add, remove)
- Generic quick-add component
- Workers list with basic search
- Seeded software data (AutoCAD, Civil3D)

**Deliverables:**
- Functional workers module
- API endpoints
- Database migrations
- Unit tests

### Phase 2: Enhancement (Future Sprint)
**Scope:**
- Export functionality
- Worker status (active/inactive)
- Improved skill matrix UI
- Performance optimizations

---

## 13. Appendices

### 13.1 User Flow: Creating a Worker with Skills

```
1. User clicks "Add Worker" button
2. Worker form opens with basic fields
3. User enters: Name, Phone, selects Category
4. User enters: Monthly Salary, Daily Salary
5. User goes to Equipment Skills section
6. User selects Equipment Type (quick-add or existing)
7. User selects Equipment Brand (quick-add or existing)
8. User clicks star rating (1-5)
9. User repeats for additional equipment skills
10. User goes to Software Skills section
11. User types software name, selects from dropdown or presses Enter to add new
12. User repeats for additional software skills
13. User clicks "Save Worker"
14. System validates and creates worker with all skills
15. User navigates to workers list
```

### 13.2 Quick-Add Component Specification

**Component Name:** `QuickAddSelect`

**Props:**
```typescript
interface QuickAddSelectProps {
  entity: string;           // 'software' | 'equipment-type' | 'equipment-brand'
  value?: string;           // Current value
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}
```

**Behavior:**
1. On focus, fetches existing options for entity
2. Filters options as user types
3. If exact match found, highlights it
4. If no match, shows "Press Enter to add '{value}'" hint
5. On Enter with new value:
   - Calls API to create new record
   - Updates local cache
   - Calls onChange with new value
   - Shows success toast

### 13.3 Seed Data

**Software:**
- AutoCAD
- Civil3D

**Worker Categories:**
- Engineer
- Surveyor
- Assistant

**Proficiency Rating Descriptions:**
- 1 Star: Beginner - Requires constant supervision
- 2 Stars: Basic - Can work with guidance
- 3 Stars: Competent - Works independently
- 4 Stars: Advanced - Handles complex scenarios
- 5 Stars: Expert - Can train and lead others

---

**Document End**

*Next Steps:*
1. Review and approve PRD
2. Create technical design document
3. Generate implementation tasks
4. Begin development
