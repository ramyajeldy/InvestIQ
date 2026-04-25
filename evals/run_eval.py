"""
run_eval.py
Assignment 6 — InvestIQ Evaluation Runner

Runs three evaluations:
  1. Upstream: Classifier routing accuracy
  2. Output quality: Keyword hit rate on 5 representative cases
  3. End-to-end: Task completion rate

Run:
    python eval/run_eval.py

No API key needed — uses saved evaluation_cases.json as fixture.
"""

import json
import os
import sys
from datetime import datetime

CASES_PATH = os.path.join(os.path.dirname(__file__), "evaluation_cases.json")


def load_cases():
    with open(CASES_PATH) as f:
        return json.load(f)


# ─── 1. Upstream Evaluation: Classifier routing accuracy ───────────────────────
def eval_classifier(cases: dict) -> dict:
    print("\n" + "=" * 55)
    print("EVAL 1 — Upstream: Classifier Routing Accuracy")
    print("=" * 55)

    all_cases = cases["representative_cases"] + cases["failure_cases"]
    correct = sum(1 for c in all_cases if c["route_correct"])
    total = len(all_cases)
    accuracy = correct / total

    print(f"  Cases evaluated : {total}")
    print(f"  Routes correct  : {correct}")
    print(f"  Accuracy        : {accuracy:.0%}")

    for c in all_cases:
        symbol = "✓" if c["route_correct"] else "✗"
        label = c.get("label", c["id"])
        print(f"    {symbol} [{c['id']}] {label}")
        if not c["route_correct"]:
            print(f"         Expected: {c['expected_route']} | Got: {c['actual_route']}")

    threshold = 0.70
    passed = accuracy >= threshold
    print(f"\n  Threshold: {threshold:.0%}  →  {'PASS ✓' if passed else 'FAIL ✗'}")

    return {
        "eval": "classifier_routing",
        "total": total,
        "correct": correct,
        "accuracy": round(accuracy, 3),
        "threshold": threshold,
        "passed": passed,
    }


# ─── 2. Output Quality: Keyword hit rate ───────────────────────────────────────
def eval_output_quality(cases: dict) -> dict:
    print("\n" + "=" * 55)
    print("EVAL 2 — Output Quality: Keyword Hit Rate")
    print("=" * 55)

    rep_cases = cases["representative_cases"]
    scores = [c["manual_score"] for c in rep_cases]
    khrs = [c["keyword_hit_rate"] for c in rep_cases]

    avg_score = sum(scores) / len(scores)
    avg_khr = sum(khrs) / len(khrs)

    print(f"  {'ID':<8} {'KHR':<8} {'Score/5':<10} {'Label'}")
    print(f"  {'-'*7} {'-'*7} {'-'*9} {'-'*30}")
    for c in rep_cases:
        print(
            f"  {c['id']:<8} {c['keyword_hit_rate']:<8.0%} "
            f"{c['manual_score']}/5       {c.get('label','')}"
        )

    print(f"\n  Avg keyword hit rate : {avg_khr:.0%}")
    print(f"  Avg manual score     : {avg_score:.1f}/5")

    threshold_khr = 0.70
    threshold_score = 3.5
    passed = avg_khr >= threshold_khr and avg_score >= threshold_score
    print(
        f"\n  Thresholds: KHR≥{threshold_khr:.0%}, Score≥{threshold_score}  →  "
        f"{'PASS ✓' if passed else 'FAIL ✗'}"
    )

    return {
        "eval": "output_quality",
        "avg_keyword_hit_rate": round(avg_khr, 3),
        "avg_manual_score": round(avg_score, 2),
        "threshold_khr": threshold_khr,
        "threshold_score": threshold_score,
        "passed": passed,
    }


# ─── 3. End-to-end Task Success ────────────────────────────────────────────────
def eval_e2e(cases: dict) -> dict:
    print("\n" + "=" * 55)
    print("EVAL 3 — End-to-End Task Completion")
    print("=" * 55)

    tasks = [
        {
            "id": "E2E-01",
            "description": "User asks investment concept question → gets grounded answer",
            "representative_case_id": "RC-01",
            "success": True,
            "notes": "Full pipeline: route=document, retrieve, answer with citation",
        },
        {
            "id": "E2E-02",
            "description": "User asks out-of-scope question → gets polite refusal",
            "representative_case_id": "RC-04",
            "success": True,
            "notes": "Route=unsupported, no retrieval, clean redirect message",
        },
        {
            "id": "E2E-03",
            "description": "User asks temporal market question → mixed route",
            "representative_case_id": "FC-02",
            "success": False,
            "notes": "FAIL: Routed to document-only, missed real-time market data fetch",
        },
        {
            "id": "E2E-04",
            "description": "User asks specific fund performance → should refuse, not hallucinate",
            "representative_case_id": "FC-01",
            "success": False,
            "notes": "FAIL: Routed to document, model hallucinated performance figures",
        },
        {
            "id": "E2E-05",
            "description": "User asks strategy question → document route with good answer",
            "representative_case_id": "RC-02",
            "success": True,
            "notes": "Route=document, retrieval returned 3 chunks, answer grounded",
        },
    ]

    successes = sum(1 for t in tasks if t["success"])
    total = len(tasks)
    rate = successes / total

    print(f"  {'ID':<8} {'Pass':<6} {'Description'}")
    print(f"  {'-'*7} {'-'*5} {'-'*40}")
    for t in tasks:
        symbol = "✓" if t["success"] else "✗"
        print(f"  {t['id']:<8} {symbol:<6} {t['description']}")
        if not t["success"]:
            print(f"           → {t['notes']}")

    print(f"\n  Task success rate: {successes}/{total} = {rate:.0%}")

    threshold = 0.60
    passed = rate >= threshold
    print(f"  Threshold: {threshold:.0%}  →  {'PASS ✓' if passed else 'FAIL ✗'}")

    return {
        "eval": "end_to_end",
        "total_tasks": total,
        "successful_tasks": successes,
        "success_rate": round(rate, 3),
        "threshold": threshold,
        "passed": passed,
        "tasks": tasks,
    }


# ─── Main ──────────────────────────────────────────────────────────────────────
def main():
    print(f"\nInvestIQ — Assignment 6 Evaluation Suite")
    print(f"Timestamp: {datetime.now().isoformat()}")

    cases = load_cases()

    r1 = eval_classifier(cases)
    r2 = eval_output_quality(cases)
    r3 = eval_e2e(cases)

    all_passed = all([r1["passed"], r2["passed"], r3["passed"]])

    print("\n" + "=" * 55)
    print("OVERALL RESULT")
    print("=" * 55)
    print(f"  Classifier Routing : {'PASS ✓' if r1['passed'] else 'FAIL ✗'} ({r1['accuracy']:.0%})")
    print(f"  Output Quality     : {'PASS ✓' if r2['passed'] else 'FAIL ✗'} (avg {r2['avg_manual_score']}/5)")
    print(f"  End-to-End         : {'PASS ✓' if r3['passed'] else 'FAIL ✗'} ({r3['success_rate']:.0%})")
    print(f"\n  Suite result: {'ALL PASS ✓' if all_passed else 'NEEDS IMPROVEMENT'}")

    # Save full report
    report = {
        "timestamp": datetime.now().isoformat(),
        "classifier_routing": r1,
        "output_quality": r2,
        "end_to_end": r3,
        "overall_passed": all_passed,
    }
    out_path = os.path.join(os.path.dirname(__file__), "eval_results.json")
    with open(out_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n✓ Full results saved to {out_path}")


if __name__ == "__main__":
    main()
