# Lune Platform Testing Guide

This guide covers how to test the Lune platform at all levels.

## Table of Contents

1. [Running Tests](#running-tests)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Manual Testing](#manual-testing)
6. [Test Coverage](#test-coverage)

---

## Running Tests

### Backend Tests

```bash
cd backend

# Install dependencies (if not already installed)
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm test -- --coverage
```

### Frontend Tests (Future)

```bash
# Run frontend tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## Unit Testing

Unit tests verify individual functions and components in isolation.

### Backend Service Tests

**Location:** `backend/src/services/__tests__/`

**Example: Testing PWRCHAIN Service**

```typescript
// pwrService.test.ts
import { mintCertificate, verifyCertificate } from '../pwrService';

describe('PWRCHAIN Service', () => {
  it('should mint a certificate', async () => {
    const data = {
      candidateName: 'Test User',
      skill: 'React',
      score: 85,
      difficulty: 'Mid-Level',
      timestamp: new Date().toISOString()
    };

    const hash = await mintCertificate(data);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
  });

  it('should verify a certificate', async () => {
    const hash = '0x123...';
    const result = await verifyCertificate(hash);
    expect(result.isValid).toBe(true);
  });
});
```

**Running Service Tests:**
```bash
npm test -- pwrService.test.ts
```

### Controller Tests

**Location:** `backend/src/controllers/__tests__/`

Tests for request handlers and business logic.

---

## Integration Testing

Integration tests verify that different parts of the system work together.

### API Integration Tests

**Location:** `backend/src/controllers/__tests__/*.integration.test.ts`

**Example: Testing Auth API**

```typescript
import request from 'supertest';
import app from '../../server';

describe('Auth API', () => {
  it('should signup a new user', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        role: 'candidate'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('session');
  });
});
```

**Running Integration Tests:**
```bash
npm run test:integration
```

### Database Integration Tests

Test database operations:

```typescript
describe('Database Operations', () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup test database
  });

  it('should create a user', async () => {
    // Test user creation
  });

  it('should enforce RLS policies', async () => {
    // Test Row Level Security
  });
});
```

---

## End-to-End Testing

E2E tests verify complete user flows.

### Manual E2E Test Cases

#### Test Case 1: Candidate Signup to Certificate

**Steps:**
1. Navigate to landing page
2. Click "Get Started"
3. Select "I am a Candidate"
4. Fill signup form
5. Verify email
6. Complete profile
7. Take assessment
8. Pass assessment
9. Mint certificate
10. Verify certificate on blockchain

**Expected Results:**
- User account created
- Profile saved
- Assessment completed
- Certificate minted
- Certificate verifiable

#### Test Case 2: Employer Job Posting

**Steps:**
1. Signup as employer
2. Complete company profile
3. Post a job
4. View matched candidates
5. View candidate profile
6. Verify candidate certificate

**Expected Results:**
- Job posted successfully
- AI matching works
- Candidates displayed
- Certificates verified

### Automated E2E Tests (Future)

Using Playwright or Cypress:

```typescript
// e2e/candidate-flow.spec.ts
test('candidate can complete assessment', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Get Started');
  await page.click('text=I am a Candidate');
  // ... rest of flow
});
```

---

## Manual Testing

### Pre-Deployment Checklist

#### Authentication
- [ ] Signup with valid email
- [ ] Signup with invalid email (should fail)
- [ ] Signup with weak password (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong credentials (should fail)
- [ ] Logout
- [ ] Token refresh works
- [ ] Session persists on page reload

#### Candidate Features
- [ ] Complete profile
- [ ] Upload video introduction
- [ ] Delete video introduction
- [ ] Select skill for assessment
- [ ] Select difficulty level
- [ ] Start assessment
- [ ] Webcam proctoring activates
- [ ] Answer theory questions
- [ ] Write code in editor
- [ ] Submit assessment
- [ ] View results
- [ ] Mint certificate (if passed)
- [ ] View certificate on blockchain
- [ ] Share certificate
- [ ] View job matches
- [ ] View match scores
- [ ] Start mock interview
- [ ] Submit interview answer
- [ ] View interview feedback

#### Employer Features
- [ ] Complete company profile
- [ ] Post a job
- [ ] Edit job posting
- [ ] View matched candidates
- [ ] View candidate profiles
- [ ] Watch candidate video intro
- [ ] Verify candidate certificate
- [ ] View certificate on blockchain

#### Error Handling
- [ ] Network error shows toast
- [ ] Invalid input shows error
- [ ] 404 page works
- [ ] 500 error handled gracefully
- [ ] Loading states show correctly

#### Performance
- [ ] Page loads in < 3 seconds
- [ ] Assessment generation < 10 seconds
- [ ] Certificate minting < 5 seconds
- [ ] No memory leaks
- [ ] Smooth animations

#### Responsive Design
- [ ] Works on mobile (375px)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1920px)
- [ ] Touch interactions work
- [ ] Keyboard navigation works

#### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Test Coverage

### Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** 70%+ coverage
- **Critical Paths:** 100% coverage

### Viewing Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Coverage by Module

**High Priority (100% coverage):**
- Authentication
- Certificate minting
- Payment processing (if applicable)
- Security middleware

**Medium Priority (80% coverage):**
- Assessment generation
- Job matching
- Profile management

**Low Priority (60% coverage):**
- UI components
- Utility functions

---

## Testing Best Practices

### 1. Write Tests First (TDD)

```typescript
// Write test first
describe('calculateScore', () => {
  it('should calculate correct score', () => {
    expect(calculateScore(8, 10)).toBe(80);
  });
});

// Then implement function
function calculateScore(correct: number, total: number): number {
  return (correct / total) * 100;
}
```

### 2. Use Descriptive Test Names

❌ Bad:
```typescript
it('works', () => { ... });
```

✅ Good:
```typescript
it('should return 401 when user is not authenticated', () => { ... });
```

### 3. Test Edge Cases

```typescript
describe('validateEmail', () => {
  it('should accept valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('should reject email without @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('should reject null', () => {
    expect(validateEmail(null)).toBe(false);
  });
});
```

### 4. Mock External Dependencies

```typescript
jest.mock('../services/geminiService', () => ({
  generateAssessment: jest.fn().mockResolvedValue({
    id: 'test-id',
    questions: []
  })
}));
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await cleanupDatabase();
});
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd backend && npm install
      
      - name: Run tests
        run: cd backend && npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
```

---

## Debugging Tests

### Running Single Test

```bash
# Run specific test file
npm test -- pwrService.test.ts

# Run specific test case
npm test -- -t "should mint a certificate"
```

### Debug Mode

```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Verbose Output

```bash
npm test -- --verbose
```

---

## Performance Testing

### Load Testing

Use tools like Apache JMeter or k6:

```javascript
// k6 load test
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100, // 100 virtual users
  duration: '30s',
};

export default function() {
  let res = http.get('https://api.lune.platform/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### Stress Testing

Test system limits:
- Maximum concurrent users
- Maximum assessments per minute
- Database connection limits
- API rate limits

---

## Security Testing

### Checklist

- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting works
- [ ] Authentication required
- [ ] Authorization enforced
- [ ] Secrets not exposed
- [ ] HTTPS enforced
- [ ] Input validation
- [ ] Output encoding

### Tools

- **OWASP ZAP**: Automated security testing
- **Burp Suite**: Manual penetration testing
- **npm audit**: Dependency vulnerabilities

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## Accessibility Testing

### Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Sufficient color contrast
- [ ] Alt text on images
- [ ] ARIA labels present
- [ ] Focus indicators visible
- [ ] No keyboard traps

### Tools

- **Lighthouse**: Automated accessibility audit
- **axe DevTools**: Browser extension
- **NVDA/JAWS**: Screen reader testing

---

## Monitoring in Production

### Metrics to Track

- **Uptime**: 99.9% target
- **Response Time**: < 500ms average
- **Error Rate**: < 1%
- **Certificate Minting Success**: > 95%
- **User Satisfaction**: > 4.5/5

### Tools

- **Sentry**: Error tracking
- **DataDog**: Performance monitoring
- **Google Analytics**: User behavior
- **Supabase Dashboard**: Database metrics

---

## Test Data

### Seed Data for Testing

```sql
-- Test users
INSERT INTO users (id, email, name, role) VALUES
  ('test-candidate-1', 'candidate@test.com', 'Test Candidate', 'candidate'),
  ('test-employer-1', 'employer@test.com', 'Test Employer', 'employer');

-- Test skills
INSERT INTO skills (name, category) VALUES
  ('React', 'frontend'),
  ('Node.js', 'backend');
```

### Mock Data Generators

```typescript
// Generate mock assessment
function mockAssessment() {
  return {
    id: uuid(),
    title: 'React Assessment',
    difficulty: 'Mid-Level',
    questions: generateQuestions(5)
  };
}
```

---

## Reporting Bugs

### Bug Report Template

```markdown
**Description:**
Brief description of the bug

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Browser: Chrome 120
- OS: macOS 14
- Device: Desktop

**Screenshots:**
[Attach screenshots]

**Console Errors:**
[Paste console errors]
```

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

**Happy Testing! 🧪**
