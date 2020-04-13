/* General Helper Functions */
function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

/* Data Representation */
class Atom {
    constructor(id, label) {
        this.id = id;
        this.label = label;
    }
};

class Molecule {
    // TODO: Add a constructor for InChI string
    constructor() {
        this.atomCount = 0;
        this.atoms = [];
        this.adjacencyList = [];
    }

    addAtom(label) {
        let newAtom = new Atom(this.atomCount++, label);
        this.atoms.push(newAtom);
        this.adjacencyList.push([]);
        return newAtom;
    }

    addBond(atomId1, atomId2) {
        this.adjacencyList[atomId1].push(atomId2);
        this.adjacencyList[atomId2].push(atomId1);
    }

    getAtom(id) {
        return this.atoms[id];
    }

    getAtomNeighbors(id) {
        return this.adjacencyList[id];
    }
};

let molecule = new Molecule();  // TODO: for now, we assume only 1 molecule

/* Drawing Tool */

let canvas = null;
let toolbar = null;

const svgNS = 'http://www.w3.org/2000/svg';

function renderedTextSize(string, font, fontSize) {
    var paper = Raphael(0, 0, 0, 0)
    paper.canvas.style.visibility = 'hidden'
    var el = paper.text(0, 0, string)
    el.attr('font-family', font)
    el.attr('font-size', fontSize)
    var bBox = el.getBBox()
    paper.remove()
    return {
        width: bBox.width,
        height: bBox.height
    }
}

function makeAtom(text, pos) {
    console.log('making atom ' + text + ' at ' + JSON.stringify(pos));
    const R = 20;

    let dot = paper.circle(pos.x, pos.y, R)
        .attr({ stroke: 'none', fill: '#dd7', opacity: .4 });
    let lbl = paper.text(pos.x, pos.y , text)
        .attr({ font: '14px "Helvetica Neue", Arial', stroke: '#000', fill: 'none'});
    let atom = paper.set(dot, lbl);

    let atomD = molecule.addAtom(text, atom);
    //atom.attr({ 'data-atom-id': atomId });

    atom.hover(event => {
        dot.attr({ fill: '#dd7' });
    }, event => {
        dot.attr({ fill: '#fff' });
    });

    atom.click(event => {
        if (event.shiftKey) {
            if (toolbar.active === null || toolbar.active.dataset.type !== 'atom') alert('no change'); // TODO: add a visual bell
            lbl.attr({ text: toolbar.active.dataset.value });
            if (lbl.attr('text') !== 'C') lbl.show();   // always show non-carbon atoms
        } else {
            makeBond(atomD, pos, (event.ctrlKey ? 1 : 3));
            if (lbl.attr('text') === 'C') {
                let deg = molecule.getAtomNeighbors(atomD.id).length;
                console.log(deg);
                if (deg >= 2) lbl.hide();   // hide only if it is an internal atom
            }
        }
    });

    return atomD;
}

function makeBond(atom, pos, dirn) {
    const len = 40;
    let theta, dy, dx;
    if (dirn == 1) {
        theta = Math.PI/6.0;
        dy = -(len * Math.sin(theta)).toFixed(2);
        dx = (len * Math.cos(theta)).toFixed(2);
    } else if (dirn == 3) {
        theta = Math.PI/6.0;
        dy = (len * Math.sin(theta)).toFixed(2);
        dx = (len * Math.cos(theta)).toFixed(2);
    }
    
    let bond = paper.path(
        `M ${pos.x} ${pos.y} l ${dx} ${dy}`
    ).attr({
        'stroke-width': 2,
        'stroke-linecap': 'butt',
        'stroke': 'black',
        'x': pos.x,
        'y': pos.y,
    });

    let atom2 = makeAtom('C', { x: pos.x + parseFloat(dx), y: pos.y + parseFloat(dy) });
    molecule.addBond(atom.id, atom2.id);
}

function initCanvas() {
    canvas = document.querySelector('#canvas');
    paper = Raphael(canvas, 0, 0);

    canvas.addEventListener('click', event => {
        if (toolbar.active === null) return;
        console.log(event);

        if (event.target === canvas.querySelector('svg')) {
            let pos = { x: event.offsetX, y: event.offsetY };
            //let atom = makeAtom(toolbar.active.dataset.value, pos);
            //canvas.appendChild(atom);
            makeAtom(toolbar.active.dataset.value, pos);
        } else {
            //var rect = event.target.getBoundingClientRect();
            //console.log(rect);
            //let pos = { x: rect.x, y: rect.y };
            //let bond = makeBond(pos);
            //canvas.appendChild(bond);
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
    console.clear();    // DEBUG
    initCanvas();
    initToolbar();
});
