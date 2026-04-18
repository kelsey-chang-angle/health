import foodsData from '../data/foods.json';

const CONSTITUTIONS = [
  '平和质', '气虚质', '阳虚质', '阴虚质',
  '痰湿质', '湿热质', '血瘀质', '气郁质', '特禀质'
];

const CONDITIONS = {
  '代谢类': ['高血糖', '高尿酸', '高血压', '高血脂'],
  '消化类': ['胃寒', '胃酸过多', '容易腹泻', '便秘'],
  '体感类': ['湿气重', '怕冷/手脚冰凉', '容易上火', '失眠'],
  '女性相关': ['经期中', '备孕/孕期', '宫寒'],
  '过敏': ['海鲜过敏', '花生过敏', '乳糖不耐受', '鸡蛋过敏'],
};

const NATURE_SCORES = {
  '寒': -2,
  '凉': -1,
  '平': 0,
  '温': 1,
  '热': 2,
};

export function getFoods() {
  return foodsData;
}

export function getFoodById(id) {
  return foodsData.find(f => f.id === id);
}

export function searchFoods(query) {
  if (!query) return foodsData;
  const q = query.toLowerCase();
  return foodsData.filter(f => 
    f.name.toLowerCase().includes(q) ||
    f.aliases?.some(a => a.toLowerCase().includes(q))
  );
}

export function getFoodsByCategory(category) {
  if (!category || category === '全部') return foodsData;
  return foodsData.filter(f => f.category === category);
}

export function getCategories() {
  const categories = [...new Set(foodsData.map(f => f.category))];
  return ['全部', ...categories];
}

export function analyzeFoodForUser(food, userProfile) {
  const { constitution, conditions = [] } = userProfile;
  
  if (!constitution && conditions.length === 0) {
    return {
      status: 'unknown',
      reasons: ['完成体质测试获取个性化建议'],
      tips: [],
    };
  }

  const reasons = [];
  let status = 'recommended';
  const tips = [];

  if (constitution) {
    if (food.constitution_bad?.includes(constitution)) {
      status = 'avoid';
      reasons.push(`你属于${constitution}，${food.name}性${food.tcm_nature}，不太适合`);
      
      if (food.tcm_nature === '寒' || food.tcm_nature === '凉') {
        tips.push('可尝试加热后食用');
        if (food.tcm_nature === '寒') {
          tips.push('可搭配温性食物（如姜、红枣）');
        }
      }
    } else if (food.constitution_good?.includes(constitution)) {
      reasons.push(`你属于${constitution}，${food.name}很适合你`);
    }
  }

  for (const condition of conditions) {
    if (food.conditions_bad?.includes(condition)) {
      status = 'avoid';
      reasons.push(`你勾选了"${condition}"，应少吃`);
    }
    if (food.conditions_good?.includes(condition)) {
      if (status !== 'avoid') {
        status = 'recommended';
      }
      reasons.push(`对"${condition}"有益`);
    }
  }

  if (status === 'avoid' && tips.length === 0) {
    const alternatives = foodsData
      .filter(f => f.id !== food.id && f.category === food.category)
      .slice(0, 3)
      .map(f => f.name);
    
    if (alternatives.length > 0) {
      tips.push(`替代选择：${alternatives.join('、')}`);
    }
  }

  if (food.daily_limit) {
    tips.push(food.daily_limit);
  }

  return {
    status: status === 'unknown' ? 'neutral' : status,
    reasons,
    tips,
  };
}

export { CONSTITUTIONS, CONDITIONS };
