# My First Website

A Next.js application featuring a Learning Management System (LMS) and HubSpot Monthly Reporting for orthodontic practices.

## Features

### Learning Management System (LMS)
- Course creation and management
- Lesson organization with resources
- User authentication and enrollment tracking
- Progress monitoring

### HubSpot Monthly Reporting
- Automated monthly activity reports for orthodontic practice members
- Integration with HubSpot CRM (read-only)
- AI-powered content summarization using Anthropic Claude
- PDF report generation
- Consultant dashboard for review and management
- Automated report generation via Vercel Cron

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **APIs**:
  - HubSpot API (CRM data)
  - Anthropic Claude API (AI summarization)
- **PDF Generation**: @react-pdf/renderer
- **File Storage**: AWS S3
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (or Vercel Postgres)
- HubSpot account with Private App access
- Anthropic API key
- AWS S3 bucket (optional, for file storage)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-first-website
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `HUBSPOT_API_KEY` - Follow [HUBSPOT_SETUP.md](./HUBSPOT_SETUP.md)
- `ANTHROPIC_API_KEY` - Get from Anthropic Console
- `CRON_SECRET` - Generate random string for cron job authentication
- AWS S3 credentials (if using S3 storage)

4. Set up database:
```bash
pnpm prisma:generate
pnpm prisma:migrate
```

5. Run development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── cron/         # Automated tasks
│   │   └── reports/      # Report API endpoints
│   ├── dashboard/        # Dashboard pages
│   │   ├── members/      # Member management
│   │   └── reports/      # Report management
│   └── actions/          # Server actions
├── components/           # React components
├── lib/                  # Library code
│   ├── hubspot/         # HubSpot API integration
│   ├── ai/              # AI summarization
│   ├── reports/         # Report generation logic
│   ├── pdf/             # PDF generation
│   ├── prisma.ts        # Prisma client
│   └── auth.ts          # Auth utilities
└── types/               # TypeScript types
```

## HubSpot Integration Setup

The reporting system integrates with HubSpot to fetch email and meeting data. See [HUBSPOT_SETUP.md](./HUBSPOT_SETUP.md) for detailed setup instructions.

**Key Points:**
- All HubSpot operations are READ-ONLY
- Requires HubSpot Private App with specific scopes
- Company IDs link Members to HubSpot records

## Usage

### Managing Members

1. Navigate to `/dashboard/members`
2. Add members with their HubSpot Company IDs
3. View member details and their reports

### Generating Reports

**Manual Generation:**
1. Go to `/dashboard/reports/generate`
2. Select member and month
3. System will:
   - Fetch activities from HubSpot
   - Generate AI summaries
   - Create draft report for review

**Automated Generation:**
- Configured via Vercel Cron
- Runs on 1st of each month at midnight
- Generates reports for all active members for previous month

### Reviewing Reports

1. View reports at `/dashboard/reports`
2. Click a report to see details
3. Review activities and summaries
4. Mark as "Reviewed" when ready
5. Download PDF for distribution
6. Mark as "Sent" after delivery

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

**Important:** Set `CRON_SECRET` in Vercel environment variables for automated report generation.

### Database Migration on Vercel

Migrations run automatically on deployment via the `ci` script in `package.json`.

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Run database migrations
- `pnpm test` - Run tests
- `pnpm test:e2e` - Run Playwright E2E tests

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
