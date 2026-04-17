"""StudySolo 问卷数据深度统计与图表生成脚本.

读取 docs/技术指导/问卷 副本_问卷_收集结果.csv，输出：
1. 关键指标 JSON（供答辩稿引用真实数字）
2. 七张图：痛点、AI 工具问题、期望能力、工具分布、场景评分、高校覆盖、痛点-产品映射
"""

from __future__ import annotations

import csv
import json
import re
from collections import Counter
from pathlib import Path

import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT / "docs" / "技术指导" / "问卷 副本_问卷_收集结果.csv"
OUT_DIR = ROOT / "scripts" / "survey-stats" / "out"
OUT_DIR.mkdir(exist_ok=True, parents=True)

plt.rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei", "DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

BRAND = {
    "primary": "#6366F1",
    "secondary": "#EC4899",
    "accent": "#10B981",
    "warn": "#F59E0B",
    "danger": "#EF4444",
    "muted": "#94A3B8",
    "grid": "#E5E7EB",
}


def read_rows() -> list[dict]:
    rows = []
    with CSV_PATH.open("r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("编号") and row["编号"].strip().isdigit():
                rows.append(row)
    return rows


def split_multi(value):
    if not value:
        return []
    parts = re.split(r"[,，、]\s*", value)
    return [p.strip().lstrip("□").strip() for p in parts if p.strip()]


def count_option(rows, key):
    c = Counter()
    for r in rows:
        for item in split_multi(r.get(key, "")):
            c[item] += 1
    return c


def pct(n, total):
    return round(n * 100 / total, 1) if total else 0.0


def hbar(ax, labels, values, total, color=BRAND["primary"], title="", xlabel="占比 (%)"):
    percents = [v * 100 / total for v in values]
    y_pos = list(range(len(labels)))
    bars = ax.barh(y_pos, percents, color=color, edgecolor="white", linewidth=1.2)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels, fontsize=10)
    ax.invert_yaxis()
    ax.set_xlabel(xlabel, fontsize=10)
    ax.set_title(title, fontsize=13, fontweight="bold", pad=12)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(BRAND["muted"])
    ax.spines["bottom"].set_color(BRAND["muted"])
    ax.grid(axis="x", color=BRAND["grid"], linestyle="--", linewidth=0.6)
    ax.set_axisbelow(True)
    for bar, v, p in zip(bars, values, percents):
        ax.text(p + 1.2, bar.get_y() + bar.get_height() / 2,
                f"{p:.0f}%  (n={v})", va="center", fontsize=9, color="#334155")
    ax.set_xlim(0, max(percents) * 1.3 + 5)


def save_fig(fig, name):
    path = OUT_DIR / name
    fig.tight_layout()
    fig.savefig(path, dpi=160, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"[saved] {path.relative_to(ROOT)}")


def main():
    rows = read_rows()
    total = len(rows)
    print(f"有效样本: {total}")

    grade_counter = Counter(r["您的年级是？"].strip() for r in rows)
    major_counter = Counter(r["您的专业类别是？"].strip() for r in rows)
    school_counter = Counter()
    for r in rows:
        school = r.get("您的学校全称是？", "").strip()
        supplement = r.get("您的学校全称是？-补充填写其他学校（全称）-补充内容", "").strip()
        name = supplement if "补充" in school else (school or supplement)
        if name:
            school_counter[name] += 1
    schools_n = len(school_counter)

    ai_usage = Counter(r.get("您是否使用过AI工具（如ChatGPT、文心一言、Kimi、通义千问、DeepSeek等）", "").strip() for r in rows)
    used_ai = sum(v for k, v in ai_usage.items() if "是" in k)

    difficulty_key = "在学习新知识时，您最常遇到哪些困难？"
    difficulties = count_option(rows, difficulty_key)

    material_key = "当您需要查找学习资料时，通常会遇到什么问题？"
    material_problems = count_option(rows, material_key)

    ai_problem_key = "使用 AI 工具辅助学习时，您遇到过哪些问题？"
    ai_problems = count_option(rows, ai_problem_key)

    expect_key = "您最希望这样的 \"学习助手\" 具备什么能力？"
    expectations = count_option(rows, expect_key)

    tool_key = "您使用过一下哪些AI工具？"
    tools = count_option(rows, tool_key)

    scenario_key = "如果 AI 可以 \"一次性帮你完成一整套学习任务\"（比如：分析目标→制定计划→生成大纲→总结知识点→出测验题），而不是每次只回答一个问题，您觉得怎么样？"
    scores = [int(r[scenario_key].strip()) for r in rows if r.get(scenario_key, "").strip().isdigit()]
    score_counter = Counter(scores)
    positive = sum(v for k, v in score_counter.items() if k >= 4)

    canvas_key = "【场景描述】想象你对 AI 说 \"我想在一周内理解机器学习的基础概念\"，AI 会自动为你：①分析你的学习目标 → ②规划学习大纲 → ③搜索相关资料 → ④生成核心知识点总结 → ⑤为你出几道测试题。整个过程你都可以在画布上看到，还能随时暂停、修改、调整步骤顺序。这样的学习方式，你觉得如何？"
    canvas_scores = [int(r[canvas_key].strip()) for r in rows if r.get(canvas_key, "").strip().isdigit()]
    canvas_counter = Counter(canvas_scores)
    canvas_positive = sum(v for k, v in canvas_counter.items() if k >= 4)

    contact_key = "我们正在开发这款 \"AI 学习工作流\" 工具，如果你有兴趣参与内测，优先体验所有新功能，请留下你的联系方式：（选填）"
    contact_n = 0
    for r in rows:
        v = (r.get(contact_key, "") or "").strip()
        if v and v not in {"无", "暂无", "无。", "没有"}:
            contact_n += 1

    summary = {
        "total_samples": total,
        "schools_count": schools_n,
        "schools_top5": school_counter.most_common(5),
        "grades": dict(grade_counter),
        "majors": dict(major_counter),
        "ai_usage_rate_pct": pct(used_ai, total),
        "learning_difficulties_top5": [(k, v, pct(v, total)) for k, v in difficulties.most_common(5)],
        "material_problems_top5": [(k, v, pct(v, total)) for k, v in material_problems.most_common(5)],
        "ai_tool_problems_top5": [(k, v, pct(v, total)) for k, v in ai_problems.most_common(5)],
        "expectations_top6": [(k, v, pct(v, total)) for k, v in expectations.most_common(6)],
        "tools_top6": [(k, v, pct(v, total)) for k, v in tools.most_common(6)],
        "one_shot_scenario_scores": dict(sorted(score_counter.items())),
        "one_shot_positive_pct": pct(positive, len(scores)) if scores else 0,
        "canvas_scenario_scores": dict(sorted(canvas_counter.items())),
        "canvas_positive_pct": pct(canvas_positive, len(canvas_scores)) if canvas_scores else 0,
        "contact_count": contact_n,
        "contact_rate_pct": pct(contact_n, total),
    }
    (OUT_DIR / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"[saved] {(OUT_DIR / 'summary.json').relative_to(ROOT)}")

    top = difficulties.most_common(6)
    fig, ax = plt.subplots(figsize=(10, 5.2))
    hbar(ax, [k[:22] for k, _ in top], [v for _, v in top], total,
         color=BRAND["danger"], title=f"学习新知识最常遇到的困难  (N={total})")
    save_fig(fig, "01_learning_difficulties.png")

    top = ai_problems.most_common(7)
    fig, ax = plt.subplots(figsize=(10, 5.8))
    hbar(ax, [k[:26] for k, _ in top], [v for _, v in top], total,
         color=BRAND["primary"], title=f"使用 AI 学习工具遇到的问题  (N={total})")
    save_fig(fig, "02_ai_tool_problems.png")

    top = expectations.most_common(6)
    fig, ax = plt.subplots(figsize=(10, 5.2))
    hbar(ax, [k[:22] for k, _ in top], [v for _, v in top], total,
         color=BRAND["accent"], title=f"最希望学习助手具备的能力  (N={total})")
    save_fig(fig, "03_expectations.png")

    top = tools.most_common(8)
    fig, ax = plt.subplots(figsize=(10, 5.2))
    hbar(ax, [k[:18] for k, _ in top], [v for _, v in top], total,
         color=BRAND["secondary"], title=f"使用过的 AI 工具分布  (N={total})")
    save_fig(fig, "04_tool_distribution.png")

    fig, ax = plt.subplots(figsize=(8.5, 5))
    xs = [1, 2, 3, 4, 5]
    ys = [canvas_counter.get(x, 0) for x in xs]
    colors = [BRAND["danger"], BRAND["warn"], BRAND["muted"], BRAND["accent"], BRAND["primary"]]
    bars = ax.bar([str(x) for x in xs], ys, color=colors, edgecolor="white", linewidth=1.5)
    for bar, v in zip(bars, ys):
        p = pct(v, len(canvas_scores))
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.3,
                f"{v}\n{p}%", ha="center", fontsize=10, color="#334155")
    ax.set_xlabel("评分（1=完全不感兴趣  5=非常希望）", fontsize=10)
    ax.set_ylabel("样本数", fontsize=10)
    ax.set_title(
        f"场景接受度：AI 在画布上自动生成并执行学习工作流\n"
        f"4–5 分正向占比  {summary['canvas_positive_pct']}%  (N={len(canvas_scores)})",
        fontsize=12, fontweight="bold", pad=14,
    )
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="y", color=BRAND["grid"], linestyle="--", linewidth=0.6)
    ax.set_axisbelow(True)
    ax.set_ylim(0, (max(ys) if ys else 1) * 1.3)
    save_fig(fig, "05_canvas_scenario_score.png")

    top_schools = school_counter.most_common(8)
    fig, ax = plt.subplots(figsize=(10, 5.2))
    hbar(ax, [k[:14] for k, _ in top_schools], [v for _, v in top_schools], total,
         color=BRAND["warn"],
         title=f"样本高校分布  共 {schools_n} 所，Top 8  (N={total})")
    save_fig(fig, "06_school_distribution.png")

    fig, ax = plt.subplots(figsize=(11, 5.5))
    mapped = [
        ("一次只能问一个问题，没法系统化学习", ai_problems.get("一次只能问一个问题，没法系统化学习", 0), "DAG 工作流"),
        ("回答太笼统，不够具体落地", ai_problems.get("回答太笼统，不够具体落地", 0), "场景专属节点"),
        ("回答不够准确，经常出错", ai_problems.get("回答不够准确，经常出错", 0), "多模型路由 + 容灾"),
        ("无法保存和复用之前的对话内容", ai_problems.get("无法保存和复用之前的对话内容", 0), "知识库 + Fork"),
        ("不知道怎么提问才能得到好答案", ai_problems.get("不知道怎么提问才能得到好答案", 0), "自然语言生图"),
        ("没法看到 AI 的思考过程，像黑盒", ai_problems.get("没法看到 AI 的思考过程，像黑盒", 0), "SSE 可观测"),
    ]
    mapped = [m for m in mapped if m[1] > 0]
    mapped.sort(key=lambda x: x[1], reverse=True)
    labels = [f"{m[0][:18]}\n→ {m[2]}" for m in mapped]
    values = [m[1] for m in mapped]
    percents = [v * 100 / total for v in values]
    y_pos = list(range(len(labels)))
    bars = ax.barh(y_pos, percents, color=BRAND["primary"], edgecolor="white", linewidth=1.2)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels, fontsize=9.5)
    ax.invert_yaxis()
    ax.set_xlabel("痛点出现率 (%)", fontsize=10)
    ax.set_title(f"用户痛点 → StudySolo 产品能力映射  (N={total})",
                 fontsize=13, fontweight="bold", pad=12)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="x", color=BRAND["grid"], linestyle="--", linewidth=0.6)
    ax.set_axisbelow(True)
    for bar, v, p in zip(bars, values, percents):
        ax.text(p + 1.2, bar.get_y() + bar.get_height() / 2,
                f"{p:.0f}%  (n={v})", va="center", fontsize=9, color="#334155")
    ax.set_xlim(0, max(percents) * 1.35 + 5)
    save_fig(fig, "07_pain_to_product.png")

    print("\n================ 关键数字（可直接引用） ================")
    print(f"有效样本:                {total}")
    print(f"覆盖高校:                {schools_n} 所")
    print(f"AI 使用率:               {summary['ai_usage_rate_pct']}%")
    print(f"场景（一次性完成）4-5分: {summary['one_shot_positive_pct']}%")
    print(f"场景（画布可视化）4-5分: {summary['canvas_positive_pct']}%")
    print(f"留下内测联系方式:         {contact_n} 人 ({summary['contact_rate_pct']}%)")
    print("\nAI 工具痛点 Top5:")
    for k, v, p in summary["ai_tool_problems_top5"]:
        print(f"  - {k}: {p}%  ({v}/{total})")
    print("\n学习困难 Top5:")
    for k, v, p in summary["learning_difficulties_top5"]:
        print(f"  - {k}: {p}%  ({v}/{total})")
    print("\n期望能力 Top6:")
    for k, v, p in summary["expectations_top6"]:
        print(f"  - {k}: {p}%  ({v}/{total})")
    print("\n工具分布 Top6:")
    for k, v, p in summary["tools_top6"]:
        print(f"  - {k}: {p}%  ({v}/{total})")
    print("\n覆盖高校 Top5:")
    for k, v in summary["schools_top5"]:
        print(f"  - {k}: {v}")


if __name__ == "__main__":
    main()
