var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Node_1;
import { BBox, DependencyContext, UNIFORM_DESTINATION_MATRIX, UNIFORM_SOURCE_MATRIX, UNIFORM_TIME, Vector2, all, clamp, createSignal, easeInOutCubic, isReactive, modify, threadable, transformAngle, transformScalar, unwrap, useLogger, } from '@motion-canvas/core';
import { NODE_NAME, cloneable, colorSignal, computed, getPropertiesOf, initial, initializeSignals, inspectable, nodeName, parser, signal, vector2Signal, wrapper, } from '../decorators';
import { filtersSignal } from '../decorators/filtersSignal';
import { spacingSignal } from '../decorators/spacingSignal';
import { parseShader, } from '../partials/ShaderConfig';
import { useScene2D } from '../scenes/useScene2D';
import { drawLine } from '../utils';
let Node = Node_1 = class Node {
    get x() {
        return this.position.x;
    }
    get y() {
        return this.position.y;
    }
    getAbsolutePosition() {
        return new Vector2(this.parentToWorld().transformPoint(this.position()));
    }
    setAbsolutePosition(value) {
        this.position(modify(value, unwrapped => new Vector2(unwrapped).transformAsPoint(this.worldToParent())));
    }
    getAbsoluteRotation() {
        const matrix = this.localToWorld();
        return Vector2.degrees(matrix.m11, matrix.m12);
    }
    setAbsoluteRotation(value) {
        this.rotation(modify(value, unwrapped => transformAngle(unwrapped, this.worldToParent())));
    }
    getAbsoluteScale() {
        const matrix = this.localToWorld();
        return new Vector2(Vector2.magnitude(matrix.m11, matrix.m12), Vector2.magnitude(matrix.m21, matrix.m22));
    }
    setAbsoluteScale(value) {
        this.scale(modify(value, unwrapped => this.getRelativeScale(new Vector2(unwrapped))));
    }
    getRelativeScale(scale) {
        const parentScale = this.parent()?.absoluteScale() ?? Vector2.one;
        return scale.div(parentScale);
    }
    *tweenCompositeOperation(value, time, timingFunction) {
        const nextValue = unwrap(value);
        if (nextValue === 'source-over') {
            yield* this.compositeOverride(1, time, timingFunction);
            this.compositeOverride(0);
            this.compositeOperation(nextValue);
        }
        else {
            this.compositeOperation(nextValue);
            this.compositeOverride(1);
            yield* this.compositeOverride(0, time, timingFunction);
        }
    }
    absoluteOpacity() {
        return (this.parent()?.absoluteOpacity() ?? 1) * this.opacity();
    }
    hasFilters() {
        return !!this.filters().find(filter => filter.isActive());
    }
    hasShadow() {
        return (!!this.shadowColor() &&
            (this.shadowBlur() > 0 ||
                this.shadowOffset.x() !== 0 ||
                this.shadowOffset.y() !== 0));
    }
    filterString() {
        let filters = '';
        const matrix = this.compositeToWorld();
        for (const filter of this.filters()) {
            if (filter.isActive()) {
                filters += ' ' + filter.serialize(matrix);
            }
        }
        return filters;
    }
    getSpawner() {
        return this.children();
    }
    setSpawner(value) {
        this.children(value);
    }
    setChildren(value) {
        if (this.children.context.raw() === value) {
            return;
        }
        this.children.context.setter(value);
        if (!isReactive(value)) {
            this.spawnChildren(false, value);
        }
        else if (!this.hasSpawnedChildren) {
            for (const oldChild of this.realChildren) {
                oldChild.parent(null);
            }
        }
    }
    getChildren() {
        this.children.context.getter();
        return this.spawnedChildren();
    }
    spawnedChildren() {
        const children = this.children.context.getter();
        if (isReactive(this.children.context.raw())) {
            this.spawnChildren(true, children);
        }
        return this.realChildren;
    }
    sortedChildren() {
        return [...this.children()].sort((a, b) => Math.sign(a.zIndex() - b.zIndex()));
    }
    constructor({ children, spawner, key, ...rest }) {
        this.compositeOverride = createSignal(0);
        this.stateStack = [];
        this.realChildren = [];
        this.hasSpawnedChildren = false;
        this.parent = createSignal(null);
        this.properties = getPropertiesOf(this);
        const scene = useScene2D();
        [this.key, this.unregister] = scene.registerNode(this, key);
        this.view2D = scene.getView();
        this.creationStack = new Error().stack;
        initializeSignals(this, rest);
        if (spawner) {
            useLogger().warn({
                message: 'Node.spawner() has been deprecated.',
                remarks: 'Use <code>Node.children()</code> instead.',
                inspect: this.key,
                stack: new Error().stack,
            });
        }
        this.children(spawner ?? children);
    }
    /**
     * Get the local-to-world matrix for this node.
     *
     * @remarks
     * This matrix transforms vectors from local space of this node to world
     * space.
     *
     * @example
     * Calculate the absolute position of a point located 200 pixels to the right
     * of the node:
     * ```ts
     * const local = new Vector2(0, 200);
     * const world = local.transformAsPoint(node.localToWorld());
     * ```
     */
    localToWorld() {
        const parent = this.parent();
        return parent
            ? parent.localToWorld().multiply(this.localToParent())
            : this.localToParent();
    }
    /**
     * Get the world-to-local matrix for this node.
     *
     * @remarks
     * This matrix transforms vectors from world space to local space of this
     * node.
     *
     * @example
     * Calculate the position relative to this node for a point located in the
     * top-left corner of the screen:
     * ```ts
     * const world = new Vector2(0, 0);
     * const local = world.transformAsPoint(node.worldToLocal());
     * ```
     */
    worldToLocal() {
        return this.localToWorld().inverse();
    }
    /**
     * Get the world-to-parent matrix for this node.
     *
     * @remarks
     * This matrix transforms vectors from world space to local space of this
     * node's parent.
     */
    worldToParent() {
        return this.parent()?.worldToLocal() ?? new DOMMatrix();
    }
    /**
     * Get the parent-to-world matrix for this node.
     *
     * @remarks
     * This matrix transforms vectors from local space of this node's parent to
     * world space.
     */
    parentToWorld() {
        return this.parent()?.localToWorld() ?? new DOMMatrix();
    }
    /**
     * Get the local-to-parent matrix for this node.
     *
     * @remarks
     * This matrix transforms vectors from local space of this node to local space
     * of this node's parent.
     */
    localToParent() {
        const matrix = new DOMMatrix();
        matrix.translateSelf(this.x(), this.y());
        matrix.rotateSelf(0, 0, this.rotation());
        matrix.scaleSelf(this.scale.x(), this.scale.y());
        matrix.skewXSelf(this.skew.x());
        matrix.skewYSelf(this.skew.y());
        return matrix;
    }
    /**
     * A matrix mapping composite space to world space.
     *
     * @remarks
     * Certain effects such as blur and shadows ignore the current transformation.
     * This matrix can be used to transform their parameters so that the effect
     * appears relative to the closest composite root.
     */
    compositeToWorld() {
        return this.compositeRoot()?.localToWorld() ?? new DOMMatrix();
    }
    compositeRoot() {
        if (this.composite()) {
            return this;
        }
        return this.parent()?.compositeRoot() ?? null;
    }
    compositeToLocal() {
        const root = this.compositeRoot();
        if (root) {
            const worldToLocal = this.worldToLocal();
            worldToLocal.m44 = 1;
            return root.localToWorld().multiply(worldToLocal);
        }
        return new DOMMatrix();
    }
    view() {
        return this.view2D;
    }
    /**
     * Add the given node(s) as the children of this node.
     *
     * @remarks
     * The nodes will be appended at the end of the children list.
     *
     * @example
     * ```tsx
     * const node = <Layout />;
     * node.add(<Rect />);
     * node.add(<Circle />);
     * ```
     * Result:
     * ```mermaid
     * graph TD;
     *   layout([Layout])
     *   circle([Circle])
     *   rect([Rect])
     *     layout-->rect;
     *     layout-->circle;
     * ```
     *
     * @param node - A node or an array of nodes to append.
     */
    add(node) {
        return this.insert(node, Infinity);
    }
    /**
     * Insert the given node(s) at the specified index in the children list.
     *
     * @example
     * ```tsx
     * const node = (
     *   <Layout>
     *     <Rect />
     *     <Circle />
     *   </Layout>
     * );
     *
     * node.insert(<Txt />, 1);
     * ```
     *
     * Result:
     * ```mermaid
     * graph TD;
     *   layout([Layout])
     *   circle([Circle])
     *   text([Text])
     *   rect([Rect])
     *     layout-->rect;
     *     layout-->text;
     *     layout-->circle;
     * ```
     *
     * @param node - A node or an array of nodes to insert.
     * @param index - An index at which to insert the node(s).
     */
    insert(node, index = 0) {
        const array = Array.isArray(node) ? node : [node];
        if (array.length === 0) {
            return this;
        }
        const children = this.children();
        const newChildren = children.slice(0, index);
        for (const node of array) {
            if (node instanceof Node_1) {
                newChildren.push(node);
                node.remove();
                node.parent(this);
            }
        }
        newChildren.push(...children.slice(index));
        this.setParsedChildren(newChildren);
        return this;
    }
    /**
     * Remove this node from the tree.
     */
    remove() {
        const current = this.parent();
        if (current === null) {
            return this;
        }
        current.removeChild(this);
        this.parent(null);
        return this;
    }
    /**
     * Rearrange this node in relation to its siblings.
     *
     * @remarks
     * Children are rendered starting from the beginning of the children list.
     * We can change the rendering order by rearranging said list.
     *
     * A positive `by` arguments move the node up (it will be rendered on top of
     * the elements it has passed). Negative values move it down.
     *
     * @param by - Number of places by which the node should be moved.
     */
    move(by = 1) {
        const parent = this.parent();
        if (by === 0 || !parent) {
            return this;
        }
        const children = parent.children();
        const newChildren = [];
        if (by > 0) {
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child === this) {
                    const target = i + by;
                    for (; i < target && i + 1 < children.length; i++) {
                        newChildren[i] = children[i + 1];
                    }
                }
                newChildren[i] = child;
            }
        }
        else {
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (child === this) {
                    const target = i + by;
                    for (; i > target && i > 0; i--) {
                        newChildren[i] = children[i - 1];
                    }
                }
                newChildren[i] = child;
            }
        }
        parent.setParsedChildren(newChildren);
        return this;
    }
    /**
     * Move the node up in relation to its siblings.
     *
     * @remarks
     * The node will exchange places with the sibling right above it (if any) and
     * from then on will be rendered on top of it.
     */
    moveUp() {
        return this.move(1);
    }
    /**
     * Move the node down in relation to its siblings.
     *
     * @remarks
     * The node will exchange places with the sibling right below it (if any) and
     * from then on will be rendered under it.
     */
    moveDown() {
        return this.move(-1);
    }
    /**
     * Move the node to the top in relation to its siblings.
     *
     * @remarks
     * The node will be placed at the end of the children list and from then on
     * will be rendered on top of all of its siblings.
     */
    moveToTop() {
        return this.move(Infinity);
    }
    /**
     * Move the node to the bottom in relation to its siblings.
     *
     * @remarks
     * The node will be placed at the beginning of the children list and from then
     * on will be rendered below all of its siblings.
     */
    moveToBottom() {
        return this.move(-Infinity);
    }
    /**
     * Move the node to the provided position relative to its siblings.
     *
     * @remarks
     * If the node is getting moved to a lower position, it will be placed below
     * the sibling that's currently at the provided index (if any).
     * If the node is getting moved to a higher position, it will be placed above
     * the sibling that's currently at the provided index (if any).
     *
     * @param index - The index to move the node to.
     */
    moveTo(index) {
        const parent = this.parent();
        if (!parent) {
            return this;
        }
        const currentIndex = parent.children().indexOf(this);
        const by = index - currentIndex;
        return this.move(by);
    }
    /**
     * Move the node below the provided node in the parent's layout.
     *
     * @remarks
     * The node will be moved below the provided node and from then on will be
     * rendered below it. By default, if the node is already positioned lower than
     * the sibling node, it will not get moved.
     *
     * @param node - The sibling node below which to move.
     * @param directlyBelow - Whether the node should be positioned directly below
     *                        the sibling. When true, will move the node even if
     *                        it is already positioned below the sibling.
     */
    moveBelow(node, directlyBelow = false) {
        const parent = this.parent();
        if (!parent) {
            return this;
        }
        if (node.parent() !== parent) {
            useLogger().error("Cannot position nodes relative to each other if they don't belong to the same parent.");
            return this;
        }
        const children = parent.children();
        const ownIndex = children.indexOf(this);
        const otherIndex = children.indexOf(node);
        if (!directlyBelow && ownIndex < otherIndex) {
            // Nothing to do if the node is already positioned below the target node.
            // We could move the node so it's directly below the sibling node, but
            // that might suddenly move it on top of other nodes. This is likely
            // not what the user wanted to happen when calling this method.
            return this;
        }
        const by = otherIndex - ownIndex - 1;
        return this.move(by);
    }
    /**
     * Move the node above the provided node in the parent's layout.
     *
     * @remarks
     * The node will be moved above the provided node and from then on will be
     * rendered on top of it. By default, if the node is already positioned
     * higher than the sibling node, it will not get moved.
     *
     * @param node - The sibling node below which to move.
     * @param directlyAbove - Whether the node should be positioned directly above the
     *                        sibling. When true, will move the node even if it is
     *                        already positioned above the sibling.
     */
    moveAbove(node, directlyAbove = false) {
        const parent = this.parent();
        if (!parent) {
            return this;
        }
        if (node.parent() !== parent) {
            useLogger().error("Cannot position nodes relative to each other if they don't belong to the same parent.");
            return this;
        }
        const children = parent.children();
        const ownIndex = children.indexOf(this);
        const otherIndex = children.indexOf(node);
        if (!directlyAbove && ownIndex > otherIndex) {
            // Nothing to do if the node is already positioned above the target node.
            // We could move the node so it's directly above the sibling node, but
            // that might suddenly move it below other nodes. This is likely not what
            // the user wanted to happen when calling this method.
            return this;
        }
        const by = otherIndex - ownIndex + 1;
        return this.move(by);
    }
    /**
     * Change the parent of this node while keeping the absolute transform.
     *
     * @remarks
     * After performing this operation, the node will stay in the same place
     * visually, but its parent will be changed.
     *
     * @param newParent - The new parent of this node.
     */
    reparent(newParent) {
        const position = this.absolutePosition();
        const rotation = this.absoluteRotation();
        const scale = this.absoluteScale();
        newParent.add(this);
        this.absolutePosition(position);
        this.absoluteRotation(rotation);
        this.absoluteScale(scale);
        return this;
    }
    /**
     * Remove all children of this node.
     */
    removeChildren() {
        for (const oldChild of this.realChildren) {
            oldChild.parent(null);
        }
        this.setParsedChildren([]);
        return this;
    }
    /**
     * Get the current children of this node.
     *
     * @remarks
     * Unlike {@link children}, this method does not have any side effects.
     * It does not register the `children` signal as a dependency, and it does not
     * spawn any children. It can be used to safely retrieve the current state of
     * the scene graph for debugging purposes.
     */
    peekChildren() {
        return this.realChildren;
    }
    findAll(predicate) {
        const result = [];
        const queue = this.reversedChildren();
        while (queue.length > 0) {
            const node = queue.pop();
            if (predicate(node)) {
                result.push(node);
            }
            const children = node.children();
            for (let i = children.length - 1; i >= 0; i--) {
                queue.push(children[i]);
            }
        }
        return result;
    }
    findFirst(predicate) {
        const queue = this.reversedChildren();
        while (queue.length > 0) {
            const node = queue.pop();
            if (predicate(node)) {
                return node;
            }
            const children = node.children();
            for (let i = children.length - 1; i >= 0; i--) {
                queue.push(children[i]);
            }
        }
        return null;
    }
    findLast(predicate) {
        const search = [];
        const queue = this.reversedChildren();
        while (queue.length > 0) {
            const node = queue.pop();
            search.push(node);
            const children = node.children();
            for (let i = children.length - 1; i >= 0; i--) {
                queue.push(children[i]);
            }
        }
        while (search.length > 0) {
            const node = search.pop();
            if (predicate(node)) {
                return node;
            }
        }
        return null;
    }
    findAncestor(predicate) {
        let parent = this.parent();
        while (parent) {
            if (predicate(parent)) {
                return parent;
            }
            parent = parent.parent();
        }
        return null;
    }
    /**
     * Get the nth children cast to the specified type.
     *
     * @param index - The index of the child to retrieve.
     */
    childAs(index) {
        return this.children()[index] ?? null;
    }
    /**
     * Get the children array cast to the specified type.
     */
    childrenAs() {
        return this.children();
    }
    /**
     * Get the parent cast to the specified type.
     */
    parentAs() {
        return this.parent() ?? null;
    }
    /**
     * Prepare this node to be disposed of.
     *
     * @remarks
     * This method is called automatically when a scene is refreshed. It will
     * be called even if the node is not currently attached to the tree.
     *
     * The goal of this method is to clean any external references to allow the
     * node to be garbage collected.
     */
    dispose() {
        if (!this.unregister) {
            return;
        }
        this.stateStack = [];
        this.unregister();
        this.unregister = null;
        for (const { signal } of this) {
            signal?.context.dispose();
        }
        for (const child of this.realChildren) {
            child.dispose();
        }
    }
    /**
     * Create a copy of this node.
     *
     * @param customProps - Properties to override.
     */
    clone(customProps = {}) {
        const props = { ...customProps };
        if (isReactive(this.children.context.raw())) {
            props.children ?? (props.children = this.children.context.raw());
        }
        else if (this.children().length > 0) {
            props.children ?? (props.children = this.children().map(child => child.clone()));
        }
        for (const { key, meta, signal } of this) {
            if (!meta.cloneable || key in props)
                continue;
            if (meta.compound) {
                for (const [key, property] of meta.compoundEntries) {
                    if (property in props)
                        continue;
                    const component = signal[key];
                    if (!component.context.isInitial()) {
                        props[property] = component.context.raw();
                    }
                }
            }
            else if (!signal.context.isInitial()) {
                props[key] = signal.context.raw();
            }
        }
        return this.instantiate(props);
    }
    /**
     * Create a copy of this node.
     *
     * @remarks
     * Unlike {@link clone}, a snapshot clone calculates any reactive properties
     * at the moment of cloning and passes the raw values to the copy.
     *
     * @param customProps - Properties to override.
     */
    snapshotClone(customProps = {}) {
        const props = {
            ...this.getState(),
            ...customProps,
        };
        if (this.children().length > 0) {
            props.children ?? (props.children = this.children().map(child => child.snapshotClone()));
        }
        return this.instantiate(props);
    }
    /**
     * Create a reactive copy of this node.
     *
     * @remarks
     * A reactive copy has all its properties dynamically updated to match the
     * source node.
     *
     * @param customProps - Properties to override.
     */
    reactiveClone(customProps = {}) {
        const props = { ...customProps };
        if (this.children().length > 0) {
            props.children ?? (props.children = this.children().map(child => child.reactiveClone()));
        }
        for (const { key, meta, signal } of this) {
            if (!meta.cloneable || key in props)
                continue;
            props[key] = () => signal();
        }
        return this.instantiate(props);
    }
    /**
     * Create an instance of this node's class.
     *
     * @param props - Properties to pass to the constructor.
     */
    instantiate(props = {}) {
        return new this.constructor(props);
    }
    /**
     * Set the children without parsing them.
     *
     * @remarks
     * This method assumes that the caller took care of parsing the children and
     * updating the hierarchy.
     *
     * @param value - The children to set.
     */
    setParsedChildren(value) {
        this.children.context.setter(value);
        this.realChildren = value;
    }
    spawnChildren(reactive, children) {
        const parsedChildren = this.parseChildren(children);
        const keep = new Set();
        for (const newChild of parsedChildren) {
            const current = newChild.parent.context.raw();
            if (current && current !== this) {
                current.removeChild(newChild);
            }
            keep.add(newChild.key);
            newChild.parent(this);
        }
        for (const oldChild of this.realChildren) {
            if (!keep.has(oldChild.key)) {
                oldChild.parent(null);
            }
        }
        this.hasSpawnedChildren = reactive;
        this.realChildren = parsedChildren;
    }
    /**
     * Parse any `ComponentChildren` into an array of nodes.
     *
     * @param children - The children to parse.
     */
    parseChildren(children) {
        const result = [];
        const array = Array.isArray(children) ? children : [children];
        for (const child of array) {
            if (child instanceof Node_1) {
                result.push(child);
            }
        }
        return result;
    }
    /**
     * Remove the given child.
     */
    removeChild(child) {
        this.setParsedChildren(this.children().filter(node => node !== child));
    }
    /**
     * Whether this node should be cached or not.
     */
    requiresCache() {
        return (this.cache() ||
            this.opacity() < 1 ||
            this.compositeOperation() !== 'source-over' ||
            this.hasFilters() ||
            this.hasShadow() ||
            this.shaders().length > 0);
    }
    cacheCanvas() {
        const canvas = document.createElement('canvas').getContext('2d');
        if (!canvas) {
            throw new Error('Could not create a cache canvas');
        }
        return canvas;
    }
    /**
     * Get a cache canvas with the contents of this node rendered onto it.
     */
    cachedCanvas() {
        const context = this.cacheCanvas();
        const cache = this.worldSpaceCacheBBox();
        const matrix = this.localToWorld();
        context.canvas.width = cache.width;
        context.canvas.height = cache.height;
        context.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e - cache.x, matrix.f - cache.y);
        this.draw(context);
        return context;
    }
    /**
     * Get a bounding box for the contents rendered by this node.
     *
     * @remarks
     * The returned bounding box should be in local space.
     */
    getCacheBBox() {
        return new BBox();
    }
    /**
     * Get a bounding box for the contents rendered by this node as well
     * as its children.
     */
    cacheBBox() {
        const cache = this.getCacheBBox();
        const children = this.children();
        const padding = this.cachePadding();
        if (children.length === 0) {
            return cache.addSpacing(padding);
        }
        const points = cache.corners;
        for (const child of children) {
            const childCache = child.fullCacheBBox();
            const childMatrix = child.localToParent();
            points.push(...childCache.corners.map(r => r.transformAsPoint(childMatrix)));
        }
        const bbox = BBox.fromPoints(...points);
        return bbox.addSpacing(padding);
    }
    /**
     * Get a bounding box for the contents rendered by this node (including
     * effects applied after caching).
     *
     * @remarks
     * The returned bounding box should be in local space.
     */
    fullCacheBBox() {
        const matrix = this.compositeToLocal();
        const shadowOffset = this.shadowOffset().transform(matrix);
        const shadowBlur = transformScalar(this.shadowBlur(), matrix);
        const result = this.cacheBBox().expand(this.filters.blur() * 2 + shadowBlur);
        if (shadowOffset.x < 0) {
            result.x += shadowOffset.x;
            result.width -= shadowOffset.x;
        }
        else {
            result.width += shadowOffset.x;
        }
        if (shadowOffset.y < 0) {
            result.y += shadowOffset.y;
            result.height -= shadowOffset.y;
        }
        else {
            result.height += shadowOffset.y;
        }
        return result;
    }
    /**
     * Get a bounding box in world space for the contents rendered by this node as
     * well as its children.
     *
     * @remarks
     * This is the same the bounding box returned by {@link cacheBBox} only
     * transformed to world space.
     */
    worldSpaceCacheBBox() {
        const viewBBox = BBox.fromSizeCentered(this.view().size()).expand(this.view().cachePadding());
        const canvasBBox = BBox.fromPoints(...viewBBox.transformCorners(this.view().localToWorld()));
        const cacheBBox = BBox.fromPoints(...this.cacheBBox().transformCorners(this.localToWorld())).pixelPerfect.expand(2);
        return canvasBBox.intersection(cacheBBox);
    }
    parentWorldSpaceCacheBBox() {
        return (this.findAncestor(node => node.requiresCache())?.worldSpaceCacheBBox() ??
            new BBox(Vector2.zero, useScene2D().getRealSize()));
    }
    /**
     * Prepare the given context for drawing a cached node onto it.
     *
     * @remarks
     * This method is called before the contents of the cache canvas are drawn
     * on the screen. It can be used to apply effects to the entire node together
     * with its children, instead of applying them individually.
     * Effects such as transparency, shadows, and filters use this technique.
     *
     * Whether the node is cached is decided by the {@link requiresCache} method.
     *
     * @param context - The context using which the cache will be drawn.
     */
    setupDrawFromCache(context) {
        context.globalCompositeOperation = this.compositeOperation();
        context.globalAlpha *= this.opacity();
        if (this.hasFilters()) {
            context.filter = this.filterString();
        }
        if (this.hasShadow()) {
            const matrix = this.compositeToWorld();
            const offset = this.shadowOffset().transform(matrix);
            const blur = transformScalar(this.shadowBlur(), matrix);
            context.shadowColor = this.shadowColor().serialize();
            context.shadowBlur = blur;
            context.shadowOffsetX = offset.x;
            context.shadowOffsetY = offset.y;
        }
        const matrix = this.worldToLocal();
        context.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
    }
    renderFromSource(context, source, x, y) {
        this.setupDrawFromCache(context);
        const compositeOverride = this.compositeOverride();
        context.drawImage(source, x, y);
        if (compositeOverride > 0) {
            context.save();
            context.globalAlpha *= compositeOverride;
            context.globalCompositeOperation = 'source-over';
            context.drawImage(source, x, y);
            context.restore();
        }
    }
    shaderCanvas(destination, source) {
        const shaders = this.shaders();
        if (shaders.length === 0) {
            return null;
        }
        const scene = useScene2D();
        const size = scene.getRealSize();
        const parentCacheRect = this.parentWorldSpaceCacheBBox();
        const cameraToWorld = new DOMMatrix()
            .scaleSelf(size.width / parentCacheRect.width, size.height / -parentCacheRect.height)
            .translateSelf(parentCacheRect.x / -size.width, parentCacheRect.y / size.height - 1);
        const cacheRect = this.worldSpaceCacheBBox();
        const cameraToCache = new DOMMatrix()
            .scaleSelf(size.width / cacheRect.width, size.height / -cacheRect.height)
            .translateSelf(cacheRect.x / -size.width, cacheRect.y / size.height - 1)
            .invertSelf();
        const gl = scene.shaders.getGL();
        scene.shaders.copyTextures(destination, source);
        scene.shaders.clear();
        for (const shader of shaders) {
            const program = scene.shaders.getProgram(shader.fragment);
            if (!program) {
                continue;
            }
            if (shader.uniforms) {
                for (const [name, uniform] of Object.entries(shader.uniforms)) {
                    const location = gl.getUniformLocation(program, name);
                    if (location === null) {
                        continue;
                    }
                    const value = unwrap(uniform);
                    if (typeof value === 'number') {
                        gl.uniform1f(location, value);
                    }
                    else if ('toUniform' in value) {
                        value.toUniform(gl, location);
                    }
                    else if (value.length === 1) {
                        gl.uniform1f(location, value[0]);
                    }
                    else if (value.length === 2) {
                        gl.uniform2f(location, value[0], value[1]);
                    }
                    else if (value.length === 3) {
                        gl.uniform3f(location, value[0], value[1], value[2]);
                    }
                    else if (value.length === 4) {
                        gl.uniform4f(location, value[0], value[1], value[2], value[3]);
                    }
                }
            }
            gl.uniform1f(gl.getUniformLocation(program, UNIFORM_TIME), this.view2D.globalTime());
            gl.uniform1i(gl.getUniformLocation(program, UNIFORM_TIME), scene.playback.frame);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, UNIFORM_SOURCE_MATRIX), false, cameraToCache.toFloat32Array());
            gl.uniformMatrix4fv(gl.getUniformLocation(program, UNIFORM_DESTINATION_MATRIX), false, cameraToWorld.toFloat32Array());
            shader.setup?.(gl, program);
            scene.shaders.render();
            shader.teardown?.(gl, program);
        }
        return gl.canvas;
    }
    /**
     * Render this node onto the given canvas.
     *
     * @param context - The context to draw with.
     */
    render(context) {
        if (this.absoluteOpacity() <= 0) {
            return;
        }
        context.save();
        this.transformContext(context);
        if (this.requiresCache()) {
            const cacheRect = this.worldSpaceCacheBBox();
            if (cacheRect.width !== 0 && cacheRect.height !== 0) {
                const cache = this.cachedCanvas().canvas;
                const source = this.shaderCanvas(context.canvas, cache);
                if (source) {
                    this.renderFromSource(context, source, 0, 0);
                }
                else {
                    this.renderFromSource(context, cache, cacheRect.position.x, cacheRect.position.y);
                }
            }
        }
        else {
            this.draw(context);
        }
        context.restore();
    }
    /**
     * Draw this node onto the canvas.
     *
     * @remarks
     * This method is used when drawing directly onto the screen as well as onto
     * the cache canvas.
     * It assumes that the context have already been transformed to local space.
     *
     * @param context - The context to draw with.
     */
    draw(context) {
        this.drawChildren(context);
    }
    drawChildren(context) {
        for (const child of this.sortedChildren()) {
            child.render(context);
        }
    }
    /**
     * Draw an overlay for this node.
     *
     * @remarks
     * The overlay for the currently inspected node is displayed on top of the
     * canvas.
     *
     * The provided context is in screen space. The local-to-screen matrix can be
     * used to transform all shapes that need to be displayed.
     * This approach allows to keep the line widths and gizmo sizes consistent,
     * no matter how zoomed-in the view is.
     *
     * @param context - The context to draw with.
     * @param matrix - A local-to-screen matrix.
     */
    drawOverlay(context, matrix) {
        const box = this.cacheBBox().transformCorners(matrix);
        const cache = this.getCacheBBox().transformCorners(matrix);
        context.strokeStyle = 'white';
        context.lineWidth = 1;
        context.beginPath();
        drawLine(context, box);
        context.closePath();
        context.stroke();
        context.strokeStyle = 'blue';
        context.beginPath();
        drawLine(context, cache);
        context.closePath();
        context.stroke();
    }
    transformContext(context) {
        const matrix = this.localToParent();
        context.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
    }
    /**
     * Try to find a node intersecting the given position.
     *
     * @param position - The searched position.
     */
    hit(position) {
        let hit = null;
        const local = position.transformAsPoint(this.localToParent().inverse());
        const children = this.children();
        for (let i = children.length - 1; i >= 0; i--) {
            hit = children[i].hit(local);
            if (hit) {
                break;
            }
        }
        return hit;
    }
    /**
     * Collect all asynchronous resources used by this node.
     */
    collectAsyncResources() {
        for (const child of this.children()) {
            child.collectAsyncResources();
        }
    }
    /**
     * Wait for any asynchronous resources that this node or its children have.
     *
     * @remarks
     * Certain resources like images are always loaded asynchronously.
     * Awaiting this method makes sure that all such resources are done loading
     * before continuing the animation.
     */
    async toPromise() {
        do {
            await DependencyContext.consumePromises();
            this.collectAsyncResources();
        } while (DependencyContext.hasPromises());
        return this;
    }
    /**
     * Return a snapshot of the node's current signal values.
     *
     * @remarks
     * This method will calculate the values of any reactive properties of the
     * node at the time the method is called.
     */
    getState() {
        const state = {};
        for (const { key, meta, signal } of this) {
            if (!meta.cloneable || key in state)
                continue;
            state[key] = signal();
        }
        return state;
    }
    applyState(state, duration, timing = easeInOutCubic) {
        if (duration === undefined) {
            for (const key in state) {
                const signal = this.signalByKey(key);
                if (signal) {
                    signal(state[key]);
                }
            }
        }
        const tasks = [];
        for (const key in state) {
            const signal = this.signalByKey(key);
            if (state[key] !== signal.context.raw()) {
                tasks.push(signal(state[key], duration, timing));
            }
        }
        return all(...tasks);
    }
    /**
     * Push a snapshot of the node's current state onto the node's state stack.
     *
     * @remarks
     * This method can be used together with the {@link restore} method to save a
     * node's current state and later restore it. It is possible to store more
     * than one state by calling `save` method multiple times.
     */
    save() {
        this.stateStack.push(this.getState());
    }
    restore(duration, timing = easeInOutCubic) {
        const state = this.stateStack.pop();
        if (state !== undefined) {
            return this.applyState(state, duration, timing);
        }
    }
    *[Symbol.iterator]() {
        for (const key in this.properties) {
            const meta = this.properties[key];
            const signal = this.signalByKey(key);
            yield { meta, signal, key };
        }
    }
    signalByKey(key) {
        return this[key];
    }
    reversedChildren() {
        const children = this.children();
        const result = [];
        for (let i = children.length - 1; i >= 0; i--) {
            result.push(children[i]);
        }
        return result;
    }
};
__decorate([
    vector2Signal()
], Node.prototype, "position", void 0);
__decorate([
    wrapper(Vector2),
    cloneable(false),
    signal()
], Node.prototype, "absolutePosition", void 0);
__decorate([
    initial(0),
    signal()
], Node.prototype, "rotation", void 0);
__decorate([
    cloneable(false),
    signal()
], Node.prototype, "absoluteRotation", void 0);
__decorate([
    initial(Vector2.one),
    vector2Signal('scale')
], Node.prototype, "scale", void 0);
__decorate([
    initial(Vector2.zero),
    vector2Signal('skew')
], Node.prototype, "skew", void 0);
__decorate([
    wrapper(Vector2),
    cloneable(false),
    signal()
], Node.prototype, "absoluteScale", void 0);
__decorate([
    initial(0),
    signal()
], Node.prototype, "zIndex", void 0);
__decorate([
    initial(false),
    signal()
], Node.prototype, "cache", void 0);
__decorate([
    spacingSignal('cachePadding')
], Node.prototype, "cachePadding", void 0);
__decorate([
    initial(false),
    signal()
], Node.prototype, "composite", void 0);
__decorate([
    initial('source-over'),
    signal()
], Node.prototype, "compositeOperation", void 0);
__decorate([
    threadable()
], Node.prototype, "tweenCompositeOperation", null);
__decorate([
    initial(1),
    parser((value) => clamp(0, 1, value)),
    signal()
], Node.prototype, "opacity", void 0);
__decorate([
    computed()
], Node.prototype, "absoluteOpacity", null);
__decorate([
    filtersSignal()
], Node.prototype, "filters", void 0);
__decorate([
    initial('#0000'),
    colorSignal()
], Node.prototype, "shadowColor", void 0);
__decorate([
    initial(0),
    signal()
], Node.prototype, "shadowBlur", void 0);
__decorate([
    vector2Signal('shadowOffset')
], Node.prototype, "shadowOffset", void 0);
__decorate([
    initial([]),
    parser(parseShader),
    signal()
], Node.prototype, "shaders", void 0);
__decorate([
    computed()
], Node.prototype, "hasFilters", null);
__decorate([
    computed()
], Node.prototype, "hasShadow", null);
__decorate([
    computed()
], Node.prototype, "filterString", null);
__decorate([
    inspectable(false),
    cloneable(false),
    signal()
], Node.prototype, "spawner", void 0);
__decorate([
    inspectable(false),
    cloneable(false),
    signal()
], Node.prototype, "children", void 0);
__decorate([
    computed()
], Node.prototype, "spawnedChildren", null);
__decorate([
    computed()
], Node.prototype, "sortedChildren", null);
__decorate([
    computed()
], Node.prototype, "localToWorld", null);
__decorate([
    computed()
], Node.prototype, "worldToLocal", null);
__decorate([
    computed()
], Node.prototype, "worldToParent", null);
__decorate([
    computed()
], Node.prototype, "parentToWorld", null);
__decorate([
    computed()
], Node.prototype, "localToParent", null);
__decorate([
    computed()
], Node.prototype, "compositeToWorld", null);
__decorate([
    computed()
], Node.prototype, "compositeRoot", null);
__decorate([
    computed()
], Node.prototype, "compositeToLocal", null);
__decorate([
    computed()
], Node.prototype, "cacheCanvas", null);
__decorate([
    computed()
], Node.prototype, "cachedCanvas", null);
__decorate([
    computed()
], Node.prototype, "cacheBBox", null);
__decorate([
    computed()
], Node.prototype, "fullCacheBBox", null);
__decorate([
    computed()
], Node.prototype, "worldSpaceCacheBBox", null);
__decorate([
    computed()
], Node.prototype, "parentWorldSpaceCacheBBox", null);
Node = Node_1 = __decorate([
    nodeName('Node')
], Node);
export { Node };
Node.prototype.isClass = true;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvY29tcG9uZW50cy9Ob2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQSxPQUFPLEVBQ0wsSUFBSSxFQUVKLGlCQUFpQixFQWFqQiwwQkFBMEIsRUFDMUIscUJBQXFCLEVBQ3JCLFlBQVksRUFDWixPQUFPLEVBRVAsR0FBRyxFQUNILEtBQUssRUFDTCxZQUFZLEVBQ1osY0FBYyxFQUNkLFVBQVUsRUFDVixNQUFNLEVBQ04sVUFBVSxFQUNWLGNBQWMsRUFDZCxlQUFlLEVBQ2YsTUFBTSxFQUNOLFNBQVMsR0FDVixNQUFNLHFCQUFxQixDQUFDO0FBQzdCLE9BQU8sRUFDTCxTQUFTLEVBQ1QsU0FBUyxFQUNULFdBQVcsRUFDWCxRQUFRLEVBQ1IsZUFBZSxFQUNmLE9BQU8sRUFDUCxpQkFBaUIsRUFDakIsV0FBVyxFQUNYLFFBQVEsRUFDUixNQUFNLEVBQ04sTUFBTSxFQUNOLGFBQWEsRUFDYixPQUFPLEdBQ1IsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFnQixhQUFhLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUN6RSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFFMUQsT0FBTyxFQUdMLFdBQVcsR0FDWixNQUFNLDBCQUEwQixDQUFDO0FBQ2xDLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNoRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBbUUzQixJQUFNLElBQUksWUFBVixNQUFNLElBQUk7SUF3Q2YsSUFBVyxDQUFDO1FBQ1YsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQStCLENBQUM7SUFDdkQsQ0FBQztJQUNELElBQVcsQ0FBQztRQUNWLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUErQixDQUFDO0lBQ3ZELENBQUM7SUF1QlMsbUJBQW1CO1FBQzNCLE9B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