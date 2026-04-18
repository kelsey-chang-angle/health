import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { searchFoods, getFoodsByCategory, getCategories, analyzeFoodForUser, getFoods } from '../utils/foodAnalysis';

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

export default function HomePage({ userProfile }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [recentlyViewed] = useState(() => {
    const stored = localStorage.getItem('recently_viewed');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  });

  const categories = useMemo(
    () => getCategories().filter(category => category !== '全部'),
    []
  );
  const allFoods = useMemo(() => getFoods(), []);
  const searchResults = useMemo(
    () => (searchQuery ? searchFoods(searchQuery) : []),
    [searchQuery]
  );

  const analyzedFoods = useMemo(() => {
    if (!userProfile.hasCompletedTest) return [];
    return allFoods.map(food => ({
      food,
      analysis: analyzeFoodForUser(food, userProfile),
    }));
  }, [allFoods, userProfile]);

  const dailyRecommendedFoods = useMemo(
    () => analyzedFoods.filter(item => item.analysis.status === 'recommended'),
    [analyzedFoods]
  );
  const dailyAvoidFoods = useMemo(
    () => analyzedFoods.filter(item => item.analysis.status === 'avoid'),
    [analyzedFoods]
  );

  const getRecommendationBadge = (food) => {
    if (!userProfile.hasCompletedTest) return null;
    const analysis = analyzeFoodForUser(food, userProfile);
    if (analysis.status === 'recommended') {
      return <span className="badge-recommended">✓</span>;
    }
    if (analysis.status === 'avoid') {
      return <span className="badge-avoid">!</span>;
    }
    return null;
  };

  const getDailyFood = (foods, key) => {
    if (foods.length === 0) return null;
    const dayString = new Date().toISOString().slice(0, 10);
    const seed = `${dayString}-${key}`;
    const hash = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
    return foods[hash % foods.length];
  };

  const dailyRecommended = getDailyFood(dailyRecommendedFoods, 'recommended');
  const dailyAvoid = getDailyFood(dailyAvoidFoods, 'avoid');

  const getCategorySummary = (category) => {
    const foods = getFoodsByCategory(category);
    const recommendedCount = userProfile.hasCompletedTest
      ? foods.filter(food => analyzeFoodForUser(food, userProfile).status === 'recommended').length
      : 0;
    return {
      total: foods.length,
      recommendedCount,
      previewFoods: foods.slice(0, 3),
      foods,
    };
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-amber-500 flex items-center justify-center text-white text-xl shadow-lg">
                🥗
              </div>
              <div>
                <h1 className="title-main">饮食参考</h1>
                <p className="text-xs text-gray-400">按体质查看每日饮食建议</p>
              </div>
            </div>
            <Link to="/profile" className="btn btn-secondary text-sm py-2 px-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {userProfile.hasCompletedTest ? '档案' : '设置'}
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索食物，如：苹果、香蕉..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input home-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="content-wrapper">
        {!searchQuery && (
          <section className="mb-6">
            <h2 className="title-section mb-3">今日饮食提醒</h2>
            <div className="daily-grid">
              <div className="daily-card daily-card-recommended">
                <p className="daily-card-title">每日推荐</p>
                {dailyRecommended ? (
                  <Link to={`/food/${dailyRecommended.food.id}`} className="daily-food-link">
                    <span className="text-2xl">{getFoodEmoji(dailyRecommended.food.name)}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{dailyRecommended.food.name}</p>
                      <p className="text-xs text-gray-500">适合你的体质与状态</p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-sm text-gray-500">完成档案后生成个性化推荐。</p>
                )}
              </div>

              <div className="daily-card daily-card-avoid">
                <p className="daily-card-title">每日避雷</p>
                {dailyAvoid ? (
                  <Link to={`/food/${dailyAvoid.food.id}`} className="daily-food-link">
                    <span className="text-2xl">{getFoodEmoji(dailyAvoid.food.name)}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{dailyAvoid.food.name}</p>
                      <p className="text-xs text-gray-500">今天建议减少摄入</p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-sm text-gray-500">当前没有明显避雷食物。</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        {!searchQuery && recentlyViewed.length > 0 && (
          <section className="mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h2 className="title-section flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                最近查看
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {recentlyViewed.slice(0, 8).map(id => {
                const food = getFoods().find(f => f.id === id);
                if (!food) return null;
                return (
                  <Link
                    key={id}
                    to={`/food/${food.id}`}
                    className="flex-shrink-0 flex flex-col items-center gap-1 p-3 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all card-hover"
                  >
                    <span className="text-2xl">{getFoodEmoji(food.name)}</span>
                    <span className="text-xs text-gray-600 whitespace-nowrap">{food.name}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Categories */}
        {!searchQuery && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="title-section">分类</h2>
              <span className="text-xs text-gray-500">点击展开查看食物</span>
            </div>

            <div className="space-y-3">
              {categories.map(category => {
                const summary = getCategorySummary(category);
                const isExpanded = expandedCategory === category;

                return (
                  <article key={category} className={`category-panel ${isExpanded ? 'category-panel-expanded' : ''}`}>
                    <button
                      type="button"
                      onClick={() => setExpandedCategory(prev => (prev === category ? null : category))}
                      className="category-panel-header"
                    >
                      <div>
                        <h3 className="title-sub">{category}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          共 {summary.total} 种
                          {userProfile.hasCompletedTest && ` · 推荐 ${summary.recommendedCount} 种`}
                        </p>
                      </div>
                      <span className="text-xs text-primary-600 font-medium">
                        {isExpanded ? '收起' : '展开'}
                      </span>
                    </button>

                    <div className="category-preview">
                      {summary.previewFoods.map(food => (
                        <span key={food.id} className="category-preview-item">
                          {getFoodEmoji(food.name)} {food.name}
                        </span>
                      ))}
                    </div>

                    {isExpanded && (
                      <div className="food-grid mt-4">
                        {summary.foods.map((food, index) => (
                          <Link
                            key={food.id}
                            to={`/food/${food.id}`}
                            className="food-card animate-slide-up"
                            style={{ animationDelay: `${index * 0.04}s` }}
                          >
                            {getRecommendationBadge(food)}

                            <div className="food-icon group-hover:scale-110 transition-transform">
                              <span className="text-3xl">{getFoodEmoji(food.name)}</span>
                            </div>

                            <h3 className="font-semibold text-gray-800 mb-1">{food.name}</h3>

                            <div className="flex items-center gap-2 text-xs">
                              <span className={`nature-tag ${getNatureClass(food.tcm_nature)}`}>
                                {food.tcm_nature}
                              </span>
                              <span className="text-gray-400">{food.calories}kcal</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Search Results */}
        {searchQuery && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="title-section">搜索结果</h2>
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {searchResults.length}
              </span>
            </div>

            <div className="food-grid">
              {searchResults.map((food, index) => (
                <Link
                  key={food.id}
                  to={`/food/${food.id}`}
                  className="food-card animate-slide-up"
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  {getRecommendationBadge(food)}

                  <div className="food-icon group-hover:scale-110 transition-transform">
                    <span className="text-3xl">{getFoodEmoji(food.name)}</span>
                  </div>

                  <h3 className="font-semibold text-gray-800 mb-1">{food.name}</h3>

                  <div className="flex items-center gap-2 text-xs">
                    <span className={`nature-tag ${getNatureClass(food.tcm_nature)}`}>
                      {food.tcm_nature}
                    </span>
                    <span className="text-gray-400">{food.calories}kcal</span>
                  </div>
                </Link>
              ))}
            </div>

            {searchResults.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-4xl">🔍</span>
              </div>
              <p className="text-gray-500 mb-2">未找到相关食物</p>
              <p className="text-sm text-gray-400">试试其他关键词</p>
            </div>
          )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="page-footer">
        <p className="text-center text-xs text-gray-400">
          💡 饮食数据仅供参考，不替代医嘱
        </p>
      </footer>
    </div>
  );
}
