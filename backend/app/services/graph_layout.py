"""hybrid_rag 의 graph_relations → 프론트 KnowledgeGraph 형식 변환.

프론트 기대 형식:
  { title, sub, nodes: [{id, label, type: 'topic'|'doc'|'concept', x:0..1, y:0..1, r}], edges: [[from_id, to_id], ...] }

레이아웃: 가장 degree 가 높은 노드를 중앙(topic), 나머지는 동심원에 균등 배치.
"""
import math
from typing import Any


def _node_id(name: str) -> str:
    # 노드 ID 는 문자열 그대로 (한국어 entity 이름). 단 공백·특수문자 제거로 약식 정규화.
    return name.strip()


def graph_relations_to_knowledge_graph(
    graph_relations: list[dict],
    query: str = "",
    max_nodes: int = 20,
) -> dict | None:
    """graph_relations 가 비어있으면 None.

    노드 타입 매핑:
      가장 degree 높은 노드 → 'topic' (1개)
      나머지 entity → 'concept'
    """
    if not graph_relations:
        return None

    # degree 집계
    degree: dict[str, int] = {}
    edges_raw: list[tuple[str, str]] = []
    for rel in graph_relations:
        f = (rel.get("from") or "").strip()
        t = (rel.get("to") or "").strip()
        if not f or not t or f == t:
            continue
        degree[f] = degree.get(f, 0) + 1
        degree[t] = degree.get(t, 0) + 1
        edges_raw.append((f, t))

    if not degree:
        return None

    # degree 순으로 정렬하여 상위 max_nodes 만 사용
    sorted_entities = sorted(degree.items(), key=lambda kv: kv[1], reverse=True)
    kept = {name for name, _ in sorted_entities[:max_nodes]}

    if not kept:
        return None

    # 중앙 노드: 가장 degree 높은 것
    central = sorted_entities[0][0]

    # 나머지 노드 — degree 순서대로 ring 에 배치
    others = [name for name, _ in sorted_entities[1:] if name in kept]

    nodes = []
    # 중앙
    nodes.append({
        "id": _node_id(central),
        "label": central[:18],
        "type": "topic",
        "x": 0.50,
        "y": 0.50,
        "r": 30,
    })
    # 동심원 — 1개 ring 으로 충분 (max_nodes ≤ 20)
    n = len(others)
    if n > 0:
        for i, name in enumerate(others):
            theta = 2 * math.pi * i / n - math.pi / 2  # 12시 방향에서 시작
            radius = 0.32
            x = 0.50 + radius * math.cos(theta)
            y = 0.50 + radius * math.sin(theta)
            # degree 클수록 큰 노드
            d = degree.get(name, 1)
            r = max(11, min(20, 12 + d))
            nodes.append({
                "id": _node_id(name),
                "label": name[:14],
                "type": "concept",
                "x": round(x, 3),
                "y": round(y, 3),
                "r": r,
            })

    # edges — kept 안에 속한 것만, 중복 제거
    edge_set = set()
    edges = []
    for f, t in edges_raw:
        if f not in kept or t not in kept:
            continue
        fid, tid = _node_id(f), _node_id(t)
        key = tuple(sorted([fid, tid]))
        if key in edge_set:
            continue
        edge_set.add(key)
        edges.append([fid, tid])

    title = f"'{(query or central)[:18]}' 관련 지식 그래프"
    sub = f"노드 {len(nodes)}개 · 관계 {len(edges)}개"

    return {
        "title": title,
        "sub": sub,
        "nodes": nodes,
        "edges": edges,
    }
