var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Vector2, useLogger, } from '@motion-canvas/core';
import { lazy, threadable } from '@motion-canvas/core/lib/decorators';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html';
import { TeX } from 'mathjax-full/js/input/tex';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages';
import { mathjax } from 'mathjax-full/js/mathjax';
import { SVG } from 'mathjax-full/js/output/svg';
import { computed, initial, parser, signal } from '../decorators';
import { Node } from './Node';
import { SVG as SVGNode, } from './SVG';
const Adaptor = liteAdaptor();
RegisterHTMLHandler(Adaptor);
const JaxDocument = mathjax.document('', {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    InputJax: new TeX({ packages: AllPackages }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    OutputJax: new SVG({ fontCache: 'local' }),
});
export class Latex extends SVGNode {
    constructor(props) {
        super({
            fontSize: 48,
            ...props,
            svg: '',
        });
        this.svgSubTexMap = {};
        this.svg(this.latexSVG);
    }
    calculateWrapperScale(documentSize, parentSize) {
        if (parentSize.x || parentSize.y) {
            return super.calculateWrapperScale(documentSize, parentSize);
        }
        return new Vector2(this.fontSize() / Latex.containerFontSize);
    }
    latexSVG() {
        return this.texToSvg(this.tex());
    }
    subtexsToLatex(subtexs) {
        return subtexs.join('');
    }
    getNodeCharacterId({ id }) {
        if (!id.includes('-'))
            return id;
        return id.substring(id.lastIndexOf('-') + 1);
    }
    parseSVG(svg) {
        const subtexs = this.svgSubTexMap[svg];
        const key = `[${subtexs.join(',')}]::${JSON.stringify(this.options())}`;
        const cached = Latex.texNodesPool[key];
        if (cached && (cached.size.x > 0 || cached.size.y > 0)) {
            return this.buildDocument(Latex.texNodesPool[key]);
        }
        const oldSVG = SVGNode.parseSVGData(svg);
        const oldNodes = [...oldSVG.nodes];
        const newNodes = [];
        for (const sub of subtexs) {
            const subsvg = this.subTexToSVG(sub);
            const subnodes = SVGNode.parseSVGData(subsvg).nodes;
            const firstId = this.getNodeCharacterId(subnodes[0]);
            const spliceIndex = oldNodes.findIndex(node => this.getNodeCharacterId(node) === firstId);
            const children = oldNodes.splice(spliceIndex, subnodes.length);
            if (children.length === 1) {
                newNodes.push({
                    ...children[0],
                    id: sub,
                });
                continue;
            }
            newNodes.push({
                id: sub,
                type: Node,
                props: {},
                children,
            });
        }
        if (oldNodes.length > 0) {
            useLogger().error('matching between Latex SVG and subtex failed');
        }
        const newSVG = {
            size: oldSVG.size,
            nodes: newNodes,
        };
        Latex.texNodesPool[key] = newSVG;
        return this.buildDocument(newSVG);
    }
    texToSvg(subtexs) {
        const singleTex = subtexs.join('');
        const svg = this.singleTexToSVG(singleTex);
        this.svgSubTexMap[svg] = subtexs;
        return svg;
    }
    subTexToSVG(subtex) {
        let tex = subtex.trim();
        if (['\\overline', '\\sqrt', '\\sqrt{'].includes(tex) ||
            tex.endsWith('_') ||
            tex.endsWith('^') ||
            tex.endsWith('dot')) {
            tex += '{\\quad}';
        }
        if (tex === '\\substack')
            tex = '\\quad';
        const numLeft = tex.match(/\\left[()[\]|.\\]/g)?.length ?? 0;
        const numRight = tex.match(/\\right[()[\]|.\\]/g)?.length ?? 0;
        if (numLeft !== numRight) {
            tex = tex.replace(/\\left/g, '\\big').replace(/\\right/g, '\\big');
        }
        const bracesLeft = tex.match(/((?<!\\)|(?<=\\\\)){/g)?.length ?? 0;
        const bracesRight = tex.match(/((?<!\\)|(?<=\\\\))}/g)?.length ?? 0;
        if (bracesLeft < bracesRight) {
            tex = '{'.repeat(bracesRight - bracesLeft) + tex;
        }
        else if (bracesRight < bracesLeft) {
            tex += '}'.repeat(bracesLeft - bracesRight);
        }
        const hasArrayBegin = tex.includes('\\begin{array}');
        const hasArrayEnd = tex.includes('\\end{array}');
        if (hasArrayBegin !== hasArrayEnd)
            tex = '';
        return this.singleTexToSVG(tex);
    }
    singleTexToSVG(tex) {
        const src = `${tex}::${JSON.stringify(this.options())}`;
        if (Latex.svgContentsPool[src]) {
            const svg = Latex.svgContentsPool[src];
            return svg;
        }
        const svg = Adaptor.innerHTML(JaxDocument.convert(tex, this.options()));
        if (svg.includes('data-mjx-error')) {
            const errors = svg.match(/data-mjx-error="(.*?)"/);
            if (errors && errors.length > 0) {
                useLogger().error(`Invalid MathJax: ${errors[1]}`);
            }
        }
        Latex.svgContentsPool[src] = svg;
        return svg;
    }
    *tweenTex(value, time, timingFunction) {
        const newSVG = this.texToSvg(this.tex.context.parse(value));
        yield* this.svg(newSVG, time, timingFunction);
        this.svg(this.latexSVG);
    }
}
Latex.svgContentsPool = {};
Latex.texNodesPool = {};
__decorate([
    initial({}),
    signal()
], Latex.prototype, "options", void 0);
__decorate([
    initial(''),
    parser(function (value) {
        const array = typeof value === 'string' ? [value] : value;
        const subtex = array
            .reduce((prev, current) => {
            prev.push(...current.split(/{{(.*?)}}/));
            return prev;
        }, [])
            .map(sub => sub.trim())
            .filter(sub => sub.length > 0);
        return subtex;
    }),
    signal()
], Latex.prototype, "tex", void 0);
__decorate([
    computed()
], Latex.prototype, "latexSVG", null);
__decorate([
    threadable()
], Latex.prototype, "tweenTex", null);
__decorate([
    lazy(() => {
        return parseFloat(window.getComputedStyle(SVGNode.containerElement).fontSize);
    })
], Latex, "containerFontSize", void 0);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGF0ZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL2NvbXBvbmVudHMvTGF0ZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsT0FBTyxFQUtMLE9BQU8sRUFDUCxTQUFTLEdBQ1YsTUFBTSxxQkFBcUIsQ0FBQztBQUM3QixPQUFPLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBQyxNQUFNLG9DQUFvQyxDQUFDO0FBRXBFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUNqRSxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNsRSxPQUFPLEVBQUMsR0FBRyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDOUMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHVDQUF1QyxDQUFDO0FBQ2xFLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNoRCxPQUFPLEVBQUMsR0FBRyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFFL0MsT0FBTyxFQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRSxPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVCLE9BQU8sRUFHTCxHQUFHLElBQUksT0FBTyxHQUdmLE1BQU0sT0FBTyxDQUFDO0FBRWYsTUFBTSxPQUFPLEdBQUcsV0FBVyxFQUFFLENBQUM7QUFDOUIsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFN0IsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUU7SUFDdkMsZ0VBQWdFO0lBQ2hFLFFBQVEsRUFBRSxJQUFJLEdBQUcsQ0FBQyxFQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUMsQ0FBQztJQUMxQyxnRUFBZ0U7SUFDaEUsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLEVBQUMsU0FBUyxF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