import { useState, useRef } from 'react';
import './DynamicForm.css';

export default function EnhancedDynamicForm({ questionnaire, title }) {
  const [formData, setFormData] = useState({});
  const [selectedBorrowerType, setSelectedBorrowerType] = useState('all');
  const [selectedLoanType, setSelectedLoanType] = useState('all');
  const [showJsonOutput, setShowJsonOutput] = useState(false);
  const [multiSelectState, setMultiSelectState] = useState({});
  const fileInputRef = useRef(null);

  // Determine questionnaire type
  const dataLevels = Object.keys(questionnaire);
  const isBorrowerLevel = dataLevels.some(level => level.includes('BORROWER'));
  const isLoanLevel = dataLevels.some(level => level.includes('LOAN'));

  // Get all questions for metadata
  const getAllQuestions = () => {
    const allQuestions = [];
    Object.values(questionnaire).forEach(levels => {
      Object.values(levels).forEach(groups => {
        Object.values(groups).forEach(subgroups => {
          allQuestions.push(...subgroups);
        });
      });
    });
    return allQuestions;
  };

  const questionMap = {};
  getAllQuestions().forEach(q => {
    questionMap[q.questionCode] = q;
  });

  // Handle single value inputs with validation
  const handleInputChange = (questionCode, value) => {
    setFormData(prev => ({
      ...prev,
      [questionCode]: value
    }));
  };

  // Handle multi-select value input with min/max validation
  const handleMultiSelectValueChange = (questionCode, option, value) => {
    const question = questionMap[questionCode];
    const validOptions = question?.validOptions;
    const optionMeta = validOptions?.[option];
    
    // Validate against min/max if available
    const numValue = parseFloat(value);
    if (optionMeta && !isNaN(numValue)) {
      if (optionMeta.min !== undefined && numValue < optionMeta.min) {
        console.warn(`Value ${numValue} is below minimum ${optionMeta.min}`);
      }
      if (optionMeta.max !== undefined && numValue > optionMeta.max) {
        console.warn(`Value ${numValue} is above maximum ${optionMeta.max}`);
      }
    }

    setFormData(prev => ({
      ...prev,
      [questionCode]: {
        ...(prev[questionCode] || {}),
        [option]: value
      }
    }));
  };

  // Add multi-select option
  const handleAddMultiSelectOption = (questionCode, option) => {
    if (!option) return;
    
    setFormData(prev => ({
      ...prev,
      [questionCode]: {
        ...(prev[questionCode] || {}),
        [option]: ''
      }
    }));

    setMultiSelectState(prev => ({
      ...prev,
      [questionCode]: ''
    }));
  };

  // Remove multi-select option
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

  // Handle file upload for JSON import
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result);
        const responses = json.responses || {};
        const newFormData = {};

        // Convert imported JSON back to form data
        Object.entries(responses).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Multi-select or nested structure
            if (value.items) {
              const items = {};
              Object.entries(value.items).forEach(([itemKey, itemValue]) => {
                if (typeof itemValue === 'object' && itemValue.value !== undefined) {
                  items[itemKey] = itemValue.value;
                } else {
                  items[itemKey] = itemValue;
                }
              });
              newFormData[key] = items;
            } else if (value.value !== undefined) {
              newFormData[key] = value.value;
            } else {
              newFormData[key] = value;
            }
          } else {
            newFormData[key] = value;
          }
        });

        setFormData(newFormData);
        alert('✅ Form loaded successfully!');
      } catch (error) {
        alert('❌ Error loading JSON: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const isQuestionVisible = (question) => {
    if (isBorrowerLevel) {
      if (!question.borrowerTypes) return true;
      if (question.borrowerTypes.includes('all')) return true;
      return question.borrowerTypes.includes(selectedBorrowerType);
    } else if (isLoanLevel) {
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

  // Render multi-select field with nested validOptions
  const renderMultiSelectField = (question) => {
    if (!isQuestionVisible(question)) return null;

    const validOptions = question.validOptions;
    const isNested = validOptions && typeof validOptions === 'object' && 
                     !Array.isArray(validOptions) && 
                     Object.values(validOptions)[0]?.unit;

    let optionList = [];
    if (isNested) {
      optionList = Object.keys(validOptions);
    } else if (Array.isArray(validOptions)) {
      optionList = validOptions;
    }

    const selectedData = formData[question.questionCode] || {};
    const selectedOptions = Object.keys(selectedData);
    const availableOptions = optionList.filter(opt => !selectedOptions.includes(opt));
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
            {selectedOptions.map(option => {
              const optionMeta = isNested ? validOptions[option] : {};
              const unit = optionMeta.unit || question.unit;
              const min = optionMeta.min;
              const max = optionMeta.max;

              return (
                <div key={option} className="multiselect-item-dynamic">
                  <div className="item-label">{option}</div>
                  <div className="item-input">
                    <input
                      type="number"
                      placeholder="Value"
                      value={selectedData[option]}
                      onChange={(e) => handleMultiSelectValueChange(question.questionCode, option, e.target.value)}
                      step={optionMeta.type === 'integer' ? '1' : '0.01'}
                      min={min}
                      max={max}
                      title={min !== undefined && max !== undefined ? `Range: ${min} - ${max}` : ''}
                    />
                    {unit && <span className="unit">{unit}</span>}
                  </div>
                  <button
                    className="remove-button"
                    onClick={() => handleRemoveMultiSelectOption(question.questionCode, option)}
                    title="Remove this item"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
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

  // Generate JSON output with proper typing
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
        const question = questionMap[key];
        
        if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
          // Multi-select
          const validOptions = question?.validOptions;
          const isNested = validOptions && typeof validOptions === 'object' && 
                          !Array.isArray(validOptions) && 
                          Object.values(validOptions)[0]?.unit;

          const items = {};
          Object.entries(value).forEach(([itemKey, itemValue]) => {
            const optionMeta = isNested ? validOptions[itemKey] : {};
            const numValue = itemValue !== '' ? parseFloat(itemValue) : null;
            
            items[itemKey] = {
              value: optionMeta.type === 'integer' && numValue ? parseInt(numValue) : numValue,
              type: optionMeta.type || 'decimal',
              unit: optionMeta.unit || question?.unit
            };
          });

          output.responses[key] = {
            type: 'multiselect',
            items: items
          };
        } else {
          // Single value - convert type if needed
          const numValue = question?.type === 'decimal' ? parseFloat(value) : 
                          question?.type === 'integer' ? parseInt(value) : value;
          
          output.responses[key] = {
            value: numValue,
            type: question?.type || 'text',
            unit: question?.unit || null
          };
        }
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
          className="import-button"
          onClick={() => fileInputRef.current?.click()}
        >
          📁 Load Saved Form
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        
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
            element.setAttribute('download', `questionnaire-${new Date().toISOString().slice(0,10)}.json`);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }}
        >
          ⬇️ Download JSON
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
