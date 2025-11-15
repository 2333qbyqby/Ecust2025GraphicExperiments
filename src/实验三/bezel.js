/* bezel.js（基础库）
 * 仅提供“基础版”Bezier曲线数学与采样功能，不包含实验中的交互与拼接逻辑。
 * 功能：
 *   - De Casteljau 任意次数点求值
 *   - Bezier 类：点采样、长度近似、求导、子曲线拆分
 *   - 基础绘制辅助（由外部 three.js 或 canvas 使用）
 *   - 基础 API（BezelAPI）供扩展文件 bezel_implement.js 继承与覆盖
 * 基础 drawBezierCurve 行为：
 *   - 控制点数 <4：采样 (n-1) 次Bezier（n为控制点数）
 *   - 控制点数 ≥4：只取前4点生成一段三次Bezier
 * 说明：多段三次Bezier拼接（n 段需要 3n+1 个控制点）、G1 连续性处理、UI 按钮、橡皮筋交互等均属于实验要求，需要在 bezel_implement.js 中“学生实现”。
 */
(function (global) {
  'use strict';

  // ------------------ 基础工具函数 ------------------
  function lerp(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  function bernsteinPoint(points, t) {
  const n = points.length - 1;
  if (n < 0) return { x: 0, y: 0 };
  t = Math.max(0, Math.min(1, t));
  let x = 0, y = 0;
  // 迭代计算二项式系数：C(n,0)=1; C(n,i)=C(n,i-1)*(n-i+1)/i
  let coeff = 1; // C(n,0)
  const invT = 1 - t;
    for (let i = 0; i <= n; i++) {
      const basis = coeff * Math.pow(t, i) * Math.pow(invT, n - i);
      x += points[i].x * basis;
      y += points[i].y * basis;
      // 更新到下一个系数 C(n,i+1)
      coeff = coeff * (n - i) / (i + 1);
    }
    return { x, y };
  }

  // 派生一阶导数的控制点集合（用于切向量）
  function derivativeControlPoints(points) {
    const n = points.length - 1;
    const d = [];
    for (let i = 0; i < n; i++) {
      d.push({ x: (points[i + 1].x - points[i].x) * n, y: (points[i + 1].y - points[i].y) * n });
    }
    return d;
  }

  // 两点距离辅助
  function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ------------------ Bezier 类 ------------------
  class Bezier {
    // points: 数组[{x,y}]，至少2个
    constructor(points) {
      if (!Array.isArray(points) || points.length < 2) throw new Error('Bezier requires at least 2 control points');
      this.points = points.map(p => ({ x: p.x, y: p.y }));
      this.degree = this.points.length - 1;
    }

  // 求曲线点：t∈[0,1]
    pointAt(t) {
      t = Math.max(0, Math.min(1, t));
      return bernsteinPoint(this.points, t);
    }

  // 求导（切向量）
    derivativeAt(t) {
      if (this.degree === 0) return { x: 0, y: 0 };
      const dcp = derivativeControlPoints(this.points);
      return bernsteinPoint(dcp, Math.max(0, Math.min(1, t)));
    }

  // 采样：等分 samples 份（含端点）
    getPoints(samples = 50) {
      const pts = [];
      for (let i = 0; i <= samples; i++) {
        pts.push(this.pointAt(i / samples));
      }
      return pts;
    }

  // 近似长度：通过采样相邻距离求和
    approximateLength(samples = 200) {
      const pts = this.getPoints(samples);
      let L = 0;
      for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
      return L;
    }

  // 子曲线拆分：在 t 处分割，返回左右两段新 Bezier
    subdivide(t) {
      t = Math.max(0, Math.min(1, t));
      // Build the de Casteljau triangle and collect left/right boundary points
      const n = this.points.length;
      const triangle = [];
      triangle.push(this.points.map(p => ({ x: p.x, y: p.y })));
      for (let r = 1; r < n; r++) {
        const prev = triangle[r - 1];
        const row = [];
        for (let i = 0; i < prev.length - 1; i++) {
          row.push(lerp(prev[i], prev[i + 1], t));
        }
        triangle.push(row);
      }

      const left = [];
      const right = [];
      for (let r = 0; r < n; r++) {
        left.push(triangle[r][0]);
        right.push(triangle[n - 1 - r][r]);
      }

      return [new Bezier(left), new Bezier(right)];
    }

  // 在 canvas 上绘制（示例用，可供扩展调用）
    draw(ctx, options = {}) {
      const {
        samples = 100,
        strokeStyle = '#0074D9',
        lineWidth = 3,
        showControls = true,
        controlStyle = '#FF4136',
        controlPointRadius = 4,
        showControlLines = true,
        controlLineStyle = '#999',
      } = options;

      // Draw curve
      const pts = this.getPoints(samples);
      ctx.save();
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = strokeStyle;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();

      // Control polygon
      if (showControlLines) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = controlLineStyle;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) ctx.lineTo(this.points[i].x, this.points[i].y);
        ctx.stroke();
      }

      // Control points
      if (showControls) {
        ctx.fillStyle = controlStyle;
        for (let p of this.points) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, controlPointRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  // Export to global
  global.Bezier = Bezier;

  // ------------------ 外部扩展 API（供 上层调用） ------------------
  // 根据当前算法模式求点（基础库默认使用 Bernstein；De Casteljau 由实现文件覆盖提供）
  function evalPoint(points, t) {
    return bernsteinPoint(points, t);
  }

  // 控制多边形复制（绘制由外层完成）
  function drawPolygonalLine(points, options = {}) {
    if (!Array.isArray(points)) return [];
    return points.map(p => ({ x: p.x, y: p.y }));
  }

  // 核心基础曲线采样：仅单段。不处理 n（多段）与 G1 连续。
  // - 控制点 <4 ：返回一段 (n-1) 次Bezier
  // - 控制点 ≥4：使用前4点返回一段三次Bezier
  // 多段拼接与 G1 连续 => bezel_implement.js 学生实现
  function drawBezierCurve(points /*, n, color */) {
    const SAMPLES = 100;
    const res = [];
    if (!Array.isArray(points) || points.length < 2) return res;

    const k = points.length;
    const ctrl = k >= 4 ? points.slice(0, 4) : points.slice();
    const seg = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      seg.push(evalPoint(ctrl, t));
    }
    res.push(seg);
    return res;
  }

  // Expose a small helper to sample arbitrary-degree bezier
  function sampleBezier(points, samples = 100) {
    const out = [];
    for (let i = 0; i <= samples; i++) out.push(evalPoint(points, i / samples));
    return out;
  }

  // Aggregate under a single namespace
  const BezelAPI = {
    drawPolygonalLine,
    drawBezierCurve,
    sampleBezier,
    evalPoint,
  };

  global.BezelAPI = BezelAPI;

})(typeof window !== 'undefined' ? window : this);
