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

function makeAtom(text, pos) {
    console.log('making atom ' + text + ' at ' + JSON.stringify(pos));
    const R = 20;

    let atom = canvas.group();
    let dot = atom.circle().radius(R).center(pos.x, pos.y)
        .attr({ stroke: 'none', fill: '#dd7', opacity: .0 });
    let lbl = atom.text(text).center(pos.x, pos.y)
        .attr({ font: '14px "Helvetica Neue", Arial', stroke: '#000' });

    let atomD = molecule.addAtom(text, atom);
    //atom.attr({ 'data-atom-id': atomId });

    atom.on('mouseenter', event => {
        dot.attr({ opacity: .4 });
    });
    atom.on('mouseleave', event => {
        dot.attr({ opacity: .0 });
    });

    atom.click(event => {
        if (event.shiftKey) {
            if (toolbar.active === null || toolbar.active.dataset.type !== 'atom') alert('no change'); // TODO: add a visual bell
            lbl.text(toolbar.active.dataset.value);
            if (lbl.attr('text') !== 'C') lbl.show();   // always show non-carbon atoms
        } else {
            makeBond(atomD, pos, (event.ctrlKey ? 1 : 3));
            if (lbl.text() === 'C') {
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
    
    let bond = canvas.path(
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
    canvas = SVG().addTo('#canvas').size('100%', '100%');
    console.log(canvas);

    canvas.click(event => {
        if (toolbar.active === null) return;
        console.log(event);

        if (event.target === canvas.node) {
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
    });
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
