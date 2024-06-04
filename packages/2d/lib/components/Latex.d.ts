import { SerializedVector2, Signal, SignalValue, SimpleSignal, Vector2 } from '@motion-canvas/core';
import { TimingFunction } from '@motion-canvas/core/lib/tweening';
import { OptionList } from 'mathjax-full/js/util/Options';
import { SVGDocument, SVG as SVGNode, SVGProps } from './SVG';
export interface LatexProps extends Omit<SVGProps, 'svg'> {
    tex?: SignalValue<string[] | string>;
    renderProps?: SignalValue<OptionList>;
}
export declare class Latex extends SVGNode {
    private static containerFontSize;
    private static svgContentsPool;
    private static texNodesPool;
    private svgSubTexMap;
    readonly options: SimpleSignal<OptionList, this>;
    readonly tex: Signal<string[] | string, string[], this>;
    constructor(props: LatexProps);
    protected calculateWrapperScale(documentSize: Vector2, parentSize: SerializedVector2<number | null>): Vector2;
    protected latexSVG(): string;
    protected subtexsToLatex(subtexs: string[]): string;
    private getNodeCharacterId;
    protected parseSVG(svg: string): SVGDocument;
    private texToSvg;
    private subTexToSVG;
    private singleTexToSVG;
    protected tweenTex(value: string[], time: number, timingFunction: TimingFunction): Generator<void | import("@motion-canvas/core").ThreadGenerator | Promise<any> | import("@motion-canvas/core").Promisable<any>, void, any>;
}
//# sourceMappingURL=Latex.d.ts.map