# 实验三 要求

三、实验内容

提前下载提供的 Bezel.js

1、 基于 Web 创建一个页面，用 three.js 中的 2d 绘制相关的库函数实现贝塞尔曲线绘制。利用键盘橡皮筋技术，交互确定控制点序列，绘制 Bezier 曲线和绘制控制点折线。具体流程如下：

    ① 设置一个 isEnd 变量，当 isEnd 为 false 时，利用给定的 drawPolygonalLine() 方法、以虚线形式（见附件1）显示由控制点序列绘制的折线（控制多边形）。当鼠标移动时出现下一段折线的橡皮筋效果，鼠标左键确定新的控制点坐标，并保存在 pointVertex 向量数组。鼠标右键结束橡皮筋交互确定控制点，并设置 isEnd 为 true。（也可采用键盘，任选两个键）

    ② 根据 pointVertex 向量数组，确定有效的控制点，如果控制点数 n < 4，利用给定的 drawBezierCurve() 方法（见 Bezel.js）绘制一段 n-1 次 Bezier 曲线段，否则绘制一段三次 Bezier 曲线段。

2、 增加“Bezier by de Casteljau”按钮，用于进入 de Casteljau 绘制模式，用 de Casteljau 算法替换 Bezel.js 中的 drawBezierCurve 函数。

3、 实现 drawBezierCurve(points,n,color) 方法，通过（n*3+1）控制点，实现 n 段三次 Bezier 曲线拼接，体现 Bezier 曲线的 G1 连续性。给出调用演示。

四、拓展实验

1．举一反三，添加 “B Spline by Definition” 菜单项，用 B 样条公式实现 B 样条的绘制（建议采用“均匀”节点表，教材上有变换矩阵，可固定顶点数和次数，但需要交互输入顶点）。

2．添加“B Spline by de Boor” 菜单项，用 de Boor 算法实现 B 样条的绘制（建议采用“均匀”节点表，可固定顶点数和次数，但需要交互输入顶点）。

五、思考题

1．Bezier 曲线好不好用（优缺点）？
