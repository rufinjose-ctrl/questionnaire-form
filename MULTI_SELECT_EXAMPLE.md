# Multi-Select Field Example

## Overview
This shows how users can select multiple options and enter values for each selection, then export the complete form as JSON.

## Example: Fuel Based Energy Consumption Data

### User Interface:
```
☑ Anthracite Coal        [  500  ] tonnes
☑ Bituminous Coal        [  300  ] tonnes
☐ Asphalt
☐ Coke
☑ Diesel Oil             [  150  ] tonnes
☐ Kerosene
☐ LPG
```

**How it works:**
1. User sees a list of fuel types (from validOptions)
2. User checks the checkboxes for fuels they want to report
3. When checked, an input field appears for that fuel type
4. User enters the value (e.g., 500 for Anthracite Coal)
5. User enters unit separately (tonnes, liters, etc.)

### JSON Output:
```json
{
  "timestamp": "2026-07-04T10:30:45.123Z",
  "borrowerType": "all",
  "responses": {
    "BOR-001": "CIF123456",
    "BOR-002": "Company Name Ltd",
    "FE-BUS-014": {
      "Anthracite Coal": "500",
      "Bituminous Coal": "300",
      "Diesel Oil": "150"
    },
    "ESG-01": "Corporate",
    "ESG-03": "2500.50"
  }
}
```

## Key Features

### 1. Multi-Select Detection
- Component automatically detects fields with `validOptions`
- Fields marked as `type: "multiselect"`

### 2. Dynamic Rows
- Input field appears only when checkbox is checked
- User can check/uncheck multiple options
- Each option can have different values

### 3. JSON Export
- **Show JSON Output**: Toggle button to display form data
- **Download JSON**: Save response as `questionnaire-response.json` file
- Includes timestamp, borrower type, and all responses

### 4. Data Structure
```javascript
// Single value question
{
  "BOR-001": "CIF123456"
}

// Multi-select question with multiple selections
{
  "FE-BUS-014": {
    "Anthracite Coal": "500",
    "Bituminous Coal": "300",
    "Diesel Oil": "150"
  }
}
```

## How to Implement

### 1. Update Question Data
Mark questions with validation options as multi-select:
```javascript
{
  "questionCode": "FE-BUS-014",
  "label": "Fuel based Energy Consumption Data",
  "type": "multiselect",  // ← Add this
  "unit": "tonnes",
  "validOptions": ["Anthracite Coal", "Bituminous Coal", "Asphalt", ...],
  "required": false
}
```

### 2. Use EnhancedDynamicForm Component
Replace the regular form with the enhanced version:
```javascript
import EnhancedDynamicForm from '@/components/EnhancedDynamicForm';

<EnhancedDynamicForm
  questionnaire={questionData}
  title="Questionnaire"
/>
```

### 3. Handle JSON Output
- Click "Show JSON Output" to view
- Click "Download JSON" to save file
- Use file for API submission or data processing

## Button Actions

### Show/Hide JSON Output
- Displays current form state as JSON
- Updates in real-time as user types
- Dark theme for better readability

### Download JSON
- Saves as `questionnaire-response.json`
- Ready for API submission
- Contains all form responses

## Validation
- Required fields marked with `*`
- Form validates on submission
- Multi-select counts as filled if at least one option has a value

## Responsive Design
- Desktop: Grid layout with values side-by-side
- Mobile: Stacked layout for better readability
- Touch-friendly checkboxes and inputs
