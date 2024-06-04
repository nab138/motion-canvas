var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BBox, createSignal, experimentalLog, map, unwrap, useLogger, useScene, } from '@motion-canvas/core';
import { CodeCursor, codeSignal, CodeSignalContext, findAllCodeRanges, isPointInCodeSelection, lines, parseCodeSelection, resolveScope, } from '../code';
import { computed, initial, nodeName, parser, signal } from '../decorators';
import { Shape } from './Shape';
/**
 * A node for displaying and animating code.
 *
 * @preview
 * ```tsx editor
 * import {Code, makeScene2D} from '@motion-canvas/2d';
 * import {createRef} from '@motion-canvas/core';
 *
 * export default makeScene2D(function* (view) {
 *   const code = createRef<Code>();
 *
 *   view.add(
 *     <Code
 *       ref={code}
 *       offset={-1}
 *       position={view.size().scale(-0.5).add(60)}
 *       fontFamily={'JetBrains Mono, monospace'}
 *       fontSize={36}
 *       code={`\
 * function hello() {
 *   console.log('Hello');
 * }`}
 *     />,
 *   );
 *
 *   yield* code()
 *     .code(
 *       `\
 * function hello() {
 *   console.warn('Hello World');
 * }`,
 *       1,
 *     )
 *     .wait(0.5)
 *     .back(1)
 *     .wait(0.5);
 * });
 * ```
 */
let Code = class Code extends Shape {
    /**
     * Create a standalone code signal.
     *
     * @param initial - The initial code.
     * @param highlighter - Custom highlighter to use.
     */
    static createSignal(initial, highlighter) {
        return new CodeSignalContext(initial, undefined, highlighter).toSignal();
    }
    setDrawHooks(value) {
        if (!useScene().experimentalFeatures &&
            value !== this.drawHooks.context.getInitial()) {
            useLogger().log({
                ...experimentalLog(`Code uses experimental draw hooks.`),
                inspect: this.key,
            });
        }
        else {
            this.drawHooks.context.setter(value);
        }
    }
    *tweenSelection(value, duration, timingFunction) {
        this.oldSelection = this.selection();
        this.selection(value);
        this.selectionProgress(0);
        yield* this.selectionProgress(1, duration, timingFunction);
        this.selectionProgress(null);
        this.oldSelection = null;
    }
    /**
     * Get the currently displayed code as a string.
     */
    parsed() {
        return resolveScope(this.code(), scope => unwrap(scope.progress) > 0.5);
    }
    highlighterCache() {
        const highlighter = this.highlighter();
        if (!highlighter || !highlighter.initialize())
            return null;
        const code = this.code();
        const before = resolveScope(code, false);
        const after = resolveScope(code, true);
        return {
            before: highlighter.prepare(before),
            after: highlighter.prepare(after),
        };
    }
    get cursor() {
        this.cursorCache ?? (this.cursorCache = new CodeCursor(this));
        return this.cursorCache;
    }
    constructor(props) {
        super({
            fontFamily: 'monospace',
            ...props,
        });
        this.oldSelection = null;
        this.selectionProgress = createSignal(null);
    }
    /**
     * Create a child code signal.
     *
     * @param initial - The initial code.
     */
    createSignal(initial) {
        return new CodeSignalContext(initial, this, this.highlighter).toSignal();
    }
    /**
     * Find all code ranges that match the given pattern.
     *
     * @param pattern - Either a string or a regular expression to match.
     */
    findAllRanges(pattern) {
        return findAllCodeRanges(this.parsed(), pattern);
    }
    /**
     * Find the first code range that matches the given pattern.
     *
     * @param pattern - Either a string or a regular expression to match.
     */
    findFirstRange(pattern) {
        return (findAllCodeRanges(this.parsed(), pattern, 1)[0] ?? [
            [0, 0],
            [0, 0],
        ]);
    }
    /**
     * Find the last code range that matches the given pattern.
     *
     * @param pattern - Either a string or a regular expression to match.
     */
    findLastRange(pattern) {
        return (findAllCodeRanges(this.parsed(), pattern).at(-1) ?? [
            [0, 0],
            [0, 0],
        ]);
    }
    /**
     * Return the bounding box of the given point (character) in the code.
     *
     * @remarks
     * The returned bound box is in local space of the `Code` node.
     *
     * @param point - The point to get the bounding box for.
     */
    getPointBBox(point) {
        const [line, column] = point;
        const drawingInfo = this.drawingInfo();
        let match;
        for (const info of drawingInfo.fragments) {
            if (info.cursor.y < line) {
                match = info;
                continue;
            }
            if (info.cursor.y === line && info.cursor.x < column) {
                match = info;
                continue;
            }
            break;
        }
        if (!match)
            return new BBox();
        const size = this.computedSize();
        return new BBox(match.position
            .sub(size.scale(0.5))
            .addX(match.characterSize.x * (column - match.cursor.x)), match.characterSize);
    }
    /**
     * Return bounding boxes of all characters in the selection.
     *
     * @remarks
     * The returned bounding boxes are in local space of the `Code` node.
     * Each line of code has a separate bounding box.
     *
     * @param selection - The selection to get the bounding boxes for.
     */
    getSelectionBBox(selection) {
        const size = this.computedSize();
        const range = parseCodeSelection(selection);
        const drawingInfo = this.drawingInfo();
        const bboxes = [];
        let current = null;
        let line = 0;
        let column = 0;
        for (const info of drawingInfo.fragments) {
            if (info.cursor.y !== line) {
                line = info.cursor.y;
                if (current) {
                    bboxes.push(current);
                    current = null;
                }
            }
            column = info.cursor.x;
            for (let i = 0; i < info.text.length; i++) {
                if (isPointInCodeSelection([line, column], range)) {
                    const bbox = new BBox(info.position
                        .sub(size.scale(0.5))
                        .addX(info.characterSize.x * (column - info.cursor.x)), info.characterSize);
                    if (!current) {
                        current = bbox;
                    }
                    else {
                        current = current.union(bbox);
                    }
                }
                else if (current) {
                    bboxes.push(current);
                    current = null;
                }
                column++;
            }
        }
        if (current) {
            bboxes.push(current);
        }
        return bboxes;
    }
    drawingInfo() {
        this.requestFontUpdate();
        const context = this.cacheCanvas();
        const code = this.code();
        context.save();
        this.applyStyle(context);
        this.applyText(context);
        this.cursor.setupDraw(context);
        this.cursor.drawScope(code);
        const info = this.cursor.getDrawingInfo();
        context.restore();
        return info;
    }
    desiredSize() {
        this.requestFontUpdate();
        const context = this.cacheCanvas();
        const code = this.code();
        context.save();
        this.applyStyle(context);
        this.applyText(context);
        this.cursor.setupMeasure(context);
        this.cursor.measureSize(code);
        const size = this.cursor.getSize();
        context.restore();
        return size;
    }
    draw(context) {
        this.requestFontUpdate();
        this.applyStyle(context);
        this.applyText(context);
        const size = this.computedSize();
        const drawingInfo = this.drawingInfo();
        context.save();
        context.translate(-size.width / 2, -size.height / 2 + drawingInfo.verticalOffset);
        const drawHooks = this.drawHooks();
        for (const info of drawingInfo.fragments) {
            context.save();
            context.globalAlpha *= info.alpha;
            drawHooks.token(context, info.text, info.position, info.fill, info.time);
            context.restore();
        }
        context.restore();
        this.drawChildren(context);
    }
    applyText(context) {
        super.applyText(context);
        context.font = this.styles.font;
        context.textBaseline = 'top';
        if ('letterSpacing' in context) {
            context.letterSpacing = this.styles.letterSpacing;
        }
    }
    collectAsyncResources() {
        super.collectAsyncResources();
        this.highlighter()?.initialize();
    }
};
Code.defaultHighlighter = null;
__decorate([
    initial(() => Code.defaultHighlighter),
    signal()
], Code.prototype, "highlighter", void 0);
__decorate([
    codeSignal()
], Code.prototype, "code", void 0);
__decorate([
    initial({
        token(ctx, text, position, color, selection) {
            ctx.fillStyle = color;
            ctx.globalAlpha *= map(0.2, 1, selection);
            ctx.fillText(text, position.x, position.y);
        },
    }),
    signal()
], Code.prototype, "drawHooks", void 0);
__decorate([
    initial(lines(0, Infinity)),
    parser(parseCodeSelection),
    signal()
], Code.prototype, "selection", void 0);
__decorate([
    computed()
], Code.prototype, "parsed", null);
__decorate([
    computed()
], Code.prototype, "highlighterCache", null);
__decorate([
    computed()
], Code.prototype, "drawingInfo", null);
Code = __decorate([
    nodeName('CodeBlock')
], Code);
export { Code };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvY29tcG9uZW50cy9Db2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLE9BQU8sRUFDTCxJQUFJLEVBQ0osWUFBWSxFQUNaLGVBQWUsRUFDZixHQUFHLEVBT0gsTUFBTSxFQUNOLFNBQVMsRUFDVCxRQUFRLEdBRVQsTUFBTSxxQkFBcUIsQ0FBQztBQUM3QixPQUFPLEVBQ0wsVUFBVSxFQU9WLFVBQVUsRUFDVixpQkFBaUIsRUFDakIsaUJBQWlCLEVBQ2pCLHNCQUFzQixFQUN0QixLQUFLLEVBQ0wsa0JBQWtCLEVBR2xCLFlBQVksR0FDYixNQUFNLFNBQVMsQ0FBQztBQUNqQixPQUFPLEVBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUUxRSxPQUFPLEVBQUMsS0FBSyxFQUFhLE1BQU0sU0FBUyxDQUFDO0FBMEQxQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQ0c7QUFFSSxJQUFNLElBQUksR0FBVixNQUFNLElBQUssU0FBUSxLQUFLO0lBQzdCOzs7OztPQUtHO0lBQ0ksTUFBTSxDQUFDLFlBQVksQ0FDeEIsT0FBdUMsRUFDdkMsV0FBMEM7UUFFMUMsT0FBTyxJQUFJLGlCQUFpQixDQUMxQixPQUFPLEVBQ1AsU0FBUyxFQUNULFdBQVcsQ0FDWixDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2YsQ0FBQztJQTJEUyxZQUFZLENBQUMsS0FBZ0I7UUFDckMsSUFDRSxDQUFDLFFBQVEsRUFBRSxDQUFDLG9CQUFvQjtZQUNoQyxLQUFLLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEVBQzdDO1lBQ0EsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO2dCQUNkLEdBQUcsZUFBZSxDQUFDLG9DQUFvQyxDQUFDO2dCQUN4RCxP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