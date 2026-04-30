import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const IS_DEV = import.meta.env.DEV;

const RatingScale = ({ value, onChange, max = 5 }) => {
  return (
    <div className={`rating-options ${max > 5 ? 'nps-options' : ''}`}>
      {Array.from({ length: max }, (_, i) => max > 5 ? i : i + 1).map((num) => (
        <button
          key={num}
          className={`rating-btn ${value === num ? 'selected' : ''}`}
          onClick={() => onChange(num)}
        >
          {num}
        </button>
      ))}
    </div>
  );
};

const IntroScreen = ({ onStart }) => {
  return (
    <div className="state-screen" style={{ justifyContent: 'center', animation: 'fadeIn 0.5s ease-out' }}>
      <div className="state-icon" style={{ fontSize: '64px', marginBottom: '24px' }}>📝</div>
      <h1 style={{ fontSize: '32px', marginBottom: '20px', fontWeight: '800', letterSpacing: '-1px', lineHeight: '1.3', wordBreak: 'keep-all' }}>
        2026 KODA 대표자 해커톤 연수<br/>만족도 조사
      </h1>
      <p style={{ color: 'var(--text-light)', marginBottom: '48px', lineHeight: '1.7', fontSize: '16px', wordBreak: 'keep-all' }}>
        연수에 참여해주셔서 진심으로 감사합니다.<br/>
        더욱 발전하는 다음 프로그램을 위해<br/>
        여러분의 소중한 경험을 나누어주세요!
      </p>
      <button
        className="btn-primary"
        style={{ width: '100%', maxWidth: '300px', flex: 'none', height: '54px', fontSize: '18px' }}
        onClick={onStart}
      >
        설문 시작하기
      </button>
    </div>
  );
};

const RespondentInfoScreen = ({ onNext, info, onChange }) => {
  const handleSubmit = () => {
    if (!info.name.trim()) { alert('성함을 입력해주세요.'); return; }
    if (!info.org.trim()) { alert('소속을 입력해주세요.'); return; }
    if (!info.title.trim()) { alert('직함을 입력해주세요.'); return; }
    onNext();
  };

  const fieldStyle = {
    display: 'flex', flexDirection: 'column', gap: '8px',
  };
  const labelStyle = { fontSize: '15px', fontWeight: '600', color: 'var(--text-color)' };
  const inputStyle = {
    padding: '14px 16px', borderRadius: '10px', border: '1.5px solid var(--border-color)',
    fontSize: '16px', outline: 'none', transition: 'border-color 0.2s',
    fontFamily: 'var(--font-family)',
  };

  return (
    <div className="app-container">
      <div className="content" style={{ marginTop: '32px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>기본 정보 입력</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.6' }}>
            설문을 시작하기 전에 기본 정보를 입력해주세요.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>성함 <span style={{ color: 'var(--primary-color)' }}>*</span></label>
            <input
              type="text"
              placeholder=""
              value={info.name}
              onChange={(e) => onChange({ ...info, name: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>소속 <span style={{ color: 'var(--primary-color)' }}>*</span></label>
            <input
              type="text"
              placeholder=""
              value={info.org}
              onChange={(e) => onChange({ ...info, org: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>직함 <span style={{ color: 'var(--primary-color)' }}>*</span></label>
            <input
              type="text"
              placeholder=""
              value={info.title}
              onChange={(e) => onChange({ ...info, title: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div className="bottom-actions">
        <button className="btn-primary" onClick={handleSubmit}>
          다음으로
        </button>
      </div>
    </div>
  );
};

const parseOptions = (optionsStr) => {
  try {
    const parsed = JSON.parse(optionsStr);
    if (Array.isArray(parsed)) return parsed;
  } catch(e) {}
  if (optionsStr) return optionsStr.split(',').map(s => s.trim());
  return [];
};

const DynamicQuestion = ({ question, value, onChange, mentors }) => {
  const { type, title, required, description, imageUrl, options, shuffleOptions } = question;

  const displayOptions = useMemo(() => {
    let opts = parseOptions(options);
    if (shuffleOptions) {
      // Fisher-Yates shuffle
      const shuffled = [...opts];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return opts;
  }, [options, shuffleOptions]);

  const renderInput = () => {
    switch (type) {
      case 'multiple_choice':
        return (
          <div className="options-vertical">
            {displayOptions.map((opt, idx) => (
              <label key={idx} className="option-label">
                <input 
                  type="radio" 
                  name={`q_${question.id}`} 
                  value={opt} 
                  checked={value === opt} 
                  onChange={(e) => onChange(e.target.value)} 
                  className="radio-input"
                />
                <span className="option-text">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="options-vertical">
            {displayOptions.map((opt, idx) => {
              const isChecked = Array.isArray(value) && value.includes(opt);
              return (
                <label key={idx} className="option-label">
                  <input 
                    type="checkbox" 
                    value={opt} 
                    checked={isChecked} 
                    onChange={(e) => {
                      const currentVals = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        onChange([...currentVals, opt]);
                      } else {
                        onChange(currentVals.filter(v => v !== opt));
                      }
                    }} 
                    className="checkbox-input"
                  />
                  <span className="option-text">{opt}</span>
                </label>
              );
            })}
          </div>
        );
      case 'dropdown':
        return (
          <select 
            className="textarea-input" 
            style={{ minHeight: '48px', appearance: 'auto' }} 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="" disabled>선택해주세요</option>
            {displayOptions.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'date':
        return <input type="date" className="textarea-input" style={{ minHeight: '48px' }} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
      case 'time':
        return <input type="time" className="textarea-input" style={{ minHeight: '48px' }} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
      case 'linear_scale':
      case 'rating5':
        return (
          <>
            <RatingScale value={value} onChange={onChange} max={5} />
            <div className="scale-labels">
              <span>{question.label_min || '매우 불만족'}</span>
              <span>{question.label_max || '매우 만족'}</span>
            </div>
          </>
        );
      case 'rating11':
        return (
          <>
            <RatingScale value={value} onChange={onChange} max={11} />
            <div className="scale-labels">
              <span>{question.label_min || '0점 (절대 안함)'}</span>
              <span>{question.label_max || '10점 (적극 추천)'}</span>
            </div>
          </>
        );
      case 'short_text':
        return (
          <input 
            type="text" 
            className="textarea-input" 
            style={{ minHeight: '48px' }} 
            placeholder="답변을 입력해주세요." 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)} 
          />
        );
      case 'long_text':
        return (
          <textarea 
            className="textarea-input" 
            placeholder="자유롭게 작성해주세요." 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)} 
          />
        );
      case 'mentor':
        return (
          <div>
            {mentors.length === 0 ? <p>등록된 멘토가 없습니다.</p> : mentors.map(mentor => {
              const currentMentorValue = (value || []).find(m => m.id === mentor.id);
              const score = currentMentorValue ? currentMentorValue.score : null;
              
              const handleMentorScore = (v) => {
                const newMentors = [...(value || [])];
                const existingIndex = newMentors.findIndex(m => m.id === mentor.id);
                if (existingIndex >= 0) newMentors[existingIndex].score = v;
                else newMentors.push({ id: mentor.id, name: mentor.name, score: v });
                onChange(newMentors);
              };

              return (
                <div key={mentor.id} className="mentor-card" style={{ marginBottom: '12px' }}>
                  <div className="mentor-info">
                    <h3>{mentor.name} 멘토님</h3>
                    <p>{mentor.role}</p>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <RatingScale value={score} onChange={handleMentorScore} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      default:
        return <p>지원하지 않는 문항 타입입니다.</p>;
    }
  };

  return (
    <div className="question-group">
      <div className="question-header" style={{ marginBottom: '16px' }}>
        <h3 className="question-title" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', lineHeight: '1.4' }}>
          {title} {required && <span style={{ color: 'var(--primary-color)' }}>*</span>}
        </h3>
        {description && (
          <p className="question-description" style={{ fontSize: '14px', color: '#666', marginBottom: '12px', lineHeight: '1.5' }}>
            {description}
          </p>
        )}
        {imageUrl && (
          <div style={{ marginBottom: '16px' }}>
            <img src={imageUrl} alt={title} style={{ maxWidth: '100%', borderRadius: '8px' }} />
          </div>
        )}
      </div>
      {renderInput()}
    </div>
  );
};

export default function SurveyPage() {
  const [step, setStep] = useState(0);
  const [stepHistory, setStepHistory] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [respondentInfo, setRespondentInfo] = useState({ name: '', org: '', title: '' });

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const [{ data: qData }, { data: mData }] = await Promise.all([
          supabase.from('questions').select('*').order('step'),
          supabase.from('mentors').select('*'),
        ]);
        setQuestions((qData || []).map(q => ({
          ...q,
          imageUrl: q.image_url,
          shuffleOptions: q.shuffle_options,
          label_min: q.label_min || '',
          label_max: q.label_max || '',
        })));
        setMentors(mData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setStep(1);
      }
    };

    loadQuestions();
  }, []);

  // 전체 가능한 스텝 목록 정렬
  const availableSteps = [...new Set(questions.map(q => q.step))].sort((a,b) => a-b);
  const maxStep = availableSteps.length > 0 ? Math.max(...availableSteps) : 2;
  const currentStepQuestions = questions.filter(q => q.step === step);

  // 전체 질문 기준 카테고리 순서 (번호 연속성 유지)
  const globalCategoryOrder = [...questions]
    .sort((a, b) => a.step - b.step)
    .reduce((acc, q) => {
      const cat = q.category || '';
      if (cat && !acc.includes(cat)) acc.push(cat);
      return acc;
    }, []);

  const getLogicTargetStep = () => {
    for (const q of currentStepQuestions) {
      if (!q.logic) continue;
      let logicMap = {};
      try { logicMap = JSON.parse(q.logic); } catch(e) {}
      
      const answer = answers[q.id];
      if (answer && logicMap[answer]) {
        return Number(logicMap[answer]);
      }
    }
    return null;
  };

  const handleNext = () => {
    // 필수 문항 검증
    const requiredQuestions = currentStepQuestions.filter(q => q.required);
    for (const rq of requiredQuestions) {
      const val = answers[rq.id];
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        alert('필수 문항에 답변해주세요.');
        return;
      }
    }

    // 조건부 분기 계산
    const logicTargetStep = getLogicTargetStep();
    let nextStep;

    if (logicTargetStep === 999) {
      nextStep = maxStep + 1; // 종료
    } else if (logicTargetStep && logicTargetStep > step) {
      nextStep = logicTargetStep;
    } else {
      // 일반적인 다음 스텝 찾기
      const nextAvailableIndex = availableSteps.findIndex(s => s > step);
      if (nextAvailableIndex !== -1) {
        nextStep = availableSteps[nextAvailableIndex];
      } else {
        nextStep = maxStep + 1; // 제출
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStepHistory([...stepHistory, step]);
    setStep(nextStep);
  };

  const handlePrev = () => {
    if (stepHistory.length === 0) return;
    const prev = stepHistory[stepHistory.length - 1];
    setStepHistory(stepHistory.slice(0, -1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(prev);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (IS_DEV) {
      setTimeout(() => { setIsSubmitting(false); setStep(maxStep + 1); }, 1500);
      return;
    }

    try {
      const { error } = await supabase.from('responses').insert({
        answers: {
          ...answers,
          _respondent_name: respondentInfo.name,
          _respondent_org: respondentInfo.org,
          _respondent_title: respondentInfo.title,
        },
      });
      if (error) throw error;
      setStep(maxStep + 1);
    } catch (err) {
      alert('제출 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAnswer = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  if (step === 0) return <div className="state-screen"><div className="loader"></div><p>데이터 로딩중...</p></div>;
  if (step === 1) return <IntroScreen onStart={() => setStep('info')} />;
  if (step === 'info') return (
    <RespondentInfoScreen
      info={respondentInfo}
      onChange={setRespondentInfo}
      onNext={() => { setStepHistory(['info']); setStep(availableSteps[0] || 2); }}
    />
  );
  if (step > maxStep) return <div className="state-screen"><div className="state-icon">🎉</div><h2>설문이 완료되었습니다</h2><p>감사합니다!</p></div>;

  // 진행률 계산
  const currentStepIndex = availableSteps.indexOf(step);
  const progressPercent = currentStepIndex >= 0 ? (currentStepIndex / availableSteps.length) * 100 : 100;

  return (
    <div className="app-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>

      <div className="content" style={{ marginTop: '24px' }}>
        {(() => {
          const categories = [];
          const seen = {};
          currentStepQuestions.forEach(q => {
            const cat = q.category || '';
            if (!seen[cat]) { seen[cat] = true; categories.push(cat); }
          });

          return categories.map((cat, catIdx) => {
            const catQuestions = currentStepQuestions.filter(q => (q.category || '') === cat);
            return (
              <div key={cat || catIdx} style={{ marginBottom: '32px' }}>
                {cat && (
                  <div style={{ marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid #e0e0e0' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-color)' }}>
                      {globalCategoryOrder.indexOf(cat) + 1}. {cat}
                    </h2>
                  </div>
                )}
                {catQuestions.map(q => (
                  <DynamicQuestion
                    key={q.id}
                    question={q}
                    value={answers[q.id]}
                    onChange={(val) => updateAnswer(q.id, val)}
                    mentors={mentors}
                  />
                ))}
              </div>
            );
          });
        })()}
        {currentStepQuestions.length === 0 && <p>이 스텝에는 설정된 문항이 없습니다.</p>}
      </div>

      <div className="bottom-actions">
        {stepHistory.length > 1 && <button className="btn-secondary" onClick={handlePrev}>← 이전</button>}
        
        {step < maxStep && getLogicTargetStep() !== 999 ? (
          <button className="btn-primary" onClick={handleNext}>다음으로</button>
        ) : (
          <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '제출 중...' : '제출하기'}
          </button>
        )}
      </div>
    </div>
  );
}
