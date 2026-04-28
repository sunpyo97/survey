import { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, RefreshCw, Settings, Image as ImageIcon, GitBranch, Shuffle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState({});

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin1234' || IS_DEV) {
      setIsAuthenticated(true);
      fetchQuestions();
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('questions').select('*').order('step');
      if (error) throw error;
      setQuestions((data || []).map(q => ({
        ...q,
        imageUrl: q.image_url || '',
        shuffleOptions: q.shuffle_options || false,
        category: q.category || '',
      })));
    } catch (err) {
      alert('데이터를 불러오는데 실패했습니다: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const rows = questions.map(q => ({
        id: q.id,
        step: q.step,
        type: q.type,
        title: q.title,
        description: q.description || '',
        image_url: q.imageUrl || '',
        options: q.options || '',
        required: q.required || false,
        logic: q.logic || '{}',
        shuffle_options: q.shuffleOptions || false,
        category: q.category || '',
      }));

      const { error: delError } = await supabase.from('questions').delete().neq('id', '');
      if (delError) throw delError;

      if (rows.length > 0) {
        const { error: insError } = await supabase.from('questions').insert(rows);
        if (insError) throw insError;
      }

      alert('성공적으로 저장되었습니다.');
    } catch (err) {
      alert('저장 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestion = () => {
    const newQ = {
      id: `q_${Date.now()}`,
      step: 2,
      type: 'multiple_choice',
      title: '새로운 질문',
      description: '',
      imageUrl: '',
      options: '["옵션 1"]',
      required: false,
      logic: '{}',
      shuffleOptions: false,
      category: ''
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemove = (index) => {
    if (window.confirm('이 질문을 삭제하시겠습니까?')) {
      const newQ = [...questions];
      newQ.splice(index, 1);
      setQuestions(newQ);
    }
  };

  const handleMove = (index, direction) => {
    const newQ = [...questions];
    if (direction === 'up' && index > 0) {
      [newQ[index - 1], newQ[index]] = [newQ[index], newQ[index - 1]];
    } else if (direction === 'down' && index < newQ.length - 1) {
      [newQ[index + 1], newQ[index]] = [newQ[index], newQ[index + 1]];
    }
    setQuestions(newQ);
  };

  const handleChange = (index, field, value) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const toggleSettings = (id) => {
    setExpandedSettings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- Helper Functions for JSON Options/Logic ---
  const getOptionsList = (optionsStr) => {
    try {
      const parsed = JSON.parse(optionsStr);
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
    if (optionsStr) return optionsStr.split(',').map(s => s.trim());
    return [];
  };

  const updateOptionsList = (idx, newList) => {
    handleChange(idx, 'options', JSON.stringify(newList));
  };

  const getLogic = (logicStr) => {
    try {
      const parsed = JSON.parse(logicStr);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch(e) {}
    return {};
  };

  const updateLogic = (idx, newLogic) => {
    handleChange(idx, 'logic', JSON.stringify(newLogic));
  };

  const handleAddOption = (idx) => {
    const opts = getOptionsList(questions[idx].options);
    opts.push(`옵션 ${opts.length + 1}`);
    updateOptionsList(idx, opts);
  };

  const handleRemoveOption = (qIdx, optIdx) => {
    const opts = getOptionsList(questions[qIdx].options);
    const removedOpt = opts[optIdx];
    opts.splice(optIdx, 1);
    updateOptionsList(qIdx, opts);

    // Clean up logic if option is removed
    const logic = getLogic(questions[qIdx].logic);
    if (logic[removedOpt]) {
      delete logic[removedOpt];
      updateLogic(qIdx, logic);
    }
  };

  const handleOptionTextChange = (qIdx, optIdx, newText) => {
    const opts = getOptionsList(questions[qIdx].options);
    const oldText = opts[optIdx];
    opts[optIdx] = newText;
    updateOptionsList(qIdx, opts);

    // Update logic keys if option text changes
    const logic = getLogic(questions[qIdx].logic);
    if (logic[oldText] !== undefined) {
      logic[newText] = logic[oldText];
      delete logic[oldText];
      updateLogic(qIdx, logic);
    }
  };

  const handleLogicChange = (qIdx, optText, targetStep) => {
    const logic = getLogic(questions[qIdx].logic);
    if (targetStep) {
      logic[optText] = Number(targetStep);
    } else {
      delete logic[optText];
    }
    updateLogic(qIdx, logic);
  };


  if (!isAuthenticated) {
    return (
      <div className="state-screen">
        <h2>관리자 로그인</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
          <input 
            type="password" 
            placeholder="비밀번호" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
          <button type="submit" className="btn-primary" style={{ height: '44px' }}>로그인</button>
        </form>
      </div>
    );
  }

  // Calculate available steps for logic branching
  const availableSteps = [...new Set(questions.map(q => q.step))].sort((a,b) => a-b);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-family)', color: 'var(--text-color)', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>설문 문항 관리</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchQuestions} disabled={isLoading} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc', background: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> 새로고침
          </button>
          <button onClick={handleSave} disabled={isSaving} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: 'var(--text-color)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} /> {isSaving ? '저장중...' : '변경사항 저장'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {questions.map((q, idx) => {
          const isExpanded = expandedSettings[q.id];
          const hasOptions = ['multiple_choice', 'checkbox', 'dropdown'].includes(q.type);
          const hasLogic = ['multiple_choice', 'dropdown'].includes(q.type);
          const optionsList = getOptionsList(q.options);
          const logicMap = getLogic(q.logic);

          return (
            <div key={q.id} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', color: idx === 0 ? '#ccc' : '#666' }}><ArrowUp size={20}/></button>
                <button onClick={() => handleMove(idx, 'down')} disabled={idx === questions.length - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: idx === questions.length - 1 ? '#ccc' : '#666' }}><ArrowDown size={20}/></button>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="카테고리 (예: 기본 만족도, 프로그램 구성 만족도)"
                    value={q.category || ''}
                    onChange={(e) => handleChange(idx, 'category', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', color: '#888', background: '#fafafa' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="질문 제목"
                      value={q.title}
                      onChange={(e) => handleChange(idx, 'title', e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', fontWeight: 'bold' }}
                    />
                  </div>
                  <div style={{ width: '180px' }}>
                    <select
                      value={q.type}
                      onChange={(e) => handleChange(idx, 'type', e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                    >
                      <option value="multiple_choice">객관식 질문</option>
                      <option value="checkbox">체크박스</option>
                      <option value="dropdown">드롭다운</option>
                      <option value="short_text">단답형</option>
                      <option value="long_text">장문형</option>
                      <option value="rating5">5점 척도</option>
                      <option value="rating11">11점 척도 (NPS)</option>
                      <option value="linear_scale">선형 배율 (1~5)</option>
                      <option value="date">날짜</option>
                      <option value="time">시간</option>
                      <option value="mentor">멘토 평가</option>
                    </select>
                  </div>
                </div>

                {hasOptions && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {optionsList.map((opt, optIdx) => (
                      <div key={optIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '20px', display: 'flex', justifyContent: 'center', color: '#aaa' }}>
                          {q.type === 'multiple_choice' ? '○' : q.type === 'checkbox' ? '□' : `${optIdx + 1}.`}
                        </div>
                        <input 
                          type="text" 
                          value={opt}
                          onChange={(e) => handleOptionTextChange(idx, optIdx, e.target.value)}
                          style={{ flex: 1, padding: '8px', border: '1px solid #eee', borderRadius: '4px' }}
                        />
                        <button onClick={() => handleRemoveOption(idx, optIdx)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}><Trash2 size={16}/></button>
                      </div>
                    ))}
                    <button onClick={() => handleAddOption(idx)} style={{ alignSelf: 'flex-start', padding: '8px', background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                      <Plus size={16} /> 옵션 추가
                    </button>
                  </div>
                )}
                
                {isExpanded && (
                  <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <Settings size={14}/> 질문 설명 (Description)
                      </label>
                      <input 
                        type="text" 
                        value={q.description || ''} 
                        onChange={(e) => handleChange(idx, 'description', e.target.value)}
                        placeholder="이 질문에 대한 부가 설명을 입력하세요"
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <ImageIcon size={14}/> 이미지 URL
                      </label>
                      <input 
                        type="text" 
                        value={q.imageUrl || ''} 
                        onChange={(e) => handleChange(idx, 'imageUrl', e.target.value)}
                        placeholder="https://example.com/image.png"
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox" 
                          id={`req_${q.id}`} 
                          checked={q.required} 
                          onChange={(e) => handleChange(idx, 'required', e.target.checked)} 
                        />
                        <label htmlFor={`req_${q.id}`} style={{ fontSize: '14px', cursor: 'pointer' }}>필수 응답</label>
                      </div>

                      {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="checkbox" 
                            id={`shuf_${q.id}`} 
                            checked={q.shuffleOptions} 
                            onChange={(e) => handleChange(idx, 'shuffleOptions', e.target.checked)} 
                          />
                          <label htmlFor={`shuf_${q.id}`} style={{ fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Shuffle size={14}/> 선택지 순서 무작위</label>
                        </div>
                      )}
                    </div>

                    {hasLogic && (
                      <div style={{ borderTop: '1px solid #ddd', paddingTop: '16px', marginTop: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                          <GitBranch size={16}/> 조건부 분기 (답변 기준 섹션 이동)
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {optionsList.map((opt, optIdx) => (
                            <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '13px', width: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt}</span>
                              <span style={{ fontSize: '12px', color: '#888' }}>→</span>
                              <select 
                                value={logicMap[opt] || ''} 
                                onChange={(e) => handleLogicChange(idx, opt, e.target.value)}
                                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}
                              >
                                <option value="">다음 스텝으로 계속</option>
                                <option value="999">설문 제출(종료)</option>
                                {availableSteps.map(s => (
                                  s > q.step ? <option key={s} value={s}>스텝 {s}(으)로 이동</option> : null
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', color: '#666' }}>스텝(섹션) 번호:</label>
                    <input 
                      type="number" 
                      min="2" 
                      value={q.step} 
                      onChange={(e) => handleChange(idx, 'step', Number(e.target.value))}
                      style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', textAlign: 'center' }}
                    />
                  </div>
                  <button onClick={() => toggleSettings(q.id)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Settings size={16}/> 상세 설정 {isExpanded ? '닫기' : '열기'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <button onClick={() => handleRemove(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f', padding: '8px' }}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          );
        })}

        <button onClick={handleAddQuestion} style={{ padding: '20px', borderRadius: '12px', border: '2px dashed #ccc', background: '#fafafa', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: '#666', fontSize: '16px', fontWeight: 'bold' }}>
          <Plus size={24} /> 새 문항 추가
        </button>
      </div>
    </div>
  );
}
