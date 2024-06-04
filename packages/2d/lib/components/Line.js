var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Line_1;
import { BBox, createSignal, threadable, tween, unwrap, useLogger, Vector2, } from '@motion-canvas/core';
import { getPolylineProfile } from '../curves';
import { calculateLerpDistance, polygonLength, polygonPointsLerp, } from '../curves/createCurveProfileLerp';
import { computed, initial, nodeName, signal } from '../decorators';
import { arc, drawLine, drawPivot, lineTo, moveTo } from '../utils';
import { Curve } from './Curve';
import { Layout } from './Layout';
/**
 * A node for drawing lines and polygons.
 *
 * @remarks
 * This node can be used to render any polygonal shape defined by a set of
 * points.
 *
 * @preview
 * ```tsx editor
 * // snippet Simple line
 * import {makeScene2D, Line} from '@motion-canvas/2d';
 *
 * export default makeScene2D(function* (view) {
 *   view.add(
 *     <Line
 *       points={[
 *         [150, 50],
 *         [0, -50],
 *         [-150, 50],
 *       ]}
 *       stroke={'lightseagreen'}
 *       lineWidth={8}
 *       radius={40}
 *       startArrow
 *     />,
 *   );
 * });
 *
 * // snippet Polygon
 * import {makeScene2D, Line} from '@motion-canvas/2d';
 *
 * export default makeScene2D(function* (view) {
 *   view.add(
 *     <Line
 *       points={[
 *         [-200, 70],
 *         [150, 70],
 *         [100, -70],
 *         [-100, -70],
 *       ]}
 *       fill={'lightseagreen'}
 *       closed
 *     />,
 *   );
 * });
 *
 * // snippet Using signals
 * import {makeScene2D, Line} from '@motion-canvas/2d';
 * import {createSignal} from '@motion-canvas/core';
 *
 * export default makeScene2D(function* (view) {
 *   const tip = createSignal(-150);
 *   view.add(
 *     <Line
 *       points={[
 *         [-150, 70],
 *         [150, 70],
 *         // this point is dynamically calculated based on the signal:
 *         () => [tip(), -70],
 *       ]}
 *       stroke={'lightseagreen'}
 *       lineWidth={8}
 *       closed
 *     />,
 *   );
 *
 *   yield* tip(150, 1).back(1);
 * });
 *
 * // snippet Tweening points
 * import {makeScene2D, Line} from '@motion-canvas/2d';
 * import {createRef} from '@motion-canvas/core';
 *
 * export default makeScene2D(function* (view) {
 *   const line = createRef<Line>();
 *   view.add(
 *     <Line
 *       ref={line}
 *       points={[
 *         [-150, 70],
 *         [150, 70],
 *         [0, -70],
 *       ]}
 *       stroke={'lightseagreen'}
 *       lineWidth={8}
 *       radius={20}
 *       closed
 *     />,
 *   );
 *
 *   yield* line()
 *     .points(
 *       [
 *         [-150, 0],
 *         [0, 100],
 *         [150, 0],
 *         [150, -70],
 *         [-150, -70],
 *       ],
 *       2,
 *     )
 *     .back(2);
 * });
 * ```
 */
let Line = Line_1 = class Line extends Curve {
    /**
     * Rotate the points to minimize the overall distance traveled when tweening.
     *
     * @param points - The points to rotate.
     * @param reference - The reference points to which the distance is measured.
     * @param closed - Whether the points form a closed polygon.
     */
    static rotatePoints(points, reference, closed) {
        if (closed) {
            let minDistance = Infinity;
            let bestOffset = 0;
            for (let offset = 0; offset < points.length; offset += 1) {
                const distance = calculateLerpDistance(points, reference, offset);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestOffset = offset;
                }
            }
            if (bestOffset) {
                const spliced = points.splice(0, bestOffset);
                points.splice(points.length, 0, ...spliced);
            }
        }
        else {
            const originalDistance = calculateLerpDistance(points, reference, 0);
            const reversedPoints = [...points].reverse();
            const reversedDistance = calculateLerpDistance(reversedPoints, reference, 0);
            if (reversedDistance < originalDistance) {
                points.reverse();
            }
        }
    }
    /**
     * Distribute additional points along the polyline.
     *
     * @param points - The points of a polyline along which new points should be
     *                 distributed.
     * @param count - The number of points to add.
     */
    static distributePoints(points, count) {
        if (points.length === 0) {
            for (let j = 0; j < count; j++) {
                points.push(Vector2.zero);
            }
            return;
        }
        if (points.length === 1) {
            const point = points[0];
            for (let j = 0; j < count; j++) {
                points.push(point);
            }
            return;
        }
        const desiredLength = points.length + count;
        const arcLength = polygonLength(points);
        let density = count / arcLength;
        let i = 0;
        while (points.length < desiredLength) {
            const pointsLeft = desiredLength - points.length;
            if (i + 1 >= points.length) {
                density = pointsLeft / arcLength;
                i = 0;
                continue;
            }
            const a = points[i];
            const b = points[i + 1];
            const length = a.sub(b).magnitude;
            const pointCount = Math.min(Math.round(length * density), pointsLeft) + 1;
            for (let j = 1; j < pointCount; j++) {
                points.splice(++i, 0, Vector2.lerp(a, b, j / pointCount));
            }
            i++;
        }
    }
    *tweenPoints(value, time, timingFunction) {
        const fromPoints = [...this.parsedPoints()];
        const toPoints = this.parsePoints(unwrap(value));
        const closed = this.closed();
        const diff = fromPoints.length - toPoints.length;
        Line_1.distributePoints(diff < 0 ? fromPoints : toPoints, Math.abs(diff));
        Line_1.rotatePoints(toPoints, fromPoints, closed);
        this.tweenedPoints(fromPoints);
        yield* tween(time, value => {
            const progress = timingFunction(value);
            this.tweenedPoints(polygonPointsLerp(fromPoints, toPoints, progress));
        }, () => {
            this.tweenedPoints(null);
            this.points(value);
        });
    }
    constructor(props) {
        super(props);
        this.tweenedPoints = createSignal(null);
        if (props.children === undefined && props.points === undefined) {
            useLogger().warn({
                message: 'No points specified for the line',
                remarks: "<p>The line won&#39;t be visible unless you specify at least two points:</p>\n<pre class=\"\"><code class=\"language-tsx\">&lt;<span class=\"hljs-title class_\">Line</span>\n  stroke=<span class=\"hljs-string\">&quot;#fff&quot;</span>\n  lineWidth={<span class=\"hljs-number\">8</span>}\n  points={[\n    [<span class=\"hljs-number\">100</span>, <span class=\"hljs-number\">0</span>],\n    [<span class=\"hljs-number\">0</span>, <span class=\"hljs-number\">0</span>],\n    [<span class=\"hljs-number\">0</span>, <span class=\"hljs-number\">100</span>],\n  ]}\n/&gt;</code></pre><p>Alternatively, you can define the points using the children:</p>\n<pre class=\"\"><code class=\"language-tsx\">&lt;<span class=\"hljs-title class_\">Line</span> stroke=<span class=\"hljs-string\">&quot;#fff&quot;</span> lineWidth={<span class=\"hljs-number\">8</span>}&gt;\n  <span class=\"language-xml\"><span class=\"hljs-tag\">&lt;<span class=\"hljs-name\">Node</span> <span class=\"hljs-attr\">x</span>=<span class=\"hljs-string\">{100}</span> /&gt;</span></span>\n  <span class=\"language-xml\"><span class=\"hljs-tag\">&lt;<span class=\"hljs-name\">Node</span> /&gt;</span></span>\n  <span class=\"language-xml\"><span class=\"hljs-tag\">&lt;<span class=\"hljs-name\">Node</span> <span class=\"hljs-attr\">y</span>=<span class=\"hljs-string\">{100}</span> /&gt;</span></span>\n&lt;/<span class=\"hljs-title class_\">Line</span>&gt;</code></pre><p>If you did this intentionally, and want to disable this message, set the\n<code>points</code> property to <code>null</code>:</p>\n<pre class=\"\"><code class=\"language-tsx\">&lt;<span class=\"hljs-title class_\">Line</span> stroke=<span class=\"hljs-string\">&quot;#fff&quot;</span> lineWidth={<span class=\"hljs-number\">8</span>} points={<span class=\"hljs-literal\">null</span>} /&gt;</code></pre>",
                inspect: this.key,
            });
        }
    }
    childrenBBox() {
        let points = this.tweenedPoints();
        if (!points) {
            const custom = this.points();
            points = custom
                ? custom.map(signal => new Vector2(unwrap(signal)))
                : this.children()
                    .filter(child => !(child instanceof Layout) || child.isLayoutRoot())
                    .map(child => child.position());
        }
        return BBox.fromPoints(...points);
    }
    parsedPoints() {
        return this.parsePoints(this.points());
    }
    profile() {
        return getPolylineProfile(this.tweenedPoints() ?? this.parsedPoints(), this.radius(), this.closed());
    }
    lineWidthCoefficient() {
        const radius = this.radius();
        const join = this.lineJoin();
        let coefficient = super.lineWidthCoefficient();
        if (radius === 0 && join === 'miter') {
            const { minSin } = this.profile();
            if (minSin > 0) {
                coefficient = Math.max(coefficient, 0.5 / minSin);
            }
        }
        return coefficient;
    }
    drawOverlay(context, matrix) {
        const box = this.childrenBBox().transformCorners(matrix);
        const size = this.computedSize();
        const offset = size.mul(this.offset()).scale(0.5).transformAsPoint(matrix);
        context.fillStyle = 'white';
        context.strokeStyle = 'black';
        context.lineWidth = 1;
        const path = new Path2D();
        const points = (this.tweenedPoints() ?? this.parsedPoints()).map(point => point.transformAsPoint(matrix));
        if (points.length > 0) {
            moveTo(path, points[0]);
            for (const point of points) {
                lineTo(path, point);
                context.beginPath();
                arc(context, point, 4);
                context.closePath();
                context.fill();
                context.stroke();
            }
        }
        context.strokeStyle = 'white';
        context.stroke(path);
        context.beginPath();
        drawPivot(context, offset);
        context.stroke();
        context.beginPath();
        drawLine(context, box);
        context.closePath();
        context.stroke();
    }
    parsePoints(points) {
        return points
            ? points.map(signal => new Vector2(unwrap(signal)))
            : this.children().map(child => child.position());
    }
};
__decorate([
    initial(0),
    signal()
], Line.prototype, "radius", void 0);
__decorate([
    initial(null),
    signal()
], Line.prototype, "points", void 0);
__decorate([
    threadable()
], Line.prototype, "tweenPoints", null);
__decorate([
    computed()
], Line.prototype, "childrenBBox", null);
__decorate([
    computed()
], Line.prototype, "parsedPoints", null);
__decorate([
    computed()
], Line.prototype, "profile", null);
Line = Line_1 = __decorate([
    nodeName('Line')
], Line);
export { Line };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGluZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvY29tcG9uZW50cy9MaW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQSxPQUFPLEVBQ0wsSUFBSSxFQUNKLFlBQVksRUFJWixVQUFVLEVBR1YsS0FBSyxFQUNMLE1BQU0sRUFDTixTQUFTLEVBQ1QsT0FBTyxHQUNSLE1BQU0scUJBQXFCLENBQUM7QUFDN0IsT0FBTyxFQUFlLGtCQUFrQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQzNELE9BQU8sRUFDTCxxQkFBcUIsRUFDckIsYUFBYSxFQUNiLGlCQUFpQixHQUNsQixNQUFNLGtDQUFrQyxDQUFDO0FBQzFDLE9BQU8sRUFBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDbEUsT0FBTyxFQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFbEUsT0FBTyxFQUFDLEtBQUssRUFBYSxNQUFNLFNBQVMsQ0FBQztBQUMxQyxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBYWhDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXdHRztBQUVJLElBQU0sSUFBSSxZQUFWLE1BQU0sSUFBSyxTQUFRLEtBQUs7SUFDN0I7Ozs7OztPQU1HO0lBQ0ssTUFBTSxDQUFDLFlBQVksQ0FDekIsTUFBaUIsRUFDakIsU0FBb0IsRUFDcEIsTUFBZTtRQUVmLElBQUksTUFBTSxFQUFFO1lBQ1YsSUFBSSxXQUFXLEdBQUcsUUFBUSxDQUFDO1lBQzNCLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztZQUNuQixLQUFLLElBQUksTUFBTSxH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