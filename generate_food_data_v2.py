#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
食物数据生成脚本 V2 - 并发版本
特点：
1. 任务拆分：每个食物拆成4个独立任务
2. 并发执行：线程池并行处理
3. 增量保存：每批次自动保存
4. 断点续传：支持从中断处恢复
"""

import json
import csv
import time
import os
import threading
from datetime import datetime
from typing import List, Dict, Optional, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, asdict

# 豆包 API 配置
DOUBAO_API_KEY = "ark-aab45fa3-a872-4767-a404-4a2b95fd593c-c5cf6"
DOUBAO_MODEL = "doubao-seed-2-0-pro-260215"
DOUBAO_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"

# 并发配置
MAX_WORKERS = 5  # 并发线程数
BATCH_SIZE = 5   # 每批次保存数量
REQUEST_DELAY = 0.5  # 每个请求间隔（秒）


@dataclass
class FoodTask:
    """食物任务定义"""
    id: str
    name: str
    category: str
    priority: str


@dataclass
class FoodData:
    """完整的食物数据结构"""
    # 基础信息
    id: str
    name: str
    aliases: List[str]
    category: str
    
    # 中医属性
    tcm_nature: str  # 寒/凉/平/温/热
    tcm_taste: str
    tcm_meridian: List[str]
    tcm_effects: List[str]
    
    # 营养成分
    calories: float
    carbs: float
    protein: float
    fat: float
    fiber: float
    gi: Optional[float]
    gl: Optional[float]
    
    # 体质适配
    constitution_good: List[str]
    constitution_bad: List[str]
    
    # 症状关联
    conditions_good: List[str]
    conditions_bad: List[str]
    
    # 搭配
    pairing_good: List[Dict[str, str]]
    pairing_bad: List[Dict[str, str]]
    
    # 实用信息
    cooking_tips: List[str]
    storage: str
    daily_limit: str
    notes: str
    
    # 元数据
    _meta: Dict[str, Any]


# ==================== Prompt 定义 ====================

def get_prompt_task1(food_name: str, category: str) -> str:
    """任务1：基础信息 + 中医属性"""
    return f'''作为中医食疗专家，请提供【{food_name}】的基础信息和中医属性。

请严格按以下JSON格式返回，不要添加其他内容：
{{
  "name": "{food_name}",
  "aliases": ["别名1", "别名2"],
  "category": "{category}",
  "tcm_nature": "寒/凉/平/温/热",
  "tcm_taste": "如：甘、甘酸、辛温",
  "tcm_meridian": ["脾", "肺"],
  "tcm_effects": ["功效1", "功效2"],
  "constitution_good": ["平和质", "气虚质"],
  "constitution_bad": ["阳虚质", "痰湿质"]
}}

规则：
1. nature只能是：寒、凉、平、温、热
2. constitution从九种体质选：平和质、气虚质、阳虚质、阴虚质、痰湿质、湿热质、血瘀质、气郁质、特禀质
3. 不确定的字段用null'''


def get_prompt_task2(food_name: str) -> str:
    """任务2：营养成分"""
    return f'''作为营养师，请提供【{food_name}】的营养成分数据（每100g可食部）。

请严格按以下JSON格式返回：
{{
  "calories": 52,
  "carbs": 13.5,
  "protein": 0.3,
  "fat": 0.2,
  "fiber": 1.2,
  "gi": 36,
  "gl": 4,
  "potassium": 119,
  "sodium": 1.6,
  "vc": 4.6
}}

说明：
- 数值为每100g含量
- gi/glycemic index：低<55，中55-70，高>70
- 不确定的填null
- 参考《中国食物成分表》标准'''


def get_prompt_task3(food_name: str) -> str:
    """任务3：症状与搭配"""
    return f'''作为食疗专家，请提供【{food_name}】的症状适配和食物搭配建议。

请严格按以下JSON格式返回：
{{
  "conditions_good": ["便秘", "高血压"],
  "conditions_bad": ["腹泻", "胃寒"],
  "pairing_good": [
    {{"food": "燕麦", "reason": "促进肠道蠕动"}}
  ],
  "pairing_bad": [
    {{"food": "螃蟹", "reason": "容易腹泻"}}
  ],
  "daily_limit": "建议每日食用量，如：1-2个"
}}

规则：
1. conditions从常见症状选：便秘、腹泻、高血压、高血糖、胃寒、湿气重、失眠等
2. 搭配提供2-3个即可
3. 不确定的填null'''


def get_prompt_task4(food_name: str) -> str:
    """任务4：实用信息"""
    return f'''作为生活顾问，请提供【{food_name}】的实用信息。

请严格按以下JSON格式返回：
{{
  "cooking_tips": ["可生吃", "可榨汁", "可煮水"],
  "storage": "储存方法，如：常温保存，避免挤压",
  "notes": "其他注意事项，如：空腹不宜多吃"
}}

规则：
1. cooking_tips提供2-3条实用建议
2. 内容要具体、可操作
3. 不确定的填null'''


# ==================== API 调用 ====================

def call_api(prompt: str, task_name: str = "") -> Optional[Dict]:
    """调用豆包 API"""
    try:
        from openai import OpenAI
    except ImportError:
        print("错误：请先安装 openai 库: pip install openai")
        return None
    
    client = OpenAI(
        api_key=DOUBAO_API_KEY,
        base_url=DOUBAO_BASE_URL
    )
    
    try:
        response = client.chat.completions.create(
            model=DOUBAO_MODEL,
            messages=[
                {"role": "system", "content": "你是一位专业的营养师和中医食疗专家，请严格按照要求的JSON格式返回数据。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1500
        )
        
        content = response.choices[0].message.content
        
        # 提取 JSON
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            json_str = content.split("```")[1].split("```")[0].strip()
        else:
            json_str = content.strip()
        
        return json.loads(json_str)
        
    except Exception as e:
        print(f"  [{task_name}] API调用失败: {e}")
        return None


def process_single_food(task: FoodTask) -> Optional[FoodData]:
    """处理单个食物的所有任务"""
    food_name = task.name
    category = task.category
    
    print(f"开始处理: {food_name}")
    
    # 任务1：基础信息 + 中医属性
    result1 = call_api(get_prompt_task1(food_name, category), "任务1")
    if not result1:
        print(f"  ❌ {food_name} 任务1失败")
        return None
    time.sleep(REQUEST_DELAY)
    
    # 任务2：营养成分
    result2 = call_api(get_prompt_task2(food_name), "任务2")
    if not result2:
        print(f"  ❌ {food_name} 任务2失败")
        return None
    time.sleep(REQUEST_DELAY)
    
    # 任务3：症状与搭配
    result3 = call_api(get_prompt_task3(food_name), "任务3")
    if not result3:
        print(f"  ❌ {food_name} 任务3失败")
        return None
    time.sleep(REQUEST_DELAY)
    
    # 任务4：实用信息
    result4 = call_api(get_prompt_task4(food_name), "任务4")
    if not result4:
        print(f"  ❌ {food_name} 任务4失败")
        return None
    
    # 合并结果
    try:
        food_data = FoodData(
            id=task.id,
            name=result1.get("name", food_name),
            aliases=result1.get("aliases", []),
            category=result1.get("category", category),
            
            tcm_nature=result1.get("tcm_nature", ""),
            tcm_taste=result1.get("tcm_taste", ""),
            tcm_meridian=result1.get("tcm_meridian", []),
            tcm_effects=result1.get("tcm_effects", []),
            
            calories=result2.get("calories", 0),
            carbs=result2.get("carbs", 0),
            protein=result2.get("protein", 0),
            fat=result2.get("fat", 0),
            fiber=result2.get("fiber", 0),
            gi=result2.get("gi"),
            gl=result2.get("gl"),
            
            constitution_good=result1.get("constitution_good", []),
            constitution_bad=result1.get("constitution_bad", []),
            
            conditions_good=result3.get("conditions_good", []),
            conditions_bad=result3.get("conditions_bad", []),
            
            pairing_good=result3.get("pairing_good", []),
            pairing_bad=result3.get("pairing_bad", []),
            
            cooking_tips=result4.get("cooking_tips", []),
            storage=result4.get("storage", ""),
            daily_limit=result3.get("daily_limit", ""),
            notes=result4.get("notes", ""),
            
            _meta={
                "generated_at": datetime.now().isoformat(),
                "model": DOUBAO_MODEL,
                "source": "doubao-ai-v2"
            }
        )
        
        print(f"  ✅ {food_name} 完成")
        return food_data
        
    except Exception as e:
        print(f"  ❌ {food_name} 数据合并失败: {e}")
        return None


# ==================== 增量保存 ====================

class IncrementalSaver:
    """增量保存器"""
    
    def __init__(self, output_file: str, batch_size: int = 5):
        self.output_file = output_file
        self.batch_size = batch_size
        self.buffer = []
        self.saved_count = 0
        self.lock = threading.Lock()
        
        # 初始化文件
        if not os.path.exists(output_file):
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump([], f)
    
    def add(self, food_data: FoodData):
        """添加数据到缓冲区"""
        with self.lock:
            self.buffer.append(asdict(food_data))
            
            if len(self.buffer) >= self.batch_size:
                self._flush()
    
    def _flush(self):
        """将缓冲区数据写入文件"""
        if not self.buffer:
            return
        
        # 读取现有数据
        existing = []
        if os.path.exists(self.output_file):
            with open(self.output_file, 'r', encoding='utf-8') as f:
                try:
                    existing = json.load(f)
                except:
                    existing = []
        
        # 追加新数据
        existing.extend(self.buffer)
        
        # 写回文件
        with open(self.output_file, 'w', encoding='utf-8') as f:
            json.dump(existing, f, ensure_ascii=False, indent=2)
        
        self.saved_count += len(self.buffer)
        print(f"💾 已保存 {self.saved_count} 个食物")
        self.buffer = []
    
    def close(self):
        """关闭保存器，刷新剩余数据"""
        self._flush()


def load_progress(output_file: str) -> set:
    """加载已处理的食物ID"""
    if not os.path.exists(output_file):
        return set()
    
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {item.get('id') for item in data if item.get('id')}
    except:
        return set()


# ==================== 主流程 ====================

def process_food_list_concurrent(
    input_file: str = "food_list.csv",
    output_file: str = "food_database_v2.json",
    max_workers: int = MAX_WORKERS
):
    """并发处理食物清单"""
    
    # 读取食物清单
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        all_foods = [
            FoodTask(
                id=row['id'],
                name=row['name'],
                category=row['category'],
                priority=row['priority']
            )
            for row in reader
        ]
    
    # 只处理 high priority
    foods = [f for f in all_foods if f.priority == 'high']
    
    # 加载已处理的
    processed_ids = load_progress(output_file)
    pending_foods = [f for f in foods if f.id not in processed_ids]
    
    total = len(foods)
    pending = len(pending_foods)
    completed = len(processed_ids)
    
    print(f"=" * 60)
    print(f"食物数据生成任务")
    print(f"=" * 60)
    print(f"总计: {total} 个")
    print(f"已完成: {completed} 个")
    print(f"待处理: {pending} 个")
    print(f"并发数: {max_workers}")
    print(f"=" * 60)
    
    if not pending_foods:
        print("所有食物已处理完成！")
        return
    
    # 创建保存器
    saver = IncrementalSaver(output_file, batch_size=BATCH_SIZE)
    
    # 并发处理
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # 提交所有任务
        future_to_food = {
            executor.submit(process_single_food, food): food 
            for food in pending_foods
        }
        
        # 处理完成的任务
        for future in as_completed(future_to_food):
            food = future_to_food[future]
            try:
                result = future.result()
                if result:
                    saver.add(result)
            except Exception as e:
                print(f"  ❌ {food.name} 处理异常: {e}")
    
    # 关闭保存器
    saver.close()
    
    elapsed = time.time() - start_time
    print(f"\n{'=' * 60}")
    print(f"处理完成！")
    print(f"总计耗时: {elapsed:.1f} 秒")
    print(f"平均每个食物: {elapsed/pending:.1f} 秒")
    print(f"数据保存至: {output_file}")
    print(f"{'=' * 60}")


# ==================== 命令行入口 ====================

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # 测试模式
        test_food = sys.argv[2] if len(sys.argv) > 2 else "苹果"
        print(f"测试: {test_food}\n")
        
        task = FoodTask(
            id="test",
            name=test_food,
            category="测试",
            priority="high"
        )
        
        result = process_single_food(task)
        if result:
            print("\n结果:")
            print(json.dumps(asdict(result), ensure_ascii=False, indent=2))
    else:
        # 正常运行
        process_food_list_concurrent()
