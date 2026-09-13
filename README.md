# Asset Tracking System

A full-stack asset tracking application for laboratory equipment management. Lab techs scan equipment through mobile-first workflows; managers monitor assets and reconcile data across multiple systems.

## 🌟 Features

- **Mobile-First Scanning** — QR code scanning for quick asset check-in/check-out
- **Real-Time Tracking** — Live asset location and status monitoring
- **Manager Dashboard** — Comprehensive overview of all tracked equipment
- **Data Reconciliation** — Sync and validate data across different systems
- **Role-Based Access** — Separate interfaces for lab techs and managers
- **Responsive Design** — Works seamlessly on mobile and desktop

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Node.js API
- **State Management:** React hooks
- **Styling:** Tailwind CSS with custom design system
- **Package Manager:** pnpm

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start the API (from the api/ directory)
cd api && pnpm install && pnpm dev
# → runs on localhost:8080

# Start the frontend (from root)
cp .env.example .env
pnpm dev
# → runs on localhost:3000
```

Open http://localhost:3000 to view the application.

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
API_BASE_URL=http://localhost:8080/v1
```

| Variable | Description |
|---|---|
| `API_BASE_URL` | Backend API endpoint including `/v1` path |

## 📁 Project Structure

```
asset-tracking-system/
├── api/                # Backend API service
├── app/                # Next.js pages and routes
├── components/         # Reusable React components
├── lib/                # Utility functions and helpers
├── docs/               # Documentation files
├── test/               # Test suites
├── package.json        # Frontend dependencies
└── README.md          # This file
```

## 🔧 Development

```bash
# Run frontend in development mode
pnpm dev

# Run backend API
cd api && pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

## 🎯 Key Workflows

### Lab Tech Flow
1. Open mobile interface
2. Scan equipment QR code
3. Check in/out asset
4. Add notes if needed

### Manager Flow
1. View dashboard with all assets
2. Monitor asset locations and status
3. Generate reports
4. Reconcile data discrepancies

## 🏗️ Architecture

- **Frontend:** Next.js 14 App Router with server-side rendering
- **Backend:** RESTful API with TypeScript
- **Data Flow:** Real-time updates via polling/WebSocket (configurable)
- **Mobile Support:** Progressive Web App (PWA) capabilities

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## 📱 Mobile Optimization

The application is optimized for mobile devices with:
- Touch-friendly interface
- QR code camera integration
- Offline capability (coming soon)
- Fast load times

## 🔐 Security

- Environment variable configuration
- Role-based access control
- Secure API endpoints
- Data validation on frontend and backend

## 📈 Future Enhancements

- [ ] Offline mode with local storage
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics dashboard
- [ ] Bulk asset operations
- [ ] Export to CSV/Excel
- [ ] Email notifications
- [ ] Multi-location support

## 📧 Contact

**Nishit Patel**
- LinkedIn: [linkedin.com/in/nishit-patel241103](https://linkedin.com/in/nishit-patel241103)
- Email: nishitpatel24113@gmail.com
- GitHub: [@Nishit24113](https://github.com/Nishit24113)

---

⭐️ If you found this project useful, please consider giving it a star!
