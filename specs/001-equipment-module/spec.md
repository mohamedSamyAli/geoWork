# Feature Specification: Equipment Module

**Feature Branch**: `001-equipment-module`
**Created**: 2026-02-11
**Status**: Draft
**Input**: User description: "Build the equipment module with ownership types (rented/owned), partners, suppliers, sidebar navigation, list/card views, and detail pages."

## Clarifications

### Session 2026-02-11

- Q: Should equipment serial numbers be unique within a company? → A: Yes, unique per company — no two equipment records can share a serial number.
- Q: Can equipment records be deleted? → A: No deletion — equipment records are permanent. They can only be archived/deactivated with a status flag.
- Q: Should the equipment "type" field be free-text or a predefined list? → A: Predefined list extensible by owner — system provides common defaults, owner can add custom types.
- Q: Should ownership percentages be whole numbers only, or allow decimals? → A: Up to 2 decimal places — allows 33.33%, 16.67%, etc. for precise splits.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage Equipment Records (Priority: P1)

As a company owner, I want to add, edit, and view equipment records with key details (name, serial number, type, model, and ownership type) so that I have a centralized inventory of all my surveying equipment.

**Why this priority**: Equipment is the core entity of this module. Without the ability to create and manage equipment records, no other feature (partners, suppliers, rentals) has value.

**Independent Test**: Can be fully tested by creating, editing, and viewing an equipment record. Delivers a basic equipment registry for the company.

**Acceptance Scenarios**:

1. **Given** a logged-in company owner on the equipment list page, **When** they click "Add Equipment" and fill in name, serial number, type, model, and ownership type (owned), **Then** the equipment record is saved and appears in the equipment list.
2. **Given** an existing equipment record, **When** the owner opens the edit page and changes the serial number, **Then** the updated serial number is persisted and visible on the detail page.
3. **Given** an existing equipment record, **When** the owner opens its detail/view page, **Then** they see all equipment information (name, serial, type, model, ownership type) displayed clearly.
4. **Given** a company with multiple equipment records, **When** the owner visits the equipment list page, **Then** all equipment belonging to their company is displayed, and no equipment from other companies is visible.

---

### User Story 2 - Rented Equipment with Supplier Linking (Priority: P2)

As a company owner, I want to mark equipment as "rented" and link it to a supplier with monthly and daily rental costs so that I can track which equipment I rent, from whom, and at what cost.

**Why this priority**: Rental cost tracking is a key business need. Many surveying companies rent expensive equipment and need to know ongoing costs per supplier.

**Independent Test**: Can be tested by creating a rented equipment record, selecting a supplier, entering rental costs, and verifying the data on the equipment detail page.

**Acceptance Scenarios**:

1. **Given** the owner is adding new equipment and selects ownership type "Rented", **When** they proceed, **Then** the form requires them to select a supplier and enter a monthly rent and daily rent amount.
2. **Given** a rented equipment record, **When** the owner views its detail page, **Then** the supplier name, monthly rent, and daily rent are displayed.
3. **Given** no suppliers exist yet, **When** the owner tries to add rented equipment, **Then** they are informed they need to create a supplier first (or can create one inline).
4. **Given** a rented equipment record linked to a supplier, **When** the owner views the supplier detail page, **Then** the equipment appears in the supplier's linked equipment list.

---

### User Story 3 - Owned Equipment with Partner Ownership (Priority: P3)

As a company owner, I want to add partners with ownership percentages to owned equipment so that I can track shared ownership (e.g., Partner A owns 20%, Partner B owns 30%, company owns the remaining 50%).

**Why this priority**: Partner ownership tracking is important for financial clarity but only applies to owned equipment, making it a secondary concern after basic equipment and rental management.

**Independent Test**: Can be tested by creating an owned equipment record, adding partners with percentages, and verifying the ownership breakdown on the equipment detail page.

**Acceptance Scenarios**:

1. **Given** an owned equipment record with no partners, **When** the owner views its detail page, **Then** it shows "Company owns 100%".
2. **Given** an owned equipment record, **When** the owner adds a partner with 20% ownership, **Then** the detail page shows "Partner A: 20%, Company: 80%".
3. **Given** an owned equipment record with partners totaling 50%, **When** the owner tries to add another partner with 60%, **Then** the system prevents it because total partner ownership would exceed 100%.
4. **Given** an owned equipment record, **When** the owner removes a partner, **Then** the removed partner's percentage is returned to the company's ownership share.
5. **Given** a rented equipment record, **When** the owner views its detail page, **Then** the option to add partners is not available (partners only apply to owned equipment).

---

### User Story 4 - Manage Suppliers (Priority: P4)

As a company owner, I want to manage a list of suppliers (with unique name and phone) so that I can associate them with rented equipment.

**Why this priority**: Suppliers are a supporting entity needed for the rental flow. They must exist before rented equipment can be linked.

**Independent Test**: Can be tested by creating, editing, viewing, and listing suppliers independently of equipment.

**Acceptance Scenarios**:

1. **Given** a logged-in owner on the suppliers list page, **When** they click "Add Supplier" and enter a name and phone number, **Then** the supplier is saved and appears in the list.
2. **Given** an existing supplier, **When** the owner edits the supplier's phone number, **Then** the change is saved and reflected on the supplier detail page.
3. **Given** an existing supplier, **When** the owner views the supplier detail page, **Then** they see the supplier's name, phone, and a list of all equipment rented from this supplier.
4. **Given** the owner tries to create a supplier with a name that already exists in their company, **Then** the system rejects the duplicate and shows an error.

---

### User Story 5 - Manage Partners (Priority: P5)

As a company owner, I want to manage a list of partners (with unique name and phone) so that I can associate them with owned equipment as co-owners.

**Why this priority**: Partners are a supporting entity for the ownership tracking feature. They are needed before ownership percentages can be assigned.

**Independent Test**: Can be tested by creating, editing, viewing, and listing partners independently of equipment.

**Acceptance Scenarios**:

1. **Given** a logged-in owner on the partners list page, **When** they click "Add Partner" and enter a name and phone number, **Then** the partner is saved and appears in the list.
2. **Given** an existing partner, **When** the owner views the partner detail page, **Then** they see the partner's name, phone, and a list of all equipment they co-own with ownership percentages.
3. **Given** the owner tries to create a partner with a name that already exists in their company, **Then** the system rejects the duplicate and shows an error.

---

### User Story 6 - Sidebar Navigation and List Views (Priority: P6)

As a company owner, I want a sidebar navigation with links to Equipment, Partners, and Suppliers sections, and I want each section to offer both table and card view options with filters, so that I can quickly navigate and find what I need.

**Why this priority**: Navigation and list views are the primary interface through which all other features are accessed. However, they deliver no value without the underlying data management, so they are prioritized after core CRUD operations.

**Independent Test**: Can be tested by navigating between sections via sidebar, switching between table/card views, and applying filters.

**Acceptance Scenarios**:

1. **Given** a logged-in owner on any page, **When** they look at the sidebar, **Then** they see navigation items for "Equipment", "Partners", and "Suppliers".
2. **Given** the owner is on the equipment list page, **When** they toggle between table view and card view, **Then** the same data is displayed in the selected layout format.
3. **Given** the owner is on any list page, **When** they apply a filter (e.g., filter equipment by type or ownership type), **Then** only matching records are displayed.
4. **Given** the owner is on a list page in table view, **When** there are many records, **Then** the list supports pagination or infinite scroll to handle large datasets.

---

### Edge Cases

- What happens when the owner deletes a supplier that has rented equipment linked to it? The system must prevent deletion or require the owner to reassign/remove the equipment link first.
- What happens when the owner deletes a partner that has equipment ownership? The system must recalculate the company's ownership percentage (adding back the removed partner's share).
- What happens when the total partner ownership percentages for a single piece of equipment exceed 100%? The system must reject the entry and display a validation error.
- What happens when a partner ownership percentage is set to 0% or a negative number? The system must reject it with a validation error (minimum 1%).
- What happens when the owner tries to change equipment from "owned" to "rented" when partners exist? The system must warn the owner that partner ownership data will be removed, and require confirmation.
- What happens when the owner tries to change equipment from "rented" to "owned" when a supplier is linked? The system must warn the owner that supplier/rental cost data will be removed, and require confirmation.
- What happens when no equipment exists yet? The list page should display an empty state with a prompt to add the first equipment.
- How does the system handle very long equipment names or serial numbers? Truncation in list views with full display on detail pages.
- What happens when the owner archives equipment that is linked to a supplier or has partners? The partner/supplier links are preserved — when reactivated, the data is intact.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the owner to create equipment records with name, serial number, type, model, ownership type (rented or owned), and status (active by default).
- **FR-001a**: System MUST enforce unique serial numbers within a company — no two equipment records in the same company can have the same serial number.
- **FR-001b**: Equipment type MUST be selected from a predefined list of common surveying equipment types (e.g., Total Station, GPS, Level, Drone, Theodolite). The owner MUST be able to add custom types to extend this list for their company.
- **FR-002**: System MUST allow the owner to edit any field on an existing equipment record.
- **FR-003**: System MUST display a detail/view page for each equipment record showing all its information.
- **FR-004**: When ownership type is "rented", the system MUST require the owner to select a supplier and enter monthly rent and daily rent amounts.
- **FR-005**: When ownership type is "owned", the equipment detail page MUST allow the owner to add partners with ownership percentages.
- **FR-006**: System MUST automatically calculate and display the company's ownership percentage as 100% minus the sum of all partner percentages.
- **FR-007**: System MUST prevent total partner ownership percentages from exceeding 100% for any single equipment record.
- **FR-008**: Each partner ownership percentage MUST be between 1% and 99% (inclusive), with up to 2 decimal places precision (e.g., 33.33%).
- **FR-009**: System MUST allow the owner to create, edit, and view supplier records with name and phone number.
- **FR-010**: System MUST enforce unique supplier names within a company.
- **FR-011**: System MUST allow the owner to create, edit, and view partner records with name and phone number.
- **FR-012**: System MUST enforce unique partner names within a company.
- **FR-013**: The supplier detail page MUST display a list of all equipment rented from that supplier, including equipment name and rental costs.
- **FR-014**: The partner detail page MUST display a list of all equipment co-owned by that partner, including equipment name and ownership percentage.
- **FR-015**: System MUST provide a sidebar navigation containing links to Equipment, Partners, and Suppliers sections.
- **FR-016**: Each list page (equipment, partners, suppliers) MUST support both table view and card view display modes.
- **FR-017**: Each list page MUST provide filtering capabilities relevant to the entity (e.g., equipment by type, ownership type; suppliers/partners by name search).
- **FR-018**: All equipment, supplier, and partner data MUST be scoped to the owner's company. No cross-company data leakage is permitted.
- **FR-019**: Rental cost fields (monthly rent and daily rent) MUST accept numeric values with up to 2 decimal places.
- **FR-020**: System MUST prevent deletion of a supplier that has rented equipment linked to it, or require reassignment first.
- **FR-021**: When a partner is removed from an equipment record, the system MUST recalculate the company's ownership share accordingly.
- **FR-022**: When changing ownership type from "owned" to "rented", the system MUST warn the owner that existing partner data will be removed and require confirmation.
- **FR-023**: When changing ownership type from "rented" to "owned", the system MUST warn the owner that existing supplier/rental data will be removed and require confirmation.
- **FR-024**: System MUST NOT allow equipment records to be deleted. Instead, the owner can archive/deactivate equipment by changing its status to "inactive".
- **FR-025**: Archived/inactive equipment MUST be hidden from default list views but accessible via a filter (e.g., "Show inactive").

### Key Entities

- **Equipment**: A surveying device or tool managed by the company. Key attributes: name, serial number (unique per company), type, model, ownership type (rented/owned), status (active/inactive). Scoped to a company. Cannot be deleted — only archived. Can be linked to one supplier (if rented) or multiple partners (if owned).
- **Supplier**: An external entity that rents equipment to the company. Key attributes: name (unique per company), phone number. Related to equipment via rental agreements with monthly and daily costs.
- **Partner**: An individual or entity that co-owns equipment with the company. Key attributes: name (unique per company), phone number. Related to equipment via ownership percentage records.
- **Equipment-Partner Ownership**: A relationship record linking owned equipment to a partner with a specific ownership percentage. The company's share is the remainder (100% minus total partner percentages).
- **Equipment-Supplier Rental**: A relationship linking rented equipment to a supplier with monthly and daily rental costs.

## Assumptions

- Only the company owner (admin) can manage equipment, suppliers, and partners. No separate permission levels are needed within this module for now.
- Equipment type is a predefined list with common surveying defaults (Total Station, GPS, Level, Drone, Theodolite, etc.) that the owner can extend by adding custom types scoped to their company.
- Currency for rental costs follows the company's default currency (assumed to be a single currency, no multi-currency support needed).
- A single piece of equipment can only be linked to one supplier (if rented). Equipment cannot be rented from multiple suppliers simultaneously.
- Partners and suppliers are company-scoped entities, not shared across companies.
- The sidebar navigation is persistent across all pages in the application (not just the equipment module).
- Phone number format validation follows general patterns (no strict country-specific format enforced initially).
- Search/filter on list pages is client-side for small datasets and can be enhanced to server-side for larger datasets in the future.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Owner can create a new equipment record (with all required fields) in under 1 minute.
- **SC-002**: Owner can locate any specific equipment, supplier, or partner from the list page in under 10 seconds using search/filter.
- **SC-003**: 100% of equipment records correctly display their ownership breakdown (company + partners) or rental details (supplier + costs) on the detail page.
- **SC-004**: No cross-company data is ever visible — 100% tenant isolation verified across all list and detail pages.
- **SC-005**: Owner can switch between table and card views without data loss or page reload delays exceeding 1 second.
- **SC-006**: All validation rules (unique names, percentage limits, required fields for rented equipment) prevent invalid data entry 100% of the time.
- **SC-007**: 90% of first-time users can navigate between Equipment, Partners, and Suppliers sections without assistance.
