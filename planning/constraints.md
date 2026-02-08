# Masah Project - AI Agent Constraints & Guidelines

> **Purpose**: This document defines mandatory constraints, technology choices, and architectural decisions for all AI agents working on this project.

---

## 🎯 Project Overview

**Masah** is a multi-tenant SaaS application for surveying companies to manage their daily operations, workers, and equipment.

**Target Users**: Surveying companies (company owners)

> **Note**: Additional user roles (employees, workers) will be added in future phases.

---

## 📦 Monorepo Structure (Turborepo)

```
masah2/
├── apps/
│   ├── admin/          # Admin dashboard (React + MUI)
│   ├── web/            # Client-facing web app (React + MUI)
│   └── mobile/         # Mobile app (Expo React Native)
├── packages/
│   ├── types/          # Shared TypeScript interfaces & types
│   ├── ui/             # Shared UI components (MUI-based)
│   ├── api-client/     # React Query hooks & API calls
│   ├── utils/          # Shared utility functions
│   ├── config/         # Shared configuration (env, constants)
│   ├── eslint-config/  # Shared ESLint configuration
│   └── typescript-config/  # Shared TypeScript configuration
└── planning/           # Project documentation
```

---

## 🛠 Technology Stack

### **MANDATORY - TypeScript Everywhere**
- All code MUST be written in TypeScript
- Strict mode enabled
- No `any` types unless absolutely necessary (document why)
- use arrow function
- use absolute bath if recomended

### **Frontend**

| App | Framework | UI Library | State/Data | form |
|-----|-----------|------------|------------|------------ |
| Admin | React 18+ | Material UI (MUI) v5+ | React Query (TanStack Query) | use form, zod for validation
| Web | React 18+ | Material UI (MUI) v5+ | React Query (TanStack Query) | use form , zod for validation
| Mobile | Expo (React Native) | React Native Paper or custom | React Query | | use form , zod for validation

### **Backend**

| Component | Technology |
|-----------|------------|
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| API | Supabase client SDK (preferred) or Node.js + Express (if custom logic needed) |
| Realtime | Supabase Realtime (if needed) |

### **Backend Note - When to Use Node.js + Express**
Use custom Node.js + Express backend ONLY when:
- Complex business logic that can't be handled by Supabase RLS/Functions
- Third-party integrations requiring server-side secrets
- Heavy data processing or scheduled jobs

For simple CRUD operations, use Supabase client SDK directly.

---

## 🏗 Architecture Guidelines

### **Multi-tenancy**
- **Approach**: Single database with `tenant_id` column on all tenant-scoped tables
- **Enforcement**: Supabase Row Level Security (RLS) policies
- **Isolation**: Users can ONLY access data belonging to their tenant

### **Authentication Flow**
1. User signs up/logs in via Supabase Auth
2. On first login, tenant association is established
3. All subsequent queries filtered by RLS using `auth.uid()` → `tenant_id`

### **Data Architecture**
```
┌─────────────────────────────────────────────────────┐
│                    Supabase                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │  │
│  │  + RLS      │  │             │  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
          ▲                ▲                ▲
          │                │                │
    ┌─────┴────────────────┴────────────────┴─────┐
    │           @masah/api-client                  │
    │     (React Query hooks + Supabase calls)     │
    └─────┬────────────────┬────────────────┬─────┘
          │                │                │
     ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
     │  Admin  │     │   Web   │     │ Mobile  │
     └─────────┘     └─────────┘     └─────────┘
```

---

## 📁 Package Guidelines

### **@masah/types** - Shared TypeScript Interfaces
```typescript
// Example structure
packages/types/
├── src/
│   ├── index.ts          # Re-exports all types
│   ├── user.ts           # User, Worker interfaces
│   ├── tenant.ts         # Tenant, Company interfaces
│   ├── project.ts        # Project, Job interfaces
│   ├── equipment.ts      # Tool, Equipment interfaces
│   └── api.ts            # API response/request types
└── package.json
```

**Rules**:
- Define ALL shared interfaces here
- Use descriptive names (not `IUser`, just `User`)
- Include JSDoc comments for complex types

### **@masah/ui** - Shared UI Components
```typescript
// Example structure
packages/ui/
├── src/
│   ├── index.ts          # Re-exports all components
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── DataTable/
│   │   ├── Modal/
│   │   ├── FormFields/
│   │   └── Layout/
│   └── theme/
│       └── index.ts      # MUI theme configuration
└── package.json
```

**Rules**:
- All components MUST use MUI as base
- Export a unified theme from this package
- Components should be generic and reusable
- App-specific components stay in the app, not here

### **@masah/api-client** - React Query Hooks & API Calls
```typescript
// Example structure
packages/api-client/
├── src/
│   ├── index.ts          # Re-exports
│   ├── supabase.ts       # Supabase client initialization
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useUsers.ts
│   │   ├── useProjects.ts
│   │   └── useEquipment.ts
│   └── api/
│       ├── users.ts      # Raw API functions
│       ├── projects.ts
│       └── equipment.ts
└── package.json
```

**Rules**:
- ALL API calls go through this package
- Use React Query for server state
- Separate raw API functions from hooks
- Include proper error handling

### **@masah/utils** - Shared Utilities
```typescript
// Example structure
packages/utils/
├── src/
│   ├── index.ts
│   ├── formatting.ts     # Date, currency, number formatters
│   ├── validation.ts     # Zod schemas or validation helpers
│   └── constants.ts      # Shared constants
└── package.json
```

---

## ✅ Code Standards

### **DO's**
- ✅ Check if a type/component/hook exists in packages before creating new
- ✅ Add new shared code to appropriate package
- ✅ Use React Query for all server state
- ✅ Use MUI components and theme system
- ✅ Write descriptive variable/function names
- ✅ Add JSDoc comments for public functions
- ✅ Use Zod for runtime validation where needed

### **DON'Ts**
- ❌ Don't duplicate types - always import from `@masah/types`
- ❌ Don't create app-specific API hooks - use `@masah/api-client`
- ❌ Don't use inline styles - use MUI's `sx` prop or styled components
- ❌ Don't use `any` type without justification
- ❌ Don't create custom UI components if MUI has one
- ❌ Don't store sensitive data in frontend code

---

## 🔐 Security Requirements

1. **Never expose Supabase service role key** in frontend
2. **Use RLS policies** for all tenant data access
3. **Validate all inputs** on both client and database level
4. **Use environment variables** for all secrets
5. **Implement proper CORS** if using custom backend

---

## 📝 Development Workflow

1. **Before creating new code**:
   - Check `planning/project-structure.md` for existing implementations
   - Check packages for existing types/components/hooks
   
2. **When adding shared code**:
   - Add to appropriate package
   - Update package exports
   - Update `planning/project-structure.md`

3. **When completing a feature**:
   - Update `planning/project-structure.md` with new files/folders

---

## 📚 Key Documentation Files

| File | Purpose |
|------|---------|
| `planning/constraints.md` | This file - tech stack & rules |
| `planning/overview.md` | Project requirements & features |
| `planning/project-structure.md` | Living documentation of all files/folders |
| `planning/database-schema.md` | Database tables & relationships (to be created) |
