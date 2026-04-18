import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CONSTITUTIONS, CONDITIONS } from '../utils/foodAnalysis';

const CONSTITUTION_ICONS = {
  '平和质': '😊', '气虚质': '😌', '阳虚质': '🥶', '阴虚质': '🔥',
  '痰湿质': '💧', '湿热质': '♨️', '血瘀质': '🩸', '气郁质': '😔', '特禀质': '🌸'
};

const CONSTITUTION_COLORS = {
  '平和质': 'from-green-400 to-emerald-500',
  '气虚质': 'from-yellow-400 to-amber-500',
  '阳虚质': 'from-blue-400 to-cyan-500',
  '阴虚质': 'from-red-400 to-rose-500',
  '痰湿质': 'from-teal-400 to-cyan-500',
  '湿热质': 'from-orange-400 to-red-500',
  '血瘀质': 'from-purple-400 to-violet-500',
  '气郁质': 'from-indigo-400 to-blue-500',
  '特禀质': 'from-pink-400 to-rose-500'
};

const CONSTITUTION_QUESTIONS = [
  {
    id: 'q1',
    question: '你平时怕冷吗？',
    options: [
      { text: '很怕冷，手脚经常冰凉', score: { '阳虚质': 2 } },
      { text: '有点怕冷', score: {} },
      { text: '不怕冷，正常', score: {} },
      { text: '怕热，容易出汗', score: { '阴虚质': 2 } },
    ],
  },
  {
    id: 'q2',
    question: '你的体型属于？',
    options: [
      { text: '偏瘦，肌肉较少', score: { '气虚质': 2 } },
      { text: '正常，匀称', score: {} },
      { text: '偏胖，腹部肥满', score: { '痰湿质': 2 } },
      { text: '结实，肌肉发达', score: {} },
    ],
  },
  {
    id: 'q3',
    question: '你的皮肤类型？',
    options: [
      { text: '容易干燥，容易瘙痒', score: { '阴虚质': 2, '血瘀质': 1 } },
      { text: '油腻，容易长痘', score: { '湿热质': 2 } },
      { text: '正常', score: {} },
      { text: '容易出油但不长痘', score: {} },
    ],
  },
  {
    id: 'q4',
    question: '你的情绪状态？',
    options: [
      { text: '容易焦虑、紧张', score: { '气郁质': 2 } },
      { text: '容易抑郁、多愁善感', score: { '气郁质': 2 } },
      { text: '开朗乐观', score: {} },
      { text: '容易急躁易怒', score: { '湿热质': 1, '阴虚质': 1 } },
    ],
  },
  {
    id: 'q5',
    question: '你的睡眠质量？',
    options: [
      { text: '失眠，难以入睡', score: { '阴虚质': 2, '气郁质': 1 } },
      { text: '容易失眠，多梦', score: { '血瘀质': 1 } },
      { text: '睡眠正常', score: {} },
      { text: '嗜睡，总感觉睡不够', score: { '气虚质': 2, '痰湿质': 1 } },
    ],
  },
  {
    id: 'q6',
    question: '你的消化系统？',
    options: [
      { text: '容易腹胀、大便稀溏', score: { '气虚质': 1, '阳虚质': 1 } },
      { text: '容易便秘', score: { '阴虚质': 1 } },
      { text: '消化正常', score: {} },
      { text: '容易饥饿，饭量大', score: { '阴虚质': 1 } },
    ],
  },
  {
    id: 'q7',
    question: '你容易感冒吗？',
    options: [
      { text: '经常感冒，不易痊愈', score: { '气虚质': 2 } },
      { text: '偶尔感冒，很快就好', score: {} },
      { text: '很少感冒', score: { '平和质': 1 } },
      { text: '一感冒就是高烧', score: { '湿热质': 1 } },
    ],
  },
  {
    id: 'q8',
    question: '你的舌头颜色？',
    options: [
      { text: '舌红少津', score: { '阴虚质': 2 } },
      { text: '舌淡有齿痕', score: { '气虚质': 1, '阳虚质': 1 } },
      { text: '舌红苔黄', score: { '湿热质': 2 } },
      { text: '舌紫暗有瘀斑', score: { '血瘀质': 2 } },
      { text: '舌淡红苔薄白', score: { '平和质': 1 } },
    ],
  },
];

function calculateConstitution(answers) {
  const scores = {};
  
  for (const [questionId, optionIndex] of Object.entries(answers)) {
    const question = CONSTITUTION_QUESTIONS.find(q => q.id === questionId);
    if (question && question.options[optionIndex]) {
      const optionScore = question.options[optionIndex].score;
      for (const [constitution, score] of Object.entries(optionScore)) {
        scores[constitution] = (scores[constitution] || 0) + score;
      }
    }
  }
  
  if (Object.keys(scores).length === 0) {
    return '平和质';
  }
  
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

export default function ProfilePage({ userProfile }) {
  const [manualStep, setManualStep] = useState(null);
  const [answers, setAnswers] = useState({});
  const [selectedConditions, setSelectedConditions] = useState(userProfile.conditions || []);
  const [result, setResult] = useState(userProfile.constitution || null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const step = manualStep ?? (userProfile.hasCompletedTest ? 'view' : 'step1');
  const viewResult = userProfile.constitution || result;
  const viewConditions = userProfile.conditions || [];

  const handleAnswer = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleNextStep1 = () => {
    if (Object.keys(answers).length >= 6) {
      const constitution = calculateConstitution(answers);
      setResult(constitution);
      setManualStep('step2');
    }
  };

  const handleComplete = () => {
    userProfile.updateProfile({
      constitution: result,
      conditions: selectedConditions,
    });
    setManualStep(null);
  };

  const toggleCondition = (condition) => {
    setSelectedConditions(prev => 
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const resetTest = () => {
    setManualStep('step1');
    setAnswers({});
    setSelectedConditions(userProfile.conditions || []);
    setResult(null);
    setCurrentQuestion(0);
  };

  if (userProfile.isLoading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">正在同步档案...</p>
      </div>
    );
  }

  if (step === 'view') {
    const tipList = getDietTips(viewResult, viewConditions).split('；').filter(Boolean);

    return (
      <div className="min-h-screen bg-orange-50">
        <header className="glass border-b border-orange-100">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link to="/" className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-600 hover:bg-orange-50 transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="title-main">我的体质档案</h1>
              <p className="text-xs text-gray-500">按体质生成个性化饮食建议</p>
            </div>
            <button
              onClick={resetTest}
              className="px-3 py-2 bg-white border border-orange-200 text-orange-600 rounded-xl text-xs font-semibold hover:bg-orange-50 transition-colors"
            >
              重新评估
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">
          <section className={`rounded-3xl p-6 shadow-lg text-white bg-gradient-to-br ${CONSTITUTION_COLORS[viewResult] || 'from-orange-400 to-amber-500'}`}>
            <p className="text-xs opacity-85 mb-3">你的主要体质</p>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-white/90 text-4xl flex items-center justify-center shadow-lg">
                {CONSTITUTION_ICONS[viewResult]}
              </div>
              <div>
              <h2 className="text-3xl font-bold mb-1">{viewResult}</h2>
                <p className="text-sm opacity-95 leading-relaxed">{getConstitutionDescription(viewResult)}</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <article className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
              <p className="text-xs text-gray-500 mb-1">身体状况</p>
              <p className="text-2xl font-bold text-gray-800">{viewConditions.length}</p>
              <p className="text-xs text-gray-500 mt-1">已记录项目</p>
            </article>

            <article className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
              <p className="text-xs text-gray-500 mb-1">饮食方向</p>
              <p className="text-base font-semibold text-gray-800">{getConstitutionDirection(viewResult)}</p>
              <p className="text-xs text-gray-500 mt-1">建议作为本周重点</p>
            </article>
          </section>

          <section className="bg-white rounded-3xl p-5 shadow-sm border border-orange-100">
            <h3 className="title-section mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              你的饮食建议
            </h3>
            <div className="space-y-2">
              {tipList.map((tip, index) => (
                <div key={`${tip}-${index}`} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"></span>
                  <p className="leading-relaxed">{tip.replace(/。$/, '')}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-3xl p-5 shadow-sm border border-orange-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="title-section">已记录身体状况</h3>
              <span className="text-xs text-gray-500">{viewConditions.length} 项</span>
            </div>
            {viewConditions.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {viewConditions.map(condition => (
                  <span
                    key={condition}
                    className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-sm font-medium"
                  >
                    {condition}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">暂无额外身体状况，可随时重新评估补充。</p>
            )}
          </section>

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/"
              className="py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold text-center hover:bg-gray-50 transition-colors"
            >
              返回首页
            </Link>
            <button
              onClick={resetTest}
              className="py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all"
            >
              重新测试
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'step1') {
    const progress = ((currentQuestion + 1) / CONSTITUTION_QUESTIONS.length) * 100;
    
    return (
      <div className="min-h-screen bg-orange-50">
        <header className="glass border-b border-orange-100">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link to="/" className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-600 hover:bg-orange-50 transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="title-main">体质测试</h1>
            </div>
            <span className="text-sm text-gray-500">{currentQuestion + 1}/{CONSTITUTION_QUESTIONS.length}</span>
          </div>
          <div className="h-1 bg-gray-200">
            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
          <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 shadow-sm">
            <h2 className="title-section mb-6">
              <span className="text-orange-500 mr-2">{currentQuestion + 1}.</span>
              {CONSTITUTION_QUESTIONS[currentQuestion].question}
            </h2>
            
            <div className="space-y-3">
              {CONSTITUTION_QUESTIONS[currentQuestion].options.map((opt, optIndex) => (
                <label
                  key={optIndex}
                  className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    answers[CONSTITUTION_QUESTIONS[currentQuestion].id] === optIndex
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-100 hover:border-orange-200 hover:bg-orange-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={CONSTITUTION_QUESTIONS[currentQuestion].id}
                    checked={answers[CONSTITUTION_QUESTIONS[currentQuestion].id] === optIndex}
                    onChange={() => handleAnswer(CONSTITUTION_QUESTIONS[currentQuestion].id, optIndex)}
                    className="mr-4 w-5 h-5 accent-orange-500"
                  />
                  <span className="text-gray-700">{opt.text}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {currentQuestion > 0 && (
              <button
                onClick={() => setCurrentQuestion(prev => prev - 1)}
                className="flex-1 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-colors"
              >
                上一题
              </button>
            )}
            <button
              onClick={() => {
                if (currentQuestion < CONSTITUTION_QUESTIONS.length - 1) {
                  setCurrentQuestion(prev => prev + 1);
                } else {
                  handleNextStep1();
                }
              }}
              disabled={answers[CONSTITUTION_QUESTIONS[currentQuestion].id] === undefined}
              className={`flex-1 py-4 rounded-2xl font-semibold transition-colors ${
                answers[CONSTITUTION_QUESTIONS[currentQuestion].id] !== undefined
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentQuestion < CONSTITUTION_QUESTIONS.length - 1 ? '下一题' : '查看结果'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'step2') {
    return (
      <div className="min-h-screen bg-orange-50">
        <header className="glass border-b border-orange-100">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <button onClick={() => setManualStep('step1')} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-600 hover:bg-orange-50 transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="title-main">身体状况</h1>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
          {/* 体质结果 */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white text-center shadow-lg">
            <p className="text-sm opacity-90 mb-2">你的体质是</p>
            <div className="text-5xl mb-2">{CONSTITUTION_ICONS[result]}</div>
            <p className="text-2xl font-bold">{result}</p>
          </div>

          {/* 身体状况选择 */}
          {Object.entries(CONDITIONS).map(([category, conditions]) => (
            <section key={category} className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="title-section mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {conditions.map(condition => (
                  <button
                    key={condition}
                    onClick={() => toggleCondition(condition)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedConditions.includes(condition)
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-orange-100'
                    }`}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </section>
          ))}

          <button
            onClick={handleComplete}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-semibold shadow-lg shadow-orange-200 hover:shadow-xl transition-all"
          >
            完成设置
          </button>
        </main>
      </div>
    );
  }
}

function getConstitutionDescription(constitution) {
  const descriptions = {
    '平和质': '恭喜你！你是最健康的体质类型。注意保持良好的生活习惯。',
    '气虚质': '元气不足，容易疲劳乏力。建议适当运动，注意休息。',
    '阳虚质': '阳气不足，怕冷畏寒。建议多吃温补食物，少吃寒凉。',
    '阴虚质': '阴液不足，容易上火。建议少吃辛辣，多吃滋阴食物。',
    '痰湿质': '痰湿内蕴，容易肥胖。建议清淡饮食，适量运动。',
    '湿热质': '湿热内蕴，容易长痘。建议少吃辛辣，保持清爽。',
    '血瘀质': '血行不畅，容易疼痛。建议活血化瘀，适量运动。',
    '气郁质': '气机郁结，情绪波动。建议放松心情，多交流。',
    '特禀质': '先天特殊，容易过敏。建议避免过敏原，增强体质。',
  };
  return descriptions[constitution] || '';
}

function getDietTips(constitution, conditions) {
  const tips = [];
  
  if (constitution === '阳虚质') {
    tips.push('宜食温性食物：如姜、葱、羊肉、红枣等');
    tips.push('忌食寒凉食物：如西瓜、香蕉、苦瓜等');
  } else if (constitution === '阴虚质') {
    tips.push('宜食滋阴食物：如梨、百合、银耳、蜂蜜等');
    tips.push('忌食辛辣燥热：如辣椒、生姜、大蒜等');
  } else if (constitution === '痰湿质') {
    tips.push('宜食清淡食物：如冬瓜、薏米、芹菜等');
    tips.push('忌食油腻甜食：如蛋糕、肥肉、糖果等');
  } else if (constitution === '湿热质') {
    tips.push('宜食清热利湿：如绿豆、薏米、苦瓜等');
    tips.push('忌食辛辣油腻：如火锅、烧烤、油炸食品等');
  } else if (constitution === '平和质') {
    tips.push('饮食均衡即可，不要偏食');
    tips.push('注意定时定量，规律作息');
  }
  
  if (conditions.includes('胃寒')) {
    tips.push('胃寒者宜温热饮食，忌生冷');
  }
  if (conditions.includes('便秘')) {
    tips.push('便秘者宜多食膳食纤维，多喝水');
  }
  if (conditions.includes('湿气重')) {
    tips.push('湿气重者宜食薏米、赤小豆、冬瓜等');
  }
  
  return tips.length > 0 ? tips.join('；') + '。' : '根据你的体质和身体状况，合理安排饮食即可。';
}

function getConstitutionDirection(constitution) {
  const directions = {
    '平和质': '均衡饮食',
    '气虚质': '健脾益气',
    '阳虚质': '温补驱寒',
    '阴虚质': '滋阴润燥',
    '痰湿质': '清淡祛湿',
    '湿热质': '清热利湿',
    '血瘀质': '活血化瘀',
    '气郁质': '疏肝理气',
    '特禀质': '远离过敏',
  };
  return directions[constitution] || '规律饮食';
}
