# 🛠️ Development Guide - Tea Boys Management System

## 🚀 Getting Started

### Prerequisites
```bash
# Check versions
node --version  # Should be 18+
npm --version   # Should be 9+
git --version
```

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd tea-boys-management

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start Supabase (requires Docker)
npm run supabase:start

# Update .env with local Supabase credentials
# (printed after supabase:start)

# Start development server
npm run dev
```

---

## 📁 Project Structure

```
tea-boys-management/
├── supabase/
│   ├── config.toml              # Supabase configuration
│   ├── migrations/              # Database migrations
│   │   ├── 20241024000001_initial_schema.sql
│   │   ├── 20241024000002_rls_policies.sql
│   │   └── 20241024000003_functions_triggers.sql
│   ├── functions/               # Edge Functions (future)
│   └── seed.sql                 # Sample data
├── src/
│   ├── components/              # React components
│   │   ├── Layout.tsx          # Main layout with sidebar
│   │   └── ui/                 # Reusable UI components
│   ├── pages/                   # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── POSPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── PurchasesPage.tsx
│   │   ├── ProductionPage.tsx
│   │   └── ReportsPage.tsx
│   ├── stores/                  # Zustand state management
│   │   └── authStore.ts
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities
│   │   ├── supabase.ts         # Supabase client
│   │   └── utils.ts            # Helper functions
│   ├── types/                   # TypeScript types
│   │   └── database.ts
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── public/                      # Static assets
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Environment template
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite config
├── tailwind.config.js           # Tailwind config
└── README.md                    # Project overview
```

---

## 🔧 Development Workflow

### 1. Create a New Feature

```bash
# Create feature branch
git checkout -b feature/product-crud

# Make changes
# ... code ...

# Test locally
npm run dev

# Check types
npm run type-check

# Lint code
npm run lint

# Commit changes
git add .
git commit -m "feat: add product CRUD operations"

# Push to remote
git push origin feature/product-crud

# Create pull request
```

### 2. Database Changes

```bash
# Create new migration
npm run db:migrate add_new_column

# Edit the generated file in supabase/migrations/

# Apply migration locally
npm run supabase:reset

# Test changes
npm run dev

# Commit migration file
git add supabase/migrations/
git commit -m "db: add new column to products table"
```

### 3. Generate TypeScript Types

```bash
# Generate types from database schema
npm run supabase:types

# This updates src/types/database.ts
# Commit the updated file
git add src/types/database.ts
git commit -m "types: update database types"
```

---

## 🎨 Coding Standards

### TypeScript

```typescript
// Use explicit types
interface Product {
  id: string
  name: string
  price: number
}

// Use async/await instead of .then()
const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
  
  if (error) throw error
  return data
}

// Use optional chaining
const productName = product?.name ?? 'Unknown'

// Use type guards
if (typeof value === 'string') {
  // value is string here
}
```

### React Components

```typescript
// Use functional components with TypeScript
interface ProductCardProps {
  product: Product
  onSelect: (id: string) => void
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <div onClick={() => onSelect(product.id)}>
      <h3>{product.name}</h3>
      <p>{formatCurrency(product.price)}</p>
    </div>
  )
}

// Use custom hooks for logic
function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    // ... fetch logic
  }

  return { products, loading, fetchProducts }
}
```

### Supabase Queries

```typescript
// Good: Use select with specific columns
const { data } = await supabase
  .from('products')
  .select('id, name, price, categories(name)')
  .eq('is_active', true)

// Good: Handle errors
const { data, error } = await supabase
  .from('products')
  .insert({ name, price })

if (error) {
  console.error('Error:', error)
  toast.error('Failed to create product')
  return
}

// Good: Use transactions for related inserts
const { data: sale } = await supabase
  .from('sales')
  .insert({ total_amount })
  .select()
  .single()

await supabase
  .from('sales_lines')
  .insert(items.map(item => ({
    sale_id: sale.id,
    product_id: item.id,
    quantity: item.quantity
  })))
```

### Styling

```typescript
// Use Tailwind classes
<button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
  Click Me
</button>

// Use cn() utility for conditional classes
import { cn } from '@/lib/utils'

<div className={cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class"
)}>
  Content
</div>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

---

## 🧪 Testing

### Manual Testing Checklist

#### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout
- [ ] Session persistence
- [ ] Role-based access

#### POS
- [ ] Search products
- [ ] Add to cart
- [ ] Update quantity
- [ ] Remove from cart
- [ ] Apply discount
- [ ] Complete sale
- [ ] Verify stock deduction

#### Products
- [ ] List products
- [ ] Create product
- [ ] Update product
- [ ] Delete product
- [ ] Search/filter

#### Reports
- [ ] Generate sales report
- [ ] Export to Excel
- [ ] Date range filter

### Unit Testing (Future)

```typescript
// Example test with Vitest
import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats number as INR currency', () => {
    expect(formatCurrency(1000)).toBe('₹1,000.00')
  })

  it('handles decimal values', () => {
    expect(formatCurrency(1234.56)).toBe('₹1,234.56')
  })
})
```

---

## 🐛 Debugging

### Browser DevTools

```javascript
// Check Supabase connection
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

// Check auth state
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)

// Check RLS policies
const { data, error } = await supabase
  .from('products')
  .select('*')
console.log('Products:', data, 'Error:', error)
```

### Supabase Studio

```bash
# Open Supabase Studio
npm run supabase:status
# Open http://localhost:54323

# Check:
# - Table Editor: View data
# - SQL Editor: Run queries
# - Auth: Check users
# - Logs: View API logs
```

### Common Issues

**Issue: "Failed to fetch"**
```bash
# Check Supabase is running
npm run supabase:status

# Restart if needed
npm run supabase:stop
npm run supabase:start
```

**Issue: "RLS policy violation"**
```sql
-- Check user role
SELECT role FROM profiles WHERE id = auth.uid();

-- Temporarily disable RLS for testing
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable!
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

**Issue: "Type errors"**
```bash
# Regenerate types
npm run supabase:types

# Check TypeScript
npm run type-check
```

---

## 📦 Useful Commands

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint code
npm run type-check       # Check TypeScript
```

### Supabase
```bash
npm run supabase:start   # Start local Supabase
npm run supabase:stop    # Stop local Supabase
npm run supabase:status  # Check status
npm run supabase:reset   # Reset database
npm run supabase:types   # Generate TypeScript types
npm run db:migrate       # Create new migration
```

### Deployment
```bash
npm run deploy:preview   # Deploy to preview
npm run deploy           # Deploy to production
```

---

## 🔍 Code Review Checklist

### Before Submitting PR

- [ ] Code follows TypeScript best practices
- [ ] No console.log statements (use proper logging)
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Responsive design tested
- [ ] Types are properly defined
- [ ] No hardcoded values (use constants)
- [ ] Comments for complex logic
- [ ] Git commit messages are clear
- [ ] No merge conflicts

### Reviewer Checklist

- [ ] Code is readable and maintainable
- [ ] Logic is correct
- [ ] No security vulnerabilities
- [ ] Performance is acceptable
- [ ] Tests pass (when implemented)
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

---

## 📚 Resources

### Documentation
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

### Tools
- [Supabase Studio](http://localhost:54323) - Local database UI
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Tailwind IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

### Community
- [Supabase Discord](https://discord.supabase.com)
- [React Discord](https://discord.gg/react)

---

## 🎯 Best Practices

### Performance
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Debounce search inputs
- Lazy load routes
- Optimize images

### Security
- Never commit .env files
- Validate all user inputs
- Use RLS policies
- Sanitize data before display
- Keep dependencies updated

### Accessibility
- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Maintain color contrast

### Git
- Write clear commit messages
- Keep commits atomic
- Use feature branches
- Rebase before merging
- Tag releases

---

## 🆘 Getting Help

### Internal
1. Check this documentation
2. Search existing issues
3. Ask team members
4. Create GitHub issue

### External
1. Supabase Discord
2. Stack Overflow
3. GitHub Discussions
4. Official documentation

---

**Happy Coding! 🚀**
