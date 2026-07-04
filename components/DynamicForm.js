import { useState } from 'react';
import './DynamicForm.css';

export default function DynamicForm({ questionnaire, title }) {
  const [formData, setFormData] = useState({});
  const [selectedBorrowerType, setSelectedBorrowerType] = useState('all');

  const handleInputChange = (questionCode, value) => {
    setFormData(prev => ({
      ...prev,
      [questionCode]: value
    }));
  };

  const isQuestionVisible = (question) => {
    if (!question.borrowerTypes) return true;
    if (question.borrowerTypes.includes('all')) return true;
    return question.borrowerTypes.includes(selectedBorrowerType);
  };

  const renderField = (question) => {
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

      <button className="submit-button" onClick={() => console.log('Form Data:', formData)}>
        Submit
      </button>
    </div>
  );
}
