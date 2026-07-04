# Questionnaire Form - Next.js

A dynamic form renderer for ESG and Financed Emissions questionnaires.

## Features

- Two questionnaire types: ESG (Borrower Level) and FE (Loan Level)
- Dynamic tabs based on data level
- Accordion-style boxes for grouping
- Borrower type filtering
- Responsive design

## Structure

- `app/` - Next.js app directory
- `components/DynamicForm.js` - Main form component
- `data/` - JSON questionnaire data
- `public/` - Static assets

## How to Run

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open http://localhost:3000

## Data Structure

Questionnaires are organized as:
```
DataLevel
  └── GroupName
      └── SubGroupName
          └── Questions
```

## Borrower Type Filtering

The form supports filtering based on borrower types:
- All
- Listed
- Unlisted
- MSME
- Agriculture
- Retail
