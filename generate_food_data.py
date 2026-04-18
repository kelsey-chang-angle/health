#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
食物数据生成脚本 - 调用豆包2.0 API
用于批量生成食物的营养和中医食疗数据
"""

import json
import csv
import time
import os
from datetime import datetime
from typing import List, Dict, Optional

# 豆包 API 配置
# 使用豆包 Seed 2.0 Pro 模型
DOUBAO_API_KEY = "ark-aab45fa3-a872-4767-a404-4a2b95fd593c-c5cf6"
DOUBAO_MODEL = "doubao-seed-2-0-pro-260215"
DOUBAO_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"


def get_system_prompt() -> str:
    """系统提示词，定义 AI 的角色和任务"""
    return """你是一位专业的营养师和中医食疗专家，精通现代营养学和传统中医食疗理论。
你的任务是为食物提供准确、详细的信息，包括营养成分、中医属性、适宜人群等。

重要原则：
1. 中医属性（寒热温凉）必须准确，参考《中华本草》《食疗本草》等权威典籍
2. 营养数据要符合《中国食物成分表》的标准
3. 体质适配基于中医九种体质理论
4. 不确定的信息请标注为 null，不要猜测
5. 所有数据必须客观、科学，不夸大功效"""


def get_food_prompt(food_name: str, category: str) -> str:
    """
    为特定食物生成提示词
    
    Args:
        food_name: 食物中文名
        category: 食物分类
    
    Returns:
        完整的提示词文本
    """
    return f'''请为以下食物提供详细信息，严格按照指定的 JSON 格式返回。

食物名称：{food_name}
食物分类：{category}

请按以下格式返回（只返回 JSON，不要有其他文字）：

{{
  "name": "{food_name}",
  "aliases": ["别名1", "别名2"],
  "category": "{category}",
  
  "tcm": {{
    "nature": "寒/凉/平/温/热",
    "taste": "辛/甘/酸/苦/咸",
    "meridian": ["归经1", "归经2"],
    "effects": ["功效1", "功效2"]
  }},
  
  "nutrition": {{
    "calories": 0,
    "carbs": 0,
    "protein": 0,
    "fat": 0,
    "fiber": 0,
    "gi": null,
    "gl": null,
    "potassium": null,
    "sodium": null,
    "vc": null
  }},
  
  "suitableFor": ["适宜人群1", "适宜人群2"],
  "unsuitableFor": ["不适宜人群1", "不适宜人群2"],
  
  "constitution": {{
    "good": ["平和质", "气虚质"],
    "bad": ["阳虚质", "痰湿质"]
  }},
  
  "conditions": {{
    "goodFor": ["症状1", "症状2"],
    "badFor": ["症状3", "症状4"]
  }},
  
  "pairing": {{
    "good": [
      {{"food": "搭配食物1", "reason": "搭配原因"}}
    ],
    "bad": [
      {{"food": "不宜搭配1", "reason": "不宜原因"}}
    ]
  }},
  
  "cookingTips": ["烹饪建议1", "烹饪建议2"],
  "storage": "储存方法",
  "dailyLimit": "建议每日食用量",
  "notes": "其他注意事项"
}}

字段说明：
1. nature: 只能是 寒、凉、平、温、热 之一
2. taste: 可以是多选，如 "甘、微苦"
3. meridian: 如 肺、大肠、脾、胃 等
4. effects: 中医功效描述，如 "润肠通便、清热解毒"
5. nutrition: 每100g可食部的含量，不确定的填 null
6. constitution.good/bad: 从九种体质中选择：平和质、气虚质、阳虚质、阴虚质、痰湿质、湿热质、血瘀质、气郁质、特禀质
7. conditions: 具体症状，如 便秘、腹泻、高血压、高血糖 等
8. pairing: 食物搭配宜忌，提供2-3个即可

请确保 JSON 格式正确，所有字符串使用双引号。'''


def call_doubao_api(food_name: str, category: str) -> Optional[Dict]:
    """
    调用豆包 API 生成食物数据
    
    Args:
        food_name: 食物名称
        category: 食物分类
    
    Returns:
        解析后的 JSON 数据，失败返回 None
    """
    try:
        # 尝试导入 openai 库
        from openai import OpenAI
    except ImportError:
        print("错误：请先安装 openai 库")
        print("运行: pip install openai")
        return None
    
    # 初始化客户端
    client = OpenAI(
        api_key=DOUBAO_API_KEY,
        base_url=DOUBAO_BASE_URL
    )
    
    try:
        # 调用 API
        response = client.chat.completions.create(
            model=DOUBAO_MODEL,
            messages=[
                {"role": "system", "content": get_system_prompt()},
                {"role": "user", "content": get_food_prompt(food_name, category)}
            ],
            temperature=0.3,  # 低温度保证一致性
            max_tokens=2000
        )
        
        # 获取返回内容
        content = response.choices[0].message.content
        
        # 提取 JSON 部分
        # 处理可能的 markdown 代码块
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            json_str = content.split("```")[1].split("```")[0].strip()
        else:
            json_str = content.strip()
        
        # 解析 JSON
        data = json.loads(json_str)
        
        # 添加元数据
        data["_meta"] = {
            "generated_at": datetime.now().isoformat(),
            "model": DOUBAO_MODEL,
            "source": "doubao-ai"
        }
        
        return data
        
    except Exception as e:
        print(f"  API 调用失败: {e}")
        return None


def process_food_list(
    input_file: str = "food_list.csv",
    output_file: str = "food_database.json",
    error_file: str = "failed_foods.csv",
    delay: float = 1.0
) -> None:
    """
    批量处理食物清单
    
    Args:
        input_file: 输入 CSV 文件路径
        output_file: 输出 JSON 文件路径
        error_file: 失败记录 CSV 文件路径
        delay: 每次请求间隔（秒）
    """
    results = []
    failed = []
    
    # 读取食物清单
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        foods = list(reader)
    
    total = len(foods)
    print(f"开始处理 {total} 种食物...")
    print("-" * 50)
    
    for i, food in enumerate(foods, 1):
        food_name = food['name']
        category = food['category']
        priority = food['priority']
        
        print(f"[{i}/{total}] 正在生成: {food_name} ({category})")
        
        # 调用 API
        data = call_doubao_api(food_name, category)
        
        if data:
            results.append(data)
            print(f"  ✅ 成功")
        else:
            failed.append({
                'name': food_name,
                'category': category,
                'priority': priority
            })
            print(f"  ❌ 失败")
        
        # 间隔等待
        if i < total:
            time.sleep(delay)
    
    print("-" * 50)
    print(f"处理完成: 成功 {len(results)} 个, 失败 {len(failed)} 个")
    
    # 保存成功结果
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"✅ 数据已保存到: {output_file}")
    
    # 保存失败记录
    if failed:
        with open(error_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['name', 'category', 'priority'])
            writer.writeheader()
            writer.writerows(failed)
        print(f"⚠️  失败记录已保存到: {error_file}")


def validate_food_data(data: Dict) -> List[str]:
    """
    验证食物数据的完整性和正确性
    
    Args:
        data: 食物数据字典
    
    Returns:
        错误信息列表
    """
    errors = []
    
    # 检查必填字段
    required = ['name', 'tcm', 'nutrition']
    for field in required:
        if field not in data:
            errors.append(f"缺少必填字段: {field}")
    
    # 检查中医属性
    valid_natures = ['寒', '凉', '平', '温', '热']
    nature = data.get('tcm', {}).get('nature')
    if nature and nature not in valid_natures:
        errors.append(f"无效的 nature 值: {nature}")
    
    # 检查体质
    valid_constitutions = [
        '平和质', '气虚质', '阳虚质', '阴虚质',
        '痰湿质', '湿热质', '血瘀质', '气郁质', '特禀质'
    ]
    for c in data.get('constitution', {}).get('good', []):
        if c not in valid_constitutions:
            errors.append(f"无效的体质: {c}")
    
    # 检查数值
    nutrition = data.get('nutrition', {})
    for field in ['calories', 'carbs', 'protein', 'fat']:
        value = nutrition.get(field)
        if value is not None:
            if not isinstance(value, (int, float)):
                errors.append(f"{field} 类型错误")
            elif value < 0:
                errors.append(f"{field} 不能为负数")
    
    return errors


def verify_database(file_path: str = "food_database.json") -> None:
    """
    验证生成的数据库
    
    Args:
        file_path: 数据库文件路径
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        foods = json.load(f)
    
    print(f"\n验证 {len(foods)} 条数据...")
    print("-" * 50)
    
    valid_count = 0
    for food in foods:
        errors = validate_food_data(food)
        if errors:
            print(f"\n❌ {food.get('name', 'Unknown')}:")
            for error in errors:
                print(f"   - {error}")
        else:
            valid_count += 1
    
    print(f"\n{'-' * 50}")
    print(f"验证完成: {valid_count}/{len(foods)} 条数据通过")


if __name__ == "__main__":
    import sys
    
    # 检查命令行参数
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "generate":
            # 生成数据
            process_food_list()
        elif command == "verify":
            # 验证数据
            verify_database()
        elif command == "test":
            # 测试单个食物
            if len(sys.argv) > 2:
                test_food = sys.argv[2]
                print(f"测试生成: {test_food}")
                result = call_doubao_api(test_food, "测试")
                if result:
                    print(json.dumps(result, ensure_ascii=False, indent=2))
            else:
                print("用法: python generate_food_data.py test 食物名称")
        else:
            print(f"未知命令: {command}")
            print("可用命令: generate, verify, test")
    else:
        # 默认执行生成
        print("食物数据生成工具")
        print("=" * 50)
        print("\n使用说明:")
        print("1. 配置 API 密钥（修改脚本中的 DOUBAO_API_KEY 或设置环境变量）")
        print("2. 运行: python generate_food_data.py generate")
        print("3. 验证: python generate_food_data.py verify")
        print("4. 测试: python generate_food_data.py test 苹果")
        print("\n" + "=" * 50)
        
        # 检查配置
        if DOUBAO_API_KEY == "your-api-key-here":
            print("\n⚠️  警告: API 密钥未配置")
            print("请修改脚本中的 DOUBAO_API_KEY 或设置环境变量")
        else:
            print(f"\n✅ API 密钥已配置")
            print(f"   模型: {DOUBAO_MODEL}")
            print(f"   服务端点: {DOUBAO_BASE_URL}")
