'use client';

import { useState } from 'react';
import DynamicForm from '@/components/DynamicForm';
import borrowerQuestionnaire from '@/data/borrower-questions.json';
import loanQuestionnaire from '@/data/loan-questions.json';

export default function Home() {
  const [activeTab, setActiveTab] = useState('borrower');

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa' }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          borderBottom: '2px solid #ddd',
        }}>
          <button
            onClick={() => setActiveTab('borrower')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'borrower' ? '#0070f3' : '#f5f5f5',
              color: activeTab === 'borrower' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            ESG (Borrower) Questionnaire
          </button>
          <button
            onClick={() => setActiveTab('loan')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'loan' ? '#0070f3' : '#f5f5f5',
              color: activeTab === 'loan' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            FE (Loan) Questionnaire
          </button>
        </div>

        {activeTab === 'borrower' && (
          <DynamicForm
            questionnaire={borrowerQuestionnaire}
            title="ESG Questionnaire - Borrower Level"
          />
        )}

        {activeTab === 'loan' && (
          <DynamicForm
            questionnaire={loanQuestionnaire}
            title="Financed Emissions Questionnaire - Loan Level"
          />
        )}
      </div>
    </main>
  );
}
