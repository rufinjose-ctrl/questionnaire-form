import { useState } from 'react';
import './DynamicForm.css';

export default function EnhancedDynamicForm({ questionnaire, title }) {
  const [formData, setFormData] = useState({});
  const [selectedBorrowerType, setSelectedBorrowerType] = useState('all');
  const [selectedLoanType, setSelectedLoanType] = useState('all');
  const [showJsonOutput, setShowJsonOutput] = useState(false);
  // Track selected options for each multi-select question
  const [multiSelectState, setMultiSelectState] = useState({});

  // Determine if this is a borrower or loan level questionnaire
  const dataLevels = Object.keys(questionnaire);
  const isBorrowerLevel = dataLevels.some(level => level.includes('BORROWER'));
  const isLoanLevel = dataLevels.some(level => level.includes('LOAN'));

  // Handle single value inputs
  const handleInputChange = (questionCode, value) => {
    setFormData(prev => ({
      ...prev,
      [questionCode]: value
    }));
  };

  // Handle multi-select value input
  const handleMultiSelectValueChange = (questionCode, option, value) => {
    setFormData(prev => ({
      ...prev,
      [questionCode]: {
        ...(prev[questionCode] || {}),
        [option]: value
      }
    }));
  };

  // Add a new option row for multi-select
  const handleAddMultiSelectOption = (questionCode, option) => {
    if (!option) return;
    
    // Add to form data
    setFormData(prev => ({
      ...prev,
      [questionCode]: {
        ...(prev[questionCode] || {}),
        [option]: ''
      }
    }));

    // Clear the dropdown
    setMultiSelectState(prev => ({
      ...prev,
      [questionCode]: ''
    }));
  };

  // Remove an option row for multi-select
  const handleRemoveMultiSelectOption = (questionCode, option) => {
    setFormData(prev => {
      const updated = { ...prev[questionCode] };
      delete updated[option];
      return {
        ...prev,
        [questionCode]: Object.keys(updated).length > 0 ? updated : undefined
      };
    });
  };

  const isQuestionVisible = (question) => {
    if (isBorrowerLevel) {
      // Filter by borrower type only
      if (!question.borrowerTypes) return true;
      if (question.borrowerTypes.includes('all')) return true;
      return question.borrowerTypes.includes(selectedBorrowerType);
    } else if (isLoanLevel) {
      // Filter by BOTH borrower type AND loan type
      const borrowerMatch = !question.borrowerTypes || 
                           question.borrowerTypes.includes('all') || 
                           question.borrowerTypes.includes(selectedBorrowerType);
      
      const loanMatch = !question.loanType || 
                       question.loanType === 'all' || 
                       question.loanType === selectedLoanType;
      
      return borrowerMatch && loanMatch;
    }
    return true;
  };

  // Detect multi-select questions (those with validOptions)
  const isMultiSelectQuestion = (question) => {
    return question.validOptions && question.type === 'multiselect';
  };

  // Render single field
  const renderSingleField = (question) => {
    if (!isQuestionVisible(question)) return null;

    return (
      <div key={question.questionCode} className="form-field">
        <label htmlFor={question.questionCode}>
          {question.label}
          {question.required && <span className="required">*</span>}
        </label>
        <input
          id={question.questionCode}
          type={question.type === 'decimal' ? 'number' : 'text'}
          placeholder={question.placeholder || ''}
          value={formData[question.questionCode] || ''}
          onChange={(e) => handleInputChange(question.questionCode, e.target.value)}
          required={question.required}
          step={question.type === 'decimal' ? '0.01' : undefined}
        />
        {question.unit && <span className="unit">{question.unit}</span>}
      </div>
    );
  };

  // Render multi-select field with dynamic add/remove
  const renderMultiSelectField = (question) => {
    if (!isQuestionVisible(question)) return null;

    // Parse validOptions
    let options = [];
    try {
      if (typeof question.validOptions === 'string') {
        options = JSON.parse(question.validOptions);
      } else {
        options = question.validOptions;
      }
    } catch (e) {
      options = question.validOptions ? [question.validOptions] : [];
    }

    const selectedData = formData[question.questionCode] || {};
    const selectedOptions = Object.keys(selectedData);
    const availableOptions = options.filter(opt => !selectedOptions.includes(opt));
    const currentDropdownValue = multiSelectState[question.questionCode] || '';

    return (
      <div key={question.questionCode} className="form-field multiselect-field-dynamic">
        <label>{question.label}</label>
        {question.required && <span className="required">*</span>}
        
        {/* Add new option section */}
        <div className="multiselect-add-section">
          <select
            value={currentDropdownValue}
            onChange={(e) => setMultiSelectState(prev => ({
              ...prev,
              [question.questionCode]: e.target.value
            }))}
            className="multiselect-dropdown"
          >
            <option value="">Select {question.label.toLowerCase()} to add...</option>
            {availableOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button
            className="add-button"
            onClick={() => handleAddMultiSelectOption(question.questionCode, currentDropdownValue)}
            disabled={!currentDropdownValue}
          >
            + Add
          </button>
        </div>

        {/* Selected items with value inputs */}
        {selectedOptions.length > 0 && (
          <div className="multiselect-items-container">
            {selectedOptions.map(option => (
              <div key={option} className="multiselect-item-dynamic">
                <div className="item-label">{option}</div>
                <div className="item-input">
                  <input
                    type="number"
                    placeholder="Value"
                    value={selectedData[option]}
                    onChange={(e) => handleMultiSelectValueChange(question.questionCode, option, e.target.value)}
                    step="0.01"
                  />
                  {question.unit && <span className="unit">{question.unit}</span>}
                </div>
                <button
                  className="remove-button"
                  onClick={() => handleRemoveMultiSelectOption(question.questionCode, option)}
                  title="Remove this item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedOptions.length === 0 && (
          <div className="empty-state">
            No items added yet. Select an option above to add.
          </div>
        )}
      </div>
    );
  };

  const renderField = (question) => {
    if (isMultiSelectQuestion(question)) {
      return renderMultiSelectField(question);
    }
    return renderSingleField(question);
  };

  const renderBox = (groupName, boxTitle, questions) => {
    const visibleQuestions = questions.filter(isQuestionVisible);
    if (visibleQuestions.length === 0) return null;

    return (
      <div key={`${groupName}-${boxTitle}`} className="accordion-box">
        <div className="box-header">
          <h3>{boxTitle || groupName}</h3>
        </div>
        <div className="box-content">
          {visibleQuestions.map(renderField)}
        </div>
      </div>
    );
  };

  const renderTab = (dataLevel) => {
    const levelData = questionnaire[dataLevel];
    if (!levelData) return null;

    return (
      <div key={dataLevel} className="tab-content">
        <h2>{dataLevel.replace(/_LEVEL/, '').replace(/_/g, ' ')}</h2>
        
        {Object.entries(levelData).map(([groupName, subGroups]) => {
          const allQuestions = Object.values(subGroups).flat();
          const visibleCount = allQuestions.filter(isQuestionVisible).length;
          
          if (visibleCount === 0) return null;

          return (
            <div key={groupName} className="group-section">
              {Object.entries(subGroups).map(([subGroupName, questions]) => {
                const boxTitle = questions[0]?.TabBoxHeaderTitle || subGroupName;
                return renderBox(groupName, boxTitle, questions);
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Generate clean JSON output
  const generateJsonOutput = () => {
    const output = {
      timestamp: new Date().toISOString(),
      responses: {}
    };

    if (isBorrowerLevel) {
      output.borrowerType = selectedBorrowerType;
    } else if (isLoanLevel) {
      output.borrowerType = selectedBorrowerType;
      output.loanType = selectedLoanType;
    }

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        output.responses[key] = value;
      }
    });

    return JSON.stringify(output, null, 2);
  };

  const jsonOutput = generateJsonOutput();

  return (
    <div className="form-container">
      <h1>{title}</h1>
      
      <div className="selector-group">
        {isBorrowerLevel && (
          <div className="borrower-selector">
            <label htmlFor="borrower-type">Select Borrower Type:</label>
            <select
              id="borrower-type"
              value={selectedBorrowerType}
              onChange={(e) => setSelectedBorrowerType(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Listed">Listed</option>
              <option value="Unlisted">Unlisted</option>
              <option value="MSME">MSME</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Retail">Retail</option>
            </select>
          </div>
        )}

        {isLoanLevel && (
          <>
            <div className="borrower-selector">
              <label htmlFor="borrower-type">Select Borrower Type:</label>
              <select
                id="borrower-type"
                value={selectedBorrowerType}
                onChange={(e) => setSelectedBorrowerType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="Listed">Listed</option>
                <option value="Unlisted">Unlisted</option>
                <option value="MSME">MSME</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Retail">Retail</option>
              </select>
            </div>

            <div className="borrower-selector">
              <label htmlFor="loan-type">Select Loan Type:</label>
              <select
                id="loan-type"
                value={selectedLoanType}
                onChange={(e) => setSelectedLoanType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="Vehicle Loan">Vehicle Loan</option>
                <option value="House Loan">House Loan</option>
                <option value="Personal Loan">Personal Loan</option>
                <option value="Education Loan">Education Loan</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Project Finance">Project Finance</option>
                <option value="Agriculture Loan">Agriculture Loan</option>
                <option value="CRE">CRE</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="tabs">
        {Object.keys(questionnaire).map(renderTab)}
      </div>

      <div className="button-group">
        <button
          className="submit-button"
          onClick={() => setShowJsonOutput(!showJsonOutput)}
        >
          {showJsonOutput ? 'Hide' : 'Show'} JSON Output
        </button>
        <button
          className="download-button"
          onClick={() => {
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonOutput));
            element.setAttribute('download', 'questionnaire-response.json');
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }}
        >
          Download JSON
        </button>
      </div>

      {showJsonOutput && (
        <div className="json-output">
          <h3>JSON Output</h3>
          <pre>{jsonOutput}</pre>
        </div>
      )}
    </div>
  );
}
