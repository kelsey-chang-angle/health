import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFoodById, analyzeFoodForUser } from '../utils/foodAnalysis';

const foodEmojis = {
  '苹果': '🍎', '香蕉': '🍌', '梨': '🍐', '橙子': '🍊', '橘子': '🍊',
  '葡萄': '🍇', '西瓜': '🍉', '桃子': '🍑', '李子': '🫐', '樱桃': '🍒',
  '草莓': '🍓', '蓝莓': '🫐', '猕猴桃': '🥝', '菠萝': '🍍', '芒果': '🥭',
  '木瓜': '🍈', '石榴': '🍎', '柿子': '🍅', '桂圆': '🍈', '红枣': '🫘',
  '白菜': '🥬', '菠菜': '🥬', '西红柿': '🍅', '黄瓜': '🥒', '胡萝卜': '🥕',
  '土豆': '🥔', '茄子': '🍆', '南瓜': '🎃', '洋葱': '🧅', '大蒜': '🧄',
  '生姜': '🫚', '芹菜': '🥬', '生菜': '🥬', '西兰花': '🥦', '豆腐': '🧈',
  '香菇': '🍄', '猪肉': '🥩', '牛肉': '🥩', '鸡肉': '🍗', '鸭肉': '🍗',
  '鱼肉': '🐟', '虾': '🦐', '螃蟹': '🦀', '鸡蛋': '🥚', '米饭': '🍚',
  '面条': '🍜', '馒头': '🥟', '玉米': '🌽', '红薯': '🍠', '小米': '🌾',
  '燕麦': '🌾', '牛奶': '🥛', '豆浆': '🥛', '绿茶': '🍵', '咖啡': '☕',
  '蜂蜜': '🍯', '核桃': '🥜', '花生': '🥜',
};

const getFoodEmoji = (name) => foodEmojis[name] || '🍽️';

const getNatureClass = (nature) => {
  const map = {
    '寒': 'nature-cold',
    '凉': 'nature-cool',
    '平': 'nature-neutral',
    '温': 'nature-warm',
    '热': 'nature-hot',
  };
  return map[nature] || 'nature-neutral';
};

export default function FoodDetailPage({ userProfile }) {
  const { id } = useParams();
  const food = getFoodById(id);

  useEffect(() => {
    if (food) {
      const stored = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
      const updated = [id, ...stored.filter(i => i !== id)].slice(0, 10);
      localStorage.setItem('recently_viewed', JSON.stringify(updated));
    }
  }, [id, food]);

  if (!food) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🔍</span>
          <p className="text-gray-500 mb-4">未找到该食物</p>
          <Link to="/" className="btn btn-primary">返回首页</Link>
        </div>
      </div>
    );
  }

  const analysis = analyzeFoodForUser(food, userProfile);

  const getStatusDisplay = () => {
    switch (analysis.status) {
      case 'recommended':
        return {
          icon: '✓',
          bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
          lightBg: 'bg-emerald-50',
          text: '推荐食用',
          desc: '很适合你，放心吃',
          color: 'text-emerald-700',
        };
      case 'avoid':
        return {
          icon: '!',
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          lightBg: 'bg-amber-50',
          text: '建议少吃',
          desc: '不太适合你，注意控制',
          color: 'text-amber-700',
        };
      default:
        return {
          icon: '•',
          bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          lightBg: 'bg-blue-50',
          text: '一般',
          desc: '适量食用即可',
          color: 'text-blue-700',
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 pb-20">
      {/* 头部 */}
      <header className="sticky top-0 z-50 glass border-b border-orange-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-600 hover:bg-orange-50 transition-colors shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-800">食物详情</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 主卡片 */}
        <section className="bg-white rounded-3xl p-6 shadow-lg">
          <div className="flex items-start gap-5">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-5xl shadow-inner">
              {getFoodEmoji(food.name)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{food.name}</h2>
              {food.aliases?.length > 0 && (
                <p className="text-sm text-gray-500 mb-2">{food.aliases.join('、')}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getNatureClass(food.tcm_nature)}`}>
                  性{food.tcm_nature}
                </span>
                <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">
                  {food.category}
                </span>
              </div>
            </div>
          </div>

          {/* 营养数据 */}
          <div className="grid grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center p-3 bg-orange-50 rounded-2xl">
              <p className="text-xl font-bold text-orange-600">{food.calories}</p>
              <p className="text-xs text-gray-500">千卡</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-2xl">
              <p className="text-xl font-bold text-blue-600">{food.carbs}<span className="text-sm">g</span></p>
              <p className="text-xs text-gray-500">碳水</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-2xl">
              <p className="text-xl font-bold text-green-600">{food.protein}<span className="text-sm">g</span></p>
              <p className="text-xs text-gray-500">蛋白质</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-2xl">
              <p className="text-xl font-bold text-yellow-600">{food.fat}<span className="text-sm">g</span></p>
              <p className="text-xs text-gray-500">脂肪</p>
            </div>
          </div>
        </section>

        {/* 个性化建议 */}
        <section className={`rounded-3xl p-6 ${status.lightBg}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 rounded-2xl ${status.bg} flex items-center justify-center text-white text-2xl shadow-lg`}>
              {status.icon}
            </div>
            <div>
              <h3 className={`text-xl font-bold ${status.color}`}>{status.text}</h3>
              <p className="text-sm text-gray-600">{status.desc}</p>
            </div>
          </div>

          {analysis.reasons.length > 0 && (
            <div className="space-y-2 mb-4">
              {analysis.reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/70 rounded-xl p-3">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <p className="text-sm text-gray-700">{reason}</p>
                </div>
              ))}
            </div>
          )}

          {analysis.tips.length > 0 && (
            <div className="bg-white/70 rounded-2xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>💡</span> 建议
              </p>
              <ul className="space-y-1">
                {analysis.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-orange-400">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* 中医功效 */}
        {food.tcm_effects?.length > 0 && (
          <section className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-green-600">🌿</span>
              中医功效
            </h3>
            <div className="flex flex-wrap gap-2">
              {food.tcm_effects.map((effect, i) => (
                <span key={i} className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-medium">
                  {effect}
                </span>
              ))}
            </div>
            {food.tcm_meridian?.length > 0 && (
              <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                归经：{food.tcm_meridian.join('、')}
              </p>
            )}
          </section>
        )}

        {/* 搭配建议 */}
        {(food.pairing_good?.length > 0 || food.pairing_bad?.length > 0) && (
          <section className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">🍽️</span>
              搭配建议
            </h3>

            {food.pairing_good?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-emerald-600 mb-2">✓ 推荐搭配</p>
                <div className="space-y-2">
                  {food.pairing_good.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-emerald-50 rounded-xl p-3">
                      <span className="text-lg">{getFoodEmoji(item.food)}</span>
                      <div>
                        <span className="font-medium text-gray-800">{item.food}</span>
                        <p className="text-xs text-gray-500">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {food.pairing_bad?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-amber-600 mb-2">⚠ 不宜搭配</p>
                <div className="space-y-2">
                  {food.pairing_bad.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-amber-50 rounded-xl p-3">
                      <span className="text-lg">{getFoodEmoji(item.food)}</span>
                      <div>
                        <span className="font-medium text-gray-800">{item.food}</span>
                        <p className="text-xs text-gray-500">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 烹饪建议 */}
        {food.cooking_tips?.length > 0 && (
          <section className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">👨‍🍳</span>
              烹饪建议
            </h3>
            <div className="space-y-3">
              {food.cooking_tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 储存方法 */}
        {food.storage && (
          <section className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">📦</span>
              储存方法
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed bg-blue-50 rounded-xl p-4">
              {food.storage}
            </p>
          </section>
        )}

        {/* 注意事项 */}
        {food.notes && (
          <section className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-100">
            <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
              <span>⚠️</span> 注意事项
            </h3>
            <p className="text-sm text-amber-700 leading-relaxed">{food.notes}</p>
          </section>
        )}
      </main>
    </div>
  );
}
