# Policy Renewal Dashboard

> A comprehensive policy renewal management system with automated email reminders powered by Rube AI.

**Live Demo**: [View Dashboard](https://lovable.dev/projects/45a0866a-3684-447f-b0d3-598098f7e598)

---

## 🎯 Overview

The Policy Renewal Dashboard helps insurance agencies automate policy renewal reminders, track email activity, and manage policies efficiently. Built with React, TypeScript, and Lovable Cloud (Supabase), it provides a modern, real-time dashboard for managing umbrella insurance policy renewals.

### Key Features

✅ **Automated Email Reminders** - Rube AI-powered system sends renewal reminders automatically  
✅ **Real-time Analytics** - Track email success rates, trends, and policy distribution  
✅ **Email Template Editor** - Customize email content with live preview  
✅ **Bulk Actions** - Import, export, delete multiple policies at once  
✅ **Agent Management** - Track insurance agents and their policies  
✅ **Notification Center** - Real-time alerts for important events  
✅ **Scheduled Automation** - Daily cron job sends emails at configured time  

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Lovable account (for cloud features)
- Composio API key (for Rube AI)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Initial Setup

1. **Configure Secrets** (via Lovable dashboard):
   - `COMPOSIO_API_KEY` - Your Composio/Rube AI API key

2. **Seed Email Templates**:
   ```sql
   -- Run in Lovable → Cloud → Database → SQL Editor
   -- See QUICK_START.md for full SQL
   ```

3. **Configure Rube AI**:
   - Update `excel_file_id` in `supabase/functions/run-policy-reminder/index.ts`
   - Add your JotForm link

4. **Deploy**:
   - Click "Publish" in Lovable dashboard
   - Verify deployment
   - Enable scheduled automation

📖 **Detailed Setup**: See [QUICK_START.md](QUICK_START.md) for step-by-step instructions

---

## 📊 Features

### Policy Management
- ✅ Create, edit, delete policies
- ✅ Bulk import from CSV/Excel
- ✅ Search and filter
- ✅ Status tracking (overdue, pending, active, completed)
- ✅ Real-time updates

### Email Automation
- ✅ Automated renewal reminders (37 days before expiration)
- ✅ Follow-up reminders (7 days after first email)
- ✅ Scheduled daily automation via cron
- ✅ Manual email execution
- ✅ Email status tracking

### Analytics Dashboard
- ✅ Email success rate charts
- ✅ 7-day activity trends
- ✅ Policy expiration distribution
- ✅ Email type breakdown
- ✅ Real-time statistics

### Email Templates
- ✅ Rich HTML editor
- ✅ Live preview with sample data
- ✅ Template variables ({{client_first_name}}, etc.)
- ✅ Separate templates for each reminder type

### Notifications
- ✅ Real-time notification center
- ✅ Policy expiration alerts
- ✅ Email send/fail notifications
- ✅ Mark as read functionality

---

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **Backend**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth (needs implementation)
- **Email**: Rube AI (Composio) with Outlook integration
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

---

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── PolicyTable.tsx           # Policy list with bulk actions
│   │   ├── EmailAutomationPanel.tsx  # Automation controls
│   │   ├── AnalyticsDashboard.tsx    # Charts and analytics
│   │   ├── EmailTemplateEditor.tsx   # Template management
│   │   ├── NotificationCenter.tsx    # Real-time notifications
│   │   └── ui/                       # shadcn/ui components
│   ├── pages/
│   │   └── Index.tsx                 # Main dashboard
│   ├── hooks/                        # Custom React hooks
│   ├── services/                     # API services
│   └── integrations/
│       └── supabase/                 # Supabase client & types
├── supabase/
│   ├── functions/                    # Edge functions
│   │   ├── run-policy-reminder/      # Main Rube AI executor
│   │   ├── setup-email-cron/         # Cron job manager
│   │   └── jotform-webhook/          # JotForm integration
│   └── migrations/                   # Database migrations
└── public/                           # Static assets
```

---

## 🔧 Configuration

### Environment Variables

Managed automatically by Lovable Cloud:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key

### Secrets (Server-side)

Configured in Lovable → Settings → Secrets:
- `COMPOSIO_API_KEY` - Required for Rube AI
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-configured
- `SUPABASE_DB_URL` - Auto-configured

### Rube AI Configuration

Update in `supabase/functions/run-policy-reminder/index.ts`:
```typescript
params: {
  excel_file_id: 'YOUR_EXCEL_FILE_ID',
  jotform_link: 'https://form.jotform.com/YOUR_FORM',
  days_before_expiration: '37',
  days_after_first_email: '7',
}
```

---

## 🚢 Deployment
