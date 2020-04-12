function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

let canvas = null;
let toolbar = null;

const svgNS = 'http://www.w3.org/2000/svg';

function makeAtom(text, pos) {
    var node = document.createElementNS(svgNS, 'g');

    var shape = document.createElementNS(svgNS, 'circle');
    shape.setAttributeNS(null, 'cx', pos.x);
    shape.setAttributeNS(null, 'cy', pos.y);
    shape.setAttributeNS(null, 'r',  15);
    shape.setAttributeNS(null, 'fill', 'white'); 
    node.append(shape);

    var newText = document.createElementNS(svgNS, 'text');
    var textNode = document.createTextNode(text);
    newText.appendChild(textNode);
    newText.setAttributeNS(null, 'x', pos.x-7);
    newText.setAttributeNS(null, 'y', pos.y+7);
    node.append(newText);

    node.classList.add('atom');

    return node;
}

function makeBond(pos) {
    var node = document.createElementNS(svgNS, 'path');

    const len = 20;
    const theta = Math.PI/6.0;
    const dy = (len * Math.sin(theta)).toFixed(2);
    const dx = (len * Math.cos(theta)).toFixed(2);
    node.setAttributeNS(null, 'd',
        `M ${pos.x} ${pos.y} l ${dx} ${dy}`
    );
    node.setAttributeNS(null, 'stroke-width', 2);
    node.setAttributeNS(null, 'stroke-linecap', 'butt');
    node.setAttributeNS(null, 'stroke', 'black');
    node.setAttributeNS(null, 'x', pos.x);
    node.setAttributeNS(null, 'y', pos.y);

    node.classList.add('bond');
    console.log(node);

    return node;
}

function initCanvas() {
    canvas = document.querySelector('#canvas');

    canvas.addEventListener('click', event => {
        if (toolbar.active === null) return;
        console.log(event);


        if (event.target === canvas) {
            let pos = { x: event.offsetX, y: event.offsetY };
            let atom = makeAtom(toolbar.active.dataset.value, pos);
            canvas.appendChild(atom);
        } else {
            var rect = event.target.getBoundingClientRect();
            console.log(rect);
            let pos = { x: rect.x, y: rect.y };
            let bond = makeBond(pos);
            canvas.appendChild(bond);
        }

    }, false);
}

function initToolbar() {
    toolbar = {
        el: document.querySelector('.toolbar'),
        active: null,
    };

    toolbar.el.addEventListener('click', event => {
        if (!event.target.classList.contains('button'))
            return;

        if (toolbar.active !== null)
            toolbar.active.classList.remove('selected');
        toolbar.active = event.target;
        toolbar.active.classList.add('selected');
    }, false);
}

docReady(function() {
    initCanvas();
    initToolbar();
});
