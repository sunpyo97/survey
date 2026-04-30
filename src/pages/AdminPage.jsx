import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, RefreshCw, Settings, Image as ImageIcon, GitBranch, Shuffle, Download, BarChart2, Table2, Users } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '../lib/supabase';

const CHART_COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9'];

function QuestionChart({ question, responses }) {
  const answers = responses.map(r => (r.answers || {})[question.id]).filter(v => v !== undefined && v !== null && v !== '');
  if (answers.length === 0) return <p style={{ color: '#aaa', fontSize: '13px' }}>응답 없음</p>;

  const type = question.type;

  if (['rating5', 'linear_scale', 'rating11'].includes(type)) {
    const max = type === 'rating11' ? 11 : 5;
    const labels = type === 'rating11'
      ? Array.from({ length: 11 }, (_, i) => i)
      : Array.from({ length: 5 }, (_, i) => i + 1);
    const counts = {};
    labels.forEach(l => { counts[l] = 0; });
    answers.forEach(v => { const n = Number(v); if (counts[n] !== undefined) counts[n]++; });
    const total = answers.length;
    const avg = (answers.reduce((s, v) => s + Number(v), 0) / total).toFixed(1);
    const data = labels.map(l => ({ name: String(l), count: counts[l], pct: total ? Math.round(counts[l] / total * 100) : 0 }));
    const pieData = data.filter(d => d.count > 0);

    return (
      <div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#e67e22' }}>{avg}</div>
            <div style={{ fontSize: '11px', color: '#999' }}>평균 ({max}점 만점)</div>
          </div>
          <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#27ae60' }}>{total}</div>
            <div style={{ fontSize: '11px', color: '#999' }}>응답 수</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, pct }) => `${name}점 ${pct}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v}명`, `${n}점`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [`${v}명`]} />
                <Bar dataKey="count" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  if (['multiple_choice', 'dropdown'].includes(type)) {
    const counts = {};
    answers.forEach(v => {
      const key = typeof v === 'string' && v.startsWith('기타:') ? '기타' : v;
      counts[key] = (counts[key] || 0) + 1;
    });
    const total = answers.length;
    const data = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count, pct: Math.round(count / total * 100) }));
    return (
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '180px' }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}명 (${Math.round(v / total * 100)}%)`, n]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: '1', minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{d.name}</span>
              <span style={{ fontWeight: 'bold' }}>{d.count}명</span>
              <span style={{ color: '#999', width: '36px', textAlign: 'right' }}>{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'checkbox') {
    const counts = {};
    answers.forEach(arr => { (Array.isArray(arr) ? arr : [arr]).forEach(v => { counts[v] = (counts[v] || 0) + 1; }); });
    const total = responses.length;
    const data = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count, pct: Math.round(count / total * 100) }));
    return (
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
          <Tooltip formatter={(v) => [`${v}명`]} />
          <Bar dataKey="count" fill="#45B7D1" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, formatter: (v) => `${v}명` }} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
      {answers.map((a, i) => (
        <div key={i} style={{ fontSize: '13px', padding: '6px 10px', background: '#f8f9fa', borderRadius: '6px', color: '#444' }}>
          {String(a)}
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('questions');
  const [responseView, setResponseView] = useState('chart');
  const [expandedRespondent, setExpandedRespondent] = useState(null);

  // 문항 관리
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState({});

  // 응답 현황
  const [responses, setResponses] = useState([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin1234') {
      setIsAuthenticated(true);
      fetchQuestions();
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'responses') {
      fetchResponses();
    }
  }, [isAuthenticated, activeTab]);

  // ── 문항 관련 ──────────────────────────────

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
        label_min: q.label_min || '',
        label_max: q.label_max || '',
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
        label_min: q.label_min || '',
        label_max: q.label_max || '',
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
    setQuestions([...questions, {
      id: `q_${Date.now()}`,
      step: 2, type: 'multiple_choice', title: '새로운 질문',
      description: '', imageUrl: '', options: '["옵션 1"]',
      required: false, logic: '{}', shuffleOptions: false, category: '',
      label_min: '', label_max: ''
    }]);
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
    if (direction === 'up' && index > 0) [newQ[index - 1], newQ[index]] = [newQ[index], newQ[index - 1]];
    else if (direction === 'down' && index < newQ.length - 1) [newQ[index + 1], newQ[index]] = [newQ[index], newQ[index + 1]];
    setQuestions(newQ);
  };

  const handleChange = (index, field, value) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const toggleSettings = (id) => setExpandedSettings(prev => ({ ...prev, [id]: !prev[id] }));

  const getOptionsList = (optionsStr) => {
    try { const p = JSON.parse(optionsStr); if (Array.isArray(p)) return p; } catch(e) {}
    if (optionsStr) return optionsStr.split(',').map(s => s.trim());
    return [];
  };
  const updateOptionsList = (idx, newList) => handleChange(idx, 'options', JSON.stringify(newList));
  const getLogic = (logicStr) => { try { const p = JSON.parse(logicStr); if (p && typeof p === 'object') return p; } catch(e) {} return {}; };
  const updateLogic = (idx, newLogic) => handleChange(idx, 'logic', JSON.stringify(newLogic));

  const handleAddOption = (idx) => {
    const opts = getOptionsList(questions[idx].options);
    opts.push(`옵션 ${opts.length + 1}`);
    updateOptionsList(idx, opts);
  };
  const handleRemoveOption = (qIdx, optIdx) => {
    const opts = getOptionsList(questions[qIdx].options);
    const removed = opts[optIdx];
    opts.splice(optIdx, 1);
    updateOptionsList(qIdx, opts);
    const logic = getLogic(questions[qIdx].logic);
    if (logic[removed]) { delete logic[removed]; updateLogic(qIdx, logic); }
  };
  const handleOptionTextChange = (qIdx, optIdx, newText) => {
    const opts = getOptionsList(questions[qIdx].options);
    const old = opts[optIdx];
    opts[optIdx] = newText;
    updateOptionsList(qIdx, opts);
    const logic = getLogic(questions[qIdx].logic);
    if (logic[old] !== undefined) { logic[newText] = logic[old]; delete logic[old]; updateLogic(qIdx, logic); }
  };
  const handleLogicChange = (qIdx, optText, targetStep) => {
    const logic = getLogic(questions[qIdx].logic);
    if (targetStep) logic[optText] = Number(targetStep);
    else delete logic[optText];
    updateLogic(qIdx, logic);
  };

  // ── 응답 현황 관련 ──────────────────────────

  const fetchResponses = async () => {
    setIsLoadingResponses(true);
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setResponses(data || []);
    } catch (err) {
      alert('응답 데이터를 불러오는데 실패했습니다: ' + err.message);
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const formatAnswer = (val) => {
    if (val === null || val === undefined) return '';
    if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? `${v.name}(${v.score}점)` : v).join(', ');
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const handleClearResponses = async () => {
    if (responses.length === 0) { alert('삭제할 응답이 없습니다.'); return; }
    if (!window.confirm(`응답 ${responses.length}건을 모두 삭제합니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?`)) return;
    try {
      const { error } = await supabase.from('responses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setResponses([]);
      alert('모든 응답이 삭제되었습니다.');
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다: ' + err.message);
    }
  };

  const handleExportExcel = () => {
    if (responses.length === 0) { alert('내보낼 데이터가 없습니다.'); return; }

    const sortedQuestions = [...questions].sort((a, b) => a.step - b.step);
    const qIds = sortedQuestions.map(q => q.id);

    const headers = ['제출시간', '성함', '소속', '직함', ...sortedQuestions.map(q => q.title || q.id)];

    const rows = responses.map(r => {
      const answers = r.answers || {};
      const time = new Date(r.created_at).toLocaleString('ko-KR');
      return [
        time,
        answers._respondent_name || '',
        answers._respondent_org || '',
        answers._respondent_title || '',
        ...qIds.map(id => formatAnswer(answers[id])),
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => {
        const str = String(cell ?? '');
        return str.includes(',') || str.includes('\n') || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(','))
      .join('\n');

    const BOM = '﻿';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey_responses_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── 렌더링 ──────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="state-screen">
        <h2>관리자 로그인</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
          <input type="password" placeholder="비밀번호" value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <button type="submit" className="btn-primary" style={{ height: '44px' }}>로그인</button>
        </form>
      </div>
    );
  }

  const availableSteps = [...new Set(questions.map(q => q.step))].sort((a, b) => a - b);
  const tabStyle = (tab) => ({
    padding: '10px 24px', cursor: 'pointer', borderRadius: '8px 8px 0 0',
    border: '1px solid', borderBottom: activeTab === tab ? '1px solid #fff' : '1px solid #ddd',
    background: activeTab === tab ? '#fff' : '#f5f5f5',
    borderColor: activeTab === tab ? '#ddd' : '#ddd',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    color: activeTab === tab ? 'var(--primary-color)' : '#666',
    fontSize: '14px', marginBottom: '-1px',
  });

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: 'var(--font-family)', color: 'var(--text-color)', paddingBottom: '100px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>관리자 페이지</h1>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #ddd', marginBottom: '24px' }}>
        <button style={tabStyle('questions')} onClick={() => setActiveTab('questions')}>설문 문항 관리</button>
        <button style={tabStyle('responses')} onClick={() => setActiveTab('responses')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart2 size={14} /> 응답 현황 {responses.length > 0 && `(${responses.length})`}
          </span>
        </button>
      </div>

      {/* ── 문항 관리 탭 ── */}
      {activeTab === 'questions' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '16px' }}>
            <button onClick={fetchQuestions} disabled={isLoading}
              style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc', background: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} /> 새로고침
            </button>
            <button onClick={handleSave} disabled={isSaving}
              style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: 'var(--text-color)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> {isSaving ? '저장중...' : '변경사항 저장'}
            </button>
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
                    <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', color: idx === 0 ? '#ccc' : '#666' }}><ArrowUp size={20} /></button>
                    <button onClick={() => handleMove(idx, 'down')} disabled={idx === questions.length - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: idx === questions.length - 1 ? '#ccc' : '#666' }}><ArrowDown size={20} /></button>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <input type="text" placeholder="카테고리 (예: 기본 만족도)" value={q.category || ''}
                        onChange={(e) => handleChange(idx, 'category', e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', color: '#888', background: '#fafafa' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <input type="text" placeholder="질문 제목" value={q.title}
                          onChange={(e) => handleChange(idx, 'title', e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', fontWeight: 'bold' }} />
                      </div>
                      <div style={{ width: '180px' }}>
                        <select value={q.type} onChange={(e) => handleChange(idx, 'type', e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}>
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
                            <input type="text" value={opt}
                              onChange={(e) => handleOptionTextChange(idx, optIdx, e.target.value)}
                              style={{ flex: 1, padding: '8px', border: '1px solid #eee', borderRadius: '4px' }} />
                            <button onClick={() => handleRemoveOption(idx, optIdx)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}><Trash2 size={16} /></button>
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
                          <label style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}><Settings size={14} /> 질문 설명</label>
                          <input type="text" value={q.description || ''} onChange={(e) => handleChange(idx, 'description', e.target.value)}
                            placeholder="부가 설명" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}><ImageIcon size={14} /> 이미지 URL</label>
                          <input type="text" value={q.imageUrl || ''} onChange={(e) => handleChange(idx, 'imageUrl', e.target.value)}
                            placeholder="https://example.com/image.png" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                        </div>
                        {['rating5', 'rating11', 'linear_scale'].includes(q.type) && (
                          <div>
                            <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>척도 라벨</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '3px' }}>왼쪽 (최솟값)</div>
                                <input type="text" value={q.label_min || ''}
                                  onChange={(e) => handleChange(idx, 'label_min', e.target.value)}
                                  placeholder="예: 매우 불만족"
                                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px' }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '3px' }}>오른쪽 (최댓값)</div>
                                <input type="text" value={q.label_max || ''}
                                  onChange={(e) => handleChange(idx, 'label_max', e.target.value)}
                                  placeholder="예: 매우 만족"
                                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px' }} />
                              </div>
                            </div>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" id={`req_${q.id}`} checked={q.required} onChange={(e) => handleChange(idx, 'required', e.target.checked)} />
                            <label htmlFor={`req_${q.id}`} style={{ fontSize: '14px', cursor: 'pointer' }}>필수 응답</label>
                          </div>
                          {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input type="checkbox" id={`shuf_${q.id}`} checked={q.shuffleOptions} onChange={(e) => handleChange(idx, 'shuffleOptions', e.target.checked)} />
                              <label htmlFor={`shuf_${q.id}`} style={{ fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Shuffle size={14} /> 선택지 순서 무작위</label>
                            </div>
                          )}
                        </div>
                        {hasLogic && (
                          <div style={{ borderTop: '1px solid #ddd', paddingTop: '16px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}><GitBranch size={16} /> 조건부 분기</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {optionsList.map((opt, optIdx) => (
                                <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontSize: '13px', width: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt}</span>
                                  <span style={{ fontSize: '12px', color: '#888' }}>→</span>
                                  <select value={logicMap[opt] || ''} onChange={(e) => handleLogicChange(idx, opt, e.target.value)}
                                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}>
                                    <option value="">다음 스텝으로 계속</option>
                                    <option value="999">설문 제출(종료)</option>
                                    {availableSteps.map(s => s > q.step ? <option key={s} value={s}>스텝 {s}(으)로 이동</option> : null)}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '12px', color: '#666' }}>스텝 번호:</label>
                        <input type="number" min="2" value={q.step} onChange={(e) => handleChange(idx, 'step', Number(e.target.value))}
                          style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', textAlign: 'center' }} />
                      </div>
                      <button onClick={() => toggleSettings(q.id)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Settings size={16} /> 상세 설정 {isExpanded ? '닫기' : '열기'}
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
        </>
      )}

      {/* ── 응답 현황 탭 ── */}
      {activeTab === 'responses' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '15px', color: '#666' }}>총 <strong style={{ color: 'var(--text-color)' }}>{responses.length}건</strong>의 응답</span>
              <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                <button onClick={() => setResponseView('chart')}
                  style={{ padding: '6px 14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: responseView === 'chart' ? 'var(--primary-color)' : '#fff', color: responseView === 'chart' ? '#fff' : '#666' }}>
                  <BarChart2 size={14} /> 그래프
                </button>
                <button onClick={() => setResponseView('table')}
                  style={{ padding: '6px 14px', border: 'none', borderLeft: '1px solid #ddd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: responseView === 'table' ? 'var(--primary-color)' : '#fff', color: responseView === 'table' ? '#fff' : '#666' }}>
                  <Table2 size={14} /> 표
                </button>
                <button onClick={() => setResponseView('individual')}
                  style={{ padding: '6px 14px', border: 'none', borderLeft: '1px solid #ddd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: responseView === 'individual' ? 'var(--primary-color)' : '#fff', color: responseView === 'individual' ? '#fff' : '#666' }}>
                  <Users size={14} /> 개인별
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={fetchResponses} disabled={isLoadingResponses}
                style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc', background: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} /> 새로고침
              </button>
              <button onClick={handleExportExcel}
                style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: '#217346', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={16} /> 엑셀로 내보내기
              </button>
              <button onClick={handleClearResponses}
                style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={16} /> 응답 초기화
              </button>
            </div>
          </div>

          {isLoadingResponses ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>불러오는 중...</div>
          ) : responses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>아직 제출된 응답이 없습니다.</div>
          ) : responseView === 'chart' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[...questions].sort((a, b) => a.step - b.step).map(q => (
                <div key={q.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ marginBottom: '4px', fontSize: '11px', color: '#aaa' }}>{q.category || ''}</div>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>{q.title}</h3>
                  <QuestionChart question={q} responses={responses} />
                </div>
              ))}
            </div>
          ) : responseView === 'table' ? (
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #eee' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f5f7fa' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #eee', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#555' }}>번호</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #eee', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#555' }}>제출시간</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #eee', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#2c7be5' }}>성함</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #eee', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#2c7be5' }}>소속</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #eee', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#2c7be5' }}>직함</th>
                    {[...questions].sort((a, b) => a.step - b.step).map(q => (
                      <th key={q.id} style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #eee', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#555', maxWidth: '200px' }}>
                        {q.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r, idx) => (
                    <tr key={r.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', color: '#999' }}>{responses.length - idx}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap', color: '#666' }}>
                        {new Date(r.created_at).toLocaleString('ko-KR')}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap', fontWeight: '600', color: '#2c7be5' }}>
                        {(r.answers || {})._respondent_name || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap', color: '#444' }}>
                        {(r.answers || {})._respondent_org || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap', color: '#444' }}>
                        {(r.answers || {})._respondent_title || '-'}
                      </td>
                      {[...questions].sort((a, b) => a.step - b.step).map(q => (
                        <td key={q.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatAnswer((r.answers || {})[q.id])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {responses.map((r, idx) => {
                const ans = r.answers || {};
                const name = ans._respondent_name || '(이름 없음)';
                const org = ans._respondent_org || '';
                const title = ans._respondent_title || '';
                const isExpanded = expandedRespondent === r.id;
                const sortedQs = [...questions].sort((a, b) => a.step - b.step);
                return (
                  <div key={r.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <button
                      onClick={() => setExpandedRespondent(isExpanded ? null : r.id)}
                      style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                          {name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '15px', color: '#222' }}>{name}</div>
                          <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
                            {[org, title].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#aaa' }}>{new Date(r.created_at).toLocaleString('ko-KR')}</span>
                        <span style={{ fontSize: '18px', color: '#bbb', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #f0f0f0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {sortedQs.map(q => {
                          const val = ans[q.id];
                          if (val === undefined || val === null || val === '') return null;
                          return (
                            <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ fontSize: '12px', color: '#aaa' }}>{q.category || ''}</div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#555' }}>{q.title}</div>
                              <div style={{ fontSize: '14px', color: '#222', padding: '10px 14px', background: '#f8f9fa', borderRadius: '8px', lineHeight: '1.5' }}>
                                {formatAnswer(val)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
