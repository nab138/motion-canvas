import {SignalValue, SimpleSignal} from '@motion-canvas/core/lib/signals';
import {
  BBox,
  PossibleSpacing,
  SerializedVector2,
  Vector2,
} from '@motion-canvas/core/lib/types';
import {computed, signal} from '../decorators';
import {Shape, ShapeProps} from './Shape';
import {Node, NodeProps} from './Node';
import {DesiredLength, PossibleCanvasStyle} from '../partials';
import {useLogger} from '@motion-canvas/core/lib/utils';
import {Path, PathProps} from './Path';
import {Rect, RectProps} from './Rect';
import {
  clampRemap,
  easeInOutSine,
  TimingFunction,
  tween,
} from '@motion-canvas/core/lib/tweening';
import {Layout} from './Layout';
import {lazy, threadable} from '@motion-canvas/core/lib/decorators';
import {View2D} from './View2D';
import {all, delay} from '@motion-canvas/core/lib/flow';
import {ThreadGenerator} from '@motion-canvas/core/lib/threading';
import {Circle, CircleProps} from './Circle';
import {Line, LineProps} from './Line';
import {Img, ImgProps} from './Img';

export interface SVGShape {
  id: string;
  shape: Node;
}

export interface SVGShapeData {
  id: string;
  type: new (props: NodeProps) => Node;
  props: ShapeProps;
  children?: SVGShapeData[];
}

export interface SVGDocument {
  size: Vector2;
  nodes: SVGShape[];
}

export interface SVGDocumentData {
  size: Vector2;
  nodes: SVGShapeData[];
}

interface SVGDiffShape {
  index: number;
  node: SVGShape;
}

interface SVGDiff {
  fromSize: Vector2;
  toSize: Vector2;
  inserted: Array<SVGDiffShape>;
  deleted: Array<SVGDiffShape>;
  transformed: Array<{
    insert: boolean;
    deleted: boolean;
    from: SVGDiffShape;
    to: SVGDiffShape;
  }>;
}

export interface SVGProps extends ShapeProps {
  svg?: SignalValue<string>;
}

export class SVG extends Shape {
  @lazy(() => {
    const element = document.createElement('div');
    View2D.shadowRoot.appendChild(element);
    return element;
  })
  protected static containerElement: HTMLDivElement;
  private static svgNodesPool: Record<string, SVGDocumentData> = {};
  @signal()
  public declare readonly svg: SimpleSignal<string, this>;
  public wrapper: Node;

  public constructor(props: SVGProps) {
    super(props);
    this.wrapper = new Node({});
    this.wrapper.children(this.documentNodes);
    this.add(this.wrapper);
  }

  protected override desiredSize(): SerializedVector2<DesiredLength> {
    const custom = super.desiredSize();
    const {x, y} = this.document().size.mul(this.wrapper.scale());
    return {
      x: custom.x ?? x,
      y: custom.y ?? y,
    };
  }

  @computed()
  private document() {
    return this.parseSVG(this.svg());
  }

  @computed()
  private documentNodes() {
    return this.document().nodes.map(node => node.shape);
  }

  protected buildDocument(data: SVGDocumentData): SVGDocument {
    return {
      size: data.size,
      nodes: data.nodes.map(ch => this.buildShape(ch)),
    };
  }

  protected buildShape({id, type, props, children}: SVGShapeData): SVGShape {
    return {
      id,
      shape: new type({
        children: children?.map(ch => this.buildShape(ch).shape),
        ...this.processElementStyle(props),
      }),
    };
  }

  private static processSVGColor(
    color: SignalValue<PossibleCanvasStyle> | undefined,
  ): SignalValue<PossibleCanvasStyle> | undefined {
    if (color === 'transparent' || color === 'none')
      return {
        r: 0,
        g: 0,
        b: 0,
        a: 0,
      };

    return color;
  }

  private processElementStyle({fill, stroke, ...rest}: ShapeProps): ShapeProps {
    return {
      fill: fill === 'currentColor' ? this.fill : SVG.processSVGColor(fill),
      stroke:
        stroke === 'currentColor' ? this.stroke : SVG.processSVGColor(stroke),
      ...rest,
    };
  }

  protected parseSVG(svg: string): SVGDocument {
    return this.buildDocument(SVG.parseSVGData(svg));
  }

  protected static parseSVGData(svg: string) {
    const cached = SVG.svgNodesPool[svg];
    if (cached && (cached.size.x > 0 || cached.size.y > 0)) return cached;

    SVG.containerElement.innerHTML = svg;

    const svgRoot = SVG.containerElement.querySelector('svg')!;
    let viewBox: BBox = new BBox();
    let size: Vector2 = new Vector2();

    const hasViewBox = svgRoot.hasAttribute('viewBox');
    const hasSize =
      svgRoot.hasAttribute('width') || svgRoot.hasAttribute('height');

    if (hasViewBox) {
      const {x, y, width, height} = svgRoot.viewBox.baseVal;
      viewBox = new BBox(x, y, width, height);

      if (!hasSize) size = viewBox.size;
    }

    if (hasSize) {
      size = new Vector2(
        svgRoot.width.baseVal.value,
        svgRoot.height.baseVal.value,
      );

      if (!hasViewBox) viewBox = new BBox(0, 0, size.width, size.height);
    }

    if (!hasViewBox && !hasSize) {
      viewBox = new BBox(svgRoot.getBBox());
      size = viewBox.size;
    }

    const scale = size.div(viewBox.size);
    const center = viewBox.center;

    const rootTransform = new DOMMatrix()
      .scaleSelf(scale.x, scale.y)
      .translateSelf(-center.x, -center.y);

    const nodes = Array.from(
      SVG.extractGroupNodes(svgRoot, svgRoot, rootTransform, {}),
    );
    const builder: SVGDocumentData = {
      size,
      nodes,
    };
    SVG.svgNodesPool[svg] = builder;
    return builder;
  }

  private static getElementTransformation(
    element: SVGGraphicsElement,
    parentTransform: DOMMatrix,
  ) {
    const transform = element.transform.baseVal.consolidate();
    const transformMatrix = (
      transform ? parentTransform.multiply(transform.matrix) : parentTransform
    ).translate(
      SVG.parseNumberAttribute(element, 'x'),
      SVG.parseNumberAttribute(element, 'y'),
    );
    return transformMatrix;
  }

  private static getElementStyle(
    element: SVGGraphicsElement,
    inheritedStyle: ShapeProps,
  ): ShapeProps {
    return {
      fill: element.getAttribute('fill') ?? inheritedStyle.fill,
      stroke: element.getAttribute('stroke') ?? inheritedStyle.stroke,
      lineWidth: element.hasAttribute('stroke-width')
        ? parseFloat(element.getAttribute('stroke-width')!)
        : inheritedStyle.lineWidth,
      layout: false,
    };
  }

  protected static getMatrixTransformation(transform: DOMMatrix): ShapeProps {
    const position = {
      x: transform.m41,
      y: transform.m42,
    };
    const rotation = (Math.atan2(transform.m12, transform.m11) * 180) / Math.PI;
    const scale = {
      x: Vector2.magnitude(transform.m11, transform.m12),
      y: Vector2.magnitude(transform.m21, transform.m22),
    };
    const determinant =
      transform.m11 * transform.m22 - transform.m12 * transform.m21;
    if (determinant < 0) {
      if (transform.m11 < transform.m22) scale.x = -scale.x;
      else scale.y = -scale.y;
    }
    return {
      position,
      rotation,
      scale,
    };
  }

  private static *extractGroupNodes(
    element: SVGElement,
    svgRoot: Element,
    parentTransform: DOMMatrix,
    inheritedStyle: ShapeProps,
  ): Generator<SVGShapeData> {
    for (const child of element.children) {
      if (!(child instanceof SVGGraphicsElement)) continue;

      yield* this.extractElementNodes(
        child,
        svgRoot,
        parentTransform,
        inheritedStyle,
      );
    }
  }

  private static parseNumberAttribute(
    element: SVGElement,
    name: string,
  ): number {
    return parseFloat(element.getAttribute(name) ?? '0');
  }

  private static *extractElementNodes(
    child: SVGGraphicsElement,
    svgRoot: Element,
    parentTransform: DOMMatrix,
    inheritedStyle: ShapeProps,
  ): Generator<SVGShapeData> {
    const transformMatrix = SVG.getElementTransformation(
      child,
      parentTransform,
    );
    const style = SVG.getElementStyle(child, inheritedStyle);
    const id = child.id ?? '';
    if (child.tagName == 'g')
      yield* SVG.extractGroupNodes(child, svgRoot, transformMatrix, style);
    else if (child.tagName == 'use') {
      const hrefElement = svgRoot.querySelector(
        (child as SVGUseElement).href.baseVal,
      )!;
      if (!(hrefElement instanceof SVGGraphicsElement)) return;

      yield* SVG.extractElementNodes(
        hrefElement,
        svgRoot,
        transformMatrix,
        inheritedStyle,
      );
    } else if (child.tagName == 'path') {
      const data = child.getAttribute('d');
      if (!data) {
        useLogger().warn('blank path data at ' + child.id);
        return;
      }
      const transformation = transformMatrix;
      yield {
        id: id || 'path',
        type: Path as new (props: NodeProps) => Node,
        props: {
          data,
          tweenAlignPath: true,
          ...SVG.getMatrixTransformation(transformation),
          ...style,
        } as PathProps,
      };
    } else if (child.tagName == 'rect') {
      const width = SVG.parseNumberAttribute(child, 'width');
      const height = SVG.parseNumberAttribute(child, 'height');
      const rx = SVG.parseNumberAttribute(child, 'rx');
      const ry = SVG.parseNumberAttribute(child, 'ry');

      const bbox = new BBox(0, 0, width, height);
      const center = bbox.center;
      const transformation = transformMatrix.translate(center.x, center.y);

      yield {
        id: id || 'rect',
        type: Rect,
        props: {
          width,
          height,
          radius: [rx, ry],
          ...SVG.getMatrixTransformation(transformation),
          ...style,
        } as RectProps,
      };
    } else if (['circle', 'ellipse'].includes(child.tagName)) {
      const cx = SVG.parseNumberAttribute(child, 'cx');
      const cy = SVG.parseNumberAttribute(child, 'cy');
      const size: PossibleSpacing =
        child.tagName === 'circle'
          ? SVG.parseNumberAttribute(child, 'r') * 2
          : [
              SVG.parseNumberAttribute(child, 'rx') * 2,
              SVG.parseNumberAttribute(child, 'ry') * 2,
            ];

      const transformation = transformMatrix.translate(cx, cy);

      yield {
        id: id || child.tagName,
        type: Circle,
        props: {
          size,
          ...style,
          ...SVG.getMatrixTransformation(transformation),
        } as CircleProps,
      };
    } else if (['line', 'polyline', 'polygon'].includes(child.tagName)) {
      const numbers =
        child.tagName === 'line'
          ? ['x1', 'y1', 'x2', 'y2'].map(attr =>
              SVG.parseNumberAttribute(child, attr),
            )
          : child
              .getAttribute('points')!
              .match(/-?[\d.e+-]+/g)!
              .map(value => parseFloat(value));
      const points = numbers.reduce<number[][]>((accum, current) => {
        let last = accum.at(-1);
        if (!last || last.length == 2) {
          last = [];
          accum.push(last);
        }
        last.push(current);
        return accum;
      }, []);

      if (child.tagName === 'polygon') points.push(points[0]);

      yield {
        id: id || child.tagName,
        type: Line as unknown as new (props: NodeProps) => Node,
        props: {
          points,
          ...style,
          ...SVG.getMatrixTransformation(transformMatrix),
        } as LineProps,
      };
    } else if (child.tagName === 'image') {
      const x = SVG.parseNumberAttribute(child, 'x');
      const y = SVG.parseNumberAttribute(child, 'y');
      const width = SVG.parseNumberAttribute(child, 'width');
      const height = SVG.parseNumberAttribute(child, 'height');
      const href = child.getAttribute('href') ?? '';

      const bbox = new BBox(x, y, width, height);
      const center = bbox.center;
      const transformation = transformMatrix.translate(center.x, center.y);

      yield {
        id: id || child.tagName,
        type: Img,
        props: {
          src: href,
          ...style,
          ...SVG.getMatrixTransformation(transformation),
        } as ImgProps,
      };
    }
  }

  private getShapeMap(svg: SVGDocument) {
    const map: Record<string, SVGDiffShape[]> = {};
    for (const [index, node] of svg.nodes.entries()) {
      if (!map[node.id]) map[node.id] = [];

      map[node.id].push({index, node});
    }
    return map;
  }

  private diffSVG(from: SVGDocument, to: SVGDocument): SVGDiff {
    const diff: SVGDiff = {
      fromSize: from.size,
      toSize: to.size,
      inserted: [],
      deleted: [],
      transformed: [],
    };

    const fromMap = this.getShapeMap(from);
    const fromKeys = Object.keys(fromMap);
    const toMap = this.getShapeMap(to);
    const toKeys = Object.keys(toMap);

    while (fromKeys.length > 0) {
      const key = fromKeys.pop()!;
      const fromItem = fromMap[key];
      const toIndex = toKeys.indexOf(key);
      if (toIndex >= 0) {
        toKeys.splice(toIndex, 1);
        const toItem = toMap[key];

        for (let i = 0; i < Math.max(fromItem.length, toItem.length); i++) {
          const insert = i >= fromItem.length;
          const deleted = i >= toItem.length;

          const fromNode =
            i < fromItem.length ? fromItem[i] : fromItem[fromItem.length - 1];
          const toNode =
            i < toItem.length ? toItem[i] : toItem[toItem.length - 1];

          diff.transformed.push({
            insert,
            deleted,
            from: fromNode,
            to: toNode,
          });
        }
      } else {
        for (const node of fromItem) {
          diff.deleted.push(node);
        }
      }
    }

    if (toKeys.length > 0) {
      for (const key of toKeys) {
        for (const node of toMap[key]) {
          diff.inserted.push(node);
        }
      }
    }

    return diff;
  }

  private cloneNodeExact(node: Node) {
    const props: ShapeProps = {
      position: node.position(),
      scale: node.scale(),
      rotation: node.rotation(),
      children: node.children().map(child => this.cloneNodeExact(child)),
    };
    if (node instanceof Layout) {
      props.size = node.size();
    }
    return node.clone(props);
  }

  protected *generateTransformator(
    from: Node,
    to: Node,
    time: number,
    timing: TimingFunction,
  ): Generator<ThreadGenerator> {
    yield from.position(to.position(), time, timing);
    yield from.scale(to.scale(), time, timing);
    yield from.rotation(to.rotation(), time, timing);
    if (from instanceof Path && to instanceof Path && from.data() !== to.data())
      yield from.data(to.data(), time, timing);
    if (from instanceof Layout && to instanceof Layout)
      yield from.size(to.size(), time, timing);
    if (from instanceof Shape && to instanceof Shape) {
      yield from.fill(to.fill(), time, timing);
      yield from.stroke(to.stroke(), time, timing);
      yield from.lineWidth(to.lineWidth(), time, timing);
    }

    const fromChildren = from.children();
    const toChildren = to.children();
    for (let i = 0; i < fromChildren.length; i++) {
      yield* this.generateTransformator(
        fromChildren[i],
        toChildren[i],
        time,
        timing,
      );
    }
  }

  private useTweenInitialNodes(diff: SVGDiff) {
    const insertedList: SVGDiff['transformed'] = [];
    for (const item of diff.transformed) {
      if (!item.insert) continue;

      const from = item.from;
      item.from = {
        index: from.index,
        node: {
          id: from.node.id,
          shape: this.cloneNodeExact(from.node.shape),
        },
      };
      insertedList.push(item);
    }

    const newChildren = this.wrapper.children().slice(0);
    let insertShift = 0;

    for (const {from} of insertedList.sort(
      (a, b) => a.from.index - b.from.index,
    )) {
      newChildren.splice(from.index + insertShift, 0, from.node.shape);
      from.node.shape.parent(this.wrapper);
      insertShift++;
    }

    this.wrapper.children(newChildren);
  }

  private useTweenFinalNodes(diff: SVGDiff, newSVG: SVGDocument) {
    const newChildren: Node[] = new Array(newSVG.nodes.length);
    const deletedList: SVGDiff['transformed'] = [];

    for (const item of diff.transformed) {
      const {from, to, deleted} = item;
      if (deleted) {
        deletedList.push(item);
        continue;
      }
      newChildren[to.index] = from.node.shape;
      from.node.shape.parent(this.wrapper);
    }
    for (const {node, index} of diff.inserted) {
      newChildren[index] = node.shape;
      node.shape.parent(this.wrapper);
    }

    let insertShift = 0;
    for (const {from, to} of deletedList.sort(
      (a, b) => a.to.index - b.to.index,
    )) {
      newChildren.splice(to.index + insertShift, 0, from.node.shape);
      from.node.shape.parent(this.wrapper);
      insertShift++;
    }

    this.wrapper.children(newChildren);
  }

  @threadable()
  protected *tweenSvg(
    value: SignalValue<string>,
    time: number,
    timingFunction: TimingFunction,
  ) {
    const newValue = typeof value == 'string' ? value : value();
    const newSVG = this.parseSVG(newValue);
    const diff = this.diffSVG(this.document(), newSVG);

    const beginning = 0.2;
    const ending = 0.8;
    const overlap = 0.15;

    const transformator: ThreadGenerator[] = [];
    const transformatorTime = (ending - beginning) * time;
    const transformatorDelay = beginning * time;

    this.useTweenInitialNodes(diff);

    for (const transformed of diff.transformed) {
      transformator.push(
        ...this.generateTransformator(
          transformed.from.node.shape,
          transformed.to.node.shape,
          transformatorTime,
          timingFunction,
        ),
      );
    }

    let reordered = false;
    const reorder = () => {
      if (reordered) return;
      this.useTweenFinalNodes(diff, newSVG);
      reordered = true;
    };

    const autoWidth = this.customWidth() == null;
    const autoHeight = this.customHeight() == null;

    const baseTween = tween(
      time,
      value => {
        const progress = timingFunction(value);
        const remapped = clampRemap(beginning, ending, 0, 1, progress);

        if (remapped >= 0.5) reorder();

        const scale = this.wrapper.scale();
        if (autoWidth)
          this.customWidth(
            easeInOutSine(remapped, diff.fromSize.x, diff.toSize.x) * scale.x,
          );

        if (autoHeight)
          this.customHeight(
            easeInOutSine(remapped, diff.fromSize.y, diff.toSize.y) * scale.y,
          );

        const deletedOpacity = clampRemap(
          0,
          beginning + overlap,
          1,
          0,
          progress,
        );
        for (const {node} of diff.deleted) node.shape.opacity(deletedOpacity);

        const insertedOpacity = clampRemap(ending - overlap, 1, 0, 1, progress);
        for (const {node} of diff.inserted) node.shape.opacity(insertedOpacity);
      },
      () => {
        this.wrapper.children(this.documentNodes);
        if (autoWidth) this.customWidth(null);
        if (autoHeight) this.customHeight(null);

        for (const {node} of diff.deleted) node.shape.dispose();
        for (const {from, to} of diff.transformed) {
          from.node.shape.dispose();
          to.node.shape.dispose();
        }
      },
    );
    yield* all(baseTween, delay(transformatorDelay, all(...transformator)));
  }
}