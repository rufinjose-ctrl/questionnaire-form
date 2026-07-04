import { useState } from 'react';
import './DynamicForm.css';

export default function EnhancedDynamicForm({ questionnaire, title }) {
  const [formData, setFormData] = useState({});
  const [selectedBorrowerType, setSelectedBorrowerType] = useState('all');
  const [showJsonOutput, setShowJsonOutput] = useState(false);

  // Handle single value inputs
  const handleInputChange = (questionCode, value) => {
    setFormData(prev => ({
      ...prev,
      [questionCode]: value
    }));
  };

  // Handle multi-select field inputs
  const handleMultiSelectChange = (questionCode, selectKey, value) => {
    setFormData(prev => ({
      ...prev,
      [questionCode]: {
        ...(prev[questionCode] || {}),
        [selectKey]: value
      }
    }));
  };

  // Handle checkbox for multi-select options
  const handleMultiSelectCheckbox = (questionCode, selectKey, isChecked) => {
    setFormData(prev => {
      const current = prev[questionCode] || {};
      if (isChecked) {
        return {
          ...prev,
          [questionCode]: {
            ...current,
            [selectKey]: current[selectKey] || ''
          }
        };
      } else {
        const updated = { ...current };
        delete updated[selectKey];
        return {
          ...prev,
          [questionCode]: Object.keys(updated).length > 0 ? updated : undefined
        };
      }
    });
  };

  const isQuestionVisible = (question) => {
    if (!question.borrowerTypes) return true;
    if (question.borrowerTypes.includes('all')) return true;
    return question.borrowerTypes.includes(selectedBorrowerType);
  };

  // Example: Detect multi-select questions (those with validOptions)
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

  // Render multi-select field (like Fuel Types)
  const renderMultiSelectField = (question) => {
    if (!isQuestionVisible(question)) return null;

    // Parse validOptions - could be JSON string or array
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

    return (
      <div key={question.questionCode} className="form-field multiselect-field">
        <label>{question.label}</label>
        {question.required && <span className="required">*</span>}
        
        <div className="multiselect-container">
          {options.map((option) => (
            <div key={option} className="multiselect-item">
              <input
                type="checkbox"
                id={`${question.questionCode}-${option}`}
                checked={option in selectedData}
                onChange={(e) =>
                  handleMultiSelectCheckbox(question.questionCode, option, e.target.checked)
                }
              />
              <label htmlFor={`${question.questionCode}-${option}`} className="checkbox-label">
                {option}
              </label>
              
              {option in selectedData && (
                <div className="multiselect-value-input">
                  <input
                    type="number"
                    placeholder="Value"
                    value={selectedData[option]}
                    onChange={(e) =>
                      handleMultiSelectChange(question.questionCode, option, e.target.value)
                    }
                    step="0.01"
                  />
                  {question.unit && <span className="unit">{question.unit}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
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
      borrowerType: selectedBorrowerType,
      responses: {}
    };

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
      
      {Object.keys(questionnaire).some(level => level.includes('BORROWER')) && (
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
